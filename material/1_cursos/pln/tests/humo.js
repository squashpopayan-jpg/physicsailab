/* Genera dist/_humo.html: copia de index.html con requestAnimationFrame sustituido por setTimeout,
   para poder probar las simulaciones en un panel de navegador oculto (donde rAF no se dispara).
   Uso: node tests/humo.js  y abrir http://localhost:8800/_humo.html#id-del-capitulo */
const fs = require('fs'), path = require('path');
const d = path.join(__dirname, '..', 'dist');
let h = fs.readFileSync(path.join(d, 'index.html'), 'utf8');
h = h.replace('<head>', '<head><script>window.requestAnimationFrame=function(f){return setTimeout(function(){f(performance.now())},30)};</script>');
fs.writeFileSync(path.join(d, '_humo.html'), h);
console.log('dist/_humo.html listo');
