# -*- coding: utf-8 -*-
# Capítulo 34: información y computación cuánticas (referencias: numpy con matrices explícitas)
_I2 = np.eye(2, dtype=complex); _H = np.array([[1, 1], [1, -1]], complex)/math.sqrt(2); _X = np.array([[0, 1], [1, 0]], complex); _Zg = np.diag([1, -1]).astype(complex)
def _tele(theta, phi, p):
    psi = np.array([math.cos(theta/2), math.sin(theta/2)*np.exp(1j*phi)]); pin = np.outer(psi, psi.conj())
    phip = np.array([1, 0, 0, 1])/math.sqrt(2); res = p*np.outer(phip, phip)+(1-p)*np.eye(4)/4; rho = np.kron(pin, res)
    cn = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]], complex); U = np.kron(_H, np.eye(4))@np.kron(cn, _I2); r1 = U@rho@U.conj().T
    out = []; Fa = 0; Fp = 0; bl = None
    for m1 in (0, 1):
        for m2 in (0, 1):
            P = np.zeros((4, 4)); P[2*m1+m2, 2*m1+m2] = 1; Pf = np.kron(P, _I2); R = Pf@r1@Pf; pr = float(np.trace(R).real)
            rb = np.einsum('ijik->jk', R.reshape(4, 2, 4, 2))/pr; Xm = np.linalg.matrix_power(_X, m2); Zm = np.linalg.matrix_power(_Zg, m1)
            corr = Zm@Xm@rb@Xm.conj().T@Zm.conj().T; F = float(np.trace(pin@corr).real); F0 = float(np.trace(pin@rb).real); Fa += pr*F; Fp += pr*F0
            out.append((pr, F0, F, [2*corr[0, 1].real, -2*corr[0, 1].imag, (corr[0, 0]-corr[1, 1]).real]))
    return out, Fa, Fp, [2*pin[0, 1].real, -2*pin[0, 1].imag, (pin[0, 0]-pin[1, 1]).real]
# ---- Simulación 34.1
o, Fa, Fp, bin_ = _tele(math.radians(70), math.radians(40), 1.0)
for i, (pr, F0, F, bl) in enumerate(o): chk(34, f'Sim: probabilidad del resultado {i}', pr, '0.25'); chk(34, f'Sim: F corregida (p = 1), resultado {i}', F, '1.0')
for i, v in enumerate(('1.000', '0.518', '0.117', '0.365')): chk(34, f'Sim: F sin corregir (p = 1), resultado {i}', o[i][1], v, 2e-3)
chk(34, 'Sim: media sin corregir', Fp, '0.5000'); chk(34, 'Sim: entrada x', bin_[0], '0.720', 2e-3); chk(34, 'Sim: entrada y', bin_[1], '0.604', 2e-3); chk(34, 'Sim: entrada z', bin_[2], '0.342', 2e-3)
o, Fa, Fp, _ = _tele(math.radians(70), math.radians(40), 0.5)
chk(34, 'Sim: F corregida (p = 0.5)', Fa, '0.7500'); chk(34, 'Sim: salida x (p = 0.5)', o[0][3][0], '0.360', 2e-3); chk(34, 'Sim: salida y (p = 0.5)', o[0][3][1], '0.302', 2e-3); chk(34, 'Sim: salida z (p = 0.5)', o[0][3][2], '0.171', 3e-3)
for i, v in enumerate(('0.750', '0.509', '0.308', '0.432')): chk(34, f'Sim: F sin corregir (p = 0.5), resultado {i}', o[i][1], v, 2e-3)
chk(34, 'Sim: F (p = 0.2)', (1+0.2)/2, '0.6000'); chk(34, 'Sim: umbral', (1+1/3)/2, str(round(2/3, 4)), 1e-3)
# ---- Simulación 34.2: Grover
th6 = math.asin(1/8); chk(34, 'Sim: θ (N = 64)', th6, '0.12533', 1e-3); chk(34, 'Sim: k* (N = 64)', math.floor(math.pi/(4*th6)), '6'); chk(34, 'Sim: P(k*) (N = 64)', math.sin(13*th6)**2, '0.99659', 1e-4); chk(34, 'Sim: P(3) (N = 64)', math.sin(7*th6)**2, '0.59138', 1e-4); chk(34, 'Sim: amplitud (k = 3)', math.sin(7*th6), '0.76901', 1e-4)
chk(34, 'Sim: P(12) (N = 64) (10⁻⁵)', math.sin(25*th6)**2/1e-5, '7.05', 1e-2)
th10 = math.asin(1/32); chk(34, 'Sim: k* (N = 1024)', math.floor(math.pi/(4*th10)), '25'); chk(34, 'Sim: P(25) (N = 1024)', math.sin(51*th10)**2, '0.99946', 1e-4); chk(34, 'Sim: ahorro 512/25', 512/25, '20.5', 1e-2)
# ---- Simulación 34.3: Shor
def _order(a, N):
    x, r = a % N, 1
    while x != 1: x = x*a % N; r += 1
    return r
def _dist(N, a, m):
    Qn = 2**m; r = _order(a, N); P = np.zeros(Qn)
    for x0 in range(r):
        v = np.zeros(Qn, complex); v[x0::r] = 1; P += abs(np.fft.fft(v))**2/Qn**2
    return r, P
def _succ(N, a, m):
    r, P = _dist(N, a, m); Qn = 2**m; s = 0.0
    for y in range(1, Qn):
        rr = 0
        # convergentes por Euclides
        a1, b1 = y, Qn; h1, h0, k1, k0 = 1, 0, 0, 1
        while b1:
            q = a1//b1; a1, b1 = b1, a1-q*b1; h = q*h1+h0; k = q*k1+k0; h0, h1 = h1, h; k0, k1 = k1, k
            if k1 > N: break
            if pow(a, k1, N) == 1: rr = k1; break
        if rr and rr % 2 == 0 and pow(a, rr//2, N) != N-1 and 1 < math.gcd(pow(a, rr//2, N)-1, N) < N: s += P[y]
    return s
r, P = _dist(15, 7, 8); chk(34, 'Sim: periodo (15, 7)', r, '4'); chk(34, 'Sim: P(64)', P[64], '0.25'); chk(34, 'Sim: P(128)', P[128], '0.25'); chk(34, 'Sim: P(192)', P[192], '0.25'); chk(34, 'Sim: Q', 2**8, '256'); chk(34, 'Sim: éxito (15, 7)', _succ(15, 7, 8), '0.5000')
chk(34, 'Sim: éxito (21, 2)', _succ(21, 2, 9), '0.3284', 1e-3); chk(34, 'Sim: periodo (21, 2)', _order(2, 21), '6')
chk(34, 'Sim: éxito (35, 3)', _succ(35, 3, 11), '0.3281', 1e-3); chk(34, 'Sim: periodo (35, 3)', _order(3, 35), '12'); chk(34, 'Sim: periodo (15, 2)', _order(2, 15), '4')
# ---- P1
al, be = 0.6, 0.8; chk(34, 'P1: F₀₁ = (2αβ)²', (2*al*be)**2, '0.9216'); chk(34, 'P1: F₁₀ = (α² − β²)²', (al*al-be*be)**2, '0.0784'); chk(34, 'P1: F₁₁', (-al*be+be*al)**2, '0.0', 1e-9, rel=False); chk(34, 'P1: media', 0.25*(1+0.9216+0.0784+0), '0.5'); chk(34, 'P1: 2αβ', 2*al*be, '0.96'); chk(34, 'P1: α² − β²', al*al-be*be, '-0.28')
tt = 2*math.atan2(be, al); o, Fa, Fp, _ = _tele(tt, 0.0, 1.0)
for i, v in enumerate((1.0, 0.9216, 0.0784, 0.0)): chk(34, f'P1: fidelidad antes de corregir (numpy), resultado {i}', o[i][1], f'{v:.4f}', 1e-9, rel=False)
chk(34, 'P1: fidelidad media corregida (numpy)', Fa, '1.0')
# ---- P2
chk(34, 'P2: F (p = 0.8)', (1+0.8)/2, '0.9'); chk(34, 'P2: C', (3*0.8-1)/2, '0.7'); chk(34, 'P2: p umbral', 1/3, '0.3333', 1e-3); chk(34, 'P2: F(p = 0.8) por simulación de matrices densas', _tele(0.9, 0.2, 0.8)[1], '0.9')
# ---- P3
chk(34, 'P3: θ (N = 1024)', th10, '0.031255', 1e-4); chk(34, 'P3: π/(4θ)', math.pi/(4*th10), '25.13', 1e-3); chk(34, 'P3: 51θ', 51*th10, '1.5940', 1e-4); chk(34, 'P3: P(25)', math.sin(51*th10)**2, '0.99946', 1e-4); chk(34, 'P3: fallo (10⁻⁴)', (1-math.sin(51*th10)**2)/1e-4, '5.4', 1e-2); chk(34, 'P3: ahorro', 512/25, '20.5', 1e-2)
chk(34, 'P3: P(1) (N = 4)', math.sin(3*math.asin(0.5))**2, '1.0'); th6_ = math.asin(1e-3); chk(34, 'P3: k* (N = 10⁶)', math.floor(math.pi/(4*th6_)), '785'); chk(34, 'P3: P(785) (N = 10⁶)', math.sin(1571*th6_)**2, '0.99999996', 1e-7); chk(34, 'P3: factor 5×10⁵/785', 5e5/785, '637', 1e-3); chk(34, 'P3: 1571·10⁻³', 1571e-3, '1.571')
# ---- P4
chk(34, 'P4: 7²', 7**2 % 15, '4'); chk(34, 'P4: 7³', 7**3 % 15, '13'); chk(34, 'P4: 7⁴', 7**4 % 15, '1'); chk(34, 'P4: gcd(3, 15)', math.gcd(3, 15), '3'); chk(34, 'P4: gcd(5, 15)', math.gcd(5, 15), '5'); chk(34, 'P4: N²', 15**2, '225'); chk(34, 'P4: P(picos) 1/r', 1/4, '0.25'); chk(34, 'P4: éxito', 0.5, '0.5')
# ---- P5
for p, v in ((0.1, '0.028'), (0.01, '2.98e-4')): chk(34, f'P5: p_L (p = {p})', 3*p*p-2*p**3, v, 1e-3)
chk(34, 'P5: 3p²(1−p) + p³ (p = 0.1)', 3*0.01*0.9+0.001, '0.028'); chk(34, 'P5: fidelidad', 1-0.028, '0.972'); chk(34, 'P5: p_equilibrio', optimize.brentq(lambda p: 3*p*p-2*p**3-p, 0.2, 0.8), '0.5'); chk(34, 'P5: 3 × 10⁻⁴ − 2 × 10⁻⁶ (10⁻⁴)', (3e-4-2e-6)/1e-4, '2.98')
# ---- P6
chk(34, 'P6: QBER (q = 1)', 0.5*0.5, '0.25'); chk(34, 'P6: detección (n = 20)', 1-0.75**20, '0.99683', 1e-4); chk(34, 'P6: (3/4)²⁰ (10⁻³)', 0.75**20/1e-3, '3.17', 1e-2); chk(34, 'P6: detección (n = 10)', 1-0.75**10, '0.9437', 1e-3); chk(34, 'P6: q máx', 0.11*4, '0.44')
