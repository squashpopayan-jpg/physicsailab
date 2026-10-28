/* Capítulo 15 — Baterías, celdas de combustible y electrólisis */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R, F = FQ.F, T0 = 298.15;
  const G = (k) => FQ.tt[k].G * 1e3;

  /* 15.1 Energía específica: teoría frente a práctica */
  const eAcid = (-(2 * G('PbSO4(s)') + 2 * -237130 - G('PbO2(s)') - 2 * G('SO4_2-(aq)'))) / F / 2; /* E° del plomo–ácido, V */
  const wAcid = (2 * F * eAcid) / 3.6 / 642.6; /* Wh/kg de reactivos (Pb + PbO₂ + 2 H₂SO₄ = 642.6 g) */
  const eAlk = (-(G('ZnO(s)') + G('Mn2O3(s)') - 2 * G('MnO2(s)'))) / (2 * F), wAlk = (2 * F * eAlk) / 3.6 / (65.38 + 2 * 86.94);
  const cap = (...q) => 1 / q.reduce((s, v) => s + 1 / v, 0);
  const BAT = [
    { n: 'Plomo–ácido', V: eAcid, th: wAcid, pr: 35, nota: 'Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O; 2 e⁻; E° de las tablas de formación', cls: '--c4' },
    { n: 'Alcalina Zn–MnO₂', V: eAlk, th: wAlk, pr: 120, nota: 'Zn + 2MnO₂ → ZnO + Mn₂O₃; primaria (no recargable)', cls: '--c4' },
    { n: 'Li-ion LCO/grafito', V: 3.9, th: cap(137, 372) * 3.9, pr: 200, nota: 'LiCoO₂ (0.5 Li, 137 mAh/g) y grafito (372 mAh/g)', cls: '--c1' },
    { n: 'Li-ion LFP/grafito', V: 3.3, th: cap(170, 372) * 3.3, pr: 150, nota: 'LiFePO₄ (170 mAh/g); más seguro, meseta plana', cls: '--c1' },
    { n: 'Li-ion NMC811/grafito', V: 3.7, th: cap(200, 372) * 3.7, pr: 250, nota: 'cátodo de 200 mAh/g', cls: '--c1' },
    { n: 'Li-azufre', V: 2.15, th: cap(1675, 3860) * 2.15, pr: 350, nota: 'prototipos; el polisulfuro se disuelve (efecto «lanzadera»)', cls: '--c3' },
    { n: 'Li–aire (Li₂O₂)', V: 2.96, th: (2 * F * 2.96) / 3.6 / 45.88, pr: 0, nota: 'solo en el laboratorio; el oxígeno no se cuenta en la masa de la celda', cls: '--c5' }
  ];
  EM.defineSim('baterias', function (sim) {
    const cv = sim.canvas({ aspect: 1.65 });
    sim.seg('sc', { label: 'Escala del eje vertical', options: [['log', 'logarítmica'], ['lin', 'lineal']], value: 'log' });
    sim.select('b', { label: 'Química', options: BAT.map((b, i) => [i, b.n]), value: 2 });
    sim.check('gas', { label: 'Mostrar la gasolina como referencia (12 900 Wh/kg de combustible)', value: true });
    sim.out('V', 'Tensión nominal', { hl: true });
    sim.out('th', 'Energía específica teórica de los reactivos · de la celda típica');
    sim.out('r', 'Fracción aprovechada');
    sim.out('n', 'Observación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, i = +p.b, b = BAT[i], log = p.sc === 'log';
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: BAT.length - 0.5 + (p.gas ? 1 : 0), ymin: log ? 20 : 0, ymax: log ? 20000 : 4000, ylog: log, xlabel: '', ylabel: 'Wh/kg', ml: 58, xticks: BAT.map((_, k) => k).concat(p.gas ? [BAT.length] : []), xfmt: (v) => { const k = Math.round(v); return k < BAT.length ? BAT[k].n.replace('Li-ion ', '').replace('Alcalina ', '').replace('Plomo–ácido', 'Pb-ácido') : 'gasolina'; } });
      pl.frame();
      BAT.forEach((q, k) => { pl.dot(k - 0.12, q.th, { color: '--ink-3', r: k === i ? 7 : 5 }); if (q.pr) pl.dot(k + 0.12, q.pr, { color: q.cls, r: k === i ? 7 : 5 }); });
      if (p.gas) { pl.dot(BAT.length, 12900, { color: '--c2', r: 7 }); pl.label(BAT.length - 0.1, 12900, 'gasolina', { size: 11, align: 'right', dy: -10 }); }
      pl.legend([{ label: 'teórica (termodinámica de los reactivos)', color: '--ink-3', kind: 'dot' }, { label: 'celda comercial típica', color: '--c1', kind: 'dot' }], 'tl');
      sim.set('V', EM.fix(b.V, 2) + ' V');
      sim.set('th', EM.fix(b.th, 0) + ' · ' + (b.pr ? b.pr : '—') + ' Wh/kg');
      sim.set('r', b.pr ? EM.fix((100 * b.pr) / b.th, 0) + ' % de la teórica (el resto: electrolito, colectores, carcasa, voltaje de operación)' : '—');
      sim.set('n', b.nota);
    });
  });

  /* 15.2 Electrodo de intercalación: curva de descarga */
  EM.defineSim('intercalacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('om', { label: 'Interacción Li–Li en el sólido Ω', min: -2, max: 12, step: 0.1, value: 0, unit: 'kJ/mol', fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura', min: 253, max: 333, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Régimen de descarga (C-rate)', min: 0.05, max: 5, step: 0.05, value: 1, unit: 'C', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('Rc', { label: 'Caída óhmica de la celda a 1C', min: 0, max: 0.4, step: 0.005, value: 0.08, unit: 'V', fmt: (v) => v.toFixed(3) });
    sim.out('pl', 'Perfil del potencial de equilibrio', { hl: true });
    sim.out('Q', 'Fracción de la capacidad entregada hasta el corte (3.0 V)');
    sim.out('Vm', 'Tensión media de descarga · eficiencia de energía');
    const E0 = 3.4, Vcut = 3.0;
    const Eeq = (x, T, om) => { const RT = R * T; if (om > 2 * RT / 1e3) { const xb = FQ.bisect((y) => Math.log(y / (1 - y)) + ((om * 1e3) / RT) * (1 - 2 * y), 1e-9, 0.5 - 1e-9, 1e-14); if (x > xb && x < 1 - xb) return E0; } return E0 - (RT * Math.log(x / (1 - x)) + om * 1e3 * (1 - 2 * x)) / F; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 2.6, ymax: 4.2, xlabel: 'fracción de litio insertado x (descarga →)', ylabel: 'V frente a Li⁺/Li', ml: 50 });
      pl.frame();
      const xs = [], eq = [], dc = [];
      for (let i = 1; i < 400; i++) { const x = i / 400; xs.push(x); eq.push(Eeq(x, T, p.om)); const act = ((R * T) / (0.5 * F)) * Math.asinh(p.c / 3); dc.push(Eeq(x, T, p.om) - p.c * p.Rc - act * 0.3); }
      pl.xy(xs, eq, { color: '--ink-3', width: 1.6, dash: [6, 4] }); pl.xy(xs, dc, { color: '--c1', width: 2.6 });
      pl.hline(Vcut, { color: '--c2', label: 'tensión de corte', dash: [5, 4] });
      let qd = 0; for (let k = 0; k < xs.length; k++) { if (dc[k] >= Vcut) qd = xs[k]; else break; }
      let eOut = 0, eEq = 0; for (let k = 0; k < xs.length && xs[k] <= qd; k++) { eOut += dc[k]; eEq += eq[k]; }
      const nn = Math.max(1, Math.round(qd * 400));
      pl.vline(qd, { color: '--accent', alpha: 0.5, width: 1 });
      pl.legend([{ label: 'equilibrio (circuito abierto)', color: '--ink-3', dash: [6, 4] }, { label: 'bajo carga al régimen elegido', color: '--c1' }], 'tr');
      sim.set('pl', p.om > (2 * R * T) / 1e3 ? 'meseta plana (dos fases coexisten): Ω > 2RT = ' + EM.fix((2 * R * T) / 1e3, 2) + ' kJ/mol' : 'curva inclinada (disolución sólida)');
      sim.set('Q', EM.fix(100 * qd, 1) + ' %');
      sim.set('Vm', EM.fix(eOut / nn, 3) + ' V · ' + EM.fix((100 * eOut) / eEq, 1) + ' %');
    });
  });

  /* 15.3 Electrolizador y celda de combustible */
  EM.defineSim('pila-electrolisis', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('mode', { label: 'Dispositivo', options: [['el', 'Electrolizador PEM'], ['fc', 'Celda de combustible PEM']], value: 'el' });
    sim.slider('T', { label: 'Temperatura', min: 293, max: 373, step: 1, value: 333, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('i', { label: 'Densidad de corriente', min: 0.01, max: 3, step: 0.01, value: 1, unit: 'A/cm²', fmt: (v) => v.toFixed(2) });
    sim.slider('R', { label: 'Resistencia óhmica de la membrana', min: 0.03, max: 0.3, step: 0.005, value: 0.1, unit: 'Ω·cm²', fmt: (v) => v.toFixed(3) });
    sim.out('E', 'Potencial reversible <i>E</i><sub>rev</sub>(<i>T</i>)', { hl: true });
    sim.out('V', 'Tensión de operación');
    sim.out('ef', 'Eficiencia de tensión (frente al poder calorífico superior)');
    sim.out('x', 'Energía específica · potencia');
    const Erev = (T) => 1.229 - 8.46e-4 * (T - T0); /* H₂O(l) ⇌ H₂ + ½O₂: dE/dT = −ΔS/(2F) = −0.85 mV/K */
    /* Electrolizador: η_OER = (RT/F) asinh(i/2i₀ₐ) (α = 1 efectivo, i₀ₐ = 10⁻⁷ A/cm²), η_HER = (RT/αF) asinh(i/2i₀c) (α = 0.5, i₀c = 0.5 A/cm²); celda de combustible: η_ORR = (RT/F) ln((i + i_x)/i₀) (i₀ = 10⁻⁷ A/cm², i_x = 2 mA/cm² por cruce de H₂), η_conc = −0.03 ln(1 − i/i_L), i_L = 3.2 A/cm². Valores típicos de la literatura de PEM; ilustrativos. */
    const Vof = (el, T, i, Rm) => {
      const E = Erev(T), RTF = (R * T) / F;
      if (el) return E + RTF * Math.asinh(i / (2 * 1e-7)) + (RTF / 0.5) * Math.asinh(i / (2 * 0.5)) + i * Rm;
      return E - RTF * Math.log((i + 2e-3) / 1e-7) - i * Rm + 0.03 * Math.log(Math.max(1 - i / 3.2, 1e-6));
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T, f = F / (R * T), el = p.mode === 'el';
      EM.draw.clear(cv);
      const E = Erev(T);
      const V = (i) => Vof(el, T, i, p.R);
      const is = []; for (let k = 0; k <= 300; k++) is.push(0.005 + (3 * k) / 300);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 3, ymin: el ? 1.0 : 0.2, ymax: el ? 2.6 : 1.3, xlabel: 'densidad de corriente (A/cm²)', ylabel: 'V (V)', ml: 50 });
      pl.frame();
      pl.hline(E, { color: '--ink-3', label: 'E_rev = ' + EM.fix(E, 3) + ' V', dash: [5, 4] });
      if (el) pl.hline(1.481, { color: '--c4', label: 'termoneutro 1.481 V', dash: [5, 4] });
      pl.xy(is, is.map(V), { color: '--c1', width: 2.6 });
      pl.dot(p.i, V(p.i), { color: '--accent' });
      if (!el) { pl.xy(is, is.map((i) => V(i) * i * 0.4), { color: '--c3', width: 1.8, dash: [6, 4] }); pl.legend([{ label: 'V(i)', color: '--c1' }, { label: 'potencia (W/cm², escala ×0.4)', color: '--c3', dash: [6, 4] }], 'tr'); }
      const Vo = V(p.i);
      sim.set('E', EM.fix(E, 3) + ' V (' + EM.fix((-0.846 * 1), 2) + ' mV/K)');
      sim.set('V', EM.fix(Vo, 3) + ' V a ' + EM.fix(p.i, 2) + ' A/cm²');
      if (el) { sim.set('ef', EM.fix((100 * 1.481) / Vo, 1) + ' % (1.481/V)'); sim.set('x', EM.fix((2 * F * Vo) / 3.6e6 / 0.002016, 1) + ' kWh/kg de H₂ · ' + EM.fix(Vo * p.i, 2) + ' W/cm² consumidos'); }
      else { sim.set('ef', EM.fix((100 * Vo) / 1.481, 1) + ' % (V/1.481)'); sim.set('x', EM.fix((2 * F * Vo) / 3.6e6 / 0.002016, 1) + ' kWh por kg de H₂ consumido · ' + EM.fix(Vo * p.i, 3) + ' W/cm² producidos'); }
    });
  });
})();
