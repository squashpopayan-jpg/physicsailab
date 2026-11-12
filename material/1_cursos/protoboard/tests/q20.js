const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('13-mosfet.js');
const c = sims['c13-motor'].cfgs[0];
for (const dd of [true, false]) { const l = labOf(c); c.controls[1].apply(l, dd); c.controls[0].apply(l, 0.5); let t = 0; for (; t < 3 && !l.dead('Q1'); t += 0.02) l.run(0.02, 0.02); console.log('diodo', dd, 't', t.toFixed(2), JSON.stringify(l.outs())); }
