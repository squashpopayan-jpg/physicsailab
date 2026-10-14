/* Capítulo 19 — Aprendizaje motor */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, D = L.dep;

  /* ======================================================================
     19.1 Adaptación con dos procesos
     ====================================================================== */
  RC.defineSim('adaptacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Salida motora y procesos rápido y lento durante adaptación, desadaptación y pinza de error' });
    sim.group('Protocolo');
    sim.slider('nA', { label: 'Ensayos de adaptación (fase A)', min: 20, max: 400, step: 10, value: 200, fmt: (v) => RC.nf(v) });
    sim.slider('nC', { label: 'Ensayos sin error (fase C)', min: 20, max: 200, step: 10, value: 100, fmt: (v) => RC.nf(v) });
    sim.group('Procesos');
    sim.slider('Ar', { label: 'Retención del rápido A_r', min: 0.6, max: 0.98, step: 0.01, value: 0.92, fmt: (v) => RC.nf(v, 2) });
    sim.slider('Al', { label: 'Retención del lento A_l', min: 0.98, max: 0.9995, step: 0.0005, value: 0.996, fmt: (v) => RC.nf(v, 4) });
    sim.out('fin', 'Salida al final de la adaptación');
    sim.out('nb', 'Ensayos de la fase B hasta volver a cero');
    sim.out('rec', 'Recuperación espontánea máxima', { hl: true });
    sim.onDraw(() => {
      const o = { Af: sim.p.Ar, Bf: 0.1, As: sim.p.Al, Bs: 0.02 };
      const a = D.twoState(Array(sim.p.nA).fill(1), o);
      /* fase B: perturbación opuesta hasta que la salida cruza cero */
      let nB = 1;
      for (; nB < 200; nB++) {
        /* salida después de nB ensayos opuestos = valor en el ensayo siguiente */
        const r0 = D.twoState(Array(sim.p.nA).fill(1).concat(Array(nB).fill(-1), [null]), o);
        if (r0.X[r0.X.length - 1] <= 0.02) break;
      }
      const pert = D.protocolo(sim.p.nA, nB, sim.p.nC);
      const r = D.twoState(pert, o);
      const N = pert.length, xs = r.X.map((_, i) => i);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: N, ymin: -0.8, ymax: 1.05, xlabel: 'ensayo', ylabel: 'adaptación' });
      pl.frame();
      pl.band(sim.p.nA, sim.p.nA + nB, { color: '--c2', alpha: 0.1 });
      pl.band(sim.p.nA + nB, N, { color: '--c6', alpha: 0.08 });
      pl.label(4, 0.97, 'A: perturbación', { color: '--ink-2' });
      pl.label(sim.p.nA + nB + 4, 0.97, 'C: sin error', { color: '--ink-2' });
      pl.xy(xs, pert.map((f) => (f === null ? NaN : f)), { color: '--ink-3', width: 1.2, dash: [3, 3] });
      pl.xy(xs, r.Xf, { color: '--c2', width: 1.6 });
      pl.xy(xs, r.Xs, { color: '--c3', width: 1.6 });
      pl.xy(xs, r.X, { color: '--c1', width: 2.8 });
      pl.legend([{ label: 'salida (lo que se ve)', color: '--c1' }, { label: 'proceso rápido', color: '--c2' }, { label: 'proceso lento', color: '--c3' }, { label: 'perturbación', color: '--ink-3', dash: [3, 3] }], 'br');
      sim.set('fin', RC.nf(r.X[sim.p.nA - 1], 3));
      sim.set('nb', String(nB));
      sim.set('rec', RC.nf(Math.max(...r.X.slice(sim.p.nA + nB)), 3));
    });
  });

  /* ======================================================================
     19.2 Curvas exponenciales individuales y ley potencial del promedio
     ====================================================================== */
  RC.defineSim('curvas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Tiempo de ejecución por ensayo: aprendices individuales, promedio y ajustes' });
    sim.group('Grupo');
    sim.slider('sd', { label: 'Variación de la rapidez entre personas', min: 0, max: 1.5, step: 0.05, value: 0.9, fmt: (v) => RC.nf(v, 2) });
    sim.slider('n', { label: 'Aprendices', min: 5, max: 60, step: 1, value: 30, fmt: (v) => RC.nf(v) });
    sim.out('rp', 'R² del ajuste potencial al promedio', { hl: true });
    sim.out('re', 'R² del ajuste exponencial al promedio');
    sim.onDraw(() => {
      const g = D.groupCurve({ n: sim.p.n, cSd: sim.p.sd, trials: 150, seed: 31 });
      const Ns = g.mean.map((_, i) => i + 1);
      const fp = D.fit(Ns, g.mean, 'pow'), fe = D.fit(Ns, g.mean, 'exp');
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 150, ymin: 0, ymax: 9, xlabel: 'ensayo', ylabel: 'tiempo de ejecución (s)' });
      pl.frame();
      g.indiv.slice(0, 20).forEach((c) => pl.xy(Ns, c, { color: '--c6', width: 1, alpha: 0.35 }));
      pl.xy(Ns, g.mean, { color: '--ink', width: 3 });
      pl.fn((N) => D.powF(N, fp.p), { color: '--c1', width: 2, dash: [6, 4], from: 1 });
      pl.fn((N) => D.expF(N, fe.p), { color: '--c2', width: 2, dash: [2, 4], from: 1 });
      pl.legend([{ label: 'aprendices (exponenciales)', color: '--c6' }, { label: 'promedio del grupo', color: '--ink' }, { label: 'ajuste potencial', color: '--c1', dash: [6, 4] }, { label: 'ajuste exponencial', color: '--c2', dash: [2, 4] }], 'tr');
      sim.set('rp', RC.nf(fp.r2, 4));
      sim.set('re', RC.nf(fe.r2, 4));
    });
  });

  /* ======================================================================
     19.3 Interferencia contextual como espaciado
     ====================================================================== */
  RC.defineSim('interferencia', function (sim) {
    sim.cols2();
    const ca = sim.canvas({ aspect: 1.15, label: 'Desempeño durante la práctica en bloques y mezclada' });
    const cr = sim.canvas({ aspect: 1.15, label: 'Retención según el tiempo transcurrido' });
    sim.group('Sesión');
    sim.slider('n', { label: 'Repeticiones de cada golpe', min: 4, max: 30, step: 1, value: 12, fmt: (v) => RC.nf(v) });
    sim.slider('dt', { label: 'Segundos entre intentos', min: 5, max: 90, step: 5, value: 20, fmt: (v) => RC.nf(v) });
    sim.out('acq', 'Desempeño medio en la práctica (bloques / mezclada)');
    sim.out('ret1', 'Retención al día siguiente (bloques / mezclada)', { hl: true });
    sim.out('ret7', 'Retención a la semana (bloques / mezclada)');
    sim.onDraw(() => {
      const o = { nPer: sim.p.n, dt: sim.p.dt / 60 };
      const b = D.ciRun('bloq', o), m = D.ciRun('alea', o);
      RC.draw.clear(ca);
      const pa = new RC.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: 1, xmax: b.acq.length, ymin: 0, ymax: 1, xlabel: 'intento', ylabel: 'recuerdo del plan motor', yfmt: RC.pctAxis, title: 'durante la práctica' });
      pa.frame();
      pa.xy(b.acq.map((_, i) => i + 1), b.acq, { color: '--c2', width: 1.6 });
      pa.xy(m.acq.map((_, i) => i + 1), m.acq, { color: '--c1', width: 1.6 });
      pa.legend([{ label: 'en bloques', color: '--c2' }, { label: 'mezclada', color: '--c1' }], 'br');
      RC.draw.clear(cr);
      const days = L.util.linspace(0.02, 10, 120);
      const pr = new RC.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: 10, ymin: 0, ymax: 1, xlabel: 'días después', ylabel: 'retención', yfmt: RC.pctAxis, title: 'después de la práctica' });
      pr.frame();
      pr.xy(days, days.map((d) => b.ret(d * 1440)), { color: '--c2', width: 2.4 });
      pr.xy(days, days.map((d) => m.ret(d * 1440)), { color: '--c1', width: 2.4 });
      const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
      sim.set('acq', `${RC.pct(mean(b.acq), 0)} / ${RC.pct(mean(m.acq), 0)}`);
      sim.set('ret1', `${RC.pct(b.ret(1440), 0)} / ${RC.pct(m.ret(1440), 0)}`);
      sim.set('ret7', `${RC.pct(b.ret(10080), 0)} / ${RC.pct(m.ret(10080), 0)}`);
    });
  });

  RC.defineSim('quiz-motor', function (sim) {
    RC.quiz(sim, [
      { q: 'En el modelo de dos procesos, ¿por qué aparece la recuperación espontánea?', opts: ['Porque el proceso lento se refuerza solo', 'Porque el proceso rápido, que compensó la vuelta a cero, se olvida y reaparece lo que guardaba el lento', 'Por fatiga'], ok: 1, fb: 'El rápido tapaba al lento; sin errores, el rápido decae primero.' },
      { q: 'La ley potencial de la práctica en un grupo…', opts: ['Prueba que cada persona aprende de forma potencial', 'Puede surgir al promediar curvas exponenciales con rapideces distintas', 'No existe'], ok: 1, fb: 'Heathcote y otros (2000).' },
      { q: 'En deporte, ¿cuánto de las diferencias de rendimiento explica la práctica deliberada, según Macnamara y otros (2016)?', opts: ['Casi todo', 'Cerca de 18 % (y 1 % entre la élite)', 'Nada'], ok: 1, fb: 'La práctica es necesaria pero no explica todas las diferencias.' },
      { q: 'La práctica mezclada frente a la práctica en bloques suele…', opts: ['Ser mejor durante la sesión y peor después', 'Sentirse peor durante la sesión y retener mejor después', 'Dar igual'], ok: 1, fb: 'Efecto de interferencia contextual (Shea y Morgan, 1979).' },
      { q: '¿Qué pasó con la ventaja del foco de atención externo al corregir el sesgo de publicación?', opts: ['Se duplicó', 'Quedó pequeña o nula y muy variable según la tarea', 'Se confirmó intacta'], ok: 1, fb: 'McKay y otros (2024).' }
    ], { id: 'motor', shuffle: true });
  });
})();
