(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const TAU = 2 * Math.PI;
  /* Prueba de la Luna: aceleración centrípeta de la Luna frente a g reducida por (distancia/radio)² */
  C.moonTest = function (RekM, rMoonRadii, Tdays) {
    const r = rMoonRadii * RekM * 1000, T = Tdays * 86400;
    const aMoon = (4 * Math.PI * Math.PI * r) / (T * T);
    const gPred = K.g / (rMoonRadii * rMoonRadii);
    return { aMoon, gPred, ratio: aMoon / gPred };
  };
  /* Órbita bajo una fuerza central f(r) = GM / r^n (GM = 1), integrador leapfrog (kick-drift-kick).
     Parte de (r0, 0) con velocidad tangencial v0. Devuelve trayectoria, momento angular, energía y ápsides. */
  C.centralOrbit = function (n, v0, r0, tmax, dt) {
    let x = r0, y = 0, vx = 0, vy = v0;
    const acc = (px, py) => { const r = Math.hypot(px, py), f = -1 / Math.pow(r, n + 1); return [f * px, f * py]; };
    let [ax, ay] = acc(x, y);
    const pts = [[x, y]], L0 = x * vy - y * vx;
    const apsides = []; let rPrev2 = r0, rPrev = r0, t = 0, drPrev = 0, thetaUnwrapped = 0, thPrev = 0, areaStep = [];
    let rmin = r0, rmax = r0;
    const N = Math.floor(tmax / dt);
    for (let i = 0; i < N; i++) {
      vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; x += dt * vx; y += dt * vy;
      [ax, ay] = acc(x, y); vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; t += dt;
      const r = Math.hypot(x, y);
      rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
      let th = Math.atan2(y, x); let d = th - thPrev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; thetaUnwrapped += d; thPrev = th;
      const dr = r - rPrev;
      if (i > 1 && drPrev * dr < 0) apsides.push({ t, theta: thetaUnwrapped, r: rPrev, kind: drPrev < 0 ? 'min' : 'max' });
      drPrev = dr; rPrev2 = rPrev; rPrev = r;
      if (i % 4 === 0) pts.push([x, y]);
      if (r > 50 * r0 || r < 1e-3) break;
    }
    const L = x * vy - y * vx;
    const E = 0.5 * (vx * vx + vy * vy) + (n === 1 ? Math.log(Math.hypot(x, y)) : -Math.pow(Math.hypot(x, y), 1 - n) / (n - 1));
    return { pts, L0, L, E, apsides, rmin, rmax, t };
  };
  /* Ángulo apsidal teórico para fuerza 1/r^n en órbitas casi circulares (Newton, Principia I, prop. 44-45) */
  C.apsidalAngle = (n) => Math.PI / Math.sqrt(3 - n);
  /* Velocidades características en la superficie de un astro */
  C.circularSpeed = (GM, r) => Math.sqrt(GM / r);
  C.escapeSpeed = (GM, r) => Math.sqrt((2 * GM) / r);
  /* Cañón de Newton: integra una trayectoria en 2D en unidades km, s; devuelve puntos y resultado */
  C.cannon = function (v, h, tmax) {
    const GM = 398600.4418, R = 6371.0;
    const r0 = R + h; let x = 0, y = r0, vx = v, vy = 0, t = 0; const pts = [[x, y]]; let hit = null;
    const dt = Math.max(0.5, Math.min(5, tmax / 20000));
    const acc = (px, py) => { const r = Math.hypot(px, py), f = -GM / (r * r * r); return [f * px, f * py]; };
    let [ax, ay] = acc(x, y);
    while (t < tmax) {
      vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; x += dt * vx; y += dt * vy; [ax, ay] = acc(x, y); vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; t += dt;
      const r = Math.hypot(x, y); pts.push([x, y]);
      if (r < R) { hit = { x, y, t }; break; }
      if (r > 40 * R) break;
    }
    return { pts, hit, GM, R };
  };
})(typeof window !== 'undefined' ? window : global);
