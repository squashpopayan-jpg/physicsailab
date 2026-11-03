# Cap. 12: túnel y pozo finito — integración numérica de la ecuación de Schrödinger (DOP853) y diagonalización por diferencias finitas
from scipy.linalg import eigh_tridiagonal
hbar, me, e = C.hbar, C.m_e, C.e
c2 = hbar**2/(2*me)/e*1e18          # ħ²/2m en eV·nm²
# --- Transmisión de una barrera por integración hacia atrás de ψ″ = (V − E)ψ/c2 desde x = a con solo onda transmitida ---
def T_ode(E, V0, a):
    k = math.sqrt(E/c2)
    def f(x, y):
        V = V0 if 0 <= x <= a else 0.0
        return [y[1], (V-E)/c2*y[0]]
    # en x = a+: ψ = e^{ik(x−a)} → ψ = 1, ψ′ = ik (complejo): se integra parte real e imaginaria por separado
    def f4(x, y):
        V = V0 if 0 <= x <= a else 0.0; g = (V-E)/c2
        return [y[1], g*y[0], y[3], g*y[2]]
    # integra de a a 0⁺ y empalma en 0 (V constante en la barrera); partes: ψ = y0 + i y2, ψ′ = y1 + i y3
    sol = integrate.solve_ivp(f4, [a, 0], [1.0, 0.0, 0.0, k], method='DOP853', rtol=1e-13, atol=1e-14)
    psi0 = sol.y[0, -1] + 1j*sol.y[2, -1]; dpsi0 = sol.y[1, -1] + 1j*sol.y[3, -1]
    A = 0.5*(psi0 + dpsi0/(1j*k))
    return float(1/abs(A)**2)
ref['barrier'] = [dict(E=E, V0=V0, a=a, T=T_ode(E, V0, a)) for (E, V0, a) in ((1.0, 5.0, 0.3), (4.5, 5.0, 0.5), (0.5, 10.0, 1.0), (7.0, 5.0, 0.4), (5.0000001, 5.0, 0.4), (2.0, 4.0, 2.0), (3.0, 4.5, 0.15))]
# --- Pozo finito: V = 0 en |x| < a, V0 fuera; energías por diagonalización de diferencias finitas (en eV, medidas desde el fondo) ---
def well_fd(V0, a, M=2000):
    # malla con los bordes del pozo (±a) exactamente en las caras entre nodos: dx = 2a/M, nodos en (j + 1/2) dx
    dx = 2*a/M; L = a + 8.0/math.sqrt(max(1e-9, V0/c2)) + 2*a
    ns = int(L/dx)
    x = (np.arange(-ns, ns)+0.5)*dx; V = np.where(np.abs(x) < a, 0.0, V0)
    d = 2*c2/dx**2 + V; o = np.full(len(x)-1, -c2/dx**2)
    w = eigh_tridiagonal(d, o, select='v', select_range=(-1e-9, V0))[0]
    return [float(v) for v in w]
ref['well'] = [dict(V0=V0, a=a, E=well_fd(V0, a)) for (V0, a) in ((10.0, 0.5), (50.0, 0.5), (5.0, 1.0), (100.0, 0.25))]
# --- Corriente de túnel: razón I(d)/I(d + Δ) = e^{2κΔ} con κ = √(2mφ)/ħ (φ = 4.5 eV) ---
phi = 4.5; kap = math.sqrt(2*me*phi*e)/hbar*1e-9
ref['stm'] = dict(phi=phi, kappa=kap, ratio_1A=math.exp(2*kap*0.1), decade_nm=math.log(10)/(2*kap))
