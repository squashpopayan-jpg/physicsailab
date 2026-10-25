/* Verificación independiente del banco de Álgebra lineal.
   Todo se calcula aquí con rutinas propias: producto, eliminación gaussiana (determinante, rango, inversa),
   raíces numéricas de det(A − λI) para los valores propios y minimización de distancias para las proyecciones.
   Las preguntas conceptuales se prueban con matrices concretas, incluidos contraejemplos de cada distractor. */
'use strict';
var EPS = 1e-9;
function mul(A, B) { if (A[0].length !== B.length) return null; return A.map(function (f) { return B[0].map(function (_, j) { return f.reduce(function (s, a, k) { return s + a * B[k][j]; }, 0); }); }); }
function mv(A, v) { return A.map(function (f) { return f.reduce(function (s, a, k) { return s + a * v[k]; }, 0); }); }
function T(A) { return A[0].map(function (_, j) { return A.map(function (f) { return f[j]; }); }); }
function eye(n) { var I = []; for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) I[i].push(i === j ? 1 : 0); } return I; }
function copia(A) { return A.map(function (f) { return f.slice(); }); }
function det(A) { var M = copia(A), n = M.length, d = 1; for (var c = 0; c < n; c++) { var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; if (Math.abs(M[p][c]) < EPS) return 0; if (p !== c) { var t = M[p]; M[p] = M[c]; M[c] = t; d = -d; } d *= M[c][c]; for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k < n; k++) M[r][k] -= f * M[c][k]; } } return d; }
function rango(A) { var M = copia(A), filas = M.length, cols = M[0].length, r = 0; for (var c = 0; c < cols && r < filas; c++) { var p = r; for (var i = r + 1; i < filas; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i; if (Math.abs(M[p][c]) < 1e-9) continue; var t = M[p]; M[p] = M[r]; M[r] = t; for (i = 0; i < filas; i++) if (i !== r) { var f = M[i][c] / M[r][c]; for (var k = c; k < cols; k++) M[i][k] -= f * M[r][k]; } r++; } return r; }
function inversa(A) { var n = A.length, M = A.map(function (f, i) { return f.concat(eye(n)[i]); }); if (rango(A) < n) return null; for (var c = 0; c < n; c++) { var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; var t = M[p]; M[p] = M[c]; M[c] = t; var d = M[c][c]; for (var k = 0; k < 2 * n; k++) M[c][k] /= d; for (r = 0; r < n; r++) if (r !== c) { var f = M[r][c]; for (k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]; } } return M.map(function (f) { return f.slice(n); }); }
function iguales(A, B, tol) { tol = tol || 1e-9; if (A === null || B === null || A === undefined || B === undefined) return false; if (typeof A === 'number') return typeof B === 'number' && Math.abs(A - B) <= tol * Math.max(1, Math.abs(B)); if (!Array.isArray(A) || !Array.isArray(B) || A.length !== B.length) return false; return A.every(function (x, i) { return iguales(x, B[i], tol); }); }
function aleatoria(f, c, semilla) { var s = semilla || 7, M = []; for (var i = 0; i < f; i++) { M.push([]); for (var j = 0; j < c; j++) { s = (s * 9301 + 49297) % 233280; M[i].push(Math.round((s / 233280) * 18 - 9) || 1); } } return M; }
function resolvible(A, b) { return rango(A) === rango(A.map(function (f, i) { return f.concat([b[i]]); })); }
function raices(p, a, b) { var rs = [], n = 20000; for (var i = 0; i < n; i++) { var x0 = a + (b - a) * i / n, x1 = a + (b - a) * (i + 1) / n; if (p(x0) === 0) rs.push(x0); else if (p(x0) * p(x1) < 0) { var lo = x0, hi = x1; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (p(lo) * p(m) <= 0) hi = m; else lo = m; } rs.push((lo + hi) / 2); } } return rs; }
function valoresPropios(A) { return raices(function (l) { return det(A.map(function (f, i) { return f.map(function (x, j) { return i === j ? x - l : x; }); })); }, -50, 50.0001); }
function proyeccion(u, v) { var mejor = Infinity, tm = 0; for (var t = -10; t <= 10; t += 0.0005) { var d = Math.hypot.apply(null, u.map(function (x, i) { return x - t * v[i]; })); if (d < mejor) { mejor = d; tm = t; } } return v.map(function (x) { return tm * x; }); }
function areaPoligono(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
var CUADRADO = [[0, 0], [1, 0], [1, 1], [0, 1]];
var IMAGEN35 = [[0, 0], [2, 0], [2, 1], [0, 1]];          // vértices de la figura de AL35 (copiados a propósito)
var IMAGEN40 = [[0, 0], [1, 0], [3, 1], [2, 1]];          // figura de AL40

module.exports = {
  minFiguras: 12,
  esperado: {
    AL06: (function () { var k = raices(function (k) { return det([[1, k], [2, 4]]); }, -10, 10.0001); return k.length === 1 ? k[0] : NaN; })(),
    AL11: mul([[1, 2], [3, 4]], [[5, 6], [7, 8]])[1][0],
    AL16: det([[3, 2], [1, 4]]),
    AL17: det([[2, 5, 7], [0, 3, 1], [0, 0, 4]]),
    AL19: (function () { var A = aleatoria(3, 3, 11), k = Math.cbrt(5 / det(A)); A = A.map(function (f) { return f.map(function (x) { return x * k; }); }); return det(A.map(function (f) { return f.map(function (x) { return 2 * x; }); })); })(),
    AL20: areaPoligono([[0, 0], [3, 1], [4, 3], [1, 2]]),
    AL23: rango([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [1, 1, 0, 0]]),   // matrices 2×2 aplanadas: 4 independientes
    AL30: 3 - rango([[1, 1, 1]]),
    AL31: rango([[1, 2, 3], [2, 4, 6], [1, 0, 1]]),
    AL32: (function () { var A = [[1, 0, 0, 2, 1], [0, 1, 0, 1, 1], [0, 0, 1, 3, 2]]; return A[0].length - rango(A); })(),   // ejemplo de 3 × 5 con rango 3
    AL40: areaPoligono(CUADRADO.map(function (p) { return mv([[1, 2], [0, 1]], p); })),
    AL45: (function () { var P = aleatoria(3, 3, 5); while (Math.abs(det(P)) < 1) P = aleatoria(3, 3, 6); return det(mul(mul(P, [[1, 0, 0], [0, 2, 0], [0, 0, 4]]), inversa(P))); })()
  },
  valores: {
    AL01: { op: { '(3, 1)': [3, 1], '(1, 3)': [1, 3], '(4, 2)': [4, 2], '(2, 2)': [2, 2] }, cumple: function (p) { return p[0] + p[1] === 4 && p[0] - p[1] === 2; } },
    AL02: { op: { 'x + y = 2 y 2x + 2y = 5': [[1, 1, 2], [2, 2, 5]], 'x + y = 2 y x − y = 0': [[1, 1, 2], [1, -1, 0]], 'x + y = 2 y 2x + 2y = 4': [[1, 1, 2], [2, 2, 4]], 'x = 1 y y = 2': [[1, 0, 1], [0, 1, 2]] },
      cumple: function (s) { return !resolvible(s.map(function (f) { return f.slice(0, 2); }), s.map(function (f) { return f[2]; })); } },
    AL03: { op: { 'No tiene solución': 'ninguna', 'Tiene infinitas soluciones': 'infinitas', 'Tiene solución única': 'unica', 'Tiene solución x = 3, y = 5': 'x3y5' },
      cumple: function (c) { var A = [[1, 2], [0, 0]], b = [3, 5]; return c === (!resolvible(A, b) ? 'ninguna' : rango(A) < 2 ? 'infinitas' : 'unica'); } },
    AL04: { op: { 'x = 4 − 2t, y = t (t real)': function (t) { return [4 - 2 * t, t]; }, 'Solo x = 4, y = 0': function () { return [4, 0]; }, 'x = 4 + 2t, y = t (t real)': function (t) { return [4 + 2 * t, t]; }, 'No tiene solución': null },
      cumple: function (r) { if (!r) return false; var ok = [-2, 0, 1.5, 3].every(function (t) { var p = r(t); return Math.abs(p[0] + 2 * p[1] - 4) < 1e-12; }); var d = [r(1)[0] - r(0)[0], r(1)[1] - r(0)[1]]; return ok && Math.hypot(d[0], d[1]) > 0; } },  // todas las soluciones, no una sola
    AL05: { op: { '(x, y, z) = (1, 2, 3)': [1, 2, 3], '(x, y, z) = (3, 2, 1)': [3, 2, 1], '(x, y, z) = (1, 5, 3)': [1, 5, 3], '(x, y, z) = (6, 5, 3)': [6, 5, 3] },
      cumple: function (v) { return iguales(mv([[1, 1, 1], [0, 1, 1], [0, 0, 1]], v), [6, 5, 3]); } },
    AL07: { op: { '2 × 4': [2, 4], '3 × 3': [3, 3], '4 × 2': [4, 2], 'No se pueden multiplicar': null },
      cumple: function (d) { var P = mul(aleatoria(2, 3), aleatoria(3, 4, 3)); return d !== null && P !== null && P.length === d[0] && P[0].length === d[1]; } },
    AL08: { op: { 'filas (2, 1) y (4, 3)': [[2, 1], [4, 3]], 'filas (3, 4) y (1, 2)': [[3, 4], [1, 2]], 'filas (0, 2) y (3, 0)': [[0, 2], [3, 0]], 'filas (1, 3) y (2, 4)': [[1, 3], [2, 4]] },
      cumple: function (M) { return iguales(M, mul([[1, 2], [3, 4]], [[0, 1], [1, 0]])); } },
    AL09: { op: { 'No; en general AB ≠ BA': 'no', 'Sí, siempre': 'si', 'Sí, siempre que sean cuadradas': 'cuadradas', 'Solo falla en matrices de más de 2 × 2': 'grandes' },
      cumple: function (c) { var A = [[1, 2], [3, 4]], B = [[0, 1], [1, 0]], conmutan = iguales(mul(A, B), mul(B, A)); return c === 'no' ? !conmutan : false; } },   // contraejemplo cuadrado y de 2×2
    AL10: { op: { 'BᵀAᵀ': function (A, B) { return mul(T(B), T(A)); }, 'AᵀBᵀ': function (A, B) { return mul(T(A), T(B)); }, 'AB': function (A, B) { return mul(A, B); }, 'BA': function (A, B) { return mul(B, A); } },
      cumple: function (f) { var A = aleatoria(2, 3, 2), B = aleatoria(3, 2, 9); return iguales(f(A, B), T(mul(A, B))); } },
    AL12: { op: { 'filas (3, −1) y (−5, 2)': [[3, -1], [-5, 2]], 'filas (3, −5) y (−1, 2)': [[3, -5], [-1, 2]], 'filas (1/2, 1) y (1/5, 1/3)': [[0.5, 1], [0.2, 1 / 3]], 'filas (−3, 1) y (5, −2)': [[-3, 1], [5, -2]] },
      cumple: function (X) { return iguales(mul([[2, 1], [5, 3]], X), eye(2)); } },
    AL13: { op: { 'det A ≠ 0': function (A) { return det(A) !== 0; }, 'det A = 0': function (A) { return det(A) === 0; }, 'Es cuadrada': function (A) { return A.length === A[0].length; }, 'Ninguna de sus entradas es cero': function (A) { return A.every(function (f) { return f.every(function (x) { return x !== 0; }); }); } },
      cumple: function (p) { return [[[1, 2], [2, 4]], [[2, 1], [5, 3]], [[0, 1], [1, 0]], [[0, 0], [0, 1]]].every(function (A) { return p(A) === (inversa(A) !== null); }); } },
    AL14: { op: { 'B⁻¹A⁻¹': function (A, B) { return mul(inversa(B), inversa(A)); }, 'A⁻¹B⁻¹': function (A, B) { return mul(inversa(A), inversa(B)); }, '(BA)⁻¹': function (A, B) { return inversa(mul(B, A)); }, 'AB': function (A, B) { return mul(A, B); } },
      cumple: function (f) { var A = [[2, 1], [5, 3]], B = [[1, 2], [3, 7]]; return iguales(mul(f(A, B), mul(A, B)), eye(2), 1e-9); } },
    AL15: { op: { 'x = (5, 1)': [5, 1], 'x = (3, 7)': [3, 7], 'x = (3, 1)': [3, 1], 'x = (1, 5)': [1, 5] },
      cumple: function (x) { var A = inversa([[1, 2], [0, 1]]); return iguales(mv(A, x), [3, 1]); } },
    AL18: { op: { 'Cambia de signo': -1, 'No cambia': 1, 'Se multiplica por 2': 2, 'Se vuelve cero': 0 },
      cumple: function (k) { var A = aleatoria(3, 3, 4), B = [A[1], A[0], A[2]]; return iguales(det(B), k * det(A), 1e-9); } },
    AL21: (function () {
      function es(pred, gen) { return [pred, gen]; }
      return { op: {
          'La recta y = 2x': es(function (p) { return Math.abs(p[1] - 2 * p[0]) < 1e-9; }, function (t) { return [t, 2 * t]; }),
          'La recta y = 2x + 1': es(function (p) { return Math.abs(p[1] - 2 * p[0] - 1) < 1e-9; }, function (t) { return [t, 2 * t + 1]; }),
          'El primer cuadrante (x ≥ 0, y ≥ 0)': es(function (p) { return p[0] >= 0 && p[1] >= 0; }, function (t) { return [Math.abs(t), Math.abs(2 * t) + 1]; }),
          'La unión de los dos ejes coordenados': es(function (p) { return p[0] === 0 || p[1] === 0; }, function (t, k) { return k % 2 ? [t, 0] : [0, t]; }) },
        cumple: function (c) {   // contiene el cero y es cerrado bajo suma y producto por escalar (con miembros de muestra)
          var pred = c[0], m = [-2, -0.5, 1, 3].map(function (t, k) { return c[1](t, k); });
          if (!pred([0, 0])) return false;
          return m.every(function (a) { return [-3, 0.5, 2].every(function (s) { return pred([s * a[0], s * a[1]]); }) && m.every(function (b) { return pred([a[0] + b[0], a[1] + b[1]]); }); });
        } };
    })(),
    AL22: { op: { '3(1, 1) + 2(1, 2)': [3, 2], '2(1, 1) + 3(1, 2)': [2, 3], '5(1, 1) + 7(1, 2)': [5, 7], 'No es combinación lineal de ellos': null },
      cumple: function (c) { return c !== null && iguales([c[0] + c[1], c[0] + 2 * c[1]], [5, 7]); } },
    AL24: { op: { '4': 4, '3': 3, '6': 6, 'Infinita': Infinity },
      cumple: function (d) { var xs = [-2, -1, 0, 1, 2, 3]; return d === rango(xs.map(function (x) { return [1, x, x * x, x * x * x]; })); } },   // {1, x, x², x³} evaluados son independientes
    AL25: { op: { 'El plano z = 0': function (p) { return p[2] === 0; }, 'Todo ℝ³': function () { return true; }, 'La recta x = y, z = 0': function (p) { return p[0] === p[1] && p[2] === 0; }, 'El plano x = 0': function (p) { return p[0] === 0; } },
      cumple: function (pred) { return [[1, 2, 0], [0, 0, 0], [3, -1, 0], [1, 1, 1], [0, 2, 5], [2, 2, 0]].every(function (p) { return pred(p) === (rango([[1, 0, 0], [0, 1, 0], p]) === 2); }); } },
    AL26: { op: { 'No, porque (2, 4) = 2(1, 2)': 'dep', 'Sí, porque no son iguales': 'indep', 'Sí, porque ninguno es el vector cero': 'indep0', 'No se puede saber con dos vectores': 'nosabe' },
      cumple: function (c) { return c === (rango([[1, 2], [2, 4]]) < 2 ? 'dep' : 'indep'); } },
    AL27: { op: { 'Son siempre linealmente dependientes': 'dep', 'Son siempre linealmente independientes': 'indep', 'Forman siempre una base de ℝ²': 'base', 'Son independientes si no son paralelos': 'paralelos' },
      cumple: function (c) { var todas = true; for (var s = 1; s < 60; s++) if (rango(aleatoria(3, 2, s)) === 3) todas = false; return c === (todas ? 'dep' : 'indep'); } },
    AL28: { op: { 'Sí, porque el determinante de la matriz que forman es −2 ≠ 0': ['si', -2], 'No, porque el determinante es 0': ['no', 0], 'No, porque tienen entradas iguales a cero': ['no', null], 'Sí, porque son tres vectores de ℝ³, sin importar cuáles': ['si', null] },
      cumple: function (v) { var d = det([[1, 0, 1], [0, 1, 1], [1, 1, 0]]); return v[1] !== null && iguales(v[1], d) && v[0] === (d !== 0 ? 'si' : 'no'); } },
    AL29: { op: { '(5/2, 3/2)': [2.5, 1.5], '(4, 1)': [4, 1], '(3/2, 5/2)': [1.5, 2.5], '(3, 1)': [3, 1] },
      cumple: function (c) { return iguales([c[0] + c[1], c[0] - c[1]], [4, 1]); } },
    AL33: { op: { 'Los múltiplos de (1, 1)': [[1, 1]], 'Solo el vector cero': [], 'Los múltiplos de (1, −1)': [[1, -1]], 'Todo ℝ²': [[1, 0], [0, 1]] },
      cumple: function (base) { var A = [[1, -1], [2, -2]]; return base.length === 2 - rango(A) && base.every(function (v) { return iguales(mv(A, v), [0, 0]); }); } },
    AL34: { op: { 'b está en el espacio columna de A': function (A, b) { return rango(A) === rango(A.map(function (f, i) { return f.concat([b[i]]); })); }, 'det A = 0': function (A) { return det(A) === 0; }, 'b = 0': function (A, b) { return b.every(function (x) { return x === 0; }); }, 'Siempre tiene solución': function () { return true; } },
      cumple: function (p) {   // compara con resolver de verdad (mínimos cuadrados: residuo cero)
        var casos = [[[[1, 2], [2, 4]], [1, 2]], [[[1, 2], [2, 4]], [1, 0]], [[[2, 1], [5, 3]], [4, 7]], [[[1, 0], [0, 0]], [0, 1]]];
        return casos.every(function (c) {
          var A = c[0], b = c[1], ATA = mul(T(A), A), Atb = mv(T(A), b), x = inversa(ATA) ? mv(inversa(ATA), Atb) : null;
          var tiene = x ? iguales(mv(A, x), b, 1e-9) : (function () { for (var a = -5; a <= 5; a += 0.5) for (var d = -5; d <= 5; d += 0.5) if (iguales(mv(A, [a, d]), b)) return true; return false; })();
          return p(A, b) === tiene;
        });
      } },
    AL35: { op: { 'filas (2, 0) y (0, 1)': [[2, 0], [0, 1]], 'filas (1, 0) y (0, 2)': [[1, 0], [0, 2]], 'filas (2, 0) y (0, 2)': [[2, 0], [0, 2]], 'filas (0, 2) y (1, 0)': [[0, 2], [1, 0]] },
      cumple: function (M) { return iguales(CUADRADO.map(function (p) { return mv(M, p); }), IMAGEN35); } },
    AL36: { op: { 'filas (0, −1) y (1, 0)': [[0, -1], [1, 0]], 'filas (0, 1) y (−1, 0)': [[0, 1], [-1, 0]], 'filas (−1, 0) y (0, −1)': [[-1, 0], [0, -1]], 'filas (1, 0) y (0, −1)': [[1, 0], [0, -1]] },
      cumple: function (M) { return [0, 0.7, 2, 4].every(function (t) { return iguales(mv(M, [Math.cos(t), Math.sin(t)]), [Math.cos(t + Math.PI / 2), Math.sin(t + Math.PI / 2)], 1e-12); }); } },
    AL37: { op: { 'filas (0, 1) y (1, 0)': [[0, 1], [1, 0]], 'filas (1, 0) y (0, −1)': [[1, 0], [0, -1]], 'filas (0, −1) y (1, 0)': [[0, -1], [1, 0]], 'filas (−1, 0) y (0, 1)': [[-1, 0], [0, 1]] },
      cumple: function (M) { var n = [1, -1]; return [[2, 1], [-1, 3], [0.5, -2]].every(function (p) { var k = 2 * (p[0] * n[0] + p[1] * n[1]) / 2; return iguales(mv(M, p), [p[0] - k * n[0], p[1] - k * n[1]]); }); } },   // p − 2(p·n/n·n)n
    AL38: { op: { 'No, porque T(0, 0) = (1, 0) ≠ (0, 0)': 'no_cero', 'Sí, porque cada componente es de primer grado': 'si', 'Sí, porque una traslación conserva las rectas': 'si2', 'No, porque no es inyectiva': 'no_iny' },
      cumple: function (c) {
        var Tf = function (p) { return [p[0] + 1, p[1]]; }, cero = iguales(Tf([0, 0]), [0, 0]);
        var inyectiva = !iguales(Tf([1, 2]), Tf([3, 4])) && !iguales(Tf([0, 0]), Tf([0, 1]));
        return { no_cero: !cero, si: false, si2: false, no_iny: !inyectiva }[c] === true;
      } },
    AL39: { op: { 'filas (1, 1, 0) y (0, 0, 2)': [[1, 1, 0], [0, 0, 2]], 'filas (1, 0), (1, 0) y (0, 2)': [[1, 0], [1, 0], [0, 2]], 'filas (1, 1) y (0, 2)': [[1, 1], [0, 2]], 'fila (1, 1, 2)': [[1, 1, 2]] },
      cumple: function (M) { var Tf = function (p) { return [p[0] + p[1], 2 * p[2]]; }; return M[0].length === 3 && [[1, 0, 0], [0, 1, 0], [0, 0, 1], [2, -1, 3]].every(function (p) { return iguales(mv(M, p), Tf(p)); }); } },
    AL41: { op: { '2 y 5': [2, 5], '7 y 10': [7, 10], '0 y 7': [0, 7], '1 y 1': [1, 1] }, cumple: function (v) { return iguales(v.slice().sort(), valoresPropios([[2, 0], [0, 5]]).sort(), 1e-6); } },
    AL42: { op: { '2 y 5': [2, 5], '4 y 3': [4, 3], '1 y 6': [1, 6], '−2 y −5': [-2, -5] }, cumple: function (v) { return iguales(v.slice().sort(), valoresPropios([[4, 1], [2, 3]]).sort(), 1e-6); } },
    AL43: { op: { 'Sí, con valor propio 3': 3, 'Sí, con valor propio 1': 1, 'Sí, con valor propio 2': 2, 'No': null },
      cumple: function (l) { var Av = mv([[2, 1], [1, 2]], [1, 1]); return l !== null && iguales(Av, [l, l]); } },
    AL44: { op: { '(1, −2)': [1, -2], '(1, 1)': [1, 1], '(1, 2)': [1, 2], '(2, 1)': [2, 1] }, cumple: function (v) { return iguales(mv([[4, 1], [2, 3]], v), [2 * v[0], 2 * v[1]]); } },
    AL46: { op: { 'PD²P⁻¹': function (P, D) { return mul(mul(P, mul(D, D)), inversa(P)); }, 'P²D²P⁻²': function (P, D) { var Pi = inversa(P); return mul(mul(mul(P, P), mul(D, D)), mul(Pi, Pi)); }, 'D²': function (P, D) { return mul(D, D); }, 'PD²P': function (P, D) { return mul(mul(P, mul(D, D)), P); } },
      cumple: function (f) { var P = [[2, 1], [1, 1]], D = [[3, 0], [0, -1]], A = mul(mul(P, D), inversa(P)); return iguales(f(P, D), mul(A, A), 1e-9); } },
    AL47: { op: { '(3, 0)': [3, 0], '(0, 4)': [0, 4], '(3, 4)': [3, 4], '3': 3 }, cumple: function (v) { return iguales(v, proyeccion([3, 4], [1, 0]), 1e-3); } },
    AL48: { op: { '(5/2, 5/2)': [2.5, 2.5], '(5, 5)': [5, 5], '5/√2': 5 / Math.SQRT2, '(1, 1)': [1, 1] }, cumple: function (v) { return iguales(v, proyeccion([2, 3], [1, 1]), 1e-3); } },
    AL49: { op: { '(0, 1)': [0, 1], '(1, 1)': [1, 1], '(1, 0)': [1, 0], '(1, −1)': [1, -1] },
      cumple: function (u) { var v1 = [1, 0], v2 = [1, 1], d = [v2[0] - u[0], v2[1] - u[1]]; return Math.abs(u[0] * v1[0] + u[1] * v1[1]) < 1e-12 && Math.abs(d[0] * v1[1] - d[1] * v1[0]) < 1e-12; } },  // u₂ ⟂ v₁ y v₂ − u₂ es múltiplo de v₁
    AL50: { op: { 'QᵀQ = I': function (Q) { return iguales(mul(T(Q), Q), eye(2), 1e-12); }, 'det Q = 0': function (Q) { return det(Q) === 0; }, 'Q = Qᵀ': function (Q) { return iguales(Q, T(Q)); }, 'Q² = I': function (Q) { return iguales(mul(Q, Q), eye(2), 1e-12); } },
      cumple: function (p) {   // columnas ortonormales, comprobado con normas y productos punto de las columnas
        var c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
        return [[[c, -s], [s, c]], [[2, 0], [0, 1]], [[1, 1], [0, -1]], [[1, 2], [2, 4]], [[0, 1], [1, 0]]].every(function (Q) {
          var a = [Q[0][0], Q[1][0]], b = [Q[0][1], Q[1][1]];
          var orto = Math.abs(Math.hypot(a[0], a[1]) - 1) < 1e-12 && Math.abs(Math.hypot(b[0], b[1]) - 1) < 1e-12 && Math.abs(a[0] * b[0] + a[1] * b[1]) < 1e-12;
          return p(Q) === orto;
        });
      } }
  },
  extra: function (t, assert) {
    t('AL40: la figura dibuja la imagen del cuadrado bajo la matriz del enunciado', function () { assert.ok(iguales(CUADRADO.map(function (p) { return mv([[1, 2], [0, 1]], p); }), IMAGEN40)); });
    t('AL20: el paralelogramo dibujado es el generado por (3, 1) y (1, 2)', function () { assert.ok(iguales([3 + 1, 1 + 2], [4, 3])); });
  }
};
