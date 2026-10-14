/* Capítulo 24 — Quemar grasa: oxidación, intensidad y ejercicio */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, En = L.en;

  /* ======================================================================
     24.1 Grasa y carbohidrato oxidados según la intensidad (Frayn + Weir, cociente respiratorio ilustrativo)
     ====================================================================== */
  RC.defineSim('oxidacion', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 1.2, label: 'Gramos por minuto de grasa y de carbohidrato oxidados según la intensidad' });
    const cs = sim.canvas({ aspect: 1.2, label: 'Energía de la sesión dividida en grasa y carbohidrato' });
    sim.group('Persona');
    sim.slider('vo2', { label: 'VO₂máx (L/min)', min: 1.5, max: 5, step: 0.1, value: 3, fmt: (v) => RC.nf(v, 1) });
    sim.check('ent', { label: 'Entrenada en resistencia', value: false });
    sim.group('Sesión');
    sim.slider('x', { label: 'Intensidad (% del VO₂máx)', min: 0.25, max: 0.95, step: 0.01, value: 0.45, fmt: (v) => RC.pct(v, 0) });
    sim.slider('min', { label: 'Duración (min)', min: 10, max: 120, step: 5, value: 60, fmt: (v) => RC.nf(v) });
    sim.out('rer', 'Cociente respiratorio');
    sim.out('kcal', 'Energía de la sesión', { hl: true });
    sim.out('g', 'Grasa / carbohidrato oxidados');
    sim.out('fm', 'Intensidad de máxima oxidación de grasa');
    sim.onDraw(() => {
      const e = sim.p.ent ? 1 : 0, V = sim.p.vo2;
      const xs = L.util.linspace(0.25, 0.95, 141);
      const S = xs.map((x) => En.sesion(V, x, 1, e));
      const gm = S.map((s) => s.grasaGmin), cm = S.map((s) => s.choG);
      let iMax = 0; gm.forEach((g, i) => { if (g > gm[iMax]) iMax = i; });
      const ses = En.sesion(V, sim.p.x, sim.p.min, e), now = En.sesion(V, sim.p.x, 1, e);
      RC.draw.clear(cc);
      const pc = new RC.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0.25, xmax: 0.95, ymin: 0, ymax: Math.max(...cm) * 1.08, xlabel: 'intensidad (% VO₂máx)', ylabel: 'g/min', xfmt: RC.pctAxis, title: 'oxidación por minuto' });
      pc.frame();
      pc.xy(xs, cm, { color: '--c2', width: 2.4 });
      pc.xy(xs, gm.map((g) => g * 4), { color: '--c3', width: 2.6 });
      pc.vline(xs[iMax], { color: '--c3', label: 'máx. grasa', labelY: pc.ih * 0.62 });
      pc.vline(sim.p.x, { color: '--ink', dash: [] });
      pc.dot(sim.p.x, now.grasaGmin * 4, { color: '--c3' });
      pc.dot(sim.p.x, now.choG, { color: '--c2' });
      pc.legend([{ label: 'carbohidrato', color: '--c2' }, { label: 'grasa × 4', color: '--c3' }], 'tl');
      RC.draw.clear(cs);
      const kG = ses.grasaG * 9.4, kC = ses.kcal - kG;
      const ps = new RC.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 2, ymin: 0, ymax: Math.max(400, ses.kcal * 1.15), xticks: [1], xfmt: () => 'esta sesión', ylabel: 'kcal', title: 'energía de la sesión' });
      ps.frame();
      ps.stack([1], [{ ys: [kG], color: '--c3' }, { ys: [kC], color: '--c2' }], { w: 1.3 });
      ps.label(1, kG / 2, `grasa: ${RC.nf(kG, 0)} kcal`, { align: 'center', color: '--ink' });
      ps.label(1, kG + kC / 2, `carbohidrato: ${RC.nf(kC, 0)} kcal`, { align: 'center', color: '--ink' });
      sim.set('rer', RC.nf(ses.rer, 3));
      sim.set('kcal', RC.nf(ses.kcal, 0) + ' kcal');
      sim.set('g', RC.nf(ses.grasaG, 1) + ' g / ' + RC.nf(ses.choG, 0) + ' g');
      sim.set('fm', RC.pct(xs[iMax], 0) + ' (' + RC.nf(gm[iMax], 2) + ' g/min)');
    });
  });

  /* ======================================================================
     24.2 Ejercicio sin cambiar la dieta y compensación con más ingesta (modelo de Hall)
     ====================================================================== */
  RC.defineSim('compensacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Peso durante un año de ejercicio con distintas compensaciones en la ingesta' });
    sim.group('Ejercicio');
    sim.slider('ses', { label: 'Sesiones por semana', min: 1, max: 7, step: 1, value: 4, fmt: (v) => RC.nf(v) });
    sim.slider('kc', { label: 'Gasto por sesión (kcal)', min: 150, max: 800, step: 25, value: 400, fmt: (v) => RC.nf(v) });
    sim.group('Respuesta del cuerpo');
    sim.slider('comp', { label: 'Parte del gasto que se repone comiendo más', min: 0, max: 1, step: 0.05, value: 0.3, fmt: (v) => RC.pct(v, 0) });
    sim.out('dia', 'Gasto del ejercicio, promedio diario');
    sim.out('p0', 'Pérdida a 1 año sin compensación');
    sim.out('pc', 'Pérdida a 1 año con compensación', { hl: true });
    sim.out('r77', 'Lo que diría la regla de 7 700');
    sim.onDraw(() => {
      const o = { sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.5 };
      const ex = (sim.p.ses * sim.p.kc) / 7;
      const run = (c) => En.hallSim(o, (t, s) => ({ kcal: s.EI0 / En.KJ + c * ex, ejercicioKcal: ex }), 365, 0.5);
      const r0 = run(0), rc = run(sim.p.comp);
      const rule = r0.t.map((d) => 95 - En.rule7700(ex, d));
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 365, ymin: Math.min(80, Math.floor(Math.min(...rule))), ymax: 96, xlabel: 'días', ylabel: 'peso (kg)' });
      pl.frame();
      pl.xy(r0.t, rule, { color: '--ink-3', width: 1.5, dash: [6, 4] });
      pl.xy(r0.t, r0.BW, { color: '--c3', width: 2.2 });
      pl.xy(rc.t, rc.BW, { color: '--c1', width: 2.8 });
      pl.legend([{ label: 'regla de 7 700 kcal/kg', color: '--ink-3', dash: [6, 4] }, { label: 'modelo, sin compensar', color: '--c3' }, { label: 'modelo, con compensación', color: '--c1' }], 'bl');
      sim.set('dia', RC.nf(ex, 0) + ' kcal/día');
      sim.set('p0', RC.nf(95 - r0.BW[365], 1) + ' kg');
      sim.set('pc', RC.nf(95 - rc.BW[365], 1) + ' kg');
      sim.set('r77', RC.nf(En.rule7700(ex, 365), 1) + ' kg');
    });
  });

  RC.defineSim('quiz-grasa', function (sim) {
    RC.quiz(sim, [
      { q: 'La «zona de quema de grasa» a baja intensidad…', opts: ['Es la mejor forma de perder grasa', 'Usa un mayor porcentaje de grasa por minuto, pero gasta menos energía total; la pérdida de grasa depende del balance de días y semanas', 'No existe: el cuerpo nunca oxida grasa durante el ejercicio'], ok: 1, fb: 'El porcentaje no decide; el balance acumulado sí.' },
      { q: 'Los metaanálisis que comparan intervalos de alta intensidad con ejercicio continuo moderado encontraron…', opts: ['Que los intervalos queman el triple de grasa', 'Pérdidas de grasa parecidas; los intervalos ahorran tiempo', 'Que solo el ejercicio continuo funciona'], ok: 1, fb: 'Wewege y otros (2017); Keating y otros (2017).' },
      { q: 'En el ensayo de Schoenfeld y otros (2014), hacer cardio en ayunas…', opts: ['Duplicó la pérdida de grasa', 'No produjo diferencias frente a hacerlo después de comer, con la misma dieta hipocalórica', 'Hizo perder músculo'], ok: 1, fb: 'Con el mismo déficit, la composición corporal cambió igual.' },
      { q: 'Hacer abdominales todos los días…', opts: ['Reduce la grasa del abdomen en particular', 'Fortalece el abdomen, pero no reduce la grasa localizada más que en otras zonas', 'Aumenta la grasa del abdomen'], ok: 1, fb: 'Vispute y otros (2011).' },
      { q: '¿Por qué el ejercicio solo suele adelgazar menos de lo calculado?', opts: ['Porque el ejercicio no gasta energía', 'Por compensación: algo más de ingesta, menos actividad espontánea y el gasto restringido', 'Porque el músculo pesa más que la grasa'], ok: 1, fb: 'Capítulo 23 y simulación 24.2.' }
    ], { id: 'grasa', shuffle: true });
  });
})();
