/* Capítulo 11 — Análisis dimensional y semejanza */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;

  /* 11.1 Constructor de grupos Π */
  const V3 = (m, l, t) => [m, l, t];
  const PROB = {
    arrastre: { n: 'Arrastre sobre una esfera', v: [['F', V3(1, 1, -2)], ['ρ', V3(1, -3, 0)], ['V', V3(0, 1, -1)], ['D', V3(0, 1, 0)], ['μ', V3(1, -1, -1)]], rep: [1, 2, 3] },
    tuberia: { n: 'Caída de presión en un tubo', v: [['Δp', V3(1, -1, -2)], ['ρ', V3(1, -3, 0)], ['V', V3(0, 1, -1)], ['D', V3(0, 1, 0)], ['μ', V3(1, -1, -1)], ['L', V3(0, 1, 0)], ['ε', V3(0, 1, 0)]], rep: [1, 2, 3] },
    pendulo: { n: 'Periodo de un péndulo', v: [['T', V3(0, 0, 1)], ['ℓ', V3(0, 1, 0)], ['m', V3(1, 0, 0)], ['g', V3(0, 1, -2)]], rep: [1, 2, 3] },
    gota: { n: 'Frecuencia de una gota que oscila', v: [['f', V3(0, 0, -1)], ['R', V3(0, 1, 0)], ['ρ', V3(1, -3, 0)], ['γ', V3(1, 0, -2)]], rep: [1, 2, 3] },
    explosion: { n: 'Radio de una explosión (Taylor)', v: [['R', V3(0, 1, 0)], ['E', V3(1, 2, -2)], ['ρ', V3(1, -3, 0)], ['t', V3(0, 0, 1)]], rep: [1, 2, 3] },
    ondas: { n: 'Velocidad de ondas en el agua', v: [['c', V3(0, 1, -1)], ['λ', V3(0, 1, 0)], ['h', V3(0, 1, 0)], ['g', V3(0, 1, -2)], ['ρ', V3(1, -3, 0)], ['γ', V3(1, 0, -2)]], rep: [1, 3, 4] },
    helice: { n: 'Potencia de una hélice', v: [['P', V3(1, 2, -3)], ['ρ', V3(1, -3, 0)], ['D', V3(0, 1, 0)], ['n', V3(0, 0, -1)], ['V', V3(0, 1, -1)], ['μ', V3(1, -1, -1)]], rep: [1, 2, 3] },
    terminal: { n: 'Velocidad terminal de una esfera', v: [['V_t', V3(0, 1, -1)], ['D', V3(0, 1, 0)], ['ρ', V3(1, -3, 0)], ['Δρ', V3(1, -3, 0)], ['μ', V3(1, -1, -1)], ['g', V3(0, 1, -2)]], rep: [1, 2, 4] }
  };
  EM.defineSim('buckingham', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('pb', { label: 'Problema', options: Object.entries(PROB).map(([k, v]) => [k, v.n]), value: 'arrastre' });
    sim.group('Variables repetidas');
    const MAXV = 7;
    for (let i = 0; i < MAXV; i++) sim.check('r' + i, { label: '—', value: false });
    sim.out('n', 'Variables · rango · grupos', { hl: true });
    sim.out('st', 'Estado');
    const setup = () => {
      const P = PROB[sim.p.pb];
      for (let i = 0; i < MAXV; i++) {
        const c = sim.ctl['r' + i];
        if (i < P.v.length) { c.show(true); c.el.querySelector('label').textContent = P.v[i][0]; c.set(P.rep.includes(i), true); }
        else { c.show(false); c.set(false, true); }
      }
    };
    sim.onChange = (id) => { if (id === 'pb') setup(); };
    setup();
    const fmtPi = (names, exp) => {
      /* numerador y denominador */
      const num = [], den = [];
      exp.forEach((e, i) => { if (e === 0) return; const s = names[i] + (Math.abs(e) !== 1 ? '^{' + Math.abs(e) + '}' : ''); (e > 0 ? num : den).push(s); });
      return { num: num.join(' ') || '1', den: den.join(' ') };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = PROB[p.pb];
      EM.draw.clear(cv);
      const names = P.v.map((q) => q[0]), dims = P.v.map((q) => q[1]);
      const rep = []; for (let i = 0; i < P.v.length; i++) if (p['r' + i]) rep.push(i);
      const res = FL.piGroups(dims, rep);
      /* matriz dimensional */
      const x0 = 20, y0 = 26, cw = Math.min(64, (W - 60) / (names.length + 1)), rh = 24;
      EM.text(ctx, 'Matriz dimensional', x0, 16, { size: 12, weight: 650, color: '--ink-2' });
      ['M', 'L', 'T'].forEach((d, r) => EM.text(ctx, d, x0 + 6, y0 + (r + 1.6) * rh, { size: 13, weight: 650, color: '--ink-2' }));
      names.forEach((n, c) => {
        const x = x0 + (c + 1) * cw;
        if (rep.includes(c)) { ctx.fillStyle = EM.alpha('--accent', 0.14); ctx.fillRect(x - cw / 2 + 4, y0 + 2, cw - 8, rh * 4); }
        EM.text(ctx, n, x, y0 + 0.7 * rh, { size: 14, italic: true, family: EM.FONT_MATH, align: 'center', weight: 650 });
        dims[c].forEach((v, r) => EM.text(ctx, EM.minus(v), x, y0 + (r + 1.6) * rh, { size: 13, align: 'center', mono: true, color: v === 0 ? '--ink-3' : '--ink' }));
      });
      /* grupos */
      let y = y0 + 5.2 * rh;
      if (!res.ok) EM.text(ctx, 'Elija ' + res.rank + ' variables repetidas que contengan M, L y T y no formen un grupo entre sí.', x0, y, { size: 13, color: '--c2' });
      else res.groups.forEach((gr, k) => {
        const f = fmtPi(names, gr.exp);
        const xs = x0 + 10;
        EM.text(ctx, 'Π' + (k + 1) + ' =', xs, y + 14, { size: 16, family: EM.FONT_MATH, color: '--accent', weight: 650 });
        const wn = EM.textWidth(ctx, f.num, { size: 16, family: EM.FONT_MATH, italic: true }), wd = f.den ? EM.textWidth(ctx, f.den, { size: 16, family: EM.FONT_MATH, italic: true }) : 0, wb = Math.max(wn, wd) + 10, xc = xs + 60 + wb / 2;
        if (f.den) {
          EM.text(ctx, f.num, xc, y + 4, { size: 16, family: EM.FONT_MATH, italic: true, align: 'center' });
          ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xc - wb / 2, y + 10); ctx.lineTo(xc + wb / 2, y + 10); ctx.stroke();
          EM.text(ctx, f.den, xc, y + 28, { size: 16, family: EM.FONT_MATH, italic: true, align: 'center' });
        } else EM.text(ctx, f.num, xs + 60, y + 14, { size: 16, family: EM.FONT_MATH, italic: true });
        y += 48;
      });
      sim.set('n', P.v.length + ' · ' + res.rank + ' · ' + (P.v.length - res.rank));
      sim.set('st', res.ok ? 'grupos independientes construidos' : 'elección de variables repetidas inválida');
    });
  });

  /* 11.2 Calculadora de números adimensionales */
  const FLU = { aire0: ['Aire, nivel del mar (15 °C)', 1.225, 1.789e-5, 340.3, null], aireP: ['Aire, Popayán (19 °C)', 0.977, 1.81e-5, 342.6, null], agua: ['Agua (20 °C)', 998.2, 1.002e-3, 1482, 0.0727], mar: ['Agua de mar', 1025, 1.07e-3, 1521, 0.0735], glicerina: ['Glicerina', 1261, 1.41, 1904, 0.0634] };
  const EXN = {
    bacteria: ['Bacteria nadando (E. coli)', 'agua', 2e-6, 3e-5], gota: ['Gota de lluvia de 2 mm', 'aire0', 0.002, 6.5], mosquito: ['Mosquito', 'aire0', 0.003, 1],
    squash: ['Pelota de squash (Popayán)', 'aireP', 0.04, 30], nadador: ['Nadador olímpico', 'agua', 2, 2], auto: ['Automóvil en carretera', 'aire0', 4.5, 27], avion: ['Avión de línea en crucero', 'aire0', 4, 240], barco: ['Buque de carga', 'mar', 200, 10], rio: ['Río Cauca (profundidad 3 m)', 'agua', 3, 1.5]
  };
  EM.defineSim('numeros-adim', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('ex', { label: 'Ejemplo', options: Object.entries(EXN).map(([k, v]) => [k, v[0]]), value: 'squash' });
    sim.select('f', { label: 'Fluido', options: Object.entries(FLU).map(([k, v]) => [k, v[0]]), value: 'aireP' });
    sim.slider('L', { label: 'Longitud característica <i>L</i>', min: 1e-6, max: 500, step: 0, value: 0.04, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.slider('V', { label: 'Velocidad <i>V</i>', min: 1e-5, max: 400, step: 0, value: 30, log: true, fmt: (v) => EM.sci(v, 3) + ' m/s' });
    sim.onChange = (id) => { if (id === 'ex') { const e = EXN[sim.p.ex]; sim.ctl.f.set(e[1], true); sim.ctl.L.set(e[2], true); sim.ctl.V.set(e[3], true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = FLU[p.f];
      EM.draw.clear(cv);
      const [, rho, mu, c, gam] = f, L = p.L, V = p.V;
      const nums = [
        ['Reynolds', (rho * V * L) / mu, [1e-6, 1e10], [[1, 'Stokes'], [2300, ''], [5e5, 'turbulento']]],
        ['Froude', V / Math.sqrt(g * L), [1e-4, 1e4], [[1, 'crítico']]],
        ['Mach', V / c, [1e-6, 10], [[0.3, '0.3'], [1, '1']]],
        ['Weber (con γ del agua)', (rho * V * V * L) / (gam || 0.0727), [1e-8, 1e12], [[1, '']]],
        ['Capilar μV/γ', (mu * V) / (gam || 0.0727), [1e-10, 1e4], [[1, '']]],
        ['Bond (gota de este fluido)', ((rho > 100 ? rho : 998.2) * g * L * L) / (gam || 0.0727), [1e-10, 1e8], [[1, 'ℓ_c']]]
      ];
      const rowH = (H - 20) / nums.length, x0 = W * 0.3, x1 = W - 20;
      nums.forEach(([n, v, [a, b], marks], i) => {
        const y = 14 + i * rowH + rowH * 0.5, X = (q) => x0 + ((Math.log10(q) - Math.log10(a)) / (Math.log10(b) - Math.log10(a))) * (x1 - x0);
        EM.text(ctx, n, 12, y + 4, { size: 12.5, color: '--ink-2', weight: 600 });
        ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        for (const [m, lab] of marks) { ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(m), y - 9); ctx.lineTo(X(m), y + 9); ctx.stroke(); if (lab) EM.text(ctx, lab, X(m), y - 12, { size: 10, align: 'center', color: '--ink-3' }); }
        const xv = Math.min(x1, Math.max(x0, X(v)));
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(xv, y, 6.5, 0, 7); ctx.fill();
        EM.text(ctx, EM.sci(v, 3), xv, y + 22, { size: 12, align: 'center', mono: true, color: '--ink', halo: true });
      });
    });
  });

  /* 11.3 Modelo a escala de un barco */
  EM.defineSim('modelo-escala', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Lp', { label: 'Eslora del buque', min: 30, max: 300, step: 1, value: 120, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('Vp', { label: 'Velocidad del buque', min: 2, max: 16, step: 0.1, value: 10, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('lam', { label: 'Escala λ (buque/modelo)', min: 10, max: 100, step: 1, value: 40, fmt: (v) => '1 : ' + v.toFixed(0) });
    sim.out('Vm', 'Velocidad del modelo (igual Froude)', { hl: true });
    sim.out('Re', 'Reynolds del modelo · del buque');
    sim.out('CF', '<i>C</i><sub>F</sub> (ITTC 1957) modelo · buque');
    sim.out('R', 'Resistencia estimada del buque');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Fr = p.Vp / Math.sqrt(g * p.Lp), Vm = p.Vp / Math.sqrt(p.lam), Lm = p.Lp / p.lam;
      const nup = 1.19e-6, num = 1.14e-6, Rep = (p.Vp * p.Lp) / nup, Rem = (Vm * Lm) / num;
      const CF = (Re) => 0.075 / Math.pow(Math.log10(Re) - 2, 2);
      /* coeficiente residual ilustrativo (olas), función de Fr */
      const CR = 0.0006 + 0.03 * Math.pow(Math.max(0, Fr - 0.18), 2) + 0.2 * Math.pow(Math.max(0, Fr - 0.3), 3);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e5, xmax: 1e10, ymin: 0, ymax: 0.012, xlog: true, xlabel: 'número de Reynolds', ylabel: 'coeficiente de resistencia' });
      pl.frame();
      pl.fn(CF, { color: '--c1', width: 2.2 });
      pl.fn((Re) => CF(Re) + CR, { color: '--accent', width: 1.6, dash: [5, 4] });
      pl.dot(Rem, CF(Rem) + CR, { color: '--accent', r: 6, label: 'modelo (medido)' });
      pl.dot(Rep, CF(Rep) + CR, { color: '--c2', r: 6, label: 'buque (extrapolado)' });
      pl.dot(Rem, CF(Rem), { color: '--c1', r: 4 }); pl.dot(Rep, CF(Rep), { color: '--c1', r: 4 });
      pl.arrow(Rem, CF(Rem) + CR, Rep, CF(Rep) + CR, { color: '--ink-3', width: 1.2, dash: [3, 3] });
      pl.legend([{ label: 'fricción C_F = 0.075/(log Re − 2)²', color: '--c1' }, { label: 'C_F + C_R (residual, igual en ambos)', color: '--accent', dash: [5, 4] }], 'tr');
      const S = 0.16 * p.Lp * p.Lp, Rt = 0.5 * 1025 * S * p.Vp * p.Vp * (CF(Rep) + CR);
      sim.set('Vm', EM.fix(Vm, 3) + ' m/s (Fr = ' + EM.fix(Fr, 3) + '; modelo de ' + EM.fix(Lm, 2) + ' m)');
      sim.set('Re', EM.sci(Rem, 3) + ' · ' + EM.sci(Rep, 3));
      sim.set('CF', EM.fix(CF(Rem) * 1000, 3) + ' · ' + EM.fix(CF(Rep) * 1000, 3) + ' ×10⁻³');
      sim.set('R', EM.fix(Rt / 1000, 0) + ' kN · potencia efectiva ' + EM.fix((Rt * p.Vp) / 1e6, 2) + ' MW (C_R ilustrativo)');
    });
  });

  /* 11.4 Explosión de Taylor */
  EM.defineSim('taylor-explosion', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('E', { label: 'Energía supuesta', min: 1, max: 100, step: 0.5, value: 16, unit: 'kt TNT', fmt: (v) => v.toFixed(1) });
    sim.slider('rho', { label: 'Densidad del aire', min: 0.9, max: 1.4, step: 0.01, value: 1.25, unit: 'kg/m³', fmt: (v) => v.toFixed(2) });
    sim.out('fit', 'Pendiente ajustada libremente', { hl: true });
    sim.out('Ebest', 'Energía que mejor ajusta (pendiente 2/5)');
    sim.out('res', 'Error cuadrático medio de ln <i>R</i>');
    const d = FL.TAYLOR, S = 1.033;
    const xs = d.map((q) => Math.log(q[0] * 1e-3)), ys = d.map((q) => Math.log(q[1])), n = xs.length;
    const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const slope = sxy / sxx, K = Math.exp(my - 0.4 * mx);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const E = p.E * 4.184e12, R = (t) => S * Math.pow((E * t * t) / p.rho, 0.2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.05, xmax: 100, ymin: 5, ymax: 300, xlog: true, ylog: true, xlabel: 't (ms)', ylabel: 'R (m)' });
      pl.frame();
      pl.fn((tm) => R(tm * 1e-3), { color: '--accent', width: 2.4 });
      for (const q of d) pl.dot(q[0], q[1], { color: '--c2', r: 4 });
      pl.legend([{ label: 'R = S (E t²/ρ)^{1/5}', color: '--accent' }, { label: 'fotografías (Taylor, 1950)', color: '--c2', kind: 'dot' }], 'tl');
      let ss = 0; for (let i = 0; i < n; i++) ss += (ys[i] - Math.log(R(d[i][0] * 1e-3))) ** 2;
      const Eb = (p.rho * Math.pow(K / S, 5)) / 4.184e12;
      sim.set('fit', EM.fix(slope, 4) + ' (teoría: 0.4)');
      sim.set('Ebest', EM.fix(Eb, 2) + ' kt = ' + EM.sci(Eb * 4.184e12, 3) + ' J');
      sim.set('res', EM.fix(Math.sqrt(ss / n), 4));
    });
  });
})();
