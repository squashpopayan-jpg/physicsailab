/* Capítulo 1 — Epistemología */
(function () {
  'use strict';
  const EM = window.EM;

  /* 1.1 La tarea 2-4-6 de Wason */
  const RULES = [
    ['asc', 'Cualquier serie creciente (a < b < c)', (a, b, c) => a < b && b < c],
    ['par', 'La suma de los tres números es par', (a, b, c) => (a + b + c) % 2 === 0],
    ['mid', 'El número del medio es el mayor (b > a y b > c)', (a, b, c) => b > a && b > c],
    ['ar2', 'Cada número es 2 más que el anterior', (a, b, c) => b - a === 2 && c - b === 2],
    ['ar', 'Progresión aritmética (paso constante, cualquiera)', (a, b, c) => b - a === c - b],
    ['pos', 'Los tres números son positivos', (a, b, c) => a > 0 && b > 0 && c > 0]
  ];
  const HIDDEN = ['asc', 'par', 'mid', 'pos'];
  EM.defineSim('wason', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, minH: '230px' });
    sim.slider('a', { label: 'Primer número', min: -20, max: 60, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Segundo número', min: -20, max: 60, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Tercer número', min: -20, max: 60, step: 1, value: 12, fmt: (v) => v.toFixed(0) });
    sim.button('Probar la serie', () => test(), { primary: true });
    sim.select('guess', { label: 'Mi hipótesis sobre la regla', options: RULES.map((r) => [r[0], r[1]]), value: 'ar2' });
    sim.button('Declarar la regla', () => declare());
    sim.button('Otra partida', () => start(true), { where: 'head', icon: 'reset' });
    sim.out('n', 'Pruebas realizadas', { hl: true });
    sim.out('conf', 'De ellas, progresiones aritméticas');
    sim.out('res', 'Resultado');
    let game = 0, hidden, log, done, verdict;
    const start = (next) => {
      if (next) game++;
      hidden = RULES.find((r) => r[0] === HIDDEN[game % HIDDEN.length]);
      log = [[2, 4, 6, true]];
      done = false; verdict = '';
      refresh();
    };
    const test = () => {
      if (done) return;
      const { a, b, c } = sim.p;
      log.push([a, b, c, hidden[2](a, b, c)]);
      refresh();
    };
    const declare = () => {
      if (done) return;
      const g = RULES.find((r) => r[0] === sim.p.guess);
      /* La hipótesis es correcta si coincide con la regla en una rejilla de series */
      let same = true;
      for (let a = -6; a <= 14 && same; a++) for (let b = -6; b <= 14 && same; b++) for (let c = -6; c <= 14; c++) if (g[2](a, b, c) !== hidden[2](a, b, c)) { same = false; break; }
      done = true;
      verdict = same ? 'Acertó' : 'Incorrecto';
      sim.ctl.guess.input && 0;
      refresh();
    };
    const refresh = () => {
      const n = log.length - 1;
      const ar = log.slice(1).filter((l) => l[1] - l[0] === l[2] - l[1]).length;
      sim.set('n', n);
      sim.set('conf', n ? ar + ' de ' + n : '—');
      sim.set('res', done ? verdict + '. La regla era: ' + hidden[1] : 'En curso');
      sim.redraw();
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      EM.text(ctx, 'Serie de prueba', 14, 22, { size: 12, color: '--ink-3', weight: 650 });
      EM.text(ctx, '¿Cumple la regla?', W - 14, 22, { size: 12, color: '--ink-3', weight: 650, align: 'right' });
      const rows = Math.min(log.length, Math.floor((H - 40) / 22));
      const start0 = log.length - rows;
      for (let i = 0; i < rows; i++) {
        const l = log[start0 + i], y = 46 + i * 22;
        const label = start0 + i === 0 ? '2, 4, 6 (dada)' : l[0] + ',  ' + l[1] + ',  ' + l[2];
        EM.text(ctx, label, 14, y, { size: 14, mono: true, color: '--ink' });
        EM.text(ctx, l[3] ? 'Sí' : 'No', W - 14, y, { size: 14, weight: 700, align: 'right', color: l[3] ? '--c3' : '--c2' });
      }
      if (done) EM.text(ctx, verdict + (verdict === 'Acertó' ? '' : ': la regla era otra'), W / 2, H - 12, { size: 14, weight: 700, align: 'center', color: verdict === 'Acertó' ? '--c3' : '--c2' });
    });
    start(false);
  });

  /* 1.2 Bayes: predicción vaga o arriesgada */
  EM.defineSim('bayes-pred', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('prior', { label: 'Confianza inicial P(T)', min: 0.001, max: 0.95, step: 0.001, value: 0.05, fmt: (v) => (100 * v).toFixed(1) + ' %' });
    sim.slider('pt', { label: 'P(E | T): la teoría predice el dato', min: 0.05, max: 1, step: 0.01, value: 0.9, fmt: (v) => v.toFixed(2) });
    sim.slider('pn', { label: 'P(E | no T): el dato aparece aunque T sea falsa', min: 0.001, max: 1, step: 0.001, value: 0.5, log: true, fmt: (v) => v.toFixed(3) });
    sim.button('Predicción vaga', () => { sim.ctl.pn.set(0.5); });
    sim.button('Predicción arriesgada', () => { sim.ctl.pn.set(0.02); });
    sim.out('post', 'Confianza final P(T | E)', { hl: true });
    sim.out('bf', 'Factor de Bayes');
    sim.out('ev', 'Evidencia (en decibelios)');
    const post = (p) => (p.pt * p.prior) / (p.pt * p.prior + p.pn * (1 - p.prior));
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.001, xmax: 1, ymin: 0, ymax: 1, xlog: true, xlabel: 'P(E | no T)  (cuán sorprendente es el dato sin la teoría)', ylabel: 'P(T | E)' });
      pl.frame();
      pl.fn((x) => post({ prior: p.prior, pt: p.pt, pn: x }), { color: '--c1', width: 2.4 });
      pl.hline(p.prior, { color: '--ink-3', dash: [4, 4] });
      pl.label(0.0013, p.prior + 0.03, 'confianza inicial', { size: 11, color: '--ink-3' });
      const q = post(p);
      pl.dot(p.pn, q, { color: '--c2', r: 6 });
      sim.set('post', (100 * q).toFixed(1) + ' %');
      sim.set('bf', EM.fix(p.pt / p.pn, 2) + ' ×');
      sim.set('ev', EM.fix(10 * Math.log10(p.pt / p.pn), 1) + ' dB');
    });
  });
})();
