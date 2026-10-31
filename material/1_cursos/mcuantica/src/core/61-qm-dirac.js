/* ===================================================================
   61-qm-dirac.js — Ecuación de Dirac (EM.qm.dir), ħ = c = 1.
   Matrices α, β y espinores de onda plana (3D), evolución exacta de un paquete de Dirac 1D por FFT (zitterbewegung),
   el escalón de Klein, el átomo hidrogenoide exacto y los niveles de Landau relativistas.
   Requiere 57-qm-qinfo.js (matrices complejas) y 34-qm-wave.js (FFT).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const D = (qm.dir = {});
  const PI = Math.PI, ALPHA = 7.2973525693e-3;
  D.fineStructure = ALPHA;
  const Q = () => qm.qi;
  /* ---- matrices 4×4 ---- */
  const sig = () => { const q = Q(); return [q.X, q.Y, q.Zp]; };
  const blk = (A, B, C, Dm) => { const q = Q(), M = q.zeros(4); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const put = (R, ro, co) => { M.re[ro + i][co + j] = R.re[i][j]; M.im[ro + i][co + j] = R.im[i][j]; }; put(A, 0, 0); put(B, 0, 2); put(C, 2, 0); put(Dm, 2, 2); } return M; };
  D.alpha = (i) => { const q = Q(), s = sig()[i], z = q.zeros(2); return blk(z, s, s, z); };
  D.beta = () => { const q = Q(), z = q.zeros(2); return blk(q.eye(2), z, z, q.scale(q.eye(2), -1)); };
  /* matrices gamma de Dirac: γ⁰ = β, γ^i = βα_i */
  D.gamma = (mu) => { const q = Q(); return mu === 0 ? D.beta() : q.mul(D.beta(), D.alpha(mu - 1)); };
  /* H(p) = α·p + βm */
  D.H = (p, m) => { const q = Q(); let H = q.scale(D.beta(), m); for (let i = 0; i < 3; i++) H = q.add(H, q.scale(D.alpha(i), p[i])); return H; };
  D.energy = (p, m) => Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2 + m * m);
  /* espinor de energía positiva (s = +1) o negativa (s = −1): u = √((E+m)/2E) (χ, σ·p χ/(E + m)) con χ = (cos θ/2, sen θ/2 e^{iφ}); s = −1 usa (σ·p χ/(E+m), χ) */
  D.spinor = (p, m, s, chi) => {
    const E = D.energy(p, m), [px, py, pz] = p, nrm = Math.sqrt((E + m) / (2 * E)), [cr, ci, dr, di] = chi, k = 1 / (E + m);
    /* σ·p χ = ( pz χ₁ + (px − i py) χ₂ , (px + i py) χ₁ − pz χ₂ ) */
    const s1r = pz * cr + px * dr + py * di, s1i = pz * ci + px * di - py * dr, s2r = px * cr - py * ci - pz * dr, s2i = px * ci + py * cr - pz * di;
    const up = [cr, ci, dr, di], lo = [k * s1r, k * s1i, k * s2r, k * s2i];
    return s > 0 ? Float64Array.from([...up, ...lo].map((x) => x * nrm)) : Float64Array.from([...lo.map((x) => -x), ...up].map((x) => x * nrm));
  };
  /* ---- evolución exacta de un paquete de Dirac 1D: H = σ_x k + σ_z m, ψ = (a, b) ---- */
  D.k1d = (N, L) => Float64Array.from({ length: N }, (_, j) => ((2 * PI) / L) * (j < N / 2 ? j : j - N));
  D.x1d = (N, L) => Float64Array.from({ length: N }, (_, j) => -L / 2 + (j * L) / N);
  D.evolve1D = (ar, ai, br, bi, L, m, t) => {
    const W = qm.wave, N = ar.length, k = D.k1d(N, L), A = [Float64Array.from(ar), Float64Array.from(ai)], B = [Float64Array.from(br), Float64Array.from(bi)];
    W.fft(A[0], A[1], false); W.fft(B[0], B[1], false);
    for (let j = 0; j < N; j++) {
      const E = Math.sqrt(k[j] * k[j] + m * m), c = Math.cos(E * t), s = Math.sin(E * t) / E, a0r = A[0][j], a0i = A[1][j], b0r = B[0][j], b0i = B[1][j];
      /* U = c − i s (kσ_x + mσ_z): a' = (c − i s m) a − i s k b ; b' = −i s k a + (c + i s m) b */
      const kj = k[j];
      A[0][j] = c * a0r + s * m * a0i + s * kj * b0i; A[1][j] = c * a0i - s * m * a0r - s * kj * b0r;
      B[0][j] = s * kj * a0i + c * b0r - s * m * b0i; B[1][j] = -s * kj * a0r + c * b0i + s * m * b0r;
    }
    W.fft(A[0], A[1], true); W.fft(B[0], B[1], true);
    return { ar: A[0], ai: A[1], br: B[0], bi: B[1] };
  };
  D.stats1D = (s, L, m) => {
    const N = s.ar.length, dx = L / N, x = D.x1d(N, L); let nrm = 0, mx = 0, vx = 0;
    for (let j = 0; j < N; j++) { const pa = s.ar[j] ** 2 + s.ai[j] ** 2, pb = s.br[j] ** 2 + s.bi[j] ** 2; nrm += (pa + pb) * dx; mx += x[j] * (pa + pb) * dx; vx += 2 * (s.ar[j] * s.br[j] + s.ai[j] * s.bi[j]) * dx; }
    /* peso de energía negativa en el espacio k */
    const W = qm.wave, A = [Float64Array.from(s.ar), Float64Array.from(s.ai)], B = [Float64Array.from(s.br), Float64Array.from(s.bi)], k = D.k1d(N, L); W.fft(A[0], A[1], false); W.fft(B[0], B[1], false);
    let wn = 0, tot = 0; for (let j = 0; j < N; j++) { const E = Math.sqrt(k[j] * k[j] + m * m), pa = A[0][j] ** 2 + A[1][j] ** 2, pb = B[0][j] ** 2 + B[1][j] ** 2, cr = A[0][j] * B[0][j] + A[1][j] * B[1][j]; tot += pa + pb; wn += 0.5 * ((pa + pb) - (m * (pa - pb) + 2 * k[j] * cr) / E); }
    return { norm: nrm, x: mx / nrm, sigmax: vx / nrm, wneg: wn / tot };
  };
  /* paquete gaussiano inicial (a, b) = g(x) e^{ip₀x} (cos χ, sen χ) con desviación típica σ de |g|² */
  D.gauss1D = (N, L, sigma, p0, chi = 0) => {
    const x = D.x1d(N, L), ar = new Float64Array(N), ai = new Float64Array(N), br = new Float64Array(N), bi = new Float64Array(N), g = Math.pow(2 * PI * sigma * sigma, -0.25), c = Math.cos(chi), sn = Math.sin(chi); let s = 0;
    for (let j = 0; j < N; j++) { const a = g * Math.exp(-(x[j] * x[j]) / (4 * sigma * sigma)), co = Math.cos(p0 * x[j]), si = Math.sin(p0 * x[j]); ar[j] = c * a * co; ai[j] = c * a * si; br[j] = sn * a * co; bi[j] = sn * a * si; s += a * a * (L / N); }
    const k = 1 / Math.sqrt(s); for (let j = 0; j < N; j++) { ar[j] *= k; ai[j] *= k; br[j] *= k; bi[j] *= k; }
    return { ar, ai, br, bi };
  };
  /* ---- escalón de Klein: V = 0 (x < 0), V₀ (x > 0); incidencia desde la izquierda con energía E > m ---- */
  D.klein = (E, V0, m = 1) => {
    const p = Math.sqrt(E * E - m * m), eps = E - V0, q2 = eps * eps - m * m;
    if (q2 < 0) return { p, q: Math.sqrt(-q2), r: NaN, R: 1, T: 0, regime: 'evanescente' };
    const q = Math.sqrt(q2), k = eps > 0 ? q : -q, r = (k * (E + m)) / (p * (eps + m)), R = ((1 - r) / (1 + r)) ** 2;
    return { p, q, r, R, T: (4 * r) / ((1 + r) * (1 + r)), regime: eps > 0 ? 'normal' : 'Klein' };
  };
  D.kleinInfinite = (E, m = 1) => { const p = Math.sqrt(E * E - m * m), r = (E + m) / p; return (4 * r) / ((1 + r) * (1 + r)); };
  /* ---- átomo hidrogenoide exacto de Dirac: energía total en unidades de mc² ---- */
  D.hydrogenic = (n, j, Z) => { const za = Z * ALPHA, d = j + 0.5 - Math.sqrt((j + 0.5) ** 2 - za * za); return 1 / Math.sqrt(1 + (za * za) / ((n - d) ** 2)); };
  D.groundCritical = (Z) => Math.sqrt(1 - (Z * ALPHA) ** 2);
  /* ---- niveles de Landau de Dirac (p_z = 0): H = α·π + βm con π_+ = √(2eB) a, π_− = √(2eB) a†, en la base |n⟩⊗(u₁, u₂, l₁, l₂) ---- */
  D.landau = (m, eB, N) => {
    const q = Q(), H = q.zeros(4 * N), g = Math.sqrt(2 * eB), id = (n, s) => 4 * n + s;
    for (let n = 0; n < N; n++) { H.re[id(n, 0)][id(n, 0)] += m; H.re[id(n, 1)][id(n, 1)] += m; H.re[id(n, 2)][id(n, 2)] -= m; H.re[id(n, 3)][id(n, 3)] -= m; }
    for (let n = 0; n + 1 < N; n++) {
      const c = g * Math.sqrt(n + 1);
      H.re[id(n + 1, 0)][id(n, 3)] = c; H.re[id(n, 3)][id(n + 1, 0)] = c; /* l₂,n ↔ u₁,n+1 */
      H.re[id(n, 1)][id(n + 1, 2)] = c; H.re[id(n + 1, 2)][id(n, 1)] = c; /* u₂,n ↔ l₁,n+1 */
    }
    return { H, vals: q.eigh(H).values.slice().sort((x, y) => x - y) };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
