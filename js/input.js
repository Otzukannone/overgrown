// ---------- Input ----------
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'Escape') {
    if (state === 'CONFIRM') closeDlg(false);
    else if (state === 'GROCER') state = 'PLAYING';
    else if (state === 'PLAYING' || state === 'INTRO' || state === 'SHOP') goLevels();
    else if (state !== 'MENU') state = 'MENU';
    return;
  }
  if (state === 'MENU') {
    const n = menuItems().length;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') menuSel = (menuSel + n - 1) % n;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') menuSel = (menuSel + 1) % n;
    if (e.code === 'Enter' || e.code === 'Space') menuActivate(menuItems()[menuSel]);
  }
  else if (state === 'CONFIRM') {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) dlg.sel = 1 - dlg.sel;
    if (e.code === 'KeyY') closeDlg(true);
    if (e.code === 'KeyN') closeDlg(false);
    if (e.code === 'Enter' || e.code === 'Space') closeDlg(dlg.sel === 0);
  }
  else if (state === 'SLOTS') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') slotSel = (slotSel + 2) % 3;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') slotSel = (slotSel + 1) % 3;
    if (e.code === 'Enter' || e.code === 'Space') slotPick(slotSel);
    if (e.code === 'Delete' || e.code === 'KeyX') slotDelete(slotSel);
  }
  else if (state === 'LEVELS') {
    const n = LEVELS.length;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') lvSel = (lvSel + n - 1) % n;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') lvSel = (lvSel + 1) % n;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') lvSel = Math.max(0, lvSel - 4);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') lvSel = Math.min(n - 1, lvSel + 4);
    if (e.code === 'Enter' || e.code === 'Space') lvPick(lvSel);
    if (e.code === 'KeyB') { lastResult = ''; state = 'SHOP'; }
  }
  else if (state === 'OPTIONS') {
    if (e.code === 'Digit1' || e.code === 'Digit2') { const o = OPT_ROWS[parseInt(e.key) - 1]; opts[o[1]] = !opts[o[1]]; saveOpts(); }
    if (e.code === 'Enter') state = 'MENU';
  }
  else if (state === 'EXIT' || state === 'WIN') { if (e.code === 'Enter') state = 'MENU'; }
  else if (state === 'GROCER') {
    if (e.code === 'Enter' || e.code === 'KeyE') state = 'PLAYING';
    const gn = parseInt(e.key); if (gn >= 1 && gn <= GROCER.length) buyGrocer(gn - 1);
  }
  else if (state === 'INTRO') { if (e.code === 'Enter') startLevel(); }
  else if (state === 'SHOP') {
    if (e.code === 'Enter') goLevels();
    const n = parseInt(e.key);
    if (n >= 1 && n <= SHOP.length) buyMerchant(n - 1);
  } else if (state === 'PLAYING') {
    if (e.code === 'Digit1') seed = 'tomato';
    if (e.code === 'Digit2') { if (up.corn) seed = 'corn'; else toast('Corn locked - buy in shop'); }
    if (e.code === 'Digit3') { if (up.melon) seed = 'melon'; else toast('Melon locked - buy in shop'); }
    if (e.code === 'Space') plant();
    if (e.code === 'KeyE') interact();
  }
});
addEventListener('keyup', e => keys[e.code] = false);

function plant() {
  const t = target(), k = t.c + ',' + t.r;
  if (isDirt(t.c, t.r) && !crops[k]) crops[k] = { type: seed, age: 0 };
}
function interact() {
  const t = target(), k = t.c + ',' + t.r;
  if (t.c === GROCER_TILE.col && t.r === GROCER_TILE.row) { state = 'GROCER'; return; }
  if (t.c === bin.col && t.r === bin.row) {
    if (!player.bag.length) return toast('Bag is empty');
    const v = player.bag.reduce((s, c) => s + CROPS[c].value, 0);
    earned += v; player.bag = []; toast('+' + v + ' delivered!');
  } else if (crops[k]) {
    const c = crops[k];
    if (c.age >= CROPS[c.type].grow) {
      if (player.bag.length >= maxBag()) return toast('Bag full! Deliver to the bin');
      player.bag.push(c.type); delete crops[k];
    } else delete crops[k]; // chop
  }
}
function callRain() {
  if (rainCd > 0) return toast('Pawang is resting (' + Math.ceil(rainCd) + 's)');
  if (weather() === 'rain') return toast('It is already raining!');
  rainCd = 20;
  if (Math.random() < 0.4) { rainTimer = 20; toast('The Pawang succeeded! Rain incoming!'); }
  else toast('The Pawang failed... sky stays dry.');
}

