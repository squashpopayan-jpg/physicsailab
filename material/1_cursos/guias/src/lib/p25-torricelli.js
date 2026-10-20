/* Práctica F10-12 · Torricelli: chorro y vaciado de una botella */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'torricelli', cod: 'F10-12', titulo: 'Torricelli: el chorro y el vaciado de una botella', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '4 estudiantes', nivel: 2,
    dba: ['10.2'], est: ['C2', 'C3', 'C10', 'C14', 'C15', 'F6', 'T1'], comp: ['exp', 'ind'], temas: ['Energía mecánica', 'Transformación y conservación de energía'],
    pregunta: '¿Con qué rapidez sale el agua por un orificio en el fondo de un recipiente y por qué la botella tarda más en vaciarse de lo que predice el modelo ideal?',
    contexto: 'Los tanques de agua elevados de las veredas, los filtros de barro y las botellas de riego por goteo funcionan con el mismo principio: el agua sale más rápido cuanto más alta está la superficie. Torricelli lo descubrió en 1643 y su ley es una aplicación de la conservación de la energía a un fluido.',
    objetivos: [
      'Relacionar el alcance del chorro con la altura del agua sobre el orificio y comprobar la ley de Torricelli.',
      'Medir el tiempo de vaciado de una botella y linealizar √h contra t.',
      'Obtener los coeficientes de velocidad y de descarga del orificio y explicar por qué son menores que 1.'
    ],
    prediccion: 'Si la altura del agua sobre el orificio se reduce a la cuarta parte, ¿el chorro llega a la mitad, a la cuarta parte o a la misma distancia? ¿La botella se vacía con rapidez constante?',
    claves: [
      'Ley de Torricelli: un líquido sale por un orificio a una profundidad h bajo la superficie con rapidez v = √(2gh), como si hubiera caído libremente desde la superficie.',
      'Si el orificio está a una altura y sobre el punto de caída, el chorro horizontal llega a x = 2 √(h y).',
      'El chorro se contrae al salir (vena contracta) y pierde algo de energía: v real = C<sub>v</sub> √(2gh) y el caudal real es C<sub>d</sub> a √(2gh), con C<sub>d</sub> cercano a 0,6.',
      'Al vaciarse, la altura baja cada vez más despacio: √h decrece linealmente con el tiempo.'
    ],
    materiales: [
      ['Botella plástica de 2 L con paredes rectas', '1', 'Tarro de 3 L', 0],
      ['Puntilla de 4 mm y vela o encendedor para perforar (lo hace el docente)', '1', 'Taladro con broca de 4 mm', 1000],
      ['Cinta de enmascarar para tapar el orificio y para marcar la escala de altura', '1', '—', 3000],
      ['Regla de 30 cm pegada verticalmente a la botella', '1', 'Escala impresa', 2000],
      ['Bandeja o platón grande para recibir el agua', '1', 'Balde', 0],
      ['Flexómetro y cronómetro del celular', '1', 'Video del celular', 8000],
      ['Calibrador para medir el orificio y el diámetro de la botella', '1', 'Regla', 0]
    ],
    montaje: [
      'El docente perfora la botella a 5 cm de su base con la puntilla caliente (o con taladro), dejando un orificio redondo y limpio; se mide su diámetro.',
      'Pegue la regla verticalmente con el cero a la altura del orificio.',
      'Ubique la botella sobre una base estable a una altura y conocida sobre la bandeja (por ejemplo, 25 cm) y marque en la bandeja la vertical del orificio.',
      'Tape el orificio con cinta y llene la botella hasta 25 cm sobre el orificio.'
    ],
    seguridad: [
      { p: 'Puntilla caliente o broca al perforar', c: 'term', ef: 'Quemaduras o cortes', ctrl: 'La perforación la hace el docente, con alicate y guante, antes de la clase.', nd: 2, ne: 1, nc: 25 },
      { p: 'Agua en el piso', c: 'loc', ef: 'Resbalones', ctrl: 'Trabajar en el patio o sobre bandejas grandes; trapero a mano.', nd: 2, ne: 3, nc: 10 },
      { p: 'Agua cerca de tomas eléctricas o equipos', c: 'elec', ef: 'Daño de equipos, riesgo eléctrico', ctrl: 'Ningún equipo conectado a la red cerca del montaje; celulares en bolsa plástica.', nd: 0, ne: 2, nc: 25 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Destape el orificio. Cada vez que el nivel pase por una altura marcada (25, 20, 15, 10, 5 cm), otro integrante marca en la bandeja el punto donde cae el chorro.',
      'Simultáneamente, el cronometrista registra el instante en que el nivel pasa por cada marca (mejor aún, grabe la botella en video).',
      'Mida el alcance x de cada marca desde la vertical del orificio.',
      'Repita el vaciado completo tres veces.',
      'Mida el diámetro interior de la botella y el del orificio.'
    ],
    tabla: { cols: ['<i>h</i> (m)', '<i>x</i> (m)', '<i>x</i>² (m²)', '<i>t</i> (s)', '√<i>h</i> (m<sup>1/2</sup>)'], filas: 7 },
    analisis: [
      'Grafique x² contra h y ajuste una recta por el origen. La pendiente vale 4 C<sub>v</sub>² y: despeje el coeficiente de velocidad C<sub>v</sub>.',
      'Grafique √h contra t y ajuste una recta. Su pendiente vale −C<sub>d</sub> (a/A) √(g/2), con a el área del orificio y A la de la botella: despeje C<sub>d</sub>.',
      'Compare el tiempo total de vaciado con el ideal (C<sub>d</sub> = 1).',
      'Explique por qué C<sub>v</sub> es cercano a 1 y C<sub>d</sub> mucho menor.'
    ],
    esperado: 'Con el orificio a y = 25 cm sobre la bandeja y h = 20 cm, el alcance ideal es 44,7 cm; con C<sub>v</sub> = 0,97, 43,4 cm. Una botella de 10 cm de diámetro con un orificio de 4 mm se vacía desde 25 cm en unos 228 s con C<sub>d</sub> = 0,62, frente a 141 s si el chorro no se contrajera. Para orificios de borde afilado el valor de referencia es C<sub>d</sub> ≈ 0,61; un orificio perforado en plástico delgado puede dar un valor algo distinto, y medirlo es parte de la práctica.',
    errores: [
      ['Medir h desde el fondo de la botella.', 'h es la altura de la superficie sobre el centro del orificio.'],
      ['Orificio con rebabas o irregular.', 'Desvía y abre el chorro; se lima o se perfora de nuevo.'],
      ['Esperar C<sub>d</sub> = 1.', 'La vena contracta reduce el área efectiva del chorro a cerca del 62 % del orificio: es física, no error.'],
      ['Botella de paredes no rectas.', 'Si A cambia con la altura, √h ya no decrece linealmente; se usa solo el tramo recto.']
    ],
    orientadoras: [
      '¿Qué principio de conservación puede predecir la rapidez del agua que sale?',
      '¿Cómo medirán esa rapidez sin un velocímetro?',
      '¿Qué variables cambian mientras la botella se vacía y cómo registrarán su evolución?',
      '¿Qué gráficas esperan que sean rectas si el modelo es correcto?'
    ],
    abierta: 'En una vereda se quiere diseñar un tanque elevado con un orificio de salida para regar un cultivo durante una hora. Investiguen cómo dependen el chorro y el tiempo de vaciado de la altura, del tamaño del orificio y del tanque, y propongan un diseño.',
    preguntas: [
      '¿Por qué el agua sale con la misma rapidez que tendría si cayera libremente desde la superficie?',
      '¿Cómo se transforma la energía del agua desde la superficie hasta la salida?',
      '¿Por qué el chorro pierde alcance a medida que la botella se vacía, y por qué la botella se vacía cada vez más despacio?',
      '¿Cambiaría la rapidez del chorro si se hiciera el experimento con aceite? ¿Y el tiempo de vaciado?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Un tanque abierto tiene un orificio pequeño en su pared. Cuando la superficie del agua está 0,8 m por encima del orificio, el agua sale con rapidez v. Si el nivel baja hasta 0,2 m sobre el orificio, la rapidez de salida es',
      opciones: ['v/4.', 'v/2.', 'v.', '2v.'],
      clave: 'B',
      just: 'Por la ley de Torricelli v = √(2gh): la rapidez es proporcional a la raíz de la altura. Al dividir h entre 4, la rapidez se divide entre 2.'
    },
    rubrica: [['Modelo de Torricelli', 'No relaciona altura y rapidez.', 'Relaciona altura y alcance cualitativamente.', 'Obtiene C<sub>v</sub> y C<sub>d</sub> por linealización con incertidumbre.', 'Explica la vena contracta y la diferencia entre C<sub>v</sub> y C<sub>d</sub> con evidencia.']],
    referencias: ['E. Torricelli, <i>De motu gravium</i>, 1644.', 'R. W. Fox y A. T. McDonald, <i>Introducción a la mecánica de fluidos</i>, McGraw-Hill: coeficientes de orificio.']
  });
})();
