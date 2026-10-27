(function (root) {
  'use strict';
  const C = root.EM.calc;
  const DEG = Math.PI / 180, TAU = 2 * Math.PI;
  /* Elementos orbitales medios (JPL, época J2000; órbitas coplanares en esta simulación) */
  C.ELEM = {
    mercurio: { a: 0.38709927, e: 0.20563593, varpi: 77.45779628, L0: 252.25032350, P: 87.969 },
    venus: { a: 0.72333566, e: 0.00677672, varpi: 131.60246718, L0: 181.97909950, P: 224.701 },
    tierra: { a: 1.00000261, e: 0.01671123, varpi: 102.93768193, L0: 100.46457166, P: 365.256363 },
    marte: { a: 1.52371034, e: 0.09339410, varpi: 336.05637041, L0: 355.44656795, P: 686.9797 },
    jupiter: { a: 5.20288700, e: 0.04838624, varpi: 14.72847983, L0: 34.39644051, P: 4332.589 },
    saturno: { a: 9.53667594, e: 0.05386179, varpi: 92.59887831, L0: 49.95424423, P: 10759.22 }
  };
  /* Posición heliocéntrica en el plano de la eclíptica en el instante t (días desde J2000) */
  C.helio = function (el, t) {
    const L = (el.L0 + (360 * t) / el.P) * DEG, vp = el.varpi * DEG;
    const M = L - vp, E = C.keplerE(((M % TAU) + TAU) % TAU, el.e);
    const xp = el.a * (Math.cos(E) - el.e), yp = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    const x = xp * Math.cos(vp) - yp * Math.sin(vp), y = xp * Math.sin(vp) + yp * Math.cos(vp);
    return { x, y, r: Math.hypot(x, y), lam: Math.atan2(y, x) };
  };
  /* Triangulación: intersección de las visuales desde E1 y E2 con longitudes geocéntricas l1, l2 */
  C.triangulate = function (E1, l1, E2, l2) {
    const u1 = [Math.cos(l1), Math.sin(l1)], u2 = [Math.cos(l2), Math.sin(l2)];
    const det = u1[0] * -u2[1] - u1[1] * -u2[0];
    if (Math.abs(det) < 1e-6) return null;
    const bx = E2.x - E1.x, by = E2.y - E1.y;
    const s = (bx * -u2[1] - by * -u2[0]) / det;
    return { x: E1.x + s * u1[0], y: E1.y + s * u1[1], s };
  };
  /* Una determinación de la posición de Marte: dos observaciones separadas por un periodo sideral */
  C.marsFix = function (t0, sigmaRad, rng) {
    const mars = C.ELEM.marte, earth = C.ELEM.tierra;
    const t1 = t0, t2 = t0 + mars.P;
    const E1 = C.helio(earth, t1), E2 = C.helio(earth, t2), M1 = C.helio(mars, t1), M2 = C.helio(mars, t2);
    const g = () => (rng && sigmaRad ? sigmaRad * rng.gauss() : 0);
    const l1 = Math.atan2(M1.y - E1.y, M1.x - E1.x) + g(), l2 = Math.atan2(M2.y - E2.y, M2.x - E2.x) + g();
    const X = C.triangulate(E1, l1, E2, l2);
    const ang = Math.abs(Math.atan2(Math.sin(l1 - l2), Math.cos(l1 - l2)));
    return X && ang > 0.2 ? { x: X.x, y: X.y, r: Math.hypot(X.x, X.y), lam: Math.atan2(X.y, X.x), truth: M1, ang } : null;
  };
  /* Ajuste de circunferencia (Kåsa): mínimos cuadrados lineales */
  C.fitCircle = function (pts) {
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0; const n = pts.length;
    for (const p of pts) { const z = p.x * p.x + p.y * p.y; sx += p.x; sy += p.y; sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; sz += z; sxz += p.x * z; syz += p.y * z; }
    const A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], b = [sxz, syz, sz];
    const sol = C.solve3(A, b), cx = sol[0] / 2, cy = sol[1] / 2, R = Math.sqrt(sol[2] + cx * cx + cy * cy);
    let ss = 0; for (const p of pts) ss += Math.pow(Math.hypot(p.x - cx, p.y - cy) - R, 2);
    return { cx, cy, R, rms: Math.sqrt(ss / n) };
  };
  /* Ajuste de una cónica con foco en el origen: 1/r = A + B cos θ + D sin θ */
  C.fitFocalConic = function (pts) {
    let s = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
    for (const p of pts) { const v = [1, Math.cos(p.lam), Math.sin(p.lam)], y = 1 / p.r; for (let i = 0; i < 3; i++) { b[i] += v[i] * y; for (let j = 0; j < 3; j++) s[i][j] += v[i] * v[j]; } }
    const [A, B, D] = C.solve3(s, b);
    const e = Math.hypot(B, D) / A, pp = 1 / A, a = pp / (1 - e * e);
    let ss = 0; for (const q of pts) { const rf = 1 / (A + B * Math.cos(q.lam) + D * Math.sin(q.lam)); ss += Math.pow(q.r - rf, 2); }
    return { p: pp, e, a, omega: Math.atan2(D, B), rms: Math.sqrt(ss / pts.length) };
  };
  /* Resolución 3×3 por eliminación gaussiana con pivoteo */
  C.solve3 = function (A, b) {
    const M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < 3; c++) {
      let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < 3; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = [0, 0, 0];
    for (let r = 2; r >= 0; r--) { let s = M[r][3]; for (let k = r + 1; k < 3; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  };
  /* Segunda ley: área barrida por el radio vector entre las anomalías medias M1 y M2 (a = 1) */
  C.sweptArea = function (e, M1, M2) {
    const E1 = C.keplerE(M1, e), E2 = C.keplerE(M2, e);
    /* área de sector elíptico desde el foco: (b/2a)·a²·[(E − e sen E)] → (a²√(1−e²)/2)(ΔM) */
    return 0.5 * Math.sqrt(1 - e * e) * ((E2 - e * Math.sin(E2)) - (E1 - e * Math.sin(E1)));
  };
  /* Tercera ley y masas centrales: GM = 4π² a³ / T² */
  C.centralGM = (aMeters, Tsec) => (4 * Math.PI * Math.PI * Math.pow(aMeters, 3)) / (Tsec * Tsec);
})(typeof window !== 'undefined' ? window : global);
