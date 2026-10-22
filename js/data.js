const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const T = 50, COLS = 16, ROWS = 12, W = 800, H = 600;
const bin = { col: 7, row: 1 };
const GROCER_TILE = { col: 9, row: 1 };

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

