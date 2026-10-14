/* Capítulo 15 — La ciencia del hábito */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, H = L.hab;

  /* ======================================================================
     15.1 Devaluación tras entrenamiento corto o largo
     ====================================================================== */
  RC.defineSim('devaluacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Probabilidad de la conducta durante el entrenamiento y después de devaluar el premio' });
    sim.group('Entrenamiento');
    sim.slider('tr', { label: 'Ensayos de entrenamiento', min: 20, max: 600, step: 10, value: 60, fmt: (v) => RC.nf(v) });
    sim.slider('bh', { label: 'Peso del sistema de hábitos', min: 0, max: 10, step: 0.5, value: 6, fmt: (v) => RC.nf(v, 1) });
    sim.out('antes', 'Probabilidad antes de devaluar');
    sim.out('desp', 'Probabilidad 40 ensayos después', { hl: true });
    sim.out('hab', 'Fuerza del hábito al devaluar');
    sim.onDraw(() => {
      const tr = sim.p.tr, test = 120;
      let acc = null;
      const R = 12;
      for (let s = 1; s <= R; s++) {
        const r = L.learn.habitModel({ train: tr, test, bh: sim.p.bh, seed: s });
        if (!acc) acc = { p: r.p.slice(), H: r.H[tr - 1][0] }; else { r.p.forEach((v, i) => { acc.p[i] += v; }); acc.H += r.H[tr - 1][0]; }
      }
      const p = acc.p.map((v) => v / R);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tr + test, ymin: 0, ymax: 1.02, xlabel: 'ensayos', ylabel: 'P(realizar la conducta)', yfmt: RC.pctAxis });
      pl.frame();
      pl.band(tr, tr + test, { color: '--c2', alpha: 0.07 });
      pl.vline(tr, { color: '--c2', label: 'premio devaluado', labelY: 14 });
      pl.xy(p.map((_, i) => i + 1), p, { color: '--c1', width: 2.4 });
      sim.set('antes', RC.pct(p[tr - 1], 0));
      sim.set('desp', RC.pct(p[Math.min(p.length - 1, tr + 40)], 0));
      sim.set('hab', RC.nf(acc.H / R, 2));
    });
  });

  /* ======================================================================
     15.2 Curva de Lally: datos simulados y ajuste
     ====================================================================== */
  RC.defineSim('lally', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Automaticidad diaria simulada y curva ajustada' });
    sim.group('La persona y la conducta');
    sim.slider('c', { label: 'Rapidez de automatización (tasa c por día)', min: 0.01, max: 0.15, step: 0.005, value: 0.045, fmt: (v) => RC.nf(v, 3) });
    sim.slider('amax', { label: 'Meseta de automaticidad (1–7)', min: 3, max: 7, step: 0.1, value: 6, fmt: (v) => RC.nf(v, 1) });
    sim.slider('noise', { label: 'Ruido del autorreporte', min: 0.05, max: 1, step: 0.05, value: 0.35, fmt: (v) => RC.nf(v, 2) });
    sim.group('Días fallados');
    sim.slider('miss', { label: 'Probabilidad de fallar un día', min: 0, max: 0.4, step: 0.01, value: 0.1, fmt: (v) => RC.pct(v, 0) });
    sim.slider('loss', { label: 'Pérdida de automaticidad por falla', min: 0, max: 0.15, step: 0.005, value: 0.01, fmt: (v) => RC.pct(v, 1) });
    let seed = 21;
    sim.button('Otra persona', () => { seed++; }, { id: 'otra' });
    sim.out('t95', 'Días hasta el 95 % (ajuste)', { hl: true });
    sim.out('par', 'Parámetros ajustados');
    sim.out('r2', 'R² del ajuste');
    sim.onDraw(() => {
      const d = H.simLally({ seed, c: sim.p.c, amax: sim.p.amax, noise: sim.p.noise, miss: sim.p.miss, lossOnMiss: sim.p.loss, days: 84 });
      const f = H.fitLally(d.ts, d.ys);
      RC.draw.clear(cv);
      const xmax = Math.max(100, Math.min(300, isFinite(f.t95) ? f.t95 * 1.1 : 100));
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 1, ymax: 7, xlabel: 'días', ylabel: 'automaticidad (1–7)' });
      pl.frame();
      pl.band(84, xmax, { color: '--c6', alpha: 0.08 });
      pl.label(86, 1.4, 'extrapolación', { color: '--ink-3' });
      d.ts.forEach((t, i) => pl.dot(t, d.ys[i], { color: '--c6', r: 2.6 }));
      pl.fn((t) => H.lallyF(t, [f.a, f.b, f.c]), { color: '--c1', width: 2.6 });
      if (isFinite(f.t95) && f.t95 < xmax) pl.vline(f.t95, { color: '--c2', label: `95 % ≈ día ${Math.round(f.t95)}`, labelY: 16 });
      sim.set('t95', isFinite(f.t95) ? `${Math.round(f.t95)} días` + (f.t95 > 84 ? ' <span class="loss">(extrapolado)</span>' : '') : '—');
      sim.set('par', `a = ${RC.nf(f.a, 2)} · b = ${RC.nf(f.b, 2)} · c = ${RC.nf(f.c, 3)}`);
      sim.set('r2', RC.nf(f.r2, 3));
    });
  });

  /* ======================================================================
     15.3 Hábito atado al contexto
     ====================================================================== */
  RC.defineSim('contexto', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Probabilidad de la conducta en casa, durante un cambio de contexto y al volver' });
    sim.group('Situación');
    sim.seg('tipo', { options: [['bueno', 'Hábito deseado (entrenar)'], ['malo', 'Hábito indeseado (celular en la cama)']], value: 'bueno' });
    sim.slider('dur', { label: 'Duración del cambio de contexto (días)', min: 3, max: 60, step: 1, value: 15, fmt: (v) => RC.nf(v) });
    sim.slider('int', { label: 'Fuerza de la intención consciente', min: 0, max: 1, step: 0.05, value: 0.4, fmt: (v) => RC.pct(v, 0) });
    sim.check('vuelve', { label: 'Volver al contexto original', value: true });
    sim.out('fin', 'Probabilidad de la conducta al final', { hl: true });
    sim.onDraw(() => {
      /* Valores esperados día a día. Hábito deseado: P = H + (1 − H)·intención.
         Hábito indeseado: P = H·(1 − intención) + (1 − H)·0,1 (tentación de base).
         Hacer la conducta en un contexto fortalece el hábito de ese contexto; no hacerla lo debilita. */
      const T = 120, t0 = 40, t1 = t0 + sim.p.dur, bueno = sim.p.tipo === 'bueno', it = sim.p.int;
      const H = { casa: 0.8, nuevo: 0 }, a = 0.06, d = 0.02, dAus = 0.004;
      const xs = [], ps = [], hs = [];
      for (let t = 0; t <= T; t++) {
        const ctx = t >= t0 && (t < t1 || !sim.p.vuelve) ? 'nuevo' : 'casa';
        const h = H[ctx];
        const p = bueno ? h + (1 - h) * it : h * (1 - it) + (1 - h) * 0.1;
        H[ctx] += a * p * (1 - h) - d * (1 - p) * h;
        if (ctx === 'nuevo') H.casa -= dAus * H.casa;
        xs.push(t); ps.push(p); hs.push(H.casa);
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: 0, ymax: 1, xlabel: 'días', ylabel: 'probabilidad diaria', yfmt: RC.pctAxis });
      pl.frame();
      pl.band(t0, sim.p.vuelve ? t1 : T, { color: '--c4', alpha: 0.08 });
      pl.label(t0 + 1, 0.95, sim.p.vuelve ? 'otro contexto' : 'contexto nuevo (mudanza)', { color: '--c4' });
      pl.xy(xs, ps, { color: bueno ? '--c3' : '--c2', width: 2.6 });
      pl.xy(xs, hs, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.legend([{ label: bueno ? 'entrenar' : 'celular en la cama', color: bueno ? '--c3' : '--c2' }, { label: 'fuerza del hábito en casa', color: '--ink-3', dash: [5, 4] }], 'br');
      sim.set('fin', RC.pct(ps[T], 0));
    });
  });

  RC.defineSim('quiz-habitos', function (sim) {
    RC.quiz(sim, [
      { q: 'En psicología, un hábito es…', opts: ['Cualquier cosa que se hace a menudo', 'Una conducta disparada automáticamente por una señal del contexto, aprendida por repetición', 'Una decisión consciente diaria'], ok: 1, fb: 'La clave es la asociación automática entre contexto y conducta.' },
      { q: 'Una rata sobreentrenada sigue presionando la palanca por una comida que ya no quiere. Esto indica…', opts: ['Control dirigido a metas', 'Control por hábito', 'Hambre'], ok: 1, fb: 'La insensibilidad a la devaluación es la firma del hábito.' },
      { q: '¿Cuánto tardó en mediana en formarse un hábito en el estudio de Lally?', opts: ['21 días', '66 días, con un rango de 18 a 254', 'Un año'], ok: 1, fb: 'Y la revisión de 2024 encontró medianas de 59 a 66 días.' },
      { q: 'Fallar un día al formar un hábito…', opts: ['Obliga a empezar de cero', 'No altera de forma apreciable el proceso si se retoma', 'Acelera el hábito'], ok: 1, fb: 'Lally y otros (2010). Lo que importa es no encadenar fallas.' },
      { q: '¿Por qué una mudanza es buena oportunidad para cambiar hábitos?', opts: ['Porque se tiene más tiempo', 'Porque desconecta las señales que disparaban los hábitos viejos', 'Porque cambia la personalidad'], ok: 1, fb: 'Hipótesis de la discontinuidad del hábito (Verplanken y Roy, 2016).' }
    ], { id: 'habitos', shuffle: true });
  });
})();
