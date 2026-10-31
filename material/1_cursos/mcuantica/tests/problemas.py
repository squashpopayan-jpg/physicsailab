# -*- coding: utf-8 -*-
"""Comprobación independiente de las cifras de los problemas resueltos y de los ejemplos (SymPy, SciPy, mpmath).
Cada fila compara el valor calculado aquí ('got') con la cifra escrita en el texto del curso ('exp').
Ejecutar: python tests/problemas.py  →  tests/problemas.json (lo lee validar.js)"""
import json, math, os, sys
sys.stdout.reconfigure(encoding='utf-8')
import numpy as np
import scipy.constants as C
from scipy import integrate, optimize, special, linalg
import mpmath as mp
import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))
rows = []
G = 'Problemas y ejemplos resueltos'

def chk(cap, name, got, exp, tol=2e-3, rel=True):
    """exp puede ser str (la cifra tal como está impresa en el texto: se exige que sea el redondeo correcto)
    o float (con tolerancia relativa tol)."""
    got = float(got)
    if isinstance(exp, str):
        dec = len(exp.split('.')[1]) if '.' in exp else 0
        t = 0.5*10**(-dec)*1.0000001
        ok = bool(abs(got-float(exp)) <= t)
        tolS = 'cifra impresa (±' + format(0.5*10**(-dec), 'g') + ')'
        expf = float(exp)
    else:
        expf = float(exp)
        err = abs(got-expf)/max(1e-300, abs(expf)) if rel else abs(got-expf)
        ok = bool(err <= tol); tolS = ('rel ' if rel else 'abs ')+str(tol)
    rows.append(dict(group=G, name=f'Cap. {cap} · {name}', got=got, exp=expf, tol=tolS, pass_=ok))
    if not ok: print('FALLA', cap, name, got, exp)

h, c, kB, e, me, hbar = C.h, C.c, C.k, C.e, C.m_e, C.hbar
hc = h*c/e*1e9   # eV·nm

def cap01():
    b, sig = C.Wien, C.Stefan_Boltzmann
    chk(1, 'Ej. Sol: λ_máx a 5772 K (nm)', b/5772*1e9, '502.0')
    chk(1, 'Ej. Sol: energía del fotón en el máximo (eV)', hc/(b/5772*1e9), '2.470')
    chk(1, 'Ej. piel a 310 K: λ_máx (µm)', b/310*1e6, '9.348')
    chk(1, 'Ej. CMB: λ_máx (mm)', b/2.725*1e3, '1.063')
    chk(1, 'Ej. Sol: emitancia σT⁴ (10⁷ W/m²)', sig*5772**4/1e7, '6.294')
    chk(1, 'Ej. piel: emitancia (W/m²)', sig*310**4, '523.7')
    chk(1, 'Ej. Sol: luminosidad 4πR²M (10²⁶ W)', 4*math.pi*(6.957e8)**2*sig*5772**4/1e26, '3.83')
    # fracción visible del Sol
    f = lambda l: math.pi*2*h*c**2/l**5/math.expm1(h*c/(l*kB*5772))
    vis = integrate.quad(f, 380e-9, 780e-9, epsrel=1e-12)[0]/(sig*5772**4)
    chk(1, 'Ej. Sol: fracción visible (%)', vis*100, '46.5')
    # Cesio a 500 nm
    E = hc/500; K = E-2.14
    chk(1, 'Ej. Cs 500 nm: E fotón (eV)', E, '2.480')
    chk(1, 'Ej. Cs 500 nm: K_máx (eV)', K, '0.340')
    chk(1, 'Ej. Cs 500 nm: v (10⁵ m/s)', math.sqrt(2*K*e/me)/1e5, '3.46')
    chk(1, 'Ej. Cs: umbral (nm)', hc/2.14, '579.4')
    # Compton 90°
    lam = 71.07e-12; lC = h/(me*c)
    lp = lam+lC
    chk(1, 'Ej. Compton 90°: Δλ (pm)', lC*1e12, '2.4263')
    chk(1, 'Ej. Compton 90°: λ′ (pm)', lp*1e12, '73.496')
    Eph = hc/(lam*1e9); Ep = hc/(lp*1e9)
    chk(1, 'Ej. Compton 90°: energía del fotón incidente (eV)', Eph, '17445.4')
    chk(1, 'Ej. Compton 90°: K del electrón (eV)', Eph-Ep, '575.9')
    chk(1, 'Ej. Compton 90°: fracción cedida (%)', (Eph-Ep)/Eph*100, '3.30')
    chk(1, 'Ej. Compton 90°: retroceso φ (°)', math.degrees(math.atan(1/(1+Eph/510998.95))), '44.04')
    chk(1, 'Compton 180° con 17.445 keV: K (eV)', hc/(lam*1e9)-hc/((lam+2*lC)*1e9), '1115.0')
    l1 = hc/1e6*1e-9
    chk(1, 'Compton 1 MeV a 180°: Δλ/λ', 2*lC/l1, '3.914')
    chk(1, 'Compton 1 MeV a 180°: K (keV)', (1e6-hc/((l1+2*lC)*1e9))/1e3, '796.5')
    # Bohr
    Rinf = C.value('Rydberg constant'); mp_ = C.m_p; md = C.value('deuteron mass'); ma = C.value('alpha particle mass')
    R = lambda M: Rinf/(1+me/M)
    chk(1, 'R_H (10⁷ m⁻¹)', R(mp_)/1e7, '1.0967758')
    lam_ = lambda ni, nf, Z, M: 1e9/(R(M)*Z*Z*(1/nf**2-1/ni**2))
    chk(1, 'Ej. Balmer: Hα (nm)', lam_(3, 2, 1, mp_), '656.47')
    chk(1, 'Ej. Balmer: Hβ (nm)', lam_(4, 2, 1, mp_), '486.27')
    chk(1, 'Ej. Balmer: límite (nm)', lam_(10**9, 2, 1, mp_), '364.71')
    chk(1, 'Ej. Lyman α (nm)', lam_(2, 1, 1, mp_), '121.57')
    chk(1, 'Ej. Hα: energía del fotón (eV)', hc/lam_(3, 2, 1, mp_), '1.8887')
    chk(1, 'Lyman: límite (nm)', lam_(10**9, 1, 1, mp_), '91.18')
    chk(1, 'Paschen α (µm)', lam_(4, 3, 1, mp_)/1e3, '1.876')
    chk(1, 'Brackett α (µm)', lam_(5, 4, 1, mp_)/1e3, '4.052')
    # Problema 4
    chk(1, 'P4: R_M del He⁺ (10⁷ m⁻¹)', R(ma)/1e7, '1.0972227')
    chk(1, 'P4: 1/λ del He⁺ 4→3 (10⁶ m⁻¹)', 4*R(ma)*(1/9-1/16)/1e6, '2.13349')
    chk(1, 'P4: λ He⁺ 4→3 (nm)', lam_(4, 3, 2, ma), '468.72')
    chk(1, 'P4: energía del fotón He⁺ 4→3 (eV)', hc/lam_(4, 3, 2, ma), '2.645')
    chk(1, 'P4: ionización del He⁺ (eV)', 4*C.value('Rydberg constant times hc in eV')*(ma/(ma+me)), '54.42')
    chk(1, 'P4: Hα del deuterio (nm)', lam_(3, 2, 1, md), '656.291')
    chk(1, 'P4: Δλ H−D (nm)', lam_(3, 2, 1, mp_)-lam_(3, 2, 1, md), '0.179')
    chk(1, 'P4: m(He-4)/m_e', ma/me, '7294.3')
    # Problema 1
    T = b/450e-9
    chk(1, 'P1: T de la estrella (K)', T, '6439.5')
    chk(1, 'P1: T⁴ (10¹⁵ K⁴)', T**4/1e15, '1.7195')
    chk(1, 'P1: M (10⁷ W/m²)', sig*T**4/1e7, '9.750')
    chk(1, 'P1: M/M_sol', (T/5772)**4, '1.549')
    chk(1, 'P1: exceso de T sobre el Sol (%)', (T/5772-1)*100, '11.6')
    # Problema 2
    E = hc/300
    chk(1, 'P2: fotón 300 nm (eV)', E, '4.1328')
    chk(1, 'P2: K_máx Na (eV)', E-2.75, '1.3828')
    chk(1, 'P2: K_máx (10⁻¹⁹ J)', (E-2.75)*e/1e-19, '2.2155')
    chk(1, 'P2: v (10⁵ m/s)', math.sqrt(2*(E-2.75)*e/me)/1e5, '6.97')
    chk(1, 'P2: v/c (%)', math.sqrt(2*(E-2.75)*e/me)/c*100, '0.23')
    chk(1, 'P2: umbral (nm)', hc/2.75, '450.85')
    chk(1, 'P2: ν₀ (10¹⁴ Hz)', 2.75*e/h/1e14, '6.649')
    # Problema 3
    chk(1, 'P3: E′ (eV)', hc/(lp*1e9), '16869.4')
    chk(1, 'P3: tan φ = p′/p', (hc/(lp*1e9))/(Eph), '0.9670')
    chk(1, 'P3: p_e (keV/c)', math.hypot(Eph, hc/(lp*1e9))/1e3, '24.27')
    chk(1, 'P3: K relativista (keV)', math.sqrt((math.hypot(Eph, hc/(lp*1e9))/1e3)**2+510.999**2)-510.999, '0.5759')
    # Problema 5
    chk(1, 'P5: λ del electrón a 54 V (nm)', 1.2264/math.sqrt(54), '0.16689')
    lam54 = h/math.sqrt(2*me*54*e)*1e9
    chk(1, 'P5: λ a 54 V no relat. (nm, 4 cifras)', lam54, '0.1669')
    chk(1, 'P5: sin φ', lam54/0.215, '0.776')
    chk(1, 'P5: φ de Bragg (°)', math.degrees(math.asin(lam54/0.215)), '50.9')
    chk(1, 'P5: neutrón térmico K (10⁻²¹ J)', 1.5*kB*300/1e-21, '6.213')
    chk(1, 'P5: λ neutrón (10⁻¹⁰ m)', h/math.sqrt(2*C.m_n*1.5*kB*300)/1e-10, '1.452')
    Kk = 100e3
    ex = hc/math.sqrt(Kk*(Kk+2*510998.95))*1e3
    nr = hc/math.sqrt(2*510998.95*Kk)*1e3
    chk(1, 'P5: λ relativista 100 kV (pm)', ex, '3.7014')
    chk(1, 'P5: λ no relativista 100 kV (pm)', nr, '3.8783')
    chk(1, 'P5: error relativo (%)', (nr/ex-1)*100, '4.78')
    chk(1, 'D–G a 100 V: λ (nm)', 1.2264/10, '0.1226')
    chk(1, 'D–G a 100 V: φ (°)', math.degrees(math.asin(0.12264/0.215)), '34.8')
    chk(1, 'Segundo orden aparece a V ≈ (V)', (1.2264/(0.215/2))**2, 130, 2e-3)
    chk(1, 'C60 a 117 m/s: λ (pm)', h/(720.642*C.u*117)*1e12, '4.7')
    chk(1, 'Pelota 0.145 kg a 40 m/s: λ (10⁻³⁴ m)', h/(0.145*40)/1e-34, '1.14')
    chk(1, 'He a 54 eV: λ (pm)', h/math.sqrt(2*6.6464731e-27*54*e)*1e12, '1.95')
    chk(1, 'Neutrón a 54 eV: λ (pm)', h/math.sqrt(2*C.m_n*54*e)*1e12, '3.89')
    # Problema 6
    chk(1, 'P6: 6ζ(4)=π⁴/15', 6*float(mp.zeta(4)), math.pi**4/15, 1e-12)
    chk(1, 'P6: 2π⁵', 2*math.pi**5, '612.039')
    chk(1, 'P6: k_B⁴ (10⁻⁹²)', kB**4/1e-92, '3.6336')
    chk(1, 'P6: h³ (10⁻¹⁰⁰)', h**3/1e-100, '2.9092')
    chk(1, 'P6: c² (10¹⁶)', c**2/1e16, '8.9876')
    chk(1, 'P6: σ (10⁻⁸)', 2*math.pi**5*kB**4/(15*h**3*c**2)/1e-8, '5.6704')
    # Planck sim-guide
    x = lambda l, T: hc*1e-0/l/(8.617333262e-5*T)
    r = lambda l, T: math.expm1(x(l, T))/x(l, T)
    chk(1, 'Sim: RJ/Planck a 400 nm y 5772 K', r(400, 5772), '81.5')
    chk(1, 'Sim: RJ/Planck a 4 µm y 5772 K', r(4000, 5772), '1.39')
    f2 = lambda l: math.pi*2*h*c**2/l**5/math.expm1(h*c/(l*kB*2000))
    chk(1, 'Sim: fracción visible a 2000 K (%)', integrate.quad(f2, 380e-9, 780e-9, epsrel=1e-12)[0]/(sig*2000**4)*100, '1.67')
    chk(1, 'Sim: λ_máx a 2000 K (µm)', b/2000*1e6, '1.449')
    chk(1, 'Sim: φ Hα Z²: cociente de masa H/e', mp_/me, '1836.15')


def cap02():
    x, L, u = sp.symbols('x L u', positive=True)
    chk(2, 'Gaussiana: A = (2π)^(-1/4) para σ = 1', (2*math.pi)**-0.25, '0.63162')
    from scipy.stats import norm
    chk(2, 'Gaussiana: P(|x|<σ) (%)', (norm.cdf(1)-norm.cdf(-1))*100, '68.27')
    chk(2, 'Gaussiana: P(|x|<2σ) (%)', (norm.cdf(2)-norm.cdf(-2))*100, '95.45')
    xx = sp.symbols('xx', real=True); sg = sp.symbols('sg', positive=True)
    A2g = 1/sp.integrate(sp.exp(-xx**2/(2*sg**2)), (xx, -sp.oo, sp.oo))
    chk(2, 'Ej. gaussiana: <x²> = σ² (SymPy)', float(sp.simplify(A2g*sp.integrate(xx**2*sp.exp(-xx**2/(2*sg**2)), (xx, -sp.oo, sp.oo))/sg**2)), '1.0')
    # P1 parábola
    I = lambda f, a, b: sp.integrate(f, (u, a, b))
    n0 = I(u**2*(1-u)**2, 0, 1); chk(2, 'P1: ∫u²(1-u)² = 1/30', float(n0), 1/30, 1e-12)
    chk(2, 'P1: <u> (·L)', float(30*I(u**3*(1-u)**2, 0, 1)), '0.5')
    chk(2, 'P1: <u²> = 2/7', float(30*I(u**4*(1-u)**2, 0, 1)), 2/7, 1e-12)
    chk(2, 'P1: Δx/L', math.sqrt(2/7-1/4), '0.18898', )
    chk(2, 'P1: ∫(1/4→3/4) = 0.0264323', float(I(u**2*(1-u)**2, sp.Rational(1, 4), sp.Rational(3, 4))), '0.02643')
    chk(2, 'P1: F(3/4) = 0.0298828', float(30*I(u**2*(1-u)**2, 0, sp.Rational(3, 4))*0+(sp.Rational(3,4)**3/3-sp.Rational(3,4)**4/2+sp.Rational(3,4)**5/5)), '0.02988')
    chk(2, 'P1: F(1/4) = 0.0034505', float(sp.Rational(1,4)**3/3-sp.Rational(1,4)**4/2+sp.Rational(1,4)**5/5), '0.00345')
    chk(2, 'P1: P(tercio central) = 203/256', float(30*I(u**2*(1-u)**2, sp.Rational(1, 4), sp.Rational(3, 4))), '0.79297')
    chk(2, 'P1: 203/256', 203/256, '0.79297')
    chk(2, 'P1: P(central) en %', 203/256*100, '79.3')
    # caja
    f = lambda k: sp.sqrt(2/L)*sp.sin(k*sp.pi*x/L)
    x12 = sp.simplify(sp.integrate(f(1)*x*f(2), (x, 0, L)))
    chk(2, 'Ej. caja: x12/L = -16/(9π²)', float((x12/L).subs(L, 1)), -16/(9*math.pi**2), 1e-12)
    chk(2, 'Ej. caja: amplitud 16/(9π²)', 16/(9*math.pi**2), '0.1801')
    chk(2, 'Ej. caja: x11 = L/2', float(sp.simplify(sp.integrate(f(1)*x*f(1), (x, 0, L))/L)), '0.5')
    chk(2, 'Ej. caja: x13 = 0 (paridad)', float(sp.simplify(sp.integrate(f(1)*x*f(3), (x, 0, L))/L)), 0.0, 1e-12, rel=False)
    chk(2, 'P2: ∫x cos(πx/L) = -2L²/π²  (L=1)', float(sp.integrate(x*sp.cos(sp.pi*x), (x, 0, 1))), -2/math.pi**2, 1e-12)
    chk(2, 'P2: ∫x cos(3πx/L) = -2L²/(9π²)', float(sp.integrate(x*sp.cos(3*sp.pi*x), (x, 0, 1))), -2/(9*math.pi**2), 1e-12)
    E1 = math.pi**2*hbar**2/(2*me*1e-18)/e
    chk(2, 'Ej. caja 1 nm: E₁ (eV)', E1, '0.37603')
    chk(2, 'Ej. caja: E₂−E₁ (eV)', 3*E1, '1.1281')
    w = 3*E1*e/hbar
    chk(2, 'Ej. caja: ω₂₁ (10¹⁵ rad/s)', w/1e15, '1.714')
    chk(2, 'P2: ω₂₁ (10¹⁵ rad/s, 5 cifras)', w/1e15, '1.7139')
    chk(2, 'Ej. caja: T (fs)', 2*math.pi/w*1e15, '3.666')
    chk(2, 'Ej. caja: amplitud (nm)', 16/(9*math.pi**2), '0.180', )
    chk(2, 'Ej. caja: λ de la radiación (nm)', hc/(3*E1), '1099')
    # P3
    k = math.sqrt(2*me*e)/hbar
    chk(2, 'P3: k del electrón de 1 eV (10⁹ m⁻¹)', k/1e9, '5.1232')
    chk(2, 'P3: v (10⁵ m/s)', hbar*k/me/1e5, '5.931')
    chk(2, 'P3: 0.75 v (10⁵ m/s)', 0.75*hbar*k/me/1e5, '4.448')
    # P4: ∫ j dx con el paquete (numérico)
    k0, sgm = 5.0, 1.3
    xs = np.linspace(-12, 12, 20001); psi = (2*math.pi*sgm**2)**-0.25*np.exp(1j*k0*xs-xs**2/(4*sgm**2))
    dpsi = np.gradient(psi, xs); jj = np.imag(np.conj(psi)*dpsi)
    chk(2, 'P4: ∫ j dx = ħk₀/m (ħ=m=1, numérico)', np.trapezoid(jj, xs), '5.0000')
    chk(2, 'P4: ∫ ρ dx = 1', np.trapezoid(np.abs(psi)**2, xs), '1.0000')
    # P5: Jönsson
    K = 50e3; mc2 = 510998.95
    lam = hc/math.sqrt(K*(K+2*mc2))*1e-9
    chk(2, 'P5: λ relativista a 50 keV (pm)', lam*1e12, '5.3553')
    lnr = hc/math.sqrt(2*mc2*K)*1e-9
    chk(2, 'P5: λ no relativista a 50 keV (pm)', lnr*1e12, '5.4847')
    chk(2, 'P5: corrección relativista (%)', (lnr/lam-1)*100, '2.4', 1e-2, rel=True) if False else chk(2, 'P5: λ no relat./relat. − 1 (%)', (lnr/lam-1)*100, '2.4')
    chk(2, 'P5: 2K+mc² factor', 2*mc2+K, 1071997.9, 1e-6)
    chk(2, 'P5: interfranja (µm)', lam*0.35/2e-6*1e6, '0.937')
    chk(2, 'P5: primer cero (µm)', lam*0.35/0.5e-6*1e6, '3.749')
    lam10 = hc/math.sqrt(1e4*(1e4+2*mc2))*1e-9; lam200 = hc/math.sqrt(2e5*(2e5+2*mc2))*1e-9
    chk(2, 'Sim: λ a 10 keV (pm)', lam10*1e12, '12.2'); chk(2, 'Sim: interfranja a 10 keV (µm)', lam10*0.35/2e-6*1e6, '2.1')
    chk(2, 'Sim: λ a 200 keV (pm)', lam200*1e12, '2.51'); chk(2, 'Sim: interfranja a 200 keV (µm)', lam200*0.35/2e-6*1e6, '0.44')
    chk(2, 'Sim: λ a 50 keV (pm, 3 cifras)', lam*1e12, '5.355')
    # P6
    chk(2, 'P6: τ = ħ/Γ para Γ = 4.11×10⁻⁷ eV (ns)', hbar/(4.11e-7*e)*1e9, '1.60')
    chk(2, 'P6: ħ (10⁻¹⁶ eV·s)', hbar/e/1e-16, '6.5821')
    chk(2, 'P6: τ(Γ = 1 eV) (fs)', hbar/e*1e15, '0.658')
    chk(2, 'P6: τ(Γ = 1 meV) (ps)', hbar/(1e-3*e)*1e12, '0.658')


def cap03():
    mp_, u = C.m_p, C.u
    # P1: electrón de 100 eV
    E = 100*e
    vg = math.sqrt(2*E/me)
    chk(3, 'P1: v_g del electrón de 100 eV (10⁶ m/s)', vg/1e6, '5.931')
    chk(3, 'P1: v_f (10⁶ m/s)', vg/2/1e6, '2.965')
    chk(3, 'P1: v_g/c', vg/c, '0.0198')
    chk(3, 'P1: λ = 1.2264/√100 (nm)', 1.2264/10, '0.12264')
    lam_rel = h*c/math.sqrt(100*e*(100*e+2*me*c**2))
    chk(3, 'P1: λ relativista exacta (nm, 4 cifras)', lam_rel*1e9, '0.1226')
    vrel = c*math.sqrt(1-1/(1+100*e/(me*c**2))**2)
    chk(3, 'P1: error relativista de v (%)', (vg/vrel-1)*100, '0.015')
    # P2: t*
    ts = lambda m, s: 2*m*s**2/hbar
    tse = ts(me, 1e-10)
    chk(3, 'P2: t* electrón (10⁻¹⁶ s)', tse/1e-16, '1.7276')
    chk(3, 'P2: t* electrón (fs)', tse*1e15, '0.173', )
    chk(3, 'P2: t/t* a 1 fs', 1e-15/tse, '5.788')
    chk(3, 'P2: (t/t*)² a 1 fs', (1e-15/tse)**2, '33.51')
    chk(3, 'P2: σ(1 fs) (Å)', math.sqrt(1+(1e-15/tse)**2), '5.874')
    chk(3, 'P2: σ(10 fs) (Å)', math.sqrt(1+(1e-14/tse)**2), '57.9')
    tsp = ts(mp_, 1e-10)
    chk(3, 'P2: t* protón (10⁻¹³ s)', tsp/1e-13, '3.172')
    chk(3, 'P2: t* protón (fs)', tsp*1e15, '317', )
    chk(3, 'P2: t/t* protón a 1 fs (10⁻³)', 1e-15/tsp/1e-3, '3.15')
    chk(3, 'P2: σ protón 1 fs − 1 (×10⁻⁶ Å)', (math.sqrt(1+(1e-15/tsp)**2)-1)/1e-6, '5.0', )
    chk(3, 'P2: σ protón a 10 fs (Å)', math.sqrt(1+(1e-14/tsp)**2), '1.0005')
    chk(3, 'P2: ensanchamiento protón a 10 fs (%)', (math.sqrt(1+(1e-14/tsp)**2)-1)*100, '0.05')
    tsb = ts(0.145, 1e-3)
    chk(3, 'P2: t* pelota (10²⁷ s)', tsb/1e27, '2.75')
    yr = 365.25*86400
    chk(3, 'P2: t* pelota (10¹⁹ años)', tsb/yr/1e19, '8.7')
    chk(3, 'P2: t*/edad del Universo (10⁹)', tsb/(13.8e9*yr)/1e9, '6.3', )
    chk(3, 'P2: cambio relativo de σ en 1 s (10⁻⁵⁶)', (1/tsb)**2/2/1e-56, '6.6', )
    # Sim guide
    chk(3, 'Sim: v_g con k0 = 3 Å⁻¹ (10⁶ m/s)', hbar*3e10/me/1e6, '3.47')
    chk(3, 'Sim: energía cinética media (eV)', (hbar*3e10)**2/(2*me)/e, '34.3')
    chk(3, 'Sim: t* C60 σ0 = 1 Å (ns)', ts(720.642*u, 1e-10)*1e9, '0.23')
    chk(3, 'Sim: cociente t* protón/electrón', mp_/me, '1836', )
    # P3
    dp = hbar/(2e-10)
    chk(3, 'P3: Δp (10⁻²⁵ kg m/s)', dp/1e-25, '5.273')
    chk(3, 'P3: Δp²/2m (eV)', dp**2/(2*me)/e, '0.952')
    chk(3, 'P3: Δp²/2m (10⁻¹⁹ J)', dp**2/(2*me)/1e-19, '1.526')
    chk(3, 'P3: ΔxΔp en t* en unidades de ħ', math.sqrt(2)/2, '0.7071')
    # P4
    tau = 98.3e-9/math.log(2)
    chk(3, 'P4: τ del ⁵⁷Fe (ns)', tau*1e9, '141.8')
    chk(3, 'P4: Γ (neV)', hbar/tau/e*1e9, '4.64')
    chk(3, 'P4: Γ/E (10⁻¹³)', hbar/tau/e/14400/1e-13, '3.2')
    chk(3, 'Ej. 2p: Γ/E (10⁻⁸)', 4.11e-7/10.2/1e-8, '4.0')
    ER = 14400**2/(2*57*931.494e6)
    chk(3, 'Ej. Mössbauer: energía de retroceso (meV)', ER*1e3, '1.95')
    chk(3, 'Ej. Mössbauer: retroceso/Γ (10⁵)', ER/(hbar/tau/e)/1e5, '4.2', )
    # P5 con SymPy
    x, a = sp.symbols('x a', positive=True)
    psi = 1-x/a
    n_ = 2*sp.integrate(psi**2, (x, 0, a)); k2 = 2*sp.integrate(sp.diff(psi, x)**2, (x, 0, a))/n_
    x2 = 2*sp.integrate(x**2*psi**2, (x, 0, a))/n_
    chk(3, 'P5: triangular ∫ψ² = 2a/3', float(n_.subs(a, 1)), 2/3, 1e-12)
    chk(3, 'P5: triangular Δk² = 3/a²', float(k2.subs(a, 1)), 3.0, 1e-12)
    chk(3, 'P5: triangular ⟨x²⟩ = a²/10', float(x2.subs(a, 1)), 0.1, 1e-12)
    chk(3, 'P5: triangular producto √0.3', math.sqrt(float(x2.subs(a, 1))*float(k2.subs(a, 1))), '0.5477')
    ps2 = sp.exp(-x/a); n2 = 2*sp.integrate(ps2**2, (x, 0, sp.oo)); k22 = 2*sp.integrate(sp.diff(ps2, x)**2, (x, 0, sp.oo))/n2
    x22 = 2*sp.integrate(x**2*ps2**2, (x, 0, sp.oo))/n2
    chk(3, 'P5: exponencial ∫ψ² = a', float(n2.subs(a, 1)), 1.0, 1e-12)
    chk(3, 'P5: exponencial Δk² = 1/a²', float(k22.subs(a, 1)), 1.0, 1e-12)
    chk(3, 'P5: exponencial ⟨x²⟩ = a²/2', float(x22.subs(a, 1)), 0.5, 1e-12)
    chk(3, 'P5: exponencial producto 1/√2', math.sqrt(float(x22.subs(a, 1))*float(k22.subs(a, 1))), '0.7071')
    # sech y gaussiana (sim)
    xs = np.linspace(-60, 60, 600001)
    for name, f, exp_ in (('sech', lambda t: 1/np.cosh(t), math.pi/6), ('gauss', lambda t: np.exp(-t**2/4), 0.5)):
        ff = f(xs); n = np.trapezoid(ff**2, xs); x2 = np.trapezoid(xs**2*ff**2, xs)/n; k2 = np.trapezoid(np.gradient(ff, xs)**2, xs)/n
        chk(3, f'Sim: {name} Δx·Δk', math.sqrt(x2*k2), exp_, 1e-6)
    chk(3, 'Sim: π/6', math.pi/6, '0.5236')
    # P6
    chk(3, 'P6: σ(t*) = √2 σ0', math.sqrt(1+1), '1.414')
    # Gaussiana: Δk = 1/2σ
    chk(3, 'Sim: Δx·Δk de la gaussiana', 0.5, '0.5000')


def cap04():
    n = np.arange(1, 4000, 2)
    P = 960/(n*math.pi)**6
    chk(4, 'Ej. caja: P₁ = 960/π⁶', P[0], '0.99856')
    chk(4, 'Ej. caja: P₁ en %', P[0]*100, '99.86', 1e-3) if False else chk(4, 'Ej. caja: P₁ (%, 3 decimales)', P[0]*100, '99.856')
    chk(4, 'Ej. caja: P₃', P[1], '0.00137')
    chk(4, 'Ej. caja: P₅ (10⁻⁵)', P[2]/1e-5, '6.4')
    chk(4, 'P2: Σ P_n = 1', P.sum(), 1.0, 1e-12)
    chk(4, 'P2: Σ_{impar} n⁻⁶ = π⁶/960', (1.0/n.astype(float)**6).sum(), math.pi**6/960, 1e-12)
    chk(4, 'P2: (63/64)ζ(6) = π⁶/960', 63/64*float(mp.zeta(6)), math.pi**6/960, 1e-12)
    chk(4, 'P2: ⟨E⟩/E₁ por la serie', (P*n.astype(float)**2).sum(), 10/math.pi**2, 1e-8)
    chk(4, 'P2: ⟨E⟩/E₁ = 10/π²', 10/math.pi**2, '1.0132')
    chk(4, 'P2: ⟨E⟩ = 5ħ²/mL² (en unidades de π²/2 = E₁)', 5/(math.pi**2/2), 10/math.pi**2, 1e-12)
    chk(4, 'P2: Σ_{impar} n⁻⁴ = π⁴/96', (1.0/n.astype(float)**4).sum(), math.pi**4/96, 1e-9)
    chk(4, 'Ej. caja: P₁ en dos términos: 1 − P₁ = error N=1 (10⁻³)', (1-P[0])/1e-3, '1.44')
    chk(4, 'Sim: error con N=3 (10⁻⁵)', (1-P[0]-P[1])/1e-5, '7.5')
    chk(4, 'Ej. caja: 64·15 = 960', 64*15, 960, 1e-12)
    # coeficiente c_n con SymPy
    x, L = sp.symbols('x L', positive=True); k = sp.symbols('k', positive=True, integer=True)
    cn = sp.simplify(sp.integrate(x*(1-x)*sp.sin(k*sp.pi*x), (x, 0, 1)))
    chk(4, 'P2: ∫u(1-u) sin(nπu) du para n = 1: 4/π³', float(cn.subs(k, 1)), 4/math.pi**3, 1e-12)
    chk(4, 'P2: ∫ para n = 3: 4/(27π³)', float(cn.subs(k, 3)), 4/(27*math.pi**3), 1e-12)
    chk(4, 'P2: ∫ para n = 2 = 0', float(cn.subs(k, 2)), 0.0, 1e-12, rel=False)
    chk(4, 'P2: c₁ = √60·4/π³ = 8√15/π³', math.sqrt(60)*4/math.pi**3, 8*math.sqrt(15)/math.pi**3, 1e-12)
    # P4: caja n=1
    xs = np.linspace(0, 1, 400001); psi = math.sqrt(2)*np.sin(math.pi*xs)
    x2 = np.trapezoid(xs**2*psi**2, xs); x1 = np.trapezoid(xs*psi**2, xs)
    chk(4, 'P4: ⟨x²⟩/L²', x2, '0.28267'); chk(4, 'P4: ⟨x²⟩/L² = 1/3 − 1/(2π²)', 1/3-1/(2*math.pi**2), x2, 1e-9)
    dx_ = math.sqrt(x2-x1**2)
    chk(4, 'P4: Δx/L', dx_, '0.18076'); chk(4, 'P4: Δx²/L²', x2-x1**2, '0.03267')
    chk(4, 'Ej. caja: Δx/L (4 cifras)', dx_, '0.1808') if False else chk(4, 'Ej. caja: Δx/L (3 cifras)', dx_, '0.181')
    chk(4, 'P4: ΔxΔp/ħ', dx_*math.pi, '0.56786')
    chk(4, 'Ej. caja: ΔxΔp/ħ (4 cifras)', dx_*math.pi, '0.5679')
    chk(4, 'P4: cociente con ħ/2', 2*dx_*math.pi, '1.1357')
    chk(4, 'Ej. caja: cociente = √(π²/3−2)', math.sqrt(math.pi**2/3-2), 2*dx_*math.pi, 1e-8)
    chk(4, 'Ej. caja: margen sobre la cota (%)', (math.sqrt(math.pi**2/3-2)-1)*100, '13.6')
    chk(4, 'Ej. caja: cociente (4 cifras)', math.sqrt(math.pi**2/3-2), '1.1357')
    # P5 virial
    chk(4, 'P5: ⟨V⟩ = 2E₁ del H (eV)', 2*-13.606, '-27.212', ) if False else chk(4, 'P5: ⟨V⟩ = 2E₁ del H con E₁ = −13.6057 (eV)', 2*-13.6057, '-27.211')
    # P6 matriz
    A = np.array([[2, 1-1j], [1+1j, 3]]); w, v = np.linalg.eigh(A)
    chk(4, 'P6: valor propio 1', w[0], '1.0000'); chk(4, 'P6: valor propio 4', w[1], '4.0000')
    psi0 = np.array([1, 0]); pr = np.abs(v.conj().T@psi0)**2
    chk(4, 'P6: P(λ=1)', pr[0], 2/3, 1e-12); chk(4, 'P6: P(λ=4)', pr[1], 1/3, 1e-12)
    chk(4, 'P6: ⟨A⟩', (psi0.conj()@A@psi0).real, '2.0000')
    A2 = A@A; chk(4, 'P6: (A²)₁₁', A2[0, 0].real, '6.0000')
    chk(4, 'P6: ΔA', math.sqrt((A2[0, 0]-A[0, 0]**2).real), '1.414')
    v1 = np.array([-1+1j, 1])/math.sqrt(3); v4 = np.array([1-1j, 2])/math.sqrt(6)
    chk(4, 'P6: A v₁ = 1·v₁', np.linalg.norm(A@v1-v1), 0.0, 1e-12, rel=False); chk(4, 'P6: A v₄ = 4·v₄', np.linalg.norm(A@v4-4*v4), 0.0, 1e-12, rel=False)
    chk(4, 'P6: ⟨v₁|v₄⟩ = 0', abs(np.vdot(v1, v4)), 0.0, 1e-12, rel=False)
    # conmutadores simbólicos (SymPy): cada identidad se verifica restando ambos lados
    xx, hb = sp.symbols('xx hbar', positive=True); f = sp.Function('f')(xx)
    pop = lambda g: -sp.I*hb*sp.diff(g, xx)
    ok1 = sp.simplify(xx*pop(f)-pop(xx*f)-sp.I*hb*f) == 0
    ok2 = sp.simplify(xx**2*pop(f)-pop(xx**2*f)-2*sp.I*hb*xx*f) == 0
    ok3 = sp.simplify(xx*pop(pop(f))-pop(pop(xx*f))-2*sp.I*hb*pop(f)) == 0
    ok4 = sp.simplify(sp.Rational(1, 2)*(xx*pop(f)+pop(xx*f))-(xx*pop(f)-sp.I*hb/2*f)) == 0
    for nm, ok in (('P1: [x,p] = iħ', ok1), ('P3: [x²,p] = 2iħ x', ok2), ('P3: [x,p²] = 2iħ p', ok3), ('P1: ½(xp+px) = xp − iħ/2', ok4)):
        chk(4, nm + ' (SymPy)', 1.0 if ok else 0.0, '1.0')
    # Ehrenfest / sim
    chk(4, 'Sim: ⟨E⟩ medidas 0.5,0.3,0.2 (E₁)', 0.5*1+0.3*4+0.2*9, '3.5')
    chk(4, 'Sim: ⟨E⟩ de ψ₂+0.5ψ₅', 0.8*4+0.2*25, '8.2')
    chk(4, 'Sim: error de N con 80 % del contenido', 1-0.8, '0.2')
    chk(4, 'Sim: σ(N=100) en puntos porcentuales (p=0.5)', math.sqrt(0.25/100)*100, '5.0')
    chk(4, 'Sim: σ(N=10⁵) en puntos porcentuales (p=0.5)', math.sqrt(0.25/1e5)*100, '0.16')

cap01()
cap02()
cap03()
cap04()

# Capítulos 5 en adelante: un archivo por capítulo en tests/caps/ (se ejecutan en orden con las utilidades de este módulo)
import glob, importlib.util
for _f in sorted(glob.glob(os.path.join(HERE, 'caps', 'cap*.py'))):
    _spec = importlib.util.spec_from_file_location(os.path.basename(_f)[:-3], _f); _m = importlib.util.module_from_spec(_spec)
    _m.__dict__.update(dict(chk=chk, math=math, np=np, sp=sp, mp=mp, C=C, linalg=linalg, integrate=integrate, optimize=optimize, special=special, h=h, c=c, kB=kB, e=e, me=me, hbar=hbar, hc=hc, os=os))
    _spec.loader.exec_module(_m)

if __name__ == '__main__':
    out = [dict(group=r['group'], name=r['name'], got=r['got'], exp=r['exp'], tol=r['tol'], **{'pass': r['pass_']}) for r in rows]
    json.dump(dict(rows=out), open(os.path.join(HERE, 'problemas.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    bad = [r for r in out if not r['pass']]
    print(f'{len(out)-len(bad)} de {len(out)} cifras de problemas verificadas', '' if not bad else f'· {len(bad)} FALLAN')
