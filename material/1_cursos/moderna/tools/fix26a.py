# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\26-aceleradores.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)
rep('(\\(10^{-12}\\) de su energía), pero con \\(3\\times10^{14}\\) protones almacenados se disipan unos 3.6 kW', '(\\(10^{-9}\\) de su energía), pero con \\(3.2\\times10^{14}\\) protones almacenados se disipan unos 3.9 kW')
rep('y pérdida de 6.2 keV por vuelta', 'y pérdida de 5.9 keV por vuelta')
rep('algo más (2.6–4 %) que los valores del PDG', 'algo más (1–4 %) que los valores del PDG')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
