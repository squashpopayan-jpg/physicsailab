import numpy as np
import CoolProp.CoolProp as CP

def run(R):
    # Atmósfera estándar y punto de ebullición del agua con CoolProp (IAPWS-95)
    def pstd(h): return 101325*(1-2.25577e-5*h)**5.25588
    R['boil'] = [[h, float(pstd(h)), float(CP.PropsSI('T', 'P', pstd(h), 'Q', 0, 'Water')-273.15)] for h in (0.0, 1738.0, 2640.0, 2850.0, 4764.0, 6263.0)]
    R['pvap'] = [[T, float(CP.PropsSI('P', 'T', T+273.15, 'Q', 0, 'Water'))] for T in (20.0, 60.0, 90.0, 100.0)]
    # Declinación solar: fórmula de Spencer (1971) en grados
    def decl(day):
        g = 2*np.pi*(day-1)/365.0
        d = 0.006918-0.399912*np.cos(g)+0.070257*np.sin(g)-0.006758*np.cos(2*g)+0.000907*np.sin(2*g)-0.002697*np.cos(3*g)+0.00148*np.sin(3*g)
        return float(np.degrees(d))
    R['decl'] = [[d, decl(d)] for d in (1, 80, 172, 266, 355)]
    # Días de paso por el cenit en Popayán (lat 2.4419): raíces de decl(d) = lat
    from scipy import optimize
    lat = 2.4419
    r1 = optimize.brentq(lambda d: decl(d)-lat, 60, 120)
    r2 = optimize.brentq(lambda d: decl(d)-lat, 200, 280)
    R['zenith'] = [float(r1), float(r2)]
