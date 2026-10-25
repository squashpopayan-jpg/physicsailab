/* Prueba las reglas de seguridad con el emulador de Firebase (nunca contra la base real).
   Uso: npm run test:reglas   (arranca el emulador, corre esto y lo apaga) */
'use strict';
var fs = require('fs'), path = require('path');
var RUT = require('@firebase/rules-unit-testing');
var firebase = require('firebase/compat/app');
var TS = { '.sv': 'timestamp' };
var n = 0, fallos = 0;

async function caso(nombre, fn) {
  n++;
  try { await fn(); } catch (e) { fallos++; console.log('FALLA', nombre, '-', e.message); }
}

(async function () {
  var env = await RUT.initializeTestEnvironment({
    projectId: 'demo-diagnosticas',
    database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8') }
  });
  var ahora = Date.now();
  async function semilla(estado, fin, extra) {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async function (ctx) {
      await ctx.database().ref().set({
        admins: { profe: true },
        bancos: { ff: { clave: { FF01: { r: 2 } } } },
        sesiones: { S1: { info: { nombre: 'Grupo 11A' }, estudiantes: { AAAA2222: { nombre: 'Ana', doc: '123', correo: 'ana@x.co' } } } },
        publico: { S1: { estado: estado, fin: fin, preguntas: { 0: { id: 'FF01' } } }, S2: { estado: 'abierta', fin: ahora + 3600e3 } },
        accesos: {
          AAAA2222: { sid: 'S1', nombre: 'Ana', extraMin: extra || 0 },
          BBBB3333: { sid: 'S1', nombre: 'Beto', extraMin: 0 },
          CCCC4444: { sid: 'S2', nombre: 'Caro', extraMin: 0 }
        }
      });
    });
  }
  var anon = function () { return env.unauthenticatedContext().database(); };
  var est = function (uid) { return env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).database(); };
  var profe = env.authenticatedContext('profe').database();
  async function vincular(db, uid, code, sid) {
    var u = {}; u['accesos/' + code + '/uid'] = uid; u['uids/' + uid] = { code: code, sid: sid };
    return db.ref().update(u);
  }

  await semilla('abierta', ahora + 3600e3);
  await caso('sin sesión no se lee un acceso', function () { return RUT.assertFails(anon().ref('accesos/AAAA2222').get()); });
  await caso('con el código se lee el acceso', function () { return RUT.assertSucceeds(est('e1').ref('accesos/AAAA2222').get()); });
  await caso('no se puede listar los códigos', function () { return RUT.assertFails(est('e1').ref('accesos').get()); });
  await caso('el estudiante no lee bancos ni claves', function () { return RUT.assertFails(est('e1').ref('bancos/ff/clave').get()); });
  await caso('el estudiante no lee la lista de estudiantes', function () { return RUT.assertFails(est('e1').ref('sesiones/S1').get()); });
  await caso('sin vincular no ve las preguntas', function () { return RUT.assertFails(est('e1').ref('publico/S1').get()); });
  await caso('vincula su código a su dispositivo', function () { return RUT.assertSucceeds(vincular(est('e1'), 'e1', 'AAAA2222', 'S1')); });
  await caso('ya vinculado ve las preguntas de su sesión', function () { return RUT.assertSucceeds(est('e1').ref('publico/S1').get()); });
  await caso('no ve otra sesión', function () { return RUT.assertFails(est('e1').ref('publico/S2').get()); });
  await caso('otro dispositivo no puede tomar el mismo código', function () { return RUT.assertFails(vincular(est('e2'), 'e2', 'AAAA2222', 'S1')); });
  await caso('no puede declararse dueño de un código ajeno en uids', function () { return RUT.assertFails(est('e2').ref('uids/e2').set({ code: 'AAAA2222', sid: 'S1' })); });
  await caso('no puede vincularse con una sesión falsa', function () { return RUT.assertFails(vincular(est('e3'), 'e3', 'BBBB3333', 'S2')); });
  await caso('no puede darse tiempo extra', function () { return RUT.assertFails(est('e1').ref('accesos/AAAA2222/extraMin').set(60)); });
  await caso('responde una pregunta', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(2)); });
  await caso('cambia su respuesta', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });
  await caso('rechaza una opción inválida', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(9)); });
  await caso('rechaza texto como respuesta', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set('B')); });
  await caso('no responde por otro estudiante', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/BBBB3333/r/FF01').set(1)); });
  await caso('no escribe la nota ni otros campos', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/nota').set(100)); });
  await caso('lee sus propias respuestas', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222').get()); });
  await caso('no lee respuestas ajenas', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/BBBB3333').get()); });
  await caso('marca su inicio con la hora del servidor', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/inicio').set(TS)); });
  await caso('no puede reescribir el inicio', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/inicio').set(TS)); });
  await caso('no puede poner una hora inventada', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/entregado').set(123)); });
  await caso('presencia válida', function () { return RUT.assertSucceeds(est('e1').ref('presencia/S1/AAAA2222').set({ hb: TS, n: 1, vista: 3, salidas: 0, fuera: false, estado: 'respondiendo', disp: 'Android' })); });
  await caso('presencia con campos extraños se rechaza', function () { return RUT.assertFails(est('e1').ref('presencia/S1/AAAA2222').set({ hb: TS, nota: 5 })); });
  await caso('presencia ajena se rechaza', function () { return RUT.assertFails(est('e1').ref('presencia/S1/BBBB3333').set({ hb: TS })); });
  await caso('entrega la prueba', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/entregado').set(TS)); });
  await caso('después de entregar no cambia respuestas', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(2)); });

  await semilla('preparada', null);
  await vincular(est('e1'), 'e1', 'AAAA2222', 'S1');
  await caso('antes de abrir no se responde', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });
  await semilla('pausada', ahora + 3600e3);
  await vincular(est('e1'), 'e1', 'AAAA2222', 'S1');
  await caso('en pausa no se responde', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });
  await semilla('abierta', ahora - 5 * 60e3);
  await vincular(est('e1'), 'e1', 'AAAA2222', 'S1');
  await caso('vencido el tiempo no se responde', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });
  await caso('vencido el tiempo sí se puede entregar', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/entregado').set(TS)); });
  await semilla('abierta', ahora - 5 * 60e3, 10);
  await vincular(est('e1'), 'e1', 'AAAA2222', 'S1');
  await caso('con tiempo extra asignado sí responde', function () { return RUT.assertSucceeds(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });
  await semilla('cerrada', ahora + 3600e3);
  await vincular(est('e1'), 'e1', 'AAAA2222', 'S1');
  await caso('cerrada no se responde', function () { return RUT.assertFails(est('e1').ref('respuestas/S1/AAAA2222/r/FF01').set(1)); });

  await caso('el docente lee y escribe todo', async function () {
    await RUT.assertSucceeds(profe.ref('sesiones/S1').get());
    await RUT.assertSucceeds(profe.ref('accesos').get());
    await RUT.assertSucceeds(profe.ref('accesos/AAAA2222/uid').remove());
    await RUT.assertSucceeds(profe.ref('bancos/ff').get());
    await RUT.assertSucceeds(profe.ref('boletines/k1').set({ nota: 80 }));
    await RUT.assertSucceeds(profe.ref('informes/t1').set({ n: 30 }));
  });
  await caso('liberado por el docente, otro dispositivo puede tomar el código', function () { return RUT.assertSucceeds(vincular(est('e9'), 'e9', 'AAAA2222', 'S1')); });
  await caso('un no-docente no se da permisos de docente', function () { return RUT.assertFails(est('e1').ref('admins/e1').set(true)); });
  await caso('boletín legible con su clave', function () { return RUT.assertSucceeds(est('zz').ref('boletines/k1').get()); });
  await caso('boletines no listables', function () { return RUT.assertFails(est('zz').ref('boletines').get()); });
  await caso('informes no listables', function () { return RUT.assertFails(est('zz').ref('informes').get()); });
  await caso('nadie más escribe boletines', function () { return RUT.assertFails(est('zz').ref('boletines/k2').set({ nota: 100 })); });

  await env.cleanup();
  console.log((n - fallos) + '/' + n + ' pruebas de reglas correctas');
  process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
