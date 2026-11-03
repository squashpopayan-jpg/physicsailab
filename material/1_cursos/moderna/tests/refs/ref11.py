# Cap. 11: pozo infinito — diagonalización por diferencias finitas, evolución exacta del hamiltoniano discretizado, esfera infinita
from scipy.linalg import eigh_tridiagonal
hbar, me, e = C.hbar, C.m_e, C.e
# unidades: L = 1, ħ = m = 1 → E_n = n²π²/2
def fd_box(N):
    dx = 1.0/(N+1); d = np.full(N, 1.0/dx**2); o = np.full(N-1, -0.5/dx**2)
    w, v = eigh_tridiagonal(d, o); return w, v, dx
w, v, dx = fd_box(4000)
ref['box_fd'] = [dict(n=n, E=float(w[n-1])) for n in (1, 2, 3, 5, 10)]
# evolución del paquete gaussiano en el hamiltoniano discretizado (descomposición espectral) frente a la serie de autofunciones
def gauss_state(u, u0, s, k0):
    g = np.exp(-(u-u0)**2/(4*s*s))*np.exp(1j*k0*u); return g/np.sqrt(np.sum(np.abs(g)**2)*dx)
u = np.arange(1, 4001)*dx
psi0 = gauss_state(u, 0.3, 0.05, 40.0)
cfd = v.T @ psi0      # (los autovectores unitarios de la matriz son √dx × autofunciones: los factores √dx se cancelan al reconstruir)
ref['gauss_evol'] = []
for tt in (0.0, 0.01, 0.05, 0.2):
    # tt en unidades ħ/E₁ con E₁ = π²/2 → t = tt/(π²/2)
    t = tt/(np.pi**2/2)
    psit = v @ (cfd*np.exp(-1j*w*t))
    dens = np.abs(psit)**2
    pts = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]
    ref['gauss_evol'].append(dict(tt=tt, u0=0.3, s=0.05, k0=40.0, pts=pts, dens=[float(np.interp(p_, u, dens)) for p_ in pts]))
# esfera infinita l = 0: u(r) = r R(r): −u″/2 = E u, u(0) = u(1) = 0 → E = π²/2 (en unidades R = ħ = m = 1)
ref['sphere_fd'] = float(fd_box(4000)[0][0])
# probabilidad en un intervalo por integración numérica
ref['box_prob'] = [dict(n=n, a=a, b=b, P=float(integrate.quad(lambda x: 2*np.sin(n*np.pi*x)**2, a, b, epsabs=0, epsrel=1e-13)[0])) for (n, a, b) in ((1, 0.0, 1/3), (2, 0.0, 1/3), (3, 0.0, 1/3), (1, 0.25, 0.75), (4, 0.1, 0.6))]
# valores esperados con SymPy
x_ = sp.symbols('x', positive=True)
ref['box_x2'] = {str(n): float(sp.integrate(2*x_**2*sp.sin(n*sp.pi*x_)**2, (x_, 0, 1))) for n in (1, 2, 3, 7)}
ref['box_p2'] = {str(n): float(sp.integrate(2*sp.sin(n*sp.pi*x_)*(-sp.diff(sp.sin(n*sp.pi*x_), x_, 2)), (x_, 0, 1))) for n in (1, 2, 3, 7)}   # ⟨p²⟩ (ħ = 1, L = 1) = n²π²
