# -*- coding: utf-8 -*-
# Capítulo 22: núcleo
import periodictable as _pt
uMeV = C.physical_constants['atomic mass constant energy equivalent in MeV'][0]; mH = _pt.elements[1][1].mass; mn = _pt.neutron.mass
Mm = lambda Z, A: _pt.elements[Z][A].mass
B = lambda Z, A: (Z*mH+(A-Z)*mn-Mm(Z, A))*uMeV
rows = [(el.number, A, el[A].mass) for el in _pt.elements if 1 <= el.number <= 92 for A in el.isotopes if el[A].abundance and el[A].abundance > 0]
feat = lambda Z, A: [A, -A**(2/3), -Z*(Z-1)/A**(1/3), -(A-2*Z)**2/A, (0 if A % 2 else (-1 if Z % 2 else 1))/math.sqrt(A)]
X = np.array([feat(Z, A) for Z, A, M in rows if A >= 20]); y = np.array([B(Z, A) for Z, A, M in rows if A >= 20]); cf, *_ = np.linalg.lstsq(X, y, rcond=None)
semf = lambda Z, A: float(np.dot(feat(Z, A), cf))
# tamaño y densidad
chk(22, 'Texto/P1: R Fe', 1.2*56**(1/3), '4.59'); chk(22, 'Texto/P1: R Pb', 1.2*208**(1/3), '7.11'); chk(22, 'Texto: R He', 1.2*4**(1/3), '1.90'); chk(22, 'Texto: R C', 1.2*12**(1/3), '2.75'); chk(22, 'Texto: R U', 1.2*238**(1/3), '7.44'); chk(22, 'P1: 56^{1/3}', 56**(1/3), '3.826'); chk(22, 'P1: 208^{1/3}', 208**(1/3), '5.925')
chk(22, 'Texto/P1: n (fm⁻³)', 3/(4*math.pi*1.2**3), '0.138'); chk(22, 'Texto/P1: ρ (10¹⁷)', 3*C.atomic_mass/(4*math.pi*(1.2e-15)**3)/1e17, '2.29'); chk(22, 'P1: r0³', 1.2**3, '1.728'); chk(22, 'Texto: ton por cm³ (millones)', 3*C.atomic_mass/(4*math.pi*(1.2e-15)**3)*1e-6/1e3/1e6, '229')
# tabla de ligadura
for (Z, A, Bv, BA) in ((1, 2, '2.225', '1.112'), (2, 4, '28.296', '7.074'), (6, 12, '92.162', '7.680'), (8, 16, '127.619', '7.976'), (26, 56, '492.260', '8.790'), (28, 62, '545.262', '8.795'), (82, 208, '1636.43', '7.867'), (92, 238, '1801.69', '7.570')):
    chk(22, f'Tabla: B({Z},{A})', B(Z, A), Bv); chk(22, f'Tabla: B/A({Z},{A})', B(Z, A)/A, BA)
chk(22, 'P2: 2mH+2mn', 2*1.0078250+2*1.0086649, '4.0329798'); chk(22, 'P2: defecto', 2*1.0078250+2*1.0086649-4.0026033, '0.0303765'); chk(22, 'P2: B', (2*1.0078250+2*1.0086649-4.0026033)*uMeV, '28.296'); chk(22, 'P2: B/A', (2*1.0078250+2*1.0086649-4.0026033)*uMeV/4, '7.074')
chk(22, 'Texto: mn − mH (MeV)', (mn-mH)*uMeV, '0.782'); chk(22, 'P3: Fe', 492.26/56, '8.790'); chk(22, 'P3: Ni', 545.26/62, '8.795'); chk(22, 'P3: U', 1801.69/238, '7.570')
# ajuste
chk(22, 'Texto: aV', cf[0], '15.77'); chk(22, 'Texto: aS', cf[1], '18.18'); chk(22, 'Texto: aC', cf[2], '0.717'); chk(22, 'Texto: aA', cf[3], '22.57'); chk(22, 'Texto: aP', cf[4], '12.87'); chk(22, 'Texto: rms', math.sqrt(np.mean((X@cf-y)**2)), '2.24'); chk(22, 'Texto: n del ajuste', len(y), '269'); chk(22, 'Texto: Coulomb teórico', 3/5*1.43996448/1.2, '0.72')
terms = [cf[i]*feat(26, 56)[i] for i in range(5)]
chk(22, 'P4/Texto: volumen', terms[0], '883.05'); chk(22, 'P4/Texto: superficie', terms[1], '-266.06'); chk(22, 'P4/Texto: Coulomb', terms[2], '-121.77'); chk(22, 'P4/Texto: asimetría', terms[3], '-6.45'); chk(22, 'P4/Texto: pares', terms[4], '1.72'); chk(22, 'P4/Texto: suma', sum(terms), '490.49'); chk(22, 'Texto/P4: diferencia', B(26, 56)-sum(terms), '1.77'); chk(22, 'P4: 56^{2/3}', 56**(2/3), '14.637'); chk(22, 'Texto: error (%)', (B(26, 56)-sum(terms))/B(26, 56)*100, '0.36')
chk(22, 'Guía: B/A fórmula Fe', sum(terms)/56, '8.759'); chk(22, 'Guía: vol/A', terms[0]/56, '15.77'); chk(22, 'Guía: sup/A', terms[1]/56, '-4.75'); chk(22, 'Guía: Coul/A', terms[2]/56, '-2.17'); chk(22, 'Guía: asim/A', terms[3]/56, '-0.12'); chk(22, 'Guía: par/A', terms[4]/56, '0.03')
chk(22, 'Guía: He4 fórmula', semf(2, 4), '22.80')
d = lambda Z, A: B(Z, A)-semf(Z, A)
for (Z, A, v) in ((2, 4, '5.49'), (8, 16, '3.45'), (20, 40, '1.51'), (82, 208, '7.33'), (26, 56, '1.77')): chk(22, f'Texto/P6: ΔB {A}', d(Z, A), v)
chk(22, 'P6: fórmula O16', semf(8, 16), '124.17'); chk(22, 'P6: fórmula Ca40', semf(20, 40), '340.55'); chk(22, 'P6: fórmula Pb208', semf(82, 208), '1629.10'); chk(22, 'P6: B Ca40', B(20, 40), '342.052'); chk(22, 'Texto: N/Z Pb', 126/82, '1.54')
# parábolas
mp_ = C.physical_constants['proton mass energy equivalent in MeV'][0]; mn_ = C.physical_constants['neutron mass energy equivalent in MeV'][0]
en = lambda Z, A: Z*mp_+(A-Z)*mn_+Z*0.51099895-semf(Z, A)
chk(22, 'P5: ΔM(43)', en(43, 101)-en(44, 101), '0.06'); chk(22, 'P5: ΔM(45)', en(45, 101)-en(44, 101), '2.03'); chk(22, 'Texto: Zbest 101', min(range(1, 101), key=lambda Z: en(Z, 101)), '44')
chk(22, 'Texto: Evans 56', 56/(1.98+0.0155*56**(2/3)), '25.4'); chk(22, 'Texto: Evans 238', 238/(1.98+0.0155*238**(2/3)), '92.4')
oo = [(Z, A) for Z, A, M in rows if Z % 2 and (A-Z) % 2]; chk(22, 'Texto: impar–impar naturales (n)', len(oo), '9')
# modelo de capas: referencia numérica independiente (scipy)
from scipy.linalg import eigh_tridiagonal as _et
def levels(lam, V0, R, a=0.67, h=0.025):
    hb2m = 197.3269804**2/(2*938.918); Np = int((R+12)/h); r = h*np.arange(1, Np+1); out = []
    for l in range(10):
        for jj in ([1] if l == 0 else [1, -1]):
            ls = l/2 if jj == 1 else -(l+1)/2; x = np.exp((r-R)/a); f = 1/(1+x); df = -x/(a*(1+x)**2)
            dd = 2*hb2m/h**2-V0*f+hb2m*l*(l+1)/r**2+lam*df/r*ls; ev = _et(dd, -hb2m/h**2*np.ones(Np-1), select='i', select_range=(0, 7), eigvals_only=True)
            for En in ev:
                if En < -0.05: out.append((float(En), int(round(2*(l+jj*0.5)+1))))
    return sorted(out)
def gaps(lam):
    lv = levels(lam, 51+33*44/208, 1.27*208**(1/3)); cum = 0; g = []
    for i in range(len(lv)-1):
        cum += lv[i][1]; g.append((cum, lv[i+1][0]-lv[i][0]))
    return g
g45 = {n: v for n, v in gaps(45.0) if v > 2.0 and n <= 140}
chk(22, 'Texto: nº de huecos > 2 MeV (λ = 45)', len(g45), '7'); chk(22, 'Texto: hueco 2', g45[2], '4.06'); chk(22, 'Texto: hueco 8', g45[8], '4.32'); chk(22, 'Texto: hueco 20', g45[20], '3.03'); chk(22, 'Texto: hueco 28', g45[28], '2.11'); chk(22, 'Texto: hueco 50', g45[50], '3.43'); chk(22, 'Texto: hueco 82', g45[82], '4.71'); chk(22, 'Texto: hueco 126', g45[126], '3.28')
g15 = {n: v for n, v in gaps(15.0) if v > 1.2}
chk(22, 'Guía: λ = 15: hueco 82', g15[82], '1.7'); chk(22, 'Guía: λ = 15: hueco 126', g15[126], '2.3'); chk(22, 'Guía: λ = 15: sin 28 ni 50', int((28 in g15) or (50 in g15)), '0')
g0 = {n for n, v in gaps(0.0) if v > 2.0}
chk(22, 'Texto: λ = 0: sin 28, 50, 82, 126', int(any(n in g0 for n in (28, 50, 82, 126))), '0'); chk(22, 'Texto: λ = 0 tiene 34, 40, 58, 92', int(all(n in g0 for n in (34, 40, 58, 92))), '1')
