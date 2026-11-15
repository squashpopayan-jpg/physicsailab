/* Capítulo 20 — El reto de fondeo */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats, Rk = () => ML.L.risk;

  function sampler(shape, edge, rng) {
    return () => { const i = rng.int(shape.R.length); const r = shape.R[i] + edge; return { R: r, tp: shape.tp[i] }; };
  }
  function challenge(shape, edge, riskPct, o) {
    const rng = St().rng((o.seed || 1) * 99991 + Math.round(edge * 1000) * 7 + Math.round(riskPct * 1000));
    const esc = riskPct / 0.125;
    return Rk().challenge({ sampler: sampler(shape, edge, rng), lambda: o.lam, balas: o.balas, onedone: true, meta: 180 * esc, maxloss: 250 * esc, riskPct: riskPct / 100, target: o.target, maxDays: o.maxDays, nsim: o.nsim, seed: o.seed || 1 });
  }

  ML.defineSim('reto-mc', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '380px' });
    sim.group('Estrategia');
    sim.slider('e', { label: 'Ventaja verdadera (R por operación)', min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('lam', { label: 'Señales por día', min: 0.2, max: 2, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    sim.group('Reto y riesgo');
    sim.slider('f', { label: 'Riesgo por operación (%)', min: 0.125, max: 3, step: 0.125, value: 0.5, fmt: (v) => ML.fix(v, 3) });
    sim.slider('target', { label: 'Objetivo (%)', min: 5, max: 10, step: 5, value: 10, fmt: (v) => ML.fix(v, 0) + ' %' });
    sim.slider('maxDays', { label: 'Plazo (días de operación)', min: 20, max: 600, step: 10, value: 365, fmt: (v) => ML.fix(v, 0) });
    sim.slider('balas', { label: 'Balas por día', min: 1, max: 4, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.out('pass', 'Aprueba', { hl: true });
    sim.out('fail', 'Falla (toca un límite)');
    sim.out('to', 'No termina en el plazo');
    sim.out('days', 'Días hasta aprobar: mediana (p25–p75)');
    sim.out('th', 'Tiempo teórico (sin límites)');
    let D = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, shape = ML.realShape(D);
      const r = challenge(shape, p.e, p.f, { lam: p.lam, balas: Math.round(p.balas), target: p.target / 100, maxDays: Math.round(p.maxDays), nsim: 1200 });
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: 2.6, ymin: 0, ymax: 1, ml: 56, mb: 44, ylabel: 'Probabilidad', yfmt: (v) => ML.fix(100 * v, 0) + ' %', xticks: [0, 1, 2], xfmt: (v) => ['aprueba', 'falla', 'sin terminar'][v] || '' });
      pl.frame();
      ML.draw.bars(pl, [0, 1, 2], [r.pass, r.fail, r.timeout], 0.6, { colors: ['--c3', '--c2', '--ink-3'], alpha: 0.85 });
      [r.pass, r.fail, r.timeout].forEach((v, i) => ML.text(cv.ctx, ML.pct(v, 1), pl.X(i), pl.Y(v) - 6, { size: 12, mono: true, color: '--ink', align: 'center', weight: 600 }));
      sim.set('pass', ML.pct(r.pass, 1)); sim.set('fail', ML.pct(r.fail, 1)); sim.set('to', ML.pct(r.timeout, 1));
      sim.set('days', r.pass > 0.01 ? ML.fix(r.medDays, 0) + ' (' + ML.fix(r.p25, 0) + '–' + ML.fix(r.p75, 0) + ')' : '—');
      const th = p.e > 0 ? (p.target / 100) / (p.lam * p.e * (p.f / 100)) : Infinity;
      sim.set('th', isFinite(th) ? ML.fix(th, 0) + ' días hábiles (' + ML.fix(th / 252, 1) + ' años)' : '∞ (sin ventaja no hay deriva)');
    });
  });

  const RISKS = [0.125, 0.25, 0.5, 0.75, 1, 1.5, 2], EDGES = [0, 0.03, 0.05, 0.075, 0.1, 0.15, 0.2];
  ML.defineSim('reto-mapa', function (sim) {
    const cv = sim.canvas({ aspect: 1.6, maxH: '420px' });
    sim.group('Mapa');
    sim.seg('mode', { label: 'Mostrar', options: [['pass', 'Aprueba'], ['fail', 'Falla'], ['dif', 'Aprueba − falla']], value: 'dif' });
    sim.slider('lam', { label: 'Señales por día', min: 0.2, max: 2, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    sim.out('cell', 'Celda seleccionada', { hl: true, wide: true });
    let D = null, res = null, sel = [4, 4], hit = null, lastLam = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    ML.pointer(cv, { down: (x, y) => { if (!hit) return null; const c = hit.cell(x, y); if (c) { sel = c; sim.redraw(); } return null; } });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, shape = ML.realShape(D);
      if (lastLam !== p.lam) { lastLam = p.lam; res = RISKS.map((f) => EDGES.map((e) => challenge(shape, e, f, { lam: p.lam, balas: 2, target: 0.1, maxDays: 365, nsim: 400 }))); }
      const G = res.map((row) => row.map((r) => (p.mode === 'pass' ? r.pass : p.mode === 'fail' ? -r.fail : r.pass - r.fail)));
      const rect = { x: 66, y: 12, w: cv.w - 82, h: cv.h - 62 };
      hit = ML.draw.heat(cv.ctx, rect, G, { vmax: 1, sel, text: (v, r, c) => ML.fix(100 * Math.abs(v), 0) + (p.mode === 'dif' && v < 0 ? '−' : ''), xlabels: EDGES.map((e) => '+' + ML.fix(e, 3)), ylabels: RISKS.map((f) => ML.fix(f, 3) + '%'), xtitle: 'Ventaja verdadera (R por operación)', ytitle: 'Riesgo por operación' });
      const r = res[sel[0]][sel[1]];
      sim.set('cell', 'riesgo ' + RISKS[sel[0]] + ' % · ventaja +' + EDGES[sel[1]] + ' R → aprueba ' + ML.pct(r.pass, 0) + ' · falla ' + ML.pct(r.fail, 0) + ' · mediana ' + (r.pass > 0.02 ? ML.fix(r.medDays, 0) + ' días' : '—'));
    });
  });
})();
