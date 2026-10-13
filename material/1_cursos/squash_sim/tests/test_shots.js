/* Prueba de los golpes: cada tiro debe converger, pasar sobre el tin y dejar puntos de impacto. */
const MS = require('./load')(['00', '10', '15', '20']);
const { Shots, Ball, U } = MS;
const en = Ball.env({ temp: 40, alt: 1760 });
const cases = [
  ['drive', { x: 0.9, y: 8.4, z: 0.7 }], ['drive', { x: 5.5, y: 8.6, z: 0.6 }], ['cruzada', { x: 0.9, y: 8.4, z: 0.7 }],
  ['boast', { x: 0.8, y: 8.6, z: 0.6 }], ['boast', { x: 5.6, y: 8.6, z: 0.6 }], ['boast3', { x: 0.8, y: 8.3, z: 0.7 }],
  ['drop', { x: 1.1, y: 1.9, z: 0.4 }], ['drop', { x: 1.0, y: 8.3, z: 0.7 }], ['dropC', { x: 1.1, y: 1.9, z: 0.4 }],
  ['kill', { x: 2.0, y: 5.5, z: 1.0 }], ['globo', { x: 1.2, y: 1.6, z: 0.35 }], ['globoC', { x: 1.2, y: 1.6, z: 0.35 }],
  ['voleaDrive', { x: 1.0, y: 5.4, z: 1.4 }], ['voleaC', { x: 1.0, y: 5.4, z: 1.4 }], ['voleaDrop', { x: 1.2, y: 5.4, z: 1.3 }],
  ['voleaMedia', { x: 1.5, y: 5.6, z: 1.3 }], ['saque', { x: 5.4, y: 6.3, z: 1.1 }], ['saque', { x: 1.0, y: 6.3, z: 1.1 }],
];
let fails = 0;
for (const [k, c] of cases) {
  const t0 = Date.now();
  const r = Shots.plan(c, k, { env: en });
  const ms = Date.now() - t0;
  if (!r.ok) { console.log('FALLO', k, r.warnings); fails++; continue; }
  const fr = r.front;
  const evs = r.traj.ev.map((e) => e.type[0] + '@' + e.t.toFixed(2) + '(' + e.x.toFixed(1) + ',' + e.y.toFixed(1) + ',' + e.z.toFixed(2) + ')').join(' ');
  const cand = Shots.candidates(r.traj, Shots.isVolley(k) ? 'volea' : 'pique');
  const c0 = cand[0];
  console.log(k.padEnd(10), 'v=' + r.v.toFixed(1), 'err=' + (r.err * 100).toFixed(1) + 'cm', 'frontal z=' + (fr ? fr.z.toFixed(2) : '-'), ms + 'ms', r.warnings.join(' | '));
  console.log('   ', evs);
  console.log('    primer candidato:', c0 ? `${c0.cls} t=${c0.t.toFixed(2)} (${c0.x.toFixed(2)}, ${c0.y.toFixed(2)}, z=${c0.z.toFixed(2)})` : 'ninguno', ' n=', cand.length);
  if (r.err > 0.3 || (fr && fr.z < MS.C.tin)) fails++;
}
console.log('e(23°C)=', Ball.eTemp(23).toFixed(3), 'e(40°C)=', Ball.eTemp(40).toFixed(3), 'e(45°C)=', Ball.eTemp(45).toFixed(3), 'k=', en.k.toFixed(4));
console.log(fails ? fails + ' fallos' : 'OK');
process.exitCode = fails ? 1 : 0;
