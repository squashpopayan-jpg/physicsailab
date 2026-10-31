/* Capítulo 29 — Segunda cuantización y gases cuánticos */
(function () {
  'use strict';
  const EM = window.EM, SQ = EM.qm.sq, K = SQ.K, PI = Math.PI;

  /* 29.1 Modelo de Hubbard de dos sitios: del hopping al intercambio */
  EM.defineSim('hubbard2', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('U', { label: 'Repulsión en el sitio U (en unidades de t, el salto entre sitios)', min: 0, max: 20, step: 0.1, value: 4, fmt: (v) => EM.fix(v, 1) });
    sim.out('e', 'Energías del sector de dos electrones (<i>S</i><sub>z</sub> = 0): singlete ligado <i>E</i><sub>S</sub> = <i>U</i>/2 − √(<i>U</i>²/4 + 4<i>t</i>²) · triplete 0 · doble ocupación antisimétrica <i>U</i> · estado superior', { hl: true });
    sim.out('d', 'Probabilidad de doble ocupación en el fundamental ⟨<i>D</i>⟩ · cociente con el valor sin interacción (½)');
    sim.out('j', 'Desdoblamiento singlete–triplete |E<sub>S</sub>| frente al valor efectivo de Heisenberg 4<i>t</i>²/<i>U</i> (válido si <i>U</i> ≫ <i>t</i>) · diagonalización completa en el espacio de Fock de 16 estados');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, U = sim.p.U;
      EM.draw.clear(cv);
      const Us = Array.from({ length: 200 }, (_, i) => (20 * i) / 199), lv = (u) => SQ.hubbard2Levels(1, u);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: 20, ymin: -4.2, ymax: 22, xlabel: 'U / t', ylabel: 'E / t', ml: 50, mr: 8, title: 'Niveles de dos electrones en dos sitios (S_z = 0)' });
      pl.frame(); pl.xy(Us, Us.map((u) => lv(u).singlet), { color: '--accent', width: 2.4 }); pl.xy(Us, Us.map(() => 0), { color: '--c2', width: 2 }); pl.xy(Us, Us.map((u) => u), { color: '--c3', width: 2 }); pl.xy(Us, Us.map((u) => lv(u).upper), { color: '--c1', width: 2 }); pl.xy(Us, Us.map((u) => -4 / Math.max(u, 0.2)), { color: '--ink-3', width: 1.3, dash: [4, 3] }); pl.vline(U, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'singlete (fundamental)', color: '--accent' }, { label: 'triplete', color: '--c2' }, { label: 'U', color: '--c3' }, { label: 'singlete superior', color: '--c1' }, { label: '−4t²/U (Heisenberg)', color: '--ink-3', dash: [4, 3] }], 'tl');
      const q = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 0, xmax: 20, ymin: 0, ymax: 0.55, xlabel: 'U / t', ylabel: 'doble ocupación ⟨D⟩', ml: 46, mr: 8, title: 'Localización: ⟨D⟩ → 0' });
      q.frame(); q.fn((u) => SQ.hubbard2Double(1, u), { color: '--accent', width: 2.4 }); q.fn((u) => 0.5, { color: '--ink-3', width: 1, dash: [3, 3] }); q.vline(U, { color: '--ink-3', dash: [3, 3] });
      const { H: Hm } = SQ.hubbard2(1, U), ev = Array.from(EM.P.la.eigh(Hm, { vectors: false }).values), l = lv(U);
      sim.set('e', `${EM.fix(l.singlet, 5)} · 0 · ${EM.fix(l.dpl, 3)} · ${EM.fix(l.upper, 5)} (la diagonalización completa de 16 estados contiene este valor con diferencia ${EM.sci(Math.min(...ev.map((x) => Math.abs(x - l.singlet))), 1)})`);
      sim.set('d', `${EM.fix(SQ.hubbard2Double(1, U), 5)} · ${EM.fix(2 * SQ.hubbard2Double(1, U), 4)}`);
      sim.set('j', `${EM.fix(-l.singlet, 5)} · 4t²/U = ${U > 0 ? EM.fix(4 / U, 5) : '∞'} · cociente ${U > 0 ? EM.fix(-l.singlet / (4 / U), 4) : '—'}`);
    });
  });

  /* 29.2 Gas ideal de fermiones degenerado */
  const FP = { cu: ['Cobre (electrones de conducción)', 8.47e28, K.me], na: ['Sodio (electrones)', 2.65e28, K.me], he3: ['³He líquido (1 atm)', 1.64e28, 3.01603 * K.u], wd: ['Enana blanca (electrones, 10⁹ kg/m³·)', 3e35, K.me], gas: ['Gas de electrones diluido (semiconductor dopado)', 1e24, 0.067 * K.me] };
  EM.defineSim('gas-fermi', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('s', { label: 'Sistema', options: Object.entries(FP).map(([k, v]) => [k, v[0]]), value: 'cu' });
    sim.slider('T', { label: 'Temperatura T/T_F', min: 0.001, max: 2, step: 0.001, value: 0.05, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.out('f', 'Energía de Fermi <i>E</i><sub>F</sub> = (ħ²/2<i>m</i>)(3π²<i>n</i>)<sup>2/3</sup> y temperatura de Fermi <i>T</i><sub>F</sub> = <i>E</i><sub>F</sub>/<i>k</i><sub>B</sub>', { hl: true });
    sim.out('m', 'Potencial químico μ(T) (desarrollo de Sommerfeld, a bajas T) en unidades de <i>E</i><sub>F</sub> · parámetro de degeneración <i>n</i>λ<sub>T</sub>³ (≫ 1 si degenerado)');
    sim.out('c', 'Calor específico electrónico <i>C</i>/<i>Nk</i><sub>B</sub> = (π²/2)(<i>T</i>/<i>T</i><sub>F</sub>) frente al clásico 3/2 · presión de degeneración <i>P</i> = (2/5)<i>nE</i><sub>F</sub> (Pa)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, [nm, n, m] = FP[sim.p.s], t = sim.p.T, EF = SQ.fermiE(n, m), TF = EF / K.kB;
      EM.draw.clear(cv);
      /* μ(T) exacta por bisección de n = ∫ g(ε) f dε en unidades de E_F: ∫₀^∞ (3/2) √x/(e^{(x−μ)/t} + 1) dx = 1 */
      const nOf = (mu) => { let s = 0; const N = 4000, xm = 8 + 20 * t, h = xm / N; for (let i = 1; i <= N; i++) { const x = (i - 0.5) * h; s += 1.5 * Math.sqrt(x) / (Math.exp((x - mu) / t) + 1) * h; } return s; };
      let lo = -20 * t - 2, hi = 2; for (let i = 0; i < 60; i++) { const md = 0.5 * (lo + hi); if (nOf(md) < 1) lo = md; else hi = md; } const mu = 0.5 * (lo + hi);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 2.2, ymin: 0, ymax: 1.3, xlabel: 'ε / E_F', ylabel: 'densidad de estados g(ε) y ocupación', ml: 50, mr: 8, title: `Gas de Fermi a T = ${EM.fix(t, 3)} T_F` });
      pl.frame(); pl.fn((x) => (x > 0 ? (1.5 * Math.sqrt(x)) / 2.2 : 0), { color: '--ink-3', width: 1.4, dash: [4, 3] }); pl.fn((x) => 1 / (Math.exp((x - mu) / t) + 1), { color: '--accent', width: 2.4 }); pl.fn((x) => (x > 0 ? (1.5 * Math.sqrt(x) / (Math.exp((x - mu) / t) + 1)) / 2.2 : 0), { color: '--c2', width: 2 });
      pl.legend([{ label: 'f(ε) de Fermi–Dirac', color: '--accent' }, { label: 'g(ε)f(ε) (electrones activos)', color: '--c2' }, { label: 'g(ε) ∝ √ε', color: '--ink-3', dash: [4, 3] }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 2, ymin: 0, ymax: 1.3, xlabel: 'T / T_F', ylabel: 'μ/E_F', ml: 46, mr: 8, title: 'El potencial químico baja con T' });
      q.frame(); const ts = Array.from({ length: 40 }, (_, i) => 0.02 + (1.98 * i) / 39); q.xy(ts, ts.map((tt) => { let lo2 = -20 * tt - 2, hi2 = 2; const f2 = (mu2) => { let s = 0; const N = 1500, xm = 8 + 20 * tt, h = xm / N; for (let i = 1; i <= N; i++) { const x = (i - 0.5) * h; s += 1.5 * Math.sqrt(x) / (Math.exp((x - mu2) / tt) + 1) * h; } return s; }; for (let i = 0; i < 40; i++) { const md = 0.5 * (lo2 + hi2); if (f2(md) < 1) lo2 = md; else hi2 = md; } return 0.5 * (lo2 + hi2); }), { color: '--accent', width: 2.2 }); q.dot(t, mu, { color: '--c3', r: 5 });
      sim.set('f', `${EM.fix(EF / K.e, 4)} eV · T_F = ${EM.sci(TF, 4)} K`);
      sim.set('m', `${EM.fix(mu, 5)} (Sommerfeld: ${EM.fix(1 - (PI ** 2 / 12) * t * t, 5)}) · nλ³ = ${EM.sci(n * SQ.lambdaT(m, t * TF) ** 3, 3)}`);
      sim.set('c', `${t < 0.2 ? EM.fix((PI * PI / 2) * t, 4) : '(la fórmula vale solo para T ≪ T_F)'} (frente a 1.5) · P = ${EM.sci(0.4 * n * EF, 3)} Pa`);
    });
  });

  /* 29.3 Condensación de Bose–Einstein */
  const BP = { rb: ['⁸⁷Rb (trampa magnética, 10²⁰ m⁻³)', 86.909 * K.u, 1e20], na: ['²³Na (10²⁰ m⁻³)', 22.9898 * K.u, 1e20], he4: ['⁴He líquido (2.18×10²⁸ m⁻³)', 4.0026 * K.u, 2.18e28], h: ['H atómico (10²⁰ m⁻³)', 1.00783 * K.u, 1e20] };
  EM.defineSim('bec', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('s', { label: 'Átomos', options: Object.entries(BP).map(([k, v]) => [k, v[0]]), value: 'rb' });
    sim.slider('n', { label: 'Densidad del gas, factor respecto del valor de la lista', min: 0.01, max: 100, step: 0.01, value: 1, log: true, fmt: (v) => EM.fix(v, 2) + '×' });
    sim.slider('T', { label: 'Temperatura T/T_c', min: 0.05, max: 2, step: 0.01, value: 0.7, fmt: (v) => EM.fix(v, 2) });
    sim.out('t', 'Temperatura crítica <i>T</i><sub>c</sub> = (2πħ²/<i>mk</i><sub>B</sub>)(<i>n</i>/ζ(3/2))<sup>2/3</sup> · λ<sub>T</sub>(<i>T</i><sub>c</sub>) y espaciado entre partículas <i>n</i><sup>−1/3</sup>', { hl: true });
    sim.out('f', 'Fracción condensada <i>N</i><sub>0</sub>/<i>N</i> = 1 − (<i>T</i>/<i>T</i><sub>c</sub>)<sup>3/2</sup> · temperatura absoluta elegida');
    sim.out('c', 'Criterio de degeneración: <i>n</i>λ<sub>T</sub>³ = ζ(3/2) = 2.612 en <i>T</i><sub>c</sub> · valor con la temperatura elegida');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, [nm, m, n0] = BP[sim.p.s], n = n0 * sim.p.n, Tc = SQ.bec(n, m), T = sim.p.T * Tc;
      EM.draw.clear(cv);
      const ts = Array.from({ length: 200 }, (_, i) => (2 * i) / 199), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, xlabel: 'T / T_c', ylabel: 'fracción', ml: 50, mr: 8, title: 'Un gas ideal de bosones se condensa por debajo de T_c' });
      pl.frame(); pl.xy(ts, ts.map((x) => SQ.becFraction(x, 1)), { color: '--accent', width: 2.6 }); pl.xy(ts, ts.map((x) => 1 - SQ.becFraction(x, 1)), { color: '--c2', width: 1.8, dash: [5, 3] }); pl.vline(1, { color: '--ink-3', dash: [3, 3] }); pl.dot(sim.p.T, SQ.becFraction(sim.p.T, 1), { color: '--c3', r: 6 });
      pl.legend([{ label: 'N₀/N (condensado)', color: '--accent' }, { label: 'fracción térmica', color: '--c2', dash: [5, 3] }], 'tr');
      /* esquema: partículas: tamaño λ_T frente al espaciado */
      const bx = W * 0.64, by = H * 0.18, bw = W * 0.32, bh = H * 0.62; ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.strokeRect(bx, by, bw, bh); ctx.restore();
      let sd = 7; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; }, frac = SQ.becFraction(sim.p.T, 1), NP = 40, lam = SQ.lambdaT(m, T), dsp = Math.pow(n, -1 / 3), rr = Math.min(bw * 0.12, (bw * 0.5 * lam) / (4 * dsp));
      for (let i = 0; i < NP; i++) { const cond = i < NP * frac; const x = cond ? bx + bw / 2 + (rnd() - 0.5) * bw * 0.22 : bx + 6 + rnd() * (bw - 12), y = cond ? by + bh / 2 + (rnd() - 0.5) * bh * 0.22 : by + 6 + rnd() * (bh - 12); ctx.save(); ctx.fillStyle = EM.alpha(cond ? '--accent' : '--c2', cond ? 0.35 : 0.3); ctx.beginPath(); ctx.arc(x, y, cond ? rr * 1.6 : rr, 0, 2 * PI); ctx.fill(); ctx.restore(); }
      EM.text(ctx, 'condensado (azul, en el estado fundamental) + átomos térmicos', bx + bw / 2, by + bh + 16, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('t', `${EM.sci(Tc, 4)} K · λ_T = ${EM.sci(SQ.lambdaT(m, Tc), 3)} m · n^(−1/3) = ${EM.sci(Math.pow(n, -1 / 3), 3)} m`);
      sim.set('f', `${EM.fix(SQ.becFraction(sim.p.T, 1), 4)} · T = ${EM.sci(T, 3)} K`);
      sim.set('c', `2.612 · ${EM.fix(n * SQ.lambdaT(m, T) ** 3, 4)}`);
    });
  });
})();
