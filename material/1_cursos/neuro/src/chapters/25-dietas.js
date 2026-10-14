/* Capítulo 25 — Dietas: lo que funciona y por qué */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, E = L.ev;

  /* ======================================================================
     25.1 Dos dietas: la diferencia promedio frente a la variación entre personas.
     Cambio individual = −(pérdida media de la dieta) × adherencia relativa + ruido. Magnitudes ilustrativas
     inspiradas en DIETFITS (Gardner y otros, 2018).
     ====================================================================== */
  RC.defineSim('dos-dietas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Cambio de peso individual con dos dietas distintas' });
    sim.group('El mundo simulado');
    sim.slider('dif', { label: 'Diferencia real entre las dietas (kg)', min: 0, max: 3, step: 0.1, value: 0.7, fmt: (v) => RC.nf(v, 1) });
    sim.slider('sd', { label: 'Variación de la adherencia entre personas', min: 0.1, max: 1, step: 0.05, value: 0.7, fmt: (v) => RC.pct(v, 0) });
    sim.slider('n', { label: 'Personas por dieta', min: 20, max: 400, step: 10, value: 300, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otro ensayo', () => { seed++; }, { id: 'otro' });
    sim.out('ma', 'Media dieta A / dieta B');
    sim.out('p', 'Prueba t de Welch (p)', { hl: true });
    sim.out('rango', 'Rango individual (dieta A)');
    sim.out('sup', 'Personas de B que perdieron más que la media de A');
    sim.onDraw(() => {
      const rng = L.rng(seed * 97 + 5), n = sim.p.n;
      const gen = (media) => {
        const out = [];
        for (let i = 0; i < n; i++) {
          const adh = Math.max(-0.3, 1 + sim.p.sd * rng.gauss());       /* adherencia relativa: 1 = la media */
          out.push(-media * adh + 2.5 * rng.gauss());
        }
        return out;
      };
      const A = gen(6.0), B = gen(6.0 - sim.p.dif);
      const w = E.welch(A, B);
      const mA = L.stat.mean(A), mB = L.stat.mean(B);
      RC.draw.clear(cv);
      const lo = Math.min(-30, Math.min(...A, ...B)), hi = Math.max(12, Math.max(...A, ...B));
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: hi, ymin: 0, ymax: 3, ml: 72, yticks: [1, 2], yfmt: (v) => (v === 2 ? 'dieta A' : v === 1 ? 'dieta B' : ''), xlabel: 'cambio de peso a 12 meses (kg)' });
      pl.frame();
      const r2 = L.rng(seed * 13 + 1);
      A.forEach((v) => pl.dot(v, 2 + 0.55 * (r2() - 0.5), { r: 2.4, color: '--c1' }));
      B.forEach((v) => pl.dot(v, 1 + 0.55 * (r2() - 0.5), { r: 2.4, color: '--c3' }));
      pl.vline(0, { color: '--ink-3', dash: [] });
      [[mA, 2, '--c1'], [mB, 1, '--c3']].forEach(([m, y, c]) => { pl.xy([m, m], [y - 0.42, y + 0.42], { color: '--ink', width: 3 }); pl.label(m, y + 0.47, 'media ' + RC.nf(m, 1), { align: 'center', color: '--ink' }); });
      sim.set('ma', RC.nf(mA, 1) + ' / ' + RC.nf(mB, 1) + ' kg');
      sim.set('p', w.p < 0.001 ? '< 0,001' : RC.nf(w.p, 3));
      sim.set('rango', RC.nf(Math.min(...A), 0) + ' a ' + RC.nf(Math.max(...A), 0) + ' kg');
      sim.set('sup', RC.pct(B.filter((v) => v < mA).length / n, 0));
    });
  });

  /* ======================================================================
     25.2 Proteína: rangos con respaldo para conservar músculo
     ====================================================================== */
  RC.defineSim('proteina', function (sim) {
    const cv = sim.canvas({ aspect: 3, label: 'Proteína diaria recomendada según el objetivo, en gramos por día' });
    sim.group('Usted');
    sim.slider('peso', { label: 'Peso (kg)', min: 45, max: 150, step: 1, value: 80, fmt: (v) => RC.nf(v) });
    sim.seg('obj', { label: 'Situación', options: [['base', 'Sin entrenar'], ['fuerza', 'Entrena fuerza'], ['deficit', 'Déficit + fuerza']], value: 'deficit' });
    sim.slider('com', { label: 'Comidas al día', min: 2, max: 6, step: 1, value: 4, fmt: (v) => RC.nf(v) });
    sim.out('rng', 'Rango diario', { hl: true });
    sim.out('pc', 'Por comida');
    sim.out('ej', 'Equivale a');
    const R = { base: [0.8, 1.0], fuerza: [1.4, 2.0], deficit: [1.6, 2.4] };
    sim.onDraw(() => {
      const P = sim.p.peso, r = R[sim.p.obj];
      RC.draw.clear(cv);
      const xmax = Math.ceil((2.6 * P) / 20) * 20;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax: 1, yticks: [], xlabel: 'gramos de proteína por día' });
      pl.frame();
      pl.band(0.8 * P, 2.4 * P, { color: '--ink-3', alpha: 0.08 });
      pl.band(r[0] * P, r[1] * P, { color: '--c3', alpha: 0.35 });
      pl.vline(0.8 * P, { color: '--ink-3', label: 'mínimo general (0,8 g/kg)', labelY: 14 });
      pl.vline(1.6 * P, { color: '--c1', label: 'meseta del metaanálisis (1,6 g/kg)', labelY: 32 });
      pl.label((r[0] + r[1]) * P / 2, 0.35, `${RC.nf(r[0] * P, 0)}–${RC.nf(r[1] * P, 0)} g`, { align: 'center', color: '--ink', size: 14 });
      sim.set('rng', `${RC.nf(r[0] * P, 0)} a ${RC.nf(r[1] * P, 0)} g/día (${RC.nf(r[0], 1)}–${RC.nf(r[1], 1)} g/kg)`);
      const tot = ((r[0] + r[1]) / 2) * P;
      sim.set('pc', `${RC.nf(tot / sim.p.com, 0)} g en cada una de ${sim.p.com} comidas (útil: al menos ${RC.nf(0.3 * P, 0)}–${RC.nf(0.4 * P, 0)} g)`);
      sim.set('ej', `${RC.nf(tot / 31, 1)} pechugas de pollo de 100 g o ${RC.nf(tot / 6.3, 0)} huevos`);
    });
  });

  RC.defineSim('quiz-dietas', function (sim) {
    RC.quiz(sim, [
      { q: 'En DIETFITS, tras 12 meses, la dieta baja en grasa y la baja en carbohidratos…', opts: ['Dieron diferencias enormes', 'Produjeron pérdidas parecidas (unos 5 a 6 kg) con enorme variación entre personas', 'Hicieron subir de peso'], ok: 1, fb: 'Gardner y otros (2018); ni los genes ni la insulina predijeron quién respondía mejor.' },
      { q: 'En el experimento de Hall y otros (2019), con comida ultraprocesada a voluntad las personas…', opts: ['Comieron lo mismo', 'Comieron unas 500 kcal/día más y subieron de peso', 'Bajaron de peso'], ok: 1, fb: 'Las dietas tenían las mismas calorías, azúcar, grasa, fibra y sodio disponibles.' },
      { q: 'El ayuno intermitente comparado con la misma restricción calórica sin horario…', opts: ['Duplica la pérdida', 'Da resultados parecidos; funciona si ayuda a comer menos', 'Es peligroso siempre'], ok: 1, fb: 'Liu y otros (2022); Lowe y otros (2020).' },
      { q: 'Durante un déficit con entrenamiento de fuerza, una ingesta alta de proteína…', opts: ['Daña los riñones de personas sanas', 'Ayuda a conservar o incluso ganar masa magra', 'No cambia nada'], ok: 1, fb: 'Longland y otros (2016); Morton y otros (2018).' },
      { q: 'El mejor predictor de cuánto peso se pierde con una dieta es…', opts: ['El tipo de dieta', 'La adherencia: cuánto se sigue en la práctica', 'El grupo sanguíneo'], ok: 1, fb: 'Dansinger y otros (2005). Las dietas por grupo sanguíneo no tienen respaldo.' }
    ], { id: 'dietas', shuffle: true });
  });
})();
