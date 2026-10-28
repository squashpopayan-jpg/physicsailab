/* Capítulo 19 — Catálisis: enzimas, cooperatividad y catálisis heterogénea */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, C = FQ.cat, R = FQ.R;

  /* 19.1 Michaelis–Menten: mecanismo completo frente a la aproximación de cuasi-estado estacionario */
  EM.defineSim('enz-mm', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('S0', { label: 'Sustrato inicial [S]₀', min: 1, max: 1000, step: 1, value: 100, log: true, unit: 'µM', fmt: (v) => EM.sci(v, 2) });
    sim.slider('E0', { label: 'Enzima total [E]₀', min: 0.001, max: 100, step: 0.001, value: 0.1, log: true, unit: 'µM', fmt: (v) => EM.sci(v, 2) });
    sim.slider('kcat', { label: 'Número de recambio k_cat', min: 0.1, max: 1000, step: 0.1, value: 10, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.slider('Km', { label: 'Constante de Michaelis K_M (mínimo k_cat/k₁, con k₁ = 10⁶ M⁻¹s⁻¹)', min: 1, max: 1000, step: 1, value: 50, log: true, unit: 'µM', fmt: (v) => EM.sci(v, 2) });
    sim.out('V', '<i>V</i><sub>max</sub> = <i>k</i><sub>cat</sub>[E]₀ · <i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> (eficiencia catalítica)', { hl: true });
    sim.out('eps', 'Parámetro de validez ε = [E]₀/(<i>K</i><sub>M</sub> + [S]₀) (Segel–Slemrod: ε ≪ 1)');
    sim.out('err', 'Máximo desvío de [S]<sub>total</sub>(t) de la ecuación integrada (W de Lambert) respecto del mecanismo completo');
    sim.out('t', 'Tiempo para que se consuma el 90 % del sustrato (mecanismo completo)');
    const k1 = 1; /* µM⁻¹ s⁻¹ = 10⁶ M⁻¹ s⁻¹ */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, S0 = p.S0, E0 = p.E0, kcat = p.kcat, km1 = Math.max(0, k1 * p.Km - kcat), Km = C.mmKm(k1, km1, kcat), Vm = kcat * E0;
      EM.draw.clear(cv);
      const tmax = Math.max(1e-3, (0.995 * S0 + Km * Math.log(200)) / Vm);
      const N = 140, ts = []; for (let i = 0; i <= N; i++) ts.push((tmax * i) / N);
      const ex = FQ.odeStiff(C.mmRHS(k1, km1, kcat), [S0, E0, 0, 0], ts, { rtol: 1e-8, atol: 1e-12 });
      const ST = ex.y.map((y) => y[0] + y[2]), P = ex.y.map((y) => y[3]), Sq = ts.map((t) => C.mmS(t, S0, Km, Vm));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.56, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: S0 * 1.03, xlabel: 't (s)', ylabel: 'concentración (µM)', ml: 52, title: 'Curva de progreso' });
      pl.frame();
      pl.xy(ts, ST, { color: '--ink', width: 2.8 }); pl.xy(ts, Sq, { color: '--c1', width: 2, dash: [6, 4] }); pl.xy(ts, P, { color: '--c3', width: 2.4 }); pl.xy(ts, ex.y.map((y) => y[2] * (S0 / Math.max(E0, 1e-9)) * 0.05), { color: '--c2', width: 1.2, dash: [2, 3] });
      pl.legend([{ label: '[S] + [ES] exacto', color: '--ink', width: 2.8 }, { label: 'ecuación integrada (QSSA)', color: '--c1', dash: [6, 4] }, { label: '[P]', color: '--c3' }, { label: '[ES] (×0.05[S]₀/[E]₀)', color: '--c2', dash: [2, 3] }], 'tr');
      const pl2 = new EM.Plot(ctx, { x: W * 0.59, y: 0, w: W * 0.41, h: H, xmin: 0, xmax: Math.max(5 * Km, S0 * 1.1), ymin: 0, ymax: Vm * 1.08, xlabel: '[S] (µM)', ylabel: 'v (µM/s)', ml: 46, mr: 8, title: 'v frente a [S]' });
      pl2.frame(); pl2.fn((s) => C.mm(s, Vm, Km), { color: '--c1', width: 2.6 }); pl2.hline(Vm, { color: '--ink-3', dash: [4, 4], label: 'V_max' }); pl2.hline(Vm / 2, { color: '--ink-3', dash: [2, 4] }); pl2.vline(Km, { color: '--ink-3', dash: [2, 4], label: 'K_M' });
      pl2.dot(S0, C.mm(S0, Vm, Km), { color: '--accent' });
      let mx = 0; for (let i = 0; i <= N; i++) mx = Math.max(mx, Math.abs(ST[i] - Sq[i]) / S0);
      const eps = C.mmEps(E0, S0, Km), i90 = ST.findIndex((s) => s <= 0.1 * S0);
      sim.set('V', EM.sci(Vm, 3) + ' µM/s · ' + EM.sci((kcat / Km) * 1e6, 2) + ' M⁻¹s⁻¹ (K_M = ' + EM.sci(Km, 3) + ' µM)');
      sim.set('eps', EM.sci(eps, 2) + (eps < 0.05 ? ' · la aproximación es excelente' : eps < 0.3 ? ' · aceptable' : ' · no válida: el complejo ES retiene una fracción apreciable del sustrato'));
      sim.set('err', EM.fix(100 * mx, 2) + ' % de [S]₀');
      sim.set('t', i90 > 0 ? EM.sci(ts[i90], 3) + ' s' : '> ' + EM.sci(tmax, 2) + ' s');
    });
  });

  /* 19.2 Inhibición reversible */
  const TIPO = { comp: ['Competitiva (el inhibidor solo se une a E)', 1, 0], nonc: ['No competitiva pura (se une a E y a ES con igual Kᵢ)', 1, 1], unc: ['Acompetitiva (solo se une a ES)', 0, 1], mix: ['Mixta (Kᵢ′ = 5Kᵢ)', 1, 5] };
  EM.defineSim('enz-inhib', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('tipo', { label: 'Tipo de inhibición', options: Object.entries(TIPO).map(([k, v]) => [k, v[0]]), value: 'comp' });
    sim.slider('I', { label: 'Inhibidor [I]', min: 0, max: 500, step: 1, value: 50, unit: 'µM', fmt: (v) => v.toFixed(0) });
    sim.slider('Ki', { label: 'Constante de inhibición Kᵢ', min: 1, max: 200, step: 1, value: 25, log: true, unit: 'µM', fmt: (v) => EM.sci(v, 2) });
    sim.out('app', 'Constantes aparentes con el inhibidor: <i>K</i><sub>M</sub>ap · <i>V</i><sub>max</sub>ap', { hl: true });
    sim.out('lb', 'Gráfica de Lineweaver–Burk (1/<i>v</i> frente a 1/[S]): qué cambia');
    sim.out('ic', 'CI₅₀ del inhibidor a [S] = <i>K</i><sub>M</sub> y a [S] = 10 <i>K</i><sub>M</sub>');
    const Vm = 100, Km = 50;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, t = TIPO[p.tipo], Ki = t[1] ? p.Ki : Infinity, Kip = t[2] ? (p.tipo === 'mix' ? 5 * p.Ki : p.Ki) : Infinity;
      EM.draw.clear(cv);
      const v = (S, I) => C.inhib(S, I, Vm, Km, Ki, Kip);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 500, ymin: 0, ymax: Vm * 1.02, xlabel: '[S] (µM)', ylabel: 'v (µM/min)', ml: 48, title: 'Velocidad inicial' });
      pl.frame(); pl.fn((s) => v(s, 0), { color: '--c1', width: 2.6 }); pl.fn((s) => v(s, p.I), { color: '--c4', width: 2.6 });
      pl.legend([{ label: 'sin inhibidor', color: '--c1' }, { label: 'con inhibidor', color: '--c4' }], 'br');
      const pl2 = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: -0.03, xmax: 0.1, ymin: -0.005, ymax: 0.07, xlabel: '1/[S] (µM⁻¹)', ylabel: '1/v (min/µM)', ml: 50, mr: 8, title: 'Lineweaver–Burk' });
      pl2.frame();
      const lb = (I) => { const a = C.inhibApp(I, Vm, Km, Ki, Kip); return [(x) => (1 / a.Vmax) * (1 + a.Km * x), a]; };
      pl2.fn(lb(0)[0], { color: '--c1', width: 2.4 }); pl2.fn(lb(p.I)[0], { color: '--c4', width: 2.4 });
      pl2.vline(0, { color: '--ink-3', dash: [3, 3] }); pl2.hline(0, { color: '--ink-3', dash: [3, 3] });
      const a = C.inhibApp(p.I, Vm, Km, Ki, Kip);
      sim.set('app', EM.fix(a.Km, 1) + ' µM · ' + EM.fix(a.Vmax, 1) + ' µM/min  (sin inhibidor: 50 µM · 100 µM/min)');
      sim.set('lb', p.tipo === 'comp' ? 'misma ordenada (V_max igual): las rectas se cortan en el eje vertical; solo cambia la pendiente' : p.tipo === 'nonc' ? 'misma abscisa (K_M igual): las rectas se cortan en el eje horizontal; sube la ordenada' : p.tipo === 'unc' ? 'rectas paralelas: K_M y V_max bajan en la misma proporción' : 'las rectas se cortan a la izquierda del eje vertical (en el segundo cuadrante)');
      sim.set('ic', EM.fix(C.ic50(Km, Km, Ki, Kip), 1) + ' µM · ' + EM.fix(C.ic50(10 * Km, Km, Ki, Kip), 1) + ' µM');
    });
  });

  /* 19.3 Cooperatividad: Hill y MWC (mioglobina y hemoglobina) */
  EM.defineSim('hill-mwc', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('L', { label: 'MWC: L = [T]/[R] sin ligando', min: 1, max: 1e7, step: 1, value: 8e5, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('c', { label: 'MWC: c = K_R/K_T', min: 0.001, max: 1, step: 0.001, value: 0.0063, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('KR', { label: 'MWC: K_R (constante de disociación de R)', min: 0.1, max: 20, step: 0.1, value: 0.8, log: true, unit: 'Torr', fmt: (v) => EM.sci(v, 2) });
    sim.out('p50', 'MWC (n = 4): <i>P</i><sub>50</sub> · coeficiente de Hill en el punto medio <i>n</i><sub>H</sub>', { hl: true });
    sim.out('sat', 'Saturación en los pulmones (100 Torr) · en el tejido (40 Torr) · fracción entregada');
    sim.out('mb', 'Mioglobina (<i>n</i> = 1, <i>P</i><sub>50</sub> = 2.8 Torr): lo mismo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Y = (x) => C.mwc(x, 4, p.KR, p.c, p.L), Mb = (x) => C.hill(x, 2.8, 1), Hb = (x) => C.hill(x, 26, 2.7);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 150, ymin: 0, ymax: 1.02, xlabel: 'presión parcial de O₂ (Torr)', ylabel: 'fracción de sitios ocupados', ml: 52 });
      pl.frame();
      pl.fn(Mb, { color: '--c3', width: 2.4, n: 300 }); pl.fn(Hb, { color: '--ink-3', width: 1.8, dash: [4, 4], n: 300 }); pl.fn(Y, { color: '--c1', width: 2.8, n: 300 });
      pl.vline(40, { color: '--accent', dash: [4, 3], label: 'tejido' }); pl.vline(100, { color: '--accent', dash: [4, 3], label: 'pulmón' });
      pl.legend([{ label: 'mioglobina (Hill, n = 1)', color: '--c3' }, { label: 'hemoglobina: Hill n = 2.7, P₅₀ = 26', color: '--ink-3', dash: [4, 4] }, { label: 'hemoglobina: MWC con los controles', color: '--c1' }], 'br');
      const p50 = C.half(Y, 1e-3, 1e5), nH = C.hillSlope(Y, p50);
      sim.set('p50', EM.fix(p50, 1) + ' Torr · ' + EM.fix(nH, 2));
      sim.set('sat', EM.fix(100 * Y(100), 1) + ' % · ' + EM.fix(100 * Y(40), 1) + ' % · ' + EM.fix(100 * (Y(100) - Y(40)), 1) + ' % de los sitios (Hill 2.7: ' + EM.fix(100 * (Hb(100) - Hb(40)), 1) + ' %)');
      sim.set('mb', EM.fix(100 * Mb(100), 1) + ' % · ' + EM.fix(100 * Mb(40), 1) + ' % · ' + EM.fix(100 * (Mb(100) - Mb(40)), 1) + ' %: se llena y casi no entrega');
    });
  });

  /* 19.4 Catálisis heterogénea: perfil de energía libre y volcán de Sabatier */
  EM.defineSim('volcan', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía de unión de A al catalizador, E', min: 0, max: 300, step: 1, value: 80, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('Etot', { label: 'Exotermicidad de la reacción A → P (−ΔE)', min: 20, max: 250, step: 5, value: 100, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 900, step: 10, value: 500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('alpha', { label: 'Coeficiente de Brønsted–Evans–Polanyi α', min: 0.2, max: 1, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('tof', 'Frecuencia de recambio TOF (sitios⁻¹ s⁻¹) · cobertura de A*', { hl: true });
    sim.out('g', 'ΔG del paso 1 (adsorción) · ΔG del paso 2 (reacción/desorción)');
    sim.out('lim', 'Paso limitante');
    sim.out('opt', 'Óptimo de la curva (barrido) · predicción de Sabatier: ΔG₁ = ΔG₂ → E = (−ΔE)/2 + <i>T</i>S<sub>g</sub>');
    const G0 = 60, Sg = 130;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, o = { T: p.T, Etot: p.Etot, G0, alpha: p.alpha, p: 1, Sg };
      EM.draw.clear(cv);
      const r = C.volcano(p.E, o);
      /* perfil de energía libre */
      const levels = [0, r.b1, r.dG1, r.dG1 + r.b2, -p.Etot], xs = [0, 1, 2, 3, 4], lo = Math.min(...levels, r.dG1) - 15, hi = Math.max(...levels) + 25;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.46, h: H, xmin: -0.3, xmax: 4.3, ymin: lo, ymax: hi, xlabel: 'coordenada de reacción', ylabel: 'energía libre (kJ/mol)', ml: 52, title: 'Ciclo catalítico', xticks: [] });
      pl.frame();
      const lv = [[0, 0, '--c2'], [2, r.dG1, '--c1'], [4, -p.Etot, '--c3']];
      lv.forEach(([x, y, c]) => pl.path([[x - 0.3, y], [x + 0.3, y]], { color: c, width: 3 }));
      [[1, r.b1], [3, r.dG1 + r.b2]].forEach(([x, y]) => pl.path([[x - 0.18, y], [x + 0.18, y]], { color: '--ink-3', width: 2.4 }));
      const curve = []; const pts = [[0.3, 0], [1, r.b1], [1.7, r.dG1], [2.3, r.dG1], [3, r.dG1 + r.b2], [3.7, -p.Etot]];
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; for (let s = 0; s <= 20; s++) { const u = s / 20, sm = 0.5 - 0.5 * Math.cos(Math.PI * u); curve.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * sm]); } }
      pl.path(curve, { color: '--ink', width: 1.6, dash: [1, 0] });
      pl.label(0, -6, 'A(g) + *', { size: 11 }); pl.label(2, r.dG1 - 8, 'A*', { size: 11 }); pl.label(4, -p.Etot - 8, 'P(g) + *', { size: 11 });
      /* volcán */
      const Es = [], Ts = []; let best = [0, -1];
      for (let e = 0; e <= 300; e += 2) { const q = C.volcano(e, o); Es.push(e); Ts.push(Math.log10(Math.max(q.tof, 1e-30))); if (q.tof > best[1]) best = [e, q.tof]; }
      const pl2 = new EM.Plot(ctx, { x: W * 0.49, y: 0, w: W * 0.51, h: H, xmin: 0, xmax: 300, ymin: Math.max(Math.min(...Ts) - 0.5, -15), ymax: Math.max(...Ts) + 1, xlabel: 'energía de unión E (kJ/mol)', ylabel: 'log₁₀ TOF', ml: 46, mr: 8, title: 'Volcán de Sabatier' });
      pl2.frame(); pl2.xy(Es, Ts, { color: '--c1', width: 2.8 }); pl2.dot(p.E, Math.log10(Math.max(r.tof, 1e-30)), { color: '--accent' });
      const Estar = p.Etot / 2 + (p.T * Sg) / 1e3; pl2.vline(Estar, { color: '--ink-3', dash: [4, 4], label: 'Sabatier' });
      sim.set('tof', EM.sci(r.tof, 2) + ' s⁻¹ · θ = ' + EM.sci(r.theta, 2));
      sim.set('g', EM.fix(r.dG1, 1) + ' · ' + EM.fix(r.dG2, 1) + ' kJ/mol');
      sim.set('lim', r.dG1 > r.dG2 + 5 ? 'paso 1 (A llega y se une con dificultad): la superficie queda casi vacía' : r.dG2 > r.dG1 + 5 ? 'paso 2: A se une demasiado fuerte, la superficie se envenena (θ → 1)' : 'ambos pasos comparables: cerca del óptimo');
      sim.set('opt', EM.fix(best[0], 0) + ' kJ/mol · ' + EM.fix(Estar, 0) + ' kJ/mol');
    });
  });
})();
