# Farming Rush

Run: open `index.html` in any modern browser (double-click it). No server or install needed.
Optional local server: `python3 -m http.server 8000` then visit http://localhost:8000

Files:
- index.html        page + script order (order matters; scripts share globals)
- css/style.css     page styling
- js/data.js        canvas setup, crops, levels, shop and grocer data
- js/state.js       game state variables and helpers
- js/menu.js        saves, menu/confirm/slot/level-select logic, mouse input
- js/input.js       keyboard input, plant/harvest/deliver, buying
- js/update.js      per-frame game logic
- js/draw.js        in-game drawing, HUD
- js/menu-draw.js   menu, slots, level select, shops, options drawing
- js/main.js        main loop

Controls: WASD/arrows move, Space plant, E harvest/chop/deliver/open Grocer, 1-3 seed, Esc back.
