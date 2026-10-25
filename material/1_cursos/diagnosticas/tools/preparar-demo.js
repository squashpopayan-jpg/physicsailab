/* Crea en el emulador una aplicación con 30 estudiantes (igual que lo haría el panel) y, con --abrir, la abre.
   Uso: node tools/preparar-demo.js [--abrir] [--banco id] | --cerrar */
'use strict';
var crypto = require('crypto');
var semilla = require('./semilla');
var SIM = require('./simulador');
var ALF = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function codigo() { var b = crypto.randomBytes(8), s = ''; for (var i = 0; i < 8; i++) s += ALF[b[i] % ALF.length]; return s; }

async function main() {
  var args = process.argv.slice(2), db = semilla.db;
  if (args.indexOf('--cerrar') >= 0) {
    var ses = await db('sesiones', 'GET'), sid = Object.keys(ses).filter(function (s) { return ses[s].info.estado !== 'cerrada'; })[0];
    await db('', 'PATCH', (function () { var u = {}; u['sesiones/' + sid + '/info/estado'] = 'cerrada'; u['sesiones/' + sid + '/info/cerradaEn'] = Date.now(); u['publico/' + sid + '/estado'] = 'cerrada'; return u; })());
    console.log('cerrada', sid); return;
  }
  var ib = args.indexOf('--banco'), bancoId = ib >= 0 ? args[ib + 1] : 'fisica-fundamental';
  var banco = await db('bancos/' + bancoId, 'GET');
  var sid = 'demo' + Date.now().toString(36), u = {};
  var info = { institucion: 'Colegio Champagnat de Popayán', grupo: 'Grado 11-A', bancoId: bancoId, bancoTitulo: banco.meta.titulo, bancoVersion: banco.meta.version,
    duracionMin: 90, fechaProg: '2026-11-05', nombre: 'Diagnóstico de ingreso', contacto: 'Coordinación académica', correoContacto: 'coordinacion@colegio.test',
    creada: Date.now(), estado: 'preparada', opciones: { rankingEstudiante: false, solucionario: false } };
  u['sesiones/' + sid + '/info'] = info;
  u['publico/' + sid] = { titulo: banco.meta.titulo, institucion: info.institucion, grupo: info.grupo, estado: 'preparada', duracionMin: 90, instrucciones: banco.publico.instrucciones,
    temas: Object.keys(banco.publico.temas).reduce(function (o, t) { o[t] = { nombre: banco.publico.temas[t].nombre }; return o; }, {}), preguntas: banco.publico.preguntas };
  SIM.generar(banco, 30, { semilla: 'lista' }).forEach(function (e, i) {
    var c = codigo();
    u['sesiones/' + sid + '/estudiantes/' + c] = { nombre: e.nombre, doc: e.doc, correo: 'est' + (i + 1) + '@colegio.test', agregado: Date.now() };
    u['accesos/' + c] = { sid: sid, nombre: e.nombre, extraMin: 0, prueba: banco.meta.titulo, institucion: info.institucion, grupo: info.grupo };
  });
  if (args.indexOf('--abrir') >= 0) {
    info.estado = 'abierta'; info.abiertaEn = Date.now();
    u['publico/' + sid].estado = 'abierta'; u['publico/' + sid].fin = Date.now() + 90 * 60000;
  }
  await db('', 'PATCH', u);
  console.log('aplicación', sid, 'con 30 estudiantes');
}
main().catch(function (e) { console.error(e.message); process.exit(1); });
