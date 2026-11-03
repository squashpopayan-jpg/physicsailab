# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\62-fm-at.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("  /* Hartree–Fock del estado fundamental")
i1 = s.index("  /* extrapolación de Richardson")
new = r'''  /* Hartree–Fock del estado fundamental de un sistema de dos electrones: un orbital radial u(r) = rR(r) con −u''/2 + (−Z/r + V_H)u = εu,
     V_H(r) = ∫u²(r')/max(r, r')dr' (energía E = 2ε − J, J = ∫u²V_H).  Malla logarítmica r = e^x, u = e^{x/2}f, g = e^x f:
     [−½D² + ⅛ + e^{2x}V] f = ε e^{2x} f  →  problema simétrico tridiagonal en g con ∫u²dr = Σg²Δx (error O(Δx²)). */
  A.heHF = function (Z, o = {}) {
    const dx = o.h || 0.02, x0 = Math.log(o.rmin || 1e-6), x1 = Math.log(o.Rmax || 18 / Math.max(1, Z - 0.5)), N = Math.round((x1 - x0) / dx);
    const x = new Float64Array(N), r = new Float64Array(N), d = new Float64Array(N), e = new Float64Array(N - 1);
    for (let i = 0; i < N; i++) { x[i] = x0 + (i + 1) * dx; r[i] = Math.exp(x[i]); }
    for (let i = 0; i < N - 1; i++) e[i] = -0.5 / (dx * dx) / (r[i] * r[i + 1]);
    let g = r.map((rr) => rr * Math.sqrt(rr) * Math.exp(-(Z - 0.3) * rr));
    const norm = (v) => { let s = 0; for (let i = 0; i < N; i++) s += v[i] * v[i]; s = Math.sqrt(s * dx); return v.map((q) => q / s); };
    g = norm(g);
    const VH = (gg) => {
      const q = new Float64Array(N), w = new Float64Array(N), out = new Float64Array(N);
      let s = 0; for (let i = 0; i < N; i++) { s += gg[i] * gg[i] * dx; q[i] = s - 0.5 * gg[i] * gg[i] * dx; }
      s = 0; for (let i = N - 1; i >= 0; i--) { w[i] = s + 0.5 * gg[i] * gg[i] / r[i] * dx; s += gg[i] * gg[i] / r[i] * dx; }
      for (let i = 0; i < N; i++) out[i] = q[i] / r[i] + w[i];
      return out;
    };
    let eps = 0, J = 0, Ecur = 0, Eold = 0, it;
    for (it = 0; it < 80; it++) {
      const vh = VH(g);
      for (let i = 0; i < N; i++) d[i] = (1 / (dx * dx) + 0.125 + r[i] * r[i] * (-Z / r[i] + vh[i])) / (r[i] * r[i]);
      const sol = LAf().tridiagLowest(d, e, 1);
      eps = sol.values[0]; const gn = norm(sol.vectors[0]);
      let s = 0; for (let i = 0; i < N; i++) s += gn[i] * gn[i] * vh[i]; J = s * dx;
      Ecur = 2 * eps - J;
      const mix = it < 3 ? 0.5 : 0.7; g = norm(g.map((q, i) => (1 - mix) * q + mix * gn[i]));
      if (it > 2 && Math.abs(Ecur - Eold) < 1e-12) break; Eold = Ecur;
    }
    const u = g.map((q, i) => q / Math.sqrt(r[i]));
    return { E: Ecur, eps, J, r, u, iters: it + 1, h: dx };
  };
'''
s = s[:i0] + new + s[i1:]
s = s.replace("A.heHF(Z, { h: 0.02 }), b = A.heHF(Z, { h: 0.01 })", "A.heHF(Z, { h: 0.04 }), b = A.heHF(Z, { h: 0.02 })")
open(p, 'w', encoding='utf-8').write(s)
