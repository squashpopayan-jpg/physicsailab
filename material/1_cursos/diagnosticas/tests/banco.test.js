/* Valida todos los bancos de src/bancos: estructura, distractores, compilación y verificación independiente
   de las respuestas (tests/verificaciones/<id>.js). Uso: node tests/banco.test.js */
'use strict';
var assert = require('assert');
var fs = require('fs'), path = require('path');
var A = require('../src/app/analisis');
var compilar = require('../build').compilarBanco;
var fallos = 0, n = 0;
function t(nombre, fn) { n++; try { fn(); } catch (e) { fallos++; console.log('FALLA', nombre, '-', e.message); } }

var X1 = [-3.7, -2, -0.5, 0.3, 1.7, 2, 2.5, 4.2, 6];                  // puntos para comparar expresiones de una variable
var X2 = [[5, 2], [3, 1], [7, 4], [2.5, 0.5]];                         // y de dos variables (a > b > 0)
/* tol: tolerancia relativa (p. ej. al comparar con derivadas numéricas); puntos: dónde comparar (dominios restringidos). */
function iguales(f, g, tol, puntos) {
  tol = tol || 1e-9;
  function cerca(a, b) { return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a)); }
  if (typeof f === 'number') return cerca(f, g);
  if (f.length === 2) return X2.every(function (p) { return cerca(f(p[0], p[1]), g(p[0], p[1])); });
  return (puntos || X1).every(function (x) { var a = f(x), b = g(x); return typeof a === 'boolean' ? a === b : cerca(a, b); });
}

var dir = path.join(__dirname, '..', 'src', 'bancos');
fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).forEach(function (archivo) {
  var B = require(path.join(dir, archivo)), V = require('./verificaciones/' + B.id), pre = B.id + ' ';
  var esperado = V.esperado || {}, valores = V.valores || {};

  t(pre + '50 preguntas con id único', function () {
    assert.strictEqual(B.preguntas.length, 50);
    assert.strictEqual(new Set(B.preguntas.map(function (q) { return q.id; })).size, 50);
  });
  t(pre + 'distribución por tema (4 a 7 preguntas cada uno)', function () {
    var c = {};
    B.preguntas.forEach(function (q) { assert.ok(B.temas[q.tema], 'tema ' + q.tema); c[q.tema] = (c[q.tema] || 0) + 1; });
    Object.keys(B.temas).forEach(function (k) { assert.ok(c[k] >= 4 && c[k] <= 7, k + ': ' + c[k]); });
  });
  t(pre + 'temas completos', function () {
    Object.keys(B.temas).forEach(function (k) { var x = B.temas[k]; assert.ok(x.nombre && x.corto && x.peso > 0 && x.rec && x.sub.length >= 3, k); });
  });
  t(pre + 'cada error del catálogo se usa al menos una vez', function () {
    var usados = {}; B.preguntas.forEach(function (q) { q.mal.forEach(function (m) { usados[m[1]] = 1; }); });
    var sobran = Object.keys(B.errores).filter(function (e) { return e !== 'otro' && !usados[e]; });
    assert.deepStrictEqual(sobran, []);
  });
  B.preguntas.forEach(function (q) {
    t(pre + q.id + ' estructura', function () {
      assert.ok(q.txt && q.txt.length > 15, 'enunciado');
      assert.ok(['concepto', 'grafica', 'calculo'].indexOf(q.nivel) >= 0, 'nivel');
      assert.ok([1, 2, 3].indexOf(q.dif) >= 0, 'dificultad');
      assert.strictEqual(q.mal.length, 3, 'tres distractores');
      var todas = [q.ok].concat(q.mal.map(function (m) { return m[0]; }));
      assert.strictEqual(new Set(todas).size, 4, 'opciones repetidas');
      q.mal.forEach(function (m) { assert.ok(B.errores[m[1]], 'error desconocido ' + m[1]); });
      assert.ok(q.exp && q.exp.length > 10, 'explicación');
      if (q.fig) assert.ok(/^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/.test(q.fig) && /<\/svg>$/.test(q.fig) && q.fig.indexOf('NaN') < 0 && q.fig.indexOf('undefined') < 0, 'svg');
      if (q.num) todas.forEach(function (o) { assert.ok(!isNaN(A.valorOpcion(o)), 'opción no numérica: ' + o); });
    });
  });
  t(pre + 'figuras: al menos ' + V.minFiguras + ' preguntas con imagen', function () {
    var k = B.preguntas.filter(function (q) { return q.fig; }).length; assert.ok(k >= V.minFiguras, k);
  });

  Object.keys(esperado).forEach(function (id) {
    t(pre + id + ' respuesta = cálculo independiente', function () {
      var q = B.preguntas.find(function (x) { return x.id === id; });
      var v = A.valorOpcion(q.ok), e = esperado[id];
      /* Tolerancia: 2 % (redondeos tipo «≈ 8,7») más un margen mínimo; ningún distractor puede caer dentro de ella. */
      var tol = 0.02 * Math.abs(e) + 0.006;
      assert.ok(Math.abs(v - e) <= tol, 'clave ' + v + ' vs cálculo ' + e);
      q.mal.forEach(function (m) { assert.ok(Math.abs(A.valorOpcion(m[0]) - e) > tol, 'el distractor ' + m[0] + ' también pasaría por correcto'); });
      q.mal.forEach(function (m) { var d = A.valorOpcion(m[0]); assert.ok(Math.abs(d - e) > 0.05 * Math.abs(e), 'distractor ' + m[0] + ' demasiado cerca'); });
    });
  });
  Object.keys(valores).forEach(function (id) {
    t(pre + id + ' correcta verificada y distractores incorrectos', function () {
      var q = B.preguntas.find(function (x) { return x.id === id; }), v = valores[id];
      var textos = [q.ok].concat(q.mal.map(function (m) { return m[0]; }));
      assert.deepStrictEqual(textos.slice().sort(), Object.keys(v.op).sort(), 'las opciones no coinciden con la verificación');
      if (v.previo) assert.ok(v.previo(), 'dato del enunciado inconsistente');
      function bien(o) { return v.cumple ? v.cumple(v.op[o]) : iguales(v.objetivo, v.op[o], v.tol, v.puntos); }
      assert.ok(bien(q.ok), 'la opción correcta no verifica: ' + q.ok);
      q.mal.forEach(function (m) { assert.ok(!bien(m[0]), 'el distractor también es correcto: ' + m[0]); });
    });
  });
  if (V.extra) V.extra(function (nombre, fn) { t(pre + nombre, fn); }, assert);
  if (Object.keys(valores).length) t(pre + 'todas las preguntas tienen verificación independiente', function () {
    var sin = B.preguntas.filter(function (q) { return !(q.id in esperado) && !(q.id in valores); }).map(function (q) { return q.id; });
    assert.deepStrictEqual(sin, []);
  });

  /* Compilación: la clave apunta a la opción correcta y el texto público no la delata. */
  var C = compilar(B);
  t(pre + 'compilado: clave correcta y sin respuestas en lo público', function () {
    C.publico.preguntas.forEach(function (p) {
      var q = B.preguntas.find(function (x) { return x.id === p.id; }), k = C.clave[p.id];
      assert.strictEqual(p.ops[k.r], q.ok, p.id);
      assert.strictEqual(k.err[k.r], null);
      assert.ok(!('ok' in p) && !('exp' in p) && !('r' in p));
    });
    var s = JSON.stringify(C.publico);
    assert.ok(s.indexOf('"exp"') < 0 && s.indexOf('"err"') < 0);
  });
  /* Cada estudiante ve las opciones barajadas con su código (misma lógica que prueba.html). Con 200 códigos simulados,
     la respuesta correcta debe quedar repartida de forma pareja entre A, B, C y D. */
  t(pre + 'la respuesta correcta queda repartida entre A, B, C y D para los estudiantes', function () {
    var pos = [0, 0, 0, 0], total = 0;
    for (var e = 0; e < 200; e++) {
      var code = 'SIM' + e;
      C.publico.preguntas.forEach(function (p) {
        var idx = p.ops.map(function (_, k) { return k; });
        var vista = p.fijo ? idx : A.barajar(idx, A.rng('ops:' + code + ':' + p.id));
        pos[vista.indexOf(C.clave[p.id].r)]++; total++;
      });
    }
    pos.forEach(function (c) { assert.ok(c / total > 0.2 && c / total < 0.3, 'proporciones ' + pos.map(function (x) { return (100 * x / total).toFixed(1) + ' %'; }).join(', ')); });
    assert.ok(C.publico.preguntas.every(function (p) { return !p.fijo; }), 'hay preguntas con orden fijo');
  });
  t(pre + 'compilado: en el banco las opciones numéricas quedan en orden creciente', function () {
    B.preguntas.filter(function (q) { return q.num; }).forEach(function (q) {
      var p = C.publico.preguntas.find(function (x) { return x.id === q.id; }), v = p.ops.map(A.valorOpcion);
      for (var i = 1; i < v.length; i++) assert.ok(v[i] > v[i - 1], p.id + ': ' + p.ops.join(' | '));
    });
  });
  t(pre + 'las recomendaciones no revelan respuestas del banco', function () {
    var rec = Object.keys(B.temas).map(function (k) { return B.temas[k].rec; }).join(' ');
    B.preguntas.forEach(function (q) { if (q.ok.length > 3 && !q.num) assert.ok(rec.indexOf(q.ok) < 0, q.id + ': ' + q.ok); });
  });
});

console.log((n - fallos) + '/' + n + ' pruebas de los bancos correctas');
process.exit(fallos ? 1 : 0);
