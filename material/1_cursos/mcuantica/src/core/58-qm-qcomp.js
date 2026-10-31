/* ===================================================================
   58-qm-qcomp.js — Computación cuántica (EM.qm.qc): simulador de vector de estado, Grover, QFT, Shor,
   teletransporte (matriz densidad), código de repetición de 3 qubits y BB84.
   Convención: el qubit 0 es el bit más significativo del índice (|q0 q1 … q_{n-1}⟩). Requiere 57-qm-qinfo.js para el teletransporte.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const C = (qm.qc = {});
  const S2 = Math.SQRT1_2, PI = Math.PI;
  const G = (a, b, c, d, e, f, g, h) => ({ re: [[a, c], [e, g]], im: [[b, d], [f, h]] });
  C.gate = {
    H: G(S2, 0, S2, 0, S2, 0, -S2, 0), X: G(0, 0, 1, 0, 1, 0, 0, 0), Y: G(0, 0, 0, -1, 0, 1, 0, 0), Z: G(1, 0, 0, 0, 0, 0, -1, 0),
    S: G(1, 0, 0, 0, 0, 0, 0, 1), T: G(1, 0, 0, 0, 0, 0, S2, S2),
    RY: (t) => G(Math.cos(t / 2), 0, -Math.sin(t / 2), 0, Math.sin(t / 2), 0, Math.cos(t / 2), 0),
    RZ: (f) => G(Math.cos(f / 2), -Math.sin(f / 2), 0, 0, 0, 0, Math.cos(f / 2), Math.sin(f / 2)),
    P: (f) => G(1, 0, 0, 0, 0, 0, Math.cos(f), Math.sin(f))
  };
  C.zero = (n) => { const N = 1 << n, re = new Float64Array(N), im = new Float64Array(N); re[0] = 1; return { n, N, re, im }; };
  C.basis = (n, k) => { const s = C.zero(n); s.re[0] = 0; s.re[k] = 1; return s; };
  C.clone = (s) => ({ n: s.n, N: s.N, re: Float64Array.from(s.re), im: Float64Array.from(s.im) });
  C.fromAmps = (re, im) => { const N = re.length, n = Math.round(Math.log2(N)); return { n, N, re: Float64Array.from(re), im: Float64Array.from(im || re.map(() => 0)) }; };
  const bitOf = (s, q) => s.n - 1 - q;
  C.apply1 = (s, q, g) => {
    const m = 1 << bitOf(s, q), a = g.re, b = g.im;
    for (let i = 0; i < s.N; i++) {
      if (i & m) continue;
      const j = i | m, xr = s.re[i], xi = s.im[i], yr = s.re[j], yi = s.im[j];
      s.re[i] = a[0][0] * xr - b[0][0] * xi + a[0][1] * yr - b[0][1] * yi; s.im[i] = a[0][0] * xi + b[0][0] * xr + a[0][1] * yi + b[0][1] * yr;
      s.re[j] = a[1][0] * xr - b[1][0] * xi + a[1][1] * yr - b[1][1] * yi; s.im[j] = a[1][0] * xi + b[1][0] * xr + a[1][1] * yi + b[1][1] * yr;
    }
    return s;
  };
  C.cnot = (s, c, t) => {
    const mc = 1 << bitOf(s, c), mt = 1 << bitOf(s, t);
    for (let i = 0; i < s.N; i++) if ((i & mc) && !(i & mt)) { const j = i | mt; let x = s.re[i]; s.re[i] = s.re[j]; s.re[j] = x; x = s.im[i]; s.im[i] = s.im[j]; s.im[j] = x; }
    return s;
  };
  C.cphase = (s, c, t, f) => {
    const m = (1 << bitOf(s, c)) | (1 << bitOf(s, t)), cr = Math.cos(f), ci = Math.sin(f);
    for (let i = 0; i < s.N; i++) if ((i & m) === m) { const x = s.re[i], y = s.im[i]; s.re[i] = x * cr - y * ci; s.im[i] = x * ci + y * cr; }
    return s;
  };
  C.swap = (s, a, b) => {
    const ma = 1 << bitOf(s, a), mb = 1 << bitOf(s, b);
    for (let i = 0; i < s.N; i++) if ((i & ma) && !(i & mb)) { const j = (i ^ ma) | mb; let x = s.re[i]; s.re[i] = s.re[j]; s.re[j] = x; x = s.im[i]; s.im[i] = s.im[j]; s.im[j] = x; }
    return s;
  };
  C.hAll = (s) => { for (let q = 0; q < s.n; q++) C.apply1(s, q, C.gate.H); return s; };
  /* circuito = lista de operaciones ['H', q] | ['CNOT', c, t] | ['CP', c, t, φ] | ['RY', q, θ] | ['RZ', q, φ] | ['SWAP', a, b] | ['S'|'T'|'X'|'Y'|'Z', q] */
  C.run = (s, ops) => {
    for (const o of ops) {
      switch (o[0]) {
        case 'CNOT': C.cnot(s, o[1], o[2]); break;
        case 'CP': C.cphase(s, o[1], o[2], o[3]); break;
        case 'SWAP': C.swap(s, o[1], o[2]); break;
        case 'RY': C.apply1(s, o[1], C.gate.RY(o[2])); break;
        case 'RZ': C.apply1(s, o[1], C.gate.RZ(o[2])); break;
        default: C.apply1(s, o[1], C.gate[o[0]]);
      }
    }
    return s;
  };
  C.prob = (s) => Array.from(s.re, (x, i) => x * x + s.im[i] * s.im[i]);
  C.probQubit = (s, q) => { const m = 1 << bitOf(s, q); let p = 0; for (let i = 0; i < s.N; i++) if (i & m) p += s.re[i] * s.re[i] + s.im[i] * s.im[i]; return p; };
  /* proyección del qubit q sobre el resultado m (0/1): devuelve {p, s} con s normalizado */
  C.project = (s, q, m) => {
    const t = C.clone(s), mk = 1 << bitOf(s, q); let p = 0;
    for (let i = 0; i < s.N; i++) { if (!!(i & mk) !== !!m) { t.re[i] = 0; t.im[i] = 0; } else p += s.re[i] * s.re[i] + s.im[i] * s.im[i]; }
    const k = p > 0 ? 1 / Math.sqrt(p) : 0; for (let i = 0; i < s.N; i++) { t.re[i] *= k; t.im[i] *= k; }
    return { p, s: t };
  };
  C.fidelity = (a, b) => { let r = 0, i = 0; for (let k = 0; k < a.N; k++) { r += a.re[k] * b.re[k] + a.im[k] * b.im[k]; i += a.re[k] * b.im[k] - a.im[k] * b.re[k]; } return r * r + i * i; };

  /* ---- Grover ---- */
  C.groverTheta = (n) => Math.asin(Math.pow(2, -n / 2));
  C.groverP = (n, k) => Math.pow(Math.sin((2 * k + 1) * C.groverTheta(n)), 2);
  C.groverK = (n) => Math.floor(PI / (4 * C.groverTheta(n)));
  /* iteración de Grover: oráculo (signo de la marcada) y difusión H^{⊗n}(2|0⟩⟨0| − 1)H^{⊗n} = inversión respecto a la media */
  C.groverStep = (s, marked) => {
    s.re[marked] = -s.re[marked]; s.im[marked] = -s.im[marked];
    let mr = 0, mi = 0; for (let i = 0; i < s.N; i++) { mr += s.re[i]; mi += s.im[i]; } mr /= s.N; mi /= s.N;
    for (let i = 0; i < s.N; i++) { s.re[i] = 2 * mr - s.re[i]; s.im[i] = 2 * mi - s.im[i]; }
    return s;
  };
  C.grover = (n, marked, k) => { const s = C.hAll(C.zero(n)); for (let i = 0; i < k; i++) C.groverStep(s, marked); return s; };

  /* ---- Transformada de Fourier cuántica (circuito de H y fases controladas, más las permutaciones finales) ---- */
  C.qft = (s) => {
    const n = s.n;
    for (let j = 0; j < n; j++) { C.apply1(s, j, C.gate.H); for (let k = j + 1; k < n; k++) C.cphase(s, k, j, PI / Math.pow(2, k - j)); }
    for (let i = 0; i < Math.floor(n / 2); i++) C.swap(s, i, n - 1 - i);
    return s;
  };

  /* ---- Shor: búsqueda del periodo ---- */
  C.gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  C.modpow = (a, e, N) => { let r = 1; a %= N; while (e > 0) { if (e & 1) r = (r * a) % N; a = (a * a) % N; e >>= 1; } return r; };
  C.order = (a, N) => { if (C.gcd(a, N) !== 1) return 0; let x = a % N, r = 1; while (x !== 1) { x = (x * a) % N; r++; } return r; };
  /* P(y) tras medir el registro de salida: (1/Q²)·Σ_{x0<r} |Σ_{j<K} e^{2πi y r j/Q}|², K = nº de x ≡ x0 (mod r) en [0, Q) */
  C.periodDist = (N, a, m) => {
    const r = C.order(a, N), Qn = 1 << m, P = new Float64Array(Qn);
    for (let y = 0; y < Qn; y++) {
      let acc = 0; const th = PI * ((y * r) % Qn) / Qn, sn = Math.sin(th);
      for (let x0 = 0; x0 < r; x0++) { const K = Math.ceil((Qn - x0) / r); acc += Math.abs(sn) < 1e-12 ? K * K : Math.pow(Math.sin(K * th) / sn, 2); }
      P[y] = acc / (Qn * Qn);
    }
    return P;
  };
  /* convergentes de la fracción continua de num/den */
  C.convergents = (num, den, maxDen = Infinity) => {
    const out = []; let h1 = 1, h0 = 0, k1 = 0, k0 = 1, a = num, b = den;
    while (b !== 0) { const q = Math.floor(a / b); [a, b] = [b, a - q * b]; const h = q * h1 + h0, k = q * k1 + k0; h0 = h1; h1 = h; k0 = k1; k1 = k; if (k1 > maxDen) break; out.push([h1, k1]); }
    return out;
  };
  /* de una medida y recupera el periodo y los factores: {r, f1, f2, ok} */
  C.shorFromY = (N, a, y, m) => {
    const Qn = 1 << m;
    if (y === 0) return { r: 0, ok: false, why: 'y = 0' };
    let r = 0;
    for (const [, den] of C.convergents(y, Qn, N)) if (den > 0 && C.modpow(a, den, N) === 1) { r = den; break; }
    if (!r) return { r: 0, ok: false, why: 'sin periodo' };
    if (r % 2) return { r, ok: false, why: 'r impar' };
    const x = C.modpow(a, r / 2, N); if (x === N - 1) return { r, ok: false, why: 'a^(r/2) ≡ −1' };
    const f1 = C.gcd(x - 1, N), f2 = C.gcd(x + 1, N);
    return { r, f1, f2, ok: f1 > 1 && f1 < N };
  };
  C.shorSuccess = (N, a, m) => { const P = C.periodDist(N, a, m); let s = 0; for (let y = 0; y < P.length; y++) if (C.shorFromY(N, a, y, m).ok) s += P[y]; return s; };

  /* ---- Teletransporte con matriz densidad (recurso: p|Φ⁺⟩⟨Φ⁺| + (1 − p) 1/4) ---- */
  C.teleport = (theta, phi, p) => {
    const Q = qm.qi, c = Math.cos(theta / 2), s = Math.sin(theta / 2), psi = Q.vec([c, s * Math.cos(phi)], [0, s * Math.sin(phi)]);
    const pin = Q.proj(psi), res = Q.add(Q.scale(Q.proj(Q.phiPlus), p), Q.scale(Q.eye(4), (1 - p) / 4)), rho = Q.kron(pin, res);
    const I2 = Q.eye(2), Hm = Q.from([[S2, S2], [S2, -S2]]), cn = Q.from([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]);
    const U = Q.mul(Q.kron(Hm, Q.kron(I2, I2)), Q.kron(cn, I2)), r1 = Q.mul(Q.mul(U, rho), Q.dag(U)), out = []; let Fa = 0, Fp = 0;
    for (let m1 = 0; m1 < 2; m1++) for (let m2 = 0; m2 < 2; m2++) {
      const k = 2 * m1 + m2, P = Q.zeros(4); P.re[k][k] = 1;
      const R = Q.mul(Q.mul(Q.kron(P, I2), r1), Q.kron(P, I2)), pr = Q.trace(R)[0];
      const rb = Q.scale(Q.ptrace(R, 4, 2, 'A'), 1 / pr);
      let corr = rb; if (m2) corr = Q.mul(Q.mul(Q.X, corr), Q.X); if (m1) corr = Q.mul(Q.mul(Q.Zp, corr), Q.Zp);
      const F0 = Q.trace(Q.mul(pin, rb))[0], F1 = Q.trace(Q.mul(pin, corr))[0];
      out.push({ m1, m2, prob: pr, pre: Q.bloch(rb), post: Q.bloch(corr), Fpre: F0, F: F1 }); Fa += pr * F1; Fp += pr * F0;
    }
    return { input: Q.bloch(pin), outcomes: out, F: Fa, Fpre: Fp };
  };

  /* ---- Código de repetición de 3 qubits contra errores X independientes ---- */
  /* devuelve {pL: prob. de error lógico, F: fidelidad media con el estado codificado α|000⟩+β|111⟩, Fsin: sin código} */
  C.bitflip = (p, alpha) => {
    const a = alpha, b = Math.sqrt(1 - alpha * alpha), enc = C.fromAmps([a, 0, 0, 0, 0, 0, 0, b]); let pL = 0, F = 0;
    for (let e = 0; e < 8; e++) {
      const w = ((e >> 2) & 1) + ((e >> 1) & 1) + (e & 1), pe = Math.pow(p, w) * Math.pow(1 - p, 3 - w), s = C.clone(enc);
      for (let q = 0; q < 3; q++) if ((e >> (2 - q)) & 1) C.apply1(s, q, C.gate.X);
      /* síndrome (Z₀Z₁, Z₁Z₂) leído sin colapsar: es constante en la rama */
      let idx = 0; for (let i = 0; i < 8; i++) if (s.re[i] * s.re[i] + s.im[i] * s.im[i] > 1e-12) { idx = i; break; }
      const z = [(idx >> 2) & 1, (idx >> 1) & 1, idx & 1], s01 = z[0] ^ z[1], s12 = z[1] ^ z[2];
      const fix = s01 && !s12 ? 0 : s01 && s12 ? 1 : !s01 && s12 ? 2 : -1; if (fix >= 0) C.apply1(s, fix, C.gate.X);
      F += pe * C.fidelity(s, enc); if (w >= 2) pL += pe;
    }
    return { pL, F, Fsin: (1 - p) + p * Math.pow(2 * a * b, 2) };
  };

  /* ---- BB84 con intercepta-y-reenvía de probabilidad q: tasa de error en la clave filtrada ---- */
  C.bb84error = (q) => {
    const st = { Z: [[1, 0], [0, 1]], X: [[S2, S2], [S2, -S2]] }, ov = (u, v) => Math.pow(u[0] * v[0] + u[1] * v[1], 2);
    let err = 0;
    for (const bA of ['Z', 'X']) for (let bit = 0; bit < 2; bit++) {
      const psi = st[bA][bit];
      for (const bE of ['Z', 'X']) for (let o = 0; o < 2; o++) err += 0.25 * 0.5 * q * ov(psi, st[bE][o]) * (1 - ov(st[bE][o], psi));
    }
    return err;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
