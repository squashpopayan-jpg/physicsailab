/* Capítulo 17 — Autocontrol, estrés y recaídas */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  /* ======================================================================
     17.1 Descuento hiperbólico frente a exponencial: inversión de preferencias
     ====================================================================== */
  RC.defineSim('descuento', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Valor percibido de una recompensa pequeña temprana y una grande tardía según el momento' });
    sim.group('Recompensas');
    sim.slider('As', { label: 'Recompensa pequeña (valor)', min: 10, max: 90, step: 5, value: 60, fmt: (v) => RC.nf(v) });
    sim.slider('Al', { label: 'Recompensa grande (valor)', min: 50, max: 200, step: 5, value: 100, fmt: (v) => RC.nf(v) });
    sim.slider('gap', { label: 'Días entre ambas', min: 1, max: 30, step: 1, value: 9, fmt: (v) => RC.nf(v) });
    sim.group('Cómo descuenta la persona');
    sim.seg('tipo', { options: [['hip', 'Hiperbólico'], ['exp', 'Exponencial']], value: 'hip' });
    sim.slider('k', { label: 'Impaciencia k (por día)', min: 0.05, max: 2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    sim.out('cruce', 'Momento en que la preferencia se invierte', { hl: true });
    sim.out('hoy', 'Elección justo antes de la pequeña');
    sim.onDraw(() => {
      const tS = 30, tL = tS + sim.p.gap, k = sim.p.k, hip = sim.p.tipo === 'hip';
      const V = (A, D) => (D < 0 ? NaN : hip ? A / (1 + k * D) : A * Math.exp(-k * 0.35 * D));
      RC.draw.clear(cv);
      const xs = [], vs = [], vl = [];
      for (let t = 0; t <= tS; t += 0.1) { xs.push(t); vs.push(V(sim.p.As, tS - t)); vl.push(V(sim.p.Al, tL - t)); }
      const ymax = Math.max(sim.p.As, sim.p.Al) * 1.08;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tL + 1, ymin: 0, ymax, xlabel: 'día en que se decide', ylabel: 'valor percibido' });
      pl.frame();
      pl.xy(xs, vs, { color: '--c2', width: 2.6 });
      pl.xy(xs.concat([tS + 0.001]), vl.concat([V(sim.p.Al, tL - tS)]), { color: '--c3', width: 2.6 });
      pl.vline(tS, { color: '--c2', label: 'pequeña disponible', labelY: 14 });
      pl.vline(tL, { color: '--c3', label: 'grande', labelY: 30 });
      let cruce = null;
      for (let i = 1; i < xs.length; i++) if ((vs[i - 1] - vl[i - 1]) * (vs[i] - vl[i]) < 0) { cruce = xs[i]; break; }
      if (cruce !== null) pl.vline(cruce, { color: '--ink', dash: [], label: 'se invierte', labelY: 46 });
      pl.legend([{ label: 'pequeña y temprana', color: '--c2' }, { label: 'grande y tardía', color: '--c3' }], 'tl');
      sim.set('cruce', cruce !== null ? `${RC.nf(tS - cruce, 1)} días antes de la pequeña` : 'nunca: la preferencia es estable');
      const ultimo = vs[vs.length - 1] > vl[vl.length - 1];
      sim.set('hoy', ultimo ? '<span class="loss">la pequeña</span>' : '<span class="gain">la grande</span>');
    });
  });

  /* ======================================================================
     17.2 Estrés: hábito viejo frente a conducta nueva (modelo didáctico)
     P(nueva) = σ( βg·(Q_nueva − Q_vieja) + βh·(H_nueva − H_vieja) ), con βg reducido por el estrés.
     ====================================================================== */
  RC.defineSim('estres', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Probabilidad de elegir la conducta nueva en días normales y de estrés a lo largo de las semanas' });
    sim.group('Situación');
    sim.slider('old', { label: 'Fuerza inicial del hábito viejo', min: 0.3, max: 1, step: 0.05, value: 0.8, fmt: (v) => RC.pct(v, 0) });
    sim.slider('st', { label: 'Cuánto reduce el estrés el control dirigido a metas', min: 0, max: 0.95, step: 0.05, value: 0.7, fmt: (v) => RC.pct(v, 0) });
    sim.slider('fs', { label: 'Días de estrés por semana', min: 0, max: 7, step: 1, value: 2, fmt: (v) => RC.nf(v) });
    sim.out('norm', 'Semana 12, día normal', { hl: true });
    sim.out('estr', 'Semana 12, día de estrés');
    sim.onDraw(() => {
      const bg = 4, bh = 5, Qn = 0.8, Qv = 0.4, aH = 0.03, T = 84;
      let Hn = 0, Hv = sim.p.old;
      const xs = [], pN = [], pS = [];
      const sig = (z) => 1 / (1 + Math.exp(-z));
      for (let d = 0; d < T; d++) {
        const pn = sig(bg * (Qn - Qv) + bh * (Hn - Hv)), ps = sig(bg * (1 - sim.p.st) * (Qn - Qv) + bh * (Hn - Hv));
        xs.push(d / 7); pN.push(pn); pS.push(ps);
        const estresado = (d % 7) < sim.p.fs;
        const p = estresado ? ps : pn;
        Hn += aH * (p - Hn); Hv += aH * (1 - p - Hv);
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 12, ymin: 0, ymax: 1, xlabel: 'semanas', ylabel: 'P(conducta nueva)', yfmt: RC.pctAxis });
      pl.frame();
      pl.hline(0.5, { color: '--ink-3' });
      pl.xy(xs, pN, { color: '--c3', width: 2.6 });
      pl.xy(xs, pS, { color: '--c2', width: 2.4, dash: [6, 4] });
      pl.legend([{ label: 'día normal', color: '--c3' }, { label: 'día de estrés', color: '--c2', dash: [6, 4] }], 'br');
      sim.set('norm', RC.pct(pN[T - 1], 0));
      sim.set('estr', RC.pct(pS[T - 1], 0));
    });
  });

  RC.defineSim('quiz-autocontrol', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué encontraron las réplicas de muchos laboratorios sobre el agotamiento del yo?', opts: ['Un efecto grande', 'Un efecto prácticamente nulo (d ≈ 0,04–0,06)', 'Que la glucosa lo revierte'], ok: 1, fb: 'Hagger (2016) y Vohs (2021).' },
      { q: 'Las personas con mucho autocontrol, según Hofmann y otros (2012)…', opts: ['Resisten más tentaciones', 'Reportan menos tentaciones', 'No sienten deseos'], ok: 1, fb: 'Se exponen menos: estrategias situacionales y buenos hábitos.' },
      { q: 'El descuento hiperbólico explica…', opts: ['Por qué preferimos lo grande siempre', 'Por qué la preferencia se invierte cuando la recompensa pequeña está cerca', 'Por qué olvidamos'], ok: 1, fb: 'Las curvas hiperbólicas se cruzan; las exponenciales no.' },
      { q: 'Según Schwabe y Wolf (2009), el estrés…', opts: ['Fortalece el control dirigido a metas', 'Desplaza la conducta hacia los hábitos', 'No influye'], ok: 1, fb: 'Las personas estresadas siguieron con la acción aunque el premio ya no les interesaba.' },
      { q: 'Después de un desliz en la dieta, ¿qué reduce el efecto «ya qué»?', opts: ['Castigarse', 'Tratarse con autocompasión y retomar', 'Empezar de nuevo el próximo mes'], ok: 1, fb: 'Adams y Leary (2007).' }
    ], { id: 'autocontrol', shuffle: true });
  });
})();
