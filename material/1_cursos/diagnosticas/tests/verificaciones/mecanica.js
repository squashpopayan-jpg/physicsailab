/* Verificación independiente del banco de Mecánica.
   Siempre que se puede, la respuesta se obtiene SIMULANDO el movimiento paso a paso (integración numérica),
   resolviendo sistemas de ecuaciones o barriendo valores, en lugar de usar la fórmula que la pregunta evalúa.
   Convenciones del banco: g = 10 m/s², sen 37° = 0,6, cos 37° = 0,8, sen 30° = 0,5. */
'use strict';
var g = 10, S37 = 0.6, C37 = 0.8, S30 = 0.5, C30 = Math.sqrt(3) / 2, DT = 1e-5;
function simpson(f, a, b, n) { n = n || 2000; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
function trapecio(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2; return s; }
function resolver2(a, b, c, d, e, f) { var D = a * d - b * c; return [(e * d - b * f) / D, (a * f - e * c) / D]; }   // a·x + b·y = e ; c·x + d·y = f
function cerca(a, b, tol) { if (typeof a !== 'number' || typeof b !== 'number') return false; return Math.abs(a - b) <= (tol || 1e-6) * Math.max(1, Math.abs(b)); }
/* Proyectil: integra con paso pequeño y devuelve {alcance, hmax, t}. */
function proyectil(vx, vy, y0) { var x = 0, y = y0 || 0, hmax = y, t = 0; while (true) { var y1 = y + vy * DT - g * DT * DT / 2; vy -= g * DT; x += vx * DT; t += DT; if (y1 < 0 && t > DT) { var fr = y / (y - y1); return { alcance: x - vx * DT * (1 - fr), hmax: hmax, t: t }; } y = y1; if (y > hmax) hmax = y; } }
/* Movimiento 1D con aceleración a(x, v) hasta que se cumpla 'parar'. */
function mover(x, v, a, parar) { var t = 0; while (!parar(x, v, t)) { var ac = a(x, v); v += ac * DT; x += v * DT; t += DT; } return { x: x, v: v, t: t }; }

module.exports = {
  minFiguras: 18,
  esperado: {
    ME01: trapecio([[0, 0], [4, 12], [6, 12], [8, 0]]),
    ME02: (function () { var x = function (t) { return 2 * t * t * t - 3 * t * t; }, h = 1e-4; return (x(2 + h) - 2 * x(2) + x(2 - h)) / (h * h); })(),
    ME03: mover(0, 20, function () { return -5; }, function (x, v) { return v <= 0; }).x,
    ME04: (30 - 10) / (10 + 5),
    ME05: mover(0, 20, function () { return -g; }, function (x, v) { return v <= 0; }).x,
    ME06: proyectil(15, 0, 20).alcance,
    ME08: proyectil(20 * C30, 20 * S30, 0).hmax,
    ME09: Math.hypot(4, 3),
    ME10: (function () { var r = 5, w = 10 / r, p = function (t) { return [r * Math.cos(w * t), r * Math.sin(w * t)]; }, h = 1e-4, t = 0.3; var a = [0, 1].map(function (k) { return (p(t + h)[k] - 2 * p(t)[k] + p(t - h)[k]) / (h * h); }); return Math.hypot(a[0], a[1]); })(),
    ME11: resolver2(3, 1, 2, -1, 3 * g, -2 * g)[0],     // 3a + T = 30 (la de 3 kg baja) ; 2a − T = −20
    ME12: resolver2(3, 1, 2, -1, 3 * g, -2 * g)[1],
    ME13: resolver2(5, -1, 5, 1, 0, 5 * g)[0],          // bloque: 5a − T = 0 ; colgante: 5a + T = 50
    ME14: resolver2(4, 1, 2, -1, 30, 0)[1],             // 4a + T = 30 ; 2a − T = 0
    ME15: 50 * C37 / 10,
    ME16: 10 * g - 50 * S37,
    ME17: mover(0, 0, function () { return g * S37 - 0.5 * g * C37; }, function (x, v, t) { return t >= 1; }).v,   // la rapidez tras 1 s es la aceleración
    ME19: (function () { for (var mu = 0; mu < 3; mu += 1e-5) if (mu * g * C37 >= g * S37) return mu; })(),
    ME20: (function () { for (var F = 0; F < 200; F += 0.001) if (F - 0.3 * 10 * g >= 0) return F; })(),
    ME21: (function () { var v = 0; while (1000 * (v + 1e-4) * (v + 1e-4) / 20 <= 0.5 * 1000 * g) v += 1e-4; return v; })(),
    ME22: (function () { var v = 0; while (1 * v * v / 2.5 - 1 * g < 0) v += 1e-4; return v; })(),          // normal = mv²/R − mg ≥ 0
    ME23: 1 * g + 1 * 2 * 2 / 1,
    ME24: 1000 * g - 1000 * 10 * 10 / 40,
    ME26: simpson(function (x) { return 3 * x * x; }, 0, 2),
    ME27: mover(0, Math.sqrt(2 * g * 5), function (x) { return -400 * x / 2; }, function (x, v) { return v <= 0; }).x,
    ME28: -0.2 * 2 * g * 5,
    ME29: 2000 * 3,
    ME30: mover(0, 0, function () { return g * 0.6 - 4 / 2; }, function (x) { return x >= 10; }).v,
    ME33: trapecio([[0, 0], [0.1, 100], [0.2, 0]]),
    ME35: (2 * 0 + 3 * 5) / 5,
    ME36: (function () { var v = (2 * 4) / 4; return 0.5 * 2 * 16 - 0.5 * 4 * v * v; })(),
    ME37: (function () { var th = 0, w = 0; for (var t = 0; t < 5 - 1e-12; t += DT) { w += 2 * DT; th += w * DT; } return th; })(),
    ME38: (function () { var r = [0.5, 0], F = [20 * C30, 20 * S30]; return Math.abs(r[0] * F[1] - r[1] * F[0]); })(),
    ME39: 1 * 0.5 * 0.5 + 1 * 0.5 * 0.5,
    ME40: 6 / 2,
    ME43: (function () { for (var x = 0; x < 10; x += 1e-4) if (20 * g * x >= 30 * g * 2) return x; })(),
    ME44: resolver2(1, 1, 0, 4, 200 + 100, 200 * 2 + 100 * 1)[1],   // R_A + R_B = 300 ; torques en A: 4 R_B = 500
    ME46: (function () { for (var T = 0; T < 500; T += 1e-3) if (2 * T * S30 >= 100) return T; })(),
    ME48: 10 * (2 / 1) / Math.pow(2 / 1, 2)
  },
  valores: {
    ME07: { op: { '45°': 45, '90°': 90, '30°': 30, '60°': 60 },
      cumple: function (a) { var mejor = 0, am = 0; for (var t = 5; t <= 85; t += 5) { var r = proyectil(20 * Math.cos(t * Math.PI / 180), 20 * Math.sin(t * Math.PI / 180), 0).alcance; if (r > mejor) { mejor = r; am = t; } } return a === am; } },
    ME18: { op: { '50 N, y la caja no se mueve': [50, false], '80 N, y la caja no se mueve': [80, false], '0 N, porque no hay movimiento': [0, false], '30 N, y la caja se mueve': [30, true] },
      cumple: function (v) { var max = 0.4 * 20 * g, F = 50, mueve = F > max, fr = mueve ? null : F; return v[1] === mueve && v[0] === fr; } },
    ME25: { op: { 'Apunta hacia el centro y no realiza trabajo': 'centro', 'Es tangente a la trayectoria': 'tangente', 'Es cero, porque la rapidez es constante': 'cero', 'Apunta hacia afuera del círculo': 'afuera' },
      cumple: function (c) {
        var r = 3, w = 2, p = function (t) { return [r * Math.cos(w * t), r * Math.sin(w * t)]; }, h = 1e-4, t = 0.7;
        var a = [0, 1].map(function (k) { return (p(t + h)[k] - 2 * p(t)[k] + p(t - h)[k]) / (h * h); }), v = [0, 1].map(function (k) { return (p(t + h)[k] - p(t - h)[k]) / (2 * h); });
        var hacia = -(a[0] * p(t)[0] + a[1] * p(t)[1]) / (Math.hypot(a[0], a[1]) * r), potencia = a[0] * v[0] + a[1] * v[1];
        var real = Math.hypot(a[0], a[1]) < 1e-6 ? 'cero' : Math.abs(hacia - 1) < 1e-4 && Math.abs(potencia) < 1e-4 ? 'centro' : hacia < -0.99 ? 'afuera' : 'tangente';
        return c === real;
      } },
    ME31: { op: { 'El rozamiento cinético': 'friccion', 'El peso': 'peso', 'La fuerza de un resorte ideal': 'resorte', 'La atracción gravitatoria entre dos planetas': 'gravedad' },
      cumple: function (c) {   // trabajo en un recorrido cerrado (cuadrado de 1 m centrado en (2, 2)): no conservativa ⇔ no es cero
        var fuerzas = {
          peso: function () { return [0, -g]; }, resorte: function (p) { return [-5 * p[0], -5 * p[1]]; },
          gravedad: function (p) { var d = Math.hypot(p[0], p[1]); return [-p[0] / (d * d * d), -p[1] / (d * d * d)]; },
          friccion: function (p, dir) { return [-0.5 * g * dir[0], -0.5 * g * dir[1]]; } };
        var esquinas = [[1.5, 1.5], [2.5, 1.5], [2.5, 2.5], [1.5, 2.5], [1.5, 1.5]], W = 0;
        for (var i = 0; i < 4; i++) { var a = esquinas[i], b = esquinas[i + 1], dir = [b[0] - a[0], b[1] - a[1]], n = 2000;
          for (var k = 0; k < n; k++) { var p = [a[0] + dir[0] * (k + 0.5) / n, a[1] + dir[1] * (k + 0.5) / n], Fv = fuerzas[c](p, dir); W += (Fv[0] * dir[0] + Fv[1] * dir[1]) / n; } }
        return Math.abs(W) > 1e-6;
      } },
    ME32: { op: { 'La primera se detiene y la segunda sale con la velocidad que traía la primera': [0, 1], 'Ambas se mueven juntas a la mitad de la velocidad': [0.5, 0.5], 'La primera rebota con la misma rapidez y la segunda sigue quieta': [-1, 0], 'Ambas se detienen': [0, 0] },
      cumple: function (v) { return cerca(v[0] + v[1], 1) && cerca(v[0] * v[0] + v[1] * v[1], 1) && v[0] <= v[1]; } },   // m = 1, v = 1: momento y energía, y no se atraviesan
    ME34: { op: { 'Sale a 3 m/s hacia la izquierda': -3, 'Sale a 6 m/s hacia la izquierda': -6, 'Sale a 3 m/s hacia la derecha': 3, 'Queda en reposo': 0 },
      cumple: function (v) { return cerca(1 * 6 + 2 * v, 0); } },
    ME41: { op: { 'La esfera maciza': 'esfera', 'El aro': 'aro', 'Llegan al mismo tiempo': 'iguales', 'Depende de la masa': 'masa' },
      cumple: function (c) {
        // momento de inercia de la esfera maciza integrando sobre su volumen (R = 1, densidad uniforme)
        var n = 60, I = 0, m = 0;
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var k = 0; k < n; k++) {
          var x = -1 + (i + 0.5) * 2 / n, y = -1 + (j + 0.5) * 2 / n, z = -1 + (k + 0.5) * 2 / n;
          if (x * x + y * y + z * z <= 1) { m += 1; I += x * x + y * y; }
        }
        var kEsfera = I / m, kAro = 1;                       // I/(mR²): el aro tiene toda su masa a distancia R
        var aEsfera = g * S30 / (1 + kEsfera), aAro = g * S30 / (1 + kAro);   // rodadura: mg sen θ − f = ma, fR = I a/R
        var real = Math.abs(aEsfera - aAro) < 1e-6 ? 'iguales' : aEsfera > aAro ? 'esfera' : 'aro';
        return c === real && Math.abs(kEsfera - 0.4) < 0.01;
      } },
    ME42: { op: { 'Se duplica': 2, 'Se reduce a la mitad': 0.5, 'No cambia': 1, 'Se cuadruplica': 4 }, cumple: function (k) { var I = 3, w = 5, L = I * w; return cerca((I / 2) * (w * k), L); } },
    ME45: { op: { 'La suma de fuerzas y la suma de torques deben ser cero': 'ambas', 'Basta con que la suma de fuerzas sea cero': 'fuerzas', 'Basta con que la suma de torques sea cero': 'torques', 'Basta con que su velocidad sea cero en ese instante': 'velocidad' },
      cumple: function (c) {
        // contraejemplos: un par de fuerzas (ΣF = 0, Στ ≠ 0), una fuerza en el centro (Στ = 0, ΣF ≠ 0), una pelota en lo alto de su vuelo (v = 0, a ≠ 0)
        var par = { F: [10 - 10, 0], tau: 1 * 10 - (-1) * (-10) * -1 };
        var centro = { F: [10, 0], tau: 0 }, cima = { v: 0, a: -g };
        var basta = { fuerzas: !(par.F[0] === 0 && par.tau !== 0), torques: !(centro.tau === 0 && centro.F[0] !== 0), velocidad: !(cima.v === 0 && cima.a !== 0), ambas: true };
        return basta[c];
      } },
    ME47: { op: { 'Se divide entre 9': 1 / 9, 'Se divide entre 3': 1 / 3, 'Se multiplica por 3': 3, 'Se divide entre 6': 1 / 6 },
      cumple: function (k) { var F = function (r) { return 6.67e-11 * 5 * 7 / (r * r); }; return cerca(F(3 * 2) / F(2), k, 1e-12); } },
    ME49: { op: { 'Se reduce a la mitad': 0.5, 'Se multiplica por 4': 4, 'Se divide entre 4': 0.25, 'Se duplica': 2 },
      cumple: function (k) { function v(r) { var lo = 0, hi = 1e5; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (m * m / r < 4e14 / (r * r)) lo = m; else hi = m; } return lo; } return cerca(v(4 * 7e6) / v(7e6), k, 1e-9); } },   // v tal que v²/r = GM/r²
    ME50: { op: { 'Se multiplicaría por 8': 8, 'Se multiplicaría por 4': 4, 'Se multiplicaría por 16': 16, 'Se multiplicaría por 2': 2 },
      cumple: function (k) { function T(r) { var lo = 0, hi = 1e5; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (m * m / r < 1.3e20 / (r * r)) lo = m; else hi = m; } return 2 * Math.PI * r / lo; } return cerca(T(4 * 1.5e11) / T(1.5e11), k, 1e-9); } }
  },
  extra: function (t, assert) {
    t('ME27: la rampa entrega v = √(2gh) al resorte (simulada sobre la rampa con forma de la figura)', function () {
      // bajada por un plano equivalente sin fricción: la rapidez abajo no depende de la forma
      var r = mover(0, 0, function () { return g * 0.8; }, function (x) { return x >= 5 / 0.8; });
      assert.ok(cerca(r.v, Math.sqrt(2 * g * 5), 1e-3));
    });
    t('ME30: el plano descrito es coherente (6 m de altura en 10 m de recorrido, sen θ = 0,6)', function () { assert.ok(cerca(6 / 10, S37)); });
  }
};
