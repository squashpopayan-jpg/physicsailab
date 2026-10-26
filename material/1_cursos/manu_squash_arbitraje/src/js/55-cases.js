/* Catálogo de las 18 Situaciones Oficiales de Arbitraje WSF Simuladas en Cancha 3D y Planta */
MS.Cases = [
  {
    id: 'acc_bloqueo_T',
    num: 1,
    cat: 'Acceso a la bola',
    titulo: 'Bloqueo estático en la T sin despejar',
    desc: 'A ejecuta una cruzada que pasa demasiado cerca del centro y se queda estático en la T mirando su golpe; B sale desde el fondo derecho por su línea directa y choca con A en la T.',
    tFreeze: 2.4,
    decision: 'STROKE',
    regla: 'Regla 8.6.6',
    explicacion: 'A jugó un tiro flojo hacia el medio y no hizo ningún esfuerzo por despejar (no effort to clear) la línea directa de B, quien llegaba cómodamente a la bola.',
    pilares: {
      interf: 'Sí: Choque físico frontal evidente sobre la línea directa de carrera.',
      retorno: 'Sí: B tenía tiempo, equilibrio y aceleración óptima para conectar la bola.',
      creado: 'No: B se dirigió estrictamente en línea recta desde el fondo derecho hacia la bola.',
      despeje: 'Incumplido: A se quedó pasivo contemplando su tiro en el punto neurálgico (T) sin dar un solo paso de despeje.'
    },
    ball: [
      { t: 0.0, x: 1.0, y: 7.8, z: 0.6, arch: 1.2 },
      { t: 1.1, x: 3.2, y: 0.05, z: 1.8, arch: 0.0 }, // Rebote frontis
      { t: 2.4, x: 4.8, y: 4.5, z: 0.55, arch: 0.6 },
      { t: 3.2, x: 5.6, y: 7.2, z: 0.1, arch: 0.3 }
    ],
    pA: [
      { t: 0.0, x: 1.2, y: 7.5, ang: 0.2 },
      { t: 1.2, x: 3.2, y: 5.2, ang: 0.1 },
      { t: 2.4, x: 3.2, y: 5.0, ang: 0.0 }, // Se queda en la T
      { t: 3.5, x: 3.2, y: 5.0, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 5.4, y: 8.0, ang: -0.4 },
      { t: 1.2, x: 4.5, y: 6.8, ang: -0.6 },
      { t: 2.4, x: 3.4, y: 5.2, ang: -0.7 }, // Choca con A
      { t: 3.5, x: 3.4, y: 5.2, ang: -0.7 }
    ],
    striker: 'B'
  },
  {
    id: 'acc_esfuerzo_let',
    num: 2,
    cat: 'Acceso a la bola',
    titulo: 'Interferencia accidental con esfuerzo de despeje',
    desc: 'A juega un drop de revés en la esquina delantera izquierda e intenta salir rápido hacia el centro-atrás, pero B anticipa desde la T y sus trayectorias se cruzan inevitablemente a mitad de camino.',
    tFreeze: 2.8,
    decision: 'YES LET',
    regla: 'Regla 8.6.5',
    explicacion: 'Existió interferencia en el acceso y B tenía capacidad de llegar y hacer un buen retorno, pero A hizo todo el esfuerzo físico por salir de la zona de juego.',
    pilares: {
      interf: 'Sí: Cruce involuntario de trayectorias con fricción corporal.',
      retorno: 'Sí: B anticipó con agilidad y la bola aún tenía bote alto.',
      creado: 'No: B buscó la ruta más corta hacia el drop.',
      despeje: 'Cumplido: A inició la carrera de salida inmediatamente tras impactar.'
    },
    ball: [
      { t: 0.0, x: 0.8, y: 3.2, z: 0.7, arch: 0.8 },
      { t: 1.2, x: 0.9, y: 0.05, z: 0.6, arch: 0.0 },
      { t: 2.8, x: 1.2, y: 1.8, z: 0.35, arch: 0.4 }
    ],
    pA: [
      { t: 0.0, x: 0.8, y: 2.5, ang: 0.0 },
      { t: 1.4, x: 1.1, y: 1.8, ang: 0.0 },
      { t: 2.8, x: 2.2, y: 3.4, ang: 2.8 } // Sale hacia atrás
    ],
    pB: [
      { t: 0.0, x: 3.2, y: 5.2, ang: 0.0 },
      { t: 1.4, x: 2.8, y: 4.2, ang: -0.5 },
      { t: 2.8, x: 1.9, y: 2.8, ang: -0.6 } // Cruce con A
    ],
    striker: 'B'
  },
  {
    id: 'acc_fuera_alcance',
    num: 3,
    cat: 'Acceso a la bola',
    titulo: 'Bola inalcanzable (fuera de alcance del apelante)',
    desc: 'A conecta un kill/drop cruzado ganador a 10 cm por encima del tin que muere en la esquina delantera derecha; B estaba retrasado en el fondo izquierdo a 6,2 m, roza el hombro de A al pasar por la T y pide Let.',
    tFreeze: 2.6,
    decision: 'NO LET',
    regla: 'Regla 8.6.1',
    explicacion: 'Aunque hubo un leve contacto en la T, la simulación física muestra que el segundo bote ocurre cuando B aún está a más de 2,8 m de la bola. El apelante no habría llegado a realizar un buen retorno.',
    pilares: {
      interf: 'Mínima o irrelevante en la T.',
      retorno: 'No: La bola muere en dos botes inalcanzables mucho antes de que B pueda llegar.',
      creado: 'Irrelevante.',
      despeje: 'No aplicable ante la imposibilidad técnica de alcanzar la bola.'
    },
    ball: [
      { t: 0.0, x: 1.2, y: 5.0, z: 0.8, arch: 0.5 },
      { t: 1.1, x: 3.8, y: 0.05, z: 0.55, arch: 0.0 },
      { t: 2.6, x: 5.8, y: 1.4, z: 0.05, arch: 0.1 } // Segundo bote
    ],
    pA: [
      { t: 0.0, x: 1.8, y: 4.8, ang: 0.3 },
      { t: 1.5, x: 2.9, y: 4.9, ang: 0.0 },
      { t: 2.6, x: 3.1, y: 5.0, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 1.2, y: 8.5, ang: 0.1 },
      { t: 1.5, x: 2.2, y: 6.8, ang: 0.2 },
      { t: 2.6, x: 3.2, y: 5.2, ang: 0.3 } // Apenas en la T
    ],
    striker: 'B'
  },
  {
    id: 'acc_crea_contacto',
    num: 4,
    cat: 'Acceso a la bola',
    titulo: 'Interferencia creada / buscar el choque a propósito',
    desc: 'A juega un drive paralelo profundo a la izquierda y sale hacia el lado derecho de la T dejando libre el carril izquierdo; B, en lugar de ir directo a la bola, curva su carrera hacia la derecha para chocar con A.',
    tFreeze: 3.1,
    decision: 'NO LET',
    regla: 'Regla 8.6.4',
    explicacion: 'El apelante tenía acceso directo despejado hacia la bola pero desvió su trayectoria para fabricar la interferencia (created interference).',
    pilares: {
      interf: 'Autogenerada por el propio apelante.',
      retorno: 'Sí tenía capacidad física, pero prefirió buscar la falta.',
      creado: 'Sí: Curvó voluntariamente su trayectoria hacia el cuerpo de A.',
      despeje: 'Cumplido: A dejó libre un pasillo de más de 1.8 m en el carril izquierdo.'
    },
    ball: [
      { t: 0.0, x: 1.0, y: 3.0, z: 0.7, arch: 1.0 },
      { t: 1.2, x: 1.1, y: 0.05, z: 2.1, arch: 0.0 },
      { t: 3.1, x: 0.8, y: 8.0, z: 0.45, arch: 0.5 }
    ],
    pA: [
      { t: 0.0, x: 1.2, y: 3.2, ang: 0.0 },
      { t: 1.8, x: 3.8, y: 5.5, ang: 0.2 },
      { t: 3.1, x: 4.2, y: 5.6, ang: 0.0 } // Se retira a la derecha
    ],
    pB: [
      { t: 0.0, x: 2.5, y: 5.0, ang: 0.0 },
      { t: 1.8, x: 2.6, y: 5.8, ang: 0.4 },
      { t: 3.1, x: 3.8, y: 5.6, ang: 0.8 } // Se desvía hacia A
    ],
    striker: 'B'
  },
  {
    id: 'acc_acepta_interf',
    num: 5,
    cat: 'Acceso a la bola',
    titulo: 'Aceptación de interferencia (jugar y apelar tras fallar)',
    desc: 'B sufre un pequeño estorbo de A saliendo de la T, decide no detenerse, llega a la esquina delantera con tiempo, arma su golpe y estrella la bola en el tin; inmediatamente levanta la mano pidiendo Let por el roce anterior.',
    tFreeze: 3.5,
    decision: 'NO LET',
    regla: 'Regla 8.6.2',
    explicacion: 'Al continuar jugando más allá de la interferencia y ejecutar su golpe sin impedimento en el swing, B aceptó las condiciones y no tiene derecho a una segunda oportunidad tras errar.',
    pilares: {
      interf: 'Existió inicialmente pero fue superada por decisión del jugador.',
      retorno: 'Ejecutó el golpe de manera libre y voluntaria.',
      creado: 'No.',
      despeje: 'Irrelevante al haberse aceptado la continuidad del peloteo.'
    },
    ball: [
      { t: 0.0, x: 3.2, y: 7.0, z: 0.8, arch: 0.8 },
      { t: 1.5, x: 1.5, y: 0.05, z: 0.8, arch: 0.0 },
      { t: 3.5, x: 1.2, y: 0.02, z: 0.35, arch: 0.0 } // Al tin
    ],
    pA: [
      { t: 0.0, x: 2.5, y: 6.0, ang: 0.0 },
      { t: 1.6, x: 3.0, y: 5.2, ang: 0.0 },
      { t: 3.5, x: 3.4, y: 5.6, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 3.5, y: 6.5, ang: 0.0 },
      { t: 1.6, x: 3.1, y: 5.1, ang: 0.0 }, // Roce en T
      { t: 3.5, x: 1.4, y: 1.2, ang: -0.2 } // Llega al frente y golpea al tin
    ],
    striker: 'B'
  },
  {
    id: 'sw_bloqueado',
    num: 6,
    cat: 'Swing de raqueta',
    titulo: 'Invasión del radio de swing razonable (1.12 m)',
    desc: 'El globo de A queda corto a media cancha y A retrocede demasiado cerca de la bola (a 0,65 m de B). B llega perfilado con la raqueta arriba (radar prendido) y detiene su swing porque el cuerpo de A invade su radio de 1,12 m.',
    tFreeze: 2.9,
    decision: 'STROKE',
    regla: 'Regla 8.9.2',
    explicacion: 'El no-golpeador invadió el cilindro de swing razonable de B e impidió (prevented) la preparación o el impacto con acceso directo al frontón.',
    pilares: {
      interf: 'Grave: Obstáculo físico directo en el backswing e impacto.',
      retorno: 'Excelente: Bola franca a media altura.',
      creado: 'No: B armó una mecánica de golpe estándar.',
      despeje: 'Incumplido: A retrocedió hacia la zona de golpe del rival.'
    },
    ball: [
      { t: 0.0, x: 3.0, y: 2.0, z: 0.5, arch: 1.5 },
      { t: 1.2, x: 3.2, y: 0.05, z: 3.2, arch: 0.0 },
      { t: 2.9, x: 3.3, y: 5.2, z: 1.15, arch: 0.3 }
    ],
    pA: [
      { t: 0.0, x: 2.5, y: 2.5, ang: 0.0 },
      { t: 1.5, x: 3.1, y: 4.4, ang: 0.0 },
      { t: 2.9, x: 3.4, y: 4.8, ang: 0.0 } // Muy pegado a B
    ],
    pB: [
      { t: 0.0, x: 4.0, y: 7.0, ang: 0.0 },
      { t: 1.5, x: 3.5, y: 6.0, ang: 0.0 },
      { t: 2.9, x: 3.3, y: 5.4, ang: 0.0 } // Distancia 0.6 m
    ],
    striker: 'B'
  },
  {
    id: 'sw_exagerado',
    num: 7,
    cat: 'Swing de raqueta',
    titulo: 'Swing excesivo o exagerado para provocar contacto',
    desc: 'A despeja correctamente a 1,35 m de distancia tras su golpe en el fondo; B llega forzado y estira el brazo hacia atrás de forma antinatural y exagerada hasta tocar el hombro de A para pedir Stroke.',
    tFreeze: 3.2,
    decision: 'NO LET',
    regla: 'Regla 8.9.3',
    explicacion: 'El jugador solo tiene derecho a un swing razonable. Extender la raqueta de forma exagerada fuera de la técnica normal para fabricar contacto se sanciona con No Let.',
    pilares: {
      interf: 'Inexistente en un swing reglamentario.',
      retorno: 'B tenía opción de golpear con técnica estándar.',
      creado: 'Sí: Movimiento de raqueta deformado deliberadamente.',
      despeje: 'Cumplido: A estaba a más de 1.3 m de separación.'
    },
    ball: [
      { t: 0.0, x: 5.0, y: 8.5, z: 0.4, arch: 0.8 },
      { t: 1.5, x: 4.8, y: 0.05, z: 1.6, arch: 0.0 },
      { t: 3.2, x: 5.2, y: 7.8, z: 0.65, arch: 0.4 }
    ],
    pA: [
      { t: 0.0, x: 5.2, y: 8.0, ang: 0.0 },
      { t: 1.6, x: 3.8, y: 6.5, ang: 0.0 },
      { t: 3.2, x: 3.8, y: 6.4, ang: 0.0 } // A 1.4 m
    ],
    pB: [
      { t: 0.0, x: 4.2, y: 6.0, ang: 0.0 },
      { t: 1.6, x: 4.8, y: 7.2, ang: 0.0 },
      { t: 3.2, x: 5.1, y: 7.6, ang: -1.2 } // Estira brazo antinatural
    ],
    striker: 'B'
  },
  {
    id: 'fw_cono_frontal',
    num: 8,
    cat: 'Pared frontal',
    titulo: 'Oponente atrapado en el Cono de la Pared Frontal',
    desc: 'A ejecuta un boast desde el fondo que sale suelto al centro-frente de la cancha; al intentar recuperar la T, A queda atrapado exactamente entre la bola y la pared frontal. B llega con la raqueta armada y retiene el golpe.',
    tFreeze: 2.7,
    decision: 'STROKE',
    regla: 'Regla 8.11.1',
    explicacion: 'El Cono de Acceso a la Pared Frontal muestra que A obstruye el triángulo directo hacia el frontón. Detener el golpe por seguridad del oponente otorga Stroke automático a B.',
    pilares: {
      interf: 'Total: Bloqueo de la pared frontal completa.',
      retorno: 'Óptimo: B estaba perfilado para tiro ganador.',
      creado: 'No.',
      despeje: 'Incumplido: Atrapado en línea directa de disparo.'
    },
    ball: [
      { t: 0.0, x: 0.5, y: 8.0, z: 0.6, arch: 1.2 },
      { t: 0.8, x: 0.05, y: 4.2, z: 1.5, arch: 0.0 }, // Boast lateral
      { t: 1.5, x: 2.5, y: 0.05, z: 1.1, arch: 0.0 }, // Frontis
      { t: 2.7, x: 3.3, y: 3.8, z: 0.85, arch: 0.3 }
    ],
    pA: [
      { t: 0.0, x: 0.9, y: 7.6, ang: 0.0 },
      { t: 1.5, x: 2.0, y: 4.5, ang: 0.0 },
      { t: 2.7, x: 3.2, y: 2.4, ang: 0.0 } // Entre bola y frontón
    ],
    pB: [
      { t: 0.0, x: 4.2, y: 6.5, ang: 0.0 },
      { t: 1.5, x: 3.6, y: 5.0, ang: 0.0 },
      { t: 2.7, x: 3.2, y: 4.2, ang: 0.0 } // Con la bola al frente
    ],
    striker: 'B'
  },
  {
    id: 'fw_solo_boast',
    num: 9,
    cat: 'Pared frontal',
    titulo: 'Imposibilidad de tiro directo (solo podía jugar boast)',
    desc: 'B llega un instante tarde y con la bola ya detrás de su cadera en el fondo izquierdo; A está ubicado hacia el centro-derecha. B pide Let alegando que A le tapaba la cruzada, pero por su postura física B solo podía jugar un boast.',
    tFreeze: 3.3,
    decision: 'YES LET',
    regla: 'Regla 8.11.2',
    explicacion: 'Como el apelante estaba tan superado por la bola que no podía golpearla directamente a la pared frontal sino únicamente vía pared lateral (boast), corresponde Yes Let y no Stroke.',
    pilares: {
      interf: 'Parcial sobre la opción cruzada.',
      retorno: 'Solo mediante boast defensivo de pared.',
      creado: 'No.',
      despeje: 'A despejó hacia la derecha razonablemente.'
    },
    ball: [
      { t: 0.0, x: 2.0, y: 3.0, z: 0.7, arch: 0.9 },
      { t: 1.2, x: 1.2, y: 0.05, z: 1.9, arch: 0.0 },
      { t: 3.3, x: 0.5, y: 9.1, z: 0.35, arch: 0.3 } // Bola muy pegada atrás
    ],
    pA: [
      { t: 0.0, x: 2.4, y: 3.8, ang: 0.0 },
      { t: 1.8, x: 3.4, y: 5.6, ang: 0.0 },
      { t: 3.3, x: 3.6, y: 6.2, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 3.0, y: 5.5, ang: 0.0 },
      { t: 1.8, x: 1.8, y: 7.2, ang: 0.0 },
      { t: 3.3, x: 0.9, y: 8.9, ang: -0.3 } // Forzado en esquina
    ],
    striker: 'B'
  },
  {
    id: 'turn_necesario',
    num: 10,
    cat: 'Giro (Turning)',
    titulo: 'Turning inevitable por trayectoria en esquina trasera',
    desc: 'A conecta un drive fuerte que entra por la derecha de B, rebota en la lateral derecha y en el vidrio trasero y sale por la izquierda de B. B gira con la bola para mantenerla jugable, ve a A en la T y se detiene pidiendo Let.',
    tFreeze: 3.6,
    decision: 'YES LET',
    regla: 'Regla 8.13.1',
    explicacion: 'Hubo Turning porque la bola pasó de un lado al otro del cuerpo de B tras tocar el vidrio. Aunque A esté en el cono frontal, como B giró y A no se movió deliberadamente para bloquear, la regla limita la decisión a Yes Let.',
    pilares: {
      interf: 'Peligro tras girar alrededor de la bola.',
      retorno: 'Posible pero condicionado por seguridad.',
      creado: 'El giro fue impuesto por el rebote de la bola.',
      despeje: 'A no tuvo tiempo de anticipar hacia dónde saldría el giro.'
    },
    ball: [
      { t: 0.0, x: 4.8, y: 3.0, z: 0.8, arch: 1.0 },
      { t: 1.2, x: 5.2, y: 0.05, z: 2.0, arch: 0.0 },
      { t: 2.4, x: 6.35, y: 7.5, z: 1.2, arch: 0.0 }, // Rebote lateral
      { t: 3.0, x: 5.2, y: 9.7, z: 0.8, arch: 0.0 }, // Vidrio trasero
      { t: 3.6, x: 4.1, y: 8.5, z: 0.45, arch: 0.2 }
    ],
    pA: [
      { t: 0.0, x: 4.0, y: 4.0, ang: 0.0 },
      { t: 1.8, x: 3.2, y: 5.2, ang: 0.0 },
      { t: 3.6, x: 3.2, y: 5.1, ang: 0.0 } // En la T
    ],
    pB: [
      { t: 0.0, x: 3.8, y: 6.2, ang: 0.0 },
      { t: 1.8, x: 4.8, y: 7.8, ang: 0.0 },
      { t: 3.6, x: 4.3, y: 8.2, ang: 3.14 } // Giró con la bola
    ],
    striker: 'B'
  },
  {
    id: 'turn_innecesario',
    num: 11,
    cat: 'Giro (Turning)',
    titulo: 'Giro innecesario / pérdida de visión deliberada',
    desc: 'Un saque globo de A viene franco al revés de B para ser voleado o golpeado de revés, pero B decide dejar pasar la bola por delante de su pecho, gira 360° sobre su eje y pide Let porque perdió de vista la bola.',
    tFreeze: 2.5,
    decision: 'NO LET',
    regla: 'Regla 8.13.3',
    explicacion: 'El jugador giró por elección propia sin que la trayectoria de la bola lo obligara (turned when there was no need to do so). No se premia el riesgo creado por el propio receptor.',
    pilares: {
      interf: 'Generada enteramente por la maniobra de B.',
      retorno: 'Tenía opción limpia sin girar.',
      creado: 'Sí: Decisión táctica riesgosa e innecesaria.',
      despeje: 'A permaneció en su ubicación reglamentaria de saque.'
    },
    ball: [
      { t: 0.0, x: 1.2, y: 6.0, z: 1.6, arch: 1.5 },
      { t: 1.2, x: 3.2, y: 0.05, z: 2.6, arch: 0.0 },
      { t: 2.5, x: 2.0, y: 6.8, z: 1.4, arch: 0.4 }
    ],
    pA: [
      { t: 0.0, x: 1.2, y: 6.2, ang: 0.0 },
      { t: 1.2, x: 2.2, y: 5.6, ang: 0.0 },
      { t: 2.5, x: 2.4, y: 5.5, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 2.2, y: 7.5, ang: 0.0 },
      { t: 1.5, x: 2.0, y: 7.0, ang: 1.8 },
      { t: 2.5, x: 2.1, y: 7.0, ang: 6.28 } // Giro completo
    ],
    striker: 'B'
  },
  {
    id: 'seg_intento',
    num: 12,
    cat: '2.º Intento (8.12)',
    titulo: 'Interferencia en segundo intento de golpeo',
    desc: 'B intenta volear en la T, calcula mal el bote, deja pasar la bola hacia el fondo y cuando corre hacia atrás a buscar su segundo intento choca con A, quien salía normalmente de su golpe anterior.',
    tFreeze: 3.0,
    decision: 'YES LET',
    regla: 'Regla 8.12',
    explicacion: 'Cuando un jugador deja pasar una primera oportunidad clara y hace un intento posterior encontrando al rival que despejaba del primer golpe, se concede como máximo Yes Let (nunca Stroke salvo bloqueo deliberado).',
    pilares: {
      interf: 'Real en el segundo intento.',
      retorno: 'Posible pero de menor calidad.',
      creado: 'No deliberado.',
      despeje: 'A despejó acorde al primer intento de B.'
    },
    ball: [
      { t: 0.0, x: 2.0, y: 2.0, z: 0.6, arch: 1.2 },
      { t: 1.0, x: 2.8, y: 0.05, z: 2.1, arch: 0.0 },
      { t: 2.0, x: 3.2, y: 4.8, z: 1.6, arch: 0.0 }, // Pasa de largo de B
      { t: 3.0, x: 3.5, y: 7.8, z: 0.8, arch: 0.3 }
    ],
    pA: [
      { t: 0.0, x: 2.2, y: 2.5, ang: 0.0 },
      { t: 1.6, x: 2.8, y: 5.4, ang: 0.0 },
      { t: 3.0, x: 3.2, y: 6.2, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 3.4, y: 5.0, ang: 0.0 },
      { t: 1.6, x: 3.3, y: 4.9, ang: 0.0 }, // Falla volea
      { t: 3.0, x: 3.3, y: 6.0, ang: -0.2 } // Retrocede y choca con A
    ],
    striker: 'B'
  },
  {
    id: 'hit_directo_fronton',
    num: 13,
    cat: 'Pelota golpea rival',
    titulo: 'Bola directa a frontón golpea al oponente',
    desc: 'B impacta una cruzada firme desde el fondo derecho que viaja en línea recta hacia la pared frontal e impacta en el muslo de A, quien cruzaba por el centro de la cancha.',
    tFreeze: 2.3,
    decision: 'STROKE',
    regla: 'Regla 9.1.1',
    explicacion: 'La bola iba directamente a la pared frontal sin haber tocado antes otra pared. Por lo tanto, se adjudica Stroke a B.',
    pilares: {
      interf: 'Impacto físico directo de la bola en el rival.',
      retorno: 'El tiro ya había salido válidamente de la raqueta de B.',
      creado: 'No.',
      despeje: 'A quedó cruzando la línea de tiro frontal.'
    },
    ball: [
      { t: 0.0, x: 5.2, y: 8.5, z: 0.4, arch: 0.8 },
      { t: 1.2, x: 5.4, y: 7.8, z: 0.7, arch: 0.0 }, // Impacto de B
      { t: 2.3, x: 3.2, y: 4.5, z: 0.85, arch: 0.1 } // Choca en A
    ],
    pA: [
      { t: 0.0, x: 4.8, y: 7.2, ang: 0.0 },
      { t: 1.2, x: 3.8, y: 5.6, ang: 0.0 },
      { t: 2.3, x: 3.2, y: 4.5, ang: 0.0 } // Es golpeado por la bola
    ],
    pB: [
      { t: 0.0, x: 5.4, y: 8.2, ang: 0.0 },
      { t: 1.2, x: 5.4, y: 7.8, ang: 0.0 },
      { t: 2.3, x: 5.3, y: 7.7, ang: 0.0 }
    ],
    striker: 'B'
  },
  {
    id: 'hit_boast_lateral',
    num: 14,
    cat: 'Pelota golpea rival',
    titulo: 'Bola de boast golpea al oponente',
    desc: 'Desde la esquina trasera izquierda, B golpea un boast apuntando a la pared lateral izquierda; antes de llegar a la pared lateral (o saliendo de ella hacia el frontón), la bola golpea en la espalda de A.',
    tFreeze: 2.4,
    decision: 'YES LET',
    regla: 'Regla 9.1.2',
    explicacion: 'La bola no iba directamente a la pared frontal, sino hacia o desde una pared lateral (boast). Salvo que fuera un tiro ganador evidente sin nadie cerca, la decisión oficial es Yes Let.',
    pilares: {
      interf: 'Impacto con bola en trayectoria indirecta.',
      retorno: 'El tiro estaba en juego.',
      creado: 'No.',
      despeje: 'A estaba intentando recuperar posición de T.'
    },
    ball: [
      { t: 0.0, x: 1.0, y: 8.2, z: 0.5, arch: 0.8 },
      { t: 1.4, x: 0.8, y: 7.5, z: 0.65, arch: 0.0 }, // Impacto boast B
      { t: 1.9, x: 0.05, y: 5.8, z: 1.2, arch: 0.0 }, // Toca lateral
      { t: 2.4, x: 2.2, y: 5.0, z: 0.9, arch: 0.1 } // Choca con A
    ],
    pA: [
      { t: 0.0, x: 1.4, y: 7.0, ang: 0.0 },
      { t: 1.4, x: 2.2, y: 5.8, ang: 0.0 },
      { t: 2.4, x: 2.2, y: 5.0, ang: 0.0 } // Es golpeado por la bola
    ],
    pB: [
      { t: 0.0, x: 1.0, y: 8.0, ang: 0.0 },
      { t: 1.4, x: 0.8, y: 7.6, ang: 0.0 },
      { t: 2.4, x: 0.9, y: 7.6, ang: 0.0 }
    ],
    striker: 'B'
  },
  {
    id: 'hit_tras_turning',
    num: 15,
    cat: 'Pelota golpea rival',
    titulo: 'Bola golpea al rival tras haber hecho Turning',
    desc: 'B deja que la bola de A pase por su derecha, gire en el vidrio trasero hacia su izquierda (Turning) y decide golpear la bola, impactando en el cuerpo de A que esperaba en la T.',
    tFreeze: 3.4,
    decision: 'NO LET',
    regla: 'Regla 9.2',
    explicacion: 'Si el golpeador ha girado (turned) y decide golpear la bola en vez de pedir Let, asume toda la responsabilidad: si la bola golpea al oponente, el punto (Stroke) es para el no-golpeador (A).',
    pilares: {
      interf: 'Peligro grave creado por golpear tras giro.',
      retorno: 'Irrelevante por infracción de seguridad.',
      creado: 'B asumió el riesgo de disparar a ciegas.',
      despeje: 'Punto para A (Stroke en contra del golpeador).'
    },
    ball: [
      { t: 0.0, x: 4.5, y: 3.0, z: 0.8, arch: 1.0 },
      { t: 1.2, x: 5.0, y: 0.05, z: 2.0, arch: 0.0 },
      { t: 2.2, x: 5.8, y: 9.7, z: 0.8, arch: 0.0 }, // Vidrio
      { t: 3.0, x: 4.2, y: 8.5, z: 0.5, arch: 0.0 }, // B golpea tras girar
      { t: 3.4, x: 3.2, y: 5.2, z: 0.9, arch: 0.0 } // Pega en A
    ],
    pA: [
      { t: 0.0, x: 4.0, y: 3.8, ang: 0.0 },
      { t: 1.8, x: 3.2, y: 5.2, ang: 0.0 },
      { t: 3.4, x: 3.2, y: 5.2, ang: 0.0 } // Esperaba en T
    ],
    pB: [
      { t: 0.0, x: 3.8, y: 6.2, ang: 0.0 },
      { t: 2.2, x: 4.8, y: 8.8, ang: 0.0 },
      { t: 3.4, x: 4.3, y: 8.4, ang: 3.14 } // B disparó tras Turning
    ],
    striker: 'B'
  },
  {
    id: 'saque_falta_pie',
    num: 16,
    cat: 'Saque y Líneas',
    titulo: 'Falta de pie en el saque (Foot Fault)',
    desc: 'A realiza el saque desde la caja derecha pisando con la punta del pie izquierdo sobre la línea roja de media cancha, aunque la bola entra buena en el cuarto trasero izquierdo. B apela el saque.',
    tFreeze: 1.5,
    decision: 'NO LET',
    regla: 'Regla 5.5.1 / 5.6',
    explicacion: 'Para que el saque sea válido, al menos un pie debe estar en contacto con el piso dentro del cuadro sin tocar ninguna de las líneas que delimitan el cuadro (Foot Fault). En PAR-11, una falta de saque otorga el punto al restador (B).',
    pilares: {
      interf: 'Infracción reglamentaria en la ejecución del saque.',
      retorno: 'Saque inválido desde su origen.',
      creado: 'Pie pisando línea perimetral de caja.',
      despeje: 'Punto para el restador B (Hand Out).'
    },
    ball: [
      { t: 0.0, x: 5.6, y: 6.2, z: 1.0, arch: 0.5 },
      { t: 0.8, x: 2.5, y: 0.05, z: 2.4, arch: 0.0 }, // Frontis arriba de línea de servicio
      { t: 1.5, x: 1.8, y: 6.5, z: 1.4, arch: 0.4 }
    ],
    pA: [
      { t: 0.0, x: 4.8, y: 6.2, ang: 0.0 }, // Pie sobre línea
      { t: 1.5, x: 4.6, y: 6.0, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 1.8, y: 8.0, ang: 0.0 },
      { t: 1.5, x: 1.8, y: 7.2, ang: 0.0 }
    ],
    striker: 'A'
  },
  {
    id: 'linea_out_lateral',
    num: 17,
    cat: 'Saque y Líneas',
    titulo: 'Bola toca la línea de fuera lateral (Out)',
    desc: 'Durante un peloteo intenso, A levanta un globo defensivo que toca el borde inferior de la cinta roja de fuera en la pared lateral izquierda y cae dentro de la cancha.',
    tFreeze: 2.8,
    decision: 'NO LET',
    regla: 'Regla 6.3.3',
    explicacion: 'Cualquier bola que toque la línea de fuera (Out line) en la pared frontal, paredes laterales o pared trasera, o por encima de ella, está Fuera (Out). Todas las líneas perimetrales y el borde del tin son malas. Punto para B.',
    pilares: {
      interf: 'Ninguna: Pelota fuera de los límites de juego.',
      retorno: 'El tiro murió al tocar la línea roja.',
      creado: 'Error técnico del golpeador A.',
      despeje: 'Punto para B.'
    },
    ball: [
      { t: 0.0, x: 2.0, y: 7.0, z: 0.5, arch: 2.0 },
      { t: 1.5, x: 1.0, y: 0.05, z: 3.5, arch: 0.0 },
      { t: 2.8, x: 0.02, y: 4.5, z: 3.4, arch: 0.0 } // Toca línea de fuera lateral
    ],
    pA: [
      { t: 0.0, x: 2.0, y: 7.2, ang: 0.0 },
      { t: 2.8, x: 3.0, y: 6.0, ang: 0.0 }
    ],
    pB: [
      { t: 0.0, x: 3.5, y: 5.5, ang: 0.0 },
      { t: 2.8, x: 3.2, y: 5.2, ang: 0.0 }
    ],
    striker: 'A'
  },
  {
    id: 'objeto_caido_cancha',
    num: 18,
    cat: 'Objeto Caído (13)',
    titulo: 'Caída de gafas o accesorio del jugador en cancha',
    desc: 'En medio de un peloteo sin contacto entre jugadores, a A se le cae su par de gafas protectoras (o una segunda bola que llevaba en el bolsillo) sobre la madera de la cancha mientras corre hacia la T.',
    tFreeze: 2.6,
    decision: 'STROKE',
    regla: 'Regla 13.2',
    explicacion: 'Si cualquier objeto distinto de la raqueta cae al piso desde la persona o indumentaria de un jugador mientras el punto está en juego, el árbitro debe detener el juego ("Stop") y otorgar Stroke al oponente (B).',
    pilares: {
      interf: 'Peligro inminente de pisada o distracción por objeto caído.',
      retorno: 'Punto detenido de forma mandataria por el oficial.',
      creado: 'Por pérdida de accesorio del jugador A.',
      despeje: 'Stroke otorgado a B.'
    },
    ball: [
      { t: 0.0, x: 4.5, y: 5.0, z: 0.7, arch: 1.0 },
      { t: 1.3, x: 2.0, y: 0.05, z: 1.8, arch: 0.0 },
      { t: 2.6, x: 1.2, y: 4.8, z: 0.8, arch: 0.4 }
    ],
    pA: [
      { t: 0.0, x: 4.8, y: 5.4, ang: 0.0 },
      { t: 1.5, x: 3.6, y: 4.8, ang: 0.0 },
      { t: 2.6, x: 3.0, y: 4.6, ang: 0.0 } // Se le caen las gafas
    ],
    pB: [
      { t: 0.0, x: 3.2, y: 6.8, ang: 0.0 },
      { t: 1.5, x: 2.8, y: 6.0, ang: 0.0 },
      { t: 2.6, x: 1.8, y: 5.4, ang: 0.0 }
    ],
    striker: 'B'
  }
];
