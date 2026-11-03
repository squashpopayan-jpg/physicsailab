# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\03-minkowski.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"El viajero regresa con 6 años de edad y el gemelo terrestre con 10; el cuarto de la diferencia de 4 años se compone de dos dilataciones sucesivas y el salto de simultaneidad del giro.",
  r"El viajero regresa con 6 años de edad y el gemelo terrestre con 10. Desde el sistema del viajero, la Tierra envejece 3.6 años por dilatación y 6.4 años por el cambio de simultaneidad en el giro."),
 (r"con una aceleración centrípeta de \(10^{18}\,g\)", r"con una aceleración centrípeta del orden de \(10^{15}\,g\)"),
 (r"La línea de universo del viajero (naranja en la gráfica izquierda)", r"La línea de universo del viajero (en el color de acento, a la izquierda)"),
 (r"a Vega (25 al) 6.44", r"a Vega (25.04 al) 6.44"),
 (r"<li><b>Interpretación.</b> Distancia entre las puertas en ese sistema: \(\Delta x'=\gamma\cdot10=20\) m en el sistema de la escalera medida con los dos sucesos, pero la separación entre las puertas mide 5 m; la discrepancia se debe a que en el sistema de la escalera las puertas se han movido entre un cierre y otro (\(\beta c|\Delta t'|=0.866\times17.32=15\) m: \(20-15=5\) m).</li>",
  r"<li><b>Interpretación.</b> \(\Delta x'=\gamma(\Delta x-\beta c\Delta t)=2(10)=20\) m: la distancia entre los dos cierres es la longitud propia de la escalera (el cierre trasero ocurre en su extremo delantero y el delantero, en el trasero). Pero no son simultáneos: en los 57.8 ns que los separan el granero de 5 m se desplaza \(0.866c\times57.77\) ns \(=15\) m, y \(20-15=5\) m.</li>"),
]
for a, b in rep:
    assert a in s, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
