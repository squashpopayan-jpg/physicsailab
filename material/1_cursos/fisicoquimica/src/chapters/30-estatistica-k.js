/* Capítulo 30 — Equilibrio químico desde la mecánica estadística */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, St = FQ.stat, R = St.R, KCM = 0.6950348004;
  const MK = { ...St.MOL, H2: { ...St.MOL.H2, B: 59.322 } };
  const RX = {
    hd: ['H₂ + D₂ ⇌ 2 HD', { HD: 2, H2: -1, D2: -1 }, 54.86, null, 'ΔE₀ = 54.9 cm⁻¹ (diferencia de energías de punto cero). El límite de alta temperatura es K = 4, el cociente de números de simetría (σ_H₂σ_D₂/σ_HD² = 4).'],
    no: ['N₂ + O₂ ⇌ 2 NO', { NO: 2, N2: -1, O2: -1 }, St.D0.N2 + St.D0.O2 - 2 * St.D0.NO, { NO: 2, N2: -1, O2: -1 }, 'ΔE₀ = D₀(N₂) + D₀(O₂) − 2D₀(NO) = 181.7 kJ/mol: reacción endotérmica; el NO del aire de los motores y de los rayos se forma solo a temperaturas altas (mecanismo de Zeldovich).'],
    h: ['H₂ ⇌ 2 H', { Hat: 2, H2: -1 }, St.D0.H2, { H: 2, H2: -1 }, 'ΔE₀ = D₀(H₂) = 432.1 kJ/mol. La atomización crece como e^(−D₀/kT) y la entropía de traslación (Δn = +1) la favorece: el H₂ se disocia apreciablemente solo por encima de unos 3000 K. El RRHO se aparta del experimento un 7–15 % por la anarmonicidad.'],
    o: ['O₂ ⇌ 2 O', { Oat: 2, O2: -1 }, St.D0.O2, { O: 2, O2: -1 }, 'ΔE₀ = D₀(O₂) = 493.7 kJ/mol; la degeneración 9 del átomo O (³P) y la multiplicidad 3 del O₂ entran en q_elec.']
  };
  /* 30.1 K desde q */
  EM.defineSim('keq-q', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('r', { label: 'Reacción', options: Object.entries(RX).map(([k, v]) => [k, v[0]]), value: 'hd' });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 5000, step: 10, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('K', 'Constante de equilibrio <i>K</i><sub>p</sub>° desde funciones de partición · desde la tabla NASA (ajustada al experimento)', { hl: true });
    sim.out('f', 'Factores de <i>K</i>: traslación (masas) · rotación · vibración y electrónica · energía de punto cero e<sup>−ΔE₀/<i>k</i><sub>B</sub><i>T</i></sup>');
    sim.out('d', 'ΔE₀ y de qué depende cada factor');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, nu, dE, nasa, txt] = RX[p.r], K = (T) => St.Kp(nu, dE, T, MK), KN = (T) => (nasa ? Math.exp(-FQ.dG(nasa, T) / (R * T)) : NaN);
      EM.draw.clear(cv);
      const Ts = Array.from({ length: 160 }, (_, i) => 250 + (4750 * i) / 159).filter((T) => (p.r === 'hd' ? T < 1500 : T > 500));
      const lnK = (f, T) => Math.log(f(T)), xs = Ts.map((T) => 1000 / T);
      const ys = Ts.map((T) => lnK(K, T)), yn = nasa ? Ts.map((T) => lnK(KN, T)) : [];
      const all = ys.concat(yn.filter(isFinite)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...all) - 0.5, ymax: Math.max(...all) + 0.5, xlabel: '1000/T (K⁻¹)', ylabel: 'ln K_p°', ml: 52 });
      pl.frame(); pl.xy(xs, ys, { color: '--c1', width: 2.8 }); if (nasa) pl.xy(xs, yn, { color: '--c2', width: 1.8, dash: [5, 4] }); if (p.r === 'hd') pl.hline(Math.log(4), { color: '--ink-3', dash: [3, 3], label: 'límite clásico K = 4' });
      if (isFinite(Math.log(K(p.T)))) pl.dot(1000 / p.T, Math.log(K(p.T)), { color: '--accent' });
      pl.legend([{ label: 'funciones de partición (RRHO)', color: '--c1' }].concat(nasa ? [{ label: 'NASA-7', color: '--c2', dash: [5, 4] }] : []), 'tr');
      const k = K(p.T), kn = KN(p.T);
      let ft = 1, fr = 1, fv = 1; const kT = 1.380649e-23 * p.T, u = 1.66053906660e-27, h = 6.62607015e-34;
      for (const [sp, v] of Object.entries(nu)) { const m = MK[sp], lam3 = Math.pow((2 * Math.PI * m.M * u * kT) / (h * h), 1.5); ft *= Math.pow(lam3 * kT / 1e5, v); const qi = St.qint(m, p.T); let qr = 1; if (m.type === 'lin') qr = p.T / (m.sigma * (m.B / KCM)); else if (m.type === 'h2' || m.type === 'rs') { const th = m.B / KCM; let s = 0; for (let J = 0; J < 80; J++) s += (m.type === 'h2' ? (J % 2 ? 3 : 1) : (J % 2 ? m.ws[1] : m.ws[0])) * (2 * J + 1) * Math.exp((-th * J * (J + 1)) / p.T); qr = s / (m.type === 'h2' ? 4 : m.ws[2]); } fr *= Math.pow(qr, v); fv *= Math.pow(qi / qr, v); }
      sim.set('K', EM.sci(k, 4) + ' · ' + (nasa ? EM.sci(kn, 4) + ' (cociente ' + EM.fix(k / kn, 3) + ')' : '3.27 a 300 K (experimento: 3.3)'));
      sim.set('f', EM.sci(ft, 3) + ' · ' + EM.sci(fr, 3) + ' · ' + EM.sci(fv, 3) + ' · ' + EM.sci(Math.exp(-dE / (KCM * p.T)), 3));
      sim.set('d', txt);
    });
  });

  /* 30.2 Ecuación de Saha */
  const EL = { H: ['Hidrógeno (13.598 eV)', 13.598, null], He: ['Helio (24.587 eV)', 24.587, [1, 2]], Na: ['Sodio (5.139 eV)', 5.139, [2, 1]] };
  const kB_eV = 8.617333262e-5;
  EM.defineSim('saha', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('e', { label: 'Elemento', options: Object.entries(EL).map(([k, v]) => [k, v[0]]), value: 'H' });
    sim.slider('n', { label: 'Densidad numérica total de átomos + iones', min: 1e16, max: 1e26, step: 1, value: 1e20, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 2000, max: 40000, step: 50, value: 9500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('x', 'Grado de ionización <i>x</i> (Saha: <i>x</i>²/(1 − <i>x</i>) = <i>S</i>(<i>T</i>)/<i>n</i>) · <i>S</i>(<i>T</i>) en m⁻³', { hl: true });
    sim.out('b', 'Solo H: fracción de átomos neutros en <i>n</i> = 2 · temperatura del máximo de la línea de Balmer (∝ fracción neutra × población de <i>n</i> = 2)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, I, gg] = EL[p.e], g0 = gg ? gg[0] : 2, gi = gg ? gg[1] : 1;
      EM.draw.clear(cv);
      const xf = (T) => { const b = St.saha(T, I, g0, gi) / p.n; return (-b + Math.sqrt(b * b + 4 * b)) / 2; };
      const Ts = Array.from({ length: 300 }, (_, i) => 2000 + (38000 * i) / 299);
      const f2 = (T) => { let q = 0; for (let n = 1; n <= 8; n++) q += 2 * n * n * Math.exp((-13.598 * (1 - 1 / (n * n))) / (kB_eV * T)); return (8 * Math.exp((-10.2) / (kB_eV * T))) / q; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 2000, xmax: 40000, ymin: 0, ymax: 1.05, xlabel: 'temperatura (K)', ylabel: 'fracción', ml: 46 });
      pl.frame(); pl.xy(Ts, Ts.map(xf), { color: '--c1', width: 2.8 });
      const bal = Ts.map((T) => f2(T) * (1 - xf(T))), mb = Math.max(...bal), Tm = Ts[bal.indexOf(mb)];
      if (p.e === 'H') { pl.xy(Ts, bal.map((b) => b / mb), { color: '--c2', width: 2.4, dash: [6, 4] }); pl.vline(Tm, { color: '--c2', dash: [2, 3], label: 'máx. Balmer' }); }
      pl.vline(p.T, { color: '--accent', dash: [3, 3] }); pl.legend([{ label: 'grado de ionización x', color: '--c1' }].concat(p.e === 'H' ? [{ label: 'intensidad Balmer (normalizada)', color: '--c2', dash: [6, 4] }] : []), 'tl');
      sim.set('x', EM.fix(xf(p.T), 4) + ' · ' + EM.sci(St.saha(p.T, I, g0, gi), 3));
      sim.set('b', p.e === 'H' ? EM.sci(f2(p.T), 3) + ' · ' + EM.fix(Math.round(Tm / 100) * 100, 0) + ' K (estrellas de tipo A, ~10 000 K; Payne, 1925)' : '—');
    });
  });
})();
