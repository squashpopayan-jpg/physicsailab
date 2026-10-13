/* Compila el curso en un único HTML.
   dist/index.html           → documento completo para abrir localmente
   dist/cuentas-claras.html  → fragmento para publicar como Artifact
   Orden del JS: núcleo de interfaz (src/core, sin 90-app) → núcleo de cálculo
   (src/lib, sin DOM, probado en Node con tests/validar.js) → capítulos → 90-app. */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');
const jsIn = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const core = jsIn(coreDir).filter((f) => !f.startsWith('90-')).map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const libDir = path.join(src, 'lib');
const lib = jsIn(libDir).map((f) => `/* ==== lib/${f} ==== */\n` + read(path.join(libDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();
let problems = 0;

/* ---------- Capítulos y comprobaciones ---------- */
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/CC\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Simulación duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set(), ids = new Set(), links = [];
const templates = [];
const BOXES = new Set(['def', 'law', 'ex', 'warn', 'note', 'hist', 'explain', 'read', 'when', 'err', 'links', 'valid', 'keys', 'evid', 'myth', 'do', 'teach', 'xl', 'co']);
for (const f of chFiles.filter((x) => x.endsWith('.html'))) {
  let t = read(path.join(chDir, f));
  const idm = t.match(/data-id="([^"]+)"/);
  if (idm) { if (ids.has(idm[1])) { console.warn(`[${f}] id de capítulo repetido: ${idm[1]}`); problems++; } ids.add(idm[1]); }
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] simulación sin definir: ${m[1]}`); problems++; }
    used.add(m[1]);
  }
  for (const m of t.matchAll(/class="box ([a-z]+)/g)) if (!BOXES.has(m[1])) { console.warn(`[${f}] recuadro desconocido: ${m[1]}`); problems++; }
  for (const m of t.matchAll(/href="(https?:[^"]+)"/g)) links.push({ f, url: m[1] });
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  const a = count('('), b = count(')'), c = count('['), d = count(']');
  if (a !== b) { console.warn(`[${f}] inline abre ${a} ≠ cierra ${b}`); problems++; }
  if (c !== d) { console.warn(`[${f}] display abre ${c} ≠ cierra ${d}`); problems++; }
  for (const mm of t.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)) if (/<[A-Za-z!\/]/.test(mm[1] || mm[2] || '')) { console.warn(`[${f}] «<» seguido de letra dentro de una fórmula (use \\lt): ${(mm[1] || mm[2]).slice(0, 60)}`); problems++; }
  const pairs = [[/<section[\s>]/g, /<\/section>/g, 'section'], [/<div[\s>]/g, /<\/div>/g, 'div'], [/<details[\s>]/g, /<\/details>/g, 'details'],
    [/<table[\s>]/g, /<\/table>/g, 'table'], [/<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g, 'listas'], [/<p[\s>]/g, /<\/p>/g, 'p'], [/<summary[\s>]/g, /<\/summary>/g, 'summary'],
    [/<tr[\s>]/g, /<\/tr>/g, 'tr'], [/<figure[\s>]/g, /<\/figure>/g, 'figure'], [/<b[\s>]/g, /<\/b>/g, 'b'], [/<li[\s>]/g, /<\/li>/g, 'li']];
  for (const [o, cl, name] of pairs) {
    const n1 = cnt(o), n2 = cnt(cl);
    if (n1 !== n2) { console.warn(`[${f}] <${name}> ${n1} ≠ </${name}> ${n2}`); problems++; }
  }
  /* Espacio sin separación entre una cifra y el signo de porcentaje en el texto */
  t = t.replace(/(\d) %/g, '$1&nbsp;%');
  templates.push(`<!-- ${f} -->\n` + t);
}
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'enlaces.json'), JSON.stringify(links, null, 1));

const js = core.join('\n') + '\n' + lib.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
try { new (require('vm').Script)(js, { filename: 'bundle.js' }); } catch (e) { console.error('Error de sintaxis en el JS compilado:', e.message, '\n', (e.stack || '').split('\n').slice(0, 3).join('\n')); process.exit(1); }

const shell = read(path.join(src, 'shell.html'));
const page = shell
  .replace('/*CSS*/', () => css)
  .replace('<!--TEMPLATES-->', () => templates.join('\n'))
  .replace('/*JS*/', () => js);
const [headPart, bodyPart] = page.split('<!--BODY-->');
const fragment = headPart + bodyPart;
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  headPart + '</head>\n<body>\n' + bodyPart + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'cuentas-claras.html'), fragment);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${links.length} enlaces · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
