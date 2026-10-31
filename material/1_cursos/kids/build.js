/* Compila Física KIDS en un único HTML.
   dist/index.html · dist/Fisica-KIDS.html → documento completo (doble clic)
   dist/artefacto.html                 → fragmento para publicar como Artifact
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const coreFiles = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort();
const core = coreFiles.filter((f) => !f.startsWith('90-')).map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = coreFiles.filter((f) => f.startsWith('90-')).map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f)));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* ---------- Comprobaciones estáticas ---------- */
let problems = 0;
const warn = (...a) => { console.warn(...a); problems++; };
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/FK\.sim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) warn('Simulación duplicada:', m[1]);
  defined.add(m[1]);
}
const used = new Set(), ids = new Set(), nums = new Set();
let nq = 0, ne = 0;
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const t = read(path.join(chDir, f));
  const id = (t.match(/data-id="([^"]+)"/) || [])[1];
  const num = (t.match(/data-num="([^"]+)"/) || [])[1];
  if (!id) warn(`[${f}] sin data-id`);
  if (ids.has(id)) warn(`[${f}] id de capítulo repetido: ${id}`);
  ids.add(id);
  if (num && num !== '0') { if (nums.has(num)) warn(`[${f}] número repetido: ${num}`); nums.add(num); }
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) warn(`[${f}] simulación sin definir: ${m[1]}`);
    if (used.has(m[1])) warn(`[${f}] simulación usada dos veces: ${m[1]}`);
    used.add(m[1]);
  }
  const cnt = (re) => (t.match(re) || []).length;
  const pairs = [['template', /<template[\s>]/g, /<\/template>/g], ['section', /<section[\s>]/g, /<\/section>/g], ['div', /<div[\s>]/g, /<\/div>/g], ['details', /<details[\s>]/g, /<\/details>/g],
    ['table', /<table[\s>]/g, /<\/table>/g], ['listas', /<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g], ['p', /<p[\s>]/g, /<\/p>/g], ['li', /<li[\s>]/g, /<\/li>/g], ['button', /<button[\s>]/g, /<\/button>/g]];
  for (const [n, o, cl] of pairs) { const x = cnt(o), y = cnt(cl); if (x !== y) warn(`[${f}] <${n}> ${x} ≠ </${n}> ${y}`); }
  /* preguntas: data-ans dentro de rango y con explicación */
  for (const m of t.matchAll(/<div class="q" data-ans="(\d+)">([\s\S]*?)<\/div>\s*(?=<div class="q"|<\/div>)/g)) {
    nq++;
    const opts = (m[2].match(/<li>/g) || []).length;
    if (+m[1] >= opts) warn(`[${f}] pregunta con data-ans=${m[1]} pero ${opts} opciones`);
    if (!/class="why"/.test(m[2])) warn(`[${f}] pregunta sin explicación (.why)`);
  }
  ne += cnt(/class="exp"/g);
  for (const m of t.matchAll(/<div class="exp"([^>]*)>([\s\S]*?)\n<\/div>/g)) {
    if (!/class="mat"/.test(m[2]) || !/class="steps"/.test(m[2])) warn(`[${f}] experimento sin materiales o pasos`);
  }
  const who = [...t.matchAll(/data-who="([^"]+)"/g)].map((x) => x[1]);
  const valid = ['buho', 'newti', 'gotin', 'flamo', 'eco', 'lumi', 'chispa', 'cosmo', 'quarki', 'terra'];
  who.forEach((w) => { if (!valid.includes(w)) warn(`[${f}] personaje desconocido: ${w}`); });
  for (const m of t.matchAll(/<dfn(?![^>]*data-def)[^>]*>/g)) warn(`[${f}] <dfn> sin data-def`);
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
fs.writeFileSync(path.join(root, 'dist', 'Fisica-KIDS.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'artefacto.html'), fragment);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${nq} preguntas · ${ne} experimentos · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
