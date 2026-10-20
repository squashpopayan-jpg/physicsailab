/* Práctica F10-08 · Conservación de la energía: rampa y lanzamiento horizontal */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'energia', cod: 'F10-08', titulo: 'Conservación de la energía: rampa y lanzamiento horizontal', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '4 estudiantes (lanzador, observador del punto de caída, medidor, registrador)', nivel: 1,
    dba: ['10.2', '9.1'], est: ['C2', 'C4', 'C5', 'C10', 'C14', 'F1', 'F2'], comp: ['uso', 'exp'], temas: ['Energía mecánica', 'Cinemática'],
    pregunta: '¿Se puede predecir dónde caerá una esfera que baja por una rampa y sale disparada de la mesa usando solo la conservación de la energía?',
    contexto: 'En los parques de diversiones y en las competencias de carros de balineras, la velocidad al final de una bajada depende de la altura de la que se parte. La conservación de la energía permite predecirla; un lanzamiento horizontal permite comprobarla midiendo solo distancias, sin cronómetro.',
    objetivos: [
      'Predecir con la conservación de la energía la velocidad de una esfera al final de una rampa y su alcance al caer desde la mesa.',
      'Medir el alcance para varias alturas de partida y linealizar D² contra h.',
      'Explicar la diferencia entre la predicción sin rotación y la medida, en términos de la energía de rotación y de las pérdidas.'
    ],
    prediccion: 'Si se suelta la esfera desde el doble de altura, ¿caerá al doble de distancia? ¿Una esfera que rueda llega más lejos o más cerca que un objeto que se deslizara sin fricción? Expliquen.',
    claves: [
      'Si no hay pérdidas, la energía potencial mgh se convierte en energía cinética al final de la rampa.',
      'Una esfera que rueda reparte la energía entre traslación y rotación: v² = 2gh/(1 + β), con β = 2/5 para una esfera maciza sobre un plano.',
      'Desde una mesa de altura H, el tiempo de caída es √(2H/g) y el alcance horizontal D = v √(2H/g).',
      'Combinando: D = 2 √(hH/(1 + β)), que no depende de g ni de la masa. D² es proporcional a h.'
    ],
    materiales: [
      ['Riel de cortina o perfil en U de 1 m, curvado suavemente en su extremo inferior', '1', 'Manguera transparente cortada a lo largo y fijada con cinta', 10000],
      ['Esfera de acero de 3/4 pulgada o canica', '2', 'Bola de cicla grande', 3000],
      ['Soporte o pila de libros para sostener la rampa', '1', 'Soporte universal', 0],
      ['Papel carbón y hojas blancas o periódico', '4 hojas', 'Bandeja con arena fina o harina', 2000],
      ['Plomada (hilo con tuerca)', '1', '—', 500],
      ['Flexómetro', '1', 'Cinta métrica', 8000],
      ['Cinta de enmascarar', '1', '—', 3000]
    ],
    montaje: [
      'Fije la rampa al borde de la mesa de modo que su tramo final quede horizontal y a ras del borde.',
      'Con la plomada, marque en el piso el punto justo debajo del extremo de la rampa: es el origen del alcance.',
      'Mida la altura H del extremo de la rampa sobre el piso.',
      'Marque en la rampa puntos de partida con alturas h de 5, 10, 15, 20, 25 y 30 cm sobre el extremo horizontal.',
      'Pegue en el piso hojas blancas con papel carbón encima, en la zona donde caerá la esfera.'
    ],
    seguridad: [
      { p: 'Esfera que rebota y rueda por el salón', c: 'loc', ef: 'Tropiezos y caídas', ctrl: 'Barrera de libros o caja detrás de la zona de impacto; recoger la esfera después de cada lanzamiento.', nd: 2, ne: 3, nc: 10 },
      { p: 'Personas agachadas en la trayectoria', c: 'mec', ef: 'Golpe de la esfera', ctrl: 'Nadie se ubica entre la mesa y la zona de impacto durante el lanzamiento; se lanza a la cuenta de tres.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Suelte la esfera desde h = 10 cm sin empujarla y observe dónde cae. Ajuste la posición de las hojas.',
      'Para cada altura h, haga cinco lanzamientos. Cada uno deja una marca en el papel.',
      'Mida la distancia horizontal D desde el punto de la plomada hasta el centro del grupo de marcas de cada altura.',
      'Mida el ancho del canal donde rueda la esfera y el diámetro de la esfera con un calibrador.'
    ],
    tabla: { cols: ['<i>h</i> (m)', '<i>D</i> promedio (m)', 'dispersión de <i>D</i> (m)', '<i>D</i>² (m²)', '<i>D</i> predicho sin rotación (m)', '<i>D</i> predicho con rotación (m)'], filas: 7 },
    analisis: [
      'Calcule el promedio de D y la incertidumbre tipo A para cada altura.',
      'Grafique D² contra h y ajuste una recta por el origen.',
      'La pendiente vale 4H/(1 + β). Despeje β experimental y compárelo con 2/5 y con el β que corresponde al canal (práctica F10-02).',
      'Calcule el porcentaje de energía que se perdió respecto de la predicción con rotación.'
    ],
    esperado: 'Con H = 0,80 m, una esfera de 19 mm en un canal de 11 mm (β = 0,60) soltada desde 20 cm cae a 63,2 cm; si rodara sobre un plano (β = 0,40) caería a 67,6 cm, y si deslizara sin fricción, a 80,0 cm. La pendiente de D²–h es 2,00 m con β = 0,60. Las pérdidas en la curva y por rodadura reducen algo el alcance; el banco virtual las supone de 4 % de la energía, lo que acorta el alcance en 2 %.',
    errores: [
      ['Esperar el alcance de un objeto que desliza.', 'La esfera rueda: la mitad de la diferencia o más es energía de rotación, no error.'],
      ['Tramo final de la rampa inclinado.', 'Si la esfera sale hacia arriba o hacia abajo, la fórmula del lanzamiento horizontal no vale; se verifica con un nivel.'],
      ['Medir D desde el borde de la mesa.', 'El origen es la vertical del punto de salida, marcada con la plomada.'],
      ['Empujar la esfera al soltarla.', 'Se suelta con una regla que se retira hacia atrás.']
    ],
    orientadoras: [
      '¿Qué transformaciones de energía ocurren desde que se suelta la esfera hasta que toca el piso?',
      '¿Qué deben medir para predecir el alcance? ¿Pueden hacerlo sin cronómetro?',
      '¿Qué gráfica de sus datos debería ser una recta?',
      '¿Qué diferencia esperan entre una esfera que rueda y un cubo de hielo que desliza?'
    ],
    abierta: 'En una feria de ciencias se propone un concurso: quien suelte la esfera desde la altura exacta para que caiga dentro de un vaso colocado a una distancia dada, gana. Diseñen y validen un método para ganar el concurso con un solo intento.',
    preguntas: [
      '¿Por qué el alcance no depende de la gravedad del lugar? ¿Cambiaría el resultado en la Luna?',
      '¿A dónde va la energía que no se recupera como energía cinética de traslación?',
      '¿Cómo cambiaría el alcance con una esfera hueca del mismo radio?',
      'Usen sus datos para estimar qué fracción de la energía se disipa en la rampa.'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Una esfera maciza y un bloque que desliza sin fricción se sueltan desde la misma altura en dos rampas idénticas que terminan horizontales al borde de una mesa. Sobre el alcance horizontal de cada uno al caer al piso se puede afirmar que',
      opciones: ['es igual, porque ambos parten de la misma altura.', 'el bloque llega más lejos, porque toda su energía potencial se convierte en energía de traslación.', 'la esfera llega más lejos, porque rodar disminuye la fricción.', 'la esfera llega más lejos, porque su masa está más concentrada.'],
      clave: 'B',
      just: 'La esfera convierte parte de su energía potencial en energía de rotación, de modo que sale de la rampa con menor velocidad de traslación. El tiempo de caída es el mismo para ambos, así que el bloque, más rápido, llega más lejos.'
    },
    rubrica: [['Uso de la conservación de la energía', 'No relaciona altura y velocidad.', 'Predice el alcance sin considerar la rotación.', 'Predice con el factor de rotación y obtiene β de la gráfica.', 'Cuantifica las pérdidas y argumenta sus causas con evidencia.']],
    referencias: ['MEN, DBA de Ciencias Naturales V.1, grado 10.°, DBA 2.']
  });
})();
