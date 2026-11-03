# -*- coding: utf-8 -*-
def sub(path, reps):
    s = open(path, encoding='utf-8').read()
    for a, b in reps:
        assert a in s, a[:70]
        s = s.replace(a, b)
    open(path, 'w', encoding='utf-8').write(s)
H = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\10-bohr.html'
sub(H, [
 (r"y para el aluminio ya a 7.7 MeV (Chadwick y Bieler, 1921).", r"y para el aluminio ya a 7.7 MeV (Rutherford y Chadwick, 1921)."),
 (r"imposible en el modelo de Thomson, donde la deflexión máxima es de décimas de grado.", r"imposible en el modelo de Thomson, donde la desviación típica es de una fracción de grado."),
 (r"un ajuste lineal de \(\sqrt E\) frente a \(Z\) para \(Z=12\)–30 da \(a=3.1966\) eV\(^{1/2}\) (el de Bohr: \(\sqrt{\tfrac34Ry}=3.1944\), una diferencia de 0.07 %) y \(\sigma=0.954\); para \(Z\) alto aparecen correcciones relativistas y la pendiente sube.",
  r"un ajuste lineal de \(\sqrt E\) frente a \(Z\) para \(Z=12\)–30 (Mg, Ca, Ti, Cr, Fe, Co, Cu, Zn) da \(a=3.1973\) eV\(^{1/2}\) (el de Bohr: \(\sqrt{\tfrac34Ry}=3.1944\), una diferencia de 0.09 %) y \(\sigma=0.963\); para \(Z\) alto aparecen correcciones relativistas y la pendiente sube."),
 (r"Si se extiende el ajuste hasta \(Z=79\), la pendiente sube a más de 3.3 y el apantallamiento a más de 2.", r"Con el ajuste hasta \(Z=47\): \(a=3.2457\), \(\sigma=1.284\); hasta \(Z=79\): \(a=3.3851\), \(\sigma=2.377\)."),
 (r"Disminuya el camino libre medio: los mínimos se vuelven más profundos y estrechos. Aumente el potencial retardador: los mínimos se desplazan hacia voltajes mayores.", r"Con un camino libre medio mayor (0.1) los mínimos se hacen menos profundos y terminan por desaparecer. Con un potencial retardador de 3 V los mínimos se desplazan hacia voltajes mayores (6.4, 11.8, 17.1 V, frente a 5.8, 10.7, 15.6 V con 1.5 V)."),
 (r"Con mercurio y los valores por defecto aparecen mínimos de corriente separados unos 4.9 V;", r"Con mercurio y los valores por defecto aparecen mínimos de corriente en 5.8, 10.7, 15.6, 20.4 y 25.3 V, separados unos 4.9 V (\(E_{ex}/e=4.887\) V);"),
 (r"Con la ley de Moseley (\(a=3.1966\) eV\(^{1/2}\), \(\sigma=0.954\)) determine", r"Con la ley de Moseley (\(a=3.1973\) eV\(^{1/2}\), \(\sigma=0.963\)) determine"),
 (r"\(Z=89.70/3.1966+0.954=29.01\Rightarrow\) cobre.", r"\(Z=89.70/3.1973+0.963=29.02\Rightarrow\) cobre."),
 (r"\(Z=41.36+0.954=42.3\Rightarrow\)", r"\(Z=41.35+0.963=42.3\Rightarrow\)"),
])
J = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\10-bohr.js'
sub(J, [("const p = sim.p, Eex = p.gas === 'Hg' ? 4.887 : 18.7, Vmax = p.gas === 'Hg' ? 30 : 100, N = 160;", "const p = sim.p, Eex = p.gas === 'Hg' ? 4.887 : 18.7, Vmax = p.gas === 'Hg' ? 30 : 60, N = p.gas === 'Hg' ? 160 : 240;")])
R = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\refs\ref10.py'
sub(R, [("els = [('Mg', 12), ('Ca', 20), ('Cr', 24), ('Fe', 26), ('Cu', 29), ('Zn', 30)]", "els = [('Mg', 12), ('Ca', 20), ('Ti', 22), ('Cr', 24), ('Fe', 26), ('Co', 27), ('Cu', 29), ('Zn', 30)]")])
print('ok')
