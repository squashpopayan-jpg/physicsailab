/* Capítulo 23 — Balance de energía: lo que dice la física */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, En = L.en;

  /* ======================================================================
     23.1 Modelo dinámico de Hall frente a la regla de 7 700 kcal/kg
     ====================================================================== */
  RC.defineSim('hall', function (sim) {
    const cw = sim.canvas({ aspect: 2, label: 'Peso a lo largo del tiempo con el modelo de Hall y con la regla de 7 700 kcal por kilo' });
    const ce = sim.canvas({ aspect: 2.6, label: 'Energía ingerida y gasto de energía a lo largo del tiempo' });
    sim.group('Persona');
    sim.seg('sexo', { options: [['h', 'Hombre'], ['m', 'Mujer']], value: 'h' });
    sim.slider('edad', { label: 'Edad (años)', min: 18, max: 75, step: 1, value: 40, fmt: (v) => RC.nf(v) });
    sim.slider('talla', { label: 'Estatura (cm)', min: 145, max: 200, step: 1, value: 175, fmt: (v) => RC.nf(v) });
    sim.slider('peso', { label: 'Peso inicial (kg)', min: 50, max: 160, step: 1, value: 95, fmt: (v) => RC.nf(v) });
    sim.slider('pal', { label: 'Nivel de actividad (gasto / reposo)', min: 1.3, max: 2.1, step: 0.05, value: 1.6, fmt: (v) => RC.nf(v, 2) });
    sim.group('Plan');
    sim.slider('def', { label: 'Comer menos que el gasto inicial (kcal/día)', min: 0, max: 1000, step: 25, value: 500, fmt: (v) => RC.nf(v) });
    sim.seg('carb', { label: 'Dieta', options: [['0.5', 'Mixta'], ['0.1', 'Baja en carbohidratos']], value: '0.5' });
    sim.slider('meses', { label: 'Horizonte (meses)', min: 1, max: 36, step: 1, value: 12, fmt: (v) => RC.nf(v) });
    sim.out('ee0', 'Gasto inicial estimado');
    sim.out('bw', 'Pérdida al final (modelo)', { hl: true });
    sim.out('r77', 'Pérdida según la regla de 7 700');
    sim.out('fl', 'Grasa / tejido magro perdidos');
    sim.out('gap', 'Déficit real al final');
    sim.onDraw(() => {
      const o = { sexo: sim.p.sexo, edad: sim.p.edad, talla: sim.p.talla, peso: sim.p.peso, pal: sim.p.pal };
      const dias = Math.round(sim.p.meses * 30.4);
      const cf = +sim.p.carb;
      const r = En.hallSim(o, (t, s) => ({ kcal: s.EI0 / En.KJ - sim.p.def, carbFrac: cf }), dias, 0.5);
      const ee0 = r.s.EI0 / En.KJ;
      const rule = r.t.map((d) => sim.p.peso - En.rule7700(sim.p.def, d));
      const ymin = Math.max(0, Math.floor(Math.min(...r.BW, sim.p.peso - En.rule7700(sim.p.def, dias)) / 5) * 5 - 2);
      RC.draw.clear(cw);
      const pw = new RC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: dias, ymin: Math.max(ymin, sim.p.peso * 0.4), ymax: sim.p.peso + 1, xlabel: 'días', ylabel: 'peso (kg)', title: 'peso' });
      pw.frame();
      pw.xy(r.t, rule, { color: '--ink-3', width: 1.6, dash: [6, 4] });
      pw.xy(r.t, r.BW, { color: '--c1', width: 2.8 });
      pw.legend([{ label: 'modelo de Hall', color: '--c1' }, { label: 'regla de 7 700 kcal/kg', color: '--ink-3', dash: [6, 4] }], 'tr');
      RC.draw.clear(ce);
      const emin = Math.min(...r.EI, ...r.EE), emax = Math.max(...r.EE, ee0);
      const pe = new RC.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: dias, ymin: Math.floor((emin - 150) / 100) * 100, ymax: Math.ceil((emax + 150) / 100) * 100, xlabel: 'días', ylabel: 'kcal/día', title: 'energía' });
      pe.frame();
      pe.hline(ee0, { color: '--ink-3', label: 'gasto inicial' });
      pe.xy(r.t, r.EE, { color: '--c2', width: 2.4 });
      pe.xy(r.t, r.EI, { color: '--c3', width: 2.4 });
      pe.legend([{ label: 'gasto', color: '--c2' }, { label: 'ingesta', color: '--c3' }], 'tr');
      const n = r.t.length - 1;
      sim.set('ee0', RC.nf(ee0, 0) + ' kcal/día');
      sim.set('bw', RC.nf(sim.p.peso - r.BW[n], 1) + ' kg');
      sim.set('r77', RC.nf(En.rule7700(sim.p.def, dias), 1) + ' kg');
      sim.set('fl', RC.nf(r.F[0] - r.F[n], 1) + ' / ' + RC.nf(r.L[0] - r.L[n], 1) + ' kg');
      sim.set('gap', RC.nf(r.EE[n] - r.EI[n], 0) + ' kcal/día');
    });
  });

  /* ======================================================================
     23.2 Gasto aditivo frente a gasto restringido (Pontzer y otros, 2016). Curvas ilustrativas.
     ====================================================================== */
  RC.defineSim('restringido', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Gasto total diario según el nivel de actividad en los modelos aditivo y restringido' });
    sim.group('Persona');
    sim.slider('bmr', { label: 'Gasto en reposo (kcal/día)', min: 1200, max: 2200, step: 50, value: 1700, fmt: (v) => RC.nf(v) });
    sim.slider('act', { label: 'Nivel de actividad', min: 0, max: 1, step: 0.02, value: 0.7, fmt: (v) => RC.pct(v, 0) });
    sim.out('ad', 'Gasto total, modelo aditivo');
    sim.out('re', 'Gasto total, modelo restringido', { hl: true });
    sim.out('dif', 'Diferencia');
    sim.onDraw(() => {
      const xs = L.util.linspace(0, 1, 101);
      const b = sim.p.bmr, a = sim.p.act;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: b, ymax: b * 2.3, xlabel: 'nivel de actividad física (de sedentario a muy activo)', ylabel: 'gasto total (kcal/día)', xfmt: RC.pctAxis });
      pl.frame();
      pl.xy(xs, xs.map((x) => En.tee(b, x, 'aditivo')), { color: '--ink-3', width: 2, dash: [6, 4] });
      pl.xy(xs, xs.map((x) => En.tee(b, x, 'restringido')), { color: '--c1', width: 2.8 });
      pl.vline(a, { color: '--ink-3' });
      pl.dot(a, En.tee(b, a, 'aditivo'), { color: '--ink-3' });
      pl.dot(a, En.tee(b, a, 'restringido'), { color: '--c1' });
      pl.legend([{ label: 'aditivo (cada sesión suma)', color: '--ink-3', dash: [6, 4] }, { label: 'restringido (se aplana)', color: '--c1' }], 'tl');
      const ad = En.tee(b, a, 'aditivo'), re = En.tee(b, a, 'restringido');
      sim.set('ad', RC.nf(ad, 0) + ' kcal');
      sim.set('re', RC.nf(re, 0) + ' kcal');
      sim.set('dif', RC.nf(ad - re, 0) + ' kcal/día');
    });
  });

  RC.defineSim('quiz-energia', function (sim) {
    RC.quiz(sim, [
      { q: 'Si alguien come 500 kcal/día menos durante un año, el modelo de Hall predice que perderá…', opts: ['Unos 24 kg, como dice la regla de 7 700', 'Bastante menos, porque el gasto baja a medida que baja el peso', 'Nada'], ok: 1, fb: 'Para el hombre de 95 kg del ejemplo, unos 13 kg en un año.' },
      { q: 'La pérdida rápida de la primera semana con una dieta baja en carbohidratos es sobre todo…', opts: ['Grasa', 'Glucógeno y el agua que lo acompaña', 'Músculo'], ok: 1, fb: 'Cada gramo de glucógeno se almacena con unos 3 gramos de agua.' },
      { q: 'Según Pontzer y otros (2021), el gasto ajustado por masa magra…', opts: ['Cae desde los 30 años', 'Es estable entre los 20 y los 60 años y baja después', 'Es mayor en las mujeres'], ok: 1, fb: 'El «metabolismo lento» de la mediana edad no aparece en los datos de agua doblemente marcada.' },
      { q: 'El modelo de gasto restringido dice que…', opts: ['El ejercicio no gasta energía', 'A niveles altos de actividad, el gasto total crece menos de lo esperado porque el cuerpo ahorra en otros procesos', 'Las personas activas gastan menos que las sedentarias'], ok: 1, fb: 'Pontzer y otros (2016).' },
      { q: 'En el estudio de Lichtman y otros (1992), las personas que decían no poder bajar de peso con poca comida…', opts: ['Tenían un metabolismo muy bajo', 'Subestimaban lo que comían y sobrestimaban su actividad', 'Tenían una enfermedad de tiroides'], ok: 1, fb: 'Su gasto era normal; el error estaba en el registro.' }
    ], { id: 'energia', shuffle: true });
  });
})();
