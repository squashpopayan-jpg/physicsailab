# -*- coding: utf-8 -*-
p = 'src/chapters/02-componentes.html'
s = open(p, encoding='utf-8').read()

def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)

rep("la LDR vale unos 1.8 kΩ, la tensión en A0 es 4.2 V (lectura 864) y el LED brilla poco, con un valor PWM de 39 sobre 255.", "la LDR vale unos 1.85 kΩ, la tensión en A0 es 4.22 V (lectura 864) y el LED brilla poco, con un valor PWM de 40 sobre 255.")
rep("A0 baja a 0.45 V (lectura 92) y el LED se enciende casi al máximo (valor 232).", "A0 baja a 0.45 V (lectura 92) y el LED se enciende casi al máximo (valor PWM 233).")
rep(r"(0.0030946-0.0033540)=-1.0247\)", r"(0.0030946-0.0033540)=-1.0249\)")
rep(r"\(R=10000\,e^{-1.0247}=3.59\) kΩ.", r"\(R=10000\,e^{-1.0249}=3.59\) kΩ.")
a = s.index('<li><span class="lvl">Avanzado</span>Un pulsador de cuatro patas')
b = s.index('</ol>', a)
s = s[:a] + '''<li><span class="lvl">Avanzado</span>Un pulsador de cuatro patas ya montado en la protoboard hace que el LED esté siempre encendido, sin pulsar. Con el multímetro en continuidad, las dos filas que el pulsador debía separar pitan entre sí. ¿Qué pasó y cómo se corrige?
<details class="sol"><summary>Solución paso a paso</summary><ol class="steps">
<li><b>Interpretación.</b> Las patas del mismo lado están unidas por dentro. Si el pulsador está girado 90°, esas patas unidas quedan una a cada lado del canal central y conectan las dos filas permanentemente.</li>
<li><b>Prueba.</b> Con continuidad, el pitido sin pulsar entre las dos filas lo confirma: el contacto está «puenteado» por dentro.</li>
<li><b>Corrección.</b> Girar el pulsador 90° para que cruce el canal con cada par interno en un lado distinto, y volver a probar: solo debe pitar mientras se presiona.</li>
<li><b>Resultado.</b> <span class="ans">El pulsador estaba girado y siempre cerrado; se gira 90° y se verifica con continuidad.</span></li></ol></details></li>
''' + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
