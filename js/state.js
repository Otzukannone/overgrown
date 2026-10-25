// ---------- State ----------
let state = 'MENU'; // MENU, CONFIRM, SLOTS, LEVELS, OPTIONS, EXIT, INTRO, PLAYING, SHOP, WIN, EDITOR
let li = 0, money = 0, lastResult = '';
let up = { bag: 0, boots: 0, fert: 0, corn: 0, melon: 0 };
let seed = 'tomato';
let lb = {}, ab = { drink: false, time: false }, boost = { drink: false, time: false };
let camX = 0, camY = 0;
let crops = {}, timeLeft = 0, earned = 0, rainTimer = 0, rainCd = 0, flash = 0, nextBolt = 8;
let evFired = {}, pestTimer = 0, frostTimer = 0;
let droughtTimer = 0, growthTimer = 0, elapsedTime = 0;
let toastMsg = '', toastT = 0, shake = 0, tAll = 0, moving = false;
const player = { x: 924, y: 540, w: 72, h: 54, facing: 'UP', bag: [] };
const keys = {};

