/* ===================================================================
   50-lab.js — Atajos de laboratorio sobre el motor: ejecutar, modelo nulo, barridos y curvas
   =================================================================== */
(function () {
  'use strict';
  const ML = (window.ML = window.ML || {});
  const L = (ML.L = ML.L || {});
  const E = L.eng;
  const B = (L.lab = {});

  B.DATASETS = {
    m1: { label: 'M1 · 26 jun – 7 oct 2026 (3.4 meses)', ctx: 'm5' },
    m5: { label: 'M5 · may 2025 – oct 2026 (17 meses)', ctx: null },
    m15: { label: 'M15 · jul 2022 – oct 2026 (4.2 años, análogo)', ctx: null }
  };
  /* Parámetros por defecto adaptados a la serie (el análogo M15 usa estancamiento de 60 min) */
  B.paramsFor = function (ds, over) {
    const o = Object.assign({}, over || {});
    if (ds === 'm15' && o.stagmin === undefined) o.stagmin = 60;
    return E.params(o);
  };
  B.get = function (D, ds) { const S = D[ds]; const c = B.DATASETS[ds].ctx; return { S, ctx: c ? D[c] : null, X: E.prep(S, c ? D[c] : null) }; };

  B.run = function (S, X, P, cand) {
    const tr = E.run(S, X, P, cand);
    return { tr, st: E.stats(tr, P) };
  };
  /* Medias de R de `nrep` réplicas con entradas al azar a favor del sesgo y la misma frecuencia que la señal */
  B.nullRuns = function (S, X, P, nrep, seed) {
    const sc = E.scan(X, P), un = E.scanBias(X, P);
    const p = un.ci.length ? sc.ci.length / un.ci.length : 0;
    const rng = L.stats.rng(seed || 1);
    const out = [];
    for (let r = 0; r < nrep; r++) {
      const ci = [], cs = [], ca = [];
      for (let q = 0; q < un.ci.length; q++) if (rng() < p) { ci.push(un.ci[q]); cs.push(un.cs[q]); ca.push(un.ca[q]); }
      const tr = E.run(S, X, P, { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) });
      if (tr.length) { let s = 0; for (const t of tr) s += t.R; out.push(s / tr.length); }
    }
    return out;
  };
  /* Barrido bidimensional: devuelve matriz [iy][ix] de {n, m, se} */
  B.grid = function (S, X, P, xk, xs, yk, ys, minN) {
    const out = [];
    for (let j = 0; j < ys.length; j++) {
      const row = [];
      for (let i = 0; i < xs.length; i++) {
        const Q = Object.assign({}, P); Q[xk] = xs[i]; Q[yk] = ys[j];
        const tr = E.run(S, X, Q);
        const st = E.stats(tr, Q);
        row.push({ n: st.n, m: st.n >= (minN || 10) ? st.avgR : NaN, se: st.seR });
      }
      out.push(row);
    }
    return out;
  };
  /* Barrido unidimensional */
  B.sweep = function (S, X, P, key, vals, minN) {
    return vals.map((v) => {
      const Q = Object.assign({}, P); Q[key] = v;
      const tr = E.run(S, X, Q), st = E.stats(tr, Q);
      return { v, n: st.n, m: st.n >= (minN || 5) ? st.avgR : NaN, se: st.seR, win: st.winPct, pf: st.pf };
    });
  };
  /* Curva de capital (en R y en USD) */
  B.equity = function (tr, P) {
    const xs = [0], yR = [0], yU = [0];
    let r = 0, u = 0;
    tr.forEach((t, i) => { r += t.R; u += t.usd; xs.push(i + 1); yR.push(r); yU.push(u); });
    return { xs, yR, yU };
  };
  /* Suavizado por vecindad 3×3 de una matriz de {m} */
  B.smooth = function (G) {
    const H = G.length, W = G[0].length;
    return G.map((row, j) => row.map((c, i) => {
      let s = 0, k = 0;
      for (let a = Math.max(0, j - 1); a <= Math.min(H - 1, j + 1); a++) for (let b = Math.max(0, i - 1); b <= Math.min(W - 1, i + 1); b++) { const v = G[a][b].m; if (v === v) { s += v; k++; } }
      return k >= 6 ? s / k : NaN;
    }));
  };
  /* Serie recortada en la mitad (primera/segunda) conservando el contexto largo */
  B.halves = function (S) {
    const h = Math.floor(S.n / 2);
    return [E.slice(S, 0, h), E.slice(S, h, S.n)];
  };
  /* Resumen en texto de unas estadísticas */
  B.fmtStats = function (st) {
    return st.n ? `${st.n} operaciones · aciertos ${ML.pct(st.winPct, 0)} · R medio ${ML.R(st.avgR, 3)} ± ${ML.fix(1.96 * st.seR, 3)} · ${ML.usdS(st.usd)}` : 'sin operaciones';
  };
})();
