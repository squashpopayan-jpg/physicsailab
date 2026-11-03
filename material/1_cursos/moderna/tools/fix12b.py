# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\12-tunel.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"<li><b>\(T\) exacta.</b> \(\kappa a=3.0739\); \(\operatorname{senh}^2=(10.84)^2\approx117.5\)... con \(V_0^2/[4E(V_0-E)]=25/16=1.5625\): \(T=1/(1+1.5625\times\operatorname{senh}^2\kappa a)=5.467\times10^{-3}\).</li>",
  r"<li><b>\(T\) exacta.</b> \(\kappa a=3.0739\); \(\operatorname{senh}(3.0739)=10.79\), \(\operatorname{senh}^2=116.4\); con \(V_0^2/[4E(V_0-E)]=25/16=1.5625\): \(T=1/(1+1.5625\times116.4)=5.467\times10^{-3}\).</li>"),
 (r"<li><b>Fundamental.</b> Raíz de \(z\tan z=\sqrt{z_0^2-z^2}\) en \((0,\pi/2)\): \(z_1=2.7954\)... se resuelve numéricamente: \(E_1=z_1^2\times0.0380998/0.25=0.2976\) eV.</li>",
  r"<li><b>Fundamental.</b> La raíz de \(z\tan z=\sqrt{z_0^2-z^2}\) en \((0,\pi/2)\) se halla numéricamente: \(z_1=1.3975\) (comprobación: \(1.3975\tan1.3975=7.98=\sqrt{65.62-1.953}\)). \(E_1=z_1^2(0.0380998)/a^2=1.9530\times0.0380998/0.25=0.2976\) eV.</li>"),
 (r"<li><b>Norma dentro.</b> Para \(\psi=A\cos kx\): \(\int_{-a}^aA^2\cos^2kx=A^2[a+\operatorname{sen}(2ka)/2k]=A^2(0.5+0.1735)=0.6735A^2\) (con \(\operatorname{sen}2.795=0.3414\), \(/5.590=0.0611\); numéricamente 0.5611).</li>",
  r"<li><b>Norma dentro.</b> Para \(\psi=A\cos kx\): \(\int_{-a}^aA^2\cos^2kx\,\dd x=A^2[a+\operatorname{sen}(2ka)/2k]=A^2(0.5+0.3398/5.590)=0.5608\,A^2\).</li>"),
 (r"<li><b>Norma fuera.</b> \(2\int_a^\infty A^2\cos^2(ka)e^{-2\kappa(x-a)}\dd x=A^2\cos^2(ka)/\kappa=A^2(0.8860\times\ldots)\): se evalúa numéricamente.</li>",
  r"<li><b>Norma fuera.</b> \(2\int_a^\infty A^2\cos^2(ka)\,e^{-2\kappa(x-a)}\dd x=A^2\cos^2(ka)/\kappa=A^2(0.02979/15.958)=0.001867\,A^2\) (con \(\cos1.3975=0.1726\)).</li>\n<li><b>Probabilidad.</b> \(P_\text{fuera}=0.001867/(0.5608+0.001867)=3.32\times10^{-3}\).</li>"),
 (r"Con \(V_0=0.5\) eV queda solo uno: el pozo débil siempre liga un estado.", r"Con \(V_0=0.5\) eV (\(z_0=1.81\)) quedan 2; con \(V_0=0.1\) eV (\(z_0=0.81\)), uno solo: un pozo débil siempre liga al menos un estado."),
 (r"Suba \(V_0\) a 1000 eV: 60 estados", r"Suba \(V_0\) a 1000 eV: 52 estados"),
 (r"(1.05 si se compara el valor de pico a valle)", r""),
 (r"cuya línea de microondas a 23.694 GHz es la del primer máser, son también túneles.", r"cuyas líneas de inversión, en torno a 23.7–23.9 GHz, son las del primer máser (Townes, 1954), son también túneles."),
 (r"atraviesa la barrera de Coulomb de unos 25–30 MeV;", r"atraviesa una barrera de Coulomb de más de 20 MeV;"),
]
for a, b in rep:
    assert a in s, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
