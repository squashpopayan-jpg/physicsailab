# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/33-bench.js', [
    ("    modPower(p) {\n", "    modPower(p) {\n      if (p.forcePower && !p.dead) return { v: p.forcePower, ok: true };\n"),
])
patch('src/core/45-lab.js', [
    ("      sim.resetButton(() => this.reset());\n      this.refresh();", "      sim.resetButton(() => this.reset());\n      if (cfg.onReady) cfg.onReady(this);\n      this.refresh();"),
])
patch('src/chapters/02-componentes.js', [
    ("      aspect: 1.9, scene, bare: true, focusParts: true, below: true, hint: 'Elija una pieza en la lista.", "      onReady: () => { ['lux', 'temp', 'color'].forEach((c) => { if (sim.ctl[c]) sim.ctl[c].show(cur.ctl === c); }); },\n      aspect: 1.9, scene, bare: true, focusParts: true, below: true, hint: 'Elija una pieza en la lista."),
    ("    sim.legend && 0;\n", ""),
])
print('ok')
