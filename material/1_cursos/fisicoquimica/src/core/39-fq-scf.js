/* ===================================================================
   39-fq-scf.js — Hartree–Fock desde cero: integrales de gaussianas cartesianas (McMurchie–Davidson), SCF restringido (RHF) y no restringido (UHF) con DIIS.
   Bases STO-3G y 6-31G de EM.basis (H–Ne). Unidades atómicas: bohr y hartree.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const BAS = EM.basis || (typeof require !== 'undefined' ? require('./29-basis.js') : null);
  const H = (FQ.scf = {});
  const PI = Math.PI;
  const dfact = (n) => { let f = 1; for (let i = n; i > 1; i -= 2) f *= i; return f; }; /* n!! con (−1)!! = 1 */

  /* ---- Función de Boys F_n(x), n = 0..nmax ---- */
  H.boys = function (nmax, x) {
    const F = new Float64Array(nmax + 1);
    if (x < 35) {
      let term = 1 / (2 * nmax + 1), sum = term; for (let k = 1; k < 200; k++) { term *= (2 * x) / (2 * nmax + 2 * k + 1); sum += term; if (term < 1e-17 * sum) break; }
      F[nmax] = Math.exp(-x) * sum; const ex = Math.exp(-x); for (let n = nmax; n > 0; n--) F[n - 1] = (2 * x * F[n] + ex) / (2 * n - 1);
    } else { F[0] = 0.5 * Math.sqrt(PI / x); const ex = Math.exp(-x); for (let n = 0; n < nmax; n++) F[n + 1] = ((2 * n + 1) * F[n] - ex) / (2 * x); }
    return F;
  };

  /* ---- Coeficientes de expansión en gaussianas de Hermite ---- */
  const Ecoef = function E(i, j, t, Q, a, b) {
    const p = a + b, q = (a * b) / p;
    if (t < 0 || t > i + j) return 0;
    if (i === 0 && j === 0 && t === 0) return Math.exp(-q * Q * Q);
    if (j === 0) return (1 / (2 * p)) * E(i - 1, j, t - 1, Q, a, b) - ((q * Q) / a) * E(i - 1, j, t, Q, a, b) + (t + 1) * E(i - 1, j, t + 1, Q, a, b);
    return (1 / (2 * p)) * E(i, j - 1, t - 1, Q, a, b) + ((q * Q) / b) * E(i, j - 1, t, Q, a, b) + (t + 1) * E(i, j - 1, t + 1, Q, a, b);
  };
  /* Integrales de Hermite coulombianas R_{tuv} (n = 0) hasta orden total L */
  const Rtuv = function (L, alpha, X, Y, Z) {
    const T = alpha * (X * X + Y * Y + Z * Z), F = H.boys(L, T), R = [];
    for (let n = 0; n <= L; n++) { R[n] = {}; }
    const key = (t, u, v) => t * 100 + u * 10 + v;
    for (let n = 0; n <= L; n++) R[n][0] = Math.pow(-2 * alpha, n) * F[n];
    for (let tot = 1; tot <= L; tot++) {
      for (let t = 0; t <= tot; t++) for (let u = 0; u <= tot - t; u++) { const v = tot - t - u; for (let n = 0; n <= L - tot; n++) {
        let val;
        if (t > 0) val = (t - 1 > 0 ? (t - 1) * R[n + 1][key(t - 2, u, v)] : 0) + X * R[n + 1][key(t - 1, u, v)];
        else if (u > 0) val = (u - 1 > 0 ? (u - 1) * R[n + 1][key(t, u - 2, v)] : 0) + Y * R[n + 1][key(t, u - 1, v)];
        else val = (v - 1 > 0 ? (v - 1) * R[n + 1][key(t, u, v - 2)] : 0) + Z * R[n + 1][key(t, u, v - 1)];
        R[n][key(t, u, v)] = val; } }
    }
    return (t, u, v) => R[0][key(t, u, v)];
  };

  /* ---- Construcción de la base ---- */
  H.PLIST = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
  H.build = function (atoms, name) {
    const fns = [];
    atoms.forEach((a, ia) => {
      for (const sh of BAS[name][a.Z]) {
        const comps = sh.l === 0 ? [[0, 0, 0]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        for (const lmn of comps) {
          const L = lmn[0] + lmn[1] + lmn[2], prim = sh.e.map((e, k) => ({ a: e, c: sh.c[k] * Math.pow((2 * e) / PI, 0.75) * Math.pow(4 * e, L / 2) / Math.sqrt(dfact(2 * lmn[0] - 1) * dfact(2 * lmn[1] - 1) * dfact(2 * lmn[2] - 1)) }));
          const f = { atom: ia, R: a.xyz, lmn, prim }; /* normalización de la contracción */
          const s = H.overlapFn(f, f); prim.forEach((q) => { q.c /= Math.sqrt(s); }); fns.push(f);
        }
      }
    });
    return fns;
  };
  /* ---- Integrales entre primitivas ---- */
  const S1 = (i, j, Q, a, b) => Ecoef(i, j, 0, Q, a, b) * Math.sqrt(PI / (a + b));
  const overlapPrim = (A, la, a, B, lb, b) => S1(la[0], lb[0], A[0] - B[0], a, b) * S1(la[1], lb[1], A[1] - B[1], a, b) * S1(la[2], lb[2], A[2] - B[2], a, b);
  H.overlapFn = (f, g) => { let s = 0; for (const p of f.prim) for (const q of g.prim) s += p.c * q.c * overlapPrim(f.R, f.lmn, p.a, g.R, g.lmn, q.a); return s; };
  const kineticPrim = (A, la, a, B, lb, b) => {
    const [l, m, n] = lb, S = (dl, dm, dn) => (l + dl < 0 || m + dm < 0 || n + dn < 0 ? 0 : overlapPrim(A, la, a, B, [l + dl, m + dm, n + dn], b));
    return b * (2 * (l + m + n) + 3) * S(0, 0, 0) - 2 * b * b * (S(2, 0, 0) + S(0, 2, 0) + S(0, 0, 2)) - 0.5 * (l * (l - 1) * S(-2, 0, 0) + m * (m - 1) * S(0, -2, 0) + n * (n - 1) * S(0, 0, -2));
  };
  const nuclearPrim = (A, la, a, B, lb, b, C) => {
    const p = a + b, P = [0, 1, 2].map((k) => (a * A[k] + b * B[k]) / p), L = la[0] + la[1] + la[2] + lb[0] + lb[1] + lb[2], R = Rtuv(L, p, P[0] - C[0], P[1] - C[1], P[2] - C[2]); let s = 0;
    for (let t = 0; t <= la[0] + lb[0]; t++) { const ex = Ecoef(la[0], lb[0], t, A[0] - B[0], a, b); for (let u = 0; u <= la[1] + lb[1]; u++) { const ey = Ecoef(la[1], lb[1], u, A[1] - B[1], a, b); for (let v = 0; v <= la[2] + lb[2]; v++) s += ex * ey * Ecoef(la[2], lb[2], v, A[2] - B[2], a, b) * R(t, u, v); } }
    return (2 * PI / p) * s;
  };
  const dipolePrim = (A, la, a, B, lb, b, k) => { /* ⟨a| x_k |b⟩ con origen en 0 */
    const p = a + b, P = (a * A[k] + b * B[k]) / p, s = [0, 1, 2].map((q) => (q === k ? Ecoef(la[q], lb[q], 1, A[q] - B[q], a, b) * Math.sqrt(PI / p) + P * S1(la[q], lb[q], A[q] - B[q], a, b) : S1(la[q], lb[q], A[q] - B[q], a, b)));
    return s[0] * s[1] * s[2];
  };
  /* Productos de pares para las ERI: lista de {p, P, E: Float64Array 3D de (t,u,v), coef} */
  const pairData = (f, g) => {
    const out = [];
    for (const pa of f.prim) for (const pb of g.prim) {
      const a = pa.a, b = pb.a, p = a + b, P = [0, 1, 2].map((k) => (a * f.R[k] + b * g.R[k]) / p), tx = f.lmn[0] + g.lmn[0], ty = f.lmn[1] + g.lmn[1], tz = f.lmn[2] + g.lmn[2];
      const Ex = [], Ey = [], Ez = []; for (let t = 0; t <= tx; t++) Ex.push(Ecoef(f.lmn[0], g.lmn[0], t, f.R[0] - g.R[0], a, b)); for (let u = 0; u <= ty; u++) Ey.push(Ecoef(f.lmn[1], g.lmn[1], u, f.R[1] - g.R[1], a, b)); for (let v = 0; v <= tz; v++) Ez.push(Ecoef(f.lmn[2], g.lmn[2], v, f.R[2] - g.R[2], a, b));
      out.push({ p, P, Ex, Ey, Ez, c: pa.c * pb.c, L: tx + ty + tz });
    }
    return out;
  };
  const eriPair = (A, B) => {
    let s = 0;
    for (const x of A) for (const y of B) {
      const al = (x.p * y.p) / (x.p + y.p), L = x.L + y.L, R = Rtuv(L, al, x.P[0] - y.P[0], x.P[1] - y.P[1], x.P[2] - y.P[2]); let acc = 0;
      for (let t = 0; t < x.Ex.length; t++) for (let u = 0; u < x.Ey.length; u++) for (let v = 0; v < x.Ez.length; v++) { const e1 = x.Ex[t] * x.Ey[u] * x.Ez[v]; if (e1 === 0) continue; for (let t2 = 0; t2 < y.Ex.length; t2++) for (let u2 = 0; u2 < y.Ey.length; u2++) for (let v2 = 0; v2 < y.Ez.length; v2++) acc += e1 * y.Ex[t2] * y.Ey[u2] * y.Ez[v2] * (((t2 + u2 + v2) & 1) ? -1 : 1) * R(t + t2, u + u2, v + v2); }
      s += x.c * y.c * ((2 * Math.pow(PI, 2.5)) / (x.p * y.p * Math.sqrt(x.p + y.p))) * acc;
    }
    return s;
  };

  /* ---- Integrales moleculares ---- */
  H.integrals = function (atoms, fns) {
    const n = fns.length, mat = () => Array.from({ length: n }, () => new Float64Array(n)), S = mat(), T = mat(), V = mat(), D = [mat(), mat(), mat()];
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = 0, t = 0, v = 0, d = [0, 0, 0];
      for (const p of fns[i].prim) for (const q of fns[j].prim) { const c = p.c * q.c; s += c * overlapPrim(fns[i].R, fns[i].lmn, p.a, fns[j].R, fns[j].lmn, q.a); t += c * kineticPrim(fns[i].R, fns[i].lmn, p.a, fns[j].R, fns[j].lmn, q.a); for (const at of atoms) v -= c * at.Z * nuclearPrim(fns[i].R, fns[i].lmn, p.a, fns[j].R, fns[j].lmn, q.a, at.xyz); for (let k = 0; k < 3; k++) d[k] += c * dipolePrim(fns[i].R, fns[i].lmn, p.a, fns[j].R, fns[j].lmn, q.a, k); }
      S[i][j] = S[j][i] = s; T[i][j] = T[j][i] = t; V[i][j] = V[j][i] = v; for (let k = 0; k < 3; k++) D[k][i][j] = D[k][j][i] = d[k];
    }
    /* ERI (ij|kl) con simetría de ocho pliegues, almacenadas en un Float64Array n⁴ */
    const pd = {}; const getPd = (i, j) => { const key = i * n + j; return pd[key] || (pd[key] = pairData(fns[i], fns[j])); };
    const eri = new Float64Array(n * n * n * n), idx = (i, j, k, l) => ((i * n + j) * n + k) * n + l;
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { const ij = i * (i + 1) / 2 + j; for (let k = 0; k <= i; k++) for (let l = 0; l <= (k === i ? j : k); l++) {
      const v = eriPair(getPd(i, j), getPd(k, l));
      eri[idx(i, j, k, l)] = eri[idx(j, i, k, l)] = eri[idx(i, j, l, k)] = eri[idx(j, i, l, k)] = eri[idx(k, l, i, j)] = eri[idx(l, k, i, j)] = eri[idx(k, l, j, i)] = eri[idx(l, k, j, i)] = v; } }
    return { n, S, T, V, D, eri, idx };
  };

  /* Integrales entre funciones sueltas (para pruebas): f = {R, lmn, prim:[{a, c}]} */
  H.oneE = (f, g, C, Z) => { let T = 0, V = 0, S = 0; for (const p of f.prim) for (const q of g.prim) { const c = p.c * q.c; S += c * overlapPrim(f.R, f.lmn, p.a, g.R, g.lmn, q.a); T += c * kineticPrim(f.R, f.lmn, p.a, g.R, g.lmn, q.a); V -= c * Z * nuclearPrim(f.R, f.lmn, p.a, g.R, g.lmn, q.a, C); } return { S, T, V }; };
  H.eri4 = (f, g, h, k) => eriPair(pairData(f, g), pairData(h, k));

  H.enuc = (atoms) => { let e = 0; for (let i = 0; i < atoms.length; i++) for (let j = 0; j < i; j++) e += (atoms[i].Z * atoms[j].Z) / Math.hypot(...[0, 1, 2].map((k) => atoms[i].xyz[k] - atoms[j].xyz[k])); return e; };

  const matmul = (A, B) => { const n = A.length, m = B[0].length, k = B.length, C = Array.from({ length: n }, () => new Float64Array(m)); for (let i = 0; i < n; i++) for (let l = 0; l < k; l++) { const a = A[i][l]; for (let j = 0; j < m; j++) C[i][j] += a * B[l][j]; } return C; };
  const transpose = (A) => Array.from(A[0], (_, j) => Float64Array.from(A.map((r) => r[j])));
  /* ---- SCF ---- */
  H.scf = function (atoms, name, opts = {}) {
    const fns = H.build(atoms, name), I = H.integrals(atoms, fns), n = I.n, nel = atoms.reduce((a, b) => a + b.Z, 0) - (opts.charge || 0), nocc = nel / 2, Enuc = H.enuc(atoms);
    const e = FQ.eigSym(I.S.map((r) => Array.from(r))), X = Array.from({ length: n }, (_, i) => new Float64Array(n)); /* S^{-1/2} */
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) X[i][j] += e.vec[k][i] * e.vec[k][j] / Math.sqrt(e.val[k]);
    const Hc = I.T.map((r, i) => r.map((v, j) => v + I.V[i][j])), eri = I.eri, idx = I.idx;
    const fock = (P) => { const F = Hc.map((r) => Float64Array.from(r)); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let g = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) g += P[k][l] * (eri[idx(i, j, k, l)] - 0.5 * eri[idx(i, k, j, l)]); F[i][j] += g; } return F; };
    const diag = (F) => { const Fp = matmul(transpose(X), matmul(F, X)), ee = FQ.eigSym(Fp.map((r) => Array.from(r))), Cp = Array.from({ length: n }, (_, i) => Float64Array.from(ee.vec.map((v) => v[i]))); return { eps: ee.val, C: matmul(X, Cp) }; };
    const dens = (C) => { const P = Array.from({ length: n }, () => new Float64Array(n)); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let a = 0; a < nocc; a++) P[i][j] += 2 * C[i][a] * C[j][a]; return P; };
    let P = Array.from({ length: n }, () => new Float64Array(n)), Eold = 0, E = 0, hist = [], res, F;
    res = diag(Hc); P = dens(res.C);
    const errs = [], Fs = [];
    for (let it = 0; it < 100; it++) {
      F = fock(P); let Eel = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Eel += 0.5 * P[i][j] * (Hc[i][j] + F[i][j]); E = Eel + Enuc;
      const FPS = matmul(F, matmul(P, I.S)), SPF = transpose(FPS), err = FPS.map((r, i) => Float64Array.from(r.map((v, j) => v - SPF[i][j]))), rms = Math.sqrt(err.reduce((a, r) => a + r.reduce((s, v) => s + v * v, 0), 0) / (n * n));
      errs.push(err); Fs.push(F); if (errs.length > 8) { errs.shift(); Fs.shift(); }
      if (Math.abs(E - Eold) < 1e-11 && rms < 1e-8) { hist.push(E); break; } Eold = E; hist.push(E);
      let Fd = F;
      if (errs.length >= 2) { const m = errs.length, B = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0)), rhs = new Array(m + 1).fill(0); rhs[m] = -1; for (let a = 0; a < m; a++) { for (let b = 0; b < m; b++) { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += errs[a][i][j] * errs[b][i][j]; B[a][b] = s; } B[a][m] = B[m][a] = -1; } const c = FQ.solve(B, rhs); if (c) { Fd = Array.from({ length: n }, () => new Float64Array(n)); for (let a = 0; a < m; a++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Fd[i][j] += c[a] * Fs[a][i][j]; } }
      res = diag(Fd); P = dens(res.C);
    }
    F = fock(P); let Eel = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Eel += 0.5 * P[i][j] * (Hc[i][j] + F[i][j]); E = Eel + Enuc;
    const res2 = diag(F);
    /* análisis de población de Mulliken y momento dipolar */
    const PS = matmul(P, I.S), gross = fns.map((_, i) => PS[i][i]), charge = atoms.map((a, ia) => a.Z - fns.reduce((s, f, i) => s + (f.atom === ia ? gross[i] : 0), 0));
    const mu = [0, 1, 2].map((k) => { let s = 0; atoms.forEach((a) => { s += a.Z * a.xyz[k]; }); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s -= P[i][j] * I.D[k][i][j]; return s; });
    return { E, Eel: E - Enuc, Enuc, eps: res2.eps, C: res2.C, P, S: I.S, nocc, n, fns, charge, mu, muD: Math.hypot(...mu) * 2.541746473, iters: hist.length, hist };
  };


  /* ---- UHF (capa abierta o con ruptura de simetría) ---- */
  H.uhf = function (atoms, name, opts = {}) {
    const fns = H.build(atoms, name), I = H.integrals(atoms, fns), n = I.n, nel = atoms.reduce((a, b) => a + b.Z, 0) - (opts.charge || 0), nb = opts.nbeta !== undefined ? opts.nbeta : Math.floor(nel / 2), na = nel - nb, Enuc = H.enuc(atoms), eri = I.eri, idx = I.idx;
    const e = FQ.eigSym(I.S.map((r) => Array.from(r))), X = Array.from({ length: n }, () => new Float64Array(n));
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) X[i][j] += e.vec[k][i] * e.vec[k][j] / Math.sqrt(e.val[k]);
    const Hc = I.T.map((r, i) => Array.from(r, (v, j) => v + I.V[i][j])), zero = () => Array.from({ length: n }, () => new Float64Array(n));
    const diag = (F) => { const Fp = matmul(transpose(X), matmul(F, X)), ee = FQ.eigSym(Fp.map((r) => Array.from(r))), Cp = Array.from({ length: n }, (_, i) => Float64Array.from(ee.vec.map((v) => v[i]))); return { eps: ee.val, C: matmul(X, Cp) }; };
    const dens = (C, no) => { const P = zero(); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let a = 0; a < no; a++) P[i][j] += C[i][a] * C[j][a]; return P; };
    let r0 = diag(Hc), Ca = r0.C, Cb = r0.C.map((r) => Float64Array.from(r)); const mix = opts.mix === undefined ? 0.3 : opts.mix;
    if (na > 0 && na < n && na === nb) { for (let i = 0; i < n; i++) { const h = Ca[i][na - 1], l = Ca[i][na]; Ca[i][na - 1] = Math.cos(mix) * h + Math.sin(mix) * l; Cb[i][na - 1] = Math.cos(mix) * h - Math.sin(mix) * l; } }
    let Pa = dens(Ca, na), Pb = dens(Cb, nb), E = 0, Eold = 1, Fa, Fb, ea, eb, it;
    for (it = 0; it < 300; it++) {
      const Pt = Pa.map((r, i) => r.map((v, j) => v + Pb[i][j]));
      Fa = Hc.map((r) => Float64Array.from(r)); Fb = Hc.map((r) => Float64Array.from(r));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let J = 0, Ka = 0, Kb = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { J += Pt[k][l] * eri[idx(i, j, k, l)]; Ka += Pa[k][l] * eri[idx(i, k, j, l)]; Kb += Pb[k][l] * eri[idx(i, k, j, l)]; } Fa[i][j] += J - Ka; Fb[i][j] += J - Kb; }
      let Eel = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Eel += 0.5 * (Pt[i][j] * Hc[i][j] + Pa[i][j] * Fa[i][j] + Pb[i][j] * Fb[i][j]); E = Eel + Enuc;
      if (Math.abs(E - Eold) < 1e-10 && it > 3) break; Eold = E;
      ea = diag(Fa); eb = diag(Fb); const d = 0.5, Pa2 = dens(ea.C, na), Pb2 = dens(eb.C, nb);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { Pa[i][j] = d * Pa[i][j] + (1 - d) * Pa2[i][j]; Pb[i][j] = d * Pb[i][j] + (1 - d) * Pb2[i][j]; }
    }
    const PS = matmul(Pa.map((r, i) => r.map((v, j) => v + Pb[i][j])), I.S);
    let s2 = 0; { /* ⟨S²⟩ = Sz(Sz+1) + nb − Σ|S_ab|² */ const Sz = (na - nb) / 2; let ov = 0; const Sm = I.S, Ca2 = ea ? ea.C : Ca, Cb2 = eb ? eb.C : Cb; for (let a = 0; a < na; a++) for (let b = 0; b < nb; b++) { let o = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) o += Ca2[i][a] * Sm[i][j] * Cb2[j][b]; ov += o * o; } s2 = Sz * (Sz + 1) + nb - ov; }
    return { E, Enuc, iters: it, na, nb, S2: s2, charge: atoms.map((a, ia) => a.Z - fns.reduce((s, f, i) => s + (f.atom === ia ? PS[i][i] : 0), 0)) };
  };


  /* Optimización de la geometría del agua (r en bohr, ángulo en grados) por símplex de Nelder–Mead sobre la energía SCF */
  H.optWater = function (name, r0 = 1.85, a0 = 104) {
    const f = (x) => H.scf(H.water(x[0], x[1]), name).E; let S = [[r0, a0], [r0 + 0.1, a0], [r0, a0 + 4]].map((x) => ({ x, f: f(x) }));
    for (let it = 0; it < 80; it++) {
      S.sort((a, b) => a.f - b.f); const best = S[0], worst = S[2], c = [(S[0].x[0] + S[1].x[0]) / 2, (S[0].x[1] + S[1].x[1]) / 2];
      if (Math.abs(S[2].f - S[0].f) < 1e-10 && it > 5) break;
      const xr = c.map((v, i) => 2 * v - worst.x[i]), fr = f(xr);
      if (fr < best.f) { const xe = c.map((v, i) => 3 * v - 2 * worst.x[i]), fe = f(xe); S[2] = fe < fr ? { x: xe, f: fe } : { x: xr, f: fr }; }
      else if (fr < S[1].f) S[2] = { x: xr, f: fr };
      else { const xc = c.map((v, i) => 0.5 * (v + worst.x[i])), fc = f(xc); if (fc < worst.f) S[2] = { x: xc, f: fc }; else S = S.map((q, k) => (k === 0 ? q : { x: q.x.map((v, i) => 0.5 * (v + best.x[i])), f: 0 })).map((q, k) => (k === 0 ? q : { x: q.x, f: f(q.x) })); }
    }
    S.sort((a, b) => a.f - b.f); return { r: S[0].x[0], deg: S[0].x[1], E: S[0].f };
  };

  H.BOHR = 0.529177210903;
  /* Geometría de una molécula triatómica A–B₂ (agua) en el plano xy: distancia r (bohr) y ángulo (grados), A en el eje y */
  H.water = (r, deg) => { const th = (deg * PI) / 360; return [{ Z: 8, xyz: [0, 0, 0] }, { Z: 1, xyz: [r * Math.sin(th), r * Math.cos(th), 0] }, { Z: 1, xyz: [-r * Math.sin(th), r * Math.cos(th), 0] }]; };
  H.h2 = (R) => [{ Z: 1, xyz: [0, 0, 0] }, { Z: 1, xyz: [0, 0, R] }];

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
