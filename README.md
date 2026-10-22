# Farming Rush

Run: open `index.html` in any modern browser (double-click it). No server or install needed.
Optional local server: `python3 -m http.server 8000` then visit http://localhost:8000

Files:
- index.html        page + script order (order matters; scripts share globals)
- css/style.css     page styling
- js/data.js        canvas setup, crops, levels, shop and grocer data, shared type tables
- js/state.js       game state variables and helpers
- js/menu.js        saves, menu/confirm/slot/level-select logic, level map helpers
- js/input.js       keyboard input, plant/harvest/deliver, buying
- js/update.js      per-frame game logic, level events, solid collision
- js/draw.js        in-game drawing, HUD
- js/menu-draw.js   menu, slots, level select, shops, options drawing
- js/main.js        main loop
- js/editor.js      level editor (map / config / events)

Controls: WASD/arrows move, Space plant, E harvest/chop/deliver/open Grocer, 1-3 seed, Esc back.

## Level Editor

Open the editor from the menu. Everything you paint on the map drives the actual
gameplay at runtime - nothing is decorative only.

Editor-authored levels carry:
- `land` - rectangular playfield (`w`, `h`, `offset`), drawn with an optional fence
- `ground` - per-tile ground type (grass, dirt, path, water)
- `plots` - the exact tiles you can plant on
- `objects` - trees, rocks, fences, and the `bin` / `grocer` / `start` anchors
- `events` - timed weather/growth events (rain, drought, frost, growth, pest)
- `start` - the player spawn point, derived from the `start` object you place

### Map mode
| Key | Action |
| --- | --- |
| 1 / 2 / 3 | Select layer: Ground / Plots / Objects |
| B | Cycle the brush for the current layer |
| E | Toggle paint / erase tool |
| Backspace | Clear the tile under the cursor |
| C / V | Switch to Config / Events panel |
| S | Save level |
| T | Test play the level immediately |
| Esc | Back to menu |

Drag with the left mouse button to paint. The status bar shows the active layer,
tool, brush and hovered tile.

### Config panel (C)
| Key | Action |
| --- | --- |
| A / D | Land width -/+ |
| W / S | Land height -/+ |
| Left / Right | Move land horizontally |
| Up / Down | Move land vertically |
| F | Toggle the fence border |

### Events panel (V)
| Key | Action |
| --- | --- |
| Up / Down | Select an event |
| T | Cycle the event type |
| [ / ] | Trigger time -/+ 5s |
| , / . | Trigger chance -/+ 10% |
| E | Enable / disable the event |
| R | Toggle random mode |
| A | Add an event |
| Delete | Remove the selected event |

Built-in levels keep their original layout: opening one in the editor migrates it
to the new format without changing how it plays.

## Tests

`node test_level_editor.js` runs a headless smoke + integration suite. It stubs the
DOM, loads every game script in order and exercises:

- editor open / paint / save / close and the CFG, EVT and MAP panels
- brush cycling on all three layers
- painting rules - planting on a painted plot, and rejecting a non-plot tile
- solid object collision
- event timing - timers decrement exactly once per update and a fired event
  does not re-trigger
- a built-in level regression pass, asserting all four built-in levels keep their
  original plot rect, bin and grocer tiles
- an editor save / load round-trip through `localStorage`, then a replay of the
  reloaded level to confirm the runtime really uses the authored data
- migration robustness - levels with missing `land`, `land.offset`, `objects`,
  `ground`, `plots` or `events`, and with out-of-canvas spawn points

The suite exits non-zero if any assertion fails.
