/* Ejecuta en Node las pruebas de lib/90-pruebas.js (las mismas del apéndice D).
   Uso: node tests/validar.js   → imprime la tabla y sale con código 1 si alguna falla. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..', 'src');
const ctx = { console, Math, JSON, Object, Array, Set, Map, Number, String, isFinite, Infinity, NaN, TextEncoder, Uint8Array, Uint32Array, DataView, ArrayBuffer, Date };
ctx.globalThis = ctx; ctx.window = ctx;
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(raiz, 'lib')).filter((x) => x.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(path.join(raiz, 'lib', f), 'utf8'), ctx, { filename: f });
for (const f of ['50-simbolos.js', '87-dxf.js']) vm.runInContext(fs.readFileSync(path.join(raiz, 'core', f), 'utf8'), ctx, { filename: f });
const L = ctx.RT.L;
const P = L.PRUEBAS();
let mal = 0;
const fmt = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1e5 ? v.toExponential(4) : (+v.toFixed(6)).toString()) : String(v));
for (const p of P) {
  const r = L.ejecutarPrueba(p);
  if (!r.ok) mal++;
  console.log(`${r.ok ? 'OK   ' : 'FALLA'} [${String(p.cap).padStart(2)}] ${p.que.padEnd(62)} ${fmt(r.v).padStart(12)}  ref ${fmt(r.ref).padStart(12)}  err ${fmt(r.err)}${r.msg ? '  ' + r.msg : ''}`);
}
console.log(`\n${P.length - mal} de ${P.length} pruebas superadas`);
process.exit(mal ? 1 : 0);
