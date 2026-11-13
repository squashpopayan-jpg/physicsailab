/* ===================================================================
   ui/12-guia.js — Guía de cada etapa: qué hay que hacer, paso a paso
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB;

  OB.GUIA = {
    plano: {
      meta: 'La etapa queda lista cuando todas las filas de la revisión están en verde.',
      pasos: [
        'Observe el plano. Cada símbolo es una salida eléctrica (la leyenda está al final del panel). Toque un símbolo para ver su circuito, su altura y, en las tomas, si por su ubicación exige protección GFCI.',
        'Lea la revisión: ninguna toma puede quedar a más de 1,8 m de un punto de la pared (210.52), el mesón de la cocina pide una toma cada 600 mm, el baño una toma a 0,9 m del lavamanos, el patio de ropas una toma para la lavadora y el exterior una toma al frente y otra atrás.',
        'Los anillos de las tomas indican la protección: verde, exige GFCI y la tiene; rojo, la exige y no la tiene. Para corregirla seleccione la toma y cambie su tipo (Común, GFCI o GFCI intemperie).',
        'Para agregar una toma elija «Agregar toma», escoja altura y tipo y toque el muro por el lado del ambiente. Con «Seleccionar y mover» puede arrastrarla a otra posición del muro; con «Borrar toma» o el botón del panel la retira.',
        'Practique con los retos: «sala sin tomas» y «sin GFCI» dañan el plano para que usted lo repare; «Restaurar plano» vuelve al original.'
      ]
    },
    acometida: {
      meta: 'La etapa queda lista cuando todos los puntos de la revisión están en verde.',
      pasos: [
        'Elija el sistema de alimentación: la casa tiene una estufa de 240 V y casi 17 kVA instalados, así que corresponde el monofásico trifilar 120/240 V.',
        'Calcule el área construida (por caras exteriores, vista en el cuadro de cargas) y la demanda total en VA con el método estándar: alumbrado y tomas a 33 VA/m², dos circuitos de pequeños artefactos y uno de lavandería de 1 500 VA, primeros 3 000 VA al 100 % y el resto al 35 %, más estufa (Tabla 220.55) y ducha. Si se atasca, el botón de ayuda muestra el cálculo y descuenta 2 puntos.',
        'Escoja el calibre de la acometida: la ampacidad (columna de 60 °C) debe superar la corriente de demanda (VA ÷ 240). Con la capacidad instalable indique la documentación de la obra y escoja el interruptor principal: mayor que la demanda y no mayor que lo que soporta el cable.',
        'Escoja acometida aérea (con altura de amarre tal que el punto más bajo del cable quede a 3,0 m o más) o subterránea. Mueva la altura con el deslizador y vea el dibujo.',
        'Ubique el medidor en la fachada, accesible desde la vía, y ajuste su altura (rango habitual 1,40 a 1,80 m).',
        'Escoja el tubo PVC del alimentador: con tres conductores y la tierra no debe pasar del 40 % de ocupación. Revise las caídas: la acometida no puede pasar de 3 % y, sumada a la del alimentador, debe quedar en 2 % o menos para dejar 3 % a los ramales (total 5 %). Si el lote queda lejos de la red, suba el calibre.'
      ]
    },
    tierra: {
      meta: 'La etapa queda lista cuando la resistencia medida con el telurómetro es menor de 25 Ω y todo lo demás está en verde.',
      pasos: [
        'Mida la resistividad del suelo con Wenner: escoja una separación y pulse «Medir». Haga al menos tres separaciones distintas y mire la curva. Escriba la resistividad de diseño tomando la medida cercana a la longitud del electrodo. Use la época seca, que es la más desfavorable.',
        'Escoja el electrodo (cobre de 12,7 mm o acero-cobre de 14 mm o más; los otros dos no cumplen) y su longitud (mínimo 2,4 m).',
        'Coloque electrodos: con «Agregar electrodo» toque el antejardín, arrástrelos para cambiar su separación (mínimo 1,8 m) y observe cómo baja la resistencia. El círculo verde es su zona de influencia: si se solapan, los electrodos se estorban. Siga hasta quedar por debajo de 25 Ω.',
        'Escoja el conductor al electrodo (Tabla 250.66), la forma de unirlo (soldadura exotérmica o conector certificado) y marque la caja de inspección.',
        'Construido el sistema, mida con el telurómetro: deje la sonda de tensión al 62 % de la distancia a la sonda de corriente, donde la curva se aplana, y registre la lectura.'
      ]
    },
    circuitos: {
      meta: 'La etapa queda lista cuando los cuatro rollos están bien decididos y los nueve circuitos están en verde.',
      pasos: [
        'Recibo de materiales: en cada rollo revise el certificado RETIE, el tipo de aislamiento y mida el diámetro del cobre con el micrómetro. Acepte solo el que cumple y rechace los otros tres.',
        'En la tabla, para cada circuito escoja el calibre de la fase, el interruptor de protección y el calibre de la tierra. Las columnas Ib, Cond., Iz y Caída se calculan solas.',
        'Regla de fondo: Ib ≤ In ≤ Iz. El interruptor debe soportar la carga y disparar antes de que el cable se dañe. Toque el botón con el nombre del circuito para ver la regla dibujada.',
        'Reglas especiales: pequeños artefactos y lavandería, 20 A con 12 AWG; ducha, 30 A con 10 AWG; la tierra sale de la Tabla 250.122 según el interruptor; la caída del ramal debe ser de 3 % o menos.'
      ]
    },
    canal: {
      meta: 'La etapa queda lista cuando todos los circuitos y todas las cajas están en verde y no hay cruces críticos.',
      pasos: [
        'Escoja el material del tubo (PVC o EMT).',
        'Para cada circuito escoja si va en la losa o en el contrapiso y el diámetro del tubo. La barra muestra la ocupación del tramo más lleno frente a su límite (53 % con un conductor, 31 % con dos, 40 % con más). En la losa de 12 cm el tubo no puede pasar de 40 mm de diámetro exterior.',
        'Mire el plano: línea continua, tubo en la losa; punteada, en el contrapiso. Un anillo rojo es un cruce con viga en zona de confinamiento (no se permite); naranja, un cruce por coordinar. Cambie el nivel del circuito para evitarlo.',
        'Escoja la caja para luminarias, para interruptores y tomas y para ducha y estufa. Si alguna queda corta (anillo rojo en el punto), use el botón «Subir a…» de la lista o cambie la caja del grupo.'
      ]
    },
    tablero: {
      meta: 'La etapa queda lista cuando la revisión está en verde: sitio, principal, nueve circuitos colocados, ducha con diferencial, barras y directorio.',
      pasos: [
        'Escoja el sitio del tablero tocando uno de los círculos del plano (H hall, S sala, B baño, P patio). Un buen sitio tiene espacio libre de 0,9 m al frente, palanca a menos de 2 m y no es húmedo ni el baño.',
        'Escoja el interruptor principal: mayor que la demanda y menor que el límite del cable de la acometida.',
        'Toque un circuito de la lista y luego un espacio libre del tablero. Cada fila tiene una fase (A negra, B roja); el circuito de 2 polos ocupa dos filas seguidas y toma las dos fases. Reparta para que las fases queden parejas (desbalance de 15 % o menos) y deje dos espacios de reserva.',
        'La ducha necesita diferencial de 30 mA: se asigna sola, pero puede cambiar el tipo del interruptor tocando el circuito ya colocado.',
        'Cierre las decisiones de las barras: instale el puente neutro–tierra (una sola vez, en este tablero), conecte la barra de tierra al electrodo y marque el directorio de circuitos.'
      ]
    },
    cableado: {
      meta: 'La etapa queda lista cuando los cinco montajes están correctos (conexiones, colores y funcionamiento) y el cuestionario tiene todo o casi todo bien.',
      pasos: [
        'Escoja un montaje en las pestañas y lea su descripción. Cada pestaña tiene un punto que se pone verde cuando el montaje está correcto.',
        'Escoja el color del conductor en la paleta y una dos bornes: arrastre de uno a otro o toque el primero y luego el segundo. Cada conductor lleva su color: fase negro o rojo, neutro blanco, tierra verde o desnudo; retornos y viajeros, cualquiera menos blanco, gris o verde.',
        'Los bornes de latón son de fase, los plateados de neutro y los verdes de tierra. Un interruptor corta siempre la fase, nunca el neutro.',
        'Toque un interruptor para accionarlo y vea si la lámpara, la ducha o la estufa funcionan. Toque un conductor para quitarlo, o use «Quitar todos». En el montaje del GFCI, «Simular una fuga» le dice si la toma común queda protegida.',
        'Lea la lista de problemas (en modo inspector pulse «Verificar el montaje») y corrija hasta que diga «Montaje correcto». Después responda las seis preguntas del código de colores.'
      ]
    },
    pruebas: {
      meta: 'La etapa queda lista cuando se han reparado los cuatro defectos, medido los nueve circuitos, probado las tomas y los GFCI, superado la plena carga y ensayado un cortocircuito y una fuga.',
      pasos: [
        'Pruebas sin tensión. Con «Megger por tramos» mida cada circuito (botón «Medir 500 V»; el aislamiento debe superar 1 MΩ) y, si uno falla, toque puntos del plano para ver desde el tablero hasta dónde baja la lectura. Con «Polarímetro y tierra» toque tomas del plano (al menos una por circuito) y con «Botón TEST del GFCI» toque cada GFCI.',
        'Repare los defectos: con «Reparar» toque el punto sospechoso y escoja la causa. Hay cuatro defectos sembrados en la obra. Después de reparar vuelva a medir; una lectura mala anterior no se borra sola.',
        'Energice con «Energizar». Con «Encender luces, ducha y estufa» toque luminarias, interruptores, ducha o estufa del plano; con «Enchufar aparato» elija uno y toque una toma (dos por toma). La velocidad ×60 permite ver calentarse un cable.',
        'Observe el tablero en vivo: corriente, carga, temperatura del conductor y estado de cada interruptor. Si dispara, pulse «Reponer». Un cable que pasa de 90 °C se daña y a 150 °C se quema.',
        'Provoque fallas: cortocircuito, fuga a la carcasa con tierra y fuga sin tierra (piel seca o mojada), tocando un punto del plano, o corte el neutro de la acometida. Ensaye al menos el cortocircuito y la fuga con tierra, y ejecute el ensayo a plena carga.'
      ]
    },
    dictamen: {
      meta: 'La obra se declara conforme cuando las ocho etapas están listas, sin incumplimientos ni pendientes.',
      pasos: [
        'Revise el puntaje y la tabla por etapa. Los botones con el nombre de la etapa lo llevan a ella.',
        'En «Por corregir» aparecen los incumplimientos pendientes con su norma.',
        'Cuando todo está en verde se habilita la declaración del constructor; copie el informe de texto para entregarlo.'
      ]
    }
  };

  OB.manejo = [
    ['Etapas', 'La barra superior tiene las ocho etapas y el dictamen. Puede ir a cualquiera en cualquier momento; el punto de color indica su estado (verde lista, rojo con incumplimientos).'],
    ['Plano', 'Rueda del ratón o botones + y − para acercar; arrastre el fondo para desplazar; toque un símbolo para consultarlo. Cada figura del taller se maneja con los mismos gestos, también en el teléfono.'],
    ['Revisión', 'En modo guiado, la lista «Revisión normativa» se actualiza con cada decisión y cita la norma. En modo inspector debe pulsar «Solicitar revisión». Verde cumple, rojo no cumple, naranja por revisar, punteado pendiente.'],
    ['Puntaje', 'Suma el avance de las ocho etapas según su peso (100 puntos). Cada pista usada resta 2 puntos.'],
    ['Guardado', 'Su avance se guarda en este navegador. «Reiniciar la obra» en el inicio lo borra.']
  ];
})();
