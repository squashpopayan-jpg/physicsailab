const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('03-senales.js');
const lab = labOf(sims['c3-scope'].cfgs[0]);
lab.run(3);
console.log('scope', JSON.stringify(lab.outs()), 'tdiv', lab.bench.inst.osc.tdiv, lab.goals());
const rc = labOf(sims['c3-rc'].cfgs[0]);
for (const f of [100, 1000, 1516, 5000, 20000]) { rc.cfg.controls[0].apply(rc, f); rc.run(8); console.log('rc', f, JSON.stringify(rc.outs())); }
const pu = labOf(sims['c3-puntas'].cfgs[0]); pu.run(2); console.log('puntas', JSON.stringify(pu.outs()));
pu.cfg.controls[0].apply(pu, 1); pu.run(2); console.log('puntas sw1 set10', JSON.stringify(pu.outs()));
const ac = labOf(sims['c3-acople'].cfgs[0]); ac.run(2); console.log('acople', JSON.stringify(ac.outs()));
