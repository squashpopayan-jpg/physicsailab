/* Entorno local completo: compila, arranca los emuladores (auth, base de datos y hosting en http://127.0.0.1:5055)
   y carga la semilla. Uso: node tools/dev.js  (Ctrl+C para detener) */
'use strict';
var path = require('path'), cp = require('child_process');
var RAIZ = path.join(__dirname, '..');
cp.execFileSync(process.execPath, [path.join(RAIZ, 'build.js')], { stdio: 'inherit', cwd: RAIZ });
var fb = path.join(RAIZ, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
var emu = cp.spawn(process.execPath, [fb, 'emulators:start', '--only', 'auth,database,hosting', '--project', 'demo-diagnosticas'], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'inherit'] });
var sembrado = false;
emu.stdout.on('data', function (d) {
  process.stdout.write(d);
  if (!sembrado && /All emulators ready/i.test(String(d))) {
    sembrado = true;
    require('./semilla').main().then(function () { console.log('\nListo: http://127.0.0.1:5055  (panel: /panel.html)'); }).catch(function (e) { console.error('semilla:', e.message); });
  }
});
emu.on('exit', function (c) { process.exit(c || 0); });
['SIGINT', 'SIGTERM'].forEach(function (s) { process.on(s, function () { emu.kill(s); }); });
