const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('07-condensadores.js');
{ const c = sims['c7-carga'].cfgs[0]; const l = labOf(c); for (let k = 0; k < 6; k++) { l.run(2); console.log('carga t', l.bench.simT.toFixed(2), JSON.stringify(l.outs())); } c.controls[0].apply(l, true); l.run(4); console.log('descarga', l.bench.simT.toFixed(2), JSON.stringify(l.outs())); }
{ const c = sims['c7-rc-scope'].cfgs[0]; const l = labOf(c); l.run(3); console.log('rc', JSON.stringify(l.outs())); for (const [r, cc, f] of [[1000,1e-6,200],[1000,1e-7,200],[10000,1e-6,200],[1000,1e-6,2000]]) { const q = labOf(c); c.controls[0].apply(q, r); c.controls[1].apply(q, cc); c.controls[2].apply(q, f); q.run(8); console.log('rc', r, cc, f, JSON.stringify(q.outs())); } }
{ const c = sims['c7-pasaaltos'].cfgs[0]; for (const f of [100, 1000, 1592, 10000]) { const l = labOf(c); c.controls[0].apply(l, f); l.run(8); console.log('hp', f, JSON.stringify(l.outs())); } }
