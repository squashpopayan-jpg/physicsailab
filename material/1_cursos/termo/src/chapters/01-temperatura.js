/* Capítulo 1 — Sistemas, equilibrio y temperatura */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 1.1 Contacto térmico entre dos cuerpos */
  EM.defineSim('contacto-termico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('C1', { label: 'Capacidad calorífica del cuerpo 1', min: 1, max: 1000, step: 1, value: 400, unit: 'J/K', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('C2', { label: 'Capacidad calorífica del cuerpo 2 (termómetro)', min: 1, max: 1000, step: 1, value: 40, unit: 'J/K', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('T1', { label: 'Temperatura inicial 1', min: 0, max: 100, step: 0.5, value: 80, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('T2', { label: 'Temperatura inicial 2', min: 0, max: 100, step: 0.5, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('G', { label: 'Conductancia del contacto <i>G</i>', min: 0.5, max: 20, step: 0.1, value: 4, unit: 'W/K', fmt: (v) => v.toFixed(1) });
    sim.out('tf', 'Temperatura final', { hl: true });
    sim.out('tau', 'Constante de tiempo τ');
    sim.out('q', 'Calor transferido 1 → 2');
    sim.out('err', 'Error de inserción del termómetro');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const tau = (p.C1 * p.C2) / (p.G * (p.C1 + p.C2)), Tf = (p.C1 * p.T1 + p.C2 * p.T2) / (p.C1 + p.C2);
      const tmax = 5 * tau;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 100, xlabel: 't (s)', ylabel: 'T (°C)' });
      pl.frame();
      const d0 = p.T1 - p.T2;
      pl.fn((t) => Tf + (p.C2 / (p.C1 + p.C2)) * d0 * Math.exp(-t / tau), { color: '--c2', width: 2.6 });
      pl.fn((t) => Tf - (p.C1 / (p.C1 + p.C2)) * d0 * Math.exp(-t / tau), { color: '--c1', width: 2.6 });
      pl.hline(Tf, { color: '--ink-3', label: 'T_f = ' + EM.fix(Tf, 2) + ' °C', labelRight: true });
      pl.vline(tau, { label: 'τ' });
      pl.legend([{ label: 'cuerpo 1', color: '--c2' }, { label: 'cuerpo 2', color: '--c1' }], 'tr');
      sim.set('tf', EM.fix(Tf, 2) + ' °C');
      sim.set('tau', EM.fix(tau, 2) + ' s');
      sim.set('q', EM.fix((p.C1 * p.C2 / (p.C1 + p.C2)) * d0, 1) + ' J');
      sim.set('err', EM.fix(Tf - p.T1, 2) + ' °C respecto de la temperatura original del cuerpo 1');
    });
  });

  /* 1.2 Termómetro de gas a volumen constante */
  const GV = { N2: ['Nitrógeno', 0.137, 3.87e-5, '--c1'], Ar: ['Argón', 0.1355, 3.2e-5, '--c3'], CO2: ['Dióxido de carbono', 0.364, 4.267e-5, '--c2'], H2: ['Hidrógeno', 0.02476, 2.661e-5, '--c5'] };
  EM.defineSim('termometro-gas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('T', { label: 'Temperatura real del sistema', min: 200, max: 700, step: 0.01, value: 373.124, unit: 'K', fmt: (v) => v.toFixed(2) });
    sim.slider('Pm', { label: 'Presión máxima de llenado', min: 20, max: 300, step: 5, value: 120, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    for (const k of Object.keys(GV)) sim.check(k, { label: GV[k][0], value: true });
    sim.out('r', 'Lectura con P<sub>tp</sub> = máxima', { hl: true });
    sim.out('x', 'Extrapolación a P<sub>tp</sub> → 0');
    const Ttp = 273.16, R = TH.R;
    const B = (g, T) => GV[g][2] - GV[g][1] / (R * T);
    /* volumen molar con P = RT/v (1 + B/v): raíz mayor de P v² − RT v − RT B = 0 */
    const vOf = (g, T, P) => (R * T + Math.sqrt(R * R * T * T + 4 * P * R * T * B(g, T))) / (2 * P);
    const reading = (g, T, Ptp) => { const v = vOf(g, Ttp, Ptp), P = (R * T / v) * (1 + B(g, T) / v); return (Ttp * P) / Ptp; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Pm = p.Pm * 1e3, act = Object.keys(GV).filter((k) => p[k]);
      let lo = p.T, hi = p.T;
      for (const g of act) { const r = reading(g, p.T, Pm); lo = Math.min(lo, r); hi = Math.max(hi, r); }
      const pad = Math.max(0.05, (hi - lo) * 0.15);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: p.Pm, ymin: lo - pad, ymax: hi + pad, xlabel: 'P_{tp} (kPa)', ylabel: 'T* = 273.16 P/P_{tp} (K)', ml: 64 });
      pl.frame();
      pl.hline(p.T, { color: '--accent', dash: [], width: 1.6, label: 'T real = ' + p.T.toFixed(3) + ' K' });
      const leg = [];
      for (const g of act) {
        pl.fn((x) => (x <= 0 ? NaN : reading(g, p.T, x * 1e3)), { color: GV[g][3], width: 2.2, from: 0.5 });
        for (let i = 1; i <= 5; i++) { const x = (p.Pm * i) / 5; pl.dot(x, reading(g, p.T, x * 1e3), { color: GV[g][3], r: 3.5 }); }
        leg.push({ label: GV[g][0], color: GV[g][3] });
      }
      if (leg.length) pl.legend(leg, 'br');
      sim.set('r', act.map((g) => GV[g][0] + ': ' + reading(g, p.T, Pm).toFixed(3) + ' K').join('<br>') || '—');
      sim.set('x', act.map((g) => { const r1 = reading(g, p.T, Pm), r2 = reading(g, p.T, Pm / 2); return GV[g][0] + ': ' + (2 * r2 - r1).toFixed(3) + ' K'; }).join('<br>') || '—');
    });
  });

  /* 1.3 Escalas de temperatura */
  const FIX = [[13.8033, 'p.t. H₂'], [83.8058, 'p.t. Ar'], [273.16, 'p.t. agua'], [310.15, 'cuerpo humano'], [373.124, 'ebullición agua'], [505.078, 'sol. Sn'], [692.677, 'sol. Zn'], [933.473, 'sol. Al'], [1234.93, 'sol. Ag']];
  EM.defineSim('escalas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 0, max: 1300, step: 0.05, value: 293.15, unit: 'K', fmt: (v) => v.toFixed(2) });
    sim.out('k', 'Kelvin', { hl: true });
    sim.out('c', 'Celsius');
    sim.out('f', 'Fahrenheit');
    sim.out('r', 'Rankine');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const conv = [['K', (T) => T], ['°C', (T) => T - 273.15], ['°F', (T) => 1.8 * (T - 273.15) + 32], ['R', (T) => 1.8 * T]];
      const top = 24, bot = H - 26, Y = (T) => bot - ((bot - top) * T) / 1300;
      const xs = conv.map((_, i) => W * (0.2 + 0.16 * i));
      conv.forEach(([u, f], i) => {
        const x = xs[i];
        ctx.fillStyle = EM.alpha('--ink-3', 0.12); ctx.fillRect(x - 7, top, 14, bot - top);
        ctx.fillStyle = EM.col('--accent'); ctx.fillRect(x - 5, Y(p.T), 10, bot - Y(p.T));
        ctx.beginPath(); ctx.arc(x, bot + 8, 11, 0, 7); ctx.fill();
        /* marcas cada 100 unidades de la propia escala */
        const a = f(0), b = f(1300), st = 200;
        for (let v = Math.ceil(a / st) * st; v <= b; v += st) {
          const T = conv[0][1](0) + (v - a) / (b - a) * 1300;
          EM.text(ctx, String(v).replace('-', '−'), x + 12, Y(T) + 4, { size: 10, mono: true, color: '--ink-3' });
          ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(x + 7, Y(T), 4, 1);
        }
        EM.text(ctx, u, x, top - 8, { size: 13, align: 'center', color: '--ink', weight: 700 });
      });
      for (const [T, n] of FIX) {
        ctx.strokeStyle = EM.alpha('--c1', 0.35); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xs[0] - 10, Y(T)); ctx.lineTo(xs[3] + 50, Y(T)); ctx.stroke(); ctx.setLineDash([]);
        EM.text(ctx, n, xs[0] - 14, Y(T) + 4, { size: 10, align: 'right', color: '--c1' });
      }
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xs[0] - 10, Y(p.T)); ctx.lineTo(xs[3] + 50, Y(p.T)); ctx.stroke();
      sim.set('k', p.T.toFixed(2) + ' K');
      sim.set('c', EM.fix(p.T - 273.15, 2) + ' °C');
      sim.set('f', EM.fix(1.8 * (p.T - 273.15) + 32, 2) + ' °F');
      sim.set('r', EM.fix(1.8 * p.T, 2) + ' R');
    });
  });

  /* 1.4 Termistor NTC en divisor de tensión */
  const SH = [1.1291294e-3, 2.3412491e-4, 8.769416e-8], BETA = 3854.57;
  const Tsh = (R) => { const L = Math.log(R); return 1 / (SH[0] + SH[1] * L + SH[2] * L * L * L); };
  const Rsh = (T) => { let lo = 10, hi = 1e8; for (let i = 0; i < 120; i++) { const m = Math.sqrt(lo * hi); if (Tsh(m) > T) lo = m; else hi = m; } return Math.sqrt(lo * hi); };
  EM.defineSim('termistor', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('t', { label: 'Temperatura del agua', min: -20, max: 120, step: 0.1, value: 25, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Rf', { label: 'Resistencia fija del divisor', min: 1, max: 100, step: 0.1, value: 10, unit: 'kΩ', log: true, fmt: (v) => v.toFixed(1) });
    sim.seg('bits', { label: 'Convertidor analógico-digital', options: [[10, '10 bits (Arduino)'], [12, '12 bits (ESP32)']], value: 12 });
    sim.out('R', 'Resistencia del NTC', { hl: true });
    sim.out('V', 'Tensión en el NTC (3.3 V)');
    sim.out('n', 'Cuenta del convertidor');
    sim.out('dT', 'Resolución en temperatura');
    sim.out('b', 'Lectura con el modelo β (0–25 °C)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const T = p.t + 273.15, R = Rsh(T), Rf = p.Rf * 1e3, Vcc = 3.3, N = Math.pow(2, p.bits);
      const V = (Vcc * R) / (R + Rf), n = Math.round((V / Vcc) * (N - 1));
      /* resolución: dT por cuenta */
      const nOf = (TT) => { const r = Rsh(TT); return (r / (r + Rf)) * (N - 1); };
      const dT = 0.02 / Math.abs(nOf(T + 0.01) - nOf(T - 0.01));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -20, xmax: 120, ymin: 300, ymax: 2e5, ylog: true, xlabel: 't (°C)', ylabel: 'R (Ω)', ml: 60 });
      pl.frame();
      pl.fn((t) => Rsh(t + 273.15), { color: '--accent', width: 2.6 });
      pl.fn((t) => 1e4 * Math.exp(BETA * (1 / (t + 273.15) - 1 / 298.15)), { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.hline(Rf, { color: '--c3', label: 'R fija', labelRight: true });
      pl.dot(p.t, R);
      pl.legend([{ label: 'Steinhart–Hart (fabricante)', color: '--accent' }, { label: 'modelo β calibrado en 0 y 25 °C', color: '--c1', dash: [6, 4] }], 'tr');
      const Rmeas = (n / (N - 1)) * Rf / (1 - n / (N - 1));
      sim.set('R', EM.si(R, 'Ω'));
      sim.set('V', EM.fix(V, 4) + ' V');
      sim.set('n', n + ' de ' + (N - 1));
      sim.set('dT', EM.fix(dT, 3) + ' °C por cuenta');
      sim.set('b', isFinite(Rmeas) && Rmeas > 0 ? EM.fix(1 / (1 / 298.15 + Math.log(Rmeas / 1e4) / BETA) - 273.15, 2) + ' °C (Steinhart–Hart: ' + EM.fix(Tsh(Rmeas) - 273.15, 2) + ' °C)' : '—');
    });
  });
})();
