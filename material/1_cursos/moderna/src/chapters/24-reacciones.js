/* Capítulo 24 — Reacciones nucleares, fisión y fusión */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rx, N = EM.fm.nuc, MEV = 1.602176634e-13;
  const RX = {
    dt: ['D + T → ⁴He + n', [[1, 2], [1, 3]], [[2, 4], 'n'], 3727.3794066, 939.56542052],
    dd1: ['D + D → T + p', [[1, 2], [1, 2]], [[1, 3], [1, 1]], 2808.921, 938.272],
    dd2: ['D + D → ³He + n', [[1, 2], [1, 2]], [[2, 3], 'n'], 2808.391, 939.565],
    dhe: ['D + ³He → ⁴He + p', [[1, 2], [2, 3]], [[2, 4], [1, 1]], 3727.379, 938.272],
    pli: ['p + ⁷Li → ⁴He + ⁴He', [[1, 1], [3, 7]], [[2, 4], [2, 4]], 3727.379, 3727.379],
    be: ['⁴He + ⁹Be → n + ¹²C', [[2, 4], [4, 9]], ['n', [6, 12]], 939.565, 11174.86],
    ru: ['⁴He + ¹⁴N → p + ¹⁷O', [[2, 4], [7, 14]], [[1, 1], [8, 17]], 938.272, 15830.5],
  };

  /* 24.1 Valores Q y cinemática */
  EM.defineSim('reacciones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('r', { label: 'Reacción', options: Object.entries(RX).map(([k, v]) => [k, v[0]]), value: 'dt' });
    sim.out('Q', 'Valor Q = (Σ masas iniciales − Σ masas finales)c² con masas atómicas (MeV)', { hl: true });
    sim.out('k', 'Energías cinéticas de los productos si los reactivos están en reposo (exacto, relativista)');
    sim.out('e', 'Energía por unidad de masa de reactivos (J/kg) · umbral si Q < 0');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, a, b, m1, m2] = RX[p.r], Q = R.Q(a, b), Mi = a.reduce((s, x) => s + R.m(x), 0) * 931.49410242;
      EM.draw.clear(cv);
      const bars = [['reactivos', Mi, '--c1'], ['productos', Mi - Q, '--c2']], x0 = W * 0.08, bw = W * 0.14, ymax = Math.max(Mi, Mi - Q) * 1.0004, ymin = Math.min(Mi, Mi - Q) * 0.9998;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 3, ymin: ymin, ymax: ymax, xlabel: '', ylabel: 'energía en reposo Σmc² (MeV)', ml: 80, mr: 8, title: 'Balance de masa-energía' });
      pl.frame(); bars.forEach(([nm2, v, col], i) => { pl.xy([0.8 + i * 1.2, 0.8 + i * 1.2], [ymin, v], { color: col, width: 44 }); pl.label(0.5 + i * 1.2, v, nm2, { size: 11, color: '--ink-2' }); });
      const x1 = W * 0.5, y1 = H * 0.16, rr = Q > 0 ? R.twoBody(m1, m2, m1 + m2 + Q) : null;
      EM.text(ctx, nm, W * 0.74, H * 0.1, { size: 15, align: 'center', color: '--ink', weight: 600 });
      EM.text(ctx, `Q = ${EM.fix(Q, 3)} MeV ${Q > 0 ? '(exotérmica)' : '(endotérmica)'}`, W * 0.74, H * 0.26, { size: 13, align: 'center', color: Q > 0 ? '--c1' : '--c2' });
      if (rr) { EM.text(ctx, `T₁ = ${EM.fix(rr.T1, 3)} MeV · T₂ = ${EM.fix(rr.T2, 3)} MeV`, W * 0.74, H * 0.4, { size: 12, align: 'center', color: '--ink-2' }); EM.text(ctx, 'el más ligero se lleva la mayor parte', W * 0.74, H * 0.5, { size: 11, align: 'center', color: '--ink-3' }); }
      else EM.text(ctx, `umbral en el laboratorio: ${EM.fix(R.threshold(Q, m1 === 938.272 ? 4.0026 : 4.0026, 14.0031), 3)} MeV`, W * 0.74, H * 0.4, { size: 12, align: 'center', color: '--ink-2' });
      sim.set('Q', `${EM.fix(Q, 4)} MeV`);
      sim.set('k', rr ? `${EM.fix(rr.T1, 4)} MeV y ${EM.fix(rr.T2, 4)} MeV` : 'no ocurre en reposo: hace falta energía cinética en el proyectil');
      sim.set('e', Q > 0 ? `${EM.sci(Q * MEV / (Mi / 931.49410242 * 1.66053907e-27), 3)} J/kg` : `umbral ≈ ${EM.fix(R.threshold(Q, 4.0026, 14.0031), 3)} MeV (ejemplo ⁴He + ¹⁴N)`);
    });
  });

  /* 24.2 Pico de Gamow */
  const FU = { pp: ['p + p (Sol)', 1, 1, 938.272, 938.272, 1.29e-3, 1.29e-3], dt: ['D + T', 1, 1, 1875.613, 2808.921, 20e-3, 0.02], dd: ['D + D', 1, 1, 1875.613, 1875.613, 20e-3, 0.02], pB: ['p + ¹¹B', 1, 5, 938.272, 10252.55, 100e-3, 0.1] };
  EM.defineSim('fusion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('r', { label: 'Reacción de fusión', options: Object.entries(FU).map(([k, v]) => [k, v[0]]), value: 'dt' });
    sim.slider('kT', { label: 'Temperatura kT', min: 0.5, max: 200, step: 0.1, value: 20, log: true, unit: 'keV', fmt: (v) => EM.fix(v, 1) });
    sim.out('G', 'Energía de Gamow E_G = 2μc²(παZ₁Z₂)² · barrera de Coulomb a 3 fm', { hl: true });
    sim.out('E', 'Pico de Gamow E₀ = (E_G(kT)²/4)^{1/3} · ancho Δ = 4√(E₀kT/3) · E₀/kT');
    sim.out('T', 'Temperatura equivalente kT/k_B (K)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Z1, Z2, ma, mb] = FU[p.r], kT = p.kT * 1e-3, mu = R.reducedMass(ma, mb), EG = R.EG(Z1, Z2, mu), E0 = R.gamowPeak(EG, kT), Dl = R.gamowWidth(E0, kT);
      EM.draw.clear(cv);
      const emax = Math.max(8 * kT, 3 * E0), xs = [], mb_ = [], tun = [], pr = []; let pk = 0;
      for (let i = 1; i <= 400; i++) { const E = (emax * i) / 400; xs.push(E * 1e3); mb_.push(Math.exp(-E / kT)); tun.push(Math.exp(-Math.sqrt(EG / E))); const v = R.integrand(E, EG, kT); pr.push(v); if (v > pk) pk = v; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: emax * 1e3, ymin: 0, ymax: 1.1, xlabel: 'energía de colisión E (keV)', ylabel: 'unidades relativas', ml: 56, mr: 8, title: 'Cola de Maxwell × penetración de la barrera = pico de Gamow' });
      pl.frame(); pl.xy(xs, mb_, { color: '--c1', width: 2.2 }); pl.xy(xs, tun, { color: '--c3', width: 2.2 }); pl.xy(xs, pr.map((v) => v / pk), { color: '--accent', width: 3, fill: '--accent', fillAlpha: 0.15 });
      pl.vline(E0 * 1e3, { color: '--ink-3', dash: [4, 3], label: 'E₀' }); pl.legend([{ label: 'e^{−E/kT} (Maxwell)', color: '--c1' }, { label: 'e^{−√(E_G/E)} (túnel)', color: '--c3' }, { label: 'producto (pico de Gamow)', color: '--accent' }], 'tr');
      const bx = W * 0.66, by = H * 0.15, bh = H * 0.7;
      const rb = R.coulombBarrierMeV(Z1, Z2, 3) * 1e3; EM.text(ctx, `barrera a 3 fm: ${EM.fix(rb, 0)} keV`, bx + W * 0.16, by, { size: 12, align: 'center', color: '--ink-2' });
      EM.text(ctx, `E₀ = ${EM.fix(E0 * 1e3, 2)} keV`, bx + W * 0.16, by + bh * 0.2, { size: 14, align: 'center', color: '--accent', weight: 600 });
      EM.text(ctx, `${EM.fix(E0 / kT, 1)} kT; ${EM.fix(100 * E0 / (rb / 1e3), 1)} % de la barrera`, bx + W * 0.16, by + bh * 0.32, { size: 11.5, align: 'center', color: '--ink-3' });
      EM.text(ctx, `Δ = ${EM.fix(Dl * 1e3, 2)} keV`, bx + W * 0.16, by + bh * 0.45, { size: 12, align: 'center', color: '--ink-2' });
      sim.set('G', `${EM.fix(EG * 1e3, 1)} keV (B_G = ${EM.fix(Math.sqrt(EG * 1e3), 2)} keV^½) · ${EM.fix(rb, 0)} keV`);
      sim.set('E', `${EM.fix(E0 * 1e3, 3)} keV · ${EM.fix(Dl * 1e3, 3)} keV · ${EM.fix(E0 / kT, 2)}`);
      sim.set('T', `${EM.sci(kT / R.kBMeV, 3)} K`);
    });
  });

  /* 24.3 Reactor: cinética puntual y cadenas */
  EM.defineSim('reactor', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('mode', { label: 'Modelo', options: [['pt', 'Cinética puntual (con neutrones retardados)'], ['mc', 'Cadena de neutrones (ramificación)']], value: 'pt' });
    sim.slider('rho', { label: 'Reactividad ρ (pt)', min: -0.01, max: 0.012, step: 0.0001, value: 0.001, fmt: (v) => EM.fix(v * 1e5, 0) + ' pcm' });
    sim.slider('k', { label: 'Factor de multiplicación k (cadena)', min: 0.8, max: 2.5, step: 0.01, value: 1.1, fmt: (v) => EM.fix(v, 2) });
    sim.out('a', 'Período asintótico 1/ω (ecuación de la inversa horaria) · tiempo de generación Λ = 0.1 ms', { hl: true });
    sim.out('b', 'β = 0.0065 (retardados) · ρ en dólares ρ/β · probabilidad de extinción q = e^{k(q − 1)}');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, beta = 0.0065, Lam = 1e-4, lam = 0.08;
      EM.draw.clear(cv);
      if (p.mode === 'pt') {
        const T = p.rho > beta ? 0.6 : 20, tr = R.kinetics(p.rho, beta, Lam, lam, T, 5e-5), xs = [], ys = []; tr.forEach((q, i) => { if (i % Math.max(1, Math.round(tr.length / 600)) === 0) { xs.push(q.t); ys.push(Math.max(q.n, 1e-3)); } });
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: T, ymin: 1e-2, ymax: 1e4, ylog: true, xlabel: 't (s)', ylabel: 'potencia relativa n(t)', ml: 62, mr: 10, title: 'Respuesta de un reactor a un cambio de reactividad' });
        pl.frame(); pl.xy(xs, ys, { color: '--accent', width: 3 }); const w = R.inhour(p.rho, beta, Lam, lam); pl.fn((t) => Math.exp(w * t), { color: '--ink-3', width: 1.4, dash: [4, 3], n: 200 });
        sim.set('a', `${Math.abs(w) > 1e-9 ? EM.fix(1 / w, 3) : '∞'} s (ω = ${EM.fix(w, 4)} s⁻¹) · ${p.rho > beta ? 'CRÍTICO INMEDIATO: ρ > β' : 'ρ < β: los retardados controlan el período'}`);
        sim.set('b', `${EM.fix(p.rho / beta, 3)} $ · —`);
      } else {
        const gens = 40, ts = [...Array(gens + 1).keys()]; const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: gens, ymin: 0.5, ymax: 1e5, ylog: true, xlabel: 'generación', ylabel: 'neutrones', ml: 62, mr: 10, title: 'Cadenas de neutrones: crecimiento esperado y fluctuaciones' });
        pl.frame(); for (let s = 0; s < 12; s++) { const tr = R.chainMC(p.k, gens, 5, 11 + s * 7), xs = [], ys = []; tr.forEach((n, i) => { if (n > 0) { xs.push(i); ys.push(n); } }); pl.xy(xs, ys, { color: '--c1', width: 1.4 }); }
        pl.fn((g) => 5 * Math.pow(p.k, g), { color: '--accent', width: 3, n: 80 });
        const q = R.extinction(p.k); sim.set('a', `k = ${EM.fix(p.k, 2)}: ${p.k > 1 ? 'supercrítico' : p.k === 1 ? 'crítico' : 'subcrítico'} (la cadena se apaga sola cuando k < 1)`);
        sim.set('b', `${EM.fix(p.rho / beta, 2)} $ · q = ${EM.fix(q, 4)} (un neutrón aislado inicia la cadena con probabilidad ${EM.fix(1 - q, 4)})`);
      }
    });
  });
})();
