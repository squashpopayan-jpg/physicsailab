/* ===================================================================
   lib/00-util.js — Utilidades sin DOM: azar reproducible, estadística
   básica y texto. Todo src/lib corre igual en el navegador y en Node
   (tests/cargar.js), para validarlo fuera de la página.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});

  /* Generador mulberry32 con semilla; rng() ∈ [0,1), rng.gauss() ~ N(0,1) */
  L.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    r.gauss = function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0;
      while (u <= 1e-300) u = r();
      const v = r(), m = Math.sqrt(-2 * Math.log(u));
      spare = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    };
    r.int = (n) => Math.floor(r() * n);
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    /* Índice según pesos no normalizados */
    r.choice = (w) => { let s = 0; for (const x of w) s += x; let u = r() * s; for (let i = 0; i < w.length; i++) { u -= w[i]; if (u <= 0) return i; } return w.length - 1; };
    return r;
  };

  const S = (L.stat = {});
  S.sum = (a) => { let s = 0; for (const v of a) s += v; return s; };
  S.mean = (a) => (a.length ? S.sum(a) / a.length : NaN);
  S.max = (a) => a.reduce((m, v) => (v > m ? v : m), -Infinity);
  S.argmax = (a) => { let k = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[k]) k = i; return k; };
  S.logsumexp = (a) => { const m = S.max(a); if (!isFinite(m)) return m; let s = 0; for (const v of a) s += Math.exp(v - m); return m + Math.log(s); };
  S.softmax = (a, T = 1) => { const m = S.max(a); const e = a.map((v) => Math.exp((v - m) / T)); const s = S.sum(e); return e.map((v) => v / s); };
  S.entropy = (p, base = 2) => { let h = 0; for (const v of p) if (v > 0) h -= v * Math.log(v); return h / Math.log(base); };

  const U = (L.util = {});
  U.range = (n) => Array.from({ length: n }, (_, i) => i);
  U.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  /* Conteo de elementos: devuelve Map */
  U.count = (arr) => { const m = new Map(); for (const x of arr) m.set(x, (m.get(x) || 0) + 1); return m; };
  U.sortedEntries = (m) => Array.from(m.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  U.zip = (a, b) => a.map((x, i) => [x, b[i]]);
  /* Producto punto, norma y coseno de arreglos numéricos */
  U.dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  U.norm = (a) => Math.sqrt(U.dot(a, a));
  U.cosine = (a, b) => { const n = U.norm(a) * U.norm(b); return n ? U.dot(a, b) / n : 0; };
})(typeof window !== 'undefined' ? window : globalThis);
