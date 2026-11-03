# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\26-aceleradores.html'
s = open(p, encoding='utf-8').read()
n1 = s.count('=7.290\\)'); n2 = s.count('=86.8\\)')
s = s.replace('=7.290\\)', '=7.291\\)').replace('=86.8\\)', '=86.9\\)')
print(n1, n2)
open(p, 'w', encoding='utf-8').write(s)
