# Cap. 14: hidrógeno — funciones radiales de SymPy (sympy.physics.hydrogen), integrales dipolares por cuadratura, datos NIST de tasas de transición
from sympy.physics.hydrogen import R_nl as _Rnl
r_ = sp.symbols('r', positive=True)
ref['hyd_R'] = [dict(n=n, l=l, r=rr, R=float(_Rnl(n, l, rr, 1))) for (n, l) in ((1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2), (4, 2), (4, 3), (5, 1)) for rr in (0.3, 1.7, 4.2, 9.5)]
# integral dipolar exacta con SymPy para algunos pares (a₀): ⟨1s|r|2p⟩ = 128√6/243, ⟨2s|r|3p⟩ …
def rad_sym(n, l, n2, l2):
    return float(sp.integrate(r_**3*_Rnl(n, l, r_, 1)*_Rnl(n2, l2, r_, 1), (r_, 0, sp.oo)))
ref['hyd_rad'] = [dict(n=a, l=b, n2=c_, l2=d_, I=rad_sym(a, b, c_, d_)) for (a, b, c_, d_) in ((1, 0, 2, 1), (2, 1, 3, 2), (2, 0, 3, 1), (1, 0, 3, 1), (2, 1, 3, 0))]
# valores esperados ⟨r⟩ de SymPy
ref['hyd_r'] = [dict(n=n, l=l, v=float(sp.integrate(r_**3*_Rnl(n, l, r_, 1)**2, (r_, 0, sp.oo)))) for (n, l) in ((1, 0), (2, 0), (2, 1), (3, 2), (4, 1))]
# tasas A (NIST Atomic Spectra Database, H I; s⁻¹) — datos publicados para las líneas más importantes
ref['nist_A'] = {'2p-1s': 6.2649e8, '3p-1s': 1.6725e8, '3p-2s': 2.2449e7, '3s-2p': 6.3141e6, '3d-2p': 6.4651e7, '4p-1s': 6.8186e7}
