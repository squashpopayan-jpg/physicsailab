/* Práctica F10-07 · Equilibrio rotacional, centro de masa y estabilidad */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'torque', cod: 'F10-07', titulo: 'Equilibrio de una regla, centro de masa y estabilidad', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['10.1'], est: ['C3', 'C4', 'C5', 'C10', 'F1', 'F4'], comp: ['uso', 'exp'], temas: ['Dinámica'],
    pregunta: '¿Se puede «pesar» un objeto, e incluso la propia regla, usando solo una regla en equilibrio y una masa conocida?',
    contexto: 'Las romanas de las plazas de mercado pesan bultos de varios kilos con una pesa pequeña que se desliza por un brazo graduado. Funcionan con la misma ley que usó Arquímedes: en equilibrio, los momentos de las fuerzas a ambos lados del apoyo se compensan.',
    objetivos: [
      'Aplicar la condición de equilibrio rotacional para determinar una masa desconocida con una regla y masas patrón.',
      'Determinar la masa de la propia regla desplazando el punto de apoyo y usando su centro de masa.',
      'Localizar experimentalmente el centro de masa de una figura plana y relacionarlo con su estabilidad.'
    ],
    prediccion: 'Si una tuerca de 50 g cuelga a 20 cm del apoyo, ¿dónde hay que colgar una de 100 g para equilibrar la regla? ¿Qué pasa si la regla no se apoya en su centro?',
    claves: [
      'El momento (torque) de una fuerza respecto al apoyo es la fuerza por su distancia perpendicular al apoyo: τ = F d.',
      'En equilibrio, la suma de los momentos que hacen girar en un sentido iguala la de los que hacen girar en el otro.',
      'El peso de un cuerpo actúa en su centro de masa; el de una regla uniforme, en su punto medio.',
      'Un objeto apoyado es estable mientras la vertical que pasa por su centro de masa cae dentro de su base de apoyo.'
    ],
    materiales: [
      ['Regla de madera de 1 m con un agujero en la marca de 50 cm', '1', 'Listón de 1 m graduado con cinta', 5000],
      ['Clavo o puntilla como eje y soporte (o prisma triangular de madera)', '1', 'Borde de una escuadra', 500],
      ['Tuercas o arandelas pesadas: 50 g, 100 g, 150 g, 200 g', '1 juego', 'Bolsitas con arena pesadas', 3000],
      ['Ganchos de alambre o lazos de hilo para colgar las masas', '6', 'Clips', 500],
      ['Objeto de masa desconocida (llavero, candado pequeño)', '1', 'Cualquier objeto de 50 g a 150 g', 0],
      ['Figura de cartón paja en forma de L y plomada (hilo y tuerca)', '1', 'Cartón de caja', 500],
      ['Balanza (1 g) para verificar', '1', 'Balanza del laboratorio', 0]
    ],
    montaje: [
      'Atraviese la regla con el clavo en la marca de 50 cm y fije el clavo horizontal en el soporte; la regla debe girar libremente.',
      'Si la regla no queda horizontal sola, pegue un poco de plastilina en el lado liviano hasta equilibrarla y anótelo.',
      'Prepare lazos de hilo que se puedan deslizar a lo largo de la regla para colgar las masas; lea la posición en el centro del lazo.',
      'Recorte la figura en L de 20 cm × 20 cm con brazos de 5 cm de ancho y hágale tres agujeros pequeños cerca del borde.'
    ],
    seguridad: [
      { p: 'Masas que caen de la regla', c: 'mec', ef: 'Golpes leves en los pies', ctrl: 'Lazos cerrados; masas de máximo 200 g; trabajar sobre la mesa.', nd: 2, ne: 2, nc: 10 },
      { p: 'Clavo y cortes al recortar el cartón', c: 'mec', ef: 'Pinchazos y cortes leves', ctrl: 'Clavo con cabeza protegida; cortar con bisturí sobre una base y con regla metálica.', nd: 2, ne: 1, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Cuelgue el objeto desconocido a 30 cm del apoyo. Equilibre la regla con la masa de 50 g del otro lado y anote su distancia. Repita con 100 g, 150 g y 200 g.',
      'Retire las masas, mueva el apoyo a la marca de 30 cm y equilibre la regla colgando 100 g del lado corto. Anote la posición.',
      'Cuelgue la figura en L de uno de sus agujeros junto con la plomada y trace la vertical. Repita desde los otros dos agujeros: el cruce de las líneas es el centro de masa.',
      'Apoye una caja alta sobre la mesa e inclínela poco a poco hasta que se vuelque; mida el ángulo y las dimensiones de la caja.'
    ],
    tabla: { cols: ['<i>m</i><sub>k</sub> (kg)', '<i>d</i><sub>k</sub> (m)', '1/<i>m</i><sub>k</sub> (kg⁻¹)', '<i>d</i><sub>x</sub> (m)', '<i>m</i><sub>x</sub> calculada (kg)'], filas: 6 },
    analisis: [
      'Con cada par, calcule m<sub>x</sub> = m<sub>k</sub> d<sub>k</sub>/d<sub>x</sub>. Mejor aún: grafique d<sub>k</sub> contra 1/m<sub>k</sub>; la pendiente es m<sub>x</sub> d<sub>x</sub>.',
      'Compare m<sub>x</sub> con la masa medida en la balanza.',
      'Con el apoyo en 30 cm: m<sub>r</sub> (0,50 − 0,30) = m<sub>k</sub> (0,30 − x<sub>k</sub>). Despeje la masa de la regla y verifíquela en la balanza.',
      'Compare el centro de masa de la L encontrado con la plomada con el calculado por áreas: (6,8 cm; 6,8 cm) desde la esquina exterior.',
      'Para la caja, compare el ángulo de vuelco medido con arctan(b/2h), donde b es el ancho de la base y h la altura del centro de masa.'
    ],
    esperado: 'Con un objeto de 85 g a 30 cm, la masa de 50 g se equilibra a 51,0 cm, la de 100 g a 25,5 cm y la de 200 g a 12,8 cm: d<sub>k</sub> es proporcional a 1/m<sub>k</sub> con pendiente 0,0255 kg·m. El centro de masa de la L de 20 cm con brazos de 5 cm está a 6,8 cm de cada borde exterior, fuera del material: la plomada lo confirma. Una caja de base 10 cm y centro de masa a 15 cm de altura se vuelca a 18,4°.',
    errores: [
      ['Medir las distancias hasta el borde de la masa.', 'Se mide hasta el punto de suspensión (el lazo), que es donde actúa la fuerza.'],
      ['Ignorar el peso de la regla cuando el apoyo no está en el centro.', 'La regla tiene su propio momento; en ese caso es el dato que se quiere medir.'],
      ['Apoyo con mucha fricción.', 'Un eje grueso o apretado deja la regla en «equilibrio» en un rango de posiciones; se usa un clavo delgado y se golpea suavemente.'],
      ['Creer que el centro de masa siempre está dentro del cuerpo.', 'En la L (o en un anillo) está fuera del material.']
    ],
    orientadoras: [
      '¿Qué condición deben cumplir las masas y sus distancias para que la regla quede en equilibrio?',
      '¿Cómo usarán varias masas conocidas para obtener la desconocida con una gráfica?',
      '¿Cómo podrían medir la masa de la regla sin balanza?',
      '¿Cómo encontrarían el centro de masa de una figura irregular?'
    ],
    abierta: 'En la plaza de mercado del barrio todavía se usan romanas. Construyan una balanza de brazo con una regla y una sola pesa, calíbrenla y determinen su rango y su incertidumbre.',
    preguntas: [
      '¿Por qué la gráfica de d<sub>k</sub> contra 1/m<sub>k</sub> es mejor que calcular m<sub>x</sub> con un solo par de datos?',
      '¿Cómo funciona una romana? ¿Por qué el gancho de la carga está tan cerca del apoyo?',
      '¿Por qué los camiones cargados con el peso muy alto se vuelcan con más facilidad en las curvas?',
      '¿Dónde está el centro de masa de una herradura? ¿Cómo lo comprobaría?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Una regla uniforme de 1 m y 100 g se apoya en la marca de 30 cm. Para mantenerla horizontal se cuelga una masa en la marca de 10 cm. La masa necesaria es',
      opciones: ['50 g.', '100 g.', '150 g.', '200 g.'],
      clave: 'B',
      just: 'El peso de la regla actúa en 50 cm, a 20 cm del apoyo: 100 g × 20 cm. La masa colgada está a 20 cm del otro lado: m × 20 cm. El equilibrio exige m = 100 g.'
    },
    rubrica: [['Modelo de equilibrio rotacional', 'No relaciona masas y distancias.', 'Usa m₁d₁ = m₂d₂ con un par de datos.', 'Obtiene la masa desconocida por gráfica y la masa de la regla con su momento.', 'Relaciona el centro de masa con la estabilidad y explica los límites del método.']],
    referencias: ['Arquímedes, <i>Sobre el equilibrio de los planos</i>, siglo III a. C.']
  });
})();
