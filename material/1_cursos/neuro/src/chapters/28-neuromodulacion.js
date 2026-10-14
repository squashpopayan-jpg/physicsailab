/* Capítulo 28 — Neuromodulación y neurofeedback */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, T = L.ter, E = L.ev;

  /* ======================================================================
     28.1 Quién evalúa importa: calificaciones no ciegas (padres) frente a probablemente ciegas (maestros)
     Cada ensayo se analiza dos veces con los mismos participantes simulados; solo cambia el sesgo del evaluador.
     ====================================================================== */
  RC.defineSim('evaluadores', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Gráfico de bosque: efecto de ensayos simulados según el evaluador' });
    sim.group('El tratamiento');
    sim.slider('ef', { label: 'Efecto real (d)', min: 0, max: 0.8, step: 0.05, value: 0.05, fmt: (v) => RC.nf(v, 2) });
    sim.slider('plac', { label: 'Efecto placebo', min: 0, max: 0.5, step: 0.05, value: 0.1, fmt: (v) => RC.nf(v, 2) });
    sim.check('sim', { label: 'Control con tratamiento simulado (en vez de lista de espera)', value: false });
    sim.group('Los evaluadores');
    sim.slider('sesgo', { label: 'Sesgo de quien sabe qué recibió el niño', min: 0, max: 0.6, step: 0.05, value: 0.4, fmt: (v) => RC.nf(v, 2) });
    sim.slider('k', { label: 'Número de ensayos', min: 4, max: 20, step: 1, value: 10, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otra literatura', () => { seed++; }, { id: 'otra' });
    sim.out('np', 'Combinado: evaluador no ciego (padres)', { hl: true });
    sim.out('cg', 'Combinado: evaluador ciego (maestros)');
    sim.out('real', 'Efecto real');
    sim.onDraw(() => {
      const k = sim.p.k, A = [], B = [];
      for (let i = 0; i < k; i++) {
        const n = 15 + ((i * 7 + seed * 3) % 30);
        const base = { n, natural: 0.3, placebo: sim.p.plac, efecto: sim.p.ef, sesgo: sim.p.sesgo, simulado: sim.p.sim, seed: seed * 101 + i * 13 };
        A.push(T.blindTrial(Object.assign({}, base, { ciego: false })));
        B.push(T.blindTrial(Object.assign({}, base, { ciego: true })));
      }
      const pool = (R) => E.metaDL(R.map((r) => r.d), R.map((r) => ((r.hi - r.lo) / 3.92) ** 2));
      const mA = pool(A), mB = pool(B);
      RC.draw.clear(cv);
      const rows = k + 2;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1, xmax: 2, ymin: 0, ymax: rows + 0.5, yticks: [], xlabel: 'tamaño del efecto (d)', ml: 90 });
      pl.frame();
      pl.vline(0, { color: '--ink-3', dash: [] });
      pl.vline(sim.p.ef, { color: '--gain', width: 1.8, label: 'real', labelY: 12 });
      const ctx = cv.ctx;
      for (let i = 0; i < k; i++) {
        const y = rows - i;
        [[A[i], 0.14, '--c2'], [B[i], -0.14, '--c1']].forEach(([r, dy, c]) => {
          pl.xy([r.lo, r.hi], [y + dy, y + dy], { color: c, width: 1.4 });
          pl.dot(r.d, y + dy, { r: 3, color: c });
        });
        RC.text(ctx, 'ensayo ' + (i + 1), pl.ix - 8, pl.Y(y), { size: 11, align: 'right', baseline: 'middle', color: '--ink-2' });
      }
      [[mA, 1.2, '--c2', 'padres'], [mB, 0.6, '--c1', 'maestros']].forEach(([m, y, c, lab]) => {
        const pts = [[m.lo, y], [m.mu, y + 0.2], [m.hi, y], [m.mu, y - 0.2], [m.lo, y]];
        ctx.beginPath(); pts.forEach(([x, yy], j) => (j ? ctx.lineTo(pl.X(x), pl.Y(yy)) : ctx.moveTo(pl.X(x), pl.Y(yy))));
        ctx.fillStyle = RC.col(c); ctx.fill();
        RC.text(ctx, lab, pl.ix - 8, pl.Y(y), { size: 11, align: 'right', baseline: 'middle', color: '--ink', weight: 700 });
      });
      pl.legend([{ label: 'evaluador no ciego', color: '--c2', kind: 'dot' }, { label: 'evaluador ciego', color: '--c1', kind: 'dot' }], 'tr');
      const f = (m) => `${RC.nf(m.mu, 2)} [${RC.nf(m.lo, 2)}; ${RC.nf(m.hi, 2)}]`;
      sim.set('np', f(mA));
      sim.set('cg', f(mB));
      sim.set('real', RC.nf(sim.p.ef, 2));
    });
  });

  RC.defineSim('quiz-neuromodulacion', function (sim) {
    RC.quiz(sim, [
      { q: 'La estimulación magnética transcraneal repetitiva para la depresión…', opts: ['No tiene evidencia', 'Es más eficaz que la estimulación simulada en ensayos controlados y está aprobada en muchos países', 'Cura cualquier trastorno'], ok: 1, fb: 'Es una de las neuromodulaciones con mejor evidencia, sobre todo en depresión resistente.' },
      { q: 'En personas sanas, una sesión de estimulación transcraneal por corriente directa (tDCS)…', opts: ['Mejora mucho la memoria', 'No mostró efectos cognitivos fiables en una revisión cuantitativa', 'Duplica la fuerza'], ok: 1, fb: 'Horvath y otros (2015). Además, buena parte de la corriente no llega al cerebro.' },
      { q: 'En los metaanálisis del neurofeedback para el TDAH, el efecto…', opts: ['Es igual con cualquier evaluador', 'Aparece con las calificaciones de los padres, que saben qué recibió el niño, y no con evaluadores probablemente ciegos', 'Es mayor con evaluadores ciegos'], ok: 1, fb: 'Cortese y otros (2016).' },
      { q: 'La estimulación cerebral profunda tiene evidencia sólida en…', opts: ['Ansiedad leve', 'Enfermedad de Parkinson avanzada y temblor', 'Mejorar la inteligencia'], ok: 1, fb: 'En depresión resistente, el ensayo BROADEN con control simulado fue negativo.' },
      { q: '¿Por qué los ensayos de neuromodulación necesitan estimulación simulada?', opts: ['Por costumbre', 'Porque la experiencia de recibir un tratamiento tecnológico produce expectativas y efectos placebo grandes', 'Para ahorrar dinero'], ok: 1, fb: 'Sin control simulado y evaluación ciega, el efecto se sobrestima.' }
    ], { id: 'neuromodulacion', shuffle: true });
  });
})();
