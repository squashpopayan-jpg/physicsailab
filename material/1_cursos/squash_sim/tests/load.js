/* Carga los módulos del motor (sin DOM) en Node para pruebas. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
module.exports = function load(prefixes) {
  const dir = path.join(__dirname, '..', 'src', 'js');
  const ctx = { console, Math, JSON, Date, setTimeout, clearTimeout };
  ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()
    .filter((f) => !prefixes || prefixes.some((p) => f.startsWith(p)));
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  return ctx.MS;
};
