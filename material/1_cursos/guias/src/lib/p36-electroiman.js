/* Práctica F11-09 · Oersted y el electroimán */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'electroiman', cod: 'F11-09', titulo: 'Corrientes que hacen campos: Oersted y el electroimán', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.2'], est: ['C3', 'C4', 'C5', 'C10', 'C12', 'F10', 'T2'], comp: ['uso', 'ind', 'exp'], temas: ['Electromagnetismo'],
    pregunta: '¿Cómo depende el campo magnético que produce una corriente de su intensidad, y cómo se construye un imán que se puede encender y apagar?',
    contexto: 'En 1820 Hans Christian Ørsted notó que una brújula se desviaba junto a un cable con corriente: fue la primera prueba de que electricidad y magnetismo están unidos. Las grúas que levantan chatarra, los timbres y los motores usan electroimanes. El DBA 2 de 11.° pide explícitamente construir uno y explicar su funcionamiento.',
    objetivos: [
      'Reproducir el experimento de Ørsted y relacionar el ángulo de desviación de la brújula con la corriente.',
      'Obtener la componente horizontal del campo magnético terrestre del municipio y compararla con el modelo IGRF.',
      'Construir un electroimán y estudiar cómo dependen su campo y su fuerza de la corriente, del número de vueltas y del núcleo.'
    ],
    prediccion: 'Si el cable va de sur a norte por encima de la brújula y la corriente circula hacia el norte, ¿hacia dónde gira la aguja? ¿Gira el doble si se duplica la corriente?',
    claves: [
      'Una corriente I en un cable recto produce un campo magnético circular a su alrededor: B = μ₀ I / (2π d) a la distancia d, con μ₀ = 4π × 10⁻⁷ T·m/A.',
      'La brújula se orienta según la suma del campo terrestre horizontal B<sub>H</sub> y el del cable: tan φ = B<sub>cable</sub>/B<sub>H</sub>.',
      'Una bobina de N vueltas concentra el campo; un núcleo de hierro lo multiplica muchas veces porque se magnetiza.',
      'Las fuerzas magnéticas atraen y repelen; el electroimán se apaga al cortar la corriente.'
    ],
    materiales: [
      ['Brújula pequeña de buena calidad', '1', 'Aguja imantada en un corcho flotando en agua', 6000],
      ['Cable de cobre rígido de 50 cm (calibre 18 a 22 AWG)', '1', 'Cable de timbre', 1000],
      ['Portapilas de 2 AA con fusible de 2 A e interruptor de botón', '1', 'Portapilas con fusible', 6000],
      ['Resistencia de 4,7 Ω de 5 W (limita la corriente a unos 0,6 A)', '1', 'Dos resistencias de 10 Ω de 2 W en paralelo', 2000],
      ['Multímetro en escala de 10 A o 2 A', '1', '—', 0],
      ['Puntilla grande de hierro o tornillo de 6 cm y 1,5 m de alambre esmaltado calibre 26', '1', 'Clavo de construcción', 3000],
      ['Clips metálicos o ganchos de cosedora', '30', '—', 1000],
      ['Celular con magnetómetro (phyphox)', '1', '—', 0],
      ['Lija fina para pelar las puntas del alambre esmaltado', '1', 'Cuchilla (lo hace el docente)', 500]
    ],
    montaje: [
      'Oersted: coloque la brújula sobre la mesa, lejos de objetos de hierro, y deje que se oriente. Tienda el cable recto por encima, a 2 cm, en la dirección de la aguja (norte–sur), sostenido con libros.',
      'Conecte en serie el portapilas con interruptor, la resistencia de 4,7 Ω, el multímetro en escala de corriente y el cable.',
      'Electroimán: enrolle sobre la puntilla 50 vueltas apretadas de alambre esmaltado, lije 1 cm de cada punta y deje 20 cm libres para conectar.',
      'Para la parte cuantitativa, ubique el celular de modo que su magnetómetro quede alineado con el eje de la bobina, a unos 3 cm de su extremo.'
    ],
    seguridad: [
      { p: 'Corriente alta por el cable y las pilas', c: 'elec', ef: 'Calentamiento del cable, de la resistencia y de las pilas; quemaduras leves', ctrl: 'Resistencia limitadora, fusible de 2 A, interruptor de botón: corriente solo durante la lectura (menos de 10 s); dejar enfriar.', nd: 2, ne: 2, nc: 10 },
      { p: 'Puntas de alambre y lija', c: 'mec', ef: 'Pinchazos y cortes', ctrl: 'Lijar con el alambre apoyado en la mesa; doblar las puntas.', nd: 0, ne: 2, nc: 10 },
      { p: 'Imanes y campos cerca de marcapasos o tarjetas', c: 'elec', ef: 'Interferencia', ctrl: 'Preguntar si alguien usa dispositivos médicos; alejar tarjetas.', nd: 0, ne: 1, nc: 60 }
    ],
    epp: 'no se requieren; solo muy baja tensión.',
    procedimiento: [
      'Con la corriente apagada, anote la orientación de la aguja (0°). Cierre el interruptor y anote el ángulo de desviación φ y la corriente.',
      'Repita para cinco corrientes entre 0,1 A y 0,6 A (cambie la resistencia o el número de pilas), siempre por pocos segundos.',
      'Invierta la corriente y verifique que la aguja gira al otro lado. Repita con el cable por debajo de la brújula.',
      'Electroimán: conecte la bobina por unos segundos y cuente cuántos clips levanta. Repita con 25 y 75 vueltas y sin la puntilla.',
      'Con el celular, mida el campo en el eje de la bobina para cinco corrientes; reste la lectura con corriente cero.'
    ],
    tabla: { cols: ['<i>I</i> (A)', 'φ (°)', 'tan φ', '<i>N</i> vueltas', 'clips levantados', '<i>B</i> celular (µT)'], filas: 7 },
    analisis: [
      'Grafique tan φ contra I y ajuste una recta por el origen. La pendiente vale μ₀/(2π d B<sub>H</sub>).',
      'Despeje B<sub>H</sub> y compárelo con el valor del IGRF para su municipio (apéndice A).',
      'Grafique el campo medido con el celular contra la corriente: ¿es proporcional?',
      'Describa cómo cambia la fuerza del electroimán con el número de vueltas y con el núcleo.'
    ],
    esperado: 'En Popayán (B<sub>H</sub> = 26,7 µT según el IGRF-14), con el cable a 2 cm, la aguja se desvía 4,3° con 0,2 A, 8,5° con 0,4 A y 12,7° con 0,6 A; la pendiente de tan φ contra I es 0,375 A⁻¹. En la costa B<sub>H</sub> es un poco mayor (27,0 µT en Barranquilla) y las desviaciones algo menores. Una bobina de 100 vueltas sin núcleo, 5 cm de largo y 1 cm de diámetro, con 0,5 A, da unos 7 µT a 3 cm de su extremo; con núcleo de hierro el campo crece muchas veces.',
    errores: [
      ['Brújula cerca de objetos de hierro o del celular.', 'Desvían la aguja; se aleja todo lo metálico y se verifica la orientación sin corriente.'],
      ['Cable no paralelo a la aguja.', 'Entonces el campo del cable no es perpendicular al terrestre y la fórmula tan φ = B/B<sub>H</sub> deja de valer.'],
      ['Mantener la corriente encendida.', 'El cable y las pilas se calientan, la corriente baja y el fusible puede abrir; se mide por pocos segundos.'],
      ['Olvidar restar la lectura del celular sin corriente.', 'El magnetómetro mide también el campo terrestre y los imanes del propio teléfono.']
    ],
    orientadoras: [
      '¿Cómo podrían detectar un campo magnético sin un instrumento especial?',
      '¿De qué variables podría depender la desviación de la brújula y cómo las controlarán?',
      '¿Qué gráfica les permitiría obtener el campo terrestre de su municipio?',
      '¿Cómo harían un imán más fuerte con el mismo alambre y la misma pila?'
    ],
    abierta: 'En un depósito de chatarra se usa una grúa con electroimán. Diseñen y construyan un electroimán con materiales simples e investiguen qué variables determinan su fuerza, presentando un modelo que explique sus resultados y una recomendación de diseño.',
    preguntas: [
      '¿Por qué la aguja gira al otro lado al invertir la corriente o al pasar el cable por debajo?',
      '¿Por qué el núcleo de hierro hace el electroimán mucho más fuerte?',
      '¿Qué tienen en común un electroimán, el timbre del colegio y un parlante?',
      'Explique con sus resultados el enunciado del DBA: «cuando las cargas están en movimiento generan fuerzas magnéticas».'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un grupo mide el ángulo φ que se desvía una brújula bajo un cable para varias corrientes I. Sabiendo que tan φ = μ₀ I/(2π d B<sub>H</sub>), para obtener el campo terrestre B<sub>H</sub> con una recta deben graficar',
      opciones: ['φ contra I.', 'tan φ contra I.', 'φ contra 1/I.', 'I contra d.'],
      clave: 'B',
      just: 'tan φ es proporcional a I con pendiente μ₀/(2π d B<sub>H</sub>); conocidos μ₀ y d, la pendiente da B<sub>H</sub>. La gráfica de φ contra I se curva para ángulos grandes.'
    },
    rubrica: [['Campo de una corriente', 'No relaciona corriente y desviación.', 'Describe la desviación cualitativamente.', 'Obtiene B<sub>H</sub> por linealización y lo compara con el IGRF.', 'Explica la dirección del campo con la regla de la mano derecha y el papel del núcleo con evidencia.']],
    referencias: ['H. C. Ørsted, «Experimenta circa effectum conflictus electrici in acum magneticam», 1820.', 'IAGA, International Geomagnetic Reference Field, 14.ª generación (IGRF-14), 2024.']
  });
})();
