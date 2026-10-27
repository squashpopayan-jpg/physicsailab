import numpy as np
from scipy import special, integrate

def run(R):
    # Péndulo: razón de periodos 2K(m)/π con m = sen²(θ0/2) (scipy.special.ellipk toma m)
    R['pend'] = {str(a): float(2*special.ellipk(np.sin(np.radians(a)/2)**2)/np.pi) for a in (5, 30, 60, 90, 120, 170)}
    # Péndulo por integración numérica de la ecuación diferencial: T = 4∫0^θ0 dθ/√(2(cosθ−cosθ0)) (en unidades √(L/g))
    th0 = np.radians(60)
    f = lambda phi: 1/np.sqrt(1 - np.sin(th0/2)**2*np.sin(phi)**2)
    R['pend_quad60'] = float(2/np.pi*integrate.quad(f, 0, np.pi/2)[0])
    # Folio 116v: razones respecto de la primera distancia y desviación frente a n²
    d = np.array([33, 130, 298, 526, 824, 1192, 1620, 2104], dtype=float)
    n = np.arange(1, 9)
    R['folio'] = {'ratios': (d/d[0]).tolist(), 'mean_abs_dev': float(np.mean(np.abs(d/d[0]/n**2 - 1)))}
    # Ajuste de potencia de los datos: exponente de d ∝ n^p
    R['folio_exponent'] = float(np.polyfit(np.log(n), np.log(d), 1)[0])
    # Plano inclinado: esfera maciza: a = g sen θ /(1 + I/(m r²)), I = 2/5 m r²
    th = np.radians(4.0)
    R['incline_a'] = float(9.80665*np.sin(th)/(1 + 2/5))
    # Montaña lunar
    Rm = 1737.4
    R['moon_h'] = float(np.sqrt(Rm**2 + (0.05*2*Rm)**2) - Rm)
    # Lunas de Júpiter: T²/a³
    a = np.array([5.905, 9.397, 14.986, 26.358]); T = np.array([1.769138, 3.551181, 7.154553, 16.689018])
    R['galilean_k'] = (T**2/a**3).tolist()
    # Venus: fases con vectores en numpy
    def venus_cop(t):
        e = 2*np.pi*t/365.256; v = 2*np.pi*t/224.701
        E = np.array([np.cos(e), np.sin(e)]); V = 0.723*np.array([np.cos(v), np.sin(v)])
        sv = -V; ev = E - V
        cosA = sv@ev/np.linalg.norm(sv)/np.linalg.norm(ev)
        return float((1+cosA)/2), float(np.linalg.norm(ev))
    ts = np.arange(0, 1200, 0.5)
    ks = np.array([venus_cop(t) for t in ts])
    R['venus_cop'] = {'kmin': float(ks[:, 0].min()), 'kmax': float(ks[:, 0].max()), 'dmin': float(ks[:, 1].min()), 'dmax': float(ks[:, 1].max()), 'k300': venus_cop(300.0)[0]}
