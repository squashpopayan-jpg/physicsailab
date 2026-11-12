/* node tests/run.js [filtro]  → construye cada simulación de los capítulos y muestra metas, lecturas y errores */
const fs = require('fs');
const { loadChapter, labOf } = require('./harness');
const filt = process.argv[2] || '';
const files = fs.readdirSync(__dirname + '/../src/chapters').filter((f) => f.endsWith('.js') && f.includes(filt));
let bad = 0;
for (const f of files) {
  let sims;
  try { sims = loadChapter(f); } catch (e) { console.log('✗', f, 'no carga:', e.message); bad++; continue; }
  for (const [name, sim] of Object.entries(sims)) {
    if (sim.err) { console.log('✗', name, 'error al definir:', sim.err.message); bad++; continue; }
    for (const cfg of sim.cfgs) {
      try {
        const lab = labOf(cfg);
        lab.run(0.5);
        const iss = lab.bench.issues && lab.bench.issues.length ? ' · PROBLEMAS: ' + lab.bench.issues.join('; ') : '';
        const dead = lab.bench.scene.parts.filter((p) => p.dead).map((p) => p.id);
        console.log('✓', name, '· metas', JSON.stringify(lab.goals()), '· outs', JSON.stringify(lab.outs()), dead.length ? '· QUEMADO: ' + dead : '', iss);
      } catch (e) { console.log('✗', name, e.stack.split('\n').slice(0, 3).join(' | ')); bad++; }
    }
  }
}
console.log(bad ? bad + ' con error' : 'sin errores');
