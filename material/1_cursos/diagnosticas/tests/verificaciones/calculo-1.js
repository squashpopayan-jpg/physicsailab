/* Verificación independiente del banco de Cálculo I.
   Las derivadas se comparan con derivadas numéricas (diferencias centrales), las integrales con la regla de
   Simpson y las preguntas de gráficas con la misma función con que se dibuja la figura. */
'use strict';
var E = Math.E;
function der(f, x) { var h = 1e-5; return (f(x + h) - f(x - h)) / (2 * h); }
function der2(f, x) { var h = 1e-4; return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); }
function simpson(f, a, b) { var n = 2000, h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
function biseccion(f, a, b) { for (var i = 0; i < 80; i++) { var m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; }
function interp(pts, x) { for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } }
function derivadaDe(f) { return function (x) { return der(f, x); }; }
var NE = 'no existe';

// Funciones de las figuras (copiadas de calculo-1.js a propósito: si la figura cambia, la prueba lo detecta)
var GRAF05 = [[-2, 2], [0, -2], [2, 0], [4, 2]];
function salto(x) { return x < 2 ? x - 1 : 5 - x; }                         // CI09–CI10
function hueco(x) { return x === 1 ? 4 : x + 1; }                           // CI15
function curva16(x) { return x * x / 4 + 0.5; }                             // CI16
function curva17(x) { return x * x / 8 + 2.5; }                             // CI17
function fp(x) { return (4 - x * x) / 2; }                                  // CI42–CI43 (es f′)
function curva44(x) { return 3 - (x - 1) * (x - 1); }                       // CI44
function cubica(x) { return x * x * x - 3 * x; }                            // CI36–CI38
var POS = [0.3, 0.8, 1.7, 2.5, 4.2, 6];                                     // dominio de √x

module.exports = {
  minFiguras: 20,
  esperado: {
    CI05: interp(GRAF05, interp(GRAF05, 2)),
    CI14: 3 * 1 - 1,
    CI17: der(curva17, 2),
    CI20: der(function (t) { return t * t + 3 * t; }, 2),
    CI32: der(function (t) { var r = 5 + 2 * t; return 4 * Math.PI * r * r * r / 3; }, 0) / Math.PI,   // en unidades de π
    CI33: -der(function (t) { var x = 3 + t; return Math.sqrt(25 - x * x); }, 0),                        // rapidez con que baja
    CI34: 8 + der(function (x) { return x * x * x; }, 2) * 0.1,
    CI35: der(function (q) { return 100 + 5 * q + 0.1 * q * q; }, 50),
    CI39: biseccion(function (x) { return der2(function (z) { return z * z * z - 6 * z * z; }, x); }, 1, 3),
    CI40: (function () { var m = 0; for (var x = 0; x <= 20; x += 0.001) m = Math.max(m, x * (20 - x)); return m; })(),
    CI41: (function () { var m = -Infinity; for (var x = 0; x <= 5 + 1e-9; x += 0.001) m = Math.max(m, x * x - 4 * x); return m; })(),
    CI47: simpson(function (x) { return x; }, 0, 2),
    CI48: simpson(function (x) { return x <= 2 ? 2 : 4 - x; }, 0, 2) + simpson(function (x) { return 4 - x; }, 2, 4)
  },
  valores: {
    CI01: { op: { 'Todos los reales excepto x = 2 y x = −2': function (x) { return x !== 2 && x !== -2; }, 'Todos los reales excepto x = 2': function (x) { return x !== 2; }, 'Todos los reales excepto x = 4': function (x) { return x !== 4; }, 'Todos los números reales': function () { return true; } },
      cumple: function (p) { return [-2, 2, 4, 0, 1, -3].every(function (x) { return p(x) === isFinite(1 / (x * x - 4)); }); } },
    CI02: { objetivo: function (x) { return x * x; }, op: { 'y = (x − 2)² + 1': function (x) { return (x - 2) * (x - 2) + 1; }, 'y = (x + 2)² + 1': function (x) { return (x + 2) * (x + 2) + 1; }, 'y = (x − 1)² + 2': function (x) { return (x - 1) * (x - 1) + 2; }, 'y = (x − 2)² − 1': function (x) { return (x - 2) * (x - 2) - 1; } },
      cumple: function (g) { return [-1, 0, 1, 2, 3].every(function (x) { return g(x + 2) === x * x + 1; }); } },  // y = x² con vértice movido a (2, 1)
    CI03: { objetivo: Math.sqrt(3 * 3 - 1), op: { '2√2': 2 * Math.SQRT2, '2': 2, '8': 8, '√3': Math.sqrt(3) } },
    CI04: { op: { 'f(x) = x⁴ − 3x²': function (x) { return Math.pow(x, 4) - 3 * x * x; }, 'f(x) = x³ + x': function (x) { return x * x * x + x; }, 'f(x) = x² + x': function (x) { return x * x + x; }, 'f(x) = eˣ': function (x) { return Math.exp(x); } },
      cumple: function (f) { return [0.5, 1, 2, 3].every(function (x) { return Math.abs(f(-x) - f(x)) < 1e-12; }); } },
    CI06: { op: { '6': 6, '0': 0, 'No existe, porque da 0/0': NE, '3': 3 }, cumple: function (v) { var x = 3 + 1e-7; return typeof v === 'number' && Math.abs(v - (x * x - 9) / (x - 3)) < 1e-5; } },
    CI07: { op: { '3/2': 1.5, '0': 0, '∞': Infinity, '3': 3 }, cumple: function (v) { var x = 1e8; return Math.abs(v - (3 * x * x + 1) / (2 * x * x - x)) < 1e-6; } },
    CI08: { op: { '5': 5, '1': 1, '0': 0, '1/5': 0.2 }, cumple: function (v) { var h = 1e-6; return Math.abs(v - Math.sin(5 * h) / h) < 1e-6; } },
    CI09: { op: { '1': 1, '3': 3, '2': 2, 'No existe': NE }, cumple: function (v) { return typeof v === 'number' && Math.abs(v - salto(2 - 1e-9)) < 1e-6; } },
    CI10: { op: { 'No existe': NE, '1': 1, '3': 3, '2': 2 },
      cumple: function (v) { var L = salto(2 - 1e-9), R = salto(2 + 1e-9); return Math.abs(L - R) > 1e-3 ? v === NE : Math.abs(v - L) < 1e-6; } },
    CI11: { op: { '+∞': Infinity, '−∞': -Infinity, '0': 0, '1': 1 }, cumple: function (v) { return v === Infinity && 1 / 1e-12 > 1e11 && 1 / 1e-9 > 0; } },
    CI12: { op: { 'x = 2': ['x', 2], 'x = −1': ['x', -1], 'y = 1': ['y', 1], 'x = 1': ['x', 1] },
      cumple: function (v) { var f = function (x) { return (x + 1) / (x - 2); }; return v[0] === 'x' && Math.abs(f(v[1] + 1e-9)) > 1e6; } },
    CI13: { op: { 'y = 2': ['y', 2], 'y = 0': ['y', 0], 'x = 3': ['x', 3], 'y = −1/3': ['y', -1 / 3] },
      cumple: function (v) { var f = function (x) { return (2 * x + 1) / (x - 3); }; return v[0] === 'y' && Math.abs(f(1e9) - v[1]) < 1e-6; } },
    CI15: { op: { 'Es discontinua: el límite existe y vale 2, pero f(1) = 4': 'removible', 'Es continua': 'continua', 'Es discontinua porque el límite no existe': 'sin_limite', 'No está definida en x = 1': 'no_definida' },
      cumple: function (c) {
        var L = hueco(1 - 1e-9), R = hueco(1 + 1e-9), real = Math.abs(L - R) > 1e-6 ? 'sin_limite' : Math.abs(L - hueco(1)) < 1e-6 ? 'continua' : 'removible';
        return c === real && Math.abs(L - 2) < 1e-6;
      } },
    CI16: { op: { 'lím h→0 [f(a + h) − f(a)] / h': function (h) { return (curva16(1 + h) - curva16(1)) / h; }, 'lím h→0 [f(a + h) − f(a)]': function (h) { return curva16(1 + h) - curva16(1); }, '[f(a + h) − f(a)] / h, con h = 1': function () { return curva16(2) - curva16(1); }, 'lím h→0 f(a + h) / h': function (h) { return curva16(1 + h) / h; } },
      cumple: function (g) { return Math.abs(g(1e-7) - 1 / 2) < 1e-5; } },   // f′(x) = x/2 para la curva de la figura, en a = 1
    CI18: { op: { 'y = 6x − 9': function (x) { return 6 * x - 9; }, 'y = 6x': function (x) { return 6 * x; }, 'y = 2x + 3': function (x) { return 2 * x + 3; }, 'y = 9x − 18': function (x) { return 9 * x - 18; } },
      cumple: function (t) { return t(3) === 9 && Math.abs((t(4) - t(3)) - der(function (x) { return x * x; }, 3)) < 1e-6; } },
    CI19: { op: { 'Creciente': 'creciente', 'Positiva': 'positiva', 'Cóncava hacia arriba': 'concava', 'Constante': 'constante' },
      cumple: function (c) {  // la propiedad debe valer para TODA función con f′ > 0: se prueba con dos ejemplos distintos
        return [function (x) { return x - 10; }, function (x) { return -Math.exp(-x); }].every(function (f) {
          var xs = [-1, 0, 1, 2];
          if (!xs.every(function (x) { return der(f, x) > 0; })) return false;
          return { creciente: f(2) > f(-1), positiva: xs.every(function (x) { return f(x) > 0; }), concava: xs.every(function (x) { return der2(f, x) > 1e-6; }), constante: f(2) === f(-1) }[c];
        });
      } },
    CI21: { objetivo: derivadaDe(function (x) { return 3 * Math.pow(x, 4) - 2 * x + 7; }), tol: 1e-5,
      op: { '12x³ − 2': function (x) { return 12 * x * x * x - 2; }, '12x³ − 2 + 7': function (x) { return 12 * x * x * x + 5; }, '3x³ − 2': function (x) { return 3 * x * x * x - 2; }, '12x⁴ − 2': function (x) { return 12 * Math.pow(x, 4) - 2; } } },
    CI22: { objetivo: derivadaDe(function (x) { return x * x * Math.sin(x); }), tol: 1e-6,
      op: { '2x sen x + x² cos x': function (x) { return 2 * x * Math.sin(x) + x * x * Math.cos(x); }, '2x cos x': function (x) { return 2 * x * Math.cos(x); }, '2x sen x − x² cos x': function (x) { return 2 * x * Math.sin(x) - x * x * Math.cos(x); }, 'x² cos x': function (x) { return x * x * Math.cos(x); } } },
    CI23: { objetivo: derivadaDe(function (x) { return x / (x + 1); }), tol: 1e-6, puntos: [-3.7, -2, -0.5, 0.3, 1.7, 4.2],
      op: { '1 / (x + 1)²': function (x) { return 1 / ((x + 1) * (x + 1)); }, '1': function () { return 1; }, '−1 / (x + 1)²': function (x) { return -1 / ((x + 1) * (x + 1)); }, '(2x + 1) / (x + 1)²': function (x) { return (2 * x + 1) / ((x + 1) * (x + 1)); } } },
    CI24: { objetivo: derivadaDe(Math.sqrt), tol: 1e-6, puntos: POS,
      op: { '1 / (2√x)': function (x) { return 1 / (2 * Math.sqrt(x)); }, '√x / 2': function (x) { return Math.sqrt(x) / 2; }, '2√x': function (x) { return 2 * Math.sqrt(x); }, '1 / √x': function (x) { return 1 / Math.sqrt(x); } } },
    CI25: { objetivo: derivadaDe(function (x) { return x * Math.exp(x); }), tol: 1e-6,
      op: { 'eˣ(x + 1)': function (x) { return Math.exp(x) * (x + 1); }, 'eˣ': Math.exp, 'x·eˣ': function (x) { return x * Math.exp(x); }, 'eˣ + 1': function (x) { return Math.exp(x) + 1; } } },
    CI26: { objetivo: derivadaDe(function (x) { return 1 / (x * x); }), tol: 1e-5, puntos: [-3.7, -2, -0.8, 0.8, 1.7, 4.2],
      op: { '−2 / x³': function (x) { return -2 / (x * x * x); }, '−2 / x': function (x) { return -2 / x; }, '1 / (2x)': function (x) { return 1 / (2 * x); }, '−1 / x³': function (x) { return -1 / (x * x * x); } } },
    CI27: { objetivo: derivadaDe(function (x) { return Math.pow(3 * x + 1, 5); }), tol: 1e-5,
      op: { '15(3x + 1)⁴': function (x) { return 15 * Math.pow(3 * x + 1, 4); }, '5(3x + 1)⁴': function (x) { return 5 * Math.pow(3 * x + 1, 4); }, '3(3x + 1)⁴': function (x) { return 3 * Math.pow(3 * x + 1, 4); }, '(3x + 1)⁴': function (x) { return Math.pow(3 * x + 1, 4); } } },
    CI28: { objetivo: derivadaDe(function (x) { return Math.sin(x * x); }), tol: 1e-5,
      op: { '2x cos(x²)': function (x) { return 2 * x * Math.cos(x * x); }, 'cos(x²)': function (x) { return Math.cos(x * x); }, 'cos(2x)': function (x) { return Math.cos(2 * x); }, '−2x cos(x²)': function (x) { return -2 * x * Math.cos(x * x); } } },
    CI29: { objetivo: derivadaDe(function (x) { return Math.exp(-2 * x); }), tol: 1e-6,
      op: { '−2e⁻²ˣ': function (x) { return -2 * Math.exp(-2 * x); }, 'e⁻²ˣ': function (x) { return Math.exp(-2 * x); }, '2e⁻²ˣ': function (x) { return 2 * Math.exp(-2 * x); }, '−2x·e⁻²ˣ⁻¹': function (x) { return -2 * x * Math.exp(-2 * x - 1); } } },
    CI30: { objetivo: derivadaDe(function (x) { return Math.log(x * x + 1); }), tol: 1e-6,
      op: { '2x / (x² + 1)': function (x) { return 2 * x / (x * x + 1); }, '1 / (x² + 1)': function (x) { return 1 / (x * x + 1); }, '2x': function (x) { return 2 * x; }, '1 / (2x)': function (x) { return 1 / (2 * x); } } },
    CI31: { op: { '−3/4': -0.75, '3/4': 0.75, '−4/3': -4 / 3, '4/3': 4 / 3 },
      cumple: function (v) { return Math.abs(v - der(function (x) { return Math.sqrt(25 - x * x); }, 3)) < 1e-6; } },
    CI36: { op: { 'x = 1 y x = −1': [1, -1], 'Solo x = 0': [0], 'x = √3 y x = −√3': [Math.sqrt(3), -Math.sqrt(3)], 'x = 0, x = √3 y x = −√3': [0, Math.sqrt(3), -Math.sqrt(3)] },
      cumple: function (xs) {
        var cambios = 0; for (var x = -10; x < 10; x += 0.01) if (der(cubica, x) * der(cubica, x + 0.01) < 0) cambios++;
        return xs.length === cambios && xs.every(function (x) { return Math.abs(der(cubica, x)) < 1e-6; });
      } },
    CI37: { op: { 'En x = −1, con valor 2': [-1, 2], 'En x = 1, con valor −2': [1, -2], 'En x = −1, con valor −2': [-1, -2], 'En x = 1, con valor 2': [1, 2] },
      cumple: function (v) { return cubica(v[0]) === v[1] && cubica(v[0] - 0.01) < v[1] && cubica(v[0] + 0.01) < v[1]; } },
    CI38: { objetivo: function (x) { return der(cubica, x) < 0; },
      op: { '(−1, 1)': function (x) { return x > -1 && x < 1; }, '(−∞, −1) ∪ (1, ∞)': function (x) { return x < -1 || x > 1; }, '(0, ∞)': function (x) { return x > 0; }, '(−√3, √3)': function (x) { return Math.abs(x) < Math.sqrt(3); } } },
    CI42: { op: { 'En x = 2': 2, 'En x = −2': -2, 'En x = 0': 0, 'En ningún punto': null },
      cumple: function (v) { return v !== null && fp(v - 0.01) > 0 && fp(v + 0.01) < 0; } },
    CI43: { objetivo: function (x) { return fp(x) > 0; },
      op: { '(−2, 2)': function (x) { return x > -2 && x < 2; }, '(−∞, −2) ∪ (2, ∞)': function (x) { return x < -2 || x > 2; }, '(−∞, 0)': function (x) { return x < 0; }, '(0, ∞)': function (x) { return x > 0; } } },
    CI44: { op: { 'En C': 2.5, 'En A': -0.3, 'En B': 1, 'En ninguno': null },
      cumple: function (v) { return v !== null && der(curva44, v) < -1e-6 && [-0.3, 1, 2.5].filter(function (x) { return der(curva44, x) < -1e-6; }).length === 1; } },
    CI45: (function () {
      var c1 = function (x) { return x * x / 2 - 2; }, c2 = function (x) { return x; };
      function esDerivada(f, g) { return [-2.5, -1, 0.5, 2].every(function (x) { return Math.abs(der(f, x) - g(x)) < 1e-6; }); }
      var verdad = { '2de1': esDerivada(c1, c2), '1de2': esDerivada(c2, c1) };
      verdad.ninguna = !verdad['2de1'] && !verdad['1de2']; verdad.nosabe = false;
      return { op: { 'La curva 2 es la derivada de la curva 1': '2de1', 'La curva 1 es la derivada de la curva 2': '1de2', 'Ninguna es derivada de la otra': 'ninguna', 'No se puede saber sin las fórmulas': 'nosabe' }, cumple: function (c) { return verdad[c]; } };
    })(),
    CI46: { op: { 'x³ + 2x + C': [function (x) { return x * x * x + 2 * x; }, true], '6x + C': [function (x) { return 6 * x; }, true], 'x³ + 2 + C': [function (x) { return x * x * x + 2; }, true], 'x³ + 2x': [function (x) { return x * x * x + 2 * x; }, false] },
      cumple: function (v) { return v[1] && [-2, 0.5, 1.7, 3].every(function (x) { return Math.abs(der(v[0], x) - (3 * x * x + 2)) < 1e-5; }); } },
    CI49: { op: { 'x²': function (x) { return x * x; }, 'x³/3': function (x) { return x * x * x / 3; }, '2x': function (x) { return 2 * x; }, '0': function () { return 0; } },
      cumple: function (g) { var F = function (x) { return simpson(function (t) { return t * t; }, 0, x); }; return [0.5, 1, 1.5, 2].every(function (x) { return Math.abs(der(F, x) - g(x)) < 1e-5; }); } },
    CI50: { op: { '1': 1, 'e − 1': E - 1, '0': 0, '1 − 1/e²': 1 - 1 / (E * E) }, cumple: function (v) { return Math.abs(v - simpson(function (x) { return 1 / x; }, 1, E)) < 1e-8; } }
  },
  extra: function (t, assert) {
    t('CI17: la recta dibujada es de verdad tangente a la curva en (2, 3) y pasa por (4, 4)', function () {
      assert.ok(Math.abs(curva17(2) - 3) < 1e-12 && Math.abs(der(curva17, 2) - 0.5) < 1e-8 && 0.5 * 4 + 2 === 4);
    });
    t('CI16: la recta dibujada pasa por P y Q (es la secante)', function () {
      assert.ok(Math.abs(1 - 0.25 - curva16(1)) < 1e-12 && Math.abs(3 - 0.25 - curva16(3)) < 1e-12);
    });
    t('CI33: en el instante pedido la escalera llega a 4 m de altura', function () { assert.strictEqual(Math.sqrt(25 - 9), 4); });
  }
};
