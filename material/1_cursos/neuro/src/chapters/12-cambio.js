/* Capítulo 12 — Cambio rápido frente a terapias probadas */
(function () {
  'use strict';
  const RC = window.RC;

  /* ======================================================================
     12.1 Exposición con aprendizaje inhibitorio (modelo didáctico)
     El recuerdo de miedo F se mantiene; la exposición sin escape crea un aprendizaje
     de seguridad S. Miedo expresado = F·(1 − S·g), con g = 1 en el contexto practicado
     y g = gNuevo en uno nuevo (mayor si se practicó en contextos variados).
     Escapar en el pico reduce el aprendizaje a una fracción pequeña.
     Sin práctica, S decae con el tiempo (retorno espontáneo del miedo).
     ====================================================================== */
  RC.defineSim('exposicion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Miedo durante las sesiones de exposición y meses después, en el consultorio y en un contexto nuevo' });
    sim.group('Tratamiento');
    sim.slider('ns', { label: 'Sesiones de exposición', min: 1, max: 12, step: 1, value: 6, fmt: (v) => RC.nf(v) });
    sim.check('esc', { label: 'Conducta de seguridad: escapar cuando el miedo es alto', value: false });
    sim.check('var', { label: 'Practicar en contextos variados', value: false });
    sim.slider('ref', { label: 'Sesiones de refuerzo después', min: 0, max: 4, step: 1, value: 0, fmt: (v) => RC.nf(v) });
    sim.out('fin', 'Miedo al terminar (consultorio)', { hl: true });
    sim.out('nuevo', 'Miedo en un lugar nuevo');
    sim.out('tres', 'Miedo a los tres meses');
    sim.onDraw(() => {
      const F = 0.9, a = sim.p.esc ? 0.05 : 0.35, gN = sim.p.var ? 0.85 : 0.45;
      let S = 0;
      const xs = [], yc = [], yn = [];
      const punto = (x) => { xs.push(x); yc.push(F * (1 - S)); yn.push(F * (1 - S * gN)); };
      punto(0);
      for (let s = 1; s <= sim.p.ns; s++) { S += a * (1 - S); punto(s); }
      const fin = F * (1 - S), nuevo = F * (1 - S * gN);
      /* 12 semanas de seguimiento; las sesiones de refuerzo se reparten en ese periodo */
      const ref = sim.p.ref, cada = ref ? Math.floor(12 / (ref + 1)) : 99;
      for (let w = 1; w <= 12; w++) {
        S *= 0.955;
        if (ref && w % cada === 0 && w / cada <= ref) S += a * (1 - S);
        punto(sim.p.ns + w);
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: sim.p.ns + 12, ymin: 0, ymax: 1, xlabel: 'sesiones de tratamiento y luego semanas de seguimiento', ylabel: 'miedo (0 a 1)' });
      pl.frame();
      pl.band(sim.p.ns, sim.p.ns + 12, { color: '--c6', alpha: 0.07 });
      pl.label(sim.p.ns + 0.4, 0.95, 'seguimiento', { color: '--ink-3' });
      pl.xy(xs, yn, { color: '--c2', width: 2.2, dash: [6, 4] });
      pl.xy(xs, yc, { color: '--c1', width: 2.6 });
      pl.legend([{ label: 'en el consultorio', color: '--c1' }, { label: 'en un lugar nuevo', color: '--c2', dash: [6, 4] }], 'tr');
      sim.set('fin', RC.pct(fin, 0));
      sim.set('nuevo', RC.pct(nuevo, 0));
      sim.set('tres', `${RC.pct(yc[yc.length - 1], 0)} (lugar nuevo ${RC.pct(yn[yn.length - 1], 0)})`);
    });
  });

  RC.defineSim('quiz-cambio', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué tratamiento tiene la mejor evidencia para las fobias específicas?', opts: ['La cura rápida de fobias de la PNL', 'La exposición gradual o intensiva sin escape', 'La relajación sola'], ok: 1, fb: 'Wolitzky-Taylor y otros (2008): la exposición supera al placebo y a otras psicoterapias.' },
      { q: 'Según el aprendizaje inhibitorio, la exposición…', opts: ['Borra el recuerdo de miedo', 'Crea un recuerdo nuevo de seguridad que compite con el viejo', 'Funciona por agotamiento físico'], ok: 1, fb: 'Por eso el miedo puede volver con el tiempo o en otro contexto.' },
      { q: '¿Qué mostró el ensayo de 2026 que comparó RTM con exposición prolongada?', opts: ['RTM fue muy superior', 'Ambos mejoraron sin diferencias en la medida principal', 'RTM no tuvo efecto'], ok: 1, fb: 'Pérdida del diagnóstico 58 % frente a 52 %, diferencia no significativa.' },
      { q: '¿Qué aporta, según el metaanálisis de Lee y Cuijpers, el movimiento ocular en EMDR?', opts: ['Nada', 'Un efecto adicional moderado en clínica, sobre todo en la viveza del recuerdo', 'Todo el efecto del tratamiento'], ok: 1, fb: 'd = 0,41 en ensayos clínicos y 0,74 en laboratorio.' },
      { q: '¿Cuál de estas técnicas no tiene ensayos controlados que la respalden?', opts: ['Exposición', 'EMDR', 'Swish'], ok: 2, fb: 'Swish, submodalidades y línea del tiempo están sin probar.' }
    ], { id: 'cambio', shuffle: true });
  });
})();
