/* Capítulo 11 — Taller: materiales y técnicas de montaje */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, D = EM.draw;
  const MAT = { pino: 'Pino', mdf: 'MDF', aluminio: 'Aluminio', acero: 'Acero', pvc: 'PVC', acrilico: 'Acrílico' };

  EM.defineSim('flecha-voladizo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('mat', { label: 'Material', options: Object.keys(MAT).map((k) => [k, MAT[k] + ' (E = ' + EM.fix(MO.MODULO_E[k] / 1e9, 1) + ' GPa)']), value: 'pino' });
    sim.slider('L', { label: 'Longitud del brazo', min: 0.1, max: 0.6, step: 0.01, value: 0.3, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
    sim.slider('b', { label: 'Ancho de la sección', min: 0.005, max: 0.05, step: 0.001, value: 0.03, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 0) });
    sim.slider('h', { label: 'Altura de la sección (en la dirección de la carga)', min: 0.002, max: 0.04, step: 0.001, value: 0.02, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 0) });
    sim.slider('m', { label: 'Masa colgada en la punta', min: 0.05, max: 2, step: 0.05, value: 0.5, unit: 'kg', fmt: (v) => EM.fix(v, 2) });
    sim.button('Girar la sección 90°', () => { const b = sim.p.b, h = sim.p.h; sim.ctl.b.set(Math.min(0.05, h), true); sim.ctl.h.set(Math.min(0.04, b), true); });
    sim.out('d', 'Flecha en la punta', { hl: true });
    sim.out('k', 'Rigidez del brazo F/δ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const F = p.m * EM.local().g, E = MO.MODULO_E[p.mat], d = MO.flechaVoladizo(F, p.L, E, p.b, p.h);
      const x0 = W * 0.12, y0 = H * 0.3, Lpx = W * 0.72 * (p.L / 0.6), hpx = Math.max(4, p.h * 900), esc = Math.min(60, (d * 1000) * 6);
      D.rect(ctx, x0 - 26, y0 - 60, 26, 170, { fill: '--metal-dark' });
      ctx.save(); ctx.fillStyle = EM.col(p.mat === 'pino' || p.mat === 'mdf' ? '--wood' : p.mat === 'pvc' || p.mat === 'acrilico' ? '--plastic' : '--metal');
      ctx.beginPath(); ctx.moveTo(x0, y0 - hpx / 2);
      const N = 40;
      for (let i = 0; i <= N; i++) { const s = i / N, y = esc * s * s * (3 - s) / 2; ctx.lineTo(x0 + s * Lpx, y0 - hpx / 2 + y); }
      for (let i = N; i >= 0; i--) { const s = i / N, y = esc * s * s * (3 - s) / 2; ctx.lineTo(x0 + s * Lpx, y0 + hpx / 2 + y); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = EM.alpha('#000000', 0.35); ctx.stroke(); ctx.restore();
      D.line(ctx, x0, y0, x0 + Lpx, y0, { color: '--ink-3', dash: [4, 4], width: 1 });
      const xt = x0 + Lpx, yt = y0 + esc + hpx / 2;
      D.hilo(ctx, xt, yt, xt, yt + 50);
      D.block(ctx, xt, yt + 64, 30, 26, { fill: '--metal-dark', label: EM.fix(p.m, 2) + ' kg', size: 10 });
      D.label(ctx, 'deformación exagerada para verla', x0, H * 0.92, { size: 11, color: '--ink-3' });
      sim.set('d', EM.fix(d * 1000, 3) + ' mm ' + (d < 0.001 ? '<span class="chip ok">rígido</span>' : d < 0.005 ? '<span class="chip mid">aceptable</span>' : '<span class="chip bad">demasiado flexible</span>'));
      sim.set('k', EM.si(F / d, 'N/m', 3));
    });
  });

  /* [nombre, radio (m), momento de inercia (kg·m²), torque de fricción (N·m)]; el torque de un rodamiento 608
     lubricado sin carga es del orden de 0,1 mN·m; el del carrete se estima con μ ≈ 0,3 sobre un clavo de 1,5 mm de radio */
  const POLEAS = {
    cd: ['Dos CD sobre rodamiento 608 (r = 6 cm)', 0.06, 5.85e-5, 1e-4],
    rod: ['Rodamiento 608 solo (r = 1,1 cm)', 0.011, 1.2e-7, 1e-4],
    car: ['Carrete de hilo sobre un clavo (r = 1,5 cm)', 0.015, 2.0e-6, 4e-4],
    com: ['Polea plástica de laboratorio con eje (r = 2,5 cm)', 0.025, 1.0e-5, 2e-4]
  };
  EM.defineSim('polea', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('po', { label: 'Polea', options: Object.keys(POLEAS).map((k) => [k, POLEAS[k][0]]), value: 'cd' });
    sim.slider('M', { label: 'Masa del carro', min: 0.1, max: 1, step: 0.01, value: 0.5, unit: 'kg', fmt: (v) => EM.fix(v, 2) });
    sim.slider('m', { label: 'Masa colgante', min: 0.01, max: 0.2, step: 0.005, value: 0.05, unit: 'kg', fmt: (v) => EM.fix(v, 3) });
    sim.out('a0', 'Aceleración ideal mg/(M+m)');
    sim.out('a', 'Aceleración con la polea real', { hl: true });
    sim.out('e', 'Error sistemático si se ignora la polea');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = EM.local().g;
      D.clear(cv);
      const [, r, I, tf] = POLEAS[p.po];
      const a0 = (p.m * g) / (p.M + p.m), a = Math.max(0, (p.m * g - tf / r) / (p.M + p.m + I / (r * r)));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.2, ymin: 0, ymax: 3.5, xlabel: 'masa colgante m (kg)', ylabel: 'a (m/s²)' });
      pl.frame();
      pl.fn((m) => (m * g) / (p.M + m), { color: '--ink-3', dash: [5, 4], width: 1.6 });
      for (const k of Object.keys(POLEAS)) { const [, rr, II, tt] = POLEAS[k]; pl.fn((m) => Math.max(0, (m * g - tt / rr) / (p.M + m + II / (rr * rr))), { color: k === p.po ? '--c2' : '--c6', width: k === p.po ? 2.6 : 1.2 }); }
      pl.dot(p.m, a, { color: '--c2', r: 5 });
      pl.legend([{ label: 'ideal', color: '--ink-3', kind: 'dash' }, { label: 'polea elegida', color: '--c2' }, { label: 'otras poleas', color: '--c6' }], 'tl');
      sim.set('a0', EM.fix(a0, 3) + ' m/s²');
      sim.set('a', EM.fix(a, 3) + ' m/s²');
      sim.set('e', EM.fix((100 * (a0 - a)) / a0, 1) + ' %');
    });
  });
})();
