# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\22-nucleo.html'
s = open(p, encoding='utf-8').read()
def rep(a, b, cnt=None):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)
rep('⁴He, 1.91 fm', '⁴He, 1.90 fm')
rep('<tr><td>²⁰⁸Pb</td><td>1636.43</td><td>7.868</td></tr>', '<tr><td>²⁰⁸Pb</td><td>1636.43</td><td>7.867</td></tr>')
rep('56^{2/3}=-18.177\\times14.633', '56^{2/3}=-18.177\\times14.637') if '56^{2/3}=-18.177\\times14.633' in s else rep('\\(-18.177\\times56^{2/3}=-18.177\\times14.633=-266.06\\)', '\\(-18.177\\times56^{2/3}=-18.177\\times14.637=-266.06\\)')
rep('340.54', '340.55')
rep('92.8 para \\(A=238\\)', '92.4 para \\(A=238\\)')
open(p, 'w', encoding='utf-8').write(s)
c = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\caps\cap22.py'
t = open(c, encoding='utf-8').read()
t = t.replace("'Texto: R He', 1.2*4**(1/3), '1.91'", "'Texto: R He', 1.2*4**(1/3), '1.90'").replace("'Tabla: B/A({Z},{A})', B(Z, A)/A, BA)", "'Tabla: B/A({Z},{A})', B(Z, A)/A, BA)").replace("(82, 208, '1636.43', '7.868')", "(82, 208, '1636.43', '7.867')").replace("56**(2/3), '14.633'", "56**(2/3), '14.637'").replace("semf(20, 40) if False else None", "").replace("'P6: fórmula Ca40', semf(20, 40), '340.54'", "'P6: fórmula Ca40', semf(20, 40), '340.55'").replace("238**(2/3)), '92.8'", "238**(2/3)), '92.4'")
t = t.replace("g45 = {n: v for n, v in gaps(45.0) if v > 2.0}", "g45 = {n: v for n, v in gaps(45.0) if v > 2.0 and n <= 140}")
open(c, 'w', encoding='utf-8').write(t)
q = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val22.js'
u = open(q, encoding='utf-8').read()
u = u.replace("Evans para el ²³⁸U: Z = 92.8', N.zEvans(238), 92.8, 5e-3)", "Evans para el ²³⁸U: Z = 92.4', N.zEvans(238), 92.4, 5e-3)")
open(q, 'w', encoding='utf-8').write(u)
print('ok')
