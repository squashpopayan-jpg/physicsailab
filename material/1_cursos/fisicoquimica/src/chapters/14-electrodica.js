/* Capítulo 14 — Cinética de electrodos */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R, F = FQ.F, T0 = 298.15;

  /* 14.1 Butler–Volmer y Tafel */
  const PRE = {
    pt: ['Desprendimiento de H₂ sobre platino', 8e-4, 0.5], ni: ['Desprendimiento de H₂ sobre níquel', 6e-6, 0.5], hg: ['Desprendimiento de H₂ sobre mercurio', 5e-13, 0.5],
    fe: ['Fe³⁺/Fe²⁺ sobre platino (rápida)', 2e-3, 0.5], o2: ['Reducción de O₂ sobre platino (lenta)', 1e-9, 0.5], man: ['Personalizado', 1e-4, 0.5]
  };
  EM.defineSim('butler-volmer', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('pre', { label: 'Reacción de electrodo (valores típicos de i₀ a 25 °C)', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'pt' });
    sim.slider('i0', { label: 'Densidad de corriente de intercambio i₀', min: 1e-14, max: 1e-1, step: 1e-14, value: 8e-4, unit: 'A/cm²', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('a', { label: 'Coeficiente de transferencia α', min: 0.2, max: 0.8, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: 273, max: 373, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('mt', { label: 'Incluir transporte de masa (corriente límite)', value: false });
    sim.slider('iL', { label: 'Corriente límite catódica i_L', min: 1e-5, max: 1e-1, step: 1e-5, value: 2e-3, unit: 'A/cm²', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.seg('view', { label: 'Gráfica', options: [['lin', 'i frente a η'], ['tafel', 'Tafel: log|i| frente a η']], value: 'tafel' });
    sim.out('ts', 'Pendiente de Tafel catódica · anódica (mV/década)', { hl: true });
    sim.out('Rct', 'Resistencia de transferencia de carga <i>R</i><sub>ct</sub> = <i>RT</i>/(<i>F i</i><sub>0</sub>)');
    sim.out('eta', 'Sobrepotencial catódico para 10 mA/cm²');
    sim.onChange = (id) => { if (id === 'pre' && sim.p.pre !== 'man') { const d = PRE[sim.p.pre]; sim.ctl.i0.set(d[1], true); sim.ctl.a.set(d[2], true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, a = p.a, f = F / (R * p.T), i0 = p.i0;
      EM.draw.clear(cv);
      const iT = (eta) => (p.mt ? FQ.bvMT(i0, a, eta, p.iL, 0, p.T) : FQ.bv(i0, 1 - a, a, eta, p.T));
      let pl;
      if (p.view === 'lin') {
        const ym = Math.min(0.05, Math.max(i0 * 20, 5e-4));
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.3, xmax: 0.3, ymin: -ym, ymax: ym, xlabel: 'sobrepotencial η = E − E_eq (V)', ylabel: 'i (A/cm²)', ml: 62, yfmt: (v) => EM.sci(v, 1) });
        pl.frame(); pl.fn(iT, { color: '--c1', width: 2.6, n: 240 });
        pl.hline(0, { color: '--ink-3' });
      } else {
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: 0.5, ymin: Math.min(i0 / 20, 1e-8), ymax: 1, ylog: true, xlabel: 'sobrepotencial η (V)', ylabel: '|i| (A/cm²)', ml: 62 });
        pl.frame();
        pl.fn((eta) => Math.max(1e-30, Math.abs(iT(eta))), { color: '--c1', width: 2.6, n: 300 });
        pl.fn((eta) => i0 * Math.exp(-a * f * eta), { color: '--c2', width: 1.3, dash: [5, 4], n: 120, from: -0.5, to: -0.05 }); pl.fn((eta) => i0 * Math.exp((1 - a) * f * eta), { color: '--c3', width: 1.3, dash: [5, 4], n: 120, from: 0.05, to: 0.5 });
        pl.hline(i0, { color: '--ink-3', label: 'i₀' });
      }
      pl.legend([{ label: p.mt ? 'Butler–Volmer + transporte de masa' : 'Butler–Volmer', color: '--c1' }, { label: 'rama catódica (Tafel)', color: '--c2', dash: [5, 4] }, { label: 'rama anódica (Tafel)', color: '--c3', dash: [5, 4] }], p.view === 'lin' ? 'tl' : 'tl');
      sim.set('ts', EM.fix((Math.LN10 / (a * f)) * 1e3, 0) + ' · ' + EM.fix((Math.LN10 / ((1 - a) * f)) * 1e3, 0) + ' mV/década');
      sim.set('Rct', EM.sci(R * p.T / (F * i0), 2) + ' Ω·cm²');
      const eta = FQ.bisect((e) => Math.abs(iT(e)) - 1e-2, -3, 0, 1e-10);
      sim.set('eta', isFinite(eta) ? EM.fix(-eta * 1e3, 0) + ' mV' : 'no se alcanza (límite de transporte de masa < 10 mA/cm²)');
    });
  });

  /* 14.2 Doble capa eléctrica de Gouy–Chapman */
  EM.defineSim('doble-capa', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('c', { label: 'Concentración del electrolito 1:1', min: 1e-4, max: 1, step: 1e-4, value: 0.01, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('psi', { label: 'Potencial del electrodo respecto del punto de carga cero', min: -300, max: 300, step: 1, value: 100, unit: 'mV', fmt: (v) => v.toFixed(0) });
    sim.seg('view', { label: 'Gráfica', options: [['x', 'Potencial ψ(x)'], ['C', 'Capacidad C(ψ₀)']], value: 'x' });
    sim.out('ld', 'Longitud de Debye 1/κ', { hl: true });
    sim.out('s', 'Densidad de carga superficial σ');
    sim.out('C', 'Capacidad diferencial de Gouy–Chapman');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = FQ.gc(p.c, p.psi * 1e-3);
      EM.draw.clear(cv);
      if (p.view === 'x') {
        const xmax = Math.max(5 / g.kappa, 1e-9);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: xmax * 1e9, ymin: Math.min(0, p.psi * 1.1), ymax: Math.max(0, p.psi * 1.1) + 5, xlabel: 'distancia a la superficie x (nm)', ylabel: 'ψ(x) (mV)', ml: 52 });
        pl.frame();
        pl.fn((xn) => g.psi(xn * 1e-9) * 1e3, { color: '--c1', width: 2.6, n: 200 });
        pl.fn((xn) => p.psi * Math.exp(-g.kappa * xn * 1e-9), { color: '--c2', width: 1.4, dash: [5, 4], n: 150 });
        pl.vline(1e9 / g.kappa, { color: '--accent', label: '1/κ' });
        pl.legend([{ label: 'Gouy–Chapman (no lineal)', color: '--c1' }, { label: 'Debye–Hückel (lineal) ψ₀e^(−κx)', color: '--c2', dash: [5, 4] }], 'tr');
      } else {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -300, xmax: 300, ymin: 0, ymax: Math.max(FQ.gc(p.c, 0.3).C * 100, 10), xlabel: 'ψ₀ (mV)', ylabel: 'C (µF/cm²)', ml: 52 });
        pl.frame(); pl.fn((e) => FQ.gc(p.c, e * 1e-3).C * 100, { color: '--c1', width: 2.6, n: 200 });
        pl.dot(p.psi, g.C * 100, { color: '--accent' });
        pl.hline(20, { color: '--ink-3', label: 'capa de Helmholtz típica: 10–40 µF/cm²', dash: [5, 4] });
      }
      sim.set('ld', EM.fix(1e9 / g.kappa, 2) + ' nm');
      sim.set('s', EM.fix(g.sigma * 100, 2) + ' µC/cm²');
      sim.set('C', EM.fix(g.C * 100, 1) + ' µF/cm² (en el punto de carga cero: ' + EM.fix(FQ.gc(p.c, 0).C * 100, 1) + ')');
    });
  });

  /* 14.3 Voltametría cíclica */
  EM.defineSim('cv', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('k0', { label: 'Constante heterogénea k⁰', min: 1e-5, max: 1e2, step: 1e-5, value: 1e2, unit: 'cm/s', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('v', { label: 'Velocidad de barrido', min: 0.005, max: 50, step: 0.005, value: 0.1, unit: 'V/s', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('a', { label: 'Coeficiente de transferencia α', min: 0.3, max: 0.7, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.seg('view', { label: 'Gráfica', options: [['cv', 'Voltamperograma'], ['rs', 'Corriente de pico frente a √v']], value: 'cv' });
    sim.out('dEp', 'Separación de picos Δ<i>E</i><sub>p</sub> (teoría reversible: 57 mV/<i>n</i>)', { hl: true });
    sim.out('ip', 'Corriente de pico catódica · Randles–Ševčík');
    sim.out('psi', 'Parámetro de Nicholson ψ = <i>k</i>⁰/√(π<i>D</i><i>f</i><i>v</i>) · régimen');
    sim.out('E12', '<i>E</i><sub>1/2</sub> = (<i>E</i><sub>pa</sub> + <i>E</i><sub>pc</sub>)/2');
    const base = { E0: 0, Ei: 0.4, Ev: -0.4, D: 1e-5, C: 1e-3, A: 0.07, n: 1, N: 200 };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, run = (v, k0) => FQ.cv(Object.assign({}, base, { v, k0: Math.min(k0, 2e3), alpha: p.a }));
      EM.draw.clear(cv);
      const q = run(p.v, p.k0), pk = FQ.cvPeaks(q), rs = FQ.randlesSevcik(1, 0.07, 1e-3, 1e-5, p.v);
      if (p.view === 'cv') {
        const ym = Math.max(...q.I.map(Math.abs)) * 1.15 * 1e6;
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.4, xmax: 0.4, ymin: -ym, ymax: ym, xlabel: 'E − E°′ (V)', ylabel: 'i (µA) — anódica positiva', ml: 56 });
        pl.frame();
        pl.xy(q.E, q.I.map((i) => i * 1e6), { color: '--c1', width: 2.4 });
        pl.dot(pk.Epc, pk.ipc * 1e6, { color: '--c2', label: 'E_pc', dy: 16 }); pl.dot(pk.Epa, pk.ipa * 1e6, { color: '--c3', label: 'E_pa', dy: -10 });
      } else {
        const vs = [0.01, 0.03, 0.1, 0.3, 1, 3, 10], ip = vs.map((v) => Math.abs(FQ.cvPeaks(run(v, p.k0)).ipc) * 1e6), th = vs.map((v) => FQ.randlesSevcik(1, 0.07, 1e-3, 1e-5, v) * 1e6);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.sqrt(10) * 1.05, ymin: 0, ymax: Math.max(...th) * 1.1, xlabel: '√v (V/s)^½', ylabel: '|i_pc| (µA)', ml: 52 });
        pl.frame(); pl.xy(vs.map(Math.sqrt), th, { color: '--ink-3', width: 1.6, dash: [6, 4] }); pl.xy(vs.map(Math.sqrt), ip, { color: '--c1', width: 2.6 }); vs.forEach((v, i) => pl.dot(Math.sqrt(v), ip[i], { color: '--c1', r: 3.5 }));
        pl.legend([{ label: 'simulación', color: '--c1' }, { label: 'Randles–Ševčík (reversible)', color: '--ink-3', dash: [6, 4] }], 'tl');
      }
      const f = F / (R * T0), psi = p.k0 / Math.sqrt(Math.PI * 1e-5 * f * p.v), dEp = (pk.Epa - pk.Epc) * 1e3;
      sim.set('dEp', EM.fix(dEp, 1) + ' mV');
      sim.set('ip', EM.fix(-pk.ipc * 1e6, 3) + ' µA · ' + EM.fix(rs * 1e6, 3) + ' µA');
      sim.set('psi', EM.sci(psi, 2) + ' · ' + (psi > 15 ? 'reversible (controlada por difusión)' : psi > 0.1 ? 'cuasirreversible' : 'irreversible (controlada por la cinética)'));
      sim.set('E12', EM.fix(((pk.Epa + pk.Epc) / 2) * 1e3, 1) + ' mV');
    });
  });

  /* 14.4 Corrosión: diagrama de Evans */
  const COR = {
    ac: ['Hierro en ácido (control por desprendimiento de H₂)', { i0a: 1e-5, Ea: -0.44, ba: 0.04, i0c: 1e-6, Ec: 0, bc: 0.12, iL: 0 }],
    ae: ['Hierro en agua neutra aireada (control por difusión de O₂)', { i0a: 1e-5, Ea: -0.44, ba: 0.04, i0c: 1e-6, Ec: 0.8, bc: 0.12, iL: 4e-5 }],
    zn: ['Zinc en ácido', { i0a: 1e-6, Ea: -0.76, ba: 0.04, i0c: 1e-9, Ec: 0, bc: 0.12, iL: 0 }],
    cu: ['Cobre en agua aireada', { i0a: 1e-8, Ea: 0.34, ba: 0.06, i0c: 1e-7, Ec: 0.8, bc: 0.12, iL: 2e-5 }]
  };
  EM.defineSim('evans', function (sim) {
    const cv = sim.canvas({ aspect: 1.65 });
    sim.select('s', { label: 'Sistema de corrosión', options: Object.entries(COR).map(([k, v]) => [k, v[0]]), value: 'ac' });
    sim.slider('iL', { label: 'Corriente límite de difusión del oxidante', min: 1e-6, max: 1e-2, step: 1e-6, value: 4e-5, unit: 'A/cm²', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.check('lim', { label: 'Limitar la rama catódica por difusión (O₂)', value: false });
    sim.slider('bc', { label: 'Pendiente de Tafel catódica', min: 0.06, max: 0.25, step: 0.005, value: 0.12, unit: 'V/dec', fmt: (v) => (v * 1000).toFixed(0) + ' mV' });
    sim.out('E', 'Potencial de corrosión <i>E</i><sub>corr</sub>', { hl: true });
    sim.out('i', 'Corriente de corrosión <i>i</i><sub>corr</sub>');
    sim.out('v', 'Velocidad de corrosión (hierro, 55.85 g/mol, 7.87 g/cm³)');
    sim.out('Rp', 'Resistencia de polarización <i>R</i><sub>p</sub> (Stern–Geary)');
    sim.onChange = (id) => { if (id === 's') { const d = COR[sim.p.s][1]; sim.ctl.lim.set(d.iL > 0, true); if (d.iL) sim.ctl.iL.set(d.iL, true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, d = COR[p.s][1];
      EM.draw.clear(cv);
      const q = Object.assign({}, d, { bc: p.bc, iL: p.lim ? p.iL : 0 }), e = FQ.evans(q);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -9, xmax: -1, ymin: -1.0, ymax: 1.0, xlabel: 'log₁₀ |i| (A/cm²)', ylabel: 'E (V frente a ESH)', ml: 50 });
      pl.frame();
      const Es = []; for (let E = -1; E <= 1; E += 0.01) Es.push(E);
      pl.xy(Es.map((E) => Math.log10(e.ia(E))), Es, { color: '--c2', width: 2.6 });
      pl.xy(Es.map((E) => Math.log10(e.ic(E))), Es, { color: '--c1', width: 2.6 });
      pl.dot(Math.log10(e.icorr), e.Ecorr, { color: '--accent', r: 6, label: 'E_corr, i_corr', dx: 8, dy: 16 });
      pl.vline(Math.log10(e.icorr), { color: '--accent', width: 1, alpha: 0.5 }); pl.hline(e.Ecorr, { color: '--accent', width: 1, alpha: 0.5 });
      if (p.lim) pl.vline(Math.log10(p.iL), { color: '--c4', label: 'i_L', dash: [4, 4] });
      pl.legend([{ label: 'disolución del metal (anódica)', color: '--c2' }, { label: 'reducción del oxidante (catódica)', color: '--c1' }], 'br');
      const mm = e.icorr * 1e6 * 3.27e-3 * (55.85 / 2) / 7.87;
      sim.set('E', EM.fix(e.Ecorr, 3) + ' V');
      sim.set('i', EM.sci(e.icorr, 2) + ' A/cm² (' + EM.fix(e.icorr * 1e6, 2) + ' µA/cm²)');
      sim.set('v', p.s === 'ac' || p.s === 'ae' ? EM.fix(mm, 3) + ' mm/año' : '(la fórmula se da para el hierro)');
      sim.set('Rp', EM.sci(e.Rp, 2) + ' Ω·cm²');
    });
  });
})();
