// Generador automático de banco de preguntas de Cinemática y Dinámica
// 60 preguntas oficiales extraídas del cuestionario universitario
const fs = require('fs');
const path = require('path');

const questions = [
  // 01-06: Movimiento rectilíneo uniforme (MRU)
  {
    id: 1,
    num: "01",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "concepto",
    pregunta: "¿Qué caracteriza al movimiento rectilíneo uniforme (MRU)?",
    opciones: [
      "A. Rapidez creciente y aceleración constante",
      "B. Velocidad constante y aceleración nula",
      "C. Trayectoria curva y rapidez constante",
      "D. Velocidad constante y aceleración no nula"
    ],
    correcta: "B",
    explicacion: "En el MRU la velocidad es constante tanto en magnitud (rapidez) como en dirección y sentido; por definición, al no haber cambio en la velocidad, la aceleración es estrictamente nula (a = 0)."
  },
  {
    id: 2,
    num: "02",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "concepto",
    pregunta: "Un móvil realiza MRU sobre el eje x. ¿Qué ecuación describe su posición si en t = 0 está en x₀?",
    opciones: [
      "A. x = x₀ + vₓt²",
      "B. x = vₓ/t",
      "C. x = x₀ + vₓ/t",
      "D. x = x₀ + vₓt"
    ],
    correcta: "D",
    explicacion: "La ecuación horaria de posición para un movimiento con velocidad constante vₓ partiendo de la posición inicial x₀ en t = 0 es x(t) = x₀ + vₓt."
  },
  {
    id: 3,
    num: "03",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "calculo",
    pregunta: "Un automóvil se mueve a 72 km/h. ¿A cuántos metros por segundo equivale esa rapidez?",
    opciones: [
      "A. 36 m/s",
      "B. 10 m/s",
      "C. 72 m/s",
      "D. 20 m/s"
    ],
    correcta: "D",
    explicacion: "Para convertir de km/h a m/s se divide entre 3.6 (o se multiplica por 1000/3600): 72 / 3.6 = 20 m/s."
  },
  {
    id: 4,
    num: "04",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "grafica",
    pregunta: "La gráfica x(t) de la pregunta 04 es una recta que va de x = 2 m en t = 0 s a x = 14 m en t = 4 s. ¿Cuál es la velocidad?",
    opciones: [
      "A. −3 m/s",
      "B. +3 m/s",
      "C. +12 m/s",
      "D. +4 m/s"
    ],
    correcta: "B",
    explicacion: "La velocidad en una gráfica x-t corresponde a la pendiente de la recta: v = Δx / Δt = (14 m − 2 m) / (4 s − 0 s) = 12 / 4 = +3 m/s.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <defs>
        <pattern id="grid4" width="40" height="30" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <rect x="50" y="20" width="350" height="160" fill="url(#grid4)"/>
      <!-- Ejes -->
      <line x1="50" y1="180" x2="410" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="50" y1="20" x2="50" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="415" y="184" fill="#94a3b8" font-size="12" font-family="sans-serif">t (s)</text>
      <text x="25" y="25" fill="#94a3b8" font-size="12" font-family="sans-serif">x (m)</text>
      <!-- Marcas eje t -->
      <text x="50" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="137" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="225" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="312" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <!-- Marcas eje x -->
      <text x="42" y="160" fill="#cbd5e1" font-size="11" text-anchor="end">2</text>
      <text x="42" y="125" fill="#cbd5e1" font-size="11" text-anchor="end">5</text>
      <text x="42" y="90" fill="#cbd5e1" font-size="11" text-anchor="end">8</text>
      <text x="42" y="55" fill="#cbd5e1" font-size="11" text-anchor="end">11</text>
      <text x="42" y="32" fill="#cbd5e1" font-size="11" text-anchor="end">14</text>
      <!-- Línea x(t) -->
      <line x1="50" y1="157" x2="400" y2="30" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="157" r="5" fill="#38bdf8"/>
      <circle cx="400" cy="30" r="5" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 5,
    num: "05",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "concepto",
    pregunta: "Un móvil tiene velocidad constante vₓ = −5 m/s. ¿Qué indica el signo negativo?",
    opciones: [
      "A. La distancia recorrida es negativa",
      "B. Se mueve en el sentido negativo del eje x",
      "C. Su aceleración es negativa necesariamente",
      "D. Su rapidez disminuye necesariamente"
    ],
    correcta: "B",
    explicacion: "El signo de la componente escalar de velocidad en 1D indica el sentido del desplazamiento a lo largo del eje coordenado; un signo negativo significa que se desplaza hacia la izquierda o en sentido negativo de x."
  },
  {
    id: 6,
    num: "06",
    tema: "Movimiento rectilíneo uniforme",
    categoria: "calculo",
    pregunta: "Una bicicleta avanza en línea recta con rapidez constante de 6 m/s durante 15 s. ¿Qué distancia recorre?",
    opciones: [
      "A. 90 m",
      "B. 2,5 m",
      "C. 21 m",
      "D. 40 m"
    ],
    correcta: "A",
    explicacion: "En movimiento con rapidez constante: distancia d = v · t = (6 m/s) × (15 s) = 90 m."
  },

  // 07-12: Movimiento rectilíneo acelerado (MRUA)
  {
    id: 7,
    num: "07",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "grafica",
    pregunta: "La gráfica vₓ(t) de la pregunta 07 aumenta linealmente de 2 m/s a 10 m/s en 4 s. ¿Cuál es la aceleración?",
    opciones: [
      "A. +3 m/s²",
      "B. +2 m/s²",
      "C. +8 m/s²",
      "D. −2 m/s²"
    ],
    correcta: "B",
    explicacion: "La aceleración es la pendiente de la gráfica v-t: a = Δv / Δt = (10 − 2) / (4 − 0) = 8 / 4 = +2 m/s².",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <defs>
        <pattern id="grid7" width="40" height="30" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <rect x="50" y="20" width="350" height="160" fill="url(#grid7)"/>
      <line x1="50" y1="180" x2="410" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="50" y1="20" x2="50" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="415" y="184" fill="#94a3b8" font-size="12" font-family="sans-serif">t (s)</text>
      <text x="20" y="25" fill="#94a3b8" font-size="12" font-family="sans-serif">vₓ (m/s)</text>
      <text x="50" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="137" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="225" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="312" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <text x="42" y="150" fill="#cbd5e1" font-size="11" text-anchor="end">2</text>
      <text x="42" y="115" fill="#cbd5e1" font-size="11" text-anchor="end">4</text>
      <text x="42" y="85" fill="#cbd5e1" font-size="11" text-anchor="end">6</text>
      <text x="42" y="55" fill="#cbd5e1" font-size="11" text-anchor="end">8</text>
      <text x="42" y="30" fill="#cbd5e1" font-size="11" text-anchor="end">10</text>
      <line x1="50" y1="148" x2="400" y2="28" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="148" r="5" fill="#38bdf8"/>
      <circle cx="400" cy="28" r="5" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 8,
    num: "08",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "concepto",
    pregunta: "En un movimiento rectilíneo, vₓ > 0 y aₓ < 0 durante cierto intervalo. ¿Qué ocurre con la rapidez en ese intervalo?",
    opciones: [
      "A. Permanece constante",
      "B. Es necesariamente cero",
      "C. Disminuye",
      "D. Aumenta"
    ],
    correcta: "C",
    explicacion: "Cuando la velocidad y la aceleración tienen signos algebraicos opuestos, el vector aceleración se opone al movimiento, haciendo que la magnitud de la velocidad (rapidez) disminuya (frenado)."
  },
  {
    id: 9,
    num: "09",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "calculo",
    pregunta: "Un móvil parte del reposo y tiene aceleración constante de +2 m/s². ¿Cuál es su velocidad a los 5 s?",
    opciones: [
      "A. +7 m/s",
      "B. +25 m/s",
      "C. +10 m/s",
      "D. +2,5 m/s"
    ],
    correcta: "C",
    explicacion: "Al partir del reposo (v₀ = 0): v = v₀ + a · t = 0 + (2 m/s²) × (5 s) = +10 m/s."
  },
  {
    id: 10,
    num: "10",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "grafica",
    pregunta: "La gráfica vₓ(t) de la pregunta 10 sube linealmente desde 0 hasta 8 m/s entre t = 0 y 6 s. ¿Cuál es el desplazamiento en ese intervalo?",
    opciones: [
      "A. 24 m",
      "B. 8 m",
      "C. 48 m",
      "D. 12 m"
    ],
    correcta: "A",
    explicacion: "El desplazamiento en una gráfica v-t es el área geométrica bajo la curva. Como es un triángulo: Área = (Base × Altura) / 2 = (6 s × 8 m/s) / 2 = 48 / 2 = 24 m.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <defs>
        <pattern id="grid10" width="40" height="30" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <rect x="50" y="20" width="350" height="160" fill="url(#grid10)"/>
      <!-- Sombra triangular -->
      <polygon points="50,180 400,30 400,180" fill="rgba(56,189,248,0.18)"/>
      <line x1="50" y1="180" x2="410" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="50" y1="20" x2="50" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="415" y="184" fill="#94a3b8" font-size="12" font-family="sans-serif">t (s)</text>
      <text x="20" y="25" fill="#94a3b8" font-size="12" font-family="sans-serif">vₓ (m/s)</text>
      <text x="50" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="166" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="283" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">6</text>
      <text x="42" y="145" fill="#cbd5e1" font-size="11" text-anchor="end">2</text>
      <text x="42" y="110" fill="#cbd5e1" font-size="11" text-anchor="end">4</text>
      <text x="42" y="75" fill="#cbd5e1" font-size="11" text-anchor="end">6</text>
      <text x="42" y="35" fill="#cbd5e1" font-size="11" text-anchor="end">8</text>
      <line x1="50" y1="180" x2="400" y2="30" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="50" cy="180" r="4" fill="#38bdf8"/>
      <circle cx="400" cy="30" r="5" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 11,
    num: "11",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "calculo",
    pregunta: "Un automóvil lleva v₀ₓ = +10 m/s y frena con aₓ = −2,5 m/s² constante. ¿Qué distancia recorre hasta detenerse?",
    opciones: [
      "A. 40 m",
      "B. 20 m",
      "C. 25 m",
      "D. 4 m"
    ],
    correcta: "B",
    explicacion: "Usando v² = v₀² + 2a·d. Al detenerse v = 0: 0 = 10² + 2(−2.5)·d  => 0 = 100 − 5d  => 5d = 100  => d = 20 m."
  },
  {
    id: 12,
    num: "12",
    tema: "Movimiento rectilíneo acelerado",
    categoria: "concepto",
    pregunta: "¿Cómo se define la aceleración media en un intervalo de tiempo Δt?",
    opciones: [
      "A. a⃗media = v⃗final × Δt",
      "B. amedia = distancia / Δt",
      "C. amedia = rapidez final / distancia",
      "D. a⃗media = Δv⃗ / Δt"
    ],
    correcta: "D",
    explicacion: "La aceleración media es por definición vectorial el cociente entre el cambio de velocidad (vectorial) y el intervalo de tiempo transcurrido: a⃗_media = Δv⃗ / Δt."
  },

  // 13-18: Caída libre y lanzamiento vertical
  {
    id: 13,
    num: "13",
    tema: "Caída libre",
    categoria: "grafica",
    pregunta: "La gráfica y(t) de la pregunta 13 muestra un objeto soltado desde 80 m: a los 2 s está a 60 m. ¿Qué distancia ha caído en esos 2 s?",
    opciones: [
      "A. 80 m",
      "B. 60 m",
      "C. 20 m",
      "D. 40 m"
    ],
    correcta: "C",
    explicacion: "La distancia caída es la diferencia de alturas: Δy = y_inicial − y_actual = 80 m − 60 m = 20 m.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <line x1="60" y1="180" x2="400" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="20" x2="60" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="405" y="184" fill="#94a3b8" font-size="12">t (s)</text>
      <text x="25" y="25" fill="#94a3b8" font-size="12">Altura y (m)</text>
      <text x="60" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="145" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="230" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="315" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <text x="50" y="184" fill="#cbd5e1" font-size="11" text-anchor="end">0</text>
      <text x="50" y="145" fill="#cbd5e1" font-size="11" text-anchor="end">20</text>
      <text x="50" y="110" fill="#cbd5e1" font-size="11" text-anchor="end">40</text>
      <text x="50" y="75" fill="#cbd5e1" font-size="11" text-anchor="end">60</text>
      <text x="50" y="35" fill="#cbd5e1" font-size="11" text-anchor="end">80</text>
      <!-- Parábola y = 80 - 5t^2 -->
      <path d="M 60 35 Q 200 45 230 75 T 400 180" fill="none" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="60" cy="35" r="5" fill="#ef4444"/>
      <circle cx="230" cy="75" r="5" fill="#ef4444"/>
      <circle cx="400" cy="180" r="5" fill="#ef4444"/>
    </svg>`
  },
  {
    id: 14,
    num: "14",
    tema: "Caída libre",
    categoria: "concepto",
    pregunta: "Dos objetos de distinta masa se sueltan simultáneamente desde la misma altura, sin resistencia del aire. ¿Qué ocurre?",
    opciones: [
      "A. El tiempo depende del peso de cada uno",
      "B. Llegan al suelo al mismo tiempo",
      "C. Llega primero el de menor masa",
      "D. Llega primero el de mayor masa"
    ],
    correcta: "B",
    explicacion: "En el vacío o despreciando el aire, todos los cuerpos aceleran con la misma aceleración gravitatoria g independientemente de su masa, por lo que tardan exactamente el mismo tiempo en caer."
  },
  {
    id: 15,
    num: "15",
    tema: "Caída libre",
    categoria: "calculo",
    pregunta: "Se deja caer un objeto desde el reposo a 45 m del suelo. Usa g = 10 m/s² y desprecia el aire. ¿Cuánto tarda en llegar al suelo?",
    opciones: [
      "A. 4,5 s",
      "B. 1,5 s",
      "C. 3 s",
      "D. 9 s"
    ],
    correcta: "C",
    explicacion: "h = (1/2)gt² => 45 = 0.5 × 10 × t² => 45 = 5t² => t² = 9 => t = 3 s."
  },
  {
    id: 16,
    num: "16",
    tema: "Caída libre",
    categoria: "concepto",
    pregunta: "Una pelota se lanza verticalmente hacia arriba. En el punto más alto, sin resistencia del aire, ¿cuáles son su velocidad y su aceleración?",
    opciones: [
      "A. Velocidad hacia arriba y aceleración cero",
      "B. Velocidad cero y aceleración hacia arriba",
      "C. Velocidad cero y aceleración cero",
      "D. Velocidad cero y aceleración hacia abajo"
    ],
    correcta: "D",
    explicacion: "En el punto más alto la velocidad instantánea se anula (v = 0), pero la gravedad sigue actuando constantemente con aceleración g hacia abajo."
  },
  {
    id: 17,
    num: "17",
    tema: "Caída libre",
    categoria: "grafica",
    pregunta: "En la gráfica vᵧ(t) de la pregunta 17 se toma +y hacia arriba. La velocidad pasa de +20 m/s en t = 0 a −20 m/s en t = 4 s. ¿Cuál es vᵧ a los 3 s?",
    opciones: [
      "A. 0 m/s",
      "B. +10 m/s",
      "C. −10 m/s",
      "D. −30 m/s"
    ],
    correcta: "C",
    explicacion: "La aceleración es a = (−20 − 20) / 4 = −10 m/s². A los 3 s: v = 20 − 10(3) = 20 − 30 = −10 m/s.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Eje vertical -->
      <line x1="80" y1="15" x2="80" y2="205" stroke="#94a3b8" stroke-width="2"/>
      <!-- Eje horizontal v=0 -->
      <line x1="40" y1="110" x2="410" y2="110" stroke="#94a3b8" stroke-width="2"/>
      <text x="415" y="114" fill="#94a3b8" font-size="12">t (s)</text>
      <text x="30" y="25" fill="#94a3b8" font-size="12">vᵧ (m/s)</text>
      <!-- Marcas eje vertical -->
      <text x="70" y="35" fill="#cbd5e1" font-size="11" text-anchor="end">20</text>
      <text x="70" y="73" fill="#cbd5e1" font-size="11" text-anchor="end">10</text>
      <text x="70" y="114" fill="#cbd5e1" font-size="11" text-anchor="end">0</text>
      <text x="70" y="150" fill="#cbd5e1" font-size="11" text-anchor="end">-10</text>
      <text x="70" y="188" fill="#cbd5e1" font-size="11" text-anchor="end">-20</text>
      <!-- Marcas eje horizontal -->
      <text x="80" y="125" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="160" y="125" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="240" y="125" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="320" y="125" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="125" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <!-- Línea descendente -->
      <line x1="80" y1="30" x2="400" y2="190" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="320" cy="150" r="5" fill="#ef4444"/>
    </svg>`
  },
  {
    id: 18,
    num: "18",
    tema: "Caída libre",
    categoria: "calculo",
    pregunta: "Una pelota se lanza verticalmente hacia arriba a 20 m/s. Usa g = 10 m/s² y desprecia el aire. ¿Qué altura máxima alcanza sobre el punto de lanzamiento?",
    opciones: [
      "A. 10 m",
      "B. 40 m",
      "C. 20 m",
      "D. 200 m"
    ],
    correcta: "C",
    explicacion: "En el punto más alto v = 0. Usando v² = v₀² − 2g·h: 0 = 20² − 2(10)h => 20h = 400 => h = 20 m."
  },

  // 19-24: Tiro parabólico
  {
    id: 19,
    num: "19",
    tema: "Tiro parabólico",
    categoria: "concepto",
    pregunta: "En un tiro parabólico ideal, sin resistencia del aire y con gravedad uniforme, ¿qué ocurre con la componente horizontal de la velocidad?",
    opciones: [
      "A. Disminuye uniformemente",
      "B. Se hace cero en el punto más alto",
      "C. Permanece constante",
      "D. Aumenta uniformemente"
    ],
    correcta: "C",
    explicacion: "Como no existe ninguna fuerza horizontal actuando sobre el proyectil (aₓ = 0), la componente horizontal vₓ permanece estrictamente constante durante todo el vuelo."
  },
  {
    id: 20,
    num: "20",
    tema: "Tiro parabólico",
    categoria: "grafica",
    pregunta: "La figura de la pregunta 20 muestra un proyectil en su punto más alto. Se toma +x hacia la derecha y +y hacia arriba. Sin aire y con g = 10 m/s², ¿cuáles son sus componentes de aceleración?",
    opciones: [
      "A. aₓ = 0; aᵧ = +10 m/s²",
      "B. aₓ = 0; aᵧ = 0",
      "C. aₓ = 0; aᵧ = −10 m/s²",
      "D. aₓ = +10 m/s²; aᵧ = 0"
    ],
    correcta: "C",
    explicacion: "La única aceleración presente durante todo el movimiento es la aceleración de la gravedad, dirigida verticalmente hacia abajo: aₓ = 0 y aᵧ = −g = −10 m/s².",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Ejes guía -->
      <line x1="80" y1="180" x2="120" y2="180" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
      <line x1="80" y1="180" x2="80" y2="140" stroke="#64748b" stroke-width="1.5"/>
      <text x="125" y="184" fill="#94a3b8" font-size="11">+x</text>
      <text x="75" y="132" fill="#94a3b8" font-size="11">+y</text>
      <!-- Parábola -->
      <path d="M 60 190 Q 220 20 380 190" fill="none" stroke="#38bdf8" stroke-width="3"/>
      <!-- Punto más alto -->
      <circle cx="220" cy="105" r="6" fill="#ef4444"/>
      <text x="220" y="90" fill="#f87171" font-size="12" font-weight="700" text-anchor="middle">Punto más alto</text>
      <text x="350" y="160" fill="#64748b" font-size="11">Trayectoria</text>
    </svg>`
  },
  {
    id: 21,
    num: "21",
    tema: "Tiro parabólico",
    categoria: "calculo",
    pregunta: "Un proyectil se lanza a 20 m/s con un ángulo θ sobre la horizontal. Si cos θ = 0,8, ¿cuál es su velocidad horizontal inicial?",
    opciones: [
      "A. 12 m/s",
      "B. 4 m/s",
      "C. 25 m/s",
      "D. 16 m/s"
    ],
    correcta: "D",
    explicacion: "La componente horizontal es v₀ₓ = v₀ · cos θ = (20 m/s) × 0.8 = 16 m/s."
  },
  {
    id: 22,
    num: "22",
    tema: "Tiro parabólico",
    categoria: "concepto",
    pregunta: "Un proyectil tiene componentes iniciales horizontal y vertical no nulas. Con gravedad uniforme y sin aire, ¿qué forma tiene su trayectoria?",
    opciones: [
      "A. Parabólica",
      "B. Rectilínea",
      "C. Circular",
      "D. Elíptica"
    ],
    correcta: "A",
    explicacion: "Al combinar un movimiento uniforme en x (x ~ t) y un movimiento uniformemente acelerado en y (y ~ t²), la trayectoria eliminando el tiempo t es una curva cuadrática de segundo grado: una parábola."
  },
  {
    id: 23,
    num: "23",
    tema: "Tiro parabólico",
    categoria: "calculo",
    pregunta: "Un proyectil tiene v₀ₓ = 12 m/s y v₀ᵧ = 10 m/s. Regresa a la altura de lanzamiento. Sin aire y con g = 10 m/s², ¿cuál es su alcance horizontal?",
    opciones: [
      "A. 24 m",
      "B. 48 m",
      "C. 12 m",
      "D. 120 m"
    ],
    correcta: "A",
    explicacion: "Tiempo de subida: t_sub = v₀ᵧ / g = 10 / 10 = 1 s. Tiempo de vuelo total: t_vuelo = 2 s. Alcance R = v₀ₓ · t_vuelo = 12 × 2 = 24 m."
  },
  {
    id: 24,
    num: "24",
    tema: "Tiro parabólico",
    categoria: "grafica",
    pregunta: "En la pregunta 24, los puntos A y B están a la misma altura: A durante el ascenso y B durante el descenso. Sin resistencia del aire, ¿cómo se comparan las rapideces?",
    opciones: [
      "A. La rapidez en B es mayor",
      "B. La rapidez en A es mayor",
      "C. Ambas son cero",
      "D. Son iguales"
    ],
    correcta: "D",
    explicacion: "Por simetría parabólica y conservación de energía mecánica, a la misma altura la energía cinética es la misma, por lo que la rapidez escalar en el ascenso (punto A) y en el descenso (punto B) es exactamente igual.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <path d="M 60 190 Q 220 30 380 190" fill="none" stroke="#38bdf8" stroke-width="3"/>
      <!-- Línea misma altura -->
      <line x1="100" y1="120" x2="340" y2="120" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4"/>
      <text x="220" y="140" fill="#f59e0b" font-size="11" text-anchor="middle">Misma altura</text>
      <!-- Punto A -->
      <circle cx="112" cy="120" r="5" fill="#38bdf8"/>
      <text x="100" y="110" fill="#fff" font-size="12" font-weight="700">A</text>
      <text x="80" y="138" fill="#94a3b8" font-size="10">Ascenso</text>
      <!-- Punto B -->
      <circle cx="328" cy="120" r="5" fill="#38bdf8"/>
      <text x="338" y="110" fill="#fff" font-size="12" font-weight="700">B</text>
      <text x="338" y="138" fill="#94a3b8" font-size="10">Descenso</text>
    </svg>`
  },

  // 25-30: Tiro semiparabólico
  {
    id: 25,
    num: "25",
    tema: "Tiro semiparabólico",
    categoria: "concepto",
    pregunta: "En el tiro semiparabólico entendido como lanzamiento horizontal desde una altura, ¿cuál es la velocidad vertical inicial?",
    opciones: [
      "A. Igual a la rapidez total de impacto",
      "B. Igual a la rapidez horizontal inicial",
      "C. Siempre negativa y distinta de cero",
      "D. Cero"
    ],
    correcta: "D",
    explicacion: "Al ser un lanzamiento puramente horizontal, no tiene inclinación vertical inicial; por lo tanto, la componente vertical de velocidad al instante de lanzamiento es cero (v₀ᵧ = 0)."
  },
  {
    id: 26,
    num: "26",
    tema: "Tiro semiparabólico",
    categoria: "calculo",
    pregunta: "Se lanza horizontalmente una pelota a 4 m/s desde 45 m de altura. Usa g = 10 m/s² y desprecia el aire. ¿Cuánto tarda en llegar al suelo?",
    opciones: [
      "A. 9 s",
      "B. 4 s",
      "C. 11,25 s",
      "D. 3 s"
    ],
    correcta: "D",
    explicacion: "El tiempo de caída depende únicamente del movimiento vertical en caída libre: h = (1/2)gt² => 45 = 5t² => t = 3 s. La velocidad horizontal no modifica el tiempo de vuelo."
  },
  {
    id: 27,
    num: "27",
    tema: "Tiro semiparabólico",
    categoria: "grafica",
    pregunta: "La figura de la pregunta 27 muestra un lanzamiento horizontal a 6 m/s desde 20 m de altura. Sin aire y con g = 10 m/s², ¿cuál es el alcance horizontal hasta el suelo?",
    opciones: [
      "A. 24 m",
      "B. 20 m",
      "C. 12 m",
      "D. 6 m"
    ],
    correcta: "C",
    explicacion: "Tiempo de caída: 20 = (1/2)(10)t² => 20 = 5t² => t = 2 s. Alcance R = v₀ₓ · t = 6 m/s × 2 s = 12 m.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Suelo -->
      <line x1="40" y1="180" x2="400" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <!-- Edificio / Altura -->
      <line x1="80" y1="50" x2="80" y2="180" stroke="#fff" stroke-width="3"/>
      <!-- Acotación 20 m -->
      <line x1="65" y1="50" x2="65" y2="180" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="55" y="115" fill="#94a3b8" font-size="11" text-anchor="middle" transform="rotate(-90 55 115)">20 m</text>
      <!-- Pelota y vector velocidad -->
      <circle cx="80" cy="50" r="5" fill="#ef4444"/>
      <line x1="80" y1="50" x2="140" y2="50" stroke="#38bdf8" stroke-width="2.5"/>
      <polygon points="140,46 148,50 140,54" fill="#38bdf8"/>
      <text x="115" y="42" fill="#38bdf8" font-size="10">v₀ₓ = 6 m/s</text>
      <!-- Trayectoria -->
      <path d="M 80 50 Q 200 55 320 180" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,4"/>
      <!-- Alcance R -->
      <line x1="80" y1="195" x2="320" y2="195" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="200" y="210" fill="#f59e0b" font-size="11" text-anchor="middle">Alcance R</text>
      <text x="320" y="60" fill="#64748b" font-size="11">g = 10 m/s²</text>
    </svg>`
  },
  {
    id: 28,
    num: "28",
    tema: "Tiro semiparabólico",
    categoria: "concepto",
    pregunta: "Se lanzan horizontalmente dos pelotas desde la misma altura, una más rápido que la otra. Sin aire, ¿cómo son los tiempos hasta el suelo?",
    opciones: [
      "A. Menor para la pelota más rápida",
      "B. Mayor para la pelota más rápida",
      "C. Proporcionales a sus rapideces horizontales",
      "D. Iguales para ambas"
    ],
    correcta: "D",
    explicacion: "El movimiento vertical está desacoplado del movimiento horizontal (principio de superposición de Galileo). Al soltarse desde la misma altura con velocidad vertical inicial cero, ambas tardan exactamente lo mismo en tocar el piso."
  },
  {
    id: 29,
    num: "29",
    tema: "Tiro semiparabólico",
    categoria: "calculo",
    pregunta: "Una pelota se lanza horizontalmente a 15 m/s y permanece en el aire más de 2 s. Con g = 10 m/s² y sin aire, ¿cuál es su rapidez a los 2 s?",
    opciones: [
      "A. 35 m/s",
      "B. 5 m/s",
      "C. 20 m/s",
      "D. 25 m/s"
    ],
    correcta: "D",
    explicacion: "A los 2 s: vₓ = 15 m/s, vᵧ = g·t = 10(2) = 20 m/s. Rapidez total v = √(vₓ² + vᵧ²) = √(15² + 20²) = √(225 + 400) = √625 = 25 m/s."
  },
  {
    id: 30,
    num: "30",
    tema: "Tiro semiparabólico",
    categoria: "concepto",
    pregunta: "Después de un lanzamiento horizontal, ¿hacia dónde apunta la aceleración de la pelota si solo actúa la gravedad?",
    opciones: [
      "A. Verticalmente hacia abajo",
      "B. Tangente a la trayectoria en todo punto",
      "C. Horizontalmente hacia adelante",
      "D. Verticalmente hacia arriba"
    ],
    correcta: "A",
    explicacion: "Al actuar únicamente la atracción gravitatoria terrestre, la fuerza neta es el peso y por la 2ª Ley de Newton la aceleración apunta verticalmente hacia abajo en todo instante."
  },

  // 31-39: Tres leyes de Newton
  {
    id: 31,
    num: "31",
    tema: "Primera ley de Newton",
    categoria: "grafica",
    pregunta: "La figura de la pregunta 31 representa un carrito que recorre distancias iguales en tiempos iguales sobre una línea recta, respecto a un marco inercial. ¿Cuál es la fuerza neta sobre él?",
    opciones: [
      "A. Hacia la derecha",
      "B. Cero",
      "C. Hacia la izquierda",
      "D. Vertical hacia arriba"
    ],
    correcta: "B",
    explicacion: "Distancias iguales en tiempos iguales sobre una recta significa velocidad constante (MRU). Por la primera ley de Newton, un cuerpo con velocidad constante tiene fuerza neta igual a cero.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <line x1="40" y1="160" x2="400" y2="160" stroke="#94a3b8" stroke-width="2"/>
      <!-- Carrito 1 en t=0 -->
      <g transform="translate(60, 110)">
        <rect width="40" height="24" rx="3" fill="#38bdf8"/>
        <circle cx="10" cy="28" r="5" fill="#cbd5e1"/>
        <circle cx="30" cy="28" r="5" fill="#cbd5e1"/>
        <text x="20" y="-10" fill="#94a3b8" font-size="11" text-anchor="middle">t = 0 s</text>
        <text x="20" y="48" fill="#cbd5e1" font-size="11" text-anchor="middle">x = 0 m</text>
      </g>
      <!-- Carrito 2 en t=1 -->
      <g transform="translate(200, 110)">
        <rect width="40" height="24" rx="3" fill="#38bdf8"/>
        <circle cx="10" cy="28" r="5" fill="#cbd5e1"/>
        <circle cx="30" cy="28" r="5" fill="#cbd5e1"/>
        <text x="20" y="-10" fill="#94a3b8" font-size="11" text-anchor="middle">t = 1 s</text>
        <text x="20" y="48" fill="#cbd5e1" font-size="11" text-anchor="middle">x = 2 m</text>
      </g>
      <!-- Carrito 3 en t=2 -->
      <g transform="translate(340, 110)">
        <rect width="40" height="24" rx="3" fill="#38bdf8"/>
        <circle cx="10" cy="28" r="5" fill="#cbd5e1"/>
        <circle cx="30" cy="28" r="5" fill="#cbd5e1"/>
        <text x="20" y="-10" fill="#94a3b8" font-size="11" text-anchor="middle">t = 2 s</text>
        <text x="20" y="48" fill="#cbd5e1" font-size="11" text-anchor="middle">x = 4 m</text>
      </g>
      <text x="220" y="195" fill="#64748b" font-size="11" text-anchor="middle">Posiciones sucesivas del mismo carrito</text>
    </svg>`
  },
  {
    id: 32,
    num: "32",
    tema: "Primera ley de Newton",
    categoria: "concepto",
    pregunta: "¿Qué magnitud mide la inercia de un cuerpo?",
    opciones: [
      "A. La fuerza neta que actúa sobre él",
      "B. Su aceleración",
      "C. Su masa",
      "D. Su rapidez"
    ],
    correcta: "C",
    explicacion: "La masa inercial es la medida cuantitativa de la resistencia que presenta un cuerpo a modificar su estado de reposo o movimiento rectilíneo uniforme."
  },
  {
    id: 33,
    num: "33",
    tema: "Primera ley de Newton",
    categoria: "concepto",
    pregunta: "En un marco inercial, un cuerpo en movimiento queda sometido a fuerza neta cero. ¿Qué ocurre con su velocidad?",
    opciones: [
      "A. Disminuye hasta detenerse",
      "B. Aumenta uniformemente",
      "C. Cambia de dirección continuamente",
      "D. Permanece constante"
    ],
    correcta: "D",
    explicacion: "Primera ley de Newton (Ley de Inercia): todo cuerpo persevera en su estado de movimiento rectilíneo y uniforme a menos que sea obligado a cambiar su estado por fuerzas netas aplicadas sobre él."
  },
  {
    id: 34,
    num: "34",
    tema: "Segunda ley de Newton",
    categoria: "calculo",
    pregunta: "Un cuerpo de 3 kg tiene una aceleración de 4 m/s² hacia la derecha. ¿Cuál es la fuerza neta?",
    opciones: [
      "A. 7 N hacia la derecha",
      "B. 12 N hacia la derecha",
      "C. 0,75 N hacia la derecha",
      "D. 12 N hacia la izquierda"
    ],
    correcta: "B",
    explicacion: "F_neta = m · a = (3 kg) × (4 m/s² hacia la derecha) = 12 N hacia la derecha."
  },
  {
    id: 35,
    num: "35",
    tema: "Segunda ley de Newton",
    categoria: "grafica",
    pregunta: "En la figura de la pregunta 35 actúa una fuerza neta de 8 N sobre cada carrito. A tiene masa 2 kg y B, 4 kg. ¿Cómo se comparan sus aceleraciones?",
    opciones: [
      "A. aₐ = aᵦ/2",
      "B. aₐ = 4aᵦ",
      "C. aₐ = aᵦ",
      "D. aₐ = 2aᵦ"
    ],
    correcta: "D",
    explicacion: "a_A = F / m_A = 8 / 2 = 4 m/s². a_B = F / m_B = 8 / 4 = 2 m/s². Por tanto, a_A = 2 · a_B.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Carrito A -->
      <g transform="translate(90, 80)">
        <rect width="50" height="28" rx="3" fill="#38bdf8"/>
        <circle cx="12" cy="34" r="6" fill="#cbd5e1"/>
        <circle cx="38" cy="34" r="6" fill="#cbd5e1"/>
        <text x="25" y="-12" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">A: 2 kg</text>
        <line x1="50" y1="14" x2="100" y2="14" stroke="#60a5fa" stroke-width="3"/>
        <polygon points="100,10 108,14 100,18" fill="#60a5fa"/>
        <text x="80" y="6" fill="#60a5fa" font-size="11" font-weight="700">8 N</text>
      </g>
      <!-- Carrito B -->
      <g transform="translate(260, 80)">
        <rect width="50" height="28" rx="3" fill="#818cf8"/>
        <circle cx="12" cy="34" r="6" fill="#cbd5e1"/>
        <circle cx="38" cy="34" r="6" fill="#cbd5e1"/>
        <text x="25" y="-12" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">B: 4 kg</text>
        <line x1="50" y1="14" x2="100" y2="14" stroke="#60a5fa" stroke-width="3"/>
        <polygon points="100,10 108,14 100,18" fill="#60a5fa"/>
        <text x="80" y="6" fill="#60a5fa" font-size="11" font-weight="700">8 N</text>
      </g>
      <text x="220" y="180" fill="#94a3b8" font-size="12" text-anchor="middle">Fuerza neta igual en ambos carritos</text>
    </svg>`
  },
  {
    id: 36,
    num: "36",
    tema: "Segunda ley de Newton",
    categoria: "calculo",
    pregunta: "Sobre un objeto de 5 kg actúa una fuerza neta de 15 N. ¿Cuál es la magnitud de su aceleración?",
    opciones: [
      "A. 10 m/s²",
      "B. 3 m/s²",
      "C. 0,33 m/s²",
      "D. 75 m/s²"
    ],
    correcta: "B",
    explicacion: "Por la segunda ley de Newton: a = F_neta / m = 15 N / 5 kg = 3 m/s²."
  },
  {
    id: 37,
    num: "37",
    tema: "Tercera ley de Newton",
    categoria: "concepto",
    pregunta: "Las dos fuerzas de un par de acción y reacción, según la tercera ley de Newton, actúan sobre...",
    opciones: [
      "A. El cuerpo que se mueve solamente",
      "B. Cuerpos distintos",
      "C. El cuerpo de mayor masa solamente",
      "D. El mismo cuerpo"
    ],
    correcta: "B",
    explicacion: "Las fuerzas de acción y reacción siempre actúan simultáneamente sobre cuerpos diferentes (A sobre B y B sobre A), por lo cual nunca se anulan entre sí dentro del mismo cuerpo."
  },
  {
    id: 38,
    num: "38",
    tema: "Tercera ley de Newton",
    categoria: "concepto",
    pregunta: "Un camión y un automóvil chocan. Durante el contacto, ¿cómo se comparan las fuerzas que se ejercen mutuamente?",
    opciones: [
      "A. Tienen igual magnitud y sentidos opuestos",
      "B. Solo el vehículo en movimiento ejerce fuerza",
      "C. El automóvil ejerce mayor fuerza",
      "D. El camión ejerce mayor fuerza"
    ],
    correcta: "A",
    explicacion: "Por la 3ª Ley de Newton, la fuerza que el camión ejerce sobre el auto es exactamente igual en magnitud y opuesta en sentido a la que el auto ejerce sobre el camión, independientemente de sus masas."
  },
  {
    id: 39,
    num: "39",
    tema: "Tercera ley de Newton",
    categoria: "grafica",
    pregunta: "La figura de la pregunta 39 muestra dos patinadores. A ejerce sobre B una fuerza horizontal de 60 N hacia la derecha. ¿Qué fuerza ejerce B sobre A?",
    opciones: [
      "A. 30 N hacia la izquierda",
      "B. 0 N",
      "C. 60 N hacia la izquierda",
      "D. 60 N hacia la derecha"
    ],
    correcta: "C",
    explicacion: "Por la tercera ley de Newton, a toda acción le corresponde una reacción de igual magnitud pero sentido contrario: 60 N hacia la izquierda.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <line x1="50" y1="180" x2="390" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <!-- Patinador A -->
      <g transform="translate(130, 80)">
        <circle cx="10" cy="10" r="10" fill="#38bdf8"/>
        <line x1="10" y1="20" x2="10" y2="60" stroke="#38bdf8" stroke-width="3"/>
        <line x1="10" y1="60" x2="-5" y2="95" stroke="#38bdf8" stroke-width="3"/>
        <line x1="10" y1="60" x2="25" y2="95" stroke="#38bdf8" stroke-width="3"/>
        <line x1="-15" y1="95" x2="35" y2="95" stroke="#94a3b8" stroke-width="4"/>
        <line x1="10" y1="35" x2="80" y2="35" stroke="#38bdf8" stroke-width="3"/>
        <text x="10" y="-8" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">A</text>
      </g>
      <!-- Patinador B -->
      <g transform="translate(270, 80)">
        <circle cx="10" cy="10" r="10" fill="#f43f5e"/>
        <line x1="10" y1="20" x2="10" y2="60" stroke="#f43f5e" stroke-width="3"/>
        <line x1="10" y1="60" x2="-5" y2="95" stroke="#f43f5e" stroke-width="3"/>
        <line x1="10" y1="60" x2="25" y2="95" stroke="#f43f5e" stroke-width="3"/>
        <line x1="-15" y1="95" x2="35" y2="95" stroke="#94a3b8" stroke-width="4"/>
        <text x="10" y="-8" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">B</text>
      </g>
      <!-- Flecha fuerza 60 N -->
      <line x1="285" y1="115" x2="350" y2="115" stroke="#38bdf8" stroke-width="3"/>
      <polygon points="350,111 358,115 350,119" fill="#38bdf8"/>
      <text x="315" y="105" fill="#38bdf8" font-size="11" font-weight="700">60 N sobre B</text>
      <text x="210" y="200" fill="#94a3b8" font-size="11" text-anchor="middle">A empuja a B</text>
    </svg>`
  },

  // 40-43: Peso
  {
    id: 40,
    num: "40",
    tema: "Peso",
    categoria: "concepto",
    pregunta: "¿Qué es el peso de un cuerpo cerca de la superficie terrestre?",
    opciones: [
      "A. La suma de todas las fuerzas sobre él",
      "B. La cantidad de materia del cuerpo",
      "C. La fuerza que cualquier superficie ejerce sobre él",
      "D. La fuerza gravitatoria que la Tierra ejerce sobre él"
    ],
    correcta: "D",
    explicacion: "El peso es la fuerza de atracción gravitatoria que ejerce un planeta (la Tierra) sobre la masa de un objeto situado en sus proximidades: P⃗ = m·g⃗."
  },
  {
    id: 41,
    num: "41",
    tema: "Peso",
    categoria: "calculo",
    pregunta: "Un objeto tiene masa de 6 kg. En un lugar donde g = 10 m/s², ¿cuál es la magnitud de su peso?",
    opciones: [
      "A. 6 N",
      "B. 0,6 N",
      "C. 60 N",
      "D. 600 N"
    ],
    correcta: "C",
    explicacion: "P = m · g = (6 kg) × (10 m/s²) = 60 N."
  },
  {
    id: 42,
    num: "42",
    tema: "Peso",
    categoria: "concepto",
    pregunta: "Un objeto se lleva de un lugar con gravedad mayor a otro con gravedad menor. ¿Qué sucede con su masa y su peso?",
    opciones: [
      "A. La masa no cambia y el peso disminuye",
      "B. La masa disminuye y el peso no cambia",
      "C. La masa no cambia y el peso aumenta",
      "D. La masa y el peso disminuyen"
    ],
    correcta: "A",
    explicacion: "La masa es una propiedad intrínseca de la materia y no cambia con el lugar. El peso depende del campo gravitatorio local (P = m·g), por lo que al disminuir la gravedad, el peso disminuye."
  },
  {
    id: 43,
    num: "43",
    tema: "Peso",
    categoria: "grafica",
    pregunta: "La gráfica de la pregunta 43 relaciona el peso P con la masa m. La recta pasa por (2 kg, 20 N) y (4 kg, 40 N). ¿Cuál es la aceleración gravitatoria del lugar?",
    opciones: [
      "A. 10 m/s²",
      "B. 40 m/s²",
      "C. 20 m/s²",
      "D. 5 m/s²"
    ],
    correcta: "A",
    explicacion: "Como P = m · g, la pendiente de la recta P vs m es la aceleración gravitatoria: g = ΔP / Δm = (40 N − 20 N) / (4 kg − 2 kg) = 20 / 2 = 10 m/s².",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <line x1="60" y1="180" x2="400" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="20" x2="60" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="405" y="184" fill="#94a3b8" font-size="12">m (kg)</text>
      <text x="25" y="25" fill="#94a3b8" font-size="12">Peso P (N)</text>
      <text x="60" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="145" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="230" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="315" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <text x="50" y="184" fill="#cbd5e1" font-size="11" text-anchor="end">0</text>
      <text x="50" y="145" fill="#cbd5e1" font-size="11" text-anchor="end">10</text>
      <text x="50" y="110" fill="#cbd5e1" font-size="11" text-anchor="end">20</text>
      <text x="50" y="75" fill="#cbd5e1" font-size="11" text-anchor="end">30</text>
      <text x="50" y="35" fill="#cbd5e1" font-size="11" text-anchor="end">40</text>
      <line x1="60" y1="180" x2="400" y2="35" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="230" cy="110" r="5" fill="#ef4444"/>
      <circle cx="400" cy="35" r="5" fill="#ef4444"/>
    </svg>`
  },

  // 44-48: Fuerza normal
  {
    id: 44,
    num: "44",
    tema: "Fuerza normal",
    categoria: "concepto",
    pregunta: "¿En qué dirección actúa la fuerza normal que una superficie ejerce sobre un objeto en contacto con ella?",
    opciones: [
      "A. Siempre vertical hacia arriba",
      "B. Perpendicular a la superficie de contacto",
      "C. Siempre opuesta a la velocidad",
      "D. Siempre paralela a la superficie"
    ],
    correcta: "B",
    explicacion: "Por definición geométrica y física, 'normal' significa ortogonal o perpendicular: actúa siempre perpendicular a la superficie de contacto, apuntando hacia el cuerpo."
  },
  {
    id: 45,
    num: "45",
    tema: "Fuerza normal",
    categoria: "calculo",
    pregunta: "Un bloque de 8 kg está en reposo sobre una mesa horizontal. Solo actúan su peso y la normal. Si g = 10 m/s², ¿cuál es la normal?",
    opciones: [
      "A. 160 N",
      "B. 8 N",
      "C. 80 N",
      "D. 0 N"
    ],
    correcta: "C",
    explicacion: "En reposo sobre plano horizontal: ΣFᵧ = 0 => N − P = 0 => N = m·g = 8 kg × 10 m/s² = 80 N."
  },
  {
    id: 46,
    num: "46",
    tema: "Fuerza normal",
    categoria: "grafica",
    pregunta: "La pregunta 46 muestra un bloque de 10 kg sobre un plano inclinado 60° respecto a la horizontal. Solo actúan peso y normal, sin aceleración perpendicular al plano. Usa g = 10 m/s² y cos 60° = 0,5. ¿Cuánto vale N?",
    opciones: [
      "A. 200 N",
      "B. 100 N",
      "C. 0 N",
      "D. 50 N"
    ],
    correcta: "D",
    explicacion: "En un plano inclinado con ángulo θ, la componente del peso perpendicular a la rampa es m·g·cos θ: N = (10 kg) × (10 m/s²) × cos(60°) = 100 × 0.5 = 50 N.",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Plano inclinado 60° -->
      <polygon points="120,180 320,180 120,40" fill="rgba(255,255,255,0.05)" stroke="#94a3b8" stroke-width="2"/>
      <text x="170" y="172" fill="#cbd5e1" font-size="11">60°</text>
      <!-- Bloque -->
      <g transform="translate(195, 85) rotate(-35)">
        <rect width="36" height="24" rx="2" fill="#38bdf8"/>
        <!-- Vector Normal -->
        <line x1="18" y1="0" x2="18" y2="-45" stroke="#38bdf8" stroke-width="2.5"/>
        <polygon points="14,-45 18,-52 22,-45" fill="#38bdf8"/>
        <text x="25" y="-35" fill="#38bdf8" font-size="11" font-weight="700">N</text>
        <!-- Vector Peso -->
        <line x1="18" y1="12" x2="45" y2="65" stroke="#f43f5e" stroke-width="2.5"/>
        <polygon points="41,64 48,70 48,60" fill="#f43f5e"/>
        <text x="52" y="55" fill="#f43f5e" font-size="11" font-weight="700">P</text>
      </g>
      <text x="240" y="45" fill="#cbd5e1" font-size="11">m = 10 kg</text>
      <text x="240" y="60" fill="#94a3b8" font-size="11">g = 10 m/s²</text>
    </svg>`
  },
  {
    id: 47,
    num: "47",
    tema: "Fuerza normal",
    categoria: "concepto",
    pregunta: "¿Cuál afirmación sobre la normal N y el peso P es correcta?",
    opciones: [
      "A. No siempre tienen igual magnitud",
      "B. Siempre tienen igual magnitud",
      "C. La normal siempre es menor que el peso",
      "D. La normal siempre es mayor que el peso"
    ],
    correcta: "A",
    explicacion: "La normal depende de las condiciones del sistema: en planos inclinados (N = P·cos θ), en elevadores acelerados o cuando existen fuerzas externas verticales, N y P difieren."
  },
  {
    id: 48,
    num: "48",
    tema: "Fuerza normal",
    categoria: "calculo",
    pregunta: "Una persona de 50 kg está de pie en un ascensor que acelera hacia arriba a 2 m/s². Solo actúan peso y normal. Con g = 10 m/s², ¿cuánto vale la normal del piso?",
    opciones: [
      "A. 100 N",
      "B. 500 N",
      "C. 400 N",
      "D. 600 N"
    ],
    correcta: "D",
    explicacion: "Segunda ley: N − P = m·a => N = m(g + a) = (50 kg) × (10 + 2 m/s²) = 50 × 12 = 600 N."
  },

  // 49-54: Fuerza neta
  {
    id: 49,
    num: "49",
    tema: "Fuerza neta",
    categoria: "concepto",
    pregunta: "¿Cómo se obtiene la fuerza neta que actúa sobre un cuerpo?",
    opciones: [
      "A. Sumando vectorialmente todas las fuerzas externas",
      "B. Sumando siempre las magnitudes de las fuerzas",
      "C. Restando siempre el peso de la normal",
      "D. Escogiendo únicamente la fuerza mayor"
    ],
    correcta: "A",
    explicacion: "La fuerza neta o resultante es la suma vectorial de todas las fuerzas externas que interactúan sobre el cuerpo: F⃗_neta = Σ F⃗_i."
  },
  {
    id: 50,
    num: "50",
    tema: "Fuerza neta",
    categoria: "grafica",
    pregunta: "La figura de la pregunta 50 muestra fuerzas horizontales de 10 N hacia la derecha y 6 N hacia la izquierda sobre un bloque. Las fuerzas verticales se equilibran. ¿Cuál es la fuerza neta?",
    opciones: [
      "A. 4 N hacia la derecha",
      "B. 16 N hacia la izquierda",
      "C. 16 N hacia la derecha",
      "D. 4 N hacia la izquierda"
    ],
    correcta: "A",
    explicacion: "En 1D horizontal: F_neta = +10 N − 6 N = +4 N (hacia la derecha).",
    graficaSvg: `<svg viewBox="0 0 440 200" class="quiz-svg">
      <rect width="440" height="200" fill="#0f172a" rx="8"/>
      <!-- Bloque -->
      <g transform="translate(180, 70)">
        <rect width="80" height="50" rx="4" fill="#38bdf8"/>
        <text x="40" y="30" fill="#0f172a" font-size="12" font-weight="700" text-anchor="middle">Bloque</text>
      </g>
      <!-- Fuerza 6 N izquierda -->
      <line x1="180" y1="95" x2="100" y2="95" stroke="#ef4444" stroke-width="3"/>
      <polygon points="100,91 92,95 100,99" fill="#ef4444"/>
      <text x="135" y="85" fill="#ef4444" font-size="12" font-weight="700">6 N</text>
      <!-- Fuerza 10 N derecha -->
      <line x1="260" y1="95" x2="360" y2="95" stroke="#22c55e" stroke-width="3"/>
      <polygon points="360,91 368,95 360,99" fill="#22c55e"/>
      <text x="300" y="85" fill="#22c55e" font-size="12" font-weight="700">10 N</text>
      <text x="220" y="160" fill="#94a3b8" font-size="11" text-anchor="middle">Las fuerzas verticales se equilibran</text>
    </svg>`
  },
  {
    id: 51,
    num: "51",
    tema: "Fuerza neta",
    categoria: "calculo",
    pregunta: "Las componentes de la fuerza neta sobre un cuerpo son Fₓ = 6 N y Fᵧ = 8 N. ¿Cuál es su magnitud?",
    opciones: [
      "A. 14 N",
      "B. 2 N",
      "C. 10 N",
      "D. 48 N"
    ],
    correcta: "C",
    explicacion: "Magnitud por teorema de Pitágoras: |F⃗| = √(Fₓ² + Fᵧ²) = √(6² + 8²) = √(36 + 64) = √100 = 10 N."
  },
  {
    id: 52,
    num: "52",
    tema: "Fuerza neta",
    categoria: "concepto",
    pregunta: "En un marco inercial, la fuerza neta sobre un cuerpo es cero. ¿Cuál afirmación es necesariamente verdadera?",
    opciones: [
      "A. No actúa ninguna fuerza sobre él",
      "B. Su aceleración es cero",
      "C. Su velocidad es cero",
      "D. Su posición es cero"
    ],
    correcta: "B",
    explicacion: "F_neta = m · a = 0 implica estrictamente que su aceleración es cero. El cuerpo puede encontrarse en reposo o moviéndose a velocidad constante distinta de cero."
  },
  {
    id: 53,
    num: "53",
    tema: "Fuerza neta",
    categoria: "calculo",
    pregunta: "Un bloque de 2 kg recibe una fuerza de 9 N hacia la derecha y otra de 4 N hacia la izquierda. Las fuerzas verticales se equilibran. ¿Cuál es su aceleración?",
    opciones: [
      "A. 2,5 m/s² hacia la izquierda",
      "B. 2,5 m/s² hacia la derecha",
      "C. 5 m/s² hacia la derecha",
      "D. 6,5 m/s² hacia la derecha"
    ],
    correcta: "B",
    explicacion: "Fuerza neta = 9 N − 4 N = 5 N hacia la derecha. Aceleración a = F_neta / m = 5 N / 2 kg = 2.5 m/s² hacia la derecha."
  },
  {
    id: 54,
    num: "54",
    tema: "Fuerza neta",
    categoria: "grafica",
    pregunta: "La gráfica de la pregunta 54 muestra Fnet,x = +3 N entre 0 y 2 s, y +6 N entre 2 y 4 s. Para un cuerpo de 3 kg, ¿cuál es aₓ en t = 3 s?",
    opciones: [
      "A. +3 m/s²",
      "B. +6 m/s²",
      "C. +2 m/s²",
      "D. +1 m/s²"
    ],
    correcta: "C",
    explicacion: "En t = 3 s, la gráfica indica que la fuerza neta es F = 6 N. Por la 2ª ley: a = F / m = 6 N / 3 kg = +2 m/s².",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <line x1="60" y1="180" x2="400" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="20" x2="60" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <text x="405" y="184" fill="#94a3b8" font-size="12">t (s)</text>
      <text x="20" y="25" fill="#94a3b8" font-size="12">Fnet,x (N)</text>
      <text x="60" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">0</text>
      <text x="145" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">1</text>
      <text x="230" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">2</text>
      <text x="315" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">3</text>
      <text x="400" y="196" fill="#cbd5e1" font-size="11" text-anchor="middle">4</text>
      <text x="50" y="125" fill="#cbd5e1" font-size="11" text-anchor="end">3</text>
      <text x="50" y="65" fill="#cbd5e1" font-size="11" text-anchor="end">6</text>
      <!-- Escalón -->
      <line x1="60" y1="120" x2="230" y2="120" stroke="#38bdf8" stroke-width="3"/>
      <line x1="230" y1="120" x2="230" y2="60" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3,3"/>
      <line x1="230" y1="60" x2="400" y2="60" stroke="#38bdf8" stroke-width="3"/>
    </svg>`
  },

  // 55-60: Movimiento circular
  {
    id: 55,
    num: "55",
    tema: "Movimiento circular",
    categoria: "concepto",
    pregunta: "En un movimiento circular uniforme, ¿qué permanece constante y qué cambia?",
    opciones: [
      "A. La rapidez permanece constante y cambia la dirección de la velocidad",
      "B. La aceleración es cero",
      "C. El radio cambia continuamente",
      "D. La velocidad vectorial permanece constante"
    ],
    correcta: "A",
    explicacion: "En el MCU el valor escalar (rapidez) es fijo, pero el vector velocidad cambia continuamente de dirección en cada punto de la curva, produciendo la aceleración centrípeta."
  },
  {
    id: 56,
    num: "56",
    tema: "Movimiento circular",
    categoria: "calculo",
    pregunta: "Un objeto completa 5 vueltas en 10 s con movimiento circular uniforme. ¿Cuál es su período?",
    opciones: [
      "A. 2 s",
      "B. 5 s",
      "C. 0,5 s",
      "D. 50 s"
    ],
    correcta: "A",
    explicacion: "El período T es el tiempo necesario para dar una vuelta completa: T = tiempo total / número de vueltas = 10 s / 5 = 2 s."
  },
  {
    id: 57,
    num: "57",
    tema: "Movimiento circular",
    categoria: "concepto",
    pregunta: "¿Cuál expresión relaciona la aceleración centrípeta a_c con la rapidez v y el radio r?",
    opciones: [
      "A. a_c = r/v²",
      "B. a_c = v²/r",
      "C. a_c = v/r²",
      "D. a_c = vr"
    ],
    correcta: "B",
    explicacion: "La aceleración centrípeta requerida para mantener una trayectoria circular de radio r a rapidez v es a_c = v² / r = ω² · r."
  },
  {
    id: 58,
    num: "58",
    tema: "Movimiento circular",
    categoria: "grafica",
    pregunta: "En la figura de la pregunta 58, una partícula está en el extremo derecho de una circunferencia y se mueve en sentido antihorario. ¿Hacia dónde apuntan su velocidad y su aceleración centrípeta?",
    opciones: [
      "A. Velocidad hacia arriba; aceleración hacia la izquierda",
      "B. Velocidad hacia la izquierda; aceleración hacia arriba",
      "C. Velocidad hacia abajo; aceleración hacia la izquierda",
      "D. Velocidad hacia arriba; aceleración hacia la derecha"
    ],
    correcta: "A",
    explicacion: "En el punto más a la derecha (r, 0) con giro antihorario, el vector velocidad es tangente a la trayectoria apuntando hacia arriba (+y), mientras que la aceleración centrípeta apunta radialmente hacia el centro de giro (hacia la izquierda, −x).",
    graficaSvg: `<svg viewBox="0 0 440 220" class="quiz-svg">
      <rect width="440" height="220" fill="#0f172a" rx="8"/>
      <!-- Circunferencia -->
      <circle cx="210" cy="110" r="60" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="210" cy="110" r="3" fill="#94a3b8"/>
      <text x="200" y="125" fill="#94a3b8" font-size="11">O</text>
      <!-- Punto P en extremo derecho -->
      <circle cx="270" cy="110" r="5" fill="#ef4444"/>
      <text x="285" y="115" fill="#fff" font-size="12" font-weight="700">P</text>
      <!-- Flecha de giro antihorario arriba -->
      <path d="M 190 40 A 65 65 0 0 0 240 40" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <polygon points="190,37 182,40 190,44" fill="#94a3b8"/>
      <text x="150" y="32" fill="#94a3b8" font-size="11">Giro antihorario</text>
    </svg>`
  },
  {
    id: 59,
    num: "59",
    tema: "Movimiento circular",
    categoria: "calculo",
    pregunta: "Una partícula se mueve con rapidez de 4 m/s en una circunferencia de radio 2 m. ¿Cuál es la magnitud de su aceleración centrípeta?",
    opciones: [
      "A. 8 m/s²",
      "B. 16 m/s²",
      "C. 4 m/s²",
      "D. 2 m/s²"
    ],
    correcta: "A",
    explicacion: "a_c = v² / r = (4 m/s)² / (2 m) = 16 / 2 = 8 m/s²."
  },
  {
    id: 60,
    num: "60",
    tema: "Movimiento circular",
    categoria: "calculo",
    pregunta: "Un cuerpo de 2 kg se mueve con rapidez constante de 3 m/s en una circunferencia de radio 3 m. ¿Cuál es la fuerza neta sobre él?",
    opciones: [
      "A. 18 N tangentes a la trayectoria",
      "B. 6 N hacia el centro",
      "C. 2 N hacia el centro",
      "D. 6 N hacia afuera"
    ],
    correcta: "B",
    explicacion: "La fuerza neta es la fuerza centrípeta dirigida hacia el centro: F_c = m · (v² / r) = 2 kg × (3² / 3) = 2 × 3 = 6 N hacia el centro."
  }
];

// Módulos y categorías temáticas
const QUIZ_PRESETS = [
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
    getQuestions: () => questions
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
    getQuestions: () => questions.filter(q => q.id <= 30)
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
    getQuestions: () => questions.filter(q => q.id >= 31)
  },
  {
    id: "quiz-express",
    code: "EXPRESS-10",
    aliases: ["EXPRESS-10", "EXPRESS", "RAPIDO", "1010"],
    title: "Desafío Rápido de 10 Preguntas",
    subtitle: "10 Preguntas Aleatorias de Todo el Banco",
    description: "Ideal para un calentamiento rápido antes de clase o repasar conceptos clave en menos de 10 minutos.",
    badge: "⏱️ Modo Rápido",
    totalPreguntas: 10,
    tiempoSugeridoMin: 12,
    getQuestions: () => questions
  }
];

const fileContent = `// Banco Oficial de Quizzes Interactivos - PhysicsAILab
// Basado en el Cuestionario Oficial de Cinemática y Dinámica (Mg. Manuel Alejandro Obando - Universidad del Cauca)
window.QUIZZES_DATA = {
  questions: ${JSON.stringify(questions, null, 2)},
  presets: [
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
      questionIds: ${JSON.stringify(questions.map(q => q.id))}
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
`;

fs.writeFileSync(path.join(__dirname, '..', 'web', 'quizzes-data.js'), fileContent, 'utf8');
console.log('✅ Archivo web/quizzes-data.js generado con éxito (' + questions.length + ' preguntas).');
