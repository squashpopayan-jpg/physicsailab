/* Compila el laboratorio en un único HTML.
   dist/index.html            → documento completo para abrir localmente
   dist/obra-electrica.html   → fragmento para publicar como Artifact
   Orden: lib (sin DOM, probada en Node con tests/validar.js) → ui → 90-app. */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (p) => fs.readFileSync(p, 'utf8');
const jsIn = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const lib = jsIn(path.join(root, 'src/lib')).map((f) => `/* ==== lib/${f} ==== */\n` + read(path.join(root, 'src/lib', f)));
const ui = jsIn(path.join(root, 'src/ui')).map((f) => `/* ==== ui/${f} ==== */\n` + read(path.join(root, 'src/ui', f)));
const css = read(path.join(root, 'src/styles.css'));
const js = lib.join('\n') + '\n' + ui.join('\n');
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
try { new (require('vm').Script)(js, { filename: 'bundle.js' }); } catch (e) { console.error('Error de sintaxis:', e.message, (e.stack || '').split('\n').slice(0, 3).join('\n')); process.exit(1); }
const shell = read(path.join(root, 'src/shell.html'));
const frag = shell.replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
const guardScripts = '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/obra-electrica.html'), frag);
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + frag.replace('<div class="app"', '</head>\n<body>\n<div class="app"') + '\n' + guardScripts + '</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'dist/index.html'), full);
fs.writeFileSync(path.join(root, 'dist/instalacion.html'), full);
console.log('OK', (frag.length / 1024).toFixed(0) + ' KB');
