# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\20-solidos.html'
s = open(p, encoding='utf-8').read()
def line_with(marker, new):
    global s
    i = s.index(marker); a = s.rindex('<li>', 0, i); b = s.index('</li>', i) + 5
    s = s[:a] + new + s[b:]
line_with('en SI', r'''<li><b>V_bi.</b> \(N_AN_D/n_i^2=10^{32}/10^{20}=10^{12}\) (en cm\(^{-3}\)); \(V_{bi}=0.025852\ln10^{12}=0.025852\times27.63=0.714\) V.</li>''')
line_with('(3.47+5.91)', r'''<li><b>J_s.</b> \(en_i^2=1.602\times10^{-19}\times10^{20}=16.0\); \(D_p/(L_pN_D)=12/(34.6\times10^{-4}\times10^{16})=3.47\times10^{-13}\) y \(D_n/(L_nN_A)=5.91\times10^{-13}\) (unidades CGS): \(J_s=16.0\times9.38\times10^{-13}=1.5\times10^{-11}\) A/cm\(^2\).</li>''')
s = s.replace('cerca de 600 K, y a más temperatura', 'cerca de 600 K (\\(n_i=10^{15}\\) cm\\(^{-3}\\) a 602 K), y a más temperatura')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
