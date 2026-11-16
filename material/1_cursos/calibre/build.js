/* Compila el laboratorio en un solo archivo HTML.
   node build.js → dist/Laboratorio_Metrologia.html (para estudiantes, funciona sin conexión)
                   dist/metrologia-artefacto.html (fragmento para publicar como artefacto) */
const fs = require('fs'), path = require('path');
const src = (p) => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');
const css = src('styles.css'), shell = src('shell.html');
const js = ['engine.js', 'render.js', 'app.js'].map(src).join('\n');
if (/<\/script/i.test(js)) throw new Error('El código contiene </script> literal.');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&family=Saira+Condensed:wght@500;600;700&display=swap">';
const head = '<title>Laboratorio de Metrología: Calibrador Vernier y Micrómetro</title>' +
  '<meta name="claude:viewport-fit-sides" content="cover">' +
  '<meta name="description" content="Laboratorio virtual de metrología dimensional: calibrador vernier (pie de rey) y micrómetro con error de cero, fuerza de medición, piezas reales, unidades de longitud, incertidumbre y densidad.">' +
  '<meta name="author" content="Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca">' +
  fonts + `<style>${css}</style>`;
const guardScripts = '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n';
const body = shell + `<script>${js}</script>\n${guardScripts}`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const full = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${head}</head><body>${body}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'dist', 'Laboratorio_Metrologia.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'metrologia-artefacto.html'), head + body);
console.log('Listo:', (full.length / 1024).toFixed(0), 'KB');
