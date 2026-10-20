/* Práctica F10-11 · Principio de Arquímedes y presión hidrostática */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'hidrostatica', cod: 'F10-11', titulo: 'Empuje y presión en los líquidos: Arquímedes con una balanza de cocina', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 1,
    dba: ['10.1'], est: ['C3', 'C5', 'C10', 'C12', 'F6', 'T1'], comp: ['uso', 'exp'], temas: ['Dinámica'],
    pregunta: '¿Cuánto empuja el agua hacia arriba a un objeto sumergido y cómo crece la presión con la profundidad?',
    contexto: 'Un bus de turismo flota en la represa de Guatapé y una piedra se hunde; un buzo siente en los oídos la presión que aumenta al bajar. Una balanza de cocina permite «ver» el empuje: cuando un objeto colgado de un hilo se sumerge en un vaso con agua, la balanza marca más, exactamente el peso del agua desalojada.',
    objetivos: [
      'Medir el empuje sobre un cilindro en función de la profundidad a la que se sumerge, con una balanza de cocina.',
      'Obtener la densidad del líquido y la del sólido a partir de las medidas de empuje.',
      'Medir la presión hidrostática en función de la profundidad con un manómetro de manguera.'
    ],
    prediccion: 'Cuando un objeto colgado de un hilo se sumerge en un vaso con agua que está sobre una balanza, ¿la lectura de la balanza aumenta, disminuye o no cambia? ¿Sigue cambiando cuando el objeto ya está completamente sumergido y se baja más?',
    claves: [
      'Principio de Arquímedes: un cuerpo sumergido recibe un empuje hacia arriba igual al peso del líquido que desaloja: E = ρ<sub>f</sub> V<sub>sum</sub> g.',
      'Por la tercera ley, el cuerpo empuja al líquido hacia abajo con la misma fuerza: la balanza marca un aumento Δm = ρ<sub>f</sub> V<sub>sum</sub>.',
      'Para un cilindro de base A sumergido una profundidad y: Δm = ρ<sub>f</sub> A y, hasta quedar totalmente sumergido.',
      'La presión en un líquido en reposo aumenta con la profundidad: Δp = ρ<sub>f</sub> g h.'
    ],
    materiales: [
      ['Balanza digital de cocina (1 g)', '1', 'Balanza de joyería con vaso pequeño', 30000],
      ['Vaso o jarra plástica de 1 L con agua', '1', 'Recipiente transparente', 3000],
      ['Cilindro de aluminio de 1 pulgada × 5 cm (de la práctica F10-01)', '1', 'Tubo de PVC tapado y lastrado', 0],
      ['Soporte universal o prensa con brazo e hilo', '1', 'Palo de escoba entre dos sillas', 0],
      ['Regla y cinta para marcar la profundidad en el cilindro cada 1 cm', '1', '—', 2000],
      ['Sal de cocina y alcohol antiséptico al 70 % para cambiar el líquido', '250 g y 250 mL', 'Aceite de cocina', 6000],
      ['Manguera transparente de 1 m, embudo y globo (manómetro)', '1', 'Manguera de nivel de construcción', 5000],
      ['Balde o recipiente alto con agua', '1', '—', 0]
    ],
    montaje: [
      'Marque el cilindro cada centímetro desde su base con cinta delgada.',
      'Cuelgue el cilindro del brazo del soporte con un hilo, sobre el vaso con agua, que descansa en la balanza. La altura del brazo se ajusta para sumergir el cilindro de centímetro en centímetro.',
      'Tare la balanza con el vaso y el agua.',
      'Para el manómetro: tape la boca del embudo con un trozo de globo tensado, conéctelo a un extremo de la manguera, que se dobla en U sobre una tabla y lleva agua con colorante.'
    ],
    seguridad: [
      { p: 'Agua derramada cerca de la balanza o de tomas eléctricas', c: 'loc', ef: 'Resbalones; daño de la balanza', ctrl: 'Bandeja bajo el montaje; lejos de tomas; secar de inmediato.', nd: 2, ne: 2, nc: 10 },
      { p: 'Alcohol antiséptico', c: 'quim', ef: 'Incendio si hay llama; irritación de ojos', ctrl: 'Cantidad pequeña, lejos de fuentes de calor; ficha de datos de seguridad disponible; envase rotulado.', nd: 2, ne: 1, nc: 25 }
    ],
    epp: 'gafas si se trabaja con alcohol.',
    procedimiento: [
      'Con el cilindro fuera del agua, la balanza marca cero. Baje el cilindro hasta sumergir 1 cm y lea la balanza.',
      'Continúe de centímetro en centímetro hasta sumergirlo por completo, y luego bájelo 2 cm más sin tocar el fondo.',
      'Repita con agua con sal (100 g en 500 mL) y con alcohol.',
      'Pese el cilindro en el aire.',
      'Manómetro: sumerja el embudo a 5, 10, 15, 20 y 25 cm de profundidad en el balde y mida la diferencia de nivel del agua en las ramas de la U.'
    ],
    tabla: { cols: ['<i>y</i> sumergido (m)', 'Δ<i>m</i> agua (g)', 'Δ<i>m</i> agua salada (g)', 'Δ<i>m</i> alcohol (g)', '<i>h</i> embudo (m)', 'Δ<i>h</i> manómetro (m)'], filas: 7 },
    analisis: [
      'Grafique Δm contra y para cada líquido. ¿Qué pasa cuando el cilindro queda totalmente sumergido?',
      'Ajuste una recta al tramo creciente: la pendiente es ρ<sub>f</sub> A. Con el área de la base, obtenga la densidad de cada líquido.',
      'Con la masa del cilindro m y el aumento total Δm<sub>total</sub> en agua, calcule la densidad del cilindro: ρ = ρ<sub>agua</sub> m/Δm<sub>total</sub>.',
      'Grafique Δh contra h del manómetro y ajuste una recta: para agua en el balde y en el manómetro, la pendiente debería ser cercana a 1.'
    ],
    esperado: 'El cilindro de 25,4 mm de diámetro (A = 5,07 cm²) aumenta la lectura en 5,1 g por cada centímetro sumergido en agua, hasta 25,3 g con los 5 cm, y luego la lectura no cambia. Su densidad sale ρ = 0,998 × 68,4/25,3 = 2,70 g/cm³. En agua con sal (100 g en 500 mL, cerca de 1,12 g/cm³) la pendiente es unos 12 % mayor, y en alcohol antiséptico al 70 % (cerca de 0,89 g/cm³) unos 11 % menor. El manómetro de agua marca un desnivel casi igual a la profundidad del embudo, algo menor por la elasticidad del globo.',
    errores: [
      ['El cilindro toca el fondo o la pared.', 'Entonces la balanza mide también la fuerza del contacto; se verifica que cuelgue libre.'],
      ['Burbujas en la superficie del cilindro.', 'Aumentan el volumen desalojado; se humedece el cilindro antes.'],
      ['Leer la profundidad sumergida en el borde del menisco.', 'Se lee la marca del cilindro a la altura de la superficie libre del agua.'],
      ['Globo muy tensado en el embudo.', 'La membrana absorbe parte de la presión; se usa un globo flojo y se calibra con la recta.']
    ],
    orientadoras: [
      '¿Cómo podría una balanza de cocina medir la fuerza que el agua hace sobre un objeto sumergido sin que el objeto toque la balanza?',
      '¿De qué podría depender el empuje: profundidad, volumen sumergido, tipo de líquido, material del objeto?',
      '¿Cómo obtendrán la densidad del líquido a partir de sus medidas?',
      '¿Cómo medirán la presión a distintas profundidades?'
    ],
    abierta: 'Un pescador del Pacífico dice que su canoa «se hunde menos» en el mar que en el río. Diseñen una investigación para comprobarlo con modelos de canoa y explicar el resultado con el principio de Arquímedes.',
    preguntas: [
      '¿Por qué la balanza deja de cambiar cuando el cilindro ya está completamente sumergido?',
      '¿Qué fuerza ejerce el cilindro sobre el agua? Relacione su respuesta con la tercera ley de Newton.',
      '¿Cómo usaría este método para distinguir agua dulce de agua salada sin probarla?',
      '¿Por qué un barco de acero flota si el acero es más denso que el agua?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un vaso con agua está sobre una balanza que marca 500 g. Se introduce en el agua, colgado de un hilo y sin tocar el vaso, un objeto de 80 g y 30 cm³. Con el objeto totalmente sumergido, la balanza marca aproximadamente',
      opciones: ['500 g, porque el objeto no toca el vaso.', '530 g, por la reacción al empuje.', '550 g, porque el objeto pierde 30 g de peso.', '580 g, porque se suma la masa del objeto.'],
      clave: 'B',
      just: 'El agua empuja al objeto hacia arriba con el peso de 30 cm³ de agua (30 g); por la tercera ley el objeto empuja al agua hacia abajo con la misma fuerza, que la balanza registra como 30 g adicionales. El resto del peso del objeto lo sostiene el hilo.'
    },
    rubrica: [['Modelo de Arquímedes', 'Cree que el empuje depende del peso del objeto.', 'Relaciona el empuje con el volumen sumergido.', 'Obtiene densidades de líquidos y del sólido con incertidumbre.', 'Explica la lectura de la balanza con la tercera ley y discute los límites del método.']],
    referencias: ['Arquímedes, <i>Sobre los cuerpos flotantes</i>, siglo III a. C.']
  });
})();
