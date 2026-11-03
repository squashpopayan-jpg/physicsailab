/* Capítulo 21 — Superconductividad, superfluidez y condensados */
(function () {
  'use strict';
  const EM = window.EM, Mc = EM.fm.mac, K = EM.qm.K, kB = K.kB, e = K.e, h = K.h, hbar = K.hbar;

  /* 21.1 BCS */
  const SC = { Al: ['Aluminio', 1.175, 18.1e28], Sn: ['Estaño', 3.72, 14.8e28], Hg: ['Mercurio', 4.15, 8.65e28], Pb: ['Plomo', 7.19, 13.2e28], Nb: ['Niobio', 9.25, 5.56e28] };
  EM.defineSim('bcs', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Superconductor (T_c medida)', options: Object.entries(SC).map(([k, v]) => [k, `${v[0]} — T_c = ${v[1]} K`]), value: 'Al' });
    sim.slider('t', { label: 'Temperatura relativa T/T_c', min: 0.02, max: 1.05, step: 0.005, value: 0.5, fmt: (v) => EM.fix(v, 3) });
    sim.out('D', 'Brecha Δ(T) (meV) · Δ(0) = 1.764 k_BT_c = π e^{−γ} k_BT_c', { hl: true });
    sim.out('r', 'Δ(T)/Δ(0) · 2Δ(0)/k_BT_c');
    sim.out('l', 'Longitud de penetración de London λ_L (n_s = n) · fotón mínimo para romper un par 2Δ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Tc, n] = SC[p.m], D0 = Mc.delta0, D = Mc.gap(Math.min(p.t, 1)), Dm = D * kB * Tc / e * 1e3;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1.05, ymin: 0, ymax: 1.1, xlabel: 'T/T_c', ylabel: 'Δ(T)/Δ(0)', ml: 56, mr: 8, title: 'Brecha BCS (ecuación autoconsistente)' });
      pl.frame(); const ts = [], ds = []; for (let i = 0; i <= 105; i++) { const t = i / 100; ts.push(t); ds.push(Mc.gap(Math.max(t, 0.005)) / D0); } pl.xy(ts, ds, { color: '--accent', width: 3 });
      pl.fn((t) => (t < 1 ? 1.74 * Math.sqrt(1 - t) : NaN), { color: '--ink-3', width: 1.6, dash: [4, 3], n: 200 }); pl.dot(Math.min(p.t, 1.05), D / D0, { color: '--c3', r: 6 });
      pl.legend([{ label: 'BCS', color: '--accent' }, { label: '1.74√(1 − T/T_c)', color: '--ink-3' }], 'tr');
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -3 * D0, xmax: 3 * D0, ymin: 0, ymax: 4, xlabel: 'E (unidades de k_BT_c)', ylabel: 'N_s(E)/N_n', ml: 50, mr: 8, title: 'Densidad de estados de cuasi-partículas' });
      pr.frame(); if (D > 0.01) { pr.fn((E) => (Math.abs(E) > D ? Math.min(Math.abs(E) / Math.sqrt(E * E - D * D), 4) : NaN), { color: '--c1', width: 2.8, n: 600 }); pr.vline(D, { color: '--ink-3', dash: [3, 3] }); pr.vline(-D, { color: '--ink-3', dash: [3, 3] }); } else pr.hline(1, { color: '--c1' });
      sim.set('D', `${EM.fix(Dm, 4)} meV (T_c = ${Tc} K, Δ(0) = ${EM.fix(D0 * kB * Tc / e * 1e3, 4)} meV)`);
      sim.set('r', `${EM.fix(D / D0, 4)} · 3.528`);
      sim.set('l', `${EM.fix(Mc.london(n) * 1e9, 1)} nm · ${EM.fix(2 * Dm, 4)} meV (${EM.fix(2 * Dm * 1e-3 * e / h / 1e9, 1)} GHz)`);
    });
  });

  /* 21.2 Efecto Josephson y SQUID */
  EM.defineSim('josephson', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('mode', { label: 'Fenómeno', options: [['iv', 'Efecto Josephson (RCSJ)'], ['squid', 'Interferencia: unión y SQUID']], value: 'iv' });
    sim.slider('i', { label: 'Corriente I/I_c (modo RCSJ)', min: 0, max: 3, step: 0.01, value: 1.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('f', { label: 'Flujo Φ/Φ₀ (modo interferencia)', min: 0, max: 3, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('v', 'Tensión media ⟨V⟩ = R_n√(I² − I_c²) en unidades de I_cR_n · frecuencia de Josephson con I_cR_n = 0.2805 mV (Al)', { hl: true });
    sim.out('c', 'I_c(Φ)/I_c0 de la unión larga |sen πf/πf| · del SQUID |cos πf|');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (p.mode === 'iv') {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: 3, xlabel: 'I/I_c', ylabel: '⟨V⟩/(I_c R_n)', ml: 56, mr: 8, title: 'Característica I–V (sobreamortiguada)' });
        pl.frame(); pl.fn((i) => Mc.rcsjAnalytic(i), { color: '--accent', width: 3, n: 300 }); pl.fn((i) => i, { color: '--ink-3', width: 1.4, dash: [4, 3], n: 4 }); pl.dot(p.i, Mc.rcsjAnalytic(p.i), { color: '--c3', r: 6 });
        // forma de onda V(τ) = i − sen φ
        let phi = 0; const dt = 0.02, xs = [], ys = [], Tn = 40; const f = (q) => p.i - Math.sin(q);
        for (let k = 0; k <= Tn / dt; k++) { if (k % 5 === 0) { xs.push(k * dt); ys.push(f(phi)); } const k1 = f(phi), k2 = f(phi + 0.5 * dt * k1), k3 = f(phi + 0.5 * dt * k2), k4 = f(phi + dt * k3); phi += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); }
        const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: Tn, ymin: -1.2, ymax: 4.2, xlabel: 't/τ_J', ylabel: 'V(t)/(I_cR_n)', ml: 56, mr: 8, title: 'Tensión instantánea (oscilación de Josephson)' });
        pr.frame(); pr.xy(xs, ys, { color: '--c1', width: 2.2 }); pr.hline(Mc.rcsjAnalytic(p.i), { color: '--c3', dash: [4, 3], label: 'media' });
        sim.set('v', `${EM.fix(Mc.rcsjAnalytic(p.i), 4)} · ${p.i <= 1 ? '0 (corriente sin tensión: DC Josephson)' : EM.fix(Mc.josephsonHz(Mc.rcsjAnalytic(p.i) * 0.2805e-3) / 1e9, 1) + ' GHz'}`);
        sim.set('c', '—');
      } else {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: 1.1, xlabel: 'Φ/Φ₀', ylabel: 'I_c(Φ)/I_c(0)', ml: 56, mr: 10, title: 'Corriente crítica frente al flujo magnético' });
        pl.frame(); pl.fn((x) => Mc.fraunhofer(x), { color: '--c1', width: 2.8, n: 400 }); pl.fn((x) => Mc.squid(x), { color: '--c2', width: 2.8, n: 400 });
        pl.vline(p.f, { color: '--accent', dash: [] }); pl.legend([{ label: 'unión: |sen πf/πf| (Fraunhofer)', color: '--c1' }, { label: 'SQUID: |cos πf|', color: '--c2' }], 'tr');
        sim.set('v', '—'); sim.set('c', `${EM.fix(Mc.fraunhofer(p.f), 4)} · ${EM.fix(Mc.squid(p.f), 4)}`);
      }
    });
  });

  /* 21.3 Superfluidez: criterio de Landau */
  EM.defineSim('superfluido', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('v', { label: 'Velocidad del objeto que se mueve en el helio', min: 0, max: 300, step: 1, value: 40, unit: 'm/s', fmt: (v) => v.toFixed(0) });
    sim.out('c', 'Velocidad crítica de Landau v_c = min ε(p)/p (rotones) · fonones c = 238 m/s', { hl: true });
    sim.out('e', 'Mínimo del espectro: rotón en p₀/ħ = 1.91 Å⁻¹ con Δ/k_B = 8.65 K');
    sim.out('s', 'Estado del fluido a la velocidad elegida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, r = Mc.roton, L = Mc.landau(), pmax = 3.3e10 * hbar, c0 = 238;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3.3, ymin: 0, ymax: 30, xlabel: 'p/ħ (Å⁻¹)', ylabel: 'ε/k_B (K)', ml: 56, mr: 10, title: 'Espectro de excitaciones del ⁴He y recta de Landau' });
      pl.frame();
      const ph = (q) => (q * 1e10 * hbar * c0) / kB;   // fonón: ε = c p
      pl.fn((q) => (q <= 0.65 ? ph(q) : NaN), { color: '--c1', width: 3, n: 100 }); pl.fn((q) => (q >= 1.45 && q <= 2.5 ? Mc.rotonE(q * 1e10 * hbar) / kB : NaN), { color: '--c2', width: 3, n: 200 });
      pl.fn((q) => (p.v * q * 1e10 * hbar) / kB, { color: '--c3', width: 2.2, dash: [5, 3], n: 8 });
      pl.dot(L.p / hbar / 1e10, Mc.rotonE(L.p) / kB, { color: '--c3', r: 6 });
      pl.legend([{ label: 'fonones ε = cp', color: '--c1' }, { label: 'rotones', color: '--c2' }, { label: 'recta ε = v·p', color: '--c3' }], 'tl');
      sim.set('c', `${EM.fix(L.v, 2)} m/s`);
      sim.set('e', `ε_min = ${EM.fix(r.Delta / kB, 2)} K · ε/p en el punto de tangencia = ${EM.fix(L.v, 1)} m/s`);
      sim.set('s', p.v < L.v ? 'superfluido: no se pueden crear excitaciones, sin disipación' : 'v > v_c: pueden crearse rotones y aparece disipación (en la práctica, antes por vórtices)');
    });
  });

  /* 21.4 BEC en una trampa */
  EM.defineSim('bec', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N', { label: 'Número de átomos de ⁸⁷Rb', min: 3, max: 8, step: 0.05, value: 6, fmt: (v) => '10^' + EM.fix(v, 2) });
    sim.slider('nu', { label: 'Frecuencia media de la trampa ν̄', min: 10, max: 500, step: 1, value: 100, unit: 'Hz', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 1500, step: 1, value: 300, unit: 'nK', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('Tc', 'T_c = (ħω̄/k_B)(N/ζ(3))^{1/3} · con la corrección de tamaño finito', { hl: true });
    sim.out('f', 'Fracción condensada N₀/N = 1 − (T/T_c)³ · tamaño del oscilador a_ho');
    sim.out('r', 'Longitud de onda térmica de de Broglie a la T elegida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.pow(10, p.N), w = 2 * Math.PI * p.nu, m = 86.909 * K.u, Tc = Mc.TcTrap(N, w), Tcc = Mc.TcTrapCorr(N, w, w), T = p.T * 1e-9;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1.5, ymin: 0, ymax: 1.05, xlabel: 'T/T_c', ylabel: 'N₀/N', ml: 56, mr: 8, title: 'Fracción condensada' });
      pl.frame(); pl.fn((t) => Mc.condFracTrap(t), { color: '--accent', width: 3, n: 300 }); pl.fn((t) => Mc.condFracUniform(t), { color: '--ink-3', width: 2, dash: [4, 3], n: 300 }); pl.dot(Math.min(T / Tcc, 1.5), Mc.condFracTrap(T / Tcc), { color: '--c3', r: 6 });
      pl.legend([{ label: 'trampa armónica 1 − t³', color: '--accent' }, { label: 'gas uniforme 1 − t^{3/2}', color: '--ink-3' }], 'tr');
      // perfil de densidad: condensado gaussiano (ancho a_ho) + nube térmica (ancho √(kT/mω²))
      const aho = Mc.ahO(m, w), sT = Math.sqrt(kB * T / (m * w * w)), f0 = Mc.condFracTrap(T / Tcc), xs = [], ys = [], xm = Math.max(4 * sT, 4 * aho);
      for (let i = 0; i <= 300; i++) { const x = -xm + (2 * xm * i) / 300; xs.push(x * 1e6); ys.push(f0 * Math.exp(-x * x / (aho * aho)) / (Math.sqrt(Math.PI) * aho) / 1e6 + (1 - f0) * Math.exp(-x * x / (2 * sT * sT)) / (Math.sqrt(2 * Math.PI) * sT) / 1e6); }
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: xs[0], xmax: xs[300], ymin: 0, ymax: Math.max(...ys) * 1.1, xlabel: 'x (µm)', ylabel: 'densidad lineal (µm⁻¹), normalizada', ml: 56, mr: 8, title: 'Perfil de densidad: condensado + nube térmica' });
      pr.frame(); pr.xy(xs, ys, { color: '--c2', width: 2.8, fill: '--c2', fillAlpha: 0.14 });
      sim.set('Tc', `${EM.fix(Tc * 1e9, 1)} nK · ${EM.fix(Tcc * 1e9, 1)} nK`);
      sim.set('f', `${EM.fix(100 * f0, 1)} % · ${EM.fix(aho * 1e6, 3)} µm`);
      sim.set('r', `${EM.fix(h / Math.sqrt(2 * Math.PI * m * kB * T) * 1e6, 3)} µm`);
    });
  });
})();
