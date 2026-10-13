/* Ejecuta el catálogo de validaciones del núcleo de algoritmos (src/lib/90-checks.js).
   Uso: node tests/validar.js   → tabla en consola y docs/VALIDACION.md; código 1 si algo falla. */
const fs = require('fs');
const path = require('path');
const P = require('./cargar');

const rows = [];
let fails = 0;
const t0 = Date.now();
for (const c of P.CHECKS) {
  const t = Date.now();
  const r = P.runCheck(c);
  const ms = Date.now() - t;
  if (!r.ok) fails++;
  rows.push({ c, r, ms });
  const fmt = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(6) : v.toFixed(7)) : String(v));
  console.log(`${r.ok ? 'OK  ' : 'FALLA'} [${String(c.cap).padStart(2)}] ${c.id.padEnd(9)} ${fmt(r.v).padStart(16)}  ref ${fmt(r.ref).padStart(16)}  err ${r.err.toExponential(1)} (tol ${c.tol}${c.rel ? ' rel' : ''})  ${ms} ms  ${r.msg || ''}`);
}
const total = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${rows.length - fails}/${rows.length} pruebas superadas en ${total} s`);

const fmtMd = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(6) : +v.toPrecision(9)) : v);
const md = [
  '# Validación del núcleo de algoritmos — «Aprender de los datos»',
  '',
  'Cada simulación del curso usa las funciones de `src/lib/`. Este informe compara',
  'sus resultados con scikit-learn, SciPy y PyTorch (valores generados por',
  '`python tests/referencias.py`) y con identidades matemáticas exactas.',
  'Se regenera con `node tests/validar.js`.',
  '',
  `Resultado: **${rows.length - fails} de ${rows.length} pruebas superadas** (${new Date().toISOString().slice(0, 10)}, ${total} s).`,
  '',
  '| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.map(({ c, r }) => `| ${c.cap} | ${c.what} | ${fmtMd(r.v)}${c.unit ? ' ' + c.unit : ''} | ${fmtMd(r.ref)} | ${c.src} | ${r.err.toExponential(1)} | ${c.tol}${c.rel ? ' (rel.)' : ''} | ${r.ok ? 'OK' : 'FALLA'} |`),
  ''
].join('\n');
fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'VALIDACION.md'), md);
process.exit(fails ? 1 : 0);
