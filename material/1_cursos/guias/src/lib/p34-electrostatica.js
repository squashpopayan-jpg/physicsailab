/* Práctica F11-07 · Electrostática: carga por frotamiento, electroscopio y péndulos */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'electrostatica', cod: 'F11-07', titulo: 'Electrostática: frotar, tocar, inducir y medir la carga', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 2,
    dba: ['11.2'], est: ['C2', 'C3', 'C8', 'C12', 'F9', 'F10'], comp: ['exp', 'ind'], temas: ['Electromagnetismo'],
    pregunta: '¿Qué signo de carga adquiere cada material al frotarlo, cómo se transfiere la carga y cuánta carga llevan dos esferas que se repelen?',
    contexto: 'Un globo frotado en el cabello se pega a la pared y al quitarse un saco de lana se oyen chasquidos. En las ciudades secas estos efectos son fuertes; en Quibdó o en Tumaco, con aire muy húmedo, casi desaparecen. La electrostática se puede estudiar con globos, tubos de PVC, papel aluminio y un frasco, siempre que se elija bien la hora y el lugar.',
    objetivos: [
      'Construir un electroscopio y usarlo para identificar el signo de la carga que adquieren distintos materiales al frotarlos.',
      'Distinguir la carga por frotamiento, por contacto y por inducción.',
      'Estimar la carga de dos esferas livianas que se repelen a partir de su separación, con la ley de Coulomb.'
    ],
    prediccion: 'Si se frota un tubo de PVC con lana y se acerca, sin tocarla, a la esfera del electroscopio, ¿se separan las láminas? ¿Qué carga tienen? ¿Qué pasa si se toca la esfera con un dedo mientras el tubo sigue cerca y luego se retira?',
    claves: [
      'Al frotar dos materiales, uno pierde electrones (queda positivo) y el otro los gana (queda negativo); la serie triboeléctrica ordena los materiales según esa tendencia.',
      'Cargas del mismo signo se repelen y de signo contrario se atraen; las fuerzas gravitacionales solo atraen.',
      'Por contacto, el objeto queda con carga del mismo signo; por inducción, con carga de signo contrario a la del objeto que se acerca.',
      'Ley de Coulomb: F = k q₁q₂/r², con k = 8,99 × 10⁹ N·m²/C². Una carga de pocos nanocoulombs basta para separar esferas de icopor.'
    ],
    materiales: [
      ['Frasco de vidrio con tapa plástica, clip de alambre y dos tiras de papel aluminio de 1 × 4 cm (electroscopio)', '1', 'Botella plástica seca', 1000],
      ['Tubo de PVC de 1/2 pulgada y 30 cm', '1', 'Regla plástica o peinilla', 2000],
      ['Globos', '3', '—', 1500],
      ['Paños: lana, algodón, seda o nailon, papel', '1 juego', 'Prendas de vestir', 0],
      ['Dos esferas de icopor de 1 cm forradas en papel aluminio, con hilo de nailon de 30 cm', '2', 'Bolitas de papel aluminio', 1000],
      ['Soporte con brazo para colgar las esferas y regla', '1', 'Lápiz entre dos libros', 0],
      ['Balanza de 0,01 g para pesar las esferas', '1', 'Pesar diez esferas juntas en balanza de 1 g', 0],
      ['Secador de pelo para secar los materiales (lo opera el docente)', '1', '—', 0]
    ],
    montaje: [
      'Atraviese la tapa del frasco con el clip estirado; doble su extremo inferior en forma de L y cuelgue de él las dos tiras de aluminio; en el extremo superior haga una bola de papel aluminio.',
      'Seque el frasco, los paños y los tubos con el secador o al sol antes de empezar.',
      'Cuelgue las dos esferas forradas del mismo punto del brazo del soporte, con hilos de 30 cm, de modo que se toquen.',
      'Pese las esferas y mida la longitud de los hilos.'
    ],
    seguridad: [
      { p: 'Secador de pelo conectado a la red', c: 'elec', ef: 'Quemaduras, contacto eléctrico', ctrl: 'Lo opera el docente, en toma con GFCI, lejos del agua.', nd: 2, ne: 1, nc: 25 },
      { p: 'Descargas electrostáticas', c: 'elec', ef: 'Molestia leve, sin riesgo', ctrl: 'Se advierte; lejos de equipos electrónicos sensibles.', nd: 0, ne: 2, nc: 10 },
      { p: 'Globos de látex', c: 'bio', ef: 'Reacción alérgica en personas sensibles', ctrl: 'Preguntar por alergias; usar globos sin látex o tubos de PVC.', nd: 2, ne: 1, nc: 25 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Frote el tubo de PVC con lana y acérquelo a la bola del electroscopio sin tocarla. Observe las láminas; aleje el tubo.',
      'Toque la bola con el tubo cargado y retírelo: el electroscopio queda cargado por contacto. Acerque ahora otros materiales frotados y observe si las láminas se abren más (mismo signo) o se cierran (signo contrario).',
      'Construya una serie triboeléctrica: frote cada par de materiales y pruebe el signo de cada uno con el electroscopio cargado de signo conocido (el PVC frotado con lana queda negativo).',
      'Carga por inducción: acerque el tubo cargado, toque la bola con el dedo, retire el dedo y luego el tubo. Compruebe el signo de la carga del electroscopio.',
      'Toque las dos esferas colgadas con el tubo cargado: se separan. Mida la distancia entre sus centros y repita varias veces cargándolas más o menos.'
    ],
    tabla: { cols: ['Material frotado', 'Frotado con', 'Signo observado', 'Separación de las esferas <i>d</i> (m)', 'θ (°)', '<i>q</i> estimada (nC)'], filas: 7 },
    analisis: [
      'Ordene los materiales en una serie triboeléctrica y compárela con la de los libros.',
      'Explique con dibujos de cargas qué pasó en la carga por contacto y en la carga por inducción.',
      'Para las esferas: sen θ = d/(2L), la fuerza eléctrica es F = m g tan θ y, con q₁ = q₂ = q, q = d √(F/k).',
      'Compare la fuerza eléctrica con el peso de una esfera y con la atracción gravitacional entre ellas.'
    ],
    esperado: 'El PVC y el globo frotados con lana o con el cabello quedan negativos; la lana, positiva. Dos esferas de 0,15 g colgadas de hilos de 30 cm se separan 4,5 cm con 5 nC cada una y 7,2 cm con 10 nC. Con 5 nC, la fuerza eléctrica entre ellas es unas 1,5 × 10¹¹ veces mayor que la atracción gravitacional.',
    errores: [
      ['Trabajar en un día o un salón húmedos.', 'La humedad descarga los objetos en segundos; se seca el material y se trabaja en la hora más seca, o se acepta como variable de estudio.'],
      ['Tocar las esferas o la bola con la mano al manipularlas.', 'Las descarga a tierra; se manipulan por los hilos o con objetos aislantes.'],
      ['Confundir atracción por inducción con carga de signo contrario.', 'Un objeto neutro también es atraído por uno cargado; el signo se prueba con repulsión, no con atracción.'],
      ['Medir la separación entre bordes.', 'La ley de Coulomb usa la distancia entre centros.']
    ],
    orientadoras: [
      '¿Cómo podrían saber si un objeto está cargado y cuál es el signo de su carga?',
      '¿Por qué la atracción no sirve para saber el signo y la repulsión sí?',
      '¿Cómo podrían cargar un objeto sin tocarlo con el objeto cargado?',
      '¿Qué deben medir para estimar la carga de dos esferas que se repelen?'
    ],
    abierta: 'En las bodegas y estaciones de combustible se toman precauciones contra la electricidad estática. Investiguen qué variables (material, humedad, número de frotamientos) determinan cuánta carga adquiere un objeto y cuánto tiempo la conserva, y propongan recomendaciones.',
    preguntas: [
      '¿Por qué los experimentos de electrostática funcionan peor en clima húmedo?',
      '¿Un objeto neutro es atraído por uno cargado? Explique con un dibujo de cargas.',
      'Compare la fuerza eléctrica y la gravitacional entre las dos esferas. ¿Por qué no notamos fuerzas eléctricas entre objetos cotidianos?',
      '¿Por qué los camiones de combustible llevan una cadena o cable que toca el suelo?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un tubo de PVC frotado con lana queda con carga negativa. Si se acerca, sin tocarla, a una esfera metálica neutra aislada, la esfera',
      opciones: ['queda con carga negativa permanente.', 'es atraída, porque sus electrones se alejan del tubo y el lado cercano queda positivo.', 'es repelida, porque ambos tienen carga negativa.', 'no siente ninguna fuerza, porque es neutra.'],
      clave: 'B',
      just: 'El tubo induce una separación de cargas en la esfera: los electrones se alejan y el lado cercano queda positivo. Como ese lado está más cerca del tubo, la atracción supera a la repulsión y la esfera es atraída, aunque su carga neta siga siendo cero.'
    },
    rubrica: [['Modelo de cargas', 'No distingue los signos.', 'Identifica atracción y repulsión.', 'Explica frotamiento, contacto e inducción con diagramas y estima q con Coulomb.', 'Argumenta el signo con pruebas de repulsión y discute la humedad como variable.']],
    referencias: ['MEN, DBA de Ciencias Naturales V.1, grado 11.°, DBA 2, evidencias 1 y 2.']
  });
})();
