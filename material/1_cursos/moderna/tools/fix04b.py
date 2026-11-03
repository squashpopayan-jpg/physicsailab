# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\04-dinamica.js'
s = open(p, encoding='utf-8').read()
a = "pbar: ['p + p → p + p + p + p̄ (antiprotón)', M.p, M.p, 4 * M.p], pi0: ['p + p → p + p + π⁰', M.p, M.p, 2 * M.p + M.pi0], gp: ['γ + p → π⁰ + p', 0, M.p, M.p + M.pi0],"
b = "pbar: ['p + p → p + p + p + p̄ (antiprotón)', M.p, M.p, 4 * M.p], pi0: ['p + p → p + p + π⁰', M.p, M.p, 2 * M.p + M.pi0],"
assert a in s; s = s.replace(a, b)
a = "      pr.fn((Mm) => (Mm * Mm - 2 * M.p * M.p) / (2 * M.p), { color: '--c2', width: 2.4, from: 2 * M.p, n: 200 });\n      pr.fn((Mm) => Mm / 2, { color: '--accent', width: 2.4, n: 200 });\n      pr.dot(Mf, R.fixedEquivalentE(Mf / 2, Mf / 2) > 0 ? (Mf * Mf - 2 * m2 * m2) / (2 * m2) : 1, { color: '--c2', r: 4.5 }); pr.dot(Mf, Mf / 2, { color: '--accent', r: 4.5 });\n      pr.legend([{ label: 'blanco fijo ∝ M²', color: '--c2' }, { label: 'colisionador ∝ M', color: '--accent' }], 'tl');"
b = "      pr.fn((Mm) => (Mm * Mm - 2 * m2 * m2) / (2 * m2), { color: '--c2', width: 2.4, from: 2 * m2, n: 200 });\n      pr.fn((Mm) => Mm / 2, { color: '--accent', width: 2.4, n: 200 });\n      pr.dot(Mf, (Mf * Mf - 2 * m2 * m2) / (2 * m2), { color: '--c2', r: 4.5 }); pr.dot(Mf, Mf / 2, { color: '--accent', r: 4.5 });\n      pr.legend([{ label: 'blanco fijo ∝ M²', color: '--c2' }, { label: 'colisionador ∝ M', color: '--accent' }], 'tl');"
assert a in s; s = s.replace(a, b)
s = s.replace("title: 'Blanco fijo (protón) frente a colisionador'", "title: 'Blanco fijo frente a colisionador (mismas masas)'")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
