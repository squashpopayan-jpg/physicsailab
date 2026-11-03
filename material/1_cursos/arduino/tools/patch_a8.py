# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/44-sch.js', [
    ("      w.forEach((tok, i) => {\n        if (typeof tok === 'string') {",
     "      let sumTok = null;\n      w.forEach((tok, i) => {\n        if (tok && !Array.isArray(tok) && typeof tok === 'object') { sumTok = tok; return; }\n        if (typeof tok === 'string') {"),
    ("      if (first && sc.parts.find((q) => q.id === first.id)) {",
     "      if (sumTok) {\n        const list = sumTok.in || sumTok.out || [];\n        let tot = 0;\n        for (const t of list) { const [id, k] = t.split('.'); const p = sc.parts.find((q) => q.id === id); if (p) tot += SCH.termI(bench, p, +k); }\n        I = sumTok.out ? -tot : tot;\n        const f = list[0] && list[0].split('.'); const p0 = f && sc.parts.find((q) => q.id === f[0]); ref = p0 ? p0.pins[+f[1]] : null;\n      } else if (first && sc.parts.find((q) => q.id === first.id)) {"),
])
print('ok')
