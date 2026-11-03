/* ===================================================================
   57-fm-tunnel.js — Barreras, pozos finitos y efecto túnel (EM.fm.tun). Sin DOM; SI salvo aviso.
   Unidades auxiliares: energías en eV, longitudes en nm cuando se indica («nm-eV»), con ħ²/2m_e = 0.0380998 eV·nm².
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const U = (fm.tun = {});
  const { hbar, e, me } = K;
  /* ħ²/2m en eV·nm² para una masa m (kg) */
  U.hb2m = (m = me) => (hbar * hbar) / (2 * m) / e * 1e18;
  /* Transmisión de una barrera rectangular de altura V0 (eV) y anchura a (nm) para una partícula de energía E (eV) y masa m: exacta */
  U.T = (E, V0, a, m = me) => {
    const c = U.hb2m(m);
    if (Math.abs(E - V0) < 1e-12 * V0) return 1 / (1 + (V0 * a * a) / (4 * c));
    if (E < V0) { const kap = Math.sqrt((V0 - E) / c); return 1 / (1 + (V0 * V0 * Math.sinh(kap * a) ** 2) / (4 * E * (V0 - E))); }
    const k2 = Math.sqrt((E - V0) / c); return 1 / (1 + (V0 * V0 * Math.sin(k2 * a) ** 2) / (4 * E * (E - V0)));
  };
  /* Aproximación de barrera gruesa: T ≈ 16E(V0−E)/V0² · e^{−2κa} y la forma WKB e^{−2κa} */
  U.Tthick = (E, V0, a, m = me) => { const kap = Math.sqrt((V0 - E) / U.hb2m(m)); return ((16 * E * (V0 - E)) / (V0 * V0)) * Math.exp(-2 * kap * a); };
  U.kappa = (E, V0, m = me) => Math.sqrt((V0 - E) / U.hb2m(m));                 /* nm⁻¹ */
  /* Función de onda estacionaria de dispersión (barrera en 0 ≤ x ≤ a) con onda incidente e^{ikx} de amplitud 1: devuelve k, q, t, r, T, R y ψ(x) = [re, im] (x en nm).
     Se resuelve hacia atrás: a la derecha ψ = e^{ik(x−a)} (amplitud 1 en x = a), dentro ψ = cosh(q(x−a)) + (ik/q)senh(q(x−a)) (o cos/sen si E > V₀),
     a la izquierda ψ = A e^{ikx} + B e^{−ikx} con A, B de la continuidad de ψ y ψ′ en x = 0; todo se divide después por A. */
  U.scatter = (E, V0, a, m = me) => {
    const c = U.hb2m(m), k = Math.sqrt(E / c), tun = E < V0, q = Math.sqrt(Math.abs(V0 - E) / c);
    const cmul = (A, B) => [A[0] * B[0] - A[1] * B[1], A[0] * B[1] + A[1] * B[0]], cdiv = (A, B) => { const d = B[0] * B[0] + B[1] * B[1]; return [(A[0] * B[0] + A[1] * B[1]) / d, (A[1] * B[0] - A[0] * B[1]) / d]; };
    const psiIn = (x) => { const d = x - a; return tun ? [Math.cosh(q * d), (k * Math.sinh(q * d)) / q] : [Math.cos(q * d), (k * Math.sin(q * d)) / q]; };
    const dpsiIn = (x) => { const d = x - a; return tun ? [q * Math.sinh(q * d), k * Math.cosh(q * d)] : [-q * Math.sin(q * d), k * Math.cos(q * d)]; };
    const p0 = psiIn(0), d0 = dpsiIn(0), dIk = cdiv(d0, [0, k]);
    const A = [(p0[0] + dIk[0]) / 2, (p0[1] + dIk[1]) / 2], B = [(p0[0] - dIk[0]) / 2, (p0[1] - dIk[1]) / 2];
    const tau = cdiv([1, 0], A), r = cdiv(B, A), t = cmul(tau, [Math.cos(k * a), -Math.sin(k * a)]);   /* ψ = t e^{ikx} para x > a */
    return {
      k, q, t, r, T: tau[0] ** 2 + tau[1] ** 2, R: r[0] ** 2 + r[1] ** 2,
      psi: (x) => {
        if (x < 0) { const b1 = cmul(r, [Math.cos(k * x), -Math.sin(k * x)]); return [Math.cos(k * x) + b1[0], Math.sin(k * x) + b1[1]]; }
        if (x <= a) return cmul(tau, psiIn(x));
        return cmul(tau, [Math.cos(k * (x - a)), Math.sin(k * (x - a))]);
      }
    };
  };
  /* ---------- Pozo finito de anchura 2a (nm) y profundidad V0 (eV) ---------- */
  U.z0 = (V0, a, m = me) => a * Math.sqrt(V0 / U.hb2m(m));                      /* z₀ = (a/ħ)√(2mV₀) */
  U.nBound = (V0, a, m = me) => Math.ceil((2 * U.z0(V0, a, m)) / Math.PI);
  /* Energías de los estados ligados (eV, medidas desde el fondo del pozo) por bisección de las ecuaciones trascendentes */
  U.wellLevels = (V0, a, m = me) => {
    const z0 = U.z0(V0, a, m), out = [], bis = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi), fm_ = f(mid); if (fm_ * flo > 0) { lo = mid; flo = fm_; } else hi = mid; } return 0.5 * (lo + hi); };
    const N = U.nBound(V0, a, m);
    for (let n = 0; n < N; n++) {
      const lo = (n * Math.PI) / 2 + 1e-9, hi = Math.min(((n + 1) * Math.PI) / 2 - 1e-9, z0 - 1e-12);
      if (lo >= hi) continue;
      const f = n % 2 === 0 ? (z) => z * Math.tan(z) - Math.sqrt(Math.max(0, z0 * z0 - z * z)) : (z) => -z / Math.tan(z) - Math.sqrt(Math.max(0, z0 * z0 - z * z));
      const z = bis(f, lo, hi); out.push({ n: n + 1, parity: n % 2 === 0 ? 'par' : 'impar', z, E: (z * z * U.hb2m(m)) / (a * a) });
    }
    return out;
  };
  /* ---------- Microscopio de efecto túnel: I ∝ e^{−2κd} con κ = √(2mφ)/ħ ---------- */
  U.kappaStm = (phi, m = me) => Math.sqrt(phi / U.hb2m(m));                      /* nm⁻¹ con φ en eV */
  U.stmRatio = (phi, dd, m = me) => Math.exp(2 * U.kappaStm(phi, m) * dd);       /* I(d)/I(d + dd) con dd en nm */
  if (typeof module !== 'undefined' && module.exports) module.exports = U;
})(typeof window !== 'undefined' ? window : globalThis);
