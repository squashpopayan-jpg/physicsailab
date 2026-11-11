/* ===================================================================
   lib/83-clasif.js — Clasificación de texto: Bayes ingenuo multinomial,
   regresión logística binaria con regularización L2 (Newton con gradiente
   conjugado), métricas (matriz de confusión, precisión, cobertura, F1) y
   validación cruzada en bloques contiguos. Mismas convenciones que
   scikit-learn (MultinomialNB, LogisticRegression, KFold sin barajar).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const C = (L.clf = {});

  /* ---------- Bayes ingenuo multinomial ---------- */
  /* X: lista de Map(índice → valor); y: etiquetas; nF: número de rasgos */
  C.nbAjustar = function (X, y, nF, alpha = 1, priorUniforme = false) {
    const clases = Array.from(new Set(y)).sort(), n = y.length;
    const cuenta = clases.map(() => new Float64Array(nF)), nc = clases.map(() => 0);
    X.forEach((x, i) => { const c = clases.indexOf(y[i]); nc[c]++; for (const [j, v] of x) cuenta[c][j] += v; });
    const logProb = cuenta.map((f) => { let t = 0; for (const v of f) t += v; const den = Math.log(t + alpha * nF); return Float64Array.from(f, (v) => Math.log(v + alpha) - den); });
    const logPrior = nc.map((k) => (priorUniforme ? -Math.log(clases.length) : Math.log(k / n)));
    return { clases, logPrior, logProb, nF };
  };
  C.nbPuntos = (m, x) => m.clases.map((_, c) => { let s = m.logPrior[c]; for (const [j, v] of x) s += v * m.logProb[c][j]; return s; });
  C.nbPredecir = (m, x) => { const p = C.nbPuntos(m, x); let b = 0; p.forEach((v, c) => { if (v > p[b]) b = c; }); return m.clases[b]; };
  C.nbProb = (m, x) => { const p = C.nbPuntos(m, x), mx = Math.max(...p), e = p.map((v) => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };

  /* ---------- Regresión logística binaria (L2, intercepto sin penalizar) ----------
     Minimiza  Cpen · Σ log(1 + exp(−tᵢ(w·xᵢ + b))) + ½‖w‖²,  tᵢ = ±1 (la clase positiva es clases[1]) */
  C.lrAjustar = function (X, y, nF, o = {}) {
    const clases = Array.from(new Set(y)).sort(), Cpen = o.C === undefined ? 1 : o.C, n = y.length;
    if (clases.length !== 2) throw new Error('solo clasificación binaria');
    const t = y.map((l) => (l === clases[1] ? 1 : -1));
    const w = new Float64Array(nF); let b = 0;
    const margen = (w, b) => X.map((x) => { let s = b; for (const [j, v] of x) s += w[j] * v; return s; });
    const obj = (w, b) => { const m = margen(w, b); let f = 0; for (let i = 0; i < n; i++) { const z = -t[i] * m[i]; f += z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z)); } let r = 0; for (const v of w) r += v * v; return Cpen * f + 0.5 * r; };
    let it = 0;
    for (; it < (o.maxIter || 60); it++) {
      const m = margen(w, b), p = m.map((v) => 1 / (1 + Math.exp(-v))), d = p.map((v) => v * (1 - v));
      /* gradiente */
      const gw = Float64Array.from(w), res = p.map((v, i) => (v - (t[i] === 1 ? 1 : 0)) * Cpen); let gb = 0;
      X.forEach((x, i) => { for (const [j, v] of x) gw[j] += res[i] * v; gb += res[i]; });
      let gn = Math.abs(gb); for (const v of gw) gn = Math.max(gn, Math.abs(v));
      if (gn < (o.tol || 1e-11)) break;
      /* paso de Newton: H d = −g con gradiente conjugado; H = Cpen·[X 1]ᵀ D [X 1] + diag(1, …, 1, 0) */
      const Hv = (vw, vb) => {
        const hw = Float64Array.from(vw), q = X.map((x, i) => { let s = vb; for (const [j, v] of x) s += vw[j] * v; return s * d[i] * Cpen; }); let hb = 0;
        X.forEach((x, i) => { for (const [j, v] of x) hw[j] += q[i] * v; hb += q[i]; });
        return [hw, hb];
      };
      let dw = new Float64Array(nF), db = 0, rw = Float64Array.from(gw, (v) => -v), rb = -gb, pw = Float64Array.from(rw), pb = rb;
      let rr = rb * rb; for (const v of rw) rr += v * v;
      const rr0 = rr;
      for (let k = 0; k < 400 && rr > 1e-28 * rr0; k++) {
        const [hw, hb] = Hv(pw, pb); let php = pb * hb; for (let j = 0; j < nF; j++) php += pw[j] * hw[j];
        const a = rr / php; for (let j = 0; j < nF; j++) { dw[j] += a * pw[j]; rw[j] -= a * hw[j]; } db += a * pb; rb -= a * hb;
        let rn = rb * rb; for (const v of rw) rn += v * v;
        const be = rn / rr; rr = rn; for (let j = 0; j < nF; j++) pw[j] = rw[j] + be * pw[j]; pb = rb + be * pb;
      }
      /* búsqueda de línea de retroceso */
      const f0 = obj(w, b); let s = 1;
      for (let k = 0; k < 30; k++) { const w2 = Float64Array.from(w, (v, j) => v + s * dw[j]); if (obj(w2, b + s * db) <= f0 + 1e-14 * Math.abs(f0)) break; s /= 2; }
      for (let j = 0; j < nF; j++) w[j] += s * dw[j]; b += s * db;
    }
    return { clases, w, b, nF, iter: it };
  };
  C.lrProb = (m, x) => { let s = m.b; for (const [j, v] of x) s += m.w[j] * v; return 1 / (1 + Math.exp(-s)); };
  C.lrPredecir = (m, x) => (C.lrProb(m, x) >= 0.5 ? m.clases[1] : m.clases[0]);

  /* Tubería completa: vectorizador + clasificador. cfg = {modelo: 'nb'|'lr', n: [1,1], vacias: Set|null, tfidf: false, binario: false, alpha: 1, C: 1, minDf: 1}
     Devuelve ajusta(docs, y) → predecir(doc); la función tiene además .info con el modelo y el vocabulario */
  C.tuberia = (cfg) => (docs, y) => {
    const vz = L.vec.ajustar(docs, { n: cfg.n || [1, 1], vacias: cfg.vacias || null, minDf: cfg.minDf || 1, binario: !!cfg.binario });
    const rep = (d) => { const c = L.vec.contar(vz, d); return cfg.tfidf ? L.vec.tfidf(vz, c) : c; };
    const X = docs.map(rep), nF = vz.vocab.length;
    const m = cfg.modelo === 'lr' ? C.lrAjustar(X, y, nF, { C: cfg.C }) : C.nbAjustar(X, y, nF, cfg.alpha === undefined ? 1 : cfg.alpha);
    const f = (d) => (cfg.modelo === 'lr' ? C.lrPredecir(m, rep(d)) : C.nbPredecir(m, rep(d)));
    f.info = { modelo: m, vz, rep };
    return f;
  };

  /* ---------- Métricas ---------- */
  C.metricas = function (real, pred, clases) {
    clases = clases || Array.from(new Set(real.concat(pred))).sort();
    const k = clases.length, M = Array.from({ length: k }, () => new Array(k).fill(0));
    real.forEach((r, i) => { M[clases.indexOf(r)][clases.indexOf(pred[i])]++; });
    const por = clases.map((c, i) => {
      const tp = M[i][i], fp = M.reduce((s, f, j) => s + (j === i ? 0 : f[i]), 0), fn = M[i].reduce((s, v, j) => s + (j === i ? 0 : v), 0);
      const p = tp + fp ? tp / (tp + fp) : 0, r = tp + fn ? tp / (tp + fn) : 0;
      return { clase: c, p, r, f1: p + r ? 2 * p * r / (p + r) : 0, n: tp + fn };
    });
    const acc = real.filter((r, i) => r === pred[i]).length / real.length;
    return { clases, matriz: M, acc, por, macroF1: por.reduce((s, x) => s + x.f1, 0) / k };
  };

  /* ---------- Validación cruzada en bloques contiguos (KFold sin barajar) ---------- */
  C.bloques = (n, k) => { const out = []; let ini = 0; for (let i = 0; i < k; i++) { const tam = Math.floor(n / k) + (i < n % k ? 1 : 0); out.push([ini, ini + tam]); ini += tam; } return out; };
  /* ajusta(docsEntrenamiento, yEntrenamiento) devuelve una función predecir(doc); devuelve exactitudes y predicciones */
  C.validacionCruzada = function (docs, y, k, ajusta) {
    const pred = new Array(docs.length), acc = [];
    for (const [a, b] of C.bloques(docs.length, k)) {
      const tr = docs.map((_, i) => i).filter((i) => i < a || i >= b), f = ajusta(tr.map((i) => docs[i]), tr.map((i) => y[i]));
      let ok = 0; for (let i = a; i < b; i++) { pred[i] = f(docs[i]); if (pred[i] === y[i]) ok++; }
      acc.push(ok / (b - a));
    }
    return { acc, pred, media: acc.reduce((s, v) => s + v, 0) / k };
  };
})(typeof window !== 'undefined' ? window : globalThis);
