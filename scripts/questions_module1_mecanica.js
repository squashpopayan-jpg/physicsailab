// Módulo 1: Mecánica Clásica Avanzada, Gravitación, Órbitas y Dinámica Rotacional (30 preguntas)
module.exports = [
  {
    area: "Rotación y Gravitación",
    subtema: "Leyes de Kepler",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "De acuerdo con la Segunda Ley de Kepler (ley de las áreas), ¿en qué punto de su órbita elíptica se desplaza un planeta a su máxima velocidad lineal?",
    opciones: [
      "A. En el afelio, cuando está a la máxima distancia del Sol",
      "B. En el perihelio, cuando se encuentra más próximo al Sol",
      "C. En los semiejes menores de la elipse orbital",
      "D. Su velocidad lineal es rigurosamente constante en toda la órbita"
    ],
    correcta: 1,
    explicacion: "El radio vector Sol-planeta barre áreas iguales en tiempos iguales (dA/dt = L/(2m) = cte). Como el momento angular se conserva, al estar en el perihelio (mínimo r) la velocidad tangencial alcanza su valor máximo."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Leyes de Kepler",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Tercera Ley de Kepler establece que para cualquier planeta del Sistema Solar, el cuadrado de su periodo orbital (T²) es proporcional a:",
    opciones: [
      "A. El cubo de la distancia del semieje mayor de su órbita (a³)",
      "B. El cuadrado de la masa del planeta",
      "C. La raíz cuadrada del radio orbital",
      "D. La excentricidad de la elipse orbital al cuadrado"
    ],
    correcta: 0,
    explicacion: "La 3ª Ley de Kepler formula T² = (4π² / GM) a³, lo que demuestra que el cociente T²/a³ es una constante idéntica para todos los cuerpos que orbitan la misma masa central."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Velocidad de Escape",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es la expresión teórica para la velocidad de escape ve desde la superficie de un cuerpo esférico de masa M y radio R (despreciando la resistencia atmosférica)?",
    opciones: [
      "A. ve = √(GM / R)",
      "B. ve = √(2GM / R)",
      "C. ve = 2GM / R²",
      "D. ve = √(GM / 2R)"
    ],
    correcta: 1,
    explicacion: "Igualando la energía mecánica total a cero en el infinito (1/2 m ve² - GMm/R = 0), se deduce que ve = √(2GM/R). Para la Tierra equivale a aproximadamente 11.2 km/s."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Mecánica Orbital",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué un satélite en órbita geoestacionaria debe ubicarse necesariamente sobre el plano del ecuador terrestre?",
    opciones: [
      "A. Para evitar la radiación de los cinturones de Van Allen",
      "B. Porque solo allí el centro de atracción gravitatoria terrestre coincide con el centro de la órbita circular sin oscilaciones norte-sur",
      "C. Porque la densidad de la atmósfera en el ecuador es menor",
      "D. Por el efecto de repulsión del campo magnético polar"
    ],
    correcta: 1,
    explicacion: "El plano de cualquier órbita inercial debe contener el centro de masa de la Tierra. Si una órbita sincrónica de 24 h estuviese inclinada, el satélite oscilaría periódicamente de norte a sur visto desde el suelo (analema en 8)."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Puntos de Lagrange",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué propiedad geométrica y gravitatoria define al punto de Lagrange L₂ del sistema Sol-Tierra, donde opera el telescopio espacial James Webb?",
    opciones: [
      "A. Está ubicado exactamente entre el Sol y la Tierra a medio camino",
      "B. Está situado en la línea Sol-Tierra detrás de la Tierra a 1.5 millones de km, donde las fuerzas gravitatorias combinadas proporcionan la aceleración centrípeta justa para igualar el periodo terrestre",
      "C. Es el punto donde el campo magnético del Sol anula al de la Tierra",
      "D. Es el vértice de un triángulo equilátero que forma 60° adelante de la Tierra"
    ],
    correcta: 1,
    explicacion: "En L₂, la atracción gravitatoria combinada de la Tierra y el Sol se suma para que un objeto a mayor distancia del Sol complete una órbita en exactamente 1 año, manteniendo constante su alineación respecto al eje Sol-Tierra."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Dinámica Rotacional",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Una esfera sólida y un cilindro sólido de igual masa M y radio R ruedan sin deslizar desde el reposo por el mismo plano inclinado. ¿Cuál llega primero a la base?",
    opciones: [
      "A. Ambos llegan al mismo tiempo porque tienen idéntica masa y radio",
      "B. El cilindro sólido, porque tiene mayor momento de inercia",
      "C. La esfera sólida, porque tiene menor momento de inercia (2/5 MR² vs 1/2 MR²) y destina menor fracción de energía potencial a rotación",
      "D. Depende del ángulo de inclinación del plano"
    ],
    correcta: 2,
    explicacion: "La aceleración en rodadura sin deslizamiento es a = g senθ / (1 + I/(MR²)). Para la esfera I/(MR²) = 0.40, mientras que para el cilindro es 0.50. Al tener menor inercia rotacional, la esfera acelera más y llega primero."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Momento Angular",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Cuando un patinador sobre hielo en rotación encoge sus brazos hacia el torso, su velocidad angular de giro aumenta notablemente. ¿Qué principio físico explica este fenómeno?",
    opciones: [
      "A. Conservación de la energía cinética rotacional únicamente",
      "B. Conservación del momento angular (L = Iω = constante) al reducir su momento de inercia",
      "C. La fuerza de Coriolis generada por el movimiento de sus brazos",
      "D. El rozamiento nulo con el hielo que genera un torque acelerador externo"
    ],
    correcta: 1,
    explicacion: "Al no existir un torque neto externo sobre el patinador (τ_ext = 0), el momento angular L = Iω se conserva. Al acercar masa al eje, el momento de inercia I disminuye, obligando a ω a aumentar en compensación."
  },
  {
    area: "Cinemática Clásica",
    subtema: "Fuerzas Ficticias",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En el hemisferio norte de la Tierra, un proyectil de largo alcance disparado hacia el norte se desvía aparentemente hacia la derecha de su trayectoria. ¿A qué fuerza inercial se atribuye este desvío en el sistema de referencia terrestre?",
    opciones: [
      "A. A la fuerza centrífuga",
      "B. A la aceleración de Euler",
      "C. A la fuerza de Coriolis (F_c = -2m ω × v)",
      "D. Al gradiente de presión atmosférica polar"
    ],
    correcta: 2,
    explicacion: "La fuerza de Coriolis es una fuerza ficticia que surge en sistemas de referencia en rotación cuando un cuerpo posee velocidad v respecto al sistema giratorio: F = -2m(ω × v). En el hemisferio norte desvía trayectorias hacia la derecha."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Péndulo de Foucault",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué demostró históricamente Léon Foucault en 1851 mediante la oscilación de su célebre péndulo esférico en el Panteón de París?",
    opciones: [
      "A. La constancia de la velocidad de la luz en cualquier medio",
      "B. La rotación intrínseca de la Tierra respecto a las estrellas lejanas sin recurrir a observaciones celestes",
      "C. La naturaleza puramente corpuscular de la gravedad",
      "D. La existencia de las corrientes oceánicas profundas"
    ],
    correcta: 1,
    explicacion: "El plano de oscilación del péndulo de Foucault permanece invariante en el espacio inercial mientras la Tierra rota bajo él, haciendo que el plano parezca girar en el marco del observador terrestre con periodo T = 24 h / sen(latitud)."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Fricción y Rozamiento",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué el coeficiente de rozamiento estático (μs) entre dos sólidos suele ser estrictamente mayor que el coeficiente cinético (μk)?",
    opciones: [
      "A. Porque en reposo las micro-asperezas microscópicas tienen tiempo de asentarse y formar micro-soldaduras de contacto íntimo",
      "B. Porque la fuerza normal disminuye tan pronto como el objeto comienza a deslizar",
      "C. Porque en movimiento la temperatura funde por completo las superficies",
      "D. Es un error experimental; en realidad ambos coeficientes son rigurosamente iguales"
    ],
    correcta: 0,
    explicacion: "En reposo, la presión en las asperezas microscópicas favorece la deformación plástica local y la adhesión intermolecular (adhesión de junturas). Al iniciar el deslizamiento, las asperezas saltan y se fracturan continuamente con menor adherencia."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Curvas Peraltadas",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En una pista de carreras con curva circular de radio R diseñada a un ángulo de peralte θ sin necesidad de rozamiento, la rapidez óptima v viene dada por:",
    opciones: [
      "A. v = √(g R tan θ)",
      "B. v = g R cos θ",
      "C. v = √(g R / sin θ)",
      "D. v = 2 g R tan² θ"
    ],
    correcta: 0,
    explicacion: "En ausencia de fricción, la componente vertical de la normal equilibra el peso (N cosθ = mg) y la horizontal suministra la aceleración centrípeta (N senθ = m v²/R). Al dividir miembro a miembro resulta tanθ = v²/(gR), luego v = √(gR tanθ)."
  },
  {
    area: "Trabajo y Energía",
    subtema: "Fuerzas Conservativas",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál de las siguientes condiciones define formalmente a una fuerza conservativa F en el espacio tridimensional?",
    opciones: [
      "A. El trabajo que realiza a lo largo de cualquier trayectoria cerrada es idénticamente cero (∮ F · dr = 0)",
      "B. Su magnitud debe ser inversamente proporcional al tiempo al cuadrado",
      "C. Debe depender exclusivamente de la velocidad instantánea de la partícula",
      "D. Solo puede actuar en una dimensión espacial"
    ],
    correcta: 0,
    explicacion: "Una fuerza es conservativa si su trabajo a lo largo de cualquier curva cerrada es nulo (∮ F · dr = 0), lo que equivale matemáticamente a que su rotacional sea nulo (∇ × F = 0) y provenga del gradiente de una energía potencial (F = -∇U)."
  },
  {
    area: "Trabajo y Energía",
    subtema: "Péndulo Balístico",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En un experimento clásico con péndulo balístico donde un proyectil de masa m se incrusta en un bloque de madera suspendido de masa M:",
    opciones: [
      "A. Se conserva la energía mecánica cinética durante el impacto del proyectil",
      "B. Se conserva el momento lineal durante el impacto instantáneo, pero se disipa energía cinética mecánica en forma de calor y deformación",
      "C. No se conserva ninguna magnitud física hasta que el péndulo alcanza su altura máxima",
      "D. La masa del proyectil desaparece y se transforma en energía electromagnética"
    ],
    correcta: 1,
    explicacion: "La colisión es perfectamente inelástica: las fuerzas internas del choque son enormes en un tiempo brevísimo, por lo que el momento lineal se conserva estrictamente (p_inicial = p_final), pero una gran fracción de energía cinética se degrada en deformación y calor."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Teorema de Steiner",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Teorema de los Ejes Paralelos (o Teorema de Steiner) permite calcular el momento de inercia I de un sólido de masa M respecto a un eje paralelo situado a una distancia d del centro de masa mediante:",
    opciones: [
      "A. I = I_cm - M d²",
      "B. I = I_cm + M d²",
      "C. I = I_cm · d² / M",
      "D. I = √(I_cm² + M² d⁴)"
    ],
    correcta: 1,
    explicacion: "El teorema establece I = I_cm + Md². Demuestra que el momento de inercia respecto al eje que pasa por el centro de masa es siempre el mínimo absoluto entre todos los ejes paralelos de rotación posibles."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Giroscopios y Precesión",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "Cuando un giroscopio simétrico que gira a muy alta velocidad angular ω alrededor de su eje de simetría experimenta un torque gravitacional perpendicular τ, ¿cuál es su comportamiento dinámico?",
    opciones: [
      "A. Cae inmediatamente al suelo de forma idéntica a un cuerpo en reposo",
      "B. Describe una precesión regular donde el eje de giro rota horizontalmente con velocidad angular Ω_p = τ / L",
      "C. Su velocidad angular de giro ω se anula instantáneamente",
      "D. Acelera en caída libre desafiando la conservación de energía"
    ],
    correcta: 1,
    explicacion: "Dado que τ = dL/dt y L = Iω es un vector horizontal grande, el cambio infinitesimal dL es perpendicular a L, obligando al vector momento angular a rotar en un círculo horizontal (precesión giroscópica) con rapidez Ω_p = τ/(Iω)."
  },
  {
    area: "Cinemática Clásica",
    subtema: "Tiro Parabólico",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "En ausencia de resistencia del aire y en terreno plano horizontal, ¿con qué ángulo de elevación respecto al horizonte se obtiene el alcance horizontal máximo para una misma rapidez de disparo inicial?",
    opciones: [
      "A. 30°",
      "B. 45°",
      "C. 60°",
      "D. 90°"
    ],
    correcta: 1,
    explicacion: "El alcance horizontal es R = (v₀² / g) sen(2θ). El valor máximo de la función trigonométrica seno es 1, lo cual ocurre cuando sen(2θ) = 1, es decir, cuando 2θ = 90°, lo que implica θ = 45°."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Velocidad Límite",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Un paracaidista en caída libre alcanza su 'velocidad terminal' o límite cuando:",
    opciones: [
      "A. La aceleración de la gravedad se vuelve cero debido a la gran altitud",
      "B. La fuerza aerodinámica de arrastre hacia arriba iguala en magnitud al peso del paracaidista hacia abajo",
      "C. La energía potencial gravitatoria se agota por completo",
      "D. La densidad del aire se hace infinita"
    ],
    correcta: 1,
    explicacion: "La fuerza neta es F_net = mg - F_arrastre. A medida que la rapidez aumenta, el arrastre aerodinámico crece proporcionalmente a v². Cuando F_arrastre = mg, la fuerza neta es cero, la aceleración se anula y la velocidad se vuelve constante."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Movimiento Armónico Simple",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En un oscilador armónico simple masa-resorte, ¿dónde se alcanza el valor máximo de la aceleración del bloque?",
    opciones: [
      "A. Al pasar exactamente por la posición de equilibrio central (x = 0)",
      "B. En los extremos del recorrido (amplitudes x = ±A) donde la deformación del resorte es máxima",
      "C. En el punto medio entre el equilibrio y el extremo (x = A/2)",
      "D. La aceleración es constante en todo el movimiento oscilatorio"
    ],
    correcta: 1,
    explicacion: "Por la Ley de Hooke y la 2ª Ley de Newton, a = -(k/m)x = -ω²x. La aceleración es proporcional al desplazamiento respecto al equilibrio, alcanzando su magnitud máxima |a_max| = ω²A en los puntos de máxima elongación x = ±A."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Péndulo Físico",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es el periodo T de pequeñas oscilaciones de un péndulo físico (o compuesto) de masa total M y momento de inercia I respecto al eje de suspensión, cuyo centro de masa dista d de dicho eje?",
    opciones: [
      "A. T = 2π √(I / (M g d))",
      "B. T = 2π √(M g d / I)",
      "C. T = 2π √(I / M)",
      "D. T = 2π √(d / g)"
    ],
    correcta: 0,
    explicacion: "La ecuación diferencial del péndulo compuesto para ángulos pequeños es I d²θ/dt² + Mgd θ = 0, cuya frecuencia natural es ω = √(Mgd/I). Por tanto, el periodo es T = 2π/ω = 2π √(I/(Mgd))."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Resonancia Mecánica",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué ocurre físicamente cuando la frecuencia de una fuerza excitadora externa coincide con la frecuencia natural propia de un sistema oscilatorio con poco amortiguamiento?",
    opciones: [
      "A. La oscilación se extingue instantáneamente debido a interferencia destructiva",
      "B. Se produce el fenómeno de resonancia, con una transferencia óptima de energía que maximiza la amplitud de oscilación",
      "C. El sistema cambia permanentemente su masa inercial",
      "D. La velocidad de propagación de las ondas internas se reduce a cero"
    ],
    correcta: 1,
    explicacion: "En resonancia, la fuerza externa empuja en fase con la velocidad del oscilador en cada ciclo, maximizando la potencia transferida y generando amplitudes muy elevadas que en ingeniería pueden causar fallas estructurales."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Fuerzas de Marea",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué se producen dos mareas altas oceánicas por día en un punto dado de la Tierra y no solo una?",
    opciones: [
      "A. Porque la Luna orbita la Tierra dos veces al día",
      "B. Por el gradiente gravitatorio diferencial: la Luna atrae más fuertemente el agua del lado cercano que al centro terrestre, y atrae más al centro terrestre que al agua del lado opuesto",
      "C. Por la reflexión de las ondas oceánicas en las costas continentales",
      "D. Por la interacción directa entre los vientos alisios y el campo magnético"
    ],
    correcta: 1,
    explicacion: "La fuerza de marea es una fuerza diferencial que decae con el cubo de la distancia (dF/dr ∝ 1/r³). Estira la Tierra a lo largo del eje Tierra-Luna, creando dos protuberancias o abultamientos opuestos simultáneos."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Momento de Inercia",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el momento de inercia de un anillo circular delgado (aro) de masa M y radio R respecto a su eje central perpendicular al plano del aro?",
    opciones: [
      "A. I = 1/2 M R²",
      "B. I = M R²",
      "C. I = 2/5 M R²",
      "D. I = 1/12 M R²"
    ],
    correcta: 1,
    explicacion: "En un aro delgado, todos y cada uno de los elementos de masa dm se encuentran exactamente a la misma distancia R del eje de rotación, de modo que I = ∫ r² dm = R² ∫ dm = M R²."
  },
  {
    area: "Trabajo y Energía",
    subtema: "Conservación de Energía",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Una partícula con energía mecánica total E se mueve en una región donde la función de energía potencial es U(x). ¿Qué caracteriza a los 'puntos de retorno' del movimiento?",
    opciones: [
      "A. Son los puntos donde U(x) alcanza su mínimo absoluto",
      "B. Son las posiciones donde E = U(x), lo que anula la energía cinética y obliga a la partícula a invertir el sentido de su velocidad",
      "C. Son los puntos donde la aceleración es necesariamente nula",
      "D. Son puntos donde la fuerza es infinita"
    ],
    correcta: 1,
    explicacion: "Como la energía mecánica es E = K + U(x), la energía cinética es K = E - U(x). La partícula no puede penetrar en regiones donde U(x) > E (regiones clásicamente prohibidas). Donde U(x) = E, K = 0 (v = 0), invirtiéndose el movimiento."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Leyes de Newton",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Un caballo tira hacia adelante de una carreta con una fuerza de 500 N. Por la Tercera Ley de Newton, la carreta ejerce sobre el caballo una fuerza de 500 N hacia atrás. ¿Por qué el conjunto logra acelerar hacia adelante?",
    opciones: [
      "A. Porque la 3ª Ley de Newton no se aplica cuando los objetos están en movimiento",
      "B. Porque las dos fuerzas del par acción-reacción actúan sobre cuerpos diferentes y la fuerza externa hacia adelante del suelo sobre los cascos del caballo supera a la fricción de las ruedas",
      "C. Porque la fuerza del caballo es ligeramente mayor que la de la carreta en una milésima de segundo inicial",
      "D. Porque la inercia del caballo anula instantáneamente la fuerza de reacción"
    ],
    correcta: 1,
    explicacion: "Las fuerzas de acción y reacción nunca se anulan entre sí porque actúan sobre cuerpos distintos. El sistema caballo-carreta acelera porque la fuerza externa ejercida por el suelo sobre los cascos del caballo hacia adelante supera el rozamiento de las ruedas."
  },
  {
    area: "Cinemática Clásica",
    subtema: "Movimiento Circular",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En un Movimiento Circular Uniforme (MCU) con radio R constante y rapidez escalar v constante, ¿cuál de las siguientes afirmaciones es rigurosamente correcta?",
    opciones: [
      "A. La aceleración es cero porque la rapidez permanece inmutable",
      "B. La velocidad tangencial es constante como vector",
      "C. Existe una aceleración centrípeta no nula de magnitud a_c = v² / R orientada permanentemente hacia el centro de la trayectoria",
      "D. El vector aceleración es colineal con el vector velocidad tangencial"
    ],
    correcta: 2,
    explicacion: "Aunque la magnitud de la velocidad (rapidez) es constante, la dirección del vector velocidad cambia continuamente. Esta variación temporal de dirección requiere una aceleración perpendicular a la velocidad: a_c = v²/R apuntando al centro."
  },
  {
    area: "Dinámica y Fuerzas",
    subtema: "Centro de Masa",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Si sobre un sistema cerrado de partículas la resultante de todas las fuerzas externas es nula (F_ext = 0), ¿cómo se mueve el centro de masa del sistema?",
    opciones: [
      "A. Permanece en reposo o continúa en movimiento rectilíneo uniforme con velocidad vectorial constante",
      "B. Debe rotar necesariamente con momento angular creciente",
      "C. Describe una elipse alrededor del cuerpo de mayor masa",
      "D. Oscila armónicamente alrededor de su origen de coordenadas"
    ],
    correcta: 0,
    explicacion: "Por la 2ª Ley de Newton para sistemas de partículas, F_ext_total = M_total · a_cm. Si F_ext_total = 0, entonces a_cm = 0, lo que significa que la velocidad del centro de masa v_cm es estrictamente constante."
  },
  {
    area: "Trabajo y Energía",
    subtema: "Colisiones en Dos Dimensiones",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En una colisión elástica oblicua (no frontal) entre dos partículas de idéntica masa, estando una de ellas inicialmente en reposo, ¿qué ángulo forman entre sí sus trayectorias tras el choque?",
    opciones: [
      "A. 45°",
      "B. 90° (ortogonales entre sí)",
      "C. 180°",
      "D. Depende de las densidades volumétricas de los materiales"
    ],
    correcta: 1,
    explicacion: "Conservando momento (v₀ = v₁ + v₂) y energía cinética (v₀² = v₁² + v₂²), se eleva la primera al cuadrado escalar: v₀² = v₁² + v₂² + 2(v₁ · v₂). Igualando ambas se concluye que v₁ · v₂ = 0, por lo que forman un ángulo recto de 90°."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Límite de Roche",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué fenómeno astrofísico define el 'Límite de Roche' para un satélite natural que orbita un planeta masivo?",
    opciones: [
      "A. La distancia mínima a la que el satélite puede mantener su atmósfera sin que escape al espacio",
      "B. La distancia orbital crítica a partir de la cual las fuerzas de marea gravitacionales del planeta superan a la propia auto-gravedad del satélite, desintegrándolo en fragmentos",
      "C. El radio donde la velocidad orbital iguala a la velocidad de la luz",
      "D. La altitud donde el satélite se vuelve visible a simple vista desde el polo del planeta"
    ],
    correcta: 1,
    explicacion: "Dentro del límite de Roche, la fuerza de marea del cuerpo primario supera la atracción gravitatoria que mantiene cohesionado al satélite, rompiéndolo y generando típicamente sistemas de anillos planetarios como los de Saturno."
  },
  {
    area: "Cinemática Clásica",
    subtema: "Velocidad Relativa Clásica",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Un bote navega corriente abajo (a favor de la corriente) por un río cuya agua se mueve a 3 m/s respecto a la orilla. Si el velocímetro del bote marca 7 m/s respecto al agua, ¿cuál es su velocidad respecto a la orilla?",
    opciones: [
      "A. 4 m/s",
      "B. 7 m/s",
      "C. 10 m/s",
      "D. 21 m/s"
    ],
    correcta: 2,
    explicacion: "Por adición vectorial galileana de velocidades unidimensionales: v_bote/orilla = v_bote/agua + v_agua/orilla = 7 m/s + 3 m/s = 10 m/s."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Momento de Torsión y Equilibrio",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Para que un cuerpo rígido extendido se encuentre en equilibrio estático mecánico completo, deben cumplirse simultáneamente dos condiciones independientes:",
    opciones: [
      "A. Fuerza neta nula (∑ F = 0) y momento de torsión neto nulo respecto a cualquier punto (∑ τ = 0)",
      "B. Energía potencial mínima y aceleración angular máxima",
      "C. Velocidad constante no nula y rozamiento nulo",
      "D. Masa total nula y centro de gravedad en el infinito"
    ],
    correcta: 0,
    explicacion: "El equilibrio estático exige ausencia de aceleración traslacional (∑ F = 0) y ausencia de aceleración angular rotacional (∑ τ = 0) respecto a cualquier eje de referencia."
  }
];
