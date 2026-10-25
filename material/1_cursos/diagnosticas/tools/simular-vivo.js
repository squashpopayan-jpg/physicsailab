/* Simula estudiantes reales contra los emuladores: cada uno usa el SDK de Firebase igual que prueba.html
   (ingreso anónimo, vinculación del código, latidos de presencia, respuestas a lo largo del tiempo, entrega).
   Uso: node tools/simular-vivo.js [--dejar N] [--minutos M]
     --dejar N    deja libres los N primeros estudiantes (orden alfabético) para presentarlos a mano
     --minutos M  minutos reales que tarda la simulación completa (por defecto 4) */
'use strict';
var firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/database');
var A = require('../src/app/analisis');
var SIM = require('./simulador');
var semilla = require('./semilla');

var args = process.argv.slice(2);
function arg(n, d) { var i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; }
var DEJAR = +arg('dejar', 1), MINUTOS = +arg('minutos', 4);
var CFG = { apiKey: 'demo-key', projectId: 'demo-diagnosticas', databaseURL: 'http://127.0.0.1:9000?ns=demo-diagnosticas-default-rtdb', authDomain: 'localhost' };
var TS = firebase.database.ServerValue.TIMESTAMP;
function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function main() {
  var ses = await semilla.db('sesiones', 'GET');
  var sid = Object.keys(ses || {}).filter(function (s) { return ses[s].info.estado !== 'cerrada'; }).sort(function (a, b) { return ses[b].info.creada - ses[a].info.creada; })[0];
  if (!sid) throw new Error('No hay una aplicación abierta o preparada.');
  var info = ses[sid].info, est = ses[sid].estudiantes;
  var banco = await semilla.db('bancos/' + info.bancoId, 'GET');
  var codes = Object.keys(est).sort(function (a, b) { return est[a].nombre.localeCompare(est[b].nombre, 'es'); });
  var libres = codes.slice(0, DEJAR), sims = SIM.generar(banco, codes.length, { semilla: 'vivo', errGrupo: ['normal_peso', 'fuerza_mov'], debilTema: { ele: -1 } });
  console.log('Aplicación', info.institucion, info.grupo, '·', codes.length, 'inscritos · libres para ti:', libres.map(function (c) { return est[c].nombre + ' ' + c; }).join(', '));
  var perfiles = codes.slice(DEJAR).map(function (c, k) {
    var r = k % 14;
    return { code: c, sim: sims[k], nunca: r === 13, tarde: r === 5, salidor: r === 3 || r === 9, cae: r === 7, lento: r === 11 };
  });
  await Promise.all(perfiles.map(function (p, k) { return estudiante(p, k, sid, banco); }));
  console.log('Simulación terminada.');
  process.exit(0);
}

async function estudiante(p, k, sid, banco) {
  if (p.nunca) return; // no se presenta
  await esperar((p.tarde ? 40000 : 1500) + k * 400);
  var app = firebase.initializeApp(CFG, 'e' + k), auth = app.auth(), db = app.database();
  auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
  db.useEmulator('127.0.0.1', 9000);
  var u = (await auth.signInAnonymously()).user, code = p.code;
  var acc = (await db.ref('accesos/' + code).get()).val();
  var b = {}; b['accesos/' + code + '/uid'] = u.uid; b['uids/' + u.uid] = { code: code, sid: sid };
  await db.ref().update(b);
  var pres = { n: 0, vista: 1, salidas: 0, fuera: false, estado: 'esperando', disp: ['Android · Chrome · 393px', 'Windows · Chrome · 1366px', 'iOS · Safari · 390px', 'Chromebook · Chrome · 1366px'][k % 4] };
  var vivo = true;
  function latido() { if (vivo) return db.ref('presencia/' + sid + '/' + code).set(Object.assign({ hb: TS }, pres)).catch(function () {}); }
  latido();
  var hb = setInterval(latido, 15000);
  var estado = null;
  db.ref('publico/' + sid + '/estado').on('value', function (s) { estado = s.val(); });
  while (estado !== 'abierta') { await esperar(500); if (estado === 'cerrada') return; }
  await db.ref('respuestas/' + sid + '/' + code + '/inicio').set(TS);
  pres.estado = 'respondiendo'; latido();
  var orden = A.barajar(banco.publico.preguntas.map(function (q) { return q.id; }), A.rng('orden:' + code));
  var total = MINUTOS * 60000 * (p.lento ? 1.15 : 0.55 + 0.4 * ((k * 37) % 10) / 10), paso = total / orden.length;
  for (var i = 0; i < orden.length; i++) {
    if (estado === 'cerrada') break;
    while (estado === 'pausada') { pres.estado = 'pausa'; await esperar(500); }
    pres.estado = 'respondiendo';
    await esperar(paso * (0.5 + Math.random()));
    if (p.cae && i === 20) { vivo = false; clearInterval(hb); db.goOffline(); console.log(code, 'se desconecta'); await esperar(70000); db.goOnline(); vivo = true; hb = setInterval(latido, 15000); console.log(code, 'vuelve'); }
    if (p.salidor && i % 9 === 4) { pres.salidas++; pres.fuera = true; latido(); await esperar(4000); pres.fuera = false; }
    var q = orden[i];
    pres.vista = i + 1;
    if (q in p.sim.resp) { await db.ref('respuestas/' + sid + '/' + code + '/r/' + q).set(p.sim.resp[q]).catch(function () {}); pres.n++; }
    if (i % 3 === 0) latido();
  }
  if (estado !== 'cerrada') await db.ref('respuestas/' + sid + '/' + code + '/entregado').set(TS);
  pres.estado = 'entregado'; await latido();
  clearInterval(hb);
}

main().catch(function (e) { console.error(e); process.exit(1); });
