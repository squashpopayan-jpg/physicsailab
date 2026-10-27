import numpy as np
from scipy import constants as sc

def run(R):
    Rinf = sc.Rydberg
    mr = sc.m_p/sc.m_e
    RH = Rinf/(1+1/mr)
    R['balmer_vac'] = [[m, float(1e9/(RH*(1/4-1/m**2)))] for m in (3, 4, 5, 6, 7)]
    R['lyman_a'] = float(1e9/(RH*(1-1/4)))
    R['paschen_a'] = float(1e9/(RH*(1/9-1/16)))
    R['ry_ev'] = float(sc.Rydberg*sc.h*sc.c/sc.e)
    R['bohr_a0'] = float(sc.physical_constants['Bohr radius'][0])
    R['alpha'] = float(sc.alpha)
    R['fine'] = float(sc.alpha**2*sc.Rydberg*sc.h*sc.c/sc.e/16)
    # Pickering-Fowler: He+ con masa reducida
    mHe = 3.97259968907*sc.physical_constants['atomic mass constant'][0]/sc.m_e
    RHe = Rinf/(1+1/mHe)
    R['hep_4686'] = float(1e9/(RHe*4*(1/9-1/16)))
    R['ratio_he_h'] = float(RHe/RH)
    # Deuterio: desplazamiento isotópico de Halfa
    mD = 3670.482967
    RD = Rinf/(1+1/mD)
    R['d_shift'] = float(1e9/(RH*(1/4-1/9)) - 1e9/(RD*(1/4-1/9)))
    R['rinf'] = float(Rinf)
    R['bohr_speed'] = float(sc.alpha*sc.c)
