/* ===================================================================
   lib/20-data.js — Conjuntos de datos sintéticos, particiones
   (entrenamiento/prueba, k pliegues) y preprocesamiento.
   X es un arreglo de filas (arreglos de números); y, un arreglo.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util;
  const D = (L.data = {});

  /* ---------- Generadores de clasificación 2D ---------- */
  /* Nubes gaussianas: centers = [[x, y], ...], sd escalar o por clase */
  D.blobs = function (n, centers, sd, rng) {
    const X = [], y = [], k = centers.length;
    for (let i = 0; i < n; i++) {
      const c = i % k, s = Array.isArray(sd) ? sd[c] : sd;
      X.push(centers[c].map((m) => m + s * rng.gauss()));
      y.push(c);
    }
    return { X, y };
  };
  /* Dos lunas entrelazadas (como sklearn.datasets.make_moons) */
  D.moons = function (n, noise, rng) {
    const X = [], y = [];
    const n0 = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const c = i < n0 ? 0 : 1;
      const m = c === 0 ? n0 : n - n0, j = c === 0 ? i : i - n0;
      const t = (Math.PI * j) / Math.max(1, m - 1);
      const x = c === 0 ? Math.cos(t) : 1 - Math.cos(t);
      const yy = c === 0 ? Math.sin(t) : 0.5 - Math.sin(t);
      X.push([x + noise * rng.gauss(), yy + noise * rng.gauss()]);
      y.push(c);
    }
    return { X, y };
  };
  /* Dos círculos concéntricos */
  D.circles = function (n, noise, factor, rng) {
    const X = [], y = [];
    const n0 = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const c = i < n0 ? 0 : 1;
      const t = 2 * Math.PI * rng();
      const r = c === 0 ? 1 : factor;
      X.push([r * Math.cos(t) + noise * rng.gauss(), r * Math.sin(t) + noise * rng.gauss()]);
      y.push(c);
    }
    return { X, y };
  };
  /* O exclusivo: cuatro cuadrantes */
  D.xor = function (n, noise, rng) {
    const X = [], y = [];
    for (let i = 0; i < n; i++) {
      const a = rng() < 0.5 ? -1 : 1, b = rng() < 0.5 ? -1 : 1;
      X.push([a * (0.15 + 0.85 * rng()) + noise * rng.gauss(), b * (0.15 + 0.85 * rng()) + noise * rng.gauss()]);
      y.push(a * b > 0 ? 0 : 1);
    }
    return { X, y };
  };
  /* Dos espirales */
  D.spiral = function (n, noise, rng, turns = 1.6) {
    const X = [], y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2, t = rng();
      const r = 0.15 + 0.85 * t, a = 2 * Math.PI * turns * t + c * Math.PI;
      X.push([r * Math.cos(a) + noise * rng.gauss(), r * Math.sin(a) + noise * rng.gauss()]);
      y.push(c);
    }
    return { X, y };
  };
  /* Gaussianas con covarianza: specs = [{n, mean:[mx,my], sd:[sx,sy], rho}] */
  D.gauss2 = function (specs, rng) {
    const X = [], y = [];
    specs.forEach((s, c) => {
      const [sx, sy] = s.sd, r = s.rho || 0;
      for (let i = 0; i < s.n; i++) {
        const z1 = rng.gauss(), z2 = rng.gauss();
        X.push([s.mean[0] + sx * z1, s.mean[1] + sy * (r * z1 + Math.sqrt(1 - r * r) * z2)]);
        y.push(c);
      }
    });
    return { X, y };
  };
  /* Catálogo usado por las simulaciones (centrado aproximadamente en [-1.6, 1.6]²) */
  D.make2d = function (kind, n, noise, rng) {
    let d;
    switch (kind) {
      case 'moons': d = D.moons(n, noise * 0.6, rng); d.X = d.X.map(([a, b]) => [1.25 * (a - 0.5), 1.25 * (b - 0.25) * 1.25]); break;
      case 'circles': d = D.circles(n, noise * 0.4, 0.45, rng); d.X = d.X.map(([a, b]) => [1.35 * a, 1.35 * b]); break;
      case 'xor': d = D.xor(n, noise * 0.35, rng); d.X = d.X.map(([a, b]) => [1.35 * a, 1.35 * b]); break;
      case 'spiral': d = D.spiral(n, noise * 0.25, rng); d.X = d.X.map(([a, b]) => [1.45 * a, 1.45 * b]); break;
      case 'linear': d = D.blobs(n, [[-0.7, -0.5], [0.7, 0.5]], 0.25 + 0.55 * noise, rng); break;
      case 'blobs3': d = D.blobs(n, [[-0.9, -0.6], [0.9, -0.5], [0, 0.9]], 0.2 + 0.45 * noise, rng); break;
      default: d = D.blobs(n, [[-0.7, -0.5], [0.7, 0.5]], 0.5, rng);
    }
    return d;
  };
  D.KINDS = [['moons', 'Lunas'], ['circles', 'Círculos'], ['xor', 'XOR'], ['spiral', 'Espirales'], ['linear', 'Lineal'], ['blobs3', 'Tres nubes']];

  /* ---------- Generadores de regresión ---------- */
  D.FUNCS = {
    sin: { n: 'seno', f: (x) => Math.sin(2.2 * x) },
    cubic: { n: 'cúbica', f: (x) => 0.5 * x * x * x - x },
    line: { n: 'recta', f: (x) => 0.8 * x + 0.3 },
    step: { n: 'escalón', f: (x) => (x < -0.3 ? -0.8 : x < 0.6 ? 0.4 : 1.1) },
    abs: { n: 'valor absoluto', f: (x) => Math.abs(x) - 0.7 }
  };
  D.reg1d = function (n, f, noise, rng, a = -1.6, b = 1.6, uniform) {
    const X = [], y = [];
    for (let i = 0; i < n; i++) {
      const x = uniform ? a + ((b - a) * (i + 0.5)) / n : a + (b - a) * rng();
      X.push([x]);
      y.push(f(x) + noise * rng.gauss());
    }
    return { X, y };
  };
  /* Regresión lineal múltiple: y = b0 + Σ b_j x_j + ruido; rho = correlación entre x1 y x2 */
  D.regLinear = function (n, coefs, noise, rng, rho = 0, b0 = 0) {
    const p = coefs.length, X = [], y = [];
    for (let i = 0; i < n; i++) {
      const z = Array.from({ length: p }, () => rng.gauss());
      if (p > 1 && rho) z[1] = rho * z[0] + Math.sqrt(1 - rho * rho) * z[1];
      X.push(z);
      let s = b0;
      for (let j = 0; j < p; j++) s += coefs[j] * z[j];
      y.push(s + noise * rng.gauss());
    }
    return { X, y };
  };

  /* ---------- Particiones ---------- */
  /* Índices de entrenamiento y prueba; estratificada si se da y */
  D.split = function (n, testFrac, rng, y) {
    if (y) {
      const tr = [], te = [];
      for (const c of U.unique(y)) {
        const idx = rng.shuffle(U.range(n).filter((i) => y[i] === c));
        const nt = Math.round(idx.length * testFrac);
        te.push(...idx.slice(0, nt));
        tr.push(...idx.slice(nt));
      }
      return { train: rng.shuffle(tr), test: rng.shuffle(te) };
    }
    const p = rng.perm(n), nt = Math.round(n * testFrac);
    return { train: p.slice(nt), test: p.slice(0, nt) };
  };
  /* k pliegues: devuelve [{train, test}] */
  D.kfold = function (n, k, rng, shuffle = true) {
    const idx = shuffle && rng ? rng.perm(n) : U.range(n);
    const folds = [];
    let start = 0;
    for (let f = 0; f < k; f++) {
      const size = Math.floor(n / k) + (f < n % k ? 1 : 0);
      const test = idx.slice(start, start + size);
      const testSet = new Set(test);
      folds.push({ test, train: idx.filter((i) => !testSet.has(i)) });
      start += size;
    }
    return folds;
  };
  /* k pliegues estratificados: reparte cada clase por turnos */
  D.stratKfold = function (y, k, rng) {
    const fold = new Int32Array(y.length);
    for (const c of U.unique(y)) {
      const idx = U.range(y.length).filter((i) => y[i] === c);
      if (rng) rng.shuffle(idx);
      idx.forEach((i, j) => { fold[i] = j % k; });
    }
    return U.range(k).map((f) => ({ test: U.range(y.length).filter((i) => fold[i] === f), train: U.range(y.length).filter((i) => fold[i] !== f) }));
  };
  /* División temporal en expansión: entrena con el pasado, prueba con el bloque siguiente */
  D.timeSplit = function (n, k) {
    const out = [], size = Math.floor(n / (k + 1));
    for (let f = 1; f <= k; f++) out.push({ train: U.range(f * size), test: U.range(size).map((i) => f * size + i) });
    return out;
  };
  D.subset = (d, idx) => ({ X: idx.map((i) => d.X[i]), y: idx.map((i) => d.y[i]) });

  /* ---------- Preprocesamiento ---------- */
  /* Estandarización (media 0, desviación 1 con ddof = 0, como StandardScaler) */
  D.standardizer = function (X) {
    const p = X[0].length, n = X.length;
    const mean = new Float64Array(p), sd = new Float64Array(p);
    for (const r of X) for (let j = 0; j < p; j++) mean[j] += r[j] / n;
    for (const r of X) for (let j = 0; j < p; j++) sd[j] += (r[j] - mean[j]) ** 2 / n;
    for (let j = 0; j < p; j++) sd[j] = Math.sqrt(sd[j]) || 1;
    return { mean, sd, transform: (Z) => Z.map((r) => r.map((v, j) => (v - mean[j]) / sd[j])), inverse: (Z) => Z.map((r) => r.map((v, j) => v * sd[j] + mean[j])) };
  };
  D.minmax = function (X) {
    const p = X[0].length;
    const lo = Array.from({ length: p }, (_, j) => Math.min(...X.map((r) => r[j])));
    const hi = Array.from({ length: p }, (_, j) => Math.max(...X.map((r) => r[j])));
    return { lo, hi, transform: (Z) => Z.map((r) => r.map((v, j) => (v - lo[j]) / ((hi[j] - lo[j]) || 1))) };
  };
  D.robust = function (X) {
    const p = X[0].length;
    const med = [], iqr = [];
    for (let j = 0; j < p; j++) {
      const c = X.map((r) => r[j]);
      med.push(L.stat.median(c));
      iqr.push(L.stat.quantile(c, 0.75) - L.stat.quantile(c, 0.25) || 1);
    }
    return { med, iqr, transform: (Z) => Z.map((r) => r.map((v, j) => (v - med[j]) / iqr[j])) };
  };
  /* Rasgos polinómicos de una o dos variables (sin columna constante) */
  D.poly = function (X, deg) {
    return X.map((r) => {
      const out = [];
      if (r.length === 1) { for (let d = 1; d <= deg; d++) out.push(Math.pow(r[0], d)); return out; }
      const [a, b] = r;
      for (let d = 1; d <= deg; d++) for (let i = d; i >= 0; i--) out.push(Math.pow(a, i) * Math.pow(b, d - i));
      return out;
    });
  };
  D.polyNames = function (deg, names = ['x₁', 'x₂']) {
    const sup = (k) => (k === 1 ? '' : ML.sup ? ML.sup(k) : '^' + k);
    const out = [];
    for (let d = 1; d <= deg; d++) for (let i = d; i >= 0; i--) {
      const s = (i ? names[0] + sup(i) : '') + (d - i ? names[1] + sup(d - i) : '');
      out.push(s);
    }
    return out;
  };
  D.addBias = (X) => X.map((r) => [1, ...r]);
})(typeof window !== 'undefined' ? window : globalThis);
