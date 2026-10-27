(function (root) {
  'use strict';
  const C = root.EM.calc;
  const PI = Math.PI;
  C.QE = 1.602176634e-19; C.ME = 9.1093837015e-31; C.K_COULOMB = 8.9875517923e9; C.GRAV = 9.80665;
  /* Desintegración radiactiva: N = N0 2^(−t/T) */
  C.decayN = (N0, t, T) => N0 * Math.pow(2, -t / T);
  C.decayConst = (T) => Math.LN2 / T;
  /* Cadena de dos pasos (Bateman): padre λ1 → hijo λ2, con N1(0) = N0, N2(0) = 0 */
  C.bateman2 = function (N0, l1, l2, t) {
    const n1 = N0 * Math.exp(-l1 * t);
    const n2 = l1 === l2 ? N0 * l1 * t * Math.exp(-l1 * t) : (N0 * l1 / (l2 - l1)) * (Math.exp(-l1 * t) - Math.exp(-l2 * t));
    return { n1, n2 };
  };
  /* Thomson 1897: campos cruzados. v = E/B; con solo B la deflexión es θ = eBL/(mv) → e/m = θ E/(B² L) */
  C.thomsonDeflection = (em, E, B, L) => (em * B * B * L) / E;
  C.thomsonEm = (theta, E, B, L) => (theta * E) / (B * B * L);
  /* Millikan: gota de aceite con velocidad de caída vf y de subida vr (m/s) bajo el campo E.
     a = √(9ηvf/(2gΔρ)); q = 6πηa(vf + vr)/E */
  C.millikanRadius = (eta, vf, drho) => Math.sqrt((9 * eta * vf) / (2 * C.GRAV * drho));
  C.millikanCharge = function (eta, vf, vr, E, drho) {
    const a = C.millikanRadius(eta, vf, drho);
    return (6 * PI * eta * a * (vf + vr)) / E;
  };
  /* Dada la carga de n electrones y el campo E, velocidad de subida (inversa del anterior) */
  C.millikanRise = function (eta, vf, q, E, drho) {
    const a = C.millikanRadius(eta, vf, drho);
    return (q * E) / (6 * PI * eta * a) - vf;
  };
  /* Estimación de e a partir de cargas medidas: mínimo de Σ (q/(n e) − 1)² con n entero más próximo, búsqueda sobre e */
  C.fitElementary = function (qs, e0, e1, steps) {
    let best = Infinity, be = e0;
    for (let i = 0; i <= steps; i++) {
      const e = e0 + ((e1 - e0) * i) / steps; let s = 0;
      for (const q of qs) { const n = Math.max(1, Math.round(q / e)); const r = q / (n * e) - 1; s += r * r; }
      if (s < best) { best = s; be = e; }
    }
    return be;
  };
  /* Rutherford: acercamiento mínimo a frente y ángulo de dispersión de Coulomb */
  C.rutherfordD = (Z1, Z2, EeV) => (C.K_COULOMB * Z1 * Z2 * C.QE * C.QE) / (EeV * C.QE);
  C.rutherfordAngle = (b, d) => 2 * Math.atan(d / (2 * b));
  C.rutherfordImpact = (theta, d) => d / (2 * Math.tan(theta / 2));
  /* Sección eficaz diferencial dσ/dΩ = (d/4)² / sen⁴(θ/2) */
  C.rutherfordXS = (theta, d) => (d / 4) * (d / 4) / Math.pow(Math.sin(theta / 2), 4);
  /* Sección eficaz integrada para ángulos mayores que θ: π (d/2)² cot²(θ/2) */
  C.rutherfordXSAbove = (theta, d) => PI * (d / 2) * (d / 2) / Math.pow(Math.tan(theta / 2), 2);
  /* Modelo de Thomson (pudín): deflexión máxima de una partícula α por un átomo de radio R */
  C.pudingMax = (Z, REnergyEv, Rm) => (C.K_COULOMB * Z * C.QE * C.QE) / (Rm * REnergyEv * C.QE);
  /* Trayectoria de Coulomb integrada con RK4 (unidades: d = 1, E → energía, masa reducida unitaria):
     devuelve el ángulo de dispersión para el parámetro de impacto b */
  C.coulombTrajectory = function (b, d, n) {
    n = n || 20000;
    /* r̈ = (d/ (2)) ... con E = ½v² = 1 → v = √2, F/m = d·E/ r² = d/r² (potencial d·E/r) */
    const E = 1, v0 = Math.sqrt(2 * E), X = 400 * d;
    let x = -X, y = b, vx = v0, vy = 0;
    const acc = (x, y) => { const r2 = x * x + y * y, r3 = Math.pow(r2, 1.5); return [(d * E * x) / r3, (d * E * y) / r3]; };
    const dt = (2 * X) / v0 / n;
    for (let i = 0; i < n * 6; i++) {
      const [a1x, a1y] = acc(x, y);
      const x2 = x + 0.5 * dt * vx, y2 = y + 0.5 * dt * vy, vx2 = vx + 0.5 * dt * a1x, vy2 = vy + 0.5 * dt * a1y;
      const [a2x, a2y] = acc(x2, y2);
      const x3 = x + 0.5 * dt * vx2, y3 = y + 0.5 * dt * vy2, vx3 = vx + 0.5 * dt * a2x, vy3 = vy + 0.5 * dt * a2y;
      const [a3x, a3y] = acc(x3, y3);
      const x4 = x + dt * vx3, y4 = y + dt * vy3, vx4 = vx + dt * a3x, vy4 = vy + dt * a3y;
      const [a4x, a4y] = acc(x4, y4);
      x += (dt / 6) * (vx + 2 * vx2 + 2 * vx3 + vx4); y += (dt / 6) * (vy + 2 * vy2 + 2 * vy3 + vy4);
      vx += (dt / 6) * (a1x + 2 * a2x + 2 * a3x + a4x); vy += (dt / 6) * (a1y + 2 * a2y + 2 * a3y + a4y);
      if (x > X) break;
    }
    return Math.atan2(vy, vx);
  };
})(typeof window !== 'undefined' ? window : globalThis);
