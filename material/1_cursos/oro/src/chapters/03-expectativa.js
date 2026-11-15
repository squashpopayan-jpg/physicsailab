/* Capítulo 3 — La expectativa */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats;
  const pstar = (b, c) => (1 + c) / (1 + b + c);

  /* ======================================================================
     3.1 Mapa de la expectativa
     ====================================================================== */
  ML.defineSim('mapa-expectativa', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, maxH: '430px' });
    sim.group('Costo');
    sim.slider('c', { label: 'Costo por intento (R)', min: 0, max: 0.25, step: 0.005, value: 0.05, fmt: (v) => ML.fix(v, 3) });
    sim.out('e', 'Expectativa en el punto', { hl: true });
    sim.out('ps', 'Acierto de equilibrio en ese payoff');
    sim.out('man', 'Expectativa medida del manual en M5');
    let pl = null;
    const B0 = 0.6, B1 = 4, P0 = 0.1, P1 = 0.8;
    const manual = { b: 0.89 / 0.57, p: 0.465 };
    const show = (b, p) => {
      const c = sim.p.c, e = p * b - (1 - p) - c;
      sim.set('e', ML.R(e, 3) + ' <small>(p = ' + ML.pct(p, 0) + ', payoff = ' + ML.fix(b, 2) + ')</small>');
      sim.set('ps', ML.pct(pstar(b, c), 1));
    };
    ML.pointer(cv, { hover: (x, y) => { if (!pl || !pl.inside(x, y)) return false; show(pl.invX(x), pl.invY(y)); return false; } });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const c = sim.p.c;
      pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: B0, xmax: B1, ymin: P0, ymax: P1, ml: 54, mb: 44, xlabel: 'Payoff b = ganancia media ÷ pérdida media', ylabel: 'Acierto p', yfmt: (v) => ML.fix(100 * v, 0) + ' %', grid: false });
      pl.frame();
      const ctx = cv.ctx, W = Math.round(pl.iw), H = Math.round(pl.ih), img = ctx.createImageData(1, 1);
      pl.clip(() => {
        const step = 4;
        for (let px = 0; px < W; px += step) for (let py = 0; py < H; py += step) {
          const b = pl.invX(pl.ix + px + step / 2), p = pl.invY(pl.iy + py + step / 2);
          const e = p * b - (1 - p) - c;
          ctx.fillStyle = ML.rgbStr(ML.cmapPL(e / 1.0), 0.9);
          ctx.fillRect(pl.ix + px, pl.iy + py, step, step);
        }
      });
      pl.frame();
      pl.fn((b) => pstar(b, c), { color: '--ink', width: 2.4, from: B0, to: B1 });
      pl.label(3.2, pstar(3.2, c) - 0.035, 'E = 0', { color: '--ink', align: 'center' });
      const mx = pl.X(manual.b), my = pl.Y(manual.p);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.PI / 4); ctx.fillStyle = ML.col('--accent'); ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 2; ctx.fillRect(-6, -6, 12, 12); ctx.strokeRect(-6, -6, 12, 12); ctx.restore();
      ML.text(ctx, 'manual (M5 real)', mx + 12, my - 8, { size: 11.5, color: '--ink', halo: true });
      sim.set('man', ML.R(0.465 * 0.89 - 0.535 * 0.57, 3) + ' <small>(costos ya incluidos)</small>');
    });
    show(1.64, 0.45);
    sim.onChange = () => show(1.64, 0.45);
  });

  /* ======================================================================
     3.2 Abanico de secuencias
     ====================================================================== */
  ML.defineSim('abanico', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, maxH: '420px' });
    sim.group('Estrategia');
    sim.slider('p', { label: 'Acierto p', min: 0.2, max: 0.7, step: 0.01, value: 0.45, fmt: (v) => ML.pct(v, 0) });
    sim.slider('b', { label: 'Payoff b', min: 0.6, max: 4, step: 0.02, value: 1.64, fmt: (v) => ML.fix(v, 2) });
    sim.slider('c', { label: 'Costo c (R)', min: 0, max: 0.2, step: 0.005, value: 0.05, fmt: (v) => ML.fix(v, 3) });
    sim.slider('n', { label: 'Operaciones', min: 30, max: 500, step: 10, value: 100, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otro sorteo', () => { seed++; build(); }, { primary: true });
    sim.out('e', 'Expectativa por operación', { hl: true });
    sim.out('fin', 'Resultado final: mediana (5 %–95 %)');
    sim.out('neg', 'Secuencias que terminan en pérdida');
    sim.out('dd', 'Caída máxima mediana');
    let seed = 3, paths = [];
    function build() {
      const p = sim.p, rng = St().rng(seed * 977 + 1), n = Math.round(p.n);
      paths = [];
      for (let k = 0; k < 1000; k++) {
        const e = new Float64Array(n + 1);
        for (let i = 0; i < n; i++) e[i + 1] = e[i] + (rng() < p.p ? p.b : -1) - p.c;
        paths.push(e);
      }
    }
    sim.onChange = () => build();
    build();
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, n = Math.round(p.n);
      const q = (i, f) => St().quantile(paths.map((e) => e[i]), f);
      const xs = [], lo = [], md = [], hi = [];
      const step = Math.max(1, Math.floor(n / 60));
      for (let i = 0; i <= n; i += step) { xs.push(i); lo.push(q(i, 0.05)); md.push(q(i, 0.5)); hi.push(q(i, 0.95)); }
      const ymin = Math.min(...lo) - 3, ymax = Math.max(...hi) + 3;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin, ymax, ml: 50, mb: 44, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (R)' });
      pl.frame();
      for (let k = 0; k < 40; k++) pl.xy(Array.from(paths[k], (_, i) => i), Array.from(paths[k]), { color: '--ink-3', width: 1, alpha: 0.3 });
      const ctx = cv.ctx;
      pl.clip(() => { ctx.fillStyle = ML.alpha('--accent', 0.14); ctx.beginPath(); xs.forEach((x, i) => (i ? ctx.lineTo(pl.X(x), pl.Y(hi[i])) : ctx.moveTo(pl.X(x), pl.Y(hi[i])))); for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(pl.X(xs[i]), pl.Y(lo[i])); ctx.closePath(); ctx.fill(); });
      pl.xy(xs, md, { color: '--accent', width: 3 });
      const E = p.p * p.b - (1 - p.p) - p.c;
      pl.xy([0, n], [0, E * n], { color: '--ink', width: 1.6, dash: [6, 4] });
      pl.legend([{ label: 'mediana', color: '--accent' }, { label: 'esperanza n·E', color: '--ink', dash: [6, 4] }, { label: '5 %–95 %', color: '--accent', kind: 'sq' }, { label: 'secuencias', color: '--ink-3' }], 'tl');
      const fin = paths.map((e) => e[n]);
      const dds = paths.map((e) => { let pk = -Infinity, d = 0; for (let i = 0; i <= n; i++) { if (e[i] > pk) pk = e[i]; if (pk - e[i] > d) d = pk - e[i]; } return d; });
      sim.set('e', ML.R(E, 3));
      sim.set('fin', ML.R(St().quantile(fin, 0.5), 1) + ' (' + ML.fix(St().quantile(fin, 0.05), 1) + ' a ' + ML.fix(St().quantile(fin, 0.95), 1) + ')');
      sim.set('neg', ML.pct(fin.filter((v) => v < 0).length / fin.length, 0));
      sim.set('dd', ML.fix(St().quantile(dds, 0.5), 1) + ' R = ' + ML.usd(St().quantile(dds, 0.5) * 125) + ' con 125 USD por R');
    });
  });

  /* ======================================================================
     3.3 Tres perfiles con la misma esperanza
     ====================================================================== */
  ML.defineSim('tres-perfiles', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    cv.wrap.style.minHeight = '240px';
    sim.group('Muestra');
    sim.slider('n', { label: 'Operaciones por secuencia', min: 50, max: 400, step: 10, value: 200, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    const c = 0.05;
    /* (p, ganancia, pérdida) con E = p*g - (1-p)*l - c = -c  → p*g = (1-p)*l */
    const PROF = [
      { nom: 'Escalera', col: '--c2', p: 0.775, g: 0.32, l: 1.0 },
      { nom: 'Equilibrado', col: '--accent', p: 0.38, g: 1.64, l: 1.0 },
      { nom: 'Tendencia', col: '--c5', p: 0.2, g: 4.0, l: 1.0 }
    ];
    PROF.forEach((p) => { p.g = (1 - p.p) * p.l / p.p; });
    sim.outSep('Por perfil');
    PROF.forEach((q, i) => { sim.out('p' + i, q.nom, { wide: true }); });
    let seed = 5;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const n = Math.round(sim.p.n), rng = St().rng(seed * 313 + 7);
      const W = cv.w, H = cv.h;
      const paths = PROF.map((q) => { const e = [0]; let streak = 0, maxs = 0; for (let i = 0; i < n; i++) { const win = rng() < q.p; e.push(e[i] + (win ? q.g : -q.l) - c); streak = win ? 0 : streak + 1; if (streak > maxs) maxs = streak; } return { e, maxs }; });
      const ymin = Math.min(...paths.map((p) => Math.min(...p.e))) - 2, ymax = Math.max(...paths.map((p) => Math.max(...p.e))) + 2;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: n, ymin, ymax, ml: 50, mb: 44, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (R)' });
      pl.frame();
      paths.forEach((p, i) => pl.xy(p.e.map((_, k) => k), p.e, { color: PROF[i].col, width: 2.2 }));
      pl.legend(PROF.map((q) => ({ label: q.nom, color: q.col })), 'tl');
      PROF.forEach((q, i) => {
        sim.set('p' + i, `acierto ${ML.pct(q.p, 0)} · gana ${ML.fix(q.g, 2)} R · pierde ${ML.fix(q.l, 2)} R · racha negra máx. ${paths[i].maxs} · final ${ML.R(paths[i].e[n], 1)}`);
      });
    });
  });
})();
