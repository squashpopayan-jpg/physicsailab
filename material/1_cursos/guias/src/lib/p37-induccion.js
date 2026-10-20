/* Práctica F11-10 · Inducción electromagnética: imán que cae */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'induccion', cod: 'F11-10', titulo: 'Inducción electromagnética: el imán que cae', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 2,
    dba: ['11.2'], est: ['C2', 'C3', 'C4', 'C12', 'F10', 'T3'], comp: ['exp', 'ind'], temas: ['Electromagnetismo', 'Transformación y conservación de energía'],
    pregunta: '¿Qué pasa cuando un imán atraviesa una bobina o cae por dentro de un tubo de cobre, y qué magnitud se conserva aunque el imán caiga más rápido?',
    contexto: 'Las centrales hidroeléctricas de Colombia, como las del río Cauca, producen electricidad moviendo imanes cerca de bobinas. Faraday lo descubrió en 1831. Con un imán de neodimio, una bobina de alambre esmaltado y un tubo de cobre de ferretería se observan los dos efectos de la inducción: la fem que aparece y el frenado que produce.',
    objetivos: [
      'Observar el frenado de un imán que cae por un tubo de cobre y compararlo con un tubo de PVC.',
      'Registrar la fem inducida en una bobina cuando un imán la atraviesa y describir la forma del pulso.',
      'Comprobar que el área bajo cada pulso de fem (N veces el flujo máximo) no depende de la rapidez del imán, mientras la fem máxima sí.'
    ],
    prediccion: 'Un imán y un trozo de hierro del mismo tamaño se sueltan por un tubo de cobre. ¿Cuál llega primero? Si el imán cae desde más alto a través de una bobina, ¿la fem será mayor, menor o igual? ¿Y la duración del pulso?',
    claves: [
      'Ley de Faraday: un cambio del flujo magnético a través de un circuito induce una fem ε = −N dΦ/dt.',
      'Ley de Lenz: la corriente inducida produce un campo que se opone al cambio que la causó; por eso el tubo de cobre frena al imán.',
      'Al entrar y al salir el imán de la bobina, el flujo aumenta y luego disminuye: la fem tiene dos pulsos de signo contrario.',
      'El área de cada pulso, ∫ε dt, vale N Φ<sub>máx</sub> y no depende de la rapidez: un imán más rápido da un pulso más alto y más angosto.'
    ],
    materiales: [
      ['Imán de neodimio cilíndrico de 10 mm × 5 mm (o varios apilados)', '2', 'Imán de nevera potente (el efecto será menor)', 6000],
      ['Tubo de cobre de 1/2 pulgada y 60 cm y tubo de PVC del mismo largo', '1 de cada uno', 'Tubo de aluminio', 25000],
      ['Alambre esmaltado calibre 30, unos 20 m, para una bobina de 200 vueltas sobre un tubo de PVC de 1 pulgada', '1', 'Bobina de un relé o de un transformador viejo', 12000],
      ['Arduino con dos resistencias de 10 kΩ (divisor para centrar la señal) o multímetro con registro de máximo', '1', 'LED rojo y bobina de muchas vueltas (efecto cualitativo)', 25000],
      ['Cronómetro del celular', '1', '—', 0],
      ['Caja con espuma para recibir el imán', '1', 'Toalla doblada', 0]
    ],
    montaje: [
      'Enrolle 200 vueltas apretadas de alambre esmaltado sobre la mitad de un tubo de PVC de 1 pulgada, en un tramo de 1 cm; lije las puntas.',
      'Conecte la bobina al Arduino: una punta a un divisor de 2,5 V (dos resistencias de 10 kΩ entre 5 V y GND) y la otra a la entrada A0, de modo que la señal oscile alrededor de 2,5 V.',
      'Cargue un programa que lea A0 cada 0,2 ms durante 1 s cuando se presione un botón, y envíe los datos por el puerto serie (el capítulo 13 explica la adquisición).',
      'Ponga la caja con espuma debajo de los tubos para recibir el imán.'
    ],
    seguridad: [
      { p: 'Imanes de neodimio que se atraen bruscamente', c: 'mec', ef: 'Pellizcos; astillas del imán', ctrl: 'Manipular un imán a la vez; separarlos deslizando; contarlos al final.', nd: 2, ne: 2, nc: 10 },
      { p: 'Ingestión de imanes', c: 'mec', ef: 'Perforación intestinal si se tragan dos', ctrl: 'Guardarlos contados en caja cerrada; no se los llevan los estudiantes.', nd: 2, ne: 1, nc: 60 },
      { p: 'Imanes cerca de celulares, tarjetas o marcapasos', c: 'elec', ef: 'Daño de dispositivos; interferencia', ctrl: 'Mantener a más de 15 cm; preguntar por dispositivos médicos.', nd: 0, ne: 2, nc: 60 }
    ],
    epp: 'gafas al manipular varios imanes de neodimio (pueden astillarse).',
    procedimiento: [
      'Suelte el imán por el tubo de PVC y luego por el de cobre, desde el mismo punto. Cronometre el tiempo de caída de cada uno tres veces. Repita con un trozo de hierro del mismo tamaño.',
      'Sujete la bobina vertical. Inicie la adquisición y suelte el imán desde 10 cm sobre la bobina para que caiga por el tubo y la atraviese.',
      'Repita desde 20, 30 y 40 cm. Repita con el imán invertido.',
      'Guarde los datos de cada caída para analizarlos en la hoja de cálculo.'
    ],
    tabla: { cols: ['Altura de caída <i>h</i> (m)', '<i>v</i> = √(2<i>gh</i>) (m/s)', 'ε máxima (V)', 'duración del pulso (ms)', '∫ε d<i>t</i> del primer pulso (mV·s)'], filas: 5 },
    analisis: [
      'Compare los tiempos de caída en cobre y PVC: ¿cuántas veces más lento cae el imán en el cobre? ¿Y el hierro?',
      'En cada registro, identifique los dos pulsos de signo contrario y mida la fem máxima y la duración.',
      'Calcule el área de cada pulso (suma de ε·Δt) y compárela entre las distintas alturas.',
      'Grafique la fem máxima contra la rapidez del imán: ¿es proporcional?'
    ],
    esperado: 'En el tubo de cobre el imán tarda varias veces más que en el PVC; el hierro cae igual en ambos. Con un imán de 10 mm × 5 mm (momento cercano a 0,37 A·m²) y una bobina de 200 vueltas de 1,5 cm de radio, la fem máxima es de unos 0,26 V cayendo desde 10 cm y 0,51 V desde 40 cm, mientras el área de cada pulso se mantiene en unos 3,1 mV·s.',
    errores: [
      ['Concluir que el cobre «atrae» al imán.', 'El cobre no es magnético; el hierro cae igual en ambos tubos. El frenado se debe a corrientes inducidas (Lenz).'],
      ['Muestrear muy despacio.', 'El pulso dura pocos milisegundos; se muestrea cada 0,2 ms o más rápido.'],
      ['Imán que roza las paredes.', 'Cambia la rapidez y el resultado; se usa un tubo guía de diámetro algo mayor que el imán.'],
      ['Ignorar el signo de los pulsos.', 'El cambio de signo entre la entrada y la salida es la evidencia de la ley de Lenz.']
    ],
    orientadoras: [
      '¿Qué tiene que cambiar para que aparezca corriente en una bobina?',
      '¿Cómo registrarán una señal que dura pocos milisegundos?',
      '¿Qué variable cambiarán para estudiar el efecto de la rapidez del imán?',
      '¿Cómo explicarían el frenado en el tubo de cobre usando la conservación de la energía?'
    ],
    abierta: 'Una vereda quiere iluminar su escuela con un pequeño generador movido por el agua de una quebrada. Investiguen con imanes y bobinas de qué depende la fem inducida y propongan un diseño de generador con su justificación física.',
    preguntas: [
      '¿A dónde va la energía potencial del imán que cae lentamente por el tubo de cobre?',
      '¿Por qué los dos pulsos de fem tienen signos contrarios?',
      '¿Por qué el área bajo el pulso no depende de la rapidez del imán?',
      '¿Cómo se aplica la inducción en una central hidroeléctrica y en los frenos de algunos trenes?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un imán se suelta por dentro de un tubo vertical de cobre y tarda mucho más en caer que por un tubo de plástico igual. La mejor explicación es que',
      opciones: ['el cobre atrae magnéticamente al imán.', 'el movimiento del imán induce corrientes en el cobre que generan un campo que se opone a su movimiento.', 'el aire dentro del tubo de cobre es más denso.', 'el imán pierde su magnetismo dentro del cobre.'],
      clave: 'B',
      just: 'El cobre no es ferromagnético. El flujo variable induce corrientes en las paredes (corrientes de Foucault) que, según la ley de Lenz, producen un campo que se opone al cambio y frena al imán; su energía se disipa como calor en el cobre.'
    },
    rubrica: [['Modelo de inducción', 'No relaciona movimiento del imán y corriente.', 'Describe que el movimiento produce corriente.', 'Interpreta los pulsos con Faraday y Lenz y mide fem y área.', 'Demuestra con datos que el área es constante y explica el frenado con la conservación de la energía.']],
    referencias: ['M. Faraday, «Experimental researches in electricity», <i>Philosophical Transactions</i> 122, 125–162, 1832.', 'C. S. MacLatchy, P. Backman y L. Bogan, «A quantitative magnetic braking experiment», <i>American Journal of Physics</i> 61, 1096–1101, 1993.']
  });
})();
