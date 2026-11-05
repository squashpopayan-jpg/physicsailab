/* ===================================================================
   30-spice.js — Simulador de circuitos (EM.spice). Sin DOM: se prueba en Node.
   Análisis nodal modificado (MNA) con Newton–Raphson para los elementos no lineales.
   Análisis: punto de operación (DC), transitorio (trapezoidal / Euler atrás), barrido DC
   y respuesta en frecuencia (31-spice-ac.js).
   Elementos:
     R  resistor            V  fuente de tensión (con resistencia interna rs)   I  fuente de corriente
     C  condensador (c, o cvar = {c0, vj, m} para varicap)   L  inductor (con fem opcional: motores)
     SW interruptor         D  diodo / LED / Zener (Shockley + ruptura)
     Q  BJT (Ebers–Moll + Early)    M  MOSFET / JFET (ley cuadrática, canal N o P)
     OA amplificador operacional (ganancia finita, polo, SR, saturación a los rieles)
     X  transformador (inductores acoplados)   E  fuente de tensión controlada por tensión
     G  fuente de corriente controlada por tensión
   Convención: la corriente de un elemento de dos terminales (a→b) es positiva
   cuando fluye del nodo a al nodo b a través del elemento.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const S = (EM.spice = {});
  const KB = 1.380649e-23, QE = 1.602176634e-19;
  const TNOM = 300.15;
  S.TNOM = TNOM;
  S.vtOf = (T) => (KB * T) / QE;
  S.VT = S.vtOf(TNOM);
  const EG = 1.11;

  /* ---------- Utilidades ---------- */
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
  S.pnjlim = pnjlim;

  /* LU con pivoteo parcial sobre un arreglo plano n×n (se destruye). Resuelve en b y devuelve false si es singular. */
  function luFlat(A, b, n) {
    for (let k = 0; k < n; k++) {
      let p = k, mx = Math.abs(A[k * n + k]);
      for (let i = k + 1; i < n; i++) { const v = Math.abs(A[i * n + k]); if (v > mx) { mx = v; p = i; } }
      if (mx < 1e-300) return false;
      if (p !== k) {
        for (let j = 0; j < n; j++) { const t = A[p * n + j]; A[p * n + j] = A[k * n + j]; A[k * n + j] = t; }
        const tb = b[p]; b[p] = b[k]; b[k] = tb;
      }
      const d = A[k * n + k];
      for (let i = k + 1; i < n; i++) {
        const f = A[i * n + k] / d;
        if (f === 0) continue;
        for (let j = k + 1; j < n; j++) A[i * n + j] -= f * A[k * n + j];
        A[i * n + k] = 0;
        b[i] -= f * b[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let j = i + 1; j < n; j++) s -= A[i * n + j] * b[j];
      b[i] = s / A[i * n + i];
    }
    return true;
  }
  S.solveLinear = (A, b) => {
    const n = b.length, M = new Float64Array(n * n), x = Float64Array.from(b);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) M[i * n + j] = A[i][j];
    return luFlat(M, x, n) ? x : null;
  };

  /* Forma de onda de una fuente en el instante t */
  function wave(el, t) {
    const w = el.wave;
    if (!w) return el.v;
    const off = w.offset || 0, amp = w.amp === undefined ? el.v : w.amp;
    switch (w.kind) {
      case 'sin': {
        const d = w.delay || 0;
        if (t < d) return off + amp * Math.sin(w.phase || 0) * 0;
        return off + amp * Math.exp(-(w.damp || 0) * (t - d)) * Math.sin(2 * Math.PI * w.freq * (t - d) + (w.phase || 0));
      }
      case 'square': { const ph = ((w.freq * t) % 1 + 1) % 1; return off + (ph < (w.duty === undefined ? 0.5 : w.duty) ? amp : -amp); }
      case 'pulse': { const dl = w.delay || 0; if (t < dl) return w.v0 || 0; const ph = (((t - dl) * w.freq) % 1 + 1) % 1; return ph < (w.duty === undefined ? 0.5 : w.duty) ? w.v1 : (w.v0 || 0); }
      case 'tri': { const ph = ((w.freq * t) % 1 + 1) % 1; return off + amp * (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph); }
      case 'saw': { const ph = ((w.freq * t) % 1 + 1) % 1; return off + amp * (2 * ph - 1); }
      case 'fn': return w.f(t);
      default: return el.v;
    }
  }
  S.wave = wave;

  /* Recorte suave de la salida del A.O.: lineal dentro de [lo+w, hi−w], tanh fuera. Devuelve [vo, dvo/dy] */
  function softClamp(y, lo, hi) {
    const w = Math.max(0.15 * (hi - lo), 1e-3);
    const ch = hi - w, cl = lo + w;
    if (y > ch) { const th = Math.tanh((y - ch) / w); return [ch + w * th, 1 - th * th]; }
    if (y < cl) { const th = Math.tanh((y - cl) / w); return [cl + w * th, 1 - th * th]; }
    return [y, 1];
  }
  S.softClamp = softClamp;

  /* ===================================================================
     Circuito
     =================================================================== */
  class Circuit {
    constructor() {
      this.names = new Map([['0', 0], ['gnd', 0], ['GND', 0]]);
      this.nodeNames = ['0'];
      this.els = [];
      this.t = 0;
      this.x = null;
      this.gmin = 1e-12;
      this.warn = [];
      this.compiled = false;
      this.T = TNOM;
      this.restart = true;
      this.error = null;
    }
    node(name) {
      if (name === 0 || name === '0') return 0;
      const k = String(name);
      if (!this.names.has(k)) { this.names.set(k, this.nodeNames.length); this.nodeNames.push(k); this.compiled = false; }
      return this.names.get(k);
    }
    get nNodes() { return this.nodeNames.length; }
    add(el) {
      if (el.W) { el.wn = el.W.map((q) => [this.node(q[0]), this.node(q[1])]); if (el.a === undefined) { el.a = el.W[0][0]; el.b = el.W[0][1]; } }
      for (const k of ['a', 'b', 'c', 'd', 'e']) if (el[k] !== undefined) el['n' + k] = this.node(el[k]);
      if (!el.id) el.id = el.type + this.els.length;
      this.els.push(el);
      this.compiled = false;
      return el;
    }
    find(id) { return this.els.find((e) => e.id === id); }

    /* Parámetros dependientes de la temperatura de unión */
    refreshTemp(e) {
      const T = e.T || this.T;
      const vt = S.vtOf(T);
      if (e.type === 'D' || e.type === 'DX') {
        const n = e.n || 1;
        e.vt = vt;
        e.IsT = e.Is * Math.pow(T / TNOM, 3 / n) * Math.exp(((T / TNOM - 1) * EG) / (n * vt));
        e.vcrit = n * vt * Math.log((n * vt) / (Math.SQRT2 * e.IsT));
      } else if (e.type === 'Q') {
        e.vt = vt;
        e.IsT = e.Is * Math.pow(T / TNOM, 3) * Math.exp(((T / TNOM - 1) * EG) / vt);
        e.vcrit = vt * Math.log(vt / (Math.SQRT2 * e.IsT));
      }
    }

    /* matriz de inductancias del transformador y su inversa */
    _xmat(e) {
      const n = e.wn.length, L = [];
      for (let i = 0; i < n; i++) { L.push([]); for (let j = 0; j < n; j++) L[i].push(i === j ? e.ls[i] : e.k * Math.sqrt(e.ls[i] * e.ls[j])); }
      /* inversa por Gauss–Jordan */
      const M = L.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
      for (let k = 0; k < n; k++) {
        let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
        [M[k], M[p]] = [M[p], M[k]];
        const d = M[k][k];
        for (let j = 0; j < 2 * n; j++) M[k][j] /= d;
        for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j]; }
      }
      e.Gm = M.map((r) => r.slice(n));
      e.iw = e.iw || new Array(n).fill(0); e.vw = e.vw || new Array(n).fill(0);
      e.hw = new Array(n).fill(0); e.Gw = null;
    }

    compile() {
      this.nbr = 0;
      this.hasNL = false;
      this.hasReact = false;
      this.hasTime = false;
      let vmax = 1;
      for (const e of this.els) {
        e.br = -1;
        if ((e.type === 'V' && !(e.rs > 0)) || e.type === 'E' || e.type === 'REG') e.br = this.nbr++;
        if (e.type === 'REG' && !e.mode) e.mode = 'cv';
        if (e.type === 'D' || e.type === 'Q' || e.type === 'M' || e.type === 'OA' || e.type === 'REG' || e.type === 'DX') this.hasNL = true;
        if (e.type === 'C' || e.type === 'L' || e.type === 'X' || e.type === 'OA') this.hasReact = true;
        if (e.type === 'V') { vmax = Math.max(vmax, Math.abs(e.v || 0), e.wave ? Math.abs(e.wave.amp || 0) + Math.abs(e.wave.offset || 0) : 0, e.wave && e.wave.v1 ? Math.abs(e.wave.v1) : 0); if (e.wave) this.hasTime = true; }
        if (e.type === 'I' && e.wave) this.hasTime = true;
        if (e.type === 'D' || e.type === 'Q' || e.type === 'DX') this.refreshTemp(e);
        if (e.type === 'X') this._xmat(e);
        e.vj = e.vj || [0, 0];
      }
      this.vmax = vmax;
      this.N = this.nNodes - 1 + this.nbr;
      this.A = new Float64Array(this.N * this.N);
      this.bvec = new Float64Array(this.N);
      this.compiled = true;
    }

    /* Estampa de todos los elementos en (A, b). mode: 'dc' | 'tran'. x: solución previa (iteración) */
    _stamp(A, bb, x, mode, dt, method, sscale) {
      const nn = this.nNodes - 1, N = this.N;
      const gm0 = this.gmin;
      const sc = sscale === undefined ? 1 : sscale;
      const volt = (n) => (n > 0 ? x[n - 1] : 0);
      const addG = (a, b, g) => {
        if (a > 0) A[(a - 1) * N + a - 1] += g;
        if (b > 0) A[(b - 1) * N + b - 1] += g;
        if (a > 0 && b > 0) { A[(a - 1) * N + b - 1] -= g; A[(b - 1) * N + a - 1] -= g; }
      };
      const addI = (a, b, i) => { if (a > 0) bb[a - 1] += i; if (b > 0) bb[b - 1] -= i; };
      const addA = (r, c, v) => { if (r > 0 && c > 0) A[(r - 1) * N + c - 1] += v; };
      for (let n = 0; n < nn; n++) A[n * N + n] += gm0;
      for (const e of this.els) {
        if (e.dead) continue;
        switch (e.type) {
          case 'R': addG(e.na, e.nb, 1 / Math.max(e.r, 1e-9)); break;
          case 'V': {
            const v = wave(e, this.t) * (e.scale === undefined ? 1 : e.scale) * sc;
            if (e.br >= 0) {
              const k = nn + e.br;
              if (e.na > 0) { A[(e.na - 1) * N + k] += 1; A[k * N + e.na - 1] += 1; }
              if (e.nb > 0) { A[(e.nb - 1) * N + k] -= 1; A[k * N + e.nb - 1] -= 1; }
              bb[k] += v;
            } else { const g = 1 / e.rs; addG(e.na, e.nb, g); addI(e.na, e.nb, v * g); }
            break;
          }
          case 'I': addI(e.nb, e.na, (e.wave ? wave(e, this.t) : e.i) * sc); break;
          case 'SW': addG(e.na, e.nb, 1 / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12))); break;
          case 'C': {
            if (mode === 'tran') {
              const trap = method === 'trap';
              let c = e.c;
              if (e.cvar) { const vr = Math.max(-(e.vprev || 0), -0.4 * e.cvar.vj); c = e.cvar.c0 / Math.pow(1 + vr / e.cvar.vj, e.cvar.m); }
              const g = (trap ? 2 : 1) * c / dt;
              e.gc = g;
              addG(e.na, e.nb, g);
              addI(e.na, e.nb, g * e.vprev + (trap ? e.iprev : 0));
            }
            break;
          }
          case 'L': {
            const em = e.emf || 0;
            if (mode === 'tran') {
              const trap = method === 'trap';
              const lh = e.lsat ? e.l / (1 + (e.iprev / e.lsat) ** 2) : e.l;
              e.lh = lh;
              const g = trap ? dt / (2 * lh) : dt / lh;
              addG(e.na, e.nb, g);
              addI(e.na, e.nb, -(e.iprev + (trap ? g * e.vprev : 0) - (trap ? 2 : 1) * g * em));
            } else { const g = 1 / (e.rl || 1e-3); addG(e.na, e.nb, g); addI(e.na, e.nb, g * em); }
            break;
          }
          case 'X': { /* transformador de n devanados: e.wn = [[a,b],...] */
            const n = e.wn.length;
            let Gw;
            if (mode === 'tran') {
              const f = method === 'trap' ? dt / 2 : dt, trap = method === 'trap';
              Gw = e.Gm.map((r) => r.map((g) => g * f));
              for (let k = 0; k < n; k++) {
                let h = e.iw[k];
                if (trap) for (let j = 0; j < n; j++) h += Gw[k][j] * e.vw[j];
                e.hw[k] = h;
                addI(e.wn[k][0], e.wn[k][1], -h);
              }
            } else {
              Gw = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 / (e.rdc ? e.rdc[i] : 1e-3) : 0)));
            }
            e.Gw = Gw;
            for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) {
              const g = Gw[k][j], [ak, bk] = e.wn[k], [aj, bj] = e.wn[j];
              if (ak > 0) { if (aj > 0) A[(ak - 1) * N + aj - 1] += g; if (bj > 0) A[(ak - 1) * N + bj - 1] -= g; }
              if (bk > 0) { if (aj > 0) A[(bk - 1) * N + aj - 1] -= g; if (bj > 0) A[(bk - 1) * N + bj - 1] += g; }
            }
            break;
          }
          case 'E': { /* a,b salida; c,d control */
            const k = nn + e.br;
            if (e.na > 0) { A[(e.na - 1) * N + k] += 1; A[k * N + e.na - 1] += 1; }
            if (e.nb > 0) { A[(e.nb - 1) * N + k] -= 1; A[k * N + e.nb - 1] -= 1; }
            if (e.nc > 0) A[k * N + e.nc - 1] -= e.gain;
            if (e.nd > 0) A[k * N + e.nd - 1] += e.gain;
            break;
          }
          case 'G': { /* corriente gain·(vc−vd) de a hacia b */
            const g = e.gain;
            if (e.na > 0) { addA(e.na, e.nc, g); addA(e.na, e.nd, -g); }
            if (e.nb > 0) { addA(e.nb, e.nc, -g); addA(e.nb, e.nd, g); }
            break;
          }
          case 'D': {
            const nVt = (e.n || 1) * e.vt;
            const v0 = volt(e.na) - volt(e.nb);
            const vl = pnjlim(v0, e.vj[0], nVt, e.vcrit);
            e.vj[0] = vl;
            const ex = expc(vl / nVt);
            let id = e.IsT * (ex - 1), gd = (e.IsT / nVt) * ex;
            if (e.vz) {
              const nz = e.nz || 2, vzl = -vl - e.vz;
              const exz = expc(vzl / (nz * e.vt));
              id += -e.ibv * exz; gd += (e.ibv / (nz * e.vt)) * exz;
            }
            addG(e.na, e.nb, gd);
            addI(e.nb, e.na, id - gd * vl);
            e.gd = gd;
            break;
          }
          case 'Q': {
            const p = e.pol || 1, vt = e.vt;
            const vb = volt(e.nb), vc = volt(e.na), ve = volt(e.nc);
            let vbe = p * (vb - ve), vbc = p * (vb - vc);
            vbe = pnjlim(vbe, e.vj[0], vt, e.vcrit); vbc = pnjlim(vbc, e.vj[1], vt, e.vcrit);
            e.vj[0] = vbe; e.vj[1] = vbc;
            const ebe = expc(vbe / vt), ebc = expc(vbc / vt);
            const ibe = e.IsT * (ebe - 1), ibc = e.IsT * (ebc - 1);
            const gbe = (e.IsT / vt) * ebe, gbc = (e.IsT / vt) * ebc;
            const va = e.vaf > 0 ? e.vaf : 0;
            let f = 1, df = 0;
            if (va) { f = 1 - vbc / va; if (f < 0.05) f = 0.05; else df = -1 / va; }
            const ict = ibe - ibc;
            const ic = f * ict - ibc / e.betaR, ib = ibe / e.bf + ibc / e.betaR;
            const dIc_dbe = f * gbe, dIc_dbc = -f * gbc - gbc / e.betaR + ict * df;
            const dIb_dbe = gbe / e.bf, dIb_dbc = gbc / e.betaR;
            const Ic = p * ic, Ib = p * ib, Ie = -(Ic + Ib);
            const J = {
              c: [dIc_dbe + dIc_dbc, -dIc_dbc, -dIc_dbe],
              b: [dIb_dbe + dIb_dbc, -dIb_dbc, -dIb_dbe]
            };
            J.e = [-(J.c[0] + J.b[0]), -(J.c[1] + J.b[1]), -(J.c[2] + J.b[2])];
            const nodes = [e.nb, e.na, e.nc];
            const rows = [[e.na, J.c, Ic], [e.nb, J.b, Ib], [e.nc, J.e, Ie]];
            const vbl = ve + p * vbe, vcl = vbl - p * vbc;
            const vl3 = [vbl, vcl, ve];
            for (const [rn, Jr, I0] of rows) {
              if (rn === 0) continue;
              let ieq = I0;
              for (let m = 0; m < 3; m++) { ieq -= Jr[m] * vl3[m]; if (nodes[m] > 0) A[(rn - 1) * N + nodes[m] - 1] += Jr[m]; }
              bb[rn - 1] -= ieq;
            }
            e.J = J;
            break;
          }
          case 'M': { /* a=drenador, b=puerta, c=fuente */
            const p = e.pol || 1;
            let d = p * volt(e.na), g = p * volt(e.nb), s = p * volt(e.nc);
            let sw = false;
            if (d < s) { const t = d; d = s; s = t; sw = true; }
            const vgs = g - s, vds = d - s, ov = vgs - e.vth;
            let ids = 0, gm_ = 0, gds = 0;
            const lam = e.lam || 0;
            if (ov > 0) {
              if (vds < ov) { ids = e.k * (ov * vds - vds * vds / 2) * (1 + lam * vds); gm_ = e.k * vds * (1 + lam * vds); gds = e.k * (ov - vds) * (1 + lam * vds) + e.k * (ov * vds - vds * vds / 2) * lam; }
              else { ids = 0.5 * e.k * ov * ov * (1 + lam * vds); gm_ = e.k * ov * (1 + lam * vds); gds = 0.5 * e.k * ov * ov * lam; }
            }
            const D = sw ? e.nc : e.na, Sn = sw ? e.na : e.nc, G = e.nb;
            const vD = volt(D), vG = volt(G), vS = volt(Sn);
            const ieq = p * ids - gm_ * (vG - vS) - gds * (vD - vS);
            const stampRow = (r, sgn) => {
              if (r === 0) return;
              const ri = r - 1;
              if (D > 0) A[ri * N + D - 1] += sgn * gds;
              if (Sn > 0) A[ri * N + Sn - 1] += sgn * (-gds - gm_);
              if (G > 0) A[ri * N + G - 1] += sgn * gm_;
              bb[ri] -= sgn * ieq;
            };
            stampRow(D, 1); stampRow(Sn, -1);
            e.gm = gm_; e.gds = gds; e.dn = D; e.sn = Sn;
            break;
          }
          case 'REG': { /* a=salida, b=entrada, c=común/ajuste. Rama: corriente inyectada en la salida */
            const sg = e.pol || 1, k = nn + e.br;
            const vin = volt(e.nb), vcom = volt(e.nc);
            const ra = vcom + sg * e.vref, rb = vin - sg * e.vdo, eps = 0.15;
            const sq = Math.sqrt((ra - rb) * (ra - rb) + eps * eps);
            let vt, dA, dB;
            if (sg > 0) { vt = 0.5 * (ra + rb - sq); dA = 0.5 * (1 - (ra - rb) / sq); dB = 0.5 * (1 + (ra - rb) / sq); }
            else { vt = 0.5 * (ra + rb + sq); dA = 0.5 * (1 + (ra - rb) / sq); dB = 0.5 * (1 - (ra - rb) / sq); }
            if (e.na > 0) A[(e.na - 1) * N + k] -= 1;
            if (e.nb > 0) A[(e.nb - 1) * N + k] += 1;
            const mode = e.mode || 'cv';
            if (mode === 'cv') {
              if (e.na > 0) A[k * N + e.na - 1] += 1;
              A[k * N + k] += e.rout || 0.05;
              if (e.nc > 0) A[k * N + e.nc - 1] -= dA;
              if (e.nb > 0) A[k * N + e.nb - 1] -= dB;
              bb[k] += vt - dA * vcom - dB * vin;
            } else { A[k * N + k] += 1; bb[k] += mode === 'cc' ? sg * (e.ilim || 1.5) : 0; }
            const iq = sg * (e.iq || 0) * Math.min(1, Math.max(0, sg * (vin - vcom) / 3));
            if (e.nb > 0) bb[e.nb - 1] -= iq;
            if (e.nc > 0) bb[e.nc - 1] += iq;
            e.dA = dA; e.dB = dB; e.iqq = iq; e.vtg = vt;
            break;
          }
          case 'DX': { /* a,b control (ánodo, cátodo del LED); corriente ctr·Id de c hacia d */
            const nVt = (e.n || 1) * e.vt;
            const v0 = volt(e.na) - volt(e.nb);
            const vl = pnjlim(v0, e.vj[0], nVt, e.vcrit);
            e.vj[0] = vl;
            const ex = expc(vl / nVt);
            /* el fototransistor satura: la corriente se anula al bajar V_CE hacia 0 (factor tanh) */
            const vcd = volt(e.nc) - volt(e.nd), fs = 0.15, th = Math.tanh(vcd / fs), fp = (1 - th * th) / fs;
            const g0 = e.ctr * e.IsT * (ex - 1), gd0 = e.ctr * (e.IsT / nVt) * ex;
            const id = g0 * th, gd = gd0 * th, gc = g0 * fp;
            const ieq = id - gd * vl - gc * vcd;
            const rowC = (r, sg) => { if (r > 0) { if (e.na > 0) A[(r - 1) * N + e.na - 1] += sg * gd; if (e.nb > 0) A[(r - 1) * N + e.nb - 1] -= sg * gd; if (e.nc > 0) A[(r - 1) * N + e.nc - 1] += sg * gc; if (e.nd > 0) A[(r - 1) * N + e.nd - 1] -= sg * gc; bb[r - 1] -= sg * ieq; } };
            rowC(e.nc, 1); rowC(e.nd, -1);
            e.gdx = gd;
            break;
          }
          case 'OA': { /* a=salida, b=entrada +, c=entrada −, d=V+, e=V− */
            const hiV = e.nd !== undefined ? volt(e.nd) : e.vcc, loV = e.ne !== undefined ? volt(e.ne) : e.vee;
            const hi = hiV - (e.dropH === undefined ? 1.5 : e.dropH), lo = loV + (e.dropL === undefined ? 1.5 : e.dropL);
            const vd = volt(e.nb) - volt(e.nc) + (e.vos || 0);
            const A0 = e.A0 * (this.a0s || 1);
            let y, dy;
            if (mode === 'tran' && e.tau > 0) {
              const a = e.tau / dt;
              const y0 = (a * (e.y || 0) + A0 * vd) / (1 + a);
              dy = A0 / (1 + a); y = y0;
              if (e.sr > 0) {
                const hiS = (e.y || 0) + e.sr * dt, loS = (e.y || 0) - e.sr * dt;
                if (y0 > hiS) { y = hiS; dy = 0; } else if (y0 < loS) { y = loS; dy = 0; }
              }
              /* el nodo interno no puede irse más allá de los rieles (evita el «enrollado» y permite recuperar la saturación) */
              { const ww = Math.max(0.15 * (hi - lo), 1e-3) * 2; if (y > hi + ww) { y = hi + ww; dy = 0; } else if (y < lo - ww) { y = lo - ww; dy = 0; } }
            } else { y = A0 * vd; dy = A0; }
            const [vo, sl] = softClamp(y, lo, hi);
            const go = 1 / (e.rout || 75);
            const k = sl * dy;
            let oc = false;
            if (e.oc) { const ioc = go * (vo - volt(e.na)); if (ioc > 0) oc = true; }
            if (e.na > 0 && !oc) {
              A[(e.na - 1) * N + e.na - 1] += go;
              if (e.nb > 0) A[(e.na - 1) * N + e.nb - 1] -= go * k;
              if (e.nc > 0) A[(e.na - 1) * N + e.nc - 1] += go * k;
              bb[e.na - 1] += go * (vo - k * (volt(e.nb) - volt(e.nc)));
            }
            if (e.rin > 0) addG(e.nb, e.nc, 1 / e.rin);
            e.yc = y; e.voc = vo; e.slope = k; e.hi = hi; e.lo = lo; e.sl1 = sl;
            break;
          }
        }
      }
    }

    /* Newton para el punto actual */
    _newton(x0, mode, dt, method, gmin, sscale) {
      if (!this.compiled) this.compile();
      const nn = this.nNodes - 1, N = this.N;
      if (N === 0) return new Float64Array(0);
      let x = Float64Array.from(x0 && x0.length === N ? x0 : new Float64Array(N));
      const maxIt = this.hasNL ? 150 : 1;
      const g0 = this.gmin;
      if (gmin) this.gmin = gmin;
      let ok = !this.hasNL;
      const A = this.A, bb = this.bvec;
      const lim = Math.max(2, 0.15 * this.vmax);
      for (let it = 0; it < maxIt; it++) {
        A.fill(0); bb.fill(0);
        this._stamp(A, bb, x, mode, dt, method, sscale);
        const xn = Float64Array.from(bb);
        if (!luFlat(A, xn, N)) { this.gmin = g0; return null; }
        let conv = true, mx = 0;
        for (let i = 0; i < N; i++) {
          const tol = (i < nn ? 1e-5 : 1e-8) + 1e-4 * Math.max(Math.abs(xn[i]), Math.abs(x[i]));
          if (Math.abs(xn[i] - x[i]) > tol || !isFinite(xn[i])) conv = false;
          if (i < nn) mx = Math.max(mx, Math.abs(xn[i] - x[i]));
        }
        if (this.hasNL && mx > lim) {
          const a = lim / mx;
          for (let i = 0; i < N; i++) xn[i] = x[i] + a * (xn[i] - x[i]);
          conv = false;
        }
        x = xn;
        this._dbg = { it, conv, mx };
        if (!this.hasNL) { ok = true; break; }
        if (conv && it > 0 && this._junctionsOk(x)) { ok = true; break; }
      }
      this.gmin = g0;
      if (!ok) this.warn.push('sin convergencia');
      return ok ? x : (this._lastBad = x, null);
    }

    _junctionsOk(x) {
      const volt = (n) => (n > 0 ? x[n - 1] : 0);
      for (const e of this.els) {
        if (e.dead) continue;
        if (e.type === 'D') { const v = volt(e.na) - volt(e.nb); if (Math.abs(v - e.vj[0]) > 2e-5 + 1e-4 * Math.abs(v)) return false; }
        else if (e.type === 'Q') {
          const p = e.pol || 1;
          const vbe = p * (volt(e.nb) - volt(e.nc)), vbc = p * (volt(e.nb) - volt(e.na));
          if (Math.abs(vbe - e.vj[0]) > 2e-5 + 1e-4 * Math.abs(vbe) || Math.abs(vbc - e.vj[1]) > 2e-5 + 1e-4 * Math.abs(vbc)) return false;
        }
      }
      return true;
    }

    /* Punto de operación en continua. Devuelve true si resolvió */
    solveDC(opts = {}) {
      if (!this.compiled) this.compile();
      this.warn = [];
      this._dt = 0;
      this.t = opts.t === undefined ? 0 : opts.t;
      if (!opts.keep) for (const e of this.els) if (e.vj) e.vj = [0, 0];
      let x = this._newton(opts.guess || this.x, 'dc', 0, 'be');
      if (!x) {
        /* ayuda 1: gmin decreciente */
        this.warn = [];
        let guess = null;
        for (const g of [1e-2, 1e-3, 1e-5, 1e-7, 1e-9, 1e-12]) {
          const xx = this._newton(guess, 'dc', 0, 'be', g);
          if (!xx) continue;
          guess = xx; x = xx;
        }
        if (x) x = this._newton(x, 'dc', 0, 'be');
      }
      if (!x && this.els.some((e) => e.type === 'OA')) {
        /* ayuda 1b: continuación en la ganancia de los A.O. (lazo cerrado con desplazamiento o saturación) */
        this.warn = [];
        let guess = null;
        for (const s of [1e-5, 1e-4, 1e-3, 1e-2, 0.1, 0.3, 1]) {
          this.a0s = s;
          const xx = this._newton(guess, 'dc', 0, 'be', 1e-9);
          if (!xx) { guess = null; continue; }
          guess = xx;
        }
        this.a0s = 1;
        if (guess) x = this._newton(guess, 'dc', 0, 'be');
      }
      this.a0s = 1;
      if (!x) {
        /* ayuda 2: aumento progresivo de las fuentes */
        this.warn = [];
        let guess = null;
        for (let s = 0.05; s <= 1.0001; s += 0.05) {
          const xx = this._newton(guess, 'dc', 0, 'be', 1e-9, Math.min(1, s));
          if (!xx) { guess = null; continue; }
          guess = xx;
        }
        if (guess) x = this._newton(guess, 'dc', 0, 'be', 1e-12);
      }
      this.warn = [];
      if (!x) { this.error = 'sin convergencia'; return false; }
      this.error = null;
      this.x = x;
      this._finish(x);
      if (!opts.noEvents && this._events()) {
        for (let k = 0; k < 12; k++) {
          const xx = this._newton(this.x, 'dc', 0, 'be');
          if (!xx) break;
          this.x = xx; this._finish(xx);
          if (!this._events()) break;
        }
      }
      for (const e of this.els) {
        if (e.type === 'C') { e.vprev = this.v(e.na) - this.v(e.nb); e.iprev = 0; e.i = 0; }
        if (e.type === 'L') { const v = this.v(e.na) - this.v(e.nb); e.vprev = v; e.iprev = (v - (e.emf || 0)) / (e.rl || 1e-3); }
        if (e.type === 'X') {
          e.vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
          e.iw = e.vw.map((v, k) => v / (e.rdc ? e.rdc[k] : 1e-3));
        }
        if (e.type === 'OA') e.y = e.yc;
      }
      this.restart = true;
      return true;
    }

    /* Un paso de tiempo dt. method: 'trap' | 'be' */
    step(dt, method = 'trap') {
      if (!this.compiled) this.compile();
      if (this.restart) { method = 'be'; this.restart = false; }
      const t0 = this.t;
      this.t += dt;
      this.warn = [];
      let x = this._newton(this.x, 'tran', dt, method);
      if (!x) {
        /* reintento con sub-pasos de Euler atrás */
        this.t = t0; this.warn = [];
        const save = this._saveState();
        const n = 4;
        let ok = true;
        for (let k = 0; k < n && ok; k++) {
          this.t += dt / n;
          const xs = this._newton(this.x, 'tran', dt / n, 'be');
          if (!xs) { ok = false; break; }
          this.x = xs;
          this._advance(xs, dt / n, 'be');
        }
        if (!ok) { this._restoreState(save); this.t = t0; this.error = 'sin convergencia'; return false; }
        this._finish(this.x);
        return true;
      }
      this.x = x;
      this._advance(x, dt, method);
      this._finish(x);
      if (this._events()) this.restart = true;
      return true;
    }

    /* eventos: modos de los reguladores y funciones externas (this.hooks). Devuelve true si algo cambió */
    _events() {
      let ch = false;
      for (const e of this.els) {
        if (e.type !== 'REG' || e.dead) continue;
        const sg = e.pol || 1, il = e.ilim || 1.5, ro = e.rout || 0.05;
        const m = e.mode || 'cv';
        let nm = m;
        if (m === 'cv') { if (sg * e.i > il * (1 + 1e-6)) nm = 'cc'; else if (sg * e.i < -1e-9) nm = 'off'; }
        else if (m === 'cc') { if (sg * e.vout >= sg * e.vtg - ro * il) nm = 'cv'; }
        else if (m === 'off') { if (sg * (e.vtg - e.vout) > 1e-6) nm = 'cv'; }
        if (nm !== m) { e.mode = nm; ch = true; }
      }
      if (this.hooks) for (const h of this.hooks) if (h(this, this._dt || 0)) ch = true;
      return ch;
    }

    _saveState() { return { x: this.x && Float64Array.from(this.x), st: this.els.map((e) => [e.vprev, e.iprev, e.vw && e.vw.slice(), e.iw && e.iw.slice(), e.y, e.vj && e.vj.slice()]) }; }
    _restoreState(s) { this.x = s.x; this.els.forEach((e, k) => { [e.vprev, e.iprev, e.vw, e.iw, e.y] = s.st[k]; if (s.st[k][5]) e.vj = s.st[k][5]; }); }

    /* actualiza la memoria de los elementos reactivos con la solución del paso */
    _advance(x, dt, method) {
      const trap = method === 'trap';
      for (const e of this.els) {
        if (e.dead) { if (e.type === 'C') { e.vprev = 0; e.iprev = 0; } continue; }
        if (e.type === 'C') {
          const v = this.v(e.na) - this.v(e.nb);
          let c = e.c;
          if (e.cvar) { const vr = Math.max(-(e.vprev || 0), -0.4 * e.cvar.vj); c = e.cvar.c0 / Math.pow(1 + vr / e.cvar.vj, e.cvar.m); }
          const g = (trap ? 2 : 1) * c / dt;
          const i = g * (v - e.vprev) - (trap ? e.iprev : 0);
          e.iprev = i; e.vprev = v;
        } else if (e.type === 'L') {
          const v = this.v(e.na) - this.v(e.nb), em = e.emf || 0;
          const lh = e.lh || e.l;
          const g = trap ? dt / (2 * lh) : dt / lh;
          const i = e.iprev + g * (v - em) + (trap ? g * (e.vprev - em) : 0);
          e.iprev = i; e.vprev = v;
        } else if (e.type === 'X') {
          const n = e.wn.length, vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
          const ni = [];
          for (let k = 0; k < n; k++) { let i = e.hw[k]; for (let j = 0; j < n; j++) i += e.Gw[k][j] * vw[j]; ni.push(i); }
          e.iw = ni; e.vw = vw;
        } else if (e.type === 'OA') e.y = e.yc;
      }
    }

    /* Calcula corrientes y potencias de cada elemento con la solución x */
    _finish(x) {
      const nn = this.nNodes - 1;
      for (const e of this.els) {
        const va = this.v(e.na), vb = this.v(e.nb);
        e.vab = va - vb;
        if (e.dead) { e.i = 0; e.p = 0; continue; }
        switch (e.type) {
          case 'R': e.i = e.vab / Math.max(e.r, 1e-9); break;
          case 'V': {
            const v = wave(e, this.t) * (e.scale === undefined ? 1 : e.scale);
            e.i = e.br >= 0 ? x[nn + e.br] : (e.vab - v) / e.rs; /* a→b dentro de la fuente (negativa si entrega) */
            e.vsrc = v;
            break;
          }
          case 'I': e.vsrc = e.wave ? wave(e, this.t) : e.i; e.iout = e.vsrc; break;
          case 'SW': e.i = e.vab / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12)); break;
          case 'C': e.i = e.iprev || 0; break;
          case 'L': e.i = e.iprev !== undefined ? e.iprev : e.vab / (e.rl || 1e-3); break;
          case 'X': {
            const vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
            const n = vw.length, cur = [];
            for (let k = 0; k < n; k++) { let i = e.Gw ? e.hw[k] : 0; if (e.Gw) for (let j = 0; j < n; j++) i += e.Gw[k][j] * vw[j]; cur.push(i); }
            e.iw = cur; e.vw = vw; e.i = cur[0]; e.pw = vw.reduce((s, v, k) => s + v * cur[k], 0);
            break;
          }
          case 'E': e.i = x[nn + e.br]; break;
          case 'REG': e.i = x[nn + e.br]; e.vin = this.v(e.nb); e.vout = va; e.vdrop = e.vin - va; break;
          case 'DX': {
            const nVt = (e.n || 1) * e.vt;
            e.vcd = this.v(e.nc) - this.v(e.nd);
            e.i = e.ctr * e.IsT * (expc((this.v(e.na) - this.v(e.nb)) / nVt) - 1) * Math.tanh(e.vcd / 0.15);
            break;
          }
          case 'G': e.i = e.gain * (this.v(e.nc) - this.v(e.nd)); break;
          case 'D': {
            const nVt = (e.n || 1) * e.vt;
            let id = e.IsT * (expc(e.vab / nVt) - 1);
            if (e.vz) id -= e.ibv * expc((-e.vab - e.vz) / ((e.nz || 2) * e.vt));
            e.i = id;
            break;
          }
          case 'Q': {
            const p = e.pol || 1;
            const vbe = p * (this.v(e.nb) - this.v(e.nc)), vbc = p * (this.v(e.nb) - this.v(e.na));
            const ibe = e.IsT * (expc(vbe / e.vt) - 1), ibc = e.IsT * (expc(vbc / e.vt) - 1);
            let f = 1;
            if (e.vaf > 0) f = Math.max(0.05, 1 - vbc / e.vaf);
            e.ic = p * (f * (ibe - ibc) - ibc / e.betaR); e.ib = p * (ibe / e.bf + ibc / e.betaR);
            e.ie = -(e.ic + e.ib);
            e.vce = this.v(e.na) - this.v(e.nc);
            e.vbe = this.v(e.nb) - this.v(e.nc);
            e.i = e.ic;
            break;
          }
          case 'M': {
            const p = e.pol || 1;
            let d = p * this.v(e.na), g = p * this.v(e.nb), s = p * this.v(e.nc);
            const sw = d < s; if (sw) { const t = d; d = s; s = t; }
            const ov = g - s - e.vth, vds = d - s, lam = e.lam || 0;
            let ids = 0;
            if (ov > 0) ids = vds < ov ? e.k * (ov * vds - vds * vds / 2) * (1 + lam * vds) : 0.5 * e.k * ov * ov * (1 + lam * vds);
            e.i = p * (sw ? -ids : ids); e.ids = e.i; e.vds = this.v(e.na) - this.v(e.nc); e.vgs = this.v(e.nb) - this.v(e.nc);
            e.ov = ov;
            break;
          }
          case 'OA': {
            e.iout = (e.voc - va) / (e.rout || 75); /* corriente que la salida entrega al circuito */
            e.vout = va; e.i = e.iout;
            break;
          }
        }
        switch (e.type) {
          case 'Q': e.p = Math.abs(e.ic * e.vce) + Math.abs(e.ib * e.vbe); break;
          case 'M': e.p = Math.abs(e.i * e.vds); break;
          case 'OA': { const vcc = (e.nd !== undefined ? this.v(e.nd) : e.vcc) - (e.ne !== undefined ? this.v(e.ne) : e.vee); e.p = (e.iq || 0) * vcc + Math.abs(e.iout) * Math.abs(va - (e.iout > 0 ? (e.ne !== undefined ? this.v(e.ne) : e.vee) : (e.nd !== undefined ? this.v(e.nd) : e.vcc))); break; }
          case 'X': e.p = e.pw; break;
          case 'REG': e.p = e.vdrop * Math.abs(e.i) + e.vin * (e.iqq ? Math.abs(e.iqq) : 0); break;
          case 'DX': e.p = e.vab * e.i + (e.vcd || 0) * e.i * 0; break;
          case 'V': e.p = e.vab * e.i; break;
          case 'I': e.p = -e.vab * e.iout; break;
          case 'G': e.p = e.vab * e.i; break;
          default: e.p = e.vab * (e.i || 0);
        }
      }
    }

    v(n) { return n > 0 && this.x ? this.x[n - 1] : 0; }
    vNamed(name) { return this.v(this.names.get(String(name)) || 0); }
    /* corriente que ENTREGA una fuente de tensión por su terminal a */
    isrc(e) { return -e.i; }
  }
  S.Circuit = Circuit;

  /* ===================================================================
     Constructores de elementos
     =================================================================== */
  S.R = (id, a, b, r, extra) => Object.assign({ type: 'R', id, a, b, r }, extra);
  S.V = (id, a, b, v, rs = 0, extra) => Object.assign({ type: 'V', id, a, b, v, rs }, extra);
  S.I = (id, a, b, i) => ({ type: 'I', id, a, b, i });
  S.SW = (id, a, b, closed) => ({ type: 'SW', id, a, b, closed: !!closed });
  S.C = (id, a, b, c, extra) => Object.assign({ type: 'C', id, a, b, c, vprev: 0, iprev: 0 }, extra);
  S.L = (id, a, b, l, extra) => Object.assign({ type: 'L', id, a, b, l, vprev: 0, iprev: 0 }, extra);
  S.diode = (id, a, b, m) => ({ type: 'D', id, a, b, Is: m.Is, n: m.n, vz: m.vz, ibv: m.ibv, nz: m.nz, model: m });
  S.bjt = (id, c, b, e, m) => ({ type: 'Q', id, a: c, b, c: e, Is: m.Is, bf: m.bf, betaR: m.br, vaf: m.vaf, pol: m.pol || 1, model: m });
  S.mos = (id, d, g, s, m) => ({ type: 'M', id, a: d, b: g, c: s, vth: m.vth, k: m.k, lam: m.lam, pol: m.pol || 1, model: m });

  /* Is para que el diodo con factor de idealidad n tenga Vf a la corriente If (a 300,15 K) */
  S.isFor = (vf, i, n) => i / (Math.exp(vf / (n * S.VT)) - 1);

  /* Termistor NTC (modelo beta): R(T) = R25 exp(B (1/T − 1/T25)) con T en °C */
  S.ntc = (T, r25 = 10000, beta = 3950) => r25 * Math.exp(beta * (1 / (T + 273.15) - 1 / 298.15));
  S.ntcT = (R, r25 = 10000, beta = 3950) => 1 / (1 / 298.15 + Math.log(R / r25) / beta) - 273.15;
  /* Fotorresistencia: R = R10 (10/lux)^γ */
  S.ldr = (lux, r10 = 20000, gamma = 0.7) => r10 * Math.pow(10 / Math.max(lux, 0.01), gamma);

  /* Código de colores de resistencias */
  S.COLORS = [
    { n: 'negro', v: 0, m: 1, hex: '#111111' }, { n: 'marrón', v: 1, m: 10, hex: '#7a4a1e', t: 1 }, { n: 'rojo', v: 2, m: 100, hex: '#d62b1f', t: 2 },
    { n: 'naranja', v: 3, m: 1e3, hex: '#ef8a17' }, { n: 'amarillo', v: 4, m: 1e4, hex: '#f2d20f' }, { n: 'verde', v: 5, m: 1e5, hex: '#1f9a3b', t: 0.5 },
    { n: 'azul', v: 6, m: 1e6, hex: '#1f4fd0', t: 0.25 }, { n: 'violeta', v: 7, m: 1e7, hex: '#7a2bc4', t: 0.1 }, { n: 'gris', v: 8, m: 1e8, hex: '#8a8d93', t: 0.05 },
    { n: 'blanco', v: 9, m: 1e9, hex: '#f2f2f2' }, { n: 'dorado', v: -1, m: 0.1, hex: '#c9a227', t: 5 }, { n: 'plateado', v: -2, m: 0.01, hex: '#b9bcc2', t: 10 }
  ];
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
  S.fmtR = (r) => {
    if (!isFinite(r)) return '∞';
    const a = Math.abs(r);
    const f = (x) => String(+x.toPrecision(3));
    if (a >= 1e9) return f(r / 1e9) + ' GΩ';
    if (a >= 1e6) return f(r / 1e6) + ' MΩ';
    if (a >= 1e3) return f(r / 1e3) + ' kΩ';
    if (a >= 1) return f(r) + ' Ω';
    return f(r * 1e3) + ' mΩ';
  };
  /* Series normalizadas IEC 60063 */
  S.E6 = [1.0, 1.5, 2.2, 3.3, 4.7, 6.8];
  S.E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  S.E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  S.E96 = [1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12, 4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76];
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
