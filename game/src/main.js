// GHOSTLIGHT — the game itself: loop, states, collisions, scoring.
// One file, one job: wires the modules together and runs the game.

import { TILE, COLS, ROWS, HUD_H, W, H } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { Guard } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';

/** Collision and lookup helpers for one parsed level. */
class LevelView {
  constructor(parsed) {
    this.parsed = parsed;
  }

  tileAt(x, y) {
    return { x: Math.floor(x / TILE), y: Math.floor((y - HUD_H) / TILE) };
  }

  inBounds(tx, ty) {
    return tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS;
  }

  /** Point blocked by a wall or a crate (for movement and sight). */
  blocks(x, y) {
    const { x: tx, y: ty } = this.tileAt(x, y);
    if (!this.inBounds(tx, ty)) return true;
    return this.parsed.walls.has(`${tx},${ty}`) || this.parsed.crates.has(`${tx},${ty}`);
  }

  blocksSight(x, y) {
    return this.blocks(x, y);
  }

  /** Circle (player) blocked by a wall or crate tile. */
  blocksCircle(x, y, r) {
    const x0 = Math.floor((x - r) / TILE);
    const x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - HUD_H - r) / TILE);
    const y1 = Math.floor((y - HUD_H + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) return true;
        if (this.parsed.walls.has(`${tx},${ty}`) || this.parsed.crates.has(`${tx},${ty}`)) {
          const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
          const cy = Math.max(HUD_H + ty * TILE, Math.min(y, HUD_H + (ty + 1) * TILE));
          if (Math.hypot(x - cx, y - cy) < r) return true;
        }
      }
    }
    return false;
  }

  isShadow(x, y) {
    const { x: tx, y: ty } = this.tileAt(x, y);
    return this.parsed.shadows.has(`${tx},${ty}`);
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sound = new SoundBank();
    this.screen = 'title';
    this.levelIndex = 0;
    this.time = 0; // total play time, seconds
    this.levelTime = 0;
    this.coinsTotal = 0;
    this.best = this.loadBest();
    this.input = { left: false, right: false, up: false, down: false, sneak: false };
    this.lastStepPhase = 0;
    this.prevGuardStates = [];
    this.exitAnnounced = false;
    this.levelDoneText = '';
    this.winText = '';
    this.loadLevel(0);
    this.screen = 'title';
    this.bindInput();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loadBest() {
    try {
      const v = Number(localStorage.getItem('ghostlight-best'));
      return Number.isFinite(v) && v > 0 ? v : null;
    } catch {
      return null;
    }
  }

  saveBest() {
    try {
      if (this.best === null || this.time < this.best) {
        this.best = this.time;
        localStorage.setItem('ghostlight-best', String(this.time));
      }
    } catch {
      // storage unavailable — the game still plays
    }
  }

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    const parsed = parseLevel(def);
    this.level = new LevelView(parsed);
    this.levelDef = def;
    this.parsed = parsed;
    this.player = new Player(parsed.player);
    this.guards = def.guards.map((g) => new Guard(g));
    this.prevGuardStates = this.guards.map((g) => g.state);
    this.levelTime = 0;
    this.exitOpen = false;
    this.exitAnnounced = false;
    // NOTE: loadLevel does not touch this.screen — callers set it
    // (title stays on the title screen until Enter is pressed).
  }

  bindInput() {
    const keys = {
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ShiftLeft: 'sneak', ShiftRight: 'sneak',
    };
    window.addEventListener('keydown', (e) => {
      if (e.code in keys) {
        this.input[keys[e.code]] = true;
        e.preventDefault();
      }
      this.sound.ensure();
      if (e.code === 'Enter') this.onEnter();
      if (e.code === 'KeyR' && this.screen === 'caught') { this.loadLevel(this.levelIndex); this.screen = 'playing'; }
      if (e.code === 'KeyM') this.sound.enabled = !this.sound.enabled;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code in keys) this.input[keys[e.code]] = false;
    });
    this.canvas.addEventListener('mousedown', () => this.sound.ensure());
  }

  onEnter() {
    if (this.screen === 'title') {
      this.time = 0;
      this.coinsTotal = 0;
      this.loadLevel(0);
      this.screen = 'playing';
      this.sound.startMusic();
    } else if (this.screen === 'levelDone') {
      if (this.levelIndex + 1 < LEVELS.length) { this.loadLevel(this.levelIndex + 1); this.screen = 'playing'; }
      else this.finishGame();
    } else if (this.screen === 'win') {
      this.screen = 'title';
    }
  }

  finishGame() {
    this.saveBest();
    this.winText = `All three artifacts stolen in ${this.fmtTime(this.time)} — ${this.coinsTotal} coins pocketed. Best time: ${this.best ? this.fmtTime(this.best) : '—'}.`;
    this.screen = 'win';
    this.sound.win();
  }

  fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.screen === 'playing') this.update(dt);
    this.renderer.draw(this.renderState());
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.time += dt;
    this.levelTime += dt;
    const player = this.player;
    const prevPhase = player.stepPhase;
    player.update(dt, this.input, this.level, (x, y) => {
      for (const g of this.guards) g.hearNoise(x, y);
    });
    if (player.stepPhase !== prevPhase) this.sound.footstep(player.sneaking);

    const playerState = {
      sneaking: player.sneaking,
      running: player.running,
      inShadow: player.inShadow,
    };
    this.guards.forEach((g, i) => {
      g.update(dt, player, playerState, this.level);
      if (this.prevGuardStates[i] !== g.state) {
        if (g.state === 'suspicious') this.sound.suspicious();
        if (g.state === 'chase') this.sound.alarm();
        this.prevGuardStates[i] = g.state;
      }
      if (g.catches(player)) {
        this.screen = 'caught';
        this.sound.caught();
        this.sound.stopMusic();
      }
    });
    if (this.screen !== 'playing') return;

    // pickups
    for (const a of this.parsed.artifacts) {
      if (!a.taken && Math.hypot(a.x * TILE + TILE / 2 - player.x, HUD_H + a.y * TILE + TILE / 2 - player.y) < 28) {
        a.taken = true;
        this.sound.pickup();
      }
    }
    for (const c of this.parsed.coins) {
      if (!c.taken && Math.hypot(c.x * TILE + TILE / 2 - player.x, HUD_H + c.y * TILE + TILE / 2 - player.y) < 26) {
        c.taken = true;
        this.coinsTotal += 1;
        this.sound.coin();
      }
    }

    const got = this.parsed.artifacts.filter((a) => a.taken).length;
    if (!this.exitOpen && got === this.parsed.artifacts.length) {
      this.exitOpen = true;
      if (!this.exitAnnounced) {
        this.exitAnnounced = true;
        this.sound.exitOpen();
      }
    }
    if (this.exitOpen) {
      const ex = this.parsed.exit;
      if (Math.hypot(ex.x * TILE + TILE / 2 - player.x, HUD_H + ex.y * TILE + TILE / 2 - player.y) < 30) {
        if (this.levelIndex + 1 < LEVELS.length) {
          this.levelDoneText = `${this.levelDef.name} cleared in ${this.fmtTime(this.levelTime)} — ${got}/${this.parsed.artifacts.length} artifacts, ${this.coinsTotal} coins so far.`;
          this.screen = 'levelDone';
          this.sound.win();
        } else {
          this.finishGame();
        }
      }
    }
  }

  renderState() {
    const got = this.parsed.artifacts.filter((a) => a.taken).length;
    const coinsGot = this.parsed.coins.filter((c) => c.taken).length;
    return {
      level: this.parsed,
      levelName: this.levelDef.name,
      player: this.player,
      guards: this.guards,
      artifacts: this.parsed.artifacts,
      coins: this.parsed.coins,
      exit: this.parsed.exit,
      exitOpen: this.exitOpen,
      screen: this.screen,
      time: this.time,
      artifactsGot: got,
      artifactsTotal: this.parsed.artifacts.length,
      coinsGot,
      timeText: this.fmtTime(this.time),
      bestText: this.best ? this.fmtTime(this.best) : null,
      maxAlert: Math.max(0, ...this.guards.map((g) => g.alert)),
      levelDoneText: this.levelDoneText,
      winText: this.winText,
    };
  }
}

// Boot the game and expose a small debug hook for play-testing.
const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__stealth = {
  game,
  start() {
    game.sound.ensure();
    game.time = 0;
    game.coinsTotal = 0;
    game.loadLevel(0);
    game.sound.startMusic();
  },
  loadLevel(i) {
    game.loadLevel(i);
    game.screen = 'playing';
  },
  teleport(x, y) {
    game.player.x = x;
    game.player.y = y;
  },
  setGuard(i, x, y, angle) {
    const g = game.guards[i];
    if (!g) return false;
    g.x = x;
    g.y = y;
    if (angle !== undefined) g.angle = angle;
    return true;
  },
  // Park a guard on one spot facing a fixed direction (it stops patrolling).
  pinGuard(i, x, y, angle) {
    const g = game.guards[i];
    if (!g) return false;
    g.x = x;
    g.y = y;
    g.angle = angle;
    g.path = [{ x, y }];
    g.wpIndex = 0;
    g.pauseTimer = 0;
    return true;
  },
  collectAll() {
    for (const a of game.parsed.artifacts) a.taken = true;
  },
  state() {
    return {
      screen: game.screen,
      level: game.levelIndex,
      player: { x: game.player.x, y: game.player.y, sneaking: game.player.sneaking, inShadow: game.player.inShadow },
      guards: game.guards.map((g) => ({ x: g.x, y: g.y, angle: g.angle, state: g.state, alert: Math.round(g.alert) })),
      artifactsGot: game.parsed.artifacts.filter((a) => a.taken).length,
      artifactsTotal: game.parsed.artifacts.length,
      exitOpen: game.exitOpen,
      maxAlert: Math.max(0, ...game.guards.map((g) => g.alert)),
    };
  },
};
