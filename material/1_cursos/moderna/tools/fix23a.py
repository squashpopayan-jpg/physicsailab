# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\23-radiactividad.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)
rep('\\(\\lambda_1=\\ln2/65.94\\ \\text{h}=0.010511\\) h\\(^{-1}\\)', '\\(\\lambda_1=\\ln2/65.94\\ \\text{h}=0.010512\\) h\\(^{-1}\\)')
rep('/0.10489=22.8\\) h', '/0.10488=22.8\\) h')
rep('1.311 MeV (β⁻) y 1.505 MeV (captura)', '1.311 MeV (β⁻) y 1.504 MeV (captura)')
rep('49.5 keV para el ¹⁴C (49.5), 49.0 keV para el ³⁵S (48.8)', '49.4 keV para el ¹⁴C (publicada: 49.5), 48.9 keV para el ³⁵S (48.8)')
rep('la media es 49.5 keV; el neutrino se lleva en promedio \\(156.5-49.5=107\\) keV', 'la media es 49.4 keV; el neutrino se lleva en promedio \\(156.5-49.4=107\\) keV')
rep('es 49.5 keV. ¿Cuánto se lleva', 'es 49.5 keV (publicada). ¿Cuánto se lleva') if 'es 49.5 keV. ¿Cuánto se lleva' in s else None
rep('\\(\\langle T\\rangle=49.45\\) keV', '\\(\\langle T\\rangle=49.43\\) keV')
rep('\\(Q-\\langle T\\rangle=156.5-49.45=107.05\\) keV', '\\(Q-\\langle T\\rangle=156.5-49.43=107.07\\) keV')
rep('107 keV al antineutrino (68 %); 49.5 keV al electrón (32 %)', '107 keV al antineutrino (68 %); 49.4 keV al electrón (32 %)')
rep('la semivida cambia \\(2.4\\times10^{24}\\) veces (de \\(1.4\\times10^{17}\\) s a \\(3\\times10^{-7}\\) s)', 'la semivida cambia \\(4.7\\times10^{23}\\) veces (de \\(1.4\\times10^{17}\\) s a \\(3\\times10^{-7}\\) s)')
rep('con errores de un factor 3 a 100, es decir, dentro de dos órdenes de magnitud en 24 órdenes', 'con errores de un factor 3 a 110, es decir, dentro de dos órdenes de magnitud en 24 órdenes')
open(p, 'w', encoding='utf-8').write(s)
c = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\caps\cap23.py'
t = open(c, encoding='utf-8').read()
t = t.replace("l1, '0.010511'", "l1, '0.010512'").replace("l2-l1, '0.10489'", "l2-l1, '0.10488'").replace("Qec(19, 40), '1.505'", "Qec(19, 40), '1.504'").replace("mean(7, 0.1565)*1e3, '49.5')", "mean(7, 0.1565)*1e3, '49.4')").replace("Qb(16, 35))*1e3, '49.0')", "Qb(16, 35))*1e3, '48.9')").replace("'P6: ⟨T⟩ ¹⁴C', mean(7, 0.1565)*1e3, '49.45'", "'P6: ⟨T⟩ ¹⁴C', mean(7, 0.1565)*1e3, '49.43'").replace("'107.05')", "'107.07')").replace("'Texto: 4.7e23'", "'x'")
open(c, 'w', encoding='utf-8').write(t)
print('ok')
