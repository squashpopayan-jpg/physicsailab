# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\28-cosmologia.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)
rep('de modo que su ángulo es \\(\\theta_*=r_s/D_M=0.01040\\) rad \\(=1.0405^\\circ\\) (medido: \\(100\\theta_*=1.0411\\))', 'de modo que su ángulo es \\(\\theta_*=r_s/D_M=0.010405\\) rad \\(=0.596^\\circ\\) (medido: \\(100\\theta_*=1.0411\\))')
rep('y 1.0405°.</li>', 'y \\(100\\theta_*=1.0405\\) (0.596°).</li>')
rep('Cuando el universo tenía unos 380 000 años', 'Cuando el universo tenía unos 370 000 años')
rep('es decir, la energía de unos 3.3 protones por metro cúbico', 'es decir, la energía de unos 3.5 protones por metro cúbico')
i = s.index('<li><b>Ángulo.</b>'); j = s.index('</li>', i) + 5
s = s[:i] + '<li><b>Ángulo.</b> \\(\\theta_*=144.26/13\\,864=0.010405\\) rad \\(=0.596^\\circ\\).</li>' + s[j:]
i = s.index('<li><b>Convención.</b>'); j = s.index('</li>', i) + 5
s = s[:i] + '<li><b>Convención.</b> \\(100\\theta_*=1.0405\\), frente al valor medido 1.0411.</li>' + s[j:]
rep('<span class="ans">\\(\\theta_*=0.010405\\) rad (\\(100\\theta_*=1.0405\\)); \\(z=1379\\).</span>', '<span class="ans">\\(\\theta_*=0.010405\\) rad = 0.596° (\\(100\\theta_*=1.0405\\)); \\(z=1379\\).</span>')
open(p, 'w', encoding='utf-8').write(s)
q = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val28.js'
t = open(q, encoding='utf-8').read()
t = t.replace("'Ángulo acústico θ* = r_*/D_M = 1.040° (Planck 2018: 100θ* = 1.0411)'", "'Ángulo acústico θ* = r_*/D_M = 0.010405 rad = 0.596° (Planck 2018: 100θ* = 1.0411)'")
open(q, 'w', encoding='utf-8').write(t)
print('ok')
