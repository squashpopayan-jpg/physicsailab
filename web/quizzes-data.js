// Banco Oficial de Quizzes Interactivos - PhysicsAILab
// Basado en el Cuestionario Oficial de Cinemática y Dinámica (Mg. Manuel Alejandro Obando - Universidad del Cauca)
window.QUIZZES_DATA = {
  questions: [
  {
    "id": 1,
    "num": "01",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "concepto",
    "pregunta": "¿Qué caracteriza al movimiento rectilíneo uniforme (MRU)?",
    "opciones": [
      "A. Rapidez creciente y aceleración constante",
      "B. Velocidad constante y aceleración nula",
      "C. Trayectoria curva y rapidez constante",
      "D. Velocidad constante y aceleración no nula"
    ],
    "correcta": "B",
    "explicacion": "En el MRU la velocidad es constante tanto en magnitud (rapidez) como en dirección y sentido; por definición, al no haber cambio en la velocidad, la aceleración es estrictamente nula (a = 0)."
  },
  {
    "id": 2,
    "num": "02",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "concepto",
    "pregunta": "Un móvil realiza MRU sobre el eje x. ¿Qué ecuación describe su posición si en t = 0 está en x₀?",
    "opciones": [
      "A. x = x₀ + vₓt²",
      "B. x = vₓ/t",
      "C. x = x₀ + vₓ/t",
      "D. x = x₀ + vₓt"
    ],
    "correcta": "D",
    "explicacion": "La ecuación horaria de posición para un movimiento con velocidad constante vₓ partiendo de la posición inicial x₀ en t = 0 es x(t) = x₀ + vₓt."
  },
  {
    "id": 3,
    "num": "03",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "calculo",
    "pregunta": "Un automóvil se mueve a 72 km/h. ¿A cuántos metros por segundo equivale esa rapidez?",
    "opciones": [
      "A. 36 m/s",
      "B. 10 m/s",
      "C. 72 m/s",
      "D. 20 m/s"
    ],
    "correcta": "D",
    "explicacion": "Para convertir de km/h a m/s se divide entre 3.6 (o se multiplica por 1000/3600): 72 / 3.6 = 20 m/s."
  },
  {
    "id": 4,
    "num": "04",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "grafica",
    "pregunta": "La gráfica x(t) de la pregunta 04 es una recta que va de x = 2 m en t = 0 s a x = 14 m en t = 4 s. ¿Cuál es la velocidad?",
    "opciones": [
      "A. −3 m/s",
      "B. +3 m/s",
      "C. +12 m/s",
      "D. +4 m/s"
    ],
    "correcta": "B",
    "explicacion": "La velocidad en una gráfica x-t corresponde a la pendiente de la recta: v = Δx / Δt = (14 m − 2 m) / (4 s − 0 s) = 12 / 4 = +3 m/s.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <defs>\n        <pattern id=\"grid4\" width=\"40\" height=\"30\" patternUnits=\"userSpaceOnUse\">\n          <path d=\"M 40 0 L 0 0 0 30\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"1\"/>\n        </pattern>\n      </defs>\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <rect x=\"50\" y=\"20\" width=\"350\" height=\"160\" fill=\"url(#grid4)\"/>\n      <!-- Ejes -->\n      <line x1=\"50\" y1=\"180\" x2=\"410\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"50\" y1=\"20\" x2=\"50\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"415\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">t (s)</text>\n      <text x=\"25\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">x (m)</text>\n      <!-- Marcas eje t -->\n      <text x=\"50\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"137\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"225\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"312\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <!-- Marcas eje x -->\n      <text x=\"42\" y=\"160\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">2</text>\n      <text x=\"42\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">5</text>\n      <text x=\"42\" y=\"90\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">8</text>\n      <text x=\"42\" y=\"55\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">11</text>\n      <text x=\"42\" y=\"32\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">14</text>\n      <!-- Línea x(t) -->\n      <line x1=\"50\" y1=\"157\" x2=\"400\" y2=\"30\" stroke=\"#38bdf8\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n      <circle cx=\"50\" cy=\"157\" r=\"5\" fill=\"#38bdf8\"/>\n      <circle cx=\"400\" cy=\"30\" r=\"5\" fill=\"#38bdf8\"/>\n    </svg>"
  },
  {
    "id": 5,
    "num": "05",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "concepto",
    "pregunta": "Un móvil tiene velocidad constante vₓ = −5 m/s. ¿Qué indica el signo negativo?",
    "opciones": [
      "A. La distancia recorrida es negativa",
      "B. Se mueve en el sentido negativo del eje x",
      "C. Su aceleración es negativa necesariamente",
      "D. Su rapidez disminuye necesariamente"
    ],
    "correcta": "B",
    "explicacion": "El signo de la componente escalar de velocidad en 1D indica el sentido del desplazamiento a lo largo del eje coordenado; un signo negativo significa que se desplaza hacia la izquierda o en sentido negativo de x."
  },
  {
    "id": 6,
    "num": "06",
    "tema": "Movimiento rectilíneo uniforme",
    "categoria": "calculo",
    "pregunta": "Una bicicleta avanza en línea recta con rapidez constante de 6 m/s durante 15 s. ¿Qué distancia recorre?",
    "opciones": [
      "A. 90 m",
      "B. 2,5 m",
      "C. 21 m",
      "D. 40 m"
    ],
    "correcta": "A",
    "explicacion": "En movimiento con rapidez constante: distancia d = v · t = (6 m/s) × (15 s) = 90 m."
  },
  {
    "id": 7,
    "num": "07",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "grafica",
    "pregunta": "La gráfica vₓ(t) de la pregunta 07 aumenta linealmente de 2 m/s a 10 m/s en 4 s. ¿Cuál es la aceleración?",
    "opciones": [
      "A. +3 m/s²",
      "B. +2 m/s²",
      "C. +8 m/s²",
      "D. −2 m/s²"
    ],
    "correcta": "B",
    "explicacion": "La aceleración es la pendiente de la gráfica v-t: a = Δv / Δt = (10 − 2) / (4 − 0) = 8 / 4 = +2 m/s².",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <defs>\n        <pattern id=\"grid7\" width=\"40\" height=\"30\" patternUnits=\"userSpaceOnUse\">\n          <path d=\"M 40 0 L 0 0 0 30\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"1\"/>\n        </pattern>\n      </defs>\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <rect x=\"50\" y=\"20\" width=\"350\" height=\"160\" fill=\"url(#grid7)\"/>\n      <line x1=\"50\" y1=\"180\" x2=\"410\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"50\" y1=\"20\" x2=\"50\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"415\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">t (s)</text>\n      <text x=\"20\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">vₓ (m/s)</text>\n      <text x=\"50\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"137\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"225\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"312\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <text x=\"42\" y=\"150\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">2</text>\n      <text x=\"42\" y=\"115\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">4</text>\n      <text x=\"42\" y=\"85\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">6</text>\n      <text x=\"42\" y=\"55\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">8</text>\n      <text x=\"42\" y=\"30\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">10</text>\n      <line x1=\"50\" y1=\"148\" x2=\"400\" y2=\"28\" stroke=\"#38bdf8\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n      <circle cx=\"50\" cy=\"148\" r=\"5\" fill=\"#38bdf8\"/>\n      <circle cx=\"400\" cy=\"28\" r=\"5\" fill=\"#38bdf8\"/>\n    </svg>"
  },
  {
    "id": 8,
    "num": "08",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "concepto",
    "pregunta": "En un movimiento rectilíneo, vₓ > 0 y aₓ < 0 durante cierto intervalo. ¿Qué ocurre con la rapidez en ese intervalo?",
    "opciones": [
      "A. Permanece constante",
      "B. Es necesariamente cero",
      "C. Disminuye",
      "D. Aumenta"
    ],
    "correcta": "C",
    "explicacion": "Cuando la velocidad y la aceleración tienen signos algebraicos opuestos, el vector aceleración se opone al movimiento, haciendo que la magnitud de la velocidad (rapidez) disminuya (frenado)."
  },
  {
    "id": 9,
    "num": "09",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "calculo",
    "pregunta": "Un móvil parte del reposo y tiene aceleración constante de +2 m/s². ¿Cuál es su velocidad a los 5 s?",
    "opciones": [
      "A. +7 m/s",
      "B. +25 m/s",
      "C. +10 m/s",
      "D. +2,5 m/s"
    ],
    "correcta": "C",
    "explicacion": "Al partir del reposo (v₀ = 0): v = v₀ + a · t = 0 + (2 m/s²) × (5 s) = +10 m/s."
  },
  {
    "id": 10,
    "num": "10",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "grafica",
    "pregunta": "La gráfica vₓ(t) de la pregunta 10 sube linealmente desde 0 hasta 8 m/s entre t = 0 y 6 s. ¿Cuál es el desplazamiento en ese intervalo?",
    "opciones": [
      "A. 24 m",
      "B. 8 m",
      "C. 48 m",
      "D. 12 m"
    ],
    "correcta": "A",
    "explicacion": "El desplazamiento en una gráfica v-t es el área geométrica bajo la curva. Como es un triángulo: Área = (Base × Altura) / 2 = (6 s × 8 m/s) / 2 = 48 / 2 = 24 m.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <defs>\n        <pattern id=\"grid10\" width=\"40\" height=\"30\" patternUnits=\"userSpaceOnUse\">\n          <path d=\"M 40 0 L 0 0 0 30\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"1\"/>\n        </pattern>\n      </defs>\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <rect x=\"50\" y=\"20\" width=\"350\" height=\"160\" fill=\"url(#grid10)\"/>\n      <!-- Sombra triangular -->\n      <polygon points=\"50,180 400,30 400,180\" fill=\"rgba(56,189,248,0.18)\"/>\n      <line x1=\"50\" y1=\"180\" x2=\"410\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"50\" y1=\"20\" x2=\"50\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"415\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">t (s)</text>\n      <text x=\"20\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">vₓ (m/s)</text>\n      <text x=\"50\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"166\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"283\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">6</text>\n      <text x=\"42\" y=\"145\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">2</text>\n      <text x=\"42\" y=\"110\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">4</text>\n      <text x=\"42\" y=\"75\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">6</text>\n      <text x=\"42\" y=\"35\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">8</text>\n      <line x1=\"50\" y1=\"180\" x2=\"400\" y2=\"30\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <circle cx=\"50\" cy=\"180\" r=\"4\" fill=\"#38bdf8\"/>\n      <circle cx=\"400\" cy=\"30\" r=\"5\" fill=\"#38bdf8\"/>\n    </svg>"
  },
  {
    "id": 11,
    "num": "11",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "calculo",
    "pregunta": "Un automóvil lleva v₀ₓ = +10 m/s y frena con aₓ = −2,5 m/s² constante. ¿Qué distancia recorre hasta detenerse?",
    "opciones": [
      "A. 40 m",
      "B. 20 m",
      "C. 25 m",
      "D. 4 m"
    ],
    "correcta": "B",
    "explicacion": "Usando v² = v₀² + 2a·d. Al detenerse v = 0: 0 = 10² + 2(−2.5)·d  => 0 = 100 − 5d  => 5d = 100  => d = 20 m."
  },
  {
    "id": 12,
    "num": "12",
    "tema": "Movimiento rectilíneo acelerado",
    "categoria": "concepto",
    "pregunta": "¿Cómo se define la aceleración media en un intervalo de tiempo Δt?",
    "opciones": [
      "A. a⃗media = v⃗final × Δt",
      "B. amedia = distancia / Δt",
      "C. amedia = rapidez final / distancia",
      "D. a⃗media = Δv⃗ / Δt"
    ],
    "correcta": "D",
    "explicacion": "La aceleración media es por definición vectorial el cociente entre el cambio de velocidad (vectorial) y el intervalo de tiempo transcurrido: a⃗_media = Δv⃗ / Δt."
  },
  {
    "id": 13,
    "num": "13",
    "tema": "Caída libre",
    "categoria": "grafica",
    "pregunta": "La gráfica y(t) de la pregunta 13 muestra un objeto soltado desde 80 m: a los 2 s está a 60 m. ¿Qué distancia ha caído en esos 2 s?",
    "opciones": [
      "A. 80 m",
      "B. 60 m",
      "C. 20 m",
      "D. 40 m"
    ],
    "correcta": "C",
    "explicacion": "La distancia caída es la diferencia de alturas: Δy = y_inicial − y_actual = 80 m − 60 m = 20 m.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <line x1=\"60\" y1=\"180\" x2=\"400\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"60\" y1=\"20\" x2=\"60\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"405\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\">t (s)</text>\n      <text x=\"25\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\">Altura y (m)</text>\n      <text x=\"60\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"145\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"230\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"315\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <text x=\"50\" y=\"184\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">0</text>\n      <text x=\"50\" y=\"145\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">20</text>\n      <text x=\"50\" y=\"110\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">40</text>\n      <text x=\"50\" y=\"75\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">60</text>\n      <text x=\"50\" y=\"35\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">80</text>\n      <!-- Parábola y = 80 - 5t^2 -->\n      <path d=\"M 60 35 Q 200 45 230 75 T 400 180\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <circle cx=\"60\" cy=\"35\" r=\"5\" fill=\"#ef4444\"/>\n      <circle cx=\"230\" cy=\"75\" r=\"5\" fill=\"#ef4444\"/>\n      <circle cx=\"400\" cy=\"180\" r=\"5\" fill=\"#ef4444\"/>\n    </svg>"
  },
  {
    "id": 14,
    "num": "14",
    "tema": "Caída libre",
    "categoria": "concepto",
    "pregunta": "Dos objetos de distinta masa se sueltan simultáneamente desde la misma altura, sin resistencia del aire. ¿Qué ocurre?",
    "opciones": [
      "A. El tiempo depende del peso de cada uno",
      "B. Llegan al suelo al mismo tiempo",
      "C. Llega primero el de menor masa",
      "D. Llega primero el de mayor masa"
    ],
    "correcta": "B",
    "explicacion": "En el vacío o despreciando el aire, todos los cuerpos aceleran con la misma aceleración gravitatoria g independientemente de su masa, por lo que tardan exactamente el mismo tiempo en caer."
  },
  {
    "id": 15,
    "num": "15",
    "tema": "Caída libre",
    "categoria": "calculo",
    "pregunta": "Se deja caer un objeto desde el reposo a 45 m del suelo. Usa g = 10 m/s² y desprecia el aire. ¿Cuánto tarda en llegar al suelo?",
    "opciones": [
      "A. 4,5 s",
      "B. 1,5 s",
      "C. 3 s",
      "D. 9 s"
    ],
    "correcta": "C",
    "explicacion": "h = (1/2)gt² => 45 = 0.5 × 10 × t² => 45 = 5t² => t² = 9 => t = 3 s."
  },
  {
    "id": 16,
    "num": "16",
    "tema": "Caída libre",
    "categoria": "concepto",
    "pregunta": "Una pelota se lanza verticalmente hacia arriba. En el punto más alto, sin resistencia del aire, ¿cuáles son su velocidad y su aceleración?",
    "opciones": [
      "A. Velocidad hacia arriba y aceleración cero",
      "B. Velocidad cero y aceleración hacia arriba",
      "C. Velocidad cero y aceleración cero",
      "D. Velocidad cero y aceleración hacia abajo"
    ],
    "correcta": "D",
    "explicacion": "En el punto más alto la velocidad instantánea se anula (v = 0), pero la gravedad sigue actuando constantemente con aceleración g hacia abajo."
  },
  {
    "id": 17,
    "num": "17",
    "tema": "Caída libre",
    "categoria": "grafica",
    "pregunta": "En la gráfica vᵧ(t) de la pregunta 17 se toma +y hacia arriba. La velocidad pasa de +20 m/s en t = 0 a −20 m/s en t = 4 s. ¿Cuál es vᵧ a los 3 s?",
    "opciones": [
      "A. 0 m/s",
      "B. +10 m/s",
      "C. −10 m/s",
      "D. −30 m/s"
    ],
    "correcta": "C",
    "explicacion": "La aceleración es a = (−20 − 20) / 4 = −10 m/s². A los 3 s: v = 20 − 10(3) = 20 − 30 = −10 m/s.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Eje vertical -->\n      <line x1=\"80\" y1=\"15\" x2=\"80\" y2=\"205\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <!-- Eje horizontal v=0 -->\n      <line x1=\"40\" y1=\"110\" x2=\"410\" y2=\"110\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"415\" y=\"114\" fill=\"#94a3b8\" font-size=\"12\">t (s)</text>\n      <text x=\"30\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\">vᵧ (m/s)</text>\n      <!-- Marcas eje vertical -->\n      <text x=\"70\" y=\"35\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">20</text>\n      <text x=\"70\" y=\"73\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">10</text>\n      <text x=\"70\" y=\"114\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">0</text>\n      <text x=\"70\" y=\"150\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">-10</text>\n      <text x=\"70\" y=\"188\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">-20</text>\n      <!-- Marcas eje horizontal -->\n      <text x=\"80\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"160\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"240\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"320\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <!-- Línea descendente -->\n      <line x1=\"80\" y1=\"30\" x2=\"400\" y2=\"190\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <circle cx=\"320\" cy=\"150\" r=\"5\" fill=\"#ef4444\"/>\n    </svg>"
  },
  {
    "id": 18,
    "num": "18",
    "tema": "Caída libre",
    "categoria": "calculo",
    "pregunta": "Una pelota se lanza verticalmente hacia arriba a 20 m/s. Usa g = 10 m/s² y desprecia el aire. ¿Qué altura máxima alcanza sobre el punto de lanzamiento?",
    "opciones": [
      "A. 10 m",
      "B. 40 m",
      "C. 20 m",
      "D. 200 m"
    ],
    "correcta": "C",
    "explicacion": "En el punto más alto v = 0. Usando v² = v₀² − 2g·h: 0 = 20² − 2(10)h => 20h = 400 => h = 20 m."
  },
  {
    "id": 19,
    "num": "19",
    "tema": "Tiro parabólico",
    "categoria": "concepto",
    "pregunta": "En un tiro parabólico ideal, sin resistencia del aire y con gravedad uniforme, ¿qué ocurre con la componente horizontal de la velocidad?",
    "opciones": [
      "A. Disminuye uniformemente",
      "B. Se hace cero en el punto más alto",
      "C. Permanece constante",
      "D. Aumenta uniformemente"
    ],
    "correcta": "C",
    "explicacion": "Como no existe ninguna fuerza horizontal actuando sobre el proyectil (aₓ = 0), la componente horizontal vₓ permanece estrictamente constante durante todo el vuelo."
  },
  {
    "id": 20,
    "num": "20",
    "tema": "Tiro parabólico",
    "categoria": "grafica",
    "pregunta": "La figura de la pregunta 20 muestra un proyectil en su punto más alto. Se toma +x hacia la derecha y +y hacia arriba. Sin aire y con g = 10 m/s², ¿cuáles son sus componentes de aceleración?",
    "opciones": [
      "A. aₓ = 0; aᵧ = +10 m/s²",
      "B. aₓ = 0; aᵧ = 0",
      "C. aₓ = 0; aᵧ = −10 m/s²",
      "D. aₓ = +10 m/s²; aᵧ = 0"
    ],
    "correcta": "C",
    "explicacion": "La única aceleración presente durante todo el movimiento es la aceleración de la gravedad, dirigida verticalmente hacia abajo: aₓ = 0 y aᵧ = −g = −10 m/s².",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Ejes guía -->\n      <line x1=\"80\" y1=\"180\" x2=\"120\" y2=\"180\" stroke=\"#64748b\" stroke-width=\"1.5\" marker-end=\"url(#arrow)\"/>\n      <line x1=\"80\" y1=\"180\" x2=\"80\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"1.5\"/>\n      <text x=\"125\" y=\"184\" fill=\"#94a3b8\" font-size=\"11\">+x</text>\n      <text x=\"75\" y=\"132\" fill=\"#94a3b8\" font-size=\"11\">+y</text>\n      <!-- Parábola -->\n      <path d=\"M 60 190 Q 220 20 380 190\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <!-- Punto más alto -->\n      <circle cx=\"220\" cy=\"105\" r=\"6\" fill=\"#ef4444\"/>\n      <text x=\"220\" y=\"90\" fill=\"#f87171\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">Punto más alto</text>\n      <text x=\"350\" y=\"160\" fill=\"#64748b\" font-size=\"11\">Trayectoria</text>\n    </svg>"
  },
  {
    "id": 21,
    "num": "21",
    "tema": "Tiro parabólico",
    "categoria": "calculo",
    "pregunta": "Un proyectil se lanza a 20 m/s con un ángulo θ sobre la horizontal. Si cos θ = 0,8, ¿cuál es su velocidad horizontal inicial?",
    "opciones": [
      "A. 12 m/s",
      "B. 4 m/s",
      "C. 25 m/s",
      "D. 16 m/s"
    ],
    "correcta": "D",
    "explicacion": "La componente horizontal es v₀ₓ = v₀ · cos θ = (20 m/s) × 0.8 = 16 m/s."
  },
  {
    "id": 22,
    "num": "22",
    "tema": "Tiro parabólico",
    "categoria": "concepto",
    "pregunta": "Un proyectil tiene componentes iniciales horizontal y vertical no nulas. Con gravedad uniforme y sin aire, ¿qué forma tiene su trayectoria?",
    "opciones": [
      "A. Parabólica",
      "B. Rectilínea",
      "C. Circular",
      "D. Elíptica"
    ],
    "correcta": "A",
    "explicacion": "Al combinar un movimiento uniforme en x (x ~ t) y un movimiento uniformemente acelerado en y (y ~ t²), la trayectoria eliminando el tiempo t es una curva cuadrática de segundo grado: una parábola."
  },
  {
    "id": 23,
    "num": "23",
    "tema": "Tiro parabólico",
    "categoria": "calculo",
    "pregunta": "Un proyectil tiene v₀ₓ = 12 m/s y v₀ᵧ = 10 m/s. Regresa a la altura de lanzamiento. Sin aire y con g = 10 m/s², ¿cuál es su alcance horizontal?",
    "opciones": [
      "A. 24 m",
      "B. 48 m",
      "C. 12 m",
      "D. 120 m"
    ],
    "correcta": "A",
    "explicacion": "Tiempo de subida: t_sub = v₀ᵧ / g = 10 / 10 = 1 s. Tiempo de vuelo total: t_vuelo = 2 s. Alcance R = v₀ₓ · t_vuelo = 12 × 2 = 24 m."
  },
  {
    "id": 24,
    "num": "24",
    "tema": "Tiro parabólico",
    "categoria": "grafica",
    "pregunta": "En la pregunta 24, los puntos A y B están a la misma altura: A durante el ascenso y B durante el descenso. Sin resistencia del aire, ¿cómo se comparan las rapideces?",
    "opciones": [
      "A. La rapidez en B es mayor",
      "B. La rapidez en A es mayor",
      "C. Ambas son cero",
      "D. Son iguales"
    ],
    "correcta": "D",
    "explicacion": "Por simetría parabólica y conservación de energía mecánica, a la misma altura la energía cinética es la misma, por lo que la rapidez escalar en el ascenso (punto A) y en el descenso (punto B) es exactamente igual.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <path d=\"M 60 190 Q 220 30 380 190\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <!-- Línea misma altura -->\n      <line x1=\"100\" y1=\"120\" x2=\"340\" y2=\"120\" stroke=\"#f59e0b\" stroke-width=\"1.5\" stroke-dasharray=\"4,4\"/>\n      <text x=\"220\" y=\"140\" fill=\"#f59e0b\" font-size=\"11\" text-anchor=\"middle\">Misma altura</text>\n      <!-- Punto A -->\n      <circle cx=\"112\" cy=\"120\" r=\"5\" fill=\"#38bdf8\"/>\n      <text x=\"100\" y=\"110\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\">A</text>\n      <text x=\"80\" y=\"138\" fill=\"#94a3b8\" font-size=\"10\">Ascenso</text>\n      <!-- Punto B -->\n      <circle cx=\"328\" cy=\"120\" r=\"5\" fill=\"#38bdf8\"/>\n      <text x=\"338\" y=\"110\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\">B</text>\n      <text x=\"338\" y=\"138\" fill=\"#94a3b8\" font-size=\"10\">Descenso</text>\n    </svg>"
  },
  {
    "id": 25,
    "num": "25",
    "tema": "Tiro semiparabólico",
    "categoria": "concepto",
    "pregunta": "En el tiro semiparabólico entendido como lanzamiento horizontal desde una altura, ¿cuál es la velocidad vertical inicial?",
    "opciones": [
      "A. Igual a la rapidez total de impacto",
      "B. Igual a la rapidez horizontal inicial",
      "C. Siempre negativa y distinta de cero",
      "D. Cero"
    ],
    "correcta": "D",
    "explicacion": "Al ser un lanzamiento puramente horizontal, no tiene inclinación vertical inicial; por lo tanto, la componente vertical de velocidad al instante de lanzamiento es cero (v₀ᵧ = 0)."
  },
  {
    "id": 26,
    "num": "26",
    "tema": "Tiro semiparabólico",
    "categoria": "calculo",
    "pregunta": "Se lanza horizontalmente una pelota a 4 m/s desde 45 m de altura. Usa g = 10 m/s² y desprecia el aire. ¿Cuánto tarda en llegar al suelo?",
    "opciones": [
      "A. 9 s",
      "B. 4 s",
      "C. 11,25 s",
      "D. 3 s"
    ],
    "correcta": "D",
    "explicacion": "El tiempo de caída depende únicamente del movimiento vertical en caída libre: h = (1/2)gt² => 45 = 5t² => t = 3 s. La velocidad horizontal no modifica el tiempo de vuelo."
  },
  {
    "id": 27,
    "num": "27",
    "tema": "Tiro semiparabólico",
    "categoria": "grafica",
    "pregunta": "La figura de la pregunta 27 muestra un lanzamiento horizontal a 6 m/s desde 20 m de altura. Sin aire y con g = 10 m/s², ¿cuál es el alcance horizontal hasta el suelo?",
    "opciones": [
      "A. 24 m",
      "B. 20 m",
      "C. 12 m",
      "D. 6 m"
    ],
    "correcta": "C",
    "explicacion": "Tiempo de caída: 20 = (1/2)(10)t² => 20 = 5t² => t = 2 s. Alcance R = v₀ₓ · t = 6 m/s × 2 s = 12 m.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Suelo -->\n      <line x1=\"40\" y1=\"180\" x2=\"400\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <!-- Edificio / Altura -->\n      <line x1=\"80\" y1=\"50\" x2=\"80\" y2=\"180\" stroke=\"#fff\" stroke-width=\"3\"/>\n      <!-- Acotación 20 m -->\n      <line x1=\"65\" y1=\"50\" x2=\"65\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n      <text x=\"55\" y=\"115\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\" transform=\"rotate(-90 55 115)\">20 m</text>\n      <!-- Pelota y vector velocidad -->\n      <circle cx=\"80\" cy=\"50\" r=\"5\" fill=\"#ef4444\"/>\n      <line x1=\"80\" y1=\"50\" x2=\"140\" y2=\"50\" stroke=\"#38bdf8\" stroke-width=\"2.5\"/>\n      <polygon points=\"140,46 148,50 140,54\" fill=\"#38bdf8\"/>\n      <text x=\"115\" y=\"42\" fill=\"#38bdf8\" font-size=\"10\">v₀ₓ = 6 m/s</text>\n      <!-- Trayectoria -->\n      <path d=\"M 80 50 Q 200 55 320 180\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"2\" stroke-dasharray=\"4,4\"/>\n      <!-- Alcance R -->\n      <line x1=\"80\" y1=\"195\" x2=\"320\" y2=\"195\" stroke=\"#f59e0b\" stroke-width=\"1.5\"/>\n      <text x=\"200\" y=\"210\" fill=\"#f59e0b\" font-size=\"11\" text-anchor=\"middle\">Alcance R</text>\n      <text x=\"320\" y=\"60\" fill=\"#64748b\" font-size=\"11\">g = 10 m/s²</text>\n    </svg>"
  },
  {
    "id": 28,
    "num": "28",
    "tema": "Tiro semiparabólico",
    "categoria": "concepto",
    "pregunta": "Se lanzan horizontalmente dos pelotas desde la misma altura, una más rápido que la otra. Sin aire, ¿cómo son los tiempos hasta el suelo?",
    "opciones": [
      "A. Menor para la pelota más rápida",
      "B. Mayor para la pelota más rápida",
      "C. Proporcionales a sus rapideces horizontales",
      "D. Iguales para ambas"
    ],
    "correcta": "D",
    "explicacion": "El movimiento vertical está desacoplado del movimiento horizontal (principio de superposición de Galileo). Al soltarse desde la misma altura con velocidad vertical inicial cero, ambas tardan exactamente lo mismo en tocar el piso."
  },
  {
    "id": 29,
    "num": "29",
    "tema": "Tiro semiparabólico",
    "categoria": "calculo",
    "pregunta": "Una pelota se lanza horizontalmente a 15 m/s y permanece en el aire más de 2 s. Con g = 10 m/s² y sin aire, ¿cuál es su rapidez a los 2 s?",
    "opciones": [
      "A. 35 m/s",
      "B. 5 m/s",
      "C. 20 m/s",
      "D. 25 m/s"
    ],
    "correcta": "D",
    "explicacion": "A los 2 s: vₓ = 15 m/s, vᵧ = g·t = 10(2) = 20 m/s. Rapidez total v = √(vₓ² + vᵧ²) = √(15² + 20²) = √(225 + 400) = √625 = 25 m/s."
  },
  {
    "id": 30,
    "num": "30",
    "tema": "Tiro semiparabólico",
    "categoria": "concepto",
    "pregunta": "Después de un lanzamiento horizontal, ¿hacia dónde apunta la aceleración de la pelota si solo actúa la gravedad?",
    "opciones": [
      "A. Verticalmente hacia abajo",
      "B. Tangente a la trayectoria en todo punto",
      "C. Horizontalmente hacia adelante",
      "D. Verticalmente hacia arriba"
    ],
    "correcta": "A",
    "explicacion": "Al actuar únicamente la atracción gravitatoria terrestre, la fuerza neta es el peso y por la 2ª Ley de Newton la aceleración apunta verticalmente hacia abajo en todo instante."
  },
  {
    "id": 31,
    "num": "31",
    "tema": "Primera ley de Newton",
    "categoria": "grafica",
    "pregunta": "La figura de la pregunta 31 representa un carrito que recorre distancias iguales en tiempos iguales sobre una línea recta, respecto a un marco inercial. ¿Cuál es la fuerza neta sobre él?",
    "opciones": [
      "A. Hacia la derecha",
      "B. Cero",
      "C. Hacia la izquierda",
      "D. Vertical hacia arriba"
    ],
    "correcta": "B",
    "explicacion": "Distancias iguales en tiempos iguales sobre una recta significa velocidad constante (MRU). Por la primera ley de Newton, un cuerpo con velocidad constante tiene fuerza neta igual a cero.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <line x1=\"40\" y1=\"160\" x2=\"400\" y2=\"160\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <!-- Carrito 1 en t=0 -->\n      <g transform=\"translate(60, 110)\">\n        <rect width=\"40\" height=\"24\" rx=\"3\" fill=\"#38bdf8\"/>\n        <circle cx=\"10\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <circle cx=\"30\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <text x=\"20\" y=\"-10\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">t = 0 s</text>\n        <text x=\"20\" y=\"48\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">x = 0 m</text>\n      </g>\n      <!-- Carrito 2 en t=1 -->\n      <g transform=\"translate(200, 110)\">\n        <rect width=\"40\" height=\"24\" rx=\"3\" fill=\"#38bdf8\"/>\n        <circle cx=\"10\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <circle cx=\"30\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <text x=\"20\" y=\"-10\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">t = 1 s</text>\n        <text x=\"20\" y=\"48\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">x = 2 m</text>\n      </g>\n      <!-- Carrito 3 en t=2 -->\n      <g transform=\"translate(340, 110)\">\n        <rect width=\"40\" height=\"24\" rx=\"3\" fill=\"#38bdf8\"/>\n        <circle cx=\"10\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <circle cx=\"30\" cy=\"28\" r=\"5\" fill=\"#cbd5e1\"/>\n        <text x=\"20\" y=\"-10\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">t = 2 s</text>\n        <text x=\"20\" y=\"48\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">x = 4 m</text>\n      </g>\n      <text x=\"220\" y=\"195\" fill=\"#64748b\" font-size=\"11\" text-anchor=\"middle\">Posiciones sucesivas del mismo carrito</text>\n    </svg>"
  },
  {
    "id": 32,
    "num": "32",
    "tema": "Primera ley de Newton",
    "categoria": "concepto",
    "pregunta": "¿Qué magnitud mide la inercia de un cuerpo?",
    "opciones": [
      "A. La fuerza neta que actúa sobre él",
      "B. Su aceleración",
      "C. Su masa",
      "D. Su rapidez"
    ],
    "correcta": "C",
    "explicacion": "La masa inercial es la medida cuantitativa de la resistencia que presenta un cuerpo a modificar su estado de reposo o movimiento rectilíneo uniforme."
  },
  {
    "id": 33,
    "num": "33",
    "tema": "Primera ley de Newton",
    "categoria": "concepto",
    "pregunta": "En un marco inercial, un cuerpo en movimiento queda sometido a fuerza neta cero. ¿Qué ocurre con su velocidad?",
    "opciones": [
      "A. Disminuye hasta detenerse",
      "B. Aumenta uniformemente",
      "C. Cambia de dirección continuamente",
      "D. Permanece constante"
    ],
    "correcta": "D",
    "explicacion": "Primera ley de Newton (Ley de Inercia): todo cuerpo persevera en su estado de movimiento rectilíneo y uniforme a menos que sea obligado a cambiar su estado por fuerzas netas aplicadas sobre él."
  },
  {
    "id": 34,
    "num": "34",
    "tema": "Segunda ley de Newton",
    "categoria": "calculo",
    "pregunta": "Un cuerpo de 3 kg tiene una aceleración de 4 m/s² hacia la derecha. ¿Cuál es la fuerza neta?",
    "opciones": [
      "A. 7 N hacia la derecha",
      "B. 12 N hacia la derecha",
      "C. 0,75 N hacia la derecha",
      "D. 12 N hacia la izquierda"
    ],
    "correcta": "B",
    "explicacion": "F_neta = m · a = (3 kg) × (4 m/s² hacia la derecha) = 12 N hacia la derecha."
  },
  {
    "id": 35,
    "num": "35",
    "tema": "Segunda ley de Newton",
    "categoria": "grafica",
    "pregunta": "En la figura de la pregunta 35 actúa una fuerza neta de 8 N sobre cada carrito. A tiene masa 2 kg y B, 4 kg. ¿Cómo se comparan sus aceleraciones?",
    "opciones": [
      "A. aₐ = aᵦ/2",
      "B. aₐ = 4aᵦ",
      "C. aₐ = aᵦ",
      "D. aₐ = 2aᵦ"
    ],
    "correcta": "D",
    "explicacion": "a_A = F / m_A = 8 / 2 = 4 m/s². a_B = F / m_B = 8 / 4 = 2 m/s². Por tanto, a_A = 2 · a_B.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Carrito A -->\n      <g transform=\"translate(90, 80)\">\n        <rect width=\"50\" height=\"28\" rx=\"3\" fill=\"#38bdf8\"/>\n        <circle cx=\"12\" cy=\"34\" r=\"6\" fill=\"#cbd5e1\"/>\n        <circle cx=\"38\" cy=\"34\" r=\"6\" fill=\"#cbd5e1\"/>\n        <text x=\"25\" y=\"-12\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">A: 2 kg</text>\n        <line x1=\"50\" y1=\"14\" x2=\"100\" y2=\"14\" stroke=\"#60a5fa\" stroke-width=\"3\"/>\n        <polygon points=\"100,10 108,14 100,18\" fill=\"#60a5fa\"/>\n        <text x=\"80\" y=\"6\" fill=\"#60a5fa\" font-size=\"11\" font-weight=\"700\">8 N</text>\n      </g>\n      <!-- Carrito B -->\n      <g transform=\"translate(260, 80)\">\n        <rect width=\"50\" height=\"28\" rx=\"3\" fill=\"#818cf8\"/>\n        <circle cx=\"12\" cy=\"34\" r=\"6\" fill=\"#cbd5e1\"/>\n        <circle cx=\"38\" cy=\"34\" r=\"6\" fill=\"#cbd5e1\"/>\n        <text x=\"25\" y=\"-12\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">B: 4 kg</text>\n        <line x1=\"50\" y1=\"14\" x2=\"100\" y2=\"14\" stroke=\"#60a5fa\" stroke-width=\"3\"/>\n        <polygon points=\"100,10 108,14 100,18\" fill=\"#60a5fa\"/>\n        <text x=\"80\" y=\"6\" fill=\"#60a5fa\" font-size=\"11\" font-weight=\"700\">8 N</text>\n      </g>\n      <text x=\"220\" y=\"180\" fill=\"#94a3b8\" font-size=\"12\" text-anchor=\"middle\">Fuerza neta igual en ambos carritos</text>\n    </svg>"
  },
  {
    "id": 36,
    "num": "36",
    "tema": "Segunda ley de Newton",
    "categoria": "calculo",
    "pregunta": "Sobre un objeto de 5 kg actúa una fuerza neta de 15 N. ¿Cuál es la magnitud de su aceleración?",
    "opciones": [
      "A. 10 m/s²",
      "B. 3 m/s²",
      "C. 0,33 m/s²",
      "D. 75 m/s²"
    ],
    "correcta": "B",
    "explicacion": "Por la segunda ley de Newton: a = F_neta / m = 15 N / 5 kg = 3 m/s²."
  },
  {
    "id": 37,
    "num": "37",
    "tema": "Tercera ley de Newton",
    "categoria": "concepto",
    "pregunta": "Las dos fuerzas de un par de acción y reacción, según la tercera ley de Newton, actúan sobre...",
    "opciones": [
      "A. El cuerpo que se mueve solamente",
      "B. Cuerpos distintos",
      "C. El cuerpo de mayor masa solamente",
      "D. El mismo cuerpo"
    ],
    "correcta": "B",
    "explicacion": "Las fuerzas de acción y reacción siempre actúan simultáneamente sobre cuerpos diferentes (A sobre B y B sobre A), por lo cual nunca se anulan entre sí dentro del mismo cuerpo."
  },
  {
    "id": 38,
    "num": "38",
    "tema": "Tercera ley de Newton",
    "categoria": "concepto",
    "pregunta": "Un camión y un automóvil chocan. Durante el contacto, ¿cómo se comparan las fuerzas que se ejercen mutuamente?",
    "opciones": [
      "A. Tienen igual magnitud y sentidos opuestos",
      "B. Solo el vehículo en movimiento ejerce fuerza",
      "C. El automóvil ejerce mayor fuerza",
      "D. El camión ejerce mayor fuerza"
    ],
    "correcta": "A",
    "explicacion": "Por la 3ª Ley de Newton, la fuerza que el camión ejerce sobre el auto es exactamente igual en magnitud y opuesta en sentido a la que el auto ejerce sobre el camión, independientemente de sus masas."
  },
  {
    "id": 39,
    "num": "39",
    "tema": "Tercera ley de Newton",
    "categoria": "grafica",
    "pregunta": "La figura de la pregunta 39 muestra dos patinadores. A ejerce sobre B una fuerza horizontal de 60 N hacia la derecha. ¿Qué fuerza ejerce B sobre A?",
    "opciones": [
      "A. 30 N hacia la izquierda",
      "B. 0 N",
      "C. 60 N hacia la izquierda",
      "D. 60 N hacia la derecha"
    ],
    "correcta": "C",
    "explicacion": "Por la tercera ley de Newton, a toda acción le corresponde una reacción de igual magnitud pero sentido contrario: 60 N hacia la izquierda.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <line x1=\"50\" y1=\"180\" x2=\"390\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <!-- Patinador A -->\n      <g transform=\"translate(130, 80)\">\n        <circle cx=\"10\" cy=\"10\" r=\"10\" fill=\"#38bdf8\"/>\n        <line x1=\"10\" y1=\"20\" x2=\"10\" y2=\"60\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n        <line x1=\"10\" y1=\"60\" x2=\"-5\" y2=\"95\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n        <line x1=\"10\" y1=\"60\" x2=\"25\" y2=\"95\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n        <line x1=\"-15\" y1=\"95\" x2=\"35\" y2=\"95\" stroke=\"#94a3b8\" stroke-width=\"4\"/>\n        <line x1=\"10\" y1=\"35\" x2=\"80\" y2=\"35\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n        <text x=\"10\" y=\"-8\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">A</text>\n      </g>\n      <!-- Patinador B -->\n      <g transform=\"translate(270, 80)\">\n        <circle cx=\"10\" cy=\"10\" r=\"10\" fill=\"#f43f5e\"/>\n        <line x1=\"10\" y1=\"20\" x2=\"10\" y2=\"60\" stroke=\"#f43f5e\" stroke-width=\"3\"/>\n        <line x1=\"10\" y1=\"60\" x2=\"-5\" y2=\"95\" stroke=\"#f43f5e\" stroke-width=\"3\"/>\n        <line x1=\"10\" y1=\"60\" x2=\"25\" y2=\"95\" stroke=\"#f43f5e\" stroke-width=\"3\"/>\n        <line x1=\"-15\" y1=\"95\" x2=\"35\" y2=\"95\" stroke=\"#94a3b8\" stroke-width=\"4\"/>\n        <text x=\"10\" y=\"-8\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">B</text>\n      </g>\n      <!-- Flecha fuerza 60 N -->\n      <line x1=\"285\" y1=\"115\" x2=\"350\" y2=\"115\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <polygon points=\"350,111 358,115 350,119\" fill=\"#38bdf8\"/>\n      <text x=\"315\" y=\"105\" fill=\"#38bdf8\" font-size=\"11\" font-weight=\"700\">60 N sobre B</text>\n      <text x=\"210\" y=\"200\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">A empuja a B</text>\n    </svg>"
  },
  {
    "id": 40,
    "num": "40",
    "tema": "Peso",
    "categoria": "concepto",
    "pregunta": "¿Qué es el peso de un cuerpo cerca de la superficie terrestre?",
    "opciones": [
      "A. La suma de todas las fuerzas sobre él",
      "B. La cantidad de materia del cuerpo",
      "C. La fuerza que cualquier superficie ejerce sobre él",
      "D. La fuerza gravitatoria que la Tierra ejerce sobre él"
    ],
    "correcta": "D",
    "explicacion": "El peso es la fuerza de atracción gravitatoria que ejerce un planeta (la Tierra) sobre la masa de un objeto situado en sus proximidades: P⃗ = m·g⃗."
  },
  {
    "id": 41,
    "num": "41",
    "tema": "Peso",
    "categoria": "calculo",
    "pregunta": "Un objeto tiene masa de 6 kg. En un lugar donde g = 10 m/s², ¿cuál es la magnitud de su peso?",
    "opciones": [
      "A. 6 N",
      "B. 0,6 N",
      "C. 60 N",
      "D. 600 N"
    ],
    "correcta": "C",
    "explicacion": "P = m · g = (6 kg) × (10 m/s²) = 60 N."
  },
  {
    "id": 42,
    "num": "42",
    "tema": "Peso",
    "categoria": "concepto",
    "pregunta": "Un objeto se lleva de un lugar con gravedad mayor a otro con gravedad menor. ¿Qué sucede con su masa y su peso?",
    "opciones": [
      "A. La masa no cambia y el peso disminuye",
      "B. La masa disminuye y el peso no cambia",
      "C. La masa no cambia y el peso aumenta",
      "D. La masa y el peso disminuyen"
    ],
    "correcta": "A",
    "explicacion": "La masa es una propiedad intrínseca de la materia y no cambia con el lugar. El peso depende del campo gravitatorio local (P = m·g), por lo que al disminuir la gravedad, el peso disminuye."
  },
  {
    "id": 43,
    "num": "43",
    "tema": "Peso",
    "categoria": "grafica",
    "pregunta": "La gráfica de la pregunta 43 relaciona el peso P con la masa m. La recta pasa por (2 kg, 20 N) y (4 kg, 40 N). ¿Cuál es la aceleración gravitatoria del lugar?",
    "opciones": [
      "A. 10 m/s²",
      "B. 40 m/s²",
      "C. 20 m/s²",
      "D. 5 m/s²"
    ],
    "correcta": "A",
    "explicacion": "Como P = m · g, la pendiente de la recta P vs m es la aceleración gravitatoria: g = ΔP / Δm = (40 N − 20 N) / (4 kg − 2 kg) = 20 / 2 = 10 m/s².",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <line x1=\"60\" y1=\"180\" x2=\"400\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"60\" y1=\"20\" x2=\"60\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"405\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\">m (kg)</text>\n      <text x=\"25\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\">Peso P (N)</text>\n      <text x=\"60\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"145\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"230\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"315\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <text x=\"50\" y=\"184\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">0</text>\n      <text x=\"50\" y=\"145\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">10</text>\n      <text x=\"50\" y=\"110\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">20</text>\n      <text x=\"50\" y=\"75\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">30</text>\n      <text x=\"50\" y=\"35\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">40</text>\n      <line x1=\"60\" y1=\"180\" x2=\"400\" y2=\"35\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <circle cx=\"230\" cy=\"110\" r=\"5\" fill=\"#ef4444\"/>\n      <circle cx=\"400\" cy=\"35\" r=\"5\" fill=\"#ef4444\"/>\n    </svg>"
  },
  {
    "id": 44,
    "num": "44",
    "tema": "Fuerza normal",
    "categoria": "concepto",
    "pregunta": "¿En qué dirección actúa la fuerza normal que una superficie ejerce sobre un objeto en contacto con ella?",
    "opciones": [
      "A. Siempre vertical hacia arriba",
      "B. Perpendicular a la superficie de contacto",
      "C. Siempre opuesta a la velocidad",
      "D. Siempre paralela a la superficie"
    ],
    "correcta": "B",
    "explicacion": "Por definición geométrica y física, 'normal' significa ortogonal o perpendicular: actúa siempre perpendicular a la superficie de contacto, apuntando hacia el cuerpo."
  },
  {
    "id": 45,
    "num": "45",
    "tema": "Fuerza normal",
    "categoria": "calculo",
    "pregunta": "Un bloque de 8 kg está en reposo sobre una mesa horizontal. Solo actúan su peso y la normal. Si g = 10 m/s², ¿cuál es la normal?",
    "opciones": [
      "A. 160 N",
      "B. 8 N",
      "C. 80 N",
      "D. 0 N"
    ],
    "correcta": "C",
    "explicacion": "En reposo sobre plano horizontal: ΣFᵧ = 0 => N − P = 0 => N = m·g = 8 kg × 10 m/s² = 80 N."
  },
  {
    "id": 46,
    "num": "46",
    "tema": "Fuerza normal",
    "categoria": "grafica",
    "pregunta": "La pregunta 46 muestra un bloque de 10 kg sobre un plano inclinado 60° respecto a la horizontal. Solo actúan peso y normal, sin aceleración perpendicular al plano. Usa g = 10 m/s² y cos 60° = 0,5. ¿Cuánto vale N?",
    "opciones": [
      "A. 200 N",
      "B. 100 N",
      "C. 0 N",
      "D. 50 N"
    ],
    "correcta": "D",
    "explicacion": "En un plano inclinado con ángulo θ, la componente del peso perpendicular a la rampa es m·g·cos θ: N = (10 kg) × (10 m/s²) × cos(60°) = 100 × 0.5 = 50 N.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Plano inclinado 60° -->\n      <polygon points=\"120,180 320,180 120,40\" fill=\"rgba(255,255,255,0.05)\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"170\" y=\"172\" fill=\"#cbd5e1\" font-size=\"11\">60°</text>\n      <!-- Bloque -->\n      <g transform=\"translate(195, 85) rotate(-35)\">\n        <rect width=\"36\" height=\"24\" rx=\"2\" fill=\"#38bdf8\"/>\n        <!-- Vector Normal -->\n        <line x1=\"18\" y1=\"0\" x2=\"18\" y2=\"-45\" stroke=\"#38bdf8\" stroke-width=\"2.5\"/>\n        <polygon points=\"14,-45 18,-52 22,-45\" fill=\"#38bdf8\"/>\n        <text x=\"25\" y=\"-35\" fill=\"#38bdf8\" font-size=\"11\" font-weight=\"700\">N</text>\n        <!-- Vector Peso -->\n        <line x1=\"18\" y1=\"12\" x2=\"45\" y2=\"65\" stroke=\"#f43f5e\" stroke-width=\"2.5\"/>\n        <polygon points=\"41,64 48,70 48,60\" fill=\"#f43f5e\"/>\n        <text x=\"52\" y=\"55\" fill=\"#f43f5e\" font-size=\"11\" font-weight=\"700\">P</text>\n      </g>\n      <text x=\"240\" y=\"45\" fill=\"#cbd5e1\" font-size=\"11\">m = 10 kg</text>\n      <text x=\"240\" y=\"60\" fill=\"#94a3b8\" font-size=\"11\">g = 10 m/s²</text>\n    </svg>"
  },
  {
    "id": 47,
    "num": "47",
    "tema": "Fuerza normal",
    "categoria": "concepto",
    "pregunta": "¿Cuál afirmación sobre la normal N y el peso P es correcta?",
    "opciones": [
      "A. No siempre tienen igual magnitud",
      "B. Siempre tienen igual magnitud",
      "C. La normal siempre es menor que el peso",
      "D. La normal siempre es mayor que el peso"
    ],
    "correcta": "A",
    "explicacion": "La normal depende de las condiciones del sistema: en planos inclinados (N = P·cos θ), en elevadores acelerados o cuando existen fuerzas externas verticales, N y P difieren."
  },
  {
    "id": 48,
    "num": "48",
    "tema": "Fuerza normal",
    "categoria": "calculo",
    "pregunta": "Una persona de 50 kg está de pie en un ascensor que acelera hacia arriba a 2 m/s². Solo actúan peso y normal. Con g = 10 m/s², ¿cuánto vale la normal del piso?",
    "opciones": [
      "A. 100 N",
      "B. 500 N",
      "C. 400 N",
      "D. 600 N"
    ],
    "correcta": "D",
    "explicacion": "Segunda ley: N − P = m·a => N = m(g + a) = (50 kg) × (10 + 2 m/s²) = 50 × 12 = 600 N."
  },
  {
    "id": 49,
    "num": "49",
    "tema": "Fuerza neta",
    "categoria": "concepto",
    "pregunta": "¿Cómo se obtiene la fuerza neta que actúa sobre un cuerpo?",
    "opciones": [
      "A. Sumando vectorialmente todas las fuerzas externas",
      "B. Sumando siempre las magnitudes de las fuerzas",
      "C. Restando siempre el peso de la normal",
      "D. Escogiendo únicamente la fuerza mayor"
    ],
    "correcta": "A",
    "explicacion": "La fuerza neta o resultante es la suma vectorial de todas las fuerzas externas que interactúan sobre el cuerpo: F⃗_neta = Σ F⃗_i."
  },
  {
    "id": 50,
    "num": "50",
    "tema": "Fuerza neta",
    "categoria": "grafica",
    "pregunta": "La figura de la pregunta 50 muestra fuerzas horizontales de 10 N hacia la derecha y 6 N hacia la izquierda sobre un bloque. Las fuerzas verticales se equilibran. ¿Cuál es la fuerza neta?",
    "opciones": [
      "A. 4 N hacia la derecha",
      "B. 16 N hacia la izquierda",
      "C. 16 N hacia la derecha",
      "D. 4 N hacia la izquierda"
    ],
    "correcta": "A",
    "explicacion": "En 1D horizontal: F_neta = +10 N − 6 N = +4 N (hacia la derecha).",
    "graficaSvg": "<svg viewBox=\"0 0 440 200\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"200\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Bloque -->\n      <g transform=\"translate(180, 70)\">\n        <rect width=\"80\" height=\"50\" rx=\"4\" fill=\"#38bdf8\"/>\n        <text x=\"40\" y=\"30\" fill=\"#0f172a\" font-size=\"12\" font-weight=\"700\" text-anchor=\"middle\">Bloque</text>\n      </g>\n      <!-- Fuerza 6 N izquierda -->\n      <line x1=\"180\" y1=\"95\" x2=\"100\" y2=\"95\" stroke=\"#ef4444\" stroke-width=\"3\"/>\n      <polygon points=\"100,91 92,95 100,99\" fill=\"#ef4444\"/>\n      <text x=\"135\" y=\"85\" fill=\"#ef4444\" font-size=\"12\" font-weight=\"700\">6 N</text>\n      <!-- Fuerza 10 N derecha -->\n      <line x1=\"260\" y1=\"95\" x2=\"360\" y2=\"95\" stroke=\"#22c55e\" stroke-width=\"3\"/>\n      <polygon points=\"360,91 368,95 360,99\" fill=\"#22c55e\"/>\n      <text x=\"300\" y=\"85\" fill=\"#22c55e\" font-size=\"12\" font-weight=\"700\">10 N</text>\n      <text x=\"220\" y=\"160\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">Las fuerzas verticales se equilibran</text>\n    </svg>"
  },
  {
    "id": 51,
    "num": "51",
    "tema": "Fuerza neta",
    "categoria": "calculo",
    "pregunta": "Las componentes de la fuerza neta sobre un cuerpo son Fₓ = 6 N y Fᵧ = 8 N. ¿Cuál es su magnitud?",
    "opciones": [
      "A. 14 N",
      "B. 2 N",
      "C. 10 N",
      "D. 48 N"
    ],
    "correcta": "C",
    "explicacion": "Magnitud por teorema de Pitágoras: |F⃗| = √(Fₓ² + Fᵧ²) = √(6² + 8²) = √(36 + 64) = √100 = 10 N."
  },
  {
    "id": 52,
    "num": "52",
    "tema": "Fuerza neta",
    "categoria": "concepto",
    "pregunta": "En un marco inercial, la fuerza neta sobre un cuerpo es cero. ¿Cuál afirmación es necesariamente verdadera?",
    "opciones": [
      "A. No actúa ninguna fuerza sobre él",
      "B. Su aceleración es cero",
      "C. Su velocidad es cero",
      "D. Su posición es cero"
    ],
    "correcta": "B",
    "explicacion": "F_neta = m · a = 0 implica estrictamente que su aceleración es cero. El cuerpo puede encontrarse en reposo o moviéndose a velocidad constante distinta de cero."
  },
  {
    "id": 53,
    "num": "53",
    "tema": "Fuerza neta",
    "categoria": "calculo",
    "pregunta": "Un bloque de 2 kg recibe una fuerza de 9 N hacia la derecha y otra de 4 N hacia la izquierda. Las fuerzas verticales se equilibran. ¿Cuál es su aceleración?",
    "opciones": [
      "A. 2,5 m/s² hacia la izquierda",
      "B. 2,5 m/s² hacia la derecha",
      "C. 5 m/s² hacia la derecha",
      "D. 6,5 m/s² hacia la derecha"
    ],
    "correcta": "B",
    "explicacion": "Fuerza neta = 9 N − 4 N = 5 N hacia la derecha. Aceleración a = F_neta / m = 5 N / 2 kg = 2.5 m/s² hacia la derecha."
  },
  {
    "id": 54,
    "num": "54",
    "tema": "Fuerza neta",
    "categoria": "grafica",
    "pregunta": "La gráfica de la pregunta 54 muestra Fnet,x = +3 N entre 0 y 2 s, y +6 N entre 2 y 4 s. Para un cuerpo de 3 kg, ¿cuál es aₓ en t = 3 s?",
    "opciones": [
      "A. +3 m/s²",
      "B. +6 m/s²",
      "C. +2 m/s²",
      "D. +1 m/s²"
    ],
    "correcta": "C",
    "explicacion": "En t = 3 s, la gráfica indica que la fuerza neta es F = 6 N. Por la 2ª ley: a = F / m = 6 N / 3 kg = +2 m/s².",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <line x1=\"60\" y1=\"180\" x2=\"400\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <line x1=\"60\" y1=\"20\" x2=\"60\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n      <text x=\"405\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\">t (s)</text>\n      <text x=\"20\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\">Fnet,x (N)</text>\n      <text x=\"60\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n      <text x=\"145\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">1</text>\n      <text x=\"230\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">2</text>\n      <text x=\"315\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">3</text>\n      <text x=\"400\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">4</text>\n      <text x=\"50\" y=\"125\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">3</text>\n      <text x=\"50\" y=\"65\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"end\">6</text>\n      <!-- Escalón -->\n      <line x1=\"60\" y1=\"120\" x2=\"230\" y2=\"120\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n      <line x1=\"230\" y1=\"120\" x2=\"230\" y2=\"60\" stroke=\"#38bdf8\" stroke-width=\"2\" stroke-dasharray=\"3,3\"/>\n      <line x1=\"230\" y1=\"60\" x2=\"400\" y2=\"60\" stroke=\"#38bdf8\" stroke-width=\"3\"/>\n    </svg>"
  },
  {
    "id": 55,
    "num": "55",
    "tema": "Movimiento circular",
    "categoria": "concepto",
    "pregunta": "En un movimiento circular uniforme, ¿qué permanece constante y qué cambia?",
    "opciones": [
      "A. La rapidez permanece constante y cambia la dirección de la velocidad",
      "B. La aceleración es cero",
      "C. El radio cambia continuamente",
      "D. La velocidad vectorial permanece constante"
    ],
    "correcta": "A",
    "explicacion": "En el MCU el valor escalar (rapidez) es fijo, pero el vector velocidad cambia continuamente de dirección en cada punto de la curva, produciendo la aceleración centrípeta."
  },
  {
    "id": 56,
    "num": "56",
    "tema": "Movimiento circular",
    "categoria": "calculo",
    "pregunta": "Un objeto completa 5 vueltas en 10 s con movimiento circular uniforme. ¿Cuál es su período?",
    "opciones": [
      "A. 2 s",
      "B. 5 s",
      "C. 0,5 s",
      "D. 50 s"
    ],
    "correcta": "A",
    "explicacion": "El período T es el tiempo necesario para dar una vuelta completa: T = tiempo total / número de vueltas = 10 s / 5 = 2 s."
  },
  {
    "id": 57,
    "num": "57",
    "tema": "Movimiento circular",
    "categoria": "concepto",
    "pregunta": "¿Cuál expresión relaciona la aceleración centrípeta a_c con la rapidez v y el radio r?",
    "opciones": [
      "A. a_c = r/v²",
      "B. a_c = v²/r",
      "C. a_c = v/r²",
      "D. a_c = vr"
    ],
    "correcta": "B",
    "explicacion": "La aceleración centrípeta requerida para mantener una trayectoria circular de radio r a rapidez v es a_c = v² / r = ω² · r."
  },
  {
    "id": 58,
    "num": "58",
    "tema": "Movimiento circular",
    "categoria": "grafica",
    "pregunta": "En la figura de la pregunta 58, una partícula está en el extremo derecho de una circunferencia y se mueve en sentido antihorario. ¿Hacia dónde apuntan su velocidad y su aceleración centrípeta?",
    "opciones": [
      "A. Velocidad hacia arriba; aceleración hacia la izquierda",
      "B. Velocidad hacia la izquierda; aceleración hacia arriba",
      "C. Velocidad hacia abajo; aceleración hacia la izquierda",
      "D. Velocidad hacia arriba; aceleración hacia la derecha"
    ],
    "correcta": "A",
    "explicacion": "En el punto más a la derecha (r, 0) con giro antihorario, el vector velocidad es tangente a la trayectoria apuntando hacia arriba (+y), mientras que la aceleración centrípeta apunta radialmente hacia el centro de giro (hacia la izquierda, −x).",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n      <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n      <!-- Circunferencia -->\n      <circle cx=\"210\" cy=\"110\" r=\"60\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"2.5\"/>\n      <circle cx=\"210\" cy=\"110\" r=\"3\" fill=\"#94a3b8\"/>\n      <text x=\"200\" y=\"125\" fill=\"#94a3b8\" font-size=\"11\">O</text>\n      <!-- Punto P en extremo derecho -->\n      <circle cx=\"270\" cy=\"110\" r=\"5\" fill=\"#ef4444\"/>\n      <text x=\"285\" y=\"115\" fill=\"#fff\" font-size=\"12\" font-weight=\"700\">P</text>\n      <!-- Flecha de giro antihorario arriba -->\n      <path d=\"M 190 40 A 65 65 0 0 0 240 40\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n      <polygon points=\"190,37 182,40 190,44\" fill=\"#94a3b8\"/>\n      <text x=\"150\" y=\"32\" fill=\"#94a3b8\" font-size=\"11\">Giro antihorario</text>\n    </svg>"
  },
  {
    "id": 59,
    "num": "59",
    "tema": "Movimiento circular",
    "categoria": "calculo",
    "pregunta": "Una partícula se mueve con rapidez de 4 m/s en una circunferencia de radio 2 m. ¿Cuál es la magnitud de su aceleración centrípeta?",
    "opciones": [
      "A. 8 m/s²",
      "B. 16 m/s²",
      "C. 4 m/s²",
      "D. 2 m/s²"
    ],
    "correcta": "A",
    "explicacion": "a_c = v² / r = (4 m/s)² / (2 m) = 16 / 2 = 8 m/s²."
  },
  {
    "id": 60,
    "num": "60",
    "tema": "Movimiento circular",
    "categoria": "calculo",
    "pregunta": "Un cuerpo de 2 kg se mueve con rapidez constante de 3 m/s en una circunferencia de radio 3 m. ¿Cuál es la fuerza neta sobre él?",
    "opciones": [
      "A. 18 N tangentes a la trayectoria",
      "B. 6 N hacia el centro",
      "C. 2 N hacia el centro",
      "D. 6 N hacia afuera"
    ],
    "correcta": "B",
    "explicacion": "La fuerza neta es la fuerza centrípeta dirigida hacia el centro: F_c = m · (v² / r) = 2 kg × (3² / 3) = 2 × 3 = 6 N hacia el centro."
  },
  {
    "id": 61,
    "num": "61",
    "tema": "Ley de Gauss",
    "categoria": "concepto",
    "pregunta": "Una superficie gaussiana esférica cerrada encierra una carga puntual positiva +q en su centro. Si el radio de la esfera se duplica de R a 2R manteniendo la misma carga en su interior, ¿qué sucede con el flujo eléctrico neto total Φ_E a través de la superficie?",
    "opciones": [
      "A. Se reduce a la cuarta parte (Φ_E / 4) por la ley del inverso al cuadrado",
      "B. Se reduce a la mitad (Φ_E / 2)",
      "C. Permanece exactamente igual (Φ_E constante)",
      "D. Se cuadruplica (4Φ_E) porque el área superficial se cuadruplica"
    ],
    "correcta": "C",
    "explicacion": "De acuerdo con la Ley de Gauss: Φ_E = ∮ E · dA = Q_enc / ε₀. El flujo neto total a través de cualquier superficie cerrada depende exclusivamente de la magnitud de la carga neta encerrada. Aunque al duplicar el radio el área se cuadruplica (A ∝ r²), la magnitud del campo eléctrico se reduce a la cuarta parte (E ∝ 1/r²), compensándose de forma exacta. Por tanto, el flujo total permanece inalterado."
  },
  {
    "id": 62,
    "num": "62",
    "tema": "Ley de Gauss y Conductores",
    "categoria": "calculo",
    "pregunta": "Una esfera conductora sólida en equilibrio electrostático tiene un radio R = 10 cm y posee una carga neta total de +4 μC. ¿Cuál es la magnitud del campo eléctrico E en un punto ubicado en el interior de la esfera a r = 5 cm del centro?",
    "opciones": [
      "A. 0 N/C",
      "B. 1,44 × 10⁷ N/C radial hacia afuera",
      "C. 3,60 × 10⁶ N/C radial hacia adentro",
      "D. 7,20 × 10⁶ N/C radial hacia afuera"
    ],
    "correcta": "A",
    "explicacion": "En un conductor en equilibrio electrostático, las cargas libres se repelen mutuamente y residen exclusivamente sobre la superficie exterior. Al aplicar la Ley de Gauss a una superficie esférica concéntrica de radio r = 5 cm (r < R), la carga neta encerrada es Q_enc = 0. En consecuencia, el campo eléctrico en el interior de cualquier conductor en equilibrio electrostático es estrictamente cero (E = 0 N/C)."
  },
  {
    "id": 63,
    "num": "63",
    "tema": "Ley de Gauss",
    "categoria": "grafica",
    "pregunta": "Un cilindro largo no conductor de radio R posee una densidad volumétrica de carga uniforme ρ. ¿Cuál de las siguientes afirmaciones describe con precisión el comportamiento de la magnitud del campo eléctrico E(r) en función de la distancia radial r desde el eje?",
    "opciones": [
      "A. Crece linealmente con r en el interior (r ≤ R) y decae proporcionalmente a 1/r en el exterior (r > R)",
      "B. Es uniforme y constante en el interior (r ≤ R) y decae como 1/r² en el exterior (r > R)",
      "C. Es nulo en el interior (r ≤ R) y crece como r² en el exterior (r > R)",
      "D. Decae como 1/r² tanto en la región interior como exterior"
    ],
    "correcta": "A",
    "explicacion": "Aplicando la Ley de Gauss con una superficie cilíndrica de radio r y longitud L:\n• Para r ≤ R (interior): Q_enc = ρ·(π r² L) ⟹ E·(2π r L) = ρ·(π r² L)/ε₀ ⟹ E(r) = (ρ / 2ε₀)·r (crecimiento lineal directo con r).\n• Para r > R (exterior): Q_enc = ρ·(π R² L) ⟹ E·(2π r L) = ρ·(π R² L)/ε₀ ⟹ E(r) = (ρ R² / 2ε₀)·(1/r) (decae como 1/r).",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n  <defs>\n    <pattern id=\"grid_em63\" width=\"40\" height=\"30\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 40 0 L 0 0 0 30\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"1\"/>\n    </pattern>\n  </defs>\n  <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n  <rect x=\"50\" y=\"20\" width=\"350\" height=\"160\" fill=\"url(#grid_em63)\"/>\n  <!-- Ejes -->\n  <line x1=\"50\" y1=\"180\" x2=\"410\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n  <line x1=\"50\" y1=\"20\" x2=\"50\" y2=\"180\" stroke=\"#94a3b8\" stroke-width=\"2\"/>\n  <text x=\"415\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">r</text>\n  <text x=\"20\" y=\"25\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">E(r)</text>\n  <!-- Radio R -->\n  <line x1=\"180\" y1=\"20\" x2=\"180\" y2=\"180\" stroke=\"#f59e0b\" stroke-dasharray=\"4\" stroke-width=\"1.5\"/>\n  <text x=\"180\" y=\"196\" fill=\"#f59e0b\" font-size=\"12\" font-weight=\"bold\" text-anchor=\"middle\">r = R</text>\n  <text x=\"50\" y=\"196\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">0</text>\n  <!-- Curva E(r): Lineal de 0 a R, y luego decae como 1/r -->\n  <path d=\"M 50 180 L 180 50 Q 240 115 400 155\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n  <circle cx=\"180\" cy=\"50\" r=\"5\" fill=\"#38bdf8\"/>\n  <!-- Etiquetas -->\n  <text x=\"100\" y=\"105\" fill=\"#38bdf8\" font-size=\"11\" font-weight=\"bold\">E ∝ r</text>\n  <text x=\"270\" y=\"105\" fill=\"#38bdf8\" font-size=\"11\" font-weight=\"bold\">E ∝ 1/r</text>\n  <text x=\"110\" y=\"165\" fill=\"#94a3b8\" font-size=\"10\">Interior (r ≤ R)</text>\n  <text x=\"290\" y=\"165\" fill=\"#94a3b8\" font-size=\"10\">Exterior (r > R)</text>\n</svg>"
  },
  {
    "id": 64,
    "num": "64",
    "tema": "Potencial Eléctrico",
    "categoria": "concepto",
    "pregunta": "Si una partícula con carga negativa q = −2 μC se traslada a lo largo de una línea de campo eléctrico uniforme en el mismo sentido del vector E (desde un punto A hacia un punto B), ¿cómo cambian el potencial eléctrico V y la energía potencial electrostática U?",
    "opciones": [
      "A. El potencial eléctrico V aumenta y la energía potencial U disminuye",
      "B. El potencial eléctrico V disminuye y la energía potencial U aumenta",
      "C. Tanto el potencial eléctrico V como la energía potencial U disminuyen",
      "D. El potencial eléctrico V aumenta y la energía potencial U aumenta"
    ],
    "correcta": "B",
    "explicacion": "Las líneas de campo eléctrico apuntan siempre en el sentido en que el potencial eléctrico disminuye (V_B < V_A). Por lo tanto, al moverse en el sentido de E, el potencial eléctrico V disminuye (ΔV < 0). El cambio en la energía potencial es ΔU = q·ΔV. Como la carga es negativa (q < 0) y ΔV < 0, el producto es positivo (ΔU > 0), lo que significa que la energía potencial electrostática aumenta (se requiere trabajo externo para forzar una carga negativa a desplazarse en la dirección del campo)."
  },
  {
    "id": 65,
    "num": "65",
    "tema": "Potencial Eléctrico",
    "categoria": "grafica",
    "pregunta": "En una región del plano xy se observan líneas equipotenciales paralelas como se muestra en la gráfica: V = 10 V en x = 0 cm, V = 20 V en x = 2 cm, y V = 30 V en x = 4 cm. ¿Cuál es el vector campo eléctrico E en dicha región?",
    "opciones": [
      "A. E = +500 î V/m",
      "B. E = −500 î V/m",
      "C. E = −5 ĵ V/m",
      "D. E = +250 î V/m"
    ],
    "correcta": "B",
    "explicacion": "El campo eléctrico es el gradiente negativo del potencial eléctrico: E_x = −(dV / dx). La tasa de cambio del potencial en el eje x es ΔV / Δx = (30 V − 10 V) / (0.04 m − 0 m) = 20 / 0.04 = +500 V/m. Aplicando el signo negativo del gradiente se obtiene E_x = −500 V/m, por lo que el vector es E = −500 î V/m. Físicamente, el campo eléctrico siempre apunta hacia donde el potencial disminuye (hacia la izquierda o sentido negativo de x).",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n  <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n  <line x1=\"40\" y1=\"180\" x2=\"410\" y2=\"180\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"415\" y=\"184\" fill=\"#94a3b8\" font-size=\"12\" font-family=\"sans-serif\">x (cm)</text>\n  <!-- 0 cm -> 10V -->\n  <line x1=\"80\" y1=\"30\" x2=\"80\" y2=\"180\" stroke=\"#38bdf8\" stroke-dasharray=\"5,4\" stroke-width=\"2\"/>\n  <text x=\"80\" y=\"198\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">0 cm</text>\n  <rect x=\"52\" y=\"18\" width=\"56\" height=\"20\" fill=\"#0369a1\" rx=\"4\"/>\n  <text x=\"80\" y=\"32\" fill=\"#fff\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">V = 10 V</text>\n  <!-- 2 cm -> 20V -->\n  <line x1=\"220\" y1=\"30\" x2=\"220\" y2=\"180\" stroke=\"#38bdf8\" stroke-dasharray=\"5,4\" stroke-width=\"2\"/>\n  <text x=\"220\" y=\"198\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">2 cm</text>\n  <rect x=\"192\" y=\"18\" width=\"56\" height=\"20\" fill=\"#0284c7\" rx=\"4\"/>\n  <text x=\"220\" y=\"32\" fill=\"#fff\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">V = 20 V</text>\n  <!-- 4 cm -> 30V -->\n  <line x1=\"360\" y1=\"30\" x2=\"360\" y2=\"180\" stroke=\"#38bdf8\" stroke-dasharray=\"5,4\" stroke-width=\"2\"/>\n  <text x=\"360\" y=\"198\" fill=\"#94a3b8\" font-size=\"11\" text-anchor=\"middle\">4 cm</text>\n  <rect x=\"332\" y=\"18\" width=\"56\" height=\"20\" fill=\"#0ea5e9\" rx=\"4\"/>\n  <text x=\"360\" y=\"32\" fill=\"#fff\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">V = 30 V</text>\n  <!-- Flecha de campo E -->\n  <line x1=\"320\" y1=\"100\" x2=\"120\" y2=\"100\" stroke=\"#f43f5e\" stroke-width=\"3\"/>\n  <polygon points=\"120,95 105,100 120,105\" fill=\"#f43f5e\"/>\n  <text x=\"210\" y=\"88\" fill=\"#f43f5e\" font-size=\"13\" font-weight=\"bold\" text-anchor=\"middle\">Vector Campo Eléctrico E (?)</text>\n  <text x=\"210\" y=\"130\" fill=\"#cbd5e1\" font-size=\"11\" text-anchor=\"middle\">ΔV/Δx = +500 V/m ➔ E = −(dV/dx)î</text>\n</svg>"
  },
  {
    "id": 66,
    "num": "66",
    "tema": "Potencial Eléctrico",
    "categoria": "calculo",
    "pregunta": "Dos cargas puntuales q₁ = +6 nC y q₂ = −6 nC forman un dipolo eléctrico separadas por una distancia d = 20 cm en el vacío. ¿Cuál es el potencial eléctrico total V en el punto medio exacto de la línea que une ambas cargas?",
    "opciones": [
      "A. 540 V",
      "B. 1080 V",
      "C. 0 V",
      "D. −540 V"
    ],
    "correcta": "C",
    "explicacion": "El potencial eléctrico es una cantidad escalar y cumple el principio de superposición: V_total = V₁ + V₂ = k·(q₁ / r₁) + k·(q₂ / r₂). En el punto medio, las distancias a ambas cargas son iguales: r₁ = r₂ = 10 cm = 0.10 m. Dado que q₁ = +6 nC y q₂ = −6 nC: V = (k / 0.10) × (+6×10⁻⁹ − 6×10⁻⁹) = 0 V."
  },
  {
    "id": 67,
    "num": "67",
    "tema": "Capacitores",
    "categoria": "calculo",
    "pregunta": "Un capacitor de placas paralelas posee un área A = 0,02 m² y una separación entre placas d = 1,0 mm con aire/vacío entre ellas (ε₀ = 8,85 × 10⁻¹² C²/N·m²). Si se conecta a una fuente de tensión de 100 V, ¿cuál es su capacitancia C y la carga eléctrica Q almacenada?",
    "opciones": [
      "A. C = 177 pF y Q = 17,7 nC",
      "B. C = 354 pF y Q = 3,54 nC",
      "C. C = 17,7 pF y Q = 1,77 nC",
      "D. C = 88,5 pF y Q = 88,5 nC"
    ],
    "correcta": "A",
    "explicacion": "1. Capacitancia: C = ε₀·A / d = (8.85 × 10⁻¹² C²/N·m² × 0.02 m²) / (1.0 × 10⁻³ m) = 1.77 × 10⁻¹⁰ F = 177 pF.\n2. Carga almacenada: Q = C·V = (177 × 10⁻¹² F) × 100 V = 1.77 × 10⁻⁸ C = 17.7 nC."
  },
  {
    "id": 68,
    "num": "68",
    "tema": "Capacitores y Dieléctricos",
    "categoria": "concepto",
    "pregunta": "Un capacitor de placas paralelas se carga con una batería hasta un voltaje V₀ y luego se desconecta de ella. Posteriormente, se introduce un material dieléctrico de constante κ = 3,0 llenando todo el espacio entre placas. ¿Qué sucede con la capacitancia C, el voltaje V y la energía almacenada U?",
    "opciones": [
      "A. C se triplica (3C₀), V se reduce a V₀/3 y U se reduce a U₀/3",
      "B. C se triplica (3C₀), V permanece constante y U se triplica (3U₀)",
      "C. C se reduce a C₀/3, V se triplica y U se triplica",
      "D. C, V y U se triplican simultáneamente"
    ],
    "correcta": "A",
    "explicacion": "Al estar desconectado de la batería, la carga Q₀ permanece estrictamente constante por conservación de la carga. Al insertar el dieléctrico:\n1) La capacitancia aumenta: C = κ·C₀ = 3C₀.\n2) El voltaje entre placas disminuye: V = Q₀ / C = Q₀ / (3C₀) = V₀ / 3.\n3) La energía electrostática almacenada: U = Q₀² / (2C) = Q₀² / (2·3C₀) = U₀ / 3. La energía disminuye porque el campo eléctrico realiza trabajo positivo atrayendo el dieléctrico hacia el interior de las placas."
  },
  {
    "id": 69,
    "num": "69",
    "tema": "Circuitos de Capacitores",
    "categoria": "grafica",
    "pregunta": "En el circuito de la gráfica, dos capacitores de C₁ = 6 μF y C₂ = 12 μF están conectados en serie, y esa combinación se encuentra en paralelo con un tercer capacitor C₃ = 4 μF. ¿Cuál es la capacitancia equivalente total C_eq entre los terminales A y B?",
    "opciones": [
      "A. 22 μF",
      "B. 8 μF",
      "C. 1,71 μF",
      "D. 10 μF"
    ],
    "correcta": "B",
    "explicacion": "1. Capacitores en serie (C₁ y C₂):\n1 / C₁₂ = (1 / 6) + (1 / 12) = (2 + 1) / 12 = 3 / 12 = 1 / 4 ⟹ C₁₂ = 4 μF.\n2. Conexión en paralelo de C₁₂ con C₃:\nC_eq = C₁₂ + C₃ = 4 μF + 4 μF = 8 μF.",
    "graficaSvg": "<svg viewBox=\"0 0 440 220\" class=\"quiz-svg\">\n  <rect width=\"440\" height=\"220\" fill=\"#0f172a\" rx=\"8\"/>\n  <circle cx=\"50\" cy=\"110\" r=\"6\" fill=\"#38bdf8\"/>\n  <text x=\"50\" y=\"90\" fill=\"#38bdf8\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">A</text>\n  <circle cx=\"390\" cy=\"110\" r=\"6\" fill=\"#38bdf8\"/>\n  <text x=\"390\" y=\"90\" fill=\"#38bdf8\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">B</text>\n  <line x1=\"50\" y1=\"110\" x2=\"90\" y2=\"110\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"90\" y1=\"60\" x2=\"90\" y2=\"160\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <!-- Rama superior: C1 y C2 en serie -->\n  <line x1=\"90\" y1=\"60\" x2=\"160\" y2=\"60\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"160\" y1=\"45\" x2=\"160\" y2=\"75\" stroke=\"#f59e0b\" stroke-width=\"3\"/>\n  <line x1=\"172\" y1=\"45\" x2=\"172\" y2=\"75\" stroke=\"#f59e0b\" stroke-width=\"3\"/>\n  <text x=\"166\" y=\"35\" fill=\"#f59e0b\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">C₁ = 6 μF</text>\n  <line x1=\"172\" y1=\"60\" x2=\"260\" y2=\"60\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"260\" y1=\"45\" x2=\"260\" y2=\"75\" stroke=\"#f59e0b\" stroke-width=\"3\"/>\n  <line x1=\"272\" y1=\"45\" x2=\"272\" y2=\"75\" stroke=\"#f59e0b\" stroke-width=\"3\"/>\n  <text x=\"266\" y=\"35\" fill=\"#f59e0b\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">C₂ = 12 μF</text>\n  <line x1=\"272\" y1=\"60\" x2=\"350\" y2=\"60\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <!-- Rama inferior: C3 en paralelo -->\n  <line x1=\"90\" y1=\"160\" x2=\"210\" y2=\"160\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"210\" y1=\"145\" x2=\"210\" y2=\"175\" stroke=\"#10b981\" stroke-width=\"3\"/>\n  <line x1=\"222\" y1=\"145\" x2=\"222\" y2=\"175\" stroke=\"#10b981\" stroke-width=\"3\"/>\n  <text x=\"216\" y=\"195\" fill=\"#10b981\" font-size=\"11\" font-weight=\"bold\" text-anchor=\"middle\">C₃ = 4 μF</text>\n  <line x1=\"222\" y1=\"160\" x2=\"350\" y2=\"160\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"350\" y1=\"60\" x2=\"350\" y2=\"160\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <line x1=\"350\" y1=\"110\" x2=\"390\" y2=\"110\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n  <circle cx=\"90\" cy=\"110\" r=\"3.5\" fill=\"#fff\"/>\n  <circle cx=\"350\" cy=\"110\" r=\"3.5\" fill=\"#fff\"/>\n</svg>"
  },
  {
    "id": 70,
    "num": "70",
    "tema": "Capacitores y Energía",
    "categoria": "calculo",
    "pregunta": "Un desfibrilador médico hospitalario utiliza un capacitor de 32 μF cargado a una diferencia de potencial de 5000 V. ¿Cuánta energía electrostática total U almacena dicho capacitor antes de la descarga?",
    "opciones": [
      "A. 400 J",
      "B. 800 J",
      "C. 160 J",
      "D. 2500 J"
    ],
    "correcta": "A",
    "explicacion": "La energía electrostática almacenada en un capacitor es: U = ½ · C · V² = ½ × (32 × 10⁻⁶ F) × (5000 V)² = 16 × 10⁻⁶ × (2,5 × 10⁷) = 400 J. Esta energía corresponde a los niveles de descarga terapéutica utilizados en desfibrilación ventricular de emergencia."
  }
],
  presets: [
    {
      id: "electromagnetismo-10",
      code: "ELECTRO-10",
      aliases: ["ELECTRO-10", "ELECTRO", "GAUSS-10", "CAPACITORES", "POTENCIAL", "EM-10"],
      title: "Electromagnetismo: Gauss, Potencial y Capacitores",
      subtitle: "10 Preguntas · Ley de Gauss, Superficies Equipotenciales y Circuitos Capacitivos",
      description: "Evaluación oficial universitaria sobre flujo eléctrico, Ley de Gauss, potencial electrostático y capacitores con dieléctricos. Elaborado por Mg. Manuel Alejandro Obando.",
      badge: "⚡ Electromagnetismo",
      totalPreguntas: 10,
      tiempoSugeridoMin: 15,
      questionIds: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70]
    },
    {
      id: "quiz-completo",
      code: "FISICA-60",
      aliases: ["FISICA-60", "NEWTON-2026", "6060", "CINEMATICA-DINAMICA", "OBANDO-QUIZ-26"],
      title: "Cinemática y Dinámica: Banco Completo",
      subtitle: "60 Preguntas · 24 Concepto, 20 Cálculo, 16 Gráficas",
      description: "Cuestionario universitario completo oficial del Mg. Manuel Alejandro Obando (Universidad del Cauca). Cubre todas las unidades de cinemática y leyes de Newton.",
      badge: "🏆 Examen Completo",
      totalPreguntas: 60,
      tiempoSugeridoMin: 72,
      questionIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60]
    },
    {
      id: "quiz-cinematica",
      code: "CINEMATICA-15",
      aliases: ["CINEMATICA-15", "CINEMATICA", "VELOCIDAD", "MRU-MRUA", "1515"],
      title: "Desafío Express: Cinemática",
      subtitle: "15 Preguntas Seleccionadas (MRU, MRUA, Caída Libre y Tiro)",
      description: "Enfocado exclusivamente en movimiento rectilíneo uniforme, acelerado, caída libre, tiro parabólico y semiparabólico.",
      badge: "🚀 Cinemática",
      totalPreguntas: 15,
      tiempoSugeridoMin: 20,
      questionIds: [1, 3, 4, 6, 7, 8, 10, 11, 13, 15, 17, 20, 23, 27, 29]
    },
    {
      id: "quiz-dinamica",
      code: "DINAMICA-15",
      aliases: ["DINAMICA-15", "DINAMICA", "NEWTON", "FUERZA", "3030"],
      title: "Reto: Dinámica & Leyes de Newton",
      subtitle: "15 Preguntas Seleccionadas (Leyes de Newton, Peso, Normal y Circular)",
      description: "Evaluación especializada en las 3 leyes de Newton, pares de acción-reacción, diagramas de fuerzas, planos inclinados y aceleración centrípeta.",
      badge: "⚡ Dinámica",
      totalPreguntas: 15,
      tiempoSugeridoMin: 20,
      questionIds: [31, 32, 34, 35, 37, 39, 41, 43, 45, 46, 48, 50, 53, 58, 60]
    },
    {
      id: "quiz-express",
      code: "EXPRESS-10",
      aliases: ["EXPRESS-10", "EXPRESS", "RAPIDO", "1010"],
      title: "Desafío Rápido de 10 Preguntas",
      subtitle: "10 Preguntas Mixtas de Concepto, Cálculo y Gráfica",
      description: "Ideal para un calentamiento rápido antes de clase o repasar conceptos clave en 10 minutos.",
      badge: "⏱️ Modo Rápido",
      totalPreguntas: 10,
      tiempoSugeridoMin: 12,
      questionIds: [2, 4, 7, 14, 18, 26, 33, 41, 51, 58]
    }
  ]
};
