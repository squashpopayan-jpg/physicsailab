/* ==========================================================================
   COMPILADOR DE LABORATORIO DE PÉNDULO SIMPLE Y MEDICIÓN DE GRAVEDAD
   Genera: dist/Laboratorio_Pendulo.html y dist/index.html
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const src = (p) => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');

const css = src('styles.css');
const shell = src('shell.html');
const js = ['engine.js', 'bench.js', 'app.js'].map(src).join('\n\n');

if (/<\/script/i.test(js)) {
  throw new Error('El código JavaScript contiene </script> literal. Debe escaparse.');
}

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&family=Saira+Condensed:wght@500;600;700&display=swap">';

const head = '<title>Laboratorio Virtual: Péndulo Simple y Medición de la Gravedad (g) · PhysicsAILab</title>' +
  '<meta name="description" content="Laboratorio virtual universitario de Péndulo Simple y Medición de la Gravedad con 24 puestos de trabajo para grupos, cronómetro de precisión, fotocompuerta, regresión lineal por mínimos cuadrados y tratamiento riguroso de errores (GUM).">' +
  '<meta name="author" content="Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca">' +
  fonts +
  `<style>${css}</style>`;

const body = shell + `<script>${js}</script>`;

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const fullHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ${head}
</head>
<body>
  ${body}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'dist', 'Laboratorio_Pendulo.html'), fullHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), fullHtml, 'utf8');

console.log('✅ Laboratorio de Péndulo Simple compilado con éxito:');
console.log('   - dist/Laboratorio_Pendulo.html (' + (fullHtml.length / 1024).toFixed(1) + ' KB)');
console.log('   - dist/index.html');
