/* Capítulo 15 — Refrigeración y bombas de calor */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;
  const F = TH.r134a;

  /* 15.1 Ciclo en el diagrama P–h */
  EM.defineSim('refrig-ph', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Te', { label: 'Temperatura de evaporación', min: -38, max: 15, step: 0.1, value: -18.76, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tc', { label: 'Temperatura de condensación', min: 20, max: 70, step: 0.1, value: 31.33, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('ec', { label: 'Eficiencia del compresor', min: 0.5, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('sh', { label: 'Sobrecalentamiento', min: 0, max: 15, step: 0.5, value: 0, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('sc', { label: 'Subenfriamiento', min: 0, max: 15, step: 0.5, value: 0, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('m', { label: 'Caudal de refrigerante', min: 0.005, max: 0.2, step: 0.001, value: 0.05, unit: 'kg/s', fmt: (v) => v.toFixed(3) });
    sim.out('cop', 'COP de refrigeración', { hl: true });
    sim.out('Q', 'Capacidad · potencia del compresor');
    sim.out('T2', 'Temperatura de descarga');
    sim.out('P', 'Presiones de evaporación · condensación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Te = p.Te + 273.15, Tc = Math.max(p.Tc + 273.15, Te + 5);
      const r = TH.refrig({ Te, Tc, etac: p.ec, sh: p.sh, sc: p.sc });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 150, xmax: 470, ymin: 50, ymax: 4000, ylog: true, xlabel: 'h (kJ/kg)', ylabel: 'P (kPa)' });
      pl.frame();
      for (const T of [-20, 0, 20, 40, 60, 80, 100]) D.line(pl, D.isotherm(F, T + 273.15, 52e3, 3.9e6, 40), 'h', 'P', { color: '--grid-2', width: 1 });
      D.drawDome(pl, F, 'h', 'P');
      const cond = D.isobar(F, r.Pc, r.s3.T, Math.max(r.s2.T, r.s3.T + 1), 50).filter((s) => s.h <= r.s2.h + 1 && s.h >= r.s3.h - 1).reverse();
      const path = [r.s1, r.s2].concat(cond).concat([r.s3, r.s4, r.s1]);
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.12); ctx.beginPath(); path.forEach((s, i) => (i ? ctx.lineTo(pl.X(s.h / 1e3), pl.Y(s.P / 1e3)) : ctx.moveTo(pl.X(s.h / 1e3), pl.Y(s.P / 1e3)))); ctx.fill(); ctx.restore();
      D.line(pl, path, 'h', 'P', { color: '--accent', width: 2.6 });
      [[r.s1, '1'], [r.s2, '2'], [r.s3, '3'], [r.s4, '4']].forEach(([s, n]) => pl.dot(s.h / 1e3, s.P / 1e3, { color: '--ink', r: 3.5, label: n }));
      sim.set('cop', EM.fix(r.cop, 3) + ' (Carnot ' + EM.fix(r.copCarnot, 2) + ')');
      sim.set('Q', EM.fix((p.m * r.qL) / 1e3, 2) + ' kW · ' + EM.fix((p.m * r.w) / 1e3, 2) + ' kW');
      sim.set('T2', EM.fix(r.s2.T - 273.15, 1) + ' °C');
      sim.set('P', EM.fix(r.Pe / 1e3, 1) + ' · ' + EM.fix(r.Pc / 1e3, 1) + ' kPa');
    });
  });

  /* 15.2 Consumo de una nevera */
  EM.defineSim('nevera', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Tk', { label: 'Temperatura de la cocina', min: 14, max: 35, step: 0.5, value: 22, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tf', { label: 'Compartimento de refrigeración', min: 0, max: 10, step: 0.5, value: 4, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tz', { label: 'Congelador', min: -26, max: -10, step: 0.5, value: -18, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('n', { label: 'Aperturas de puerta por día', min: 0, max: 80, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('dc', { label: 'Diferencia en el condensador (polvo, ventilación)', min: 6, max: 30, step: 0.5, value: 12, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('tar', { label: 'Tarifa', min: 300, max: 1500, step: 10, value: 850, unit: '$/kWh', fmt: (v) => v.toFixed(0) });
    sim.out('L', 'Carga térmica media', { hl: true });
    sim.out('cop', 'COP real del ciclo');
    sim.out('E', 'Consumo mensual');
    sim.out('c', 'Costo mensual');
    const UAf = 1.4, UAz = 0.9, eDoor = 5000, etaM = 0.85, etaC = 0.6;
    const model = (p, Tk) => {
      const L = UAf * (Tk - p.Tf) + UAz * (Tk - p.Tz) + (p.n * eDoor) / 86400;
      const r = TH.refrig({ Te: p.Tz + 273.15 - 8, Tc: Tk + 273.15 + p.dc, etac: etaC, sh: 3 });
      const W = L / (r.cop * etaM);
      return { L, cop: r.cop, W, E: (W * 24 * 30) / 1000 };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 14, xmax: 35, ymin: 0, ymax: 90, xlabel: 'temperatura de la cocina (°C)', ylabel: 'consumo (kWh/mes)' });
      pl.frame();
      pl.fn((Tk) => model(p, Tk).E, { color: '--accent', width: 2.6 });
      pl.fn((Tk) => model(Object.assign({}, p, { dc: 25 }), Tk).E, { color: '--c2', width: 1.4, dash: [6, 4] });
      pl.fn((Tk) => model(Object.assign({}, p, { Tz: -24 }), Tk).E, { color: '--c1', width: 1.4, dash: [3, 3] });
      const m = model(p, p.Tk);
      pl.dot(p.Tk, m.E, { color: '--accent', r: 6 });
      pl.legend([{ label: 'configuración elegida', color: '--accent' }, { label: 'condensador sucio (25 K)', color: '--c2', dash: [6, 4] }, { label: 'congelador a −24 °C', color: '--c1', dash: [3, 3] }], 'tl');
      sim.set('L', EM.fix(m.L, 1) + ' W');
      sim.set('cop', EM.fix(m.cop, 2));
      sim.set('E', EM.fix(m.E, 1) + ' kWh (potencia media ' + EM.fix(m.W, 1) + ' W)');
      sim.set('c', '$' + EM.fix(m.E * p.tar, 0));
    });
  });

  /* 15.3 Bomba de calor para agua caliente */
  EM.defineSim('bomba-calor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ta', { label: 'Temperatura del aire exterior', min: 5, max: 30, step: 0.5, value: 18, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tw', { label: 'Temperatura del agua caliente', min: 35, max: 60, step: 0.5, value: 45, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tin', { label: 'Agua de la red', min: 10, max: 25, step: 0.5, value: 16, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Agua caliente por día', min: 30, max: 400, step: 5, value: 150, unit: 'L', fmt: (v) => v.toFixed(0) });
    sim.slider('te', { label: 'Tarifa eléctrica', min: 300, max: 1500, step: 10, value: 850, unit: '$/kWh', fmt: (v) => v.toFixed(0) });
    sim.slider('tg', { label: 'Tarifa de gas natural', min: 1000, max: 6000, step: 50, value: 3000, unit: '$/m³', fmt: (v) => v.toFixed(0) });
    sim.out('cop', 'COP de la bomba de calor', { hl: true });
    sim.out('Q', 'Calor necesario al mes');
    sim.out('c', 'Costo mensual: resistencia · gas · bomba');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = TH.refrig({ Te: p.Ta + 273.15 - 8, Tc: Math.max(p.Tw + 273.15 + 8, p.Ta + 273.15 + 5), etac: 0.7, sh: 3, sc: 2 });
      const Q = (p.L * 30 * 4.186 * Math.max(0, p.Tw - p.Tin)) / 3600; /* kWh/mes */
      const costE = Q * p.te, costG = ((Q * 3.6) / (34 * 0.82)) * p.tg, costHP = (Q / r.copHP) * p.te;
      const items = [['resistencia eléctrica', costE, '--c2'], ['calentador a gas (82 %)', costG, '--c4'], ['bomba de calor', costHP, '--c3']];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(costE, costG) * 1.15, ylabel: 'costo mensual ($)', xticks: [] });
      pl.frame();
      items.forEach(([n, v, c], i) => {
        ctx.fillStyle = EM.alpha(c, 0.7); const x0 = pl.X(i + 0.2), x1 = pl.X(i + 0.8);
        ctx.fillRect(x0, pl.Y(v), x1 - x0, pl.Y(0) - pl.Y(v));
        EM.text(ctx, n, (x0 + x1) / 2, pl.Y(0) + 14, { size: 11, align: 'center', color: '--ink-2' });
        EM.text(ctx, '$' + EM.fix(v, 0), (x0 + x1) / 2, pl.Y(v) - 6, { size: 12, align: 'center', mono: true, color: '--ink' });
      });
      sim.set('cop', EM.fix(r.copHP, 2) + ' (Carnot ' + EM.fix((p.Tw + 273.15) / Math.max(1, p.Tw - p.Ta), 2) + ')');
      sim.set('Q', EM.fix(Q, 1) + ' kWh');
      sim.set('c', '$' + EM.fix(costE, 0) + ' · $' + EM.fix(costG, 0) + ' · $' + EM.fix(costHP, 0));
    });
  });

  /* 15.4 Brayton invertido */
  EM.defineSim('brayton-inverso', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rp', { label: 'Relación de presiones', min: 1.5, max: 10, step: 0.1, value: 4, fmt: (v) => v.toFixed(1) });
    sim.slider('T1', { label: 'Entrada al compresor (espacio refrigerado)', min: 230, max: 300, step: 1, value: 273, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('T3', { label: 'Entrada a la turbina (tras enfriar con el ambiente)', min: 280, max: 330, step: 1, value: 308, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('e', { label: 'Eficiencia del compresor y de la turbina', min: 0.6, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('cop', 'COP', { hl: true });
    sim.out('T4', 'Temperatura del aire frío');
    sim.out('q', 'Refrigeración · trabajo neto por kg');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const cp = 1.005, tau = Math.pow(p.rp, 0.4 / 1.4);
      const calc = (rp, e) => { const t = Math.pow(rp, 0.4 / 1.4), T2 = p.T1 + (p.T1 * t - p.T1) / e, T4 = p.T3 - e * (p.T3 - p.T3 / t); const qL = cp * (p.T1 - T4), w = cp * (T2 - p.T1) - cp * (p.T3 - T4); return { T2, T4, qL, w, cop: w > 0 && qL > 0 ? qL / w : NaN }; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1.5, xmax: 10, ymin: 0, ymax: 5, xlabel: 'relación de presiones', ylabel: 'COP' });
      pl.frame();
      pl.fn((r) => 1 / (Math.pow(r, 0.4 / 1.4) - 1), { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.fn((r) => calc(r, p.e).cop, { color: '--accent', width: 2.6 });
      const c = calc(p.rp, p.e);
      pl.dot(p.rp, c.cop, { color: '--accent', r: 6 });
      pl.legend([{ label: 'ideal: COP = 1/(r_p^{(k−1)/k} − 1)', color: '--c1', dash: [6, 4] }, { label: 'con las eficiencias elegidas', color: '--accent' }], 'tr');
      sim.set('cop', isFinite(c.cop) ? EM.fix(c.cop, 3) : 'no refrigera');
      sim.set('T4', EM.fix(c.T4, 1) + ' K (' + EM.fix(c.T4 - 273.15, 1) + ' °C)');
      sim.set('q', EM.fix(c.qL, 1) + ' · ' + EM.fix(c.w, 1) + ' kJ/kg');
    });
  });
})();
