/* ===================================================================
   lib/86-transformer.js — Bloque de codificador Transformer:
   codificación posicional sinusoidal, atención multicabeza, red
   prealimentada, normalización de capa y conexiones residuales.
   Convenciones de pesos de PyTorch (nn.MultiheadAttention,
   nn.TransformerEncoderLayer con dropout = 0 y activación ReLU).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const T = (L.tf = {});

  const mm = (X, W, b) => X.map((x) => W.map((w, i) => { let s = b ? b[i] : 0; for (let j = 0; j < x.length; j++) s += w[j] * x[j]; return s; })); /* X W^T + b */

  /* Codificación posicional sinusoidal (Vaswani y otros, 2017): n posiciones × d dimensiones */
  T.posicional = (n, d) => Array.from({ length: n }, (_, p) => Array.from({ length: d }, (_, i) => { const k = Math.floor(i / 2), f = p / Math.pow(10000, 2 * k / d); return i % 2 === 0 ? Math.sin(f) : Math.cos(f); }));

  T.normCapa = (X, g, b, eps = 1e-5) => X.map((x) => { const d = x.length, m = x.reduce((a, v) => a + v, 0) / d, v = x.reduce((a, y) => a + (y - m) * (y - m), 0) / d, s = 1 / Math.sqrt(v + eps); return x.map((y, i) => (y - m) * s * (g ? g[i] : 1) + (b ? b[i] : 0)); });

  /* Atención multicabeza: p = {inW (3d×d), inB (3d), outW (d×d), outB (d), h}. Devuelve {salida, pesos[h][n][n]} */
  T.multiCabeza = function (X, p, mascara = null) {
    const n = X.length, d = X[0].length, h = p.h, dh = d / h;
    const Q = mm(X, p.inW.slice(0, d), p.inB && p.inB.slice(0, d)), K = mm(X, p.inW.slice(d, 2 * d), p.inB && p.inB.slice(d, 2 * d)), V = mm(X, p.inW.slice(2 * d), p.inB && p.inB.slice(2 * d));
    const pesos = [], concat = Array.from({ length: n }, () => new Array(d).fill(0));
    for (let c = 0; c < h; c++) {
      const sl = (M) => M.map((r) => r.slice(c * dh, (c + 1) * dh)), q = sl(Q), k = sl(K), v = sl(V);
      const r = L.att.escalada(q, k, v, { mascara });
      pesos.push(r.pesos);
      r.salida.forEach((row, i) => row.forEach((x, j) => { concat[i][c * dh + j] = x; }));
    }
    return { salida: mm(concat, p.outW, p.outB), pesos };
  };

  const suma = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  /* Bloque completo. p = {mha, ff: {W1, b1, W2, b2}, n1: {g, b}, n2: {g, b}}; o = {normPrimero, mascara} */
  T.bloque = function (X, p, o = {}) {
    const relu = (M) => M.map((r) => r.map((v) => (v > 0 ? v : 0)));
    const ff = (Z) => mm(relu(mm(Z, p.ff.W1, p.ff.b1)), p.ff.W2, p.ff.b2);
    let A, Y, pesos;
    if (o.normPrimero) {
      const a = T.multiCabeza(T.normCapa(X, p.n1.g, p.n1.b), p.mha, o.mascara); pesos = a.pesos;
      A = suma(X, a.salida); Y = suma(A, ff(T.normCapa(A, p.n2.g, p.n2.b)));
    } else {
      const a = T.multiCabeza(X, p.mha, o.mascara); pesos = a.pesos;
      A = T.normCapa(suma(X, a.salida), p.n1.g, p.n1.b); Y = T.normCapa(suma(A, ff(A)), p.n2.g, p.n2.b);
    }
    return { salida: Y, pesos, tras_atencion: A };
  };

  /* Parámetros aleatorios (semilla) con la forma de PyTorch, para las demostraciones */
  T.parametros = function (d, h, dff, semilla = 1) {
    const rng = L.rng(semilla), M = (m, n, s) => Array.from({ length: m }, () => Array.from({ length: n }, () => rng.gauss() * s));
    return { mha: { h, inW: M(3 * d, d, 1 / Math.sqrt(d)), inB: new Array(3 * d).fill(0), outW: M(d, d, 1 / Math.sqrt(d)), outB: new Array(d).fill(0) },
      ff: { W1: M(dff, d, 1 / Math.sqrt(d)), b1: new Array(dff).fill(0), W2: M(d, dff, 1 / Math.sqrt(dff)), b2: new Array(d).fill(0) },
      n1: { g: new Array(d).fill(1), b: new Array(d).fill(0) }, n2: { g: new Array(d).fill(1), b: new Array(d).fill(0) } };
  };
  /* Número de parámetros de un bloque */
  T.nParametros = (d, dff) => 4 * d * d + 4 * d + 2 * d * dff + dff + d + 4 * d;
})(typeof window !== 'undefined' ? window : globalThis);
