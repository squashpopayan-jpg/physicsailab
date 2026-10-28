/* Capítulo 38 — Bioenergética y membranas */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, B = FQ.bio, H = B.HH, R = 8.314462618, Fa = 96485.33212;

  /* 38.1 ATP, acoplamiento y desequilibrio */
  EM.defineSim('acople-atp', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('atp', { label: '[ATP]', min: 0.1, max: 10, step: 0.05, value: 3, unit: 'mM', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('adp', { label: '[ADP] libre', min: 0.005, max: 5, step: 0.005, value: 0.1, unit: 'mM', log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('pi', { label: '[Pi]', min: 0.1, max: 30, step: 0.05, value: 5, unit: 'mM', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 275, max: 315, step: 0.5, value: 310.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('g', 'ΔG de la hidrólisis del ATP en estas condiciones (ΔG°′ = −30.5 kJ/mol)', { hl: true });
    sim.out('k', 'Cociente [ATP]/[ADP] actual · en equilibrio ([Pi]/<i>K</i>′) · factor de desequilibrio');
    sim.out('c', 'Glucosa + Pi → glucosa-6-P (ΔG°′ = +13.8): [G6P]/[Glc] sin acoplar · acoplada al ATP · ganancia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, half = cv.w * 0.5, T = p.T; EM.draw.clear(cv);
      const names = B.LADDER.map((q) => q.id === 'atp-amp' ? 'ATP → AMP + PPi' : q.id === 'atp' ? 'ATP → ADP + Pi' : q.nm.split(' →')[0]), p1 = new EM.Plot(ctx, { x: 0, y: 0, w: half, h: cv.h, xmin: -75, xmax: 0, ymin: -0.5, ymax: B.LADDER.length - 0.5, ylog: false, xlabel: 'ΔG°′ de hidrólisis (kJ/mol)', ylabel: '', ml: 150, mr: 8, yticks: B.LADDER.map((_, i) => i), yfmt: (v) => names[Math.round(v)] || '' });
      p1.frame(); B.LADDER.forEach((q, i) => p1.dot(q.g, i, { color: q.id === 'atp' ? '--accent' : '--c1', r: q.id === 'atp' ? 6.5 : 5 }));
      p1.vline(-30.5, { color: '--accent', dash: [3, 3] });
      const xs = Array.from({ length: 200 }, (_, i) => Math.pow(10, -9 + (13 * i) / 199)), g = (r, pi) => B.dG(-30.5e3, pi / r, T) / 1e3;
      const p2 = new EM.Plot(ctx, { x: half, y: 0, w: cv.w - half, h: cv.h, xmin: 1e-9, xmax: 1e4, ymin: -80, ymax: 20, xlog: true, xlabel: '[ATP]/[ADP]', ylabel: 'ΔG hidrólisis (kJ/mol)', ml: 52, mr: 10 });
      p2.frame(); p2.hline(0, { color: '--ink-3', dash: [4, 3] });
      [[0.001, '--c3'], [0.005, '--c1'], [0.03, '--c2']].forEach(([pi, c]) => p2.xy(xs, xs.map((r) => g(r, pi)), { color: c, width: 2 }));
      const ra = p.atp / p.adp, ge = B.dG(-30.5e3, (p.adp * 1e-3 * p.pi * 1e-3) / (p.atp * 1e-3), T) / 1e3; p2.dot(ra, ge, { color: '--accent', r: 6 });
      p2.legend([{ label: '[Pi] = 1 mM', color: '--c3' }, { label: '5 mM', color: '--c1' }, { label: '30 mM', color: '--c2' }], 'tr');
      const Keq = B.K(-30.5e3, T), req = (p.pi * 1e-3) / Keq, unc = (Keq ** -1) * 0 + Math.exp(-13.8e3 / (R * T)) * p.pi * 1e-3, acc = Math.exp(16.7e3 / (R * T)) * (p.atp / p.adp);
      sim.set('g', EM.fix(ge, 1) + ' kJ/mol');
      sim.set('k', EM.fix(ra, 2) + ' · ' + EM.sci(req, 2) + ' · ' + EM.sci(ra / req, 2) + '×');
      sim.set('c', EM.sci(unc, 2) + ' · ' + EM.sci(acc, 2) + ' · ' + EM.sci(acc / unc, 2) + '×');
    });
  });

  /* 38.2 Cadena respiratoria */
  EM.defineSim('cadena-respiratoria', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('pH', { label: 'pH de la matriz', min: 6.5, max: 8, step: 0.05, value: 7.6, fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: '[NADH]/[NAD⁺]', min: 0.001, max: 10, step: 0.001, value: 0.1, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('dp', { label: 'Fuerza protón-motriz Δp', min: 0.1, max: 0.24, step: 0.002, value: 0.194, unit: 'V', fmt: (v) => v.toFixed(3) });
    sim.out('e', 'Δ<i>E</i>°′ (NAD⁺/NADH → ½O₂/H₂O) · ΔG°′ por par de electrones', { hl: true });
    sim.out('c', 'Complejo I (NADH → UQ) · complejo III (UQH₂ → cit <i>c</i>) · complejo IV (cit <i>c</i> → O₂): ΔG°′ en kJ por par de electrones');
    sim.out('r', 'Con el pH y el cociente elegidos: ΔG real por par de electrones · energía de 10 H⁺ a Δp · fracción conservada');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = 310.15, car = B.ETC, f = (T * R * Math.LN10) / Fa; EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: car.length - 0.5, ymin: -0.4, ymax: 0.9, xlabel: '', ylabel: "E°′ (V, pH 7)", ml: 52, xticks: car.map((_, i) => i), xfmt: (v) => (['NAD', 'FMN', 'Fum', 'UQ', 'b', 'c₁', 'c', 'a', 'a₃', 'O₂'][Math.round(v)] || '') });
      pl.frame(); car.forEach((q, i) => pl.dot(i, q.E, { color: i === 0 ? '--c2' : i === car.length - 1 ? '--c3' : '--c1', r: 6 }));
      pl.xy(car.map((_, i) => i), car.map((q) => q.E), { color: '--c1', width: 1.4, dash: [4, 3] });
      [[0, 3, 'I'], [3, 6, 'III'], [6, 9, 'IV']].forEach(([a, b, nm]) => pl.arrow(a + 0.1, car[a].E, b - 0.1, car[b].E, { color: '--accent' }));
      pl.label(1.5, 0.23, 'I', { color: '--accent' }); pl.label(4.5, 0.17, 'III', { color: '--accent' }); pl.label(7.5, 0.6, 'IV', { color: '--accent' });
      const dE = car[9].E - car[0].E, d = (a, b) => B.dGredox(2, car[b].E - car[a].E) / 1e3;
      const Enad = car[0].E - (f / 2) * (p.pH - 7) - (R * T / (2 * Fa)) * Math.log(p.r), Eo2 = car[9].E - f * (p.pH - 7), dEr = Eo2 - Enad, gr = B.dGredox(2, dEr) / 1e3, gp = 10 * Fa * p.dp / 1e3;
      sim.set('e', EM.fix(dE, 3) + ' V · ' + EM.fix(B.dGredox(2, dE) / 1e3, 1) + ' kJ/mol');
      sim.set('c', EM.fix(d(0, 3), 1) + ' · ' + EM.fix(B.dGredox(2, car[6].E - car[3].E) / 1e3, 1) + ' · ' + EM.fix(B.dGredox(2, car[9].E - car[6].E) / 1e3, 1));
      sim.set('r', EM.fix(gr, 1) + ' kJ/mol · ' + EM.fix(gp, 1) + ' kJ/mol · ' + EM.fix((100 * gp) / -gr, 0) + ' %');
    });
  });

  /* 38.3 Quimiosmosis */
  EM.defineSim('quimiosmosis', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('dpsi', { label: 'Potencial de membrana Δψ (P − N)', min: 0, max: 220, step: 1, value: 150, unit: 'mV', fmt: (v) => v.toFixed(0) });
    sim.slider('dpH', { label: 'ΔpH (matriz − espacio intermembrana)', min: 0, max: 1.6, step: 0.01, value: 0.75, fmt: (v) => v.toFixed(2) });
    sim.slider('g', { label: 'ΔG de síntesis de ATP en la matriz', min: 40, max: 70, step: 0.5, value: 55, unit: 'kJ/mol', fmt: (v) => v.toFixed(1) });
    sim.select('c', { label: 'Anillo c de la ATP sintasa', options: [[8, 'c₈ (bovino, 2.67 H⁺/ATP)'], [10, 'c₁₀ (levadura, <i>E. coli</i>; 3.33)'], [12, 'c₁₂ (3 H⁺ + 1)'], [14, 'c₁₄ (cloroplasto, 4.67)']], value: 8 });
    sim.out('p', 'Fuerza protón-motriz Δp = Δψ + 59·ΔpH (a 25 °C) · energía por mol de H⁺', { hl: true });
    sim.out('n', 'Protones mínimos por ATP (termodinámica) · protones por ATP del anillo + transportador de Pi');
    sim.out('e', 'Eficiencia termodinámica de la síntesis · P/O (10 H⁺ bombeados por par de electrones)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = 298.15, dp = B.pmf(p.dpsi / 1e3, p.dpH, T), n = +p.c / 3 + 1; EM.draw.clear(cv);
      const ns = Array.from({ length: 100 }, (_, i) => 2 + (4 * i) / 99), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 2, xmax: 6, ymin: 0, ymax: 1.5, xlabel: 'protones por ATP n', ylabel: 'ΔG_ATP / (n·F·Δp)', ml: 52 });
      pl.frame(); pl.xy(ns, ns.map((x) => (p.g * 1e3) / (x * Fa * dp)), { color: '--c1', width: 2.8 }); pl.hline(1, { color: '--accent', dash: [4, 3], label: 'límite termodinámico' });
      [8, 10, 12, 14].forEach((c) => pl.dot(c / 3 + 1, (p.g * 1e3) / ((c / 3 + 1) * Fa * dp), { color: c === +p.c ? '--accent' : '--c2', r: c === +p.c ? 7 : 4.5 })); pl.vline(B.nmin(p.g * 1e3, dp), { color: '--c3', dash: [3, 3], label: 'n mínimo' });
      sim.set('p', EM.fix(dp * 1e3, 0) + ' mV · ' + EM.fix((Fa * dp) / 1e3, 1) + ' kJ/mol');
      sim.set('n', EM.fix(B.nmin(p.g * 1e3, dp), 2) + ' · ' + EM.fix(n, 2));
      sim.set('e', EM.fix((100 * (p.g * 1e3)) / (n * Fa * dp), 0) + ' % · ' + EM.fix(B.PO(+p.c), 2));
    });
  });

  /* 38.4 Potenciales de Nernst y de Goldman–Hodgkin–Katz */
  EM.defineSim('potencial-membrana', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ko', { label: '[K⁺] exterior', min: 1, max: 40, step: 0.1, value: 5, unit: 'mM', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('pna', { label: 'P_Na/P_K', min: 0.001, max: 100, step: 0.001, value: 0.04, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('pcl', { label: 'P_Cl/P_K', min: 0.001, max: 10, step: 0.001, value: 0.45, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 275, max: 315, step: 0.5, value: 310.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('n', 'Nernst: <i>E</i><sub>K</sub> · <i>E</i><sub>Na</sub> · <i>E</i><sub>Cl</sub> (mV) con [K]ᵢ = 140, [Na]ᵢ = 15, [Cl]ᵢ = 10; [Na]ₒ = 145, [Cl]ₒ = 110 mM', { hl: true });
    sim.out('g', 'Potencial de reposo GHK (mV) · corriente neta GHK a ese potencial (debe ser 0)');
    sim.out('w', 'Bomba Na⁺/K⁺ (3 Na⁺ fuera, 2 K⁺ dentro): ΔG por ciclo · fracción de un ATP (−55 kJ/mol) · acumulación máxima de glucosa con 2 Na⁺ (SGLT)');
    const Ki = 140, Nai = 15, Cli = 10, Nao = 145, Clo = 110;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T; EM.draw.clear(cv);
      const ions = (r, Ko) => [{ P: 1, z: 1, co: Ko, ci: Ki }, { P: r, z: 1, co: Nao, ci: Nai }, { P: p.pcl, z: -1, co: Clo, ci: Cli }];
      const rs = Array.from({ length: 200 }, (_, i) => 0.001 * Math.pow(1e5, i / 199)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.001, xmax: 100, ymin: -100, ymax: 70, xlog: true, xlabel: 'P_Na/P_K', ylabel: 'potencial de membrana (mV)', ml: 52 });
      pl.frame(); pl.hline(B.nernst(1, p.Ko, Ki, T) * 1e3, { color: '--c1', dash: [4, 3], label: 'E_K' }); pl.hline(B.nernst(1, Nao, Nai, T) * 1e3, { color: '--c2', dash: [4, 3], label: 'E_Na' });
      pl.xy(rs, rs.map((r) => B.ghk(ions(r, p.Ko), T) * 1e3), { color: '--c3', width: 2.8 }); const V = B.ghk(ions(p.pna, p.Ko), T); pl.dot(p.pna, V * 1e3, { color: '--accent', r: 6 });
      const iK = B.ghkI(V, 1, 1, Ki, p.Ko, T), iNa = B.ghkI(V, 1, p.pna, Nai, Nao, T), iCl = B.ghkI(V, -1, p.pcl, Cli, Clo, T), tot = iK + iNa + iCl;
      const dGp = 3 * B.dGmove(1, Nai, Nao, -V, T) + 2 * B.dGmove(1, p.Ko, Ki, V, T), dGn = B.dGmove(1, Nao, Nai, V, T);
      sim.set('n', EM.fix(B.nernst(1, p.Ko, Ki, T) * 1e3, 1) + ' · ' + EM.fix(B.nernst(1, Nao, Nai, T) * 1e3, 1) + ' · ' + EM.fix(B.nernst(-1, Clo, Cli, T) * 1e3, 1));
      sim.set('g', EM.fix(V * 1e3, 1) + ' mV · ' + (Math.abs(tot) / (Math.abs(iK) + Math.abs(iNa) + Math.abs(iCl)) < 1e-9 ? 'nula (< 10⁻⁹ de las corrientes parciales)' : 'no nula'));
      sim.set('w', EM.fix(dGp / 1e3, 1) + ' kJ/mol · ' + EM.fix((100 * dGp) / 55e3, 0) + ' % · ' + EM.sci(B.maxAccum(2, dGn, T), 2));
    });
  });

  /* 38.5 Hodgkin–Huxley */
  EM.defineSim('hodgkin-huxley', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.slider('I', { label: 'Corriente inyectada', min: 0, max: 40, step: 0.1, value: 10, unit: 'µA/cm²', fmt: (v) => v.toFixed(1) });
    sim.slider('dur', { label: 'Duración del pulso', min: 0.1, max: 80, step: 0.1, value: 80, unit: 'ms', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura', min: 0, max: 30, step: 0.5, value: 6.3, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.check('ttx', { label: 'Bloquear canales de Na⁺ (tetrodotoxina)', value: false });
    sim.check('tea', { label: 'Bloquear canales de K⁺ (tetraetilamonio)', value: false });
    sim.out('p', 'Picos: número · altura del primero (mV) · frecuencia (Hz)', { hl: true });
    sim.out('t', 'Potencial de reposo · mínimo (hiperpolarización posterior)');
    sim.out('f', 'Conductancias en el pico del primer potencial: <i>g</i><sub>Na</sub> / <i>g</i><sub>K</sub> (mS/cm²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Ht = cv.h; EM.draw.clear(cv);
      const o = { gNa: p.ttx ? 0 : undefined, gK: p.tea ? 0 : undefined }, tmax = 80, r = H.run((t) => (t >= 1 && t < 1 + p.dur ? p.I : 0), tmax, 0.1, p.T, o), sp = H.spikes(r, 0);
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: Ht * 0.58, xmin: 0, xmax: tmax, ymin: -90, ymax: 60, xlabel: '', ylabel: 'V (mV)', ml: 52, mb: 22 }); p1.frame(); p1.xy(r.t, r.V, { color: '--c1', width: 2.4 });
      p1.hline(-65, { color: '--ink-3', dash: [3, 3] });
      const p2 = new EM.Plot(ctx, { x: 0, y: Ht * 0.58, w: W, h: Ht * 0.42, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.02, xlabel: 'tiempo (ms)', ylabel: 'compuertas', ml: 52, mt: 8 }); p2.frame();
      p2.xy(r.t, r.m, { color: '--c2', width: 1.8 }); p2.xy(r.t, r.h, { color: '--c3', width: 1.8 }); p2.xy(r.t, r.n, { color: '--c4', width: 1.8 }); p2.legend([{ label: 'm (activa Na⁺)', color: '--c2' }, { label: 'h (inactiva Na⁺)', color: '--c3' }, { label: 'n (activa K⁺)', color: '--c4' }], 'tr');
      const f = sp.length > 1 ? (1000 * (sp.length - 1)) / (sp[sp.length - 1][0] - sp[0][0]) : 0;
      sim.set('p', sp.length + ' · ' + (sp.length ? EM.fix(sp[0][1], 1) : '—') + ' · ' + (sp.length > 1 ? EM.fix(f, 1) : '—'));
      sim.set('t', EM.fix(r.V[0], 1) + ' mV · ' + EM.fix(Math.min(...r.V), 1) + ' mV');
      let ig = 0; if (sp.length) { ig = Math.round(sp[0][0] / 0.1); } sim.set('f', sp.length ? EM.fix(H.gNa * r.m[ig] ** 3 * r.h[ig], 1) + ' / ' + EM.fix(H.gK * r.n[ig] ** 4, 1) : '—');
    });
  });
})();
