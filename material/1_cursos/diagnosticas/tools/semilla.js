/* Prepara los emuladores locales: crea la cuenta de docente de prueba, le da permisos y carga el banco.
   Solo para el emulador (proyecto demo-diagnosticas); nunca toca la base real.
   Cuenta de prueba local: DOCENTE_LOCAL / CLAVE_LOCAL (abajo). */
'use strict';
var fs = require('fs'), path = require('path');
var DOCENTE_LOCAL = 'docente@local.test';
var CLAVE_LOCAL = 'prueba-local-2026';
var NS = 'demo-diagnosticas-default-rtdb';
var DB = 'http://127.0.0.1:9000', AUTH = 'http://127.0.0.1:9099';

function pedir(url, op) {
  return fetch(url, op).then(function (r) { return r.text().then(function (t) { var j = t ? JSON.parse(t) : null; if (!r.ok) throw new Error(url + ' → ' + r.status + ' ' + t); return j; }); });
}
function db(ruta, metodo, cuerpo) {
  return pedir(DB + '/' + ruta + '.json?ns=' + NS, { method: metodo, headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
}
function cuenta() {
  var k = 'key=demo-key';
  return pedir(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?' + k, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: DOCENTE_LOCAL, password: CLAVE_LOCAL, returnSecureToken: true }) })
    .catch(function () {
      return pedir(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?' + k, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: DOCENTE_LOCAL, password: CLAVE_LOCAL, returnSecureToken: true }) });
    });
}
async function main() {
  var u = await cuenta();
  await db('admins/' + u.localId, 'PUT', true);
  var dir = path.join(__dirname, '..', 'dist', 'bancos');
  for (var f of fs.readdirSync(dir).filter(function (x) { return /\.json$/.test(x); })) {
    var b = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    await db('bancos/' + b.meta.id, 'PUT', b);
    await db('catalogo/' + b.meta.id, 'PUT', b.meta);
    console.log('banco cargado:', b.meta.id);
  }
  console.log('docente local listo:', DOCENTE_LOCAL, '(uid ' + u.localId + ')');
}
if (require.main === module) main().catch(function (e) { console.error(e.message); process.exit(1); });
module.exports = { DOCENTE_LOCAL: DOCENTE_LOCAL, CLAVE_LOCAL: CLAVE_LOCAL, db: db, main: main };
