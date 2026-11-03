# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\76-fm-cosmo.js'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)
rep("Co.Dc = (p, z, n = 4000) => ((c / 1e3) / p.H0) * simpson((x) => 1 / Co.E(p, x), 0, z, n);", "Co.Dc = (p, z, n = 6000) => ((c / 1e3) / p.H0) * simpson((u) => Math.exp(u) / Co.E(p, Math.exp(u) - 1), 0, Math.log(1 + z), n);   /* ∫dz/E con u = ln(1 + z) */")
rep("if (Co.saha(m, eta) > 0.5) lo = m; else hi = m;", "if (Co.saha(m, eta) > 0.5) hi = m; else lo = m;")
rep("return (cs / (p.H0 * Co.E(p, z))) * 1; };   /* ∫ c_s da/(a H) = ∫ c_s dln a/H */", "return cs / (p.H0 * Co.E(p, z) * a); };   /* r_s = ∫ c_s dz/H = ∫ c_s dln a/(aH) */")
open(p, 'w', encoding='utf-8').write(s)
q = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val28.js'
t = open(q, encoding='utf-8').read()
t = t.replace("Δμ = μ(ΛCDM) − μ(Einstein–de Sitter) = +0.3 mag (Perlmutter, Riess, 1998)', Co.mu(Co.params(70, 0.3), 0.5) - Co.mu({ H0: 70, Om: 1, Or: 0, OL: 0, Ok: 0 }, 0.5), 0.301, 5e-2)", "Δμ = μ(ΛCDM) − μ(Einstein–de Sitter) = +0.40 mag a z = 0.5 (Perlmutter, Riess, 1998)', Co.mu(Co.params(70, 0.3), 0.5) - Co.mu({ H0: 70, Om: 1, Or: 0, OL: 0, Ok: 0 }, 0.5), 0.3987, 2e-3)")
t = t.replace("ocurre en R = 2.2 R_d y vale 0.62 √(GM_d/R_d)', (() =>", "ocurre en R = 2.15 R_d', (() =>").replace("return rb / 3; })(), 2.2, 1e-2);", "return rb / 3; })(), 2.15, 5e-3);")
t = t.replace("'Era de radiación: t = 1.32 s (MeV/kT)² con g* = 10.75 (T > m_e): a T = 1 MeV, t = 1.32 s', Co.radTime(1, 10.75), 1.32, 5e-3);", "'Era de radiación: t = 0.738 s (MeV/kT)² con g* = 10.75 (T > m_e) y 1.32 s con g* = 3.36 (después de la aniquilación e⁺e⁻)', Co.radTime(1, 10.75), 0.738, 2e-3);\n  chk(L, 'Era de radiación después de la aniquilación e⁺e⁻ (g* = 3.36): t = 1.32 s (MeV/kT)²', Co.radTime(1, 3.36), 1.32, 2e-3);")
t = t.replace("Co.rhoPhotonEnergy(2.7255) / K.e * 1e-6 / 1e0 * 1, 0.2606e6 * 0 + 0.2606, 1e-3 * 0 + 5e-4, true);", "Co.rhoPhotonEnergy(2.7255) / K.e * 1e-6, 0.2606e6 * 0 + 0.2606, 1e-3);")
open(q, 'w', encoding='utf-8').write(t)
print('ok')
