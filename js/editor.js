// ---------- Level Editor (dev / overgrown) ----------
// Reuses canvas globals (cv, ctx, T, W, H, COLS, ROWS) from data.js and LEVELS array.
const EDITOR_KEY = 'overgrown_levels';
// GROUND_TYPES / OBJECT_TYPES / EVENT_TYPES / findType / keyOf / parseKey
// now live in data.js so the runtime and the editor share one source of truth.
function clampLand(l) {
  // the playfield is a COLS x ROWS grid, so land can never be bigger than that
  l.w = Math.max(3, Math.min(COLS, Math.round(l.w) || 3));
  l.h = Math.max(3, Math.min(ROWS, Math.round(l.h) || 3));
  return l;
}
function newLevelDef(name) {
  return {
    name: name || 'New Level', time: 60, target: 150, weather: 'clear',
    land: { w: 10, h: 8, offset: { x: 150, y: 100 } }, fence: true,
    plots: [], ground: {}, objects: {},
    events: [{ id: 'rain', time: 20, chance: 0.5, random: true, enabled: true }],
    start: { x: 170, y: 170 },
  };
}
// Migrate a level that has no editor fields yet (built-in levels) into the
// editor format so every level can be opened and edited.
function edMigrate(l) {
  if (!l || typeof l !== 'object') l = {};
  if (!l.land || typeof l.land !== 'object') {
    // Keep built-in levels looking the same: the legacy plot was a centered
    // rect starting at row 3, so derive an equivalent land offset for it.
    const w = Math.max(3, l.pw || 8), h = Math.max(3, l.ph || 8);
    const c0 = Math.floor((COLS - w) / 2);
    l.land = { w, h, offset: { x: c0 * T, y: 3 * T } };
  }
  if (!l.land.offset || typeof l.land.offset !== 'object') l.land.offset = { x: 140, y: 120 };
  if (typeof l.land.offset.x !== 'number' || !isFinite(l.land.offset.x)) l.land.offset.x = 140;
  if (typeof l.land.offset.y !== 'number' || !isFinite(l.land.offset.y)) l.land.offset.y = 120;
  if (!l.land.w) l.land.w = l.land.h || 8;
  if (!l.land.h) l.land.h = l.land.w || 8;
  clampLand(l.land);
  if (typeof l.fence !== 'boolean') l.fence = true;
  if (!l.start || typeof l.start !== 'object') l.start = { x: l.land.offset.x + 30, y: l.land.offset.y + 50 };
  if (!l.objects || typeof l.objects !== 'object' || Array.isArray(l.objects)) l.objects = {};
  if (!l.ground || typeof l.ground !== 'object' || Array.isArray(l.ground)) l.ground = {};
  if (!Array.isArray(l.plots)) l.plots = [];
  if (!Array.isArray(l.events)) l.events = [];
  return l;
}
// Guarantee the level being edited has every field the editor touches.
// ed.lvl can be swapped or reloaded at any time, so every entry point
// that reads it must run this first.
function edEnsure() {
  if (!ed.lvl || typeof ed.lvl !== 'object') ed.lvl = newLevelDef('New Level');
  edMigrate(ed.lvl);
  return ed.lvl;
}
let ed = {
  open: false, mode: 'MAP', idx: null, lvl: null,
  tool: 'paint', layer: 0, brush: 'grass',
  mx: 0, my: 0, cx: 0, cy: 0, drag: false,
  msg: '', msgT: 0, selEvent: -1,
};
function edMsg(m) { ed.msg = m; ed.msgT = 2.5; }
function edOpen(idx) {
  ed.open = true; ed.idx = idx;
  ed.lvl = (idx === null || idx === -1) ? newLevelDef('New Level') : JSON.parse(JSON.stringify(LEVELS[idx]));
  edEnsure();
  ed.mode = 'MAP'; ed.tool = 'paint'; ed.layer = 0; ed.brush = 'grass'; ed.selEvent = -1;
  state = 'EDITOR';
}
function edClose() { ed.open = false; state = 'MENU'; }
function edSave() {
  const l = edEnsure();
  l.time = Math.max(5, Math.round(l.time)); l.target = Math.max(0, Math.round(l.target));
  clampLand(l.land);
  l.pw = l.land.w; l.ph = l.land.h;
  edSyncObjects(l);
  if (ed.idx !== null && ed.idx >= 0 && ed.idx < LEVELS.length) LEVELS[ed.idx] = l;
  else { LEVELS.push(l); ed.idx = LEVELS.length - 1; }
  try { localStorage.setItem(EDITOR_KEY, JSON.stringify(LEVELS)); } catch (_) {}
  edMsg('Level saved.');
}
// Derive the runtime anchors (start / bin / grocer) from the painted objects
// so what the designer places on the map is what the player actually uses.
function edSyncObjects(l) {
  const objs = l.objects || (l.objects = {});
  const land = l.land;
  if (!land.offset) land.offset = { x: 0, y: 0 };
  const ox = Math.floor(land.offset.x / T);
  const oy = Math.floor(land.offset.y / T);
  const onCanvas = q => q && q.c >= 0 && q.c < COLS && q.r >= 0 && q.r < ROWS;
  // collect every tile holding this object id
  const all = id => { const a = []; for (const k in objs) if (objs[k] === id) a.push(parseKey(k)); return a; };
  // prefer a tile that is actually on the canvas
  const pick = id => { const a = all(id); return a.find(onCanvas) || null; };
  const b = pick('bin'), g = pick('grocer'), s = pick('start');
  const db = { col: ox + Math.floor(land.w / 2), row: oy };
  const dg = { col: ox + Math.min(land.w - 1, Math.floor(land.w / 2) + 2), row: oy };
  l.bin = b ? { col: b.c, row: b.r } : db;
  l.grocer = g ? { col: g.c, row: g.r } : dg;
  // clamp the spawn point so the player always starts on the canvas
  const sx = s ? s.c * T + 10 : ox * T + 10;
  const sy = s ? s.r * T + 10 : oy * T + 10;
  l.start = {
    x: Math.max(0, Math.min(W - 30, sx)),
    y: Math.max(0, Math.min(H - 30, sy)),
  };
  // keep only one bin / grocer / start in the object map (the one we picked)
  const keep = { bin: b, grocer: g, start: s };
  for (const id of ['bin', 'grocer', 'start']) {
    for (const q of all(id)) {
      if (!keep[id] || q.c !== keep[id].c || q.r !== keep[id].r) delete objs[keyOf(q.c, q.r)];
    }
  }
}
function edLoadSaved() {
  try { const s = localStorage.getItem(EDITOR_KEY); if (s) { const a = JSON.parse(s); if (Array.isArray(a)) { LEVELS.splice(0, LEVELS.length, ...a); } } } catch (_) {}
}
// helpers
function groundAt(c, r) { const k = keyOf(c, r); const gr = edEnsure().ground; return gr[k] || 'grass'; }
function setGround(c, r, v) { const gr = edEnsure().ground; const k = keyOf(c, r); if (v === 'grass' || v === null) delete gr[k]; else gr[k] = v; }
function togglePlot(c, r) {
  const pl = edEnsure().plots;
  const i = pl.findIndex(p => p.c === c && p.r === r);
  if (i >= 0) pl.splice(i, 1); else pl.push({ c, r });
}
function setObject(c, r, v) { const ob = edEnsure().objects; const k = keyOf(c, r); if (!v) delete ob[k]; else ob[k] = v; }
// The brush palette depends on the active layer.
function edBrushes() {
  if (ed.layer === 0) return GROUND_TYPES.map(t => t.id);
  if (ed.layer === 2) return OBJECT_TYPES.map(t => t.id);
  return ['plot'];
}
function edCycleBrush() {
  const list = edBrushes();
  const i = list.indexOf(ed.brush);
  ed.brush = list[(i + 1) % list.length];
  let name = ed.brush;
  if (ed.layer === 0) name = findType(GROUND_TYPES, ed.brush).name;
  else if (ed.layer === 2) name = findType(OBJECT_TYPES, ed.brush).name;
  else name = 'Plot';
  edMsg('Brush ' + name);
}
function inLand(c, r) {
  const L = edEnsure().land;
  const ox = Math.floor(L.offset.x / T), oy = Math.floor(L.offset.y / T);
  return c >= ox && c < ox + L.w && r >= oy && r < oy + L.h;
}
// input
addEventListener('mousemove', e => {
  if (!ed.open) return;
  const mp = mpos(e);
  ed.mx = mp.x - viewOX / viewSX; ed.my = mp.y - viewOY / viewSY;
  if (ed.mode === 'MAP') edPointer(ed.mx, ed.my);
});
cv.addEventListener('mousedown', e => {
  if (!ed.open || ed.mode !== 'MAP') return;
  const mp = mpos(e);
  const mx = mp.x - viewOX / viewSX, my = mp.y - viewOY / viewSY;
  if (my < 40) { edToolbarClick(mx); return; }
  ed.drag = true; ed.lastPaint = null; edPointer(mx, my);
});
cv.addEventListener('mouseup', () => { ed.drag = false; });
addEventListener('keydown', e => {
  if (!ed.open) return;
  if (e.code === 'Escape') { edClose(); return; }
  if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); edSave(); return; }
  if (ed.mode === 'MAP') {
    if (e.code === 'Digit1') { ed.layer = 0; ed.brush = 'grass'; edMsg('Layer GROUND'); }
    else if (e.code === 'Digit2') { ed.layer = 1; ed.brush = 'plot'; edMsg('Layer PLOTS'); }
    else if (e.code === 'Digit3') { ed.layer = 2; ed.brush = 'tree'; edMsg('Layer OBJECTS'); }
    else if (e.code === 'KeyE') { ed.tool = ed.tool === 'paint' ? 'erase' : 'paint'; edMsg('Tool ' + ed.tool); }
    else if (e.code === 'KeyB') edCycleBrush();
    else if (e.code === 'KeyC') ed.mode = 'CFG';
    else if (e.code === 'KeyV') ed.mode = 'EVT';
    else if (e.code === 'KeyS') edSave();
    else if (e.code === 'KeyT') edTest();
    else if (e.code === 'Backspace') {
      if (ed.layer === 0) setGround(ed.cx, ed.cy, null);
      else if (ed.layer === 1) { const pl = edEnsure().plots; const i = pl.findIndex(p => p.c === ed.cx && p.r === ed.cy); if (i >= 0) pl.splice(i, 1); }
      else setObject(ed.cx, ed.cy, null);
    }
  } else if (ed.mode === 'CFG') {
    if (e.code === 'KeyA') edCfgDelta('w-');
    if (e.code === 'KeyD') edCfgDelta('w+');
    if (e.code === 'KeyW') edCfgDelta('h-');
    if (e.code === 'KeyS') edCfgDelta('h+');
    if (e.code === 'ArrowLeft') edCfgDelta('ox-');
    if (e.code === 'ArrowRight') edCfgDelta('ox+');
    if (e.code === 'ArrowUp') edCfgDelta('oy-');
    if (e.code === 'ArrowDown') edCfgDelta('oy+');
    if (e.code === 'KeyF') { const L = edEnsure(); L.fence = !L.fence; edMsg('Fence ' + (L.fence ? 'ON' : 'OFF')); }
    if (e.code === 'KeyM') ed.mode = 'MAP';
  } else if (ed.mode === 'EVT') {
    const EVT = edEnsure().events;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { ed.selEvent--; if (ed.selEvent < 0) ed.selEvent = EVT.length - 1; }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { ed.selEvent++; if (ed.selEvent >= EVT.length) ed.selEvent = 0; }
    // read the (possibly newly selected) event after the selection changed
    const ev = EVT[ed.selEvent];
    if (ev) {
      if (typeof ev.time !== 'number') ev.time = 20;
      if (typeof ev.chance !== 'number') ev.chance = 1;
      if (typeof ev.enabled !== 'boolean') ev.enabled = true;
      if (typeof ev.random !== 'boolean') ev.random = false;
    }
    if (e.code === 'KeyR') { if (ev) ev.random = !ev.random; edMsg('Random ' + (ev ? (ev.random ? 'ON' : 'OFF') : '-')); }
    if (e.code === 'KeyA') { EVT.push({ id: 'rain', time: 20, chance: 0.5, random: true, enabled: true }); ed.selEvent = EVT.length - 1; edMsg('Event added'); }
    if (e.code === 'Delete' || e.code === 'Backspace') { if (EVT.length) { EVT.splice(ed.selEvent, 1); if (ed.selEvent >= EVT.length) ed.selEvent = Math.max(0, EVT.length - 1); } }
    if (ev) {
      // cycle the event type
      if (e.code === 'KeyT') {
        const ids = EVENT_TYPES.map(t => t.id);
        ev.id = ids[(ids.indexOf(ev.id) + 1) % ids.length];
        edMsg('Type ' + ev.id);
      }
      // trigger time
      if (e.code === 'BracketLeft') { ev.time = Math.max(0, ev.time - 5); edMsg('Time ' + ev.time + 's'); }
      if (e.code === 'BracketRight') { ev.time = Math.min(600, ev.time + 5); edMsg('Time ' + ev.time + 's'); }
      // trigger chance
      if (e.code === 'Comma') { ev.chance = Math.max(0, Math.round((ev.chance - 0.1) * 10) / 10); edMsg('Chance ' + Math.round(ev.chance * 100) + '%'); }
      if (e.code === 'Period') { ev.chance = Math.min(1, Math.round((ev.chance + 0.1) * 10) / 10); edMsg('Chance ' + Math.round(ev.chance * 100) + '%'); }
      // enable / disable
      if (e.code === 'KeyE') { ev.enabled = !ev.enabled; edMsg('Event ' + (ev.enabled ? 'ON' : 'OFF')); }
    }
    if (e.code === 'KeyM') ed.mode = 'MAP';
  }
});
function edPointer(cx, cy) {
  const tX = Math.floor(cx / T), tY = Math.floor(cy / T);
  ed.cx = tX; ed.cy = tY;
  if (!ed.drag) return;
  // avoid re-applying to the same tile while the mouse hovers
  const key = tX + ',' + tY;
  if (ed.lastPaint === key) return;
  ed.lastPaint = key;
  if (ed.layer === 0) { if (ed.tool === 'erase') setGround(tX, tY, null); else setGround(tX, tY, ed.brush); }
  else if (ed.layer === 1) { if (ed.tool === 'erase') { const pl = edEnsure().plots; const i = pl.findIndex(p => p.c === tX && p.r === tY); if (i >= 0) pl.splice(i, 1); } else togglePlot(tX, tY); }
  else { if (ed.tool === 'erase') setObject(tX, tY, null); else setObject(tX, tY, ed.brush); }
}
// Toolbar geometry shared by edToolbarClick() and edDrawToolbar(): 10 buttons must fit in W.
const ED_TB = { bw: 74, gap: 3, x0: 8, y: 6, h: 30 };
function edToolbarClick(mx) {
  const bw = ED_TB.bw, gap = ED_TB.gap, x0 = ED_TB.x0;
  const items = ['LAYR','TOOL','LAND','FENCE','TIME','TARGET','EVENT','SAVE','TEST','BACK'];
  for (let i = 0; i < items.length; i++) { const x = x0 + i * (bw + gap); if (mx >= x && mx <= x + bw) { edToolbarAct(items[i]); return; } }
}
function edToolbarAct(id) {
  if (id === 'LAYR') {
    ed.layer = (ed.layer + 1) % 3;
    ed.brush = ed.layer === 0 ? 'grass' : ed.layer === 1 ? 'plot' : 'tree';
    edMsg('Layer ' + ['GROUND', 'PLOTS', 'OBJECTS'][ed.layer]);
  }
  else if (id === 'TOOL') { ed.tool = ed.tool === 'paint' ? 'erase' : 'paint'; edMsg('Tool ' + ed.tool); }
  else if (id === 'LAND') ed.mode = 'CFG';
  else if (id === 'FENCE') { const L = edEnsure(); L.fence = !L.fence; edMsg('Fence ' + (L.fence ? 'ON' : 'OFF')); }
  else if (id === 'TIME') { const L = edEnsure(); L.time += 10; if (L.time > 300) L.time = 10; edMsg('Time ' + L.time + 's'); }
  else if (id === 'TARGET') { const L = edEnsure(); L.target += 50; if (L.target > 2000) L.target = 50; edMsg('Target ' + L.target); }
  else if (id === 'EVENT') ed.mode = 'EVT';
  else if (id === 'SAVE') edSave();
  else if (id === 'TEST') edTest();
  else if (id === 'BACK') edClose();
}
function edCfgDelta(d) {
  const L = edEnsure(), land = L.land;
  const step = 10;
  if (d === 'w-') land.w--; else if (d === 'w+') land.w++;
  else if (d === 'h-') land.h--; else if (d === 'h+') land.h++;
  else if (d === 'ox-') land.offset.x -= step; else if (d === 'ox+') land.offset.x += step;
  else if (d === 'oy-') land.offset.y -= step; else if (d === 'oy+') land.offset.y += step;
  clampLand(land);
  // keep the land rect fully on the canvas
  land.offset.x = Math.max(0, Math.min(W - land.w * T, land.offset.x));
  land.offset.y = Math.max(0, Math.min(H - land.h * T, land.offset.y));
  edMsg('Land ' + land.w + 'x' + land.h + ' @ ' + Math.round(land.offset.x) + ',' + Math.round(land.offset.y));
}
function edTest() {
  edSave();
  const L = LEVELS[ed.idx];
  li = ed.idx;
  startLevel();
}

// draw
function edDrawButton(x, y, w, h, label, hot) {
  ctx.fillStyle = hot ? '#b45309' : '#374151';
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = hot ? '#fbbf24' : '#6b7280'; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px system-ui'; ctx.fillText(label, x + w / 2, y + h / 2);
}
function edDrawMap() {
  const L = edEnsure(), land = L.land;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f6fd6'); g.addColorStop(1, '#a8dcff');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const gc = groundAt(c, r);
    const gt = findType(GROUND_TYPES, gc);
    ctx.fillStyle = gt.color; ctx.fillRect(c * T,r * T,T,T);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(c * T,r * T,T,T);
  }
  const ox = land.offset.x, oy = land.offset.y, wpx = land.w * T, hpx = land.h * T;
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(ox,oy,wpx,hpx);
  if (L.fence) {
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 4;
    ctx.strokeRect(ox - 3,oy - 3,wpx + 6,hpx + 6);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
    ctx.strokeRect(ox,oy,wpx,hpx);
  }
  for (const p of L.plots) {
    ctx.fillStyle = 'rgba(34,197,94,.55)'; ctx.fillRect(p.c * T,p.r * T,T,T);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.strokeRect(p.c * T,p.r * T,T,T);
  }
  for (const k in L.objects) {
    const p = parseKey(k), ot = findType(OBJECT_TYPES, L.objects[k]);
    const cx = p.c * T + T / 2, cy = p.r * T + T / 2;
    ctx.fillStyle = ot.color; ctx.beginPath(); ctx.arc(cx,cy,T * 0.34,0,7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx,cy,T * 0.34,0,7); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(ot.id[0].toUpperCase(), cx, cy + 3);
  }
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(L.start.x,L.start.y,18,0,7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L.start.x,L.start.y,18,0,7); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(ed.cx * T,ed.cy * T,T,T);
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(ed.cx * T,ed.cy * T,T,T);
  edDrawToolbar();
  const brushName = ed.layer === 0 ? findType(GROUND_TYPES, ed.brush).name
    : ed.layer === 2 ? findType(OBJECT_TYPES, ed.brush).name : 'Plot';
  txt('LAYER ' + ['GROUND','PLOTS','OBJECTS'][ed.layer] + '  TOOL ' + ed.tool.toUpperCase() + '  BRUSH ' + brushName.toUpperCase() + ' (B cycles)  TILE [' + ed.cx + ',' + ed.cy + '] ' + (inLand(ed.cx, ed.cy) ? 'IN LAND' : 'OUTSIDE'), 10, H - 22, 13, '#e5e7eb');
  if (ed.msgT > 0) { ed.msgT -= 0.02; txt(ed.msg,W / 2,72,16,'#facc15','center'); }
}
function edDrawToolbar() {
  const { bw, gap, x0, y, h } = ED_TB;
  const L = edEnsure();
  const items = [
    'LAYER ' + (ed.layer + 1), 'TOOL ' + ed.tool.toUpperCase(), 'LAND SIZE', 'FENCE ' + (L.fence ? 'ON' : 'OFF'),
    'TIME ' + L.time + 's', 'TARGET ' + L.target, 'EVENTS', 'SAVE [Ctrl+S]', 'TEST PLAY', 'BACK MENU',
  ];
  for (let i = 0; i < items.length; i++) {
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = '#374151'; ctx.fillRect(x,y,bw,h);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; ctx.strokeRect(x,y,bw,h);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px system-ui'; ctx.fillText(items[i], x + bw / 2, y + h / 2);
  }
}

function edDrawPanel(title, rows) {
  const px = W - 300, py = 40, pw = 290, ph = H - 80;
  ctx.fillStyle = 'rgba(15,23,35,.92)'; ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; ctx.strokeRect(px,py,pw,ph);
  txt(title,px + 14,py + 14,18,'#facc15');
  let yy = py + 44;
  for (const r of rows) {
    ctx.fillStyle = '#1f2937'; ctx.fillRect(px + 14,yy,pw - 28,26);
    ctx.strokeStyle = '#6b7280'; ctx.strokeRect(px + 14,yy,pw - 28,26);
    txt(r.label,px + 24,yy + 6,14,'#e5e7eb');
    txt(r.value,px + pw - 24,yy + 6,14,r.col || '#9ca3af','right');
    yy += 34;
  }
  return { px, py, pw, ph };
}
function edDrawCfg() {
  const L = edEnsure();
  const rows = [
    { label: 'NAME', value: L.name },
    { label: 'TIME LIMIT (s)', value: L.time },
    { label: 'TARGET COINS', value: L.target },
    { label: 'LAND SIZE', value: L.land.w + ' x ' + L.land.h + ' (tiles)' },
    { label: 'OFFSET X', value: Math.round(L.land.offset.x) },
    { label: 'OFFSET Y', value: Math.round(L.land.offset.y) },
    { label: 'FENCE', value: L.fence ? 'ON' : 'OFF', col: L.fence ? '#4ade80' : '#fca5a5' },
    { label: 'WEATHER', value: L.weather },
  ];
  edDrawPanel('CONFIGURE LEVEL', rows);
  txt('Arrows/WASD adjust land | F toggle fence | M back',W - 300 + 14,H - 30,13,'#9ca3af');
  if (ed.msgT > 0) txt(ed.msg,24,H - 46,13,'#e5e7eb');
}
function edDrawEvt() {
  const L = edEnsure();
  const sel = L.events[ed.selEvent];
  const et = sel ? findType(EVENT_TYPES, sel.id) : null;
  edDrawPanel('EVENTS (logs)', [
    { label: 'COUNT', value: L.events.length },
    { label: 'SELECTED', value: sel ? et.name.toUpperCase() : 'none' },
    { label: 'TRIGGER AT (s)', value: sel ? sel.time : '-' },
    { label: 'CHANCE', value: sel ? Math.round(sel.chance * 100) + '%' : '-' },
    { label: 'RANDOM', value: sel ? (sel.random ? 'ON' : 'FIXED') : '-', col: '#9ca3af' },
    { label: 'ENABLED', value: sel ? (sel.enabled ? 'ON' : 'OFF') : '-', col: sel && sel.enabled ? '#4ade80' : '#fca5a5' },
  ]);
  let yy = 110;
  txt('EVENT LIST',W - 300 + 14,yy,15,'#facc15'); yy += 24;
  for (let i = 0; i < L.events.length; i++) {
    const ev = L.events[i], et2 = findType(EVENT_TYPES, ev.id);
    const isSel = i === ed.selEvent;
    const rx = W - 300 + 14, rw = 262, rh = 24;
    ctx.fillStyle = isSel ? '#b45309' : '#1f2937';
    ctx.fillRect(rx,yy,rw,rh);
    ctx.strokeStyle = isSel ? '#fbbf24' : '#6b7280'; ctx.strokeRect(rx,yy,rw,rh);
    ctx.fillStyle = isSel ? '#fbbf24' : et2.color;
    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
    ctx.fillText((i + 1) + '. ' + et2.name.toUpperCase(), rx + 8, yy + 6);
    ctx.fillStyle = '#9ca3af'; ctx.font = '11px system-ui';
    ctx.fillText('t:' + ev.time + 's  ch:' + Math.round(ev.chance * 100) + '%  ' + (ev.random ? 'RANDOM' : 'FIXED') + '  ' + (ev.enabled ? 'ON' : 'OFF'), rx + 8, yy + 17);
    yy += 28;
  }
  txt('Up/Down select | T type | [ ] time |,. chance | E on/off | R random | A add | Del remove | M back',W - 300 + 14,H - 30,12,'#9ca3af');
  if (ed.msgT > 0) txt(ed.msg,24,H - 46,13,'#e5e7eb');
}
function edDraw() {
  if (ed.mode === 'MAP') edDrawMap();
  else if (ed.mode === 'CFG') { edDrawMap(); edDrawCfg(); }
  else if (ed.mode === 'EVT') { edDrawMap(); edDrawEvt(); }
}
function edUpdate(dt) {
  if (ed.msgT > 0) ed.msgT -= dt;
}
window.edOpen = edOpen;
window.edClose = edClose;
window.edSave = edSave;
window.edDraw = edDraw;
window.edUpdate = edUpdate;
window.ed = ed;
window.edPointer = edPointer;
window.edOpenIdx = (i) => edOpen(i);
window.edNew = () => edOpen(-1);
edLoadSaved();

