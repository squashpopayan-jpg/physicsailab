/* Práctica F10-03 · Péndulo simple y gravedad local */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'pendulo', cod: 'F10-03', titulo: 'El péndulo simple y la gravedad del municipio', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes (cronometrista, observador, registrador)', nivel: 1,
    dba: ['10.2'], est: ['C3', 'C5', 'C6', 'C10', 'C14', 'F1', 'F2'], comp: ['ind', 'uso'], temas: ['Energía mecánica', 'Campo gravitacional'],
    pregunta: '¿De qué depende el periodo de un péndulo y cuánto vale la aceleración de la gravedad en nuestro municipio?',
    contexto: 'Los relojes de péndulo marcaron la hora en iglesias y casas durante tres siglos porque un péndulo oscila con un ritmo muy regular. Ese ritmo depende de la longitud del hilo y de la gravedad del lugar: por eso un péndulo es también un instrumento para medir <i>g</i>.',
    objetivos: [
      'Identificar experimentalmente de qué variables depende el periodo de un péndulo simple.',
      'Medir el periodo con una incertidumbre menor que el tiempo de reacción, cronometrando varias oscilaciones.',
      'Linealizar la relación entre periodo y longitud para obtener <i>g</i> con su incertidumbre y compararla con el valor de referencia del municipio.'
    ],
    prediccion: 'Si se duplica la masa que cuelga, ¿cambia el periodo? Si se cuadruplica la longitud del hilo, ¿qué le pasa al periodo? Escriban su predicción y la razón que la sostiene.',
    claves: [
      'El periodo <i>T</i> es el tiempo de una oscilación completa: ida y vuelta.',
      'Para amplitudes pequeñas (hasta unos 10°), <i>T</i> = 2π √(<i>L</i>/<i>g</i>): no depende de la masa ni de la amplitud.',
      '<i>L</i> se mide desde el punto de suspensión hasta el centro de la masa.',
      'Al graficar <i>T</i>² contra <i>L</i> se obtiene una recta cuya pendiente vale 4π²/<i>g</i>.',
      'Cronometrar 10 oscilaciones y dividir entre 10 reduce diez veces el efecto del tiempo de reacción.'
    ],
    materiales: [
      ['Hilo de nailon delgado (0,3 a 0,5 mm) o hilo de pescar', '2 m', 'Hilo de coser grueso (se estira más)', 1000],
      ['Masa compacta: tuerca M12 o perno de 30 a 60 g', '2', 'Plomada de construcción; bola de plastilina forrada en cinta', 1500],
      ['Prensa en C de 3 pulgadas', '1', 'Soporte universal; palo de escoba entre dos sillas', 9000],
      ['Pinza de ropa de madera para fijar el punto de suspensión', '1', 'Dos tablitas y un tornillo', 500],
      ['Flexómetro de 3 m (resolución 1 mm)', '1', 'Regla de 1 m', 8000],
      ['Cronómetro del celular (resolución 0,01 s)', '1', 'App phyphox, cronómetro acústico', 0],
      ['Transportador impreso en cartulina', '1', 'Plantilla del apéndice B', 500],
      ['Cinta de enmascarar', '1 rollo', '—', 3000]
    ],
    montaje: [
      'Fije la prensa en C al borde de la mesa con la varilla o el brazo saliendo hacia afuera, de modo que el péndulo cuelgue libre del borde.',
      'Prense el hilo entre las dos mitades de la pinza de ropa y apriete la pinza en el brazo: así el punto de suspensión queda definido por el borde de la pinza y no se desliza.',
      'Amarre la tuerca con un nudo doble y corte el sobrante. Marque con cinta la longitud deseada sobre el hilo para cambiarla rápido.',
      'Pegue el transportador detrás del punto de suspensión para soltar siempre desde el mismo ángulo (10° o menos).',
      'Mida <i>L</i> con el flexómetro desde el borde de la pinza hasta el centro de la tuerca; anote la resolución del flexómetro.'
    ],
    seguridad: [
      { p: 'Caída del soporte o de la masa', c: 'mec', ef: 'Golpe leve en manos o pies', ctrl: 'Prensa bien ajustada y probada antes de colgar; masas de máximo 100 g; nadie se ubica bajo la masa.', nd: 2, ne: 2, nc: 10 },
      { p: 'Masa que oscila a la altura de la cara', c: 'mec', ef: 'Golpe en la cara o los ojos', ctrl: 'Amplitud de 10° o menos; el equipo se ubica a un lado del plano de oscilación, nunca en su trayectoria.', nd: 2, ne: 3, nc: 10 },
      { p: 'Tropiezos con hilos y bolsos en el piso', c: 'loc', ef: 'Caídas', ctrl: 'Montaje sobre la mesa; pasillos despejados (1,4 m entre mesas según la NTC 4595).', nd: 0, ne: 2, nc: 25 }
    ],
    epp: 'no se requieren; cabello recogido.',
    procedimiento: [
      'Con <i>L</i> ≈ 0,80 m, suelte la masa desde 10° sin empujarla. Practique el conteo: el cronometrista inicia en «cero» cuando la masa pasa por el punto más bajo y detiene en «diez».',
      'Mida el tiempo de 10 oscilaciones tres veces. Si los tres valores difieren más de 0,3 s, revise el conteo y repita.',
      'Cambie la masa (cuelgue dos tuercas) sin cambiar <i>L</i> y repita el paso 2. Luego cambie la amplitud a 5° y a 20° con la masa original.',
      'Varíe la longitud: al menos seis valores entre 0,30 m y 1,20 m. Para cada uno mida tres veces el tiempo de 10 oscilaciones.',
      'Registre todo en la tabla, incluidas las medidas que parezcan raras; anote su causa probable en lugar de borrarlas.'
    ],
    tabla: { cols: ['<i>L</i> (m)', '<i>t</i>₁₀ ensayo 1 (s)', '<i>t</i>₁₀ ensayo 2 (s)', '<i>t</i>₁₀ ensayo 3 (s)', '<i>T</i> promedio (s)', '<i>T</i>² (s²)'], filas: 7 },
    analisis: [
      'Calcule para cada longitud el periodo promedio <i>T</i> = <i>t</i>₁₀/10 y su incertidumbre tipo A: la desviación estándar de los tres valores dividida entre √3 y entre 10.',
      'Con los datos de masa y amplitud, decida si esas variables cambian el periodo más allá de la incertidumbre.',
      'Grafique <i>T</i> contra <i>L</i>. ¿Es una recta? Grafique ahora <i>T</i>² contra <i>L</i> y ajuste una recta por mínimos cuadrados.',
      'Obtenga <i>g</i> = 4π²/pendiente y su incertidumbre <i>u</i>(<i>g</i>) = <i>g</i> · <i>u</i>(pendiente)/pendiente.',
      'Compare con el valor de referencia del municipio mediante z = |<i>g</i> − <i>g</i><sub>ref</sub>| / √(<i>u</i>² + <i>u</i><sub>ref</sub>²). Si z ≤ 2, los valores son compatibles.'
    ],
    esperado: 'La masa no cambia el periodo. La amplitud lo cambia muy poco: a 20° el periodo es 0,8 % mayor que a ángulos pequeños. La gráfica de T² contra L es una recta que pasa cerca del origen; con 10 oscilaciones cronometradas a mano se obtiene g con una incertidumbre de 1 % a 2 %, compatible con la referencia (9,776 m/s² en Popayán, 9,774 m/s² en Bogotá, 9,782 m/s² en Barranquilla).',
    errores: [
      ['Medir L hasta el nudo o hasta el borde de la masa.', 'L va hasta el centro de masa. Con una tuerca de 2 cm el error es de 1 cm: si se calcula g punto por punto, el sesgo es de 2 % para L = 0,5 m. El ajuste de T² contra L con intercepto lo absorbe en el corte, que deja de ser cero; por eso conviene ajustar con intercepto y examinarlo.'],
      ['Soltar desde ángulos grandes.', 'A 30° el periodo es 1,7 % mayor que la fórmula de ángulos pequeños; el ajuste da g sesgada hacia abajo.'],
      ['Contar «uno» al soltar.', 'Así se cronometran nueve oscilaciones y no diez: g sale 23 % mayor. Se cuenta «cero» en el primer paso por el punto más bajo.'],
      ['Péndulo que gira en elipse.', 'Si se empuja al soltar, la masa describe un cono; se suelta sin velocidad y se descarta la medida si gira.'],
      ['Soporte que se flexiona.', 'Un brazo flexible alarga el periodo; se usa la prensa y un brazo corto y rígido.']
    ],
    orientadoras: [
      '¿De qué variables podría depender el periodo: longitud, masa, amplitud, material del hilo? ¿Cómo cambiarán una sola a la vez?',
      'Si el tiempo de reacción es de unos 0,2 s, ¿cómo medirán un periodo de 1,5 s con mejor precisión?',
      '¿Hasta qué punto de la masa medirán la longitud y por qué?',
      '¿Qué gráfica les permite obtener <i>g</i> a partir de una recta?'
    ],
    abierta: 'El reloj de péndulo de la casa de un compañero se atrasa dos minutos por día. Diseñen una investigación para descubrir qué determina el ritmo de un péndulo, usen sus resultados para proponer cómo corregir el reloj y midan la gravedad de su municipio con la mejor precisión que puedan.',
    preguntas: [
      '¿Depende el periodo de la masa? Justifique con sus datos y sus incertidumbres, no solo con la teoría.',
      '¿Por qué conviene cronometrar 10 oscilaciones en lugar de una? ¿Por qué no 100?',
      'Según la tabla de datos locales, la gravedad en Bogotá y en Barranquilla difiere en 0,08 %. ¿Podría su montaje detectar esa diferencia? ¿Qué cambiaría?',
      'Describa las transformaciones de energía durante una oscilación. ¿Por qué la amplitud disminuye con el tiempo?',
      '¿Qué longitud debe tener un péndulo para que cada oscilación dure exactamente 2 s en su municipio?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un grupo mide el periodo <i>T</i> de un péndulo para seis longitudes <i>L</i> distintas y quiere obtener el valor de la gravedad a partir de la pendiente de una recta. Según el modelo <i>T</i> = 2π √(<i>L</i>/<i>g</i>), la gráfica que deben construir es',
      opciones: ['<i>T</i> en función de <i>L</i>.', '<i>T</i>² en función de <i>L</i>.', '<i>T</i> en función de <i>L</i>².', '<i>T</i> en función de la masa.'],
      clave: 'B',
      just: 'Elevando al cuadrado, <i>T</i>² = (4π²/<i>g</i>) <i>L</i>: una recta que pasa por el origen y cuya pendiente es 4π²/<i>g</i>. La opción A da una curva; C no corresponde al modelo; D no permite obtener <i>g</i> porque <i>T</i> no depende de la masa.'
    },
    rubrica: [['Uso del modelo del péndulo', 'No relaciona el periodo con la longitud.', 'Reconoce que T crece con L, sin cuantificar.', 'Linealiza con T² y obtiene g con su incertidumbre.', 'Explica el efecto de la amplitud y del tamaño de la masa y corrige o descarta datos con criterio.']],
    referencias: ['R. A. Nelson y M. G. Olsson, «The pendulum — Rich physics from a simple system», <i>American Journal of Physics</i> 54 (2), 112–121, 1986.', 'MEN, Derechos Básicos de Aprendizaje de Ciencias Naturales V.1, grado 10.°, DBA 2, 2016.']
  });
})();
