/* Práctica F10-05 · Fricción estática y cinética en un plano inclinado */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'friccion', cod: 'F10-05', titulo: 'Fricción estática y cinética en un plano inclinado', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 2,
    dba: ['10.1'], est: ['C2', 'C3', 'C5', 'C10', 'C12', 'F1', 'F2'], comp: ['ind', 'exp'], temas: ['Dinámica'],
    pregunta: '¿Qué tan inclinada debe estar una superficie para que un bloque empiece a deslizar, y por qué una vez en movimiento acelera aunque se reduzca un poco la inclinación?',
    contexto: 'Los conductores de las vías de montaña del Cauca y de Nariño saben que una pendiente mojada no se comporta igual que una seca, y que un carro que empieza a patinar es más difícil de detener. La fricción estática y la cinética son distintas, y ambas se pueden medir con una tabla, un bloque y el celular.',
    objetivos: [
      'Medir el coeficiente de fricción estática a partir del ángulo crítico en que el bloque empieza a deslizar.',
      'Medir el coeficiente de fricción cinética a partir de la aceleración del bloque a varios ángulos.',
      'Explicar con un diagrama de fuerzas por qué μ<sub>s</sub> > μ<sub>k</sub> se manifiesta como un deslizamiento que, una vez iniciado, continúa.'
    ],
    prediccion: '¿Depende el ángulo al que el bloque empieza a deslizar de su masa? ¿Y del área de la cara apoyada? Escriban su predicción y su razón antes de medir.',
    claves: [
      'En el plano inclinado, la componente del peso a lo largo del plano es mg sen θ y la normal es N = mg cos θ.',
      'Justo antes de deslizar, la fricción estática alcanza su máximo μ<sub>s</sub> N: tan θ<sub>c</sub> = μ<sub>s</sub>. No depende de la masa.',
      'Deslizando, la fricción cinética vale μ<sub>k</sub> N y a = g (sen θ − μ<sub>k</sub> cos θ).',
      'Si se grafica a/(g cos θ) contra tan θ, se obtiene una recta de pendiente 1 cuyo intercepto es −μ<sub>k</sub>.'
    ],
    materiales: [
      ['Tabla de MDF o madera de 80 cm × 20 cm, lisa', '1', 'Puerta de un mueble, carpeta rígida', 8000],
      ['Bisagra o cinta para articular la tabla con una base', '1', 'Apoyar un extremo en libros', 2000],
      ['Bloque de madera de unos 8 × 5 × 3 cm', '2', 'Borrador grande, caja de fósforos con arena', 1000],
      ['Recubrimientos: lija fina, fieltro, plástico, papel', '1 juego', 'Retazos disponibles', 2000],
      ['Celular con inclinómetro (phyphox) o transportador', '1', 'Regla para medir alturas y calcular el ángulo', 0],
      ['Cinta métrica y cronómetro del celular', '1', 'Video para medir la aceleración', 0],
      ['Masas adicionales (tuercas) pegables con cinta', '4', 'Monedas', 1000]
    ],
    montaje: [
      'Articule la tabla a una base con la bisagra para poder inclinarla suavemente; limpie su superficie con un paño seco.',
      'Marque en la tabla dos líneas separadas 50 cm para medir tiempos de recorrido.',
      'Coloque el celular sobre la tabla con la aplicación de inclinómetro, o mida la altura h del extremo levantado y la longitud L: sen θ = h/L.',
      'Prepare cada bloque con una cara cubierta de un material distinto, pegado sin arrugas.'
    ],
    seguridad: [
      { p: 'Bloque o tabla que caen al piso', c: 'mec', ef: 'Golpes leves en los pies', ctrl: 'Trabajar sobre la mesa, con un tope al pie de la tabla.', nd: 2, ne: 2, nc: 10 },
      { p: 'Astillas de la tabla y de la lija', c: 'mec', ef: 'Cortes o astillas en los dedos', ctrl: 'Tabla lijada en los bordes; manipular la lija por el reverso.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Coloque el bloque en reposo sobre la tabla horizontal, espere 5 s y levante la tabla muy despacio hasta que el bloque empiece a deslizar. Anote el ángulo crítico.',
      'Repita diez veces con la misma cara. Cambie la masa (agregue tuercas) y repita cinco veces; cambie la cara de apoyo (más área) y repita cinco veces.',
      'Fije la tabla en un ángulo mayor que el crítico. Suelte el bloque desde la primera marca y cronometre el recorrido de 50 cm tres veces.',
      'Repita el paso 3 con al menos cuatro ángulos distintos.',
      'Repita todo con otro material de contacto.'
    ],
    tabla: { cols: ['Superficie', 'θ<sub>c</sub> (°)', 'θ (°)', '<i>t</i>₅₀ (s)', '<i>a</i> = 2<i>d</i>/<i>t</i>² (m/s²)', 'a/(g cos θ)', 'tan θ'], filas: 8 },
    analisis: [
      'Calcule el promedio de θ<sub>c</sub> y su incertidumbre tipo A; μ<sub>s</sub> = tan θ<sub>c</sub>, con u(μ<sub>s</sub>) = u(θ<sub>c</sub>)/cos²θ<sub>c</sub> (θ en radianes).',
      'Decida, con z, si la masa o el área de contacto cambian el ángulo crítico.',
      'Con los tiempos, calcule a = 2d/t² para cada ángulo.',
      'Grafique a/(g cos θ) contra tan θ y ajuste una recta; verifique que la pendiente sea cercana a 1 y obtenga μ<sub>k</sub> = −intercepto.',
      'Compare μ<sub>s</sub> y μ<sub>k</sub> para cada par de materiales.'
    ],
    esperado: 'Para madera sobre madera seca se obtienen típicamente μ<sub>s</sub> entre 0,3 y 0,5 y μ<sub>k</sub> algo menor; los valores dependen mucho del acabado, la humedad y la limpieza, y por eso se miden en lugar de consultarse. El ángulo crítico no cambia con la masa ni con el área dentro de la incertidumbre. Con μ<sub>k</sub> = 0,30 y θ = 25°, el bloque acelera con 1,47 m/s² y recorre 50 cm en 0,82 s.',
    errores: [
      ['Levantar la tabla rápido o con golpes.', 'La vibración dispara el deslizamiento antes de tiempo y θ<sub>c</sub> sale bajo; se levanta lentamente y sin sacudidas.'],
      ['Esperar distinto tiempo en reposo.', 'La fricción estática crece con el tiempo de contacto; se espera siempre lo mismo antes de levantar.'],
      ['Empujar el bloque al soltarlo para la parte cinética.', 'Se suelta desde el reposo; si no arranca solo, el ángulo es demasiado pequeño.'],
      ['Concluir que μ<sub>s</sub> depende del área con pocas medidas.', 'La dispersión de θ<sub>c</sub> es grande: se necesitan varias repeticiones y la comparación con z.']
    ],
    orientadoras: [
      '¿Qué condición se cumple justo cuando el bloque empieza a deslizar? Dibujen el diagrama de fuerzas.',
      '¿Cómo medirán el ángulo con la mejor precisión posible?',
      '¿Cómo obtendrán la aceleración del bloque una vez que desliza?',
      '¿Qué variables (masa, área, material, tiempo en reposo) pondrán a prueba y cómo controlarán las demás?'
    ],
    abierta: 'Una fábrica de calzado quiere saber qué suela agarra mejor en el piso de baldosa de un colegio, seco y mojado. Diseñen una investigación con un plano inclinado para comparar materiales de suela y propongan cómo informar el resultado.',
    preguntas: [
      '¿Depende el ángulo crítico de la masa del bloque? ¿Qué dice su respuesta sobre la relación entre fricción y normal?',
      '¿Por qué una vez que el bloque empieza a deslizar ya no se detiene, aunque se baje un poco la tabla?',
      '¿Qué significaría físicamente que la pendiente de su gráfica fuera claramente distinta de 1?',
      '¿Por qué los frenos ABS buscan que las ruedas no se bloqueen?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un bloque en reposo sobre una tabla empieza a deslizar cuando la tabla forma 22° con la horizontal. Si se coloca sobre el bloque otro bloque idéntico, el ángulo al que empiezan a deslizar juntos es',
      opciones: ['11°, porque el peso se duplica.', '22°, porque la fricción máxima y la componente del peso crecen en la misma proporción.', '44°, porque la normal se duplica.', 'mayor que 22°, porque aumenta el área de contacto.'],
      clave: 'B',
      just: 'En el ángulo crítico, mg sen θ = μ<sub>s</sub> mg cos θ: la masa se cancela y tan θ<sub>c</sub> = μ<sub>s</sub>. Duplicar la masa duplica a la vez la fuerza que hace deslizar y la fricción máxima.'
    },
    rubrica: [['Modelo de fricción', 'Confunde fricción estática y cinética.', 'Calcula μ<sub>s</sub> con el ángulo crítico.', 'Obtiene μ<sub>s</sub> y μ<sub>k</sub> con incertidumbre y diagrama de fuerzas.', 'Pone a prueba la independencia de la masa y del área con z y explica los límites del modelo.']],
    referencias: ['F. P. Bowden y D. Tabor, <i>The Friction and Lubrication of Solids</i>, Oxford, 1950.']
  });
})();
