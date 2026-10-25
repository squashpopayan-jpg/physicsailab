// Comprobación estructural de la distribución: identidad de versión única,
// referencias locales existentes, orden de carga y dependencias diferidas.
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const core = read('src/core/core.js');

// Versión: una sola fuente (core.js) que deben reflejar index.html, VERSION.json y package.json.
const version = (core.match(/const HBN_VERSION = '([^']+)'/) || [])[1];
assert(version, 'HBN_VERSION no definido en core.js');
assert(html.includes(`v${version}`), `index.html no muestra v${version}`);
const vjson = JSON.parse(read('VERSION.json'));
assert.strictEqual(vjson.version, version, 'VERSION.json no coincide con HBN_VERSION');
const pkg = JSON.parse(read('package.json'));
assert.strictEqual(pkg.version, version, 'package.json no coincide con HBN_VERSION');
const cff = read('CITATION.cff');
assert(cff.includes(`version: "${version}"`), 'CITATION.cff no coincide con HBN_VERSION');

// Sin rótulos de versiones anteriores en el código ejecutable ni en la interfaz.
for (const f of ['index.html', ...fs.readdirSync(path.join(ROOT, 'src'), { recursive: true })
  .filter((p) => p.endsWith('.js')).map((p) => 'src/' + p.replace(/\\/g, '/'))]) {
  const txt = read(f);
  assert(!/v14\.8\.0-CLEAN|14_7_1|hBN Monte Carlo v14/.test(txt), `${f} contiene un rótulo de versión antiguo`);
}

assert(!html.includes('assets/js/'), 'index.html conserva rutas antiguas assets/js/');
assert(!/<script[^>]+src="https?:\/\//i.test(html), 'Hay scripts externos bloqueantes en index.html');

const refs = [];
for (const m of html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/gi)) refs.push(m[1].split('?')[0]);
const local = refs.filter((x) => !/^https?:/i.test(x));
for (const ref of local) assert(fs.existsSync(path.join(ROOT, ref)), `Recurso faltante: ${ref}`);

const scripts = [...html.matchAll(/<script\b[^>]+src="([^"]+)"/gi)].map((m) => m[1].split('?')[0]);
const expected = [
  'src/ui/i18n.js', 'src/core/core.js', 'src/ui/render.js', 'src/io/export.js', 'src/io/import.js',
  'src/geometry/structure_generator_bands.js', 'src/simulation/batch.js', 'src/research/research.js',
  'src/ui/controls.js', 'src/view/viewer3d.js',
];
assert.deepStrictEqual(scripts, expected, 'Orden/cantidad de scripts diferente del esperado');
assert(fs.statSync(path.join(ROOT, 'assets/css/styles.css')).size > 1000, 'CSS vacío o ausente');

// Controles retirados en v15 no deben reaparecer.
for (const id of ['iDelta', 'efBox', 'sEfEnsemble']) assert(!html.includes(`id="${id}"`), `control retirado presente: ${id}`);

const exportCode = read('src/io/export.js');
assert(exportCode.includes('function ensureJSZipLoaded()'), 'No existe carga diferida de JSZip');
assert(exportCode.includes('cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1'), 'URL de JSZip 3.10.1 no identificada');
const viewerCode = read('src/view/viewer3d.js');
assert(viewerCode.includes('cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'), 'Three.js r128 no identificado');
assert(viewerCode.includes('init3DFallback'), 'Fallback 3D no identificado');

for (const f of ['LICENSE', 'CITATION.cff', 'README.md', 'CHANGELOG.md']) assert(fs.existsSync(path.join(ROOT, f)), `falta ${f}`);

console.log(JSON.stringify({
  ok: true, version, localReferences: local.length, scripts: scripts.length,
  blockingExternalScripts: 0, cssBytes: fs.statSync(path.join(ROOT, 'assets/css/styles.css')).size,
  lazyDependencies: { JSZip: '3.10.1', Three: 'r128' },
}, null, 2));
