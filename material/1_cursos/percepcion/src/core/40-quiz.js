/* ===================================================================
   40-quiz.js — Banco Oficial de 40 Preguntas de Examen de Percepción Computacional
   Autoría: Ing. Luis Fernando Barajas Ardila — Especialización en Inteligencia Artificial
   =================================================================== */
(function () {
  "use strict";
  window.PERCEPCION = window.PERCEPCION || {};
  window.PERCEPCION.QUESTIONS = [
  {
    "id": 1,
    "question": "En el sistema visual humano, ¿qué mecanismo neurofisiológico permite realzar los bordes y contrastes espaciales actuando de forma análoga a un filtro paso alto?",
    "options": [
      "La inhibición lateral entre neuronas adyacentes.",
      "La adaptación escotópica exclusiva de los conos en la fóvea.",
      "La acomodación cristalina mediante conversión analógico-digital.",
      "La integración temporal prolongada en el nervio óptico."
    ],
    "correct": 0,
    "explanation": "La inhibición lateral hace que una neurona excitada reduzca la actividad de sus vecinas, resaltando las zonas de transición de intensidad (bordes), igual que un filtro paso alto.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 2,
    "question": "¿En qué caso se puede considerar un sistema de percepción computacional sin módulo de toma de decisión?",
    "options": [
      "En aquellos casos donde una extracción de características pueda ayudar a otro sistema a aprender o dar soporte en la toma de decisión.",
      "En ninguno, siempre es estrictamente obligatorio un módulo de toma de decisión autónomo.",
      "Solo donde no se realiza ningún tipo de filtrado ni preprocesamiento previo.",
      "Únicamente cuando los sensores capturan señales analógicas sin ruido."
    ],
    "correct": 0,
    "explanation": "Un sistema de percepción puede finalizar en la etapa de extracción de características cuando estas sirven de soporte para otro sistema externo encargado de decidir.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 3,
    "question": "Si tuvieras que usar un algoritmo de compresión sin pérdidas sobre la señal digitalizada, ¿en qué momento del conversor A/D lo emplearías?",
    "options": [
      "Después de la codificación, ya que la información sale binaria de dicho módulo y es fácilmente comprimible.",
      "Después del muestreo, justo antes de la cuantificación, para ahorrar niveles de cuantificación.",
      "Antes del filtro antialiasing para reducir el ancho de banda continuo.",
      "Entre el muestreo y la retención para alterar la frecuencia de Nyquist."
    ],
    "correct": 0,
    "explanation": "Los algoritmos de compresión digital operan sobre secuencias binarias a la salida de la etapa de codificación del conversor A/D.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 4,
    "question": "Al analizar la degradación de una señal mediante herramientas de la teoría de la información y procesos estocásticos, ¿qué indica un incremento significativo en el valor de la entropía de Shannon de dicha señal?",
    "options": [
      "Un mayor grado de incertidumbre, irregularidad y presencia de ruido aleatorio.",
      "Una mayor pureza espectral al concentrarse toda la energía en una única frecuencia.",
      "Que la señal es completamente determinista y libre de interferencias.",
      "Una reducción del rango dinámico debida a una saturación constante."
    ],
    "correct": 0,
    "explanation": "La entropía de Shannon mide la incertidumbre o desorden medio de una fuente de información; el ruido aleatorio equipara las probabilidades de los estados e incrementa la entropía.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 5,
    "question": "Si se aplica un filtro de mediana de longitud 5 al valor 12 (octavo elemento) de la siguiente serie temporal: [2, 1, 3, 4, 5, 2, 3, 12, 1, 4, 5, 4, 5], ¿cuál será el valor de salida?",
    "options": [
      "3",
      "4",
      "12",
      "2"
    ],
    "correct": 0,
    "explanation": "La ventana de longitud 5 centrada en el 12 toma los elementos [2, 3, 12, 1, 4]. Al ordenarlos de menor a mayor obtenemos [1, 2, 3, 4, 12], cuyo valor central (mediana) es 3, eliminando el pico anómalo.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 6,
    "question": "¿Qué ventaja proporciona el operador de transformación de ley de potencia (corrección gamma) frente a la transformación logarítmica?",
    "options": [
      "Permite generar una amplia familia de transformaciones simplemente mediante la variación de un parámetro, obteniéndose también sus transformaciones inversas.",
      "Ninguna, el operador logarítmico siempre es preferible en cualquier dominio.",
      "Opera exclusivamente sobre el vecindario 3x3 sin modificar el contraste global.",
      "Elimina automáticamente el ruido sal y pimienta sin intervención del parámetro gamma."
    ],
    "correct": 0,
    "explanation": "La función $s = c \\cdot r^\\gamma$ permite generar toda una familia de curvas (tanto para expandir oscuros con $\\gamma < 1$ como claros con $\\gamma > 1$) variando un único parámetro.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 7,
    "question": "¿Cuál es la equivalencia matemática de los filtros espaciales paso bajo y paso alto al operar sobre una imagen?",
    "options": [
      "El filtrado paso bajo equivale a una operación de integración o promedio, mientras que el paso alto equivale a una derivada o diferencia.",
      "El filtrado paso bajo equivale a una derivada de segundo orden y el paso alto a una suma acumulada.",
      "Ambos equivalen a una multiplicación punto a punto por una constante negativa.",
      "El paso bajo calcula el gradiente direccional y el paso alto iguala el histograma."
    ],
    "correct": 0,
    "explanation": "Suavizar (paso bajo) equivale a integrar/promediar los niveles de intensidad locales, mientras que realzar bordes (paso alto) equivale a calcular derivadas o diferencias espaciales.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 8,
    "question": "Al visualizar el módulo de la Transformada de Fourier 2D de una imagen, a menudo solo apreciamos un punto brillante central correspondiente a la componente continua. ¿Qué operador punto a punto es el más adecuado para apreciar el resto de componentes frecuenciales?",
    "options": [
      "Transformación logarítmica.",
      "Operador resta de imágenes.",
      "Umbralización binaria estricta.",
      "Filtro de erosión binaria."
    ],
    "correct": 0,
    "explanation": "Dado que el espectro de Fourier tiene un rango dinámico enorme concentrado cerca del origen, aplicar $s = c \\log(1 + |F(u,v)|)$ comprime los valores altos y expande las componentes débiles haciéndolas visibles.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 9,
    "question": "Si tenemos una imagen completamente negra con un único píxel blanco en el centro y ejecutamos una operación de dilatación, ¿qué se puede afirmar al finalizar el proceso?",
    "options": [
      "Dependerá del elemento estructural el que haya más de un píxel en blanco.",
      "Siempre habrá exactamente 9 píxeles en blanco independientemente del elemento estructural.",
      "La imagen quedará completamente negra al tratarse de un punto aislado.",
      "El píxel blanco se desplazará a la esquina superior izquierda sin cambiar de tamaño."
    ],
    "correct": 0,
    "explanation": "La dilatación expande el píxel activo según la geometría del elemento estructurante empleado (si el elemento estructurante fuese de 1x1, seguiría habiendo un único píxel blanco).",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 10,
    "question": "¿Qué algoritmos de segmentación elegirías si necesitaras un proceso interactivo que incorpore inicializaciones o modificaciones por parte de un experto humano?",
    "options": [
      "Graph-cuts y el crecimiento de regiones basado en semillas.",
      "Ninguno, los algoritmos de segmentación nunca admiten inicialización humana.",
      "Únicamente la umbralización global automática de Otsu.",
      "El filtro paso bajo ideal en el dominio de la frecuencia."
    ],
    "correct": 0,
    "explanation": "Tanto el crecimiento de regiones (mediante la colocación manual de semillas) como Graph-cuts (marcando píxeles de objeto/fondo) permiten guiar e interactuar de forma experta con la segmentación.",
    "category": "Segmentación & Características (Temas 10-11)"
  },
  {
    "id": 11,
    "question": "¿Qué ventaja fundamental ofrece el código de cadenas (Chain Code) de Freeman normalizado mediante diferencias primeras (número de forma) para describir el contorno de un objeto?",
    "options": [
      "Permite obtener una descripción del contorno invariante a la rotación y al punto de inicio.",
      "Calcula directamente la transformada de Fourier del interior de la textura.",
      "Sustituye los niveles de gris de toda la imagen por su media aritmética.",
      "Elimina la necesidad de segmentar o binarizar previamente el objeto."
    ],
    "correct": 0,
    "explanation": "Al codificar los cambios relativos de dirección (diferencias primeras) y rotar circularmente la secuencia para obtener el entero mínimo (número de forma), el descriptor se vuelve invariante al punto de partida y a la rotación.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 12,
    "question": "En el descriptor de textura LBP (Local Binary Patterns), ¿cómo se consigue que el código binario resultante para un vecindario circular de P puntos sea invariante a la rotación de la imagen?",
    "options": [
      "Rotando circularmente el patrón de bits original hasta alcanzar el valor entero mínimo posible.",
      "Sumando todos los niveles de gris de la imagen y dividiendo por la varianza.",
      "Aplicando un filtro paso alto ideal antes de umbralizar el píxel central.",
      "Descartando todos los píxeles vecinos que tengan un valor mayor al central."
    ],
    "correct": 0,
    "explanation": "Para lograr invarianza a la rotación en LBP ($LBP^{ri}$), se realizan desplazamientos circulares (bit-shifts) sobre el código binario de P bits y se asigna el menor valor numérico obtenido.",
    "category": "Textura & Multiescala (Temas 12-13)"
  },
  {
    "id": 13,
    "question": "¿Cuál es la limitación principal de la Transformada de Fourier de Tiempo Corto (STFT) que motiva el uso de la Transformada Wavelet?",
    "options": [
      "El empleo de una ventana de tamaño fijo constante, que mantiene una resolución tiempo-frecuencia invariable en todo el espectro.",
      "Que solo puede aplicarse a señales binarias de una sola dimensión.",
      "Que no permite recuperar ninguna información sobre las frecuencias de la señal.",
      "Que su cálculo computacional es imposible en ordenadores digitales."
    ],
    "correct": 0,
    "explanation": "La STFT utiliza una ventana de longitud fija, lo que impide tener simultáneamente buena resolución temporal en altas frecuencias y buena resolución frecuencial en bajas frecuencias; las Wavelets resuelven esto escalando la ventana.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 14,
    "question": "De acuerdo con el marco estadístico para sistemas de decisión supervisados, ¿qué regla permite asignar una muestra x a una clase Ck minimizando la probabilidad total de error?",
    "options": [
      "La regla de decisión de Bayes, eligiendo la categoría que maximiza la probabilidad a posteriori $P(C_k | x)$.",
      "El teorema de Tales aplicado al espacio de características.",
      "La maximización de la función de error cuadrático sobre el conjunto de test.",
      "La elección aleatoria uniforme entre todas las categorías posibles."
    ],
    "correct": 0,
    "explanation": "La regla de decisión de Bayes minimiza el riesgo o probabilidad de error clasificando cada observación x en la clase cuya probabilidad a posteriori $P(C_k | x)$ sea máxima.",
    "category": "Segmentación & Características (Temas 10-11)"
  },
  {
    "id": 15,
    "question": "En el diseño de un sistema completo de percepción computacional (como la lectura biométrica de huellas dactilares o el análisis de imágenes médicas), ¿qué estrategia es clave si el clasificador no logra distinguir correctamente dos clases?",
    "options": [
      "Revisar y adecuar la etapa de extracción de características hacia descriptores donde las diferencias entre clases sean más discriminativas.",
      "Eliminar por completo la etapa de captura y preprocesamiento para ahorrar memoria.",
      "Reducir la frecuencia de muestreo por debajo del límite de Nyquist.",
      "Añadir ruido blanco gaussiano a los vectores de entrenamiento."
    ],
    "correct": 0,
    "explanation": "En los casos prácticos se enfatiza que el éxito del clasificador depende críticamente de que las características extraídas separen adecuadamente las clases en el espacio de representación.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 16,
    "question": "¿Cuál de los siguientes parámetros es esencial para definir una adecuada captura de información según el texto?",
    "options": [
      "Especificidad: Capacidad de un sistema para recoger fielmente los eventos sucedidos, como la temperatura en un sensor.",
      "Precio del sensor: Costo asociado al dispositivo utilizado para la captura de información.",
      "Usabilidad: Facilidad de uso del dispositivo de captura de información.",
      "Reparabilidad: Capacidad del dispositivo de ser reparado fácilmente."
    ],
    "correct": 0,
    "explanation": "La especificidad (junto con el rango dinámico, ancho de banda o relación señal-ruido) es un parámetro técnico esencial para caracterizar la fidelidad en la captura de información.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 17,
    "question": "Una foto tiene casi todos sus tonos en grises intermedios. Una persona prueba y ajusta curvas distintas según el rango de tonos. ¿Qué transformación está usando?",
    "options": [
      "Una definida a trozos, que aplica fórmulas distintas según el rango.",
      "Una logarítmica, que usa una sola fórmula para todos los tonos.",
      "Un negativo, que usa una sola fórmula para invertir todos los tonos.",
      "Un promedio, que usa los puntos vecinos para calcular cada tono."
    ],
    "correct": 0,
    "explanation": "Las transformaciones definidas a trozos permiten dividir el rango de niveles de entrada en varios tramos y aplicar una función específica a cada intervalo.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 18,
    "question": "En un laboratorio de control de calidad, se capturan dos imágenes consecutivas de una pieza metálica en movimiento. Para identificar defectos superficiales, el sistema resta la segunda imagen de la primera, resaltando únicamente los cambios ocurridos entre ambas tomas. ¿Qué tipo de operación aritmética se utilizó y qué objetivo cumple en este caso?",
    "options": [
      "Resta de imágenes, porque permite resaltar diferencias entre capturas consecutivas, evidenciando defectos o movimientos.",
      "Suma de imágenes, porque incrementa la intensidad de los píxeles en movimiento.",
      "Multiplicación de imágenes, porque atenúa el ruido amplificando solo las coincidencias.",
      "División de imágenes, porque normaliza la intensidad entre diferentes capturas de la misma escena."
    ],
    "correct": 0,
    "explanation": "La resta de imágenes anula el fondo o las partes constantes entre dos capturas y resalta las diferencias espaciales o temporales.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 19,
    "question": "La transformada de Fourier convierte una imagen del dominio espacial al dominio de la frecuencia, para poder analizar y manipular la imagen en términos de sus frecuencias espaciales, pudiendo así eliminar ruido de alta frecuencia o resaltar ciertas características. De acuerdo con el enunciado anterior, ¿cuál es la mejor aproximación que existe de esta transformada y que se encuentra implementada en la mayoría de lenguajes de programación?",
    "options": [
      "FFT.",
      "CART.",
      "JND.",
      "TOP HAT."
    ],
    "correct": 0,
    "explanation": "La FFT (Fast Fourier Transform) es el algoritmo eficiente estándar implementado en la práctica totalidad de librerías científicas para calcular la DFT.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 20,
    "question": "Se entiende una señal o imagen que solo puede alcanzar unos determinados valores, por lo que está discretizada:",
    "options": [
      "Digital.",
      "Analógica.",
      "Filtrada.",
      "Pre-procesada."
    ],
    "correct": 0,
    "explanation": "Una señal o imagen cuyos valores tanto en el dominio como en amplitud están discretizados y cuantificados en un conjunto finito de niveles es una señal digital.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 21,
    "question": "Se refiere al proceso de identificar y seleccionar características significativas o informativas de los datos de entrada, como imágenes, señales de audio, texto, etc. Estas características capturan aspectos importantes de los datos que son relevantes para una tarea específica, como la clasificación, la detección de objetos, el reconocimiento de patrones, entre otros:",
    "options": [
      "Extracción de características.",
      "Captura de la información.",
      "Detección de anomalías.",
      "Clasificación de características."
    ],
    "correct": 0,
    "explanation": "La extracción de características transforma los datos brutos preprocesados en descriptores compactos y relevantes para la tarea de decisión posterior.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 22,
    "question": "Una foto se ve apagada porque casi todos sus tonos son grises muy parecidos. ¿Qué hace la igualación del histograma con ella?",
    "options": [
      "Reparte mejor los tonos de gris y así la foto gana más contraste.",
      "La convierte en blanco y negro usando un solo valor de corte.",
      "Quita los puntos sueltos reemplazándolos por el valor de sus vecinos.",
      "Invierte los tonos para que lo claro se vea oscuro y viceversa."
    ],
    "correct": 0,
    "explanation": "La ecualización o igualación del histograma redistribuye los niveles de intensidad para abarcar todo el rango dinámico disponible, aumentando el contraste global.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 23,
    "question": "Una tienda toma dos fotos de la misma estantería, una en la mañana y otra en la tarde. ¿Cómo se ve qué producto cambió de lugar?",
    "options": [
      "Restando las fotos, porque lo que no cambió queda negro y lo que cambió se ve.",
      "Sumando las fotos, porque así se suman los cambios entre ambas.",
      "Promediando las fotos, porque así se mezclan los cambios entre ambas.",
      "Multiplicando las fotos, porque así se agrandan los objetos de ambas."
    ],
    "correct": 0,
    "explanation": "Al restar dos imágenes alineadas de la misma escena, los píxeles idénticos dan valor cercano a cero (negro) y destacan únicamente las regiones donde hubo cambios.",
    "category": "Segmentación & Características (Temas 10-11)"
  },
  {
    "id": 24,
    "question": "Técnica de Minería de datos y Machine Learning que tiene como objetivo la identificación de valores atípicos en la fuente de información:",
    "options": [
      "Detección de anomalías.",
      "Entropía.",
      "La transformada de Fourier.",
      "Probabilidad condicional."
    ],
    "correct": 0,
    "explanation": "La detección de anomalías (outliers) se encarga de identificar observaciones o patrones que se desvían significativamente del comportamiento normal esperado.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 25,
    "question": "Tipo de transformación que representa la imagen invertida respecto a la original:",
    "options": [
      "Negativo.",
      "Transformación logarítmica.",
      "Ley de potencia.",
      "Histograma."
    ],
    "correct": 0,
    "explanation": "El negativo digital invierte los niveles de gris ($s = L - 1 - r$), haciendo que las zonas claras pasen a ser oscuras y viceversa.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 26,
    "question": "Un algoritmo de segmentación basado en umbrales se aplica a una radiografía digital. Sin embargo, la presencia de puntos blancos y negros dispersos provoca que la segmentación genere múltiples regiones falsas alrededor del borde de los huesos. ¿Qué tipo de ruido está afectando principalmente la segmentación y cuál seria una técnica apropiada para mitigarlo?",
    "options": [
      "Ruido de Sal y Pimienta; filtrado con mediana.",
      "Ruido Gaussiano; filtrado con Laplaciano.",
      "Ruido Poisson; transformada de Fourier.",
      "Ruido Speckle; histograma de frecuencias."
    ],
    "correct": 0,
    "explanation": "Los puntos blancos y negros extremos dispersos corresponden a ruido impulsivo (sal y pimienta), y el filtro no lineal de mediana los elimina eficazmente sin difuminar los bordes.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 27,
    "question": "Un equipo de científicos está analizando el espectro de una imagen en el dominio de la frecuencia. La mayor parte de la energía se encuentra en las frecuencias más bajas, lo que provoca que el espectro tenga muchos valores de intensidad elevados, dificultando la observación de las variaciones en las frecuencias más altas. El objetivo es realzar las componentes de alta frecuencia sin perder la capacidad de observar las componentes de baja frecuencia. ¿Qué método de ajuste de intensidad sería el más adecuado para este caso?",
    "options": [
      "Transformación Logarítmica",
      "Negativo de la Imagen",
      "Transformación según la Ley de Potencia con $\\gamma > 1$",
      "Transformación Lineal"
    ],
    "correct": 0,
    "explanation": "La transformación logarítmica comprime el amplio rango dinámico de los valores altos (bajas frecuencias) y expande los valores pequeños, permitiendo visualizar todo el espectro.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 28,
    "question": "Un equipo de investigación en arqueología digital está analizando fotografías de inscripciones antiguas en piedra. Muchas de estas imágenes tienen un bajo contraste debido a la erosión y las condiciones de iluminación al momento de la captura. El equipo necesita mejorar la visibilidad de las inscripciones sin modificar artificialmente los patrones originales. ¿Cuál de las siguientes técnicas sería la más adecuada para realzar las inscripciones en las imágenes sin intervención manual constante?",
    "options": [
      "Utilizar la igualación del histograma para distribuir mejor los valores de intensidad y mejorar el contraste automáticamente.",
      "Aplicar una función de transformación definida a trozos basada en inspección visual.",
      "Incrementar la intensidad de todos los píxeles de la imagen de manera uniforme.",
      "Reducir la profundidad de bits de la imagen para limitar la cantidad de niveles de intensidad."
    ],
    "correct": 0,
    "explanation": "La igualación (ecualización) del histograma es una técnica automática que maximiza el contraste global redistribuyendo las intensidades sin necesidad de ajustar tramos manualmente en cada foto.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 29,
    "question": "Un ingeniero de imagen está trabajando en el procesamiento de una fotografía que tiene un alto nivel de ruido aleatorio, lo que genera una apariencia granulada. El objetivo es suavizar la imagen para reducir el ruido sin eliminar completamente los detalles importantes. Basado en las definiciones de filtros espaciales, ¿qué tipo de filtro debería usar?",
    "options": [
      "Filtro espacial paso bajo, que es adecuado para suavizar la imagen y reducir el ruido.",
      "Filtro espacial paso alto, que es ideal para resaltar bordes y detalles finos.",
      "Filtro espacial paso medio, que es útil para eliminar ruido pero puede alterar la ubicación de algunos píxeles.",
      "Filtro espacial paso alto, que es excelente para suavizar la imagen al mantener los detalles finos."
    ],
    "correct": 0,
    "explanation": "Los filtros espaciales paso bajo atenúan las variaciones rápidas de intensidad (altas frecuencias espaciales), suavizando la apariencia granulada del ruido.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 30,
    "question": "Un sistema de compresión de imágenes médicas divide una radiografía en diferentes niveles de detalle para conservar la información esencial mientras reduce el tamaño del archivo. El análisis permite separar la información global de bajo nivel de los detalles finos de bordes y texturas. ¿Qué ventaja ofrece el uso de la transformada wavelet en este proceso?",
    "options": [
      "Permite un análisis multiresolución, separando información global y detalles locales en distintos niveles de descomposición.",
      "Solo mejora la nitidez de los bordes sin reducir la redundancia.",
      "Garantiza la reconstrucción exacta únicamente en imágenes binarias.",
      "Sustituye por completo a la transformada de Fourier al eliminar la información en frecuencia."
    ],
    "correct": 0,
    "explanation": "La transformada Wavelet descompone la imagen en múltiples escalas o resoluciones (aproximación global y detalles horizontales, verticales y diagonales).",
    "category": "Textura & Multiescala (Temas 12-13)"
  },
  {
    "id": 31,
    "question": "Un ingeniero desarrolla un sistema de visión para un robot agrícola que debe cosechar tomates maduros. Al usar el espacio de color RGB, el sistema confunde los tomates con el reflejo del sol en las hojas mojadas. ¿Qué transformación de espacio de color permitiría aislar el componente cromático (color) de la intensidad lumínica para mejorar la robustez?",
    "options": [
      "Transformar a HSV o CIELAB, utilizando los canales Hue (Matiz) o a/b para la segmentación.",
      "Convertir a CMYK para analizar la sustracción de pigmentos.",
      "Aplicar una ecualización de histograma independiente en cada canal R, G y B.",
      "Convertir la imagen a niveles de gris mediante un promedio ponderado."
    ],
    "correct": 0,
    "explanation": "Los espacios HSV (canal H) y CIELAB (canales cromáticos a y b) desacoplan la información de color de la iluminación o brillo (V o L), logrando mayor robustez ante reflejos.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 32,
    "question": "En un sistema de videovigilancia exterior para detectar intrusos, la escena tiene árboles cuyas hojas se mueven con el viento y una fuente de agua. ¿Qué técnica es la más adecuada para modelar este fondo dinámico?",
    "options": [
      "Modelado de Mezcla de Gaussianas (GMM), asignando múltiples distribuciones de probabilidad a cada píxel.",
      "Sustracción de fondo simple usando el primer frame como referencia estática.",
      "Aplicación de un filtro paso bajo temporal sobre todos los frames del video.",
      "Uso del operador morfológico de apertura en cada fotograma."
    ],
    "correct": 0,
    "explanation": "El modelo de Mezcla de Gaussianas (GMM) permite que cada píxel del fondo tenga varios estados multimodales (por ejemplo, hoja/cielo o agua en movimiento) sin disparar falsas alarmas.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 33,
    "question": "Un hospital requiere almacenar millones de imágenes de rayos X. El departamento de TI sugiere usar compresión JPEG con un factor de calidad del 50% para ahorrar espacio. El jefe de radiología se opone. Desde la percepción computacional, ¿cuál es el argumento técnico más sólido para la oposición?",
    "options": [
      "Los artefactos de bloque generados por la cuantización de la DCT pueden ser interpretados erróneamente como patologías o enmascarar microcalcificaciones.",
      "La compresión JPEG aumenta el ruido térmico de la imagen original.",
      "El formato JPEG no permite imágenes en escala de grises.",
      "Las imágenes comprimidas no pueden ser procesadas por algoritmos de realce de contraste."
    ],
    "correct": 0,
    "explanation": "JPEG es un formato con pérdida basado en bloques 8x8 de la DCT; a factores de compresión altos introduce artefactos de bloque y elimina altas frecuencias críticas para el diagnóstico médico.",
    "category": "Fundamentos & Sensores (Temas 1-2)"
  },
  {
    "id": 34,
    "question": "Se entrena un modelo para detectar una enfermedad rara en imágenes de retina. El modelo tiene una Exactitud (Accuracy) del 99%, pero al revisarlo, se descubre que nunca detecta a los pacientes enfermos (falsos negativos). ¿Qué métrica debió priorizar el ingeniero para evaluar este sistema?",
    "options": [
      "La Sensibilidad (Recall) y la puntuación F1.",
      "La resolución de la imagen de entrada.",
      "El tiempo de ejecución por imagen.",
      "La desviación estándar de los niveles de gris."
    ],
    "correct": 0,
    "explanation": "En conjuntos de datos muy desbalanceados (enfermedades raras), el Accuracy es engañoso; se debe priorizar la Sensibilidad (Recall) para minimizar los falsos negativos y el F1-score.",
    "category": "Decisión, Métricas & Aplicaciones (Temas 14-15)"
  },
  {
    "id": 35,
    "question": "En una imagen digitalizada de un periódico antiguo, aparece un patrón de líneas diagonales repetitivas (efecto moiré) que cubre toda la foto debido al escaneado de los puntos de impresión. ¿Cómo debería eliminarse este artefacto sin perder la nitidez de la imagen?",
    "options": [
      "Usando un Filtro de Rechazo de Banda (Notch Filter) en el dominio de la frecuencia para eliminar los picos específicos del patrón.",
      "Aplicando un filtro de promedio (blur) a toda la imagen.",
      "Aplicando una dilatación morfológica.",
      "Aumentando el contraste mediante un estiramiento lineal."
    ],
    "correct": 0,
    "explanation": "El ruido periódico como el patrón moiré se manifiesta como picos concentrados bien localizados en el espectro de Fourier, que pueden suprimirse selectivamente con un filtro Notch sin emborronar el resto de la imagen.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 36,
    "question": "En una foto digital en escala de grises se usan más bits para guardar los tonos. ¿Qué pasa con la imagen?",
    "options": [
      "Se ve más parecida a la real porque hay más tonos de gris.",
      "Se vuelve más borrosa porque quedan menos tonos de gris disponibles.",
      "Se vuelve más pequeña porque ocupa menos espacio en la memoria.",
      "Se llena de ruido porque cada tono se mezcla con todos los demás."
    ],
    "correct": 0,
    "explanation": "Aumentar el número de bits de cuantificación incrementa el número de niveles de intensidad ($2^b$), reduciendo el error de cuantificación y logrando transiciones tonales más fieles.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 37,
    "question": "¿Por qué los programas usan la FFT en lugar de calcular la transformada de Fourier de forma directa?",
    "options": [
      "Porque calcula lo mismo con muchas menos operaciones y más rápido.",
      "Porque permite ver la transformada con un aparato en la vida real.",
      "Porque elimina el ruido de la señal antes de hacer cualquier cálculo.",
      "Porque funciona solo con señales continuas que no se han medido."
    ],
    "correct": 0,
    "explanation": "La FFT reduce la complejidad computacional de $O(N^2)$ a $O(N \\log_2 N)$, obteniendo exactamente el mismo resultado matemático con un coste muchísimo menor.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 38,
    "question": "Se aplica un filtro de promedio con una ventana muy grande sobre una fotografía con ruido. ¿Qué resultado se espera?",
    "options": [
      "Menos ruido, pero con los bordes más borrosos que antes.",
      "Más ruido, pero con los bordes más marcados que antes.",
      "El mismo resultado, porque el tamaño de la ventana no influye.",
      "Más nitidez, porque se usan más vecinos para marcar los detalles."
    ],
    "correct": 0,
    "explanation": "Cuanto mayor es la máscara de promediado espacial, mayor es la atenuación del ruido aleatorio, pero también se produce un mayor desenfoque (blurring) de los bordes.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  },
  {
    "id": 39,
    "question": "La foto de un documento salió borrosa por una mala captura y se quiere afilarla para leer mejor. ¿Qué filtro debe usarse?",
    "options": [
      "El paso alto, porque realza los cambios de tono y los detalles finos.",
      "El de promedio, porque suaviza los cambios de tono de la foto.",
      "El de mediana, porque quita los puntos sueltos blancos y negros.",
      "El negativo, porque invierte los tonos claros y oscuros de la foto."
    ],
    "correct": 0,
    "explanation": "Los filtros paso alto (basados en derivadas o Laplaciano) realzan las transiciones rápidas de intensidad como los trazos de las letras y contornos.",
    "category": "Procesamiento Espacial & Frecuencial (Temas 6-9)"
  },
  {
    "id": 40,
    "question": "El algoritmo de Canny suaviza la imagen antes de buscar los bordes. ¿Para qué lo hace?",
    "options": [
      "Para reducir el ruido y evitar que se marquen bordes que no existen.",
      "Para agrandar los objetos y que sus bordes ocupen más espacio.",
      "Para invertir los tonos y que los bordes salgan en color claro.",
      "Para repartir los tonos de gris y que el contraste sea igual en todo."
    ],
    "correct": 0,
    "explanation": "La primera etapa del detector de Canny consiste en aplicar un filtro Gaussiano para atenuar el ruido de alta frecuencia y evitar falsos positivos al calcular los gradientes.",
    "category": "Muestreo, Ruido & Anomalías (Temas 3-5)"
  }
];
})();
