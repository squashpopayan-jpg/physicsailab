const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('12-amplificador.js');
const c = sims['c12-amp'].cfgs[0];
for (const [ce, a, f] of [[true, 10, 1000], [false, 10, 1000], [true, 100, 1000], [true, 10, 100], [true, 10, 100000], [true, 150, 1000]]) {
  const l = labOf(c); c.controls[0].apply(l, ce); c.controls[1].apply(l, a); c.controls[2].apply(l, f); l.run(0.6, 0.01);
  console.log('ce', ce, 'a', a, 'f', f, JSON.stringify(l.outs()), l.bench.issues.join());
}
