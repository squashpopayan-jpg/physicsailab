/* Capítulo 24 — Teoremas adiabáticos, fase de Berry y Landau–Zener */
(function () {
  'use strict';
  const EM = window.EM, TD = EM.qm.tdep, M = EM.M, PI = Math.PI;

  /* 24.1 Landau–Zener: la sucesión de niveles evitados */
  EM.defineSim('landau-zener', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('g', { label: 'Acoplamiento g (la separación mínima entre niveles es 2g)', min: 0.1, max: 1.5, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('v', { label: 'Velocidad de barrido v (pendiente de la diferencia de energías diabáticas, ħ = 1)', min: 0.2, max: 12, step: 0.05, value: 2, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('p', 'Probabilidad de seguir el estado diabático (salto) <i>P</i> = exp(−2π<i>g</i>²/<i>v</i>) · integración numérica (RK4, intervalo finito: error del orden de 1/T) · probabilidad adiabática 1 − <i>P</i>', { hl: true });
    sim.out('a', 'Parámetro de adiabaticidad γ = g²/v: adiabático si γ ≫ 1 · separación mínima 2g · velocidad crítica v = 2πg²');
    let cache = null;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, g = sim.p.g, v = sim.p.v, key = g + '|' + v;
      if (!cache || cache.key !== key) {
        const T = Math.min(120, Math.max(30, 60 / v)), tl = []; for (let t = -T; t < -14; t += 2) tl.push(t); for (let k = 0; k <= 280; k++) tl.push(-14 + 0.1 * k); for (let t = 16; t <= T + 1e-9; t += 2) tl.push(t);
        const ts = [tl[0]], pop1 = [1], pop2 = [0]; let psi = { re: Float64Array.of(1, 0), im: new Float64Array(2) };
        const Hf = (t) => ({ re: [Float64Array.of((v * t) / 2, g), Float64Array.of(g, (-v * t) / 2)], im: [new Float64Array(2), new Float64Array(2)] });
        for (let i = 1; i < tl.length; i++) { const dt = tl[i] - tl[i - 1]; psi = TD.evolve(Hf, psi, tl[i - 1], tl[i], Math.max(8, Math.ceil((dt * (Math.abs(v * tl[i]) / 2 + 2 * g + 5)) / 0.05))); ts.push(tl[i]); pop1.push(psi.re[0] ** 2 + psi.im[0] ** 2); pop2.push(psi.re[1] ** 2 + psi.im[1] ** 2); }
        cache = { key, ts, pop1, pop2 };
      }
      const { ts, pop1, pop2 } = cache, P = TD.lzP(g, v), Pn = pop1[pop1.length - 1];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.48, h: H, xmin: -14, xmax: 14, ymin: -Math.max(3, 7 * v / 2 * 0 + v * 7), ymax: Math.max(3, v * 7), xlabel: 't', ylabel: 'energías', ml: 50, mr: 8, title: 'Niveles diabáticos y adiabáticos' });
      pl.frame(); pl.fn((t) => (v * t) / 2, { color: '--ink-3', width: 1.4, dash: [5, 3] }); pl.fn((t) => (-v * t) / 2, { color: '--ink-3', width: 1.4, dash: [5, 3] });
      pl.fn((t) => Math.hypot((v * t) / 2, g), { color: '--accent', width: 2.4 }); pl.fn((t) => -Math.hypot((v * t) / 2, g), { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'diabáticos', color: '--ink-3', dash: [5, 3] }, { label: 'adiabáticos (evitados)', color: '--accent' }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -14, xmax: 14, ymin: 0, ymax: 1.05, xlabel: 't', ylabel: 'población de los estados diabáticos', ml: 50, mr: 8, title: 'Evolución desde el estado diabático 1' });
      q.frame(); q.xy(ts, pop1, { color: '--c1', width: 2.2 }); q.xy(ts, pop2, { color: '--c2', width: 2.2 }); q.hline(P, { color: '--ink-3', dash: [3, 4], label: 'exp(−2πg²/v)', labelRight: true });
      q.legend([{ label: '|1⟩ (permanece)', color: '--c1' }, { label: '|2⟩ (sigue el adiabático)', color: '--c2' }], 'tr');
      sim.set('p', `${EM.fix(P, 5)} · ${EM.fix(Pn, 5)} · ${EM.fix(1 - P, 5)}`);
      sim.set('a', `γ = ${EM.fix((g * g) / v, 4)} · ${EM.fix(2 * g, 3)} · v_crit = ${EM.fix(2 * PI * g * g, 4)}`);
    });
  });

  /* 24.2 Espín en un campo que gira: seguimiento adiabático y fase de Berry */
  EM.defineSim('berry-espin', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'Ángulo del cono θ del campo B(t) respecto del eje z (grados)', min: 5, max: 175, step: 1, value: 60, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('om', { label: 'Velocidad de giro del campo ω respecto de la frecuencia de Larmor ω_L = 1', min: 0.005, max: 3, step: 0.005, value: 0.1, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.out('b', 'Fase de Berry tras un ciclo del campo: γ = −m·Ω = −π(1 − cos θ) para m = +½ (ángulo sólido Ω = 2π(1 − cos θ)) · radianes y grados', { hl: true });
    sim.out('a', 'Probabilidad mínima de seguir a B(t): 1 − sin²χ (con χ el ángulo entre n y w<sub>eff</sub>) · en cada instante ≥ este valor · condición adiabática ω ≪ ω<sub>L</sub>');
    sim.out('d', 'Fase dinámica por ciclo −ω<sub>L</sub><i>T</i>/2 con <i>T</i> = 2π/ω (muy grande en el límite adiabático; la geométrica no depende de la velocidad)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, th = M.rad(sim.p.th), om = sim.p.om, Tc = (2 * PI) / om, ts = Array.from({ length: 500 }, (_, i) => (3 * Tc * i) / 499);
      EM.draw.clear(cv);
      const Ps = ts.map((t) => TD.berryStay(th, om, t)), mn = Math.min(...Ps);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 3 * Tc, ymin: Math.min(0.9, mn - 0.05), ymax: 1.02, xlabel: 't (tres periodos de giro)', ylabel: 'P(espín alineado con B(t))', ml: 56, mr: 8, title: 'Seguimiento adiabático del campo' });
      pl.frame(); pl.xy(ts, Ps, { color: '--accent', width: 2.2 });
      /* esfera de Bloch: cono del campo y vector de espín (proyección) */
      const cx = W * 0.82, cy = H * 0.52, R = Math.min(W * 0.14, H * 0.36);
      ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, 2 * PI); ctx.stroke();
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; const zc = R * Math.cos(th), rc = R * Math.sin(th); ctx.beginPath(); ctx.ellipse(cx, cy - zc, rc, rc * 0.28, 0, 0, 2 * PI); ctx.stroke();
      ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.beginPath(); ctx.ellipse(cx, cy - zc, rc, rc * 0.28, 0, 0, 2 * PI); ctx.fill(); ctx.restore();
      EM.text(ctx, 'Ω = ' + EM.fix(2 * PI * (1 - Math.cos(th)), 3) + ' sr', cx, cy + R + 22, { size: 11, align: 'center', color: '--accent' }); EM.text(ctx, 'cono descrito por B', cx, cy - R - 10, { size: 11, align: 'center', color: '--ink-3' });
      const gB = TD.berryPhase(th, 0.5);
      sim.set('b', `${EM.fix(gB, 5)} rad · ${EM.fix(M.deg(gB), 3)}°`);
      sim.set('a', `${EM.fix(mn, 5)} · ω/ω_L = ${EM.fix(om, 3)} · ${om < 0.2 ? 'adiabático' : om > 1 ? 'no adiabático' : 'intermedio'}`);
      sim.set('d', `${EM.fix(-Tc / 2, 3)} rad (T = ${EM.fix(Tc, 3)})`);
    });
  });

  /* 24.3 Oscilador armónico con frecuencia variable: invariante adiabático frente a salto brusco */
  EM.defineSim('adiab-ho', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('r', { label: 'Razón de frecuencias final/inicial ω₁/ω₀', min: 0.3, max: 4, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('tau', { label: 'Duración del cambio τ (en unidades de 1/ω₀)', min: 0.05, max: 40, step: 0.05, value: 2, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('p', 'Probabilidad de quedar en el estado fundamental del oscilador final: numérica · límite brusco 2√(ω₀ω₁)/(ω₀ + ω₁) · límite adiabático 1', { hl: true });
    sim.out('e', 'Energía final ⟨H₁⟩/ħω₁ (en el instante final) · adiabático: ½ (invariante E/ω) · brusco: (ω₀² + ω₁²)/(4ω₀ω₁)');
    const NB = 28; let cache = {};
    const evolveHO = (r, tau) => {
      const w0 = 1, w1 = r, Xm = EM.P.la.zeros(NB), Dm = EM.P.la.zeros(NB);
      for (let n = 0; n < NB - 1; n++) { Xm[n][n + 1] = Xm[n + 1][n] = Math.sqrt((n + 1) / 2); Dm[n + 1][n] = Math.sqrt(n + 1); Dm[n][n + 1] = -Math.sqrt(n + 1); }
      const X2 = EM.P.la.matmul(Xm, Xm), DD = EM.P.la.matmul(Dm, Dm), P2 = DD.map((row) => Array.from(row, (x) => -0.5 * x));
      const Hf = (t) => { const wt = w0 + (w1 - w0) * Math.min(1, Math.max(0, t / tau)), re = EM.P.la.zeros(NB); for (let i = 0; i < NB; i++) for (let j = 0; j < NB; j++) re[i][j] = 0.5 * P2[i][j] + 0.5 * wt * wt * X2[i][j]; return { re, im: EM.P.la.zeros(NB) }; };
      /* ħ = m = 1, ω₀ = 1 → X = (a + a†)/√2, P² = −½(a† − a)² */
      const psi0 = { re: new Float64Array(NB), im: new Float64Array(NB) }; psi0.re[0] = 1;
      const steps = Math.max(400, Math.ceil(tau * 200)), psi = EM.qm.tdep.evolve(Hf, psi0, 0, tau, steps);
      /* estado fundamental del oscilador final (ω₁) en la base de ω₀: gaussiano comprimido; se calcula como el vector propio de menor energía de H(t = τ) */
      const Hfin = Hf(tau).re, eg = EM.P.la.eigh(Hfin), g0 = Array.from({ length: NB }, (_, i) => eg.vectors[i][0]);
      let ar = 0, ai = 0; for (let i = 0; i < NB; i++) { ar += g0[i] * psi.re[i]; ai += g0[i] * psi.im[i]; }
      let E = 0; for (let i = 0; i < NB; i++) for (let j = 0; j < NB; j++) E += psi.re[i] * Hfin[i][j] * psi.re[j] + psi.im[i] * Hfin[i][j] * psi.im[j];
      return { P0: ar * ar + ai * ai, E: E / w1 };
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, r = sim.p.r, tau = sim.p.tau, key = r + '|' + tau;
      if (!cache[key]) cache[key] = evolveHO(r, tau);
      EM.draw.clear(cv);
      const taus = [0.05, 0.1, 0.2, 0.5, 1, 2, 4, 8, 16, 32], k2 = 'curve|' + r; if (!cache[k2]) cache[k2] = taus.map((t) => evolveHO(r, t).P0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: Math.log10(0.05), xmax: Math.log10(32), ymin: 0, ymax: 1.05, xlabel: 'log₁₀ τ (duración de la rampa de frecuencia, en 1/ω₀)', ylabel: 'P(estado fundamental final)', ml: 56, mr: 12, title: 'De brusco a adiabático: el estado fundamental se conserva si el cambio es lento' });
      pl.frame(); const sud = (2 * Math.sqrt(r)) / (1 + r); pl.hline(sud, { color: '--c2', dash: [5, 4], label: 'límite brusco', labelRight: true }); pl.hline(1, { color: '--ink-3', dash: [3, 4], label: 'adiabático', labelRight: true });
      pl.xy(taus.map(Math.log10), cache[k2], { color: '--accent', width: 2.2 }); taus.forEach((t, i) => pl.dot(Math.log10(t), cache[k2][i], { color: '--accent', r: 3.4 })); pl.dot(Math.log10(tau), cache[key].P0, { color: '--c3', r: 6 });
      sim.set('p', `${EM.fix(cache[key].P0, 5)} · ${EM.fix(sud, 5)} · 1`);
      sim.set('e', `${EM.fix(cache[key].E, 4)} · ½ · ${EM.fix((1 + r * r) / (4 * r), 4)}`);
    });
  });
})();
