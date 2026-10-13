/* ===================================================================
   lib/00-linalg.js — Álgebra lineal numérica (sin DOM).
   Autovalores de matrices simétricas (Jacobi; Householder + QL),
   hermíticas (inmersión real 2n), tridiagonales (Sturm + iteración
   inversa), problema generalizado H c = E S c, sistemas lineales.
   Todo el núcleo vive en ML.L y se prueba en Node (tests/validar.js).
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const P = (ML.L = ML.L || {});
  const LA = (P.la = {});

  LA.zeros = (n, m) => Array.from({ length: n }, () => new Float64Array(m === undefined ? n : m));
  LA.eye = (n) => { const A = LA.zeros(n); for (let i = 0; i < n; i++) A[i][i] = 1; return A; };
  LA.copy = (A) => A.map((r) => Float64Array.from(r));
  LA.matvec = (A, x) => A.map((r) => { let s = 0; for (let j = 0; j < x.length; j++) s += r[j] * x[j]; return s; });
  LA.matmul = (A, B) => {
    const n = A.length, m = B[0].length, k = B.length;
    const C = LA.zeros(n, m);
    for (let i = 0; i < n; i++) for (let l = 0; l < k; l++) { const a = A[i][l]; if (a === 0) continue; for (let j = 0; j < m; j++) C[i][j] += a * B[l][j]; }
    return C;
  };
  LA.transpose = (A) => { const n = A.length, m = A[0].length, T = LA.zeros(m, n); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) T[j][i] = A[i][j]; return T; };
  LA.dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

  /* Ordena autovalores (ascendente) y reordena columnas de V */
  function sortEig(w, V) {
    const n = w.length;
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => w[a] - w[b]);
    const w2 = new Float64Array(n);
    const V2 = V ? LA.zeros(V.length, n) : null;
    idx.forEach((k, c) => { w2[c] = w[k]; if (V) for (let r = 0; r < V.length; r++) V2[r][c] = V[r][k]; });
    return { values: w2, vectors: V2 };
  }

  /* Jacobi cíclico para matrices simétricas pequeñas. Devuelve {values, vectors (columnas)} */
  LA.jacobi = function (A0, o = {}) {
    const n = A0.length;
    const A = LA.copy(A0);
    const V = LA.eye(n);
    const maxSweep = o.maxSweep || 60;
    for (let sweep = 0; sweep < maxSweep; sweep++) {
      let off = 0;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-30) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    return sortEig(Array.from({ length: n }, (_, i) => A[i][i]), V);
  };

  /* Householder (tred2) + QL implícito (tqli). Matrices simétricas medianas (n ≲ 500). */
  LA.eigh = function (A0, o = {}) {
    const n = A0.length;
    if (n === 0) return { values: new Float64Array(0), vectors: [] };
    if (n === 1) return { values: Float64Array.of(A0[0][0]), vectors: [Float64Array.of(1)] };
    const wantV = o.vectors !== false;
    const a = LA.copy(A0);
    const d = new Float64Array(n), e = new Float64Array(n);
    /* tred2 */
    for (let i = n - 1; i > 0; i--) {
      const l = i - 1;
      let h = 0, scale = 0;
      if (l > 0) {
        for (let k = 0; k <= l; k++) scale += Math.abs(a[i][k]);
        if (scale === 0) e[i] = a[i][l];
        else {
          for (let k = 0; k <= l; k++) { a[i][k] /= scale; h += a[i][k] * a[i][k]; }
          let f = a[i][l];
          const g = f >= 0 ? -Math.sqrt(h) : Math.sqrt(h);
          e[i] = scale * g;
          h -= f * g;
          a[i][l] = f - g;
          f = 0;
          for (let j = 0; j <= l; j++) {
            if (wantV) a[j][i] = a[i][j] / h;
            let gg = 0;
            for (let k = 0; k <= j; k++) gg += a[j][k] * a[i][k];
            for (let k = j + 1; k <= l; k++) gg += a[k][j] * a[i][k];
            e[j] = gg / h;
            f += e[j] * a[i][j];
          }
          const hh = f / (h + h);
          for (let j = 0; j <= l; j++) {
            const ff = a[i][j];
            const g2 = (e[j] = e[j] - hh * ff);
            for (let k = 0; k <= j; k++) a[j][k] -= ff * e[k] + g2 * a[i][k];
          }
        }
      } else e[i] = a[i][l];
      d[i] = h;
    }
    d[0] = 0; e[0] = 0;
    for (let i = 0; i < n; i++) {
      if (wantV) {
        const l = i - 1;
        if (d[i]) {
          for (let j = 0; j <= l; j++) {
            let g = 0;
            for (let k = 0; k <= l; k++) g += a[i][k] * a[k][j];
            for (let k = 0; k <= l; k++) a[k][j] -= g * a[k][i];
          }
        }
        d[i] = a[i][i];
        a[i][i] = 1;
        for (let j = 0; j <= l; j++) a[j][i] = a[i][j] = 0;
      } else d[i] = a[i][i];
    }
    /* tqli */
    for (let i = 1; i < n; i++) e[i - 1] = e[i];
    e[n - 1] = 0;
    for (let l = 0; l < n; l++) {
      let iter = 0, m;
      do {
        for (m = l; m < n - 1; m++) {
          const dd = Math.abs(d[m]) + Math.abs(d[m + 1]);
          if (Math.abs(e[m]) <= 1e-15 * dd) break;
        }
        if (m !== l) {
          if (iter++ === 60) break;
          let g = (d[l + 1] - d[l]) / (2 * e[l]);
          let r = Math.hypot(g, 1);
          g = d[m] - d[l] + e[l] / (g + (g >= 0 ? Math.abs(r) : -Math.abs(r)));
          let s = 1, c = 1, p = 0, i;
          for (i = m - 1; i >= l; i--) {
            let f = s * e[i];
            const b = c * e[i];
            e[i + 1] = r = Math.hypot(f, g);
            if (r === 0) { d[i + 1] -= p; e[m] = 0; break; }
            s = f / r; c = g / r;
            g = d[i + 1] - p;
            r = (d[i] - g) * s + 2 * c * b;
            d[i + 1] = g + (p = s * r);
            g = c * r - b;
            if (wantV) for (let k = 0; k < n; k++) { f = a[k][i + 1]; a[k][i + 1] = s * a[k][i] + c * f; a[k][i] = c * a[k][i] - s * f; }
          }
          if (r === 0 && i >= l) continue;
          d[l] -= p; e[l] = g; e[m] = 0;
        }
      } while (m !== l);
    }
    return sortEig(d, wantV ? a : null);
  };

  /* Hermítica n×n dada como (Re, Im) → inmersión real 2n×2n [[Re,−Im],[Im,Re]].
     Cada autovalor aparece dos veces; se toma uno de cada par. */
  LA.eighC = function (Re, Im, o = {}) {
    const n = Re.length;
    const M = LA.zeros(2 * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      M[i][j] = Re[i][j]; M[i + n][j + n] = Re[i][j];
      M[i][j + n] = -Im[i][j]; M[i + n][j] = Im[i][j];
    }
    const r = LA.eigh(M, o);
    const values = new Float64Array(n);
    const vre = o.vectors === false ? null : LA.zeros(n), vim = o.vectors === false ? null : LA.zeros(n);
    for (let c = 0; c < n; c++) {
      values[c] = r.values[2 * c];
      if (vre) for (let i = 0; i < n; i++) { vre[i][c] = r.vectors[i][2 * c]; vim[i][c] = r.vectors[i + n][2 * c]; }
    }
    return { values, re: vre, im: vim };
  };

  /* Autovalores más bajos de una tridiagonal simétrica (diagonal d[0..n-1], subdiagonal e[0..n-2])
     por bisección con secuencias de Sturm y autovectores por iteración inversa (Thomas). */
  LA.sturmCount = function (d, e, x) {
    /* número de autovalores menores que x */
    let cnt = 0, q = d[0] - x;
    if (q < 0) cnt++;
    for (let i = 1; i < d.length; i++) {
      const qq = q === 0 ? 1e-300 : q;
      q = d[i] - x - (e[i - 1] * e[i - 1]) / qq;
      if (q < 0) cnt++;
    }
    return cnt;
  };
  LA.tridiagLowest = function (d, e, k, o = {}) {
    const n = d.length;
    k = Math.min(k, n);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < n - 1 ? Math.abs(e[i]) : 0);
      lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r);
    }
    const values = new Float64Array(k);
    for (let j = 0; j < k; j++) {
      let a = lo, b = hi;
      for (let it = 0; it < 200; it++) {
        const m = 0.5 * (a + b);
        if (LA.sturmCount(d, e, m) > j) b = m; else a = m;
        if (b - a < 1e-14 * Math.max(1, Math.abs(m))) break;
      }
      values[j] = 0.5 * (a + b);
    }
    if (o.vectors === false) return { values };
    const vecs = [];
    for (let j = 0; j < k; j++) {
      const lam = values[j] + 1e-10 * Math.max(1, Math.abs(values[j]));
      let x = new Float64Array(n);
      for (let i = 0; i < n; i++) x[i] = 1 + 0.01 * Math.sin(1.7 * i + j);
      for (let it = 0; it < 4; it++) {
        x = LA.thomas(e, d.map((v) => v - lam), e, x);
        /* ortogonaliza respecto de los anteriores (degeneraciones casi exactas) */
        for (const v of vecs) { const p = LA.dot(v, x); for (let i = 0; i < n; i++) x[i] -= p * v[i]; }
        const nr = Math.sqrt(LA.dot(x, x));
        for (let i = 0; i < n; i++) x[i] /= nr;
      }
      /* signo convencional: primer lóbulo positivo */
      let s = 0;
      for (let i = 0; i < n && Math.abs(s) < 1e-3; i++) s += x[i];
      if (s < 0) for (let i = 0; i < n; i++) x[i] = -x[i];
      vecs.push(x);
    }
    return { values, vectors: vecs };
  };

  /* Sistema tridiagonal real: a (sub), b (diag), c (super), r → x */
  LA.thomas = function (a, b, c, r) {
    const n = b.length;
    const cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
    let den = b[0];
    cp[0] = n > 1 ? c[0] / den : 0; dp[0] = r[0] / den;
    for (let i = 1; i < n; i++) {
      den = b[i] - a[i - 1] * cp[i - 1];
      if (den === 0) den = 1e-300;
      cp[i] = i < n - 1 ? c[i] / den : 0;
      dp[i] = (r[i] - a[i - 1] * dp[i - 1]) / den;
    }
    x[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  };
  /* Tridiagonal compleja con coeficientes constantes fuera de la diagonal (Crank–Nicolson).
     Resuelve (diagonal bRe+i·bIm, fuera de diagonal off=offRe+i·offIm) x = r */
  LA.thomasC = function (bRe, bIm, offRe, offIm, rRe, rIm) {
    const n = bRe.length;
    const cRe = new Float64Array(n), cIm = new Float64Array(n), dRe = new Float64Array(n), dIm = new Float64Array(n);
    const xRe = new Float64Array(n), xIm = new Float64Array(n);
    let denRe = bRe[0], denIm = bIm[0];
    let q = denRe * denRe + denIm * denIm;
    cRe[0] = (offRe * denRe + offIm * denIm) / q; cIm[0] = (offIm * denRe - offRe * denIm) / q;
    dRe[0] = (rRe[0] * denRe + rIm[0] * denIm) / q; dIm[0] = (rIm[0] * denRe - rRe[0] * denIm) / q;
    for (let i = 1; i < n; i++) {
      /* den = b_i − off·c_{i−1} */
      denRe = bRe[i] - (offRe * cRe[i - 1] - offIm * cIm[i - 1]);
      denIm = bIm[i] - (offRe * cIm[i - 1] + offIm * cRe[i - 1]);
      q = denRe * denRe + denIm * denIm;
      cRe[i] = (offRe * denRe + offIm * denIm) / q; cIm[i] = (offIm * denRe - offRe * denIm) / q;
      const nRe = rRe[i] - (offRe * dRe[i - 1] - offIm * dIm[i - 1]);
      const nIm = rIm[i] - (offRe * dIm[i - 1] + offIm * dRe[i - 1]);
      dRe[i] = (nRe * denRe + nIm * denIm) / q; dIm[i] = (nIm * denRe - nRe * denIm) / q;
    }
    xRe[n - 1] = dRe[n - 1]; xIm[n - 1] = dIm[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      xRe[i] = dRe[i] - (cRe[i] * xRe[i + 1] - cIm[i] * xIm[i + 1]);
      xIm[i] = dIm[i] - (cRe[i] * xIm[i + 1] + cIm[i] * xRe[i + 1]);
    }
    return [xRe, xIm];
  };

  /* Eliminación gaussiana con pivoteo parcial: resuelve A x = b */
  LA.solve = function (A0, b0) {
    const n = A0.length;
    const A = LA.copy(A0), b = Float64Array.from(b0);
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-300) return null;
      [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
      for (let r = c + 1; r < n; r++) {
        const f = A[r][c] / A[c][c];
        if (f === 0) continue;
        for (let j = c; j < n; j++) A[r][j] -= f * A[c][j];
        b[r] -= f * b[c];
      }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return x;
  };
  /* Inversa por Gauss–Jordan con pivoteo parcial (null si es singular) */
  LA.inv = function (A0, tol = 1e-12) {
    const n = A0.length;
    const M = A0.map((row, i) => { const r = new Float64Array(2 * n); for (let j = 0; j < n; j++) r[j] = row[j]; r[n + i] = 1; return r; });
    let scale = 0;
    for (const row of A0) for (const v of row) scale = Math.max(scale, Math.abs(v));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) <= tol * (scale || 1)) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      const dd = M[c][c];
      for (let j = 0; j < 2 * n; j++) M[c][j] /= dd;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c];
        if (f === 0) continue;
        for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
      }
    }
    return M.map((row) => row.slice(n));
  };
  /* Cholesky: S = L Lᵀ (S simétrica definida positiva) */
  LA.cholesky = function (S) {
    const n = S.length, L = LA.zeros(n);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = S[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (s <= 0) return null; L[i][i] = Math.sqrt(s); }
      else L[i][j] = s / L[j][j];
    }
    return L;
  };
  /* Problema generalizado H c = E S c (S definida positiva) por reducción de Cholesky */
  LA.geneig = function (H, S) {
    const n = H.length;
    const L = LA.cholesky(S);
    if (!L) return null;
    /* Li = L⁻¹ (triangular inferior) */
    const Li = LA.zeros(n);
    for (let i = 0; i < n; i++) {
      Li[i][i] = 1 / L[i][i];
      for (let j = 0; j < i; j++) {
        let s = 0;
        for (let k = j; k < i; k++) s -= L[i][k] * Li[k][j];
        Li[i][j] = s / L[i][i];
      }
    }
    const A = LA.matmul(LA.matmul(Li, H), LA.transpose(Li));
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const m = 0.5 * (A[i][j] + A[j][i]); A[i][j] = A[j][i] = m; }
    const r = LA.eigh(A);
    const C = LA.matmul(LA.transpose(Li), r.vectors);
    return { values: r.values, vectors: C, cond: L.reduce((m, row, i) => Math.max(m, row[i]), 0) / L.reduce((m, row, i) => Math.min(m, row[i]), Infinity) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
