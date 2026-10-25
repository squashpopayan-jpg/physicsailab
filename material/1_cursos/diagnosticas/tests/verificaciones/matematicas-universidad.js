/* Verificación independiente del banco de Matemáticas para la universidad.
   - esperado: respuestas numéricas calculadas aquí, sin mirar el banco.
   - valores: cada opción no numérica traducida a mano a un valor o a una función; la correcta debe coincidir
     con el objetivo y ninguna incorrecta puede coincidir (las expresiones se comparan en varios puntos). */
'use strict';
var S2 = Math.SQRT2, S3 = Math.sqrt(3), PI = Math.PI;
function mcm(a, b) { function mcd(x, y) { return y ? mcd(y, x % y) : x; } return a * b / mcd(a, b); }
function interp(pts, x) { for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } }
function cortes(pts, y) { var c = 0; for (var i = 1; i < pts.length; i++) { var a = pts[i - 1][1] - y, b = pts[i][1] - y; if (a * b < 0 || (b === 0 && i === pts.length - 1)) c++; } return c; }
var GRAF = [[-3, -1], [-1, 3], [2, 1], [4, 4]];
function biseccion(f, a, b) { for (var i = 0; i < 80; i++) { var m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; }

module.exports = {
  minFiguras: 25,
  esperado: {
    MU03: 8 - 2 * 3 + 4 / 2,
    MU04: Math.pow(-3, 2) - Math.pow(3, 2),
    MU15: (function (x) { return 3 * x * x - x; })(-2),
    MU16: biseccion(function (x) { return 3 * (x - 2) - (2 * x + 5); }, -100, 100),
    MU21: biseccion(function (x) { return (x + 5) - 2 * (x - 5); }, 0, 100),
    MU22: interp(GRAF, 2),
    MU23: cortes(GRAF, 2),
    MU25: (function (x) { var g = x * x; return 2 * g + 1; })(3),
    MU26: 3, // la curva 3 es la circunferencia (la única dibujada sin función en figuras-mat.cuatroCurvas)
    MU28: (8 - 2) / (3 - 1),
    MU33: Math.log(32) / Math.log(2),
    MU35: Math.log(81) / Math.log(3) - 1,
    MU36: 100 * Math.pow(2, 5),
    MU39: 10 * Math.tan(PI / 4),
    MU42: 8 * 6 - 3 * 4,
    MU43: Math.pow(10 / 2, 2), // en unidades de π cm²
    MU44: Math.hypot(6, 8),
    MU45: 180 - 65,
    MU46: 4 * 6 / 3,
    MU47: 80000 * (1 - 0.25),
    MU49: 6 * 12 / 9,
    MU50: (1 * 2 + 2 * 4 + 3 * 3 + 4 * 1) / (2 + 4 + 3 + 1)
  },
  valores: {
    MU01: { objetivo: 2 / 3 + 1 / 4, op: { '11/12': 11 / 12, '3/7': 3 / 7, '3/12': 3 / 12, '2/12': 2 / 12 } },
    MU02: { objetivo: 9 / 12, op: { '3/4': 3 / 4, '9/3': 3, '1/4': 1 / 4, '3/9': 1 / 3 } },
    MU05: { objetivo: 7 * 60 + mcm(12, 18), op: { '7:36': 7 * 60 + 36, '7:06': 7 * 60 + 6, '7:30': 7 * 60 + 30, '10:36': 10 * 60 + 36 } },
    MU06: { objetivo: Math.pow(2, 3) * Math.pow(2, 4), op: { '2⁷': Math.pow(2, 7), '2¹²': Math.pow(2, 12), '4⁷': Math.pow(4, 7), '4¹²': Math.pow(4, 12) } },
    MU07: { objetivo: function (x) { return Math.pow(x * x, 3); }, op: { 'x⁶': function (x) { return Math.pow(x, 6); }, 'x⁵': function (x) { return Math.pow(x, 5); }, 'x⁸': function (x) { return Math.pow(x, 8); }, '3x²': function (x) { return 3 * x * x; } } },
    MU08: { objetivo: Math.sqrt(50), op: { '5√2': 5 * S2, '25√2': 25 * S2, '2√5': 2 * Math.sqrt(5), '10√5': 10 * Math.sqrt(5) } },
    MU09: { objetivo: Math.pow(8, 2 / 3), op: { '4': 4, '16/3': 16 / 3, '6': 6, '2': 2 } },
    MU10: { objetivo: 3e4 * 2e-6, op: { '6 × 10⁻²': 6e-2, '6 × 10⁻²⁴': 6e-24, '5 × 10⁻²': 5e-2, '6 × 10¹⁰': 6e10 } },
    MU11: { objetivo: function (x) { return Math.pow(x + 3, 2); }, op: { 'x² + 6x + 9': function (x) { return x * x + 6 * x + 9; }, 'x² + 9': function (x) { return x * x + 9; }, 'x² + 3x + 9': function (x) { return x * x + 3 * x + 9; }, '2x + 6': function (x) { return 2 * x + 6; } } },
    MU12: { objetivo: function (x) { return x * x - 5 * x + 6; }, op: { '(x − 2)(x − 3)': function (x) { return (x - 2) * (x - 3); }, '(x + 2)(x + 3)': function (x) { return (x + 2) * (x + 3); }, '(x − 1)(x − 6)': function (x) { return (x - 1) * (x - 6); }, '(x + 2)(x − 3)': function (x) { return (x + 2) * (x - 3); } } },
    MU13: { objetivo: function (x) { return (x * x - 9) / (x - 3); }, op: { 'x + 3': function (x) { return x + 3; }, 'x − 3': function (x) { return x - 3; }, 'x² − 3': function (x) { return x * x - 3; }, '3': function () { return 3; } } },
    MU14: { objetivo: function (a, b) { return a * a - b * b; }, op: { 'a² − b²': function (a, b) { return a * a - b * b; }, '(a − b)²': function (a, b) { return (a - b) * (a - b); }, 'a(a − b)': function (a, b) { return a * (a - b); }, '2a − 2b': function (a, b) { return 2 * a - 2 * b; } } },
    MU17: { objetivo: [7, 3], op: { 'x = 7, y = 3': [7, 3], 'x = 3, y = 7': [3, 7], 'x = 6, y = 4': [6, 4], 'x = 14, y = −4': [14, -4] },
      cumple: function (v) { return v[0] + v[1] === 10 && v[0] - v[1] === 4; } },
    MU18: { op: { 'x = 0 y x = 4': [0, 4], 'Solo x = 4': [4], 'x = 2 y x = −2': [2, -2], 'x = 0 y x = −4': [0, -4] },
      cumple: function (r) { var reales = [0, 4]; return r.length === reales.length && r.every(function (x) { return x * x - 4 * x === 0; }); } },
    MU19: { op: { 'x < −2': function (x) { return x < -2; }, 'x > −2': function (x) { return x > -2; }, 'x > 5': function (x) { return x > 5; }, 'x < 2': function (x) { return x < 2; } },
      objetivo: function (x) { return -2 * x + 3 > 7; } },
    MU20: { op: { '[−1, 3)': [true, false], '(−1, 3]': [false, true], '[−1, 3]': [true, true], '(−1, 3)': [false, false] }, cumple: function (v) { return v[0] && !v[1]; } },
    MU24: { op: { 'x ≥ 2': function (x) { return x >= 2; }, 'x > 2': function (x) { return x > 2; }, 'x ≥ −2': function (x) { return x >= -2; }, 'Todos los números reales': function () { return true; } },
      objetivo: function (x) { return x - 2 >= 0; } },
    MU27: { op: { '2x + 1': function (x) { return 2 * x + 1; }, '2/(x − 1)': function (x) { return 2 / (x - 1); }, '2x − 1': function (x) { return 2 * x - 1; }, '(x + 1)/2': function (x) { return (x + 1) / 2; } },
      cumple: function (h) { var f = function (x) { return (x - 1) / 2; }; return [-3, 0.5, 2, 7].every(function (x) { return Math.abs(f(h(x)) - x) < 1e-9 && Math.abs(h(f(x)) - x) < 1e-9; }); } },
    MU29: { op: { 'y = −x/2 + 2': function (x) { return -x / 2 + 2; }, 'y = −2x + 2': function (x) { return -2 * x + 2; }, 'y = x/2 + 2': function (x) { return x / 2 + 2; }, 'y = −x/2 + 4': function (x) { return -x / 2 + 4; } },
      cumple: function (f) { return f(0) === 2 && f(4) === 0; } },
    MU30: { op: { '−1/3': -1 / 3, '3': 3, '−3': -3, '1/3': 1 / 3 }, cumple: function (m) { return Math.abs(m * 3 + 1) < 1e-12; } },
    MU31: { op: { 'y = (x − 1)² − 4': function (x) { return (x - 1) * (x - 1) - 4; }, 'y = (x + 1)² − 4': function (x) { return (x + 1) * (x + 1) - 4; }, 'y = (x − 1)² + 4': function (x) { return (x - 1) * (x - 1) + 4; }, 'y = −(x − 1)² − 4': function (x) { return -(x - 1) * (x - 1) - 4; } },
      cumple: function (f) { return f(1) === -4 && f(-1) === 0 && f(3) === 0 && f(5) > 0; } },
    MU32: { op: { '(3, −4)': [3, -4], '(−3, −4)': [-3, -4], '(3, 5)': [3, 5], '(−3, 32)': [-3, 32] },
      cumple: function (v) { var f = function (x) { return x * x - 6 * x + 5; }; return f(v[0]) === v[1] && f(v[0] + 1) === f(v[0] - 1); } },
    MU34: { objetivo: Math.log10(1000) - Math.log10(10), op: { '2': 2, 'log 990': Math.log10(990), '100': 100, '3': 3 } },
    MU37: { objetivo: 5 / 13, op: { '5/13': 5 / 13, '12/13': 12 / 13, '5/12': 5 / 12, '13/5': 13 / 5 }, previo: function () { return 12 * 12 + 5 * 5 === 13 * 13; } },
    MU38: { objetivo: Math.cos(PI / 3), op: { '1/2': 0.5, '√3/2': S3 / 2, '√2/2': S2 / 2, '√3': S3 } },
    MU40: { objetivo: 135 * PI / 180, op: { '3π/4': 3 * PI / 4, '4π/3': 4 * PI / 3, '3π/2': 3 * PI / 2, '135π': 135 * PI } },
    MU41: { op: { 'sen positivo y cos negativo': [1, -1], 'sen negativo y cos positivo': [-1, 1], 'Los dos positivos': [1, 1], 'Los dos negativos': [-1, -1] },
      cumple: function (v) { var a = 150 * PI / 180; return Math.sign(Math.sin(a)) === v[0] && Math.sign(Math.cos(a)) === v[1]; } },
    MU48: { objetivo: 1.2 * 0.8, op: { 'Es 4 % menor': 0.96, 'Es igual': 1, 'Es 4 % mayor': 1.04, 'Es 20 % menor': 0.8 } }
  }
};
