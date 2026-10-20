/* Montaje elaborado FE-09 · Rendimiento de un motor que levanta una masa */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'motor', cod: 'FE-09', titulo: 'Rendimiento de un motor eléctrico que levanta una masa', grado: 11, tipo: 'elaborada',
    tiempo: 110, grupo: '4 estudiantes', nivel: 2,
    dba: ['10.2', '11.3'], est: ['C3', 'C4', 'C5', 'C10', 'C12', 'C14', 'F3', 'F11', 'T2', 'T3'], comp: ['uso', 'ind', 'exp'], temas: ['Transformación y conservación de energía', 'Electromagnetismo', 'Energía mecánica'],
    pregunta: '¿Qué fracción de la energía eléctrica que recibe un motor pequeño se convierte en energía potencial de la masa que levanta, y cómo depende esa fracción de la carga?',
    contexto: 'Los motores eléctricos mueven ventiladores, bombas de agua y bicicletas eléctricas. Un motorreductor de juguete, de los que se usan en los carros robóticos, levanta una masa con un hilo enrollado en su eje. Midiendo la tensión, la corriente y el tiempo de subida, los estudiantes calculan la potencia eléctrica, la potencia mecánica y el rendimiento, y descubren que existe una carga para la cual el motor aprovecha mejor la energía.',
    objetivos: [
      'Medir la potencia eléctrica que recibe un motor y la potencia mecánica con que levanta una masa.',
      'Calcular el rendimiento para varias masas y encontrar la carga de rendimiento máximo.',
      'Obtener la constante del motor y el par de rozamiento a partir de la recta corriente–masa.'
    ],
    prediccion: 'Si se cuelga cada vez más masa del motor, ¿qué creen que pasa con la corriente, con la rapidez de subida y con el rendimiento? ¿Habrá una masa «ideal»?',
    claves: [
      'Potencia eléctrica: P_e = V I. Potencia mecánica útil: P_m = m g h / t. Rendimiento: η = P_m / P_e.',
      'La corriente de un motor de imanes permanentes es proporcional al par que entrega: I = (m g r + τ_f) / k.',
      'La energía que no se convierte en trabajo útil se disipa como calor en el bobinado (I²R) y en el rozamiento de los engranajes.',
      'Con poca carga casi toda la energía se va en rozamiento; con mucha, en calor del bobinado: el rendimiento es máximo en un punto intermedio.'
    ],
    materiales: [
      ['Motorreductor de 3 a 6 V (tipo «TT» amarillo, relación 1:48)', '1', 'Motor de juguete con poleas', 8000],
      ['Portapilas de 3 pilas AA (4,5 V) con interruptor', '1', 'Fuente USB de 5 V con cable cortado', 6000],
      ['Carrete o tapa de 3 cm de diámetro pegado al eje', '1', 'Eje desnudo', 0],
      ['Hilo de nailon de 1,5 m', '1', '—', 1000],
      ['Masas de 50 a 500 g (bolsas de arena pesadas en balanza)', '6', 'Botellas con agua', 0],
      ['Dos multímetros (tensión y corriente en la escala de 2 A o 10 A)', '2', '1 por turnos', 30000],
      ['Cinta métrica y marcas de 1,00 m en la pared', '1', '—', 0],
      ['Celular para grabar la subida en video o cronómetro', '1', '—', 0],
      ['Prensa o cinta para fijar el motor al borde de la mesa', '1', '—', 5000]
    ],
    montaje: [
      'Fije el motor al borde de la mesa con el eje horizontal, sobresaliendo, y pegue el carrete al eje.',
      'Ate el hilo al carrete y cuelgue la masa; marque en la pared una altura de 1,00 m a partir de la posición inicial de la masa.',
      'Conecte el amperímetro en serie con el motor y el voltímetro en paralelo con sus terminales.',
      'Ponga una caja con espuma debajo de la masa por si el hilo se suelta.'
    ],
    seguridad: [
      { p: 'Masa que cae si el hilo se rompe o se suelta', c: 'mec', ef: 'Golpe en pies o manos', ctrl: 'Masas de 500 g o menos; caja con espuma debajo; nadie con los pies bajo la masa.', nd: 2, ne: 2, nc: 25 },
      { p: 'Engranajes y eje en movimiento', c: 'mec', ef: 'Atrapamiento de cabello o dedos (par pequeño)', ctrl: 'Cabello recogido; no tocar el carrete en movimiento; interruptor al alcance.', nd: 2, ne: 2, nc: 10 },
      { p: 'Motor bloqueado', c: 'elec', ef: 'Calentamiento del motor y de las pilas', ctrl: 'Si el motor no gira, abrir el interruptor de inmediato; no superar 500 g.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren; cabello recogido.',
    procedimiento: [
      'Mida la masa colgante con la balanza (incluya el gancho).',
      'Encienda el motor con la masa en el piso de la caja; cuando suba con rapidez constante, lea la tensión y la corriente, y mida el tiempo para subir el último metro.',
      'Repita tres veces y promedie el tiempo.',
      'Repita para masas de 50, 100, 200, 300, 400 y 500 g.',
      'Mida el diámetro del carrete con el hilo enrollado.',
      'Al terminar, entregue las pilas gastadas en un punto de recolección selectiva (Resolución 851 de 2022).'
    ],
    tabla: { cols: ['<i>m</i> (g)', '<i>V</i> (V)', '<i>I</i> (A)', '<i>t</i> para 1 m (s)', '<i>P</i><sub>e</sub> (W)', '<i>P</i><sub>m</sub> (W)', 'η (%)'], filas: 7 },
    analisis: [
      'Calcule P_e, P_m y η para cada masa y grafique η contra m.',
      'Grafique I contra m y ajuste una recta: de la pendiente, g r / k, obtenga la constante del motor k; de la ordenada, τ_f / k, el par de rozamiento.',
      'Calcule para cada masa la energía disipada por segundo y compárela con I²R, midiendo R con el óhmetro con el motor detenido.',
      '¿Para qué masa el rendimiento es máximo? Compare con la predicción I* = √(I₀ I_bloqueo).'
    ],
    esperado: 'Con un motorreductor de parámetros ilustrativos (R = 6 Ω, k = 0,27 V·s/rad, τ_f = 0,02 N·m), carrete de 1,5 cm de radio y 4,5 V: con 200 g la corriente es 0,183 A, la masa sube a 0,189 m/s (1 m en 5,3 s), P_e = 0,82 W, P_m = 0,37 W y η = 45 %. El rendimiento máximo, 47 %, se obtiene cerca de 300 g; con 50 g baja a 23 %. La recta I contra m tiene pendiente 0,543 A/kg y ordenada 0,074 A. Cada motor real tiene sus propios parámetros: lo que se compara es la forma de las curvas.',
    errores: [
      ['Medir el tiempo desde el arranque.', 'Al principio la masa acelera; la rapidez constante se alcanza en pocos centímetros, pero conviene cronometrar solo el último metro.'],
      ['Leer la corriente en el arranque.', 'La corriente de arranque es mucho mayor que la de régimen; se lee cuando la subida es estable.'],
      ['No medir la tensión en los bornes del motor.', 'La tensión de las pilas baja con la corriente; la potencia eléctrica es la que entra al motor.'],
      ['Ignorar el diámetro del hilo enrollado.', 'El radio efectivo crece con cada vuelta; el carrete grande y el hilo fino reducen el efecto.']
    ],
    orientadoras: [
      '¿Qué magnitudes necesitan medir para conocer la energía que entra y la que sale del motor?',
      '¿Cómo medirán la rapidez de subida si al comienzo la masa acelera?',
      '¿Qué esperan que ocurra con la corriente cuando aumenta la masa?',
      '¿A dónde va la energía que no se convierte en energía potencial?'
    ],
    abierta: 'Una comunidad rural quiere subir agua de un aljibe con una bomba eléctrica alimentada por un panel solar. Usen su motor como modelo para investigar cómo escoger la carga para aprovechar mejor la energía y qué datos pedirían al fabricante de la bomba.',
    preguntas: [
      '¿Por qué el rendimiento es bajo con poca carga y también con mucha carga?',
      '¿Por qué se calienta un motor bloqueado?',
      '¿Cuánta energía química de las pilas se habrá gastado para subir 300 g un metro?',
      '¿Qué cambiaría si se usara un carrete de mayor diámetro?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Un motor recibe 0,80 W de potencia eléctrica y levanta una masa de 0,20 kg a 0,19 m/s (g ≈ 9,8 m/s²). Su rendimiento es aproximadamente',
      opciones: ['24 %', '47 %', '76 %', '100 %'],
      clave: 'B',
      just: 'P_m = m g v = 0,20 × 9,8 × 0,19 ≈ 0,37 W; η = 0,37 / 0,80 ≈ 0,47.'
    },
    rubrica: [['Transformaciones de energía', 'Describe el funcionamiento sin cuantificar.', 'Calcula potencias eléctrica y mecánica.', 'Obtiene el rendimiento y la curva η–m con incertidumbre.', 'Explica las pérdidas con el modelo I²R + rozamiento y obtiene los parámetros del motor.']],
    referencias: ['P. A. Tipler y G. Mosca, <i>Física para la ciencia y la tecnología</i>, cap. 27: motores de corriente continua.', 'Ministerio de Ambiente y Desarrollo Sostenible, Resolución 851 de 2022, sistemas de recolección selectiva de RAEE, incluidas pilas y acumuladores.', 'MEN, DBA de Ciencias Naturales V.1, grado 10.°, DBA 2.']
  });
})();
