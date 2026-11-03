# Cap. 17: láser — Doppler numérico desde Maxwell, ecuaciones de balance con SciPy (DOP853), modo del resonador con matrices ABCD, producto tiempo–ancho de banda por FFT
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
amu = C.physical_constants['atomic mass constant'][0]
# --- Doppler: FWHM del perfil obtenido de la distribución de velocidades de Maxwell (numérico) ---
def doppler_num(nu0, T, mA):
    m = mA*amu; s = math.sqrt(kB*T/m)     # σ_v
    f = lambda d: math.exp(-0.5*(d*c/nu0/s)**2) - 0.5   # d = ν−ν0, v = c d/ν0
    half = brentq(f, 0, 50*nu0*s/c); return 2*half
ref['dopp17'] = [dict(nu=c/632.8e-9, T=T, m=20.1797, fw=doppler_num(c/632.8e-9, T, 20.1797)) for T in (300, 400, 600)]
# --- Umbral de ganancia por balance de ida y vuelta (raíz de R1 R2 exp[2(γ−α)L] = 1) ---
ref['thr'] = []
for (L, R1, R2, al) in ((0.3, 0.999, 0.98, 0.0), (0.1, 0.95, 0.9, 0.2), (1.0, 0.99, 0.99, 0.01)):
    g = brentq(lambda g: R1*R2*math.exp(2*(g-al)*L)-1, 0, 100)
    tauc = -(2*L/c)/math.log(R1*R2*math.exp(-2*al*L))      # pérdida por viaje de ida y vuelta (discreto)
    ref['thr'].append(dict(L=L, R1=R1, R2=R2, al=al, g=g, tauc=tauc))
# --- Ecuaciones de balance: DOP853 ---
def rate_ref(p, T, tt):
    def f(t, y): N, ph = y; return [p['R']-N/p['tau']-p['B']*N*ph, (p['B']*N-1/p['tauc'])*ph+p['beta']*N/p['tau']]
    s = solve_ivp(f, (0, T), [0, 1e-3], method='DOP853', t_eval=tt, rtol=1e-11, atol=1e-8)
    return s.y.tolist()
P0 = dict(tau=230e-6, tauc=1e-9, B=1e-5, beta=1e-6); Rth = 1/(P0['B']*P0['tauc']*P0['tau']); P0['R'] = 2.5*Rth
tt = np.linspace(0, 40e-6, 9)[1:]
ref['rate'] = dict(p=P0, t=tt.tolist(), y=rate_ref(P0, 40e-6, tt))
# frecuencia de las oscilaciones de relajación: pequeña perturbación del estado estacionario (β = 0), cruces por cero de φ − φ_ss
Nth = 1/(P0['B']*P0['tauc']); phss = P0['tauc']*(P0['R']-Rth)
t2 = np.linspace(0, 40e-6, 400001)
y2 = solve_ivp(lambda t, y: [P0['R']-y[0]/P0['tau']-P0['B']*y[0]*y[1], (P0['B']*y[0]-1/P0['tauc'])*y[1]], (0, 40e-6), [Nth*1.0005, phss], method='DOP853', t_eval=t2, rtol=1e-12, atol=1e-6).y
d = y2[1]-phss; cr = np.where(np.diff(np.sign(d)) != 0)[0]; per = 2*np.mean(np.diff(t2[cr])[:6]); ref['rate_f'] = float(1/per)
r_ = 2.5; ref['rate_f_th'] = float(math.sqrt((r_-1)/(P0['tau']*P0['tauc'])-(r_/(2*P0['tau']))**2)/(2*math.pi))
# --- Resonador: autoestado por ABCD ---
def abcd_mode(L, R1, R2, lam):
    prop = np.array([[1, L], [0, 1.0]]); m1 = np.array([[1, 0], [-2/R1, 1.0]]); m2 = np.array([[1, 0], [-2/R2, 1.0]])
    M = m1@prop@m2@prop       # empieza en el espejo 1: viaja, refleja en 2, viaja, refleja en 1
    A, B, Cc, D = M[0, 0], M[0, 1], M[1, 0], M[1, 1]
    # q = (Aq+B)/(Cq+D)  ->  C q² + (D−A) q − B = 0
    disc = complex((D-A)**2+4*Cc*B); q = (-(D-A)+np.sqrt(disc))/(2*Cc)
    if q.imag < 0: q = (-(D-A)-np.sqrt(disc))/(2*Cc)
    w0 = math.sqrt(lam*q.imag/math.pi); w1 = math.sqrt(-lam/(math.pi*(1/q).imag)); return dict(w0=w0, w1=w1, zw=-q.real)
ref['abcd'] = [dict(L=L, R1=R1, R2=R2, lam=lam, **abcd_mode(L, R1, R2, lam)) for (L, R1, R2, lam) in ((0.3, 1.0, 1.0, 632.8e-9), (0.5, 2.0, 3.0, 1064e-9), (0.25, 0.5, 2.0, 532e-9), (0.15, 1.0, 0.4, 632.8e-9))]
# --- Producto tiempo–ancho de banda por FFT ---
def fwhm(x, y):
    y = y/np.max(y); idx = np.where(y >= 0.5)[0]; i0, i1 = idx[0], idx[-1]
    xl = x[i0-1]+(0.5-y[i0-1])*(x[i0]-x[i0-1])/(y[i0]-y[i0-1]); xr = x[i1]+(0.5-y[i1])*(x[i1+1]-x[i1])/(y[i1+1]-y[i1]); return xr-xl
tax = np.linspace(-200, 200, 2**18); dt = tax[1]-tax[0]; fax = np.fft.fftshift(np.fft.fftfreq(len(tax), dt))
tbp = {}
for nm, E in (('gauss', np.exp(-0.5*(tax/3.0)**2)), ('sech2', 1/np.cosh(tax/3.0))):
    I = E**2; S = np.abs(np.fft.fftshift(np.fft.fft(E)))**2
    tbp[nm] = fwhm(tax, I)*fwhm(fax, S)
ref['tbp'] = tbp
# densidad espectral de Planck u = 4π B_ν/c (SciPy/NumPy) para comparar con las tasas de Einstein
ref['planck_u'] = [dict(nu=nu, T=T, u=float(4*math.pi/c*2*h*nu**3/c**2/np.expm1(h*nu/(kB*T)))) for (nu, T) in ((1e10, 300), (3e13, 300), (c/500e-9, 6000), (c/632.8e-9, 4000), (5e14, 3e3))]
ref['stimratio'] = [dict(nu=nu, T=T, r=float(np.expm1(h*nu/(kB*T)))) for (nu, T) in ((1e10, 300), (c/500e-9, 6000), (c/10.6e-6, 300), (c/1064e-9, 300))]
