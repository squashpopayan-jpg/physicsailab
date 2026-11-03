# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/33-bench.js', [
    ("          const I = Math.abs(el.i), lim = info.spec.imax;\n          info.stressPin[pid] = I / lim;",
     "          const I = Math.abs(el.i), lim = info.spec.imax;\n          const vv = this.v(el.ref), ov = vv > info.spec.vabs + 0.3 ? 1 + (vv - info.spec.vabs) : 0;\n          const sPin = Math.max(I / lim, ov);\n          info.stressPin[pid] = sPin;"),
    ("(info.pdmg[pid] || 0) + PT.KDMG * Math.max(0, I / lim - 1) * dt * 2;", "(info.pdmg[pid] || 0) + PT.KDMG * Math.max(0, sPin - 1) * dt * 2;"),
    ("msg: 'El pin ' + pid + ' de la placa se quemó: pasaron ' + (I * 1000).toFixed(0) + ' mA (el máximo absoluto es ' + (lim * 1000).toFixed(0) + ' mA).', t: this.t });",
     "msg: ov > I / lim ? 'El pin ' + pid + ' se dañó: recibió ' + vv.toFixed(1) + ' V y su máximo es ' + info.spec.vabs + ' V.' : 'El pin ' + pid + ' de la placa se quemó: pasaron ' + (I * 1000).toFixed(0) + ' mA (el máximo absoluto es ' + (lim * 1000).toFixed(0) + ' mA).', t: this.t });"),
    ("else if (p.type === 'BTN') this.c.find(p.id + ':contact').closed = !!p.pressed;", "else if (p.type === 'BTN') this.c.find(p.id + ':contact').closed = p.contact !== undefined ? !!p.contact : !!p.pressed;"),
])
patch('src/core/45-lab.js', [
    ("    serialAppend(t) {", "    setCode(src) { if (this.ta) { this.ta.value = src; this.syncEd(); } this.loadCode(src); this.refresh(); }\n    serialAppend(t) {"),
])
print('ok')
