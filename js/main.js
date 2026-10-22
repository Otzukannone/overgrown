// ---------- Loop ----------
let last = 0;
function loop(ts) {
  let dt = (ts - last) / 1000; last = ts; if (dt > 0.1) dt = 0.1;
  update(dt); draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(ts => { last = ts; loop(ts); });
