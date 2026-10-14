/* Capítulo 30 — Psicoterapias, meditación e hipnosis: cambiar el cerebro hablando y practicando */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, T = L.ter;

  /* ======================================================================
     30.1 La exposición crea inhibición dependiente del contexto (Rescorla-Wagner con contextos)
     ====================================================================== */
  RC.defineSim('extincion', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 1.15, label: 'Miedo esperado en cada ensayo de adquisición y de exposición' });
    const cb = sim.canvas({ aspect: 1.15, label: 'Miedo al final de la exposición y al volver a encontrarse con el estímulo' });
    sim.group('Exposición');
    sim.slider('n', { label: 'Ensayos de exposición', min: 4, max: 60, step: 1, value: 24, fmt: (v) => RC.nf(v) });
    sim.slider('k', { label: 'Contextos distintos durante la exposición', min: 1, max: 6, step: 1, value: 1, fmt: (v) => RC.nf(v) });
    sim.slider('d', { label: 'Días hasta el reencuentro', min: 0, max: 60, step: 1, value: 14, fmt: (v) => RC.nf(v) });
    sim.group('Aprendizaje');
    sim.slider('ag', { label: 'Tasa de la inhibición general', min: 0.01, max: 0.2, step: 0.01, value: 0.04, fmt: (v) => RC.nf(v, 2) });
    sim.out('fin', 'Miedo al final de la exposición');
    sim.out('mismo', 'Reencuentro en el mismo lugar');
    sim.out('otro', 'Reencuentro en otro lugar', { hl: true });
    sim.onDraw(() => {
      const r = T.extincion({ nExt: sim.p.n, contextos: sim.p.k, dias: sim.p.d, ag: sim.p.ag });
      const r1 = T.extincion({ nExt: sim.p.n, contextos: 1, dias: sim.p.d, ag: sim.p.ag });
      RC.draw.clear(cc);
      const N = r.curva.length;
      const pc = new RC.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: N, ymin: 0, ymax: 1.05, xlabel: 'ensayo', ylabel: 'miedo esperado', title: 'durante el tratamiento' });
      pc.frame();
      pc.band(12, N, { color: '--c3', alpha: 0.08 });
      pc.label(13, 1.0, 'exposición', { color: '--c3' });
      pc.xy(r1.curva.map((_, i) => i), r1.curva, { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pc.xy(r.curva.map((_, i) => i), r.curva, { color: '--c1', width: 2.4 });
      pc.legend([{ label: `${sim.p.k} contexto${sim.p.k > 1 ? 's' : ''}`, color: '--c1' }, { label: 'referencia: 1 contexto', color: '--ink-3', dash: [5, 4] }], 'tr');
      RC.draw.clear(cb);
      const lab = ['al final', 'mismo lugar', 'otro lugar'];
      const pb = new RC.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0.3, xmax: 3.7, ymin: 0, ymax: 1.05, xticks: [1, 2, 3], xfmt: (v) => lab[v - 1] || '', ylabel: 'miedo', title: `al final y a los ${sim.p.d} días (gris: 1 contexto)` });
      pb.frame();
      pb.bars([0.82, 1.82, 2.82], [r1.finExt, r1.mismo, r1.nuevo], { color: '--ink-3', w: 0.32, alpha: 0.6 });
      pb.bars([1.18, 2.18, 3.18], [r.finExt, r.mismo, r.nuevo], { color: '--c1', w: 0.32, labels: true, fmt: (v) => RC.nf(v, 2) });
      sim.set('fin', RC.nf(r.finExt, 2));
      sim.set('mismo', RC.nf(r.mismo, 2));
      sim.set('otro', RC.nf(r.nuevo, 2) + ' (1 contexto: ' + RC.nf(r1.nuevo, 2) + ')');
    });
  });

  RC.defineSim('quiz-psicoterapias', function (sim) {
    RC.quiz(sim, [
      { q: 'Según el enfoque de aprendizaje inhibitorio, la exposición…', opts: ['Borra la memoria del miedo', 'Crea un nuevo aprendizaje que compite con el miedo y depende del contexto', 'Solo funciona con hipnosis'], ok: 1, fb: 'Por eso el miedo puede volver en otro lugar o con el tiempo (renovación y recuperación espontánea).' },
      { q: 'Hacer la exposición en varios contextos…', opts: ['Reduce el miedo más rápido durante la sesión', 'Puede hacer más lenta la mejora en la sesión, pero generaliza mejor', 'No cambia nada'], ok: 1, fb: 'Como la práctica mezclada del capítulo 19: más difícil durante la práctica, más duradera después.' },
      { q: 'Al corregir por riesgo de sesgo y sesgo de publicación, el efecto de la psicoterapia para la depresión…', opts: ['Desaparece', 'Baja de g ≈ 0,7 a un valor entre 0,3 y 0,5 según los supuestos', 'Sube'], ok: 1, fb: 'Cuijpers y otros (2019) y la discusión posterior.' },
      { q: 'En el ensayo COBRA, la activación conductual frente a la terapia cognitivo-conductual…', opts: ['Fue claramente inferior', 'No fue inferior y resultó más barata de aplicar', 'No se comparó'], ok: 1, fb: 'Richards y otros (2016).' },
      { q: 'Un programa de 8 semanas de reducción del estrés basada en atención plena, frente a controles…', opts: ['Cambió mucho la estructura del cerebro', 'No mostró cambios estructurales en 218 personas, aunque puede mejorar ansiedad y estrés', 'Redujo el tamaño del cerebro'], ok: 1, fb: 'Kral y otros (2022); Goyal y otros (2014).' }
    ], { id: 'psicoterapias', shuffle: true });
  });
})();
