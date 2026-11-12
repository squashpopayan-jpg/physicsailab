const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('10-rectificacion.js');
{ const c = sims['c10-media'].cfgs[0]; const l = labOf(c); l.run(5); console.log('media', JSON.stringify(l.outs()), l.bench.issues.join()); }
{ const c = sims['c10-puente'].cfgs[0]; for (const cv of [0, 1e-5, 1e-4, 4.7e-4, 2.2e-3]) { const l = labOf(c); c.controls[0].apply(l, cv); l.run(6); console.log('puente C', cv, JSON.stringify(l.outs()), l.bench.issues.join()); } }
{ const c = sims['c10-fuente'].cfgs[0]; for (const [rl, v] of [[1000,12],[47,12],[10,12],[47,24],[47,9]]) { const l = labOf(c); c.controls[0].apply(l, rl); c.controls[1].apply(l, v); l.run(10); console.log('fuente', rl, v, JSON.stringify(l.outs()), l.bench.issues.join()); } }
