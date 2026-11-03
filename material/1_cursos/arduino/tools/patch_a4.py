# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/45-lab.js', [
    ("      if (this.cfg.focusParts && sc.parts.length) {\n        for (const p of sc.parts) {",
     "      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;\n      const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };\n      if (this.cfg.focusParts && sc.parts.length) {\n        for (const p of sc.parts) {"),
    ("      if (this.cfg.focus) return this.cfg.focus.slice();\n      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;\n      const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };\n",
     "      if (this.cfg.focus) return this.cfg.focus.slice();\n"),
    ("    reload() {\n      this.bench = new EM.Bench(this.scene, this.cfg.bench || {});",
     "    reload() {\n      this.scene._norm = false;\n      this.bench = new EM.Bench(this.scene, this.cfg.bench || {});"),
])
print('ok')
