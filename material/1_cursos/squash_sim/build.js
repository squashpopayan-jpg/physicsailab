/* Compila la app en un único HTML.
   dist/index.html            → documento completo para abrir con doble clic (sin conexión, salvo el PDF)
   dist/Simulador-Manu-Squash.html → copia con nombre claro para compartir
   dist/manu-squash-sim.html  → fragmento para publicar como Artifact
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const root = __dirname, src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const css = read(path.join(src, 'styles.css'));
const jsDir = path.join(src, 'js');
const js = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort().map((f) => `/* ==== ${f} ==== */\n` + read(path.join(jsDir, f))).join('\n');
const secDir = path.join(src, 'sections');
const sections = fs.readdirSync(secDir).filter((f) => f.endsWith('.html')).sort().map((f) => `<!-- ${f} -->\n` + read(path.join(secDir, f))).join('\n');
const logo = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'assets', 'logo.webp')).toString('base64');
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
/* comprobaciones simples de etiquetas */
let problems = 0;
for (const [n, o, c] of [['section', /<section[\s>]/g, /<\/section>/g], ['div', /<div[\s>]/g, /<\/div>/g], ['button', /<button[\s>]/g, /<\/button>/g], ['label', /<label[\s>]/g, /<\/label>/g], ['p', /<p[\s>]/g, /<\/p>/g], ['ul', /<ul[\s>]/g, /<\/ul>/g], ['table', /<table[\s>]/g, /<\/table>/g], ['details', /<details[\s>]/g, /<\/details>/g], ['svg', /<svg[\s>]/g, /<\/svg>/g]]) {
  const a = (sections.match(o) || []).length, b = (sections.match(c) || []).length;
  if (a !== b) { console.warn(`<${n}> ${a} ≠ </${n}> ${b}`); problems++; }
}
const ids = {}; for (const m of sections.matchAll(/\sid="([^"]+)"/g)) { if (ids[m[1]]) { console.warn('id repetido:', m[1]); problems++; } ids[m[1]] = 1; }
for (const m of js.matchAll(/U\.\$\('#([A-Za-z0-9_-]+)'/g)) if (!ids[m[1]] && !['modal', 'modalTitle', 'modalBody', 'modalRow', 'themeBtn'].includes(m[1])) { console.warn('JS usa #' + m[1] + ' que no existe en el HTML'); problems++; }
const shell = read(path.join(src, 'shell.html'));
const page = shell.replace('{{CSS}}', () => css).replace('{{SECTIONS}}', () => sections).replace('{{LOGO}}', () => logo).replace('{{JS}}', () => js);
const full = `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="icon" href="${logo}">\n</head>\n<body>\n${page}\n</body>\n</html>\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'Simulador-Manu-Squash.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'manu-squash-sim.html'), page);
console.log(`OK · ${(full.length / 1024).toFixed(0)} KB · ${Object.keys(ids).length} ids${problems ? ' · ' + problems + ' avisos' : ''}`);
