/* Apéndice C — Guía para el docente: prueba de entrada y salida */
(function () {
  'use strict';
  const CC = window.CC;
  CC.defineSim('evaluacion', function (sim) {
    CC.quiz(sim, [
      { q: 'Un crédito anuncia 2 % mensual. ¿Cuál es aproximadamente su tasa efectiva anual?', opts: ['24 %', '26,8 %', '2 %', '20 %'], ok: 1, fb: '\\(1{,}02^{12}-1\\approx26{,}8\\,\\%\\). La nominal (24 %) subestima el costo (capítulo 7).' },
      { q: 'Su cuenta paga 3 % anual y la inflación es 5 %. Su poder de compra:', opts: ['sube 3 %', 'sube 8 %', 'baja cerca de 2 %', 'no cambia'], ok: 2, fb: 'Tasa real: \\(1{,}03/1{,}05-1\\approx-1{,}9\\,\\%\\) (capítulos 7 y 8).' },
      { q: 'Con 6 % anual, ¿en cuánto tiempo se duplica aproximadamente una inversión?', opts: ['6 años', '12 años', '20 años', '30 años'], ok: 1, fb: 'Regla del 72: \\(72/6=12\\) años (capítulo 6).' },
      { q: 'En un crédito de cuota fija, las primeras cuotas son principalmente:', opts: ['abono a capital', 'intereses', 'seguros', 'mitad y mitad'], ok: 1, fb: 'El interés se calcula sobre un saldo que al principio es máximo (capítulo 10).' },
      { q: '¿Cuál es el orden más recomendable?', opts: ['Invertir en bolsa, luego pagar la tarjeta', 'Colchón mínimo, pagar deudas caras, completar el colchón, luego invertir', 'Comprar vivienda primero', 'Ahorrar solo lo que sobre'], ok: 1, fb: 'Es la secuencia de prioridades del capítulo 22.' },
      { q: 'Diversificar un portafolio sirve principalmente para:', opts: ['garantizar ganancias', 'reducir el riesgo que no paga premio', 'pagar menos impuestos', 'ganarle siempre al mercado'], ok: 1, fb: 'Elimina el riesgo idiosincrático, que el mercado no compensa (capítulo 17).' },
      { q: 'Un fondo cobra 2 % anual y otro 0,2 %, con la misma rentabilidad bruta de 7 %. En 30 años, el caro termina con:', opts: ['casi lo mismo', 'cerca de 40 % menos', 'el doble', 'un 2 % menos'], ok: 1, fb: 'Las comisiones se componen: \\((1{,}07\\times0{,}98)^{30}\\) frente a \\((1{,}07\\times0{,}998)^{30}\\) (capítulo 19).' },
      { q: 'Le ofrecen 10 % mensual garantizado si invierte y trae a dos amigos. Lo más probable es que sea:', opts: ['un CDT especial', 'una pirámide o un esquema Ponzi', 'un fondo indexado', 'un bono del Gobierno'], ok: 1, fb: 'Rentabilidad alta garantizada más reclutamiento son las dos señales más graves (capítulo 25).' },
      { q: 'Según la investigación, imaginar con detalle que ya se es rico:', opts: ['atrae la riqueza', 'tiende a reducir el esfuerzo si no se acompaña de un plan', 'no tiene ningún efecto', 'siempre aumenta el ahorro'], ok: 1, fb: 'Las fantasías positivas reducen el esfuerzo; el contraste mental con planes «si-entonces» ayuda (capítulo 2).' },
      { q: 'La forma más confiable de ahorrar con constancia es:', opts: ['ahorrar lo que sobre a fin de mes', 'una transferencia automática el día de pago', 'esperar a ganar más', 'guardar efectivo en casa'], ok: 1, fb: 'El valor por defecto y la automatización vencen a la fuerza de voluntad (capítulo 5).' }
    ], { shuffle: true, final: (ok, n) => `Resultado: ${ok} de ${n}.` });
  });
})();
