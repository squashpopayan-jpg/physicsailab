# -*- coding: utf-8 -*-
import re

def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/30-spice.js', [
    ("addG(e.na, e.nb, 1 / (e.closed ? (e.ron || 0.01) : (e.roff || 1e9)));", "addG(e.na, e.nb, 1 / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12)));"),
    ("case 'SW': e.i = e.vab / (e.closed ? (e.ron || 0.01) : (e.roff || 1e9)); break;", "case 'SW': e.i = e.vab / (e.closed ? (e.ron || 0.01) : (e.roff || 1e12)); break;"),
])
patch('src/core/45-lab.js', [
    ("      sim.group('Simulación');\n      sim.seg('speed',", "      const showSpeed = cfg.speeds !== false && (this.scene.mcus.length || cfg.speeds || cfg.world);\n      if (showSpeed) sim.group('Simulación');\n      if (showSpeed) sim.seg('speed',"),
    ("        m.scale = m.scale || 0.5;", "        m.scale = m.scale || (this.mode === 'sch' ? 0.44 : 0.5);"),
    ("  const sp = EM.spice;\n\n  EM.Lab = {", "  const sp = EM.spice;\n  /* formatos de lectura que evitan «7 nA» fantasmas */\n  EM.fmtI = (i) => (Math.abs(i) < 5e-9 ? '0 mA' : EM.si(i, 'A', 3));\n  EM.fmtV = (v) => (Math.abs(v) < 5e-6 ? '0 V' : EM.si(v, 'V', 3));\n  EM.fmtP = (p) => (Math.abs(p) < 5e-9 ? '0 W' : EM.si(p, 'W', 3));\n\n  EM.Lab = {"),
    ("        this.outV.set(isNaN(v) ? '—' : EM.si(v, 'V', 3));\n        this.outI.set(isNaN(v) ? '—' : EM.si(I, 'A', 3));\n        this.outP.set(isNaN(v) ? '—' : EM.si(Math.abs(v * I), 'W', 3) +", "        this.outV.set(isNaN(v) ? '—' : EM.fmtV(v));\n        this.outI.set(isNaN(v) ? '—' : EM.fmtI(I));\n        this.outP.set(isNaN(v) ? '—' : EM.fmtP(Math.abs(v * I)) +"),
])
patch('src/chapters/01-electricidad.js', [
    ("      EM.text(ctx, 'Resistencia', x1 + pw / 2 + 12, cy - 2, { size: 13, color: '--ink', weight: 700, align: 'left' });\n      EM.text(ctx, sim.p.R >= 1000 ? '1 kΩ' : Math.round(R) + ' Ω', x1 + pw / 2 + 12, cy + 14, { size: 12, color: '--ink-2', align: 'left', mono: true });",
     "      EM.text(ctx, 'Resistencia', x1 - pw / 2 - 12, cy - 2, { size: 13, color: '--ink', weight: 700, align: 'right' });\n      EM.text(ctx, sim.p.R >= 1000 ? '1 kΩ' : Math.round(R) + ' Ω', x1 - pw / 2 - 12, cy + 14, { size: 12, color: '--ink-2', align: 'right', mono: true });"),
    ("""      xs.forEach((x, i) => {
        const px = W / 2 + x * s;
        EM.draw.arrow(ctx, px, H * 0.52 + 2.4 * s + 22, px, H * 0.52 + 2.4 * s + 2, { color: '--ink-3', width: 1.2 });
        EM.text(ctx, lab[i], px, H * 0.52 + 2.4 * s + 36, { size: 12, color: '--ink-2', align: 'center' });
        EM.text(ctx, sim.p.mode === 'quiz' && !solved ? '?' : names[bands[i]], px, H * 0.52 + 2.4 * s + 52, { size: 12.5, color: '--ink', align: 'center', weight: 700 });
      });""",
     """      xs.forEach((x, i) => {
        const px = W / 2 + x * s, py = H * 0.52 + 1.5 * s, lx = W * (0.14 + 0.24 * i) + 20, ly = H * 0.52 + 2.4 * s + 40;
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 14); ctx.lineTo(lx, ly - 22); ctx.stroke();
        EM.text(ctx, lab[i], lx, ly - 8, { size: 12, color: '--ink-2', align: 'center' });
        EM.text(ctx, sim.p.mode === 'quiz' && !solved ? '?' : names[bands[i]], lx, ly + 10, { size: 13, color: '--ink', align: 'center', weight: 700 });
      });"""),
    ("meterAt: [96, 4], speeds: [[1, '1×']],", "meterAt: [96, 4],"),
])
print('ok')
