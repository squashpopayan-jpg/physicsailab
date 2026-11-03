# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\caps\cap07.py'
s = open(p, encoding='utf-8').read()
i0 = s.index("x = sp.symbols('x', positive=True); n_ = ")
i1 = s.index("chk(7, 'SymPy: σ = ")
new = """q_ = sp.symbols('q', positive=True); S0_ = 1/(1-q_); S1_ = q_*sp.diff(S0_, q_)     # Σqⁿ = 1/(1−q); Σ n qⁿ = q d/dq Σ qⁿ
chk(7, 'SymPy: ⟨n⟩ = Σ n qⁿ/Σ qⁿ = q/(1 − q) = 1/(e^x − 1) con q = e^(−1)', float(sp.simplify(S1_/S0_).subs(q_, sp.exp(-1))), 1/(math.e-1), 1e-12)
chk(7, 'SymPy: Σ n qⁿ = q/(1 − q)² (comprobación simbólica)', float(sp.simplify(S1_ - q_/(1-q_)**2).subs(q_, 0.3)), 0, 1e-12, False)
"""
s = s[:i0] + new + s[i1:]
s = s.replace("'8.9004'", "'8.9002'").replace("'7.3846'", "'7.3852'").replace("'1.5158'", "'1.5151'").replace("'2.2682'", "'2.2681'").replace("'9.083'", "'9.081'")
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\07-cuerpo.html'
s = open(p, encoding='utf-8').read()
for a, b in (("8.9004\\times10^9", "8.9002\\times10^9"), ("7.3846\\times10^9", "7.3852\\times10^9"), ("1.5158\\times10^9", "1.5151\\times10^9"), ("9.083\\times10^{43}", "9.081\\times10^{43}")):
    assert a in s, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
