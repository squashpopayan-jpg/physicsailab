/* Capítulo 15 — Flujo en tuberías */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, W = FL.water;
  const nu20 = W.nu(293.15), rho20 = W.rho(293.15);

  /* 15.1 Diagrama de Moody */
  EM.defineSim('moody', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.slider('Re', { label: 'Número de Reynolds', min: 600, max: 1e8, step: 0, value: 1.24e5, log: true, fmt: (v) => EM.sci(v, 3) });
    sim.slider('e', { label: 'Rugosidad relativa ε/<i>D</i>', min: 1e-6, max: 0.05, step: 0, value: 1.5e-3, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('f', '<i>f</i> (Colebrook)', { hl: true });
    sim.out('h', 'Haaland · error');
    sim.out('s', 'Swamee–Jain · error');
    sim.out('c', 'Churchill · error');
    sim.out('r', 'Régimen');
    const EPS = [0, 1e-6, 1e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 0.01, 0.02, 0.05];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 600, xmax: 1e8, ymin: 0.008, ymax: 0.1, xlog: true, ylog: true, xlabel: 'número de Reynolds', ylabel: 'factor de fricción f', yfmt: (v) => EM.fix(v, 3) });
      pl.frame();
      pl.band(2300, 4000, { color: '--c2', alpha: 0.08 });
      pl.fn((Re) => 64 / Re, { color: '--c2', width: 2, to: 2300 });
      for (const e of EPS) pl.fn((Re) => FL.colebrook(Re, e), { color: e === 0 ? '--ink' : '--c1', width: e === 0 ? 1.8 : 1.1, from: 4000 });
      for (const e of EPS.slice(4)) pl.label(1.3e8 * 0.6, FL.colebrook(1e8, e), String(e), { size: 9.5, color: '--ink-3', align: 'right', dy: -2 });
      pl.fn((Re) => FL.colebrook(Re, p.e), { color: '--accent', width: 2.6, from: 4000 });
      const f = p.Re < 2300 ? 64 / p.Re : FL.colebrook(p.Re, p.e);
      pl.dot(p.Re, f, { color: '--accent', r: 6 });
      pl.label(900, 0.09, 'laminar f = 64/Re', { size: 11, color: '--c2' });
      pl.label(3e6, 0.0095, 'tubo liso', { size: 11, color: '--ink' });
      const err = (x) => (x >= f ? '+' : '') + EM.fix((100 * (x - f)) / f, 2) + ' %';
      const ok = p.Re > 4000;
      sim.set('f', EM.fix(f, 5));
      sim.set('h', ok ? EM.fix(FL.haaland(p.Re, p.e), 5) + ' · ' + err(FL.haaland(p.Re, p.e)) : '—');
      sim.set('s', ok ? EM.fix(FL.swameeJain(p.Re, p.e), 5) + ' · ' + err(FL.swameeJain(p.Re, p.e)) : '—');
      sim.set('c', EM.fix(FL.churchill(p.Re, p.e), 5) + ' · ' + err(FL.churchill(p.Re, p.e)));
      /* régimen turbulento: liso si ε+ < 5, rugoso si ε+ > 70 */
      const ep = p.e * p.Re * Math.sqrt(f / 8);
      sim.set('r', p.Re < 2300 ? 'laminar' : p.Re < 4000 ? 'transición laminar–turbulenta' : ep < 5 ? 'turbulento, hidráulicamente liso (ε⁺ = ' + EM.fix(ep, 1) + ')' : ep > 70 ? 'turbulento, completamente rugoso (ε⁺ = ' + EM.fix(ep, 0) + ')' : 'turbulento, transición (ε⁺ = ' + EM.fix(ep, 1) + ')');
    });
  });

  /* 15.2 Los tres problemas */
  const IDS = [['½″', 15.8], ['¾″', 20.9], ['1″', 26.6], ['1¼″', 35.1], ['1½″', 40.9], ['2″', 52.5], ['2½″', 62.7], ['3″', 77.9], ['4″', 102.3], ['6″', 154.1], ['8″', 202.7], ['10″', 254.5], ['12″', 303.2], ['16″', 381], ['20″', 477.8], ['24″', 574.6]];
  EM.defineSim('problema-tuberia', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.seg('t', { label: 'Problema', options: [['1', 'Tipo 1: pérdida'], ['2', 'Tipo 2: caudal'], ['3', 'Tipo 3: diámetro']], value: '1' });
    sim.select('mat', { label: 'Material', options: Object.entries(FL.ROUGH).map(([k, v]) => [k, v[0] + ' (ε = ' + EM.fix(v[1] * 1000, 4) + ' mm)']), value: 'galv' });
    sim.slider('L', { label: 'Longitud', min: 5, max: 5000, step: 5, value: 200, unit: 'm', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Diámetro interior', min: 10, max: 600, step: 0.1, value: 102.3, unit: 'mm', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('Q', { label: 'Caudal', min: 0.05, max: 500, step: 0, value: 10, unit: 'L/s', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.slider('h', { label: 'Pérdida de carga disponible', min: 0.1, max: 100, step: 0.1, value: 3.44, unit: 'm', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('K', { label: 'Suma de coeficientes de pérdidas menores Σ<i>K</i>', min: 0, max: 50, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 80, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('res', 'Resultado', { hl: true });
    sim.out('V', 'Velocidad · Reynolds · <i>f</i>');
    sim.out('hp', 'Pérdida por fricción · por accesorios');
    const sync = () => { const t = sim.p.t; sim.ctl.Q.show(t !== '2'); sim.ctl.h.show(t !== '1'); sim.ctl.D.show(t !== '3'); };
    sim.onChange = sync; sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, eps = FL.ROUGH[p.mat][1], nu = W.nu(p.T + 273.15);
      EM.draw.clear(cv);
      let D = p.D / 1000, Q = p.Q / 1000, res;
      if (p.t === '2') Q = FL.pipeQ(p.h, D, p.L, eps, nu, p.K);
      if (p.t === '3') D = FL.pipeD(p.h, Q, p.L, eps, nu, p.K);
      const r = FL.pipeLoss(Q, D, p.L, eps, nu, p.K);
      if (p.t === '1') res = 'h = ' + EM.fix(r.h, 3) + ' m (' + EM.fix((r.h * W.rho(p.T + 273.15) * g) / 1000, 2) + ' kPa)';
      else if (p.t === '2') res = 'Q = ' + EM.fix(Q * 1000, 3) + ' L/s';
      else { const c = IDS.find((q) => q[1] >= D * 1000); res = 'D = ' + EM.fix(D * 1000, 1) + ' mm → comercial ' + (c ? c[0] + ' (' + c[1] + ' mm)' : 'mayor que 24″'); }
      /* curva de pérdida contra caudal (o contra diámetro en el tipo 3) */
      if (p.t !== '3') {
        const qmax = Math.max(Q * 2.2, 1e-5);
        const hmax = FL.pipeLoss(qmax, D, p.L, eps, nu, p.K).h;
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: qmax * 1000, ymin: 0, ymax: hmax * 1.05, xlabel: 'Q (L/s)', ylabel: 'pérdida h (m)' });
        pl.frame();
        pl.fn((q) => FL.pipeLoss(Math.max(q, 1e-9) / 1000, D, p.L, eps, nu, p.K).h, { color: '--accent', width: 2.4 });
        pl.fn((q) => FL.pipeLoss(Math.max(q, 1e-9) / 1000, D, p.L, eps, nu, 0).h, { color: '--c1', width: 1.4, dash: [5, 4] });
        if (p.t === '2') pl.hline(p.h, { color: '--c2', label: 'carga disponible' });
        pl.dot(Q * 1000, r.h, { color: '--accent', r: 6 });
        pl.legend([{ label: 'total', color: '--accent' }, { label: 'solo fricción', color: '--c1', dash: [5, 4] }], 'tl');
      } else {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: D * 500, xmax: D * 2000, ymin: 0, ymax: p.h * 4, xlabel: 'D (mm)', ylabel: 'pérdida h (m)' });
        pl.frame();
        pl.fn((dm) => FL.pipeLoss(Q, dm / 1000, p.L, eps, nu, p.K).h, { color: '--accent', width: 2.4 });
        pl.hline(p.h, { color: '--c2', label: 'pérdida admisible' });
        for (const [n, d] of IDS) if (d > D * 500 && d < D * 2000) { pl.vline(d, { color: '--grid-2' }); pl.label(d, p.h * 3.7, n, { size: 10, color: '--ink-3', align: 'center' }); }
        pl.dot(D * 1000, p.h, { color: '--accent', r: 6 });
      }
      sim.set('res', res);
      sim.set('V', EM.fix(r.V, 3) + ' m/s · ' + EM.sci(r.Re, 3) + ' · ' + EM.fix(r.f, 5));
      sim.set('hp', EM.fix(r.hf, 3) + ' m · ' + EM.fix(r.hm, 3) + ' m');
    });
  });

  /* 15.3 Red por Hardy Cross */
  EM.defineSim('hardy-cross', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('D3', { label: 'Diámetro del tubo central B–E', min: 50, max: 300, step: 5, value: 150, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.button('Iterar', () => step(), { icon: 'step' });
    sim.button('Resolver', () => { for (let i = 0; i < 40; i++) step(); });
    sim.button('Reiniciar', () => reset(), { icon: 'reset' });
    sim.out('it', 'Iteraciones', { hl: true });
    sim.out('res', 'Desequilibrio de pérdidas (máximo por circuito)');
    sim.out('pB', 'Carga en los nudos E y F (A a 50 m)');
    const N = { A: [0, 1], B: [1, 1], C: [2, 1], D: [0, 0], E: [1, 0], F: [2, 0] };
    const PIPES = [['A', 'B', 0.25], ['B', 'C', 0.2], ['A', 'D', 0.2], ['B', 'E', 0.15], ['C', 'F', 0.15], ['D', 'E', 0.2], ['E', 'F', 0.2]];
    const LOOPS = [[[0, 1], [3, 1], [5, -1], [2, -1]], [[1, 1], [4, 1], [6, -1], [3, -1]]];
    const DEM = { A: -0.1, C: 0.03, E: 0.02, F: 0.05 };
    const Lp = 500, eps = 1e-4;
    let Q, hist, it;
    const rOf = (i, q) => { const D = i === 3 ? sim.p.D3 / 1000 : PIPES[i][2], A = (Math.PI * D * D) / 4, V = Math.abs(q) / A, Re = Math.max(1, (V * D) / nu20), f = Re < 2300 ? 64 / Re : FL.colebrook(Re, eps / D); return (8 * f * Lp) / (g * Math.PI * Math.PI * Math.pow(D, 5)); };
    const imbalance = () => LOOPS.map((lp) => Math.abs(lp.reduce((s, [i, sg]) => s + sg * rOf(i, Q[i]) * Q[i] * Math.abs(Q[i]), 0)));
    const reset = () => { Q = [0.06, 0.04, 0.04, 0.02, 0.01, 0.04, 0.04]; it = 0; hist = [Math.max(...imbalance())]; };
    const step = () => { const pipes = Q.map((q, i) => ({ r: rOf(i, q), Q: q })); Q = FL.hardyCross(pipes, LOOPS, 2, 1); it++; hist.push(Math.max(...imbalance())); };
    reset();
    sim.onChange = () => { hist.push(Math.max(...imbalance())); };
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const X = (x) => 40 + x * (Wc * 0.55 - 80) / 2, Y = (y) => H * 0.82 - y * (H * 0.62);
      PIPES.forEach(([a, b, D0], i) => {
        const D = i === 3 ? sim.p.D3 / 1000 : D0, pa = N[a], pb = N[b];
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 2 + D * 40; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(pa[0]), Y(pa[1])); ctx.lineTo(X(pb[0]), Y(pb[1])); ctx.stroke();
        const q = Q[i], s = q >= 0 ? 1 : -1, mx = (X(pa[0]) + X(pb[0])) / 2, my = (Y(pa[1]) + Y(pb[1])) / 2, dx = (X(pb[0]) - X(pa[0])) * s, dy = (Y(pb[1]) - Y(pa[1])) * s, L = Math.hypot(dx, dy);
        EM.draw.arrow(ctx, mx - (dx / L) * 14, my - (dy / L) * 14, mx + (dx / L) * 14, my + (dy / L) * 14, { color: '--accent', width: 2.4 });
        EM.text(ctx, EM.fix(Math.abs(q) * 1000, 1), mx + (dy / L) * 14 + 4, my - (dx / L) * 14 + 4, { size: 11.5, color: '--accent', halo: true, weight: 650 });
      });
      for (const [n, [x, y]] of Object.entries(N)) {
        ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(X(x), Y(y), 7, 0, 7); ctx.fill();
        EM.text(ctx, n, X(x) - 4, Y(y) + 4, { size: 11, color: '--canvas', weight: 700 });
        if (DEM[n]) EM.text(ctx, (DEM[n] < 0 ? '+' : '−') + EM.fix(Math.abs(DEM[n]) * 1000, 0) + ' L/s', X(x), Y(y) + (y ? -16 : 24), { size: 11, align: 'center', color: DEM[n] < 0 ? '--c3' : '--c2' });
      }
      EM.text(ctx, 'I', X(0.5), Y(0.5) + 4, { size: 15, align: 'center', color: '--ink-3', weight: 700 }); EM.text(ctx, 'II', X(1.5), Y(0.5) + 4, { size: 15, align: 'center', color: '--ink-3', weight: 700 });
      const pl = new EM.Plot(ctx, { x: Wc * 0.58, y: 0, w: Wc * 0.42, h: H, xmin: 0, xmax: Math.max(8, it), ymin: 1e-12, ymax: 100, ylog: true, xlabel: 'iteración', ylabel: 'Σ rQ|Q| (m)' });
      pl.frame();
      pl.path(hist.map((h, i) => [Math.min(i, it), Math.max(1e-12, h)]), { color: '--accent', width: 2 });
      hist.forEach((h, i) => pl.dot(Math.min(i, it), Math.max(1e-12, h), { color: '--accent', r: 3 }));
      const hE = 50 - rOf(2, Q[2]) * Q[2] * Math.abs(Q[2]) - rOf(5, Q[5]) * Q[5] * Math.abs(Q[5]), hF = hE - rOf(6, Q[6]) * Q[6] * Math.abs(Q[6]);
      sim.set('it', String(it));
      sim.set('res', EM.sci(hist[hist.length - 1], 2) + ' m');
      sim.set('pB', EM.fix(hE, 2) + ' m · ' + EM.fix(hF, 2) + ' m');
    });
  });

  /* 15.4 Golpe de ariete */
  const MAT = { acero: ['Acero', 200e9], ductil: ['Hierro dúctil', 170e9], pvc: ['PVC', 3e9], pead: ['Polietileno (PEAD)', 0.9e9] };
  EM.defineSim('golpe-ariete', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.select('m', { label: 'Material de la tubería', options: Object.entries(MAT).map(([k, v]) => [k, v[0]]), value: 'acero' });
    sim.slider('D', { label: 'Diámetro', min: 0.05, max: 1.5, step: 0.01, value: 0.5, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('e', { label: 'Espesor de pared', min: 2, max: 40, step: 0.5, value: 10, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Longitud', min: 100, max: 3000, step: 10, value: 1000, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('V0', { label: 'Velocidad inicial', min: 0.2, max: 4, step: 0.05, value: 2, unit: 'm/s', fmt: (v) => v.toFixed(2) });
    sim.slider('tc', { label: 'Tiempo de cierre de la válvula', min: 0, max: 20, step: 0.05, value: 0, unit: 's', fmt: (v) => v.toFixed(2) });
    sim.check('fr', { label: 'Incluir fricción (Colebrook)', value: false });
    sim.out('a', 'Celeridad <i>a</i> · tiempo 2<i>L</i>/<i>a</i>', { hl: true });
    sim.out('dH', 'Sobrepresión máxima en la válvula · Joukowsky');
    sim.out('min', 'Carga mínima (riesgo de cavitación si < −10 m)');
    let run = null, key = '', k = 0;
    const compute = () => {
      const p = sim.p, a = FL.waveSpeed(W.K(293.15), rho20, p.D, MAT[p.m][1], p.e / 1000);
      const f = p.fr ? FL.colebrook((p.V0 * p.D) / nu20, 4.5e-5 / p.D) : 0;
      const T = Math.max(10 * p.L / a, p.tc + 6 * p.L / a);
      run = FL.hammer({ L: p.L, a, D: p.D, f, V0: p.V0, H0: 100, N: 40, tc: p.tc, tmax: T, snapEvery: 1 });
      run.a = a; k = 0;
    };
    sim.animate((dt) => { if (run) k = (k + Math.max(1, Math.round(dt * 60))) % run.snaps.length; });
    sim.onDraw(() => {
      const p = sim.p, nk = [p.m, p.D, p.e, p.L, p.V0, p.tc, p.fr].join('|');
      if (nk !== key) { key = nk; compute(); }
      const ctx = cv.ctx, Wc = cv.w, H = cv.h, a = run.a, dHj = (a * p.V0) / g;
      EM.draw.clear(cv);
      const Hmax = Math.max(...run.Hv), Hmin = Math.min(...run.Hv);
      const lo = Math.min(0, Hmin) - 10, hi = Math.max(Hmax, 100 + dHj) + 10;
      const sn = run.snaps[k] || run.snaps[0];
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H * 0.45, xmin: 0, xmax: p.L, ymin: lo, ymax: hi, xlabel: 'x (m) — depósito a la izquierda, válvula a la derecha', ylabel: 'H (m)' });
      p1.frame();
      const xs = sn.H.map((_, i) => (i * p.L) / (sn.H.length - 1));
      p1.xy(xs, sn.H, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.1, base: lo });
      p1.hline(100, { color: '--ink-3', label: 'carga estática' });
      EM.text(ctx, 't = ' + EM.fix(sn.t, 3) + ' s', p1.ix + p1.iw - 6, p1.iy + 14, { size: 11.5, align: 'right', mono: true, halo: true });
      const p2 = new EM.Plot(ctx, { x: 0, y: H * 0.47, w: Wc, h: H * 0.53, xmin: 0, xmax: run.t[run.t.length - 1], ymin: lo, ymax: hi, xlabel: 't (s)', ylabel: 'H en la válvula (m)' });
      p2.frame();
      p2.xy(run.t, run.Hv, { color: '--c1', width: 2 });
      p2.hline(100 + dHj, { color: '--c2', label: 'Joukowsky H₀ + aV₀/g' });
      p2.vline(sn.t, { color: '--ink-3' });
      if (p.tc > 0) p2.band(0, p.tc, { color: '--c3', alpha: 0.08 });
      sim.set('a', EM.fix(a, 1) + ' m/s · ' + EM.fix((2 * p.L) / a, 3) + ' s');
      sim.set('dH', EM.fix(Hmax - 100, 1) + ' m · ' + EM.fix(dHj, 1) + ' m (' + EM.fix((rho20 * a * p.V0) / 1e6, 2) + ' MPa)');
      sim.set('min', EM.fix(Math.min(...run.Hm, Hmin), 1) + ' m');
    });
  });
})();
