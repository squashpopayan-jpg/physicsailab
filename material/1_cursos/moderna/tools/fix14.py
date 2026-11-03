# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\14-hidrogeno.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"<li><b>Números.</b> \(\alpha^3=3.8869\times10^{-7}\); \(\omega^3=0.375^3=0.052734\); \(|r|^2=1.6650\). Con la masa reducida, \(\omega\to0.999\,456\times0.375\): \(A=\tfrac43(3.8869\times10^{-7})(0.052706)(\tfrac13)(1.6650\times0.99891)\times4.1341\times10^{16}\approx6.265\times10^8\) s\(^{-1}\).</li>",
  r"<li><b>Números.</b> \(\alpha^3=3.8869\times10^{-7}\); \(\omega^3=0.375^3=0.052734\); \(|r|^2=1.2903^2=1.6649\). Con \(\mu=m_e\): \(A=\tfrac43(3.8869\times10^{-7})(0.052734)(\tfrac13)(1.6649)\times4.1341\times10^{16}=6.2683\times10^8\) s\(^{-1}\). Con la masa reducida, \(\omega\propto\mu\) y \(|r|^2\propto\mu^{-2}\), así que \(A\propto\mu\): \(A=6.2683\times10^8\times0.999\,456=6.2649\times10^8\) s\(^{-1}\).</li>"),
 (r'''<li><b>Resultado.</b> <span class="ans">\(6.265\times10^8\) s\(^{-1}\), 1.596 ns; 5.27 ns, 88.2 % y 11.8 %.</span></li>''', r'''<li><b>Resultado.</b> <span class="ans">\(6.2649\times10^8\) s\(^{-1}\), 1.596 ns; 5.27 ns, 88.2 % y 11.8 %.</span></li>'''),
 (r"\(E=-1.5117\) eV (con masa reducida)", r"\(E=-1.5110\) eV (con masa reducida)"),
]
for a, b in rep:
    assert a in s, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
