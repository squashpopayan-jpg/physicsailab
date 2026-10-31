/* Capítulo 17 — Partículas cargadas en campos electromagnéticos */
(function () {
  'use strict';
  const EM = window.EM, MG = EM.qm.mag, K = MG.K, M = EM.M, PI = Math.PI;
  const RK = K.h / (K.e * K.e); /* h/e² = 25 812.807 Ω */

  /* 17.1 Niveles de Landau */
  EM.defineSim('landau', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('B', { label: 'Campo magnético B (tesla)', min: 0.1, max: 30, step: 0.01, value: 5, log: true, fmt: (v) => EM.fix(v, 2) + ' T' });
    sim.slider('m', { label: 'Masa efectiva m*/mₑ (GaAs: 0.067; electrón libre: 1)', min: 0.02, max: 1, step: 0.001, value: 0.067, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('n', { label: 'Nivel de Landau mostrado n', min: 0, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'Posición del centro de la órbita x₀/ℓ (índice k de la gauge de Landau)', min: -3, max: 3, step: 0.1, value: 0, fmt: (v) => EM.fix(v, 1) });
    sim.out('w', 'Frecuencia ciclotrón ω<sub>c</sub> = <i>eB</i>/<i>m</i>* y energía ħω<sub>c</sub> (meV) · <i>E</i><sub>n</sub> = ħω<sub>c</sub>(<i>n</i> + ½)', { hl: true });
    sim.out('l', 'Longitud magnética ℓ = √(ħ/<i>eB</i>) (nm) · radio clásico de la órbita en este nivel <i>r</i> = ℓ√(2<i>n</i> + 1) (nm)');
    sim.out('d', 'Degeneración por unidad de área de cada nivel <i>eB</i>/<i>h</i> (µm⁻²) · una por cada cuanto de flujo h/<i>e</i>');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, B = sim.p.B, mr = sim.p.m, m = mr * K.me, n = Math.round(sim.p.n), ell = MG.ell(B), wc = MG.wc(B, m), Ew = (K.hbar * wc) / K.e * 1e3; /* meV */
      EM.draw.clear(cv);
      const xr = 4.2; /* en unidades de ℓ */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -xr - 1, xmax: xr + 1, ymin: 0, ymax: 7.5, xlabel: '(x − x₀)/ℓ  (la parábola es el potencial efectivo ½ m ω_c² (x − x₀)²)', ylabel: 'E / ħω_c', ml: 54, mr: 10, title: 'Un estado de Landau: oscilador armónico desplazado' });
      pl.frame(); const x0 = sim.p.k;
      pl.fn((x) => 0.5 * (x - x0) ** 2, { color: '--ink-3', width: 1.8 });
      for (let j = 0; j <= 6; j++) pl.hline(j + 0.5, { color: j === n ? '--accent' : '--ink-3', dash: j === n ? null : [3, 4], width: j === n ? 2 : 1 });
      /* densidad |ψ_n|² elevada a su nivel */
      const xs = [], ys = []; let mx = 0; for (let i = 0; i <= 400; i++) { const x = -xr - 1 + ((2 * xr + 2) * i) / 400, p = MG.psi(n, x, x0, 1) ** 2; xs.push(x); ys.push(p); mx = Math.max(mx, p); }
      pl.xy(xs, ys.map((p) => n + 0.5 + (p / mx) * 0.9), { color: '--accent', width: 2.2 });
      pl.dot(x0, 0.0, { color: '--c2', r: 5 });
      /* panel derecho: espectro frente a B */
      const q = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: 0, xmax: 30, ymin: 0, ymax: Math.max(20, 6.5 * ((K.hbar * MG.wc(30, m)) / K.e * 1e3)), xlabel: 'B (T)', ylabel: 'E (meV)', ml: 50, mr: 8, title: 'Abanico de Landau' });
      q.frame(); for (let j = 0; j <= 4; j++) q.fn((b) => ((K.hbar * MG.wc(Math.max(b, 1e-3), m)) / K.e) * 1e3 * (j + 0.5), { color: j === n ? '--accent' : '--c1', width: j === n ? 2.4 : 1.2 });
      q.vline(B, { color: '--c2', dash: [3, 3] });
      sim.set('w', `${EM.sci(wc, 4)} rad/s · ${EM.fix(Ew, 4)} meV · ${EM.fix(Ew * (n + 0.5), 4)} meV (n = ${n})`);
      sim.set('l', `${EM.fix(ell * 1e9, 3)} nm · ${EM.fix(ell * 1e9 * Math.sqrt(2 * n + 1), 3)} nm`);
      sim.set('d', `${EM.fix(MG.degArea(B) * 1e-12, 3)} µm⁻² · una por cada ${EM.fix(MG.phi0() * 1e15, 4)} fWb`);
    });
  });

  /* 17.2 Efecto Aharonov–Bohm */
  EM.defineSim('ab-flujo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('B', { label: 'Campo magnético dentro del solenoide B (mT; el campo es nulo fuera)', min: 0, max: 20, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) + ' mT' });
    sim.slider('a', { label: 'Radio del solenoide (µm)', min: 0.1, max: 2, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) + ' µm' });
    sim.slider('lam', { label: 'Longitud de onda de los electrones (pm)', min: 5, max: 100, step: 0.5, value: 50, fmt: (v) => EM.fix(v, 1) + ' pm' });
    sim.out('f', 'Flujo Φ = <i>B</i>π<i>a</i>² (fWb) · en unidades de h/<i>e</i> = 4.1357 fWb', { hl: true });
    sim.out('p', 'Diferencia de fase entre los dos caminos 2πΦ/Φ₀ · desplazamiento de las franjas en fracciones de interfranja');
    sim.out('i', 'Periodicidad: las franjas se repiten cuando Φ aumenta en h/<i>e</i> · campo necesario para un cuanto con este radio');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, Phi = p.B * 1e-3 * PI * (p.a * 1e-6) ** 2, nq = Phi / MG.phi0();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -3, xmax: 3, ymin: 0, ymax: 1.1, xlabel: 'posición en la pantalla (interfranjas)', ylabel: 'intensidad normalizada', ml: 54, mr: 10, title: 'Dos rendijas con un solenoide entre ellas' });
      pl.frame(); pl.fn((x) => Math.cos(PI * x) ** 2, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.fn((x) => MG.abPattern(x, 1, 1, 1, nq), { color: '--accent', width: 2.4 }); pl.vline(0, { color: '--axis' });
      pl.legend([{ label: 'sin flujo', color: '--ink-3', dash: [5, 4] }, { label: 'con flujo Φ', color: '--accent' }], 'tr');
      /* esquema */
      const sx = W * 0.8, sy = H * 0.5, rr = Math.min(W * 0.05, H * 0.08);
      ctx.save(); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.fillStyle = EM.alpha('--c3', 0.4 + Math.min(0.5, nq * 0.15)); ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 2 * PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; for (const dy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W * 0.66, sy + dy * H * 0.34); ctx.quadraticCurveTo(sx - rr * 2, sy + dy * (rr * 2), W * 0.95, sy + dy * H * 0.05); ctx.stroke(); } ctx.restore();
      EM.text(ctx, 'B ≠ 0 dentro', sx, sy + 4, { size: 11, align: 'center', color: '--ink' }); EM.text(ctx, 'B = 0 fuera: los electrones nunca pasan por el campo', (W * 0.66 + W * 0.98) / 2, H * 0.1, { size: 11, align: 'center', color: '--ink-3' });
      const frac = ((nq + 0.5) % 1 + 1) % 1 - 0.5;
      sim.set('f', `${EM.fix(Phi * 1e15, 4)} fWb · ${EM.fix(nq, 4)} Φ₀`);
      sim.set('p', `${EM.fix(MG.abPhase(nq), 4)} rad (${EM.fix(M.deg(MG.abPhase(nq)), 2)}°) · ${EM.fix(nq, 4)} (módulo 1: ${EM.fix(frac, 4)})`);
      sim.set('i', `la figura se repite cada Φ₀ · B = ${EM.fix((MG.phi0() / (PI * (p.a * 1e-6) ** 2)) * 1e3, 3)} mT`);
    });
  });

  /* 17.3 Efecto Hall cuántico entero (modelo) */
  EM.defineSim('hall-ent', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('ne', { label: 'Densidad de electrones nₑ (10¹⁵ m⁻² = 10¹¹ cm⁻²)', min: 0.5, max: 8, step: 0.05, value: 3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('w', { label: 'Anchura de la zona de estados extendidos (desorden) w', min: 0.01, max: 0.2, step: 0.005, value: 0.05, fmt: (v) => EM.fix(v, 3) });
    sim.slider('B', { label: 'Campo magnético B (tesla)', min: 0.3, max: 14, step: 0.01, value: 6, fmt: (v) => EM.fix(v, 2) + ' T' });
    sim.out('v', 'Factor de llenado ν = <i>n</i><sub>e</sub><i>h</i>/<i>eB</i> · ν<sub>T</sub> (niveles que transportan corriente)', { hl: true });
    sim.out('r', 'Resistencia Hall ρ<sub>xy</sub> en kΩ (cuantizada) y clásica <i>B</i>/<i>n</i><sub>e</sub><i>e</i> · <i>h</i>/<i>e</i>² = 25.8128 kΩ');
    sim.out('x', 'Resistividad longitudinal (unidades arbitrarias): nula en las mesetas, picos en los centros de nivel');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, ne = sim.p.ne * 1e15, w = sim.p.w, Bmax = 14, N = 560;
      EM.draw.clear(cv);
      const Bs = [], rxy = [], rcl = [], rxx = []; let rxxMax = 1e-9;
      for (let i = 0; i <= N; i++) { const B = 0.3 + ((Bmax - 0.3) * i) / N, nu = MG.filling(ne, B), h = MG.hallModel(nu, w); Bs.push(B); rxy.push(Math.min(h.rxy * RK / 1e3, 60)); rcl.push(Math.min(RK / nu / 1e3, 60)); rxx.push(h.rxx); rxxMax = Math.max(rxxMax, h.rxx); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Bmax, ymin: 0, ymax: 40, xlabel: 'B (T)', ylabel: 'resistencia (kΩ)', ml: 56, mr: 10, title: 'Meseta de Hall: ρ_xy = h/νe²' });
      pl.frame(); pl.xy(Bs, rcl, { color: '--ink-3', width: 1.4, dash: [5, 4] }); pl.xy(Bs, rxy, { color: '--accent', width: 2.4 }); pl.xy(Bs, rxx.map((r) => (r / rxxMax) * 12), { color: '--c2', width: 1.6 });
      for (let k = 1; k <= 6; k++) pl.hline(RK / k / 1e3, { color: '--ink-3', dash: [2, 5], width: 0.8 });
      pl.vline(sim.p.B, { color: '--c3', dash: [3, 3] });
      pl.legend([{ label: 'ρxy clásica B/(n e)', color: '--ink-3', dash: [5, 4] }, { label: 'ρxy con mesetas', color: '--accent' }, { label: 'ρxx (picos)', color: '--c2' }], 'tr');
      const nu = MG.filling(ne, sim.p.B), h = MG.hallModel(nu, w);
      sim.set('v', `${EM.fix(nu, 4)} · ${EM.fix(h.nuT, 4)}`);
      sim.set('r', `${EM.fix(h.rxy * RK / 1e3, 4)} kΩ · ${EM.fix((RK / nu) / 1e3, 4)} kΩ`);
      sim.set('x', `${EM.fix(h.rxx / rxxMax, 4)} (relativa al pico máximo)`);
    });
  });
})();
