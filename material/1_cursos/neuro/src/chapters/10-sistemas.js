/* Capítulo 10 — Sistemas representacionales y movimientos oculares */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, E = L.ev;

  /* ======================================================================
     10.1 Detectores de mentiras por los ojos: azar y selección
     ====================================================================== */
  RC.defineSim('ojos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Porcentaje de aciertos de treinta personas que juzgan mentiras mirando los ojos' });
    sim.group('El método');
    sim.slider('p', { label: 'Acierto real del método', min: 0.4, max: 0.75, step: 0.01, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.slider('n', { label: 'Declaraciones juzgadas por persona', min: 10, max: 400, step: 10, value: 20, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otro grupo de 30', () => { seed++; }, { id: 'otro' });
    sim.out('best', 'El «mejor experto»', { hl: true });
    sim.out('sig', 'Personas con p < 0,05 frente al azar');
    sim.out('media', 'Acierto medio del grupo');
    sim.onDraw(() => {
      const rng = L.rng(seed * 23), K = 30, n = sim.p.n;
      const res = [];
      for (let k = 0; k < K; k++) { let h = 0; for (let i = 0; i < n; i++) if (rng() < sim.p.p) h++; res.push({ h, acc: h / n, p: E.binomTest(h, n, 0.5) }); }
      const ord = res.slice().sort((a, b) => a.acc - b.acc);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: K + 1, ymin: 0.2, ymax: 0.95, xticks: [], xlabel: 'personas (ordenadas por acierto)', ylabel: 'aciertos', yfmt: RC.pctAxis });
      pl.frame();
      pl.hline(0.5, { color: '--ink-3', label: 'azar', labelRight: true });
      pl.hline(sim.p.p, { color: '--gain', label: 'acierto real', dash: [] });
      pl.bars(ord.map((_, i) => i + 1), ord.map((o) => o.acc), { colors: ord.map((o) => (o.p < 0.05 && o.acc > 0.5 ? '--c2' : '--c1')), base: 0.2, w: 0.75 });
      const b = ord[K - 1];
      pl.label(K, b.acc + 0.03, '¿experto?', { align: 'right', color: '--c2', weight: 700 });
      sim.set('best', `${RC.pct(b.acc, 0)} (${b.h} de ${n}; p = ${RC.nf(b.p, 3)})`);
      sim.set('sig', `${res.filter((o) => o.p < 0.05 && o.acc > 0.5).length} de ${K}`);
      sim.set('media', RC.pct(L.stat.mean(res.map((o) => o.acc)), 1));
    });
  });

  /* ======================================================================
     10.2 Hipótesis de los estilos de aprendizaje: interacción cruzada
     ====================================================================== */
  RC.defineSim('malla', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Puntaje de estudiantes visuales y auditivos con enseñanza visual o auditiva' });
    sim.group('Efectos');
    sim.slider('mesh', { label: 'Efecto de ajuste al estilo (puntos)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => RC.nf(v, 1) });
    sim.slider('mat', { label: 'Ventaja del material visual para todos', min: -10, max: 10, step: 0.5, value: 4, fmt: (v) => RC.nf(v, 1) });
    sim.slider('grp', { label: 'Diferencia entre grupos de estudiantes', min: -10, max: 10, step: 0.5, value: 2, fmt: (v) => RC.nf(v, 1) });
    sim.seg('pre', { label: 'Situación', options: [['real', 'Lo que se encuentra'], ['teoria', 'Lo que predice la teoría']], value: 'real', onInput: (v) => { sim.ctl.mesh.set(v === 'teoria' ? 10 : 0, true); } });
    sim.out('cruce', '¿Se cruzan las líneas?', { hl: true });
    sim.out('int', 'Interacción (diferencia de diferencias)');
    sim.onDraw(() => {
      const base = 70, m = sim.p.mesh, a = sim.p.mat, g = sim.p.grp;
      /* puntajes medios: [estudiante][enseñanza], 0 = visual, 1 = auditivo */
      const S = [[base + g / 2 + a / 2 + m / 2, base + g / 2 - a / 2 - m / 2], [base - g / 2 + a / 2 - m / 2, base - g / 2 - a / 2 + m / 2]];
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.4, xmax: 1.4, ymin: 50, ymax: 90, xticks: [0, 1], xfmt: (v) => (v === 0 ? 'enseñanza visual' : 'enseñanza auditiva'), ylabel: 'puntaje en la prueba' });
      pl.frame();
      pl.path([[0, S[0][0]], [1, S[0][1]]], { color: '--c1', width: 3 });
      pl.path([[0, S[1][0]], [1, S[1][1]]], { color: '--c2', width: 3 });
      [0, 1].forEach((j) => { pl.dot(j, S[0][j], { color: '--c1', r: 6 }); pl.dot(j, S[1][j], { color: '--c2', r: 6 }); });
      pl.legend([{ label: 'estudiantes «visuales»', color: '--c1' }, { label: 'estudiantes «auditivos»', color: '--c2' }], 'tr');
      const d0 = S[0][0] - S[1][0], d1 = S[0][1] - S[1][1];
      sim.set('cruce', d0 * d1 < 0 ? '<span class="gain">sí: apoyaría la hipótesis</span>' : 'no: ningún grupo gana con «su» estilo');
      sim.set('int', `${RC.nf(m, 1)} puntos`);
    });
  });

  RC.defineSim('quiz-sistemas', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué encontraron Wiseman y otros (2012) sobre mirar arriba a la derecha y mentir?', opts: ['Que es un indicador fiable', 'Que no hay relación entre la dirección de la mirada y la mentira', 'Que solo funciona con diestros'], ok: 1, fb: 'Ninguno de sus tres estudios encontró el patrón de la PNL.' },
      { q: '¿Con qué precisión detectan mentiras las personas en promedio?', opts: ['Cerca de 54 %', 'Cerca de 75 %', 'Cerca de 90 %'], ok: 0, fb: 'Bond y DePaulo (2006), con más de 24.000 evaluadores.' },
      { q: 'En un grupo de 30 «detectores» que en realidad aciertan al azar, que uno acierte 70 % de 20 juicios…', opts: ['Demuestra que el método funciona en manos expertas', 'Es esperable por azar cuando se mira al mejor de muchos', 'Es imposible'], ok: 1, fb: 'Seleccionar al mejor de muchos produce «expertos» por azar.' },
      { q: '¿Qué patrón tendría que encontrarse para apoyar los estilos de aprendizaje?', opts: ['Que los visuales rindan más que los auditivos', 'Una interacción cruzada: cada grupo rinde más con su propio estilo', 'Que el material visual sea mejor'], ok: 1, fb: 'Pashler y otros (2008) definieron este criterio; los experimentos no lo encuentran.' },
      { q: '¿Qué afirmación sobre la mirada sí tiene apoyo?', opts: ['La dirección indica el tipo de pensamiento', 'Apartar la mirada ayuda a pensar en algo difícil', 'Mirar abajo indica sentimientos'], ok: 1, fb: 'Glenberg y otros (1998): apartar la mirada reduce la competencia visual y mejora el recuerdo.' }
    ], { id: 'sistemas', shuffle: true });
  });
})();
