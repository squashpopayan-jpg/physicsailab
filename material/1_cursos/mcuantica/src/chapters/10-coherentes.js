/* Capítulo 10 — Estados coherentes y comprimidos */
(function () {
  'use strict';
  const EM = window.EM, HO = EM.qm.ho;

  /* 10.1 Estado coherente: un paquete que oscila sin deformarse */
  EM.defineSim('coherente', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('al', { label: 'Amplitud |α|', min: 0, max: 5, step: 0.05, value: 2.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('th', { label: 'Fase inicial de α', min: 0, max: 360, step: 5, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Número medio ⟨<i>n</i>⟩ = |α|² · dispersión Δ<i>n</i> = |α| · Δ<i>n</i>/⟨<i>n</i>⟩ = 1/|α|', { hl: true });
    sim.out('x', 'Centro del paquete ⟨ξ⟩(<i>t</i>) = √2 Re α(<i>t</i>) · ⟨π⟩ = √2 Im α(<i>t</i>) (ℓ = ħ = ω = 1)');
    sim.out('u', 'Anchura del paquete Δ<i>x</i> = ℓ/√2 (constante) · Δ<i>p</i> · producto Δ<i>x</i>Δ<i>p</i>/(ħ/2)');
    sim.out('E', '⟨<i>E</i>⟩ = ħω(|α|² + ½) · probabilidad de estar en el fundamental e^{−|α|²}');
    let t = 0; sim.resetButton(() => { t = 0; }); sim.animate((dt) => { t += dt * 1.0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, al = p.al, th = (p.th * Math.PI) / 180, aRe = al * Math.cos(th), aIm = al * Math.sin(th), xm = 9;
      EM.draw.clear(cv);
      const xs = Array.from({ length: 500 }, (_, i) => -xm + (2 * xm * i) / 499), xc = Math.SQRT2 * (aRe * Math.cos(t) + aIm * Math.sin(t)), pc = Math.SQRT2 * (-aRe * Math.sin(t) + aIm * Math.cos(t));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.58, h: cv.h, xmin: -xm, xmax: xm, ymin: 0, ymax: 0.62, xlabel: 'ξ = x/ℓ', ylabel: '|ψ|² y V(ξ)/30', ml: 46, mr: 8, title: 'El paquete y el oscilador clásico' });
      pl.frame(); pl.fn((x) => (0.5 * x * x) / 30, { color: '--ink-3', width: 1.4, n: 200 });
      pl.xy(xs, xs.map((x) => HO.cohDensity(x, aRe, aIm, t)), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.2 });
      pl.dot(xc, 0.02, { color: '--c2', r: 5 }); pl.vline(xc, { color: '--c2', dash: [3, 3] });
      const nmax = Math.ceil(al * al + 5 * Math.max(al, 1) + 4), ns = Math.min(Math.max(nmax, 12), 60), mean = al * al;
      const pb = new EM.Plot(ctx, { x: cv.w * 0.61, y: 0, w: cv.w * 0.39, h: cv.h, xmin: -0.5, xmax: ns + 0.5, ymin: 0, ymax: Math.max(0.2, ...Array.from({ length: ns + 1 }, (_, n) => HO.poisson(n, mean))) * 1.15, xlabel: 'número de cuantos n', ylabel: 'P(n) (Poisson)', ml: 44, mr: 8, title: 'Estadística de cuantos' });
      pb.frame(); for (let n = 0; n <= ns; n++) pb.path([[n, 0], [n, HO.poisson(n, mean)]], { color: '--c1', width: Math.max(2, Math.min(9, 200 / ns)) });
      sim.set('n', `${EM.fix(mean, 3)} · ${EM.fix(al, 3)} · ${al > 0 ? EM.fix(1 / al, 3) : '∞'}`);
      sim.set('x', `${EM.fix(xc, 3)} · ${EM.fix(pc, 3)}`);
      sim.set('u', `${EM.fix(Math.SQRT1_2, 4)} · ${EM.fix(Math.SQRT1_2, 4)} · 1.0000`);
      sim.set('E', `${EM.fix(mean + 0.5, 3)} ħω · ${EM.sci(Math.exp(-mean), 3)}`);
    });
  });

  /* 10.2 Estado comprimido: la elipse de incertidumbre gira en el espacio de fases */
  EM.defineSim('comprimido', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Parámetro de compresión r', min: 0, max: 2, step: 0.02, value: 0.8, fmt: (v) => EM.fix(v, 2) });
    sim.slider('ph', { label: 'Ángulo del eje comprimido en el plano de fases', min: 0, max: 180, step: 5, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('al', { label: 'Desplazamiento |α| del centro (a lo largo de ξ)', min: 0, max: 3, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.out('d', 'Compresión en dB: 10 log₁₀(σ²/σ²<sub>vacío</sub>) = −8.686 <i>r</i> (en la dirección comprimida)', { hl: true });
    sim.out('x', 'Δ<i>x</i>(<i>t</i>) · Δ<i>p</i>(<i>t</i>) (en ℓ y ħ/ℓ) en este instante · producto Δ<i>x</i>Δ<i>p</i>/(ħ/2)');
    sim.out('n', 'Número medio de cuantos sinh²<i>r</i> + |α|² · Δ<i>x</i> mínima y máxima durante un periodo');
    let t = 0; sim.resetButton(() => { t = 0; }); sim.animate((dt) => { t += dt * 1.0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, r = p.r, th = (p.ph * Math.PI) / 180, al = p.al, x0 = Math.SQRT2 * al, v = HO.squeezeCov(r, th, t), N = 120;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: -5, xmax: 5, ymin: -5, ymax: 5, xlabel: 'ξ = x/ℓ', ylabel: 'π = pℓ/ħ', ml: 40, mr: 8, title: 'Espacio de fases (σ-contornos 1 y 2)' });
      pl.frame();
      /* centro: gira según la órbita clásica */
      const xc = x0 * Math.cos(t), pc = -x0 * Math.sin(t);
      pl.fn((u) => 0, { color: '--ink-3', width: 0 });
      pl.xy(Array.from({ length: 200 }, (_, i) => x0 * Math.cos((2 * Math.PI * i) / 199)), Array.from({ length: 200 }, (_, i) => -x0 * Math.sin((2 * Math.PI * i) / 199)), { color: '--ink-3', width: 1, dash: [3, 4] });
      const det = v[0] * v[2] - v[1] * v[1];
      for (const k of [1, 2]) { const pts = [], pp = []; for (let i = 0; i < 100; i++) { const a = (2 * Math.PI * i) / 99, ux = Math.cos(a), uy = Math.sin(a); /* contorno k·σ: x = c + k L u con L L^T = v */ const l11 = Math.sqrt(v[0]), l21 = v[1] / l11, l22 = Math.sqrt(Math.max(0, v[2] - l21 * l21)); pts.push(xc + k * l11 * ux); pp.push(pc + k * (l21 * ux + l22 * uy)); } pl.xy(pts, pp, { color: k === 1 ? '--accent' : '--accent', width: k === 1 ? 2.6 : 1.4, alpha: k === 1 ? 1 : 0.5 }); }
      pl.dot(xc, pc, { color: '--c2', r: 4 });
      /* varianzas a lo largo de un periodo */
      const ts = Array.from({ length: 241 }, (_, i) => (2 * Math.PI * i) / 240), vx = ts.map((u) => Math.sqrt(HO.squeezeCov(r, th, u)[0])), vp = ts.map((u) => Math.sqrt(HO.squeezeCov(r, th, u)[2]));
      const pt = new EM.Plot(ctx, { x: cv.w * 0.53, y: 0, w: cv.w * 0.47, h: cv.h, xmin: 0, xmax: 2 * Math.PI, ymin: 0, ymax: Math.max(...vx, ...vp, 1) * 1.1, xfmt: null, xlabel: 'ωt (rad)', ylabel: 'Δx, Δp', ml: 42, mr: 8, title: 'Respiración de las incertidumbres' });
      pt.frame(); pt.hline(Math.SQRT1_2, { color: '--ink-3', label: 'vacío 1/√2', labelRight: true });
      pt.xy(ts, vx, { color: '--c1', width: 2.4 }); pt.xy(ts, vp, { color: '--c2', width: 2.4 }); pt.vline(t % (2 * Math.PI), { color: '--ink-2', dash: [2, 3] });
      pt.legend([{ label: 'Δx(t)', color: '--c1' }, { label: 'Δp(t)', color: '--c2' }], 'tr');
      sim.set('d', `${EM.fix(8.685889638 * r, 2)} dB (comprimida) · +${EM.fix(8.685889638 * r, 2)} dB en la dirección ortogonal`);
      sim.set('x', `${EM.fix(Math.sqrt(v[0]), 4)} · ${EM.fix(Math.sqrt(v[2]), 4)} · ${EM.fix(2 * Math.sqrt(det), 5)}`);
      sim.set('n', `${EM.fix(Math.sinh(r) ** 2 + al * al, 3)} · ${EM.fix(Math.min(...vx), 4)} y ${EM.fix(Math.max(...vx), 4)}`);
    });
  });

  /* 10.3 Función de Wigner: la «distribución casi-probabilidad» y sus valores negativos */
  const ST = { fock: 'Estado de Fock |n⟩', coh: 'Estado coherente |α⟩', sq: 'Vacío comprimido (r)', cate: 'Gato de Schrödinger par |α⟩ + |−α⟩', cato: 'Gato de Schrödinger impar |α⟩ − |−α⟩' };
  EM.defineSim('wigner', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('s', { label: 'Estado', options: Object.entries(ST), value: 'fock' });
    sim.slider('n', { label: 'n (Fock)', min: 0, max: 8, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('al', { label: 'α (coherente y gato; real)', min: 0, max: 3, step: 0.05, value: 1.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('r', { label: 'r (comprimido)', min: 0, max: 1.5, step: 0.02, value: 0.7, fmt: (v) => EM.fix(v, 2) });
    sim.out('w0', 'W(0, 0) · valor mínimo de W · máximo', { hl: true });
    sim.out('i', '∬ W dξ dπ (normalización) · volumen negativo δ = ∬(|W| − W)/2 (0 si W ≥ 0 en todas partes)');
    sim.out('m', 'Marginales: ∫W dπ = |ψ(ξ)|² (la proyección horizontal), ∫W dξ = |φ(π)|² (la vertical)');
    const NG = 180, L = 6;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n);
      EM.draw.clear(cv);
      const f = (xi, pi_) => p.s === 'fock' ? HO.wignerFock(n, xi, pi_) : p.s === 'coh' ? HO.wignerGauss([0.5, 0, 0.5], Math.SQRT2 * p.al, 0, xi, pi_) : p.s === 'sq' ? HO.wignerGauss(HO.squeezeCov(p.r, 0, 0), 0, 0, xi, pi_) : HO.wignerCat(p.al, p.s === 'cate' ? 1 : -1, xi, pi_);
      const g = new Float64Array(NG * NG); let mn = Infinity, mx = -Infinity, sum = 0, neg = 0; const dA = ((2 * L) / NG) ** 2;
      for (let iy = 0; iy < NG; iy++) for (let ix = 0; ix < NG; ix++) { const xi = -L + ((ix + 0.5) * 2 * L) / NG, pi_ = L - ((iy + 0.5) * 2 * L) / NG, v = f(xi, pi_); g[iy * NG + ix] = v; mn = Math.min(mn, v); mx = Math.max(mx, v); sum += v * dA; if (v < 0) neg += -v * dA; }
      const sc = Math.max(Math.abs(mn), Math.abs(mx)), sz = Math.min(W * 0.48, H - 30), x0 = W * 0.02, y0 = (H - sz) / 2;
      EM.heat(ctx, { x: x0, y: y0, w: sz, h: sz }, NG, NG, (ix, iy) => g[iy * NG + ix] / sc, { cmap: 'div' });
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.35); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0 + sz / 2, y0); ctx.lineTo(x0 + sz / 2, y0 + sz); ctx.moveTo(x0, y0 + sz / 2); ctx.lineTo(x0 + sz, y0 + sz / 2); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'ξ', x0 + sz - 4, y0 + sz / 2 - 6, { size: 11, color: '--ink-2', align: 'right' }); EM.text(ctx, 'π', x0 + sz / 2 + 6, y0 + 12, { size: 11, color: '--ink-2' });
      /* marginal en ξ */
      const marg = Array.from({ length: NG }, (_, ix) => { let s = 0; for (let iy = 0; iy < NG; iy++) s += g[iy * NG + ix] * (2 * L / NG); return s; });
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H * 0.5, xmin: -L, xmax: L, ymin: 0, ymax: Math.max(...marg) * 1.15, xlabel: 'ξ', ylabel: '|ψ(ξ)|²', ml: 46, mr: 8, mb: 30 });
      pl.frame(); pl.xy(marg.map((_, i) => -L + ((i + 0.5) * 2 * L) / NG), marg, { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.15 });
      const margP = Array.from({ length: NG }, (_, iy) => { let s = 0; for (let ix = 0; ix < NG; ix++) s += g[iy * NG + ix] * (2 * L / NG); return s; }).reverse();
      const pp = new EM.Plot(ctx, { x: W * 0.55, y: H * 0.5, w: W * 0.45, h: H * 0.5, xmin: -L, xmax: L, ymin: 0, ymax: Math.max(...margP) * 1.15, xlabel: 'π', ylabel: '|φ(π)|²', ml: 46, mr: 8, mb: 30 });
      pp.frame(); pp.xy(margP.map((_, i) => -L + ((i + 0.5) * 2 * L) / NG), margP, { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.15 });
      sim.set('w0', `${EM.fix(f(0, 0), 4)} (= ${EM.fix(f(0, 0) * Math.PI, 3)}/π) · ${EM.fix(mn, 4)} · ${EM.fix(mx, 4)}`);
      sim.set('i', `${EM.fix(sum, 4)} · ${EM.fix(neg, 4)}`);
      sim.set('m', 'ambos marginales son densidades de probabilidad ≥ 0, aunque W tome valores negativos');
    });
  });
})();
