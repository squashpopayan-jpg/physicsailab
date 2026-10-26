/* Compilador de la aplicación manu_squash_arbitraje
   Empaqueta sin dependencias externas:
   - src/shell.html
   - src/styles.css
   - src/sections/*.html
   - src/js/*.js
   - assets/logo.webp
   Genera:
   - dist/index.html (autocontenido, doble clic para abrir)
   - dist/manu-squash-arbitraje.html (standalone)
   - index.html (raíz del curso para acceso web directo)
*/
const fs = require('fs');
const path = require('path');

const root = __dirname;
const src = path.join(root, 'src');

const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');

const css = read(path.join(src, 'styles.css'));
const jsDir = path.join(src, 'js');
const js = fs.readdirSync(jsDir)
  .filter((f) => f.endsWith('.js'))
  .sort()
  .map((f) => `/* ==== ${f} ==== */\n` + read(path.join(jsDir, f)))
  .join('\n');

const secDir = path.join(src, 'sections');
const sections = fs.readdirSync(secDir)
  .filter((f) => f.endsWith('.html'))
  .sort()
  .map((f) => `<!-- ${f} -->\n` + read(path.join(secDir, f)))
  .join('\n');

let logo = '';
const logoPath = path.join(root, 'assets', 'logo.webp');
if (fs.existsSync(logoPath)) {
  logo = 'data:image/webp;base64,' + fs.readFileSync(logoPath).toString('base64');
}

if (/<\/script/i.test(js)) {
  console.error('El JS contiene </script>');
  process.exit(1);
}

const shell = read(path.join(src, 'shell.html'));
const page = shell
  .replace('{{CSS}}', () => css)
  .replace('{{SECTIONS}}', () => sections)
  .replace('{{LOGO}}', () => logo)
  .replace('{{JS}}', () => js);

const full = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="icon" href="${logo}">
<title>Manu_Squash Arbitraje · Sistema Oficial WSF</title>
</head>
<body>
${page}
<script src="/material/course-guard.js"></script>
<script>if(typeof window.PhysicsAILabGuard==='undefined'){var s=document.createElement('script');s.src='../../course-guard.js';document.head.appendChild(s);}</script>
</body>
</html>
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'manu-squash-arbitraje.html'), full, 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), full, 'utf8');

console.log(`Compilación exitosa: dist/index.html y root index.html (${(full.length / 1024).toFixed(1)} KB)`);
