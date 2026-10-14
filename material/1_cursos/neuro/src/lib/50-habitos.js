/* ===================================================================
   lib/50-habitos.js — Formación de hábitos y medición del progreso:
   ajuste de la curva asintótica de Lally y otros (2010) por
   Levenberg-Marquardt, índice de automaticidad SRBAI (Gardner y otros,
   2012), rachas y la regla «nunca fallar dos veces», y un modelo de
   recaída con efecto de violación de la abstinencia.
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const H = (L.hab = {});

  /* Resuelve A x = b (n×n) por eliminación gaussiana con pivoteo parcial */
  L.solve = function (A, b) {
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      if (Math.abs(M[c][c]) < 1e-300) return null;
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  };

  /* Ajuste no lineal por mínimos cuadrados (Levenberg-Marquardt).
     f(t, p) → modelo; J(t, p) → gradiente respecto a p. Devuelve {p, sse, it} */
  L.levmar = function (ts, ys, f, J, p0, o = {}) {
    let p = p0.slice(), lam = o.lam0 || 1e-3;
    const n = p.length;
    const sse = (q) => { let s = 0; for (let i = 0; i < ts.length; i++) { const e = ys[i] - f(ts[i], q); s += e * e; } return s; };
    let cur = sse(p), it = 0;
    for (; it < (o.maxIt || 500); it++) {
      const JtJ = Array.from({ length: n }, () => new Array(n).fill(0)), Jte = new Array(n).fill(0);
      for (let i = 0; i < ts.length; i++) {
        const g = J(ts[i], p), e = ys[i] - f(ts[i], p);
        for (let a = 0; a < n; a++) { Jte[a] += g[a] * e; for (let b = 0; b < n; b++) JtJ[a][b] += g[a] * g[b]; }
      }
      let improved = false;
      for (let tries = 0; tries < 30; tries++) {
        const M = JtJ.map((r, a) => r.map((v, b) => (a === b ? v * (1 + lam) + 1e-12 : v)));
        const dp = L.solve(M, Jte);
        if (!dp) { lam *= 10; continue; }
        const q = p.map((v, a) => v + dp[a]);
        if (o.constrain) o.constrain(q);
        const s = sse(q);
        if (s < cur) {
          const rel = (cur - s) / Math.max(cur, 1e-300);
          p = q; cur = s; lam = Math.max(lam / 10, 1e-12); improved = true;
          if (rel < 1e-14) it = 1e9;
          break;
        }
        lam *= 10;
      }
      if (!improved) break;
    }
    return { p, sse: cur, it };
  };

  /* ---------- Curva de automaticidad de Lally y otros (2010): A(t) = a − b e^{−c t} ---------- */
  H.lallyF = (t, p) => p[0] - p[1] * Math.exp(-p[2] * t);
  H.lallyJ = (t, p) => { const e = Math.exp(-p[2] * t); return [1, -e, p[1] * t * e]; };
  H.fitLally = function (ts, ys, p0) {
    const ymax = Math.max(...ys), y0 = ys[0];
    const init = p0 || [ymax * 1.05, Math.max(0.1, ymax * 1.05 - y0), 0.04];
    const r = L.levmar(ts, ys, H.lallyF, H.lallyJ, init, { constrain: (q) => { q[2] = Math.max(1e-5, Math.min(2, q[2])); } });
    const [a, b, c] = r.p;
    const t95 = b > 0.05 * a && a > 0 ? Math.log(b / (0.05 * a)) / c : 0;
    const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
    const sst = ys.reduce((s, v) => s + (v - mean) * (v - mean), 0);
    return { a, b, c, t95, sse: r.sse, r2: sst > 0 ? 1 - r.sse / sst : NaN, it: r.it };
  };
  /* Datos simulados de una persona: automaticidad (escala 1–7) que crece con ruido de autorreporte */
  H.simLally = function (o) {
    const rng = L.rng(o.seed || 21), days = o.days || 84, ts = [], ys = [];
    let A = o.A0 === undefined ? 1.5 : o.A0;
    const amax = o.amax || 6, c = o.c || 0.05, miss = o.miss || 0;
    for (let t = 0; t <= days; t++) {
      if (rng() >= miss) A += (amax - A) * (1 - Math.exp(-c));
      else A -= (o.lossOnMiss || 0) * (A - 1);
      if (t % (o.every || 1) === 0) { ts.push(t); ys.push(Math.min(7, Math.max(1, A + (o.noise || 0.35) * rng.gauss()))); }
    }
    return { ts, ys };
  };

  /* ---------- Índice de automaticidad SRBAI (4 ítems, escala 1–7) ---------- */
  H.SRBAI_ITEMS = ['Lo hago automáticamente', 'Lo hago sin tener que recordarlo conscientemente', 'Lo hago sin pensar', 'Empiezo a hacerlo antes de darme cuenta de que lo estoy haciendo'];
  H.srbai = (items) => items.reduce((a, b) => a + b, 0) / items.length;

  /* ---------- Rachas ---------- */
  /* dias: arreglo de 1 (cumplido), 0 (fallado) o null (sin dato) en orden cronológico */
  H.streaks = function (dias) {
    let cur = 0, best = 0, dobles = 0, prevMiss = false, done = 0, total = 0;
    for (const d of dias) {
      if (d === null || d === undefined) { prevMiss = false; continue; }
      total++;
      if (d) { cur++; done++; best = Math.max(best, cur); prevMiss = false; }
      else { cur = 0; if (prevMiss) dobles++; prevMiss = true; }
    }
    return { actual: cur, mejor: best, dobles, tasa: total ? done / total : NaN, total };
  };

  /* ---------- Recaída y «ya qué» (efecto de violación de la abstinencia, Marlatt) ----------
     Cada día hay una tentación con probabilidad pT; se resiste con probabilidad pR (que crece con la
     automaticidad del hábito nuevo). Tras un desliz, si aplica el pensamiento «ya lo arruiné», la
     probabilidad de resistir se reduce (factor fallo) durante `dias` días. Devuelve deslices por semana. */
  H.relapse = function (o) {
    const rng = L.rng(o.seed || 8), N = o.days || 84;
    let A = 0, castigo = 0;
    const lapses = new Array(Math.ceil(N / 7)).fill(0), auto = [];
    for (let d = 0; d < N; d++) {
      const pR = Math.min(0.99, (o.pR0 || 0.7) + (o.gain || 0.25) * A) * (castigo > 0 ? o.factor || 0.5 : 1);
      const tent = rng() < (o.pT || 0.5);
      let slip = false;
      if (tent && rng() > pR) slip = true;
      if (slip) { lapses[Math.floor(d / 7)]++; if (o.avr) castigo = o.dias || 3; A *= 1 - (o.loss || 0.05); }
      else { A += (1 - A) * (o.c || 0.04); if (castigo > 0) castigo--; }
      auto.push(A);
    }
    return { lapses, auto };
  };
})(typeof window !== 'undefined' ? window : globalThis);
