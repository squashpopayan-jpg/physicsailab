# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\27-estrellas.html'
s = open(p, encoding='utf-8').read()
print(s.count('3.85\\times10^{9}'), s.count('9.15'), s.count('(pendiente numérica \\(-0.33\\))'))
s = s.replace('3.85\\times10^{9}', '4.93\\times10^{9}').replace('9.15', '9.16').replace('(pendiente numérica \\(-0.33\\))', '(pendiente numérica \\(-0.34\\))')
open(p, 'w', encoding='utf-8').write(s)
c = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\caps\cap27.py'
t = open(c, encoding='utf-8').read()
t = t.replace("'P3: K (10⁹)', Kc2/1e9, '3.85'", "'P3: K (10⁹)', Kc2/1e9, '4.93'").replace("'Texto: pendiente R–M', math.log(b_[0]/a_[0])/math.log(b_[1]/a_[1]), '-0.33'", "'Texto: pendiente R–M', math.log(b_[0]/a_[0])/math.log(b_[1]/a_[1]), '-0.34'").replace("Rm_/1e3, '9.15'", "Rm_/1e3, '9.16'")
open(c, 'w', encoding='utf-8').write(t)
