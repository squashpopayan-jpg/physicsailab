/* Capítulo 23 — Transiciones de fase y el modelo de Ising */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, SM = P.sm, H = P.hbn;
  const KB = P.K.kB_eV;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     23.1 Del modelo de enlaces al Ising
     ====================================================================== */
  CQ.defineSim('aleacion-mapeo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const p = H.PARAMS;
    const PRE = {
      bn: { n: 'h-BN: A = B, B = N (tesis)', AA: p.BB, BB: p.NN, AB: p.NB, la: ['B', 'N'] },
      cbn: { n: 'Carbono frente a BN (energía de mezcla)', AA: 0, BB: 0, AB: H.mixBNC() / 2, la: ['C', 'N'] },
      seg: { n: 'Ejemplo: enlaces mixtos caros', AA: -1, BB: -1, AB: -0.8, la: ['B', 'N'] },
      ord: { n: 'Ejemplo: enlaces mixtos baratos', AA: -1, BB: -1, AB: -1.2, la: ['B', 'N'] }
    };
    sim.group('Energías de enlace (eV)');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'cbn', onInput: (v) => { const q = PRE[v]; sim.ctl.AA.set(q.AA, true); sim.ctl.BB.set(q.BB, true); sim.ctl.AB.set(q.AB, true); } });
    sim.slider('AA', { label: 'ε<sub>AA</sub>', min: -200, max: 5, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 3) });
    sim.slider('BB', { label: 'ε<sub>BB</sub>', min: -200, max: 5, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 3) });
    sim.slider('AB', { label: 'ε<sub>AB</sub>', min: -200, max: 5, value: H.mixBNC() / 2, step: 0.01, fmt: (v) => CQ.fix(v, 3) });
    sim.out('J', '<i>J</i> = (2ε<sub>AB</sub> − ε<sub>AA</sub> − ε<sub>BB</sub>)/4', { hl: true });
    sim.out('kind', 'Tendencia', { hl: true });
    sim.out('tmf', '<i>T</i><sub>c</sub> campo medio (panal, 3|J|/k<sub>B</sub>)');
    sim.out('tex', '<i>T</i><sub>c</sub> Ising exacta en el panal (1.519|J|/k<sub>B</sub>)');
    sim.note('Para «carbono frente a BN» se toma ε<sub>AB</sub> − (ε<sub>AA</sub> + ε<sub>BB</sub>)/2 = ΔE<sub>mix</sub>/2: una estimación de pseudo-aleación binaria, solo orientativa.');
    sim.onDraw(() => {
      const { AA, BB, AB } = sim.p;
      const J = (2 * AB - AA - BB) / 4;
      const q = PRE[sim.p.pre];
      CQ.draw.clear(cv);
      const L = 16, g = SM.brick(L);
      const s = new Uint8Array(g.N);
      for (let k = 0; k < g.N; k++) s[k] = J < 0 ? g.par[k] : g.x[k] > g.W / 2 ? 1 : 0;
      const half = cv.w / 2;
      const draw = (x0, title, st) => {
        const vw = new CQ.View2D({ w: half, h: cv.h, ctx: cv.ctx }, { xmin: -0.6 - x0 / 40, xmax: g.W, ymin: -0.8, ymax: g.H });
        vw.cx = x0 + half / 2; vw.s = Math.min((half - 20) / (g.W + 1), (cv.h - 40) / (g.H + 1)); vw.xc = g.W / 2; vw.yc = g.H / 2; vw.cy = cv.h / 2 + 10;
        const ctx = cv.ctx;
        ctx.strokeStyle = CQ.alpha('--ink-3', 0.45); ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < g.N; k++) for (let r = 0; r < 3; r++) { const m = g.nb[3 * k + r]; if (m > k && Math.abs(g.x[m] - g.x[k]) < 1.5 && Math.abs(g.y[m] - g.y[k]) < 1.5) { ctx.moveTo(vw.X(g.x[k]), vw.Y(g.y[k])); ctx.lineTo(vw.X(g.x[m]), vw.Y(g.y[m])); } }
        ctx.stroke();
        for (let k = 0; k < g.N; k++) CQ.draw.atom(ctx, vw.X(g.x[k]), vw.Y(g.y[k]), Math.max(2.5, 0.28 * vw.s), st[k] ? q.la[1] : q.la[0], { flat: true });
        CQ.text(ctx, title, x0 + 12, 18, { size: 12, color: '--ink-2', weight: 650 });
      };
      draw(0, J < 0 ? 'estado fundamental: orden alternado (J < 0)' : 'estado fundamental: segregación (J > 0)', s);
      /* desorden de alta temperatura */
      const rng = P.rng(4), r2 = new Uint8Array(g.N);
      for (let k = 0; k < g.N; k++) r2[k] = rng() < 0.5 ? 1 : 0;
      draw(half, 'T ≫ T_c: distribución al azar (α = 0)', r2);
      const tmf = (3 * Math.abs(J)) / KB, tex = (1.518651 * Math.abs(J)) / KB;
      sim.set('J', f4(J) + ' eV');
      sim.set('kind', J > 1e-9 ? 'segregación (dominios)' : J < -1e-9 ? 'orden alternado' : 'mezcla ideal');
      sim.set('tmf', CQ.fix(tmf, 0) + ' K');
      sim.set('tex', CQ.fix(tex, 0) + ' K');
    });
  });

  /* ======================================================================
     23.2 Campo medio
     ====================================================================== */
  CQ.defineSim('campo-medio', function (sim) {
    sim.cols2();
    const cg = sim.canvas({ aspect: 0.95 });
    const cf = sim.canvas({ aspect: 0.95 });
    sim.group('Parámetros reducidos');
    sim.slider('t', { label: 'Temperatura <i>T</i>/<i>T</i><sub>c</sub>', min: 0.3, max: 1.8, value: 0.8, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('h', { label: 'Campo <i>h</i>/(<i>zJ</i>)', min: -0.3, max: 0.3, value: 0, step: 0.005, fmt: (v) => CQ.fix(v, 3) });
    sim.out('sol', 'Soluciones de m = tanh((m + h)/t)');
    sim.out('st', 'Magnetización estable', { hl: true });
    sim.out('m0', 'Aproximación √(3(1 − t)) cerca de T<sub>c</sub>');
    const fMF = (m, t, h) => -0.5 * m * m - h * m + t * (((1 + m) / 2) * Math.log((1 + m) / 2) + ((1 - m) / 2) * Math.log((1 - m) / 2));
    sim.onDraw(() => {
      const t = sim.p.t, h = sim.p.h;
      const F = (m) => Math.tanh((m + h) / t) - m;
      const roots = [];
      for (let q = 0; q < 400; q++) { const a = -1 + (2 * q) / 400, b = a + 2 / 400; if (F(a) * F(b) <= 0) roots.push(P.util.bisect(F, a, b)); }
      const stable = roots.reduce((best, m) => (best === null || fMF(m, t, h) < fMF(best, t, h) ? m : best), null);
      CQ.draw.clear(cg);
      const pg = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, xlabel: 'm', ylabel: '', title: 'solución gráfica' });
      pg.frame();
      pg.fn((m) => m, { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pg.fn((m) => Math.tanh((m + h) / t), { color: '--c1', width: 2.4 });
      roots.forEach((m) => pg.dot(m, m, { color: m === stable ? '--accent' : '--c2', r: m === stable ? 6 : 4 }));
      pg.legend([{ label: 'y = m', color: '--ink-3', dash: [5, 4] }, { label: 'y = tanh((m + h)/t)', color: '--c1' }], 'br');
      CQ.draw.clear(cf);
      const ms = P.util.linspace(-0.995, 0.995, 400), fs = Array.from(ms, (m) => fMF(m, t, h));
      const fmin = Math.min(...fs), fmax = Math.max(...fs);
      const pf = new CQ.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -1, xmax: 1, ymin: fmin - 0.02, ymax: Math.min(fmax, fmin + 0.6), xlabel: 'm', ylabel: 'f(m) / zJ', title: 'energía libre de campo medio' });
      pf.frame();
      pf.xy(Array.from(ms), fs, { color: '--c2', width: 2.4 });
      roots.forEach((m) => pf.dot(m, fMF(m, t, h), { color: m === stable ? '--accent' : '--c2', r: 4.5 }));
      sim.set('sol', roots.map((m) => CQ.fix(m, 4)).join(', '));
      sim.set('st', CQ.fix(stable, 4));
      sim.set('m0', t < 1 ? CQ.fix(Math.sqrt(3 * (1 - t)), 4) + ' (válida si t ≈ 1)' : '0');
    });
  });

  /* ======================================================================
     23.3 Onsager frente a campo medio
     ====================================================================== */
  CQ.defineSim('onsager', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Magnitud');
    sim.seg('q', { options: [['m', 'magnetización'], ['u', 'energía'], ['c', 'calor específico']], value: 'm' });
    sim.check('x4', { label: 'Enumeración exacta de una red 4 × 4 (65 536 estados)', value: true });
    sim.slider('T', { label: 'Temperatura señalada (J/k<sub>B</sub>)', min: 0.5, max: 5, value: 2, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.out('ex', 'Onsager (L → ∞)', { hl: true });
    sim.out('mf', 'Campo medio (z = 4)');
    sim.out('e4', 'Red 4 × 4 exacta');
    let cache4 = null;
    const mfm = (T) => SM.mfM(T, 4, 0);
    sim.onDraw(() => {
      const q = sim.p.q, T = sim.p.T;
      if (sim.p.x4 && !cache4) { cache4 = []; for (let k = 0; k < 36; k++) { const t = 0.6 + (k * 4.3) / 35; cache4.push([t, SM.isingExact(4, t)]); } }
      const exa = (t) => (q === 'm' ? SM.onsager.m(t) : q === 'u' ? SM.onsager.u(t) : SM.onsager.c(t));
      const mf = (t) => { const m = Math.abs(mfm(t)); return q === 'm' ? m : q === 'u' ? -2 * m * m : NaN; };
      const mfc = (t) => { const h = 1e-3; return (mf(t + h) - mf(t - h)) / (2 * h); };
      CQ.draw.clear(cv);
      const yr = q === 'm' ? [0, 1.1] : q === 'u' ? [-2.1, 0.1] : [0, 2.5];
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 5, ymin: yr[0], ymax: yr[1], xlabel: 'T (J/k_B)', ylabel: q === 'm' ? '|m|' : q === 'u' ? 'u = E/(NJ)' : 'c = C/(Nk_B)' });
      pl.frame();
      pl.vline(SM.onsager.Tc, { color: '--c1', label: 'T_c Onsager' });
      pl.vline(4, { color: '--c2', label: 'T_c campo medio' });
      pl.fn((t) => (q === 'c' && Math.abs(t - SM.onsager.Tc) < 1e-3 ? NaN : exa(t)), { color: '--c1', width: 2.6, n: 900 });
      pl.fn((t) => (q === 'c' ? mfc(t) : mf(t)), { color: '--c2', width: 2, dash: [6, 4], n: 600 });
      if (sim.p.x4 && cache4) cache4.forEach(([t, r]) => pl.dot(t, q === 'm' ? r.m : q === 'u' ? r.e : r.c, { color: '--c3', r: 3.2 }));
      pl.vline(T, { color: '--accent' });
      pl.legend([{ label: 'Onsager (exacto, L → ∞)', color: '--c1' }, { label: 'campo medio', color: '--c2', dash: [6, 4] }].concat(sim.p.x4 ? [{ label: 'red 4 × 4 exacta', color: '--c3', kind: 'dot' }] : []), 'tr');
      const e4 = sim.p.x4 ? SM.isingExact(4, T) : null;
      sim.set('ex', f4(exa(T)));
      sim.set('mf', q === 'c' ? f4(mfc(T)) : f4(mf(T)));
      sim.set('e4', e4 ? f4(q === 'm' ? e4.m : q === 'u' ? e4.e : e4.c) : '—');
    });
  });
})();
