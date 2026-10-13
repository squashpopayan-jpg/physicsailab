/* ===================================================================
   phys/60-stat.js — Mecánica estadística y Monte Carlo (sin DOM).
   · Sistemas de niveles, Schottky, sólidos de Einstein y Debye.
   · Distribuciones de Fermi–Dirac, Bose–Einstein y adsorción de Langmuir.
   · Gas ideal de H₂: función de partición y potencial químico μ(T, p).
   · Ising 2D: solución de Onsager, enumeración exacta, Metropolis.
   · Aleación binaria en el panal con intercambio de Kawasaki.
   · Muestreo de Metropolis en 1D, intercambio de réplicas, recocido del viajante.
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const K = P.K, S = P.sf, I = P.integ, U = P.util;
  const SM = (P.sm = {});

  /* ---------- Sistema de niveles discretos (energías E, degeneraciones g, kT en las mismas unidades) ---------- */
  SM.levels = function (E, g, kT) {
    const n = E.length, gg = g || E.map(() => 1);
    const e0 = Math.min(...E);
    let Z = 0, U1 = 0, U2 = 0;
    const w = E.map((e, i) => gg[i] * Math.exp(-(e - e0) / kT));
    for (let i = 0; i < n; i++) { Z += w[i]; U1 += w[i] * E[i]; U2 += w[i] * E[i] * E[i]; }
    const p = w.map((x) => x / Z);
    const Um = U1 / Z, varE = U2 / Z - Um * Um;
    const lnZ = Math.log(Z) - e0 / kT;
    const F = -kT * lnZ;
    return { Z: Math.exp(lnZ), lnZ, p, U: Um, F, S: (Um - F) / kT, C: varE / (kT * kT), varE };
  };
  /* Calor específico de Schottky de un sistema de dos niveles (brecha Δ): C/k = x² eˣ/(1+eˣ)², x = Δ/kT */
  SM.schottky = (x) => (x > 700 ? 0 : (x * x * Math.exp(x)) / (1 + Math.exp(x)) ** 2);
  /* Einstein: C/(3Nk) = x² eˣ/(eˣ−1)², x = θE/T */
  SM.einsteinC = (x) => (x > 700 ? 0 : (x * x * Math.exp(x)) / (Math.exp(x) - 1) ** 2);
  /* Debye: C/(3Nk) = 3 (T/θ)³ ∫₀^{θ/T} x⁴eˣ/(eˣ−1)² dx */
  SM.debyeC = function (t) {
    const xm = 1 / t;
    if (xm > 60) return ((4 * Math.PI ** 4) / 5) * t ** 3;
    return 3 * t ** 3 * I.fn((x) => (x < 1e-8 ? x * x : (x ** 4 * Math.exp(x)) / (Math.exp(x) - 1) ** 2), 0, xm, 400);
  };
  /* Multiplicidad del sólido de Einstein: Ω(N, q) = C(q + N − 1, q) (en logaritmo) */
  SM.lnOmegaEinstein = (N, q) => S.logBinom(q + N - 1, q);
  /* Distribuciones de ocupación */
  SM.fermi = (E, mu, kT) => 1 / (Math.exp((E - mu) / kT) + 1);
  SM.bose = (E, mu, kT) => (E > mu ? 1 / (Math.exp((E - mu) / kT) - 1) : Infinity);
  SM.boltz = (E, mu, kT) => Math.exp(-(E - mu) / kT);
  /* Cobertura de Langmuir: sitios con energía de adsorción ε (negativa = ligada) en equilibrio con μ */
  SM.langmuir = (eps, mu, kT) => 1 / (1 + Math.exp((eps - mu) / kT));

  /* ---------- H₂ como gas ideal ---------- */
  SM.H2 = { m: 2.01588 * K.u, thetaRot: 85.3, thetaVib: 6332, De: 4.747, D0: 4.478 };
  /* Función de partición rotacional con pesos orto/para (sin la entropía de espín nuclear, 1/4) */
  SM.h2Rot = function (T) {
    const th = SM.H2.thetaRot;
    let q = 0, dq = 0;
    for (let J = 0; J < 60; J++) {
      const g = (J % 2 ? 3 : 1) * (2 * J + 1), e = J * (J + 1) * th;
      const b = g * Math.exp(-e / T);
      q += b; dq += (b * e) / (T * T);
    }
    q /= 4; dq /= 4;
    return { q, dlnq: dq / q };
  };
  /* Termodinámica de H₂(g) a T (K) y p (Pa). Energía de referencia: mínimo del pozo (energía total DFT). */
  SM.h2Thermo = function (T, p = 1e5, o = {}) {
    const kT = K.kB * T, kTeV = K.kB_eV * T;
    const lam3 = Math.pow((2 * Math.PI * SM.H2.m * kT) / (K.h * K.h), 1.5);
    const qtr = (kT / p) * lam3; /* q_trans / N */
    const rot = SM.h2Rot(T);
    const x = SM.H2.thetaVib / T;
    const zpe = o.zpe === false ? 0 : 0.5 * K.kB_eV * SM.H2.thetaVib;
    const lnqv = -Math.log(1 - Math.exp(-x));
    const mu = -kTeV * (Math.log(qtr) + Math.log(rot.q) + lnqv) + zpe;
    const R = K.kB * K.NA;
    const Str = R * (Math.log(qtr) + 2.5);
    const Srot = R * (Math.log(rot.q) + T * rot.dlnq);
    const Svib = R * (x / (Math.exp(x) - 1) + lnqv);
    return { mu, dmuH: mu / 2, S: Str + Srot + Svib, Str, Srot, Svib, zpe };
  };

  /* ---------- Ising 2D en red cuadrada (J = 1, k_B = 1) ---------- */
  SM.onsager = {
    Tc: 2 / Math.log(1 + Math.SQRT2),
    m(T) { const b = 1 / T, s = Math.sinh(2 * b); return T >= SM.onsager.Tc ? 0 : Math.pow(1 - Math.pow(s, -4), 0.125); },
    u(T) {
      const b = 1 / T, sh = Math.sinh(2 * b), ch = Math.cosh(2 * b), th = Math.tanh(2 * b);
      const k = (2 * sh) / (ch * ch);
      const Kk = S.ellipKE(Math.min(k * k, 1 - 1e-16))[0];
      return -(1 / th) * (1 + (2 / Math.PI) * (2 * th * th - 1) * Kk);
    },
    c(T) { const h = 1e-4 * T; return (SM.onsager.u(T + h) - SM.onsager.u(T - h)) / (2 * h); }
  };
  /* Temperatura crítica exacta del Ising en el panal: tanh(J/kTc) = 1/√3 */
  SM.TcHoneycomb = 1 / Math.atanh(1 / Math.sqrt(3));
  /* Campo medio: Tc = zJ */
  SM.mfM = function (T, z = 4, h = 0) {
    /* resuelve m = tanh((zm + h)/T) por iteración con relajación */
    let m = 0.9 * Math.sign(h || 1);
    for (let i = 0; i < 2000; i++) { const mn = Math.tanh((z * m + h) / T); if (Math.abs(mn - m) < 1e-13) { m = mn; break; } m = 0.5 * (m + mn); }
    return m;
  };
  /* Enumeración exacta de un Ising L×L periódico pequeño (L ≤ 4) */
  SM.isingExact = function (L, T, J = 1) {
    const N = L * L, nst = 1 << N;
    let Z = 0, E1 = 0, E2 = 0, M1 = 0, M2 = 0;
    const b = 1 / T;
    /* energías mínimas para normalizar */
    const e0 = -2 * N * J;
    for (let s = 0; s < nst; s++) {
      let E = 0, M = 0;
      for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) {
        const k = i * L + j, sk = (s >> k) & 1 ? 1 : -1;
        M += sk;
        const r = i * L + ((j + 1) % L), d = ((i + 1) % L) * L + j;
        E -= J * sk * (((s >> r) & 1 ? 1 : -1) + ((s >> d) & 1 ? 1 : -1));
      }
      const w = Math.exp(-b * (E - e0));
      Z += w; E1 += w * E; E2 += w * E * E; M1 += w * Math.abs(M); M2 += w * M * M;
    }
    const e = E1 / Z, m = M1 / Z;
    return { e: e / N, m: m / N, c: (b * b * (E2 / Z - e * e)) / N, chi: (b * (M2 / Z - m * m)) / N };
  };
  /* Ising cuadrado con Metropolis */
  SM.Ising = class {
    constructor(L, rng, o = {}) {
      this.L = L; this.N = L * L; this.rng = rng;
      this.s = new Int8Array(this.N);
      this.J = o.J === undefined ? 1 : o.J; this.h = o.h || 0;
      this.randomize(o.start || 'random');
    }
    randomize(mode) { for (let k = 0; k < this.N; k++) this.s[k] = mode === 'up' ? 1 : mode === 'down' ? -1 : this.rng() < 0.5 ? 1 : -1; }
    nbSum(k) { const L = this.L, i = (k / L) | 0, j = k % L, s = this.s; return s[i * L + ((j + 1) % L)] + s[i * L + ((j + L - 1) % L)] + s[((i + 1) % L) * L + j] + s[((i + L - 1) % L) * L + j]; }
    energy() { const L = this.L, s = this.s; let E = 0, M = 0; for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) { const k = i * L + j; E -= this.J * s[k] * (s[i * L + ((j + 1) % L)] + s[((i + 1) % L) * L + j]) + this.h * s[k]; M += s[k]; } return { E, M }; }
    sweep(T) {
      const N = this.N, s = this.s, rng = this.rng, b = 1 / T;
      let acc = 0;
      for (let a = 0; a < N; a++) {
        const k = (rng() * N) | 0;
        const dE = 2 * s[k] * (this.J * this.nbSum(k) + this.h);
        if (dE <= 0 || rng() < Math.exp(-b * dE)) { s[k] = -s[k]; acc++; }
      }
      return acc / N;
    }
  };

  /* ---------- Red de panal en «muro de ladrillos» (L×L, L par, periódica) ----------
     Sitio (i,j) → k = i·L + j. Vecinos: (i, j±1) y un vecino vertical:
     (i−1, j) si (i+j) es par, (i+1, j) si es impar. Posición (d = 1):
     x = j·√3/2, y = 1.5 i + (i+j impar ? 0.5 : 0). La red es bipartita según la paridad de i+j. */
  SM.brick = function (L) {
    const N = L * L, nb = new Int32Array(3 * N), x = new Float64Array(N), y = new Float64Array(N), par = new Uint8Array(N);
    for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) {
      const k = i * L + j, odd = (i + j) & 1;
      par[k] = odd;
      nb[3 * k] = i * L + ((j + 1) % L);
      nb[3 * k + 1] = i * L + ((j + L - 1) % L);
      nb[3 * k + 2] = (odd ? ((i + 1) % L) : ((i + L - 1) % L)) * L + j;
      x[k] = (j * Math.sqrt(3)) / 2; y[k] = 1.5 * i + (odd ? 0.5 : 0);
    }
    return { L, N, nb, x, y, par, W: (L * Math.sqrt(3)) / 2, H: 1.5 * L };
  };
  /* Aleación binaria A/B en el panal: E = Σ_enlaces e(σi,σj); intercambio de Kawasaki */
  SM.Alloy = class {
    constructor(L, xB, rng, o = {}) {
      this.g = SM.brick(L); this.rng = rng;
      this.e = o.e || { AA: 0, BB: 0, AB: 0.1 };
      const N = this.g.N;
      this.s = new Uint8Array(N);
      const nB = Math.round(xB * N);
      const idx = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; }
      for (let q = 0; q < nB; q++) this.s[idx[q]] = 1;
    }
    pair(a, b) { return a === b ? (a ? this.e.BB : this.e.AA) : this.e.AB; }
    energy() { const { N, nb } = this.g; let E = 0; for (let k = 0; k < N; k++) for (let q = 0; q < 3; q++) { const m = nb[3 * k + q]; if (m > k) E += this.pair(this.s[k], this.s[m]); } return E; }
    /* energía de un sitio con sus vecinos excepto 'skip' */
    siteE(k, sk, skip) { const nb = this.g.nb; let E = 0; for (let q = 0; q < 3; q++) { const m = nb[3 * k + q]; if (m !== skip) E += this.pair(sk, this.s[m]); } return E; }
    sweep(kT) {
      const { N, nb } = this.g, s = this.s, rng = this.rng;
      let acc = 0, tried = 0;
      for (let a = 0; a < N; a++) {
        const k = (rng() * N) | 0, m = nb[3 * k + ((rng() * 3) | 0)];
        if (s[k] === s[m]) continue;
        tried++;
        const before = this.siteE(k, s[k], m) + this.siteE(m, s[m], k);
        const after = this.siteE(k, s[m], m) + this.siteE(m, s[k], k);
        const dE = after - before;
        if (dE <= 0 || rng() < Math.exp(-dE / kT)) { const t = s[k]; s[k] = s[m]; s[m] = t; acc++; }
      }
      return tried ? acc / tried : 0;
    }
    /* Parámetro de Warren–Cowley de primeros vecinos: α = 1 − P(B|A)/x_B */
    warrenCowley() {
      const { N, nb } = this.g, s = this.s;
      let nA = 0, AB = 0, Aneigh = 0;
      for (let k = 0; k < N; k++) if (!s[k]) nA++;
      for (let k = 0; k < N; k++) if (!s[k]) for (let q = 0; q < 3; q++) { Aneigh++; if (s[nb[3 * k + q]]) AB++; }
      const xB = 1 - nA / N;
      return nA && xB > 0 ? 1 - AB / Aneigh / xB : 0;
    }
  };

  /* ---------- Metropolis en una dimensión (densidad ∝ e^{−V(x)/T}) ---------- */
  SM.metro1D = function (V, x0, T, step, n, rng) {
    const xs = new Float64Array(n);
    let x = x0, v = V(x), acc = 0;
    for (let i = 0; i < n; i++) {
      const y = x + step * (2 * rng() - 1), vy = V(y);
      if (vy <= v || rng() < Math.exp(-(vy - v) / T)) { x = y; v = vy; acc++; }
      xs[i] = x;
    }
    return { xs, acc: acc / n };
  };
  /* Distribución exacta de Boltzmann en 1D por cuadratura, normalizada en [a,b] */
  SM.boltz1D = function (V, T, a, b, n = 2000) {
    const h = (b - a) / n, x = new Float64Array(n + 1), p = new Float64Array(n + 1);
    let vmin = Infinity;
    for (let i = 0; i <= n; i++) { x[i] = a + i * h; vmin = Math.min(vmin, V(x[i])); }
    for (let i = 0; i <= n; i++) p[i] = Math.exp(-(V(x[i]) - vmin) / T);
    const Z = I.simpson(p, h);
    for (let i = 0; i <= n; i++) p[i] /= Z;
    return { x, p, h };
  };
  /* Intercambio de réplicas para un paisaje 1D: K temperaturas geométricas */
  SM.PT1D = class {
    constructor(V, temps, step, rng, x0 = 0) {
      this.V = V; this.T = temps.slice(); this.rng = rng;
      this.x = temps.map(() => x0); this.v = this.x.map((x) => V(x));
      this.step = temps.map((t, i) => step * Math.sqrt(t / temps[0]));
      this.swTry = new Float64Array(temps.length - 1); this.swOk = new Float64Array(temps.length - 1);
      this.label = temps.map((_, i) => i);
    }
    sweep(nloc = 10) {
      const { V, rng } = this;
      for (let r = 0; r < this.T.length; r++) for (let q = 0; q < nloc; q++) {
        const y = this.x[r] + this.step[r] * (2 * rng() - 1), vy = V(y);
        if (vy <= this.v[r] || rng() < Math.exp(-(vy - this.v[r]) / this.T[r])) { this.x[r] = y; this.v[r] = vy; }
      }
      const par = rng() < 0.5 ? 0 : 1;
      for (let r = par; r < this.T.length - 1; r += 2) {
        const arg = (1 / this.T[r] - 1 / this.T[r + 1]) * (this.v[r] - this.v[r + 1]);
        this.swTry[r]++;
        if (arg >= 0 || rng() < Math.exp(arg)) {
          [this.x[r], this.x[r + 1]] = [this.x[r + 1], this.x[r]];
          [this.v[r], this.v[r + 1]] = [this.v[r + 1], this.v[r]];
          [this.label[r], this.label[r + 1]] = [this.label[r + 1], this.label[r]];
          this.swOk[r]++;
        }
      }
    }
  };

  /* ---------- Cadena de Markov de tres estados con la regla de Metropolis ---------- */
  SM.markov3 = function (E, kT) {
    const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
      let s = 0;
      for (let j = 0; j < 3; j++) if (j !== i) { T[i][j] = 0.5 * Math.min(1, Math.exp(-(E[j] - E[i]) / kT)); s += T[i][j]; }
      T[i][i] = 1 - s;
    }
    return T;
  };
  SM.markovStep = (p, T) => [0, 1, 2].map((j) => p[0] * T[0][j] + p[1] * T[1][j] + p[2] * T[2][j]);

  /* ---------- Viajante (TSP) con recocido simulado y movimientos 2-opt ---------- */
  SM.TSP = class {
    constructor(n, rng) {
      this.rng = rng; this.n = n;
      this.c = Array.from({ length: n }, () => [rng(), rng()]);
      this.tour = Array.from({ length: n }, (_, i) => i);
      this.L = this.length();
    }
    d(a, b) { const p = this.c[a], q = this.c[b]; return Math.hypot(p[0] - q[0], p[1] - q[1]); }
    length() { let L = 0; for (let i = 0; i < this.n; i++) L += this.d(this.tour[i], this.tour[(i + 1) % this.n]); return L; }
    sweep(T) {
      const n = this.n, t = this.tour, rng = this.rng;
      let acc = 0;
      for (let q = 0; q < n; q++) {
        let i = (rng() * n) | 0, j = (rng() * n) | 0;
        if (i === j) continue;
        if (i > j) [i, j] = [j, i];
        if (i === 0 && j === n - 1) continue;
        const a = t[i === 0 ? n - 1 : i - 1], b = t[i], c = t[j], d2 = t[(j + 1) % n];
        const dL = this.d(a, c) + this.d(b, d2) - this.d(a, b) - this.d(c, d2);
        if (dL <= 0 || rng() < Math.exp(-dL / T)) {
          for (let x = i, y = j; x < y; x++, y--) { const tmp = t[x]; t[x] = t[y]; t[y] = tmp; }
          this.L += dL; acc++;
        }
      }
      return acc / n;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
