# -*- coding: utf-8 -*-
import re
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\refs\ref04.py'
s = open(p, encoding='utf-8').read()
a = """def sqrts_fixed(m1, E1, m2):
    p1 = math.sqrt(E1*E1-m1*m1); Et = E1+m2
    return math.sqrt(Et*Et-p1*p1)
def threshold_numeric(m1, m2, Mf):
    f = lambda K: sqrts_fixed(m1, m1+K, m2) - Mf
    return optimize.brentq(f, 0, 1e14, xtol=1e-12, rtol=1e-14)"""
b = """mp.mp.dps = 60
def sqrts_fixed(m1, E1, m2):
    # s = (E1 + m2)² − p1² con aritmética de 60 dígitos (evita la cancelación catastrófica a energías muy grandes)
    m1, E1, m2 = mp.mpf(m1), mp.mpf(E1), mp.mpf(m2)
    p1sq = E1*E1-m1*m1; Et = E1+m2
    return mp.sqrt(Et*Et-p1sq)
def threshold_numeric(m1, m2, Mf):
    f = lambda K: sqrts_fixed(m1, mp.mpf(m1)+K, m2) - mp.mpf(Mf)
    return float(mp.findroot(f, (mp.mpf(0), mp.mpf(10)**14), solver='anderson', tol=1e-40, maxsteps=500))"""
assert a in s
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val04.js'
s = open(p, encoding='utf-8').read()
a = "for (const k of ['mu', 'pi', 'pi0', 'K', 'W', 'Z', 'H', 'tau', 'top']) chk('Literatura', `Masa de ${k} en la biblioteca frente al PDG (paquete particle): ${ref.pdg_mass[k]} MeV/c²`, M[k], ref.pdg_mass[k], 1e-4);"
b = """for (const k of ['mu', 'pi', 'pi0', 'K', 'Z', 'tau']) chk('Literatura', `Masa de ${k} en la biblioteca (PDG 2022) frente al paquete particle: ${ref.pdg_mass[k]} MeV/c²`, M[k], ref.pdg_mass[k], 1e-4);
  for (const k of ['W', 'H', 'top']) chk('Literatura', `Masa de ${k} en la biblioteca (PDG 2022) frente al paquete particle (PDG 2020): ${ref.pdg_mass[k]} MeV/c²: coinciden a 0.1 %`, M[k], ref.pdg_mass[k], 2e-3);"""
assert a in s
s = s.replace(a, b)
a = "chk(L, 'Límite clásico: K = ½mv² con error de orden β² (electrón de 1 keV)', R.kinetic(M.e, R.gammaFromK(1e-3, M.e)) / R.classicalK(M.e, R.betaFromK(1e-3, M.e)), 1, 2e-3);"
b = "{ const bb = R.betaFromK(1e-3, M.e); chk(L, 'Límite clásico: K/(½mv²) = 1 + (3/4)β² + … (electrón de 1 keV)', R.kinetic(M.e, R.gammaFromK(1e-3, M.e)) / R.classicalK(M.e, bb), 1 + 0.75 * bb * bb, 2e-5); }"
assert a in s
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
