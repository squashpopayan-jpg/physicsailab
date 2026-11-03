# -*- coding: utf-8 -*-
p = 'src/chapters/07-activos.html'
s = open(p, encoding='utf-8').read()

def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, 1)

rep("el punto de funcionamiento cae en 9.2 mA y 1.95 V; la resistencia se queda con 3.0 V. Con 3 V y 100 Ω: 9.0 mA (la tensión del LED apenas cambia).",
    "el punto de funcionamiento cae en 9.2 mA y 1.97 V; la resistencia se queda con 3.03 V. Con 3 V y 100 Ω: 10.2 mA y 1.98 V (la tensión del LED apenas cambia aunque la fuente baje de 5 V a 3 V).")
rep("la corriente es 13.4 mA y el diodo cae solo 0.58 V; la resistencia se queda con casi toda la tensión.",
    "la corriente es 13.0 mA y el diodo cae solo 0.70 V; la resistencia se queda con casi toda la tensión.")
rep("con una señal de 5 V de pico sale un pico de unos 4.4 V.", "con una señal de 5 V de pico sale un pico de unos 4.3 V.")
rep("la resistencia de 330 Ω deja pasar unos 11.8 mA que fluyen por el Zener, y la salida es 5.1 V.",
    "la resistencia de 330 Ω deja pasar unos 11.7 mA que fluyen por el Zener, y la salida es 5.14 V.")
rep("la salida casi no se mueve (sube unos 0.06 V), porque el Zener absorbe el exceso. Bajo unos 5.5 V el Zener deja de conducir y la salida sigue a la entrada.",
    "la salida casi no se mueve (sube unos 0.03 V), porque el Zener absorbe el exceso. Por debajo de unos 5 V el Zener deja de conducir y la salida sigue a la entrada.")
rep("<li>Entre 0.6 y 0.7 V de entrada: empieza a pasar corriente de base (microamperios), la de colector crece de golpe: es la zona activa, de transición muy estrecha.</li>",
    "<li>Entre 0.6 V y 1 V de entrada: la corriente de base crece de unos 0.25 µA... a decenas de microamperios y la de colector sube de 0.08 mA a 8 mA: es la zona activa, una transición muy estrecha (solo unos 0.4 V).</li>")
rep("la corriente de base crece de unos 0.25 µA... a decenas de microamperios", "la corriente de base crece de 0.25 µA a 28 µA")
rep("Con 5 V y una resistencia de base de 10 kΩ: \\(I_B=0.43\\) mA y el transistor está en saturación (\\(V_{CE}\\approx0.1\\) V): el LED recibe \\((5-0.1-1.95)/336=8.8\\) mA, más que los 0.43 mA de entrada: ¡amplifica 20 veces!",
    "Con 5 V y una resistencia de base de 10 kΩ: \\(I_B=0.43\\) mA y el transistor está en saturación (\\(V_{CE}\\approx0.05\\) V): el LED recibe 9.0 mA, unas 21 veces más que los 0.43 mA de entrada.")
rep("<li>Con menos de 1.7 V en la compuerta no hay corriente. Con 2.5 V ya conduce un poco; con 5 V, casi 100 % de saturación: la tensión drenaje-fuente cae a decenas de milivoltios.</li>",
    "<li>Con menos de 1.7 V en la compuerta no hay corriente. A partir de 1.8 V ya conduce toda la corriente que el LED permite (9.2 mA), con una tensión drenaje-fuente de apenas 8 mV; con 5 V cae a 0.2 mV. El umbral es muy marcado.</li>")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
