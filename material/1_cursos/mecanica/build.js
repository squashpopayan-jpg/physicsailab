/* Compila la aplicación en un único HTML.
   dist/index.html              → documento completo para abrir localmente (doble clic)
   dist/cuaderno-mecanica.html  → fragmento para publicar como Artifact
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const coreFiles = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort();
const core = coreFiles.filter((f) => !f.startsWith('90-'))
  .map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = coreFiles.filter((f) => f.startsWith('90-'))
  .map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f)));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* ---------- Comprobaciones estáticas ---------- */
let problems = 0;
const warn = (...a) => { console.warn(...a); problems++; };
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/MC\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) warn('Simulación duplicada:', m[1]);
  defined.add(m[1]);
}
const used = new Set();
const ids = new Set();
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const t = read(path.join(chDir, f));
  const id = (t.match(/data-id="([^"]+)"/) || [])[1];
  if (ids.has(id)) warn(`[${f}] id de capítulo repetido: ${id}`);
  ids.add(id);
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) warn(`[${f}] simulación sin definir: ${m[1]}`);
    used.add(m[1]);
  }
  for (const m of t.matchAll(/data-try="([^":]+):([^"]+)"/g)) {
    if (!defined.has(m[1])) warn(`[${f}] botón "probar" apunta a simulación inexistente: ${m[1]}`);
  }
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  const a = count('('), b = count(')'), c = count('['), d = count(']');
  if (a !== b) warn(`[${f}] matemática en línea: abre ${a} ≠ cierra ${b}`);
  if (c !== d) warn(`[${f}] matemática en bloque: abre ${c} ≠ cierra ${d}`);
  const pairs = [['section', /<section[\s>]/g, /<\/section>/g], ['div', /<div[\s>]/g, /<\/div>/g], ['details', /<details[\s>]/g, /<\/details>/g],
    ['table', /<table[\s>]/g, /<\/table>/g], ['listas', /<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g], ['p', /<p[\s>]/g, /<\/p>/g],
    ['figure', /<figure[\s>]/g, /<\/figure>/g], ['svg', /<svg[\s>]/g, /<\/svg>/g], ['button', /<button[\s>]/g, /<\/button>/g]];
  for (const [n, o, cl] of pairs) { const x = cnt(o), y = cnt(cl); if (x !== y) warn(`[${f}] <${n}> ${x} ≠ </${n}> ${y}`); }
}
for (const d of defined) if (!used.has(d)) console.warn('Simulación definida pero no usada:', d);

const js = core.join('\n') + '\n' + chJs.join('\n') + '\n' + appJs.join('\n');
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }

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
/* copia con nombre claro para enviar a los estudiantes (se abre con doble clic) */
fs.writeFileSync(path.join(root, 'dist', 'Cuaderno-de-Mecanica.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'cuaderno-mecanica.html'), fragment);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
