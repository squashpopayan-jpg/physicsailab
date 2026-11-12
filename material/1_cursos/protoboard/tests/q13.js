const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('09-diodos.js');
{ const c = sims['c9-curva'].cfgs[0]; for (const t of ['1N4148','1N4007','1N5819','rojo','azul']) for (const v of [1, 5, 12]) { const l = labOf(c); c.controls[0].apply(l, t); c.controls[2].apply(l, v); l.run(0.2); const o = l.outs(); console.log(t, v, o.vd, o.i, l.bench.issues.join()); } const l = labOf(c); c.controls[1].apply(l, true); c.controls[2].apply(l, 12); l.run(0.2); console.log('inv', JSON.stringify(l.outs())); }
{ const c = sims['c9-leds'].cfgs[0]; for (const k of ['uno','serie','pares','desigual']) { const l = labOf(c); c.controls[0].apply(l, k); l.run(0.2); console.log(k, JSON.stringify(l.outs()), l.bench.issues.join()); } }
{ const c = sims['c9-zener'].cfgs[0]; for (const [v, rl] of [[9,1e5],[9,1000],[9,330],[9,100],[6,330],[15,1e5],[20,1e5]]) { const l = labOf(c); c.controls[0].apply(l, v); c.controls[2].apply(l, rl); l.run(0.5); console.log('zener', v, rl, JSON.stringify(l.outs())); } }

{ const c = sims['c9-zener'].cfgs[0]; const l = labOf(c); c.controls[0].apply(l, 20); c.controls[1].apply(l, 100); c.controls[2].apply(l, 1e5); l.run(10); console.log('zener quemado?', JSON.stringify(l.outs())); }
