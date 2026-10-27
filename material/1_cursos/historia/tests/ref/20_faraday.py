import numpy as np
import sympy as sp
from scipy import integrate, constants as sc

def run(R):
    mu0 = sc.mu_0
    # Hilo: B = mu0 I / 2 pi r; ley de Biot-Savart integrada numéricamente sobre un hilo largo
    I, r = 10.0, 0.02
    g = lambda z: mu0*I/(4*np.pi)*r/(r*r+z*z)**1.5
    R['wire'] = {'B': float(integrate.quad(g, -np.inf, np.inf)[0]), 'exact': float(mu0*I/(2*np.pi*r))}
    # Espira en su eje: integral del elemento de corriente
    a, z = 0.05, 0.04
    gl = lambda th: mu0*I/(4*np.pi)*a*a/(a*a+z*z)**1.5
    R['loop'] = float(integrate.quad(gl, 0, 2*np.pi)[0]); R['loop_exact'] = float(mu0*I*a*a/(2*(a*a+z*z)**1.5))
    # Fem de un dipolo que cae: derivada simbólica del flujo con sympy
    zz, t, v, m, aa, N = sp.symbols('zz t v m aa N', positive=True)
    Phi = N*mu0*m*aa**2/(2*(aa**2+(zz-v*t)**2)**sp.Rational(3, 2))  # imán se acerca: z(t) = z0 - v t
    emf = -sp.diff(Phi, t)
    f = sp.lambdify((zz, t, v, m, aa, N), emf)
    R['emf'] = [[0.05, 0.0, 2.0, 1.0, 0.03, 400, float(f(0.05, 0.0, 2.0, 1.0, 0.03, 400))], [0.02, 0.0, 1.0, 2.0, 0.03, 100, float(f(0.02, 0.0, 1.0, 2.0, 0.03, 100))]]
    # Disco: integrar v x B a lo largo del radio
    B, fq, Rd = 1.0, 50.0, 0.1
    R['disc'] = float(integrate.quad(lambda rr: B*2*np.pi*fq*rr, 0, Rd)[0])
    # Electrólisis: constante de Faraday
    R['F'] = float(sc.N_A*sc.e)
    R['cu'] = float(63.546/(2*sc.N_A*sc.e)*1.0)  # gramos por culombio de Cu2+
    # Área del pulso: integral de la fem en el tiempo = cambio de flujo (numérica)
    vv, mm, a0, Nn = 1.0, 2.0, 0.03, 400
    fl = lambda z: Nn*mu0*mm*a0**2/(2*(a0**2+z**2)**1.5)
    ts = np.linspace(-0.3, 0.3, 200001); zs = -vv*ts
    e = -np.gradient(fl(zs), ts)
    R['pulse_area'] = float(integrate.trapezoid(e, ts)); R['flux_change'] = float(fl(zs[0]) - fl(zs[-1]))
