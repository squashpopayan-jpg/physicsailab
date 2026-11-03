# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/32-parts.js', [
    ("    label: 'Batería / pila', short: 'BAT', pinNames: ['+', '−'], power: true, props: { v: 9, rint: 1.7, cap: 0.5, name: '9 V' },",
     "    label: 'Batería / pila', short: 'BAT', pinNames: ['+', '−'], power: true, deadKind: 'open', props: { v: 9, rint: 1.7, cap: 0.5, name: '9 V' },"),
])
patch('src/core/33-bench.js', [
    ("      /* multímetros: fusible de la entrada de corriente */",
     """      /* pilas: un cortocircuito prolongado las recalienta */
      for (const p of this.scene.parts || []) {
        if (p.type !== 'BAT' || p.dead) continue;
        const e = this.c.find(p.id + ':src');
        if (e && -e.i > 2.0) {
          p.hotT = (p.hotT || 0) + (dt || 0); p.stress = Math.max(p.stress || 0, -e.i / 2); p.hot = Math.min(1.5, p.hotT / 1.5);
          if (p.hotT > 1.5) { p.dead = 'open'; evs.push({ part: p.id, kind: 'dead', msg: 'La pila se recalentó por el cortocircuito y quedó inservible. Una batería de litio, en el mismo caso, podría incendiarse.', t: this.t }); rebuild = true; }
        } else p.hotT = Math.max(0, (p.hotT || 0) - (dt || 0) * 0.5);
      }
      /* multímetros: fusible de la entrada de corriente */"""),
])
patch('src/core/41-draw-parts.js', [
    ("      const c = pins.reduce((s, q) => [s[0] + q[0] / pins.length, s[1] + q[1] / pins.length], [0, 0]);\n      v.smoke.push({ x: c[0], y: c[1], id: p.id });",
     "      const c = p._pos ? p._pos : pins.reduce((s, q) => [s[0] + q[0] / pins.length, s[1] + q[1] / pins.length], [0, 0]);\n      v.smoke.push({ x: c[0], y: c[1], id: p.id });"),
    ("    const e = v.bench.c.find(p.id + ':src');\n    const t1 = V >= 8", "    if (p.dead) { ctx.save(); ctx.translate(at[0], at[1]); ctx.fillStyle = 'rgba(20,12,6,.55)'; DW.rr(ctx, V >= 8 ? -13 : -20, V >= 8 ? -8 : -8, V >= 8 ? 26 : 40, V >= 8 ? 40 : 16, 2); ctx.fill(); ctx.restore(); }\n    const e = v.bench.c.find(p.id + ':src');\n    const t1 = V >= 8"),
])
patch('src/core/44-sch.js', [
    ("      case 'R': return p.id + '\\n' + EM.spice.fmtR(PT.val(p, 'value')).replace(' ', '\\u202f');",
     "      case 'R': return PT.val(p, 'value') >= 1e8 ? p.id + '\\n(sin carga)' : p.id + '\\n' + EM.spice.fmtR(PT.val(p, 'value')).replace(' ', '\\u202f');"),
])
print('ok')
