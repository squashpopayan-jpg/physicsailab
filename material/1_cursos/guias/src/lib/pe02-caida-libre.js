/* Montaje elaborado FE-02 · Caída libre con valla y fotopuerta */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'caida-libre', cod: 'FE-02', titulo: 'Caída libre de precisión: valla de franjas y fotopuerta', grado: 10, tipo: 'elaborada',
    tiempo: 110, grupo: '3 estudiantes', nivel: 2,
    dba: ['9.1', '10.2'], est: ['C3', 'C5', 'C10', 'C14', 'C17', 'F2', 'F7'], comp: ['ind', 'uso'], temas: ['Cinemática', 'Campo gravitacional'],
    pregunta: '¿Con qué precisión podemos medir la aceleración de la gravedad del municipio, y alcanza esa precisión para notar que es distinta a la de otra ciudad?',
    contexto: 'La gravedad no es la misma en todo el país: en Bogotá es unos 8 mm/s² menor que en Barranquilla, por la altura y la latitud. Para notarlo hay que medir g con una incertidumbre menor que una parte en mil. Una tira transparente con franjas impresas que cae a través de una fotopuerta lo permite si se cuida cada fuente de error.',
    objetivos: [
      'Construir una valla de franjas y medir con una fotopuerta los instantes en que cada franja cruza el haz.',
      'Obtener g por linealización de la velocidad media de cada intervalo contra el tiempo.',
      'Construir el presupuesto de incertidumbre e identificar el error sistemático dominante (la escala de la valla).'
    ],
    prediccion: '¿Qué incertidumbre esperan en g: 10 %, 1 % o 0,1 %? ¿Qué limita más el resultado: el reloj del Arduino, la impresión de las franjas o la resistencia del aire?',
    claves: [
      'En caída libre la velocidad aumenta linealmente con el tiempo: v = v₀ + g t.',
      'Si las franjas están separadas s, la velocidad media entre dos franjas sucesivas es s/Δt y corresponde al instante medio del intervalo.',
      'La pendiente de la recta velocidad media contra tiempo medio es g.',
      'Medir entre bordes iguales (de una franja a la siguiente) elimina el efecto del ancho del haz (capítulo 13).'
    ],
    materiales: [
      ['Tira de acrílico o de transparencia gruesa de 35 × 4 cm', '1', 'Regla plástica transparente', 4000],
      ['Franjas impresas en transparencia con impresora láser, cada 2,00 cm, o cinta negra cortada', '1', 'Cinta aislante con regla', 2000],
      ['Arduino Uno o Nano y una fotopuerta (capítulo 13)', '1', '—', 35000],
      ['Soporte para la fotopuerta y caja con espuma para recibir la valla', '1', '—', 2000],
      ['Calibrador o regla metálica de 30 cm para verificar la separación de las franjas', '1', '—', 0],
      ['Plastilina o tuerca pegada abajo para que la valla caiga vertical', '1', '—', 500]
    ],
    montaje: [
      'Imprima en transparencia 15 franjas negras de 1,00 cm separadas 2,00 cm (de borde superior a borde superior) y péguela al acrílico.',
      'Verifique con el calibrador la distancia entre la primera y la última franja: es el dato que fija la escala.',
      'Fije la fotopuerta horizontal sobre la caja con espuma, con el haz perpendicular al plano de la valla.',
      'Cargue el programa del capítulo 13 que registra los instantes de bloqueo.'
    ],
    seguridad: [
      { p: 'Valla de acrílico que cae', c: 'mec', ef: 'Golpe leve; rotura del acrílico', ctrl: 'Soltar desde máximo 20 cm sobre la fotopuerta; caja con espuma debajo.', nd: 0, ne: 3, nc: 10 },
      { p: 'Equipo conectado al computador', c: 'elec', ef: 'Ninguno relevante (5 V)', ctrl: 'Alimentación por USB.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Sostenga la valla vertical justo encima de la fotopuerta, con la primera franja a unos 5 cm del haz, y suéltela sin girarla.',
      'Copie los instantes de bloqueo al computador. Repita diez caídas.',
      'Mida la temperatura y anote el municipio (para comparar con la gravedad de referencia del apéndice A).'
    ],
    tabla: { cols: ['Franja <i>i</i>', '<i>t</i><sub>i</sub> (s)', 'Δ<i>t</i> (s)', '<i>t</i> medio (s)', '<i>v</i> = <i>s</i>/Δ<i>t</i> (m/s)'], filas: 8 },
    analisis: [
      'Para cada caída, calcule las velocidades medias y grafíquelas contra el tiempo medio; ajuste una recta y obtenga g con su incertidumbre.',
      'Promedie las diez caídas y calcule la incertidumbre tipo A del promedio.',
      'Agregue la incertidumbre tipo B de la escala de la valla (verificación con calibrador) y combine.',
      'Compare con la gravedad de su municipio y con la de otra ciudad del apéndice A mediante z.'
    ],
    esperado: 'Con franjas cada 2 cm y el reloj de 4 µs del Arduino, cada caída da g con una incertidumbre del orden de 0,5 %, dominada por la posición de los bordes impresos; diez caídas bajan la parte aleatoria a unas 0,05 %. El límite real es la escala: si la impresora reduce la valla 0,5 %, g sale 0,5 % baja. Con unas veinte caídas y la escala verificada a mejor que 0,03 %, la diferencia entre Bogotá (9,774 m/s²) y Barranquilla (9,782 m/s²), de 0,08 %, empieza a ser detectable.',
    errores: [
      ['Confiar en la escala de la impresora.', 'Las impresoras escalan sin avisar; se verifica la distancia total con calibrador o regla metálica.'],
      ['Valla que gira o se inclina al caer.', 'Cambia la distancia efectiva entre franjas; se lastra abajo y se suelta sin girar.'],
      ['Usar bordes de subida y de bajada mezclados.', 'El ancho del haz introduce un error; se usa siempre el mismo tipo de borde.'],
      ['Ignorar la incertidumbre de la escala en la comparación.', 'Sin ella, z parece mayor de lo que es y se concluye una diferencia que no existe.']
    ],
    orientadoras: [
      '¿Cómo obtendrán velocidades a partir de los instantes que registra la fotopuerta?',
      '¿Qué gráfica les dará g como pendiente de una recta?',
      '¿Cuáles son todas las fuentes de incertidumbre y cuál esperan que domine?',
      '¿Cuántas caídas necesitan para que la parte aleatoria sea menor que la sistemática?'
    ],
    abierta: 'La gravedad cambia con la latitud y con la altura. Diseñen el experimento de caída libre más preciso que puedan con los materiales del colegio y determinen si su precisión permitiría distinguir la gravedad de su municipio de la de otra capital del país.',
    preguntas: [
      '¿Por qué la gravedad es menor en Bogotá que en Barranquilla? ¿Qué aporta la altura y qué la latitud?',
      '¿Qué fuente de error domina su presupuesto de incertidumbre y cómo la reduciría?',
      '¿Afecta la resistencia del aire a la valla? Estime su efecto.',
      '¿Cómo mide el Servicio Geológico Colombiano la gravedad con precisiones de micrómetros por segundo al cuadrado?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un grupo mide g diez veces con una valla impresa y obtiene un promedio con incertidumbre aleatoria de 0,02 %. Después descubre que la impresora redujo la valla 0,5 %. Para mejorar su resultado lo más conveniente es',
      opciones: ['repetir cien caídas más.', 'corregir la escala de la valla midiéndola con un instrumento de referencia.', 'usar un reloj de mayor resolución.', 'soltar la valla desde más alto.'],
      clave: 'B',
      just: 'El error de escala es sistemático: afecta igual a todas las caídas y no se reduce repitiendo. Domina el presupuesto (0,5 % frente a 0,02 %), así que debe corregirse midiendo la valla con un instrumento calibrado.'
    },
    rubrica: [['Presupuesto de incertidumbre', 'Da g sin incertidumbre.', 'Incluye solo la dispersión de las caídas.', 'Combina las incertidumbres aleatoria y de escala.', 'Identifica el término dominante, lo corrige y discute si puede distinguir dos ciudades.']],
    referencias: ['Capítulo 13 del cuaderno: fotopuertas y vallas.', 'Apéndice A: gravedad de referencia de los municipios (WGS84 con corrección por altura).']
  });
})();
