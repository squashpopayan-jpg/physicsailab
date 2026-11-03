/* Validación de la biblioteca científica (src/core/*.js) de «Física Moderna».
   1) contra referencias independientes: SciPy, NumPy, SymPy, mpmath (tests/refs/refNN.py → referencias.json)
   2) contra resultados exactos y datos de la literatura (tests/val/valNN.js)
   3) cifras de las soluciones de los problemas (tests/caps/capNN.py → problemas.json)
   Ejecutar: python tests/referencias.py ; python tests/problemas.py ; node tests/validar.js */
const path = require('path');
const fs = require('fs');
const coreDir = path.join(__dirname, '../src/core');
const DOM = new Set(['00-base.js', '10-ui.js', '20-plot.js', '35-draw.js', '36-viz.js', '40-view3d.js', '90-app.js']);
for (const f of fs.readdirSync(coreDir).sort()) if (f.endsWith('.js') && !DOM.has(f)) require(path.join(coreDir, f));
let ref = {};
try { ref = require('./referencias.json'); } catch (e) { console.log('Sin referencias.json (python tests/referencias.py)'); }
const EM = globalThis.EM, P = EM.P, K = EM.qm.K;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const S = 'SciPy y NumPy', M_ = 'mpmath', Y = 'SymPy', L = 'Literatura';
const ctx = { chk, ref, EM, P, K, S, M_, Y, L };
const valDir = path.join(__dirname, 'val');
for (const f of fs.readdirSync(valDir).sort()) if (/^val.*\.js$/.test(f)) require(path.join(valDir, f))(ctx);

/* ---- Resultado ---- */
let pr = [];
try { pr = JSON.parse(fs.readFileSync(path.join(__dirname, 'problemas.json'), 'utf8')).rows; } catch (e) { console.log('Sin problemas.json (python tests/problemas.py)'); }
for (const r of pr) { rows.push(r); r.pass ? ok++ : bad++; if (!r.pass) console.log('FALLA problema', r.name, r.got, r.exp); }
const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} de ${ok + bad} pruebas superadas` + (bad ? ` · ${bad} FALLAN` : ''));
process.exit(bad ? 1 : 0);
