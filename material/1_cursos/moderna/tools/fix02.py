# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\02-lorentz.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"Con 0.3 GeV (\(\gamma=2.84\)), 1.9 km y solo \(3.6\times10^{-4}\) %", r"Con 0.3 GeV (\(\gamma=2.84\)), 1.75 km y solo 0.019 %"),
 ("después de 3 impulsos se llega a 0.99997 c", "después de 3 impulsos se llega a 0.9997 c"),
 (r"\((ct')^2-x'^2=22\,422.6-22\,546.8=-124.5\) m²", r"\((ct')^2-x'^2=22\,422.2-22\,546.7=-124.5\) m²"),
 (r"El coeficiente de arrastre \(1-1/n^2=0.4372\) para el agua (\(n=1.333\)) es la cifra de Fresnel que Fizeau midió (aproximadamente 0.5) y que Michelson y Morley (1886) y Zeeman (1914) afinaron hasta el 0.434–0.437 teórico; con",
  r"El coeficiente de arrastre es \(1-1/n^2=0.4372\) para el agua (\(n=1.333\)); Fizeau obtuvo un valor cercano a 0.5, Michelson y Morley (1886) midieron \(0.434\pm0.02\) y Zeeman (1914–1922) lo confirmó con mayor precisión. Con"),
 ("de acuerdo con la teoría con una precisión de una milésima.", "de acuerdo con la teoría con una precisión de unas dos milésimas."),
]
for a, b in rep:
    assert a in s, a[:50]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
