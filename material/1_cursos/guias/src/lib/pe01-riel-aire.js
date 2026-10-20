/* Montaje elaborado FE-01 · Riel de aire con fotopuertas */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'riel-aire', cod: 'FE-01', titulo: 'Riel de aire con fotopuertas: segunda ley y choques casi sin fricción', grado: 10, tipo: 'elaborada',
    tiempo: 165, grupo: '4 estudiantes', nivel: 2,
    dba: ['10.1', '10.2'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'F1', 'F2', 'F5'], comp: ['ind', 'uso'], temas: ['Dinámica', 'Energía mecánica'],
    pregunta: '¿Se cumplen la segunda ley de Newton y la conservación del momento cuando casi se elimina la fricción, y con qué precisión podemos comprobarlo?',
    contexto: 'Los rieles de aire comerciales cuestan millones de pesos. Un tubo de PVC perforado y un soplador hacen lo mismo: el deslizador flota sobre un colchón de aire y la fricción casi desaparece. Con dos fotopuertas hechas con un Arduino, las velocidades se miden con milésimas de precisión.',
    objetivos: [
      'Construir un riel de aire y dos fotopuertas, y caracterizar la fricción residual del deslizador.',
      'Medir la aceleración del deslizador con fotopuertas y poner a prueba la segunda ley con masa total constante.',
      'Verificar la conservación del momento lineal en choques elásticos e inelásticos y calcular la energía cinética perdida.'
    ],
    prediccion: 'Si se empuja suavemente el deslizador sobre el riel horizontal, ¿la velocidad medida en la segunda fotopuerta será igual, mayor o menor que en la primera? En un choque con velcro entre dos deslizadores iguales, ¿con qué velocidad se mueven juntos?',
    claves: [
      'El deslizador flota sobre aire a presión: la fricción con el riel es casi nula y queda una resistencia viscosa pequeña.',
      'Una bandera de ancho w que bloquea la fotopuerta durante Δt da la velocidad v = w/Δt.',
      'Con dos fotopuertas separadas d: a = (v₂² − v₁²)/(2d).',
      'En un choque se conserva el momento lineal total; la energía cinética solo en los elásticos.'
    ],
    materiales: [
      ['Tubo de PVC sanitario de 2 pulgadas y 2 m, con tapón en un extremo', '1', 'Perfil de aluminio cuadrado de 2 pulgadas', 30000],
      ['Broca de 1 mm y taladro para perforar agujeros cada 2 cm en dos líneas a 45°', '1', 'Puntilla calentada (más lento)', 0],
      ['Soplador: secador de pelo en modo frío o aspiradora con salida de soplado, con adaptador', '1', 'Inflador eléctrico de colchones', 0],
      ['Deslizadores: dos trozos de 15 cm de tubo de 2,5 pulgadas cortados a lo largo', '2', 'Ángulo de aluminio de 2 pulgadas', 8000],
      ['Arduino Uno o Nano, dos módulos de barrera óptica (o LED IR y fototransistor) y cables', '1', 'Celular grabando a 240 cuadros por segundo', 45000],
      ['Banderas de cartón negro de 5,00 cm medidas con calibrador', '2', '—', 500],
      ['Velcro, dos imanes de neodimio pequeños, plastilina', '1', '—', 8000],
      ['Polea de rodamiento 608, hilo y portapesas con arandelas de 2 g', '1', '—', 6000],
      ['Tornillos niveladores o cuñas para nivelar el riel', '3', 'Cartón doblado', 2000]
    ],
    cortes: [
      ['Tubo de 2″ (riel)', '2000 mm', '1', 'Agujeros de 1 mm cada 20 mm en dos filas a ±45° de la parte superior'],
      ['Tubo de 2,5″ (deslizadores)', '150 mm, cortado a lo largo en mitades', '2', 'Lijar bordes; deben apoyarse sobre las dos filas de agujeros'],
      ['Bandera de cartón negro', '50,0 × 30 mm', '2', 'Pegada vertical en el centro del deslizador'],
      ['Soportes de madera en V', '80 × 60 × 18 mm', '3', 'Con tornillo nivelador en dos de ellos']
    ],
    montaje: [
      'Perfore el tubo de 2 pulgadas con agujeros de 1 mm cada 2 cm en dos filas a ±45° de la generatriz superior. Tape un extremo y adapte el soplador al otro con cinta.',
      'Corte los deslizadores, lije sus bordes y péguele a cada uno una bandera de 5,00 cm y, en sus extremos, velcro o un imán.',
      'Apoye el riel en tres soportes en V sobre la mesa y nivélelo: con el soplador encendido, un deslizador en reposo no debe moverse hacia ningún lado.',
      'Monte las dos fotopuertas a 50 cm de distancia una de otra, a la altura de las banderas, y conéctelas al Arduino con el programa del capítulo 13.',
      'Para la segunda ley, ponga la polea al final del riel y un hilo del deslizador al portapesas.'
    ],
    seguridad: [
      { p: 'Soplador conectado a la red', c: 'elec', ef: 'Contacto eléctrico, calentamiento del motor', ctrl: 'Equipo certificado conectado a toma con GFCI; cable lejos del paso; apagar cada 15 min para que se enfríe.', nd: 2, ne: 3, nc: 25 },
      { p: 'Taladro y rebabas del PVC al construir', c: 'mec', ef: 'Cortes, virutas en los ojos', ctrl: 'Construcción por el docente o con supervisión; gafas; pieza prensada.', nd: 2, ne: 1, nc: 25 },
      { p: 'Ruido del soplador o la aspiradora', c: 'ruido', ef: 'Molestia auditiva', ctrl: 'Encenderlo solo durante las medidas; secador en velocidad baja.', nd: 2, ne: 3, nc: 10 },
      { p: 'Imanes de neodimio', c: 'mec', ef: 'Pellizcos, ingestión', ctrl: 'Pegados al deslizador; contados al final.', nd: 0, ne: 2, nc: 25 }
    ],
    epp: 'gafas durante la construcción.',
    procedimiento: [
      'Fricción residual: empuje suavemente el deslizador sin hilo y registre las velocidades en las dos fotopuertas para cinco empujones distintos.',
      'Segunda ley: con 10 arandelas de 2 g repartidas entre el deslizador y el portapesas, suelte el deslizador desde el reposo antes de la primera fotopuerta y registre v₁ y v₂. Pase arandelas al portapesas de una en una.',
      'Choque inelástico: deslizador 2 en reposo entre las fotopuertas, deslizador 1 lanzado contra él con velcro; registre la velocidad antes (fotopuerta 1) y la del conjunto después (fotopuerta 2).',
      'Choque elástico: repita con imanes enfrentados que se repelen; registre las tres velocidades.',
      'Repita cada choque cinco veces con velocidades distintas.'
    ],
    tabla: { cols: ['Ensayo', '<i>m</i> colgante (kg)', 'Δ<i>t</i>₁ (ms)', 'Δ<i>t</i>₂ (ms)', '<i>v</i>₁ (m/s)', '<i>v</i>₂ (m/s)', '<i>a</i> (m/s²)'], filas: 8 },
    analisis: [
      'Con los empujones sin hilo, calcule la pérdida relativa de velocidad entre fotopuertas: es la medida de la fricción residual.',
      'Calcule a = (v₂² − v₁²)/(2d) para cada fuerza y grafique a contra mg. La pendiente es 1/(masa total efectiva).',
      'Compare la masa total obtenida con la de la balanza más la masa efectiva de la polea.',
      'En los choques, calcule el momento antes y después y la razón de energías cinéticas; grafique el momento final contra el inicial.'
    ],
    esperado: 'Con un deslizador de 200 g, la fricción residual reduce la velocidad menos de 1 % entre fotopuertas separadas 50 cm. Con 10 g colgando y masa total efectiva de 221 g (deslizador de 200 g, 20 g de arandelas y 1 g equivalente de la polea) la aceleración es 0,442 m/s²; la pendiente de a contra mg da la masa con 1 % o mejor. En los choques el momento se conserva dentro de 2 %; con velcro entre deslizadores iguales se pierde la mitad de la energía cinética.',
    errores: [
      ['Riel desnivelado.', 'Una inclinación de 1 mm por metro produce una aceleración de 0,01 m/s², comparable a las señales con masas pequeñas; se nivela con el deslizador en reposo.'],
      ['Agujeros tapados o de distinto tamaño.', 'El colchón de aire no es uniforme y el deslizador roza; se limpian y se revisa que flote en todo el largo.'],
      ['Bandera mal medida o inclinada.', 'El error de w pasa completo a v; se mide con calibrador y se pega perpendicular.'],
      ['Soltar el deslizador justo en la fotopuerta.', 'La primera medida queda incompleta; se suelta antes.']
    ],
    orientadoras: [
      '¿Cómo comprobarán que la fricción es despreciable antes de poner a prueba la segunda ley?',
      '¿Cómo obtendrán la aceleración a partir de lo que miden las fotopuertas?',
      '¿Cómo variarán la fuerza sin cambiar la masa del sistema?',
      '¿Qué medirán en un choque para saber qué se conserva?'
    ],
    abierta: 'Con el riel de aire, diseñen una investigación para responder: en los choques entre deslizadores, ¿qué se conserva siempre, qué depende del tipo de choque y cómo se puede predecir el resultado de un choque nuevo?',
    preguntas: [
      '¿Por qué el riel de aire permite poner a prueba la primera ley mejor que una mesa?',
      '¿Qué diferencia hay entre los resultados con fricción (práctica F10-06) y sin ella?',
      'En el choque con velcro, ¿a dónde va la energía cinética que se pierde?',
      '¿Cómo se usa la conservación del momento para estudiar accidentes de tránsito?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Un deslizador de 0,2 kg que se mueve a 0,4 m/s choca con otro de 0,2 kg en reposo y quedan unidos. La velocidad del conjunto y la fracción de energía cinética que se conserva son, respectivamente,',
      opciones: ['0,4 m/s y 100 %.', '0,2 m/s y 50 %.', '0,2 m/s y 100 %.', '0,1 m/s y 25 %.'],
      clave: 'B',
      just: 'Por conservación del momento: 0,2 × 0,4 = 0,4 v, de donde v = 0,2 m/s. La energía cinética pasa de ½·0,2·0,4² = 0,016 J a ½·0,4·0,2² = 0,008 J: se conserva el 50 %.'
    },
    rubrica: [['Construcción e instrumentación', 'El riel no funciona.', 'El riel flota pero no está caracterizado.', 'Riel nivelado y fotopuertas calibradas; fricción residual medida.', 'Cuantifica todas las fuentes de error del montaje y propone mejoras.']],
    referencias: ['Capítulos 11 y 13 del cuaderno: construcción y fotopuertas.', 'G. Organtini, <i>Physics Experiments with Arduino and Smartphones</i>, Springer, 2021.']
  });
})();
