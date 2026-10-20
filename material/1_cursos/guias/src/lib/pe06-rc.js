/* Montaje elaborado FE-06 · Carga y descarga de un condensador */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'rc', cod: 'FE-06', titulo: 'Carga y descarga de un condensador: la constante de tiempo RC', grado: 11, tipo: 'elaborada',
    tiempo: 110, grupo: '3 estudiantes', nivel: 2,
    dba: ['11.3'], est: ['C3', 'C4', 'C5', 'C10', 'C12', 'C14', 'F11', 'T2'], comp: ['uso', 'ind', 'exp'], temas: ['Electromagnetismo'],
    pregunta: '¿Cómo cambia con el tiempo la tensión de un condensador que se carga o se descarga a través de una resistencia, y qué fija la rapidez del proceso?',
    contexto: 'El flash de una cámara, el temporizador de una luz de escalera y la memoria de un computador dependen de condensadores que se cargan y descargan. Con una pila de 9 V, una resistencia de 47 kΩ y un condensador de 1000 µF, la descarga dura varios minutos y puede seguirse con un multímetro y el cronómetro del celular. Es el primer encuentro de los estudiantes con una ley exponencial medida por ellos mismos.',
    objetivos: [
      'Registrar la tensión de un condensador durante su carga y su descarga a través de una resistencia.',
      'Linealizar la descarga con logaritmos y obtener la constante de tiempo τ = RC con su incertidumbre.',
      'Estimar la capacidad real del condensador y compararla con la nominal y su tolerancia.',
      'Reconocer el efecto de la resistencia interna del voltímetro en la medida.'
    ],
    prediccion: 'Si el condensador se descarga desde 9 V, ¿tardará lo mismo en bajar de 9 V a 4,5 V que de 4,5 V a 2,25 V? ¿Qué pasará con el tiempo de descarga si se duplica la resistencia?',
    claves: [
      'Durante la descarga, V(t) = V₀ e^(−t/τ) con τ = RC: en cada intervalo τ la tensión cae al 36,8 %.',
      'La tensión tarda siempre lo mismo en reducirse a la mitad: t½ = τ ln 2 ≈ 0,693 τ.',
      'Al graficar ln V contra t se obtiene una recta de pendiente −1/τ.',
      'El voltímetro tiene una resistencia interna Rm en paralelo con el condensador: la constante medida es (R ∥ Rm)·C.'
    ],
    materiales: [
      ['Condensador electrolítico de 1000 µF, 25 V (tolerancia ±20 %)', '1', '470 µF o 2200 µF', 1500],
      ['Resistencias de 47 kΩ y 100 kΩ, ¼ W, tolerancia 5 % o 1 %', '2', '—', 400],
      ['Resistencia de 1 MΩ y condensador de 100 µF (efecto del voltímetro)', '1 c/u', '—', 800],
      ['Pila de 9 V con broche', '1', '6 pilas AA en portapilas', 9000],
      ['Protoboard y cables de conexión', '1', 'Regleta de bornes', 12000],
      ['Multímetro digital (resistencia interna de 10 MΩ en voltios DC)', '1', '—', 30000],
      ['Celular para grabar en video el multímetro con el cronómetro en pantalla', '1', '—', 0]
    ],
    montaje: [
      'Mida con el multímetro la tensión real de la pila y el valor de la resistencia antes de armar.',
      'Arme en la protoboard la serie pila–resistencia–condensador, respetando la polaridad: la franja con el signo «−» del condensador va al negativo de la pila.',
      'Conecte el multímetro en paralelo con el condensador, en la escala de 20 V DC.',
      'Para la descarga, retire el cable de la pila y cierre el circuito resistencia–condensador con un puente; el instante del cambio es t = 0.',
      'Ponga el cronómetro del celular junto al multímetro y grabe la pantalla de ambos: luego se leen los valores cada 10 s sin apuro.'
    ],
    seguridad: [
      { p: 'Condensador electrolítico conectado al revés o con tensión mayor que la nominal', c: 'elec', ef: 'Calentamiento, salida de electrolito o estallido del encapsulado', ctrl: 'Verificar la polaridad antes de conectar; tensión nominal de al menos 16 V para una pila de 9 V; gafas durante la conexión.', nd: 2, ne: 2, nc: 25 },
      { p: 'Condensadores recuperados de fuentes, televisores, hornos microondas o flashes', c: 'elec', ef: 'Descarga de cientos de voltios; potencialmente letal', ctrl: 'Prohibido usarlos: solo componentes nuevos de baja tensión. Descargar cada condensador a través de una resistencia antes de guardarlo.', nd: 6, ne: 1, nc: 100 },
      { p: 'Cortocircuito de la pila de 9 V', c: 'elec', ef: 'Calentamiento de cables y de la pila', ctrl: 'Retirar la pila al terminar; no dejarla suelta junto a objetos metálicos.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'gafas de seguridad durante la conexión del condensador electrolítico.',
    procedimiento: [
      'Con R = 47 kΩ, conecte la pila y registre la tensión del condensador cada 10 s durante 4 minutos (carga).',
      'Desconecte la pila, cierre el circuito de descarga y registre la tensión cada 10 s durante 4 minutos.',
      'Repita la descarga con R = 100 kΩ.',
      'Cambie a R = 1 MΩ con C = 100 µF y mida la tensión final de carga y la descarga: compárelas con la tensión de la pila.'
    ],
    tabla: { cols: ['<i>t</i> (s)', '<i>V</i> carga (V)', '<i>V</i> descarga (V)', 'ln(<i>V</i>/1 V)', '<i>V</i> con 100 kΩ (V)'], filas: 25 },
    analisis: [
      'Grafique V contra t para la carga y la descarga.',
      'Grafique ln V contra t para la descarga, ajuste una recta y obtenga τ = −1/pendiente con su incertidumbre.',
      'Calcule C = τ/R y compárela con la capacidad nominal: ¿está dentro de la tolerancia de ±20 %?',
      'Explique por qué con 1 MΩ la tensión final es menor que la de la pila y la constante de tiempo es menor que RC.'
    ],
    esperado: 'Con 9,0 V, 47 kΩ y 1000 µF nominales, τ = RC = 47 s; con un multímetro de 10 MΩ en paralelo, la constante medida es 46,8 s y la tensión final de carga 8,96 V. En la descarga la tensión cae a 3,3 V en 47 s y a la mitad en 32 s. Con 1 MΩ y 100 µF el voltímetro reduce la constante de 100 s a 90,9 s y la tensión final a 8,18 V. La capacidad real suele diferir de la nominal en unos pocos por ciento hasta el 20 %.',
    errores: [
      ['Medir la carga sin tener en cuenta la resistencia interna de la pila.', 'Es pequeña frente a 47 kΩ; no cambia el resultado, pero sí con resistencias de pocos ohmios.'],
      ['Usar un voltímetro analógico.', 'Con 20 kΩ/V en la escala de 10 V su resistencia es de 200 kΩ: con 47 kΩ, la constante baja de 47 s a 38 s y la tensión final a 7,3 V.'],
      ['Tomar t = 0 tarde.', 'Desplaza la curva pero no cambia la pendiente de ln V contra t; por eso τ se obtiene de la pendiente y no de un solo punto.'],
      ['Usar puntos con tensión muy pequeña en la linealización.', 'La resolución de 0,01 V hace que ln V se disperse mucho cuando V es menor que unos 0,2 V.']
    ],
    orientadoras: [
      '¿Cómo medirán la tensión del condensador a tiempos conocidos sin perder datos?',
      '¿Qué gráfica permitiría saber si la descarga es exponencial?',
      '¿Cómo se puede obtener la capacidad del condensador a partir de las medidas?',
      '¿Puede el instrumento de medida cambiar lo que se mide? ¿Cómo lo comprobarían?'
    ],
    abierta: 'Diseñen un temporizador que mantenga encendido un LED durante unos 30 s después de pulsar un botón, usando un condensador, resistencias y un transistor, y comprueben si la duración medida corresponde a la constante RC calculada.',
    preguntas: [
      '¿Por qué el tiempo para que la tensión se reduzca a la mitad no depende de la tensión inicial?',
      '¿Cuánta energía almacena el condensador cargado a 9 V y a dónde va durante la descarga?',
      '¿Por qué un multímetro digital es mejor que uno analógico para esta medida?',
      '¿Qué valores de R y C usaría para que la descarga dure aproximadamente 1 s?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un condensador cargado a 8 V se descarga a través de una resistencia. A los 20 s su tensión es de 4 V. ¿Cuál será su tensión a los 40 s?',
      opciones: ['0 V', '1 V', '2 V', '3 V'],
      clave: 'C',
      just: 'En una descarga exponencial la tensión se reduce a la mitad en intervalos iguales: 8 V → 4 V en 20 s, y 4 V → 2 V en los 20 s siguientes.'
    },
    rubrica: [['Ley exponencial', 'Registra datos sin relacionarlos con un modelo.', 'Grafica V contra t y reconoce que no es lineal.', 'Linealiza con ln V y obtiene τ con incertidumbre.', 'Obtiene C, la compara con la tolerancia y explica el efecto del voltímetro.']],
    referencias: ['IEC 60062:2016, códigos de marcación de resistencias y condensadores.', 'D. Halliday, R. Resnick y J. Walker, <i>Fundamentos de Física</i>, cap. 27: circuitos RC.', 'MEN, DBA de Ciencias Naturales V.1, grado 11.°, DBA 3.']
  });
})();
