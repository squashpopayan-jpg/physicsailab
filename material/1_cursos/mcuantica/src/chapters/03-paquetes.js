/* Capítulo 3 — Paquetes de onda, Fourier e incertidumbre */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K, W = EM.qm.wave;
  const ANG = 1e-10;

  /* 3.1 Paquete gaussiano libre: ensanchamiento y velocidad de grupo (solución exacta) */
  const PART = { e: ['Electrón', K.me], p: ['Protón', K.mp], Ar: ['Átomo de argón', 39.948 * K.u], C60: ['Molécula de C₆₀', 720.642 * K.u] };
  EM.defineSim('paquete', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Partícula', options: Object.entries(PART).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('s0', { label: 'Anchura inicial σ₀', min: 0.2, max: 5, step: 0.05, value: 1, unit: 'Å', fmt: (v) => EM.fix(v, 2) });
    sim.slider('k0', { label: 'Número de onda medio k₀σ₀ (momento ⟨p⟩ = ħk₀)', min: -6, max: 6, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.slider('t', { label: 'Tiempo t / t*, con t* = 2mσ₀²/ħ', min: 0, max: 5, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('ts', 'Tiempo de ensanchamiento <i>t</i>* = 2<i>m</i>σ₀²/ħ · tiempo transcurrido', { hl: true });
    sim.out('sg', 'Anchura σ(<i>t</i>) = σ₀√(1 + (<i>t</i>/<i>t</i>*)²) · cociente σ/σ₀');
    sim.out('dp', 'Δ<i>p</i> = ħ/2σ₀ (no cambia) · producto Δ<i>x</i>Δ<i>p</i>/(ħ/2)');
    sim.out('vg', 'Velocidad de grupo ħ<i>k</i>₀/<i>m</i> · velocidad de fase ħ<i>k</i>₀/2<i>m</i> · desplazamiento del centro');
    let tt = 0;
    sim.resetButton(() => { tt = 0; sim.ctl.t.set(0, true); });
    sim.animate((dt) => { tt = (sim.p.t + dt * 0.35) % 5; sim.ctl.t.set(tt, true); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W_ = cv.w, H = cv.h, m = PART[p.m][1], s0 = p.s0 * ANG, tstar = (2 * m * s0 * s0) / K.hbar, k0 = p.k0;
      /* Unidades: ħ = m = σ₀ = 1 → t* = 2 */
      const tau = p.t * 2, N = 1024, X0 = -10, X1 = 28, xs = Float64Array.from({ length: N }, (_, i) => X0 + ((X1 - X0) * i) / (N - 1));
      EM.draw.clear(cv);
      const [re, im] = W.gaussFree(xs, tau, 0, 1, k0, 1, 1);
      const rho = Array.from(re, (a, i) => a * a + im[i] * im[i]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W_ * 0.64, h: H, xmin: X0, xmax: X1, ymin: -0.8, ymax: 0.8, xlabel: 'posición x / σ₀', ylabel: 'Re ψ y |ψ|²  (σ₀ = 1)', ml: 50, mr: 8, title: 'Espacio de posiciones' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(Array.from(xs), Array.from(re), { color: '--c1', width: 1.4 });
      pl.xy(Array.from(xs), rho, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.15 });
      pl.vline(k0 * tau, { color: '--c3', dash: [4, 3], label: 'centro (x = v_g t)', labelY: 14 });
      pl.dot((k0 * tau) / 2, 0, { color: '--c2', label: 'cresta (v_f)', dy: 16 });
      const pk = new EM.Plot(ctx, { x: W_ * 0.67, y: 0, w: W_ * 0.33, h: H, xmin: -8, xmax: 8, ymin: 0, ymax: 0.9, xlabel: 'número de onda kσ₀', ylabel: '|φ(k)|²', ml: 44, mr: 8, title: 'Espacio de momentos' });
      pk.frame();
      pk.fn((k) => Math.sqrt(2 / Math.PI) * 2 * Math.exp(-2 * (k - k0) * (k - k0)) * 0.5, { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.14 });
      pk.label(k0 + 0.4, 0.75, 'no cambia con t', { size: 11, color: '--ink-3' });
      const f = Math.sqrt(1 + (p.t) * (p.t)), sphys = p.s0 * f, dpphys = K.hbar / (2 * s0), vg = (K.hbar * k0) / (s0 * m);
      sim.set('ts', `${EM.sci(tstar, 3)} s · ${EM.sci(p.t * tstar, 3)} s`);
      sim.set('sg', `${EM.fix(sphys, 3)} Å · ${EM.fix(f, 3)}`);
      sim.set('dp', `${EM.sci(dpphys, 3)} kg·m/s · ${EM.fix(f, 3)}`);
      sim.set('vg', `${EM.sci(vg, 3)} m/s · ${EM.sci(vg / 2, 3)} m/s · ${EM.sci(vg * p.t * tstar * 1e10, 3)} Å`);
    });
  });

  /* 3.2 Pares de Fourier: anchura en x y en k */
  const SH = {
    gauss: ['Gaussiana  e^{−x²/4a²}', (x, a) => Math.exp(-(x * x) / (4 * a * a)), 0.5],
    sech: ['Secante hiperbólica  sech(x/a)', (x, a) => 1 / Math.cosh(x / a), Math.PI / 6],
    exp: ['Exponencial  e^{−|x|/a}', (x, a) => Math.exp(-Math.abs(x) / a), Math.SQRT1_2],
    tri: ['Triangular  1 − |x|/a', (x, a) => Math.max(0, 1 - Math.abs(x) / a), Math.sqrt(0.3)],
    rect: ['Rectangular  |x| < a', (x, a) => (Math.abs(x) < a ? 1 : 0), Infinity]
  };
  EM.defineSim('fourier', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Forma de ψ(x)', options: Object.entries(SH).map(([k, v]) => [k, v[0]]), value: 'gauss' });
    sim.slider('a', { label: 'Parámetro de anchura a', min: 0.3, max: 3, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('dx', 'Δ<i>x</i> (de |ψ|²) · Δ<i>k</i> (de |φ|²)', { hl: true });
    sim.out('pr', 'Producto Δ<i>x</i>Δ<i>k</i> (mínimo posible ½) · valor exacto de la forma');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, f, exact] = SH[p.f], N = 2049, L = 30, dx = (2 * L) / (N - 1), xs = Float64Array.from({ length: N }, (_, i) => -L + i * dx);
      EM.draw.clear(cv);
      const re = Float64Array.from(xs, (x) => f(x, p.a)), im = new Float64Array(N);
      /* momentos con una malla fina propia (los vértices de las formas con picos exigen paso pequeño) */
      const NF = 40001, LF = 20, dF = (2 * LF) / (NF - 1); let n = 0, m2 = 0, d2 = 0, prev = f(-LF, p.a);
      for (let i = 1; i < NF; i++) { const x = -LF + i * dF, v = f(x, p.a), d = (v - prev) / dF, xm = x - dF / 2, vm = 0.5 * (v + prev); n += vm * vm; m2 += xm * xm * vm * vm; d2 += d * d; prev = v; }
      const Dx = Math.sqrt(m2 / n), Dk = Math.sqrt(d2 / n);
      n = 0; for (let i = 0; i < N; i++) n += re[i] * re[i];
      const nrm = 1 / Math.sqrt(n * dx);
      const ks = Array.from({ length: 321 }, (_, i) => -8 / p.a + (16 / p.a) * i / 320), [pr, pi] = W.ft(xs, re.map((v) => v * nrm), im, ks);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: -8, xmax: 8, ymin: 0, ymax: 1.1, xlabel: 'x', ylabel: '|ψ|² (norm. al máximo)', ml: 50, mr: 8, title: 'ψ(x)' });
      pl.frame(); pl.xy(Array.from(xs), Array.from(re, (v) => v * v), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.14 });
      const mphi = Math.max(...Array.from(pr, (v, i) => v * v + pi[i] * pi[i]));
      const pk = new EM.Plot(ctx, { x: cv.w * 0.52, y: 0, w: cv.w * 0.48, h: cv.h, xmin: -8 / p.a, xmax: 8 / p.a, ymin: 0, ymax: 1.1, xlabel: 'k', ylabel: '|φ|² (norm. al máximo)', ml: 44, mr: 8, title: 'φ(k) = transformada de Fourier' });
      pk.frame(); pk.xy(ks, Array.from(pr, (v, i) => (v * v + pi[i] * pi[i]) / mphi), { color: '--c2', width: 2.6, fill: '--c2', fillAlpha: 0.14 });
      pl.label(-7.5, 1.0, `Δx = ${EM.fix(Dx, 3)}`, { size: 12, color: '--accent' }); pk.label(-7.5 / p.a, 1.0, isFinite(exact) ? `Δk = ${EM.fix(Dk, 3)}` : 'Δk = ∞', { size: 12, color: '--c2' });
      sim.set('dx', isFinite(exact) ? `${EM.fix(Dx, 4)} · ${EM.fix(Dk, 4)}` : `${EM.fix(Dx, 4)} · ∞ (la derivada tiene deltas: ⟨k²⟩ diverge)`);
      sim.set('pr', isFinite(exact) ? `${EM.fix(Dx * Dk, 4)} · ${EM.fix(exact, 4)}` : '∞');
    });
  });

  /* 3.3 Velocidad de fase y de grupo según la relación de dispersión */
  const DISP = {
    schr: ['Partícula libre  ω = ħk²/2m', (k) => (k * k) / 2, (k) => k],
    luz: ['Luz en el vacío  ω = ck', (k) => 5 * k, () => 5],
    agua: ['Ondas gravitatorias en agua profunda  ω = √(gk)', (k) => Math.sqrt(125 * Math.max(k, 0)), (k) => 0.5 * Math.sqrt(125 / Math.max(k, 1e-9))],
    cap: ['Ondas capilares  ω ∝ k^{3/2}', (k) => (5 / Math.sqrt(5)) * Math.pow(Math.max(k, 0), 1.5), (k) => 1.5 * (5 / Math.sqrt(5)) * Math.sqrt(Math.max(k, 0))]
  };
  EM.defineSim('grupo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('d', { label: 'Relación de dispersión ω(k)', options: Object.entries(DISP).map(([k, v]) => [k, v[0]]), value: 'schr' });
    sim.slider('k0', { label: 'Número de onda central k₀', min: 2, max: 8, step: 0.1, value: 5, fmt: (v) => EM.fix(v, 1) });
    sim.slider('sk', { label: 'Anchura espectral σ_k', min: 0.2, max: 1.2, step: 0.02, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('vp', 'Velocidad de fase <i>v</i><sub>f</sub> = ω/<i>k</i> · velocidad de grupo <i>v</i><sub>g</sub> = dω/d<i>k</i>', { hl: true });
    sim.out('x', 'Posición del centro del grupo · posición de una cresta que partió de x = 0');
    sim.out('dis', 'Ensanchamiento: σ(<i>t</i>)/σ(0) (la dispersión ω″ ≠ 0 ensancha el paquete)');
    let t = 0;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t = (t + dt * 0.9) % 9; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, om, vgf] = DISP[p.d], k0 = p.k0, sk = p.sk, M = Math.max(41, Math.ceil((8 * p.sk) / 0.03)), X0 = -8, X1 = 60, N = 500;
      EM.draw.clear(cv);
      const ks = Array.from({ length: M }, (_, j) => k0 + sk * (-4 + (8 * j) / (M - 1))), amp = ks.map((k) => Math.exp(-((k - k0) * (k - k0)) / (4 * sk * sk)));
      const xs = Array.from({ length: N }, (_, i) => X0 + ((X1 - X0) * i) / (N - 1)), wsum = amp.reduce((a, b) => a + b, 0);
      const re = [], env = [];
      for (const x of xs) { let sr = 0, si = 0; for (let j = 0; j < M; j++) { const ph = ks[j] * x - om(ks[j]) * t; sr += amp[j] * Math.cos(ph); si += amp[j] * Math.sin(ph); } re.push(sr / wsum); env.push(Math.hypot(sr, si) / wsum); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: X0, xmax: X1, ymin: -1.2, ymax: 1.3, xlabel: 'posición x', ylabel: 'Re ψ y envolvente |ψ|', ml: 48 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(xs, re, { color: '--c1', width: 1.5 }); pl.xy(xs, env, { color: '--accent', width: 2.6 }); pl.xy(xs, env.map((v) => -v), { color: '--accent', width: 1.2, dash: [4, 3] });
      const vp = om(k0) / k0, vg = vgf(k0);
      pl.dot(vg * t, 1.15, { color: '--accent', label: 'grupo', dy: -10 }); pl.dot(vp * t, 0, { color: '--c2', label: 'cresta', dy: 18 });
      /* anchura de la envolvente por el segundo momento de |ψ|² */
      const mom = (tt) => { let n = 0, m1 = 0, m2 = 0; for (const x of xs) { let sr = 0, si = 0; for (let j = 0; j < M; j++) { const ph = ks[j] * x - om(ks[j]) * tt; sr += amp[j] * Math.cos(ph); si += amp[j] * Math.sin(ph); } const q = sr * sr + si * si; n += q; m1 += q * x; m2 += q * x * x; } m1 /= n; return Math.sqrt(m2 / n - m1 * m1); };
      sim.set('vp', `${EM.fix(vp, 3)} · ${EM.fix(vg, 3)}  (${vg > vp * 1.01 ? 'v_g > v_f' : vg < vp * 0.99 ? 'v_g < v_f' : 'v_g = v_f'})`);
      sim.set('x', `${EM.fix(vg * t, 2)} · ${EM.fix(vp * t, 2)}`);
      sim.set('dis', EM.fix(mom(t) / mom(0), 3));
    });
  });
})();
