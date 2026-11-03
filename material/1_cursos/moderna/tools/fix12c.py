# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\12-tunel.html'
s = open(p, encoding='utf-8').read()
rep = [
 ("un factor 1.544 (54 %) de pico a valle al recorrer un átomo; con 1 pm, 2.2 % . Es la razón", "un factor 1.545 (54 %) de pico a valle al recorrer un átomo; con 1 pm, 2.2 %. Es la razón"),
 ("\\(z_1=1.3975\\) (comprobación: \\(1.3975\\tan1.3975=7.98=\\sqrt{65.62-1.953}\\))", "\\(z_1=1.3974\\) (comprobación: \\(1.3974\\tan1.3974=7.98=\\sqrt{65.62-1.953}\\))"),
 ("1.9530\\times0.0380998/0.25=0.2976\\) eV.", "1.9527\\times0.0380998/0.25=0.2976\\) eV."),
 ("cociente \\(0.7915\\).", "cociente \\(0.7914\\)."),
 ("[1+25(0.0653)/56]^{-1}=0.9747\\)", "[1+25(0.0581)/56]^{-1}=0.9747\\)"),
 ("\\(k=\\sqrt{E_1/0.0380998}=2.7951\\) nm", "\\(k=\\sqrt{E_1/0.0380998}=2.7948\\) nm"),
 ("A^2(0.02979/15.958)=0.001867\\,A^2\\) (con \\(\\cos1.3975=0.1726\\)).</li>\\n<li><b>Probabilidad.</b> \\(P_\\text{fuera}=0.001867/(0.5608+0.001867)=3.32\\times10^{-3}\\).</li>",
  "A^2(0.02976/15.958)=0.001865\\,A^2\\) (con \\(\\cos1.3974=0.1725\\)).</li>\n<li><b>Probabilidad.</b> \\(P_\\text{fuera}=0.001865/(0.5608+0.001865)=3.31\\times10^{-3}\\).</li>"),
 ("2.56\\,e^{-6.148}=5.474\\times10^{-3}\\)", "2.56\\,e^{-6.1476}=5.474\\times10^{-3}\\)"),
]
for a, b in rep:
    if a not in s:
        print('NO ENCONTRADO:', a[:70]); continue
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
