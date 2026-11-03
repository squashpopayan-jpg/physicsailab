# -*- coding: utf-8 -*-
import json, xraydb
els = [('Mg', 12), ('Ca', 20), ('Ti', 22), ('Cr', 24), ('Fe', 26), ('Co', 27), ('Cu', 29), ('Zn', 30), ('Zr', 40), ('Mo', 42), ('Ag', 47), ('Sn', 50), ('W', 74), ('Au', 79)]
tab = {s: [z, round(xraydb.xray_line(s, 'Ka1').energy, 1)] for s, z in els}
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\55-fm-atom.js'
s = open(p, encoding='utf-8').read()
a = "  /* ---------- Moseley: ajuste √E = a(Z − σ) por mínimos cuadrados ---------- */"
b = "  /* Energías Kα1 (eV) de elementos de Z = 12 a 79: Elam, Ravel y Sieber (2002), tabuladas en xraydb */\n  A.KALPHA = " + json.dumps(tab) + ";\n" + a
assert a in s
if 'A.KALPHA' not in s:
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\refs\ref10.py'
s = open(p, encoding='utf-8').read()
a = "els = [('Cr', 24), ('Fe', 26), ('Cu', 29), ('Mo', 42), ('Ag', 47), ('W', 74)]"
b = "els = [('Mg', 12), ('Ca', 20), ('Cr', 24), ('Fe', 26), ('Cu', 29), ('Zn', 30)]"
assert a in s
s = s.replace(a, b)
s += "ref['moseley_kalpha'] = {s_: xraydb.xray_line(s_, 'Ka1').energy for s_ in ('Mg','Ca','Ti','Cr','Fe','Co','Cu','Zn','Zr','Mo','Ag','Sn','W','Au')}\n"
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val10.js'
s = open(p, encoding='utf-8').read()
a = "V4 = A.franckHertz(6.5, { n: 4000 }, rng).frac"
assert a in s
s = s.replace(a, "V4 = A.franckHertz(6.0, { n: 4000 }, rng).frac")
s = s.replace("(V = 6.5 V < V = 4 V) y vuelve a subir (V = 9 V > 6.5 V)", "(V = 6 V < V = 4 V) y vuelve a subir (V = 9 V > 6 V)").replace("V = 6.5 V<", "V = 6 V<")
a = "chk(L, 'Pendiente de Moseley medida frente a √(¾Ry) = 3.194 eV^½ (error < 2 %)', f.a, m.a_theory, 2e-2); chk(L, 'Constante de apantallamiento de las líneas Kα: σ ≈ 1.1', f.sigma, 1.1, 0.15); }"
b = """chk(L, 'Pendiente de Moseley de Mg a Zn (Z = 12–30) frente a √(¾Ry) = 3.194 eV^½ (error < 0.2 %)', f.a, m.a_theory, 2e-3); chk(L, 'Constante de apantallamiento de las líneas Kα (Z = 12–30): σ ≈ 0.95', f.sigma, 0.95, 0.05);
    for (const [s, v] of Object.entries(ref.moseley_kalpha)) chk(S, `Tabla de Kα1 de ${s} (Z = ${A.KALPHA[s][0]}) frente a xraydb`, A.KALPHA[s][1], v, 2e-4); }"""
assert a in s
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
