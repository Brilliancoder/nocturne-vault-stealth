import { tileCenter } from './levels.js';
import { canGuardSeePlayer, computeVisionPolygon, normalizeAngle } from './visibility.js';

export function createGuards(level) {
  return level.guards.map((spec, idx) => {
    const start = tileCenter(spec.waypoints[0].tx, spec.waypoints[0].ty);
    const next = spec.waypoints[1] ? tileCenter(spec.waypoints[1].tx, spec.waypoints[1].ty) : start;
    const angle = Math.atan2(next.y - start.y, next.x - start.x);
    return {
      id: idx,
      name: spec.name,
      x: start.x,
      y: start.y,
      angle,
      speed: spec.speed,
      fovDeg: spec.fovDeg,
      range: spec.range,
      waypoints: spec.waypoints.map((w) => ({ ...tileCenter(w.tx, w.ty), pause: w.pause ?? 0.6 })),
      wpIndex: 1 % spec.waypoints.length,
      pauseTimer: 0,
      state: 'PATROL', // PATROL | SUSPICIOUS | ALERT | SEARCHING
      suspicion: 0,
      target: null,
      searchTimer: 0,
      stepTimer: idx * 0.22,
      visionPoly: [],
    };
  });
}

export function alertGuardsToSound(guards, sx, sy, radius, soundWaves, kind = 'coin') {
  soundWaves.push({
    x: sx,
    y: sy,
    radius: 8,
    maxRadius: radius,
    alpha: 1,
    color: kind === 'coin' ? '#f6b93b' : '#38e8ff',
    kind,
  });

  for (const g of guards) {
    const dist = Math.hypot(g.x - sx, g.y - sy);
    if (dist <= radius) {
      if (g.state !== 'ALERT') {
        g.state = 'SUSPICIOUS';
        g.suspicion = Math.max(g.suspicion, kind === 'coin' ? 42 : 30);
        g.target = { x: sx, y: sy };
        g.searchTimer = 4.2;
      }
    }
  }
}

export function updateGuards(level, guards, player, dt, soundWaves, sound) {
  let maxSuspicion = 0;
  let caught = false;

  for (const g of guards) {
    const sight = canGuardSeePlayer(level, g, player);
    const prevState = g.state;

    if (sight.visible) {
      const gain = (75 + 150 * sight.intensity) * dt;
      g.suspicion = Math.min(100, g.suspicion + gain);
      g.target = { x: player.x, y: player.y };
      g.searchTimer = 4.5;

      if (g.suspicion >= 98) {
        g.state = 'ALERT';
      } else if (g.suspicion >= 18) {
        g.state = 'SUSPICIOUS';
      }

      if (prevState !== 'SUSPICIOUS' && g.state === 'SUSPICIOUS') {
        sound?.playCue('suspicious');
      } else if (prevState !== 'ALERT' && g.state === 'ALERT') {
        sound?.playCue('alert');
      }
    } else {
      const decayRate = g.state === 'ALERT' ? 14 : g.state === 'SEARCHING' ? 20 : 28;
      g.suspicion = Math.max(0, g.suspicion - decayRate * dt);
      if (g.state === 'ALERT' && g.suspicion < 65) {
        g.state = 'SEARCHING';
      } else if ((g.state === 'SUSPICIOUS' || g.state === 'SEARCHING') && g.suspicion <= 1 && g.searchTimer <= 0) {
        g.state = 'PATROL';
        g.target = null;
      }
    }

    maxSuspicion = Math.max(maxSuspicion, g.suspicion);

    // Movement and orientation
    let moveTarget = null;
    let moveSpeed = g.speed;

    if ((g.state === 'ALERT' || g.state === 'SUSPICIOUS' || g.state === 'SEARCHING') && g.target) {
      moveTarget = g.target;
      moveSpeed = g.state === 'ALERT' ? g.speed * 1.48 : g.speed * 0.92;
      const dToTarget = Math.hypot(moveTarget.x - g.x, moveTarget.y - g.y);
      if (dToTarget < 14) {
        moveTarget = null;
        g.searchTimer -= dt;
        g.angle = normalizeAngle(g.angle + Math.sin(g.searchTimer * 3.1) * 1.9 * dt);
        if (g.searchTimer <= 0 && !sight.visible) {
          g.state = 'PATROL';
          g.target = null;
        }
      }
    } else {
      const wp = g.waypoints[g.wpIndex];
      const d = Math.hypot(wp.x - g.x, wp.y - g.y);
      if (d < 6) {
        if (g.pauseTimer <= 0) {
          g.pauseTimer = wp.pause;
        } else {
          g.pauseTimer -= dt;
          if (g.pauseTimer <= 0) {
            g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
          }
        }
      } else {
        moveTarget = wp;
      }
    }

    if (moveTarget) {
      const dx = moveTarget.x - g.x;
      const dy = moveTarget.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const desiredAngle = Math.atan2(dy, dx);
        const diff = normalizeAngle(desiredAngle - g.angle);
        const turnRate = g.state === 'ALERT' ? 8.0 : 5.0;
        g.angle = normalizeAngle(g.angle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate * dt));

        const step = Math.min(dist, moveSpeed * dt);
        g.x += (dx / dist) * step;
        g.y += (dy / dist) * step;

        g.stepTimer -= dt;
        if (g.stepTimer <= 0) {
          g.stepTimer = g.state === 'ALERT' ? 0.28 : 0.48;
          soundWaves.push({
            x: g.x,
            y: g.y,
            radius: 6,
            maxRadius: g.state === 'ALERT' ? 78 : 54,
            alpha: 0.72,
            color: g.state === 'ALERT' ? '#ff4757' : '#70a1ff',
            kind: 'footstep',
          });
          const pDist = Math.hypot(player.x - g.x, player.y - g.y);
          if (pDist < 420) {
            sound?.playFootstep(Math.max(0.05, 1 - pDist / 420));
          }
        }
      }
    }

    const fovRad = (g.fovDeg * Math.PI) / 180;
    const activeRange = g.state === 'ALERT' ? g.range * 1.12 : g.range;
    g.visionPoly = computeVisionPolygon(level, g.x, g.y, g.angle, fovRad, activeRange);

    if (g.state === 'ALERT' && Math.hypot(player.x - g.x, player.y - g.y) < 26) {
      caught = true;
    }
  }

  return { maxSuspicion, caught };
}
