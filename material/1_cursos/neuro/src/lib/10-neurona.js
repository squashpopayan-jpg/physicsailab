/* ===================================================================
   lib/10-neurona.js — Modelos de neurona sin DOM:
   Hodgkin-Huxley (1952) con convención moderna (reposo ≈ −65 mV),
   integrar y disparar con fuga (LIF), cable de Hodgkin-Huxley para la
   conducción del impulso y un bloqueo de canales de sodio dependiente
   del uso (anestésicos locales, modelo del receptor modulado de Hille).
   Unidades: mV, ms, µA/cm², mS/cm², µF/cm².
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const N = (L.neuro = {});

  /* ---------- Potenciales de equilibrio ----------
     Nernst: E = (RT / zF) ln(c_ext / c_int) ; Goldman-Hodgkin-Katz para K⁺, Na⁺ y Cl⁻ (mV) */
  N.RTF = (Tc = 37) => (8.314462618 * (Tc + 273.15)) / 96485.33212 * 1000;
  N.nernst = (z, cExt, cInt, Tc = 37) => (N.RTF(Tc) / z) * Math.log(cExt / cInt);
  N.ghk = function (o, Tc = 37) {
    const num = o.pK * o.Ke + o.pNa * o.Nae + o.pCl * o.Cli, den = o.pK * o.Ki + o.pNa * o.Nai + o.pCl * o.Cle;
    return N.RTF(Tc) * Math.log(num / den);
  };
  /* Concentraciones típicas de una neurona de mamífero (mM) */
  N.CONC = { Ki: 140, Ke: 5, Nai: 12, Nae: 145, Cli: 7, Cle: 110 };

  /* ---------- Hodgkin-Huxley ---------- */
  N.HH = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387 };
  /* Tasas de apertura y cierre (1/ms); φ = factor de temperatura 3^((T−6,3)/10) */
  const am = (V) => { const x = V + 40; return Math.abs(x) < 1e-7 ? 1 : (0.1 * x) / (1 - Math.exp(-x / 10)); };
  const bm = (V) => 4 * Math.exp(-(V + 65) / 18);
  const ah = (V) => 0.07 * Math.exp(-(V + 65) / 20);
  const bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
  const an = (V) => { const x = V + 55; return Math.abs(x) < 1e-7 ? 0.1 : (0.01 * x) / (1 - Math.exp(-x / 10)); };
  const bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);
  N.rates = { am, bm, ah, bh, an, bn };
  N.phi = (T) => Math.pow(3, (T - 6.3) / 10);
  /* Valores estacionarios de las compuertas a un voltaje dado */
  N.gateInf = (V) => ({ m: am(V) / (am(V) + bm(V)), h: ah(V) / (ah(V) + bh(V)), n: an(V) / (an(V) + bn(V)) });
  N.restState = function (V = -65) { const g = N.gateInf(V); return [V, g.m, g.h, g.n]; };

  /* Derivadas: y = [V, m, h, n]; o = {I, gNa, gK, gL, phi, block} */
  function hhDeriv(y, o, out) {
    const V = y[0], m = y[1], h = y[2], n = y[3], P = N.HH, ph = o.phi || 1;
    const gNa = (o.gNa === undefined ? P.gNa : o.gNa) * (1 - (o.block || 0));
    const gK = o.gK === undefined ? P.gK : o.gK, gL = o.gL === undefined ? P.gL : o.gL;
    const INa = gNa * m * m * m * h * (V - P.ENa), IK = gK * n * n * n * n * (V - P.EK), IL = gL * (V - P.EL);
    out[0] = (o.I - INa - IK - IL) / P.C;
    out[1] = ph * (am(V) * (1 - m) - bm(V) * m);
    out[2] = ph * (ah(V) * (1 - h) - bh(V) * h);
    out[3] = ph * (an(V) * (1 - n) - bn(V) * n);
    return out;
  }
  N.hhDeriv = hhDeriv;
  const k1 = [0, 0, 0, 0], k2 = [0, 0, 0, 0], k3 = [0, 0, 0, 0], k4 = [0, 0, 0, 0], tmp = [0, 0, 0, 0];
  /* Un paso de Runge-Kutta 4 (modifica y) */
  N.hhStep = function (y, o, dt) {
    hhDeriv(y, o, k1);
    for (let i = 0; i < 4; i++) tmp[i] = y[i] + 0.5 * dt * k1[i];
    hhDeriv(tmp, o, k2);
    for (let i = 0; i < 4; i++) tmp[i] = y[i] + 0.5 * dt * k2[i];
    hhDeriv(tmp, o, k3);
    for (let i = 0; i < 4; i++) tmp[i] = y[i] + dt * k3[i];
    hhDeriv(tmp, o, k4);
    for (let i = 0; i < 4; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return y;
  };
  /* Simulación completa. o = {T, dt, I: número o función t→I, y0, phi, gNa, gK, block, every}
     Devuelve {t, V, m, h, n, spikes, INa, IK} muestreado cada `every` pasos */
  N.hhSim = function (o) {
    const dt = o.dt || 0.01, T = o.T || 100, every = o.every || 1;
    const y = (o.y0 || N.restState()).slice();
    const If = typeof o.I === 'function' ? o.I : () => o.I || 0;
    const opt = { I: 0, phi: o.phi || 1, gNa: o.gNa, gK: o.gK, block: o.block || 0 };
    const out = { t: [], V: [], m: [], h: [], n: [], spikes: [] };
    const steps = Math.round(T / dt);
    let prev = y[0];
    for (let k = 0; k <= steps; k++) {
      const t = k * dt;
      if (k % every === 0) { out.t.push(t); out.V.push(y[0]); out.m.push(y[1]); out.h.push(y[2]); out.n.push(y[3]); }
      if (k === steps) break;
      opt.I = If(t);
      N.hhStep(y, opt, dt);
      if (prev < 0 && y[0] >= 0) {
        /* interpolación lineal del cruce por 0 mV */
        out.spikes.push(t + (dt * (0 - prev)) / (y[0] - prev));
      }
      prev = y[0];
    }
    return out;
  };
  /* Frecuencia de disparo sostenida (Hz) con corriente constante I: cuenta espigas en [tA, T] */
  N.hhRate = function (I, o = {}) {
    const T = o.T || 500, tA = o.tA || 100;
    const s = N.hhSim({ T, dt: o.dt || 0.01, I, every: 1000000, phi: o.phi, block: o.block });
    const sp = s.spikes.filter((t) => t >= tA);
    if (sp.length < 2) return 0;
    return (1000 * (sp.length - 1)) / (sp[sp.length - 1] - sp[0]);
  };

  /* ---------- Integrar y disparar con fuga (LIF) ----------
     τm dV/dt = −(V − EL) + R·I ; si V ≥ Vth → espiga, V = Vr, periodo refractario tref */
  N.LIF = { tau: 10, EL: -65, Vth: -50, Vr: -65, R: 10, tref: 2 };
  N.lifRate = function (I, p = N.LIF) {
    const Vinf = p.EL + p.R * I;
    if (Vinf <= p.Vth) return 0;
    const isi = p.tref + p.tau * Math.log((Vinf - p.Vr) / (Vinf - p.Vth));
    return 1000 / isi;
  };
  /* Simulación con corriente I(t) (nA) y entrada sináptica opcional syn(t) (nA) */
  N.lifSim = function (o) {
    const p = Object.assign({}, N.LIF, o.p || {}), dt = o.dt || 0.05, T = o.T || 200;
    const If = typeof o.I === 'function' ? o.I : () => o.I || 0;
    let V = o.V0 === undefined ? p.EL : o.V0, refr = 0;
    const t = [], Vs = [], spikes = [];
    for (let k = 0; k * dt <= T; k++) {
      const tt = k * dt;
      t.push(tt); Vs.push(V);
      if (refr > 0) { refr -= dt; V = p.Vr; continue; }
      V += (dt / p.tau) * (-(V - p.EL) + p.R * If(tt));
      if (V >= p.Vth) { spikes.push(tt + dt); V = p.Vr; refr = p.tref; Vs[Vs.length - 1] = 20; }
    }
    return { t, V: Vs, spikes };
  };

  /* ---------- Potenciales postsinápticos: suma temporal y espacial ----------
     Cada espiga presináptica de la sinapsis j produce una corriente w_j·(t/τs)·e^{1−t/τs}
     (función alfa, pico w_j en t = τs). Devuelve la corriente total en t. */
  N.alphaPSC = function (spikes, w, tau = 2) {
    return function (t) {
      let s = 0;
      for (let j = 0; j < spikes.length; j++) for (const ts of spikes[j]) {
        const u = t - ts;
        if (u > 0 && u < 12 * tau) s += w[j] * (u / tau) * Math.exp(1 - u / tau);
      }
      return s;
    };
  };

  /* ---------- Cable de Hodgkin-Huxley (conducción del impulso) ----------
     n compartimentos de longitud dx (cm), radio a (cm), resistividad axial Ri (Ω·cm).
     Acoplamiento gc = a / (2 Ri dx²) en S/cm² → ×1000 mS/cm². block[i] ∈ [0,1] reduce gNa
     del compartimento i. Euler explícito con paso dt (ms) pequeño. */
  N.Cable = function (o = {}) {
    this.n = o.n || 60;
    this.dx = o.dx || 0.1;
    this.a = o.a || 0.0238;
    this.Ri = o.Ri || 35.4;
    this.phi = o.phi || 1;
    this.gc = (1000 * this.a) / (2 * this.Ri * this.dx * this.dx);
    this.block = new Float64Array(this.n);
    this.reset();
  };
  N.Cable.prototype.reset = function () {
    const n = this.n, r = N.restState();
    this.V = new Float64Array(n).fill(r[0]);
    this.m = new Float64Array(n).fill(r[1]);
    this.h = new Float64Array(n).fill(r[2]);
    this.nn = new Float64Array(n).fill(r[3]);
    this.t = 0;
    this.crossT = new Float64Array(n).fill(NaN);
    this.Iinj = 0; this.injUntil = -1;
  };
  N.Cable.prototype.stimulate = function (I = 200, dur = 0.5) { this.Iinj = I; this.injUntil = this.t + dur; };
  N.Cable.prototype.step = function (dt = 0.005) {
    const n = this.n, P = N.HH, V = this.V, gc = this.gc, ph = this.phi;
    const dV = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const Vi = V[i], mi = this.m[i], hi = this.h[i], ni = this.nn[i];
      const left = i > 0 ? V[i - 1] : Vi, right = i < n - 1 ? V[i + 1] : Vi;
      const Iax = gc * (left - 2 * Vi + right);
      const gNa = P.gNa * (1 - this.block[i]);
      const Iion = gNa * mi * mi * mi * hi * (Vi - P.ENa) + P.gK * ni * ni * ni * ni * (Vi - P.EK) + P.gL * (Vi - P.EL);
      const Iext = i === 0 && this.t < this.injUntil ? this.Iinj : 0;
      dV[i] = (Iax - Iion + Iext) / P.C;
      this.m[i] += dt * ph * (am(Vi) * (1 - mi) - bm(Vi) * mi);
      this.h[i] += dt * ph * (ah(Vi) * (1 - hi) - bh(Vi) * hi);
      this.nn[i] += dt * ph * (an(Vi) * (1 - ni) - bn(Vi) * ni);
    }
    for (let i = 0; i < n; i++) {
      const old = V[i];
      V[i] += dt * dV[i];
      if (isNaN(this.crossT[i]) && old < 0 && V[i] >= 0) this.crossT[i] = this.t + (dt * (0 - old)) / (V[i] - old);
    }
    this.t += dt;
  };
  /* Velocidad de conducción (m/s) entre los compartimentos i y j a partir de los cruces por 0 mV */
  N.Cable.prototype.velocity = function (i, j) {
    const ti = this.crossT[i], tj = this.crossT[j];
    if (!(tj > ti)) return NaN;
    return ((j - i) * this.dx * 0.01) / ((tj - ti) * 1e-3);
  };
  /* Corre un estímulo y devuelve hasta dónde llegó el impulso y la velocidad */
  N.cableRun = function (o = {}) {
    const c = new N.Cable(o);
    if (o.block) for (let i = 0; i < c.n; i++) c.block[i] = o.block(i, c.n);
    const dt = o.dt || 0.005, T = o.T || 6;
    c.stimulate(o.I || 200, o.dur || 0.5);
    while (c.t < T) c.step(dt);
    let reach = -1;
    for (let i = 0; i < c.n; i++) if (!isNaN(c.crossT[i])) reach = i;
    const i1 = Math.round(c.n * 0.2), i2 = Math.round(c.n * 0.45);
    return { cable: c, reach, v: c.velocity(i1, i2) };
  };

  /* ---------- Bloqueo dependiente del uso (receptor modulado, simplificado) ----------
     El fármaco (concentración relativa c) se une sobre todo a canales inactivados:
     db/dt = kon·c·(1 − h)^p·(1 − b) − koff·b ; gNa efectiva = gNa·(1 − b).
     Con p > 1 la afinidad se concentra en los canales muy inactivados (durante y justo después de cada espiga). */
  N.useDepSim = function (o) {
    const dt = o.dt || 0.01, T = o.T || 1000, c = o.c || 0, kon = o.kon || 0.004, koff = o.koff || 0.002, pw = o.p || 1;
    const y = N.restState();
    const ki = (h) => kon * c * Math.pow(1 - h, pw);
    let b = o.b0 === undefined ? (c > 0 ? ki(y[2]) / (ki(y[2]) + koff) : 0) : o.b0;
    const If = typeof o.I === 'function' ? o.I : () => o.I || 0;
    const opt = { I: 0, phi: 1, block: b };
    const out = { t: [], V: [], b: [], spikes: [] };
    let prev = y[0];
    const every = o.every || 10;
    for (let k = 0; k * dt <= T; k++) {
      const t = k * dt;
      if (k % every === 0) { out.t.push(t); out.V.push(y[0]); out.b.push(b); }
      opt.I = If(t); opt.block = b;
      N.hhStep(y, opt, dt);
      b += dt * (ki(y[2]) * (1 - b) - koff * b);
      if (prev < 0 && y[0] >= 0) out.spikes.push(t);
      prev = y[0];
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
