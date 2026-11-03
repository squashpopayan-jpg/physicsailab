# -*- coding: utf-8 -*-
"""Esquemas sin protoboard (redes con nombre #N), panel extra de gráficas y cajas de práctica."""
p = 'src/core/31-bb.js'
s = open(p, encoding='utf-8').read()
a = "    const i = ref.indexOf(':');\n    if (i < 0) throw new Error('referencia sin placa: ' + ref);"
assert a in s
s = s.replace(a, "    if (ref[0] === '#') return ref; /* red con nombre (esquemas sin protoboard) */\n" + a, 1)
a = "      if (r[0] === '@' && m0) return m0.id + ':' + r.slice(1);"
assert a in s
s = s.replace(a, "      if (r[0] === '#') return r;\n" + a, 1)
open(p, 'w', encoding='utf-8').write(s)

p = 'src/core/45-lab.js'
s = open(p, encoding='utf-8').read()

def rep(a, b, cnt=1):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, cnt)

rep("      this.sim = sim; this.cfg = cfg;\n      this.initScene();",
    "      this.sim = sim; this.cfg = cfg;\n      this.mode = cfg.view || (cfg.scene && cfg.scene.boards && cfg.scene.boards.length ? 'board' : 'sch');\n      this.initScene();")
rep("      this.mode = cfg.view || (cfg.scene && !(cfg.scene.boards && cfg.scene.boards.length) ? 'sch' : 'board');\n", "")
# medidores en esquema solo: usar posiciones del esquema desde el principio
rep("        if (m.red && BB.boardOf(sc, 'bb') !== undefined) { try { m.redTip = BB.worldPos(sc, m.red).slice(); } catch (e) { /* */ } }\n        if (m.black) { try { m.blackTip = BB.worldPos(sc, m.black).slice(); } catch (e) { /* */ } }\n      });",
    """        if (this.mode === 'sch' && sc.sch) { m.at = m.sat.slice(); m.redRest = m.sredRest.slice(); m.blackRest = m.sblackRest.slice(); m.redTip = m.sredTip.slice(); m.blackTip = m.sblackTip.slice(); }
        else {
          if (m.red) { try { m.redTip = BB.worldPos(sc, m.red).slice(); } catch (e) { /* */ } }
          if (m.black) { try { m.blackTip = BB.worldPos(sc, m.black).slice(); } catch (e) { /* */ } }
        }
      });""")
# panel extra
rep("      if (cfg.edit) this.buildEditUI();",
    "      if (cfg.panel) { this.pcv = sim.canvas({ aspect: cfg.panel.aspect || 3.2, parent: sim.stageCol, minH: cfg.panel.minH || '170px', label: cfg.panel.label || 'Gráfica' }); this.pcv.wrap.classList.add('lab-scope'); }\n      if (cfg.edit) this.buildEditUI();")
rep("      if (this.scv) { try { this.drawScope(); } catch (e) { console.error(e); } }\n    }",
    "      if (this.scv) { try { this.drawScope(); } catch (e) { console.error(e); } }\n      if (this.pcv) { try { EM.draw.clear(this.pcv); this.cfg.panel.draw(this, this.pcv); } catch (e) { console.error(e); } }\n    }")
open(p, 'w', encoding='utf-8').write(s)

c = open('src/styles.css', encoding='utf-8').read()
c += """
/* Recuadros propios del curso */
.box.pract { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
.box.pract::before { content: "Práctica paso a paso"; color: var(--accent); }
.box.fail { background: var(--warn-bg); border-color: color-mix(in srgb, var(--warn-ink) 30%, transparent); }
.box.fail::before { content: "Si algo sale mal"; color: var(--warn-ink); }
.box.mat { background: var(--note-bg); border-color: var(--rule); }
.box.mat::before { content: "Materiales"; color: var(--note-ink); }
.box.tip { background: var(--def-bg); border-color: color-mix(in srgb, var(--def-ink) 30%, transparent); }
.box.tip::before { content: "Dato útil"; color: var(--def-ink); }
.box.safe { background: var(--warn-bg); border-color: color-mix(in srgb, var(--warn-ink) 40%, transparent); }
.box.safe::before { content: "Seguridad"; color: var(--warn-ink); }
.box.pract ol, .box.fail ul, .box.mat ul { margin: 6px 0 0; }
.box.pract ol li { margin: 4px 0; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 10px 0; }
.tbl th, .tbl td { border: 1px solid var(--rule); padding: 5px 9px; text-align: left; vertical-align: top; }
.tbl th { background: var(--surface-2); font-weight: 700; }
.tablewrap { overflow-x: auto; }
code.k { font-family: var(--font-mono); font-size: .92em; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }
pre.code { font-family: var(--font-mono); font-size: 13px; line-height: 1.5; background: var(--canvas); border: 1px solid var(--rule); border-radius: 8px; padding: 10px 14px; overflow-x: auto; }
"""
open('src/styles.css', 'w', encoding='utf-8').write(c)
print('ok')
