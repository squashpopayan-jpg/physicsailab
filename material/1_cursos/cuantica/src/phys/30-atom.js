/* ===================================================================
   phys/30-atom.js — Átomos (unidades atómicas de Hartree: ħ = mₑ = e = 4πε₀ = 1).
   · Hidrógeno exacto: E_n, R_nl, valores esperados.
   · Resolvedor radial de Numerov en malla logarítmica r = eˣ, con u = √r·w:
       w'' = [2r²(V − ε) + (l + ½)²] w
     disparo hacia fuera y hacia dentro, conteo de nodos y corrección
     variacional δε = ½ w_c (w'_fuera − w'_dentro) / ∫ r² w² dx.
   · Átomo autoconsistente esférico: Hartree, Hartree–Fock (un orbital),
     DFT-LDA (intercambio de Slater + correlación VWN5) y solo intercambio.
   · Datos atómicos de referencia (energías exactas, HF, LDA del NIST,
     ionización, electronegatividad) y reglas de Slater.
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const S = P.sf, I = P.integ;
  const A = (P.atom = {});
  const FOURPI = 4 * Math.PI;

  /* ---------- Hidrógeno (y iones hidrogenoides) exacto ---------- */
  A.hE = (n, Z = 1) => (-Z * Z) / (2 * n * n);
  A.hR = function (n, l, r, Z = 1) {
    const rho = (2 * Z * r) / n;
    const N = Math.sqrt(Math.pow((2 * Z) / n, 3) * (S.fact(n - l - 1) / (2 * n * S.fact(n + l))));
    return N * Math.exp(-rho / 2) * Math.pow(rho, l) * S.laguerre(n - l - 1, 2 * l + 1, rho);
  };
  A.hRmean = (n, l, Z = 1) => (3 * n * n - l * (l + 1)) / (2 * Z);
  A.hRmostProbable = function (n, l, Z = 1) {
    /* máximo global de P(r) = r² R² por búsqueda en malla + refinamiento */
    let best = 0, bv = -1;
    const rmax = (4 * n * n) / Z;
    for (let i = 1; i <= 4000; i++) { const r = (rmax * i) / 4000; const v = r * r * A.hR(n, l, r, Z) ** 2; if (v > bv) { bv = v; best = r; } }
    return P.util.golden((r) => -r * r * A.hR(n, l, r, Z) ** 2, Math.max(1e-6, best - rmax / 4000), best + rmax / 4000).x;
  };

  /* ---------- Malla logarítmica ---------- */
  A.grid = function (o = {}) {
    const rmin = o.rmin || 1e-7, rmax = o.rmax || 50;
    let N = o.N || 2501;
    if (N % 2 === 0) N++;
    const x0 = Math.log(rmin), x1 = Math.log(rmax), h = (x1 - x0) / (N - 1);
    const r = new Float64Array(N), x = new Float64Array(N);
    for (let i = 0; i < N; i++) { x[i] = x0 + i * h; r[i] = Math.exp(x[i]); }
    return { N, h, r, x, rmin, rmax };
  };
  /* ∫ f(r) d³r para f esférica: 4π ∫ f r³ dx */
  A.int3 = function (g, f) { const y = new Float64Array(g.N); for (let i = 0; i < g.N; i++) y[i] = FOURPI * f[i] * g.r[i] ** 3; return I.simpson(y, g.h); };

  /* ---------- Resolvedor radial (Numerov + disparo) ----------
     V: potencial (sin término centrífugo) en la malla; l; nr = número de nodos radiales.
     Devuelve {E, w, u, iter, ok}. */
  A.solveRadial = function (g, V, l, nr, o = {}) {
    const N = g.N, h = g.h, r = g.r;
    const L2 = (l + 0.5) ** 2, h12 = (h * h) / 12;
    const cent = (i) => (l * (l + 1)) / (2 * r[i] * r[i]);
    let elo = Infinity;
    for (let i = 0; i < N; i++) elo = Math.min(elo, V[i] + cent(i));
    let eup = Math.max(V[N - 1] + cent(N - 1), -1e-12);
    if (V[N - 1] < 0) eup = Math.min(0, eup);
    let e = o.E !== undefined && o.E > elo && o.E < eup ? o.E : 0.5 * (elo + eup);
    if (!(e > elo)) e = elo + 1e-6;
    const Zc = -V[0] * r[0];
    const f = new Float64Array(N), yo = new Float64Array(N), yi = new Float64Array(N), w = new Float64Array(N);
    let it = 0, ok = false, ic = 0, iinf = N - 1;
    const tol = o.tol || 1e-12;
    for (it = 0; it < 400; it++) {
      for (let i = 0; i < N; i++) f[i] = 2 * r[i] * r[i] * (V[i] - e) + L2;
      ic = -1;
      for (let i = N - 3; i > 1; i--) if (f[i] < 0) { ic = i; break; }
      if (ic < 0) { elo = e; e = 0.5 * (elo + eup); continue; }
      if (ic > N - 12) { eup = e; e = 0.5 * (elo + eup); continue; }
      /* hacia fuera */
      yo[0] = Math.pow(r[0], l + 0.5) * (1 - (Zc * r[0]) / (l + 1));
      yo[1] = Math.pow(r[1], l + 0.5) * (1 - (Zc * r[1]) / (l + 1));
      let nodes = 0;
      for (let i = 1; i <= ic; i++) {
        yo[i + 1] = (2 * yo[i] * (1 + 5 * h12 * f[i]) - yo[i - 1] * (1 - h12 * f[i - 1])) / (1 - h12 * f[i + 1]);
        if (i < ic && yo[i] !== 0 && ((yo[i] > 0) !== (yo[i + 1] > 0))) nodes++;
      }
      if (nodes !== nr) {
        if (nodes > nr) eup = e; else elo = e;
        e = 0.5 * (elo + eup);
        if (eup - elo < 1e-15) break;
        continue;
      }
      /* hacia dentro desde donde la solución ya decayó ~e^{−50} */
      let acc = 0;
      iinf = N - 1;
      for (let i = ic + 1; i < N; i++) { acc += Math.sqrt(Math.max(f[i], 0)) * h; if (acc > 50) { iinf = i; break; } }
      if (iinf < ic + 3) iinf = Math.min(N - 1, ic + 3);
      yi.fill(0);
      yi[iinf] = 1e-30;
      yi[iinf - 1] = 1e-30 * Math.exp(h * Math.sqrt(Math.max(f[iinf - 1], 1e-12)));
      for (let i = iinf - 1; i >= ic; i--) yi[i - 1] = (2 * yi[i] * (1 + 5 * h12 * f[i]) - yi[i + 1] * (1 - h12 * f[i + 1])) / (1 - h12 * f[i - 1]);
      const sc = yo[ic] / yi[ic];
      for (let i = ic - 1; i <= iinf; i++) yi[i] *= sc;
      for (let i = 0; i < N; i++) w[i] = i <= ic ? yo[i] : i <= iinf ? yi[i] : 0;
      const q = new Float64Array(N);
      for (let i = 0; i < N; i++) q[i] = r[i] * r[i] * w[i] * w[i];
      const nrm = I.simpson(q, h);
      const dOut = (yo[ic + 1] - yo[ic - 1]) / (2 * h), dIn = (yi[ic + 1] - yi[ic - 1]) / (2 * h);
      const de = (0.5 * w[ic] * (dOut - dIn)) / nrm;
      if (de > 0) elo = Math.max(elo, e); else eup = Math.min(eup, e);
      let en = e + de;
      if (!(en > elo && en < eup)) en = 0.5 * (elo + eup);
      if (Math.abs(de) < tol * Math.max(1, Math.abs(e))) { ok = true; e = en; const s = 1 / Math.sqrt(nrm); for (let i = 0; i < N; i++) w[i] *= s; break; }
      e = en;
    }
    if (!ok) {
      /* normaliza lo que haya */
      const q = new Float64Array(N);
      for (let i = 0; i < N; i++) q[i] = r[i] * r[i] * w[i] * w[i];
      const nrm = I.simpson(q, h) || 1;
      for (let i = 0; i < N; i++) w[i] /= Math.sqrt(nrm);
    }
    /* signo: positivo cerca del origen */
    let s0 = 0;
    for (let i = 0; i < N && s0 === 0; i++) s0 = Math.sign(w[i]);
    if (s0 < 0) for (let i = 0; i < N; i++) w[i] = -w[i];
    const u = new Float64Array(N);
    for (let i = 0; i < N; i++) u[i] = Math.sqrt(r[i]) * w[i];
    return { E: e, w, u, iter: it, ok, ic };
  };

  /* ---------- Intercambio y correlación LDA (sin polarización de espín) ---------- */
  const CX = 0.75 * Math.pow(3 / Math.PI, 1 / 3);
  A.xc = {
    rs: (n) => Math.pow(3 / (FOURPI * n), 1 / 3),
    /* Intercambio de Dirac–Slater: ε_x = −(3/4)(3n/π)^{1/3}, v_x = (4/3)ε_x */
    ex: (n) => (n > 1e-30 ? -CX * Math.pow(n, 1 / 3) : 0),
    vx: (n) => (n > 1e-30 ? -(4 / 3) * CX * Math.pow(n, 1 / 3) : 0),
    /* Correlación de Vosko–Wilk–Nusair (VWN5, ajuste a Ceperley–Alder), paramagnética */
    vwn(n) {
      if (!(n > 1e-30)) return [0, 0];
      const Aa = 0.0310907, b = 3.72744, c = 12.9352, x0 = -0.10498;
      const rs = Math.pow(3 / (FOURPI * n), 1 / 3), x = Math.sqrt(rs);
      const X = x * x + b * x + c, X0 = x0 * x0 + b * x0 + c, Qq = Math.sqrt(4 * c - b * b);
      const at = Math.atan(Qq / (2 * x + b));
      const ec = Aa * (Math.log((x * x) / X) + ((2 * b) / Qq) * at - ((b * x0) / X0) * (Math.log(((x - x0) ** 2) / X) + ((2 * (b + 2 * x0)) / Qq) * at));
      const den = (2 * x + b) ** 2 + Qq * Qq;
      const dec = Aa * (2 / x - (2 * x + b) / X - (4 * b) / den - ((b * x0) / X0) * (2 / (x - x0) - (2 * x + b) / X - (4 * (b + 2 * x0)) / den));
      return [ec, ec - (x / 6) * dec];
    },
    /* Correlación de Perdew–Zunger (1981), paramagnética, para comparar */
    pz(n) {
      if (!(n > 1e-30)) return [0, 0];
      const rs = Math.pow(3 / (FOURPI * n), 1 / 3);
      if (rs >= 1) {
        const g = -0.1423, b1 = 1.0529, b2 = 0.3334, sq = Math.sqrt(rs);
        const d = 1 + b1 * sq + b2 * rs;
        const ec = g / d;
        return [ec, (ec * (1 + (7 / 6) * b1 * sq + (4 / 3) * b2 * rs)) / d];
      }
      const a = 0.0311, b = -0.048, c = 0.002, dd = -0.0116, L = Math.log(rs);
      const ec = a * L + b + c * rs * L + dd * rs;
      return [ec, a * L + (b - a / 3) + (2 / 3) * c * rs * L + ((2 * dd - c) / 3) * rs];
    }
  };

  /* ---------- Configuraciones electrónicas (estado fundamental) ---------- */
  A.SYM = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
  A.NAME = ['', 'hidrógeno', 'helio', 'litio', 'berilio', 'boro', 'carbono', 'nitrógeno', 'oxígeno', 'flúor', 'neón', 'sodio', 'magnesio', 'aluminio', 'silicio', 'fósforo', 'azufre', 'cloro', 'argón', 'potasio', 'calcio', 'escandio', 'titanio', 'vanadio', 'cromo', 'manganeso', 'hierro', 'cobalto', 'níquel', 'cobre', 'cinc', 'galio', 'germanio', 'arsénico', 'selenio', 'bromo', 'kriptón'];
  /* Orden de Madelung (n + l, luego n) */
  A.MADELUNG = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1]];
  A.LLET = 'spdfg';
  A.config = function (Z) {
    const occ = [];
    let left = Z;
    for (const [n, l] of A.MADELUNG) {
      if (left <= 0) break;
      const f = Math.min(left, 2 * (2 * l + 1));
      occ.push({ n, l, f });
      left -= f;
    }
    /* excepciones: Cr y Cu (un electrón 4s pasa a 3d) */
    if (Z === 24 || Z === 29) {
      const s4 = occ.find((o) => o.n === 4 && o.l === 0), d3 = occ.find((o) => o.n === 3 && o.l === 2);
      s4.f -= 1; d3.f += 1;
    }
    return occ.sort((a, b) => a.n - b.n || a.l - b.l);
  };
  A.configStr = (occ) => occ.map((o) => `${o.n}${A.LLET[o.l]}${o.f > 1 ? String(o.f).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) : o.f === 1 ? '¹' : ''}`).join(' ');

  /* Reglas de Slater: Z efectivo para un electrón del orbital (n,l) */
  A.slaterZeff = function (Z, n, l, occ = A.config(Z)) {
    let s = 0;
    const group = (o) => (o.l <= 1 ? `${o.n}sp` : `${o.n}${A.LLET[o.l]}`);
    const g = l <= 1 ? `${n}sp` : `${n}${A.LLET[l]}`;
    for (const o of occ) {
      let cnt = o.f;
      if (o.n === n && o.l === l) cnt -= 1; /* el propio electrón no se apantalla a sí mismo */
      if (cnt <= 0) continue;
      const og = group(o);
      if (og === g) s += cnt * (n === 1 ? 0.30 : 0.35);
      else if (l <= 1) {
        if (o.n === n - 1) s += cnt * 0.85;
        else if (o.n < n - 1) s += cnt * 1.0;
        else if (o.n === n && o.l > 1) s += 0; /* d del mismo n no apantallan s,p */
      } else {
        /* electrones d o f: todo lo interior apantalla 1.00 */
        if (o.n < n || (o.n === n && o.l < l)) s += cnt * 1.0;
      }
    }
    return Z - s;
  };

  /* ---------- Átomo autoconsistente ---------- */
  A.METHODS = {
    lda: 'DFT-LDA (Slater + VWN)',
    x: 'Solo intercambio LDA (Slater)',
    hartree: 'Hartree (sin intercambio)',
    hf: 'Hartree–Fock (un orbital: H, He, iones)'
  };
  /* Potencial inicial apantallado sencillo (tipo Thomas–Fermi) */
  function startPotential(g, Z, Nel) {
    const V = new Float64Array(g.N);
    const ion = Z - Nel;
    for (let i = 0; i < g.N; i++) {
      const r = g.r[i];
      const x = r * Math.pow(Z, 1 / 3) / 0.8853;
      const phi = 1 / Math.pow(1 + 0.02747 * Math.sqrt(x) + 1.243 * x - 0.1486 * x * Math.sqrt(x) + 0.2303 * x * x + 0.007298 * x * x * Math.sqrt(x) + 0.006944 * x * x * x, 1);
      const Zr = Math.max(ion + 1, Z * phi);
      V[i] = -Math.min(Z, Zr) / r;
    }
    return V;
  }
  A.hartree = function (g, n) {
    const N = g.N, y1 = new Float64Array(N), y2 = new Float64Array(N);
    for (let i = 0; i < N; i++) { const r = g.r[i]; y1[i] = FOURPI * n[i] * r * r * r; y2[i] = FOURPI * n[i] * r * r; }
    const Q = I.cumulative(y1, g.h), C2 = I.cumulative(y2, g.h);
    const tot2 = C2[N - 1];
    const VH = new Float64Array(N);
    for (let i = 0; i < N; i++) VH[i] = Q[i] / g.r[i] + (tot2 - C2[i]);
    return { VH, Q };
  };

  class AtomSCF {
    constructor(o = {}) {
      this.Z = o.Z || 1;
      this.method = o.method || 'lda';
      this.occ = (o.occ || A.config(this.Z)).map((x) => ({ ...x }));
      this.Nel = this.occ.reduce((s, x) => s + x.f, 0);
      if (this.method === 'hf' && this.occ.length !== 1) this.method = 'lda';
      this.mix = o.mix === undefined ? 0.4 : o.mix;
      this.corr = o.corr || 'vwn';
      this.g = o.grid || A.grid(o.gridOpts || {});
      const g = this.g;
      this.Vext = new Float64Array(g.N);
      for (let i = 0; i < g.N; i++) this.Vext[i] = -this.Z / g.r[i];
      this.Vin = o.start === 'bare' ? Float64Array.from(this.Vext) : startPotential(g, this.Z, this.Nel);
      this.iter = 0;
      this.history = [];
      this.eig = this.occ.map(() => undefined);
      this.converged = false;
    }
    /* Una iteración: resuelve KS con Vin, construye n_out, V_out, energía y mezcla */
    step() {
      const g = this.g, N = g.N;
      const orbs = this.occ.map((o, k) => {
        const s = A.solveRadial(g, this.Vin, o.l, o.n - o.l - 1, { E: this.eig[k] });
        this.eig[k] = s.E;
        return s;
      });
      const n = new Float64Array(N);
      orbs.forEach((s, k) => { const f = this.occ[k].f; for (let i = 0; i < N; i++) n[i] += (f * s.w[i] * s.w[i]) / (FOURPI * g.r[i]); });
      const { VH } = A.hartree(g, n);
      const vxc = new Float64Array(N), exc = new Float64Array(N), ecd = new Float64Array(N);
      const m = this.method;
      for (let i = 0; i < N; i++) {
        if (m === 'lda' || m === 'x') {
          let e = A.xc.ex(n[i]), v = A.xc.vx(n[i]);
          if (m === 'lda') { const c = this.corr === 'pz' ? A.xc.pz(n[i]) : A.xc.vwn(n[i]); e += c[0]; v += c[1]; ecd[i] = c[0]; }
          exc[i] = e; vxc[i] = v;
        } else if (m === 'hf') {
          const f = this.occ[0].f;
          vxc[i] = -VH[i] / f; exc[i] = (-0.5 * VH[i]) / f; /* E_x = −E_H/f → densidad de energía −V_H/(2f) */
        }
      }
      const Vout = new Float64Array(N);
      for (let i = 0; i < N; i++) Vout[i] = this.Vext[i] + VH[i] + vxc[i];
      /* energías (funcional de Harris–Foulkes con n_out: variacional y estable) */
      const sumEig = this.occ.reduce((s, o, k) => s + o.f * orbs[k].E, 0);
      const tmp = new Float64Array(N);
      for (let i = 0; i < N; i++) tmp[i] = n[i] * this.Vin[i];
      const Ts = sumEig - A.int3(g, tmp);
      for (let i = 0; i < N; i++) tmp[i] = n[i] * this.Vext[i];
      const Eext = A.int3(g, tmp);
      for (let i = 0; i < N; i++) tmp[i] = 0.5 * n[i] * VH[i];
      const EH = A.int3(g, tmp);
      for (let i = 0; i < N; i++) tmp[i] = n[i] * exc[i];
      const Exc = A.int3(g, tmp);
      for (let i = 0; i < N; i++) tmp[i] = n[i] * ecd[i];
      const Ec = A.int3(g, tmp);
      const Etot = Ts + Eext + EH + Exc;
      let dV = 0;
      for (let i = 0; i < N; i++) dV = Math.max(dV, Math.abs(g.r[i] * (Vout[i] - this.Vin[i])));
      const prevE = this.history.length ? this.history[this.history.length - 1].Etot : NaN;
      const rec = { iter: ++this.iter, Etot, Ts, Eext, EH, Exc, Ec, Ex: Exc - Ec, sumEig, dV, dE: Etot - prevE, eig: orbs.map((s) => s.E) };
      this.history.push(rec);
      this.n = n; this.VH = VH; this.vxc = vxc; this.exc = exc; this.orbs = orbs; this.Vout = Vout;
      this.Vprev = Float64Array.from(this.Vin);
      this.last = rec;
      /* mezcla lineal */
      for (let i = 0; i < N; i++) this.Vin[i] += this.mix * (Vout[i] - this.Vin[i]);
      this.converged = dV < 1e-7 && Math.abs(rec.dE) < 1e-9;
      return rec;
    }
    run(maxIter = 300) {
      while (!this.converged && this.iter < maxIter) this.step();
      return this.result();
    }
    result() {
      const r = this.last;
      const q = new Float64Array(this.g.N);
      for (let i = 0; i < this.g.N; i++) q[i] = this.n[i];
      return {
        Z: this.Z, method: this.method, occ: this.occ, converged: this.converged, iter: this.iter,
        Etot: r.Etot, Ts: r.Ts, Eext: r.Eext, EH: r.EH, Exc: r.Exc, Ex: r.Ex, Ec: r.Ec,
        eig: this.occ.map((o, k) => ({ n: o.n, l: o.l, f: o.f, E: r.eig[k] })),
        charge: A.int3(this.g, q)
      };
    }
  }
  A.AtomSCF = AtomSCF;
  A.solve = (o) => new AtomSCF(o).run(o.maxIter || 400);
  /* Configuración con un electrón menos en el orbital más alto (catión) */
  A.cationOcc = function (occ, eig) {
    const o = occ.map((x) => ({ ...x }));
    let k = o.length - 1;
    if (eig) { let best = -Infinity; o.forEach((x, i) => { if (x.f > 0 && eig[i] > best) { best = eig[i]; k = i; } }); }
    o[k].f -= 1;
    return o.filter((x) => x.f > 0);
  };
  /* Energía de ionización por diferencia de energías totales (ΔSCF) */
  A.ionizationDSCF = function (Z, method = 'lda') {
    const neu = A.solve({ Z, method });
    if (Z === 1) return { IE: -neu.Etot, neutral: neu, cation: null };
    const cat = A.solve({ Z, method, occ: A.cationOcc(neu.occ, neu.eig.map((e) => e.E)) });
    return { IE: cat.Etot - neu.Etot, neutral: neu, cation: cat, homo: Math.max(...neu.eig.map((e) => e.E)) };
  };

  /* ---------- Pseudopotencial que conserva la norma (forma de Kerker, 1980) ----------
     Dentro de r_c: u_ps(r) = r^{l+1} exp(p(r)), p = α r⁴ + β r³ + γ r² + δ, con p, p', p''
     iguales a los de la función todo-electrón en r_c y la misma carga dentro de r_c.
     g: malla; u: función radial todo-electrón u = rR; V: potencial apantallado; eps: autovalor. */
  A.kerker = function (g, u, V, eps, l, rc) {
    const N = g.N, r = g.r;
    let ic = 0;
    while (ic < N - 1 && r[ic + 1] <= rc) ic++;
    rc = r[ic];
    const sgn = Math.sign(u[ic]) || 1;
    const ua = Float64Array.from(u, (v) => v * sgn);
    /* derivadas en r_c: u'/u por diferencias centrales sobre la malla logarítmica (d/dr = e^{−x} d/dx) */
    const h = g.h;
    const dudr = (ua[ic + 1] - ua[ic - 1]) / (2 * h) / r[ic];
    const u0 = ua[ic];
    const L1 = dudr / u0;                                   /* (ln u)' */
    const uppu = 2 * (V[ic] - eps) + (l * (l + 1)) / (rc * rc); /* u''/u por la ecuación radial */
    const p0 = Math.log(u0) - (l + 1) * Math.log(rc);
    const p1 = L1 - (l + 1) / rc;
    const p2 = uppu - L1 * L1 + (l + 1) / (rc * rc);
    /* norma todo-electrón dentro de r_c (∫ u² dr = ∫ u² r dx) */
    const qAE = (() => { const y = new Float64Array(ic + 1); for (let i = 0; i <= ic; i++) y[i] = ua[i] * ua[i] * r[i]; return P.integ.simpson(y, h); })();
    const coef = (dl) => {
      /* α rc⁴ + β rc³ + γ rc² = p0 − δ ; 4α rc³ + 3β rc² + 2γ rc = p1 ; 12α rc² + 6β rc + 2γ = p2 */
      const Mx = [[rc ** 4, rc ** 3, rc ** 2], [4 * rc ** 3, 3 * rc ** 2, 2 * rc], [12 * rc ** 2, 6 * rc, 2]];
      const s = P.la.solve(Mx, [p0 - dl, p1, p2]);
      return { a: s[0], b: s[1], c: s[2], d: dl };
    };
    const pOf = (cf, x) => cf.a * x ** 4 + cf.b * x ** 3 + cf.c * x * x + cf.d;
    const qPS = (cf) => { const y = new Float64Array(ic + 1); for (let i = 0; i <= ic; i++) y[i] = Math.pow(r[i], 2 * l + 2) * Math.exp(2 * pOf(cf, r[i])) * r[i]; return P.integ.simpson(y, h); };
    /* bisección en δ: qPS crece con δ */
    let lo = p0 - 30, hi = p0 + 30;
    for (let it = 0; it < 200; it++) { const mid = 0.5 * (lo + hi); if (qPS(coef(mid)) > qAE) hi = mid; else lo = mid; }
    const cf = coef(0.5 * (lo + hi));
    const ups = new Float64Array(N), Vps = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      if (i <= ic) {
        const x = r[i], pv = pOf(cf, x), pd = 4 * cf.a * x ** 3 + 3 * cf.b * x * x + 2 * cf.c * x, pdd = 12 * cf.a * x * x + 6 * cf.b * x + 2 * cf.c;
        ups[i] = Math.pow(x, l + 1) * Math.exp(pv);
        Vps[i] = eps + (2 * (l + 1) * pd / x + pd * pd + pdd) / 2;
      } else { ups[i] = ua[i]; Vps[i] = V[i]; }
    }
    return { rc, ic, ups, uae: ua, Vps, qAE, qPS: qPS(cf), cf };
  };

  /* ---------- Datos de referencia ---------- */
  /* Energías totales no relativistas exactas (Ha), Chakravorty et al. 1993 */
  A.EXACT = { 1: -0.5, 2: -2.903724, 3: -7.478060, 4: -14.66736, 5: -24.65391, 6: -37.8450, 7: -54.5892, 8: -75.0673, 9: -99.7339, 10: -128.9376 };
  /* Límite de Hartree–Fock (Ha), Clementi–Roetti / Bunge */
  A.HF = { 1: -0.5, 2: -2.861680, 3: -7.432727, 4: -14.573023, 5: -24.529061, 6: -37.688619, 7: -54.400934, 8: -74.809398, 9: -99.409349, 10: -128.547098 };
  /* LDA sin polarización de espín, NIST (Kotochigova, Levine, Shirley, Stiles, Clark) */
  A.NIST_LDA = {
    1: { E: -0.445671, eig: { '1s': -0.233471 } },
    2: { E: -2.834836, eig: { '1s': -0.570425 } },
    4: { E: -14.447209, eig: { '1s': -3.856411, '2s': -0.205744 } },
    6: { E: -37.425749, eig: { '1s': -9.947718, '2s': -0.500866, '2p': -0.199186 } },
    7: { E: -54.025016, eig: { '1s': -14.011501, '2s': -0.676151, '2p': -0.266297 } },
    8: { E: -74.473077 },
    10: { E: -128.233481, eig: { '1s': -30.305855, '2s': -1.322809, '2p': -0.498034 } },
    18: { E: -525.946195 }
  };
  /* Primera energía de ionización (eV), NIST */
  A.IE = [0, 13.598, 24.587, 5.392, 9.323, 8.298, 11.260, 14.534, 13.618, 17.423, 21.565, 5.139, 7.646, 5.986, 8.152, 10.487, 10.360, 12.968, 15.760, 4.341, 6.113, 6.561, 6.828, 6.746, 6.767, 7.434, 7.902, 7.881, 7.640, 7.726, 9.394, 5.999, 7.899, 9.789, 9.752, 11.814, 13.999];
  /* Electronegatividad de Pauling (null: gases nobles sin valor tabulado) */
  A.EN = [null, 2.20, null, 0.98, 1.57, 2.04, 2.55, 3.04, 3.44, 3.98, null, 0.93, 1.31, 1.61, 1.90, 2.19, 2.58, 3.16, null, 0.82, 1.00, 1.36, 1.54, 1.63, 1.66, 1.55, 1.83, 1.88, 1.91, 1.90, 1.65, 1.81, 2.01, 2.18, 2.55, 2.96, 3.00];
  /* Base de gaussianas s centradas g_k = e^{−α_k r²} para el átomo hidrogenoide (Rayleigh–Ritz lineal):
     S_ij = (π/p)^{3/2}, T_ij = 3 α_i α_j/p · S_ij, V_ij = −2πZ/p, con p = α_i + α_j. */
  A.gaussH = function (alphas, Z = 1) {
    const n = alphas.length, LA = P.la;
    const Sm = LA.zeros(n), Hm = LA.zeros(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p = alphas[i] + alphas[j], s = Math.pow(Math.PI / p, 1.5);
      Sm[i][j] = s;
      Hm[i][j] = ((3 * alphas[i] * alphas[j]) / p) * s - (2 * Math.PI * Z) / p;
    }
    const r = LA.geneig(Hm, Sm);
    if (!r) return null;
    return { E: r.values[0], c: Array.from({ length: n }, (_, i) => r.vectors[i][0]), values: r.values, S: Sm, H: Hm };
  };
  /* Una sola gaussiana: E(α) = 3α/2 − 2Z√(2α/π); mínimo α = 8Z²/(9π), E = −4Z²/(3π) */
  A.gauss1 = (a, Z = 1) => 1.5 * a - 2 * Z * Math.sqrt((2 * a) / Math.PI);
  /* Thomas–Fermi: E = −0.7687 Z^{7/3} Ha */
  A.ETF = (Z) => -0.768745 * Math.pow(Z, 7 / 3);
  /* Helio variacional con Z efectivo: E(ζ) = ζ² − 2Zζ + (5/8)ζ ; mínimo ζ = Z − 5/16 */
  A.heliumVar = (zeta, Z = 2) => zeta * zeta - 2 * Z * zeta + (5 / 8) * zeta;
})(typeof window !== 'undefined' ? window : globalThis);
