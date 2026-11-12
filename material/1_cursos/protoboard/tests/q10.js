const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('06-divisor.js');
{ const c = sims['c6-divisor'].cfgs[0]; const l = labOf(c); l.run(0.1); console.log('div', JSON.stringify(l.outs()), l.bench.issues); }
{ const c = sims['c6-carga'].cfgs[0]; for (const rl of [1e9, 1e6, 1e5, 1e4, 1e3]) { const l = labOf(c); c.controls[0].apply(l, rl); l.run(0.1); console.log('carga', rl, JSON.stringify(l.outs())); } }
{ const c = sims['c6-pot'].cfgs[0]; for (const p of [0, 0.25, 0.5, 0.75, 1]) { const l = labOf(c); c.controls[0].apply(l, p); l.run(0.1); console.log('pot', p, JSON.stringify(l.outs()), l.bench.issues); } }
{ const c = sims['c6-ldr'].cfgs[0]; for (const lux of [1, 10, 100, 1000, 10000]) { const l = labOf(c); c.controls[0].apply(l, lux); l.run(0.1); console.log('ldr', lux, JSON.stringify(l.outs())); } }
