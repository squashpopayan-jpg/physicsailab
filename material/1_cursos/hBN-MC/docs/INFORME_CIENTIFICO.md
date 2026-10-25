# hBN-MC v15.0.1 — Informe científico de validación del modelo

**Alcance.** Revisión de la física implementada en hBN-MC frente a la tesis de
M. A. Obando (*Efeito da temperatura na estabilidade de nanoporos em estruturas
2D*, FIMAT-UFOP, 2019, orientador Prof. R. J. C. Batista), el artículo en
preparación y el código heredado (v14.7.1 / v14.8.0-CLEAN). Cada afirmación
numérica de este informe se reproduce con las suites de `tests/` o con los
scripts de `tests/historico/`.

---

## 1. Los parámetros del Prof. Batista están bien implementados y se reproducen

La parametrización por defecto de la aplicación es la de la tesis y **no se ha
modificado**:

| Par | ε (eV) | Fuente |
|---|---|---|
| N–N | −185.29 | Tabla 5.8 (mínimos cuadrados, Mazzoni) |
| N–B | −128.1626 | Tabla 5.8 |
| B–B | −67.9148 | Tabla 5.8 |
| C–C | −107.32 | Tabla 5.8 |
| C–N | −147.02 | Tabla 5.8 |
| C–B | −88.01 | Tabla 5.8 |
| N–H (X–N) | −109.7987 | Tabla 5.7 (poros triangulares) |
| B–H (X–B) | −50.3121 | Tabla 5.7 |
| Vac–Vac (X–X) | −15.031 | E(H₂)/2, código Fortran |
| C–H (X–C) | −70.41 | **provisional**, no procede de la tesis |

El módulo de investigación rehace el ajuste de mínimos cuadrados sobre la
matriz del §5.2 de la tesis (20 estructuras BxCyNz de Mazzoni, celdas de 8
átomos) y **reproduce la Tabla 5.8** (prueba `I2`):

| Parámetro | Reajuste ± σ | Tesis | Δ |
|---|---|---|---|
| ε_NN | −185.2864 ± 0.303 | −185.29 | +0.0036 |
| ε_NB | −128.1626 ± 0.070 | −128.1626 | 0.0000 |
| ε_BB | −67.9148 ± 0.303 | −67.9148 | 0.0000 |
| ε_CC | −107.3213 ± 0.090 | −107.32 | −0.0013 |
| ε_CN | −147.0205 ± 0.125 | −147.02 | −0.0005 |
| ε_CB | −88.0091 ± 0.125 | −88.01 | +0.0009 |

RMS = 0.630 eV por celda (0.079 eV/átomo), residuo máximo 1.19 eV,
R² = 0.99996, RMS de validación cruzada *leave-one-out* = 0.904 eV. Las 20
filas de la matriz suman 12 enlaces y dan números enteros de átomos; la
**Tabla 5.2 impresa** tiene erratas en las filas (o)–(r) y no debe usarse
para reproducir el ajuste.

Los errores estándar (0.07–0.30 eV) son la primera cuantificación de la
incertidumbre de los parámetros y deberían reportarse en el artículo.

## 2. Escala energética: por qué las temperaturas de simulación son tan altas

Los ε no son energías de enlace físicas: absorben las energías atómicas
totales de SIESTA (por ejemplo ε_XX = E(H₂)/2 exactamente). En consecuencia
los movimientos elementales del Monte Carlo cuestan decenas de eV:

* intercambio B↔N en h-BN perfecto: ΔE = 2(ε_NN + ε_BB) − 4ε_NB = **+6.24 eV**
  (prueba `I7`); probabilidad de aceptación 5×10⁻⁷ a 5000 K y 2.7×10⁻² a
  20 000 K;
* avance de un borde (un enlace B–N → un N–H): del orden de 18–19 eV.

Por eso la tesis usa 9800 K y el ciclo de histéresis llega a 20 000 K. Estas
temperaturas son un **parámetro de control del muestreo**, no temperaturas
físicas (h-BN se descompone muy por debajo). v14.x limitaba la interfaz a
5500 K, lo que impedía reproducir los protocolos del artículo; v15 admite
hasta 20 000 K y un modo *ciclo* (Ti → Tf → Ti) con la curva E(T).

**Consecuencia para el artículo:** no puede afirmarse que la simulación
“reproduce la transición a ~700 °C” sin una correspondencia explícita entre
la temperatura de simulación y la física. La comparación honesta con los
HRTEM de Pham *et al.* (2016) es de **orden relativo de energías de
formación**, que el módulo *Energética de poros* calcula a T = 0.

## 3. Estabilidad de los poros: el término vacancia–vacancia y la penalización H–H

### 3.1 Energía de borde por hidrógeno

En una lámina h-BN ordenada, con composición y número de vacancias fijos, la
energía del Monte Carlo depende del perímetro del poro solo a través del
número de H de pasivación, N_H:

  E = constante + N_H · e_H,  e_H = −(ε_NB − ε′_XN − ε′_XB)/2 − ε′_XX/2

(ε′ = valores efectivos con el reservorio activo; prueba `M10`, que verifica
la fórmula contra diferencias finitas con error < 10⁻⁸ eV).

| Reservorio | e_H |
|---|---|
| Tesis (ε_XX = E(H₂)/2, sin Δμ_H) | **−8.46 eV** |
| Gran canónico H₂, Δμ_H = 0 | −0.94 eV |
| Gran canónico H₂, Δμ_H = −1.5 eV | +0.56 eV |

Con e_H < 0 **aumentar el perímetro reduce la energía**: un poro compacto
tiende a fragmentarse en monovacancias. En el Hamiltoniano de la tesis el
término ε_XX = E(H₂)/2 por enlace vacancia–vacancia equivale a un potencial
químico implícito del H de E(H₂)/4, es decir 7.5 eV por encima del H₂.

### 3.2 Experimento (tests/historico/experimento_estabilidad_poro.js)

Poro triangular de borde N (25 vacancias), red 24×24 PBC, 60 000 pasos,
semilla 7:

| Caso | 5000 K | 10 000 K | 20 000 K |
|---|---|---|---|
| Tesis, sin penalización H–H | 25 monovacancias (ΔE = −507 eV) | 25 monovacancias | 25 monovacancias |
| Tesis, K_HH = 35 eV (por defecto) | triángulo intacto, aceptación 0 % | triángulo intacto | triángulo intacto (24.6 % de aceptación, desorden B/N) |
| H₂, Δμ_H = 0 | 25 monovacancias | fragmentado | fragmentado |
| H₂, Δμ_H = −1.5 eV | triángulo (24 + 1) | paralelogramo de 14 + fragmentos | fragmentado |

**Interpretación.**
* Con el Hamiltoniano de la tesis, la única razón por la que un poro no se
  disuelve es la **penalización estérica empírica** K_HH = 35 eV (3 pares por
  monovacancia, 2 por divacancia y 3 por poro clasificado como triangular),
  que no procede del DFT. Además esa penalización depende del clasificador
  geométrico, de modo que introduce en la energía un término que cambia con
  la forma asignada.
* En modo gran canónico con Δμ_H suficientemente negativo (ambiente pobre en
  H) el poro es compacto a baja temperatura y, al subir T, se fragmenta
  parcialmente con un fragmento mayor de tipo paralelogramo, **sin**
  necesidad de la penalización empírica. Es el tipo de reorganización que
  describe el artículo, aunque aquí debe cuantificarse con réplicas.

Recomendación: en el artículo, declarar el término ε_XX y la penalización
H–H, y presentar los resultados de morfología en modo gran canónico con
Δμ_H explícito (o, como mínimo, un análisis de sensibilidad a K_HH).

### 3.3 El listado Fortran de la tesis

En el Apéndice de la tesis, la subrutina `calculo_energia` (línea 382 del
listado) se imprime así:

```
energias=(-185.29*cNN)+(-128.1626*cNB)+(-67.9148*cBB) ! +(-50.3121*cXB)+(-109.7987*cXN)+(-15.031)*cXX
```

Si el `!` está en el código fuente (la extracción del PDF lo muestra en la
misma línea lógica 382), los términos X–B, X–N y X–X **están comentados** y
esa versión solo cuenta enlaces N–N, B–N y B–B. Debe comprobarse qué versión
del Fortran produjo las Figuras 5.4–5.7 de la tesis (Figuras 3–5 y 8 del
artículo). La aplicación JS implementa el modelo completo de la ecuación (1)
del artículo.

## 4. Potenciales químicos y energía de formación

### 4.1 Los límites “rico en N / rico en B” estaban invertidos (corregido)

Con las energías de la Tabla 5.1,

  E(NH₃) + E(BH₃) − 3E(H₂) = −388.064 eV  <  E(BN) = −386.72 eV,

es decir, **con μ_H = E(H₂)/2 la lámina h-BN es menos estable que NH₃ + BH₃**
por 1.34 eV por par BN. La ventana de estabilidad [μ_BN − μ_B,máx , μ_N,máx]
está vacía y v14.x calculaba μ_N(rico en N) = −283.277 < μ_N(rico en B) =
−281.933 eV sin advertirlo. v15 define los límites correctamente, informa si
la ventana está vacía y a partir de qué Δμ_H se abre:

* con μ_BN = E(BN) (Tabla 5.1): Δμ_H ≤ −0.224 eV;
* con μ_BN = 3ε_NB (escala del modelo, por defecto en v15): Δμ_H ≤ −0.596 eV.

Es un resultado que el artículo debe discutir: o bien la referencia de H₂
de SIESTA está mal convergida respecto de las demás, o los cálculos requieren
condiciones pobres en H para que h-BN sea estable frente a la hidrogenación.
También debe aclararse si “BN” y “C2” de la Tabla 5.1 son la lámina por
unidad de fórmula (lo que indican los valores) o moléculas diatómicas (como
dice el texto del artículo).

### 4.2 Definición coherente de E_form

v14.x calculaba E_form con la energía del Monte Carlo (incluyendo el término
vacancia–vacancia, la penalización H–H y el desplazamiento de μ_H) y con
μ_BN = E(BN), de modo que la lámina perfecta tenía E_form ≠ 0 (+1.12 eV por
átomo). v15 usa

  E_form = E_fís − n_B μ_B − n_N μ_N − n_C μ_C − n_H μ_H,

con E_fís sin el término vacancia–vacancia, la penalización H–H informada
aparte y μ_BN = 3ε_NB, μ_C = 1.5ε_CC. Resultados verificados (prueba `M9`):

* h-BN y grafeno perfectos: E_form = 0 exactamente;
* V_B + 3H en rico en N: E_form = 3(ε_XN − E(NH₃)/3) = −1.026 eV;
* V_N + 3H en rico en B: E_form = 3(ε_XB − E(BH₃)/3) = −1.056 eV;
* ambos son independientes de ε_NB (misma escala de μ).

Las energías de formación negativas de las vacancias pasivadas son una
consecuencia directa de que ε_XN y ε_XB son 0.34–0.35 eV más negativos que
E(NH₃)/3 y E(BH₃)/3.

### 4.3 La otra escala de ε_NB (D3, pendiente)

ε_XN y ε_XB se obtuvieron con ε_NB = E(BN)/3 = −128.9067 eV, no con el valor
del ajuste (−128.1626). La diferencia (0.744 eV por enlace B–N) afecta a
cualquier movimiento que cambie el número de enlaces B–N en un borde. La
solución es un ajuste global único; la pestaña INV lo permite (estructuras
adicionales en CSV, parámetros libres y fijos, covarianza y validación
cruzada), pero requiere los datos DFT completos de los poros.

## 5. Inconsistencias en las tablas de la tesis (afectan a la Tabla 3 del artículo)

Con ε_NB = E(BN)/3:

| Energía (Tabla 5.4) | Emparejamiento de la Tabla 5.6 | ε_XH resultante |
|---|---|---|
| −45906.34 (NH I) | 351 B–N, 6 N–H | −110.01 (tesis −109.87) |
| −45074.84 (NH II) | 342 B–N, 9 N–H | −109.86 (tesis −109.84) |
| −44539.35 (BH I) | 351 B–N, 6 B–H | **+117.8** (físicamente imposible) |
| −44539.35 (BH I) | 342 B–N, 9 B–H | −50.36 |
| −42251.47 (NH III) | 330 B–N, 12 N–H | **+24.0** |
| −42251.47 (NH III) | 315 B–N, 15 N–H | −109.72 (tesis IV: −109.71) |
| −41359.76 (BH II) | 315 B–N, 15 B–H | −50.28 (tesis III: −50.28) |

Las energías y los conteos de enlaces de las Tablas 5.4 y 5.6 están
desplazados entre filas. Además, en la Tabla 5.3 la estructura “terminación N
con H” (−45548.67 eV) es la que corresponde a enlaces B–H y la “terminación B
con H” (−45905.85 eV) a enlaces N–H: las etiquetas parecen intercambiadas. La
Tabla 3 del artículo hereda estas filas. Recomendación: re-extraer las
energías de las salidas de SIESTA y publicar una tabla completa (N_átomos,
n_BN, n_NH, n_BH, E_DFT) como material suplementario.

## 6. Calibración de ε_CH (protocolo eps_xc_obando.tex)

El protocolo propone ε_XC^(AC) = [E(AC+H) − E(AC) − n_H μ_H]/n_XC. **Esa
expresión es la energía de hidrogenación por H (≈ −1.7 eV), no ε_XC.** Si se
introduce en el modelo rompe la escala por un factor ~40. Las rutas correctas
(implementadas en INV → *Calibración de ε_CH*) son:

* directa: ε_XC = [E(cinta+H) − n_CC ε_CC]/n_CH, informada con ε_CC del
  ajuste y con E(C₂)/3 (la diferencia es la incertidumbre de escala);
* indirecta: ε_XC = ΔE_hidrog + E(H₂)/2 + ε_CC/2.

La cinta ZZ-H propuesta con 24 C y solo 4 H deja enlaces colgantes
(3n_C − n_H impar/incompleto), que el modelo de enlaces no describe: la cinta
debe estar completamente pasivada (mono-H en todos los C de borde). La
herramienta lo detecta y avisa.

## 7. Defectos de software corregidos en v15 que afectaban a resultados

1. **ε_CH efectivo = −69.80 eV, no −70.41.** Al arrancar, la interfaz leía los
   campos AC/ZZ del HTML (−69.80) y sobrescribía el valor del núcleo. Toda
   corrida con carbono y vacancias hecha con v14.7/v14.8 usó −69.80, y la
   interfaz lo rotulaba como “valor DFT (SIESTA/GGA-PBE)”, lo que es falso.
2. **Signo y pesos de μH.** v14.x sumaba +μH con pesos 1/0.5/0.7 (N/B/C); el
   signo favorecía la pasivación en ambientes pobres en H y los pesos no
   tienen base termodinámica. v15 aplica −Δμ_H por H.
3. **Exportación CSV y de gráficas rota.** `exportCSV()` y `exportChartsPNG()`
   usaban una variable local de otra función (`bcPre`) y fallaban con
   ReferenceError. La tabla de enlaces del informe PNG dividía por 2 las
   contribuciones X–N y X–B.
4. **Generadores de poro en tamaños pequeños.** Con tamaño 2, “triángulo
   borde N” producía 4 fragmentos terminados en B (y viceversa); con tamaño
   1 los paralelogramos no quitaban ningún átomo. v15 valida cada poro (un
   clúster, terminación pura) y los triángulos tienen n² vacancias
   (4, 16, 25, 64, 100, 121) en AC y ZZ (prueba `M11`).
5. **E_f “normalizada” heredada** con μ = ε_NB/2 para B y N: sin sentido
   físico; retirada y sustituida por E_form coherente.
6. **Suites que no fallaban.** Las pruebas de v14.x imprimían FAIL pero
   terminaban con código 0; v15 devuelve código 1 ante cualquier fallo.

## 8. Protocolos de investigación recomendados con v15

1. **Energética de poros (T = 0).** INV → *Energética de poros*: E_form de
   triángulos N/B, paralelogramos y hexágonos por tamaño, frente a μ_N y
   Δμ_H. Es el análisis tipo Wulff que se compara con HRTEM sin depender de la
   escala de temperatura.
2. **Barrido térmico con intercambio de réplicas.** INV → *Barrido*: ⟨E⟩(T),
   C_v por fluctuaciones, aceptación de intercambios, forma mayoritaria del
   poro, fracción de borde N y α_C. Reservorio H₂ con Δμ_H explícito.
3. **Histéresis.** CTRL → modo *Ciclo* y gráfica E(T); repetir con varias
   semillas (modo LOTE) para dar barras de error.
4. **Segregación BNC.** α_C de Warren–Cowley (INV → *Análisis*) frente a T y
   composición.
5. **Ajuste global.** INV → *Reajuste* con las estructuras de poro y de
   nanocintas en CSV, parámetros H libres y ε_NB común.
6. **Sensibilidad.** INV → *Parámetros*: variar un ε dentro de ±2σ del ajuste
   y comprobar la robustez de cada conclusión; el conjunto activo queda
   registrado en todos los CSV.
