/* Capítulo 22 — Dispositivos semiconductores */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss;

  /* 22.1 Celda solar */
  EM.defineSim('celda-solar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Eg', { label: 'Brecha E_g', min: 0.6, max: 2.4, step: 0.01, value: 1.12, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('X', { label: 'Concentración (soles)', min: 1, max: 1000, step: 1, log: true, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('jsc', 'J_{sc}', { hl: true });
    sim.out('voc', 'V_{oc}');
    sim.out('ff', 'Factor de llenado');
    sim.out('eta', 'Eficiencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = SS.sq(p.Eg, 5778, 300, p.X), vt = SS.Vt(300);
      const Jsc = r.Jsc / 10, J0 = r.J0 / 10; /* mA/cm² */
      const J = (V) => Jsc - J0 * Math.expm1(V / vt);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: Math.max(0.5, r.Voc * 1.1), ymin: 0, ymax: Jsc * 1.15, xlabel: 'V (V)', ylabel: 'J (mA/cm²)' });
      pl.frame();
      pl.fn(J, { color: '--c1', width: 2.6, to: r.Voc });
      ctx.save(); ctx.fillStyle = EM.alpha('--c2', 0.12); ctx.fillRect(pl.X(0), pl.Y(J(r.Vm)), pl.X(r.Vm) - pl.X(0), pl.Y(0) - pl.Y(J(r.Vm))); ctx.restore();
      pl.dot(r.Vm, J(r.Vm), { color: '--c2', r: 6, label: 'P_{máx}' });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: Math.max(0.5, r.Voc * 1.1), ymin: 0, ymax: r.Vm * J(r.Vm) * 1.2, xlabel: 'V (V)', ylabel: 'P (mW/cm²)' });
      p2.frame();
      p2.fn((V) => V * J(V), { color: '--c2', width: 2.4, to: r.Voc });
      p2.vline(r.Vm, { color: '--ink-3' });
      sim.set('jsc', EM.fix(Jsc, 2) + ' mA/cm² (Sol de cuerpo negro, ' + EM.fix(r.Pin / 10 / p.X, 1) + ' mW/cm² por sol)');
      sim.set('voc', EM.fix(r.Voc, 3) + ' V');
      sim.set('ff', EM.fix(r.FF, 3));
      sim.set('eta', EM.fix(100 * r.eta, 2) + ' %');
    });
  });

  /* 22.1b Shockley–Queisser */
  EM.defineSim('sq', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('X', { label: 'Concentración (soles)', min: 1, max: 46000, step: 1, log: true, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('max', 'Máximo', { hl: true });
    let key = -1, curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (key !== p.X) { key = p.X; curve = []; for (let Eg = 0.4; Eg <= 3.0; Eg += 0.02) curve.push([Eg, 100 * SS.sq(Eg, 5778, 300, p.X).eta]); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.4, xmax: 3, ymin: 0, ymax: 45, xlabel: 'E_g (eV)', ylabel: 'eficiencia máxima (%)' });
      pl.frame();
      pl.xy(curve.map((q) => q[0]), curve.map((q) => q[1]), { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.1 });
      const best = curve.reduce((a, b) => (b[1] > a[1] ? b : a));
      for (const [m, Eg] of [['Ge', 0.66], ['CIGS', 1.15], ['Si', 1.12], ['InP', 1.34], ['GaAs', 1.42], ['CdTe', 1.5], ['perovskita', 1.6], ['a-Si', 1.75], ['GaInP', 1.85]]) {
        const y = 100 * SS.sq(Eg, 5778, 300, p.X).eta;
        pl.dot(Eg, y, { color: '--c2', r: 4.5, label: m, dy: -10, dx: -10 });
      }
      sim.set('max', EM.fix(best[1], 1) + ' % en E_g = ' + EM.fix(best[0], 2) + ' eV');
    });
  });

  /* 22.2 LED */
  const LEDS = [['GaAs', 1.424], ['AlGaAs (rojo)', 1.89], ['AlGaInP (ámbar)', 2.08], ['InGaN (verde)', 2.38], ['InGaN (azul)', 2.70], ['GaN', 3.39]];
  EM.defineSim('led', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('pk', 'Picos de emisión', { hl: true });
    sim.out('w', 'Ancho a media altura (teórico 1.8 k_BT)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const kT = SS.kBeV * p.T, dEg = -4.5e-4 * (p.T - 300);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 330, xmax: 950, ymin: 0, ymax: 1.1, xlabel: 'λ (nm)', ylabel: 'intensidad (normalizada)' });
      pl.frame();
      for (let i = 0; i < 300; i++) { const l = 380 + (400 * i) / 300; ctx.fillStyle = EM.sd.css(EM.wavelengthRGB(l).map((c) => c / 255), 0.18); ctx.fillRect(pl.X(l), pl.iy + pl.ih - 10, pl.X(l + 1.4) - pl.X(l) + 0.5, 10); }
      const pk = [];
      for (const [name, Eg0] of LEDS) {
        const Eg = Eg0 + dEg;
        const I = (E) => (E > Eg ? Math.sqrt(E - Eg) * Math.exp(-(E - Eg) / kT) : 0);
        const Imax = Math.sqrt(kT / 2) * Math.exp(-0.5);
        const lp = 1239.84 / (Eg + kT / 2);
        const col = lp >= 380 && lp <= 780 ? `rgb(${EM.wavelengthRGB(lp).join(',')})` : lp < 380 ? '#7A44C9' : '#8A3030';
        pl.fn((l) => I(1239.84 / l) / Imax, { color: col, width: 2.2, n: 900 });
        pk.push(name + ' ' + EM.fix(lp, 0) + ' nm');
      }
      sim.set('pk', pk.join(' · '));
      sim.set('w', EM.fix(1000 * 1.795 * kT, 1) + ' meV');
    });
  });

  /* 22.4 MOSFET */
  EM.defineSim('mosfet', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Na', { label: 'Dopaje del sustrato N_a', min: 1e15, max: 1e18, step: 1e15, log: true, value: 1e17, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('tox', { label: 'Espesor del óxido', min: 1, max: 30, step: 0.1, value: 5, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.slider('WL', { label: 'W/L', min: 1, max: 50, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('vt', 'Tensión umbral V_T', { hl: true });
    sim.out('cox', 'C_{ox}');
    sim.out('id', 'I_D a V_{GS} = V_{DS} = 1.5 V');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const m = SS.mosVt(p.Na, p.tox * 1e-7, 300, -0.9), mu = SS.mobility(p.Na, 'n') * 0.5; /* movilidad de inversión ≈ mitad */
      const k = mu * m.Cox * p.WL; /* A/V² */
      const vgs = [0.5, 0.75, 1.0, 1.25, 1.5];
      const Imax = SS.mosId(1.5, 1.5, m.Vt, k) * 1e3 * 1.1 || 1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1.5, ymin: 0, ymax: Math.max(0.01, Imax), xlabel: 'V_{DS} (V)', ylabel: 'I_D (mA)' });
      pl.frame();
      const cols = ['--c6', '--c5', '--c3', '--c2', '--c1'];
      vgs.forEach((v, i) => { pl.fn((vd) => SS.mosId(v, vd, m.Vt, k) * 1e3, { color: cols[i], width: 2.2 }); if (v > m.Vt) pl.label(1.45, SS.mosId(v, 1.5, m.Vt, k) * 1e3, 'V_{GS} = ' + v + ' V', { size: 10.5, align: 'right', dy: -6, color: cols[i] }); });
      pl.fn((vd) => (k / 2) * vd * vd * 1e3, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      sim.set('vt', EM.fix(m.Vt, 3) + ' V (2φ_F = ' + EM.fix(2 * m.phiF, 3) + ' V)');
      sim.set('cox', EM.fix(m.Cox * 1e6, 3) + ' µF/cm²');
      sim.set('id', EM.fix(SS.mosId(1.5, 1.5, m.Vt, k) * 1e3, 3) + ' mA (µ_{n,ef} = ' + EM.fix(mu, 0) + ' cm²/V·s)');
    });
  });
})();
