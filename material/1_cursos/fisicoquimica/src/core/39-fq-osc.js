/* ===================================================================
   39-fq-osc.js — Reacciones oscilantes, biestabilidad y patrones de Turing.
   Brusselator, Lotka químico, Oregonator (BZ), modelo de Schlögl, reacción–difusión (Brusselator 1D, Gray–Scott 2D).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const O = (FQ.osc = {});

  /* Brusselator (Prigogine y Lefever, 1968): A → X; B + X → Y + D; 2X + Y → 3X; X → E.  A, B constantes. */
  O.brusRHS = (A, B) => (t, y) => [A - (B + 1) * y[0] + y[0] * y[0] * y[1], B * y[0] - y[0] * y[0] * y[1]];
  O.brusFP = (A, B) => [A, B / A];
  /* Jacobiano en el punto fijo, traza, determinante y valores propios (complejos) */
  O.brusJac = (A, B) => { const tr = B - 1 - A * A, det = A * A, disc = tr * tr - 4 * det; return { tr, det, re: disc < 0 ? tr / 2 : (tr + Math.sqrt(disc)) / 2, im: disc < 0 ? Math.sqrt(-disc) / 2 : 0, lam2: disc < 0 ? tr / 2 : (tr - Math.sqrt(disc)) / 2 }; };
  O.brusHopf = (A) => 1 + A * A;
  O.brusTuring = (A, Dx, Dy) => { const r = Math.sqrt(Dx / Dy), BT = (1 + A * r) * (1 + A * r); return { B: BT, kc: Math.sqrt(A / Math.sqrt(Dx * Dy)) }; };
  /* Mayor parte real de los valores propios de J − k² diag(Dx, Dy) (relación de dispersión) */
  O.brusDisp = (A, B, Dx, Dy, k) => {
    const k2 = k * k, a = B - 1 - Dx * k2, b = A * A, c = -B, d = -A * A - Dy * k2, tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    return disc < 0 ? tr / 2 : (tr + Math.sqrt(disc)) / 2;
  };

  /* Lotka químico: A + X → 2X (k1 a), X + Y → 2Y (k2), Y → B (k3). Cantidad conservada V. */
  O.lotkaRHS = (k1a, k2, k3) => (t, y) => [k1a * y[0] - k2 * y[0] * y[1], k2 * y[0] * y[1] - k3 * y[1]];
  O.lotkaInv = (k1a, k2, k3, x, y) => k2 * (x + y) - k3 * Math.log(x) - k1a * Math.log(y);

  /* Oregonator (Field, Körös y Noyes, 1972), forma adimensional de Tyson: x = [HBrO₂], y = [Br⁻], z = [Ce⁴⁺] */
  O.oregRHS = (f, eps, epsp, q) => (t, y) => [(q * y[1] - y[0] * y[1] + y[0] * (1 - y[0])) / eps, (-q * y[1] - y[0] * y[1] + f * y[2]) / epsp, y[0] - y[2]];

  /* Schlögl (1972): A + 2X ⇌ 3X, B ⇌ X. dx/dt = k1 a x² − k2 x³ + k3 b − k4 x */
  O.schlogl = (x, p) => p.k1a * x * x - p.k2 * x * x * x + p.k3b - p.k4 * x;
  /* Raíces reales positivas de −k2 x³ + k1a x² − k4 x + k3b = 0 (Cardano trigonométrico o Newton con aislamiento) */
  O.schloglRoots = function (p) {
    const a = -p.k2, b = p.k1a, c = -p.k4, d = p.k3b, roots = [];
    /* extremos de la cúbica y bisección en cada tramo monótono */
    const disc = 4 * b * b - 12 * a * c, f = (x) => ((a * x + b) * x + c) * x + d;
    const pts = [-1e-9]; if (disc > 0) { const s = Math.sqrt(disc); pts.push(...[(-2 * b - s) / (6 * a), (-2 * b + s) / (6 * a)].sort((u, v) => u - v).filter((u) => u > 0)); }
    pts.push(1e6);
    for (let i = 0; i < pts.length - 1; i++) { let lo = pts[i], hi = pts[i + 1]; if (f(lo) * f(hi) > 0) continue; for (let j = 0; j < 200; j++) { const m = 0.5 * (lo + hi); if (f(lo) * f(m) <= 0) hi = m; else lo = m; } roots.push(0.5 * (lo + hi)); }
    return roots;
  };

  /* Reacción–difusión del Brusselator en 1D con contorno periódico (diferencias finitas explícitas) */
  O.brus1D = function (A, B, Dx, Dy, L, N, T, seed, nFrames) {
    const dx = L / N, dt = 0.2 * dx * dx / Math.max(Dx, Dy), steps = Math.ceil(T / dt), every = Math.max(1, Math.floor(steps / nFrames));
    const x = new Float64Array(N), y = new Float64Array(N), xn = new Float64Array(N), yn = new Float64Array(N); let s = seed || 1;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5);
    for (let i = 0; i < N; i++) { x[i] = A + 0.02 * rnd(); y[i] = B / A + 0.02 * rnd(); }
    const frames = [];
    for (let n = 0; n <= steps; n++) {
      if (n % every === 0) frames.push(Float64Array.from(x));
      for (let i = 0; i < N; i++) {
        const l = i === 0 ? N - 1 : i - 1, r = i === N - 1 ? 0 : i + 1, xi = x[i], yi = y[i], xxy = xi * xi * yi;
        xn[i] = xi + dt * (A - (B + 1) * xi + xxy + (Dx * (x[l] - 2 * xi + x[r])) / (dx * dx));
        yn[i] = yi + dt * (B * xi - xxy + (Dy * (y[l] - 2 * yi + y[r])) / (dx * dx));
      }
      x.set(xn); y.set(yn);
    }
    return { x, y, frames, dx, dt };
  };

  /* Gray–Scott (1983; Pearson, 1993): U + 2V → 3V, V → P. u' = Du∇²u − uv² + F(1 − u); v' = Dv∇²v + uv² − (F + k)v */
  O.GrayScott = class {
    constructor(N, F, k, Du = 0.16, Dv = 0.08) {
      this.N = N; this.F = F; this.k = k; this.Du = Du; this.Dv = Dv; this.dt = 1; this.t = 0;
      this.u = new Float32Array(N * N).fill(1); this.v = new Float32Array(N * N); this.un = new Float32Array(N * N); this.vn = new Float32Array(N * N);
      this.seed();
    }
    seed(seed) {
      const N = this.N, c = N >> 1, r = Math.max(3, Math.round(N / 14)); let s = seed || 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      this.u.fill(1); this.v.fill(0); this.t = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const q = j * N + i, d = Math.max(Math.abs(i - c), Math.abs(j - c)); if (d < r) { this.u[q] = 0.5 + 0.02 * rnd(); this.v[q] = 0.25 + 0.02 * rnd(); } else if (rnd() < 0.002) { this.u[q] = 0.5; this.v[q] = 0.25; } }
    }
    step(n) {
      const N = this.N, { F, k, Du, Dv, dt } = this; let u = this.u, v = this.v, un = this.un, vn = this.vn;
      for (let it = 0; it < n; it++) {
        for (let j = 0; j < N; j++) {
          const jm = (j === 0 ? N - 1 : j - 1) * N, jp = (j === N - 1 ? 0 : j + 1) * N, jj = j * N;
          for (let i = 0; i < N; i++) {
            const im = i === 0 ? N - 1 : i - 1, ip = i === N - 1 ? 0 : i + 1, q = jj + i, uq = u[q], vq = v[q], uvv = uq * vq * vq;
            un[q] = uq + dt * (Du * (u[jj + im] + u[jj + ip] + u[jm + i] + u[jp + i] - 4 * uq) - uvv + F * (1 - uq));
            vn[q] = vq + dt * (Dv * (v[jj + im] + v[jj + ip] + v[jm + i] + v[jp + i] - 4 * vq) + uvv - (F + k) * vq);
          }
        }
        let t = u; u = un; un = t; t = v; v = vn; vn = t;
      }
      this.u = u; this.v = v; this.un = un; this.vn = vn; this.t += n * dt;
    }
  };
  /* Estados homogéneos no triviales de Gray–Scott: u v = F + k y u = 1 − (F + k) v / F; existen solo si F ≥ 4 (F + k)² */
  O.gsSteady = function (F, k) {
    const s = F + k, disc = 1 - (4 * s * s) / F; if (disc < 0) return [];
    const r = Math.sqrt(disc), v1 = (F * (1 + r)) / (2 * s), v2 = (F * (1 - r)) / (2 * s);
    return [v1, v2].map((v) => ({ u: s / v, v }));
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
