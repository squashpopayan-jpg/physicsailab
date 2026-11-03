/* ===================================================================
   51-fm-gr.js — Relatividad general (EM.fm.gr): métrica de Schwarzschild, tiempo gravitacional (GPS), deflexión de la luz,
   precesión del perihelio, órbitas en Schwarzschild, agujeros negros y ondas gravitacionales. SI salvo aviso. Sin DOM.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const G = (fm.gr = {});
  const c = K.c || 299792458;
  /* Constantes: G (CODATA 2018), parámetros gravitacionales nominales IAU 2015 y geopotencial IAU 2000 */
  Object.assign(G, {
    G: 6.67430e-11, GMsun: 1.3271244e20, Rsun: 6.957e8, Msun: 1.3271244e20 / 6.67430e-11, GMearth: 3.986004418e14, Rearth: 6378137.0,
    W0: 62636856.0, AU: 1.495978707e11, pc: 3.0856775814913673e16, Mpc: 3.0856775814913673e22, yr: 365.25 * 86400, hbar: 1.054571817e-34, kB: 1.380649e-23, day: 86400
  });
  const GG = G.G;
  G.rs = (GM) => (2 * GM) / (c * c);                        /* radio de Schwarzschild a partir de GM (m³/s²) */
  G.rsM = (M) => (2 * GG * M) / (c * c);
  G.clockRate = (r, rs) => Math.sqrt(1 - rs / r);           /* dτ/dt de un reloj en reposo a la coordenada r */
  G.redshiftSchw = (r, rs) => 1 / Math.sqrt(1 - rs / r) - 1;/* corrimiento al rojo de un fotón emitido en r y recibido en el infinito */
  /* Corrimiento gravitatorio de un fotón que sube una altura h en un campo uniforme: Δf/f = gh/c² */
  G.poundRebka = (h, g = 9.80665) => (g * h) / (c * c);

  /* ---------- GPS: reloj de un satélite en órbita circular frente a uno en el geoide ---------- */
  /* Devuelve las tasas relativas (adimensionales): gravitatoria, cinemática y neta, y su acumulación por día en µs */
  G.gps = (a) => {
    const gr = (G.W0 - G.GMearth / a) / (c * c), sr = -(G.GMearth / a) / (2 * c * c);
    return { gr, sr, net: gr + sr, perDay: { gr: gr * G.day * 1e6, sr: sr * G.day * 1e6, net: (gr + sr) * G.day * 1e6 }, v: Math.sqrt(G.GMearth / a), period: 2 * Math.PI * Math.sqrt((a * a * a) / G.GMearth) };
  };

  /* ---------- Deflexión de la luz y precesión del perihelio ---------- */
  G.deflectionWeak = (GM, b) => (4 * GM) / (c * c * b);   /* 4GM/(c²b) */
  /* Deflexión exacta en Schwarzschild para el parámetro de impacto b: α = 2∫_{r0}^∞ dr/(r²√(1/b² − (1 − rs/r)/r²)) − π.
     Con u = 1/r y el cambio u = u0(1 − t²)... se usa la integral en u con el cero de la raíz en u0 (r0 = distancia mínima). */
  G.deflectionExact = (GM, b) => {
    const m = GM / (c * c), B = b / m;                 /* en unidades de m = GM/c² */
    /* distancia mínima r0: raíz exterior de r³ − B²(r − 2) = 0 (Newton desde r0 = B) */
    let r0 = B; for (let i = 0; i < 200; i++) { const f = r0 ** 3 - B * B * (r0 - 2), fp = 3 * r0 * r0 - B * B; r0 -= f / fp; }
    const u0 = 1 / r0;
    /* Δφ_total = 2∫_0^{u0} du/√(1/B² − u² + 2u³); con u = u0(1 − s²) el integrando 2u0 s/√q es regular en s = 0 */
    const f = (s) => { const u = u0 * (1 - s * s), q = 1 / (B * B) - u * u + 2 * u * u * u; return (2 * u0 * s) / Math.sqrt(Math.max(q, 1e-300)); };
    const X = [0.9061798459386640, 0.5384693101056831], W = [0.2369268850561891, 0.4786286704993665, 0.5688888888888889], n = 4000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a = i / n, b2 = (i + 1) / n, xm = 0.5 * (a + b2), xr = 0.5 * (b2 - a);
      let s5 = W[2] * f(xm); for (let k = 0; k < 2; k++) s5 += W[k] * (f(xm + xr * X[k]) + f(xm - xr * X[k]));
      sum += s5 * xr;
    }
    return 2 * sum - Math.PI;
  };
  /* Precesión del perihelio por órbita: 6πGM/(c² a (1 − e²)) (primer orden) */
  G.periPrecessionWeak = (GM, a, e) => (6 * Math.PI * GM) / (c * c * a * (1 - e * e));
  /* ---------- Órbitas en Schwarzschild (unidades m = GM/c² = 1): u = 1/r con (du/dφ)² = 2(u − u₂)(u₁ − u)(u₃ − u) ---------- */
  /* Dados el periastro rp y el apoastro ra (en unidades de m): ℓ², E² y los tres ceros de la cúbica */
  G.schwOrbit = (rp, ra) => {
    const u1 = 1 / rp, u2 = 1 / ra, u3 = 0.5 - u1 - u2, s = u1 + u2;
    const l2 = 1 / (u1 * u2 + u3 * s);                                  /* de la suma de productos de las raíces de la cúbica */
    const E2 = 1 - 2 * u1 + l2 * (u1 * u1 - 2 * u1 ** 3);              /* de (du/dφ)² = 0 en el periastro */
    return { u1, u2, u3, l2, E2, stable: u3 > u1 };
  };
  /* Ángulo recorrido entre un periastro y el siguiente: Δφ = 2∫_0^π dχ/√(2(u₃ − u(χ))), con u = (u₁+u₂)/2 − (u₁−u₂)/2 · cos χ */
  G.schwDeltaPhi = (rp, ra, n = 2000) => {
    const o = G.schwOrbit(rp, ra), um = (o.u1 + o.u2) / 2, du = (o.u1 - o.u2) / 2;
    let sum = 0; for (let i = 0; i < n; i++) { const chi = ((i + 0.5) * Math.PI) / n, u = um - du * Math.cos(chi); sum += 1 / Math.sqrt(2 * (o.u3 - u)); }
    return (2 * sum * Math.PI) / n;
  };
  G.schwPrecession = (rp, ra) => G.schwDeltaPhi(rp, ra) - 2 * Math.PI;
  /* Trayectoria r(φ) durante N órbitas: arreglos de [φ, r] */
  G.schwPath = (rp, ra, norb = 3, per = 240) => {
    const o = G.schwOrbit(rp, ra), um = (o.u1 + o.u2) / 2, du = (o.u1 - o.u2) / 2, pts = [];
    let phi = 0; const N = per * 2 * norb; const dchi = (2 * Math.PI * norb) / N;
    /* dφ/dχ = 1/√(2(u₃ − u(χ))) ; χ = 0 en el apoastro (u₂): u = um − du cos χ */
    let f0 = 1 / Math.sqrt(2 * (o.u3 - (um - du)));
    pts.push([0, ra]);
    for (let i = 1; i <= N; i++) { const chi = i * dchi, u = um - du * Math.cos(chi), f1 = 1 / Math.sqrt(2 * (o.u3 - u)); phi += 0.5 * (f0 + f1) * dchi; f0 = f1; pts.push([phi, 1 / u]); }
    return pts;
  };
  /* Radios característicos (en unidades de m = GM/c²): horizonte 2, esfera de fotones 3, ISCO 6; sombra del agujero negro 2√27 m */
  G.horizon = 2; G.photonSphere = 3; G.isco = 6; G.shadowImpact = Math.sqrt(27);
  G.shadowAngle = (M, D) => (2 * Math.sqrt(27) * GG * M) / (c * c * D);  /* diámetro angular (rad) de la sombra de un agujero de Schwarzschild */
  /* Radiación de Hawking */
  G.hawkingT = (M) => (G.hbar * c ** 3) / (8 * Math.PI * GG * M * G.kB);
  G.evapTime = (M) => (5120 * Math.PI * GG * GG * M ** 3) / (G.hbar * c ** 4);

  /* ---------- Ondas gravitacionales (inspiral newtoniano, orden cuadrupolar) ---------- */
  G.chirpMass = (m1, m2) => Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
  /* Tiempo hasta la fusión para una frecuencia de la onda f (Hz) y masa de chirp Mc (kg) */
  G.timeToMerger = (f, Mc) => (5 / 256) * Math.pow(Math.PI * f, -8 / 3) * Math.pow((GG * Mc) / c ** 3, -5 / 3);
  G.fOfTau = (tau, Mc) => (1 / Math.PI) * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow((GG * Mc) / c ** 3, -5 / 8);
  G.fdot = (f, Mc) => (96 / 5) * Math.pow(Math.PI, 8 / 3) * Math.pow((GG * Mc) / c ** 3, 5 / 3) * Math.pow(f, 11 / 3);
  G.fISCO = (M) => c ** 3 / (Math.pow(6, 1.5) * Math.PI * GG * M);      /* frecuencia de la onda en el ISCO */
  G.strain = (Mc, f, D) => (4 / D) * Math.pow((GG * Mc) / (c * c), 5 / 3) * Math.pow((Math.PI * f) / c, 2 / 3);
  /* Tiempo de coalescencia de una órbita circular de semieje a (Peters, 1964) */
  G.coalescence = (a, m1, m2) => (5 / 256) * (c ** 5 * a ** 4) / (GG ** 3 * m1 * m2 * (m1 + m2));
  /* Luminosidad en ondas gravitacionales de una órbita circular: (32/5)G⁴(m₁m₂)²(m₁+m₂)/(c⁵a⁵) */
  G.luminosityGW = (a, m1, m2) => (32 / 5) * GG ** 4 * (m1 * m2) ** 2 * (m1 + m2) / (c ** 5 * a ** 5);
})(typeof window !== 'undefined' ? window : globalThis);
