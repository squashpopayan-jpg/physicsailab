import * as G from '../js/geom.js';
import { runScenario } from './scenario.js';
import { RocketSim } from '../js/physics.js';
const base = { d: 40, Hobs: 1.5, ana: 640, fTrue: 0.78, fUsed: 0.78 * 1.01, biasDeg: 0.2, noiseDeg: 0.05, wind: [3, 0], seed: 3 };
const o = { ...base, ...JSON.parse(process.argv[2] || '{}') };
const rows = [];
runScenario(o, ({ t, view, pipe, truth, R, camT, dirTo }) => {
  const s = view.sample;
  if (!s || pipe.state === 'armed') return;
  const td = dirTo(truth.P);
  const ang = G.angleBetween(td, G.dirFromElAz(s.el, s.az)) / G.DEG;
  const tp = G.worldToPixel(R, camT, td);
  rows.push({ t: t.toFixed(2), st: view.state, src: s.src, ang: ang.toFixed(2), sky: view.sky?.toFixed(1), true: tp ? `${tp.u.toFixed(0)},${tp.v.toFixed(0)}` : '-', meas: `${s.u.toFixed(0)},${s.v.toFixed(0)}`, z: truth.P[2].toFixed(1), h: s.h?.toFixed(1) });
});
for (const r of rows) if (Number(r.ang) > 0.8 || rows.indexOf(r) % 10 === 0) console.log(Object.values(r).join('  '));
const sim = new RocketSim(o.preset, { wind: o.wind, railTiltDeg: 1.5, railAzDeg: 200 });
const a = sim.at(sim.tApo);
console.log('apogeo', sim.apo.toFixed(1), 'pos rel. rampa', a.p.map((v) => v.toFixed(1)).join(', '));
