# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\51-fm-gr.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("  G.deflectionExact = ")
i1 = s.index("  /* Precesión del perihelio por órbita")
new = """  G.deflectionExact = (GM, b) => {
    const m = GM / (c * c), B = b / m;                 /* en unidades de m = GM/c² */
    /* distancia mínima r0: raíz exterior de r³ − B²(r − 2) = 0 (Newton desde r0 = B) */
    let r0 = B; for (let i = 0; i < 200; i++) { const f = r0 ** 3 - B * B * (r0 - 2), fp = 3 * r0 * r0 - B * B; r0 -= f / fp; }
    const u0 = 1 / r0;
    /* Δφ_total = 2∫_0^{u0} du/√(1/B² − u² + 2u³); con u = u0(1 − s²) el integrando 2u0 s/√q es regular en s = 0 */
    const f = (s) => { const u = u0 * (1 - s * s), q = 1 / (B * B) - u * u + 2 * u * u * u; return (2 * u0 * s) / Math.sqrt(Math.max(q, 1e-300)); };
    const X = [0.9061798459386640, 0.5384693101056831], W = [0.2369268850561891, 0.4786286704993665, 0.5688888888888889], n = 4000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a = i / n, b2 = (i + 1) / n, xm = 0.5 * (a + b2), xr = 0.5 * (b2 - a);
      let s5 = W[2] * f(xm); for (let k = 0; k < 2; k++) s5 += W[k] * (f(xm + xr * X[k]) + f(xm - xr * X[k]));
      sum += s5 * xr;
    }
    return 2 * sum - Math.PI;
  };
"""
s = s[:i0] + new + s[i1:]
a = s.index("  G.schwOrbit = (rp, ra) => {")
b = s.index("  /* Ángulo recorrido entre un periastro")
new2 = """  G.schwOrbit = (rp, ra) => {
    const u1 = 1 / rp, u2 = 1 / ra, u3 = 0.5 - u1 - u2, s = u1 + u2;
    const l2 = 1 / (u1 * u2 + u3 * s);                                  /* de la suma de productos de las raíces de la cúbica */
    const E2 = 1 - 2 * u1 + l2 * (u1 * u1 - 2 * u1 ** 3);              /* de (du/dφ)² = 0 en el periastro */
    return { u1, u2, u3, l2, E2, stable: u3 > u1 };
  };
"""
s = s[:a] + new2 + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
