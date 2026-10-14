# Validación del núcleo de cálculo — «Recablear»

Cada simulación del curso usa las funciones de `src/lib/`. Este informe compara
sus resultados con implementaciones independientes en Python (NumPy y SciPy), con resultados
publicados (valores generados por `python tests/referencias.py`) y con
identidades matemáticas exactas.
Se regenera con `node tests/validar.js`.

Resultado: **67 de 67 pruebas superadas** (2026-10-09, 0.6 s).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Media de una normal truncada E[X | X > 7], μ = 5, σ = 1,8 | 7.90669098 | 7.90669117 | SciPy 1.14.1 truncnorm | 1.9e-7 | 0.000001 | OK |
| 1 | Distribución t: F(2,0; 10 gl) | 0.963305983 | 0.963305983 | SciPy 1.14.1 t.cdf | 0.0e+0 | 1e-10 | OK |
| 1 | Distribución t con grados de libertad fraccionarios: F(−1,3; 4,5 gl) | 0.128098044 | 0.128098044 | SciPy 1.14.1 t.cdf | 6.4e-16 | 1e-10 | OK |
| 1 | Prueba t de Welch: valor p | 0.0026824524 | 0.0026824524 | SciPy 1.14.1 ttest_ind(equal_var=False) | 2.2e-17 | 1e-9 | OK |
| 1 | Potencia para d = 0,5 con 64 por grupo (aproximación normal frente a t no central exacta) | 0.807430429 | 0.801459558 | SciPy 1.14.1 nct | 6.0e-3 | 0.01 | OK |
| 1 | Metaanálisis DerSimonian-Laird de los 13 ensayos de la vacuna BCG: log RR combinado | -0.714117222 | -0.714117222 | NumPy; metafor publica −0,7141 | 0.0e+0 | 1e-9 | OK |
| 1 | BCG: heterogeneidad τ² | 0.308760263 | 0.308760263 | NumPy; metafor publica 0,3088 | 5.6e-17 | 1e-9 | OK |
| 1 | BCG: estadístico Q de Cochran | 152.233008 | 152.233008 | NumPy; metafor publica 152,2330 | 0.0e+0 | 1e-7 | OK |
| 1 | Prueba de Egger (BCG): intercepto | -2.11204212 | -2.11204212 | SciPy 1.14.1 linregress | 4.4e-16 | 1e-9 | OK |
| 1 | NNT para d = 0,5 (Kraemer y Kupfer) | 3.61890883 | 3.61890878 | SciPy 1.14.1 norm.cdf | 4.8e-8 | 0.000001 | OK |
| 1 | Sensibilidad d′ con aciertos 0,8 y falsas alarmas 0,3 | 1.36602167 | 1.36602175 | SciPy 1.14.1 norm.ppf | 7.3e-8 | 1e-7 | OK |
| 1 | Prueba binomial exacta: 60 de 100 | 0.0568879336 | 0.0568879336 | SciPy 1.14.1 binomtest | 1.3e-15 | 1e-9 | OK |
| 1 | Prueba binomial exacta: 9 de 12 | 0.145996094 | 0.145996094 | SciPy 1.14.1 binomtest | 7.5e-16 | 1e-9 | OK |
| 1 | Regresión a la media: ensayo simulado sin efecto ni placebo; la mejora media del control coincide con la del grupo tratado | 0.0883917335 | 0 | propiedad (diferencia < 0,25 puntos con 1.500 por brazo) | 8.8e-2 | 0.25 | OK |
| 2 | Potencial de Nernst del K⁺ a 37 °C (5 mM fuera, 140 mM dentro) | -89.058694 mV | -89.058694 | SciPy 1.14.1 constants (CODATA) | 0.0e+0 | 0.000001 | OK |
| 2 | Potencial de Nernst del Na⁺ a 37 °C (145 / 12 mM) | 66.5982133 mV | 66.5982133 | SciPy 1.14.1 constants (CODATA) | 0.0e+0 | 0.000001 | OK |
| 2 | Potencial de reposo de Goldman-Hodgkin-Katz (pK : pNa : pCl = 1 : 0,05 : 0,45) | -67.1689784 mV | -67.1689784 | SciPy 1.14.1 constants (CODATA) | 0.0e+0 | 0.000001 | OK |
| 2 | Hodgkin-Huxley: frecuencia sostenida con 10 µA/cm² | 68.3236974 Hz | 68.3236986 | SciPy 1.14.1 solve_ivp (RK45, tol 1e-9) | 1.2e-6 | 0.02 | OK |
| 2 | Hodgkin-Huxley: frecuencia con 20 µA/cm² | 86.4700526 Hz | 86.4700527 | SciPy 1.14.1 solve_ivp | 1.1e-7 | 0.02 | OK |
| 2 | Hodgkin-Huxley: instante de la espiga tras un pulso de 1 ms | 6.29595184 ms | 6.29595864 | SciPy 1.14.1 solve_ivp con eventos | 6.8e-6 | 0.002 | OK |
| 2 | Hodgkin-Huxley: umbral de disparo repetitivo (reobase del tren) | 6.25837708 µA/cm² | 6.25837708 | SciPy 1.14.1 + bisección | 0.0e+0 | 0.01 | OK |
| 2 | Integrar y disparar: frecuencia simulada frente a la fórmula exacta (I = 2 nA) | 63.0318311 Hz | 63.0400022 | fórmula analítica (Python) | 8.2e-3 | 0.6 | OK |
| 4 | Regla de Oja: coseno entre el peso aprendido y el vector propio principal | 0.999777513 | 1 | NumPy 2.1.2 linalg.eigh | 2.2e-4 | 0.002 | OK |
| 4 | Regla de Oja: norma del peso aprendido | 1.00007482 | 1 | propiedad (‖w‖ → 1) | 7.5e-5 | 0.02 | OK |
| 4 | Vector propio principal 2×2 por fórmula cerrada | 0.943628319 | 0.943628319 | NumPy 2.1.2 linalg.eigh | 1.1e-16 | 1e-12 | OK |
| 5 | Hopfield: probabilidad teórica de bit inestable, N = 100, P = 14 | 0.00376315748 | 0.00376315758 | SciPy 1.14.1 special.erf | 1.0e-10 | 1e-7 | OK |
| 5 | Hopfield: fracción de bits inestables medida (N = 200, P = 30) frente a la teoría | 0.00494444444 | 0.00491163725 | SciPy 1.14.1 special.erf | 3.3e-5 | 0.004 | OK |
| 5 | Modelo de espaciado: recuerdo a la semana tras 4 repasos masivos | 0.00327575123 | 0.00327575123 | reimplementación en Python | 0.0e+0 | 1e-12 | OK |
| 5 | Modelo de espaciado: recuerdo a la semana tras 4 repasos espaciados | 0.0578358776 | 0.0578358776 | reimplementación en Python | 0.0e+0 | 1e-12 | OK |
| 7 | Rescorla-Wagner: 10 ensayos con αβ = 0,3 (simulación frente a fórmula cerrada) | 0.971752475 | 0.971752475 | fórmula 1 − (1 − αβ)ⁿ | 1.1e-16 | 1e-12 | OK |
| 7 | Rescorla-Wagner: bloqueo de Kamin (la clave B aprende menos de 0,05) | 1 | 1 | propiedad del modelo | 0.0e+0 | 0 | OK |
| 7 | Diferencias temporales: valor aprendido en el instante de la clave = γ^(tr − tc) | 0.817072807 | 0.817072807 | valor exacto (Python) | 2.2e-15 | 0.002 | OK |
| 7 | Diferencias temporales: tras el aprendizaje el error de predicción pasa de la recompensa a la clave | 1 | 1 | propiedad (Schultz y otros, 1997) | 0.0e+0 | 0 | OK |
| 8 | Integración óptima: desviación combinada con σV = 2 y σH = 1 | 0.894427191 | 0.894427191 | fórmula (Python) | 0.0e+0 | 1e-12 | OK |
| 8 | Integración óptima: peso de la vista | 0.2 | 0.2 | fórmula (Python) | 0.0e+0 | 1e-12 | OK |
| 8 | Perceptrón: converge en un problema linealmente separable (AND) | 0 | 0 | teorema de convergencia | 0.0e+0 | 0 | OK |
| 15 | Curva de automaticidad: asíntota a (Levenberg-Marquardt frente a curve_fit) | 5.49776907 | 5.49776923 | SciPy 1.14.1 optimize.curve_fit | 1.7e-7 | 0.00001 | OK |
| 15 | Curva de automaticidad: tasa c | 0.0561969575 | 0.0561969451 | SciPy 1.14.1 optimize.curve_fit | 1.2e-8 | 0.000001 | OK |
| 15 | Días hasta el 95 % de la asíntota | 49.3420279 días | 49.3420379 | SciPy 1.14.1 optimize.curve_fit | 1.0e-5 | 0.001 | OK |
| 18 | Regresión lineal: pendiente del peso (kg/día) | -0.0797657039 | -0.0797657039 | SciPy 1.14.1 stats.linregress | 2.8e-17 | 1e-10 | OK |
| 18 | Regresión lineal: extremo superior del IC 95 % de la pendiente | -0.0708688328 | -0.0708688328 | SciPy 1.14.1 linregress + t.ppf | 3.2e-16 | 1e-8 | OK |
| 18 | Filtro de Kalman de tendencia: nivel final | 85.4934505 | 85.4934505 | NumPy 2.1.2 (mismas matrices) | 0.0e+0 | 1e-9 | OK |
| 18 | Filtro de Kalman de tendencia: pendiente final | -0.0805914835 | -0.0805914835 | NumPy 2.1.2 (mismas matrices) | 0.0e+0 | 1e-10 | OK |
| 19 | Curva potencial: exponente ajustado | 0.608104998 | 0.608104999 | SciPy 1.14.1 optimize.curve_fit | 5.7e-10 | 0.0001 | OK |
| 19 | Curva exponencial: tasa ajustada | 0.175705007 | 0.175697883 | SciPy 1.14.1 optimize.curve_fit | 7.1e-6 | 0.0001 | OK |
| 19 | Adaptación de dos estados: salida tras 200 ensayos de perturbación | 0.839606731 | 0.839606731 | recursión en Python | 0.0e+0 | 1e-12 | OK |
| 19 | Adaptación de dos estados: tras la perturbación opuesta la salida vuelve cerca de cero | 0.0125856908 | 0.0125856908 | recursión en Python | 0.0e+0 | 1e-12 | OK |
| 19 | Recuperación espontánea en la pinza de error (40 ensayos después) | 0.370428813 | 0.370428813 | recursión en Python | 0.0e+0 | 1e-12 | OK |
| 21 | Banister: forma en el día 70 (recursión frente a suma de convolución) | 5351.76641 | 5351.76641 | NumPy 2.1.2 (suma directa) | 1.7e-15 | 1e-7 (rel.) | OK |
| 21 | Banister: estado físico en el día 70 | 8344.30739 | 8344.30739 | NumPy 2.1.2 (suma directa) | 1.1e-15 | 1e-9 (rel.) | OK |
| 21 | Foster: monotonía de una semana | 1.46740282 | 1.46740282 | NumPy 2.1.2 | 0.0e+0 | 1e-12 | OK |
| 21 | Foster: tensión de la semana | 2817.41341 | 2817.41341 | NumPy 2.1.2 | 4.5e-13 | 1e-9 | OK |
| 21 | Cociente agudo:crónico acoplado con cargas semanales independientes: correlación espuria agudo–crónico | 0.503168981 | 0.5 | identidad: 1/√4 (Lolli y otros, 2019) | 3.2e-3 | 0.01 | OK |
| 21 | Cociente desacoplado con las mismas cargas: correlación agudo–crónico | 0.00894517432 | 0 | identidad: 0 | 8.9e-3 | 0.01 | OK |
| 23 | Mifflin-St Jeor, hombre de 40 años, 175 cm, 95 kg | 1848.75 kcal/día | 1848.75 | fórmula publicada | 0.0e+0 | 1e-9 | OK |
| 23 | Mifflin-St Jeor, mujer de 33 años, 162 cm, 68 kg | 1366.5 kcal/día | 1366.5 | fórmula publicada | 0.0e+0 | 1e-9 | OK |
| 23 | Deurenberg: % de grasa estimado por IMC | 30.2244898 % | 30.2244898 | fórmula publicada | 0.0e+0 | 1e-9 | OK |
| 23 | Modelo de Hall: peso al día 30 con −500 kcal/día | 93.0812672 kg | 93.0812672 | SciPy 1.14.1 solve_ivp (LSODA, tol 1e-10) | 1.1e-9 | 0.002 | OK |
| 23 | Modelo de Hall: peso al año | 81.9168364 kg | 81.9168364 | SciPy 1.14.1 solve_ivp | 2.0e-10 | 0.002 | OK |
| 23 | Modelo de Hall: peso a los tres años | 74.6458389 kg | 74.6458389 | SciPy 1.14.1 solve_ivp | 3.3e-9 | 0.003 | OK |
| 23 | Modelo de Hall: peso a la semana con dieta baja en carbohidratos (glucógeno y agua) | 92.5825819 kg | 92.5825812 | SciPy 1.14.1 solve_ivp | 7.2e-7 | 0.002 | OK |
| 23 | Regla de Hall y otros (2011): cada 100 kJ/día de cambio sostenido llevan a ≈ 1 kg (cambio final simulado) | -1.09377117 kg | -1 | Lancet 2011 (regla aproximada) | 9.4e-2 | 0.15 | OK |
| 23 | Frayn: oxidación de grasa con VO₂ = 3,0 y VCO₂ = 2,8 L/min | 0.334 g/min | 0.334 | fórmula publicada | 0.0e+0 | 1e-12 | OK |
| 30 | Extinción con un contexto: error tras 24 ensayos = V (1 − αg − αc)^24 | 0.00135979372 | 0.00135979372 | identidad de la regla delta | 5.9e-17 | 1e-12 | OK |
| 30 | Extinción con un contexto: inhibición general = αg/(αg+αc) · (V − error final) | 0.164133153 | 0.164133153 | identidad de la regla delta | 8.3e-17 | 1e-12 | OK |
| 29 | Cable de Hodgkin-Huxley: velocidad de conducción (6,3 °C) | 12.1918504 m/s | 12.1918504 | NumPy 2.1.2 (mismo esquema) | 0.0e+0 | 0.01 | OK |
| 29 | Bloqueo total de 1 cm de axón: el impulso no lo atraviesa | 20 | 20 | propiedad del modelo | 0.0e+0 | 0 | OK |
