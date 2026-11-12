const { loadChapter, labOf } = require('./harness');
const S = loadChapter('15-comparador.js');
const c = S['c15-crepuscular'].cfgs[0]; const l = labOf(c);
c.controls[0].apply(l, 1);
l.bench.ensure(); const cir = l.bench.net.cir;
console.log('tras ensure: IN-', l.v('a11', 'B-8').toFixed(3), 'err', cir.error, 'dirty', l.bench.net.dirty);
console.log('solveDC explícito', cir.solveDC(), 'IN-', l.v('a11', 'B-8').toFixed(3));
