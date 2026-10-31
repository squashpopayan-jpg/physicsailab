# -*- coding: utf-8 -*-
# Capítulo 28: átomos de muchos electrones
EhV = 27.211386246; R_ = 13.605693123
# P3: Slater
for nm, Z, s_, n_ in (('Li', 3, 0.85*2, 2), ('Na', 11, 0.85*8+2, 3), ('K', 19, 0.85*8+10, 3.7)):
    ze = Z-s_; E = R_*ze**2/n_**2
    chk(28, f'P3: σ ({nm})', s_, {'Li': '1.70', 'Na': '8.80', 'K': '16.8'}[nm]); chk(28, f'P3: Z_ef ({nm})', ze, {'Li': '1.30', 'Na': '2.20', 'K': '2.20'}[nm]); chk(28, f'P3: E ({nm}) (eV)', E, {'Li': '5.748', 'Na': '7.317', 'K': '4.810'}[nm])
for nm, E, IE_, e_ in (('Li', 5.748, 5.392, '6.6'), ('Na', 7.317, 5.139, '42'), ('K', 4.810, 4.341, '11')): chk(28, f'P3: error ({nm}) %', (E/IE_-1)*100, e_, 0.03)
chk(28, 'P3: Li (2 cifras)', R_*1.3**2/4, '5.75'); chk(28, 'P3: Na (2 cifras)', R_*2.2**2/9, '7.32'); chk(28, 'P3: K (2 cifras)', R_*2.2**2/3.7**2, '4.81')
# Sim periódica
chk(28, 'Sim: ⟨r⟩ Na', 9/2.2, '4.09'); chk(28, 'Sim: ⟨r⟩ Ne', 4/5.85, '0.68')
chk(28, 'Sim/Sec.: Z_ef Fe 4s', 26-(0.35+0.85*14+10), '3.75'); chk(28, 'Sim: E Fe 4s (eV)', -R_*3.75**2/3.7**2, '-13.98', 2e-3); chk(28, 'Sim: Z_ef Fe 3d', 26-(0.35*5+18), '6.25'); chk(28, 'Sim: E Fe 3d (eV)', -R_*6.25**2/9, '-59.05'); chk(28, 'Sec.: Li Z_ef = 1.30, Ne = 5.85', 10-(0.35*7+0.85*2), '5.85')
chk(28, 'Sec.: σ(K) = 0.85·8 + 1.00·10', 0.85*8+10, '16.8')
# P4 helio
Ehf = -2.86168; eps = -0.91795; Eex = -2.903724377; Evar = -(27/16)**2
chk(28, 'P4: E_c', Eex-Ehf, '-0.04204', 1e-3); chk(28, 'P4: E_c (eV)', (Eex-Ehf)*EhV, '-1.144'); chk(28, 'P4: fracción (%)', (Eex-Ehf)/Eex*100, '1.45'); chk(28, 'P4: I Koopmans (eV)', -eps*EhV, '24.98'); chk(28, 'P4: I Koopmans (hartree)', -eps, '0.91795'); chk(28, 'P4: error de Koopmans (%)', (-eps*EhV/24.587-1)*100, '1.6', 0.05)
chk(28, 'P4: E_HF − E_var', Ehf-Evar, '-0.01402', 2e-3); chk(28, 'P4: en eV', (Ehf-Evar)*EhV, '-0.382')
chk(28, 'Sim: E_c (Li⁺)', -7.279913413+7.23641, '-0.04350', 2e-3); chk(28, 'Sim: E_c (C⁴⁺)', -32.406246602+32.36118, '-0.04507', 2e-3)
# P5: una gaussiana
c = (8*math.sqrt(2)-2)/math.sqrt(math.pi)
chk(28, 'P5: c', c, '5.2547'); chk(28, 'P5: a*', c*c/36, '0.7670'); chk(28, 'P5: E_min', -c*c/12, '-2.3010'); chk(28, 'P5: 8√2 − 2', 8*math.sqrt(2)-2, '9.3137'); chk(28, 'P5: fracción del HF (%)', 2.30099/2.86168*100, '80', 5e-3)
a_ = sp.Symbol('a', positive=True); Ea = 3*a_-4*2*sp.sqrt(2*a_/sp.pi)+2*sp.sqrt(a_/sp.pi); chk(28, 'P5: E(a) = 3a − (8√2 − 2)√a/√π (SymPy)', 1.0 if sp.simplify(Ea-(3*a_-(8*sp.sqrt(2)-2)*sp.sqrt(a_)/sp.sqrt(sp.pi))) == 0 else 0.0, '1.0')
chk(28, 'P5: (gg|gg) = 2√(a/π) (a = 0.9)', (2*math.pi**2.5/(2*0.9*2*0.9*math.sqrt(4*0.9)))*(2*0.9/math.pi)**3, 2*math.sqrt(0.9/math.pi), 1e-12)
chk(28, 'Sim: 99.98 % con 8 gaussianas', 2.861131/2.86168*100, '99.98', 1e-4)
# P6: d²
orb = [(ml, ms) for ml in range(-2, 3) for ms in (0.5, -0.5)]; import itertools as it
cnt = {}
for cc in it.combinations(orb, 2): k = (sum(o[0] for o in cc), sum(o[1] for o in cc)); cnt[k] = cnt.get(k, 0)+1
chk(28, 'P6: estados', sum(cnt.values()), '45'); chk(28, 'P6: C(10,2)', math.comb(10, 2), '45'); chk(28, 'P6: C(5,2)', math.comb(5, 2), '10'); chk(28, 'P6: M_S = ±1', sum(v for k, v in cnt.items() if abs(k[1]) == 1), '20'); chk(28, 'P6: M_S = 0', sum(v for k, v in cnt.items() if k[1] == 0), '25')
chk(28, 'P6: ³F + ³P', 21+9, '30'); chk(28, 'P6: ¹G + ¹D + ¹S', 9+5+1, '15'); chk(28, 'P6: suma', 21+9+9+5+1, '45'); chk(28, 'P6: M_L máx con S = 1', max(k[0] for k in cnt if k[1] == 1), '3'); chk(28, 'P6: M_L máx con S = 0', max(k[0] for k in cnt if k[1] == 0), '4')
# P2
chk(28, 'P2: N: S = 3/2, 2S + 1', 2*1.5+1, '4'); chk(28, 'P2: O: J = L + S', 1+1, '2'); chk(28, 'P2: Fe: J = L + S', 2+2, '4')
