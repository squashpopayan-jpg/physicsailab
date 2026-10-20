/* Práctica F11-02 · Velocidad del sonido con un tubo de resonancia */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'sonido', cod: 'F11-02', titulo: 'La velocidad del sonido en un tubo de resonancia', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 1,
    dba: ['11.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'F2'], comp: ['uso', 'ind'], temas: ['Ondas'],
    pregunta: '¿A qué longitud «suena» más fuerte una columna de aire cuando se le acerca un tono, y cómo se obtiene de ahí la velocidad del sonido?',
    contexto: 'Al soplar sobre una botella o al llenarla de agua mientras suena una canilla, el tono cambia: la columna de aire resuena a ciertas frecuencias. Las flautas de caña, las gaitas de San Jacinto y las marimbas de chonta del Pacífico usan columnas de aire o tubos resonadores. Con un tubo, agua y el generador de tonos del celular se mide la velocidad del sonido en el aire del salón.',
    objetivos: [
      'Encontrar las longitudes de resonancia de una columna de aire cerrada para varias frecuencias.',
      'Obtener la longitud de onda, la velocidad del sonido y la corrección de extremo del tubo.',
      'Comparar la velocidad medida con la predicha para la temperatura del salón.'
    ],
    prediccion: 'Si la frecuencia del tono se duplica, ¿la primera longitud de resonancia se duplica, se reduce a la mitad o no cambia? ¿Esperan que el sonido viaje más rápido en Bogotá o en Barranquilla?',
    claves: [
      'Un tubo abierto por arriba y cerrado por el agua resuena cuando su longitud es un número impar de cuartos de longitud de onda: L = λ/4, 3λ/4, 5λ/4…',
      'El antinodo de desplazamiento queda un poco por fuera de la boca del tubo: L<sub>n</sub> = (2n − 1) λ/4 − e, con una corrección e ≈ 0,61 r.',
      'La diferencia entre dos resonancias consecutivas es media longitud de onda y no depende de e: λ = 2 (L₂ − L₁).',
      'v = λ f. En aire seco, v ≈ 331,3 √(1 + θ/273,15) m/s, con θ en °C: depende de la temperatura, no de la presión.'
    ],
    materiales: [
      ['Tubo de PVC de 1 1/2 pulgada, de 70 a 80 cm', '1', 'Tubo de cartón rígido de igual diámetro', 8000],
      ['Recipiente alto con agua (balde alto, tubo de PVC de 3 pulgadas tapado, probeta de 1 L)', '1', 'Botella grande cortada', 5000],
      ['Celular con generador de tonos (phyphox) y otro celular o audífono pequeño como fuente', '1 a 2', 'Diapasones de 512 Hz y 1024 Hz del laboratorio', 0],
      ['Flexómetro y cinta de enmascarar', '1', '—', 8000],
      ['Termómetro digital para el aire del salón', '1', '—', 0],
      ['Calibrador para medir el diámetro interior del tubo', '1', 'Regla', 0]
    ],
    montaje: [
      'Llene el recipiente alto con agua y sumerja verticalmente el tubo de PVC; al subirlo o bajarlo cambia la longitud de la columna de aire.',
      'Pegue una cinta métrica a lo largo del tubo con el cero en la boca superior.',
      'Ubique la fuente de sonido (audífono o celular) justo sobre la boca del tubo, a 1 o 2 cm.',
      'Mida la temperatura del aire cerca del tubo y el diámetro interior del tubo.'
    ],
    seguridad: [
      { p: 'Sonido intenso cerca del oído', c: 'ruido', ef: 'Molestia o fatiga auditiva', ctrl: 'Volumen moderado; nadie acerca el oído a la boca del tubo; sesiones cortas.', nd: 2, ne: 2, nc: 10 },
      { p: 'Agua derramada cerca de equipos', c: 'loc', ef: 'Resbalones; daño del celular', ctrl: 'Recipiente estable sobre bandeja; celular en bolsa plástica.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Genere un tono de 500 Hz. Con el tubo casi totalmente sumergido, súbalo lentamente hasta oír un refuerzo claro del sonido: es la primera resonancia. Afine subiendo y bajando y anote la longitud L₁ de la columna de aire.',
      'Siga subiendo el tubo hasta la segunda resonancia, L₂.',
      'Repita cada lectura tres veces, acercándose desde arriba y desde abajo.',
      'Repita para 600, 700, 800, 900 y 1000 Hz.',
      'Anote la temperatura del aire al principio y al final.'
    ],
    tabla: { cols: ['<i>f</i> (Hz)', '1/<i>f</i> (s)', '<i>L</i>₁ (m)', '<i>L</i>₂ (m)', 'λ = 2(<i>L</i>₂ − <i>L</i>₁) (m)', '<i>v</i> = λ<i>f</i> (m/s)'], filas: 7 },
    analisis: [
      'Calcule λ y v = λ f para cada frecuencia, y su promedio con incertidumbre.',
      'Grafique L₁ contra 1/f y ajuste una recta: la pendiente es v/4 y el intercepto −e.',
      'Compare la corrección de extremo e con 0,61 veces el radio interior del tubo.',
      'Calcule la velocidad esperada con la temperatura medida y compare con z.'
    ],
    esperado: 'A 20 °C la velocidad del sonido en aire seco es 343,2 m/s; a 14 °C, 339,7 m/s. Con un tubo de 2 cm de radio interior (e = 1,23 cm) y 500 Hz, las resonancias aparecen a 15,9 cm y 50,3 cm; con 1000 Hz, a 7,4 cm y 24,5 cm. La humedad del aire aumenta la velocidad en algunas décimas de metro por segundo.',
    errores: [
      ['Medir la longitud desde el borde del recipiente.', 'Es la columna de aire: desde la boca del tubo hasta la superficie del agua dentro del tubo.'],
      ['Usar solo L₁ y λ = 4L₁.', 'Ignora la corrección de extremo y subestima λ en varios por ciento; se usa la diferencia L₂ − L₁ o la gráfica L₁–1/f.'],
      ['Volumen demasiado alto.', 'Satura el oído y oculta el máximo; se usa un volumen bajo y se busca el refuerzo.'],
      ['Esperar que la velocidad cambie con la altitud.', 'Depende de la temperatura del aire, no de la presión; en Bogotá es menor porque el aire está más frío.']
    ],
    orientadoras: [
      '¿Cómo podrían saber que una columna de aire está en resonancia con el tono?',
      '¿Qué relación esperan entre la longitud de resonancia y la longitud de onda?',
      '¿Qué gráfica permite obtener la velocidad del sonido usando varias frecuencias?',
      '¿Qué variables del ambiente podrían cambiar el resultado?'
    ],
    abierta: 'Un grupo de música tradicional quiere construir flautas de PVC afinadas. Investiguen cómo depende la nota de una columna de aire de su longitud y usen sus resultados para medir la velocidad del sonido y diseñar una flauta de cinco notas.',
    preguntas: [
      '¿Por qué la diferencia L₂ − L₁ es media longitud de onda?',
      '¿Por qué el sonido viaja más despacio en Bogotá que en Cali si la presión no influye?',
      '¿Qué cualidad del sonido cambia con la frecuencia (tono) y cuál con la amplitud (intensidad)?',
      '¿Cómo funciona el resonador de una marimba de chonta?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un grupo mide la primera longitud de resonancia L₁ de un tubo cerrado para varias frecuencias f del tono. Según el modelo L₁ = v/(4f) − e, para obtener la velocidad del sonido con una recta deben graficar',
      opciones: ['L₁ contra f.', 'L₁ contra 1/f.', 'L₁ contra f².', 'f contra la temperatura.'],
      clave: 'B',
      just: 'Con X = 1/f el modelo es una recta L₁ = (v/4) X − e: la pendiente es v/4 y el intercepto, la corrección de extremo con signo negativo.'
    },
    rubrica: [['Modelo de ondas estacionarias', 'No relaciona resonancia y longitud de onda.', 'Usa λ = 4L₁.', 'Obtiene v y e por linealización con incertidumbre.', 'Compara con la temperatura del aire y explica la corrección de extremo y la humedad.']],
    referencias: ['H. Levine y J. Schwinger, «On the radiation of sound from an unflanged circular pipe», <i>Physical Review</i> 73, 383–406, 1948.', 'O. Cramer, «The variation of the specific heat ratio and the speed of sound in air with temperature, pressure, humidity, and CO₂ concentration», <i>Journal of the Acoustical Society of America</i> 93, 2510–2516, 1993.']
  });
})();
