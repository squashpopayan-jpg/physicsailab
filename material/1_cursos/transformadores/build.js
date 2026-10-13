/* Compila el laboratorio en un solo archivo HTML.
   node build.js → dist/Transformadores_Laboratorio.html (para estudiantes, funciona sin conexión)
                   dist/transformadores-artefacto.html (fragmento para publicar como artefacto) */
const fs = require('fs'), path = require('path');
const src = (p) => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');
const css = src('styles.css'), slideCss = src('slides.css'), shell = src('shell.html');
const js = ['engine.js', 'bench.js', 'app.js'].map(src).join('\n');
if (/<\/script/i.test(js)) throw new Error('El código contiene </script> literal.');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">';
const head = '<title>Laboratorio de Transformadores</title>' +
  '<meta name="description" content="Banco virtual de transformadores con cableado libre, instrumentos reales, guía de práctica, cuaderno de datos con incertidumbre y exposición.">' +
  '<meta name="author" content="Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca">' +
  fonts + `<style>${css}</style><style id="slideCss">${slideCss}</style>`;
const body = shell + `<script>${js}</script>`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const full = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${head}</head><body>${body}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'dist', 'Transformadores_Laboratorio.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'transformadores-artefacto.html'), head + body);
console.log('Listo:', (full.length / 1024).toFixed(0), 'KB');
