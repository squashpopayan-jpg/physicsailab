const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('04-danos.js');
const c = sims['c4-electrolitico'].cfgs[0];
for (const v of [12, 15, 16]) {
const l = labOf(c); c.controls[1].apply(l, v);
const net = l.bench.net;
for (let k = 0; k < 8 && !l.dead('C1'); k++) { l.bench.frame(0.02); const r = net.rt.C1; console.log(v, k, 'Vc', l.vp('C1').toFixed(3), 'ipk', (r.ipk||0).toFixed(2), 'pw', (r.pw||0).toFixed(3), 'T', r.T.toFixed(1), 'dm', (r.dm||0).toFixed(3), 'cc', net.rt.PS1.psu.cc, 'vpk', (r.vpk||0).toFixed(2)); }
console.log(v, 'dead', JSON.stringify(l.part('C1').dead));
}
