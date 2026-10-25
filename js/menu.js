// ---------- Menu, options, saves ----------
const opts = (() => { try { return Object.assign({ camera: true, flash: true }, JSON.parse(localStorage.getItem('farmrush_opts') || '{}')); } catch (_) { return { camera: true, flash: true }; } })();
const OPT_ROWS = [['Camera sway & shake', 'camera'], ['Lightning flash', 'flash']];
function saveOpts() { try { localStorage.setItem('farmrush_opts', JSON.stringify(opts)); } catch (_) {} }

const SLOT_KEY = n => 'farmrush_slot_' + n;
function readSlot(n) { try { return JSON.parse(localStorage.getItem(SLOT_KEY(n))); } catch (_) { return null; } }
function anySave() { return [0, 1, 2].some(n => readSlot(n)); }
let curSlot = null, stars = [], lvSel = 0, menuSel = 0, slotMode = 'new', slotSel = 0, dlg = null;
function saveGame() { if (curSlot === null) return; try { localStorage.setItem(SLOT_KEY(curSlot), JSON.stringify({ money, up, seed, stars, boost })); } catch (_) {} }
const unlocked = i => i === 0 || (stars[i - 1] || 0) > 0;
function goLevels() { state = 'LEVELS'; let s = 0; while (s < LEVELS.length - 1 && (stars[s] || 0) > 0) s++; lvSel = s; }
function newInSlot(n) { curSlot = n; money = 30; boost = { drink: false, time: false }; up = { bag: 0, boots: 0, fert: 0, corn: 0, melon: 0 }; seed = 'tomato'; stars = []; saveGame(); goLevels(); }
function loadSlot(n) { const d = readSlot(n); curSlot = n; money = d.money; up = d.up; seed = d.seed || 'tomato'; stars = d.stars || []; boost = d.boost || { drink: false, time: false }; goLevels(); }

function ask(msg, yes, back) { dlg = { msg, yes, back, sel: 0 }; state = 'CONFIRM'; }
function closeDlg(yes) { const d = dlg; dlg = null; if (yes) d.yes(); else state = d.back; }
function menuItems() { return ['NEW GAME'].concat(anySave() ? ['LOAD'] : [], ['LEVEL EDITOR', 'OPTIONS', 'EXIT']); }
function menuActivate(label) {
  if (label === 'NEW GAME') ask('Start a new game?', () => { slotMode = 'new'; slotSel = 0; state = 'SLOTS'; }, 'MENU');
  else if (label === 'LOAD') { slotMode = 'load'; slotSel = 0; state = 'SLOTS'; }
  else if (label === 'LEVEL EDITOR') edNew();
  else if (label === 'OPTIONS') state = 'OPTIONS';
  else { try { window.close(); } catch (_) {} state = 'EXIT'; }
}
function slotPick(i) {
  const d = readSlot(i);
  if (slotMode === 'new') { if (d) toast('Slot in use - pick an empty slot'); else newInSlot(i); }
  else { if (!d) toast('That slot is empty'); else loadSlot(i); }
}
function slotDelete(i) {
  if (slotMode !== 'load' || !readSlot(i)) return;
  ask('Delete Slot ' + (i + 1) + '?', () => {
    try { localStorage.removeItem(SLOT_KEY(i)); } catch (_) {}
    if (anySave()) state = 'SLOTS'; else { menuSel = 0; state = 'MENU'; }
  }, 'SLOTS');
}
function lvPick(i) { if (!unlocked(i)) toast('Locked - clear the previous level first'); else { li = i; state = 'INTRO'; } }

// All UI rects below are in the logical 800x600 space (W x H).
const btnRect = (i, n) => { const bw = 125, bh = 95, gap = 14, x0 = (W - (n * bw + (n - 1) * gap)) / 2; return { x: x0 + i * (bw + gap), y: 450, w: bw, h: bh }; };
const optRect = i => ({ x: 200, y: 200 + i * 70, w: 400, h: 54 });
const backRect = { x: 300, y: 420, w: 200, h: 54 };
const slotRect = i => ({ x: 60 + i * 240, y: 170, w: 220, h: 230 });
const delRect = i => { const r = slotRect(i); return { x: r.x + 30, y: r.y + 185, w: 160, h: 34 }; };
const slotBack = { x: 300, y: 470, w: 200, h: 50 };
const lvMenuRect = { x: 20, y: 20, w: 120, h: 42 };
const lvShopRect = { x: W - 190, y: 20, w: 170, h: 42 };
const yesRect = { x: 230, y: 340, w: 140, h: 50 };
const noRect = { x: 430, y: 340, w: 140, h: 50 };
const levelPos = i => ({ x: 130 + (i % 4) * 180, y: 260 + Math.floor(i / 4) * 170 + ((i % 4) % 2 ? -40 : 40) });
const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

cv.addEventListener('mousemove', e => {
  const p = mpos(e);
  if (state === 'MENU') { const n = menuItems().length; for (let i = 0; i < n; i++) if (inR(p, btnRect(i, n))) menuSel = i; }
  else if (state === 'SLOTS') { for (let i = 0; i < 3; i++) if (inR(p, slotRect(i))) slotSel = i; }
  else if (state === 'LEVELS') { LEVELS.forEach((_, i) => { const q = levelPos(i); if (Math.hypot(p.x - q.x, p.y - q.y) < 48) lvSel = i; }); }
  else if (state === 'CONFIRM') { if (inR(p, yesRect)) dlg.sel = 0; if (inR(p, noRect)) dlg.sel = 1; }
});
cv.addEventListener('click', e => {
  const p = mpos(e);
  if (state === 'SHOP') { SHOP.forEach((_, i) => { if (inR(p, rowRect(i))) buyMerchant(i); }); if (inR(p, shopBack)) goLevels(); return; }
  if (state === 'GROCER') { GROCER.forEach((_, i) => { if (inR(p, rowRect(i))) buyGrocer(i); }); if (inR(p, shopBack)) state = 'PLAYING'; return; }
  if (state === 'MENU') { const items = menuItems(), n = items.length; for (let i = 0; i < n; i++) if (inR(p, btnRect(i, n))) { menuSel = i; menuActivate(items[i]); return; } }
  else if (state === 'CONFIRM') { if (inR(p, yesRect)) closeDlg(true); else if (inR(p, noRect)) closeDlg(false); }
  else if (state === 'SLOTS') {
    if (inR(p, slotBack)) { state = 'MENU'; return; }
    for (let i = 0; i < 3; i++) {
      if (slotMode === 'load' && readSlot(i) && inR(p, delRect(i))) { slotDelete(i); return; }
      if (inR(p, slotRect(i))) { slotSel = i; slotPick(i); return; }
    }
  }
  else if (state === 'LEVELS') {
    if (inR(p, lvMenuRect)) { state = 'MENU'; return; }
    if (inR(p, lvShopRect)) { lastResult = ''; state = 'SHOP'; return; }
    LEVELS.forEach((_, i) => { const q = levelPos(i); if (Math.hypot(p.x - q.x, p.y - q.y) < 48) { lvSel = i; lvPick(i); } });
  }
  else if (state === 'OPTIONS') {
    OPT_ROWS.forEach((o, i) => { if (inR(p, optRect(i))) { opts[o[1]] = !opts[o[1]]; saveOpts(); } });
    if (inR(p, backRect)) state = 'MENU';
  } else if (state === 'EXIT') state = 'MENU';
});

let drops = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 600 + Math.random() * 400 }));
let drips = [];

const maxBag = () => 4 + up.bag + (lb.bag ? 2 : 0);
const speed = () => 150 * (1 + up.boots * 0.06) * (weather() === 'rain' && LEVELS[li].heavy ? 0.8 : 1) * (lb.shoes ? 1.15 : 1) * (ab.drink ? 1.12 : 1);
const growMul = () => (1 + up.fert * 0.06) * ({ rain: 1.3, dry: 0.6, clear: 1 }[weather()]) * (lb.fert ? 1.25 : 1) * (frostTimer > 0 ? 0.4 : 1) * (growthTimer > 0 ? 2 : 1);
function weather() {
  if (droughtTimer > 0) return 'dry';
  return rainTimer > 0 || LEVELS[li].weather === 'rain' ? 'rain' : LEVELS[li].weather;
}
const cost = it => Math.round(it.base * (1 + (it.kind === 'level' ? 0 : up[it.id]) * 0.8));
function toast(m) { toastMsg = m; toastT = 2.2; }

function startLevel() {
  const L = LEVELS[li];
  crops = {}; timeLeft = L.time; earned = 0; rainTimer = 0; rainCd = 0; flash = 0; nextBolt = 6 + Math.random() * 6;
  evFired = {}; pestTimer = 0; frostTimer = 0; droughtTimer = 0; growthTimer = 0; elapsedTime = 0;
  const sp = startPos();
  player.x = sp.x; player.y = sp.y; player.facing = 'DOWN'; player.bag = []; drips = [];
  if (!up[seed] && seed !== 'tomato') seed = 'tomato';
  lb = {}; ab = boost; boost = { drink: false, time: false }; if (ab.time) timeLeft += 10; camX = camY = 0; saveGame();
  state = 'PLAYING';
}
// ---------- Level map helpers ----------
// Editor-authored levels carry `land` (rect), `ground`, `plots`, `objects`.
// Built-in levels have none, so they fall back to the legacy centered rect.
function landOrigin(L) {
  const land = L && L.land;
  if (!land) return null;
  const ox = Math.floor((land.offset ? land.offset.x : 0) / T);
  const oy = Math.floor((land.offset ? land.offset.y : 0) / T);
  return { c: ox, r: oy, w: land.w, h: land.h };
}
function plot() {
  const L = LEVELS[li];
  const o = landOrigin(L);
  if (o) return { c0: o.c, r0: o.r, c1: o.c + o.w - 1, r1: o.r + o.h - 1 };
  const c0 = Math.floor((COLS - L.pw) / 2), r0 = 3;
  return { c0, r0, c1: c0 + L.pw - 1, r1: r0 + L.ph - 1 };
}
function paintedPlots() {
  const L = LEVELS[li];
  return (L.plots && L.plots.length) ? L.plots : null;
}
function isDirt(c, r) {
  const pp = paintedPlots();
  if (pp) { for (const p of pp) if (p.c === c && p.r === r) return true; return false; }
  const p = plot();
  return c >= p.c0 && c <= p.c1 && r >= p.r0 && r <= p.r1;
}
function lvlGround(c, r) {
  const L = LEVELS[li];
  if (!L.ground) return 'grass';
  return L.ground[keyOf(c, r)] || 'grass';
}
function lvlObjects() { return LEVELS[li].objects || {}; }
function lvlObjectAt(c, r) { return lvlObjects()[keyOf(c, r)] || null; }
function binTile() { const L = LEVELS[li]; return L.bin || bin; }
function grocerTile() { const L = LEVELS[li]; return L.grocer || GROCER_TILE; }
function startPos() { const L = LEVELS[li]; return L.start || { x: 385, y: 140 }; }
function target() {
  let c = Math.floor((player.x + 15) / T), r = Math.floor((player.y + 15) / T);
  if (player.facing === 'UP') r--; if (player.facing === 'DOWN') r++;
  if (player.facing === 'LEFT') c--; if (player.facing === 'RIGHT') c++;
  return { c: Math.max(0, Math.min(COLS - 1, c)), r: Math.max(0, Math.min(ROWS - 1, r)) };
}

