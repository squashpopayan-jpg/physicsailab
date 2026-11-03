# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val05.js'
s = open(p, encoding='utf-8').read()
a = "  chk(L, 'Doppler transversal en el sistema de la fuente: f = f₀/γ (β = 0.6): 0.8', R.doppler(0.6, Math.acos(0.6)), 1 / 1.25 * 1.25 * 0.8 / 0.8, 1e-14);\n"
b = "  chk(L, 'Doppler transversal: la luz que llega perpendicular a la velocidad en el sistema del observador tiene f = f₀/γ = 0.8 f₀ (β = 0.6)', R.doppler(0.6, Math.PI / 2), 0.8, 1e-14);\n  chk(L, 'Doppler: la luz emitida perpendicularmente en el sistema de la fuente llega con f = γf₀ = 1.25 f₀ (β = 0.6)', R.doppler(0.6, Math.acos(0.6)), 1.25, 1e-14);\n"
assert a in s; s = s.replace(a, b)
i0 = s.index("  /* Campos */"); i1 = s.index("  /* Carga en movimiento */")
new = """  /* Campos */
  for (const r of ref.fields) {
    const Bsi = r.B.map((v) => v / c), f = R.fieldBoost(r.E, Bsi, r.b);   /* la referencia usa c = 1: B_ref = c·B_SI */
    for (let i = 0; i < 3; i++) {
      chk(S, `Transformación de campos (β = ${r.b}): E′${'xyz'[i]} frente a Λ F Λᵀ (numpy)`, f.E[i], r.Ep[i], 1e-12);
      chk(S, `Transformación de campos (β = ${r.b}): cB′${'xyz'[i]} frente a Λ F Λᵀ (numpy)`, f.B[i] * c, r.Bp[i], 1e-12);
    }
    const inv = R.fieldInvariants(r.E, Bsi), inv2 = R.fieldInvariants(f.E, f.B);
    chk(Y, `Invariante E² − c²B² (β = ${r.b}) conservado por el impulso y igual al de la referencia`, inv2[0], r.inv1, 1e-11);
    chk(Y, `Invariante E·B (β = ${r.b}) conservado por el impulso`, inv2[1] * c, r.inv2, 1e-11);
    void inv;
  }
"""
s = s[:i0] + new + s[i1:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
