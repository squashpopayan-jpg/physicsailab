# Validación del núcleo de cálculo — «Cuentas claras»

Cada simulación del curso usa las funciones de `src/lib/`. Este informe compara
sus resultados con numpy-financial (mismas convenciones de Excel), SciPy, la hoja
original de Damodaran (valores generados por `python tests/referencias.py`) y con
identidades matemáticas exactas.
Se regenera con `node tests/validar.js`.

Resultado: **66 de 66 pruebas superadas** (2026-10-05, 0.0 s).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 3 | Ponderación de probabilidad w(0,01) con γ = 0,61 | 0.0552661368 | 0.0552661368 | fórmula de Tversky y Kahneman (Python) | 0.0e+0 | 1e-12 | OK |
| 3 | Ganancia mínima para aceptar una moneda en la que se pierden 100 (λ = 2,25) | 274.06888 | 274.06888 | SciPy optimize.brentq | 6.0e-12 | 0.000001 | OK |
| 3 | Inversión de preferencias: con descuento hiperbólico se elige 100 hoy frente a 120 en 7 días, pero 120 si ambas fechas se corren 30 días | 1 | 1 | propiedad del descuento hiperbólico | 0.0e+0 | 0 | OK |
| 3 | Sin inversión con descuento exponencial (misma elección con y sin espera) | 1 | 1 | consistencia temporal | 0.0e+0 | 0 | OK |
| 6 | VF de 1 millón más 100.000 mensuales, 120 meses al 1 % (vencido) | 2.630426e+7 | 2.630426e+7 | numpy-financial 1.0.0 fv | 0.0e+0 | 0.000001 (rel.) | OK |
| 6 | Ídem con pagos anticipados (tipo 1) | 2.653429e+7 | 2.653429e+7 | numpy-financial 1.0.0 fv (when="begin") | 0.0e+0 | 0.000001 (rel.) | OK |
| 6 | Tiempo exacto de duplicación al 8 % | 9.00646834 | 9.00646834 | ln 2 / ln 1,08 (Python) | 7.1e-15 | 1e-12 | OK |
| 6 | Trayectoria mes a mes = fórmula cerrada de VF (diferencia) | 1.132985e-15 | 0 | identidad | 1.1e-15 | 0.000001 | OK |
| 7 | Tasa de usura de octubre de 2026 (28,59 % EA) expresada mes vencido | 0.0211760009 | 0.0211760009 | (1,2859)^(1/12) − 1 (Python) | 0.0e+0 | 1e-14 | OK |
| 7 | 24 % nominal mes vencido → efectiva anual | 0.268241795 | 0.268241795 | 1,02¹² − 1 (Python) | 2.2e-16 | 1e-14 | OK |
| 7 | Anticipada → vencida → anticipada (ida y vuelta) | 0.02 | 0.02 | identidad | 0.0e+0 | 1e-15 | OK |
| 7 | Tasa real exacta: 10 % nominal con inflación 5,1 % | 0.0466222645 | 0.0466222645 | Fisher (Python) | 0.0e+0 | 1e-15 | OK |
| 7 | Costo efectivo mensual de un crédito con comisión, seguro y cuota de manejo (TIR) | 0.0226694833 | 0.0226694833 | numpy-financial 1.0.0 irr | 3.9e-16 | 1e-10 | OK |
| 8 | Inflación de Colombia 2025 (Banco Mundial, promedio anual) leída del archivo de datos | 5.1422 | 5.1422 | API del Banco Mundial | 0.0e+0 | 0.0001 | OK |
| 9 | VA de 60 cuotas de 450.000 al 0,8 % mensual | 2.137690e+7 | 2.137690e+7 | numpy-financial 1.0.0 pv | 1.7e-16 | 1e-8 (rel.) | OK |
| 9 | Cuota de 25 millones a 48 meses al 1,2 % | -6.881888e+5 | -6.881888e+5 | numpy-financial 1.0.0 pmt | 1.7e-16 | 1e-10 (rel.) | OK |
| 9 | Meses para pagar 5 millones con 300.000 al 1,5 % | 19.3222889 | 19.3222889 | numpy-financial 1.0.0 nper | 0.0e+0 | 1e-10 | OK |
| 9 | Tasa implícita: recibir 10 millones y pagar 24 cuotas de 520.000 | 0.0185388109 | 0.0185388109 | numpy-financial 1.0.0 rate | 3.7e-16 | 1e-10 | OK |
| 9 | Tasa para llegar a 15 millones ahorrando 200.000 durante 60 meses | 0.00732082822 | 0.00732082822 | numpy-financial 1.0.0 rate | 2.6e-12 | 1e-10 | OK |
| 9 | VPN al 11 % de un proyecto de 30 millones (primer flujo en t = 0) | 2.187833e+6 | 2.187833e+6 | numpy-financial 1.0.0 npv | 0.0e+0 | 1e-8 (rel.) | OK |
| 9 | TIR del mismo proyecto | 0.135599002 | 0.135599002 | numpy-financial 1.0.0 irr | 6.1e-16 | 1e-10 | OK |
| 9 | VNA de Excel (primer flujo descontado un periodo) | 1.971021e+6 | 1.971021e+6 | definición (Python) | 9.5e-16 | 1e-8 (rel.) | OK |
| 10 | Cuota fija: intereses totales de 80 millones a 180 meses al 1,1 % | 1.040940e+8 | 1.040940e+8 | numpy-financial 1.0.0 ipmt | 9.2e-15 | 1e-9 (rel.) | OK |
| 10 | Cuota fija: interés de la cuota 12 | 8.617459e+5 | 8.617459e+5 | numpy-financial 1.0.0 ipmt | 0.0e+0 | 1e-9 (rel.) | OK |
| 10 | Cuota fija: abono a capital de la cuota 12 | 1.609985e+5 | 1.609985e+5 | numpy-financial 1.0.0 ppmt | 0.0e+0 | 1e-9 (rel.) | OK |
| 10 | Abono constante a capital: intereses totales | 7.964000e+7 | 7.964000e+7 | i·P·(n+1)/2 | 5.6e-15 | 1e-9 (rel.) | OK |
| 10 | Abonos extraordinarios nulos = crédito de cuota fija (diferencia de intereses) | 0 | 0 | identidad | 0.0e+0 | 0.000001 | OK |
| 10 | UVR con inflación 0 y tasa real = tasa en pesos: misma cuota | 0 | 0 | identidad | 0.0e+0 | 0.000001 | OK |
| 13 | Equivalente cierto sin seguro (utilidad logarítmica) | 1.945310e+7 | 1.945310e+7 | Python | 1.9e-16 | 1e-9 (rel.) | OK |
| 13 | Prima máxima que conviene pagar | 5.469011e+5 | 5.469011e+5 | SciPy optimize.brentq | 8.1e-14 | 1e-7 (rel.) | OK |
| 14 | Pago mínimo del 5 % (piso 50.000): meses para pagar 3 millones al 2,1 % | 63 | 63 | simulación independiente (Python) | 0.0e+0 | 0 | OK |
| 14 | Ídem: intereses totales | 1.707549e+6 | 1.707549e+6 | simulación independiente (Python) | 0.0e+0 | 1e-9 (rel.) | OK |
| 14 | Avalancha con 1 millón al mes: intereses totales | 2.501792e+6 | 2.501792e+6 | simulación independiente (Python) | 0.0e+0 | 1e-9 (rel.) | OK |
| 14 | Bola de nieve con 1 millón al mes: intereses totales | 2.561509e+6 | 2.561509e+6 | simulación independiente (Python) | 0.0e+0 | 1e-9 (rel.) | OK |
| 14 | Gota a gota (20 % en 30 cuotas diarias): tasa efectiva anual | 82.3249128 | 82.3249128 | numpy-financial 1.0.0 irr | 8.1e-14 | 1e-8 (rel.) | OK |
| 15 | Impuesto (UVT) para bases de 1.000 a 40.000 UVT (máx |Δ|) | 0 | 0 | tabla del art. 241 E.T. (Python) | 0.0e+0 | 1e-9 | OK |
| 15 | Continuidad de la tabla en sus límites (máx salto, en UVT; la ley redondea las sumas fijas a la unidad) | 0.1 | 0 | identidad | 1.0e-1 | 0.100000001 | OK |
| 16 | S&P 500 1928-2025: media aritmética | 0.118546551 | 0.118546511 | hoja de Damodaran (2026) | 4.0e-8 | 0.000001 | OK |
| 16 | S&P 500 1928-2025: media geométrica | 0.100177193 | 0.100177149 | hoja de Damodaran (2026) | 4.4e-8 | 0.000001 | OK |
| 16 | Letras del Tesoro: media geométrica | 0.0337162652 | 0.0337162777 | hoja de Damodaran (2026) | 1.2e-8 | 0.000001 | OK |
| 16 | Bonos a 10 años: media geométrica | 0.0453458424 | 0.0453458557 | hoja de Damodaran (2026) | 1.3e-8 | 0.000001 | OK |
| 16 | S&P 500: media geométrica real | 0.0677625944 | 0.0677625843 | hoja de Damodaran (2026) | 1.0e-8 | 0.000001 | OK |
| 16 | S&P 500: desviación estándar anual | 0.194034304 | 0.194034302 | NumPy std (ddof = 1) | 2.5e-9 | 0.000001 | OK |
| 16 | S&P 500: caída máxima con datos anuales | -0.647697804 | -0.647698324 | NumPy | 5.2e-7 | 0.000001 | OK |
| 16 | Lognormal ajustada: E[1+R] = 1+μ (diferencia) | 0 | 0 | identidad | 0.0e+0 | 1e-12 | OK |
| 16 | Cuantil normal 0,975 | 1.95996395 | 1.95996398 | SciPy stats.norm.ppf | 3.7e-8 | 1e-7 | OK |
| 16 | Distribución normal en 1 | 0.841344739 | 0.841344746 | SciPy stats.norm.cdf | 7.5e-9 | 1e-7 | OK |
| 17 | Volatilidad de 10 activos (σ = 30 %, ρ = 0,25) en partes iguales | 0.171026314 | 0.171026314 | NumPy √(wᵀΣw) | 2.8e-17 | 1e-12 | OK |
| 17 | Peso de mínima varianza (σ 20 % y 7 %, ρ = 0,1) | 0.0831353919 | 0.0831353919 | SciPy minimize_scalar | 5.8e-16 | 1e-7 | OK |
| 17 | Correlación S&P 500 – bonos a 10 años, 1928-2025 | 0.0183367636 | 0.0183362822 | NumPy corrcoef | 4.8e-7 | 0.000001 | OK |
| 18 | Precio de un bono semestral (cupón 9 %, rendimiento 11 %, 10 años) | 880.496175 | 880.496175 | numpy-financial 1.0.0 pv | 0.0e+0 | 1e-9 (rel.) | OK |
| 18 | Duración de Macaulay del mismo bono (años) | 6.56541184 | 6.56541184 | NumPy | 0.0e+0 | 1e-9 | OK |
| 18 | Bono con rendimiento igual al cupón vale su nominal | 1000 | 1000 | identidad | 0.0e+0 | 1e-9 | OK |
| 19 | Comisión sin aportes: (1+r)ⁿ(1−f)ⁿ | 4.83726907 | 4.83726907 | fórmula cerrada | 2.2e-15 | 1e-12 (rel.) | OK |
| 20 | Fracción de Kelly (p = 0,55; pago 1,5 a 1) | 0.25 | 0.25 | SciPy minimize_scalar | 1.2e-10 | 1e-7 | OK |
| 21 | Comprar o arrendar sin diferencias de pago: quien arrienda solo capitaliza la cuota inicial | 560.441077 | 560.441077 | fórmula cerrada | 4.1e-15 | 1e-9 (rel.) | OK |
| 21 | Mismo caso: el patrimonio de quien compra es el precio (sin valorización ni costos) | 100 | 100 | identidad | 1.4e-14 | 1e-9 | OK |
| 21 | Rentabilidad bruta de un inmueble de 300 millones arrendado en 1.350.000 | 0.054 | 0.054 | 12 × canon / precio | 0.0e+0 | 1e-12 | OK |
| 25 | Pirámide con k = 6 hasta superar 53 millones: participantes totales | 7.255941e+7 | 7.255941e+7 | serie geométrica | 0.0e+0 | 0 | OK |
| 25 | Fracción en el último nivel con k = 6 (tiende a 5/6) | 0.833333336 | 0.833333336 | serie geométrica | 0.0e+0 | 1e-12 | OK |
| 25 | Contabilidad del Ponzi: caja = aportes − apropiado − pagado | 9.536743e-7 | 0 | identidad | 9.5e-7 | 0.001 | OK |
| 23 | Regla del 4 %, 50/50, 30 años: tasa de éxito histórica | 0.927536232 | 0.927536232 | pandas sobre la hoja de Damodaran | 0.0e+0 | 1e-12 | OK |
| 23 | Regla del 4 %, 75/25, 30 años | 0.942028986 | 0.942028986 | pandas sobre la hoja de Damodaran | 0.0e+0 | 1e-12 | OK |
| 23 | Retiro del 5 %, 50/50, 30 años | 0.666666667 | 0.666666667 | pandas sobre la hoja de Damodaran | 0.0e+0 | 1e-12 | OK |
| 24 | Años hasta la independencia con 50 % de ahorro (5 % real, retiro 4 %) | 16.6207724 | 16.6207724 | SciPy optimize.brentq | 1.4e-14 | 1e-9 | OK |
| 24 | Fórmula cerrada = acumulación año a año (diferencia en años) | 0 | 0 | simulación | 0.0e+0 | 0.06 | OK |
