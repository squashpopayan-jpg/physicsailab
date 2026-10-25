import { runScenario } from './scenario.js';
const base = { d: 40, Hobs: 1.5, ana: 640, fTrue: 0.78, fUsed: 0.78 * 1.01, biasDeg: 0.2, noiseDeg: 0.05, wind: [3, 0], seed: 3 };
const o = { ...base, ...JSON.parse(process.argv[2] || '{}') };
const r = runScenario(o); const m = r.res;
console.log(JSON.stringify({ truth: +r.truth.toFixed(2), apo: +m.apogee.toFixed(2), sig: +m.sig.toFixed(2), drift: +m.sigDrift.toFixed(2), tApo: [+r.tApoTrue.toFixed(2), +m.tApo.toFixed(2)], ang: +r.angRms.toFixed(2), rms: +r.rms.toFixed(2), n: r.n, auto: r.nAuto }));
