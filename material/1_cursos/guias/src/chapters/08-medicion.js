/* Capítulo 8 — Medir con incertidumbre */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;

  EM.defineSim('dispersion', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('s', { label: 'Dispersión de una medida σ', min: 0.02, max: 0.3, step: 0.01, value: 0.12, unit: 's', fmt: (v) => EM.fix(v, 2) });
    sim.seg('n', { label: 'Medidas por muestra n', options: [[1, '1'], [4, '4'], [9, '9'], [16, '16'], [36, '36']], value: 4 });
    sim.button('Nueva muestra', () => { seed = L.semilla(); }, { primary: true });
    sim.out('m', 'Promedio de la muestra ± s/√n', { hl: true });
    sim.out('s', 'Desviación estándar s de la muestra');
    sim.out('sm', 'Dispersión de 2000 promedios');
    let seed = 12345;
    const X0 = 1.8;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, n = +p.n;
      D.clear(cv);
      const r = L.rng(seed);
      const muestra = Array.from({ length: n }, () => X0 + r.gauss(0, p.s));
      const prom = [];
      const r2 = L.rng(seed + 99);
      for (let k = 0; k < 2000; k++) { let s = 0; for (let i = 0; i < n; i++) s += r2.gauss(0, p.s); prom.push(X0 + s / n); }
      const a = X0 - 4 * 0.3, b = X0 + 4 * 0.3, nb = 60, h1 = new Array(nb).fill(0), h2 = new Array(nb).fill(0);
      /* histograma de medidas individuales (2000) y de promedios */
      const r3 = L.rng(seed + 7);
      for (let k = 0; k < 2000; k++) { const x = X0 + r3.gauss(0, p.s); const i = Math.floor(((x - a) / (b - a)) * nb); if (i >= 0 && i < nb) h1[i]++; }
      for (const x of prom) { const i = Math.floor(((x - a) / (b - a)) * nb); if (i >= 0 && i < nb) h2[i]++; }
      const ymax = Math.max(...h2, ...h1) * 1.1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: a, xmax: b, ymin: 0, ymax, xlabel: 'tiempo medido (s)', ylabel: 'frecuencia', yticks: [] , ml: 30});
      pl.frame();
      const bw = (b - a) / nb;
      const barras = (h, col, al) => { ctx.save(); ctx.fillStyle = EM.col(col); ctx.globalAlpha = al; h.forEach((c, i) => { const x0 = pl.X(a + i * bw), x1 = pl.X(a + (i + 1) * bw); ctx.fillRect(x0, pl.Y(c), x1 - x0 - 1, pl.Y(0) - pl.Y(c)); }); ctx.restore(); };
      barras(h1, '--c1', 0.35);
      barras(h2, '--c2', 0.55);
      pl.vline(X0, { color: '--ink-2', label: 'valor verdadero', dash: [] });
      muestra.forEach((x) => pl.dot(x, ymax * 0.06, { color: '--c1', r: 4 }));
      const m = L.mean(muestra), s = n > 1 ? L.std(muestra) : NaN;
      pl.dot(m, ymax * 0.14, { color: '--c2', r: 6, label: 'promedio', noclip: true });
      pl.legend([{ label: 'medidas individuales', color: '--c1', kind: 'sq' }, { label: 'promedios de ' + n, color: '--c2', kind: 'sq' }], 'tr');
      sim.set('m', n > 1 ? L.pm(m, s / Math.sqrt(n), 's') : EM.fix(m, 3) + ' s (con una medida no se puede calcular s)');
      sim.set('s', n > 1 ? EM.fix(s, 3) + ' s' : '—');
      sim.set('sm', EM.fix(L.std(prom), 3) + ' s ≈ σ/√n = ' + EM.fix(p.s / Math.sqrt(n), 3) + ' s');
    });
  });

  const INSTR = {
    regla: ['Regla (1 mm)', 0.001], flex: ['Flexómetro (1 mm)', 0.001], cal: ['Calibrador (0,05 mm)', 0.00005], tor: ['Tornillo micrométrico (0,01 mm)', 0.00001]
  };
  const BAL = { coc: ['Balanza de cocina (1 g)', 0.001], joy: ['Balanza de joyería (0,01 g)', 0.00001] };
  EM.defineSim('propagacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Cilindro de aluminio');
    sim.slider('d', { label: 'Diámetro', min: 0.008, max: 0.05, step: 0.0005, value: 0.0254, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 1) });
    sim.slider('h', { label: 'Altura', min: 0.01, max: 0.1, step: 0.001, value: 0.05, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 0) });
    sim.group('Instrumentos');
    sim.select('id', { label: 'Para el diámetro', options: Object.keys(INSTR).map((k) => [k, INSTR[k][0]]), value: 'regla' });
    sim.select('ih', { label: 'Para la altura', options: Object.keys(INSTR).map((k) => [k, INSTR[k][0]]), value: 'regla' });
    sim.select('im', { label: 'Para la masa', options: Object.keys(BAL).map((k) => [k, BAL[k][0]]), value: 'coc' });
    sim.out('m', 'Masa (2700 kg/m³)');
    sim.out('rho', 'Densidad con incertidumbre', { hl: true });
    sim.out('mc', 'Monte Carlo (10 000 cilindros)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const rho = MO.DENSIDADES.aluminio, m = rho * MO.volCil(p.d, p.h);
      const ud = L.uRes(INSTR[p.id][1]), uh = L.uRes(INSTR[p.ih][1]), um = L.uRes(BAL[p.im][1]);
      const cm = um / m, cd = (2 * ud) / p.d, ch = uh / p.h, ur = Math.sqrt(cm * cm + cd * cd + ch * ch);
      /* Monte Carlo */
      const r = L.rng(2024), vals = [];
      for (let k = 0; k < 10000; k++) {
        const dd = p.d + (r() - 0.5) * INSTR[p.id][1], hh = p.h + (r() - 0.5) * INSTR[p.ih][1], mm = m + (r() - 0.5) * BAL[p.im][1];
        vals.push((4 * mm) / (Math.PI * dd * dd * hh));
      }
      const umc = L.std(vals) / rho;
      /* barras de contribución */
      const items = [['masa', cm, '--c3'], ['diámetro (×2)', cd, '--c2'], ['altura', ch, '--c1'], ['total', ur, '--ink-2']];
      const xmax = Math.max(...items.map((x) => x[1])) * 100 * 1.25;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax: 4.6, xlabel: 'contribución a u(ρ)/ρ (%)', yticks: [], ml: 104 });
      pl.frame();
      items.forEach(([t, v, c], i) => {
        const y = 3.8 - i;
        D.rect(ctx, pl.X(0), pl.Y(y + 0.3), pl.X(v * 100) - pl.X(0), pl.Y(y - 0.3) - pl.Y(y + 0.3), { fill: c, stroke: null, alpha: 0.8 });
        EM.text(ctx, t, pl.X(0) - 8, pl.Y(y) + 4, { size: 12, align: 'right', color: '--ink-2' });
        EM.text(ctx, EM.fix(v * 100, 2) + ' %', pl.X(v * 100) + 6, pl.Y(y) + 4, { size: 11.5, color: '--ink' });
      });
      sim.set('m', EM.fix(m * 1000, 2) + ' g');
      sim.set('rho', L.pm(rho, rho * ur, 'kg/m³') + ' (' + EM.fix(100 * ur, 2) + ' %)');
      sim.set('mc', 'u(ρ)/ρ = ' + EM.fix(100 * umc, 2) + ' %');
    });
  });

  EM.defineSim('cronometraje', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('T', { label: 'Periodo real', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 's', fmt: (v) => EM.fix(v, 2) });
    sim.slider('sr', { label: 'Dispersión del tiempo de reacción por pulsación', min: 0.03, max: 0.2, step: 0.01, value: 0.09, unit: 's', fmt: (v) => EM.fix(v, 2) });
    sim.slider('N', { label: 'Oscilaciones cronometradas', min: 1, max: 30, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('man', 'Manual', { hl: true });
    sim.out('vid', 'Video a 30 y 240 cuadros/s');
    sim.out('fot', 'Fotopuerta (0,1 ms)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const uMan = (N) => (Math.SQRT2 * p.sr) / N, uVid = (f) => (N) => (Math.SQRT2 * (1 / f) / Math.sqrt(12)) / N, uFot = (N) => (Math.SQRT2 * 0.0001 / Math.sqrt(12)) / N;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 30, ymin: 1e-6, ymax: 1, ylog: true, xlabel: 'oscilaciones cronometradas N', ylabel: 'u(T)/T' });
      pl.frame();
      pl.fn((N) => uMan(N) / p.T, { color: '--c2', width: 2.4 });
      pl.fn((N) => uVid(30)(N) / p.T, { color: '--c1', width: 2 });
      pl.fn((N) => uVid(240)(N) / p.T, { color: '--c1', width: 2, dash: [5, 4] });
      pl.fn((N) => uFot(N) / p.T, { color: '--c3', width: 2 });
      pl.hline(0.01, { label: '1 %', color: '--ink-3' });
      pl.vline(p.N, { color: '--ink-2' });
      pl.legend([{ label: 'manual', color: '--c2' }, { label: 'video 30 cuadros/s', color: '--c1' }, { label: 'video 240 cuadros/s', color: '--c1', kind: 'dash' }, { label: 'fotopuerta', color: '--c3' }], 'tr');
      sim.set('man', L.pm(p.T, uMan(p.N), 's') + ' (' + EM.fix((100 * uMan(p.N)) / p.T, 2) + ' %)');
      sim.set('vid', EM.fix((100 * uVid(30)(p.N)) / p.T, 3) + ' % y ' + EM.fix((100 * uVid(240)(p.N)) / p.T, 3) + ' %');
      sim.set('fot', EM.fix((100 * uFot(p.N)) / p.T, 5) + ' %');
    });
  });
})();
