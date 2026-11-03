# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/44-sch.js', [
    ("  SCH.termLocal = (p, k) =>", "  SCH.symbol = (ctx, p, cx, cy, scale) => { const f = SYM[p.type]; if (!f) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.strokeStyle = EM.col('--ink'); ctx.fillStyle = EM.col('--ink'); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; f(ctx, p); ctx.restore(); };\n  SCH.termLocal = (p, k) =>"),
])
patch('src/core/45-lab.js', [
    ("      if (this.cfg.focus) return this.cfg.focus.slice();",
     """      if (this.cfg.focusParts && sc.parts.length) {
        for (const p of sc.parts) {
          const d = PT[p.type], q = p.pins.filter(Boolean).map((r) => BB.worldPos(sc, r));
          q.forEach((a) => { add(a[0] - 8, a[1] - 11); add(a[0] + 8, a[1] + 8); });
          if (d.module && q.length) { const lay = DW.MOD[p.type] || DW.MOD.GENERIC; add(q[0][0] - 4, q[0][1] - lay.h - 2); add(q[0][0] + lay.w + 2, q[0][1] + 6); }
          if (p.at) { add(p.at[0] - 18, p.at[1] - 24); add(p.at[0] + 18, p.at[1] + 16); }
        }
        const mw = x1 - x0, mh = y1 - y0;
        if (mw < 40) { const c = (x0 + x1) / 2; x0 = c - 20; x1 = c + 20; }
        if (mh < 26) { const c = (y0 + y1) / 2; y0 = c - 13; y1 = c + 13; }
        return [x0, y0, x1, y1];
      }
      if (this.cfg.focus) return this.cfg.focus.slice();"""),
    ("      sim.group('Vista');\n", "      if (!cfg.bare) sim.group('Vista');\n"),
    ("      if (this.scene.sch && this.scene.boards.length) sim.seg(", "      if (!cfg.bare && this.scene.sch && this.scene.boards.length) sim.seg("),
    ("      sim.check('flow', {", "      if (!cfg.bare) sim.check('flow', {"),
    ("      sim.check('volt', {", "      if (!cfg.bare) sim.check('volt', {"),
    ("      sim.check('labels', {", "      if (!cfg.bare) sim.check('labels', {"),
    ("      this.outSel = sim.out('sel', 'Pieza elegida', { hl: true });\n      this.outV = sim.out('v', 'Tensión entre sus terminales');\n      this.outI = sim.out('i', 'Corriente que la atraviesa');\n      this.outP = sim.out('p', 'Potencia que consume');",
     "      if (!cfg.bare) { this.outSel = sim.out('sel', 'Pieza elegida', { hl: true });\n      this.outV = sim.out('v', 'Tensión entre sus terminales');\n      this.outI = sim.out('i', 'Corriente que la atraviesa');\n      this.outP = sim.out('p', 'Potencia que consume'); }"),
    ("      if (this.scene.meters.length) { this.outM", "      if (!cfg.bare && this.scene.meters.length) { this.outM"),
    ("      this.outT = sim.out('t', 'Tiempo simulado');", "      if (!cfg.bare) this.outT = sim.out('t', 'Tiempo simulado');"),
    ("      const p = this.sel ? sc.parts.find((q) => q.id === this.sel) : null;\n      if (p) {", "      const p = this.sel ? sc.parts.find((q) => q.id === this.sel) : null;\n      if (!this.outSel) { /* sin panel de pieza */ }\n      else if (p) {"),
    ("      if (this.outT) this.outT.set(", "      if (this.outT) this.outT.set("),
    ("    showTip(id, x, y) {\n      if (!id) {", "    showTip(id, x, y) {\n      if (this.cfg.noTip) { this.tipEl.hidden = true; return; }\n      if (!id) {"),
])
print('ok')

# --- MOSFET: orden físico de patas G, D, S (TO-220) ---
patch('src/core/32-parts.js', [
    ("label: 'MOSFET de canal N', short: 'Q', pins: 3, pinNames: ['D', 'G', 'S'], props: { model: 'IRLZ44N' },\n    expand(p, c) { const m = sp.MOSFETS[val(p, 'model')] || sp.MOSFETS.IRLZ44N; c.add({ type: 'M', a: c.node(p, 0), b: c.node(p, 1), c: c.node(p, 2),",
     "label: 'MOSFET de canal N', short: 'Q', pins: 3, pinNames: ['G', 'D', 'S'], props: { model: 'IRLZ44N' },\n    expand(p, c) { const m = sp.MOSFETS[val(p, 'model')] || sp.MOSFETS.IRLZ44N; c.add({ type: 'M', a: c.node(p, 1), b: c.node(p, 0), c: c.node(p, 2),"),
])
patch('src/core/44-sch.js', [
    ("BJT: [[2, -2], [-2, 0], [2, 2]], NMOS: [[2, -2], [-2, 0], [2, 2]],", "BJT: [[2, -2], [-2, 0], [2, 2]], NMOS: [[-2, 0], [2, -2], [2, 2]],"),
    ("case 'NMOS': { const q = e('main'); return k === 0 ? q.i : k === 1 ? 0 : -q.i; }", "case 'NMOS': { const q = e('main'); return k === 1 ? q.i : k === 0 ? 0 : -q.i; }"),
])
print('mos ok')
