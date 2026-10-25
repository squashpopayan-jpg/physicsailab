// Banco de pruebas headless para hBN-MC: carga core.js (y research.js) en
// Node.js con un stub mínimo de DOM.
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// ---- Stubs mínimos de DOM ----
const uiValues = {
  iCarb: '0', iFw: '4', iFp: '50', iFt: 'ac',
  iWx: '8', iWy: '8', iWpos: '25',
};
function makeEl(id) {
  return {
    id, value: uiValues[id] !== undefined ? uiValues[id] : '0',
    disabled: false, min: '2', max: '48',
    removeAttribute() {}, setAttribute() {}, style: {},
    addEventListener() {}, appendChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    getContext() { return ctxStub; }, width: 800, height: 600,
    querySelectorAll() { return []; }, querySelector() { return null; },
  };
}
const ctxStub = new Proxy({}, { get: () => () => {} });
const elCache = {};
const document = {
  getElementById(id) { if (!elCache[id]) elCache[id] = makeEl(id); return elCache[id]; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement(t) { return makeEl('tmp_' + t); }, body: makeEl('body'),
  addEventListener() {},
};
const sandbox = {
  document, console, Math, Number, Array, Object, Set, Map, Uint8Array, Int32Array, Float32Array, JSON, String, Boolean,
  isFinite, parseInt, parseFloat, Date, Promise, Error,
  setTimeout, clearTimeout, requestAnimationFrame: () => {}, localStorage: { getItem() { return null; }, setItem() {} },
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const rel of ['core/core.js', 'research/research.js']) {
  const code = fs.readFileSync(path.join(SRC, rel), 'utf8');
  try {
    vm.runInContext(code, sandbox, { filename: rel });
  } catch (e) {
    console.error(`ERROR cargando ${rel}:`, e.message);
    process.exit(1);
  }
}

module.exports = { sandbox, run: (code) => vm.runInContext(code, sandbox) };

if (require.main === module) {
  const R = (c) => vm.runInContext(c, sandbox);
  console.log(`hBN-MC v${R('HBN_VERSION')} cargado OK (core + research)`);
  console.log('Parámetros:', JSON.stringify(R('getModelParameters()')));
}
