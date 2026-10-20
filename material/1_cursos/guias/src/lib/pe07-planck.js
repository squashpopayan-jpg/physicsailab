/* Montaje elaborado FE-07 · Constante de Planck con LED */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'planck', cod: 'FE-07', titulo: 'La constante de Planck con diodos LED de colores', grado: 11, tipo: 'elaborada',
    tiempo: 110, grupo: '3 estudiantes', nivel: 2,
    dba: ['11.1', '11.3'], est: ['C3', 'C5', 'C10', 'C14', 'C15', 'C19', 'F11', 'T2'], comp: ['ind', 'exp'], temas: ['Ondas', 'Electromagnetismo', 'Transformación y conservación de energía'],
    pregunta: '¿Qué relación hay entre el color de la luz de un LED y la tensión mínima que necesita para encenderse, y qué valor de la constante de Planck se deduce de ella?',
    contexto: 'Un LED convierte la energía que cada electrón gana al atravesar la unión (e V) en un fotón de energía h c/λ. Por eso los LED azules necesitan más tensión que los rojos. Con siete LED de colores, una pila y un multímetro se obtiene un valor de la constante de Planck, la misma que desde 2019 define el kilogramo en el Sistema Internacional, y se aprende a discutir los errores sistemáticos de un método.',
    objetivos: [
      'Medir la curva corriente–tensión de un LED y la tensión a una corriente fija para LED de varios colores.',
      'Graficar la tensión contra el inverso de la longitud de onda y obtener la constante de Planck de la pendiente.',
      'Discutir los errores sistemáticos del método y compararlo con el valor exacto del SI.'
    ],
    prediccion: 'Ordene los LED de menor a mayor según la tensión que creen que necesitan para encender: infrarrojo, rojo, amarillo, verde, azul y violeta. ¿Qué propiedad de la luz explica el orden?',
    claves: [
      'La energía de un fotón es E = h f = h c / λ: la luz violeta lleva más energía por fotón que la roja.',
      'En un LED, cada electrón que cruza la unión puede emitir un fotón; la tensión de encendido es aproximadamente V ≈ h c / (e λ).',
      'La gráfica de V contra 1/λ es aproximadamente una recta de pendiente h c / e, de donde h = e · pendiente / c.',
      'Desde 2019, h = 6,626 070 15 × 10⁻³⁴ J·s es un valor exacto que define el kilogramo; el método de los LED da una estimación con error sistemático apreciable.'
    ],
    materiales: [
      ['LED de 5 mm: infrarrojo 940 nm, rojo 630 nm, naranja 605 nm, amarillo 590 nm, verde 525 nm, azul 470 nm y violeta 405 nm (λ de la hoja de datos)', '7', 'Al menos 4 colores', 3500],
      ['Pila de 9 V con broche', '1', 'Portapilas de 4 AA', 9000],
      ['Potenciómetro de 10 kΩ como divisor de tensión', '1', '—', 1500],
      ['Resistencia de 1 kΩ en serie (protege el LED y mide la corriente)', '1', '—', 200],
      ['Dos multímetros digitales (o uno usado por turnos)', '2', '1', 30000],
      ['Protoboard y cables', '1', '—', 12000],
      ['Tubo de cartón negro para observar el encendido', '1', '—', 0],
      ['Cámara del celular (ve el infrarrojo)', '1', '—', 0]
    ],
    montaje: [
      'Conecte el potenciómetro como divisor: extremos a la pila y el cursor como salida variable de 0 a 9 V.',
      'Desde el cursor, arme la serie resistencia de 1 kΩ–LED, con la pata larga (ánodo) del LED hacia la resistencia.',
      'Mida la tensión del LED con un multímetro y la de la resistencia con el otro: la corriente en miliamperios es la tensión de la resistencia en voltios (1 kΩ).',
      'Anote la longitud de onda de cada LED según la hoja de datos del vendedor; si no la tiene, mídala con el espectroscopio de la práctica FE-10.'
    ],
    seguridad: [
      { p: 'LED sin resistencia en serie', c: 'elec', ef: 'El LED se quema y puede romperse el encapsulado', ctrl: 'Nunca conectar el LED directamente a la pila; la resistencia de 1 kΩ limita la corriente a menos de 9 mA.', nd: 2, ne: 2, nc: 10 },
      { p: 'Luz violeta e infrarroja', c: 'rad', ef: 'Molestia visual; la radiación infrarroja no se ve', ctrl: 'Los LED indicadores de baja potencia suelen estar en el grupo exento o de bajo riesgo de la IEC 62471; aun así, no mirarlos de frente y de cerca, y observar el infrarrojo solo con la cámara del celular.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Con el LED rojo, suba la tensión desde 0 V en pasos de 0,1 V y registre la tensión del LED y la corriente hasta 5 mA: es la curva I–V.',
      'Para cada uno de los siete LED, ajuste el potenciómetro hasta que la corriente sea 1,00 mA y anote la tensión del LED.',
      'Observe con el tubo de cartón la tensión a la que cada LED empieza a verse encendido, y compárela con la de 1 mA.',
      'Verifique con la cámara del celular que el LED infrarrojo emite.'
    ],
    tabla: { cols: ['LED', 'λ (nm)', '1/λ (µm⁻¹)', '<i>V</i> a 1 mA (V)', '<i>V</i> de encendido visual (V)', '<i>hc</i>/(<i>e</i>λ) (V)'], filas: 7 },
    analisis: [
      'Grafique la curva I–V del LED rojo: ¿desde qué tensión crece la corriente?',
      'Grafique V a 1 mA contra 1/λ para los siete LED y ajuste una recta; calcule h = e · pendiente / c con su incertidumbre.',
      'Compare con el valor exacto y con la columna hc/(eλ): ¿qué LED se apartan más y en qué sentido?',
      'Repita el ajuste solo con los LED rojo, naranja y amarillo, y solo con verde, azul y violeta: ¿por qué cambian tanto las pendientes?'
    ],
    esperado: 'Con valores típicos de catálogo (1,10 V para 940 nm, 1,75 V para 630 nm, 1,80 V para 605 nm, 1,85 V para 590 nm, 2,45 V para 525 nm, 2,60 V para 470 nm y 2,85 V para 405 nm, a 1 mA), el ajuste de los siete LED da h ≈ 7,1 × 10⁻³⁴ J·s, unos 8 % por encima del valor exacto. Ajustados por familias, los LED de AlGaInP (rojo a amarillo) dan 4,9 × 10⁻³⁴ J·s y los de InGaN (verde a violeta) 3,8 × 10⁻³⁴ J·s: cada material tiene su propio desfase entre la tensión y la energía del fotón. Con otros LED los números cambian; lo que se discute es el origen del error.',
    errores: [
      ['Usar la longitud de onda «de color» en lugar de la de la hoja de datos.', 'Un «verde» puede ser de 525 o de 570 nm; el error en λ pasa directamente a h.'],
      ['Tomar la tensión de encendido a ojo.', 'Depende de la sensibilidad del ojo a cada color y de la luz del salón; la corriente fija es un criterio reproducible.'],
      ['Mezclar LED de distintos materiales sin advertirlo.', 'Cada familia de semiconductores tiene un desfase distinto; el ajuste conjunto puede ocultar un error grande.'],
      ['Medir con el LED caliente.', 'La tensión de un LED baja unos milivoltios por grado; conviene medir rápido y a baja corriente.']
    ],
    orientadoras: [
      '¿Qué variable eléctrica podría estar relacionada con el color de la luz del LED?',
      '¿Cómo definirán de forma reproducible el «encendido» de un LED?',
      '¿Qué gráfica permitiría obtener una constante a partir de la tensión y la longitud de onda?',
      '¿Cómo comprobarán que el LED infrarrojo funciona si no se ve?'
    ],
    abierta: 'Investiguen si la tensión de encendido de un LED depende de su temperatura (enfríenlo con hielo en una bolsa o caliéntenlo con la mano) y estimen cómo afecta ese efecto al valor de h que obtuvieron.',
    preguntas: [
      '¿Por qué un LED azul no enciende con una sola pila de 1,5 V y uno infrarrojo sí?',
      '¿Por qué el método de los LED da un valor aproximado de h y no el exacto?',
      '¿Qué significa que desde 2019 la constante de Planck tenga un valor exacto?',
      '¿Cómo cambiaría la gráfica si se usara la frecuencia de la luz en lugar de 1/λ?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un LED rojo (630 nm) enciende con 1,8 V y uno azul (470 nm) con 2,6 V. La explicación es que',
      opciones: ['la luz azul viaja más rápido que la roja.', 'los fotones azules tienen más energía, porque su frecuencia es mayor.', 'el LED azul tiene más resistencia eléctrica.', 'la luz roja tiene mayor frecuencia que la azul.'],
      clave: 'B',
      just: 'La energía del fotón es h c / λ: a menor longitud de onda (azul) mayor frecuencia y mayor energía, que cada electrón debe recibir de la fuente.'
    },
    rubrica: [['Modelo cuántico de la luz', 'Mide tensiones sin relacionarlas con el color.', 'Relaciona el color con la tensión de encendido.', 'Obtiene h de la pendiente con incertidumbre.', 'Discute el error sistemático por familias de LED y lo compara con el valor exacto del SI.']],
    referencias: ['BIPM, <i>El Sistema Internacional de Unidades</i>, 9.ª ed., 2019: valor exacto de h.', 'F. Zhou y T. Cloninger, «Computer-based experiment for determining Planck’s constant using LEDs», <i>The Physics Teacher</i> 46, 413 (2008).', 'IEC 62471:2006, seguridad fotobiológica de lámparas y sistemas de lámparas.']
  });
})();
