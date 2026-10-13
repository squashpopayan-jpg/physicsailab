/* Compila la aplicación en un único HTML.
   dist/index.html     → documento completo para abrir localmente
   dist/vibraciones-ondas.html  → fragmento para publicar como Artifact */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const core = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort()
  .filter((f) => !f.startsWith('90-'))
  .map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f)));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* Comprobaciones */
let problems = 0;
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/EM\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Simulación duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set();
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const t = read(path.join(chDir, f));
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] simulación sin definir: ${m[1]}`); problems++; }
    used.add(m[1]);
  }
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  const a = count('('), b = count(')'), c = count('['), d = count(']');
  if (a !== b) { console.warn(`[${f}] inline abre ${a} ≠ cierra ${b}`); problems++; }
  if (c !== d) { console.warn(`[${f}] display abre ${c} ≠ cierra ${d}`); problems++; }
  const o1 = cnt(/<section[\s>]/g), o2 = cnt(/<\/section>/g);
  if (o1 !== o2) { console.warn(`[${f}] <section> ${o1} ≠ </section> ${o2}`); problems++; }
  const dv1 = cnt(/<div[\s>]/g), dv2 = cnt(/<\/div>/g);
  if (dv1 !== dv2) { console.warn(`[${f}] <div> ${dv1} ≠ </div> ${dv2}`); problems++; }
  const dt1 = cnt(/<details[\s>]/g), dt2 = cnt(/<\/details>/g);
  if (dt1 !== dt2) { console.warn(`[${f}] <details> ${dt1} ≠ </details> ${dt2}`); problems++; }
  const t1 = cnt(/<table[\s>]/g), t2 = cnt(/<\/table>/g);
  if (t1 !== t2) { console.warn(`[${f}] <table> ${t1} ≠ </table> ${t2}`); problems++; }
  const u1 = cnt(/<(ul|ol)[\s>]/g), u2 = cnt(/<\/(ul|ol)>/g);
  if (u1 !== u2) { console.warn(`[${f}] listas abiertas ${u1} ≠ cerradas ${u2}`); problems++; }
  const p1 = cnt(/<p[\s>]/g), p2 = cnt(/<\/p>/g);
  if (p1 !== p2) { console.warn(`[${f}] <p> ${p1} ≠ </p> ${p2}`); problems++; }
}
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);

const js = core.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
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
fs.writeFileSync(path.join(root, 'dist', 'vibraciones-ondas.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'Vibraciones-y-Ondas.html'), full);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
