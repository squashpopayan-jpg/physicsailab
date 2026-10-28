/* ===================================================================
   39-fq-liq.js — Fluido de Lennard–Jones: Monte Carlo en el ensemble canónico (NVT), función de distribución radial g(r), energía, presión virial,
   segundo coeficiente virial B₂(T) y temperatura de Boyle. Unidades reducidas (σ = ε = k_B = 1).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const L = (FQ.liq = {});
  L.u = (r2) => { const s6 = 1 / (r2 * r2 * r2); return 4 * (s6 * s6 - s6); };
  /* Correcciones de cola (g = 1 más allá de r_c) */
  L.tailU = (rho, rc) => (8 / 3) * Math.PI * rho * (Math.pow(1 / rc, 9) / 3 - Math.pow(1 / rc, 3)); /* por partícula */
  L.tailP = (rho, rc) => (16 / 3) * Math.PI * rho * rho * ((2 / 3) * Math.pow(1 / rc, 9) - Math.pow(1 / rc, 3));
  /* Monte Carlo NVT. N partículas en una celda cúbica, red fcc inicial. Devuelve promedios y g(r) */
  L.mc = function (N, rho, T, o) {
    o = o || {}; const nEq = o.eq || 400, nPr = o.prod || 1200, seed = o.seed || 12345; let st = seed >>> 0; const rnd = () => ((st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 4294967296);
    const nc = Math.round(Math.cbrt(N / 4)), n = 4 * nc * nc * nc, Lb = Math.cbrt(n / rho), rc = Math.min(Lb / 2, 3.0), rc2 = rc * rc, x = new Float64Array(3 * n), a = Lb / nc;
    const bas = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]]; let k = 0; for (let i = 0; i < nc; i++) for (let j = 0; j < nc; j++) for (let l = 0; l < nc; l++) for (const b of bas) { x[3 * k] = (i + b[0]) * a; x[3 * k + 1] = (j + b[1]) * a; x[3 * k + 2] = (l + b[2]) * a; k++; }
    const mi = (d) => d - Lb * Math.round(d / Lb);
    const eOne = (i, px, py, pz) => { let e = 0; for (let j = 0; j < n; j++) { if (j === i) continue; const dx = mi(px - x[3 * j]), dy = mi(py - x[3 * j + 1]), dz = mi(pz - x[3 * j + 2]), r2 = dx * dx + dy * dy + dz * dz; if (r2 < rc2) e += L.u(r2); } return e; };
    let delta = 0.12 * Lb / nc, acc = 0, tot = 0, sumU = 0, sumW = 0, ns = 0; const nb = 100, rmax = Lb / 2, dr = rmax / nb, hist = new Float64Array(nb);
    for (let sweep = 0; sweep < nEq + nPr; sweep++) {
      for (let m = 0; m < n; m++) { const i = Math.floor(rnd() * n), nx = x[3 * i] + (rnd() - 0.5) * 2 * delta, ny = x[3 * i + 1] + (rnd() - 0.5) * 2 * delta, nz = x[3 * i + 2] + (rnd() - 0.5) * 2 * delta; const dE = eOne(i, nx, ny, nz) - eOne(i, x[3 * i], x[3 * i + 1], x[3 * i + 2]); tot++; if (dE <= 0 || rnd() < Math.exp(-dE / T)) { x[3 * i] = nx - Lb * Math.floor(nx / Lb); x[3 * i + 1] = ny - Lb * Math.floor(ny / Lb); x[3 * i + 2] = nz - Lb * Math.floor(nz / Lb); acc++; } }
      if (sweep < nEq && sweep % 20 === 19) { const r = acc / tot; delta *= r > 0.5 ? 1.1 : 0.9; acc = 0; tot = 0; }
      if (sweep >= nEq) { let U = 0, W = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dx = mi(x[3 * i] - x[3 * j]), dy = mi(x[3 * i + 1] - x[3 * j + 1]), dz = mi(x[3 * i + 2] - x[3 * j + 2]), r2 = dx * dx + dy * dy + dz * dz; const r = Math.sqrt(r2); if (r < rmax) hist[Math.floor(r / dr)] += 2; if (r2 < rc2) { const s6 = 1 / (r2 * r2 * r2); U += 4 * (s6 * s6 - s6); W += 24 * (2 * s6 * s6 - s6); } } sumU += U / n; sumW += W; ns++; }
    }
    const Ue = sumU / ns + L.tailU(rho, rc), P = rho * T + sumW / ns / (3 * Lb * Lb * Lb) + L.tailP(rho, rc);
    const g = Array.from(hist, (h, b) => { const r1 = b * dr, r2 = (b + 1) * dr, shell = (4 / 3) * Math.PI * (r2 * r2 * r2 - r1 * r1 * r1); return h / ns / n / (rho * shell); }), r = Array.from(hist, (_, b) => (b + 0.5) * dr);
    return { U: Ue, P, g, r, N: n, L: Lb, rc, delta, acc: acc / Math.max(tot, 1) };
  };
  /* B₂*(T*) = −2π ∫₀^∞ (e^{−u/T} − 1) r² dr por cuadratura con cambio de variable r = x/(1 − x) */
  L.B2 = function (T) { let s = 0; const N = 4000; for (let i = 1; i < N; i++) { const t = i / N, r = t / (1 - t), jac = 1 / ((1 - t) * (1 - t)), f = Math.exp(-L.u(r * r) / T) - 1; s += f * r * r * jac; } return -2 * Math.PI * s / N; };
  L.boyle = () => { let lo = 2, hi = 6; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (L.B2(m) < 0) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  /* Número de coordinación: n(r) = 4πρ∫₀^r g r² dr hasta el primer mínimo */
  L.coord = (r, g, rho) => { let i0 = 0, gm = 0; for (let i = 0; i < r.length; i++) if (r[i] > 0.8 && r[i] < 1.7 && g[i] > gm) { gm = g[i]; i0 = i; } let j = i0; while (j < g.length - 1 && g[j + 1] <= g[j]) j++; let s = 0; const dr = r[1] - r[0]; for (let k = 0; k <= j; k++) s += 4 * Math.PI * rho * g[k] * r[k] * r[k] * dr; return { n: s, rmin: r[j], rpeak: r[i0], gpeak: gm }; };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
