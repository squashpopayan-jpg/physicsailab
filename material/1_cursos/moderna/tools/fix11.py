# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\11-schrod.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"1.136 para \(n=1\) y 7.6 para \(n=8\)", r"1.136 para \(n=1\) y 14.4 para \(n=8\)"),
 (r"El término de Coulomb es una corrección del 5 % al 15 %; el de confinamiento, del 40 % al 100 % de \(E_g\).", r"Para \(R=2\) nm en CdSe, el confinamiento suma el 54 % de \(E_g\) y el término de Coulomb resta el 7 %."),
]
for a, b in rep:
    assert a in s, a[:50]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
