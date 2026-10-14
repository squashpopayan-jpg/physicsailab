# Modelo dinámico del peso de Hall y otros (Lancet, 2011) frente a la regla de 7 700 kcal por kilo
import numpy as np
from scipy.integrate import solve_ivp

KJ = 4.184
rhoF, rhoL, rhoG = 39.5e3, 7.6e3, 17.6e3            # kJ por kg de grasa, de tejido magro y de glucógeno
gF, gL = 13.0, 92.0                                  # gasto de mantenimiento, kJ/kg/día
etaF, etaL = 750.0, 960.0                            # costo de depositar grasa y tejido magro, kJ/kg
bTEF, bAT, tAT = 0.10, 0.14, 14.0                    # termogénesis por la comida y adaptativa
G0, agua = 0.5, 2.7                                  # kg de glucógeno y gramos de agua por gramo
Cforbes = 10.4                                       # partición grasa/magro de Forbes (kg)

def modelo(sexo="h", edad=40, talla=175, peso=95, pal=1.6, deficit_kcal=500, carb=0.5, dias=1095):
    H = talla / 100
    pct = 1.2 * peso / H**2 + 0.23 * edad - 10.8 * (sexo == "h") - 5.4          # Deurenberg (1991)
    F0, ECF0 = peso * pct / 100, 0.235 * peso
    L0 = peso - F0 - ECF0 - G0 * (1 + agua)
    RMR = (10 * peso + 6.25 * talla - 5 * edad + (5 if sexo == "h" else -161)) * KJ   # Mifflin-St Jeor
    EI0 = pal * RMR
    delta = ((1 - bTEF) * pal - 1) * RMR / peso                                  # gasto por actividad física
    K = EI0 - gF * F0 - gL * L0 - delta * peso
    CIb, EI = 0.5 * EI0, EI0 - deficit_kcal * KJ
    CI, kG, C = carb * EI, 0.5 * EI0 / G0**2, Cforbes * rhoL / rhoF

    def f(t, y):
        F, Lm, G, ECF, AT = y
        dG = (CI - kG * G * G) / rhoG                                             # glucógeno
        dECF = (-3000 * (ECF - ECF0) - 4000 * (1 - CI / CIb)) / 3220              # agua extracelular (sodio)
        p = C / (C + F)                                                           # fracción magra del cambio
        a = etaF / rhoF * (1 - p) + etaL / rhoL * p
        BW = F + Lm + G * (1 + agua) + ECF
        EE = (K + gF * F + gL * Lm + delta * BW + bTEF * (EI - EI0) + AT + a * (EI - rhoG * dG)) / (1 + a)
        bal = EI - EE - rhoG * dG
        return [(1 - p) * bal / rhoF, p * bal / rhoL, dG, dECF, (bAT * (EI - EI0) - AT) / tAT]

    t = np.arange(dias + 1)
    s = solve_ivp(f, (0, dias), [F0, L0, G0, ECF0, 0.0], t_eval=t, method="LSODA", rtol=1e-9, atol=1e-9)
    F, Lm, G, ECF, _ = s.y
    return t, F + Lm + G * (1 + agua) + ECF, F, Lm, F0, L0

t, BW, F, Lm, F0, L0 = modelo()
print("Hombre de 40 años, 175 cm, 95 kg, actividad 1,6; come 500 kcal/día menos que su gasto inicial\n")
print("  día     modelo de Hall   regla de 7 700 kcal/kg   grasa perdida   magro perdido")
for d in (7, 30, 90, 180, 365, 730, 1095):
    print(f"  {d:4d}   {95 - BW[d]:8.1f} kg       {500 * d / 7700:8.1f} kg            {F0 - F[d]:6.1f} kg      {L0 - Lm[d]:5.1f} kg")

perdida_final = 95 - BW[-1]
mitad = int(np.argmax(95 - BW >= perdida_final / 2))
print(f"\nA los 3 años la pérdida casi se estabiliza en {perdida_final:.1f} kg; la mitad se alcanzó el día {mitad}.")
print(f"La regla estática predice {500 * 1095 / 7700:.0f} kg en 3 años: el gasto baja a medida que baja el peso.")

t, BWc, *_ = modelo(carb=0.1, dias=14)
t, BWn, *_ = modelo(carb=0.5, dias=14)
print(f"\nPrimera semana con el mismo déficit: dieta baja en carbohidratos −{95 - BWc[7]:.2f} kg, "
      f"dieta mixta −{95 - BWn[7]:.2f} kg (la diferencia es sobre todo glucógeno y agua).")
