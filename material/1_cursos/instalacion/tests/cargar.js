/* Carga la biblioteca src/lib en Node (sin DOM) y devuelve RT */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
module.exports = function cargar() {
  const ctx = { console, Math, JSON, Object, Array, Set, Map, Number, String, isFinite, Infinity, NaN };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const dir = path.join(__dirname, '..', 'src', 'lib');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  return ctx.RT;
};
