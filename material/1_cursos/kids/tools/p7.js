const g = sim('alunizaje'); const cv = g.cv; const r = cv.getBoundingClientRect();
const o = { clientX: r.left + 100, clientY: r.top + 100, pointerId: 1, bubbles: true };
let landed = null;
for (let i = 0; i < 2400 && landed === null; i++) {
  const vtxt = g.host.querySelectorAll('.out-v')[1].textContent, h = parseFloat(g.host.querySelectorAll('.out-v')[0].textContent);
  const v = parseFloat(vtxt.replace(',', '.'));
  const burn = v > Math.sqrt(2 * 3.7 * Math.max(0, h - 5)) * 0.95;
  cv.dispatchEvent(new PointerEvent(burn ? 'pointerdown' : 'pointerup', o));
  g._tick(1, 1 / 60);
  if (h <= 0.5) landed = vtxt;
}
return { landed, won: FK.isWon('alunizaje'), outs: [...g.host.querySelectorAll('.out-v')].map((e) => e.textContent) };
