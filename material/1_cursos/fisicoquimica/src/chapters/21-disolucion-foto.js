/* Capítulo 21 — Reacciones en disolución y fotoquímica */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, F = FQ.sol2, R = FQ.R;

  /* 21.1 Control por difusión: k_obs frente a k_act */
  const SOLV = { agua: ['Agua', 0.890e-3, 78.4], meoh: ['Metanol', 0.544e-3, 32.6], etoh: ['Etanol', 1.074e-3, 24.3], acn: ['Acetonitrilo', 0.369e-3, 35.9], hex: ['Hexano', 0.300e-3, 1.89], gli: ['Glicerol', 934e-3, 42.5] };
  EM.defineSim('difusion-control', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('s', { label: 'Disolvente a 298.15 K', options: Object.entries(SOLV).map(([k, v]) => [k, `${v[0]} (η = ${EM.sci(v[1] * 1e3, 3)} mPa·s, ε_r = ${v[2]})`]), value: 'agua' });
    sim.slider('ka', { label: 'Constante de activación k_act (sin difusión)', min: 1e5, max: 1e14, step: 1, value: 1e9, log: true, unit: 'L/mol·s', fmt: (v) => EM.sci(v, 2) });
    sim.select('zz', { label: 'Producto de cargas z_A z_B', options: [[-2, '−2 (iones opuestos, z = +1 y −2)'], [-1, '−1 (iones opuestos)'], [0, '0 (alguno neutro)'], [1, '+1 (iones del mismo signo)'], [2, '+2 (mismo signo, z = 1 y 2)']], value: 0 });
    sim.slider('Rr', { label: 'Distancia de encuentro R = r_A + r_B', min: 0.3, max: 1, step: 0.05, value: 0.5, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.out('kD', 'Constante de difusión <i>k</i><sub>D</sub> = 8<i>RT</i>/3η · factor de Debye (para iones)', { hl: true });
    sim.out('k', 'Constante observada <i>k</i> = <i>k</i><sub>D</sub><i>k</i><sub>act</sub>/(<i>k</i><sub>D</sub> + <i>k</i><sub>act</sub>) · fracción controlada por la difusión');
    sim.out('t', 'Tiempo característico de un encuentro con [B] = 1 mM: 1/(<i>k</i><sub>D</sub>[B])');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, sv = SOLV[p.s], eta = sv[1], epsr = sv[2], Rm = p.Rr * 1e-9, zz = +p.zz;
      EM.draw.clear(cv);
      const fd = F.debyeFactor(298.15, epsr, zz, 1, Rm), kD = F.kD8(298.15, eta) * fd, kobs = F.kMixed(kD, p.ka);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 1e5, xmax: 1e14, ymin: 1e5, ymax: 1e14, xlog: true, ylog: true, xlabel: 'k_act (L/mol·s)', ylabel: 'k observada (L/mol·s)', ml: 54, title: 'Del control por activación al control por difusión' });
      pl.frame(); pl.fn((x) => x, { color: '--ink-3', width: 1.2, dash: [4, 4] }); pl.hline(kD, { color: '--accent', dash: [5, 4], label: 'k_D' });
      const xs = [], ys = []; for (let e = 5; e <= 14.001; e += 0.1) { const x = Math.pow(10, e); xs.push(x); ys.push(F.kMixed(kD, x)); }
      pl.xy(xs, ys, { color: '--c1', width: 2.8 }); pl.dot(p.ka, kobs, { color: '--accent' });
      const pl2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 1e-4, xmax: 1, ymin: 1e5, ymax: 1e12, xlog: true, ylog: true, xlabel: 'viscosidad η (Pa·s)', ylabel: 'k_D (L/mol·s)', ml: 48, mr: 8, title: 'k_D ∝ 1/η (8RT/3η)' });
      pl2.frame(); pl2.fn((e) => F.kD8(298.15, e) * fd, { color: '--c3', width: 2.4 }); Object.values(SOLV).forEach((v) => pl2.dot(v[1], F.kD8(298.15, v[1]) * fd, { color: '--c2', r: 3.5 })); pl2.dot(eta, kD, { color: '--accent', r: 5 });
      const frac = kobs / p.ka;
      sim.set('kD', EM.sci(kD, 3) + ' L/mol·s' + (zz ? ' (factor de Debye ' + EM.fix(fd, 2) + ')' : ''));
      sim.set('k', EM.sci(kobs, 3) + ' L/mol·s · ' + EM.fix(100 * (1 - frac), 1) + ' % de la «resistencia» es de difusión' + (p.ka > 10 * kD ? ' (control por difusión)' : p.ka < kD / 10 ? ' (control por activación)' : ' (control mixto)'));
      sim.set('t', EM.sci(1 / (kD * 1e-3), 2) + ' s');
    });
  });

  /* 21.2 Efecto salino cinético primario */
  const SAL = { a: ['S₂O₈²⁻ + I⁻ → productos (z_A z_B = +2)', -2, -1], b: ['[Co(NH₃)₅Br]²⁺ + OH⁻ → productos (z_A z_B = −2)', 2, -1], c: ['CH₃COOEt + OH⁻ (z_A z_B = 0)', 0, -1], d: ['Iones de carga +3 y −1 (z_A z_B = −3)', 3, -1], e: ['Mismo signo, z_A z_B = +4 (2− y 2−)', -2, -2] };
  EM.defineSim('sal-cinetica', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('r', { label: 'Reacción', options: Object.entries(SAL).map(([k, v]) => [k, v[0]]), value: 'a' });
    sim.slider('I', { label: 'Fuerza iónica I', min: 1e-4, max: 0.5, step: 1e-4, value: 0.01, log: true, unit: 'mol/L', fmt: (v) => EM.sci(v, 2) });
    sim.out('k', 'Cociente <i>k</i>/<i>k</i><sub>0</sub>: Debye–Hückel limitante · Davies', { hl: true });
    sim.out('sl', 'Pendiente limitante de log(<i>k</i>/<i>k</i><sub>0</sub>) frente a √<i>I</i>: 2<i>A</i> z<sub>A</sub>z<sub>B</sub> (agua, 25 °C)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [name, zA, zB] = SAL[p.r], zz = zA * zB, A = FQ.Adh();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.7, ymin: Math.min(-0.6, -0.35 * Math.abs(zz) - 0.3), ymax: Math.max(0.6, 0.35 * Math.abs(zz) + 0.3), xlabel: '√I  (mol/L)^½', ylabel: 'log₁₀(k/k₀)', ml: 52 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [3, 3] });
      pl.fn((x) => F.saltLimit(zA, zB, x * x), { color: '--c1', width: 2, dash: [6, 4] }); pl.fn((x) => F.saltLog(zA, zB, x * x), { color: '--c3', width: 2.8 });
      pl.dot(Math.sqrt(p.I), F.saltLog(zA, zB, p.I), { color: '--accent' });
      pl.legend([{ label: 'Debye–Hückel limitante', color: '--c1', dash: [6, 4] }, { label: 'Davies (hasta I ≈ 0.5)', color: '--c3' }], 'tl');
      sim.set('k', EM.fix(Math.pow(10, F.saltLimit(zA, zB, p.I)), 3) + ' · ' + EM.fix(Math.pow(10, F.saltLog(zA, zB, p.I)), 3));
      sim.set('sl', EM.fix(2 * A * zz, 2) + ' (z_Az_B = ' + zz + ')' + (zz > 0 ? ' · la sal acelera' : zz < 0 ? ' · la sal frena' : ' · sin efecto: ningún cambio de carga'));
    });
  });

  /* 21.3 Marcus */
  EM.defineSim('marcus', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lam', { label: 'Energía de reorganización λ', min: 20, max: 250, step: 1, value: 100, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('dG', { label: 'Energía de Gibbs de la reacción ΔG°', min: -300, max: 60, step: 1, value: -40, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 400, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('b', 'Barrera de Marcus Δ<i>G</i>‡ = (λ + Δ<i>G</i>°)²/(4λ) · <i>k</i>/<i>k</i><sub>máx</sub>', { hl: true });
    sim.out('reg', 'Régimen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = p.lam, dG = p.dG, RT = (R * p.T) / 1e3;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.47, h: H, xmin: -1.2, xmax: 2.2, ymin: -10, ymax: Math.max(3.2 * lam, 2.4 * lam + dG) , xlabel: 'coordenada de reacción (disolvente)', ylabel: 'energía libre (kJ/mol)', ml: 52, title: 'Parábolas de reactivos y productos' });
      pl.frame();
      pl.fn((x) => lam * x * x, { color: '--c1', width: 2.6, n: 200 }); pl.fn((x) => lam * (x - 1) * (x - 1) + dG, { color: '--c2', width: 2.6, n: 200 });
      const xs = (lam + dG) / (2 * lam), ys = lam * xs * xs; pl.dot(xs, ys, { color: '--accent' }); pl.hline(ys, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'reactivos (D + A)', color: '--c1' }, { label: 'productos (D⁺ + A⁻)', color: '--c2' }], 'tr');
      const lo = -330, hi = 60, pl2 = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -hi, xmax: -lo, ymin: -14, ymax: 0.6, xlabel: '−ΔG° (kJ/mol)', ylabel: 'log₁₀(k/k_máx)', ml: 46, mr: 8, title: 'k frente a la fuerza impulsora' });
      pl2.frame(); const g = (d) => (-(lam + d) * (lam + d)) / (4 * lam) / (RT * Math.LN10); pl2.fn((m) => g(-m), { color: '--c3', width: 2.8, n: 300 }); pl2.vline(lam, { color: '--ink-3', dash: [4, 4], label: '−ΔG° = λ' }); pl2.dot(-dG, g(dG), { color: '--accent' });
      const bar = ((lam + dG) * (lam + dG)) / (4 * lam);
      sim.set('b', EM.fix(bar, 1) + ' kJ/mol · ' + EM.sci(Math.pow(10, g(dG)), 2));
      sim.set('reg', -dG < lam - 1 ? 'región normal: cuanto más exergónica, más rápida' : -dG > lam + 1 ? 'región invertida (Marcus, 1956): una reacción más exergónica es más lenta' : 'sin activación (−ΔG° ≈ λ): velocidad máxima');
    });
  });

  /* 21.4 Fluorescencia, tiempo de vida y apagamiento de Stern–Volmer */
  EM.defineSim('fluor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('kr', { label: 'k_r (emisión de fluorescencia)', min: 1e6, max: 1e9, step: 1, value: 2.9e7, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.slider('knr', { label: 'k_nr (conversión interna)', min: 1e5, max: 1e10, step: 1, value: 2.0e7, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.slider('kisc', { label: 'k_isc (cruce entre sistemas a T₁)', min: 1e5, max: 1e10, step: 1, value: 3.6e6, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.slider('kq', { label: 'k_q (constante de apagamiento bimolecular)', min: 1e7, max: 2e10, step: 1, value: 6e9, log: true, unit: 'L/mol·s', fmt: (v) => EM.sci(v, 2) });
    sim.slider('Q', { label: 'Concentración del apagador [Q]', min: 0, max: 0.05, step: 0.0005, value: 0.01, unit: 'mol/L', fmt: (v) => v.toFixed(4) });
    sim.seg('tipo', { label: 'Mecanismo del apagamiento', options: [['din', 'Dinámico (colisional)'], ['est', 'Estático (complejo no emisor)']], value: 'din' });
    sim.out('p', 'Rendimiento cuántico Φ<sub>F</sub> · tiempo de vida τ₀ · Φ<sub>isc</sub>', { hl: true });
    sim.out('sv', 'Constante de Stern–Volmer <i>K</i><sub>SV</sub> = <i>k</i><sub>q</sub>τ₀ · <i>F</i>₀/<i>F</i> en [Q] · τ₀/τ en [Q]');
    sim.out('d', '<i>k</i><sub>q</sub> comparada con el límite de difusión <i>k</i><sub>D</sub> = 8<i>RT</i>/3η (agua, 25 °C)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ph0 = F.photo(p.kr, p.knr, p.kisc, p.kq, 0), ph = F.photo(p.kr, p.knr, p.kisc, p.kq, p.Q), dyn = p.tipo === 'din';
      EM.draw.clear(cv);
      const tmax = 5 * ph0.tau0, N = 200, ts = Array.from({ length: N + 1 }, (_, i) => (tmax * i) / N), KS = p.kq * ph0.tau0, amp = dyn ? 1 : 1 / (1 + KS * p.Q);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: tmax * 1e9, ymin: 1e-3, ymax: 1.5, ylog: true, xlabel: 't (ns)', ylabel: 'intensidad relativa', ml: 54, title: 'Decaimiento de la fluorescencia' });
      pl.frame(); pl.xy(ts.map((t) => t * 1e9), ts.map((t) => Math.exp(-t / ph0.tau0)), { color: '--c1', width: 2.6 });
      pl.xy(ts.map((t) => t * 1e9), ts.map((t) => amp * Math.exp(-t / (dyn ? ph.tau : ph0.tau0))), { color: '--c2', width: 2.6, dash: [6, 4] });
      pl.legend([{ label: 'sin apagador', color: '--c1' }, { label: 'con apagador', color: '--c2', dash: [6, 4] }], 'tr');
      const Qm = Math.max(0.05, p.Q * 1.1), pl2 = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0, xmax: Qm, ymin: 1, ymax: 1 + KS * Qm * 1.05 + 0.2, xlabel: '[Q] (mol/L)', ylabel: 'F₀/F  y  τ₀/τ', ml: 46, mr: 8, title: 'Gráfica de Stern–Volmer' });
      pl2.frame(); pl2.fn((q) => 1 + KS * q, { color: '--c1', width: 2.6 }); pl2.fn((q) => (dyn ? 1 + KS * q : 1), { color: '--c3', width: 2.4, dash: [5, 4] }); pl2.dot(p.Q, 1 + KS * p.Q, { color: '--accent' });
      pl2.legend([{ label: 'F₀/F (siempre)', color: '--c1' }, { label: 'τ₀/τ (solo el dinámico)', color: '--c3', dash: [5, 4] }], 'tl');
      sim.set('p', EM.fix(ph0.phiF0, 3) + ' · ' + EM.fix(ph0.tau0 * 1e9, 1) + ' ns · ' + EM.fix(p.kisc / (p.kr + p.knr + p.kisc), 3));
      sim.set('sv', EM.fix(KS, 1) + ' M⁻¹ · ' + EM.fix(1 + KS * p.Q, 3) + ' · ' + EM.fix(dyn ? 1 + KS * p.Q : 1, 3));
      sim.set('d', EM.sci(p.kq, 2) + ' / ' + EM.sci(F.kD8(298.15, 0.890e-3), 2) + ' = ' + EM.fix(p.kq / F.kD8(298.15, 0.890e-3), 2) + (p.kq > F.kD8(298.15, 0.890e-3) ? ' (¡supera el límite: debe ser estático!)' : ''));
    });
  });

  /* 21.5 Ciclo fotoestacionario NO₂–NO–O₃ */
  EM.defineSim('leighton', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('J', { label: 'Frecuencia de fotólisis J(NO₂)', min: 1e-4, max: 1.5e-2, step: 1e-5, value: 8e-3, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.slider('no2', { label: '[NO₂] inicial', min: 1, max: 100, step: 1, value: 30, unit: 'ppb', fmt: (v) => v.toFixed(0) });
    sim.slider('no', { label: '[NO] inicial', min: 0, max: 100, step: 1, value: 10, unit: 'ppb', fmt: (v) => v.toFixed(0) });
    sim.slider('kp', { label: 'Oxidación de NO a NO₂ por peróxidos (RO₂, HO₂): k_p', min: 0, max: 0.02, step: 0.0005, value: 0, unit: 's⁻¹', fmt: (v) => v.toFixed(4) });
    sim.out('ss', 'Composición a los 60 min: [NO₂] · [NO] · [O₃] (ppb)', { hl: true });
    sim.out('lt', '[O₃] de la relación de Leighton <i>J</i>[NO₂]/(<i>k</i><sub>3</sub>[NO]) con esa composición · ΣO<sub>x</sub> = [NO₂] + [O₃] (ppb)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, k3 = 1.95e-14 * 2.46e10 /* ppb⁻¹ s⁻¹ a 298 K y 1 atm: JPL, 3.0e-12 exp(−1500/T) */;
      EM.draw.clear(cv);
      const tmax = 3600, N = 360, ts = Array.from({ length: N + 1 }, (_, i) => (tmax * i) / N), r = FQ.odeStiff(F.leightonRHS(p.J, k3, p.kp), [p.no2, Math.max(p.no, 0.001), 0], ts, { rtol: 1e-8, atol: 1e-10 });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax / 60, ymin: 0, ymax: Math.max(...r.y.map((y) => Math.max(y[0], y[1], y[2]))) * 1.1 + 1, xlabel: 'tiempo (min)', ylabel: 'mezcla de aire (ppb)', ml: 50 });
      pl.frame(); [['NO₂', '--c2', 0], ['NO', '--c1', 1], ['O₃', '--c3', 2]].forEach(([n, c, i]) => pl.xy(ts.map((t) => t / 60), r.y.map((y) => y[i]), { color: c, width: 2.6 }));
      pl.legend([{ label: 'NO₂', color: '--c2' }, { label: 'NO', color: '--c1' }, { label: 'O₃', color: '--c3' }], 'tr');
      const y = r.y[N];
      sim.set('ss', `${EM.fix(y[0], 1)} · ${EM.fix(y[1], 2)} · ${EM.fix(y[2], 1)}`);
      sim.set('lt', (y[1] > 1e-6 ? EM.fix(F.leightonO3(p.J, k3, y[0], y[1]), 1) : '—') + ' ppb · ' + EM.fix(y[0] + y[2], 1) + ' ppb (inicial: ' + EM.fix(p.no2, 1) + ')' + (p.kp > 0 ? ' · con k_p cada ciclo NO₂ → NO → NO₂ deja un O₃ neto: el Ox crece sin límite mientras haya peróxidos' : ''));
    });
  });
})();
