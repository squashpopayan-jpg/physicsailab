(function (root) {
  'use strict';
  const EM = root.EM, C = EM.calc, K = C.K;
  /* Caída de una esfera con resistencia cuadrática y empuje. Devuelve tiempo para caer h, velocidad terminal. */
  C.fallSphere = function (rhoB, rhoM, d, h, Cd) {
    Cd = Cd || 0.47;
    const a = K.g * (1 - rhoM / rhoB);
    const k = (3 * rhoM * Cd) / (4 * rhoB * d);
    if (a <= 0) return { t: Infinity, vt: 0, a, k };
    const vt = Math.sqrt(a / k);
    if (k < 1e-12) return { t: Math.sqrt((2 * h) / a), vt, a, k };
    const t = Math.acosh(Math.exp(k * h)) / Math.sqrt(a * k);
    return { t, vt, a, k };
  };
  /* Integración RK4 de la caída (comprobación independiente) */
  C.fallSphereRK4 = function (rhoB, rhoM, d, h, Cd, dt) {
    Cd = Cd || 0.47; dt = dt || 1e-4;
    const a = K.g * (1 - rhoM / rhoB), k = (3 * rhoM * Cd) / (4 * rhoB * d);
    let x = 0, v = 0, t = 0;
    const f = (v) => a - k * v * v;
    while (x < h && t < 1e4) {
      const k1 = f(v), k2 = f(v + 0.5 * dt * k1), k3 = f(v + 0.5 * dt * k2), k4 = f(v + dt * k3);
      const vn = v + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      x += 0.5 * (v + vn) * dt; v = vn; t += dt;
    }
    return t;
  };
  /* Sólidos platónicos: vértices, aristas (pares de distancia mínima) y número de caras por Euler */
  C.platonic = function (name) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let V = [];
    if (name === 'tetraedro') V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    else if (name === 'cubo') for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
    else if (name === 'octaedro') V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    else if (name === 'icosaedro') for (const a of [-1, 1]) for (const b of [-phi, phi]) V.push([0, a, b], [a, b, 0], [b, 0, a]);
    else if (name === 'dodecaedro') {
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
      for (const a of [-1, 1]) for (const b of [-1, 1]) V.push([0, a / phi, b * phi], [a / phi, b * phi, 0], [b * phi, 0, a / phi]);
    }
    let dmin = Infinity;
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) dmin = Math.min(dmin, Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]));
    const E = [];
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (Math.abs(Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]) - dmin) < 1e-9) E.push([i, j]);
    return { V, E, F: 2 - V.length + E.length };
  };
  /* Esferas homocéntricas de Eudoxo: dos esferas con ejes inclinados un ángulo alpha y giros opuestos.
     Devuelve longitud y latitud (grados) en el tiempo t (días), con deriva zodiacal de periodo P. */
  C.eudoxus = function (alpha, S, P, t) {
    const V = { rot: C.rot }, w = (2 * Math.PI) / S, W = (2 * Math.PI) / P;
    const a3 = [1, 0, 0], a4 = [Math.cos(alpha), 0, Math.sin(alpha)], p0 = [0, 1, 0];
    const p = V.rot(V.rot(p0, a4, -w * t), a3, w * t);
    const lon = Math.atan2(p[1], p[0]) - Math.PI / 2 + W * t;
    return { lon: (lon * 180) / Math.PI, lat: (Math.asin(Math.max(-1, Math.min(1, p[2]))) * 180) / Math.PI };
  };
  /* Ancho del arco retrógrado (grados) y latitud máxima para un ángulo alpha */
  C.eudoxusStats = function (alpha, S, P) {
    const N = 1440, dt = S / N;
    let lat = 0, arc = 0, run = 0, prev = C.eudoxus(alpha, S, P, 0).lon, retro = false;
    for (let i = 1; i <= 2 * N; i++) {
      const q = C.eudoxus(alpha, S, P, i * dt);
      const d = q.lon - prev; prev = q.lon;
      lat = Math.max(lat, Math.abs(q.lat));
      if (d < 0) { run += -d; retro = true; if (run > arc) arc = run; } else run = 0;
    }
    return { arc: retro ? arc : 0, lat };
  };
  C.PLANETS = {
    saturno: { n: 'Saturno', S: 378.09, P: 10759.2, arc: 6.8 },
    jupiter: { n: 'Júpiter', S: 398.88, P: 4332.6, arc: 9.9 },
    marte: { n: 'Marte', S: 779.94, P: 686.98, arc: 15.7 },
    venus: { n: 'Venus', S: 583.92, P: 365.256, arc: 15.8 }
  };
})(typeof window !== 'undefined' ? window : global);
