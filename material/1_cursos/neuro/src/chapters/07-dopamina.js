/* Capítulo 7 — Recompensa, dopamina y aprendizaje por refuerzo */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, A = L.learn;

  /* ======================================================================
     7.1 Rescorla-Wagner: adquisición, bloqueo y extinción
     ====================================================================== */
  RC.defineSim('rw', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Fuerza asociativa de las señales A y B a lo largo de los ensayos' });
    sim.group('Fases');
    sim.slider('f1', { label: 'Fase 1: A → recompensa (ensayos)', min: 0, max: 60, step: 1, value: 30, fmt: (v) => RC.nf(v) });
    sim.slider('f2', { label: 'Fase 2: A + B → recompensa', min: 5, max: 60, step: 1, value: 30, fmt: (v) => RC.nf(v) });
    sim.check('ext', { label: 'Fase 3: A sola, sin recompensa', value: false });
    sim.slider('ab', { label: 'Tasa de aprendizaje αβ', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: (v) => RC.nf(v, 2) });
    sim.out('va', 'Valor final de A');
    sim.out('vb', 'Valor de B al final de la fase 2', { hl: true });
    sim.out('ctl', 'B sin fase 1 (control)');
    sim.onDraw(() => {
      const tr = [];
      for (let i = 0; i < sim.p.f1; i++) tr.push({ cues: ['A'], r: 1 });
      for (let i = 0; i < sim.p.f2; i++) tr.push({ cues: ['A', 'B'], r: 1 });
      const n3 = sim.p.ext ? 40 : 0;
      for (let i = 0; i < n3; i++) tr.push({ cues: ['A'], r: 0 });
      const h = A.rw(tr, { beta: sim.p.ab });
      const ctl = A.rw(Array.from({ length: sim.p.f2 }, () => ({ cues: ['A', 'B'], r: 1 })), { beta: sim.p.ab });
      const N = tr.length;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(10, N), ymin: 0, ymax: 1.05, xlabel: 'ensayo', ylabel: 'fuerza asociativa V' });
      pl.frame();
      pl.band(0, sim.p.f1, { color: '--c1', alpha: 0.06 });
      pl.band(sim.p.f1, sim.p.f1 + sim.p.f2, { color: '--c3', alpha: 0.07 });
      if (n3) pl.band(sim.p.f1 + sim.p.f2, N, { color: '--c2', alpha: 0.06 });
      const xs = h.map((_, i) => i + 1);
      pl.xy([0].concat(xs), [0].concat(h.map((x) => x.A || 0)), { color: '--c1', width: 2.4 });
      pl.xy([0].concat(xs), [0].concat(h.map((x) => x.B || 0)), { color: '--c3', width: 2.4 });
      pl.legend([{ label: 'señal A', color: '--c1' }, { label: 'señal B', color: '--c3' }], 'tr');
      const vB2 = sim.p.f1 + sim.p.f2 > 0 ? h[sim.p.f1 + sim.p.f2 - 1].B || 0 : 0;
      sim.set('va', RC.nf(h[N - 1].A || 0, 3));
      sim.set('vb', RC.nf(vB2, 3) + (vB2 < 0.1 && sim.p.f1 > 10 ? ' <span class="loss">bloqueada</span>' : ''));
      sim.set('ctl', RC.nf(ctl[ctl.length - 1].B, 3));
    });
  });

  /* ======================================================================
     7.2 Persistencia tras recompensas intermitentes (detección de cambio bayesiana)
     ====================================================================== */
  RC.defineSim('persistencia', function (sim) {
    sim.cols2();
    const ck = sim.canvas({ aspect: 1.1, label: 'Probabilidad de que las reglas hayan cambiado según los fracasos seguidos' });
    const cp = sim.canvas({ aspect: 1.1, label: 'Fracasos necesarios para rendirse según la probabilidad de recompensa aprendida' });
    sim.group('Historia de recompensas');
    sim.slider('p', { label: 'Probabilidad de recompensa durante el aprendizaje', min: 0.05, max: 1, step: 0.01, value: 0.3, fmt: (v) => RC.pct(v, 0) });
    sim.slider('pri', { label: 'Probabilidad previa de que las reglas cambien', min: 0.01, max: 0.3, step: 0.01, value: 0.05, fmt: (v) => RC.pct(v, 0) });
    sim.out('k', 'Fracasos seguidos antes de rendirse', { hl: true });
    const post = (k, p, pri) => (p >= 1 ? (k > 0 ? 1 : pri) : pri / (pri + (1 - pri) * Math.pow(1 - p, k)));
    const kNec = (p, pri) => { for (let k = 0; k < 5000; k++) if (post(k, p, pri) > 0.95) return k; return Infinity; };
    sim.onDraw(() => {
      const p = sim.p.p, pri = sim.p.pri, k = kNec(p, pri);
      RC.draw.clear(ck);
      const K = Math.max(10, Math.min(200, k * 1.6));
      const pk = new RC.Plot(ck.ctx, { x: 0, y: 0, w: ck.w, h: ck.h, xmin: 0, xmax: K, ymin: 0, ymax: 1, xlabel: 'fracasos seguidos', ylabel: 'P(las reglas cambiaron)', yfmt: RC.pctAxis, title: 'evidencia acumulada' });
      pk.frame();
      pk.hline(0.95, { color: '--c2', label: 'se rinde', labelRight: true });
      const xs = [], ys = [];
      for (let i = 0; i <= K; i++) { xs.push(i); ys.push(post(i, p, pri)); }
      pk.xy(xs, ys, { color: '--c1', width: 2.4 });
      if (isFinite(k)) pk.dot(k, post(k, p, pri), { color: '--c2', r: 6 });
      RC.draw.clear(cp);
      const pp = new RC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.05, xmax: 1, ymin: 0, ymax: 120, xlabel: 'probabilidad de recompensa aprendida', ylabel: 'fracasos antes de rendirse', xfmt: RC.pctAxis, title: 'efecto de reforzamiento parcial' });
      pp.frame();
      const xs2 = [], ys2 = [];
      for (let q = 0.05; q <= 1.0001; q += 0.005) { xs2.push(q); ys2.push(Math.min(120, kNec(Math.min(q, 1), pri))); }
      pp.xy(xs2, ys2, { color: '--c1', width: 2.4 });
      if (isFinite(k)) pp.dot(p, Math.min(120, k), { color: '--c2', r: 6 });
      sim.set('k', isFinite(k) ? RC.nf(k) : '—');
    });
  });

  /* ======================================================================
     7.3 Diferencias temporales: el error de predicción migra a la señal
     ====================================================================== */
  RC.defineSim('td', function (sim) {
    const ch = sim.canvas({ aspect: 2.1, label: 'Mapa de calor del error de predicción por momento y por ensayo' });
    const cl = sim.canvas({ aspect: 3.0, label: 'Error de predicción en el primer ensayo, el último y uno con la recompensa omitida' });
    sim.group('Aprendizaje');
    sim.slider('n', { label: 'Ensayos', min: 20, max: 400, step: 10, value: 200, fmt: (v) => RC.nf(v) });
    sim.slider('a', { label: 'Tasa de aprendizaje α', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: (v) => RC.nf(v, 2) });
    sim.slider('p', { label: 'Probabilidad de recompensa', min: 0.1, max: 1, step: 0.05, value: 1, fmt: (v) => RC.pct(v, 0) });
    sim.out('dc', 'Respuesta a la señal (último ensayo)');
    sim.out('dr', 'Respuesta a la recompensa recibida', { hl: true });
    sim.out('do', 'Respuesta si se omite');
    sim.onDraw(() => {
      const nT = sim.p.n, T = 25, tc = 5, tr = 15;
      const r = A.tdRun({ trials: nT, alpha: sim.p.a, prob: sim.p.p < 1 ? sim.p.p : undefined, seed: 7 });
      const w = r.w;
      /* ensayos de prueba sin aprendizaje */
      const g = 0.98, V = (t) => (t >= tc && t <= T ? w[t - tc] : 0);
      const prueba = (rew) => Array.from({ length: T }, (_, t) => (t === tr ? rew : 0) + g * V(t + 1) - V(t));
      const dOk = prueba(1), dOm = prueba(0);
      RC.draw.clear(ch);
      const ctx = ch.ctx, pl = new RC.Plot(ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: T, ymin: nT, ymax: 0, yticks: [0, Math.round(nT / 4), Math.round(nT / 2), Math.round((3 * nT) / 4), nT], xlabel: 'momento dentro del ensayo', ylabel: 'ensayo' });
      const cw = pl.iw / T, chh = pl.ih / nT;
      for (let n = 0; n < nT; n++) for (let t = 0; t < T; t++) {
        const v = r.deltas[n][t];
        const c = RC.cmap.diverging(Math.max(-1, Math.min(1, v)));
        ctx.fillStyle = RC.rgbStr(c);
        ctx.fillRect(pl.ix + t * cw, pl.iy + n * chh, cw + 0.6, chh + 0.6);
      }
      pl.frame();
      pl.vline(tc - 0.5, { color: '--ink-2', label: 'señal', labelY: 12 });
      pl.vline(tr + 0.5, { color: '--ink-2', label: 'recompensa', labelY: 12 });
      RC.draw.clear(cl);
      const pb = new RC.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: T, ymin: -1.1, ymax: 1.1, xlabel: 'momento', ylabel: 'δ', mt: 8 });
      pb.frame();
      const xs = Array.from({ length: T }, (_, t) => t + 0.5);
      pb.xy(xs, Array.from(r.deltas[0]), { color: '--c6', width: 2 });
      pb.xy(xs, dOk, { color: '--c1', width: 2.4 });
      pb.xy(xs, dOm, { color: '--c2', width: 2, dash: [5, 4] });
      pb.legend([{ label: 'primer ensayo', color: '--c6' }, { label: 'tras aprender, con recompensa', color: '--c1' }, { label: 'tras aprender, omitida', color: '--c2', dash: [5, 4] }], 'bl');
      sim.set('dc', RC.nf(dOk[tc - 1], 3));
      sim.set('dr', RC.nf(dOk[tr], 3));
      sim.set('do', RC.nf(dOm[tr], 3));
    });
  });

  RC.defineSim('quiz-dopamina', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué explica el bloqueo de Kamin?', opts: ['Que la señal B se presentó pocas veces', 'Que la recompensa ya estaba predicha por A y no hubo error de predicción que aprender', 'Que B era menos visible'], ok: 1, fb: 'En Rescorla-Wagner el aprendizaje es proporcional a la sorpresa.' },
      { q: 'Tras el aprendizaje, las neuronas de dopamina responden…', opts: ['A la recompensa', 'A la señal que anuncia la recompensa', 'A nada'], ok: 1, fb: 'La respuesta migra a la señal; si la recompensa se omite, hay una pausa en el momento esperado.' },
      { q: '¿Qué conducta resiste más cuando dejan de llegar los premios?', opts: ['La que se premiaba siempre', 'La que se premiaba de vez en cuando', 'Ambas igual'], ok: 1, fb: 'Efecto de reforzamiento parcial: con premios raros, muchos fracasos seguidos son normales.' },
      { q: 'La señal de dopamina se describe mejor como…', opts: ['Placer', 'Mejor o peor de lo esperado', 'Dolor'], ok: 1, fb: 'Es un error de predicción con signo.' },
      { q: 'Para facilitar un hábito saludable conviene…', opts: ['Esperar el beneficio a largo plazo', 'Asociarlo a una recompensa inmediata y controlar las señales de las tentaciones', 'Hacer un ayuno de dopamina'], ok: 1, fb: 'El refuerzo depende del momento, y las señales disparan el «querer».' }
    ], { id: 'dopamina', shuffle: true });
  });
})();
