/* Práctica F11-04 · Lentes convergentes: distancia focal y aumento */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'lentes', cod: 'F11-04', titulo: 'Lentes convergentes: distancia focal y formación de imágenes', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'T2'], comp: ['uso', 'ind'], temas: ['Ondas'],
    pregunta: '¿Dónde forma una lupa la imagen de un objeto luminoso, de qué tamaño, y cómo se mide su distancia focal con la mejor precisión?',
    contexto: 'Las cámaras de los celulares, los proyectores, los anteojos y el ojo mismo forman imágenes con lentes. Una lupa de papelería es una lente convergente: con ella, una linterna y una pantalla de cartulina se comprueba la ecuación de las lentes delgadas y se mide la distancia focal por dos métodos.',
    objetivos: [
      'Localizar la imagen real que forma una lente convergente para varias distancias del objeto.',
      'Obtener la distancia focal por linealización de la ecuación de las lentes delgadas y por el método de Bessel.',
      'Relacionar el aumento con las distancias del objeto y de la imagen.'
    ],
    prediccion: 'Si el objeto se acerca a la lupa, ¿la imagen en la pantalla se aleja o se acerca? ¿Se agranda o se achica? ¿Qué pasa si el objeto está más cerca de la lupa que su foco?',
    claves: [
      'Ecuación de las lentes delgadas: 1/f = 1/s<sub>o</sub> + 1/s<sub>i</sub>, con s<sub>o</sub> y s<sub>i</sub> medidas desde la lente.',
      'Para s<sub>o</sub> > f la imagen es real e invertida y se puede proyectar; para s<sub>o</sub> < f es virtual (la lupa como lupa).',
      'Aumento lateral: M = −s<sub>i</sub>/s<sub>o</sub>; la imagen es más grande cuando el objeto está entre f y 2f.',
      'Graficando 1/s<sub>i</sub> contra 1/s<sub>o</sub> se obtiene una recta de pendiente −1 cuyo intercepto es 1/f.'
    ],
    materiales: [
      ['Lupa de papelería de 5 a 7 cm de diámetro (f ≈ 10 cm)', '1', 'Lente de unas gafas para leer de +3 o más dioptrías', 5000],
      ['Linterna LED con una flecha o una letra F recortada en cartulina negra', '1', 'Celular con una imagen de alto contraste en pantalla', 5000],
      ['Pantalla de cartulina blanca con base', '1', 'Hoja blanca pegada a un libro', 500],
      ['Regla de 1 m o flexómetro fijo sobre la mesa (banco óptico)', '1', 'Cinta métrica pegada en la mesa', 5000],
      ['Plastilina o pinzas de ropa para sostener lente y pantalla', '—', '—', 1000],
      ['Regla de 30 cm para medir los tamaños', '1', '—', 0]
    ],
    montaje: [
      'Fije la regla de 1 m sobre la mesa: será el banco óptico.',
      'Ubique la linterna con la flecha en el cero de la regla, la lupa vertical sobre un soporte de plastilina y la pantalla, todos a la misma altura y alineados.',
      'Oscurezca parcialmente el salón para ver bien la imagen.',
      'Estime f proyectando en la pantalla la imagen de una ventana lejana: la distancia lente–pantalla es aproximadamente f.'
    ],
    seguridad: [
      { p: 'Lupa que concentra la luz solar', c: 'term', ef: 'Quemaduras e incendio de papel', ctrl: 'Nunca dirigir la lupa al Sol ni dejarla al sol sobre la mesa; usar fuentes LED.', nd: 2, ne: 1, nc: 25 },
      { p: 'Mirar el Sol a través de la lupa', c: 'rad', ef: 'Lesión grave de la retina', ctrl: 'Prohibido; se advierte antes de empezar.', nd: 2, ne: 1, nc: 60 },
      { p: 'Vela o mechero como objeto', c: 'tec', ef: 'Quemaduras e incendio', ctrl: 'Sustitución: se usa linterna LED, no llama.', nd: 0, ne: 1, nc: 25 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Ubique la lente a 15 cm del objeto y mueva la pantalla hasta ver la imagen nítida. Anote s<sub>o</sub> y s<sub>i</sub>. Para estimar la incertidumbre, anote el rango de posiciones en que la imagen se ve nítida.',
      'Repita para s<sub>o</sub> = 18, 20, 25, 30, 40 y 50 cm.',
      'Para dos de las posiciones, mida la altura de la imagen y la del objeto.',
      'Método de Bessel: fije la pantalla a D = 60 cm del objeto y busque las dos posiciones de la lente que dan imagen nítida; mida su separación d. Repita con D = 50 cm y 70 cm.',
      'Acerque la lente a menos de f del objeto y mire a través de ella: describa la imagen.'
    ],
    tabla: { cols: ['<i>s</i><sub>o</sub> (m)', '<i>s</i><sub>i</sub> (m)', 'rango de nitidez (m)', '1/<i>s</i><sub>o</sub> (m⁻¹)', '1/<i>s</i><sub>i</sub> (m⁻¹)', 'aumento medido'], filas: 8 },
    analisis: [
      'Grafique 1/s<sub>i</sub> contra 1/s<sub>o</sub> y ajuste una recta. Compare la pendiente con −1 y obtenga f = 1/intercepto con su incertidumbre.',
      'Con el método de Bessel calcule f = (D² − d²)/(4D) para cada D y promedie.',
      'Compare los dos valores de f con z.',
      'Compare el aumento medido con −s<sub>i</sub>/s<sub>o</sub>.'
    ],
    esperado: 'Con una lupa de f = 10,0 cm: un objeto a 15 cm forma imagen a 30 cm (aumento −2), a 20 cm forma imagen a 20 cm (aumento −1) y a 30 cm, a 15 cm. Con D = 60 cm, las dos posiciones de Bessel están a 12,7 cm y 47,3 cm del objeto, separadas 34,6 cm. La profundidad de enfoque introduce incertidumbres de 0,5 cm a 1 cm en s<sub>i</sub>; f sale con 1 % a 3 %.',
    errores: [
      ['Medir desde el borde de la lupa.', 'Las distancias van desde el plano central de la lente (lente delgada).'],
      ['Objeto, lente y pantalla desalineados.', 'La imagen se deforma y su posición es ambigua; se alinean a la misma altura.'],
      ['Tomar una sola posición de nitidez.', 'La imagen se ve nítida en un rango; su centro es la mejor estimación y su semiancho, la incertidumbre.'],
      ['Usar la llama de una vela.', 'Es un riesgo de incendio y un objeto que parpadea; se reemplaza por una linterna LED.']
    ],
    orientadoras: [
      '¿Cómo encontrarán la posición de la imagen y con qué incertidumbre?',
      '¿Qué gráfica les permite obtener la distancia focal a partir de una recta?',
      '¿Cómo podrían medir la distancia focal sin medir directamente s<sub>o</sub> y s<sub>i</sub> con precisión?',
      '¿Qué cambia cuando el objeto está más cerca de la lente que el foco?'
    ],
    abierta: 'Construyan un proyector casero con una lupa y la pantalla de un celular. Investiguen cómo elegir las distancias para obtener una imagen nítida del tamaño de un tablero y midan la distancia focal de la lente con la mejor precisión que puedan.',
    preguntas: [
      '¿Por qué la imagen proyectada está invertida?',
      '¿Qué pasa con la imagen si se tapa la mitad de la lente? Pruébelo y explíquelo.',
      '¿Cómo funciona una cámara? ¿Qué se mueve cuando el celular «enfoca»?',
      '¿Cuántas dioptrías tiene su lupa? (La potencia en dioptrías es 1/f, con f en metros.)'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Con una lente convergente de distancia focal 10 cm se quiere proyectar en una pantalla una imagen del mismo tamaño que el objeto. El objeto y la pantalla deben ubicarse, respectivamente, a',
      opciones: ['5 cm y 5 cm de la lente.', '10 cm y 10 cm de la lente.', '20 cm y 20 cm de la lente.', '40 cm y 10 cm de la lente.'],
      clave: 'C',
      just: 'Con 1/f = 1/s<sub>o</sub> + 1/s<sub>i</sub> y aumento −s<sub>i</sub>/s<sub>o</sub> = −1, s<sub>o</sub> = s<sub>i</sub> = 2f = 20 cm. Con el objeto en el foco la imagen se forma en el infinito.'
    },
    rubrica: [['Modelo de lente delgada', 'No localiza la imagen.', 'Localiza imágenes sin relacionarlas con f.', 'Obtiene f por dos métodos con incertidumbre.', 'Compara los métodos, explica la profundidad de enfoque y el aumento.']],
    referencias: ['E. Hecht, <i>Óptica</i>, 5.ª ed., Pearson, cap. 5.']
  });
})();
