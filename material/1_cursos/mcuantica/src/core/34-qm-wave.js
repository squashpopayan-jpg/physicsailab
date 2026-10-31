/* ===================================================================
   34-qm-wave.js — Ondas de materia en una dimensión (EM.qm.wave): FFT, transformada de Fourier en malla,
   paquete gaussiano libre exacto y evolución por el método del operador dividido (split-operator).
   Unidades: ħ = m = 1 salvo que se indique. Sin DOM: se prueba en Node con tests/validar.js.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const W = (qm.wave = {});

  /* FFT radix-2 en sitio: X_k = Σ x_n e^{−2πi nk/N} (inverse = true usa e^{+…} y divide por N) */
  W.fft = function (re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inverse ? 2 : -2) * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < half; k++) {
          const a = i + k, b = a + half;
          const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  };

  /* Transformada de Fourier φ(k) = (2π)^{-1/2} ∫ ψ(x) e^{−ikx} dx por trapecios, en las k dadas */
  W.ft = function (x, re, im, ks) {
    const dx = x[1] - x[0], N = x.length, c = 1 / Math.sqrt(2 * Math.PI), pr = new Float64Array(ks.length), pi = new Float64Array(ks.length);
    for (let j = 0; j < ks.length; j++) {
      let sr = 0, si = 0;
      for (let i = 0; i < N; i++) { const a = ks[j] * x[i], cs = Math.cos(a), sn = Math.sin(a); sr += re[i] * cs + im[i] * sn; si += im[i] * cs - re[i] * sn; }
      pr[j] = sr * dx * c; pi[j] = si * dx * c;
    }
    return [pr, pi];
  };

  /* Paquete gaussiano libre exacto: ψ(x,0) = (2πσ²)^{-1/4} e^{−(x−x0)²/4σ²} e^{ik0(x−x0)}.
     ψ(x,t) = (2πσ²)^{-1/4} τ^{-1/2} exp[ −(x−x0−ħk0t/m)²/(4σ²τ) + ik0(x−x0) − iħk0²t/2m ],  τ = 1 + iħt/(2mσ²). */
  W.gaussFree = function (x, t, x0, s, k0, m = 1, hb = 1) {
    const N = x.length, re = new Float64Array(N), im = new Float64Array(N);
    const tr = 1, ti = (hb * t) / (2 * m * s * s), tm = Math.hypot(tr, ti), ta = Math.atan2(ti, tr);
    const A = Math.pow(2 * Math.PI * s * s, -0.25) / Math.sqrt(tm), ph0 = -ta / 2 - (hb * k0 * k0 * t) / (2 * m);
    for (let i = 0; i < N; i++) {
      const u = x[i] - x0 - (hb * k0 * t) / m, d = 4 * s * s * (tr * tr + ti * ti);
      /* −u²/(4σ²τ) = −u²(1 − i·ti)/(4σ²|τ|²) */
      const er = -(u * u * tr) / d, ei = (u * u * ti) / d + k0 * (x[i] - x0) + ph0, mag = A * Math.exp(er);
      re[i] = mag * Math.cos(ei); im[i] = mag * Math.sin(ei);
    }
    return [re, im];
  };
  W.freeWidth = (s, t, m = 1, hb = 1) => s * Math.sqrt(1 + Math.pow((hb * t) / (2 * m * s * s), 2));

  /* Operador dividido: e^{−iVΔt/2ħ} e^{−iTΔt/ħ} e^{−iVΔt/2ħ} con T en el espacio de momentos (N potencia de 2) */
  W.SplitOp = class {
    constructor(x, V, dt, o = {}) {
      this.x = x; this.N = x.length; this.dx = x[1] - x[0]; this.dt = dt; this.m = o.mass || 1; this.hb = o.hbar || 1;
      const N = this.N;
      this.k = new Float64Array(N);
      for (let i = 0; i < N; i++) this.k[i] = ((i < N / 2 ? i : i - N) * 2 * Math.PI) / (N * this.dx);
      this.kr = new Float64Array(N); this.ki = new Float64Array(N);
      for (let i = 0; i < N; i++) { const a = (-this.hb * this.k[i] * this.k[i] * dt) / (2 * this.m); this.kr[i] = Math.cos(a); this.ki[i] = Math.sin(a); }
      this.setV(V);
    }
    setV(V) {
      const N = this.N; this.V = Float64Array.from(typeof V === 'function' ? Array.from(this.x, V) : V);
      this.vr = new Float64Array(N); this.vi = new Float64Array(N);
      for (let i = 0; i < N; i++) { const a = (-this.V[i] * this.dt) / (2 * this.hb); this.vr[i] = Math.cos(a); this.vi[i] = Math.sin(a); }
    }
    /* Un paso de Δt en sitio sobre (re, im) */
    step(re, im) {
      const N = this.N, { vr, vi, kr, ki } = this;
      for (let i = 0; i < N; i++) { const a = re[i], b = im[i]; re[i] = a * vr[i] - b * vi[i]; im[i] = a * vi[i] + b * vr[i]; }
      W.fft(re, im, false);
      for (let i = 0; i < N; i++) { const a = re[i], b = im[i]; re[i] = a * kr[i] - b * ki[i]; im[i] = a * ki[i] + b * kr[i]; }
      W.fft(re, im, true);
      for (let i = 0; i < N; i++) { const a = re[i], b = im[i]; re[i] = a * vr[i] - b * vi[i]; im[i] = a * vi[i] + b * vr[i]; }
    }
  };

  /* Momentos de una función de onda en malla: norma, ⟨x⟩, Δx, ⟨p⟩, Δp (por FFT; ħ de la llamada) */
  W.stats = function (x, re, im, hb = 1) {
    const N = x.length, dx = x[1] - x[0];
    let n = 0, mx = 0, mx2 = 0;
    for (let i = 0; i < N; i++) { const p = re[i] * re[i] + im[i] * im[i]; n += p; mx += p * x[i]; mx2 += p * x[i] * x[i]; }
    mx /= n; mx2 /= n;
    const a = Float64Array.from(re), b = Float64Array.from(im);
    W.fft(a, b, false);
    let np = 0, mp = 0, mp2 = 0;
    for (let i = 0; i < N; i++) { const p = a[i] * a[i] + b[i] * b[i], k = ((i < N / 2 ? i : i - N) * 2 * Math.PI) / (N * dx); np += p; mp += p * k; mp2 += p * k * k; }
    mp /= np; mp2 /= np;
    return { norm: n * dx, x: mx, dx: Math.sqrt(Math.max(0, mx2 - mx * mx)), p: hb * mp, dp: hb * Math.sqrt(Math.max(0, mp2 - mp * mp)) };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = W;
})(typeof window !== 'undefined' ? window : globalThis);
