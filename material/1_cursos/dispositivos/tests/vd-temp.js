/* Comprueba las cifras de la guía del cap. 12 (V_D de un 1N4148 vs temperatura) con el motor */
global.window = global;
global.document = { createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, append() {}, addEventListener() {}, setAttribute() {} }), documentElement: {}, addEventListener() {} };
global.EM = { si: (x) => String(x), fix: (x, n = 2) => (+x).toFixed(n), sci: (x) => String(x), sims: {}, defineSim() {} };
const path = require('path');
const core = path.join(__dirname, '../src/core');
for (const f of ['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '38-cx']) require(path.join(core, f + '.js'));
const CX = EM.cx;
const vd = (T, I) => {
  const n = new EM.Net({ Ta: T, damage: false });
  n.load(EM.Net.fromSpec(CX.ladder({ src: { id: 'I1', t: 'IDC', p: { i: I } }, items: [{ id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', tap: 'out' }] })));
  n.rebuild(); n.cir.solveDC();
  return n.v(n.netInfo.labelNet.out);
};
for (const I of [1e-3, 1e-5]) {
  const a = vd(25, I), b = vd(125, I), s = (vd(30, I) - vd(20, I)) / 10 * 1000;
  console.log(`I=${I}: V(25)=${a.toFixed(3)}  V(125)=${b.toFixed(3)}  pendiente@25=${s.toFixed(2)} mV/K  media 25→125=${((b - a) / 100 * 1000).toFixed(2)} mV/K`);
}
