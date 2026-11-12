/* ===================================================================
   31-spice-ac.js — Análisis en frecuencia (pequeña señal), barrido DC y utilidades de transitorio.
   Se linealiza cada dispositivo alrededor del último punto de operación (solveDC / step).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, S = EM.spice, C = S.Circuit.prototype;

  /* LU complejo (partes real e imaginaria en arreglos planos). Resuelve en (br, bi). */
  function luC(Ar, Ai, br, bi, n) {
    for (let k = 0; k < n; k++) {
      let p = k, mx = Ar[k * n + k] ** 2 + Ai[k * n + k] ** 2;
      for (let i = k + 1; i < n; i++) { const v = Ar[i * n + k] ** 2 + Ai[i * n + k] ** 2; if (v > mx) { mx = v; p = i; } }
      if (mx < 1e-600 || mx === 0) return false;
      if (p !== k) {
        for (let j = 0; j < n; j++) {
          let t = Ar[p * n + j]; Ar[p * n + j] = Ar[k * n + j]; Ar[k * n + j] = t;
          t = Ai[p * n + j]; Ai[p * n + j] = Ai[k * n + j]; Ai[k * n + j] = t;
        }
        let t = br[p]; br[p] = br[k]; br[k] = t; t = bi[p]; bi[p] = bi[k]; bi[k] = t;
      }
      const dr = Ar[k * n + k], di = Ai[k * n + k], dd = dr * dr + di * di;
      for (let i = k + 1; i < n; i++) {
        const ar = Ar[i * n + k], ai = Ai[i * n + k];
        if (ar === 0 && ai === 0) continue;
        const fr = (ar * dr + ai * di) / dd, fi = (ai * dr - ar * di) / dd;
        for (let j = k + 1; j < n; j++) {
          const xr = Ar[k * n + j], xi = Ai[k * n + j];
          Ar[i * n + j] -= fr * xr - fi * xi;
          Ai[i * n + j] -= fr * xi + fi * xr;
        }
        Ar[i * n + k] = 0; Ai[i * n + k] = 0;
        br[i] -= fr * br[k] - fi * bi[k];
        bi[i] -= fr * bi[k] + fi * br[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      let sr = br[i], si = bi[i];
      for (let j = i + 1; j < n; j++) {
        sr -= Ar[i * n + j] * br[j] - Ai[i * n + j] * bi[j];
        si -= Ar[i * n + j] * bi[j] + Ai[i * n + j] * br[j];
      }
      const dr = Ar[i * n + i], di = Ai[i * n + i], dd = dr * dr + di * di;
      br[i] = (sr * dr + si * di) / dd;
      bi[i] = (si * dr - sr * di) / dd;
    }
    return true;
  }

  /* Respuesta en pequeña señal a la frecuencia f [Hz].
     opts.inject = {node, i:1}: inyecta 1 A de CA en un nodo con TODAS las demás fuentes de CA apagadas (impedancia vista).
     Devuelve {re, im} de los nodos (índice n−1) y las ramas. */
  C.ac = function (f, opts = {}) {
    if (!this.compiled) this.compile();
    const N = this.N, nn = this.nNodes - 1, w = 2 * Math.PI * Math.max(f, 1e-9);
    const Ar = new Float64Array(N * N), Ai = new Float64Array(N * N), br = new Float64Array(N), bi = new Float64Array(N);
    /* refresca la linealización en el punto de operación guardado */
    if (this.x) { const A = new Float64Array(N * N), b = new Float64Array(N); this._stamp(A, b, this.x, 'dc', 0, 'be'); }
    const add = (r, c, gr, gi) => { if (r > 0 && c > 0) { Ar[(r - 1) * N + c - 1] += gr; Ai[(r - 1) * N + c - 1] += gi; } };
    const addY = (a, b, gr, gi) => { add(a, a, gr, gi); add(b, b, gr, gi); add(a, b, -gr, -gi); add(b, a, -gr, -gi); };
    const inj = (n, ir, ii) => { if (n > 0) { br[n - 1] += ir; bi[n - 1] += ii; } };
    const volt = (n) => (n > 0 && this.x ? this.x[n - 1] : 0);
    const only = !!opts.inject;
    for (let n = 0; n < nn; n++) { Ar[n * N + n] += this.gmin; }
    for (const e of this.els) {
      if (e.dead) continue;
      switch (e.type) {
        case 'R': addY(e.na, e.nb, 1 / Math.max(e.r, 1e-9), 0); break;
        case 'SW': addY(e.na, e.nb, 1 / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12)), 0); break;
        case 'C': {
          let c = e.c;
          if (e.cvar) { const vr = Math.max(-(e.vab || 0), -0.4 * e.cvar.vj); c = e.cvar.c0 / Math.pow(1 + vr / e.cvar.vj, e.cvar.m); }
          addY(e.na, e.nb, 0, w * c); break;
        }
        case 'L': {
          const rl = e.rl && e.rl > 1e-3 ? e.rl : 0, xr = rl, xi = w * e.l, d = xr * xr + xi * xi;
          addY(e.na, e.nb, xr / d, -xi / d); break;
        }
        case 'V': {
          const am = only ? 0 : (e.acmag || 0), ph = (e.acph || 0) * Math.PI / 180;
          const vr = am * Math.cos(ph), vi = am * Math.sin(ph);
          if (e.br >= 0) {
            const k = nn + e.br;
            if (e.na > 0) { Ar[(e.na - 1) * N + k] += 1; Ar[k * N + e.na - 1] += 1; }
            if (e.nb > 0) { Ar[(e.nb - 1) * N + k] -= 1; Ar[k * N + e.nb - 1] -= 1; }
            br[k] += vr; bi[k] += vi;
          } else { const g = 1 / e.rs; addY(e.na, e.nb, g, 0); inj(e.na, vr * g, vi * g); inj(e.nb, -vr * g, -vi * g); }
          break;
        }
        case 'I': { const am = only ? 0 : (e.acmag || 0), ph = (e.acph || 0) * Math.PI / 180; inj(e.nb, am * Math.cos(ph), am * Math.sin(ph)); inj(e.na, -am * Math.cos(ph), -am * Math.sin(ph)); break; }
        case 'D': addY(e.na, e.nb, e.gd || 0, 0); break;
        case 'Q': {
          const nodes = [e.nb, e.na, e.nc], J = e.J;
          if (!J) break;
          const rows = [[e.na, J.c], [e.nb, J.b], [e.nc, J.e]];
          for (const [rn, Jr] of rows) for (let m = 0; m < 3; m++) add(rn, nodes[m], Jr[m], 0);
          break;
        }
        case 'M': {
          const D = e.dn, Sn = e.sn, G = e.nb, gm = e.gm || 0, gds = e.gds || 0;
          add(D, D, gds, 0); add(D, Sn, -gds - gm, 0); add(D, G, gm, 0);
          add(Sn, D, -gds, 0); add(Sn, Sn, gds + gm, 0); add(Sn, G, -gm, 0);
          break;
        }
        case 'OA': {
          const go = 1 / (e.rout || 75);
          /* H(jω) = A0 / (1 + jωτ) */
          const tau = e.tau || 0, dd = 1 + (w * tau) ** 2;
          const hr = e.A0 / dd, hi = (-e.A0 * w * tau) / dd, sl = e.sl1 === undefined ? 1 : e.sl1;
          add(e.na, e.na, go, 0);
          add(e.na, e.nb, -go * sl * hr, -go * sl * hi);
          add(e.na, e.nc, go * sl * hr, go * sl * hi);
          if (e.rin > 0) addY(e.nb, e.nc, 1 / e.rin, 0);
          break;
        }
        case 'X': {
          /* Γ = (jω L)^−1 = −j/ω · L^−1 */
          const n = e.wn.length;
          for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) {
            const gi = -e.Gm[k][j] / w, [ak, bk] = e.wn[k], [aj, bj] = e.wn[j];
            add(ak, aj, 0, gi); add(ak, bj, 0, -gi); add(bk, aj, 0, -gi); add(bk, bj, 0, gi);
          }
          break;
        }
        case 'REG': {
          const k = nn + e.br;
          if (e.na > 0) Ar[(e.na - 1) * N + k] -= 1;
          if (e.nb > 0) Ar[(e.nb - 1) * N + k] += 1;
          if ((e.mode || 'cv') === 'cv') {
            if (e.na > 0) Ar[k * N + e.na - 1] += 1;
            Ar[k * N + k] += e.rout || 0.05;
            if (e.nc > 0) Ar[k * N + e.nc - 1] -= e.dA || 0;
            if (e.nb > 0) Ar[k * N + e.nb - 1] -= e.dB || 0;
          } else Ar[k * N + k] += 1;
          break;
        }
        case 'DX': {
          const gd = e.gdx || 0;
          add(e.nc, e.na, gd, 0); add(e.nc, e.nb, -gd, 0); add(e.nd, e.na, -gd, 0); add(e.nd, e.nb, gd, 0);
          break;
        }
        case 'E': {
          const k = nn + e.br;
          if (e.na > 0) { Ar[(e.na - 1) * N + k] += 1; Ar[k * N + e.na - 1] += 1; }
          if (e.nb > 0) { Ar[(e.nb - 1) * N + k] -= 1; Ar[k * N + e.nb - 1] -= 1; }
          if (e.nc > 0) Ar[k * N + e.nc - 1] -= e.gain;
          if (e.nd > 0) Ar[k * N + e.nd - 1] += e.gain;
          break;
        }
        case 'G': {
          const g = e.gain;
          add(e.na, e.nc, g, 0); add(e.na, e.nd, -g, 0); add(e.nb, e.nc, -g, 0); add(e.nb, e.nd, g, 0);
          break;
        }
      }
    }
    if (opts.inject) inj(opts.inject.node, opts.inject.i === undefined ? 1 : opts.inject.i, 0);
    if (!luC(Ar, Ai, br, bi, N)) return null;
    return { re: br, im: bi, f, nn, node: (n) => (n > 0 ? [br[n - 1], bi[n - 1]] : [0, 0]), at: (name) => { const n = this.names.get(String(name)) || 0; return n > 0 ? [br[n - 1], bi[n - 1]] : [0, 0]; } };
  };

  /* Barrido logarítmico: devuelve {f, mag(dB), ph(°), re, im} de la función pedida (nodo o par de nodos o función) */
  C.acSweep = function (f0, f1, n, probe, opts = {}) {
    const out = { f: [], mag: [], ph: [], re: [], im: [] };
    let prev = 0;
    for (let k = 0; k < n; k++) {
      const f = f0 * Math.pow(f1 / f0, n === 1 ? 0 : k / (n - 1));
      const r = this.ac(f, opts);
      if (!r) continue;
      let z;
      if (typeof probe === 'function') z = probe(r);
      else if (Array.isArray(probe)) { const a = r.at(probe[0]), b = r.at(probe[1]); z = [a[0] - b[0], a[1] - b[1]]; }
      else z = r.at(probe);
      const mag = Math.hypot(z[0], z[1]);
      let ph = Math.atan2(z[1], z[0]) * 180 / Math.PI;
      /* desenrolla la fase */
      while (ph - prev > 180) ph -= 360;
      while (ph - prev < -180) ph += 360;
      prev = ph;
      out.f.push(f); out.mag.push(20 * Math.log10(Math.max(mag, 1e-30))); out.ph.push(ph); out.re.push(z[0]); out.im.push(z[1]);
    }
    return out;
  };

  /* Barrido DC de una fuente: devuelve {x, y:[...series]} con continuación entre puntos */
  C.dcSweep = function (srcId, v0, v1, n, collect) {
    const e = this.find(srcId);
    const saveV = e.type === 'V' ? e.v : e.i, saveW = e.wave;
    e.wave = null;
    const xs = [], ys = [];
    let first = true;
    for (let k = 0; k < n; k++) {
      const v = v0 + (v1 - v0) * (n === 1 ? 0 : k / (n - 1));
      if (e.type === 'V') e.v = v; else e.i = v;
      if (!this.solveDC({ keep: !first, guess: first ? undefined : this.x })) { xs.push(v); ys.push(null); continue; }
      first = false;
      xs.push(v);
      ys.push(collect(this));
    }
    if (e.type === 'V') e.v = saveV; else e.i = saveV;
    e.wave = saveW;
    return { x: xs, y: ys };
  };

  /* Transitorio completo: devuelve series muestreadas cada dt (o cada «every» pasos) */
  S.tran = function (c, tstop, dt, collect, every = 1) {
    const T = [], Y = [];
    let k = 0;
    const nsteps = Math.round(tstop / dt);
    T.push(c.t); Y.push(collect(c));
    for (let i = 0; i < nsteps; i++) {
      if (!c.step(dt)) break;
      k++;
      if (k % every === 0) { T.push(c.t); Y.push(collect(c)); }
    }
    return { t: T, y: Y };
  };

  /* Utilidades de señal */
  S.rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
  S.mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  /* FFT iterativa (n potencia de 2). Devuelve amplitudes |X_k|·2/n para k = 0..n/2 */
  S.fft = (x) => {
    const n = x.length;
    const re = Float64Array.from(x), im = new Float64Array(n);
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let j = 0; j < len / 2; j++) {
          const ur = re[i + j], ui = im[i + j];
          const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
          re[i + j] = ur + vr; im[i + j] = ui + vi;
          re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    const amp = new Float64Array(n / 2 + 1);
    for (let k = 0; k <= n / 2; k++) amp[k] = Math.hypot(re[k], im[k]) * (k === 0 || k === n / 2 ? 1 : 2) / n;
    return amp;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
