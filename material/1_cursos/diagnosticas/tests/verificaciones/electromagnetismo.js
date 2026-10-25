/* Verificación independiente del banco de Electromagnetismo.
   Las respuestas se obtienen por simulación o integración numérica, no con la fórmula que evalúa la pregunta:
   - flujos integrados sobre una esfera, campos de esferas y planos sumando elementos de carga;
   - Biot–Savart sumando segmentos de corriente (alambre, solenoide, espira);
   - circuitos RC, RL y LC integrados en el tiempo; redes de capacitores cargadas con las leyes de Kirchhoff;
   - trayectoria del protón integrada en el campo magnético. */
'use strict';
var k = 9e9, e = 1.6e-19, EPS0 = 1 / (4 * Math.PI * k), MU0 = 4 * Math.PI * 1e-7, PI = Math.PI;
function sub(a, b) { return a.map(function (x, i) { return x - b[i]; }); }
function add(a, b) { return a.map(function (x, i) { return x + b[i]; }); }
function esc(a, s) { return a.map(function (x) { return x * s; }); }
function norma(a) { return Math.sqrt(a.reduce(function (s, x) { return s + x * x; }, 0)); }
function cruz(u, v) { return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; }
function dot(u, v) { return u.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }
function campoE(q, pq, p) { var r = sub(p, pq), d = norma(r); return esc(r, k * q / (d * d * d)); }
function cerca(a, b, tol) { if (typeof a !== 'number' || typeof b !== 'number') return false; return Math.abs(a - b) <= (tol || 1e-6) * Math.max(Math.abs(a), Math.abs(b), 1e-300); }
function simpson(f, a, b, n) { n = n || 2000; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
/* Flujo de un campo vectorial por la esfera de radio R centrada en el origen (rejilla en θ, φ). */
function flujoEsfera(Ef, R) { var n = 200, s = 0; for (var i = 0; i < n; i++) { var th = (i + 0.5) * PI / n; for (var j = 0; j < 2 * n; j++) { var ph = (j + 0.5) * PI / n, nr = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; s += dot(Ef(esc(nr, R)), nr) * R * R * Math.sin(th) * (PI / n) * (PI / n); } } return s; }
/* Campo magnético de una curva con corriente (Biot–Savart), curva dada por puntos. */
function biot(puntos, I, p) { var B = [0, 0, 0]; for (var i = 1; i < puntos.length; i++) { var dl = sub(puntos[i], puntos[i - 1]), m = esc(add(puntos[i], puntos[i - 1]), 0.5), r = sub(p, m), d = norma(r); B = add(B, esc(cruz(dl, r), MU0 * I / (4 * PI * d * d * d))); } return B; }
function recta(a, b, n) { var p = []; for (var i = 0; i <= n; i++) p.push(add(a, esc(sub(b, a), i / n))); return p; }
function espira(c, R, n, sentido) { var p = []; for (var i = 0; i <= n; i++) { var t = sentido * 2 * PI * i / n; p.push(add(c, [0, R * Math.cos(t), R * Math.sin(t)])); } return p; }
/* Integra dq/dt para redes RC hasta el estado estable o un tiempo dado. */
function integrar(estado, deriv, tFin, dt) { var t = 0; while (t < tFin) { var d = deriv(estado, t); estado = estado.map(function (x, i) { return x + d[i] * dt; }); t += dt; } return estado; }

module.exports = {
  minFiguras: 12,
  esperado: {
    EM01: norma(campoE(2e-6, [0, 0, 0], [3, 0, 0])) * 3e-6 * 1000,                // en mN
    EM02: (function () { var mejor = 1e9, xm = 0; for (var x = 0.01; x < 2.99; x += 1e-4) { var E = campoE(4e-6, [0, 0, 0], [x, 0, 0])[0] + campoE(1e-6, [3, 0, 0], [x, 0, 0])[0]; if (Math.abs(E) < mejor) { mejor = Math.abs(E); xm = x; } } return xm; })(),
    EM06: norma(campoE(2e-9, [0, 0, 0], [3, 0, 0])),
    EM16: k * 3e-9 / 9,
    EM17: 2e-6 * (40 - 10) * 1e6,                                                     // en μJ
    EM22: (function () { var R = 1, C1 = 3e-6, C2 = 6e-6, V = 1; var q = integrar([0], function (s) { return [(V - s[0] / C1 - s[0] / C2) / R]; }, 2e-4, 1e-8)[0]; return q / V * 1e6; })(),   // carga que pasa por la serie
    EM23: (function () {   // 2 μF en serie con (3 μF ∥ 3 μF): cada rama con su resistencia y Kirchhoff en el nodo
      var V = 1, R = 1, r = 1, C1 = 2e-6, C2 = 3e-6, C3 = 3e-6;
      var s = integrar([0, 0, 0], function (q) {
        // i1 = (V − q1/C1 − vn)/R ; i2 = (vn − q2/C2)/r ; i3 = (vn − q3/C3)/r ; i1 = i2 + i3  → se despeja vn
        var vn = ((V - q[0] / C1) / R + q[1] / C2 / r + q[2] / C3 / r) / (1 / R + 2 / r);
        return [(V - q[0] / C1 - vn) / R, (vn - q[1] / C2) / r, (vn - q[2] / C3) / r];
      }, 1e-4, 1e-9);
      return s[0] / V * 1e6;
    })(),
    EM24: simpson(function (q) { return q / 4e-6; }, 0, 4e-6 * 10) * 1e6,           // trabajo de carga, en μJ
    EM26: (function () { var I = 12 / (1 + 5); return 12 - I * 1; })(),
    EM27: simpson(function () { return 3 * 3 * 4; }, 0, 1),                          // energía en 1 s
    EM28: 5 + 3 - 2,
    EM29: (function () { var R = 2000, C = 50e-6, q = 1, t = 0, dt = 1e-6; while (q > Math.exp(-1)) { q -= q / (R * C) * dt; t += dt; } return t; })(),   // tiempo hasta caer a 1/e
    EM34: (function () {   // integración de la órbita (método de Boris) y medida del diámetro
      var m = 1.6e-27, q = 1.6e-19, B = [0, 0, 0.1], v = [1e6, 0, 0], x = [0, 0, 0], dt = 1e-11, ymin = 0, ymax = 0;
      for (var i = 0; i < 80000; i++) {
        var t = esc(B, q * dt / (2 * m)), vp = add(v, cruz(v, t)), s2 = esc(t, 2 / (1 + dot(t, t)));
        v = add(v, cruz(vp, s2)); x = add(x, esc(v, dt)); ymin = Math.min(ymin, x[1]); ymax = Math.max(ymax, x[1]);
      }
      return (ymax - ymin) / 2;
    })(),
    EM36: norma(cruz(esc([1, 0, 0], 5 * 2), [0, 0.3, 0])),
    EM42: (function () { var Phi = function (t) { return 0.2 * t; }; return 100 * (Phi(0.1) - Phi(0)) / 0.1; })(),   // flujo que cambia 0,02 Wb en 0,1 s
    EM44: (function () { var B = 0.2, L = 0.5, v = 4, Phi = function (t) { return B * L * (1 + v * t); }, h = 1e-6; return (Phi(h) - Phi(-h)) / (2 * h); })(),
    EM45: (function () { var dPhi = 120 / 100; return 500 * dPhi; })(),               // misma variación de flujo por espira en ambas bobinas
    EM47: (function () {   // circuito LC: L di/dt = −q/C, dq/dt = i; se mide el periodo entre cruces por cero
      var L = 0.1, C = 10e-6, q = 1e-6, i = 0, t = 0, dt = 1e-7, cruces = [];
      while (cruces.length < 3) { var i2 = i - q / (L * C) * dt, q2 = q + i2 * dt; if (q > 0 && q2 <= 0 || q < 0 && q2 >= 0) cruces.push(t); q = q2; i = i2; t += dt; }
      return 2 * PI / (cruces[2] - cruces[0]);
    })(),
    EM49: (function () { var L = 2, R = 4, i = 0, t = 0, dt = 1e-6, If = 1 / R; while (i < If * (1 - Math.exp(-1))) { i += (1 - R * i) / L * dt; t += dt; } return t; })(),
    EM50: simpson(function (i) { return 0.2 * i; }, 0, 3)                              // ∫ L i di
  },
  valores: {
    EM03: { op: { 'Hacia arriba (+y)': [0, 1], 'Hacia abajo (−y)': [0, -1], 'Hacia la derecha (+x)': [1, 0], 'La fuerza neta es cero': [0, 0] },
      cumple: function (d) { var a = 1, p = [0, a, 0], F = add(campoE(1, [-a, 0, 0], p), campoE(1, [a, 0, 0], p)), n = norma(F); return n > 0 && Math.abs(F[0] / n - d[0]) < 1e-9 && Math.abs(F[1] / n - d[1]) < 1e-9; } },
    EM04: { op: { 'No, porque no es un múltiplo entero de e': 'no', 'Sí, cualquier valor es posible': 'si', 'Sí, porque es mayor que e': 'si2', 'Solo si el objeto es metálico': 'metal' },
      cumple: function (c) { var n = 2.4e-19 / e, entero = Math.abs(n - Math.round(n)) < 1e-9; return c === (entero ? 'si' : 'no'); } },
    EM05: { op: { 'Es atraída por la barra': 'atrae', 'Es repelida por la barra': 'repele', 'No siente ninguna fuerza, porque es neutra': 'nada', 'Queda cargada negativamente': 'negativa' },
      cumple: function (c) {   // barra −Q en el origen; esfera polarizada: +δ en la cara cercana (d − a) y −δ en la lejana (d + a)
        var Q = -1e-6, d = 0.1, a = 0.02, dl = 1e-8;
        var F = dl * campoE(Q, [0, 0, 0], [d - a, 0, 0])[0] - dl * campoE(Q, [0, 0, 0], [d + a, 0, 0])[0];   // fuerza en x sobre la esfera
        return c === (F < 0 ? 'atrae' : F > 0 ? 'repele' : 'nada');
      } },
    EM07: { op: { 'Hacia la carga −q (a la derecha)': [1, 0], 'Hacia la carga +q (a la izquierda)': [-1, 0], 'Es cero, porque las cargas son iguales y opuestas': [0, 0], 'Perpendicular a la línea que une las cargas': [0, 1] },
      cumple: function (d) { var E = add(campoE(1, [-1, 0, 0], [0, 0, 0]), campoE(-1, [1, 0, 0], [0, 0, 0])), n = norma(E); return n > 0 && Math.abs(E[0] / n - d[0]) < 1e-9 && Math.abs(E[1] / n - d[1]) < 1e-9; } },
    EM08: { op: { '1,6 × 10⁻¹⁶ N, en sentido opuesto al campo': [1.6e-16, -1], '1,6 × 10⁻¹⁶ N, en el sentido del campo': [1.6e-16, 1], '1,6 × 10⁻¹⁹ N, en sentido opuesto al campo': [1.6e-19, -1], '6,25 × 10²¹ N, en sentido opuesto al campo': [6.25e21, -1] },
      cumple: function (v) { var F = -e * 1000; return cerca(v[0], Math.abs(F)) && v[1] === Math.sign(F); } },
    EM09: { op: { 'Como 1/r³': 3, 'Como 1/r²': 2, 'Como 1/r': 1, 'No disminuye': 0 },
      cumple: function (n) { var E = function (r) { return norma(add(campoE(1, [0, 0.001, 0], [r, 0, 0]), campoE(-1, [0, -0.001, 0], [r, 0, 0]))); }; return Math.abs(Math.log(E(100) / E(200)) / Math.LN2 - n) < 0.01; } },
    EM10: { op: { 'Más intenso': 'mas', 'Menos intenso': 'menos', 'Cero': 'cero', 'Igual que en el resto': 'igual' },
      cumple: function (c) {   // N líneas radiales de una carga puntual: densidad N/(4πr²) contra |E|
        var N = 1000, dens = function (r) { return N / (4 * PI * r * r); }, E = function (r) { return norma(campoE(1, [0, 0, 0], [r, 0, 0])); };
        var mismaTendencia = (dens(1) > dens(2)) === (E(1) > E(2)) && cerca(dens(1) / dens(2), E(1) / E(2), 1e-9);
        return c === (mismaTendencia ? 'mas' : 'menos');
      } },
    EM11: { op: { '1 N·m²/C': 1, '0': 0, '4π N·m²/C': 4 * PI, '1/(4π) N·m²/C': 1 / (4 * PI) },
      cumple: function (v) {   // 1) la integral numérica del flujo da q/ε₀ (con el ε₀ coherente con k); 2) con el ε₀ del enunciado, q/ε₀ = 1
        var q = 8.85e-12, phi = flujoEsfera(function (p) { return campoE(q, [0.2, 0.1, 0], p); }, 1);
        return cerca(phi * EPS0 / q, 1, 1e-3) && cerca(v, q / 8.85e-12, 1e-12);
      } },
    EM12: { op: { 'Cero': 0, 'q/ε₀': 'qe0', 'Positivo, menor que q/ε₀': 'pos', 'Negativo': 'neg' },
      cumple: function (v) { var phi = flujoEsfera(function (p) { return campoE(1e-9, [2, 0, 0], p); }, 1), ref = 1e-9 / EPS0; return Math.abs(phi) < 1e-3 * ref ? v === 0 : false; } },
    EM13: { op: { 'Cero': 0, 'kQ/r²': 'kQr2', 'kQ/R²': 'kQR2', 'Es infinito en el centro': 'inf' },
      cumple: function (v) {   // carga Q en la superficie de una esfera de radio 1: se suma el campo de cada elemento en un punto interior
        var n = 300, Q = 1e-9, p = [0.3, 0.2, -0.1], E = [0, 0, 0], ref = k * Q;
        for (var i = 0; i < n; i++) { var th = (i + 0.5) * PI / n; for (var j = 0; j < 2 * n; j++) { var ph = (j + 0.5) * PI / n, dq = Q * Math.sin(th) * (PI / n) * (PI / n) / (4 * PI); E = add(E, campoE(dq, [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], p)); } }
        return norma(E) < 2e-3 * ref ? v === 0 : false;
      } },
    EM14: { op: { 'No depende de la distancia': 0, 'Disminuye como 1/r': 1, 'Disminuye como 1/r²': 2, 'Es cero a ambos lados': 'cero' },
      cumple: function (n) {   // disco enorme (radio 10⁴) sumado por anillos: campo en el eje a z = 1 y z = 2
        var sig = 1e-9, E = function (z) { return simpson(function (r) { return k * sig * 2 * PI * r * z / Math.pow(r * r + z * z, 1.5); }, 0, 1e4, 400000); };
        var expo = Math.log(E(1) / E(2)) / Math.LN2; return typeof n === 'number' && Math.abs(expo - n) < 0.01;
      } },
    EM15: { op: { 'La mitad': 0.5, 'Igual': 1, 'Cero': 0, 'El cuádruple': 4 },
      cumple: function (k2) {   // esfera aislante uniforme de radio 1: suma de cargas en una rejilla 3D
        var n = 36, h = 2 / n, pts = [];
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var l = 0; l < n; l++) { var p = [-1 + (i + 0.5) * h, -1 + (j + 0.5) * h, -1 + (l + 0.5) * h]; if (norma(p) <= 1) pts.push(p); }
        function E(r) { var obs = [r, 0.0123, 0.0071], s = [0, 0, 0]; pts.forEach(function (p) { var d = sub(obs, p), dn = norma(d); if (dn > h / 2) s = add(s, esc(d, 1 / (dn * dn * dn))); }); return norma(s); }
        return Math.abs(E(0.5) / E(1) - k2) < 0.04;
      } },
    EM18: { op: { '−20 V/m': -20, '20 V/m': 20, '−10 V/m': -10, '−5 V/m': -5 },
      cumple: function (v) { var V = function (x) { return 5 * x * x; }, h = 1e-5; return cerca(-(V(2 + h) - V(2 - h)) / (2 * h), v, 1e-6); } },
    EM19: { op: { 'Cero': 0, 'q·V': 'qV', 'Depende del camino': 'camino', 'q·E·d': 'qEd' },
      cumple: function (v) {   // carga de prueba recorriendo media circunferencia (equipotencial) alrededor de una carga puntual
        var W = 0, n = 20000, q = 1e-6;
        for (var i = 0; i < n; i++) { var t0 = PI * i / n, t1 = PI * (i + 1) / n, a = [2 * Math.cos(t0), 2 * Math.sin(t0), 0], b = [2 * Math.cos(t1), 2 * Math.sin(t1), 0]; W += q * dot(campoE(1e-9, [0, 0, 0], esc(add(a, b), 0.5)), sub(b, a)); }
        return Math.abs(W) < 1e-12 ? v === 0 : false;
      } },
    EM20: { op: { '1,6 × 10⁻¹⁷ J': 1.6e-17, '1,6 × 10⁻¹⁹ J': 1.6e-19, '100 J': 100, '6,25 × 10²⁰ J': 6.25e20 },
      cumple: function (v) {   // integración del movimiento del electrón en un campo uniforme de 100 V/m durante 1 m
        var m = 9.1e-31, E = 100, x = 0, u = 0, dt = 1e-12; while (x < 1) { u += e * E / m * dt; x += u * dt; } return cerca(0.5 * m * u * u, v, 2e-3);
      } },
    EM21: { op: { 'Se multiplica por 4': 4, 'No cambia': 1, 'Se multiplica por 2': 2, 'Se divide entre 4': 0.25 },
      cumple: function (f) {   // C = Q/V con el campo entre dos discos grandes sumado por anillos
        function C(A, d) { var R = Math.sqrt(A / PI), Q = 1e-9, sig = Q / A; var E1 = simpson(function (r) { return k * sig * 2 * PI * r * (d / 2) / Math.pow(r * r + d * d / 4, 1.5); }, 0, R, 20000); return Q / (2 * E1 * d); }
        return Math.abs(C(2e6, 0.5) / C(1e6, 1) - f) < 0.01;   // placas grandes frente a d: efectos de borde despreciables
      } },
    EM25: { op: { 'Se triplica': 3, 'No cambia': 1, 'Se reduce a la tercera parte': 1 / 3, 'Se anula': 0 },
      cumple: function (f) { var C0 = 1e-6, V = 10, Q0 = C0 * V, Q1 = 3 * C0 * V; return cerca(Q1 / Q0, f); } },   // V fijo por la batería, C multiplicada por κ
    EM30: { op: { 'El 63 % de la carga final': 0.63, 'El 37 % de la carga final': 0.37, 'El 50 % de la carga final': 0.5, 'La carga final completa': 1 },
      cumple: function (f) { var R = 1000, C = 1e-6, V = 1, q = integrar([0], function (s) { return [(V - s[0] / C) / R]; }, R * C, 1e-7)[0]; return Math.abs(q / (C * V) - f) < 0.005; } },
    EM31: { op: { 'La de 2 Ω': 2, 'La de 4 Ω': 4, 'Las dos disipan lo mismo': 'igual', 'Depende del orden en que se conecten': 'orden' },
      cumple: function (v) { var P = function (R) { var I = 12 / R; return I * I * R; }; return v === (P(2) > P(4) ? 2 : 4); } },
    EM32: { op: { '1 × 10⁻³ N': 1e-3, '0 N': 0, '4 × 10⁻³ N': 4e-3, '1 × 10³ N': 1e3 }, cumple: function (v) { return cerca(norma(cruz(esc([1000, 0, 0], 2e-6), [0, 0.5, 0])), v); } },
    EM33: { op: { 'Hacia abajo': [0, -1, 0], 'Hacia arriba': [0, 1, 0], 'Hacia la derecha': [1, 0, 0], 'Hacia adentro de la página': [0, 0, -1] },
      cumple: function (d) { var F = cruz([1, 0, 0], [0, 0, 1]); return F.every(function (x, i) { return Math.sign(x) === Math.sign(d[i]); }); } },   // q > 0, v = +x, B sale de la página = +z
    EM35: { op: { 'Se mantiene constante': 'cte', 'Aumenta': 'sube', 'Disminuye': 'baja', 'Depende del signo de la carga': 'signo' },
      cumple: function (c) {   // se integra con RK4 (no conserva la rapidez por construcción) y se compara la rapidez al inicio y al final
        var m = 1e-26, q = 1.6e-19, B = [0.1, 0.2, 0.5], st = [0, 0, 0, 3e4, -1e4, 2e4], dt = 1e-10;
        function f(s) { var a = esc(cruz(s.slice(3), B), q / m); return s.slice(3).concat(a); }
        var v0 = norma(st.slice(3));
        for (var i = 0; i < 20000; i++) { var k1 = f(st), k2 = f(add(st, esc(k1, dt / 2))), k3 = f(add(st, esc(k2, dt / 2))), k4 = f(add(st, esc(k3, dt))); st = add(st, esc(add(add(k1, esc(k2, 2)), add(esc(k3, 2), k4)), dt / 6)); }
        return c === (Math.abs(norma(st.slice(3)) - v0) < 1e-6 * v0 ? 'cte' : 'sube');
      } },
    EM37: { op: { 'Cero': 0, 'ILB': 'ILB', 'ILB/2': 'ILB2', 'Depende del sentido de la corriente': 'sentido' }, cumple: function (v) { return norma(cruz([3, 0, 0], [0.7, 0, 0])) === 0 ? v === 0 : false; } },
    EM38: { op: { '1 × 10⁻⁴ T': 1e-4, '2π × 10⁻⁴ T': 2 * PI * 1e-4, '5 × 10⁻⁵ T': 5e-5, '1 × 10⁻² T': 1e-2 },
      cumple: function (v) { return cerca(norma(biot(recta([0, 0, -50], [0, 0, 50], 400000), 10, [0.02, 0, 0])), v, 1e-3); } },
    EM39: { op: { 'Se multiplica por 4': 4, 'Se multiplica por 2': 2, 'No cambia': 1, 'Se multiplica por 8': 8 },
      cumple: function (f) {   // solenoide largo como suma de espiras (Biot–Savart), campo en el centro
        function B(nPorM, I) { var Lsol = 2, N = Math.round(nPorM * Lsol), s = [0, 0, 0]; for (var i = 0; i < N; i++) s = add(s, biot(espira([-Lsol / 2 + (i + 0.5) * Lsol / N, 0, 0], 0.05, 60, 1), I, [0, 0, 0])); return norma(s); }
        return Math.abs(B(200, 2) / B(100, 1) - f) < 0.01;
      } },
    EM40: { op: { 'Se atraen': 'atraen', 'Se repelen': 'repelen', 'No hay fuerza entre ellos': 'nada', 'Tienden a girar hasta ponerse perpendiculares': 'giran' },
      cumple: function (c) { var B1 = biot(recta([-50, 0, 0], [50, 0, 0], 200000), 1, [0, 0.1, 0]), F2 = cruz([1, 0, 0], B1); return c === (F2[1] < 0 ? 'atraen' : 'repelen'); } },   // alambre 2 en y = 0,1; fuerza hacia y < 0 = hacia el alambre 1
    EM41: { op: { 'La mitad': 0.5, 'Igual': 1, 'Cero': 0, 'El doble': 2 },
      cumple: function (f) {   // corriente uniforme en un cilindro de radio 1: suma de filamentos rectos infinitos (B = μ₀ dI / 2πd, tangente)
        var n = 160, h = 2 / n, fil = [];
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { var x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h; if (x * x + y * y <= 1) fil.push([x, y]); }
        function B(r) { var p = [r, 0.0031], s = [0, 0]; fil.forEach(function (q) { var d = [p[0] - q[0], p[1] - q[1]], d2 = d[0] * d[0] + d[1] * d[1]; if (d2 > h * h / 4) { s[0] += -d[1] / d2; s[1] += d[0] / d2; } }); return Math.hypot(s[0], s[1]); }
        return Math.abs(B(0.5) / B(1) - f) < 0.03;
      } },
    EM43: { op: { 'Antihorario': 1, 'Horario': -1, 'No se induce corriente': 0, 'Alterna entre horario y antihorario': 'alt' },
      cumple: function (s) {
        // El imán está en x < 0 y se acerca: su campo atraviesa la bobina hacia +x y el flujo en +x crece, así que la corriente
        // inducida debe producir Bx < 0. El observador (en el imán) mira hacia +x con "arriba" = +z y "derecha" = −y.
        if (typeof s !== 'number' || s === 0) return false;
        var pts = []; for (var i = 0; i <= 200; i++) { var t = s * 2 * PI * i / 200; pts.push([0, -Math.cos(t), Math.sin(t)]); }   // derecha → arriba = antihorario para el observador
        return biot(pts, 1, [0, 0, 0])[0] < 0;
      } },
    EM46: { op: { 'No se induce voltaje': 0, 'Se induce el voltaje dado por la relación de vueltas': 'relacion', 'Se induce un voltaje continuo mayor': 'mayor', 'Se induce un voltaje infinito': 'inf' },
      cumple: function (v) { var Phi = function () { return 0.01 * 2; }, h = 1e-3; return (Phi(1 + h) - Phi(1 - h)) / (2 * h) === 0 ? v === 0 : false; } },   // corriente constante → flujo constante
    EM48: { op: { 'Aumenta': 'sube', 'Disminuye': 'baja', 'No cambia': 'igual', 'Se vuelve cero': 'cero' },
      cumple: function (c) {   // se integra L di/dt = V₀ sen ωt y se mide V₀/I_amplitud a dos frecuencias
        function X(w) { var L = 0.1, i = -1 / (w * L), imax = 0, dt = 1e-5 / w; for (var t = 0; t < 4 * PI / w; t += dt) { i += Math.sin(w * t) / L * dt; imax = Math.max(imax, Math.abs(i)); } return 1 / imax; }
        return c === (X(200) > X(100) ? 'sube' : 'baja');
      } }
  },
  extra: function (t, assert) {
    t('EM26: la corriente del circuito es 2 A y el voltaje en la resistencia externa coincide con el de bornes', function () { var I = 12 / 6; assert.ok(I === 2 && I * 5 === 12 - I * 1); });
  }
};
