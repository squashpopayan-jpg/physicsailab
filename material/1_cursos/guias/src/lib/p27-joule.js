/* Práctica F10-14 · Tubo de perdigones: de energía mecánica a energía térmica */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'joule', cod: 'F10-14', titulo: 'El tubo de perdigones: energía mecánica que se vuelve calor', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '4 estudiantes que se turnan para invertir el tubo', nivel: 2,
    dba: ['10.2'], est: ['C2', 'C3', 'C5', 'C10', 'C14', 'C15', 'F3'], comp: ['exp', 'ind'], temas: ['Energía térmica', 'Transformación y conservación de energía', 'Energía mecánica'],
    pregunta: '¿Cuánto se calientan unos perdigones de acero al dejarlos caer cien veces dentro de un tubo, y qué fracción de su energía potencial se convierte en energía térmica?',
    contexto: 'En 1845 James Joule midió cuánto trabajo mecánico produce una cantidad dada de calor agitando agua con unas paletas movidas por pesas que caían. Su experimento fundó la idea de que el calor es una forma de energía. Un tubo con perdigones de acero que se invierte una y otra vez reproduce la idea con materiales de ferretería.',
    objetivos: [
      'Medir el aumento de temperatura de unos perdigones en función del número de caídas dentro de un tubo.',
      'Comparar la energía potencial perdida con la energía térmica ganada y estimar la eficiencia de la conversión.',
      'Identificar las pérdidas de energía hacia el tubo y el ambiente y proponer cómo reducirlas.'
    ],
    prediccion: '¿Cuántos grados creen que se calientan los perdigones después de 100 caídas de 1 m? ¿Depende el resultado de la masa de perdigones que se use?',
    claves: [
      'En cada caída de altura L, los perdigones pierden energía potencial m g L, que en el choque con el fondo se convierte sobre todo en energía térmica.',
      'Después de N caídas, si todo se queda en los perdigones: m c ΔT = N m g L, de modo que ΔT = N g L / c. La masa se cancela.',
      'Con acero (c ≈ 0,47 J/g·°C) y L = 1 m, 100 caídas calientan unos 2 °C en el caso ideal.',
      'Parte de la energía se va al tubo, al aire y en sonido: el aumento real es menor y la fracción η = ΔT<sub>medido</sub>/ΔT<sub>ideal</sub> mide la eficiencia.'
    ],
    materiales: [
      ['Tubo de PVC de 1 1/2 pulgada y 1 m con dos tapones', '1', 'Tubo de cartón grueso de 1 m con tapas de madera', 15000],
      ['Perdigones o balines de acero (balines de cicla de 4 a 6 mm)', '300 g a 500 g', 'Tornillos y tuercas pequeñas; arena seca (efecto menor)', 12000],
      ['Termómetro digital de punzón (0,1 °C)', '1', 'Sensor DS18B20 con Arduino', 15000],
      ['Vaso de icopor para medir la temperatura de los perdigones', '1', 'Vaso de cartón', 300],
      ['Cinta aislante o espuma para forrar el tubo', '1', 'Toalla delgada', 3000],
      ['Flexómetro', '1', '—', 0]
    ],
    montaje: [
      'Tape un extremo del tubo con su tapón y fórrelo con cinta o espuma para reducir el calor que le pasan los perdigones.',
      'Deje los perdigones dentro del vaso de icopor hasta que alcancen la temperatura ambiente y mídala.',
      'Mida la longitud interna del tubo y la altura que ocupan los perdigones en el fondo: la altura de caída efectiva es L menos esa altura.',
      'Vierta los perdigones en el tubo y tape el otro extremo.'
    ],
    seguridad: [
      { p: 'Tapón que se suelta y perdigones que se riegan', c: 'loc', ef: 'Resbalones y caídas', ctrl: 'Tapones asegurados con cinta; trabajar sobre una bandeja; recoger con un imán.', nd: 2, ne: 2, nc: 10 },
      { p: 'Golpes con el tubo al invertirlo', c: 'mec', ef: 'Golpes en la cara o las manos de compañeros', ctrl: 'Espacio libre de 1,5 m alrededor; el tubo se invierte en un plano vertical, con las dos manos.', nd: 2, ne: 3, nc: 10 },
      { p: 'Perdigones de plomo', c: 'quim', ef: 'Intoxicación por contacto e ingestión de polvo de plomo', ctrl: 'Eliminación: se usan solo balines de acero; el plomo está prohibido en esta práctica.', nd: 0, ne: 1, nc: 60 },
      { p: 'Fatiga por las inversiones repetidas', c: 'biom', ef: 'Molestias en hombros y muñecas', ctrl: 'Turnos de 25 inversiones por estudiante.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Mida la temperatura inicial de los perdigones en el vaso de icopor (temperatura T₀).',
      'Invierta el tubo 50 veces, cada vez con un giro rápido para que los perdigones caigan toda la longitud. Cuente en voz alta y túrnense.',
      'Vierta los perdigones en el vaso de icopor, mezcle con el termómetro y registre la temperatura máxima.',
      'Deje enfriar a la temperatura ambiente y repita con 100, 150 y 200 inversiones.',
      'Mida también cuánto se enfrían los perdigones en el vaso durante un minuto, para estimar las pérdidas.'
    ],
    tabla: { cols: ['<i>N</i> inversiones', '<i>T</i>₀ (°C)', '<i>T</i> final (°C)', 'Δ<i>T</i> (°C)', 'Δ<i>T</i> ideal = <i>NgL</i>/<i>c</i> (°C)', 'η'], filas: 5 },
    analisis: [
      'Calcule ΔT para cada N y su incertidumbre (la del termómetro y la de la lectura máxima).',
      'Grafique ΔT contra N y ajuste una recta: la pendiente vale η g L/c.',
      'Calcule la eficiencia η con c = 0,466 J/(g·°C) para el acero y la gravedad del municipio.',
      'Explique hacia dónde se fue la energía que no calentó los perdigones.'
    ],
    esperado: 'Con L efectiva de 0,95 m y acero, 100 caídas darían 1,99 °C si toda la energía quedara en los perdigones; el aumento medido es menor porque el tubo, el aire y el sonido se llevan una parte; el banco virtual supone una eficiencia de 80 %, que da 1,6 °C. Con plomo el aumento sería de 7,2 °C, pero su toxicidad lo excluye; con arena seca, de 1,1 °C.',
    errores: [
      ['Inversiones lentas.', 'Si los perdigones resbalan en vez de caer, no recorren L completa y pierden energía en fricción con las paredes; se gira con rapidez.'],
      ['Medir la temperatura dentro del tubo con los perdigones dispersos.', 'Se vierten en el vaso y se mezclan: la temperatura debe ser la del conjunto.'],
      ['Ignorar la altura del montón.', 'La caída real es la longitud interna menos la altura de los perdigones en el fondo.'],
      ['Partir de perdigones más fríos o más calientes que el ambiente.', 'Ganan o pierden calor del ambiente durante el experimento; se dejan equilibrar antes de empezar.']
    ],
    orientadoras: [
      '¿Qué forma de energía tienen los perdigones al empezar cada caída y en qué se convierte al chocar con el fondo?',
      '¿De qué variables debería depender el aumento de temperatura? ¿Y de cuáles no?',
      '¿Cómo medirán la temperatura de los perdigones con la mejor precisión?',
      '¿Cómo estimarán las pérdidas de energía?'
    ],
    abierta: 'Un mecánico afirma que los frenos de un carro se calientan porque «el movimiento se convierte en calor». Diseñen un experimento con materiales simples para cuantificar esa conversión y evaluar qué fracción de la energía mecánica se transforma en energía térmica.',
    preguntas: [
      '¿Por qué el aumento de temperatura no depende de la masa de perdigones?',
      '¿Por qué conviene usar acero y no arena? ¿Por qué no plomo, aunque daría un efecto mayor?',
      '¿A dónde va la energía que no calienta los perdigones?',
      '¿Cómo se relaciona esta práctica con el experimento de Joule de 1845?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un grupo invierte 100 veces un tubo de 1 m con 200 g de perdigones de acero y mide un aumento de 1,5 °C. Otro grupo usa 400 g de los mismos perdigones en un tubo idéntico con el mismo número de inversiones. Es de esperar que el segundo grupo mida un aumento de temperatura',
      opciones: ['de 0,75 °C, porque hay más masa que calentar.', 'cercano a 1,5 °C, porque la energía ganada y la necesaria crecen con la masa.', 'de 3,0 °C, porque hay más energía potencial.', 'nulo, porque los perdigones se amortiguan entre sí.'],
      clave: 'B',
      just: 'La energía potencial perdida en cada caída es proporcional a la masa (m g L) y la energía necesaria para elevar la temperatura también (m c ΔT). La masa se cancela: ΔT ≈ N g L / c para ambos grupos.'
    },
    rubrica: [['Transformación de energía', 'No relaciona el calentamiento con la caída.', 'Explica cualitativamente la conversión.', 'Calcula el ΔT ideal y la eficiencia con incertidumbre.', 'Identifica y cuantifica las pérdidas y propone mejoras al montaje.']],
    referencias: ['J. P. Joule, «On the mechanical equivalent of heat», <i>Philosophical Transactions of the Royal Society</i> 140, 61–82, 1850.']
  });
})();
