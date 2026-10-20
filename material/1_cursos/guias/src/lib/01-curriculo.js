/* ===================================================================
   01-curriculo.js — Referentes curriculares del MEN y del ICFES
   (sin DOM: lo usan el navegador y build.js)
   Fuentes, consultadas el 19-10-2026:
   · DBA Ciencias Naturales V.1 (MEN–U. de Antioquia, 2016; la copia que
     Colombia Aprende volvió a publicar el 25-05-2026 sigue siendo la V.1).
   · Estándares Básicos de Competencias en Ciencias Naturales (MEN, 2004;
     Guía 7 «Formar en ciencias: ¡el desafío!»), grados décimo a undécimo.
   · ICFES, infografía de la prueba de Ciencias Naturales Saber 11.° (2025).
   Los enunciados se transcriben textualmente.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});

  EM.CUR = {
    dba: {
      '9.1': {
        grado: 9,
        t: 'Comprende que el movimiento de un cuerpo, en un marco de referencia inercial dado, se puede describir con gráficos y predecir por medio de expresiones matemáticas.',
        ev: [
          'Describe el movimiento de un cuerpo (rectilíneo uniforme y uniformemente acelerado, en dos dimensiones – circular uniforme y parabólico) en gráficos que relacionan el desplazamiento, la velocidad y la aceleración en función del tiempo.',
          'Predice el movimiento de un cuerpo a partir de las expresiones matemáticas con las que se relaciona, según el caso, la distancia recorrida, la velocidad y la aceleración en función del tiempo.',
          'Identifica las modificaciones necesarias en la descripción del movimiento de un cuerpo, representada en gráficos, cuando se cambia de marco de referencia.'
        ]
      },
      '10.1': {
        grado: 10,
        t: 'Comprende, que el reposo o el movimiento rectilíneo uniforme, se presentan cuando las fuerzas aplicadas sobre el sistema se anulan entre ellas, y que en presencia de fuerzas resultantes no nulas se producen cambios de velocidad.',
        ev: [
          'Predice el equilibrio (de reposo o movimiento uniforme en línea recta) de un cuerpo a partir del análisis de las fuerzas que actúan sobre él (primera ley de Newton).',
          'Estima, a partir de las expresiones matemáticas, los cambios de velocidad (aceleración) que experimenta un cuerpo a partir de la relación entre fuerza y masa (segunda ley de Newton).',
          'Identifica, en diferentes situaciones de interacción entre cuerpos (de forma directa y a distancia), la fuerza de acción y la de reacción e indica sus valores y direcciones (tercera ley de Newton).'
        ]
      },
      '10.2': {
        grado: 10,
        t: 'Comprende la conservación de la energía mecánica como un principio que permite cuantificar y explicar diferentes fenómenos mecánicos: choques entre cuerpos, movimiento pendular, caída libre, deformación de un sistema masa-resorte.',
        ev: [
          'Predice cualitativa y cuantitativamente el movimiento de un cuerpo al hacer uso del principio de conservación de la energía mecánica en diferentes situaciones físicas.',
          'Identifica, en sistemas no conservativos (fricción, choques no elásticos, deformación, vibraciones) las transformaciones de energía que se producen en concordancia con la conservación de la energía.'
        ]
      },
      '11.1': {
        grado: 11,
        t: 'Comprende la naturaleza de la propagación del sonido y de la luz como fenómenos ondulatorios (ondas mecánicas y electromagnéticas, respectivamente).',
        ev: [
          'Clasifica las ondas de luz y sonido según el medio de propagación (mecánicas y electromagnéticas) y la dirección de la oscilación (longitudinales y transversales).',
          'Aplica las leyes y principios del movimiento ondulatorio (ley de reflexión, de refracción y principio de Huygens) para predecir el comportamiento de una onda y los hace visibles en casos prácticos, al incluir cambio de medio de propagación.',
          'Explica los fenómenos ondulatorios de sonido y luz en casos prácticos (reflexión, refracción, interferencia, difracción, polarización).',
          'Explica las cualidades del sonido (tono, intensidad, audibilidad) y de la luz (color y visibilidad) a partir de las características del fenómeno ondulatorio (longitud de onda, frecuencia, amplitud).'
        ]
      },
      '11.2': {
        grado: 11,
        t: 'Comprende que la interacción de las cargas en reposo genera fuerzas eléctricas y que cuando las cargas están en movimiento genera fuerzas magnéticas.',
        ev: [
          'Identifica el tipo de carga eléctrica (positiva o negativa) que adquiere un material cuando se somete a procedimientos de fricción o contacto.',
          'Reconoce que las fuerzas eléctricas y magnéticas pueden ser de atracción y repulsión, mientras que las gravitacionales solo generan efectos de atracción.',
          'Construye y explica el funcionamiento de un electroimán.'
        ]
      },
      '11.3': {
        grado: 11,
        t: 'Comprende las relaciones entre corriente y voltaje en circuitos resistivos sencillos en serie, en paralelo y mixtos.',
        ev: [
          'Determina las corrientes y los voltajes en elementos resistivos de un circuito eléctrico utilizando la ley de Ohm.',
          'Identifica configuraciones en serie, en paralelo y mixtas en diferentes circuitos representados en esquemas.',
          'Identifica características de circuitos en serie y paralelo a partir de la construcción de circuitos con resistencias.',
          'Predice los cambios de iluminación en bombillos resistivos en un circuito al alterarlo (eliminar o agregar componentes en diferentes lugares).'
        ]
      }
    },
    /* Estándares de décimo a undécimo. Claves: C = me aproximo al conocimiento
       como científico natural; F = entorno físico, procesos físicos;
       T = ciencia, tecnología y sociedad (los relacionados con física);
       S = desarrollo compromisos personales y sociales (los pertinentes al laboratorio). */
    est: {
      C1: 'Observo y formulo preguntas específicas sobre aplicaciones de teorías científicas.',
      C2: 'Formulo hipótesis con base en el conocimiento cotidiano, teorías y modelos científicos.',
      C3: 'Identifico variables que influyen en los resultados de un experimento.',
      C4: 'Propongo modelos para predecir los resultados de mis experimentos y simulaciones.',
      C5: 'Realizo mediciones con instrumentos y equipos adecuados.',
      C6: 'Registro mis observaciones y resultados utilizando esquemas, gráficos y tablas.',
      C7: 'Registro mis resultados en forma organizada y sin alteración alguna.',
      C8: 'Establezco diferencias entre descripción, explicación y evidencia.',
      C9: 'Establezco diferencias entre modelos, teorías, leyes e hipótesis.',
      C10: 'Utilizo las matemáticas para modelar, analizar y presentar datos y modelos en forma de ecuaciones, funciones y conversiones.',
      C11: 'Busco información en diferentes fuentes, escojo la pertinente y doy el crédito correspondiente.',
      C12: 'Establezco relaciones causales y multicausales entre los datos recopilados.',
      C13: 'Relaciono la información recopilada con los datos de mis experimentos y simulaciones.',
      C14: 'Interpreto los resultados teniendo en cuenta el orden de magnitud del error experimental.',
      C15: 'Saco conclusiones de los experimentos que realizo, aunque no obtenga los resultados esperados.',
      C16: 'Persisto en la búsqueda de respuestas a mis preguntas.',
      C17: 'Propongo y sustento respuestas a mis preguntas y las comparo con las de otros y con las de teorías científicas.',
      C18: 'Comunico el proceso de indagación y los resultados, utilizando gráficas, tablas, ecuaciones aritméticas y algebraicas.',
      C19: 'Relaciono mis conclusiones con las presentadas por otros autores y formulo nuevas preguntas.',
      F1: 'Establezco relaciones entre las diferentes fuerzas que actúan sobre los cuerpos en reposo o en movimiento rectilíneo uniforme y establezco condiciones para conservar la energía mecánica.',
      F2: 'Modelo matemáticamente el movimiento de objetos cotidianos a partir de las fuerzas que actúan sobre ellos.',
      F3: 'Explico la transformación de energía mecánica en energía térmica.',
      F4: 'Establezco relaciones entre estabilidad y centro de masa de un objeto.',
      F5: 'Establezco relaciones entre la conservación del momento lineal y el impulso en sistemas de objetos.',
      F6: 'Explico el comportamiento de fluidos en movimiento y en reposo.',
      F7: 'Relaciono masa, distancia y fuerza de atracción gravitacional entre objetos.',
      F8: 'Establezco relaciones entre el modelo del campo gravitacional y la ley de gravitación universal.',
      F9: 'Establezco relaciones entre fuerzas macroscópicas y fuerzas electrostáticas.',
      F10: 'Establezco relaciones entre campo gravitacional y electrostático y entre campo eléctrico y magnético.',
      F11: 'Relaciono voltaje y corriente con los diferentes elementos de un circuito eléctrico complejo y para todo el sistema.',
      T1: 'Explico aplicaciones tecnológicas del modelo de mecánica de fluidos.',
      T2: 'Analizo el desarrollo de los componentes de los circuitos eléctricos y su impacto en la vida diaria.',
      T3: 'Analizo el potencial de los recursos naturales en la obtención de energía para diferentes usos.',
      S1: 'Escucho activamente a mis compañeros y compañeras, reconozco otros puntos de vista, los comparo con los míos y puedo modificar lo que pienso ante argumentos más sólidos.',
      S2: 'Reconozco y acepto el escepticismo de mis compañeros y compañeras ante la información que presento.',
      S3: 'Reconozco que los modelos de la ciencia cambian con el tiempo y que varios pueden ser válidos simultáneamente.',
      S4: 'Cumplo mi función cuando trabajo en grupo y respeto las funciones de otras personas.',
      S5: 'Diseño y aplico estrategias para el manejo de basuras en mi colegio.'
    },
    /* Enunciados generales «Al final de undécimo grado…» del entorno físico */
    finales: [
      'Explico las fuerzas entre objetos como interacciones debidas a la carga eléctrica y a la masa.',
      'Utilizo modelos biológicos, físicos y químicos para explicar la transformación y conservación de la energía.'
    ],
    saber: {
      competencias: {
        uso: ['Uso comprensivo del conocimiento científico', 'Evalúa la capacidad para comprender y usar conceptos, teorías y modelos para solucionar problemas.'],
        exp: ['Explicación de fenómenos', 'Evalúa la capacidad para analizar críticamente argumentos y modelos que explican fenómenos.'],
        ind: ['Indagación', 'Evalúa la capacidad para reconocer preguntas y procedimientos adecuados, y buscar, seleccionar e interpretar información.']
      },
      fisico: ['Cinemática', 'Dinámica', 'Energía mecánica', 'Ondas', 'Energía térmica', 'Electromagnetismo', 'Campo gravitacional', 'Transformación y conservación de energía'],
      cts: 'Temáticas interdisciplinares relacionadas con las ciencias naturales; algunas son globales y otras son locales.'
    }
  };
  EM.CUR.estGrupo = (k) => ({ C: 'Me aproximo al conocimiento como científico(a) natural', F: 'Entorno físico · procesos físicos', T: 'Ciencia, tecnología y sociedad', S: 'Desarrollo compromisos personales y sociales' }[k[0]]);
})();
