import re
p = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\33-parts.js'
s = open(p, encoding='utf8').read()

# --- PSU
i0 = s.index("    build(P, B) {\n      const e = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: 0.02, acmag: 0, mode: 'cv' });")
i1 = s.index("    rate: () => ({ pmax: 160, rth: 1, label: 'fuente' }), fail: 'open'\n  });")
newpsu = """    build(P, B) {
      const st = (B.rt.psu = B.rt.psu || { cc: false });
      const e = B.ref.src = B.add({ id: 'v', type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: 0.02, acmag: 0, dead: st.cc });
      const ic = B.add({ id: 'i', type: 'I', a: B.pin(1), b: B.pin(0), i: P.p.ilim, dead: !st.cc });
      B.ref.psu = st;
      B.hook((c) => {
        if (!st.cc) {
          if (-e.i > P.p.ilim * 1.0005) { st.cc = true; e.dead = true; ic.dead = false; return true; }
        } else {
          const vo = c.v(c.node(B.pin(0))) - c.v(c.node(B.pin(1)));
          if (vo > P.p.v - 1e-4) { st.cc = false; e.dead = false; ic.dead = true; return true; }
        }
        return false;
      });
    },
"""
s = s[:i0] + newpsu + s[i1:]
s = s.replace("rate: () => ({ pmax: 160, rth: 1, label: 'fuente' }), fail: 'open'\n  });", "rate: () => ({ label: 'fuente' }), fail: 'open'\n  });", 1)

# --- resistor rth
s = s.replace("rate: (P) => ({ pmax: P.p.watt, rth: 160 * 0.25 / P.p.watt * 0.5, label: 'resistor' })", "rate: (P) => ({ pmax: P.p.watt, rth: 125 / P.p.watt, label: 'resistor' })")
s = s.replace("rate: (P) => ({ pmax: P.p.watt, rth: 100, label: 'potenciómetro' })", "rate: (P) => ({ pmax: P.p.watt, rth: 125 / P.p.watt, label: 'potenciómetro' })")

# --- SCR
i0 = s.index("      const dg = B.last();\n      B.hook((c) => {\n        const ia")
i1 = s.index("    rate: (P) => ({ imax: P.p.imax * 1.6, pmax: 12, rth: 8, label: 'SCR' })")
newscr = """      B.hook((c) => {
        const dvE = c.find(P.id + ':dv'), dgE = c.find(P.id + ':dg');
        if (!dvE || !dgE) return false;
        const ig = dgE.i, iA = dvE.i;
        let on = st.on;
        if (!on && ig > P.p.igt && dvE.vab > 0.5) on = true;
        else if (on && iA < P.p.ih) on = false;
        if (on !== st.on) { st.on = on; sw.closed = on; return true; }
        return false;
      });
    },
"""
s = s[:i0] + newscr + s[i1:]

# --- TRIAC
i0 = s.index("      B.hook((c) => {\n        const vg = c.v(c.node ? 0 : 0);")
i1 = s.index("    rate: (P) => ({ imax: P.p.imax * 1.6, pmax: 12, rth: 8, label: 'triac' })")
newtr = """      B.hook((c) => {
        const g = c.find(P.id + ':rg'), a = c.find(P.id + ':da'), b = c.find(P.id + ':db');
        if (!g || !a || !b) return false;
        const ig = Math.abs(g.i), itot = Math.abs(a.i) + Math.abs(b.i);
        let on = st.on;
        if (!on && ig > P.p.igt) on = true; else if (on && itot < P.p.ih) on = false;
        if (on !== st.on) { st.on = on; sw.closed = on; sw2.closed = on; return true; }
        return false;
      });
    },
"""
s = s[:i0] + newtr + s[i1:]

# --- disipador en potencia
heat = "{ k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }"
for typ in ['NPN', 'PNP', 'NMOS', 'PMOS']:
    pass
s = s.replace("defaults: { model: 'BC547' },", "defaults: { model: 'BC547', hs: 0 },")
s = s.replace("defaults: { model: 'BC557' },", "defaults: { model: 'BC557', hs: 0 },")
s = s.replace("defaults: { model: '2N7000', vth: 2, k: 2e-3 },", "defaults: { model: '2N7000', vth: 2, k: 2e-3, hs: 0 },")
s = s.replace("defaults: { model: 'IRF9540', vth: 2, k: 1e-3 },", "defaults: { model: 'IRF9540', vth: 2, k: 1e-3, hs: 0 },")
s = s.replace("defaults: { model: '7805' },", "defaults: { model: '7805', hs: 0 },")
s = s.replace("defaults: { model: '1N4007' },\n    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.D)", "defaults: { model: '1N4007', hs: 0 },\n    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.D)")
# insertar el selector de disipador al final de props de NPN/PNP/NMOS/PMOS/REG
def add_hs(s, typ):
    i = s.index("def('%s'," % typ)
    j = s.index("    build(P, B)", i)
    seg = s[i:j]
    k = seg.rindex("],")
    seg2 = seg[:k] + ", " + heat + seg[k:]
    return s[:i] + seg2 + s[j:]
for t in ['NPN', 'PNP', 'NMOS', 'PMOS', 'REG']:
    s = add_hs(s, t)

# --- puente de falla
s = s.replace("  /* Orden de las categorías para la paleta */", """  def('JMP', {
    name: 'Puente de falla (cortocircuito)', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.2, 2, 1.2], defaults: { on: true },
    props: [{ k: 'on', label: 'Conectado (cortocircuito activo)', kind: 'bool' }],
    build(P, B) { B.ref.main = B.add({ type: 'SW', a: B.pin(0), b: B.pin(1), closed: !!P.p.on, ron: 0.005, roff: 1e12 }); },
    rate: () => ({ imax: 1e9, label: 'puente' }), fail: 'open'
  });

  /* Orden de las categorías para la paleta */""")
s = s.replace("SW: 'S', SPDT: 'S',", "SW: 'S', JMP: 'X', SPDT: 'S',")
open(p, 'w', encoding='utf8').write(s)

# --- motor: hooks con dt
p2 = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\30-spice.js'
a = open(p2, encoding='utf8').read()
a = a.replace("if (this.hooks) for (const h of this.hooks) if (h(this)) ch = true;", "if (this.hooks) for (const h of this.hooks) if (h(this, this._dt || 0)) ch = true;")
a = a.replace("      this.warn = [];\n      this.t = opts.t === undefined ? 0 : opts.t;", "      this.warn = [];\n      this._dt = 0;\n      this.t = opts.t === undefined ? 0 : opts.t;")
open(p2, 'w', encoding='utf8').write(a)
print('ok')
