const { loadChapter, labOf } = require('./harness');
const S = loadChapter('18-diagnostico.js'); const c = S['c18-clinica'].cfgs[0];
for (const k of [1, 2, 3, 4, 5]) { const l = labOf(c); c.controls[0].apply(l, k); l.bench.noBudget = true; l.run(1.3, 0.0071); const b = l.bench;
  console.log('caso', k, 'simT', b.simT.toFixed(3), JSON.stringify(l.outs()), 'Vin(rg)', b.vRef('a12').toFixed(2), 'Vc1', b.vRef('a7').toFixed(2), 'OUT', b.vRef('a14').toFixed(2), 'dead', b.scene.parts.filter((p) => p.dead).map((p) => p.id).join()); }
