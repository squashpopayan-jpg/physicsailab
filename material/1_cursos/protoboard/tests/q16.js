const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('11-bjt.js');
{ const c = sims['c11-led'].cfgs[0]; for (const [vb, rb] of [[0,10000],[0.5,10000],[0.7,10000],[1.5,10000],[3,10000],[5,10000],[5,1000],[5,470000]]) { const l = labOf(c); c.controls[1].apply(l, rb); c.controls[0].apply(l, vb); l.run(0.5); console.log('led', vb, rb, JSON.stringify(l.outs()), l.bench.issues.join(), l.bench.part('Q1')._plugged); } }
{ const c = sims['c11-rele'].cfgs[0]; for (const d of [false, true]) { const l = labOf(c); c.controls[0].apply(l, d); let t = 0; for (; t < 20 && !l.dead('Q1'); t += 0.05) l.run(0.05, 0.05); console.log('rele diodo', d, 't', t.toFixed(2), JSON.stringify(l.outs()), l.bench.issues.join()); } }
