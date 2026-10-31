/* Capítulo 4 — Operadores, observables y postulados */
(function () {
  'use strict';
  const EM = window.EM, W = EM.qm.wave;

  /* 4.1 Desarrollo de una función de onda en los estados de energía de la caja: probabilidades de medir E_n */
  const SHAPES = {
    par: ['Parábola  x(1 − x)', (x) => x * (1 - x)],
    tri: ['Triángulo con pico en 1/2', (x) => (x < 0.5 ? x : 1 - x)],
    rect: ['Pulso rectangular  0.4 < x < 0.6', (x) => (x > 0.4 && x < 0.6 ? 1 : 0)],
    gauss: ['Gaussiana descentrada  x₀ = 0.3, σ = 0.07', (x) => Math.exp(-((x - 0.3) ** 2) / (2 * 0.07 * 0.07))],
    mix: ['Mezcla  ψ₂ + 0.5 ψ₅', (x) => Math.sin(2 * Math.PI * x) + 0.5 * Math.sin(5 * Math.PI * x)],
    seno: ['Estado propio  ψ₃', (x) => Math.sin(3 * Math.PI * x)]
  };
  EM.defineSim('expansion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Función de onda inicial en la caja 0 < x < 1', options: Object.entries(SHAPES).map(([k, v]) => [k, v[0]]), value: 'par' });
    sim.slider('N', { label: 'Número de términos en el desarrollo', min: 1, max: 40, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.out('c1', 'Probabilidades |<i>c</i><sub>n</sub>|² de medir <i>E</i><sub>1</sub>, <i>E</i><sub>2</sub>, <i>E</i><sub>3</sub>, <i>E</i><sub>4</sub>', { hl: true });
    sim.out('norm', 'Σ|<i>c</i><sub>n</sub>|² con los términos usados · error cuadrático ‖ψ − ψ<sub>N</sub>‖²');
    sim.out('E', '⟨<i>E</i>⟩ = Σ|<i>c</i><sub>n</sub>|²<i>E</i><sub>n</sub> (en unidades de <i>E</i><sub>1</sub>) · ⟨<i>E</i>⟩ directa = ∫ψ*Ĥψ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, f = SHAPES[p.f][1], M = 2000, NM = 60, nT = Math.round(p.N);
      EM.draw.clear(cv);
      const xs = Array.from({ length: M + 1 }, (_, i) => i / M), raw = xs.map(f);
      const wS = (i) => (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) / (3 * M); /* Simpson */
      let nn = 0; for (let i = 0; i <= M; i++) nn += wS(i) * raw[i] * raw[i];
      const psi = raw.map((v) => v / Math.sqrt(nn));
      const c = Array.from({ length: NM }, (_, k) => { let s = 0; for (let i = 0; i <= M; i++) s += wS(i) * psi[i] * Math.SQRT2 * Math.sin((k + 1) * Math.PI * xs[i]); return s; });
      const rec = xs.map((x) => { let s = 0; for (let k = 0; k < nT; k++) s += c[k] * Math.SQRT2 * Math.sin((k + 1) * Math.PI * x); return s; });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.55, h: cv.h, xmin: 0, xmax: 1, ymin: -Math.max(...psi) * 0.4, ymax: Math.max(...psi) * 1.35, xlabel: 'x / L', ylabel: 'ψ(x)', ml: 46, mr: 8, title: 'Función y reconstrucción' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(xs, psi, { color: '--c1', width: 2.4 }); pl.xy(xs, rec, { color: '--accent', width: 2, dash: [5, 3] });
      pl.legend([{ label: 'ψ exacta', color: '--c1' }, { label: `serie con ${nT} términos`, color: '--accent', dash: [5, 3] }], 'tr');
      const P = c.map((v) => v * v), mx = Math.max(...P.slice(0, 20), 1e-9);
      const pb = new EM.Plot(ctx, { x: cv.w * 0.58, y: 0, w: cv.w * 0.42, h: cv.h, xmin: 0.4, xmax: 12.6, ymin: 0, ymax: mx * 1.15, xlabel: 'estado n', ylabel: 'probabilidad |c_n|²', ml: 52, mr: 8, title: 'Resultados posibles de medir E' });
      pb.frame(); for (let k = 0; k < 12; k++) pb.path([[k + 1, 0], [k + 1, P[k]]], { color: k < nT ? '--accent' : '--ink-3', width: 8 });
      const used = P.slice(0, nT).reduce((a, b) => a + b, 0), err = rec.reduce((s, v, i) => s + wS(i) * (psi[i] - v) ** 2, 0);
      const Ec = P.slice(0, NM).reduce((s, v, k) => s + v * (k + 1) ** 2, 0);
      let Ed = 0; for (let i = 1; i <= M; i++) { const d = (psi[i] - psi[i - 1]) * M; Ed += d * d / M; } Ed = Ed / (Math.PI * Math.PI); /* ⟨E⟩/E₁ = ∫ψ′²/π² con E₁ = π²/2 y ⟨E⟩ = ½∫ψ′² */
      sim.set('c1', P.slice(0, 4).map((v) => EM.fix(100 * v, 3) + ' %').join(' · '));
      sim.set('norm', `${EM.fix(used, 5)} · ${EM.sci(err, 3)}`);
      sim.set('E', p.f === 'rect' ? 'diverge (el pulso con bordes abruptos tiene ⟨E⟩ = ∞) · ∞' : `${EM.fix(Ec, 4)} (primeros 60 términos) · ${EM.fix(Ed, 4)}`);
    });
  });

  /* 4.2 Medidas repetidas de la energía: histograma frente a |c_n|² y colapso */
  EM.defineSim('medida', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a1', { label: 'Peso del estado n = 1', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('a2', { label: 'Peso del estado n = 2', min: 0, max: 1, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('a3', { label: 'Peso del estado n = 3', min: 0, max: 1, step: 0.01, value: 0.2, fmt: (v) => EM.fix(v, 2) });
    sim.out('P', 'Probabilidades teóricas |<i>c</i><sub>n</sub>|² (los pesos se normalizan a 1)', { hl: true });
    sim.out('N', 'Medidas hechas · frecuencias observadas');
    sim.out('re', 'Segunda medida inmediata sobre el estado colapsado: coincide con la primera (de las últimas 1000 repeticiones)');
    sim.out('E', 'Energía media observada · ⟨<i>E</i>⟩ teórica (en unidades de <i>E</i><sub>1</sub>)');
    let cnt = [0, 0, 0], tot = 0, same = 0, pairs = 0, last = -1;
    const probs = () => { const a = [sim.p.a1, sim.p.a2, sim.p.a3], s = a.reduce((x, y) => x + y, 0) || 1; return a.map((v) => v / s); };
    const draw1 = () => { const P = probs(), u = Math.random(); let k = 0, acc = P[0]; while (u > acc && k < 2) { k++; acc += P[k]; } return k; };
    const meas = (n) => { for (let i = 0; i < n; i++) { const k = draw1(); cnt[k]++; tot++; last = k; pairs++; same++; /* tras el colapso, el estado es ψ_k: la segunda medida da k con probabilidad 1 */ } };
    const reset = () => { cnt = [0, 0, 0]; tot = 0; same = 0; pairs = 0; };
    sim.resetButton(reset);
    sim.onChange = reset;
    sim.button('Medir 10 veces', () => meas(10));
    sim.button('Medir 1000 veces', () => meas(1000));
    sim.animate(() => { if (tot < 200000) meas(25); });
    sim.onDraw(() => {
      const ctx = cv.ctx, P = probs();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 3.6, ymin: 0, ymax: Math.min(1, Math.max(...P, ...cnt.map((c) => (tot ? c / tot : 0))) * 1.25 + 0.05), xlabel: 'energía medida E_n = n² E₁', ylabel: 'probabilidad', ml: 52, mr: 12 });
      pl.frame();
      P.forEach((q, i) => { pl.path([[i + 1 - 0.12, 0], [i + 1 - 0.12, q]], { color: '--c1', width: 22 }); pl.path([[i + 1 + 0.14, 0], [i + 1 + 0.14, tot ? cnt[i] / tot : 0]], { color: '--accent', width: 22 }); if (tot > 0) { const f = cnt[i] / tot, e = Math.sqrt(f * (1 - f) / tot); pl.path([[i + 1 + 0.14, Math.max(0, f - e)], [i + 1 + 0.14, f + e]], { color: '--ink', width: 1.6 }); } });
      pl.legend([{ label: '|c_n|² (mecánica cuántica)', color: '--c1', kind: 'sq' }, { label: `frecuencia observada (N = ${tot})`, color: '--accent', kind: 'sq' }], 'tr');
      sim.set('P', P.map((q) => EM.fix(q, 4)).join(' · '));
      sim.set('N', `${tot} · ${cnt.map((c) => (tot ? EM.fix(c / tot, 4) : '—')).join(' · ')}`);
      sim.set('re', pairs ? `${same} de ${pairs} (100 %)` : '—');
      const Em = tot ? cnt.reduce((s, c, i) => s + c * (i + 1) ** 2, 0) / tot : NaN, Et = P.reduce((s, q, i) => s + q * (i + 1) ** 2, 0);
      sim.set('E', `${tot ? EM.fix(Em, 3) : '—'} · ${EM.fix(Et, 3)}`);
    });
  });

  /* 4.3 Teorema de Ehrenfest: el valor esperado frente a la trayectoria clásica */
  const POT = {
    arm: ['Armónico  V = x²/2', (x) => 0.5 * x * x, (x) => x, -14, 14],
    qua: ['Anarmónico  V = x²/2 + 0.25 x⁴', (x) => 0.5 * x * x + 0.25 * x ** 4, (x) => x + x ** 3, -12, 12],
    mor: ['Morse  V = 6 (1 − e^{−x/2})²', (x) => 6 * (1 - Math.exp(-x / 2)) ** 2, (x) => 6 * (1 - Math.exp(-x / 2)) * Math.exp(-x / 2), -10, 50],
    lin: ['Lineal  V = |x|', (x) => Math.abs(x), (x) => Math.sign(x), -14, 14]
  };
  EM.defineSim('ehrenfest', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('v', { label: 'Potencial', options: Object.entries(POT).map(([k, v]) => [k, v[0]]), value: 'qua' });
    sim.slider('x0', { label: 'Posición inicial del paquete x₀', min: 0.5, max: 4, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('s', { label: 'Anchura inicial σ', min: 0.25, max: 1.5, step: 0.05, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('x', '⟨<i>x</i>⟩ cuántico · <i>x</i> clásico (misma posición y momento iniciales)', { hl: true });
    sim.out('F', 'Fuerza media ⟨−<i>V</i>′(<i>x</i>)⟩ · fuerza clásica −<i>V</i>′(⟨<i>x</i>⟩): Ehrenfest exige que sean distintas si <i>V</i>′ no es lineal');
    sim.out('E', 'Energía ⟨<i>E</i>⟩ (conservada) · Δ<i>x</i> · Δ<i>p</i> · norma');
    const N = 1024; let xs, op, re, im, tt, hist, cl, pot;
    const setup = () => {
      pot = POT[sim.p.v]; const [, V, dV, a, b] = pot;
      xs = Float64Array.from({ length: N }, (_, i) => a + ((b - a) * i) / N);
      op = new W.SplitOp(xs, V, 0.01);
      [re, im] = W.gaussFree(xs, 0, sim.p.x0, sim.p.s, 0); re = Float64Array.from(re); im = Float64Array.from(im);
      tt = 0; hist = []; cl = [sim.p.x0, 0];
    };
    setup(); sim.onChange = setup; sim.resetButton(setup);
    const acc = (x) => -pot[2](x);
    sim.animate(() => {
      for (let s = 0; s < 3; s++) { op.step(re, im); /* clásico: velocity Verlet */ const h = 0.01; cl[1] += 0.5 * h * acc(cl[0]); cl[0] += h * cl[1]; cl[1] += 0.5 * h * acc(cl[0]); tt += h; }
      const st = W.stats(xs, re, im); hist.push([tt, st.x, cl[0]]); if (hist.length > 2000) hist.shift();
      if (tt > 60) setup();
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, [nm, V, dV, a, b] = pot, st = W.stats(xs, re, im), rho = Array.from(re, (r, i) => r * r + im[i] * im[i]);
      EM.draw.clear(cv);
      const xr = sim.p.v === 'mor' ? [-5, 22] : [-7, 7], ymax = sim.p.v === 'mor' ? 8 : sim.p.v === 'lin' ? 6 : 8;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: xr[0], xmax: xr[1], ymin: 0, ymax, xlabel: 'x', ylabel: 'V(x) y |ψ|² (escalado)', ml: 44, mr: 8, title: 'Potencial y paquete' });
      pl.frame(); pl.fn(V, { color: '--ink-2', width: 1.8, n: 400 });
      const mr = Math.max(...rho); pl.xy(Array.from(xs), rho.map((r) => (r / mr) * ymax * 0.35), { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.2 });
      pl.dot(st.x, 0, { color: '--accent', r: 5 }); pl.dot(cl[0], 0, { color: '--c2', r: 4, dy: 14, label: 'clásico' });
      const tmin = hist.length ? hist[0][0] : 0, tmax = Math.max(tmin + 20, tt);
      const pr = new EM.Plot(ctx, { x: cv.w * 0.52, y: 0, w: cv.w * 0.48, h: cv.h, xmin: tmin, xmax: tmax, ymin: xr[0] * 0.6, ymax: xr[1] * (sim.p.v === 'mor' ? 0.8 : 0.6), xlabel: 'tiempo t (ħ = m = 1)', ylabel: 'posición', ml: 44, mr: 8, title: '⟨x⟩(t) frente a x clásica' });
      pr.frame(); pr.xy(hist.map((h) => h[0]), hist.map((h) => h[2]), { color: '--c2', width: 2, dash: [5, 3] }); pr.xy(hist.map((h) => h[0]), hist.map((h) => h[1]), { color: '--accent', width: 2.6 });
      pr.legend([{ label: '⟨x⟩ (cuántico)', color: '--accent' }, { label: 'x(t) clásica', color: '--c2', dash: [5, 3] }], 'tr');
      let fq = 0, nrm = 0, E = 0; for (let i = 0; i < N; i++) { nrm += rho[i]; fq += -dV(xs[i]) * rho[i]; } fq /= nrm; const dx = xs[1] - xs[0];
      let kin = 0; for (let i = 1; i < N - 1; i++) { const d = (re[i + 1] - re[i - 1]) / (2 * dx), e = (im[i + 1] - im[i - 1]) / (2 * dx); kin += 0.5 * (d * d + e * e); } let pot_ = 0; for (let i = 0; i < N; i++) pot_ += V(xs[i]) * rho[i]; E = (kin * dx + pot_ * dx) / (nrm * dx);
      sim.set('x', `${EM.fix(st.x, 3)} · ${EM.fix(cl[0], 3)}`);
      sim.set('F', `${EM.fix(fq, 4)} · ${EM.fix(-dV(st.x), 4)}`);
      sim.set('E', `${EM.fix(E, 4)} · ${EM.fix(st.dx, 3)} · ${EM.fix(st.dp, 3)} · ${EM.fix(st.norm, 5)}`);
    });
  });
})();
