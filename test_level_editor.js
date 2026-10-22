// Smoke test: stub browser DOM, load all scripts, exercise editor.
const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, 'js') + path.sep;
const order = ['data.js','state.js','menu.js','input.js','update.js','draw.js','menu-draw.js','main.js','editor.js'];

// ---------- tiny assertion helpers ----------
let failures = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS  ' + label + (extra !== undefined ? '  -> ' + extra : ''));
  else { failures++; console.log('  FAIL  ' + label + (extra !== undefined ? '  -> ' + extra : '')); }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  ok(a === e, label, a === e ? a : 'actual ' + a + ' expected ' + e);
}

const ls = {};
const localStorage = {
  getItem: k => ls[k] || null,
  setItem: (k, v) => { ls[k] = v; },
  removeItem: k => { delete ls[k]; },
};
const calls = [];
const ctx = new Proxy({}, {
  get: (t, prop) => {
    if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
    calls.push(prop);
    return (...args) => { calls.push([prop, args]); };
  }
});
const canvas = {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  getContext: () => ctx,
  addEventListener: () => {},
};
const document = {
  getElementById: () => canvas,
  addEventListener: () => {},
};
let rafCb = null;
const requestAnimationFrame = cb => { rafCb = cb; return 1; };
const window = { document, localStorage, requestAnimationFrame, addEventListener: () => {}, innerWidth: 800, innerHeight: 600 };
const globalObj = { window, document, localStorage, requestAnimationFrame, addEventListener: () => {}, cv: canvas, ctx };

const vm = require('vm');
const context = vm.createContext(globalObj);
for (const f of order) {
  const code = fs.readFileSync(jsDir + f, 'utf8');
  try {
    vm.runInContext(code, context, { filename: f });
  } catch (e) {
    console.error('LOAD ERROR in', f, ':', e.message);
    process.exit(1);
  }
}
console.log('All scripts loaded.');

const g = expr => vm.runInContext(expr, context);
const win = globalObj.window;
console.log('initial state:', g('state'), 'LEVELS:', g('LEVELS').length, 'T:', g('T'));

win.edNew();
console.log('after edNew state:', g('state'), 'ed.open:', win.ed.open);
console.log('lvl:', JSON.stringify(win.ed.lvl));

win.ed.cx = 10; win.ed.cy = 10; win.ed.drag = true;
win.edPointer(10 * g('T'), 10 * g('T'));
win.edPointer(11 * g('T'), 10 * g('T'));
win.ed.drag = false;
win.ed.layer = 1;
win.ed.cx = 12; win.ed.cy = 12; win.ed.drag = true;
win.edPointer(12 * g('T'), 12 * g('T'));
win.ed.drag = false;
win.ed.layer = 2; win.ed.brush = 'bin';
win.ed.cx = 14; win.ed.cy = 14; win.ed.drag = true;
win.edPointer(14 * g('T'), 14 * g('T'));
win.ed.drag = false;
win.ed.mode = 'CFG';
win.ed.lvl.time = 90; win.ed.lvl.target = 300; win.ed.lvl.name = 'Smoke Level';
win.ed.lvl.fence = true;
win.ed.mode = 'EVT';
win.ed.selEvent = 0;
win.ed.lvl.events.push({ id: 'rain', time: 20, chance: 0.6, random: true, enabled: true });
win.ed.selEvent = win.ed.lvl.events.length - 1;
win.edDraw();
console.log('edDraw OK');
win.ed.mode = 'MAP';
win.edSave();
console.log('after save LEVELS:', g('LEVELS').length, 'saved ls:', !!localStorage.getItem('overgrown_levels'));
console.log('saved lvl name:', g('LEVELS')[g('LEVELS').length - 1].name, 'pw/ph:', g('LEVELS')[g('LEVELS').length - 1].pw, g('LEVELS')[g('LEVELS').length - 1].ph);
try {
  g('edTest()');
  console.log('edTest (startLevel) OK, state:', g('state'), 'li:', g('li'));
} catch (e) {
  console.error('edTest ERROR:', e.message);
}
win.edClose();
console.log('after edClose state:', g('state'), 'ed.open:', win.ed.open);
console.log('SMOKE TEST PASSED');

// ---------- Integration test: editor output drives gameplay ----------
console.log('\n--- integration ---');
const L = g('LEVELS')[g('LEVELS').length - 1];
console.log('bin:', JSON.stringify(L.bin), 'grocer:', JSON.stringify(L.grocer), 'start:', JSON.stringify(L.start));

// paint ground + plots + objects on the saved level, then re-save
g('(function(){const L=LEVELS[LEVELS.length-1];' +
  'L.ground["4,4"]="water";L.ground["3,4"]="path";' +
  'L.plots=[{c:4,r:4},{c:5,r:4},{c:6,r:4}];' +
  'L.objects["4,4"]="tree";L.objects["5,4"]="bin";L.objects["6,4"]="grocer";' +
  'L.events=[{id:"frost",time:2,chance:1,random:false,enabled:true}];' +
  'ed.lvl=L;edSave();})()');
const L2 = g('LEVELS')[g('LEVELS').length - 1];
console.log('after resave bin:', JSON.stringify(L2.bin), 'grocer:', JSON.stringify(L2.grocer));

g('li=' + (g('LEVELS').length - 1) + ';startLevel();');
console.log('ground(4,4):', g('lvlGround(4,4)'), 'ground(0,0):', g('lvlGround(0,0)'));
console.log('isDirt(4,4):', g('isDirt(4,4)'), 'isDirt(3,4):', g('isDirt(3,4)'));
console.log('binTile:', JSON.stringify(g('binTile()')), 'grocerTile:', JSON.stringify(g('grocerTile()')));
console.log('player start:', g('player.x'), g('player.y'));

// planting only works on painted plots
g('crops={};player.x=4*50+10;player.y=3*50+10;player.facing="DOWN";plant();');
eq(g('crops'), { '4,4': { type: 'tomato', age: 0 } }, 'plant on painted plot creates a crop');
g('crops={};player.x=0;player.y=0;player.facing="DOWN";plant();');
eq(g('crops'), {}, 'plant off-plot is rejected');

// solid collision: place the player on a tree tile
g('player.x=4*50+10;player.y=4*50+10;resolveSolid();');
ok(g('player.x') !== 4 * 50 + 10 || g('player.y') !== 4 * 50 + 10,
  'solid tree pushes the player out of the tile', g('player.x') + ',' + g('player.y'));

// events fire
g('crops={"4,4":{type:"tomato",age:0}};elapsedTime=3;evFired={};');
g('runLevelEvents(0.1)');
ok(g('frostTimer') > 0, 'frost event fires and sets the timer', g('frostTimer'));

// the event must not fire twice (timer decremented exactly once per call)
g('frostTimer=8;elapsedTime=3;evFired={};');
g('runLevelEvents(0.5);runLevelEvents(0.5);');
eq(g('frostTimer'), 7.5, 'frost timer decrements exactly once per call');
g('frostTimer=8;growthTimer=10;droughtTimer=20;pestTimer=5;');
g('runLevelEvents(1);');
eq([g('frostTimer'), g('growthTimer'), g('droughtTimer'), g('pestTimer')], [7, 9, 19, 4],
  'all event timers decrement once per call');

// an event must not fire again after it has already fired
g('frostTimer=0;elapsedTime=3;evFired={};');
g('runLevelEvents(0.1);');
const afterFirst = g('frostTimer');
g('runLevelEvents(0.1);');
eq(g('frostTimer'), afterFirst - 0.1, 'a fired event does not re-trigger');

// growth multiplier responds to frost
ok(Math.abs(g('growMul()') - 0.48) < 0.001, 'growMul is reduced during frost', g('growMul()').toFixed(2));

// ---------- Regression: built-in levels keep their legacy layout ----------
console.log('\n--- built-in regression ---');
const legacy = [
  { name: 'Dry Land', c0: 5, c1: 10, r0: 3, r1: 6 },
  { name: 'First Clouds', c0: 4, c1: 11, r0: 3, r1: 7 },
  { name: 'Monsoon Madness', c0: 3, c1: 12, r0: 3, r1: 8 },
  { name: 'Boss: The Great Drought', c0: 3, c1: 12, r0: 3, r1: 9 },
];
for (let i = 0; i < 4; i++) {
  g('li=' + i + ';startLevel();');
  const p = g('plot()');
  const L = legacy[i];
  eq([p.c0, p.c1, p.r0, p.r1], [L.c0, L.c1, L.r0, L.r1], 'L' + (i + 1) + ' plot rect unchanged');
  ok(g('isDirt(' + Math.floor((p.c0 + p.c1) / 2) + ',' + Math.floor((p.r0 + p.r1) / 2) + ')'),
    'L' + (i + 1) + ' plot centre is plantable');
  ok(!g('isDirt(0,0)'), 'L' + (i + 1) + ' tile (0,0) is not plantable');
  eq(g('lvlGround(0,0)'), 'grass', 'L' + (i + 1) + ' default ground is grass');
  eq(g('binTile()'), { col: 7, row: 1 }, 'L' + (i + 1) + ' bin tile unchanged');
  eq(g('grocerTile()'), { col: 9, row: 1 }, 'L' + (i + 1) + ' grocer tile unchanged');
}
g('li=0;startLevel();draw();');
eq(g('state'), 'PLAYING', 'draw() of a built-in level runs without throwing');

// editor CFG / EVT panels must render without throwing
g('edOpen(0);');
g('ed.mode="CFG";edDraw();');
ok(true, 'edDraw CFG OK');
g('ed.mode="EVT";ed.selEvent=0;edDraw();');
ok(true, 'edDraw EVT OK');
g('ed.mode="MAP";edDraw();');
ok(true, 'edDraw MAP OK');

// brush cycling across all three layers
// GROUND_TYPES has 4 entries, OBJECT_TYPES has 6
g('ed.layer=0;ed.brush="grass";');
for (let i = 0; i < 4; i++) g('edCycleBrush();');
eq(g('ed.brush'), 'grass', 'ground brush cycles through all 4 ground types');
g('ed.layer=0;ed.brush="grass";edCycleBrush();');
eq(g('ed.brush'), 'dirt', 'ground brush advances to the next type');
g('ed.layer=2;ed.brush="tree";');
for (let i = 0; i < 6; i++) g('edCycleBrush();');
eq(g('ed.brush'), 'tree', 'object brush cycles through all 6 object types');
g('ed.layer=2;ed.brush="tree";edCycleBrush();');
eq(g('ed.brush'), 'rock', 'object brush advances to the next type');
g('ed.layer=1;ed.brush="plot";edCycleBrush();');
eq(g('ed.brush'), 'plot', 'plot layer has a single brush');

// ---------- Editor round-trip: land / plots / ground / objects / events ----------
console.log('\n--- editor round-trip ---');
g('edOpen(-1);');
g('ed.lvl.land={w:8,h:6,offset:{x:200,y:150}};');
g('ed.lvl.ground={"4,4":"water","5,4":"dirt"};');
g('ed.lvl.plots=[{c:4,r:4},{c:5,r:4}];');
g('ed.lvl.objects={"4,2":"bin","6,2":"grocer","3,5":"start","2,2":"tree"};');
g('ed.lvl.events=[{id:"frost",time:12,chance:0.8,random:false,enabled:true},{id:"pest",time:30,chance:1,random:true,enabled:false}];');
g('edSave();');
const R = g('LEVELS')[g('LEVELS').length - 1];
eq(R.land, { w: 8, h: 6, offset: { x: 200, y: 150 } }, 'land rect survives the save');
eq(R.ground, { '4,4': 'water', '5,4': 'dirt' }, 'painted ground survives the save');
eq(R.plots, [{ c: 4, r: 4 }, { c: 5, r: 4 }], 'painted plots survive the save');
eq(R.objects, { '4,2': 'bin', '6,2': 'grocer', '3,5': 'start', '2,2': 'tree' }, 'objects survive the save');
eq(R.events.length, 2, 'both events survive the save');
eq(R.events[0], { id: 'frost', time: 12, chance: 0.8, random: false, enabled: true }, 'event 0 survives the save');
eq(R.events[1], { id: 'pest', time: 30, chance: 1, random: true, enabled: false }, 'event 1 survives the save');
eq(R.bin, { col: 4, row: 2 }, 'bin is derived from the painted bin object');
eq(R.grocer, { col: 6, row: 2 }, 'grocer is derived from the painted grocer object');
eq(R.start, { x: 3 * 50 + 10, y: 5 * 50 + 10 }, 'start is derived from the painted start object');

// reload the saved level from storage and confirm the values survive
g('edClose();edLoadSaved();');
const R2 = g('LEVELS')[g('LEVELS').length - 1];
eq(R2.land, R.land, 'land survives a storage reload');
eq(R2.plots, R.plots, 'plots survive a storage reload');
eq(R2.objects, R.objects, 'objects survive a storage reload');
eq(R2.bin, R.bin, 'bin survives a storage reload');
eq(R2.start, R.start, 'start survives a storage reload');

// the reloaded level must actually drive the runtime
g('li=' + (g('LEVELS').length - 1) + ';startLevel();');
eq(g('lvlGround(4,4)'), 'water', 'runtime reads the reloaded ground tile');
eq(g('isDirt(4,4)'), true, 'runtime plants on the reloaded plot');
eq(g('isDirt(5,4)'), true, 'runtime plants on the second reloaded plot');
eq(g('isDirt(6,4)'), false, 'runtime rejects a non-plot tile');
eq(g('binTile()'), { col: 4, row: 2 }, 'runtime uses the reloaded bin tile');
eq(g('grocerTile()'), { col: 6, row: 2 }, 'runtime uses the reloaded grocer tile');
eq([g('player.x'), g('player.y')], [3 * 50 + 10, 5 * 50 + 10], 'player spawns at the reloaded start point');

// ---------- Robustness: levels with missing / malformed editor fields ----------
console.log('\n--- migration robustness ---');
g('edOpen(-1);');
g('ed.lvl={name:"Bare",time:30,target:10,weather:"clear"};');
g('edSave();');
const B = g('LEVELS')[g('LEVELS').length - 1];
ok(B.land && B.land.w >= 3 && B.land.h >= 3, 'missing land is migrated to a valid size', JSON.stringify(B.land));
ok(B.land.offset && typeof B.land.offset.x === 'number', 'missing land.offset is filled in');
eq(B.objects, {}, 'missing objects defaults to an empty map');
eq(B.ground, {}, 'missing ground defaults to an empty map');
eq(B.plots, [], 'missing plots defaults to an empty array');
ok(Array.isArray(B.events), 'missing events defaults to an array');
ok(B.start && typeof B.start.x === 'number' && typeof B.start.y === 'number', 'missing start is derived', JSON.stringify(B.start));
ok(B.bin && typeof B.bin.col === 'number' && typeof B.bin.row === 'number', 'missing bin is derived', JSON.stringify(B.bin));
ok(B.grocer && typeof B.grocer.col === 'number' && typeof B.grocer.row === 'number', 'missing grocer is derived', JSON.stringify(B.grocer));

// a level with a land rect but no offset must still save and load
g('edOpen(-1);');
g('ed.lvl={name:"NoOffset",time:30,target:10,weather:"clear",land:{w:6,h:5}};');
g('edSave();');
const NO = g('LEVELS')[g('LEVELS').length - 1];
ok(NO.land.offset && typeof NO.land.offset.x === 'number', 'land without offset is repaired on save', JSON.stringify(NO.land.offset));

// a level whose plots / events are not arrays must not crash the editor
g('edOpen(-1);');
g('ed.lvl={name:"BadTypes",time:30,target:10,weather:"clear",plots:"nope",events:42,objects:null,ground:7};');
g('edDraw();');
g('edSave();');
const BAD = g('LEVELS')[g('LEVELS').length - 1];
ok(Array.isArray(BAD.plots), 'non-array plots are normalised', JSON.stringify(BAD.plots));
ok(Array.isArray(BAD.events), 'non-array events are normalised', JSON.stringify(BAD.events));
eq(BAD.objects, {}, 'null objects are normalised to an empty map');
eq(BAD.ground, {}, 'non-map ground is normalised to an empty map');

// an out-of-canvas start object must be clamped, not trusted blindly
g('edOpen(-1);');
g('ed.lvl={name:"BadSpawn",time:30,target:10,weather:"clear",objects:{"99,99":"start"}};');
g('edSave();');
const BS = g('LEVELS')[g('LEVELS').length - 1];
ok(BS.start.x >= 0 && BS.start.x <= g('W') - 30, 'out-of-canvas start x is clamped', BS.start.x);
ok(BS.start.y >= 0 && BS.start.y <= g('H') - 30, 'out-of-canvas start y is clamped', BS.start.y);

console.log('\nROUND-TRIP DONE');
console.log(failures === 0 ? '\nALL TESTS PASSED' : '\n' + failures + ' TEST(S) FAILED');
process.exit(failures === 0 ? 0 : 1);


