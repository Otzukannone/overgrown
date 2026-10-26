const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const T = 50, COLS = 16, ROWS = 12, W = 800, H = 600;
const bin = { col: 7, row: 1 };
const GROCER_TILE = { col: 9, row: 1 };

// ---------- Responsive canvas ----------
// The game logic always runs in a fixed W x H (800x600) logical space. The canvas
// element fills the browser window. fitCanvas() applies a UNIFORM scale so the
// 800x600 game content is never stretched; it is centered and any extra space
// (wider or taller windows) is filled with extended background drawn in draw().
let viewSX = 1, viewSY = 1; // uniform logical px -> backing-store px scale
let viewOX = 0, viewOY = 0; // centering offset in backing-store px
function fitCanvas() {
  if (!cv.style) return;
  const vw = window.innerWidth || W, vh = window.innerHeight || H;
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
  const bw = Math.round(vw * dpr), bh = Math.round(vh * dpr);
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
  // Uniform scale: fit 800x600 inside the canvas without stretching.
  const s = Math.min(cv.width / W, cv.height / H);
  viewSX = s; viewSY = s;
  viewOX = (cv.width - W * s) / 2; viewOY = (cv.height - H * s) / 2;
}
addEventListener('resize', fitCanvas);
document.addEventListener('fullscreenchange', fitCanvas);

// Convert a mouse event's client position to logical (W x H) coordinates, undoing
// the uniform scale and centering offset applied by fitCanvas / baseTransform().
function mpos(e) {
  const r = cv.getBoundingClientRect();
  const bx = (e.clientX - r.left) * (cv.width / r.width);
  const by = (e.clientY - r.top) * (cv.height / r.height);
  return { x: (bx - viewOX) / viewSX, y: (by - viewOY) / viewSY };
}

// ---------- Data ----------
const CROPS = {
  tomato: { name: 'Tomato', grow: 7,  value: 8, color: '#ef4444' },
  corn:   { name: 'Corn',   grow: 12, value: 24, color: '#facc15' },
  melon:  { name: 'Melon',  grow: 18, value: 55, color: '#16a34a' },
};
const LEVELS = [
  { name: 'Dry Land', time: 65, target: 130, pw: 6, ph: 4, weather: 'dry',
    story: 'The land is cracked and the grocers are empty.\nYou are our last farmer. Fill the bin and save the grocer economy!' },
  { name: 'First Clouds', time: 75, target: 300, pw: 8, ph: 5, weather: 'clear',
    story: 'The market is open again, but demand is rising.\nPlant smart: chop unripe crops to make room for what sells.' },
  { name: 'Monsoon Madness', time: 85, target: 480, pw: 10, ph: 6, weather: 'rain', heavy: true,
    story: 'Storms hit the valley. Crops grow fast in the rain,\nbut the mud slows you down. Watch out for lightning!' },
  { name: 'Boss: The Great Drought', time: 95, target: 800, pw: 10, ph: 7, weather: 'dry',
    story: 'The final harvest. Dry skies, huge orders.\nAsk the Grocer to call the Pawang for rain - only a 40% chance!' },
];
// Shared type tables (used by both the runtime and the level editor).
const GROUND_TYPES = [
  { id: 'grass', name: 'Grass',  color: '#4ade80' },
  { id: 'dirt',  name: 'Dirt',   color: '#a0743c' },
  { id: 'path',  name: 'Path',   color: '#9ca3af' },
  { id: 'water', name: 'Water',  color: '#3b82f6' },
];
const OBJECT_TYPES = [
  { id: 'start',  name: 'Start',   color: '#facc15' },
  { id: 'bin',    name: 'Bin',     color: '#4a5568' },
  { id: 'grocer', name: 'Grocer',  color: '#f59e0b' },
  { id: 'tree',   name: 'Tree',    color: '#16a34a' },
  { id: 'rock',   name: 'Rock',    color: '#6b7280' },
  { id: 'fence',  name: 'Fence',   color: '#92400e' },
];
const EVENT_TYPES = [
  { id: 'rain',    name: 'Rain',    color: '#60a5fa' },
  { id: 'drought', name: 'Drought', color: '#a0743c' },
  { id: 'frost',   name: 'Frost',  color: '#bfdbfe' },
  { id: 'growth',  name: 'Growth',  color: '#22c55e' },
  { id: 'pest',    name: 'Pest',    color: '#ef4444' },
];
// Objects the player cannot walk through.
const SOLID_OBJECTS = ['tree', 'rock', 'fence', 'bin', 'grocer'];
function findType(list, id) { for (const t of list) if (t.id === id) return t; return list[0]; }
function keyOf(c, r) { return c + ',' + r; }
function parseKey(k) { const p = k.split(',').map(Number); return { c: p[0], r: p[1] }; }

const SHOP = [
  { id: 'bag',   name: 'Bigger Bag (+1)',        base: 70,  max: 3 },
  { id: 'boots', name: 'Fast Boots (+6% spd)',   base: 60,  max: 3 },
  { id: 'fert',  name: 'Fertilizer (+6% grow)',  base: 80,  max: 3 },
  { id: 'corn',  name: 'Corn Seeds (key 2)',     base: 100, max: 1 },
  { id: 'melon', name: 'Melon Seeds (key 3)',    base: 250, max: 1 },
  { id: 'drink', name: 'Energy Drink (+12% speed)', base: 35, max: 1, kind: 'level' },
  { id: 'time',  name: 'Head Start (+10s)',         base: 50, max: 1, kind: 'level' },
];
const GROCER = [
  { id: 'pawang', name: 'Call the Pawang (40% rain)',        price: 25 },
  { id: 'air',    name: 'Air Support: Cloud Seeding (rain)',  price: 70 },
  { id: 'shoes',  name: 'Sprint Tonic (+15% speed)',          price: 40, once: true },
  { id: 'fert',   name: 'Miracle Mix (+25% growth)',          price: 50, once: true },
  { id: 'bag',    name: 'Big Basket (+2 bag slots)',          price: 35, once: true },
  { id: 'time',   name: 'Extra Time (+10s)',                  price: 60, once: true },
];

