const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('02-fuente.js');
const c = sims['c2-fuente'].cfgs[0];
for (const [v, il, r] of [[12, 0.5, 22], [5, 0.5, 4.7], [5, 0.5, 1]]) {
  const l = labOf(c); c.controls[0].apply(l, v); c.controls[1].apply(l, il); c.controls[2].apply(l, r); l.run(0.5);
  console.log(v, il, r, JSON.stringify(l.bench.psuOut(1)), 'I(R1)', l.i('R1'), 'V', l.vp('R1'), JSON.stringify(l.outs()));
}
// elementos
const l = labOf(c); c.controls[0].apply(l, 12); c.controls[2].apply(l, 22); l.run(0.2);
for (const e of l.bench.net.cir.els) if (/PS1/.test(e.id)) console.log(e.id, e.type, JSON.stringify({i: e.i, dead: e.dead, v: e.v, vab: e.vab, a: e.a, b: e.b}));
console.log('PS1.p', JSON.stringify(l.bench.ip.PS1.p), 'inst', JSON.stringify(l.bench.inst.ps[1]));
