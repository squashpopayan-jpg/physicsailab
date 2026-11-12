const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('00-inicio.js');
const lab = labOf(sims['home-hero'].cfgs[0]);
const ts = [], is = [];
let last = 0, edges = [];
for (let t = 0; t < 9; t += 0.02) { lab.bench.frame(0.02); const i = lab.i('D1'); is.push(i); if (i > 0.005 && last <= 0.005) edges.push(lab.bench.simT); last = i; }
console.log('bordes de subida (s sim):', edges.map((x) => x.toFixed(3)).join(' '));
if (edges.length > 2) console.log('periodo', ((edges[edges.length-1]-edges[1])/(edges.length-2)).toFixed(3), 'esperado', (0.693*(1000+94000)*1e-5).toFixed(3));
console.log('Imax mA', Math.max(...is)*1000);
