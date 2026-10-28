/* Capítulo 10 — Propiedades coligativas */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R, MW = 0.018015268;
  const SOL = {
    nacl: ['NaCl (modelo de Pitzer, real)', 58.44, 2, true], naclid: ['NaCl (ideal, i = 2)', 58.44, 2, false], sac: ['Sacarosa (ideal, i = 1)', 342.3, 1, false],
    glic: ['Etilenglicol (anticongelante, ideal)', 62.07, 1, false], cacl: ['CaCl₂ (ideal, i = 3)', 110.98, 3, false], urea: ['Urea (ideal)', 60.06, 1, false]
  };

  /* 10.1 Crioscopia y ebulloscopia */
  EM.defineSim('crioscopia', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('s', { label: 'Soluto en agua', options: Object.entries(SOL).map(([k, v]) => [k, v[0]]), value: 'nacl' });
    sim.slider('m', { label: 'Molalidad', min: 0, max: 6, step: 0.01, value: 1, unit: 'mol/kg', fmt: (v) => v.toFixed(2) });
    sim.out('f', 'Descenso del punto de congelación', { hl: true });
    sim.out('b', 'Ascenso del punto de ebullición (1 atm)');
    sim.out('aw', 'Actividad del agua <i>a</i><sub>w</sub> · fracción másica del soluto');
    sim.out('pi', 'Presión osmótica Π = −(<i>RT</i>/<i>V</i><sub>w</sub>) ln <i>a</i><sub>w</sub>');
    sim.onChange = (id) => { if (id === 's') { const mx = SOL[sim.p.s][3] ? 6 : 20; sim.ctl.m.range(0, mx, 0.01); if (sim.p.m > mx) sim.ctl.m.set(mx, true); } };
    const aw = (key, m) => { const d = SOL[key]; if (d[3]) return FQ.pitzerNaCl(m).aw; const x = 1 / (1 + (d[2] * m * MW)); return Math.exp(Math.log(x)); /* ideal: a_w = x_w */ };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, d = SOL[p.s];
      EM.draw.clear(cv);
      const mm = []; const f = (m) => FQ.freezeT(aw(p.s, m)) - 273.15;
      const ideal = (m) => -FQ.Kf * d[2] * m;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: Math.min(f(6), ideal(6)) * 1.05, ymax: 0, xlabel: 'molalidad m (mol/kg)', ylabel: 'T_congelación − 0 °C (°C)', ml: 52 });
      pl.frame();
      pl.fn(ideal, { color: '--ink-3', width: 1.4, dash: [6, 4], n: 120 });
      pl.fn(f, { color: '--c1', width: 2.6, n: 120 });
      pl.vline(p.m, { color: '--accent' }); pl.dot(p.m, f(p.m), { color: '--accent' });
      pl.legend([{ label: 'modelo (ley de Raoult + a_w)', color: '--c1' }, { label: 'primer orden: −K_f·i·m', color: '--ink-3', dash: [6, 4] }], 'bl');
      const a = aw(p.s, p.m), ln = Math.log(a);
      sim.set('f', EM.fix(-f(p.m), 2) + ' K (primer orden: ' + EM.fix(FQ.Kf * d[2] * p.m, 2) + ' K)');
      sim.set('b', EM.fix(FQ.Kb * d[2] * p.m * (d[3] ? FQ.pitzerNaCl(p.m).phi : 1), 2) + ' K, ebulle a ' + EM.fix(100 + FQ.Kb * d[2] * p.m * (d[3] ? FQ.pitzerNaCl(p.m).phi : 1), 2) + ' °C');
      sim.set('aw', EM.fix(a, 4) + ' · ' + EM.fix((100 * p.m * d[1] * 1e-3) / (1 + p.m * d[1] * 1e-3), 1) + ' % en masa');
      sim.set('pi', EM.fix((-R * 298.15 * ln) / (MW / 997) / 1e6, 2) + ' MPa (' + EM.fix((-R * 298.15 * ln) / (MW / 997) / 1e5, 1) + ' bar) a 25 °C');
    });
  });

  /* 10.2 Ósmosis inversa y desalinización */
  EM.defineSim('osmosis-inversa', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('S', { label: 'Salinidad del agua de alimentación', min: 2, max: 70, step: 0.5, value: 35, unit: 'g/kg', fmt: (v) => v.toFixed(1) });
    sim.slider('r', { label: 'Recuperación (fracción de agua obtenida)', min: 0.05, max: 0.9, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('pf', 'Presión osmótica de la alimentación · de la salmuera', { hl: true });
    sim.out('P', 'Presión mínima de operación (final de la membrana)');
    sim.out('w', 'Energía mínima termodinámica por m³ de agua producida');
    sim.out('real', 'Consumo típico de plantas reales de agua de mar');
    const m0 = (S) => (S / 58.44) / (1 - S / 1000);
    const Pi = (m) => FQ.pitzerNaCl(m).pi;
    const wmin = (S, r) => { const n = 400; let acc = 0; for (let i = 0; i < n; i++) { const rr = ((i + 0.5) / n) * r, aw = FQ.pitzerNaCl(m0(S) / (1 - rr)).aw; acc += (-R * 298.15 * Math.log(aw)) / MW; } return (acc / n) * 997 / 3.6e6; /* kWh/m³ */ };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, mf = m0(p.S), mb = mf / (1 - p.r);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.9, ymin: 0, ymax: 4.5, xlabel: 'recuperación r', ylabel: 'energía mínima (kWh/m³)', ml: 50 });
      pl.frame();
      pl.fn((r) => (r < 0.005 ? wmin(p.S, 0.005) : wmin(p.S, r)), { color: '--c1', width: 2.6, n: 60 });
      pl.hline(3, { color: '--c2', label: 'planta real (~3 kWh/m³)', dash: [5, 4] });
      pl.vline(p.r, { color: '--accent' }); pl.dot(p.r, wmin(p.S, p.r), { color: '--accent' });
      pl.legend([{ label: 'trabajo mínimo termodinámico', color: '--c1' }], 'tl');
      sim.set('pf', EM.fix(Pi(mf) * 10, 1) + ' bar · ' + EM.fix(Pi(mb) * 10, 1) + ' bar');
      sim.set('P', EM.fix(Pi(mb) * 10, 1) + ' bar (los equipos de agua de mar operan a 55–80 bar: ' + (Pi(mb) * 10 < 55 ? 'hay margen' : Pi(mb) * 10 < 80 ? 'en el límite de los equipos de agua de mar, hasta 80 bar' : 'se supera la presión de los equipos') + ')');
      sim.set('w', EM.fix(wmin(p.S, p.r), 2) + ' kWh/m³ (' + EM.fix(wmin(p.S, p.r) * 3.6, 2) + ' MJ/m³)');
      sim.set('real', '2.5 a 4 kWh/m³ (con recuperadores de energía); la brecha son pérdidas por bombas, permeado finito, fricción');
    });
  });

  /* 10.3 Glóbulo rojo en soluciones de NaCl */
  EM.defineSim('globulo-rojo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('c', { label: 'NaCl del medio (porcentaje en masa)', min: 0.05, max: 2.5, step: 0.01, value: 0.9, unit: '%', fmt: (v) => v.toFixed(2) });
    sim.slider('vb', { label: 'Fracción del volumen sin agua osmóticamente activa', min: 0.2, max: 0.5, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.out('os', 'Osmolalidad del medio', { hl: true });
    sim.out('V', 'Volumen relativo de la célula <i>V</i>/<i>V</i><sub>0</sub> (ecuación de Boyle–van\'t Hoff)');
    sim.out('est', 'Estado');
    const osm = (c) => { const m = (c * 10) / 58.44; return (2 * m * FQ.pitzerNaCl(Math.max(m, 1e-9)).phi * 1e6) / (1000 - c * 10); }; /* mOsm/kg de agua */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const o0 = osm(0.9), Vof = (c) => p.vb + (1 - p.vb) * (o0 / osm(c)); /* células ≈ 290 mOsm/kg, isotónica ≈ 0.9 % */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 2.5, ymin: 0.5, ymax: 2.6, xlabel: 'NaCl (% en masa)', ylabel: 'V/V₀', ml: 46 });
      pl.frame();
      pl.fn(Vof, { color: '--c1', width: 2.6, from: 0.05, n: 100 });
      pl.hline(1.5, { color: '--c2', label: 'volumen crítico de lisis (~1.5)', dash: [5, 4] });
      pl.vline(0.9, { color: '--ink-3', label: 'isotónico' });
      pl.vline(p.c, { color: '--accent' }); pl.dot(p.c, Vof(p.c), { color: '--accent' });
      /* dibujo de la célula */
      const cx = W * 0.82, cy = H / 2, v = Vof(p.c), r0 = Math.min(W * 0.1, H * 0.2), lysis = v >= 1.5;
      ctx.save();
      ctx.strokeStyle = EM.col(lysis ? '--c2' : '--c1'); ctx.lineWidth = 2.5; ctx.fillStyle = EM.alpha(lysis ? '--c2' : '--c2', 0.25);
      const rr = r0 * Math.cbrt(v) * 1.05, sq = v < 1 ? 1 - 0.55 * (1 - v) / 0.7 : 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * Math.max(0.3, sq), 0, 0, 7); ctx.fill(); ctx.stroke();
      if (v < 0.95) { ctx.beginPath(); ctx.arc(cx, cy, rr * 0.3, 0, 7); ctx.strokeStyle = EM.col('--c1'); ctx.stroke(); }
      ctx.restore();
      EM.text(ctx, lysis ? 'lisis' : v > 1.05 ? 'hinchada' : v < 0.95 ? 'crenada' : 'normal', cx, cy + r0 * 2, { size: 12.5, align: 'center', weight: 600, color: lysis ? '--c2' : '--ink' });
      sim.set('os', EM.fix(osm(p.c), 0) + ' mOsm/kg (sangre humana: unos 290)');
      sim.set('V', EM.fix(Vof(p.c), 2));
      sim.set('est', lysis ? 'hemólisis: la célula revienta' : v > 1.05 ? 'hipotónico: entra agua' : v < 0.95 ? 'hipertónico: sale agua, la célula se arruga (crenación)' : 'isotónico');
    });
  });
})();
