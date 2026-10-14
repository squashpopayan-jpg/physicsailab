/* Capítulo 26 — Apetito, cerebro y fármacos */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, En = L.en;

  /* ======================================================================
     26.1 El apetito que contrarresta la pérdida (Polidori y otros, 2016) dentro del modelo de Hall.
     Ingesta = gasto inicial − esfuerzo(t) + k·(kg perdidos), con retardo τ en días; el esfuerzo de la dieta
     decae exponencialmente, como en las trayectorias analizadas por Hall y Kahan (2018).
     ====================================================================== */
  RC.defineSim('apetito', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Peso a lo largo de dos años con y sin retroalimentación del apetito' });
    sim.group('Plan');
    sim.slider('red', { label: 'Reducción de la ingesta al inicio (kcal/día)', min: 100, max: 1000, step: 25, value: 800, fmt: (v) => RC.nf(v) });
    sim.slider('adh', { label: 'Vida media del esfuerzo de la dieta (meses)', min: 2, max: 60, step: 1, value: 8, fmt: (v) => RC.nf(v) });
    sim.group('Retroalimentación del apetito');
    sim.slider('k', { label: 'Aumento del apetito por kilo perdido (kcal/día)', min: 0, max: 150, step: 5, value: 100, fmt: (v) => RC.nf(v) });
    sim.slider('tau', { label: 'Retardo (días)', min: 3, max: 60, step: 1, value: 14, fmt: (v) => RC.nf(v) });
    sim.out('p0', 'Pérdida a 2 años sin retroalimentación');
    sim.out('p1', 'Pérdida a 2 años con retroalimentación', { hl: true });
    sim.out('max', 'Pérdida máxima y día');
    sim.out('ap', 'Apetito extra al final');
    sim.onDraw(() => {
      const o = { sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, D = 730;
      const esfuerzo = (t) => sim.p.red * Math.pow(0.5, t / (sim.p.adh * 30.4));
      const fb = (k) => {
        let extra = 0, dia = -1;
        return (t, s, bw) => {
          const d = Math.floor(t);
          if (d !== dia) { dia = d; extra += (k * Math.max(0, 95 - bw) - extra) / sim.p.tau; }
          return { kcal: s.EI0 / En.KJ - esfuerzo(t) + extra };
        };
      };
      const r0 = En.hallSim(o, fb(0), D, 0.5), r1 = En.hallSim(o, fb(sim.p.k), D, 0.5);
      let iMin = 0; r1.BW.forEach((v, i) => { if (v < r1.BW[iMin]) iMin = i; });
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: D, ymin: Math.floor(Math.min(...r0.BW) - 1), ymax: 96, xlabel: 'días', ylabel: 'peso (kg)' });
      pl.frame();
      pl.xy(r0.t, r0.BW, { color: '--ink-3', width: 2, dash: [6, 4] });
      pl.xy(r1.t, r1.BW, { color: '--c1', width: 2.8 });
      if (iMin > 0 && iMin < D) pl.dot(iMin, r1.BW[iMin], { color: '--c1', label: `día ${iMin}` });
      pl.legend([{ label: 'sin aumento del apetito', color: '--ink-3', dash: [6, 4] }, { label: 'con aumento del apetito', color: '--c1' }], 'tr');
      sim.set('p0', RC.nf(95 - r0.BW[D], 1) + ' kg');
      sim.set('p1', RC.nf(95 - r1.BW[D], 1) + ' kg');
      sim.set('max', RC.nf(95 - r1.BW[iMin], 1) + ' kg, día ' + iMin);
      sim.set('ap', RC.nf(r1.EI[D] - (r1.s.EI0 / En.KJ - esfuerzo(D)), 0) + ' kcal/día');
    });
  });

  /* ======================================================================
     26.2 Resultados de los grandes ensayos de fármacos (cambio medio de peso)
     ====================================================================== */
  const ENS = [
    ['STEP 1 · semaglutida 2,4 mg · 68 semanas', -14.9, -2.4],
    ['SURMOUNT-1 · tirzepatida 15 mg · 72 semanas', -20.9, -3.1],
    ['STEP 1, extensión · un año después de suspender', -5.6, -0.1]
  ];
  RC.defineSim('farmacos', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, label: 'Cambio medio de peso con fármaco y con placebo en ensayos de semaglutida y tirzepatida' });
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const n = ENS.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -24, xmax: 0, ymin: 0, ymax: n, yticks: [], xlabel: 'cambio medio del peso corporal (%)', ml: Math.min(320, cv.w * 0.47), xfmt: (v) => RC.nf(v, 0) + ' %' });
      pl.frame();
      ENS.forEach(([name, f, p], i) => {
        const y = n - i - 0.5, ctx = cv.ctx;
        ctx.fillStyle = RC.alpha('--c1', 0.85);
        ctx.fillRect(pl.X(f), pl.Y(y + 0.36), pl.X(0) - pl.X(f), pl.Y(y + 0.02) - pl.Y(y + 0.36));
        ctx.fillStyle = RC.alpha('--ink-3', 0.6);
        ctx.fillRect(pl.X(p), pl.Y(y - 0.02), pl.X(0) - pl.X(p), pl.Y(y - 0.36) - pl.Y(y - 0.02));
        RC.text(ctx, name, pl.ix - 8, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink' });
        RC.text(ctx, RC.nf(f, 1) + ' %', pl.X(f) - 6, pl.Y(y + 0.19), { size: 11, align: 'right', baseline: 'middle', color: '--ink-2', mono: true });
        RC.text(ctx, RC.nf(p, 1) + ' %', pl.X(p) - 6, pl.Y(y - 0.19), { size: 11, align: 'right', baseline: 'middle', color: '--ink-2', mono: true });
      });
      pl.legend([{ label: 'fármaco', color: '--c1', kind: 'sq' }, { label: 'placebo', color: '--ink-3', kind: 'sq' }], 'bl');
    });
  });

  RC.defineSim('quiz-apetito', function (sim) {
    RC.quiz(sim, [
      { q: 'Según Polidori y otros (2016), por cada kilo perdido el apetito aumenta…', opts: ['Nada', 'Alrededor de 100 kcal/día, unas tres veces más que la reducción del gasto', '1 000 kcal/día'], ok: 1, fb: 'Por eso el apetito pesa más que el «metabolismo lento» en la meseta y la recuperación.' },
      { q: 'La leptina…', opts: ['Es una hormona del tejido graso que informa al hipotálamo sobre las reservas; su caída tras adelgazar aumenta el hambre', 'Es una enzima que quema grasa', 'Se toma como suplemento para adelgazar'], ok: 0, fb: 'Dar leptina solo funciona en la deficiencia congénita, muy rara.' },
      { q: 'Los agonistas del receptor de GLP-1 hacen perder peso principalmente porque…', opts: ['Aumentan mucho el gasto', 'Reducen el apetito y la ingesta, actuando en el cerebro y retrasando el vaciamiento gástrico', 'Impiden absorber la grasa'], ok: 1, fb: 'Actúan sobre el tronco encefálico y el hipotálamo.' },
      { q: 'Un año después de suspender la semaglutida en STEP 1, los participantes…', opts: ['Mantuvieron todo lo perdido', 'Recuperaron cerca de dos tercios de lo perdido', 'Siguieron bajando'], ok: 1, fb: 'Wilding y otros (2022).' },
      { q: 'Dormir poco, según un metaanálisis de estudios experimentales…', opts: ['No cambia la ingesta', 'Aumenta la ingesta en unas 250 a 400 kcal/día', 'Reduce el apetito'], ok: 1, fb: 'Al Khatib y otros (2017): unas 385 kcal/día más.' }
    ], { id: 'apetito', shuffle: true });
  });
})();
