import numpy as np
from scipy import special, constants as sc

def run(R):
    # Integrales de Fresnel: scipy.special.fresnel devuelve (S, C)
    R['fres'] = {f'{v:.1f}': [float(x) for x in special.fresnel(v)[::-1]] for v in (0.5, 1.0, 1.2, 2.0, 3.5)}
    f = lambda v: (lambda S, C: 0.5*((C+0.5)**2+(S+0.5)**2))(*special.fresnel(v))
    R['edge'] = {f'{v:.1f}': float(f(v)) for v in (-2.0, -1.0, 0.0, 1.0, 2.0)}
    vs = np.linspace(0.5, 2.0, 300001)
    iv = np.array([f(v) for v in vs[::100]])
    R['edge_max'] = float(np.max(iv)); R['edge_vmax'] = float(vs[::100][np.argmax(iv)])
    # Disco de Poisson con haz gaussiano: integral radial con malla fina y j0 de scipy
    def poisson(q, F, wr):
        u = np.linspace(1.0, 3.2*wr, 400001)
        E = np.exp(-(u/wr)**2)
        g = E*special.j0(2*np.pi*F*q*u)*u*np.exp(1j*np.pi*F*u*u)
        U = (2*np.pi*F/1j)*np.trapezoid(g, u) if hasattr(np, 'trapezoid') else (2*np.pi*F/1j)*np.trapz(g, u)
        return float(abs(U)**2)
    R['poisson'] = [[q, F, wr, poisson(q, F, wr)] for q, F, wr in ((0.0, 1.5, 5.0), (0.05, 1.5, 5.0), (0.2, 1.5, 5.0), (0.0, 0.8, 5.0), (1.0, 2.0, 5.0))]
    # J0
    R['j0'] = [[x, float(special.j0(x))] for x in (0.0, 0.7, 2.4048, 7.9, 8.1, 25.0, 140.3)]
    # Hα y Rydberg
    me_mp = sc.m_e/sc.m_p
    R['halpha_vac'] = float(1e9/((sc.Rydberg/(1+me_mp))*(1/4-1/9)))
    R['rinf'] = float(sc.Rydberg); R['me_mp'] = float(me_mp)
    # Young
    R['young_nm'] = {'red': float(1/36000*0.0254*1e9), 'violet': float(1/60000*0.0254*1e9)}
    # Foucault
    R['foucault'] = float(4*2*np.pi*800*20*1.0/sc.c)
    # Rejilla
    R['grating'] = [[m, lam, d, float(np.arcsin(m*lam/d))] for m, lam, d in ((1, 589e-9, 1/600e3), (2, 656.279e-9, 1/300e3), (1, 486.135e-9, 1/1200e3))]
