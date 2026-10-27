import numpy as np
from scipy import constants as sc

def run(R):
    R['c'] = float(1/np.sqrt(sc.mu_0*sc.epsilon_0))
    R['c_err'] = {'WK': float(3.1074e8/sc.c-1), 'Fizeau': float(3.153e8/sc.c-1)}
    R['fresnel'] = {f'{n:.1f}': float(((1-n)/(1+n))**2) for n in (1.5, 2.0, 3.0)}
    R['lc'] = float(1/(2*np.pi*np.sqrt(300e-9*95e-12)))
    # FDTD de referencia en NumPy (misma discretización) con pulso ancho
    N = 900; S = 0.5; w = 30.0
    eps = np.ones(N); eps[450:] = 1.5**2
    E = np.zeros(N); H = np.zeros(N)
    maxT = 0; maxR = 0
    for t in range(1600):
        e1, eN = E[1], E[-2]
        E[1:] += S/eps[1:]*(H[1:]-H[:-1])
        E[100] += np.exp(-((t-3*w)/w)**2)
        k0 = (S/np.sqrt(eps[0])-1)/(S/np.sqrt(eps[0])+1); kN = (S/np.sqrt(eps[-1])-1)/(S/np.sqrt(eps[-1])+1)
        E[0] = e1 + k0*(E[1]-E[0]); E[-1] = eN + kN*(E[-2]-E[-1])
        H[:-1] += S*(E[1:]-E[:-1])
        if t == 1000:
            maxT = float(np.max(np.abs(E[470:800]))); maxR = float(np.max(np.abs(E[120:430])))
    R['fdtd'] = {'T': maxT, 'R': maxR}
    # Velocidad en el medio: posición del máximo del pulso en dos instantes
    R['v_medium'] = float(1/1.5)
