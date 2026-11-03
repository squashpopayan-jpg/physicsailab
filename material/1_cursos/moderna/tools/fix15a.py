# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val15.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("  chk(L, 'Factores de Landé:")
i1 = s.index("  for (const r of ref.p6) {")
new = """  chk(L, 'Factor de Landé del ²S½ (L = 0, J = ½): g = 2', P.landeG(0.5, 0, 0.5), 2, 1e-14); chk(L, 'Factor de Landé del ²P½: g = 2/3', P.landeG(0.5, 1, 0.5), 2 / 3, 1e-14); chk(L, 'Factor de Landé del ²P3/2: g = 4/3', P.landeG(1.5, 1, 0.5), 4 / 3, 1e-14);
  chk(L, 'Factor de Landé del ³P₂ (L = 1, S = 1, J = 2): g = 3/2', P.landeG(2, 1, 1), 1.5, 1e-14); chk(L, 'Factor de Landé del ¹P₁ (singlete, S = 0): g = 1 (efecto Zeeman normal)', P.landeG(1, 1, 0), 1, 1e-14);
"""
s = s[:i0] + new + s[i1:]
a = "  chk(S, 'Razón giromagnética del electrón: g μ_B/h = 28 024.95 MHz/T frente a scipy.constants', (P.ge * P.larmorHz(1)) / 2 / 1e6 * 2, c.gamma_e * 1 / 1, 2e-3 * 0 + 1e-6 + 1e-3);\n"
b = "  chk(S, 'Razón giromagnética del electrón: γ_e/2π = g μ_B/h = 28 024.95 MHz/T frente a scipy.constants', (P.ge * P.larmorHz(1)) / 1e6, c.gamma_e, 1e-8);\n"
assert a in s; s = s.replace(a, b)
s = s.replace("c.gamma_p, 2e-9 + 1e-8);", "c.gamma_p, 1e-8);")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
