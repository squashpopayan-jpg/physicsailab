/* Capítulo 9 — Métodos aproximados */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom, LA = P.la;
  const f5 = (v) => CQ.fix(v, 5), f6 = (v) => CQ.fix(v, 6);

  /* ======================================================================
     9.1 Hidrógeno con gaussianas
     ====================================================================== */
  CQ.defineSim('variacional-gaussianas', function (sim) {
    sim.cols2();
    const c1 = sim.canvas({ aspect: 0.95 });
    const c2 = sim.canvas({ aspect: 0.95 });
    sim.group('Una sola gaussiana');
    sim.note('φ(<i>r</i>) = e<sup>−α<i>r</i>²</sup>');
    sim.slider('a', { label: 'Exponente α', min: 0.02, max: 2, value: 0.6, log: true, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.group('Base de M gaussianas');
    sim.note('Exponentes en progresión geométrica: α<sub><i>k</i></sub> = α<sub>0</sub>β<sup><i>k</i></sup>');
    sim.slider('M', { label: 'Número de funciones <i>M</i>', min: 1, max: 14, value: 6, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('a0', { label: 'Exponente menor α₀', min: 0.005, max: 0.5, value: 0.02, log: true, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.slider('b', { label: 'Razón β', min: 1.3, max: 8, value: 3.2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.out('E1', '<i>E</i>(α) con una gaussiana', { hl: true });
    sim.out('Em', 'Mínimo de una gaussiana (−4/3π)');
    sim.out('EM', '<i>E</i> con <i>M</i> gaussianas', { hl: true });
    sim.out('err', 'Error respecto de −0.5 Ha');
    sim.out('cond', 'Número de condición de <b>S</b>');
    sim.onDraw(() => {
      const a = sim.p.a;
      /* panel izquierdo: E(α) y función radial */
      CQ.draw.clear(c1);
      const pl = new CQ.Plot(c1.ctx, { x: 0, y: 0, w: c1.w, h: c1.h * 0.55, xmin: 0.02, xmax: 2, xlog: true, ymin: -0.55, ymax: 0.4, xlabel: 'α', ylabel: 'E (Ha)', title: 'una gaussiana: E(α) ≥ −0.5' });
      pl.frame();
      pl.fn((x) => A.gauss1(x), { color: '--c1', width: 2.2 });
      pl.hline(-0.5, { color: '--accent', label: 'exacta −0.5' });
      pl.dot(a, A.gauss1(a), { color: '--c1' });
      /* base */
      const al = Array.from({ length: sim.p.M }, (_, k) => sim.p.a0 * Math.pow(sim.p.b, k));
      const r = A.gaussH(al);
      let cond = NaN;
      if (r) { const ev = LA.eigh(r.S, { vectors: false }).values; cond = ev[ev.length - 1] / Math.max(ev[0], 1e-300); }
      /* función radial r·φ comparada con el 1s exacto */
      const pr = new CQ.Plot(c1.ctx, { x: 0, y: c1.h * 0.55, w: c1.w, h: c1.h * 0.45, xmin: 0, xmax: 6, ymin: 0, ymax: 0.65, xlabel: 'r (a₀)', ylabel: 'r·φ(r)' });
      pr.frame();
      const ex = (x) => (x * Math.exp(-x)) / Math.sqrt(Math.PI);
      pr.fn(ex, { color: '--ink', width: 2, dash: [5, 4] });
      const N1 = Math.pow((2 * a) / Math.PI, 0.75);
      pr.fn((x) => x * N1 * Math.exp(-a * x * x), { color: '--c1', width: 1.8 });
      if (r) { const s = r.c.reduce((q, c, k) => q + c, 0) >= 0 ? 1 : -1; pr.fn((x) => s * x * r.c.reduce((q, c, k) => q + c * Math.exp(-al[k] * x * x), 0), { color: '--c3', width: 2 }); }
      pr.legend([{ label: '1s exacto', color: '--ink', dash: [5, 4] }, { label: 'una gaussiana', color: '--c1' }, { label: `${sim.p.M} gaussianas`, color: '--c3' }]);
      /* panel derecho: convergencia con M */
      CQ.draw.clear(c2);
      const pts = [];
      for (let m = 1; m <= 14; m++) {
        const rr = A.gaussH(Array.from({ length: m }, (_, k) => sim.p.a0 * Math.pow(sim.p.b, k)));
        if (rr && isFinite(rr.E)) pts.push([m, Math.max(1e-10, rr.E + 0.5)]);
      }
      const pc = new CQ.Plot(c2.ctx, { x: 0, y: 0, w: c2.w, h: c2.h, xmin: 0.5, xmax: 14.5, ymin: 1e-8, ymax: 1, ylog: true, xlabel: 'número de funciones M', ylabel: 'E(M) − E_{exacta} (Ha)', title: 'convergencia de la base' });
      pc.frame();
      pc.path(pts, { color: '--c3', width: 2 });
      pts.forEach(([m, e]) => pc.dot(m, e, { color: m === sim.p.M ? '--accent' : '--c3', r: m === sim.p.M ? 5 : 3.5 }));
      pc.hline(1e-3, { color: '--ink-3', label: '1 mHa' });
      sim.set('E1', f6(A.gauss1(a)) + ' Ha');
      sim.set('Em', f6(-4 / (3 * Math.PI)) + ' Ha');
      sim.set('EM', r ? f6(r.E) + ' Ha' : 'base singular');
      sim.set('err', r ? CQ.sci(r.E + 0.5, 3) + ' Ha' : '—');
      sim.set('cond', isFinite(cond) ? CQ.sci(cond, 3) : '—');
    });
  });

  /* ======================================================================
     9.2 Rayleigh–Ritz con la base de la caja
     ====================================================================== */
  CQ.defineSim('ritz-base', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 0.95 });
    const cc = sim.canvas({ aspect: 0.95 });
    const POTS = {
      armonico: { n: 'Oscilador V = x²/2 en una caja de ancho 12', V: (x) => 0.5 * x * x, L: 12 },
      doble: { n: 'Doble pozo V = (x² − 4)²/8, caja de ancho 10', V: (x) => ((x * x - 4) ** 2) / 8, L: 10 },
      lineal: { n: 'Potencial lineal V = 2|x|, caja de ancho 10', V: (x) => 2 * Math.abs(x), L: 10 },
      escalon: { n: 'Caja con escalón V = 5 para x > 0, ancho 4', V: (x) => (x > 0 ? 5 : 0), L: 4 }
    };
    sim.group('Problema (ħ = m = 1)');
    sim.select('pot', { options: Object.keys(POTS).map((k) => [k, POTS[k].n]), value: 'armonico' });
    sim.slider('M', { label: 'Funciones de base <i>M</i> (senos de la caja)', min: 1, max: 40, value: 6, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('e', 'Energías (Ritz / exacta)');
    let cache = null;
    const build = () => {
      const pr = POTS[sim.p.pot], L = pr.L, NG = 3000, MM = 40;
      const h = L / NG, xs = Array.from({ length: NG + 1 }, (_, i) => -L / 2 + i * h);
      const ph = (n, x) => Math.sqrt(2 / L) * Math.sin((n * Math.PI * (x + L / 2)) / L);
      const Vx = xs.map(pr.V);
      const H = LA.zeros(MM);
      for (let m = 0; m < MM; m++) for (let n = m; n < MM; n++) {
        const y = xs.map((x, i) => ph(m + 1, x) * Vx[i] * ph(n + 1, x));
        let v = P.integ.simpson(y, h);
        if (m === n) v += ((n + 1) ** 2 * Math.PI * Math.PI) / (2 * L * L);
        H[m][n] = H[n][m] = v;
      }
      const series = [];
      for (let k = 1; k <= MM; k++) series.push(Array.from(LA.eigh(H.slice(0, k).map((r) => r.slice(0, k)), { vectors: false }).values));
      const exact = P.q1d.fdEigen(pr.V, -L / 2, L / 2, 6000, 5, { vectors: false }).E;
      cache = { key: sim.p.pot, H, series, exact, ph, L };
    };
    sim.onDraw(() => {
      if (!cache || cache.key !== sim.p.pot) build();
      const { series, exact, H, L } = cache;
      const M0 = sim.p.M;
      const ev = LA.eigh(H.slice(0, M0).map((r) => r.slice(0, M0)));
      const pr = POTS[sim.p.pot];
      /* potencial y funciones de Ritz */
      CQ.draw.clear(cp);
      const top = exact[4] * 1.25 + 1;
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -L / 2, xmax: L / 2, ymin: Math.min(0, exact[0] - 1), ymax: top, xlabel: 'x', ylabel: 'E' });
      pl.frame();
      pl.fn((x) => Math.min(pr.V(x), top * 2), { color: '--ink-2', width: 2, n: 600 });
      for (let k = 0; k < Math.min(5, M0); k++) {
        CQ.drawLevels(pl, [{ E: exact[k], color: '--ink-3', dash: [3, 3], width: 1 }]);
        const E = ev.values[k];
        const f = (x) => ev.vectors.reduce((s, row, j) => s + row[k] * cache.ph(j + 1, x), 0);
        let mx = 0; for (let q = 0; q <= 200; q++) mx = Math.max(mx, Math.abs(f(-L / 2 + (L * q) / 200)));
        pl.fn((x) => E + (0.35 * (top / 6) * f(x)) / (mx || 1), { color: k % 2 ? '--c2' : '--c1', width: 1.8, n: 400 });
      }
      /* convergencia */
      CQ.draw.clear(cc);
      const pc = new CQ.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0.5, xmax: 40.5, ymin: Math.min(0, exact[0] - 0.5), ymax: exact[4] * 1.6 + 1, xlabel: 'M', ylabel: 'E_k(M)', title: 'cada nivel baja hacia su valor exacto' });
      pc.frame();
      for (let k = 0; k < 5; k++) {
        const pts = [];
        series.forEach((v, i) => { if (v[k] !== undefined) pts.push([i + 1, v[k]]); });
        pc.path(pts, { color: ['--c1', '--c2', '--c3', '--c4', '--c5'][k], width: 1.8 });
        pc.hline(exact[k], { color: ['--c1', '--c2', '--c3', '--c4', '--c5'][k], dash: [3, 3], width: 1 });
      }
      pc.vline(M0, { color: '--accent', label: 'M' });
      sim.set('e', Array.from({ length: Math.min(4, M0) }, (_, k) => `${CQ.fix(ev.values[k], 4)}/${CQ.fix(exact[k], 4)}`).join('<br>'));
    });
  });

  /* ======================================================================
     9.3 Perturbaciones del oscilador
     ====================================================================== */
  CQ.defineSim('perturbaciones', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const ce = sim.canvas({ aspect: 0.95 });
    sim.group('Perturbación (ħ = m = ω = 1)');
    sim.seg('type', { label: 'Término añadido a x²/2', options: [['x4', 'λx⁴'], ['x3', 'λx³']], value: 'x4', onInput: () => { const lm = sim.p.type === 'x3' ? 0.08 : 0.3; sim.ctl.lam.range(0, lm, 0.001); sim.ctl.lam.set(Math.min(sim.p.lam, lm), true); } });
    sim.slider('lam', { label: 'λ', min: 0, max: 0.3, value: 0.05, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.out('ex', '<i>E</i><sub>0</sub> numérica (exacta)', { hl: true });
    sim.out('p1', 'Primer orden');
    sim.out('p2', 'Segundo orden', { hl: true });
    sim.out('er', 'Error del segundo orden');
    const pt1 = (t, l) => (t === 'x4' ? 0.5 + 0.75 * l : 0.5);
    const pt2 = (t, l) => (t === 'x4' ? 0.5 + 0.75 * l - (21 / 8) * l * l : 0.5 - (11 / 8) * l * l);
    const box = (t) => (t === 'x4' ? [-8, 8] : [-6, 6]);
    const exact = (t, l) => { const [a, b] = box(t); return P.q1d.fdEigen((x) => 0.5 * x * x + l * (t === 'x4' ? x ** 4 : x ** 3), a, b, 1600, 1).E[0]; };
    let cache = { key: '' };
    sim.onDraw(() => {
      const t = sim.p.type, lmax = t === 'x3' ? 0.08 : 0.3, l = Math.min(sim.p.lam, lmax);
      if (cache.key !== t) {
        const pts = [];
        for (let q = 0; q <= 40; q++) { const ll = (lmax * q) / 40; pts.push([ll, exact(t, ll)]); }
        cache = { key: t, pts };
      }
      const [a, b] = box(t);
      const V = (x) => 0.5 * x * x + l * (t === 'x4' ? x ** 4 : x ** 3);
      const r = P.q1d.fdEigen(V, a, b, 1600, 1);
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -4, xmax: 4, ymin: -0.2, ymax: 4, xlabel: 'x', ylabel: 'V, E' });
      pl.frame();
      pl.fn((x) => 0.5 * x * x, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.fn(V, { color: '--ink', width: 2.2 });
      pl.hline(r.E[0], { color: '--accent', label: 'E₀' });
      let mx = 0; for (const v of r.psi[0]) mx = Math.max(mx, v * v);
      pl.xy(r.x, Array.from(r.psi[0], (v) => r.E[0] + (1.2 * v * v) / mx), { color: '--prob', width: 2, fill: '--prob', base: r.E[0], fillAlpha: 0.15 });
      CQ.draw.clear(ce);
      const yv = cache.pts.map((p) => p[1]).concat([pt2(t, lmax)]);
      const pe = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: lmax, ymin: Math.min(...yv) - 0.02, ymax: Math.max(...yv, pt1(t, lmax)) + 0.02, xlabel: 'λ', ylabel: 'E₀' });
      pe.frame();
      pe.path(cache.pts, { color: '--ink', width: 2.6 });
      pe.fn((x) => pt1(t, x), { color: '--c1', width: 1.8, dash: [6, 4] });
      pe.fn((x) => pt2(t, x), { color: '--c2', width: 1.8, dash: [3, 3] });
      pe.vline(l, { color: '--accent' });
      pe.legend([{ label: 'numérica', color: '--ink' }, { label: '1.er orden', color: '--c1', dash: [6, 4] }, { label: '2.º orden', color: '--c2', dash: [3, 3] }], t === 'x4' ? 'tl' : 'bl');
      sim.set('ex', f6(r.E[0]));
      sim.set('p1', f6(pt1(t, l)));
      sim.set('p2', f6(pt2(t, l)));
      sim.set('er', CQ.sci(pt2(t, l) - r.E[0], 3));
    });
  });
})();
