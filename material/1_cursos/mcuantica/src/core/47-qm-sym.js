/* ===================================================================
   47-qm-sym.js — Simetrías y reglas de selección (EM.qm.sym): matrices d de Wigner, transiciones dipolares
   del hidrógeno (integrales radiales, coeficientes de Einstein) y elementos de matriz de x entre estados 1D.
   Requiere EM.qm.hyd (43-qm-hyd.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Y = (qm.sym = {});
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  /* Matriz d de Wigner d^j_{m'm}(β) = ⟨j m'| e^{−iβJ_y} |j m⟩ (j entero o semientero) */
  Y.wd = function (j, mp, m, beta) {
    const J = Math.round(2 * j) / 2, a = Math.round(J + m), b = Math.round(J - m), c = Math.round(J + mp), d = Math.round(J - mp);
    if (a < 0 || b < 0 || c < 0 || d < 0) return 0;
    const cb = Math.cos(beta / 2), sb = Math.sin(beta / 2), pre = Math.sqrt(fact(c) * fact(d) * fact(a) * fact(b));
    let s = 0;
    for (let k = 0; k <= 2 * J + 1; k++) {
      const e1 = a - k, e2 = Math.round(mp - m) + k, e3 = d - k;
      if (e1 < 0 || e3 < 0 || e2 < 0 || k < 0) continue;
      const pc = Math.round(2 * J + m - mp - 2 * k), ps = Math.round(mp - m + 2 * k);
      s += (((Math.round(mp - m) + k) % 2 ? -1 : 1) * Math.pow(cb, pc) * Math.pow(sb, ps)) / (fact(e1) * fact(k) * fact(e2) * fact(e3));
    }
    return pre * s;
  };
  /* Integral radial ⟨n'l'|r|nl⟩ = ∫ R_{n'l'} R_{nl} r³ dr (unidades de a₀; masa nuclear infinita o μ, Z) */
  Y.radial = function (n1, l1, n2, l2, Z = 1, mu = 1) {
    const H = qm.hyd, a = 1 / (Z * mu), rmax = 90 * Math.max(n1, n2) * Math.max(n1, n2) * a / 4 + 40 * a, N = 12000, h = rmax / N; let s = 0;
    for (let i = 0; i <= N; i++) { const r = Math.max(i * h, 1e-12), w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * H.R(n1, l1, r, Z, mu) * H.R(n2, l2, r, Z, mu) * r * r * r; }
    return (s * h) / 3;
  };
  const alpha = 7.2973525693e-3, c = 299792458, a0 = 5.29177210903e-11, Ry = 13.605693122994, e = 1.602176634e-19, hbar = 1.054571817e-34;
  /* Frecuencia angular de la línea (n,l) → (n',l') en rad/s (masa nuclear infinita, o con μ) */
  Y.omega = (n, n2, Z = 1, mu = 1) => (Ry * mu * Z * Z * (1 / (n2 * n2) - 1 / (n * n)) * e) / hbar;
  /* Coeficiente A de Einstein de emisión espontánea dipolar eléctrica (s⁻¹): A = (4αω³/3c²) · [l_>/(2l + 1)] · |⟨n'l'|r|nl⟩|², l_> = máx(l, l') */
  Y.einsteinA = function (n, l, n2, l2, Z = 1, mu = 1) {
    if (Math.abs(l - l2) !== 1 || n2 >= n) return 0;
    const w = Y.omega(n, n2, Z, mu), R = Y.radial(n, l, n2, l2, Z, mu) * a0;
    return ((4 * alpha * w * w * w) / (3 * c * c)) * (Math.max(l, l2) / (2 * l + 1)) * R * R;
  };
  /* Vida media de un nivel (n,l): 1/Σ A sobre los niveles inferiores permitidos (s) */
  Y.lifetime = function (n, l, Z = 1, mu = 1) {
    let s = 0; for (let n2 = 1; n2 < n; n2++) for (const l2 of [l - 1, l + 1]) if (l2 >= 0 && l2 < n2) s += Y.einsteinA(n, l, n2, l2, Z, mu);
    return s > 0 ? 1 / s : Infinity;
  };
  /* Elementos de matriz ⟨m|x|n⟩ entre autoestados 1D discretizados (psi: arreglo de vectores normalizados con paso h) */
  Y.xmat = function (xs, psi, h) {
    const k = psi.length, M = []; for (let a = 0; a < k; a++) { M.push([]); for (let b = 0; b < k; b++) { let s = 0; for (let i = 0; i < xs.length; i++) s += psi[a][i] * xs[i] * psi[b][i]; M[a].push(s * h); } }
    return M;
  };
  /* Paridad ⟨ψ(−x)|ψ(x)⟩ de un autoestado sobre una malla simétrica */
  Y.parity = function (psi) { let s = 0; const n = psi.length; for (let i = 0; i < n; i++) s += psi[i] * psi[n - 1 - i]; return s; };
  if (typeof module !== 'undefined' && module.exports) module.exports = Y;
})(typeof window !== 'undefined' ? window : globalThis);
