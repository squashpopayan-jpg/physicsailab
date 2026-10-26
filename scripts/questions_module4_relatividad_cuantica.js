// Módulo 4: Relatividad Especial, Relatividad General y Física Cuántica/Atómica (55 preguntas)
module.exports = [
  // --- RELATIVIDAD ESPECIAL Y GENERAL (25 preguntas) ---
  {
    area: "Física Moderna y Cuántica",
    subtema: "Postulados de la Relatividad Especial",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El Segundo Postulado de la Relatividad Especial formulado por Albert Einstein en 1905 establece que:",
    opciones: [
      "A. La velocidad de la luz depende de la velocidad del foco emisor",
      "B. La velocidad de la luz en el vacío (c ≈ 3 × 10⁸ m/s) es idéntica en magnitud para todos los observadores inerciales, con absoluta independencia del movimiento relativo de la fuente emisora o del receptor",
      "C. La gravedad viaja instantáneamente a velocidad infinita",
      "D. El tiempo transcurre de forma absoluta e idéntica en todo el cosmos"
    ],
    correcta: 1,
    explicacion: "Einstein eliminó la necesidad del hipotético éter luminífero al elevar la constancia e invariancia de c en el vacío a la categoría de principio fundamental de la física para todos los sistemas inerciales."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Dilatación Temporal",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Un astronauta viaja en una nave espacial a una velocidad relativista constante de v = 0.8 c respecto a la Tierra. Para los observadores terrestres, los relojes de la nave espacial:",
    opciones: [
      "A. Marchan al mismo ritmo exacto que los relojes terrestres",
      "B. Parecen marchar más despacio (dilatación del tiempo: Δt = γ Δτ) debido al factor de Lorentz γ ≈ 1.67",
      "C. Marchan más rápido hacia el futuro",
      "D. Se detienen de forma permanente y retroceden"
    ],
    correcta: 1,
    explicacion: "El tiempo propio Δτ medido en reposo respecto a la nave es el intervalo mínimo entre eventos en el mismo lugar. En cualquier marco donde la nave se mueva, el tiempo transcurrido es dilatado: Δt = γ Δτ, donde γ = 1/√(1 - 0.8²) = 1/0.6 ≈ 1.67."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Muones Atmosféricos",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Los muones creados por rayos cósmicos a 15 km de altitud tienen una vida media en reposo de solo 2.2 microsegundos. Clásicamente se desintegrarían tras recorrer apenas 660 metros, pero llegan copiosamente a nivel del mar. ¿Cómo lo explica la física?",
    opciones: [
      "A. Los muones son partículas sin masa que viajan a velocidad infinita",
      "B. Por la dilatación relativista del tiempo: al viajar a v ≈ 0.998 c (γ ≈ 15), su vida media vista desde la Tierra se dilata hasta más de 30 microsegundos, permitiéndoles alcanzar el suelo",
      "C. La gravedad terrestre atrae a los muones duplicando su masa",
      "D. Se crean continuamente en el suelo por reacción de las plantas"
    ],
    correcta: 1,
    explicacion: "Desde el marco terrestre, el tiempo del muón se dilata (Δt = γ Δτ), viviendo lo suficiente para llegar al mar. Desde el marco del propio muón, su vida es de 2.2 μs pero la atmósfera de 15 km se contrae por Lorentz a solo 1 km (L = L₀/γ), logrando impactar la superficie."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Contracción de Lorentz",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La contracción de longitud de Lorentz (L = L₀ / γ) predice que un objeto de longitud propia L₀ que se mueve con velocidad relativista v respecto a un observador:",
    opciones: [
      "A. Se acorta exclusivamente en la dirección paralela a su vector de movimiento",
      "B. Se encoge esféricamente en todas las tres dimensiones espaciales",
      "C. Aumenta su longitud física aparente",
      "D. Mantiene sus dimensiones perfectamente inalteradas"
    ],
    correcta: 0,
    explicacion: "La contracción de Lorentz es estrictamente unidireccional a lo largo del eje del movimiento relativo. Las dimensiones espaciales perpendiculares a la trayectoria no sufren ninguna alteración (y' = y, z' = z)."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Relatividad de la Simultaneidad",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué consecuencia directa tiene la relatividad especial sobre dos sucesos ocurridos en diferentes ubicaciones espaciales que resultan ser simultáneos para un observador inercial A?",
    opciones: [
      "A. Serán simultáneos para absolutamente todos los observadores del universo",
      "B. No serán simultáneos para otro observador inercial B que se mueva con velocidad relativa respecto a A",
      "C. Nunca podrán ser observados por nadie",
      "D. Uno de los sucesos debe ocurrir en el pasado infinito"
    ],
    correcta: 1,
    explicacion: "La simultaneidad no es absoluta sino relativa al marco de referencia. Por las transformaciones de Lorentz: Δt' = γ (Δt - v Δx / c²). Aunque Δt = 0 en el marco A, si los sucesos están separados espacialmente (Δx ≠ 0), en el marco B móvil Δt' ≠ 0."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Adición de Velocidades",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Una nave espacial se aleja de la Tierra a 0.7 c y dispara hacia adelante una sonda a 0.7 c respecto a la nave. ¿Cuál es la velocidad u de la sonda medida desde la Tierra?",
    opciones: [
      "A. 1.40 c (supera a la velocidad de la luz)",
      "B. 0.94 c, calculada mediante u = (v + u') / (1 + v·u' / c²)",
      "C. 0.70 c",
      "D. 1.00 c exactamente"
    ],
    correcta: 1,
    explicacion: "Por la fórmula relativista de Einstein: u = (0.7c + 0.7c) / (1 + 0.7 × 0.7) = 1.4c / (1 + 0.49) = 1.4c / 1.49 ≈ 0.9396 c. Ningún cuerpo masivo puede alcanzar o superar la velocidad de la luz c en ningún sistema inercial."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Equivalencia Masa-Energía",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La famosa ecuación de Albert Einstein E₀ = m c² demuestra fundamentalmente que:",
    opciones: [
      "A. La energía solo existe en forma de ondas de luz",
      "B. La masa en reposo de un cuerpo representa una reserva colosal de energía intrínseca concentrada, donde masa y energía son manifestaciones intercambiables de la misma entidad física",
      "C. La velocidad de la luz se duplica cuando la masa aumenta",
      "D. La masa se destruye sin dejar rastro en todas las reacciones químicas"
    ],
    correcta: 1,
    explicacion: "E₀ = mc² demuestra la equivalencia profunda entre masa inercial y energía en reposo. Incluso un solo gramo de materia ordinaria equivale a 9 × 10¹³ Joules (la energía liberada por unas 21 kilotoneladas de TNT)."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Relación Energía-Momento Relativista",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es la ecuación completa que vincula la energía total E, el momento lineal p y la masa en reposo m₀ de cualquier partícula relativista?",
    opciones: [
      "A. E = p c + m₀ c²",
      "B. E² = (p c)² + (m₀ c²)²",
      "C. E = 1/2 m₀ v² + p c",
      "D. E² = p² / (2 m₀)"
    ],
    correcta: 1,
    explicacion: "E² = (pc)² + (m₀c²)² es el invariante relativista de cuadrimomento fundamental. Para una partícula en reposo (p=0) se reduce a E = m₀c², mientras que para partículas sin masa en reposo como el fotón (m₀=0) da E = pc (p = E/c = h/λ)."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Fotones y Momento Lineal",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Aunque un fotón de luz carece de masa en reposo (m₀ = 0), transporta momento lineal p y energía E. ¿Cuál es la relación entre ambas magnitudes para un fotón?",
    opciones: [
      "A. p = E / c",
      "B. p = E · c",
      "C. p = 0 (los fotones no tienen momento)",
      "D. p = E / c²"
    ],
    correcta: 0,
    explicacion: "De la relación relativista con m₀ = 0 se obtiene directamente E = pc, por lo que p = E/c = hf/c = h/λ. Este momento lineal permite a la luz ejercer presión de radiación mecánica real sobre velas solares en el espacio."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Intervalo Espaciotemporal",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En el espacio-tiempo de Minkowski de cuatro dimensiones, el intervalo invariante entre dos sucesos viene dado por Δs² = c² Δt² - (Δx² + Δy² + Δz²). Si Δs² > 0, se dice que el intervalo es:",
    opciones: [
      "A. De tipo espacio (inaccesible causalmente a partículas ordinarias)",
      "B. De tipo tiempo (es físicamente posible que un suceso sea causa del otro)",
      "C. De tipo nulo o luz",
      "D. Imaginario puro sin significado físico"
    ],
    correcta: 1,
    explicacion: "Un intervalo de tipo tiempo (Δs² > 0) significa que la separación temporal cΔt supera a la separación espacial. Por ende, existe un sistema inercial donde ambos sucesos ocurren en el mismo lugar y una señal sublumínica puede conectarlos causalmente."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Principio de Equivalencia de Einstein",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué postula el Principio de Equivalencia Débil de Albert Einstein, pilar fundamental de la Relatividad General?",
    opciones: [
      "A. La energía eléctrica es equivalente a la energía magnética",
      "B. Es localmente imposible distinguir mediante ningún experimento mecánico entre los efectos de un campo gravitatorio uniforme y los efectos de un sistema de referencia uniformemente acelerado",
      "C. Todos los átomos del universo tienen la misma masa gravitacional",
      "D. La fuerza electromagnética se unifica con la gravedad a baja energía"
    ],
    correcta: 1,
    explicacion: "Un observador encerrado en una cápsula cerrada sin ventanas no puede determinar si está en reposo en la superficie de la Tierra (1 g) o en el espacio profundo acelerado por motores a 9.8 m/s². La masa inercial y la masa gravitatoria son estrictamente equivalentes."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Curvatura del Espacio-Tiempo",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la Relatividad General de Einstein (1915), ¿cuál es la naturaleza de la interacción gravitatoria?",
    opciones: [
      "A. Una fuerza clásica misteriosa que actúa a distancia a través del vacío",
      "B. La manifestación geométrica de la curvatura del tejido del espacio-tiempo provocada por la presencia de masa, energía y momento",
      "C. Un intercambio continuo de fotones virtuales",
      "D. Una propiedad térmica de los núcleos atómicos"
    ],
    correcta: 1,
    explicacion: "Como resumió célebremente John Archibald Wheeler: 'La materia le dice al espacio-tiempo cómo curvarse, y el espacio-tiempo le dice a la materia cómo moverse'. Los cuerpos en órbita siguen trayectorias de menor distancia (geodésicas) en un espacio curvado."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Eclipse de 1919 y Deflexión de la Luz",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué confirmación observacional histórica obtuvo la expedición de Sir Arthur Eddington durante el eclipse solar total del 29 de mayo de 1919?",
    opciones: [
      "A. El descubrimiento de un nuevo planeta entre Mercurio y el Sol",
      "B. La deflexión angular precisa de la luz de estrellas lejanas al pasar rozando el borde del Sol (≈ 1.75 segundos de arco), confirmando la predicción exacta de la curvatura del espacio-tiempo de Einstein",
      "C. La ausencia de manchas solares durante el eclipse",
      "D. La detección de neutrinos solares por primera vez"
    ],
    correcta: 1,
    explicacion: "Eddington midió la posición aparente de estrellas detrás del Sol durante la oscuridad del eclipse. El desvío observado coincidió con el valor predicho por la Relatividad General (4GM/(c²R)), el doble del que predecía la teoría corpuscular newtoniana clásica."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Dilatación Gravitacional del Tiempo",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "De acuerdo con la Relatividad General, ¿cómo transcurre el tiempo medido por un reloj atómico situado cerca de un objeto astronómico sumamente masivo comparado con un reloj situado en el espacio profundo?",
    opciones: [
      "A. El reloj en el campo gravitatorio más intenso marcha más lentamente (dilatación gravitacional del tiempo)",
      "B. El reloj marcha mucho más rápido",
      "C. El reloj no se ve afectado en lo más mínimo",
      "D. El reloj invierte el sentido de sus manecillas"
    ],
    correcta: 0,
    explicacion: "Cuanto más profundo se encuentra un reloj en un pozo de potencial gravitatorio, más lentamente avanza el tiempo propio: dτ = dt √(1 - 2GM/(rc²)). La luz emitida desde ese campo sufre un corrimiento al rojo gravitacional (pierde energía al escapar)."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Corrección Relativista en GPS",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Los satélites de navegación GPS en órbita a 20,200 km de altitud requieren correcciones relativistas diarias porque sus relojes atómicos se desfasan respecto al suelo. ¿Cómo actúan los efectos combinados?",
    opciones: [
      "A. Solo la relatividad especial retrasa los relojes 50 segundos al día",
      "B. Por su velocidad orbital se retrasan ~7 μs/día (relatividad especial), pero por estar en menor gravedad se adelantan ~45 μs/día (relatividad general), acumulando un adelanto neto de ~38 microsegundos por día que arruinaría el GPS en horas si no se corrigiera",
      "C. No se requiere ninguna corrección relativista",
      "D. El efecto del viento solar anula cualquier desface temporal"
    ],
    correcta: 1,
    explicacion: "El desfase neto de +38 microsegundos diarios provocaría un error acumulado en la posición en tierra de más de 11 kilómetros cada día (38 μs × c ≈ 11.4 km). El software del GPS ajusta la frecuencia de los osciladores atómicos de antemano para compensarlo."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Radio de Schwarzschild",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Cuál es el Radio de Schwarzschild R_s que define el horizonte de sucesos de un agujero negro estático no rotante de masa M?",
    opciones: [
      "A. R_s = 2 G M / c²",
      "B. R_s = G M / (2 c²)",
      "C. R_s = √(G M / c)",
      "D. R_s = 4 G M² / c"
    ],
    correcta: 0,
    explicacion: "Karl Schwarzschild dedujo en 1916 la primera solución exacta a las ecuaciones de campo de Einstein en el vacío: R_s = 2GM/c². Marca el radio del horizonte de sucesos donde la velocidad de escape iguala a la de la luz y nada, ni siquiera la luz, puede escapar."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Radiación de Hawking",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "Stephen Hawking predijo en 1974 que los agujeros negros no son totalmente negros sino que emiten una débil radiación térmica continua (Radiación de Hawking). ¿Cuál es el mecanismo cuántico subyacente?",
    opciones: [
      "A. La fusión de protones en el interior de la singularidad",
      "B. La creación continua de pares partícula-antipartícula virtuales por fluctuaciones del vacío en el horizonte de sucesos: una partícula cae dentro con energía negativa y la otra escapa al infinito con energía positiva, haciendo que el agujero pierda masa lentamente",
      "C. La reflexión de rayos gamma cósmicos por el disco de acreción",
      "D. La descomposición espontánea de los gravitones"
    ],
    correcta: 1,
    explicacion: "Al aplicar la teoría cuántica de campos en espaciotiempo curvo, Hawking demostró que los agujeros negros tienen una temperatura cuántica T = ħc³ / (8π G M k_B) inversamente proporcional a su masa, evaporándose en escalas de tiempo cosmológicas."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Ondas Gravitacionales",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En septiembre de 2015, los observatorios interferométricos LIGO detectaron por primera vez en la historia ondas gravitacionales (evento GW150914). ¿Cuál fue el cataclismo cósmico que las originó?",
    opciones: [
      "A. La explosión de una supernova en la Vía Láctea",
      "B. La fusión y colisión de dos agujeros negros masivos (de unas 36 y 29 masas solares) a 1,300 millones de años luz de la Tierra",
      "C. La colisión del cometa Halley contra el Sol",
      "D. El colapso del núcleo de la estrella Betelgeuse"
    ],
    correcta: 1,
    explicacion: "Dos agujeros negros giraron en espiral a casi la velocidad de la luz antes de fusionarse, convirtiendo el equivalente a 3 masas solares en pura energía de curvatura espaciotemporal radiada en una fracción de segundo, confirmando la predicción de Einstein de 1916."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Precesión del Perihelio de Mercurio",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué anomalía orbital histórica de Mercurio, inexplicable por la gravedad newtoniana aun considerando las perturbaciones de todos los demás planetas, resolvió con exactitud la Relatividad General?",
    opciones: [
      "A. Una variación periódica en su radio ecuatorial",
      "B. Un exceso anómalo de precesión del perihelio de 43 segundos de arco por siglo",
      "C. Una disminución continua en su masa gravitatoria",
      "D. La detención completa de su periodo de rotación"
    ],
    correcta: 1,
    explicacion: "Las perturbaciones newtonianas de Venus, Júpiter y demás planetas explicaban 531 de los 574 segundos de arco por siglo de precesión observados. Los 43 segundos de arco restantes por siglo eran un enigma hasta que Einstein demostró que surgían de la curvatura del espaciotiempo cerca del Sol."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Lentes Gravitacionales y Anillos de Einstein",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Cuando una galaxia masiva o cúmulo de galaxias se interpone exactamente entre una fuente luminosa muy lejana y la Tierra, la deflexión de la luz crea una imagen deformada en forma de círculo casi perfecto llamada:",
    opciones: [
      "A. Disco de Airy",
      "B. Anillo de Einstein",
      "C. Halo de Debye",
      "D. Cinturón de Kuiper"
    ],
    correcta: 1,
    explicacion: "Por simetría axial, si la fuente distante, la masa deflectora (lente) y el observador están perfectamente alineados, la luz se curva uniformemente alrededor de la lente gravitacional formando un círculo luminoso completo conocido como Anillo de Einstein."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Límite Sublumínico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué se requiere una cantidad infinita de energía para acelerar una partícula con masa en reposo m₀ > 0 hasta igualar la velocidad de la luz c?",
    opciones: [
      "A. Porque la masa se disipa en ondas de radio antes de llegar a c",
      "B. Porque el factor de Lorentz γ = 1 / √(1 - v²/c²) tiende a infinito cuando v → c, haciendo que la energía cinética y el momento relativista diverjan hacia el infinito",
      "C. Porque los campos eléctricos dejan de operar a velocidades altas",
      "D. Porque la temperatura de la partícula alcanza el cero absoluto"
    ],
    correcta: 1,
    explicacion: "La energía relativista total es E = γ m₀ c². A medida que v se aproxima a c, el denominador √(1 - v²/c²) tiende a cero, haciendo que γ tienda a infinito. Acelerar la partícula a c requeriría suministrar una energía mayor que toda la energía disponible en el universo."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Efecto Doppler Relativista",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "A diferencia del efecto Doppler acústico clásico, el Efecto Doppler Relativista de la luz predice un corrimiento de frecuencia incluso cuando la fuente se mueve de forma perpendicular a la línea de visión del observador (Doppler transversal). Esto ocurre debido a:",
    opciones: [
      "A. La dilatación relativista del tiempo en el foco emisor",
      "B. La reflexión de fotones en la ionósfera",
      "C. La masa gravitatoria de los fotones",
      "D. La polarización circular del vacío"
    ],
    correcta: 0,
    explicacion: "En el Doppler transversal no hay componente de aproximación o alejamiento radial, por lo que clásicamente no habría cambio de frecuencia. Sin embargo, en relatividad el reloj del emisor marcha más lento por dilatación temporal (factor γ), reduciendo la frecuencia observada: f' = f₀ / γ."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Cuadrivectores",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El producto escalar de Minkowski del cuadrimomento P^μ = (E/c, p) de una partícula consigo mismo, P_μ P^μ, es un invariante relativista cuyo valor numérico es igual a:",
    opciones: [
      "A. Cero",
      "B. (m₀ c)²",
      "C. E²",
      "D. ħ / c"
    ],
    correcta: 1,
    explicacion: "El producto interior es P_μ P^μ = (E/c)² - p² = (m₀ c²)² / c² = (m₀ c)². Al ser un escalar de Lorentz, tiene el mismo valor idéntico en absolutamente todos los sistemas de referencia inerciales, garantizando la consistencia de la dinámica relativista."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Cono de Luz y Causalidad",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En un diagrama espaciotemporal de Minkowski, ¿qué separa la superficie hipersuperficial del 'Cono de Luz' que emana del origen (x = 0, t = 0)?",
    opciones: [
      "A. Separa los átomos con carga positiva de los que tienen carga negativa",
      "B. Delimita la región del futuro y pasado causalmente accesibles (trayectorias con v ≤ c dentro del cono) del exterior causalmente desconectado (tipo espacio con v > c)",
      "C. Marca la frontera de los agujeros de gusano transitables",
      "D. Separa la materia visible de la energía oscura"
    ],
    correcta: 1,
    explicacion: "Las líneas de luz a 45° (donde x = ±ct) forman el cono de luz. Nada puede propagar información o materia a velocidad superlumínica (v > c); por tanto, ningún suceso en el origen puede influir o ser influido por eventos fuera de su cono de luz."
  },
  {
    area: "Física Moderna y Cuántica",
    subtema: "Energía Cinética Relativista",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es la expresión exacta para la energía cinética K de una partícula de masa en reposo m₀ que se mueve a velocidad relativista v?",
    opciones: [
      "A. K = 1/2 m₀ v²",
      "B. K = (γ - 1) m₀ c²",
      "C. K = γ m₀ v²",
      "D. K = m₀ c² / γ"
    ],
    correcta: 1,
    explicacion: "La energía total es E = K + E₀ = γ m₀ c². Despejando la energía cinética resulta K = E - E₀ = (γ - 1) m₀ c². Al desarrollar γ en serie de Taylor para velocidades bajas (v << c), se recupera con precisión milimétrica la expresión clásica newtoniana: K ≈ 1/2 m₀ v²."
  },

  // --- FÍSICA CUÁNTICA, ATÓMICA Y ONDULATORIA (30 preguntas) ---
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Catástrofe Ultravioleta y Cuanto de Planck",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué hipótesis revolucionaria propuso Max Planck en diciembre de 1900 para resolver la 'catástrofe ultravioleta' de la radiación de cuerpo negro clásico?",
    opciones: [
      "A. Que la velocidad de la luz era proporcional a la temperatura",
      "B. Que los osciladores atómicos de las paredes solo pueden emitir o absorber energía electromagnética en paquetes discretos múltiplos de un cuanto elemental: E = n h ν",
      "C. Que la radiación térmica no obedece a las leyes de la termodinámica",
      "D. Que los átomos colapsaban a altas frecuencias"
    ],
    correcta: 1,
    explicacion: "La física clásica (Ley de Rayleigh-Jeans) predecía absurdamente que a frecuencias ultravioletas la energía radiada divergía al infinito. Planck eliminó la catástrofe postulando que la energía electromagnética está cuantizada en múltiplos de hν, naciendo la Física Cuántica."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Fotoeléctrico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En el efecto fotoeléctrico (explicado por Albert Einstein en 1905, lo que le valió el Premio Nobel), si la frecuencia de la luz incidente es inferior a la frecuencia umbral ν₀ del metal:",
    opciones: [
      "A. Se emiten electrones lentamente tras varias horas de acumulación continua de luz",
      "B. No se emite ni un solo electrón, sin importar cuán intensa o brillante sea la fuente luminosa",
      "C. Se emiten electrones pero con carga positiva",
      "D. El metal se funde instantáneamente"
    ],
    correcta: 1,
    explicacion: "Cada fotón individual interactúa con un solo electrón (hν). Si la energía del fotón es inferior a la función trabajo Φ = hν₀ del metal, ningún electrón puede ser arrancado. La física clásica predecía que aumentando la intensidad se emitirían electrones, lo cual fue rotundamente refutado."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Compton",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Arthur Compton demostró experimentalmente en 1923 que al chocar fotones de rayos X contra electrones libres, la longitud de onda de los fotones dispersados aumentaba (Δλ = λ' - λ > 0). ¿Qué confirmó este experimento?",
    opciones: [
      "A. Que los fotones no interactúan con electrones",
      "B. Que los fotones se comportan como partículas corpusculares localizadas que transportan tanto energía (hf) como momento lineal relativista (h/λ) obedeciendo las leyes clásicas de colisión elástica",
      "C. Que la carga del electrón varía con el ángulo de dispersión",
      "D. Que la constante de Planck no es constante"
    ],
    correcta: 1,
    explicacion: "El cambio de longitud de onda es Δλ = (h / (m_e c)) (1 - cosθ), donde h/(m_e c) ≈ 0.0243 Å es la longitud de onda Compton del electrón. Demostró definitivamente la naturaleza corpuscular de la luz en colisiones relativistas."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Hipótesis de De Broglie",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La hipótesis de Louis de Broglie de 1924 postuló que la dualidad onda-partícula se extiende a toda la materia física. Para una partícula con masa m que viaja a velocidad v, su longitud de onda de materia asociada es:",
    opciones: [
      "A. λ = h / (m v)",
      "B. λ = m v / h",
      "C. λ = h m v",
      "D. λ = h / c²"
    ],
    correcta: 0,
    explicacion: "De Broglie asignó a toda partícula material con momento p = mv una longitud de onda ondulatoria λ = h/p = h/(mv). Para un electrón a velocidades de laboratorio da longitudes del orden de los ángstroms (tamaño de redes cristalinas), permitiendo microscopía electrónica."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Experimento de Davisson-Germer",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué comprobaron Clinton Davisson y Lester Germer en 1927 al dispersar un haz de electrones de baja energía contra un cristal de níquel?",
    opciones: [
      "A. Que los electrones son más pesados que los protones",
      "B. Observaron picos de difracción de electrones que obedecían con precisión a la Ley de Bragg, demostrando experimentalmente por primera vez el comportamiento ondulatorio de la materia postulado por De Broglie",
      "C. Que el níquel no tiene electrones",
      "D. La existencia de la antimateria"
    ],
    correcta: 1,
    explicacion: "Los electrones sufrieron interferencia constructiva en los planos cristalinos del níquel con longitudes de onda λ exactamente coincidentes con la fórmula de de Broglie λ = h/√(2mE), transformando la hipótesis ondulatoria en un hecho empírico incontrovertible (Premio Nobel 1937)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Principio de Indeterminación de Heisenberg",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Principio de Incertidumbre o Indeterminación de Werner Heisenberg (1927) postula que para las variables canónicamente conjugadas de posición x y momento lineal p_x:",
    opciones: [
      "A. Δx · Δp_x = 0 con instrumentos suficientemente precisos",
      "B. Δx · Δp_x ≥ ħ / 2 (donde ħ = h / 2π)",
      "C. La posición solo puede medirse si la velocidad es igual a c",
      "D. Δx / Δp_x ≥ c"
    ],
    correcta: 1,
    explicacion: "No se trata de una imperfección instrumental, sino de una propiedad ondulatoria intrínseca del universo cuántico: un estado cuántico no puede tener simultáneamente una posición perfectamente localizada y un momento lineal unívocamente definido."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Incertidumbre Energía-Tiempo",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La relación de indeterminación entre energía y tiempo ΔE · Δt ≥ ħ/2 explica físicamente fenómenos como:",
    opciones: [
      "A. La creación efímera de partículas virtuales en el vacío cuántico y el ancho natural finito de las líneas de emisión espectral de estados atómicos excitados",
      "B. La velocidad finita del sonido en metales",
      "C. La dilatación temporal de Lorentz",
      "D. La carga neta de los neutrones"
    ],
    correcta: 0,
    explicacion: "Si un estado cuántico excitado tiene una vida media finita Δt, su nivel energético posee una incertidumbre intrínseca ΔE ≥ ħ/(2Δt), lo que produce un ensanchamiento espectral natural. Asimismo, el vacío puede 'prestar' energía ΔE para crear pares virtuales si viven menos de Δt."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Ecuación de Schrödinger",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la Ecuación de Schrödinger independiente del tiempo, Ĥ ψ = E ψ, ¿qué representa matemáticamente el operador Hamiltoniano Ĥ?",
    opciones: [
      "A. El operador de la masa relativista",
      "B. El operador de la energía total del sistema cuántico, que suma los operadores de energía cinética y energía potencial: Ĥ = - (ħ² / 2m) ∇² + V(r)",
      "C. El operador del espín de Dirac",
      "D. La transformada de Laplace de la temperatura"
    ],
    correcta: 1,
    explicacion: "El Hamiltoniano Ĥ es el generador de la evolución temporal y representa la energía total. La ecuación Ĥψ = Eψ es una ecuación de autovalores donde las funciones de onda admisibles son autofunciones y las energías cuantizadas son los autovalores E."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Interpretación de Born",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "De acuerdo con la interpretación probabilística de Max Born (Premio Nobel 1954), la cantidad |ψ(x, t)|² dx representa:",
    opciones: [
      "A. La densidad de masa gravitacional de la partícula",
      "B. La probabilidad de encontrar a la partícula en el intervalo espacial infinitesimal entre x y x + dx en el instante t",
      "C. La fuerza neta ejercida sobre el electrón",
      "D. La temperatura local del cuanto"
    ],
    correcta: 1,
    explicacion: "La función de onda cuántica ψ es en general compleja y no representa una sustancia física densa distribuida, sino una amplitud de probabilidad. Su módulo al cuadrado |ψ|² = ψ*ψ es la densidad de probabilidad espacial de hallar la partícula localizada."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Pozo de Potencial Infinito",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Para una partícula cuántica confinada en un pozo de potencial unidimensional infinito de ancho L ('partícula en una caja'), los niveles de energía cuantizados permitidos son proporcionales a:",
    opciones: [
      "A. n (lineales con el número cuántico)",
      "B. n² (E_n = (n² π² ħ²) / (2 m L²), con n = 1, 2, 3...)",
      "C. √n",
      "D. 1 / n²"
    ],
    correcta: 1,
    explicacion: "Las condiciones de contorno anulan la función de onda en las paredes (ψ(0)=ψ(L)=0), forzando un número entero de medias longitudes de onda en la caja: L = n (λ/2) = n (h / 2p). Despejando la energía cinética E = p²/(2m) resulta E_n = n² h² / (8mL²)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Túnel Cuántico",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué predice la mecánica cuántica cuando una partícula con energía E incide contra una barrera de potencial finita V₀ cuya altura es superior a la energía de la partícula (V₀ > E)?",
    opciones: [
      "A. La partícula es reflejada siempre con un 100% de certeza absoluta, idéntico a la física clásica",
      "B. Existe una probabilidad finita no nula de que la partícula 'atraviese' la barrera prohibida y emerja al otro lado (Efecto Túnel Cuántico), decayendo la función de onda exponencialmente dentro de la barrera",
      "C. La partícula destruye la barrera por resonancia acústica",
      "D. La partícula se transforma en un positrón"
    ],
    correcta: 1,
    explicacion: "Dentro de la barrera clásicamente prohibida, la función de onda no cae abruptamente a cero sino que decrece exponencialmente: ψ(x) ∝ e^(-κx). Si la barrera es suficientemente delgada, la amplitud no se extingue del todo y hay transmisión cuántica túnel."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Microscopio de Efecto Túnel (STM)",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Microscopio de Efecto Túnel (STM), inventado por Gerd Binnig y Heinrich Rohrer en 1981 en IBM Zúrich, logra resolución a escala de átomos individuales aprovechando que la corriente túnel entre la punta y la muestra:",
    opciones: [
      "A. Crece con la masa atómica del soporte",
      "B. Decae de forma extremadamente pronunciada y exponencial con la distancia de separación d (I_túnel ∝ e^(-2κd)), variando en un orden de magnitud por cada décima de nanómetro",
      "C. Es una corriente superconductora de alta temperatura",
      "D. Depende de la velocidad del sonido en el vacío"
    ],
    correcta: 1,
    explicacion: "Esa hipersensibilidad exponencial a la distancia hace que prácticamente el 99% de la corriente túnel fluya exclusivamente a través del átomo más saliente del extremo de la punta metálica, permitiendo mapear la densidad electrónica atómica con resolución sub-angstrom."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Energía de Punto Cero",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es la energía del estado cuántico fundamental (n = 0) de un oscilador armónico cuántico simple de frecuencia angular ω?",
    opciones: [
      "A. E₀ = 0 (cero)",
      "B. E₀ = 1/2 ħ ω (Energía de Punto Cero)",
      "C. E₀ = ħ ω",
      "D. E₀ = -ħ ω"
    ],
    correcta: 1,
    explicacion: "Los niveles de energía del oscilador armónico cuántico son E_n = (n + 1/2) ħω. En el estado fundamental n=0, la energía no puede ser cero debido al principio de indeterminación de Heisenberg (si E=0, la partícula estaría inmóvil en x=0, violando ΔxΔp ≥ ħ/2)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Modelo Atómico de Bohr",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál fue el postulado central que introdujo Niels Bohr en 1913 para cuantizar las órbitas electrónicas en el átomo de hidrógeno y evitar el colapso radiativo clásico del electrón?",
    opciones: [
      "A. El electrón orbita a la velocidad de la luz en todo momento",
      "B. El momento angular orbital L del electrón está rigurosamente cuantizado en múltiplos enteros de la constante reducida de Planck: L = m v r = n ħ (donde n = 1, 2, 3...)",
      "C. Los protones giran alrededor del electrón",
      "D. La carga eléctrica del átomo oscila periódicamente"
    ],
    correcta: 1,
    explicacion: "Al fijar L = nħ, Bohr dedujo que los radios orbitales sólo pueden adoptar valores r_n = n² a₀ (donde a₀ ≈ 0.529 Å es el radio de Bohr) y energías discretas E_n = -13.6 eV / n², explicando las líneas espectrales sin emisión de radiación en las órbitas estacionarias."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Series Espectrales del Hidrógeno",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En el espectro de emisión del átomo de hidrógeno, las transiciones electrónicas que terminan en el nivel fundamental n = 1 forman la Serie de Lyman, la cual cae en la región espectral:",
    opciones: [
      "A. Infrarroja",
      "B. Visible pura",
      "C. Ultravioleta",
      "D. Microondas"
    ],
    correcta: 2,
    explicacion: "Las transiciones hacia n=1 (Lyman) emiten fotones de alta energía (entre 10.2 eV y 13.6 eV), cayendo enteramente en el ultravioleta. Las transiciones hacia n=2 (Serie de Balmer) caen en el espectro visible, y hacia n=3 (Paschen) en el infrarrojo."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Números Cuánticos Atómicos",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Para un electrón en un átomo con número cuántico principal n = 3, ¿cuáles son los valores posibles que puede tomar el número cuántico de momento angular orbital l?",
    opciones: [
      "A. l = 1, 2, 3",
      "B. l = 0, 1, 2 (orbitales s, p, d)",
      "C. l = -3, 0, +3",
      "D. l = 0 exclusivamente"
    ],
    correcta: 1,
    explicacion: "Para un valor dado de n, el número cuántico azimutal u orbital l puede adoptar cualquier valor entero desde 0 hasta n - 1. Para n = 3, los valores permitidos son l = 0 (subnivel 3s), l = 1 (subnivel 3p) y l = 2 (subnivel 3d)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Principio de Exclusión de Pauli",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El Principio de Exclusión formulado por Wolfgang Pauli en 1925 establece que en un mismo átomo polielectrónico:",
    opciones: [
      "A. Todos los electrones deben tener exactamente el mismo espín",
      "B. Dos electrones (o en general dos fermiones idénticos) no pueden ocupar simultáneamente el mismo estado cuántico; es decir, no pueden compartir los cuatro números cuánticos (n, l, m_l, m_s)",
      "C. El número de protones debe ser estrictamente impar",
      "D. Los electrones caen espontáneamente al núcleo"
    ],
    correcta: 1,
    explicacion: "El Principio de Pauli explica la estructura en capas de la Tabla Periódica y la estabilidad de la materia. Si los electrones no fueran fermiones sujetos a exclusión, colapsarían todos al orbital 1s de mínima energía, impidiendo la química y la vida."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Experimento de Stern-Gerlach",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué demostró el experimento de Otto Stern y Walther Gerlach (1922) al hacer pasar un haz colimado de átomos neutros de plata a través de un campo magnético espacialmente no homogéneo?",
    opciones: [
      "A. La cuantización espacial del espín intrínseco del electrón, dividiéndose el haz en exactamente dos trazas discretas separadas (espín arriba +1/2 y espín abajo -1/2)",
      "B. Que los átomos de plata tienen carga eléctrica neta positiva",
      "C. La velocidad de la luz en presencia de imanes",
      "D. La descomposición radiactiva de la plata en oro"
    ],
    correcta: 0,
    explicacion: "La física clásica predecía una distribución continua y uniforme de impactos en la pantalla. La separación neta en exactamente dos componentes simétricas discretas reveló la cuantización espacial del momento magnético y del momento angular intrínseco (espín s = 1/2)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Teorema Espín-Estadística",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "De acuerdo con el Teorema Espín-Estadística de la teoría cuántica de campos relativista, las partículas de espín entero (0, 1, 2...) y las de espín semientero (1/2, 3/2...) obedecen respectivamente a:",
    opciones: [
      "A. Estadística de Boltzmann únicamente",
      "B. Los bosones (espín entero) obedecen la estadística de Bose-Einstein (sin principio de exclusión); los fermiones (espín semientero) obedecen la de Fermi-Dirac (con principio de exclusión de Pauli)",
      "C. Los fermiones son partículas de luz y los bosones partículas con masa",
      "D. Ambas estadísticas son idénticas en todas las temperaturas"
    ],
    correcta: 1,
    explicacion: "Los bosones tienen funciones de onda simétricas ante el intercambio de partículas idénticas y pueden condensar en el mismo estado cuántico (fotones, gluones, bosón de Higgs). Los fermiones tienen funciones antisimétricas y no pueden coexistir en el mismo estado (electrones, quarks, neutrinos)."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Paradoja EPR y Entrelazamiento Cuántico",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En el fenómeno del Entrelazamiento Cuántico (paradójicamente cuestionado por Einstein, Podolsky y Rosen en 1935 como 'acción fantasmal a distancia'):",
    opciones: [
      "A. Se transmite información a velocidad superlumínica violando la causalidad relativista",
      "B. Dos partículas entrelazadas comparten un estado cuántico indivisible conjunto; la medición del estado de una de ellas colapsa instantáneamente el estado de la otra sin importar la distancia física que las separe, sin permitir transmisión de datos útil superlumínica (teorema de no-comunicación)",
      "C. Las partículas se fusionan físicamente en un agujero negro microscópico",
      "D. Es una simple correlación clásica predeterminada idéntica a guardar dos zapatos en cajas separadas"
    ],
    correcta: 1,
    explicacion: "El entrelazamiento es una propiedad no local genuinamente cuántica. Aunque la correlación es instantánea, como el resultado individual de cada medición es intrínsecamente probabilístico, no puede enviarse ninguna señal de comunicación más rápido que la luz."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Teorema de Bell y Alain Aspect",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "Los experimentos pioneros de Alain Aspect en 1982 (Premio Nobel 2022) midieron la correlación de polarización de pares de fotones entrelazados demostrando que:",
    opciones: [
      "A. Las desigualdades de John Bell se cumplen rigurosamente, confirmando las variables ocultas locales de Einstein",
      "B. Las desigualdades de Bell se violan experimentalmente de manera rotunda, descartando definitivamente cualquier teoría de variables ocultas de carácter local y confirmando la mecánica cuántica",
      "C. La polarización de los fotones no existe",
      "D. La física cuántica es una aproximación de la mecánica de fluidos clásica"
    ],
    correcta: 1,
    explicacion: "Bell derivó en 1964 un límite matemático que toda teoría realista local debería satisfacer. Aspect demostró que la naturaleza cuántica viola sistemáticamente esas desigualdades, probando que el universo no puede describirse mediante variables ocultas locales predeterminadas."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Zeeman",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué es el Efecto Zeeman observado en espectroscopía atómica cuando los átomos emisores se sumergen en un campo magnético exterior estático?",
    opciones: [
      "A. La ionización violenta de todos los átomos del gas",
      "B. El desdoblamiento de una única línea espectral en múltiples componentes discretas debido a la interacción magnética del momento dipolar orbital y de espín del electrón con el campo aplicado (ΔE = -μ · B)",
      "C. La desaparición de todas las líneas de emisión",
      "D. El cambio de la carga del núcleo"
    ],
    correcta: 1,
    explicacion: "Pieter Zeeman descubrió en 1896 que en presencia de un campo magnético exterior B, los estados atómicos degenerados con diferente número magnético m_l o m_s adquieren energías ligeramente distintas (acoplamiento Zeeman), dividiendo las líneas espectrales en varios picos."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Reglas de Hund",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Primera Regla de Friedrich Hund para el llenado de orbitales atómicos degenerados en energía (como los tres orbitales 2p) establece que:",
    opciones: [
      "A. Los electrones deben emparejarse en el primer orbital disponible antes de ocupar los demás",
      "B. Los electrones se distribuyen ocupando el mayor número de orbitales individuales posibles con sus espines orientados paralelamente (máxima multiplicidad de espín) antes de empezar a emparejarse",
      "C. Todos los espines deben ser antiparalelos en el mismo orbital",
      "D. Los electrones no pueden tener espín"
    ],
    correcta: 1,
    explicacion: "Al ocupar orbitales separados con espines paralelos, la repulsión electrostática de Coulomb entre electrones se minimiza y la energía de canje cuántico estabiliza el estado fundamental del átomo."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Aharonov-Bohm",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué demostró el célebre Efecto Aharonov-Bohm (1959) sobre los potenciales electromagnéticos A y V en mecánica cuántica?",
    opciones: [
      "A. Que los potenciales electromagnéticos son simples artificios matemáticos sin realidad física",
      "B. Que una partícula cuántica cargada (como un electrón) puede experimentar un desfase físico medible en su función de onda al pasar por una región donde los campos E y B son estrictamente nulos, siempre que el potencial vector magnético A no sea cero",
      "C. Que los imanes superconductores no tienen campo magnético",
      "D. Que los fotones tienen carga eléctrica"
    ],
    correcta: 1,
    explicacion: "En un experimento con un solenoide largo blindado, el campo B fuera es cero, pero el potencial vector A ∮ A·dl = Φ_B no es nulo. Los electrones que pasan por ambos lados experimentan una diferencia de fase cuántica observable: Δφ = (q/ħ) ∮ A·dr, probando la realidad física cuántica de A."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Gato de Schrödinger",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál fue el propósito original del célebre experimento mental del 'Gato de Schrödinger' propuesto por Erwin Schrödinger en 1935?",
    opciones: [
      "A. Demostrar cómo se pueden clonar animales mediante física cuántica",
      "B. Ilustrar las paradojas conceptuales de la interpretación de Copenhague al extrapolar la superposición cuántica microscópica a objetos macroscópicos del mundo real (un gato simultáneamente vivo y muerto)",
      "C. Probar que los venenos radiactivos no son letales",
      "D. Diseñar un nuevo método de refrigeración criogénica"
    ],
    correcta: 1,
    explicacion: "Schrödinger ideó la paradoja para advertir sobre el problema de la medición cuántica: si un átomo radiactivo está en superposición de decaer y no decaer, el mecanismo enlaza la suerte macroscópica del gato a ese estado. Hoy la teoría de la 'decoherencia cuántica' explica cómo la interacción con el entorno destruye la superposición."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Principio de Correspondencia de Bohr",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Principio de Correspondencia formulado por Niels Bohr en 1920 exige que:",
    opciones: [
      "A. Las leyes cuánticas y las de la relatividad general sean idénticas en todas las escalas",
      "B. En el límite en que los números cuánticos son muy grandes (n → ∞, escalas macroscópicas), las predicciones de la mecánica cuántica deben coincidir numéricamente y converger suavemente a las predicciones de la física clásica",
      "C. Toda partícula cuántica deba tener una correspondencia de antimateria",
      "D. La masa del átomo sea igual al número atómico"
    ],
    correcta: 1,
    explicacion: "El principio garantiza que la física clásica es el límite macroscópico natural de la física cuántica: a números cuánticos elevados, la diferencia relativa entre niveles de energía consecutivos se vuelve infinitesimal, reproduciendo un comportamiento continuo aparentemente clásico."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Estructura Fina y Acoplamiento Espín-Órbita",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "La 'Estructura Fina' en los espectros atómicos surge fundamentalmente de correcciones relativistas de Dirac y de:",
    opciones: [
      "A. La interacción entre las moléculas de aire del espectrómetro",
      "B. El acoplamiento espín-órbita: la interacción magnética entre el momento dipolar magnético intrínseco de espín del electrón y el campo magnético generado por su propio movimiento orbital alrededor del núcleo",
      "C. La repulsión gravitatoria del núcleo",
      "D. La presión de radiación solar"
    ],
    correcta: 1,
    explicacion: "En el sistema de referencia del electrón, el núcleo positivo orbita a su alrededor creando un campo magnético B_orb. El espín del electrón interactúa con este campo (hamiltoniano H_so ∝ L · S), desdoblando ligeramente los niveles espectrales con una separación regida por la constante de estructura fina α ≈ 1/137."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Constante de Estructura Fina",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "La constante adimensional de estructura fina α = e² / (4π ε₀ ħ c) ≈ 1 / 137.036 cuantifica en física fundamental:",
    opciones: [
      "A. La relación de masa entre el protón y el neutrón",
      "B. La intensidad intrínseca del acoplamiento de la interacción electromagnética entre partículas cargadas elementales y fotones",
      "C. La velocidad de rotación de las galaxias elípticas",
      "D. El tiempo de decaimiento del protón"
    ],
    correcta: 1,
    explicacion: "Es una de las constantes adimensionales más enigmáticas de la física. Fija la escala del acoplamiento electromagnético en Electrodinámica Cuántica (QED) y determina la velocidad orbital del electrón en el estado fundamental del hidrógeno relativa a la de la luz: v₁/c ≈ α ≈ 1/137."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Efecto Túnel en Fusión Solar",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué el efecto túnel cuántico es absolutamente indispensable para que ocurra la fusión nuclear en el núcleo del Sol?",
    opciones: [
      "A. Porque la temperatura solar es demasiado alta para los protones",
      "B. Porque la temperatura en el centro del Sol (~15 millones de K) es insuficiente para que los protones venzan clásicamente la descomunal repulsión electrostática de Coulomb; solo pueden fusionarse atravesando la barrera mediante efecto túnel cuántico",
      "C. Porque los protones se vuelven negativos en el núcleo solar",
      "D. Para enfriar el núcleo e impedir que explote"
    ],
    correcta: 1,
    explicacion: "Clásicamente, se necesitarían más de 1,000 millones de Kelvin para superar la barrera culombiana de repulsión entre dos protones. Gracias al efecto túnel, existe una probabilidad pequeña pero constante de penetración cuántica a 15 millones de Kelvin, permitiendo que el Sol brille de forma estable durante 10,000 millones de años."
  },
  {
    area: "Física Cuántica y Estructura Atómica",
    subtema: "Fuerzas de Van der Waals Cuánticas",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es el origen físico microscópico de las fuerzas de dispersión de London (un tipo de fuerzas intermoleculares de Van der Waals) entre átomos de gases nobles neutros no polares?",
    opciones: [
      "A. La atracción gravitatoria entre sus núcleos",
      "B. Fluctuaciones cuánticas espontáneas instantáneas en la nube electrónica que generan dipolos eléctricos instantáneos pasajeros, los cuales inducen dipolos sincronizados en átomos vecinos adyacentes",
      "C. Intercambio continuo de gluones",
      "D. Enlaces iónicos permanentes"
    ],
    correcta: 1,
    explicacion: "Aunque en promedio temporal un átomo neutro es esféricamente simétrico, en cualquier instante infinitesimal su densidad de carga fluctúa cuánticamente. Este dipolo instantáneo polariza al átomo contiguo creando una atracción mutua de corto alcance que decae como 1/r⁶."
  }
];
