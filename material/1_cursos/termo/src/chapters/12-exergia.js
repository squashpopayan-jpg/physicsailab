/* Capítulo 12 — Exergía e irreversibilidad */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;

  /* 12.1 Factor de Carnot */
  const SRCS = [['Congelador', -18], ['Agua de la ducha', 40], ['Agua caliente solar', 70], ['Geotérmica', 150], ['Vapor industrial', 250], ['Vapor de central', 550], ['Gases de turbina', 1100], ['Llama', 1727]];
  EM.defineSim('factor-carnot', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T0', { label: 'Temperatura ambiente <i>T</i><sub>0</sub>', min: -10, max: 40, step: 0.5, value: 25, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura del calor', min: -60, max: 2000, step: 1, value: 550, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('f', 'Factor de Carnot 1 − <i>T</i><sub>0</sub>/<i>T</i>', { hl: true });
    sim.out('x', 'Exergía de 100 kJ de calor');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T0 = p.T0 + 273.15;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 200, xmax: 2300, ymin: -0.4, ymax: 1, xlabel: 'T (K)', ylabel: 'exergía / calor' });
      pl.frame();
      pl.fn((T) => 1 - T0 / T, { color: '--accent', width: 2.6 });
      pl.hline(0, { color: '--ink-3', dash: [] }); pl.vline(T0, { label: 'T₀' });
      SRCS.forEach(([n, t], i) => { const T = t + 273.15; pl.dot(T, 1 - T0 / T, { color: '--c1', r: 4, label: n, dy: i % 2 ? 14 : -8, dx: 6 }); });
      const T = p.T + 273.15, f = 1 - T0 / T;
      pl.dot(T, f, { color: '--accent', r: 7 });
      sim.set('f', EM.fix(f, 4));
      sim.set('x', EM.fix(100 * Math.abs(f), 2) + ' kJ' + (f < 0 ? ' (el frío también vale: hay que gastar trabajo para producirlo)' : ''));
    });
  });

  /* 12.2 Destrucción de exergía en transferencia de calor */
  EM.defineSim('perdida-calor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TH', { label: 'Temperatura del cuerpo caliente', min: 300, max: 2200, step: 5, value: 1800, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('TL', { label: 'Temperatura del cuerpo frío', min: 280, max: 1500, step: 5, value: 600, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('T0', { label: 'Ambiente', min: 260, max: 320, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Calor transferido', min: 1, max: 2000, step: 1, value: 1000, unit: 'kJ', fmt: (v) => v.toFixed(0) });
    sim.out('I', 'Exergía destruida <i>T</i><sub>0</sub><i>S</i><sub>gen</sub>', { hl: true });
    sim.out('S', 'Entropía generada');
    sim.out('fr', 'Fracción de la exergía inicial que se pierde');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const TH_ = Math.max(p.TH, p.TL + 1), TL = p.TL, T0 = p.T0;
      const XH = p.Q * (1 - T0 / TH_), XL = p.Q * (1 - T0 / TL), I = XH - XL, Sg = p.Q * (1 / TL - 1 / TH_);
      const bars = [['energía que sale', p.Q, '--c6'], ['energía que llega', p.Q, '--c6'], ['exergía que sale', XH, '--c2'], ['exergía que llega', XL, '--c1'], ['destruida', I, '--accent']];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 5, ymin: Math.min(0, XL) * 1.1, ymax: p.Q * 1.12, ylabel: 'kJ', xticks: [] });
      pl.frame();
      bars.forEach(([n, v, c], i) => {
        ctx.fillStyle = EM.alpha(c, 0.7); const x0 = pl.X(i + 0.15), x1 = pl.X(i + 0.85);
        ctx.fillRect(x0, Math.min(pl.Y(0), pl.Y(v)), x1 - x0, Math.abs(pl.Y(v) - pl.Y(0)));
        EM.text(ctx, n, (x0 + x1) / 2, pl.Y(0) + 14, { size: 11, align: 'center', color: '--ink-2' });
        EM.text(ctx, EM.fix(v, 1), (x0 + x1) / 2, pl.Y(Math.max(v, 0)) - 6, { size: 11, align: 'center', mono: true, color: '--ink' });
      });
      sim.set('I', EM.fix(I, 2) + ' kJ');
      sim.set('S', EM.fix(Sg, 4) + ' kJ/K');
      sim.set('fr', EM.fix((100 * I) / Math.max(1e-9, XH), 1) + ' %');
    });
  });

  /* 12.3 Exergía del agua en el diagrama h–s */
  EM.defineSim('exergia-vapor', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('P', { label: 'Presión', min: 5, max: 20000, step: 1, value: 10000, unit: 'kPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 10, max: 600, step: 1, value: 550, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('T0', { label: 'Temperatura del estado muerto', min: 5, max: 40, step: 0.5, value: 25, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('st', 'Estado', { hl: true });
    sim.out('e', 'Energía disponible <i>h</i> − <i>h</i><sub>0</sub>');
    sim.out('x', 'Exergía de flujo ψ');
    sim.out('r', 'Cociente exergía / energía');
    const W = TH.agua;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const T0 = p.T0 + 273.15, d = W.state(101325, { T: T0 }), st = W.state(p.P * 1e3, { T: p.T + 273.15 });
      const psi = (st.h - d.h) - T0 * (st.s - d.s);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 9, ymin: 0, ymax: 3800, xlabel: 's (kJ/kg·K)', ylabel: 'h (kJ/kg)' });
      pl.frame();
      /* isolíneas de exergía: h = h0 + ψ + T0 (s − s0) */
      for (let ps = 0; ps <= 1600; ps += 200) pl.fn((s) => (d.h + ps * 1e3 + T0 * (s * 1e3 - d.s)) / 1e3, { color: ps === 0 ? '--c3' : '--c3', width: ps === 0 ? 1.8 : 0.8, alpha: ps === 0 ? 1 : 0.5 });
      for (const pp of [10, 100, 1000, 10000]) D.line(pl, D.isobar(W, pp * 1e3, 274, 900), 's', 'h', { color: '--c1', width: 1, alpha: 0.5 });
      D.drawDome(pl, W, 's', 'h');
      pl.dot(d.s / 1e3, d.h / 1e3, { color: '--ink', label: 'estado muerto' });
      pl.dot(st.s / 1e3, st.h / 1e3, { color: '--accent', r: 6 });
      pl.label(8.2, (d.h + 1400e3 + T0 * (8.2e3 - d.s)) / 1e3, 'ψ = 1400', { size: 10, color: '--c3', align: 'right' });
      pl.label(8.2, (d.h + T0 * (8.2e3 - d.s)) / 1e3, 'ψ = 0', { size: 10, color: '--c3', align: 'right', dy: 14 });
      sim.set('st', st.fase + ', s = ' + EM.fix(st.s / 1e3, 4) + ' kJ/kg·K');
      sim.set('e', EM.fix((st.h - d.h) / 1e3, 1) + ' kJ/kg');
      sim.set('x', EM.fix(psi / 1e3, 1) + ' kJ/kg');
      sim.set('r', EM.fix(psi / (st.h - d.h), 3));
    });
  });

  /* 12.4 Eficiencias de primera y segunda ley */
  const DEVS = { cal: 'Calefactor eléctrico de ambiente', ducha: 'Ducha eléctrica', bc: 'Bomba de calor para agua', estufa: 'Estufa a gas calentando una olla', nevera: 'Nevera', central: 'Central de ciclo combinado' };
  EM.defineSim('eficiencia-ii', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.select('d', { label: 'Equipo', options: Object.entries(DEVS), value: 'ducha' });
    sim.slider('T0', { label: 'Temperatura ambiente', min: 0, max: 35, step: 0.5, value: 16, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Tu', { label: 'Temperatura útil (espacio, agua o congelador)', min: -25, max: 100, step: 0.5, value: 38, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('perf', { label: 'Desempeño (COP, η de la estufa o de la central)', min: 0.2, max: 6, step: 0.01, value: 3.5, fmt: (v) => v.toFixed(2) });
    sim.out('I', 'Eficiencia de primera ley (o COP)', { hl: true });
    sim.out('II', 'Eficiencia de segunda ley');
    sim.out('n', 'Comentario');
    const FUEL = 1.037; /* exergía química / PCI del metano (Szargut) */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const T0 = p.T0 + 273.15, Tu = p.Tu + 273.15;
      let e1, e2, note;
      switch (p.d) {
        case 'cal': e1 = 1; e2 = Math.max(0, 1 - T0 / Tu); note = 'convierte electricidad (exergía pura) en calor de baja temperatura'; break;
        case 'ducha': e1 = 1; e2 = Tu > T0 ? (Tu - T0 - T0 * Math.log(Tu / T0)) / (Tu - T0) : 0; note = 'calienta agua desde la temperatura ambiente'; break;
        case 'bc': e1 = p.perf; e2 = p.perf * Math.max(0, 1 - T0 / Tu); note = 'η_II = COP / COP de Carnot'; break;
        case 'estufa': e1 = Math.min(1, p.perf); e2 = (Math.min(1, p.perf) * Math.max(0, 1 - T0 / Tu)) / FUEL; note = 'exergía del combustible ≈ 1.04 × poder calorífico inferior'; break;
        case 'nevera': e1 = p.perf; e2 = Tu < T0 ? p.perf / (Tu / (T0 - Tu)) : 0; note = 'η_II = COP / COP de Carnot (T_u es la del espacio frío)'; break;
        default: e1 = Math.min(0.65, p.perf); e2 = Math.min(0.65, p.perf) / FUEL; note = 'electricidad / exergía del gas';
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, ylabel: 'eficiencia', xticks: [] });
      pl.frame();
      [[e1 > 1 ? 1 : e1, 'primera ley' + (e1 > 1 ? ' (COP = ' + EM.fix(e1, 2) + ')' : ''), '--c1'], [e2, 'segunda ley', '--accent']].forEach(([v, n, c], i) => {
        ctx.fillStyle = EM.alpha(c, 0.7); const x0 = pl.X(i + 0.25), x1 = pl.X(i + 0.75);
        ctx.fillRect(x0, pl.Y(v), x1 - x0, pl.Y(0) - pl.Y(v));
        EM.text(ctx, n, (x0 + x1) / 2, pl.Y(v) - 8, { size: 12, align: 'center', color: '--ink' });
        EM.text(ctx, EM.fix(100 * v, 1) + ' %', (x0 + x1) / 2, pl.Y(v / 2), { size: 13, align: 'center', mono: true, color: '--ink', halo: true });
      });
      sim.set('I', e1 > 1 ? 'COP = ' + EM.fix(e1, 2) : EM.fix(100 * e1, 1) + ' %');
      sim.set('II', EM.fix(100 * e2, 2) + ' %');
      sim.set('n', note);
    });
  });
})();
