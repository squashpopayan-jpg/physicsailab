(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const DEG = Math.PI / 180;
  /* Eratóstenes: circunferencia = (360/Δφ)·d, con d en estadios; km con la longitud del estadio */
  C.eratosthenes = function (dphiDeg, dStadia, stadiumM) {
    const circStadia = (360 / dphiDeg) * dStadia;
    const km = (circStadia * stadiumM) / 1000;
    return { circStadia, km, R: km / (2 * Math.PI), err: (km - 40008) / 40008 };
  };
  /* Aristarco: ángulo Luna-Tierra-Sol en la cuadratura -> cociente de distancias Sol/Luna = 1/cos(theta) */
  C.aristarchus = function (thetaDeg) {
    const r = 1 / Math.cos(thetaDeg * DEG);
    return { ratio: r };
  };
  /* Arquímedes: volumen desplazado por una corona de masa m (g) con fracción f de plata en masa */
  C.crown = function (m, f, rhoAu, rhoAg) {
    rhoAu = rhoAu || 19.32; rhoAg = rhoAg || 10.49;
    const V = m * (f / rhoAg + (1 - f) / rhoAu), V0 = m / rhoAu;
    return { V, V0, dV: V - V0 };
  };
  /* Cota de Arquímedes para π con polígonos de 6·2^k lados (circunscritos e inscritos) */
  C.archimedesPi = function (k) {
    let a = 2 * Math.sqrt(3), b = 3; /* semiperimetros circunscrito e inscrito del hexágono, radio 1 */
    for (let i = 0; i < k; i++) { a = (2 * a * b) / (a + b); b = Math.sqrt(a * b); }
    return { lo: b, hi: a, n: 6 * Math.pow(2, k) };
  };
  /* Kepler: anomalía excéntrica y verdadera */
  C.keplerE = function (M, e) {
    let E = M + e * Math.sin(M);
    for (let i = 0; i < 40; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
  };
  C.trueAnomaly = function (M, e) {
    const E = C.keplerE(M, e);
    return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  };
  /* Modelo de Ptolomeo (excéntrica con ecuante): centro a distancia e del Sol, ecuante a qf·e (qf=1 sin ecuante, 2 bisecado) */
  C.equantLongitude = function (M, e, qf) {
    const w = [-(qf - 1) * e, 0], u = [Math.cos(M), Math.sin(M)];
    const wu = w[0] * u[0] + w[1] * u[1], disc = wu * wu - (w[0] * w[0]) + 1;
    const s = -wu + Math.sqrt(disc);
    /* P = Q + s u, con Q = O + w y O = (-e, 0) respecto del Sol */
    const P = [-e + w[0] + s * u[0], w[1] + s * u[1]];
    return Math.atan2(P[1], P[0]);
  };
  C.equantError = function (e, qf, n) {
    n = n || 720; let mx = 0, arr = [];
    for (let i = 0; i <= n; i++) {
      const M = (2 * Math.PI * i) / n;
      let d = C.equantLongitude(M, e, qf) - C.trueAnomaly(M, e);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      arr.push(d / DEG); mx = Math.max(mx, Math.abs(d / DEG));
    }
    return { max: mx, arr };
  };
  /* Precesión: grados acumulados en N años con el valor actual 50.29 s de arco por año */
  C.precession = (years) => (50.29 * years) / 3600;
})(typeof window !== 'undefined' ? window : global);
