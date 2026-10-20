/* Práctica F10-09 · Choques: rebote de una pelota y colisión de dos esferas */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'choques', cod: 'F10-09', titulo: 'Choques: el rebote de una pelota y el momento lineal', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 1,
    dba: ['10.2'], est: ['C3', 'C5', 'C10', 'C12', 'F5', 'F3'], comp: ['ind', 'exp'], temas: ['Energía mecánica', 'Dinámica', 'Transformación y conservación de energía'],
    pregunta: '¿Qué fracción de su energía pierde una pelota en cada rebote y qué se conserva cuando dos esferas chocan?',
    contexto: 'Las federaciones deportivas definen qué tan «viva» debe ser una pelota: la de tenis, soltada desde 254 cm sobre concreto, debe rebotar entre 135 y 147 cm, y la mesa de ping-pong debe devolver unos 23 cm a una pelota soltada desde 30 cm. Con el micrófono del celular se puede medir lo mismo en el salón, sin medir alturas.',
    objetivos: [
      'Medir el coeficiente de restitución de una pelota a partir de los tiempos entre rebotes registrados con el micrófono del celular.',
      'Calcular la fracción de energía mecánica que se disipa en cada rebote.',
      'Verificar la conservación del momento lineal en el choque de dos esferas en un riel, medido con video.'
    ],
    prediccion: '¿El tiempo entre rebotes se mantiene, disminuye a la mitad o disminuye un poco cada vez? ¿Qué se conserva en un choque entre dos canicas: la velocidad, la energía cinética o el momento lineal?',
    claves: [
      'Coeficiente de restitución: e = rapidez después del choque / rapidez antes. Vale 1 en un choque elástico y 0 en uno perfectamente inelástico.',
      'Tras cada rebote la altura máxima se multiplica por e² y el tiempo de vuelo por e: Δt<sub>n+1</sub> = e Δt<sub>n</sub>.',
      'En cada rebote se pierde una fracción 1 − e² de la energía mecánica, que se convierte en sonido, calor y deformación.',
      'En un choque entre dos cuerpos aislados se conserva el momento lineal total m₁v₁ + m₂v₂, aunque la energía cinética no se conserve.'
    ],
    materiales: [
      ['Pelota de ping-pong, pelota de tenis y pelota saltarina de caucho', '1 de cada una', 'Las pelotas disponibles en el colegio', 6000],
      ['Celular con phyphox (experimento «Colisión inelástica»)', '1', 'Grabadora de audio y Audacity en un computador', 0],
      ['Superficie dura: baldosa o mesa firme', '—', 'Piso del salón', 0],
      ['Riel de cortina de 1 m y dos esferas de acero de distinta masa', '1', 'Dos canicas de distinto tamaño en un canal', 6000],
      ['Celular para grabar video a 60 o 240 cuadros por segundo', '1', 'Video a 30 cuadros por segundo', 0],
      ['Balanza (0,1 g o mejor)', '1', 'Balanza de joyería', 0],
      ['Flexómetro y cinta de enmascarar', '1', '—', 8000]
    ],
    montaje: [
      'Abra en phyphox el experimento «Colisión inelástica» (o el cronómetro acústico) y ajuste el umbral de sonido para que detecte los golpes y no la voz.',
      'Ubique el celular sobre la superficie de rebote, cerca del punto de impacto, y pida silencio en el salón.',
      'Para la parte B, nivele el riel sobre la mesa, marque una escala cada 5 cm y ubique la cámara perpendicular al riel.',
      'Pese las dos esferas.'
    ],
    seguridad: [
      { p: 'Pelotas que salen rebotando', c: 'loc', ef: 'Tropiezos', ctrl: 'Soltar desde máximo 1,5 m, lejos de pasillos; recoger de inmediato.', nd: 2, ne: 2, nc: 10 },
      { p: 'Esferas de acero que caen del riel', c: 'mec', ef: 'Golpe en los pies', ctrl: 'Topes en los extremos del riel; trabajar sobre la mesa.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Parte A. Suelte la pelota de ping-pong desde unos 50 cm sobre la superficie y deje que phyphox registre los golpes hasta que la pelota casi se detenga. Repita tres veces.',
      'Repita con la pelota de tenis y con la saltarina, y con la de ping-pong sobre otra superficie (piso, cartón, mesa de madera).',
      'Parte B. Coloque la esfera liviana en reposo en el centro del riel. Lance la pesada contra ella con un empujón suave y grabe el choque.',
      'Repita la parte B cinco veces con distintas velocidades de lanzamiento.',
      'En el video, mida las velocidades antes y después del choque con la escala y el número de cuadros.'
    ],
    tabla: { cols: ['Rebote <i>n</i>', 'Instante del golpe (s)', 'Δ<i>t</i><sub>n</sub> (s)', 'ln Δ<i>t</i><sub>n</sub>', '<i>h</i><sub>n</sub> = <i>g</i>Δ<i>t</i>²/8 (m)'], filas: 8 },
    analisis: [
      'Calcule los intervalos Δt<sub>n</sub> entre golpes sucesivos.',
      'Grafique ln Δt<sub>n</sub> contra n y ajuste una recta: la pendiente es ln e, de modo que e = exp(pendiente).',
      'Calcule la altura de cada rebote, h = gΔt²/8, y la fracción de energía perdida por rebote, 1 − e².',
      'Parte B: calcule m₁v₁ antes y m₁v₁′ + m₂v₂′ después de cada choque y grafique el momento final contra el inicial: la pendiente debería ser 1.',
      'Calcule la razón entre la energía cinética final y la inicial en cada choque.'
    ],
    esperado: 'La pelota de tenis reglamentaria tiene e entre 0,73 y 0,76 sobre concreto (pierde cerca de 45 % de su energía en cada rebote); la de ping-pong sobre una mesa reglamentaria, cerca de 0,88; las saltarinas pueden superar 0,85. Soltada desde 1 m, una pelota con e = 0,745 tarda 0,674 s entre el primer y el segundo golpe. En los choques entre esferas de acero, el momento total se conserva dentro de unos pocos por ciento y la energía cinética no.',
    errores: [
      ['Superficie que se mueve o vibra.', 'Una mesa liviana absorbe energía y baja e; se mide sobre el piso o una baldosa firme.'],
      ['Umbral de sonido mal ajustado.', 'Si phyphox detecta ecos o voces, aparecen intervalos falsos; se revisa la secuencia y se ajusta el umbral.'],
      ['Suponer que e no depende de la velocidad.', 'En muchas pelotas e aumenta un poco a bajas velocidades; la recta ln Δt–n se curva al final, y se usan los primeros rebotes.'],
      ['Ignorar la rotación de las esferas en el riel.', 'Las esferas ruedan; parte de su energía es de rotación y el choque no es exactamente el de dos partículas.']
    ],
    orientadoras: [
      '¿Cómo pueden medir la altura de cada rebote sin medir alturas?',
      '¿Qué gráfica les permitirá obtener e a partir de muchos rebotes?',
      '¿Qué magnitudes deben medir antes y después de un choque para saber qué se conserva?',
      '¿Cómo diseñarán los choques para que sean en línea recta?'
    ],
    abierta: 'El equipo de baloncesto del colegio sospecha que sus balones están «muertos». Diseñen un procedimiento con el celular para comparar la calidad de rebote de los balones y de distintas superficies de juego, y presenten sus resultados al equipo.',
    preguntas: [
      '¿A dónde va la energía que pierde la pelota en cada rebote?',
      '¿Por qué una pelota nunca deja de rebotar «en teoría» pero sí en la práctica?',
      '¿Se conservó el momento lineal en sus choques? ¿Y la energía cinética? ¿Qué tipo de choque fue?',
      'Una pelota de tenis cumple el reglamento si rebota entre 135 y 147 cm desde 254 cm. ¿Qué rango de e corresponde?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Una pelota se suelta desde 1,0 m y en cada rebote su rapidez se reduce a 0,8 veces la que tenía justo antes del choque. La altura que alcanza después del primer rebote es',
      opciones: ['0,80 m.', '0,64 m.', '0,40 m.', '0,20 m.'],
      clave: 'B',
      just: 'La altura es proporcional al cuadrado de la rapidez: h₁ = e² h₀ = 0,8² × 1,0 m = 0,64 m. Equivale a decir que se pierde el 36 % de la energía mecánica en el rebote.'
    },
    rubrica: [['Conservación y disipación', 'No distingue momento de energía.', 'Calcula e con un solo rebote.', 'Obtiene e por linealización y la energía perdida; verifica la conservación del momento.', 'Explica con evidencia por qué el momento se conserva y la energía no, y las limitaciones del modelo.']],
    referencias: ['ITF, <i>Rules of Tennis</i>, Apéndice I: especificaciones de la pelota.', 'ITTF, <i>Handbook</i>, Leyes del tenis de mesa, 2.1: la mesa.', 'S. Staacks et al., «Advanced tools for smartphone-based experiments: phyphox», <i>Physics Education</i> 53, 045009, 2018.']
  });
})();
