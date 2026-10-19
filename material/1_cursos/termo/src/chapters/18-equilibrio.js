/* Capítulo 18 — Equilibrio químico y de fases */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, R = TH.R;

  /* 18.1 N2O4 ⇌ 2 NO2 */
  EM.defineSim('gibbs-reaccion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Temperatura', min: -10, max: 140, step: 0.5, value: 25, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('P', { label: 'Presión', min: 0.05, max: 20, step: 0.01, value: 1, unit: 'bar', log: true, fmt: (v) => v.toFixed(2) });
    sim.out('a', 'Grado de disociación en el equilibrio', { hl: true });
    sim.out('K', '<i>K<sub>P</sub></i> · Δ<i>G</i>°');
    sim.out('y', 'Fracción molar de NO₂');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.t + 273.15;
      EM.draw.clear(cv);
      const dG = 57200 - T * 175.8, g2 = dG / (R * T); /* g°(NO2)·2 − g°(N2O4) = ΔG° */
      const G = (x) => { const n1 = 1 - x, n2 = 2 * x, n = 1 + x; return (n1 > 0 ? n1 * Math.log((n1 / n) * p.P) : 0) + (n2 > 0 ? n2 * (g2 / 2 + Math.log((n2 / n) * p.P)) : 0); };
      const r = TH.n2o4(T, p.P * 1e5);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.7, h: H, xmin: 0, xmax: 1, ymin: Math.min(G(r.alpha), 0) - 0.3, ymax: Math.max(G(0), G(0.999)) + 0.3, xlabel: 'grado de avance ξ (mol de N₂O₄ disociados)', ylabel: 'ΔG/RT respecto de N₂O₄ puro a 1 bar' });
      pl.frame();
      pl.fn(G, { color: '--accent', width: 2.6, from: 0.0005, to: 0.9995 });
      pl.vline(r.alpha, { color: '--c3', label: 'mínimo' });
      pl.dot(r.alpha, G(r.alpha), { color: '--c3', r: 6 });
      /* recipiente con color pardo según la concentración de NO2 */
      const y2 = (2 * r.alpha) / (1 + r.alpha), conc = Math.min(1, (y2 * p.P) / 3);
      const bx = W * 0.75, bw = W * 0.2, by = 30, bh = H - 70;
      ctx.fillStyle = 'rgba(150,70,20,' + (0.08 + 0.8 * conc).toFixed(3) + ')'; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      EM.text(ctx, 'color ∝ concentración de NO₂', bx + bw / 2, by + bh + 16, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('a', EM.fix(100 * r.alpha, 2) + ' %');
      sim.set('K', EM.sci(r.K, 4) + ' · ' + EM.fix(dG / 1000, 2) + ' kJ/mol');
      sim.set('y', EM.fix(y2, 4));
    });
  });

  /* 18.2 Constantes de equilibrio y disociación */
  EM.defineSim('disociacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 1000, max: 3500, step: 10, value: 2500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión', min: 0.1, max: 50, step: 0.1, value: 1, unit: 'atm', log: true, fmt: (v) => v.toFixed(1) });
    sim.out('co2', 'CO₂ disociado', { hl: true });
    sim.out('h2o', 'H₂O disociada');
    sim.out('no', 'NO en aire (fracción molar)');
    const P0 = 101325 / 1e5; /* atm en bar */
    const diss = (rx, T, P) => { const K = Math.exp(TH.lnKp(rx, T)), Pb = P * P0; return TH.bisect((a) => { const n = 1 + a / 2; return ((a / n) * Math.sqrt(a / 2 / n) / ((1 - a) / n)) * Math.sqrt(Pb) - K; }, 1e-14, 1 - 1e-12, 1e-14); };
    const noAir = (T) => { const K = Math.exp(TH.lnKp('no', T)); return TH.bisect((z) => z / Math.sqrt((0.79 - z / 2) * (0.21 - z / 2)) - K, 0, 0.4, 1e-16); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0.28, xmax: 1.0, ymin: -30, ymax: 5, xlabel: '1000/T (1/K)', ylabel: 'ln K_P' });
      pl.frame();
      const cols = { co2: '--c2', h2o: '--c1', no: '--c3', wgs: '--c5' };
      for (const rx of Object.keys(TH.RXN)) pl.fn((x) => TH.lnKp(rx, 1000 / x), { color: cols[rx], width: 2, n: 60 });
      pl.vline(1000 / p.T, { color: '--accent' });
      pl.legend(Object.keys(TH.RXN).map((rx) => ({ label: TH.RXN[rx].n, color: cols[rx] })), 'bl');
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 1500, xmax: 3500, ymin: 0, ymax: 1, xlabel: 'T (K)', ylabel: 'fracción disociada · 10×x_{NO}' });
      p2.frame();
      p2.fn((T) => diss('co2', T, p.P), { color: '--c2', width: 2.2, n: 50 });
      p2.fn((T) => diss('h2o', T, p.P), { color: '--c1', width: 2.2, n: 50 });
      p2.fn((T) => 10 * noAir(T), { color: '--c3', width: 2.2, n: 50 });
      p2.vline(p.T, { color: '--accent' });
      sim.set('co2', EM.fix(100 * diss('co2', p.T, p.P), 3) + ' % (ln K = ' + EM.fix(TH.lnKp('co2', p.T), 3) + ')');
      sim.set('h2o', EM.fix(100 * diss('h2o', p.T, p.P), 3) + ' %');
      sim.set('no', EM.fix(1e6 * noAir(p.T), 0) + ' ppm');
    });
  });

  /* 18.3 Raoult: benceno–tolueno */
  const ant = (A, B, C, t) => Math.pow(10, A - B / (t + C)) * 133.322;
  const Pb = (t) => ant(6.90565, 1211.033, 220.79, t), Pt = (t) => ant(6.95464, 1344.8, 219.482, t);
  EM.defineSim('raoult', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('P', { label: 'Presión', min: 50, max: 150, step: 0.1, value: 101.3, unit: 'kPa', fmt: (v) => v.toFixed(1) });
    sim.slider('x', { label: 'Fracción molar de benceno en el líquido inicial', min: 0.02, max: 0.98, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('Tb', 'Temperatura de burbuja', { hl: true });
    sim.out('y', 'Composición del primer vapor');
    sim.out('n', 'Etapas ideales para llegar a 95 % de benceno');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e3;
      EM.draw.clear(cv);
      const Tbub = (x) => TH.bisect((t) => x * Pb(t) + (1 - x) * Pt(t) - P, 20, 160, 1e-10);
      const yOf = (x) => (x * Pb(Tbub(x))) / P;
      const tb = TH.bisect((t) => Pb(t) - P, 20, 160), tt = TH.bisect((t) => Pt(t) - P, 20, 160);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: tb - 5, ymax: tt + 5, xlabel: 'fracción molar de benceno', ylabel: 'T (°C)' });
      pl.frame();
      const xs = [], Tl = [], Yv = [];
      for (let i = 0; i <= 80; i++) { const x = i / 80, T = Tbub(x); xs.push(x); Tl.push(T); Yv.push((x * Pb(T)) / P); }
      pl.xy(xs, Tl, { color: '--c1', width: 2.4 }); pl.xy(Yv, Tl, { color: '--c2', width: 2.4 });
      pl.label(0.3, Tbub(0.3), 'líquido saturado (burbuja)', { size: 10.5, color: '--c1', dy: 16 });
      pl.label(0.3, Tbub(0.3) + 0.65 * (tt - tb) * 0.18, 'vapor saturado (rocío)', { size: 10.5, color: '--c2', dy: -10 });
      /* escalones */
      let x = p.x, n = 0;
      while (x < 0.95 && n < 30) { const T = Tbub(x), y = yOf(x); pl.path([[x, T], [y, T]], { color: '--accent', width: 1.6 }); const Tn = Tbub(Math.min(0.999, y)); pl.path([[y, T], [y, Tn]], { color: '--accent', width: 1.6 }); x = y; n++; }
      pl.dot(p.x, Tbub(p.x), { color: '--accent', r: 6 });
      sim.set('Tb', EM.fix(Tbub(p.x), 2) + ' °C (puros: ' + EM.fix(tb, 1) + ' y ' + EM.fix(tt, 1) + ' °C)');
      sim.set('y', EM.fix(yOf(p.x), 4));
      sim.set('n', n);
    });
  });

  /* 18.4 Propiedades coligativas */
  const SOL = { nacl: ['Sal (NaCl)', 58.44, 2], azucar: ['Azúcar (sacarosa)', 342.3, 1], cacl2: ['Cloruro de calcio', 110.98, 3], glicol: ['Etilenglicol (anticongelante)', 62.07, 1] };
  EM.defineSim('coligativas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('s', { label: 'Soluto', options: Object.entries(SOL).map(([k, v]) => [k, v[0]]), value: 'nacl' });
    sim.slider('g', { label: 'Gramos por kilogramo de agua', min: 0, max: 300, step: 1, value: 35, unit: 'g', fmt: (v) => v.toFixed(0) });
    sim.slider('z', { label: 'Altitud', min: 0, max: 4000, step: 10, value: 0, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('m', 'Molalidad de partículas <i>i·m</i>', { hl: true });
    sim.out('b', 'Ebullición');
    sim.out('f', 'Congelación');
    sim.out('k', '<i>K<sub>b</sub></i> · <i>K<sub>f</sub></i> a esta presión');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, M, i] = SOL[p.s], P = TH.isa(p.z).P, Tb0 = TH.agua.Tsat(P), hfg = TH.agua.sat(Tb0).hfg;
      const Kb = (R * Tb0 * Tb0 * 0.018015) / (hfg * 0.018015), Kf = (R * 273.15 * 273.15 * 0.018015) / 6010;
      const m = (p.g / M) * i;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0, xmax: 6, ymin: 0, ymax: 4, xlabel: 'i·m (mol de partículas / kg)', ylabel: 'ascenso de ebullición (K)' });
      pl.frame(); pl.fn((x) => Kb * x, { color: '--c2', width: 2.4 }); pl.dot(m, Kb * m, { color: '--c2', r: 6 });
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 0, xmax: 6, ymin: -12, ymax: 0, xlabel: 'i·m (mol de partículas / kg)', ylabel: 'descenso de congelación (K)' });
      p2.frame(); p2.fn((x) => -Kf * x, { color: '--c1', width: 2.4 }); p2.dot(m, -Kf * m, { color: '--c1', r: 6 });
      sim.set('m', EM.fix(m, 3) + ' mol/kg' + (m > 2 ? ' (fuera del régimen diluido)' : ''));
      sim.set('b', EM.fix(Tb0 - 273.15 + Kb * m, 3) + ' °C (agua pura ' + EM.fix(Tb0 - 273.15, 2) + ' °C)');
      sim.set('f', EM.fix(-Kf * m, 3) + ' °C');
      sim.set('k', EM.fix(Kb, 3) + ' · ' + EM.fix(Kf, 3) + ' K·kg/mol');
    });
  });
})();
