import { COLS, ROWS, TILE_SIZE, tileCenter } from './levels.js';

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function renderGame(ctx, state) {
  const { level, player, guards, soundWaves, decoys, relicCollected, mouse, time } = state;
  const W = COLS * TILE_SIZE;
  const H = ROWS * TILE_SIZE;

  ctx.clearRect(0, 0, W, H);

  // 1. Floor tiles, shadow alcoves, exit pad
  for (let ty = 0; ty < ROWS; ty++) {
    const row = level.grid[ty];
    for (let tx = 0; tx < COLS; tx++) {
      const ch = row[tx];
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;

      if (ch === '#') continue;

      const checker = (tx + ty) % 2 === 0;
      ctx.fillStyle = checker ? '#172136' : '#141d30';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // Subtle floor tile grout
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      if (ch === 'S') {
        ctx.fillStyle = '#090e1b';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = 'rgba(99, 145, 255, 0.28)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.setLineDash([]);
      } else if (ch === 'E') {
        const pulse = 0.65 + 0.35 * Math.sin(time * 4.5);
        ctx.fillStyle = relicCollected
          ? `rgba(46, 213, 115, ${0.18 + 0.14 * pulse})`
          : 'rgba(246, 185, 59, 0.14)';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = relicCollected ? '#2ed573' : '#f6b93b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        ctx.fillStyle = relicCollected ? '#7bed9f' : '#f6b93b';
        ctx.font = 'bold 10px ui-sans-serif, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EXIT', x + TILE_SIZE * 0.5, y + TILE_SIZE * 0.5);
      }
    }
  }

  // 2. Guard patrol path breadcrumb hints
  for (const g of guards) {
    if (g.waypoints.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(g.waypoints[0].x, g.waypoints[0].y);
    for (let i = 1; i < g.waypoints.length; i++) {
      ctx.lineTo(g.waypoints[i].x, g.waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Raycasted guard vision cones (drawn under cover blocks & walls for clean overlap)
  for (const g of guards) {
    if (!g.visionPoly || g.visionPoly.length < 3) continue;
    const grad = ctx.createRadialGradient(g.x, g.y, 8, g.x, g.y, g.range * 1.05);
    let edgeColor = 'rgba(250, 204, 21, 0.58)';
    if (g.state === 'ALERT') {
      grad.addColorStop(0, 'rgba(255, 71, 87, 0.48)');
      grad.addColorStop(0.7, 'rgba(255, 71, 87, 0.25)');
      grad.addColorStop(1, 'rgba(255, 71, 87, 0.04)');
      edgeColor = 'rgba(255, 99, 114, 0.85)';
    } else if (g.state === 'SUSPICIOUS' || g.state === 'SEARCHING') {
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.44)');
      grad.addColorStop(0.75, 'rgba(251, 146, 60, 0.20)');
      grad.addColorStop(1, 'rgba(251, 146, 60, 0.03)');
      edgeColor = 'rgba(253, 186, 116, 0.78)';
    } else {
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.36)');
      grad.addColorStop(0.75, 'rgba(250, 204, 21, 0.16)');
      grad.addColorStop(1, 'rgba(250, 204, 21, 0.02)');
    }

    ctx.beginPath();
    ctx.moveTo(g.visionPoly[0].x, g.visionPoly[0].y);
    for (let i = 1; i < g.visionPoly.length; i++) {
      ctx.lineTo(g.visionPoly[i].x, g.visionPoly[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Crisp outer edges of cone
    const firstRay = g.visionPoly[1];
    const lastRay = g.visionPoly[g.visionPoly.length - 1];
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(firstRay.x, firstRay.y);
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(lastRay.x, lastRay.y);
    ctx.stroke();
  }

  // 4. Walls and 3D beveled cover pillars
  for (let ty = 0; ty < ROWS; ty++) {
    const row = level.grid[ty];
    for (let tx = 0; tx < COLS; tx++) {
      const ch = row[tx];
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;

      if (ch === '#') {
        ctx.fillStyle = '#0c111d';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#1b263e';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 8);
        ctx.strokeStyle = '#2d3e61';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2.5, y + 2.5, TILE_SIZE - 5, TILE_SIZE - 9);
      } else if (ch === 'C') {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        drawRoundedRect(ctx, x + 7, y + 9, TILE_SIZE - 10, TILE_SIZE - 10, 7);
        ctx.fill();

        // Cover pedestal body
        ctx.fillStyle = '#273552';
        drawRoundedRect(ctx, x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10, 7);
        ctx.fill();

        // Beveled marble cap
        ctx.fillStyle = '#405680';
        drawRoundedRect(ctx, x + 7, y + 6, TILE_SIZE - 14, TILE_SIZE - 16, 5);
        ctx.fill();

        ctx.strokeStyle = '#6f8ec2';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, x + 7.5, y + 6.5, TILE_SIZE - 15, TILE_SIZE - 17, 5);
        ctx.stroke();
      }
    }
  }

  // 5. Acoustic footstep & decoy sound ripples
  for (const w of soundWaves) {
    ctx.save();
    ctx.strokeStyle = w.color;
    ctx.globalAlpha = Math.max(0, w.alpha * 0.72);
    ctx.lineWidth = w.kind === 'coin' ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Active thrown decoy coins
  for (const d of decoys) {
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = '#f6b93b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff5cc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 7. Golden Relic objective
  if (!relicCollected) {
    const r = tileCenter(level.relic.tx, level.relic.ty);
    const bob = Math.sin(time * 3.4) * 2.5;
    ctx.save();
    const aura = ctx.createRadialGradient(r.x, r.y, 4, r.x, r.y, 32);
    aura.addColorStop(0, 'rgba(255, 215, 70, 0.55)');
    aura.addColorStop(1, 'rgba(255, 215, 70, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 32, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal ring
    ctx.strokeStyle = '#f6b93b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Diamond relic
    ctx.translate(r.x, r.y + bob);
    ctx.fillStyle = '#ffe066';
    ctx.strokeStyle = '#fff9db';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 10px ui-sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RELIC', 0, -17);
    ctx.restore();
  }

  // 8. Guards + status indicators
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);

    // Subtle body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(2, 4, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(g.angle);
    // Armored shoulders
    ctx.fillStyle = g.state === 'ALERT' ? '#ff4757' : g.state === 'SUSPICIOUS' || g.state === 'SEARCHING' ? '#fb923c' : '#e2e8f0';
    drawRoundedRect(ctx, -11, -13, 20, 26, 7);
    ctx.fill();

    // Helmet & visor
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.state === 'ALERT' ? '#ff6b81' : g.state === 'SUSPICIOUS' ? '#fdba74' : '#facc15';
    ctx.fillRect(5, -5, 6, 10);
    ctx.restore();

    // Suspicion arc & alert icon above guard
    if (g.suspicion > 4 || g.state !== 'PATROL') {
      const frac = Math.min(1, g.suspicion / 100);
      ctx.save();
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = g.state === 'ALERT' ? '#ff4757' : '#fb923c';
      ctx.lineWidth = 3;
      ctx.stroke();

      const badge = g.state === 'ALERT' ? '!' : '?';
      ctx.fillStyle = g.state === 'ALERT' ? '#ff4757' : '#fb923c';
      ctx.beginPath();
      ctx.arc(g.x, g.y - 26, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.font = '800 13px ui-sans-serif, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, g.x, g.y - 25.5);
      ctx.restore();
    }
  }

  // 9. Player rogue sprite + stealth indicator
  ctx.save();
  const pRadius = player.crouching ? 11 : 13;

  if (player.inShadow || player.crouching) {
    ctx.strokeStyle = player.inShadow ? 'rgba(56, 232, 255, 0.55)' : 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, pRadius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(player.x + 1, player.y + 3, pRadius + 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.inShadow ? '#0ea5e9' : '#38e8ff';
  ctx.beginPath();
  ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e0f7ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hood visor direction + subtle cyan rim glow
  ctx.fillStyle = '#071324';
  ctx.beginPath();
  ctx.arc(3, 0, pRadius * 0.56, -0.95, 0.95);
  ctx.fill();
  ctx.fillStyle = '#e0f7ff';
  ctx.beginPath();
  ctx.arc(pRadius * 0.62, 0, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 10. Coin toss aim reticle when coins remain
  if (mouse.active && state.coins > 0 && state.mode === 'PLAY') {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const d = Math.hypot(dx, dy);
    const maxThrow = 220;
    const tx = d > maxThrow ? player.x + (dx / d) * maxThrow : mouse.x;
    const ty = d > maxThrow ? player.y + (dy / d) * maxThrow : mouse.y;
    ctx.save();
    ctx.strokeStyle = 'rgba(246, 185, 59, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
