# hBN-MC v14.7 — Cambios respecto de v14.6

Versión resultante de la auditoría independiente. **12 defectos corregidos**, todos
verificados numéricamente. El motor Monte Carlo de v14.6 ya era correcto y no se
tocó su física: los cambios están en la parametrización, la construcción del
estado inicial, el post-proceso y la importación de datos DFT.

## Cambios críticos

### D9 · `import.js` — el importador de SIESTA `.XV` reasignaba todos los elementos
El formato escribe `is iza x y z vx vy vz`, donde `is` es el índice de especie y
`iza` el número atómico. v14.6 leía Z de la columna 0. Con el mapa
`{1:'H',5:'B',6:'C',7:'N'}` y especies indexadas 1,2,3 el resultado era siempre:
especie 1 → H, especies 2 y 3 → C. **Cualquier estructura h-BN importada desde
SIESTA llegaba al simulador como una mezcla de hidrógeno y carbono**, y el motor
energético calculaba con total confianza la energía de una estructura inexistente.

Verificado sobre una celda B–N–C–B: v14.6 devolvía `H, C, C, H`; v14.7 devuelve
`B, N, C, B`, con d(B–N) = 1.4198 Å y parámetro de red 2.4996 Å (h-BN: 2.50 Å).
Se añadió un aviso automático si aparece un Z fuera de {1, 5, 6, 7}.

### D1 · `core.js` — potenciales químicos físicos
v14.6 usaba μ_B = μ_N = 1.5·ε_BN. Ese reparto satisface μ_B+μ_N = μ_BN, pero es el
punto medio arbitrario, y para poros **no estequiométricos** (los triangulares en
h-BN son mono-sublattice) E_form queda dominada por la diferencia de energía
atómica total N vs B (~59 eV/átomo). Medido sobre dos poros idénticos de 19
vacancias, uno con borde N y otro con borde B:

| escenario | ΔE_f (borde N − borde B) |
|---|---|
| μ_B = μ_N (v14.6) | **−1005 eV** ← artefacto |
| rico en N | −106 eV |
| rico en B | −119 eV |

v14.7 usa por defecto el límite **rico en N** (μ_N = −283.277, μ_B = −103.443,
μ_H = E(H₂)/2 = −15.031) y añade un selector de ambiente químico en la interfaz
que respeta siempre μ_B + μ_N = μ_BN. Nuevo botón **E_form(μ) CSV**, que exporta
el barrido de la energía de formación sobre todo el rango accesible de μ_N
(1.34 eV de ancho) — la figura estándar para defectos en la literatura.

### D2 · `core.js` — poros construidos en espacio real
v14.6 dibujaba las formas en espacio de **índices**, que es anisótropo por √3
(Δj=1 → 2.16 Å en x; Δi=1 → 1.247 Å en y) y donde la contigüidad no implica
vecindad física (los vecinos están en Δi = ±1, ±3). El "triángulo" `opc=10` salía
de 12.96 × 3.74 Å y fragmentado en 3 clusters; **ninguno** de los cinco
generadores geométricos producía un poro conexo.

v14.7 selecciona los sitios por su posición real dentro del polígono. Además, la
terminación de subred **no** se fuerza purificando el borde (eso deforma la
figura: el triángulo pasaba de compacidad 0.6046 a 0.77 y crecía de 91 a 106
vacancias). Se aprovecha que la red es bipartita: la terminación queda fijada por
la **subred del centro** y la **orientación** respecto de las direcciones zigzag.

| generador | nvac | clusters | compacidad | ideal | bordes |
|---|---|---|---|---|---|
| 10 · Triángulo borde-N | 64 | **1** | **0.6046** | 0.6046 | N=24 B=0 |
| 11 · Triángulo borde-B | 64 | **1** | **0.6046** | 0.6046 | N=0 B=24 |
| 12 · Paralelogramo A | 24 | **1** | 0.7805 | 0.7854 | N=9 B=9 |
| 13 · Paralelogramo B | 24 | **1** | 0.7805 | 0.7854 | N=9 B=9 |
| 14 · Hexágono | 35 | **1** | 0.9102 | 0.9069 | N=7 B=10 |

El triángulo sale con la compacidad analítica **exacta**.

Los generadores `opc = 6` y `7` se conservan como referencia histórica de la
implementación Fortran de la tesis, con una advertencia en el código: **no usarlos
para figuras de morfología**.

Cambio de etiquetas: `opc 12/13` pasan de "Paralelogramo borde N/B" a
"**orientación A/B**". En h-BN un paralelogramo tiene los dos tipos de borde
zigzag por construcción (dos lados N y dos lados B), igual que en los HRTEM de
Pham *et al.* 2016, así que "terminación N" y "terminación B" no eran opciones
físicamente distinguibles. `opc 14` pasa a "Hexágono (NH = BH)", consistente con
la Tabla 5.5 de la tesis.

### D8 · `core.js` — ε_XC recalibrado a −70.41 eV
El comentario de v14.6 justificaba ε_XC = −69.80 diciendo que "queda entre B–H
(50.31) y N–H (109.80) por electronegatividad". Ese argumento usa la escala
equivocada: la magnitud bruta de ε_XY está dominada por la energía atómica total
a_Y = ε_YY/2, no por la fuerza del enlace. Al descontarla con la identidad
ε_XY = ΔE_hidrog + E(H) + a_Y:

| especie | ΔE_hidrog con v14.6 | con v14.7 |
|---|---|---|
| B (χ 2.04) | −1.324 eV | −1.324 eV |
| C (χ 2.55) | **−1.109 eV** ← fuera del intervalo | **−1.719 eV** ← interpolado |
| N (χ 3.04) | −2.123 eV | −2.123 eV |

Es decir, v14.6 **rompía** la monotonía con la electronegatividad en lugar de
cumplirla. El valor −70.41 ± 0.40 eV procede de la descomposición aditiva
ε_XC = a_C + a_H. **Es provisional**: sustituir por el valor SIESTA de nanocintas
AC-H / ZZ-H usando `epsFromHydrogenationEnergy()` o `epsXCFromRibbon()`.

## Cambios medios

- **D4/D5 · clasificador de poros reescrito.** Las posiciones se despliegan por
  imagen mínima antes del casco convexo (en v14.6 el mismo poro daba
  `parallelogram` en el centro y `hexagon` en la esquina periódica). La razón de
  aspecto se mide ahora por momentos de inercia en espacio real —invariante bajo
  rotación— en lugar de `spanI/spanJ` en espacio de índices. La clasificación usa
  proximidad a la compacidad analítica del polígono regular (triángulo 0.6046 ·
  rombo 0.7854 · hexágono 0.9069) en lugar de umbrales que mezclaban dos sistemas
  de unidades. Verificado: dispersión de compacidad entre cuatro posiciones de la
  celda = 6.7 × 10⁻¹⁶.
- **D10 · el histograma del modo LOTE hereda automáticamente la corrección**, al
  reescribirse `classifyPoreCluster` en lugar de añadir una función paralela.
- **D6 · estequiometría exacta** en `opc = 3` y `4` (se sortean sitios con
  Fisher-Yates, no tipos). Máximo |N−B| sobre 40 semillas: **0** (v14.6: 28 y 38).
- **D11 · IC95 con t de Student** en `batch.js`. Con n = 12 v14.6 subestimaba el
  intervalo un 11 %; con n = 20, un 6 %.
- **D12 · el CSV del lote es autosuficiente**: incluye los diez ε, los cuatro μ,
  el ambiente químico y la comprobación μ_B+μ_N = μ_BN.

## Cambios menores

- **D7 · `calcDeltaE_global`** delega en `calcDeltaE` cuando los dos sitios
  resultan ser vecinos. Era código muerto (`attemptSwapPair` ya lo desviaba) pero
  el error llegaba a 19 eV. Ahora: 1.1 × 10⁻¹¹ eV.
- **`checkParameterConsistency()`** nueva: detecta las trampas de escala D1, D3 y
  D8. Se ejecuta automáticamente al arrancar y desde el botón *Verificar
  coherencia*. Con los valores de v14.7 emite un único aviso, el de D3.

## Pendiente (no corregido: requiere decisión científica)

- **D3 · dos valores incompatibles de ε_BN.** El código usa −128.1626 (mínimos
  cuadrados) pero ε_XN y ε_XB se derivaron con E(BN)/3 = −128.9067. Desfase de
  0.744 eV por enlace B–N, que a 1000 K cambia el factor de Boltzmann en ~5000×
  para los movimientos de borde de poro. **La solución correcta es un único ajuste
  global** que incluya las 20 estructuras de Mazzoni, las moléculas simples, los
  poros triangulares y hexagonales y las nanocintas hidrogenadas, con matriz de
  covarianza → barras de error sobre cada ε. Ésa es la contribución metodológica
  más fuerte del artículo. Mientras tanto, el simulador avisa del desfase.
- **`delta` (δ_borde)** se sigue leyendo de la interfaz sin entrar en ninguna
  energía. Recomendación: retirar el control antes de publicar.

## Regresión

Todas las pruebas del motor de v14.6 siguen pasando sin cambios:
topología (0 fallos de 768 enlaces en AC y ZZ, tres modos de PBC), `calcFullE` vs
fuerza bruta (1.5 × 10⁻¹¹ eV), ΔE local (1.2 × 10⁻¹¹ eV), deriva sobre 20 000
pasos con pasivación H activa (7.3 × 10⁻¹² eV) y reproducibilidad bit a bit por
semilla.

---

# v14.7.1 — Overlay de poros y paridad AC/ZZ

## Sombreado de poros por unión de discos (sustituye al casco convexo)

**Problema.** El contorno del poro se dibujaba como el casco convexo de los átomos
de borde, usando coordenadas de **pantalla sin desplegar**. Cuando un poro cruza
la frontera periódica sus átomos de borde quedan a ambos lados de la celda, así
que el casco abarcaba la imagen entera y aparecían líneas discontinuas cruzando
todo el sistema. Medido sobre una celda de 800 px: un poro de 19 vacancias que
cruzaba el borde producía un casco de **741 px de ancho**. Con varios poros a la
vez el resultado era ilegible.

**Solución.** Se elimina el casco convexo. El poro se sombrea como la **unión de
discos** centrados en cada vacancia, con radio 0.60·d(enlace) para que los discos
vecinos se fusionen:

- nunca se conectan puntos lejanos, así que **desaparecen las líneas que cruzan**;
- un poro que cruza la frontera se ve **partido en los dos bordes** de la celda,
  que es la representación honesta bajo condiciones periódicas;
- el contorno sigue la **forma real** del poro y no su envolvente convexa, de modo
  que un poro cóncavo o ramificado se ve tal cual es.

El borde se obtiene con el truco de dos pasadas sobre un lienzo auxiliar: primero
se trazan todos los discos con línea gruesa del color de borde, después se
rellenan todos encima. Los trazos interiores quedan tapados por los rellenos
vecinos y sólo sobrevive el contorno exterior de la unión. La capa se compone al
final con alfa global, así que los solapamientos entre discos no oscurecen el
sombreado por muchos que se superpongan. El relleno se aclara hacia el blanco
para que el sombreado quede suave y el borde nítido.

Se mantiene el código de color por geometría (triángulo naranja · paralelogramo
cian · hexágono violeta · irregular rojo) y los anillos naranjas del modo *Bordes
resaltados*. Los clústeres de 1–2 vacancias se saltan la clasificación, que cuesta
un BFS de despliegue más un casco convexo en cada fotograma.

## Paridad AC / ZZ en los generadores geométricos

Al comprobar el overlay aparecieron dos defectos residuales en orientación ZZ:

**Centro de anillo mal calculado.** `poreCenterFor('ring')` usaba un desplazamiento
fijo de +D en x, válido sólo en AC. En ZZ, donde `atomPos` intercambia los ejes,
ese desplazamiento apuntaba a un sitio que no es centro de hexágono y los rombos
salían deformados. Ahora se usa la geometría del panal: el radio circunscrito de
un hexágono vale exactamente d(enlace), y desde un átomo p el centro del anillo
opuesto al enlace p→n está en **centro = p − d·versor(n − p)**, válido en
cualquier orientación.

**Regla de rotación equivocada.** La orientación ZZ es la red AC **transpuesta**
(x↔y), es decir una **reflexión** respecto de y = x, no una rotación. Una reflexión
invierte la quiralidad, así que el ángulo que en AC daba borde-N en ZZ daba
borde-B: `opc=10` producía un triángulo terminado en B y `opc=11` uno terminado en
N, justo al revés de sus etiquetas. Bajo θ → 90°−θ el conjunto de normales de un
polígono regular se conserva; para el rombo la base {θ, θ+60°} se transforma en
{30°−θ, 90°−θ}, de donde el ángulo equivalente es 30°−θ. Implementado en
`buildPoreRealSpace`.

Resultado tras las dos correcciones — **AC y ZZ dan ahora resultados idénticos**:

| generador | AC | ZZ | compacidad ideal |
|---|---|---|---|
| 10 · Triángulo borde-N | 64 vac · 1 cl · **0.6046** · N=24 B=0 | idéntico | 0.6046 |
| 11 · Triángulo borde-B | 64 vac · 1 cl · **0.6046** · N=0 B=24 | idéntico | 0.6046 |
| 12 · Paralelogramo A | 32 vac · 1 cl · 0.8031 · N=8 B=8 | idéntico | 0.7854 |
| 13 · Paralelogramo B | 32 vac · 1 cl · 0.8031 · N=8 B=8 | idéntico | 0.7854 |
| 14 · Hexágono NH=BH | 42 vac · 1 cl · **0.9069** · N=9 B=9 | idéntico | 0.9069 |

Triángulo y hexágono salen con la compacidad analítica **exacta**. Las rotaciones
del rombo se reajustaron a 0° y 60° tras corregir el centro de anillo.

Todas las pruebas de `validacion_parches_v14.7.js` siguen pasando.
