# -*- coding: utf-8 -*-
"""Añade osciloscopio y modo de edición al banco virtual (45-lab.js)."""
import sys
p = 'src/core/45-lab.js'
s = open(p, encoding='utf-8').read()

def rep(a, b, cnt=1):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, cnt)

rep("      if (cfg.code !== undefined && this.scene.mcus.length) this.buildCodePanel();",
"""      if (cfg.scope) {
        this.scv = sim.canvas({ aspect: cfg.scope.aspect || 4.2, parent: sim.stageCol, minH: '150px', label: 'Osciloscopio virtual' });
        this.scv.wrap.classList.add('lab-scope');
        this.scopeBuf = cfg.scope.channels.map(() => ({ t: [], v: [] }));
      }
      if (cfg.edit) this.buildEditUI();
      if (cfg.code !== undefined && this.scene.mcus.length) this.buildCodePanel();""")
rep("      if (this.cfg.onFrame) this.cfg.onFrame(this, vdt);",
    "      if (this.cfg.scope) this.sampleScope(vdt);\n      if (this.cfg.onFrame) this.cfg.onFrame(this, vdt);")
rep("    /* ---------------- sonido ---------------- */", """    /* ---------------- osciloscopio / graficador ---------------- */
    sampleScope(vdt) {
      const sc = this.cfg.scope, span = sc.span || 5;
      sc.channels.forEach((ch, i) => {
        const B = this.scopeBuf[i];
        let v;
        try { v = ch.fn ? ch.fn(this) : this.bench.v(ch.ref); } catch (e) { v = NaN; }
        B.t.push(this.t); B.v.push(v);
        while (B.t.length && B.t[0] < this.t - span * 1.05) { B.t.shift(); B.v.shift(); }
      });
    }
    drawScope() {
      const cv = this.scv, ctx = cv.ctx, sc = this.cfg.scope, span = sc.span || 5;
      EM.draw.clear(cv);
      const t1 = Math.max(this.t, span), t0 = t1 - span;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: t0, xmax: t1, ymin: sc.ymin === undefined ? 0 : sc.ymin, ymax: sc.ymax === undefined ? 5.5 : sc.ymax, xlabel: 'tiempo (s)', ylabel: sc.unit || 'V', ml: 46, mr: 10, mt: 12, mb: 30 });
      pl.frame();
      sc.channels.forEach((ch, i) => { const B = this.scopeBuf[i]; if (B.t.length > 1) pl.xy(B.t, B.v, { color: ch.color || ['--c1', '--c2', '--c3', '--c4'][i % 4], width: 2 }); });
      pl.legend(sc.channels.map((ch, i) => ({ label: ch.label, color: ch.color || ['--c1', '--c2', '--c3', '--c4'][i % 4] })), 'tr');
    }

    /* ---------------- modo de edición ---------------- */
    buildEditUI() {
      const sim = this.sim, cfg = this.cfg, e = cfg.edit;
      this.tool = null; this.nextId = {};
      sim.group('Construir');
      const row = el('div', 'lab-tray');
      this.trayBtns = {};
      const NAMES = { R: 'Resistencia', LED: 'LED', BTN: 'Pulsador', POT: 'Potenciómetro', LDR: 'LDR', NTC: 'Termistor', C: 'Condensador', ECAP: 'Electrolítico', D: 'Diodo', BJT: 'Transistor', NMOS: 'MOSFET', BUZ: 'Zumbador', SW: 'Interruptor', MOTOR: 'Motor' };
      const arm = (name, tool, label) => { const b = el('button', 'btn', label); b.type = 'button'; b.addEventListener('click', () => { this.tool = this.tool && this.tool.name === name ? null : Object.assign({ name }, tool); this.syncTray(); }); row.append(b); this.trayBtns[name] = b; };
      for (const t of e.tray || ['R', 'LED', 'BTN']) arm(t, { kind: 'part', type: t }, '＋ ' + (NAMES[t] || t));
      if (e.wires !== false) arm('wire', { kind: 'wire', a: null }, '＋ Cable');
      sim._parent().append(row);
      this.editMsg = sim.note('Elija una pieza y toque un agujero de la protoboard. Arrastre las patas (círculos) para moverlas.');
      sim.button('Quitar lo elegido', () => this.removeSel(), { newRow: true });
      sim.button('Quitar todo', () => { this.scene.parts = this.scene.parts.filter((p) => p.fixed); this.scene.wires = this.scene.wires.filter((w) => w.fixed); this.sel = null; this.rebuild(); });
      if (e.goal) this.outGoal = sim.out('goal', 'Objetivo', { hl: true });
    }
    syncTray() {
      for (const k in this.trayBtns) this.trayBtns[k].classList.toggle('primary', !!this.tool && this.tool.name === k);
      this.editMsg.textContent = this.tool ? (this.tool.kind === 'wire' ? 'Toque el agujero (o pin de la placa) donde empieza el cable y luego donde termina.' : 'Toque el agujero donde quiere poner la pieza.') : 'Elija una pieza y toque un agujero de la protoboard. Arrastre las patas (círculos) para moverlas.';
    }
    uid(t) {
      const pre = { R: 'R', LED: 'D', BTN: 'S', POT: 'RV', LDR: 'LDR', NTC: 'NTC', C: 'C', ECAP: 'C', D: 'D', BJT: 'Q', NMOS: 'Q', BUZ: 'BZ', SW: 'SW', MOTOR: 'M' }[t] || 'P';
      let n = 1;
      while (this.scene.parts.find((p) => p.id === pre + n)) n++;
      return pre + n;
    }
    holeRef(ref, dc) { /* desplaza un agujero principal dc columnas */
      const bd = ref.split(':')[0], h = BB.parse(ref.split(':')[1]), kind = BB.boardOf(this.scene, bd).kind;
      if (h.kind !== 'main') return null;
      const nh = h.row + (h.col + dc);
      return BB.valid(kind, nh) ? bd + ':' + nh : null;
    }
    placePart(type, ref) {
      const spec = { R: [0, 4], LED: [0, 1], D: [0, 3], C: [0, 2], ECAP: [0, 2], BUZ: [0, 2], SW: [0, 2], LDR: [0, 3], NTC: [0, 2], POT: [0, 1, 2], BJT: [0, 1, 2], NMOS: [0, 1, 2] }[type];
      let pins;
      if (type === 'BTN') {
        const bd = ref.split(':')[0], h = BB.parse(ref.split(':')[1]);
        if (h.kind !== 'main') { this.editMsg.textContent = 'Ponga el pulsador sobre el canal central de la protoboard.'; return; }
        pins = [bd + ':f' + h.col, bd + ':f' + (h.col + 2), bd + ':e' + h.col, bd + ':e' + (h.col + 2)];
      } else if (spec) {
        pins = spec.map((d) => this.holeRef(ref, d) || this.holeRef(ref, -d));
      } else return;
      if (pins.some((q) => !q)) { this.editMsg.textContent = 'Esa posición no es válida; pruebe en otro agujero.'; return; }
      const p = { id: this.uid(type), type, pins };
      if (type === 'R') p.value = (this.cfg.edit.rvalue || 330);
      if (type === 'LED') p.color = 'rojo';
      if (type === 'POT') p.pos = 0.5;
      this.scene.parts.push(p);
      this.sel = p.id; this.tool = null; this.syncTray(); this.rebuild();
    }
    removeSel() {
      if (!this.sel) return;
      this.scene.parts = this.scene.parts.filter((p) => p.id !== this.sel || p.fixed);
      this.scene.wires = this.scene.wires.filter((w) => w.id !== this.sel || w.fixed);
      this.sel = null; this.rebuild();
    }
    evalGoal() {
      const g = this.cfg.edit && this.cfg.edit.goal;
      if (!g || !this.outGoal) return;
      let r; try { r = g(this); } catch (e) { r = { ok: false, msg: 'Aún no hay nada que evaluar.' }; }
      this.outGoal.set((r.ok ? '<span class="ok">✔ ' : '') + esc(r.msg) + (r.ok ? '</span>' : ''));
    }

    /* ---------------- sonido ---------------- */""")
rep("      this.hit = v.hit.concat(this.partHits || []);\n      this.partHits = [];\n    }",
    "      this.hit = (this.editHits || []).concat(v.hit, this.partHits || []);\n      this.partHits = [];\n      if (this.scv) { try { this.drawScope(); } catch (e) { console.error(e); } }\n    }")
rep("      /* resaltado de agujero cercano a una punta */", """      this.editHits = [];
      if (this.cfg.edit && this.mode !== 'sch') {
        ctx.save();
        for (const p of sc.parts) if (!p.fixed) p.pins.forEach((r, k) => { if (!r) return; const q = BB.worldPos(sc, r); ctx.beginPath(); ctx.arc(q[0], q[1], 1.15, 0, Math.PI * 2); ctx.strokeStyle = this.sel === p.id ? 'rgba(255,170,0,.95)' : 'rgba(40,120,255,.7)'; ctx.lineWidth = 0.3; ctx.stroke(); this.editHits.push({ kind: 'pin', id: p.id, k, x: q[0], y: q[1], r: 1.7 }); });
        for (const w of sc.wires) if (!w.fixed) for (const end of ['a', 'b']) { const q = BB.worldPos(sc, w[end]); ctx.beginPath(); ctx.arc(q[0], q[1], 1.25, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(40,120,255,.8)'; ctx.lineWidth = 0.3; ctx.stroke(); this.editHits.push({ kind: 'wend', id: w.id, end, x: q[0], y: q[1], r: 1.8 }); }
        if (this.tool && this.tool.kind === 'wire' && this.tool.a) { const q = BB.worldPos(sc, this.tool.a); ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,170,0,.95)'; ctx.lineWidth = 0.4; ctx.stroke(); }
        ctx.restore();
      }
      /* resaltado de agujero cercano a una punta */""")
rep("          const h = this.findHit(wx, wy);\n          if (!h) { drag = { kind: 'pan', x, y, pan: this.pan.slice() }; return drag; }\n          const sc = this.scene;",
"""          const sc = this.scene;
          if (this.cfg.edit && this.tool) {
            const hole = this.nearestHole(wx, wy);
            if (hole) {
              if (this.tool.kind === 'part') this.placePart(this.tool.type, hole.ref);
              else if (this.tool.kind === 'wire') {
                if (!this.tool.a) { this.tool.a = hole.ref; this.sim.redraw(); }
                else if (this.tool.a !== hole.ref) { sc.wires.push({ id: 'w' + (Date.now() % 100000), a: this.tool.a, b: hole.ref }); this.tool = null; this.syncTray(); this.rebuild(); }
              }
            }
            return { kind: 'tool' };
          }
          const h = this.findHit(wx, wy);
          if (!h) { drag = { kind: 'pan', x, y, pan: this.pan.slice() }; return drag; }
          if (h.kind === 'pin') { this.sel = h.id; drag = { kind: 'pin', id: h.id, k: h.k }; return drag; }
          if (h.kind === 'wend') { drag = { kind: 'wend', id: h.id, end: h.end }; return drag; }""")
rep("          else if (d.kind === 'probe') this.dragProbe(d, wx, wy);\n        },", """          else if (d.kind === 'probe') this.dragProbe(d, wx, wy);
          else if (d.kind === 'pin' || d.kind === 'wend') { this.snapHole = this.nearestHole(wx, wy); this.sim.redraw(); }
        },""")
rep("          if (d.kind === 'probe') this.dropProbe(d);\n        },", """          if (d.kind === 'probe') this.dropProbe(d);
          if (d.kind === 'pin' || d.kind === 'wend') {
            const h = this.snapHole; this.snapHole = null;
            if (h) {
              if (d.kind === 'pin') { const p = this.scene.parts.find((q) => q.id === d.id); if (p) p.pins[d.k] = h.ref; }
              else { const w = this.scene.wires.find((q) => q.id === d.id); if (w) w[d.end] = h.ref; }
              this.rebuild();
            }
          }
        },""")
rep("      if (this.outT) this.outT.set(", "      this.evalGoal();\n      if (this.outT) this.outT.set(")
open(p, 'w', encoding='utf-8').write(s)

c = open('src/styles.css', encoding='utf-8').read()
c += """
.lab-tray { display: flex; flex-wrap: wrap; gap: 6px; }
.lab-tray .btn { font-size: 12.5px; padding: 5px 10px; }
.sim-out .ok { color: var(--equip); font-weight: 700; }
.lab-scope { border-top: 1px solid var(--rule); }
"""
open('src/styles.css', 'w', encoding='utf-8').write(c)
print('ok')
