/* Verificación independiente del banco de Vibraciones y ondas.
   - Osciladores (resorte, péndulo, amortiguado, forzado, acoplados, varilla): integración RK4 y medida de periodos.
   - Cuerdas: cadena de masas y resortes o diferencias finitas de la ecuación de onda (rapidez, reflexión, cruce de pulsos).
   - Doppler y Mach: se simulan los frentes de onda y se miden tiempos de llegada.
   - Ecuación de onda: residuos numéricos de ∂²y/∂t² − v² ∂²y/∂x². */
'use strict';
var PI = Math.PI;
function cerca(a, b, tol) { if (typeof a !== 'number' || typeof b !== 'number') return false; return Math.abs(a - b) <= (tol || 1e-6) * Math.max(Math.abs(a), Math.abs(b), 1e-300); }
function rk4(f, y, dt) { var k1 = f(y), k2 = f(y.map(function (v, i) { return v + k1[i] * dt / 2; })), k3 = f(y.map(function (v, i) { return v + k2[i] * dt / 2; })), k4 = f(y.map(function (v, i) { return v + k3[i] * dt; })); return y.map(function (v, i) { return v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6; }); }
/* Periodo medido entre cruces por cero hacia abajo de la coordenada 0. */
function periodo(f, y0, dt, tmax) { var y = y0, t = 0, cruces = []; while (t < tmax && cruces.length < 3) { var y2 = rk4(f, y, dt); if (y[0] > 0 && y2[0] <= 0) cruces.push(t + dt * y[0] / (y[0] - y2[0])); y = y2; t += dt; } return (cruces[2] - cruces[0]) / 2; }
/* Amplitud estacionaria de un oscilador forzado x'' + b x' + w0² x = cos(w t). */
function amplitudForzada(w, b, w0) { var y = [0, 0], dt = 0.01, t = 0, amax = 0, f = function (s) { return [s[1], -b * s[1] - w0 * w0 * s[0] + Math.cos(w * t)]; }; while (t < 400) { y = rk4(f, y, dt); t += dt; if (t > 300) amax = Math.max(amax, Math.abs(y[0])); } return amax; }
/* Cadena de N masas (μ·dx) unidas con tensión T: rapidez de un pulso medida por el avance de su máximo. */
function rapidezCadena(T, mu) { var N = 800, dx = 0.01, m = mu * dx, y = [], v = []; for (var i = 0; i < N; i++) { y.push(Math.exp(-Math.pow((i - 200) / 15, 2))); v.push(0); }
  var c0 = Math.sqrt(T / mu), dt = 0.2 * dx / c0;   // se lanza un pulso hacia +x dándole la velocidad de una onda viajera de prueba
  for (i = 1; i < N - 1; i++) v[i] = -c0 * (y[i + 1] - y[i - 1]) / (2 * dx);
  function pico() { var b = 0; for (var j = 1; j < N; j++) if (y[j] > y[b]) b = j; return b * dx; }
  var x0 = pico(), t = 0;
  while (t < 2 / c0) { var a = []; for (i = 1; i < N - 1; i++) a[i] = T * (y[i + 1] - 2 * y[i] + y[i - 1]) / (dx * dx) / mu; for (i = 1; i < N - 1; i++) { v[i] += a[i] * dt; y[i] += v[i] * dt; } t += dt; }
  return (pico() - x0) / t; }
/* Ecuación de onda en una cuerda por diferencias finitas con Courant 1 (exacta para ondas sin dispersión). */
function cuerdaFD(y0, v0dir, pasos) { var N = y0.length, prev = y0.slice(), cur = y0.slice(); // v0dir = +1: el pulso viaja hacia +x (el estado previo estaba un paso a la izquierda)
  if (v0dir) { prev = y0.map(function (_, i) { return y0[Math.min(N - 1, Math.max(0, i + v0dir))]; }); }
  var hist = [cur.slice()];
  for (var s = 0; s < pasos; s++) { var nx = cur.map(function (_, i) { return (i === 0 || i === N - 1) ? 0 : cur[i + 1] + cur[i - 1] - prev[i]; }); prev = cur; cur = nx; hist.push(cur.slice()); }
  return hist; }
/* Doppler: la fuente emite un frente cada T y se miden los tiempos de llegada al observador (todo en 1D). */
function doppler(f, vs, vo, c) { var T = 1 / f, llegadas = [];
  for (var n = 0; n < 6; n++) { var te = n * T, xs = 0 + vs * te;   // fuente parte de x = 0 hacia +x; observador parte de x = 1000 hacia −x (vo > 0 = se acerca)
    var lo = te, hi = te + 100; for (var it = 0; it < 200; it++) { var mid = (lo + hi) / 2, xo = 1000 - vo * mid, frente = xs + c * (mid - te); if (frente < xo) lo = mid; else hi = mid; } llegadas.push(lo); }
  return 1 / ((llegadas[5] - llegadas[0]) / 5); }

module.exports = {
  minFiguras: 14,
  esperado: {
    VO01: periodo(function (s) { return [s[1], -50 / 0.5 * s[0]]; }, [0.05, 0], 1e-4, 10),
    VO02: periodo(function (s) { return [s[1], -10 / 2.5 * Math.sin(s[0])]; }, [0.001, 0], 1e-4, 20),
    VO04: (function () { var m = 0, h = 1e-6; for (var t = 0; t < 1; t += 1e-4) { var x = function (s) { return 0.1 * Math.cos(20 * s); }; m = Math.max(m, Math.abs((x(t + h) - x(t - h)) / (2 * h))); } return m; })(),
    VO07: (function () {   // oscilador amortiguado cuya amplitud se divide entre 2 cada 2 s: se mide el pico más cercano a t = 6 s
      var g = Math.LN2 / 2, w = 2 * PI / 0.8, y = [8, 0], t = 0, dt = 1e-4, picos = [], prev = 0, prev2 = 0;
      while (t < 6.5) { y = rk4(function (s) { return [s[1], -2 * g * s[1] - (w * w + g * g) * s[0]]; }, y, dt); t += dt; var a = Math.abs(y[0]); if (prev > a && prev > prev2) picos.push([t - dt, prev]); prev2 = prev; prev = a; }
      var p = picos.reduce(function (b, q) { return Math.abs(q[0] - 6) < Math.abs(b[0] - 6) ? q : b; });
      return p[1] * Math.pow(0.5, (6 - p[0]) / 2);   // se lleva la envolvente del pico (t ≈ 6) exactamente a t = 6
    })(),
    VO17: (function () { for (var x = 0.01; x < 10; x += 1e-5) if (Math.abs(Math.sin(4 * x)) < 1e-4 && Math.cos(4 * x) > 0) return x; })(),
    VO18: 0.5 * 40,
    VO19: (function () { var mejor = 1e9, sm = 0, g = function (x) { return Math.sin(2 * PI * (x - 1) / 4); }; for (var s = 0.01; s < 3.99; s += 1e-3) { var err = 0; for (var x = 0; x < 8; x += 0.05) err += Math.pow(Math.sin(2 * PI * (x - s) / 4) - g(x), 2); if (err < mejor) { mejor = err; sm = s; } } return sm / 0.5; })(),
    VO22: rapidezCadena(100, 0.01),
    VO28: (function () {   // se cuentan los mínimos de la envolvente de cos(2π·440t) + cos(2π·444t) en 2 s
      var dt = 1e-5, env = [], w = Math.round((1 / 440) / dt);
      for (var t = 0; t < 2; t += w * dt) { var m = 0; for (var j = 0; j < w; j++) { var s = t + j * dt; m = Math.max(m, Math.abs(Math.cos(2 * PI * 440 * s) + Math.cos(2 * PI * 444 * s))); } env.push(m); }
      var minimos = 0; for (var i = 1; i < env.length - 1; i++) if (env[i] < env[i - 1] && env[i] <= env[i + 1] && env[i] < 0.5) minimos++; return minimos / 2;
    })(),
    VO31: (function () { var m = 0; for (var t = 0; t < 1; t += 1e-4) m = Math.max(m, Math.abs(3 * Math.sin(10 * t) + 4 * Math.sin(10 * t))); return m; })(),
    VO32: (function () { var N = 201, L = 1, v = 200, dx = L / (N - 1), dt = dx / v, y0 = []; for (var i = 0; i < N; i++) y0.push(Math.sin(PI * i / (N - 1))); var h = cuerdaFD(y0, 0, 1200, true), mid = (N - 1) / 2, cr = []; for (var s = 1; s < h.length; s++) if (h[s - 1][mid] > 0 && h[s][mid] <= 0) cr.push(s); return 1 / ((cr[1] - cr[0]) * dt); })(),
    VO33: (function () { var c = 0, f = function (x) { return Math.abs(Math.sin(3 * PI * x)); }; for (var x = 0.001; x < 0.999; x += 0.001) if (f(x) > f(x - 0.001) && f(x) >= f(x + 0.001)) c++; return c; })(),
    VO35: (function () { var L = 0.85, v = 340; for (var k = 0.01; k < 20; k += 1e-5) if (Math.cos(k * L) <= 0) return v * k / (2 * PI); })(),   // nodo de desplazamiento en x = 0 (sen kx) y vientre en x = L (cos kL = 0)
    VO37: (function () { var c = 0; for (var i = 0; i <= 1000; i++) if (Math.abs(Math.sin(PI * i / 1000)) < 1e-9) c++; return c; })(),
    VO38: 10 * Math.log10(100),
    VO40: 340 / 680,
    VO42: Math.pow(10, (80 - 60) / 10),
    VO44: doppler(700, 85, 0, 340),
    VO45: doppler(500, 0, 85, 340),
    VO46: (function () { var vs = 2 * 340, c = 340, t = 1, s = 0; [0.2, 0.5, 0.8].forEach(function (te) { var r = c * (t - te), d = vs * t - vs * te; s += Math.asin(r / d) * 180 / PI; }); return s / 3; })()
  },
  valores: {
    VO03: { op: { 'A = 0,2 m y T = 4 s': [0.2, 4], 'A = 0,4 m y T = 4 s': [0.4, 4], 'A = 0,2 m y T = 2 s': [0.2, 2], 'A = 0,4 m y T = 2 s': [0.4, 2] },
      cumple: function (v) { var x = function (t) { return 0.2 * Math.cos(2 * PI * t / 4); }, A = 0, max = []; for (var t = 0; t < 8.0001; t += 1e-3) { A = Math.max(A, Math.abs(x(t))); if (x(t) >= x(t - 1e-3) && x(t) >= x(t + 1e-3)) max.push(t); } return cerca(A, v[0], 1e-6) && cerca(max[1] - max[0], v[1], 1e-3); } },
    VO05: { op: { 'Se multiplica por 4': 4, 'Se multiplica por 2': 2, 'No cambia': 1, 'Se multiplica por 8': 8 },
      cumple: function (k) { function E(A) { var y = [A, 0], m = 1, kk = 9; for (var i = 0; i < 1000; i++) y = rk4(function (s) { return [s[1], -kk / m * s[0]]; }, y, 1e-3); return 0.5 * m * y[1] * y[1] + 0.5 * kk * y[0] * y[0]; } return cerca(E(0.2) / E(0.1), k, 1e-6); } },
    VO06: { op: { 'En x = 0, moviéndose hacia −x': [0, -1], 'En x = 0,05 m, en reposo': [0.05, 0], 'En x = 0, moviéndose hacia +x': [0, 1], 'En x = −0,05 m, en reposo': [-0.05, 0] },
      cumple: function (v) { var x = function (t) { return 0.05 * Math.cos(10 * t + PI / 2); }, h = 1e-6, vel = (x(h) - x(-h)) / (2 * h); return Math.abs(x(0) - v[0]) < 1e-9 && Math.sign(Math.round(vel * 1e6)) === v[1]; } },
    VO08: { op: { 'Cerca de la frecuencia natural del sistema': 'natural', 'Para frecuencias muy bajas': 'baja', 'Para frecuencias muy altas': 'alta', 'Para el doble de la frecuencia natural': 'doble' },
      cumple: function (c) { var w0 = 1, b = 0.1, mejor = 0, wm = 0; [0.2, 0.5, 0.8, 0.95, 1, 1.05, 1.2, 1.5, 2, 3].forEach(function (w) { var a = amplitudForzada(w, b, w0); if (a > mejor) { mejor = a; wm = w; } }); return c === (Math.abs(wm - w0) < 0.1 ? 'natural' : wm < 0.5 ? 'baja' : wm > 1.5 ? (Math.abs(wm - 2) < 0.1 ? 'doble' : 'alta') : 'otro'); } },
    VO09: { op: { 'Vuelve al equilibrio sin oscilar y lo más rápido posible': 'critico', 'Oscila con amplitud que disminuye': 'sub', 'Nunca regresa al equilibrio': 'nunca', 'Oscila indefinidamente': 'siempre' },
      cumple: function (c) {
        function sim(b) { var y = [1, 0], t = 0, dt = 1e-3, cruza = false, t1 = null; while (t < 30) { y = rk4(function (s) { return [s[1], -b * s[1] - s[0]]; }, y, dt); t += dt; if (y[0] < 0) cruza = true; if (t1 === null && Math.abs(y[0]) < 0.01 && Math.abs(y[1]) < 0.05) t1 = t; } return { cruza: cruza, t: t1 }; }
        var crit = sim(2), sobre = sim(4);   // b = 2√(km) con k = m = 1
        return c === (!crit.cruza && crit.t !== null && crit.t < sobre.t ? 'critico' : 'otro');
      } },
    VO10: { op: { 'Se hace más alto y más angosto': 'alto', 'Se hace más bajo y más ancho': 'bajo', 'No cambia': 'igual', 'Desaparece': 'nada' },
      cumple: function (c) {
        function curva(b) { var ws = [], as = []; for (var w = 0.7; w <= 1.3001; w += 0.03) { ws.push(w); as.push(amplitudForzada(w, b, 1)); } var mx = Math.max.apply(null, as), ancho = ws.filter(function (_, i) { return as[i] > mx / Math.SQRT2; }).length; return { alto: mx, ancho: ancho }; }
        var mucho = curva(0.2), poco = curva(0.1);
        return c === (poco.alto > mucho.alto && poco.ancho < mucho.ancho ? 'alto' : 'otro');
      } },
    VO11: { op: { 'A₀/e ≈ 0,37 A₀': Math.exp(-1), 'A₀/2': 0.5, '0': 0, 'A₀/4': 0.25 },
      cumple: function (v) { var a = 1, dt = 1e-5; for (var t = 0; t < 2 - 1e-12; t += dt) a -= a / 2 * dt; return Math.abs(a - v) < 1e-4; } },   // dA/dt = −A/τ integrado
    VO12: { op: { 'Se divide entre √2': 1 / Math.SQRT2, 'Se duplica': 2, 'Se reduce a la mitad': 0.5, 'Se multiplica por √2': Math.SQRT2 },
      cumple: function (r) { var m = 1, k = 4, T1 = periodo(function (s) { return [s[1], -k / m * s[0]]; }, [0.1, 0], 1e-4, 20), T2 = periodo(function (s) { return [s[1], -(k * s[0] + k * s[0]) / m]; }, [0.1, 0], 1e-4, 20); return cerca(T2 / T1, r, 1e-4); } },   // dos resortes tiran a la vez de la masa
    VO13: { op: { 'k/2': 0.5, '2k': 2, 'k': 1, 'k/4': 0.25 },
      cumple: function (r) {   // dos resortes en cadena con fuerza F en el extremo: se relaja el punto intermedio hasta el equilibrio
        var k = 1, F = 1, x1 = 0, x2 = 0; for (var it = 0; it < 200000; it++) { var f1 = -k * x1 + k * (x2 - x1), f2 = -k * (x2 - x1) + F; x1 += 0.1 * f1; x2 += 0.1 * f2; }
        return cerca(F / x2, r * k, 1e-6);
      } },
    VO14: { op: { 'Menor': 'menor', 'Mayor': 'mayor', 'Igual': 'igual', 'Depende de la masa de la varilla': 'masa' },
      cumple: function (c) {
        var L = 1, g = 10, n = 10000, I = 0, d = 0; for (var i = 0; i < n; i++) { var r = (i + 0.5) * L / n; I += r * r / n; d += r / n; }   // varilla de masa 1 integrada por trozos
        var Tv = periodo(function (s) { return [s[1], -g * d / I * Math.sin(s[0])]; }, [0.01, 0], 1e-4, 20), Tp = periodo(function (s) { return [s[1], -g / L * Math.sin(s[0])]; }, [0.01, 0], 1e-4, 20);
        return c === (Tv < Tp ? 'menor' : Tv > Tp ? 'mayor' : 'igual');
      } },
    VO15: { op: { 'El modo en fase tiene la frecuencia de un péndulo solo y el modo en contrafase una frecuencia mayor': 'correcto', 'El modo en contrafase tiene la frecuencia de un péndulo solo y el modo en fase una mayor': 'invertido', 'Ambos modos tienen la frecuencia de un péndulo solo': 'iguales', 'Ambos modos tienen frecuencias menores que la de un péndulo solo': 'menores' },
      cumple: function (c) {
        var w2 = 1, kap = 0.5, f = function (s) { return [s[2], s[3], -w2 * s[0] - kap * (s[0] - s[1]), -w2 * s[1] - kap * (s[1] - s[0])]; };
        var Ts = periodo(function (s) { return [s[1], -w2 * s[0]]; }, [0.1, 0], 1e-3, 50), Tf = periodo(f, [0.1, 0.1, 0, 0], 1e-3, 50), Tc = periodo(f, [0.1, -0.1, 0, 0], 1e-3, 50);
        return c === (cerca(Tf, Ts, 1e-3) && Tc < Ts ? 'correcto' : 'otro');
      } },
    VO16: { op: { '5 m/s hacia +x': [5, 1], '5 m/s hacia −x': [5, -1], '80 m/s hacia +x': [80, 1], '0,2 m/s hacia +x': [0.2, 1] },
      cumple: function (v) {   // se sigue la posición de un máximo
        var y = function (x, t) { return 0.02 * Math.sin(4 * x - 20 * t); }, pico = function (t, x0) { var b = x0, by = -1; for (var x = x0 - 0.5; x < x0 + 0.5; x += 1e-5) if (y(x, t) > by) { by = y(x, t); b = x; } return b; };
        var x0 = pico(0, PI / 8), x1 = pico(0.01, x0), vel = (x1 - x0) / 0.01;
        return cerca(Math.abs(vel), v[0], 1e-3) && Math.sign(vel) === v[1];
      } },
    VO20: { op: { 'Longitudinal': 'long', 'Transversal': 'trans', 'Transversal y longitudinal a la vez': 'ambas', 'Ni transversal ni longitudinal': 'ninguna' },
      cumple: function (c) { var rho = 1.2, G = 0, B = 1.4e5; var vt = Math.sqrt(G / rho), vl = Math.sqrt(B / rho); return c === (vt === 0 && vl > 0 ? 'long' : 'ambas'); } },   // un gas no resiste el corte (G = 0)
    VO21: { op: { 'Oscila alrededor de su posición de equilibrio mientras la energía avanza': 'oscila', 'Avanza junto con la onda hasta el final de la cuerda': 'avanza', 'Permanece quieto; solo se mueve la energía': 'quieto', 'Se desplaza hacia la fuente': 'retrocede' },
      cumple: function (c) { var N = 600, y0 = []; for (var i = 0; i < N; i++) y0.push(Math.exp(-Math.pow((i - 100) / 12, 2))); var h = cuerdaFD(y0, 1, 300), j = 250, ys = h.map(function (f) { return f[j]; }), mx = Math.max.apply(null, ys);
        return c === (mx > 0.5 && Math.abs(ys[ys.length - 1]) < 1e-3 ? 'oscila' : 'otro'); } },   // el punto j se levanta al pasar el pulso y vuelve a cero: no viaja
    VO23: { op: { 'Se duplica': 2, 'Se cuadruplica': 4, 'Se multiplica por 16': 16, 'No cambia': 1 }, cumple: function (r) { return Math.abs(rapidezCadena(400, 0.01) / rapidezCadena(100, 0.01) - r) < 0.02; } },
    VO24: { op: { 'Se multiplica por 4': 4, 'Se multiplica por 2': 2, 'No cambia': 1, 'Se multiplica por 8': 8 },
      cumple: function (r) { var T = 100, mu = 0.01, k = 2, w = k * Math.sqrt(T / mu); function E(A) { var s = 0, n = 4000, L = 2 * PI / k; for (var i = 0; i < n; i++) { var x = (i + 0.5) * L / n, yt = -A * w * Math.cos(k * x), yx = A * k * Math.cos(k * x); s += (0.5 * mu * yt * yt + 0.5 * T * yx * yx) * L / n; } return s; } return cerca(E(0.02) / E(0.01), r, 1e-9); } },
    VO25: { op: { 'Invertido (hacia abajo)': 'invertido', 'Hacia arriba, igual que llegó': 'igual', 'No regresa: el extremo lo absorbe': 'absorbe', 'Con el doble de altura': 'doble' },
      cumple: function (c) { var N = 400, y0 = []; for (var i = 0; i < N; i++) y0.push(Math.exp(-Math.pow((i - 250) / 10, 2))); var h = cuerdaFD(y0, 1, 330), fin = h[h.length - 1], mn = Math.min.apply(null, fin), mx = Math.max.apply(null, fin);
        return c === (mn < -0.9 && mx < 0.1 ? 'invertido' : mx > 0.9 ? 'igual' : 'absorbe'); } },
    VO26: { op: { 'La frecuencia es la misma y la longitud de onda es menor': ['igual', 'menor'], 'La frecuencia es menor y la longitud de onda es la misma': ['menor', 'igual'], 'La frecuencia y la longitud de onda son mayores': ['mayor', 'mayor'], 'La rapidez es mayor': ['v', 'mayor'] },
      cumple: function (v) { var T = 50, mu1 = 0.01, mu2 = 0.04, f = 20, v1 = Math.sqrt(T / mu1), v2 = Math.sqrt(T / mu2); return v[0] === 'igual' && v[1] === (v2 / f < v1 / f ? 'menor' : 'mayor'); } },   // la fuente fija f
    VO27: { op: { 'Destructiva': 'destructiva', 'Constructiva': 'constructiva', 'Ni constructiva ni destructiva': 'ninguna', 'Constructiva solo para sonidos agudos': 'agudos' },
      cumple: function (c) { function amp(lam) { var k = 2 * PI / lam, m = 0; for (var t = 0; t < 1; t += 1e-4) m = Math.max(m, Math.abs(Math.sin(10 * t) + Math.sin(10 * t - k * lam / 2))); return m; } return c === (amp(0.5) < 1e-6 && amp(0.1) < 1e-6 ? 'destructiva' : 'otro'); } },
    VO29: { op: { 'Al coincidir la cuerda queda plana por un instante y luego cada pulso sigue su camino': 'sigue', 'Se anulan para siempre': 'anulan', 'Rebotan uno contra otro': 'rebotan', 'Forman un pulso del doble de altura': 'doble' },
      cumple: function (c) {
        var N = 600, y0 = []; for (var i = 0; i < N; i++) y0.push(Math.exp(-Math.pow((i - 200) / 12, 2)) - Math.exp(-Math.pow((i - 400) / 12, 2)));
        // el pulso de la izquierda va a +x y el de la derecha a −x: se arma el estado previo desplazando cada uno
        var prev = []; for (i = 0; i < N; i++) prev.push(Math.exp(-Math.pow((i + 1 - 200) / 12, 2)) - Math.exp(-Math.pow((i - 1 - 400) / 12, 2)));
        var cur = y0.slice(), maxCruce = 1, despues = null;
        for (var s = 0; s < 200; s++) { var nx = cur.map(function (_, j) { return (j === 0 || j === N - 1) ? 0 : cur[j + 1] + cur[j - 1] - prev[j]; }); prev = cur; cur = nx; if (s === 99) maxCruce = Math.max.apply(null, cur.map(Math.abs)); }
        despues = Math.max.apply(null, cur.map(Math.abs));
        var pico = cur.indexOf(Math.max.apply(null, cur));
        return c === (maxCruce < 1e-6 && despues > 0.99 && pico > 300 ? 'sigue' : 'otro');   // tras cruzarse, el pulso positivo sigue hacia la derecha
      } },
    VO30: { op: { 'Constructiva': 'constructiva', 'Destructiva': 'destructiva', 'Ni constructiva ni destructiva': 'ninguna', 'Destructiva, porque las distancias son distintas': 'distancias' },
      cumple: function (c) { var k = 2 * PI / 0.5, m = 0; for (var t = 0; t < 1; t += 1e-4) m = Math.max(m, Math.abs(Math.sin(10 * t - k * 3) + Math.sin(10 * t - k * 4))); return c === (Math.abs(m - 2) < 1e-3 ? 'constructiva' : m < 1e-3 ? 'destructiva' : 'ninguna'); } },
    VO34: { op: { 'λ/2': 0.5, 'λ': 1, 'λ/4': 0.25, '2λ': 2 },
      cumple: function (r) { var lam = 1, k = 2 * PI / lam, ceros = []; for (var x = 0; x < 2; x += 1e-5) if (Math.sin(k * x) >= 0 && Math.sin(k * (x + 1e-5)) < 0 || Math.sin(k * x) < 0 && Math.sin(k * (x + 1e-5)) >= 0) ceros.push(x); return cerca(ceros[1] - ceros[0], r * lam, 1e-3); } },
    VO36: { op: { 'Solo los impares (f₁, 3f₁, 5f₁, …)': 'impares', 'Solo los pares': 'pares', 'Todos los armónicos': 'todos', 'Solo el fundamental': 'fundamental' },
      cumple: function (c) { var L = 1, k1 = PI / (2 * L), ok = []; for (var n = 1; n <= 6; n++) if (Math.abs(Math.cos(n * k1 * L)) < 1e-9) ok.push(n); var tipo = ok.join() === '1,3,5' ? 'impares' : ok.join() === '2,4,6' ? 'pares' : ok.length === 6 ? 'todos' : 'otro'; return c === tipo; } },
    VO39: { op: { 'Se divide entre 4': 0.25, 'Se divide entre 2': 0.5, 'No cambia': 1, 'Se divide entre 8': 0.125 },
      cumple: function (r) { function area(R) { var n = 400, s = 0; for (var i = 0; i < n; i++) { var th = (i + 0.5) * PI / n; s += 2 * PI * R * Math.sin(th) * R * PI / n; } return s; } return cerca((1 / area(2)) / (1 / area(1)), r, 1e-4); } },   // potencia repartida sobre esferas
    VO41: { op: { 'Aumenta': 'sube', 'Disminuye': 'baja', 'No cambia': 'igual', 'Depende de la frecuencia del sonido': 'frecuencia' },
      cumple: function (c) { var v = function (T) { return Math.sqrt(1.4 * 8.314 * T / 0.029); }; return c === (v(310) > v(280) ? 'sube' : 'baja'); } },
    VO43: { op: { 'Mayor que la emitida': 'mayor', 'Menor que la emitida': 'menor', 'Igual a la emitida': 'igual', 'Mayor solo si el observador también se mueve': 'ambos' },
      cumple: function (c) { var f = doppler(500, 40, 0, 340); return c === (f > 500 ? 'mayor' : f < 500 ? 'menor' : 'igual'); } },
    VO47: { op: { 'y = sen(x − 2t)': function (x, t) { return Math.sin(x - 2 * t); }, 'y = sen(x) + 2t': function (x, t) { return Math.sin(x) + 2 * t; }, 'y = sen(2x − t)': function (x, t) { return Math.sin(2 * x - t); }, 'y = e^(−t) sen x': function (x, t) { return Math.exp(-t) * Math.sin(x); } },
      cumple: function (y) { var h = 1e-3; return [[0.3, 0.1], [1.2, 0.7], [-0.8, 2]].every(function (p) { var x = p[0], t = p[1], ytt = (y(x, t + h) - 2 * y(x, t) + y(x, t - h)) / (h * h), yxx = (y(x + h, t) - 2 * y(x, t) + y(x - h, t)) / (h * h); return Math.abs(ytt - 4 * yxx) < 1e-4; }); } },
    VO48: { op: { 'Hacia −x con rapidez 3': [-1, 3], 'Hacia +x con rapidez 3': [1, 3], 'Hacia −x con rapidez 1/3': [-1, 1 / 3], 'Hacia +x con rapidez 1/3': [1, 1 / 3] },
      cumple: function (v) { var f = function (u) { return Math.exp(-u * u); }, pico = function (t) { var b = 0, by = -1; for (var x = -10; x < 10; x += 1e-4) if (f(x + 3 * t) > by) { by = f(x + 3 * t); b = x; } return b; }; var vel = (pico(1) - pico(0)) / 1; return Math.sign(vel) === v[0] && cerca(Math.abs(vel), v[1], 1e-3); } },
    VO49: { op: { 'Cualquier forma que se traslade sin deformarse': 'cualquiera', 'Solo las senoidales': 'senoidales', 'Solo las periódicas': 'periodicas', 'Ninguna': 'ninguna' },
      cumple: function (c) {   // se prueba un pulso gaussiano (no periódico, no senoidal) y una senoidal
        function sol(f) { var v = 2, h = 1e-3; return [[0.3, 0.1], [1.2, 0.7]].every(function (p) { var y = function (x, t) { return f(x - v * t); }, x = p[0], t = p[1]; var ytt = (y(x, t + h) - 2 * y(x, t) + y(x, t - h)) / (h * h), yxx = (y(x + h, t) - 2 * y(x, t) + y(x - h, t)) / (h * h); return Math.abs(ytt - v * v * yxx) < 1e-3; }); }
        var gauss = sol(function (u) { return Math.exp(-u * u); }), seno = sol(Math.sin);
        return c === (gauss && seno ? 'cualquiera' : seno ? 'senoidales' : 'ninguna');
      } },
    VO50: { op: { 'Con la misma rapidez': 'igual', 'Más rápido las de frecuencia alta': 'alta', 'Más rápido las de frecuencia baja': 'baja', 'Con una rapidez que depende de la amplitud': 'amplitud' },
      cumple: function (c) {   // para sen(kx − ωt) en y_tt = v² y_xx, se busca el ω que anula el residuo para k = 1 y k = 5
        var v = 3; function omega(k) { var lo = 0, hi = 100; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2, res = -m * m + v * v * k * k; if (res > 0) lo = m; else hi = m; } return lo; }
        var c1 = omega(1) / 1, c5 = omega(5) / 5; return c === (cerca(c1, c5, 1e-9) ? 'igual' : c5 > c1 ? 'alta' : 'baja');
      } }
  },
  extra: function (t, assert) {
    t('VO44: la simulación de frentes reproduce la fuente en reposo (sin Doppler)', function () { assert.ok(cerca(doppler(700, 0, 0, 340), 700, 1e-9)); });
  }
};
