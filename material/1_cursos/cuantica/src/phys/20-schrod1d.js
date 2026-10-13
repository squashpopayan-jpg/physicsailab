/* ===================================================================
   phys/20-schrod1d.js — Mecánica cuántica en una dimensión (sin DOM).
   Unidades: ħ = m = 1 salvo que se indique (energías en unidades de ħ²/(m L²)).
   · Autoestados por diferencias finitas (matriz tridiagonal).
   · Método de disparo de Numerov.
   · Evolución temporal de Crank–Nicolson (unitaria).
   · Soluciones exactas: pozo infinito, pozo finito, barrera, oscilador,
     potencial de Morse y de Pöschl–Teller.
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const LA = P.la, S = P.sf, U = P.util;
  const Q = (P.q1d = {});

  /* Malla uniforme interior de N puntos en (a,b) con ψ(a)=ψ(b)=0 */
  Q.grid = function (a, b, N) {
    const h = (b - a) / (N + 1);
    const x = new Float64Array(N);
    for (let i = 0; i < N; i++) x[i] = a + (i + 1) * h;
    return { x, h, a, b, N };
  };

  /* Autoestados de −(ħ²/2m) ψ'' + V ψ = E ψ por diferencias finitas de segundo orden.
     V: función o arreglo. Devuelve {x, h, E[], psi[] normalizadas con ∫|ψ|²dx = 1} */
  Q.fdEigen = function (V, a, b, N, k, o = {}) {
    const g = Q.grid(a, b, N);
    const m = o.mass || 1, hb = o.hbar || 1;
    const t = (hb * hb) / (2 * m * g.h * g.h);
    const d = new Float64Array(N), e = new Float64Array(N - 1);
    for (let i = 0; i < N; i++) d[i] = 2 * t + (typeof V === 'function' ? V(g.x[i]) : V[i]);
    e.fill(-t);
    const r = LA.tridiagLowest(d, e, k, { vectors: o.vectors !== false });
    const psi = r.vectors ? r.vectors.map((v) => { const s = 1 / Math.sqrt(g.h); return v.map((y) => y * s); }) : null;
    return { x: g.x, h: g.h, E: Array.from(r.values), psi };
  };

  /* Numerov: integra ψ'' = f(x) ψ desde el índice i0 con dos valores iniciales */
  Q.numerov = function (f, h, y0, y1, n, dir = 1) {
    const y = new Float64Array(n);
    const h12 = (h * h) / 12;
    if (dir > 0) {
      y[0] = y0; y[1] = y1;
      for (let i = 1; i < n - 1; i++) y[i + 1] = (2 * y[i] * (1 + 5 * h12 * f[i]) - y[i - 1] * (1 - h12 * f[i - 1])) / (1 - h12 * f[i + 1]);
    } else {
      y[n - 1] = y0; y[n - 2] = y1;
      for (let i = n - 2; i > 0; i--) y[i - 1] = (2 * y[i] * (1 + 5 * h12 * f[i]) - y[i + 1] * (1 - h12 * f[i + 1])) / (1 - h12 * f[i - 1]);
    }
    return y;
  };

  /* Disparo de Numerov para un potencial simétrico o no, con extremos a, b fijos (ψ=0).
     Devuelve la función ψ(b; E) para buscar raíces en E. */
  Q.shoot = function (V, a, b, N, E, o = {}) {
    const m = o.mass || 1, hb = o.hbar || 1;
    const h = (b - a) / (N - 1);
    const f = new Float64Array(N);
    for (let i = 0; i < N; i++) { const x = a + i * h; f[i] = ((2 * m) / (hb * hb)) * ((typeof V === 'function' ? V(x) : V[i]) - E); }
    const y = Q.numerov(f, h, 0, 1e-6, N, 1);
    return { y, h, end: y[N - 1] };
  };

  /* ---------- Crank–Nicolson (ħ = m = 1): (1 + iHΔt/2) ψⁿ⁺¹ = (1 − iHΔt/2) ψⁿ ---------- */
  Q.CrankNicolson = class {
    constructor(x, V, dt, o = {}) {
      this.x = x; this.N = x.length; this.h = x[1] - x[0]; this.dt = dt;
      this.m = o.mass || 1;
      this.setV(V);
    }
    setV(V) {
      const N = this.N, h = this.h, dt = this.dt;
      const t = 1 / (2 * this.m * h * h);
      this.V = Float64Array.from(typeof V === 'function' ? Array.from(this.x, V) : V);
      /* H = tridiag(−t, 2t + V, −t); A = 1 + iHdt/2 */
      this.bRe = new Float64Array(N).fill(1);
      this.bIm = new Float64Array(N);
      for (let i = 0; i < N; i++) this.bIm[i] = 0.5 * dt * (2 * t + this.V[i]);
      this.offRe = 0; this.offIm = -0.5 * dt * t;
      this.t = t;
    }
    step(re, im) {
      const N = this.N, dt = this.dt, t = this.t;
      /* r = (1 − iHdt/2) ψ */
      const rRe = new Float64Array(N), rIm = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        const hRe = (2 * t + this.V[i]) * re[i] - t * ((i > 0 ? re[i - 1] : 0) + (i < N - 1 ? re[i + 1] : 0));
        const hIm = (2 * t + this.V[i]) * im[i] - t * ((i > 0 ? im[i - 1] : 0) + (i < N - 1 ? im[i + 1] : 0));
        rRe[i] = re[i] + 0.5 * dt * hIm;
        rIm[i] = im[i] - 0.5 * dt * hRe;
      }
      return LA.thomasC(this.bRe, this.bIm, this.offRe, this.offIm, rRe, rIm);
    }
  };

  /* Paquete gaussiano normalizado ψ(x,0) = (2πσ²)^{-1/4} e^{−(x−x0)²/4σ²} e^{ik0x} */
  Q.gaussPacket = function (x, x0, sigma, k0) {
    const N = x.length, re = new Float64Array(N), im = new Float64Array(N);
    const A = Math.pow(2 * Math.PI * sigma * sigma, -0.25);
    for (let i = 0; i < N; i++) {
      const g = A * Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma));
      re[i] = g * Math.cos(k0 * x[i]); im[i] = g * Math.sin(k0 * x[i]);
    }
    return [re, im];
  };
  /* Anchura exacta del paquete libre: σ(t) = σ0 √(1 + (ħt/2mσ0²)²) */
  Q.freeWidth = (sigma0, t, m = 1, hb = 1) => sigma0 * Math.sqrt(1 + ((hb * t) / (2 * m * sigma0 * sigma0)) ** 2);
  Q.moments = function (x, re, im) {
    const h = x[1] - x[0];
    let n = 0, mx = 0, mx2 = 0;
    for (let i = 0; i < x.length; i++) { const p = re[i] * re[i] + im[i] * im[i]; n += p; mx += p * x[i]; mx2 += p * x[i] * x[i]; }
    n *= h; mx *= h; mx2 *= h;
    const xm = mx / n;
    return { norm: n, mean: xm, sigma: Math.sqrt(Math.max(0, mx2 / n - xm * xm)) };
  };
  /* ⟨p⟩ y Δp por diferencias centrales (ħ=1) */
  Q.momentumStats = function (x, re, im) {
    const h = x[1] - x[0], N = x.length;
    let n = 0, p1 = 0, p2 = 0;
    for (let i = 1; i < N - 1; i++) {
      const dRe = (re[i + 1] - re[i - 1]) / (2 * h), dIm = (im[i + 1] - im[i - 1]) / (2 * h);
      const d2Re = (re[i + 1] - 2 * re[i] + re[i - 1]) / (h * h), d2Im = (im[i + 1] - 2 * im[i] + im[i - 1]) / (h * h);
      n += re[i] * re[i] + im[i] * im[i];
      /* ψ* (−i ψ') = −i (re − i im)(dRe + i dIm) → parte real: re·dIm − im·dRe */
      p1 += re[i] * dIm - im[i] * dRe;
      p2 += -(re[i] * d2Re + im[i] * d2Im);
    }
    const pm = p1 / n;
    return { mean: pm, sigma: Math.sqrt(Math.max(0, p2 / n - pm * pm)) };
  };

  /* ---------- Soluciones exactas ---------- */
  const X = (Q.exact = {});
  /* Pozo infinito de ancho L: E_n = n²π²ħ²/(2mL²) */
  X.boxE = (n, L = 1, m = 1, hb = 1) => (n * n * Math.PI * Math.PI * hb * hb) / (2 * m * L * L);
  X.boxPsi = (n, x, L = 1) => (x < 0 || x > L ? 0 : Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L));
  /* Oscilador: E_n = ħω(n + ½) */
  X.hoE = (n, w = 1, hb = 1) => hb * w * (n + 0.5);
  X.hoPsi = (n, x, m = 1, w = 1, hb = 1) => { const l = Math.sqrt(hb / (m * w)); return S.hoPsi(n, x / l) / Math.sqrt(l); };
  /* Morse V = De(1 − e^{−a(x−x0)})²: E_n = ħω(n+½) − [ħω(n+½)]²/(4De), ω = a√(2De/m) */
  X.morseE = (n, De, a, m = 1, hb = 1) => { const w = a * Math.sqrt((2 * De) / m); const q = hb * w * (n + 0.5); return q - (q * q) / (4 * De); };
  X.morseNmax = (De, a, m = 1, hb = 1) => { const w = a * Math.sqrt((2 * De) / m); return Math.floor((2 * De) / (hb * w) - 0.5); };
  /* Pöschl–Teller V = −(λ(λ+1)/2) sech²x (ħ=m=1): E_n = −(λ − n)²/2, n < λ */
  X.ptE = (n, lam) => -((lam - n) ** 2) / 2;
  /* Pozo finito de profundidad V0 y ancho L (centrado en 0, V=−V0 dentro): estados ligados.
     z = kL/2, z0 = (L/2)√(2mV0)/ħ; pares: tan z = √(z0²−z²)/z; impares: −cot z = √(z0²−z²)/z */
  X.finiteWell = function (V0, L, m = 1, hb = 1) {
    const z0 = (L / 2) * Math.sqrt(2 * m * V0) / hb;
    const out = [];
    const fe = (z) => Math.tan(z) - Math.sqrt(Math.max(0, z0 * z0 - z * z)) / z;
    const fo = (z) => -1 / Math.tan(z) - Math.sqrt(Math.max(0, z0 * z0 - z * z)) / z;
    for (let k = 0; k * Math.PI / 2 < z0; k++) {
      const lo = (k * Math.PI) / 2 + 1e-12, hi = Math.min(((k + 1) * Math.PI) / 2 - 1e-12, z0);
      if (hi <= lo) break;
      const f = k % 2 === 0 ? fe : fo;
      /* en cada rama la función crece monótonamente; se busca el cambio de signo */
      const z = U.bisect(f, lo, hi);
      if (!isFinite(z)) continue;
      const E = (hb * hb * (2 * z / L) ** 2) / (2 * m) - V0;
      out.push({ n: k + 1, parity: k % 2 === 0 ? 'par' : 'impar', z, E, k: (2 * z) / L, kappa: Math.sqrt(Math.max(0, -2 * m * E)) / hb });
    }
    return { z0, states: out, nBound: Math.ceil((2 * z0) / Math.PI) };
  };
  X.finiteWellPsi = function (st, V0, L, x) {
    const a = L / 2, k = st.k, q = st.kappa;
    const even = st.parity === 'par';
    let inside, outside;
    if (even) { inside = Math.cos(k * x); outside = Math.cos(k * a) * Math.exp(-q * (Math.abs(x) - a)); }
    else { inside = Math.sin(k * x); outside = Math.sign(x) * Math.sin(k * a) * Math.exp(-q * (Math.abs(x) - a)); }
    /* normalización analítica */
    const Nin = even ? a + Math.sin(2 * k * a) / (2 * k) : a - Math.sin(2 * k * a) / (2 * k);
    const c = even ? Math.cos(k * a) : Math.sin(k * a);
    const Nout = (c * c) / q;
    const Nrm = 1 / Math.sqrt(Nin + Nout);
    return Nrm * (Math.abs(x) <= a ? inside : outside);
  };
  /* Transmisión por una barrera rectangular de altura V0 y ancho a (ħ = m = 1 salvo o) */
  X.barrierT = function (E, V0, a, m = 1, hb = 1) {
    if (E <= 0) return 0;
    const k = Math.sqrt(2 * m * E) / hb;
    if (Math.abs(E - V0) < 1e-12 * Math.max(1, V0)) return 1 / (1 + (m * V0 * a * a) / (2 * hb * hb));
    if (E < V0) {
      const q = Math.sqrt(2 * m * (V0 - E)) / hb;
      const s = Math.sinh(q * a);
      return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E)));
    }
    const q = Math.sqrt(2 * m * (E - V0)) / hb;
    const s = Math.sin(q * a);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
  };
  /* Escalón de potencial: coeficiente de transmisión */
  X.stepT = function (E, V0) {
    if (E <= V0) return 0;
    const k1 = Math.sqrt(E), k2 = Math.sqrt(E - V0);
    return (4 * k1 * k2) / ((k1 + k2) ** 2);
  };

  /* ---------- Matriz de transferencia para potenciales constantes a trozos (T(E)) ---------- */
  Q.transfer = function (E, regions, m = 1, hb = 1) {
    /* regions: [{x0, x1, V}] contiguas; fuera, V = 0 */
    const kOf = (V) => { const v = (2 * m * (E - V)) / (hb * hb); return v >= 0 ? { re: Math.sqrt(v), im: 0 } : { re: 0, im: Math.sqrt(-v) }; };
    /* aritmética compleja mínima */
    const c = (re, im) => ({ re, im });
    const add = (a, b) => c(a.re + b.re, a.im + b.im), sub = (a, b) => c(a.re - b.re, a.im - b.im);
    const mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const q = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / q, (a.im * b.re - a.re * b.im) / q); };
    const ex = (a) => { const r = Math.exp(a.re); return c(r * Math.cos(a.im), r * Math.sin(a.im)); };
    const iz = (a) => c(-a.im, a.re);
    /* ψ = A e^{ikx} + B e^{−ikx}; en cada interfaz x se igualan ψ y ψ' */
    const layers = [{ V: 0 }, ...regions, { V: 0 }];
    const xs = regions.map((r) => r.x0).concat([regions[regions.length - 1].x1]);
    /* matriz M total (2×2 compleja) que lleva (A,B) de la izquierda a la derecha */
    let M = [[c(1, 0), c(0, 0)], [c(0, 0), c(1, 0)]];
    for (let s = 0; s < xs.length; s++) {
      const k1 = kOf(layers[s].V), k2 = kOf(layers[s + 1].V), x = xs[s];
      const k1c = k1, k2c = k2;
      const ikx1 = iz(mul(k1c, c(x, 0))), ikx2 = iz(mul(k2c, c(x, 0)));
      const e1p = ex(ikx1), e1m = ex(c(-ikx1.re, -ikx1.im)), e2p = ex(ikx2), e2m = ex(c(-ikx2.re, -ikx2.im));
      /* [e2p e2m; ik2 e2p, −ik2 e2m] (A2,B2) = [e1p e1m; ik1 e1p, −ik1 e1m] (A1,B1) */
      const L1 = [[e1p, e1m], [mul(iz(k1c), e1p), mul(c(-iz(k1c).re, -iz(k1c).im), e1m)]];
      const L2 = [[e2p, e2m], [mul(iz(k2c), e2p), mul(c(-iz(k2c).re, -iz(k2c).im), e2m)]];
      const det = sub(mul(L2[0][0], L2[1][1]), mul(L2[0][1], L2[1][0]));
      const inv = [[div(L2[1][1], det), div(c(-L2[0][1].re, -L2[0][1].im), det)], [div(c(-L2[1][0].re, -L2[1][0].im), det), div(L2[0][0], det)]];
      const T = [[add(mul(inv[0][0], L1[0][0]), mul(inv[0][1], L1[1][0])), add(mul(inv[0][0], L1[0][1]), mul(inv[0][1], L1[1][1]))],
        [add(mul(inv[1][0], L1[0][0]), mul(inv[1][1], L1[1][0])), add(mul(inv[1][0], L1[0][1]), mul(inv[1][1], L1[1][1]))]];
      M = [[add(mul(T[0][0], M[0][0]), mul(T[0][1], M[1][0])), add(mul(T[0][0], M[0][1]), mul(T[0][1], M[1][1]))],
        [add(mul(T[1][0], M[0][0]), mul(T[1][1], M[1][0])), add(mul(T[1][0], M[0][1]), mul(T[1][1], M[1][1]))]];
    }
    /* incidencia desde la izquierda: (1, r) → (t, 0): 0 = M10 + M11 r → r = −M10/M11; t = M00 + M01 r */
    const r = div(c(-M[1][0].re, -M[1][0].im), M[1][1]);
    const t = add(M[0][0], mul(M[0][1], r));
    return { T: t.re * t.re + t.im * t.im, R: r.re * r.re + r.im * r.im };
  };

  /* Potenciales de ejemplo para el resolvedor general */
  Q.potentials = {
    armonico: { name: 'Oscilador armónico  V = x²/2', V: (x) => 0.5 * x * x, a: -8, b: 8, exact: (n) => n + 0.5 },
    pozo: { name: 'Pozo finito  V₀ = 10, L = 2', V: (x) => (Math.abs(x) < 1 ? -10 : 0), a: -6, b: 6, exact: (n) => { const r = X.finiteWell(10, 2); return r.states[n] ? r.states[n].E : NaN; } },
    morse: { name: 'Morse  Dₑ = 10, a = 0.7', V: (x) => 10 * (1 - Math.exp(-0.7 * x)) ** 2, a: -2.5, b: 14, exact: (n) => (n <= X.morseNmax(10, 0.7) ? X.morseE(n, 10, 0.7) : NaN) },
    pt: { name: 'Pöschl–Teller  λ = 4', V: (x) => -10 / Math.cosh(x) ** 2, a: -9, b: 9, exact: (n) => (n < 4 ? X.ptE(n, 4) : NaN) },
    doble: { name: 'Doble pozo  V = (x² − 4)²/8', V: (x) => ((x * x - 4) ** 2) / 8, a: -5, b: 5, exact: null },
    lineal: { name: 'Potencial lineal  V = |x|', V: (x) => Math.abs(x), a: -12, b: 12, exact: null },
    caja: { name: 'Pozo infinito  L = 2', V: () => 0, a: -1, b: 1, exact: (n) => X.boxE(n + 1, 2) }
  };
})(typeof window !== 'undefined' ? window : globalThis);
