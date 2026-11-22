import { COLS, ROWS, TILE_SIZE, isOpaqueTile, tileAt } from './levels.js';

export function normalizeAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

export function castRay(level, ox, oy, angle, maxDist) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const step = 4;
  let dist = 0;

  while (dist < maxDist) {
    dist += step;
    if (dist > maxDist) dist = maxDist;
    const px = ox + dx * dist;
    const py = oy + dy * dist;
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || isOpaqueTile(tileAt(level, tx, ty))) {
      // Binary refine hit edge for razor-sharp cone clipping on cover corners
      let lo = Math.max(0, dist - step);
      let hi = dist;
      for (let i = 0; i < 4; i++) {
        const mid = (lo + hi) * 0.5;
        const mtx = Math.floor((ox + dx * mid) / TILE_SIZE);
        const mty = Math.floor((oy + dy * mid) / TILE_SIZE);
        if (mtx < 0 || mty < 0 || mtx >= COLS || mty >= ROWS || isOpaqueTile(tileAt(level, mtx, mty))) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      return { x: ox + dx * lo, y: oy + dy * lo, dist: lo, hit: true };
    }
  }
  return { x: ox + dx * maxDist, y: oy + dy * maxDist, dist: maxDist, hit: false };
}

export function computeVisionPolygon(level, ox, oy, facingAngle, fovRad, range, rayCount = 46) {
  const pts = [{ x: ox, y: oy }];
  const half = fovRad * 0.5;
  for (let i = 0; i <= rayCount; i++) {
    const a = facingAngle - half + (fovRad * i) / rayCount;
    pts.push(castRay(level, ox, oy, a, range));
  }
  return pts;
}

export function hasLineOfSight(level, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const steps = Math.ceil(dist / 6);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (isOpaqueTile(tileAt(level, tx, ty))) return false;
  }
  return true;
}

export function canGuardSeePlayer(level, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const effectiveRange = player.inShadow ? guard.range * (player.crouching ? 0.58 : 0.72) : player.crouching ? guard.range * 0.85 : guard.range;
  if (dist > effectiveRange) return { visible: false, dist, intensity: 0 };

  const angleToPlayer = Math.atan2(dy, dx);
  const delta = Math.abs(normalizeAngle(angleToPlayer - guard.angle));
  const halfFov = ((guard.fovDeg * Math.PI) / 180) * 0.5;
  if (delta > halfFov) return { visible: false, dist, intensity: 0 };

  if (!hasLineOfSight(level, guard.x, guard.y, player.x, player.y)) {
    return { visible: false, dist, intensity: 0 };
  }

  const distFactor = Math.max(0.2, 1 - dist / (effectiveRange * 1.1));
  const angleFactor = Math.max(0.35, 1 - delta / (halfFov * 1.15));
  const stealthMult = (player.inShadow ? 0.42 : 1) * (player.crouching ? 0.65 : 1);
  return {
    visible: true,
    dist,
    intensity: distFactor * angleFactor * stealthMult,
  };
}
