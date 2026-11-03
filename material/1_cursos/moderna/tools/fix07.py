# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\07-cuerpo.html'
s = open(p, encoding='utf-8').read()
a = r"Las líneas punteadas del diagrama son radios constantes: con \(R=100\,R_\odot\) y \(T=3600\) K, \(L=1.5\times10^{3}\)... el producto \(R^2T^4\) fija la luminosidad. Betelgeuse"
b = r"Las líneas punteadas del diagrama son radios constantes (\(L\propto R^2T^4\)): con \(R=100\,R_\odot\) y \(T=3600\) K, \(L=1.5\times10^3L_\odot\). Betelgeuse"
assert a in s
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
