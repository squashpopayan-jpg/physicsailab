/* Capítulo 16 — Diseñar hábitos que duran */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, H = L.hab;

  /* ======================================================================
     16.1 Desliz frente a recaída: el efecto «ya lo arruiné»
     ====================================================================== */
  RC.defineSim('recaida', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 1.15, label: 'Deslices por semana' });
    const ca = sim.canvas({ aspect: 1.15, label: 'Automaticidad del hábito nuevo' });
    sim.group('Persona');
    sim.slider('pT', { label: 'Probabilidad diaria de tentación', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.slider('pR0', { label: 'Capacidad inicial de resistir', min: 0.4, max: 0.95, step: 0.05, value: 0.7, fmt: (v) => RC.pct(v, 0) });
    sim.group('Después de un desliz');
    sim.check('avr', { label: 'Pensar «ya lo arruiné, qué más da»', value: true });
    sim.slider('dias', { label: 'Días de desánimo', min: 1, max: 7, step: 1, value: 3, fmt: (v) => RC.nf(v) });
    let seed = 8;
    sim.button('Otras 12 semanas', () => { seed++; }, { id: 'otra' });
    sim.out('tot', 'Deslices en 12 semanas', { hl: true });
    sim.out('fin', 'Automaticidad final');
    sim.onDraw(() => {
      const o = { seed, days: 84, pT: sim.p.pT, pR0: sim.p.pR0, avr: sim.p.avr, dias: sim.p.dias, factor: 0.5 };
      const r = H.relapse(o);
      RC.draw.clear(cl);
      const pl = new RC.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0.4, xmax: 12.6, ymin: 0, ymax: 7, xlabel: 'semana', ylabel: 'deslices', title: 'deslices por semana' });
      pl.frame();
      pl.bars(r.lapses.map((_, i) => i + 1), r.lapses, { color: '--c2', w: 0.7 });
      RC.draw.clear(ca);
      const pa = new RC.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: 0, xmax: 84, ymin: 0, ymax: 1, xlabel: 'día', ylabel: 'automaticidad', title: 'el hábito nuevo', yfmt: RC.pctAxis });
      pa.frame();
      pa.xy(r.auto.map((_, i) => i + 1), r.auto, { color: '--c3', width: 2.4 });
      sim.set('tot', String(r.lapses.reduce((a, b) => a + b, 0)));
      sim.set('fin', RC.pct(r.auto[r.auto.length - 1], 0));
    });
  });

  /* ======================================================================
     16.2 Diseño del hábito (modelo didáctico)
     P(hacer) = 1 − (1 − Hábito)·(1 − Intención·(1 − Fricción))
     Hábito crece con cada ejecución: ΔH = c·(1 − H), con c mayor si la señal es estable,
     la conducta es simple y hay recompensa inmediata. La intención decae sin recompensa.
     ====================================================================== */
  RC.defineSim('diseno', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Probabilidad diaria de hacer la conducta y fuerza del hábito durante 12 semanas' });
    sim.group('Diseño');
    sim.check('peq', { label: 'Conducta pequeña y concreta', value: false });
    sim.check('senal', { label: 'Atada a una rutina fija (después de…)', value: false });
    sim.check('fric', { label: 'Sin fricción (todo listo de antemano)', value: false });
    sim.check('prem', { label: 'Recompensa inmediata o disfrute', value: false });
    sim.check('dos', { label: 'Regla de nunca fallar dos veces', value: false });
    sim.out('p12', 'Probabilidad diaria en la semana 12', { hl: true });
    sim.out('H', 'Fuerza del hábito al final');
    sim.out('dias', 'Días cumplidos de 84');
    sim.onDraw(() => {
      const runs = 30, T = 84;
      const pm = new Array(T).fill(0), hm = new Array(T).fill(0);
      let cumpl = 0;
      for (let s = 1; s <= runs; s++) {
        const rng = L.rng(s * 7);
        let Hb = 0, I = 0.75, prev = 1;
        for (let d = 0; d < T; d++) {
          const fr = sim.p.fric ? 0.1 : sim.p.peq ? 0.25 : 0.45;
          let pi = I * (1 - fr);
          if (sim.p.dos && prev === 0) pi = Math.min(1, pi + 0.35);
          const p = 1 - (1 - Hb) * (1 - pi);
          const hizo = rng() < p ? 1 : 0;
          const c = 0.012 * (sim.p.senal ? 2.2 : 1) * (sim.p.peq ? 1.6 : 1) * (sim.p.prem ? 1.3 : 1);
          if (hizo) Hb += c * (1 - Hb); else Hb *= 0.985;
          I += sim.p.prem ? 0.004 * (0.8 - I) : -0.006 * I;
          pm[d] += p / runs; hm[d] += Hb / runs; cumpl += hizo / runs;
          prev = hizo;
        }
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: 0, ymax: 1, xlabel: 'día', ylabel: 'probabilidad o fuerza', yfmt: RC.pctAxis });
      pl.frame();
      pl.xy(pm.map((_, i) => i + 1), pm, { color: '--c1', width: 2.6 });
      pl.xy(hm.map((_, i) => i + 1), hm, { color: '--c3', width: 2.2, dash: [6, 4] });
      pl.legend([{ label: 'probabilidad de hacerlo ese día', color: '--c1' }, { label: 'fuerza del hábito', color: '--c3', dash: [6, 4] }], 'tl');
      const last = pm.slice(-7).reduce((a, b) => a + b, 0) / 7;
      sim.set('p12', RC.pct(last, 0));
      sim.set('H', RC.pct(hm[T - 1], 0));
      sim.set('dias', RC.nf(cumpl, 0));
    });
  });

  RC.defineSim('quiz-disenar', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué orden produjo más automaticidad en el estudio de la seda dental?', opts: ['Usarla antes de cepillarse', 'Usarla después de cepillarse', 'Da igual'], ok: 1, fb: 'La rutina previa (cepillarse) sirvió de disparador (Judah y otros, 2013).' },
      { q: 'En el megaestudio de 61.293 socios de gimnasio, ¿qué funcionó mejor?', opts: ['Mensajes motivacionales', 'Un premio pequeño por volver después de faltar', 'Mostrar fotos de cuerpos ideales'], ok: 1, fb: 'Cerca de 27 % más visitas semanales; ataca el momento del desliz.' },
      { q: '¿Qué dice la evidencia sobre los «empujoncitos» (nudges)?', opts: ['Siempre funcionan con efecto moderado', 'Su efecto promedio es incierto tras corregir sesgos y varía mucho según el tipo', 'Nunca funcionan'], ok: 1, fb: 'Mertens (2022) frente a Maier (2022): hay que probar y medir cada cambio.' },
      { q: 'Tras faltar un día al hábito, lo más útil es…', opts: ['Pensar que ya se arruinó y empezar el lunes', 'Retomar al día siguiente: nunca fallar dos veces', 'Duplicar la dosis'], ok: 1, fb: 'El problema no es el desliz, es encadenarlo (efecto «ya qué»).' },
      { q: 'El efecto del nuevo comienzo dice que…', opts: ['Los hitos temporales (año nuevo, lunes, cumpleaños) motivan a empezar', 'Solo se puede empezar en enero', 'Los comienzos siempre fracasan'], ok: 0, fb: 'Dai, Milkman y Riis (2014).' }
    ], { id: 'disenar', shuffle: true });
  });
})();
