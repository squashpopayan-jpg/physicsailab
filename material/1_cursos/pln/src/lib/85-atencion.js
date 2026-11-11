/* ===================================================================
   lib/85-atencion.js — Atención por producto escalar escalado:
   Attention(Q, K, V) = softmax(Q Kᵀ / √d_k  [+ máscara]) V
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const A = (L.att = {});

  A.softmax = (v, T = 1) => { const m = Math.max(...v), e = v.map((x) => Math.exp((x - m) / T)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  /* Q: nq × d, K: nk × d, V: nk × dv. mascara: null | 'causal' | matriz booleana nq × nk (true = visible) */
  A.escalada = function (Q, K, V, o = {}) {
    const d = Q[0].length, esc = o.escala === undefined ? 1 / Math.sqrt(d) : o.escala;
    const pesos = Q.map((q, i) => {
      const sc = K.map((k, j) => {
        const ok = o.mascara === 'causal' ? j <= i + (o.desfase || 0) : Array.isArray(o.mascara) ? o.mascara[i][j] : true;
        return ok ? dot(q, k) * esc : -Infinity;
      });
      return A.softmax(sc);
    });
    const salida = pesos.map((w) => V[0].map((_, c) => { let s = 0; for (let j = 0; j < V.length; j++) s += w[j] * V[j][c]; return s; }));
    return { pesos, salida };
  };
  /* Entropía (en bits) de una distribución de atención: 0 = foco total, log2(n) = reparto uniforme */
  A.entropia = (w) => w.reduce((s, p) => (p > 0 ? s - p * Math.log2(p) : s), 0);
})(typeof window !== 'undefined' ? window : globalThis);
