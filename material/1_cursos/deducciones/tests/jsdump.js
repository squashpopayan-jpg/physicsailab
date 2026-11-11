/* Carga la biblioteca de fórmulas (sin DOM) y vuelca, para cada explorador EM.formula, 8 muestras de
   parámetros dentro de sus deslizadores con las salidas y los exponentes locales → tests/jsvalues.json
   (lo compara dlib.fsim contra la expresión simbólica de SymPy). */
const fs = require('fs'), path = require('path');
globalThis.window = globalThis;
globalThis.document = { documentElement: { getAttribute() { return null; }, style: {} } };
globalThis.MutationObserver = class { observe() {} };
globalThis.matchMedia = () => ({ addEventListener() {}, matches: false });
const load = (f) => require(path.join(__dirname, '..', f));
const core = path.join('src', 'core');
for (const f of fs.readdirSync(path.join(__dirname, '..', core)).sort()) {
  if (/^(00|30|31|32)-/.test(f) && !/^32-schrod/.test(f)) load(path.join(core, f));
}
const EM = globalThis.EM;
const chDir = path.join(__dirname, '..', 'src', 'chapters');
for (const f of fs.readdirSync(chDir).sort()) if (f.endsWith('.js')) load(path.join('src', 'chapters', f));
let seed = 12345;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const out = {};
for (const [id, spec] of Object.entries(EM.F)) {
  const samples = [];
  for (let s = 0; s < 8; s++) {
    const p = {};
    for (const q of spec.params) {
      if (s === 0) p[q.k] = q.value;
      else if (q.min === q.max) p[q.k] = q.min;
      else p[q.k] = q.log ? q.min * Math.pow(q.max / q.min, rnd()) : q.min + (q.max - q.min) * (0.02 + 0.96 * rnd());
    }
    const o = {}, el = {};
    for (const O of spec.outs) {
      o[O.k] = O.f(p);
      el[O.k] = {};
      for (const q of spec.params) if (!q.fixed) { const n = EM.formulaMath.elasticity(O.f, p, q.k); el[O.k][q.k] = Number.isFinite(n) ? n : null; }
    }
    samples.push({ p, out: o, el });
  }
  out[id] = { samples };
}
fs.writeFileSync(path.join(__dirname, 'jsvalues.json'), JSON.stringify(out));
console.log('jsdump:', Object.keys(out).length, 'exploradores');
