# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/32-parts.js', [
    ("    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 0.02, role: 'main' }); }\n  });",
     "    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 0.02, role: 'main' }); },\n    deadKind: 'open'\n  });"),
])
patch('src/core/33-bench.js', [
    ("      /* pines de la placa: sobrecorriente */",
     """      /* multímetros: fusible de la entrada de corriente */
      for (const mt of this.meters || []) {
        if (mt.mode !== 'A' || mt.blown) continue;
        const e = this.c.find('meter:' + mt.id);
        if (!e) continue;
        const I = Math.abs(e.i), rating = mt.jack === '10A' ? 10 : 0.2;
        if (I > rating * 1.05) {
          mt.over = (mt.over || 0) + (dt || 0.02);
          if (mt.over > 0.04) { mt.blown = true; evs.push({ part: mt.id, kind: 'fusemeter', msg: '¡Se quemó el fusible del multímetro! Por su entrada de corriente pasaron ' + (I >= 1 ? I.toFixed(1) + ' A' : (I * 1000).toFixed(0) + ' mA') + ' (el fusible aguanta ' + (rating >= 1 ? rating + ' A' : rating * 1000 + ' mA') + '). Nunca mida corriente en paralelo con una fuente.', t: this.t }); rebuild = true; }
        } else mt.over = 0;
      }
      /* pines de la placa: sobrecorriente */"""),
])
print('ok')
