# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/45-lab.js', [
    # explorar: resaltar la tira del agujero señalado
    ("          if (id !== this.hover) { this.hover = id; this.showTip(id, x, y); this.sim.redraw(); } else if (id) this.showTip(id, x, y);",
     "          if (this.cfg.explore) { const hh = this.nearestHole(wx, wy); const key = hh ? hh.ref : null; if (key !== (this.exploreHole && this.exploreHole.ref)) { this.exploreHole = hh; this.updateOuts(); this.sim.redraw(); } }\n          if (id !== this.hover) { this.hover = id; this.showTip(id, x, y); this.sim.redraw(); } else if (id) this.showTip(id, x, y);"),
    ("      /* multímetros */\n      this.meterTexts = [];",
     """      /* tira señalada y marcadores */
      if (this.exploreHole && this.mode !== 'sch') { const [bid, h] = this.exploreHole.ref.split(':'); const bd = BB.boardOf(sc, bid); if (bd) DW.hiliteStrip(ctx, bd, h, 'rgba(255,170,0,.4)'); }
      for (const mk of this.markers || []) {
        try {
          const q = BB.worldPos(sc, mk.ref);
          ctx.save(); ctx.strokeStyle = mk.color || '#e8590c'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(q[0], q[1], 2.0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = mk.color || '#e8590c'; DW.rr(ctx, q[0] - 2.3, q[1] - 7.3, 4.6, 4.2, 1); ctx.fill(); ctx.restore();
          DW.text(ctx, mk.text || '', q[0], q[1] - 5.1, 2.8, '#fff', { weight: 800 });
        } catch (e) { /* */ }
      }
      /* multímetros */
      this.meterTexts = [];"""),
    ("    findHit(wx, wy) {", """    describeHole(ref) {
      const [bid, h] = ref.split(':'), bd = BB.boardOf(this.scene, bid), p = BB.parse(h);
      if (!bd || !p) return ref;
      if (p.kind === 'main') {
        const top = ['j', 'i', 'h', 'g', 'f'].includes(p.row), rows = top ? ['j', 'i', 'h', 'g', 'f'] : ['e', 'd', 'c', 'b', 'a'];
        return `<b>${h}</b>: columna ${p.col}, mitad ${top ? 'superior (f–j)' : 'inferior (a–e)'}. Conectado con ` + rows.filter((r) => r !== p.row).map((r) => r + p.col).join(', ') + '.';
      }
      return `<b>${h}</b>: riel ${p.pol === '+' ? 'positivo (+)' : 'negativo (−)'} ${p.side === 'T' ? 'superior' : 'inferior'}. Conectado con todos los agujeros de su riel.`;
    }
    findHit(wx, wy) {"""),
])
print('ok')
