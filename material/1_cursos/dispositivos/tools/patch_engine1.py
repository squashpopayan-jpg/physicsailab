import re
p = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\30-spice.js'
s = open(p, encoding='utf8').read()

# ---- add(): ventanas de transformador
s = s.replace("""      for (const k of ['a', 'b', 'c', 'd', 'e']) if (el[k] !== undefined) el['n' + k] = this.node(el[k]);
      if (!el.id)""", """      if (el.W) { el.wn = el.W.map((q) => [this.node(q[0]), this.node(q[1])]); if (el.a === undefined) { el.a = el.W[0][0]; el.b = el.W[0][1]; } }
      for (const k of ['a', 'b', 'c', 'd', 'e']) if (el[k] !== undefined) el['n' + k] = this.node(el[k]);
      if (!el.id)""")

# ---- compile: flags y matriz del transformador
s = s.replace("""if (e.type === 'D' || e.type === 'Q' || e.type === 'M' || e.type === 'OA') this.hasNL = true;""",
"""if (e.type === 'D' || e.type === 'Q' || e.type === 'M' || e.type === 'OA' || e.type === 'REG' || e.type === 'DX') this.hasNL = true;""")
s = s.replace("""        if (e.type === 'D' || e.type === 'Q') this.refreshTemp(e);
        e.vj = e.vj || [0, 0];""", """        if (e.type === 'D' || e.type === 'Q' || e.type === 'DX') this.refreshTemp(e);
        if (e.type === 'X') this._xmat(e);
        e.vj = e.vj || [0, 0];""")
s = s.replace("""      if (e.type === 'D') {
        const n = e.n || 1;""", """      if (e.type === 'D' || e.type === 'DX') {
        const n = e.n || 1;""")

# ---- método _xmat antes de compile()
s = s.replace("    compile() {", """    /* matriz de inductancias del transformador y su inversa */
    _xmat(e) {
      const n = e.wn.length, L = [];
      for (let i = 0; i < n; i++) { L.push([]); for (let j = 0; j < n; j++) L[i].push(i === j ? e.ls[i] : e.k * Math.sqrt(e.ls[i] * e.ls[j])); }
      /* inversa por Gauss–Jordan */
      const M = L.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
      for (let k = 0; k < n; k++) {
        let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
        [M[k], M[p]] = [M[p], M[k]];
        const d = M[k][k];
        for (let j = 0; j < 2 * n; j++) M[k][j] /= d;
        for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j]; }
      }
      e.Gm = M.map((r) => r.slice(n));
      e.iw = e.iw || new Array(n).fill(0); e.vw = e.vw || new Array(n).fill(0);
      e.hw = new Array(n).fill(0); e.Gw = null;
    }

    compile() {""")

# ---- estampa L con saturación
s = s.replace("""          case 'L': {
            const em = e.emf || 0;
            if (mode === 'tran') {
              const trap = method === 'trap';
              const g = trap ? dt / (2 * e.l) : dt / e.l;""", """          case 'L': {
            const em = e.emf || 0;
            if (mode === 'tran') {
              const trap = method === 'trap';
              const lh = e.lsat ? e.l / (1 + (e.iprev / e.lsat) ** 2) : e.l;
              e.lh = lh;
              const g = trap ? dt / (2 * lh) : dt / lh;""")
s = s.replace("""          const g = trap ? dt / (2 * e.l) : dt / e.l;
          const i = e.iprev + g * (v - em) + (trap ? g * (e.vprev - em) : 0);""", """          const lh = e.lh || e.l;
          const g = trap ? dt / (2 * lh) : dt / lh;
          const i = e.iprev + g * (v - em) + (trap ? g * (e.vprev - em) : 0);""")

# ---- transformador general (estampa)
i0 = s.index("          case 'X': { /* transformador: nodos a,b")
i1 = s.index("          case 'E': { /* a,b salida")
newX = """          case 'X': { /* transformador de n devanados: e.wn = [[a,b],...] */
            const n = e.wn.length;
            let Gw;
            if (mode === 'tran') {
              const f = method === 'trap' ? dt / 2 : dt, trap = method === 'trap';
              Gw = e.Gm.map((r) => r.map((g) => g * f));
              for (let k = 0; k < n; k++) {
                let h = e.iw[k];
                if (trap) for (let j = 0; j < n; j++) h += Gw[k][j] * e.vw[j];
                e.hw[k] = h;
                addI(e.wn[k][0], e.wn[k][1], -h);
              }
            } else {
              Gw = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 / (e.rdc ? e.rdc[i] : 1e-3) : 0)));
            }
            e.Gw = Gw;
            for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) {
              const g = Gw[k][j], [ak, bk] = e.wn[k], [aj, bj] = e.wn[j];
              if (ak > 0) { if (aj > 0) A[(ak - 1) * N + aj - 1] += g; if (bj > 0) A[(ak - 1) * N + bj - 1] -= g; }
              if (bk > 0) { if (aj > 0) A[(bk - 1) * N + aj - 1] -= g; if (bj > 0) A[(bk - 1) * N + bj - 1] += g; }
            }
            break;
          }
"""
s = s[:i0] + newX + s[i1:]

# ---- advance del transformador
i0 = s.index("        } else if (e.type === 'X') {\n          const v1 =")
i1 = s.index("        } else if (e.type === 'OA') e.y = e.yc;\n      }\n    }\n\n    /* Calcula")
newA = """        } else if (e.type === 'X') {
          const n = e.wn.length, vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
          const ni = [];
          for (let k = 0; k < n; k++) { let i = e.hw[k]; for (let j = 0; j < n; j++) i += e.Gw[k][j] * vw[j]; ni.push(i); }
          e.iw = ni; e.vw = vw;
"""
s = s[:i0] + newA + s[i1:]

# ---- _finish del transformador
s = s.replace("          case 'X': e.i = e.i1; e.vcd = this.v(e.nc) - this.v(e.nd); break;", """          case 'X': {
            const vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
            const n = vw.length, cur = [];
            for (let k = 0; k < n; k++) { let i = e.Gw ? e.hw[k] : 0; if (e.Gw) for (let j = 0; j < n; j++) i += e.Gw[k][j] * vw[j]; cur.push(i); }
            e.iw = cur; e.vw = vw; e.i = cur[0]; e.pw = vw.reduce((s, v, k) => s + v * cur[k], 0);
            break;
          }""")
s = s.replace("          case 'X': e.p = e.vab * e.i1 + e.vcd * e.i2; break;", "          case 'X': e.p = e.pw; break;")
s = s.replace("""        if (e.type === 'X') {
          const v1 = this.v(e.na) - this.v(e.nb), v2 = this.v(e.nc) - this.v(e.nd);
          e.v1p = v1; e.v2p = v2; e.i1 = v1 / (e.r1 || 1e-3); e.i2 = v2 / (e.r2 || 1e-3);
        }""", """        if (e.type === 'X') {
          e.vw = e.wn.map(([a, b]) => this.v(a) - this.v(b));
          e.iw = e.vw.map((v, k) => v / (e.rdc ? e.rdc[k] : 1e-3));
        }""")
s = s.replace("[e.vprev, e.iprev, e.v1p, e.v2p, e.i1, e.i2, e.y, e.vj && e.vj.slice()]", "[e.vprev, e.iprev, e.vw && e.vw.slice(), e.iw && e.iw.slice(), e.y, e.vj && e.vj.slice()]")
s = s.replace("[e.vprev, e.iprev, e.v1p, e.v2p, e.i1, e.i2, e.y] = s.st[k]; if (s.st[k][7]) e.vj = s.st[k][7];", "[e.vprev, e.iprev, e.vw, e.iw, e.y] = s.st[k]; if (s.st[k][5]) e.vj = s.st[k][5];")

# ---- OA colector abierto
s = s.replace("""            const go = 1 / (e.rout || 75);
            const k = sl * dy;
            if (e.na > 0) {""", """            const go = 1 / (e.rout || 75);
            const k = sl * dy;
            let oc = false;
            if (e.oc) { const ioc = go * (vo - volt(e.na)); if (ioc > 0) oc = true; }
            if (e.na > 0 && !oc) {""")

# ---- REG y DX antes de OA
i0 = s.index("          case 'OA': { /* a=salida")
newR = """          case 'REG': { /* a=salida, b=entrada, c=común/ajuste */
            const pol = e.pol || 1;
            const vin = volt(e.nb), vcom = volt(e.nc), vout = volt(e.na);
            const ra = vcom + pol * e.vref, rb = vin - pol * e.vdo, eps = 0.15;
            const sq = Math.sqrt((ra - rb) * (ra - rb) + eps * eps);
            let vt, dA, dB;
            if (pol > 0) { vt = 0.5 * (ra + rb - sq); dA = 0.5 * (1 - (ra - rb) / sq); dB = 0.5 * (1 + (ra - rb) / sq); }
            else { vt = 0.5 * (ra + rb + sq); dA = 0.5 * (1 + (ra - rb) / sq); dB = 0.5 * (1 - (ra - rb) / sq); }
            const go = 1 / (e.rout || 0.05);
            let raw = pol * (vt - vout) * go * pol; /* corriente hacia la salida, positiva cuando alimenta la carga */
            raw = pol > 0 ? (vt - vout) * go : (vout - vt) * go;
            const il = e.ilim || 1.5;
            let i = 0, dI = 0;
            if (raw > 0) { const th = Math.tanh(raw / il); i = il * th; dI = 1 - th * th; }
            /* i hacia la carga (sale por 'out' hacia el circuito). pol>0: sale de out. */
            const sg = pol > 0 ? 1 : -1;
            /* derivadas de i respecto a vout, vin, vcom */
            const dv_out = dI * (-go) * sg * sg, dv_in = dI * go * sg * dB * sg, dv_com = dI * go * sg * dA * sg;
            /* inyección en el nodo out: +sg·i ; extracción en el nodo in: sg·i ; constante: i0 − Σ dv·v */
            const i0 = sg * i, c_out = sg * dv_out, c_in = sg * dv_in, c_com = sg * dv_com;
            const ieq = i0 - c_out * vout - c_in * vin - c_com * vcom;
            /* nodo out: -(corriente que sale hacia la carga) → inyección en el nodo: +i0 */
            if (e.na > 0) {
              if (e.na > 0) A[(e.na - 1) * N + e.na - 1] -= c_out;
              if (e.nb > 0) A[(e.na - 1) * N + e.nb - 1] -= c_in;
              if (e.nc > 0) A[(e.na - 1) * N + e.nc - 1] -= c_com;
              bb[e.na - 1] += ieq;
            }
            if (e.nb > 0) {
              A[(e.nb - 1) * N + e.na - 1 + 0] += (e.na > 0 ? c_out : 0);
              A[(e.nb - 1) * N + e.nb - 1] += c_in;
              if (e.nc > 0) A[(e.nb - 1) * N + e.nc - 1] += c_com;
              bb[e.nb - 1] -= ieq;
            }
            /* corriente de reposo Iq de IN a COM */
            const iq = (e.iq || 0) * Math.min(1, Math.max(0, (vin - vcom) / 3));
            if (e.nb > 0) bb[e.nb - 1] -= iq;
            if (e.nc > 0) bb[e.nc - 1] += iq;
            e.gout = -c_out; e.dvin = c_in; e.dvcom = c_com; e.iop = i0; e.iqq = iq;
            break;
          }
          case 'DX': { /* a,b control (ánodo, cátodo del LED); corriente ctr·Id de c hacia d */
            const nVt = (e.n || 1) * e.vt;
            const v0 = volt(e.na) - volt(e.nb);
            const vl = pnjlim(v0, e.vj[0], nVt, e.vcrit);
            e.vj[0] = vl;
            const ex = expc(vl / nVt);
            const id = e.ctr * e.IsT * (ex - 1), gd = e.ctr * (e.IsT / nVt) * ex;
            const ieq = id - gd * vl;
            const rowC = (r, sg) => { if (r > 0) { if (e.na > 0) A[(r - 1) * N + e.na - 1] += sg * gd; if (e.nb > 0) A[(r - 1) * N + e.nb - 1] -= sg * gd; bb[r - 1] -= sg * ieq; } };
            rowC(e.nc, 1); rowC(e.nd, -1);
            e.gdx = gd;
            break;
          }
"""
s = s[:i0] + newR + s[i0:]
open(p, 'w', encoding='utf8').write(s)
print('ok')
