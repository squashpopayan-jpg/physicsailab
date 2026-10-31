/* ===================================================================
   57-qm-qinfo.js — Matriz densidad, entrelazamiento, ecuación de Lindblad e información cuántica (EM.qm.qi), ħ = 1.
   Matrices complejas como {n, re, im} (re, im: arreglos de filas Float64Array). Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Q = (qm.qi = {});
  const LA = () => EM.P.la, PI = Math.PI;
  const Z = (n) => ({ n, re: LA().zeros(n), im: LA().zeros(n) });
  Q.zeros = Z;
  Q.eye = (n) => { const A = Z(n); for (let i = 0; i < n; i++) A.re[i][i] = 1; return A; };
  Q.from = (re, im) => { const n = re.length, A = Z(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { A.re[i][j] = re[i][j]; A.im[i][j] = im ? im[i][j] : 0; } return A; };
  Q.add = (A, B, s = 1) => { const C = Z(A.n); for (let i = 0; i < A.n; i++) for (let j = 0; j < A.n; j++) { C.re[i][j] = A.re[i][j] + s * B.re[i][j]; C.im[i][j] = A.im[i][j] + s * B.im[i][j]; } return C; };
  Q.scale = (A, a, b = 0) => { const C = Z(A.n); for (let i = 0; i < A.n; i++) for (let j = 0; j < A.n; j++) { C.re[i][j] = a * A.re[i][j] - b * A.im[i][j]; C.im[i][j] = a * A.im[i][j] + b * A.re[i][j]; } return C; };
  Q.mul = (A, B) => { const n = A.n, C = Z(n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const ar = A.re[i][k], ai = A.im[i][k]; if (ar === 0 && ai === 0) continue; for (let j = 0; j < n; j++) { C.re[i][j] += ar * B.re[k][j] - ai * B.im[k][j]; C.im[i][j] += ar * B.im[k][j] + ai * B.re[k][j]; } } return C; };
  Q.dag = (A) => { const C = Z(A.n); for (let i = 0; i < A.n; i++) for (let j = 0; j < A.n; j++) { C.re[i][j] = A.re[j][i]; C.im[i][j] = -A.im[j][i]; } return C; };
  Q.trace = (A) => { let r = 0, i = 0; for (let k = 0; k < A.n; k++) { r += A.re[k][k]; i += A.im[k][k]; } return [r, i]; };
  Q.kron = (A, B) => { const n = A.n * B.n, C = Z(n); for (let i = 0; i < A.n; i++) for (let j = 0; j < A.n; j++) for (let k = 0; k < B.n; k++) for (let l = 0; l < B.n; l++) { const ar = A.re[i][j], ai = A.im[i][j], br = B.re[k][l], bi = B.im[k][l]; C.re[i * B.n + k][j * B.n + l] = ar * br - ai * bi; C.im[i * B.n + k][j * B.n + l] = ar * bi + ai * br; } return C; };
  Q.comm = (A, B) => Q.add(Q.mul(A, B), Q.mul(B, A), -1);
  /* Matrices de Pauli */
  Q.I2 = Q.eye(2); Q.X = Q.from([[0, 1], [1, 0]]); Q.Y = Q.from([[0, 0], [0, 0]], [[0, -1], [1, 0]]); Q.Zp = Q.from([[1, 0], [0, -1]]);
  /* |ψ⟩⟨ψ| de un vector {re, im} */
  Q.proj = (v) => { const n = v.re.length, A = Z(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { A.re[i][j] = v.re[i] * v.re[j] + v.im[i] * v.im[j]; A.im[i][j] = v.im[i] * v.re[j] - v.re[i] * v.im[j]; } return A; };
  /* Autovalores y autovectores de una matriz hermítica: embebido real + Gram–Schmidt complejo (válido con degeneraciones). vecs[k] = {re, im} */
  Q.eigh = function (A) {
    const n = A.n, M = LA().zeros(2 * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { M[i][j] = A.re[i][j]; M[i + n][j + n] = A.re[i][j]; M[i][j + n] = -A.im[i][j]; M[i + n][j] = A.im[i][j]; }
    const r = LA().eigh(M), vals = [], vecs = [];
    for (let c = 0; c < 2 * n && vecs.length < n; c++) {
      let vr = new Float64Array(n), vi = new Float64Array(n); for (let i = 0; i < n; i++) { vr[i] = r.vectors[i][c]; vi[i] = r.vectors[i + n][c]; }
      for (const u of vecs) { let pr = 0, pi = 0; for (let i = 0; i < n; i++) { pr += u.re[i] * vr[i] + u.im[i] * vi[i]; pi += u.re[i] * vi[i] - u.im[i] * vr[i]; } for (let i = 0; i < n; i++) { vr[i] -= pr * u.re[i] - pi * u.im[i]; vi[i] -= pr * u.im[i] + pi * u.re[i]; } }
      let nn = 0; for (let i = 0; i < n; i++) nn += vr[i] * vr[i] + vi[i] * vi[i]; if (nn < 1e-6) continue; nn = Math.sqrt(nn); for (let i = 0; i < n; i++) { vr[i] /= nn; vi[i] /= nn; } vecs.push({ re: vr, im: vi }); vals.push(r.values[c]);
    }
    return { values: vals, vecs };
  };
  /* f(A) para A hermítica: Σ f(λ_k)|k⟩⟨k| */
  Q.fun = (A, f) => { const e = Q.eigh(A), R = Z(A.n); e.values.forEach((l, k) => { const P = Q.proj(e.vecs[k]), fl = f(l); for (let i = 0; i < A.n; i++) for (let j = 0; j < A.n; j++) { R.re[i][j] += fl * P.re[i][j]; R.im[i][j] += fl * P.im[i][j]; } }); return R; };
  Q.sqrtm = (A) => Q.fun(A, (l) => Math.sqrt(Math.max(l, 0)));
  /* Pureza, entropía de von Neumann (bits) */
  Q.purity = (r) => Q.trace(Q.mul(r, r))[0];
  Q.entropy = (r) => Q.eigh(r).values.reduce((s, l) => (l > 1e-14 ? s - l * Math.log2(l) : s), 0);
  /* Traza parcial de un sistema bipartito (dA × dB): which = 'B' traza B (queda A), which = 'A' traza A (queda B) */
  Q.ptrace = function (r, dA, dB, which) {
    const d = which === 'B' ? dA : dB, R = Z(d);
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) for (let k = 0; k < (which === 'B' ? dB : dA); k++) { const a = which === 'B' ? i * dB + k : k * dB + i, b = which === 'B' ? j * dB + k : k * dB + j; R.re[i][j] += r.re[a][b]; R.im[i][j] += r.im[a][b]; }
    return R;
  };
  /* Vector de Bloch de un qubit */
  Q.bloch = (r) => [2 * r.re[0][1], -2 * r.im[0][1], r.re[0][0] - r.re[1][1]];
  /* Concurrencia de Wootters de dos qubits: C = max(0, λ₁ − λ₂ − λ₃ − λ₄), λ² = autovalores de ρ ρ̃, ρ̃ = (σy⊗σy) ρ* (σy⊗σy) */
  Q.concurrence = function (r) {
    const YY = Q.kron(Q.Y, Q.Y), rc = Z(4); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { rc.re[i][j] = r.re[i][j]; rc.im[i][j] = -r.im[i][j]; }
    const rt = Q.mul(Q.mul(YY, rc), YY), sr = Q.sqrtm(r), Rm = Q.mul(Q.mul(sr, rt), sr), lam = Q.eigh(Rm).values.map((l) => Math.sqrt(Math.max(l, 0))).sort((a, b) => b - a);
    return Math.max(0, lam[0] - lam[1] - lam[2] - lam[3]);
  };
  /* Estados de Bell y de Werner */
  const bell = (a, b, c, d) => ({ re: Float64Array.of(a, b, c, d), im: new Float64Array(4) });
  Q.psiMinus = bell(0, Math.SQRT1_2, -Math.SQRT1_2, 0); Q.psiPlus = bell(0, Math.SQRT1_2, Math.SQRT1_2, 0); Q.phiPlus = bell(Math.SQRT1_2, 0, 0, Math.SQRT1_2); Q.phiMinus = bell(Math.SQRT1_2, 0, 0, -Math.SQRT1_2);
  Q.werner = (p) => Q.add(Q.scale(Q.proj(Q.psiMinus), p), Q.scale(Q.eye(4), (1 - p) / 4));
  /* Valor esperado de A⊗B para ρ de 2 qubits con A = cos a σz + sin a σx (ejes en el plano xz) */
  const axis = (a) => Q.add(Q.scale(Q.Zp, Math.cos(a)), Q.scale(Q.X, Math.sin(a)));
  Q.corr = (r, a, b) => Q.trace(Q.mul(r, Q.kron(axis(a), axis(b))))[0];
  Q.chsh = (r, a, a2, b, b2) => Math.abs(Q.corr(r, a, b) - Q.corr(r, a, b2) + Q.corr(r, a2, b) + Q.corr(r, a2, b2));
  /* Máximo de CHSH (Horodecki): 2√(u₁ + u₂), u_i = dos mayores autovalores de TᵀT con T_ij = Tr(ρ σ_i⊗σ_j) */
  Q.chshMax = function (r) {
    const P = [Q.X, Q.Y, Q.Zp], T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T[i][j] = Q.trace(Q.mul(r, Q.kron(P[i], P[j])))[0];
    const A = LA().zeros(3); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += T[k][i] * T[k][j]; A[i][j] = s; }
    const u = Array.from(LA().eigh(A, { vectors: false }).values).sort((a, b) => b - a); return 2 * Math.sqrt(Math.max(0, u[0] + u[1]));
  };
  /* Información mutua S(A) + S(B) − S(AB) y entropía de entrelazamiento S(ρ_A) (pura) */
  Q.mutual = (r) => Q.entropy(Q.ptrace(r, 2, 2, 'B')) + Q.entropy(Q.ptrace(r, 2, 2, 'A')) - Q.entropy(r);
  /* Lindblad: dρ/dt = −i[H, ρ] + Σ_k γ_k (L ρ L† − ½{L†L, ρ}); integración RK4 con paso dt; Ls = [{L, g}] */
  Q.lindbladStep = function (rho, H, Ls, dt) {
    const f = (r) => { let d = Q.scale(Q.comm(H, r), 0, -1); for (const { L, g } of Ls) { const Ld = Q.dag(L), LdL = Q.mul(Ld, L); d = Q.add(d, Q.scale(Q.mul(Q.mul(L, r), Ld), g)); d = Q.add(d, Q.scale(Q.add(Q.mul(LdL, r), Q.mul(r, LdL)), -0.5 * g)); } return d; };
    const k1 = f(rho), k2 = f(Q.add(rho, k1, dt / 2)), k3 = f(Q.add(rho, k2, dt / 2)), k4 = f(Q.add(rho, k3, dt));
    return Q.add(rho, Q.add(Q.add(Q.add(k1, k2, 2), k3, 2), k4, 1), dt / 6);
  };
  Q.lindblad = function (rho0, H, Ls, T, steps, every = 1) { let r = rho0; const out = [{ t: 0, rho: r }], dt = T / steps; for (let s = 1; s <= steps; s++) { r = Q.lindbladStep(r, H, Ls, dt); if (s % every === 0) out.push({ t: s * dt, rho: r }); } return out; };
  /* Canal cuántico por operadores de Kraus: ρ → Σ K ρ K† */
  Q.kraus = (rho, Ks) => Ks.reduce((acc, K) => Q.add(acc, Q.mul(Q.mul(K, rho), Q.dag(K))), Q.zeros(rho.n));
  Q.ampDamp = (p) => [Q.from([[1, 0], [0, Math.sqrt(1 - p)]]), Q.from([[0, Math.sqrt(p)], [0, 0]])];
  Q.phaseDamp = (p) => [Q.from([[Math.sqrt(1 - p), 0], [0, Math.sqrt(1 - p)]]), Q.from([[Math.sqrt(p), 0], [0, -Math.sqrt(p)]])];
  Q.depolar = (p) => [Q.scale(Q.eye(2), Math.sqrt(1 - 3 * p / 4)), Q.scale(Q.X, Math.sqrt(p / 4)), Q.scale(Q.Y, Math.sqrt(p / 4)), Q.scale(Q.Zp, Math.sqrt(p / 4))];
  /* Matriz de Choi J = Σ_ij |i⟩⟨j| ⊗ Φ(|i⟩⟨j|) (positiva ⟺ completamente positivo) para un canal de un qubit dado por Kraus */
  Q.choi = (Ks) => { const J = Q.zeros(4); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const E = Q.zeros(2); E.re[i][j] = 1; const F = Q.kraus(E, Ks); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { J.re[i * 2 + a][j * 2 + b] = F.re[a][b]; J.im[i * 2 + a][j * 2 + b] = F.im[a][b]; } } return J; };
  /* Operadores de un qubit y estados útiles */
  Q.sm = Q.from([[0, 1], [0, 0]]); Q.sp = Q.dag(Q.sm);
  Q.vec = (re, im) => ({ re: Float64Array.from(re), im: Float64Array.from(im || re.map(() => 0)) });
  /* Transpuesta parcial respecto de B (sistema bipartito dA × dB) y negatividad N = Σ|autovalores negativos| */
  Q.ptranspose = function (r, dA, dB) { const R = Z(r.n); for (let i = 0; i < dA; i++) for (let k = 0; k < dB; k++) for (let j = 0; j < dA; j++) for (let l = 0; l < dB; l++) { R.re[i * dB + k][j * dB + l] = r.re[i * dB + l][j * dB + k]; R.im[i * dB + k][j * dB + l] = r.im[i * dB + l][j * dB + k]; } return R; };
  Q.negativity = (r, dA, dB) => Q.eigh(Q.ptranspose(r, dA, dB)).values.reduce((s, l) => (l < 0 ? s - l : s), 0);
  /* GHZ = (|000⟩ + |111⟩)/√2, W = (|001⟩ + |010⟩ + |100⟩)/√3 */
  Q.ghz = Q.vec([Math.SQRT1_2, 0, 0, 0, 0, 0, 0, Math.SQRT1_2]); const s3 = 1 / Math.sqrt(3); Q.w3 = Q.vec([0, s3, s3, 0, s3, 0, 0, 0]);
  /* Operador de Mermin: M = ⟨XXX⟩ − ⟨XYY⟩ − ⟨YXY⟩ − ⟨YYX⟩ (cota local: 2, GHZ: 4) */
  Q.mermin = function (r) { const k3 = (a, b, c) => Q.trace(Q.mul(r, Q.kron(Q.kron(a, b), c)))[0]; return k3(Q.X, Q.X, Q.X) - k3(Q.X, Q.Y, Q.Y) - k3(Q.Y, Q.X, Q.Y) - k3(Q.Y, Q.Y, Q.X); };
  if (typeof module !== 'undefined' && module.exports) module.exports = Q;
})(typeof window !== 'undefined' ? window : globalThis);
