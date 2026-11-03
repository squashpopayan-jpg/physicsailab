# -*- coding: utf-8 -*-
p = 'src/chapters/16-temperatura.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)
rep("A 0 °C vale 33.6 kΩ y la lectura baja a 236.", "A 0 °C vale 33.6 kΩ y la lectura baja a 234.")
rep("cada grado cambia la lectura en unas 19 cuentas; a 80 °C solo unas 8:", "cada grado cambia la lectura en unas 11 cuentas; a 80 °C solo unas 3:")
rep("→ 235.</li>", "→ 234.</li>")
rep("753 a 50 °C y 235 a 0 °C.", "753 a 50 °C y 234 a 0 °C.")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
