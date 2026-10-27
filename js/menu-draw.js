// ---------- Menu drawing ----------
function rr(x,y,w,h,r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function cloud(x, y, s) {
  ctx.fillStyle = '#fff';
  [[0, 0, 40], [38, -14, 34], [76, 0, 38], [34, 10, 36]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s,y + dy * s,r * s,0,7); ctx.fill(); });
}
const CLOUDS = [[40, 120, 1.1, 8], [300, 330, 1.4, 5], [560, 80, 0.9, 11], [120, 400, 1.2, 7], [680, 300, 1.0, 9]];
const STARS = Array.from({ length: 28 }, (_, i) => [(i * 137) % W, (i * 53) % 160, i]);
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f6fd6'); g.addColorStop(1, '#a8dcff');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  STARS.forEach(([x, y, i]) => { ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.abs(Math.sin(tAll * 2 + i))) + ')'; ctx.fillRect(x,y,7.2,5.4); });
  CLOUDS.forEach(([x, y, s, v]) => cloud(((x + tAll * v) % (W + 300)) - 150, y, s));
}
// s scales the leaf: 1 for the big title-sign leaves, ~0.3 for the small button icons.
function leaf(x, y, a, s = 1) { ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle = '#3f9b3a'; ctx.strokeStyle = '#1f5a1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0,0,36 * s,16.2 * s,0,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }
function drawIcon(i, cx, cy) {
  ctx.lineWidth = 3;
  if (i === 0) { ctx.strokeStyle = '#2f7d2f'; ctx.beginPath(); ctx.moveTo(cx,cy + 14); ctx.lineTo(cx,cy - 2); ctx.stroke(); leaf(cx - 9, cy - 4, -0.5, 0.32); leaf(cx + 9, cy - 4, 0.5, 0.32); }
  else if (i === 1) { ctx.fillStyle = '#f0866e'; ctx.beginPath(); ctx.arc(cx,cy + 3,21.6,0,7); ctx.fill(); ctx.strokeStyle = '#8a3a2a'; ctx.stroke(); leaf(cx + 4, cy - 10, -0.6, 0.32); }
  else if (i === 2) { ctx.strokeStyle = '#555'; ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(cx,cy + 2,19.8,0,7); ctx.fill(); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 11, cy + 2 + Math.sin(a) * 11); ctx.lineTo(cx + Math.cos(a) * 16, cy + 2 + Math.sin(a) * 16); ctx.stroke(); } ctx.fillStyle = '#e8b968'; ctx.beginPath(); ctx.arc(cx,cy + 2,7.2,0,7); ctx.fill(); }
  else if (i === 4) { // level editor map icon
    ctx.strokeStyle = '#8a4a1c'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 11,cy - 9,22,18);
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - 11,cy - 9 + k * 6); ctx.lineTo(cx + 11,cy - 9 + k * 6); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - 11 + k * 11,cy - 9); ctx.lineTo(cx - 11 + k * 11,cy + 9); ctx.stroke(); }
    ctx.fillStyle = '#facc15'; ctx.fillRect(cx + 6,cy - 9,4,18);
  }
  else { ctx.fillStyle = '#8a4a1c'; ctx.fillRect(cx - 12,cy - 10,16,26); ctx.strokeStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(cx - 2,cy + 3); ctx.lineTo(cx + 16,cy + 3); ctx.moveTo(cx + 10,cy - 3); ctx.lineTo(cx + 16,cy + 3); ctx.lineTo(cx + 10,cy + 9); ctx.stroke(); }
}
function bigTitle(s, x, y, size) {
  ctx.font = '900 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  ctx.lineWidth = 12; ctx.strokeStyle = '#5a2a0a'; ctx.strokeText(s, x, y + 5);
  ctx.lineWidth = 12; ctx.strokeStyle = '#7a3a10'; ctx.strokeText(s, x, y);
  ctx.fillStyle = '#e8872b'; ctx.fillText(s, x, y);
  ctx.fillStyle = 'rgba(255,220,150,.45)'; ctx.fillText(s, x - 2, y - 2);
}
function drawMenu() {
  // title board (wide wooden sign, centered horizontally across the full screen)
  const bw = 500, bh = 230;
  const bx = fullW() / 2 - bw / 2, by = 45;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(bx + 6,by + 10,bw,bh,32.4); ctx.fill();
  ctx.fillStyle = '#c0702c'; rr(bx,by,bw,bh,32.4); ctx.fill();
  ctx.strokeStyle = '#7a3a10'; ctx.lineWidth = 4; rr(bx,by,bw,bh,32.4); ctx.stroke();
  ctx.fillStyle = '#e0b068'; rr(bx + 14,by + 14,bw - 28,bh - 28,18); ctx.fill();
  ctx.strokeStyle = 'rgba(122,58,16,.35)'; ctx.lineWidth = 2;
  for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(bx + 14,by + 14 + k * (bh - 28) / 5); ctx.lineTo(bx + bw - 14,by + 14 + k * (bh - 28) / 5); ctx.stroke(); }
  leaf(bx + 20, by + 18, -0.8); leaf(bx + bw - 20, by + 18, 0.8); leaf(bx + 30, by + bh - 14, 0.5); leaf(bx + bw - 30, by + bh - 14, -0.5); leaf(fullW() / 2, by - 4, -1.57);
  bigTitle('FARM', fullW() / 2, by + 22, 84);
  bigTitle('RUSH', fullW() / 2, by + 112, 84);
  // buttons
  const items = menuItems(), n = items.length, ICON = { 'NEW GAME': 0, 'LOAD': 1, 'LEVEL EDITOR': 4, 'OPTIONS': 2, 'EXIT': 3 };
  items.forEach((label, i) => {
    const r = btnRect(i, n), sel = i === menuSel, lift = sel ? -8 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(r.x + 3,r.y + 7,r.w,r.h,14.4); ctx.fill();
    ctx.fillStyle = sel ? '#f2b45a' : '#d99a4a'; rr(r.x,r.y + lift,r.w,r.h,14.4); ctx.fill();
    ctx.strokeStyle = sel ? '#fff7c2' : '#8a4a1c'; ctx.lineWidth = sel ? 4 : 3; rr(r.x,r.y + lift,r.w,r.h,14.4); ctx.stroke();
    ctx.strokeStyle = '#8a4a1c'; ctx.lineWidth = 2; rr(r.x + 6,r.y + 6 + lift,r.w - 12,r.h - 12,9); ctx.stroke();
    txt(label,r.x + r.w / 2,r.y + 14 + lift,label.length > 6 ? 17 : 22,'#fff','center');
    drawIcon(ICON[label], r.x + r.w / 2, r.y + 64 + lift);
  });
  txt('Left/Right + Enter,or click', fullW() / 2, 568, 13, '#fff', 'center');
  if (toastT > 0) txt(toastMsg, fullW() / 2, 720, 22, '#fff', 'center');
}
function woodBtn(r, label, sel, size = 22) {
  ctx.fillStyle = sel ? '#f2b45a' : '#d99a4a'; rr(r.x,r.y,r.w,r.h,14.4); ctx.fill();
  ctx.strokeStyle = sel ? '#fff7c2' : '#8a4a1c'; ctx.lineWidth = sel ? 4 : 3; rr(r.x,r.y,r.w,r.h,14.4); ctx.stroke();
  txt(label,r.x + r.w / 2,r.y + r.h / 2 - size / 2 - 2,size,'#fff','center');
}
function drawSlots() {
  txt(slotMode === 'new' ? 'CHOOSE A SAVE SLOT' : 'LOAD GAME', fullW() / 2, 66, 38, '#facc15', 'center');
  txt(slotMode === 'new' ? 'Pick an empty slot for your new farm' : 'Pick a save to continue  (X = delete)', fullW() / 2, 120, 16, '#fff', 'center');
  for (let i = 0; i < 3; i++) {
    const r = slotRect(i), d = readSlot(i), sel = i === slotSel, lift = sel ? -8 : 0, cx = r.x + r.w / 2;
    ctx.globalAlpha = (slotMode === 'new' && d) || (slotMode === 'load' && !d) ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(r.x + 4,r.y + 8,r.w,r.h,18); ctx.fill();
    ctx.fillStyle = sel ? '#f2b45a' : '#d99a4a'; rr(r.x,r.y + lift,r.w,r.h,18); ctx.fill();
    ctx.strokeStyle = sel ? '#fff7c2' : '#8a4a1c'; ctx.lineWidth = sel ? 4 : 3; rr(r.x,r.y + lift,r.w,r.h,18); ctx.stroke();
    txt('SLOT ' + (i + 1), cx, r.y + 16 + lift, 24, '#fff', 'center');
    if (d) {
      const st = d.stars || [], cleared = st.filter(v => v > 0).length, total = st.reduce((a, b) => a + (b || 0), 0);
      txt('Levels: ' + cleared + '/' + LEVELS.length,cx,r.y + 70 + lift,18,'#fff','center');
      txt('Stars: ' + total,cx,r.y + 100 + lift,18,'#fde68a','center');
      txt('Coins: ' + d.money,cx,r.y + 130 + lift,18,'#fff','center');
    } else txt('EMPTY',cx,r.y + 100 + lift,28,'#e5e7eb','center');
    ctx.globalAlpha = 1;
    if (slotMode === 'load' && d) { const b = delRect(i); ctx.fillStyle = '#b91c1c'; rr(b.x,b.y,b.w,b.h,8); ctx.fill(); txt('DELETE',b.x + b.w / 2,b.y + 8,16,'#fff','center'); }
  }
  woodBtn(slotBack(), 'BACK', false);
  if (toastT > 0) txt(toastMsg, fullW() / 2, 425, 20, '#fff', 'center');
}
function drawLevels() {
  ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(180, fullH() + 40, 345, 150, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(650, fullH() + 60, 315, 150, 0, 0, 7); ctx.fill();
  txt('SELECT LEVEL', fullW() / 2, 22, 34, '#facc15', 'center');
  txt('Coins: ' + money, fullW() / 2, 64, 18, '#fff', 'center');
  ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5; ctx.beginPath();
  LEVELS.forEach((_, i) => { const q = levelPos(i); if (i) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y); }); ctx.stroke(); ctx.setLineDash([]);
  LEVELS.forEach((L, i) => {
    const q = levelPos(i), lock = !unlocked(i), sel = i === lvSel, st = stars[i] || 0, R = sel ? 52 : 46;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(q.x + 3,q.y + 6,R,0,7); ctx.fill();
    ctx.fillStyle = lock ? '#6b7280' : st ? '#f59e0b' : '#3b82f6'; ctx.beginPath(); ctx.arc(q.x,q.y,R,0,7); ctx.fill();
    ctx.strokeStyle = sel ? '#fff7c2' : '#fff'; ctx.lineWidth = sel ? 6 : 4; ctx.stroke();
    txt(String(i + 1), q.x, q.y - 26, 40, lock ? '#d1d5db' : '#fff', 'center');
    if (lock) { ctx.fillStyle = '#e5e7eb'; ctx.fillRect(q.x - 10,q.y + 16,20,16); ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x,q.y + 16,7,Math.PI,0); ctx.stroke(); }
    for (let k = 0; k < 3; k++) txt('\u2605',q.x + (k - 1) * 26, q.y + R + 6, 24, k < st ? '#facc15' : '#4b5563', 'center');
  });
  const L = LEVELS[lvSel];
  txt('Level ' + (lvSel + 1) + ': ' + L.name, fullW() / 2, 520, 22, '#fff', 'center');
  txt('Target ' + L.target + ' coins  |  ' + L.time + 's  |  ' + L.weather.toUpperCase(), fullW() / 2, 550, 16, '#fef9c3', 'center');
  woodBtn(lvMenuRect, 'MENU', false, 18); woodBtn(lvShopRect, 'MERCHANT [B]', false, 18);
  if (toastT > 0) txt(toastMsg, fullW() / 2, 180, 20, '#fff', 'center');
}
function drawDialog() {
  // Dialog centered horizontally across the full screen
  const dw = 480, dh = 230;
  const dx = fullW() / 2 - dw / 2;
  const dy = 200;
  ctx.fillStyle = '#c0702c'; rr(dx, dy, dw, dh, 16); ctx.fill();
  ctx.strokeStyle = '#7a3a10'; ctx.lineWidth = 4; rr(dx, dy, dw, dh, 16); ctx.stroke();
  ctx.fillStyle = '#e0b068'; rr(dx + 14, dy + 14, dw - 28, dh - 28, 10); ctx.fill();
  txt(dlg.msg, fullW() / 2, 255, 30, '#5a2a0a', 'center');
  woodBtn({ x: dx + 70, y: 340, w: 140, h: 50 }, 'YES', dlg.sel === 0);
  woodBtn({ x: dx + 270, y: 340, w: 140, h: 50 }, 'NO', dlg.sel === 1);
}
function drawBack(s) { if (s === 'SLOTS') drawSlots(); else drawMenu(); }
const owned = it => it.kind === 'level' ? (boost[it.id] ? 1 : 0) : up[it.id];
function buyMerchant(i) {
  const it = SHOP[i]; if (!it) return;
  if (owned(it) >= it.max) toast(it.kind === 'level' ? 'Already ready for the next level' : 'Sold out!');
  else if (money < cost(it)) toast('Not enough coins');
  else { money -= cost(it); if (it.kind === 'level') boost[it.id] = true; else up[it.id]++; toast('Bought: ' + it.name); saveGame(); }
}
function buyGrocer(i) {
  const it = GROCER[i]; if (!it) return;
  if (it.once && lb[it.id]) return toast('Already active this level');
  if (money < it.price) return toast('Not enough coins');
  if (it.id === 'pawang' || it.id === 'air') {
    if (weather() === 'rain') return toast('It is already raining!');
    money -= it.price;
    if (it.id === 'air' || Math.random() < 0.4) { rainTimer = 20; toast(it.id === 'air' ? 'Air support! Rain incoming!' : 'The Pawang succeeded! Rain incoming!'); }
    else toast('The Pawang failed... sky stays dry.');
  } else {
    money -= it.price; lb[it.id] = true;
    if (it.id === 'time') timeLeft += 10;
    toast('Bought: ' + it.name);
  }
  saveGame();
}
const rowRect = i => ({ x: 90, y: 150 + i * 40, w: 620, h: 36 });
const shopBack = () => { const cx = fullW() / 2; return { x: cx - 110, y: 500, w: 220, h: 46 }; };
function drawRow(i, label, right, col) {
  const r = rowRect(i);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(r.x,r.y,r.w,r.h,10.8); ctx.fill();
  txt('[' + (i + 1) + '] ' + label, r.x + 12, r.y + 8, 18, col);
  txt(right,r.x + r.w - 12,r.y + 8,18,col,'right');
}
function drawMerchant() {
  panel(0.93);
  if (lastResult) txt(lastResult, fullW() / 2, 16, 15, '#4ade80', 'center');
  txt('Merchant', fullW() / 2, 46, 34, '#facc15', 'center');
  txt('Coins: ' + money + '    Permanent upgrades & one-level boosts', fullW() / 2, 100, 16, '#fff', 'center');
  SHOP.forEach((it, i) => {
    const sold = owned(it) >= it.max, tag = it.kind === 'level' ? 'NEXT LEVEL' : 'PERMANENT';
    const col = sold ? '#6b7280' : money >= cost(it) ? '#fff' : '#f87171';
    drawRow(i, it.name + '  (' + tag + ')', sold ? (it.kind === 'level' ? 'READY' : 'MAX') : cost(it) + ' coins', col);
  });
  woodBtn(shopBack(), 'CONTINUE', true, 20);
  if (toastT > 0) txt(toastMsg, fullW() / 2, 460, 18, '#fde68a', 'center');
}
function drawGrocer() {
  panel(0.88);
  txt('Grocer Stall', fullW() / 2, 46, 34, '#facc15', 'center');
  txt('Lasts until this level ends    |    Coins: ' + money, fullW() / 2, 100, 16, '#fff', 'center');
  GROCER.forEach((it, i) => {
    const done = it.once && lb[it.id], col = done ? '#6b7280' : money >= it.price ? '#fff' : '#f87171';
    drawRow(i, it.name, done ? 'ACTIVE' : it.price + ' coins', col);
  });
  woodBtn(shopBack(), 'CLOSE [E]', true, 20);
  if (toastT > 0) txt(toastMsg, fullW() / 2, 460, 18, '#fde68a', 'center');
}
function drawOptions() {
  txt('OPTIONS', fullW() / 2, 90, 44, '#facc15', 'center');
  OPT_ROWS.forEach(([label, key], i) => {
    const r = optRect(i);
    ctx.fillStyle = '#d99a4a'; rr(r.x, r.y, r.w, r.h, 14.4); ctx.fill(); ctx.strokeStyle = '#8a4a1c'; ctx.lineWidth = 3; rr(r.x, r.y, r.w, r.h, 14.4); ctx.stroke();
    txt('[' + (i + 1) + '] ' + label, r.x + 18, r.y + 14, 20, '#fff');
    txt(opts[key] ? 'ON' : 'OFF', r.x + r.w - 18, r.y + 14, 20, opts[key] ? '#bbf7d0' : '#fecaca', 'right');
  });
  const b = backRect();
  ctx.fillStyle = '#f2b45a'; rr(b.x, b.y, b.w, b.h, 14.4); ctx.fill(); ctx.strokeStyle = '#fff7c2'; ctx.lineWidth = 3; rr(b.x, b.y, b.w, b.h, 14.4); ctx.stroke();
  txt('BACK', b.x + b.w / 2, b.y + 14, 22, '#fff', 'center');
  txt('Esc or Enter to go back', fullW() / 2, 520, 14, '#fff', 'center');
}

