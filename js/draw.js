// ---------- Draw ----------
function txt(s, x, y, size = 20, col = '#fff', align = 'left') {
  ctx.font = 'bold ' + size + 'px system-ui,sans-serif'; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function multi(s, x, y, size, col, align) { s.split('\n').forEach((l, i) => txt(l, x, y + i * (size + 8), size, col, align)); }
function panel(a = 0.85) { ctx.fillStyle = 'rgba(10,15,25,' + a + ')'; ctx.fillRect(0, 0, W, H); }

function drawWorld() {
  const L = LEVELS[li], w = weather();
  ctx.fillStyle = w === 'dry' ? '#c2b25a' : w === 'rain' ? '#2f9e5a' : '#4ade80';
  ctx.fillRect(-40, -40, W + 80, H + 80);
  const p = plot();
  for (let r = p.r0; r <= p.r1; r++) for (let c = p.c0; c <= p.c1; c++) {
    ctx.fillStyle = w === 'rain' ? '#5b3a1a' : w === 'dry' ? '#a0743c' : '#8B5A2B';
    ctx.fillRect(c * T, r * T, T, T);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; ctx.strokeRect(c * T, r * T, T, T);
  }
  // bin + grocer
  ctx.fillStyle = '#4a5568'; ctx.fillRect(bin.col * T, bin.row * T, T, T);
  ctx.fillStyle = '#2d3748'; ctx.fillRect(bin.col * T + 5, bin.row * T + 5, T - 10, T - 10);
  txt('BIN', bin.col * T + 25, bin.row * T + 16, 14, '#fff', 'center');
  ctx.fillStyle = '#f59e0b'; ctx.fillRect((bin.col + 2) * T + 10, bin.row * T + 12, 26, 30);
  ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc((bin.col + 2) * T + 23, bin.row * T + 8, 9, 0, 7); ctx.fill();
  txt('Grocer', (bin.col + 2) * T + 23, bin.row * T + 44, 11, '#fff', 'center');
  // crops
  for (const k in crops) {
    const [c, r] = k.split(',').map(Number), cr = crops[k], d = CROPS[cr.type], f = cr.age / d.grow;
    const cx = c * T + 25, cy = r * T + 25;
    if (f < 0.4) { ctx.fillStyle = '#22c55e'; ctx.fillRect(cx - 5, cy - 5, 10, 10); }
    else if (f < 1) { ctx.fillStyle = '#16a34a'; ctx.fillRect(cx - 10, cy - 10, 20, 20); }
    else {
      ctx.fillStyle = d.color; ctx.fillRect(cx - 15, cy - 15, 30, 30);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(cx - 10, cy - 10, 10, 10);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(cx - 15, cy - 15, 30, 30);
    }
  }
  // player
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(player.x, player.y, 30, 30);
  ctx.fillStyle = '#1e3a8a'; const s = 8; let ix = player.x, iy = player.y;
  if (player.facing === 'UP') ix += 11; else if (player.facing === 'DOWN') { ix += 11; iy += 22; }
  else if (player.facing === 'LEFT') iy += 11; else { ix += 22; iy += 11; }
  ctx.fillRect(ix, iy, s, s);
  // target
  const t = target(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.strokeRect(t.c * T, t.r * T, T, T);
}
function drawWeatherFx() {
  const w = weather(), L = LEVELS[li];
  if (w === 'dry') { ctx.fillStyle = 'rgba(255,160,40,.13)'; ctx.fillRect(0, 0, W, H); }
  if (w === 'rain') {
    ctx.fillStyle = 'rgba(10,20,50,.25)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(180,210,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
    drops.forEach(d => { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 4, d.y + 14); }); ctx.stroke();
  }
  drips.forEach(d => { ctx.fillStyle = 'rgba(200,225,255,.35)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * .7, d.r, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke(); });
  if (flash > 0 && opts.flash) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, flash) * 0.8 + ')'; ctx.fillRect(0, 0, W, H); }
}
function drawHUD() {
  const L = LEVELS[li];
  txt('Level ' + (li + 1) + ': ' + L.name, 14, 8, 16, '#e5e7eb');
  txt('Earned: ' + earned + ' / ' + L.target, 14, 30, 22, earned >= L.target ? '#4ade80' : '#facc15');
  txt('Bag: ' + player.bag.length + '/' + maxBag(), 14, 58, 20, player.bag.length >= maxBag() ? '#ef4444' : '#93c5fd');
  txt('Seed: ' + CROPS[seed].name, 14, 84, 16, '#fff');
  const bs = [ab.drink && 'Drink', ab.time && 'Head start', lb.shoes && 'Tonic', lb.fert && 'Miracle Mix', lb.bag && 'Basket'].filter(Boolean);
  if (bs.length) txt('Boosts: ' + bs.join(', '), 14, 106, 13, '#bbf7d0');
  const m = Math.max(0, Math.ceil(timeLeft));
  txt(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'), W - 14, 8, 30, m <= 15 ? '#ef4444' : '#fff', 'right');
  txt(weather() === 'rain' ? 'RAINY' : weather() === 'dry' ? 'DRY' : 'CLEAR', W - 14, 44, 16, '#bae6fd', 'right');
  txt('Grocer (E): rain & boosts', W - 14, 66, 14, '#fde68a', 'right');
  txt('WASD move | SPACE plant | E harvest/chop/deliver/grocer | 1-3 seed', W / 2, H - 24, 13, '#e5e7eb', 'center');
  if (toastT > 0) txt(toastMsg, W / 2, 110, 22, '#fff', 'center');
}
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  if (state === 'MENU') { drawMenu(); return; }
  if (state === 'SLOTS') { drawSlots(); return; }
  if (state === 'LEVELS') { drawLevels(); return; }
  if (state === 'CONFIRM') { drawBack(dlg.back); drawDialog(); return; }
  if (state === 'OPTIONS') { drawOptions(); return; }
  if (state === 'EXIT') {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    txt('Thanks for playing!', W / 2, 230, 44, '#facc15', 'center');
    txt('You can close this tab now.', W / 2, 300, 20, '#fff', 'center');
    txt('Press ENTER to return to the menu', W / 2, 350, 18, '#9ca3af', 'center');
    return;
  }
  if (state === 'WIN') {
    ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
    txt('YOU SAVED THE GROCER ECONOMY!', W / 2, 200, 40, '#facc15', 'center');
    txt('Shelves are full again. Thanks, farmer.', W / 2, 270, 22, '#fff', 'center');
    txt('ENTER for main menu', W / 2, 360, 24, '#fff', 'center');
    return;
  }
  // camera bob / shake
  let ox = 0, oy = 0;
  if (state === 'PLAYING' && opts.camera) {
    ox -= camX; oy -= camY;
    if (shake > 0) { ox += (Math.random() - .5) * 10 * shake; oy += (Math.random() - .5) * 10 * shake; }
  }
  ctx.translate(Math.round(ox), Math.round(oy));
  drawWorld();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWeatherFx();
  if (state === 'PLAYING') drawHUD();
  if (state === 'INTRO') {
    const L = LEVELS[li]; panel();
    txt('Level ' + (li + 1) + ': ' + L.name, W / 2, 120, 40, '#facc15', 'center');
    multi(L.story, W / 2, 200, 20, '#fff', 'center');
    txt('Target: ' + L.target + ' coins in ' + L.time + 's', W / 2, 320, 24, '#4ade80', 'center');
    txt('Press ENTER to begin', W / 2, 420, 24, '#fff', 'center');
  }
  if (state === 'SHOP') drawMerchant();
  if (state === 'GROCER') { drawHUD(); drawGrocer(); }
}

