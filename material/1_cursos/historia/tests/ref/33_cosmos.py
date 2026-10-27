import numpy as np
from scipy import integrate, optimize, special, constants as sc

def run(R):
    d = [(0.032,170),(0.034,290),(0.214,-130),(0.263,-70),(0.275,-185),(0.275,-220),(0.45,200),(0.5,290),(0.5,270),(0.63,200),(0.8,300),(0.9,-30),(0.9,650),(0.9,150),(0.9,500),(1.0,920),(1.1,450),(1.1,500),(1.4,500),(1.7,960),(2.0,500),(2.0,850),(2.0,800),(2.0,1090)]
    r = np.array([a for a, b in d]); v = np.array([b for a, b in d], dtype=float)
    m, b = np.polyfit(r, v, 1)
    R['hubble_fit'] = [float(m), float(b)]
    m0 = float(np.sum(r*v)/np.sum(r*r))
    R['hubble_origin'] = m0
    Mpc = sc.parsec*1e6; Gyr = 1e9*365.25*86400
    R['age_hubble500'] = float(Mpc/1000/500/Gyr)
    def age(H0, Om, OL):
        Ok = 1-Om-OL
        f = lambda a: 1/(a*np.sqrt(Om/a**3 + Ok/a**2 + OL))
        t, _ = integrate.quad(f, 1e-10, 1, limit=400)
        return float(t*Mpc/1000/H0/Gyr)
    R['age'] = [[67.4, 0.315, 0.685, age(67.4, 0.315, 0.685)], [70, 1.0, 0.0, age(70, 1.0, 0.0)], [70, 0.3, 0.0, age(70, 0.3, 0.0)], [70, 0.3, 0.7, age(70, 0.3, 0.7)]]
    def dl(z, H0, Om, OL):
        Ok = 1-Om-OL
        dc, _ = integrate.quad(lambda x: 1/np.sqrt(Om*(1+x)**3 + Ok*(1+x)**2 + OL), 0, z)
        dh = sc.c/1000/H0
        if Ok > 1e-9: dm = dh/np.sqrt(Ok)*np.sinh(np.sqrt(Ok)*dc)
        elif Ok < -1e-9: dm = dh/np.sqrt(-Ok)*np.sin(np.sqrt(-Ok)*dc)
        else: dm = dh*dc
        return float((1+z)*dm)
    R['dl'] = [[z, H0, Om, OL, dl(z, H0, Om, OL)] for z, H0, Om, OL in ((0.5, 70, 0.3, 0.7), (1.0, 70, 0.3, 0.7), (0.5, 70, 1.0, 0.0), (0.5, 70, 0.3, 0.0), (0.05, 70, 0.3, 0.7))]
    R['ztrans'] = float(optimize.brentq(lambda z: 0.315*(1+z)**3*0.5 - 0.685, 0, 3) if False else optimize.brentq(lambda z: (0.315*(1+z)**3)/2 - 0.685, 0, 3))
    kT = sc.k*2.7255
    R['cmb_n'] = float(2*special.zeta(3)/np.pi**2*(kT/(sc.hbar*sc.c))**3)
    R['cmb_u'] = float(np.pi**2/15*kT**4/(sc.hbar*sc.c)**3)
    R['cmb_peak'] = float(sc.physical_constants['Wien frequency displacement law constant'][0]*2.7255/1e9)
    # Halo isotermo: masa por cuadratura
    rc, vinf = 5.0, 200e3
    kpc = sc.parsec*1e3
    Msun = 1.98847e30
    rho = lambda r: vinf**2/(4*np.pi*sc.G*(r**2+(rc*kpc)**2))
    M, _ = integrate.quad(lambda r: 4*np.pi*r**2*rho(r), 0, 30*kpc)
    R['halo_mass'] = float(M/Msun)
    R['G'] = float(sc.G)
