p = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\37-taller.js'
s = open(p, encoding='utf8').read()
i0 = s.index("    drawCurrents(c, s) {")
i1 = s.index("  EM.Taller = {")
new = """    drawCurrents(c, s) {
      const net = this.net, doc = net.doc;
      if (!this._wc || this._wcVer !== net.version) { this._wc = this.buildWireGraph(); this._wcVer = net.version; }
      const G = this._wc; if (!G) return;
      /* corriente que entra en cada pin (sale de la red hacia el componente) */
      const inj = new Map();
      for (const P of doc.parts) {
        const pc = this.pinCurrents(P); if (!pc) continue;
        pc.forEach((cur, i) => { const q = PT.pinPos(P, i); const k = key(q[0], q[1]); inj.set(k, (inj.get(k) || 0) + cur); });
      }
      for (const comp of G.comps) {
        for (const e of comp.edges) e.flowAB = 0;
        const sub = new Map();
        for (let i = comp.order.length - 1; i >= 0; i--) {
          const u = comp.order[i];
          const t = (sub.get(u) || 0) + (inj.get(u) || 0);
          const pe = comp.parent.get(u);
          if (pe) { sub.set(pe.node, (sub.get(pe.node) || 0) + t); pe.edge.flowAB = pe.edge.ka === pe.node ? t : -t; }
        }
      }
      for (const comp of G.comps) for (const e of comp.edges) {
        const I = e.flowAB || 0; if (Math.abs(I) < 1e-7) continue;
        const [ax, ay] = e.a, [bx, by] = e.b;
        const L = Math.hypot(bx - ax, by - ay); if (!L) continue;
        const sgn = I > 0 ? 1 : -1;
        const ph = (((this.phase * 1.8 * sgn) % 1) + 1) % 1;
        const nDots = Math.max(1, Math.round(L / 0.8));
        const mag = Math.log10(Math.abs(I) * 1e3 + 1);
        c.fillStyle = `rgba(255,170,30,${Math.min(0.95, 0.4 + 0.2 * mag)})`;
        const rad = Math.min(0.2, 0.1 + 0.025 * mag);
        for (let k = 0; k < nDots; k++) {
          const t = (((k + ph) / nDots) % 1 + 1) % 1;
          c.beginPath(); c.arc(ax + (bx - ax) * t, ay + (by - ay) * t, rad, 0, Math.PI * 2); c.fill();
        }
      }
    }
    buildWireGraph() {
      const net = this.net, doc = net.doc;
      const special = [];
      for (const P of doc.parts) for (let i = 0; i < CAT[P.t].pins.length; i++) special.push(PT.pinPos(P, i));
      for (const w of doc.wires) for (const q of w.pts) special.push(q);
      const edges = [];
      for (const w of doc.wires) {
        for (let k = 1; k < w.pts.length; k++) {
          const a = w.pts[k - 1], b = w.pts[k];
          if (a[0] !== b[0] && a[1] !== b[1]) { edges.push({ a, b }); continue; }
          const vert = a[0] === b[0];
          const pts = [a, b];
          for (const [x, y] of special) {
            if ((vert && x === a[0] && y > Math.min(a[1], b[1]) && y < Math.max(a[1], b[1])) || (!vert && y === a[1] && x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0]))) if (!pts.some((q) => q[0] === x && q[1] === y)) pts.push([x, y]);
          }
          const dir = vert ? Math.sign(b[1] - a[1]) : Math.sign(b[0] - a[0]);
          pts.sort((p, q) => (vert ? (p[1] - q[1]) * dir : (p[0] - q[0]) * dir));
          for (let i = 1; i < pts.length; i++) edges.push({ a: pts[i - 1], b: pts[i] });
        }
      }
      const adj = new Map();
      for (const e of edges) {
        e.ka = key(e.a[0], e.a[1]); e.kb = key(e.b[0], e.b[1]);
        if (!adj.has(e.ka)) adj.set(e.ka, []); if (!adj.has(e.kb)) adj.set(e.kb, []);
        adj.get(e.ka).push({ to: e.kb, e }); adj.get(e.kb).push({ to: e.ka, e });
      }
      const seen = new Set(), comps = [];
      for (const start of adj.keys()) {
        if (seen.has(start)) continue;
        const comp = { root: start, edges: [], order: [start], parent: new Map() };
        const eset = new Set();
        const q = [start]; seen.add(start);
        while (q.length) {
          const u = q.shift();
          for (const { to, e } of adj.get(u)) {
            eset.add(e);
            if (!seen.has(to)) { seen.add(to); q.push(to); comp.order.push(to); comp.parent.set(to, { node: u, edge: e }); }
          }
        }
        comp.edges = [...eset];
        comps.push(comp);
      }
      return { comps };
    }
  }

"""
s = s[:i0] + new + s[i1:]
open(p, 'w', encoding='utf8').write(s)
print('ok')
