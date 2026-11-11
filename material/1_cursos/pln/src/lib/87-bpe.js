/* ===================================================================
   lib/87-bpe.js — Codificación por pares de bytes (Sennrich y otros, 2016):
   entrenamiento de fusiones sobre un corpus y codificación de palabras.
   Las palabras se parten en caracteres con la marca </w> en el último;
   en cada paso se fusiona el par adyacente más frecuente (los empates se
   resuelven con el par menor en orden lexicográfico).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const B = (L.bpe = {});
  const FIN = '</w>';
  const inicial = (w) => { const c = Array.from(w); c[c.length - 1] += FIN; return c; };

  /* palabras: lista de palabras (con repeticiones). Devuelve {fusiones: [[a, b, frecuencia]], vocab: Set de símbolos finales} */
  B.entrenar = function (palabras, nFusiones) {
    const freq = new Map(); for (const w of palabras) if (w) freq.set(w, (freq.get(w) || 0) + 1);
    let corpus = Array.from(freq, ([w, f]) => ({ s: inicial(w), f }));
    const fusiones = [];
    for (let k = 0; k < nFusiones; k++) {
      const pares = new Map();
      for (const { s, f } of corpus) for (let i = 0; i + 1 < s.length; i++) { const key = s[i] + '\u0001' + s[i + 1]; pares.set(key, (pares.get(key) || 0) + f); }
      if (!pares.size) break;
      let mejor = null, mf = -1;
      for (const [key, f] of pares) if (f > mf || (f === mf && key < mejor)) { mf = f; mejor = key; }
      const [a, b] = mejor.split('\u0001');
      fusiones.push([a, b, mf]);
      for (const p of corpus) {
        const s = p.s, out = [];
        for (let i = 0; i < s.length; i++) { if (i + 1 < s.length && s[i] === a && s[i + 1] === b) { out.push(a + b); i++; } else out.push(s[i]); }
        p.s = out;
      }
    }
    const vocab = new Set(); for (const { s } of corpus) for (const x of s) vocab.add(x);
    return { fusiones, rango: new Map(fusiones.map(([a, b], i) => [a + '\u0001' + b, i])), vocab, nPalabras: freq.size };
  };
  /* Codifica una palabra aplicando las fusiones por orden de aprendizaje */
  B.codificar = function (m, palabra, limite = Infinity) {
    let s = inicial(palabra);
    for (;;) {
      let r = Infinity, pos = -1;
      for (let i = 0; i + 1 < s.length; i++) { const k = m.rango.get(s[i] + '\u0001' + s[i + 1]); if (k !== undefined && k < limite && k < r) { r = k; pos = i; } }
      if (pos < 0) return s;
      s = s.slice(0, pos).concat([s[pos] + s[pos + 1]], s.slice(pos + 2));
    }
  };
  B.tokenizar = (m, texto, limite = Infinity) => (texto.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).flatMap((w) => B.codificar(m, w, limite));
  B.limpia = (t) => t.replace(FIN, '·');
})(typeof window !== 'undefined' ? window : globalThis);
