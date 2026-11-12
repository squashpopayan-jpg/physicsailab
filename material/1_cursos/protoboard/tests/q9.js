const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('05-resistores.js');
{ const c = sims['c5-colores'].cfgs[0]; const l = labOf(c); for (const r of [10, 330, 4700, 1e6]) { c.controls[0].apply(l, r); l.run(0.1); console.log('col', r, JSON.stringify(l.outs())); } }
{ const c = sims['c5-redes'].cfgs[0]; for (const k of ['serie','paralelo','mixta']) { const l = labOf(c); c.controls[0].apply(l, k); l.run(0.1); console.log('red', k, JSON.stringify(l.outs()), l.bench.issues); } }
{ const c = sims['c5-potencia'].cfgs[0]; for (const v of [5, 12, 20, 30]) { const l = labOf(c); c.controls[0].apply(l, v); l.run(6); console.log('pot', v, JSON.stringify(l.outs())); } }
