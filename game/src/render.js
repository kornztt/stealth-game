// GHOSTLIGHT — everything drawn on the canvas.
// One file, one job: the museum, the guards and their cones, the
// player, the HUD and the title / caught / win screens.

import { TILE, COLS, ROWS, HUD_H, W, H, COLORS, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './config.js';

function tileXY(x, y) {
  return { px: x * TILE, py: HUD_H + y * TILE };
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    this.drawFloor(state.level);
    this.drawExit(state);
    this.drawArtifacts(state);
    this.drawCoins(state);
    this.drawShadows(state.level);
    this.drawWallsAndCrates(state.level);
    for (const g of state.guards) this.drawCone(ctx, g);
    for (const g of state.guards) this.drawGuard(ctx, g);
    this.drawPlayer(ctx, state.player);
    this.drawHud(state);
    if (state.screen !== 'playing') this.drawScreen(state);
  }

  drawFloor(level) {
    const ctx = this.ctx;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const { px, py } = tileXY(x, y);
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
    // faint carpet runner down the middle of the open halls
    ctx.fillStyle = 'rgba(120, 40, 60, 0.12)';
    ctx.fillRect(0, HUD_H + 8 * TILE, W, TILE);
  }

  drawWallsAndCrates(level) {
    const ctx = this.ctx;
    for (const key of level.walls) {
      const [x, y] = key.split(',').map(Number);
      const { px, py } = tileXY(x, y);
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(px, py, TILE, 5);
    }
    for (const key of level.crates) {
      const [x, y] = key.split(',').map(Number);
      const { px, py } = tileXY(x, y);
      ctx.fillStyle = COLORS.crate;
      ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = COLORS.crateTop;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.beginPath();
      ctx.moveTo(px + 3, py + 3);
      ctx.lineTo(px + TILE - 3, py + TILE - 3);
      ctx.moveTo(px + TILE - 3, py + 3);
      ctx.lineTo(px + 3, py + TILE - 3);
      ctx.stroke();
    }
  }

  drawShadows(level) {
    const ctx = this.ctx;
    for (const key of level.shadows) {
      const [x, y] = key.split(',').map(Number);
      const { px, py } = tileXY(x, y);
      ctx.fillStyle = COLORS.shadow;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = COLORS.shadowEdge;
      for (let i = 0; i < 7; i++) {
        const ox = 6 + ((x * 13 + y * 7 + i * 11) % 28);
        const oy = 6 + ((x * 5 + y * 17 + i * 7) % 28);
        ctx.beginPath();
        ctx.arc(px + ox, py + oy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawArtifacts(state) {
    const ctx = this.ctx;
    for (const a of state.artifacts) {
      if (a.taken) continue;
      const cx = (a.x + 0.5) * TILE;
      const cy = HUD_H + (a.y + 0.5) * TILE;
      const pulse = 0.6 + 0.4 * Math.sin(state.time * 3 + a.x);
      ctx.save();
      ctx.shadowColor = COLORS.artifact;
      ctx.shadowBlur = 14 * pulse;
      ctx.fillStyle = COLORS.artifact;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx + 9, cy);
      ctx.lineTo(cx, cy + 11);
      ctx.lineTo(cx - 9, cy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawCoins(state) {
    const ctx = this.ctx;
    for (const c of state.coins) {
      if (c.taken) continue;
      const cx = (c.x + 0.5) * TILE;
      const cy = HUD_H + (c.y + 0.5) * TILE;
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6d1f';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawExit(state) {
    const ctx = this.ctx;
    const ex = state.exit;
    const cx = (ex.x + 0.5) * TILE;
    const cy = HUD_H + (ex.y + 0.5) * TILE;
    const open = state.exitOpen;
    ctx.save();
    if (open) {
      ctx.shadowColor = COLORS.exitGlow;
      ctx.shadowBlur = 18 + 8 * Math.sin(state.time * 4);
    }
    ctx.fillStyle = open ? COLORS.exitGlow : COLORS.exit;
    ctx.fillRect(cx - 16, cy - 16, 32, 32);
    ctx.restore();
    ctx.fillStyle = '#0b1f14';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT' : 'LOCK', cx, cy);
  }

  drawCone(ctx, g) {
    const gy = g.y;
    const color = g.state === 'chase'
      ? COLORS.guardConeAlert
      : g.state === 'suspicious'
        ? COLORS.guardConeSuspicious
        : COLORS.guardCone;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(g.x, gy);
    ctx.arc(g.x, gy, GUARD_VIEW_RANGE, g.angle - GUARD_VIEW_HALF_ANGLE, g.angle + GUARD_VIEW_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
  }

  drawGuard(ctx, g) {
    const gy = g.y;
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, gy, 13, 0, Math.PI * 2);
    ctx.fill();
    // facing tick
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, gy);
    ctx.lineTo(g.x + Math.cos(g.angle) * 17, gy + Math.sin(g.angle) * 17);
    ctx.stroke();
    // alert mark
    if (g.state !== 'patrol') {
      ctx.fillStyle = g.state === 'chase' ? '#ff4444' : '#fb923c';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, gy - 16);
    }
    // suspicion meter arc
    if (g.alert > 2) {
      ctx.strokeStyle = g.alert >= 100 ? '#ff4444' : '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, gy, 18, -Math.PI / 2, -Math.PI / 2 + (g.alert / 100) * Math.PI * 2);
      ctx.stroke();
    }
  }

  drawPlayer(ctx, player) {
    const py = player.y;
    ctx.save();
    if (player.inShadow) ctx.globalAlpha = 0.55; // hidden in the bushes
    ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, py, player.sneaking ? 11 : 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, py);
    ctx.lineTo(player.x + Math.cos(player.facing) * 15, py + Math.sin(player.facing) * 15);
    ctx.stroke();
    ctx.restore();
    if (player.sneaking) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('sneaking', player.x, py + 24);
    }
  }

  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.levelName, 14, HUD_H / 2);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = COLORS.artifact;
    ctx.fillText(`◆ ${state.artifactsGot}/${state.artifactsTotal}`, 330, HUD_H / 2);
    ctx.fillStyle = COLORS.coin;
    ctx.fillText(`● ${state.coinsGot}`, 420, HUD_H / 2);
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`⏱ ${state.timeText}`, 500, HUD_H / 2);
    if (state.bestText) {
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText(`best ${state.bestText}`, 600, HUD_H / 2);
    }
    // alert meter: the highest guard suspicion
    const alert = state.maxAlert;
    const bx = 900;
    const bw = 260;
    ctx.fillStyle = '#26233a';
    ctx.fillRect(bx, 12, bw, 16);
    ctx.fillStyle = alert >= 100 ? COLORS.danger : alert >= 35 ? COLORS.warn : COLORS.ok;
    ctx.fillRect(bx, 12, (bw * alert) / 100, 16);
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(alert >= 100 ? 'SPOTTED!' : alert >= 35 ? 'SUSPICIOUS' : 'UNSEEN', bx + 8, HUD_H / 2 + 1);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('Shift: sneak', W - 14, HUD_H / 2);
  }

  drawScreen(state) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8, 7, 16, 0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (state.screen === 'title') {
      ctx.fillStyle = COLORS.artifact;
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('GHOSTLIGHT', W / 2, 220);
      ctx.fillStyle = COLORS.text;
      ctx.font = '22px sans-serif';
      ctx.fillText('A museum heist in the dark — steal all three artifacts,', W / 2, 300);
      ctx.fillText('slip past the guards, and reach the exit unseen.', W / 2, 332);
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '17px sans-serif';
      ctx.fillText('WASD / arrows to move · hold Shift to sneak · hide in the bushes', W / 2, 400);
      ctx.fillText('Running is loud — guards hear footsteps. Collect coins for score.', W / 2, 428);
      ctx.fillStyle = COLORS.exit;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Press ENTER to begin', W / 2, 500);
    } else if (state.screen === 'caught') {
      ctx.fillStyle = COLORS.danger;
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('CAUGHT!', W / 2, 280);
      ctx.fillStyle = COLORS.text;
      ctx.font = '20px sans-serif';
      ctx.fillText('A guard spotted you. The museum keeps its secrets — this time.', W / 2, 350);
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '18px sans-serif';
      ctx.fillText('Press R to retry the level · ENTER for the title screen', W / 2, 410);
    } else if (state.screen === 'levelDone') {
      ctx.fillStyle = COLORS.exit;
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText('CLEAN GETAWAY', W / 2, 270);
      ctx.fillStyle = COLORS.text;
      ctx.font = '20px sans-serif';
      ctx.fillText(state.levelDoneText, W / 2, 340);
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '18px sans-serif';
      ctx.fillText('Press ENTER for the next level', W / 2, 400);
    } else if (state.screen === 'win') {
      ctx.fillStyle = COLORS.artifact;
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('THE VAULT IS YOURS', W / 2, 260);
      ctx.fillStyle = COLORS.text;
      ctx.font = '20px sans-serif';
      ctx.fillText(state.winText, W / 2, 330);
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '18px sans-serif';
      ctx.fillText('Press ENTER to play again', W / 2, 390);
    }
  }
}
