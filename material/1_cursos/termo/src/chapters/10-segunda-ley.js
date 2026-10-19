/* Capítulo 10 — Segunda ley y máquinas térmicas */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 10.1 Verificador de máquinas */
  EM.defineSim('verificador', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('mode', { label: 'Tipo de dispositivo', options: [['eng', 'Máquina térmica'], ['ref', 'Refrigerador'], ['hp', 'Bomba de calor']], value: 'eng' });
    sim.slider('TH', { label: 'Temperatura del foco caliente', min: -10, max: 1200, step: 1, value: 326.85, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('TC', { label: 'Temperatura del foco frío', min: -50, max: 100, step: 0.5, value: 26.85, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('QH', { label: 'Calor intercambiado con el foco caliente', min: 0, max: 200, step: 1, value: 100, unit: 'kJ', fmt: (v) => v.toFixed(0) });
    sim.slider('W', { label: 'Trabajo', min: 0, max: 200, step: 1, value: 60, unit: 'kJ', fmt: (v) => v.toFixed(0) });
    sim.out('v', 'Veredicto', { hl: true });
    sim.out('perf', 'Desempeño declarado · límite de Carnot');
    sim.out('S', 'Entropía generada por ciclo');
    sim.onChange = (id) => { if (id === 'mode') { if (sim.p.mode === 'eng') { sim.ctl.TH.set(326.85, true); sim.ctl.TC.set(26.85, true); sim.ctl.QH.set(100, true); sim.ctl.W.set(60, true); } else { sim.ctl.TH.set(35, true); sim.ctl.TC.set(-5, true); sim.ctl.QH.set(90, true); sim.ctl.W.set(10, true); } } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const TH_ = p.TH + 273.15, TC = p.TC + 273.15, eng = p.mode === 'eng';
      const QH = p.QH, W = p.W, QC = eng ? QH - W : QH - W; /* refrigerador: QH = QC + W */
      let verdict, perf, Sgen = 0;
      if (TH_ <= TC) { verdict = 'el foco «caliente» debe estar más caliente que el frío'; perf = '—'; }
      else if (QC < -1e-9) { verdict = 'viola la primera ley: el calor desechado sería negativo'; perf = '—'; }
      else {
        Sgen = eng ? -QH / TH_ + QC / TC : QH / TH_ - QC / TC;
        if (eng) { const eta = W / QH, ec = 1 - TC / TH_; perf = 'η = ' + EM.fix(eta, 3) + ' · η_C = ' + EM.fix(ec, 3); verdict = Sgen < -1e-9 ? 'IMPOSIBLE: viola la segunda ley (η &gt; η_C)' : Math.abs(Sgen) < 1e-6 ? 'reversible (máquina de Carnot)' : 'posible e irreversible'; }
        else { const cop = p.mode === 'ref' ? QC / W : QH / W, cc = p.mode === 'ref' ? TC / (TH_ - TC) : TH_ / (TH_ - TC); perf = 'COP = ' + EM.fix(cop, 3) + ' · COP_C = ' + EM.fix(cc, 3); verdict = Sgen < -1e-9 ? 'IMPOSIBLE: viola la segunda ley (COP &gt; COP de Carnot)' : Math.abs(Sgen) < 1e-6 ? 'reversible (Carnot)' : 'posible e irreversible'; }
      }
      /* diagrama de bloques */
      const cx = Wc / 2, y1 = 34, y2 = H - 34, box = 70;
      ctx.fillStyle = EM.alpha('--c2', 0.2); ctx.fillRect(cx - 150, y1 - 22, 300, 30); EM.text(ctx, 'foco caliente ' + EM.fix(TH_, 1) + ' K', cx, y1 - 2, { size: 12, align: 'center', color: '--ink' });
      ctx.fillStyle = EM.alpha('--c1', 0.2); ctx.fillRect(cx - 150, y2 - 8, 300, 30); EM.text(ctx, 'foco frío ' + EM.fix(TC, 1) + ' K', cx, y2 + 12, { size: 12, align: 'center', color: '--ink' });
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, H / 2, box / 2, 0, 7); ctx.stroke();
      EM.text(ctx, eng ? 'M' : p.mode === 'ref' ? 'R' : 'BC', cx, H / 2 + 5, { size: 16, align: 'center', color: '--ink' });
      const arrow = (x1, ya, x2, yb, lab, col) => { EM.draw.arrow(ctx, x1, ya, x2, yb, { color: col, width: 2.5 }); EM.text(ctx, lab, (x1 + x2) / 2 + (ya === yb ? 0 : 8), (ya + yb) / 2 + (ya === yb ? -10 : 4), { size: 12, color: col, align: ya === yb ? 'center' : 'left' }); };
      if (eng) { arrow(cx, y1 + 10, cx, H / 2 - box / 2 - 2, 'Q_H = ' + QH + ' kJ', '--c2'); arrow(cx, H / 2 + box / 2 + 2, cx, y2 - 10, 'Q_C = ' + EM.fix(QC, 1) + ' kJ', '--c1'); arrow(cx + box / 2 + 2, H / 2, cx + 150, H / 2, 'W = ' + W + ' kJ', '--accent'); }
      else { arrow(cx, H / 2 - box / 2 - 2, cx, y1 + 10, 'Q_H = ' + QH + ' kJ', '--c2'); arrow(cx, y2 - 10, cx, H / 2 + box / 2 + 2, 'Q_C = ' + EM.fix(QC, 1) + ' kJ', '--c1'); arrow(cx + 150, H / 2, cx + box / 2 + 2, H / 2, 'W = ' + W + ' kJ', '--accent'); }
      sim.set('v', verdict);
      sim.set('perf', perf);
      sim.set('S', EM.fix(Sgen * 1000, 2) + ' J/K' + (Sgen < -1e-9 ? ' (negativa: imposible)' : ''));
    });
  });

  /* 10.2 Ciclo de Carnot */
  EM.defineSim('carnot', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TH', { label: 'Temperatura caliente', min: 350, max: 1500, step: 5, value: 800, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('TC', { label: 'Temperatura fría', min: 250, max: 700, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Relación de expansión isotérmica <i>V</i>₂/<i>V</i>₁', min: 1.2, max: 5, step: 0.05, value: 2.5, fmt: (v) => v.toFixed(2) });
    sim.seg('dir', { label: 'Sentido', options: [['eng', 'Motor'], ['ref', 'Refrigerador']], value: 'eng' });
    sim.out('eta', 'Eficiencia · COP', { hl: true });
    sim.out('Q', '<i>Q<sub>H</sub></i> · <i>Q<sub>C</sub></i> · <i>W</i> (por mol)');
    let s = 0;
    sim.animate((dt) => { s = (s + dt * 0.12) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const TH_ = Math.max(p.TH, p.TC + 10), TC = p.TC, k = 1.4, R = TH.R, V1 = 0.001;
      const V2 = V1 * p.r, V3 = V2 * Math.pow(TH_ / TC, 1 / (k - 1)), V4 = V1 * Math.pow(TH_ / TC, 1 / (k - 1));
      const legs = [
        (t) => { const V = V1 * Math.pow(V2 / V1, t); return [V, (R * TH_) / V, TH_, R * Math.log(V / V1)]; },
        (t) => { const T = TH_ + (TC - TH_) * t, V = V2 * Math.pow(TH_ / T, 1 / (k - 1)); return [V, (R * T) / V, T, R * Math.log(p.r)]; },
        (t) => { const V = V3 * Math.pow(V4 / V3, t); return [V, (R * TC) / V, TC, R * Math.log(p.r) + R * Math.log(V / V3)]; },
        (t) => { const T = TC + (TH_ - TC) * t, V = V4 * Math.pow(TC / T, 1 / (k - 1)); return [V, (R * T) / V, T, 0]; }
      ];
      const pts = []; legs.forEach((f) => { for (let i = 0; i <= 40; i++) pts.push(f(i / 40)); });
      const col = p.dir === 'eng' ? '--accent' : '--c1';
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0.5, xmax: V3 * 1e3 * 1.1, xlog: true, ymin: Math.min(...pts.map((q) => q[1])) / 1e3 * 0.7, ymax: Math.max(...pts.map((q) => q[1])) / 1e3 * 1.3, ylog: true, xlabel: 'V (L/mol)', ylabel: 'P (kPa)' });
      pl.frame();
      pl.path(pts.map((q) => [q[0] * 1e3, q[1] / 1e3]), { color: col, width: 2.6 });
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: -1, xmax: R * Math.log(p.r) * 1.25 + 1, ymin: 0, ymax: TH_ * 1.15, xlabel: 'S − S₁ (J/mol·K)', ylabel: 'T (K)' });
      p2.frame();
      ctx.fillStyle = EM.alpha(col, 0.15); ctx.fillRect(p2.X(0), p2.Y(TH_), p2.X(R * Math.log(p.r)) - p2.X(0), p2.Y(TC) - p2.Y(TH_));
      ctx.fillStyle = EM.alpha('--c1', 0.08); ctx.fillRect(p2.X(0), p2.Y(TC), p2.X(R * Math.log(p.r)) - p2.X(0), p2.Y(0) - p2.Y(TC));
      p2.path(pts.map((q) => [q[3], q[2]]), { color: col, width: 2.6 });
      const sc = p.dir === 'eng' ? s : 1 - s, k4 = Math.floor(sc * 4) % 4, q = legs[k4](sc * 4 - k4);
      pl.dot(q[0] * 1e3, q[1] / 1e3, { color: '--c3', r: 6 }); p2.dot(q[3], q[2], { color: '--c3', r: 6 });
      ['1', '2', '3', '4'].forEach((n, i) => { const z = legs[i](0); pl.dot(z[0] * 1e3, z[1] / 1e3, { color: '--ink', r: 3, label: n }); p2.dot(z[3], z[2], { color: '--ink', r: 3, label: n }); });
      const QH = R * TH_ * Math.log(p.r), QC = R * TC * Math.log(p.r);
      sim.set('eta', p.dir === 'eng' ? 'η = ' + EM.fix(1 - TC / TH_, 4) : 'COP_R = ' + EM.fix(TC / (TH_ - TC), 3) + ' · COP_BC = ' + EM.fix(TH_ / (TH_ - TC), 3));
      sim.set('Q', EM.fix(QH, 1) + ' · ' + EM.fix(QC, 1) + ' · ' + EM.fix(QH - QC, 1) + ' J');
    });
  });

  /* 10.3 COP frente a Carnot */
  const DEV = [['Congelador doméstico', -23, 35, 1.6], ['Nevera (compartimiento)', -5, 35, 2.4], ['Aire acondicionado (split)', 7, 46, 3.3], ['Bomba de calor para agua', 10, 50, 3.5], ['Bomba de calor geotérmica', 8, 40, 4.5]];
  EM.defineSim('cop', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TC', { label: 'Temperatura del lado frío', min: -40, max: 25, step: 0.5, value: -23, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('TH', { label: 'Temperatura del lado caliente', min: 15, max: 70, step: 0.5, value: 35, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('f', { label: 'Fracción del COP de Carnot que logra el equipo', min: 0.2, max: 0.8, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.out('c', 'COP de Carnot: refrigeración · bomba de calor', { hl: true });
    sim.out('r', 'COP del equipo real');
    sim.out('e', 'Electricidad por kWh de calor útil');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 2, xmax: 80, ymin: 0, ymax: 15, xlabel: 'T_H − T_C (K)', ylabel: 'COP' });
      pl.frame();
      const TC = p.TC + 273.15, TH_ = Math.max(TC + 1, p.TH + 273.15), dT = TH_ - TC;
      pl.fn((d) => TC / d, { color: '--c1', width: 2.4 });
      pl.fn((d) => (TC + d) / d, { color: '--c2', width: 2.4, dash: [6, 4] });
      pl.fn((d) => (p.f * TC) / d, { color: '--c1', width: 1.2, alpha: 0.6 });
      DEV.forEach(([n, a, b, c], i) => pl.dot(b - a, c, { color: '--ink-3', r: 4, label: n, dx: i % 2 ? -6 : 6, dy: i % 2 ? 14 : -6, align: i % 2 ? 'right' : 'left' }));
      pl.dot(dT, TC / dT, { color: '--accent', r: 6 });
      pl.legend([{ label: 'COP_R de Carnot (T_C fija)', color: '--c1' }, { label: 'COP_{BC} de Carnot', color: '--c2', dash: [6, 4] }, { label: 'fracción elegida de Carnot', color: '--c1', width: 1.2 }, { label: 'equipos típicos', color: '--ink-3', kind: 'dot' }], 'tr');
      const cr = TC / dT, ch = TH_ / dT;
      sim.set('c', EM.fix(cr, 2) + ' · ' + EM.fix(ch, 2));
      sim.set('r', EM.fix(p.f * cr, 2) + ' (refr.) · ' + EM.fix(p.f * ch, 2) + ' (bomba)');
      sim.set('e', EM.fix(1 / (p.f * ch), 3) + ' kWh (resistencia eléctrica: 1 kWh)');
    });
  });

  /* 10.4 Curzon–Ahlborn */
  EM.defineSim('curzon', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TH', { label: 'Foco caliente', min: 400, max: 1500, step: 5, value: 838, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('TC', { label: 'Foco frío', min: 250, max: 400, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('kr', { label: 'Cociente de conductancias <i>K<sub>H</sub></i>/<i>K<sub>C</sub></i>', min: 0.1, max: 10, step: 0.05, value: 1, log: true, fmt: (v) => v.toFixed(2) });
    sim.out('ca', 'η a máxima potencia (Curzon–Ahlborn)', { hl: true });
    sim.out('c', 'η de Carnot');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const TH_ = Math.max(p.TH, p.TC + 10), TC = p.TC, ec = 1 - TC / TH_, eca = TH.curzon(TH_, TC);
      const KH = p.kr, KC = 1, K = (KH * KC) / (KH + KC);
      const P = (e) => K * e * (TH_ - TC / (1 - e));
      const Pmax = P(eca);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.15, xlabel: 'eficiencia η', ylabel: 'P / P_max' });
      pl.frame();
      pl.fn((e) => (e <= ec ? P(e) / Pmax : NaN), { color: '--accent', width: 2.6 });
      pl.vline(eca, { color: '--c3', label: 'η_CA' }); pl.vline(ec, { color: '--c2', label: 'η_C', labelY: 30 });
      const PL = [['West Thurrock', 838, 298, 0.36], ['CANDU', 573, 298, 0.3], ['Larderello', 523, 353, 0.16]];
      for (const [n, a, b, o] of PL) pl.dot(o, 0.05, { color: '--ink-3', r: 4, label: n + ' (' + o + ')', dy: 14 });
      sim.set('ca', EM.fix(eca, 4));
      sim.set('c', EM.fix(ec, 4));
    });
  });
})();
