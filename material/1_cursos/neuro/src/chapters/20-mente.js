/* Capítulo 20 — Entrenamiento mental del deportista */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  /* ======================================================================
     20.1 Ojo quieto: efectos del metaanálisis de Lebeau y otros (2016)
     ====================================================================== */
  const QE = [
    ['Duración del ojo quieto: expertos frente a novatos', 1.04, 'asoc'],
    ['Duración: intentos exitosos frente a fallidos', 0.58, 'asoc'],
    ['Entrenamiento: cambio en la duración del ojo quieto', 1.53, 'ent'],
    ['Entrenamiento: cambio en el rendimiento', 0.84, 'ent']
  ];
  RC.defineSim('ojoquieto', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Tamaños del efecto del metaanálisis del ojo quieto' });
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const n = QE.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.8, ymin: 0, ymax: n, yticks: [], xlabel: 'tamaño del efecto (d)', ml: Math.min(320, cv.w * 0.48) });
      pl.frame();
      QE.forEach(([name, d, k], i) => {
        const y = n - i - 0.5, ctx = cv.ctx;
        ctx.fillStyle = RC.alpha(k === 'asoc' ? '--c4' : '--c3', 0.85);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.3), pl.X(d) - pl.X(0), pl.Y(y - 0.3) - pl.Y(y + 0.3));
        RC.text(ctx, name, pl.ix - 8, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink' });
        RC.text(ctx, RC.nf(d, 2), pl.X(d) + 6, pl.Y(y), { size: 11.5, baseline: 'middle', color: '--ink-2', mono: true });
      });
      pl.legend([{ label: 'comparaciones (asociación)', color: '--c4', kind: 'sq' }, { label: 'estudios de entrenamiento (9 artículos)', color: '--c3', kind: 'sq' }], 'br');
    });
  });

  /* ======================================================================
     20.2 Presión y atención en novatos y expertos (patrón de Beilock y otros, 2002)
     Rendimiento = base(nivel) + efecto(condición, nivel) − presión·monitoreo(nivel)·(1 − entrenado).
     Magnitudes ilustrativas.
     ====================================================================== */
  RC.defineSim('presion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Porcentaje de aciertos de novatos y expertos según la condición de atención' });
    sim.group('Situación');
    sim.slider('pr', { label: 'Presión del momento', min: 0, max: 1, step: 0.05, value: 0, fmt: (v) => RC.pct(v, 0) });
    sim.check('ent', { label: 'Entrenó antes bajo presión', value: false });
    sim.out('exp', 'Experto: técnica / distracción', { hl: true });
    sim.out('nov', 'Novato: técnica / distracción');
    sim.onDraw(() => {
      const pr = sim.p.pr, k = sim.p.ent ? 0.4 : 1;
      /* aciertos base (%) */
      const val = {
        exp: { tec: 72, dis: 84, nor: 83 },
        nov: { tec: 58, dis: 47, nor: 52 }
      };
      /* la presión induce monitoreo: daña al experto en las condiciones normal y técnica; poco al novato */
      const res = {};
      for (const g of ['exp', 'nov']) {
        res[g] = {};
        for (const c of ['nor', 'tec', 'dis']) {
          const dano = g === 'exp' ? (c === 'dis' ? 3 : 14) : (c === 'dis' ? 4 : 5);
          res[g][c] = Math.max(0, val[g][c] - pr * dano * k);
        }
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 7.5, ymin: 0, ymax: 100, xticks: [1.5, 5.5], xfmt: (v) => (v < 3 ? 'novatos' : 'expertos'), ylabel: 'aciertos (%)' });
      pl.frame();
      const cols = { nor: '--c6', tec: '--c2', dis: '--c4' };
      [['nov', 0.5], ['exp', 4.5]].forEach(([g, x0]) => {
        ['nor', 'tec', 'dis'].forEach((c, i) => {
          const x = x0 + i;
          pl.bars([x], [res[g][c]], { color: cols[c], w: 0.8, labels: true, fmt: (v) => RC.nf(v, 0) });
        });
      });
      pl.legend([{ label: 'sin consigna', color: '--c6', kind: 'sq' }, { label: 'atender a la técnica', color: '--c2', kind: 'sq' }, { label: 'tarea distractora', color: '--c4', kind: 'sq' }], 'tl');
      sim.set('exp', `${RC.nf(res.exp.tec, 0)} % / ${RC.nf(res.exp.dis, 0)} %`);
      sim.set('nov', `${RC.nf(res.nov.tec, 0)} % / ${RC.nf(res.nov.dis, 0)} %`);
    });
  });

  RC.defineSim('quiz-mente', function (sim) {
    RC.quiz(sim, [
      { q: 'Según PETTLEP, la imaginería funciona mejor si…', opts: ['Se hace acostado y relajado en cámara lenta', 'Se parece a la ejecución real: postura, lugar, ritmo y emoción', 'Se imagina a un profesional'], ok: 1, fb: 'Cuanto más parecida a la ejecución real, mejor.' },
      { q: 'La hipótesis del monitoreo explícito explica que el experto se ahoga porque…', opts: ['Se distrae', 'Presta atención consciente a pasos que ya eran automáticos', 'Se cansa'], ok: 1, fb: 'Beilock y Carr (2001).' },
      { q: 'Para un novato que aprende un golpe, atender a la técnica…', opts: ['Ayuda', 'Perjudica siempre', 'No importa'], ok: 0, fb: 'Los novatos de Beilock rendían mejor atendiendo a la técnica.' },
      { q: 'El estudio original de Yerkes y Dodson (1908)…', opts: ['Midió ansiedad y rendimiento en atletas', 'Estudió ratones que aprendían una discriminación con descargas eléctricas', 'Demostró la U invertida universal'], ok: 1, fb: 'La U invertida popular es una reinterpretación posterior (Teigen, 1994).' },
      { q: '¿Qué ayuda a rendir bajo presión según la evidencia?', opts: ['Evitar toda presión en los entrenamientos', 'Entrenar con presión moderada y usar una rutina con palabras clave de objetivo', 'Pensar en cada detalle técnico'], ok: 1, fb: 'Oudejans y Pijpers (2009).' }
    ], { id: 'mente', shuffle: true });
  });
})();
