/* Práctica F10-06 · Segunda ley de Newton con un carro y una masa colgante */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'segunda-ley', cod: 'F10-06', titulo: 'Segunda ley de Newton: carro arrastrado por una masa colgante', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '4 estudiantes', nivel: 1,
    dba: ['10.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'F1', 'F2'], comp: ['uso', 'ind'], temas: ['Dinámica'],
    pregunta: '¿Cómo depende la aceleración de un sistema de la fuerza neta que actúa sobre él cuando su masa total no cambia?',
    contexto: 'Empujar un carro de mercado vacío o lleno no se siente igual. La segunda ley de Newton dice cuánto cambia la velocidad de un cuerpo con una fuerza dada; para ponerla a prueba hay que variar la fuerza sin variar la masa, un truco experimental que ya usaban los libros de física del siglo XX.',
    objetivos: [
      'Medir la aceleración de un carro arrastrado por una masa colgante para varias fuerzas, manteniendo constante la masa total del sistema.',
      'Obtener la masa del sistema a partir de la pendiente de la gráfica a contra F y compararla con la medida en la balanza.',
      'Identificar en el intercepto el efecto de la fricción y de la polea.'
    ],
    prediccion: 'Si se duplica la masa que cuelga y se quita del carro esa misma masa, ¿qué le pasa a la aceleración? ¿Por qué conviene pasar las arandelas del carro al portapesas en lugar de agregar arandelas nuevas?',
    claves: [
      'La fuerza que acelera el sistema carro + masa colgante es el peso de la masa colgante, mg, menos la fricción.',
      'La segunda ley para el sistema: (M + m) a = mg − fricción. Si M + m es constante, a es una función lineal de mg.',
      'La pendiente de a contra mg es 1/(M + m) si la polea es liviana; una polea pesada suma I/r² a la masa.',
      'Partiendo del reposo y recorriendo d en un tiempo t, a = 2d/t².'
    ],
    materiales: [
      ['Carro de juguete de ruedas libres o carro de laboratorio', '1', 'Patineta pequeña con una tabla', 15000],
      ['Polea de baja fricción (dos CD sobre un rodamiento 608, capítulo 11)', '1', 'Polea comercial con prensa', 8000],
      ['Hilo de nailon de 1,5 m', '1', 'Hilo de pescar', 500],
      ['10 arandelas de 10 g y un portapesas liviano (clip y vaso pequeño)', '1 juego', 'Tuercas pesadas en balanza', 3000],
      ['Cinta métrica y cinta de enmascarar', '1', '—', 8000],
      ['Celular: cronómetro, video o acelerómetro (phyphox)', '1', 'Cronómetro manual', 0],
      ['Balanza (1 g)', '1', 'Balanza del laboratorio', 0],
      ['Tope de espuma al final de la mesa', '1', 'Libros con una toalla', 0]
    ],
    montaje: [
      'Fije la polea al borde de la mesa con una prensa, a la altura del enganche del carro, para que el hilo quede horizontal.',
      'Pese el carro (con el celular si lo va a usar como acelerómetro), las diez arandelas y el portapesas: la masa total del sistema es la suma de todo.',
      'Coloque las diez arandelas en el carro. Amarre el hilo al carro, páselo por la polea y cuelgue el portapesas.',
      'Marque en la mesa el punto de partida y otro 80 cm adelante; ponga el tope antes del borde.',
      'Nivele la mesa: el carro sin hilo no debe moverse solo en ninguna dirección.'
    ],
    seguridad: [
      { p: 'Carro que cae de la mesa', c: 'mec', ef: 'Daño del equipo o golpe en los pies', ctrl: 'Tope antes de la polea; alguien recibe el carro.', nd: 2, ne: 3, nc: 10 },
      { p: 'Portapesas que cae al piso', c: 'mec', ef: 'Golpe leve', ctrl: 'Caja con espuma bajo el portapesas; masas de máximo 100 g.', nd: 2, ne: 3, nc: 10 },
      { p: 'Prensa de la polea mal ajustada', c: 'mec', ef: 'Caída de la polea', ctrl: 'Ajustar y probar antes de cada sesión.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Pase una arandela del carro al portapesas. Suelte el carro desde el reposo y mida el tiempo de recorrido de 80 cm tres veces (o la aceleración con el celular).',
      'Pase otra arandela del carro al portapesas y repita. Continúe hasta tener al menos seis fuerzas distintas.',
      'No agregue ni quite masa del sistema: solo cambie arandelas de lugar.',
      'Al final, mida el tiempo con el portapesas vacío para estimar la fricción (si el carro no arranca, anótelo).'
    ],
    tabla: { cols: ['<i>m</i> colgante (kg)', '<i>F</i> = <i>mg</i> (N)', '<i>t</i>₁ (s)', '<i>t</i>₂ (s)', '<i>t</i>₃ (s)', '<i>a</i> = 2<i>d</i>/<i>t</i>² (m/s²)'], filas: 7 },
    analisis: [
      'Calcule a = 2d/t² con el tiempo promedio de cada fuerza y su incertidumbre: u(a)/a = 2 u(t)/t.',
      'Grafique a contra F = mg y ajuste una recta.',
      'Calcule la masa del sistema como el inverso de la pendiente y compárela con la masa pesada.',
      'Interprete el intercepto: ¿qué fuerza mínima se necesita para mover el carro?'
    ],
    esperado: 'Con un sistema de 0,61 kg, una polea de dos CD y fricción de rodadura de 1 %, la aceleración crece linealmente con la fuerza; la masa obtenida de la pendiente (0,620 kg) es unos 2 % mayor que la pesada, porque la polea aporta unos 16 g de masa efectiva, y el intercepto en F es de unos 0,06 N. Con 50 g colgando el carro acelera con 0,69 m/s² y recorre 80 cm en 1,5 s.',
    errores: [
      ['Agregar masa al portapesas sin quitarla del carro.', 'Cambia a la vez la fuerza y la masa; la gráfica deja de ser una recta.'],
      ['Hilo inclinado.', 'Si el hilo no es horizontal, solo una parte de su tensión tira del carro; la polea se ajusta a la altura del enganche.'],
      ['Medir tiempos de menos de 1 s a mano.', 'El tiempo de reacción produce errores del 10 %; se usa un recorrido más largo, video o el acelerómetro.'],
      ['Ignorar la polea.', 'Una polea pesada o con fricción reduce la aceleración; se nota en la pendiente y en el intercepto.']
    ],
    orientadoras: [
      '¿Qué fuerza acelera al sistema? ¿Qué parte del sistema hay que considerar para la segunda ley?',
      '¿Cómo cambiarán la fuerza sin cambiar la masa total?',
      '¿Cómo medirán la aceleración del carro con suficiente precisión?',
      '¿Qué gráfica les permitirá poner a prueba la segunda ley?'
    ],
    abierta: 'Los carritos de supermercado se empujan con distintas fuerzas y cargas. Diseñen una investigación con un carro de juguete para establecer cómo dependen la aceleración de la fuerza y de la masa, y propongan cómo eliminar el efecto de la fricción.',
    preguntas: [
      '¿Por qué la tensión del hilo no es igual al peso de la masa colgante cuando el sistema acelera?',
      '¿Qué indica físicamente el intercepto de su gráfica?',
      'Si se repitiera la práctica en la Luna, ¿cambiaría la pendiente de la gráfica a contra F? ¿Y la aceleración para una misma masa colgante?',
      'Identifique las parejas de acción y reacción entre el hilo, el carro y la masa colgante (tercera ley).'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Para estudiar la relación entre fuerza neta y aceleración, un grupo arrastra un carro con una masa colgante. Para que la masa del sistema permanezca constante mientras cambia la fuerza, en cada ensayo el grupo debe',
      opciones: ['agregar arandelas nuevas al portapesas.', 'pasar arandelas del carro al portapesas.', 'cambiar el carro por uno más pesado.', 'alargar el hilo que une el carro con el portapesas.'],
      clave: 'B',
      just: 'Al pasar arandelas del carro al portapesas, la masa total del sistema no cambia y la fuerza (el peso que cuelga) aumenta. Agregar arandelas nuevas cambia simultáneamente la fuerza y la masa.'
    },
    rubrica: [['Control de variables', 'Cambia varias variables a la vez.', 'Cambia la fuerza pero también la masa.', 'Mantiene constante la masa total y varía la fuerza.', 'Justifica el control de variables y cuantifica el efecto de la polea y la fricción.']],
    referencias: ['I. Newton, <i>Philosophiae Naturalis Principia Mathematica</i>, 1687.']
  });
})();
