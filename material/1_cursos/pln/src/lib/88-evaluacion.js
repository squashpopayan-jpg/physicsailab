/* ===================================================================
   lib/88-evaluacion.js — Medidas de evaluación de texto generado:
   BLEU (Papineni y otros, 2002) de corpus y de oración, y ROUGE-1, ROUGE-2
   y ROUGE-L (Lin, 2004). Mismas convenciones que sacrebleu (tokenize =
   «none», es decir, separar por espacios) y rouge-score (minúsculas,
   solo [a-z0-9], sin raíces).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const E = (L.ev = {});

  const cuenta = (t, n) => { const m = new Map(); for (let i = 0; i + n <= t.length; i++) { const k = t.slice(i, i + n).join(' '); m.set(k, (m.get(k) || 0) + 1); } return m; };
  E.ngramas = cuenta;

  /* hips: lista de oraciones (cadenas); refs: lista de listas de referencias (cadenas). Orden máximo 4 */
  E.bleuCorpus = function (hips, refs, o = {}) {
    const N = 4, ok = new Array(N).fill(0), tot = new Array(N).fill(0); let c = 0, r = 0;
    hips.forEach((h, s) => {
      const th = h.split(/\s+/).filter(Boolean), lr = refs[s].map((x) => x.split(/\s+/).filter(Boolean));
      c += th.length;
      /* longitud de referencia más cercana (en empate, la menor) */
      let mejor = null; for (const x of lr) { const d = Math.abs(x.length - th.length); if (mejor === null || d < mejor[0] || (d === mejor[0] && x.length < mejor[1])) mejor = [d, x.length]; }
      r += mejor[1];
      for (let n = 1; n <= N; n++) {
        const ch = cuenta(th, n); const max = new Map();
        for (const x of lr) for (const [k, v] of cuenta(x, n)) max.set(k, Math.max(max.get(k) || 0, v));
        for (const [k, v] of ch) ok[n - 1] += Math.min(v, max.get(k) || 0);
        tot[n - 1] += Math.max(0, th.length - n + 1);
      }
    });
    return E._bleu(ok, tot, c, r, o);
  };
  E._bleu = function (ok, tot, c, r, o = {}) {
    const N = 4, suav = o.suavizado || 'none', prec = new Array(N).fill(0);
    let sm = 1, orden = N;
    for (let n = 0; n < N; n++) {
      if (tot[n] === 0) { if (o.ordenEfectivo) { orden = n; break; } prec[n] = 0; continue; }
      if (ok[n] === 0 && suav === 'exp') { sm *= 2; prec[n] = 100 / (sm * tot[n]); } else prec[n] = 100 * ok[n] / tot[n];
    }
    const usados = prec.slice(0, orden);
    const bp = c < r ? Math.exp(1 - r / Math.max(c, 1e-9)) : 1;
    const score = usados.some((p) => p === 0) || c === 0 ? 0 : bp * Math.exp(usados.reduce((s, p) => s + Math.log(p / 100), 0) / orden);
    return { puntaje: 100 * score, precisiones: prec, bp, c, r, aciertos: ok, totales: tot };
  };
  /* BLEU de una oración con suavizado «exp» y orden efectivo, como sacrebleu.sentence_bleu */
  E.bleuOracion = (h, rs) => { const lista = Array.isArray(rs) ? rs : [rs]; const o = { suavizado: 'exp', ordenEfectivo: true }; return E.bleuCorpus([h], [lista], o); };

  /* ROUGE */
  const toks = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const prf = (ok, nh, nr) => { const p = nh ? ok / nh : 0, r = nr ? ok / nr : 0; return { p, r, f: p + r ? 2 * p * r / (p + r) : 0 }; };
  const lcs = (a, b) => { const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]); return t[a.length][b.length]; };
  E.sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  E.rouge = function (hip, ref, o = {}) {
    const f = o.sinTildes ? E.sinTildes : (x) => x, h = toks(f(hip)), r = toks(f(ref)), out = {};
    for (const n of [1, 2]) {
      const a = cuenta(h, n), b = cuenta(r, n); let ok = 0; for (const [k, v] of a) ok += Math.min(v, b.get(k) || 0);
      out['r' + n] = prf(ok, Math.max(0, h.length - n + 1), Math.max(0, r.length - n + 1));
    }
    out.rl = prf(lcs(h, r), h.length, r.length);
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
