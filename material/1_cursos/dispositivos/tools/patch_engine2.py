p = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\30-spice.js'
s = open(p, encoding='utf8').read()
i0 = s.index("          case 'REG': { /* a=salida")
i1 = s.index("          case 'DX': {")
new = """          case 'REG': { /* a=salida, b=entrada, c=común/ajuste */
            const sg = e.pol || 1;
            const vin = volt(e.nb), vcom = volt(e.nc), vout = volt(e.na);
            const ra = vcom + sg * e.vref, rb = vin - sg * e.vdo, eps = 0.15;
            const sq = Math.sqrt((ra - rb) * (ra - rb) + eps * eps);
            let vt, dA, dB;
            if (sg > 0) { vt = 0.5 * (ra + rb - sq); dA = 0.5 * (1 - (ra - rb) / sq); dB = 0.5 * (1 + (ra - rb) / sq); }
            else { vt = 0.5 * (ra + rb + sq); dA = 0.5 * (1 + (ra - rb) / sq); dB = 0.5 * (1 - (ra - rb) / sq); }
            const go = 1 / (e.rout || 0.05), il = e.ilim || 1.5;
            const raw = sg * (vt - vout) * go;
            let i = 0, dI = 0;
            if (raw > 0) { const th = Math.tanh(raw / il); i = il * th; dI = 1 - th * th; }
            const Jo = -go * dI, Ji = go * dI * dB, Jc = go * dI * dA, F0 = sg * i;
            const ieq = F0 - (Jo * vout + Ji * vin + Jc * vcom);
            if (e.na > 0) {
              A[(e.na - 1) * N + e.na - 1] -= Jo;
              if (e.nb > 0) A[(e.na - 1) * N + e.nb - 1] -= Ji;
              if (e.nc > 0) A[(e.na - 1) * N + e.nc - 1] -= Jc;
              bb[e.na - 1] += ieq;
            }
            if (e.nb > 0) {
              if (e.na > 0) A[(e.nb - 1) * N + e.na - 1] += Jo;
              A[(e.nb - 1) * N + e.nb - 1] += Ji;
              if (e.nc > 0) A[(e.nb - 1) * N + e.nc - 1] += Jc;
              bb[e.nb - 1] -= ieq;
            }
            const iq = sg * (e.iq || 0) * Math.min(1, Math.max(0, sg * (vin - vcom) / 3));
            if (e.nb > 0) bb[e.nb - 1] -= iq;
            if (e.nc > 0) bb[e.nc - 1] += iq;
            e.J3 = [Jo, Ji, Jc]; e.iop = F0; e.iqq = iq; e.vtg = vt;
            break;
          }
"""
s = s[:i0] + new + s[i1:]
# _finish para REG y DX
s = s.replace("          case 'E': e.i = x[nn + e.br]; break;", """          case 'E': e.i = x[nn + e.br]; break;
          case 'REG': e.i = e.iop || 0; e.vin = this.v(e.nb); e.vout = va; e.vdrop = e.vin - va; break;
          case 'DX': {
            const nVt = (e.n || 1) * e.vt;
            e.i = e.ctr * e.IsT * (expc((this.v(e.na) - this.v(e.nb)) / nVt) - 1);
            e.vcd = this.v(e.nc) - this.v(e.nd);
            break;
          }""")
s = s.replace("          case 'X': e.p = e.pw; break;", """          case 'X': e.p = e.pw; break;
          case 'REG': e.p = e.vdrop * Math.abs(e.i) + e.vin * (e.iqq ? Math.abs(e.iqq) : 0); break;
          case 'DX': e.p = e.vab * e.i + (e.vcd || 0) * e.i * 0; break;""")
open(p, 'w', encoding='utf8').write(s)

# AC
p2 = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\31-spice-ac.js'
a = open(p2, encoding='utf8').read()
i0 = a.index("        case 'X': {")
i1 = a.index("        case 'E': {")
newx = """        case 'X': {
          /* Γ = (jω L)^−1 = −j/ω · L^−1 */
          const n = e.wn.length;
          for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) {
            const gi = -e.Gm[k][j] / w, [ak, bk] = e.wn[k], [aj, bj] = e.wn[j];
            add(ak, aj, 0, gi); add(ak, bj, 0, -gi); add(bk, aj, 0, -gi); add(bk, bj, 0, gi);
          }
          break;
        }
        case 'REG': {
          const J = e.J3 || [0, 0, 0];
          const cols = [e.na, e.nb, e.nc];
          for (let m = 0; m < 3; m++) { add(e.na, cols[m], -J[m], 0); add(e.nb, cols[m], J[m], 0); }
          break;
        }
        case 'DX': {
          const gd = e.gdx || 0;
          add(e.nc, e.na, gd, 0); add(e.nc, e.nb, -gd, 0); add(e.nd, e.na, -gd, 0); add(e.nd, e.nb, gd, 0);
          break;
        }
"""
a = a[:i0] + newx + a[i1:]
open(p2, 'w', encoding='utf8').write(a)
print('ok')
