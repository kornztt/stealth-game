// GHOSTLIGHT — the player: movement, sneaking, hiding, loot.
// One file, one job: everything about the thief.

import { TILE, HUD_H, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED, NOISE_RADIUS } from './config.js';

export class Player {
  constructor(spawn) {
    this.x = (spawn.x + 0.5) * TILE;
    this.y = HUD_H + (spawn.y + 0.5) * TILE;
    this.radius = 13;
    this.sneaking = false;
    this.running = false;
    this.inShadow = false;
    this.stepPhase = 0;
    this.stepTimer = 0;
    this.facing = 0;
  }

  update(dt, input, level, onNoise) {
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.sneaking = !!input.sneak;
    const moving = mx !== 0 || my !== 0;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    this.running = moving && !this.sneaking;
    if (moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      this.facing = Math.atan2(my, mx);
      const nx = this.x + mx * speed * dt;
      const ny = this.y + my * speed * dt;
      if (!level.blocksCircle(nx, this.y, this.radius)) this.x = nx;
      if (!level.blocksCircle(this.x, ny, this.radius)) this.y = ny;
      // Footsteps: walking is quiet, running carries.
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.55 : 0.38;
        this.stepPhase += 1;
        if (this.running) onNoise(this.x, this.y, NOISE_RADIUS);
      }
    }
    // Standing in a shadow bush makes the player much harder to spot.
    this.inShadow = level.isShadow(this.x, this.y);
  }

  /** Tile coordinates the player is standing on. */
  tile() {
    return { x: Math.floor(this.x / TILE), y: Math.floor((this.y - HUD_H) / TILE) };
  }
}
