# Cap. 9: ondas de materia — doble rendija por integración numérica del campo, paquete gaussiano por FFT, estimación variacional por minimización
h, c, e, me, hbar = C.h, C.c, C.e, C.m_e, C.hbar
# de Broglie: cálculo independiente con scipy.constants (relativista exacto)
def lam_K(Kj, m): return h/math.sqrt(2*m*Kj*(1+Kj/(2*m*c*c)))
ref['lambda_e'] = {str(V): lam_K(V*e, me) for V in (54, 100, 1e3, 5e4, 1e5, 3e5)}
ref['lambda_n_thermal'] = h/math.sqrt(2*C.m_n*1.5*C.k*300)
# Doble rendija: A(θ) = ∫_{rendijas} e^{i k x senθ} dx (integración numérica con numpy); I/I(0)
def ds_numeric(th, lam, d, a, n=20001):
    k = 2*math.pi/lam; s = math.sin(th)
    amp = 0
    for x0 in (-d/2, d/2):
        x = np.linspace(x0-a/2, x0+a/2, n); amp += np.trapezoid(np.exp(1j*k*x*s), x)
    return abs(amp)**2/(2*a)**2
ref['ds'] = []
for (lam, d, a) in ((5.36e-12, 2e-6, 0.5e-6), (5.36e-12, 1e-6, 0.3e-6), (632.8e-9, 100e-6, 20e-6)):
    for fr in (0.0, 0.3, 0.77, 1.0, 1.9, 3.3):
        th = fr*lam/d
        ref['ds'].append(dict(lam=lam, d=d, a=a, th=th, I=ds_numeric(th, lam, d, a)))
# Paquete gaussiano: evolución libre por FFT (numpy): σ(t) y ⟨Δp⟩
def gauss_fft(m, s0, ts, N=2**14, L_factor=60):
    L = L_factor*max(s0, 1e-300)*np.sqrt(1+(hbar*max(ts)/(2*m*s0*s0))**2)
    x = np.linspace(-L/2, L/2, N, endpoint=False); dx = x[1]-x[0]; k = 2*np.pi*np.fft.fftfreq(N, d=dx)
    psi0 = (2*np.pi*s0**2)**(-0.25)*np.exp(-x**2/(4*s0**2))
    out = []
    for t in ts:
        psit = np.fft.ifft(np.fft.fft(psi0)*np.exp(-1j*hbar*k**2*t/(2*m)))
        rho = np.abs(psit)**2; rho /= rho.sum()*dx
        mu = (x*rho).sum()*dx; var = (x**2*rho).sum()*dx - mu**2
        phik = np.fft.fft(psit); pk = np.abs(phik)**2; pk /= pk.sum()
        varp = (hbar**2*k**2*pk).sum()
        out.append(dict(t=float(t), sigma=float(np.sqrt(var)), dp=float(np.sqrt(varp))))
    return out
ref['gauss'] = []
for (m, s0, ts) in ((me, 1e-10, [0, 1.7275e-16, 5e-16, 2e-15]), (C.m_p, 1e-10, [0, 1e-14, 1e-13]), (720.642*C.u, 1e-9, [0, 1e-11, 1e-10])):
    for r in gauss_fft(m, s0, ts): ref['gauss'].append(dict(m=m, s0=s0, **r))
# Estimación del estado fundamental del hidrógeno
f = lambda r: hbar**2/(2*me*r*r) - e*e/(4*math.pi*C.epsilon_0*r)
res = optimize.minimize_scalar(f, bounds=(1e-12, 1e-8), method='bounded', options=dict(xatol=1e-20))
ref['hest'] = dict(r=float(res.x), E=float(res.fun/e), a0=C.physical_constants['Bohr radius'][0], Ry=C.physical_constants['Rydberg constant times hc in eV'][0])
ref['lya_A'] = 6.2649e8
