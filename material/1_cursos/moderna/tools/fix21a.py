# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\21-macro.js'
s = open(p, encoding='utf-8').read()
a = s.index("      pl.fn((q) => { const pp = q * 1e10 * hbar; return q < 0.9")
b = s.index("      pl.fn((q) => (p.v * q * 1e10 * hbar) / kB")
new = """      pl.fn((q) => (q <= 0.65 ? ph(q) : NaN), { color: '--c1', width: 3, n: 100 }); pl.fn((q) => (q >= 1.2 ? Mc.rotonE(q * 1e10 * hbar) / kB : NaN), { color: '--c2', width: 3, n: 200 });
      pl.xy([0.65, 1.2], [ph(0.65), Mc.rotonE(1.2e10 * hbar) / kB], { color: '--ink-3', width: 1.4, dash: [3, 3] });
"""
s = s[:a] + new + s[b:]
s = s.replace("frecuencia de Josephson con I_cR_n = 0.28 mV (Al)", "frecuencia de Josephson con I_cR_n = 0.2805 mV (Al)")
s = s.replace("EM.fix(Mc.josephsonHz(Mc.rcsjAnalytic(p.i) * 0.28e-3) / 1e9, 1)", "EM.fix(Mc.josephsonHz(Mc.rcsjAnalytic(p.i) * 0.2805e-3) / 1e9, 1)")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
