# hBN‑MC v14.6 — Auditoría independiente, fundamento físico y ruta a publicación

**Revisor:** análisis de código línea a línea + 20 pruebas numéricas ejecutadas en Node.js sobre `core.js` cargado en un entorno headless.
**Base auditada:** `hbnC_v14_6_edge_realfix` (8 647 líneas de JS, 9 módulos).
**Referencia física:** M. A. Obando, *Efeito da temperatura na estabilidade de nanoporos em estruturas 2D*, FIMAT‑UFOP, 2019.

---

## 0. Veredicto en una página

El **motor Monte Carlo es correcto**. Lo verifiqué contra fuerza bruta con errores de 10⁻¹¹ eV (precisión de doble) en topología, energía total, ΔE local, ΔE global, deriva incremental sobre 20 000 pasos, reproducibilidad por semilla e invariancia traslacional bajo PBC. Es publicable.

Lo que **no** está listo para publicar son tres capas por encima del motor:

| # | Defecto | Severidad | Efecto sobre el artículo |
|---|---------|-----------|--------------------------|
| **D1** | `μ_B = μ_N` por defecto | **Crítico** | Energías de formación sin sentido físico para poros no estequiométricos (error de ~900 eV) |
| **D2** | Generadores de poro dibujan en espacio de índices anisótropo | **Alto** | Tus "triángulos" y "hexágonos" **no lo son**, y salen fragmentados |
| **D3** | Dos valores incompatibles de ε_BN en el mismo pipeline | **Alto** | Desfase sistemático de 0.744 eV/enlace en toda la energética de bordes |
| **D4** | Clasificador de poros no invariante bajo traslación periódica | Medio | El mismo poro se clasifica distinto según dónde caiga |
| **D5** | Clasificador mezcla métricas de índices y de espacio real | Medio | Umbrales de forma arbitrarios |
| **D6** | Generadores aleatorios `opc=3,4` no conservan estequiometría | Medio | La varianza del ensemble mezcla composición con configuración |
| **D7** | `calcDeltaE_global` incorrecto para pares vecinos | Bajo (latente) | Mina para el futuro; hoy está protegido |
| **D8** | Justificación física de ε_XC = −69.80 eV es incorrecta *en sus propios términos* | Alto | Un revisor lo va a detectar |

Los parches concretos están en `PARCHES_v14.7.js`. La buena noticia: **D2 y D4 son de post‑proceso y de construcción de estado inicial, no del motor**, así que corregirlos no invalida nada de lo que ya sabes que funciona.

---

## 1. Lo que verifiqué que está bien (con evidencia numérica)

### T1 — Topología de la red
Para AC y ZZ, en redes 12×12, 12×20, 20×12 y 16×16 con PBC completa:

- **Grado 3** en el 100 % de los sitios.
- **Simetría de vecindad** perfecta (si *b* ∈ vecinos(*a*), entonces *a* ∈ vecinos(*b*)) — 0 violaciones.
- **Alternancia B/N** sin una sola violación.
- **Distancia de enlace** = 1.44 Å exacta con imagen mínima: 0 fallos de 768 enlaces, error máximo 0.00e+00.

Con bordes abiertos, los histogramas de grado son los esperados (PBC‑X: 32 sitios de grado 2; abierto: 2 de grado 1, 44 de grado 2) y la simetría se mantiene. **`physNB()` y `atomPos()` son mutuamente consistentes.** Esto no es trivial: las deltas ±1/±3 en fila son fáciles de equivocar y están bien.

### T2 — Energía total
`calcFullE()` vs suma explícita sobre pares únicos, configuración desordenada con B/N/C/vacancias:

```
calcFullE   = -42730.658700 eV
fuerza bruta= -42730.658700 eV     |diff| = 7.3e-12   PASS
```

Con μ_H = 0.3 y 0.5 eV, `epsEff()` reproduce exactamente `calcFullE()` (diff < 5e‑11). **La corrección v14.0 del μ_H está bien hecha.**

### T3/T4 — ΔE incremental
- **Local (vecinos):** 2 848 intercambios, error máximo 1.1e‑11 eV, para μ_H = 0, 0.3 y 0.5.
- **Global (no vecinos):** 2 754 intercambios, error máximo 1.2e‑11 eV.

### T5 — Deriva sobre MC real
20 000 pasos mezclando `metro()` y `metro_global()`:

| configuración | deriva \|E_inc − calcFullE\| |
|---|---|
| μ_H=0, hPass=off | 2.2e‑11 eV |
| μ_H=0.5, hPass=off | 2.2e‑11 eV |
| μ_H=0, hPass=**ON** | 1.5e‑11 eV |
| μ_H=0.4, hPass=**ON** | 7.3e‑12 eV |

**Cero deriva incluso con pasivación H activa**, que es el caso difícil (el término de solape H–H no es local). Esto es lo que más me sorprendió positivamente.

### T6 — Reproducibilidad
Misma semilla → misma E bit a bit y misma configuración final. Semilla distinta → trayectoria distinta. **Requisito de revisión por pares, cumplido.**

### T15b — Invariancia traslacional bajo PBC
El mismo poro (19 vacancias, crecido por BFS) colocado en 6 posiciones distintas de la celda, incluida la esquina periódica:

```
paridad i+j=0:  E = -108081.2643 en las 6 posiciones   dispersión = 0.00e+00 eV
paridad i+j=1:  E = -107188.9653 en las 6 posiciones   dispersión = 0.00e+00 eV
```

Dispersión **exactamente cero**. La implementación de PBC es correcta. (La diferencia entre paridades es física: poro terminado en N vs en B — ver §3.2.)

### T8 — Los parámetros publicados son el ajuste correcto
Rehice el ajuste de mínimos cuadrados desde la matriz de la sección 5.2 de tu tesis:

| parámetro | mi reajuste | tu Tabla 5.8 | diferencia |
|---|---|---|---|
| ε_CC | −107.3213 | −107.3200 | −0.0013 |
| ε_CN | −147.0205 | −147.0200 | −0.0005 |
| ε_CB | −88.0091 | −88.0100 | +0.0009 |
| ε_NN | −185.2864 | −185.2900 | +0.0036 |
| ε_BN | −128.1626 | −128.1626 | 0.0000 |
| ε_BB | −67.9148 | −67.9148 | 0.0000 |

**RMS residual = 0.6297 eV · máx |residual| = 1.19 eV · R² = 0.999961**

Sobre estructuras de ~1 400 eV, en celdas de 8 átomos: **0.079 eV/átomo**. *Ese es el número que va en el abstract del artículo.*

> **Errata que debes corregir antes de publicar:** la Tabla 5.2 impresa de tu tesis tiene erratas en las filas (o), (p), (q), (r) — sus enlaces suman 10, 14, 10 y 15 en lugar de 12. La matriz de la sección 5.2 suma 12 en las 20 estructuras (correcto: celda de 8 átomos → 8×3/2 = 12 enlaces). Si alguien intenta reproducir tu ajuste desde la tabla impresa obtiene basura: R² = 0.49 y ε_BB = **+7.95 eV** (positivo). Publica la matriz, no la tabla.

---

## 2. Los defectos, en detalle

### D1 — [CRÍTICO] El defecto `μ_B = μ_N` produce energías de formación sin sentido

`core.js` inicializa:

```js
let FORM_MU_B=1.5*EPS_NB;   // -192.244 eV
let FORM_MU_N=1.5*EPS_NB;   // -192.244 eV
```

Ese reparto 50/50 **sí** satisface la restricción correcta μ_B + μ_N = μ_BN. Pero es el punto medio arbitrario, y para cualquier poro **no estequiométrico** (que es justamente el caso interesante: los poros triangulares en h‑BN son mono‑sublattice) la energía de formación queda dominada por la diferencia de energía atómica total entre N y B (~59 eV/átomo), no por la física del borde.

Medición directa — dos poros idénticos de 19 vacancias, uno con borde N y otro con borde B, misma red 24×24:

| escenario | E_f(borde N) | E_f(borde B) | ΔE_f |
|---|---|---|---|
| **Defecto (μ_B = μ_N)** | −1001.41 eV | +3.62 eV | **−1005.03 eV** |
| Rico en N | +69.84 eV | +175.70 eV | −105.86 eV |
| Rico en B | +63.12 eV | +182.42 eV | −119.30 eV |

Los 1 005 eV son un **artefacto puro**. Con potenciales químicos físicos la diferencia cae a ~110 eV y, lo más importante, **depende del ambiente químico** — que es exactamente el resultado que tu tesis quería capturar (§3.3, ecuaciones 3.44–3.45).

**Los valores físicos correctos, derivados de tu propia Tabla 5.1:**

```
μ_BN  = 3·ε_BN = E(BN) = −386.720 eV        (restricción de equilibrio con la lámina)
μ_H   = E(H₂)/2 = −15.031 eV

límite RICO EN N:  μ_N = E(NH₃) − 3μ_H = −283.277  →  μ_B = μ_BN − μ_N = −103.443
límite RICO EN B:  μ_B = E(BH₃) − 3μ_H = −104.787  →  μ_N = μ_BN − μ_B = −281.933

rango accesible de μ_N: [−283.28, −281.93] eV   (ancho 1.34 eV)
```

**Acción:** cambia los valores por defecto a los del límite rico en N y añade un selector "ambiente químico" (rico‑N / rico‑B / intermedio) en el panel. Y en el artículo, **toda figura de energía de formación debe ir con su μ declarado**, o presentar E_f como función de μ_N barriendo ese rango de 1.34 eV (es la convención estándar en la literatura de defectos y es lo que un revisor de PRB espera ver).

### D2 — [ALTO] Los generadores de poro no producen las formas que dicen producir

Este es el hallazgo más importante para tus figuras.

Los generadores `opc = 6, 7, 10–14` construyen las formas en **espacio de índices (i, j)**, asumiendo implícitamente que un paso en *i* y un paso en *j* son equivalentes. No lo son. De `atomPos()`:

- Δj = 2 ↔ **4.32 Å** en x → **2.16 Å por unidad de índice j**
- Δi = 2 ↔ **2.494 Å** en y → **1.247 Å por unidad de índice i**

Anisotropía = 2.16/1.247 = **√3**. Además, los vecinos están en Δi ∈ {±1, ±3}, no en Δi = ±2, así que la contigüidad en índices **no implica** contigüidad física.

Resultado medido (`opc=10`, "Triángulo terminación N", sz=3, red 24×24):

```
mapa en espacio de ÍNDICES        mapa en espacio REAL (x horiz., y vert.)
|#######|                          |    #      #    #                 |
|.#####.|                          |                                  |
|..###..|                          |            #                     |
|...#...|                          |# #  #  #  #  #  #  #  #  #  #  # |
   triángulo perfecto              |     #    #   #    #   #          |

extensión real: dx = 12.96 Å,  dy = 3.74 Å      (relación 3.46 : 1)
clusters físicos: [14, 1, 1]  ← el "poro" está FRAGMENTADO en 3 piezas
```

No es un triángulo. Son dos filas casi horizontales más dos vacancias sueltas.

Lo mismo en todos los demás:

| opc | forma declarada | vacancias | clusters físicos | extensión real |
|---|---|---|---|---|
| 6 | Paralelogramo | 24 | **[20,1,1,1,1]** | 7.2 × 11.2 Å |
| 7 | Triangular (legacy) | 36 | **[30,1,1,1,1,1,1]** | 11.5 × 13.7 Å |
| 10/11 | Triángulo N/B | 16 | **[14,1,1]** | 13.0 × 3.7 Å |
| 12/13 | Paralelogramo N/B | 49 | **[42,2,2,2,1]** | 19.4 × 8.7 Å |
| 14 | Hexágono | 37 | **[32,2,1,1,1]** | 13.7 × 8.7 Å |

**Ninguno produce un poro conexo de una sola pieza.** La corrección del hexágono en v14.0 arregló el conteo (37 vacancias, correcto) pero no la forma.

Nota importante: esto lo heredaste de la implementación Fortran de la tesis (`matriz_furotriangular` usa el mismo bucle `k=j; k=k+1` en índices). O sea, **también afecta a las Figuras 5.5–5.6 de tu tesis**. No invalida la conclusión física (la segregación B–N y el ordenamiento son robustos, T18 lo confirma), pero sí invalida cualquier afirmación sobre *morfología de poro específica* hecha a partir de esos estados iniciales.

**La corrección** (implementada y verificada en `PARCHES_v14.7.js`): generar el poro **en espacio real**, marcando como vacancia todo sitio cuyo `atomPos(i,j)` caiga dentro del polígono deseado, orientado según las direcciones cristalográficas. Resultado verificado:

```
Triángulo    AC:  37 vac, 1 cluster, CONEXO,  extensión 13.0 × 11.2 Å
Paralelogr.  AC:  17 vac, 1 cluster, CONEXO,  extensión  8.6 ×  5.0 Å
Hexágono     AC:  19 vac, 1 cluster, CONEXO,  extensión  6.5 ×  7.5 Å
Hexágono     ZZ:  25 vac, 1 cluster, CONEXO,  extensión  7.5 ×  8.6 Å
```

Y para la terminación de sublattice, un paso de **purificación de borde** (2 iteraciones, verificado):

```
purificar a borde-N: poro de 46 vac, 1 cluster, vecinos N=30 B=0   → mono-terminado
purificar a borde-B: poro de 49 vac, 1 cluster, vecinos N=0  B=33  → mono-terminado
```

### D3 — [ALTO] Dos valores incompatibles de ε_BN

El código usa `EPS_NB = −128.1626` (el ajuste de mínimos cuadrados). Pero **ε_XN y ε_XB fueron derivados con un ε_BN distinto**. Lo verifiqué reproduciendo el procedimiento de la tesis (ε_NH = [E_DFT(poro) − n_BN·ε_BN] / n_NH):

| estructura | con ε_BN = −128.1626 (LSQ) | con ε_BN = −128.907 (= E(BN)/3) | tesis reporta |
|---|---|---|---|
| (I)NH | −153.54 | **−110.02** | −109.87 |
| (II)NH | −138.14 | **−109.86** | −109.84 |

El valor publicado solo se recupera con **ε_BN = E(BN)/3 = −128.907**, el valor diatómico. Desfase: **0.744 eV por enlace B–N**.

¿Importa? Un desplazamiento uniforme de ε_BN no afecta a ΔE de movimientos que conservan el número de enlaces B–N. Pero **sí** afecta a los movimientos de borde de poro, que son precisamente los que gobiernan la morfología:

```
movimiento "avanzar el borde": 1 enlace B–N → 1 enlace N–H
  ΔE con ε_BN = −128.1626 :  18.364 eV
  ΔE con ε_BN = −128.907  :  19.108 eV
  diferencia: 0.744 eV → a 1000 K el factor de Boltzmann cambia en e^8.6 ≈ 5000×
```

**Acción recomendada (y es tu contribución metodológica más fuerte):** haz **un único ajuste global** de mínimos cuadrados que incluya simultáneamente las 20 estructuras de Mazzoni, las moléculas simples, los poros triangulares NH/BH, los poros hexagonales y las nanocintas de grafeno hidrogenadas, con el vector de parámetros completo [ε_CC, ε_CN, ε_CB, ε_NN, ε_BN, ε_BB, ε_XN, ε_XB, ε_XC]. Una sola escala, una sola matriz de covarianza → **barras de error sobre cada ε**. Eso es publicable en *Computer Physics Communications* por sí solo.

### D4/D5 — [MEDIO] El clasificador de poros

**No es invariante bajo traslación periódica.** El mismo poro (BFS, 19 vacancias) da:

```
en el CENTRO  : parallelogram   ratio 2.000   compacidad 0.873   hv 6
en la ESQUINA : hexagon         ratio 1.000   compacidad 0.733   hv 6
```

El clustering **sí** detecta el poro completo (mismo tamaño en ambos casos), pero el casco convexo se calcula con coordenadas sin desplegar por PBC. Ya lo tenías documentado en tu auditoría v14; aquí está la demostración cuantitativa.

Además, `ratio = spanI/spanJ` se mide en **espacio de índices**, que es anisótropo por √3, mientras que `compactness` se mide en espacio real. Los umbrales (0.66, 0.82, 1.24, 1.52, 0.58, 0.70, 0.74) mezclan dos sistemas de unidades distintos, así que son numerológicos, no geométricos.

*(Nota: las constantes AC fijas en `classifyPoreCluster` resultan inofensivas para la transposición AC↔ZZ, porque `hullVertices` y `compactness` son invariantes bajo intercambio de ejes. Verificado: AC y ZZ dan idéntica clasificación. El riesgo real aparece con geometrías del Constructor.)*

**Corrección:** desplegar el clúster por imagen mínima antes del casco convexo, y calcular *todas* las métricas en espacio real. Está en el parche.

### D6 — [MEDIO] Estequiometría no conservada en los generadores aleatorios

40 semillas por generador, red 16×16 (256 sitios):

| generador | ⟨N⟩ ± σ | ⟨B⟩ ± σ | máx \|N−B\| |
|---|---|---|---|
| `opc=2` hBN + vac. | 107.1 ± 2.9 | 108.9 ± 2.9 | 14 |
| `opc=20` hBN + C | 107.1 ± 2.9 | 108.9 ± 2.9 | 14 |
| `opc=3` red aleatoria | 101.2 ± 6.8 | 104.7 ± 7.8 | **28** |
| `opc=4` aleatoria+C+vac | 106.3 ± 7.0 | 109.8 ± 7.0 | **38** |

`opc=3` y `opc=4` sortean el **tipo** en cada sitio independientemente; `opc=2` y `opc=20` sortean **sitios** (correcto). En un ensemble de réplicas, esto hace que σ_E mezcle fluctuación de composición con fluctuación configuracional — lo vi directamente en T18: σ_E = 1 084 eV, casi todo composición.

**Acción:** en `opc=3` y `opc=4`, generar exactamente ⌊n/2⌋ N y ⌈n/2⌉ B y barajar (Fisher‑Yates, que ya usas en `opc=4` para C y vacancias).

### D7 — [BAJO, latente] `calcDeltaE_global` es incorrecto para pares vecinos

```
pares NO vecinos : n=2754, error máximo 1.2e-11 eV   PASS
pares VECINOS    : n=40,   error máximo 1.93e+1 eV   FAIL
```

La lógica de "vecinos compartidos con contribución neta cero" es correcta, pero **omite el enlace directo entre los dos sitios**. Hoy no se dispara porque `attemptSwapPair` desvía esos casos a `calcDeltaE`:

```js
const dE=(!globalMove || isNeighbor)?calcDeltaE(i1,j1,i2,j2):calcDeltaE_global(...);
```

Confirmé por grep que ese es el **único** punto de llamada. O sea: código muerto correcto por accidente. Pero con `n = 256` sitios, `pickGlobalPair` elige un vecino ~1.2 % de las veces, así que si alguien alguna vez llama a `calcDeltaE_global` directamente, el 1 % de los movimientos globales tendrá un ΔE erróneo por hasta 19 eV. **Añade el término del enlace directo, o haz que la propia función delegue en `calcDeltaE`.**

### D8 — [ALTO] La justificación de ε_XC = −69.80 eV no se sostiene

El comentario en `core.js` dice:

> *"Coherencia física: |ε_CH| = 69.8 queda entre B–H (50.31) y N–H (109.80), acorde a la electronegatividad intermedia del C."*

Ese argumento es **circular respecto a la escala equivocada**, y lo desarrollo en §3.3. Resumen: la magnitud bruta de ε_XY está dominada por la energía atómica total, no por la fuerza del enlace. Al descontarla, ε_XC = −69.80 corresponde a una energía de hidrogenación de **−1.11 eV**, que queda **fuera** del intervalo B(−1.32) … N(−2.12), no entre ellos. La monotonía con la electronegatividad se **rompe**, no se cumple.

El valor consistente es **ε_XC ≈ −70.4 eV** (ver §3.3).

---

## 3. El fundamento físico que necesitas dominar para el artículo

### 3.1 Qué son realmente tus ε (y por qué un revisor va a preguntar)

Un revisor que vea "ε_NN = −185.29 eV por enlace N–N" va a parar en seco: las energías de enlace covalente reales son de unos pocos eV. Necesitas anticiparlo.

Los ε **no son energías de enlace**. Son coeficientes de un ajuste lineal que **absorben las energías totales atómicas de SIESTA** (pseudopotencial + base). Verificación con tu propia Tabla 5.1:

| cantidad | valor | parámetro | valor | diferencia |
|---|---|---|---|---|
| E(BN)/3 | −128.907 | ε_BN (LSQ) | −128.163 | −0.744 |
| E(NH₃)/3 | −109.457 | ε_XN | −109.799 | +0.342 |
| E(BH₃)/3 | −49.960 | ε_XB | −50.312 | +0.352 |
| E(CC)/3 | −108.227 | ε_CC (LSQ) | −107.320 | −0.907 |
| **E(H₂)/2** | **−15.031** | **ε_XX** | **−15.031** | **0.000** |

ε_XX = E(H₂)/2 **exactamente**. Confirma la escala: es energía total, no energía de enlace.

**Consecuencia inmediata y absolutamente central:** las energías totales de estructuras con **composición distinta no son comparables**. Solo lo son las energías de formación:

$$E_f = E_T - \sum_\gamma N_\gamma\,\mu_\gamma \qquad (\gamma = \text{B, N, C, H})$$

con la restricción de equilibrio con la lámina: μ_B + μ_N = μ_BN = 3ε_BN.

Esto es exactamente lo que dice la ecuación 3.37 de tu tesis. El código lo implementa en `calcFormationEnergyDFTLike()`. **Úsalo en todas las figuras.**

### 3.2 Descomposición aditiva: de dónde sale la segregación

Define a_X = ε_XX / 2 (la "cuota atómica" de cada especie):

```
a_N = ε_NN/2 = −92.645     a_B = ε_BB/2 = −33.957     a_C = ε_CC/2 = −53.660
```

Ahora compara ε_XY con la predicción puramente aditiva a_X + a_Y:

| par | aditivo | real | **exceso** |
|---|---|---|---|
| B–N | −126.602 | −128.163 | **−1.560 eV** |
| C–N | −146.305 | −147.020 | −0.715 eV |
| C–B | −87.617 | −88.010 | −0.393 eV |

**Ese exceso de −1.56 eV en el enlace B–N es la fuerza motriz completa de la segregación.** Toda la física de "el C segrega en dominios de grafeno y el B‑N se ordena en h‑BN" está contenida en el hecho de que el exceso B–N (−1.56) supera a los excesos C–N (−0.72) y C–B (−0.39):

```
2·exceso(B–N) + 2·exceso(C–C=0)  <  exceso(C–N) + exceso(C–B) + ...
```

Es un resultado limpio, cuantitativo y explicable en tres líneas. **Debería ser el párrafo central de tu sección de resultados**, y es mucho más convincente que mostrar una figura de dominios segregados sin explicar el mecanismo.

### 3.3 El puente que necesitas: de ε a energías de enlace físicas

Esta es la identidad que resuelve el problema del revisor escéptico y te da la calibración de ε_XC:

$$\boxed{\;\varepsilon_{XY} \;=\; \Delta E_{\text{hidrog}}(\text{Y–H}) \;+\; E(\text{H}) \;+\; a_Y\;}$$

con E(H) = E(H₂)/2 = −15.031 eV y a_Y = ε_YY/2. Aplicándola:

| especie | a_Y (eV) | ε_XY (eV) | **ΔE_hidrog por enlace Y–H** |
|---|---|---|---|
| N | −92.645 | −109.799 | **−2.123 eV** |
| B | −33.957 | −50.312 | **−1.324 eV** |
| C | −53.660 | −69.800 *(código)* | **−1.109 eV** ← rompe la monotonía |
| C | −53.660 | **−70.414** *(recomendado)* | **−1.723 eV** ← monótono |

Los valores de N y B caen en el rango físico normal de un enlace X–H (1–2.5 eV) y son **monótonos con la electronegatividad de Pauling**: B(2.04) → −1.32, N(3.04) → −2.12.

Para que el C (2.55) quede correctamente interpolado, ΔE_hidrog(C–H) debe estar entre −1.32 y −2.12, es decir **ε_XC entre −69.6 y −70.4 eV**. La predicción aditiva independiente lo confirma:

```
ε_XC = a_C + a_H  con  a_H ∈ [−17.154 (desde ε_XN), −16.355 (desde ε_XB)]
     → ε_XC ∈ [−70.81, −70.01]   →   valor central −70.41 ± 0.40 eV
```

**Usa ε_XC = −70.4 ± 0.4 eV como valor provisional** hasta que termines el cálculo SIESTA. El −69.80 actual está fuera del intervalo por 0.6 eV, dentro de la dispersión del modelo pero con el argumento físico invertido.

### 3.4 Fórmula correcta para calibrar ε_XC con SIESTA — y una advertencia importante

Tu plan era usar la "forma B": `ε_XC = [E(AC+H) − E(AC) − 8·E(H₂)/2] / 8`.

**Esa fórmula da la energía de hidrogenación, no ε_XC.** Produce un número de ~−1.7 eV. Si lo insertas directamente en `EPS_XC` rompes la escala del modelo por un factor de ~40 y todas tus energías de C con vacancias quedan absurdamente altas. Es un error silencioso: el código correrá sin quejarse.

**Las dos formas correctas** (equivalentes, úsalas como comprobación cruzada):

**Forma directa** — nanocinta de grafeno pasivada, que solo tiene enlaces C–C y C–H:

$$\varepsilon_{XC} = \frac{E_{\rm DFT}(\text{cinta}+\text{H}) - n_{CC}\,\varepsilon_{CC}}{n_{CH}}$$

*Usa el mismo funcional, base y criterio de fuerza (0.05 eV/Å, GGA) que generaron la Tabla 5.1.* Y usa ε_CC de forma consistente — mira D3: por analogía con cómo se derivaron ε_NH y ε_BH, corresponde el valor diatómico E(CC)/3 = −108.227, no el del LSQ. Reporta ambos.

**Forma indirecta (recomendada como control):**

$$\Delta E_{\rm hidrog} = \frac{E(\text{cinta}+\text{H}) - E(\text{cinta desnuda}) - \tfrac{n_H}{2}E(\text{H}_2)}{n_H}$$
$$\varepsilon_{XC} = \Delta E_{\rm hidrog} - 68.691 \text{ eV}$$

**Control de sanidad:** si ΔE_hidrog no cae en [−2.5, −1.0] eV, hay un error en el cálculo o en el conteo de enlaces. Si cae ahí, ε_XC saldrá automáticamente en el rango [−71.2, −69.7], compatible con la predicción aditiva.

Haz esto con **AC‑H y ZZ‑H por separado**: la diferencia entre ambos es tu barra de error física sobre ε_XC (el código ya tiene `EPS_CH_AC` / `EPS_CH_ZZ` / `EPS_CH_DISP` preparados para esto, y `updateCHCalibrationFromEdges()` promedia bien).

### 3.5 El régimen dinámico: dilo tú antes de que lo pregunten

Con |ΔE| típicos de decenas de eV y k_B T ≤ 0.85 eV incluso a 9 800 K, la tasa de aceptación medida es **0.6 % con pasivación H activa** y 4.7 % sin ella. El recocido no es un muestreo de equilibrio: es un **temple casi codicioso** donde la evolución ocurre por movimientos de frontera de bajo coste.

Esto no es un defecto — es una consecuencia directa de que los ε absorben energías atómicas, así que cualquier movimiento que cambie el entorno de un átomo cuesta decenas de eV. Pero **tienes que declararlo explícitamente en Métodos**, porque:

1. Justifica por qué necesitas un ensemble de réplicas (la trayectoria depende fuertemente de la semilla).
2. Explica la histéresis que ya observaste en la tesis.
3. Un revisor que calcule k_B T / ΔE lo va a notar y, si no lo has mencionado, va a asumir que no lo entendiste.

Si quieres muestreo de equilibrio real, la vía correcta es **reformular el modelo en términos de energías de formación** (donde las escalas atómicas se cancelan y los ΔE quedan en el rango de eV), no subir la temperatura. Eso sería una v15 y, honestamente, un segundo artículo.

---

## 4. Resultado listo para publicar que ya tienes

Ejecuté el test de ordenamiento con ensemble (12 semillas, red 16×16, 60 000 pasos, recocido T_ini → 300 K):

| T_inicial (K) | ⟨orden B–N⟩ % | σ | mín | máx |
|---|---|---|---|---|
| 12 000 | 94.18 | 1.54 | 92.2 | 96.9 |
| 9 000 | 93.45 | 1.53 | 91.4 | 95.3 |
| 6 000 | 92.84 | 2.23 | 87.5 | 96.9 |
| 3 000 | 93.32 | 2.26 | 89.1 | 97.7 |

Reproduce el resultado central de tu tesis (segregación/ordenamiento B–N desde una aleación desordenada) **ahora con barras de error**, y coincide con el 94.8 ± 4.0 % de tu auditoría v14. La σ de 1.5–2.3 puntos confirma que publicar un solo run sería indefendible.

Nota metodológica: la σ *aumenta* al bajar T_ini (1.54 → 2.26). Es consistente con el temple codicioso — menos T_ini significa menos oportunidad de escapar de dominios antifase. Eso es un resultado reportable en sí mismo.

---

## 5. Registro del software

Trabajas en Colombia, así que el camino es la **Dirección Nacional de Derecho de Autor (DNDA)**, registro de *soporte lógico*. Puntos prácticos:

- **Qué protege:** el código fuente como obra literaria (Decisión Andina 351 de 1993, Ley 23 de 1982). No protege el algoritmo ni el modelo físico, solo la expresión concreta. Es declarativo y da fecha cierta y prueba de autoría.
- **Qué se deposita:** identificación de la obra, autores, y un ejemplar del código (habitualmente las primeras y últimas páginas del listado, o el paquete completo). Prepara un ZIP con `assets/js/*`, `index.html` y un `MANIFEST.md` con hashes SHA‑256 de cada archivo.
- **Titularidad — resuélvelo antes de radicar.** Eres docente ocasional de tiempo completo de la Universidad del Cauca. Si desarrollaste el software en ejercicio de tus funciones o con recursos institucionales, la titularidad patrimonial puede corresponder a la Universidad, aunque los derechos morales (autoría) sean siempre tuyos e irrenunciables. **Consulta el estatuto de propiedad intelectual de la Universidad del Cauca y la oficina de transferencia antes de registrar a título personal.** Es mucho más fácil acordarlo antes que corregirlo después. Esto no es asesoría legal; verifícalo con la oficina jurídica de la Universidad.
- **Coautoría:** el trabajo deriva de tu tesis dirigida por el Prof. Ronaldo Batista en la UFOP. El *código* v14.6 es tuyo, pero el modelo de enlace y los parámetros DFT vienen de ese trabajo conjunto. Aclara con él la autoría antes de registrar y antes de enviar el artículo.
- **Complementa con:** DOI de Zenodo (gratis, se enlaza con GitHub y da citabilidad inmediata), licencia explícita (MIT o GPL‑3.0 — para software científico, GPL‑3.0 protege mejor las mejoras derivadas), y un `CITATION.cff`.

**Antes de radicar, arregla D1, D2 y D3.** Registrar una versión con los generadores geométricos rotos significa que la obra depositada no corresponde a la que citará tu artículo.

---

## 6. Ruta al artículo

### 6.1 Qué corregir antes de escribir nada

1. **D1** — potenciales químicos físicos por defecto + selector de ambiente.
2. **D2** — generadores de poro en espacio real + purificación de borde.
3. **D3** — reajuste global único de todos los ε con matriz de covarianza.
4. **D4/D5** — clasificador con despliegue PBC y métricas en espacio real.
5. **D6** — estequiometría fija en `opc=3,4`.
6. **D8** — ε_XC = −70.4 ± 0.4 provisional; sustituir por el valor SIESTA.
7. Retirar el control `delta` (δ_borde), que se lee pero no entra en ninguna energía. Menos superficie que defender.

### 6.2 Elección de revista

Con lo que tienes:

- **SoftwareX** — encaje más directo. Artículo corto (~6 páginas), formato fijo, requiere repositorio público y código funcional. Con el motor verificado y los parches aplicados, estás a ~4 semanas de someter. **Es por donde yo empezaría.**
- **Computer Physics Communications** — más exigente, exige el código en la Mendeley Data / CPC Program Library y un test suite. Tu batería de 20 pruebas numéricas es exactamente lo que piden; documéntala como *validation suite*. Mayor impacto, ~3 meses de trabajo.
- **Physical Review B** — solo si el artículo es sobre la *física* (morfología de poros vs T y ambiente químico), no sobre el software. Necesitarías el barrido completo E_f(μ_N) y comparación cuantitativa con los HRTEM de Pham *et al.* (2016). Es un tercer artículo, no el primero.

**Estrategia recomendada:** SoftwareX primero (establece la citabilidad del código), luego PRB con la física.

### 6.3 Estructura sugerida para el artículo de software

1. **Motivación** — los cálculos DFT de poros en h‑BN escalan mal; un modelo de enlace parametrizado por DFT permite barrer T y ambiente químico en segundos. Cita Mazzoni 2006, Martins & Chacham, Pham 2016.
2. **Modelo** — E_T = Σ ε_αβ n_αβ; energía de formación con μ; la restricción μ_B + μ_N = μ_BN; §3.2 de este informe (la descomposición aditiva y el exceso B–N de −1.56 eV) es tu explicación del mecanismo.
3. **Parametrización** — el ajuste global único, con tabla de ε ± σ. **RMS = 0.63 eV sobre celdas de 8 átomos = 0.079 eV/átomo, R² = 0.99996.** Incluye el puente de §3.3 (ΔE_hidrog monótono con electronegatividad) como validación física independiente. Esto es lo que separa tu artículo de un simple "hicimos un código".
4. **Implementación** — JS en navegador, sin instalación, RNG con semilla, modo lote, exportación XYZ/POSCAR/LAMMPS/CSV. Menciona explícitamente que es reproducible bit a bit.
5. **Validación** — la batería de pruebas. Los números de §1 de este informe son directamente citables.
6. **Casos de uso** — (a) ordenamiento B–N con barras de error (tabla de §4); (b) morfología de poro vs T con histograma de geometrías finales sobre ≥20 réplicas; (c) segregación de C en h‑BNC.
7. **Limitaciones** — dilo tú: régimen de temple codicioso; modelo de primeros vecinos sin relajación estructural; clasificador heurístico; ausencia de efectos de curvatura y de sustrato.

### 6.4 Las tres cosas que un revisor va a atacar

1. *"¿Por qué energías de enlace de −185 eV?"* → §3.1 y §3.3. Ten la tabla del puente lista en el texto principal, no en el suplementario.
2. *"¿Cómo sabemos que esto es equilibrio y no un temple?"* → §3.5. Decláralo tú, con la tasa de aceptación medida (0.6 %) y el ensemble como respuesta metodológica.
3. *"¿Por qué debemos creer los ε de H, si vienen de solo 4 estructuras?"* → el ajuste global con covarianza (D3) da barras de error honestas. Y el test de monotonía con electronegatividad es una validación independiente que no usa esas 4 estructuras.

### 6.5 Lo que falta y cuánto cuesta

| tarea | esfuerzo |
|---|---|
| Aplicar parches D1, D2, D4, D6, D7 | 1–2 días (código listo) |
| Cálculo SIESTA de las nanocintas AC‑H, ZZ‑H, AC desnuda | 1–2 semanas |
| Reajuste global de ε con covarianza | 2–3 días |
| Barrido E_f(μ_N) para poros N‑ y B‑terminados | 1 semana |
| Ensemble de morfología vs T (20 réplicas × 8 temperaturas) | 2–3 días de cómputo |
| Redacción SoftwareX | 2 semanas |

---

## Anexo — Índice de pruebas ejecutadas

| # | Prueba | Resultado |
|---|---|---|
| T1 | Topología (grado, simetría, alternancia, d=1.44 Å) — AC/ZZ, 4 tamaños, 3 modos PBC | PASS |
| T2 | `calcFullE` vs fuerza bruta, μ_H = 0 / 0.3 / 0.5 | PASS (7e‑12) |
| T3 | ΔE local vs recálculo completo, 2 848 swaps × 3 μ_H | PASS (1.1e‑11) |
| T4 | ΔE global, pares no vecinos | PASS (1.2e‑11) |
| T4b | ΔE global, pares **vecinos** | **FAIL (19 eV)** — latente, D7 |
| T5 | Deriva incremental, 20 000 pasos × 4 configuraciones | PASS (2e‑11) |
| T6 | Reproducibilidad por semilla | PASS |
| T7 | Inventario de los 31 generadores | ver D2/D6 |
| T8 | Reajuste LSQ vs Tabla 5.8 | PASS + errata en Tabla 5.2 |
| T9 | Consistencia de escala de la parametrización | D3, D8 |
| T10 | Sensibilidad al desfase de ε_BN | 0.744 eV/enlace |
| T11 | Clasificador AC vs ZZ | PASS (invariante por transposición) |
| T12 | Prototipo de generadores en espacio real | PASS |
| T13 | Purificación de borde mono‑terminado | PASS |
| T14 | Clasificador bajo traslación periódica | **FAIL** — D4 |
| T15b | Invariancia traslacional de la energía | PASS (0.00e+00) |
| T16/T17 | Energía de formación vs potenciales químicos | **D1** |
| T18 | Ensemble de ordenamiento B–N (12 semillas × 4 T) | resultado publicable |
| T19 | Estequiometría de generadores aleatorios | D6 |
| T20 | Puente ε ↔ energía de hidrogenación | validación física |

---

# ADENDA — Auditoría de los módulos restantes

Segunda pasada sobre `batch.js`, `import.js` y `export.js`, que no había cubierto a fondo.

## D9 — [CRÍTICO] El importador de SIESTA `.XV` reasigna todos los elementos

Este es el defecto más grave de los encontrados, porque **rompe exactamente el puente DFT → simulador que necesitas para el artículo**.

El formato `.XV` de SIESTA escribe, por átomo:

```
is   iza   x  y  z   vx  vy  vz
│    │
│    └── número atómico Z          ← columna 1
└─────── índice de especie (1,2,3) ← columna 0
```

`import.js:137` lee el número atómico de la **columna 0**:

```js
const Z=Math.round(v[0]);                       // ← es el índice de especie, no Z
atoms.push({symbol:elementFromZ(Z), x:v[2]/IMPORT_A2B, ...});
```

Verificación con un `.XV` sintético de una celda B–N–C–B:

```
código actual  (usa v[0]) :  H, C, C, H     ← todo mal
correcto       (usa v[1]) :  B, N, C, B     ← PASS
```

Con el mapa `{1:'H', 5:'B', 6:'C', 7:'N'}` y especies indexadas 1, 2, 3, el resultado es siempre: especie 1 → **H**, especies 2 y 3 → **C**. Es decir, **cualquier estructura h-BN importada desde SIESTA llega al simulador como una mezcla de hidrógeno y carbono**, y como el motor energético es correcto, calculará con total confianza la energía de una estructura que no existe.

Lo demás del parser está bien:
- Conversión Bohr → Å correcta (`IMPORT_A2B = 1.88973`; 1/1.88973 = 0.529177 ✓).
- Posiciones en columnas `v[2..4]`: correctas (consistentes con que `v[0]` sea el índice de especie).
- Vectores de celda con `.slice(0,3)`: correcto (las líneas de celda llevan vector + velocidad).
- Distancia B–N recuperada del test: 1.4198 Å ✓.

**Corrección: una sola línea** (`v[0]` → `v[1]`). Está en el parche. Y si alguna vez importaste un `.XV` y te pareció que "algo raro pasaba con los colores", era esto.

## D10 — [ALTO] El histograma de geometrías del lote hereda D4/D5

`batchClassifyAllPores()` llama a `classifyPoreCluster()`, es decir, al clasificador que **no es invariante bajo traslación periódica** (§2, D4) y que mezcla métricas de espacio de índices con métricas de espacio real (D5).

Esto importa mucho más de lo que parece, porque el histograma de formas finales es **el observable estrella del artículo** — es lo que convierte tu resultado cualitativo ("a 900 °C aparecen hexágonos") en el cuantitativo ("a T alta, 14/20 réplicas terminan hexagonales"). Con el clasificador actual, ese 14/20 depende de dónde caiga el poro en la celda.

**Orden de aplicación obligatorio:** corrige D4/D5 *antes* de lanzar los lotes de producción para las figuras. Si no, hay que repetirlos.

## D11 — [MEDIO] El IC95 del lote usa la aproximación normal

`batchStats()` calcula la σ muestral con n−1 (correcto) pero después:

```js
ci95: 1.96*sem
```

Para n < 30 corresponde el factor t de Student, no 1.96:

| n | factor correcto (t₀.₉₇₅) | 1.96 | IC subestimado en |
|---|---|---|---|
| 10 | 2.262 | 1.96 | 13 % |
| 12 | 2.201 | 1.96 | 11 % |
| 20 | 2.093 | 1.96 | 6 % |
| 30 | 2.045 | 1.96 | 4 % |

Con las n ≥ 20 réplicas que recomiendo para el artículo, subestimas el intervalo un 6 %. No es dramático, pero es el tipo de detalle que un revisor con formación estadística marca, y cuesta cinco líneas arreglarlo.

## D12 — [MEDIO] El CSV del lote no registra la parametrización completa

La cabecera del CSV guarda `eps_XC`, `K_HH`, `dmin_HH`, `muH`, semilla base, red, T, pasos… pero **no** los seis ε principales (`EPS_NN`, `EPS_NB`, `EPS_BB`, `EPS_XN`, `EPS_XB`, `EPS_XX`, `EPS_CC`, `EPS_CN`, `EPS_CB`) ni los potenciales químicos `FORM_MU_*`.

Para datos que acompañan a un artículo, el archivo tiene que ser autosuficiente: alguien debe poder reconstruir la corrida solo con el CSV. Y dado que tras el reajuste global (D3) los ε van a cambiar, sin ese registro no podrás distinguir después qué CSV corresponde a qué parametrización.

## Lo que está bien en estos módulos

**`batch.js`** está bien construido:
- σ muestral con n−1 ✓
- Semillas espaciadas y reproducibles: `semilla_i = base + i·1 000 003` ✓
- `setRandomSeed(null)` al terminar, para no dejar el estado global determinista ✓
- Ejecución en trozos de 4 000 pasos con `await` para no congelar la UI ✓
- El esquema de temperatura de `batchTempAtStep()` replica exactamente el de `loop()` ✓
- Registra semilla base en el CSV, así que un revisor puede reproducir el lote ✓

**`import.js`**, salvo D9:
- Conversión de unidades correcta en XV.
- POSCAR: maneja coordenadas directas y cartesianas, factor de escala aplicado a la red antes de convertir ✓. *(Salvedad menor: VASP interpreta un factor de escala negativo como el volumen de la celda; `parseFloat(raw[1])||1` lo trataría como factor. Caso raro, pero un `if (scale < 0)` no sobra.)*
- Detección de formato por heurística razonable, con parsers separados para XYZ, POSCAR, XV, LAMMPS data y LAMMPS dump.

**`export.js`** cubre PNG, CSV, LAMMPS data, POSCAR, XV, sesión JSON y grabación de vídeo. Es una superficie de exportación más completa de lo que suele traer el software que acompaña a un artículo, y juega a tu favor tanto en SoftwareX como en CPC.

## Tabla de defectos actualizada

| # | Defecto | Severidad | Módulo |
|---|---------|-----------|--------|
| **D9** | Importador `.XV` lee el índice de especie como Z | **Crítico** | `import.js` |
| **D1** | `μ_B = μ_N` por defecto | **Crítico** | `core.js` |
| **D2** | Generadores de poro en espacio de índices | **Alto** | `core.js` |
| **D3** | Dos valores incompatibles de ε_BN | **Alto** | parametrización |
| **D8** | Justificación de ε_XC incorrecta | **Alto** | `core.js` |
| **D10** | Histograma del lote hereda D4/D5 | **Alto** | `batch.js` |
| **D4** | Clasificador no invariante bajo PBC | Medio | `core.js` |
| **D5** | Clasificador mezcla sistemas de unidades | Medio | `core.js` |
| **D6** | Estequiometría no conservada en `opc=3,4` | Medio | `core.js` |
| **D11** | IC95 con aproximación normal | Medio | `batch.js` |
| **D12** | CSV del lote sin parametrización completa | Medio | `batch.js` |
| **D7** | `calcDeltaE_global` con pares vecinos | Bajo (latente) | `core.js` |

## Orden de trabajo recomendado

El orden importa, porque hay dependencias entre correcciones:

1. **D9** primero — sin él no puedes ni validar contra tus propios cálculos SIESTA. Una línea.
2. **D3** — reajuste global de ε. Todo lo demás depende de la parametrización final.
3. **D8** — ε_XC con el valor SIESTA, ya sobre la escala consistente de D3.
4. **D1** — potenciales químicos físicos.
5. **D2** — generadores en espacio real.
6. **D4/D5** — clasificador. *Obligatorio antes de lanzar los lotes de producción.*
7. **D6, D11, D12, D7** — pulido.
8. Recién entonces: lotes de producción para las figuras, y registro DNDA de la versión que citará el artículo.
