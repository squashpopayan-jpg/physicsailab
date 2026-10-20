/* Capítulo 18 — Vorticidad y vórtices */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, W = FL.water;

  /* 18.1 Rankine y Lamb–Oseen */
  EM.defineSim('lamb-oseen', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.seg('f', { label: 'Fluido', options: [['agua', 'Agua'], ['aire', 'Aire']], value: 'agua' });
    sim.slider('G', { label: 'Circulación Γ', min: 0.001, max: 0.1, step: 0.001, value: 0.01, unit: 'm²/s', fmt: (v) => v.toFixed(3) });
    sim.slider('t', { label: 'Tiempo desde la formación', min: 0.1, max: 200, step: 0.1, value: 10, unit: 's', log: true, fmt: (v) => v.toFixed(1) });
    sim.out('r', '<i>r</i><sub>max</sub> = 2.242√(ν<i>t</i>)', { hl: true });
    sim.out('v', '<i>v</i><sub>max</sub> (Lamb–Oseen · Rankine con el mismo núcleo)');
    sim.out('p', 'Depresión central (Lamb–Oseen · Rankine)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, nu = p.f === 'agua' ? 1.0e-6 : 1.5e-5, rho = p.f === 'agua' ? 998.2 : 1.2;
      EM.draw.clear(cv);
      const a = 2.2418 * Math.sqrt(nu * p.t), rmax = 6 * a;
      const vLO = (r) => FL.lambOseen(r, p.t, p.G, nu), vR = (r) => FL.rankine(r, p.G, a);
      /* presión: p(r) − p∞ = −∫_r^∞ ρ v²/r dr (numérica) */
      const pres = (vf, r) => -FL.quad((s) => (rho * vf(s) * vf(s)) / s, Math.max(r, 1e-9), r + 60 * a, 40) - (rho * p.G * p.G) / (8 * Math.PI * Math.PI * Math.pow(r + 60 * a, 2));
      const vm0 = p.G / (2 * Math.PI * a);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.55, h: H, xmin: 0, xmax: rmax * 1000, ymin: 0, ymax: vm0 * 1.15, xlabel: 'r (mm)', ylabel: 'v_θ (m/s)' });
      pl.frame();
      pl.fn((rm) => vR(rm / 1000), { color: '--c1', width: 1.6, dash: [5, 4] });
      pl.fn((rm) => vLO(rm / 1000), { color: '--accent', width: 2.6 });
      pl.fn((rm) => p.G / (2 * Math.PI * (rm / 1000)), { color: '--ink-3', width: 1, dash: [2, 3], from: a * 500 });
      pl.vline(a * 1000, { color: '--c2', label: 'r_{max}' });
      pl.legend([{ label: 'Lamb–Oseen', color: '--accent' }, { label: 'Rankine (mismo r_{max})', color: '--c1', dash: [5, 4] }, { label: 'Γ/2πr', color: '--ink-3', dash: [2, 3] }], 'tr');
      const p0LO = pres(vLO, 1e-7 * a), p0R = -rho * vm0 * vm0;
      const p2 = new EM.Plot(ctx, { x: Wc * 0.55, y: 0, w: Wc * 0.45, h: H, xmin: 0, xmax: rmax * 1000, ymin: p0R * 1.15, ymax: 0, xlabel: 'r (mm)', ylabel: 'p − p∞ (Pa)' });
      p2.frame();
      p2.fn((rm) => FL.rankineP(rm / 1000, p.G, a, rho), { color: '--c1', width: 1.6, dash: [5, 4] });
      p2.fn((rm) => pres(vLO, rm / 1000), { color: '--accent', width: 2.4, n: 120 });
      sim.set('r', EM.fix(a * 1000, 3) + ' mm');
      sim.set('v', EM.fix(vLO(a), 4) + ' · ' + EM.fix(vm0, 4) + ' m/s (cociente 0.638)');
      sim.set('p', EM.fix(p0LO, 3) + ' · ' + EM.fix(p0R, 3) + ' Pa');
    });
  });

  /* 18.2 Remolino de bañera y tornado */
  EM.defineSim('tornado', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('m', { label: 'Caso', options: [['b', 'Remolino de bañera (agua)'], ['t', 'Tornado (aire)']], value: 't' });
    sim.slider('vm', { label: 'Velocidad máxima', min: 0.05, max: 120, step: 0.05, value: 80, unit: 'm/s', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Radio del núcleo', min: 0.002, max: 300, step: 0, value: 100, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.slider('RH', { label: 'Humedad relativa del aire ambiente', min: 30, max: 100, step: 1, value: 80, unit: '%', fmt: (v) => v.toFixed(0) });
    sim.out('G', 'Circulación Γ = 2π<i>a</i><i>v</i><sub>max</sub>', { hl: true });
    sim.out('d', 'Depresión central');
    sim.out('c', 'Embudo de condensación (radio)');
    sim.onChange = (id) => { if (id === 'm') { if (sim.p.m === 'b') { sim.ctl.vm.set(0.32, true); sim.ctl.a.set(0.005, true); } else { sim.ctl.vm.set(80, true); sim.ctl.a.set(100, true); } } sim.ctl.RH.show(sim.p.m === 't'); };
    sim.ctl.RH.show(true);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, a = p.a, vm = p.vm, G = 2 * Math.PI * a * vm;
      EM.draw.clear(cv);
      const R = 5 * a;
      if (p.m === 'b') {
        const dep = (r) => (FL.rankineP(r, G, a, 1)) / g; /* z = Δp/(ρg), ρ se cancela */
        const zmin = -vm * vm / g, depth = Math.max(-zmin * 3, 0.01);
        const vb = EM.flow.view({ x: 10, y: 10, w: Wc - 20, h: H - 20 }, -R, R, -depth * 1.2, depth * 0.3, false);
        const pts = [[vb.X(-R), vb.Y(-depth * 1.2)]];
        for (let i = 0; i <= 200; i++) { const x = -R + (2 * R * i) / 200; pts.push(vb.map(x, dep(Math.abs(x)))); }
        pts.push([vb.X(R), vb.Y(-depth * 1.2)]);
        EM.flow.waterFill(ctx, pts, { alpha: 0.4 });
        EM.flow.drawPath(ctx, pts.slice(1, -1).map((q) => vb.inv(q[0], q[1])), vb.map, { color: '--water', width: 2.4 });
        ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(vb.X(-R), vb.Y(0)); ctx.lineTo(vb.X(R), vb.Y(0)); ctx.stroke(); ctx.setLineDash([]);
        sim.set('G', EM.fix(G * 1e4, 3) + ' cm²/s');
        sim.set('d', EM.fix((vm * vm) / g * 100, 3) + ' cm de hundimiento en el centro');
        sim.set('c', '—');
      } else {
        const rho = 1.1, p0 = 95000, T0 = 298.15;
        const pr = (r) => p0 + FL.rankineP(r, G, a, rho);
        const T = (r) => T0 * Math.pow(pr(r) / p0, 0.4 / 1.4);
        const e0 = (p.RH / 100) * W.psat(T0);
        const cond = (r) => W.psat(Math.max(250, T(r))) <= (e0 * pr(r)) / p0;
        let rc = 0; for (let i = 0; i <= 400; i++) { const r = (R * i) / 400; if (cond(r)) rc = r; }
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: -R, xmax: R, ymin: (pr(0) - p0) / 1000 * 1.15, ymax: 0.5, xlabel: 'r (m)', ylabel: 'p − p∞ (kPa)' });
        pl.frame();
        if (rc > 0) pl.band(-rc, rc, { color: '--ink-3', alpha: 0.18 });
        pl.fn((x) => (pr(Math.abs(x)) - p0) / 1000, { color: '--accent', width: 2.6 });
        pl.vline(-a, { color: '--c2' }); pl.vline(a, { color: '--c2', label: 'núcleo' });
        if (rc > 0) pl.label(0, ((pr(0) - p0) / 1000) * 0.5, 'nube embudo', { size: 12, align: 'center', color: '--ink-2', weight: 650 });
        sim.set('G', EM.sci(G, 3) + ' m²/s');
        sim.set('d', EM.fix((p0 - pr(0)) / 1000, 2) + ' kPa; el aire que llega al centro se enfría ' + EM.fix(T0 - T(0), 2) + ' K');
        sim.set('c', rc > 0 ? EM.fix(rc, 1) + ' m' : 'no se forma (aire demasiado seco)');
      }
    });
  });

  /* 18.3 Vórtices puntuales */
  const PRE = {
    opuestos: ['Par de signos opuestos', () => [[[-0.5, 0], 1], [[0.5, 0], -1]], 0],
    iguales: ['Par del mismo signo', () => [[[-0.5, 0], 1], [[0.5, 0], 1]], 0],
    rana: ['Salto de rana (dos pares)', () => [[[0, 0.5], -1], [[0, -0.5], 1], [[0.7, 0.4], -1], [[0.7, -0.4], 1]], 0],
    tres: ['Tres vórtices', () => [[[-0.6, 0], 1], [[0.6, 0.1], 1], [[0, 0.8], -0.6]], 0],
    karman: ['Calle de Kármán', null, 2]
  };
  EM.defineSim('vortices-puntuales', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('pre', { label: 'Configuración', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'rana' });
    sim.slider('ba', { label: 'Cociente <i>b</i>/<i>a</i> de la calle', min: 0.1, max: 0.6, step: 0.005, value: 0.281, fmt: (v) => v.toFixed(3) });
    sim.check('tr', { label: 'Partículas trazadoras', value: true });
    sim.out('H', 'Deriva relativa de la energía de interacción', { hl: true });
    sim.out('P', 'Deriva del impulso Σ Γ<sub>k</sub><b>x</b><sub>k</sub>');
    sim.out('t', 'Tiempo');
    let X, Y, G, Lp, H0, P0, t, trail, tracers;
    const reset = () => {
      const P = PRE[sim.p.pre];
      if (sim.p.pre === 'karman') {
        const a = 1, b = sim.p.ba * a; X = []; Y = []; G = [];
        for (let k = 0; k < 6; k++) { X.push(k * a + 0.002 * Math.sin(3 * k)); Y.push(b / 2); G.push(1); X.push(k * a + a / 2); Y.push(-b / 2); G.push(-1); }
        Lp = 6 * a;
      } else { const v = P[1](); X = v.map((q) => q[0][0]); Y = v.map((q) => q[0][1]); G = v.map((q) => q[1]); Lp = 0; }
      H0 = Lp ? null : FL.vortexH(X, Y, G); P0 = FL.vortexImpulse(X, Y, G); t = 0; trail = X.map(() => []);
      tracers = new EM.flow.Tracers(300, () => [(Math.random() - 0.5) * 6 + (Lp ? 3 : 0), (Math.random() - 0.5) * 3.4], { life: 5, trail: 10 });
      sim.ctl.ba.show(sim.p.pre === 'karman');
    };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    const velAt = (x, y) => { let u = 0, v = 0; for (let j = 0; j < X.length; j++) { let dx = x - X[j], dy = y - Y[j]; if (Lp) { const k = (2 * Math.PI) / Lp, den = Math.cosh(k * dy) - Math.cos(k * dx) + 1e-4; u += (-G[j] / (2 * Lp)) * Math.sinh(k * dy) / den; v += (G[j] / (2 * Lp)) * Math.sin(k * dx) / den; } else { const r2 = dx * dx + dy * dy + 0.004; u -= (G[j] * dy) / (2 * Math.PI * r2); v += (G[j] * dx) / (2 * Math.PI * r2); } } return [u, v]; };
    sim.animate((dt) => {
      const n = 8, h = (dt * 1.2) / n;
      for (let i = 0; i < n; i++) FL.vortexStep(X, Y, G, h, 0, Lp);
      t += dt * 1.2;
      X.forEach((x, i) => { trail[i].push([x, Y[i]]); if (trail[i].length > 400) trail[i].shift(); });
      if (sim.p.tr) tracers.step(velAt, dt * 1.2);
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, Hh = cv.h;
      EM.draw.clear(cv);
      let cx = 0, cy = 0; X.forEach((x, i) => { cx += x; cy += Y[i]; }); cx /= X.length; cy /= X.length;
      if (Lp) { cx = 3; cy = 0; }
      const v = EM.flow.view({ x: 4, y: 4, w: Wc - 8, h: Hh - 8 }, cx - 3.2, cx + 3.2, cy - 1.8, cy + 1.8);
      if (sim.p.tr) tracers.draw(ctx, (x, y) => v.map(x, y), { color: '--ink-3', alpha: 0.5, width: 1 });
      trail.forEach((tr, i) => EM.flow.drawPath(ctx, tr, v.map, { color: G[i] > 0 ? '--c2' : '--c1', width: 1.4, alpha: 0.7 }));
      X.forEach((x, i) => { ctx.fillStyle = EM.col(G[i] > 0 ? '--c2' : '--c1'); ctx.beginPath(); ctx.arc(v.X(x), v.Y(Y[i]), 6, 0, 7); ctx.fill(); });
      EM.text(ctx, 'rojo: antihorario · azul: horario', 10, Hh - 10, { size: 11, color: '--ink-3', halo: true });
      const P = FL.vortexImpulse(X, Y, G);
      sim.set('H', H0 === null ? '— (calle periódica)' : EM.sci((FL.vortexH(X, Y, G) - H0) / Math.abs(H0 || 1), 2));
      sim.set('P', EM.sci(Math.hypot(P[0] - P0[0], P[1] - P0[1]), 2));
      sim.set('t', EM.fix(t, 2));
    });
  });
})();
