# Cambios

## v15.0.1 — 2026-09-28

Correcciones encontradas al preparar la documentación del registro de software
(manual técnico y manual de usuario). No cambian el modelo físico, los
parámetros por defecto ni la dinámica del Monte Carlo.

### Salidas y visualización

* **Informe PNG — tabla de enlaces.** `countBonds()` devuelve cada enlace una
  sola vez, pero la tabla del informe completo seguía dividiendo por 2 las
  contribuciones N–B, N–N, B–B, X–X, C–C, C–N y C–B, de modo que su suma no
  coincidía con la energía total. Ahora cada contribución es n·ε (como en la
  captura técnica), X–X usa el ε efectivo del reservorio (0 con H₂) y se añade
  la fila X–C cuando hay carbono.
* **Informe PNG — pie de página.** Los datos del resultado (E_form, geometría,
  corrección H–H) se superponían con la referencia bibliográfica y la firma;
  ahora ocupan líneas separadas.
* **Informe PNG — valor final de las gráficas.** Los valores largos (p. ej.
  −106528 eV) se recortaban en el borde del panel; ahora se dibujan dentro.
* **Captura técnica.** Los paneles de la columna derecha se salían del lienzo e
  invadían el pie; el alto se calcula a partir de su contenido.
* **Visor 3D.** La cámara apuntaba al centro de la red en coordenadas de
  pantalla aunque la escena está centrada en el origen, por lo que la lámina
  aparecía desplazada y recortada; además «Top (planta)» mostraba la lámina de
  canto. Se corrigieron el centrado, el encuadre inicial y las vistas
  Top/Frente, y la barra de herramientas ya no se parte en varias filas.
* **Barrido de temperatura (INV).** La etiqueta del extremo derecho del eje x
  se recortaba.

### Interfaz

* El indicador de estado mostraba «Finalizado» durante la pausa; ahora muestra
  «Pausado».
* Modo lote: «N runs ensemble» pasa a «Réplicas del lote» (opciones «1 réplica»
  … «50 réplicas»), el resumen se titula «Lote n=…» y la nota usa
  ⟨E_form por H⟩; se retiró un contador que siempre mostraba 1.
* Paso 3: la etiqueta de T final aclara que en el modo ciclo es la T máxima.
* Los campos de texto de la pestaña INV tienen el mismo estilo que los
  numéricos.

## v15.0.0 — 2026-09-25

Base: v14.8.0-CLEAN (derivada de v14.7.1). La parametrización por defecto
sigue siendo la de la tesis Obando–Batista (FIMAT-UFOP, 2019).

### Errores corregidos que afectaban a resultados

* **ε_CH efectivo.** Al arrancar, la interfaz sobrescribía el ε_CH del núcleo
  (−70.41 eV) con los valores del HTML (−69.80 eV), que además se rotulaban
  como “valor DFT”. Ahora el valor provisional −70.41 eV se aplica de verdad y
  se rotula como provisional.
* **Potencial químico del H en el Monte Carlo.** Se sumaba +μH con pesos
  1 / 0.5 / 0.7 para N / B / C (signo invertido y pesos sin fundamento). Ahora
  cada H de pasivación aporta −Δμ_H.
* **Ventana química.** Los límites “rico en N” y “rico en B” estaban
  intercambiados y no se detectaba que, con las energías de la Tabla 5.1, la
  ventana está vacía para Δμ_H = 0. Se definen correctamente y se informa del
  Δμ_H a partir del cual se abre.
* **Energía de formación.** Se calculaba con la energía del Monte Carlo
  (término vacancia–vacancia, penalización H–H y desplazamiento de μ_H
  incluidos) y μ_BN = E(BN), de modo que la lámina perfecta tenía
  E_form ≠ 0. Ahora E_form = 0 para h-BN y grafeno perfectos; la penalización
  H–H se informa aparte y n_H es coherente con los enlaces contados.
* **Exportación CSV y de gráficas.** `exportCSV()` y `exportChartsPNG()`
  fallaban con ReferenceError (`bcPre`). La tabla del informe dividía por 2 las
  contribuciones X–N y X–B.
* **Generadores de poro.** Con tamaño 2, los triángulos salían fragmentados y
  con la terminación opuesta; con tamaño 1, los paralelogramos no quitaban
  átomos. Ahora cada poro se valida (un clúster, terminación pura) y los
  triángulos tienen n² vacancias en todos los tamaños y orientaciones.
* **Paso MC del CSV.** Se aproximaba a partir del índice del punto; ahora se
  registra el paso exacto.
* **Temperatura máxima.** 5500 K impedía reproducir los protocolos de la
  tesis y del artículo (9800 K, ciclo hasta 20 000 K); ahora 20 000 K.

### Nuevo

* Pestaña **INV** (`src/research/research.js`): parámetros con procedencia y
  edición; reajuste por mínimos cuadrados con errores estándar, correlación y
  validación cruzada LOO (reproduce la Tabla 5.8); energética de poros por
  forma y tamaño frente a μ_N; barrido de temperatura con intercambio de
  réplicas (parallel tempering) y C_v; calibración de ε_CH con nanocintas
  SIESTA; diagnóstico de la escala energética; orden de corto alcance.
* **Reservorio de H** seleccionable: modelo de la tesis o gran canónico
  respecto de H₂.
* **Modo térmico “ciclo”** y gráfica E(T) con ramas de calentamiento y
  enfriamiento.
* Diagnóstico automático de la **energía de borde por H** y advertencias de
  coherencia (ventana química, escala de ε_NB, fragmentación de poros).
* **Sesión con esquema versionado** (2): guarda todos los ε, el reservorio,
  las referencias de formación y la semilla; lee sesiones antiguas.
* CSV del lote y del barrido con la parametrización completa y la columna
  de cabecera en su lugar.
* Identidad de versión única (`HBN_VERSION` en `core.js`).
* `LICENSE`, `CITATION.cff`, `tools/generar_manifiesto.js` (SHA-256 e
  inventario de funciones).

### Retirado

* Control δ_borde (se leía pero no entraba en ninguna energía).
* “E_f normalizada por átomo de borde” heredada (μ = ε_NB/2 para B y N, sin
  sentido físico) y su acumulado de ensemble.
* Selector “N runs ensemble” renombrado a “Réplicas del lote”.
* Del paquete: zip RC1, manuales .docx de v14.7.1, manifiestos y salidas de
  pruebas de v14.8, archivos de estado de liberación. Las auditorías v14.7 se
  conservan en `docs/historico/`.

### Pruebas

* Nuevas suites `validacion_motor.js` (11 grupos) y
  `validacion_investigacion.js` (9 grupos); la prueba de integración ejecuta
  de verdad las exportaciones y comprueba ε_CH tras el arranque.
* Todas las suites devuelven código 1 ante un fallo (antes imprimían FAIL y
  terminaban con 0).
* El script narrativo T1–T21 de la auditoría v14.6 pasa a
  `tests/historico/`.
