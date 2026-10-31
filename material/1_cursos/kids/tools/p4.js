const g = sim('globo-papelitos'); const cv = g.cv; const r = cv.getBoundingClientRect();
const P = (x, y) => ({ clientX: r.left + x * r.width / g.W, clientY: r.top + y * r.height / g.H, pointerId: 1, bubbles: true });
const ev = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, P(x, y)));
ev('pointerdown', 600, 250);
for (let k = 0; k < 40; k++) { ev('pointermove', k % 2 ? 100 : 250, 150 + (k % 3) * 20); g._tick(1); }
for (let k = 0; k < 40; k++) { ev('pointermove', 600 - k * 5, 250 + k * 3); g._tick(1); }
ev('pointermove', 400, 330); g._tick(60);
return { won: FK.isWon('globo-papelitos'), out: [...g.host.querySelectorAll('.out-v')].map((e) => e.textContent) };
