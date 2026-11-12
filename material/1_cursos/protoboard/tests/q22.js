const { loadChapter, labOf } = require('./harness');
const S = loadChapter('15-comparador.js');
{ const c = S['c15-crepuscular'].cfgs[0]; for (const [lux, p] of [[1,0.5],[10,0.5],[50,0.5],[100,0.5],[200,0.5],[1000,0.5],[200,0.2],[200,0.8]]) { const l = labOf(c); l.bench.ensure(); c.controls[0].apply(l, lux); c.controls[1].apply(l, p); l.run(0.3, 0.01); console.log('crep', lux, p, 'ok', l.bench.net.cir.error || 'conv', JSON.stringify(l.outs())); } }
{ const c = S['c15-lm393'].cfgs[0]; for (const p of [0.1, 0.3, 0.49, 0.51, 0.7, 0.95]) { const l = labOf(c); c.controls[0].apply(l, p); l.run(0.3, 0.01); console.log('393', p, l.bench.net.cir.error || 'conv', JSON.stringify(l.outs())); } }
