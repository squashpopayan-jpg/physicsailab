/* Montaje elaborado FE-08 · Campo magnético terrestre con una brújula de tangentes */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'campo-terrestre', cod: 'FE-08', titulo: 'El campo magnético de la Tierra con una brújula de tangentes', grado: 11, tipo: 'elaborada',
    tiempo: 165, grupo: '4 estudiantes', nivel: 2,
    dba: ['11.2'], est: ['C3', 'C4', 'C5', 'C10', 'C13', 'C14', 'F10', 'T2'], comp: ['uso', 'ind', 'exp'], temas: ['Electromagnetismo'],
    pregunta: '¿Cuánto vale la componente horizontal del campo magnético de la Tierra en nuestro municipio, y cómo se mide con una bobina, una pila y una brújula?',
    contexto: 'La brújula apunta al norte magnético porque la Tierra tiene un campo magnético de unas 30 µT en Colombia. Una bobina de 50 vueltas con una corriente de 85 mA produce en su centro un campo de la misma magnitud: si la bobina se orienta en el plano norte–sur, la aguja se desvía 45°. Con esa idea, que Gauss y Weber usaron en el siglo XIX, el curso mide el campo terrestre local y lo compara con el modelo internacional IGRF-14 y con el magnetómetro del celular.',
    objetivos: [
      'Construir una bobina circular y alinearla con el meridiano magnético.',
      'Medir la desviación de la brújula en función de la corriente, invirtiendo la corriente para corregir errores de alineación.',
      'Obtener la componente horizontal del campo terrestre de la pendiente de tan θ contra I y compararla con el IGRF-14 y con el magnetómetro del celular.'
    ],
    prediccion: 'Si se duplica la corriente en la bobina, ¿se duplica el ángulo que gira la aguja? ¿Qué ángulo se obtiene cuando el campo de la bobina es igual al de la Tierra?',
    claves: [
      'En el centro de una espira circular de N vueltas y radio R, B = μ₀ N I / (2R), perpendicular al plano de la bobina.',
      'Si la bobina está en el plano norte–sur, su campo es perpendicular al campo terrestre horizontal B<sub>H</sub> y la aguja se orienta según la suma: tan θ = B / B<sub>H</sub>.',
      'La gráfica de tan θ contra I es una recta por el origen de pendiente μ₀ N / (2R B<sub>H</sub>).',
      'Invertir la corriente y promediar las dos desviaciones compensa una pequeña desalineación de la bobina.'
    ],
    materiales: [
      ['Alambre de cobre esmaltado de 0,4 mm (unos 35 m)', '1', 'Alambre de timbre', 12000],
      ['Aro de 20 cm de diámetro (balde cortado, tubo de PVC o cartón grueso)', '1', '—', 0],
      ['Brújula pequeña de aguja corta (2 a 3 cm) con escala en grados', '1', 'Aguja imantada en corcho sobre un transportador', 8000],
      ['Dos pilas AA en portapilas (3 V)', '1', '—', 6000],
      ['Resistencias de ½ W: 220, 100, 47, 33 y 22 Ω, o potenciómetro de 100 Ω', '5', '—', 1500],
      ['Multímetro en la escala de 200 mA', '1', '—', 30000],
      ['Interruptor y cables con caimanes', '1', '—', 4000],
      ['Celular con una aplicación de magnetómetro (por ejemplo, phyphox)', '1', '—', 0]
    ],
    montaje: [
      'Enrolle 50 vueltas de alambre esmaltado en el aro de 10 cm de radio y fíjelas con cinta; lije el esmalte de las puntas.',
      'Ponga la brújula en el centro de la bobina, sobre un soporte de madera o cartón, a la altura del plano medio de las espiras.',
      'Gire la bobina hasta que su plano contenga la aguja de la brújula (plano norte–sur magnético), sin corriente.',
      'Arme la serie pilas–resistencia–multímetro–interruptor–bobina con cables largos y trenzados, y aleje las pilas y el multímetro al menos 50 cm de la brújula.',
      'Trabaje en el patio o en una mesa de madera lejos de columnas, varillas, tuberías e imanes.'
    ],
    seguridad: [
      { p: 'Bobina con poca resistencia conectada directamente a las pilas', c: 'elec', ef: 'Calentamiento del alambre y de las pilas', ctrl: 'Siempre con una resistencia en serie; interruptor abierto entre medidas; no superar 150 mA.', nd: 2, ne: 2, nc: 10 },
      { p: 'Puntas de alambre lijadas', c: 'mec', ef: 'Pinchazos y cortes menores', ctrl: 'Doblar las puntas y cubrirlas con cinta al terminar.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Con la resistencia de 220 Ω, cierre el interruptor, anote la corriente y el ángulo de la aguja; ábralo de inmediato.',
      'Invierta los cables de la bobina y repita: anote el ángulo hacia el otro lado.',
      'Repita con las demás resistencias, de mayor a menor.',
      'Con el celular sobre la mesa en el lugar de la brújula, sin corriente, anote las componentes del campo y calcule B<sub>H</sub> = √(Bx² + By²) y la inclinación.',
      'Consulte en el cuaderno el valor del IGRF-14 para su municipio (selector de la barra superior).'
    ],
    tabla: { cols: ['<i>R</i> (Ω)', '<i>I</i> (mA)', 'θ₊ (°)', 'θ₋ (°)', 'θ medio (°)', 'tan θ'], filas: 7 },
    analisis: [
      'Grafique tan θ medio contra I (en amperios) y ajuste una recta por el origen.',
      'Calcule B<sub>H</sub> = μ₀ N / (2R · pendiente) con su incertidumbre, propagando las de N, R y la pendiente.',
      'Compare con el IGRF-14 de su municipio y con el magnetómetro del celular: ¿cuál de las diferencias es mayor y por qué?',
      'Explique por qué conviene que los ángulos estén entre 30° y 60°.'
    ],
    esperado: 'En Popayán, el IGRF-14 para octubre de 2026 da B<sub>H</sub> = 26,7 µT, con declinación de 6,8° al oeste e inclinación de 23,8°. Con N = 50 y R = 10 cm, la bobina produce 314 µT por amperio: la aguja se desvía 45° con 85 mA y 49,7° con 100 mA. En Bogotá B<sub>H</sub> = 26,8 µT; en Leticia, 25,5 µT; en San Andrés, 27,0 µT. Dentro de un edificio el campo medido puede diferir varios microteslas del IGRF por el acero de la estructura.',
    errores: [
      ['Pilas, multímetro o cables cerca de la brújula.', 'Sus campos y el hierro de las pilas desvían la aguja; los cables de ida y vuelta deben ir trenzados.'],
      ['No invertir la corriente.', 'Si la bobina está desalineada unos grados, las desviaciones a uno y otro lado difieren; el promedio corrige el error.'],
      ['Aguja larga respecto al radio.', 'El campo no es uniforme lejos del centro; la aguja debe medir menos de un tercio del radio.'],
      ['Ángulos muy pequeños o muy grandes.', 'Cerca de 0° y de 90° un error de 1° en el ángulo produce un error grande en tan θ.']
    ],
    orientadoras: [
      '¿Cómo podría la corriente de una bobina competir con el campo de la Tierra sobre la aguja?',
      '¿Cómo debe orientarse la bobina para que el análisis sea sencillo?',
      '¿Qué gráfica permitiría obtener el campo terrestre de las medidas?',
      '¿Cómo comprobarán su resultado con otra fuente independiente?'
    ],
    abierta: 'Midan la componente horizontal del campo magnético en cinco lugares del colegio (patio, salón, laboratorio, junto a una columna y junto a una reja) con la brújula de tangentes o con el celular, y elaboren un mapa magnético del colegio que explique las diferencias con el IGRF.',
    preguntas: [
      '¿Por qué la brújula no apunta al norte geográfico en Colombia? ¿Cuánto se aparta en su municipio?',
      '¿Qué indica la inclinación magnética y por qué es pequeña en Colombia?',
      '¿Cómo cambiaría la pendiente si la bobina tuviera el doble de radio?',
      '¿Qué ventaja tiene un par de bobinas de Helmholtz frente a una sola bobina?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un estudiante coloca una brújula en el centro de una bobina orientada en el plano norte–sur. Con cierta corriente, la aguja gira 45°. Esto indica que, en el centro de la bobina,',
      opciones: ['el campo de la bobina es nulo.', 'el campo de la bobina es igual en magnitud a la componente horizontal del campo terrestre.', 'el campo de la bobina es el doble del campo terrestre.', 'el campo terrestre desapareció.'],
      clave: 'B',
      just: 'La aguja sigue la suma de dos campos perpendiculares; tan θ = B / B<sub>H</sub> = 1 cuando son iguales.'
    },
    rubrica: [['Campo magnético', 'Observa la desviación sin cuantificarla.', 'Relaciona la desviación con la corriente.', 'Obtiene B<sub>H</sub> de la pendiente con incertidumbre.', 'Compara con el IGRF y el celular y explica las diferencias por fuentes locales.']],
    referencias: ['IAGA, International Geomagnetic Reference Field, 14.ª generación (IGRF-14), 2024.', 'S. Staacks et al., «Advanced tools for smartphone-based experiments: phyphox», <i>Physics Education</i> 53, 045009 (2018).', 'MEN, DBA de Ciencias Naturales V.1, grado 11.°, DBA 2.']
  });
})();
