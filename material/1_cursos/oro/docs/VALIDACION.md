# Validación del núcleo — «Oro con método»

Compara el núcleo del curso (`src/lib`) con SciPy, pandas, zoneinfo y el motor de referencia en Python (`py/motor.py`).
Se regenera con `python tests/referencias.py && node tests/validar.js`.

**Resultado: 81 de 81 pruebas superadas** (2026-11-14).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 2 | Cuantil normal 0.975 | 1.95996398 | 1.95996398 | SciPy norm.ppf | 2.2e-16 | 1e-9 | OK |
| 2 | Cuantil normal 0.80 | 0.841621234 | 0.841621234 | SciPy norm.ppf | 3.3e-16 | 1e-9 | OK |
| 2 | Cuantil normal 0.999 | 3.09023231 | 3.09023231 | SciPy norm.ppf | 1.2e-13 | 1e-9 | OK |
| 2 | CDF normal en 1.96 | 0.975002105 | 0.975002105 | SciPy norm.cdf | 1.1e-16 | 1e-12 | OK |
| 2 | Cola superior normal en 3 | 0.00134989803 | 0.00134989803 | SciPy norm.sf | 4.5e-17 | 1e-12 | OK |
| 2 | erf(0.1) | 0.112462916 | 0.112462916 | SciPy special.erf | 0.0e+0 | 1e-13 | OK |
| 2 | erf(0.5) | 0.520499878 | 0.520499878 | SciPy special.erf | 0.0e+0 | 1e-13 | OK |
| 2 | erf(1.0) | 0.842700793 | 0.842700793 | SciPy special.erf | 0.0e+0 | 1e-13 | OK |
| 2 | erf(2.0) | 0.995322265 | 0.995322265 | SciPy special.erf | 4.4e-16 | 1e-13 | OK |
| 2 | erf(3.0) | 0.99997791 | 0.99997791 | SciPy special.erf | 0.0e+0 | 1e-13 | OK |
| 12 | Cuantil t 0.975 con 4 g.l. | 2.77644511 | 2.77644511 | SciPy t.ppf | 8.0e-15 | 1e-9 | OK |
| 12 | Cuantil t 0.975 con 29 g.l. | 2.04522964 | 2.04522964 | SciPy t.ppf | 2.2e-15 | 1e-9 | OK |
| 12 | Cuantil t 0.975 con 70 g.l. | 1.99443711 | 1.99443711 | SciPy t.ppf | 1.8e-15 | 1e-9 | OK |
| 12 | CDF t en 2.1 con 12 g.l. | 0.971227531 | 0.971227531 | SciPy t.cdf | 0.0e+0 | 1e-12 | OK |
| 12 | Valor p bilateral de t = 2.5 con 70 g.l. | 0.0147653765 | 0.0147653765 | SciPy t.sf | 2.1e-16 | 1e-12 | OK |
| 12 | Beta incompleta I(0.4; 2.5, 3.5) | 0.486904192 | 0.486904192 | SciPy special.betainc | 6.7e-16 | 1e-12 | OK |
| 12 | Beta incompleta I(0.2; 0.5, 7) | 0.917582122 | 0.917582122 | SciPy special.betainc | 1.1e-16 | 1e-12 | OK |
| 12 | Operaciones para detectar +0.10 R con sd 0.88 (80 %) | 608 | 608 | fórmula con cuantiles de SciPy | 0.0e+0 | 0 | OK |
| 4 | Velas M15 remuestreadas (número) | 3.333600e+4 | 3.333600e+4 | pandas resample | 0.0e+0 | 0 | OK |
| 4 | Velas H4 remuestreadas (número) | 2256 | 2256 | pandas resample | 0.0e+0 | 0 | OK |
| 4 | Cierre de la última vela M15 | 4139.72 | 4139.72 | pandas resample | 0.0e+0 | 1e-9 | OK |
| 4 | Suma de máximos M15 | 1.385922e+8 | 1.385922e+8 | pandas resample | 1.9e-15 | 0.000001 | OK |
| 4 | Cierre de la última vela H4 | 4139.72 | 4139.72 | pandas resample | 0.0e+0 | 1e-9 | OK |
| 4 | EMA20 de M15 (última) | 4152.1528 | 4152.1528 | pandas ewm(span=20, adjust=False) | 0.0e+0 | 1e-8 | OK |
| 4 | EMA20 de M15 (barra 5 000) | 3335.37101 | 3335.37101 | pandas ewm | 0.0e+0 | 1e-8 | OK |
| 4 | EMA50 de H4 (última) | 4183.81652 | 4183.81652 | pandas ewm(span=50, adjust=False) | 0.0e+0 | 1e-8 | OK |
| 4 | EMA50 de H4 (barra 1 500) | 4772.4818 | 4772.4818 | pandas ewm | 0.0e+0 | 1e-8 | OK |
| 4 | ATR14 de Wilder (última) | 4.99792826 | 4.99792826 | pandas ewm(alpha=1/14, adjust=False) | 1.8e-15 | 1e-8 | OK |
| 4 | ATR14 de Wilder (barra 5 000) | 3.72236712 | 3.72236712 | pandas ewm | 1.8e-15 | 1e-8 | OK |
| 4 | Máximo de las 24 barras previas | 3359.61 | 3359.61 | NumPy max de la ventana | 0.0e+0 | 0 | OK |
| 4 | Mínimo de las 24 barras previas | 3353.83 | 3353.83 | NumPy min de la ventana | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-03-29T00:59 UTC | 1 | 1 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-03-29T01:00 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-10-25T00:59 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-10-25T01:00 UTC | 1 | 1 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-07-15T12:00 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2026-12-15T12:00 UTC | 1 | 1 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2025-03-30T01:00 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2025-10-26T00:59 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2024-03-31T01:00 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 2 | Desfase de Madrid en 2010-03-28T01:00 UTC | 2 | 2 | zoneinfo Europe/Madrid | 0.0e+0 | 0 | OK |
| 8 | P(+8 antes que −10), μ = 0.05, σ = 1 (MC 40 000) | 0.76365 | 0.757301685 | fórmula del movimiento browniano (error de MC) | 6.3e-3 | 0.012 | OK |
| 8 | P sin deriva = b/(a+b) | 0.555555556 | 0.555555556 | identidad | 0.0e+0 | 1e-15 | OK |
| 19 | Kelly numérico = E/σ² | 0.129 | 0.129132231 | maximización numérica de g(f) | 1.3e-4 | 0.001 | OK |
| 19 | Crecimiento nulo en 2·Kelly | -3.469447e-18 | 0 | identidad | 3.5e-18 | 1e-15 | OK |
| 9 | Rango medio M5 sintético (12 mundos) ≈ real (4.93 USD) | 4.92075598 | 4.93 | oro real M5 | 9.2e-3 | 0.5 | OK |
| 9 | Máximo ≥ max(O,C) y mínimo ≤ min(O,C) en todas las velas | 1 | 1 | identidad | 0.0e+0 | 0 | OK |
| 6 | R medio sin costos en mundos sin memoria (|R|/EE < 3) | 1.47725972 | 0 | teorema de parada opcional (martingala) | 1.5e+0 | 3 | OK |
| 10 | Motor «m1-base»: número de operaciones | 59 | 59 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-base»: resultado total (USD) | -3.58509868 | -3.585099 | motor de Python | 3.2e-7 | 0.000001 | OK |
| 10 | Motor «m1-base»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-zona»: número de operaciones | 102 | 102 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-zona»: resultado total (USD) | -1241.73566 | -1241.73566 | motor de Python | 3.7e-7 | 0.000001 | OK |
| 10 | Motor «m1-zona»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-costos»: número de operaciones | 72 | 72 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-costos»: resultado total (USD) | -575.618387 | -575.618387 | motor de Python | 2.6e-7 | 0.000001 | OK |
| 10 | Motor «m1-costos»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-contra»: número de operaciones | 134 | 134 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-contra»: resultado total (USD) | 34.8508712 | 34.850871 | motor de Python | 2.3e-7 | 0.000001 | OK |
| 10 | Motor «m1-contra»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-base»: número de operaciones | 71 | 71 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-base»: resultado total (USD) | 961.136866 | 961.136866 | motor de Python | 4.2e-7 | 0.000001 | OK |
| 10 | Motor «m5-base»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-pess»: número de operaciones | 271 | 271 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-pess»: resultado total (USD) | -62.3274571 | -62.327457 | motor de Python | 1.2e-7 | 0.000001 | OK |
| 10 | Motor «m5-pess»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-sin-gestion»: número de operaciones | 92 | 92 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-sin-gestion»: resultado total (USD) | 535.425346 | 535.425346 | motor de Python | 1.2e-7 | 0.000001 | OK |
| 10 | Motor «m5-sin-gestion»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m15-base»: número de operaciones | 186 | 186 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m15-base»: resultado total (USD) | -1918.69 | -1918.69 | motor de Python | 1.2e-10 | 0.000001 | OK |
| 10 | Motor «m15-base»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-ruptura»: número de operaciones | 498 | 498 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-ruptura»: resultado total (USD) | -5052.48035 | -5052.48035 | motor de Python | 1.7e-8 | 0.000001 | OK |
| 10 | Motor «m5-ruptura»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-ema»: número de operaciones | 332 | 332 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m5-ema»: resultado total (USD) | 2920.19291 | 2920.19291 | motor de Python | 5.2e-8 | 0.000001 | OK |
| 10 | Motor «m5-ema»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-ruptura»: número de operaciones | 127 | 127 | motor de Python | 0.0e+0 | 0 | OK |
| 10 | Motor «m1-ruptura»: resultado total (USD) | -1898.90705 | -1898.90704 | motor de Python | 4.8e-7 | 0.000001 | OK |
| 10 | Motor «m1-ruptura»: barras, direcciones y motivos (10 operaciones) | 1 | 1 | motor de Python | 0.0e+0 | 0 | OK |
