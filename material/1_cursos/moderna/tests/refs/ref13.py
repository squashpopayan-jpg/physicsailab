# Cap. 13: oscilador armónico y Morse — diagonalización por diferencias finitas y funciones especiales de scipy
from scipy.linalg import eigh_tridiagonal
from scipy import special as _sp
def fd(Vfun, xmin, xmax, N, nev):
    x = np.linspace(xmin, xmax, N); dx = x[1]-x[0]
    d = 1.0/dx**2 + Vfun(x); o = np.full(N-1, -0.5/dx**2)
    return eigh_tridiagonal(d, o, select='i', select_range=(0, nev-1))[0]
w = fd(lambda x: 0.5*x*x, -14, 14, 8000, 10)
ref['ho_fd'] = [float(v) for v in w]
# funciones de onda: ψ_n(ξ) = H_n(ξ) e^{−ξ²/2}/√(2ⁿ n! √π) con scipy.special.eval_hermite
ref['ho_psi'] = [dict(n=n, xi=xi, psi=float(_sp.eval_hermite(n, xi)*math.exp(-xi*xi/2)/math.sqrt(2.0**n*math.factorial(n)*math.sqrt(math.pi)))) for n in (0, 1, 2, 5, 10, 20) for xi in (0.0, 0.7, 1.9, -2.6)]
ref['ho_forbidden'] = [dict(n=n, P=float(2*integrate.quad(lambda x: (_sp.eval_hermite(n, x)*math.exp(-x*x/2))**2/(2.0**n*math.factorial(n)*math.sqrt(math.pi)), math.sqrt(2*n+1), np.inf, epsabs=0, epsrel=1e-12)[0])) for n in (0, 1, 2, 5, 10)]
ref['erfc1'] = float(_sp.erfc(1.0))
# <x²> y <p²> con SymPy para n = 0..3 (ħ = m = ω = 1)
xs_ = sp.symbols('x', real=True)
def psi_sym(n): return sp.hermite(n, xs_)*sp.exp(-xs_**2/2)/sp.sqrt(2**n*sp.factorial(n)*sp.sqrt(sp.pi))
ref['ho_x2'] = {str(n): float(sp.integrate(xs_**2*psi_sym(n)**2, (xs_, -sp.oo, sp.oo))) for n in range(4)}
ref['ho_p2'] = {str(n): float(sp.integrate(-psi_sym(n)*sp.diff(psi_sym(n), xs_, 2), (xs_, -sp.oo, sp.oo))) for n in range(4)}
# Morse: ħ = μ = 1, V = D(1 − e^{−a x})²; E_n exacta = ω(n+½) − ω²(n+½)²/(4D), ω = a√(2D); diagonalización de diferencias finitas
D_, a_ = 12.0, 0.8
wm = fd(lambda x: D_*(1-np.exp(-a_*x))**2, -3.0, 40.0, 24000, 6)
ref['morse_fd'] = dict(D=D_, a=a_, E=[float(v) for v in wm])
# datos de diatómicas: NIST Chemistry WebBook (Huber y Herzberg): ωe, ωexe, banda fundamental observada (cm⁻¹)
ref['diat'] = {'CO': dict(we=2169.81, wexe=13.288, fund=2143.27, over=4259.74), 'HCl': dict(we=2990.95, wexe=52.82, fund=2885.98), 'H2': dict(we=4401.21, wexe=121.34, fund=4161.17), 'N2': dict(we=2358.57, wexe=14.324, fund=2329.92)}
