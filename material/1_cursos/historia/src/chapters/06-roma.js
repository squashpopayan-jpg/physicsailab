/* Capítulo 6 — Roma, el cierre y la transmisión */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI;

  /* 6.1 Calendarios: cuánto se desfasa cada uno del Sol */
  EM.defineSim('calendario', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('y', { label: 'Años transcurridos desde el ajuste', min: 0, max: 4000, step: 10, value: 1257, fmt: (v) => v.toFixed(0) + ' años' });
    sim.button('Nicea (325) → 1582', () => sim.ctl.y.set(1257));
    sim.out('j', 'Calendario juliano: desfase', { hl: true });
    sim.out('g', 'Calendario gregoriano: desfase');
    sim.out('e', 'Calendario egipcio (365 d): desfase');
    sim.out('r', 'Regla del año');
    sim.note('El año juliano (365.25 d) es 11 min 14 s más largo que el tropical (365.2422 d): cada 128 años el calendario se adelanta un día. En 1582 el equinoccio caía el 11 de marzo en lugar del 21. La reforma de Gregorio XIII suprimió 10 días (del 4 al 15 de octubre) y quitó 3 bisiestos cada 400 años: año medio de 365.2425 d.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 4000, ymin: -40, ymax: 40, xlabel: 'años transcurridos', ylabel: 'desfase respecto del Sol (días)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [] });
      pl.fn((x) => C.calendarDrift('juliano', x), { color: '--c2', width: 2.2, to: 4000 });
      pl.fn((x) => C.calendarDrift('gregoriano', x), { color: '--c3', width: 2.6 });
      pl.fn((x) => C.calendarDrift('egipcio', x) * 0.25 * 0 + C.calendarDrift('egipcio', x), { color: '--c1', width: 1.4, dash: [4, 4] });
      pl.vline(p.y, { color: '--accent', dash: [] });
      pl.legend([{ label: 'juliano (+11 min/año)', color: '--c2' }, { label: 'gregoriano (+26 s/año)', color: '--c3' }, { label: 'egipcio de 365 días', color: '--c1', kind: 'dash' }], 'tl');
      const f = (v) => (v > 0 ? '+' : '') + EM.fix(v, 2) + ' d';
      sim.set('j', f(C.calendarDrift('juliano', p.y)));
      sim.set('g', f(C.calendarDrift('gregoriano', p.y)));
      sim.set('e', f(C.calendarDrift('egipcio', p.y)));
      sim.set('r', 'Gregoriano: 1 día de error cada ' + EM.fix(1 / Math.abs(C.calendarDrift('gregoriano', 1)), 0) + ' años');
    });
  });

  /* 6.2 El polvo de Lucrecio: movimiento aleatorio */
  EM.defineSim('polvo', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('n', { label: 'Granos de polvo', min: 20, max: 400, step: 10, value: 150, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Tamaño del empujón por paso (σ)', min: 0.3, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) });
    sim.out('msd', 'Desplazamiento cuadrático medio', { hl: true });
    sim.out('D', 'Pendiente: MSD/(4 t)');
    sim.out('t', 'Pasos transcurridos');
    sim.note('Lucrecio (c. 55 a. C.) describe cómo, en un rayo de sol que entra en una habitación oscura, las motas de polvo «se agitan en una lucha sin fin»: los átomos invisibles las empujan. Einstein (1905) y Perrin (1908) demostraron que el desplazamiento cuadrático medio crece linealmente con el tiempo, y con eso dieron la cifra para el número de Avogadro.');
    let x, y, t, hist, rng;
    const init = () => { rng = C.rng(2024); const n = Math.round(sim.p.n); x = new Float64Array(n); y = new Float64Array(n); t = 0; hist = [[0, 0]]; };
    init(); sim.onChange = init; sim.resetButton(init);
    sim.animate((dt) => {
      const steps = Math.max(1, Math.round(dt * 60));
      for (let k = 0; k < steps && t < 400; k++) {
        let acc = 0; const n = x.length;
        for (let i = 0; i < n; i++) { x[i] += sim.p.s * rng.gauss(); y[i] += sim.p.s * rng.gauss(); acc += x[i] * x[i] + y[i] * y[i]; }
        t++; hist.push([t, acc / n]);
      }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const half = W * 0.5;
      /* rayo de luz y granos */
      ctx.fillStyle = EM.alpha('--gold', 0.08); ctx.beginPath(); ctx.moveTo(0, H * 0.15); ctx.lineTo(half, H * 0.4); ctx.lineTo(half, H * 0.95); ctx.lineTo(0, H * 0.7); ctx.closePath(); ctx.fill();
      const sc = Math.min(half, H) / 70;
      ctx.fillStyle = EM.alpha('--ink', 0.55);
      for (let i = 0; i < x.length; i++) { const px = half * 0.5 + x[i] * sc, py = H * 0.55 + y[i] * sc; if (px > 0 && px < half && py > 0 && py < H) { ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 2 * PI); ctx.fill(); } }
      EM.text(ctx, 'granos de polvo en un rayo de luz', half * 0.5, 16, { size: 11.5, align: 'center', color: '--ink-3' });
      const tmax = Math.max(100, Math.ceil(t / 50) * 50), ymax = Math.max(10, 2 * 2 * p.s * p.s * tmax * 1.0);
      const pl = new EM.Plot(ctx, { x: half + 8, y: 6, w: W - half - 14, h: H - 12, xmin: 0, xmax: tmax, ymin: 0, ymax: Math.ceil(ymax / 10) * 10, xlabel: 'pasos t', ylabel: 'MSD' });
      pl.frame();
      pl.xy(hist.map((h) => h[0]), hist.map((h) => h[1]), { color: '--c1', width: 2 });
      pl.fn((x) => 2 * p.s * p.s * x, { color: '--c2', width: 1.4, dash: [5, 4] });
      const last = hist[hist.length - 1];
      sim.set('msd', EM.fix(last[1], 1) + ' (esperado ' + EM.fix(2 * p.s * p.s * last[0], 1) + ')');
      sim.set('D', last[0] ? EM.fix(last[1] / (4 * last[0]), 3) + ' (σ²/2 = ' + EM.fix(p.s * p.s / 2, 3) + ')' : '—');
      sim.set('t', last[0]);
    });
  });
})();
