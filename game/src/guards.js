// GHOSTLIGHT — guard patrols, vision cones and alert states.
// One file, one job: everything a guard does and sees.
// Alert states: 'patrol' -> 'suspicious' (investigate a glimpse)
// -> 'chase' (seen clearly, pursue). A guard that loses the player
// investigates the last seen spot, then walks back to its patrol.

import {
  TILE, HUD_H, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
  GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_INVESTIGATE_SPEED,
  DETECT_BASE_RATE, DETECT_CLOSE_BONUS, DETECT_SNEAK_MULT,
  DETECT_SHADOW_MULT, DETECT_RUN_MULT, DETECT_DECAY_RATE,
  SUSPICIOUS_AT, CHASE_AT, CHASE_MEMORY_SECONDS,
  INVESTIGATE_WAIT_SECONDS, PATROL_PAUSE_SECONDS, NOISE_RADIUS,
} from './config.js';

export class Guard {
  constructor(def) {
    const [sx, sy] = def.spawn;
    this.x = (sx + 0.5) * TILE;
    this.y = HUD_H + (sy + 0.5) * TILE;
    this.path = def.path.map(([x, y]) => ({ x: (x + 0.5) * TILE, y: HUD_H + (y + 0.5) * TILE }));
    this.wpIndex = 0;
    this.angle = 0; // facing, radians
    this.state = 'patrol';
    this.alert = 0; // 0..100 suspicion meter
    this.pauseTimer = 0;
    this.waitTimer = 0;
    this.lastSeen = null; // {x, y} where the player was last glimpsed
    this.lostTimer = 0;
    this.returning = false;
    this.heard = null; // {x, y} of a noise to check
  }

  /** True when the player is inside the cone and no wall/crate blocks sight. */
  canSee(player, level, playerState) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD_VIEW_RANGE) return false;
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > GUARD_VIEW_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, player.x, player.y, level);
  }

  /** How fast suspicion grows while the player is visible (per second). */
  detectRate(player, dist, playerState) {
    let rate = DETECT_BASE_RATE;
    if (dist < 90) rate += DETECT_CLOSE_BONUS * (1 - dist / 90);
    if (playerState.sneaking) rate *= DETECT_SNEAK_MULT;
    if (playerState.inShadow) rate *= DETECT_SHADOW_MULT;
    if (playerState.running) rate *= DETECT_RUN_MULT;
    return rate;
  }

  update(dt, player, playerState, level) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const sees = this.canSee(player, level, playerState);

    if (sees) {
      this.alert = Math.min(CHASE_AT, this.alert + this.detectRate(player, dist, playerState) * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTimer = 0;
    } else {
      this.alert = Math.max(0, this.alert - DETECT_DECAY_RATE * dt);
      if (this.state === 'chase') this.lostTimer += dt;
    }

    if (this.alert >= CHASE_AT) this.state = 'chase';
    else if (this.alert >= SUSPICIOUS_AT) {
      if (this.state === 'patrol') this.state = 'suspicious';
    } else if (this.state !== 'patrol' && this.alert < SUSPICIOUS_AT * 0.5) {
      this.state = 'patrol';
      this.returning = true;
    }

    if (this.state === 'patrol') this.patrol(dt, level);
    else if (this.state === 'suspicious') this.investigate(dt, level);
    else this.chase(dt, player, level);

    // A loud noise pulls a patrolling guard over to listen.
    if (this.heard && this.state === 'patrol') {
      this.lastSeen = this.heard;
      this.heard = null;
      this.state = 'suspicious';
    }
  }

  patrol(dt, level) {
    if (this.returning) {
      // Walk back to the nearest patrol waypoint, then resume the route.
      let best = 0;
      let bestD = Infinity;
      this.path.forEach((wp, i) => {
        const d = Math.hypot(wp.x - this.x, wp.y - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      this.wpIndex = best;
      this.returning = false;
    }
    const target = this.path[this.wpIndex];
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    if (this.moveToward(target, GUARD_PATROL_SPEED, dt, level)) {
      this.wpIndex = (this.wpIndex + 1) % this.path.length;
      this.pauseTimer = PATROL_PAUSE_SECONDS;
    }
  }

  investigate(dt, level) {
    if (!this.lastSeen) { this.state = 'patrol'; return; }
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      this.angle += dt * 1.6; // look around while waiting
      if (this.waitTimer <= 0) this.state = 'patrol';
      return;
    }
    if (this.moveToward(this.lastSeen, GUARD_INVESTIGATE_SPEED, dt, level)) {
      this.waitTimer = INVESTIGATE_WAIT_SECONDS;
    }
  }

  chase(dt, player, level) {
    if (this.lostTimer > CHASE_MEMORY_SECONDS) {
      this.state = 'suspicious'; // lost them — check where they were last seen
      this.lostTimer = 0;
      return;
    }
    this.moveToward(player, GUARD_CHASE_SPEED, dt, level);
  }

  /** Step toward a point, sliding along walls. Returns true on arrival. */
  moveToward(target, speed, dt, level) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    const step = Math.min(speed * dt, dist);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.angle = Math.atan2(dy, dx);
    if (!level.blocks(nx, this.y)) this.x = nx;
    if (!level.blocks(this.x, ny)) this.y = ny;
    return Math.hypot(target.x - this.x, target.y - this.y) < 6;
  }

  /** True when this guard is close enough to catch the player. */
  catches(player) {
    return this.state === 'chase' && Math.hypot(player.x - this.x, player.y - this.y) < 26;
  }

  /** A noise at (x, y): patrolling guards within earshot turn to listen. */
  hearNoise(x, y) {
    if (this.state === 'patrol' && Math.hypot(x - this.x, y - this.y) < NOISE_RADIUS) {
      this.heard = { x, y };
    }
  }
}

/** Step along the segment in small hops; walls and crates block sight. */
export function hasLineOfSight(x0, y0, x1, y1, level) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (level.blocksSight(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}
