/* Práctica F11-08 · Ley de Ohm y circuitos serie, paralelo y mixtos */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'circuitos', cod: 'F11-08', titulo: 'Ley de Ohm y circuitos en serie, en paralelo y mixtos', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.3'], est: ['C3', 'C4', 'C5', 'C9', 'C10', 'F11', 'T2'], comp: ['uso', 'ind', 'exp'], temas: ['Electromagnetismo'],
    pregunta: '¿Cómo se relacionan la corriente y el voltaje en una resistencia y en un bombillo, y cómo cambia el brillo de unos bombillos cuando se quita uno del circuito?',
    contexto: 'Las instalaciones de la casa conectan los aparatos en paralelo y las luces de Navidad antiguas en serie: por eso cuando se fundía un bombillo se apagaba toda la instalación. Con pilas, bombillos de linterna, resistencias y un multímetro se comprueba la ley de Ohm, se descubre que un bombillo no la cumple y se ponen a prueba las predicciones sobre circuitos mixtos que pide el DBA.',
    objetivos: [
      'Medir la relación entre voltaje y corriente en una resistencia y en un bombillo, y decidir cuál es óhmico.',
      'Medir corrientes y voltajes en circuitos en serie, en paralelo y mixtos y comprobar las reglas de Kirchhoff.',
      'Predecir y verificar los cambios de brillo de los bombillos al quitar un componente, y medir la resistencia interna de la pila.'
    ],
    prediccion: 'En un circuito con el bombillo A en serie con dos bombillos B y C en paralelo, ¿cuál brilla más? Si se quita el bombillo B, ¿qué le pasa al brillo de A y de C?',
    claves: [
      'Ley de Ohm: en un conductor óhmico V = I R, con R constante. Un bombillo no es óhmico: su filamento se calienta y su resistencia aumenta.',
      'En serie la corriente es la misma y los voltajes se suman; en paralelo el voltaje es el mismo y las corrientes se suman.',
      'R<sub>serie</sub> = R₁ + R₂; 1/R<sub>paralelo</sub> = 1/R₁ + 1/R₂.',
      'Una pila real tiene resistencia interna r: el voltaje en sus terminales es V = ε − I r y baja cuando entrega más corriente.'
    ],
    materiales: [
      ['Portapilas para 2 y 4 pilas AA con fusible de 1 A', '1', 'Portapilas sin fusible más un fusible de vidrio en serie', 6000],
      ['Pilas AA alcalinas', '4', '—', 10000],
      ['Bombillos incandescentes de linterna de 2,5 V y 0,3 A con sus portabombillos', '3', 'Bombillos de 3,8 V; LED con resistencia (no son resistivos)', 6000],
      ['Resistencias de 10 Ω, 47 Ω, 100 Ω y 220 Ω de 1/2 W', '2 de cada una', '—', 2000],
      ['Potenciómetro de 100 Ω o reóstato de grafito (mina de lápiz)', '1', 'Combinaciones de resistencias', 2000],
      ['Multímetro digital', '1', 'Dos multímetros (uno de amperímetro)', 35000],
      ['Cables con caimanes', '8', 'Cables con alambre pelado y cinta', 6000],
      ['Protoboard pequeña (opcional)', '1', 'Tabla con tornillos y arandelas como bornes', 6000]
    ],
    montaje: [
      'Revise los cables: sin cobre expuesto fuera de los caimanes. Inserte las pilas en el portapilas con fusible, sin conectarlo todavía.',
      'Arme cada circuito siguiendo el esquema, con la fuente desconectada; el docente lo revisa antes de cerrar el circuito.',
      'Para medir corriente, abra el circuito e intercale el multímetro en el modo de corriente continua (borne de mA); para medir voltaje, conéctelo en paralelo en el modo de voltaje.',
      'Nunca conecte el multímetro en modo de corriente directamente entre los bornes de la pila.'
    ],
    seguridad: [
      { p: 'Cortocircuito de las pilas', c: 'elec', ef: 'Calentamiento de cables y pilas; quemaduras leves', ctrl: 'Portapilas con fusible de 1 A; solo pilas alcalinas AA; circuito revisado antes de conectar.', nd: 2, ne: 2, nc: 10 },
      { p: 'Multímetro en modo de corriente conectado en paralelo', c: 'elec', ef: 'Fusible del multímetro quemado; daño del instrumento', ctrl: 'Explicación previa; el docente verifica la conexión del amperímetro.', nd: 2, ne: 2, nc: 10 },
      { p: 'Bombillo y resistencias calientes', c: 'term', ef: 'Quemaduras leves', ctrl: 'No tocar el bombillo encendido; resistencias de 1/2 W.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren; solo muy baja tensión (6 V o menos).',
    procedimiento: [
      'Ohm: conecte la resistencia de 100 Ω en serie con el potenciómetro y la fuente; varíe el potenciómetro y mida V en la resistencia e I en el circuito para seis valores. Repita con un bombillo.',
      'Serie y paralelo: arme dos resistencias en serie y luego en paralelo; mida la corriente total y los voltajes en cada una.',
      'Circuito mixto: con 2 pilas (3 V), arme el bombillo A en serie con B y C en paralelo. Ordene los brillos y mida V e I de cada bombillo.',
      'Desenrosque B y observe A y C; vuelva a medir. Luego desenrosque C con B puesto.',
      'Resistencia interna: conecte a la pila resistencias de carga de 220 Ω a 10 Ω y mida en cada caso el voltaje en los terminales y la corriente.'
    ],
    tabla: { cols: ['Elemento o configuración', '<i>V</i> (V)', '<i>I</i> (mA)', '<i>R</i> = <i>V</i>/<i>I</i> (Ω)', 'Brillo (orden)'], filas: 10 },
    analisis: [
      'Grafique I contra V para la resistencia y para el bombillo. ¿Cuál es una recta que pasa por el origen?',
      'Calcule R = V/I punto a punto para el bombillo y explique por qué aumenta.',
      'Verifique en los circuitos serie y paralelo que los voltajes y las corrientes cumplen las reglas de Kirchhoff, con su incertidumbre.',
      'En el circuito mixto, compare los brillos con las potencias P = V I medidas.',
      'Grafique el voltaje en los terminales contra la corriente: el intercepto es la fem ε y la pendiente, −r.'
    ],
    esperado: 'La resistencia de 100 Ω da una recta I–V; el bombillo, una curva cuya resistencia V/I crece con el voltaje hasta 8,3 Ω con 2,5 V; en frío su filamento tiene apenas una fracción de ese valor. En el circuito mixto con 3 V, A brilla mucho más (unos 0,63 W) que B y C (0,09 W cada uno); al quitar B, A se atenúa (0,32 W) y C brilla más (0,32 W): ambos quedan iguales. Una pila AA nueva tiene una resistencia interna del orden de 0,1 Ω a 0,3 Ω.',
    errores: [
      ['Conectar el amperímetro en paralelo.', 'Es un cortocircuito a través del instrumento; se intercala abriendo el circuito.'],
      ['Usar bombillos LED.', 'Los LED no son resistivos y no siguen las predicciones del DBA; se usan bombillos incandescentes de linterna.'],
      ['Pilas descargadas.', 'Su resistencia interna es alta y los voltajes caen al conectar; se miden antes y se reemplazan.'],
      ['Leer V sin considerar la resolución del multímetro.', 'Con 0,01 V de resolución, las diferencias pequeñas pueden no ser significativas.']
    ],
    orientadoras: [
      '¿Cómo medirán la corriente y el voltaje de un elemento sin alterar el circuito?',
      '¿Qué gráfica les permite decidir si un elemento cumple la ley de Ohm?',
      '¿Qué esperan que pase con la corriente total al agregar un bombillo en paralelo? ¿Y en serie?',
      '¿Cómo pondrán a prueba su predicción sobre los brillos?'
    ],
    abierta: 'Las luces de Navidad de una casa se apagan todas cuando se funde un solo bombillo, pero las de otra casa no. Investiguen con bombillos de linterna cómo están conectadas en cada caso, midan corrientes y voltajes, y propongan un diseño que siga encendido aunque falle un bombillo sin desperdiciar energía.',
    preguntas: [
      '¿Por qué el bombillo no cumple la ley de Ohm? ¿Es falsa la ley?',
      'Explique con potencias por qué A brilla más que B y C, y por qué al quitar B, A se atenúa y C brilla más.',
      '¿Por qué las instalaciones de la casa se conectan en paralelo?',
      '¿Por qué el voltaje de una pila baja cuando se le conecta una carga pequeña?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Tres bombillos iguales se conectan a una pila: el bombillo A en serie con un arreglo en paralelo de B y C. Si se desconecta el bombillo B, ocurre que',
      opciones: ['A y C se apagan.', 'A brilla más y C brilla menos.', 'A brilla menos y C brilla más.', 'A y C mantienen su brillo.'],
      clave: 'C',
      just: 'Al quitar B la resistencia total aumenta y la corriente que pasa por A disminuye: A brilla menos. Como A toma menos voltaje, al paralelo (ahora solo C) le queda más voltaje y por C pasa más corriente que antes: C brilla más.'
    },
    rubrica: [['Modelo de circuitos', 'No distingue serie de paralelo.', 'Aplica la ley de Ohm a elementos aislados.', 'Explica circuitos mixtos con Kirchhoff y potencias medidas.', 'Distingue elementos óhmicos y no óhmicos y explica la resistencia interna con evidencia.']],
    referencias: ['MEN, DBA de Ciencias Naturales V.1, grado 11.°, DBA 3, evidencias 1 a 4.', 'L. C. McDermott y P. S. Shaffer, «Research as a guide for curriculum development: An example from introductory electricity», <i>American Journal of Physics</i> 60, 994–1003, 1992.']
  });
})();
