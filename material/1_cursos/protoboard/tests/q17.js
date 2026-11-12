const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('11-bjt.js');
const c = sims['c11-rele'].cfgs[0]; const l = labOf(c); c.controls[0].apply(l, true);
l.run(0.3, 0.01); console.log('con diodo', JSON.stringify(l.outs()), 'simT', l.bench.simT.toFixed(3), l.bench.issues);
