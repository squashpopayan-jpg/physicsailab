const g = sim('constructor-circuito'); const cv = g.cv; const r = cv.getBoundingClientRect();
const click = (x, y) => { const o = { clientX: r.left + x * r.width / g.W, clientY: r.top + y * r.height / g.H, pointerId: 1, bubbles: true }; cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); };
const out = [];
const S = [[400, 70], [690, 200], [400, 330], [110, 200]];
click(...S[1]); click(...S[1]); click(...S[2]); click(...S[3]); g._tick(5);
out.push(g.host.querySelectorAll('.out-v')[0].textContent);
g.setChoice('lay', 'par'); g.restart();
const P = [[110, 200], [330, 90], [520, 90], [330, 310], [520, 310]];
click(...P[1]); click(...P[1]); click(...P[2]); /* A: bombillo + cable */
click(...P[3]); click(...P[3]); click(...P[3]); /* B: abierto */ click(...P[4]); click(...P[4]);
g._tick(5);
out.push(g.host.querySelectorAll('.out-v')[0].textContent, g.host.querySelectorAll('.out-v')[1].textContent, FK.isWon('constructor-circuito'));
return out;
