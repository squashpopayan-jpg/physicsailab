# Manual de usuario — hBN-MC v15.0.1

## 1. Inicio

Abra `index.html` en un navegador moderno (o ejecute
`python tools/start_server.py` y visite `http://127.0.0.1:8000`). Al
arrancar se genera una red 16×16 y el registro (pestaña STAT) informa de la
versión, del conjunto de parámetros activo y de las advertencias de
coherencia del modelo.

La ventana tiene el lienzo 2D a la izquierda (rueda = zoom, Shift+arrastrar
= mover, clic = información del átomo) y cinco pestañas a la derecha:
**CTRL** (configuración y ejecución), **STAT** (energías, composición,
enlaces, registro), **GRAF** (series temporales y E(T)), **INV**
(investigación) e **INFO** (modelo y referencias).

## 2. Pestaña CTRL

**Paso 1 — Red.** Tamaño Nx × Ny, orientación (armchair/zigzag), subred
inicial y condiciones de borde. Con periodicidad, las dimensiones periódicas
se ajustan a número par para conservar la bipartición B/N.

**Paso 2 — Estructura.** Familias disponibles:
* 1–8: estructuras de la implementación Fortran (6 y 7 se conservan como
  referencia histórica; producen poros anisótropos).
* 10–14: poros geométricos en espacio real — triángulo de borde N o B (n²
  vacancias), paralelogramos A/B (bordes N y B) y hexágono NH = BH. El
  tamaño indica el orden del poro; todos se validan como un único clúster.
* 20: h-BN con carbono sustitucional; 30–49: fitas, heteroestructuras y
  nanocintas pasivadas; 99: geometría importada o del constructor.

**Paso 3 — Protocolo térmico.** Modos: recocido (Ti → Tf), isotérmico,
3 fases (Ti 30 % → rampa 40 % → Tf 30 %) y **ciclo** (Ti → Tf → Ti) para
estudiar histéresis. Temperatura hasta 20 000 K: es un parámetro de control
(los movimientos del modelo cuestan decenas de eV), no una temperatura
física. Intercambio global: fracción de intentos entre sitios lejanos (en
sistemas con carbono se fija en 30 %). Semilla: si se indica, la corrida es
reproducible bit a bit.

**Paso 4 — Modelo energético.**
* *Reservorio de H del MC:* “Tesis 2019” reproduce el Hamiltoniano de la
  tesis; “Gran canónico respecto de H₂” elimina el término vacancia–vacancia
  y resta μ_H = E(H₂)/2 + Δμ_H por cada H. La nota inferior muestra la energía
  de borde por H: si es negativa, el modelo favorece fragmentar los poros.
* *ε_CH:* valor provisional −70.41 eV (AC, ZZ y promedio).
* *Penalización H–H:* corrección estérica empírica (K, distancia mínima,
  modo).
* *Energía de formación:* ambiente (rico en N / rico en B / punto medio),
  Δμ_H de formación y referencia de μ_BN. La nota muestra la ventana de
  μ_N; si está vacía, indica desde qué Δμ_H se abre. “E_form(μ) CSV”
  exporta E_form frente a μ_N. “Verificar coherencia” lista las
  advertencias del modelo.
* *Lote:* número de réplicas, semilla base y ejecución (media ± σ, IC95 con
  t de Student, histograma de formas y CSV con la parametrización completa).
* *Protocolo de referencia:* red 24×24, 3 fases 5000 → 900 K, 400 000
  pasos, parámetros de la tesis.

**Paso 5 — Visualización y edición.** Contorno de poros coloreado por forma
(triángulo naranja, paralelogramo cian, hexágono violeta, irregular rojo),
edición manual de átomos y eliminación aleatoria.

Botones: INICIAR, PAUSAR, RESET; guardar/cargar sesión (JSON con todos los
parámetros); importar geometría; constructor hBN/C; exportar LAMMPS; grabar
vídeo. Al terminar una corrida se ofrece exportar informe PNG, imágenes,
gráficas, CSV, POSCAR, XV, LAMMPS o todo en ZIP.

## 3. Pestaña STAT

Energía, temperatura, aceptación, composición, energía de formación (total y
por H de borde, con la penalización H–H indicada aparte), control H–H, tabla
de enlaces con los ε efectivos del Monte Carlo y registro de eventos.

## 4. Pestaña GRAF

E, T, aceptación y enlaces N–B frente a los pasos, y **E frente a T**; en
modo ciclo, la rama de calentamiento es roja y la de enfriamiento azul.

## 5. Pestaña INV — investigación

1. **Parámetros del modelo.** Tabla de los diez ε con el valor de la tesis,
   su estado (DFT, convención, provisional) y la fuente. “Aplicar” activa los
   valores editados (el conjunto pasa a “personalizado” y así se registra en
   CSV y sesiones); “Restaurar tesis 2019” vuelve a los valores de referencia.
2. **Reajuste por mínimos cuadrados.** Reproduce la Tabla 5.8 con errores
   estándar, correlación y validación cruzada. Se pueden añadir estructuras en
   CSV (columnas NN, NB, BB, CC, CN, CB, XN, XB, XC, E y opcionalmente id y
   nAtoms; se aceptan alias como nNB, BN, NH, BH, E_eV) y elegir qué
   parámetros son libres; los demás quedan fijos en su valor activo. El
   resultado puede aplicarse al modelo o exportarse.
3. **Escala energética.** ΔE de todos los intercambios locales posibles en
   la configuración actual, aceptación esperada a varias temperaturas y
   energía de borde por H.
4. **Energética de poros.** E_form de los poros 10–14 por tamaño en una red
   aislada, en los límites rico en N, rico en B y punto medio; gráfica frente
   al número de vacancias y CSV. No modifica la estructura del usuario.
5. **Barrido de temperatura / intercambio de réplicas.** Una réplica por
   temperatura desde la estructura actual; en modo intercambio de réplicas
   las configuraciones se intercambian entre temperaturas vecinas. Resultados:
   ⟨E⟩, σ_E, C_v/k_B, aceptación, poros, forma mayoritaria, fracción de borde
   N, α_C, aceptación de intercambios, gráficas y CSV; “ver” carga la
   configuración final de una réplica en el lienzo.
6. **Calibración de ε_CH.** Energías SIESTA de nanocintas AC-H y ZZ-H (y
   opcionalmente desnudas): ε_CH por la ruta directa (con dos convenciones de
   ε_CC) y la indirecta, con controles de sanidad; aplica el promedio AC/ZZ.
7. **Análisis de la estructura.** Tabla de poros (tamaño, forma, terminación,
   bordes N/B, compacidad, aspecto) y parámetros de orden α_C y f_BN.

## 6. Reproducibilidad

* Use semilla en cada corrida que vaya a publicarse.
* Los CSV incluyen versión, parámetros ε, reservorio de H, potenciales
  químicos, protocolo térmico, red y semilla.
* La sesión (JSON, esquema 2) guarda red, parámetros e historial; las
  sesiones de v14 se cargan fijando Δμ_H = 0 (su convención de μH era
  distinta).

## 7. Validación del software

`npm test` (Node.js ≥ 18) ejecuta las suites descritas en
`docs/VALIDACION.md`.
