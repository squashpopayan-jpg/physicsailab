/* Práctica F10-04 · Ley de Hooke y oscilador masa–resorte */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'resorte', cod: 'F10-04', titulo: 'Ley de Hooke y oscilador masa–resorte', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['10.2', '10.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'F1', 'F2'], comp: ['uso', 'ind'], temas: ['Dinámica', 'Energía mecánica'],
    pregunta: '¿Se obtiene la misma constante de un resorte estirándolo con pesos que haciéndolo oscilar, y qué papel juega la masa del propio resorte?',
    contexto: 'Las balanzas de gancho de las plazas de mercado y los amortiguadores de las motos usan resortes. Un resorte se puede caracterizar de dos maneras independientes: midiendo cuánto se estira con cada peso o midiendo el ritmo al que oscila. Si el modelo es bueno, las dos deben dar la misma constante.',
    objetivos: [
      'Obtener la constante elástica k a partir de la relación entre fuerza y alargamiento.',
      'Obtener k a partir del periodo de oscilación linealizando T² contra la masa colgada.',
      'Estimar la masa efectiva del resorte con el intercepto y comparar los dos valores de k con la compatibilidad z.'
    ],
    prediccion: 'Si se cuadruplica la masa colgada, ¿cuánto cambia el alargamiento? ¿Y el periodo de oscilación? ¿Importa la masa del propio resorte en cada caso?',
    claves: [
      'Ley de Hooke: F = k x, donde x es el alargamiento desde la posición sin carga (o desde que el resorte empieza a estirarse).',
      'Una masa m colgada oscila con periodo T = 2π √(m/k) si el resorte no tiene masa.',
      'Un resorte real de masa m<sub>r</sub> se comporta como si un tercio de su masa oscilara con la carga: T = 2π √((m + m<sub>r</sub>/3)/k).',
      'Graficando T² contra m se obtiene una recta: pendiente 4π²/k e intercepto 4π² m<sub>r</sub>/(3k).'
    ],
    materiales: [
      ['Resorte helicoidal de unos 20 N/m (de cuaderno argollado grande o de ferretería)', '1', 'Resorte de juguete; liga gruesa solo para comparar', 3000],
      ['Juego de masas: arandelas o tuercas pesadas en balanza, de 20 g a 200 g', '1 juego', 'Bolsas con arena pesadas', 4000],
      ['Gancho o clip grande para colgar las masas', '1', 'Alambre doblado', 500],
      ['Soporte universal o prensa en C con brazo', '1', 'Palo de escoba entre dos sillas', 9000],
      ['Regla de 30 cm fijada vertical junto al resorte', '1', 'Flexómetro', 2000],
      ['Cronómetro del celular', '1', 'phyphox: acelerómetro como cronómetro', 0],
      ['Balanza (1 g)', '1', 'Balanza del laboratorio', 0]
    ],
    montaje: [
      'Cuelgue el resorte del brazo del soporte y pese el resorte antes de colgarlo (m<sub>r</sub>).',
      'Fije la regla vertical junto al resorte, con el cero a la altura del extremo inferior sin carga.',
      'Pese el gancho y cada masa; anote las masas acumuladas que va a usar.',
      'Verifique que la carga máxima (200 g) no deja al resorte deformado: al retirarla debe volver a su longitud.'
    ],
    seguridad: [
      { p: 'Resorte que se suelta o masas que caen', c: 'mec', ef: 'Golpes en manos o pies', ctrl: 'Gancho cerrado; carga máxima de 250 g; no estirar el resorte con la mano.', nd: 2, ne: 2, nc: 10 },
      { p: 'Resorte estirado de más que salta', c: 'mec', ef: 'Golpe en los ojos', ctrl: 'Nunca estirar más de 15 cm; gafas si se usan resortes duros.', nd: 2, ne: 1, nc: 25 }
    ],
    epp: 'gafas de seguridad si se usan resortes de más de 50 N/m.',
    procedimiento: [
      'Parte estática: cuelgue masas acumuladas de 20 g en 20 g hasta 200 g y lea la posición del extremo del resorte para cada una. Luego descargue y lea de nuevo.',
      'Parte dinámica: con 50 g, desplace la masa 2 cm hacia abajo, suéltela y cronometre 20 oscilaciones tres veces.',
      'Repita la parte dinámica con al menos cinco masas entre 50 g y 200 g.',
      'Registre todas las lecturas, incluidas las de descarga.'
    ],
    tabla: { cols: ['<i>m</i> (kg)', '<i>F</i> = <i>mg</i> (N)', '<i>x</i> carga (m)', '<i>x</i> descarga (m)', '<i>t</i>₂₀ (s)', '<i>T</i> (s)', '<i>T</i>² (s²)'], filas: 8 },
    analisis: [
      'Grafique F contra x (o x contra F) y ajuste una recta: la pendiente es k. Observe si hay un intercepto (tensión inicial del resorte).',
      'Grafique T² contra m y ajuste una recta. Calcule k = 4π²/pendiente y m<sub>r</sub> = 3 · intercepto · k/(4π²).',
      'Compare los dos valores de k mediante z y la masa efectiva con un tercio de la masa medida del resorte.',
      'Use la gravedad del municipio para F = mg.'
    ],
    esperado: 'Un resorte de 20 N/m con 12 g de masa se estira 4,89 cm con 100 g (g = 9,776 m/s²) y oscila con T = 0,453 s. La recta T²–m tiene pendiente 4π²/k = 1,974 s²/kg e intercepto 0,0079 s², que corresponde a m<sub>r</sub>/3 = 4 g. Los dos valores de k coinciden dentro de 1 % a 3 %.',
    errores: [
      ['Medir el alargamiento desde el gancho y no desde el mismo punto del resorte.', 'Solo importan las diferencias: se mide siempre el mismo punto y se resta la posición sin carga.'],
      ['Ignorar la tensión inicial.', 'Muchos resortes de espiras juntas no se estiran hasta superar una fuerza inicial; la recta F–x no pasa por el origen y hay que ajustarla con intercepto.'],
      ['Oscilaciones grandes o con balanceo.', 'Se desplaza poco (1 a 2 cm) y verticalmente; si la masa se balancea como péndulo, se repite.'],
      ['Olvidar la masa del gancho.', 'Es parte de la masa colgada en las dos partes.']
    ],
    orientadoras: [
      '¿Cómo medirán la relación entre la fuerza y el alargamiento? ¿Qué harán para saber si el resorte vuelve a su forma?',
      '¿De qué variables podría depender el periodo de oscilación? ¿Cómo lo comprobarán?',
      '¿Qué gráfica les permite obtener k a partir de los periodos?',
      '¿Cómo podrían saber si la masa del resorte influye?'
    ],
    abierta: 'Una empresa quiere usar resortes para fabricar balanzas de gancho baratas para las plazas de mercado de la región. Diseñen una investigación para caracterizar un resorte como instrumento: su rango, su constante y su incertidumbre, por dos métodos distintos.',
    preguntas: [
      '¿Coinciden los dos valores de k? Si no, ¿qué efecto no incluido en el modelo podría explicarlo?',
      '¿Por qué solo un tercio de la masa del resorte cuenta en la oscilación?',
      'Describan las transformaciones de energía (cinética, potencial elástica y gravitacional) durante una oscilación.',
      '¿Oscilaría con el mismo periodo esta masa con este resorte en la Luna? ¿Y se estiraría lo mismo?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Una masa de 100 g colgada de un resorte oscila con un periodo de 0,5 s. Si se reemplaza por una masa de 400 g, despreciando la masa del resorte, el nuevo periodo es',
      opciones: ['0,25 s.', '0,5 s.', '1,0 s.', '2,0 s.'],
      clave: 'C',
      just: 'Con T = 2π √(m/k), el periodo es proporcional a la raíz de la masa: al cuadruplicar la masa, el periodo se duplica: 0,5 s × 2 = 1,0 s.'
    },
    rubrica: [['Doble caracterización del resorte', 'Calcula k con un solo par de datos.', 'Obtiene k por un método.', 'Obtiene k por los dos métodos con incertidumbre.', 'Compara los dos métodos con z y explica la masa efectiva del resorte.']],
    referencias: ['J. G. Fox y J. Mahanty, «The effective mass of an oscillating spring», <i>American Journal of Physics</i> 38, 98–100, 1970.']
  });
})();
