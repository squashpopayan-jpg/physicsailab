# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\09-materia.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"\(pc\approx\hbar c/r=39.5\) MeV, un millar de veces mayor que la energía de ligadura que mantendría la atracción coulombiana; un protón,", r"\(pc\approx\hbar c/r=39.5\) MeV, varias veces mayor que la atracción coulombiana de un núcleo de \(Z\approx30\) a esa distancia (8.6 MeV); un protón,"),
 (r"para el mismo \(\sigma_0\) el tiempo \(t_s\) es 1.1×10\(^4\) veces mayor porque la masa lo es en 1.3×10\(^6\) (\(t_s\propto m\sigma_0^2\)). Con el grano de polvo, sin importar cuánto se espere en la escala de tiempos humana (\(t/t_s\approx10^{-14}\)) no se aprecia ensanchamiento alguno.",
  r"para el mismo \(\sigma_0\) el tiempo \(t_s\) es 1.3×10\(^6\) veces mayor, porque la masa lo es (\(t_s\propto m\sigma_0^2\)): 0.227 ns con \(\sigma_0=0.1\) nm. Con el grano de polvo, tras un segundo \(t/t_s\approx10^{-13}\) y no se aprecia ensanchamiento alguno."),
 (r"La coincidencia exacta con el valor correcto es un golpe de suerte de las constantes elegidas (\(\Delta p=\hbar/r\)); un cálculo variacional con la función de onda correcta (capítulo 14) da el mismo resultado para el estado fundamental del hidrógeno.",
  r"La coincidencia con el valor exacto depende de cómo se tome \(\Delta p\) (aquí \(\hbar/r\)): una estimación tan burda solo garantiza la escala correcta. El cálculo exacto con la ecuación de Schrödinger (capítulo 14) da el mismo valor para el estado fundamental del hidrógeno."),
 (r"La atracción coulombiana del núcleo (\(Z\sim30\)) a 5 fm es \(Ze^2/4\pi\varepsilon_0r\approx9\) MeV, menor que 39 MeV: el electrón no queda ligado.", r"La atracción coulombiana del núcleo (\(Z\sim30\)) a 5 fm es \(Ze^2/4\pi\varepsilon_0r=30\times1.44\ \text{MeV·fm}/5\ \text{fm}=8.6\) MeV, menor que 39 MeV: el electrón no queda ligado."),
]
for a, b in rep:
    assert a in s, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
