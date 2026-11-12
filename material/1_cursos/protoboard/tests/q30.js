const { loadChapter, labOf } = require('./harness');
const S = loadChapter('21-proyectos-energia.js');
{ const c = S['p7-fuente5'].cfgs[0]; for (const [k, rl] of [['alk9',100],['alk9',22],['aa4',100],['usb',100]]) { const l = labOf(c); c.controls[0].apply(l, k); c.controls[1].apply(l, rl); l.run(0.5, 0.05); console.log('f5', k, rl, JSON.stringify(l.outs()), l.bench.issues.join()); } }
{ const c = S['p8-regulable'].cfgs[0]; for (const p of [0, 0.25, 0.5, 0.75, 1]) { const l = labOf(c); c.controls[0].apply(l, p); l.run(0.5, 0.05); console.log('317', p, JSON.stringify(l.outs()), l.bench.issues.join()); } }
{ const c = S['p9-pila'].cfgs[0]; for (const [k, rl] of [['alk9',1e9],['alk9',100],['alk9',22],['aa4',22],['li',22],['usb',22]]) { const l = labOf(c); c.controls[0].apply(l, k); c.controls[1].apply(l, rl); l.run(0.3, 0.05); console.log('pila', k, rl, JSON.stringify(l.outs())); } }
