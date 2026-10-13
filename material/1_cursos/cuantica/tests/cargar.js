/* Carga el núcleo físico (src/phys/*.js) en Node, sin DOM. Uso: const P = require('./cargar'); */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
globalThis.window = globalThis;
const dir = path.join(__dirname, '..', 'src', 'phys');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
  vm.runInThisContext(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f });
}
module.exports = globalThis.CQ.P;
