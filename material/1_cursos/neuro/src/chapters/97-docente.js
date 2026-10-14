/* Apéndice D — Guía docente: evaluación diagnóstica de creencias (antes y después del curso) */
(function () {
  'use strict';
  const RC = window.RC;
  RC.defineSim('diagnostico', function (sim) {
    RC.quiz(sim, [
      { q: 'Usamos solo el 10 % del cerebro.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: todas las regiones tienen función y casi todas están activas a lo largo del día (capítulo 14).' },
      { q: 'Las personas aprenden mejor si se les enseña en su estilo preferido (visual, auditivo o kinestésico).', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: los experimentos que lo pusieron a prueba no encontraron esa interacción (capítulo 10).' },
      { q: 'Los movimientos de los ojos revelan si alguien miente o recuerda.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: los experimentos no encontraron relación (capítulo 10).' },
      { q: 'El cerebro adulto puede cambiar sus conexiones con la práctica.', opts: ['Verdadero', 'Falso'], ok: 0, fb: 'Verdadero: es la plasticidad sináptica (capítulos 4 y 6).' },
      { q: 'Repasar distribuido en varios días se recuerda mejor que repasar todo de una vez.', opts: ['Verdadero', 'Falso'], ok: 0, fb: 'Verdadero: el efecto de espaciado es uno de los más sólidos (capítulo 5).' },
      { q: 'Un hábito se forma en 21 días.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: en el estudio de Lally la mediana fue de 66 días, con gran variación (capítulo 15).' },
      { q: 'Un déficit de 500 kcal diarias hace perder medio kilo por semana indefinidamente.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: el gasto baja con el peso (capítulo 23).' },
      { q: 'Hacer abdominales reduce la grasa del abdomen.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: no existe la reducción localizada (capítulo 24).' },
      { q: 'Escuchar a Mozart aumenta la inteligencia.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: el efecto original era pequeño, breve y no se replicó (capítulo 14).' },
      { q: 'Una serie de pacientes que mejoran después de un tratamiento prueba que el tratamiento funciona.', opts: ['Verdadero', 'Falso'], ok: 1, fb: 'Falso: sin grupo de comparación, la regresión a la media y la historia natural explican mejoras grandes (capítulos 1 y 29).' }
    ], { id: 'diagnostico', shuffle: false });
  });
})();
