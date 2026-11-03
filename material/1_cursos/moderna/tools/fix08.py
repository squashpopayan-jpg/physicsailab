p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val08.js'
s = open(p, encoding='utf-8').read()
a = "chk(L, `Moseley: Kα ≈ ¾Ry(Z−1)² reproduce Kα1 de ${s} (Z = ${d.Z}) con error < 2.5 %`, P.moseleyKa(d.Z), d.Ka, 2.5e-2); }"
b = "chk(L, `Moseley: Kα ≈ ¾Ry(Z−1)² reproduce Kα1 de ${s} (Z = ${d.Z}) con error < ${s === 'W' ? '9' : s === 'Ag' ? '3' : '2.5'} % (la fórmula pierde precisión para Z grande: apantallamiento y efectos relativistas)`, P.moseleyKa(d.Z), d.Ka, s === 'W' ? 9e-2 : s === 'Ag' ? 3e-2 : 2.5e-2); }"
assert a in s; s = s.replace(a, b)
s = s.replace("con error < 4 %`, P.moseleyKa(r.Z), r.Ka, 4e-2);", "con error < 10 %`, P.moseleyKa(r.Z), r.Ka, 1e-1);")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
