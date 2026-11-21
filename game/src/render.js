// render.js — draws everything the player sees: the manor floor, walls and
// cover, the guards and their vision cones, the thief, the relics and the exit,
// plus the HUD, the title screen and the end screens. All canvas, no images.

import { TILE, VIEW_W, VIEW_H, PALETTE } from './config.js';
import { conePolygon } from './vision.js';
import { isCover } from './levels.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawTiles(ctx, tiles, exit, exitOpen) {
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const t = tiles[y][x];
      if (t === '#') {
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = PALETTE.wallTop;
        ctx.fillRect(px, py, TILE, 6);
        continue;
      }
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      ctx.fillRect(px, py, TILE, TILE);
      if (t === '~') {
        ctx.fillStyle = PALETTE.shadowFloor;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      } else if (t === 'B') {
        ctx.fillStyle = PALETTE.bush;
        ctx.beginPath();
        ctx.arc(px + 13, py + 15, 12, 0, Math.PI * 2);
        ctx.arc(px + 27, py + 13, 11, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 27, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.bushLeaf;
        ctx.beginPath();
        ctx.arc(px + 15, py + 14, 5, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 24, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 'C') {
        ctx.fillStyle = PALETTE.crate;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = PALETTE.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + TILE - 4, py + TILE - 4);
        ctx.moveTo(px + TILE - 4, py + 4); ctx.lineTo(px + 4, py + TILE - 4);
        ctx.stroke();
      }
    }
  }
  // The exit door: locked red until every relic is taken, then glowing green.
  const ex = exit.x * TILE;
  const ey = exit.y * TILE;
  ctx.save();
  ctx.shadowColor = exitOpen ? PALETTE.exit : '#ff5d5d';
  ctx.shadowBlur = exitOpen ? 22 : 6;
  ctx.fillStyle = exitOpen ? PALETTE.exit : '#a33';
  roundRect(ctx, ex - 16, ey - 16, 32, 32, 6);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0b0e1a';
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(exitOpen ? 'EXIT' : 'LOCK', ex, ey + 1);
}

export function drawCones(ctx, tiles, guards) {
  for (const g of guards) {
    const poly = conePolygon(tiles, g.x, g.y, g.angle);
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fillStyle = g.state === 'alert' ? PALETTE.coneAlert : PALETTE.cone;
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawRelics(ctx, relics, time) {
  for (const r of relics) {
    if (r.taken) continue;
    const cx = r.x * TILE;
    const cy = r.y * TILE + Math.sin(time * 2.4 + r.x) * 3;
    ctx.save();
    ctx.shadowColor = PALETTE.relic;
    ctx.shadowBlur = 14;
    ctx.fillStyle = PALETTE.relic;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 11);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#7a5b00';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGuard(ctx, g, time) {
  // Body: a watchman in a red coat, facing where he looks.
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angle);
  ctx.fillStyle = g.state === 'alert' ? PALETTE.guard : PALETTE.guardCalm;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0e1a';
  ctx.beginPath();
  ctx.arc(5, -5, 2.5, 0, Math.PI * 2);
  ctx.arc(5, 5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // The lantern he carries ahead of him.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(17, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Suspicion meter above his head, and ? / ! when he is on to you.
  const w = 30;
  const bx = g.x - w / 2;
  const by = g.y - 24;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx, by, w, 5);
  ctx.fillStyle = g.suspicion > 0.66 ? '#ff5d5d' : '#ffd75e';
  ctx.fillRect(bx, by, w * g.suspicion, 5);
  if (g.state === 'alert') {
    ctx.fillStyle = '#ff5d5d';
    ctx.font = 'bold 20px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 30);
  } else if (g.suspicion > 0.45) {
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 18px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 30);
  }
}

export function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 12;
  ctx.fillStyle = player.sneaking ? PALETTE.playerSneak : PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Hood point and eyes, so the thief reads at a glance.
  ctx.fillStyle = '#0b2a3a';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.radius - 3);
  ctx.lineTo(player.x - 6, player.y - 2);
  ctx.lineTo(player.x + 6, player.y - 2);
  ctx.closePath();
  ctx.fill();
  if (player.sneaking) {
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 26);
  }
  // Noise ring while walking: what the guards can hear.
  if (player.noiseRadius > 20) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.noiseRadius * (0.85 + 0.15 * Math.sin(time * 6)), 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawCoins(ctx, coins) {
  for (const c of coins) {
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87f00';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,94,0.5)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(5, 7, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.level.name, 12, 18);
  ctx.textAlign = 'center';
  const relics = game.relics.filter((r) => r.taken).length;
  ctx.fillStyle = PALETTE.relic;
  ctx.fillText(`◆ ${relics} / ${game.relics.length} moonstones`, VIEW_W / 2, 18);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '13px Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`coins: ${game.coins}   time ${Math.floor(game.time)}s   level ${game.levelIndex + 1}/3`, VIEW_W - 12, 18);
  // Alarm banner while any guard is hunting.
  if (game.guards.some((g) => g.state === 'alert')) {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.85)';
    ctx.fillRect(VIEW_W / 2 - 90, 40, 180, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED — HIDE !', VIEW_W / 2, 53);
  }
  // Objective line under the bar.
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(game.level.brief, 12, VIEW_H - 12);
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(5, 7, 18, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const glow = 0.6 + 0.4 * Math.sin(time * 1.6);
  ctx.save();
  ctx.shadowColor = '#ffd75e';
  ctx.shadowBlur = 26 * glow;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('MOONLIT MANOR', VIEW_W / 2, 180);
  ctx.restore();
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('a stealth game — steal the moonstones, reach the door, stay unseen', VIEW_W / 2, 226);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('WASD / arrows — move      Shift — sneak      Click — toss a coin to distract a guard', VIEW_W / 2, 300);
  ctx.fillText('Yellow cones are a guard’s sight. Bushes and shadow hide you. Running is loud.', VIEW_W / 2, 328);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 18px Verdana, sans-serif';
  ctx.fillText('— press Enter or click to begin —', VIEW_W / 2, 400);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText('3 levels · original game · no network, no tracking', VIEW_W / 2, 470);
}

export function drawEnd(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 18, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 220);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '18px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 280 + i * 34));
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('press Enter to play again', VIEW_W / 2, 420);
}
