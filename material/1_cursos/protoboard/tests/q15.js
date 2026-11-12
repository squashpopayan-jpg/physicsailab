const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('10-rectificacion.js');
const c = sims['c10-fuente'].cfgs[0]; const l = labOf(c); c.controls[1].apply(l, 24);
l.bench.noPrefill = true; l.bench.setTdiv(0.02);
for (let k = 1; k <= 12; k++) { l.run(1, 0.05); const r = l.bench.net.rt.U1; console.log(k, 'T', l.T('U1').toFixed(0), 'hot', r.regHot, 'vout', l.v('c14', 'B-9').toFixed(2), 'dead', !!l.dead('U1')); }
