p = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\30-spice.js'
s = open(p, encoding='utf8').read()

# compile: rama para REG
s = s.replace("if ((e.type === 'V' && !(e.rs > 0)) || e.type === 'E') e.br = this.nbr++;", "if ((e.type === 'V' && !(e.rs > 0)) || e.type === 'E' || e.type === 'REG') e.br = this.nbr++;\n        if (e.type === 'REG' && !e.mode) e.mode = 'cv';")

# nuevo estampado REG
i0 = s.index("          case 'REG': { /* a=salida")
i1 = s.index("          case 'DX': {")
new = """          case 'REG': { /* a=salida, b=entrada, c=común/ajuste. Rama: corriente inyectada en la salida */
            const sg = e.pol || 1, k = nn + e.br;
            const vin = volt(e.nb), vcom = volt(e.nc);
            const ra = vcom + sg * e.vref, rb = vin - sg * e.vdo, eps = 0.15;
            const sq = Math.sqrt((ra - rb) * (ra - rb) + eps * eps);
            let vt, dA, dB;
            if (sg > 0) { vt = 0.5 * (ra + rb - sq); dA = 0.5 * (1 - (ra - rb) / sq); dB = 0.5 * (1 + (ra - rb) / sq); }
            else { vt = 0.5 * (ra + rb + sq); dA = 0.5 * (1 + (ra - rb) / sq); dB = 0.5 * (1 - (ra - rb) / sq); }
            if (e.na > 0) A[(e.na - 1) * N + k] -= 1;
            if (e.nb > 0) A[(e.nb - 1) * N + k] += 1;
            const mode = e.mode || 'cv';
            if (mode === 'cv') {
              if (e.na > 0) A[k * N + e.na - 1] += 1;
              A[k * N + k] += e.rout || 0.05;
              if (e.nc > 0) A[k * N + e.nc - 1] -= dA;
              if (e.nb > 0) A[k * N + e.nb - 1] -= dB;
              bb[k] += vt - dA * vcom - dB * vin;
            } else { A[k * N + k] += 1; bb[k] += mode === 'cc' ? sg * (e.ilim || 1.5) : 0; }
            const iq = sg * (e.iq || 0) * Math.min(1, Math.max(0, sg * (vin - vcom) / 3));
            if (e.nb > 0) bb[e.nb - 1] -= iq;
            if (e.nc > 0) bb[e.nc - 1] += iq;
            e.dA = dA; e.dB = dB; e.iqq = iq; e.vtg = vt;
            break;
          }
"""
s = s[:i0] + new + s[i1:]
s = s.replace("          case 'REG': e.i = e.iop || 0; e.vin = this.v(e.nb); e.vout = va; e.vdrop = e.vin - va; break;",
              "          case 'REG': e.i = x[nn + e.br]; e.vin = this.v(e.nb); e.vout = va; e.vdrop = e.vin - va; break;")

# events
s = s.replace("    _saveState() {", """    /* eventos: modos de los reguladores y funciones externas (this.hooks). Devuelve true si algo cambió */
    _events() {
      let ch = false;
      for (const e of this.els) {
        if (e.type !== 'REG' || e.dead) continue;
        const sg = e.pol || 1, il = e.ilim || 1.5, ro = e.rout || 0.05;
        const m = e.mode || 'cv';
        let nm = m;
        if (m === 'cv') { if (sg * e.i > il * (1 + 1e-6)) nm = 'cc'; else if (sg * e.i < -1e-9) nm = 'off'; }
        else if (m === 'cc') { if (sg * e.vout >= sg * e.vtg - ro * il) nm = 'cv'; }
        else if (m === 'off') { if (sg * (e.vtg - e.vout) > 1e-6) nm = 'cv'; }
        if (nm !== m) { e.mode = nm; ch = true; }
      }
      if (this.hooks) for (const h of this.hooks) if (h(this)) ch = true;
      return ch;
    }

    _saveState() {""")

# solveDC con bucle de eventos
s = s.replace("""      this.error = null;
      this.x = x;
      this._finish(x);
      for (const e of this.els) {
        if (e.type === 'C') { e.vprev""", """      this.error = null;
      this.x = x;
      this._finish(x);
      if (!opts.noEvents && this._events()) {
        for (let k = 0; k < 12; k++) {
          const xx = this._newton(this.x, 'dc', 0, 'be');
          if (!xx) break;
          this.x = xx; this._finish(xx);
          if (!this._events()) break;
        }
      }
      for (const e of this.els) {
        if (e.type === 'C') { e.vprev""")

# step: eventos tras cada paso
s = s.replace("""      this.x = x;
      this._advance(x, dt, method);
      this._finish(x);
      return true;
    }""", """      this.x = x;
      this._advance(x, dt, method);
      this._finish(x);
      if (this._events()) this.restart = true;
      return true;
    }""")
open(p, 'w', encoding='utf8').write(s)

p2 = r'C:\Users\User\Documents\Claude\ConCode\dispositivos\src\core\31-spice-ac.js'
a = open(p2, encoding='utf8').read()
i0 = a.index("        case 'REG': {")
i1 = a.index("        case 'DX': {")
newr = """        case 'REG': {
          const k = nn + e.br;
          if (e.na > 0) Ar[(e.na - 1) * N + k] -= 1;
          if (e.nb > 0) Ar[(e.nb - 1) * N + k] += 1;
          if ((e.mode || 'cv') === 'cv') {
            if (e.na > 0) Ar[k * N + e.na - 1] += 1;
            Ar[k * N + k] += e.rout || 0.05;
            if (e.nc > 0) Ar[k * N + e.nc - 1] -= e.dA || 0;
            if (e.nb > 0) Ar[k * N + e.nb - 1] -= e.dB || 0;
          } else Ar[k * N + k] += 1;
          break;
        }
"""
a = a[:i0] + newr + a[i1:]
open(p2, 'w', encoding='utf8').write(a)
print('ok')
