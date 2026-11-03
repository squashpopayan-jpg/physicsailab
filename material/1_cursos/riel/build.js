/* Compila el laboratorio en un solo archivo HTML.
   node build.js -> dist/Riel_de_Aire.html (para estudiantes, funciona sin conexión; sin internet usa fuentes del sistema)
                   dist/index.html
                   dist/riel-artefacto.html (fragmento para publicar como artefacto) */
const fs = require('fs'), path = require('path');
const src = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const css = src('src/styles.css'), shell = src('src/shell.html');
const three = src('vendor/three.min.js');
const js = ['src/engine.js', 'src/scene.js', 'src/app.js'].map(src).join('\n');
for (const [n, t] of [['three', three], ['código', js]]) if (/<\/script/i.test(t)) throw new Error(`El ${n} contiene </script> literal.`);
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&family=Saira+Condensed:wght@500;600;700&display=swap">';
const head = '<title>Laboratorio Virtual: Riel de Aire & Dinámica 3D | PhysicsAILab</title>' +
  '<meta name="claude:viewport-fit-sides" content="cover">' +
  '<meta name="description" content="Laboratorio 3D de mecánica: carrito sobre riel de aire con fotocompuertas, vectores de velocidad, gráficas x(t) y v(t) en tiempo real y siete montajes.">' +
  '<meta name="author" content="Mg. Manuel Alejandro Obando — Departamento de Física, Universidad del Cauca">' +
  fonts + `<style>${css}</style>`;
const guardScript = `<script src="/material/course-guard.js"></script><script>if(typeof window.PhysicsAILabGuard==='undefined'){var s=document.createElement('script');s.src='../../../course-guard.js';document.head.appendChild(s);}</script>`;
const body = shell + `<script>${three}</script><script>${js}</script>` + guardScript;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const full = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${head}</head><body>${body}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'dist', 'Riel_de_Aire.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'riel-artefacto.html'), head + body);
console.log('Riel de Aire compilado con éxito:', (full.length / 1024).toFixed(0), 'KB');
