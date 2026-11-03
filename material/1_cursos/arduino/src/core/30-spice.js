/* ===================================================================
   30-spice.js — Simulador de circuitos (EM.spice). Sin DOM: se prueba en Node.
   Análisis nodal modificado (MNA) con Newton–Raphson para los elementos no lineales,
   continua (DC) y transitorio (regla trapezoidal / Euler atrás).
   Elementos: R, V (con resistencia interna), I, SW, D (diodo, LED, Zener), C, L,
   Q (BJT NPN/PNP, Ebers–Moll), M (MOSFET canal N, nivel 1), F (fusible).
   Convención: la corriente de un elemento de dos terminales (a→b) es positiva
   cuando fluye del nodo a al nodo b a través del elemento.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const S = (EM.spice = {});
  const VT = 0.025852; /* kT/q a 300 K */
  S.VT = VT;

  /* ---------- Modelos de diodos y LED ---------- */
  /* Is para que el diodo con factor de idealidad n tenga Vf a la corriente If */
  S.isFor = (vf, i, n) => i / (Math.exp(vf / (n * VT)) - 1);
  S.DIODES = {
    '1N4007': { Is: 2.55e-9, n: 1.75, rs: 0.04, imax: 1, vr: 1000, name: '1N4007' },
    '1N4148': { Is: 2.52e-9, n: 1.752, rs: 0.57, imax: 0.2, vr: 100, name: '1N4148' },
    'SCHOTTKY': { Is: 3e-7, n: 1.05, rs: 0.04, imax: 1, vr: 40, name: '1N5819' }
  };
  /* LED 5 mm típicos: color, Vf a 20 mA, factor n, corriente máxima continua, longitud de onda */
  S.LEDS = {
    rojo: { vf: 1.95, n: 1.8, rs: 6, imax: 0.03, nm: 630, hex: '#ff2a1a' },
    amarillo: { vf: 2.05, n: 1.85, rs: 6, imax: 0.03, nm: 590, hex: '#ffc61a' },
    verde: { vf: 2.1, n: 1.9, rs: 6, imax: 0.03, nm: 565, hex: '#2bdc4a' },
    azul: { vf: 3.0, n: 2.4, rs: 8, imax: 0.03, nm: 465, hex: '#2a6bff' },
    blanco: { vf: 3.1, n: 2.5, rs: 8, imax: 0.03, nm: 0, hex: '#f4f6ff' },
    naranja: { vf: 2.0, n: 1.85, rs: 6, imax: 0.03, nm: 605, hex: '#ff8a1a' }
  };
  for (const k in S.LEDS) { const d = S.LEDS[k]; d.Is = S.isFor(d.vf, 0.02, d.n); }

  /* ---------- Modelos de transistores ---------- */
  S.BJTS = {
    BC547: { Is: 7e-15, bf: 300, br: 4, ic: 0.1, pmax: 0.5, name: 'BC547', pol: 1 },
    '2N2222': { Is: 1.4e-14, bf: 200, br: 3, ic: 0.6, pmax: 0.5, name: '2N2222', pol: 1 },
    BC557: { Is: 3e-14, bf: 250, br: 4, ic: 0.1, pmax: 0.5, name: 'BC557', pol: -1 },
    TIP120: { Is: 1e-12, bf: 1000, br: 5, ic: 5, pmax: 65, name: 'TIP120', pol: 1 }
  };
  S.MOSFETS = {
    IRLZ44N: { vth: 1.7, k: 12, lam: 0.01, id: 47, name: 'IRLZ44N' },
    '2N7000': { vth: 2.1, k: 0.35, lam: 0.01, id: 0.2, name: '2N7000' }
  };

  /* ---------- Utilidades ---------- */
  /* Limitación de la tensión de la unión (SPICE pnjlim) */
  function pnjlim(vnew, vold, vt, vcrit) {
    if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
      if (vold > 0) {
        const arg = 1 + (vnew - vold) / vt;
        vnew = arg > 0 ? vold + vt * Math.log(arg) : vcrit;
      } else vnew = vt * Math.log(vnew / vt);
    }
    return vnew;
  }
  const expc = (x) => Math.exp(Math.min(x, 80));

  /* Resuelve A x = b (A: arreglo de Float64Array n×n, se destruye). Devuelve null si es singular */
  function lu(A, b, n) {
    for (let k = 0; k < n; k++) {
      let p = k, mx = Math.abs(A[k][k]);
      for (let i = k + 1; i < n; i++) { const v = Math.abs(A[i][k]); if (v > mx) { mx = v; p = i; } }
      if (mx < 1e-30) return null;
      if (p !== k) { const t = A[p]; A[p] = A[k]; A[k] = t; const tb = b[p]; b[p] = b[k]; b[k] = tb; }
      const Ak = A[k], d = Ak[k];
      for (let i = k + 1; i < n; i++) {
        const Ai = A[i], f = Ai[k] / d;
        if (f === 0) continue;
        for (let j = k; j < n; j++) Ai[j] -= f * Ak[j];
        b[i] -= f * b[k];
      }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = s / A[i][i];
    }
    return x;
  }
  S.solveLinear = (A, b) => { const n = b.length; return lu(A.map((r) => Float64Array.from(r)), Float64Array.from(b), n); };

  /* Forma de onda de una fuente en el instante t */
  function wave(el, t) {
    const w = el.wave;
    if (!w) return el.v;
    const off = w.offset || 0, amp = w.amp === undefined ? el.v : w.amp;
    switch (w.kind) {
      case 'sin': return off + amp * Math.sin(2 * Math.PI * w.freq * t + (w.phase || 0));
      case 'square': { const ph = (w.freq * t) % 1; return off + (ph < (w.duty === undefined ? 0.5 : w.duty) ? amp : 0); }
      case 'pulse': { const ph = ((t - (w.delay || 0)) * w.freq) % 1; return t < (w.delay || 0) ? (w.v0 || 0) : (ph < (w.duty === undefined ? 0.5 : w.duty) ? w.v1 : (w.v0 || 0)); }
      case 'tri': { const ph = (w.freq * t) % 1; return off + amp * (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph); }
      case 'fn': return w.f(t);
      default: return el.v;
    }
  }

  /* ===================================================================
     Circuito
     =================================================================== */
  class Circuit {
    constructor() {
      this.names = new Map([['0', 0], ['gnd', 0], ['GND', 0]]);
      this.nodeNames = ['0'];
      this.els = [];
      this.t = 0;
      this.x = null; /* última solución */
      this.gmin = 1e-12;
      this.warn = [];
      this.compiled = false;
    }
    node(name) {
      if (name === 0 || name === '0') return 0;
      const k = String(name);
      if (!this.names.has(k)) { this.names.set(k, this.nodeNames.length); this.nodeNames.push(k); this.compiled = false; }
      return this.names.get(k);
    }
    get nNodes() { return this.nodeNames.length; }
    /* Añade un elemento. Los terminales se dan por nombre en a, b (y c, d según el tipo). */
    add(el) {
      for (const k of ['a', 'b', 'c', 'd']) if (el[k] !== undefined) el['n' + k] = this.node(el[k]);
      if (!el.id) el.id = el.type + this.els.length;
      this.els.push(el);
      this.compiled = false;
      return el;
    }
    find(id) { return this.els.find((e) => e.id === id); }

    compile() {
      this.nbr = 0;
      this.hasNL = false;
      this.hasReact = false;
      for (const e of this.els) {
        e.br = -1;
        if (e.type === 'V' && !(e.rs > 0)) e.br = this.nbr++;
        if (e.type === 'D' || e.type === 'Q' || e.type === 'M') this.hasNL = true;
        if (e.type === 'C' || e.type === 'L') this.hasReact = true;
        if (e.type === 'D') { e.vcrit = e.n * VT * Math.log((e.n * VT) / (Math.SQRT2 * e.Is)); }
        if (e.type === 'Q') { e.vcrit = VT * Math.log(VT / (Math.SQRT2 * e.Is)); }
        e.vj = e.vj || [0, 0];
      }
      this.N = this.nNodes - 1 + this.nbr;
      this.compiled = true;
    }

    /* Estampa un elemento en (A, b). mode: 'dc' | 'tran'. x: solución previa (iteración) */
    _stamp(A, bb, x, mode, dt, method) {
      const nn = this.nNodes - 1;
      const gm = this.gmin;
      const idx = (n) => n - 1; /* n>0 */
      const addG = (a, b, g) => {
        if (a > 0) A[idx(a)][idx(a)] += g;
        if (b > 0) A[idx(b)][idx(b)] += g;
        if (a > 0 && b > 0) { A[idx(a)][idx(b)] -= g; A[idx(b)][idx(a)] -= g; }
      };
      /* inyecta corriente i hacia el nodo a (y la extrae de b) */
      const addI = (a, b, i) => { if (a > 0) bb[idx(a)] += i; if (b > 0) bb[idx(b)] -= i; };
      const volt = (n) => (n > 0 ? x[idx(n)] : 0);
      for (let n = 0; n < nn; n++) A[n][n] += gm;
      for (const e of this.els) {
        if (e.dead && e.type !== 'F') { if (e.dead === 'open' || e.dead === true) continue; }
        switch (e.type) {
          case 'R': {
            let r = e.dead === 'short' ? 1e-3 : e.r;
            if (!(r > 1e-9)) r = 1e-9;
            addG(e.na, e.nb, 1 / r);
            break;
          }
          case 'F': { /* fusible: resistencia pequeña hasta que se funde */
            addG(e.na, e.nb, e.blown ? 1e-12 : 1 / Math.max(e.r || 0.1, 1e-6));
            break;
          }
          case 'V': {
            const v = wave(e, this.t) * (e.scale === undefined ? 1 : e.scale);
            if (e.br >= 0) {
              const k = nn + e.br;
              if (e.na > 0) { A[idx(e.na)][k] += 1; A[k][idx(e.na)] += 1; }
              if (e.nb > 0) { A[idx(e.nb)][k] -= 1; A[k][idx(e.nb)] -= 1; }
              bb[k] += v;
            } else { const g = 1 / e.rs; addG(e.na, e.nb, g); addI(e.na, e.nb, v * g); }
            break;
          }
          case 'I': addI(e.nb, e.na, e.i); break;
          case 'SW': addG(e.na, e.nb, 1 / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12))); break;
          case 'C': {
            if (mode === 'tran') {
              const trap = method === 'trap';
              const g = (trap ? 2 : 1) * e.c / dt;
              addG(e.na, e.nb, g);
              addI(e.na, e.nb, g * e.vprev + (trap ? e.iprev : 0));
            }
            break;
          }
          case 'L': {
            if (mode === 'tran') {
              const trap = method === 'trap';
              const g = (trap ? dt / (2 * e.l) : dt / e.l);
              addG(e.na, e.nb, g);
              addI(e.nb, e.na, e.iprev + (trap ? g * e.vprev : 0));
            } else addG(e.na, e.nb, 1 / (e.rl || 1e-3));
            break;
          }
          case 'D': {
            /* i = Is(e^{v/nVt} − 1)  [+ ruptura inversa del Zener]; la resistencia en serie va como R aparte */
            const nVt = e.n * VT;
            const v0 = volt(e.na) - volt(e.nb);
            const vl = pnjlim(v0, e.vj[0], nVt, e.vcrit);
            e.vj[0] = vl;
            const ex = expc(vl / nVt);
            let id = e.Is * (ex - 1), gd = (e.Is / nVt) * ex;
            if (e.vz) { /* ruptura: i = −Ibv e^{−(v+Vz)/(nz Vt)} */
              const nz = e.nz || 2, vzl = -vl - e.vz;
              const exz = expc(vzl / (nz * VT));
              id += -e.ibv * exz + 0; gd += (e.ibv / (nz * VT)) * exz;
            }
            addG(e.na, e.nb, gd);
            addI(e.nb, e.na, id - gd * vl);
            e.ig = gd; e.i0 = id;
            break;
          }
          case 'Q': { /* Ebers–Moll: nodos a=colector, b=base, c=emisor */
            const p = e.pol || 1;
            const vb = volt(e.nb), vc = volt(e.na), ve = volt(e.nc);
            let vbe = p * (vb - ve), vbc = p * (vb - vc);
            vbe = pnjlim(vbe, e.vj[0], VT, e.vcrit); vbc = pnjlim(vbc, e.vj[1], VT, e.vcrit);
            e.vj[0] = vbe; e.vj[1] = vbc;
            const ebe = expc(vbe / VT), ebc = expc(vbc / VT);
            const ibe = e.Is * (ebe - 1), ibc = e.Is * (ebc - 1);
            const gbe = (e.Is / VT) * ebe, gbc = (e.Is / VT) * ebc;
            const ic = ibe - ibc - ibc / e.betaR, ib = ibe / e.bf + ibc / e.betaR; /* tipo NPN, positivas hacia dentro */
            const dIc_dbe = gbe, dIc_dbc = -gbc - gbc / e.betaR, dIb_dbe = gbe / e.bf, dIb_dbc = gbc / e.betaR;
            /* corriente que entra por cada terminal (con polaridad p) */
            const Ic = p * ic, Ib = p * ib, Ie = -(Ic + Ib);
            /* derivadas respecto a (Vb, Vc, Ve): d/dVb = dbe + dbc ; d/dVc = −dbc ; d/dVe = −dbe */
            const J = {
              c: [dIc_dbe + dIc_dbc, -dIc_dbc, -dIc_dbe],
              b: [dIb_dbe + dIb_dbc, -dIb_dbc, -dIb_dbe]
            };
            J.e = [-(J.c[0] + J.b[0]), -(J.c[1] + J.b[1]), -(J.c[2] + J.b[2])];
            const nodes = [e.nb, e.na, e.nc]; /* orden de columnas: Vb, Vc, Ve */
            const rows = [[e.na, J.c, Ic], [e.nb, J.b, Ib], [e.nc, J.e, Ie]];
            const vv = [vb, vc, ve];
            /* el punto de linealización usa las uniones limitadas: reconstruye Vb,Vc,Ve coherentes */
            const vbl = ve + p * vbe, vcl = vbl - p * vbc;
            const vl3 = [vbl, vcl, ve];
            for (const [rn, Jr, I0] of rows) {
              if (rn === 0) continue;
              let ieq = I0;
              for (let m = 0; m < 3; m++) { ieq -= Jr[m] * vl3[m]; if (nodes[m] > 0) A[idx(rn)][idx(nodes[m])] += Jr[m]; }
              bb[idx(rn)] -= ieq;
            }
            e.ic = Ic; e.ib = Ib; e.vv = vv;
            break;
          }
          case 'M': { /* MOSFET canal N: a=drenador, b=puerta, c=fuente */
            let vd = volt(e.na), vg = volt(e.nb), vs = volt(e.nc);
            let sw = false;
            if (vd < vs) { const t = vd; vd = vs; vs = t; sw = true; }
            const vgs = vg - vs, vds = vd - vs, ov = vgs - e.vth;
            let ids = 0, gm_ = 0, gds = 0;
            if (ov > 0) {
              if (vds < ov) { ids = e.k * (ov * vds - vds * vds / 2) * (1 + e.lam * vds); gm_ = e.k * vds * (1 + e.lam * vds); gds = e.k * (ov - vds) * (1 + e.lam * vds) + e.k * (ov * vds - vds * vds / 2) * e.lam; }
              else { ids = 0.5 * e.k * ov * ov * (1 + e.lam * vds); gm_ = e.k * ov * (1 + e.lam * vds); gds = 0.5 * e.k * ov * ov * e.lam; }
            }
            /* nodos efectivos (drenador/fuente intercambiados si vd<vs) */
            const D = sw ? e.nc : e.na, Sn = sw ? e.na : e.nc, G = e.nb;
            const vD = volt(D), vG = volt(G), vS = volt(Sn);
            const ieq = ids - gm_ * (vG - vS) - gds * (vD - vS);
            /* corriente ids sale del drenador hacia la fuente */
            const stampRow = (r, sgn) => {
              if (r === 0) return;
              const ri = idx(r);
              if (D > 0) A[ri][idx(D)] += sgn * gds;
              if (Sn > 0) A[ri][idx(Sn)] += sgn * (-gds - gm_);
              if (G > 0) A[ri][idx(G)] += sgn * gm_;
              bb[ri] -= sgn * ieq;
            };
            stampRow(D, 1); stampRow(Sn, -1);
            e.ids = ids * (sw ? -1 : 1);
            break;
          }
        }
      }
    }

    /* Newton para el punto actual */
    _newton(x0, mode, dt, method, gmin) {
      this.compile && !this.compiled && this.compile();
      const nn = this.nNodes - 1, N = this.N;
      let x = Float64Array.from(x0 && x0.length === N ? x0 : new Float64Array(N));
      const maxIt = this.hasNL ? 200 : 1;
      const g0 = this.gmin;
      if (gmin) this.gmin = gmin;
      let ok = !this.hasNL;
      for (let it = 0; it < maxIt; it++) {
        const A = Array.from({ length: N }, () => new Float64Array(N));
        const bb = new Float64Array(N);
        this._stamp(A, bb, x, mode, dt, method);
        const xn = lu(A, bb, N);
        if (!xn) { this.gmin = g0; return null; }
        let conv = true, mx = 0;
        for (let i = 0; i < N; i++) {
          const tol = (i < nn ? 1e-7 : 1e-9) + 1e-6 * Math.max(Math.abs(xn[i]), Math.abs(x[i]));
          if (Math.abs(xn[i] - x[i]) > tol || !isFinite(xn[i])) conv = false;
          if (i < nn) mx = Math.max(mx, Math.abs(xn[i] - x[i]));
        }
        /* amortiguación: pasos de tensión grandes se recortan (ayuda a transistores en saturación) */
        if (this.hasNL && mx > 2) {
          const a = 2 / mx;
          for (let i = 0; i < N; i++) xn[i] = x[i] + a * (xn[i] - x[i]);
          conv = false;
        }
        x = xn;
        if (conv && it > 0 && this._junctionsOk(x)) { ok = true; break; }
        if (!this.hasNL) break;
      }
      this.gmin = g0;
      if (!ok) { this.warn.push('sin convergencia'); }
      return x;
    }

    _junctionsOk(x) {
      const volt = (n) => (n > 0 ? x[n - 1] : 0);
      for (const e of this.els) {
        if (e.dead) continue;
        if (e.type === 'D') { if (Math.abs(volt(e.na) - volt(e.nb) - e.vj[0]) > 1e-6) return false; }
        else if (e.type === 'Q') {
          const p = e.pol || 1;
          if (Math.abs(p * (volt(e.nb) - volt(e.nc)) - e.vj[0]) > 1e-6 || Math.abs(p * (volt(e.nb) - volt(e.na)) - e.vj[1]) > 1e-6) return false;
        }
      }
      return true;
    }

    /* Punto de operación en continua. Devuelve true si resolvió */
    solveDC(opts = {}) {
      if (!this.compiled) this.compile();
      this.warn = [];
      let x = this._newton(opts.guess || this.x, 'dc', 0, 'be');
      if (!x || this.warn.length) { /* ayuda: aumentar gmin y reducirla paso a paso */
        this.warn = [];
        x = null;
        let guess = null;
        for (const g of [1e-3, 1e-5, 1e-7, 1e-9, 1e-12]) {
          const xx = this._newton(guess, 'dc', 0, 'be', g);
          if (!xx) continue;
          guess = xx; x = xx;
        }
        this.warn = [];
      }
      if (!x) { this.error = 'matriz singular'; return false; }
      this.error = null;
      this.x = x;
      this._finish(x);
      /* estado inicial de C y L */
      for (const e of this.els) {
        if (e.type === 'C') { e.vprev = this.v(e.na) - this.v(e.nb); e.iprev = 0; }
        if (e.type === 'L') { e.vprev = 0; e.iprev = this.v(e.na) - this.v(e.nb) === 0 ? 0 : (this.v(e.na) - this.v(e.nb)) / (e.rl || 1e-3); }
      }
      return true;
    }

    /* Un paso de tiempo dt. method: 'trap' | 'be' */
    step(dt, method = 'trap') {
      if (!this.compiled) this.compile();
      this.t += dt;
      this.warn = [];
      const x = this._newton(this.x, 'tran', dt, method);
      if (!x) { this.error = 'matriz singular'; return false; }
      this.x = x;
      /* actualizar memoria de reactivos con la solución */
      const trap = method === 'trap';
      for (const e of this.els) {
        if (e.type === 'C') {
          const v = this.v(e.na) - this.v(e.nb);
          const g = (trap ? 2 : 1) * e.c / dt;
          const i = g * (v - e.vprev) - (trap ? e.iprev : 0);
          e.iprev = i; e.vprev = v;
        } else if (e.type === 'L') {
          const v = this.v(e.na) - this.v(e.nb);
          const g = trap ? dt / (2 * e.l) : dt / e.l;
          const i = e.iprev + g * v + (trap ? g * e.vprev : 0);
          e.iprev = i; e.vprev = v;
        }
      }
      this._finish(x);
      return true;
    }

    /* Calcula corrientes y potencias de cada elemento con la solución x */
    _finish(x) {
      const nn = this.nNodes - 1;
      for (const e of this.els) {
        const va = this.v(e.na), vb = this.v(e.nb);
        e.vab = va - vb;
        switch (e.type) {
          case 'R': e.i = e.dead === 'open' || e.dead === true ? 0 : e.vab / (e.dead === 'short' ? 1e-3 : Math.max(e.r, 1e-9)); break;
          case 'F': e.i = e.vab * (e.blown ? 1e-12 : 1 / Math.max(e.r || 0.1, 1e-6)); break;
          case 'V': {
            const v = wave(e, this.t) * (e.scale === undefined ? 1 : e.scale);
            e.i = e.br >= 0 ? x[nn + e.br] : (e.vab - v) / e.rs; /* corriente de a a b DENTRO de la fuente (negativa cuando entrega) */
            e.vsrc = v;
            break;
          }
          case 'I': e.i = e.i; break;
          case 'SW': e.i = e.vab / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12)); break;
          case 'C': e.i = e.iprev || 0; break;
          case 'L': e.i = e.iprev !== undefined ? e.iprev : e.vab / (e.rl || 1e-3); break;
          case 'D': {
            if (e.dead) { e.i = 0; break; }
            const nVt = e.n * VT;
            let id = e.Is * (expc(e.vab / nVt) - 1);
            if (e.vz) id -= e.ibv * expc((-e.vab - e.vz) / ((e.nz || 2) * VT));
            e.i = id;
            break;
          }
          case 'Q': {
            const p = e.pol || 1;
            const vbe = p * (this.v(e.nb) - this.v(e.nc)), vbc = p * (this.v(e.nb) - this.v(e.na));
            const ibe = e.Is * (expc(vbe / VT) - 1), ibc = e.Is * (expc(vbc / VT) - 1);
            e.ic = p * (ibe - ibc - ibc / e.betaR); e.ib = p * (ibe / e.bf + ibc / e.betaR);
            e.vce = this.v(e.na) - this.v(e.nc);
            e.vbe = this.v(e.nb) - this.v(e.nc);
            e.p = Math.abs(e.ic * e.vce) + Math.abs(e.ib * e.vbe);
            e.i = e.ic;
            break;
          }
          case 'M': {
            let vd = this.v(e.na), vg = this.v(e.nb), vs = this.v(e.nc);
            const sw = vd < vs; if (sw) { const t = vd; vd = vs; vs = t; }
            const ov = vg - vs - e.vth, vds = vd - vs;
            let ids = 0;
            if (ov > 0) ids = vds < ov ? e.k * (ov * vds - vds * vds / 2) * (1 + e.lam * vds) : 0.5 * e.k * ov * ov * (1 + e.lam * vds);
            e.i = sw ? -ids : ids; e.ids = e.i; e.vds = this.v(e.na) - this.v(e.nc); e.vgs = this.v(e.nb) - this.v(e.nc);
            e.p = Math.abs(e.i * e.vds);
            break;
          }
        }
        if (e.type !== 'Q' && e.type !== 'M') e.p = e.vab * e.i; /* potencia absorbida (negativa si entrega) */
      }
    }

    v(n) { return n > 0 && this.x ? this.x[n - 1] : 0; }
    vNamed(name) { return this.v(this.names.get(String(name)) || 0); }
    /* corriente de la rama de una fuente de tensión ideal o equivalente (positiva si ENTREGA corriente por su terminal a) */
    isrc(e) { return -e.i; }
  }
  S.Circuit = Circuit;

  /* ===================================================================
     Constructores de elementos con modelos habituales
     =================================================================== */
  S.R = (id, a, b, r, extra) => Object.assign({ type: 'R', id, a, b, r }, extra);
  S.V = (id, a, b, v, rs = 0.05, extra) => Object.assign({ type: 'V', id, a, b, v, rs }, extra);
  S.I = (id, a, b, i) => ({ type: 'I', id, a, b, i });
  S.SW = (id, a, b, closed) => ({ type: 'SW', id, a, b, closed: !!closed });
  S.C = (id, a, b, c, extra) => Object.assign({ type: 'C', id, a, b, c, vprev: 0, iprev: 0 }, extra);
  S.L = (id, a, b, l, extra) => Object.assign({ type: 'L', id, a, b, l, vprev: 0, iprev: 0 }, extra);
  S.diode = (id, a, b, model) => { const m = typeof model === 'string' ? S.DIODES[model] : model; return { type: 'D', id, a, b, Is: m.Is, n: m.n, model: m }; };
  S.zener = (id, a, b, vz, ibv = 0.005) => ({ type: 'D', id, a, b, Is: 1e-14, n: 1, vz, ibv, nz: 2, model: { name: 'Zener ' + vz + ' V', zener: true } });
  S.bjt = (id, c, b, e, model) => { const m = typeof model === 'string' ? S.BJTS[model] : model; return { type: 'Q', id, a: c, b, c: e, Is: m.Is, bf: m.bf, betaR: m.br, pol: m.pol, model: m }; };
  S.mos = (id, d, g, s, model) => { const m = typeof model === 'string' ? S.MOSFETS[model] : model; return { type: 'M', id, a: d, b: g, c: s, vth: m.vth, k: m.k, lam: m.lam, model: m }; };
  S.fuse = (id, a, b, rating, r = 0.1) => ({ type: 'F', id, a, b, rating, r, blown: false, heat: 0 });

  /* Termistor NTC (modelo beta): R(T) = R25 exp(B (1/T − 1/T25)) con T en kelvin */
  S.ntc = (T, r25 = 10000, beta = 3950) => r25 * Math.exp(beta * (1 / (T + 273.15) - 1 / 298.15));
  S.ntcT = (R, r25 = 10000, beta = 3950) => 1 / (1 / 298.15 + Math.log(R / r25) / beta) - 273.15;
  /* Fotorresistencia: R = R10 (10/lux)^γ (R10 = resistencia a 10 lux, γ ≈ 0.7) */
  S.ldr = (lux, r10 = 20000, gamma = 0.7) => r10 * Math.pow(10 / Math.max(lux, 0.01), gamma);

  /* Código de colores de resistencias */
  S.COLORS = [
    { n: 'negro', v: 0, m: 1, hex: '#111111' }, { n: 'marrón', v: 1, m: 10, hex: '#7a4a1e', t: 1 }, { n: 'rojo', v: 2, m: 100, hex: '#d62b1f', t: 2 },
    { n: 'naranja', v: 3, m: 1e3, hex: '#ef8a17' }, { n: 'amarillo', v: 4, m: 1e4, hex: '#f2d20f' }, { n: 'verde', v: 5, m: 1e5, hex: '#1f9a3b', t: 0.5 },
    { n: 'azul', v: 6, m: 1e6, hex: '#1f4fd0', t: 0.25 }, { n: 'violeta', v: 7, m: 1e7, hex: '#7a2bc4', t: 0.1 }, { n: 'gris', v: 8, m: 1e8, hex: '#8a8d93', t: 0.05 },
    { n: 'blanco', v: 9, m: 1e9, hex: '#f2f2f2' }, { n: 'dorado', v: -1, m: 0.1, hex: '#c9a227', t: 5 }, { n: 'plateado', v: -2, m: 0.01, hex: '#b9bcc2', t: 10 }
  ];
  /* Bandas (4 o 5) para un valor en ohmios; devuelve índices de color */
  S.bands = (ohm, n = 4, tol = 5) => {
    const digits = n === 5 ? 3 : 2;
    let e = Math.floor(Math.log10(ohm)) - (digits - 1);
    let m = Math.round(ohm / Math.pow(10, e));
    if (m >= Math.pow(10, digits)) { m = Math.round(m / 10); e += 1; }
    const ds = String(m).padStart(digits, '0').split('').map(Number);
    const mulIdx = e >= 0 ? e : e === -1 ? 10 : 11;
    const tolIdx = S.COLORS.findIndex((c) => c.t === tol);
    return [...ds, mulIdx, tolIdx];
  };
  S.fromBands = (idx) => {
    const n = idx.length;
    const dig = idx.slice(0, n - 2).reduce((s, i) => s * 10 + S.COLORS[i].v, 0);
    return { ohm: dig * S.COLORS[idx[n - 2]].m, tol: S.COLORS[idx[n - 1]].t };
  };
  /* Valor legible: 4700 → "4,7 kΩ" */
  S.fmtR = (r) => {
    if (!isFinite(r)) return '∞';
    const a = Math.abs(r);
    const f = (x) => String(+x.toPrecision(3)).replace('.', ',');
    if (a >= 1e6) return f(r / 1e6) + ' MΩ';
    if (a >= 1e3) return f(r / 1e3) + ' kΩ';
    if (a >= 1) return f(r) + ' Ω';
    return f(r * 1e3) + ' mΩ';
  };
  /* Series normalizadas E12 / E24 */
  S.E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  S.E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  S.nearestE = (r, series = S.E12) => {
    const dec = Math.floor(Math.log10(r));
    let best = null, bd = Infinity;
    for (let d = dec - 1; d <= dec + 1; d++) for (const m of series) {
      const v = m * Math.pow(10, d);
      const dd = Math.abs(Math.log(v / r));
      if (dd < bd) { bd = dd; best = v; }
    }
    return +best.toPrecision(3);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
