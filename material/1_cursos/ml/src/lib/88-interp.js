/* ===================================================================
   lib/88-interp.js — Interpretabilidad y evaluación: importancia por
   permutación, dependencia parcial (PDP) e ICE, valores de Shapley
   exactos (enumeración de coaliciones, con fondo de referencia) y
   validación cruzada genérica.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util;
  const IN = (L.interp = {});

  /* score(Xp, y) mayor = mejor. Devuelve media y desviación de la caída por variable */
  IN.permImportance = function (score, X, y, rng, reps = 5) {
    const base = score(X, y), p = X[0].length;
    return U.range(p).map((j) => {
      const drops = [];
      for (let r = 0; r < reps; r++) {
        const perm = rng.perm(X.length);
        const Xp = X.map((row, i) => { const c = row.slice(); c[j] = X[perm[i]][j]; return c; });
        drops.push(base - score(Xp, y));
      }
      return { mean: L.stat.mean(drops), sd: L.stat.std(drops, 0), drops };
    });
  };
  /* Dependencia parcial: f1(x) → número; grid de valores para la variable j */
  IN.pdp = function (f1, X, j, grid) {
    return grid.map((v) => L.stat.mean(X.map((r) => { const c = r.slice(); c[j] = v; return f1(c); })));
  };
  IN.ice = (f1, x, j, grid) => grid.map((v) => { const c = x.slice(); c[j] = v; return f1(c); });
  /* Valores de Shapley exactos de f1 en x con un fondo B (filas). Coste 2^p · |B|. */
  IN.shapley = function (f1, x, B) {
    const p = x.length, Np = 1 << p;
    const val = new Float64Array(Np);
    for (let S = 0; S < Np; S++) {
      let s = 0;
      for (const b of B) { const z = b.map((v, j) => ((S >> j) & 1 ? x[j] : v)); s += f1(z); }
      val[S] = s / B.length;
    }
    const fact = [1];
    for (let i = 1; i <= p; i++) fact[i] = fact[i - 1] * i;
    const bits = (S) => { let c = 0; while (S) { c += S & 1; S >>= 1; } return c; };
    const phi = new Float64Array(p);
    for (let j = 0; j < p; j++) for (let S = 0; S < Np; S++) {
      if ((S >> j) & 1) continue;
      const k = bits(S);
      phi[j] += ((fact[k] * fact[p - k - 1]) / fact[p]) * (val[S | (1 << j)] - val[S]);
    }
    return { phi: Array.from(phi), base: val[0], fx: val[Np - 1] };
  };
  /* Validación cruzada genérica: fit(Xtr, ytr) → modelo; score(modelo, Xte, yte) → número */
  IN.cv = function (X, y, folds, fit, score) {
    const s = folds.map((f) => { const m = fit(f.train.map((i) => X[i]), f.train.map((i) => y[i])); return score(m, f.test.map((i) => X[i]), f.test.map((i) => y[i])); });
    return { scores: s, mean: L.stat.mean(s), sd: L.stat.std(s, 0) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
