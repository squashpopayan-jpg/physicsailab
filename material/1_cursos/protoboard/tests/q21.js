const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('14-opamp.js');
const c = sims['c14-opamp'].cfgs[0];
for (const [k, rf, rin, a] of [['inv', 10000, 1000, 0.5], ['inv', 100000, 1000, 0.5], ['inv', 100000, 1000, 0.05], ['noinv', 10000, 1000, 0.3], ['seguidor', 10000, 1000, 1], ['inv', 47000, 10000, 1]]) {
  const l = labOf(c); c.controls[0].apply(l, k); c.controls[1].apply(l, rf); c.controls[2].apply(l, rin); c.controls[3].apply(l, a); l.run(0.5, 0.01);
  console.log(k, rf, rin, a, JSON.stringify(l.outs()), l.bench.issues.join(), 'dead', l.dead('U1'));
}
