import numpy as np
from scipy import optimize

def kepler_nu(M, e):
    E = optimize.brentq(lambda E: E - e*np.sin(E) - M, 0, 2*np.pi + 1e-9) if M > 0 else 0.0
    return 2*np.arctan2(np.sqrt(1+e)*np.sin(E/2), np.sqrt(1-e)*np.cos(E/2))

def equant_lon(M, e, qf):
    # Sol en el origen; centro O=(-e,0); ecuante Q=(-qf*e,0); P sobre el círculo unitario de centro O con arg(P-Q)=M
    O = np.array([-e, 0.0]); Q = np.array([-qf*e, 0.0]); u = np.array([np.cos(M), np.sin(M)])
    f = lambda s: np.hypot(*(Q + s*u - O)) - 1.0
    s = optimize.brentq(f, 1e-9, 3.0)
    P = Q + s*u
    return np.arctan2(P[1], P[0])

def run(R):
    e = 0.0934
    Ms = np.linspace(0, 2*np.pi, 721)
    for tag, qf in (('exc', 1.0), ('bis', 2.0)):
        d = [np.degrees(np.arctan2(np.sin(equant_lon(M, e, qf)-kepler_nu(M, e)), np.cos(equant_lon(M, e, qf)-kepler_nu(M, e)))) for M in Ms]
        R['equant_max_' + tag] = float(np.max(np.abs(d)))
    R['kepler_nu'] = [[M, kepler_nu(M, 0.0934)] for M in (0.5, 1.5, 3.0, 4.5)]
    # Eratóstenes y Aristarco
    R['erat_km'] = 360/7.2*5000*0.1575
    R['aristarco'] = [float(1/np.cos(np.radians(t))) for t in (87.0, 89.853)]
    # Arquímedes: polígonos con numpy
    n = 96
    R['pi_lo_hi'] = [float(n*np.sin(np.pi/n)), float(n*np.tan(np.pi/n))]
    # Corona: volúmenes con densidades del oro y la plata
    R['crown_dV'] = 1000*(0.2/10.49 + 0.8/19.32) - 1000/19.32
    # Tabla de refracción: ley de Snell con n = 1.333
    inc = np.arange(10, 90, 10)
    R['snell'] = [float(np.degrees(np.arcsin(np.sin(np.radians(i))/1.333))) for i in inc]
    R['precession_150'] = 50.29*150/3600
