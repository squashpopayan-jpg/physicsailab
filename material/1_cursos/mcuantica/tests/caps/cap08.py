# -*- coding: utf-8 -*-
# Capítulo 8: escalones, barreras y túnel (unidades eV y nm donde se indica)
HB2M = hbar**2/me/e*1e18          # ħ²/mₑ (eV·nm²)
HB2M2 = HB2M/2                     # ħ²/2mₑ
def Tbar(E, V0, a, m=1.0):         # m: masa en unidades de ħ = 1 (m = mr/HB2M)
    if E < V0:
        k = math.sqrt(2*m*(V0-E)); return 1/(1+V0**2*math.sinh(k*a)**2/(4*E*(V0-E)))
    k = math.sqrt(2*m*(E-V0)); return 1/(1+V0**2*math.sin(k*a)**2/(4*E*(E-V0)))
# --- escalón ---
k1 = math.sqrt(5/HB2M2); k2 = math.sqrt(2/HB2M2)
chk(8, 'P1: k (nm⁻¹)', k1, '11.46'); chk(8, 'P1: k′ (nm⁻¹)', k2, '7.245'); chk(8, 'P1: k′/k', k2/k1, '0.6325')
R = ((k1-k2)/(k1+k2))**2
chk(8, 'P1/Ej.: R', R, '0.0507'); chk(8, 'P1/Ej.: T', 1-R, '0.9493'); chk(8, 'P1: T = 4kk′/(k+k′)²', 4*k1*k2/(k1+k2)**2, '0.9493'); chk(8, 'Ej.: t = 2k/(k+k′)', 2*k1/(k1+k2), '1.2251'); chk(8, 'Ej.: |t|²', (2*k1/(k1+k2))**2, '1.50'); chk(8, 'Ej.: T = (k′/k)|t|²', k2/k1*(2*k1/(k1+k2))**2, '0.949')
kap = math.sqrt(1/HB2M2); chk(8, 'P1: κ con E = 2 eV (nm⁻¹)', kap, '5.123'); chk(8, 'P1: 1/κ (nm)', 1/kap, '0.195')
for E, v in ((1.5, '0.0718'), (2.5, '0.0161')):
    a_, b_ = math.sqrt(2*E), math.sqrt(2*(E-1)); chk(8, f'Ej./Sim: R del escalón con E = {E}V₀', ((a_-b_)/(a_+b_))**2, v)
chk(8, 'Ej.: T con E = 1.5V₀', 1-((math.sqrt(3)-1)/(math.sqrt(3)+1))**2, '0.9282')
r15 = (math.sqrt(3)-1)/(math.sqrt(3)+1); chk(8, 'Sim: r con E = 1.5', r15, '0.2679'); chk(8, 'Sim: t con E = 1.5', 2*math.sqrt(3)/(math.sqrt(3)+1), '1.2679'); chk(8, 'Sim: |t|² con E = 1.5', (2*math.sqrt(3)/(math.sqrt(3)+1))**2, '1.608')
chk(8, 'Sim: 1/κ con E = 0.9V₀', 1/math.sqrt(2*0.1), '2.24'); chk(8, 'Sim: 1/κ con E = 0.5V₀', 1/math.sqrt(2*0.5), '1.0')
# --- barrera ---
m = 1/HB2M
kp = math.sqrt(2*m*0.5); a_ = 0.5; chk(8, 'Ej./P2: κ (nm⁻¹)', kp, '3.623'); chk(8, 'P2: κ (4 decimales)', kp, '3.6226'); chk(8, 'Ej./P2: κa', kp*a_, '1.811'); chk(8, 'P2: κa (4 decimales)', kp*a_, '1.8113'); chk(8, 'Ej.: 1/κ (nm)', 1/kp, '0.276')
chk(8, 'P2: e^{κa}', math.exp(kp*a_), '6.1185'); chk(8, 'P2: e^{−κa}', math.exp(-kp*a_), '0.1634'); chk(8, 'P2: sinh κa', math.sinh(kp*a_), '2.9775'); chk(8, 'Ej.: sinh κa', math.sinh(kp*a_), '2.978'); chk(8, 'P2: sinh²', math.sinh(kp*a_)**2, '8.866')
Tx = Tbar(0.5, 1, 0.5, m)
chk(8, 'Ej./P2: T exacta', Tx, '0.1014'); chk(8, 'P2: 1/(1+8.8656)', 1/(1+8.8656), '0.1014')
Tg = 16*0.25*math.exp(-2*kp*a_); chk(8, 'Ej./P2: T barrera gruesa', Tg, '0.1068'); chk(8, 'P2: e^{−2κa}', math.exp(-2*kp*a_), '0.02671'); chk(8, 'P2: error relativo de la barrera gruesa (%)', (Tg/Tx-1)*100, '5.4')
chk(8, 'Ej./P5: primera resonancia (eV)', 1+math.pi**2/(2*m*a_**2), '2.504'); chk(8, 'P5: π²ħ²/2ma² (eV)', math.pi**2/(2*m*a_**2), '1.504'); chk(8, 'P5: E₂ (eV)', 1+4*math.pi**2/(2*m*a_**2), '7.016')
Em1 = 1+0.25*math.pi**2/(2*m*a_**2); chk(8, 'P2/P5: primer mínimo (eV)', Em1, '1.376'); chk(8, 'P2/P5: T en el primer mínimo', Tbar(Em1, 1, a_, m), '0.674'); chk(8, 'P2: T mín (4 cifras)', Tbar(Em1, 1, a_, m), '0.6742'); chk(8, 'P2: 1/(4·1.376·0.376)', 1/(4*1.376*0.376), '0.4832')
Em2 = 1+2.25*math.pi**2/(2*m*a_**2); chk(8, 'P5: segundo mínimo (eV)', Em2, '4.384'); chk(8, 'P5: T en el segundo mínimo', Tbar(Em2, 1, a_, m), '0.983')
chk(8, 'Sim: T a E = 0.9 V₀', Tbar(0.9, 1, 0.5, m), '0.307'); chk(8, 'Sim: T gruesa a 0.9 V₀', 16*0.9*0.1*math.exp(-2*math.sqrt(2*m*0.1)*0.5), '0.285')
chk(8, 'Sim: resonancia con a = 2 nm (V₀)', 1+math.pi**2/(2*m*4), '1.094')
mp_ = 1836.15267/HB2M; md_ = 3670.48297/HB2M
chk(8, 'Sim: T del protón a E = 1.5 V₀ (a = 0.1 nm)', Tbar(1.5, 1, 0.1, mp_), '0.989'); chk(8, 'Sim: T del protón a E = V₀/2', Tbar(0.5, 1, 0.1, mp_)/1e-13, '1.3'); chk(8, 'Sim: T del deuterón a E = V₀/2 (10⁻¹⁹)', Tbar(0.5, 1, 0.1, md_)/1e-19, '3.5')
chk(8, 'Ej.: cociente H/D (1 eV, 0.1 nm) (10⁵)', Tbar(0.5, 1, 0.1, mp_)/Tbar(0.5, 1, 0.1, md_)/1e5, '3.8')
Tp = Tbar(0.25, 0.5, 0.05, mp_); Td = Tbar(0.25, 0.5, 0.05, md_)
chk(8, 'Ej./P4: T_H (10⁻⁵)', Tp/1e-5, '6.8'); chk(8, 'Ej./P4: T_D (10⁻⁷)', Td/1e-7, '7.3'); chk(8, 'Ej./P4: T_H/T_D', Tp/Td, '94')
kH = math.sqrt(2*mp_*0.25); kD = math.sqrt(2*md_*0.25)
chk(8, 'P4: κ_H (nm⁻¹)', kH, '109.8'); chk(8, 'P4: κ_H a', kH*0.05, '5.49'); chk(8, 'P4: κ_D (nm⁻¹)', kD, '155.2'); chk(8, 'P4: κ_D a', kD*0.05, '7.76')
chk(8, 'P4: e^{−2κ_H a} (10⁻⁵)', math.exp(-2*kH*0.05)/1e-5, '1.7'); chk(8, 'P4: e^{−2κ_D a} (10⁻⁷)', math.exp(-2*kD*0.05)/1e-7, '1.8'); chk(8, 'P4: prefactor', 16*0.25*0.25/0.25, '4.0'); chk(8, 'P4: κ_D − κ_H', kD-kH, '45.4'); chk(8, 'P4: exponente de H/D', 2*0.05*(kD-kH), '4.54'); chk(8, 'P4: e^{4.54}', math.exp(4.54), '93.7', ) if False else chk(8, 'P4: e^{4.54} ≈ 94', math.exp(4.54), 94, 5e-3)
# --- STM ---
ks = math.sqrt(4.5/HB2M2)/10   # Å⁻¹
chk(8, 'P3: κ (nm⁻¹)', ks*10, '10.868'); chk(8, 'Ej./P3: κ (Å⁻¹)', ks, '1.087'); chk(8, 'P3: κ (Å⁻¹, 4 decimales)', ks, '1.0868'); chk(8, 'P3: 2κ (Å⁻¹)', 2*ks, '2.1736'); chk(8, 'P3: e^{−2κ·1Å}', math.exp(-2*ks), '0.1138'); chk(8, 'Ej.: e^{2.174}', math.exp(2*ks), '8.8'); chk(8, 'P3: década (Å)', math.log(10)/(2*ks), '1.059'); chk(8, 'Ej.: década (Å, 3 cifras)', math.log(10)/(2*ks), '1.06'); chk(8, 'P3: factor para 0.5 Å', math.exp(-2*ks*0.5), '0.337'); chk(8, 'P3: 1/factor', math.exp(2*ks*0.5), '2.96')
# --- fórmula analítica de t (SymPy) ---
kk, qq, aa = sp.symbols('k kappa a', positive=True)
tt = 2*sp.I*kk*qq/(2*sp.I*kk*qq*sp.cosh(qq*aa)+(kk**2-qq**2)*sp.sinh(qq*aa))
Tsym = sp.simplify(sp.Abs(tt)**2)
for (E, V0, aa_) in ((0.3, 1, 0.8), (0.7, 1, 1.3)):
    ksub = math.sqrt(2*E); qsub = math.sqrt(2*(V0-E))
    chk(8, f'Barrera: |t|² de la fórmula de t con SymPy (E={E})', float(Tsym.subs({kk: ksub, qq: qsub, aa: aa_})), Tbar(E, V0, aa_), 1e-10)
chk(8, 'Barrera: (k²+κ²)²/(4k²κ²) = V₀²/4E(V₀−E)', ((2*0.3)+(2*0.7))**2/(4*(2*0.3)*(2*0.7)), 1/(4*0.3*0.7), 1e-12)
# --- doble barrera (método de amplitudes con numpy) ---
def Tref(E, bounds, Vs, m_):
    n = len(bounds); k = [np.sqrt(complex(2*m_*(E-V))) for V in Vs]
    nun = 2*n; M = np.zeros((nun, nun), complex); rhs = np.zeros(nun, complex); idx = {('B', 0): 0, ('A', n): nun-1}; c_ = 1
    for j in range(1, n): idx[('A', j)] = c_; idx[('B', j)] = c_+1; c_ += 2
    row = 0
    for i, b in enumerate(bounds):
        for (reg, sgn) in ((i, +1), (i+1, -1)):
            for (ab, sg) in (('A', +1), ('B', -1)):
                key = (ab, reg); kk_ = k[reg]
                if key in idx: M[row, idx[key]] += sgn*np.exp(1j*sg*kk_*b); M[row+1, idx[key]] += sgn*(1j*sg*kk_)*np.exp(1j*sg*kk_*b)
                elif key == ('A', 0): rhs[row] -= sgn*np.exp(1j*sg*kk_*b); rhs[row+1] -= sgn*(1j*sg*kk_)*np.exp(1j*sg*kk_*b)
        row += 2
    x_ = np.linalg.solve(M, rhs); return (k[n].real/k[0].real)*abs(x_[idx[('A', n)]])**2
mm = 0.067/HB2M
def dbl(V0, b, w): return (lambda E: Tref(E, [0, b, b+w, 2*b+w], [0, V0, 0, V0, 0], mm))
f = dbl(0.3, 2, 5)
es = np.linspace(1e-4, 0.2, 40001); ts = np.array([f(E) for E in es]); i0 = int(np.argmax(ts))
chk(8, 'Sim: pico de la doble barrera (eV)', es[i0], '0.0862', 2e-3); chk(8, 'Sim: T en el pico', ts[i0], '1.000', 1e-3, ) if False else chk(8, 'Sim: T en el pico ≈ 1', ts[i0], 1.0, 1e-3)
half = ts[i0]/2; l = i0
while ts[l] > half: l -= 1
r_ = i0
while ts[r_] > half: r_ += 1
G = (es[r_]-es[l])*1e3
chk(8, 'Sim: Γ (meV)', G, '16.4', 5e-3); chk(8, 'Sim: τ = ħ/Γ (fs)', 6.5821e-16/(G*1e-3)*1e15, '40', 2e-2)
chk(8, 'Sim: T de una barrera a la energía del pico', Tref(es[i0], [0, 2], [0, 0.3, 0], mm), '0.252', 2e-3)
f3 = dbl(0.3, 3, 5); es3 = np.linspace(1e-4, 0.2, 80001); ts3 = np.array([f3(E) for E in es3]); j0 = int(np.argmax(ts3)); h3 = ts3[j0]/2; l3 = j0
while ts3[l3] > h3: l3 -= 1
r3 = j0
while ts3[r3] > h3: r3 += 1
G3 = (es3[r3]-es3[l3])*1e3
chk(8, 'Sim: Γ con b = 3 nm (meV)', G3, '4.73', 1e-2); chk(8, 'Sim: cociente de anchuras', G/G3, '3.5', 2e-2); chk(8, 'Sim: τ con b = 3 (fs)', 6.5821e-16/(G3*1e-3)*1e15, '139', 1e-2)
chk(8, 'Sim: T de una barrera de 3 nm a esa energía', Tref(es3[j0], [0, 3], [0, 0.3, 0], mm), '0.0829', 5e-3); chk(8, 'Sim: cociente de transmisiones de una barrera', Tref(es[i0], [0, 2], [0, 0.3, 0], mm)/Tref(es3[j0], [0, 3], [0, 0.3, 0], mm), '3.04', 1e-2)
# pozo finito de 8 nm
from scipy import optimize as _o
def fwell(V0, L, mr):
    z0 = (L/2)*math.sqrt(2*V0*mr/HB2M); out = []; kq = 0
    while kq*math.pi/2 < z0:
        lo = kq*math.pi/2+1e-12; hi = min((kq+1)*math.pi/2-1e-12, z0)
        if hi <= lo: break
        fn = (lambda z: math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z) if kq % 2 == 0 else (lambda z: -1/math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z)
        z = _o.brentq(fn, lo, hi, xtol=1e-14); out.append((HB2M/mr)*(z/(L/2))**2/2); kq += 1
    return out
w8 = fwell(0.3, 8, 0.067); chk(8, 'Sim: pozo de 8 nm, nivel 1 (eV)', w8[0], '0.0478'); chk(8, 'Sim: pozo de 8 nm, nivel 2 (eV)', w8[1], '0.1805')
# --- paquete: valores de la simulación (referencias.py usa la misma malla) ---
import json as _j
_ref = _j.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'referencias.json')))['packet']
for key, v in (('0.6_1_6', '0.478'), ('0.3_1_6', '0.281'), ('1.5_1_6', '0.805'), ('0.6_2_6', '0.107')):
    chk(8, f'Sim: transmitida del paquete {key}', _ref[key][0], v)
chk(8, 'Sim: ⟨T⟩ del paquete (0.6, 1, 6)', _ref['0.6_1_6'][1], '0.4800'); chk(8, 'Sim/P6: T(E₀)', Tbar(0.6, 1, 1), '0.4806'); chk(8, 'Sim: T(0.3)', Tbar(0.3, 1, 1), '0.277'); chk(8, 'Sim: T(1.5)', Tbar(1.5, 1, 1), '0.809'); chk(8, 'Sim: T(0.6, a=2)', Tbar(0.6, 1, 2), '0.102')
# P6: expansión de T(k)
Tk = lambda kq_: Tbar(kq_*kq_/2, 1, 1)
k0 = math.sqrt(1.2); sk = 1/12; d2 = (Tk(k0+1e-3)-2*Tk(k0)+Tk(k0-1e-3))/1e-6
chk(8, 'P6: k₀', k0, '1.0954'); chk(8, 'P6: σ_k', sk, '0.0833'); chk(8, 'P6: T(k₀)', Tk(k0), '0.48062'); chk(8, 'P6: T(k₀+σ_k)', Tk(k0+sk), '0.5323'); chk(8, 'P6: T(k₀−σ_k)', Tk(k0-sk), '0.4277')
chk(8, 'P6: T″ por diferencias con paso σ_k', (Tk(k0+sk)+Tk(k0-sk)-2*Tk(k0))/sk**2, '-0.17'); chk(8, 'P6: T″ (h = 10⁻³)', d2, '-0.1734'); chk(8, 'P6: corrección ½T″σ_k²', 0.5*d2*sk**2/1e-4, '-6.0'); chk(8, 'P6: ⟨T⟩ aproximado', Tk(k0)+0.5*d2*sk**2, '0.4800')
