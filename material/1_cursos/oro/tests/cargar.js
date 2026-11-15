/* Carga el núcleo (src/lib/*.js, sin DOM) en Node. Uso: const ML = require('./cargar'); */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
globalThis.window = globalThis;
const dir = path.join(__dirname, '..', 'src', 'lib');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
  vm.runInThisContext(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f });
}
module.exports = globalThis.ML;
