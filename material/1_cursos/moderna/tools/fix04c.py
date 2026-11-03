# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\04-dinamica.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"Con \(\cos\theta^*=0.6\): \(E_1=798.1\) MeV, \(E_2=201.9\) MeV.", r"Con \(\cos\theta^*=0.6\): \(E_1=797.3\) MeV, \(E_2=202.7\) MeV."),
 (r"y los dos \(\alpha\) salen con 8.7 MeV cada uno: coincide con el valor medido, con una precisión del 0.5 %.", r"y los dos \(\alpha\) salen con 8.7 MeV cada uno: la energía medida en 1932 coincide con este valor dentro de su incertidumbre experimental."),
 (r"(19479.7-11163.6)/(279.14)=29.792", r"\((19479.9-11163.6)/(279.14)=29.792\)"),
]
for a, b in rep:
    assert a in s, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
