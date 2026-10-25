/* Verificación independiente del banco de Cálculo II.
   - Antiderivadas: se deriva numéricamente cada opción y se compara con el integrando.
   - Integrales definidas, áreas y volúmenes: regla de Simpson (con otro método cuando se puede, p. ej. arandelas en y).
   - Impropias: cambio de variable exponencial y comparación de dos colas muy lejanas.
   - Series: sumas parciales, razón y raíz evaluadas numéricamente.
   - Fracciones parciales: ajuste por mínimos cuadrados de cada forma propuesta. */
'use strict';
var E = Math.E, PI = Math.PI, D = 'diverge';
function der(f, x) { var h = 1e-5; return (f(x + h) - f(x - h)) / (2 * h); }
function der2(f, x) { var h = 1e-4; return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); }
function simpson(f, a, b, n) { n = n || 4000; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
function cerca(a, b, tol) {
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  if (!isFinite(a) || !isFinite(b)) return a === b;
  return Math.abs(a - b) <= (tol || 1e-6) * Math.max(1, Math.abs(b));
}
/* ∫ₐ^∞ f: con x = a·eᵘ la cola se vuelve una integral en u; si dos cortes muy lejanos coinciden, converge. */
function impropiaInf(f, a) {
  var g = function (u) { var x = a * Math.exp(u); return f(x) * x; };
  var I1 = simpson(g, 0, 150), I2 = simpson(g, 0, 300);
  return Math.abs(I2 - I1) < 1e-4 * Math.max(1, Math.abs(I2)) ? I2 : D;   // las divergentes difieren en órdenes de magnitud
}
/* ∫₀ᵇ f con f no acotada en 0: x = b·e⁻ᵘ. */
function impropiaCero(f, b) {
  var g = function (u) { var x = b * Math.exp(-u); return f(x) * x; };
  var I1 = simpson(g, 0, 150), I2 = simpson(g, 0, 300);
  return Math.abs(I2 - I1) < 1e-4 * Math.max(1, Math.abs(I2)) ? I2 : D;
}
function suma(a, N) { var s = 0; for (var n = 1; n <= N; n++) s += a(n); return s; }
function serieConverge(a) { return Math.abs(suma(a, 400000) - suma(a, 200000)) < 1e-4; }
/* Antiderivadas: la opción F es correcta si F′ = integrando en los puntos dados. */
function antiderivada(integrando, puntos) {
  return function (F) { return puntos.every(function (x) { return cerca(der(F, x), integrando(x), 1e-5); }); };
}
var X = [-2.3, -0.7, 0.4, 1.3, 2.6];
/* Mínimos cuadrados: ¿puede la combinación de las funciones base reproducir g? */
function ajusta(base, g) {
  var xs = []; for (var i = 0; i < 24; i++) xs.push(-3.1 + i * 0.29);
  xs = xs.filter(function (x) { return Math.abs(x - 1) > 0.05 && Math.abs(x + 1) > 0.05; });
  var k = base.length, A = [], b = [];
  for (var r = 0; r < k; r++) { A.push([]); b.push(0); for (var c = 0; c < k; c++) A[r].push(0); }
  xs.forEach(function (x) { for (var r = 0; r < k; r++) { b[r] += base[r](x) * g(x); for (var c = 0; c < k; c++) A[r][c] += base[r](x) * base[c](x); } });
  for (var p = 0; p < k; p++) {            // eliminación gaussiana con pivoteo
    var m = p; for (r = p + 1; r < k; r++) if (Math.abs(A[r][p]) > Math.abs(A[m][p])) m = r;
    var t = A[p]; A[p] = A[m]; A[m] = t; t = b[p]; b[p] = b[m]; b[m] = t;
    for (r = p + 1; r < k; r++) { var f = A[r][p] / A[p][p]; for (c = p; c < k; c++) A[r][c] -= f * A[p][c]; b[r] -= f * b[p]; }
  }
  var sol = []; for (r = k - 1; r >= 0; r--) { var s = b[r]; for (c = r + 1; c < k; c++) s -= A[r][c] * sol[c]; sol[r] = s / A[r][r]; }
  return xs.every(function (x) { var v = 0; for (var r = 0; r < k; r++) v += sol[r] * base[r](x); return Math.abs(v - g(x)) < 1e-7; });
}
function f02(x) { return x <= 1 ? 2 * x : x <= 3 ? 4 - 2 * x : 2 * x - 8; }
function longitudPoligonal(f, a, b) { var n = 200000, L = 0, x0 = a, y0 = f(a); for (var i = 1; i <= n; i++) { var x = a + (b - a) * i / n, y = f(x); L += Math.hypot(x - x0, y - y0); x0 = x; y0 = y; } return L; }

module.exports = {
  minFiguras: 15,
  esperado: {
    'C2_01': simpson(Math.sin, 0, PI),
    'C2_02': simpson(f02, 0, 1) + simpson(f02, 1, 3),
    'C2_04': simpson(function (x) { return x * x; }, 0, 3) / 3,
    'C2_05': [0, 0.5, 1, 1.5].reduce(function (s, x) { return s + x * x * 0.5; }, 0),
    'C2_32': simpson(function (x) { return Math.max(0, 4 - x * x); }, -2, 2),
    'C2_33': simpson(Math.sqrt, 0, 4, 200000),
    'C2_37': longitudPoligonal(function (x) { return 2 / 3 * Math.pow(x, 1.5); }, 0, 3),
    'C2_38': simpson(function (x) { return 9 - x * x; }, -3, 3)   // V/π
  },
  valores: {
    'C2_03': { op: { '2x cos(x²)': function (x) { return 2 * x * Math.cos(x * x); }, 'cos(x²)': function (x) { return Math.cos(x * x); }, 'sen(x²)': function (x) { return Math.sin(x * x); }, 'cos(2x)': function (x) { return Math.cos(2 * x); } },
      cumple: function (g) { var F = function (x) { return simpson(Math.cos, 0, x * x, 400); }; return [-1.3, -0.4, 0.6, 1.1, 1.7].every(function (x) { return cerca(der(F, x), g(x), 1e-5); }); } },
    'C2_06': { cumple: antiderivada(function (x) { return 2 * x * Math.pow(x * x + 1, 5); }, X),
      op: { '(x² + 1)⁶ / 6 + C': function (x) { return Math.pow(x * x + 1, 6) / 6; }, '(x² + 1)⁶ + C': function (x) { return Math.pow(x * x + 1, 6); }, '2x (x² + 1)⁶ / 6 + C': function (x) { return 2 * x * Math.pow(x * x + 1, 6) / 6; }, '(x² + 1)⁶ / 3 + C': function (x) { return Math.pow(x * x + 1, 6) / 3; } } },
    'C2_07': { cumple: antiderivada(function (x) { return x * Math.exp(x * x); }, X),
      op: { '½ e^(x²) + C': function (x) { return Math.exp(x * x) / 2; }, 'e^(x²) + C': function (x) { return Math.exp(x * x); }, '2 e^(x²) + C': function (x) { return 2 * Math.exp(x * x); }, 'x² e^(x²) / 2 + C': function (x) { return x * x * Math.exp(x * x) / 2; } } },
    'C2_08': { cumple: antiderivada(Math.tan, [-1.2, -0.5, 0.3, 0.7, 1.2]),
      op: { '−ln|cos x| + C': function (x) { return -Math.log(Math.abs(Math.cos(x))); }, 'ln|cos x| + C': function (x) { return Math.log(Math.abs(Math.cos(x))); }, 'sec²x + C': function (x) { return 1 / (Math.cos(x) * Math.cos(x)); }, 'ln|sen x| + C': function (x) { return Math.log(Math.abs(Math.sin(x))); } } },
    'C2_09': { op: { 'ln 2': Math.LN2, '1': 1, 'ln 3': Math.log(3), '1/2': 0.5 }, cumple: function (v) { return cerca(v, simpson(function (x) { return 2 * x / (x * x + 1); }, 0, 1)); } },
    'C2_10': { cumple: antiderivada(function (x) { return 1 / (3 * x + 2); }, [-2.3, -1.1, 0.4, 1.3, 2.6]),
      op: { '(1/3) ln|3x + 2| + C': function (x) { return Math.log(Math.abs(3 * x + 2)) / 3; }, 'ln|3x + 2| + C': function (x) { return Math.log(Math.abs(3 * x + 2)); }, '3 ln|3x + 2| + C': function (x) { return 3 * Math.log(Math.abs(3 * x + 2)); }, '−1 / (3x + 2)² + C': function (x) { return -1 / Math.pow(3 * x + 2, 2); } } },
    'C2_11': { cumple: antiderivada(function (x) { return x * Math.exp(x); }, X),
      op: { 'eˣ(x − 1) + C': function (x) { return Math.exp(x) * (x - 1); }, 'x eˣ + C': function (x) { return x * Math.exp(x); }, 'eˣ(x + 1) + C': function (x) { return Math.exp(x) * (x + 1); }, 'x² eˣ / 2 + C': function (x) { return x * x * Math.exp(x) / 2; } } },
    'C2_12': { cumple: antiderivada(Math.log, [0.3, 0.9, 1.6, 2.5, 4]),
      op: { 'x ln x − x + C': function (x) { return x * Math.log(x) - x; }, '1/x + C': function (x) { return 1 / x; }, 'x ln x + C': function (x) { return x * Math.log(x); }, '(ln x)² / 2 + C': function (x) { return Math.pow(Math.log(x), 2) / 2; } } },
    'C2_13': { cumple: antiderivada(function (x) { return x * Math.cos(x); }, X),
      op: { 'x sen x + cos x + C': function (x) { return x * Math.sin(x) + Math.cos(x); }, 'x sen x − cos x + C': function (x) { return x * Math.sin(x) - Math.cos(x); }, 'x² sen x / 2 + C': function (x) { return x * x * Math.sin(x) / 2; }, '−x sen x + cos x + C': function (x) { return -x * Math.sin(x) + Math.cos(x); } } },
    /* Grado del polinomio que queda en la nueva integral ∫ v du (calculado a mano para cada elección; null = elección inútil). */
    'C2_14': { op: { 'u = x², dv = eˣ dx': 1, 'u = eˣ, dv = x² dx': 3, 'u = x² eˣ, dv = dx': 3, 'u = 1, dv = x² eˣ dx': null },
      cumple: function (g) { return g !== null && g < 2; } },
    'C2_15': { op: { '1': 1, 'e': E, 'e − 1': E - 1, '0': 0 }, cumple: function (v) { return cerca(v, simpson(function (x) { return x * Math.exp(x); }, 0, 1)); } },
    'C2_16': { cumple: antiderivada(function (x) { return Math.sin(x) * Math.sin(x); }, X),
      op: { 'x/2 − sen(2x)/4 + C': function (x) { return x / 2 - Math.sin(2 * x) / 4; }, 'sen³x / 3 + C': function (x) { return Math.pow(Math.sin(x), 3) / 3; }, 'x/2 + sen(2x)/4 + C': function (x) { return x / 2 + Math.sin(2 * x) / 4; }, '−cos²x + C': function (x) { return -Math.cos(x) * Math.cos(x); } } },
    'C2_17': { cumple: antiderivada(function (x) { return Math.sin(x) * Math.cos(x); }, X),
      op: { 'sen²x / 2 + C': function (x) { return Math.sin(x) * Math.sin(x) / 2; }, 'sen x cos x + C': function (x) { return Math.sin(x) * Math.cos(x); }, 'cos²x / 2 + C': function (x) { return Math.cos(x) * Math.cos(x) / 2; }, '−sen²x / 2 + C': function (x) { return -Math.sin(x) * Math.sin(x) / 2; } } },
    'C2_18': { op: { 'x = 3 sen θ': function (t) { return 3 * Math.sin(t); }, 'x = 3 tan θ': function (t) { return 3 * Math.tan(t); }, 'x = 3 sec θ': function (t) { return 3 / Math.cos(t); }, 'x = 9 sen θ': function (t) { return 9 * Math.sin(t); } },
      cumple: function (x) { return [-1.2, -0.6, 0.2, 0.9, 1.3].every(function (t) { return cerca(Math.sqrt(9 - x(t) * x(t)), 3 * Math.abs(Math.cos(t)), 1e-9); }); } },
    'C2_19': { op: { 'π/4': PI / 4, '1': 1, 'π/2': PI / 2, 'ln 2': Math.LN2 }, cumple: function (v) { return cerca(v, simpson(function (x) { return 1 / (1 + x * x); }, 0, 1)); } },
    'C2_20': { objetivo: function (x) { return 1 / (x * (x + 1)); }, puntos: [-2.3, -0.4, 0.3, 1.7, 4.2],
      op: { '1/x − 1/(x + 1)': function (x) { return 1 / x - 1 / (x + 1); }, '1/x + 1/(x + 1)': function (x) { return 1 / x + 1 / (x + 1); }, '1/(x + 1) − 1/x': function (x) { return 1 / (x + 1) - 1 / x; }, '2/x − 1/(x + 1)': function (x) { return 2 / x - 1 / (x + 1); } } },
    'C2_21': { cumple: antiderivada(function (x) { return 1 / (x * x - 1); }, [-3, -0.5, 0.3, 1.7, 3]),
      op: { '½ ln|(x − 1)/(x + 1)| + C': function (x) { return Math.log(Math.abs((x - 1) / (x + 1))) / 2; }, 'ln|x² − 1| + C': function (x) { return Math.log(Math.abs(x * x - 1)); }, '½ ln|(x + 1)/(x − 1)| + C': function (x) { return Math.log(Math.abs((x + 1) / (x - 1))) / 2; }, 'arctan x + C': Math.atan } },
    'C2_22': { op: {
        'A/(x − 1) + (Bx + C)/(x² + 1)': [function (x) { return 1 / (x - 1); }, function (x) { return x / (x * x + 1); }, function (x) { return 1 / (x * x + 1); }],
        'A/(x − 1) + B/(x² + 1)': [function (x) { return 1 / (x - 1); }, function (x) { return 1 / (x * x + 1); }],
        'A/(x − 1) + B/(x + 1) + C/(x − 1)²': [function (x) { return 1 / (x - 1); }, function (x) { return 1 / (x + 1); }, function (x) { return 1 / ((x - 1) * (x - 1)); }],
        '(Ax + B)/(x − 1) + C/(x² + 1)': [function (x) { return x / (x - 1); }, function (x) { return 1 / (x - 1); }, function (x) { return 1 / (x * x + 1); }] },
      cumple: function (base) { return ajusta(base, function (x) { return (2 * x + 3) / ((x - 1) * (x * x + 1)); }); } },
    'C2_23': { op: { 'ln(4/3)': Math.log(4 / 3), 'ln 3': Math.log(3), 'ln 2': Math.LN2, 'ln(3/2)': Math.log(1.5) }, cumple: function (v) { return cerca(v, simpson(function (x) { return 1 / (x * (x - 1)); }, 2, 3)); } },
    'C2_24': { op: { '1': 1, 'Diverge': D, '0': 0, '1/2': 0.5 }, cumple: function (v) { var r = impropiaInf(function (x) { return 1 / (x * x); }, 1); return r === D ? v === D : cerca(v, r, 1e-5); } },
    'C2_25': { op: { 'Diverge': D, 'Vale 1': 1, 'Vale 0': 0, 'Vale e': E }, cumple: function (v) { var r = impropiaInf(function (x) { return 1 / x; }, 1); return r === D ? v === D : cerca(v, r, 1e-5); } },
    'C2_26': { op: { 'p > 1': function (p) { return p > 1; }, 'p ≥ 1': function (p) { return p >= 1; }, 'p < 1': function (p) { return p < 1; }, 'p > 0': function (p) { return p > 0; } },
      cumple: function (pred) { return [0.5, 0.9, 1, 1.1, 2, 3].every(function (p) { return pred(p) === (impropiaInf(function (x) { return Math.pow(x, -p); }, 1) !== D); }); } },
    'C2_27': { op: { '2': 2, 'Diverge': D, '1': 1, '1/2': 0.5 }, cumple: function (v) { var r = impropiaCero(function (x) { return 1 / Math.sqrt(x); }, 1); return r === D ? v === D : cerca(v, r, 1e-5); } },
    'C2_28': { op: { '1': 1, 'Diverge': D, '0': 0, 'e': E }, cumple: function (v) { var r = simpson(function (x) { return Math.exp(-x); }, 0, 1) + impropiaInf(function (x) { return Math.exp(-x); }, 1); return cerca(v, r, 1e-5); } },
    'C2_29': { op: { '1/6': 1 / 6, '1/2': 0.5, '1/3': 1 / 3, '−1/6': -1 / 6 }, cumple: function (v) { return cerca(v, simpson(function (x) { return Math.abs(x - x * x); }, 0, 1)); } },
    'C2_30': { op: { '4/3': 4 / 3, '8/3': 8 / 3, '4': 4, '−4/3': -4 / 3 },
      cumple: function (v) {
        var g = function (x) { return x * x - 2 * x; }, cortes = [];
        for (var x = -5; x < 5; x += 0.001) if (g(x) === 0 || g(x) * g(x + 0.001) < 0) cortes.push(Math.round(x * 100) / 100);
        return cortes.length === 2 && cerca(v, simpson(function (x) { return Math.abs(g(x)); }, cortes[0], cortes[1]), 1e-4);
      } },
    'C2_31': { op: { '4': 4, '0': 0, '2': 2, '2π': 2 * PI }, cumple: function (v) { return cerca(v, simpson(function (x) { return Math.abs(Math.sin(x)); }, 0, 2 * PI)); } },
    'C2_34': { op: { '8π/3': 8 * PI / 3, '2π': 2 * PI, '4π': 4 * PI, '8π': 8 * PI },
      cumple: function (v) { return cerca(v, PI * simpson(function (x) { return x * x; }, 0, 2)) && cerca(v, PI * 4 * 2 / 3); } },  // y el volumen del cono
    'C2_35': { op: { 'π/2': PI / 2, 'π/5': PI / 5, 'π/3': PI / 3, '2π': 2 * PI },
      cumple: function (v) { return cerca(v, PI * simpson(function (y) { return 1 - y; }, 0, 1)); } },   // arandelas en y: radio externo 1, interno √y
    'C2_36': { op: { '∫ₐᵇ √(1 + (f′(x))²) dx': function (f, fp) { return function (x) { return Math.sqrt(1 + fp(x) * fp(x)); }; }, '∫ₐᵇ √(1 + (f(x))²) dx': function (f) { return function (x) { return Math.sqrt(1 + f(x) * f(x)); }; }, '∫ₐᵇ (1 + f′(x)) dx': function (f, fp) { return function (x) { return 1 + fp(x); }; }, '∫ₐᵇ √(f′(x)) dx': function (f, fp) { return function (x) { return Math.sqrt(fp(x)); }; } },
      cumple: function (formula) {
        return [[function (x) { return x; }, function () { return 1; }], [function (x) { return 2 * x; }, function () { return 2; }], [function (x) { return x * x; }, function (x) { return 2 * x; }]].every(function (c) {
          return cerca(simpson(formula(c[0], c[1]), 0, 1), longitudPoligonal(c[0], 0, 1), 1e-6);
        });
      } },
    'C2_39': { op: { '2': 2, '1/3': 1 / 3, '0': 0, 'No converge': 'nc' }, cumple: function (v) { var n = 1e9; return cerca(v, (2 * n + 1) / (n + 3)); } },
    'C2_40': { op: { '3/2': 1.5, '1/2': 0.5, '3': 3, 'Diverge': D }, cumple: function (v) { var s = 0; for (var n = 0; n < 200; n++) s += Math.pow(1 / 3, n); return cerca(v, s, 1e-9); } },
    'C2_41': { op: { 'Diverge': D, 'Converge, porque 1/n → 0': 'c0', 'Converge a 1': 1, 'Converge a 2': 2 },
      cumple: function (v) { return !serieConverge(function (n) { return 1 / n; }) && v === D; } },
    'C2_42': { op: { 'Converge, porque el límite de la razón es 1/2': ['converge', 0.5], 'Diverge, porque el límite de la razón es 2': ['diverge', 2], 'No se puede decidir, porque el límite de la razón es 1': ['nada', 1], 'Converge, porque el límite de la razón es 0': ['converge', 0] },
      cumple: function (v) {
        var a = function (n) { return n / Math.pow(2, n); }, n = 1000, L = a(n + 1) / a(n);
        var concl = L < 1 - 1e-3 ? 'converge' : L > 1 + 1e-3 ? 'diverge' : 'nada';
        return cerca(v[1], L, 1e-2) && v[0] === concl;
      } },
    'C2_43': { op: { 'Converge condicionalmente': 'condicional', 'Converge absolutamente': 'absoluta', 'Diverge': D, 'Diverge, porque Σ 1/n diverge': 'diverge2' },
      cumple: function (v) {
        var alt = serieConverge(function (n) { return (n % 2 ? -1 : 1) / n; }), abs = serieConverge(function (n) { return 1 / n; });
        return v === (alt ? (abs ? 'absoluta' : 'condicional') : D);
      } },
    'C2_44': { op: { '1': 1, '1/2': 0.5, 'Diverge': D, '2': 2 }, cumple: function (v) { return cerca(v, suma(function (n) { return 1 / (n * (n + 1)); }, 1000000), 1e-5); } },
    'C2_45': { op: { '3': 3, '1/3': 1 / 3, '1': 1, '∞': Infinity }, cumple: function (v) { var n = 2000, raiz = Math.exp(-n * Math.log(3) / n); return cerca(v, 1 / raiz, 1e-9); } },  // |aₙ|^(1/n) en logaritmos para no desbordar
    'C2_46': { op: { '1 + x + x²/2 + x³/6': function (x) { return 1 + x + x * x / 2 + x * x * x / 6; }, '1 + x + x² + x³': function (x) { return 1 + x + x * x + x * x * x; }, 'x + x²/2 + x³/3': function (x) { return x + x * x / 2 + x * x * x / 3; }, '1 + x + x²/2 + x³/3': function (x) { return 1 + x + x * x / 2 + x * x * x / 3; } },
      cumple: function (p) { return [0.1, 0.05, 0.02].every(function (x) { return Math.abs(p(x) - Math.exp(x)) / Math.pow(x, 4) < 0.1; }); } },   // error de orden x⁴: grado 3 correcto
    'C2_47': { op: { 'x − x³/6 + x⁵/120': function (x) { return x - Math.pow(x, 3) / 6 + Math.pow(x, 5) / 120; }, 'x − x³/3 + x⁵/5': function (x) { return x - Math.pow(x, 3) / 3 + Math.pow(x, 5) / 5; }, '1 − x²/2 + x⁴/24': function (x) { return 1 - x * x / 2 + Math.pow(x, 4) / 24; }, 'x + x³/6 + x⁵/120': function (x) { return x + Math.pow(x, 3) / 6 + Math.pow(x, 5) / 120; } },
      cumple: function (p) { return [0.2, 0.1, 0.05].every(function (x) { return Math.abs(p(x) - Math.sin(x)) / Math.pow(x, 6) < 0.01; }); } },
    'C2_48': { op: { '1/2': 0.5, '0': 0, '1': 1, '∞': Infinity }, cumple: function (v) { var x = 1e-4; return cerca(v, (Math.exp(x) - 1 - x) / (x * x), 1e-3); } },
    'C2_49': { op: { '1,105': 1.105, '1,1': 1.1, '1,11': 1.11, '1,01': 1.01 },
      cumple: function (v) { var x = 0.1, p2 = Math.exp(0) + der(Math.exp, 0) * x + der2(Math.exp, 0) / 2 * x * x; return cerca(v, p2, 1e-6); } },  // coeficientes a partir de las derivadas en 0
    'C2_50': { op: { '[−1, 1)': [true, false], '(−1, 1)': [false, false], '[−1, 1]': [true, true], '(−1, 1]': [false, true] },
      cumple: function (v) {
        var izq = serieConverge(function (n) { return Math.pow(-1, n) / n; }), der1 = serieConverge(function (n) { return 1 / n; });
        return v[0] === izq && v[1] === der1;
      } }
  },
  extra: function (t, assert) {
    t('C2_02: la región sombreada coincide con la gráfica dibujada', function () {
      assert.deepStrictEqual([0, 1, 3, 4].map(f02), [0, 2, -2, 0]);
    });
    t('C2_29: entre 0 y 1 la recta y = x va por encima de la parábola', function () {
      assert.ok([0.1, 0.5, 0.9].every(function (x) { return x > x * x; }));
    });
  }
};
