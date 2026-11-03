# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val05.js'
s = open(p, encoding='utf-8').read()
s = s.replace("K = 0.2617 MeV', R.cherenkovThresholdK(1.333, R.MASS.e), 0.26166, 1e-3)", "K = 0.2618 MeV', R.cherenkovThresholdK(1.333, R.MASS.e), 0.261807, 1e-5)")
s = s.replace("R.cherenkovThresholdK(1.333, R.MASS.mu), 54.14, 2e-3)", "R.cherenkovThresholdK(1.333, R.MASS.mu), 54.1335, 1e-5)")
s = s.replace("(β = 1): 334 (Frank–Tamm)', R.cherenkovYield(1.333, 1, 300e-9, 600e-9) / 100, 334.3, 1e-3)", "(β = 1): 334 (Frank–Tamm)', R.cherenkovYield(1.333, 1, 300e-9, 600e-9) / 100, 334.112, 1e-5)")
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\05-doppler.html'
s = open(p, encoding='utf-8').read()
a = r"A pequeñas velocidades las tres curvas de la derecha son casi la misma recta: el efecto transversal es de segundo orden en \(\beta\)."
b = r"A pequeñas velocidades las curvas de acercamiento y alejamiento son casi simétricas respecto de 1 (\(1\pm\beta\)) y la transversal es casi horizontal: el efecto transversal es de segundo orden en \(\beta\) (\(1-\tfrac12\beta^2\))."
assert a in s; s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
