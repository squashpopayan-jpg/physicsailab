# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/33-bench.js', [
    ("      const total = dt || segs.reduce((s, q) => s + q.w, 0);\n      if (!this._tranInit) { this.solve(segs.length ? segs[0].pins : {}); this._tranInit = true; }",
     "      const total = (dt === undefined || dt === null) ? segs.reduce((s, q) => s + q.w, 0) : dt;\n      if (!this._tranInit) { this.solve(segs.length ? segs[0].pins : {}); this._tranInit = true; }\n      if (!(total > 0)) { this.applyPins(segs.length ? segs[0].pins : {}); this.assess(0); return true; }"),
])
patch('src/core/41-draw-parts.js', [
    ("const vt = e ? (e.cc ? (e.vab) : e.vab) : 0, ii = e ? -e.i : 0;", "const vt = e ? e.vab : 0, ii = e ? (Math.abs(e.i) < 5e-4 ? 0 : -e.i) : 0;"),
])
patch('src/chapters/07-activos.js', [
    ("fn: (lab) => EM.si(lab.bench.c.find('Q1:main').ib, 'A', 3) }", "fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').ib) }"),
    ("fn: (lab) => EM.si(lab.bench.c.find('Q1:main').ic, 'A', 3) }", "fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').ic) }"),
    ("fn: (lab) => EM.si(lab.bench.c.find('Q1:main').i, 'A', 3) }", "fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').i) }"),
])
print('ok')
