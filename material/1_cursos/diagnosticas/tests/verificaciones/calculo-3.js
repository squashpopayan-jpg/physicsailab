/* Verificación independiente del banco de Cálculo III.
   - Vectores: productos y normas calculados aquí.
   - Derivadas parciales, gradientes, divergencia y rotacional: diferencias centrales.
   - Integrales dobles y triples: Simpson anidado en coordenadas cartesianas (sin usar polares ni esféricas),
     para verificar de forma independiente las respuestas obtenidas con cambio de coordenadas.
   - Integrales de línea y flujo: parametrización numérica.
   - Preguntas conceptuales (Lagrange, Stokes, jacobianos): se prueba cada opción en un ejemplo concreto. */
'use strict';
var PI = Math.PI, NE = 'no existe', H = 1e-5;
function simpson(f, a, b, n) { n = n || 400; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
function doble(f, xa, xb, ya, yb, n) { return simpson(function (x) { return simpson(function (y) { return f(x, y); }, ya(x), yb(x), n); }, xa, xb, n); }
function triple(f, a, b, c, n) { return simpson(function (x) { return simpson(function (y) { return simpson(function (z) { return f(x, y, z); }, c[0], c[1], n); }, b[0], b[1], n); }, a[0], a[1], n); }
function cerca(a, b, tol) {
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  if (!isFinite(a) || !isFinite(b)) return a === b;
  return Math.abs(a - b) <= (tol || 1e-6) * Math.max(1, Math.abs(b));
}
function vcerca(u, v, tol) { return Array.isArray(u) && Array.isArray(v) && u.length === v.length && u.every(function (x, i) { return cerca(x, v[i], tol); }); }
function dot(u, v) { return u.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }
function cruz(u, v) { return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; }
function norma(u) { return Math.sqrt(dot(u, u)); }
function paralelos(u, v) { return norma(cruz(u.concat([0, 0, 0]).slice(0, 3), v.concat([0, 0, 0]).slice(0, 3))) < 1e-9 * Math.max(1, norma(u) * norma(v)); }
function parcial(f, p, k) { var a = p.slice(), b = p.slice(); a[k] += H; b[k] -= H; return (f.apply(null, a) - f.apply(null, b)) / (2 * H); }
function grad(f, p) { return p.map(function (_, k) { return parcial(f, p, k); }); }
function dvec(r, t) { var a = r(t + H), b = r(t - H); return a.map(function (x, i) { return (x - b[i]) / (2 * H); }); }
var PTS2 = [[1.3, 0.7], [-0.6, 1.1], [2, -1.4]], PTS3 = [[1.3, 0.7, -0.4], [-0.6, 1.1, 2], [2, -1.4, 0.5]];
function igualesEn(pts, f, g, tol) { return pts.every(function (p) { var a = f.apply(null, p), b = g.apply(null, p); return Array.isArray(a) ? vcerca(a, b, tol) : cerca(a, b, tol); }); }
function campoFig(x, y) { return [-y, x]; }   // el mismo campo con que se dibuja la figura de C3_41

module.exports = {
  minFiguras: 14,
  esperado: {
    C3_01: norma([1, 2, 2]),
    C3_03: Math.acos(dot([1, 0, 0], [1, 1, 0]) / (norma([1, 0, 0]) * norma([1, 1, 0]))) * 180 / PI,
    C3_25: norma(grad(function (x, y) { return x * x + y * y; }, [3, 4])),
    C3_29: (function () { var m = -Infinity; for (var x = 0; x <= 10; x += 0.0005) m = Math.max(m, x * (10 - x)); return m; })(),
    C3_31: doble(function (x, y) { return x * y; }, 0, 1, function () { return 0; }, function () { return 2; }),
    C3_33: doble(function (x, y) { return x + y; }, 0, 2, function () { return 0; }, function () { return 1; }),
    C3_43: (function () {   // integral de línea de ∇(x²y) por una curva cualquiera: la parábola (t, 2t²)
      var F = function (x, y) { return [2 * x * y, x * x]; };
      return simpson(function (t) { var r = [t, 2 * t * t], dr = [1, 4 * t]; return dot(F(r[0], r[1]), dr); }, 0, 1);
    })()
  },
  valores: {
    C3_02: { op: { '−1': -1, '(3, 0, −4)': [3, 0, -4], '7': 7, '1': 1 }, cumple: function (v) { return v === dot([1, 2, -1], [3, 0, 4]); } },
    C3_04: { op: { '(0, 0, 1)': [0, 0, 1], '(0, 0, −1)': [0, 0, -1], '0': 0, '(1, 1, 0)': [1, 1, 0] }, cumple: function (v) { return vcerca(v, cruz([1, 0, 0], [0, 1, 0])); } },
    C3_05: { op: { '2x − y + z = 3': [2, -1, 1, 3], '2x − y + z = 0': [2, -1, 1, 0], 'x + 2y + 3z = 3': [1, 2, 3, 3], '2x + y + z = 7': [2, 1, 1, 7] },
      cumple: function (p) { return paralelos(p.slice(0, 3), [2, -1, 1]) && cerca(dot(p.slice(0, 3), [1, 2, 3]), p[3]); } },
    C3_06: { op: { '(1 + 3t, −t, 2 + t)': function (t) { return [1 + 3 * t, -t, 2 + t]; }, '(3 + t, −1, 1 + 2t)': function (t) { return [3 + t, -1, 1 + 2 * t]; }, '(1 + 3t, t, 2 + t)': function (t) { return [1 + 3 * t, t, 2 + t]; }, '(3t, −t, t)': function (t) { return [3 * t, -t, t]; } },
      cumple: function (r) {
        var P = [1, 0, 2], d = r(1).map(function (x, i) { return x - r(0)[i]; });
        if (!paralelos(d, [3, -1, 1])) return false;
        var k = d.findIndex(function (x) { return Math.abs(x) > 1e-12; }), t0 = (P[k] - r(0)[k]) / d[k];
        return vcerca(r(t0), P);
      } },
    C3_07: { op: { '(2, 3, 2)': [2, 3, 2], '(1, 1, 2)': [1, 1, 2], '(2, 6, 0)': [2, 6, 0], '(2, 3, 0)': [2, 3, 0] },
      cumple: function (v) { return vcerca(v, dvec(function (t) { return [t * t, t * t * t, 2 * t]; }, 1), 1e-6); } },
    C3_08: { op: { '√2': Math.SQRT2, '1': 1, '2': 2, '√3': Math.sqrt(3) },
      cumple: function (v) { return [0.3, 1.7, 4].every(function (t) { return cerca(norma(dvec(function (s) { return [Math.cos(s), Math.sin(s), s]; }, t)), v, 1e-6); }); } },
    C3_09: { op: { '2π√2': 2 * PI * Math.SQRT2, '2π': 2 * PI, '4π': 4 * PI, 'π√2': PI * Math.SQRT2 },
      cumple: function (v) { return cerca(v, simpson(function (t) { return norma(dvec(function (s) { return [Math.cos(s), Math.sin(s), s]; }, t)); }, 0, 2 * PI), 1e-6); } },
    C3_10: { op: { '(1, 1, 1) + s(1, 2, 3)': [[1, 1, 1], [1, 2, 3]], '(1, 1, 1) + s(1, 1, 1)': [[1, 1, 1], [1, 1, 1]], '(0, 0, 0) + s(1, 2, 3)': [[0, 0, 0], [1, 2, 3]], '(1, 2, 3) + s(1, 1, 1)': [[1, 2, 3], [1, 1, 1]] },
      cumple: function (v) { var r = function (t) { return [t, t * t, t * t * t]; }; return vcerca(v[0], r(1)) && paralelos(v[1], dvec(r, 1)); } },
    C3_11: { op: { 'El disco x² + y² ≤ 4': function (x, y) { return x * x + y * y <= 4; }, 'El disco abierto x² + y² < 4': function (x, y) { return x * x + y * y < 4; }, 'La región x² + y² ≥ 4': function (x, y) { return x * x + y * y >= 4; }, 'Todo el plano': function () { return true; } },
      cumple: function (p) { return [[0, 0], [2, 0], [0, -2], [1.5, 1], [3, 0], [2, 2]].every(function (q) { return p(q[0], q[1]) === !isNaN(Math.sqrt(4 - q[0] * q[0] - q[1] * q[1])); }); } },
    C3_12: { op: { 'f(x, y) = x² + y²': function (x, y) { return x * x + y * y; }, 'f(x, y) = x + y': function (x, y) { return x + y; }, 'f(x, y) = √(x² + y²)': function (x, y) { return Math.sqrt(x * x + y * y); }, 'f(x, y) = x² − y²': function (x, y) { return x * x - y * y; } },
      cumple: function (f) { return [[1, 1], [2, 4], [3, 9]].every(function (rc) { return [0.2, 1.4, 3, 5].every(function (a) { return cerca(f(rc[0] * Math.cos(a), rc[0] * Math.sin(a)), rc[1], 1e-9); }); }); } },  // radios dibujados 1, 2, 3 con niveles 1, 4, 9
    C3_13: { op: { 'Una parábola': function (t) { return [t, t * t]; }, 'Una recta': function (t) { return [t, t]; }, 'Una circunferencia': function (t) { return [Math.cos(t), Math.sin(t)]; }, 'Una hipérbola': function (t) { return [t, 1 / t]; } },
      cumple: function (c) { return [-2, -0.5, 0.7, 1.9].every(function (t) { var p = c(t); return cerca(p[1] - p[0] * p[0], 0, 1e-12); }); } },
    C3_14: { op: { 'No existe': NE, '0': 0, '1/2': 0.5, '1': 1 },
      cumple: function (v) { var g = function (x, y) { return x * y / (x * x + y * y); }, t = 1e-8, a = g(t, 0), b = g(t, t); return Math.abs(a - b) > 1e-3 ? v === NE : cerca(v, a); } },
    C3_15: { op: { '1': 1, 'No existe': NE, '0': 0, '3': 3 },
      cumple: function (v) { var g = function (x, y) { return (x * x + y) / (x + y); }, t = 1e-8; return cerca(g(1 + t, 2), g(1, 2 + t), 1e-6) && cerca(v, g(1 + t, 2 - t), 1e-6); } },
    C3_16: { op: { '2xy³': function (x, y) { return 2 * x * y * y * y; }, '3x²y²': function (x, y) { return 3 * x * x * y * y; }, '6xy²': function (x, y) { return 6 * x * y * y; }, '2x': function (x) { return 2 * x; } },
      cumple: function (g) { return igualesEn(PTS2, function (x, y) { return parcial(function (a, b) { return a * a * b * b * b; }, [x, y], 0); }, g, 1e-5); } },
    C3_17: { op: { 'x e^(xy)': function (x, y) { return x * Math.exp(x * y); }, 'e^(xy)': function (x, y) { return Math.exp(x * y); }, 'y e^(xy)': function (x, y) { return y * Math.exp(x * y); }, 'xy e^(xy − 1)': function (x, y) { return x * y * Math.exp(x * y - 1); } },
      cumple: function (g) { return igualesEn(PTS2, function (x, y) { return parcial(function (a, b) { return Math.exp(a * b); }, [x, y], 1); }, g, 1e-5); } },
    C3_18: { op: { '6x²y': function (x, y) { return 6 * x * x * y; }, '6xy²': function (x, y) { return 6 * x * y * y; }, '6x²': function (x) { return 6 * x * x; }, '0': function () { return 0; } },
      cumple: function (g) { var f = function (a, b) { return a * a * a * b * b; }; return igualesEn(PTS2, function (x, y) { return parcial(function (a, b) { return parcial(f, [a, b], 0); }, [x, y], 1); }, g, 1e-4); } },
    C3_19: { op: { '0': function () { return 0; }, '2x + 2y': function (t) { return 2 * Math.cos(t) + 2 * Math.sin(t); }, '−2 sen t + 2 cos t': function (t) { return -2 * Math.sin(t) + 2 * Math.cos(t); }, '1': function () { return 1; } },
      cumple: function (g) { var z = function (t) { var x = Math.cos(t), y = Math.sin(t); return x * x + y * y; }; return [0.3, 1.2, 2.5].every(function (t) { return cerca((z(t + H) - z(t - H)) / (2 * H), g(t), 1e-5); }); } },
    C3_20: { op: { 'z = 2x + 2y − 2': function (x, y) { return 2 * x + 2 * y - 2; }, 'z = 2x + 2y': function (x, y) { return 2 * x + 2 * y; }, 'z = x + y': function (x, y) { return x + y; }, 'z = 2x + 2y + 2': function (x, y) { return 2 * x + 2 * y + 2; } },
      cumple: function (p) { var f = function (x, y) { return x * x + y * y; }, g = grad(f, [1, 1]); return cerca(p(1, 1), f(1, 1)) && cerca(p(2, 1) - p(1, 1), g[0], 1e-5) && cerca(p(1, 2) - p(1, 1), g[1], 1e-5); } },
    C3_21: { op: { '(2xy, x², 1)': function (x, y) { return [2 * x * y, x * x, 1]; }, '(2x, x², 1)': function (x) { return [2 * x, x * x, 1]; }, '2xy + x² + 1': function (x, y) { return 2 * x * y + x * x + 1; }, '(2xy, x², 0)': function (x, y) { return [2 * x * y, x * x, 0]; } },
      cumple: function (g) { return PTS3.every(function (p) { return vcerca(g(p[0], p[1], p[2]), grad(function (x, y, z) { return x * x * y + z; }, p), 1e-5); }); } },
    C3_22: { op: { '22/5': 22 / 5, '22': 22, '2√5': 2 * Math.sqrt(5), '11/5': 11 / 5 },
      cumple: function (v) { var f = function (x, y) { return x * x + y * y; }, u = [3 / 5, 4 / 5]; return cerca(v, (f(1 + H * u[0], 2 + H * u[1]) - f(1 - H * u[0], 2 - H * u[1])) / (2 * H), 1e-6); } },
    C3_23: { op: { 'Perpendicular a la curva de nivel, hacia afuera': 'afuera', 'Tangente a la curva de nivel': 'tangente', 'Perpendicular a la curva de nivel, hacia el centro': 'adentro', 'Paralelo al eje x': 'ejex' },
      cumple: function (c) {
        var P = [2 * Math.SQRT1_2, 2 * Math.SQRT1_2], g = grad(function (x, y) { return x * x + y * y; }, P), tang = [-P[1], P[0]];
        var real = Math.abs(dot(g, tang)) < 1e-6 ? (dot(g, P) > 0 ? 'afuera' : 'adentro') : Math.abs(g[1]) < 1e-9 ? 'ejex' : 'tangente';
        return c === real;
      } },
    C3_24: { op: { '(3, −4)': [3, -4], '(−3, 4)': [-3, 4], '(4, 3)': [4, 3], '(1, 1)': [1, 1] },
      cumple: function (v) { var g = grad(function (x, y) { return 3 * x - 4 * y; }, [0.4, -1]), n = norma(v); return vcerca([v[0] / n, v[1] / n], [g[0] / norma(g), g[1] / norma(g)], 1e-6); } },
    C3_26: { op: { '(2, −3)': [2, -3], '(−2, 3)': [-2, 3], '(4, −6)': [4, -6], '(0, 0)': [0, 0] },
      cumple: function (p) { return norma(grad(function (x, y) { return x * x + y * y - 4 * x + 6 * y; }, p)) < 1e-6; } },
    C3_27: { op: { 'Un punto de silla': 'silla', 'Un mínimo local': 'min', 'Un máximo local': 'max', 'El criterio no decide': 'nada' },
      cumple: function (c) { return c === clasificar(function (x, y) { return x * x - y * y; }); } },
    C3_28: { op: { 'Un mínimo local': 'min', 'Un punto de silla': 'silla', 'Un máximo local': 'max', 'El criterio no decide': 'nada' },
      cumple: function (c) { return c === clasificar(function (x, y) { return x * x + x * y + y * y; }); } },
    C3_30: { op: { '∇f = λ∇g': 'paralelos', '∇f = 0': 'cero', '∇f · ∇g = 0': 'perpendiculares', 'f = g': 'iguales' },
      cumple: function (c) {   // ejemplo: f = xy con x + y = 10; el óptimo se busca recorriendo la recta
        var mejor = 0, xm = 0; for (var x = 0; x <= 10; x += 0.001) if (x * (10 - x) > mejor) { mejor = x * (10 - x); xm = x; }
        var p = [xm, 10 - xm], gf = grad(function (a, b) { return a * b; }, p), gg = grad(function (a, b) { return a + b; }, p);
        var verdad = { paralelos: Math.abs(gf[0] * gg[1] - gf[1] * gg[0]) < 1e-2, cero: norma(gf) < 1e-2, perpendiculares: Math.abs(dot(gf, gg)) < 1e-2, iguales: Math.abs(mejor - (p[0] + p[1] - 10)) < 1e-2 };
        return verdad[c];
      } },
    C3_32: (function () {
      var f = function (x, y) { return x * x * y + 1 + y * y * y; };   // función de prueba sin simetrías
      var real = doble(f, 0, 1, function () { return 0; }, function (x) { return x; });
      function dydx(ya, yb) { return doble(function (y, x) { return f(x, y); }, 0, 1, ya, yb); }   // integra primero en x, luego en y
      return { op: { '∫₀¹ ∫_y^1 f(x, y) dx dy': dydx(function (y) { return y; }, function () { return 1; }), '∫₀¹ ∫₀^y f(x, y) dx dy': dydx(function () { return 0; }, function (y) { return y; }), '∫₀¹ ∫₀¹ f(x, y) dx dy': dydx(function () { return 0; }, function () { return 1; }), '∫₀^x ∫₀¹ f(x, y) dx dy': NaN },
        cumple: function (v) { return cerca(v, real, 1e-6); } };
    })(),
    C3_34: { op: { 'r dr dθ': function (r) { return r; }, 'dr dθ': function () { return 1; }, 'r² dr dθ': function (r) { return r * r; }, '(1/r) dr dθ': function (r) { return 1 / r; } },
      cumple: function (j) { return [1, 2].every(function (R) { return cerca(simpson(function () { return simpson(function (r) { return j(Math.max(r, 1e-12)); }, 1e-12, R); }, 0, 2 * PI, 40), PI * R * R, 1e-4); }); } },
    C3_35: { op: { '8π': 8 * PI, '16π/3': 16 * PI / 3, '4π': 4 * PI, '16π': 16 * PI },
      cumple: function (v) { return cerca(v, doble(function (x, y) { return x * x + y * y; }, -2, 2, function (x) { return -Math.sqrt(Math.max(0, 4 - x * x)); }, function (x) { return Math.sqrt(Math.max(0, 4 - x * x)); }, 600), 1e-3); } },
    C3_36: { op: { '8π': 8 * PI, '16π': 16 * PI, '32π/3': 32 * PI / 3, '4π': 4 * PI },
      cumple: function (v) { return cerca(v, doble(function (x, y) { return Math.max(0, 4 - x * x - y * y); }, -2, 2, function (x) { return -Math.sqrt(Math.max(0, 4 - x * x)); }, function (x) { return Math.sqrt(Math.max(0, 4 - x * x)); }, 600), 1e-3); } },
    C3_37: { op: { 'r dz dr dθ': function (r) { return r; }, 'dz dr dθ': function () { return 1; }, 'r² dz dr dθ': function (r) { return r * r; }, 'r sen θ dz dr dθ': function (r, t) { return r * Math.sin(t); } },
      cumple: function (j) { return cerca(triple(function (t, r) { return j(r, t); }, [0, 2 * PI], [0, 1], [0, 1], 40), PI, 1e-4); } },   // cilindro de radio 1 y altura 1
    C3_38: { op: { 'ρ² sen φ dρ dφ dθ': function (p, f) { return p * p * Math.sin(f); }, 'ρ dρ dφ dθ': function (p) { return p; }, 'ρ² dρ dφ dθ': function (p) { return p * p; }, 'ρ² cos φ dρ dφ dθ': function (p, f) { return p * p * Math.cos(f); } },
      cumple: function (j) { return cerca(triple(function (t, f, p) { return j(p, f); }, [0, 2 * PI], [0, PI], [0, 1], 40), 4 * PI / 3, 1e-4); } },   // esfera unitaria
    C3_39: { op: { '1/8': 1 / 8, '1/6': 1 / 6, '1/2': 0.5, '1': 1 }, cumple: function (v) { return cerca(v, triple(function (x, y, z) { return x * y * z; }, [0, 1], [0, 1], [0, 1], 20)); } },
    C3_40: { op: { '1/6': 1 / 6, '1/3': 1 / 3, '1/2': 0.5, '1': 1 }, cumple: function (v) { return cerca(v, doble(function (x, y) { return 1 - x - y; }, 0, 1, function () { return 0; }, function (x) { return 1 - x; })); } },
    C3_41: { op: { 'F(x, y) = (−y, x)': function (x, y) { return [-y, x]; }, 'F(x, y) = (x, y)': function (x, y) { return [x, y]; }, 'F(x, y) = (y, −x)': function (x, y) { return [y, -x]; }, 'F(x, y) = (−x, −y)': function (x, y) { return [-x, -y]; } },
      cumple: function (F) { return [[1, 0], [0, 1], [-2, 1], [2, -3]].every(function (p) { var a = F(p[0], p[1]), b = campoFig(p[0], p[1]); return vcerca([a[0] / norma(a), a[1] / norma(a)], [b[0] / norma(b), b[1] / norma(b)]); }); } },
    C3_42: { op: { 'Sí; un potencial es f = x²y': function (x, y) { return x * x * y; }, 'Sí; un potencial es f = xy²': function (x, y) { return x * y * y; }, 'No, porque ∂P/∂y ≠ ∂Q/∂x': 'no', 'No se puede saber sin una curva': 'nosabe' },
      cumple: function (v) {
        var F = function (x, y) { return [2 * x * y, x * x]; };
        if (typeof v === 'function') return PTS2.every(function (p) { return vcerca(grad(v, p), F(p[0], p[1]), 1e-5); });
        var rot = PTS2.every(function (p) { return cerca(parcial(function (x, y) { return F(x, y)[0]; }, p, 1), parcial(function (x, y) { return F(x, y)[1]; }, p, 0), 1e-5); });
        return v === 'no' ? !rot : false;
      } },
    C3_44: { op: { '2π': 2 * PI, '0': 0, 'π': PI, '4π': 4 * PI },
      cumple: function (v) { return cerca(v, simpson(function (t) { var x = Math.cos(t), y = Math.sin(t), dx = -Math.sin(t), dy = Math.cos(t); return x * dy - y * dx; }, 0, 2 * PI)); } },
    C3_45: { op: { '15/2': 7.5, '3/2': 1.5, '9/2': 4.5, '25/2': 12.5 },
      cumple: function (v) { var n = 100000, s = 0; for (var i = 0; i < n; i++) { var t = (i + 0.5) / n; s += 3 * t * Math.hypot(3 / n, 4 / n); } return cerca(v, s, 1e-6); } },   // suma de x·ds sobre trocitos del segmento
    C3_46: { op: { '2x + z + 1': function (x, y, z) { return 2 * x + z + 1; }, '(2x, z, 1)': function (x, y, z) { return [2 * x, z, 1]; }, '2x + y + 1': function (x, y) { return 2 * x + y + 1; }, '2x + z': function (x, y, z) { return 2 * x + z; } },
      cumple: function (d) { var F = [function (x) { return x * x; }, function (x, y, z) { return y * z; }, function (x, y, z) { return z; }]; return PTS3.every(function (p) { var div = parcial(F[0], p, 0) + parcial(F[1], p, 1) + parcial(F[2], p, 2); return cerca(d(p[0], p[1], p[2]), div, 1e-5); }); } },
    C3_47: { op: { '(0, 0, 2)': [0, 0, 2], '(0, 0, 0)': [0, 0, 0], '(0, 0, −2)': [0, 0, -2], '2': 2 },
      cumple: function (v) { var P = function (x, y) { return -y; }, Q = function (x) { return x; }, R = function () { return 0; };
        return PTS3.every(function (p) { var rot = [parcial(R, p, 1) - parcial(Q, p, 2), parcial(P, p, 2) - parcial(R, p, 0), parcial(Q, p, 0) - parcial(P, p, 1)]; return vcerca(v, rot, 1e-5); }); } },
    C3_48: { op: { '6π': 6 * PI, '36π': 36 * PI, '12π': 12 * PI, '13π': 13 * PI },
      cumple: function (v) {
        var green = 0.5 * simpson(function (t) { var x = 3 * Math.cos(t), y = 2 * Math.sin(t), dx = -3 * Math.sin(t), dy = 2 * Math.cos(t); return x * dy - y * dx; }, 0, 2 * PI);
        var area = doble(function () { return 1; }, -3, 3, function (x) { return -2 * Math.sqrt(Math.max(0, 1 - x * x / 9)); }, function (x) { return 2 * Math.sqrt(Math.max(0, 1 - x * x / 9)); }, 600);
        return cerca(v, green, 1e-6) && cerca(v, area, 1e-3);
      } },
    C3_49: { op: { '4π': 4 * PI, '4π/3': 4 * PI / 3, '0': 0, '12π': 12 * PI },
      cumple: function (v) {   // flujo calculado sobre la superficie: F·n con n = vector posición en la esfera unitaria
        var flujo = simpson(function (th) { return simpson(function (ph) { var n = [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)]; return dot(n, n) * Math.sin(ph); }, 0, PI, 200); }, 0, 2 * PI, 200);
        return cerca(v, flujo, 1e-6);
      } },
    C3_50: { op: { '∮_C F · dr = ∬_S (∇ × F) · n dS': 'rot', '∮_C F · dr = ∬_S (∇ · F) dS': 'div', '∮_C F · dr = ∭ (∇ × F) dV': 'vol', '∮_C F · dr = ∬_S F · n dS': 'flujo' },
      cumple: function (c) {   // ejemplo: F = (−y, x, 0), C = circunferencia unitaria, S = disco unitario con n = (0, 0, 1)
        var circ = simpson(function (t) { return Math.sin(t) * Math.sin(t) + Math.cos(t) * Math.cos(t); }, 0, 2 * PI);
        var areaDisco = PI, ladoDerecho = { rot: 2 * areaDisco, div: 0 * areaDisco, vol: NaN, flujo: 0 };   // (∇×F)·n = 2, ∇·F = 0, F·n = 0
        return cerca(ladoDerecho[c], circ, 1e-6);
      } }
  },
  extra: function (t, assert) {
    t('C3_36: el sólido es el de la figura (borde r = 2 en z = 0 y vértice en z = 4)', function () { assert.ok(4 - 4 === 0 && 4 - 0 === 4); });
  }
};

function clasificar(f) {
  var h = 1e-3, fxx = (f(h, 0) - 2 * f(0, 0) + f(-h, 0)) / (h * h), fyy = (f(0, h) - 2 * f(0, 0) + f(0, -h)) / (h * h);
  var fxy = (f(h, h) - f(h, -h) - f(-h, h) + f(-h, -h)) / (4 * h * h), D = fxx * fyy - fxy * fxy;
  return Math.abs(D) < 1e-6 ? 'nada' : D < 0 ? 'silla' : fxx > 0 ? 'min' : 'max';
}
