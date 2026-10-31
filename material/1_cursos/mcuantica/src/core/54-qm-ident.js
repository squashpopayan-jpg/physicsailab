/* ===================================================================
   54-qm-ident.js — Partículas idénticas (EM.qm.id): pares en una caja 1D simetrizados/antisimetrizados, integrales de Coulomb y de
   intercambio de las configuraciones 1s2s hidrogenoides (helio excitado), distribuciones cuánticas y conteo de estados.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Id = (qm.id = {});
  const PI = Math.PI;
  /* Orbital de la caja de longitud L */
  Id.phi = (n, x, L = 1) => Math.sqrt(2 / L) * Math.sin((n * PI * x) / L);
  /* Función de onda de dos partículas: s = +1 (simétrica), −1 (antisimétrica), 0 (distinguibles) */
  Id.psi2 = (a, b, x1, x2, s, L = 1) => (s === 0 ? Id.phi(a, x1, L) * Id.phi(b, x2, L) : (Id.phi(a, x1, L) * Id.phi(b, x2, L) + s * Id.phi(b, x1, L) * Id.phi(a, x2, L)) / Math.SQRT2);
  /* Momentos de la caja: ⟨x⟩ = L/2, ⟨x²⟩_n = L²(1/3 − 1/(2n²π²)), ⟨x⟩_{ab} = −8Lab/(π²(a² − b²)²) (a + b impar), 0 si a + b par */
  Id.x2 = (n, L = 1) => L * L * (1 / 3 - 1 / (2 * n * n * PI * PI));
  Id.xab = (a, b, L = 1) => ((a + b) % 2 === 0 ? 0 : (-8 * L * a * b) / (PI * PI * (a * a - b * b) ** 2));
  Id.sep2 = (a, b, s, L = 1) => { const d = Id.x2(a, L) + Id.x2(b, L) - 2 * (L / 2) ** 2; return s === 0 ? d : d - 2 * s * Id.xab(a, b, L) ** 2; };
  /* Desplazamiento de primer orden de una interacción de contacto g δ(x₁ − x₂): g ∫ |Ψ(x, x)|² dx (Simpson) */
  Id.contact = function (a, b, s, g = 1, L = 1, N = 2000) { const h = L / N; let t = 0; for (let i = 0; i <= N; i++) { const x = i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; t += w * Id.psi2(a, b, x, x, s, L) ** 2; } return (g * t * h) / 3; };
  /* Radiales hidrogenoides s */
  const R10 = (r, Z) => 2 * Math.pow(Z, 1.5) * Math.exp(-Z * r), R20 = (r, Z) => (Math.pow(Z, 1.5) / Math.SQRT2) * (1 - (Z * r) / 2) * Math.exp((-Z * r) / 2);
  /* Integrales de Coulomb J y de intercambio K (hartree) de la configuración 1s(Z₁)2s(Z₂): promedio angular de 1/r₁₂ = 1/r_> para orbitales s */
  Id.JK = function (Z1, Z2, rmax = 60, N = 24000) {
    const h = rmax / N, r = new Float64Array(N + 1); for (let i = 0; i <= N; i++) r[i] = Math.max(i * h, 1e-12);
    const f1 = r.map((x) => R10(x, Z1) ** 2 * x * x), f2 = r.map((x) => R20(x, Z2) ** 2 * x * x), g = r.map((x) => R10(x, Z1) * R20(x, Z2) * x * x);
    const inner = (f) => { const A = new Float64Array(N + 1), B = new Float64Array(N + 1); for (let i = 1; i <= N; i++) A[i] = A[i - 1] + 0.5 * h * (f[i] + f[i - 1]); for (let i = N - 1; i >= 0; i--) B[i] = B[i + 1] + 0.5 * h * (f[i] / r[i] + f[i + 1] / r[i + 1]); return (i) => A[i] / r[i] + B[i]; };
    const I2 = inner(f2), Ig = inner(g); let J = 0, K = 0;
    for (let i = 0; i <= N; i++) { const w = i === 0 || i === N ? 0.5 : 1; J += w * f1[i] * I2(i) * h; K += w * g[i] * Ig(i) * h; }
    return { J, K };
  };
  /* Distribuciones de ocupación: x = (ε − μ)/kT */
  Id.fd = (x) => 1 / (Math.exp(x) + 1); Id.be = (x) => 1 / (Math.exp(x) - 1); Id.mb = (x) => Math.exp(-x);
  /* Número de microestados de N partículas en M niveles (sin degeneración): distinguibles M^N, bosones C(M + N − 1, N), fermiones C(M, N) */
  const comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
  Id.count = (N, M, type) => (type === 'dist' ? Math.pow(M, N) : type === 'bos' ? comb(M + N - 1, N) : comb(M, N));
  if (typeof module !== 'undefined' && module.exports) module.exports = Id;
})(typeof window !== 'undefined' ? window : globalThis);
