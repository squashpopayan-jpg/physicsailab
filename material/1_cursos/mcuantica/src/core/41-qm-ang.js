/* ===================================================================
   41-qm-ang.js — Momento angular (EM.qm.ang): armónicos esféricos complejos, matrices J, rotor rígido.
   ħ = 1 salvo indicación. Requiere EM.P.sf (31-numerics.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const A = (qm.ang = {});
  /* Y_l^m(θ, φ) con la fase de Condon–Shortley → [re, im] */
  A.Y = function (l, m, th, ph) {
    const S = EM.P.sf, am = Math.abs(m);
    const N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (S.fact(l - am) / S.fact(l + am)));
    let P = N * S.legendre(l, am, Math.cos(th)), re = P * Math.cos(am * ph), im = P * Math.sin(am * ph);
    if (m < 0) { const s = am % 2 ? -1 : 1; re = s * re; im = -s * im; }
    return [re, im];
  };
  A.Y2 = (l, m, th) => { const q = A.Y(l, m, th, 0); return q[0] * q[0] + q[1] * q[1]; };
  /* Matrices de momento angular j (entero o semientero) en la base |j, m⟩ con m = j, j−1, …, −j (ħ = 1): devuelve {n, Jz, Jp, Jm, Jx, Jy} donde cada
     matriz compleja es {re, im} con filas/columnas ordenadas por m decreciente. */
  A.jmat = function (j) {
    const n = Math.round(2 * j + 1), z = () => Array.from({ length: n }, () => new Float64Array(n)), M = () => ({ re: z(), im: z() });
    const Jz = M(), Jp = M(), Jm = M(), Jx = M(), Jy = M();
    for (let a = 0; a < n; a++) {
      const m = j - a; Jz.re[a][a] = m;
      if (a > 0) { const mm = m, c = Math.sqrt(j * (j + 1) - mm * (mm + 1)); Jp.re[a - 1][a] = c; Jm.re[a][a - 1] = c; } /* J+|m⟩ = c |m+1⟩ (fila a−1 = m+1) */
    }
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { Jx.re[a][b] = 0.5 * (Jp.re[a][b] + Jm.re[a][b]); Jy.im[a][b] = -0.5 * (Jp.re[a][b] - Jm.re[a][b]); }
    return { n, Jz, Jp, Jm, Jx, Jy };
  };
  A.cmul = function (X, Y) {
    const n = X.re.length, R = { re: Array.from({ length: n }, () => new Float64Array(n)), im: Array.from({ length: n }, () => new Float64Array(n)) };
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const ar = X.re[i][k], ai = X.im[i][k]; if (!ar && !ai) continue; for (let j = 0; j < n; j++) { R.re[i][j] += ar * Y.re[k][j] - ai * Y.im[k][j]; R.im[i][j] += ar * Y.im[k][j] + ai * Y.re[k][j]; } }
    return R;
  };
  /* Rotor rígido: E_l = B l(l+1) con B = ħ²/2I; elementos de cos θ entre |l,0⟩ y |l+1,0⟩: (l+1)/√((2l+1)(2l+3)) */
  A.cosElem = (l) => (l + 1) / Math.sqrt((2 * l + 1) * (2 * l + 3));
  /* ⟨cos²θ⟩ de una superposición Σ c_l |l,0⟩ (c complejos) con fases e^{−iB l(l+1) t} */
  A.cos2 = function (c, B, t) {
    const L = c.length, amp = (l) => { const ph = -B * l * (l + 1) * t; return [c[l][0] * Math.cos(ph) - c[l][1] * Math.sin(ph), c[l][0] * Math.sin(ph) + c[l][1] * Math.cos(ph)]; };
    const a = []; for (let l = 0; l < L; l++) a.push(amp(l));
    let s = 0; const cl = (l) => A.cosElem(l);
    for (let l = 0; l < L; l++) {
      /* diagonal: ⟨l|cos²|l⟩ = cl(l)² + cl(l−1)² */
      const d = cl(l) ** 2 + (l > 0 ? cl(l - 1) ** 2 : 0); s += d * (a[l][0] ** 2 + a[l][1] ** 2);
      /* l → l+2: cl(l)cl(l+1) */
      if (l + 2 < L) { const o = cl(l) * cl(l + 1); s += 2 * o * (a[l][0] * a[l + 2][0] + a[l][1] * a[l + 2][1]); }
    }
    return s;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
