/* Práctica F10-13 · Calorimetría: calor específico de un metal */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'calorimetria', cod: 'F10-13', titulo: 'Calorimetría: el calor específico de un metal', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes', nivel: 1,
    dba: [], est: ['C3', 'C5', 'C7', 'C10', 'C14', 'F3'], comp: ['uso', 'ind'], temas: ['Energía térmica', 'Transformación y conservación de energía'],
    pregunta: '¿Cuánta energía necesita un gramo de aluminio, de cobre o de acero para calentarse un grado, y cómo medirlo con vasos de icopor y agua hirviendo?',
    contexto: 'Las ollas de aluminio se calientan rápido y las de hierro mantienen el calor; el agua de las costas templa el clima. Detrás está el calor específico. Medirlo exige un dato local que casi todos los manuales olvidan: en Popayán o en Bogotá el agua hierve muy por debajo de 100 °C.',
    objetivos: [
      'Determinar la capacidad calorífica de un calorímetro de vasos de icopor mezclando agua caliente y fría.',
      'Medir el calor específico de un metal por el método de las mezclas, usando la temperatura de ebullición local.',
      'Corregir la temperatura de equilibrio por las pérdidas de calor extrapolando la curva de temperatura.'
    ],
    prediccion: 'Si se echan 100 g de aluminio a 94 °C en 150 g de agua a 20 °C, ¿la mezcla quedará cerca de 57 °C (el promedio), de 30 °C o de 22 °C? ¿Y con 100 g de cobre?',
    claves: [
      'El calor que cede el cuerpo caliente es el que gana el agua y el calorímetro: m₁c₁(T₁ − T<sub>e</sub>) = (m₂c₂ + C<sub>cal</sub>)(T<sub>e</sub> − T₂).',
      'El calor específico del agua es 4,18 J/(g·°C): el agua necesita mucha energía para calentarse.',
      'El agua hierve a la temperatura de ebullición de la presión local: unos 94 °C en Popayán y 91,5 °C en Bogotá.',
      'El calorímetro pierde calor lentamente: la temperatura de equilibrio se obtiene extrapolando la curva al instante de la mezcla.'
    ],
    materiales: [
      ['Dos vasos de icopor anidados con tapa de cartón perforada', '1 juego', 'Termo de boca ancha', 1500],
      ['Termómetro digital de punzón (0,1 °C)', '1', 'Sensor DS18B20 con Arduino', 15000],
      ['Muestras metálicas de unos 100 g: tornillos de acero, retales de aluminio, cobre o latón, amarrados con hilo', '3', 'Arandelas de acero en un manojo', 6000],
      ['Hervidor eléctrico con tapa o recipiente sobre estufa', '1', 'Olla en la cocina de la institución', 0],
      ['Balanza (0,1 g o 1 g)', '1', 'Balanza de cocina', 0],
      ['Pinza o hilo para sacar las muestras del agua hirviendo', '1', 'Cuchara metálica', 0],
      ['Guantes térmicos o paño grueso', '1', '—', 5000],
      ['Probeta o jeringa grande para medir el agua', '1', 'Vaso medidor de cocina', 3000]
    ],
    montaje: [
      'Pese los vasos vacíos. Ponga 150 g de agua a temperatura ambiente en el calorímetro y péselo de nuevo.',
      'Pese cada muestra seca y amárrela con un hilo largo.',
      'Caliente agua en el hervidor y sumerja las muestras colgadas, sin tocar el fondo, durante 5 minutos de ebullición.',
      'Mida la temperatura del agua hirviendo con el termómetro: es la temperatura inicial de la muestra (compárela con la del apéndice A).'
    ],
    seguridad: [
      { p: 'Agua hirviendo y vapor', c: 'term', ef: 'Quemaduras de primer y segundo grado', ctrl: 'Hervidor con tapa sobre bandeja; lo manipula una sola persona con guantes; nadie de pie alrededor; muestras colgadas de hilos largos.', nd: 2, ne: 2, nc: 25 },
      { p: 'Hervidor eléctrico conectado a la red', c: 'elec', ef: 'Contacto eléctrico', ctrl: 'Hervidor certificado conectado a toma con GFCI; cable lejos del agua; manos secas.', nd: 2, ne: 2, nc: 25 },
      { p: 'Muestra metálica caliente', c: 'term', ef: 'Quemaduras leves', ctrl: 'Se traslada por el hilo o con pinza, nunca con los dedos.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'guantes térmicos para quien manipula el hervidor; gafas de seguridad.',
    procedimiento: [
      'Capacidad del calorímetro: con 100 g de agua fría a temperatura ambiente en los vasos, agregue 100 g de agua caliente a temperatura conocida, tape, agite y registre la temperatura cada 10 s durante 3 minutos.',
      'Vacíe y seque el calorímetro. Ponga 150 g de agua a temperatura ambiente y regístrela durante 1 minuto.',
      'Saque una muestra del agua hirviendo, sacúdala un segundo para escurrirla, échela en el calorímetro, tape y agite suavemente.',
      'Registre la temperatura cada 5 s durante 3 minutos.',
      'Repita con las otras muestras.'
    ],
    tabla: { cols: ['Muestra', '<i>m</i>₁ (g)', '<i>T</i>₁ (°C)', '<i>m</i>₂ agua (g)', '<i>T</i>₂ (°C)', '<i>T</i><sub>e</sub> máxima (°C)', '<i>T</i><sub>e</sub> extrapolada (°C)'], filas: 5 },
    analisis: [
      'Con la mezcla de agua caliente y fría, calcule C<sub>cal</sub> = m<sub>c</sub>c(T<sub>c</sub> − T<sub>e</sub>)/(T<sub>e</sub> − T<sub>f</sub>) − m<sub>f</sub>c.',
      'Grafique la temperatura contra el tiempo para cada muestra. Ajuste una recta a la parte final (enfriamiento lento) y extrapólela al instante de la mezcla: es T<sub>e</sub> corregida.',
      'Calcule el calor específico: c₁ = (m₂c₂ + C<sub>cal</sub>)(T<sub>e</sub> − T₂)/[m₁(T₁ − T<sub>e</sub>)].',
      'Propague la incertidumbre: ¿qué medida domina? (pista: T<sub>e</sub> − T₂ es una diferencia pequeña).',
      'Compare con la tabla: aluminio 0,897; acero 0,47; latón 0,38; cobre 0,385 J/(g·°C).'
    ],
    esperado: 'Con T₁ = 94,4 °C (Popayán), 100 g de metal en 150 g de agua a 20 °C y C<sub>cal</sub> = 10 J/°C, la mezcla llega a 29,2 °C con aluminio, 25,1 °C con acero y 24,2 °C con cobre. Si se usara 100 °C en lugar de la ebullición local, el calor específico del aluminio saldría 8 % bajo. Un calorímetro de icopor con la mezcla 9 °C por encima del ambiente se enfría menos de una centésima de grado por segundo; extrapolar la curva corrige ese pequeño sesgo.',
    errores: [
      ['Suponer que el agua hierve a 100 °C.', 'En las ciudades altas hierve entre 91 °C y 95 °C; el error en T₁ se transmite completo al resultado.'],
      ['Arrastrar agua caliente con la muestra.', 'El agua adherida aporta calor extra; se sacude la muestra un segundo antes de echarla.'],
      ['Leer la temperatura máxima sin agitar.', 'El agua no está a temperatura uniforme; se agita suavemente y se registra la curva completa.'],
      ['Usar poca masa de metal.', 'La diferencia T<sub>e</sub> − T₂ queda en pocas décimas y la incertidumbre se dispara; se usan unos 100 g.']
    ],
    orientadoras: [
      '¿Qué principio de conservación permite calcular el calor específico a partir de temperaturas y masas?',
      '¿A qué temperatura está la muestra cuando sale del agua hirviendo en su municipio? ¿Cómo lo comprobarán?',
      '¿Cómo tendrán en cuenta el calor que absorbe el recipiente y el que se pierde al ambiente?',
      '¿Qué masas de metal y de agua conviene usar para que la diferencia de temperaturas sea medible?'
    ],
    abierta: 'Una cocinera afirma que las ollas de hierro «guardan» más el calor que las de aluminio. Diseñen una investigación con calorimetría para poner a prueba la afirmación y expliquen qué propiedad de los materiales es la responsable.',
    preguntas: [
      '¿Por qué el aluminio calienta más el agua que el cobre si ambos tienen la misma masa y la misma temperatura inicial?',
      '¿Cuánto cambiaría su resultado si hubieran supuesto que el agua hierve a 100 °C?',
      '¿Hacia dónde fluye la energía en cada etapa y qué la impulsa?',
      '¿Por qué los climas costeros tienen menos variación de temperatura que los del interior?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Dos bloques de igual masa, uno de aluminio (c = 0,90 J/g·°C) y otro de cobre (c = 0,39 J/g·°C), se calientan hasta la misma temperatura y se sumergen cada uno en recipientes iguales con la misma cantidad de agua fría. Al llegar al equilibrio',
      opciones: ['ambos recipientes quedan a la misma temperatura, porque los bloques tenían la misma temperatura.', 'el agua con aluminio queda más caliente, porque el aluminio cede más energía al enfriarse cada grado.', 'el agua con cobre queda más caliente, porque el cobre conduce mejor el calor.', 'el agua con cobre queda más caliente, porque el cobre es más denso.'],
      clave: 'B',
      just: 'La energía que cede un bloque al enfriarse es m c ΔT. Con igual masa e igual temperatura inicial, el aluminio, de mayor calor específico, cede más del doble de energía y calienta más el agua. La conductividad solo cambia la rapidez con que se llega al equilibrio.'
    },
    rubrica: [['Balance de energía', 'No plantea la conservación de la energía.', 'Plantea el balance sin calorímetro ni pérdidas.', 'Incluye C<sub>cal</sub> y la ebullición local; da c con incertidumbre.', 'Corrige las pérdidas por extrapolación y analiza qué medida domina la incertidumbre.']],
    referencias: ['D. R. Lide (ed.), <i>CRC Handbook of Chemistry and Physics</i>: calores específicos.', 'IAPWS-95 (CoolProp) para la temperatura de ebullición del agua a la presión local.']
  });
})();
