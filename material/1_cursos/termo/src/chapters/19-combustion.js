/* Capítulo 19 — Combustión */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;
  const FUELS = ['CH4', 'C3H8', 'C4H10', 'C8H18', 'C2H5OH', 'H2', 'C'];
  const SPN = { CO2: 'CO₂', H2O: 'H₂O', N2: 'N₂', O2: 'O₂', CO: 'CO', H2: 'H₂' };
  const SPC = { CO2: '--c2', H2O: '--c1', N2: '--c6', O2: '--c3', CO: '--c4', H2: '--c5' };
  const formula = (f) => { const F = TH.FUEL[f]; const p = (n, s) => (n === 0 ? '' : s + (n === 1 ? '' : EM.sup ? String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]) : n)); return f === 'C2H5OH' ? 'C₂H₅OH' : p(F.C, 'C') + p(F.H, 'H') + p(F.O, 'O'); };
  const fx = (n) => (Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : EM.fix(n, 3));

  /* 19.1 Estequiometría */
  EM.defineSim('estequiometria', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.select('f', { label: 'Combustible', options: FUELS.map((k) => [k, TH.FUEL[k].n]), value: 'CH4' });
    sim.slider('lam', { label: 'Fracción de aire teórico λ', min: 0.6, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('eq', 'Reacción balanceada', { hl: true });
    sim.out('af', 'Relación aire–combustible (masa)');
    sim.out('o2', 'O₂ en humos secos');
    sim.out('dp', 'Punto de rocío de los humos (1 atm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const c = TH.combustion(p.f, p.lam), pr = c.prod, n = Object.values(pr).reduce((a, b) => a + b, 0);
      const keys = Object.keys(pr).filter((k) => pr[k] > 1e-12);
      /* barra apilada de fracciones molares */
      let x = 40; const bw = W - 80, by = H * 0.35, bh = 46;
      EM.text(ctx, 'Composición molar de los productos', W / 2, by - 16, { size: 12, align: 'center', color: '--ink-2' });
      for (const k of keys) {
        const w = (bw * pr[k]) / n;
        ctx.fillStyle = EM.alpha(SPC[k], 0.7); ctx.fillRect(x, by, w, bh);
        if (w > 34) EM.text(ctx, SPN[k] + ' ' + EM.fix((100 * pr[k]) / n, 1) + ' %', x + w / 2, by + bh / 2 + 4, { size: 11, align: 'center', color: '--ink' });
        x += w;
      }
      const dry = n - pr.H2O;
      sim.set('eq', formula(p.f) + ' + ' + fx(c.a) + ' (O₂ + 3.76 N₂) → ' + keys.map((k) => fx(pr[k]) + ' ' + SPN[k]).join(' + '));
      sim.set('af', EM.fix(c.AF, 2) + ' kg de aire por kg de combustible');
      sim.set('o2', EM.fix((100 * pr.O2) / dry, 2) + ' %' + (pr.CO > 0 ? ' · CO ' + EM.fix((100 * pr.CO) / dry, 2) + ' %' : ''));
      sim.set('dp', pr.H2O > 0 ? EM.fix(TH.tsatW((pr.H2O / n) * 101325) - 273.15, 1) + ' °C' : '— (sin agua)');
    });
  });

  /* 19.2 Combustibles: poder calorífico y CO2 */
  const LIT = [
    ['Hidrógeno', TH.PCI('H2') / 1e6, 0, 0.0899, false],
    ['Gas natural (metano)', TH.PCI('CH4') / 1e6, 54.9, 0.68, false],
    ['GLP (propano)', TH.PCI('C3H8') / 1e6, 64.6, 1.88, false],
    ['Gasolina', 44.4, 69.4, 745, false],
    ['Diésel', 42.8, 74.1, 835, false],
    ['Etanol', TH.PCI('C2H5OH') / 1e6, 71.3, 789, true],
    ['Carbón bituminoso', 25.8, 94.6, 800, false],
    ['Leña seca', 15.6, 112, 450, true],
    ['Bagazo (50 % humedad)', 7.6, 100, 150, true]
  ];
  EM.defineSim('combustibles', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('v', { label: 'Mostrar', options: [['m', 'Energía por kg'], ['co2', 'CO₂ por MJ']], value: 'm' });
    sim.out('n', 'Fuente', { hl: true });
    sim.set('n', 'gases y líquidos: PCI calculado con NIST-JANAF; sólidos: valores típicos e IPCC 2006');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const m = p.v === 'm', vals = LIT.map((r) => (m ? r[1] : r[2]));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: (m ? 125 : 120), ymin: 0, ymax: LIT.length, xlabel: m ? 'PCI (MJ/kg)' : 'CO₂ emitido (g por MJ de PCI)', yticks: [], ml: 170 });
      pl.frame();
      LIT.forEach((r, i) => {
        const y = LIT.length - i - 0.5, v = vals[i];
        ctx.fillStyle = EM.alpha(r[4] && !m ? '--c3' : m ? '--c1' : '--c2', 0.7);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.32), pl.X(v) - pl.X(0), pl.Y(y - 0.32) - pl.Y(y + 0.32));
        EM.text(ctx, r[0], pl.X(0) - 6, pl.Y(y) + 4, { size: 11, align: 'right', color: '--ink-2' });
        EM.text(ctx, EM.fix(v, 1) + (r[4] && !m ? ' (biogénico)' : ''), pl.X(v) + 4, pl.Y(y) + 4, { size: 10.5, mono: true, color: '--ink-3' });
      });
    });
  });

  /* 19.3 Temperatura de llama adiabática */
  EM.defineSim('llama', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Combustible', options: FUELS.filter((k) => k !== 'C').map((k) => [k, TH.FUEL[k].n]), value: 'CH4' });
    sim.slider('lam', { label: 'Fracción de aire teórico λ', min: 0.8, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('Tr', { label: 'Temperatura del aire de entrada', min: 298, max: 1000, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('T', 'Llama adiabática sin disociación', { hl: true });
    sim.out('Td', 'Con disociación de CO₂ y H₂O');
    let cache = {}, ck = '';
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const k = p.f + '|' + p.Tr;
      if (k !== ck) {
        cache = { a: [], b: [] };
        for (let i = 0; i <= 44; i++) { const l = 0.8 + (2.2 * i) / 44; cache.a.push([l, TH.flameT(p.f, l, p.Tr)]); if (l >= 1) cache.b.push([l, TH.flameTdiss(p.f, l, 1.01325, p.Tr)]); }
        ck = k;
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.8, xmax: 3, ymin: 1000, ymax: 2900, xlabel: 'λ (fracción de aire teórico)', ylabel: 'T (K)' });
      pl.frame();
      pl.path(cache.a, { color: '--c2', width: 2.4 });
      pl.path(cache.b, { color: '--accent', width: 2.4, dash: [6, 4] });
      pl.vline(1, { label: 'estequiométrica' });
      const T = TH.flameT(p.f, p.lam, p.Tr), Td = p.lam >= 1 ? TH.flameTdiss(p.f, p.lam, 1.01325, p.Tr) : NaN;
      pl.dot(p.lam, T, { color: '--c2', r: 6 });
      pl.legend([{ label: 'sin disociación', color: '--c2' }, { label: 'con disociación (CO, H₂, O₂)', color: '--accent', dash: [6, 4] }], 'tr');
      sim.set('T', EM.fix(T, 0) + ' K (' + EM.fix(T - 273.15, 0) + ' °C)');
      sim.set('Td', isFinite(Td) ? EM.fix(Td, 0) + ' K' : 'mezcla rica: no calculada');
    });
  });

  /* 19.4 Caldera */
  EM.defineSim('caldera', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Combustible', options: [['CH4', 'Gas natural (metano)'], ['C3H8', 'GLP (propano)']], value: 'CH4' });
    sim.slider('lam', { label: 'Fracción de aire teórico λ', min: 1, max: 2.5, step: 0.01, value: 1.3, fmt: (v) => v.toFixed(2) });
    sim.slider('Ts', { label: 'Temperatura de los humos', min: 30, max: 400, step: 1, value: 200, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('e', 'Eficiencia (sobre el PCI)', { hl: true });
    sim.out('l', 'Pérdida sensible · latente recuperado');
    sim.out('o2', 'O₂ en humos secos');
    sim.out('dp', 'Punto de rocío de los humos');
    const T0 = 298.15;
    const eff = (f, lam, Ts) => {
      const c = TH.combustion(f, lam), F = TH.FUEL[f], PCI = TH.PCI(f) * F.M * 1e-3, n = Object.values(c.prod).reduce((a, b) => a + b, 0);
      let L = 0; for (const [k, nn] of Object.entries(c.prod)) L += nn * (TH.dhMol(k, Ts + 273.15) - TH.dhMol(k, T0));
      /* condensación: agua que no cabe como vapor saturado a Ts */
      const Pv = TH.psatW(Ts + 273.15), dryn = n - c.prod.H2O, nvmax = Pv >= 101325 ? Infinity : (Pv / (101325 - Pv)) * dryn;
      const cond = Math.max(0, c.prod.H2O - nvmax), lat = cond * 44004;
      return { eta: 1 - L / PCI + lat / PCI, L: L / PCI, lat: lat / PCI, c, n };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 30, xmax: 400, ymin: 0.7, ymax: 1.1, xlabel: 'temperatura de los humos (°C)', ylabel: 'eficiencia (PCI)' });
      pl.frame();
      for (const l of [1.05, 1.3, 1.6, 2.0]) pl.fn((t) => eff(p.f, l, t).eta, { color: l === 1.3 ? '--c1' : '--grid-2', width: 1.2, n: 80 });
      pl.fn((t) => eff(p.f, p.lam, t).eta, { color: '--accent', width: 2.6, n: 120 });
      pl.hline(1, { color: '--ink-3', label: '100 % del PCI' });
      const r = eff(p.f, p.lam, p.Ts);
      pl.dot(p.Ts, r.eta, { color: '--accent', r: 6 });
      const dew = TH.tsatW((r.c.prod.H2O / r.n) * 101325) - 273.15;
      pl.vline(dew, { color: '--c1', label: 'rocío' });
      sim.set('e', EM.fix(100 * r.eta, 1) + ' %');
      sim.set('l', EM.fix(100 * r.L, 1) + ' % · ' + EM.fix(100 * r.lat, 1) + ' %');
      sim.set('o2', EM.fix((100 * r.c.prod.O2) / (r.n - r.c.prod.H2O), 2) + ' %');
      sim.set('dp', EM.fix(dew, 1) + ' °C');
    });
  });
})();
