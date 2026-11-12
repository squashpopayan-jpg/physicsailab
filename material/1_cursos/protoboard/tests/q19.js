const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('13-mosfet.js');
const c = sims['c13-motor'].cfgs[0];
for (const [d, m] of [[0.2, 'IRLZ44N'], [0.4, 'IRLZ44N'], [0.5, 'IRLZ44N'], [0.9, 'IRLZ44N'], [0.5, 'IRF540N'], [0.98, 'IRF540N']]) {
  const l = labOf(c); c.controls[1].apply(l, m); c.controls[0].apply(l, d); l.run(2, 0.02); console.log(m, d, JSON.stringify(l.outs()), l.bench.issues.join(), 'plugged', l.bench.part('Q1')._plugged, l.bench.part('M1')._plugged);
}
