# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\20-solidos.html'
s = open(p, encoding='utf-8').read()
n0 = s.count('3.47')
s = s.replace('3.47\\times10^{-13}', '3.46\\times10^{-13}').replace('5.91\\times10^{-13}', '5.92\\times10^{-13}')
print(n0, s.count('3.46'))
open(p, 'w', encoding='utf-8').write(s)
q = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\20-solidos.js'
t = open(q, encoding='utf-8').read()
a = "const k = Math.abs(kk); const b = solve(lo, hi, k);"
assert a in t
t = t.replace(a, "const k = Math.max(Math.abs(kk), 1e-3); const b = solve(lo, hi, k);")
open(q, 'w', encoding='utf-8').write(t)
