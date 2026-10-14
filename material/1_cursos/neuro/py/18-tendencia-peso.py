# Señal y ruido en el peso diario: media móvil exponencial, filtro de Kalman y regresión
import numpy as np
from scipy import stats

rng = np.random.default_rng(18)
dias = 90
real = 88.0 - 0.5 / 7 * np.arange(dias)              # pierde 0,5 kg por semana, sin fallar
agua = np.zeros(dias)                                   # agua y glucógeno: fluctuación AR(1) correlacionada
for d in range(1, dias):
    agua[d] = 0.7 * agua[d - 1] + 0.5 * np.sqrt(1 - 0.49) * rng.standard_normal()
pesaje = real + agua + 0.3 * rng.standard_normal(dias)  # + báscula, ropa, comida en el tubo digestivo
falta = rng.random(dias) < 0.15                         # días sin pesarse
y = np.where(falta, np.nan, pesaje)

sube = np.nansum(np.diff(y) > 0)
print(f"Pérdida real: 0,50 kg por semana todos los días. Pesajes: {np.sum(~falta)} de {dias} días.")
print(f"Días en que la báscula marcó MÁS que el pesaje anterior: {sube} de {np.sum(~np.isnan(np.diff(y)))}")

# Media móvil exponencial (10 %)
ema, m = [], None
for v in y:
    if not np.isnan(v):
        m = v if m is None else m + 0.1 * (v - m)
    ema.append(m)

# Filtro de Kalman de nivel y pendiente
x, P = np.array([y[0], 0.0]), np.array([[1.0, 0], [0, 0.01]])
F, Q, R = np.array([[1.0, 1], [0, 1]]), np.diag([0.0025, 2e-6]), 0.45
nivel, pend, sdp = [], [], []
for v in y:
    if nivel:
        x = F @ x; P = F @ P @ F.T + Q
    if not np.isnan(v):
        S = P[0, 0] + R; K = P[:, 0] / S
        x = x + K * (v - x[0]); P = P - np.outer(K, P[0, :])
    nivel.append(x[0]); pend.append(x[1]); sdp.append(np.sqrt(P[1, 1]))

print("\nSemana   real    pesaje   media móvil   Kalman   ritmo Kalman (kg/sem)")
for s in (1, 2, 4, 6, 8, 12):
    d = 7 * s
    print(f"{s:5d}   {real[d]:6.2f}  {pesaje[d]:7.2f}   {ema[d]:9.2f}   {nivel[d]:7.2f}   {7 * pend[d]:+.2f} ± {7 * 1.96 * sdp[d]:.2f}")

# ¿Desde qué día la regresión sobre lo acumulado detecta una bajada (IC 95 % por debajo de 0)?
for d in range(7, dias):
    t, v = np.arange(d + 1), y[: d + 1]
    ok = ~np.isnan(v)
    r = stats.linregress(t[ok], v[ok])
    if r.slope + stats.t.ppf(0.975, ok.sum() - 2) * r.stderr < 0:
        print(f"\nLa regresión detecta la bajada a partir del día {d} (ritmo estimado {7 * r.slope:+.2f} kg/semana).")
        break
