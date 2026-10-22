// ---------- Update ----------
function update(dt) {
  tAll += dt;
  if (toastT > 0) toastT -= dt;
  if (flash > 0) flash -= dt * 2;
  if (shake > 0) shake -= dt * 3;
  if (state !== 'PLAYING') return;
  const L = LEVELS[li];

  timeLeft -= dt;
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
  if (Math.abs(vx) > Math.abs(vy)) player.facing = vx > 0 ? 'RIGHT' : 'LEFT';
  else if (vy) player.facing = vy > 0 ? 'DOWN' : 'UP';

  const m = growMul();
  for (const k in crops) crops[k].age += dt * m;

  if (L.heavy) {
    nextBolt -= dt;
    if (nextBolt <= 0) { flash = 1; shake = 0.6; nextBolt = 6 + Math.random() * 8; }
    if (Math.random() < dt * 3 && drips.length < 14) drips.push({ x: Math.random() * W, y: Math.random() * 200, r: 4 + Math.random() * 5, v: 20 + Math.random() * 30, life: 3 + Math.random() * 2 });
  }
  drips.forEach(d => { d.y += d.v * dt; d.life -= dt; }); drips = drips.filter(d => d.life > 0);
  if (weather() === 'rain') drops.forEach(d => { d.y += d.s * dt; d.x -= 80 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 100); } });
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

