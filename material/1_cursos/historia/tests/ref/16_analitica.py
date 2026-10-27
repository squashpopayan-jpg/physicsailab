import numpy as np
from scipy import optimize, integrate, constants as sc

def run(R):
    g = sc.g
    # Cicloide y recta
    xf, yf = 1.5, 0.6
    f = lambda th: (th-np.sin(th))/(1-np.cos(th)) - xf/yf
    th = optimize.brentq(f, 1e-3, 2*np.pi-1e-3); a = yf/(1-np.cos(th))
    R['cyc'] = {'th': float(th), 'a': float(a), 'T': float(th*np.sqrt(a/g))}
    R['straight'] = float(np.sqrt(2*(xf**2+yf**2)/(g*yf)))
    # Parábola y = k sqrt(x): tiempo por quad
    k = yf/np.sqrt(xf)
    integrand = lambda x: np.sqrt(1+(k/(2*np.sqrt(x)))**2)/np.sqrt(2*g*k*np.sqrt(x))
    R['parab'] = float(integrate.quad(integrand, 0, xf, limit=400)[0])
    Rc = (xf**2+yf**2)/(2*xf)
    integ2 = lambda x: np.sqrt(1+((Rc-x)**2/(2*Rc*x-x*x)))/np.sqrt(2*g*np.sqrt(2*Rc*x-x*x))
    R['circle'] = float(integrate.quad(integ2, 0, xf, limit=400)[0])
    # Cavendish
    R['cav'] = {'G': float(2*np.pi**2*1.86*1e-3*0.2257**2/(158*420**2))}
    G = 6.674e-11
    R['earth'] = {'M': float(g*6.371e6**2/G), 'rho': float(g*6.371e6**2/G/(4/3*np.pi*6.371e6**3))}
    # Péndulo doble con solve_ivp (m=l=1)
    def rhs(t, s):
        t1, t2, w1, w2 = s; d = t1-t2; den = 3 - np.cos(2*d)
        a1 = (-g*3*np.sin(t1) - g*np.sin(t1-2*t2) - 2*np.sin(d)*(w2*w2 + w1*w1*np.cos(d)))/den
        a2 = (2*np.sin(d)*(w1*w1*2 + g*2*np.cos(t1) + w2*w2*np.cos(d)))/den
        return [w1, w2, a1, a2]
    s = integrate.solve_ivp(rhs, [0, 2.0], [1.0, 0.5, 0, 0], rtol=1e-11, atol=1e-12)
    R['dp'] = [float(v) for v in s.y[:, -1]]
    # Teorema de Newton de las esferas: la atracción de una esfera uniforme equivale a la de su masa en el centro (cuadratura)
    # Fuerza axial sobre una masa a distancia d de una esfera de radio 1: F = ∫ dm cosθ/ r² con quad
    d = 2.5
    def inner(u):
        # u = cosθ' del elemento; anillo de radio sinθ'; potencial de cada anillo
        r = np.sqrt(1 + d*d - 2*d*u)
        return (d - u)/r**3
    val = integrate.quad(inner, -1, 1)[0]*0.5  # masa total 1 normalizada
    R['shell'] = {'F': float(val), 'point': float(1/d**2)}
    # Neptuno: radio de órbita, periodo y tercera ley
    R['nep'] = {'a': 30.11, 'T': float(30.11**1.5)}
