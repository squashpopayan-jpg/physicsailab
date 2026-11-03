# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\24-reacciones.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)
rep('y diez millones de veces la de la combustión del petróleo', 'y unos ocho millones de veces la de la combustión del petróleo (\\(4.2\\times10^7\\) J/kg)')
rep('(la masa de los dos neutrinos que escapan, \\(\\sim0.52\\) MeV en promedio, no se aprovecha)', '(la energía de los dos neutrinos que escapan, \\(\\sim0.52\\) MeV en promedio, no se aprovecha)')
rep('Con \\(\\rho=0.001\\) (15 pcm... 100 pcm) el período es 68.9 s', 'Con \\(\\rho=0.001\\) (100 pcm, 0.15 \\$) el período es 68.9 s')
i = s.index('<li>En el modo «cadena»'); j = s.index('</li>', i) + 5
s = s[:i] + '<li>En el modo «cadena», con \\(k=1.1\\) y 5 neutrones iniciales, la mayoría de las 12 trayectorias crece como \\(1.1^g\\), pero alguna se extingue: un neutrón aislado se extingue con probabilidad 0.82 y cinco independientes, con \\(0.82^5=0.38\\).</li>' + s[j:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
