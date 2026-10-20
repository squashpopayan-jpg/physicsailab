/* Montaje elaborado FE-03 · Péndulo físico: la regla oscilante */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'pendulo-fisico', cod: 'FE-03', titulo: 'Péndulo físico: una regla que oscila y su periodo mínimo', grado: 10, tipo: 'elaborada',
    tiempo: 110, grupo: '3 estudiantes', nivel: 2,
    dba: ['10.2'], est: ['C3', 'C4', 'C10', 'C12', 'C14', 'F2', 'F4'], comp: ['uso', 'ind', 'exp'], temas: ['Energía mecánica', 'Dinámica', 'Campo gravitacional'],
    pregunta: '¿Cómo cambia el periodo de una regla que oscila según el punto del que se cuelga, por qué existe un punto de periodo mínimo y qué valor de g se obtiene?',
    contexto: 'Un columpio, una pierna que camina y el péndulo de un reloj de pared no son masas puntuales colgadas de un hilo: son cuerpos extendidos. Una regla de un metro perforada a varias distancias de su centro muestra un resultado poco intuitivo: el periodo no crece siempre al alejar el punto de suspensión, sino que pasa por un mínimo.',
    objetivos: [
      'Medir el periodo de oscilación de una regla suspendida de puntos a distintas distancias de su centro de masa.',
      'Linealizar el modelo del péndulo físico para obtener g y la longitud de la regla a partir de una recta.',
      'Localizar el punto de periodo mínimo y explicarlo con el teorema de los ejes paralelos.'
    ],
    prediccion: 'Si se cuelga la regla cada vez más cerca de su centro, ¿el periodo aumenta, disminuye o primero disminuye y luego aumenta? ¿Qué pasa si se cuelga exactamente del centro?',
    claves: [
      'Un péndulo físico de masa m, con su centro de masa a la distancia d del eje y momento de inercia I respecto al eje, oscila con T = 2π √(I/(m g d)).',
      'Teorema de los ejes paralelos: I = I<sub>cm</sub> + m d², y para una regla de largo L y ancho b, I<sub>cm</sub> = m (L² + b²)/12.',
      'Combinando: T² d = (4π²/g) d² + (4π²/g)(L² + b²)/12; la gráfica de T² d contra d² es una recta.',
      'El periodo es mínimo cuando d = √((L² + b²)/12), unos 29 cm para una regla de 1 m.'
    ],
    materiales: [
      ['Regla de madera de 1 m y 3 cm de ancho', '1', 'Listón de madera de 1 m cepillado', 6000],
      ['Taladro y broca de 4 mm para hacer agujeros en el eje de la regla', '1', 'El docente los hace antes', 0],
      ['Clavo de 3 mm o cuchilla fija en un soporte, como eje', '1', 'Puntilla en una prensa', 500],
      ['Fotopuerta con Arduino (capítulo 13) o cronómetro del celular', '1', 'Cronómetro manual con 10 oscilaciones', 35000],
      ['Transportador para la amplitud y flexómetro', '1', '—', 500],
      ['Balanza para pesar la regla', '1', '—', 0]
    ],
    cortes: [
      ['Agujeros en la regla', '4 mm de diámetro', '9', 'En el eje de la regla, a 5, 10, 15, 20, 25, 30, 35, 40 y 45 cm del centro'],
      ['Soporte del eje', '200 × 100 × 18 mm de madera', '1', 'Con el clavo horizontal saliendo 4 cm, fijado con prensa a la mesa']
    ],
    montaje: [
      'Haga los agujeros de 4 mm en la línea central de la regla a las distancias indicadas del centro (marca de 50 cm).',
      'Fije el soporte con el clavo horizontal al borde de la mesa con una prensa; la regla debe girar libremente sin rozar el soporte.',
      'Ubique la fotopuerta de modo que el extremo inferior de la regla interrumpa el haz al pasar por la vertical.',
      'Mida la longitud, el ancho y la masa de la regla.'
    ],
    seguridad: [
      { p: 'Regla que se suelta del eje y cae', c: 'mec', ef: 'Golpe leve', ctrl: 'Eje con tope; amplitud de máximo 10°; nadie se ubica en el plano de oscilación.', nd: 2, ne: 2, nc: 10 },
      { p: 'Taladro al perforar la regla', c: 'mec', ef: 'Cortes, astillas', ctrl: 'Perforación por el docente antes de la clase, con gafas y la regla prensada.', nd: 2, ne: 1, nc: 25 }
    ],
    epp: 'no se requieren durante las medidas.',
    procedimiento: [
      'Cuelgue la regla del agujero más alejado del centro (45 cm), sepárela 5° de la vertical y suéltela.',
      'Mida el tiempo de 10 oscilaciones (o el periodo con la fotopuerta, promediando 10). Repita dos veces.',
      'Repita para todos los agujeros.',
      'Cerca de 29 cm, haga medidas adicionales para localizar el mínimo con cuidado.'
    ],
    tabla: { cols: ['<i>d</i> (m)', '<i>t</i>₁₀ (s)', '<i>T</i> (s)', '<i>T</i>² <i>d</i> (s²·m)', '<i>d</i>² (m²)'], filas: 9 },
    analisis: [
      'Grafique T contra d y localice el mínimo.',
      'Grafique T² d contra d² y ajuste una recta: g = 4π²/pendiente; (L² + b²)/12 = intercepto/pendiente.',
      'Compare g con la referencia del municipio y la longitud obtenida con la medida.',
      'Compare la posición del mínimo con √((L² + b²)/12).'
    ],
    esperado: 'Una regla de 1,00 m y 3 cm de ancho, con g = 9,776 m/s², oscila con 2,634 s colgada a 5 cm del centro, 1,579 s a 20 cm, 1,527 s en el mínimo (d = 28,9 cm) y 1,602 s a 45 cm. La recta T²d–d² tiene pendiente 4,038 s²/m e intercepto 0,337 s²·m. Con fotopuerta, g sale con una incertidumbre de algunas décimas de por ciento.',
    errores: [
      ['Medir d hasta el borde del agujero.', 'd es la distancia del eje (centro del agujero) al centro de masa de la regla.'],
      ['Agujeros flojos u holgados.', 'El eje se desplaza al oscilar; se usa un clavo justo al diámetro del agujero.'],
      ['Amplitudes grandes.', 'Aumentan el periodo como en el péndulo simple; se usan 5° o menos.'],
      ['Ignorar el ancho de la regla.', 'Su contribución b²/12 es pequeña pero visible en el intercepto.']
    ],
    orientadoras: [
      '¿En qué se diferencia una regla que oscila de una masa puntual colgada de un hilo?',
      '¿Qué variable cambiarán y cómo medirán el periodo con precisión?',
      '¿Qué gráfica les permite obtener g a partir de una recta?',
      '¿Cómo encontrarán con precisión el punto de periodo mínimo?'
    ],
    abierta: 'Al caminar, las piernas oscilan como péndulos físicos. Investiguen con reglas y varillas de distinta longitud cómo depende el periodo de oscilación del tamaño y del punto de suspensión, y usen sus resultados para explicar por qué las personas de piernas más largas caminan con un ritmo más lento.',
    preguntas: [
      '¿Por qué el periodo tiende a infinito cuando el eje se acerca al centro de masa?',
      '¿Qué longitud debería tener un péndulo simple para oscilar con el periodo mínimo de la regla?',
      'Describa las transformaciones de energía en la regla que oscila.',
      'Si la regla tuviera una tuerca pegada en un extremo, ¿cómo cambiaría la curva T–d?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Una regla de 1 m se cuelga de agujeros a distintas distancias d de su centro. Un estudiante afirma que el periodo siempre aumenta cuando el agujero se aleja del centro, «como en un péndulo simple más largo». Sus datos muestran que el periodo primero disminuye y luego aumenta. La explicación correcta es que',
      opciones: ['los datos están mal porque el periodo de un péndulo siempre crece con la longitud.', 'el momento de inercia y el torque del peso cambian de forma distinta con d, y su cociente tiene un mínimo.', 'la masa de la regla cambia según el agujero.', 'la gravedad cambia con la altura del agujero.'],
      clave: 'B',
      just: 'T² es proporcional a I/(m g d) = (L²/12 + d²)/(g d). Para d pequeño domina el término L²/(12 d), que crece al acercarse al centro; para d grande domina d. La suma tiene un mínimo en d = L/√12.'
    },
    rubrica: [['Modelo de péndulo físico', 'Aplica el modelo de péndulo simple.', 'Reconoce que el periodo depende de d.', 'Obtiene g y L por linealización con incertidumbre.', 'Explica el mínimo con los ejes paralelos y lo localiza con precisión.']],
    referencias: ['C. Huygens, <i>Horologium oscillatorium</i>, 1673.', 'R. A. Nelson y M. G. Olsson, <i>American Journal of Physics</i> 54, 112–121, 1986.']
  });
})();
