import numpy as np
from fractions import Fraction
from scipy import constants as sc

def run(R):
    # YBC 7289: 1;24,51,10 y √2
    R['ybc'] = 1 + 24/60 + 51/3600 + 10/216000
    R['sqrt2'] = float(np.sqrt(2.0))
    # Método babilónico desde 3/2 con fracciones exactas
    x = Fraction(3, 2)
    its = []
    for _ in range(4):
        x = (x + 2 / x) / 2
        its.append(float(x))
    R['bab_iter'] = its
    R['bab_x2_frac'] = [577, 408]
    # Plimpton 322: comprobación con enteros
    tri = [[119,169,120],[3367,4825,3456],[4601,6649,4800],[12709,18541,13500],[65,97,72],[319,481,360],[2291,3541,2700],[799,1249,960],[481,769,600],[4961,8161,6480],[45,75,60],[1679,2929,2400],[161,289,240],[1771,3229,2700],[56,106,90]]
    R['plimpton_ok'] = [b*b + h*h == d*d for b, d, h in tri]
    R['plimpton_ang'] = [float(np.degrees(np.arctan2(b, h))) for b, d, h in tri]
    # Saros: valores publicados (Meeus): 223 sinódicos = 6585.3211 d; 242 dracónicos; 239 anomalísticos
    S, D, A = 29.530588853, 27.212220817, 27.554549878
    R['saros_lit'] = 6585.3211
    R['saros_223'] = 223 * S; R['saros_242'] = 242 * D; R['saros_239'] = 239 * A
    R['metonic_diff'] = 235 * S - 19 * 365.24219
    R['venus_maya'] = 5 * 584 / 365.0
    R['rhind_pi'] = (16/9)**2
