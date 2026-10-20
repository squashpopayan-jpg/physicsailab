/* Práctica F11-01 · Ondas en un resorte largo */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'ondas-resorte', cod: 'F11-01', titulo: 'Ondas en un resorte largo: pulsos, rapidez y reflexión', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '4 estudiantes (dos en los extremos, cronometrista, registrador)', nivel: 2,
    dba: ['11.1'], est: ['C2', 'C3', 'C5', 'C8', 'C12', 'F2'], comp: ['exp', 'ind'], temas: ['Ondas'],
    pregunta: '¿De qué depende la rapidez de un pulso en un resorte y por qué, en un resorte largo, el pulso tarda lo mismo en recorrerlo sin importar cuánto se estire?',
    contexto: 'Antes de estudiar el sonido y la luz conviene ver una onda con los ojos. Un resorte largo de juguete permite producir pulsos longitudinales y transversales, verlos reflejarse e invertirse y medir su rapidez. Y guarda una sorpresa: estirarlo al doble no cambia el tiempo que tarda el pulso en ir y volver.',
    objetivos: [
      'Producir y diferenciar pulsos transversales y longitudinales, y observar la reflexión en extremo fijo y libre.',
      'Medir la rapidez de los pulsos para varias longitudes de estiramiento y la tensión con un dinamómetro.',
      'Contrastar los resultados con el modelo v = √(T/μ) y explicar por qué el tiempo de recorrido no depende de la longitud.'
    ],
    prediccion: 'Si se estira el resorte de 2 m a 4 m, ¿el pulso tarda el doble, la mitad o lo mismo en recorrerlo? Justifiquen.',
    claves: [
      'Un pulso transversal desplaza las espiras perpendicularmente a la dirección de avance; uno longitudinal, en la misma dirección (como el sonido).',
      'La rapidez de un pulso transversal en una cuerda o resorte tenso es v = √(T/μ), con T la tensión y μ la masa por unidad de longitud.',
      'En un resorte largo cuya longitud natural es casi cero, T = k L y μ = M/L: v = L √(k/M) y el tiempo de recorrido L/v = √(M/k) no depende de L.',
      'Al reflejarse en un extremo fijo, el pulso se invierte; en un extremo libre, no.'
    ],
    materiales: [
      ['Resorte largo de juguete metálico (tipo «slinky»)', '1', 'Resorte plástico grande', 15000],
      ['Dinamómetro de 5 N o resorte calibrado (práctica F10-04)', '1', 'Balanza de gancho', 12000],
      ['Cinta métrica de 5 m o flexómetro', '1', 'Baldosas del piso como escala', 10000],
      ['Cronómetro del celular o video', '1', '—', 0],
      ['Cinta de color para marcar una espira', '1', '—', 1000],
      ['Balanza para pesar el resorte', '1', 'Balanza de cocina', 0]
    ],
    montaje: [
      'Pese el resorte (masa M).',
      'Sobre el piso liso y limpio, dos estudiantes sostienen los extremos; uno de ellos lo sujeta a través del dinamómetro.',
      'Marque en el piso las longitudes de estiramiento: 2, 3, 4 y 5 m.',
      'Pegue cinta de color en una espira del centro para observar el movimiento de las espiras.'
    ],
    seguridad: [
      { p: 'Resorte estirado que se suelta', c: 'mec', ef: 'Golpe de las espiras en manos o cara', ctrl: 'Nunca soltar un extremo estirado; acercarse caminando para destensar; máximo 5 m.', nd: 2, ne: 2, nc: 10 },
      { p: 'Deformación permanente del resorte', c: 'mec', ef: 'Daño del material', ctrl: 'No estirar más de lo indicado; evitar nudos.', nd: 0, ne: 2, nc: 10 },
      { p: 'Tropiezos con el resorte en el piso', c: 'loc', ef: 'Caídas', ctrl: 'Zona despejada y señalizada; nadie pasa por encima.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Con 3 m de estiramiento, produzca un pulso transversal con un golpe lateral rápido y otro longitudinal comprimiendo unas espiras. Observe la espira marcada en cada caso.',
      'Observe la reflexión con el extremo fijo (sostenido firme) y con el extremo libre (atado a un hilo largo).',
      'Para cada estiramiento (2, 3, 4 y 5 m), lea la tensión en el dinamómetro.',
      'Produzca un pulso transversal y mida el tiempo de cuatro viajes de ida y vuelta (el pulso se refleja en cada extremo). Repita tres veces.',
      'Produzca dos pulsos desde los extremos opuestos y observe qué pasa cuando se cruzan.'
    ],
    tabla: { cols: ['<i>L</i> (m)', '<i>T</i> tensión (N)', '<i>t</i> de 4 idas y vueltas (s)', '<i>t</i> de un recorrido (s)', '<i>v</i> = <i>L</i>/<i>t</i> (m/s)'], filas: 5 },
    analisis: [
      'Grafique la tensión contra L: la pendiente es la constante k del resorte completo.',
      'Calcule el tiempo de un recorrido (dividiendo entre 8) y la rapidez v = L/t para cada L.',
      'Grafique el tiempo de un recorrido contra L. ¿Depende de L? Compárelo con √(M/k).',
      'Compare la rapidez medida con √(T/μ), con μ = M/L, para cada estiramiento.'
    ],
    esperado: 'Para un resorte metálico de 215 g con k = 0,90 N/m, el pulso tarda 0,49 s en recorrerlo, casi igual con 2 m que con 5 m de estiramiento; la rapidez crece en proporción a L, de 4,1 m/s a 10,2 m/s. Las espiras de un pulso transversal se mueven de lado y las de uno longitudinal, hacia adelante y atrás; el pulso reflejado en un extremo fijo vuelve invertido.',
    errores: [
      ['Golpes lentos que producen pulsos muy anchos.', 'El pulso se confunde con su reflejo; se usan golpes rápidos y cortos.'],
      ['Arrastrar el resorte sobre un piso áspero.', 'La fricción con el piso amortigua el pulso; se usa un piso liso o se suspende el resorte.'],
      ['Medir un solo viaje.', 'Dura medio segundo; se cronometran cuatro idas y vueltas.'],
      ['Esperar que v no cambie con L.', 'La rapidez sí cambia (crece con la tensión); lo que no cambia es el tiempo de recorrido.']
    ],
    orientadoras: [
      '¿Cómo producirán pulsos transversales y longitudinales y cómo los distinguirán?',
      '¿De qué podría depender la rapidez del pulso? ¿Cómo variarán una cosa a la vez?',
      '¿Cómo medirán un tiempo tan corto con un cronómetro manual?',
      '¿Qué esperan que pase cuando el pulso llega a un extremo sostenido firmemente?'
    ],
    abierta: 'En los sismos, las ondas P (longitudinales) llegan antes que las S (transversales). Usen el resorte para investigar cómo viajan, se reflejan y se superponen los pulsos y propongan un modelo físico que relacione su rapidez con las propiedades del resorte.',
    preguntas: [
      '¿Por qué el tiempo de recorrido no depende de la longitud de estiramiento? ¿Valdría lo mismo para una cuerda?',
      '¿Qué se transporta con el pulso: materia o energía? Use la espira marcada para argumentar.',
      '¿Qué pasa cuando dos pulsos se cruzan? ¿Se destruyen?',
      'Clasifique el sonido y la luz como ondas longitudinales o transversales y mecánicas o electromagnéticas.'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'En una cuerda tensa, la rapidez de un pulso es v = √(T/μ). Si se cuadruplica la tensión de la cuerda sin cambiar su masa por unidad de longitud, la rapidez del pulso',
      opciones: ['se reduce a la mitad.', 'no cambia.', 'se duplica.', 'se cuadruplica.'],
      clave: 'C',
      just: 'La rapidez es proporcional a la raíz de la tensión: √4 = 2.'
    },
    rubrica: [['Modelo ondulatorio', 'Confunde el movimiento de las espiras con el del pulso.', 'Distingue pulsos transversales y longitudinales.', 'Mide la rapidez y la contrasta con √(T/μ).', 'Explica la independencia del tiempo de recorrido y la reflexión con el modelo.']],
    referencias: ['M. G. Calkin, «Motion of a falling spring», <i>American Journal of Physics</i> 61, 261–264, 1993.', 'A. P. French, <i>Vibraciones y ondas</i>, Reverté, cap. 7.']
  });
})();
