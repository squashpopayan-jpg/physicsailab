const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('02-fuente.js');
const cfg = sims['c2-trampas'].cfgs[0];
for (const k of ['a','b','c','d']) {
  const lab = labOf(cfg);
  cfg.controls[0].apply(lab, k);
  lab.run(0.5);
  console.log(k, JSON.stringify(lab.dmm()), JSON.stringify(lab.bench.inst.dmm.blown));
}
