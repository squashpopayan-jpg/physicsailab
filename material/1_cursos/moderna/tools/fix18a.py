# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\18-moleculas.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)
rep("El error es del orden de \\((m_e/M)^{1/2}\\sim10^{-2}\\), y es lo que permite", "El parámetro de la expansión es \\(\\kappa=(m_e/M)^{1/4}\\approx0.1\\) (Born y Oppenheimer), y es lo que permite")
rep("tiene líneas separadas \\(\\approx2B\\) (19.6 cm\\(^{-1}\\) entre R(0) y R(1)), cuya separación disminuye", "tiene líneas separadas algo menos de \\(2B\\) (19.6 cm\\(^{-1}\\) entre R(0) y R(1), frente a \\(2B_e=21.2\\)), y su separación disminuye")
rep("345.80 GHz", "345.82 GHz")
rep("(sin el término de distorsión centrífuga, que es despreciable)", "(la distorsión centrífuga aporta \\(-0.002\\) cm\\(^{-1}\\))")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
