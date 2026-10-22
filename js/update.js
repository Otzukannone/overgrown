// ---------- Update ----------
function update(dt) {
  tAll += dt;
  if (toastT > 0) toastT -= dt;
  if (flash > 0) flash -= dt * 2;
  if (shake > 0) shake -= dt * 3;
  if (state === 'EDITOR') { edUpdate(dt); return; }
  if (state !== 'PLAYING') return;
  const L = LEVELS[li];

  timeLeft -= dt;
  elapsedTime += dt;
  if (rainTimer > 0) rainTimer -= dt;
  if (rainCd > 0) rainCd -= dt;
  if (timeLeft <= 0) { endLevel(); saveGame(); return; }

  let vx = 0, vy = 0;
  if (keys.ArrowUp || keys.KeyW) vy = -1; if (keys.ArrowDown || keys.KeyS) vy = 1;
  if (keys.ArrowLeft || keys.KeyA) vx = -1; if (keys.ArrowRight || keys.KeyD) vx = 1;
  if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
  moving = !!(vx || vy);
  const ck = Math.min(1, dt * 3); camX += (vx * 14 - camX) * ck; camY += (vy * 14 - camY) * ck;
  player.x = Math.max(0, Math.min(W - player.w, player.x + vx * speed() * dt));
  player.y = Math.max(0, Math.min(H - player.h, player.y + vy * speed() * dt));
  resolveSolid();
  if (Math.abs(vx) > Math.abs(vy)) player.facing = vx > 0 ? 'RIGHT' : 'LEFT';
  else if (vy) player.facing = vy > 0 ? 'DOWN' : 'UP';

  const m = growMul();
  for (const k in crops) crops[k].age += dt * m;

  runLevelEvents(dt);

  if (L.heavy) {
    nextBolt -= dt;
    if (nextBolt <= 0) { flash = 1; shake = 0.6; nextBolt = 6 + Math.random() * 8; }
    if (Math.random() < dt * 3 && drips.length < 14) drips.push({ x: Math.random() * W, y: Math.random() * 200, r: 4 + Math.random() * 5, v: 20 + Math.random() * 30, life: 3 + Math.random() * 2 });
  }
  drips.forEach(d => { d.y += d.v * dt; d.life -= dt; }); drips = drips.filter(d => d.life > 0);
  if (weather() === 'rain') drops.forEach(d => { d.y += d.s * dt; d.x -= 80 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 100); } });
}

// ---------- Editor-authored level events ----------
// Each event: { id, time, chance, random, enabled }
//   rain    - starts a rain shower for 20s
//   drought - forces dry weather for 20s
//   frost   - stops crop growth for 8s
//   growth  - 2x growth speed for 10s
//   pest    - destroys one random crop
function runLevelEvents(dt) {
  if (frostTimer > 0) frostTimer -= dt;
  if (pestTimer > 0) { pestTimer -= dt; if (pestTimer <= 0) pestStrike(); }
  if (droughtTimer > 0) droughtTimer -= dt;
  if (growthTimer > 0) growthTimer -= dt;
  const L = LEVELS[li];
  const evs = L.events;
  if (!evs || !evs.length) return;
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (!ev.enabled || evFired[i]) continue;
    if (elapsedTime < (ev.time || 0)) continue;
    evFired[i] = true;
    if (ev.chance !== undefined && Math.random() > ev.chance) continue;
    fireEvent(ev.id);
  }
}
function fireEvent(id) {
  switch (id) {
    case 'rain': rainTimer = Math.max(rainTimer, 20); toast('Rain starts!'); break;
    case 'drought': rainTimer = 0; droughtTimer = 20; toast('Drought!'); break;
    case 'frost': frostTimer = 8; toast('Frost slows the crops!'); break;
    case 'growth': growthTimer = 10; toast('Growth spurt!'); break;
    case 'pest': pestTimer = 1; break;
  }
}
function pestStrike() {
  const ks = Object.keys(crops);
  if (!ks.length) return;
  const k = ks[Math.floor(Math.random() * ks.length)];
  delete crops[k];
  toast('A pest ruined a crop!');
}

// ---------- Solid object collision ----------
function resolveSolid() {
  const objs = lvlObjects();
  for (const k in objs) {
    if (SOLID_OBJECTS.indexOf(objs[k]) < 0) continue;
    const q = parseKey(k);
    const bx = q.c * T, by = q.r * T;
    if (player.x + player.w <= bx || player.x >= bx + T) continue;
    if (player.y + player.h <= by || player.y >= by + T) continue;
    // overlapping: push the player out along the shallower axis
    const left = player.x + player.w - bx, right = bx + T - player.x;
    const top = player.y + player.h - by, bottom = by + T - player.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) player.x = bx - player.w;
    else if (m === right) player.x = bx + T;
    else if (m === top) player.y = by - player.h;
    else player.y = by + T;
  }
}
function endLevel() {
  const L = LEVELS[li];
  if (earned >= L.target) {
    money += earned;
    const st = earned >= L.target * 2 ? 3 : earned >= L.target * 1.5 ? 2 : 1;
    stars[li] = Math.max(stars[li] || 0, st);
    lastResult = 'LEVEL CLEARED! ' + '\u2605'.repeat(st) + '  Earned ' + earned + ' / ' + L.target;
    if (li === LEVELS.length - 1) { state = 'WIN'; return; }
    state = 'SHOP';
  } else {
    const c = Math.floor(earned / 3); money += c;
    lastResult = 'Target missed (' + earned + ' / ' + L.target + '). Consolation coins: ' + c + '. Upgrade and retry!';
    state = 'SHOP';
  }
}

