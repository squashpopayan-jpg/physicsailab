// Diagnóstico cuadro a cuadro de un escenario: node test/debug_case.js '{"preset":"agua","mode":"tripod","wind":[0,3]}'
import * as G from '../js/geom.js';
import { runScenario } from './scenario.js';
const base = { d: 40, Hobs: 1.5, ana: 640, fTrue: 0.78, fUsed: 0.78 * 1.01, biasDeg: 0.2, noiseDeg: 0.05, wind: [3, 0], seed: 3 };
const o = { ...base, ...JSON.parse(process.argv[2] || '{}') };
const every = Number(process.argv[3] || 1), tmax = Number(process.argv[4] || 99);
const r = runScenario(o, ({ t, view, pipe, truth, tL, R, camT, dirTo }) => {
  if (t > tmax) return;
  const fi = Math.round(t * 30);
  if (fi % every) return;
  const tp = G.worldToPixel(R, camT, dirTo(truth.P));
  const s = view.sample;
  const roi = view.roi ? `roi(${view.roi.x.toFixed(0)},${view.roi.y.toFixed(0)} ${view.roi.w.toFixed(0)}x${view.roi.h.toFixed(0)})` : '';
  console.log(`${t.toFixed(3)} ${view.state.padEnd(6)} true z=${truth.P[2].toFixed(2)} px=(${tp ? tp.u.toFixed(0) + ',' + tp.v.toFixed(0) : '-'}) ` +
    (s ? `meas h=${s.h?.toFixed(2)} src=${s.src} px=(${s.u.toFixed(0)},${s.v.toFixed(0)})` : 'no meas') + ` ${roi} miss=${pipe.misses}`);
});
console.log(JSON.stringify({ truth: r.truth, apo: r.res?.apogee, sig: r.res?.sig, tApo: r.res?.tApo, n: r.n }));
