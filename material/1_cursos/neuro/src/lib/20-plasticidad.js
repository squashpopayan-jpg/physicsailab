/* ===================================================================
   lib/20-plasticidad.js — Plasticidad sináptica y memoria asociativa:
   ventana STDP, reglas de Hebb, Oja y BCM, red de Hopfield y mapa
   autoorganizado de Kohonen (analogía de los mapas corticales).
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const P = (L.plast = {});

  /* ---------- STDP: cambio relativo de peso por par pre→post separado Δt = t_post − t_pre (ms) ---------- */
  P.stdpParams = { Ap: 0.8, Am: 0.35, tp: 17, tm: 34 };
  P.stdp = function (dt, p = P.stdpParams) {
    if (dt > 0) return p.Ap * Math.exp(-dt / p.tp);
    if (dt < 0) return -p.Am * Math.exp(dt / p.tm);
    return 0;
  };
  /* Protocolo de emparejamiento: nPairs pares con desfase dt. Límites suaves: la potenciación
     es proporcional a (wmax − w) y la depresión a w. Devuelve el peso relativo (1 = inicial). */
  P.pairing = function (dt, nPairs = 60, eta = 0.012, p = P.stdpParams, wmax = 3) {
    let w = 1;
    const out = [w];
    for (let k = 0; k < nPairs; k++) {
      const dw = P.stdp(dt, p);
      w += eta * dw * (dw > 0 ? wmax - w : w);
      out.push(w);
    }
    return out;
  };

  /* ---------- Hipótesis del control por calcio (Shouval, Bear y Cooper, 2002) ----------
     Ω(Ca) = 0,25 + σ(Ca − αp) − 0,25 σ(Ca − αd), con σ logística de pendiente β; el peso tiende a Ω.
     Calcio bajo: sin cambio; intermedio: depresión (LTD); alto: potenciación (LTP). Ca en µM. */
  P.sig = (x, b = 80) => 1 / (1 + Math.exp(-b * x));
  P.omega = (Ca, ad = 0.35, ap = 0.55) => 0.25 + P.sig(Ca - ap) - 0.25 * P.sig(Ca - ad);
  /* Calcio medio según la frecuencia de estimulación (curva didáctica creciente y saturable);
     nmda ∈ [0, 1] es la fracción de receptores NMDA disponibles (0 = bloqueados con AP5) */
  P.caFreq = (f, nmda = 1) => 0.1 + nmda * 0.8 * Math.pow(f, 0.285) / (Math.pow(f, 0.285) + 1.609);
  /* Cambio relativo tras n pulsos: avanza hacia Ω con constante τ (en pulsos). La escala se fija para que
     la depresión máxima sea −20 % y la potenciación máxima +50 %, el orden de lo medido en rebanadas. */
  P.freqChange = (f, n = 900, tau = 600, nmda = 1) => {
    const d = P.omega(P.caFreq(f, nmda)) - 0.25;
    return d * (d < 0 ? 0.8 : 0.5 / 0.75) * (1 - Math.exp(-n / tau));
  };

  /* ---------- Regla de Oja: Δw = η y (x − y w), y = w·x ----------
     Converge al vector propio principal de la covarianza de x con norma 1. */
  P.gauss2 = function (rng, sx, sy, rho) {
    const z1 = rng.gauss(), z2 = rng.gauss();
    return [sx * z1, sy * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)];
  };
  P.oja = function (o) {
    const rng = L.rng(o.seed || 1), eta = o.eta || 0.005, n = o.n || 4000;
    let w = (o.w0 || [0.3, -0.8]).slice();
    const traj = [w.slice()], pts = [];
    for (let k = 0; k < n; k++) {
      const x = o.sample ? o.sample(rng) : P.gauss2(rng, o.sx || 1, o.sy || 0.5, o.rho === undefined ? 0.6 : o.rho);
      const y = w[0] * x[0] + w[1] * x[1];
      if (o.rule === 'hebb') { w[0] += eta * y * x[0]; w[1] += eta * y * x[1]; }
      else { w[0] += eta * y * (x[0] - y * w[0]); w[1] += eta * y * (x[1] - y * w[1]); }
      /* Hebb puro diverge: se congela al superar 10⁸ para no producir infinitos */
      const nw = Math.hypot(w[0], w[1]);
      if (!(nw < 1e8)) { const s = 1e8 / nw; w[0] = isFinite(s * w[0]) ? s * w[0] : Math.sign(w[0]) * 1e8; w[1] = isFinite(s * w[1]) ? s * w[1] : Math.sign(w[1]) * 1e8; }
      if (k < 600) pts.push(x);
      if (k % 10 === 9) traj.push(w.slice());
    }
    return { w, traj, pts };
  };
  /* Vector propio principal de una matriz simétrica 2×2 [[a,b],[b,d]] */
  P.pc1 = function (a, b, d) {
    const tr = a + d, det = a * d - b * b, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det);
    let v = Math.abs(b) > 1e-14 ? [l1 - d, b] : (a >= d ? [1, 0] : [0, 1]);
    const nv = Math.hypot(v[0], v[1]);
    return { l1, v: [v[0] / nv, v[1] / nv] };
  };

  /* ---------- Regla BCM: Δw = η x y (y − θ), dθ/dt = (y² − θ)/τθ ----------
     Dos patrones de entrada (A y B) alternados al azar; la neurona se vuelve selectiva. */
  P.bcm = function (o = {}) {
    const rng = L.rng(o.seed || 3), eta = o.eta || 0.005, tauT = o.tauT || 50, n = o.n || 6000;
    const A = o.A || [1, 0.2], B = o.B || [0.2, 1], pA = o.pA === undefined ? 0.5 : o.pA;
    /* pesos iniciales casi iguales: una asimetría pequeña al azar rompe el empate */
    let w = (o.w0 || [0.5 + 0.03 * (rng() - 0.5), 0.5 + 0.03 * (rng() - 0.5)]).slice(), th = o.th0 || 0.3;
    const out = { w: [w.slice()], th: [th], yA: [], yB: [] };
    for (let k = 0; k < n; k++) {
      const x = rng() < pA ? A : B;
      const y = Math.max(0, w[0] * x[0] + w[1] * x[1]);
      for (let i = 0; i < 2; i++) w[i] = Math.max(0, w[i] + eta * x[i] * y * (y - th));
      th += (y * y - th) / tauT;
      if (k % 20 === 19) {
        out.w.push(w.slice()); out.th.push(th);
        out.yA.push(Math.max(0, w[0] * A[0] + w[1] * A[1])); out.yB.push(Math.max(0, w[0] * B[0] + w[1] * B[1]));
      }
    }
    return out;
  };

  /* ---------- Red de Hopfield (1982) ---------- */
  P.Hopfield = function (N, rng) {
    this.N = N;
    this.W = new Float64Array(N * N);
    this.rng = rng || L.rng(7);
    this.patterns = [];
  };
  P.Hopfield.prototype.randomPattern = function () {
    const p = new Int8Array(this.N);
    for (let i = 0; i < this.N; i++) p[i] = this.rng() < 0.5 ? -1 : 1;
    return p;
  };
  P.Hopfield.prototype.store = function (p) {
    const N = this.N, W = this.W;
    this.patterns.push(p);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) W[i * N + j] += (p[i] * p[j]) / N;
  };
  P.Hopfield.prototype.field = function (s, i) {
    const N = this.N, W = this.W;
    let h = 0;
    for (let j = 0; j < N; j++) h += W[i * N + j] * s[j];
    return h;
  };
  /* Barrido asíncrono en orden aleatorio; devuelve cuántas neuronas cambiaron */
  P.Hopfield.prototype.sweep = function (s) {
    const N = this.N;
    const ord = Array.from({ length: N }, (_, i) => i);
    for (let k = N - 1; k > 0; k--) { const j = Math.floor(this.rng() * (k + 1)); [ord[k], ord[j]] = [ord[j], ord[k]]; }
    let ch = 0;
    for (const i of ord) {
      const h = this.field(s, i), ns = h >= 0 ? 1 : -1;
      if (ns !== s[i]) { s[i] = ns; ch++; }
    }
    return ch;
  };
  P.Hopfield.prototype.energy = function (s) {
    const N = this.N, W = this.W;
    let E = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) E -= 0.5 * W[i * N + j] * s[i] * s[j];
    return E;
  };
  P.overlap = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s / a.length; };
  /* Copia de p con una fracción `noise` de bits invertidos */
  P.corrupt = function (p, noise, rng) {
    const q = Int8Array.from(p);
    for (let i = 0; i < q.length; i++) if (rng() < noise) q[i] = -q[i];
    return q;
  };
  /* Probabilidad teórica de que un bit almacenado sea inestable (ruido cruzado gaussiano):
     P_err = ½ [1 − erf(√(N / 2P))] */
  P.hopErr = (N, nP) => 0.5 * (1 - L.erf(Math.sqrt(N / (2 * nP))));
  /* Fracción de bits inestables medida al almacenar nP patrones al azar */
  P.hopErrMC = function (N, nP, reps = 3, seed = 11) {
    let bad = 0, tot = 0;
    for (let r = 0; r < reps; r++) {
      const net = new P.Hopfield(N, L.rng(seed + 97 * r));
      for (let k = 0; k < nP; k++) net.store(net.randomPattern());
      for (const p of net.patterns) for (let i = 0; i < N; i++) { if (net.field(p, i) * p[i] < 0) bad++; tot++; }
    }
    return bad / tot;
  };

  /* ---------- Mapa autoorganizado de Kohonen 1D sobre una piel 1D ----------
     La piel [0,1) se divide en `dedos` franjas iguales; freq[d] = peso de estimulación de cada dedo
     (0 = dedo amputado). La corteza es una cadena de `m` unidades con preferencias c[k]. */
  P.somTrain = function (o) {
    const m = o.m || 60, rng = L.rng(o.seed || 5), D = o.freq.length;
    let c = o.c0 ? Float64Array.from(o.c0) : Float64Array.from({ length: m }, (_, k) => (k + 0.5) / m);
    const steps = o.steps || 20000;
    const tot = o.freq.reduce((a, b) => a + b, 0);
    for (let s = 0; s < steps; s++) {
      /* muestra un dedo según su frecuencia y un punto dentro de él */
      let u = rng() * tot, d = 0;
      while (d < D - 1 && u > o.freq[d]) { u -= o.freq[d]; d++; }
      const x = (d + rng()) / D;
      let best = 0, bd = Infinity;
      for (let k = 0; k < m; k++) { const e = Math.abs(c[k] - x); if (e < bd) { bd = e; best = k; } }
      const frac = s / steps;
      const sig = (o.sigma0 || 4) * Math.pow((o.sigma1 || 1) / (o.sigma0 || 4), frac);
      const eta = (o.eta0 || 0.1) * Math.pow((o.eta1 || 0.02) / (o.eta0 || 0.1), frac);
      const lo = Math.max(0, best - Math.ceil(3 * sig)), hi = Math.min(m - 1, best + Math.ceil(3 * sig));
      for (let k = lo; k <= hi; k++) c[k] += eta * Math.exp(-((k - best) * (k - best)) / (2 * sig * sig)) * (x - c[k]);
    }
    return c;
  };
  /* Cuántas unidades corticales prefieren cada dedo */
  P.somShare = function (c, D) {
    const cnt = new Array(D).fill(0);
    for (const v of c) cnt[Math.min(D - 1, Math.max(0, Math.floor(v * D)))]++;
    return cnt;
  };

  /* Función de error (Abramowitz y Stegun 7.1.26 refinada con la erfc de Numerical Recipes) */
  L.erf = function (x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? 1 - r : r - 1;
  };
})(typeof window !== 'undefined' ? window : globalThis);
