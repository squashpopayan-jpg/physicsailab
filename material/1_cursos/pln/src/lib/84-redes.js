/* ===================================================================
   lib/84-redes.js — Redes neuronales mínimas: perceptrón multicapa con
   retropropagación (sigmoide + entropía cruzada binaria), celdas RNN y
   LSTM, convolución 1D con max-pooling y conjuntos de datos 2D.
   Las convenciones de pesos coinciden con PyTorch (W: salida × entrada).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const N = (L.nn = {});

  const sig = (x) => 1 / (1 + Math.exp(-x));
  const ACT = {
    tanh: { f: Math.tanh, d: (a) => 1 - a * a },
    relu: { f: (x) => (x > 0 ? x : 0), d: (a) => (a > 0 ? 1 : 0) },
    sigmoide: { f: sig, d: (a) => a * (1 - a) },
    lineal: { f: (x) => x, d: () => 1 }
  };
  N.ACT = ACT;

  /* ---------- Perceptrón multicapa ---------- */
  /* capas = [entrada, oculta1, …, 1]; W[l] es (capas[l+1] × capas[l]); salida sigmoide */
  N.mlp = function (capas, act = 'tanh', semilla = 1) {
    const rng = L.rng(semilla), W = [], b = [];
    for (let l = 0; l < capas.length - 1; l++) {
      const s = Math.sqrt(2 / (capas[l] + capas[l + 1]));
      W.push(Array.from({ length: capas[l + 1] }, () => Float64Array.from({ length: capas[l] }, () => rng.gauss() * s)));
      b.push(new Float64Array(capas[l + 1]));
    }
    return { capas, W, b, act, t: 0, m: null, v: null };
  };
  N.adelante = function (red, x) {
    const f = ACT[red.act].f, A = [Float64Array.from(x)];
    for (let l = 0; l < red.W.length; l++) {
      const a = A[l], z = new Float64Array(red.W[l].length);
      for (let i = 0; i < z.length; i++) { let s = red.b[l][i]; const w = red.W[l][i]; for (let j = 0; j < a.length; j++) s += w[j] * a[j]; z[i] = s; }
      A.push(l === red.W.length - 1 ? z.map(sig) : z.map(f));
    }
    return A;
  };
  N.prob = (red, x) => N.adelante(red, x)[red.W.length][0];
  /* Pérdida media y gradientes (BCE con salida sigmoide) */
  N.gradientes = function (red, X, y) {
    const d = ACT[red.act].d, gW = red.W.map((M) => M.map((r) => new Float64Array(r.length))), gb = red.b.map((v) => new Float64Array(v.length)); let perd = 0;
    for (let n = 0; n < X.length; n++) {
      const A = N.adelante(red, X[n]), p = A[A.length - 1][0];
      perd += -(y[n] ? Math.log(Math.max(p, 1e-300)) : Math.log(Math.max(1 - p, 1e-300)));
      let delta = Float64Array.from([p - y[n]]);
      for (let l = red.W.length - 1; l >= 0; l--) {
        const a = A[l];
        for (let i = 0; i < delta.length; i++) { gb[l][i] += delta[i]; const g = gW[l][i]; for (let j = 0; j < a.length; j++) g[j] += delta[i] * a[j]; }
        if (l > 0) {
          const nd = new Float64Array(a.length);
          for (let j = 0; j < a.length; j++) { let s = 0; for (let i = 0; i < delta.length; i++) s += red.W[l][i][j] * delta[i]; nd[j] = s * d(a[j]); }
          delta = nd;
        }
      }
    }
    const k = 1 / X.length;
    gW.forEach((M) => M.forEach((r) => { for (let j = 0; j < r.length; j++) r[j] *= k; })); gb.forEach((v) => { for (let j = 0; j < v.length; j++) v[j] *= k; });
    return { perdida: perd * k, gW, gb };
  };
  /* Un paso de entrenamiento con todo el lote. opt = 'sgd' | 'adam' */
  N.paso = function (red, X, y, lr = 0.1, opt = 'adam') {
    const g = N.gradientes(red, X, y);
    if (opt === 'adam' && !red.m) { red.m = { W: g.gW.map((M) => M.map((r) => new Float64Array(r.length))), b: g.gb.map((v) => new Float64Array(v.length)) }; red.v = { W: g.gW.map((M) => M.map((r) => new Float64Array(r.length))), b: g.gb.map((v) => new Float64Array(v.length)) }; }
    red.t++;
    const upd = (p, gr, mm, vv) => {
      for (let j = 0; j < p.length; j++) {
        if (opt === 'sgd') p[j] -= lr * gr[j];
        else { mm[j] = 0.9 * mm[j] + 0.1 * gr[j]; vv[j] = 0.999 * vv[j] + 0.001 * gr[j] * gr[j]; p[j] -= lr * (mm[j] / (1 - Math.pow(0.9, red.t))) / (Math.sqrt(vv[j] / (1 - Math.pow(0.999, red.t))) + 1e-8); }
      }
    };
    for (let l = 0; l < red.W.length; l++) {
      for (let i = 0; i < red.W[l].length; i++) upd(red.W[l][i], g.gW[l][i], red.m && red.m.W[l][i], red.v && red.v.W[l][i]);
      upd(red.b[l], g.gb[l], red.m && red.m.b[l], red.v && red.v.b[l]);
    }
    return g.perdida;
  };
  N.exactitud = (red, X, y) => X.filter((x, i) => (N.prob(red, x) >= 0.5 ? 1 : 0) === y[i]).length / X.length;
  N.nParametros = (red) => red.W.reduce((s, M, l) => s + M.length * M[0].length + red.b[l].length, 0);

  /* ---------- Conjuntos de datos 2D ---------- */
  N.datos = function (tipo, n = 200, semilla = 5, ruido = 0.15) {
    const rng = L.rng(semilla), X = [], y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2; let x1, x2;
      if (tipo === 'xor') { const a = rng() < 0.5 ? -1 : 1, bq = rng() < 0.5 ? -1 : 1; x1 = a + ruido * rng.gauss() * 2; x2 = bq + ruido * rng.gauss() * 2; X.push([x1, x2]); y.push(a * bq > 0 ? 1 : 0); continue; }
      if (tipo === 'circulos') { const r = c ? 0.5 : 1.3, t = rng() * 2 * Math.PI; x1 = r * Math.cos(t) + ruido * rng.gauss(); x2 = r * Math.sin(t) + ruido * rng.gauss(); }
      else if (tipo === 'lunas') { const t = rng() * Math.PI; x1 = c ? 1 - Math.cos(t) : Math.cos(t); x2 = c ? 0.4 - Math.sin(t) : Math.sin(t); x1 += ruido * rng.gauss(); x2 += ruido * rng.gauss(); x1 -= 0.5; x2 -= 0.2; x1 *= 1.4; x2 *= 1.4; }
      else { const t = 0.6 + rng() * 10.5, r = t / 11.1 * 2, ph = c ? Math.PI : 0; x1 = r * Math.cos(t + ph) + ruido * rng.gauss() * 0.3; x2 = r * Math.sin(t + ph) + ruido * rng.gauss() * 0.3; }
      X.push([x1, x2]); y.push(c);
    }
    return { X, y };
  };

  /* ---------- Celdas recurrentes (convención de PyTorch) ---------- */
  const matvec = (W, x) => W.map((r) => { let s = 0; for (let j = 0; j < r.length; j++) s += r[j] * x[j]; return s; });
  /* RNN de Elman: h' = tanh(Wih x + bih + Whh h + bhh) */
  N.rnnPaso = (p, x, h) => { const a = matvec(p.Wih, x), c = matvec(p.Whh, h); return a.map((v, i) => Math.tanh(v + p.bih[i] + c[i] + p.bhh[i])); };
  /* LSTM: filas de W apiladas en el orden i, f, g, o. Devuelve {h, c, puertas} */
  N.lstmPaso = (p, x, h, c) => {
    const H = h.length, a = matvec(p.Wih, x), r = matvec(p.Whh, h), z = a.map((v, i) => v + p.bih[i] + r[i] + p.bhh[i]);
    const I = [], F = [], G = [], O = [], c2 = [], h2 = [];
    for (let k = 0; k < H; k++) {
      I.push(sig(z[k])); F.push(sig(z[H + k])); G.push(Math.tanh(z[2 * H + k])); O.push(sig(z[3 * H + k]));
      c2.push(F[k] * c[k] + I[k] * G[k]); h2.push(O[k] * Math.tanh(c2[k]));
    }
    return { h: h2, c: c2, puertas: { i: I, f: F, g: G, o: O } };
  };
  N.secuencia = function (tipo, p, xs) {
    const H = p.Whh[0].length; let h = new Array(H).fill(0), c = new Array(H).fill(0); const hs = [], pu = [];
    for (const x of xs) {
      if (tipo === 'rnn') h = N.rnnPaso(p, x, h);
      else { const r = N.lstmPaso(p, x, h, c); h = r.h; c = r.c; pu.push(r.puertas); }
      hs.push(h);
    }
    return { hs, h, c, puertas: pu };
  };

  /* ---------- Convolución 1D con max-pooling temporal ---------- */
  /* X: T × d (secuencia de vectores); filtros: [{W: k × d, b}] → vector de max-pooling por filtro */
  N.conv1d = (X, filtro) => { const k = filtro.W.length, out = []; for (let t = 0; t + k <= X.length; t++) { let s = filtro.b || 0; for (let i = 0; i < k; i++) for (let j = 0; j < X[0].length; j++) s += filtro.W[i][j] * X[t + i][j]; out.push(s); } return out; };
  N.conv1dMax = (X, filtros) => filtros.map((f) => { const m = N.conv1d(X, f).map((v) => Math.max(v, 0)); return Math.max(...m); });
})(typeof window !== 'undefined' ? window : globalThis);
