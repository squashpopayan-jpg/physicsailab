/* Validación: node tests/validar.js  (antes: python tests/referencias.py)
   Cada tests/t-*.js exporta function (T, C, R) y registra comprobaciones. */
const fs = require('fs'), path = require('path');
global.window = global;
const coreDir = path.join(__dirname, '..', 'src', 'core');
for (const f of fs.readdirSync(coreDir).filter((f) => /^4[45]-calc.*\.js$/.test(f)).sort()) require(path.join(coreDir, f));
const C = global.EM.calc;
let R = {};
try { R = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencias.json'), 'utf8')); } catch (e) { console.warn('Falta referencias.json: ejecute python tests/referencias.py'); }
const rows = [];
const T = {
  /* comparación relativa */
  rel(group, name, got, exp, tol) { const pass = Math.abs(got - exp) <= tol * Math.max(Math.abs(exp), 1e-300); rows.push({ group, name, got, exp, tol: 'rel ' + tol, pass }); },
  abs(group, name, got, exp, tol) { const pass = Math.abs(got - exp) <= tol; rows.push({ group, name, got, exp, tol: 'abs ' + tol, pass }); },
  /* igualdad lógica o de texto */
  eq(group, name, got, exp) { const pass = JSON.stringify(got) === JSON.stringify(exp); rows.push({ group, name, got: String(got), exp: String(exp), tol: 'exacto', pass }); },
  ok(group, name, cond) { rows.push({ group, name, got: cond ? 'cumple' : 'falla', exp: 'cumple', tol: 'lógica', pass: !!cond }); }
};
for (const f of fs.readdirSync(__dirname).filter((f) => /^t-.*\.js$/.test(f)).sort()) require(path.join(__dirname, f))(T, C, R);
const bad = rows.filter((r) => !r.pass);
for (const r of bad) console.log('✗', r.group, '|', r.name, '| obtenido', r.got, '| esperado', r.exp, '|', r.tol);
const d = new Date();
const fecha = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify({ fecha, ok: rows.length - bad.length, bad: bad.length, rows }, null, 1));
console.log(`${rows.length - bad.length}/${rows.length} pruebas superadas`);
process.exit(bad.length ? 1 : 0);
