# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/chapters/03-protoboard.js', [
    ("    const reset = (s) => { const R = s.parts.find((p) => p.id === 'R1'), D = s.parts.find((p) => p.id === 'D1'); R.pins = ['h10', 'h14']; D.pins = ['g14', 'g15']; s.wires.find((w) => w.id === 'w1').a = 'T+4'; };",
     "    const reset = (s) => { const R = s.parts.find((p) => p.id === 'R1'), D = s.parts.find((p) => p.id === 'D1'); R.pins = ['h10', 'h14']; D.pins = ['g14', 'g15']; s.wires = s.wires.filter((w) => w.id === 'w1' || w.id === 'w2'); s.wires.find((w) => w.id === 'w1').a = 'T+4'; };"),
    ("        { id: 'col', label: 'LED con las dos patas en la misma columna', apply: (s) => { reset(s); s.parts.find((p) => p.id === 'D1').pins = ['g14', 'h14']; }, revert: reset },",
     "        { id: 'col', label: 'Un cable de más, en paralelo con el LED', apply: (s) => { reset(s); s.wires.push({ id: 'w3', a: 'j14', b: 'j15', color: '#2a8f3d' }); }, revert: reset },\n        { id: 'pue', label: 'Un cable de más, en paralelo con la resistencia', apply: (s) => { reset(s); s.wires.push({ id: 'w4', a: 'j10', b: 'j14', color: '#2a8f3d' }); }, revert: reset },"),
])
patch('src/chapters/03-protoboard.html', [
    ("la tensión entre los rieles es 9 V; la resistencia «gasta» unos 7 V y el LED unos 2 V, y circulan 14.5 mA.", "la tensión entre los rieles es 9 V; la resistencia «gasta» unos 7 V y el LED unos 2 V, y circulan 14.8 mA."),
    ("<li><b>LED con las dos patas en la misma columna:</b> el LED queda en cortocircuito: no enciende, su tensión es 0 V y la resistencia se queda con casi los 9 V. La corriente sube (19 mA) y la resistencia se calienta un poco.</li>",
     "<li><b>Un cable de más, en paralelo con el LED:</b> el LED queda en cortocircuito: no enciende y su tensión es 0 V. La resistencia se queda con casi los 9 V: la corriente sube a 19.1 mA y la resistencia disipa 0.17 W; se calienta, pero aguanta.</li>\n<li><b>Un cable de más, en paralelo con la resistencia:</b> la resistencia queda anulada y el LED recibe toda la tensión: pasa casi un amperio (0.89 A), unas treinta veces lo que soporta, y se quema en un instante. Es el error más caro de todos.</li>"),
    ("<li><span class=\"lvl\">Avanzado</span>Una resistencia de 470 Ω y un LED rojo (cae 2 V) se alimentan con 9 V. Si el LED se pone con las dos patas en la misma columna, ¿qué corriente circula y qué potencia disipa la resistencia? ¿Corre peligro?",
     "<li><span class=\"lvl\">Avanzado</span>Una resistencia de 470 Ω y un LED rojo se alimentan con 9 V. Por descuido se pone un cable en paralelo con el LED, que queda cortocircuitado. ¿Qué corriente circula y qué potencia disipa la resistencia? ¿Corre peligro?"),
    ("<li><b>Circuito.</b> Con el LED en cortocircuito, la resistencia queda sola entre 9 V y 0 V.</li>", "<li><b>Circuito.</b> Con el LED en cortocircuito por el cable, la resistencia queda sola entre 9 V y 0 V.</li>"),
])
print('ok')
