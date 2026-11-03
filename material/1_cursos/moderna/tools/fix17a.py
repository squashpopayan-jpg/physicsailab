# -*- coding: utf-8 -*-
import re
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\17-laser.html'
s = open(p, encoding='utf-8').read()
i = s.index('tarda decenas de microsegundos')
a = s.rindex('<li>', 0, i); b = s.index('</li>', i) + 5
new = r'''<li>Con \(r=2.5\) la inversión crece casi linealmente hasta el umbral, tras \(\tau\ln[r/(r-1)]=117.5\) µs (el simulador marca 118.9 µs al cruzar la mitad del valor estacionario); entonces el láser dispara un primer pico gigante (9.5 veces el valor estacionario), \(N\) baja y sigue una secuencia de picos con periodo de 2.5 µs (406 kHz), cada vez menores, hasta estabilizarse en \(N=N_{th}\), \(\varphi=\varphi_{ss}\). Reduzca la ventana temporal para distinguirlos.</li>'''
s = s[:a] + new + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
