const { loadChapter, labOf } = require('./harness');
const S = loadChapter('17-reguladores.js');
{ const c = S['c17-7805'].cfgs[0]; for (const [v, rl, hs] of [[12,5,3]]) { const l = labOf(c); c.controls[0].apply(l, v); c.controls[1].apply(l, rl); c.controls[2].apply(l, hs); for (let t = 0; t < 40; t++) l.bench.frame(0.25); console.log('7805', v, rl, hs, JSON.stringify(l.outs())); } }
{ const c = S['c17-lm317'].cfgs[0]; for (const r2 of [0.001, 240, 720, 1200, 2400]) { const l = labOf(c); c.controls[0].apply(l, r2); l.run(0.5, 0.05); console.log('317', r2, JSON.stringify(l.outs()), l.bench.issues.join()); } }
