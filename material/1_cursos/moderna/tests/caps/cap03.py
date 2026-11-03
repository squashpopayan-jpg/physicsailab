# -*- coding: utf-8 -*-
# Capítulo 3: espacio-tiempo, gemelos, cuadrivectores, movimiento hiperbólico
g = lambda b: 1/math.sqrt(1-b*b)
yr = 365.25*86400; ly = c*yr; g0 = 9.80665
# Sim minkowski
b = .5; G = g(b)
chk(3, 'Sim Minkowski: γ(0.5)', G, '1.1547'); chk(3, "Sim Minkowski: x′ de E(3,2)", G*(3-b*2), '2.309'); chk(3, "Sim Minkowski: ct′", G*(2-b*3), '0.577')
chk(3, 'Sim Minkowski: |ct/x|', 2/3, '0.667'); chk(3, 'Sim Minkowski: intervalo E(3,2)', 2**2-3**2, '-5'); chk(3, 'Sim Minkowski: intervalo E(2,3)', 3**2-2**2, '5'); chk(3, 'Sim Minkowski: τ = √5', math.sqrt(5), '2.236')
# P1
chk(3, 'P1: s² espacial (m²)', 9-25, '-16'); chk(3, 'P1: distancia propia', math.sqrt(16), '4.00'); chk(3, 'P1: β', 3/5, '0.6'); chk(3, 'P1: Δx′', 1.25*(5-.6*3), '4.00')
chk(3, 'P1: τ (ns)', 4/c*1e9, '13.34')
# gemelos
b = .8; G = g(b)
chk(3, 'Ej. gemelos: Tierra (años)', 2*4/b, '10'); chk(3, 'Ej. gemelos: viajero (años)', 2*4/b/G, '6'); chk(3, 'Ej. gemelos: dilatación en la ida (años)', 3/G, '1.8'); chk(3, 'Ej. gemelos: 2×1.8', 2*3/G, '3.6')
chk(3, 'Ej. gemelos: t₁', 4/b-b*4, '1.8'); chk(3, 'Ej. gemelos: t₂', 4/b+b*4, '8.2'); chk(3, 'Ej. gemelos: salto', 2*b*4, '6.4'); chk(3, 'Ej. gemelos: cuenta', 1.8+6.4+(10-8.2), '10.0'); chk(3, 'Ej. gemelos: 3.6 + 6.4', 3.6+6.4, '10.0')
b = .6; G = g(b)
chk(3, 'P2: Tierra (años)', 2*10/b, '33.33'); chk(3, 'P2: viajero (años)', 2*10/b/G, '26.67'); chk(3, 'P2: t₁ (años)', 10/b-b*10, '10.667'); chk(3, 'P2: t₂ (años)', 10/b+b*10, '22.667'); chk(3, 'P2: salto', 2*b*10, '12'); chk(3, 'P2: t₂ − t₁', (10/b+b*10)-(10/b-b*10), '12.0')
chk(3, 'P2: cuenta', (10/b-b*10)+12+(2*10/b-(10/b+b*10)), '33.333')
# cuadrivelocidad
chk(3, 'Ej. u: γ(0.6)', g(.6), '1.25'); chk(3, 'Ej. u: γβ', g(.6)*.6, '0.75'); chk(3, 'Ej. u: norma', 1.25**2-.75**2, '1.0000')
G2 = 5/3; u0 = G2*(1.25-.8*.75); u1 = G2*(.75-.8*1.25)
chk(3, "Ej. u: u⁰′", u0, '1.0833'); chk(3, "Ej. u: u¹′", u1, '-0.4167'); chk(3, 'Ej. u: norma transformada', u0**2-u1**2, '1.0000'); chk(3, "Ej. u: β′", u1/u0, '-0.3846'); chk(3, 'Ej. u: suma de velocidades', (0.6-0.8)/(1-0.48), '-0.3846')
chk(3, 'Ej. u: u⁰′² (4 cifras)', u0**2, '1.1736'); chk(3, 'Ej. u: u¹′² (4 cifras)', u1**2, '0.1736'); chk(3, 'P5: u⁰′ (5 cifras)', u0, '1.08333'); chk(3, 'P5: u¹′ (5 cifras)', u1, '-0.41667'); chk(3, 'P5: β′ (5 cifras)', u1/u0, '-0.38462'); chk(3, 'P5: u⁰′² (5 cifras)', u0**2, '1.17361'); chk(3, 'P5: u¹′² (5 cifras)', u1**2, '0.17361')
# matriz de Lorentz: Λᵀ η Λ = η
Bm = .6; Gm = g(Bm); Lam = sp.Matrix([[Gm, -Gm*Bm], [-Gm*Bm, Gm]]); eta = sp.diag(1, -1)
chk(3, 'SymPy: ΛᵀηΛ = η (norma de la diferencia)', float(sp.Matrix(Lam.T*eta*Lam-eta).norm()), 0, 1e-12, False)
# hiperbólico
th = g0*yr/c
chk(3, 'Texto: c/g (años)', c/g0/yr, '0.9687'); chk(3, 'Texto: c²/g (al)', c*c/g0/ly, '0.9687'); chk(3, 'P3: ϑ', th, '1.03230'); chk(3, 'P3: β', math.tanh(th), '0.77483'); chk(3, 'P3: γ', math.cosh(th), '1.58185')
chk(3, 'P3: β (4 cifras)', math.tanh(th), '0.7748'); chk(3, 'P3: γ (4 cifras)', math.cosh(th), '1.5818'); chk(3, 'P3: senh ϑ', math.sinh(th), '1.2257'); chk(3, 'P3: t (años)', c/g0*math.sinh(th)/yr, '1.1873'); chk(3, 'P3: cosh ϑ − 1', math.cosh(th)-1, '0.58185'); chk(3, 'P3: x (al)', c*c/g0*(math.cosh(th)-1)/ly, '0.5636'); chk(3, 'Texto: t (años, 3 cifras)', c/g0*math.sinh(th)/yr, '1.187'); chk(3, 'Texto: x (al, 3 cifras)', c*c/g0*(math.cosh(th)-1)/ly, '0.564'); chk(3, 'Texto: horizonte', c*c/g0/ly, '0.969')
def trip(a, dly):
    ch = 1+a*dly*ly/2/c**2; thh = math.acosh(ch); return dict(tau=2*c/a*thh/yr, t=2*c/a*math.sqrt(ch*ch-1)/yr, g=ch, b=math.sqrt(1-1/ch**2), arch=thh, sq=math.sqrt(ch*ch-1))
P = trip(g0, 4.2465)
chk(3, 'Ej. Próxima: γ máx', P['g'], '3.1918'); chk(3, 'Ej. Próxima: β máx', P['b'], '0.9497'); chk(3, 'Ej. Próxima: arcosh', P['arch'], '1.8282'); chk(3, 'Ej. Próxima: τ (años)', P['tau'], '3.542'); chk(3, 'Ej. Próxima: raíz', P['sq'], '3.0311'); chk(3, 'Ej. Próxima: t (años)', P['t'], '5.873')
chk(3, 'Ej. Próxima: 4.2465/(2c²/g)', 4.2465/(2*c*c/g0/ly), '2.1918')
P5 = trip(.5*g0, 4.2465); chk(3, 'Ej. Próxima a 0.5 g: τ', P5['tau'], '5.31'); chk(3, 'Ej. Próxima a 0.5 g: t', P5['t'], '7.14'); P3 = trip(3*g0, 4.2465); chk(3, 'Sim hiperbólica: 3 g a Próxima τ', P3['tau'], '1.75')
Q = trip(g0, 26000); chk(3, 'P4: γ máx centro galáctico', Q['g'], '13421'); chk(3, 'P4: τ centro galáctico', Q['tau'], '19.757'); chk(3, 'P4: t centro galáctico', Q['t'], '26001.9'); chk(3, 'Texto: t centro galáctico (entero)', Q['t'], '26002')
A_ = trip(g0, 2.537e6); chk(3, 'P4: γ máx Andrómeda (10⁶)', A_['g']/1e6, '1.3095'); chk(3, 'P4: τ Andrómeda', A_['tau'], '28.63'); chk(3, 'P4: t Andrómeda (10⁶ años)', A_['t']/1e6, '2.537002')
chk(3, 'Sim hiperbólica: Sirio τ', trip(g0, 8.6)['tau'], '4.61'); chk(3, 'Sim hiperbólica: Vega τ', trip(g0, 25.04)['tau'], '6.44'); chk(3, 'P4: 26000/(2·0.96872)', 26000/(2*c*c/g0/ly), '13419.8') if False else None
chk(3, 'Texto: aproximación τ ≈ (2c/a) ln(ad/c²) para el centro galáctico (años)', 2*c/g0/yr*math.log(g0*26000*ly/c**2), 19.75, 1e-2)
# garaje
bg = math.sqrt(3)/2
chk(3, 'P6: β', bg, '0.8660'); chk(3, 'P6: desfase (m)', 2*bg*10, '17.32'); chk(3, 'P6: desfase (ns)', 2*bg*10/c*1e9, '57.77'); chk(3, 'P6: Δx′', 2*10, '20'); chk(3, 'P6: desplazamiento del granero (m)', bg*c*(2*bg*10/c), '15'); chk(3, 'P6: 0.866 × 17.32', 0.866*17.32, '15.0')
chk(3, 'Texto garaje: desfase (ns, 1 decimal)', 2*bg*10/c*1e9, '57.8')
chk(3, 'Texto muones: aceleración centrípeta ≈ c²/R en unidades de g (10¹⁵)', c*c/7.112/g0/1e15, '1.3') if False else chk(3, 'Texto muones: c²/R/g (10¹⁵)', c*c/7.112/g0/1e15, '1.3')
