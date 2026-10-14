/* Capítulo 3 — Sinapsis y neurotransmisores */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, N = L.neuro;

  /* ======================================================================
     3.1 Suma temporal, espacial e inhibición
     ====================================================================== */
  RC.defineSim('suma', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Voltaje de una neurona que recibe entradas excitadoras e inhibidoras' });
    const cr = sim.canvas({ aspect: 6.5, label: 'Momentos en que llegan las espigas de cada sinapsis' });
    sim.group('Sinapsis A (tres espigas)');
    sim.slider('gap', { label: 'Intervalo entre espigas (ms)', min: 1, max: 25, step: 0.5, value: 12, fmt: (v) => RC.nf(v, 1) });
    sim.group('Sinapsis B y C (simultáneas, 60 ms)');
    sim.check('b', { label: 'B activa', value: true });
    sim.check('c', { label: 'C activa', value: false });
    sim.slider('w', { label: 'Peso de cada sinapsis excitadora (nA)', min: 1, max: 4, step: 0.05, value: 2.4, fmt: (v) => RC.nf(v, 2) });
    sim.group('Inhibición (GABA)');
    sim.check('inh', { label: 'Sinapsis inhibidora activa', value: false });
    sim.slider('ti', { label: 'Momento de la inhibición (ms)', min: 0, max: 100, step: 1, value: 58, fmt: (v) => RC.nf(v) });
    sim.slider('tau', { label: 'Constante de la membrana τm (ms)', min: 5, max: 30, step: 1, value: 10, fmt: (v) => RC.nf(v) });
    sim.out('n', 'Espigas', { hl: true });
    sim.out('pk', 'Voltaje máximo sin disparar');
    sim.onDraw(() => {
      const g = sim.p.gap;
      const sA = [10, 10 + g, 10 + 2 * g], sB = sim.p.b ? [60] : [], sC = sim.p.c ? [60] : [], sI = sim.p.inh ? [sim.p.ti] : [];
      const psc = N.alphaPSC([sA, sB, sC, sI], [sim.p.w, sim.p.w, sim.p.w, -2.2 * sim.p.w], 2);
      const s = N.lifSim({ I: psc, T: 110, dt: 0.05, p: { tau: sim.p.tau, tref: 3 } });
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 110, ymin: -75, ymax: 25, ylabel: 'voltaje (mV)', mb: 24 });
      pl.frame();
      pl.hline(-50, { color: '--c2', label: 'umbral', labelRight: true });
      pl.hline(-65, { color: '--ink-3', label: 'reposo' });
      pl.xy(s.t, s.V, { color: '--c1', width: 2.2 });
      RC.draw.clear(cr);
      const pr = new RC.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: 110, ymin: 0, ymax: 4, yticks: [], xlabel: 'tiempo (ms)', mt: 4, mb: 32 });
      pr.frame();
      const fila = (ts, y, col, lab) => { pr.label(1, y + 0.15, lab, { color: col, size: 11 }); ts.forEach((t) => pr.path([[t, y - 0.35], [t, y + 0.35]], { color: col, width: 2.6 })); };
      fila(sA, 3.3, '--c4', 'A'); fila(sB, 2.3, '--c3', 'B'); fila(sC, 1.5, '--c3', 'C'); fila(sI, 0.6, '--c2', 'inhib.');
      let pk = -100, inSpike = false;
      for (const v of s.V) if (v < 0 && v > pk) pk = v;
      sim.set('n', String(s.spikes.length));
      sim.set('pk', `${RC.nf(Math.min(pk, -50), 1)} mV`);
    });
  });

  /* ======================================================================
     3.2 Hendidura sináptica: recaptación y antagonistas (modelo didáctico)
     ====================================================================== */
  RC.defineSim('hendidura', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Concentración de neurotransmisor y respuesta postsináptica' });
    sim.group('Presináptica');
    sim.slider('f', { label: 'Frecuencia de disparo (Hz)', min: 2, max: 80, step: 1, value: 20, fmt: (v) => RC.nf(v) });
    sim.group('Fármacos');
    sim.slider('rec', { label: 'Recaptación funcionando', min: 0.05, max: 1, step: 0.05, value: 1, fmt: (v) => RC.pct(v, 0) });
    sim.slider('ant', { label: 'Receptores ocupados por un antagonista', min: 0, max: 0.9, step: 0.05, value: 0, fmt: (v) => RC.pct(v, 0) });
    sim.out('pico', 'Concentración máxima (relativa)');
    sim.out('resp', 'Respuesta media (relativa al control)', { hl: true });
    sim.note('Modelo didáctico de primer orden: cada espiga libera un pulso; recaptación con constante de 2 ms cuando funciona al 100 %; unión al receptor con kon = 2 y koff = 0,5 por ms.');
    let ref = null;
    const run = (f, rec, ant) => {
      const dt = 0.02, T = 300, kr = 0.5 * rec, kd = 0.02, kon = 2, koff = 0.5;
      let c = 0, r = 0, next = 5, sumR = 0, n = 0;
      const t = [], C = [], R = [];
      for (let k = 0; k * dt <= T; k++) {
        const tt = k * dt;
        if (tt >= next) { c += 1; next += 1000 / f; }
        c += dt * (-(kr + kd) * c);
        r += dt * (kon * c * (1 - ant - r) - koff * r);
        if (k % 10 === 0) { t.push(tt); C.push(c); R.push(r); }
        if (tt > 50) { sumR += r; n++; }
      }
      return { t, C, R, media: sumR / n };
    };
    sim.onDraw(() => {
      const base = run(sim.p.f, 1, 0), s = run(sim.p.f, sim.p.rec, sim.p.ant);
      RC.draw.clear(cv);
      const ymax = Math.max(1.2, ...s.C) * 1.05;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 300, ymin: 0, ymax, xlabel: 'tiempo (ms)', ylabel: 'unidades relativas' });
      pl.frame();
      pl.xy(s.t, s.C, { color: '--c4', width: 1.4, alpha: 0.85 });
      pl.xy(base.t, base.R, { color: '--c6', width: 1.6, dash: [5, 4] });
      pl.xy(s.t, s.R.map((v) => v), { color: '--c2', width: 2.6 });
      pl.legend([{ label: 'neurotransmisor en la hendidura', color: '--c4' }, { label: 'receptores activados', color: '--c2' }, { label: 'receptores activados sin fármacos', color: '--c6', dash: [5, 4] }], 'tr');
      sim.set('pico', RC.nf(Math.max(...s.C), 2));
      sim.set('resp', RC.pct(s.media / base.media, 0));
    });
  });

  RC.defineSim('quiz-sinapsis', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué demostró el experimento de Loewi con dos corazones de rana?', opts: ['Que las neuronas se comunican con chispas eléctricas', 'Que el nervio libera una sustancia química que transmite la señal', 'Que el corazón no tiene nervios'], ok: 1, fb: 'El líquido del primer corazón desaceleró al segundo: el nervio había liberado acetilcolina.' },
      { q: 'Dos entradas excitadoras que llegan a la vez y juntas hacen disparar a la neurona ilustran…', opts: ['Suma temporal', 'Suma espacial', 'Inhibición'], ok: 1, fb: 'Suma espacial: entradas simultáneas de sinapsis distintas.' },
      { q: 'Según los experimentos de Berridge, la dopamina se relaciona sobre todo con…', opts: ['El placer de un sabor', 'Querer y esforzarse por una recompensa, y aprender qué la predice', 'El dolor'], ok: 1, fb: 'Sin dopamina, las ratas siguen «gustando» del sabor dulce pero no se esfuerzan por obtenerlo.' },
      { q: 'Un inhibidor de la recaptación…', opts: ['Bloquea el receptor', 'Hace que el neurotransmisor permanezca más tiempo en la hendidura', 'Impide que se libere neurotransmisor'], ok: 1, fb: 'Al bloquear el transportador, el neurotransmisor se retira más despacio y su acción se prolonga.' },
      { q: '¿Qué conclusión es correcta sobre la serotonina y la depresión?', opts: ['La depresión es simplemente falta de serotonina', 'La hipótesis simple no tiene respaldo consistente, aunque los antidepresivos superan al placebo con efectos modestos', 'Los antidepresivos no funcionan'], ok: 1, fb: 'El mecanismo y la eficacia son preguntas distintas: Moncrieff (2022) sobre la hipótesis; Cipriani (2018) sobre la eficacia.' }
    ], { id: 'sinapsis', shuffle: true });
  });
})();
