import numpy as np
from scipy import integrate

def run(R):
    # Coulomb: exponentes con numpy
    D = np.array([[36, 0], [18, 126], [8.5, 567]], dtype=float)
    f = D[:, 0] + D[:, 1]
    R['coulomb'] = {'f': f.tolist(), 'n12': float(np.log(f[1]/f[0])/np.log(D[0, 0]/D[1, 0])), 'n13': float(np.log(f[2]/f[0])/np.log(D[0, 0]/D[2, 0]))}
    ch = 2*np.sin(np.radians(D[:, 0]/2))
    R['coulomb']['c12'] = float(np.log(f[1]/f[0])/np.log(ch[0]/ch[1])); R['coulomb']['c13'] = float(np.log(f[2]/f[0])/np.log(ch[0]/ch[2]))
    # Campo dentro de una cáscara: quad
    def shell(x, n):
        g = lambda u: (x-u)/(1+x*x-2*x*u)**((n+1)/2)
        return float(integrate.quad(g, -1, 1, epsabs=1e-13, epsrel=1e-13)[0]/2)
    R['shell19'] = [[x, n, shell(x, n)] for x in (0.2, 0.5, 0.9) for n in (1.9, 2.0, 2.1, 3.0)]
    # Pila: solución del circuito por álgebra lineal
    n, E, r, Rl = 10, 0.8, 1.0, 20.0
    I = np.linalg.solve(np.array([[n*r + Rl]]), np.array([n*E]))[0]
    R['pile'] = {'I': float(I), 'V': float(I*Rl), 'Pmax_R': float(n*r)}
    Rs = np.linspace(0.1, 100, 200001); P = (n*E/(n*r+Rs))**2*Rs
    R['pile']['R_at_Pmax'] = float(Rs[np.argmax(P)])
    # Botella de Leiden: 1 nF a 20 kV
    R['leiden'] = 0.5*1e-9*(20e3)**2
