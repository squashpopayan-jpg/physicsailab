/* ===================================================================
   52-qm-tdep.js — Problemas dependientes del tiempo (EM.qm.tdep), ħ = 1.
   Evolución exacta por Runge–Kutta, teoría de perturbaciones de primer orden con pulsos, decaimiento en una banda discreta
   (regla de oro de Fermi), Landau–Zener y fase de Berry del espín ½. Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Td = (qm.tdep = {});
  /* Integra i dψ/dt = H(t) ψ con RK4 (pasos fijos). Hfun(t) → {re: n×n, im: n×n}; ψ = {re: [], im: []} */
  Td.evolve = function (Hfun, psi0, t0, t1, steps) {
    const n = psi0.re.length, h = (t1 - t0) / steps; let pr = Float64Array.from(psi0.re), pi = Float64Array.from(psi0.im);
    const deriv = (t, ar, ai) => { const H = Hfun(t), dr = new Float64Array(n), di = new Float64Array(n); for (let i = 0; i < n; i++) { let sr = 0, si = 0; for (let j = 0; j < n; j++) { sr += H.re[i][j] * ar[j] - H.im[i][j] * ai[j]; si += H.re[i][j] * ai[j] + H.im[i][j] * ar[j]; } dr[i] = si; di[i] = -sr; } return [dr, di]; };
    for (let s = 0; s < steps; s++) {
      const t = t0 + s * h, [k1r, k1i] = deriv(t, pr, pi);
      const [k2r, k2i] = deriv(t + h / 2, pr.map((v, i) => v + (h / 2) * k1r[i]), pi.map((v, i) => v + (h / 2) * k1i[i]));
      const [k3r, k3i] = deriv(t + h / 2, pr.map((v, i) => v + (h / 2) * k2r[i]), pi.map((v, i) => v + (h / 2) * k2i[i]));
      const [k4r, k4i] = deriv(t + h, pr.map((v, i) => v + h * k3r[i]), pi.map((v, i) => v + h * k3i[i]));
      for (let i = 0; i < n; i++) { pr[i] += (h / 6) * (k1r[i] + 2 * k2r[i] + 2 * k3r[i] + k4r[i]); pi[i] += (h / 6) * (k1i[i] + 2 * k2i[i] + 2 * k3i[i] + k4i[i]); }
    }
    return { re: pr, im: pi };
  };
  const mat2 = (a, b, c, d) => [Float64Array.of(a, b), Float64Array.of(c, d)];
  /* Dos niveles con acoplamiento coseno: H = [[0, g(t) cos... ]] se construye fuera; aquí, Rabi exacto en resonancia con detuning Δ (H = [[Δ/2, Ω/2], [Ω/2, −Δ/2]]) desde el nivel de abajo */
  Td.rabiP = (Om, D, t) => { const W = Math.hypot(Om, D); return (Om * Om) / (W * W) * Math.sin((W * t) / 2) ** 2; };
  /* Primer orden para una perturbación V(t) = V g(t) cos(ωt)… en onda rotante: amplitud c_f(t) = −i (V/2) ∫ g(t′) e^{iΔt′} dt′ con Δ = ω_fi − ω; devuelve la probabilidad |c_f|² con g dada como función en [0, T] (Simpson) */
  Td.firstOrderPulse = function (g, T, Delta, V, N = 4000) {
    const h = T / N; let re = 0, im = 0;
    for (let i = 0; i <= N; i++) { const t = i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2, gv = g(t); re += w * gv * Math.cos(Delta * t); im += w * gv * Math.sin(Delta * t); }
    re *= h / 3; im *= h / 3; return ((V / 2) ** 2) * (re * re + im * im);
  };
  /* Pulso cuadrado: P = (V/2)² [sen(ΔT/2)/(Δ/2)]² */
  Td.squareP = (V, Delta, T) => ((V / 2) ** 2) * (Math.abs(Delta) < 1e-12 ? T * T : (Math.sin((Delta * T) / 2) / (Delta / 2)) ** 2);
  /* Estado discreto |0⟩ (energía 0) acoplado con V a N estados equiespaciados (paso eps, centrados en 0). Devuelve las funciones |c₀(t)|² y las energías de los estados propios */
  Td.bandDecay = function (N, eps, V) {
    const LA = EM.P.la, n = N + 1, H = LA.zeros(n);
    for (let j = 1; j <= N; j++) { H[j][j] = eps * (j - (N + 1) / 2); H[0][j] = H[j][0] = V; }
    const r = LA.eigh(H), E = Array.from(r.values), w = E.map((_, k) => r.vectors[0][k] ** 2);
    return { E, w, P0: (t) => { let a = 0, b = 0; for (let k = 0; k < n; k++) { a += w[k] * Math.cos(E[k] * t); b -= w[k] * Math.sin(E[k] * t); } return a * a + b * b; } };
  };
  Td.golden = (V, eps) => (2 * Math.PI * V * V) / eps;
  /* Landau–Zener: H = [[vt/2, g], [g, −vt/2]]; probabilidad de permanecer en el estado diabático: exp(−2π g²/v) */
  Td.lzP = (g, v) => Math.exp((-2 * Math.PI * g * g) / v);
  Td.lzNumeric = function (g, v, T, steps) {
    const H = (t) => ({ re: [Float64Array.of((v * t) / 2, g), Float64Array.of(g, (-v * t) / 2)], im: [new Float64Array(2), new Float64Array(2)] });
    const r = Td.evolve(H, { re: Float64Array.of(1, 0), im: new Float64Array(2) }, -T, T, steps); return r.re[0] ** 2 + r.im[0] ** 2;
  };
  /* Espín ½ en el campo B(t) = (sinθ cos ωt, sinθ sin ωt, cosθ) con precesión ω_L = 1: probabilidad de permanecer alineado con B(t): 1 − sin²χ sin²(W t/2), W = |w_eff|, w_eff = (sinθ, 0, cosθ − ω)·(ω_L = 1) */
  Td.berryStay = function (theta, om, t) {
    const wx = Math.sin(theta), wz = Math.cos(theta) - om, W = Math.hypot(wx, wz), cosChi = (Math.sin(theta) * wx + Math.cos(theta) * wz) / W, sin2 = 1 - cosChi * cosChi;
    return 1 - sin2 * Math.sin((W * t) / 2) ** 2;
  };
  /* Fase de Berry de un espín ½ con proyección m = ±½ a lo largo de B tras un ciclo: γ = −m·Ω con Ω = 2π(1 − cosθ) */
  Td.berryPhase = (theta, m = 0.5) => -m * 2 * Math.PI * (1 - Math.cos(theta));
  if (typeof module !== 'undefined' && module.exports) module.exports = Td;
})(typeof window !== 'undefined' ? window : globalThis);
