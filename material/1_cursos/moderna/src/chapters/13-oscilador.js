/* Capítulo 13 — Oscilador armónico cuántico */
(function () {
  'use strict';
  const EM = window.EM, H = EM.fm.ho, K = EM.qm.K, u = K.u, h = K.h, c = K.c, e = K.e, hbar = K.hbar;
  /* ωe, ωexe (cm⁻¹), masa reducida (u), r_e (Å), banda fundamental observada (cm⁻¹): NIST Chemistry WebBook (Huber y Herzberg) */
  const MOL = { CO: ['CO', 2169.81, 13.288, 6.856209, 1.1283, 2143.27], HCl: ['H³⁵Cl', 2990.95, 52.82, 0.979593, 1.2746, 2885.98], H2: ['H₂', 4401.21, 121.34, 0.503912, 0.7414, 4161.17], N2: ['N₂', 2358.57, 14.324, 7.001537, 1.0977, 2329.92] };
  const CM = 100 * c;

  /* 13.1 Estados del oscilador armónico */
  EM.defineSim('oscilador', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('mol', { label: 'Molécula diatómica (para las unidades físicas)', options: Object.entries(MOL).map(([k, v]) => [k, `${v[0]} (ωe = ${EM.fix(v[1], 1)} cm⁻¹)`]), value: 'CO' });
    sim.slider('n', { label: 'Estado vibracional n', min: 0, max: 24, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.check('cl', { label: 'Mostrar la densidad de probabilidad clásica', value: true });
    sim.out('E', 'Energía E_n = (n + ½)ħω · energía de punto cero ½ħω', { hl: true });
    sim.out('x0', 'Longitud característica x₀ = √(ħ/μω) · puntos de retorno ±√(2n + 1)x₀');
    sim.out('Pf', 'Probabilidad en la región clásicamente prohibida · ΔxΔp = (n + ½)ħ');
    sim.out('T', 'Periodo clásico · temperatura vibracional ħω/k_B');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H_ = cv.h, n = Math.round(p.n), m = MOL[p.mol], we = m[1], mu = m[3] * u, om = 2 * Math.PI * CM * we;
      EM.draw.clear(cv);
      const X = Math.sqrt(2 * Math.max(n, 6) + 1) + 2.5, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H_, xmin: -X, xmax: X, ymin: 0, ymax: (Math.max(n, 6) + 3) * 1.0, xlabel: 'posición ξ = x/x₀', ylabel: 'energía (unidades de ħω)', ml: 52, mr: 8, title: 'Potencial parabólico, nivel y función de onda' });
      pl.frame();
      pl.fn((x) => 0.5 * x * x, { color: '--ink', width: 2.4, n: 300 });
      for (let k = 0; k <= Math.max(n, 6); k++) pl.hline(k + 0.5, { color: k === n ? '--accent' : '--ink-3', width: k === n ? 1.4 : 0.6, dash: k === n ? [] : [2, 4] });
      pl.fn((x) => n + 0.5 + 1.6 * H.psi(n, x), { color: '--accent', width: 2.8, n: 600 });
      const xt = H.turning(n); pl.vline(xt, { color: '--c3', dash: [4, 3] }); pl.vline(-xt, { color: '--c3', dash: [4, 3] });
      /* Derecha: |ψ|² frente a la clásica */
      const pr = new EM.Plot(ctx, { x: W * 0.63, y: 0, w: W * 0.37, h: H_, xmin: -X, xmax: X, ymin: 0, ymax: Math.max(0.8, n === 0 ? 0.65 : 0.6 + 0.0), xlabel: 'ξ', ylabel: '|ψ_n|²', ml: 44, mr: 8, title: 'Densidad de probabilidad' });
      pr.frame();
      if (p.cl) pr.fn((x) => Math.min(H.classical(x, n), 1.2), { color: '--c2', width: 1.6, dash: [5, 3], n: 600 });
      pr.fn((x) => H.psi(n, x) ** 2, { color: '--accent', width: 2.8, n: 600, fill: '--accent', fillAlpha: 0.14 });
      const hw = hbar * om / e, x0 = Math.sqrt(hbar / (mu * om));
      sim.set('E', `${EM.fix((n + 0.5) * hw, 5)} eV (${EM.fix((n + 0.5) * we, 2)} cm⁻¹) · ${EM.fix(0.5 * hw, 5)} eV`);
      sim.set('x0', `${EM.fix(x0 * 1e12, 3)} pm · ±${EM.fix(xt * x0 * 1e12, 3)} pm`);
      sim.set('Pf', `${EM.fix(100 * H.pForbidden(n), 3)} % · ${EM.fix(n + 0.5, 1)} ħ`);
      sim.set('T', `${EM.fix((2 * Math.PI / om) * 1e15, 3)} fs · ${EM.fix((hbar * om) / K.kB, 0)} K`);
    });
  });

  /* 13.2 El potencial de Morse: anarmonicidad y espectro infrarrojo */
  EM.defineSim('morse', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('mol', { label: 'Molécula', options: Object.entries(MOL).map(([k, v]) => [k, v[0]]), value: 'CO' });
    sim.slider('nl', { label: 'Niveles dibujados', min: 2, max: 30, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('De', 'Energía de disociación Morse D_e = ωe²/(4ωexe) · estados ligados', { hl: true });
    sim.out('f', 'Banda fundamental 1←0 = ωe − 2ωexe · observada · error');
    sim.out('o', 'Primer sobretono 2←0 = 2ωe − 6ωexe · espaciado entre niveles contiguos E_{n+1} − E_n');
    sim.out('k', 'Constante de fuerza k = μ(2πcωe)² · parámetro a del potencial');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H_ = cv.h, m = MOL[p.mol], [nm, we, wx, mmu, re, fobs] = m, mu = mmu * u, De = H.morseDe(we, wx), a = H.morseA(we, wx, mu) / 1e10; /* Å⁻¹ */
      EM.draw.clear(cv);
      const eV = (cm) => cm * 100 * h * c / e, Dmax = eV(De) * 1.08;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H_, xmin: re * 0.6, xmax: re * 2.6, ymin: 0, ymax: Dmax, xlabel: 'distancia internuclear r (Å)', ylabel: 'energía (eV)', ml: 52, mr: 8, title: 'Morse (continua) y armónico (discontinua)' });
      pl.frame();
      const V = (r) => eV(De) * Math.pow(1 - Math.exp(-a * (r - re)), 2), Vh = (r) => eV(De) * a * a * (r - re) ** 2;
      pl.fn(Vh, { color: '--c2', width: 1.8, dash: [6, 4], n: 300 }); pl.fn(V, { color: '--accent', width: 3, n: 400 });
      const nl = Math.min(Math.round(p.nl), H.morseN(we, wx));
      for (let k = 0; k < nl; k++) { const E = eV(H.morseE(k, we, wx)); /* puntos de retorno de Morse: 1 − e^{−aΔ} = ±√(E/D) */ const s = Math.sqrt(E / eV(De)); if (s >= 1) break; const r1 = re - Math.log(1 + s) / a, r2 = re - Math.log(1 - s) / a; pl.path([[r1, E], [r2, E]], { color: k < 3 ? '--c1' : '--ink-3', width: k < 3 ? 2 : 1 }); }
      pl.hline(eV(De), { color: '--c3', label: 'D_e', dash: [3, 3], labelRight: true });
      /* Derecha: espaciado entre niveles */
      const pr = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H_, xmin: 0, xmax: Math.min(H.morseN(we, wx), 40), ymin: 0, ymax: we * 1.05, xlabel: 'n', ylabel: 'E_{n+1} − E_n (cm⁻¹)', ml: 50, mr: 8, title: 'Anarmonicidad' });
      pr.frame(); pr.hline(we, { color: '--c2', dash: [5, 3], label: 'armónico ωe', labelRight: true });
      pr.fn((n) => H.morseE(Math.floor(n) + 1, we, wx) - H.morseE(Math.floor(n), we, wx), { color: '--accent', width: 2.8, n: 120 });
      const f01 = H.morseLine(0, 1, we, wx), f02 = H.morseLine(0, 2, we, wx);
      sim.set('De', `${EM.fix(eV(De), 3)} eV (${EM.fix(De, 0)} cm⁻¹) · ${H.morseN(we, wx)}`);
      sim.set('f', `${EM.fix(f01, 2)} cm⁻¹ · ${EM.fix(fobs, 2)} cm⁻¹ · ${EM.fix((f01 / fobs - 1) * 100, 3)} %`);
      sim.set('o', `${EM.fix(f02, 2)} cm⁻¹ · ${EM.fix(H.morseE(1, we, wx) - H.morseE(0, we, wx), 2)} → ${EM.fix(H.morseE(nl, we, wx) - H.morseE(nl - 1, we, wx), 2)} cm⁻¹ (n = 0 → ${nl - 1})`);
      sim.set('k', `${EM.fix(H.kForce(we, mu), 1)} N/m · a = ${EM.fix(a, 4)} Å⁻¹`);
    });
  });
})();
