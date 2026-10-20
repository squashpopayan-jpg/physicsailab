/* Montaje elaborado FE-04 · Ondas estacionarias en una cuerda (Melde) */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'melde', cod: 'FE-04', titulo: 'Ondas estacionarias en una cuerda: el experimento de Melde', grado: 11, tipo: 'elaborada',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'F2'], comp: ['uso', 'ind'], temas: ['Ondas'],
    pregunta: '¿A qué frecuencias vibra una cuerda tensa formando ondas estacionarias, y cómo dependen esas frecuencias de la tensión y de la masa de la cuerda?',
    contexto: 'Las cuerdas de un tiple, una guitarra o un arpa llanera producen notas que dependen de su largo, su tensión y su grosor. Franz Melde estudió en 1859 las ondas estacionarias de una cuerda movida por un vibrador. Un parlante conectado al generador de tonos de un celular hace de vibrador y una polea con pesas fija la tensión.',
    objetivos: [
      'Producir ondas estacionarias en una cuerda y medir las frecuencias de los primeros armónicos.',
      'Obtener la rapidez de la onda a partir de la relación lineal entre frecuencia y número de vientres.',
      'Comprobar que v = √(T/μ) variando la tensión y midiendo la densidad lineal de la cuerda.'
    ],
    prediccion: 'Si la cuerda vibra con un solo vientre a 33 Hz, ¿a qué frecuencia vibrará con dos vientres? ¿Y con tres? Si se cuadruplica la masa que la tensa, ¿cómo cambia la frecuencia del primer armónico?',
    claves: [
      'En una cuerda fija en sus extremos, las ondas estacionarias tienen nodos en los extremos: su longitud contiene un número entero de medias longitudes de onda, L = n λ/2.',
      'Las frecuencias de resonancia son f<sub>n</sub> = n v/(2L): múltiplos enteros del fundamental.',
      'La rapidez de la onda depende de la tensión T y de la densidad lineal μ: v = √(T/μ).',
      'La tensión la da una masa colgada de la cuerda a través de una polea: T = Mg.'
    ],
    materiales: [
      ['Parlante de 8 Ω y 3 a 5 W, con un palillo pegado al cono', '1', 'Vibrador de un juguete con motor', 8000],
      ['Módulo amplificador de 5 V (por ejemplo PAM8403) y cable de audio', '1', 'Parlante portátil con entrada de audio', 8000],
      ['Celular con generador de tonos (phyphox)', '1', 'Computador con generador de tonos', 0],
      ['Hilo de nailon de 0,5 mm (unos 3 m) o hilo elástico', '1', 'Cuerda de guitarra delgada (más tensión)', 2000],
      ['Polea con prensa y portapesas con arandelas (50 g a 400 g)', '1', '—', 8000],
      ['Flexómetro y balanza de 0,01 g', '1', '—', 0],
      ['Linterna o luz del celular en modo estroboscópico (opcional)', '1', '—', 0]
    ],
    montaje: [
      'Pese 10 m del mismo hilo para obtener su densidad lineal μ.',
      'Fije el parlante horizontal en un extremo de la mesa, con el palillo pegado a su cono apuntando hacia la polea.',
      'Amarre el hilo al palillo, páselo por la polea al otro extremo de la mesa y cuelgue el portapesas.',
      'Mida la longitud L entre el palillo y el punto de contacto con la polea (los dos nodos).',
      'Conecte el celular al amplificador y este al parlante; empiece con volumen bajo.'
    ],
    seguridad: [
      { p: 'Ruido del parlante a volumen alto', c: 'ruido', ef: 'Molestia y fatiga auditiva', ctrl: 'Volumen mínimo que produce la onda; sesiones cortas; las frecuencias son bajas y poco molestas.', nd: 2, ne: 2, nc: 10 },
      { p: 'Pesas colgadas de la polea', c: 'mec', ef: 'Golpe en los pies', ctrl: 'Máximo 400 g; caja con espuma debajo.', nd: 2, ne: 2, nc: 10 },
      { p: 'Hilo tenso que se rompe', c: 'mec', ef: 'Latigazo en la cara', ctrl: 'No acercar la cara al hilo vibrando; gafas si se usa cuerda de guitarra.', nd: 2, ne: 1, nc: 25 }
    ],
    epp: 'gafas si se usa cuerda metálica.',
    procedimiento: [
      'Con 100 g colgados, suba lentamente la frecuencia desde 10 Hz hasta ver la cuerda vibrar con un solo vientre de máxima amplitud; anote la frecuencia.',
      'Siga subiendo y anote las frecuencias para 2, 3, 4, 5 y 6 vientres.',
      'Para el modo de 2 vientres, repita con masas de 50, 100, 200, 300 y 400 g.',
      'Repita cada búsqueda subiendo y bajando la frecuencia para estimar la incertidumbre.'
    ],
    tabla: { cols: ['<i>M</i> (kg)', '<i>T</i> = <i>Mg</i> (N)', '<i>n</i> vientres', '<i>f</i><sub>n</sub> (Hz)', 'λ = 2<i>L</i>/<i>n</i> (m)', '<i>v</i> = λ<i>f</i> (m/s)'], filas: 10 },
    analisis: [
      'Con la tensión fija, grafique f<sub>n</sub> contra n y ajuste una recta por el origen: la pendiente es v/(2L).',
      'Compare v con √(T/μ) usando la μ medida.',
      'Con n fijo, grafique f contra √T y ajuste una recta: la pendiente es n/(2L√μ). Despeje μ.',
      'Explique por qué las frecuencias de resonancia son múltiplos enteros del fundamental.'
    ],
    esperado: 'Con hilo de nailon de μ = 0,226 g/m, L = 1,00 m y 100 g colgando (T = 0,978 N en Popayán), la onda viaja a 65,8 m/s y el fundamental está en 32,9 Hz; los armónicos, en 65,8, 98,7, 131,6 Hz… Con 400 g la frecuencia de cada modo se duplica.',
    errores: [
      ['Medir L hasta el borde del parlante o de la polea.', 'L es la distancia entre los dos nodos: el punto de amarre en el palillo y el de contacto con la polea.'],
      ['Volumen demasiado alto.', 'El vibrador se mueve tanto que el extremo deja de ser un nodo y la cuerda vibra de forma irregular.'],
      ['Elegir mal la resonancia.', 'Cerca de cada armónico la amplitud crece de forma gradual; se busca el máximo subiendo y bajando la frecuencia.'],
      ['Usar un hilo elástico que se estira mucho.', 'Su μ cambia con la tensión; se prefiere nailon o cuerda de guitarra.']
    ],
    orientadoras: [
      '¿Qué condición deben cumplir las ondas para formar un patrón estacionario con los extremos fijos?',
      '¿Qué variables podrían cambiar la frecuencia de resonancia y cómo las controlarán?',
      '¿Qué gráficas les permitirán obtener la rapidez de la onda?',
      '¿Cómo medirán la masa por unidad de longitud de la cuerda?'
    ],
    abierta: 'Un luthier quiere entender cómo afinar un tiple. Investiguen con el montaje de Melde de qué depende la frecuencia de una cuerda (longitud, tensión, grosor, material) y propongan una regla práctica para afinar.',
    preguntas: [
      '¿Por qué una cuerda de guitarra más gruesa suena más grave con la misma tensión?',
      '¿Qué se transporta a lo largo de la cuerda en una onda estacionaria?',
      '¿Cuál es la relación entre este experimento y el tubo de resonancia de la práctica F11-02?',
      'Si se cuadruplica la tensión, ¿qué le pasa a la longitud de onda para la misma frecuencia?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Una cuerda de longitud L, fija en sus extremos, vibra con 3 vientres a 90 Hz. La frecuencia a la que vibra con 1 vientre y la rapidez de la onda si L = 1,0 m son',
      opciones: ['30 Hz y 60 m/s.', '30 Hz y 30 m/s.', '270 Hz y 60 m/s.', '90 Hz y 180 m/s.'],
      clave: 'A',
      just: 'Con f<sub>n</sub> = n v/(2L), f₁ = 90/3 = 30 Hz y v = 2 L f₁ = 2 × 1,0 × 30 = 60 m/s.'
    },
    rubrica: [['Modelo de ondas estacionarias', 'No relaciona vientres y frecuencia.', 'Reconoce los armónicos como múltiplos.', 'Obtiene v y μ por linealización con incertidumbre.', 'Contrasta v = √(T/μ) con la μ medida y explica las desviaciones.']],
    referencias: ['F. Melde, «Über die Erregung stehender Wellen eines fadenförmigen Körpers», <i>Annalen der Physik</i>, 1860.', 'A. P. French, <i>Vibraciones y ondas</i>, Reverté, cap. 6.']
  });
})();
