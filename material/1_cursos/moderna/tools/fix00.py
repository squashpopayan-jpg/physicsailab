# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\00-inicio.html'
s = open(p, encoding='utf-8').read()
a = r'\[\frac{H^2}{H_0^2}=\Omega_ra^{-4}+\Omega_ma^{-3}+\Omega_\Lambda\]'
assert a in s
s = s.replace(a, r'\[\frac{H^2}{H_0^2}=\frac{\Omega_m}{a^3}+\Omega_\Lambda\]')
s = s.replace('Cada parte parte de la crisis experimental', 'Cada parte arranca de la crisis experimental')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
