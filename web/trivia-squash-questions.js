/**
 * BANCO OFICIAL DE PREGUNTAS: LA GRAN TRIVIA DE SQUASH
 * Plataforma Universitaria PhysicsAILab
 * 
 * Contenido: 500 preguntas únicas y estructuradas sobre squash profesional:
 *  - Reglamento Oficial WSF y Arbitraje
 *  - Física, Termodinámica y Rebote de la Pelota
 *  - Geometría, Dimensiones y Especificaciones de la Cancha
 *  - Técnica de Golpeo, Biomecánica y Cadenas Cinéticas
 *  - Estrategia, Táctica y Control de la T
 *  - Equipamiento: Raquetas, Cuerdas, Grip y Calzado
 *  - Leyendas, Campeones Mundiales y Récords Históricos
 *  - Squash Colombiano y Sudamericano
 *  - Historia, Origen, PSA World Tour y Juegos Olímpicos LA28
 *  - Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición
 */

window.TRIVIA_SQUASH_QUESTIONS = [
  {
    "id": 1,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Puntuación PARS",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A cuántos puntos se disputa oficialmente un game en el sistema PARS (Point-A-Rally Scoring)?",
    "opciones": [
      "A. A 9 puntos directos (sistema tradicional hand-in)",
      "B. A 11 puntos (con ventaja obligatoria de 2 en caso de empate a 10)",
      "C. A 15 puntos corridos sin muerte súbita",
      "D. A 21 puntos como en tenis de mesa"
    ],
    "correcta": 1,
    "explicacion": "El reglamento mundial WSF y el tour PSA juegan en formato PARS a 11 puntos, requiriendo 2 de ventaja ante empates 10-10."
  },
  {
    "id": 2,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Líneas de la Cancha",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si la pelota de squash golpea la línea roja superior en la pared frontal o lateral, el tiro se considera:",
    "opciones": [
      "A. Pelota BUENA (In): la línea forma parte de la cancha",
      "B. Let automático",
      "C. Pelota FUERA (Out): a diferencia del tenis, tocar la línea es falta",
      "D. Válida solo en la pared frontal"
    ],
    "correcta": 2,
    "explicacion": "En squash, todas las líneas son fuera de la superficie de juego; cualquier contacto con la línea es out."
  },
  {
    "id": 3,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "El Tin (Chapa)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué ocurre si la pelota impacta la chapa metálica inferior (Tin) de la pared frontal?",
    "opciones": [
      "A. El punto continúa si rebota con fuerza hacia el piso",
      "B. Se repite el punto por Let",
      "C. Resta un punto pero sigue el rally",
      "D. Se canta 'Down' (falta) y el jugador que ejecutó el golpe pierde el punto"
    ],
    "correcta": 3,
    "explicacion": "El Tin es el límite inferior de la pared frontal; cualquier impacto en él significa pérdida inmediata del punto."
  },
  {
    "id": 4,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Ubicación en el Saque",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Al momento de impactar la pelota en el servicio, ¿dónde debe estar situado el pie del servidor?",
    "opciones": [
      "A. Con al menos una parte de un pie tocando el piso dentro de la caja de saque sin tocar las líneas delimitadoras",
      "B. Con ambos pies completamente contenidos en el centro de la caja",
      "C. Detrás de la línea corta en cualquier punto",
      "D. Con un pie sobre la línea de media cancha"
    ],
    "correcta": 0,
    "explicacion": "El servidor debe tener al menos un pie en el piso dentro de la caja de saque sin pisar ninguna línea perimetral."
  },
  {
    "id": 5,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Trayectoria Válida del Saque",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Hacia dónde debe dirigirse reglamentariamente el saque tras tocar la pared frontal?",
    "opciones": [
      "A. Por debajo de la línea de saque directo a la caja del rival",
      "B. Por encima de la línea de saque (cut line) y caer en el cuarto trasero opuesto de la cancha",
      "C. A la pared lateral antes de tocar la frontal",
      "D. Entre el tin y la línea de saque"
    ],
    "correcta": 1,
    "explicacion": "El saque debe golpear la pared frontal por encima de la línea de servicio y picar en el cuarto trasero contrario (si no es voleado)."
  },
  {
    "id": 6,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Concesión de STROKE",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué situación el árbitro concede obligatoriamente un STROKE (punto directo al tirador)?",
    "opciones": [
      "A. Cuando el jugador golpea suavemente al oponente en un drop",
      "B. Cuando el oponente hace todo el esfuerzo y el tiro iba a pared lateral",
      "C. Cuando el oponente obstruye la trayectoria directa de la pelota hacia la pared frontal o impide el swing",
      "D. Si la pelota se rompe durante el punto"
    ],
    "correcta": 2,
    "explicacion": "Si el oponente interfiere impidiendo el swing o bloquea el camino directo hacia la pared frontal, la decisión es Stroke."
  },
  {
    "id": 7,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Concesión de LET",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuándo debe concederse un LET (repetición del punto)?",
    "opciones": [
      "A. Cuando el jugador no alcanza la pelota por fatiga física",
      "B. Cuando la pelota golpea la chapa metálica",
      "C. Cuando un jugador pide agua durante el rally",
      "D. Cuando el jugador se abstiene de golpear por temor razonable a impactar al rival con la raqueta o la pelota"
    ],
    "correcta": 3,
    "explicacion": "Por seguridad, si el jugador se frena para no golpear a su oponente teniendo tiro legal factible, se otorga Let."
  },
  {
    "id": 8,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Decisión de NO LET",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué motivo el árbitro determina 'NO LET' ante una solicitud de interferencia?",
    "opciones": [
      "A. Porque el jugador no habría alcanzado la pelota aun sin interferencia, o creó el contacto de forma antinatural",
      "B. Porque el jugador ya ganó el game anterior",
      "C. Porque el oponente se disculpó formalmente",
      "D. Porque el rally duró más de 50 golpes"
    ],
    "correcta": 0,
    "explicacion": "Se canta No Let si la pelota era inalcanzable, no hubo esfuerzo genuino, o el jugador fabricó la obstrucción."
  },
  {
    "id": 9,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Infracción de Turning (Giro)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué consiste la infracción de 'Turning' (Giro) en el reglamento de squash?",
    "opciones": [
      "A. Cambiar la raqueta de mano durante el golpe",
      "B. Seguir la pelota alrededor del propio cuerpo y golpearla; si impacta al oponente es Stroke en contra del tirador",
      "C. Girar sobre la T para festejar un punto ganado",
      "D. Efectuar un saque mirando hacia la pared trasera"
    ],
    "correcta": 1,
    "explicacion": "El turning genera un riesgo grave; si el jugador gira sobre la bola y golpea al oponente, comete falta (Stroke en contra)."
  },
  {
    "id": 10,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Pelota Rota en Juego",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si la pelota se rompe o fisura durante el transcurso de un rally:",
    "opciones": [
      "A. El punto se otorga al último que golpeó",
      "B. El servidor pierde el punto automáticamente",
      "C. Se concede un Let obligatorio y se reemplaza la pelota permitiendo calentarla",
      "D. Se continúa jugando con la pelota rota hasta el final del game"
    ],
    "correcta": 2,
    "explicacion": "La rotura de pelota anula el rally en curso; se entrega una pelota nueva y se otorga Let reglamentario."
  },
  {
    "id": 11,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Tiempo de Calentamiento",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuánto dura el calentamiento conjunto oficial en cancha antes de iniciar el partido?",
    "opciones": [
      "A. 10 minutos libres",
      "B. Solo 1 minuto por jugador",
      "C. 8 minutos en total",
      "D. 4 minutos en total (2 minutos por lado con aviso a la mitad)"
    ],
    "correcta": 3,
    "explicacion": "El árbitro cronometra 4 minutos en total, avisando el cambio de lado obligatoriamente a los 2 minutos."
  },
  {
    "id": 12,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Descanso entre Games",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el tiempo reglamentario de descanso entre el fin de un game y el inicio del siguiente?",
    "opciones": [
      "A. 90 segundos",
      "B. 30 segundos",
      "C. 3 minutos",
      "D. 2 minutos"
    ],
    "correcta": 0,
    "explicacion": "Los jugadores disponen de 90 segundos entre games para hidratación, toalla y charla táctica con el entrenador."
  },
  {
    "id": 13,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Formato al Mejor de Games",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿A cuántos games se disputan los partidos oficiales del circuito profesional PSA World Tour?",
    "opciones": [
      "A. Al mejor de 3 games siempre",
      "B. Al mejor de 5 games (el primero en ganar 3 games gana el partido)",
      "C. A un único game a 30 puntos",
      "D. A 4 games con empate a 2"
    ],
    "correcta": 1,
    "explicacion": "En todos los eventos oficiales PSA principales, los encuentros se definen al mejor de 5 games (Best of 5)."
  },
  {
    "id": 14,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Elección de Caja al Recuperar Saque",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando un receptor gana el rally y pasa a servir (hand-out), ¿desde qué caja saca?",
    "opciones": [
      "A. Debe sacar siempre desde la derecha",
      "B. Debe sacar desde donde cayó la última pelota",
      "C. Puede elegir libremente comenzar desde la caja izquierda o la derecha",
      "D. Por sorteo de moneda"
    ],
    "correcta": 2,
    "explicacion": "Al ganar el servicio, el jugador tiene derecho a elegir la caja de inicio que considere tácticamente más favorable."
  },
  {
    "id": 15,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Alternancia de Caja en Saque",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Mientras el servidor conserve el saque al encadenar puntos consecutivos:",
    "opciones": [
      "A. Puede permanecer siempre en la misma caja",
      "B. Debe sacar desde el centro de la cancha",
      "C. Solo cambia si el oponente lo solicita",
      "D. Debe alternar obligatoriamente de caja de saque en cada punto"
    ],
    "correcta": 3,
    "explicacion": "La alternancia de cajas en saques consecutivos es un principio estricto del reglamento de squash."
  },
  {
    "id": 16,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Protocolo de Sangre",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué tiempo de detención se otorga a un jugador con una herida que sangra activamente en cancha?",
    "opciones": [
      "A. Hasta 15 minutos para detener la hemorragia y cubrir la herida completamente",
      "B. 30 segundos como máximo",
      "C. Pérdida inmediata del partido",
      "D. 1 hora en el vestuario"
    ],
    "correcta": 0,
    "explicacion": "Por bioseguridad, no se permite sangre en cancha; el jugador cuenta con 15 minutos de recuperación médica."
  },
  {
    "id": 17,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Uso de Dos Manos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Es legal sujetar la raqueta de squash con ambas manos para golpear la pelota?",
    "opciones": [
      "A. No, se sanciona con falta de servicio",
      "B. Sí, es completamente legal según las reglas oficiales de la WSF",
      "C. Solo en el revés pero jamás en el drive",
      "D. Solo si se presenta certificado médico"
    ],
    "correcta": 1,
    "explicacion": "El reglamento de squash no limita el número de manos en la empuñadura; golpear a dos manos es totalmente legal."
  },
  {
    "id": 18,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Caída de Raqueta",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la raqueta se le cae al piso a un jugador durante un punto activo:",
    "opciones": [
      "A. Pierde el punto de forma automática",
      "B. El árbitro canta Let obligatorio",
      "C. Puede recogerla y continuar jugando, siempre que no cometa interferencia ni toque la bola con la mano",
      "D. El oponente debe tirar su raqueta también"
    ],
    "correcta": 2,
    "explicacion": "Un competidor puede recuperar su raqueta y seguir en el punto si no crea peligro o interferencia al rival."
  },
  {
    "id": 19,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Pelota Directa al Rival",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la pelota golpeada se dirigía directamente a la pared frontal e impacta en el cuerpo del oponente:",
    "opciones": [
      "A. Es falta del tirador por juego peligroso",
      "B. Se canta Let de cortesía",
      "C. El punto continúa sin parar",
      "D. Es STROKE a favor del jugador que ejecutó el golpe"
    ],
    "correcta": 3,
    "explicacion": "Cualquier tiro directo a la frontal interceptado por el cuerpo del rival es Stroke indiscutible al tirador."
  },
  {
    "id": 20,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Pelota a Pared Lateral que Toca al Rival",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si la pelota golpeada iba hacia una pared lateral y en su camino toca al oponente:",
    "opciones": [
      "A. Se concede un LET, salvo que fuera un tiro ganador terminal incuestionable",
      "B. Es Stroke automático en contra del oponente",
      "C. Es falta técnica y pérdida de servicio",
      "D. Punto directo al oponente"
    ],
    "correcta": 0,
    "explicacion": "Si la bola toca al oponente pero su trayectoria era hacia pared lateral, la regla estándar dicta Let."
  },
  {
    "id": 21,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Doble Bote o Toque (Not Up)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué significa la voz arbitral 'Not Up'?",
    "opciones": [
      "A. Que el saque fue demasiado alto",
      "B. Que la pelota botó dos veces en el suelo antes del golpe o hubo doble contacto con la raqueta",
      "C. Que el jugador no subió a la T",
      "D. Que se acabó el tiempo de descanso"
    ],
    "correcta": 1,
    "explicacion": "'Not Up' declara que la pelota no fue devuelta limpiamente de acuerdo con el reglamento."
  },
  {
    "id": 22,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "La Voz 'Down'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuándo utiliza el árbitro la voz oficial de 'Down'?",
    "opciones": [
      "A. Cuando un jugador resbala en el piso",
      "B. Cuando el saque cae fuera de la caja",
      "C. Cuando la pelota golpea la chapa metálica (tin) o toca el suelo antes de la pared frontal",
      "D. Al finalizar el partido"
    ],
    "correcta": 2,
    "explicacion": "'Down' señala que el impacto en la frontal fue en el tin o que la pelota botó en el suelo antes de alcanzar la pared."
  },
  {
    "id": 23,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "La Voz 'Out'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué circunstancia el árbitro dictamina 'Out'?",
    "opciones": [
      "A. Cuando el público grita durante el saque",
      "B. Cuando el servidor comete falta de pie",
      "C. Cuando se acaba el calentamiento",
      "D. Cuando la pelota golpea la línea superior de falta o sobrepasa cualquier pared fuera del perímetro"
    ],
    "correcta": 3,
    "explicacion": "'Out' indica que la pelota abandonó los límites reglamentarios superiores de la cancha."
  },
  {
    "id": 24,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Falta de Pie (Foot Fault)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué constituye una falta de pie en el saque de squash?",
    "opciones": [
      "A. Pisar cualquiera de las líneas de la caja de saque o no tener al menos parte de un pie dentro",
      "B. Tener los dos pies en el aire sin tocar el piso",
      "C. Mover el pie después del impacto",
      "D. Usar zapatillas de color blanco"
    ],
    "correcta": 0,
    "explicacion": "En squash, las líneas de la caja son zona de falta; cualquier contacto con ellas es Foot Fault."
  },
  {
    "id": 25,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Segundo Saque Inexistente",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "A diferencia del tenis de campo, en el squash:",
    "opciones": [
      "A. Se permiten 3 intentos de servicio",
      "B. NO existe segundo saque: cualquier fallo en el servicio concede el punto al receptor",
      "C. Siempre se repite el primer fallo",
      "D. El receptor decide si concede repetición"
    ],
    "correcta": 1,
    "explicacion": "En squash no hay segundo saque; errar el saque es pérdida instantánea del punto."
  },
  {
    "id": 26,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Lanzar la Pelota sin Golpear",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si el servidor lanza la pelota al aire para sacar pero no inicia el swing y la atrapa o la deja caer:",
    "opciones": [
      "A. Pierde el punto de forma automática",
      "B. Recibe una advertencia de conducta",
      "C. Puede reiniciar el saque sin penalización",
      "D. Debe cambiar de caja"
    ],
    "correcta": 2,
    "explicacion": "Si no hubo tentativa de golpeo ni inicio del swing hacia la bola, el jugador puede reacomodar el saque."
  },
  {
    "id": 27,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Escala de Conducta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la jerarquía progresiva de sanciones arbitrales por conducta antideportiva?",
    "opciones": [
      "A. Tarjeta Amarilla ➔ Tarjeta Roja ➔ Expulsión",
      "B. Multa ➔ Suspensión por 3 games",
      "C. Repetición ➔ Advertencia verbal",
      "D. Conduct Warning ➔ Conduct Stroke ➔ Conduct Game ➔ Conduct Match"
    ],
    "correcta": 3,
    "explicacion": "La WSF establece Warning, Stroke (punto en contra), Game y Match (descalificación del partido)."
  },
  {
    "id": 28,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Lanzamiento de Raqueta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si un jugador lanza su raqueta hacia la pelota para intentar alcanzar un tiro:",
    "opciones": [
      "A. El tiro es inválido, pierde el punto y puede ser sancionado disciplinariamente",
      "B. El tiro vale si supera la chapa",
      "C. Se otorga Let de cortesía",
      "D. El punto vale doble si acierta"
    ],
    "correcta": 0,
    "explicacion": "La raqueta debe estar firmemente empuñada; arrojarla es antirreglamentario y peligroso."
  },
  {
    "id": 29,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Protección Ocular Juniors",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Para qué jugadores es obligatoria la protección ocular homologada según la WSF?",
    "opciones": [
      "A. Solo para mayores de 60 años",
      "B. Para todas las categorías Juniors (U19) y en cualquier modalidad de dobles",
      "C. Para todos los profesionales del Top 10",
      "D. Solo para quienes usen pelota de punto azul"
    ],
    "correcta": 1,
    "explicacion": "La protección ocular de policarbonato es de uso obligatorio para menores de 19 años y en dobles."
  },
  {
    "id": 30,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Video Review en PSA",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En torneos PSA con Video Review, ¿cuántas revisiones incorrectas tiene cada jugador?",
    "opciones": [
      "A. Tres por partido fijas",
      "B. Revisiones ilimitadas",
      "C. Una revisión incorrecta por game (si acierta la conserva)",
      "D. Solo una por partido"
    ],
    "correcta": 2,
    "explicacion": "Cada competidor dispone de una revisión fallida por game; mientras sus apelaciones prosperen, mantiene el derecho."
  },
  {
    "id": 31,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Rebote en Pared Trasera y Piso",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si la pelota toca la pared frontal, luego la trasera de cristal sin botar, y luego pica en el piso:",
    "opciones": [
      "A. Es falta porque debe picar antes en el piso",
      "B. Se declara tiro muerto y Let",
      "C. Otorga 2 puntos de bonificación",
      "D. El tiro es completamente legal y la pelota continúa en juego"
    ],
    "correcta": 3,
    "explicacion": "La pelota puede apoyarse en la pared trasera antes o después de botar siempre que no toque las líneas de falta."
  },
  {
    "id": 32,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Toque con el Cuerpo (Touched)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si la pelota en juego roza la camiseta o el cuerpo de un jugador antes de ser golpeada:",
    "opciones": [
      "A. Pierde el punto de inmediato ('Touched')",
      "B. Continúa si no sacó ventaja",
      "C. Se canta Let si fue involuntario",
      "D. Se descuenta medio punto"
    ],
    "correcta": 0,
    "explicacion": "Cualquier contacto con la indumentaria o cuerpo del jugador en juego es falta inmediata ('Touched')."
  },
  {
    "id": 33,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Backwall Boast",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Golpear la pelota intencionalmente contra la pared trasera para que luego viaje a la frontal:",
    "opciones": [
      "A. Es falta porque solo se puede golpear hacia adelante",
      "B. Es un tiro completamente válido y reglamentario ('Backwall Boast')",
      "C. Se sanciona con Stroke por peligro",
      "D. Solo se permite en veteranos"
    ],
    "correcta": 1,
    "explicacion": "El 'Backwall Boast' es un tiro defensivo clásico y plenamente permitido en el reglamento internacional."
  },
  {
    "id": 34,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Obstrucción Visual Deliberada",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si el oponente se interpone deliberadamente para tapar la visión de la pelota antes del golpe:",
    "opciones": [
      "A. Es una táctica permitida",
      "B. Es descalificación automática",
      "C. Es una interferencia sancionable con Let o Stroke",
      "D. Se detiene el partido 10 minutos"
    ],
    "correcta": 2,
    "explicacion": "El jugador tiene derecho a una línea de visión despejada de la pelota al preparar su golpeo."
  },
  {
    "id": 35,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Demora en el Servicio",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Secarse el sudor reiteradamente fuera de los tiempos para demorar el saque amerita:",
    "opciones": [
      "A. Pérdida de 5 puntos en el game",
      "B. El oponente saca en su lugar",
      "C. Apagado de luces de la cancha",
      "D. Advertencia por pérdida de tiempo y posterior Conduct Stroke si reincide"
    ],
    "correcta": 3,
    "explicacion": "El juego debe ser continuo; las demoras deliberadas entre puntos conllevan sanciones de conducta."
  },
  {
    "id": 36,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Color de Pelota en Vidrio",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En canchas panorámicas de cristal ('All-Glass Show Court'), la pelota oficial de TV suele ser:",
    "opciones": [
      "A. Blanca con punto verde o amarillo para máximo contraste en pantalla",
      "B. Negra tradicional",
      "C. Naranja fluorescente",
      "D. Amarilla de tenis"
    ],
    "correcta": 0,
    "explicacion": "La pelota blanca homologada por Dunlop ofrece el contraste visual óptimo contra paredes de vidrio oscuro."
  },
  {
    "id": 37,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Corrección Arbitral",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Puede el árbitro enmendar una decisión si percibe que cometió un error manifiesto?",
    "opciones": [
      "A. No, las decisiones son irrevocables en el acto",
      "B. Sí, el árbitro puede rectificar su fallo para impartir justicia reglamentaria",
      "C. Solo si el público vota",
      "D. Solo con firma de los jugadores"
    ],
    "correcta": 1,
    "explicacion": "El árbitro principal tiene la potestad de corregir de inmediato una decisión errónea antes del siguiente servicio."
  },
  {
    "id": 38,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Sistema de Tres Árbitros",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se dirimen las apelaciones en el sistema de tres árbitros oficial?",
    "opciones": [
      "A. El árbitro central siempre tiene veto total",
      "B. Cada árbitro decide un game",
      "C. Por votación mayoritaria (2 de 3 votos deciden si es Let, Stroke o No Let)",
      "D. Por sorteo si hay discrepancia"
    ],
    "correcta": 2,
    "explicacion": "La mayoría simple de los 3 jueces acreditados (central y dos laterales) define el veredicto arbitral."
  },
  {
    "id": 39,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Desempate a 10-10",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Al llegar al empate 10-10 en un game con sistema PARS, el ganador debe:",
    "opciones": [
      "A. Ganar el punto número 11 de forma inmediata",
      "B. Jugar un mini-game a 5 puntos",
      "C. Tirar la raqueta a la pared",
      "D. Obtener una ventaja de 2 puntos continuos (ej: 12-10, 13-11)"
    ],
    "correcta": 3,
    "explicacion": "El reglamento PARS no tiene tope de muerte súbita; se juega hasta que haya dos puntos de diferencia."
  },
  {
    "id": 40,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Ajuste de Indumentaria",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si a un jugador se le desata un cordón durante el punto:",
    "opciones": [
      "A. Debe esperar a que termine el rally para solicitar ajustarlo",
      "B. El árbitro detiene el punto y otorga Let",
      "C. El rival debe esperar 5 minutos",
      "D. Pierde el game de inmediato"
    ],
    "correcta": 0,
    "explicacion": "Ningún jugador puede interrumpir un rally en curso por causas de calzado o indumentaria personal."
  },
  {
    "id": 41,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Pisar Línea de la Caja",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Pisar milimétricamente la línea roja de la caja de servicio al sacar constituye:",
    "opciones": [
      "A. Tiro válido si la pelota entra",
      "B. Falta de pie ('Foot Fault') y pérdida del servicio",
      "C. Let de cortesía",
      "D. Falta solo si ambos pies están fuera"
    ],
    "correcta": 1,
    "explicacion": "Las líneas de la caja son de falta; rozarlas con el pie de apoyo al servir anula el servicio."
  },
  {
    "id": 42,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Boast a Pared Lateral Primero",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Golpear la pelota a la pared lateral antes de que llegue a la frontal es:",
    "opciones": [
      "A. Prohibido por reglamento",
      "B. Permitido solo en el saque",
      "C. Completamente legal siempre que alcance la frontal sin picar en el suelo",
      "D. Permitido solo si el rival está atrás"
    ],
    "correcta": 2,
    "explicacion": "El boast es un tiro canónico del squash que aprovecha las paredes laterales para cambiar la geometría del rally."
  },
  {
    "id": 43,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Malla Superior o Techo",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si la pelota roza una viga del techo o malla de protección superior:",
    "opciones": [
      "A. Continúa si cae en la cancha",
      "B. Se repite el punto",
      "C. Vale doble para el receptor",
      "D. Se canta 'Out' inmediatamente por salir del perímetro de juego"
    ],
    "correcta": 3,
    "explicacion": "Cualquier contacto con elementos estructurales fuera de las líneas rojas de pared es fuera ('Out')."
  },
  {
    "id": 44,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Giro sin Golpe por Precaución",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si un jugador hace 'Turning' pero se abstiene de tirar para no lastimar al rival:",
    "opciones": [
      "A. Se concede un LET en favor de la seguridad de ambos deportistas",
      "B. Se concede Stroke en contra",
      "C. Pierde el punto",
      "D. Recibe una falta técnica"
    ],
    "correcta": 0,
    "explicacion": "La renuncia responsable al tiro tras girar premia la seguridad con la repetición del punto mediante Let."
  },
  {
    "id": 45,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Puerta Abierta en el Rally",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si la puerta de la cancha se abre accidentalmente durante un rally:",
    "opciones": [
      "A. Pierde el punto quien golpeó",
      "B. Se suspende el juego de inmediato y se concede Let obligatorio",
      "C. El oponente gana 2 puntos",
      "D. Se cambia de cancha"
    ],
    "correcta": 1,
    "explicacion": "La apertura imprevista de la puerta es una falla de seguridad que exige la anulación inmediata del rally."
  },
  {
    "id": 46,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Interferencia en Swing de Preparación",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "El contacto accidental con la raqueta del rival durante el swing de armado constituye:",
    "opciones": [
      "A. Juego limpio continuo",
      "B. Falta de saque",
      "C. Interferencia de swing, que otorga Let o Stroke según la posición del oponente",
      "D. Expulsión de 2 minutos"
    ],
    "correcta": 2,
    "explicacion": "Todo jugador tiene derecho a un swing de preparación y terminación libre de interferencias físicas."
  },
  {
    "id": 47,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Doble Contacto Involuntario",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si la pelota roza dos veces las cuerdas de la raqueta en un solo movimiento continuado:",
    "opciones": [
      "A. Es legal si no hubo intención",
      "B. Se canta Let",
      "C. Solo vale de revés",
      "D. Se decreta 'Not Up' por contacto antirreglamentario"
    ],
    "correcta": 3,
    "explicacion": "La pelota debe ser impactada limpiamente una única vez; el doble contacto es 'Not Up'."
  },
  {
    "id": 48,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Tiempo de Tolerancia Walkover",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuánto tiempo espera la organización de un torneo antes de declarar Walkover por incomparecencia?",
    "opciones": [
      "A. 15 minutos desde la hora oficial programada",
      "B. 2 horas",
      "C. Solo 2 minutos",
      "D. Hasta el día siguiente"
    ],
    "correcta": 0,
    "explicacion": "La tolerancia estándar internacional antes de declarar derrota por no comparecencia es de 15 minutos."
  },
  {
    "id": 49,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Pelota que Roza el Tin tras Tocar Frontal",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si la pelota toca válidamente la pared frontal por encima del tin y al caer roza la chapa:",
    "opciones": [
      "A. Es falta y se canta Down",
      "B. El tiro es VÁLIDO: la pelota ya había impactado legalmente la pared frontal",
      "C. Se otorga Let",
      "D. Se anula el game"
    ],
    "correcta": 1,
    "explicacion": "Una vez que la pelota cumple su trayectoria legal en la pared frontal, su descenso es juego libre hacia el suelo."
  },
  {
    "id": 50,
    "area": "Reglamento Oficial WSF y Arbitraje",
    "subtema": "Cambio de Pelota por Acuerdo",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Pueden ambos jugadores acordar cambiar la pelota durante el transcurso de un partido?",
    "opciones": [
      "A. No, está estrictamente prohibido hasta finalizar el match",
      "B. Solo si uno de los dos va perdiendo 0-2",
      "C. Sí, en cualquier intervalo entre games o si ambos jugadores y el árbitro convienen que perdió sus propiedades",
      "D. Solo con autorización por escrito de la WSF"
    ],
    "correcta": 2,
    "explicacion": "Entre games o por mutuo acuerdo con la aprobación del árbitro, se puede sustituir la pelota de juego."
  },
  {
    "id": 51,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Pelota Oficial PSA",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la pelota reglamentaria en competencias internacionales y circuito profesional PSA?",
    "opciones": [
      "A. Pelota Punto Azul",
      "B. Pelota Punto Rojo",
      "C. Pelota Blanca de Tenis",
      "D. Pelota Dunlop Pro Doble Punto Amarillo (Double Yellow Dot)"
    ],
    "correcta": 3,
    "explicacion": "La bola doble punto amarillo es el estándar mundial por su rebote muy bajo y velocidad lenta a temperatura ambiente."
  },
  {
    "id": 52,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Propósito del Punto Azul",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Para qué público está diseñada primordialmente la pelota de Punto Azul (Blue Dot)?",
    "opciones": [
      "A. Principiantes, niños y jugadores en formación, por su mayor rebote y tiempo de respuesta",
      "B. Profesionales en gran altitud",
      "C. Entrenamiento de fuerza",
      "D. Solo para partidos de dobles"
    ],
    "correcta": 0,
    "explicacion": "El punto azul rebota hasta 40% más que la profesional, permitiendo mantener rallies largos a menor velocidad."
  },
  {
    "id": 53,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Por qué se Calienta la Pelota",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué es indispensable calentar la pelota de squash antes de comenzar el partido?",
    "opciones": [
      "A. Para calentar el aire de la cancha",
      "B. Porque el caucho butílico es viscoelástico: a 20°C absorbe energía, pero a 45°C su restitución se duplica",
      "C. Para quitarle la pintura resbalosa",
      "D. Para enfriar el gas interior"
    ],
    "correcta": 1,
    "explicacion": "La deformación mecánica en impactos repetidos produce calor interno intermolecular (histéresis), alcanzando ~45°C."
  },
  {
    "id": 54,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Récord Mundial de Velocidad",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la velocidad récord de impacto de pelota de squash avalada en la historia?",
    "opciones": [
      "A. 120 mph (193 km/h)",
      "B. 220 mph (354 km/h)",
      "C. 176 mph (283.2 km/h), lograda por el australiano Cameron Pilley en 2011",
      "D. 90 mph (145 km/h)"
    ],
    "correcta": 2,
    "explicacion": "Cameron Pilley golpeó una pelota a 176 mph (283.2 km/h), una de las marcas más rápidas registradas en el deporte mundial."
  },
  {
    "id": 55,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Efecto de la Altitud",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué sucede al jugar squash en ciudades de gran altitud (ej: Bogotá a 2.600 m o Popayán a 1.760 m)?",
    "opciones": [
      "A. La pelota se vuelve pesada y no rebota",
      "B. El rebote se reduce a la mitad por el frío",
      "C. Flota sin descender hacia el piso",
      "D. La menor densidad del aire reduce el frenado aerodinámico (drag); la pelota vuela más rápido y rebota más"
    ],
    "correcta": 3,
    "explicacion": "El aire enrarecido ejerce menor resistencia al avance, haciendo que los tiros viajen a mayor velocidad de pared a pared."
  },
  {
    "id": 56,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Coeficiente de Restitución (e)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo varía el Coeficiente de Restitución de la pelota entre 20°C (fría) y 45°C (caliente)?",
    "opciones": [
      "A. Pasa de aproximadamente 0.25 en frío a más de 0.55 cuando está caliente",
      "B. Pasa de 0.90 a 0.99",
      "C. Se mantiene constante en 0.50",
      "D. Baja a 0.10"
    ],
    "correcta": 0,
    "explicacion": "La elasticidad dinámica del caucho casi se duplica al calentarse, pasando de e ≈ 0.25 a e ≈ 0.55."
  },
  {
    "id": 57,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Ley de Gay-Lussac en la Pelota",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Físicamente, ¿qué ocurre con el gas interno de la pelota al calentarse en el juego?",
    "opciones": [
      "A. La presión disminuye",
      "B. Aumenta la presión interna (P ∝ T), aumentando la rigidez y el rebote de la esfera",
      "C. El volumen se triplica",
      "D. El aire se licúa en agua"
    ],
    "correcta": 1,
    "explicacion": "A volumen casi constante, el aumento de temperatura eleva la presión del aire atrapado, incrementando el rebote."
  },
  {
    "id": 58,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Diámetro Reglamentario",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el diámetro oficial de una pelota reglamentaria de squash según la WSF?",
    "opciones": [
      "A. Entre 55 mm y 60 mm (como tenis)",
      "B. Exactamente 25 mm",
      "C. Entre 39.5 mm y 40.5 mm",
      "D. Entre 65 mm y 70 mm"
    ],
    "correcta": 2,
    "explicacion": "La pelota de squash mide exactamente 40 mm de diámetro nominal con tolerancia estricta de ±0.5 mm."
  },
  {
    "id": 59,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Peso Reglamentario",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el peso oficial de la pelota de squash según las especificaciones técnicas?",
    "opciones": [
      "A. Entre 56 y 59 gramos",
      "B. 10 gramos exactos",
      "C. Entre 45 y 50 gramos",
      "D. Entre 23.0 y 25.0 gramos"
    ],
    "correcta": 3,
    "explicacion": "Su masa es de 24 gramos (±1 g), ideal para aceleraciones supersónicas con mínimo impacto osteoarticular."
  },
  {
    "id": 60,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Interior de la Pelota",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué estructura interna tiene la pelota de squash de alta competición?",
    "opciones": [
      "A. Una cámara hueca con aire a presión casi atmosférica (sin esponja ni núcleo macizo)",
      "B. Un núcleo de corcho prensado",
      "C. Relleno de silicona líquida",
      "D. Un balín de plomo en el centro"
    ],
    "correcta": 0,
    "explicacion": "Es una esfera hueca de caucho vulcanizado compuesta por dos mitades termoselladas con aire en su interior."
  },
  {
    "id": 61,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Temperatura en Partido Intenso",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A qué temperatura opera una pelota de doble punto amarillo durante un partido profesional exigente?",
    "opciones": [
      "A. A más de 100 °C",
      "B. Entre 40 °C y 48 °C",
      "C. A 20 °C fijos",
      "D. A -5 °C"
    ],
    "correcta": 1,
    "explicacion": "En rallies rápidos y continuos, la fricción interna eleva la temperatura del caucho a unos 42°C-48°C."
  },
  {
    "id": 62,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Efecto Magnus y Backspin",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué efecto aerodinámico produce cortar la pelota hacia abajo (slice/backspin) en un drop?",
    "opciones": [
      "A. Hace que caiga en picada vertical",
      "B. Hace que rebote el doble de alto",
      "C. Efecto Magnus: genera sustentación vertical que alarga el vuelo y provoca que la bola muera al botar",
      "D. Anula la fuerza de gravedad"
    ],
    "correcta": 2,
    "explicacion": "El backspin crea sustentación aerodinámica y un ángulo de salida muy bajo que reduce el rebote vertical."
  },
  {
    "id": 63,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Histéresis Mecánica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué fenómeno de la ciencia de materiales hace que la pelota fría apenas rebote?",
    "opciones": [
      "A. Resonancia magnética",
      "B. Conductividad superconductora",
      "C. Ultrasonido de cuerdas",
      "D. Histéresis viscoelástica del caucho (disipación de energía de deformación en forma de calor)"
    ],
    "correcta": 3,
    "explicacion": "El retardo entre deformación y recuperación elástica disipa energía mecánica en calor interno."
  },
  {
    "id": 64,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Punto Amarillo Único",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué característica de velocidad tiene la pelota de un punto amarillo (Single Yellow Dot)?",
    "opciones": [
      "A. Velocidad lenta con rebote ligeramente mayor a la doble punto, ideal para canchas frías o nivel club",
      "B. Es la más rápida de todas",
      "C. No rebota en absoluto",
      "D. Es una pelota pesada de saque"
    ],
    "correcta": 0,
    "explicacion": "Es ideal para entrenamientos o invierno cuando la temperatura de la cancha dificulta calentar la doble punto."
  },
  {
    "id": 65,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Pelota Blanca Oficial",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Para qué tipo de cancha está destinada la pelota de squash completamente blanca?",
    "opciones": [
      "A. Para césped sintético",
      "B. Para canchas panorámicas de cristal ('All-Glass Show Courts') con paredes oscuras para TV",
      "C. Para jugar con luz ultravioleta",
      "D. Para partidos con sonido interno"
    ],
    "correcta": 1,
    "explicacion": "Ofrece el máximo contraste visual contra vidrios tintados y permite un seguimiento perfecto en transmisiones HD."
  },
  {
    "id": 66,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Tiempo de Contacto en Cuerdas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuánto tiempo dura aproximadamente el contacto físico pelota-cuerdas en un golpe de squash?",
    "opciones": [
      "A. Medio segundo (500 ms)",
      "B. 25 milisegundos",
      "C. Entre 3 y 5 milisegundos (0.003 - 0.005 segundos)",
      "D. Un microsegundo"
    ],
    "correcta": 2,
    "explicacion": "En tan solo 3 a 5 milisegundos se transfieren todas las fuerzas y momentos cinéticos entre raqueta y bola."
  },
  {
    "id": 67,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Deformación en Choque a 200 km/h",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Hasta qué porcentaje de su diámetro puede comprimirse la pelota al chocar a gran velocidad contra el frontis?",
    "opciones": [
      "A. Menos del 1%",
      "B. Se aplana al 100% de forma permanente",
      "C. Se expande al triple",
      "D. Hasta en un 50% o más de su diámetro original"
    ],
    "correcta": 3,
    "explicacion": "El término 'squash' (aplastar) proviene de esta dramática compresión elástica transitoria de la esfera."
  },
  {
    "id": 68,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Acústica del Tin Metálico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el Tin se fabrica con chapa hueca y resonante?",
    "opciones": [
      "A. Para generar una firma acústica seca e inconfundible de que la pelota fue baja",
      "B. Para reflejar luz a los jugadores",
      "C. Para calentar la pelota",
      "D. Para guardar cables"
    ],
    "correcta": 0,
    "explicacion": "Su diseño como caja de resonancia metálica garantiza que cualquier impacto sea evidente para el juez y el público."
  },
  {
    "id": 69,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Efecto de la Humedad en Vidrio",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ocurre si la humedad relativa en la cancha supera el 80% y condensa en el cristal?",
    "opciones": [
      "A. Rebota el doble de alto",
      "B. La película de agua elimina la fricción; la pelota patina y cae imprevistamente hacia abajo",
      "C. La pelota se frena en seco",
      "D. No tiene ningún efecto"
    ],
    "correcta": 1,
    "explicacion": "El fenómeno de 'paredes sudorosas' (sweating walls) hace que la bola resbale sin tracción mecánica."
  },
  {
    "id": 70,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Madera de Arce en el Piso",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué se emplea madera dura de arce o haya en el piso de squash?",
    "opciones": [
      "A. Para que la pelota ruede más",
      "B. Para que no se raye con sudor",
      "C. Porque amortigua el impacto en las articulaciones y brinda fricción óptima para frenar en estocada",
      "D. Por tradición estética únicamente"
    ],
    "correcta": 2,
    "explicacion": "El piso flotante de arce sobre elastómeros absorbe la energía de desaceleración y protege ligamentos y meniscos."
  },
  {
    "id": 71,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Fuerzas Pico de Impacto",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué orden de fuerza pico experimenta la cabeza de la raqueta en un golpe de máxima potencia?",
    "opciones": [
      "A. Menos de 2 Newtons",
      "B. 50.000 Newtons",
      "C. Cero Newtons",
      "D. Fuerzas pico de impacto que superan los 200 a 300 Newtons durante milisegundos"
    ],
    "correcta": 3,
    "explicacion": "Acelerar 24 gramos de 0 a 200 km/h en 4 milisegundos genera fuerzas reactivas intensas sobre el marco."
  },
  {
    "id": 72,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Pelota de Punto Rojo (Progress)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué particularidad tiene la pelota Dunlop Progress de punto rojo?",
    "opciones": [
      "A. Diámetro 6% mayor y un rebote 20% superior para facilitar el aprendizaje y la continuidad",
      "B. Es más pequeña y más rápida",
      "C. Contiene helio comprimido",
      "D. Es para raquetas de madera"
    ],
    "correcta": 0,
    "explicacion": "Su tamaño ligeramente superior y rebote intermedio permiten afianzar la mecánica de swing a jugadores de club."
  },
  {
    "id": 73,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "El Sweet Spot de la Raqueta",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué es el 'Sweet Spot' o centro de percusión de la raqueta de squash?",
    "opciones": [
      "A. La parte acolchada del mango",
      "B. La zona del encordado donde la restitución a la bola es máxima y las vibraciones al brazo son nulas",
      "C. El extremo superior del marco",
      "D. El centro de balance neutro"
    ],
    "correcta": 1,
    "explicacion": "Coincide con los nodos de vibración del marco, transmitiendo la energía limpia al proyectil sin sacudir la mano."
  },
  {
    "id": 74,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Impacto Descentralizado y Torque",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué efecto físico se produce al golpear la pelota cerca del borde del marco?",
    "opciones": [
      "A. La raqueta se rompe de inmediato",
      "B. La pelota viaja más rápido",
      "C. Torque torsional sobre el eje del mango que desvía la cara de la raqueta y reduce la velocidad de tiro",
      "D. Falta técnica de marco"
    ],
    "correcta": 2,
    "explicacion": "El impacto fuera del eje central induce una rotación angular que abre o cierra la cara de la raqueta."
  },
  {
    "id": 75,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Enfriamiento por Inactividad",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuánto tarda la pelota en perder temperatura si se suspende el peloteo entre games?",
    "opciones": [
      "A. Mantiene el calor 4 horas",
      "B. Medio segundo exacto",
      "C. Solo si se moja",
      "D. Bastan 2 a 3 minutos para que pierda calor apreciable por radiación y contacto con el suelo"
    ],
    "correcta": 3,
    "explicacion": "Por su pequeño volumen y piel oscura de caucho, disipa calor rápidamente si no se mantiene en constante golpeo."
  },
  {
    "id": 76,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Reflexión con Fricción en Boast",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué el rebote en pared lateral no sigue la ley simétrica del espejo (θ_i = θ_r)?",
    "opciones": [
      "A. Porque la deformación tangencial y la fricción con la pared reducen la componente normal de velocidad",
      "B. Por atracción magnética",
      "C. Por la luz de los reflectores",
      "D. En squash siempre es simétrico"
    ],
    "correcta": 0,
    "explicacion": "El choque oblicuo con fricción disminuye la velocidad perpendicular y hace el ángulo de salida más cerrado."
  },
  {
    "id": 77,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Pelota Pulida por Desgaste",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué ocurre cuando una pelota de squash acumula demasiadas horas de juego y se 'pule'?",
    "opciones": [
      "A. Se vuelve pegajosa",
      "B. Adquiere un brillo superficial liso que resbala en las paredes y reduce la efectividad del slice",
      "C. Pesa 10 gramos más",
      "D. Rebota el triple en frío"
    ],
    "correcta": 1,
    "explicacion": "Al perder la microtextura rugosa de fábrica, la pelota pierde agarre y patina en los tiros cortados."
  },
  {
    "id": 78,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Tercera Ley de Newton en el Tiro",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Al acelerar la pelota con la raqueta, la Tercera Ley de Newton establece:",
    "opciones": [
      "A. Que la raqueta solo empuja sin recibir fuerza",
      "B. Que la gravedad se anula",
      "C. Que la pelota ejerce sobre la raqueta una fuerza exactamente igual y opuesta a la que recibe de ella",
      "D. Que la masa de la raqueta disminuye"
    ],
    "correcta": 2,
    "explicacion": "La fuerza de impacto deforma las cuerdas con la misma intensidad con que las cuerdas propulsan la pelota."
  },
  {
    "id": 79,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Altura de Techo y Parábola de Lob",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué es crucial la altura libre de 5.64 metros de la cancha para un buen Lob?",
    "opciones": [
      "A. Para que quepan ventiladores",
      "B. Para que los atletas no se golpeen la cabeza",
      "C. Para colocar cámaras de TV",
      "D. Permite proyectar trayectorias parabólicas muy altas que caen casi verticales en el rincón trasero"
    ],
    "correcta": 3,
    "explicacion": "Un lob eficiente agota su energía horizontal en la cúspide y desciende a plomo rozando el vidrio trasero."
  },
  {
    "id": 80,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Momento Lineal y Masa Efectiva",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "La velocidad de salida de la pelota depende directamente de:",
    "opciones": [
      "A. La velocidad de la cabeza de la raqueta en el impacto y su masa efectiva en el punto dulce",
      "B. Solo de la altura del jugador",
      "C. De la temperatura del piso",
      "D. Del grosor del grip únicamente"
    ],
    "correcta": 0,
    "explicacion": "Por conservación de la cantidad de movimiento (p = m·v), la inercia dinámica del marco impulsa la pelota."
  },
  {
    "id": 81,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Física del Tiro al Nick",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un tiro que impacta en el 'Nick' (unión a 90° entre pared lateral y piso) no bota hacia arriba?",
    "opciones": [
      "A. Porque se desinfla",
      "B. Porque choca con dos planos simultáneos; las fuerzas normales opuestas cancelan el rebote vertical",
      "C. Porque la pared es magnética",
      "D. Porque el árbitro lo ordena"
    ],
    "correcta": 1,
    "explicacion": "Las componentes verticales y horizontales de restitución se anulan mutuamente, forzando a la bola a rodar sobre la duela."
  },
  {
    "id": 82,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Resistencia del Aire F_drag ∝ v²",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo escala la fuerza de frenado aerodinámico con la velocidad de la pelota de squash?",
    "opciones": [
      "A. Permanece fija",
      "B. Aumenta linealmente (F ∝ v)",
      "C. Aumenta cuadráticamente con la velocidad (F_drag ∝ v²)",
      "D. Disminuye con la velocidad"
    ],
    "correcta": 2,
    "explicacion": "A más de 100-200 km/h el régimen es turbulento y el arrastre aerodinámico es proporcional a v²."
  },
  {
    "id": 83,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Resorte de Hooke en Cuerdas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "El lecho de cuerdas de la raqueta se comporta durante el impacto como:",
    "opciones": [
      "A. Un gas ideal de Boyle",
      "B. Un superconductor térmico",
      "C. Una placa rígida indeformable",
      "D. Una red de resortes elásticos que siguen la Ley de Hooke (F = -k·Δx), almacenando y devolviendo energía"
    ],
    "correcta": 3,
    "explicacion": "La deflexión elástica de las cuerdas almacena energía potencial elástica que se transfiere a la pelota."
  },
  {
    "id": 84,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Vidrio Frío en Invierno",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué sucede si se disputa un partido en una cancha de cristal muy fría (10°C)?",
    "opciones": [
      "A. El vidrio absorbe el calor de la pelota en cada golpe, haciendo que rebote poco y exigiendo máxima fuerza",
      "B. El vidrio se vuelve blando",
      "C. La pelota rebota el doble",
      "D. Se debe jugar con pelota de tenis"
    ],
    "correcta": 0,
    "explicacion": "El cristal frío actúa como un disipador térmico que 'apaga' la pelota rápidamente si el rally es lento."
  },
  {
    "id": 85,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Juego a Nivel del Mar",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué sensación balística experimentan los jugadores al competir a nivel del mar frente a ciudades de montaña?",
    "opciones": [
      "A. Vuela al doble de velocidad",
      "B. La mayor densidad del aire frena más los tiros (más drag) y la pelota se siente más pesada y lenta",
      "C. No rebota en absoluto",
      "D. Flota sin descender"
    ],
    "correcta": 1,
    "explicacion": "La atmósfera más densa genera mayor resistencia al avance, exigiendo un físico superior para mantener el ataque."
  },
  {
    "id": 86,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Vibraciones Transmitidas al Brazo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué rango de frecuencias vibratorias en el marco se asocia a sobrecargas en el codo (epicondilitis)?",
    "opciones": [
      "A. Ondas de radio (GHz)",
      "B. Ultrasonidos de 25.000 Hz",
      "C. Vibraciones mecánicas de flexión de baja frecuencia (entre 100 y 200 Hz)",
      "D. Ondas infrarrojas"
    ],
    "correcta": 2,
    "explicacion": "Las ondas mecánicas de baja frecuencia transmitidas por impactos descentrados sobrecargan la inserción de tendones extensores."
  },
  {
    "id": 87,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Descomposición Vectorial en Boast",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Al impactar un boast en pared lateral, ¿qué componente de velocidad sufre la mayor desaceleración?",
    "opciones": [
      "A. La componente vertical hacia arriba",
      "B. Se pierde el 100% de velocidad",
      "C. Se invierte hacia atrás",
      "D. La componente perpendicular a la pared lateral por el choque directo"
    ],
    "correcta": 3,
    "explicacion": "La componente perpendicular invierte su sentido y disipa energía cinética, mientras la tangencial sigue hacia la frontal."
  },
  {
    "id": 88,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Climatización de Cancha Profesional",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los clubes climatizan las canchas entre 18°C y 22°C?",
    "opciones": [
      "A. Para asegurar una velocidad y rebote de pelota consistentes con los estándares de la WSF",
      "B. Para ahorrar electricidad",
      "C. Para que no se hiele el piso",
      "D. Para no usar zapatillas"
    ],
    "correcta": 0,
    "explicacion": "Temperaturas superiores a 28°C convierten la pelota en un proyectil descontrolado con rallies infinitos."
  },
  {
    "id": 89,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Inercia Rotacional (Swingweight)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué magnitud mide la inercia real que siente el jugador al rotar la raqueta en el swing?",
    "opciones": [
      "A. El peso estático en balanza",
      "B. El Momento de Inercia Rotacional (Swingweight), proporcional a la distancia de las masas al eje de giro",
      "C. La longitud del mango",
      "D. El color del marco"
    ],
    "correcta": 1,
    "explicacion": "El swingweight (I = ∫ r² dm) determina el esfuerzo biomecánico real para acelerar la cabeza de la raqueta."
  },
  {
    "id": 90,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Presión Mecánica en la Frenada",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué presión pico puede ejercer el talón del deportista en una estocada profunda sobre la madera?",
    "opciones": [
      "A. Menos de 0.01 kg/cm²",
      "B. 500 toneladas por centímetro",
      "C. Presiones pico que pueden superar los 15 a 20 kg/cm² en el instante de desaceleración máxima",
      "D. Cero presión"
    ],
    "correcta": 2,
    "explicacion": "Desacelerar 75 kg a varios metros por segundo en un área reducida concentra presiones notables en la suela."
  },
  {
    "id": 91,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "El Punto Intro (Sin Punto)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Existe alguna pelota de squash comercial de tamaño ampliado diseñada para la primera sesión de principiantes?",
    "opciones": [
      "A. No, todos deben usar doble punto amarillo",
      "B. Solo se usan pelotas de tenis de mesa",
      "C. Se usan globos inflables",
      "D. Sí, pelotas de iniciación (como Dunlop Intro) que son un 12% más grandes y rebotan 40% más"
    ],
    "correcta": 3,
    "explicacion": "Las pelotas de iniciación permiten a personas sin técnica previa disfrutar de rallies continuos desde el primer día."
  },
  {
    "id": 92,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Vulcanización del Caucho",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué proceso químico le confiere al caucho de la pelota de squash su memoria elástica y resistencia térmica?",
    "opciones": [
      "A. La vulcanización con azufre, que crea enlaces cruzados entre las cadenas poliméricas de elastómero",
      "B. La electrólisis en agua salada",
      "C. La fermentación bacteriana",
      "D. El congelamiento con nitrógeno líquido"
    ],
    "correcta": 0,
    "explicacion": "Los puentes disulfuro de la vulcanización dotan al caucho de elasticidad tridimensional y resistencia a la abrasión."
  },
  {
    "id": 93,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Coeficiente de Fricción Piso-Suela",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué las zapatillas de squash utilizan suelas de goma natural o caucho 'goma caramelo'?",
    "opciones": [
      "A. Para resbalar como en el patinaje sobre hielo",
      "B. Porque ofrece un elevado coeficiente de fricción estática (μ > 0.8) sin dejar marcas negras en la duela",
      "C. Para amortiguar ruidos al saltar",
      "D. Por ser el material más económico"
    ],
    "correcta": 1,
    "explicacion": "El caucho virgen o sintético no marcante brinda la tracción indispensable para frenar en seco y cambiar de dirección."
  },
  {
    "id": 94,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Aceleración de la Pelota",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué aceleración promedio experimenta la pelota de squash al pasar de 0 a 180 km/h en 4 milisegundos?",
    "opciones": [
      "A. 9.8 m/s²",
      "B. 100 m/s²",
      "C. Aproximadamente 12.500 m/s² (¡más de 1.200 veces la aceleración de la gravedad g!)",
      "D. 500.000 m/s²"
    ],
    "correcta": 2,
    "explicacion": "a = Δv / Δt = (50 m/s) / (0.004 s) = 12.500 m/s² ≈ 1.275 g, una aceleración instantánea brutal."
  },
  {
    "id": 95,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Conservación de Energía en el Choque",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En el impacto contra la pared frontal de yeso rígido, ¿adónde va la energía mecánica perdida?",
    "opciones": [
      "A. Desaparece del universo",
      "B. Se convierte en masa atómica",
      "C. La absorbe la luz de la cancha",
      "D. Se disipa en calor dentro de la pelota, en ondas sonoras audibles y en microvibraciones en la pared"
    ],
    "correcta": 3,
    "explicacion": "Por el principio de conservación de la energía, la pérdida de energía cinética reaparece como calor y sonido."
  },
  {
    "id": 96,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Rigidez Torsional del Marco de Carbono",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué las raquetas modernas sustituyeron la madera y el aluminio por fibra de carbono de alto módulo?",
    "opciones": [
      "A. Porque la fibra de carbono brinda una relación rigidez/peso inigualable, resistiendo la torsión y maximizando la potencia",
      "B. Porque la madera es muy liviana",
      "C. Para que no floten en el agua",
      "D. Porque el metal no se puede pintar"
    ],
    "correcta": 0,
    "explicacion": "El grafito y carbono de alto módulo minimizan la flexión parásita, devolviendo la máxima energía a la pelota."
  },
  {
    "id": 97,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Efecto de la Presión en Pelotas de Doble Punto",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Tienen las pelotas de squash profesionales una válvula para inflarlas?",
    "opciones": [
      "A. Sí, tienen una válvula de aguja oculta",
      "B. No, están selladas herméticamente de fábrica con su presión calibrada durante el vulcanizado",
      "C. Se inflan con una bomba de bicicleta",
      "D. Se recargan con gas helio cada semana"
    ],
    "correcta": 1,
    "explicacion": "La pelota es una cápsula hermética sellada; su presión interna no se ajusta con válvulas externas."
  },
  {
    "id": 98,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Gasto de Pelotas en Alta Competición",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Con qué frecuencia se reemplaza la pelota en partidos de élite del PSA World Tour?",
    "opciones": [
      "A. Se cambia cada 3 puntos como en el tenis",
      "B. Una pelota dura 10 torneos completos",
      "C. Generalmente se utiliza una pelota nueva por partido, y se cambia si se enfría, se fisura o pierde propiedades",
      "D. Se cambia cada vez que pega en el tin"
    ],
    "correcta": 2,
    "explicacion": "A nivel profesional, la intensa deformación exige pelotas en perfecto estado de textura y elasticidad."
  },
  {
    "id": 99,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Impacto en Esquina Trasera",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Cuando un tiro largo entra profundo al rincón trasero de cristal y pared lateral:",
    "opciones": [
      "A. Se queda pegada como un imán",
      "B. Aumenta su velocidad al doble",
      "C. Sale disparada al techo",
      "D. La pelota experimenta un doble rebote en paredes perpendiculares que la proyecta hacia adelante a menor velocidad"
    ],
    "correcta": 3,
    "explicacion": "El contacto secuencial con pared trasera y lateral drena la energía cinética, haciendo que la bola muera hacia el centro."
  },
  {
    "id": 100,
    "area": "Física, Termodinámica y Rebote de la Pelota",
    "subtema": "Pelota de Punto Amarillo vs Doble en Altitud",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué en ciudades altas (ej: México DF o Bogotá) los entrenadores suelen usar doble punto amarillo incluso en invierno?",
    "opciones": [
      "A. Porque la menor densidad del aire compensa el frío, haciendo que la pelota conserve rebote y velocidad",
      "B. Porque en altitud las pelotas se hinchan",
      "C. Por tradición folclórica",
      "D. Porque la pelota azul explota con la altura"
    ],
    "correcta": 0,
    "explicacion": "El menor drag aerodinámico en altitud mantiene la bola doble punto con una jugabilidad viva similar a la de un punto a nivel del mar."
  },
  {
    "id": 101,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Longitud Cancha Singles",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la longitud interior reglamentaria de una cancha de squash de singles?",
    "opciones": [
      "A. 12.00 metros",
      "B. 9.75 metros (32 pies)",
      "C. 8.50 metros",
      "D. 15.00 metros"
    ],
    "correcta": 1,
    "explicacion": "La distancia entre pared frontal y trasera de singles es de 9.75 metros según la WSF."
  },
  {
    "id": 102,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Ancho Cancha Singles",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el ancho interior de una cancha de singles entre paredes laterales?",
    "opciones": [
      "A. 8.00 metros",
      "B. 5.50 metros",
      "C. 6.40 metros (21 pies)",
      "D. 7.20 metros"
    ],
    "correcta": 2,
    "explicacion": "El ancho interior reglamentario es de 6.40 metros (21 pies)."
  },
  {
    "id": 103,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura Frontal Out Line",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A qué altura del piso se ubica la línea de falta superior de la pared frontal?",
    "opciones": [
      "A. 6.00 metros",
      "B. 3.50 metros",
      "C. 5.20 metros",
      "D. 4.57 metros (15 pies)"
    ],
    "correcta": 3,
    "explicacion": "La línea superior de la frontal está situada a 4.57 metros del suelo."
  },
  {
    "id": 104,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura Trasera Out Line",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la altura reglamentaria de la pared trasera de cristal?",
    "opciones": [
      "A. 2.13 metros (7 pies)",
      "B. 3.00 metros",
      "C. 1.80 metros",
      "D. 4.00 metros"
    ],
    "correcta": 0,
    "explicacion": "La pared trasera tiene 2.13 metros de altura, permitiendo la visibilidad de los espectadores."
  },
  {
    "id": 105,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura del Tin PSA vs Club",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A qué altura se ubica la chapa (Tin) en torneos profesionales PSA vs canchas de club tradicionales?",
    "opciones": [
      "A. 30 cm en PSA y 60 cm en clubes",
      "B. 43 cm (17 pulgadas) en el circuito profesional PSA y 48 cm (19 pulgadas) en clubes",
      "C. 50 cm idéntico en todo el mundo",
      "D. 25 cm para hombres y 48 cm para mujeres"
    ],
    "correcta": 1,
    "explicacion": "La PSA estandarizó el tin a 17 pulgadas (43 cm) para incentivar el juego ofensivo y los drop shots."
  },
  {
    "id": 106,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Línea de Saque en Frontal",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A qué altura del piso está la línea de servicio (Cut line) en la pared frontal?",
    "opciones": [
      "A. 2.50 metros",
      "B. 1.20 metros",
      "C. 1.78 metros (5 pies y 10 pulgadas)",
      "D. 3.00 metros"
    ],
    "correcta": 2,
    "explicacion": "La línea de saque está a 1.78 m del suelo; el servicio debe impactar por encima de ella."
  },
  {
    "id": 107,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Línea Corta (Short Line)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿A qué distancia de la pared frontal está la línea corta del piso (Short Line)?",
    "opciones": [
      "A. 3.50 metros",
      "B. 7.00 metros",
      "C. 4.20 metros",
      "D. 5.44 metros (17 pies y 10 pulgadas)"
    ],
    "correcta": 3,
    "explicacion": "La línea corta del suelo está a 5.44 m del frontis y divide la cancha en zona delantera y trasera."
  },
  {
    "id": 108,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Caja de Servicio",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuáles son las medidas de la caja de servicio cuadrada (Service Box)?",
    "opciones": [
      "A. 1.60 m x 1.60 m (5 pies 3 pulgadas de lado)",
      "B. 2.50 m x 2.50 m",
      "C. 1.00 m x 1.00 m",
      "D. 2.00 m x 1.00 m"
    ],
    "correcta": 0,
    "explicacion": "Es un cuadrado de 1.60 m de lado adyacente a la pared lateral."
  },
  {
    "id": 109,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Línea de Media Cancha",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué función cumple la línea de media cancha en el suelo?",
    "opciones": [
      "A. Indica dónde se para el árbitro",
      "B. Divide la mitad trasera en dos cuartos simétricos de 3.20 m de ancho para la recepción del saque",
      "C. Zona prohibida de pisar",
      "D. Divide zurdos de diestros"
    ],
    "correcta": 1,
    "explicacion": "Separa los cuartos de recepción izquierdo y derecho entre la línea corta y el vidrio trasero."
  },
  {
    "id": 110,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Ancho de Líneas Reglamentarias",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el ancho de todas las líneas rojas pintadas en la cancha?",
    "opciones": [
      "A. 100 milímetros",
      "B. 20 milímetros",
      "C. 50 milímetros (5 cm / 2 pulgadas)",
      "D. 75 milímetros"
    ],
    "correcta": 2,
    "explicacion": "Todas las líneas de falta y delimitación tienen un ancho reglamentario de 50 mm."
  },
  {
    "id": 111,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Diagonal del Piso",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuánto mide la diagonal del piso de una cancha de 9.75 m x 6.40 m?",
    "opciones": [
      "A. 16.00 metros",
      "B. 8.50 metros",
      "C. 14.20 metros",
      "D. Aproximadamente 11.66 metros (√(9.75² + 6.40²))"
    ],
    "correcta": 3,
    "explicacion": "Por el teorema de Pitágoras, la diagonal interior es √(9.75² + 6.40²) ≈ 11.66 m."
  },
  {
    "id": 112,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Pendiente en Pared Lateral",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo desciende la línea de falta superior en las paredes laterales?",
    "opciones": [
      "A. En una línea recta continua inclinada desde 4.57 m en la frontal hasta 2.13 m en la trasera",
      "B. En escalones rectos",
      "C. Horizontal a 4.57 m",
      "D. En curva parabólica"
    ],
    "correcta": 0,
    "explicacion": "Conecta suavemente la cota de 4.57 m en la pared frontal con los 2.13 m de la pared trasera."
  },
  {
    "id": 113,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura Libre de Techo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la altura libre mínima de techo sin obstáculos sobre la cancha?",
    "opciones": [
      "A. 3.80 metros",
      "B. 5.64 metros (18 pies y 6 pulgadas)",
      "C. 8.00 metros",
      "D. 4.50 metros"
    ],
    "correcta": 1,
    "explicacion": "La WSF exige al menos 5.64 m libres para permitir el arco parabólico de los lobs altos."
  },
  {
    "id": 114,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Espesor de Vidrio Trasero",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué espesor de vidrio templado de seguridad exige la WSF en la pared trasera?",
    "opciones": [
      "A. 4 milímetros de vidrio común",
      "B. 30 milímetros blindado",
      "C. 12 milímetros de vidrio templado homologado",
      "D. 8 milímetros acrílico"
    ],
    "correcta": 2,
    "explicacion": "Se usa vidrio templado de 12 mm capaz de soportar choques corporales a plena velocidad."
  },
  {
    "id": 115,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Iluminación en PSA",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué nivel de iluminación artificial en luxes se exige para torneos televisados de la PSA?",
    "opciones": [
      "A. 100 luxes",
      "B. 10.000 luxes",
      "C. 300 luxes",
      "D. Al menos 1.200 luxes sobre el nivel del piso"
    ],
    "correcta": 3,
    "explicacion": "Para la retransmisión televisiva en alta velocidad de la pelota negra se exigen >1.200 luxes."
  },
  {
    "id": 116,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Cancha de Dobles WSF",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuáles son las medidas de la cancha oficial de dobles de la WSF?",
    "opciones": [
      "A. Longitud de 9.75 m y ancho de 7.62 m (25 pies), con chapa a 43 cm",
      "B. 19.50 m x 12.80 m",
      "C. Idéntica a la de singles",
      "D. 8.00 m x 5.00 m"
    ],
    "correcta": 0,
    "explicacion": "Mantiene los 9.75 m de largo pero ensancha la pista a 7.62 m para 4 deportistas."
  },
  {
    "id": 117,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Cancha Dobles Hardball",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "La modalidad norteamericana de dobles 'Hardball' usa canchas de qué dimensiones:",
    "opciones": [
      "A. Cancha circular de 10 m",
      "B. 13.72 m de largo por 7.62 m de ancho (45 ft x 25 ft)",
      "C. Idéntica a tenis de mesa",
      "D. 9.75 m x 6.40 m"
    ],
    "correcta": 1,
    "explicacion": "El dobles hardball norteamericano se disputa en una cancha significativamente más larga (45 pies)."
  },
  {
    "id": 118,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Revoque de Paredes Clásicas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿De qué material son las paredes tradicionales de alta gama no acristaladas?",
    "opciones": [
      "A. Ladrillo hueco a la vista",
      "B. Madera de pino barnizada",
      "C. Yeso especial de alta densidad ('Armourcoat') sin juntas de dilatación",
      "D. Cartón yeso común (Drywall)"
    ],
    "correcta": 2,
    "explicacion": "Se emplean yesos epóxicos de altísima densidad resistentes a decenas de miles de impactos."
  },
  {
    "id": 119,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Paredes One-Way Vision",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo logran las canchas Show Court de cristal que el público vea hacia adentro pero el jugador no se distraiga?",
    "opciones": [
      "A. Con polarizado negro de coche",
      "B. Jugando a oscuras",
      "C. Con espejos de espía",
      "D. Con una matriz serigrafiada de micro-puntos reflectantes e iluminación calibrada"
    ],
    "correcta": 3,
    "explicacion": "La trama de micro-puntos refleja la luz hacia adentro dando la impresión de una pared sólida al atleta."
  },
  {
    "id": 120,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Planimetría del Piso",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la tolerancia máxima de desnivel permitida en el suelo de una cancha oficial?",
    "opciones": [
      "A. No puede exceder los 3 milímetros en un radio de 3 metros",
      "B. Hasta 10 centímetros",
      "C. Inclinación del 5% hacia el tin",
      "D. No hay tolerancia"
    ],
    "correcta": 0,
    "explicacion": "Se requiere absoluta planimetría para que el bote de la pelota no presente irregularidades."
  },
  {
    "id": 121,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Ubicación de la Puerta",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Dónde se sitúa reglamentariamente la puerta de entrada a la cancha?",
    "opciones": [
      "A. En la pared frontal junto al tin",
      "B. En el centro de la pared trasera de cristal, abriendo hacia adentro y al ras del vidrio",
      "C. En el techo con trampilla",
      "D. En la pared lateral sobre la línea corta"
    ],
    "correcta": 1,
    "explicacion": "La puerta queda enrasada en el centro del vidrio trasero para no alterar los botes de pared trasera."
  },
  {
    "id": 122,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Herrajes Enrasados",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los cerrojos y bisagras de la puerta trasera no tienen manijas salientes?",
    "opciones": [
      "A. Para encerrar a los jugadores",
      "B. Por estética victoriana",
      "C. Para que la superficie interior del cristal sea perfectamente lisa al impacto de la pelota",
      "D. Para aislar el ruido"
    ],
    "correcta": 2,
    "explicacion": "Cualquier resalto desorganizaría los botes de la pelota; por ello los herrajes van avellanados al ras."
  },
  {
    "id": 123,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Cinta de Tin Sonora",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿De qué material es la tira de 50 mm que remata la parte superior de la chapa?",
    "opciones": [
      "A. Goma blanda que absorbe el golpe",
      "B. Cable electrificado",
      "C. Cuerda de nylon",
      "D. Un perfil de plástico duro o madera que emite un chasquido inconfundible al ser rozado"
    ],
    "correcta": 3,
    "explicacion": "Actúa como avisador acústico inmediato de pelota baja si es tocada por la pelota."
  },
  {
    "id": 124,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Tasa de Ventilación",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuántas renovaciones de aire por hora recomienda la WSF para una cancha cerrada?",
    "opciones": [
      "A. Al menos 4 a 6 renovaciones completas de aire por hora",
      "B. Solo 1 al día",
      "C. 50 por minuto",
      "D. Ninguna; hermética"
    ],
    "correcta": 0,
    "explicacion": "El intercambio de aire disipa el calor metabólico y la humedad generada por los atletas."
  },
  {
    "id": 125,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Graderías Elevadas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿A qué altura sobre el piso se sitúa idealmente la tribuna de espectadores?",
    "opciones": [
      "A. A ras de suelo pegado al servidor",
      "B. Por encima de los 2.13 m de la pared trasera para una visión cenital de la T",
      "C. A 10 metros en el techo",
      "D. En una fosa bajo el piso"
    ],
    "correcta": 1,
    "explicacion": "La perspectiva elevada permite apreciar los ángulos de tiro, la longitud y el dominio del centro."
  },
  {
    "id": 126,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Paredes Móviles",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En centros modernos, ¿qué sistema permite transformar canchas de singles en dobles?",
    "opciones": [
      "A. Cortinas de tela",
      "B. Mallas de alambre",
      "C. Paredes divisorias móviles motorizadas que se desplazan sobre rieles laterales",
      "D. Cuerdas elásticas"
    ],
    "correcta": 2,
    "explicacion": "Las paredes móviles permiten ampliar los 6.40 m a 7.62 m de dobles en pocos minutos."
  },
  {
    "id": 127,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Color de Paredes en Canchas Clásicas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el color oficial de las paredes en canchas tradicionales de yeso?",
    "opciones": [
      "A. Negro brillante",
      "B. Verde tenis",
      "C. Rojo carmesí",
      "D. Blanco mate o blanco roto no reflectante"
    ],
    "correcta": 3,
    "explicacion": "El blanco mate sin reflejos ofrece el mejor contraste con la pelota negra de squash."
  },
  {
    "id": 128,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Prohibición de Barniz Brillante",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué está prohibido aplicar barnices reflectantes en el piso de squash?",
    "opciones": [
      "A. Porque los reflejos deslumbran y los barnices pulidos provocan resbalones peligrosos con sudor",
      "B. Porque daña el caucho",
      "C. Por contrato de la WSF",
      "D. Porque oscurece la cancha"
    ],
    "correcta": 0,
    "explicacion": "El piso debe mantener un acabado antideslizante al natural para prevenir caídas de los jugadores."
  },
  {
    "id": 129,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Volumen de Aire en la Cancha",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué volumen de aire encierra aproximadamente una cancha oficial de squash?",
    "opciones": [
      "A. 1.000 metros cúbicos",
      "B. Aproximadamente 350 a 370 metros cúbicos (9.75 × 6.40 × 5.64 m)",
      "C. 50 metros cúbicos",
      "D. 2.500 metros cúbicos"
    ],
    "correcta": 1,
    "explicacion": "V = 9.75 × 6.40 × 5.64 ≈ 352 m³, un recinto compacto donde se disputan intensos duelos aeróbicos."
  },
  {
    "id": 130,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Ubicación de la 'T'",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿A qué distancia exacta del frontis se ubica la intersección de la 'T' en el piso?",
    "opciones": [
      "A. A 2.00 metros del frontis",
      "B. A 8.00 metros pegada al vidrio",
      "C. A 5.44 metros (en el centro de la línea corta, a 3.20 m de cada pared lateral)",
      "D. A 4.00 metros de la chapa"
    ],
    "correcta": 2,
    "explicacion": "Es el centro neurálgico geométrico de la cancha de squash, equidistante a los cuatro rincones."
  },
  {
    "id": 131,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Distancia de la T a las Esquinas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué distancia media recorre un jugador desde la T hacia cualquiera de las cuatro esquinas?",
    "opciones": [
      "A. Más de 10 metros",
      "B. Menos de medio metro",
      "C. 7 metros exactos",
      "D. Aproximadamente entre 3.0 y 4.5 metros con una estocada profunda (lunge)"
    ],
    "correcta": 3,
    "explicacion": "Plantarse en la T permite alcanzar los 4 ángulos de la cancha en 2 o 3 pasos dinámicos."
  },
  {
    "id": 132,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Caja de Saque Pegada a la Pared",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué distancia hay entre la caja de servicio y la pared lateral más cercana?",
    "opciones": [
      "A. Cero metros: está construida pegada directamente a la pared lateral",
      "B. 1 metro de distancia",
      "C. 2 metros",
      "D. 50 centímetros"
    ],
    "correcta": 0,
    "explicacion": "La caja de saque se ubica en el extremo lateral, compartiendo borde con la pared."
  },
  {
    "id": 133,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Solidez del Frontis",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué exigencia balística impone la WSF a la pared frontal de la cancha?",
    "opciones": [
      "A. Que sea flexible como cama elástica",
      "B. Homogeneidad absoluta en toda su superficie sin zonas huecas ni rebotes diferenciados",
      "C. Que se rompa para amortiguar",
      "D. Que tenga inclinación de 2 grados"
    ],
    "correcta": 1,
    "explicacion": "La respuesta balística debe ser uniforme en cada centímetro para que el rebote sea enteramente predecible."
  },
  {
    "id": 134,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura de Chapa en Dobles WSF",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿A qué altura se ubica la chapa (tin) en squash dobles oficial?",
    "opciones": [
      "A. A 60 cm",
      "B. A 20 cm",
      "C. A 43 cm (17 pulgadas), igual que en el tour profesional PSA de singles",
      "D. A 80 cm"
    ],
    "correcta": 2,
    "explicacion": "En dobles se reduce la chapa a 43 cm para favorecer el juego rápido de voleas y ataques."
  },
  {
    "id": 135,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Línea Roja en Vidrio Templado",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se fijan las líneas rojas superiores en las paredes de cristal?",
    "opciones": [
      "A. Con cinta de embalar común",
      "B. Con un proyector de luz",
      "C. No se marcan",
      "D. Mediante esmalte cerámico vitrificado horneado a alta temperatura en el vidrio"
    ],
    "correcta": 3,
    "explicacion": "El esmalte vitrificado a más de 600°C forma parte permanente del vidrio y no se borra con los impactos."
  },
  {
    "id": 136,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Piso Flotante Amortiguado",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué estructura se monta debajo de las tablas de madera del piso de squash?",
    "opciones": [
      "A. Rastreles sobre almohadillas elastoméricas que crean una cámara elástica de absorción",
      "B. Losa de hormigón macizo sin elásticos",
      "C. Arena suelta de playa",
      "D. Resortes de acero gigantes"
    ],
    "correcta": 0,
    "explicacion": "Este sistema flotante absorbe la desaceleración articular protegiendo meniscos y columna."
  },
  {
    "id": 137,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Origen del Tamaño Frente a Rackets",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué el squash redujo las medidas respecto a su antecesor, el 'Rackets' inglés?",
    "opciones": [
      "A. Porque los techos eran bajos",
      "B. Porque la pista de Rackets medía 18.3 m x 9.1 m y requería bolas duras; el squash la redujo a 9.75 m para goma",
      "C. Para jugar de a uno",
      "D. Por impuestos a canchas grandes"
    ],
    "correcta": 1,
    "explicacion": "El squash nació como una versión más dinámica, segura y compacta que el gigantesco juego de Rackets."
  },
  {
    "id": 138,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Pintura Antideslizante en Líneas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué característica especial tiene la pintura roja de las líneas del piso de squash?",
    "opciones": [
      "A. Barniz brillante resbaloso",
      "B. Tiza escolar soluble",
      "C. Acabado mate antideslizante que mantiene el mismo coeficiente de fricción que la madera",
      "D. Pintura al aceite gruesa"
    ],
    "correcta": 2,
    "explicacion": "Evita que el calzado patine al pisar las líneas delimitadoras durante frenadas violentas."
  },
  {
    "id": 139,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Sin Ventanas Solares Directas",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué se evita el ingreso de luz solar directa en una cancha de squash?",
    "opciones": [
      "A. Para jugar a oscuras",
      "B. Para que la bola no se derrita",
      "C. Por reglamento victoriano",
      "D. Porque los haces de sol proyectan sombras móviles que ocultan la pelota negra en el aire"
    ],
    "correcta": 3,
    "explicacion": "La luz solar directa deslumbra y crea sombras que impiden el seguimiento visual del proyectil."
  },
  {
    "id": 140,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Perpendicularidad de Esquinas",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué ángulo geométrico diedro forman las paredes laterales con el frontis?",
    "opciones": [
      "A. Exactamente 90° (perpendicularidad ortogonal estricta)",
      "B. 110° para agrandar la pista",
      "C. 75° agudo",
      "D. Curvas parabólicas"
    ],
    "correcta": 0,
    "explicacion": "La precisión balística de los botes y nicks exige esquinas perfectamente ortogonales a 90°."
  },
  {
    "id": 141,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Espacio de Seguridad Fuera de Cancha",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué espacio libre recomiendan los estándares WSF detrás de la pared trasera de cristal?",
    "opciones": [
      "A. 10 centímetros",
      "B. Al menos 2.0 metros libres para árbitros, cámaras y tránsito de jugadores",
      "C. 50 metros",
      "D. Cero metros; pegado a una pared ciega"
    ],
    "correcta": 1,
    "explicacion": "Se requiere un corredor despejado para la mesa de control, árbitro oficial y seguridad de ingreso."
  },
  {
    "id": 142,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Corte de las Tablas de Madera",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo se orientan habitualmente las tablas del piso en una cancha de squash?",
    "opciones": [
      "A. En círculos concéntricos",
      "B. En diagonal a 45 grados",
      "C. Longitudinalmente paralelas a las paredes laterales para facilitar el deslizamiento del calzado",
      "D. Perpendiculares a la frontal"
    ],
    "correcta": 2,
    "explicacion": "La orientación longitudinal sigue la dirección predominante de las carreras y estocadas de los jugadores."
  },
  {
    "id": 143,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Juntas de Vidrio con Silicona Estructural",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo se unen los paneles de vidrio templado en la pared trasera?",
    "opciones": [
      "A. Con barras gruesas de hierro que tapan la visión",
      "B. Con cinta adhesiva doble faz",
      "C. No se unen; quedan separados 10 cm",
      "D. Con juntas mínimas selladas con silicona estructural de alta resistencia sin marcos metálicos intermedios"
    ],
    "correcta": 3,
    "explicacion": "Las aletas de vidrio estructural brindan rigidez sin postes opacos que obstaculicen la visual de los jueces."
  },
  {
    "id": 144,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Contraste Óptico del Tin",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿De qué color suele pintarse el cuerpo de la chapa inferior en canchas oficiales?",
    "opciones": [
      "A. De color oscuro o metálico mate para distinguirlo con nitidez del blanco de la pared frontal",
      "B. Del mismo blanco idéntico de la pared para camuflarlo",
      "C. Verde fosforescente reflectante",
      "D. Transparente"
    ],
    "correcta": 0,
    "explicacion": "El contraste marcado entre la pared y el tin facilita la decisión visual instantánea de jugadores y árbitros."
  },
  {
    "id": 145,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Absorción Acústica en Tribuna",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué se instalan paneles acústicos absorbentes en el techo de los estadios de squash?",
    "opciones": [
      "A. Para amplificar el grito de los jugadores",
      "B. Para atenuar el eco y la reverberación de los pelotazos en un recinto cerrado con paredes duras",
      "C. Para calentar el ambiente",
      "D. Por exigencia de la televisión"
    ],
    "correcta": 1,
    "explicacion": "Las 4 paredes duras generan una cámara reverberante intensa; los paneles superiores absorben el eco ensordecedor."
  },
  {
    "id": 146,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Líneas de Falta en Dobles",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Varía la altura de la línea de saque en pared frontal entre singles y dobles WSF?",
    "opciones": [
      "A. En dobles sube a 3.0 metros",
      "B. En dobles baja a 1.0 metro",
      "C. No, la línea de saque (Cut line) se mantiene a 1.78 m en ambas modalidades",
      "D. En dobles no existe línea de saque"
    ],
    "correcta": 2,
    "explicacion": "La cota de servicio de 1.78 metros en el frontis es universal en singles y dobles estándar WSF."
  },
  {
    "id": 147,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Resistencia de Paredes de Yeso a Impactos",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué ensayo de resistencia física deben superar las paredes de yeso homologadas por la WSF?",
    "opciones": [
      "A. Soportar agua hirviendo",
      "B. Resistir disparos de armas de fuego",
      "C. No se ensayan",
      "D. Soportar impactos de proyectil de 300 km/h y choques corporales repetidos de 100 kg sin fisuras"
    ],
    "correcta": 3,
    "explicacion": "Los muros deben superar rigurosas pruebas de fatiga dinámica antes de ser certificados para competencias."
  },
  {
    "id": 148,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Pendiente del Suelo en Exteriores",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En canchas al aire libre experimentales, ¿qué drenaje se incorpora?",
    "opciones": [
      "A. Pisos modulares sintéticos permeables con micro-pendientes inferiores hacia canaletas perimetrales",
      "B. Pisos de madera flotante tradicional",
      "C. Fosas abiertas de tierra",
      "D. No existen canchas exteriores"
    ],
    "correcta": 0,
    "explicacion": "El squash al aire libre requiere superficies que evacuen el agua de lluvia sin perder agarre ni rebote."
  },
  {
    "id": 149,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "Altura de Vidrio en Show Courts",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuánto miden de alto las paredes laterales de cristal en una cancha panorámica de torneo?",
    "opciones": [
      "A. Miden 10 metros en todo el perímetro",
      "B. Siguen la pendiente reglamentaria descendente de 4.57 m en la frontal a 2.13 m en la trasera",
      "C. Miden solo 1 metro como una barandilla",
      "D. Son completamente cúbicas de 5 metros"
    ],
    "correcta": 1,
    "explicacion": "Las canchas de vidrio de cristal transparente respetan con exactitud milimétrica la geometría reglamentaria de la WSF."
  },
  {
    "id": 150,
    "area": "Geometría, Dimensiones y Especificaciones de la Cancha",
    "subtema": "La Cancha como Sistema Geométrico Cerrado",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué ventaja física otorga al squash ser un deporte en un recinto geométrico tridimensional cerrado?",
    "opciones": [
      "A. Que no se necesita árbitro",
      "B. Que la pelota nunca pierde velocidad",
      "C. Permite reutilizar la energía de la pelota en múltiples paredes, combinando balística, ángulos y resistencia física",
      "D. Que no se puede sudar"
    ],
    "correcta": 2,
    "explicacion": "La interacción con las 4 paredes transforma al squash en un juego de ajedrez cinético tridimensional a 200 km/h."
  },
  {
    "id": 151,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Agarre Universal (Grip)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo se debe colocar la mano en la empuñadura de la raqueta de squash (Grip estándar)?",
    "opciones": [
      "A. Con la palma completamente plana sobre la cara ancha de la empuñadura (empuñadura de sartén)",
      "B. Sujetando la raqueta desde el corazón del marco",
      "C. Con los dedos cruzados sobre el botón inferior",
      "D. Formando una 'V' entre el pulgar y el índice alineada con el bisel superior izquierdo del mango (tipo apretón de manos)"
    ],
    "correcta": 3,
    "explicacion": "El agarre continental/universal en 'V' permite golpear tanto el drive como el revés sin cambiar la posición de la mano."
  },
  {
    "id": 152,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Muñeca 'Cocked'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué en la técnica clásica de squash se mantiene la muñeca 'quebrada' hacia arriba ('cocked wrist')?",
    "opciones": [
      "A. Mantiene la cara de la raqueta abierta a 45° y permite una aceleración tardía del antebrazo mediante pronación/supinación",
      "B. Para cansar menos los dedos",
      "C. Para evitar que la raqueta toque el piso",
      "D. Para engañar al árbitro sobre la dirección del tiro"
    ],
    "correcta": 0,
    "explicacion": "La muñeca extendida ('cocked') fija el ángulo de la cara de la raqueta y actúa como palanca elástica en el impacto."
  },
  {
    "id": 153,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Straight Drive (Paralelo)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el objetivo técnico primordial de un Straight Drive o tiro paralelo al fondo?",
    "opciones": [
      "A. Que la pelota rebote hacia la mitad de la cancha",
      "B. Que la pelota viaje rozando la pared lateral y su segundo bote se produzca lo más pegado posible a la pared trasera",
      "C. Golpear al oponente en el cuerpo",
      "D. Que la pelota pegue en el techo"
    ],
    "correcta": 1,
    "explicacion": "Un drive de longitud ideal 'muere' en la esquina trasera, obligando al rival a raspar la pelota contra el vidrio."
  },
  {
    "id": 154,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Boast Tradicional",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo se ejecuta biomecánicamente un Boast tradicional de 3 paredes?",
    "opciones": [
      "A. Golpeando la frontal y luego el piso dos veces",
      "B. Golpeando el techo primero",
      "C. Golpeando primero la pared lateral cercana; la pelota viaja luego a la pared frontal y cae en la esquina delantera opuesta",
      "D. Golpeando la pared trasera con la mano"
    ],
    "correcta": 2,
    "explicacion": "El boast utiliza la pared lateral como rampa balística hacia el frontis para mover al rival hacia la esquina frontal contraria."
  },
  {
    "id": 155,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Trickle Boast",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué diferencia al Trickle Boast de un boast tradicional?",
    "opciones": [
      "A. Es un tiro que se juega con los ojos cerrados",
      "B. Es un saque potente desde la caja",
      "C. Se golpea con dos raquetas simultáneas",
      "D. Se golpea desde la zona delantera o media de la cancha con ángulo cerrado a la pared lateral para que muera justo sobre el tin"
    ],
    "correcta": 3,
    "explicacion": "El trickle boast es un tiro ofensivo de engaño jugado muy adelante que sorprende al rival que espera un drop paralelo."
  },
  {
    "id": 156,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Skid Boast",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué características de trayectoria tiene el tiro 'Skid Boast'?",
    "opciones": [
      "A. Es un tiro muy alto y potente a la pared lateral trasera que cruza el techo de la cancha y cae en el rincón delantero opuesto",
      "B. Un golpe plano que va directo al tin",
      "C. Un saque bajo y rasante",
      "D. Un tiro defensivo que no toca la frontal"
    ],
    "correcta": 0,
    "explicacion": "El skid boast vuela por las alturas de la cancha fuera del alcance de la volea del rival, cayendo con efecto en la otra punta."
  },
  {
    "id": 157,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Drop Shot (Dejada)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo se amortigua la pelota en la ejecución de un Drop Shot perfecto?",
    "opciones": [
      "A. Golpeando la pelota con toda la fuerza del brazo",
      "B. Con la cara de la raqueta abierta, acompañando suavemente la pelota para que pase a milímetros del tin y bote con mínimo rebote",
      "C. Haciendo un swing completo hacia abajo",
      "D. Tirando la raqueta al suelo"
    ],
    "correcta": 1,
    "explicacion": "El drop requiere desacelerar la cabeza de la raqueta y rozar la bola con ligero underspin para que 'muera' en la esquina delantera."
  },
  {
    "id": 158,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Volea (Volley)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué la volea es considerada una de las armas técnicas más dominantes del squash moderno?",
    "opciones": [
      "A. Porque otorga 2 puntos en el marcador",
      "B. Porque la pelota no se puede devolver de volea",
      "C. Porque intercepta la pelota antes del bote, quitándole entre 1 y 2 segundos de tiempo de recuperación y posicionamiento al rival",
      "D. Porque está prohibida en categoría principiante"
    ],
    "correcta": 2,
    "explicacion": "Volear en la T asfixia el tiempo del oponente, obligándolo a correr en déficit de recuperación constante."
  },
  {
    "id": 159,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Lob Defensivo",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué situación táctica se debe recurrir biomecánicamente al Lob (Globo)?",
    "opciones": [
      "A. Solo en el punto de partido",
      "B. Para romper la pelota",
      "C. Cuando el rival está en el fondo",
      "D. Cuando el rival nos tiene bajo presión extrema en una esquina delantera y necesitamos tiempo para recuperar el centro de la T"
    ],
    "correcta": 3,
    "explicacion": "El lob eleva la pelota a más de 4 metros, dándonos de 3 a 4 segundos valiosos para recolocar los pies en la T."
  },
  {
    "id": 160,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Kill Shot",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la mecánica de impacto en un tiro de remate o 'Kill Shot'?",
    "opciones": [
      "A. Un golpe plano, tenso y muy rápido que pasa rozando la chapa metálica (tin) para que el segundo bote ocurra antes de la línea corta",
      "B. Un tiro alto al techo",
      "C. Un saque bombeado",
      "D. Un boast que toca tres paredes"
    ],
    "correcta": 0,
    "explicacion": "El kill shot busca una trayectoria rectilínea supersónica con rebote bajísimo que fulmina el rally."
  },
  {
    "id": 161,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Tiro Cruzado (Crosscourt)",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué precaución técnica se debe tener al jugar un Crosscourt desde el fondo de la cancha?",
    "opciones": [
      "A. Golpear con los ojos vendados",
      "B. Asegurar que la pelota sobrepase la T con suficiente altura o ángulo para que el oponente no la intercepte de volea",
      "C. Pegarle con el mango de la raqueta",
      "D. Avisar al rival antes de tirar"
    ],
    "correcta": 1,
    "explicacion": "Un crosscourt bajo o mal angulado queda 'flotando' en la T para que el rival lo fulmine con una volea al nick."
  },
  {
    "id": 162,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Estocada y Pierna de Apoyo",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Al golpear un drive de derecha para un jugador diestro tradicional, ¿qué pierna suele adelantar en la estocada (lunge)?",
    "opciones": [
      "A. Ambas piernas juntas como en un salto",
      "B. La pierna derecha hacia atrás en el aire",
      "C. La pierna izquierda (pierna contraria) con la rodilla flexionada a 90° para equilibrar el centro de gravedad",
      "D. Se golpea sentado en el piso"
    ],
    "correcta": 2,
    "explicacion": "La estocada con la pierna opuesta estabiliza la pelvis y permite transferir el peso del cuerpo linealmente hacia la pelota."
  },
  {
    "id": 163,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Posición Abierta (Open Stance)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué consiste golpear en 'Open Stance' (posición abierta) en el squash moderno?",
    "opciones": [
      "A. Jugar con la puerta de la cancha abierta",
      "B. Golpear sin mirar la pelota",
      "C. Sujetar la raqueta con el brazo izquierdo",
      "D. Golpear apoyándose en la pierna del mismo lado del tiro (ej. pierna derecha en el drive de derecha) para salir más rápido hacia la T"
    ],
    "correcta": 3,
    "explicacion": "El open stance ahorra un paso de giro y permite empujar de vuelta a la T en una fracción de segundo menor."
  },
  {
    "id": 164,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Armado Temprano de la Raqueta",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los entrenadores insisten en 'armar la raqueta temprano' ('racket up early') al desplazarse?",
    "opciones": [
      "A. Porque tener la raqueta armada mientras se corre permite ajustar el timing y no apurar el swing en el último instante",
      "B. Para intimidar físicamente al árbitro",
      "C. Para no tropezar con las cuerdas",
      "D. Porque está en el reglamento como norma de etiqueta"
    ],
    "correcta": 0,
    "explicacion": "Llegar a la pelota con la raqueta ya levantada y la muñeca firme garantiza un impacto controlado y opciones de engaño."
  },
  {
    "id": 165,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El 'Hold' o Engaño de Tiempo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo se ejecuta la técnica de engaño conocida como 'Hold'?",
    "opciones": [
      "A. Retener la pelota en las cuerdas por 2 segundos",
      "B. Manteniendo la misma preparación de golpeo hasta el último milisegundo para congelar al oponente en la T antes de decidir el tiro",
      "C. Gritar 'Hold' durante el rally",
      "D. Pedir tiempo fuera con las manos"
    ],
    "correcta": 1,
    "explicacion": "El hold es el arte de la anticipación demorada: el rival no puede iniciar el arranque porque no sabe si saldrá drop, drive o boast."
  },
  {
    "id": 166,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Terminación del Swing (Follow-Through)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la función biomecánica de una terminación completa y fluida del swing?",
    "opciones": [
      "A. Golpear la pared lateral para hacer ruido",
      "B. Tocar al oponente para pedir Stroke",
      "C. Disipar las fuerzas mecánicas de frenado muscular de forma segura y garantizar la dirección y profundidad del tiro",
      "D. Girar 360 grados en el aire"
    ],
    "correcta": 2,
    "explicacion": "La deceleración progresiva del brazo en el follow-through evita lesiones tendinosas y asegura consistencia balística."
  },
  {
    "id": 167,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Volea al Nick",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué exige técnicamente lograr una volea al Nick desde el centro de la cancha?",
    "opciones": [
      "A. Golpear con fuerza bruta contra la chapa",
      "B. Tirar la raqueta hacia adelante",
      "C. Saltar con ambos pies por encima de la T",
      "D. Máxima precisión angular para que la pelota impacte exactamente en la grieta entre pared lateral y suelo sin rebotar"
    ],
    "correcta": 3,
    "explicacion": "La volea al nick es uno de los tiros más virtuosos y arriesgados: un error de milímetros es tin o tiro fácil para el rival."
  },
  {
    "id": 168,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Backwall Drive",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo se debe calcular la distancia para golpear una pelota que viene rebotando de la pared trasera?",
    "opciones": [
      "A. Anticipar el rebote alejándose de la pared trasera para impactar la pelota cuando comience a descender hacia adelante",
      "B. Pegarse con la espalda al vidrio e intentar empujar la bola",
      "C. Esperar a que la pelota dé 3 botes en el suelo",
      "D. Golpear con la raqueta invertida hacia atrás"
    ],
    "correcta": 0,
    "explicacion": "El jugador debe dejar salir la pelota de la pared trasera y pararse a distancia óptima para transferir el peso hacia el frente."
  },
  {
    "id": 169,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Rotación de Hombros y Tronco",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué plano anatómico se genera la mayor parte de la potencia rotacional en el swing de squash?",
    "opciones": [
      "A. En el plano frontal de saltos laterales",
      "B. En el plano transversal mediante la rotación coordinada de la cintura escapular y pélvica",
      "C. Exclusivamente en los músculos del cuello",
      "D. Solo en la flexión del dedo pulgar"
    ],
    "correcta": 1,
    "explicacion": "El swing eficiente nace de la torsión del core (tronco) y se transfiere en cadena cinética hacia el hombro, codo y muñeca."
  },
  {
    "id": 170,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Volea-Drop",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué dificultad técnica presenta ejecutar un Volea-Drop (Volley Drop)?",
    "opciones": [
      "A. Requiere pegarle con el doble de fuerza",
      "B. Se debe golpear de espaldas al frontis",
      "C. Exige 'manos suaves' (soft hands) para absorber la alta velocidad de la pelota que viene en el aire y depositarla pegada al tin",
      "D. Solo se permite de revés"
    ],
    "correcta": 2,
    "explicacion": "El volley drop transforma la violencia del tiro del rival en una caricia amortiguada que muere en la esquina frontal."
  },
  {
    "id": 171,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Punto de Contacto Adelantado",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Dónde debe producirse el punto de impacto ideal de la pelota respecto al cuerpo del jugador?",
    "opciones": [
      "A. Detrás de la espalda del jugador",
      "B. Exactamente entre los dos talones",
      "C. A la altura de la oreja",
      "D. Ligeramente por delante de la rodilla adelantada para maximizar la palanca mecánica y la visión de la bola"
    ],
    "correcta": 3,
    "explicacion": "Impactar adelante permite ver la pelota en el momento del choque y transferir todo el momento lineal del cuerpo."
  },
  {
    "id": 172,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Golpe de Revés (Backhand)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué muchos jugadores experimentados consideran el revés de squash más consistente que el drive de derecha?",
    "opciones": [
      "A. Porque la anatomía del hombro bloquea naturalmente el plano de swing y la pared lateral sirve de guía de alineación",
      "B. Porque se usa una raqueta diferente",
      "C. Porque la pelota vuela más lenta de revés",
      "D. Porque no requiere mover los pies"
    ],
    "correcta": 0,
    "explicacion": "La estructura biomecánica del revés con el hombro adelantado limita oscilaciones parasitarias, favoreciendo tiros rectos y limpios."
  },
  {
    "id": 173,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Corkscrew Flick (Tiro Tirabuzón)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué trayectoria describe el tiro de fantasía 'Corkscrew' en squash?",
    "opciones": [
      "A. Un saque bajo que va al tin",
      "B. Una pelota alta golpeada al rincón delantero que rebota en pared lateral y frontal, cruzando el techo en diagonal hacia atrás",
      "C. Un drop shot que pega 4 veces en el piso",
      "D. Un tiro recto entre las piernas del rival"
    ],
    "correcta": 1,
    "explicacion": "El corkscrew es un golpe poco ortodoxo y vistoso que descoloca la posición de los jugadores con trayectorias curvas."
  },
  {
    "id": 174,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Amortiguamiento de Cuerdas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo influye aflojar ligeramente la presión de los dedos sobre el grip en el momento del impacto de una dejada?",
    "opciones": [
      "A. Hace que la raqueta salga volando",
      "B. Aumenta la velocidad de salida de la pelota",
      "C. Aumenta la absorción de energía cinética, haciendo que la raqueta funcione como un cojín amortiguador",
      "D. Produce un sonido agudo en el encordado"
    ],
    "correcta": 2,
    "explicacion": "El 'toque' de los maestros (como Amr Shabana o Ramy Ashour) reside en relajar los dedos en el milisegundo del impacto."
  },
  {
    "id": 175,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Crosscourt Nick",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el objetivo táctico de tirar un Crosscourt al Nick?",
    "opciones": [
      "A. Pasar la pelota lentamente al rival",
      "B. Calentar la pelota en el fondo",
      "C. Darle tiempo al rival de recuperarse",
      "D. Cruzar la pelota con ángulo pronunciado hacia la pared lateral contraria buscando el vértice con el piso para terminar el punto"
    ],
    "correcta": 3,
    "explicacion": "Es un tiro ofensivo de alto riesgo y alta recompensa que busca la unión exacta entre la pared lateral y la duela."
  },
  {
    "id": 176,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Grip en el Remate",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Para un remate potente, ¿cómo debe comportarse la presión de los dedos en el mango durante el recorrido del swing?",
    "opciones": [
      "A. Suelto y relajado durante el armado y aceleración, apretando con firmeza en el instante del impacto",
      "B. Totalmente rígido y apretado desde antes de iniciar el paso",
      "C. Completamente flojo de modo que la raqueta gire sola",
      "D. Sujetando la empuñadura con dos dedos únicamente"
    ],
    "correcta": 0,
    "explicacion": "La tensión prematura agarrota los músculos del antebrazo y frena la aceleración del látigo; la firmeza solo va en el impacto."
  },
  {
    "id": 177,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Drive Cortado (Slice Drive)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué se utiliza el efecto de slice en los drives pegados a la pared lateral?",
    "opciones": [
      "A. Para que la pelota haga curvas en el aire",
      "B. Porque hace que la pelota se mantenga baja tras el rebote en la pared trasera, complicando la devolución del rival",
      "C. Para romper las cuerdas del rival",
      "D. Porque es obligatorio por reglamento"
    ],
    "correcta": 1,
    "explicacion": "El backspin frena la pelota al chocar contra la pared de cristal trasera y la hace caer pegada al piso sin rebotar hacia afuera."
  },
  {
    "id": 178,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Volea de Revés Alta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué músculo principal del hombro se encarga de fijar la articulación en una volea de revés alta a nivel de cabeza?",
    "opciones": [
      "A. El bíceps femoral de la pierna",
      "B. El pectoral mayor",
      "C. El deltoides posterior junto con el manguito rotador (infraespinoso y redondo menor)",
      "D. Los gemelos"
    ],
    "correcta": 2,
    "explicacion": "El deltoides posterior y el manguito rotador sostienen la raqueta contra la inercia de la bola en las voleas altas de revés."
  },
  {
    "id": 179,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Paso de Frenada (Brake Step)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el rol biomecánico del pie trasero durante la estocada del golpeo?",
    "opciones": [
      "A. Se levanta en el aire para no ensuciar el piso",
      "B. Debe estar apoyado de puntillas",
      "C. No cumple ninguna función",
      "D. Actúa como ancla y freno de arrastre, permitiendo empujar hacia atrás de inmediato hacia la T sin perder el balance"
    ],
    "correcta": 3,
    "explicacion": "El pie trasero regula el descenso del centro de gravedad y almacena energía elástica en los tendones para el retorno a la T."
  },
  {
    "id": 180,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Golpe Defensivo de Esquina",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Cuando la pelota está literalmente pegada a la pared lateral (en la ranura), ¿cómo se debe colocar la raqueta?",
    "opciones": [
      "A. Con la cara de la raqueta muy abierta y una preparación corta, rascando la pared lateral hacia adelante",
      "B. Con un swing gigantesco de béisbol",
      "C. Golpeando la pared trasera primero con fuerza",
      "D. Soplando la pelota hacia afuera"
    ],
    "correcta": 0,
    "explicacion": "Con la pelota pegada a la pared no hay espacio para swings amplios; se requiere una preparación compacta y cara abierta."
  },
  {
    "id": 181,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Drop Cruzado (Crosscourt Drop)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el principal peligro biomecánico y táctico de un Crosscourt Drop mal ejecutado?",
    "opciones": [
      "A. Que la raqueta se doble",
      "B. Si no muere en el nick, cruza por la zona de la T y queda a merced de una volea asesina del oponente",
      "C. Que el árbitro cobre falta de dirección",
      "D. Que la pelota se enfríe de golpe"
    ],
    "correcta": 1,
    "explicacion": "Un crosscourt drop flojo vuela despacio por el centro de la cancha, convirtiéndose en un blanco perfecto para el rival en la T."
  },
  {
    "id": 182,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Disguise de Volea",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo engañan los profesionales con su postura al volear en el centro de la cancha?",
    "opciones": [
      "A. Cierran los ojos antes de impactar",
      "B. Cambian de raqueta en el aire",
      "C. Preparan la raqueta con el codo alto mostrando postura de drive violento y a último instante tocan suave un drop al rincón",
      "D. Pisan la línea de saque"
    ],
    "correcta": 2,
    "explicacion": "El engaño visual en la T congela las piernas del adversario en el fondo de la cancha, haciéndolo incapaz de llegar a la dejada."
  },
  {
    "id": 183,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Volea de revés con salto",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué jugadores acrobáticos (como Miguel Ángel Rodríguez) realizan voleas con salto en la T?",
    "opciones": [
      "A. Por lucirse ante el público exclusivamente",
      "B. Porque saltar suma puntos adicionales",
      "C. Porque la pelota está electrificada",
      "D. Para cortar pelotas altas que de otro modo pasarían por encima y mantener el ritmo de ataque asfixiante"
    ],
    "correcta": 3,
    "explicacion": "El salto intercepta el lob en su punto más alto antes de que llegue al fondo, manteniendo la presión en el rival."
  },
  {
    "id": 184,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Mano Izquierda como Contrapeso",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué función cumple el brazo no dominante (izquierdo para un diestro) durante la preparación del swing?",
    "opciones": [
      "A. Apunta hacia la pelota para medir la distancia y equilibra la rotación del tronco como contrapeso dinámico",
      "B. Debe ir guardado en el bolsillo",
      "C. Se apoya en la rodilla para descansar",
      "D. Sujeta la toalla de secado"
    ],
    "correcta": 0,
    "explicacion": "El brazo contrario equilibra el momento angular del cuerpo y ayuda a estabilizar la cintura escapular."
  },
  {
    "id": 185,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Centro de Gravedad en el Swing",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los jugadores de squash flexionan tanto las rodillas bajando el centro de gravedad al golpear?",
    "opciones": [
      "A. Para parecer más pequeños en la cancha",
      "B. Para ganar estabilidad biomecánica, ver la pelota a la altura de los ojos y permitir una base sólida de empuje",
      "C. Para no tocar el techo con la cabeza",
      "D. Porque el reglamento penaliza jugar de pie"
    ],
    "correcta": 1,
    "explicacion": "Bajar el centro de gravedad permite nivelar el plano del swing con la altura baja de la pelota tras el bote."
  },
  {
    "id": 186,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El 'Mizuki' (Golpe de Fantasía)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué es el golpe de exhibición bautizado como 'Mizuki' en el squash contemporáneo?",
    "opciones": [
      "A. Un saque ejecutado con el pie",
      "B. Un cabezazo reglamentario",
      "C. Un tiro donde el jugador amaga golpear de derecha pero en el último segundo cruza la raqueta por el otro lado de la bola",
      "D. Un boast entre las piernas hacia atrás"
    ],
    "correcta": 2,
    "explicacion": "Popularizado por jugadores creativos, el Mizuki desconcierta por completo la lectura visual del oponente."
  },
  {
    "id": 187,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Split-Step en Squash",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué consiste el 'Split-Step' o salto de activación antes de que el rival golpee la pelota?",
    "opciones": [
      "A. Un salto para tocar la pared trasera",
      "B. Un paso hacia atrás para descansar",
      "C. Un estiramiento de yoga en la T",
      "D. Un pequeño rebote en los metatarsos para precargar el ciclo de estiramiento-acortamiento muscular y reaccionar en cualquier dirección"
    ],
    "correcta": 3,
    "explicacion": "El split-step desincroniza los apoyos y precarga los husos neuromusculares de los gemelos para acelerar en milisegundos."
  },
  {
    "id": 188,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Tiro 'Tombstone' (Lápida)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué se conoce coloquialmente en squash como un tiro 'Tombstone'?",
    "opciones": [
      "A. Un tiro tan perfectamente pegado a la pared lateral que la pelota no deja espacio físico para meter la raqueta",
      "B. Un golpe que rompe la pared",
      "C. Un tiro que golpea al árbitro",
      "D. Un saque fallido por debajo del tin"
    ],
    "correcta": 0,
    "explicacion": "Se llama así porque el tiro 'entierra' la opción de devolución del rival al estar milimétricamente pegado al muro."
  },
  {
    "id": 189,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Transferencia de Peso Lineal",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué momento del swing debe ocurrir la transferencia máxima de peso hacia el pie delantero?",
    "opciones": [
      "A. Después de que la pelota ya tocó la pared frontal",
      "B. Justo en el instante del impacto con la pelota, coordinando la traslación lineal con la rotación angular",
      "C. Antes de iniciar la carrera hacia la bola",
      "D. Nunca; el peso debe ir siempre en el talón trasero"
    ],
    "correcta": 1,
    "explicacion": "Sincronizar el pico de transferencia de masa con el choque maximiza la velocidad de salida de la pelota."
  },
  {
    "id": 190,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Wrist Snap (Latigazo de Muñeca)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Es recomendable usar un 'muñecazo' excesivo y descontrolado en los drives básicos de squash?",
    "opciones": [
      "A. Sí, todos los golpes deben hacerse solo con la muñeca sin mover el brazo",
      "B. Sí, porque duplica la velocidad sin esfuerzo",
      "C. No, la muñeca debe mantenerse firme; el exceso de muñequeo provoca imprecisión balística y lesiones de tendones",
      "D. Es obligatorio por la WSF"
    ],
    "correcta": 2,
    "explicacion": "El squash moderno enfatiza la firmeza de la muñeca y la aceleración del antebrazo; la muñeca suelta genera tiros erráticos."
  },
  {
    "id": 191,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Volea-Boast",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué ventaja táctica ofrece ejecutar un Volea-Boast en la T?",
    "opciones": [
      "A. Permite descansar durante el tiro",
      "B. Asegura que el tiro sea Let",
      "C. No tiene ninguna ventaja",
      "D. Acelera de forma fulminante el cambio de dirección del juego, tomando al rival a contrapié en su camino a la T"
    ],
    "correcta": 3,
    "explicacion": "Cortar la pelota de volea contra la pared lateral inmediata crea un ángulo agudo que suele ser ganador directo."
  },
  {
    "id": 192,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Smash en Squash",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué el remate por encima de la cabeza (Overhead Smash) se usa menos en squash que en tenis o pádel?",
    "opciones": [
      "A. Porque una pelota aplastada hacia abajo suele rebotar alto en el suelo y regalar tiempo al rival si no entra en el nick",
      "B. Porque el reglamento prohíbe golpear por encima de la cabeza",
      "C. Porque la raqueta de squash se quiebra",
      "D. Porque la pelota no vuela alto"
    ],
    "correcta": 0,
    "explicacion": "En squash, rematar hacia abajo con fuerza suele generar rebotes francos para el rival; se prefiere amortiguar o tirar con ángulo."
  },
  {
    "id": 193,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Mirada en la Pelota (Eye on the Ball)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Hasta qué microsegundo debe el jugador mantener la vista fijada en la pelota?",
    "opciones": [
      "A. Solo hasta que la pelota sale de la raqueta del rival",
      "B. Hasta el instante exacto del impacto con el centro de las cuerdas, sin levantar la vista prematuramente hacia la pared frontal",
      "C. No hace falta mirar la pelota; se juega de memoria",
      "D. Se debe mirar siempre al árbitro"
    ],
    "correcta": 1,
    "explicacion": "Mirar el impacto garantiza golpear en el punto dulce; levantar la cabeza antes de tiempo provoca golpes en el marco."
  },
  {
    "id": 194,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "Ajuste de Pasos Cortos (Chassé)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué los últimos pasos antes de golpear la pelota deben ser pasos cortos de ajuste ('micro-steps')?",
    "opciones": [
      "A. Para cansar al rival con el ruido de las zapatillas",
      "B. Para no gastar la suela del calzado",
      "C. Para calibrar con precisión milimétrica la distancia del cuerpo a la pelota y no quedar encimado o estirado",
      "D. Para bailar en la cancha"
    ],
    "correcta": 2,
    "explicacion": "Los micro-pasos de ajuste permiten posicionar el centro de gravedad a la distancia biomecánica óptima de extensión."
  },
  {
    "id": 195,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Drive Cruzado Alto (High Crosscourt)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuándo se utiliza un Drive Cruzado Alto en lugar de un crosscourt plano?",
    "opciones": [
      "A. Para que la pelota toque las luces",
      "B. Cuando se rompe el encordado",
      "C. Solo en el calentamiento",
      "D. Para pasar por encima de la volea de un oponente alto en la T y enviar la pelota profundamente a la otra esquina trasera"
    ],
    "correcta": 3,
    "explicacion": "El crosscourt alto neutraliza al rival que volea en la T obligándolo a retroceder a la defensiva."
  },
  {
    "id": 196,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Torsión de Cadera en el Revés",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo debe orientarse la cadera al preparar un revés pegado a la pared lateral izquierda?",
    "opciones": [
      "A. Cerrada y de espaldas a la pared lateral, girando el cuerpo hacia la pared trasera para cargar energía elástica",
      "B. Mirando de frente hacia el público de la tribuna",
      "C. Totalmente de frente a la pared frontal",
      "D. Arrodillada en el suelo"
    ],
    "correcta": 0,
    "explicacion": "Girar la cadera alejándola de la frontal carga la musculatura glútea y dorsal para desatar el swing hacia adelante."
  },
  {
    "id": 197,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Golpe con Amague de Dejada",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Si el jugador amaga un drop shot en la esquina delantera y a último momento tira un lob largo al fondo:",
    "opciones": [
      "A. Comete una falta de etiqueta deportiva",
      "B. Provoca un desbalance absoluto en el rival que ya venía corriendo hacia adelante para cubrir la dejada",
      "C. El árbitro debe cantar Let de inmediato",
      "D. Pierde el punto por cambiar de opinión"
    ],
    "correcta": 1,
    "explicacion": "Este contra-amague (fake drop to lob) es una de las combinaciones más destructivas y elegantes del squash de élite."
  },
  {
    "id": 198,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "El Tiro 'Philadelphia' (Vuelta a la Cancha)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué es el legendario tiro 'Philadelphia' o tiro de tres paredes invertido?",
    "opciones": [
      "A. Un saque ejecutado con dos pelotas",
      "B. Un drop shot que pega en los 4 vidrios",
      "C. Un lob jugado desde el fondo hacia la esquina frontal opuesta que toca lateral, frontal y cruza la cancha hacia la otra pared lateral",
      "D. Un remate contra la puerta de cristal"
    ],
    "correcta": 2,
    "explicacion": "Popularizado en Filadelfia, este tiro describe una parábola geométrica inverosímil que envuelve toda la cancha."
  },
  {
    "id": 199,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Flexibilidad de Muñeca en Dejada",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo debe sentirse la mano sobre la empuñadura en una dejada de toque sutil?",
    "opciones": [
      "A. Apretando con la fuerza de una prensa hidráulica",
      "B. Sin tocar la raqueta con el pulgar",
      "C. Con los dedos enguantados en yeso",
      "D. Como sostener un pajarito o un huevo frágil: firme para que no escape pero suave para no romperlo"
    ],
    "correcta": 3,
    "explicacion": "La metáfora clásica de los maestros ingleses describe la sensibilidad táctil requerida para frenar la pelota en el tin."
  },
  {
    "id": 200,
    "area": "Técnica de Golpeo, Biomecánica y Cadenas Cinéticas",
    "subtema": "La Respiración durante el Swing",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué momento del golpeo de máxima potencia se debe exhalar el aire?",
    "opciones": [
      "A. Justo en la aceleración e impacto, liberando la presión intraabdominal y relajando los hombros",
      "B. Aguantando la respiración durante todo el rally",
      "C. Inhalando aire al momento de golpear",
      "D. No tiene ninguna relación biomecánica"
    ],
    "correcta": 0,
    "explicacion": "Exhalar en el golpe activa el transverso abdominal y estabiliza la columna sin rigidez en el cuello y hombros."
  },
  {
    "id": 201,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Posición de la 'T'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué el control físico y espacial de la 'T' es el fundamento táctico supremo del squash?",
    "opciones": [
      "A. Porque otorga un punto extra en cada rally",
      "B. Porque minimiza la distancia media de desplazamiento a los 4 rincones (≈3 m frente a >5 m para el rival)",
      "C. Porque desde allí el árbitro no puede ver las faltas",
      "D. Porque está prohibido que el rival ingrese a la T"
    ],
    "correcta": 1,
    "explicacion": "Quien domina la T recorre la mitad de distancia que su oponente en cada intercambio, asfixiándolo físicamente."
  },
  {
    "id": 202,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Concepto de 'Length'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué significa el principio táctico de 'Length' (longitud) en squash?",
    "opciones": [
      "A. Medir la longitud de la raqueta antes del partido",
      "B. Jugar rallies que duren más de 10 minutos",
      "C. Colocar la pelota consistentemente en el fondo de la cancha pegada a las paredes para sacar al rival de la T",
      "D. Estar parado lo más lejos posible de la frontal"
    ],
    "correcta": 2,
    "explicacion": "La longitud profunda obliga al rival a retroceder detrás de la T y golpear bajo presión defensiva en las esquinas traseras."
  },
  {
    "id": 203,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Concepto de 'Width'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué objetivo persigue el principio táctico de 'Width' (amplitud o ancho de tiro)?",
    "opciones": [
      "A. Ensanchar la cancha con empujones",
      "B. Usar raquetas más anchas de lo permitido",
      "C. Golpear con las dos manos abiertas",
      "D. Abrir los ángulos de tiro hacia las paredes laterales para estirar al rival y evitar que domine el centro"
    ],
    "correcta": 3,
    "explicacion": "El 'Width' obliga al adversario a moverse horizontalmente fuera del eje central de la cancha."
  },
  {
    "id": 204,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Gestión del Ritmo de Juego",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo desarticula un jugador táctico el ritmo respiratorio de su rival?",
    "opciones": [
      "A. Alternando tiros rápidos y tensos a ras de chapa con lobs lentos y altos que cambian la velocidad y la altura del intercambio",
      "B. Pidiendo pausas al árbitro en cada punto",
      "C. Cambiando de zapatillas en cada game",
      "D. Golpeando siempre a la misma velocidad fija"
    ],
    "correcta": 0,
    "explicacion": "Variar la cadencia entre velocidad anaeróbica y pausas aéreas desincroniza la respiración y los apoyos del oponente."
  },
  {
    "id": 205,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Lectura del Rival y Anticipación",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué indicadores visuales permiten a un jugador de élite anticipar el tiro del oponente antes de que golpee?",
    "opciones": [
      "A. El color de la camiseta del rival",
      "B. La orientación de la cadera, el ángulo de la cara de la raqueta y la posición relativa de la pelota respecto a los pies",
      "C. La marca de las cuerdas de la raqueta",
      "D. El sonido de la respiración únicamente"
    ],
    "correcta": 1,
    "explicacion": "La anticipación experta no es adivinanza; es lectura biomecánica de la cadena cinética del rival en milisegundos."
  },
  {
    "id": 206,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Atacar el Lado Débil",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Si el oponente tiene un revés inconsistente o lento bajo presión, la estrategia básica indica:",
    "opciones": [
      "A. Tirarle solo a su golpe más fuerte de derecha",
      "B. Evitar jugar hacia ese lado de la cancha",
      "C. Fijarlo con drives paralelos y crosscourts profundos sobre su revés para forzar tiros cortos y definir adelante",
      "D. Avisarle para que mejore su técnica"
    ],
    "correcta": 2,
    "explicacion": "Presionar de forma sistemática la debilidad técnica del adversario genera tiros cómodos para rematar."
  },
  {
    "id": 207,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Patrón del Reloj de Arena",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué consiste el patrón táctico clásico de desgaste en forma de 'X' o reloj de arena?",
    "opciones": [
      "A. Jugar mirando un reloj de arena en la tribuna",
      "B. Tirar la pelota en círculos concéntricos",
      "C. Esperar a que se acabe el tiempo de juego",
      "D. Mover al rival diagonalmente de una esquina trasera a la esquina delantera opuesta, maximizando su recorrido físico"
    ],
    "correcta": 3,
    "explicacion": "Los tiros diagonales y esquinas cruzadas obligan al rival a recorrer la distancia máxima de la cancha (más de 11 metros por tiro)."
  },
  {
    "id": 208,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Cuándo Tirar la Dejada",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el momento táctico idóneo para jugar un drop shot ofensivo?",
    "opciones": [
      "A. Cuando el rival ha quedado atrapado detrás nuestro en el fondo de la cancha y tenemos tiempo y balance en la T",
      "B. Cuando estamos corriendo desbalanceados hacia atrás",
      "C. En el primer golpe del saque sin mirar",
      "D. Cuando el rival está parado esperando en la T"
    ],
    "correcta": 0,
    "explicacion": "Tirar una dejada con el oponente pegado a nuestra espalda garantiza que la distancia que debe recorrer sea máxima."
  },
  {
    "id": 209,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Trampa de Dejar Salir la Bola",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué a veces es mejor dejar rebotar la pelota en la pared trasera en lugar de volearla apresuradamente?",
    "opciones": [
      "A. Porque da más puntos en el marcador",
      "B. Porque la pared trasera desacelera la pelota y la sitúa en una posición más cómoda y predecible para atacar",
      "C. Para que el oponente se canse de esperar",
      "D. Porque está prohibido volear en el fondo"
    ],
    "correcta": 1,
    "explicacion": "Dejar que la pelota impacte el vidrio trasero permite reorganizar la postura y ejecutar un tiro ofensivo con calma."
  },
  {
    "id": 210,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Presión Asfixiante de Volea",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué efecto psicológico y físico genera en el rival ver que interceptamos todos sus tiros de volea en la T?",
    "opciones": [
      "A. Se relaja porque corre menos",
      "B. El rival gana confianza táctica",
      "C. Sensación de impotencia y pánico, ya que siente que la cancha se achica y no tiene tiempo de respirar",
      "D. El público pide cambio de árbitro"
    ],
    "correcta": 2,
    "explicacion": "El juego de volea agresiva (estilo Nick Matthew o Paul Coll) quita oxígeno mental y físico al competidor."
  },
  {
    "id": 211,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Recuperación Tras el Golpe",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el primer movimiento reflejo que debe realizar el jugador inmediatamente después de impactar la pelota?",
    "opciones": [
      "A. Quedarse quieto mirando si la pelota entra",
      "B. Ir a sentarse en la caja de saque",
      "C. Gritar al público",
      "D. Empujar con la pierna delantera y regresar con pasos dinámicos al centro neurálgico de la T"
    ],
    "correcta": 3,
    "explicacion": "El axioma supremo del squash es: 'Golpea y vuelve a la T sin demorar un solo instante'."
  },
  {
    "id": 212,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Trampa del Tin Alto",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Al enfrentar a un jugador que falla mucho en la chapa (tin), la estrategia más inteligente es:",
    "opciones": [
      "A. Mantener rallies pacientes y profundos con margen de seguridad sin arriesgar tiros rasantes innecesarios",
      "B. Tirar todo al tin para competir a ver quién falla más",
      "C. Acelerar a tontas y a locas",
      "D. Pedir cambio de pelota"
    ],
    "correcta": 0,
    "explicacion": "Frente a un rival impaciente o con mala selección de tiro, la consistencia y la altura son suficientes para ganar."
  },
  {
    "id": 213,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Juego de Esquinas (Four Corners)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué consiste la estrategia de las 'Cuatro Esquinas' (Four Corners Game)?",
    "opciones": [
      "A. Jugar con 4 pelotas simultáneas",
      "B. Distribuir el juego alternadamente entre los dos rincones delanteros y los dos traseros para abrir la cancha",
      "C. Parar el juego cada 4 puntos",
      "D. Jugar solo en el centro de la T"
    ],
    "correcta": 1,
    "explicacion": "Obliga al oponente a visitar los 4 extremos de la pista, acumulando ácido láctico en cuádriceps y glúteos."
  },
  {
    "id": 214,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Jugar al Cuerpo del Rival",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Es ético y legal tirar tácticamente una pelota profunda que obligue al rival a esquivarla o jugar incómodo?",
    "opciones": [
      "A. No, se descalifica al jugador de inmediato",
      "B. Solo se permite en torneos escolares",
      "C. Sí, tiros rectos pegados a la línea de su cuerpo son tácticas legítimas de longitud, siempre sin conducta peligrosa",
      "D. Resta medio punto en el marcador"
    ],
    "correcta": 2,
    "explicacion": "Hacer que la pelota viaje cerca del cuerpo del oponente dificulta su swing y lo obliga a retroceder incómodo."
  },
  {
    "id": 215,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Defensa con Lob en Altura",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Cuando un ataque del rival nos deja casi tocando el piso en la esquina delantera, el mejor tiro de escape es:",
    "opciones": [
      "A. Un remate violento directo a la pared lateral",
      "B. Tirarse al suelo pidiendo Let",
      "C. Un boast rasante al centro de la cancha",
      "D. Un Lob defensivo muy alto pegado a la pared lateral para ganar tiempo y neutralizar su ventaja en la T"
    ],
    "correcta": 3,
    "explicacion": "El globo alto desactiva la ofensiva del rival y le quita la T, devolviendo el rally a foja cero."
  },
  {
    "id": 216,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Contraataque con Crosscourt",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Si el oponente ejecuta una dejada predecible y llegamos con tiempo en la esquina delantera:",
    "opciones": [
      "A. Podemos amagar un contra-drop y cruzar un crosscourt rápido y bajo a la esquina contraria para liquidar",
      "B. Debemos devolver la pelota suave a sus manos",
      "C. Debemos pedir repetición de cortesía",
      "D. Tirar al techo"
    ],
    "correcta": 0,
    "explicacion": "Llegar temprano a una dejada otorga todas las opciones de definición angular a la esquina desprotegida."
  },
  {
    "id": 217,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Manejo del Game Ball (Punto de Game)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Al disputar un punto decisivo de Game Ball (10-9 o 10-10), la pauta táctica de élite es:",
    "opciones": [
      "A. Intentar un tiro de fantasía al nick desde el fondo con 5% de probabilidad",
      "B. Jugar con máxima concentración en tiros de alta probabilidad y longitud profunda, esperando el error ajeno",
      "C. Sacar con los ojos cerrados para no tener nervios",
      "D. Pedir al árbitro que termine el partido"
    ],
    "correcta": 1,
    "explicacion": "Los puntos clave se ganan con disciplina y consistencia táctica; el riesgo excesivo en momentos de tensión regala games."
  },
  {
    "id": 218,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Saque como Arma Táctica",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué objetivo táctico persigue un saque de globo alto ('Lob Serve') al rincón?",
    "opciones": [
      "A. Que la pelota salga volando de la cancha",
      "B. Que el árbitro se confunda",
      "C. Hacer que la pelota muera en el ángulo superior del vidrio trasero, forzando un revés incómodo y débil del receptor",
      "D. Hacer un ace directo de tenis"
    ],
    "correcta": 2,
    "explicacion": "El saque de globo alto y suave atrapa al receptor contra la pared de vidrio, impidiéndole un ataque frontal."
  },
  {
    "id": 219,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Saque Smash al Cuerpo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuándo es efectivo utilizar un saque violento y bajo cruzado al cuerpo del receptor?",
    "opciones": [
      "A. En todos los saques del partido de forma repetitiva",
      "B. Solo cuando se va perdiendo 0-10",
      "C. Está prohibido sacar fuerte",
      "D. Para sorprender a un receptor que se para muy relajado o adelantado esperando un saque suave"
    ],
    "correcta": 3,
    "explicacion": "La variación de saque rompe el ritmo mental del receptor; un saque rápido y al cuerpo fuerza devoluciones defectuosas."
  },
  {
    "id": 220,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Selección de Tiro (Shot Selection)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué define a un jugador con excelente 'Shot Selection' en squash?",
    "opciones": [
      "A. Saber qué tiro ejecutar en cada situación según su propio balance corporal y la posición del oponente",
      "B. Tener la raqueta más cara del club",
      "C. Pegarle siempre con la misma fuerza a todo",
      "D. Saber los nombres de los tiros en inglés"
    ],
    "correcta": 0,
    "explicacion": "La selección de tiro es la inteligencia táctica aplicada: no tirar una dejada cuando se está fuera de balance."
  },
  {
    "id": 221,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La T Dinámica (Dynamic T)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué significa el concepto moderno de la 'T Dinámica' frente a la T estática?",
    "opciones": [
      "A. Que la línea del piso se mueve con motores",
      "B. Que la posición de espera óptima se desplaza ligeramente hacia adelante o atrás según dónde esté la pelota",
      "C. Que el jugador baila sobre la T",
      "D. Que se juega sin pararse en el centro"
    ],
    "correcta": 1,
    "explicacion": "Si el rival está en el fondo, la T dinámica se adelanta un metro; si el rival está adelante, se retrasa un paso."
  },
  {
    "id": 222,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Cansar las Piernas del Oponente",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué hacer correr al rival hacia adelante y atrás desgasta más que hacerlo correr lateralmente?",
    "opciones": [
      "A. Porque hacia adelante no se puede respirar",
      "B. Porque la cancha es más angosta que larga",
      "C. Porque la estocada profunda (lunge) y la frenada excéntrica de cuádriceps consumen más glucógeno que el trote lateral",
      "D. Porque el calzado pesa más hacia adelante"
    ],
    "correcta": 2,
    "explicacion": "Las frenadas en estocada demandan contracciones musculares excéntricas intensas que agotan las piernas velozmente."
  },
  {
    "id": 223,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Autocontrol en Decisiones Arbitrales",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "Desde la psicología táctica, ¿cómo debe reaccionar un jugador ante un fallo arbitral desfavorable?",
    "opciones": [
      "A. Gritarle al árbitro durante 5 minutos y quebrar la raqueta",
      "B. Abandonar la cancha en señal de protesta",
      "C. Tirar la pelota a la tribuna",
      "D. Aceptar el fallo de inmediato, resetear la mente y concentrarse en el punto siguiente sin desgastarse en discusiones"
    ],
    "correcta": 3,
    "explicacion": "Perder la calma por una mala decisión arbitral desconecta al jugador de la táctica y entrega los siguientes 3 o 4 puntos."
  },
  {
    "id": 224,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Jugar contra un Rival Rápido",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la mejor estrategia frente a un rival sumamente atlético y veloz que llega a todo?",
    "opciones": [
      "A. Usar el 'Hold' y el engaño de muñeca para quitarle la anticipación y obligarlo a frenar y arrancar en seco",
      "B. Intentar correr más rápido que él en una carrera de velocidad pura",
      "C. Tirarle todas las pelotas al centro de la T",
      "D. Jugar sin calzado"
    ],
    "correcta": 0,
    "explicacion": "A un atleta veloz se le vence quitándole el tiempo de lectura con amagues y sosteniendo la pelota en el impacto."
  },
  {
    "id": 225,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Jugar contra un Rival Golpeador Fuerte",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo se neutraliza a un jugador que solo sabe golpear a máxima potencia ('Hard Hitter')?",
    "opciones": [
      "A. Golpeando todavía más fuerte que él para ver quién revienta la bola",
      "B. Ralentizando el ritmo con lobs altos y tiros suaves pegados a la pared que no le dejen espacio para swing amplio",
      "C. Quedándose parado en una esquina",
      "D. Pidiendo que le bajen la tensión a su raqueta"
    ],
    "correcta": 1,
    "explicacion": "El pegador potente necesita rebote y espacio; los tiros lentos y pegados a la pared lo asfixian biomecánicamente."
  },
  {
    "id": 226,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El 'Second Bounce' en el Vidrio",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un drive cuyo segundo bote toca el cristal trasero es tácticamente perfecto?",
    "opciones": [
      "A. Porque se rompe el vidrio y termina el partido",
      "B. Porque el árbitro otorga un punto de bonificación",
      "C. Porque la pelota rueda por la pared de vidrio a ras de suelo y se vuelve físicamente imposible meter la raqueta",
      "D. Porque da tiempo al público de aplaudir"
    ],
    "correcta": 2,
    "explicacion": "El segundo bote en la unión de la pared trasera y el suelo elimina el rebote hacia adelante, matando el tiro."
  },
  {
    "id": 227,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Trampa de Sobre-Atacar",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué error táctico cometen comúnmente los jugadores de nivel intermedio al ganar ventaja en el rally?",
    "opciones": [
      "A. Seguir jugando tiros profundos seguros",
      "B. Mantener el control de la T con paciencia",
      "C. Tomar agua entre puntos",
      "D. Apresurar una dejada riesgosa al tin cuando aún no tenían la pelota cómoda para definir"
    ],
    "correcta": 3,
    "explicacion": "La precipitación por cerrar el punto lleva a forzar remates en pelotas difíciles, regalando errores no forzados."
  },
  {
    "id": 228,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Cambio de Dirección a Contrapié",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué consiste el tiro a 'contrapié' (wrong-footing)?",
    "opciones": [
      "A. Tirar la pelota hacia el mismo rincón desde donde el oponente viene corriendo hacia la T, forzándolo a frenar e invertir la inercia",
      "B. Patear la pelota con el pie izquierdo",
      "C. Jugar con zapatillas cambiadas de pie",
      "D. Cometer una falta intencional"
    ],
    "correcta": 0,
    "explicacion": "Cambiar de dirección en contra de la inercia del cuerpo exige un sobreesfuerzo articular enorme y suele dejar al rival parado."
  },
  {
    "id": 229,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Importancia del Primer Game",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué en squash profesional es vital imponer condiciones tácticas en el primer game?",
    "opciones": [
      "A. Porque el que gana el primer game gana el partido automáticamente",
      "B. Para marcar el territorio físico en la T, detectar los patrones del rival y obligarlo a gastar reservas energéticas",
      "C. Porque en el primer game la pelota no rebota",
      "D. Porque el árbitro solo califica en el primer game"
    ],
    "correcta": 1,
    "explicacion": "El primer game establece la pauta de desgaste y el respeto psicológico en el dominio del centro de la cancha."
  },
  {
    "id": 230,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Uso de la Pared Frontal Alta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué porcentaje de la pared frontal suelen utilizar los jugadores inexpertos frente a los profesionales?",
    "opciones": [
      "A. Ambos usan exactamente los mismos 10 centímetros sobre el tin",
      "B. Los profesionales nunca usan la pared frontal",
      "C. Los inexpertos solo usan el tercio inferior cerca del tin; los profesionales usan los 4.57 metros completos de altura",
      "D. Los inexpertos usan solo el techo"
    ],
    "correcta": 2,
    "explicacion": "El dominio tridimensional del espacio frontal (usar la altura para lobs y defensas) distingue al maestro del aficionado."
  },
  {
    "id": 231,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Boast de Presión vs Boast Defensivo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es la diferencia táctica entre un Boast de ataque y uno de recuperación?",
    "opciones": [
      "A. El de ataque se tira con dos manos",
      "B. El defensivo va contra el techo",
      "C. No existe diferencia táctica",
      "D. El de ataque se juega adelantado para ganar el punto en la esquina; el defensivo se tira forzado desde el fondo para sobrevivir"
    ],
    "correcta": 3,
    "explicacion": "Un boast forzado desde atrás deja la pelota fácil en la frontal; un boast ofensivo (trickle) busca el nick directo."
  },
  {
    "id": 232,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Control Emocional en Ventaja",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Al ir ganando 10-6 con 4 puntos de partido a favor, la consigna táctica es:",
    "opciones": [
      "A. Mantener la misma intensidad y disciplina sin relajarse, cerrando el game con solvencia",
      "B. Regalar los siguientes 3 puntos para dar espectáculo",
      "C. Intentar tiros imposibles al tin",
      "D. Festejar antes de que termine el punto"
    ],
    "correcta": 0,
    "explicacion": "La relajación prematura con ventaja en squash permite remontadas memorables si el rival toma ritmo y confianza."
  },
  {
    "id": 233,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Rally de Paciencia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "En el squash de élite moderno, ¿cuántos tiros de preparación suele requerir un rally antes de poder atacar?",
    "opciones": [
      "A. Solo 1 tiro directo desde el saque",
      "B. Entre 15 y 30 tiros de longitud paciente antes de que surja una pelota débil para definir",
      "C. Más de 500 tiros en cada punto obligatorio",
      "D. Ninguno; todos los tiros son remates"
    ],
    "correcta": 1,
    "explicacion": "La élite (Farag, Coll, ElShorbagy) construye los puntos con paciencia de cirujano hasta abrir el hueco definitivo."
  },
  {
    "id": 234,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Táctica en Canchas de Cristal Calurosas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si la cancha está muy calurosa y la pelota vuela y rebota en exceso, la táctica exige:",
    "opciones": [
      "A. Pegarle más duro para que la bola rebote todavía más",
      "B. Jugar solo con lobs al techo",
      "C. Priorizar tiros cortados al nick y dejadas milimétricas, ya que los rallies de fondo se vuelven casi interminables",
      "D. Esperar a que se haga de noche"
    ],
    "correcta": 2,
    "explicacion": "En canchas rápidas y calientes la defensa se facilita; solo los tiros de precisión terminal (nicks y drops) quiebran el rally."
  },
  {
    "id": 235,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Táctica en Canchas Frías",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Por el contrario, en una cancha muy fría donde la pelota apenas rebota:",
    "opciones": [
      "A. Jugar solo globos altos al fondo",
      "B. Esperar pacientemente sin tirar nunca adelante",
      "C. No calentar la pelota",
      "D. Atacar constantemente con drops y tiros bajos al tin, ya que cualquier pelota corta es casi imposible de levantar"
    ],
    "correcta": 3,
    "explicacion": "En pistas frías, la pelota 'muere' en la parte delantera; las dejadas son armas mortíferas que no dan rebote."
  },
  {
    "id": 236,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Distracción por Fatiga",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuál es el primer síntoma táctico de que un jugador está entrando en fatiga extrema?",
    "opciones": [
      "A. Comienza a jugar dejadas precipitadas y tiros de fantasía desde posiciones imposibles para evitar rallies largos",
      "B. Empieza a correr el doble de rápido",
      "C. Volea con mayor precisión que antes",
      "D. Se ríe constantemente con el público"
    ],
    "correcta": 0,
    "explicacion": "El cansancio nubla la mente: el jugador exhausto busca atajos para terminar el punto rápido y acumula errores en el tin."
  },
  {
    "id": 237,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Lenguaje Corporal en Cancha",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los entrenadores prohíben agachar la cabeza o apoyarse en las rodillas entre puntos?",
    "opciones": [
      "A. Porque el árbitro cobra falta de postura",
      "B. Porque transmite debilidad y fatiga al oponente, dándole un impulso psicológico de confianza para apretar el ritmo",
      "C. Porque se mancha la camiseta",
      "D. Porque está prohibido por la WSF"
    ],
    "correcta": 1,
    "explicacion": "Caminar erguido con la cabeza alta entre rallies oculta el agotamiento y mantiene la presión psicológica sobre el rival."
  },
  {
    "id": 238,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Estrategia del 'Crosscourt Lift'",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Para qué se utiliza el 'Crosscourt Lift' (elevación cruzada suave)?",
    "opciones": [
      "A. Para romper la raqueta del rival",
      "B. Para hacer tiempo de calentamiento",
      "C. Para cruzar la pelota con parábola media que supera la raqueta del rival en la T y cae mansa en el rincón opuesto",
      "D. Para sacar la bola de la cancha"
    ],
    "correcta": 2,
    "explicacion": "Es un tiro de respiro táctico que transfiere la presión hacia el lado desprotegido sin el riesgo de un crosscourt plano."
  },
  {
    "id": 239,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Bloqueo Posicional Legal",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo se posiciona un jugador de forma legal en la T para dificultar el paso del rival?",
    "opciones": [
      "A. Agarrando la camiseta del rival con la mano",
      "B. Poniendo el pie para que el rival tropiece",
      "C. Empujando con el codo en la espalda",
      "D. Ocupando firmemente el centro con una postura ancha y estable sin realizar movimientos intencionales de obstrucción"
    ],
    "correcta": 3,
    "explicacion": "Estar sólidamente plantado en la T es un derecho reglamentario; el rival debe rodear nuestra posición legal sin que lo empujemos."
  },
  {
    "id": 240,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Análisis entre Games con el Coach",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué deben enfocarse los 90 segundos de charla con el entrenador entre games?",
    "opciones": [
      "A. En 2 o 3 ajustes tácticos claros y concretos (ej: 'más altura en el revés', 'no te precipites en la dejada') y recuperar aire",
      "B. En quejarse del calor y del público",
      "C. En discutir cada fallo del árbitro",
      "D. En revisar redes sociales en el teléfono"
    ],
    "correcta": 0,
    "explicacion": "La mente fatigada solo procesa mensajes directos y concisos; la claridad estratégica entre games define partidos."
  },
  {
    "id": 241,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Paciencia en el Tie-Break",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Al llegar a 10-10 en el quinto y definitivo game:",
    "opciones": [
      "A. Se debe tirar un boast kamikaze en el primer golpe",
      "B. La serenidad emocional y la adhesión al plan táctico básico deciden el partido más que la genialidad aislada",
      "C. Se debe pedir revisión de video de todo",
      "D. Se debe cambiar de raqueta por cábala"
    ],
    "correcta": 1,
    "explicacion": "Los grandes campeones (como Jahangir o Nicol David) forjaron sus leyendas jugando el punto más simple y seguro en el momento cumbre."
  },
  {
    "id": 242,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Tiro 'Tandem' en Dobles",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "En la táctica de squash dobles, ¿cómo se distribuyen habitualmente los dos integrantes de la pareja?",
    "opciones": [
      "A. Uno juega dentro de la cancha y el otro espera afuera",
      "B. Uno corre solo adelante y el otro solo atrás sin moverse",
      "C. Uno cubre predominantemente la mitad izquierda y el otro la mitad derecha de la cancha (formación de lados)",
      "D. Juegan turnándose un game cada uno"
    ],
    "correcta": 2,
    "explicacion": "En dobles de squash la división clásica por carriles (Left-Wall y Right-Wall specialist) garantiza cobertura y evita colisiones."
  },
  {
    "id": 243,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Transición Defensa-Ataque",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál es la señal indiscutible de que hemos pasado de la fase defensiva a la fase de ataque en el rally?",
    "opciones": [
      "A. Cuando el público comienza a aplaudir",
      "B. Cuando el rival se seca el sudor",
      "C. Cuando la pelota cambia de color",
      "D. Cuando logramos meter un tiro profundo que fuerza un rebote flojo y corto del rival hacia el centro de la cancha"
    ],
    "correcta": 3,
    "explicacion": "La pelota corta del rival en el centro es la 'luz verde' táctica para avanzar con la raqueta armada y definir el punto."
  },
  {
    "id": 244,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Contrapié con el Boast",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué un boast sorpresivo ejecutado con postura de drive profundo engaña al rival?",
    "opciones": [
      "A. Porque el rival ya inició su carrera hacia atrás esperando el drive y debe clavar los frenos para correr hacia adelante",
      "B. Porque el boast está prohibido",
      "C. Porque la pelota se desinfla",
      "D. Porque el árbitro canta Let"
    ],
    "correcta": 0,
    "explicacion": "Romper la inercia del oponente hacia el fondo con un tiro corto a la pared lateral genera el clásico 'patinazo' sin retorno."
  },
  {
    "id": 245,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "Cuidar el Medio de la Cancha",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué peligro táctico tiene dejar caer la pelota en la zona media de la duela (mid-court)?",
    "opciones": [
      "A. No tiene ningún peligro",
      "B. Es la 'zona de la muerte': la pelota queda a la altura perfecta de la cadera para que el rival fusile un tiro ganador",
      "C. El árbitro cobra falta de zona",
      "D. La pelota no bota en esa parte"
    ],
    "correcta": 1,
    "explicacion": "Los tiros que no llegan al fondo ni mueren adelante quedan flotando en media cancha para ser ejecutados sin piedad."
  },
  {
    "id": 246,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Táctica de Desgaste Psicológico",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo quebraba Jahangir Khan la resistencia mental de sus oponentes en su era dorada?",
    "opciones": [
      "A. Hablando en voz alta durante el punto",
      "B. Tardando 10 minutos en sacar",
      "C. Con una implacable consistencia de 40 tiros por rally sin cometer jamás un error no forzado, forzando la rendición física",
      "D. Usando zapatillas ruidosas"
    ],
    "correcta": 2,
    "explicacion": "La invulnerabilidad táctica de no regalar un solo error demuele la moral de cualquier rival por fuerte que sea."
  },
  {
    "id": 247,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Volea-Drop a Contramano",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "Tirar un volley drop hacia la esquina desde donde el rival acaba de sacar:",
    "opciones": [
      "A. Es considerado falta de saque",
      "B. Da 2 puntos al receptor",
      "C. Está prohibido en torneos oficiales",
      "D. Aprovecha que el servidor aún está saliendo de la caja de saque y no ha terminado de plantar su posición en la T"
    ],
    "correcta": 3,
    "explicacion": "Castigar el servicio con un volley drop fulminante pone al servidor en jaque mate antes de que pise el centro."
  },
  {
    "id": 248,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "La Identidad de Juego Propia",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué los mejores entrenadores recomiendan imponer el propio estilo antes que solo adaptarse al rival?",
    "opciones": [
      "A. Porque jugar con nuestras mayores fortalezas (ej: velocidad, paciencia o ataque) nos mantiene en control y con confianza",
      "B. Porque el rival no sabe jugar",
      "C. Porque está escrito en las reglas de etiqueta",
      "D. Para terminar los partidos en 5 minutos"
    ],
    "correcta": 0,
    "explicacion": "Obligar al rival a jugar en nuestro terreno y a nuestro ritmo es el principio rector de la maestría estratégica en squash."
  },
  {
    "id": 249,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Punto Perdido sin Remordimiento",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué actitud mental caracteriza a un jugador tácticamente maduro tras perder un rally de 80 golpes?",
    "opciones": [
      "A. Enojarse con la raqueta y golpear las paredes",
      "B. Reconocer el mérito del tiro rival, respirar hondo, secar el grip y afrontar el siguiente punto con la misma intensidad",
      "C. Tirarse al piso a lamentarse durante el saque del rival",
      "D. Insultar al juez de línea"
    ],
    "correcta": 1,
    "explicacion": "En squash los rallies largos son batallas; la madurez táctica entiende que el marcador se construye punto a punto con resiliencia."
  },
  {
    "id": 250,
    "area": "Estrategia, Táctica y Control de la T",
    "subtema": "El Squash como Ajedrez Físico",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué al squash se le denomina universalmente 'El Ajedrez a 200 km/h'?",
    "opciones": [
      "A. Porque se juega sobre un tablero cuadriculado",
      "B. Porque las raquetas tienen piezas de ajedrez talladas",
      "C. Porque combina estrategia pura, anticipación de movimientos futuros y trampas posicionales con una exigencia cardíaca extrema",
      "D. Porque lo inventaron los ajedrecistas rusos"
    ],
    "correcta": 2,
    "explicacion": "La metáfora del ajedrez físico sintetiza la esencia del deporte: pensar con claridad matemática bajo 180 pulsaciones por minuto."
  },
  {
    "id": 251,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Peso de Raqueta Moderna",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el peso estándar de una raqueta moderna de squash sin encordar?",
    "opciones": [
      "A. Entre 300 y 350 gramos (como tenis)",
      "B. 50 gramos como en bádminton",
      "C. Más de medio kilo",
      "D. Entre 110 y 140 gramos"
    ],
    "correcta": 3,
    "explicacion": "Las raquetas de grafito y carbono pesan entre 110 g y 140 g, combinando ligereza extrema con rigidez torsional."
  },
  {
    "id": 252,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Marco Teardrop vs Tradicional",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué diferencia principal presenta un marco con forma de 'Lágrima' (Teardrop) frente a uno con puente cerrado clásico?",
    "opciones": [
      "A. El marco lágrima tiene cuerdas verticales más largas, lo que amplía el punto dulce y genera mayor potencia",
      "B. El marco lágrima es exclusivo para zurdos",
      "C. El marco clásico es de madera maciza únicamente",
      "D. El marco lágrima pesa el triple"
    ],
    "correcta": 0,
    "explicacion": "Las cuerdas centrales más largas en el formato teardrop ofrecen mayor efecto trampolín y potencia en los drives."
  },
  {
    "id": 253,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Balance Head-Heavy vs Head-Light",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué ventaja otorga una raqueta con balance 'Head-Light' (ligera en la cabeza)?",
    "opciones": [
      "A. Mayor peso para clavar clavos en la pared",
      "B. Mayor maniobrabilidad y velocidad para armar la volea y reaccionar en intercambios rápidos en la T",
      "C. Disminuye la tensión de las cuerdas sola",
      "D. No requiere encordado"
    ],
    "correcta": 1,
    "explicacion": "Tener el centro de masa hacia la empuñadura permite mover la cabeza de la raqueta con reflejos felinos en la red."
  },
  {
    "id": 254,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Tensión del Encordado",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el rango típico de tensión de encordado recomendado en raquetas de squash?",
    "opciones": [
      "A. Entre 50 y 65 libras como en el tenis",
      "B. 10 libras como una red de pescar",
      "C. Entre 24 y 30 libras (11 a 13.5 kg)",
      "D. Más de 100 libras"
    ],
    "correcta": 2,
    "explicacion": "El encordado de squash opera a tensiones moderadas de 24 a 30 lbs para optimizar el contacto con la pelota de goma."
  },
  {
    "id": 255,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Efecto de la Tensión: Potencia vs Control",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "Físicamente, ¿qué ocurre si se encuerda una raqueta a menor tensión (ej: 24 lbs frente a 29 lbs)?",
    "opciones": [
      "A. A menor tensión la pelota sale más lenta",
      "B. A menor tensión las cuerdas se vuelven de acero",
      "C. No hay ninguna diferencia física",
      "D. A menor tensión las cuerdas deflectan más, generando mayor efecto catapulta y potencia, pero menor control direccional"
    ],
    "correcta": 3,
    "explicacion": "Menor tensión = mayor deflexión elástica y potencia; mayor tensión = menor tiempo de contacto y máxima precisión milimétrica."
  },
  {
    "id": 256,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Materiales Compuestos Modernos",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué material de ingeniería es el componente estructural predominante en raquetas de gama alta?",
    "opciones": [
      "A. Fibra de carbono de alto módulo, grafito y adiciones de grafeno o titanio",
      "B. Madera de fresno laminada como en 1970",
      "C. Aluminio fundido pesado",
      "D. Hierro forjado macizo"
    ],
    "correcta": 0,
    "explicacion": "Los compuestos de matriz polimérica reforzados con fibra de carbono ofrecen la mejor relación rigidez/peso del mundo."
  },
  {
    "id": 257,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Calibre de Cuerdas de Squash",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué grosor o calibre (gauge) tienen típicamente las cuerdas de alta competición en squash?",
    "opciones": [
      "A. 2.50 mm como cables de acero",
      "B. Entre 1.10 mm y 1.25 mm (calibres 17 y 18)",
      "C. 0.50 mm como hilo de coser",
      "D. 5.00 milímetros"
    ],
    "correcta": 1,
    "explicacion": "Las cuerdas de squash son muy finas (1.15-1.20 mm) con microfilamentos multifilamento que muerden la superficie del caucho."
  },
  {
    "id": 258,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Suela Non-Marking Obligatoria",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué los clubes y el reglamento exigen calzado con suela estrictamente 'Non-Marking' (no marcante)?",
    "opciones": [
      "A. Para que los jugadores no hagan ruido",
      "B. Por razones de moda deportiva",
      "C. Para no dejar rayas negras indelebles de caucho de carbono que arruinen la duela de madera natural",
      "D. Para no resbalar en el césped"
    ],
    "correcta": 2,
    "explicacion": "Las gomas tradicionales de calle dejan marcas negras imposibles de remover; la suela no marcante cuida la superficie de juego."
  },
  {
    "id": 259,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Overgrip de Squash",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué función cumple colocar un 'Overgrip' absorbente sobre el mango de la raqueta?",
    "opciones": [
      "A. Hacer la raqueta 50 cm más larga",
      "B. Aumentar el peso en 100 gramos",
      "C. Cambiar el color de la raqueta por estética",
      "D. Absorber el sudor copioso de la mano, evitar que la raqueta rote en el impacto y brindar tracción acolchada"
    ],
    "correcta": 3,
    "explicacion": "Con la intensa sudoración en squash, un overgrip de poliuretano perforado con alta adherencia es indispensable para la seguridad."
  },
  {
    "id": 260,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Gafas de Policarbonato Homologadas",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué estándar de seguridad balística deben cumplir las gafas protectoras para squash juvenil?",
    "opciones": [
      "A. Normas internacionales de impacto balístico (como ASTM F803 o BS 7930-1) con lentes de policarbonato irrompibles",
      "B. Basta con gafas comunes de sol con cristales de vidrio",
      "C. Gafas de natación con elástico",
      "D. Lentes de lectura de aumento"
    ],
    "correcta": 0,
    "explicacion": "El policarbonato balístico resiste el impacto directo de una pelota de squash a más de 200 km/h sin astillarse jamás."
  },
  {
    "id": 261,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Longitud Máxima de Raqueta",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la longitud total máxima permitida por la WSF para una raqueta de squash?",
    "opciones": [
      "A. 1 metro completo",
      "B. 686 milímetros (68.6 cm / 27 pulgadas)",
      "C. 50 centímetros",
      "D. 80 centímetros"
    ],
    "correcta": 1,
    "explicacion": "El reglamento de equipamiento fija la longitud máxima total de la raqueta en 686 mm."
  },
  {
    "id": 262,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Área Máxima de la Cabeza",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es el área máxima de encordado de la cabeza de la raqueta permitida por reglamento?",
    "opciones": [
      "A. 1.000 centímetros cuadrados",
      "B. 250 centímetros cuadrados",
      "C. 500 centímetros cuadrados (77.5 pulgadas cuadradas)",
      "D. 700 centímetros cuadrados"
    ],
    "correcta": 2,
    "explicacion": "El límite superior del tamaño de la cabeza es de 500 cm²; la mayoría de raquetas pro se sitúan entre 470 y 500 cm²."
  },
  {
    "id": 263,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Ancho Máximo del Marco",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el ancho máximo permitido para la cabeza de la raqueta de squash?",
    "opciones": [
      "A. 400 milímetros",
      "B. 100 milímetros",
      "C. 300 milímetros",
      "D. 215 milímetros (21.5 cm)"
    ],
    "correcta": 3,
    "explicacion": "El marco no puede exceder los 215 mm de ancho para respetar la maniobrabilidad cerca de las paredes."
  },
  {
    "id": 264,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Patrón de Encordado",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué patrones de encordado (cuerdas verticales x horizontales) son los más comunes en squash?",
    "opciones": [
      "A. 14x18 y 16x17",
      "B. 5x5",
      "C. 50x50",
      "D. 10x10"
    ],
    "correcta": 0,
    "explicacion": "Los patrones de 14 verticales por 18 horizontales ofrecen el equilibrio ideal entre agarre de la bola y durabilidad."
  },
  {
    "id": 265,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Amortiguador de Vibraciones (Dampener)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué función cumple el pequeño amortiguador de silicona que algunos jugadores colocan en las cuerdas?",
    "opciones": [
      "A. Duplica la potencia de saque",
      "B. Elimina el sonido metálico agudo de las cuerdas ('ping') y atenúa microvibraciones de alta frecuencia",
      "C. Hace que la pelota doble en el aire",
      "D. Es un chip GPS de seguimiento"
    ],
    "correcta": 1,
    "explicacion": "El antivibrador cambia la sensación acústica del impacto haciéndola más sorda y confortable al oído del jugador."
  },
  {
    "id": 266,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Estabilidad Lateral en Zapatillas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el calzado de squash cuenta con refuerzos de TPU en el lateral exterior del antepié?",
    "opciones": [
      "A. Para patear la pelota con el empeine",
      "B. Para que no entre agua a la zapatilla",
      "C. Para evitar que el pie desborde la suela y se produzcan esguinces de tobillo durante las frenadas bruscas en estocada",
      "D. Por diseño decorativo"
    ],
    "correcta": 2,
    "explicacion": "Los cortes laterales y cambios de dirección exigen un soporte rígido en el borde exterior de la zapatilla."
  },
  {
    "id": 267,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Drop de la Zapatilla de Squash",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué tipo de 'Drop' (diferencia de altura talón-puntera) suele tener la zapatilla de squash?",
    "opciones": [
      "A. Un tacón alto de 50 mm",
      "B. Drop de cero milímetros con suela de madera",
      "C. Plataforma de 8 centímetros",
      "D. Un drop bajo a medio (entre 6 y 10 mm) para mantener el centro de gravedad cerca de la duela y favorecer la agilidad"
    ],
    "correcta": 3,
    "explicacion": "Estar cerca del piso brinda mayor propiocepción articular y menor riesgo de torceduras en los desplazamientos."
  },
  {
    "id": 268,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Cuerda Multifilamento de Poliamida",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué las cuerdas de multifilamento (como Tecnifibre 305 verde) son legendarias en el squash?",
    "opciones": [
      "A. Porque sus miles de microfilamentos impregnados de poliuretano ofrecen una elasticidad y toque de bola inigualables",
      "B. Porque nunca se rompen en 20 años",
      "C. Porque están hechas de hilo de cobre",
      "D. Porque brillan en la oscuridad"
    ],
    "correcta": 0,
    "explicacion": "La Tecnifibre 305 es el estándar de oro en el circuito por su absorción de vibraciones y sensibilidad en los drops."
  },
  {
    "id": 269,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Desgaste del Protector de Cabeza (Bumper)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Para qué sirve la tira plástica protectora ('Bumper Guard') en la parte superior del marco?",
    "opciones": [
      "A. Para que la raqueta rebote contra el piso",
      "B. Para proteger las cuerdas y la fibra de carbono del roce constante contra las paredes de yeso y cristal",
      "C. Para colocar el peso de plomo",
      "D. Para limpiar la suela del zapato"
    ],
    "correcta": 1,
    "explicacion": "Al raspar las paredes laterales en los drives paralelos, el bumper absorbe la abrasión salvando el marco estructural."
  },
  {
    "id": 270,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Cordaje Monofilamento vs Multifilamento",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué diferencia práctica tiene una cuerda de monofilamento de poliéster frente al multifilamento?",
    "opciones": [
      "A. El monofilamento es de algodón suave",
      "B. El multifilamento no se puede tensar",
      "C. El monofilamento es más rígido y duradero pero transmite más vibraciones; el multifilamento da más toque y confort",
      "D. No hay ninguna diferencia mecánica"
    ],
    "correcta": 2,
    "explicacion": "Los jugadores propensos al codo de tenista deben evitar monofilamentos rígidos y elegir multifilamentos elásticos."
  },
  {
    "id": 271,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Canutillo o Grommets",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué son los 'Grommets' (canutillos) en el marco de la raqueta?",
    "opciones": [
      "A. Los tornillos que sujetan el mango",
      "B. El pegamento de las fibras",
      "C. El tapón del extremo de la empuñadura",
      "D. Tubos plásticos individuales por donde pasan las cuerdas para evitar que el borde afilado del carbono corte el nylon"
    ],
    "correcta": 3,
    "explicacion": "Protegen las cuerdas del contacto abrasivo directo con los orificios taladrados en la fibra de carbono."
  },
  {
    "id": 272,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Raquetas de Madera Históricas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Hasta qué década del siglo XX las raquetas de squash fueron exclusivamente de madera?",
    "opciones": [
      "A. Hasta finales de los años 70 y principios de los 80, cuando el grafito y aluminio las reemplazaron por completo",
      "B. Hasta 1920 únicamente",
      "C. Hasta el año 2010",
      "D. Las raquetas de squash nunca fueron de madera"
    ],
    "correcta": 0,
    "explicacion": "Leyendas como Geoff Hunt y Jonah Barrington ganaron títulos mundiales con raquetas clásicas de madera de cabeza pequeña."
  },
  {
    "id": 273,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Tamaño de Cabeza Clásica de Madera",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué tamaño de cabeza tenían las raquetas de madera tradicionales de squash?",
    "opciones": [
      "A. 800 cm²",
      "B. Aproximadamente 340 a 370 cm² (mucho más pequeñas que los 500 cm² modernos)",
      "C. Exactamente 500 cm²",
      "D. 150 cm²"
    ],
    "correcta": 1,
    "explicacion": "Las raquetas de madera tenían cabezas diminutas y pesaban más de 200 gramos, exigiendo una precisión técnica quirúrgica."
  },
  {
    "id": 274,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "La Toalla de Muñeca (Muñequera)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué los jugadores de squash utilizan muñequeras de algodón en el brazo de golpeo?",
    "opciones": [
      "A. Para tapar tatuajes prohibidos",
      "B. Para que la muñeca no se doble",
      "C. Para evitar que el sudor del antebrazo escurra hacia la palma y vuelva resbaladizo el grip de la raqueta",
      "D. Por indicación médica de la WSF"
    ],
    "correcta": 2,
    "explicacion": "La muñequera actúa como dique de contención del sudor, manteniendo seca la empuñadura durante el rally."
  },
  {
    "id": 275,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Gafas de Rejilla Metálica Prohibidas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué las gafas protectoras con rejilla metálica (sin lentes de policarbonato) están prohibidas en torneos oficiales?",
    "opciones": [
      "A. Porque oxidan con el sudor",
      "B. Porque tapan la luz de la cancha",
      "C. Porque son muy baratas",
      "D. Porque la pelota de squash al aplastarse puede deformarse y penetrar a través de la malla hiriendo el ojo"
    ],
    "correcta": 3,
    "explicacion": "Bajo impacto violento, el caucho butílico se deforma como líquido y puede atravesar rejillas abiertas; solo se aprueba policarbonato sólido."
  },
  {
    "id": 276,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Rotura de Cuerda en Pleno Punto",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Si a un jugador se le corta una cuerda en mitad de un rally activo:",
    "opciones": [
      "A. Puede seguir jugando el punto con la cuerda rota hasta que finalice el rally",
      "B. El árbitro debe cantar Let de inmediato",
      "C. El punto se anula automáticamente",
      "D. Pierde el punto al instante"
    ],
    "correcta": 0,
    "explicacion": "El jugador puede continuar el punto e intentar ganar con la raqueta encordada rota si logra controlar el tiro."
  },
  {
    "id": 277,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Tiras de Plomo para Personalización",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Para qué colocan algunos jugadores avanzados cintas de plomo adhesivas en la cabeza de la raqueta?",
    "opciones": [
      "A. Para que la raqueta pese 2 kilos",
      "B. Para añadir masa en el aro superior y modificar el balance hacia Head-Heavy, ganando inercia y potencia de remate",
      "C. Para evitar la radiación de los focos",
      "D. Para equilibrar raquetas torcidas"
    ],
    "correcta": 1,
    "explicacion": "Añadir 2 o 3 gramos de plomo en la punta eleva el swingweight sin alterar la rigidez del marco."
  },
  {
    "id": 278,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Cálculo de Libras a Kilogramos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "Una tensión de encordado de 26 libras en squash equivale en el sistema métrico internacional a:",
    "opciones": [
      "A. 26 kilogramos exactos",
      "B. 5 kilogramos",
      "C. Aproximadamente 11.8 kilogramos de fuerza (1 lb ≈ 0.453 kg)",
      "D. 50 kilogramos"
    ],
    "correcta": 2,
    "explicacion": "26 lbs × 0.4536 kg/lb ≈ 11.8 kg, la tensión estándar por excelencia del circuito PSA."
  },
  {
    "id": 279,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Grosor del Mango (Grip Size)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "A diferencia del tenis (que tiene tallas de mango L1 a L5), las raquetas de squash:",
    "opciones": [
      "A. Tienen 10 tallas diferentes de fábrica",
      "B. No tienen mango; se agarran del marco",
      "C. Tienen empuñaduras intercambiables con tornillos",
      "D. Tienen un tamaño de empuñadura casi universal estándar que cada jugador ajusta añadiendo overgrips"
    ],
    "correcta": 3,
    "explicacion": "En squash la empuñadura viene estandarizada de fábrica; el grosor se adapta sumando capas de overgrip al gusto del atleta."
  },
  {
    "id": 280,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Calzado con Gel o Air en Talón",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué tecnología de amortiguación incorporan las zapatillas de squash de marcas líderes (Asics, Salming, Eye)?",
    "opciones": [
      "A. Cápsulas de gel viscoelástico o espumas EVA de alta densidad para absorber el impacto de las desaceleraciones",
      "B. Cámaras con agua con gas",
      "C. Resortes de acero en el talón",
      "D. Plantillas de madera maciza"
    ],
    "correcta": 0,
    "explicacion": "La amortiguación del talón protege el tendón de Aquiles y la fascia plantar del castigo del piso duro."
  },
  {
    "id": 281,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Flexibilidad Longitudinal del Marco",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo influye la rigidez longitudinal (índice RA) de una raqueta de squash?",
    "opciones": [
      "A. Un marco flexible no puede golpear la bola",
      "B. Un marco más flexible absorbe más vibraciones y ayuda al confort; un marco rígido transfiere más energía pura a la bola",
      "C. La rigidez no altera el golpe",
      "D. Un marco rígido se dobla como goma"
    ],
    "correcta": 1,
    "explicacion": "Los jugadores con técnica depurada prefieren marcos rígidos (>RA 70) para máxima transferencia de velocidad."
  },
  {
    "id": 282,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "La Cuerda Híbrida",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué consiste encordar una raqueta con un patrón híbrido?",
    "opciones": [
      "A. Encordar la mitad con alambre y la mitad con hilo",
      "B. Jugar con dos cuerdas sueltas",
      "C. Colocar un tipo de cuerda en las verticales (ej: monofilamento resistente) y otro en las horizontales (ej: multifilamento de toque)",
      "D. Usar cuerdas de dos colores solo por estética"
    ],
    "correcta": 2,
    "explicacion": "El encordado híbrido combina la durabilidad de las cuerdas verticales con la suavidad y elasticidad de las horizontales."
  },
  {
    "id": 283,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "La Vida Útil del Encordado",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué las cuerdas de squash pierden tensión con las semanas aunque no se rompan?",
    "opciones": [
      "A. Porque el aire de la habitación se come el nylon",
      "B. Porque la raqueta encoge con el tiempo",
      "C. Las cuerdas nunca pierden tensión",
      "D. Por relajación mecánica y fluencia lenta del polímero bajo tensión estática constante"
    ],
    "correcta": 3,
    "explicacion": "El fenómeno de 'creep' o fluencia hace que el nylon estirado pierda paulatinamente elasticidad y libras de tensión."
  },
  {
    "id": 284,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Limpieza de la Suela en la Cancha",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los jugadores profesionales se pasan la mano sudada por la suela de sus zapatillas entre puntos?",
    "opciones": [
      "A. Para retirar el polvo fino de la duela y restaurar la adherencia húmeda de la goma contra la madera limpia",
      "B. Por cábala y superstición únicamente",
      "C. Para enfriarse la mano",
      "D. Para ensuciar el piso a propósito"
    ],
    "correcta": 0,
    "explicacion": "La humedad de la palma remueve el polvillo acumulado en las estrías de la suela, reactivando el agarre inmediato."
  },
  {
    "id": 285,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Calcetines Técnicos Dobles",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué muchos jugadores de squash usan calcetines dobles o con refuerzos en puntera y talón?",
    "opciones": [
      "A. Para que el zapato les quede 2 números más grande",
      "B. Para evitar la fricción pie-plantilla y prevenir la formación de ampollas dolorosas por las frenadas bruscas",
      "C. Para abrigarse en canchas calurosas",
      "D. Por reglamento de vestimenta de la PSA"
    ],
    "correcta": 1,
    "explicacion": "Las frenadas en seco generan cizallamiento en la piel de la planta del pie; el doble calcetín absorbe el roce mecánico."
  },
  {
    "id": 286,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Tapón del Mango (Butt Cap)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué función cumple el reborde pronunciado en el extremo inferior del mango ('Butt Cap')?",
    "opciones": [
      "A. Para destapar botellas de agua",
      "B. Para guardar monedas dentro del mango",
      "C. Evita que la raqueta se deslice de la mano en impactos potentes y sirve de tope propioceptivo para el meñique",
      "D. Es donde se conecta el cargador"
    ],
    "correcta": 2,
    "explicacion": "El tope acampanado del butt cap brinda seguridad y referencia espacial táctil al empuñar la raqueta sin mirar."
  },
  {
    "id": 287,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Marco Cóncavo Interno",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué beneficio aerodinámico y estructural aportan los marcos con perfil interior cóncavo?",
    "opciones": [
      "A. Hacen que la raqueta sea invisible",
      "B. No tienen ningún beneficio",
      "C. Hacen que la pelota no rebote",
      "D. Permiten que las cuerdas sean más largas dentro del mismo perímetro de cabeza, agrandando el punto dulce"
    ],
    "correcta": 3,
    "explicacion": "El perfil cóncavo maximiza el largo libre de las cuerdas sin violar el límite exterior de 500 cm²."
  },
  {
    "id": 288,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Tubo de Pelotas Nuevas",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué presentación sellada se comercializan habitualmente las pelotas de squash oficiales?",
    "opciones": [
      "A. En cajas o tubos sellados de 3 pelotas de caucho homologadas por la WSF",
      "B. En bolsas de plástico de 100 unidades abiertas",
      "C. Sueltas en cajas de cartón con hielo",
      "D. En latas presurizadas a 3 atmósferas como el tenis"
    ],
    "correcta": 0,
    "explicacion": "A diferencia del tenis, la pelota de squash no requiere latas presurizadas porque no contiene gas a sobrepresión de fábrica."
  },
  {
    "id": 289,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Grip Tipo Toalla (Towelling Grip)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Para qué jugadores es ideal la empuñadura de toalla de algodón ('Towelling Grip')?",
    "opciones": [
      "A. Para jugar bajo la lluvia",
      "B. Para jugadores con hiperhidrosis o sudoración extrema en las palmas, ya que absorbe líquido como una esponja",
      "C. Para partidos de exhibición en la playa",
      "D. Para no lastimarse los nudillos"
    ],
    "correcta": 1,
    "explicacion": "El grip de toalla de rizo de algodón tradicional brinda un agarre insuperable a quienes empapan los grips de poliuretano."
  },
  {
    "id": 290,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Durabilidad de la Raqueta de Carbono",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué causa principal provoca la rotura de un marco moderno de fibra de carbono?",
    "opciones": [
      "A. El calor del sol en el coche",
      "B. El sudor de las manos",
      "C. Microfisuras por impactos violentos directos contra las paredes duras de yeso o suelo durante estocadas",
      "D. Golpear pelotas de punto azul"
    ],
    "correcta": 2,
    "explicacion": "Los golpes contra esquinas y paredes fatigan la matriz epóxica hasta que el laminado de carbono colapsa."
  },
  {
    "id": 291,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Cordaje de Calibre 18 (1.10 mm)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué ventaja y qué desventaja tiene utilizar una cuerda ultradelgada de calibre 18 (1.10 mm)?",
    "opciones": [
      "A. Es indestructible pero no da control",
      "B. Es más barata que el hilo de pescar",
      "C. Pesa 50 gramos más",
      "D. Ofrece el máximo agarre, efecto y toque de bola del mercado, pero tiene menor durabilidad y se corta más rápido"
    ],
    "correcta": 3,
    "explicacion": "El calibre ultrafino corta el aire y penetra mejor en el caucho de la bola, a expensas de una vida útil reducida."
  },
  {
    "id": 292,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Férula o Muñequera Ortopédica",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Permite el reglamento de la WSF competir utilizando soportes o muñequeras elásticas?",
    "opciones": [
      "A. Sí, siempre que no tengan partes metálicas rígidas que puedan lastimar al oponente en un choque",
      "B. No, cualquier vendaje está prohibido",
      "C. Solo si el rival usa la misma férula",
      "D. Solo en partidos amistosos"
    ],
    "correcta": 0,
    "explicacion": "Las protecciones elásticas blandas están permitidas; elementos punzantes o férulas rígidas descubiertas son ilegales."
  },
  {
    "id": 293,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Encordado a 4 Nudos",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué los encordadores profesionales prefieren encordar a 4 nudos en lugar de 2 nudos?",
    "opciones": [
      "A. Porque se usan 4 cuerdas distintas",
      "B. Permite calibrar tensiones diferenciadas en verticales y horizontales y reduce la pérdida de tensión en el remate",
      "C. Porque es más rápido de hacer",
      "D. Por estética visual"
    ],
    "correcta": 1,
    "explicacion": "El método de 4 nudos separa las cuerdas verticales de las horizontales, optimizando la uniformidad de la tensión."
  },
  {
    "id": 294,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Indumentaria Oficial en Torneos",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué exigencias de vestimenta rigen en torneos oficiales WSF y PSA?",
    "opciones": [
      "A. Vestimenta blanca obligatoria estricta como en Wimbledon",
      "B. Traje formal de etiqueta",
      "C. Ropa deportiva homologada (camiseta técnica y pantalón corto) donde no predominen colores que camuflen la pelota",
      "D. Cualquier ropa de calle"
    ],
    "correcta": 2,
    "explicacion": "Se exige ropa deportiva técnica; en eventos de show se cuida que el color de la camiseta no impida ver la pelota."
  },
  {
    "id": 295,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Inspección de Raquetas por el Árbitro",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Puede el árbitro descalificar una raqueta antes del partido?",
    "opciones": [
      "A. No, el árbitro no tiene autoridad sobre el equipo",
      "B. Solo si es de una marca no patrocinadora",
      "C. Solo si no es de color negro",
      "D. Sí, si supera las dimensiones máximas permitidas, tiene bordes cortantes peligrosos o cuerdas sueltas"
    ],
    "correcta": 3,
    "explicacion": "El árbitro vela por la seguridad; un marco quebrado con astillas de carbono expuestas es retirado de la cancha."
  },
  {
    "id": 296,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Punto de Balance en Milímetros",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿A cuántos milímetros desde la base del mango se ubica el punto de balance en una raqueta equilibrada (Even)?",
    "opciones": [
      "A. Aproximadamente entre 350 mm y 360 mm",
      "B. A 100 mm de la base",
      "C. A 600 mm de la base",
      "D. A 200 mm"
    ],
    "correcta": 0,
    "explicacion": "Con un largo total de 686 mm, el centro geométrico de equilibrio neutro ronda los 350-360 mm."
  },
  {
    "id": 297,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Calzado con Suela en Espiga",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Es recomendable usar zapatillas de tenis de tierra batida (suela espiga profunda) en squash?",
    "opciones": [
      "A. Sí, es el calzado oficial de squash",
      "B. No, la suela de espiga profunda de arcilla tiene poca superficie de contacto en madera lisa y resbala peligrosamente",
      "C. Da igual qué calzado se use",
      "D. La espiga salta más alto"
    ],
    "correcta": 1,
    "explicacion": "El squash requiere suelas con micro-dibujo de panal o estrías planas para maximizar el área de contacto con la duela."
  },
  {
    "id": 298,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "El Protector Ocular de Clip Óptico",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo compiten en squash los jugadores que necesitan lentes graduados de visión?",
    "opciones": [
      "A. Con sus lentes de vidrio comunes de la calle",
      "B. Jugando sin ver la pelota",
      "C. Con gafas de protección de policarbonato con clip óptico interno graduado o lentes de contacto bajo las gafas",
      "D. No se les permite jugar squash"
    ],
    "correcta": 2,
    "explicacion": "Gafas de policarbonato certificadas con inserto óptico graduado permiten corregir la miopía con seguridad balística."
  },
  {
    "id": 299,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "Término de Garantía en Raquetas",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué las marcas de raquetas no cubren roturas causadas por golpes contra las paredes?",
    "opciones": [
      "A. Porque no existe garantía en ningún deporte",
      "B. Porque las raquetas son desechables",
      "C. Por ley internacional de impuestos",
      "D. Porque la fibra de carbono está diseñada para impactos de pelota, no para choques contra muros de yeso rígido"
    ],
    "correcta": 3,
    "explicacion": "Golpear la pared a 150 km/h somete al marco a cargas de cizallamiento destructivas ajenas al juego normal."
  },
  {
    "id": 300,
    "area": "Equipamiento: Raquetas, Cuerdas, Grip y Calzado",
    "subtema": "La Elección de la Raqueta Ideal",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué consejo biomecánico básico guía la elección de raqueta para un jugador aficionado?",
    "opciones": [
      "A. Elegir un peso medio (125-135 g) con balance neutro o ligeramente head-light para proteger el brazo y ganar control",
      "B. Comprar la raqueta más pesada posible para hacer pesas",
      "C. Comprar la raqueta que use el campeón mundial sin importar el nivel",
      "D. Elegir solo por el color de la pintura"
    ],
    "correcta": 0,
    "explicacion": "Una raqueta equilibrada de peso intermedio perdona errores técnicos, no sobrecarga el codo y facilita el desarrollo."
  },
  {
    "id": 301,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Jahangir Khan: Racha de 555 Partidos",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué récord legendario ostenta el pakistaní Jahangir Khan en la historia del deporte mundial?",
    "opciones": [
      "A. 100 partidos invicto",
      "B. 555 partidos oficiales consecutivos invicto entre 1981 y 1986 (récord Guinness absoluto)",
      "C. Ganar un partido en 3 minutos",
      "D. Jugar con dos raquetas simultáneas"
    ],
    "correcta": 1,
    "explicacion": "Jahangir Khan estuvo más de 5 años y 8 meses sin perder un solo encuentro oficial de squash (555 victorias consecutivas)."
  },
  {
    "id": 302,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Títulos de British Open de Jahangir",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos títulos consecutivos del prestigioso British Open ganó Jahangir Khan?",
    "opciones": [
      "A. 5 títulos",
      "B. 15 títulos",
      "C. 10 títulos consecutivos (de 1982 a 1991)",
      "D. 3 títulos"
    ],
    "correcta": 2,
    "explicacion": "Jahangir dominó el torneo más tradicional del squash ganando 10 coronas consecutivas en el British Open."
  },
  {
    "id": 303,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Jansher Khan: Récord de Títulos Mundiales",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos Campeonatos Mundiales (World Open) masculinos ganó el pakistaní Jansher Khan?",
    "opciones": [
      "A. 4 títulos",
      "B. 12 títulos",
      "C. 6 títulos",
      "D. 8 títulos mundiales individuales (récord histórico masculino)"
    ],
    "correcta": 3,
    "explicacion": "Jansher Khan ostenta el récord de 8 títulos de Campeón Mundial en categoría masculina individual."
  },
  {
    "id": 304,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Nicol David: Reinado de 9 Años",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué hito histórico consiguió la malasia Nicol David en el circuito femenino mundial?",
    "opciones": [
      "A. Fue número 1 del ranking mundial durante 108 meses consecutivos (¡9 años seguidos de 2006 a 2015!)",
      "B. Ganó 50 partidos en un mes",
      "C. Fue campeona a los 8 años",
      "D. Nunca perdió un set en su carrera"
    ],
    "correcta": 0,
    "explicacion": "Nicol David es considerada la más grande de todos los tiempos por su hegemonía ininterrumpida de 9 años en la cima."
  },
  {
    "id": 305,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Títulos Mundiales de Nicol David",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos Campeonatos Mundiales individuales conquistó Nicol David en su gloriosa carrera?",
    "opciones": [
      "A. 3 títulos",
      "B. 8 títulos de Campeona del Mundo (récord femenino absoluto)",
      "C. 15 títulos",
      "D. 5 títulos"
    ],
    "correcta": 1,
    "explicacion": "Nicol David ganó 8 coronas mundiales (2005, 2006, 2008, 2009, 2010, 2011, 2012 y 2014)."
  },
  {
    "id": 306,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Ramy Ashour: 'The Artist'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué el egipcio Ramy Ashour es apodado 'The Artist' en el mundo del squash?",
    "opciones": [
      "A. Porque pintaba cuadros antes de los partidos",
      "B. Porque tocaba el violín en la cancha",
      "C. Por su creatividad mágica sin precedentes, reflejos felinos y capacidad de tirar al nick desde cualquier rincón",
      "D. Por diseñar su propia ropa"
    ],
    "correcta": 2,
    "explicacion": "Ramy Ashour asombró al mundo con un repertorio visual y técnico genial que revolucionó la velocidad del deporte."
  },
  {
    "id": 307,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Títulos Mundiales de Ramy Ashour",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos títulos de Campeón Mundial PSA conquistó Ramy Ashour?",
    "opciones": [
      "A. 1 título",
      "B. 7 títulos",
      "C. 5 títulos",
      "D. 3 títulos mundiales (2008, 2012 y 2014)"
    ],
    "correcta": 3,
    "explicacion": "Pese a graves lesiones en el tendón de la corva, Ramy conquistó 3 coronas mundiales en batallas épicas."
  },
  {
    "id": 308,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Amr Shabana: 'El Maestro'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos Campeonatos Mundiales ganó el legendario zurdo egipcio Amr Shabana?",
    "opciones": [
      "A. 4 títulos mundiales individuales (2003, 2005, 2007 y 2009)",
      "B. 2 títulos",
      "C. 6 títulos",
      "D. 1 título"
    ],
    "correcta": 0,
    "explicacion": "Amr Shabana, apodado 'El Maestro', lideró la era dorada del squash egipcio con una técnica de muñeca exquisita."
  },
  {
    "id": 309,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Ali Farag: Número 1 e Ingeniero",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué prestigiosa universidad se graduó de ingeniero mecánico el actual número 1 mundial Ali Farag?",
    "opciones": [
      "A. En la Universidad de Oxford",
      "B. En la Universidad de Harvard (EE.UU.)",
      "C. En el MIT de Massachusetts",
      "D. En Cambridge"
    ],
    "correcta": 1,
    "explicacion": "Ali Farag compitió en el circuito universitario estadounidense para Harvard antes de coronarse número 1 mundial y multicampeón PSA."
  },
  {
    "id": 310,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Paul Coll: 'Superman' Neozelandés",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué hito histórico consiguió el neozelandés Paul Coll para su país en 2022?",
    "opciones": [
      "A. El primer jugador en jugar con raqueta de madera en el siglo XXI",
      "B. El más joven en debutar en PSA",
      "C. Fue el primer jugador masculino de Nueva Zelanda en alcanzar el puesto #1 del ranking mundial PSA",
      "D. Ganar el mundial sin sudar"
    ],
    "correcta": 2,
    "explicacion": "Con una condición atlética monumental que le valió el apodo de 'Superman', Paul Coll alcanzó la cima del ranking mundial."
  },
  {
    "id": 311,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Nour El Sherbini: Campeona Precoz",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué récord de precocidad histórica batió la egipcia Nour El Sherbini en 2009?",
    "opciones": [
      "A. Ganó el British Open a los 10 años",
      "B. Fue árbitro oficial a los 12 años",
      "C. Derrotó a Nicol David en 5 minutos",
      "D. Fue la campeona mundial junior más joven de la historia con solo 13 años"
    ],
    "correcta": 3,
    "explicacion": "Nour El Sherbini deslumbró al planeta ganando el Campeonato Mundial Sub-19 a la asombrosa edad de 13 años."
  },
  {
    "id": 312,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Títulos Mundiales de Nour El Sherbini",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos Campeonatos Mundiales PSA absolutos ha acumulado Nour El Sherbini hasta la fecha?",
    "opciones": [
      "A. 7 títulos mundiales, acechando el récord histórico de Nicol David",
      "B. 2 títulos",
      "C. 10 títulos",
      "D. 4 títulos"
    ],
    "correcta": 0,
    "explicacion": "El Sherbini se ha consolidado como una de las más grandes dominadoras de la historia con 7 coronas ecuménicas."
  },
  {
    "id": 313,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "La Dinastía Khan de Pakistán",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Quién fue el patriarca pionero de la dinastía Khan que ganó 7 British Open en los años 50?",
    "opciones": [
      "A. Jahangir Khan",
      "B. Hashim Khan, quien ganó su primer British Open a los 37 años de edad",
      "C. Imran Khan",
      "D. Azam Khan"
    ],
    "correcta": 1,
    "explicacion": "Hashim Khan inició la hegemonía pakistaní en el squash mundial ganando 7 títulos británicos tras emigrar de Peshawar."
  },
  {
    "id": 314,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Geoff Hunt: La Leyenda Australiana",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuántos Campeonatos Mundiales y British Open conquistó el gran australiano Geoff Hunt?",
    "opciones": [
      "A. 1 Mundial y 2 British Open",
      "B. 10 Mundiales",
      "C. 4 Campeonatos Mundiales y 8 títulos del British Open en los años 70",
      "D. Ninguno; fue solo finalista"
    ],
    "correcta": 2,
    "explicacion": "Geoff Hunt protagonizó legendarias batallas épicas contra Jonah Barrington y fue el gran rival del joven Jahangir."
  },
  {
    "id": 315,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Jonah Barrington: El Padre del Squash Moderno",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el irlandés-británico Jonah Barrington es considerado el padre del profesionalismo en squash?",
    "opciones": [
      "A. Por inventar la pelota de punto amarillo",
      "B. Por construir la primera cancha de cristal",
      "C. Por ser el primer árbitro con silbato",
      "D. Por introducir el entrenamiento físico científico exhaustivo y profesionalizar el circuito internacional en los años 60 y 70"
    ],
    "correcta": 3,
    "explicacion": "Barrington ganó 6 British Open demostrando que la condición física sobrehumana y la tenacidad podían vencer al talento innato."
  },
  {
    "id": 316,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Peter Nicol: El Zurdo de Hierro",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué hecho curioso caracterizó la carrera del número 1 mundial Peter Nicol?",
    "opciones": [
      "A. Compitió y fue campeón mundial representando primero a Escocia y posteriormente a Inglaterra",
      "B. Jugaba con la mano derecha y la izquierda indistintamente",
      "C. Nunca utilizó zapatillas en cancha",
      "D. Ganó todos sus partidos por 3-0"
    ],
    "correcta": 0,
    "explicacion": "Peter Nicol, uno de los atletas más resistentes de la historia, cambió de bandera en 2001 generando gran debate deportivo."
  },
  {
    "id": 317,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Nick Matthew: 'The Wolf'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuántos títulos mundiales y del British Open ganó el inglés Nick Matthew ('El Lobo')?",
    "opciones": [
      "A. 1 Mundial",
      "B. 3 Campeonatos Mundiales y 3 títulos del British Open",
      "C. 6 Mundiales",
      "D. 8 British Open"
    ],
    "correcta": 1,
    "explicacion": "Nick Matthew destacó por su ferocidad física en la T, disciplina espartana y una volea implacable de desgaste."
  },
  {
    "id": 318,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "James Willstrop: 'The Marksman'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué cualidad técnica distinguió al inglés James Willstrop en el circuito mundial?",
    "opciones": [
      "A. Era el jugador más bajo del circuito",
      "B. Solo sabía correr sin técnica",
      "C. Una precisión milimétrica sublime en el control de muñeca y una altura de 1.95 m que dominaba la T",
      "D. Jugaba con raqueta de bádminton"
    ],
    "correcta": 2,
    "explicacion": "Apodado 'The Marksman' (el tirador de precisión), Willstrop maravilló por su toque de engaño y pulcritud táctica."
  },
  {
    "id": 319,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Mohamed ElShorbagy: 'The Beast'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el egipcio (nacionalizado inglés) Mohamed ElShorbagy es conocido como 'The Beast'?",
    "opciones": [
      "A. Por morder las pelotas en el descanso",
      "B. Por usar una máscara en los partidos",
      "C. Por pelear con los jueces",
      "D. Por su poderío físico arrollador, ritmo frenético de alta intensidad y mentalidad guerrera implacable"
    ],
    "correcta": 3,
    "explicacion": "ElShorbagy dominó el ranking PSA durante años gracias a un juego frontal demoledor de potencia y velocidad."
  },
  {
    "id": 320,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Karim Darwish: Número 1 Egipcio",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué año alcanzó el egipcio Karim Darwish el puesto número 1 del ranking mundial PSA?",
    "opciones": [
      "A. En 2009, consolidando el dominio absoluto de Egipto en la cima mundial",
      "B. En 1990",
      "C. En 2020",
      "D. En 1980"
    ],
    "correcta": 0,
    "explicacion": "Karim Darwish fue uno de los pioneros que allanó el camino para la hegemonía de la escuela egipcia moderna."
  },
  {
    "id": 321,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Grégory Gaultier: 'The French General'",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué récord de longevidad deportiva impuso el francés Grégory Gaultier en 2017?",
    "opciones": [
      "A. El más joven en ganar con 12 años",
      "B. Fue el número 1 mundial de mayor edad en la historia moderna del squash masculino (a los 34 años y 3 meses)",
      "C. El único francés en jugar squash",
      "D. Ganar un partido con 40 grados de fiebre"
    ],
    "correcta": 1,
    "explicacion": "Gaultier, célebre por su ritmo vertiginoso y estocadas elásticas, se coronó como el número 1 más veterano de la era PSA."
  },
  {
    "id": 322,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "La Batalla de los 555 Partidos: Quién lo Venció",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué jugador logró la hazaña histórica de cortar el invicto de 555 partidos de Jahangir Khan en 1986?",
    "opciones": [
      "A. Geoff Hunt",
      "B. Jansher Khan",
      "C. El neozelandés Ross Norman en la final del Campeonato Mundial de Toulouse (Francia)",
      "D. Jonah Barrington"
    ],
    "correcta": 2,
    "explicacion": "Ross Norman, tras perder decenas de veces con Jahangir, sentenció: 'Un día Jahangir será batido, y ese día seré yo'."
  },
  {
    "id": 323,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Qamar Zaman: El Mago Pakistaní",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué título histórico ganó el pakistaní Qamar Zaman en 1975?",
    "opciones": [
      "A. El Abierto de Australia de tenis",
      "B. El torneo de maestros de golf",
      "C. La Copa Davis",
      "D. El British Open, derrotando en la final al gran Geoff Hunt con un estilo de toques mágicos"
    ],
    "correcta": 3,
    "explicacion": "Qamar Zaman fue el maestro del toque suave y el engaño visual, contrapunto lírico de la potencia de Geoff Hunt."
  },
  {
    "id": 324,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Sarah Fitz-Gerald: La Estrella Australiana",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuántos Campeonatos Mundiales individuales conquistó la australiana Sarah Fitz-Gerald en los 90 y 2000?",
    "opciones": [
      "A. 5 títulos mundiales individuales femeninos",
      "B. 1 título",
      "C. 10 títulos",
      "D. 3 títulos"
    ],
    "correcta": 0,
    "explicacion": "Sarah Fitz-Gerald dominó el squash femenino con una velocidad y solidez técnica que precedió a la era de Nicol David."
  },
  {
    "id": 325,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Cassie Jackman: La Campeona Inglesa",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué logró la inglesa Cassie Jackman en el circuito mundial femenino?",
    "opciones": [
      "A. Fue árbitro en 10 mundiales",
      "B. Fue Campeona del Mundo en 1999 y número 1 del ranking mundial femenino",
      "C. Inventó la raqueta de lágrima",
      "D. Ganó 50 medallas olímpicas"
    ],
    "correcta": 1,
    "explicacion": "Cassie Jackman fue uno de los grandes referentes del squash británico en la era dorada de los años 90."
  },
  {
    "id": 326,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Fares Dessouky: El Rey del Revés Cortado",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué jugador egipcio contemporáneo es famoso por su mortífero 'Trickle Boast' y explosividad?",
    "opciones": [
      "A. Mohamed Salah",
      "B. Amr Diab",
      "C. Fares Dessouky",
      "D. Naguib Mahfouz"
    ],
    "correcta": 2,
    "explicacion": "Dessouky es uno de los jugadores más talentosos y temidos del circuito PSA por sus tiros impredecibles al nick."
  },
  {
    "id": 327,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Mostafa Asal: 'The Raging Bull'",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué apodo recibe el joven prodigio egipcio Mostafa Asal por su imponente físico y potencia?",
    "opciones": [
      "A. The Gazelle",
      "B. The Magician",
      "C. The Falcon",
      "D. 'The Raging Bull' (El Toro Salvaje)"
    ],
    "correcta": 3,
    "explicacion": "Mostafa Asal se convirtió en uno de los números 1 mundiales más jóvenes gracias a una potencia física devastadora."
  },
  {
    "id": 328,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Tarek Momen: Campeón Mundial de Resistencia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué año se coronó Campeón Mundial PSA el incansable egipcio Tarek Momen?",
    "opciones": [
      "A. En 2019 en Doha (Qatar)",
      "B. En 2005",
      "C. En 2010",
      "D. En 1999"
    ],
    "correcta": 0,
    "explicacion": "Tarek Momen, apodado 'El Matador', coronó su carrera con el título ecuménico en 2019 tras años en el Top 5 mundial."
  },
  {
    "id": 329,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Raneem El Weleily: La Maga de Alejandría",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué hito histórico consiguió la egipcia Raneem El Weleily en septiembre de 2015?",
    "opciones": [
      "A. Se retiró sin perder un game",
      "B. Desbancó a Nicol David tras 9 años ininterrumpidos para convertirse en la nueva #1 del mundo",
      "C. Fue campeona a los 11 años",
      "D. Jugó con la mano izquierda"
    ],
    "correcta": 1,
    "explicacion": "Raneem El Weleily fue la jugadora que puso fin a la histórica racha de 108 meses de Nicol David en la cima."
  },
  {
    "id": 330,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Camille Serme: El Orgullo de Francia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué títulos de la Serie Platinum conquistó la francesa Camille Serme en su brillante carrera?",
    "opciones": [
      "A. Solo torneos nacionales en París",
      "B. El Roland Garros de tenis",
      "C. El British Open, el US Open y el Tournament of Champions en Nueva York",
      "D. El Abierto de Wimbledon"
    ],
    "correcta": 2,
    "explicacion": "Camille Serme fue la primera jugadora francesa en ganar los majors más codiciados del planeta squash."
  },
  {
    "id": 331,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "El Partido Más Largo de la Historia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuánto duró el partido oficial de squash más largo registrado en el circuito profesional?",
    "opciones": [
      "A. 5 horas y media",
      "B. 1 hora exacta",
      "C. 8 horas con pausa para almorzar",
      "D. 2 horas y 46 minutos (disputado entre Leo Au y Shawn Delierre en 2015)"
    ],
    "correcta": 3,
    "explicacion": "Leo Au y Shawn Delierre batieron todos los récords de resistencia humana en un duelo de 166 minutos de puro desgaste."
  },
  {
    "id": 332,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "El Game Más Largo de la Historia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué marcador histórico de tie-break se registró en el game profesional más largo?",
    "opciones": [
      "A. 29-27 (en un game oficial disputado en 2014 en Canadá)",
      "B. 50-48",
      "C. 12-10",
      "D. 100-98"
    ],
    "correcta": 0,
    "explicacion": "El sistema PARS a diferencia de 2 permitió este maratón épico donde ningún jugador cedía dos puntos seguidos."
  },
  {
    "id": 333,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "David Palmer: El Gladiador Australiano",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cuántos Campeonatos Mundiales y British Open ganó el aguerrido australiano David Palmer?",
    "opciones": [
      "A. 10 Mundiales",
      "B. 2 Campeonatos Mundiales y 4 títulos del British Open",
      "C. Ninguno; solo torneos locales",
      "D. 1 British Open"
    ],
    "correcta": 1,
    "explicacion": "David Palmer fue uno de los competidores más duros y temidos de los años 2000 por su implacable ética de trabajo."
  },
  {
    "id": 334,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Thierry Lincou: El Primer Campeón Mundial No Anglosajón/Pakistaní",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué hito histórico logró el francés Thierry Lincou en 2004?",
    "opciones": [
      "A. El primer jugador en jugar con gafas de sol",
      "B. El más alto del mundo con 2.10 m",
      "C. Fue el primer jugador de la Europa continental en ganar el Campeonato Mundial y alcanzar el #1 PSA",
      "D. El primer árbitro profesional"
    ],
    "correcta": 2,
    "explicacion": "Lincou, nacido en la Isla Reunión, rompió el duopolio británico-pakistaní coronándose campeón del mundo en 2004."
  },
  {
    "id": 335,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Hisham Ashour: El Mago de los Trick Shots",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quién es el hermano mayor de Ramy Ashour conocido por inventar tiros de exhibición insólitos?",
    "opciones": [
      "A. Ali Farag",
      "B. Karim Darwish",
      "C. Amr Shabana",
      "D. Hisham Ashour"
    ],
    "correcta": 3,
    "explicacion": "Hisham Ashour deleitó a las gradas mundiales con golpes entre las piernas, amagues y tiros de espaldas únicos."
  },
  {
    "id": 336,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Nouran Gohar: 'The Terminator'",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué la campeona egipcia Nouran Gohar es apodada 'The Terminator'?",
    "opciones": [
      "A. Por su pegada violentísima y un ritmo de golpeo implacable a más de 180 km/h que demuele a sus rivales",
      "B. Porque usa lentes oscuros en la cancha",
      "C. Porque es un robot programado",
      "D. Por no hablar nunca en entrevistas"
    ],
    "correcta": 0,
    "explicacion": "Nouran Gohar posee uno de los drives más potentes y veloces de la historia del squash femenino mundial."
  },
  {
    "id": 337,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Amanda Sobhy: La Estrella Estadounidense",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué hito alcanzó Amanda Sobhy para el squash de los Estados Unidos?",
    "opciones": [
      "A. Ganó la medalla de oro en atletismo",
      "B. Alcanzó el puesto #3 del ranking mundial PSA, la posición más alta para una jugadora nacida en EE.UU.",
      "C. Fue entrenadora de Harvard a los 15 años",
      "D. Jugó en la NBA"
    ],
    "correcta": 1,
    "explicacion": "Amanda Sobhy ha sido el estandarte del vertiginoso ascenso del squash profesional en los Estados Unidos."
  },
  {
    "id": 338,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Lee Beachill: El Estratega Silencioso",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué posición del ranking mundial ocupó el inglés Lee Beachill en 2004?",
    "opciones": [
      "A. El puesto #50",
      "B. Nunca estuvo en el Top 10",
      "C. El puesto número 1 del ranking mundial PSA",
      "D. Puesto #100"
    ],
    "correcta": 2,
    "explicacion": "Beachill, un maestro de la economía de movimientos y colocación geométrica, fue el mejor del mundo en 2004."
  },
  {
    "id": 339,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "John White: El Golpeador de 172 mph",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué récord de velocidad de tiro ostentó el escocés-australiano John White en 2004?",
    "opciones": [
      "A. 100 mph",
      "B. 300 mph",
      "C. 80 mph",
      "D. 172 mph (276.8 km/h), el récord mundial antes de ser superado por Cameron Pilley"
    ],
    "correcta": 3,
    "explicacion": "John White deslumbró en el Canary Wharf de Londres con un tiro a 172 mph que hizo vibrar las paredes de cristal."
  },
  {
    "id": 340,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Rodney Martin: El Destructor de Récords",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué gran hazaña consiguió el australiano Rodney Martin en el Campeonato Mundial de 1991?",
    "opciones": [
      "A. Venció a Jahangir Khan en cuartos de final y a Jansher Khan en la final para coronarse campeón del mundo",
      "B. Jugó la final con la mano vendada",
      "C. Ganó el torneo sin perder un punto",
      "D. Fue campeón mundial con 14 años"
    ],
    "correcta": 0,
    "explicacion": "Martin logró lo que parecía imposible: derrotar a los dos gigantes Khan en el mismo torneo ecuménico."
  },
  {
    "id": 341,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Nicol David en los Juegos Mundiales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuántas medallas de oro consecutivas ganó Nicol David en los World Games (Juegos Mundiales)?",
    "opciones": [
      "A. 1 medalla de plata",
      "B. 3 medallas de oro consecutivas (Duisburgo 2005, Kaohsiung 2009 y Cali 2013)",
      "C. 10 medallas",
      "D. Ninguna"
    ],
    "correcta": 1,
    "explicacion": "Nicol David brilló en los Juegos Mundiales, incluyendo una actuación legendaria en la ciudad colombiana de Cali en 2013."
  },
  {
    "id": 342,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "El Récord de Títulos de Jahangir",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuántos títulos profesionales en total ganó Jahangir Khan en su carrera deportiva?",
    "opciones": [
      "A. Solo 5 títulos",
      "B. Exactamente 1.000 títulos",
      "C. Más de 60 títulos internacionales oficiales avalados",
      "D. 20 títulos"
    ],
    "correcta": 2,
    "explicacion": "Jahangir dominó la escena mundial acumulando más de seis decenas de los torneos más difíciles del planeta."
  },
  {
    "id": 343,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Jansher Khan en el British Open",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuántos títulos consecutivos del British Open ganó Jansher Khan entre 1992 y 1997?",
    "opciones": [
      "A. 1 título",
      "B. 12 títulos",
      "C. 3 títulos",
      "D. 6 títulos consecutivos"
    ],
    "correcta": 3,
    "explicacion": "Tras el retiro de Jahangir, Jansher tomó la posta con un récord imbatible de 6 coronas seguidas en el British Open."
  },
  {
    "id": 344,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Hania El Hammamy: La Guerrera de El Cairo",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué la campeona egipcia Hania El Hammamy destaca en el Top 3 mundial actual?",
    "opciones": [
      "A. Por su portentosa elasticidad física para recuperar pelotas imposibles y su intensidad competitiva",
      "B. Por jugar con dos raquetas",
      "C. Por ser la más alta de la PSA",
      "D. Por no correr en la cancha"
    ],
    "correcta": 0,
    "explicacion": "El Hammamy protagoniza con El Sherbini y Gohar una de las eras más electrizantes del squash femenino."
  },
  {
    "id": 345,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Saurav Ghosal: El Ídolo de la India",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué hito histórico consiguió Saurav Ghosal para la India en el squash profesional?",
    "opciones": [
      "A. Primer campeón mundial de críquet",
      "B. Primer jugador indio en ingresar al Top 10 del ranking mundial PSA y medallista de los Juegos de la Mancomunidad",
      "C. Inventó el calzado de squash",
      "D. Fue árbitro en 500 partidos"
    ],
    "correcta": 1,
    "explicacion": "Ghosal llevó el squash de la India a la élite mundial compitiendo en el máximo nivel durante más de 15 años."
  },
  {
    "id": 346,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Marwan ElShorbagy: 'The Jackal'",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Quién es el hermano menor de Mohamed ElShorbagy que también fue Top 3 del mundo?",
    "opciones": [
      "A. Ramy Ashour",
      "B. Karim Abdel Gawad",
      "C. Marwan ElShorbagy",
      "D. Tarek Momen"
    ],
    "correcta": 2,
    "explicacion": "Los hermanos ElShorbagy hicieron historia al disputar entre sí la final del Campeonato Mundial PSA 2017 en Manchester."
  },
  {
    "id": 347,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Karim Abdel Gawad: 'The Baby-Faced Assassin'",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué gran temporada coronó Karim Abdel Gawad en 2016-2017?",
    "opciones": [
      "A. Ganó 100 torneos seguidos",
      "B. Se retiró a los 20 años",
      "C. Jugó solo dobles",
      "D. Ganó el Campeonato Mundial en El Cairo y alcanzó el puesto #1 del ranking mundial"
    ],
    "correcta": 3,
    "explicacion": "Gawad maravilló con un juego de muñeca relajado y contragolpes fulminantes que lo llevaron a la cima planetaria."
  },
  {
    "id": 348,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "Borja Golán: La Leyenda Española",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál ha sido la posición más alta alcanzada por el español Borja Golán en el ranking PSA?",
    "opciones": [
      "A. Puesto #5 del ranking mundial PSA en 2014",
      "B. Puesto #1",
      "C. Puesto #80",
      "D. Puesto #50"
    ],
    "correcta": 0,
    "explicacion": "Borja Golán es el mayor referente del squash español de todos los tiempos, compitiendo durante dos décadas con los mejores del mundo."
  },
  {
    "id": 349,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "La Era de Dominio de Egipto",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Desde qué década Egipto comenzó su apabullante dominio de número 1 en hombres y mujeres?",
    "opciones": [
      "A. Desde 1850",
      "B. A partir de mediados de los años 2000 con Shabana, Ramy Ashour, ElShorbagy, Farag, El Sherbini y Gohar",
      "C. Apenas en 2024",
      "D. Egipto nunca ha sido potencia"
    ],
    "correcta": 1,
    "explicacion": "Egipto revolucionó el squash con academias de élite en El Cairo y Alejandría, copando los títulos mundiales."
  },
  {
    "id": 350,
    "area": "Leyendas, Campeones Mundiales y Récords Históricos",
    "subtema": "El Salón de la Fama del Squash",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Dónde tiene su sede el Salón de la Fama del Squash Mundial avalado por la WSF?",
    "opciones": [
      "A. No existe salón de la fama",
      "B. En una cancha abandonada en Londres",
      "C. Reconoce y exalta anualmente a las mayores leyendas de la historia en ceremonias mundiales",
      "D. Es exclusivo para jugadores ingleses"
    ],
    "correcta": 2,
    "explicacion": "El World Squash Hall of Fame inmortaliza a deportistas que transformaron el deporte como Jahangir, Jansher, Nicol y Hunt."
  },
  {
    "id": 351,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Miguel Ángel Rodríguez: 'The Cannonball'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué apodo recibe el bogotano Miguel Ángel Rodríguez en el circuito mundial PSA por su velocidad sobrehumana?",
    "opciones": [
      "A. The Tower",
      "B. The Sniper",
      "C. The Magician",
      "D. 'The Cannonball' (La Bala de Cañón)"
    ],
    "correcta": 3,
    "explicacion": "Miguel Ángel es idolatrado en el mundo entero como 'The Cannonball' por sus salvadas arrojándose en plancha ('diving retrieves')."
  },
  {
    "id": 352,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Hito del British Open 2018",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué hazaña sin precedentes logró Miguel Ángel Rodríguez en mayo de 2018 en Hull (Inglaterra)?",
    "opciones": [
      "A. Fue Campeón del British Open (el 'Wimbledon del Squash'), siendo el primer sudamericano de la historia en ganarlo",
      "B. Ganó el torneo sin jugar la final",
      "C. Fue subcampeón de dobles",
      "D. Fue nombrado árbitro del año"
    ],
    "correcta": 0,
    "explicacion": "Miguel Ángel venció al #1 del mundo Mohamed ElShorbagy en una final electrizante de 102 minutos, logrando el mayor triunfo del squash latinoamericano."
  },
  {
    "id": 353,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Ranking Histórico de Miguel Ángel",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál ha sido la mejor posición alcanzada por Miguel Ángel Rodríguez en el ranking mundial PSA?",
    "opciones": [
      "A. Puesto #1",
      "B. Puesto #4 del mundo en 2015",
      "C. Puesto #20",
      "D. Puesto #15"
    ],
    "correcta": 1,
    "explicacion": "El bogotano se consolidó como uno de los 4 mejores atletas del planeta en una era copada por gigantes egipcios e ingleses."
  },
  {
    "id": 354,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Diving Retrieves de Miguel Ángel",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué las salvadas tirándose al suelo en plancha ('diving') de Miguel Ángel se hicieron virales en el mundo?",
    "opciones": [
      "A. Porque rompe la duela del piso",
      "B. Porque busca que le cobren penal",
      "C. Porque se arroja horizontalmente como un arquero de fútbol, recupera pelotas imposibles y se levanta en milisegundos para seguir el punto",
      "D. Porque resbala con agua"
    ],
    "correcta": 2,
    "explicacion": "Su agilidad felina y elasticidad para tirarse de cabeza y levantarse de inmediato es una de las marcas registradas de la PSA."
  },
  {
    "id": 355,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Diego Elías: 'El Puma Inca'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué logro histórico alcanzó el peruano Diego Elías para Sudamérica en abril de 2023?",
    "opciones": [
      "A. El primer jugador en jugar con raqueta de oro",
      "B. Ganar 50 medallas panamericanas",
      "C. Jugar sin entrenador",
      "D. Fue el primer sudamericano de la historia en alcanzar el puesto #1 del ranking mundial PSA masculino"
    ],
    "correcta": 3,
    "explicacion": "Diego Elías, 'El Puma', inscribió su nombre en la inmortalidad deportiva al escalar a la cima del ranking mundial absoluto."
  },
  {
    "id": 356,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Diego Elías: Campeón del Mundo 2024",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué título supremo conquistó Diego Elías en mayo de 2024 en El Cairo (Egipto)?",
    "opciones": [
      "A. Campeón del Mundo PSA (PSA World Championship), primer sudamericano en lograrlo tras vencer a Mostafa Asal en la final",
      "B. Campeón de dobles mixtos",
      "C. Campeón juvenil U13",
      "D. Medalla de bronce panamericana"
    ],
    "correcta": 0,
    "explicacion": "En tierra de faraones, Diego Elías conquistó el Campeonato Mundial individual, confirmándose como una leyenda viviente del deporte sudamericano."
  },
  {
    "id": 357,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Juegos Panamericanos de Lima 2019",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cómo fue el desempeño del squash colombiano en los Juegos Panamericanos de Lima 2019?",
    "opciones": [
      "A. No participó ninguna delegación",
      "B. Cosechó múltiples medallas de oro y podios en individual, dobles y equipos con Miguel Ángel, Catalina Peláez y los hermanos Rodríguez",
      "C. Quedó en último lugar",
      "D. Solo compitió en exhibición"
    ],
    "correcta": 1,
    "explicacion": "Colombia ratificó su condición de potencia continental encabezando el medallero panamericano de squash en Lima."
  },
  {
    "id": 358,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Catalina Peláez: La Gran Campeona Colombiana",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué títulos continentales y logros PSA ostenta la bogotana Catalina Peláez?",
    "opciones": [
      "A. Fue campeona de patinaje",
      "B. Fue presidenta de la WSF",
      "C. Múltiple medallista de oro en Juegos Panamericanos, Centroamericanos y Suramericanos, y Top 60 mundial PSA",
      "D. Solo compitió a nivel universitario"
    ],
    "correcta": 2,
    "explicacion": "Catalina Peláez es una de las figuras más laureadas del squash femenino colombiano por su talento táctico y garra competitiva."
  },
  {
    "id": 359,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Laura Tovar: La Figura Femenina de Selección",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué papel protagónico ha cumplido la bogotana Laura Tovar en la Selección Colombia?",
    "opciones": [
      "A. Árbitro internacional exclusivamente",
      "B. Entrenadora de natación",
      "C. Jugadora de ráquetbol",
      "D. Líder de la selección femenina colombiana con múltiples oros sudamericanos, panamericanos y títulos en el tour PSA Challenger"
    ],
    "correcta": 3,
    "explicacion": "Laura Tovar ha brillado internacionalmente llevando los colores de Colombia a los podios más exigentes del continente."
  },
  {
    "id": 360,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Juegos Mundiales de Cali 2013",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué evento internacional histórico congregó a las mayores estrellas mundiales del squash en Colombia?",
    "opciones": [
      "A. Los Juegos Mundiales de Cali 2013 (World Games 2013) en las canchas del Club Cañasgordas",
      "B. El Mundial de Fútbol",
      "C. Los Juegos Olímpicos de Verano",
      "D. El Tour de Francia"
    ],
    "correcta": 0,
    "explicacion": "Cali 2013 fue una fiesta inolvidable donde los aficionados colombianos colmaron las tribunas para ver a Nicol David y los mejores del mundo."
  },
  {
    "id": 361,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Federación Colombiana de Squash",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuál es la entidad deportiva oficial encargada de regir y promover este deporte en Colombia?",
    "opciones": [
      "A. La Federación de Tenis",
      "B. La Federación Colombiana de Squash (FCS)",
      "C. Coldeportes Atletismo",
      "D. La Liga de Squash de Londres"
    ],
    "correcta": 1,
    "explicacion": "La Federación Colombiana de Squash coordina los escalafones nacionales, torneos válidos y selecciones patrias."
  },
  {
    "id": 362,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Ligas Tradicionales de Squash en Colombia",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué departamentos de Colombia han sido históricamente los mayores semilleros de squash?",
    "opciones": [
      "A. Amazonas y Guainía únicamente",
      "B. San Andrés y Providencia",
      "C. Bogotá D.C., Cundinamarca, Valle del Cauca, Antioquia, Santander y Cauca",
      "D. Vichada y Vaupés"
    ],
    "correcta": 2,
    "explicacion": "Bogotá, Valle, Antioquia, Santander y Cauca concentran los clubes, ligas y atletas de mayor trayectoria competitiva."
  },
  {
    "id": 363,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Popayán y el Cauca",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué club y universidad de Popayán se ha promovido activamente la práctica y ciencia del squash?",
    "opciones": [
      "A. En el estadio de fútbol municipal",
      "B. En la piscina olímpica",
      "C. No se practica squash en Popayán",
      "D. En el Club Campestre de Popayán y mediante la divulgación académica e investigativa en la Universidad del Cauca"
    ],
    "correcta": 3,
    "explicacion": "El profesor Manuel Alejandro Obando y deportistas caucanos han impulsado la biomecánica y torneos de squash en Popayán y Unicauca."
  },
  {
    "id": 364,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Ronald Palomino: La Joven Promesa Caleña",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué atleta caleño ha destacado recientemente en el circuito PSA y la selección Colombia masculina?",
    "opciones": [
      "A. Ronald Palomino",
      "B. Radamel Falcao",
      "C. Nairo Quintana",
      "D. Juan Pablo Montoya"
    ],
    "correcta": 0,
    "explicacion": "Ronald Palomino es una de las grandes realidades del squash nacional con títulos PSA Challenger y destacadas actuaciones continentales."
  },
  {
    "id": 365,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Juan Camilo Vargas: El Estandarte Bogotano",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué logros ha cosechado el colombiano Juan Camilo Vargas en el tour mundial PSA?",
    "opciones": [
      "A. Es jugador de golf profesional",
      "B. Ha ingresado sólidamente al Top 40-50 del ranking mundial con múltiples títulos internacionales y medallas panamericanas",
      "C. Solo compite en Bogotá",
      "D. Se retiró a los 18 años"
    ],
    "correcta": 1,
    "explicacion": "Juan Camilo Vargas es uno de los jugadores colombianos más consistentes en los cuadros principales de torneos mundiales."
  },
  {
    "id": 366,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Dobles Masculino Colombiano de Oro",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué dupla colombiana logró la histórica medalla de oro en dobles en los Panamericanos de Toronto 2015?",
    "opciones": [
      "A. James Rodríguez y Falcao",
      "B. Cabal y Farah",
      "C. Miguel Ángel Rodríguez y Andrés Herrera",
      "D. Mariana Pajón y Carlos Oquendo"
    ],
    "correcta": 2,
    "explicacion": "Rodríguez y Herrera batieron a potencias continentales para colgarse un oro histórico en dobles panamericanos."
  },
  {
    "id": 367,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Centro de Alto Rendimiento en Bogotá",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué escenario público de Bogotá se ubican las canchas oficiales de entrenamiento de la Selección Colombia?",
    "opciones": [
      "A. En el Parque Simón Bolívar en césped",
      "B. En el Aeropuerto El Dorado",
      "C. En la Plaza de Bolívar",
      "D. En el Centro de Alto Rendimiento (CAR) del IDRD / Ministerio del Deporte"
    ],
    "correcta": 3,
    "explicacion": "El CAR en Bogotá cuenta con canchas de vidrio y yeso donde concentra la élite del squash nacional."
  },
  {
    "id": 368,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Torneo Abierto de Colombia (PSA Colombia Open)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué torneo de la PSA se disputó durante años en Bogotá reuniendo a la élite mundial?",
    "opciones": [
      "A. El Abierto Colombiano de Squash (Colombia Open), jugado en sedes como el Club El Nogal",
      "B. El Torneo de Wimbledon",
      "C. La Copa Libertadores",
      "D. El US Open de tenis"
    ],
    "correcta": 0,
    "explicacion": "El Colombia Open fue una parada célebre del tour mundial donde brillaron estrellas de la talla de Peter Nicol y David Palmer."
  },
  {
    "id": 369,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Claudio Neira: Pionero del Squash Colombiano",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Quién fue uno de los pioneros e impulsores históricos de la enseñanza del squash en Bogotá en los años 70 y 80?",
    "opciones": [
      "A. Lucho Herrera",
      "B. Claudio Neira y entrenadores pioneros de clubes bogotanos que introdujeron la técnica reglamentaria",
      "C. Carlos Valderrama",
      "D. García Márquez"
    ],
    "correcta": 1,
    "explicacion": "La familia Neira y entrenadores fundacionales sembraron las bases técnicas que décadas después fructificarían en Miguel Ángel."
  },
  {
    "id": 370,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Juegos Suramericanos de Asunción 2022",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo le fue al equipo colombiano de squash en los Juegos Suramericanos de Asunción 2022?",
    "opciones": [
      "A. No ganó ninguna medalla",
      "B. Perdió todos los partidos",
      "C. Arrasó en el medallero coronándose campeón suramericano absoluto en casi todas las modalidades",
      "D. Solo participó en dobles mixtos"
    ],
    "correcta": 2,
    "explicacion": "Colombia ratificó su liderazgo en ODESUR dominando las pruebas individuales, dobles y por equipos."
  },
  {
    "id": 371,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Juegos Panamericanos de Santiago 2023",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué resultado obtuvo la delegación colombiana de squash en Santiago 2023?",
    "opciones": [
      "A. Cero medallas",
      "B. Fue descalificada",
      "C. Se retiró por frío",
      "D. Consiguió múltiples preseas incluyendo el oro en dobles masculinos y platas en individual y equipos"
    ],
    "correcta": 3,
    "explicacion": "En Santiago de Chile, el squash volvió a ser una de las disciplinas más productivas del medallero colombiano."
  },
  {
    "id": 372,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Club El Nogal de Bogotá",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué emblemático club bogotano ha albergado históricamente torneos profesionales y exhibiciones de squash?",
    "opciones": [
      "A. El Club El Nogal",
      "B. El Club Campestre de Golf de Medellín",
      "C. El Autódromo de Tocancipá",
      "D. El Coliseo El Campín"
    ],
    "correcta": 0,
    "explicacion": "El Nogal cuenta con instalaciones de squash de primer nivel que han sido epicentro de torneos PSA."
  },
  {
    "id": 373,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Club Guaymaral y San Andrés Golf Club",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué clubes de la sabana de Bogotá han sido sede tradicional de válidas nacionales de la FCS?",
    "opciones": [
      "A. Estadios de béisbol",
      "B. Club Guaymaral, San Andrés Golf Club y Club Los Lagartos",
      "C. Pistas de patinaje",
      "D. Centros comerciales"
    ],
    "correcta": 1,
    "explicacion": "Los clubes campestres de la capital han sido plazas tradicionales para los torneos del ranking nacional."
  },
  {
    "id": 374,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Antioquia",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué club e institución deportiva ha liderado la formación de squashistas en Medellín?",
    "opciones": [
      "A. El estadio Atanasio Girardot de fútbol",
      "B. La plaza de toros",
      "C. El Club Campestre de Medellín y la Liga Antioqueña de Squash",
      "D. El metro de Medellín"
    ],
    "correcta": 2,
    "explicacion": "La Liga Antioqueña ha formado medallistas nacionales y aportado atletas clave a la selección Colombia."
  },
  {
    "id": 375,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Santander (Bucaramanga)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ciudad santandereana cuenta con tradición competitiva de squash en clubes como el Ruitoque y Campestre?",
    "opciones": [
      "A. Barrancabermeja únicamente",
      "B. San Gil",
      "C. Málaga",
      "D. Bucaramanga y Floridablanca"
    ],
    "correcta": 3,
    "explicacion": "Bucaramanga ha sido cuna de talentosos juveniles que han nutrido las selecciones nacionales."
  },
  {
    "id": 376,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Squashistas Juniors de Colombia en el British Junior Open",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué histórico torneo juvenil en Inglaterra compiten anualmente las promesas colombianas?",
    "opciones": [
      "A. En el British Junior Open (BJO), considerado el campeonato mundial oficioso de categorías menores",
      "B. En la Little League de béisbol",
      "C. En la Copa Davis Junior",
      "D. En el torneo de Wimbledon U14"
    ],
    "correcta": 0,
    "explicacion": "El British Junior Open de Birmingham y Sheffield es la máxima cita donde los juveniles colombianos se miden con egipcios e ingleses."
  },
  {
    "id": 377,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Lucía Bautista: La Revelación Santandereana",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué joven jugadora santandereana ha brillado internacionalmente con medallas panamericanas juveniles?",
    "opciones": [
      "A. Caterine Ibargüen",
      "B. Lucía Bautista",
      "C. Ingrit Valencia",
      "D. Yuri Alvear"
    ],
    "correcta": 1,
    "explicacion": "Lucía Bautista es una de las grandes figuras de la nueva generación con títulos sudamericanos y podios continentales."
  },
  {
    "id": 378,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "María Paula Tovar: Dupla Femenina",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quién es la hermana de Laura Tovar con quien conforma una temible dupla de dobles en la selección?",
    "opciones": [
      "A. Catalina Peláez",
      "B. Mariana Pajón",
      "C. María Paula Tovar",
      "D. Sofía Gómez"
    ],
    "correcta": 2,
    "explicacion": "Las hermanas Tovar han ganado juntas oros y platas en dobles femeninos en múltiples torneos del ciclo olímpico."
  },
  {
    "id": 379,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Edgar Ramírez: Entrenador Nacional",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quién ha sido uno de los entrenadores de squash más laureados en la conducción de la Selección Colombia?",
    "opciones": [
      "A. Pékerman",
      "B. Bolillo Gómez",
      "C. Reinaldo Rueda",
      "D. Edgar Ramírez y el cuerpo técnico de la Federación Colombiana de Squash"
    ],
    "correcta": 3,
    "explicacion": "Los entrenadores nacionales han liderado la preparación táctica y física de la era más dorada del squash colombiano."
  },
  {
    "id": 380,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Duelo Rodríguez vs Elías",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se denomina en Sudamérica al gran clásico de squash entre el colombiano Miguel Ángel y el peruano Diego Elías?",
    "opciones": [
      "A. El Clásico del Squash Sudamericano, dos Top 5 mundiales cara a cara en finales épicas",
      "B. El Superclásico de fútbol",
      "C. La Batalla del Pacífico",
      "D. El Duelo de los Andes"
    ],
    "correcta": 0,
    "explicacion": "Miguel Ángel y Diego Elías han forjado una rivalidad y amistad ejemplar, llevando a Sudamérica a la cumbre mundial de la PSA."
  },
  {
    "id": 381,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Argentina",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quién ha sido uno de los mayores referentes del squash argentino en el circuito mundial PSA?",
    "opciones": [
      "A. Diego Maradona",
      "B. Leandro Romiglio y Robertino Pezzota",
      "C. Lionel Messi",
      "D. Manu Ginóbili"
    ],
    "correcta": 1,
    "explicacion": "Romiglio y Pezzota han sido campeones panamericanos y pilares del squash albiceleste en Sudamérica."
  },
  {
    "id": 382,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Brasil",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué jugador brasileño destacó en el circuito PSA alcanzando el Top 40 mundial en los años 2000?",
    "opciones": [
      "A. Pelé",
      "B. Neymar",
      "C. Rafael Alarçón",
      "D. Ayrton Senna"
    ],
    "correcta": 2,
    "explicacion": "Rafael Alarçón fue el gran dominador del squash brasileño durante más de una década con múltiples títulos PSA."
  },
  {
    "id": 383,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en México",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quiénes han sido las grandes figuras históricas del squash mexicano en el circuito PSA?",
    "opciones": [
      "A. Canelo Álvarez y Chávez",
      "B. Hugo Sánchez y Chicharito",
      "C. Checo Pérez",
      "D. Los hermanos Arturo y César Salazar, Eric Gálvez y Samantha Terán"
    ],
    "correcta": 3,
    "explicacion": "Samantha Terán fue Top 15 mundial y los gemelos Salazar han sido rivales directos de Colombia en el continente."
  },
  {
    "id": 384,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Samantha Terán: La Pionera Mexicana",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué logro histórico alcanzó la mexicana Samantha Terán en el squash femenino?",
    "opciones": [
      "A. Fue semifinalista del Campeonato Mundial PSA 2011 y múltiple campeona panamericana",
      "B. Ganó el mundial de boxeo",
      "C. Fue futbolista profesional",
      "D. Es árbitro de tenis"
    ],
    "correcta": 0,
    "explicacion": "Samantha Terán abrió las puertas del profesionalismo femenino en Latinoamérica con una carrera legendaria."
  },
  {
    "id": 385,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Circuito Sudamericano Juvenil",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué certamen reúne anualmente a los mejores jugadores menores de 19 años de Sudamérica?",
    "opciones": [
      "A. La Copa Libertadores Sub-20",
      "B. El Campeonato Sudamericano Juvenil de Squash",
      "C. El Sudamericano de Atletismo",
      "D. El Torneo de Viña del Mar"
    ],
    "correcta": 1,
    "explicacion": "Es el torneo semillero donde Colombia, Perú, Argentina, Ecuador y Brasil disputan la supremacía regional."
  },
  {
    "id": 386,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Torneo Nacional de Mayores en Colombia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Con qué frecuencia se disputa el Campeonato Nacional de Mayores de la FCS?",
    "opciones": [
      "A. Cada 10 años",
      "B. Una vez al mes",
      "C. Anualmente, coronando al campeón y campeona absoluta de la República de Colombia",
      "D. Nunca se disputa"
    ],
    "correcta": 2,
    "explicacion": "El Campeonato Nacional reúne a las mejores raquetas del país para definir los títulos de Primera Categoría."
  },
  {
    "id": 387,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Categorías en Torneos Colombianos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo se clasifican habitualmente los torneos abiertos en el escalafón de Colombia?",
    "opciones": [
      "A. Solo por peso corporal como en boxeo",
      "B. Por estatura en centímetros",
      "C. No hay categorías",
      "D. En Primera, Segunda, Tercera, Cuarta, Quinta, Juveniles y Categorías Senior (+35, +45, +55)"
    ],
    "correcta": 3,
    "explicacion": "La pirámide de categorías permite competir a deportistas desde iniciación y recreativos hasta la élite profesional."
  },
  {
    "id": 388,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en los Juegos Nacionales de Colombia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué importancia tienen los Juegos Deportivos Nacionales para el squash colombiano?",
    "opciones": [
      "A. Es la máxima cita multideportiva interligas del país, otorgando apoyo y becas a los atletas departamentales",
      "B. Es un torneo de aficionados sin medallas",
      "C. Se juega solo en playas",
      "D. No incluye el squash"
    ],
    "correcta": 0,
    "explicacion": "En los Juegos Nacionales las ligas departamentales compiten con ferocidad por el medallero oficial de Colombia."
  },
  {
    "id": 389,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Fútbolistas y Deportistas Famosos y el Squash",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué muchos futbolistas y tenistas colombianos practican squash como entrenamiento cruzado?",
    "opciones": [
      "A. Para aprender a patear la pelota de goma",
      "B. Por la formidable transferencia en reflejos visuales, agilidad de tobillos y resistencia anaeróbica en espacios reducidos",
      "C. Porque es más fácil que el fútbol",
      "D. Por prescripción médica obligatoria"
    ],
    "correcta": 1,
    "explicacion": "El squash es reconocido por preparadores físicos de élite como la mejor herramienta de velocidad de reacción y agilidad."
  },
  {
    "id": 390,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash Universitario en Colombia",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué torneo reúne a los equipos representativos de las universidades colombianas?",
    "opciones": [
      "A. La liga de campeones de la UEFA",
      "B. El torneo interbarrios de microfútbol",
      "C. Los Juegos Nacionales Universitarios organizados por ASCUN Deportes",
      "D. No existe competencia universitaria"
    ],
    "correcta": 2,
    "explicacion": "ASCUN organiza los torneos universitarios donde estudiantes de Unicauca, UniAndes, Javeriana y Univalle compiten en squash."
  },
  {
    "id": 391,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "La Formación del Árbitro en Colombia",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Quién capacita y certifica a los árbitros oficiales de squash en Colombia?",
    "opciones": [
      "A. La policía de tránsito",
      "B. Los clubes de tenis",
      "C. No hay jueces en Colombia",
      "D. El Colegio Nacional de Árbitros de la FCS con homologación de la Federación Panamericana y WSF"
    ],
    "correcta": 3,
    "explicacion": "Los árbitros colombianos aprueban rigurosos exámenes teóricos y de video de la WSF para actuar en el circuito continental."
  },
  {
    "id": 392,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Club Campestre de Cali",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué importancia ha tenido Cali y sus clubes en el squash del Valle del Cauca?",
    "opciones": [
      "A. Ha sido sede de múltiples paradas nacionales, Juegos Mundiales y cuna de destacados atletas de selección",
      "B. En Cali no hay canchas de squash",
      "C. Solo se juega fútbol",
      "D. Es exclusivo para extranjeros"
    ],
    "correcta": 0,
    "explicacion": "Cali cuenta con una afición apasionada y canchas de primer nivel que impulsaron el squash en el suroccidente colombiano."
  },
  {
    "id": 393,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "Evolución del Squash Femenino Colombiano",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo ha evolucionado el squash femenino en Colombia en la última década?",
    "opciones": [
      "A. Ha desaparecido por completo",
      "B. Ha crecido exponencialmente con medallas de oro continentales y presencia constante en el Top 100 de la PSA",
      "C. Solo juegan jugadoras extranjeras",
      "D. No se permite en competencias"
    ],
    "correcta": 1,
    "explicacion": "Las mujeres colombianas son hoy referentes indiscutibles en los podios de Juegos Panamericanos y Suramericanos."
  },
  {
    "id": 394,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "La Gira Sudamericana de la PSA",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué es el 'South American Tour' de la PSA?",
    "opciones": [
      "A. Una gira turística sin partidos",
      "B. Un torneo de fútbol de salón",
      "C. Un circuito de torneos Challenger oficiales disputados en Colombia, Perú, Argentina y Brasil para sumar puntos de ranking mundial",
      "D. Una exhibición en barcos"
    ],
    "correcta": 2,
    "explicacion": "Permite a los talentos emergentes sudamericanos sumar valiosos puntos PSA sin tener que viajar a Europa o Asia."
  },
  {
    "id": 395,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Apoyo del Ministerio del Deporte",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué programa estatal apoya a los squashistas de élite como Miguel Ángel y Laura Tovar?",
    "opciones": [
      "A. El programa de vivienda rural",
      "B. Un subsidio de transporte público",
      "C. No reciben ningún apoyo",
      "D. El programa 'Atleta Excelencia' del Ministerio del Deporte de Colombia (Mindeporte)"
    ],
    "correcta": 3,
    "explicacion": "Mindeporte brinda becas, concentraciones y biomédicos a los atletas del ciclo olímpico en squash."
  },
  {
    "id": 396,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Efecto Miguel Ángel Rodríguez",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué impacto tuvo el título del British Open 2018 de Miguel Ángel en la niñez colombiana?",
    "opciones": [
      "A. Inspiró a cientos de niños en academias de todo el país a soñar con ser campeones mundiales de squash",
      "B. Hizo que todos abandonaran el deporte",
      "C. Provocó el cierre de clubes",
      "D. No tuvo ninguna repercusión mediática"
    ],
    "correcta": 0,
    "explicacion": "Ver a un compatriota levantar el trofeo más antiguo del mundo demostró que Colombia puede reinar en la élite del squash."
  },
  {
    "id": 397,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash en Canchas Públicas de Colombia",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué ciudades colombianas se cuenta con canchas públicas municipales de squash?",
    "opciones": [
      "A. En ninguna; todas son privadas en el 100%",
      "B. En Bogotá (Centro de Alto Rendimiento / Parque Cayetano Cañizares) y escenarios del Valle del Cauca y Medellín",
      "C. En todas las esquinas de los barrios",
      "D. En estaciones de Transmilenio"
    ],
    "correcta": 1,
    "explicacion": "El IDRD y entidades públicas han habilitado canchas públicas para democratizar el acceso al squash formativo."
  },
  {
    "id": 398,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Squash Colombiano Rumbo a LA28",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué meta histórica se ha trazado la Federación Colombiana de Squash tras la inclusión en Los Ángeles 2028?",
    "opciones": [
      "A. Renunciar a los Juegos Olímpicos",
      "B. Cambiar de deporte",
      "C. Clasificar atletas y pelear por la primera medalla olímpica oficial de la historia para Colombia en squash",
      "D. No competir internacionalmente"
    ],
    "correcta": 2,
    "explicacion": "La oficialización de LA28 coloca a Colombia ante la mayor oportunidad dorada de su historia en el deporte de la raqueta."
  },
  {
    "id": 399,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "La Pasión y Entrega del Jugador Latino",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué cualidad humana y deportiva elogian los relatores internacionales de la PSA sobre los jugadores colombianos?",
    "opciones": [
      "A. Que no corren en la cancha",
      "B. Que discuten todos los puntos",
      "C. Que juegan tristes",
      "D. Su espíritu combativo indomable, alegría en cancha, juego limpio y atletismo espectacular hasta el último aliento"
    ],
    "correcta": 3,
    "explicacion": "El carisma, la garra y la simpatía de los atletas colombianos los han convertido en los favoritos del público mundial en la PSA."
  },
  {
    "id": 400,
    "area": "Squash Colombiano y Sudamericano",
    "subtema": "El Futuro del Squash Colombiano",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué garantiza el relevo generacional del squash en Colombia para los próximos 10 años?",
    "opciones": [
      "A. Semilleros infantiles activos, entrenadores capacitados y el ejemplo inmortal de figuras mundiales como Miguel Ángel Rodríguez",
      "B. La suerte meteorológica",
      "C. Comprar raquetas usadas",
      "D. No hay futuro en el squash"
    ],
    "correcta": 0,
    "explicacion": "Con una base sólida y programas de desarrollo, Colombia se proyecta como una potencia consolidada en el squash olímpico."
  },
  {
    "id": 401,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Inclusión Olímpica Histórica LA28",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué sesión del COI se aprobó oficialmente el ingreso del Squash a los Juegos Olímpicos de Los Ángeles 2028?",
    "opciones": [
      "A. En los Juegos Olímpicos de París 1924",
      "B. En la 141ª Sesión del Comité Olímpico Internacional (COI) en Mumbai (India), en octubre de 2023",
      "C. En una reunión en Atenas en 1896",
      "D. En el Congreso de Tokio 2020"
    ],
    "correcta": 1,
    "explicacion": "Tras décadas de lucha internacional de la WSF y PSA, el COI confirmó en Mumbai la inclusión del Squash como deporte olímpico oficial en LA28."
  },
  {
    "id": 402,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Modalidad en Los Ángeles 2028",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué modalidades de squash se disputarán oficialmente en los Juegos Olímpicos de Los Ángeles 2028?",
    "opciones": [
      "A. Solo torneo de dobles mixtos en playa",
      "B. Squash con raquetas de madera de exhibición",
      "C. Torneo individual masculino y torneo individual femenino por medallas olímpicas",
      "D. Torneo por equipos de 10 personas"
    ],
    "correcta": 2,
    "explicacion": "En LA28 los mejores atletas del planeta lucharán por el oro olímpico en las pruebas individuales masculina y femenina."
  },
  {
    "id": 403,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Origen en Harrow School",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué prestigiosa institución inglesa y en qué década nació históricamente el squash?",
    "opciones": [
      "A. En la Universidad de Oxford en 1750",
      "B. En el Palacio de Buckingham en 1900",
      "C. En el Club de Yates de Liverpool en 1920",
      "D. En la Harrow School de Londres hacia 1830, derivado del juego 'Rackets'"
    ],
    "correcta": 3,
    "explicacion": "Estudiantes de Harrow descubrieron que una pelota de goma pinchada que se 'aplastaba' (squashed) al chocar con el muro permitía un juego más técnico."
  },
  {
    "id": 404,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Etimología del Término 'Squash'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué se le dio el nombre de 'Squash' a este nuevo deporte en el siglo XIX?",
    "opciones": [
      "A. Por la onomatopeya del sonido y la sensación de la pelota hueca de caucho que se aplastaba ('squash') al chocar contra la pared",
      "B. Por el nombre de una verdura inglesa (calabaza)",
      "C. Por el apellido de su inventor Lord Squash",
      "D. Por una palabra en latín antiguo"
    ],
    "correcta": 0,
    "explicacion": "El verbo inglés 'to squash' significa aplastar o comprimir, aludiendo a la deformación de la pelota de goma blanda frente a las de cuero de rackets."
  },
  {
    "id": 405,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Primera Cancha Fuera de Inglaterra",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Dónde se construyó la primera cancha formal de squash fuera del Reino Unido en 1884?",
    "opciones": [
      "A. En París (Francia)",
      "B. En St. Paul's School en Concord, New Hampshire (Estados Unidos)",
      "C. En Calcuta (India)",
      "D. En Buenos Aires (Argentina)"
    ],
    "correcta": 1,
    "explicacion": "Estados Unidos adoptó tempranamente el squash con la construcción de canchas en colegios y universidades de la Ivy League."
  },
  {
    "id": 406,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Fundación de la WSF",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué año se fundó la International Squash Rackets Federation (ISRF), hoy conocida como World Squash Federation (WSF)?",
    "opciones": [
      "A. En 1900",
      "B. En 2005",
      "C. En 1967 en Londres por delegados de 7 países pioneros",
      "D. En 1850"
    ],
    "correcta": 2,
    "explicacion": "La WSF nació en 1967 como ISRF para unificar el reglamento mundial de medidas de cancha, pelotas y torneos internacionales."
  },
  {
    "id": 407,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Nacimiento de la PSA",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué año se fundó la Professional Squash Association (PSA) para gestionar el circuito rentado masculino?",
    "opciones": [
      "A. En 1920",
      "B. En 2010",
      "C. En 1890",
      "D. En 1975, impulsada por figuras como Jonah Barrington"
    ],
    "correcta": 3,
    "explicacion": "La PSA surgió en 1975 para defender los intereses y bolsas de premios de los jugadores profesionales en todo el mundo."
  },
  {
    "id": 408,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Fusión de Tours Masculino y Femenino",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué año se fusionaron la PSA (hombres) y la WSA (mujeres) en una única entidad profesional conjunta?",
    "opciones": [
      "A. En 2015, garantizando igualdad de condiciones, transmisiones y paridad de premios en torneos mayores",
      "B. En 1980",
      "C. En 2000",
      "D. Nunca se han fusionado"
    ],
    "correcta": 0,
    "explicacion": "La histórica fusión de 2015 unificó el tour profesional bajo una sola bandera con paridad de premios en los torneos Platinum."
  },
  {
    "id": 409,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El British Open: 'Wimbledon del Squash'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Desde qué año se disputa ininterrumpidamente el prestigioso British Open de Squash?",
    "opciones": [
      "A. Desde 1800",
      "B. Desde 1930 (disputándose el primer torneo masculino en diciembre de 1930)",
      "C. Desde 1970",
      "D. Desde 1995"
    ],
    "correcta": 1,
    "explicacion": "El British Open es considerado el torneo decano y más sagrado del squash internacional, equivalente a Wimbledon en el tenis."
  },
  {
    "id": 410,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Primer Campeón del British Open",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Quién fue el primer campeón oficial del British Open masculino en la historia?",
    "opciones": [
      "A. Jahangir Khan",
      "B. Hashim Khan",
      "C. Don Butcher (Inglaterra) en 1930",
      "D. Jonah Barrington"
    ],
    "correcta": 2,
    "explicacion": "El profesional inglés Don Butcher inauguró el palmarés histórico del British Open derrotando a Charles Read."
  },
  {
    "id": 411,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Canchas All-Glass en Escenarios Icónicos",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué monumento universal de las maravillas del mundo se han montado canchas de cristal de squash?",
    "opciones": [
      "A. En la Torre Eiffel de París en la punta",
      "B. En el Coliseo Romano dentro de la arena de leones",
      "C. En las Cataratas del Niágara flotando",
      "D. Frente a las milenarias Pirámides de Guiza en El Cairo (Egipto)"
    ],
    "correcta": 3,
    "explicacion": "El Al-Ahram International frente a las Pirámides de Guiza iluminadas de noche brindó algunas de las imágenes más majestuosas del deporte."
  },
  {
    "id": 412,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Tournament of Champions en Grand Central",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué emblemática estación de trenes de Nueva York se celebra anualmente el Tournament of Champions (ToC)?",
    "opciones": [
      "A. En la Grand Central Terminal de Manhattan en Vanderbilt Hall",
      "B. En Penn Station bajo tierra",
      "C. En el metro de Times Square",
      "D. En Wall Street en el parqué de la bolsa"
    ],
    "correcta": 0,
    "explicacion": "El ToC de Nueva York en la Grand Central reúne a miles de transeúntes y aficionados que disfrutan del squash en un cubo de cristal panorámico."
  },
  {
    "id": 413,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Niveles de Torneos PSA",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es el nivel más alto de torneos en la pirámide competitiva del PSA World Tour?",
    "opciones": [
      "A. Los torneos Challenger 3",
      "B. Los eventos PSA Platinum (World Tour Finals, British Open, US Open, El Gouna, Qatar, ToC, Windy City)",
      "C. Los torneos Satélite de club",
      "D. Las exhibiciones de verano"
    ],
    "correcta": 1,
    "explicacion": "Los torneos Platinum reparten las mayores bolsas de premios, puntos de ranking y cuadros completos de 48 de los mejores del mundo."
  },
  {
    "id": 414,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Campaña Olímpica: Décadas de Lucha",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué ediciones previas de los Juegos Olímpicos el squash quedó a las puertas de ingresar como deporte oficial?",
    "opciones": [
      "A. Nunca se había postulado antes",
      "B. Fue deporte olímpico en 1980 y luego lo sacaron",
      "C. Londres 2012, Río 2016 y Tokio 2020 (siendo finalista en las votaciones del COI)",
      "D. Fue rechazado por falta de atletas"
    ],
    "correcta": 2,
    "explicacion": "El squash lideró múltiples votaciones del COI por su universalidad, paridad de género y atletismo, hasta consagrar su sueño para LA28."
  },
  {
    "id": 415,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Sede de Squash en LA28",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿En qué metrópoli estadounidense se celebrarán las pruebas olímpicas de squash en 2028?",
    "opciones": [
      "A. En Nueva York",
      "B. En Miami",
      "C. En Chicago",
      "D. En Los Ángeles, California (Estados Unidos)"
    ],
    "correcta": 3,
    "explicacion": "Los Ángeles 2028 marcará el debut olímpico absoluto del squash en el Olimpo del deporte mundial."
  },
  {
    "id": 416,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "SquashTV: La Plataforma Oficial",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuál es la plataforma digital oficial de transmisión en vivo y streaming del circuito profesional PSA?",
    "opciones": [
      "A. SquashTV (con cobertura en directo de todos los torneos mayores)",
      "B. Netflix Deportes",
      "C. YouTube Kids",
      "D. TikTok Live únicamente"
    ],
    "correcta": 0,
    "explicacion": "SquashTV ofrece cámaras superlentas, estadísticas en vivo y transmisiones globales de todos los partidos del tour."
  },
  {
    "id": 417,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en los Juegos Panamericanos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Desde qué año forma parte oficial el squash de los Juegos Panamericanos?",
    "opciones": [
      "A. Desde 1951",
      "B. Desde Mar del Plata 1995 (Argentina)",
      "C. Desde 2019",
      "D. No está en los Panamericanos"
    ],
    "correcta": 1,
    "explicacion": "Desde su ingreso en 1995, el squash ha sido uno de los deportes más vibrantes del ciclo olímpico de las Américas."
  },
  {
    "id": 418,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en los Commonwealth Games",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Desde qué edición los Juegos de la Mancomunidad (Commonwealth Games) incluyen al squash?",
    "opciones": [
      "A. Desde 1930",
      "B. Desde 2022",
      "C. Desde Kuala Lumpur 1998 (Malasia)",
      "D. Solo en Londres 2012"
    ],
    "correcta": 2,
    "explicacion": "En los Commonwealth Games el squash es deporte estelar, con audiencias masivas en Inglaterra, Australia, Nueva Zelanda y Malasia."
  },
  {
    "id": 419,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Récord de Países en la WSF",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿A cuántas federaciones nacionales de los cinco continentes agrupa actualmente la WSF?",
    "opciones": [
      "A. A solo 10 países de habla inglesa",
      "B. A 20 países",
      "C. A 500 países",
      "D. A más de 120 federaciones nacionales afiliadas en todo el mundo"
    ],
    "correcta": 3,
    "explicacion": "La WSF posee una implantación planetaria con millones de practicantes en América, Europa, Asia, África y Oceanía."
  },
  {
    "id": 420,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Primera Cancha de Cristal Desmontable",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Quién diseñó y promovió la primera cancha de cristal desmontable de cuatro paredes en los años 80?",
    "opciones": [
      "A. Alastair Cordiner y pioneros de la WSF para llevar el squash a estadios, centros comerciales y monumentos",
      "B. Lord Mountbatten",
      "C. Albert Einstein",
      "D. Thomas Edison"
    ],
    "correcta": 0,
    "explicacion": "Las canchas de cristal desmontables liberaron al squash de los sótanos de clubes y lo convirtieron en un espectáculo televisivo global."
  },
  {
    "id": 421,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Balón de Oro del Squash",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué premios anuales otorga la PSA a los mejores del año?",
    "opciones": [
      "A. El Balón de Oro de la FIFA",
      "B. PSA Player of the Year, Young Player of the Year y Shot of the Year (Tiro del Año)",
      "C. Un trofeo de cristal sin nombre",
      "D. No entrega premios"
    ],
    "correcta": 1,
    "explicacion": "La PSA galardona anualmente a los números 1, revelaciones juveniles y a la jugada más espectacular de la temporada."
  },
  {
    "id": 422,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Salario y Paridad de Premios en PSA",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué hito de igualdad de género lideró el squash en los torneos World Series y Platinum?",
    "opciones": [
      "A. Las mujeres ganan el doble que los hombres",
      "B. Los hombres ganan el triple",
      "C. Fue uno de los primeros deportes mundiales en equiparar al 100% las bolsas de premios entre hombres y mujeres",
      "D. No hay premios en dinero"
    ],
    "correcta": 2,
    "explicacion": "En todos los eventos mayores de la PSA, las campeonas femeninas reciben exactamente la misma bolsa económica que los masculinos."
  },
  {
    "id": 423,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en los Juegos Mundiales (World Games)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Desde cuándo participa el squash en los World Games (deportes reconocidos por el COI)?",
    "opciones": [
      "A. Solo en 2022",
      "B. Nunca ha estado",
      "C. Desde 1890",
      "D. Desde Lahti 1997 y con presencia estelar en Akita 2001, Duisburgo 2005, Kaohsiung 2009, Cali 2013 y Birmingham 2022"
    ],
    "correcta": 3,
    "explicacion": "Los Juegos Mundiales fueron el gran escaparate del squash ante los miembros del COI durante dos décadas."
  },
  {
    "id": 424,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Código de Dopaje WADA / AMA",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué organismo internacional regula el control antidopaje de los jugadores de squash?",
    "opciones": [
      "A. La Agencia Mundial Antidopaje (WADA / AMA) bajo el estricto código antidopaje de la WSF",
      "B. La FIFA",
      "C. La policía local",
      "D. Los propios clubes"
    ],
    "correcta": 0,
    "explicacion": "Los atletas de élite de squash pasan controles antidopaje rigurosos de orina y sangre dentro y fuera de competencia."
  },
  {
    "id": 425,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Ranking Mundial por Promedio",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo calcula la PSA su ranking mundial de jugadores profesionales?",
    "opciones": [
      "A. Por votación de periodistas",
      "B. Mediante un sistema de puntos ponderados por promedio basado en los mejores resultados de las últimas 52 semanas",
      "C. Por cantidad de partidos jugados sin importar ganar o perder",
      "D. Por el peso en kilos del jugador"
    ],
    "correcta": 1,
    "explicacion": "El ranking PSA se actualiza cada lunes promediando los puntos obtenidos según el nivel de los torneos jugados en el año móvil."
  },
  {
    "id": 426,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Torneo de Campeones de El Gouna",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué paradisíaco balneario del Mar Rojo egipcio se disputa uno de los torneos Platinum más famosos?",
    "opciones": [
      "A. En Alejandría en el puerto",
      "B. En el desierto del Sahara",
      "C. El Gouna International Squash Open",
      "D. En el Canal de Suez"
    ],
    "correcta": 2,
    "explicacion": "El Gouna Open reúne a la élite mundial en un estadio de cristal junto al Mar Rojo con un ambiente festivo."
  },
  {
    "id": 427,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El US Open en Filadelfia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿En qué histórica universidad de Filadelfia se ha disputado tradicionalmente el US Open Squash Championships?",
    "opciones": [
      "A. En Harvard",
      "B. En Yale",
      "C. En Columbia",
      "D. En la Universidad de Drexel (Daskalakis Athletic Center) y el nuevo Arlen Specter US Squash Center"
    ],
    "correcta": 3,
    "explicacion": "El US Open en Filadelfia es uno de los torneos de mayor bolsa de premios y prestigio del continente americano."
  },
  {
    "id": 428,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Arlen Specter US Squash Center",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué centro deportivo inaugurado en Filadelfia en 2021 es considerado el mayor complejo de squash del mundo?",
    "opciones": [
      "A. El Arlen Specter US Squash Center, con 20 canchas incluyendo 2 canchas de cristal Show Court",
      "B. El Madison Square Garden",
      "C. El Central Park Squash Club",
      "D. El estadio de los Yankees"
    ],
    "correcta": 0,
    "explicacion": "El Specter Center es el cuartel general del squash en EE.UU., impulsando el crecimiento juvenil hacia LA28."
  },
  {
    "id": 429,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en África",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué país africano fuera de Egipto ha sido potencia histórica ganando medallas continentales?",
    "opciones": [
      "A. Madagascar",
      "B. Sudáfrica, con figuras de talla mundial como Roland Schoeman (en su etapa juvenil) y Stephen Coppinger",
      "C. Chad",
      "D. Somalia"
    ],
    "correcta": 1,
    "explicacion": "Sudáfrica ha tenido una rica tradición competitiva en el tour PSA y en campeonatos mundiales por equipos."
  },
  {
    "id": 430,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en Asia",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué países asiáticos han dominado históricamente los Juegos Asiáticos en squash?",
    "opciones": [
      "A. Mongolia y Nepal",
      "B. Rusia",
      "C. Malasia, Pakistán, India y Hong Kong",
      "D. Corea del Norte"
    ],
    "correcta": 2,
    "explicacion": "Nicol David (Malasia), Jahangir Khan (Pakistán) y Saurav Ghosal (India) han sido héroes nacionales en los Juegos Asiáticos."
  },
  {
    "id": 431,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Circuito Challenger de la PSA",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué función cumple el PSA Challenger Tour (torneos de 3k, 6k, 12k, 15k, 30k)?",
    "opciones": [
      "A. Es solo para jugadores retirados mayores de 50 años",
      "B. Es un torneo sin premios ni puntos",
      "C. Es exclusivo para niños menores de 10 años",
      "D. Permite a las jóvenes promesas y jugadores en ascenso sumar puntos para clasificar a los cuadros principales del World Tour"
    ],
    "correcta": 3,
    "explicacion": "El Challenger Tour es el escalafón formativo indispensable donde los atletas viajan por el mundo forjando su ranking."
  },
  {
    "id": 432,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Campeonato Mundial por Equipos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cada cuántos años organiza la WSF el Campeonato Mundial de Squash por Equipos (WSF World Team Championship)?",
    "opciones": [
      "A. Cada 2 años, alternando entre el campeonato masculino y el femenino",
      "B. Cada 10 años",
      "C. Todos los meses",
      "D. Una sola vez en la historia"
    ],
    "correcta": 0,
    "explicacion": "Las selecciones nacionales compiten en duelos de 3 jugadores al mejor de 5 games por la corona de campeones del planeta."
  },
  {
    "id": 433,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash Universitario en EE.UU. (CSA)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué importancia tiene la College Squash Association (CSA) de las universidades de EE.UU.?",
    "opciones": [
      "A. No tiene ninguna importancia",
      "B. Otorga becas deportivas universitarias completas a los mejores talentos juveniles del mundo (en Harvard, Yale, Princeton, Trinity)",
      "C. Solo juegan con raquetas de plástico",
      "D. Está prohibido para extranjeros"
    ],
    "correcta": 1,
    "explicacion": "La liga universitaria de EE.UU. atrae a cientos de talentos latinoamericanos, egipcios e ingleses con educación de clase mundial."
  },
  {
    "id": 434,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Trinity College: La Racha Universitaria",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué hazaña mítica logró el equipo de squash de Trinity College en EE.UU.?",
    "opciones": [
      "A. Perdió todos sus partidos",
      "B. Ganó un partido en 10 segundos",
      "C. Ganó 252 partidos universitarios consecutivos invicto entre 1998 y 2012 bajo la dirección de Paul Assaiante",
      "D. Jugó sin entrenador"
    ],
    "correcta": 2,
    "explicacion": "La racha de 252 victorias de Trinity es la más larga en la historia del deporte universitario estadounidense de la NCAA/CSA."
  },
  {
    "id": 435,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Paul Assaiante: 'El Entrenador de Campeones'",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Quién es Paul Assaiante en la historia del squash norteamericano?",
    "opciones": [
      "A. Un árbitro inglés de 1920",
      "B. El fabricante de las pelotas Dunlop",
      "C. Un periodista de televisión",
      "D. El legendario entrenador de Trinity College que forjó la racha de 252 victorias y asesoró a la selección de EE.UU."
    ],
    "correcta": 3,
    "explicacion": "Assaiante es una leyenda de la motivación deportiva y la excelencia táctica en el squash colegial."
  },
  {
    "id": 436,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en Oceanía",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué dos países de Oceanía han sido potencias mundiales con múltiples números 1 y campeones mundiales?",
    "opciones": [
      "A. Australia y Nueva Zelanda",
      "B. Fiyi y Samoa",
      "C. Papúa Nueva Guinea",
      "D. Islas Salomón"
    ],
    "correcta": 0,
    "explicacion": "Geoff Hunt, Sarah Fitz-Gerald, David Palmer, Rodney Martin (Australia) y Paul Coll y Ross Norman (Nueva Zelanda) son glorias eternas."
  },
  {
    "id": 437,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Squash en Alemania",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué jugador alemán alcanzó el puesto #3 del ranking mundial PSA y ganó múltiples títulos mayores?",
    "opciones": [
      "A. Boris Becker",
      "B. Simon Rösner ('The Tree Chopper')",
      "C. Michael Schumacher",
      "D. Dirk Nowitzki"
    ],
    "correcta": 1,
    "explicacion": "Simon Rösner fue el líder del squash germano ganando el prestigioso Tournament of Champions de Nueva York en 2018."
  },
  {
    "id": 438,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Salón de la Fama de la PSA",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué galardón reconoce la trayectoria de por vida de atletas y dirigentes en el squash profesional?",
    "opciones": [
      "A. El Oscar de Hollywood",
      "B. El Grammy deportivo",
      "C. El PSA Lifetime Achievement Award",
      "D. El Balón de Oro de Francia"
    ],
    "correcta": 2,
    "explicacion": "Distingue a personalidades que dedicaron su vida al crecimiento, juego limpio y expansión internacional del squash."
  },
  {
    "id": 439,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Revista 'Squash Player'",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál ha sido históricamente la revista impresa de referencia mundial del squash desde los años 70?",
    "opciones": [
      "A. Sports Illustrated",
      "B. Vogue Squash",
      "C. National Geographic",
      "D. 'Squash Player Magazine' fundada por Ian Wright"
    ],
    "correcta": 3,
    "explicacion": "Squash Player documentó durante décadas cada final histórica, cambio de reglamento y revolución tecnológica de raquetas."
  },
  {
    "id": 440,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El World Squash Day",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuándo se celebra anualmente el 'Día Mundial del Squash' (World Squash Day) para promover este deporte en los clubes?",
    "opciones": [
      "A. En el mes de octubre de cada año con clínicas gratuitas y jornadas de puertas abiertas en todo el mundo",
      "B. El 1 de enero",
      "C. El 29 de febrero únicamente",
      "D. No existe tal día"
    ],
    "correcta": 0,
    "explicacion": "El World Squash Day une a miles de clubes de todo el planeta para captar nuevos niños y aficionados a las canchas."
  },
  {
    "id": 441,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Squash para la Inclusión Social",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué son programas como 'SquashSmarts' o 'StreetSquash' en Estados Unidos y Latinoamérica?",
    "opciones": [
      "A. Empresas de venta de bebidas",
      "B. Fundaciones sin fines de lucro que utilizan el squash y el refuerzo escolar para transformar la vida de niños en comunidades vulnerables",
      "C. Torneos exclusivos para millonarios",
      "D. Equipos de fútbol profesional"
    ],
    "correcta": 1,
    "explicacion": "El programa 'Urban Squash' ha becado a miles de jóvenes de bajos recursos, llevándolos a graduarse en universidades de prestigio."
  },
  {
    "id": 442,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Retorno Olímpico a EE.UU.",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué para el squash es tan significativo debutar olímpicamente precisamente en Los Ángeles 2028?",
    "opciones": [
      "A. Porque Hollywood está allí",
      "B. Porque no hay canchas en Europa",
      "C. Porque EE.UU. es el mercado de mayor crecimiento en licencias, canchas de cristal universitarias e inversión del deporte",
      "D. Por ser el único país que postuló"
    ],
    "correcta": 2,
    "explicacion": "El auge masivo del squash en escuelas y universidades de EE.UU. garantiza que LA28 sea una fiesta deportiva con estadios repletos."
  },
  {
    "id": 443,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Primer Campeonato Mundial PSA",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué año y ciudad se celebró el primer Campeonato Mundial (World Open) masculino oficial de la historia?",
    "opciones": [
      "A. En 1900 en París",
      "B. En 1950 en Nueva York",
      "C. En 2010 en Tokio",
      "D. En 1976 en Londres (Inglaterra), ganado por el australiano Geoff Hunt"
    ],
    "correcta": 3,
    "explicacion": "Geoff Hunt se coronó primer campeón mundial oficial en 1976 derrotando a Mohibullah Khan en una batalla memorable."
  },
  {
    "id": 444,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Primer Campeonato Mundial Femenino",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué año se disputó el primer Campeonato Mundial femenino oficial de squash?",
    "opciones": [
      "A. En 1979 en Brisbane (Australia), ganado por la australiana Heather McKay",
      "B. En 1920",
      "C. En 2005",
      "D. En 1950"
    ],
    "correcta": 0,
    "explicacion": "Heather McKay, una de las deportistas más dominantes del siglo XX, ganó la corona inaugural en su tierra natal."
  },
  {
    "id": 445,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "Heather McKay: La Invicta Australiana",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué récord asombroso impuso la australiana Heather McKay en el squash femenino entre 1962 y 1979?",
    "opciones": [
      "A. Ganó solo un partido",
      "B. Estuvo invicta durante casi dos décadas consecutivas sin perder un solo partido en 18 años de carrera",
      "C. Jugaba sin raqueta",
      "D. Se retiró a los 14 años"
    ],
    "correcta": 1,
    "explicacion": "Heather McKay es considerada un fenómeno biológico irrepetible: dominó el squash femenino mundial invicta de 1962 a 1979."
  },
  {
    "id": 446,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Formato de Canchas en Centros Comerciales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué la PSA monta con frecuencia su show court en centros comerciales de Hong Kong, Malasia y El Cairo?",
    "opciones": [
      "A. Porque no tienen dinero para estadios",
      "B. Para vender ropa deportiva en tiendas",
      "C. Para acercar el deporte de élite al público masivo y peatonal en lugares de alto tráfico diario",
      "D. Porque está prohibido jugar en clubes"
    ],
    "correcta": 2,
    "explicacion": "Canchas de vidrio en atrios comerciales permiten a cientos de miles de personas descubrir la belleza plástica del squash."
  },
  {
    "id": 447,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Tecnología InteractiveSquash",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué es el sistema tecnológico 'interactiveSquash' instalado en canchas modernas?",
    "opciones": [
      "A. Un robot que juega en lugar del oponente",
      "B. Una raqueta con pantalla táctil",
      "C. Un marcador de papel",
      "D. Un sistema de proyección digital interactiva en la pared frontal con sensores de impacto para videojuegos y análisis biomecánico"
    ],
    "correcta": 3,
    "explicacion": "Convierte el muro en una pantalla táctil gigante que combina gamificación, puntería y datos métricos de entrenamiento en tiempo real."
  },
  {
    "id": 448,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "La Oficialización por el COI en Mumbai",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué presidente del Comité Olímpico Internacional presidió la sesión que aprobó el squash para LA28?",
    "opciones": [
      "A. Thomas Bach",
      "B. Juan Antonio Samaranch",
      "C. Jacques Rogge",
      "D. Pierre de Coubertin"
    ],
    "correcta": 0,
    "explicacion": "El presidente del COI Thomas Bach felicitó calurosamente a la comunidad mundial del squash tras la unánime aprobación en Mumbai."
  },
  {
    "id": 449,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Sueño Hecho Realidad",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué significa la frase 'Squash is an Olympic Sport' proclamada por atletas de todo el mundo en 2023?",
    "opciones": [
      "A. Un lema de marketing comercial",
      "B. La culminación del mayor anhelo de generaciones de leyendas (de Hashim Khan a Jahangir, Nicol David y Miguel Ángel Rodríguez)",
      "C. Una orden de arresto deportivo",
      "D. Un error tipográfico de la prensa"
    ],
    "correcta": 1,
    "explicacion": "Representa el reconocimiento de la máxima cumbre del olimpismo a uno de los deportes más completos y puros del ser humano."
  },
  {
    "id": 450,
    "area": "Historia, Origen, PSA World Tour y Juegos Olímpicos LA28",
    "subtema": "El Legado del Squash para las Futuras Generaciones",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál es el mensaje que el squash olímpico transmitirá a los millones de jóvenes que lo verán en LA28?",
    "opciones": [
      "A. Que solo importa ganar a cualquier costo",
      "B. Que no se necesita hacer ejercicio",
      "C. Que la honestidad deportiva, la superación física extrema y la mente estratégica pueden convivir en armonía en 60 metros cuadrados",
      "D. Que las paredes de cristal son irrompibles"
    ],
    "correcta": 2,
    "explicacion": "El squash olímpico enseñará al mundo la belleza de un combate leal sin contacto físico donde triunfa la inteligencia y el corazón."
  },
  {
    "id": 451,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Gasto Calórico en Squash",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué prestigiosas publicaciones como la revista Forbes clasificaron al squash como el deporte más saludable y exigente del mundo?",
    "opciones": [
      "A. Porque se juega sentado",
      "B. Porque no produce sudor",
      "C. Porque es un deporte que se juega al aire libre",
      "D. Porque quema entre 800 y 1.200 kcal por hora, ejercitando casi todos los grupos musculares y la capacidad cardiopulmonar"
    ],
    "correcta": 3,
    "explicacion": "Forbes evaluó gasto calórico, resistencia cardiorrespiratoria, fuerza muscular, flexibilidad y riesgo de lesiones, coronando al squash #1."
  },
  {
    "id": 452,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Entrenamiento de 'Ghosting'",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿En qué consiste la técnica de entrenamiento por excelencia en squash llamada 'Ghosting'?",
    "opciones": [
      "A. Moverse por la cancha vacía sin pelota, repitiendo patrones de desplazamiento y estocadas hacia las esquinas a ritmo cronometrado",
      "B. Jugar disfrazado de fantasma en Halloween",
      "C. Jugar a oscuras para mejorar el oído",
      "D. Ver partidos grabados en televisión"
    ],
    "correcta": 0,
    "explicacion": "El ghosting automatiza las cadenas cinéticas de pies, estocada y balance sin la distracción de la pelota, puliendo la economía de movimientos."
  },
  {
    "id": 453,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Vías Energéticas Predominantes",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué sistema metabólico energético predomina durante un partido de squash de 75 minutos?",
    "opciones": [
      "A. Únicamente metabolismo anaeróbico sin respirar",
      "B. Metabolismo aeróbico de base para la recuperación, con intensos picos anaeróbicos lácticos y alácticos durante los rallies",
      "C. Solo el sistema de fosfágenos durante 2 segundos",
      "D. Ninguno; no hay demanda metabólica"
    ],
    "correcta": 1,
    "explicacion": "El squash es un deporte interválico de alta intensidad (HIIT) que exige tanto una potencia anaeróbica brutal como una base aeróbica sólida."
  },
  {
    "id": 454,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "VO2 Máx en la Élite",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué valores de consumo máximo de oxígeno (VO2 máx) registran habitualmente los mejores jugadores profesionales de squash?",
    "opciones": [
      "A. Menos de 20 ml/kg/min",
      "B. Exactamente 150 ml/kg/min",
      "C. Valores entre 65 y 75 ml/kg/min, comparables a los de ciclistas de ruta y maratonistas olímpicos",
      "D. Cero"
    ],
    "correcta": 2,
    "explicacion": "La exigencia cardiovascular de mantener rallies de 40 golpes a más de 180 latidos por minuto demanda un motor aeróbico excepcional."
  },
  {
    "id": 455,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Frecuencia Cardíaca Media",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué porcentaje de la frecuencia cardíaca máxima (FCmáx) suele sostener un jugador durante un partido competitivo?",
    "opciones": [
      "A. Menos del 40% (en reposo)",
      "B. 200% de la frecuencia",
      "C. 50% fijo",
      "D. Entre el 85% y el 95% de su FCmáx durante la mayor parte del encuentro"
    ],
    "correcta": 3,
    "explicacion": "Pocos deportes mantienen a los atletas en la 'zona roja' cardiovascular durante períodos tan prolongados como el squash."
  },
  {
    "id": 456,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Estocada (Lunge) y Cuádriceps",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué tipo de contracción muscular realiza el cuádriceps de la pierna adelantada al frenar en seco en una esquina?",
    "opciones": [
      "A. Contracción excéntrica intensa (el músculo se alarga mientras frena la carga del cuerpo)",
      "B. Contracción concéntrica únicamente",
      "C. Relajación total",
      "D. Contracción involuntaria refleja"
    ],
    "correcta": 0,
    "explicacion": "Las frenadas excéntricas absorben varias veces el peso corporal y son las responsables de las agujetas en los cuádriceps tras jugar."
  },
  {
    "id": 457,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Tasa de Sudoración y Deshidratación",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Cuántos litros de líquido por hora puede llegar a perder un jugador de squash en una cancha cerrada calurosa?",
    "opciones": [
      "A. Menos de 50 mililitros",
      "B. Entre 1.5 y 2.5 litros de sudor por hora, exigiendo hidratación constante con electrolitos",
      "C. 10 litros exactos",
      "D. No se pierde líquido"
    ],
    "correcta": 1,
    "explicacion": "El microclima cerrado de la cancha y el esfuerzo continuo provocan tasas de sudoración copiosas que drenan agua y sodio."
  },
  {
    "id": 458,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Pérdida de Rendimiento por Deshidratación",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué pérdida porcentual de peso corporal en agua basta para que la agilidad y reflejos decaigan drásticamente?",
    "opciones": [
      "A. Se requiere perder el 50% del peso",
      "B. No afecta el rendimiento",
      "C. Una pérdida de tan solo el 2% del peso corporal reduce la coordinación y tiempo de reacción hasta en un 15-20%",
      "D. Una pérdida de 0.01%"
    ],
    "correcta": 2,
    "explicacion": "La deshidratación leve espesa la sangre, eleva la temperatura central y nubla la agudeza visual en el rally."
  },
  {
    "id": 459,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Entrenamiento Pliométrico",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué los entrenadores de squash prescriben ejercicios de pliometría (saltos al cajón, vallas)?",
    "opciones": [
      "A. Para ganar masa muscular de culturista",
      "B. Para aprender a saltar sobre las paredes",
      "C. Para estirar los brazos",
      "D. Para mejorar la potencia reactiva de los tobillos y acortar el tiempo de contacto en el split-step y arranques"
    ],
    "correcta": 3,
    "explicacion": "La pliometría entrena el ciclo estiramiento-acortamiento de tendones, permitiendo aceleraciones explosivas desde la T."
  },
  {
    "id": 460,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Fascitis Plantar en Squashistas",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué causa comúnmente la fascitis plantar en practicantes de squash?",
    "opciones": [
      "A. El impacto repetido de desaceleraciones bruscas sobre la madera dura sin el calzado con amortiguación adecuada",
      "B. Usar calcetines de color negro",
      "C. Golpear con revés",
      "D. Tomar agua fría"
    ],
    "correcta": 0,
    "explicacion": "La sobrecarga del arco plantar por frenadas súbitas inflama la fascia; de ahí la importancia de zapatillas con buen soporte de arco."
  },
  {
    "id": 461,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Rol del Glúteo Medio",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Por qué el fortalecimiento del glúteo medio es vital para la estabilidad del squashista?",
    "opciones": [
      "A. Para tener glúteos más grandes",
      "B. Evita que la pelvis caiga hacia el lado contrario y previene el valgo de rodilla (que la rodilla colapse hacia adentro) en el lunge",
      "C. Para sentarse mejor en el banco",
      "D. No cumple ninguna función motora"
    ],
    "correcta": 1,
    "explicacion": "Un glúteo medio fuerte mantiene la rodilla alineada con la punta del pie, blindando los ligamentos cruzados y meniscos."
  },
  {
    "id": 462,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Repuración de Glucógeno Post-Partido",
    "nivel": 1,
    "dificultad": "Básico",
    "pregunta": "¿Qué ventana nutricional óptima se recomienda para reponer los depósitos de glucógeno tras un partido extenuante?",
    "opciones": [
      "A. Esperar 24 horas sin comer nada",
      "B. Comer solo grasas saturadas",
      "C. Ingerir carbohidratos de alto índice glucémico combinados con proteína en proporción 3:1 o 4:1 en los primeros 30-45 minutos",
      "D. Tomar únicamente agua pura sin sales"
    ],
    "correcta": 2,
    "explicacion": "La 'ventana anabólica' post-esfuerzo aprovecha la alta sensibilidad a la insulina para recargar el glucógeno muscular y reparar fibras."
  },
  {
    "id": 463,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Prevención de la Epicondilitis (Codo)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cómo se previene el codo de tenista en squash?",
    "opciones": [
      "A. Golpeando solo con la muñeca suelta",
      "B. Usando cuerdas de alambre de acero",
      "C. No calentando antes del partido",
      "D. Manteniendo la muñeca firme en el impacto, usando el grosor de grip correcto y evitando marcos con vibraciones excesivas"
    ],
    "correcta": 3,
    "explicacion": "El agarre adecuado y no descentrar los golpes protege la inserción de los tendones extensores en el codo."
  },
  {
    "id": 464,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Capacidad de Aceleración en 3 Metros",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué cualidad física es más determinante en squash: la velocidad máxima lineal en 100 m o la aceleración en los primeros 3 metros?",
    "opciones": [
      "A. La aceleración explosiva en los primeros 3 metros (fuerza rápida de arranque y frenado)",
      "B. La velocidad de maratón",
      "C. Correr 100 metros en línea recta",
      "D. La fuerza máxima en press de banca"
    ],
    "correcta": 0,
    "explicacion": "En una cancha de 9.75 m jamás se alcanzan 100 m; lo que gana puntos es la aceleración instantánea en los primeros 2 pasos."
  },
  {
    "id": 465,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Flexibilidad de Cadera y Psoas",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué estirar el psoas ilíaco y los flexores de cadera es crucial tras jugar squash?",
    "opciones": [
      "A. Para ser más alto",
      "B. Porque la postura encorvada y las estocadas continuas acortan el psoas, provocando dolores lumbares compensatorios",
      "C. Para no sudar en la noche",
      "D. Por reglamento de la WSF"
    ],
    "correcta": 1,
    "explicacion": "El psoas tenso tira de las vértebras lumbares hacia adelante; elongarlo tras el juego alivia la tensión de la espalda baja."
  },
  {
    "id": 466,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Umbral Anaeróbico",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué adaptación fisiológica logra un jugador que entrena series interválicas de ghosting?",
    "opciones": [
      "A. Disminuye el número de glóbulos rojos",
      "B. Hace que no necesite respirar oxígeno",
      "C. Eleva su umbral de lactato, permitiéndole sostener rallies largos a alta velocidad sin que sus músculos se acidifiquen y bloqueen",
      "D. Aumenta la grasa corporal"
    ],
    "correcta": 2,
    "explicacion": "El entrenamiento interválico mejora el aclaramiento del lactato sanguíneo, retrasando la fatiga muscular terminal."
  },
  {
    "id": 467,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Core y Estabilidad Lumbar",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué el entrenamiento del 'Core' (transverso, oblicuos, multífidos) es el pilar de un swing potente?",
    "opciones": [
      "A. Para lucir abdominales en la playa",
      "B. Para respirar con el estómago",
      "C. No influye en el golpe",
      "D. Porque el core actúa como puente rígido que transfiere la fuerza generada por las piernas hacia la extremidad superior"
    ],
    "correcta": 3,
    "explicacion": "Sin un core fuerte, la energía de las piernas se disipa en la columna y la raqueta pierde velocidad de impacto."
  },
  {
    "id": 468,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Sueño y Recuperación en Torneos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué dormir al menos 8 horas es insustituible durante un torneo de squash de fin de semana?",
    "opciones": [
      "A. Durante el sueño profundo (fases N3 y REM) se secreta la hormona de crecimiento que repara microtraumatismos musculares",
      "B. Para no ver los partidos de los rivales",
      "C. Porque la cancha está cerrada",
      "D. No tiene importancia; basta dormir 2 horas"
    ],
    "correcta": 0,
    "explicacion": "El sueño reparador restaura el sistema nervioso central y recarga la agudeza neuromuscular para el día siguiente."
  },
  {
    "id": 469,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Propiocepción de Tobillo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ejercicios reducen el riesgo de esguince de tobillo en la cancha de squash?",
    "opciones": [
      "A. Quedarse sentado en una silla",
      "B. Ejercicios de equilibrio sobre superficies inestables (bosu, plato de Freeman) que fortalecen peroneos y ligamentos",
      "C. Correr con los ojos cerrados en la calle",
      "D. Levantar pesas pesadas con los brazos"
    ],
    "correcta": 1,
    "explicacion": "Entrenar la propiocepción afina los reflejos neuromusculares que corrigen una mala pisada antes de que el ligamento se desgarre."
  },
  {
    "id": 470,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Cafeína como Suplemento",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué efecto ergogénico avalado por la ciencia tiene la cafeína (3-6 mg/kg) tomada 45 minutos antes del partido?",
    "opciones": [
      "A. Duplica la masa muscular en un día",
      "B. Hace que la raqueta pese menos",
      "C. Mejora el estado de alerta, disminuye la percepción del esfuerzo y acelera el tiempo de reacción en el rally",
      "D. Es una sustancia prohibida por la WADA"
    ],
    "correcta": 2,
    "explicacion": "La cafeína estimula el sistema nervioso central y es uno de los suplementos con mayor evidencia científica en deportes de raqueta."
  },
  {
    "id": 471,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Calentamiento Dinámico vs Estiramiento Estático",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Por qué antes de entrar a la cancha se debe hacer calentamiento dinámico y NO estiramientos estáticos pasivos prolongados?",
    "opciones": [
      "A. Porque los estiramientos estáticos queman la piel",
      "B. Porque está prohibido por los clubes",
      "C. Porque dan sueño",
      "D. Porque los estiramientos pasivos largos disminuyen la rigidez elástica de los tendones y reducen la potencia explosiva de arranque"
    ],
    "correcta": 3,
    "explicacion": "El calentamiento activo con movilidad articular y aceleraciones progresivas activa el sistema nervioso sin restar potencia elástica."
  },
  {
    "id": 472,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Criocirugía o Baños de Hielo",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Para qué utilizan los profesionales baños de inmersión en agua fría (10-15°C) tras partidos agotadores?",
    "opciones": [
      "A. Para inducir vasoconstricción, reducir el edema inflamatorio muscular y acelerar la sensación de recuperación subjetiva",
      "B. Para congelar la raqueta",
      "C. Para quemar grasa corporal",
      "D. Por castigo del entrenador"
    ],
    "correcta": 0,
    "explicacion": "La hidroterapia fría atenúa el dolor muscular tardío (DOMS) tras partidos maratónicos en torneos consecutivos."
  },
  {
    "id": 473,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Monitoreo con Frecuencímetro / GPS en Cancha",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué parámetro de carga interna monitorean los preparadores físicos con bandas cardíacas en entrenamientos?",
    "opciones": [
      "A. El número de pasos en la calle",
      "B. El tiempo transcurrido en zonas de frecuencia cardíaca alta (>90% FCmáx) y la variabilidad de la frecuencia cardíaca (VFC)",
      "C. La temperatura del reloj",
      "D. Los me gusta en redes sociales"
    ],
    "correcta": 1,
    "explicacion": "La VFC (HRV) permite detectar estados de sobreentrenamiento y fatiga del sistema nervioso autónomo antes de que haya lesión."
  },
  {
    "id": 474,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Impacto en Rodilla y Meniscos",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Qué ángulo de flexión de rodilla en la estocada protege mejor los ligamentos?",
    "opciones": [
      "A. Doblar la rodilla a 180 grados",
      "B. Bloquear la rodilla completamente recta",
      "C. Mantener la rodilla alineada sobre el tobillo sin que sobrepase exageradamente la punta del pie en el impacto",
      "D. Apoyar la rodilla directamente contra el piso"
    ],
    "correcta": 2,
    "explicacion": "Una estocada controlada donde la tibia permanece vertical disipa las fuerzas de cizallamiento anterior en el tendón rotuliano."
  },
  {
    "id": 475,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Síndrome de Sobreentrenamiento (Overtraining)",
    "nivel": 2,
    "dificultad": "Intermedio",
    "pregunta": "¿Cuáles son signos clínicos de sobreentrenamiento en un competidor de squash?",
    "opciones": [
      "A. Aumento de la energía y apetito voraz",
      "B. Ganar todos los torneos con facilidad",
      "C. Mejora del humor y euforia",
      "D. Fatiga crónica persistente, insomnio, elevación de la frecuencia cardíaca basal matutina y caída repentina del rendimiento"
    ],
    "correcta": 3,
    "explicacion": "El desbalance entre carga de trabajo y descanso genera fatiga del eje neuroendocrino y requiere descarga inmediata."
  },
  {
    "id": 476,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Carga de Hidratos de Carbono Pre-Torneo",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo debe alimentarse un jugador los días previos a un torneo de múltiples partidos?",
    "opciones": [
      "A. Aumentar la proporción de carbohidratos complejos (arroz, pasta, avena) para saturar los depósitos de glucógeno hepático y muscular",
      "B. Hacer ayuno estricto de 72 horas",
      "C. Comer únicamente ensaladas de lechuga",
      "D. Ingerir solo batidos de proteína pura"
    ],
    "correcta": 0,
    "explicacion": "Los depósitos llenos de glucógeno son el combustible esencial para sostener 3 o 4 partidos de alta intensidad en un fin de semana."
  },
  {
    "id": 477,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Respiración Diafragmática entre Puntos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué técnica respiratoria permite bajar pulsaciones cardíacas en los 15 segundos entre rallies?",
    "opciones": [
      "A. Hiperventilar muy rápido por la boca",
      "B. Inhalar profundo por la nariz expandiendo el abdomen y exhalar lentamente por la boca (activando el sistema parasimpático)",
      "C. Contener la respiración durante 30 segundos",
      "D. Gritar con fuerza hacia las paredes"
    ],
    "correcta": 1,
    "explicacion": "La respiración diafragmática profunda estimula el nervio vago, reduciendo la frecuencia cardíaca y la ansiedad en segundos."
  },
  {
    "id": 478,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Manguito Rotador en el Hombro",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué los ejercicios con bandas elásticas para el manguito rotador son obligatorios en squash?",
    "opciones": [
      "A. Para agrandar el pecho",
      "B. Para romper las bandas",
      "C. Porque fortalecen los pequeños músculos estabilizadores de la cabeza humeral, evitando pinzamientos en las voleas repetitivas",
      "D. Para ganar peso corporal"
    ],
    "correcta": 2,
    "explicacion": "El supraespinoso e infraespinoso centran la cabeza del húmero en la cavidad glenoidea durante los latigazos del swing."
  },
  {
    "id": 479,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Reposición de Sodio en Partidos Largos",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué en partidos de más de 60 minutos en squash es crucial reponer sodio y no solo beber agua sola?",
    "opciones": [
      "A. Para darle sabor salado a la boca",
      "B. Para subir de peso durante el juego",
      "C. Porque el sodio enfría el cuerpo",
      "D. Para evitar la hiponatremia (baja concentración de sodio en sangre) y prevenir calambres musculares severos"
    ],
    "correcta": 3,
    "explicacion": "Beber litros de agua sola sin electrolitos diluye el sodio plasmático, provocando náuseas, desorientación y calambres agudos."
  },
  {
    "id": 480,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Test de Course Navette (Beep Test) para Squash",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué el Beep Test o Test de Luc Léger es un test clásico de evaluación en academias de squash?",
    "opciones": [
      "A. Porque evalúa la resistencia cardiorrespiratoria en aceleraciones y desaceleraciones de 20 metros con cambios de sentido",
      "B. Porque mide la fuerza de los brazos",
      "C. Porque se juega con raqueta",
      "D. Porque es un test de natación"
    ],
    "correcta": 0,
    "explicacion": "Las frenadas y giros continuos del Beep Test reproducen fielmente las demandas fisiológicas de las idas y vueltas a la T."
  },
  {
    "id": 481,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Masa Muscular Óptima",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un exceso de hipertrofia muscular culturista es contraproducente para un jugador de squash?",
    "opciones": [
      "A. Porque las puertas de la cancha no lo dejan pasar",
      "B. Porque el tejido muscular excesivo añade peso muerto, aumenta el consumo de oxígeno y reduce la flexibilidad articular",
      "C. Porque la raqueta se quiebra",
      "D. Porque está prohibido por reglamento"
    ],
    "correcta": 1,
    "explicacion": "El atleta de squash busca una masa muscular magra, densa y funcional; los kilos extra de volumen lastran la agilidad y elevan el costo cardíaco."
  },
  {
    "id": 482,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Frecuencia de Entrenamientos Semanales",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Cómo distribuye un profesional de la PSA sus sesiones semanales en pretemporada?",
    "opciones": [
      "A. Entrena solo 1 hora a la semana los domingos",
      "B. Juega 24 horas continuas sin dormir",
      "C. Doble jornada diaria alternando cancha (técnica/ghosting) con gimnasio (fuerza/potencia) y trabajo aeróbico interválico",
      "D. Solo juega torneos sin entrenar"
    ],
    "correcta": 2,
    "explicacion": "El profesionalismo moderno exige entre 20 y 30 horas semanales de preparación multidisciplinaria integral."
  },
  {
    "id": 483,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Movilidad de Tobillo (Dorsiflexión)",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué consecuencia biomecánica tiene una escasa dorsiflexión de tobillo en el lunge de squash?",
    "opciones": [
      "A. Hace que el pie crezca un número más",
      "B. No tiene ningún efecto",
      "C. Mejora el remate",
      "D. Fuerza a compensar levantando el talón prematuramente y sobrecargando la articulación de la rodilla con fuerzas de cizalla"
    ],
    "correcta": 3,
    "explicacion": "Un tobillo con rango de dorsiflexión amplio permite que la tibia avance sin despegar el talón, estabilizando la estocada."
  },
  {
    "id": 484,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Papel del Entrenador Personal y Fisioterapeuta",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué rol cumple el fisioterapeuta en el equipo interdisciplinario de un squashista de élite?",
    "opciones": [
      "A. Descargar contracturas, evaluar asimetrías musculares y prescribir ejercicios correctivos para blindar al atleta de lesiones",
      "B. Llevarle las maletas únicamente",
      "C. Comprarle la raqueta",
      "D. Decidir las faltas del partido"
    ],
    "correcta": 0,
    "explicacion": "El fisioterapeuta es el garante de la longevidad del atleta en un deporte de altísimo impacto y desgaste articular."
  },
  {
    "id": 485,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Glucógeno Hepático en la Toma de Decisiones",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué la caída del glucógeno hepático afecta la precisión mental y la selección de tiro en el 5º game?",
    "opciones": [
      "A. Porque el cerebro se enfría",
      "B. Porque el cerebro depende de la glucosa sanguínea para procesar información y coordinar movimientos finos de muñeca",
      "C. Porque los ojos se cierran solos",
      "D. No tiene relación con el cerebro"
    ],
    "correcta": 1,
    "explicacion": "La hipoglucemia por agotamiento de reservas nubla la corteza prefrontal, provocando decisiones tácticas suicidas al final del partido."
  },
  {
    "id": 486,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Creatina Monohidrato en Squash",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué beneficio ergogénico aporta la creatina monohidrato en entrenamientos de squash?",
    "opciones": [
      "A. Aumenta la estatura del jugador",
      "B. Cambia el color de la pelota",
      "C. Acelera la resíntesis de fosfocreatina (ATP-PC), mejorando la potencia en sprints repetidos de máxima aceleración",
      "D. Es una droga ilegal"
    ],
    "correcta": 2,
    "explicacion": "La creatina optimiza la vía de los fosfágenos, permitiendo arranques más explosivos punto tras punto sin caída de vatios."
  },
  {
    "id": 487,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Calzado Adaptado al Tipo de Pisada",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Por qué un estudio de la pisada (pronador/supinador/neutro) es aconsejable antes de elegir calzado de squash?",
    "opciones": [
      "A. Para comprar zapatillas más baratas",
      "B. Porque lo exige el árbitro en la planilla",
      "C. Por razones puramente estéticas",
      "D. Para corregir desalineaciones biomecánicas con plantillas personalizadas y evitar tendinitis rotuliana y periostitis tibial"
    ],
    "correcta": 3,
    "explicacion": "Una pronación descontrolada bajo las intensas cargas del squash desalinea la rodilla y la cadera en cada frenada."
  },
  {
    "id": 488,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Asimetría Muscular Típica del Squashista",
    "nivel": 3,
    "dificultad": "Avanzado",
    "pregunta": "¿Qué desequilibrio muscular clásico suelen desarrollar los jugadores si no hacen entrenamiento compensatorio?",
    "opciones": [
      "A. Mayor desarrollo de masa muscular y fuerza en el brazo y pierna dominante respecto al lado no dominante",
      "B. Tener un ojo más grande que el otro",
      "C. Tener una oreja sorda",
      "D. No existe ninguna asimetría"
    ],
    "correcta": 0,
    "explicacion": "Al ser un deporte unilateral, el trabajo de fuerza unilateral compensatorio en gimnasio es obligatorio para evitar escoliosis o dolores de espalda."
  },
  {
    "id": 489,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "Trabajo en Zonas de Frecuencia Cardíaca",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué beneficio tiene el entrenamiento en Zona 2 (aeróbica suave, 65-75% FCmáx) para un deporte de alta intensidad como el squash?",
    "opciones": [
      "A. Cansa innecesariamente al jugador",
      "B. Aumenta la densidad mitocondrial y la capilarización muscular, acelerando la recuperación entre puntos duros en la cancha",
      "C. Hace que la raqueta vibre menos",
      "D. Solo sirve para dormir"
    ],
    "correcta": 1,
    "explicacion": "Una base aeróbica mitocondrial sólida permite resintetizar fosfocreatina y reciclar lactato en los breves 15 segundos entre rallies."
  },
  {
    "id": 490,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Flexibilidad y Salud Lumbar",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué rutina de estiramientos es obligatoria al terminar una sesión de squash?",
    "opciones": [
      "A. Sentarse 3 horas en un sillón sin moverse",
      "B. Comer pizza con gaseosa fría",
      "C. Estiramientos de isquiotibiales, glúteos, psoas ilíaco, aductores, gemelos y rotadores de columna",
      "D. No estirar jamás"
    ],
    "correcta": 2,
    "explicacion": "Devolver la longitud de reposo a los grupos musculares sobrecargados previene contracturas y mantiene la salud articular."
  },
  {
    "id": 491,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Concentración y Ondas Cerebrales",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué estado neurocognitivo de 'Flujo' (Flow State) experimentan los atletas en su mejor versión?",
    "opciones": [
      "A. Un estado de sueño profundo",
      "B. Un ataque de risa descontrolado",
      "C. Un estado de amnesia total",
      "D. Un estado de concentración inmersiva total donde las decisiones tácticas y reacciones parecen ocurrir en cámara lenta sin esfuerzo consciente"
    ],
    "correcta": 3,
    "explicacion": "El estado de flujo une mente y cuerpo: el jugador 'siente' la pelota y el espacio con claridad absoluta y calma interna."
  },
  {
    "id": 492,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Rol del Entrenamiento Visual",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo entrenan los jugadores de élite la visión periférica y la velocidad de seguimiento ocular (Tracking)?",
    "opciones": [
      "A. Con ejercicios de luces de reacción (Fitlight/Blazepod) y seguimiento de objetos de alta velocidad en campo visual abierto",
      "B. Leyendo libros con letra minúscula a oscuras",
      "C. Mirando televisión fija durante horas",
      "D. Con lentes de aumento de microscopio"
    ],
    "correcta": 0,
    "explicacion": "Fijar y rastrear un objeto negro de 40 mm a más de 200 km/h en un espacio cerrado requiere reflejos oculares sobrehumanos."
  },
  {
    "id": 493,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Autoconservación en Partidos de 5 Games",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cómo dosifica un veterano inteligente su energía en un quinto game extenuante?",
    "opciones": [
      "A. Corriendo a lo loco en todas las pelotas sin pensar",
      "B. Eligiendo cuidadosamente cuándo disputar un rally a muerte y cuándo ceder un punto perdido para no vaciar el tanque",
      "C. Pidiendo que suspendan el partido para mañana",
      "D. Tirando la toalla al piso"
    ],
    "correcta": 1,
    "explicacion": "La madurez atlética consiste en la gestión táctica del agotamiento: saber dónde invertir cada joule de energía restante."
  },
  {
    "id": 494,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Crioterapia de Cuerpo Entero",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿En qué consiste la crioterapia en cabina de nitrógeno líquido (-110°C a -140°C)?",
    "opciones": [
      "A. Una forma de congelar comida en la cocina",
      "B. Un método para enfriar raquetas de squash",
      "C. Sesiones de 2 a 3 minutos a temperaturas bajo cero que provocan una vasoconstricción periférica masiva y liberación de endorfinas antiinflamatorias",
      "D. Un castigo para los árbitros"
    ],
    "correcta": 2,
    "explicacion": "Atletas de élite recurren a cabinas criogénicas para reducir la inflamación sistémica tras torneos de máxima exigencia."
  },
  {
    "id": 495,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Récord de Longevidad en el Squash",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué el squash puede practicarse competitivamente hasta edades avanzadas (categorías Master +60, +70, +80)?",
    "opciones": [
      "A. Porque los mayores juegan sentados",
      "B. Porque la pelota no bota en torneos senior",
      "C. Porque está prohibido correr",
      "D. Porque es un deporte que premia la colocación geométrica, la anticipación y la astucia sobre la fuerza bruta juvenil"
    ],
    "correcta": 3,
    "explicacion": "En categorías Masters, la lectura de juego y la precisión de muñeca permiten a jugadores de 70 años dictar cátedra a los jóvenes."
  },
  {
    "id": 496,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Balance Hídrico: Pesar Antes y Después",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué los atletas se pesan en la báscula antes y después de entrenar en la cancha?",
    "opciones": [
      "A. Para calcular exactamente cuántos litros de sudor perdieron y reponer el 150% del peso perdido en líquido con sales",
      "B. Para ver si ganaron masa muscular durante el partido",
      "C. Por vanidad de vestuario",
      "D. Porque lo exige el árbitro"
    ],
    "correcta": 0,
    "explicacion": "Cada kilo perdido en la cancha equivale a 1 litro de sudor; reponer 1.5 litros por cada kilo perdido garantiza la rehidratación completa."
  },
  {
    "id": 497,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Resiliencia Mental del Squashista",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué cualidad psicológica distingue a los campeones mundiales de squash de los buenos jugadores?",
    "opciones": [
      "A. El dinero en la cuenta bancaria",
      "B. La resiliencia estoica para tolerar el dolor muscular extremo, el ahogo respiratorio y la presión en los momentos cumbres",
      "C. Tener más seguidores en redes",
      "D. La suerte en el sorteo del cuadro"
    ],
    "correcta": 1,
    "explicacion": "En la caldera de cristal, cuando las piernas arden y los pulmones queman, la fortaleza mental decide quién levanta el trofeo."
  },
  {
    "id": 498,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Beneficio Cardiovascular de por Vida",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Qué demostró el prestigioso estudio de la Universidad de Oxford sobre deportes de raqueta y longevidad?",
    "opciones": [
      "A. Que no tienen ningún beneficio para la salud",
      "B. Que envejecen prematuramente el cuerpo",
      "C. Que los deportes de raqueta (liderados por el squash) reducen el riesgo de muerte por enfermedad cardiovascular en un asombroso 56%",
      "D. Que solo benefician a los niños"
    ],
    "correcta": 2,
    "explicacion": "El estudio de Oxford con más de 80.000 adultos concluyó que los deportes de raqueta son los que más prolongan la vida humana activa."
  },
  {
    "id": 499,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "El Espíritu del Juego Limpio (Fair Play)",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Cuál es el valor ético supremo que rige la convivencia de dos rivales en el espacio cerrado de la cancha?",
    "opciones": [
      "A. Ganar como sea sin importar lastimar al rival",
      "B. Engañar al árbitro cada vez que no mire",
      "C. Empujar con fuerza para quitar espacio",
      "D. El respeto absoluto por la integridad física del oponente, cediendo el tiro ante la duda y jugando con caballerosidad"
    ],
    "correcta": 3,
    "explicacion": "Compartir un espacio de 60 m² con raquetas a más de 200 km/h exige la máxima nobleza deportiva y respeto mutuo."
  },
  {
    "id": 500,
    "area": "Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición",
    "subtema": "La Filosofía del Deporte Más Noble",
    "nivel": 4,
    "dificultad": "Experto",
    "pregunta": "¿Por qué el profesor Manuel Alejandro Obando enseña la ciencia y física del squash a sus estudiantes?",
    "opciones": [
      "A. Porque en el squash la física se experimenta en carne propia: termodinámica, balística, cadenas cinéticas y disciplina de vida",
      "B. Para que no estudien matemáticas",
      "C. Porque no hay otros deportes en el mundo",
      "D. Para vender raquetas de segunda mano"
    ],
    "correcta": 0,
    "explicacion": "El squash es un laboratorio vivo donde las leyes de Newton, la termodinámica del caucho y el honor humano se funden en cada latido."
  }
];

console.log('✓ Banco de Gran Trivia de Squash cargado: ' + window.TRIVIA_SQUASH_QUESTIONS.length + ' preguntas.');
