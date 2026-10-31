/* ===================================================================
   60-qm-path.js — Integrales de camino (EM.qm.pth), ħ = m = 1 salvo indicación.
   Propagadores libre y del oscilador (Mehler, con el índice de Maslov), núcleo euclídeo, producto de Trotter sobre una malla,
   Monte Carlo de integrales de camino con movimientos de «staging» (acción primitiva), integrales de Fresnel y espiral de Cornu.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const P = (qm.pth = {});
  const PI = Math.PI;

  /* ---- propagadores en tiempo real ---- */
  P.kFree = (dx, t, m = 1, hb = 1) => { const a = Math.sqrt(m / (2 * PI * hb * t)), ph = (m * dx * dx) / (2 * hb * t) - PI / 4; return [a * Math.cos(ph), a * Math.sin(ph)]; };
  P.kHO = (xa, xb, t, m = 1, w = 1, hb = 1) => {
    const s = Math.sin(w * t), nu = Math.floor((w * t) / PI), a = Math.sqrt((m * w) / (2 * PI * hb * Math.abs(s))), S = ((m * w) / (2 * s)) * ((xa * xa + xb * xb) * Math.cos(w * t) - 2 * xa * xb), ph = S / hb - PI / 4 - (nu * PI) / 2;
    return [a * Math.cos(ph), a * Math.sin(ph)];
  };
  /* núcleo euclídeo del oscilador (Mehler): ⟨x|e^{−βH}|x′⟩ */
  P.kEuHO = (x, xp, beta) => { const sh = Math.sinh(beta), ch = Math.cosh(beta); return Math.exp(-((x * x + xp * xp) * ch - 2 * x * xp) / (2 * sh)) / Math.sqrt(2 * PI * sh); };
  P.zHO = (beta) => 1 / (2 * Math.sinh(beta / 2));
  P.x2HO = (beta) => 0.5 / Math.tanh(beta / 2);

  /* ---- producto de Trotter simétrico en una malla: ρ_N = (e^{−εV/2} K_ε e^{−εV/2})^N, N = 2^k ---- */
  P.trotter = (V, xmin, xmax, M, beta, N) => {
    const dx = (xmax - xmin) / (M - 1), eps = beta / N, xs = Float64Array.from({ length: M }, (_, i) => xmin + i * dx);
    let A = new Float64Array(M * M); const c = 1 / Math.sqrt(2 * PI * eps);
    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) A[i * M + j] = Math.exp(-0.5 * eps * (V(xs[i]) + V(xs[j])) - ((xs[i] - xs[j]) ** 2) / (2 * eps)) * c * dx;
    const mm = (X, Y) => { const Z = new Float64Array(M * M); for (let i = 0; i < M; i++) for (let k = 0; k < M; k++) { const a = X[i * M + k]; if (a === 0) continue; for (let j = 0; j < M; j++) Z[i * M + j] += a * Y[k * M + j]; } return Z; };
    let n = 1; while (n < N) { A = mm(A, A); n *= 2; }
    /* ρ(x, x′) = A/dx (la medida dx absorbida en el último factor) */
    for (let i = 0; i < M * M; i++) A[i] /= dx;
    return { xs, dx, rho: A, M, N: n, eps: beta / n };
  };
  P.trotterX2 = (T) => { let z = 0, s = 0; for (let i = 0; i < T.M; i++) { const d = T.rho[i * T.M + i]; z += d; s += d * T.xs[i] * T.xs[i]; } return { Z: z * T.dx, x2: s / z }; };

  /* ---- oscilador con acción primitiva discreta: ⟨x²⟩_P exacto (covarianza de la forma cuadrática) ---- */
  P.hoDiscrete = (beta, Pn) => { const eps = beta / Pn; let s = 0; for (let k = 0; k < Pn; k++) s += 1 / ((4 / eps) * Math.sin((PI * k) / Pn) ** 2 + eps); return s / Pn; };

  /* ---- generador pseudoaleatorio (mulberry32) y gaussianas ---- */
  P.rng = (seed) => { let a = seed >>> 0; const u = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; let sp = null; const g = () => { if (sp !== null) { const r = sp; sp = null; return r; } const r = Math.sqrt(-2 * Math.log(1 - u())), th = 2 * PI * u(); sp = r * Math.sin(th); return r * Math.cos(th); }; return { u, g }; };

  /* ---- Monte Carlo de integrales de camino (movimientos de staging + desplazamiento del centroide) ---- */
  P.pimc = (V, beta, Pn, o = {}) => {
    const R = P.rng(o.seed || 1), eps = beta / Pn, L = Math.min(o.L || 8, Pn), therm = o.therm ?? 500, sweeps = o.sweeps ?? 4000, nb = 20, hist = o.hist || null, x = new Float64Array(Pn);
    const x0 = o.x0 ?? 0; for (let i = 0; i < Pn; i++) x[i] = x0 + 0.3 * R.g(); const step = o.step || 0.6;
    let acc = 0, tries = 0; const blocks = new Float64Array(nb), bcnt = new Float64Array(nb), paths = []; let tot = 0, cnt = 0;
    const sweep = () => {
      for (let s = 0; s < Pn / L + 1; s++) {
        const j = Math.floor(R.u() * Pn), nw = new Float64Array(L - 1), idx = []; let dv = 0;
        const end = x[(j + L) % Pn]; let prev = x[j];
        for (let k = 1; k < L; k++) { const rem = L - k + 1, mean = ((rem - 1) * prev + end) / rem, sg = Math.sqrt(((rem - 1) / rem) * eps); const v = mean + sg * R.g(); nw[k - 1] = v; prev = v; idx.push((j + k) % Pn); }
        for (let k = 0; k < L - 1; k++) dv += V(nw[k]) - V(x[idx[k]]);
        tries++; if (Math.log(1 - R.u()) < -eps * dv) { for (let k = 0; k < L - 1; k++) x[idx[k]] = nw[k]; acc++; }
      }
      /* desplazamiento rígido del camino */
      const d = step * (2 * R.u() - 1); let dv = 0; for (let i = 0; i < Pn; i++) dv += V(x[i] + d) - V(x[i]);
      tries++; if (Math.log(1 - R.u()) < -eps * dv) { for (let i = 0; i < Pn; i++) x[i] += d; acc++; }
    };
    for (let i = 0; i < therm; i++) sweep();
    for (let sw = 0; sw < sweeps; sw++) {
      sweep(); let m2 = 0; for (let i = 0; i < Pn; i++) { m2 += x[i] * x[i]; if (hist) { const b = Math.floor(((x[i] - hist.min) / (hist.max - hist.min)) * hist.n); if (b >= 0 && b < hist.n) hist.c[b]++; } } m2 /= Pn;
      const b = Math.min(nb - 1, Math.floor((sw / sweeps) * nb)); blocks[b] += m2; bcnt[b]++; tot += m2; cnt++;
      if (o.keep && sw % o.keep === 0 && paths.length < 12) paths.push(Float64Array.from(x));
    }
    const mean = tot / cnt, bm = Array.from(blocks, (v, i) => v / bcnt[i]), err = Math.sqrt(bm.reduce((s, v) => s + (v - mean) ** 2, 0) / (nb * (nb - 1)));
    return { x2: mean, err, accept: acc / tries, paths, x: Float64Array.from(x) };
  };

  /* ---- integrales de Fresnel C(x) = ∫₀ˣ cos(πt²/2)dt, S(x) = ∫₀ˣ sen(πt²/2)dt por cuadratura compuesta de Gauss–Legendre (16 puntos) ---- */
  const GL = (() => { const n = 16, xs = [], ws = []; for (let i = 0; i < n; i++) { let z = Math.cos((PI * (i + 0.75)) / (n + 0.5)), pp; for (let it = 0; it < 100; it++) { let p1 = 1, p2 = 0; for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); } pp = (n * (z * p1 - p2)) / (z * z - 1); const dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-16) break; } xs.push(z); ws.push(2 / ((1 - z * z) * pp * pp)); } return { xs, ws }; })();
  P.fresnel = (xin) => {
    const x = Math.abs(xin), sg = xin < 0 ? -1 : 1, np = Math.max(1, Math.ceil(x / Math.min(0.25, 1.2 / (PI * Math.max(x, 1e-9))))), h = x / np; let C = 0, S = 0;
    for (let p = 0; p < np; p++) { const a = p * h, mid = a + h / 2; for (let k = 0; k < GL.xs.length; k++) { const t = mid + (h / 2) * GL.xs[k], ph = (PI * t * t) / 2, w = (h / 2) * GL.ws[k]; C += w * Math.cos(ph); S += w * Math.sin(ph); } }
    return { C: sg * C, S: sg * S };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
