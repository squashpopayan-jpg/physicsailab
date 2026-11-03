# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\22-nucleo.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)
rep(r"\(8.758\) MeV de la fórmula", r"\(8.759\) MeV de la fórmula") if r"\(8.758\) MeV de la fórmula" in s else rep("\\(B/A=8.758\\) MeV de la fórmula", "\\(B/A=8.759\\) MeV de la fórmula")
rep("(\\(N/Z=1.55\\) en el plomo)", "(\\(N/Z=1.54\\) en el plomo)")
rep("y dos isóbaros estables, ¹⁰⁰Mo y ¹⁰⁰Ru, por la barrera del apareamiento.", "y dos isóbaros naturales, ¹⁰⁰Ru y ¹⁰⁰Mo (este último, con una vida media de \\(7\\times10^{18}\\) años por doble desintegración \\(\\beta\\)), por el desplazamiento del apareamiento.")
i = s.index("<li>Baje \\(\\lambda\\) hasta 0"); j = s.index("</li>", i) + 5
s = s[:i] + "<li>Baje \\(\\lambda\\): con \\(\\lambda\\simeq15\\) ya aparecen huecos en 82 (1.7 MeV) y 126 (2.3 MeV), pero todavía no en 28 y 50; con \\(\\lambda=0\\) desaparecen los cuatro y quedan los cierres de un pozo sin espín–órbita.</li>" + s[j:]
rep("(acuerdo \\(10^{-4}\\) en 38 niveles)", "(acuerdo de \\(10^{-4}\\) en unos treinta niveles)")
rep("el ⁵⁶Fe, que tiene la menor masa por nucleón, 8.790 MeV)", "el ⁵⁶Fe, 8.790 MeV, es el de menor masa por nucleón)")
rep("el ⁵⁶Fe tiene menor masa por nucleón (por los neutrones más ligeros en relación a los protones) pero algo menos de \\(B/A\\).", "el ⁵⁶Fe tiene la menor masa por nucleón porque contiene proporcionalmente menos neutrones, que pesan 0.782 MeV más que un átomo de hidrógeno, pero algo menos de \\(B/A\\).")
rep("\\(\\Delta M(43)=\\) 2.31 MeV y \\(\\Delta M(45)=\\) 2.02 MeV (ver la tabla de cifras)", "\\(\\Delta M(43)=+0.06\\) MeV y \\(\\Delta M(45)=+2.03\\) MeV")
rep("\\(M(43)-M(44)=\\) y \\(M(45)-M(44)=\\) (valores abajo): ambos positivos, de unos pocos MeV: los vecinos son inestables y decaen \\(\\beta^\\pm\\) hacia el Ru.", "\\(M(43)-M(44)=0.06\\) MeV y \\(M(45)-M(44)=2.03\\) MeV: ambos positivos, de modo que los vecinos tienden a desintegrarse (\\(\\beta^-\\) del Tc y \\(\\beta^+\\)/captura del Rh) hacia el Ru.")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
