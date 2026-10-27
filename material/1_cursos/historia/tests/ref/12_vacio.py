import numpy as np
from scipy import constants as sc

def run(R):
    g = sc.g
    R['col'] = {'Hg': 101325/(13595*g), 'agua': 101325/(998*g), 'aceite': 101325/(920*g)}
    H = 8.314462618*288.15/(0.0289647*g)
    R['H'] = H
    R['perier_dz'] = float(H*np.log(711.7/627.1))
    R['bogota_mm'] = float(760*np.exp(-2640/H))
    R['hemi'] = float((101325)*np.pi*0.255**2)
    # Ley de Boyle: ajuste lineal con numpy de los datos del tubo en J
    A = np.array([48,46,44,42,40,38,36,34,32,30,28,26,24,23,22,21,20,19,18,17,16,15,14,13,12], dtype=float)
    B = np.array([0,1.5,2+13/16,4+6/16,6+3/16,7+14/16,10+2/16,12+8/16,15+1/16,17+9/16,21+3/16,25+3/16,29+11/16,32+3/16,35+3/16,37+14/16,41+2/16,44+3/16,48+12/16,53+11/16,58+2/16,63+15/16,71+5/16,78+11/16,88+7/16])
    P = B + 29 + 2/16
    m, b = np.polyfit(1/A, P, 1)
    R['boyle_fit'] = {'m': float(m), 'b': float(b), 'maxdev': float(np.max(np.abs(A*P/np.mean(A*P) - 1)))}
    R['dip'] = {str(l): float(np.degrees(np.arctan(2*np.tan(np.radians(l))))) for l in (0, 20, 51.5, 80)}
