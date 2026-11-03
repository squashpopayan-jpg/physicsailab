/* ===================================================================
   60-fm-spin.js — Espín y estructura fina (EM.fm.spin): magnetón de Bohr, Stern–Gerlach, factores de Landé, niveles de un estado p en campo
   magnético (Zeeman → Paschen–Back, solución analítica por bloques), estructura fina de Dirac, hiperfina 21 cm, resonancia magnética. Sin DOM; SI.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const S = (fm.spin = {});
  const { h, hbar, e, me, c, kB } = K;
  S.muB = (e * hbar) / (2 * me);                              /* magnetón de Bohr: 9.2740×10⁻²⁴ J/T */
  S.muBeVT = S.muB / e;                                        /* eV/T: 5.7884×10⁻⁵ */
  S.muN = (e * hbar) / (2 * K.mp);
  S.ge = 2.00231930436256;
  /* Factor de Landé gJ = 1 + [J(J+1) + S(S+1) − L(L+1)] / (2J(J+1)) */
  S.landeG = (J, L, Sp) => (J === 0 ? 0 : 1 + (J * (J + 1) + Sp * (Sp + 1) - L * (L + 1)) / (2 * J * (J + 1)));
  /* Efecto Zeeman débil: E = g_J m_J μ_B B */
  S.zeeman = (g, mj, B) => g * mj * S.muB * B;
  S.larmorHz = (B, g = 1) => (g * S.muB * B) / h;             /* 13.996 GHz/T para g = 1 */
  /* Stern–Gerlach: desviación z = (F/m)[L²/(2v²) + L D/v²] con F = μ_z dB/dz, L = longitud del imán, D = distancia imán–pantalla */
  S.sgDeflection = (mu_z, grad, m, v, Lm, D) => ((mu_z * grad) / m) * (Lm * Lm / (2 * v * v) + (Lm * D) / (v * v));
  S.vMeanBeam = (T, m) => Math.sqrt((8 * kB * T) / (Math.PI * m));      /* velocidad media del gas en el horno (efusión: flujo ∝ v³) */
  /* Niveles de un estado p (l = 1, s = ½) con acoplamiento espín–órbita A L·S y campo B: bloques analíticos por m_j.
     Devuelve las seis energías {mj, E} (J). A = (2/3) ΔE_FS con ΔE_FS = E(J = 3/2) − E(J = 1/2). */
  S.pLevels = (A, B) => {
    const mb = S.muB * B, out = [];
    out.push({ mj: 1.5, E: A / 2 + 2 * mb }); out.push({ mj: -1.5, E: A / 2 - 2 * mb });
    const blk = (d1, d2, off) => { const m = (d1 + d2) / 2, s = Math.sqrt(((d1 - d2) / 2) ** 2 + off * off); return [m + s, m - s]; };
    const up = blk(-A / 2, mb, A / Math.SQRT2), dn = blk(-A / 2, -mb, A / Math.SQRT2);
    out.push({ mj: 0.5, E: up[0] }); out.push({ mj: 0.5, E: up[1] }); out.push({ mj: -0.5, E: dn[0] }); out.push({ mj: -0.5, E: dn[1] });
    return out.sort((a, b) => a.E - b.E);
  };
  /* Estructura fina de Dirac del hidrógeno: E_nj = −Ry/n² [1 + (α²/n²)(n/(j + ½) − 3/4)] (eV, aproximación de orden α²) y la fórmula exacta de Dirac (energía relativa a mc²) */
  S.fineEV = (n, j) => -(K.Ry_eV / (n * n)) * (1 + ((K.alpha * K.alpha) / (n * n)) * (n / (j + 0.5) - 0.75));
  S.diracExact = (n, j, Z = 1) => { const a = K.alpha * Z, g = Math.sqrt((j + 0.5) ** 2 - a * a), d = n - (j + 0.5) + g; return 1 / Math.sqrt(1 + (a * a) / (d * d)); };   /* E/mc² */
  S.fineSplit2p = () => (K.alpha * K.alpha * K.Ry_eV) / 16;                        /* E(2p3/2) − E(2p1/2) en eV: α²Ry/16 */
  /* Hiperfina de Fermi del hidrógeno 1s: ΔE = (4/3) g_p (m_e/m_p) α⁴ m_e c² [(μ/m_e)³] sin correcciones QED (g_p = 5.5856946893) */
  S.hyperfineHz = () => { const gp = 5.5856946893, mu3 = Math.pow(K.mp / (K.mp + me), 3); return ((4 / 3) * gp * (me / K.mp) * Math.pow(K.alpha, 4) * me * c * c * mu3) / h; };
  /* Resonancia magnética: ν = γB/2π con γ/2π en MHz/T; polarización térmica de espín ½: P = tanh(γħB/2kT) */
  S.polarization = (gammaHzT, B, T) => Math.tanh((h * gammaHzT * B) / (2 * kB * T));
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
