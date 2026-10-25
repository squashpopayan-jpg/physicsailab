/* Prueba la calificación, el consolidado y los informes con estudiantes simulados.
   Uso: node tests/analisis.test.js */
'use strict';
var assert = require('assert');
var A = require('../src/app/analisis');
var INF = require('../src/app/informe');
var SIM = require('../tools/simulador');
var banco = require('../build').compilarBanco(require('../src/bancos/fisica-fundamental'));
banco.meta.titulo = 'Física fundamental';
var n = 0, fallos = 0;
function t(nombre, fn) { n++; try { fn(); } catch (e) { fallos++; console.log('FALLA', nombre, '-', e.message); } }
var P = banco.publico.preguntas;
function perfecto() { var r = {}; P.forEach(function (q) { r[q.id] = banco.clave[q.id].r; }); return r; }

t('estudiante perfecto: 100 y fortaleza en todo', function () {
  var c = A.calificar(banco, perfecto());
  assert.strictEqual(c.aciertos, 50); assert.strictEqual(c.puntaje, 100); assert.strictEqual(c.nivel, 'fortaleza');
  assert.strictEqual(c.fortalezas.length, Object.keys(banco.publico.temas).length);
  assert.strictEqual(Object.keys(c.errores).length, 0);
  assert.strictEqual(A.recomendaciones(banco, c).length, 0);
});
t('prueba en blanco: 0, crítico, sin errores conceptuales', function () {
  var c = A.calificar(banco, {});
  assert.strictEqual(c.puntaje, 0); assert.strictEqual(c.respondidas, 0); assert.strictEqual(c.nivel, 'critico');
  assert.strictEqual(Object.keys(c.errores).length, 0);
});
t('respuestas inválidas no cuentan', function () {
  var c = A.calificar(banco, { FF01: 7, FF02: 'A', FF03: -1 });
  assert.strictEqual(c.respondidas, 0);
});
t('calificación coincide con conteo directo y registra el error del distractor', function () {
  var sims = SIM.generar(banco, 40, { semilla: 'c1' });
  sims.forEach(function (s) {
    var c = A.calificar(banco, s.resp), ok = 0, errs = {};
    P.forEach(function (q) { var r = s.resp[q.id]; if (r === banco.clave[q.id].r) ok++; else if (r !== undefined) { var e = banco.clave[q.id].err[r]; errs[e] = (errs[e] || 0) + 1; } });
    assert.strictEqual(c.aciertos, ok);
    assert.deepStrictEqual(c.errores, errs);
    var suma = Object.keys(c.porTema).reduce(function (a, k) { return a + c.porTema[k].ok; }, 0);
    assert.strictEqual(suma, ok);
  });
});
t('un error en un tema genera recomendación con ese error concreto', function () {
  var r = perfecto(), q = P.find(function (x) { return x.id === 'FF13'; }), k = banco.clave.FF13;
  var j = k.err.indexOf('fuerza_mov'); r.FF13 = j;
  ['FF14', 'FF15', 'FF16'].forEach(function (id) { r[id] = (banco.clave[id].r + 1) % 4; });
  var c = A.calificar(banco, r), rec = A.recomendaciones(banco, c);
  assert.ok(c.debilidades.indexOf('din') >= 0, 'din débil');
  var d = rec.find(function (x) { return x.tema === 'din'; });
  assert.ok(d && d.errores.indexOf(banco.errores.fuerza_mov) >= 0, 'error fuerza_mov en la recomendación');
  assert.strictEqual(rec[0].tema, 'din', 'el tema con más fallos es la primera prioridad');
});

var grupo = SIM.generar(banco, 60, { semilla: 'g1', errGrupo: ['normal_peso', 'presion_forma'], debilTema: { ele: -1.2 } });
var calc = INF.calcular(banco, grupo, null);
var g = calc.grupo;
t('consolidado: n, media y niveles cuadran', function () {
  assert.strictEqual(g.n, 60);
  var m = calc.presentaron.reduce(function (a, e) { return a + e.cal.puntaje; }, 0) / 60;
  assert.ok(Math.abs(g.media - m) < 0.06);
  assert.strictEqual(Object.keys(g.niveles).reduce(function (a, k) { return a + g.niveles[k]; }, 0), 60);
  assert.strictEqual(g.histograma.reduce(function (a, b) { return a + b; }, 0), 60);
});
t('ranking ordenado, puestos y percentiles coherentes', function () {
  for (var i = 1; i < g.ranking.length; i++) {
    var a = g.ranking[i - 1], b = g.ranking[i];
    assert.ok(a.aciertos > b.aciertos || (a.aciertos === b.aciertos && (a.tiempoMs || 0) <= (b.tiempoMs || 0)));
    assert.ok(b.puesto >= a.puesto);
  }
  assert.strictEqual(g.ranking[0].puesto, 1);
  assert.ok(g.ranking[0].percentil >= g.ranking[59].percentil);
});
t('empates exactos comparten puesto', function () {
  var e = [{ code: 'a', nombre: 'A', cal: A.calificar(banco, perfecto()), tiempoMs: 1000 }, { code: 'b', nombre: 'B', cal: A.calificar(banco, perfecto()), tiempoMs: 1000 }, { code: 'c', nombre: 'C', cal: A.calificar(banco, {}), tiempoMs: 1000 }];
  var r = A.grupo(banco, e).ranking;
  assert.deepStrictEqual(r.map(function (x) { return x.puesto; }), [1, 1, 3]);
});
t('el tema debilitado en la simulación sale como prioridad alta', function () {
  assert.strictEqual(g.prioridades[0].tema, 'ele', 'primera prioridad: ' + g.prioridades[0].tema);
});
t('los errores inyectados al grupo se detectan con más fuerza que en un grupo de control', function () {
  var control = INF.calcular(banco, SIM.generar(banco, 60, { semilla: 'g1', debilTema: { ele: -1.2 } }), null).grupo;
  function tasa(gr, id) { var e = gr.errores.find(function (x) { return x.id === id; }); return e ? e.tasa : 0; }
  ['normal_peso'].forEach(function (id) { // presion_forma no sirve: sus tres distractores son el mismo error
    assert.ok(tasa(g, id) > tasa(control, id) + 0.15, id + ': ' + tasa(g, id) + ' vs control ' + tasa(control, id));
  });
});
t('ítems: más difíciles tienen menor proporción de aciertos', function () {
  var porDif = { 1: [], 2: [], 3: [] };
  g.items.forEach(function (it) { porDif[banco.clave[it.id].dif].push(it.p); });
  var m = [1, 2, 3].map(function (d) { return A._.media(porDif[d]); });
  assert.ok(m[0] > m[1] && m[1] > m[2], m.join(' > '));
});
t('ítems: discriminación media positiva', function () {
  var d = A._.media(g.items.map(function (it) { return it.disc; }));
  assert.ok(d > 0.2, 'D media ' + d);
});
t('KR-20 alto con grupo heterogéneo y bajo con respuestas al azar', function () {
  assert.ok(g.kr20 > 0.75, 'kr20 ' + g.kr20);
  var rnd = A.rng('azar'), azar = [];
  for (var i = 0; i < 60; i++) { var r = {}; P.forEach(function (q) { r[q.id] = Math.floor(rnd() * 4); }); azar.push({ code: 'z' + i, nombre: 'z' + i, cal: A.calificar(banco, r) }); }
  var k = A.kr20(banco, azar);
  assert.ok(k < 0.4, 'kr20 azar ' + k);
});
t('frecuencias de opciones suman los respondientes', function () {
  g.items.forEach(function (it) { assert.strictEqual(it.frec.reduce(function (a, b) { return a + b; }, 0) + it.blanco, 60); });
});

var info = { institucion: 'Colegio de Prueba', grupo: '11A', nombre: 'Diagnóstico', abiertaEn: Date.now() };
var rep = INF.construirInforme(banco, info, calc);
t('informe institucional no contiene códigos de acceso', function () {
  var s = JSON.stringify(rep);
  grupo.forEach(function (e) { assert.ok(s.indexOf(e.code) < 0, 'código filtrado ' + e.code); });
});
t('informe con sinTextos no expone enunciados', function () {
  var r2 = INF.construirInforme(banco, info, calc, { sinTextos: true }), s = JSON.stringify(r2);
  assert.ok(s.indexOf('Un auto viaja a 72') < 0);
});
t('boletín sin solucionario no expone respuestas correctas', function () {
  var b = INF.construirBoletin(banco, info, calc.presentaron[0], calc, {});
  assert.ok(!b.detalle && !('puesto' in b));
  var s = JSON.stringify(b);
  assert.ok(s.indexOf('"correcta"') < 0 && s.indexOf(calc.presentaron[0].code) < 0);
  assert.ok(b.doc.indexOf('•••') === 0, 'identificación enmascarada');
});
t('boletín con opciones muestra puesto y solucionario', function () {
  var b = INF.construirBoletin(banco, info, calc.presentaron[0], calc, { ranking: true, solucionario: true });
  assert.ok(b.puesto >= 1 && b.detalle.length === 50);
});
t('los HTML se generan sin errores', function () {
  var h1 = INF.htmlInforme(rep, { integridad: true, acciones: true }), h2 = INF.htmlBoletin(INF.construirBoletin(banco, info, calc.presentaron[3], calc, { ranking: true, solucionario: true }));
  assert.ok(h1.length > 5000 && h2.length > 3000);
  assert.ok(h1.indexOf('undefined') < 0 && h2.indexOf('undefined') < 0 && h1.indexOf('NaN') < 0 && h2.indexOf('NaN') < 0);
});
t('CSV: separador ; y comillas escapadas', function () {
  var s = A.csv([['a;b', 'c"d', 'x']]);
  assert.strictEqual(s, '﻿"a;b";"c""d";x');
});
t('quien no presentó queda como ausente', function () {
  var c2 = INF.calcular(banco, grupo.slice(0, 5).concat([{ code: 'X', nombre: 'Ausente Uno', resp: {}, inicio: null }]), null);
  assert.strictEqual(c2.presentaron.length, 5); assert.strictEqual(c2.ausentes.length, 1);
});

/* Firebase elimina listas vacías, nulos y cadenas vacías no; convierte listas en objetos si les faltan índices. */
function ida_y_vuelta(v) {
  if (v === null || v === undefined) return undefined;
  if (Array.isArray(v)) { var o = {}, k = 0; v.forEach(function (x, i) { var y = ida_y_vuelta(x); if (y !== undefined) { o[i] = y; k++; } }); if (!k) return undefined; var arr = []; Object.keys(o).forEach(function (i) { arr[i] = o[i]; }); return Object.keys(o).length === v.length ? arr : o; }
  if (typeof v === 'object') { var r = {}, c = 0; Object.keys(v).forEach(function (i) { var y = ida_y_vuelta(v[i]); if (y !== undefined) { r[i] = y; c++; } }); return c ? r : undefined; }
  return v;
}
t('boletín y informe se dibujan después de pasar por Firebase (listas vacías borradas)', function () {
  var pobre = { code: 'P1', nombre: 'Sin Fortalezas', doc: '1', cal: A.calificar(banco, {}), tiempoMs: null };
  var c3 = { presentaron: [pobre].concat(calc.presentaron), ausentes: [], grupo: A.grupo(banco, [pobre].concat(calc.presentaron)) };
  [INF.construirBoletin(banco, info, pobre, c3, { ranking: true, solucionario: true }), INF.construirBoletin(banco, info, calc.presentaron[0], c3, {})].forEach(function (b) {
    var h = INF.htmlBoletin(ida_y_vuelta(JSON.parse(JSON.stringify(b))));
    assert.ok(h.indexOf('undefined') < 0 && h.indexOf('NaN') < 0);
  });
  var r = ida_y_vuelta(JSON.parse(JSON.stringify(INF.construirInforme(banco, info, c3))));
  var h = INF.htmlInforme(r, { integridad: true });
  assert.ok(h.indexOf('undefined') < 0 && h.indexOf('NaN') < 0);
  var r2 = ida_y_vuelta(JSON.parse(JSON.stringify(INF.construirInforme(banco, info, c3, { sinTextos: true }))));
  assert.ok(INF.htmlInforme(r2).indexOf('undefined') < 0);
});

console.log((n - fallos) + '/' + n + ' pruebas de análisis correctas');
process.exit(fallos ? 1 : 0);
