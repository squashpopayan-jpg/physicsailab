/* Capítulo 13 — La capa límite */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;
  const BL = FL.blasius();

  /* 13.1 Blasius por disparo */
  EM.defineSim('blasius', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.out('fpp', '<i>f</i>″(0)', { hl: true });
    sim.out('d', 'δ₉₉ · δ* · θ (en <i>x</i>/√Re<sub>x</sub>)');
    sim.out('H', 'Factor de forma <i>H</i> = δ*/θ');
    sim.out('it', 'Intento');
    /* intentos de la bisección */
    const trial = (s) => {
      let y = [0, 0, s]; const pts = [[0, 0]], h = 0.02;
      for (let i = 0; i < 500; i++) { y = FL.rk4((t, q) => [q[1], q[2], -0.5 * q[0] * q[2]], i * h, y, h); pts.push([y[1], (i + 1) * h]); if (y[1] > 1.6 || y[1] < -0.2) break; }
      return pts;
    };
    const tries = []; let lo = 0.05, hi = 1;
    for (let k = 0; k < 14; k++) { const m = 0.5 * (lo + hi); tries.push([m, trial(m)]); const end = tries[k][1][tries[k][1].length - 1][0]; if (end > 1) hi = m; else lo = m; }
    let shown = 0, tt = 0;
    sim.animate((dt) => { tt += dt; if (tt > 0.6) { tt = 0; shown = shown >= tries.length + 4 ? 0 : shown + 1; } });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: 1.6, ymin: 0, ymax: 8, xlabel: "u/U = f'(η)", ylabel: 'η = y√(U/νx)' });
      pl.frame();
      for (let k = 0; k < Math.min(shown, tries.length); k++) pl.path(tries[k][1], { color: k === shown - 1 ? '--c2' : '--grid-2', width: k === shown - 1 ? 1.8 : 1 });
      if (shown >= tries.length) {
        pl.xy(BL.fp, BL.eta, { color: '--accent', width: 2.8 });
        pl.xy(BL.fpp.map((v) => v * 2), BL.eta, { color: '--c5', width: 1.4, dash: [5, 4] });
        pl.hline(BL.d99, { color: '--c3', label: 'δ₉₉ = 4.91' });
        pl.hline(BL.dstar, { color: '--ink-3', label: 'δ* = 1.721' });
        pl.legend([{ label: "f'(η) (Blasius)", color: '--accent' }, { label: "2f''(η) (esfuerzo cortante)", color: '--c5', dash: [5, 4] }], 'tr');
      }
      pl.vline(1, { color: '--ink-3' });
      sim.set('fpp', EM.fix(BL.fpp0, 6) + ' (Howarth: 0.332057)');
      sim.set('d', EM.fix(BL.d99, 3) + ' · ' + EM.fix(BL.dstar, 4) + ' · ' + EM.fix(BL.theta, 4));
      sim.set('H', EM.fix(BL.H, 4));
      sim.set('it', shown < tries.length && shown > 0 ? 'f″(0) = ' + EM.fix(tries[shown - 1][0], 6) : shown === 0 ? 'inicio' : 'solución');
    });
  });

  /* 13.2 Placa plana: laminar, transición, turbulenta */
  const NUF = { aire: ['Aire, 20 °C (nivel del mar)', 1.204, 1.511e-5], aireP: ['Aire, Popayán (19 °C)', 0.977, 1.853e-5], agua: ['Agua, 20 °C', 998.2, 1.004e-6] };
  EM.defineSim('capa-placa', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('f', { label: 'Fluido', options: Object.entries(NUF).map(([k, v]) => [k, v[0]]), value: 'aire' });
    sim.slider('U', { label: 'Velocidad del flujo', min: 0.1, max: 60, step: 0.1, value: 10, unit: 'm/s', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Longitud de la placa', min: 0.1, max: 5, step: 0.05, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('Rt', { label: 'Reynolds de transición', min: 2e5, max: 3e6, step: 0, value: 5e5, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('xt', 'Posición de la transición', { hl: true });
    sim.out('d', 'Espesor δ al final de la placa');
    sim.out('CD', 'Coeficiente de arrastre medio (integrado · Schlichting)');
    sim.out('F', 'Fuerza de fricción por m de ancho (una cara)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, [, rho, nu] = NUF[p.f], U = p.U, L = p.L;
      EM.draw.clear(cv);
      const xt = (p.Rt * nu) / U;
      const thL = (x) => (0.664 * x) / Math.sqrt((U * x) / nu);
      /* origen virtual turbulento: θ_t = 0.036 (x−x0)^0.8 (ν/U)^0.2 igual a θ_l en x_t */
      const th0 = thL(Math.min(xt, L * 10)), x0 = xt - Math.pow(th0 / (0.036 * Math.pow(nu / U, 0.2)), 1.25);
      const delta = (x) => (x <= xt ? (4.91 * x) / Math.sqrt((U * x) / nu) : 0.37 * (x - x0) * Math.pow((U * (x - x0)) / nu, -0.2));
      const cf = (x) => (x <= xt ? 0.664 / Math.sqrt((U * x) / nu) : 0.0592 * Math.pow((U * (x - x0)) / nu, -0.2));
      const xs = EM.M.linspace(L / 400, L, 400);
      const dmax = Math.max(...xs.map(delta)), top = H * 0.5;
      const sx = (Wc - 40) / L, sy = (top - 30) / dmax, X = (x) => 20 + x * sx, Y = (y) => top - y * sy;
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(20, top, Wc - 40, 6);
      ctx.fillStyle = EM.alpha('--c1', 0.1); ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (const x of xs) ctx.lineTo(X(x), Y(delta(x)));
      ctx.lineTo(X(L), Y(0)); ctx.closePath(); ctx.fill();
      EM.flow.drawPath(ctx, xs.map((x) => [x, delta(x)]), (q) => [X(q[0]), Y(q[1])], { color: '--c1', width: 2 });
      if (xt < L) { ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--c2'); ctx.beginPath(); ctx.moveTo(X(xt), top); ctx.lineTo(X(xt), 18); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, 'transición', X(xt) + 4, 26, { size: 11, color: '--c2' }); }
      /* perfiles */
      for (const fr of [0.15, 0.4, 0.65, 0.88]) {
        const x = fr * L, d = delta(x), turb = x > xt, len = 50;
        const pts = [];
        for (let k = 0; k <= 40; k++) { const y = (d * k) / 40, e = y / d; const u = turb ? Math.pow(e, 1 / 7) : (() => { const eta = (e * 4.91); let i = 0; while (i < BL.eta.length - 1 && BL.eta[i] < eta) i++; return BL.fp[i]; })(); pts.push([X(x) + u * len, Y(y)]); }
        pts.push([X(x) + len, Y(d * 1.25)]);
        ctx.strokeStyle = EM.col(turb ? '--c2' : '--accent'); ctx.lineWidth = 1.8; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(x), top); ctx.lineTo(X(x), Y(d * 1.25)); ctx.stroke();
      }
      EM.text(ctx, 'escala vertical ×' + EM.fix(sy / sx, 0), Wc - 24, top + 22, { size: 11, align: 'right', color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: 0, y: top + 24, w: Wc, h: H - top - 24, xmin: 0, xmax: L, ymin: 0, ymax: Math.min(0.02, Math.max(...xs.filter((x) => x > 0.03 * L).map(cf)) * 1.1), xlabel: 'x (m)', ylabel: 'c_f local', mt: 6 });
      pl.frame();
      pl.fn(cf, { color: '--accent', width: 2.2, from: L * 0.01 });
      const ReL = (U * L) / nu, CD = ReL <= p.Rt ? 1.328 / Math.sqrt(ReL) : (() => { let s = 0; const n = 2000; for (let i = 0; i < n; i++) { const x = ((i + 0.5) * L) / n; s += cf(x) * (L / n); } return s / L; })();
      sim.set('xt', xt < L ? EM.fix(xt, 3) + ' m (Re_L = ' + EM.sci(ReL, 3) + ')' : 'no ocurre (Re_L = ' + EM.sci(ReL, 3) + ')');
      sim.set('d', EM.si(delta(L), 'm', 3));
      sim.set('CD', EM.fix(CD * 1000, 3) + ' · ' + EM.fix(FL.BL.mixed(ReL, p.Rt) * 1000, 3) + ' ×10⁻³');
      sim.set('F', EM.sci(0.5 * rho * U * U * CD * L, 3) + ' N');
    });
  });

  /* 13.3 Falkner–Skan */
  EM.defineSim('falkner-skan', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('b', { label: 'Parámetro de presión β', min: -0.1988, max: 2, step: 0.0001, value: -0.1, fmt: (v) => v.toFixed(4) });
    sim.out('fpp', 'Esfuerzo en la pared <i>f</i>″(0)', { hl: true });
    sim.out('H', 'Factor de forma <i>H</i>');
    sim.out('m', 'Exponente <i>m</i> de <i>U</i> = <i>Cx</i><sup>m</sup>');
    sim.out('t', 'Tipo de flujo');
    const ref = [-0.19, 0, 0.5, 1, 2].map((b) => [b, FL.fs(b)]);
    const cache = new Map();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const key = p.b.toFixed(4);
      let r = cache.get(key); if (!r) { r = FL.fs(p.b); cache.set(key, r); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: -0.05, xmax: 1.2, ymin: 0, ymax: 6, xlabel: "u/U = f'(η)", ylabel: 'η' });
      pl.frame();
      for (const [b, q] of ref) pl.xy(q.fp, q.eta, { color: '--grid-2', width: 1.2 });
      pl.xy(r.fp, r.eta, { color: '--accent', width: 2.8 });
      /* tangente en la pared */
      pl.arrow(0, 0, Math.min(1.1, r.fpp0 * 1.2), 1.2, { color: '--c5', width: 1.4, head: 6 });
      pl.vline(1, { color: '--ink-3' }); pl.vline(0, { color: '--ink-3' });
      const m = p.b / (2 - p.b);
      sim.set('fpp', EM.fix(r.fpp0, 5));
      sim.set('H', EM.fix(r.H, 3));
      sim.set('m', EM.fix(m, 4));
      sim.set('t', p.b < -0.198 ? 'a punto de separarse (τ_w → 0)' : p.b < 0 ? 'desacelerado: gradiente adverso' : p.b === 0 ? 'placa plana (Blasius)' : Math.abs(p.b - 1) < 0.01 ? 'estancamiento plano (Hiemenz)' : 'acelerado: gradiente favorable');
    });
  });

  /* 13.4 Perfiles de Kármán–Pohlhausen */
  const PROF = {
    lineal: ['Lineal η', (e) => e], cuadratico: ['Cuadrático 2η − η²', (e) => 2 * e - e * e], cubico: ['Cúbico ³⁄₂η − ½η³', (e) => 1.5 * e - 0.5 * e * e * e],
    cuartico: ['Cuártico (Pohlhausen) 2η − 2η³ + η⁴', (e) => 2 * e - 2 * e * e * e + e * e * e * e], seno: ['Senoidal sen(πη/2)', (e) => Math.sin((Math.PI * e) / 2)]
  };
  EM.defineSim('pohlhausen', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('pr', { label: 'Perfil supuesto', options: Object.entries(PROF).map(([k, v]) => [k, v[0]]), value: 'cubico' });
    sim.out('d', 'δ√Re<sub>x</sub>/<i>x</i> (Blasius 4.91 al 99 %)', { hl: true });
    sim.out('ds', 'δ*√Re<sub>x</sub>/<i>x</i> (1.721) · error');
    sim.out('th', 'θ√Re<sub>x</sub>/<i>x</i> (0.664) · error');
    sim.out('cf', '<i>c</i><sub>f</sub>√Re<sub>x</sub> (0.664) · error');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, [, F] = PROF[p.pr], r = FL.profileBL(F);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: 1.1, ymin: 0, ymax: 7, xlabel: 'u/U', ylabel: 'y√Re_x/x' });
      pl.frame();
      pl.xy(BL.fp, BL.eta, { color: '--ink-2', width: 2 });
      const ys = EM.M.linspace(0, r.delta, 100);
      pl.xy(ys.map((y) => F(y / r.delta)).concat([1, 1]), ys.concat([r.delta, 7]), { color: '--accent', width: 2.6 });
      pl.legend([{ label: 'Blasius (exacta)', color: '--ink-2' }, { label: 'perfil aproximado', color: '--accent' }], 'tl');
      const e = (a, b) => (a >= b ? '+' : '') + EM.fix((100 * (a - b)) / b, 1) + ' %';
      sim.set('d', EM.fix(r.delta, 3));
      sim.set('ds', EM.fix(r.dstar, 4) + ' · ' + e(r.dstar, 1.7208));
      sim.set('th', EM.fix(r.theta, 4) + ' · ' + e(r.theta, 0.6641));
      sim.set('cf', EM.fix(r.cf, 4) + ' · ' + e(r.cf, 0.6641));
    });
  });
})();
