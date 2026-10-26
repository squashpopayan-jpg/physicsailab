/**
 * BANCO OFICIAL DE PREGUNTAS: LA GRAN TRIVIA DE FÍSICA
 * Plataforma Universitaria PhysicsAILab
 * 
 * Contenido: 605 preguntas únicas, no repetitivas y rigurosamente diversificadas.
 * Áreas cubiertas:
 *  - Física Fundamental y Metrología
 *  - Cinemática Clásica y Dinámica de Fuerzas
 *  - Trabajo, Energía y Leyes de Conservación
 *  - Rotación, Gravitación, Órbitas y Leyes de Kepler
 *  - Mecánica de Fluidos y Fenómenos de Transporte
 *  - Oscilaciones, Acústica y Ondas
 *  - Termodinámica y Mecánica Estadística
 *  - Electrostática, Circuitos y Electromagnetismo
 *  - Óptica Geométrica y Ondulatoria
 *  - Relatividad Especial y General
 *  - Física Cuántica y Estructura Atómica
 *  - Ciencia de Materiales, Física del Estado Sólido, Grafeno y Nitruro de Boro (hBN)
 *  - Física Nuclear y Partículas Elementales
 *  - Astrofísica, Cosmología y Experimentos Históricos Cruciales
 * 
 * Cada pregunta incluye: id, area, subtema, nivel, dificultad, pregunta, 4 opciones normalizadas, correcta y explicación pedagógica.
 */

window.TRIVIA_QUESTIONS = [
  {
    "id": 1,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad básica de longitud en el Sistema Internacional (SI)?",
    "opciones": [
      "A. El centímetro (cm)",
      "B. El kilómetro (km)",
      "C. El pie (ft)",
      "D. El metro (m)"
    ],
    "correcta": 3,
    "explicacion": "El metro es la unidad base de longitud en el SI, definido actualmente a partir de la velocidad de la luz en el vacío."
  },
  {
    "id": 2,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad básica de masa en el Sistema Internacional?",
    "opciones": [
      "A. La libra (lb)",
      "B. El slug",
      "C. El kilogramo (kg)",
      "D. El gramo (g)"
    ],
    "correcta": 2,
    "explicacion": "El kilogramo es la unidad base de masa, fijada hoy mediante la constante de Planck h."
  },
  {
    "id": 3,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad básica de tiempo en el Sistema Internacional?",
    "opciones": [
      "A. El milisegundo (ms)",
      "B. El segundo (s)",
      "C. El minuto (min)",
      "D. La hora (h)"
    ],
    "correcta": 1,
    "explicacion": "El segundo se define a partir de la frecuencia de transición hiperfina del átomo de cesio 133."
  },
  {
    "id": 4,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad de intensidad de corriente eléctrica en el SI?",
    "opciones": [
      "A. El amperio (A)",
      "B. El voltio (V)",
      "C. El coulomb (C)",
      "D. El ohmio (Ω)"
    ],
    "correcta": 0,
    "explicacion": "El amperio es la unidad fundamental de corriente eléctrica en el Sistema Internacional."
  },
  {
    "id": 5,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad de temperatura termodinámica en el SI?",
    "opciones": [
      "A. El grado Celsius (°C)",
      "B. El grado Fahrenheit (°F)",
      "C. El rankine (R)",
      "D. El kelvin (K)"
    ],
    "correcta": 3,
    "explicacion": "El kelvin es la unidad fundamental de temperatura absoluta en el SI."
  },
  {
    "id": 6,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad básica de cantidad de sustancia en el SI?",
    "opciones": [
      "A. La molécula-gramo",
      "B. El número de Avogadro",
      "C. El mol (mol)",
      "D. El gramo (g)"
    ],
    "correcta": 2,
    "explicacion": "El mol contiene exactamente 6.02214076 × 10^23 entidades elementales."
  },
  {
    "id": 7,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad básica de intensidad luminosa en el SI?",
    "opciones": [
      "A. El vatio óptico",
      "B. La candela (cd)",
      "C. El lumen (lm)",
      "D. El lux (lx)"
    ],
    "correcta": 1,
    "explicacion": "La candela es la unidad fundamental de intensidad luminosa en el SI."
  },
  {
    "id": 8,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad derivada de fuerza en el Sistema Internacional?",
    "opciones": [
      "A. El newton (N)",
      "B. El joule (J)",
      "C. El pascal (Pa)",
      "D. La dina"
    ],
    "correcta": 0,
    "explicacion": "Un newton equivale a 1 kg·m/s²."
  },
  {
    "id": 9,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos joules equivale un vatio-segundo (1 W·s)?",
    "opciones": [
      "A. 10 Joules",
      "B. 3600 Joules",
      "C. 0.1 Joules",
      "D. 1 Joule (J)"
    ],
    "correcta": 3,
    "explicacion": "Potencia es energía por unidad de tiempo: 1 W = 1 J/s, por lo que 1 W·s = 1 J."
  },
  {
    "id": 10,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad de presión en el Sistema Internacional?",
    "opciones": [
      "A. La atmósfera (atm)",
      "B. El milímetro de mercurio (mmHg)",
      "C. El pascal (Pa)",
      "D. El bar"
    ],
    "correcta": 2,
    "explicacion": "El pascal equivale a una fuerza de 1 newton por metro cuadrado (1 N/m²)."
  },
  {
    "id": 11,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la velocidad en análisis dimensional?",
    "opciones": [
      "A. [M L T^-1]",
      "B. [L T^-1]",
      "C. [L T^-2]",
      "D. [L^2 T^-1]"
    ],
    "correcta": 1,
    "explicacion": "Velocidad es longitud dividida entre tiempo: L / T = L·T^-1."
  },
  {
    "id": 12,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la aceleración en análisis dimensional?",
    "opciones": [
      "A. [L T^-2]",
      "B. [L T^-1]",
      "C. [M L T^-2]",
      "D. [L^2 T^-2]"
    ],
    "correcta": 0,
    "explicacion": "Aceleración es cambio de velocidad por unidad de tiempo: (L/T)/T = L·T^-2."
  },
  {
    "id": 13,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la fuerza en análisis dimensional?",
    "opciones": [
      "A. [M L^2 T^-2]",
      "B. [M L T^-1]",
      "C. [M L^-1 T^-2]",
      "D. [M L T^-2]"
    ],
    "correcta": 3,
    "explicacion": "Por la segunda ley de Newton (F = m·a), [F] = M · (L·T^-2)."
  },
  {
    "id": 14,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión del trabajo mecánico y la energía?",
    "opciones": [
      "A. [M L^2 T^-1]",
      "B. [M L^-1 T^-2]",
      "C. [M L^2 T^-2]",
      "D. [M L T^-2]"
    ],
    "correcta": 2,
    "explicacion": "Trabajo es fuerza por distancia: [W] = (M L T^-2) · L = M L^2 T^-2."
  },
  {
    "id": 15,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la potencia mecánica?",
    "opciones": [
      "A. [M L^-1 T^-2]",
      "B. [M L^2 T^-3]",
      "C. [M L^2 T^-2]",
      "D. [M L T^-3]"
    ],
    "correcta": 1,
    "explicacion": "Potencia es energía por unidad de tiempo: (M L^2 T^-2) / T = M L^2 T^-3."
  },
  {
    "id": 16,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué prefijo del SI representa un factor de 10^-3?",
    "opciones": [
      "A. mili (m)",
      "B. micro (μ)",
      "C. nano (n)",
      "D. centi (c)"
    ],
    "correcta": 0,
    "explicacion": "El prefijo mili representa una milésima parte (10^-3)."
  },
  {
    "id": 17,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué prefijo del SI representa un factor de 10^3?",
    "opciones": [
      "A. hecto (h)",
      "B. kilo (k)",
      "C. mega (M)",
      "D. giga (G)"
    ],
    "correcta": 1,
    "explicacion": "El prefijo kilo representa mil unidades (10^3)."
  },
  {
    "id": 18,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál de las siguientes es una magnitud puramente escalar?",
    "opciones": [
      "A. La fuerza",
      "B. La aceleración",
      "C. La masa",
      "D. La velocidad"
    ],
    "correcta": 2,
    "explicacion": "La masa solo tiene magnitud y unidad, no tiene dirección espacial."
  },
  {
    "id": 19,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál de las siguientes es una magnitud vectorial?",
    "opciones": [
      "A. El tiempo",
      "B. El desplazamiento",
      "C. La distancia recorrida",
      "D. La temperatura"
    ],
    "correcta": 1,
    "explicacion": "El desplazamiento tiene magnitud, dirección y sentido."
  },
  {
    "id": 20,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud resulta del producto escalar de dos vectores?",
    "opciones": [
      "A. Un escalar (número real)",
      "B. Un vector perpendicular",
      "C. Un tensor de rango 2",
      "D. Un pseudovector"
    ],
    "correcta": 0,
    "explicacion": "El producto escalar (o producto punto) de dos vectores da como resultado un escalar: A·B = |A||B|cos(θ)."
  },
  {
    "id": 21,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué dirección tiene el vector resultante del producto cruz A × B?",
    "opciones": [
      "A. Paralela a A",
      "B. Paralela a B",
      "C. En el mismo plano que A y B",
      "D. Perpendicular al plano formado por A y B"
    ],
    "correcta": 3,
    "explicacion": "El producto vectorial produce un vector perpendicular al plano que contiene a ambos vectores según la regla de la mano derecha."
  },
  {
    "id": 22,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si el producto escalar de dos vectores no nulos es cero, los vectores son:",
    "opciones": [
      "A. Antiparalelos",
      "B. Iguales en magnitud",
      "C. Perpendiculares (ortogonales)",
      "D. Paralelos"
    ],
    "correcta": 2,
    "explicacion": "A·B = |A||B|cos(θ) = 0 implica cos(θ) = 0, es decir, θ = 90°."
  },
  {
    "id": 23,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si el producto cruz de dos vectores no nulos es el vector nulo, los vectores son:",
    "opciones": [
      "A. Ortogonales en 3D",
      "B. Paralelos o antiparalelos (colineales)",
      "C. Perpendiculares",
      "D. De diferente dimensión"
    ],
    "correcta": 1,
    "explicacion": "|A × B| = |A||B|sin(θ) = 0 implica sin(θ) = 0, es decir, θ = 0° o 180°."
  },
  {
    "id": 24,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el valor aproximado de la velocidad de la luz en el vacío?",
    "opciones": [
      "A. 3.00 × 10^8 m/s",
      "B. 3.00 × 10^6 m/s",
      "C. 3.00 × 10^5 km/h",
      "D. 1.50 × 10^8 m/s"
    ],
    "correcta": 0,
    "explicacion": "La velocidad de la luz c en el vacío es exactamente 299,792,458 m/s (~3 × 10^8 m/s)."
  },
  {
    "id": 25,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el valor de la aceleración gravitacional estándar en la superficie terrestre?",
    "opciones": [
      "A. 10.8 m/s²",
      "B. 8.9 m/s²",
      "C. 9.8 km/s²",
      "D. 9.80665 m/s² (~9.8 m/s²)"
    ],
    "correcta": 3,
    "explicacion": "El valor estándar convencional de la gravedad terrestre a nivel del mar es 9.80665 m/s²."
  },
  {
    "id": 26,
    "area": "Física Fundamental",
    "subtema": "Metrología y Vectores",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos metros equivale una milla terrestre estándar?",
    "opciones": [
      "A. 1852 metros",
      "B. 1200 metros",
      "C. 1609.34 metros",
      "D. 1000 metros"
    ],
    "correcta": 2,
    "explicacion": "Una milla terrestre equivale a 1.60934 kilómetros o ~1609 m (1852 m es la milla náutica)."
  },
  {
    "id": 27,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos segundos equivale exactamente una hora?",
    "opciones": [
      "A. 86400 segundos",
      "B. 3600 segundos",
      "C. 600 segundos",
      "D. 1440 segundos"
    ],
    "correcta": 1,
    "explicacion": "1 hora = 60 minutos × 60 segundos/minuto = 3600 s."
  },
  {
    "id": 28,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos segundos equivale un día solar terrestre promedio?",
    "opciones": [
      "A. 86400 segundos",
      "B. 43200 segundos",
      "C. 36000 segundos",
      "D. 100000 segundos"
    ],
    "correcta": 0,
    "explicacion": "24 horas × 3600 segundos/hora = 86400 s."
  },
  {
    "id": 29,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos centímetros cúbicos (cm³ o cc) hay en un litro (1 L)?",
    "opciones": [
      "A. 100 cm³",
      "B. 10 cm³",
      "C. 10000 cm³",
      "D. 1000 cm³"
    ],
    "correcta": 3,
    "explicacion": "1 litro equivale a 1 decímetro cúbico (1 dm³) = 1000 cm³."
  },
  {
    "id": 30,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos kilogramos tiene una tonelada métrica?",
    "opciones": [
      "A. 2000 kg",
      "B. 500 kg",
      "C. 1000 kg",
      "D. 100 kg"
    ],
    "correcta": 2,
    "explicacion": "Una tonelada métrica son 10^3 kilogramos (1000 kg)."
  },
  {
    "id": 31,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos metros por segundo equivalen 36 km/h?",
    "opciones": [
      "A. 5 m/s",
      "B. 10 m/s",
      "C. 15 m/s",
      "D. 20 m/s"
    ],
    "correcta": 1,
    "explicacion": "36 km/h ÷ 3.6 = 10 m/s."
  },
  {
    "id": 32,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la masa de 1 litro de agua pura a 4 °C?",
    "opciones": [
      "A. 2 kg",
      "B. 10 kg",
      "C. 1 kilogramo (1 kg)",
      "D. 0.5 kg"
    ],
    "correcta": 2,
    "explicacion": "La densidad del agua a 4 °C es exactamente 1000 kg/m³ = 1 kg/L."
  },
  {
    "id": 33,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué instrumento se utiliza para medir el diámetro exterior de una pieza con precisión de centésimas de milímetro?",
    "opciones": [
      "A. El barómetro",
      "B. El tornillo micrométrico o micrómetro",
      "C. La cinta métrica",
      "D. El goniómetro"
    ],
    "correcta": 1,
    "explicacion": "El micrómetro (Palmer) permite medir con resolución de 0.01 mm o incluso micras."
  },
  {
    "id": 34,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué mide un calibre o pie de rey?",
    "opciones": [
      "A. Dimensiones exteriores, interiores y profundidades con nonio",
      "B. La presión del aire",
      "C. La corriente eléctrica",
      "D. La masa gravitatoria"
    ],
    "correcta": 0,
    "explicacion": "El calibrador vernier o pie de rey mide exteriores, interiores y profundidades."
  },
  {
    "id": 35,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En una medición experimental, ¿qué representa la incertidumbre aleatoria?",
    "opciones": [
      "A. Un error constante por descalibración del instrumento",
      "B. Un error matemático en las fórmulas",
      "C. La falta de unidades",
      "D. Fluctuaciones estadísticas inevitables en lecturas repetidas"
    ],
    "correcta": 3,
    "explicacion": "Los errores aleatorios varían de forma impredecible en ambos sentidos alrededor de la media."
  },
  {
    "id": 36,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué representa un error sistemático en una medición física?",
    "opciones": [
      "A. Un error del operador al anotar un dígito",
      "B. Un valor cuántico de fondo",
      "C. Una desviación constante debida a calibración o método",
      "D. Una fluctuación estadística impredecible"
    ],
    "correcta": 2,
    "explicacion": "El error sistemático desvía las mediciones siempre en el mismo sentido."
  },
  {
    "id": 37,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántas cifras significativas tiene la cantidad medida 0.00450 m?",
    "opciones": [
      "A. 6 cifras significativas",
      "B. 3 cifras significativas",
      "C. 5 cifras significativas",
      "D. 2 cifras significativas"
    ],
    "correcta": 1,
    "explicacion": "Los ceros a la izquierda no son significativos; 4, 5 y el cero final a la derecha sí lo son (3 cifras)."
  },
  {
    "id": 38,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántas cifras significativas tiene la cantidad 2.500 × 10^4 s?",
    "opciones": [
      "A. 4 cifras significativas",
      "B. 2 cifras significativas",
      "C. 3 cifras significativas",
      "D. 5 cifras significativas"
    ],
    "correcta": 0,
    "explicacion": "En notación científica, todos los dígitos de la mantisa (2.500) son significativos."
  },
  {
    "id": 39,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué postula el principio de homogeneidad dimensional de Fourier?",
    "opciones": [
      "A. Que la masa nunca puede convertirse en energía",
      "B. Que todos los cuerpos tienen la misma densidad",
      "C. Que las unidades deben ser inglesas",
      "D. Que los términos de una ecuación física deben tener las mismas dimensiones"
    ],
    "correcta": 3,
    "explicacion": "Solo se pueden sumar o igualar magnitudes físicas con la misma dimensión."
  },
  {
    "id": 40,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la presión en análisis dimensional?",
    "opciones": [
      "A. [M L^2 T^-2]",
      "B. [M L^-2 T^-2]",
      "C. [M L^-1 T^-2]",
      "D. [M L T^-2]"
    ],
    "correcta": 2,
    "explicacion": "Presión = Fuerza / Área = (M L T^-2) / L^2 = M L^-1 T^-2."
  },
  {
    "id": 41,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la frecuencia temporal?",
    "opciones": [
      "A. [T]",
      "B. [T^-1]",
      "C. [T^-2]",
      "D. [L T^-1]"
    ],
    "correcta": 1,
    "explicacion": "Frecuencia = 1 / Periodo = T^-1 (unidad: Hertz = s^-1)."
  },
  {
    "id": 42,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la densidad de masa volumétrica?",
    "opciones": [
      "A. [M L^-3]",
      "B. [M L^-2]",
      "C. [M L^-1]",
      "D. [M L^3]"
    ],
    "correcta": 0,
    "explicacion": "Densidad = Masa / Volumen = M / L^3 = M L^-3."
  },
  {
    "id": 43,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión del momento angular?",
    "opciones": [
      "A. [M L T^-1]",
      "B. [M L^2 T^-2]",
      "C. [M L^-1 T^-1]",
      "D. [M L^2 T^-1]"
    ],
    "correcta": 3,
    "explicacion": "L = r × p -> [L] = L · (M L T^-1) = M L^2 T^-1."
  },
  {
    "id": 44,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la unidad SI de la constante de gravitación universal G?",
    "opciones": [
      "A. kg·m/s²",
      "B. J/kg",
      "C. N·m²/kg² o m³/(kg·s²)",
      "D. N·kg²/m²"
    ],
    "correcta": 2,
    "explicacion": "De F = G m1 m2 / r², despejando G se obtiene N·m²/kg²."
  },
  {
    "id": 45,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la dimensión de la constante de Planck h?",
    "opciones": [
      "A. [M L T^-1]",
      "B. [M L^2 T^-1]",
      "C. [M L T^-2]",
      "D. [M L^2 T^-2]"
    ],
    "correcta": 1,
    "explicacion": "E = h·f -> [h] = [E]/[f] = (M L^2 T^-2) / (T^-1) = M L^2 T^-1 (Joules · segundo)."
  },
  {
    "id": 46,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud física tiene como unidad SI el Weber (Wb)?",
    "opciones": [
      "A. El flujo magnético",
      "B. El campo magnético",
      "C. La inductancia",
      "D. La capacitancia"
    ],
    "correcta": 0,
    "explicacion": "1 Weber equivale a 1 Tesla · metro cuadrado (1 T·m²), unidad de flujo magnético."
  },
  {
    "id": 47,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud física tiene como unidad SI el Henry (H)?",
    "opciones": [
      "A. La capacitancia",
      "B. La resistencia",
      "C. El flujo magnético",
      "D. La inductancia"
    ],
    "correcta": 3,
    "explicacion": "El Henry mide la inductancia eléctrica (autoinductancia e inductancia mutua)."
  },
  {
    "id": 48,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud física tiene como unidad SI el Faradio (F)?",
    "opciones": [
      "A. El potencial eléctrico",
      "B. La conductancia",
      "C. La capacitancia eléctrica",
      "D. La inductancia"
    ],
    "correcta": 2,
    "explicacion": "El Faradio equivale a 1 Coulomb por Voltio (1 C/V)."
  },
  {
    "id": 49,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud física tiene como unidad SI el Tesla (T)?",
    "opciones": [
      "A. La permitividad",
      "B. La inducción magnética (campo B)",
      "C. El flujo magnético",
      "D. La fuerza magnetomotriz"
    ],
    "correcta": 1,
    "explicacion": "El Tesla equivale a 1 N / (A·m) o 1 Wb/m²."
  },
  {
    "id": 50,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué magnitud física tiene como unidad SI el Siemens (S)?",
    "opciones": [
      "A. La conductancia eléctrica",
      "B. La resistividad",
      "C. La reactancia",
      "D. La impedancia"
    ],
    "correcta": 0,
    "explicacion": "El Siemens es la inversa del ohmio (1 S = 1/Ω = A/V)."
  },
  {
    "id": 51,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la rapidez de propagación del sonido en el aire a 20 °C a nivel del mar?",
    "opciones": [
      "A. 1500 m/s",
      "B. 3000 m/s",
      "C. 120 m/s",
      "D. Aproximadamente 343 m/s"
    ],
    "correcta": 3,
    "explicacion": "En aire seco a 20 °C, la velocidad del sonido es v ≈ 331 + 0.6·T = 343 m/s."
  },
  {
    "id": 52,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la rapidez aproximada del sonido en el agua líquida a temperatura ambiente?",
    "opciones": [
      "A. 5000 m/s",
      "B. 150 m/s",
      "C. Aproximadamente 1480 m/s",
      "D. 340 m/s"
    ],
    "correcta": 2,
    "explicacion": "En el agua, al ser más incompresible que el aire, el sonido viaja casi 4.3 veces más rápido."
  },
  {
    "id": 53,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la rapidez aproximada del sonido en una barra de acero?",
    "opciones": [
      "A. 800 m/s",
      "B. Aproximadamente 5100 m/s",
      "C. 340 m/s",
      "D. 1500 m/s"
    ],
    "correcta": 1,
    "explicacion": "En sólidos rígidos como el acero, la velocidad de onda elástica longitudinal supera los 5000 m/s."
  },
  {
    "id": 54,
    "area": "Física Fundamental",
    "subtema": "Constantes y Metrología Avanzada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué representa el número adimensional de Reynolds en mecánica de fluidos?",
    "opciones": [
      "A. La relación entre fuerzas inerciales y fuerzas viscosas",
      "B. La relación entre velocidad y aceleración",
      "C. La relación entre masa y volumen",
      "D. La compresibilidad del fluido"
    ],
    "correcta": 0,
    "explicacion": "El número de Reynolds Re = ρ v L / μ determina si el flujo es laminar o turbulento."
  },
  {
    "id": 55,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En el movimiento rectilíneo uniforme (MRU), la aceleración es:",
    "opciones": [
      "A. Constante y positiva",
      "B. Variable con el tiempo",
      "C. Igual a la gravedad",
      "D. Estrictamente nula (a = 0)"
    ],
    "correcta": 3,
    "explicacion": "Por definición, en el MRU la velocidad no cambia ni en magnitud ni en dirección, por lo que a = 0."
  },
  {
    "id": 56,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En una gráfica posición vs tiempo (x - t), la pendiente de la curva en cualquier instante representa:",
    "opciones": [
      "A. La distancia acumulada",
      "B. La fuerza neta",
      "C. La velocidad instantánea",
      "D. La aceleración instantánea"
    ],
    "correcta": 2,
    "explicacion": "La derivada de la posición respecto al tiempo dx/dt es la velocidad."
  },
  {
    "id": 57,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En una gráfica velocidad vs tiempo (v - t), la pendiente de la recta representa:",
    "opciones": [
      "A. La fuerza",
      "B. La aceleración",
      "C. La posición final",
      "D. El desplazamiento"
    ],
    "correcta": 1,
    "explicacion": "La derivada de la velocidad respecto al tiempo dv/dt es la aceleración."
  },
  {
    "id": 58,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En una gráfica velocidad vs tiempo (v - t), el área bajo la curva entre dos tiempos representa:",
    "opciones": [
      "A. El desplazamiento del móvil",
      "B. La aceleración media",
      "C. La velocidad máxima",
      "D. La trayectoria espacial"
    ],
    "correcta": 0,
    "explicacion": "La integral ∫ v dt entre t1 y t2 equivale al cambio de posición Δx."
  },
  {
    "id": 59,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En una gráfica aceleración vs tiempo (a - t), el área bajo la curva representa:",
    "opciones": [
      "A. La posición final",
      "B. El desplazamiento total",
      "C. La velocidad media",
      "D. El cambio de velocidad (Δv)"
    ],
    "correcta": 3,
    "explicacion": "La integral ∫ a dt entre dos instantes corresponde a v(t2) - v(t1)."
  },
  {
    "id": 60,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un móvil con MRUA parte del reposo con aceleración a = 4 m/s². ¿Qué velocidad alcanza a los 5 segundos?",
    "opciones": [
      "A. 40 m/s",
      "B. 100 m/s",
      "C. 20 m/s",
      "D. 10 m/s"
    ],
    "correcta": 2,
    "explicacion": "v = v0 + a·t = 0 + 4 m/s² · 5 s = 20 m/s."
  },
  {
    "id": 61,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un móvil con MRUA parte del reposo con a = 2 m/s². ¿Qué distancia recorre en 4 segundos?",
    "opciones": [
      "A. 64 metros",
      "B. 16 metros",
      "C. 8 metros",
      "D. 32 metros"
    ],
    "correcta": 1,
    "explicacion": "x = v0·t + (1/2)·a·t² = 0 + (1/2)·(2)·(16) = 16 m."
  },
  {
    "id": 62,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un automóvil frena a razón constante de -5 m/s² desde 20 m/s hasta detenerse. ¿Cuánto tiempo tarda en parar?",
    "opciones": [
      "A. 4 segundos",
      "B. 2 segundos",
      "C. 5 segundos",
      "D. 10 segundos"
    ],
    "correcta": 0,
    "explicacion": "t = (v - v0)/a = (0 - 20)/(-5) = 4 s."
  },
  {
    "id": 63,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué distancia de frenado recorre un auto que va a 30 m/s si desacelera a -6 m/s² hasta detenerse?",
    "opciones": [
      "A. 50 metros",
      "B. 90 metros",
      "C. 180 metros",
      "D. 75 metros"
    ],
    "correcta": 3,
    "explicacion": "v² = v0² + 2·a·d -> 0 = 30² + 2(-6)d -> 12d = 900 -> d = 75 m."
  },
  {
    "id": 64,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Se deja caer una piedra desde lo alto de un puente y tarda 3 segundos en tocar el agua (g = 9.8 m/s²). ¿Cuál es la altura del puente?",
    "opciones": [
      "A. 88.2 metros",
      "B. 14.7 metros",
      "C. 44.1 metros",
      "D. 29.4 metros"
    ],
    "correcta": 2,
    "explicacion": "h = (1/2)·g·t² = 0.5 · 9.8 · 9 = 44.1 m."
  },
  {
    "id": 65,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Con qué rapidez impacta contra el suelo un objeto en caída libre desde el reposo tras caer 20 metros (g = 9.8 m/s²)?",
    "opciones": [
      "A. 9.8 m/s",
      "B. Aproximadamente 19.8 m/s",
      "C. 14.0 m/s",
      "D. 39.2 m/s"
    ],
    "correcta": 1,
    "explicacion": "v = √(2·g·h) = √(2 · 9.8 · 20) = √392 ≈ 19.8 m/s (con g=10 sería 20 m/s)."
  },
  {
    "id": 66,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Se lanza una pelota verticalmente hacia arriba a 29.4 m/s (g = 9.8 m/s²). ¿Cuánto tiempo tarda en alcanzar el punto más alto?",
    "opciones": [
      "A. 3.0 segundos",
      "B. 1.5 segundos",
      "C. 6.0 segundos",
      "D. 2.0 segundos"
    ],
    "correcta": 0,
    "explicacion": "En el punto más alto v = 0 -> t = v0/g = 29.4 / 9.8 = 3.0 s."
  },
  {
    "id": 67,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué altura máxima alcanza una pelota lanzada verticalmente hacia arriba a 29.4 m/s (g = 9.8 m/s²)?",
    "opciones": [
      "A. 29.4 metros",
      "B. 88.2 metros",
      "C. 58.8 metros",
      "D. 44.1 metros"
    ],
    "correcta": 3,
    "explicacion": "h_max = v0² / (2g) = (29.4)² / (19.6) = 864.36 / 19.6 = 44.1 m."
  },
  {
    "id": 68,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuánto es el tiempo total de vuelo de un proyectil lanzado verticalmente si tarda 4 s en subir?",
    "opciones": [
      "A. 16 segundos",
      "B. 2 segundos",
      "C. 8 segundos (simetría temporal)",
      "D. 4 segundos"
    ],
    "correcta": 2,
    "explicacion": "En caída libre sin resistencia del aire, el tiempo de subida es exactamente igual al tiempo de bajada."
  },
  {
    "id": 69,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En el punto más alto de la trayectoria de un lanzamiento vertical, la aceleración del proyectil es:",
    "opciones": [
      "A. 9.8 m/s² hacia arriba",
      "B. 9.8 m/s² hacia abajo",
      "C. Cero",
      "D. Variable"
    ],
    "correcta": 1,
    "explicacion": "La gravedad no desaparece nunca; la velocidad es cero instantáneamente, pero la aceleración sigue siendo g hacia abajo."
  },
  {
    "id": 70,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En el movimiento de proyectiles (tiro parabólico), la componente horizontal de la velocidad vx:",
    "opciones": [
      "A. Permanece constante durante todo el vuelo",
      "B. Aumenta linealmente",
      "C. Disminuye linealmente",
      "D. Se anula en el vértice"
    ],
    "correcta": 0,
    "explicacion": "Sin fricción del aire, no hay fuerzas en x (ax = 0), por lo que vx = v0·cos(θ) es constante."
  },
  {
    "id": 71,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En un tiro parabólico, ¿en qué punto de la trayectoria la rapidez del proyectil es mínima?",
    "opciones": [
      "A. Al salir del cañón",
      "B. Justo antes de tocar el suelo",
      "C. A la mitad de la altura máxima",
      "D. En el punto de máxima altura (vértice)"
    ],
    "correcta": 3,
    "explicacion": "En el vértice vy = 0, por lo que la rapidez es solo |vx|, su valor mínimo."
  },
  {
    "id": 72,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el ángulo de elevación que maximiza el alcance horizontal en terreno plano sin resistencia del aire?",
    "opciones": [
      "A. 60 grados",
      "B. 90 grados",
      "C. 45 grados",
      "D. 30 grados"
    ],
    "correcta": 2,
    "explicacion": "R = (v0²·sin(2θ))/g; sin(2θ) es máximo (= 1) cuando 2θ = 90°, es decir, θ = 45°."
  },
  {
    "id": 73,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Dos proyectiles se disparan con la misma rapidez inicial a ángulos complementarios (ej: 30° y 60°). Su alcance horizontal es:",
    "opciones": [
      "A. Cero para 60°",
      "B. Exactamente el mismo en ambos casos",
      "C. Mayor para 30°",
      "D. Mayor para 60°"
    ],
    "correcta": 1,
    "explicacion": "sin(2·30°) = sin(60°) y sin(2·60°) = sin(120°) = sin(60°), por lo que el alcance es idéntico."
  },
  {
    "id": 74,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En el movimiento circular uniforme (MCU), la aceleración centrípeta apunta hacia:",
    "opciones": [
      "A. El centro de la trayectoria circular",
      "B. La dirección de la velocidad tangencial",
      "C. Hacia afuera del círculo",
      "D. En dirección opuesta al radio"
    ],
    "correcta": 0,
    "explicacion": "La aceleración centrípeta es radial y dirigida siempre hacia el centro de giro."
  },
  {
    "id": 75,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la fórmula de la aceleración centrípeta en términos de la rapidez v y el radio r?",
    "opciones": [
      "A. ac = v / r²",
      "B. ac = v · r",
      "C. ac = v² · r",
      "D. ac = v² / r"
    ],
    "correcta": 3,
    "explicacion": "ac = v² / r = ω² · r."
  },
  {
    "id": 76,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si un móvil en MCU duplica su rapidez lineal manteniendo el mismo radio, su aceleración centrípeta:",
    "opciones": [
      "A. Permanece igual",
      "B. Se reduce a la mitad",
      "C. Se cuadruplica (aumenta 4 veces)",
      "D. Se duplica"
    ],
    "correcta": 2,
    "explicacion": "Como ac = v²/r, si v se duplica, v² aumenta por un factor de 2² = 4."
  },
  {
    "id": 77,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la relación entre la velocidad angular ω y la frecuencia f en movimiento circular?",
    "opciones": [
      "A. ω = π f",
      "B. ω = 2π f",
      "C. ω = f / 2π",
      "D. ω = 2π / f"
    ],
    "correcta": 1,
    "explicacion": "La frecuencia angular es ω = 2π/T = 2π f."
  },
  {
    "id": 78,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un disco gira a 60 revoluciones por minuto (60 rpm). ¿Cuál es su velocidad angular en rad/s?",
    "opciones": [
      "A. 2π rad/s (~6.28 rad/s)",
      "B. 60 rad/s",
      "C. π rad/s",
      "D. 120π rad/s"
    ],
    "correcta": 0,
    "explicacion": "60 rpm = 60 × (2π rad / 60 s) = 2π rad/s."
  },
  {
    "id": 79,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si el radio de una rueda es 0.5 m y gira a 4 rad/s, ¿cuál es la rapidez tangencial en el borde?",
    "opciones": [
      "A. 1.0 m/s",
      "B. 8.0 m/s",
      "C. 0.5 m/s",
      "D. 2.0 m/s"
    ],
    "correcta": 3,
    "explicacion": "v = ω · r = 4 rad/s · 0.5 m = 2.0 m/s."
  },
  {
    "id": 80,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En el movimiento circular uniformemente acelerado (MCUA), la aceleración total es la suma vectorial de:",
    "opciones": [
      "A. Dos aceleraciones centrípetas",
      "B. La fuerza normal y el peso",
      "C. La aceleración centrípeta y la aceleración tangencial",
      "D. La gravedad y la velocidad"
    ],
    "correcta": 2,
    "explicacion": "at cambia la magnitud de la velocidad y ac cambia la dirección; a_total = √(ac² + at²)."
  },
  {
    "id": 81,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un avión viaja a 200 km/h hacia el norte y sopla un viento cruzado hacia el este de 50 km/h. La velocidad resultante es:",
    "opciones": [
      "A. 200 km/h al este",
      "B. Aproximadamente 206 km/h hacia el noreste",
      "C. 250 km/h al norte",
      "D. 150 km/h al este"
    ],
    "correcta": 1,
    "explicacion": "Por teorema de Pitágoras: v = √(200² + 50²) = √(40000 + 2500) = √42500 ≈ 206.15 km/h."
  },
  {
    "id": 82,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un río fluye a 3 m/s hacia el sur. Un nadador cruza perpendicularmente hacia el este a 4 m/s respecto al agua. Su rapidez respecto a la orilla es:",
    "opciones": [
      "A. 5 m/s",
      "B. 7 m/s",
      "C. 1 m/s",
      "D. 3.5 m/s"
    ],
    "correcta": 0,
    "explicacion": "v = √(3² + 4²) = √(9 + 16) = √25 = 5 m/s."
  },
  {
    "id": 83,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 2,
    "dificultad": "Básico",
    "pregunta": "La ecuación de la trayectoria y(x) de un proyectil disparado desde el origen en campo gravitatorio uniforme es:",
    "opciones": [
      "A. Una elipse",
      "B. Una hipérbola",
      "C. Una recta con pendiente negativa",
      "D. Una parábola cóncava hacia abajo"
    ],
    "correcta": 3,
    "explicacion": "Eliminando t entre x(t) e y(t) se obtiene y(x) = x·tan(θ) - (g/(2v0²cos²θ))x², una parábola."
  },
  {
    "id": 84,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento 1D, 2D y Circular",
    "nivel": 2,
    "dificultad": "Básico",
    "pregunta": "¿Qué se entiende por velocidad relativa entre dos móviles A y B?",
    "opciones": [
      "A. La aceleración de ambos",
      "B. El cociente de sus rapideces",
      "C. La velocidad de A medida desde el sistema de referencia de B (v_AB = v_A - v_B)",
      "D. La suma de sus masas"
    ],
    "correcta": 2,
    "explicacion": "La velocidad relativa describe cómo se desplaza un objeto visto por un observador en movimiento."
  },
  {
    "id": 85,
    "area": "Cinemática Clásica",
    "subtema": "Cálculo y Ecuaciones Horarias",
    "nivel": 2,
    "dificultad": "Básico",
    "pregunta": "Un cuerpo se desplaza en línea recta con velocidad inicial v₀ = 11 m/s y aceleración constante a = 2 m/s². ¿Cuál es su rapidez a los 3 segundos?",
    "opciones": [
      "A. 34 m/s",
      "B. 17 m/s",
      "C. 21 m/s",
      "D. 12 m/s"
    ],
    "correcta": 1,
    "explicacion": "Aplicando v = v₀ + a·t: v = 11 + (2)(3) = 17 m/s."
  },
  {
    "id": 86,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Primera Ley de Newton (Ley de la Inercia) establece que un cuerpo permanece en reposo o en MRU si:",
    "opciones": [
      "A. Su aceleración es positiva",
      "B. La fuerza neta que actúa sobre él es cero",
      "C. No tiene masa",
      "D. La gravedad es constante"
    ],
    "correcta": 1,
    "explicacion": "Si ∑F = 0, el vector velocidad es constante (dv/dt = 0)."
  },
  {
    "id": 87,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La masa inercial de un cuerpo es una medida cuantitativa de:",
    "opciones": [
      "A. Su resistencia a cambiar su estado de movimiento",
      "B. La atracción gravitatoria de la Luna",
      "C. El volumen del objeto",
      "D. Su carga eléctrica"
    ],
    "correcta": 0,
    "explicacion": "A mayor masa inercial, menor es la aceleración producida por una fuerza dada."
  },
  {
    "id": 88,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Segunda Ley de Newton se expresa matemáticamente como:",
    "opciones": [
      "A. F = m / a",
      "B. F = m · v",
      "C. E = m · c²",
      "D. ∑F = m · a (o F = dp/dt)"
    ],
    "correcta": 3,
    "explicacion": "La fuerza neta aplicada sobre un cuerpo es directamente proporcional a su aceleración y masa."
  },
  {
    "id": 89,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Tercera Ley de Newton (Acción y Reacción) establece que:",
    "opciones": [
      "A. Solo se aplica si no hay gravedad",
      "B. La acción ocurre antes de la reacción",
      "C. Las fuerzas siempre ocurren en pares iguales y opuestos sobre cuerpos distintos",
      "D. Una fuerza anula a la otra sobre el mismo cuerpo"
    ],
    "correcta": 2,
    "explicacion": "Si el cuerpo A ejerce fuerza sobre B, B ejerce una fuerza igual y opuesta sobre A (F_AB = -F_BA)."
  },
  {
    "id": 90,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el par de acción y reacción nunca se anula mutuamente?",
    "opciones": [
      "A. Porque una es gravitacional y la otra no",
      "B. Porque actúan sobre dos cuerpos diferentes",
      "C. Porque tienen magnitudes distintas",
      "D. Porque apuntan en la misma dirección"
    ],
    "correcta": 1,
    "explicacion": "Para que dos fuerzas se equilibren deben actuar sobre el mismo cuerpo; acción y reacción actúan en cuerpos distintos."
  },
  {
    "id": 91,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un bloque de masa 5 kg se acelera a 3 m/s² sobre una superficie lisa. ¿Cuál es la fuerza neta aplicada?",
    "opciones": [
      "A. 15 N",
      "B. 8 N",
      "C. 1.67 N",
      "D. 45 N"
    ],
    "correcta": 0,
    "explicacion": "F = m · a = 5 kg · 3 m/s² = 15 N."
  },
  {
    "id": 92,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un objeto de masa 10 kg en la superficie terrestre (g = 9.8 m/s²) tiene un peso de:",
    "opciones": [
      "A. 10 N",
      "B. 9.8 N",
      "C. 980 N",
      "D. 98 N"
    ],
    "correcta": 3,
    "explicacion": "Peso W = m · g = 10 kg · 9.8 m/s² = 98 N."
  },
  {
    "id": 93,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si llevamos un objeto de masa 60 kg a la Luna (g_luna ≈ 1.62 m/s²), ¿cuál es su masa en la Luna?",
    "opciones": [
      "A. 97.2 N",
      "B. 360 kg",
      "C. 60 kg (la masa es invariante)",
      "D. 10 kg"
    ],
    "correcta": 2,
    "explicacion": "La masa es una propiedad intrínseca de la materia; el peso cambia, la masa no."
  },
  {
    "id": 94,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el peso de una persona de 60 kg en la Luna (g_luna ≈ 1.62 m/s²)?",
    "opciones": [
      "A. 360 N",
      "B. Aproximadamente 97.2 N",
      "C. 588 N",
      "D. 60 N"
    ],
    "correcta": 1,
    "explicacion": "W = m · g_luna = 60 kg · 1.62 m/s² = 97.2 N."
  },
  {
    "id": 95,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una persona de 70 kg está sobre una báscula dentro de un elevador que acelera hacia arriba a 2 m/s² (g = 9.8 m/s²). La lectura de la báscula es:",
    "opciones": [
      "A. 826 N",
      "B. 686 N",
      "C. 546 N",
      "D. 700 N"
    ],
    "correcta": 0,
    "explicacion": "N - mg = m·a -> N = m(g + a) = 70(9.8 + 2) = 70(11.8) = 826 N."
  },
  {
    "id": 96,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una persona de 70 kg está en un elevador cuyos cables se rompen (caída libre, a = g hacia abajo). La báscula marca:",
    "opciones": [
      "A. 686 N",
      "B. 1372 N",
      "C. 70 N",
      "D. 0 N (ingravidez aparente)"
    ],
    "correcta": 3,
    "explicacion": "N = m(g - a) = m(g - g) = 0 N."
  },
  {
    "id": 97,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza normal entre una superficie horizontal y un bloque en reposo es:",
    "opciones": [
      "A. Siempre mayor al peso",
      "B. Igual a la fricción",
      "C. Perpendicular a la superficie de contacto",
      "D. Paralela a la superficie"
    ],
    "correcta": 2,
    "explicacion": "La fuerza normal es la fuerza de contacto perpendicular que ejerce la superficie para soportar al cuerpo."
  },
  {
    "id": 98,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un plano inclinado un ángulo θ sin fricción, la componente del peso paralela al plano que acelera al bloque hacia abajo es:",
    "opciones": [
      "A. mg",
      "B. mg · sin(θ)",
      "C. mg · cos(θ)",
      "D. mg · tan(θ)"
    ],
    "correcta": 1,
    "explicacion": "Descomponiendo el peso en ejes perpendicular y paralelo al plano, la componente paralela es mg·sin(θ)."
  },
  {
    "id": 99,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un plano inclinado un ángulo θ, la componente del peso perpendicular al plano equilibrada por la normal es:",
    "opciones": [
      "A. mg · cos(θ)",
      "B. mg · sin(θ)",
      "C. mg · tan(θ)",
      "D. mg / cos(θ)"
    ],
    "correcta": 0,
    "explicacion": "La normal equilibra la componente perpendicular: N = mg·cos(θ)."
  },
  {
    "id": 100,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un bloque de 10 kg desciende por un plano inclinado a 30° sin fricción (g = 9.8 m/s²). Su aceleración es:",
    "opciones": [
      "A. 9.8 m/s²",
      "B. 8.49 m/s²",
      "C. 2.45 m/s²",
      "D. 4.9 m/s²"
    ],
    "correcta": 3,
    "explicacion": "a = g · sin(30°) = 9.8 · 0.5 = 4.9 m/s² (la masa se cancela)."
  },
  {
    "id": 101,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza de fricción estática máxima antes de que un cuerpo comience a deslizar es:",
    "opciones": [
      "A. fs = m · a",
      "B. fs = mg",
      "C. fs_max = μs · N",
      "D. fs = μk · N"
    ],
    "correcta": 2,
    "explicacion": "La fricción estática se autoajusta hasta su valor límite fs_max = μs·N."
  },
  {
    "id": 102,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Generalmente, el coeficiente de fricción estático μs respecto al cinético μk cumple que:",
    "opciones": [
      "A. μs = 0",
      "B. μs > μk",
      "C. μs < μk",
      "D. μs = μk"
    ],
    "correcta": 1,
    "explicacion": "Romper el reposo requiere mayor fuerza que mantener el deslizamiento ya iniciado."
  },
  {
    "id": 103,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un bloque de 20 kg está en reposo sobre un piso horizontal con μs = 0.4 (g = 9.8 m/s²). ¿Qué fuerza horizontal mínima se requiere para moverlo?",
    "opciones": [
      "A. 78.4 N",
      "B. 196 N",
      "C. 98 N",
      "D. 39.2 N"
    ],
    "correcta": 0,
    "explicacion": "N = mg = 20 · 9.8 = 196 N. F_min = μs · N = 0.4 · 196 = 78.4 N."
  },
  {
    "id": 104,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si una fuerza horizontal de 50 N se aplica al bloque anterior (donde fs_max = 78.4 N), la fuerza de fricción estática real es:",
    "opciones": [
      "A. 78.4 N",
      "B. 0 N",
      "C. 196 N",
      "D. 50 N (se equilibra exactamente)"
    ],
    "correcta": 3,
    "explicacion": "Mientras no se supere fs_max, la fricción estática es igual y opuesta a la fuerza aplicada."
  },
  {
    "id": 105,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La tensión a lo largo de una cuerda ideal (sin masa e inextensible) que pasa por una polea ideal:",
    "opciones": [
      "A. Depende del radio de la polea",
      "B. Se anula en el centro",
      "C. Es uniforme y constante en toda su longitud",
      "D. Es el doble en la parte superior"
    ],
    "correcta": 2,
    "explicacion": "Una cuerda ideal transmite la magnitud de la fuerza sin pérdidas por masa ni rigidez."
  },
  {
    "id": 106,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En una máquina de Atwood con dos masas m1 = 3 kg y m2 = 2 kg conectadas por polea ideal, la aceleración del sistema es:",
    "opciones": [
      "A. 0.98 m/s²",
      "B. 1.96 m/s² (g/5)",
      "C. 9.8 m/s²",
      "D. 4.9 m/s²"
    ],
    "correcta": 1,
    "explicacion": "a = ((m1 - m2)/(m1 + m2))·g = ((3 - 2)/(3 + 2))·9.8 = 9.8/5 = 1.96 m/s²."
  },
  {
    "id": 107,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza que experimenta un pasajero que toma una curva en un auto empujándolo hacia afuera se denomina:",
    "opciones": [
      "A. Fuerza centrífuga (fuerza inercial o ficticia)",
      "B. Fuerza centrípeta real",
      "C. Fuerza gravitatoria",
      "D. Tensión"
    ],
    "correcta": 0,
    "explicacion": "En el marco no inercial del auto en rotación, la inercia se percibe como una fuerza aparente hacia afuera."
  },
  {
    "id": 108,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza real que mantiene a un auto girando en una curva plana es:",
    "opciones": [
      "A. La fuerza centrífuga",
      "B. El peso del auto",
      "C. La fuerza aerodinámica",
      "D. La fuerza de fricción estática entre las llantas y el pavimento"
    ],
    "correcta": 3,
    "explicacion": "La fricción estática actúa como fuerza centrípeta radial hacia el centro de la curva."
  },
  {
    "id": 109,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El ángulo de peralte θ en una curva de radio r diseñada para una rapidez v sin depender de la fricción satisface:",
    "opciones": [
      "A. cos(θ) = g · r / v²",
      "B. tan(θ) = g / (v · r)",
      "C. tan(θ) = v² / (g · r)",
      "D. sin(θ) = v / (g · r)"
    ],
    "correcta": 2,
    "explicacion": "La componente horizontal de la normal proporciona la fuerza centrípeta: N·sin(θ) = mv²/r, N·cos(θ) = mg."
  },
  {
    "id": 110,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza de resistencia de un fluido sobre un cuerpo que se mueve a baja velocidad (régimen laminar) viene dada por:",
    "opciones": [
      "A. La ley de Bernoulli",
      "B. La ley de Stokes (F = 6πηrv)",
      "C. La ley de Hooke",
      "D. El principio de Arquímedes"
    ],
    "correcta": 1,
    "explicacion": "George Stokes dedujo la fuerza viscosa sobre una esfera de radio r en un fluido de viscosidad η."
  },
  {
    "id": 111,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando un paracaidista en caída libre alcanza su velocidad terminal:",
    "opciones": [
      "A. La fuerza de arrastre del aire iguala al peso (fuerza neta = 0)",
      "B. La gravedad se vuelve cero",
      "C. La aceleración es 9.8 m/s²",
      "D. La velocidad se anula"
    ],
    "correcta": 0,
    "explicacion": "Al igualarse peso y resistencia aerodinámica, a = 0 y la velocidad se vuelve constante."
  },
  {
    "id": 112,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un resorte ideal sigue la Ley de Hooke si la fuerza restauradora es:",
    "opciones": [
      "A. F = -k · x²",
      "B. F = k / x",
      "C. F = -k · v",
      "D. F = -k · x"
    ],
    "correcta": 3,
    "explicacion": "Robert Hooke enunció que la deformación elástica es directamente proporcional a la fuerza aplicada."
  },
  {
    "id": 113,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La constante elástica k de un resorte se expresa en unidades SI de:",
    "opciones": [
      "A. J/m",
      "B. kg/s",
      "C. N/m (Newton por metro)",
      "D. N·m"
    ],
    "correcta": 2,
    "explicacion": "F = k·x -> k = F/x = N/m."
  },
  {
    "id": 114,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si dos resortes idénticos de constante k se conectan en paralelo, la constante elástica equivalente es:",
    "opciones": [
      "A. 4k",
      "B. 2k",
      "C. k / 2",
      "D. k"
    ],
    "correcta": 1,
    "explicacion": "En paralelo, ambas fuerzas se suman para el mismo desplazamiento: k_eq = k1 + k2 = 2k."
  },
  {
    "id": 115,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton y Aplicaciones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si dos resortes idénticos de constante k se conectan en serie, la constante elástica equivalente es:",
    "opciones": [
      "A. k / 2",
      "B. 2k",
      "C. k",
      "D. k / 4"
    ],
    "correcta": 0,
    "explicacion": "En serie, la misma fuerza deforma ambos resortes: 1/k_eq = 1/k + 1/k = 2/k -> k_eq = k/2."
  },
  {
    "id": 116,
    "area": "Dinámica y Fuerzas",
    "subtema": "Segunda Ley de Newton Numérica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Sobre un cuerpo de masa m = 3 kg actúa una fuerza horizontal neta de 9 N sobre una superficie sin fricción. ¿Cuál es su aceleración?",
    "opciones": [
      "A. 4.5 m/s²",
      "B. 1.8 m/s²",
      "C. 27 m/s²",
      "D. 3 m/s²"
    ],
    "correcta": 3,
    "explicacion": "Por la Segunda Ley de Newton: a = F / m = 9 N / 3 kg = 3 m/s²."
  },
  {
    "id": 117,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El trabajo mecánico realizado por una fuerza constante F sobre un desplazamiento d formando un ángulo θ es:",
    "opciones": [
      "A. W = F · d · tan(θ)",
      "B. W = F · d · cos(θ)",
      "C. W = F · d · sin(θ)",
      "D. W = F / d"
    ],
    "correcta": 1,
    "explicacion": "El trabajo es el producto escalar del vector fuerza por el vector desplazamiento."
  },
  {
    "id": 118,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si una fuerza es perpendicular al desplazamiento (θ = 90°), el trabajo realizado por esa fuerza es:",
    "opciones": [
      "A. Cero (W = 0)",
      "B. Positivo y máximo",
      "C. Negativo",
      "D. Infinito"
    ],
    "correcta": 0,
    "explicacion": "cos(90°) = 0; las fuerzas perpendiculares a la trayectoria (como la normal o la centrípeta) no realizan trabajo."
  },
  {
    "id": 119,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Realiza trabajo la fuerza centrípeta sobre un satélite en órbita circular?",
    "opciones": [
      "A. Sí, trabajo positivo",
      "B. Sí, trabajo negativo",
      "C. Depende de la masa",
      "D. No, el trabajo es estrictamente cero porque la fuerza es perpendicular a la velocidad"
    ],
    "correcta": 3,
    "explicacion": "Al ser perpendicular a la dirección instantánea del movimiento en todo momento, W = ∫ F·dr = 0."
  },
  {
    "id": 120,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La unidad de trabajo y energía en el Sistema Internacional es:",
    "opciones": [
      "A. El Newton (N)",
      "B. El Pascal (Pa)",
      "C. El Joule (J = N·m)",
      "D. El Watt (W)"
    ],
    "correcta": 2,
    "explicacion": "1 Joule equivale al trabajo realizado por una fuerza de 1 Newton a lo largo de 1 metro."
  },
  {
    "id": 121,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El Teorema del Trabajo y la Energía Cinética establece que el trabajo neto realizado sobre una partícula es igual a:",
    "opciones": [
      "A. El impulso total",
      "B. El cambio en su energía cinética (W_neto = ΔK)",
      "C. La energía potencial final",
      "D. La masa por la velocidad"
    ],
    "correcta": 1,
    "explicacion": "W_neto = K_final - K_inicial = (1/2)m·vf² - (1/2)m·vi²."
  },
  {
    "id": 122,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La energía cinética de un cuerpo de masa m que se mueve con rapidez v es:",
    "opciones": [
      "A. K = (1/2) · m · v²",
      "B. K = m · v",
      "C. K = m · v²",
      "D. K = 2 · m · v²"
    ],
    "correcta": 0,
    "explicacion": "La energía cinética de traslación es la mitad del producto de la masa por el cuadrado de la rapidez."
  },
  {
    "id": 123,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la rapidez de un automóvil se duplica (se multiplica por 2), su energía cinética:",
    "opciones": [
      "A. Se duplica",
      "B. Aumenta 8 veces",
      "C. Permanece igual",
      "D. Se cuadruplica (aumenta 4 veces)"
    ],
    "correcta": 3,
    "explicacion": "Como K es proporcional a v², al duplicar v, la energía cinética se multiplica por 2² = 4."
  },
  {
    "id": 124,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la rapidez de un móvil se triplica, su distancia de frenado bajo la misma fuerza de frenado:",
    "opciones": [
      "A. Se multiplica por 6",
      "B. Permanece igual",
      "C. Se multiplica por 9",
      "D. Se multiplica por 3"
    ],
    "correcta": 2,
    "explicacion": "W = F_frenado · d = ΔK = (1/2)m·v²; si v aumenta por 3, d aumenta por 3² = 9."
  },
  {
    "id": 125,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un bloque de 4 kg se mueve a 5 m/s. ¿Cuál es su energía cinética?",
    "opciones": [
      "A. 10 Joules",
      "B. 50 Joules",
      "C. 20 Joules",
      "D. 100 Joules"
    ],
    "correcta": 1,
    "explicacion": "K = 0.5 · 4 kg · (5 m/s)² = 2 · 25 = 50 J."
  },
  {
    "id": 126,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una fuerza de 30 N empuja un bloque a lo largo de 4 metros en la misma dirección del movimiento. El trabajo es:",
    "opciones": [
      "A. 120 Joules",
      "B. 7.5 Joules",
      "C. 60 Joules",
      "D. 240 Joules"
    ],
    "correcta": 0,
    "explicacion": "W = F · d · cos(0°) = 30 N · 4 m · 1 = 120 J."
  },
  {
    "id": 127,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si se levanta verticalmente una masa de 5 kg a una altura de 2 metros a velocidad constante (g = 9.8 m/s²), el trabajo realizado por la fuerza externa es:",
    "opciones": [
      "A. 10 Joules",
      "B. 49 Joules",
      "C. 196 Joules",
      "D. 98 Joules"
    ],
    "correcta": 3,
    "explicacion": "W = m · g · h = 5 kg · 9.8 m/s² · 2 m = 98 J."
  },
  {
    "id": 128,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El trabajo realizado por la fuerza de gravedad sobre el cuerpo anterior mientras sube es:",
    "opciones": [
      "A. 0 Joules",
      "B. -49 Joules",
      "C. -98 Joules (negativo)",
      "D. +98 Joules"
    ],
    "correcta": 2,
    "explicacion": "La gravedad apunta hacia abajo y el desplazamiento hacia arriba (θ = 180°, cos(180°) = -1)."
  },
  {
    "id": 129,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza de fricción cinética sobre un cuerpo que desliza realiza siempre:",
    "opciones": [
      "A. Trabajo conservativo",
      "B. Trabajo negativo (disipa energía mecánica)",
      "C. Trabajo positivo",
      "D. Trabajo nulo"
    ],
    "correcta": 1,
    "explicacion": "La fricción se opone al movimiento relativo (θ = 180°), por lo que W_friccion = -f_k · d."
  },
  {
    "id": 130,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una fuerza se define como conservativa si:",
    "opciones": [
      "A. El trabajo que realiza entre dos puntos es independiente de la trayectoria seguida",
      "B. Siempre tiene magnitud constante",
      "C. Nunca frena al cuerpo",
      "D. Depende del tiempo"
    ],
    "correcta": 0,
    "explicacion": "Para una fuerza conservativa, el trabajo a lo largo de cualquier trayectoria cerrada es cero: ∮ F·dr = 0."
  },
  {
    "id": 131,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál de las siguientes es una fuerza conservativa?",
    "opciones": [
      "A. La fuerza de fricción cinética",
      "B. La resistencia del aire",
      "C. La fuerza de viscosidad",
      "D. La fuerza gravitatoria"
    ],
    "correcta": 3,
    "explicacion": "La gravedad y la fuerza elástica son conservativas; admiten una función energía potencial."
  },
  {
    "id": 132,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál de las siguientes es una fuerza no conservativa (disipativa)?",
    "opciones": [
      "A. La fuerza elástica de un resorte ideal",
      "B. La fuerza electrostática",
      "C. La fuerza de fricción",
      "D. La fuerza gravitatoria"
    ],
    "correcta": 2,
    "explicacion": "La fricción disipa energía mecánica transformándola en energía térmica irreversible."
  },
  {
    "id": 133,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La energía potencial gravitatoria cerca de la superficie terrestre se define como:",
    "opciones": [
      "A. U = m · v²",
      "B. U = m · g · h",
      "C. U = (1/2) · m · g · h²",
      "D. U = m · g / h"
    ],
    "correcta": 1,
    "explicacion": "U_grav = m·g·h, respecto al nivel de referencia h = 0."
  },
  {
    "id": 134,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La energía potencial elástica almacenada en un resorte deformado una distancia x es:",
    "opciones": [
      "A. U = (1/2) · k · x²",
      "B. U = k · x",
      "C. U = (1/2) · k · x",
      "D. U = 2 · k · x²"
    ],
    "correcta": 0,
    "explicacion": "Integrando la fuerza de Hooke F = k·x desde 0 hasta x se obtiene U = (1/2)k·x²."
  },
  {
    "id": 135,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La ley de conservación de la energía mecánica establece que, en presencia exclusiva de fuerzas conservativas:",
    "opciones": [
      "A. La energía cinética siempre es igual a la potencial",
      "B. La energía cinética se duplica cada segundo",
      "C. El trabajo neto es infinito",
      "D. La energía mecánica total E = K + U permanece constante"
    ],
    "correcta": 3,
    "explicacion": "ΔE = ΔK + ΔU = 0, la energía se transforma entre cinética y potencial sin perderse."
  },
  {
    "id": 136,
    "area": "Trabajo y Energía",
    "subtema": "Teorema del Trabajo y Conservación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Se deja caer una pelota de 2 kg desde 10 m de altura sin fricción (g = 9.8 m/s²). Su energía cinética justo antes de impactar el suelo es:",
    "opciones": [
      "A. 392 Joules",
      "B. 20 Joules",
      "C. 196 Joules",
      "D. 98 Joules"
    ],
    "correcta": 2,
    "explicacion": "Toda la energía potencial inicial se convierte en cinética: K = U = m·g·h = 2 · 9.8 · 10 = 196 J."
  },
  {
    "id": 137,
    "area": "Trabajo y Energía",
    "subtema": "Energía Potencial y Cinética Numérica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la energía potencial gravitatoria de un cuerpo de 2 kg situado a 6 metros de altura sobre el suelo (g = 9.8 m/s²)?",
    "opciones": [
      "A. 236 J",
      "B. 118 J",
      "C. 163 J",
      "D. 88 J"
    ],
    "correcta": 1,
    "explicacion": "U = m · g · h = 2 kg · 9.8 m/s² · 6 m = 118 Joules."
  },
  {
    "id": 138,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El análogo rotacional de la masa en la traslación es:",
    "opciones": [
      "A. El torque",
      "B. La velocidad angular",
      "C. El momento lineal",
      "D. El momento de inercia (I)"
    ],
    "correcta": 3,
    "explicacion": "El momento de inercia I = ∑ m·r² mide la resistencia de un cuerpo rígido a cambiar su velocidad angular."
  },
  {
    "id": 139,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El análogo rotacional de la fuerza es:",
    "opciones": [
      "A. La masa rotacional",
      "B. La potencia",
      "C. El torque o momento de una fuerza (τ = r × F)",
      "D. La aceleración angular"
    ],
    "correcta": 2,
    "explicacion": "El torque neto produce aceleración angular según τ_neto = I · α."
  },
  {
    "id": 140,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de una partícula de masa m a una distancia r del eje de giro es:",
    "opciones": [
      "A. I = 2 · m · r²",
      "B. I = m · r²",
      "C. I = m · r",
      "D. I = (1/2) · m · r²"
    ],
    "correcta": 1,
    "explicacion": "Por definición, el momento de inercia de una masa puntual respecto a un eje es m·r²."
  },
  {
    "id": 141,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Teorema de los Ejes Paralelos (Teorema de Steiner) establece que I =",
    "opciones": [
      "A. I_cm + M · d²",
      "B. I_cm - M · d²",
      "C. I_cm / d²",
      "D. 2 · I_cm + d"
    ],
    "correcta": 0,
    "explicacion": "El momento de inercia respecto a un eje paralelo situado a distancia d del centro de masa es I = I_cm + M·d²."
  },
  {
    "id": 142,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de un cilindro o disco macizo homogéneo de masa M y radio R respecto a su eje central es:",
    "opciones": [
      "A. I = M · R²",
      "B. I = (2/5) · M · R²",
      "C. I = (1/12) · M · R²",
      "D. I = (1/2) · M · R²"
    ],
    "correcta": 3,
    "explicacion": "Integrando la masa distribuida se obtiene I_disco = (1/2) M R²."
  },
  {
    "id": 143,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de una esfera sólida uniforme de masa M y radio R respecto a un eje que pasa por su centro es:",
    "opciones": [
      "A. I = (2/3) · M · R²",
      "B. I = M · R²",
      "C. I = (2/5) · M · R²",
      "D. I = (1/2) · M · R²"
    ],
    "correcta": 2,
    "explicacion": "Para una esfera sólida de densidad uniforme, I = (2/5) M R²."
  },
  {
    "id": 144,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de una esfera hueca de pared delgada (cáscara esférica) es:",
    "opciones": [
      "A. I = M · R²",
      "B. I = (2/3) · M · R²",
      "C. I = (2/5) · M · R²",
      "D. I = (1/2) · M · R²"
    ],
    "correcta": 1,
    "explicacion": "Al estar toda la masa en la superficie a distancia R del centro, I = (2/3) M R²."
  },
  {
    "id": 145,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de una varilla delgada de longitud L y masa M que gira respecto a un eje perpendicular por su centro es:",
    "opciones": [
      "A. I = (1/12) · M · L²",
      "B. I = (1/3) · M · L²",
      "C. I = (1/2) · M · L²",
      "D. I = M · L²"
    ],
    "correcta": 0,
    "explicacion": "Por integración directa: I = ∫_{-L/2}^{L/2} x² (M/L) dx = (1/12) M L²."
  },
  {
    "id": 146,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento de inercia de la misma varilla que gira respecto a un eje por uno de sus extremos es:",
    "opciones": [
      "A. I = (1/12) · M · L²",
      "B. I = (1/4) · M · L²",
      "C. I = (1/2) · M · L²",
      "D. I = (1/3) · M · L²"
    ],
    "correcta": 3,
    "explicacion": "Por Steiner: I = (1/12)ML² + M(L/2)² = (1/12 + 1/4)ML² = (1/3) M L²."
  },
  {
    "id": 147,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La energía cinética total de un cuerpo rígido que rueda sin deslizar es la suma de:",
    "opciones": [
      "A. Solo la energía potencial",
      "B. La energía térmica y la cinética",
      "C. La energía cinética de traslación del CM y la energía cinética de rotación respecto al CM",
      "D. Dos energías de traslación"
    ],
    "correcta": 2,
    "explicacion": "K_total = (1/2) M v_cm² + (1/2) I_cm ω²."
  },
  {
    "id": 148,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si un aro hueco, un disco sólido y una esfera sólida de la misma masa y radio bajan por el mismo plano inclinado, ¿cuál llega primero?",
    "opciones": [
      "A. Llegan exactamente al mismo tiempo",
      "B. La esfera sólida (menor momento de inercia relativo)",
      "C. El disco sólido",
      "D. El aro hueco"
    ],
    "correcta": 1,
    "explicacion": "La esfera (I = 0.4 MR²) destina menos energía a la rotación y más a la traslación, acelerando más rápido."
  },
  {
    "id": 149,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El momento angular L de un cuerpo rígido simétrico que gira con velocidad angular ω respecto a su eje de simetría es:",
    "opciones": [
      "A. L = I · ω",
      "B. L = I / ω",
      "C. L = I · α",
      "D. L = (1/2) I · ω²"
    ],
    "correcta": 0,
    "explicacion": "L = I·ω es el análogo rotacional de p = m·v."
  },
  {
    "id": 150,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si no actúan torques externos netos sobre un sistema (∑τ_ext = 0), se cumple que:",
    "opciones": [
      "A. La velocidad angular nunca puede cambiar",
      "B. El momento de inercia se vuelve cero",
      "C. La energía cinética se duplica",
      "D. El momento angular total del sistema se conserva (L = constante)"
    ],
    "correcta": 3,
    "explicacion": "El principio de conservación del momento angular: dL/dt = ∑τ_ext = 0."
  },
  {
    "id": 151,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Una patinadora sobre hielo que gira con los brazos extendidos cierra sus brazos hacia el cuerpo. ¿Qué ocurre?",
    "opciones": [
      "A. Su momento de inercia aumenta",
      "B. Su momento angular disminuye",
      "C. Su velocidad angular ω aumenta porque su momento de inercia I disminuye",
      "D. Su velocidad angular disminuye"
    ],
    "correcta": 2,
    "explicacion": "Como L = I·ω = constante, al reducir I acercando la masa al eje, ω debe aumentar."
  },
  {
    "id": 152,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Un giróscopo o peonza en rotación rápida no se cae debido a:",
    "opciones": [
      "A. La fricción con el aire",
      "B. El fenómeno de precesión giroscópica por conservación del momento angular",
      "C. La ausencia de gravedad",
      "D. La fuerza de Coriolis inversa"
    ],
    "correcta": 1,
    "explicacion": "El torque de la gravedad cambia la dirección del momento angular L perpendicularmente, produciendo precesión en lugar de caída."
  },
  {
    "id": 153,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Primera Ley de Kepler de las órbitas planetarias establece que:",
    "opciones": [
      "A. Los planetas se mueven en elipses con el Sol en uno de los focos",
      "B. Las órbitas son círculos perfectos con el Sol en el centro",
      "C. Las órbitas son parábolas abiertas",
      "D. Los planetas viajan a velocidad constante"
    ],
    "correcta": 0,
    "explicacion": "Johannes Kepler descubrió en 1609 que las órbitas planetarias son elípticas."
  },
  {
    "id": 154,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Segunda Ley de Kepler (Ley de las Áreas) es una consecuencia directa de:",
    "opciones": [
      "A. La conservación de la carga eléctrica",
      "B. La primera ley de la termodinámica",
      "C. La relatividad general",
      "D. La conservación del momento angular bajo una fuerza central (la gravedad)"
    ],
    "correcta": 3,
    "explicacion": "Como la fuerza gravitacional apunta al Sol, el torque es cero (r × F = 0), por lo que L = cte y dA/dt = L/(2m) = cte."
  },
  {
    "id": 155,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Según la Segunda Ley de Kepler, cuando un planeta está en su perihelio (más cerca del Sol):",
    "opciones": [
      "A. Su aceleración es cero",
      "B. La gravedad del Sol se anula",
      "C. Su velocidad orbital es máxima",
      "D. Su velocidad orbital es mínima"
    ],
    "correcta": 2,
    "explicacion": "Al barrer áreas iguales en tiempos iguales, a menor distancia r se requiere mayor velocidad."
  },
  {
    "id": 156,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Tercera Ley de Kepler establece que el cuadrado del periodo orbital T² es proporcional a:",
    "opciones": [
      "A. El inverso de la masa solar",
      "B. El cubo del semieje mayor de la órbita (a³)",
      "C. El cuadrado del semieje mayor (a²)",
      "D. La raíz cuadrada de la distancia"
    ],
    "correcta": 1,
    "explicacion": "T² = (4π² / (G M_sol)) · a³."
  },
  {
    "id": 157,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Gravitación Universal formulada por Isaac Newton establece que:",
    "opciones": [
      "A. F = G · (m1 · m2) / r²",
      "B. F = G · (m1 + m2) / r",
      "C. F = G · m1 · m2 / r³",
      "D. F = m · g · r²"
    ],
    "correcta": 0,
    "explicacion": "La fuerza de atracción gravitatoria es directamente proporcional al producto de las masas e inversamente proporcional al cuadrado de la distancia."
  },
  {
    "id": 158,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La constante de gravitación universal G fue medida por primera vez en laboratorio por:",
    "opciones": [
      "A. Isaac Newton",
      "B. Galileo Galilei",
      "C. Johannes Kepler",
      "D. Henry Cavendish (con balanza de torsión en 1798)"
    ],
    "correcta": 3,
    "explicacion": "Cavendish midió la débil atracción entre esferas de plomo y determinó la masa de la Tierra."
  },
  {
    "id": 159,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La energía potencial gravitatoria entre dos masas puntuales M y m separadas una distancia r es:",
    "opciones": [
      "A. U(r) = - G · M · m / r²",
      "B. U(r) = G · M / r",
      "C. U(r) = - G · M · m / r",
      "D. U(r) = + G · M · m / r²"
    ],
    "correcta": 2,
    "explicacion": "Tomando el cero de energía potencial en el infinito (r -> ∞), U es siempre negativa en estados ligados."
  },
  {
    "id": 160,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La velocidad de escape desde la superficie de un planeta de masa M y radio R es:",
    "opciones": [
      "A. v_esc = √(G M / (2R))",
      "B. v_esc = √(2 G M / R)",
      "C. v_esc = √(G M / R)",
      "D. v_esc = 2 G M / R"
    ],
    "correcta": 1,
    "explicacion": "Se obtiene igualando la energía mecánica total a cero: (1/2)m·v_esc² - G M m / R = 0."
  },
  {
    "id": 161,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el valor aproximado de la velocidad de escape de la Tierra?",
    "opciones": [
      "A. Aproximadamente 11.2 km/s",
      "B. 7.9 km/s",
      "C. 29.8 km/s",
      "D. 3.0 km/s"
    ],
    "correcta": 0,
    "explicacion": "Cualquier proyectil requiere al menos 11.2 km/s (~40,320 km/h) para escapar del campo gravitacional terrestre sin propulsión adicional."
  },
  {
    "id": 162,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La velocidad orbital de un satélite en órbita circular baja alrededor de la Tierra (primera velocidad cósmica) es:",
    "opciones": [
      "A. 11.2 km/s",
      "B. 3.0 km/s",
      "C. 29.8 km/s",
      "D. Aproximadamente 7.9 km/s"
    ],
    "correcta": 3,
    "explicacion": "v_orb = √(G M / R_tierra) ≈ 7.9 km/s (~28,000 km/h)."
  },
  {
    "id": 163,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Un satélite geoestacionario permanece sobre el mismo punto de la superficie terrestre porque:",
    "opciones": [
      "A. Viaja a la velocidad de la luz",
      "B. Está ubicado en los polos",
      "C. Su periodo orbital es exactamente igual al periodo de rotación de la Tierra (24 horas)",
      "D. No experimenta gravedad terrestre"
    ],
    "correcta": 2,
    "explicacion": "Situado sobre el ecuador a ~35,786 km de altitud, su periodo de 24 horas coincide con la rotación terrestre."
  },
  {
    "id": 164,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Los puntos de Lagrange en un sistema de dos cuerpos masivos en órbita (como Sol-Tierra) son:",
    "opciones": [
      "A. 7 órbitas elípticas",
      "B. 5 puntos donde las fuerzas gravitatorias y centrífugas se equilibran exactamente",
      "C. 3 puntos de máxima gravedad",
      "D. 2 puntos donde no hay luz solar"
    ],
    "correcta": 1,
    "explicacion": "Joseph-Louis Lagrange descubrió los puntos L1 a L5; L2 alberga hoy al telescopio espacial James Webb."
  },
  {
    "id": 165,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué es el radio de Schwarzschild de un cuerpo de masa M?",
    "opciones": [
      "A. El radio del horizonte de sucesos de un agujero negro no rotante (Rs = 2GM/c²)",
      "B. El radio de la órbita de Mercurio",
      "C. El radio nuclear del uranio",
      "D. El radio de la Vía Láctea"
    ],
    "correcta": 0,
    "explicacion": "Si una masa M se comprime dentro de Rs = 2GM/c², la velocidad de escape iguala a la de la luz c."
  },
  {
    "id": 166,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál sería aproximadamente el radio de Schwarzschild si la Tierra se comprimiera en un agujero negro?",
    "opciones": [
      "A. 9 kilómetros",
      "B. 9 metros",
      "C. 0.9 centímetros",
      "D. Aproximadamente 9 milímetros (como una canica)"
    ],
    "correcta": 3,
    "explicacion": "Rs = 2(6.67×10^-11)(5.97×10^24)/(3×10^8)² ≈ 8.87 × 10^-3 m ≈ 9 mm."
  },
  {
    "id": 167,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Rotacional y Celeste",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza de marea que ejerce la Luna sobre los océanos terrestres se debe a:",
    "opciones": [
      "A. El campo magnético lunar",
      "B. El viento solar",
      "C. La diferencia de atracción gravitatoria lunar entre el lado cercano y el lado lejano de la Tierra",
      "D. El calor de la Luna"
    ],
    "correcta": 2,
    "explicacion": "Al decaer la gravedad con 1/r², el lado de la Tierra orientado hacia la Luna experimenta mayor atracción que el centro y el lado opuesto."
  },
  {
    "id": 168,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La presión hidrostática a una profundidad h en un líquido incompresible de densidad ρ es:",
    "opciones": [
      "A. P = ρ · v² / 2",
      "B. P = P0 + ρ · g · h",
      "C. P = ρ · g / h",
      "D. P = P0 · h / ρ"
    ],
    "correcta": 1,
    "explicacion": "El peso de la columna de fluido ejerce una presión adicional proporcional a la profundidad."
  },
  {
    "id": 169,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Principio de Pascal establece que:",
    "opciones": [
      "A. La presión aplicada a un fluido incompresible encerrado se transmite íntegramente a todas las paredes",
      "B. Los cuerpos sumergidos pierden masa",
      "C. La velocidad del fluido es constante",
      "D. La temperatura aumenta con la presión"
    ],
    "correcta": 0,
    "explicacion": "Blaise Pascal demostró que ΔP se propaga uniformemente en todas direcciones."
  },
  {
    "id": 170,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En una prensa hidráulica con pistones de áreas A1 y A2 (A2 > A1), la fuerza de salida F2 es:",
    "opciones": [
      "A. F2 = F1 · (A1 / A2)",
      "B. F2 = F1",
      "C. F2 = F1 · (A2 - A1)",
      "D. F2 = F1 · (A2 / A1)"
    ],
    "correcta": 3,
    "explicacion": "Por el principio de Pascal: P1 = P2 -> F1/A1 = F2/A2 -> F2 = F1(A2/A1). Multiplica la fuerza."
  },
  {
    "id": 171,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Principio de Arquímedes afirma que todo cuerpo total o parcialmente sumergido en un fluido experimenta:",
    "opciones": [
      "A. Una pérdida real de masa",
      "B. Un empuje hacia abajo igual a su volumen",
      "C. Un empuje vertical hacia arriba igual al peso del fluido desalojado",
      "D. Un empuje horizontal"
    ],
    "correcta": 2,
    "explicacion": "E = ρ_fluido · V_sumergido · g."
  },
  {
    "id": 172,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Un objeto flota en equilibrio sobre un líquido si:",
    "opciones": [
      "A. La temperatura es 100 °C",
      "B. La densidad promedio del objeto es menor que la del líquido (ρ_obj < ρ_liq)",
      "C. El peso del objeto es mayor que el empuje",
      "D. El volumen del objeto es cero"
    ],
    "correcta": 1,
    "explicacion": "Para flotar, el empuje iguala al peso cuando solo una fracción del volumen está sumergida: V_sum/V_total = ρ_obj/ρ_liq."
  },
  {
    "id": 173,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Un cubo de hielo de masa 100 g flota en un vaso con agua hasta el borde. Cuando el hielo se derrite completamente:",
    "opciones": [
      "A. El nivel del agua permanece exactamente igual",
      "B. El agua se desborda",
      "C. El nivel del agua desciende",
      "D. El agua se evapora"
    ],
    "correcta": 0,
    "explicacion": "El hielo flotante ya desalojaba exactamente 100 g de agua líquida; al derretirse ocupa el mismo volumen."
  },
  {
    "id": 174,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La presión atmosférica estándar al nivel del mar (1 atm) equivale aproximadamente a:",
    "opciones": [
      "A. 1,000 Pa",
      "B. 10,000 Pa",
      "C. 1,000,000 Pa",
      "D. 101,325 Pa (~101.3 kPa o 1.013 bar)"
    ],
    "correcta": 3,
    "explicacion": "Corresponde al peso de la atmósfera sobre un metro cuadrado, equivalente a 760 mmHg en el barómetro de Torricelli."
  },
  {
    "id": 175,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el barómetro de mercurio de Evangelista Torricelli mide una columna de ~760 mm al nivel del mar?",
    "opciones": [
      "A. Porque el tubo tiene un vacío imperfecto",
      "B. Por capilaridad",
      "C. Porque la presión atmosférica equilibra exactamente el peso de esa columna de mercurio",
      "D. Porque el mercurio se expande con el calor"
    ],
    "correcta": 2,
    "explicacion": "Patm = ρ_Hg · g · h; con ρ_Hg ≈ 13,600 kg/m³, h ≈ 0.76 m = 760 mm."
  },
  {
    "id": 176,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si se construyera un barómetro usando agua (ρ = 1000 kg/m³) en lugar de mercurio, la altura de la columna sería:",
    "opciones": [
      "A. 32 metros",
      "B. Aproximadamente 10.33 metros",
      "C. 760 milímetros",
      "D. 1 metro"
    ],
    "correcta": 1,
    "explicacion": "h = Patm / (ρ·g) = 101325 / (1000 · 9.8) ≈ 10.33 m."
  },
  {
    "id": 177,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Ecuación de Continuidad para un fluido incompresible en régimen estacionario (A1·v1 = A2·v2) representa:",
    "opciones": [
      "A. La conservación de la masa del fluido",
      "B. La conservación de la energía cinética",
      "C. La conservación del momento angular",
      "D. La ley de Hooke"
    ],
    "correcta": 0,
    "explicacion": "La masa que entra por unidad de tiempo debe ser igual a la masa que sale: caudal volumétrico Q = A·v = constante."
  },
  {
    "id": 178,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si una manguera de jardín se reduce a la mitad de su área en la boquilla (A2 = A1 / 2), la velocidad del agua:",
    "opciones": [
      "A. Se reduce a la mitad",
      "B. Se cuadruplica",
      "C. Permanece igual",
      "D. Se duplica (v2 = 2 · v1)"
    ],
    "correcta": 3,
    "explicacion": "Por continuidad: A1·v1 = (A1/2)·v2 -> v2 = 2·v1."
  },
  {
    "id": 179,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Principio de Bernoulli (P + (1/2)ρv² + ρgy = constante) es una expresión de:",
    "opciones": [
      "A. La segunda ley de Newton para gases",
      "B. La ley cero de la termodinámica",
      "C. La conservación de la energía mecánica en fluidos ideales sin viscosidad",
      "D. La conservación de la masa"
    ],
    "correcta": 2,
    "explicacion": "Daniel Bernoulli aplicó el teorema trabajo-energía a una línea de corriente en 1738."
  },
  {
    "id": 180,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Según el Principio de Bernoulli, en una tubería horizontal, en la región donde la velocidad del fluido aumenta:",
    "opciones": [
      "A. La temperatura se duplica",
      "B. La presión estática del fluido disminuye",
      "C. La presión estática aumenta",
      "D. La densidad aumenta"
    ],
    "correcta": 1,
    "explicacion": "A mayor velocidad v, el término (1/2)ρv² crece, por lo que P debe disminuir para mantener constante la suma."
  },
  {
    "id": 181,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El efecto Venturi consiste en que al estrecharse un conducto:",
    "opciones": [
      "A. La velocidad del fluido aumenta y la presión disminuye",
      "B. La velocidad disminuye y la presión aumenta",
      "C. Ambas magnitudes aumentan",
      "D. El fluido se solidifica"
    ],
    "correcta": 0,
    "explicacion": "Se utiliza en carburadores, atomizadores, trompas de vacío y tubos Venturi para medir caudal."
  },
  {
    "id": 182,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La sustentación de un ala de avión (perfil aerodinámico) se explica en parte porque el aire sobre la superficie superior:",
    "opciones": [
      "A. Viaja más lento, aumentando la presión",
      "B. Tiene mayor densidad",
      "C. Se calienta",
      "D. Viaja más rápido, generando una presión menor que en la superficie inferior"
    ],
    "correcta": 3,
    "explicacion": "La menor presión arriba que abajo produce una fuerza neta ascendente (sustentación)."
  },
  {
    "id": 183,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Teorema de Torricelli establece que la rapidez de salida de un líquido por un orificio a profundidad h bajo la superficie libre es:",
    "opciones": [
      "A. v = g · h²",
      "B. v = √(g · h)",
      "C. v = √(2 · g · h)",
      "D. v = 2 · g · h"
    ],
    "correcta": 2,
    "explicacion": "Es equivalente a la velocidad de un objeto en caída libre desde la misma altura h."
  },
  {
    "id": 184,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La viscosidad de un fluido es una medida de:",
    "opciones": [
      "A. Su tensión superficial",
      "B. Su fricción interna o resistencia a deformarse por esfuerzos cortantes",
      "C. Su densidad de masa",
      "D. Su compresibilidad térmica"
    ],
    "correcta": 1,
    "explicacion": "Los fluidos de alta viscosidad (como la miel o el aceite de motor) oponen gran resistencia al flujo."
  },
  {
    "id": 185,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Poiseuille indica que el caudal Q de un fluido viscoso laminar en un tubo cilíndrico depende del radio R como:",
    "opciones": [
      "A. Q es proporcional a R⁴ (al radio a la cuarta potencia)",
      "B. Q es proporcional a R²",
      "C. Q es proporcional a R",
      "D. Q es proporcional a R³"
    ],
    "correcta": 0,
    "explicacion": "Si el radio de una arteria se reduce a la mitad por obstrucción, el flujo sanguíneo cae a (1/2)⁴ = 1/16 parte."
  },
  {
    "id": 186,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La tensión superficial de un líquido se debe a:",
    "opciones": [
      "A. La gravedad",
      "B. La presión atmosférica externa",
      "C. La evaporación",
      "D. Las fuerzas de cohesión intermoleculares desbalanceadas en la interfaz líquido-gas"
    ],
    "correcta": 3,
    "explicacion": "Las moléculas de la superficie experimentan una atracción neta hacia el interior del líquido, comportándose como una membrana elástica."
  },
  {
    "id": 187,
    "area": "Mecánica de Fluidos",
    "subtema": "Hidrostática e Hidrodinámica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El fenómeno por el cual un líquido asciende espontáneamente por un tubo muy estrecho se llama:",
    "opciones": [
      "A. Efecto Venturi",
      "B. Turbulencia",
      "C. Capilaridad",
      "D. Viscosidad"
    ],
    "correcta": 2,
    "explicacion": "La capilaridad ocurre por competencia entre fuerzas de adhesión con el tubo y cohesión del líquido (ley de Jurin)."
  },
  {
    "id": 188,
    "area": "Mecánica de Fluidos",
    "subtema": "Presión Hidrostática Numérica",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la presión manométrica (hidrostática) del agua a 2 metros de profundidad en un lago (ρ = 1000 kg/m³, g = 9.8 m/s²)?",
    "opciones": [
      "A. 40 kPa",
      "B. 20 kPa",
      "C. 70 kPa",
      "D. -15 kPa"
    ],
    "correcta": 1,
    "explicacion": "P = ρ · g · h = 1000 kg/m³ · 9.8 m/s² · 2 m = 20000 Pa = 20 kPa."
  },
  {
    "id": 189,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La condición cinemática definitoria del Movimiento Armónico Simple (MAS) es que la aceleración:",
    "opciones": [
      "A. Es constante",
      "B. Es nula",
      "C. Es proporcional al cuadrado de la velocidad",
      "D. Es proporcional y de sentido opuesto al desplazamiento (a = -ω² x)"
    ],
    "correcta": 3,
    "explicacion": "La fuerza restauradora lineal (F = -kx) produce aceleración a = -(k/m)x = -ω²x."
  },
  {
    "id": 190,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En un oscilador masa-resorte horizontal ideal, la frecuencia angular ω es:",
    "opciones": [
      "A. ω = 2π k / m",
      "B. ω = k · m",
      "C. ω = √(k / m)",
      "D. ω = √(m / k)"
    ],
    "correcta": 2,
    "explicacion": "De a = -ω²x y F = -kx = ma se desprende ω = √(k/m)."
  },
  {
    "id": 191,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El periodo T de un oscilador masa-resorte es:",
    "opciones": [
      "A. T = 2π m k",
      "B. T = 2π · √(m / k)",
      "C. T = 2π · √(k / m)",
      "D. T = (1/2π) · √(m / k)"
    ],
    "correcta": 1,
    "explicacion": "Como T = 2π/ω, invirtiendo ω = √(k/m) se tiene T = 2π√(m/k)."
  },
  {
    "id": 192,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si la masa m unida a un resorte se cuadruplica (se multiplica por 4), su periodo T:",
    "opciones": [
      "A. Se duplica (aumenta al doble)",
      "B. Se cuadruplica",
      "C. Se reduce a la mitad",
      "D. Permanece igual"
    ],
    "correcta": 0,
    "explicacion": "T es proporcional a √m; √(4m) = 2√m."
  },
  {
    "id": 193,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El periodo de un péndulo simple para pequeñas oscilaciones (θ < 15°) depende exclusivamente de:",
    "opciones": [
      "A. La masa de la lenteja",
      "B. La amplitud de oscilación",
      "C. El color de la cuerda",
      "D. La longitud de la cuerda L y la aceleración gravitacional g (T = 2π√(L/g))"
    ],
    "correcta": 3,
    "explicacion": "Galileo Galilei descubrió el isocronismo del péndulo: el periodo no depende de la masa ni de la amplitud."
  },
  {
    "id": 194,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si se lleva un reloj de péndulo a la Luna (g_luna ≈ g_tierra / 6), el reloj:",
    "opciones": [
      "A. Funciona a la misma velocidad",
      "B. Se detiene",
      "C. Se atrasa (su periodo se hace más largo: T aumenta)",
      "D. Se adelanta"
    ],
    "correcta": 2,
    "explicacion": "Como T = 2π√(L/g), al ser g menor, T es mayor (las oscilaciones son más lentas)."
  },
  {
    "id": 195,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Para duplicar el periodo de un péndulo simple en la Tierra, su longitud L debe:",
    "opciones": [
      "A. Multiplicarse por 8",
      "B. Multiplicarse por 4 (cuadruplicarse)",
      "C. Multiplicarse por 2",
      "D. Dividirse entre 2"
    ],
    "correcta": 1,
    "explicacion": "Como T ∝ √L, para duplicar T se necesita L' = 4L."
  },
  {
    "id": 196,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En el punto de máxima amplitud en un MAS (x = ±A):",
    "opciones": [
      "A. La velocidad es cero y la aceleración es máxima",
      "B. La velocidad es máxima y la aceleración es cero",
      "C. Ambas magnitudes son máximas",
      "D. Ambas son cero"
    ],
    "correcta": 0,
    "explicacion": "En los extremos el móvil se detiene para invertir el sentido (v = 0) y la fuerza restauradora es máxima (|a| = ω²A)."
  },
  {
    "id": 197,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Al pasar por la posición de equilibrio en un MAS (x = 0):",
    "opciones": [
      "A. La velocidad es cero y la aceleración es máxima",
      "B. Ambas magnitudes son cero",
      "C. La energía potencial es máxima",
      "D. La velocidad es máxima y la aceleración es cero"
    ],
    "correcta": 3,
    "explicacion": "En x = 0 no hay fuerza neta restauradora (a = 0) y toda la energía es cinética (v_max = ωA)."
  },
  {
    "id": 198,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La energía mecánica total en un sistema masa-resorte en MAS es:",
    "opciones": [
      "A. E = k · A",
      "B. E = m · g · A",
      "C. E = (1/2) · k · A²",
      "D. E = (1/2) · k · x²"
    ],
    "correcta": 2,
    "explicacion": "La energía total es constante y proporcional al cuadrado de la amplitud A."
  },
  {
    "id": 199,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El fenómeno por el cual un sistema oscilatorio responde con máxima amplitud cuando la frecuencia impulsora externa iguala a su frecuencia natural se llama:",
    "opciones": [
      "A. Amortiguamiento crítico",
      "B. Resonancia",
      "C. Efecto Doppler",
      "D. Interferencia destructiva"
    ],
    "correcta": 1,
    "explicacion": "En resonancia, la transferencia de energía al oscilador es óptima, como en el colapso del puente de Tacoma Narrows o en una copa rota por sonido."
  },
  {
    "id": 200,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En una onda mecánica transversal, las partículas del medio oscilan en dirección:",
    "opciones": [
      "A. Perpendicular a la dirección de propagación de la onda",
      "B. Paralela a la propagación",
      "C. Circular estacionaria",
      "D. En sentido opuesto"
    ],
    "correcta": 0,
    "explicacion": "En ondas transversales (como en una cuerda de guitarra o las ondas S sísmicas), el desplazamiento es ortogonal a la velocidad de onda."
  },
  {
    "id": 201,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En una onda mecánica longitudinal (como el sonido en el aire), las partículas oscilan en dirección:",
    "opciones": [
      "A. Perpendicular a la propagación",
      "B. Aleatoria browniana",
      "C. Radial",
      "D. Paralela a la dirección de propagación de la onda"
    ],
    "correcta": 3,
    "explicacion": "Las ondas longitudinales avanzan mediante compresiones y rarefacciones en la misma línea de propagación."
  },
  {
    "id": 202,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La relación fundamental de las ondas periódicas entre velocidad v, longitud de onda λ y frecuencia f es:",
    "opciones": [
      "A. v = f / λ",
      "B. v = λ · T",
      "C. v = λ · f",
      "D. v = λ / f"
    ],
    "correcta": 2,
    "explicacion": "La distancia recorrida en un periodo es una longitud de onda: v = λ/T = λ·f."
  },
  {
    "id": 203,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La velocidad de propagación de una onda transversal en una cuerda tensa de densidad lineal μ bajo tensión T es:",
    "opciones": [
      "A. v = T / μ²",
      "B. v = √(T / μ)",
      "C. v = √(μ / T)",
      "D. v = T · μ"
    ],
    "correcta": 1,
    "explicacion": "A mayor tensión T la onda viaja más rápido; a mayor masa por unidad de longitud μ, viaja más lento."
  },
  {
    "id": 204,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El principio de superposición para ondas lineales establece que:",
    "opciones": [
      "A. La perturbación resultante en cualquier punto es la suma algebraica de las perturbaciones individuales",
      "B. Las ondas rebotan una contra otra sin cruzarse",
      "C. La frecuencia se multiplica",
      "D. La energía se destruye"
    ],
    "correcta": 0,
    "explicacion": "Al cruzarse dos ondas, sus desplazamientos se suman vectorialmente y continúan inalteradas tras el cruce."
  },
  {
    "id": 205,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En una onda estacionaria, los puntos del medio que nunca oscilan (amplitud permanentemente cero) se denominan:",
    "opciones": [
      "A. Antinodos (vientres)",
      "B. Crestas",
      "C. Valles",
      "D. Nodos"
    ],
    "correcta": 3,
    "explicacion": "Los nodos se producen por interferencia destructiva continua entre la onda incidente y la reflejada."
  },
  {
    "id": 206,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La distancia entre dos nodos consecutivos en una onda estacionaria equivale a:",
    "opciones": [
      "A. Un cuarto de longitud de onda (λ / 4)",
      "B. Dos longitudes de onda (2λ)",
      "C. Media longitud de onda (λ / 2)",
      "D. Una longitud de onda (λ)"
    ],
    "correcta": 2,
    "explicacion": "Un ciclo completo de onda contiene dos nodos y dos antinodos; la separación nodo-nodo es λ/2."
  },
  {
    "id": 207,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Efecto Doppler describe el cambio aparente en la frecuencia de una onda percibida por un observador debido a:",
    "opciones": [
      "A. El cambio de medio",
      "B. El movimiento relativo entre la fuente emisora y el observador",
      "C. La atenuación con la distancia",
      "D. La temperatura del medio"
    ],
    "correcta": 1,
    "explicacion": "Christian Doppler explicó en 1842 que la frecuencia aumenta si la fuente y el observador se acercan y disminuye si se alejan."
  },
  {
    "id": 208,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Cuando una ambulancia con sirena encendida se acerca a un observador en reposo:",
    "opciones": [
      "A. El tono percibido es más agudo (mayor frecuencia)",
      "B. El tono percibido es más grave (menor frecuencia)",
      "C. La frecuencia no cambia",
      "D. La velocidad del sonido se triplica"
    ],
    "correcta": 0,
    "explicacion": "Al acercarse, las crestas de onda se comprimen espacialmente frente a la fuente, reduciendo la longitud de onda aparente y aumentando la frecuencia."
  },
  {
    "id": 209,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El corrimiento hacia el rojo (redshift) en la luz de galaxias lejanas es una manifestación Doppler/cosmológica que demuestra que:",
    "opciones": [
      "A. Las galaxias se están enfriando",
      "B. La luz pierde masa en el camino",
      "C. El universo es estático",
      "D. El universo se encuentra en expansión (las galaxias se alejan de nosotros)"
    ],
    "correcta": 3,
    "explicacion": "Edwin Hubble descubrió en 1929 que la luz emitida por galaxias distantes se desplaza hacia longitudes de onda mayores (rojas)."
  },
  {
    "id": 210,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ocurre cuando la velocidad de un objeto supera la velocidad del sonido en ese medio (v > v_sonido)?",
    "opciones": [
      "A. El objeto se desintegra por fricción",
      "B. La frecuencia del sonido se vuelve negativa",
      "C. Se produce una onda de choque cónica (cono de Mach) y una estampida sónica",
      "D. El sonido no puede ser emitido"
    ],
    "correcta": 2,
    "explicacion": "Ernst Mach demostró que los frentes de onda esféricos se superponen formando una superficie de choque con ángulo sin(θ) = 1/M."
  },
  {
    "id": 211,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El número de Mach se define como:",
    "opciones": [
      "A. La fuerza aerodinámica",
      "B. La relación entre la velocidad del objeto y la velocidad del sonido en el medio (M = v / c_s)",
      "C. La densidad del aire",
      "D. La presión sonora"
    ],
    "correcta": 1,
    "explicacion": "M = 1 es sónico; M > 1 es supersónico; M > 5 es hipersónico."
  },
  {
    "id": 212,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El rango de frecuencias audibles para el oído humano promedio es de aproximadamente:",
    "opciones": [
      "A. 20 Hz a 20,000 Hz (20 kHz)",
      "B. 1 Hz a 100 Hz",
      "C. 20 kHz a 2 MHz",
      "D. 500 Hz a 5,000 Hz"
    ],
    "correcta": 0,
    "explicacion": "Frecuencias por debajo de 20 Hz son infrasonidos; por encima de 20 kHz son ultrasonidos."
  },
  {
    "id": 213,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El nivel de intensidad sonora en decibeles (dB) se define como:",
    "opciones": [
      "A. β = I / I0",
      "B. β = 20 · (I - I0)",
      "C. β = ln(I / I0)",
      "D. β = 10 · log10(I / I0)"
    ],
    "correcta": 3,
    "explicacion": "Donde I0 = 10^-12 W/m² es el umbral de audición humano a 1000 Hz."
  },
  {
    "id": 214,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si la intensidad física de un sonido se multiplica por 10 (ej: 10 fuentes en lugar de una), el nivel sonoro en dB:",
    "opciones": [
      "A. Aumenta en 1 dB",
      "B. Aumenta en 100 dB",
      "C. Aumenta en 10 dB",
      "D. Se duplica"
    ],
    "correcta": 2,
    "explicacion": "Como β = 10·log10(10·I / I0) = 10·(log10(I/I0) + 1) = β_original + 10 dB."
  },
  {
    "id": 215,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si la intensidad física de un sonido se multiplica por 100, el nivel sonoro aumenta en:",
    "opciones": [
      "A. 50 dB",
      "B. 20 dB",
      "C. 2 dB",
      "D. 200 dB"
    ],
    "correcta": 1,
    "explicacion": "10 · log10(100) = 10 · 2 = 20 dB."
  },
  {
    "id": 216,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El timbre de un instrumento musical permite distinguirlo de otro tocando la misma nota debido a:",
    "opciones": [
      "A. El contenido de armónicos superiores y la envolvente espectral de la onda",
      "B. La velocidad del sonido",
      "C. La amplitud fundamental únicamente",
      "D. La afinación en hercios"
    ],
    "correcta": 0,
    "explicacion": "Un violín y un piano a 440 Hz suenan distintos porque difieren en las amplitudes relativas de sus armónicos 2f, 3f, 4f..."
  },
  {
    "id": 217,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La difracción de una onda es más pronunciada cuando el tamaño de la rendija u obstáculo es:",
    "opciones": [
      "A. Mucho mayor que la longitud de onda (d >> λ)",
      "B. Cero",
      "C. Infinito",
      "D. Del mismo orden de magnitud que la longitud de onda (d ≈ λ)"
    ],
    "correcta": 3,
    "explicacion": "Cuando el obstáculo es comparable a λ, la onda se curva notablemente alrededor de los bordes."
  },
  {
    "id": 218,
    "area": "Oscilaciones y Ondas",
    "subtema": "MAS, Acústica y Efecto Doppler",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Dos ondas sonoras de frecuencias muy cercanas (ej: 440 Hz y 444 Hz) producen el fenómeno de:",
    "opciones": [
      "A. Silencio absoluto",
      "B. Ultrasonido",
      "C. Pulsaciones o batidos con frecuencia f_batido = |f1 - f2| = 4 Hz",
      "D. Resonancia infinita"
    ],
    "correcta": 2,
    "explicacion": "La superposición periódica de interferencia constructiva y destructiva genera modulaciones de amplitud a frecuencia f1 - f2."
  },
  {
    "id": 219,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Ley Cero de la Termodinámica establece que si dos cuerpos A y B están en equilibrio térmico con un tercero C:",
    "opciones": [
      "A. La entropía disminuye",
      "B. A y B están en equilibrio térmico entre sí (misma temperatura)",
      "C. A y B intercambian calor neto",
      "D. La energía interna de C es nula"
    ],
    "correcta": 1,
    "explicacion": "La ley cero fundamenta el concepto de temperatura y el funcionamiento de los termómetros."
  },
  {
    "id": 220,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La temperatura del cero absoluto en la escala Celsius corresponde exactamente a:",
    "opciones": [
      "A. -273.15 °C (0 Kelvin)",
      "B. -100 °C",
      "C. -459.67 °C",
      "D. 0 °C"
    ],
    "correcta": 0,
    "explicacion": "A 0 K la energía cinética traslacional clásica de los átomos se reduce a su mínimo valor cuántico de punto cero."
  },
  {
    "id": 221,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La ecuación de estado de un gas ideal es:",
    "opciones": [
      "A. P · T = n · R · V",
      "B. P · V = n · R / T",
      "C. P / V = n · R · T",
      "D. P · V = n · R · T"
    ],
    "correcta": 3,
    "explicacion": "Relaciona presión P, volumen V, número de moles n, constante universal R = 8.314 J/(mol·K) y temperatura absoluta T."
  },
  {
    "id": 222,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Primera Ley de la Termodinámica es una formulación de:",
    "opciones": [
      "A. La inevitabilidad de la fricción",
      "B. La ley de Boyle",
      "C. La conservación de la energía (ΔU = Q - W)",
      "D. La conservación de la masa"
    ],
    "correcta": 2,
    "explicacion": "El cambio de energía interna de un sistema es igual al calor absorbido menos el trabajo realizado por el sistema."
  },
  {
    "id": 223,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En un proceso isotérmico (temperatura constante T = cte) para un gas ideal, se cumple que:",
    "opciones": [
      "A. El volumen nunca cambia",
      "B. El cambio de energía interna es cero (ΔU = 0) y Q = W",
      "C. El trabajo realizado es cero",
      "D. La presión permanece constante"
    ],
    "correcta": 1,
    "explicacion": "Para un gas ideal la energía interna solo depende de la temperatura: si ΔT = 0, ΔU = 0."
  },
  {
    "id": 224,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En un proceso isocórico o isovolumétrico (volumen constante V = cte), el trabajo realizado es:",
    "opciones": [
      "A. W = 0 (no hay trabajo mecánico de expansión)",
      "B. W = P · ΔV",
      "C. W = Q",
      "D. W = n R T"
    ],
    "correcta": 0,
    "explicacion": "Como dV = 0, W = ∫ P dV = 0; todo el calor transferido cambia directamente la energía interna (Q = ΔU)."
  },
  {
    "id": 225,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En un proceso isobárico (presión constante P = cte), el trabajo de expansión realizado por el gas es:",
    "opciones": [
      "A. W = 0",
      "B. W = n R ln(Vf/Vi)",
      "C. W = P / ΔV",
      "D. W = P · (V_final - V_inicial)"
    ],
    "correcta": 3,
    "explicacion": "Al ser P constante, W = P ∫ dV = P · ΔV = n R ΔT."
  },
  {
    "id": 226,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En un proceso adiabático (sin intercambio de calor con el entorno, Q = 0):",
    "opciones": [
      "A. La presión es constante",
      "B. La entropía aumenta infinitamente",
      "C. ΔU = - W (el gas se enfría al expandirse)",
      "D. La temperatura no cambia"
    ],
    "correcta": 2,
    "explicacion": "Al expandirse adiabáticamente (W > 0), el gas gasta su propia energía interna para realizar trabajo (ΔU < 0, T baja)."
  },
  {
    "id": 227,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La relación de capacidades caloríficas γ = Cp / Cv para un gas ideal monoatómico es:",
    "opciones": [
      "A. 2.00",
      "B. 5 / 3 (~1.67)",
      "C. 7 / 5 (~1.40)",
      "D. 1.00"
    ],
    "correcta": 1,
    "explicacion": "Cv = (3/2)R y Cp = Cv + R = (5/2)R; γ = (5/2)/(3/2) = 5/3."
  },
  {
    "id": 228,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Para un gas diatómico (como el aire N2/O2) a temperatura ambiente, γ = Cp / Cv es:",
    "opciones": [
      "A. 7 / 5 (1.40)",
      "B. 5 / 3",
      "C. 4 / 3",
      "D. 1.67"
    ],
    "correcta": 0,
    "explicacion": "Incluyendo 3 grados de libertad traslacionales y 2 rotacionales: Cv = (5/2)R, Cp = (7/2)R -> γ = 1.40."
  },
  {
    "id": 229,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Segunda Ley de la Termodinámica según el enunciado de Kelvin-Planck establece que:",
    "opciones": [
      "A. El calor fluye espontáneamente de un cuerpo frío a uno caliente",
      "B. La entropía del universo disminuye",
      "C. El cero absoluto es alcanzable",
      "D. Es imposible construir una máquina térmica cíclica cuyo único resultado sea absorber calor de una fuente y convertirlo íntegramente en trabajo"
    ],
    "correcta": 3,
    "explicacion": "Ninguna máquina térmica puede tener una eficiencia del 100%; siempre debe ceder calor a un foco frío."
  },
  {
    "id": 230,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El enunciado de Clausius de la Segunda Ley de la Termodinámica establece que:",
    "opciones": [
      "A. Los gases nunca se expanden",
      "B. La entropía es siempre constante",
      "C. El calor no puede fluir espontáneamente de un cuerpo frío a uno más caliente sin trabajo externo",
      "D. El trabajo mecánico no produce calor"
    ],
    "correcta": 2,
    "explicacion": "Para transferir calor de frío a caliente (como en un refrigerador) es indispensable aportar trabajo mecánico externo."
  },
  {
    "id": 231,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El Ciclo de Carnot es el ciclo termodinámico más eficiente posible operando entre dos temperaturas TH y TC; su rendimiento es:",
    "opciones": [
      "A. η = 100%",
      "B. η = 1 - (TC / TH)",
      "C. η = 1 - (TH / TC)",
      "D. η = TH / TC"
    ],
    "correcta": 1,
    "explicacion": "Sadi Carnot demostró en 1824 que ninguna máquina real puede superar la eficiencia del ciclo reversible de Carnot."
  },
  {
    "id": 232,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "Si una máquina de Carnot opera entre un foco caliente a 500 K y un foco frío a 300 K, su eficiencia térmica teórica es:",
    "opciones": [
      "A. 40% (0.40)",
      "B. 60%",
      "C. 20%",
      "D. 80%"
    ],
    "correcta": 0,
    "explicacion": "η = 1 - (300 / 500) = 1 - 0.6 = 0.40 = 40%."
  },
  {
    "id": 233,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La función de estado introducida por Rudolf Clausius que mide el grado de irreversibilidad y desorden microscópico de un sistema es:",
    "opciones": [
      "A. La entalpía",
      "B. La energía libre de Gibbs",
      "C. La capacidad calorífica",
      "D. La entropía (S)"
    ],
    "correcta": 3,
    "explicacion": "Definida diferencialmente para procesos reversibles como dS = dQ_rev / T."
  },
  {
    "id": 234,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "En cualquier proceso real (irreversible) que ocurre en un sistema aislado, la entropía del sistema:",
    "opciones": [
      "A. Disminuye espontáneamente",
      "B. Oscila sinusoidalmente",
      "C. Siempre aumenta (ΔS_universo > 0)",
      "D. Permanece estrictamente constante"
    ],
    "correcta": 2,
    "explicacion": "El principio de incremento de entropía establece la flecha del tiempo termodinámica."
  },
  {
    "id": 235,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "La Tercera Ley de la Termodinámica (Teorema de Nernst) postula que:",
    "opciones": [
      "A. La presión se vuelve infinita",
      "B. La entropía de un cristal perfecto puro tiende a cero cuando la temperatura absoluta tiende a cero (0 K)",
      "C. Es fácil alcanzar los 0 K en laboratorio",
      "D. La masa se anula en el cero absoluto"
    ],
    "correcta": 1,
    "explicacion": "Formulado por Walther Nernst, implica que es imposible enfriar un sistema a 0 K exactos en un número finito de pasos."
  },
  {
    "id": 236,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El calor específico c del agua líquida es excepcionalmente alto, con un valor de:",
    "opciones": [
      "A. 4,186 J/(kg·°C) o 1 cal/(g·°C)",
      "B. 1,000 J/(kg·°C)",
      "C. 500 J/(kg·°C)",
      "D. 2,090 J/(kg·°C)"
    ],
    "correcta": 0,
    "explicacion": "Su alta capacidad calorífica convierte al agua en un estabilizador térmico vital para el clima planetario y la vida."
  },
  {
    "id": 237,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el vapor de agua a 100 °C produce quemaduras mucho más graves en la piel que el agua líquida a 100 °C?",
    "opciones": [
      "A. Porque el vapor está a mayor temperatura",
      "B. Porque el vapor tiene mayor viscosidad",
      "C. Porque el vapor contiene toxinas",
      "D. Porque al condensarse sobre la piel libera su enorme calor latente de vaporización (~2.26 × 10^6 J/kg)"
    ],
    "correcta": 3,
    "explicacion": "El calor latente de cambio de fase (~540 cal/g) se entrega instantáneamente al condensarse."
  },
  {
    "id": 238,
    "area": "Termodinámica",
    "subtema": "Leyes de la Termodinámica y Máquinas Térmicas",
    "nivel": 3,
    "dificultad": "Intermedio",
    "pregunta": "El calor latente de fusión del hielo a 0 °C es aproximadamente:",
    "opciones": [
      "A. 4,186 J/kg",
      "B. 1.0 × 10^4 J/kg",
      "C. 3.33 × 10^5 J/kg (~80 cal/g)",
      "D. 2.26 × 10^6 J/kg"
    ],
    "correcta": 2,
    "explicacion": "Fundir 1 kg de hielo requiere 333 kJ sin cambiar su temperatura de 0 °C."
  },
  {
    "id": 239,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Coulomb establece que la fuerza electrostática entre dos cargas puntuales es:",
    "opciones": [
      "A. Inversamente proporcional al cubo de la distancia",
      "B. Inversamente proporcional al cuadrado de la distancia (F = k·|q1·q2|/r²)",
      "C. Directamente proporcional a la distancia",
      "D. Independiente del medio"
    ],
    "correcta": 1,
    "explicacion": "Charles-Augustin de Coulomb midió en 1785 la fuerza entre cargas mediante balanza de torsión."
  },
  {
    "id": 240,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La constante electrostática k_e = 1 / (4πε0) en el vacío tiene un valor aproximado de:",
    "opciones": [
      "A. 8.99 × 10^9 N·m²/C² (~9 × 10^9)",
      "B. 1.60 × 10^-19",
      "C. 6.67 × 10^-11",
      "D. 3.00 × 10^8"
    ],
    "correcta": 0,
    "explicacion": "Fija la escala de las fuerzas eléctricas frente a las unidades SI de carga."
  },
  {
    "id": 241,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La carga elemental del electrón es de magnitud:",
    "opciones": [
      "A. 9.11 × 10^-31 C",
      "B. 1.00 × 10^-6 C",
      "C. 8.99 × 10^9 C",
      "D. 1.602 × 10^-19 Coulomb"
    ],
    "correcta": 3,
    "explicacion": "Medida con gran precisión por Robert Millikan en su experimento de la gota de aceite (1909)."
  },
  {
    "id": 242,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El campo eléctrico E creado por una carga puntual q a distancia r se calcula como:",
    "opciones": [
      "A. E = k_e · q² / r²",
      "B. E = F · q",
      "C. E = k_e · q / r²",
      "D. E = k_e · q / r"
    ],
    "correcta": 2,
    "explicacion": "E representa la fuerza eléctrica experimentada por unidad de carga de prueba positiva: E = F/q0."
  },
  {
    "id": 243,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Las líneas de campo eléctrico generadas por cargas estáticas:",
    "opciones": [
      "A. Nunca pueden ser radiales",
      "B. Nacen en cargas positivas y mueren en cargas negativas",
      "C. Forman lazos cerrados continuos",
      "D. Nacen en cargas negativas"
    ],
    "correcta": 1,
    "explicacion": "El vector campo eléctrico es tangente a las líneas de campo en cada punto del espacio."
  },
  {
    "id": 244,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Gauss para el campo eléctrico establece que el flujo eléctrico neto a través de cualquier superficie cerrada es:",
    "opciones": [
      "A. Φ_E = Q_enc / ε0",
      "B. Φ_E = Q_enc · ε0",
      "C. Φ_E = 0 siempre",
      "D. Φ_E = I_enc · μ0"
    ],
    "correcta": 0,
    "explicacion": "Carl Friedrich Gauss demostró que el flujo de E solo depende de la carga total encerrada."
  },
  {
    "id": 245,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El campo eléctrico en el interior de un conductor en equilibrio electrostático es:",
    "opciones": [
      "A. Máximo en el centro",
      "B. Proporcional a la masa",
      "C. Infinito",
      "D. Estrictamente cero (E = 0)"
    ],
    "correcta": 3,
    "explicacion": "Si hubiera campo eléctrico interior, las cargas libres se moverían, contradiciendo el equilibrio estático."
  },
  {
    "id": 246,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El fenómeno por el cual una cavidad metálica cerrada aísla su interior de campos eléctricos externos se llama:",
    "opciones": [
      "A. Inducción mutua",
      "B. Resonancia magnética",
      "C. Blindaje electrostático o Jaula de Faraday",
      "D. Efecto Hall"
    ],
    "correcta": 2,
    "explicacion": "Michael Faraday demostró que las cargas en exceso residen exclusivamente en la superficie exterior del conductor."
  },
  {
    "id": 247,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La diferencia de potencial eléctrico (voltaje) entre dos puntos se mide en unidades SI de:",
    "opciones": [
      "A. Ohmios (Ω)",
      "B. Voltios (1 V = 1 Joule / Coulomb)",
      "C. Amperios (A)",
      "D. Watts (W)"
    ],
    "correcta": 1,
    "explicacion": "Representa el trabajo por unidad de carga necesario para mover una carga de prueba entre dos puntos."
  },
  {
    "id": 248,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una superficie equipotencial es aquella donde:",
    "opciones": [
      "A. El potencial eléctrico tiene el mismo valor en todos sus puntos",
      "B. El campo eléctrico es cero",
      "C. La carga total es nula",
      "D. No hay átomos"
    ],
    "correcta": 0,
    "explicacion": "El campo eléctrico es siempre perpendicular a las superficies equipotenciales en cualquier punto."
  },
  {
    "id": 249,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La capacitancia C de un conductor o capacitor se define como la relación:",
    "opciones": [
      "A. C = V / Q",
      "B. C = Q · V",
      "C. C = I · R",
      "D. C = Q / V (Carga acumulada por unidad de voltaje)"
    ],
    "correcta": 3,
    "explicacion": "Se mide en Faradios (1 F = 1 C/V)."
  },
  {
    "id": 250,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La capacitancia de un capacitor de placas paralelas en el vacío de área A separadas una distancia d es:",
    "opciones": [
      "A. C = A / (ε0 · d)",
      "B. C = 2 · ε0 · A · d",
      "C. C = ε0 · A / d",
      "D. C = ε0 · d / A"
    ],
    "correcta": 2,
    "explicacion": "Para aumentar la capacitancia se debe aumentar el área de las placas o reducir la distancia entre ellas."
  },
  {
    "id": 251,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Al insertar un material dieléctrico de constante κ > 1 entre las placas de un capacitor, su capacitancia:",
    "opciones": [
      "A. Se vuelve cero",
      "B. Aumenta por un factor κ (C' = κ · C0)",
      "C. Disminuye por un factor κ",
      "D. Permanece igual"
    ],
    "correcta": 1,
    "explicacion": "La polarización molecular del dieléctrico reduce el campo eléctrico interno, permitiendo almacenar más carga."
  },
  {
    "id": 252,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La energía electrostática almacenada en un capacitor cargado con carga Q y voltaje V es:",
    "opciones": [
      "A. U = (1/2) · C · V² = (1/2) · Q · V = Q² / (2C)",
      "B. U = C · V",
      "C. U = (1/2) · C² · V",
      "D. U = Q · V²"
    ],
    "correcta": 0,
    "explicacion": "Equivale al trabajo realizado por la fuente para transferir las cargas entre las placas."
  },
  {
    "id": 253,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Ohm para un conductor óhmico establece que la corriente I es:",
    "opciones": [
      "A. I = V · R",
      "B. I = R / V",
      "C. I = V² · R",
      "D. I = V / R"
    ],
    "correcta": 3,
    "explicacion": "Georg Simon Ohm descubrió en 1827 que la corriente es proporcional a la diferencia de potencial aplicada."
  },
  {
    "id": 254,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La resistencia eléctrica R de un conductor de longitud L, área de sección A y resistividad ρ es:",
    "opciones": [
      "A. R = L / (ρ · A)",
      "B. R = ρ · L · A",
      "C. R = ρ · L / A",
      "D. R = ρ · A / L"
    ],
    "correcta": 2,
    "explicacion": "Conductores largos y delgados tienen mayor resistencia eléctrica que conductores cortos y gruesos."
  },
  {
    "id": 255,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La resistencia equivalente de tres resistencias en serie R1, R2 y R3 es:",
    "opciones": [
      "A. R_eq = (R1 + R2) / R3",
      "B. R_eq = R1 + R2 + R3",
      "C. 1/R_eq = 1/R1 + 1/R2 + 1/R3",
      "D. R_eq = R1 · R2 · R3"
    ],
    "correcta": 1,
    "explicacion": "En serie, la misma corriente atraviesa cada resistencia y los voltajes se suman."
  },
  {
    "id": 256,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La resistencia equivalente de dos resistencias R1 y R2 conectadas en paralelo es:",
    "opciones": [
      "A. R_eq = (R1 · R2) / (R1 + R2)",
      "B. R_eq = R1 + R2",
      "C. R_eq = R1 / R2",
      "D. R_eq = 2(R1 + R2)"
    ],
    "correcta": 0,
    "explicacion": "En paralelo, el voltaje es idéntico en ambas ramas y las corrientes se suman: 1/R_eq = 1/R1 + 1/R2."
  },
  {
    "id": 257,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Primera Ley de Kirchhoff (Ley de Nodos) es una consecuencia directa de:",
    "opciones": [
      "A. La conservación de la energía",
      "B. La conservación del momento lineal",
      "C. La ley de Faraday",
      "D. La conservación de la carga eléctrica (∑ I_entra = ∑ I_sale)"
    ],
    "correcta": 3,
    "explicacion": "En un nodo o empalme eléctrico no se acumula ni se destruye carga eléctrica."
  },
  {
    "id": 258,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Segunda Ley de Kirchhoff (Ley de Mallas) es una consecuencia directa de:",
    "opciones": [
      "A. La ley de Coulomb",
      "B. La ley de Lenz",
      "C. La conservación de la energía (la suma algebraica de voltajes en una malla cerrada es cero: ∑ΔV = 0)",
      "D. La conservación de la masa"
    ],
    "correcta": 2,
    "explicacion": "El trabajo neto por unidad de carga alrededor de cualquier lazo cerrado es nulo por ser el campo conservativo."
  },
  {
    "id": 259,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La potencia eléctrica disipada en forma de calor por efecto Joule en una resistencia R con corriente I es:",
    "opciones": [
      "A. P = I² / R",
      "B. P = I² · R = V · I = V² / R",
      "C. P = I / R",
      "D. P = V / I"
    ],
    "correcta": 1,
    "explicacion": "James Prescott Joule demostró que la energía eléctrica se disipa proporcionalmente al cuadrado de la corriente."
  },
  {
    "id": 260,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La fuerza magnética que experimenta una carga puntual q que se mueve con velocidad v en un campo magnético B es:",
    "opciones": [
      "A. F = q · (v × B)",
      "B. F = q · (v · B)",
      "C. F = q · B / v",
      "D. F = m · v · B"
    ],
    "correcta": 0,
    "explicacion": "La fuerza magnética es perpendicular tanto a la velocidad v como al campo B (fuerza de Lorentz)."
  },
  {
    "id": 261,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si una carga se mueve en dirección paralela o antiparalela al campo magnético (θ = 0° o 180°), la fuerza magnética es:",
    "opciones": [
      "A. Máxima",
      "B. Infinita",
      "C. Igual a q·v·B",
      "D. Cero (F = 0)"
    ],
    "correcta": 3,
    "explicacion": "Como |v × B| = v·B·sin(0°) = 0, no hay fuerza magnética paralela a las líneas de campo."
  },
  {
    "id": 262,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una partícula cargada entra perpendicularmente a un campo magnético uniforme. Su trayectoria es:",
    "opciones": [
      "A. Una línea recta",
      "B. Una elipse alargada",
      "C. Un círculo con radio r = m·v / (q·B)",
      "D. Una parábola acelerada"
    ],
    "correcta": 2,
    "explicacion": "La fuerza magnética actúa como fuerza centrípeta (F = q·v·B = m·v²/r) sin alterar la rapidez de la partícula."
  },
  {
    "id": 263,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Realiza trabajo la fuerza magnética estática sobre una carga en movimiento?",
    "opciones": [
      "A. Depende del signo de la carga",
      "B. No, el trabajo es estrictamente cero porque la fuerza es siempre perpendicular a la velocidad",
      "C. Sí, siempre positivo",
      "D. Sí, siempre negativo"
    ],
    "correcta": 1,
    "explicacion": "d W = F·dr = q(v × B)·(v dt) = 0, la fuerza magnética cambia la dirección del movimiento pero nunca la energía cinética."
  },
  {
    "id": 264,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El efecto Hall permite determinar experimentalmente:",
    "opciones": [
      "A. El signo de los portadores de carga mayoritarios y su densidad en un conductor o semiconductor",
      "B. La masa de los fotones",
      "C. La constante de Boltzmann",
      "D. La velocidad de la luz"
    ],
    "correcta": 0,
    "explicacion": "Edwin Hall descubrió en 1879 la diferencia de potencial transversal generada por el campo magnético sobre cargas en movimiento."
  },
  {
    "id": 265,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Biot-Savart permite calcular:",
    "opciones": [
      "A. La fuerza eléctrica",
      "B. La capacitancia de un cable",
      "C. La resistencia",
      "D. El campo magnético generado por un elemento de corriente diferencial (dB = (μ0/4π) · (I dl × r̂) / r²)"
    ],
    "correcta": 3,
    "explicacion": "Jean-Baptiste Biot y Félix Savart establecieron la fuente microscópica del magnetismo a partir de corrientes."
  },
  {
    "id": 266,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Ampère para corrientes estacionarias establece que:",
    "opciones": [
      "A. ∮ B · dA = Q_enc",
      "B. ∮ E · dl = -dΦ/dt",
      "C. ∮ B · dl = μ0 · I_enc",
      "D. ∮ B · dl = 0"
    ],
    "correcta": 2,
    "explicacion": "La circulación del campo magnético a lo largo de una curva cerrada es proporcional a la corriente neta encerrada."
  },
  {
    "id": 267,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El campo magnético B en el interior de un solenoide ideal largo con n vueltas por unidad de longitud y corriente I es:",
    "opciones": [
      "A. B = 0",
      "B. B = μ0 · n · I",
      "C. B = μ0 · I / n",
      "D. B = μ0 · n² · I"
    ],
    "correcta": 1,
    "explicacion": "El campo en el núcleo del solenoide es uniforme y paralelo al eje del cilindro."
  },
  {
    "id": 268,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Gauss para el magnetismo (∮ B · dA = 0) expresa formalmente que:",
    "opciones": [
      "A. No existen monopolos magnéticos aislados en la naturaleza (las líneas de B son lazos cerrados continuos)",
      "B. Los imanes no tienen polos",
      "C. El flujo magnético siempre es infinito",
      "D. La corriente se anula en conductores"
    ],
    "correcta": 0,
    "explicacion": "Cualquier imán cortado por la mitad genera siempre un nuevo polo norte y un nuevo polo sur."
  },
  {
    "id": 269,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Inducción de Faraday establece que la fuerza electromotriz (fem) inducida en un circuito es igual a:",
    "opciones": [
      "A. El flujo magnético estático",
      "B. La corriente multiplicada por el tiempo",
      "C. La resistencia dividida por el flujo",
      "D. La rapidez de cambio del flujo magnético cambiada de signo: ε = - dΦ_B / dt"
    ],
    "correcta": 3,
    "explicacion": "Michael Faraday descubrió en 1831 que un campo magnético variable en el tiempo genera un campo eléctrico inducido."
  },
  {
    "id": 270,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Lenz establece que el sentido de la corriente inducida es tal que:",
    "opciones": [
      "A. Apunta siempre hacia el norte geográfico",
      "B. Depende de la masa del alambre",
      "C. Su propio campo magnético se opone al cambio de flujo magnético que la originó",
      "D. Siempre refuerza el cambio de flujo"
    ],
    "correcta": 2,
    "explicacion": "Heinrich Lenz demostró que este signo negativo refleja el principio de conservación de la energía."
  },
  {
    "id": 271,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un transformador eléctrico ideal con Np espiras en el primario y Ns en el secundario, la relación de voltajes es:",
    "opciones": [
      "A. Vs / Vp = (Ns / Np)²",
      "B. Vs / Vp = Ns / Np",
      "C. Vs / Vp = Np / Ns",
      "D. Vs · Vp = Ns · Np"
    ],
    "correcta": 1,
    "explicacion": "Un transformador elevador tiene Ns > Np; un transformador reductor tiene Ns < Np."
  },
  {
    "id": 272,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En el mismo transformador ideal, si el voltaje secundario se duplica (Vs = 2·Vp), la corriente secundaria:",
    "opciones": [
      "A. Se reduce a la mitad (Is = Ip / 2) por conservación de la potencia (Pp = Ps)",
      "B. Se duplica",
      "C. Se cuadruplica",
      "D. Permanece igual"
    ],
    "correcta": 0,
    "explicacion": "Como Pp = Vp·Ip = Vs·Is = Ps (sin pérdidas), elevar el voltaje reduce la corriente proporcionalmente."
  },
  {
    "id": 273,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La corriente de desplazamiento introducida por James Clerk Maxwell en la Ley de Ampère-Maxwell representa:",
    "opciones": [
      "A. Una fuga de corriente física en los cables",
      "B. Una corriente de electrones libres",
      "C. El flujo de calor en el dieléctrico",
      "D. El efecto de un campo eléctrico variable en el tiempo como fuente de campo magnético (Id = ε0 · dΦ_E / dt)"
    ],
    "correcta": 3,
    "explicacion": "Esta adición teórica permitió predecir la existencia de ondas electromagnéticas autosostenidas."
  },
  {
    "id": 274,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La velocidad de propagación de las ondas electromagnéticas en el vacío deducida por Maxwell es:",
    "opciones": [
      "A. c = √(ε0 · μ0)",
      "B. c = μ0 · ε0",
      "C. c = 1 / √(ε0 · μ0) ≈ 3.00 × 10^8 m/s",
      "D. c = ε0 / μ0"
    ],
    "correcta": 2,
    "explicacion": "Al coincidir exactamente con la velocidad de la luz, Maxwell concluyó que la luz es una onda electromagnética."
  },
  {
    "id": 275,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En una onda electromagnética en el vacío, los vectores campo eléctrico E, campo magnético B y el vector de propagación k:",
    "opciones": [
      "A. Tienen amplitudes idénticas en Volts",
      "B. Son mutuamente perpendiculares entre sí formando una tríada ortogonal derecha",
      "C. Son paralelos entre sí",
      "D. Forman un ángulo de 45°"
    ],
    "correcta": 1,
    "explicacion": "E y B oscilan en fase y son perpendiculares a la dirección en la que viaja la onda."
  },
  {
    "id": 276,
    "area": "Electromagnetismo",
    "subtema": "Campos, Circuitos y Ecuaciones de Maxwell",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Vector de Poynting S = (1/μ0) · (E × B) representa:",
    "opciones": [
      "A. La densidad de flujo de energía por unidad de área y tiempo transportada por la onda (en W/m²)",
      "B. La masa de los fotones",
      "C. La aceleración del campo",
      "D. La resistencia del vacío"
    ],
    "correcta": 0,
    "explicacion": "John Henry Poynting demostró que este vector indica la dirección y magnitud del transporte energético de la radiación."
  },
  {
    "id": 277,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Reflexión de la luz establece que el ángulo de incidencia θi y el de reflexión θr respecto a la normal:",
    "opciones": [
      "A. Suman 90 grados",
      "B. θr es siempre la mitad de θi",
      "C. Dependen del color de la luz",
      "D. Son exactamente iguales (θi = θr)"
    ],
    "correcta": 3,
    "explicacion": "Válido tanto para reflexión especular (en espejos planos) como para reflexión difusa."
  },
  {
    "id": 278,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Refracción de Snell se expresa matemáticamente como:",
    "opciones": [
      "A. n1 / sin(θ1) = n2 / sin(θ2)",
      "B. n1 · θ1 = n2 · θ2",
      "C. n1 · sin(θ1) = n2 · sin(θ2)",
      "D. n1 · cos(θ1) = n2 · cos(θ2)"
    ],
    "correcta": 2,
    "explicacion": "Willebrord Snellius formuló en 1621 la relación entre índices de refracción y ángulos con la normal."
  },
  {
    "id": 279,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El índice de refracción n de un medio transparente se define como:",
    "opciones": [
      "A. n = λ / f",
      "B. n = c / v (Cociente entre la velocidad de la luz en el vacío y en el medio)",
      "C. n = v / c",
      "D. n = c · v"
    ],
    "correcta": 1,
    "explicacion": "Como la luz viaja más lenta en la materia que en el vacío (v < c), el índice n siempre es ≥ 1 (agua ≈ 1.33, vidrio ≈ 1.50, diamante ≈ 2.42)."
  },
  {
    "id": 280,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando la luz pasa de un medio más denso ópticamente a uno menos denso (n1 > n2) superando el ángulo crítico θc:",
    "opciones": [
      "A. Ocurre reflexión interna total (toda la luz se refleja y nada se refracta)",
      "B. La luz se destruye",
      "C. La frecuencia se triplica",
      "D. La luz se vuelve ultravioleta"
    ],
    "correcta": 0,
    "explicacion": "Este principio permite el funcionamiento de la fibra óptica y explica el brillo de los diamantes."
  },
  {
    "id": 281,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El ángulo crítico θc para reflexión interna total entre dos medios (n1 > n2) se calcula como:",
    "opciones": [
      "A. sin(θc) = n1 / n2",
      "B. cos(θc) = n2 / n1",
      "C. tan(θc) = n1 / n2",
      "D. sin(θc) = n2 / n1"
    ],
    "correcta": 3,
    "explicacion": "Para agua (1.33) y aire (1.00), θc = arcsin(1/1.33) ≈ 48.6°."
  },
  {
    "id": 282,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La dispersión cromática de la luz blanca en un prisma de vidrio se debe a que:",
    "opciones": [
      "A. El prisma absorbe el verde",
      "B. El prisma está polarizado",
      "C. El índice de refracción n del vidrio depende de la longitud de onda (la luz violeta se refracta más que la roja)",
      "D. La luz roja viaja más despacio que la violeta"
    ],
    "correcta": 2,
    "explicacion": "Isaac Newton demostró en 1666 que la luz blanca está compuesta por todos los colores del espectro visible."
  },
  {
    "id": 283,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La distancia focal f de un espejo esférico de radio de curvatura R es:",
    "opciones": [
      "A. f = R / 4",
      "B. f = R / 2",
      "C. f = 2 · R",
      "D. f = R²"
    ],
    "correcta": 1,
    "explicacion": "En la aproximación paraxial, el foco principal de un espejo esférico cóncavo o convexo se sitúa a R/2."
  },
  {
    "id": 284,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La ecuación fundamental de los espejos y lentes delgadas (fórmula de Gauss) es:",
    "opciones": [
      "A. 1 / f = 1 / do + 1 / di",
      "B. f = do + di",
      "C. 1 / f = 1 / do - 1 / di",
      "D. f = do · di"
    ],
    "correcta": 0,
    "explicacion": "Relaciona la distancia focal f, la distancia al objeto do y la distancia a la imagen di."
  },
  {
    "id": 285,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una lente convergente (biconvexa) forma una imagen real e invertida cuando el objeto está situado:",
    "opciones": [
      "A. Entre el foco y la lente (do < f)",
      "B. En el infinito únicamente",
      "C. En el centro óptico",
      "D. Más allá del foco principal (do > f)"
    ],
    "correcta": 3,
    "explicacion": "Si do < f, la imagen es virtual, derecha y aumentada (modo lupa)."
  },
  {
    "id": 286,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Experimento de la Doble Rendija de Thomas Young (1801) demostró concluyentemente:",
    "opciones": [
      "A. La velocidad del sonido",
      "B. La existencia de los electrones",
      "C. La naturaleza ondulatoria de la luz mediante franjas de interferencia constructiva y destructiva",
      "D. Que la luz está formada por partículas pesadas"
    ],
    "correcta": 2,
    "explicacion": "Las franjas brillantes y oscuras en la pantalla surgen por diferencia de camino óptico d·sin(θ) = mλ."
  },
  {
    "id": 287,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Criterio de Rayleigh de resolución óptica establece que dos fuentes puntuales apenas se resuelven cuando:",
    "opciones": [
      "A. La luz es completamente coherente",
      "B. El máximo central de difracción de una fuente coincide con el primer mínimo de la otra",
      "C. Sus imágenes están separadas 1 metro",
      "D. No hay difracción"
    ],
    "correcta": 1,
    "explicacion": "Lord Rayleigh fijó el límite de difracción angular para aberturas circulares: θ_min = 1.22 λ / D."
  },
  {
    "id": 288,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Malus describe la intensidad transmitida I por un polarizador cuando la luz incide con ángulo θ respecto a su eje de transmisión:",
    "opciones": [
      "A. I = I0 · cos²(θ)",
      "B. I = I0 · sin²(θ)",
      "C. I = I0 · cos(θ)",
      "D. I = I0 / 2"
    ],
    "correcta": 0,
    "explicacion": "Étienne-Louis Malus descubrió en 1809 que la intensidad de la luz polarizada decrece con el cuadrado del coseno."
  },
  {
    "id": 289,
    "area": "Óptica y Fotónica",
    "subtema": "Óptica Geométrica y Ondulatoria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Ángulo de Brewster (ángulo de polarización por reflexión) cumple la relación:",
    "opciones": [
      "A. sin(θ_B) = n2 / n1",
      "B. cos(θ_B) = n1 / n2",
      "C. tan(θ_B) = n1 / n2",
      "D. tan(θ_B) = n2 / n1"
    ],
    "correcta": 3,
    "explicacion": "Al incidir a θ_B, el rayo reflejado y el refractado son perpendiculares entre sí, y la luz reflejada queda 100% polarizada linealmente."
  },
  {
    "id": 290,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El primer postulado de la Relatividad Especial de Albert Einstein (1905) establece que:",
    "opciones": [
      "A. El tiempo es absoluto para todos los observadores",
      "B. La gravedad curva el espacio",
      "C. Las leyes de la física son idénticas en todos los sistemas de referencia inerciales",
      "D. La Tierra es el centro del universo"
    ],
    "correcta": 2,
    "explicacion": "Generaliza el principio de relatividad de Galileo a todas las leyes físicas, incluido el electromagnetismo."
  },
  {
    "id": 291,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El segundo postulado de la Relatividad Especial establece que:",
    "opciones": [
      "A. El éter luminífero frena la luz",
      "B. La velocidad de la luz en el vacío es la misma (c) para todos los observadores inerciales, independientemente del movimiento de la fuente",
      "C. La luz viaja más rápido si la fuente se mueve hacia el observador",
      "D. La velocidad de la luz depende de la frecuencia"
    ],
    "correcta": 1,
    "explicacion": "Rompe con la suma galileana de velocidades y conduce a la dilatación del tiempo y la contracción de longitud."
  },
  {
    "id": 292,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El factor de Lorentz γ que aparece en las transformaciones relativistas se define como:",
    "opciones": [
      "A. γ = 1 / √(1 - v² / c²)",
      "B. γ = √(1 - v² / c²)",
      "C. γ = 1 - v / c",
      "D. γ = 1 / (1 + v² / c²)"
    ],
    "correcta": 0,
    "explicacion": "Para v = 0, γ = 1; conforme v -> c, γ -> ∞."
  },
  {
    "id": 293,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La dilatación temporal relativista predice que un reloj en movimiento respecto a un observador en reposo:",
    "opciones": [
      "A. Marcha más rápido",
      "B. Se detiene instantáneamente a cualquier velocidad",
      "C. No cambia",
      "D. Marcha más lento (mide un intervalo de tiempo mayor Δt = γ · Δt0)"
    ],
    "correcta": 3,
    "explicacion": "Verificado con muones cósmicos que sobreviven hasta el suelo y con relojes atómicos en satélites GPS."
  },
  {
    "id": 294,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La contracción de longitud relativista predice que la longitud de un objeto en movimiento medida por un observador en reposo:",
    "opciones": [
      "A. Se alarga",
      "B. Permanece igual",
      "C. Se acorta únicamente en la dirección paralela a su movimiento (L = L0 / γ)",
      "D. Se acorta en todas direcciones esféricamente"
    ],
    "correcta": 2,
    "explicacion": "La longitud propia L0 es la medida en el marco de reposo del objeto."
  },
  {
    "id": 295,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La famosa ecuación de equivalencia masa-energía formulada por Einstein en reposo es:",
    "opciones": [
      "A. E = m · v²",
      "B. E0 = m · c²",
      "C. E = m · c",
      "D. E = (1/2) m · c²"
    ],
    "correcta": 1,
    "explicacion": "Demuestra que la masa es una forma ultra concentrada de energía latente (1 gramo ≈ 9 × 10^13 Joules)."
  },
  {
    "id": 296,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La relación relativista general entre energía total E, momento lineal p y masa en reposo m es:",
    "opciones": [
      "A. E² = (p · c)² + (m · c²)²",
      "B. E = p · c + m · c²",
      "C. E² = p² + m²",
      "D. E = p · v"
    ],
    "correcta": 0,
    "explicacion": "Para un fotón sin masa en reposo (m = 0), se simplifica a la relación fundamental E = p·c."
  },
  {
    "id": 297,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Max Planck resolvió la 'catástrofe ultravioleta' de la radiación de cuerpo negro (1900) proponiendo que:",
    "opciones": [
      "A. La luz es una onda continua infinita",
      "B. La temperatura nunca supera los 5000 K",
      "C. Los átomos no tienen electrones",
      "D. Los osciladores atómicos absorben y emiten energía solo en paquetes discretos cuantizados (E = n · h · f)"
    ],
    "correcta": 3,
    "explicacion": "Nacimiento de la física cuántica; h ≈ 6.626 × 10^-34 J·s es la constante de Planck."
  },
  {
    "id": 298,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Albert Einstein explicó el Efecto Fotoeléctrico (Nobel 1921) postulando que la luz está compuesta por:",
    "opciones": [
      "A. Electrones libres",
      "B. Calórico",
      "C. Cuantos de luz o paquetes corpusculares de energía llamados fotones (E = h · f)",
      "D. Ondas acústicas"
    ],
    "correcta": 2,
    "explicacion": "Si la energía del fotón hf supera la función de trabajo Φ del metal, se expelen fotoelectrones con K_max = hf - Φ."
  },
  {
    "id": 299,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué aumentar la intensidad de la luz roja incidente no arranca fotoelectrones de un metal con alta función de trabajo?",
    "opciones": [
      "A. Porque los metales reflejan el rojo",
      "B. Porque ningún fotón rojo individual tiene la energía umbral hf necesaria para vencer la función de trabajo Φ",
      "C. Porque la luz roja viaja más despacio",
      "D. Porque la intensidad reduce la carga"
    ],
    "correcta": 1,
    "explicacion": "Cada fotón interactúa individualmente con un solo electrón; si hf < Φ, no hay emisión sin importar cuántos fotones lleguen."
  },
  {
    "id": 300,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En el Efecto Compton (1923), cuando un fotón de rayos X colisiona con un electrón en reposo:",
    "opciones": [
      "A. El fotón dispersado tiene menor frecuencia y mayor longitud de onda (Δλ = (h/me·c)(1 - cos θ))",
      "B. El fotón gana energía",
      "C. La longitud de onda disminuye",
      "D. El electrón absorbe el fotón sin moverse"
    ],
    "correcta": 0,
    "explicacion": "Arthur Compton demostró que los fotones transportan momento lineal relativista p = h / λ y colisionan como partículas."
  },
  {
    "id": 301,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La Hipótesis de Louis de Broglie (1924) propuso la dualidad onda-partícula general para toda la materia, con longitud de onda:",
    "opciones": [
      "A. λ = p / h",
      "B. λ = h · m · v",
      "C. λ = m / (h · v)",
      "D. λ = h / p = h / (m · v)"
    ],
    "correcta": 3,
    "explicacion": "Toda partícula en movimiento manifiesta propiedades ondulatorias; verificado con difracción de electrones por Davisson y Germer."
  },
  {
    "id": 302,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Modelo Atómico de Niels Bohr (1913) para el hidrógeno postuló que el momento angular del electrón está cuantizado como:",
    "opciones": [
      "A. L = h / n",
      "B. L = 2π · n · h",
      "C. L = n · ℏ = n · (h / 2π)",
      "D. L = n² · h"
    ],
    "correcta": 2,
    "explicacion": "Explica los espectros de líneas discretas de Rydberg y la estabilidad atómica frente al colapso radiativo."
  },
  {
    "id": 303,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La energía de los niveles cuantizados del átomo de hidrógeno en el modelo de Bohr es:",
    "opciones": [
      "A. En = 0",
      "B. En = - 13.6 eV / n² (con n = 1, 2, 3...)",
      "C. En = + 13.6 eV · n",
      "D. En = - 13.6 eV · n²"
    ],
    "correcta": 1,
    "explicacion": "El estado fundamental n = 1 tiene energía -13.6 eV; se requieren 13.6 eV de energía de ionización para liberar el electrón."
  },
  {
    "id": 304,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Principio de Incertidumbre de Werner Heisenberg (1927) establece para posición x y momento p que:",
    "opciones": [
      "A. Δx · Δp ≥ ℏ / 2",
      "B. Δx · Δp = 0",
      "C. Δx · Δp ≤ ℏ / 2",
      "D. Δx / Δp ≥ h"
    ],
    "correcta": 0,
    "explicacion": "Es imposible medir simultáneamente con precisión infinita la posición y el momento lineal de una partícula cuántica."
  },
  {
    "id": 305,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Principio de Incertidumbre para energía y tiempo se expresa como:",
    "opciones": [
      "A. ΔE · Δt = 0",
      "B. ΔE / Δt ≥ h",
      "C. ΔE · Δt ≤ ℏ",
      "D. ΔE · Δt ≥ ℏ / 2"
    ],
    "correcta": 3,
    "explicacion": "Permite la existencia de partículas virtuales y fluctuaciones cuánticas del vacío en intervalos de tiempo muy breves."
  },
  {
    "id": 306,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La Ecuación de Onda de Erwin Schrödinger (1926) describe:",
    "opciones": [
      "A. La trayectoria exacta de un electrón",
      "B. La velocidad de los quarks",
      "C. La evolución espacial y temporal de la función de onda cuántica ψ de un sistema no relativista",
      "D. Las órbitas clásicas circulares de Newton"
    ],
    "correcta": 2,
    "explicacion": "iℏ ∂ψ/∂t = Ĥ ψ; el operador hamiltoniano Ĥ contiene los términos de energía cinética y potencial."
  },
  {
    "id": 307,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Según la interpretación estadística de Max Born (Nobel 1954), la cantidad |ψ(x, t)|² representa:",
    "opciones": [
      "A. La fuerza gravitatoria",
      "B. La densidad de probabilidad de encontrar a la partícula en la posición x en el tiempo t",
      "C. La densidad de masa física del electrón",
      "D. La carga eléctrica extendida"
    ],
    "correcta": 1,
    "explicacion": "La mecánica cuántica predice probabilidades intrínsecas de medición, no certezas deterministas clásicas."
  },
  {
    "id": 308,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Efecto Túnel Cuántico es el fenómeno por el cual una partícula:",
    "opciones": [
      "A. Atraviesa una barrera de energía potencial más alta que su energía cinética (probabilidad T > 0)",
      "B. Rompe físicamente la barrera",
      "C. Adquiere masa infinita",
      "D. Viaja más rápido que la luz"
    ],
    "correcta": 0,
    "explicacion": "Esencial en la fusión nuclear en el Sol, en el microscopio de efecto túnel (STM) y en los diodos túnel."
  },
  {
    "id": 309,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Principio de Exclusión de Wolfgang Pauli (1925) establece que en un átomo multielectrónico:",
    "opciones": [
      "A. Los electrones siempre se atraen entre sí",
      "B. Todos los electrones tienen espín cero",
      "C. El núcleo no tiene carga",
      "D. Dos fermiones idénticos (como electrones) no pueden ocupar simultáneamente el mismo estado cuántico (mismos 4 números cuánticos)"
    ],
    "correcta": 3,
    "explicacion": "Explica la estructura de la tabla periódica, las capas electrónicas y la estabilidad de la materia frente al colapso."
  },
  {
    "id": 310,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Los cuatro números cuánticos que describen el estado de un electrón atómico son:",
    "opciones": [
      "A. masa, carga, radio, color",
      "B. alfa, beta, gamma, delta",
      "C. n (principal), l (azimutal o de momento angular), ml (magnético) y ms (de espín)",
      "D. x, y, z, t"
    ],
    "correcta": 2,
    "explicacion": "n determina la energía y tamaño; l la forma del orbital; ml la orientación espacial; ms la proyección de espín (±1/2)."
  },
  {
    "id": 311,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El espín intrínseco del electrón, protón y neutrón es:",
    "opciones": [
      "A. s = 2",
      "B. s = 1/2 (fermiones con espín semientero)",
      "C. s = 1 (bosones)",
      "D. s = 0"
    ],
    "correcta": 1,
    "explicacion": "Las partículas de espín semientero (1/2, 3/2...) siguen la estadística de Fermi-Dirac y el principio de exclusión."
  },
  {
    "id": 312,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Las partículas mediadoras de las fuerzas fundamentales (como fotones, gluones, bosones W/Z y gravitones) tienen espín entero y son:",
    "opciones": [
      "A. Bosones (siguen la estadística de Bose-Einstein)",
      "B. Fermiones",
      "C. Leptones",
      "D. Bariones"
    ],
    "correcta": 0,
    "explicacion": "Múltiples bosones pueden ocupar exactamente el mismo estado cuántico simultáneamente (como en un láser o condensado)."
  },
  {
    "id": 313,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Un Condensado de Bose-Einstein (predicho en 1924, logrado experimentalmente en 1995) ocurre cuando:",
    "opciones": [
      "A. Un gas se calienta a millones de grados",
      "B. Los electrones se desintegran",
      "C. Los átomos se vuelven radiactivos",
      "D. Átomos bosónicos a temperaturas de nanokelvin colapsan en el mismo estado cuántico fundamental macroscópico"
    ],
    "correcta": 3,
    "explicacion": "Carl Wieman y Eric Cornell enfriaron átomos de rubidio cerca del cero absoluto, creando un 'superátomo' cuántico gigante."
  },
  {
    "id": 314,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En la Teoría de Bandas de Sólidos, la diferencia entre conductores, semiconductores y aislantes radica en:",
    "opciones": [
      "A. La velocidad del sonido en el cristal",
      "B. La carga del núcleo",
      "C. El ancho de la banda prohibida (band gap Eg) entre la banda de valencia y la de conducción",
      "D. La densidad de neutrones"
    ],
    "correcta": 2,
    "explicacion": "Conductores: bandas solapadas (Eg = 0); aislantes: Eg grande (> 5 eV); semiconductores: Eg moderado (~1.1 eV en Si)."
  },
  {
    "id": 315,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Silicio puro (semiconductor intrínseco) se dopa con Fósforo o Arsénico (elementos pentavalentes con 5 electrones de valencia) para crear:",
    "opciones": [
      "A. Un superconductor de alta temperatura",
      "B. Un semiconductor tipo N (portadores mayoritarios: electrones en la banda de conducción)",
      "C. Un semiconductor tipo P",
      "D. Un aislante perfecto"
    ],
    "correcta": 1,
    "explicacion": "El quinto electrón de valencia se libera fácilmente como portador de carga negativa libre."
  },
  {
    "id": 316,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Silicio se dopa con Boro o Galio (elementos trivalentes con 3 electrones de valencia) para crear:",
    "opciones": [
      "A. Un semiconductor tipo P (portadores mayoritarios: huecos o vacancias positivas)",
      "B. Un semiconductor tipo N",
      "C. Un metal superconductor",
      "D. Un gas noble"
    ],
    "correcta": 0,
    "explicacion": "La falta de un electrón crea un 'hueco' que actúa efectivamente como una partícula con carga positiva."
  },
  {
    "id": 317,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La unión P-N es la estructura fundamental de:",
    "opciones": [
      "A. Los termómetros de mercurio",
      "B. Los imanes permanentes",
      "C. Las lentes de Fresnel",
      "D. Los diodos rectificadores, transistores BJT/MOSFET y celdas solares fotovoltaicas"
    ],
    "correcta": 3,
    "explicacion": "Permite el paso de corriente en un solo sentido (polarización directa) y bloquea el sentido inverso."
  },
  {
    "id": 318,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El fenómeno de la Superconductividad descubierto por Heike Kamerlingh Onnes en 1911 consiste en:",
    "opciones": [
      "A. La emisión continua de radiación gamma",
      "B. La licuefacción del cobre",
      "C. La caída abrupta a cero de la resistencia eléctrica por debajo de una temperatura crítica Tc",
      "D. Un aumento infinito de la resistencia"
    ],
    "correcta": 2,
    "explicacion": "Una corriente inducida en un anillo superconductor cerrado puede circular durante miles de años sin disiparse."
  },
  {
    "id": 319,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Efecto Meissner-Ochsenfeld en superconductores consiste en:",
    "opciones": [
      "A. La pérdida de masa",
      "B. La expulsión total del campo magnético del interior del superconductor (diamagnetismo perfecto: B = 0)",
      "C. La absorción de calor sin cambio de temperatura",
      "D. La magnetización permanente del material"
    ],
    "correcta": 1,
    "explicacion": "Produce la levitación magnética estable de imanes sobre superconductores enfriados."
  },
  {
    "id": 320,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La Teoría BCS (Bardeen, Cooper, Schrieffer, 1957) explica la superconductividad convencional mediante:",
    "opciones": [
      "A. La formación de pares de electrones ligados mediada por fonones en la red cristalina (Pares de Cooper)",
      "B. La aniquilación de electrones con positrones",
      "C. La fusión de núcleos atómicos",
      "D. Fuerzas de van der Waals"
    ],
    "correcta": 0,
    "explicacion": "A bajas temperaturas, la vibración de la red cristalina crea una atracción efectiva entre electrones de espín opuesto."
  },
  {
    "id": 321,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Módulo de Young (Y = Esfuerzo / Deformación unitaria = σ / ε) mide en ciencia de materiales:",
    "opciones": [
      "A. La dureza frente al rayado",
      "B. La tenacidad al impacto",
      "C. La conductividad térmica",
      "D. La rigidez o resistencia de un material sólido elástico a la tracción o compresión longitudinal"
    ],
    "correcta": 3,
    "explicacion": "El diamante y el grafeno tienen de los módulos de Young más altos conocidos (~1,000 GPa)."
  },
  {
    "id": 322,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El límite elástico de un material representa:",
    "opciones": [
      "A. El inicio de la fusión térmica",
      "B. El cambio de fase líquido",
      "C. El esfuerzo máximo que puede soportar antes de experimentar deformación plástica permanente",
      "D. El punto donde se rompe catastróficamente"
    ],
    "correcta": 2,
    "explicacion": "Por debajo del límite elástico, el material recupera su forma original al retirar la carga (ley de Hooke)."
  },
  {
    "id": 323,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La ductilidad de un metal es su capacidad para:",
    "opciones": [
      "A. Resistir altas temperaturas",
      "B. Deformarse plásticamente bajo tracción formando hilos o alambres delgados sin romperse",
      "C. Romperse bruscamente sin deformación previa",
      "D. Flotar en el agua"
    ],
    "correcta": 1,
    "explicacion": "El oro y el cobre son metales extremadamente dúctiles (y maleables para formar láminas)."
  },
  {
    "id": 324,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La radiactividad natural descubierta por Henri Becquerel en 1896 comprende tres tipos principales de radiación denominados:",
    "opciones": [
      "A. Alfa (núcleos de Helio-4), Beta (electrones o positrones) y Gamma (fotones de alta energía)",
      "B. Rayos X, ultravioleta e infrarrojo",
      "C. Protones, neutrones y quarks",
      "D. Neutrinos, muones y mesones"
    ],
    "correcta": 0,
    "explicacion": "Ernest Rutherford clasificó la radiación α (bloqueada por papel), β (bloqueada por aluminio) y γ (requiere plomo grueso)."
  },
  {
    "id": 325,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El tiempo de vida media (semivida t1/2) de un isótopo radiactivo es:",
    "opciones": [
      "A. El tiempo para que la muestra se destruya por completo",
      "B. El periodo de rotación del núcleo",
      "C. El tiempo de vida de un electrón",
      "D. El tiempo requerido para que la mitad de los núcleos radiactivos presentes en una muestra decaigan"
    ],
    "correcta": 3,
    "explicacion": "N(t) = N0 · (1/2)^(t / t1/2) = N0 · e^(-λt)."
  },
  {
    "id": 326,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En la Fisión Nuclear (como en el Uranio-235 o Plutonio-239 en reactores y bombas atómicas):",
    "opciones": [
      "A. Un protón se transforma en neutrino",
      "B. Los electrones colapsan al núcleo",
      "C. Un núcleo pesado inestable se divide en dos núcleos más ligeros liberando neutrones y gran energía",
      "D. Dos núcleos ligeros se fusionan"
    ],
    "correcta": 2,
    "explicacion": "La masa total de los fragmentos finales es ligeramente menor que la inicial; el defecto de masa se convierte en energía (E = mc²)."
  },
  {
    "id": 327,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En la Fusión Nuclear (el proceso que alimenta al Sol y las estrellas):",
    "opciones": [
      "A. La gravedad se anula",
      "B. Núcleos ligeros (como deuterio y tritio) se unen a presiones y temperaturas extremas para formar helio",
      "C. Un núcleo pesado se rompe en fragmentos",
      "D. Los átomos pierden sus electrones"
    ],
    "correcta": 1,
    "explicacion": "Libera mucha más energía por gramo de combustible que la fisión y no produce residuos de larga vida media."
  },
  {
    "id": 328,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En el Modelo Estándar de la física de partículas, los quarks son los constituyentes fundamentales de:",
    "opciones": [
      "A. Los protones y los neutrones (hadrones)",
      "B. Los electrones y positrones",
      "C. Los fotones",
      "D. Los neutrinos"
    ],
    "correcta": 0,
    "explicacion": "Un protón está formado por dos quarks 'up' y uno 'down' (uud); un neutrón por un 'up' y dos 'down' (udd)."
  },
  {
    "id": 329,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad, Mecánica Cuántica y Materiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Bosón de Higgs descubierto en el CERN (2012) es la manifestación del campo de Higgs que explica:",
    "opciones": [
      "A. La fuerza de la gravedad cuántica",
      "B. La energía oscura del universo",
      "C. La velocidad de los taquiones",
      "D. El mecanismo por el cual las partículas elementales (como quarks y leptones) adquieren masa"
    ],
    "correcta": 3,
    "explicacion": "Peter Higgs y François Englert predijeron el mecanismo de ruptura espontánea de simetría electrodébil (Nobel 2013)."
  },
  {
    "id": 330,
    "area": "Física Fundamental",
    "subtema": "Conversión de Unidades SI",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Un vehículo en pista de pruebas registra una rapidez de 30 km/h. ¿A cuántos metros por segundo (m/s) en el SI equivale exactamente?",
    "opciones": [
      "A. 108.00 m/s",
      "B. 15.00 m/s",
      "C. 8.33 m/s",
      "D. 10.00 m/s"
    ],
    "correcta": 2,
    "explicacion": "Para convertir de km/h a m/s se divide entre 3.6 (1 km = 1000 m, 1 h = 3600 s): 30 / 3.6 = 8.33 m/s."
  },
  {
    "id": 331,
    "area": "Dinámica y Fuerzas",
    "subtema": "Segunda Ley de Newton",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Un bloque de masa m = 10 kg adquiere una aceleración constante a = 4.5 m/s² sobre una superficie horizontal lisa. ¿Cuál es la magnitud de la fuerza neta resultante?",
    "opciones": [
      "A. 90.0 N",
      "B. 45.0 N",
      "C. 67.5 N",
      "D. 31.5 N"
    ],
    "correcta": 1,
    "explicacion": "Por la Segunda Ley de Newton: F = m · a = 10 kg × 4.5 m/s² = 45.0 N."
  },
  {
    "id": 332,
    "area": "Trabajo y Energía",
    "subtema": "Energía Cinética Progresiva",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la energía cinética de una partícula de 6 kg que se mueve a una rapidez constante v = 5 m/s?",
    "opciones": [
      "A. 105 Joules",
      "B. 38 Joules",
      "C. 150 Joules",
      "D. 75 Joules"
    ],
    "correcta": 3,
    "explicacion": "K = (1/2) · m · v² = 0.5 × 6 × (5)² = 75 J."
  },
  {
    "id": 333,
    "area": "Electromagnetismo",
    "subtema": "Ondas Electromagnéticas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una señal de radiofrecuencia (microondas) emite a f = 5.4 GHz en el aire (c ≈ 3 × 10⁸ m/s). ¿Cuál es su longitud de onda λ?",
    "opciones": [
      "A. 2.78 cm",
      "B. 54.00 cm",
      "C. 5.56 cm",
      "D. 11.12 cm"
    ],
    "correcta": 2,
    "explicacion": "λ = c / f = (3 × 10⁸ m/s) / (5.4 × 10⁹ s⁻¹) = 0.0556 m = 5.56 cm."
  },
  {
    "id": 334,
    "area": "Oscilaciones y Ondas",
    "subtema": "Periodo de Oscilación del Péndulo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el periodo de oscilación T de un péndulo simple de longitud L = 0.50 m en la Tierra (g = 9.8 m/s²)?",
    "opciones": [
      "A. 0.99 s",
      "B. 2.84 s",
      "C. 1.42 segundos",
      "D. 1.99 s"
    ],
    "correcta": 2,
    "explicacion": "T = 2π √(L / g) = 2π √(0.50 / 9.8) ≈ 1.42 s."
  },
  {
    "id": 335,
    "area": "Termodinámica",
    "subtema": "Eficiencia de Carnot",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una máquina térmica de Carnot opera entre un foco caliente a TH = 440 K y un foco frío a TC = 300 K. ¿Cuál es su eficiencia térmica máxima teórica?",
    "opciones": [
      "A. 32%",
      "B. 47%",
      "C. 22%",
      "D. 68%"
    ],
    "correcta": 0,
    "explicacion": "η = 1 - (TC / TH) = 1 - (300 / 440) = 0.318 = 32%."
  },
  {
    "id": 336,
    "area": "Electromagnetismo",
    "subtema": "Ley de Ohm Aplicada",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Un circuito simple conecta una fuente de 62 V a una resistencia de 8 Ω. ¿Qué intensidad de corriente circula por el conductor?",
    "opciones": [
      "A. 11.63 A",
      "B. 3.88 A",
      "C. 7.75 A",
      "D. 496.00 A"
    ],
    "correcta": 2,
    "explicacion": "Por la Ley de Ohm: I = V / R = 62 V / 8 Ω = 7.75 Amperios."
  },
  {
    "id": 337,
    "area": "Óptica y Fotónica",
    "subtema": "Velocidad de la Luz en Medios Materiales",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un medio transparente con índice de refracción n = 1.80, ¿cuál es la rapidez aproximada de la luz (c ≈ 300,000 km/s)?",
    "opciones": [
      "A. ~216667 km/s",
      "B. ~300,000 km/s",
      "C. ~116667 km/s",
      "D. ~166667 km/s"
    ],
    "correcta": 3,
    "explicacion": "v = c / n = 300,000 km/s / 1.80 ≈ 166667 km/s."
  },
  {
    "id": 338,
    "area": "Rotación y Gravitación",
    "subtema": "Leyes de Kepler",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "De acuerdo con la Segunda Ley de Kepler (ley de las áreas), ¿en qué punto de su órbita elíptica se desplaza un planeta a su máxima velocidad lineal?",
    "opciones": [
      "A. En el afelio, cuando está a la máxima distancia del Sol",
      "B. En el perihelio, cuando se encuentra más próximo al Sol",
      "C. En los semiejes menores de la elipse orbital",
      "D. Su velocidad lineal es rigurosamente constante en toda la órbita"
    ],
    "correcta": 1,
    "explicacion": "El radio vector Sol-planeta barre áreas iguales en tiempos iguales (dA/dt = L/(2m) = cte). Como el momento angular se conserva, al estar en el perihelio (mínimo r) la velocidad tangencial alcanza su valor máximo."
  },
  {
    "id": 339,
    "area": "Rotación y Gravitación",
    "subtema": "Leyes de Kepler",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Tercera Ley de Kepler establece que para cualquier planeta del Sistema Solar, el cuadrado de su periodo orbital (T²) es proporcional a:",
    "opciones": [
      "A. El cubo de la distancia del semieje mayor de su órbita (a³)",
      "B. El cuadrado de la masa del planeta",
      "C. La raíz cuadrada del radio orbital",
      "D. La excentricidad de la elipse orbital al cuadrado"
    ],
    "correcta": 0,
    "explicacion": "La 3ª Ley de Kepler formula T² = (4π² / GM) a³, lo que demuestra que el cociente T²/a³ es una constante idéntica para todos los cuerpos que orbitan la misma masa central."
  },
  {
    "id": 340,
    "area": "Rotación y Gravitación",
    "subtema": "Velocidad de Escape",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la expresión teórica para la velocidad de escape ve desde la superficie de un cuerpo esférico de masa M y radio R (despreciando la resistencia atmosférica)?",
    "opciones": [
      "A. ve = √(GM / R)",
      "B. ve = √(2GM / R)",
      "C. ve = 2GM / R²",
      "D. ve = √(GM / 2R)"
    ],
    "correcta": 1,
    "explicacion": "Igualando la energía mecánica total a cero en el infinito (1/2 m ve² - GMm/R = 0), se deduce que ve = √(2GM/R). Para la Tierra equivale a aproximadamente 11.2 km/s."
  },
  {
    "id": 341,
    "area": "Rotación y Gravitación",
    "subtema": "Mecánica Orbital",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un satélite en órbita geoestacionaria debe ubicarse necesariamente sobre el plano del ecuador terrestre?",
    "opciones": [
      "A. Para evitar la radiación de los cinturones de Van Allen",
      "B. Porque solo allí el centro de atracción gravitatoria terrestre coincide con el centro de la órbita circular sin oscilaciones norte-sur",
      "C. Porque la densidad de la atmósfera en el ecuador es menor",
      "D. Por el efecto de repulsión del campo magnético polar"
    ],
    "correcta": 1,
    "explicacion": "El plano de cualquier órbita inercial debe contener el centro de masa de la Tierra. Si una órbita sincrónica de 24 h estuviese inclinada, el satélite oscilaría periódicamente de norte a sur visto desde el suelo (analema en 8)."
  },
  {
    "id": 342,
    "area": "Rotación y Gravitación",
    "subtema": "Puntos de Lagrange",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué propiedad geométrica y gravitatoria define al punto de Lagrange L₂ del sistema Sol-Tierra, donde opera el telescopio espacial James Webb?",
    "opciones": [
      "A. Está ubicado exactamente entre el Sol y la Tierra a medio camino",
      "B. Está situado en la línea Sol-Tierra detrás de la Tierra a 1.5 millones de km, donde las fuerzas gravitatorias combinadas proporcionan la aceleración centrípeta justa para igualar el periodo terrestre",
      "C. Es el punto donde el campo magnético del Sol anula al de la Tierra",
      "D. Es el vértice de un triángulo equilátero que forma 60° adelante de la Tierra"
    ],
    "correcta": 1,
    "explicacion": "En L₂, la atracción gravitatoria combinada de la Tierra y el Sol se suma para que un objeto a mayor distancia del Sol complete una órbita en exactamente 1 año, manteniendo constante su alineación respecto al eje Sol-Tierra."
  },
  {
    "id": 343,
    "area": "Rotación y Gravitación",
    "subtema": "Dinámica Rotacional",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una esfera sólida y un cilindro sólido de igual masa M y radio R ruedan sin deslizar desde el reposo por el mismo plano inclinado. ¿Cuál llega primero a la base?",
    "opciones": [
      "A. Ambos llegan al mismo tiempo porque tienen idéntica masa y radio",
      "B. El cilindro sólido, porque tiene mayor momento de inercia",
      "C. La esfera sólida, porque tiene menor momento de inercia (2/5 MR² vs 1/2 MR²) y destina menor fracción de energía potencial a rotación",
      "D. Depende del ángulo de inclinación del plano"
    ],
    "correcta": 2,
    "explicacion": "La aceleración en rodadura sin deslizamiento es a = g senθ / (1 + I/(MR²)). Para la esfera I/(MR²) = 0.40, mientras que para el cilindro es 0.50. Al tener menor inercia rotacional, la esfera acelera más y llega primero."
  },
  {
    "id": 344,
    "area": "Rotación y Gravitación",
    "subtema": "Momento Angular",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando un patinador sobre hielo en rotación encoge sus brazos hacia el torso, su velocidad angular de giro aumenta notablemente. ¿Qué principio físico explica este fenómeno?",
    "opciones": [
      "A. Conservación de la energía cinética rotacional únicamente",
      "B. Conservación del momento angular (L = Iω = constante) al reducir su momento de inercia",
      "C. La fuerza de Coriolis generada por el movimiento de sus brazos",
      "D. El rozamiento nulo con el hielo que genera un torque acelerador externo"
    ],
    "correcta": 1,
    "explicacion": "Al no existir un torque neto externo sobre el patinador (τ_ext = 0), el momento angular L = Iω se conserva. Al acercar masa al eje, el momento de inercia I disminuye, obligando a ω a aumentar en compensación."
  },
  {
    "id": 345,
    "area": "Cinemática Clásica",
    "subtema": "Fuerzas Ficticias",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En el hemisferio norte de la Tierra, un proyectil de largo alcance disparado hacia el norte se desvía aparentemente hacia la derecha de su trayectoria. ¿A qué fuerza inercial se atribuye este desvío en el sistema de referencia terrestre?",
    "opciones": [
      "A. A la fuerza centrífuga",
      "B. A la aceleración de Euler",
      "C. A la fuerza de Coriolis (F_c = -2m ω × v)",
      "D. Al gradiente de presión atmosférica polar"
    ],
    "correcta": 2,
    "explicacion": "La fuerza de Coriolis es una fuerza ficticia que surge en sistemas de referencia en rotación cuando un cuerpo posee velocidad v respecto al sistema giratorio: F = -2m(ω × v). En el hemisferio norte desvía trayectorias hacia la derecha."
  },
  {
    "id": 346,
    "area": "Dinámica y Fuerzas",
    "subtema": "Péndulo de Foucault",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué demostró históricamente Léon Foucault en 1851 mediante la oscilación de su célebre péndulo esférico en el Panteón de París?",
    "opciones": [
      "A. La constancia de la velocidad de la luz en cualquier medio",
      "B. La rotación intrínseca de la Tierra respecto a las estrellas lejanas sin recurrir a observaciones celestes",
      "C. La naturaleza puramente corpuscular de la gravedad",
      "D. La existencia de las corrientes oceánicas profundas"
    ],
    "correcta": 1,
    "explicacion": "El plano de oscilación del péndulo de Foucault permanece invariante en el espacio inercial mientras la Tierra rota bajo él, haciendo que el plano parezca girar en el marco del observador terrestre con periodo T = 24 h / sen(latitud)."
  },
  {
    "id": 347,
    "area": "Dinámica y Fuerzas",
    "subtema": "Fricción y Rozamiento",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el coeficiente de rozamiento estático (μs) entre dos sólidos suele ser estrictamente mayor que el coeficiente cinético (μk)?",
    "opciones": [
      "A. Porque en reposo las micro-asperezas microscópicas tienen tiempo de asentarse y formar micro-soldaduras de contacto íntimo",
      "B. Porque la fuerza normal disminuye tan pronto como el objeto comienza a deslizar",
      "C. Porque en movimiento la temperatura funde por completo las superficies",
      "D. Es un error experimental; en realidad ambos coeficientes son rigurosamente iguales"
    ],
    "correcta": 0,
    "explicacion": "En reposo, la presión en las asperezas microscópicas favorece la deformación plástica local y la adhesión intermolecular (adhesión de junturas). Al iniciar el deslizamiento, las asperezas saltan y se fracturan continuamente con menor adherencia."
  },
  {
    "id": 348,
    "area": "Dinámica y Fuerzas",
    "subtema": "Curvas Peraltadas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En una pista de carreras con curva circular de radio R diseñada a un ángulo de peralte θ sin necesidad de rozamiento, la rapidez óptima v viene dada por:",
    "opciones": [
      "A. v = √(g R tan θ)",
      "B. v = g R cos θ",
      "C. v = √(g R / sin θ)",
      "D. v = 2 g R tan² θ"
    ],
    "correcta": 0,
    "explicacion": "En ausencia de fricción, la componente vertical de la normal equilibra el peso (N cosθ = mg) y la horizontal suministra la aceleración centrípeta (N senθ = m v²/R). Al dividir miembro a miembro resulta tanθ = v²/(gR), luego v = √(gR tanθ)."
  },
  {
    "id": 349,
    "area": "Trabajo y Energía",
    "subtema": "Fuerzas Conservativas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál de las siguientes condiciones define formalmente a una fuerza conservativa F en el espacio tridimensional?",
    "opciones": [
      "A. El trabajo que realiza a lo largo de cualquier trayectoria cerrada es idénticamente cero (∮ F · dr = 0)",
      "B. Su magnitud debe ser inversamente proporcional al tiempo al cuadrado",
      "C. Debe depender exclusivamente de la velocidad instantánea de la partícula",
      "D. Solo puede actuar en una dimensión espacial"
    ],
    "correcta": 0,
    "explicacion": "Una fuerza es conservativa si su trabajo a lo largo de cualquier curva cerrada es nulo (∮ F · dr = 0), lo que equivale matemáticamente a que su rotacional sea nulo (∇ × F = 0) y provenga del gradiente de una energía potencial (F = -∇U)."
  },
  {
    "id": 350,
    "area": "Trabajo y Energía",
    "subtema": "Péndulo Balístico",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un experimento clásico con péndulo balístico donde un proyectil de masa m se incrusta en un bloque de madera suspendido de masa M:",
    "opciones": [
      "A. Se conserva la energía mecánica cinética durante el impacto del proyectil",
      "B. Se conserva el momento lineal durante el impacto instantáneo, pero se disipa energía cinética mecánica en forma de calor y deformación",
      "C. No se conserva ninguna magnitud física hasta que el péndulo alcanza su altura máxima",
      "D. La masa del proyectil desaparece y se transforma en energía electromagnética"
    ],
    "correcta": 1,
    "explicacion": "La colisión es perfectamente inelástica: las fuerzas internas del choque son enormes en un tiempo brevísimo, por lo que el momento lineal se conserva estrictamente (p_inicial = p_final), pero una gran fracción de energía cinética se degrada en deformación y calor."
  },
  {
    "id": 351,
    "area": "Rotación y Gravitación",
    "subtema": "Teorema de Steiner",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Teorema de los Ejes Paralelos (o Teorema de Steiner) permite calcular el momento de inercia I de un sólido de masa M respecto a un eje paralelo situado a una distancia d del centro de masa mediante:",
    "opciones": [
      "A. I = I_cm - M d²",
      "B. I = I_cm + M d²",
      "C. I = I_cm · d² / M",
      "D. I = √(I_cm² + M² d⁴)"
    ],
    "correcta": 1,
    "explicacion": "El teorema establece I = I_cm + Md². Demuestra que el momento de inercia respecto al eje que pasa por el centro de masa es siempre el mínimo absoluto entre todos los ejes paralelos de rotación posibles."
  },
  {
    "id": 352,
    "area": "Rotación y Gravitación",
    "subtema": "Giroscopios y Precesión",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Cuando un giroscopio simétrico que gira a muy alta velocidad angular ω alrededor de su eje de simetría experimenta un torque gravitacional perpendicular τ, ¿cuál es su comportamiento dinámico?",
    "opciones": [
      "A. Cae inmediatamente al suelo de forma idéntica a un cuerpo en reposo",
      "B. Describe una precesión regular donde el eje de giro rota horizontalmente con velocidad angular Ω_p = τ / L",
      "C. Su velocidad angular de giro ω se anula instantáneamente",
      "D. Acelera en caída libre desafiando la conservación de energía"
    ],
    "correcta": 1,
    "explicacion": "Dado que τ = dL/dt y L = Iω es un vector horizontal grande, el cambio infinitesimal dL es perpendicular a L, obligando al vector momento angular a rotar en un círculo horizontal (precesión giroscópica) con rapidez Ω_p = τ/(Iω)."
  },
  {
    "id": 353,
    "area": "Cinemática Clásica",
    "subtema": "Tiro Parabólico",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En ausencia de resistencia del aire y en terreno plano horizontal, ¿con qué ángulo de elevación respecto al horizonte se obtiene el alcance horizontal máximo para una misma rapidez de disparo inicial?",
    "opciones": [
      "A. 30°",
      "B. 45°",
      "C. 60°",
      "D. 90°"
    ],
    "correcta": 1,
    "explicacion": "El alcance horizontal es R = (v₀² / g) sen(2θ). El valor máximo de la función trigonométrica seno es 1, lo cual ocurre cuando sen(2θ) = 1, es decir, cuando 2θ = 90°, lo que implica θ = 45°."
  },
  {
    "id": 354,
    "area": "Dinámica y Fuerzas",
    "subtema": "Velocidad Límite",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Un paracaidista en caída libre alcanza su 'velocidad terminal' o límite cuando:",
    "opciones": [
      "A. La aceleración de la gravedad se vuelve cero debido a la gran altitud",
      "B. La fuerza aerodinámica de arrastre hacia arriba iguala en magnitud al peso del paracaidista hacia abajo",
      "C. La energía potencial gravitatoria se agota por completo",
      "D. La densidad del aire se hace infinita"
    ],
    "correcta": 1,
    "explicacion": "La fuerza neta es F_net = mg - F_arrastre. A medida que la rapidez aumenta, el arrastre aerodinámico crece proporcionalmente a v². Cuando F_arrastre = mg, la fuerza neta es cero, la aceleración se anula y la velocidad se vuelve constante."
  },
  {
    "id": 355,
    "area": "Oscilaciones y Ondas",
    "subtema": "Movimiento Armónico Simple",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un oscilador armónico simple masa-resorte, ¿dónde se alcanza el valor máximo de la aceleración del bloque?",
    "opciones": [
      "A. Al pasar exactamente por la posición de equilibrio central (x = 0)",
      "B. En los extremos del recorrido (amplitudes x = ±A) donde la deformación del resorte es máxima",
      "C. En el punto medio entre el equilibrio y el extremo (x = A/2)",
      "D. La aceleración es constante en todo el movimiento oscilatorio"
    ],
    "correcta": 1,
    "explicacion": "Por la Ley de Hooke y la 2ª Ley de Newton, a = -(k/m)x = -ω²x. La aceleración es proporcional al desplazamiento respecto al equilibrio, alcanzando su magnitud máxima |a_max| = ω²A en los puntos de máxima elongación x = ±A."
  },
  {
    "id": 356,
    "area": "Oscilaciones y Ondas",
    "subtema": "Péndulo Físico",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el periodo T de pequeñas oscilaciones de un péndulo físico (o compuesto) de masa total M y momento de inercia I respecto al eje de suspensión, cuyo centro de masa dista d de dicho eje?",
    "opciones": [
      "A. T = 2π √(I / (M g d))",
      "B. T = 2π √(M g d / I)",
      "C. T = 2π √(I / M)",
      "D. T = 2π √(d / g)"
    ],
    "correcta": 0,
    "explicacion": "La ecuación diferencial del péndulo compuesto para ángulos pequeños es I d²θ/dt² + Mgd θ = 0, cuya frecuencia natural es ω = √(Mgd/I). Por tanto, el periodo es T = 2π/ω = 2π √(I/(Mgd))."
  },
  {
    "id": 357,
    "area": "Oscilaciones y Ondas",
    "subtema": "Resonancia Mecánica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ocurre físicamente cuando la frecuencia de una fuerza excitadora externa coincide con la frecuencia natural propia de un sistema oscilatorio con poco amortiguamiento?",
    "opciones": [
      "A. La oscilación se extingue instantáneamente debido a interferencia destructiva",
      "B. Se produce el fenómeno de resonancia, con una transferencia óptima de energía que maximiza la amplitud de oscilación",
      "C. El sistema cambia permanentemente su masa inercial",
      "D. La velocidad de propagación de las ondas internas se reduce a cero"
    ],
    "correcta": 1,
    "explicacion": "En resonancia, la fuerza externa empuja en fase con la velocidad del oscilador en cada ciclo, maximizando la potencia transferida y generando amplitudes muy elevadas que en ingeniería pueden causar fallas estructurales."
  },
  {
    "id": 358,
    "area": "Rotación y Gravitación",
    "subtema": "Fuerzas de Marea",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué se producen dos mareas altas oceánicas por día en un punto dado de la Tierra y no solo una?",
    "opciones": [
      "A. Porque la Luna orbita la Tierra dos veces al día",
      "B. Por el gradiente gravitatorio diferencial: la Luna atrae más fuertemente el agua del lado cercano que al centro terrestre, y atrae más al centro terrestre que al agua del lado opuesto",
      "C. Por la reflexión de las ondas oceánicas en las costas continentales",
      "D. Por la interacción directa entre los vientos alisios y el campo magnético"
    ],
    "correcta": 1,
    "explicacion": "La fuerza de marea es una fuerza diferencial que decae con el cubo de la distancia (dF/dr ∝ 1/r³). Estira la Tierra a lo largo del eje Tierra-Luna, creando dos protuberancias o abultamientos opuestos simultáneos."
  },
  {
    "id": 359,
    "area": "Rotación y Gravitación",
    "subtema": "Momento de Inercia",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el momento de inercia de un anillo circular delgado (aro) de masa M y radio R respecto a su eje central perpendicular al plano del aro?",
    "opciones": [
      "A. I = 1/2 M R²",
      "B. I = M R²",
      "C. I = 2/5 M R²",
      "D. I = 1/12 M R²"
    ],
    "correcta": 1,
    "explicacion": "En un aro delgado, todos y cada uno de los elementos de masa dm se encuentran exactamente a la misma distancia R del eje de rotación, de modo que I = ∫ r² dm = R² ∫ dm = M R²."
  },
  {
    "id": 360,
    "area": "Trabajo y Energía",
    "subtema": "Conservación de Energía",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una partícula con energía mecánica total E se mueve en una región donde la función de energía potencial es U(x). ¿Qué caracteriza a los 'puntos de retorno' del movimiento?",
    "opciones": [
      "A. Son los puntos donde U(x) alcanza su mínimo absoluto",
      "B. Son las posiciones donde E = U(x), lo que anula la energía cinética y obliga a la partícula a invertir el sentido de su velocidad",
      "C. Son los puntos donde la aceleración es necesariamente nula",
      "D. Son puntos donde la fuerza es infinita"
    ],
    "correcta": 1,
    "explicacion": "Como la energía mecánica es E = K + U(x), la energía cinética es K = E - U(x). La partícula no puede penetrar en regiones donde U(x) > E (regiones clásicamente prohibidas). Donde U(x) = E, K = 0 (v = 0), invirtiéndose el movimiento."
  },
  {
    "id": 361,
    "area": "Dinámica y Fuerzas",
    "subtema": "Leyes de Newton",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un caballo tira hacia adelante de una carreta con una fuerza de 500 N. Por la Tercera Ley de Newton, la carreta ejerce sobre el caballo una fuerza de 500 N hacia atrás. ¿Por qué el conjunto logra acelerar hacia adelante?",
    "opciones": [
      "A. Porque la 3ª Ley de Newton no se aplica cuando los objetos están en movimiento",
      "B. Porque las dos fuerzas del par acción-reacción actúan sobre cuerpos diferentes y la fuerza externa hacia adelante del suelo sobre los cascos del caballo supera a la fricción de las ruedas",
      "C. Porque la fuerza del caballo es ligeramente mayor que la de la carreta en una milésima de segundo inicial",
      "D. Porque la inercia del caballo anula instantáneamente la fuerza de reacción"
    ],
    "correcta": 1,
    "explicacion": "Las fuerzas de acción y reacción nunca se anulan entre sí porque actúan sobre cuerpos distintos. El sistema caballo-carreta acelera porque la fuerza externa ejercida por el suelo sobre los cascos del caballo hacia adelante supera el rozamiento de las ruedas."
  },
  {
    "id": 362,
    "area": "Cinemática Clásica",
    "subtema": "Movimiento Circular",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un Movimiento Circular Uniforme (MCU) con radio R constante y rapidez escalar v constante, ¿cuál de las siguientes afirmaciones es rigurosamente correcta?",
    "opciones": [
      "A. La aceleración es cero porque la rapidez permanece inmutable",
      "B. La velocidad tangencial es constante como vector",
      "C. Existe una aceleración centrípeta no nula de magnitud a_c = v² / R orientada permanentemente hacia el centro de la trayectoria",
      "D. El vector aceleración es colineal con el vector velocidad tangencial"
    ],
    "correcta": 2,
    "explicacion": "Aunque la magnitud de la velocidad (rapidez) es constante, la dirección del vector velocidad cambia continuamente. Esta variación temporal de dirección requiere una aceleración perpendicular a la velocidad: a_c = v²/R apuntando al centro."
  },
  {
    "id": 363,
    "area": "Dinámica y Fuerzas",
    "subtema": "Centro de Masa",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si sobre un sistema cerrado de partículas la resultante de todas las fuerzas externas es nula (F_ext = 0), ¿cómo se mueve el centro de masa del sistema?",
    "opciones": [
      "A. Permanece en reposo o continúa en movimiento rectilíneo uniforme con velocidad vectorial constante",
      "B. Debe rotar necesariamente con momento angular creciente",
      "C. Describe una elipse alrededor del cuerpo de mayor masa",
      "D. Oscila armónicamente alrededor de su origen de coordenadas"
    ],
    "correcta": 0,
    "explicacion": "Por la 2ª Ley de Newton para sistemas de partículas, F_ext_total = M_total · a_cm. Si F_ext_total = 0, entonces a_cm = 0, lo que significa que la velocidad del centro de masa v_cm es estrictamente constante."
  },
  {
    "id": 364,
    "area": "Trabajo y Energía",
    "subtema": "Colisiones en Dos Dimensiones",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En una colisión elástica oblicua (no frontal) entre dos partículas de idéntica masa, estando una de ellas inicialmente en reposo, ¿qué ángulo forman entre sí sus trayectorias tras el choque?",
    "opciones": [
      "A. 45°",
      "B. 90° (ortogonales entre sí)",
      "C. 180°",
      "D. Depende de las densidades volumétricas de los materiales"
    ],
    "correcta": 1,
    "explicacion": "Conservando momento (v₀ = v₁ + v₂) y energía cinética (v₀² = v₁² + v₂²), se eleva la primera al cuadrado escalar: v₀² = v₁² + v₂² + 2(v₁ · v₂). Igualando ambas se concluye que v₁ · v₂ = 0, por lo que forman un ángulo recto de 90°."
  },
  {
    "id": 365,
    "area": "Rotación y Gravitación",
    "subtema": "Límite de Roche",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué fenómeno astrofísico define el 'Límite de Roche' para un satélite natural que orbita un planeta masivo?",
    "opciones": [
      "A. La distancia mínima a la que el satélite puede mantener su atmósfera sin que escape al espacio",
      "B. La distancia orbital crítica a partir de la cual las fuerzas de marea gravitacionales del planeta superan a la propia auto-gravedad del satélite, desintegrándolo en fragmentos",
      "C. El radio donde la velocidad orbital iguala a la velocidad de la luz",
      "D. La altitud donde el satélite se vuelve visible a simple vista desde el polo del planeta"
    ],
    "correcta": 1,
    "explicacion": "Dentro del límite de Roche, la fuerza de marea del cuerpo primario supera la atracción gravitatoria que mantiene cohesionado al satélite, rompiéndolo y generando típicamente sistemas de anillos planetarios como los de Saturno."
  },
  {
    "id": 366,
    "area": "Cinemática Clásica",
    "subtema": "Velocidad Relativa Clásica",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un bote navega corriente abajo (a favor de la corriente) por un río cuya agua se mueve a 3 m/s respecto a la orilla. Si el velocímetro del bote marca 7 m/s respecto al agua, ¿cuál es su velocidad respecto a la orilla?",
    "opciones": [
      "A. 4 m/s",
      "B. 7 m/s",
      "C. 10 m/s",
      "D. 21 m/s"
    ],
    "correcta": 2,
    "explicacion": "Por adición vectorial galileana de velocidades unidimensionales: v_bote/orilla = v_bote/agua + v_agua/orilla = 7 m/s + 3 m/s = 10 m/s."
  },
  {
    "id": 367,
    "area": "Rotación y Gravitación",
    "subtema": "Momento de Torsión y Equilibrio",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Para que un cuerpo rígido extendido se encuentre en equilibrio estático mecánico completo, deben cumplirse simultáneamente dos condiciones independientes:",
    "opciones": [
      "A. Fuerza neta nula (∑ F = 0) y momento de torsión neto nulo respecto a cualquier punto (∑ τ = 0)",
      "B. Energía potencial mínima y aceleración angular máxima",
      "C. Velocidad constante no nula y rozamiento nulo",
      "D. Masa total nula y centro de gravedad en el infinito"
    ],
    "correcta": 0,
    "explicacion": "El equilibrio estático exige ausencia de aceleración traslacional (∑ F = 0) y ausencia de aceleración angular rotacional (∑ τ = 0) respecto a cualquier eje de referencia."
  },
  {
    "id": 368,
    "area": "Mecánica de Fluidos",
    "subtema": "Principio de Pascal",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "El Principio de Pascal establece que cualquier incremento de presión aplicado a la superficie de un fluido incompresible en reposo dentro de un recipiente cerrado se transmite:",
    "opciones": [
      "A. Únicamente hacia el fondo del recipiente",
      "B. Con igual intensidad en todas las direcciones y a todos los puntos del fluido y de las paredes",
      "C. Disminuyendo exponencialmente con la distancia al punto de aplicación",
      "D. Solo a lo largo de las líneas verticales de gravedad"
    ],
    "correcta": 1,
    "explicacion": "El Principio de Pascal demuestra que en un fluido confinado e incompresible, la presión se propaga de manera isotrópica e íntegra, principio fundamental de los frenos y prensas hidráulicas (F₁/A₁ = F₂/A₂)."
  },
  {
    "id": 369,
    "area": "Mecánica de Fluidos",
    "subtema": "Principio de Arquímedes",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un bloque de hierro y un bloque de madera de exactamente el mismo volumen (1 litro) se sumergen completamente en agua. ¿Cuál experimenta mayor fuerza de empuje hidrostático?",
    "opciones": [
      "A. El de hierro, porque tiene mucho mayor peso y densidad",
      "B. El de madera, porque tiende a flotar naturalmente",
      "C. Ambos experimentan exactamente la misma fuerza de empuje",
      "D. Ninguno experimenta empuje cuando están totalmente sumergidos"
    ],
    "correcta": 2,
    "explicacion": "Por el Principio de Arquímedes, el empuje depende exclusivamente del peso del fluido desalojado: E = ρ_fluido · g · V_sumergido. Al tener idéntico volumen sumergido y estar en el mismo fluido, el empuje es exactamente igual para ambos."
  },
  {
    "id": 370,
    "area": "Mecánica de Fluidos",
    "subtema": "Ecuación de Continuidad",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Por una tubería horizontal fluye agua en régimen estacionario e incompresible. Si la sección transversal del tubo se reduce a la mitad (A₂ = A₁/2), ¿qué ocurre con la rapidez del fluido?",
    "opciones": [
      "A. Se reduce a la mitad",
      "B. Se duplica (v₂ = 2 v₁)",
      "C. Se cuadruplica",
      "D. Permanece rigurosamente constante"
    ],
    "correcta": 1,
    "explicacion": "Por la ecuación de continuidad para fluidos incompresibles, el caudal volumétrico es constante: Q = A₁ v₁ = A₂ v₂. Si el área se reduce a la mitad, la velocidad debe duplicarse para conservar el flujo de masa."
  },
  {
    "id": 371,
    "area": "Mecánica de Fluidos",
    "subtema": "Ecuación de Bernoulli",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "De acuerdo con el Principio de Bernoulli para un fluido ideal en flujo laminar horizontal, en aquellas zonas donde la velocidad de flujo aumenta:",
    "opciones": [
      "A. La presión estática disminuye",
      "B. La presión estática aumenta en proporción cuadrática",
      "C. La temperatura se eleva hasta el punto de ebullición",
      "D. La densidad del fluido se reduce a cero"
    ],
    "correcta": 0,
    "explicacion": "La ecuación de Bernoulli P + 1/2 ρv² + ρgh = constante implica que a lo largo de una línea de corriente horizontal (h constante), un aumento en la energía cinética (velocidad) conlleva necesariamente una disminución en la presión estática P."
  },
  {
    "id": 372,
    "area": "Mecánica de Fluidos",
    "subtema": "Teorema de Torricelli",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un tanque grande abierto a la atmósfera contiene agua hasta una altura H. Si se perfora un orificio pequeño a una profundidad h por debajo de la superficie libre del agua, la rapidez de salida del chorro es:",
    "opciones": [
      "A. v = √(g h)",
      "B. v = √(2 g h)",
      "C. v = 2 g h",
      "D. v = √(2 g H)"
    ],
    "correcta": 1,
    "explicacion": "El Teorema de Torricelli es una consecuencia directa de Bernoulli: la velocidad de descarga a profundidad h es idéntica a la que adquiriría un cuerpo en caída libre desde esa misma altura: v = √(2gh)."
  },
  {
    "id": 373,
    "area": "Mecánica de Fluidos",
    "subtema": "Tubo de Pitot",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué mide específicamente el tubo de Pitot instalado en el fuselaje exterior de los aviones?",
    "opciones": [
      "A. La altitud absoluta mediante radiación infrarroja",
      "B. La velocidad de la aeronave respecto al aire circundante midiendo la diferencia entre la presión total (de estancamiento) y la presión estática",
      "C. El consumo instantáneo de combustible por turbina",
      "D. La temperatura de ignición del motor"
    ],
    "correcta": 1,
    "explicacion": "El tubo de Pitot convierte la energía cinética del aire en un punto de estancamiento (v=0) donde P_total = P_estatica + 1/2 ρ v². Al medir la diferencia P_total - P_estatica, se determina la velocidad relativa del aire v = √(2ΔP/ρ)."
  },
  {
    "id": 374,
    "area": "Mecánica de Fluidos",
    "subtema": "Efecto Magnus",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En deportes de pelota como squash, tenis o fútbol, una bola con efecto de rotación (spin) describe una trayectoria curvada en el aire. ¿Cómo se denomina y origina este efecto físico?",
    "opciones": [
      "A. Efecto Venturi, debido únicamente a la gravedad",
      "B. Efecto Magnus: la rotación arrastra la capa límite de aire, acelerando el flujo en un lado y frenándolo en el opuesto, lo que genera una diferencia de presión neta lateral",
      "C. Efecto Doppler por reflexión de ondas acústicas",
      "D. Efecto Fotoeléctrico superficial del recubrimiento de la pelota"
    ],
    "correcta": 1,
    "explicacion": "El efecto Magnus surge por la asimetría en la velocidad relativa del aire respecto a la superficie giratoria: el lado que acompaña el giro acelera el aire (menor presión según Bernoulli) y el opuesto lo frena (mayor presión), creando una fuerza neta perpendicular."
  },
  {
    "id": 375,
    "area": "Mecánica de Fluidos",
    "subtema": "Viscosidad y Ley de Poiseuille",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Poiseuille para flujo laminar estacionario de un líquido viscoso a través de un tubo cilíndrico de radio r y longitud L establece que el caudal volumétrico Q es proporcional a:",
    "opciones": [
      "A. El radio del tubo r al cuadrado",
      "B. La cuarta potencia del radio del tubo (r⁴)",
      "C. La raíz cuadrada de la viscosidad del líquido",
      "D. La longitud del tubo elevada al cuadrado"
    ],
    "correcta": 1,
    "explicacion": "La fórmula de Poiseuille es Q = (π ΔP r⁴) / (8 η L). La fortísima dependencia con r⁴ explica por qué una pequeña reducción en el diámetro de una arteria o tubería disminuye drásticamente el caudal de flujo sanguíneo o hidráulico."
  },
  {
    "id": 376,
    "area": "Mecánica de Fluidos",
    "subtema": "Número de Reynolds",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué representa físicamente el Número de Reynolds (Re = ρ v D / μ) en la dinámica de fluidos?",
    "opciones": [
      "A. La relación entre las fuerzas elásticas y las térmicas",
      "B. La relación adimensional entre las fuerzas inerciales y las fuerzas viscosas en el seno del fluido",
      "C. La velocidad del sonido en el fluido dividida por la velocidad de la luz",
      "D. La densidad del fluido normalizada a la del mercurio"
    ],
    "correcta": 1,
    "explicacion": "Re compara las fuerzas inerciales (ρ v²) con las fuerzas viscosas (μ v / D). Valores bajos (Re < 2000 en tuberías) corresponden a régimen laminar suave, mientras que valores altos (Re > 4000) indican predominio de inercia y régimen caótico turbulento."
  },
  {
    "id": 377,
    "area": "Mecánica de Fluidos",
    "subtema": "Ley de Stokes",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la fuerza de resistencia hidrodinámica (arrastre viscoso) que experimenta una pequeña esfera de radio r que se desplaza a baja velocidad v en un fluido de viscosidad η (Ley de Stokes)?",
    "opciones": [
      "A. F = 6 π η r v",
      "B. F = 1/2 ρ v² π r²",
      "C. F = 4/3 π r³ η v²",
      "D. F = 2 π η r / v"
    ],
    "correcta": 0,
    "explicacion": "Sir George Stokes derivó analíticamente que para números de Reynolds muy bajos (Re << 1), la resistencia sobre una esfera en un medio viscoso lineal es exactamente F_d = 6πηrv, clave histórica en el experimento de Millikan de la gota de aceite."
  },
  {
    "id": 378,
    "area": "Mecánica de Fluidos",
    "subtema": "Tensión Superficial",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué las gotas de líquido libres en ausencia de gravedad o suspendidas en el aire tienden espontáneamente a adoptar una geometría esférica?",
    "opciones": [
      "A. Por la presión de radiación electromagnética exterior",
      "B. Porque la esfera es el cuerpo geométrico que minimiza el área superficial para un volumen dado, minimizando así la energía libre de tensión superficial",
      "C. Por repulsión electrostática entre los electrones periféricos",
      "D. Porque la densidad interna es heterogénea"
    ],
    "correcta": 1,
    "explicacion": "Las moléculas en la superficie poseen mayor energía potencial que las del interior debido a enlaces incompletos. La tensión superficial minimiza dicha energía reduciendo el área exterior al mínimo absoluto, lo cual geométricamente corresponde a una esfera."
  },
  {
    "id": 379,
    "area": "Mecánica de Fluidos",
    "subtema": "Capilaridad y Ley de Jurin",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando se introduce un tubo capilar de vidrio muy fino y vertical en agua, el líquido asciende espontáneamente hasta una altura h (Ley de Jurin). Esto ocurre debido a que:",
    "opciones": [
      "A. Las fuerzas de cohesión intermoleculares del agua superan a las fuerzas de adhesión con el vidrio",
      "B. Las fuerzas de adhesión entre las moléculas de agua y las paredes de vidrio superan a las fuerzas de cohesión internas del agua",
      "C. La presión atmosférica en el interior del tubo se anula por completo",
      "D. El agua hierve a temperatura ambiente dentro del capilar"
    ],
    "correcta": 1,
    "explicacion": "Cuando la adhesión líquido-sólido supera la cohesión interna (líquido que 'moja', ángulo de contacto θ < 90°), el menisco resultante es cóncavo y la tensión superficial jala la columna hacia arriba hasta equilibrar su peso: h = 2γ cosθ / (ρ g r)."
  },
  {
    "id": 380,
    "area": "Mecánica de Fluidos",
    "subtema": "Cavitación",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En bombas hidráulicas e hélices marinas que giran a alta velocidad, la 'cavitación' es un fenómeno sumamente destructivo caracterizado por:",
    "opciones": [
      "A. La cristalización instantánea del agua en hielo",
      "B. La formación e implosión violenta de burbujas de vapor en regiones donde la presión local cae por debajo de la presión de vapor del líquido",
      "C. La electrólisis del agua en hidrógeno y oxígeno gaseoso",
      "D. La desmagnetización espontánea del eje de transmisión"
    ],
    "correcta": 1,
    "explicacion": "Si la velocidad del flujo es tan alta que la presión cae por debajo de la presión de vapor a esa temperatura, el líquido hierve a temperatura ambiente. Al alcanzar luego zonas de mayor presión, estas microburbujas colapsan violentamente erosionando el metal."
  },
  {
    "id": 381,
    "area": "Mecánica de Fluidos",
    "subtema": "Fluidos No Newtonianos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una suspensión concentrada de almidón de maíz en agua (oobleck) se comporta como un líquido cuando se manipula lentamente, pero se vuelve extremadamente rígida al golpearla con fuerza. ¿Cómo se clasifica reológicamente este fluido?",
    "opciones": [
      "A. Fluido dilatante (shear-thickening), cuya viscosidad aparente se incrementa con la tasa de deformación por cizalladura",
      "B. Fluido pseudoplástico (shear-thinning)",
      "C. Fluido newtoniano perfecto",
      "D. Fluido superfluido sin viscosidad"
    ],
    "correcta": 0,
    "explicacion": "Los fluidos dilatantes o reopécticos presentan un aumento drástico de su viscosidad aparente cuando se les aplica una tasa de corte o deformación súbita, mientras que los fluidos pseudoplásticos (como la pintura o el kétchup) se vuelven más fluidos al batirlos."
  },
  {
    "id": 382,
    "area": "Mecánica de Fluidos",
    "subtema": "Paradoja Hidrostática",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Se tienen tres recipientes de formas muy disímiles (uno cónico, uno cilíndrico y uno esférico ensanchado) con la misma área de fondo A y llenos del mismo líquido hasta exactamente la misma altura h. ¿Cómo es la fuerza hidrostática en el fondo?",
    "opciones": [
      "A. Mayor en el recipiente que contiene mayor masa total de líquido",
      "B. Menor en el recipiente cónico estrecho",
      "C. Idéntica en los tres recipientes (F = ρ g h A)",
      "D. Cero en todos debido al principio de equilibrio estático"
    ],
    "correcta": 2,
    "explicacion": "La paradoja de Stevin demuestra que la presión en el fondo de un líquido solo depende de la profundidad y la densidad (P = ρgh), no de la geometría de las paredes ni del volumen total. Al tener igual área A, la fuerza neta F = P·A es idéntica en los tres."
  },
  {
    "id": 383,
    "area": "Mecánica de Fluidos",
    "subtema": "Presión Barométrica",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué Evangelista Torricelli utilizó mercurio en lugar de agua para construir el primer barómetro en 1643?",
    "opciones": [
      "A. Porque el agua no experimenta atracción gravitacional",
      "B. Porque el mercurio es 13.6 veces más denso que el agua, lo que permitió equilibrar la presión atmosférica con una columna de solo 76 cm en vez de más de 10 metros",
      "C. Porque el mercurio es transparente a la radiación térmica",
      "D. Porque el agua no cabe en tubos de vidrio"
    ],
    "correcta": 1,
    "explicacion": "Como P_atm = ρ g h, para equilibrar ~101,325 Pa el agua requeriría un tubo de más de 10.3 metros de altura. Al usar mercurio líquido (ρ ≈ 13,600 kg/m³), la columna requerida fue de apenas 760 mm (76 cm)."
  },
  {
    "id": 384,
    "area": "Mecánica de Fluidos",
    "subtema": "Flotabilidad Neutral",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un submarino se sumerge a profundidad constante en el océano en estado de 'flotabilidad neutral'. Para lograrlo, los tanques de lastre deben ajustarse de manera que:",
    "opciones": [
      "A. La masa total del submarino dividida por su volumen total sea estrictamente igual a la densidad media del agua de mar a esa profundidad",
      "B. El peso del submarino sea el doble de la fuerza de empuje",
      "C. Toda el agua interna de lastre sea expulsada completamente",
      "D. Los motores de propulsión funcionen permanentemente a máxima potencia hacia arriba"
    ],
    "correcta": 0,
    "explicacion": "La flotabilidad neutral se alcanza cuando el peso del objeto iguala con precisión milimétrica al empuje de Arquímedes (W = E), lo que equivale a decir que la densidad promedio del submarino coincide exactamente con la densidad del agua circundante."
  },
  {
    "id": 385,
    "area": "Mecánica de Fluidos",
    "subtema": "Presión Manométrica",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si el manómetro del neumático de una bicicleta marca una presión de 4.0 bar (≈ 400 kPa), ¿cuál es la presión absoluta aproximada del aire en su interior considerando una presión atmosférica de 1.0 bar?",
    "opciones": [
      "A. 3.0 bar",
      "B. 4.0 bar",
      "C. 5.0 bar",
      "D. 8.0 bar"
    ],
    "correcta": 2,
    "explicacion": "La presión absoluta es la suma de la presión atmosférica local más la presión manométrica leída por el instrumento: P_abs = P_atm + P_man = 1.0 bar + 4.0 bar = 5.0 bar."
  },
  {
    "id": 386,
    "area": "Mecánica de Fluidos",
    "subtema": "Efecto Venturi",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el principio operativo de un pulverizador o atomizador clásico basado en el Efecto Venturi?",
    "opciones": [
      "A. Un chorro de aire rápido sobre la boca superior de un tubo vertical disminuye la presión local, haciendo que la presión atmosférica en el depósito empuje el líquido hacia arriba",
      "B. El líquido se calienta por microondas hasta salir por dilatación",
      "C. La gravedad atrae el fluido hacia la atmósfera",
      "D. Se crea un campo magnético que polariza el agua líquida"
    ],
    "correcta": 0,
    "explicacion": "Al pasar aire a alta velocidad por la boquilla (estrechamiento), la presión estática disminuye según Bernoulli. La mayor presión atmosférica sobre la superficie libre del líquido en el depósito lo impulsa a ascender por el tubo, donde el aire lo dispersa en gotas."
  },
  {
    "id": 387,
    "area": "Mecánica de Fluidos",
    "subtema": "Capa Límite",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En aerodinámica, la 'Capa Límite' descubierta por Ludwig Prandtl en 1904 es:",
    "opciones": [
      "A. La capa exterior de la atmósfera terrestre donde termina el aire respirable",
      "B. La delgada región de fluido adyacente a una superficie sólida donde los efectos de la fricción viscosa son determinantes y la velocidad relativa varía desde cero hasta la corriente libre",
      "C. Una pintura química que impide la condensación de vapor de agua en las alas",
      "D. La zona donde la temperatura del avión supera la barrera del calor"
    ],
    "correcta": 1,
    "explicacion": "Prandtl demostró que los efectos viscosos se concentran en una capa muy delgada pegada al cuerpo sólido debido a la condición de no-deslizamiento (v=0 en la pared), permitiendo tratar el resto del fluido exterior como prácticamente no viscoso."
  },
  {
    "id": 388,
    "area": "Mecánica de Fluidos",
    "subtema": "Arrastre Aerodinámico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La fuerza de resistencia aerodinámica que frena a un automóvil que viaja a alta velocidad por autopista es aproximadamente proporcional a:",
    "opciones": [
      "A. La raíz cuadrada de la velocidad",
      "B. La velocidad lineal simple (v)",
      "C. El cuadrado de la velocidad del vehículo (v²)",
      "D. La masa del automóvil dividida por su volumen"
    ],
    "correcta": 2,
    "explicacion": "En régimen turbulento inercial de alta velocidad (Re alto), la ecuación de arrastre es F_d = 1/2 ρ C_d A v². Duplicar la velocidad del automóvil cuadruplica la resistencia del aire y multiplica por ocho la potencia mecánica requerida para vencerla."
  },
  {
    "id": 389,
    "area": "Mecánica de Fluidos",
    "subtema": "Presión Osmótica",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué es la presión osmótica y cómo se describe para soluciones diluidas según la Ley de van 't Hoff?",
    "opciones": [
      "A. Es la presión gravitatoria que ejerce un gas noble en disolución acuosa",
      "B. Es la presión hidrostática requerida para detener el flujo espontáneo de solvente puro a través de una membrana semipermeable hacia una solución más concentrada: Π = i M R T",
      "C. Es la presión interna que hace estallar a los glóbulos rojos en agua salada",
      "D. Es la fuerza electromotriz generada por iones de sodio en reposo"
    ],
    "correcta": 1,
    "explicacion": "La ósmosis es el transporte espontáneo de disolvente hacia el medio hipertónico. La presión externa necesaria para frenar dicho flujo es la presión osmótica, descrita análogamente a la ecuación del gas ideal: Π = i (n/V) RT = iMRT."
  },
  {
    "id": 390,
    "area": "Mecánica de Fluidos",
    "subtema": "Manómetro de Tubo en U",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un manómetro en U abierto que contiene dos líquidos inmiscibles en equilibrio, las alturas de las columnas sobre la superficie de separación satisfacen que:",
    "opciones": [
      "A. El líquido de menor densidad tiene menor altura de columna",
      "B. La altura de cada líquido es inversamente proporcional a su densidad (ρ₁ h₁ = ρ₂ h₂)",
      "C. Las alturas siempre son idénticas sin importar la densidad",
      "D. El producto de las alturas es constante"
    ],
    "correcta": 1,
    "explicacion": "Al mismo nivel horizontal continuo del mismo líquido, la presión debe ser idéntica: P₀ + ρ₁ g h₁ = P₀ + ρ₂ g h₂. Por tanto, ρ₁ h₁ = ρ₂ h₂, lo que demuestra que el líquido menos denso necesita una columna más alta para equilibrar la presión."
  },
  {
    "id": 391,
    "area": "Mecánica de Fluidos",
    "subtema": "Vórtices y Circulación",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Teorema de Kutta-Joukowski en aerodinámica establece que la sustentación por unidad de envergadura L' generada sobre un cilindro o perfil alar es directamente proporcional a:",
    "opciones": [
      "A. L' = ρ_aire · v_infinito · Γ (donde Γ es la circulación de la velocidad alrededor del perfil)",
      "B. El peso molecular del aluminio de la aeronave",
      "C. La conductividad eléctrica de la atmósfera",
      "D. La aceleración de la gravedad al cuadrado"
    ],
    "correcta": 0,
    "explicacion": "El teorema fundamental de Kutta-Joukowski formaliza analíticamente la sustentación bidimensional en fluidos potenciales: L' = ρ v_∞ Γ. Demuestra que la generación de sustentación está unida intrínsecamente a la circulación hidrodinámica Γ generada."
  },
  {
    "id": 392,
    "area": "Mecánica de Fluidos",
    "subtema": "Densidad y Flotación",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué un enorme crucero transatlántico construido con decenas de miles de toneladas de acero flota pacíficamente en el mar, mientras que una simple aguja de acero se hunde?",
    "opciones": [
      "A. Porque el agua de mar no ejerce empuje sobre objetos pequeños",
      "B. Porque el barco contiene grandes volúmenes de aire interior que hacen que su densidad media total sea significativamente menor que la densidad del agua de mar",
      "C. Por la sal marina que repele químicamente al acero de gran tamaño",
      "D. Porque los motores del barco generan una corriente antigravitatoria constante"
    ],
    "correcta": 1,
    "explicacion": "La flotabilidad depende de la densidad promedio del objeto completo (masa total dividida por volumen exterior desplazado). Al ser hueco y lleno de aire, el volumen desplazado por el casco genera un empuje de Arquímedes colosal que supera al peso total."
  },
  {
    "id": 393,
    "area": "Termodinámica",
    "subtema": "Ley Cero de la Termodinámica",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la consecuencia conceptual más trascendental de la Ley Cero de la Termodinámica?",
    "opciones": [
      "A. Establece que la energía del universo es infinita",
      "B. Permite definir formalmente el concepto de temperatura y valida el uso de termómetros para comparar estados térmicos en equilibrio",
      "C. Prohíbe la transferencia de calor por radiación",
      "D. Determina el valor exacto del calor latente del agua"
    ],
    "correcta": 1,
    "explicacion": "La Ley Cero dice que si el cuerpo A está en equilibrio térmico con B, y B con C, entonces A y C están en equilibrio mutuo. Esta propiedad transitiva garantiza la existencia de una variable de estado universal llamada temperatura."
  },
  {
    "id": 394,
    "area": "Termodinámica",
    "subtema": "Primera Ley de la Termodinámica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En una expansión adiabática ideal de un gas encerrado en un cilindro con émbolo móvil (Q = 0):",
    "opciones": [
      "A. La energía interna aumenta porque el gas realiza trabajo",
      "B. La energía interna disminuye exactamente en la misma cantidad que el trabajo realizado por el gas (ΔU = -W), enfriándose el sistema",
      "C. La temperatura del gas se mantiene rigurosamente constante",
      "D. La presión permanece inalterada durante toda la expansión"
    ],
    "correcta": 1,
    "explicacion": "Por la 1ª Ley: ΔU = Q - W. En un proceso adiabático Q = 0, luego ΔU = -W. Al expandirse, el gas realiza trabajo positivo sobre el entorno (W > 0), a expensas directas de su propia energía interna (ΔU < 0), lo que provoca una caída de su temperatura."
  },
  {
    "id": 395,
    "area": "Termodinámica",
    "subtema": "Proceso Isotérmico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Durante la expansión isotérmica cuasiestática de un mol de gas ideal a temperatura T desde un volumen V₁ hasta V₂ = 2V₁, el calor neto absorbido por el gas es:",
    "opciones": [
      "A. Cero, porque la temperatura no cambia",
      "B. Q = R T ln(2), exactamente igual al trabajo realizado por el gas",
      "C. Q = 2 R T",
      "D. Q = -R T ln(2)"
    ],
    "correcta": 1,
    "explicacion": "En un gas ideal la energía interna U depende exclusivamente de la temperatura (U = f(T)). En un proceso isotérmico ΔT = 0, por lo que ΔU = 0. De la 1ª Ley se desprende que Q = W = ∫ P dV = ∫ (nRT/V) dV = nRT ln(V₂/V₁) = RT ln(2)."
  },
  {
    "id": 396,
    "area": "Termodinámica",
    "subtema": "Proceso Isobárico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un proceso termodinámico isobárico (a presión constante P constante), el trabajo mecánico realizado por el sistema sobre el entorno cuando su volumen varía desde V₁ hasta V₂ es:",
    "opciones": [
      "A. W = 0",
      "B. W = P (V₂ - V₁)",
      "C. W = P / (V₂ - V₁)",
      "D. W = n R ln(V₂ / V₁)"
    ],
    "correcta": 1,
    "explicacion": "La definición general de trabajo cuasiestático es W = ∫ P dV. Si la presión P se mantiene constante a lo largo de todo el proceso, sale de la integral dando directamente W = P ∫ dV = P(V₂ - V₁)."
  },
  {
    "id": 397,
    "area": "Termodinámica",
    "subtema": "Proceso Isocórico",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Cuando se suministra calor a un gas ideal encerrado dentro de un recipiente rígido e indeformable (volumen constante):",
    "opciones": [
      "A. El trabajo de expansión mecánica es nulo (W = 0) y todo el calor absorbido se destina a incrementar la energía interna (Q = ΔU)",
      "B. El calor absorbido se convierte íntegramente en trabajo mecánico útil",
      "C. La presión del gas cae a cero",
      "D. La temperatura disminuye"
    ],
    "correcta": 0,
    "explicacion": "Al ser el volumen constante (dV = 0), las paredes rígidas no se desplazan y el trabajo mecánico es nulo: W = ∫ P dV = 0. En consecuencia, por la 1ª Ley ΔU = Q, por lo que todo el calor transferido eleva la temperatura y presión del gas."
  },
  {
    "id": 398,
    "area": "Termodinámica",
    "subtema": "Segunda Ley de la Termodinámica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El enunciado de Clausius de la Segunda Ley de la Termodinámica establece fundamentalmente que:",
    "opciones": [
      "A. La energía se conserva en todas las transformaciones físicas",
      "B. Es imposible construir un proceso cíclico cuyo único resultado sea transferir calor espontáneamente desde un cuerpo de menor temperatura a otro de mayor temperatura",
      "C. Todos los motores térmicos tienen una eficiencia del 100%",
      "D. El cero absoluto de temperatura puede alcanzarse en un número finito de etapas"
    ],
    "correcta": 1,
    "explicacion": "El calor fluye espontáneamente solo de cuerpos calientes a fríos. Para transferir calor en sentido inverso (de un foco frío a uno caliente, como en una refrigeradora) es estrictamente necesario suministrar trabajo mecánico externo al sistema."
  },
  {
    "id": 399,
    "area": "Termodinámica",
    "subtema": "Enunciado de Kelvin-Planck",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué prohíbe formalmente el enunciado de Kelvin-Planck de la Segunda Ley de la Termodinámica?",
    "opciones": [
      "A. La existencia de procesos adiabáticos reversibles",
      "B. Una máquina térmica cíclica que absorba calor de un único foco térmico y lo transforme íntegramente en trabajo mecánico neto sin ceder calor a un foco más frío",
      "C. La dilatación de los metales al calentarse",
      "D. Que los gases ejerzan presión sobre las paredes"
    ],
    "correcta": 1,
    "explicacion": "Descarta la llamada 'máquina de movimiento continuo de segunda especie': no es posible extraer calor de un único depósito (por ejemplo, del océano) y convertirlo 100% en trabajo sin disponer de un foco sumidero a menor temperatura."
  },
  {
    "id": 400,
    "area": "Termodinámica",
    "subtema": "Ciclo de Carnot",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una máquina térmica ideal de Carnot opera entre un foco caliente a 600 K y un foco frío a 300 K. ¿Cuál es su rendimiento térmico teórico?",
    "opciones": [
      "A. 100%",
      "B. 75%",
      "C. 50%",
      "D. 25%"
    ],
    "correcta": 2,
    "explicacion": "La eficiencia del ciclo reversible de Carnot depende solo de las temperaturas absolutas de los focos: η = 1 - T_C / T_H = 1 - (300 K / 600 K) = 1 - 0.50 = 0.50, es decir, el 50%."
  },
  {
    "id": 401,
    "area": "Termodinámica",
    "subtema": "Entropía y Flecha del Tiempo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En cualquier proceso termodinámico espontáneo o irreversible que ocurra dentro de un sistema aislado del universo:",
    "opciones": [
      "A. La entropía total del sistema disminuye continuamente",
      "B. La entropía total del sistema permanece rigurosamente igual a cero",
      "C. La entropía total del sistema aumenta estrictamente (ΔS_aislado > 0)",
      "D. La temperatura se vuelve infinita"
    ],
    "correcta": 2,
    "explicacion": "El Principio del Incremento de Entropía establece que para todo proceso real (irreversible) en un sistema aislado, la entropía siempre crece: dS ≥ dQ/T, con dS > 0 para procesos irreversibles. Esto define la dirección o 'flecha termodinámica' del tiempo."
  },
  {
    "id": 402,
    "area": "Termodinámica",
    "subtema": "Fórmula de Boltzmann",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La célebre fórmula estadística de Ludwig Boltzmann grabada en su lápida en Viena vincula la entropía macroscópica S con el número de microestados accesibles Ω mediante:",
    "opciones": [
      "A. S = k_B ln(Ω)",
      "B. S = Ω / k_B",
      "C. S = k_B · Ω²",
      "D. S = h · c · ln(Ω)"
    ],
    "correcta": 0,
    "explicacion": "S = k_B ln Ω conecta magistralmente la termodinámica macroscópica con la probabilidad microscópica, donde k_B es la constante de Boltzmann y Ω es la multiplicidad o número de configuraciones cuánticas microscópicas compatibles con el macroestado."
  },
  {
    "id": 403,
    "area": "Termodinámica",
    "subtema": "Tercera Ley de la Termodinámica",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué establece el Teorema de Nernst o Tercera Ley de la Termodinámica cuando la temperatura de un sistema físico se aproxima asintóticamente al cero absoluto (0 Kelvin)?",
    "opciones": [
      "A. La masa de los átomos se duplica",
      "B. La entropía de cualquier sustancia pura cristalina en equilibrio termodinámico perfecto tiende a un valor constante independiente e igual a cero",
      "C. La presión del sistema diverge hacia el infinito",
      "D. El calor específico molar se vuelve infinito"
    ],
    "correcta": 1,
    "explicacion": "Al aproximarse a 0 K, las fluctuaciones térmicas desaparecen y el cristal perfecto adopta un único microestado fundamental bien definido (Ω = 1). Como S = k_B ln(1) = 0, la entropía se anula en el cero absoluto."
  },
  {
    "id": 404,
    "area": "Termodinámica",
    "subtema": "Gas de Van der Waals",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En la ecuación de estado de Van der Waals para gases reales, (P + a/V²)(V - b) = RT, ¿qué representan físicamente los parámetros 'a' y 'b'?",
    "opciones": [
      "A. 'a' es la velocidad de la luz y 'b' la masa del protón",
      "B. 'a' corrige las fuerzas atractivas intermoleculares de largo alcance y 'b' representa el covolumen o volumen propio finito ocupado por las moléculas",
      "C. 'a' mide la conductividad eléctrica y 'b' la viscosidad cinemática",
      "D. Son simples constantes matemáticas sin interpretación física alguna"
    ],
    "correcta": 1,
    "explicacion": "El término a/V² suma la presión adicional debida a la atracción mutua entre moléculas que reduce el impacto contra la pared, mientras que b (covolumen) resta el volumen efectivo ocupado por las moléculas reales debido a su repulsión de corto alcance."
  },
  {
    "id": 405,
    "area": "Termodinámica",
    "subtema": "Teorema de Equipartición",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Según el Teorema de Equipartición de la Energía en mecánica estadística clásica, ¿cuánta energía cinética promedio corresponde a cada grado de libertad cuadrático por molécula en equilibrio a temperatura T?",
    "opciones": [
      "A. k_B T",
      "B. 1/2 k_B T",
      "C. 3/2 k_B T",
      "D. 2 k_B T"
    ],
    "correcta": 1,
    "explicacion": "En el límite clásico, cada término cuadrático independiente en el hamiltoniano (traslacional, rotacional o vibracional) contribuye en promedio con exactamente 1/2 k_B T a la energía interna por partícula (o 1/2 RT por mol)."
  },
  {
    "id": 406,
    "area": "Termodinámica",
    "subtema": "Punto Triple del Agua",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué condición termodinámica singular define al 'Punto Triple' de una sustancia pura como el agua?",
    "opciones": [
      "A. La temperatura a la cual el agua hierve a 1 atmósfera de presión",
      "B. El estado único de temperatura (0.01 °C = 273.16 K) y presión (611.65 Pa) en el cual coexisten en equilibrio termodinámico simultáneo las tres fases: sólida, líquida y gaseosa",
      "C. El punto donde el hielo flota con el 100% de su volumen sumergido",
      "D. La temperatura a la que el agua se disocia en iones de hidrógeno"
    ],
    "correcta": 1,
    "explicacion": "Según la Regla de las Fases de Gibbs (F = C - P + 2 = 1 - 3 + 2 = 0), un punto triple tiene cero grados de libertad: es un punto termodinámico invariante y único donde conviven en equilibrio el hielo, el agua líquida y el vapor de agua."
  },
  {
    "id": 407,
    "area": "Termodinámica",
    "subtema": "Efecto Joule-Thomson",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Efecto Joule-Thomson describe el cambio de temperatura que experimenta un gas real al forzarlo a expandirse a través de una válvula estranguladora o tapón poroso en un proceso:",
    "opciones": [
      "A. Rigurosamente isobárico",
      "B. Rigurosamente isentálpico (H = constante) y adiabático",
      "C. Rigurosamente isocórico",
      "D. De fusión nuclear controlada"
    ],
    "correcta": 1,
    "explicacion": "La expansión estrangulada a través de un tapón poroso o válvula es un proceso adiabático irreversible con entalpía constante (ΔH = 0). Si el gas está por debajo de su temperatura de inversión, la expansión produce enfriamiento, base de la licuefacción industrial de gases."
  },
  {
    "id": 408,
    "area": "Termodinámica",
    "subtema": "Ley de Stefan-Boltzmann",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La potencia total por unidad de área emitida por radiación electromagnética por un cuerpo negro ideal a temperatura absoluta T es proporcional a:",
    "opciones": [
      "A. T (temperatura lineal)",
      "B. T²",
      "C. T³",
      "D. T⁴ (la cuarta potencia de la temperatura absoluta: j* = σ T⁴)"
    ],
    "correcta": 3,
    "explicacion": "La Ley de Stefan-Boltzmann formulada en 1879 por Jožef Stefan y deducida termodinámicamente por Ludwig Boltzmann demuestra que la radiancia total crece como la cuarta potencia: j* = σT⁴, donde σ ≈ 5.67 × 10⁻⁸ W/(m²·K⁴)."
  },
  {
    "id": 409,
    "area": "Termodinámica",
    "subtema": "Ley de Desplazamiento de Wien",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Ley de Desplazamiento de Wilhelm Wien establece que la longitud de onda λ_max correspondiente al pico de emisión de radiación de cuerpo negro cumple la relación:",
    "opciones": [
      "A. λ_max / T = constante",
      "B. λ_max · T = b ≈ 2.898 × 10⁻³ m · K",
      "C. λ_max · T⁴ = constante",
      "D. λ_max = b · T²"
    ],
    "correcta": 1,
    "explicacion": "La Ley de Wien demuestra que a mayor temperatura del cuerpo emisor, el pico de máxima radiancia se desplaza hacia longitudes de onda más cortas (mayores frecuencias): λ_max T = constante. Por eso el Sol (5778 K) emite principalmente en el espectro visible."
  },
  {
    "id": 410,
    "area": "Termodinámica",
    "subtema": "Calor Específico de Gases",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Para un gas ideal monoatómico (como el helio o el argón), la relación entre sus calores específicos molares γ = Cp / Cv es teóricamente igual a:",
    "opciones": [
      "A. 1.00",
      "B. 1.33 (4/3)",
      "C. 1.40 (7/5)",
      "D. 1.67 (5/3)"
    ],
    "correcta": 3,
    "explicacion": "Un gas monoatómico solo posee 3 grados de libertad traslacionales: Cv = 3/2 R. Por la relación de Mayer Cp = Cv + R = 5/2 R. Por consiguiente, el coeficiente adiabático γ = Cp/Cv = (5/2 R) / (3/2 R) = 5/3 ≈ 1.67."
  },
  {
    "id": 411,
    "area": "Termodinámica",
    "subtema": "Mecanismos de Transferencia de Calor",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál de los tres mecanismos de transferencia de calor puede propagar energía térmica a través del vacío absoluto del espacio interestelar?",
    "opciones": [
      "A. Conducción molecular",
      "B. Convección natural de fluidos",
      "C. Radiación electromagnética térmica",
      "D. Advección capilar"
    ],
    "correcta": 2,
    "explicacion": "Tanto la conducción como la convección requieren obligatoriamente la presencia de un medio material (choques atómicos o transporte macroscópico de masa). Solo la radiación electromagnética (ondas electromagnéticas y fotones) viaja libremente por el vacío cósmico."
  },
  {
    "id": 412,
    "area": "Termodinámica",
    "subtema": "Calor Latente",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Durante el proceso en que un cubo de hielo a 0 °C se funde completamente en agua líquida a 0 °C a presión atmosférica normal:",
    "opciones": [
      "A. La temperatura del sistema aumenta uniformemente desde 0 °C hasta 4 °C",
      "B. La temperatura permanece estrictamente constante en 0 °C mientras el calor absorbido se emplea en romper los enlaces moleculares de la red cristalina",
      "C. La energía interna total del sistema permanece invariable",
      "D. La masa del agua resultante es la mitad que la del hielo inicial"
    ],
    "correcta": 1,
    "explicacion": "Los cambios de fase de primer orden de sustancias puras a presión constante son estrictamente isotérmicos: la energía térmica transferida (calor latente de fusión Q = m·L_f) no incrementa la energía cinética media (temperatura), sino la energía potencial de cohesión intermolecular."
  },
  {
    "id": 413,
    "area": "Termodinámica",
    "subtema": "Dilatación Anómala del Agua",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los lagos y ríos se congelan en invierno comenzando por la superficie y no desde el fondo?",
    "opciones": [
      "A. Porque la radiación solar calienta preferentemente el lecho del lago",
      "B. Por la dilatación anómala del agua: alcanza su máxima densidad a 4 °C, hundiéndose el agua a 4 °C al fondo, mientras que el agua más fría (0-3 °C) y el hielo son menos densos y flotan en la superficie",
      "C. Porque el fondo de los lagos contiene azufre que impide la solidificación",
      "D. Por corrientes de convección forzadas por el campo magnético terrestre"
    ],
    "correcta": 1,
    "explicacion": "Debido a los enlaces por puente de hidrógeno que forman una estructura hexagonal abierta al congelarse, el agua tiene su máxima densidad a 3.98 °C (~4 °C). El agua a 0 °C y el hielo flotan, creando una capa aislante que protege la vida acuática en el fondo."
  },
  {
    "id": 414,
    "area": "Termodinámica",
    "subtema": "Gas de Bose-Einstein",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué fenómeno cuántico-estadístico ocurre en un gas de bosones cuando se enfría por debajo de su temperatura crítica de condensación Tc?",
    "opciones": [
      "A. Los bosones se transforman espontáneamente en electrones relativistas",
      "B. Una fracción macroscópica de los bosones colapsa al mismo estado cuántico fundamental de mínima energía, comportándose coordinadamente como una única onda macroscópica",
      "C. Los átomos se repelen con fuerza electrostática infinita",
      "D. La masa de los átomos se evapora por completo"
    ],
    "correcta": 1,
    "explicacion": "Predicho por Bose y Einstein (1924-1925) y observado experimentalmente en 1995 con átomos de rubidio (Premio Nobel 2001), el condensado de Bose-Einstein es un estado de la materia donde millones de bosones ocupan el estado fundamental compartido con coherencia cuántica macroscópica."
  },
  {
    "id": 415,
    "area": "Termodinámica",
    "subtema": "Energía Libre de Gibbs",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Para un sistema cerrado que evoluciona a temperatura T constante y presión P constante, la condición termodinámica de espontaneidad y equilibrio viene gobernada por:",
    "opciones": [
      "A. La energía interna U debe ser siempre creciente",
      "B. La energía libre de Gibbs G = H - TS, donde los procesos espontáneos exigen ΔG < 0 y el equilibrio termodinámico se alcanza cuando G es mínima (dG = 0)",
      "C. El calor latente debe ser exactamente igual a la constante de Planck",
      "D. La entropía del sistema debe hacerse necesariamente cero"
    ],
    "correcta": 1,
    "explicacion": "A T y P constantes, el criterio fundamental de espontaneidad derivado de la 2ª Ley es la minimización del potencial termodinámico de Gibbs: ΔG = ΔH - TΔS < 0. En el equilibrio químico y de fases, G alcanza su mínimo absoluto."
  },
  {
    "id": 416,
    "area": "Termodinámica",
    "subtema": "Equivalente Mecánico del Calor",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "En su célebre experimento de 1843 con un recipiente de agua agitado por paletas accionadas por pesas descendentes, James Prescott Joule demostró experimentalmente que:",
    "opciones": [
      "A. El calor es una sustancia fluida e indestructible llamada 'calórico'",
      "B. El calor y el trabajo mecánico son formas equivalentes de transferencia de energía, requiriéndose aproximadamente 4.18 Joules para elevar 1 g de agua en 1 °C (1 caloría ≈ 4.184 J)",
      "C. El trabajo mecánico se destruye irreversiblemente al agitar líquidos",
      "D. El agua no puede absorber energía mecánica"
    ],
    "correcta": 1,
    "explicacion": "Joule demolió la teoría errónea del 'calórico' al demostrar que el trabajo mecánico y el calor son intercambiables de forma cuantitativa y exacta, sentando las bases empíricas definitivas del Principio de Conservación de la Energía."
  },
  {
    "id": 417,
    "area": "Termodinámica",
    "subtema": "Paradoja de Gibbs",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo resolvió Josiah Willard Gibbs la paradoja sobre el aumento espurio de entropía que predecía la termodinámica clásica al mezclar dos muestras del mismo gas idéntico a igual T y P?",
    "opciones": [
      "A. Negando la validez de la 2ª Ley de la Termodinámica",
      "B. Introduciendo el factor de indistinguibilidad cuántico N! en el conteo de microestados en el espacio de fases, reconociendo que permutar partículas idénticas no genera un nuevo estado físico",
      "C. Afirmando que los gases reales tienen densidad infinita",
      "D. Modificando el valor numérico de la constante de los gases R"
    ],
    "correcta": 1,
    "explicacion": "Dividir la función de partición clásica por N! (factor de corrección de Gibbs) corrige el sobreconteo de microestados debido a la indistinguibilidad de las partículas idénticas, garantizando que la entropía sea una variable estrictamente extensiva (ΔS_mezcla = 0 al mezclar gases idénticos)."
  },
  {
    "id": 418,
    "area": "Electromagnetismo",
    "subtema": "Ley de Gauss",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Gauss establece que el flujo eléctrico neto a través de cualquier superficie gaussiana cerrada es igual a:",
    "opciones": [
      "A. La corriente eléctrica que atraviesa dicha superficie dividida por la permitividad del vacío",
      "B. La carga eléctrica neta total encerrada dividida por la permitividad del vacío (Q_enc / ε₀)",
      "C. La derivada temporal del flujo magnético",
      "D. Cero en todos los casos físicos reales"
    ],
    "correcta": 1,
    "explicacion": "La 1ª Ecuación de Maxwell (Ley de Gauss) formula: ∮ E · dA = Q_enc / ε₀. Muestra que las cargas eléctricas actúan como fuentes (cargas positivas) o sumideros (cargas negativas) de las líneas de campo eléctrico."
  },
  {
    "id": 419,
    "area": "Electromagnetismo",
    "subtema": "Equilibrio Electrostático",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el valor del campo eléctrico en cualquier punto del interior de un conductor metálico sólido en equilibrio electrostático estático?",
    "opciones": [
      "A. Es idénticamente cero (E = 0)",
      "B. Es proporcional a la masa del conductor",
      "C. Es infinito cerca del centro geométrico",
      "D. Oscila a la frecuencia de resonancia de los electrones"
    ],
    "correcta": 0,
    "explicacion": "Si existiera campo eléctrico en el interior, los electrones libres de conducción experimentarían una fuerza F = qE y se moverían, contradiciendo la condición de equilibrio electrostático. Los electrones se redistribuyen en la superficie hasta anular por completo el campo interior."
  },
  {
    "id": 420,
    "area": "Electromagnetismo",
    "subtema": "Jaula de Faraday",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Los pasajeros en el interior de un automóvil cerrado con carrocería metálica o en un avión no sufren daños directos si el vehículo es alcanzado por un rayo. ¿A qué fenómeno físico se debe este apantallamiento?",
    "opciones": [
      "A. Al aislamiento eléctrico que proporcionan los neumáticos de caucho",
      "B. Al efecto Jaula de Faraday: las cargas eléctricas del rayo circulan por la superficie exterior conductora y el campo eléctrico en el recinto interior permanece nulo",
      "C. A que el rayo no tiene carga eléctrica suficiente",
      "D. A la refracción cuántica del aire interior"
    ],
    "correcta": 1,
    "explicacion": "En un recinto conductor cerrado (Jaula de Faraday), cualquier carga externa induce una distribución superficial que cancela con absoluta precisión el campo eléctrico en la cavidad interna, protegiendo todo lo que se encuentre en su interior."
  },
  {
    "id": 421,
    "area": "Electromagnetismo",
    "subtema": "Superficies Equipotenciales",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ángulo geométrico forman siempre las líneas de campo eléctrico con las superficies equipotenciales en cualquier punto del espacio?",
    "opciones": [
      "A. 0° (son paralelas)",
      "B. 45°",
      "C. 90° (son rigurosamente perpendiculares)",
      "D. 180°"
    ],
    "correcta": 2,
    "explicacion": "Como el trabajo para desplazar una carga sobre una superficie equipotencial es nulo (dW = -q dV = 0 = q E · dr), el producto escalar E · dr debe anularse para cualquier desplazamiento dr tangente a la superficie. Por tanto, el vector campo E es siempre perpendicular a las equipotenciales."
  },
  {
    "id": 422,
    "area": "Electromagnetismo",
    "subtema": "Condensadores y Dieléctricos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué efecto produce introducir un material dieléctrico de constante dieléctrica relativa κ > 1 entre las placas de un condensador aislado con carga fija Q?",
    "opciones": [
      "A. Aumenta la diferencia de potencial entre las placas",
      "B. Reduce el campo eléctrico y el voltaje entre placas, aumentando la capacitancia por un factor κ (C = κ C₀)",
      "C. Disminuye la capacitancia a la mitad",
      "D. Descarga instantáneamente el condensador destruyendo su carga"
    ],
    "correcta": 1,
    "explicacion": "Las moléculas del dieléctrico se polarizan creando un campo interno inducido opuesto al campo exterior, lo que reduce el campo neto (E = E₀/κ) y consecuentemente el voltaje (V = V₀/κ). Dado que C = Q/V, la capacitancia se multiplica por κ."
  },
  {
    "id": 423,
    "area": "Electromagnetismo",
    "subtema": "Energía en Condensadores",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la expresión exacta para la energía electrostática total almacenada en un condensador de capacitancia C cargado a un potencial V?",
    "opciones": [
      "A. U = C V",
      "B. U = 1/2 C V²",
      "C. U = 2 C² V",
      "D. U = C / (2 V²)"
    ],
    "correcta": 1,
    "explicacion": "La energía almacenada corresponde al trabajo realizado para transferir infinitesimalmente la carga: U = ∫ V(q) dq = ∫ (q/C) dq = 1/2 q²/C = 1/2 C V². Esta energía reside físicamente almacenada en el campo eléctrico confinado entre las placas."
  },
  {
    "id": 424,
    "area": "Electromagnetismo",
    "subtema": "Circuitos RC",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un circuito serie compuesto por una resistencia R y un condensador inicialmente descargado C conectado a una fuente V₀, la constante de tiempo τ = RC representa el tiempo necesario para que el condensador alcance aproximadamente:",
    "opciones": [
      "A. El 50% de su voltaje final de carga",
      "B. El 63.2% (1 - 1/e) de su carga y voltaje final máximo",
      "C. El 100% exacto de su carga de equilibrio",
      "D. El 99.9% de su carga"
    ],
    "correcta": 1,
    "explicacion": "La ecuación de carga de un condensador es V(t) = V₀ (1 - e^(-t/RC)). Cuando t = τ = RC, el factor es (1 - e⁻¹) = 1 - 0.368 = 0.632, lo que equivale al 63.2% del voltaje final de la fuente."
  },
  {
    "id": 425,
    "area": "Electromagnetismo",
    "subtema": "Leyes de Kirchhoff",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Primera Ley de Kirchhoff (Ley de Nodos: ∑ I = 0) y la Segunda Ley de Kirchhoff (Ley de Mallas: ∑ V = 0) son manifestaciones directas de las leyes fundamentales de conservación de:",
    "opciones": [
      "A. Momento lineal y masa respectivamente",
      "B. Carga eléctrica y energía respectivamente",
      "C. Momento angular e inductancia respectivamente",
      "D. Resistencia y capacitancia respectivamente"
    ],
    "correcta": 1,
    "explicacion": "La ley de nodos refleja la conservación de la carga eléctrica (no puede acumularse carga neta indefinidamente en un punto infinitesimal). La ley de mallas refleja la conservación de la energía en un campo electrostático conservativo (∮ E · dl = 0)."
  },
  {
    "id": 426,
    "area": "Electromagnetismo",
    "subtema": "Fuerza Magnética de Lorentz",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una partícula con carga positiva q se mueve con velocidad v en una región donde existe un campo magnético uniforme B. Si v es paralela a B, ¿cuál es la magnitud de la fuerza magnética sobre la partícula?",
    "opciones": [
      "A. F = q v B",
      "B. F = 0 (cero)",
      "C. F = 1/2 q v² B",
      "D. F = q B / v"
    ],
    "correcta": 1,
    "explicacion": "La fuerza magnética sobre una carga en movimiento es el producto vectorial F = q (v × B), cuya magnitud es |F| = |q| v B senθ. Si la velocidad es paralela al campo, el ángulo es θ = 0°, y como sen(0°) = 0, la fuerza magnética es idénticamente nula."
  },
  {
    "id": 427,
    "area": "Electromagnetismo",
    "subtema": "Trabajo del Campo Magnético",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un campo magnético estático B nunca puede realizar trabajo mecánico sobre una partícula cargada libre?",
    "opciones": [
      "A. Porque los campos magnéticos no poseen energía",
      "B. Porque la fuerza magnética F = q (v × B) es en todo instante estrictamente perpendicular al vector velocidad v y al desplazamiento infinitesimal dr, haciendo que dW = F · dr = 0",
      "C. Porque los electrones son inmunes a los campos magnéticos",
      "D. Por el principio de equivalencia relativista"
    ],
    "correcta": 1,
    "explicacion": "Dado que la fuerza magnética es perpendicular a la velocidad en todo instante, la potencia instantánea entregada P = F · v = q (v × B) · v = 0. En consecuencia, el campo magnético solo desvía la dirección del movimiento, pero no puede alterar la rapidez ni la energía cinética de la partícula."
  },
  {
    "id": 428,
    "area": "Electromagnetismo",
    "subtema": "Radio de Larmor en Ciclotrón",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una partícula cargada (masa m, carga q) ingresa perpendicularmente a un campo magnético uniforme B con rapidez v. El radio R de la trayectoria circular descrita viene dado por:",
    "opciones": [
      "A. R = m v / (q B)",
      "B. R = q B / (m v)",
      "C. R = q v / (m B)",
      "D. R = m B / (q v²)"
    ],
    "correcta": 0,
    "explicacion": "Igualando la fuerza magnética centrípeta a la aceleración centrípeta: q v B = m v² / R. Despejando el radio orbital de giro (radio de Larmor o de ciclotrón) se obtiene directamente R = mv / (qB)."
  },
  {
    "id": 429,
    "area": "Electromagnetismo",
    "subtema": "Efecto Hall",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué descubrimiento físico crucial permitió realizar el Efecto Hall (descubierto por Edwin Hall en 1879) en conductores y semiconductores?",
    "opciones": [
      "A. Permitió medir la velocidad de la luz en el interior de los metales",
      "B. Permitió determinar experimentalmente el signo de la carga eléctrica de los portadores mayoritarios de corriente y su densidad volumétrica",
      "C. Demostró la inexistencia de la masa inercial",
      "D. Validó que los átomos poseen un núcleo denso"
    ],
    "correcta": 1,
    "explicacion": "Al aplicar un campo magnético perpendicular a una lámina con corriente, la fuerza de Lorentz desvía a los portadores hacia un borde, generando un voltaje transversal (Voltaje Hall V_H). El signo de este voltaje revela si los portadores son electrones negativos o huecos positivos."
  },
  {
    "id": 430,
    "area": "Electromagnetismo",
    "subtema": "Ley de Ampère",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La magnitud del campo magnético B en el interior de un solenoide ideal muy largo con n espiras por unidad de longitud por el que circula una corriente I es:",
    "opciones": [
      "A. B = μ₀ n I",
      "B. B = μ₀ I / (2π r)",
      "C. B = μ₀ n² I / 2",
      "D. B = 0"
    ],
    "correcta": 0,
    "explicacion": "Aplicando la Ley de Ampère a un lazo rectangular cerrado que atraviesa el solenoide: ∮ B · dl = B L = μ₀ (n L) I. Cancelando la longitud L del lazo resulta B = μ₀ n I, un campo extraordinariamente uniforme en todo el interior del solenoide."
  },
  {
    "id": 431,
    "area": "Electromagnetismo",
    "subtema": "Ley de Inducción de Faraday",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Inducción de Faraday establece que la fuerza electromotriz (fem) inducida en una espira cerrada es directamente proporcional a:",
    "opciones": [
      "A. El valor estático constante del flujo magnético",
      "B. La rapidez con la que varía en el tiempo el flujo magnético que atraviesa la espira: E = -dΦ_B / dt",
      "C. La temperatura ambiente del laboratorio",
      "D. La masa total del alambre de la espira"
    ],
    "correcta": 1,
    "explicacion": "Michael Faraday descubrió en 1831 que solo el cambio temporal en el flujo magnético genera corriente inducida: E = -dΦ_B/dt. Si el flujo es inmenso pero estrictamente constante en el tiempo, la fem inducida es exactamente cero."
  },
  {
    "id": 432,
    "area": "Electromagnetismo",
    "subtema": "Ley de Lenz",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El signo negativo en la ecuación de Faraday-Lenz (E = -dΦ_B / dt) representa físicamente que:",
    "opciones": [
      "A. La corriente inducida genera un campo magnético que favorece e incrementa la variación de flujo original",
      "B. La corriente inducida fluye en un sentido tal que su propio campo magnético se opone siempre a la variación del flujo magnético exterior que la produjo",
      "C. La energía electromagnética siempre se destruye en presencia de inductores",
      "D. El potencial eléctrico es siempre negativo en corriente alterna"
    ],
    "correcta": 1,
    "explicacion": "Heinrich Lenz formuló esta regla en 1834 como un requisito estricto de la Conservación de la Energía. Si la corriente inducida reforzara el cambio de flujo en vez de oponerse a él, el sistema auto-aceleraría indefinidamente creando energía de la nada."
  },
  {
    "id": 433,
    "area": "Electromagnetismo",
    "subtema": "Corrientes Parásitas de Foucault",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando una placa gruesa de cobre o aluminio (materiales no ferromagnéticos) oscila entre los polos de un imán potente, se frena casi instantáneamente sin tocar nada. ¿Por qué ocurre esto?",
    "opciones": [
      "A. Por la atracción gravitatoria del imán",
      "B. Porque se inducen corrientes de Foucault (Eddy currents) en el metal que, por la Ley de Lenz, crean campos magnéticos opuestos al movimiento, disipando energía mecánica en calor",
      "C. Por la fricción electrostática con el aire",
      "D. Porque el cobre se vuelve superconductor a temperatura ambiente"
    ],
    "correcta": 1,
    "explicacion": "El movimiento en el gradiente de campo magnético induce lazos de corriente microscópicos cerrados (corrientes parásitas de Foucault) en la masa del conductor. Estas corrientes experimentan fuerzas de Lorentz que frenan el movimiento (freno electromagnético)."
  },
  {
    "id": 434,
    "area": "Electromagnetismo",
    "subtema": "Energía en un Inductor",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuánta energía magnética total U se encuentra almacenada en una bobina o inductor con inductancia L por el que circula una corriente estacionaria I?",
    "opciones": [
      "A. U = L I",
      "B. U = 1/2 L I²",
      "C. U = 2 L² I",
      "D. U = L / (2 I²)"
    ],
    "correcta": 1,
    "explicacion": "El trabajo necesario para vencer la fuerza contraelectromotriz autoinducida durante el establecimiento de la corriente es U = ∫ E I dt = ∫ L (dI/dt) I dt = L ∫ I dI = 1/2 L I². Esta energía reside almacenada en el campo magnético del inductor."
  },
  {
    "id": 435,
    "area": "Electromagnetismo",
    "subtema": "Resonancia RLC",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un circuito RLC conectado en serie a un generador de corriente alterna, la resonancia eléctrica ocurre a la frecuencia angular ω₀ igual a:",
    "opciones": [
      "A. ω₀ = 1 / √(L C)",
      "B. ω₀ = √(L / C)",
      "C. ω₀ = R / (L C)",
      "D. ω₀ = 2π L C"
    ],
    "correcta": 0,
    "explicacion": "En resonancia, la reactancia inductiva se cancela con la reactancia capacitiva (X_L = X_C ⟹ ωL = 1/(ωC)), lo que implica ω₀ = 1/√(LC). En este punto la impedancia total del circuito es mínima y puramente resistiva (Z = R), maximizando la corriente."
  },
  {
    "id": 436,
    "area": "Electromagnetismo",
    "subtema": "Corriente de Desplazamiento",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué término fundamental introdujo James Clerk Maxwell en la Ley de Ampère para resolver la inconsistencia durante la carga de un condensador y predecir las ondas electromagnéticas?",
    "opciones": [
      "A. El término de resistividad cuántica de Hall",
      "B. La Corriente de Desplazamiento: I_d = ε₀ (dΦ_E / dt), demostrando que un campo eléctrico variable en el tiempo genera un campo magnético",
      "C. La constante cosmológica de Einstein",
      "D. El potencial escalar retardado de Liénard-Wiechert"
    ],
    "correcta": 1,
    "explicacion": "Maxwell advirtió que la ley de Ampère clásica violaba la continuidad de la carga en un circuito con condensador abierto. Al añadir la corriente de desplazamiento (ε₀ dΦ_E/dt), completó la simetría: campos magnéticos variables generan campos eléctricos y viceversa, naciendo la teoría de las ondas EM."
  },
  {
    "id": 437,
    "area": "Electromagnetismo",
    "subtema": "Vector de Poynting",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Vector de Poynting S = (1/μ₀) (E × B) describe en el electromagnetismo clásico:",
    "opciones": [
      "A. La densidad volumétrica de carga electrostática libre",
      "B. La densidad de flujo de potencia (energía electromagnética por unidad de tiempo y por unidad de área) transportada por la onda",
      "C. La fuerza gravitatoria neta de un fotón",
      "D. El momento de inercia de las líneas de inducción"
    ],
    "correcta": 1,
    "explicacion": "El vector de Poynting representa la dirección y magnitud del flujo de energía por unidad de área (W/m²) transportada por los campos electromagnéticos. Su promedio temporal determina la irradiancia o intensidad de una onda luminosa o de radio."
  },
  {
    "id": 438,
    "area": "Electromagnetismo",
    "subtema": "Materiales Ferromagnéticos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Por encima de la llamada 'Temperatura de Curie' (Tc), un material ferromagnético como el hierro metálico:",
    "opciones": [
      "A. Se convierte espontáneamente en superconductor",
      "B. Pierde permanentemente su magnetización espontánea y se transforma en un material paramagnético ordinario",
      "C. Expulsa completamente todas las líneas de campo eléctrico",
      "D. Se desintegra radiactivamente por fisión nuclear"
    ],
    "correcta": 1,
    "explicacion": "Por encima de Tc (para el hierro ~770 °C o 1043 K), la agitación térmica supera la energía de acoplamiento de canje cuántico que alinea los momentos magnéticos en los dominios de Weiss, destruyendo el ferromagnetismo macroscópico."
  },
  {
    "id": 439,
    "area": "Electromagnetismo",
    "subtema": "Transformador Eléctrico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un transformador ideal con 100 espiras en el devanado primario y 1000 espiras en el secundario se conecta a una red AC de 120 V. ¿Cuál es el voltaje y la relación de corriente en el secundario?",
    "opciones": [
      "A. 12 V, con corriente 10 veces mayor",
      "B. 1200 V, con corriente 10 veces menor que en el primario",
      "C. 120 V, sin variación alguna",
      "D. 2400 V, con igual corriente"
    ],
    "correcta": 1,
    "explicacion": "Por la relación del transformador V₂/V₁ = N₂/N₁ = 1000/100 = 10, por lo que V₂ = 10 × 120 V = 1200 V. Al ser ideal (potencia conservada P = V₁ I₁ = V₂ I₂), la corriente en el secundario debe reducirse a la décima parte (I₂ = I₁/10)."
  },
  {
    "id": 440,
    "area": "Electromagnetismo",
    "subtema": "Voltaje RMS",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "La toma de corriente domiciliaria suministra corriente alterna senoidal con un valor eficaz de 120 V RMS. ¿Cuál es aproximadamente el voltaje pico (máximo) de la onda?",
    "opciones": [
      "A. 120 V",
      "B. 170 V (V_pico = V_rms · √2)",
      "C. 240 V",
      "D. 85 V"
    ],
    "correcta": 1,
    "explicacion": "Para una señal senoidal pura, el valor cuadrático medio (RMS) es V_rms = V_pico / √2. Despejando el pico máximo: V_pico = 120 V × √2 ≈ 120 × 1.4142 ≈ 170 V. La tensión oscila continuamente entre +170 V y -170 V."
  },
  {
    "id": 441,
    "area": "Electromagnetismo",
    "subtema": "Puente de Wheatstone",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué condición de equilibrio el galvanómetro de un Puente de Wheatstone clásico marca exactamente cero corriente?",
    "opciones": [
      "A. Cuando todas las resistencias son nulas",
      "B. Cuando los productos cruzados de las resistencias de sus ramas opuestas son iguales (R₁ · R₄ = R₂ · R₃)",
      "C. Cuando la batería se agota por completo",
      "D. Cuando la inductancia es infinita"
    ],
    "correcta": 1,
    "explicacion": "El puente está balanceado cuando el potencial en los dos nodos intermedios se iguala (ΔV = 0), lo que ocurre cuando la relación de divisor de tensión es idéntica en ambas ramas: R₁/R₂ = R₃/R₄, es decir, R₁ R₄ = R₂ R₃."
  },
  {
    "id": 442,
    "area": "Electromagnetismo",
    "subtema": "Dipolos Eléctricos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "A distancias r muy grandes comparadas con la separación d entre cargas, el potencial eléctrico V generado por un dipolo eléctrico puntual decae espacialmente como:",
    "opciones": [
      "A. 1 / r",
      "B. 1 / r²",
      "C. 1 / r³",
      "D. ln(r)"
    ],
    "correcta": 1,
    "explicacion": "Para una carga puntual aislada V ∝ 1/r. Sin embargo, en un dipolo las dos cargas opuestas casi se cancelan a gran distancia; la aproximación dipolar demuestra que su potencial decae más rápidamente: V(r) = (1 / 4πε₀) (p · r̂ / r²), y su campo eléctrico E ∝ 1/r³."
  },
  {
    "id": 443,
    "area": "Electromagnetismo",
    "subtema": "Efecto Corona y Puntas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los pararrayos y conductores cargados a alto potencial rematan siempre en una punta metálica afilada?",
    "opciones": [
      "A. Porque el radio de curvatura extremadamente pequeño en la punta intensifica exponencialmente la densidad superficial de carga y el campo eléctrico exterior (E ∝ 1/R), facilitando la ionización del aire",
      "B. Porque las puntas pesan menos",
      "C. Para evitar que las aves se posen sobre el edificio",
      "D. Porque los electrones prefieren viajar en línea recta"
    ],
    "correcta": 0,
    "explicacion": "En un conductor en equilibrio a potencial V constante, la densidad superficial de carga σ y el campo eléctrico en la superficie son inversamente proporcionales al radio de curvatura local: E = σ/ε₀ ∝ V/R. En una punta afilada (R muy pequeño), el campo supera la rigidez dieléctrica del aire."
  },
  {
    "id": 444,
    "area": "Electromagnetismo",
    "subtema": "Momento Magnético Orbital",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Magnetón de Bohr (μ_B = e ħ / (2 m_e)) representa en física cuántica y atómica:",
    "opciones": [
      "A. La unidad natural del momento dipolar magnético de un electrón debido a su momento angular orbital o intrínseco",
      "B. La velocidad máxima que puede alcanzar un protón en un acelerador",
      "C. La frecuencia de resonancia nuclear del agua pesada",
      "D. La masa del neutrino electrónico"
    ],
    "correcta": 0,
    "explicacion": "El magnetón de Bohr μ_B ≈ 9.274 × 10⁻²⁴ J/T es la constante física fundamental que cuantifica la escala elemental del momento magnético asociado a los electrones en átomos, crucial en espectroscopía y efecto Zeeman."
  },
  {
    "id": 445,
    "area": "Electromagnetismo",
    "subtema": "Monopolos Magnéticos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Segunda Ecuación de Maxwell, formulada matemáticamente como ∇ · B = 0 (o ∮ B · dA = 0 sobre toda superficie cerrada), postula físicamente que:",
    "opciones": [
      "A. Los campos magnéticos no tienen energía propia",
      "B. No existen monopolos magnéticos aislados en la naturaleza: las líneas de campo magnético son siempre curvas cerradas continuas",
      "C. La velocidad de la luz en el vacío es infinita",
      "D. El campo magnético se anula en todos los imanes de neodimio"
    ],
    "correcta": 1,
    "explicacion": "Si cortas un imán por la mitad, no obtienes un polo norte y un polo sur separados, sino dos imanes bipolares completos. Al ser la divergencia de B estrictamente nula, las líneas de inducción magnética no tienen principio ni fin."
  },
  {
    "id": 446,
    "area": "Electromagnetismo",
    "subtema": "Impedancia Eléctrica",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se define la impedancia compleja Z en un circuito de corriente alterna lineal?",
    "opciones": [
      "A. Como el producto de la potencia activa por el coseno de fi",
      "B. Como la relación fasorial compleja entre la tensión fasorial V y la corriente fasorial I: Z = R + j(X_L - X_C)",
      "C. Como la suma simple de resistencias dividida por el tiempo",
      "D. Como la energía térmica disipada por ciclo"
    ],
    "correcta": 1,
    "explicacion": "La impedancia Z generaliza la ley de Ohm en régimen senoidal permanente incorporando tanto la oposición disipativa al paso de corriente (resistencia pura R) como la oposición por almacenamiento reactivo de energía en campos (reactancia X = ωL - 1/(ωC))."
  },
  {
    "id": 447,
    "area": "Electromagnetismo",
    "subtema": "Espectro Electromagnético",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el orden correcto de menor a mayor frecuencia (o equivalentemente de mayor a menor longitud de onda) en el espectro electromagnético?",
    "opciones": [
      "A. Rayos Gamma, Rayos X, Luz Visible, Microondas, Ondas de Radio",
      "B. Ondas de Radio, Microondas, Infrarrojo, Luz Visible, Ultravioleta, Rayos X, Rayos Gamma",
      "C. Luz Visible, Ultravioleta, Microondas, Rayos X, Rayos Gamma",
      "D. Ondas de Radio, Luz Visible, Infrarrojo, Rayos Gamma"
    ],
    "correcta": 1,
    "explicacion": "A medida que aumenta la frecuencia (f = c/λ), la energía cuántica del fotón (E = hf) crece: Radio (km a cm) → Microondas (cm a mm) → Infrarrojo → Visible (380-750 nm) → Ultravioleta → Rayos X → Rayos Gamma (longitudes subatómicas picométricas)."
  },
  {
    "id": 448,
    "area": "Óptica y Fotónica",
    "subtema": "Ley de Snell",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Un rayo de luz pasa desde el aire (índice n₁ ≈ 1.00) hacia un bloque de vidrio (índice n₂ ≈ 1.50) con un ángulo de incidencia θ₁ respecto a la normal. ¿Qué ocurre con la trayectoria del rayo refractado dentro del vidrio?",
    "opciones": [
      "A. Se desvía alejándose de la normal (θ₂ > θ₁)",
      "B. Se desvía acercándose a la línea normal a la superficie (θ₂ < θ₁)",
      "C. Continúa en línea recta sin sufrir desviación angular alguna",
      "D. Se refleja de regreso al aire en un 100% como un espejo perfecto"
    ],
    "correcta": 1,
    "explicacion": "Por la Ley de Snell: n₁ senθ₁ = n₂ senθ₂. Dado que el vidrio es ópticamente más denso (n₂ > n₁), para mantener la igualdad el seno del ángulo debe ser menor: senθ₂ < senθ₁, lo que significa que el rayo se quiebra acercándose hacia la normal."
  },
  {
    "id": 449,
    "area": "Óptica y Fotónica",
    "subtema": "Reflexión Total Interna",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Bajo qué condiciones precisas puede ocurrir el fenómeno de Reflexión Total Interna, principio sobre el cual operan las fibras ópticas de telecomunicaciones?",
    "opciones": [
      "A. La luz debe viajar de un medio de menor índice a uno de mayor índice a cualquier ángulo",
      "B. La luz debe propagarse desde un medio de mayor índice de refracción hacia uno de menor índice (n₁ > n₂) e incidir a un ángulo estrictamente superior al ángulo crítico (θ₁ > θ_c = arcsen(n₂/n₁))",
      "C. Solo ocurre cuando la luz es coherente monocromática láser",
      "D. Exige temperaturas cercanas al cero absoluto"
    ],
    "correcta": 1,
    "explicacion": "Al pasar a un medio menos refringente, el rayo se aleja de la normal. Al alcanzar el ángulo crítico θ_c, el ángulo de refracción es 90°. Para cualquier ángulo de incidencia superior a θ_c, no existe onda refractada transmitida y el 100% de la energía luminosa se refleja internamente sin pérdidas."
  },
  {
    "id": 450,
    "area": "Oscilaciones y Ondas",
    "subtema": "Rapidez del Sonido",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En cuál de los siguientes medios materiales la velocidad de propagación de las ondas sonoras acústicas es sustancialmente mayor?",
    "opciones": [
      "A. En el aire seco a 20 °C (~343 m/s)",
      "B. En el agua líquida (~1480 m/s)",
      "C. En una barra sólida de acero (~5000 a 5900 m/s)",
      "D. En el vacío interestelar"
    ],
    "correcta": 2,
    "explicacion": "La velocidad del sonido en sólidos viene dada por v = √(E / ρ), donde E es el módulo de elasticidad de Young. Aunque el acero es más denso que el agua y el aire, su rigidez elástica interatómica es descomunal, permitiendo propagar ondas elásticas a casi 6 km por segundo."
  },
  {
    "id": 451,
    "area": "Oscilaciones y Ondas",
    "subtema": "Efecto Doppler Acústico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una ambulancia con la sirena encendida se acerca velozmente a un peatón estacionado en la acera. El peatón percibe un tono acústico:",
    "opciones": [
      "A. De mayor frecuencia (más agudo) que el emitido originalmente en reposo",
      "B. De menor frecuencia (más grave)",
      "C. Con idéntica frecuencia pero mayor longitud de onda",
      "D. Inaudible debido a la interferencia destructiva de las ondas"
    ],
    "correcta": 0,
    "explicacion": "Al desplazarse la fuente emisora hacia el observador, los frentes de onda sucesivos se comprimen espacialmente frente al vehículo (menor longitud de onda aparente λ'). Al llegar con menor separación temporal al oído receptor, la frecuencia percibida f' = v / λ' resulta más alta (más aguda)."
  },
  {
    "id": 452,
    "area": "Oscilaciones y Ondas",
    "subtema": "Decibeles y Nivel Sonoro",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la intensidad física de una onda sonora se multiplica por un factor de 10 (por ejemplo de 10⁻⁵ W/m² a 10⁻⁴ W/m²), ¿en cuántos decibeles (dB) aumenta el nivel de intensidad sonora percibido?",
    "opciones": [
      "A. En 1 dB",
      "B. En 10 dB",
      "C. En 100 dB",
      "D. En 2 dB"
    ],
    "correcta": 1,
    "explicacion": "La escala de decibeles es logarítmica: β = 10 log₁₀(I / I₀). Un incremento de un factor de 10 en la intensidad corresponde a Δβ = 10 log₁₀(10) = 10 × 1 = +10 dB. Un factor de 100 representaría +20 dB."
  },
  {
    "id": 453,
    "area": "Oscilaciones y Ondas",
    "subtema": "Batimientos Acústicos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si se hacen sonar simultáneamente dos diapasones que vibran a frecuencias ligeramente distintas de 440 Hz y 444 Hz, ¿cuál es la frecuencia de las pulsaciones o batimientos perceptibles en el sonido combinado?",
    "opciones": [
      "A. 884 Hz",
      "B. 442 Hz",
      "C. 4 Hz (f_batido = |f₁ - f₂|)",
      "D. 1760 Hz"
    ],
    "correcta": 2,
    "explicacion": "La interferencia de dos ondas de igual amplitud y frecuencias muy próximas modula la amplitud total resultante con una envolvente periódica cuya frecuencia de batimiento es exactamente la diferencia de frecuencias: f_batido = |444 Hz - 440 Hz| = 4 Hz (cuatro pulsaciones por segundo)."
  },
  {
    "id": 454,
    "area": "Oscilaciones y Ondas",
    "subtema": "Ondas Estacionarias",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En una onda estacionaria formada en una cuerda tensa con extremos fijos, la distancia física entre dos nodos adyacentes consecutivos equivale a:",
    "opciones": [
      "A. Una longitud de onda completa (λ)",
      "B. Media longitud de onda (λ / 2)",
      "C. Un cuarto de longitud de onda (λ / 4)",
      "D. Dos longitudes de onda (2λ)"
    ],
    "correcta": 1,
    "explicacion": "En una onda estacionaria descrita por y = 2A sen(kx) cos(ωt), los nodos son los puntos de amplitud nula donde sen(kx) = 0, lo cual ocurre para kx = nπ. Como k = 2π/λ, resulta x_n = n (λ/2). Por tanto, la separación espacial entre dos nodos contiguos es exactamente λ/2."
  },
  {
    "id": 455,
    "area": "Oscilaciones y Ondas",
    "subtema": "Tubos Sonoros Cerrados",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Un tubo sonoro de longitud L cerrado en uno de sus extremos y abierto en el otro solo puede generar resonancias acústicas correspondientes a:",
    "opciones": [
      "A. Todos los armónicos enteros pares e impares (n = 1, 2, 3, 4...)",
      "B. Exclusivamente armónicos impares (n = 1, 3, 5, 7...), con frecuencias f_n = n v / (4L)",
      "C. Exclusivamente armónicos pares (n = 2, 4, 6...)",
      "D. Una única frecuencia fundamental invariable"
    ],
    "correcta": 1,
    "explicacion": "El extremo cerrado impone un nodo de desplazamiento para las moléculas de aire, mientras que el extremo abierto exige un antinodo. La longitud del tubo debe albergar un número impar de cuartos de onda: L = n (λ/4) con n = 1, 3, 5..., originando f_n = nv / (4L)."
  },
  {
    "id": 456,
    "area": "Óptica y Fotónica",
    "subtema": "Experimento de Young",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En el célebre experimento de la doble rendija realizado por Thomas Young en 1801, la aparición de un patrón alternado de franjas brillantes y oscuras sobre una pantalla distante demostró de manera concluyente:",
    "opciones": [
      "A. La naturaleza corpuscular newtoniana de los fotones",
      "B. La naturaleza ondulatoria de la luz y el principio de interferencia coherente",
      "C. La velocidad finita de la gravedad",
      "D. La existencia del electrón"
    ],
    "correcta": 1,
    "explicacion": "Young demostró que la luz experimenta interferencia constructiva (franjas brillantes donde la diferencia de camino óptico es d senθ = mλ) e interferencia destructiva (franjas oscuras donde d senθ = (m + 1/2)λ), una propiedad exclusiva e inconfundible de los fenómenos ondulatorios."
  },
  {
    "id": 457,
    "area": "Óptica y Fotónica",
    "subtema": "Difracción de Fraunhofer",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En el patrón de difracción de Fraunhofer generado por una única rendija delgada de ancho 'a' iluminada por luz monocromática de longitud de onda λ, los mínimos de intensidad (franjas oscuras) ocurren en ángulos que satisfacen:",
    "opciones": [
      "A. a sen θ = m λ (con m = ±1, ±2, ±3...)",
      "B. a sen θ = (m + 1/2) λ",
      "C. a cos θ = m λ",
      "D. sen θ = m λ / (2a)"
    ],
    "correcta": 0,
    "explicacion": "Dividiendo la rendija en parejas de mitades cuyos rayos interfieren destructivamente con diferencia de camino de λ/2, la condición para cancelación total de amplitud integrada en la rendija resulta en a senθ = mλ para todo entero m ≠ 0."
  },
  {
    "id": 458,
    "area": "Óptica y Fotónica",
    "subtema": "Criterio de Rayleigh",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Criterio de Resolución de Lord Rayleigh establece que dos fuentes luminosas puntuales se consideran apenas resueltas por un telescopio o microscopio circular de diámetro D cuando:",
    "opciones": [
      "A. Sus imágenes no se tocan en absoluto",
      "B. El máximo central de difracción (disco de Airy) de una de las fuentes coincide exactamente con el primer mínimo de difracción de la otra: θ_min ≈ 1.22 λ / D",
      "C. La distancia focal de la lente es igual a la longitud de onda de la luz",
      "D. Se utiliza luz ultravioleta con polarización circular"
    ],
    "correcta": 1,
    "explicacion": "Debido a la difracción por la apertura circular de diámetro D, la imagen de un punto es un patrón de Airy. Rayleigh estableció el límite práctico de resolución cuando la cresta central de una fuente cae sobre el primer valle oscuro de la otra: θ_min = 1.22 λ/D."
  },
  {
    "id": 459,
    "area": "Óptica y Fotónica",
    "subtema": "Ley de Malus",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Malus determina que cuando un haz de luz polarizada linealmente con intensidad inicial I₀ incide sobre un filtro polarizador cuyo eje de transmisión forma un ángulo θ con la dirección de polarización, la intensidad transmitida es:",
    "opciones": [
      "A. I = I₀ cos(θ)",
      "B. I = I₀ cos²(θ)",
      "C. I = I₀ sen²(θ)",
      "D. I = I₀ tan(θ)"
    ],
    "correcta": 1,
    "explicacion": "Solo la componente del campo eléctrico paralela al eje de transmisión atraviesa el polarizador: E_trans = E₀ cosθ. Como la intensidad de una onda electromagnética es proporcional al cuadrado de la amplitud del campo eléctrico (I ∝ E²), resulta I = I₀ cos²θ."
  },
  {
    "id": 460,
    "area": "Óptica y Fotónica",
    "subtema": "Ángulo de Brewster",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué propiedad óptica singular ocurre cuando un rayo de luz incide desde el aire (n₁) sobre la superficie de un dieléctrico transparente (n₂) en el Ángulo de Brewster (o ángulo de polarización) tan θ_B = n₂ / n₁?",
    "opciones": [
      "A. Toda la luz incidente se absorbe y se transforma en calor",
      "B. La luz reflejada resulta 100% polarizada linealmente en el plano perpendicular al plano de incidencia, y el rayo reflejado forma 90° con el refractado",
      "C. La velocidad de la luz en el segundo medio se acelera superando a c",
      "D. Se anula la refracción"
    ],
    "correcta": 1,
    "explicacion": "En θ_B, el rayo reflejado y el transmitido forman un ángulo recto exacto de 90°. Los dipolos oscilantes del medio alineados en el plano de incidencia no pueden emitir radiación a lo largo de su eje oscilatorio hacia la dirección reflejada, quedando la reflexión polarizada pura."
  },
  {
    "id": 461,
    "area": "Óptica y Fotónica",
    "subtema": "Dispersión de Rayleigh",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el cielo diurno en la Tierra se ve predominantemente de color azul y los atardeceres se aprecian rojizos?",
    "opciones": [
      "A. Por la emisión de luz fosforescente por parte del gas ozono",
      "B. Por la Dispersión de Rayleigh en las moléculas atmosféricas (N₂ y O₂): la intensidad dispersada es inversamente proporcional a la cuarta potencia de la longitud de onda (I ∝ 1/λ⁴), dispersándose mucho más el azul que el rojo",
      "C. Porque los océanos reflejan su color sobre las nubes altas",
      "D. Por el efecto Doppler relativista del movimiento de rotación de la Tierra"
    ],
    "correcta": 1,
    "explicacion": "Al ser el tamaño de las moléculas muy inferior a la longitud de onda luminosa, la dispersión elástica sigue la ley I ∝ 1/λ⁴. La luz azul (λ ≈ 400 nm) se dispersa unas 10 veces más que la roja (λ ≈ 700 nm). En el atardecer, la luz atraviesa una capa atmosférica muy gruesa y los tonos azules se dispersan fuera de la línea de visión."
  },
  {
    "id": 462,
    "area": "Óptica y Fotónica",
    "subtema": "Lentes Delgadas",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "La ecuación fundamental de Gauss para lentes delgadas es 1/f = 1/d_o + 1/d_i. Si un objeto real se coloca a una distancia d_o que es exactamente el doble de la distancia focal de una lente convergente (d_o = 2f), la imagen formada es:",
    "opciones": [
      "A. Virtual, derecha y de mayor tamaño",
      "B. Real, invertida y de exactamente el mismo tamaño que el objeto (aumento lateral m = -1), ubicada a d_i = 2f",
      "C. Enfocada en el infinito con tamaño infinito",
      "D. Se forma en el foco principal f con tamaño nulo"
    ],
    "correcta": 1,
    "explicacion": "Aplicando la fórmula: 1/d_i = 1/f - 1/(2f) = 1/(2f), lo que da d_i = 2f. El aumento lateral es m = -d_i / d_o = -(2f)/(2f) = -1. La imagen es real, invertida y tiene idéntica altura que el objeto original."
  },
  {
    "id": 463,
    "area": "Óptica y Fotónica",
    "subtema": "Espejos Esféricos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la característica invariable de las imágenes formadas por un espejo esférico convexo para cualquier posición real de un objeto situado frente a él?",
    "opciones": [
      "A. Son siempre imágenes virtuales, derechas y de menor tamaño que el objeto",
      "B. Son siempre reales, invertidas y aumentadas",
      "C. Cambian de reales a virtuales al cruzar el foco",
      "D. Son siempre de igual tamaño y se proyectan sobre una pantalla real"
    ],
    "correcta": 0,
    "explicacion": "Un espejo convexo tiene distancia focal virtual negativa (f < 0). La ecuación de los espejos sitúa la imagen siempre detrás del espejo (d_i < 0, imagen virtual), con orientación derecha y aumento |m| < 1 (reducida), lo que proporciona un gran campo visual (espejos retrovisores y de seguridad)."
  },
  {
    "id": 464,
    "area": "Óptica y Fotónica",
    "subtema": "Dispersión Cromática en Prismas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando un haz de luz blanca natural atraviesa un prisma triangular de vidrio transparente, ¿cuál de los colores del espectro visible sufre el mayor ángulo de desviación angular respecto a la trayectoria original?",
    "opciones": [
      "A. El color rojo",
      "B. El color verde",
      "C. El color violeta",
      "D. Todos los colores se desvían exactamente el mismo ángulo"
    ],
    "correcta": 2,
    "explicacion": "En medios dispersivos ordinarios (dispersión normal), el índice de refracción n aumenta a medida que disminuye la longitud de onda: n_violeta > n_rojo. Por la Ley de Snell, a mayor índice de refracción corresponde mayor quiebre, desviándose el violeta más que ningún otro color visible."
  },
  {
    "id": 465,
    "area": "Óptica y Fotónica",
    "subtema": "Redes de Difracción",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una red de difracción plana con espaciado entre rendijas 'd' iluminada con luz de longitud de onda λ forma máximos principales agudos en ángulos θ que cumplen:",
    "opciones": [
      "A. d sen θ = m λ (donde m = 0, ±1, ±2... es el orden espectral)",
      "B. d cos θ = m λ / 2",
      "C. d tan θ = λ² / m",
      "D. sen θ = m / (d λ)"
    ],
    "correcta": 0,
    "explicacion": "La superposición constructiva de cientos o miles de rendijas periódicas exige que la diferencia de camino óptico entre rendijas consecutivas sea un múltiplo entero de longitudes de onda: d senθ = mλ. Las redes permiten separar líneas espectrales con una resolución inalcanzable para prismas."
  },
  {
    "id": 466,
    "area": "Óptica y Fotónica",
    "subtema": "Aberración Cromática",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los espejos astronómicos cóncavos (como los de los telescopios reflectores tipo Newton) están intrínsecamente libres de aberración cromática, a diferencia de las lentes astronómicas de vidrio?",
    "opciones": [
      "A. Porque los espejos tienen masa infinita",
      "B. Porque la Ley de la Reflexión (ángulo de incidencia = ángulo de reflexión) es estrictamente independiente de la longitud de onda de la luz, mientras que la refracción en lentes depende del índice de refracción variable con el color",
      "C. Porque el aluminio refleja solo la luz infrarroja",
      "D. Porque los espejos anulan la difracción"
    ],
    "correcta": 1,
    "explicacion": "En la reflexión todos los colores rebotan con el mismo ángulo (θ_r = θ_i), convergiendo en un foco común. En las lentes refractivas, la dispersión del vidrio hace que cada color tenga una distancia focal distinta, generando halos coloreados borrosos (aberración cromática)."
  },
  {
    "id": 467,
    "area": "Oscilaciones y Ondas",
    "subtema": "Ondas Sísmicas P y S",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En geofísica y sismología, ¿cuál es la diferencia fundamental de propagación entre las ondas sísmicas primarias (P) y las secundarias (S)?",
    "opciones": [
      "A. Las ondas P son gravitatorias y las S son electromagnéticas",
      "B. Las ondas P son longitudinales (compresión) y viajan por sólidos, líquidos y gases; las ondas S son transversales (corte o cizalladura) y no pueden propagarse a través de fluidos líquidos",
      "C. Las ondas S viajan al doble de velocidad que las ondas P",
      "D. Ambas son ondas electromagnéticas polarizadas circularmente"
    ],
    "correcta": 1,
    "explicacion": "Los fluidos no ofrecen resistencia elástica a la deformación por corte o cizalladura (su módulo de cizalla G es nulo). Como las ondas S son ondas de corte transversales puras, no pueden atravesar fluidos líquidos, lo que demostró que el núcleo externo de la Tierra es líquido."
  },
  {
    "id": 468,
    "area": "Oscilaciones y Ondas",
    "subtema": "Efecto Mach y Ondas de Choque",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando un avión supersónico vuela a una velocidad superior a la del sonido en el aire (v > v_s), los frentes de onda de presión se acumulan formando una superficie cónica de choque cuyo semiángulo de apertura μ satisface:",
    "opciones": [
      "A. sen μ = v_s / v = 1 / M (donde M es el Número de Mach)",
      "B. tan μ = M",
      "C. cos μ = 1 / M²",
      "D. sen μ = M"
    ],
    "correcta": 0,
    "explicacion": "En régimen supersónico, el objeto deja atrás sus propias ondas esféricas de sonido. La envolvente tangencial a las ondas esferoidales forma el Cono de Mach, cuyo semiángulo es senμ = v_sonido / v_avion = 1/Mach. Al cruzar el suelo, este frente genera el estampido sónico."
  },
  {
    "id": 469,
    "area": "Oscilaciones y Ondas",
    "subtema": "Velocidad de Ondas en Cuerdas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo varía la velocidad de propagación v de una onda transversal en una cuerda tensa si se cuadruplica la tensión mecánica T aplicada a la misma?",
    "opciones": [
      "A. Se mantiene constante",
      "B. Se duplica (v₂ = 2 v₁)",
      "C. Se cuadruplica",
      "D. Se reduce a la mitad"
    ],
    "correcta": 1,
    "explicacion": "La fórmula de Taylor para ondas transversales en cuerdas es v = √(T / μ), donde μ es la densidad lineal de masa. Al ser v proporcional a la raíz cuadrada de la tensión T, cuadruplicar la tensión hace que la velocidad se multiplique por √4 = 2."
  },
  {
    "id": 470,
    "area": "Óptica y Fotónica",
    "subtema": "Interferometría de Michelson",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Interferómetro de Michelson divide la amplitud de un haz luminoso mediante un espejo semitransparente divisor de haz (beam splitter). Es capaz de detectar desplazamientos de sus espejos con una precisión del orden de:",
    "opciones": [
      "A. Varios milímetros",
      "B. Fracciones de la longitud de onda de la luz utilizada (nanómetros)",
      "C. La masa del observador",
      "D. Solo mediciones acústicas macroscópicas"
    ],
    "correcta": 1,
    "explicacion": "Al recombinar los dos haces perpendiculares en el divisor, el corrimiento de una sola franja de interferencia en el patrón corresponde a un desplazamiento del espejo móvil de apenas λ/2 (pocos cientos de nanómetros), base del experimento Michelson-Morley y de los detectores LIGO."
  },
  {
    "id": 471,
    "area": "Óptica y Fotónica",
    "subtema": "Láser y Emisión Estimulada",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El acrónimo LÁSER ('Light Amplification by Stimulated Emission of Radiation') se fundamenta en el proceso físico cuántico postulado por Albert Einstein en 1917 consistente en:",
    "opciones": [
      "A. La fisión térmica de los fotones incidentes",
      "B. Un fotón incidente induce la desexcitación de un átomo previamente excitado, emitiendo un segundo fotón con idéntica frecuencia, fase, dirección de propagación y polarización que el original",
      "C. La reflexión difusa de luz solar sobre espejos planos",
      "D. La recombinación termonuclear de iones"
    ],
    "correcta": 1,
    "explicacion": "A diferencia de la emisión espontánea donde los fotones salen en direcciones y fases al azar, en la emisión estimulada el fotón interactuante estimula la emisión de una réplica cuántica idéntica y coherente, logrando la amplificación óptica cuando existe inversión de población."
  },
  {
    "id": 472,
    "area": "Óptica y Fotónica",
    "subtema": "Polarización por Dispersión",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si se observa la luz azul del cielo despejado en un ángulo de 90° respecto a la posición del Sol utilizando una lámina polarizadora:",
    "opciones": [
      "A. La luz del cielo no muestra polarización alguna",
      "B. Se comprueba que la luz dispersada a 90° está fuertemente polarizada linealmente en el plano perpendicular al plano de dispersión Sol-observador",
      "C. Se extingue por completo la velocidad de la luz",
      "D. La luz se transforma en rayos gamma"
    ],
    "correcta": 1,
    "explicacion": "Los dipolos inducidos en las moléculas de aire oscilan en el plano perpendicular al rayo solar original. Vistos a 90°, el observador solo ve la radiación transversal a la oscilación dipolar, observando luz con un altísimo grado de polarización lineal."
  },
  {
    "id": 473,
    "area": "Física Moderna y Cuántica",
    "subtema": "Postulados de la Relatividad Especial",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El Segundo Postulado de la Relatividad Especial formulado por Albert Einstein en 1905 establece que:",
    "opciones": [
      "A. La velocidad de la luz depende de la velocidad del foco emisor",
      "B. La velocidad de la luz en el vacío (c ≈ 3 × 10⁸ m/s) es idéntica en magnitud para todos los observadores inerciales, con absoluta independencia del movimiento relativo de la fuente emisora o del receptor",
      "C. La gravedad viaja instantáneamente a velocidad infinita",
      "D. El tiempo transcurre de forma absoluta e idéntica en todo el cosmos"
    ],
    "correcta": 1,
    "explicacion": "Einstein eliminó la necesidad del hipotético éter luminífero al elevar la constancia e invariancia de c en el vacío a la categoría de principio fundamental de la física para todos los sistemas inerciales."
  },
  {
    "id": 474,
    "area": "Física Moderna y Cuántica",
    "subtema": "Dilatación Temporal",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Un astronauta viaja en una nave espacial a una velocidad relativista constante de v = 0.8 c respecto a la Tierra. Para los observadores terrestres, los relojes de la nave espacial:",
    "opciones": [
      "A. Marchan al mismo ritmo exacto que los relojes terrestres",
      "B. Parecen marchar más despacio (dilatación del tiempo: Δt = γ Δτ) debido al factor de Lorentz γ ≈ 1.67",
      "C. Marchan más rápido hacia el futuro",
      "D. Se detienen de forma permanente y retroceden"
    ],
    "correcta": 1,
    "explicacion": "El tiempo propio Δτ medido en reposo respecto a la nave es el intervalo mínimo entre eventos en el mismo lugar. En cualquier marco donde la nave se mueva, el tiempo transcurrido es dilatado: Δt = γ Δτ, donde γ = 1/√(1 - 0.8²) = 1/0.6 ≈ 1.67."
  },
  {
    "id": 475,
    "area": "Física Moderna y Cuántica",
    "subtema": "Muones Atmosféricos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Los muones creados por rayos cósmicos a 15 km de altitud tienen una vida media en reposo de solo 2.2 microsegundos. Clásicamente se desintegrarían tras recorrer apenas 660 metros, pero llegan copiosamente a nivel del mar. ¿Cómo lo explica la física?",
    "opciones": [
      "A. Los muones son partículas sin masa que viajan a velocidad infinita",
      "B. Por la dilatación relativista del tiempo: al viajar a v ≈ 0.998 c (γ ≈ 15), su vida media vista desde la Tierra se dilata hasta más de 30 microsegundos, permitiéndoles alcanzar el suelo",
      "C. La gravedad terrestre atrae a los muones duplicando su masa",
      "D. Se crean continuamente en el suelo por reacción de las plantas"
    ],
    "correcta": 1,
    "explicacion": "Desde el marco terrestre, el tiempo del muón se dilata (Δt = γ Δτ), viviendo lo suficiente para llegar al mar. Desde el marco del propio muón, su vida es de 2.2 μs pero la atmósfera de 15 km se contrae por Lorentz a solo 1 km (L = L₀/γ), logrando impactar la superficie."
  },
  {
    "id": 476,
    "area": "Física Moderna y Cuántica",
    "subtema": "Contracción de Lorentz",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La contracción de longitud de Lorentz (L = L₀ / γ) predice que un objeto de longitud propia L₀ que se mueve con velocidad relativista v respecto a un observador:",
    "opciones": [
      "A. Se acorta exclusivamente en la dirección paralela a su vector de movimiento",
      "B. Se encoge esféricamente en todas las tres dimensiones espaciales",
      "C. Aumenta su longitud física aparente",
      "D. Mantiene sus dimensiones perfectamente inalteradas"
    ],
    "correcta": 0,
    "explicacion": "La contracción de Lorentz es estrictamente unidireccional a lo largo del eje del movimiento relativo. Las dimensiones espaciales perpendiculares a la trayectoria no sufren ninguna alteración (y' = y, z' = z)."
  },
  {
    "id": 477,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relatividad de la Simultaneidad",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué consecuencia directa tiene la relatividad especial sobre dos sucesos ocurridos en diferentes ubicaciones espaciales que resultan ser simultáneos para un observador inercial A?",
    "opciones": [
      "A. Serán simultáneos para absolutamente todos los observadores del universo",
      "B. No serán simultáneos para otro observador inercial B que se mueva con velocidad relativa respecto a A",
      "C. Nunca podrán ser observados por nadie",
      "D. Uno de los sucesos debe ocurrir en el pasado infinito"
    ],
    "correcta": 1,
    "explicacion": "La simultaneidad no es absoluta sino relativa al marco de referencia. Por las transformaciones de Lorentz: Δt' = γ (Δt - v Δx / c²). Aunque Δt = 0 en el marco A, si los sucesos están separados espacialmente (Δx ≠ 0), en el marco B móvil Δt' ≠ 0."
  },
  {
    "id": 478,
    "area": "Física Moderna y Cuántica",
    "subtema": "Adición de Velocidades",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una nave espacial se aleja de la Tierra a 0.7 c y dispara hacia adelante una sonda a 0.7 c respecto a la nave. ¿Cuál es la velocidad u de la sonda medida desde la Tierra?",
    "opciones": [
      "A. 1.40 c (supera a la velocidad de la luz)",
      "B. 0.94 c, calculada mediante u = (v + u') / (1 + v·u' / c²)",
      "C. 0.70 c",
      "D. 1.00 c exactamente"
    ],
    "correcta": 1,
    "explicacion": "Por la fórmula relativista de Einstein: u = (0.7c + 0.7c) / (1 + 0.7 × 0.7) = 1.4c / (1 + 0.49) = 1.4c / 1.49 ≈ 0.9396 c. Ningún cuerpo masivo puede alcanzar o superar la velocidad de la luz c en ningún sistema inercial."
  },
  {
    "id": 479,
    "area": "Física Moderna y Cuántica",
    "subtema": "Equivalencia Masa-Energía",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La famosa ecuación de Albert Einstein E₀ = m c² demuestra fundamentalmente que:",
    "opciones": [
      "A. La energía solo existe en forma de ondas de luz",
      "B. La masa en reposo de un cuerpo representa una reserva colosal de energía intrínseca concentrada, donde masa y energía son manifestaciones intercambiables de la misma entidad física",
      "C. La velocidad de la luz se duplica cuando la masa aumenta",
      "D. La masa se destruye sin dejar rastro en todas las reacciones químicas"
    ],
    "correcta": 1,
    "explicacion": "E₀ = mc² demuestra la equivalencia profunda entre masa inercial y energía en reposo. Incluso un solo gramo de materia ordinaria equivale a 9 × 10¹³ Joules (la energía liberada por unas 21 kilotoneladas de TNT)."
  },
  {
    "id": 480,
    "area": "Física Moderna y Cuántica",
    "subtema": "Relación Energía-Momento Relativista",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la ecuación completa que vincula la energía total E, el momento lineal p y la masa en reposo m₀ de cualquier partícula relativista?",
    "opciones": [
      "A. E = p c + m₀ c²",
      "B. E² = (p c)² + (m₀ c²)²",
      "C. E = 1/2 m₀ v² + p c",
      "D. E² = p² / (2 m₀)"
    ],
    "correcta": 1,
    "explicacion": "E² = (pc)² + (m₀c²)² es el invariante relativista de cuadrimomento fundamental. Para una partícula en reposo (p=0) se reduce a E = m₀c², mientras que para partículas sin masa en reposo como el fotón (m₀=0) da E = pc (p = E/c = h/λ)."
  },
  {
    "id": 481,
    "area": "Física Moderna y Cuántica",
    "subtema": "Fotones y Momento Lineal",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Aunque un fotón de luz carece de masa en reposo (m₀ = 0), transporta momento lineal p y energía E. ¿Cuál es la relación entre ambas magnitudes para un fotón?",
    "opciones": [
      "A. p = E / c",
      "B. p = E · c",
      "C. p = 0 (los fotones no tienen momento)",
      "D. p = E / c²"
    ],
    "correcta": 0,
    "explicacion": "De la relación relativista con m₀ = 0 se obtiene directamente E = pc, por lo que p = E/c = hf/c = h/λ. Este momento lineal permite a la luz ejercer presión de radiación mecánica real sobre velas solares en el espacio."
  },
  {
    "id": 482,
    "area": "Física Moderna y Cuántica",
    "subtema": "Intervalo Espaciotemporal",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En el espacio-tiempo de Minkowski de cuatro dimensiones, el intervalo invariante entre dos sucesos viene dado por Δs² = c² Δt² - (Δx² + Δy² + Δz²). Si Δs² > 0, se dice que el intervalo es:",
    "opciones": [
      "A. De tipo espacio (inaccesible causalmente a partículas ordinarias)",
      "B. De tipo tiempo (es físicamente posible que un suceso sea causa del otro)",
      "C. De tipo nulo o luz",
      "D. Imaginario puro sin significado físico"
    ],
    "correcta": 1,
    "explicacion": "Un intervalo de tipo tiempo (Δs² > 0) significa que la separación temporal cΔt supera a la separación espacial. Por ende, existe un sistema inercial donde ambos sucesos ocurren en el mismo lugar y una señal sublumínica puede conectarlos causalmente."
  },
  {
    "id": 483,
    "area": "Física Moderna y Cuántica",
    "subtema": "Principio de Equivalencia de Einstein",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué postula el Principio de Equivalencia Débil de Albert Einstein, pilar fundamental de la Relatividad General?",
    "opciones": [
      "A. La energía eléctrica es equivalente a la energía magnética",
      "B. Es localmente imposible distinguir mediante ningún experimento mecánico entre los efectos de un campo gravitatorio uniforme y los efectos de un sistema de referencia uniformemente acelerado",
      "C. Todos los átomos del universo tienen la misma masa gravitacional",
      "D. La fuerza electromagnética se unifica con la gravedad a baja energía"
    ],
    "correcta": 1,
    "explicacion": "Un observador encerrado en una cápsula cerrada sin ventanas no puede determinar si está en reposo en la superficie de la Tierra (1 g) o en el espacio profundo acelerado por motores a 9.8 m/s². La masa inercial y la masa gravitatoria son estrictamente equivalentes."
  },
  {
    "id": 484,
    "area": "Física Moderna y Cuántica",
    "subtema": "Curvatura del Espacio-Tiempo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la Relatividad General de Einstein (1915), ¿cuál es la naturaleza de la interacción gravitatoria?",
    "opciones": [
      "A. Una fuerza clásica misteriosa que actúa a distancia a través del vacío",
      "B. La manifestación geométrica de la curvatura del tejido del espacio-tiempo provocada por la presencia de masa, energía y momento",
      "C. Un intercambio continuo de fotones virtuales",
      "D. Una propiedad térmica de los núcleos atómicos"
    ],
    "correcta": 1,
    "explicacion": "Como resumió célebremente John Archibald Wheeler: 'La materia le dice al espacio-tiempo cómo curvarse, y el espacio-tiempo le dice a la materia cómo moverse'. Los cuerpos en órbita siguen trayectorias de menor distancia (geodésicas) en un espacio curvado."
  },
  {
    "id": 485,
    "area": "Física Moderna y Cuántica",
    "subtema": "Eclipse de 1919 y Deflexión de la Luz",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué confirmación observacional histórica obtuvo la expedición de Sir Arthur Eddington durante el eclipse solar total del 29 de mayo de 1919?",
    "opciones": [
      "A. El descubrimiento de un nuevo planeta entre Mercurio y el Sol",
      "B. La deflexión angular precisa de la luz de estrellas lejanas al pasar rozando el borde del Sol (≈ 1.75 segundos de arco), confirmando la predicción exacta de la curvatura del espacio-tiempo de Einstein",
      "C. La ausencia de manchas solares durante el eclipse",
      "D. La detección de neutrinos solares por primera vez"
    ],
    "correcta": 1,
    "explicacion": "Eddington midió la posición aparente de estrellas detrás del Sol durante la oscuridad del eclipse. El desvío observado coincidió con el valor predicho por la Relatividad General (4GM/(c²R)), el doble del que predecía la teoría corpuscular newtoniana clásica."
  },
  {
    "id": 486,
    "area": "Física Moderna y Cuántica",
    "subtema": "Dilatación Gravitacional del Tiempo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "De acuerdo con la Relatividad General, ¿cómo transcurre el tiempo medido por un reloj atómico situado cerca de un objeto astronómico sumamente masivo comparado con un reloj situado en el espacio profundo?",
    "opciones": [
      "A. El reloj en el campo gravitatorio más intenso marcha más lentamente (dilatación gravitacional del tiempo)",
      "B. El reloj marcha mucho más rápido",
      "C. El reloj no se ve afectado en lo más mínimo",
      "D. El reloj invierte el sentido de sus manecillas"
    ],
    "correcta": 0,
    "explicacion": "Cuanto más profundo se encuentra un reloj en un pozo de potencial gravitatorio, más lentamente avanza el tiempo propio: dτ = dt √(1 - 2GM/(rc²)). La luz emitida desde ese campo sufre un corrimiento al rojo gravitacional (pierde energía al escapar)."
  },
  {
    "id": 487,
    "area": "Física Moderna y Cuántica",
    "subtema": "Corrección Relativista en GPS",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Los satélites de navegación GPS en órbita a 20,200 km de altitud requieren correcciones relativistas diarias porque sus relojes atómicos se desfasan respecto al suelo. ¿Cómo actúan los efectos combinados?",
    "opciones": [
      "A. Solo la relatividad especial retrasa los relojes 50 segundos al día",
      "B. Por su velocidad orbital se retrasan ~7 μs/día (relatividad especial), pero por estar en menor gravedad se adelantan ~45 μs/día (relatividad general), acumulando un adelanto neto de ~38 microsegundos por día que arruinaría el GPS en horas si no se corrigiera",
      "C. No se requiere ninguna corrección relativista",
      "D. El efecto del viento solar anula cualquier desface temporal"
    ],
    "correcta": 1,
    "explicacion": "El desfase neto de +38 microsegundos diarios provocaría un error acumulado en la posición en tierra de más de 11 kilómetros cada día (38 μs × c ≈ 11.4 km). El software del GPS ajusta la frecuencia de los osciladores atómicos de antemano para compensarlo."
  },
  {
    "id": 488,
    "area": "Física Moderna y Cuántica",
    "subtema": "Radio de Schwarzschild",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál es el Radio de Schwarzschild R_s que define el horizonte de sucesos de un agujero negro estático no rotante de masa M?",
    "opciones": [
      "A. R_s = 2 G M / c²",
      "B. R_s = G M / (2 c²)",
      "C. R_s = √(G M / c)",
      "D. R_s = 4 G M² / c"
    ],
    "correcta": 0,
    "explicacion": "Karl Schwarzschild dedujo en 1916 la primera solución exacta a las ecuaciones de campo de Einstein en el vacío: R_s = 2GM/c². Marca el radio del horizonte de sucesos donde la velocidad de escape iguala a la de la luz y nada, ni siquiera la luz, puede escapar."
  },
  {
    "id": 489,
    "area": "Física Moderna y Cuántica",
    "subtema": "Radiación de Hawking",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Stephen Hawking predijo en 1974 que los agujeros negros no son totalmente negros sino que emiten una débil radiación térmica continua (Radiación de Hawking). ¿Cuál es el mecanismo cuántico subyacente?",
    "opciones": [
      "A. La fusión de protones en el interior de la singularidad",
      "B. La creación continua de pares partícula-antipartícula virtuales por fluctuaciones del vacío en el horizonte de sucesos: una partícula cae dentro con energía negativa y la otra escapa al infinito con energía positiva, haciendo que el agujero pierda masa lentamente",
      "C. La reflexión de rayos gamma cósmicos por el disco de acreción",
      "D. La descomposición espontánea de los gravitones"
    ],
    "correcta": 1,
    "explicacion": "Al aplicar la teoría cuántica de campos en espaciotiempo curvo, Hawking demostró que los agujeros negros tienen una temperatura cuántica T = ħc³ / (8π G M k_B) inversamente proporcional a su masa, evaporándose en escalas de tiempo cosmológicas."
  },
  {
    "id": 490,
    "area": "Física Moderna y Cuántica",
    "subtema": "Ondas Gravitacionales",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En septiembre de 2015, los observatorios interferométricos LIGO detectaron por primera vez en la historia ondas gravitacionales (evento GW150914). ¿Cuál fue el cataclismo cósmico que las originó?",
    "opciones": [
      "A. La explosión de una supernova en la Vía Láctea",
      "B. La fusión y colisión de dos agujeros negros masivos (de unas 36 y 29 masas solares) a 1,300 millones de años luz de la Tierra",
      "C. La colisión del cometa Halley contra el Sol",
      "D. El colapso del núcleo de la estrella Betelgeuse"
    ],
    "correcta": 1,
    "explicacion": "Dos agujeros negros giraron en espiral a casi la velocidad de la luz antes de fusionarse, convirtiendo el equivalente a 3 masas solares en pura energía de curvatura espaciotemporal radiada en una fracción de segundo, confirmando la predicción de Einstein de 1916."
  },
  {
    "id": 491,
    "area": "Física Moderna y Cuántica",
    "subtema": "Precesión del Perihelio de Mercurio",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué anomalía orbital histórica de Mercurio, inexplicable por la gravedad newtoniana aun considerando las perturbaciones de todos los demás planetas, resolvió con exactitud la Relatividad General?",
    "opciones": [
      "A. Una variación periódica en su radio ecuatorial",
      "B. Un exceso anómalo de precesión del perihelio de 43 segundos de arco por siglo",
      "C. Una disminución continua en su masa gravitatoria",
      "D. La detención completa de su periodo de rotación"
    ],
    "correcta": 1,
    "explicacion": "Las perturbaciones newtonianas de Venus, Júpiter y demás planetas explicaban 531 de los 574 segundos de arco por siglo de precesión observados. Los 43 segundos de arco restantes por siglo eran un enigma hasta que Einstein demostró que surgían de la curvatura del espaciotiempo cerca del Sol."
  },
  {
    "id": 492,
    "area": "Física Moderna y Cuántica",
    "subtema": "Lentes Gravitacionales y Anillos de Einstein",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando una galaxia masiva o cúmulo de galaxias se interpone exactamente entre una fuente luminosa muy lejana y la Tierra, la deflexión de la luz crea una imagen deformada en forma de círculo casi perfecto llamada:",
    "opciones": [
      "A. Disco de Airy",
      "B. Anillo de Einstein",
      "C. Halo de Debye",
      "D. Cinturón de Kuiper"
    ],
    "correcta": 1,
    "explicacion": "Por simetría axial, si la fuente distante, la masa deflectora (lente) y el observador están perfectamente alineados, la luz se curva uniformemente alrededor de la lente gravitacional formando un círculo luminoso completo conocido como Anillo de Einstein."
  },
  {
    "id": 493,
    "area": "Física Moderna y Cuántica",
    "subtema": "Límite Sublumínico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué se requiere una cantidad infinita de energía para acelerar una partícula con masa en reposo m₀ > 0 hasta igualar la velocidad de la luz c?",
    "opciones": [
      "A. Porque la masa se disipa en ondas de radio antes de llegar a c",
      "B. Porque el factor de Lorentz γ = 1 / √(1 - v²/c²) tiende a infinito cuando v → c, haciendo que la energía cinética y el momento relativista diverjan hacia el infinito",
      "C. Porque los campos eléctricos dejan de operar a velocidades altas",
      "D. Porque la temperatura de la partícula alcanza el cero absoluto"
    ],
    "correcta": 1,
    "explicacion": "La energía relativista total es E = γ m₀ c². A medida que v se aproxima a c, el denominador √(1 - v²/c²) tiende a cero, haciendo que γ tienda a infinito. Acelerar la partícula a c requeriría suministrar una energía mayor que toda la energía disponible en el universo."
  },
  {
    "id": 494,
    "area": "Física Moderna y Cuántica",
    "subtema": "Efecto Doppler Relativista",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "A diferencia del efecto Doppler acústico clásico, el Efecto Doppler Relativista de la luz predice un corrimiento de frecuencia incluso cuando la fuente se mueve de forma perpendicular a la línea de visión del observador (Doppler transversal). Esto ocurre debido a:",
    "opciones": [
      "A. La dilatación relativista del tiempo en el foco emisor",
      "B. La reflexión de fotones en la ionósfera",
      "C. La masa gravitatoria de los fotones",
      "D. La polarización circular del vacío"
    ],
    "correcta": 0,
    "explicacion": "En el Doppler transversal no hay componente de aproximación o alejamiento radial, por lo que clásicamente no habría cambio de frecuencia. Sin embargo, en relatividad el reloj del emisor marcha más lento por dilatación temporal (factor γ), reduciendo la frecuencia observada: f' = f₀ / γ."
  },
  {
    "id": 495,
    "area": "Física Moderna y Cuántica",
    "subtema": "Cuadrivectores",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El producto escalar de Minkowski del cuadrimomento P^μ = (E/c, p) de una partícula consigo mismo, P_μ P^μ, es un invariante relativista cuyo valor numérico es igual a:",
    "opciones": [
      "A. Cero",
      "B. (m₀ c)²",
      "C. E²",
      "D. ħ / c"
    ],
    "correcta": 1,
    "explicacion": "El producto interior es P_μ P^μ = (E/c)² - p² = (m₀ c²)² / c² = (m₀ c)². Al ser un escalar de Lorentz, tiene el mismo valor idéntico en absolutamente todos los sistemas de referencia inerciales, garantizando la consistencia de la dinámica relativista."
  },
  {
    "id": 496,
    "area": "Física Moderna y Cuántica",
    "subtema": "Cono de Luz y Causalidad",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En un diagrama espaciotemporal de Minkowski, ¿qué separa la superficie hipersuperficial del 'Cono de Luz' que emana del origen (x = 0, t = 0)?",
    "opciones": [
      "A. Separa los átomos con carga positiva de los que tienen carga negativa",
      "B. Delimita la región del futuro y pasado causalmente accesibles (trayectorias con v ≤ c dentro del cono) del exterior causalmente desconectado (tipo espacio con v > c)",
      "C. Marca la frontera de los agujeros de gusano transitables",
      "D. Separa la materia visible de la energía oscura"
    ],
    "correcta": 1,
    "explicacion": "Las líneas de luz a 45° (donde x = ±ct) forman el cono de luz. Nada puede propagar información o materia a velocidad superlumínica (v > c); por tanto, ningún suceso en el origen puede influir o ser influido por eventos fuera de su cono de luz."
  },
  {
    "id": 497,
    "area": "Física Moderna y Cuántica",
    "subtema": "Energía Cinética Relativista",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la expresión exacta para la energía cinética K de una partícula de masa en reposo m₀ que se mueve a velocidad relativista v?",
    "opciones": [
      "A. K = 1/2 m₀ v²",
      "B. K = (γ - 1) m₀ c²",
      "C. K = γ m₀ v²",
      "D. K = m₀ c² / γ"
    ],
    "correcta": 1,
    "explicacion": "La energía total es E = K + E₀ = γ m₀ c². Despejando la energía cinética resulta K = E - E₀ = (γ - 1) m₀ c². Al desarrollar γ en serie de Taylor para velocidades bajas (v << c), se recupera con precisión milimétrica la expresión clásica newtoniana: K ≈ 1/2 m₀ v²."
  },
  {
    "id": 498,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Catástrofe Ultravioleta y Cuanto de Planck",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué hipótesis revolucionaria propuso Max Planck en diciembre de 1900 para resolver la 'catástrofe ultravioleta' de la radiación de cuerpo negro clásico?",
    "opciones": [
      "A. Que la velocidad de la luz era proporcional a la temperatura",
      "B. Que los osciladores atómicos de las paredes solo pueden emitir o absorber energía electromagnética en paquetes discretos múltiplos de un cuanto elemental: E = n h ν",
      "C. Que la radiación térmica no obedece a las leyes de la termodinámica",
      "D. Que los átomos colapsaban a altas frecuencias"
    ],
    "correcta": 1,
    "explicacion": "La física clásica (Ley de Rayleigh-Jeans) predecía absurdamente que a frecuencias ultravioletas la energía radiada divergía al infinito. Planck eliminó la catástrofe postulando que la energía electromagnética está cuantizada en múltiplos de hν, naciendo la Física Cuántica."
  },
  {
    "id": 499,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Fotoeléctrico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En el efecto fotoeléctrico (explicado por Albert Einstein en 1905, lo que le valió el Premio Nobel), si la frecuencia de la luz incidente es inferior a la frecuencia umbral ν₀ del metal:",
    "opciones": [
      "A. Se emiten electrones lentamente tras varias horas de acumulación continua de luz",
      "B. No se emite ni un solo electrón, sin importar cuán intensa o brillante sea la fuente luminosa",
      "C. Se emiten electrones pero con carga positiva",
      "D. El metal se funde instantáneamente"
    ],
    "correcta": 1,
    "explicacion": "Cada fotón individual interactúa con un solo electrón (hν). Si la energía del fotón es inferior a la función trabajo Φ = hν₀ del metal, ningún electrón puede ser arrancado. La física clásica predecía que aumentando la intensidad se emitirían electrones, lo cual fue rotundamente refutado."
  },
  {
    "id": 500,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Compton",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Arthur Compton demostró experimentalmente en 1923 que al chocar fotones de rayos X contra electrones libres, la longitud de onda de los fotones dispersados aumentaba (Δλ = λ' - λ > 0). ¿Qué confirmó este experimento?",
    "opciones": [
      "A. Que los fotones no interactúan con electrones",
      "B. Que los fotones se comportan como partículas corpusculares localizadas que transportan tanto energía (hf) como momento lineal relativista (h/λ) obedeciendo las leyes clásicas de colisión elástica",
      "C. Que la carga del electrón varía con el ángulo de dispersión",
      "D. Que la constante de Planck no es constante"
    ],
    "correcta": 1,
    "explicacion": "El cambio de longitud de onda es Δλ = (h / (m_e c)) (1 - cosθ), donde h/(m_e c) ≈ 0.0243 Å es la longitud de onda Compton del electrón. Demostró definitivamente la naturaleza corpuscular de la luz en colisiones relativistas."
  },
  {
    "id": 501,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Hipótesis de De Broglie",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La hipótesis de Louis de Broglie de 1924 postuló que la dualidad onda-partícula se extiende a toda la materia física. Para una partícula con masa m que viaja a velocidad v, su longitud de onda de materia asociada es:",
    "opciones": [
      "A. λ = h / (m v)",
      "B. λ = m v / h",
      "C. λ = h m v",
      "D. λ = h / c²"
    ],
    "correcta": 0,
    "explicacion": "De Broglie asignó a toda partícula material con momento p = mv una longitud de onda ondulatoria λ = h/p = h/(mv). Para un electrón a velocidades de laboratorio da longitudes del orden de los ángstroms (tamaño de redes cristalinas), permitiendo microscopía electrónica."
  },
  {
    "id": 502,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Experimento de Davisson-Germer",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué comprobaron Clinton Davisson y Lester Germer en 1927 al dispersar un haz de electrones de baja energía contra un cristal de níquel?",
    "opciones": [
      "A. Que los electrones son más pesados que los protones",
      "B. Observaron picos de difracción de electrones que obedecían con precisión a la Ley de Bragg, demostrando experimentalmente por primera vez el comportamiento ondulatorio de la materia postulado por De Broglie",
      "C. Que el níquel no tiene electrones",
      "D. La existencia de la antimateria"
    ],
    "correcta": 1,
    "explicacion": "Los electrones sufrieron interferencia constructiva en los planos cristalinos del níquel con longitudes de onda λ exactamente coincidentes con la fórmula de de Broglie λ = h/√(2mE), transformando la hipótesis ondulatoria en un hecho empírico incontrovertible (Premio Nobel 1937)."
  },
  {
    "id": 503,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Principio de Indeterminación de Heisenberg",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Principio de Incertidumbre o Indeterminación de Werner Heisenberg (1927) postula que para las variables canónicamente conjugadas de posición x y momento lineal p_x:",
    "opciones": [
      "A. Δx · Δp_x = 0 con instrumentos suficientemente precisos",
      "B. Δx · Δp_x ≥ ħ / 2 (donde ħ = h / 2π)",
      "C. La posición solo puede medirse si la velocidad es igual a c",
      "D. Δx / Δp_x ≥ c"
    ],
    "correcta": 1,
    "explicacion": "No se trata de una imperfección instrumental, sino de una propiedad ondulatoria intrínseca del universo cuántico: un estado cuántico no puede tener simultáneamente una posición perfectamente localizada y un momento lineal unívocamente definido."
  },
  {
    "id": 504,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Incertidumbre Energía-Tiempo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La relación de indeterminación entre energía y tiempo ΔE · Δt ≥ ħ/2 explica físicamente fenómenos como:",
    "opciones": [
      "A. La creación efímera de partículas virtuales en el vacío cuántico y el ancho natural finito de las líneas de emisión espectral de estados atómicos excitados",
      "B. La velocidad finita del sonido en metales",
      "C. La dilatación temporal de Lorentz",
      "D. La carga neta de los neutrones"
    ],
    "correcta": 0,
    "explicacion": "Si un estado cuántico excitado tiene una vida media finita Δt, su nivel energético posee una incertidumbre intrínseca ΔE ≥ ħ/(2Δt), lo que produce un ensanchamiento espectral natural. Asimismo, el vacío puede 'prestar' energía ΔE para crear pares virtuales si viven menos de Δt."
  },
  {
    "id": 505,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Ecuación de Schrödinger",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la Ecuación de Schrödinger independiente del tiempo, Ĥ ψ = E ψ, ¿qué representa matemáticamente el operador Hamiltoniano Ĥ?",
    "opciones": [
      "A. El operador de la masa relativista",
      "B. El operador de la energía total del sistema cuántico, que suma los operadores de energía cinética y energía potencial: Ĥ = - (ħ² / 2m) ∇² + V(r)",
      "C. El operador del espín de Dirac",
      "D. La transformada de Laplace de la temperatura"
    ],
    "correcta": 1,
    "explicacion": "El Hamiltoniano Ĥ es el generador de la evolución temporal y representa la energía total. La ecuación Ĥψ = Eψ es una ecuación de autovalores donde las funciones de onda admisibles son autofunciones y las energías cuantizadas son los autovalores E."
  },
  {
    "id": 506,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Interpretación de Born",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "De acuerdo con la interpretación probabilística de Max Born (Premio Nobel 1954), la cantidad |ψ(x, t)|² dx representa:",
    "opciones": [
      "A. La densidad de masa gravitacional de la partícula",
      "B. La probabilidad de encontrar a la partícula en el intervalo espacial infinitesimal entre x y x + dx en el instante t",
      "C. La fuerza neta ejercida sobre el electrón",
      "D. La temperatura local del cuanto"
    ],
    "correcta": 1,
    "explicacion": "La función de onda cuántica ψ es en general compleja y no representa una sustancia física densa distribuida, sino una amplitud de probabilidad. Su módulo al cuadrado |ψ|² = ψ*ψ es la densidad de probabilidad espacial de hallar la partícula localizada."
  },
  {
    "id": 507,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Pozo de Potencial Infinito",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Para una partícula cuántica confinada en un pozo de potencial unidimensional infinito de ancho L ('partícula en una caja'), los niveles de energía cuantizados permitidos son proporcionales a:",
    "opciones": [
      "A. n (lineales con el número cuántico)",
      "B. n² (E_n = (n² π² ħ²) / (2 m L²), con n = 1, 2, 3...)",
      "C. √n",
      "D. 1 / n²"
    ],
    "correcta": 1,
    "explicacion": "Las condiciones de contorno anulan la función de onda en las paredes (ψ(0)=ψ(L)=0), forzando un número entero de medias longitudes de onda en la caja: L = n (λ/2) = n (h / 2p). Despejando la energía cinética E = p²/(2m) resulta E_n = n² h² / (8mL²)."
  },
  {
    "id": 508,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Túnel Cuántico",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué predice la mecánica cuántica cuando una partícula con energía E incide contra una barrera de potencial finita V₀ cuya altura es superior a la energía de la partícula (V₀ > E)?",
    "opciones": [
      "A. La partícula es reflejada siempre con un 100% de certeza absoluta, idéntico a la física clásica",
      "B. Existe una probabilidad finita no nula de que la partícula 'atraviese' la barrera prohibida y emerja al otro lado (Efecto Túnel Cuántico), decayendo la función de onda exponencialmente dentro de la barrera",
      "C. La partícula destruye la barrera por resonancia acústica",
      "D. La partícula se transforma en un positrón"
    ],
    "correcta": 1,
    "explicacion": "Dentro de la barrera clásicamente prohibida, la función de onda no cae abruptamente a cero sino que decrece exponencialmente: ψ(x) ∝ e^(-κx). Si la barrera es suficientemente delgada, la amplitud no se extingue del todo y hay transmisión cuántica túnel."
  },
  {
    "id": 509,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Microscopio de Efecto Túnel (STM)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Microscopio de Efecto Túnel (STM), inventado por Gerd Binnig y Heinrich Rohrer en 1981 en IBM Zúrich, logra resolución a escala de átomos individuales aprovechando que la corriente túnel entre la punta y la muestra:",
    "opciones": [
      "A. Crece con la masa atómica del soporte",
      "B. Decae de forma extremadamente pronunciada y exponencial con la distancia de separación d (I_túnel ∝ e^(-2κd)), variando en un orden de magnitud por cada décima de nanómetro",
      "C. Es una corriente superconductora de alta temperatura",
      "D. Depende de la velocidad del sonido en el vacío"
    ],
    "correcta": 1,
    "explicacion": "Esa hipersensibilidad exponencial a la distancia hace que prácticamente el 99% de la corriente túnel fluya exclusivamente a través del átomo más saliente del extremo de la punta metálica, permitiendo mapear la densidad electrónica atómica con resolución sub-angstrom."
  },
  {
    "id": 510,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Energía de Punto Cero",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la energía del estado cuántico fundamental (n = 0) de un oscilador armónico cuántico simple de frecuencia angular ω?",
    "opciones": [
      "A. E₀ = 0 (cero)",
      "B. E₀ = 1/2 ħ ω (Energía de Punto Cero)",
      "C. E₀ = ħ ω",
      "D. E₀ = -ħ ω"
    ],
    "correcta": 1,
    "explicacion": "Los niveles de energía del oscilador armónico cuántico son E_n = (n + 1/2) ħω. En el estado fundamental n=0, la energía no puede ser cero debido al principio de indeterminación de Heisenberg (si E=0, la partícula estaría inmóvil en x=0, violando ΔxΔp ≥ ħ/2)."
  },
  {
    "id": 511,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Modelo Atómico de Bohr",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál fue el postulado central que introdujo Niels Bohr en 1913 para cuantizar las órbitas electrónicas en el átomo de hidrógeno y evitar el colapso radiativo clásico del electrón?",
    "opciones": [
      "A. El electrón orbita a la velocidad de la luz en todo momento",
      "B. El momento angular orbital L del electrón está rigurosamente cuantizado en múltiplos enteros de la constante reducida de Planck: L = m v r = n ħ (donde n = 1, 2, 3...)",
      "C. Los protones giran alrededor del electrón",
      "D. La carga eléctrica del átomo oscila periódicamente"
    ],
    "correcta": 1,
    "explicacion": "Al fijar L = nħ, Bohr dedujo que los radios orbitales sólo pueden adoptar valores r_n = n² a₀ (donde a₀ ≈ 0.529 Å es el radio de Bohr) y energías discretas E_n = -13.6 eV / n², explicando las líneas espectrales sin emisión de radiación en las órbitas estacionarias."
  },
  {
    "id": 512,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Series Espectrales del Hidrógeno",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En el espectro de emisión del átomo de hidrógeno, las transiciones electrónicas que terminan en el nivel fundamental n = 1 forman la Serie de Lyman, la cual cae en la región espectral:",
    "opciones": [
      "A. Infrarroja",
      "B. Visible pura",
      "C. Ultravioleta",
      "D. Microondas"
    ],
    "correcta": 2,
    "explicacion": "Las transiciones hacia n=1 (Lyman) emiten fotones de alta energía (entre 10.2 eV y 13.6 eV), cayendo enteramente en el ultravioleta. Las transiciones hacia n=2 (Serie de Balmer) caen en el espectro visible, y hacia n=3 (Paschen) en el infrarrojo."
  },
  {
    "id": 513,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Números Cuánticos Atómicos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Para un electrón en un átomo con número cuántico principal n = 3, ¿cuáles son los valores posibles que puede tomar el número cuántico de momento angular orbital l?",
    "opciones": [
      "A. l = 1, 2, 3",
      "B. l = 0, 1, 2 (orbitales s, p, d)",
      "C. l = -3, 0, +3",
      "D. l = 0 exclusivamente"
    ],
    "correcta": 1,
    "explicacion": "Para un valor dado de n, el número cuántico azimutal u orbital l puede adoptar cualquier valor entero desde 0 hasta n - 1. Para n = 3, los valores permitidos son l = 0 (subnivel 3s), l = 1 (subnivel 3p) y l = 2 (subnivel 3d)."
  },
  {
    "id": 514,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Principio de Exclusión de Pauli",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El Principio de Exclusión formulado por Wolfgang Pauli en 1925 establece que en un mismo átomo polielectrónico:",
    "opciones": [
      "A. Todos los electrones deben tener exactamente el mismo espín",
      "B. Dos electrones (o en general dos fermiones idénticos) no pueden ocupar simultáneamente el mismo estado cuántico; es decir, no pueden compartir los cuatro números cuánticos (n, l, m_l, m_s)",
      "C. El número de protones debe ser estrictamente impar",
      "D. Los electrones caen espontáneamente al núcleo"
    ],
    "correcta": 1,
    "explicacion": "El Principio de Pauli explica la estructura en capas de la Tabla Periódica y la estabilidad de la materia. Si los electrones no fueran fermiones sujetos a exclusión, colapsarían todos al orbital 1s de mínima energía, impidiendo la química y la vida."
  },
  {
    "id": 515,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Experimento de Stern-Gerlach",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué demostró el experimento de Otto Stern y Walther Gerlach (1922) al hacer pasar un haz colimado de átomos neutros de plata a través de un campo magnético espacialmente no homogéneo?",
    "opciones": [
      "A. La cuantización espacial del espín intrínseco del electrón, dividiéndose el haz en exactamente dos trazas discretas separadas (espín arriba +1/2 y espín abajo -1/2)",
      "B. Que los átomos de plata tienen carga eléctrica neta positiva",
      "C. La velocidad de la luz en presencia de imanes",
      "D. La descomposición radiactiva de la plata en oro"
    ],
    "correcta": 0,
    "explicacion": "La física clásica predecía una distribución continua y uniforme de impactos en la pantalla. La separación neta en exactamente dos componentes simétricas discretas reveló la cuantización espacial del momento magnético y del momento angular intrínseco (espín s = 1/2)."
  },
  {
    "id": 516,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Teorema Espín-Estadística",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "De acuerdo con el Teorema Espín-Estadística de la teoría cuántica de campos relativista, las partículas de espín entero (0, 1, 2...) y las de espín semientero (1/2, 3/2...) obedecen respectivamente a:",
    "opciones": [
      "A. Estadística de Boltzmann únicamente",
      "B. Los bosones (espín entero) obedecen la estadística de Bose-Einstein (sin principio de exclusión); los fermiones (espín semientero) obedecen la de Fermi-Dirac (con principio de exclusión de Pauli)",
      "C. Los fermiones son partículas de luz y los bosones partículas con masa",
      "D. Ambas estadísticas son idénticas en todas las temperaturas"
    ],
    "correcta": 1,
    "explicacion": "Los bosones tienen funciones de onda simétricas ante el intercambio de partículas idénticas y pueden condensar en el mismo estado cuántico (fotones, gluones, bosón de Higgs). Los fermiones tienen funciones antisimétricas y no pueden coexistir en el mismo estado (electrones, quarks, neutrinos)."
  },
  {
    "id": 517,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Paradoja EPR y Entrelazamiento Cuántico",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En el fenómeno del Entrelazamiento Cuántico (paradójicamente cuestionado por Einstein, Podolsky y Rosen en 1935 como 'acción fantasmal a distancia'):",
    "opciones": [
      "A. Se transmite información a velocidad superlumínica violando la causalidad relativista",
      "B. Dos partículas entrelazadas comparten un estado cuántico indivisible conjunto; la medición del estado de una de ellas colapsa instantáneamente el estado de la otra sin importar la distancia física que las separe, sin permitir transmisión de datos útil superlumínica (teorema de no-comunicación)",
      "C. Las partículas se fusionan físicamente en un agujero negro microscópico",
      "D. Es una simple correlación clásica predeterminada idéntica a guardar dos zapatos en cajas separadas"
    ],
    "correcta": 1,
    "explicacion": "El entrelazamiento es una propiedad no local genuinamente cuántica. Aunque la correlación es instantánea, como el resultado individual de cada medición es intrínsecamente probabilístico, no puede enviarse ninguna señal de comunicación más rápido que la luz."
  },
  {
    "id": 518,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Teorema de Bell y Alain Aspect",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Los experimentos pioneros de Alain Aspect en 1982 (Premio Nobel 2022) midieron la correlación de polarización de pares de fotones entrelazados demostrando que:",
    "opciones": [
      "A. Las desigualdades de John Bell se cumplen rigurosamente, confirmando las variables ocultas locales de Einstein",
      "B. Las desigualdades de Bell se violan experimentalmente de manera rotunda, descartando definitivamente cualquier teoría de variables ocultas de carácter local y confirmando la mecánica cuántica",
      "C. La polarización de los fotones no existe",
      "D. La física cuántica es una aproximación de la mecánica de fluidos clásica"
    ],
    "correcta": 1,
    "explicacion": "Bell derivó en 1964 un límite matemático que toda teoría realista local debería satisfacer. Aspect demostró que la naturaleza cuántica viola sistemáticamente esas desigualdades, probando que el universo no puede describirse mediante variables ocultas locales predeterminadas."
  },
  {
    "id": 519,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Zeeman",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué es el Efecto Zeeman observado en espectroscopía atómica cuando los átomos emisores se sumergen en un campo magnético exterior estático?",
    "opciones": [
      "A. La ionización violenta de todos los átomos del gas",
      "B. El desdoblamiento de una única línea espectral en múltiples componentes discretas debido a la interacción magnética del momento dipolar orbital y de espín del electrón con el campo aplicado (ΔE = -μ · B)",
      "C. La desaparición de todas las líneas de emisión",
      "D. El cambio de la carga del núcleo"
    ],
    "correcta": 1,
    "explicacion": "Pieter Zeeman descubrió en 1896 que en presencia de un campo magnético exterior B, los estados atómicos degenerados con diferente número magnético m_l o m_s adquieren energías ligeramente distintas (acoplamiento Zeeman), dividiendo las líneas espectrales en varios picos."
  },
  {
    "id": 520,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Reglas de Hund",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Primera Regla de Friedrich Hund para el llenado de orbitales atómicos degenerados en energía (como los tres orbitales 2p) establece que:",
    "opciones": [
      "A. Los electrones deben emparejarse en el primer orbital disponible antes de ocupar los demás",
      "B. Los electrones se distribuyen ocupando el mayor número de orbitales individuales posibles con sus espines orientados paralelamente (máxima multiplicidad de espín) antes de empezar a emparejarse",
      "C. Todos los espines deben ser antiparalelos en el mismo orbital",
      "D. Los electrones no pueden tener espín"
    ],
    "correcta": 1,
    "explicacion": "Al ocupar orbitales separados con espines paralelos, la repulsión electrostática de Coulomb entre electrones se minimiza y la energía de canje cuántico estabiliza el estado fundamental del átomo."
  },
  {
    "id": 521,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Aharonov-Bohm",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué demostró el célebre Efecto Aharonov-Bohm (1959) sobre los potenciales electromagnéticos A y V en mecánica cuántica?",
    "opciones": [
      "A. Que los potenciales electromagnéticos son simples artificios matemáticos sin realidad física",
      "B. Que una partícula cuántica cargada (como un electrón) puede experimentar un desfase físico medible en su función de onda al pasar por una región donde los campos E y B son estrictamente nulos, siempre que el potencial vector magnético A no sea cero",
      "C. Que los imanes superconductores no tienen campo magnético",
      "D. Que los fotones tienen carga eléctrica"
    ],
    "correcta": 1,
    "explicacion": "En un experimento con un solenoide largo blindado, el campo B fuera es cero, pero el potencial vector A ∮ A·dl = Φ_B no es nulo. Los electrones que pasan por ambos lados experimentan una diferencia de fase cuántica observable: Δφ = (q/ħ) ∮ A·dr, probando la realidad física cuántica de A."
  },
  {
    "id": 522,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Gato de Schrödinger",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál fue el propósito original del célebre experimento mental del 'Gato de Schrödinger' propuesto por Erwin Schrödinger en 1935?",
    "opciones": [
      "A. Demostrar cómo se pueden clonar animales mediante física cuántica",
      "B. Ilustrar las paradojas conceptuales de la interpretación de Copenhague al extrapolar la superposición cuántica microscópica a objetos macroscópicos del mundo real (un gato simultáneamente vivo y muerto)",
      "C. Probar que los venenos radiactivos no son letales",
      "D. Diseñar un nuevo método de refrigeración criogénica"
    ],
    "correcta": 1,
    "explicacion": "Schrödinger ideó la paradoja para advertir sobre el problema de la medición cuántica: si un átomo radiactivo está en superposición de decaer y no decaer, el mecanismo enlaza la suerte macroscópica del gato a ese estado. Hoy la teoría de la 'decoherencia cuántica' explica cómo la interacción con el entorno destruye la superposición."
  },
  {
    "id": 523,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Principio de Correspondencia de Bohr",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Principio de Correspondencia formulado por Niels Bohr en 1920 exige que:",
    "opciones": [
      "A. Las leyes cuánticas y las de la relatividad general sean idénticas en todas las escalas",
      "B. En el límite en que los números cuánticos son muy grandes (n → ∞, escalas macroscópicas), las predicciones de la mecánica cuántica deben coincidir numéricamente y converger suavemente a las predicciones de la física clásica",
      "C. Toda partícula cuántica deba tener una correspondencia de antimateria",
      "D. La masa del átomo sea igual al número atómico"
    ],
    "correcta": 1,
    "explicacion": "El principio garantiza que la física clásica es el límite macroscópico natural de la física cuántica: a números cuánticos elevados, la diferencia relativa entre niveles de energía consecutivos se vuelve infinitesimal, reproduciendo un comportamiento continuo aparentemente clásico."
  },
  {
    "id": 524,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Estructura Fina y Acoplamiento Espín-Órbita",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La 'Estructura Fina' en los espectros atómicos surge fundamentalmente de correcciones relativistas de Dirac y de:",
    "opciones": [
      "A. La interacción entre las moléculas de aire del espectrómetro",
      "B. El acoplamiento espín-órbita: la interacción magnética entre el momento dipolar magnético intrínseco de espín del electrón y el campo magnético generado por su propio movimiento orbital alrededor del núcleo",
      "C. La repulsión gravitatoria del núcleo",
      "D. La presión de radiación solar"
    ],
    "correcta": 1,
    "explicacion": "En el sistema de referencia del electrón, el núcleo positivo orbita a su alrededor creando un campo magnético B_orb. El espín del electrón interactúa con este campo (hamiltoniano H_so ∝ L · S), desdoblando ligeramente los niveles espectrales con una separación regida por la constante de estructura fina α ≈ 1/137."
  },
  {
    "id": 525,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Constante de Estructura Fina",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La constante adimensional de estructura fina α = e² / (4π ε₀ ħ c) ≈ 1 / 137.036 cuantifica en física fundamental:",
    "opciones": [
      "A. La relación de masa entre el protón y el neutrón",
      "B. La intensidad intrínseca del acoplamiento de la interacción electromagnética entre partículas cargadas elementales y fotones",
      "C. La velocidad de rotación de las galaxias elípticas",
      "D. El tiempo de decaimiento del protón"
    ],
    "correcta": 1,
    "explicacion": "Es una de las constantes adimensionales más enigmáticas de la física. Fija la escala del acoplamiento electromagnético en Electrodinámica Cuántica (QED) y determina la velocidad orbital del electrón en el estado fundamental del hidrógeno relativa a la de la luz: v₁/c ≈ α ≈ 1/137."
  },
  {
    "id": 526,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Efecto Túnel en Fusión Solar",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué el efecto túnel cuántico es absolutamente indispensable para que ocurra la fusión nuclear en el núcleo del Sol?",
    "opciones": [
      "A. Porque la temperatura solar es demasiado alta para los protones",
      "B. Porque la temperatura en el centro del Sol (~15 millones de K) es insuficiente para que los protones venzan clásicamente la descomunal repulsión electrostática de Coulomb; solo pueden fusionarse atravesando la barrera mediante efecto túnel cuántico",
      "C. Porque los protones se vuelven negativos en el núcleo solar",
      "D. Para enfriar el núcleo e impedir que explote"
    ],
    "correcta": 1,
    "explicacion": "Clásicamente, se necesitarían más de 1,000 millones de Kelvin para superar la barrera culombiana de repulsión entre dos protones. Gracias al efecto túnel, existe una probabilidad pequeña pero constante de penetración cuántica a 15 millones de Kelvin, permitiendo que el Sol brille de forma estable durante 10,000 millones de años."
  },
  {
    "id": 527,
    "area": "Física Cuántica y Estructura Atómica",
    "subtema": "Fuerzas de Van der Waals Cuánticas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el origen físico microscópico de las fuerzas de dispersión de London (un tipo de fuerzas intermoleculares de Van der Waals) entre átomos de gases nobles neutros no polares?",
    "opciones": [
      "A. La atracción gravitatoria entre sus núcleos",
      "B. Fluctuaciones cuánticas espontáneas instantáneas en la nube electrónica que generan dipolos eléctricos instantáneos pasajeros, los cuales inducen dipolos sincronizados en átomos vecinos adyacentes",
      "C. Intercambio continuo de gluones",
      "D. Enlaces iónicos permanentes"
    ],
    "correcta": 1,
    "explicacion": "Aunque en promedio temporal un átomo neutro es esféricamente simétrico, en cualquier instante infinitesimal su densidad de carga fluctúa cuánticamente. Este dipolo instantáneo polariza al átomo contiguo creando una atracción mutua de corto alcance que decae como 1/r⁶."
  },
  {
    "id": 528,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Redes Cristalinas de Bravais",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuántas redes cristalinas tridimensionales periódicas distintas (Redes de Bravais) existen en la naturaleza, clasificadas dentro de 7 sistemas cristalinos?",
    "opciones": [
      "A. 7 redes",
      "B. 14 redes de Bravais",
      "C. 32 redes",
      "D. 230 redes espaciales"
    ],
    "correcta": 1,
    "explicacion": "Auguste Bravais demostró geométricamente en 1848 que en 3 dimensiones espaciales solo pueden existir exactamente 14 arreglos periódicos tridimensionales independientes y no equivalentes que llenan el espacio por traslación pura."
  },
  {
    "id": 529,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Ley de Bragg",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Bragg para la difracción constructiva de rayos X en los planos atómicos paralelos de un cristal separados una distancia interplanar 'd' se formula como:",
    "opciones": [
      "A. 2 d sen θ = n λ (con n = 1, 2, 3...)",
      "B. d cos θ = 2 n λ",
      "C. d sen θ = n λ²",
      "D. 2 d tan θ = λ / n"
    ],
    "correcta": 0,
    "explicacion": "William Henry Bragg y su hijo William Lawrence Bragg dedujeron que la diferencia de camino óptico entre rayos X reflejados por planos contiguos es 2d senθ. Al igualarse a un número entero n de longitudes de onda, se produce interferencia constructiva, base de la cristalografía."
  },
  {
    "id": 530,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Índices de Miller",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Los Índices de Miller (h k l) utilizados para designar planos cristalográficos en una red espacial se calculan matemáticamente a partir de:",
    "opciones": [
      "A. La suma directa de los radios atómicos",
      "B. Los recíprocos de las intersecciones fraccionarias del plano con los ejes cristalográficos principales, multiplicados para obtener los números enteros más pequeños posibles",
      "C. El número de electrones de valencia en la superficie",
      "D. El momento dipolar magnético del cristal"
    ],
    "correcta": 1,
    "explicacion": "Si un plano interseca los ejes en pa, qb, rc, los recíprocos 1/p, 1/q, 1/r se reducen a la terna de enteros coprimos más pequeños (hkl). Un índice cero indica que el plano es rigurosamente paralelo a ese eje cristalográfico."
  },
  {
    "id": 531,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Fonones y Vibraciones de Red",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué es un 'Fonón' en la física de la materia condensada?",
    "opciones": [
      "A. Una partícula elemental de carga fraccionaria",
      "B. Un cuasipartícula cuántica que cuantiza los modos normales de vibración colectiva elástica de la red cristalina con energía E = ħ ω",
      "C. Un fotón de luz confinado en un metal",
      "D. Un tipo de defecto puntual como una vacancia"
    ],
    "correcta": 1,
    "explicacion": "Así como el fotón cuantiza las oscilaciones del campo electromagnético, el fonón cuantiza las vibraciones mecánicas de los iones en la red cristalina. Son responsables de la conducción térmica en aislantes y de la capacidad calorífica de los sólidos."
  },
  {
    "id": 532,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Modelo de Debye",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "A temperaturas criogénicas muy bajas (T << θ_Debye), la capacidad calorífica a volumen constante Cv de un sólido aislante no magnético decae siguiendo:",
    "opciones": [
      "A. La ley de Dulong-Petit (Cv = 3 R constante)",
      "B. La Ley T³ de Debye: Cv ∝ T³",
      "C. Una caída lineal simple con T",
      "D. Un decaimiento exponencial e^(-T)"
    ],
    "correcta": 1,
    "explicacion": "Peter Debye trató a los sólidos como un medio elástico continuo con fonones acústicos. A bajas temperaturas solo los modos acústicos de baja energía están térmicamente excitados, originando una densidad de estados proporcional a ω² que integra una capacidad calorífica proporcional a T³."
  },
  {
    "id": 533,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Teoría de Bandas de Energía",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la diferencia electrónica fundamental que distingue a un semiconductor de un aislante eléctrico perfecto?",
    "opciones": [
      "A. Los aislantes tienen masa atómica nula",
      "B. Ambos poseen una banda de valencia llena y una de conducción vacía a 0 K, pero el semiconductor tiene una brecha de banda prohibida moderada (Eg ≈ 0.5 a 3.0 eV) que permite excitación térmica a temperatura ambiente, mientras que el aislante tiene una brecha muy ancha (Eg > 4-5 eV)",
      "C. Los semiconductores carecen de electrones de valencia",
      "D. Los aislantes son exclusivamente metales alcalinos"
    ],
    "correcta": 1,
    "explicacion": "En el silicio (Eg ≈ 1.1 eV), la energía térmica ambiental k_B T (≈ 0.026 eV a 300 K) basta para promover una fracción medible de electrones a la banda de conducción. En aislantes como el diamante (Eg ≈ 5.5 eV) o el hBN (Eg ≈ 5.9 eV), la probabilidad térmica es prácticamente nula."
  },
  {
    "id": 534,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Nivel de Fermi",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la estadística de Fermi-Dirac, ¿qué representa la Energía de Fermi E_F a una temperatura de cero absoluto (0 Kelvin)?",
    "opciones": [
      "A. La energía promedio de todos los fonones de la red",
      "B. La energía del nivel cuántico ocupado de mayor energía por los electrones en el estado fundamental del sistema",
      "C. La energía necesaria para ionizar un núcleo atómico",
      "D. La brecha de energía entre el silicio y el germanio"
    ],
    "correcta": 1,
    "explicacion": "A T = 0 K, los electrones llenan todos los estados cuánticos disponibles desde la mínima energía hasta E_F debido al Principio de Exclusión de Pauli. Todos los estados con E < E_F están 100% ocupados (probabilidad f=1) y los estados con E > E_F están vacíos (f=0)."
  },
  {
    "id": 535,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Dopaje de Semiconductores Tipo n",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando se dopa un cristal de silicio puro (grupo 14, cuatro electrones de valencia) con trazas de fósforo o arsénico (grupo 15, cinco electrones de valencia):",
    "opciones": [
      "A. Se destruye la red cristalina convirtiéndose en vidrio amorfo",
      "B. Se obtiene un semiconductor tipo n, donde cuatro electrones forman enlaces covalentes y el quinto electrón queda débilmente ligado, aportando electrones libres como portadores mayoritarios a la banda de conducción",
      "C. Se crea un semiconductor tipo p con huecos libres",
      "D. El material se vuelve superconductor a temperatura ambiente"
    ],
    "correcta": 1,
    "explicacion": "Los átomos del grupo 15 actúan como impurezas 'donadoras': introducen niveles energéticos discretos justo debajo del fondo de la banda de conducción. La energía térmica ambiente basta para ionizar el quinto electrón, generando una alta densidad de electrones libres de conducción."
  },
  {
    "id": 536,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Dopaje de Semiconductores Tipo p",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Para fabricar un semiconductor de silicio tipo p, se introducen impurezas aceptoras trivalentes (del grupo 13 de la Tabla Periódica) tales como:",
    "opciones": [
      "A. Fósforo o Antimonio",
      "B. Boro, Galio o Indio",
      "C. Cobre o Plata",
      "D. Neón o Argón"
    ],
    "correcta": 1,
    "explicacion": "El boro solo tiene 3 electrones de valencia. Al sustituir a un átomo de silicio en la red, deja un enlace covalente incompleto llamado 'hueco' (vacancia electrónica positiva). Los electrones vecinos pueden saltar a ese hueco, permitiendo que la carga positiva efectiva se mueva libremente."
  },
  {
    "id": 537,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Juntura p-n y Zona de Agotamiento",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En una juntura p-n en equilibrio térmico sin voltaje externo aplicado, los electrones del lado n se difunden hacia el lado p y se recombinan con huecos, formándose una región llamada:",
    "opciones": [
      "A. Cono de Dirac",
      "B. Zona de agotamiento o de carga espacial, donde los iones fijos inmunes crean un campo eléctrico interno que frena la difusión posterior",
      "C. Canal superconductor de Cooper",
      "D. Capa ferromagnética de Bloch"
    ],
    "correcta": 1,
    "explicacion": "Los iones donadores positivos fijos en el lado n y los iones aceptores negativos fijos en el lado p quedan al descubierto al recombinarse los portadores libres. Este dipolo macroscópico genera un fuerte campo eléctrico interno y una barrera de potencial de contacto (V_bi ≈ 0.7 V en Si)."
  },
  {
    "id": 538,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Diodos Emisores de Luz (LED)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el mecanismo cuántico por el cual un diodo emisor de luz (LED) genera fotones cuando se polariza en sentido directo?",
    "opciones": [
      "A. La incandescencia térmica de filamentos microscópicos de tungsteno",
      "B. La recombinación radiativa directa de electrones de la banda de conducción con huecos de la banda de valencia, emitiendo un fotón de energía aproximadamente igual a la brecha de banda (hν ≈ Eg)",
      "C. La fisión de núcleos pesados en la juntura",
      "D. El efecto fotoeléctrico inverso sobre la batería"
    ],
    "correcta": 1,
    "explicacion": "Al aplicar voltaje directo, los electrones y huecos son inyectados hacia la juntura p-n. Al encontrarse, el electrón decae a un estado de menor energía en la banda de valencia, liberando el exceso de energía Eg en forma de un fotón cuya longitud de onda λ = hc/Eg determina el color del LED."
  },
  {
    "id": 539,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Superconductividad y Resistencia Cero",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El fenómeno de la superconductividad fue descubierto en 1911 por Heike Kamerlingh Onnes en Leiden al observar que la resistencia eléctrica del mercurio líquido enfriado con helio:",
    "opciones": [
      "A. Se reducía a la mitad de su valor a 10 K",
      "B. Caía abruptamente a cero absoluto medible por debajo de una temperatura crítica Tc ≈ 4.2 Kelvin",
      "C. Aumentaba exponencialmente hasta aislar completamente el circuito",
      "D. Generaba chispas eléctricas continuas"
    ],
    "correcta": 1,
    "explicacion": "A 4.2 K, el mercurio sufrió una transición de fase electrónica de segundo orden donde su resistividad eléctrica cayó a cero estricto (< 10⁻²⁶ Ω·m). Una corriente inducida en un anillo superconductor cerrado puede persistir durante años sin disiparse."
  },
  {
    "id": 540,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Efecto Meissner-Ochsenfeld",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué demostraron Walther Meissner y Robert Ochsenfeld en 1933 que diferencia a un verdadero superconductor de un hipotético 'conductor perfecto con resistencia cero'?",
    "opciones": [
      "A. Los superconductores no conducen calor",
      "B. La expulsión activa y espontánea del campo magnético del interior del material (B = 0, diamagnetismo perfecto) cuando se enfría por debajo de Tc en presencia de un campo magnético exterior",
      "C. La rotación espontánea del material a velocidad angular constante",
      "D. La absorción de todos los neutrones térmicos"
    ],
    "correcta": 1,
    "explicacion": "Un conductor ideal solo mantendría constante el flujo que ya tenía al enfriarse (por Lenz). Un superconductor expulsa activamente todo campo magnético previo al pasar por Tc (diamagnetismo perfecto con susceptibilidad magnética χ = -1), permitiendo la levitación magnética estable."
  },
  {
    "id": 541,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Teoría BCS de la Superconductividad",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La teoría microscópica de Bardeen, Cooper y Schrieffer (BCS, 1957) explica la superconductividad convencional en metales a través de:",
    "opciones": [
      "A. La repulsión electrostática pura entre núcleos pesados",
      "B. La formación de 'Pares de Cooper': pares de electrones ligados con momentos y espines opuestos gracias a una interacción atractiva efectiva mediada por el intercambio virtual de fonones de la red cristalina",
      "C. El colapso relativista de la nube electrónica al núcleo",
      "D. La creación de monopolos magnéticos"
    ],
    "correcta": 1,
    "explicacion": "Un electrón deforma localmente la red iónica positiva atrayendo carga hacia sí. Antes de que los iones se relajen, un segundo electrón es atraído por ese exceso de carga positiva. Este apareamiento de Cooper forma bosones compuestos que condensan en un macroestado cuántico común con resistencia cero."
  },
  {
    "id": 542,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Superconductores Tipo I y Tipo II",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué caracteriza a los superconductores de Tipo II en presencia de un campo magnético moderado entre su campo crítico inferior Hc1 y superior Hc2?",
    "opciones": [
      "A. Pierden la superconductividad completamente al alcanzar Hc1",
      "B. Entran en un 'estado mixto' (fase de vórtices de Abrikosov) donde el campo magnético penetra en filamentos discretos cuantizados rodeados por supercorrientes, reteniendo resistencia cero",
      "C. Se vuelven materiales ferromagnéticos permanentes",
      "D. La temperatura crítica se multiplica por diez"
    ],
    "correcta": 1,
    "explicacion": "Alexei Abrikosov demostró que los superconductores de Tipo II toleran campos colosales (de decenas de Teslas) al permitir que el flujo penetre en vórtices cuantizados con flujo magnético elemental Φ₀ = h/(2e). Esto permite construir los imanes superconductores del LHC y de resonancias médicas."
  },
  {
    "id": 543,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Grafeno y Estructura Cristalina",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué es el Grafeno, aislado experimentalmente por primera vez en 2004 por Andre Geim y Konstantin Novoselov en la Universidad de Manchester (Premio Nobel 2010)?",
    "opciones": [
      "A. Un polímero plástico derivado del petróleo",
      "B. Una monocapa bidimensional de átomos de carbono con hibridación sp² organizados en una red hexagonal periódica en forma de panal de abejas con un solo átomo de espesor",
      "C. Un compuesto de silicio y germanio",
      "D. Un isótopo artificial de diamante"
    ],
    "correcta": 1,
    "explicacion": "El grafeno es el primer material bidimensional auténtico aislado. Posee una resistencia mecánica 200 veces superior a la del acero, una conductividad térmica descomunal (~5000 W/(m·K)) y una transparencia óptica del 97.7% a la luz visible."
  },
  {
    "id": 544,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Conos de Dirac en Grafeno",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué los portadores de carga en el grafeno se comportan como 'fermiones de Dirac relativistas sin masa' con relación de dispersión lineal E(k) = ± ħ v_F k?",
    "opciones": [
      "A. Porque los electrones viajan literalmente a la velocidad de la luz c en el vacío",
      "B. Porque las bandas de valencia y conducción se tocan en seis puntos discretos (puntos K y K' de la zona de Brillouin formando los Conos de Dirac), donde la ecuación cuántica efectiva de baja energía es formalmente idéntica a la ecuación de Dirac para partículas sin masa con v_F ≈ c / 300",
      "C. Porque el carbono no posee electrones pz",
      "D. Por la ausencia de enlaces sigma"
    ],
    "correcta": 1,
    "explicacion": "Cerca de los puntos K, la dispersión parabólica ordinaria E ∝ k² se vuelve rigurosamente lineal E = ħv_F k, lo que implica una masa efectiva de reposo nula y una velocidad de Fermi constante v_F ≈ 10⁶ m/s. Esto produce fenómenos como el efecto túnel de Klein y movilidad ultra-alta."
  },
  {
    "id": 545,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Nitruro de Boro Hexagonal (hBN)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Nitruro de Boro Hexagonal (hBN), apodado habitualmente 'grafeno blanco', comparte la misma red hexagonal plana del grafeno pero con átomos alternados de boro y nitrógeno. ¿Cuál es su propiedad electrónica fundamental?",
    "opciones": [
      "A. Es un metal superconductor a temperatura ambiente",
      "B. Es un aislante de banda ancha (wide bandgap) con Eg ≈ 5.9 a 6.0 eV, químicamente inerte, térmicamente estable y atómicamente ultra-liso",
      "C. Es un semiconductor de brecha nula idéntico al grafeno",
      "D. Es un gas a temperatura ambiente"
    ],
    "correcta": 1,
    "explicacion": "Al tener átomos distintos en las dos subredes (Boro electropositivo y Nitrógeno electronegativo), se rompe la simetría de inversión, abriendo una enorme brecha de energía prohibida de casi 6 eV en los puntos K. Esto convierte al hBN en un aislante 2D excepcional."
  },
  {
    "id": 546,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Encapsulamiento con hBN",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué el nitruro de boro hexagonal (hBN) es el sustrato dieléctrico por excelencia para encapsular grafeno y dicalcogenuros de metales de transición (TMDs) en nanoelectrónica cuántica avanzada?",
    "opciones": [
      "A. Porque disuelve las impurezas con ácido clorhídrico",
      "B. Porque al estar libre de enlaces colgantes (dangling bonds), no poseer trampas de carga superficiales y ser atómicamente plano con parámetros de red casi coincidentes con el grafeno (~1.7% de desajuste), preserva movilidades electrónicas extraordinarias cercanas al límite intrínseco",
      "C. Porque convierte a cualquier material en ferromagnético",
      "D. Porque bloquea completamente la gravedad"
    ],
    "correcta": 1,
    "explicacion": "En sustratos ordinarios como SiO₂, la rugosidad y las cargas atrapadas dispersan a los electrones reduciendo drásticamente su movilidad. Al encapsular grafeno entre dos capas ultra-limpias de hBN, los electrones pueden viajar micrómetros balísticamente sin colisionar."
  },
  {
    "id": 547,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Heteroestructuras de Van der Waals",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se construyen las denominadas 'Heteroestructuras de Van der Waals' en la física moderna de materiales bidimensionales?",
    "opciones": [
      "A. Soldando metales fundidos a más de 3000 °C",
      "B. Apilando capa por capa diferentes cristales atómicamente delgados (como grafeno, hBN, MoS₂ y WSe₂) unidos verticalmente por fuerzas interfaciales de Van der Waals, sin necesidad de acoplamiento epitaxial de redes",
      "C. Bombardeando diamantes con rayos gamma",
      "D. Evaporando silicio en atmósfera de helio"
    ],
    "correcta": 1,
    "explicacion": "A diferencia de las heteroestructuras semiconductoras tradicionales donde el desajuste de red atómica genera dislocaciones destructivas, en las heteroestructuras 2D las capas interactúan solo por fuerzas de Van der Waals débiles, permitiendo combinar materiales con propiedades totalmente disímiles como bloques de Lego atómicos."
  },
  {
    "id": 548,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Grafeno de Ángulo Mágico",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En 2018, el grupo de Pablo Jarillo-Herrero en el MIT descubrió que al apilar dos monocapas de grafeno rotadas entre sí a un 'ángulo mágico' de aproximadamente θ ≈ 1.1°:",
    "opciones": [
      "A. Las dos capas se desintegran en vapor de metano",
      "B. Se genera un superpatrón de Moiré que aplana las bandas electrónicas (flat bands), dando lugar a fases fuertemente correlacionadas como aislantes de Mott y superconductividad no convencional",
      "C. El material se vuelve transparente a los rayos X",
      "D. El grafeno se transforma en diamante sintético puro"
    ],
    "correcta": 1,
    "explicacion": "A θ ≈ 1.1°, la interacción interfacial entre capas frena la velocidad de Fermi a cero creando bandas planas ultra-estrechas. En estas bandas la energía de repulsión culombiana entre electrones domina sobre la energía cinética, naciendo el campo de la 'twistrónica' y superconductividad no convencional."
  },
  {
    "id": 549,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Efecto Hall Cuántico Entero",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Klaus von Klitzing descubrió en 1980 (Premio Nobel 1985) que en un gas bidimensional de electrones a temperaturas criogénicas y campos magnéticos intensos, la conductancia Hall transversal G_xy se cuantiza en escalones rigurosos iguales a:",
    "opciones": [
      "A. G_xy = ν · (e² / h) (donde ν = 1, 2, 3... es un número entero)",
      "B. G_xy = e · c / ħ",
      "C. G_xy = 1/2 k_B T",
      "D. G_xy = h / e²"
    ],
    "correcta": 0,
    "explicacion": "La constante de von Klitzing R_K = h/e² ≈ 25,812.807 Ω es un invariante topológico universal independiente del material o de sus imperfecciones. Esta precisión cuántica es tan perfecta que desde 2019 se utiliza como el patrón internacional primario de resistencia eléctrica en metrología."
  },
  {
    "id": 550,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Aislantes Topológicos",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué propiedad singular define a los 'Aislantes Topológicos' en la física del estado sólido?",
    "opciones": [
      "A. Conducen corriente eléctrica exclusivamente cuando se calientan al rojo vivo",
      "B. Poseen un volumen interior aislante con brecha energética, pero alojan en su superficie estados electrónicos conductores protegidos por simetría de inversión temporal donde el espín del electrón está rígidamente bloqueado con su momento lineal",
      "C. Tienen carga magnética en sus bordes",
      "D. Son superconductores solo en el vacío"
    ],
    "correcta": 1,
    "explicacion": "En un aislante topológico, el fuerte acoplamiento espín-órbita invierte el orden de las bandas en el interior. Para conectar con el vacío exterior, la brecha debe cerrarse forzosamente en la superficie, originando estados superficiales metálicos inmunes a la retrodispersión por impurezas no magnéticas."
  },
  {
    "id": 551,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Masa Efectiva",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la teoría cuántica de bandas, la masa efectiva m* de un electrón en un cristal refleja cómo la red atómica periódica modifica su aceleración ante una fuerza externa, calculándose como:",
    "opciones": [
      "A. m* = ħ² / (d²E / dk²)",
      "B. m* = dE / dk",
      "C. m* = m_e · k²",
      "D. m* = ħ · k / v"
    ],
    "correcta": 0,
    "explicacion": "La masa efectiva es inversamente proporcional a la curvatura de la banda de energía E(k): m* = ħ² / (d²E/dk²). Cerca del tope de una banda donde la curvatura es cóncava hacia abajo (d²E/dk² < 0), la masa efectiva resulta negativa, comportamiento que se describe físicamente como un hueco con carga positiva."
  },
  {
    "id": 552,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Semiconductores de Brecha Directa e Indirecta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué el Arseniuro de Galio (GaAs) es un material idóneo para fabricar diodos láser y LEDs eficientes mientras que el Silicio puro no lo es?",
    "opciones": [
      "A. Porque el silicio es un líquido a temperatura ambiente",
      "B. Porque el GaAs es un semiconductor de brecha directa (el mínimo de conducción y el máximo de valencia ocurren al mismo momento k), mientras que el silicio es de brecha indirecta y requiere la asistencia de un fonón para conservar momento, haciendo la emisión óptica muy ineficiente",
      "C. Porque el GaAs no tiene átomos",
      "D. Porque el silicio absorbe todos los fotones que genera"
    ],
    "correcta": 1,
    "explicacion": "En un semiconductor de brecha directa (como GaAs o InP), los electrones decaen directamente emitiendo un fotón sin necesidad de cambiar su momento k. En el silicio (brecha indirecta), la transición radiativa requiere absorber o emitir un fonón de la red, un proceso de segundo orden de bajísima probabilidad."
  },
  {
    "id": 553,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Transistores MOSFET",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el principio operativo central de un transistor MOSFET de silicio, componente básico de todos los microprocesadores modernos?",
    "opciones": [
      "A. Controlar la conductividad de un canal semiconductor mediante el campo eléctrico electrostático aplicado a través de un electrodo de compuerta (gate) aislado por un dieléctrico",
      "B. Calentar filamentos con corriente continua para emitir electrones al vacío",
      "C. Utilizar radioactividad natural para conmutar corriente",
      "D. Cambiar la orientación del polo magnético terrestre"
    ],
    "correcta": 0,
    "explicacion": "El transistor de efecto de campo metal-óxido-semiconductor (MOSFET) actúa como un interruptor controlado por voltaje: al aplicar tensión en la compuerta, el campo eléctrico induce una capa de inversión de portadores que abre el canal de conducción entre drenador y fuente sin consumir corriente de compuerta."
  },
  {
    "id": 554,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Cuantización del Flujo Magnético",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El flujo magnético Φ que atraviesa el orificio de un anillo superconductor cerrado no puede adoptar valores arbitrarios continuos, sino que está estrictamente cuantizado en múltiplos enteros de:",
    "opciones": [
      "A. Φ₀ = h / e",
      "B. Φ₀ = h / (2 e) ≈ 2.0678 × 10⁻¹⁵ Weber (cuanto de flujo magnético)",
      "C. Φ₀ = 2 h / e²",
      "D. Φ₀ = ħ · c"
    ],
    "correcta": 1,
    "explicacion": "Como los portadores de la supercorriente son pares de Cooper con carga 2e, la condición de univaluación de la función de onda macroscópica a lo largo de un circuito cerrado exige que el flujo encerrado sea múltiplo de Φ₀ = h/(2e). Este fenómeno es la base de los magnetómetros ultrasensibles SQUID."
  },
  {
    "id": 555,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Defectos Cristalinos Puntuales",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En la ciencia de materiales cristalinos, ¿qué diferencia a un defecto de Schottky de un defecto de Frenkel?",
    "opciones": [
      "A. El defecto de Schottky ocurre solo en metales líquidos",
      "B. El defecto de Schottky consiste en un par estequiométrico de vacancias (un catión y un anión ausentes de la red), mientras que el defecto de Frenkel ocurre cuando un ion abandona su posición normal y ocupa un sitio intersticial cercano dejando una vacancia",
      "C. Ambos son dislocaciones lineales de borde",
      "D. El defecto de Frenkel genera radioactividad"
    ],
    "correcta": 1,
    "explicacion": "Ambos son defectos puntuales intrínsecos que mantienen la neutralidad eléctrica del cristal. En Schottky, los iones faltantes migraron a la superficie (reduciendo la densidad global del cristal); en Frenkel, el ion se aloja en un intersticio sin cambiar la densidad volumétrica neta."
  },
  {
    "id": 556,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Ferroelectricidad",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué propiedad singular exhibe un material ferroeléctrico como el titanato de bario (BaTiO₃)?",
    "opciones": [
      "A. Conduce electricidad a través de vórtices magnéticos",
      "B. Presenta una polarización eléctrica espontánea reversible en ausencia de campo eléctrico externo, la cual puede reorientarse mediante la aplicación de un campo eléctrico exterior (ciclo de histéresis dieléctrica)",
      "C. Repele a todos los imanes de neodimio",
      "D. Se licúa espontáneamente a temperatura ambiente"
    ],
    "correcta": 1,
    "explicacion": "Análogo al ferromagnetismo pero con dipolos eléctricos, los ferroeléctricos presentan dominios con polarización eléctrica neta debida al desplazamiento asimétrico de los iones en la celda unitaria por debajo de la temperatura de Curie ferroeléctrica."
  },
  {
    "id": 557,
    "area": "Ciencia de Materiales y Estado Sólido",
    "subtema": "Brecha de Banda de hBN y Grafeno",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el valor aproximado del bandgap (brecha prohibida) en el grafeno monocapa pristino y en el nitruro de boro hexagonal (hBN) respectivamente?",
    "opciones": [
      "A. Grafeno: Eg = 1.1 eV; hBN: Eg = 0 eV",
      "B. Grafeno: Eg = 0 eV (semimetal de brecha nula); hBN: Eg ≈ 5.9 - 6.0 eV (aislante de banda ancha)",
      "C. Ambos tienen exactamente Eg = 3.4 eV",
      "D. Grafeno: Eg = 10 eV; hBN: Eg = 1 eV"
    ],
    "correcta": 1,
    "explicacion": "El grafeno es un semimetal con brecha cero donde los conos de valencia y conducción se tocan en el nivel de Fermi. Por el contrario, el hBN tiene una de las mayores brechas entre los materiales 2D (~6 eV), haciéndolo ópticamente transparente en todo el visible y aislante dieléctrico ideal."
  },
  {
    "id": 558,
    "area": "Física Nuclear y Partículas",
    "subtema": "Defecto de Masa y Energía de Enlace",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La masa medida de cualquier núcleo atómico estable es siempre estrictamente menor que la suma de las masas individuales de sus protones y neutrones constituyentes aislados. ¿Cómo se denomina y qué representa esta diferencia de masa Δm?",
    "opciones": [
      "A. Masa fantasma por fricción térmica",
      "B. Defecto de Masa (Δm), y multiplicado por c² equivale a la Energía de Enlace nuclear (B = Δm c²) que mantiene cohesionado al núcleo",
      "C. Masa de los neutrinos atrapados",
      "D. Error experimental en los espectrómetros de masas"
    ],
    "correcta": 1,
    "explicacion": "Al formarse el núcleo a partir de nucleones libres, la interacción nuclear fuerte libera energía potencial en forma de radiación gamma. Por E=mc², esa energía liberada se traduce en una pérdida de masa medible: M_núcleo = Z m_p + N m_n - B/c²."
  },
  {
    "id": 559,
    "area": "Física Nuclear y Partículas",
    "subtema": "Curva de Energía de Enlace por Nucleón",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la curva de energía de enlace nuclear por nucleón (B/A), ¿alrededor de qué elemento químico se alcanza la máxima estabilidad nuclear del universo (~8.8 MeV por nucleón)?",
    "opciones": [
      "A. En el Hidrógeno-1",
      "B. En el Hierro-56 y Níquel-62",
      "C. En el Uranio-238",
      "D. En el Plomo-208"
    ],
    "correcta": 1,
    "explicacion": "El máximo de estabilidad en torno a Fe-56 y Ni-62 explica por qué fusionar núcleos ligeros (hacia la derecha en la curva) libera energía (fusión estelar), y fisionar núcleos muy pesados como U-235 (hacia la izquierda en la curva) también libera energía."
  },
  {
    "id": 560,
    "area": "Física Nuclear y Partículas",
    "subtema": "Fuerza Nuclear Fuerte",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los protones cargados positivamente dentro de un diminuto núcleo atómico permanecen estrechamente unidos en lugar de salir despedidos por la violenta repulsión electrostática de Coulomb?",
    "opciones": [
      "A. Por la atracción gravitatoria de los neutrones",
      "B. Porque a distancias subatómicas menores a ~1 a 2 femtómetros (10⁻¹⁵ m), la Interacción Nuclear Fuerte es atractiva y unas 100 veces más intensa que la repulsión de Coulomb",
      "C. Porque los protones pierden su carga eléctrica dentro del núcleo",
      "D. Por el efecto magnético de los electrones orbitales"
    ],
    "correcta": 1,
    "explicacion": "La fuerza nuclear residual (mediada por intercambio de mesones pi entre nucleones) es la fuerza más poderosa de la naturaleza a distancias nucleares (~1 fm), superando con holgura la repulsión culombiana. A distancias mayores de 2-3 fm decae a cero exponencialmente."
  },
  {
    "id": 561,
    "area": "Física Nuclear y Partículas",
    "subtema": "Desintegración Alfa",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Una partícula Alfa (α) emitida en desintegraciones nucleares radiactivas está compuesta físicamente por:",
    "opciones": [
      "A. Un electrón relativista de alta energía",
      "B. Un núcleo completamente ionizado de Helio-4 (dos protones y dos neutrones: ⁴He²⁺)",
      "C. Un fotón electromagnético de alta frecuencia",
      "D. Un neutrón libre en reposo"
    ],
    "correcta": 1,
    "explicacion": "Las partículas alfa son núcleos desnudos de helio (⁴He²⁺) extraordinariamente estables. Tienen una masa elevada y doble carga positiva (+2e), lo que les otorga una alta capacidad de ionización pero muy bajo poder de penetración (una hoja de papel o la piel las detiene)."
  },
  {
    "id": 562,
    "area": "Física Nuclear y Partículas",
    "subtema": "Desintegración Beta Menos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la desintegración radiactiva Beta menos (β⁻), un neutrón en el interior de un núcleo inestable se transforma en:",
    "opciones": [
      "A. Dos partículas alfa y un positrón",
      "B. Un protón, un electrón de alta energía (partícula β⁻) y un antineutrino electrónico: n → p + e⁻ + ν̄_e",
      "C. Un fotón gamma únicamente",
      "D. Un mesón pi neutro"
    ],
    "correcta": 1,
    "explicacion": "A nivel fundamental de quarks, un quark 'down' se convierte en un quark 'up' mediante la fuerza débil mediada por un bosón W⁻ virtual (d → u + W⁻ → u + e⁻ + ν̄_e). El número atómico del núcleo aumenta en 1 (Z → Z + 1) conservando el número másico A."
  },
  {
    "id": 563,
    "area": "Física Nuclear y Partículas",
    "subtema": "Desintegración Beta Más y PET",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la tomografía médica PET (Tomografía por Emisión de Positrones), se inyecta un radioisótopo emisor de radiación Beta más (β⁺). Al emitirse un positrón en el tejido biológico:",
    "opciones": [
      "A. Se destruye todo el tejido circundante",
      "B. El positrón colisiona casi de inmediato con un electrón del tejido y ambos se aniquilan mutuamente, emitiendo dos fotones gamma colineales de 511 keV en direcciones exactamente opuestas (180°)",
      "C. El positrón se transforma en un protón",
      "D. Se genera una corriente superconductora"
    ],
    "correcta": 1,
    "explicacion": "La aniquilación e⁺ + e⁻ → 2γ convierte la masa en reposo de ambas partículas (2 × 511 keV) en dos fotones gamma emitidos a 180°. Detectores en anillo cronometran la llegada simultánea de ambos fotones (coincidencia temporal), reconstruyendo la imagen metabólica tridimensional."
  },
  {
    "id": 564,
    "area": "Física Nuclear y Partículas",
    "subtema": "Ley de Decaimiento Radiactivo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si una muestra radiactiva contiene inicialmente N₀ núcleos radiactivos y su periodo de semidesintegración (vida media) es T_1/2 = 10 horas, ¿qué fracción de los núcleos originales permanece sin desintegrarse al cabo de 30 horas?",
    "opciones": [
      "A. La mitad (1/2)",
      "B. La cuarta parte (1/4)",
      "C. La octava parte (1/8 = 12.5%)",
      "D. Cero (se desintegraron todos)"
    ],
    "correcta": 2,
    "explicacion": "Han transcurrido n = 30 h / 10 h = 3 vidas medias. La cantidad remanente es N(t) = N₀ (1/2)ⁿ = N₀ (1/2)³ = N₀ / 8 = 12.5% de la muestra inicial."
  },
  {
    "id": 565,
    "area": "Física Nuclear y Partículas",
    "subtema": "Fisión Nuclear Inducida",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En una central nuclear de fisión, cuando un núcleo de Uranio-235 absorbe un neutrón térmico lento, se vuelve inestable y se divide en dos fragmentos medianos más ligeros, liberando además:",
    "opciones": [
      "A. Únicamente calor sin partículas",
      "B. Entre 2 y 3 neutrones rápidos libres y aproximadamente 200 MeV de energía nuclear",
      "C. Un núcleo de hidrógeno y un positrón",
      "D. Cero neutrones"
    ],
    "correcta": 1,
    "explicacion": "La liberación de 2 a 3 neutrones adicionales es la clave que hace posible la reacción nuclear en cadena: esos neutrones pueden inducir la fisión de otros núcleos vecinos si son ralentizados adecuadamente por un moderador."
  },
  {
    "id": 566,
    "area": "Física Nuclear y Partículas",
    "subtema": "Moderadores en Reactores Nucleares",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los reactores nucleares térmicos utilizan un 'moderador' (como agua ordinaria H₂O, agua pesada D₂O o grafito puro)?",
    "opciones": [
      "A. Para absorber todos los neutrones y apagar el reactor",
      "B. Para ralentizar la tremenda velocidad de los neutrones rápidos recién nacidos mediante colisiones elásticas hasta energías térmicas (~0.025 eV), donde la sección eficaz de fisión del U-235 es cientos de veces mayor",
      "C. Para enfriar la carcasa de hormigón exterior",
      "D. Para generar campos magnéticos de confinamiento"
    ],
    "correcta": 1,
    "explicacion": "Los neutrones nacen con energías cinéticas del orden de 2 MeV. Para esas energías la probabilidad de causar fisión en U-235 es baja. Al chocar elásticamente con núcleos livianos del moderador (de masa similar al neutrón como el hidrógeno o deuterio), ceden energía hasta alcanzar el equilibrio térmico."
  },
  {
    "id": 567,
    "area": "Física Nuclear y Partículas",
    "subtema": "Fusión Nuclear Solar",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La principal fuente de energía radiante generada en el corazón del Sol durante su fase de secuencia principal es la cadena de fusión protón-protón, cuyo balance neto global consiste en transformar:",
    "opciones": [
      "A. Cuatro núcleos de Uranio en Plomo",
      "B. Cuatro protones (hidrógeno-1) en un núcleo de Helio-4, dos positrones, dos neutrinos electrónicos y unos 26.7 MeV de energía neta",
      "C. Helio en Carbono únicamente",
      "D. Oxígeno en Hierro"
    ],
    "correcta": 1,
    "explicacion": "La reacción neta es 4 ¹H → ⁴He + 2 e⁺ + 2 ν_e + 26.7 MeV. El Sol convierte aproximadamente 600 millones de toneladas de hidrógeno en helio cada segundo, perdiendo unas 4 millones de toneladas de masa por segundo que se transforman íntegramente en luz y calor."
  },
  {
    "id": 568,
    "area": "Física Nuclear y Partículas",
    "subtema": "Quarks y Carga Eléctrica Fraccionaria",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En el Modelo Estándar de la física de partículas, los quarks son los constituyentes fundamentales de los hadrones y poseen cargas eléctricas fraccionarias. ¿Cuáles son las cargas de los quarks 'up' (u) y 'down' (d)?",
    "opciones": [
      "A. u = +1 e; d = -1 e",
      "B. u = +2/3 e; d = -1/3 e",
      "C. u = +1/2 e; d = -1/2 e",
      "D. u = +1/3 e; d = -2/3 e"
    ],
    "correcta": 1,
    "explicacion": "Los quarks tipo up (u, c, t) tienen carga eléctrica fraccionaria +2/3 e, mientras que los tipo down (d, s, b) tienen -1/3 e. Un protón (uud) tiene carga 2/3 + 2/3 - 1/3 = +1 e, y un neutrón (udd) tiene 2/3 - 1/3 - 1/3 = 0."
  },
  {
    "id": 569,
    "area": "Física Nuclear y Partículas",
    "subtema": "Confinamiento del Color y Gluones",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué nunca se ha observado un quark aislado libre en ningún experimento de física de altas energías (Principio de Confinamiento del Color)?",
    "opciones": [
      "A. Porque los quarks se desintegran antes de formarse",
      "B. Porque en la Cromodinámica Cuántica (QCD) la fuerza fuerte entre quarks mediada por gluones con carga de color no decae con la distancia; al intentar separarlos, la energía del tubo de flujo crece linealmente hasta que resulta energéticamente más favorable crear un nuevo par quark-antiquark del vacío",
      "C. Porque los quarks son transparentes a los campos electromagnéticos",
      "D. Porque los quarks tienen masa infinita"
    ],
    "correcta": 1,
    "explicacion": "A diferencia del electromagnetismo donde F ∝ 1/r², la fuerza fuerte entre cargas de color (rojo, verde, azul) actúa como un elástico inextensible (V ∝ r). Al estirarlo, la energía almacenada supera 2mc², materializando nuevos mesones (hadronización)."
  },
  {
    "id": 570,
    "area": "Física Nuclear y Partículas",
    "subtema": "Bariones y Mesones",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la diferencia estructural básica entre un Barión y un Mesón dentro de la familia de los hadrones?",
    "opciones": [
      "A. Los bariones son leptones y los mesones son fotones",
      "B. Los bariones están formados por tres quarks de valencia (como el protón uud o el neutrón udd), mientras que los mesones están formados por un par quark-antiquark (como los piones o kaones)",
      "C. Los mesones tienen carga cero y los bariones carga infinita",
      "D. Los bariones solo existen en el vacío cósmico"
    ],
    "correcta": 1,
    "explicacion": "Los bariones son fermiones de espín semientero (3 quarks: qqq), con número bariónico B=1. Los mesones son bosones de espín entero compuestos por un quark y un antiquark (q q̄), con número bariónico B=0."
  },
  {
    "id": 571,
    "area": "Física Nuclear y Partículas",
    "subtema": "Leptones en el Modelo Estándar",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La familia de los Leptones (partículas fundamentales que no experimentan la interacción nuclear fuerte) está constituida por seis miembros agrupados en tres generaciones:",
    "opciones": [
      "A. Protón, Neutrón, Electrón, Positrón, Muón y Pión",
      "B. Electrón, Muón, Tauón y sus tres respectivos neutrinos: neutrino electrónico (ν_e), neutrino muónico (ν_μ) y neutrino tauónico (ν_τ)",
      "C. Quarks up, down, charm, strange, top y bottom",
      "D. Fotón, Gluón, Gravitón, Bosón W, Bosón Z y Bosón de Higgs"
    ],
    "correcta": 1,
    "explicacion": "Los leptones son fermiones fundamentales (espín 1/2) sin carga de color. Cada generación consta de un leptón cargado negativamente (e⁻, μ⁻, τ⁻) y su correspondiente neutrino neutro casi sin masa (ν_e, ν_μ, ν_τ)."
  },
  {
    "id": 572,
    "area": "Física Nuclear y Partículas",
    "subtema": "Bosones Mediadores de Gauge",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuáles son las partículas mediadoras (bosones de gauge con espín 1) que transmiten la fuerza Electromagnética, la fuerza Fuerte y la fuerza Débil respectivamente en el Modelo Estándar?",
    "opciones": [
      "A. Fotón, Gluones (8 tipos), y los Bosones vectoriales W⁺, W⁻ y Z⁰",
      "B. Electrón, Gravitón y Mesón",
      "C. Neutrino, Protón y Neutrón",
      "D. Fotón, Higgs y Gravitón"
    ],
    "correcta": 0,
    "explicacion": "El fotón sin masa media el electromagnetismo U(1); 8 gluones con carga de color median la interacción fuerte SU(3); y los bosones masivos W⁺, W⁻ (80.4 GeV) y Z⁰ (91.2 GeV) median la interacción débil SU(2)."
  },
  {
    "id": 573,
    "area": "Física Nuclear y Partículas",
    "subtema": "Bosón de Higgs",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El descubrimiento del Bosón de Higgs en julio de 2012 en el Gran Colisionador de Hadrones (LHC) del CERN confirmó experimentalmente la existencia de:",
    "opciones": [
      "A. La energía oscura en el vacío",
      "B. El Campo de Higgs: un campo escalar cósmico que permea todo el universo cuyo valor esperado en el vacío no nulo rompe espontáneamente la simetría electrodébil y dota de masa inercial a las partículas fundamentales mediante acoplamiento de Yukawa",
      "C. La gravedad cuántica de cuerdas",
      "D. Un quinto estado de agregación de la materia sólida"
    ],
    "correcta": 1,
    "explicacion": "El bosón de Higgs es la excitación cuántica del campo de Higgs (con masa de ~125 GeV y espín 0). Sin este mecanismo de ruptura espontánea de simetría (Brout-Englert-Higgs), los bosones W y Z no tendrían masa y los electrones viajarían a la velocidad de la luz c sin formar átomos."
  },
  {
    "id": 574,
    "area": "Física Nuclear y Partículas",
    "subtema": "Oscilaciones de Neutrinos",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El descubrimiento de las 'Oscilaciones de Neutrinos' en los detectores Super-Kamiokande y SNO (Premio Nobel 2015), donde un neutrino de un sabor determinado se metamorfosea espontáneamente en otro sabor durante su viaje, demostró indiscutiblemente que:",
    "opciones": [
      "A. Los neutrinos tienen carga eléctrica fraccionaria",
      "B. Los neutrinos tienen masas en reposo estrictamente distintas de cero, contradiciendo el Modelo Estándar original que los asumía de masa exactamente nula",
      "C. Los neutrinos viajan más rápido que la luz",
      "D. El Sol no produce energía nuclear"
    ],
    "correcta": 1,
    "explicacion": "Para que ocurran oscilaciones cuánticas de sabor (como ν_e → ν_μ), los estados propios de sabor deben ser combinaciones lineales de estados propios de masa con masas ligeramente distintas (Δm² ≠ 0). Esto resolvió el enigma histórico del déficit de neutrinos solares."
  },
  {
    "id": 575,
    "area": "Física Nuclear y Partículas",
    "subtema": "Violación de la Paridad (Experimento de Wu)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En 1956, la física Chien-Shiung Wu demostró mediante la desintegración beta de núcleos polarizados de Cobalto-60 a temperaturas criogénicas que:",
    "opciones": [
      "A. La energía no se conserva en reacciones nucleares",
      "B. La Interacción Débil viola al 100% la simetría de paridad espacial (P), emitiéndose los electrones preferencialmente en sentido opuesto al espín nuclear, lo que demuestra que la naturaleza distingue intrínsecamente entre la izquierda y la derecha",
      "C. El cobalto es un gas noble",
      "D. La carga eléctrica se destruye"
    ],
    "correcta": 1,
    "explicacion": "Propuesto teóricamente por Lee y Yang (Premio Nobel 1957), el experimento de Wu tumbó el dogma clásico de que las leyes de la física eran idénticas en un espejo. La fuerza débil acopla únicamente a fermiones con quiralidad levógira (mano izquierda)."
  },
  {
    "id": 576,
    "area": "Física Nuclear y Partículas",
    "subtema": "Datación por Carbono-14",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el principio biofísico de la datación arqueológica mediante el isótopo radiactivo Carbono-14 (vida media de 5,730 años)?",
    "opciones": [
      "A. El C-14 se produce en las rocas ígneas por el calor subterráneo",
      "B. Los seres vivos asimilan C-14 de la atmósfera en proporción constante durante su ciclo vital mediante fotosíntesis o alimentación; al morir cesa la ingesta y la concentración de C-14 decae exponencialmente según la ley radiactiva",
      "C. El C-14 no decae nunca y sirve de referencia fija",
      "D. La radiación ultravioleta destruye los huesos fósiles"
    ],
    "correcta": 1,
    "explicacion": "Willard Libby ideó el método en 1949: el C-14 se genera en la alta atmósfera por rayos cósmicos (¹⁴N + n → ¹⁴C + p). Al morir el organismo, el reloj radiactivo inicia su cuenta regresiva. Midiendo la actividad residual de C-14 respecto a C-12 se determina la fecha de muerte hasta ~50,000 años."
  },
  {
    "id": 577,
    "area": "Física Nuclear y Partículas",
    "subtema": "Sección Eficaz Nuclear",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En física nuclear y de colisiones, la 'Sección Eficaz' (representada por σ y medida en barns, 1 barn = 10⁻²⁸ m²) cuantifica:",
    "opciones": [
      "A. El diámetro geométrico macroscópico del reactor",
      "B. La probabilidad de que ocurra una reacción nuclear específica o proceso de dispersión entre un proyectil incidente y un núcleo blanco",
      "C. La temperatura a la que se funde el combustible nuclear",
      "D. La masa inercial de los neutrones térmicos"
    ],
    "correcta": 1,
    "explicacion": "La sección eficaz representa el área efectiva aparente que el núcleo presenta al proyectil para una interacción determinada. Puede ser mucho mayor o menor que el área geométrica real del núcleo debido a efectos cuánticos de resonancia ondulatoria."
  },
  {
    "id": 578,
    "area": "Física Nuclear y Partículas",
    "subtema": "Antimateria y Positrón",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Paul Dirac predijo teóricamente la existencia de la antimateria en 1928 al buscar una versión relativista de la mecánica cuántica. El positrón (antipartícula del electrón), descubierto por Carl Anderson en 1932 en rayos cósmicos, tiene:",
    "opciones": [
      "A. La misma masa y espín que el electrón, pero carga eléctrica exactamente opuesta (+1 e)",
      "B. La masa del protón y carga negativa",
      "C. Masa nula y espín cero",
      "D. Carga neutra y velocidad infinita"
    ],
    "correcta": 0,
    "explicacion": "Toda partícula elemental posee su correspondiente antipartícula con idéntica masa, vida media y espín, pero con números cuánticos aditivos opuestos (carga eléctrica, número leptónico/bariónico). Al colisionar partícula y antipartícula se produce aniquilación total en radiación pura."
  },
  {
    "id": 579,
    "area": "Física Nuclear y Partículas",
    "subtema": "Barras de Control en Reactores",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el material comúnmente empleado en las barras de control de un reactor nuclear debido a su extraordinaria capacidad de absorber neutrones sin sufrir fisión?",
    "opciones": [
      "A. Cobre o Aluminio puro",
      "B. Boro o Cadmio",
      "C. Plástico o Vidrio común",
      "D. Helio líquido"
    ],
    "correcta": 1,
    "explicacion": "El Cadmio-113 y el Boro-10 poseen colosales secciones eficaces de captura neutrónica térmica (miles de barns). Insertar las barras de control en el núcleo del reactor absorbe neutrones libres reduciendo el factor de multiplicación k por debajo de 1 para controlar o apagar la reacción en cadena."
  },
  {
    "id": 580,
    "area": "Física Nuclear y Partículas",
    "subtema": "Vida Media del Neutrón Libre",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "A diferencia de un neutrón confinado dentro de un núcleo atómico estable, un neutrón libre aislado fuera del núcleo es inestable y decae radiactivamente con una vida media media de aproximadamente:",
    "opciones": [
      "A. 1 milisegundo",
      "B. Unos 14.7 minutos (~880 segundos) por desintegración beta",
      "C. 5,730 años",
      "D. Es rigurosamente eterno"
    ],
    "correcta": 1,
    "explicacion": "Dado que la masa del neutrón libre (939.565 MeV) supera a la suma de las masas del protón (938.272 MeV) y del electrón (0.511 MeV), el decaimiento n → p + e⁻ + ν̄_e es energéticamente espontáneo, liberando 0.78 MeV con una vida media de unos 14.7 minutos."
  },
  {
    "id": 581,
    "area": "Física Nuclear y Partículas",
    "subtema": "Interacción Débil y Bosones Z",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El descubrimiento de las 'Corrientes Neutras Débiles' en la cámara de burbujas Gargamelle del CERN en 1973 confirmó la teoría electrodébil de Glashow, Salam y Weinberg al demostrar interacciones mediadas por:",
    "opciones": [
      "A. El bosón vectorial neutro Z⁰",
      "B. Fotones magnéticos de Dirac",
      "C. Monopolos de 't Hooft-Polyakov",
      "D. Axiones cósmicos"
    ],
    "correcta": 0,
    "explicacion": "Las corrientes débiles cargadas están mediadas por W⁺ y W⁻ y cambian el sabor de los fermiones. La corriente neutra débil mediada por el bosón Z⁰ permite que los neutrinos colisionen elásticamente contra electrones o quarks sin cambiar su carga, hito clave en la unificación electrodébil."
  },
  {
    "id": 582,
    "area": "Física Nuclear y Partículas",
    "subtema": "Masa del Quark Top",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El quark 'top' (t), descubierto en el acelerador Tevatron del Fermilab en 1995, es la partícula elemental más pesada conocida del Modelo Estándar, con una masa equivalente a:",
    "opciones": [
      "A. La masa de un átomo de helio",
      "B. Unos 173 GeV/c² (aproximadamente la masa de un átomo completo de oro o tungsteno)",
      "C. 1 MeV/c²",
      "D. Diez veces la masa del Sol"
    ],
    "correcta": 1,
    "explicacion": "Con ~173 GeV, el quark top es unas 70,000 veces más masivo que el quark up. Su vida media es tan astronómicamente efímera (~5 × 10⁻²⁵ segundos) que decae antes de que la fuerza fuerte tenga tiempo de formar hadrones con él (no forma mesones ni bariones)."
  },
  {
    "id": 583,
    "area": "Física Nuclear y Partículas",
    "subtema": "Isótopos de Hidrógeno",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuáles son los tres isótopos del elemento Hidrógeno y cuántos neutrones contiene cada uno de sus núcleos?",
    "opciones": [
      "A. Protio (0 neutrones), Deuterio (1 neutrón) y Tritio (2 neutrones)",
      "B. Hidrógeno alfa, beta y gamma (con 1, 2 y 3 protones respectivamente)",
      "C. Helio ligero, medio y pesado",
      "D. Todos los isótopos del hidrógeno tienen 2 neutrones obligatoriamente"
    ],
    "correcta": 0,
    "explicacion": "El Protio (¹H) tiene 1 protón y 0 neutrones (~99.98% de abundancia); el Deuterio (²H o D) tiene 1 protón y 1 neutrón (forma agua pesada D₂O); y el Tritio (³H o T) es un isótopo radiactivo inestable con 1 protón y 2 neutrones."
  },
  {
    "id": 584,
    "area": "Física Nuclear y Partículas",
    "subtema": "Fusión Inercial y Magnética",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En los reactores experimentales de fusión nuclear como ITER (Tokamak), la reacción más accesible a menor temperatura de ignición (~150 millones de Kelvin) es la fusión entre:",
    "opciones": [
      "A. Carbono y Oxígeno",
      "B. Deuterio y Tritio: ²H + ³H → ⁴He (3.5 MeV) + n (14.1 MeV)",
      "C. Protón y Neutrón libre",
      "D. Uranio y Plutonio"
    ],
    "correcta": 1,
    "explicacion": "La reacción D-T tiene la sección eficaz de fusión más alta a temperaturas energéticamente alcanzables en laboratorio. Libera una partícula alfa (helio-4) que retiene el plasma confinado por potentes campos magnéticos y un neutrón de alta energía que calienta el manto reproductor."
  },
  {
    "id": 585,
    "area": "Física Nuclear y Partículas",
    "subtema": "Simetría CPT",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Teorema CPT de la teoría cuántica de campos relativista demuestra que cualquier teoría física local invariante de Lorentz debe ser rigurosamente exacta e invariante ante la aplicación simultánea de:",
    "opciones": [
      "A. Campo, Potencial y Temperatura",
      "B. Conjugación de Carga (C), Inversión de Paridad espacial (P) y Reversión Temporal (T)",
      "C. Calor, Presión y Tensión",
      "D. Continuidad, Proyección y Traslación"
    ],
    "correcta": 1,
    "explicacion": "Aunque C, P y CP pueden violarse individualmente en la naturaleza (como en la interacción débil de los kaones y mesones B), el producto combinado CPT permanece estrictamente exacto. Garantiza que toda partícula y su antipartícula tengan masas y vidas medias rigurosamente idénticas."
  },
  {
    "id": 586,
    "area": "Rotación y Gravitación",
    "subtema": "Límite de Chandrasekhar",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El célebre astrofísico Subrahmanyan Chandrasekhar calculó en 1930 que la masa máxima que puede soportar una estrella enana blanca contra el colapso gravitatorio mediante la presión de degeneración de electrones relativistas es de aproximadamente:",
    "opciones": [
      "A. 0.5 Masas Solares",
      "B. 1.44 Masas Solares (Límite de Chandrasekhar)",
      "C. 5.0 Masas Solares",
      "D. 100 Masas Solares"
    ],
    "correcta": 1,
    "explicacion": "Si la masa del núcleo remanente de una estrella excede 1.44 M_☉, los electrones degenerados alcanzan velocidades ultra-relativistas y no pueden generar la presión suficiente para equilibrar la gravedad, colapsando inevitablemente en una estrella de neutrones o un agujero negro."
  },
  {
    "id": 587,
    "area": "Rotación y Gravitación",
    "subtema": "Estrellas de Neutrones y Púlsares",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué es un Púlsar, descubierto en 1967 por Jocelyn Bell Burnell?",
    "opciones": [
      "A. Un planeta gigante con tormentas eléctricas periódicas",
      "B. Una estrella de neutrones ultradensa y altamente magnetizada en rápida rotación que emite haces colimados de radiación electromagnética a lo largo de sus polos magnéticos, barriendo la Tierra periódicamente como un faro",
      "C. Una estrella que colapsa y explota cada 5 segundos",
      "D. Un satélite artificial de origen extraterrestre"
    ],
    "correcta": 1,
    "explicacion": "Una estrella de neutrones comprime la masa del Sol en una esfera de apenas 20 km de diámetro sostenida por degeneración neutrónica. Debido a la conservación del momento angular y del flujo magnético durante el colapso, rota a velocidades vertiginosas emitiendo pulsos extremadamente precisos."
  },
  {
    "id": 588,
    "area": "Rotación y Gravitación",
    "subtema": "Ley de Hubble-Lemaître",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Ley de Hubble-Lemaître formulada empíricamente en 1929 establece que la velocidad de recesión aparente v con la que se alejan las galaxias lejanas respecto a nosotros es proporcional a:",
    "opciones": [
      "A. El cuadrado de la masa de la galaxia",
      "B. Su distancia física d respecto a la Tierra: v = H₀ · d",
      "C. La temperatura de sus estrellas centrales",
      "D. El ángulo de inclinación de sus brazos espirales"
    ],
    "correcta": 1,
    "explicacion": "v = H₀ d demuestra que el universo no es estático sino que el tejido del espacio mismo se expande uniformemente en todas direcciones: cuanto más lejana está una galaxia, mayor cantidad de espacio se expande entre ella y nosotros, produciendo un corrimiento al rojo proporcional a la distancia."
  },
  {
    "id": 589,
    "area": "Rotación y Gravitación",
    "subtema": "Fondo Cósmico de Microondas (CMB)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La Radiación del Fondo Cósmico de Microondas (CMB), descubierta accidentalmente en 1964 por Arno Penzias y Robert Wilson (Premio Nobel 1978), corresponde físicamente a:",
    "opciones": [
      "A. La radiación dispersada por satélites de telecomunicaciones",
      "B. El eco térmico fósil de radiación de cuerpo negro perfecto a T ≈ 2.725 Kelvin emitido en la época de recombinación (~380,000 años tras el Big Bang), cuando los electrones y protones formaron átomos neutros de hidrógeno y el universo se volvió transparente a la luz",
      "C. Emisiones de ondas de radio generadas por agujeros negros supermasivos",
      "D. La luz emitida por el núcleo de la Vía Láctea"
    ],
    "correcta": 1,
    "explicacion": "Es la evidencia más concluyente de la teoría del Big Bang. Inicialmente emitida como radiación ultravioleta/visible a ~3,000 K, la expansión cósmica durante 13,800 millones de años estiró su longitud de onda por un factor de z ≈ 1,100, desplazándola a microondas a solo 2.7 K sobre el cero absoluto."
  },
  {
    "id": 590,
    "area": "Rotación y Gravitación",
    "subtema": "Materia Oscura y Curvas de Rotación",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la década de 1970, la astrónoma Vera Rubin midió las velocidades de rotación orbital de las estrellas y gas en los bordes exteriores de galaxias espirales, descubriendo con asombro que:",
    "opciones": [
      "A. Las estrellas exteriores estaban completamente inmóviles",
      "B. Las curvas de rotación eran planas (v ≈ constante) en lugar de decaer como 1/√r según predecía la masa visible newtoniana, demostrando la presencia de un gigantesco halo invisible de Materia Oscura que rodea a las galaxias",
      "C. Todas las estrellas eran expulsadas al espacio intergaláctico",
      "D. La masa del gas era mil veces superior a la de las estrellas"
    ],
    "correcta": 1,
    "explicacion": "Por la mecánica de Kepler y Newton, lejos del centro brillante v debería caer como √(GM/r). Al permanecer la velocidad constante a distancias colosales, Rubin probó que el 85% de la masa galáctica total corresponde a materia oscura no luminosa que permea el halo galáctico."
  },
  {
    "id": 591,
    "area": "Rotación y Gravitación",
    "subtema": "Energía Oscura y Expansión Acelerada",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En 1998, dos equipos independientes de astrónomos midieron la luminosidad de Supernovas de Tipo Ia muy lejanas y descubrieron un hecho que conmocionó a la cosmología (Premio Nobel 2011):",
    "opciones": [
      "A. El universo se estaba contrayendo rápidamente hacia un Big Crunch",
      "B. La velocidad de expansión del universo no se está frenando por la gravedad, sino que se está acelerando en el tiempo debido a la presencia de la denominada 'Energía Oscura' (~68% del cosmos)",
      "C. La velocidad de la luz en el universo temprano era cero",
      "D. Las supernovas no emiten energía"
    ],
    "correcta": 1,
    "explicacion": "Las supernovas lejanas aparecían sistemáticamente más tenues y lejanas de lo esperado para un universo desacelerado. La Energía Oscura actúa como una presión negativa repulsiva homogénea en el espacio-tiempo (asociada a la Constante Cosmológica Λ de Einstein)."
  },
  {
    "id": 592,
    "area": "Rotación y Gravitación",
    "subtema": "Composición del Universo (Modelo ΛCDM)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "De acuerdo con las observaciones cosmológicas de ultra-alta precisión del satélite espacial Planck, ¿cuál es la composición energética actual aproximada del Universo observable?",
    "opciones": [
      "A. 100% átomos de hidrógeno y helio visibles",
      "B. ~68% Energía Oscura, ~27% Materia Oscura fría, y apenas ~5% de Materia Ordinaria o Bariónica (estrellas, planetas, gas y seres humanos)",
      "C. 50% materia visible y 50% antimateria",
      "D. 90% agujeros negros y 10% radiación"
    ],
    "correcta": 1,
    "explicacion": "La materia ordinaria de la que estamos hechos (protones, neutrones, electrones) representa apenas una vigésima parte del contenido del cosmos (≈ 4.9%). El 95% restante es un sector oscuro compuesto por materia oscura (≈ 26.8%) y energía oscura (≈ 68.3%)."
  },
  {
    "id": 593,
    "area": "Rotación y Gravitación",
    "subtema": "Paradoja de Olbers",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La Paradoja de Heinrich Olbers plantea: 'Si el universo fuese estático, infinito en extensión y eterno en el tiempo, cada línea de visión terminaría tarde o temprano en la superficie brillante de una estrella, haciendo que el cielo nocturno ardiera tan brillante como el Sol'. ¿Por qué la noche es oscura?",
    "opciones": [
      "A. Porque el polvo interestelar absorbe y destruye la luz para siempre",
      "B. Porque el universo tiene una edad finita (~13,800 millones de años, la luz de estrellas lejanas aún no ha tenido tiempo de llegar) y el universo se expande, corriendo la luz lejana al infrarrojo",
      "C. Porque las estrellas se apagan todas a medianoche",
      "D. Por el campo magnético de la Luna"
    ],
    "correcta": 1,
    "explicacion": "El enigma se resuelve porque el universo observable tiene un horizonte temporal finito de 13,800 millones de años (muchas estrellas aún no han nacido o su luz no ha alcanzado la Tierra) y la expansión cósmica atenúa y enrojece la radiación de fondo."
  },
  {
    "id": 594,
    "area": "Física Fundamental",
    "subtema": "Experimento de Rutherford",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En 1911, Ernest Rutherford bombardeó una delgada lámina de oro con partículas alfa observando que la inmensa mayoría atravesaba sin desviarse, pero unas pocas rebotaban hacia atrás con ángulos superiores a 90°. Rutherford concluyó que:",
    "opciones": [
      "A. El modelo del pudín de pasas de Thomson era perfectamente exacto",
      "B. La mayor parte del átomo es espacio vacío y casi toda su masa y carga positiva se concentran en un núcleo central diminuto y extremadamente denso",
      "C. El oro es impermeable a la radiación",
      "D. Los electrones tienen mayor masa que las partículas alfa"
    ],
    "correcta": 1,
    "explicacion": "Rutherford comparó el asombro diciendo: 'Fue tan increíble como si dispararas un proyectil de 15 pulgadas contra un papel de seda y rebotara contra ti'. Demostró que el núcleo tiene un radio de ~10⁻¹⁵ m frente al radio atómico de ~10⁻¹⁰ m (el núcleo ocupa una diezmilésima del tamaño del átomo)."
  },
  {
    "id": 595,
    "area": "Física Fundamental",
    "subtema": "Experimento de la Gota de Aceite de Millikan",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué midió Robert Millikan en 1909 suspendiendo diminutas gotas de aceite cargadas entre las placas electrificadas de un condensador horizontal?",
    "opciones": [
      "A. La velocidad de la luz en el aceite",
      "B. Demostró la cuantización exacta de la carga eléctrica y determinó con gran precisión la carga elemental fundamental del electrón (e ≈ 1.602 × 10⁻¹⁹ Coulomb)",
      "C. La viscosidad del aire únicamente",
      "D. La masa del neutrón"
    ],
    "correcta": 1,
    "explicacion": "Equilibrando el peso gravitatorio con la fuerza eléctrica de campo (qE = mg) y midiendo la velocidad terminal de caída libre mediante la Ley de Stokes, Millikan comprobó que la carga q en todas las gotas era siempre un múltiplo entero exacto de un cuanto indivisible: q = n e."
  },
  {
    "id": 596,
    "area": "Física Fundamental",
    "subtema": "Experimento de Cavendish",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "El célebre experimento de la balanza de torsión de Henry Cavendish (1798), conocido popularmente como 'pesar la Tierra', permitió medir por primera vez:",
    "opciones": [
      "A. La presión barométrica en las montañas",
      "B. La débil atracción gravitatoria mutua entre masas esféricas de plomo en laboratorio, deduciendo el valor numérico de la Constante de Gravitación Universal G y la masa de la Tierra",
      "C. La velocidad de rotación de la galaxia",
      "D. La carga eléctrica de la atmósfera"
    ],
    "correcta": 1,
    "explicacion": "Midiendo la minúscula torsión de un hilo fino de cuarzo que sostenía dos esferas de plomo atraídas por esferas de plomo mayores, Cavendish midió la constante G ≈ 6.67 × 10⁻¹¹ N·m²/kg², calculando inmediatamente a partir de g = GM/R² la masa de la Tierra en unas 6 × 10²⁴ kg."
  },
  {
    "id": 597,
    "area": "Física Fundamental",
    "subtema": "Redefinición del SI (2019)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En la histórica redefinición del Sistema Internacional de Unidades (SI) aprobada en Versalles en noviembre de 2018 y en vigor desde 2019, ¿cómo se define formalmente el kilogramo patrón?",
    "opciones": [
      "A. Sigue basándose en el cilindro de platino-iridio guardado en una bóveda en París",
      "B. Se fija unívocamente fijando el valor numérico exacto de la Constante de Planck (h = 6.62607015 × 10⁻³⁴ J·s) mediante instrumentos electromagnéticos como la Balanza de Kibble",
      "C. Como la masa de un litro de agua pesada a 4 °C",
      "D. Como la masa de un trillón de átomos de carbono"
    ],
    "correcta": 1,
    "explicacion": "El SI eliminó el último artefacto material físico (el 'Gran Kilo' en París). Hoy todas las unidades base (metro, segundo, kilogramo, amperio, kelvin, mol y candela) se derivan de constantes universales de la naturaleza inmutables (c, h, e, k_B, N_A, Δν_Cs, K_cd)."
  },
  {
    "id": 598,
    "area": "Física Fundamental",
    "subtema": "Definición del Metro en el SI",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Desde 1983, el metro patrón en el Sistema Internacional se define formalmente como:",
    "opciones": [
      "A. La longitud de una barra metálica de platino e iridio conservada a 0 °C",
      "B. La distancia exacta que recorre la luz en el vacío en un intervalo temporal de 1 / 299,792,458 segundos",
      "C. La diezmillonésima parte de la distancia del ecuador al polo norte",
      "D. Un millón de longitudes de onda de un láser verde"
    ],
    "correcta": 1,
    "explicacion": "Al definirse la velocidad de la luz en el vacío como una constante exacta invariable por decreto metrológico (c = 299,792,458 m/s), la unidad de longitud metro quedó vinculada directamente a la medición ultra-precisa del tiempo mediante relojes atómicos de cesio."
  },
  {
    "id": 599,
    "area": "Física Fundamental",
    "subtema": "Teorema de Noether",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Teorema de Emmy Noether (1918) es uno de los teoremas más bellos y profundos de toda la física teórica al demostrar que:",
    "opciones": [
      "A. Toda partícula elemental debe tener carga fraccionaria",
      "B. A cada simetría geométrica continua de las leyes de la física (del lagrangiano) le corresponde inexorablemente una ley de conservación física: la simetría temporal implica conservación de energía, la traslacional conserva momento lineal y la rotacional conserva momento angular",
      "C. Las fuerzas de fricción no conservan la masa",
      "D. El universo se colapsará en un punto"
    ],
    "correcta": 1,
    "explicacion": "Noether demostró la raíz geométrica de las leyes de conservación: que las leyes de la física sean las mismas hoy que mañana (invariancia temporal) garantiza la conservación de la energía; que sean las mismas aquí que en Marte conserva el momento lineal."
  },
  {
    "id": 600,
    "area": "Física Fundamental",
    "subtema": "Experimento de Pound-Rebka",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué midieron con éxito Robert Pound y Glen Rebka en 1959 en una torre de la Universidad de Harvard de solo 22.5 metros de altura?",
    "opciones": [
      "A. La aceleración centrífuga de la atmósfera",
      "B. El corrimiento al rojo gravitacional de fotones gamma del Hierro-57 ascendiendo en el campo gravitatorio terrestre aprovechando el efecto Mössbauer de absorción sin retroceso, confirmando la Relatividad General en escala terrestre",
      "C. La velocidad del sonido en el vacío",
      "D. La masa del neutrón"
    ],
    "correcta": 1,
    "explicacion": "Los fotones pierden energía al escalar un pozo gravitatorio (ΔE/E = gh/c² ≈ 2.5 × 10⁻¹⁵). Pound y Rebka utilizaron el Efecto Mössbauer para detectar esa diminuta variación fraccionaria de frecuencia con una precisión de 1 parte en 10¹⁵, validando el principio de equivalencia en laboratorio."
  },
  {
    "id": 601,
    "area": "Rotación y Gravitación",
    "subtema": "Lente Gravitacional y Materia Oscura en el Cúmulo de la Bala",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "La observación astrofísica del 'Cúmulo de la Bala' (Bullet Cluster 1E 0657-56) es considerada la prueba empírica más contundente de la existencia de la Materia Oscura porque:",
    "opciones": [
      "A. Se apagaron todas las galaxias simultáneamente",
      "B. Tras la colisión entre dos cúmulos de galaxias, el gas intergaláctico ordinario visible por rayos X se frenó por fricción electromagnética en el centro, mientras que los mapas de masa deducidos por lente gravitacional mostraron que la mayor parte de la masa continuó su trayectoria sin interactuar",
      "C. Las estrellas chocaron frontalmente fusionándose",
      "D. Se detectó una nube de antimateria pura"
    ],
    "correcta": 1,
    "explicacion": "Muestra una separación espacial neta entre la materia ordinaria (gas caliente que interactuó y quedó rezagado en el centro) y la materia oscura (que pasó de largo sin colisionar excepto gravitatoriamente), descartando las teorías que intentaban modificar la gravedad (MOND) sin partículas oscuras."
  },
  {
    "id": 602,
    "area": "Rotación y Gravitación",
    "subtema": "Diagrama Hertzsprung-Russell",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "En un diagrama de Hertzsprung-Russell (H-R), herramienta fundamental de la astrofísica estelar, las estrellas de la 'Secuencia Principal' (donde pasa el 90% de su vida el Sol) se caracterizan por:",
    "opciones": [
      "A. Fusionar activamente hidrógeno en helio en su núcleo denso en equilibrio hidrostático perfecto entre la presión de radiación térmica y la auto-gravedad",
      "B. Estar colapsando en agujeros negros",
      "C. Ser estrellas frías de hierro puro",
      "D. No tener campo magnético"
    ],
    "correcta": 0,
    "explicacion": "La secuencia principal es la banda diagonal en el diagrama H-R (Luminosidad vs Temperatura efectiva). La estrella permanece en ella de forma extraordinariamente estable fusionando hidrógeno mientras su presión térmica hacia afuera equilibre el peso gravitatorio hacia adentro."
  },
  {
    "id": 603,
    "area": "Física Fundamental",
    "subtema": "Análisis Dimensional y Teorema Pi de Buckingham",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El Teorema Pi de Buckingham en el análisis dimensional de la física y la ingeniería establece que si un fenómeno físico involucra n variables dimensionales independientes expresables en k dimensiones físicas fundamentales, el problema puede describirse completamente mediante:",
    "opciones": [
      "A. n + k ecuaciones diferenciales",
      "B. n - k números o grupos adimensionales independientes Π",
      "C. Un único parámetro constante sin dimensiones",
      "D. n · k variables de estado"
    ],
    "correcta": 1,
    "explicacion": "Permite simplificar drásticamente sistemas complejos reduciendo el número de parámetros efectivos a n - k grupos adimensionales (como el Número de Reynolds, Número de Mach, Número de Froude), base de la teoría de modelos a escala en túneles de viento."
  },
  {
    "id": 604,
    "area": "Física Fundamental",
    "subtema": "Principio de Mínima Acción",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El Principio de Mínima Acción de Maupertuis y Hamilton formula que la trayectoria dinámica real que sigue una partícula o sistema entre dos estados configuracionales en el espacio-tiempo es aquella que:",
    "opciones": [
      "A. Maximiza la fricción con el medio",
      "B. Hace estacionaria (mínima o punto de ensilladura) la integral temporal de la función Lagrangiana (S = ∫ L dt, donde L = T - V): δS = 0, de la cual emergen las ecuaciones de Euler-Lagrange",
      "C. Mantiene constante la aceleración",
      "D. Iguala la velocidad de la partícula a la de la luz"
    ],
    "correcta": 1,
    "explicacion": "Es el principio unificador más sublime de la física: la mecánica clásica newtoniana, el electromagnetismo de Maxwell, la relatividad general de Einstein y el formalismo de integrales de camino de Feynman en física cuántica se deducen a partir de la exigencia de que la acción S sea estacionaria: δS = 0."
  },
  {
    "id": 605,
    "area": "Física Fundamental",
    "subtema": "Difracción de Moléculas Gigantes (C60)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En 1999, el grupo de Anton Zeilinger en Viena demostró el patrón de interferencia ondulatoria de doble rendija utilizando macromoléculas de Buckyballs (Fulerenos C₆₀, compuestas por 60 átomos de carbono masivos). ¿Qué implicación tiene este experimento?",
    "opciones": [
      "A. Que las moléculas grandes se descomponen en luz",
      "B. Que la dualidad onda-partícula cuántica de de Broglie es universal y sigue siendo rigurosamente válida incluso para moléculas orgánicas complejas y masivas, siempre que se mantenga el aislamiento cuántico y se evite la decoherencia con el entorno",
      "C. Que el carbono no tiene masa inercial",
      "D. Que los fulerenos son partículas sin masa"
    ],
    "correcta": 1,
    "explicacion": "Con una masa atómica de 720 Da y 60 núcleos, una molécula de C₆₀ es gigantesca en comparación con un electrón. El experimento probó que la frontera entre lo cuántico y lo clásico no es una cuestión de tamaño molecular intrínseco, sino de decoherencia cuántica por interacción con fotones o gas ambiental."
  }
];

console.log('✓ Banco de Gran Trivia de Física cargado: ' + window.TRIVIA_QUESTIONS.length + ' preguntas únicas y diversificadas.');
