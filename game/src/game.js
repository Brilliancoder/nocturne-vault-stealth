import { SoundEngine } from './audio.js';
import { alertGuardsToSound, createGuards, updateGuards } from './guards.js';
import { COLS, LEVELS, ROWS, TILE_SIZE, isShadowTile, isSolidTile, tileAt, tileCenter } from './levels.js';
import { renderGame } from './renderer.js';
import { computeVisionPolygon } from './visibility.js';

function collidesCircleWithTiles(level, x, y, r) {
  const minTx = Math.floor((x - r) / TILE_SIZE);
  const maxTx = Math.floor((x + r) / TILE_SIZE);
  const minTy = Math.floor((y - r) / TILE_SIZE);
  const maxTy = Math.floor((y + r) / TILE_SIZE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || isSolidTile(tileAt(level, tx, ty))) {
        const cx = Math.max(tx * TILE_SIZE, Math.min(x, (tx + 1) * TILE_SIZE));
        const cy = Math.max(ty * TILE_SIZE, Math.min(y, (ty + 1) * TILE_SIZE));
        if (Math.hypot(x - cx, y - cy) < r) return true;
      }
    }
  }
  return false;
}

function applyShotPreset(state, shotName) {
  state.mode = 'PLAY';
  state.overlayTitle.classList.add('hidden');
  state.overlayBanner.classList.add('hidden');

  if (shotName === 'cover') {
    state.levelIndex = 0;
    loadLevel(state, 0);
    state.time = 18.4;
    // Player crouched in shadow alcove (3,4) safely behind cover pillar (6,4)
    state.player.x = 3.5 * TILE_SIZE;
    state.player.y = 4.5 * TILE_SIZE;
    state.player.crouching = true;
    state.player.inShadow = true;
    state.player.angle = 0;
    // Guard 0 looking left directly across cover pillar (6,4) — cone visibly blocked!
    state.guards[0].x = 9.5 * TILE_SIZE;
    state.guards[0].y = 4.5 * TILE_SIZE;
    state.guards[0].angle = Math.PI;
    // Guard 1 patrolling central gallery
    state.guards[1].x = 13.5 * TILE_SIZE;
    state.guards[1].y = 6.5 * TILE_SIZE;
    state.guards[1].angle = Math.PI * 0.72;
    // Guard 2 sweeping south relic corridor
    state.guards[2].x = 9.5 * TILE_SIZE;
    state.guards[2].y = 11.5 * TILE_SIZE;
    state.guards[2].angle = 0.04;
    state.soundWaves.push(
      { x: state.guards[0].x, y: state.guards[0].y, radius: 28, maxRadius: 56, alpha: 0.78, color: '#70a1ff', kind: 'footstep' },
      { x: state.guards[1].x, y: state.guards[1].y, radius: 38, maxRadius: 56, alpha: 0.58, color: '#70a1ff', kind: 'footstep' }
    );
  } else if (shotName === 'decoy') {
    state.levelIndex = 1;
    loadLevel(state, 1);
    state.time = 34.2;
    state.coins = 2;
    state.player.x = 12.5 * TILE_SIZE;
    state.player.y = 5.5 * TILE_SIZE;
    state.player.crouching = true;
    state.player.inShadow = true;
    state.player.angle = -0.35;
    const coinPos = tileCenter(19, 7);
    state.decoys.push({ x: coinPos.x, y: coinPos.y, ttl: 2.5 });
    // Guard 0 looking right down open corridor
    state.guards[0].x = 10.5 * TILE_SIZE;
    state.guards[0].y = 11.5 * TILE_SIZE;
    state.guards[0].angle = -0.15;
    // Guard 1 walking east along south-west corridor
    state.guards[1].x = 4.5 * TILE_SIZE;
    state.guards[1].y = 9.5 * TILE_SIZE;
    state.guards[1].angle = 0.05;
    // Guard 2 lured away from relic toward decoy coin!
    state.guards[2].x = 19.5 * TILE_SIZE;
    state.guards[2].y = 4.8 * TILE_SIZE;
    state.guards[2].angle = Math.PI * 0.52;
    state.guards[2].state = 'SUSPICIOUS';
    state.guards[2].suspicion = 46;
    // Guard 3 sweeping north-west gallery
    state.guards[3].x = 5.5 * TILE_SIZE;
    state.guards[3].y = 2.5 * TILE_SIZE;
    state.guards[3].angle = 0.25;
    state.soundWaves.push(
      { x: coinPos.x, y: coinPos.y, radius: 42, maxRadius: 140, alpha: 0.92, color: '#f6b93b', kind: 'coin' },
      { x: coinPos.x, y: coinPos.y, radius: 88, maxRadius: 140, alpha: 0.6, color: '#f6b93b', kind: 'coin' }
    );
  } else if (shotName === 'alert') {
    state.levelIndex = 1;
    loadLevel(state, 1);
    state.time = 47.6;
    // Player ducking just out of sight in open tile (12,4) behind cover pillar (13,4)
    state.player.x = 12.4 * TILE_SIZE;
    state.player.y = 4.5 * TILE_SIZE;
    state.player.crouching = true;
    state.player.inShadow = false;
    state.player.angle = Math.PI;
    // Guard 2 in high suspicion sweeping across central pillars (11,4) & (13,4)
    state.guards[2].x = 15.5 * TILE_SIZE;
    state.guards[2].y = 4.5 * TILE_SIZE;
    state.guards[2].angle = Math.PI - 0.12;
    state.guards[2].state = 'SUSPICIOUS';
    state.guards[2].suspicion = 78;
    state.guards[1].x = 7.4 * TILE_SIZE;
    state.guards[1].y = 5.5 * TILE_SIZE;
    state.guards[1].angle = 0.08;
    state.guards[3].x = 5.5 * TILE_SIZE;
    state.guards[3].y = 2.5 * TILE_SIZE;
    state.guards[3].angle = 0.1;
    state.guards[0].x = 15.5 * TILE_SIZE;
    state.guards[0].y = 11.5 * TILE_SIZE;
    state.guards[0].angle = Math.PI - 0.15;
    state.soundWaves.push(
      { x: state.guards[2].x, y: state.guards[2].y, radius: 34, maxRadius: 72, alpha: 0.86, color: '#fb923c', kind: 'footstep' }
    );
  } else if (shotName === 'exit') {
    state.levelIndex = 2;
    loadLevel(state, 2);
    state.time = 68.1;
    state.relicCollected = true;
    state.coins = 1;
    state.player.x = 3.2 * TILE_SIZE;
    state.player.y = 6.5 * TILE_SIZE;
    state.player.crouching = false;
    state.player.angle = Math.PI;
    // Alerted guard sweeping behind cover pillar (8,6) as player extracts!
    state.guards[0].x = 10.2 * TILE_SIZE;
    state.guards[0].y = 6.5 * TILE_SIZE;
    state.guards[0].angle = Math.PI - 0.25;
    state.guards[0].state = 'ALERT';
    state.guards[0].suspicion = 92;
    state.guards[1].x = 14.5 * TILE_SIZE;
    state.guards[1].y = 2.5 * TILE_SIZE;
    state.guards[1].angle = 3.0;
    state.guards[2].x = 16.5 * TILE_SIZE;
    state.guards[2].y = 10.5 * TILE_SIZE;
    state.guards[2].angle = Math.PI + 0.15;
    state.guards[3].x = 22.5 * TILE_SIZE;
    state.guards[3].y = 5.5 * TILE_SIZE;
    state.guards[3].angle = Math.PI * 0.65;
    state.soundWaves.push(
      { x: state.guards[0].x, y: state.guards[0].y, radius: 34, maxRadius: 74, alpha: 0.84, color: '#ff4757', kind: 'footstep' }
    );
  }

  state.maxSuspicion = Math.max(0, ...state.guards.map((g) => g.suspicion));
  for (const g of state.guards) {
    const fovRad = (g.fovDeg * Math.PI) / 180;
    g.visionPoly = computeVisionPolygon(state.level, g.x, g.y, g.angle, fovRad, g.range);
  }
}

function loadLevel(state, index) {
  const level = LEVELS[index];
  state.levelIndex = index;
  state.level = level;
  state.coins = level.coins;
  state.relicCollected = false;
  state.decoys = [];
  state.soundWaves = [];
  state.maxSuspicion = 0;

  const start = tileCenter(level.playerStart.tx, level.playerStart.ty);
  state.player = {
    x: start.x,
    y: start.y,
    angle: 0,
    radius: 12,
    crouching: false,
    inShadow: false,
    stepTimer: 0,
  };
  state.guards = createGuards(level);
  for (const g of state.guards) {
    const fovRad = (g.fovDeg * Math.PI) / 180;
    g.visionPoly = computeVisionPolygon(level, g.x, g.y, g.angle, fovRad, g.range);
  }
}

export function initGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const sound = new SoundEngine();

  const state = {
    mode: 'TITLE', // TITLE | PLAY | CLEAR | CAUGHT | VICTORY
    levelIndex: 0,
    level: LEVELS[0],
    player: null,
    guards: [],
    soundWaves: [],
    decoys: [],
    coins: 3,
    relicCollected: false,
    maxSuspicion: 0,
    time: 0,
    keys: new Set(),
    mouse: { x: 0, y: 0, active: false },
    overlayTitle: document.getElementById('overlay-title'),
    overlayBanner: document.getElementById('overlay-banner'),
    hudLevel: document.getElementById('hud-level'),
    hudRelic: document.getElementById('hud-relic'),
    hudSuspicionBar: document.getElementById('hud-suspicion-bar'),
    hudSuspicionVal: document.getElementById('hud-suspicion-val'),
    hudStance: document.getElementById('hud-stance'),
    hudCoins: document.getElementById('hud-coins'),
    hudTimer: document.getElementById('hud-timer'),
  };

  loadLevel(state, 0);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    sound.muted = true;
    applyShotPreset(state, shot);
  } else {
    state.overlayTitle.classList.remove('hidden');
  }

  function updateHud() {
    state.hudLevel.textContent = `FLOOR ${state.levelIndex + 1}/${LEVELS.length} · ${state.level.name}`;
    state.hudRelic.textContent = state.relicCollected ? 'RELIC: SECURED' : `RELIC: ${state.level.relic.name}`;
    state.hudRelic.classList.toggle('secured', state.relicCollected);
    const sus = Math.round(state.maxSuspicion);
    state.hudSuspicionBar.style.width = `${sus}%`;
    state.hudSuspicionVal.textContent = `${sus}%`;
    state.hudSuspicionVal.style.color = sus >= 75 ? '#ff6b81' : sus >= 35 ? '#fdba74' : '#e8eefc';
    state.hudStance.textContent = state.player.inShadow
      ? 'SHADOWED'
      : state.player.crouching
        ? 'CROUCHED'
        : 'EXPOSED';
    state.hudCoins.textContent = `COINS: ${state.coins}`;
    const mins = String(Math.floor(state.time / 60)).padStart(2, '0');
    const secs = String(Math.floor(state.time % 60)).padStart(2, '0');
    state.hudTimer.textContent = `${mins}:${secs}`;
  }

  function showBanner(eyebrow, title, desc, buttonText, onClick) {
    document.getElementById('banner-eyebrow').textContent = eyebrow;
    document.getElementById('banner-title').textContent = title;
    document.getElementById('banner-desc').textContent = desc;
    const btn = document.getElementById('btn-next');
    btn.textContent = buttonText;
    btn.onclick = onClick;
    state.overlayBanner.classList.remove('hidden');
  }

  function tossCoin() {
    if (state.mode !== 'PLAY' || state.coins <= 0) return;
    sound.unlock();
    state.coins -= 1;
    const targetX = state.mouse.active ? state.mouse.x : state.player.x + Math.cos(state.player.angle) * 140;
    const targetY = state.mouse.active ? state.mouse.y : state.player.y + Math.sin(state.player.angle) * 140;
    const dx = targetX - state.player.x;
    const dy = targetY - state.player.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, 220);
    let cx = dist > 1 ? state.player.x + (dx / dist) * clamped : state.player.x;
    let cy = dist > 1 ? state.player.y + (dy / dist) * clamped : state.player.y;
    if (collidesCircleWithTiles(state.level, cx, cy, 8)) {
      cx = state.player.x + Math.cos(state.player.angle) * 60;
      cy = state.player.y + Math.sin(state.player.angle) * 60;
    }
    state.decoys.push({ x: cx, y: cy, ttl: 3.0 });
    sound.playCoin();
    alertGuardsToSound(state.guards, cx, cy, 240, state.soundWaves, 'coin');
  }

  function tryGrabRelic() {
    if (state.relicCollected) return;
    const r = tileCenter(state.level.relic.tx, state.level.relic.ty);
    if (Math.hypot(state.player.x - r.x, state.player.y - r.y) < 34) {
      state.relicCollected = true;
      sound.playCue('relic');
    }
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    sound.unlock();
    state.mode = 'PLAY';
    state.overlayTitle.classList.add('hidden');
  });

  document.getElementById('btn-mute').addEventListener('click', (e) => {
    const muted = sound.toggleMute();
    e.currentTarget.textContent = muted ? 'AUDIO: OFF' : 'AUDIO: ON';
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    state.keys.add(k);
    if (k === 'm') {
      const muted = sound.toggleMute();
      document.getElementById('btn-mute').textContent = muted ? 'AUDIO: OFF' : 'AUDIO: ON';
    } else if (k === 'r' && state.mode !== 'TITLE') {
      loadLevel(state, state.levelIndex);
      state.mode = 'PLAY';
      state.overlayBanner.classList.add('hidden');
    } else if (k === 'e') {
      tryGrabRelic();
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (state.mode === 'TITLE') {
        sound.unlock();
        state.mode = 'PLAY';
        state.overlayTitle.classList.add('hidden');
      } else {
        tossCoin();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    state.keys.delete(e.key.toLowerCase());
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    state.mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    state.mouse.active = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) tossCoin();
  });

  let lastTs = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if (state.mode === 'PLAY' && !shot) {
      state.time += dt;
      const p = state.player;
      p.crouching = state.keys.has('shift');

      let mx = 0;
      let my = 0;
      if (state.keys.has('w') || state.keys.has('arrowup')) my -= 1;
      if (state.keys.has('s') || state.keys.has('arrowdown')) my += 1;
      if (state.keys.has('a') || state.keys.has('arrowleft')) mx -= 1;
      if (state.keys.has('d') || state.keys.has('arrowright')) mx += 1;

      if (mx !== 0 || my !== 0) {
        const mag = Math.hypot(mx, my);
        mx /= mag;
        my /= mag;
        const speed = p.crouching ? 105 : 175;
        const nx = p.x + mx * speed * dt;
        const ny = p.y + my * speed * dt;
        if (!collidesCircleWithTiles(state.level, nx, p.y, p.radius)) p.x = nx;
        if (!collidesCircleWithTiles(state.level, p.x, ny, p.radius)) p.y = ny;
        p.angle = Math.atan2(my, mx);

        p.stepTimer -= dt;
        if (p.stepTimer <= 0 && !p.crouching) {
          p.stepTimer = 0.34;
          sound.playFootstep(0.28);
          state.soundWaves.push({
            x: p.x,
            y: p.y,
            radius: 4,
            maxRadius: 34,
            alpha: 0.4,
            color: '#38e8ff',
            kind: 'footstep',
          });
        }
      }

      const ptx = Math.floor(p.x / TILE_SIZE);
      const pty = Math.floor(p.y / TILE_SIZE);
      p.inShadow = isShadowTile(tileAt(state.level, ptx, pty));

      tryGrabRelic();

      const res = updateGuards(state.level, state.guards, p, dt, state.soundWaves, sound);
      state.maxSuspicion = res.maxSuspicion;

      if (res.caught) {
        state.mode = 'CAUGHT';
        showBanner('COMPROMISED', 'DETECTED BY SECURITY', 'A guard caught you in the open. Break sightlines behind cover or distract guards with decoy coins.', 'RETRY FLOOR', () => {
          loadLevel(state, state.levelIndex);
          state.mode = 'PLAY';
          state.overlayBanner.classList.add('hidden');
        });
      }

      if (state.relicCollected) {
        const ex = tileCenter(state.level.exit.tx, state.level.exit.ty);
        if (Math.hypot(p.x - ex.x, p.y - ex.y) < 26) {
          sound.playCue('extract');
          if (state.levelIndex + 1 < LEVELS.length) {
            state.mode = 'CLEAR';
            showBanner('WING INFILTRATED', `${state.level.name.toUpperCase()} CLEARED`, `Relic secured. Descend deeper into the museum.`, 'NEXT FLOOR', () => {
              loadLevel(state, state.levelIndex + 1);
              state.mode = 'PLAY';
              state.overlayBanner.classList.add('hidden');
            });
          } else {
            state.mode = 'VICTORY';
            showBanner('HEIST COMPLETE', 'GRAND NOCTURNE CLEARED', `All 3 relics extracted in ${Math.round(state.time)} seconds.`, 'PLAY AGAIN', () => {
              state.time = 0;
              loadLevel(state, 0);
              state.mode = 'PLAY';
              state.overlayBanner.classList.add('hidden');
            });
          }
        }
      }

      // Animate ripples and decoys
      for (let i = state.soundWaves.length - 1; i >= 0; i--) {
        const w = state.soundWaves[i];
        w.radius += (w.maxRadius - w.radius) * Math.min(1, dt * 4.5) + 28 * dt;
        w.alpha -= dt * 0.95;
        if (w.alpha <= 0 || w.radius >= w.maxRadius) state.soundWaves.splice(i, 1);
      }
      for (let i = state.decoys.length - 1; i >= 0; i--) {
        state.decoys[i].ttl -= dt;
        if (state.decoys[i].ttl <= 0) state.decoys.splice(i, 1);
      }
    }

    updateHud();
    renderGame(ctx, state);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
