// GHOSTLIGHT — shared tuning constants for the stealth game.
// One file, one job: every number the other modules need lives here.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 17;
export const HUD_H = 40;
export const W = COLS * TILE; // 1280
export const H = HUD_H + ROWS * TILE; // 720

// Player movement, pixels per second.
export const PLAYER_WALK_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 100;

// How far a guard can see, and how wide its cone is.
export const GUARD_VIEW_RANGE = 190;
export const GUARD_VIEW_HALF_ANGLE = 0.62; // ~35 degrees each side
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_INVESTIGATE_SPEED = 95;

// Detection: how fast the guard's suspicion meter fills (per second).
export const DETECT_BASE_RATE = 55;
export const DETECT_CLOSE_BONUS = 55; // extra when the player is very close
export const DETECT_SNEAK_MULT = 0.5;
export const DETECT_SHADOW_MULT = 0.35;
export const DETECT_RUN_MULT = 1.5;
export const DETECT_DECAY_RATE = 30;
export const SUSPICIOUS_AT = 35;
export const CHASE_AT = 100;

// How far a running player's footsteps carry, and how long a guard
// keeps chasing after losing sight (seconds).
export const NOISE_RADIUS = 170;
export const CHASE_MEMORY_SECONDS = 3.0;
export const INVESTIGATE_WAIT_SECONDS = 2.0;
export const PATROL_PAUSE_SECONDS = 0.9;

// Colours.
export const COLORS = {
  floor: '#1c1a26',
  floorAlt: '#211e2e',
  wall: '#3a3550',
  wallTop: '#4a4468',
  crate: '#6b5433',
  crateTop: '#8a6f42',
  shadow: '#101d16',
  shadowEdge: '#1e4d33',
  exit: '#39d98a',
  exitGlow: '#7dffb0',
  artifact: '#ffd166',
  coin: '#e8c15a',
  player: '#7dd3fc',
  playerSneak: '#38bdf8',
  guard: '#f87171',
  guardCone: 'rgba(250, 204, 21, 0.20)',
  guardConeAlert: 'rgba(248, 113, 113, 0.30)',
  guardConeSuspicious: 'rgba(251, 146, 60, 0.25)',
  hudBg: 'rgba(10, 9, 18, 0.92)',
  text: '#e7e5f4',
  textDim: '#9b98b8',
  danger: '#f87171',
  warn: '#fbbf24',
  ok: '#39d98a',
};
