# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/33-bench.js', [
    ("      this.partById = {};\n", "      this.partById = {};\n      this._lim = null;\n"),
    ("    frame(segs, dt) {\n      if (this.dirty) this.build();",
     "    /* firma de los parámetros que se «estampan» al construir; si cambia, se reconstruye conservando la carga de los condensadores */\n    partSig() { let s = ''; for (const p of this.scene.parts || []) s += p.id + '|' + (p.value === undefined ? '' : p.value) + '|' + (p.color || '') + '|' + (p.model || '') + '|' + (p.vz || '') + '|' + (p.drift || '') + '|' + (p.dead ? 1 : 0) + ';'; return s; }\n    rebuildKeep() {\n      const old = new Map(this.c.els.filter((e) => e.type === 'C' || e.type === 'L').map((e) => [e.id, { vprev: e.vprev, iprev: e.iprev }]));\n      this.scene._norm = false;\n      this.build();\n      for (const e of this.c.els) { const o = old.get(e.id); if (o) { e.vprev = o.vprev; e.iprev = o.iprev; } }\n      this._tranInit = old.size > 0;\n    }\n    frame(segs, dt) {\n      if (this.dirty) this.build();\n      const sg = this.partSig();\n      if (this._sig !== undefined && sg !== this._sig) { this._sig = sg; this.rebuildKeep(); } else this._sig = sg;"),
])
patch('src/chapters/06-fallos.html', [("<li><b>Pila de 9 V:</b> en corto circulan 5.2 A;", "<li><b>Pila de 9 V:</b> en corto circulan 5.3 A;")])
patch('src/chapters/06-fallos.js', [("    sim.lab.scene.parts[1].value = 47000; sim.lab.rebuild();\n", "")])
print('ok')
