# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/45-lab.js', [
    ("        if (mw < 40) { const c = (x0 + x1) / 2; x0 = c - 20; x1 = c + 20; }\n        if (mh < 26) { const c = (y0 + y1) / 2; y0 = c - 13; y1 = c + 13; }",
     "        if (mw < 58) { const c = (x0 + x1) / 2; x0 = c - 29; x1 = c + 29; }\n        if (mh < 36) { const c = (y0 + y1) / 2; y0 = c - 18; y1 = c + 18; }"),
    ("    drawSel(ctx) {\n", "    drawSel(ctx) {\n      if (this.cfg.bare) return;\n"),
])
patch('src/core/41-draw-parts.js', [
    ("const labels = (ctx, names, x0, y, color = 'rgba(255,255,255,.95)') => names.forEach((s, i) => DW.text(ctx, s, x0 + i * 2.54, y, 1.35, color, { weight: 700 }));",
     "const labels = (ctx, names, x0, y, color = 'rgba(255,255,255,.95)') => names.forEach((s, i) => DW.text(ctx, s, x0 + i * 2.54, y, 0.98, color, { weight: 700 }));"),
])
patch('src/chapters/02-componentes.js', [
    ("const cx = cv.w * 0.2, cy = cv.h * 0.5, sc = Math.min(cv.h / 14, cv.w / 40);", "const cx = cv.w * 0.2, cy = cv.h * 0.55, sc = Math.min(cv.h / 40, cv.w / 120);"),
])
print('ok')
