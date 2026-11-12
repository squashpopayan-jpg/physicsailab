const { loadChapter, labOf } = require('./harness');
const S = loadChapter('18-diagnostico.js'); const c = S['c18-clinica'].cfgs[0];
const tr = (name, f) => { const l = labOf(c); c.controls[0].apply(l, 3); f(l); l.bench.noBudget = true; l.run(0.3, 0.0071); console.log(name, 'simT', l.bench.simT.toFixed(3), l.bench.net.cir.error); };
tr('caso 3', () => {});
tr('C1 presente (sin falla)', (l) => { l.bench.scene.faults = []; l.bench.invalidate(); });
tr('sin C2', (l) => l.removePart('C2'));
tr('sin R1 D1 R2', (l) => { l.removePart('R1'); l.removePart('D1'); l.removePart('R2'); });
tr('sin carga ni C2', (l) => { for (const id of ['R1','D1','R2','C2']) l.removePart(id); });
