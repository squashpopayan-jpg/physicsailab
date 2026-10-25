/* Capítulo 26 — Diamagnetismo y paramagnetismo */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data, L = EM.lin;

  /* 26.3 Reglas de Hund */
  EM.defineSim('hund', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('l', { label: 'Capa', options: [[2, '3d (grupo del hierro)'], [3, '4f (tierras raras)']], value: 3 });
    sim.slider('n', { label: 'Número de electrones', min: 1, max: 13, step: 1, value: 7, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Término', { hl: true });
    sim.out('SLJ', 'S, L, J, g');
    sim.out('p', 'p = g√(J(J+1)) y solo espín');
    sim.onChange = (id) => { if (id === 'l') sim.ctl.n.range(1, 4 * +sim.p.l + 1, 1); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, l = +p.l, n = Math.min(Math.round(p.n), 4 * l + 1);
      EM.draw.clear(cv);
      const h = SS.hund(n, l), nm = 2 * l + 1;
      /* casillas m_l */
      const bw = Math.min(46, (W * 0.45) / nm), x0 = 20, y0 = 40;
      for (let i = 0; i < nm; i++) {
        const ml = l - i, x = x0 + i * bw;
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.strokeRect(x, y0, bw - 4, 56);
        EM.text(ctx, (ml > 0 ? '+' : ml < 0 ? '−' : '') + Math.abs(ml), x + (bw - 4) / 2, y0 + 74, { size: 12, align: 'center', color: '--ink-3' });
        const up = i < Math.min(n, nm), dn = n > nm && i < n - nm;
        if (up) EM.draw.arrow(ctx, x + (bw - 4) * 0.33, y0 + 48, x + (bw - 4) * 0.33, y0 + 8, { color: '--c1', width: 2.2 });
        if (dn) EM.draw.arrow(ctx, x + (bw - 4) * 0.67, y0 + 8, x + (bw - 4) * 0.67, y0 + 48, { color: '--c2', width: 2.2 });
      }
      EM.text(ctx, 'm_l', x0, y0 + 92, { size: 12, color: '--ink-3' });
      EM.text(ctx, h.term, x0, y0 + 140, { size: 30, weight: 700, color: '--accent', family: EM.FONT_MATH });
      /* p frente a n */
      const x1 = W * 0.5;
      const pl = new EM.Plot(ctx, { x: x1, y: 0, w: W - x1, h: H, xmin: 0, xmax: 4 * l + 2, ymin: 0, ymax: l === 3 ? 15 : 9, xlabel: 'electrones en la capa', ylabel: 'p (magnetones de Bohr)' });
      pl.frame();
      const ns = Array.from({ length: 4 * l + 1 }, (_, i) => i + 1);
      pl.xy(ns, ns.map((k) => SS.hund(k, l).p), { color: '--c1', width: 2 });
      pl.xy(ns, ns.map((k) => SS.hund(k, l).pSpin), { color: '--c3', width: 1.6, dash: [5, 4] });
      const dat = l === 3 ? DATA.pRare : DATA.pIron;
      for (const [, [k, pm]] of Object.entries(dat)) pl.dot(k, pm, { color: '--c2', r: 4.5 });
      pl.vline(n, { color: '--accent' });
      pl.legend([{ label: 'g√(J(J+1))', color: '--c1' }, { label: 'solo espín 2√(S(S+1))', color: '--c3', dash: [5, 4] }, { label: 'medido (Kittel)', color: '--c2', kind: 'dot' }], 'tl');
      sim.set('t', h.term);
      sim.set('SLJ', `S = ${h.S}, L = ${h.L}, J = ${h.J}, g = ${EM.fix(h.g, 4)}`);
      sim.set('p', EM.fix(h.p, 3) + ' y ' + EM.fix(h.pSpin, 3));
    });
  });

  /* 26.4 Funciones de Brillouin */
  EM.defineSim('brillouin', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('x', { label: 'B/T', min: 0.05, max: 4, step: 0.01, value: 1, unit: 'T/K', fmt: (v) => v.toFixed(2) });
    sim.out('m', 'M/M_s para J = 3/2, 5/2, 7/2', { hl: true });
    const Js = [[1.5, 'Cr³⁺ (J = 3/2)', '--c1'], [2.5, 'Fe³⁺ (J = 5/2)', '--c2'], [3.5, 'Gd³⁺ (J = 7/2)', '--c3']];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 1.05, xlabel: 'B/T (T/K)', ylabel: 'M/M_s' });
      pl.frame();
      const arg = (J, bt) => (2 * SS.muB * J * bt) / SS.kB;
      for (const [J, lab, c] of Js) pl.fn((bt) => SS.brillouin(J, arg(J, bt)), { color: c, width: 2.4 });
      pl.fn((bt) => SS.langevin(arg(3.5, bt)), { color: '--ink-3', width: 1.3, dash: [5, 4] });
      pl.fn((bt) => (arg(3.5, bt) * (3.5 + 1)) / (3 * 3.5), { color: '--c3', width: 1, dash: [2, 3], to: 0.8 });
      pl.vline(p.x, { color: '--accent' });
      pl.legend(Js.map(([, lab, c]) => ({ label: lab, color: c })).concat([{ label: 'Langevin (mismo momento máximo que Gd³⁺)', color: '--ink-3', dash: [5, 4] }]), 'br');
      sim.set('m', Js.map(([J]) => EM.fix(SS.brillouin(J, arg(J, p.x)), 3)).join(', '));
    });
  });

  /* 26.6 Desmagnetización adiabática */
  EM.defineSim('desmagnetizacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ti', { label: 'Temperatura inicial', min: 0.3, max: 4, step: 0.05, value: 1, unit: 'K', fmt: (v) => v.toFixed(2) });
    sim.slider('Bi', { label: 'Campo inicial', min: 0.2, max: 6, step: 0.05, value: 2, unit: 'T', fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'Campo interno', min: 0.005, max: 0.1, step: 0.001, value: 0.02, unit: 'T', fmt: (v) => v.toFixed(3) });
    sim.out('Tf', 'Temperatura final', { hl: true });
    sim.out('dS', 'Entropía extraída / R ln 2');
    const S = (T, B, b) => SS.paraS(0.5, (2 * SS.muB * Math.hypot(B, b)) / (SS.kB * T)) / Math.log(2);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.001, xmax: 5, xlog: true, ymin: 0, ymax: 1.08, xlabel: 'T (K)', ylabel: 'S/(R ln 2)' });
      pl.frame();
      const Bs = [0, 0.5, 1, 2, 4];
      const cols = ['--c6', '--c3', '--c5', '--c1', '--c2'];
      Bs.forEach((B, i) => pl.fn((T) => S(T, B, p.b), { color: cols[i], width: 1.8 }));
      pl.fn((T) => S(T, p.Bi, p.b), { color: '--ink', width: 2.6 });
      const S0 = S(p.Ti, 0, p.b), S1 = S(p.Ti, p.Bi, p.b);
      const Tf = L.brent((T) => S(T, 0, p.b) - S1, 1e-6, p.Ti);
      pl.dot(p.Ti, S0, { color: '--accent', r: 6, label: 'A' });
      pl.dot(p.Ti, S1, { color: '--accent', r: 6, label: 'B' });
      pl.dot(Tf, S1, { color: '--accent', r: 6, label: 'C' });
      pl.arrow(p.Ti, S0, p.Ti, S1 + 0.01, { color: '--accent', width: 1.8 });
      pl.arrow(p.Ti, S1, Tf * 1.05, S1, { color: '--accent', width: 1.8 });
      pl.legend(Bs.map((B, i) => ({ label: 'B = ' + B + ' T', color: cols[i] })), 'tl');
      sim.set('Tf', EM.si(Tf, 'K', 3) + ' (fórmula T_i b/√(B_i² + b²): ' + EM.si((p.Ti * p.b) / Math.hypot(p.Bi, p.b), 'K', 3) + ')');
      sim.set('dS', EM.fix(S0 - S1, 3));
    });
  });
})();
