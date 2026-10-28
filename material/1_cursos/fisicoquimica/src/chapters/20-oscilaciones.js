/* Capítulo 20 — Oscilaciones, biestabilidad y patrones */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, O = FQ.osc;

  /* período y amplitud de una serie por máximos locales interpolados */
  const peaks = (ts, xs) => { const p = []; for (let i = 1; i < xs.length - 1; i++) if (xs[i] > xs[i - 1] && xs[i] >= xs[i + 1]) { const a = xs[i - 1], b = xs[i], c = xs[i + 1], d = a - 2 * b + c, off = d !== 0 ? (0.5 * (a - c)) / d : 0; p.push(ts[i] + off * (ts[i + 1] - ts[i])); } return p; };
  const period = (ts, xs) => { const p = peaks(ts, xs); if (p.length < 3) return null; const q = p.slice(-Math.min(p.length - 1, 5)); return (q[q.length - 1] - q[0]) / (q.length - 1); };

  /* 20.1 Lotka químico: oscilaciones conservativas */
  EM.defineSim('lotka', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('x0', { label: 'Intermediario X inicial', min: 0.1, max: 3, step: 0.05, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('y0', { label: 'Intermediario Y inicial', min: 0.1, max: 3, step: 0.05, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.slider('k1a', { label: 'k₁[A] (A + X → 2X)', min: 0.3, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('fp', 'Punto fijo (centro) <i>x</i>* = <i>k</i><sub>3</sub>/<i>k</i><sub>2</sub>, <i>y</i>* = <i>k</i><sub>1</sub>[A]/<i>k</i><sub>2</sub> · período en el límite lineal 2π/√(<i>k</i><sub>1</sub>[A]<i>k</i><sub>3</sub>)', { hl: true });
    sim.out('T', 'Período de la órbita elegida (numérico) · amplitud de X');
    sim.out('V', 'Cantidad conservada <i>V</i> = <i>k</i><sub>2</sub>(<i>x</i> + <i>y</i>) − <i>k</i><sub>3</sub>ln <i>x</i> − <i>k</i><sub>1</sub>[A]ln <i>y</i>: variación relativa en 5 períodos');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k1a = p.k1a, k2 = 1, k3 = 1;
      EM.draw.clear(cv);
      const f = O.lotkaRHS(k1a, k2, k3), T0 = (2 * Math.PI) / Math.sqrt(k1a * k3), tmax = 14 * T0, N = 1400, ts = []; for (let i = 0; i <= N; i++) ts.push((tmax * i) / N);
      const r = FQ.ode(f, [p.x0, p.y0], ts, { rtol: 1e-10, atol: 1e-12 }), xs = r.y.map((y) => y[0]), ys = r.y.map((y) => y[1]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: Math.max(...xs, ...ys) * 1.08, xlabel: 't', ylabel: 'concentración', ml: 46, title: 'Oscilaciones sin amortiguamiento' });
      pl.frame(); pl.xy(ts, xs, { color: '--c1', width: 2.4 }); pl.xy(ts, ys, { color: '--c2', width: 2.4 }); pl.legend([{ label: 'X', color: '--c1' }, { label: 'Y', color: '--c2' }], 'tr');
      const pl2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: Math.max(...xs) * 1.1, ymin: 0, ymax: Math.max(...ys) * 1.1, xlabel: 'X', ylabel: 'Y', ml: 42, mr: 8, title: 'Plano de fases' });
      pl2.frame();
      for (const s of [0.5, 0.7, 1.4, 1.8]) { const c = FQ.ode(f, [p.x0 * s * 0.6 + 0.2, p.y0 * s * 0.6 + 0.2], ts.filter((_, i) => i % 2 === 0), { rtol: 1e-8 }); pl2.xy(c.y.map((y) => y[0]), c.y.map((y) => y[1]), { color: '--grid', width: 1 }); }
      pl2.xy(xs, ys, { color: '--c4', width: 2.4 }); pl2.dot(k3 / k2, k1a / k2, { color: '--ink' }); pl2.dot(p.x0, p.y0, { color: '--accent' });
      const per = period(ts, xs), V = (i) => O.lotkaInv(k1a, k2, k3, xs[i], ys[i]), V0 = V(0); let dv = 0; for (let i = 0; i <= N; i += 7) dv = Math.max(dv, Math.abs(V(i) - V0));
      sim.set('fp', `(${EM.fix(k3 / k2, 2)}, ${EM.fix(k1a / k2, 2)}) · ${EM.fix(T0, 3)}`);
      sim.set('T', per ? EM.fix(per, 3) + ' · ' + EM.fix(Math.max(...xs) - Math.min(...xs), 2) + (Math.abs(per - T0) / T0 > 0.02 ? ' (la órbita grande oscila más despacio que el límite lineal)' : '') : '—');
      sim.set('V', EM.sci(dv / Math.abs(V0), 2) + ' (solo error numérico): el sistema no «olvida» su amplitud inicial');
    });
  });

  /* 20.2 Brusselator */
  EM.defineSim('brusselator', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('A', { label: 'Concentración de A', min: 0.5, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('B', { label: 'Concentración de B (parámetro de control)', min: 0.5, max: 8, step: 0.05, value: 3, fmt: (v) => v.toFixed(2) });
    sim.out('J', 'Punto fijo (<i>A</i>, <i>B</i>/<i>A</i>) · traza <i>B</i> − 1 − <i>A</i>² · valores propios', { hl: true });
    sim.out('H', 'Umbral de Hopf <i>B</i><sub>c</sub> = 1 + <i>A</i>² · régimen');
    sim.out('T', 'Período del ciclo límite (numérico) · período lineal 2π/<i>A</i> · amplitud de X');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = p.A, B = p.B, fp = O.brusFP(A, B), j = O.brusJac(A, B), Bc = O.brusHopf(A);
      EM.draw.clear(cv);
      const tmax = Math.max(60, (22 * 2 * Math.PI) / A), N = 1800, ts = []; for (let i = 0; i <= N; i++) ts.push((tmax * i) / N);
      const r = FQ.odeStiff(O.brusRHS(A, B), [fp[0] * 1.05 + 0.05, fp[1] * 0.95], ts, { rtol: 1e-8, atol: 1e-10 }), xs = r.y.map((y) => y[0]), ys = r.y.map((y) => y[1]), n0 = Math.floor(N / 3);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: Math.max(...xs, ...ys) * 1.08, xlabel: 't', ylabel: 'concentración', ml: 46, title: 'Evolución desde cerca del punto fijo' });
      pl.frame(); pl.xy(ts, xs, { color: '--c1', width: 2.2 }); pl.xy(ts, ys, { color: '--c2', width: 2.2 }); pl.legend([{ label: 'X', color: '--c1' }, { label: 'Y', color: '--c2' }], 'tr');
      const xm = Math.max(...xs) * 1.1, ym = Math.max(...ys) * 1.1;
      const pl2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: xm, ymin: 0, ymax: ym, xlabel: 'X', ylabel: 'Y', ml: 42, mr: 8, title: 'Plano de fases y nulclinas' });
      pl2.frame();
      pl2.xy(xs, ys, { color: '--c4', width: 2.2 });
      const xx = [], y1 = [], y2 = []; for (let i = 1; i <= 200; i++) { const x = (xm * i) / 200; xx.push(x); y1.push(((B + 1) * x - A) / (x * x)); y2.push(B / x); }
      pl2.xy(xx, y1, { color: '--ink-3', width: 1.2, dash: [4, 3] }); pl2.xy(xx, y2, { color: '--ink-3', width: 1.2, dash: [1, 3] });
      pl2.dot(fp[0], fp[1], { color: j.re > 0 ? '--c2' : '--c3', r: 5 });
      const per = period(ts.slice(n0), xs.slice(n0)), amp = Math.max(...xs.slice(n0)) - Math.min(...xs.slice(n0));
      sim.set('J', `(${EM.fix(fp[0], 2)}, ${EM.fix(fp[1], 2)}) · ${EM.fix(j.tr, 2)} · ${EM.fix(j.re, 3)}${j.im ? ' ± ' + EM.fix(j.im, 3) + ' i' : ' y ' + EM.fix(j.lam2, 3)}`);
      sim.set('H', EM.fix(Bc, 2) + ' · ' + (B > Bc ? 'punto fijo inestable: ciclo límite' : 'punto fijo estable: las oscilaciones se amortiguan'));
      sim.set('T', (B > Bc && per ? EM.fix(per, 3) : 'no hay ciclo') + ' · ' + EM.fix((2 * Math.PI) / A, 3) + ' · ' + (B > Bc ? EM.fix(amp, 2) : '—'));
    });
  });

  /* 20.3 Oregonator: la reacción de Belousov–Zhabotinsky */
  EM.defineSim('oregonator', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('f', { label: 'Parámetro estequiométrico f', min: 0.2, max: 3.2, step: 0.02, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('q', { label: 'q (adimensional: 2k₁k₄/(k₂k₃))', min: 1e-4, max: 1e-2, step: 1e-5, value: 8e-4, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('T', 'Período · amplitud del catalizador oxidado Ce⁴⁺ (<i>z</i>) · salto de [Br⁻] en el ciclo', { hl: true });
    sim.out('reg', 'Régimen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, eps = 0.04, epsp = 4e-4;
      EM.draw.clear(cv);
      const tmax = 40, N = 2400, ts = []; for (let i = 0; i <= N; i++) ts.push((tmax * i) / N);
      const r = FQ.odeStiff(O.oregRHS(p.f, eps, epsp, p.q), [0.01, 0.002, 0.05], ts, { rtol: 1e-7, atol: 1e-13 }), xs = r.y.map((y) => y[0]), ys = r.y.map((y) => y[1]), zs = r.y.map((y) => y[2]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: tmax, ymin: 1e-7, ymax: 2, xlog: false, ylog: true, xlabel: 't (tiempo adimensional)', ylabel: 'concentración adimensional', ml: 54, title: 'Oregonator de Tyson' });
      pl.frame(); pl.xy(ts, xs.map((v) => Math.max(v, 1e-9)), { color: '--c1', width: 1.6 }); pl.xy(ts, ys.map((v) => Math.max(v, 1e-9)), { color: '--c2', width: 1.6 }); pl.xy(ts, zs.map((v) => Math.max(v, 1e-9)), { color: '--c3', width: 2.4 });
      pl.legend([{ label: 'x = [HBrO₂]', color: '--c1' }, { label: 'y = [Br⁻]', color: '--c2' }, { label: 'z = [Ce⁴⁺]', color: '--c3' }], 'br');
      const pl2 = new EM.Plot(ctx, { x: W * 0.61, y: 0, w: W * 0.39, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(...zs) * 1.1, xlabel: 'x', ylabel: 'z', ml: 42, mr: 8, title: 'Plano x–z' });
      pl2.frame(); const n0 = Math.floor(N / 3); pl2.xy(xs.slice(n0), zs.slice(n0), { color: '--c4', width: 2 });
      const per = period(ts.slice(n0), zs.slice(n0)), zmax = Math.max(...zs.slice(n0)), zmin = Math.min(...zs.slice(n0)), osc = per && zmax / zmin > 1.5 && zmax - zmin > 0.02;
      const ymax = Math.max(...ys.slice(n0)), ymin = Math.min(...ys.slice(n0));
      sim.set('T', osc ? EM.fix(per, 2) + ' · ' + EM.fix(zmin, 3) + ' – ' + EM.fix(zmax, 3) + ' · ' + EM.sci(ymax / ymin, 1) + '×' : 'no hay oscilaciones');
      sim.set('reg', osc ? 'oscilaciones de relajación: reacciones lentas en la rama «Br⁻» y salto autocatalítico de HBrO₂' : zmax > 0.15 ? 'estado estacionario con el catalizador mayormente oxidado (f demasiado pequeño)' : 'estado estacionario con el catalizador casi todo reducido (f demasiado grande)');
    });
  });

  /* 20.4 Biestabilidad: modelo de Schlögl */
  EM.defineSim('schlogl', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('b', { label: 'Alimentación k₃[B] (parámetro de control)', min: 0, max: 0.6, step: 0.005, value: 0.2, fmt: (v) => v.toFixed(3) });
    sim.out('n', 'Estados estacionarios (x) y su estabilidad', { hl: true });
    sim.out('w', 'Ventana de biestabilidad en <i>k</i><sub>3</sub>[B] (extremos locales de la cúbica)');
    const base = { k1a: 3, k2: 1, k4: 2 };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, pp = { ...base, k3b: p.b };
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.46, h: H, xmin: 0, xmax: 3, ymin: -1.2, ymax: 1.2, xlabel: 'x', ylabel: 'dx/dt', ml: 46, title: 'Velocidad de cambio' });
      pl.frame(); pl.fn((x) => O.schlogl(x, pp), { color: '--c1', width: 2.6 }); pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      const roots = O.schloglRoots(pp), df = (x) => (O.schlogl(x + 1e-6, pp) - O.schlogl(x - 1e-6, pp)) / 2e-6;
      roots.forEach((x) => pl.dot(x, 0, { color: df(x) < 0 ? '--c3' : '--c2', r: 5 }));
      const bs = [], up = [], mid = [], lo = [];
      const pl2 = new EM.Plot(ctx, { x: W * 0.49, y: 0, w: W * 0.51, h: H, xmin: 0, xmax: 0.6, ymin: 0, ymax: 3, xlabel: 'k₃[B]', ylabel: 'x estacionario', ml: 46, mr: 8, title: 'Estados estacionarios: histéresis' });
      pl2.frame();
      for (let b = 0; b <= 0.6001; b += 0.004) { const rr = O.schloglRoots({ ...base, k3b: b }); rr.forEach((x) => { const s = (O.schlogl(x + 1e-6, { ...base, k3b: b }) - O.schlogl(x - 1e-6, { ...base, k3b: b })) / 2e-6; (s < 0 ? bs : up).push([b, x]); }); }
      bs.forEach(([b, x]) => pl2.dot(b, x, { color: '--c3', r: 1.6 })); up.forEach(([b, x]) => pl2.dot(b, x, { color: '--c2', r: 1.2 }));
      pl2.vline(p.b, { color: '--accent', dash: [4, 3] });
      pl2.legend([{ label: 'estable', color: '--c3', kind: 'dot' }, { label: 'inestable', color: '--c2', kind: 'dot' }], 'tr');
      sim.set('n', roots.map((x) => EM.fix(x, 3) + (df(x) < 0 ? ' (estable)' : ' (inestable)')).join(' · ') + (roots.length === 3 ? ' → biestable' : ''));
      const g = (x) => x * x * x - 3 * x * x + 2 * x, xm = 1 - 1 / Math.sqrt(3), xM = 1 + 1 / Math.sqrt(3);
      sim.set('w', `de ${EM.fix(g(xM), 3)} (< 0: fuera del rango físico) a ${EM.fix(g(xm), 3)}: en el rango físico (k₃[B] ≥ 0), de 0 a ${EM.fix(g(xm), 3)}`);
    });
  });

  /* 20.5 Patrones de Turing en 1D (Brusselator con difusión) */
  EM.defineSim('turing1d', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('A', { label: 'A', min: 1, max: 3, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('B', { label: 'B', min: 1, max: 6, step: 0.05, value: 3.2, fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: 'Cociente de difusividades D_Y/D_X', min: 1, max: 20, step: 0.5, value: 8, fmt: (v) => v.toFixed(1) });
    sim.out('thr', 'Umbral de Turing <i>B</i><sub>T</sub> = (1 + <i>A</i>√(<i>D</i><sub>X</sub>/<i>D</i><sub>Y</sub>))² · umbral de Hopf <i>B</i><sub>c</sub> = 1 + <i>A</i>²', { hl: true });
    sim.out('kc', 'Número de onda crítico <i>k</i><sub>c</sub> = (<i>A</i>²/<i>D</i><sub>X</sub><i>D</i><sub>Y</sub>)<sup>1/4</sup> · longitud de onda 2π/<i>k</i><sub>c</sub>');
    sim.out('meas', 'Longitud de onda medida en la simulación (distancia entre máximos) · régimen');
    sim.button('Nueva semilla aleatoria', () => { seed = (seed * 7919 + 13) % 100003; cache.key = null; }, { newRow: true });
    let seed = 11; const cache = { key: null };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = p.A, B = p.B, Dx = 1, Dy = p.r, Lx = 60, N = 200, T = 400, key = [A, B, Dy, seed].join();
      EM.draw.clear(cv);
      if (cache.key !== key) { cache.res = O.brus1D(A, B, Dx, Dy, Lx, N, T, seed, 100); cache.key = key; }
      const res = cache.res, tu = O.brusTuring(A, Dx, Dy), Bc = O.brusHopf(A);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 2.5, ymin: -1.2, ymax: Math.max(0.6, ...[...Array(100)].map((_, i) => O.brusDisp(A, B, Dx, Dy, (2.5 * i) / 99)) ) * 1.3 + 0.1, xlabel: 'número de onda k', ylabel: 'Re λ(k)', ml: 46, title: 'Relación de dispersión' });
      pl.frame(); pl.fn((k) => O.brusDisp(A, B, Dx, Dy, k), { color: '--c1', width: 2.6, n: 300 }); pl.hline(0, { color: '--ink-3', dash: [4, 3] }); pl.vline(tu.kc, { color: '--accent', dash: [4, 3], label: 'k_c' });
      const pl2 = new EM.Plot(ctx, { x: W * 0.46, y: 0, w: W * 0.54, h: H, xmin: 0, xmax: Lx, ymin: 0, ymax: T, xlabel: 'posición', ylabel: 'tiempo', ml: 46, mr: 8, title: 'Concentración de X (espacio–tiempo)', });
      pl2.frame();
      const fr = res.frames, xs = fr.flatMap((f) => [...f]), lo = Math.min(...xs), hi = Math.max(...xs), cw = pl2.iw / N, rh = pl2.ih / fr.length;
      fr.forEach((f, j) => { for (let i = 0; i < N; i++) { const u = (f[i] - lo) / (hi - lo + 1e-12); ctx.fillStyle = `hsl(${220 - 220 * u}, 70%, ${35 + 30 * u}%)`; ctx.fillRect(pl2.ix + i * cw, pl2.iy + pl2.ih - (j + 1) * rh, cw + 0.8, rh + 0.8); } });
      const last = fr[fr.length - 1], mean = last.reduce((a, b) => a + b, 0) / N; let mx = 0; const pk = []; for (let i = 0; i < N; i++) { const l = last[(i + N - 1) % N], r = last[(i + 1) % N]; if (last[i] > l && last[i] >= r && last[i] > mean) pk.push(i); mx = Math.max(mx, Math.abs(last[i] - mean)); }
      const lamMeas = pk.length > 1 ? (Lx / pk.length) : null, pattern = mx > 0.1;
      sim.set('thr', EM.fix(tu.B, 2) + ' · ' + EM.fix(Bc, 2));
      sim.set('kc', EM.fix(tu.kc, 3) + ' · ' + EM.fix((2 * Math.PI) / tu.kc, 2));
      sim.set('meas', (pattern && lamMeas ? EM.fix(lamMeas, 2) + ' (' + pk.length + ' máximos en L = 60)' : 'sin patrón') + ' · ' + (B < tu.B && B < Bc ? 'estado homogéneo estable' : B > tu.B && B < Bc ? 'inestabilidad de Turing (patrón estacionario)' : B > Bc && B < tu.B ? 'oscilaciones homogéneas (Hopf)' : 'Hopf y Turing a la vez: patrones oscilantes'));
    });
  });

  /* 20.6 Gray–Scott en 2D */
  const PRE = { mit: ['Mitosis de manchas (F = 0.0367, k = 0.0649)', 0.0367, 0.0649], man: ['Manchas estables (F = 0.030, k = 0.062)', 0.03, 0.062], lab: ['Laberinto / coral (F = 0.0545, k = 0.062)', 0.0545, 0.062], ray: ['Rayas y laberinto (F = 0.040, k = 0.060)', 0.04, 0.06] };
  EM.defineSim('grayscott', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.select('pre', { label: 'Receta de Pearson (1993)', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'mit' });
    const sF = sim.slider('F', { label: 'Alimentación F', min: 0.01, max: 0.09, step: 0.0005, value: 0.0367, fmt: (v) => v.toFixed(4) });
    const sK = sim.slider('k', { label: 'Retiro k', min: 0.04, max: 0.07, step: 0.0005, value: 0.0649, fmt: (v) => v.toFixed(4) });
    sim.slider('sp', { label: 'Pasos de tiempo por cuadro', min: 1, max: 80, step: 1, value: 30, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Tiempo (D_U = 0.16, D_V = 0.08, malla 128×128 periódica)', { hl: true });
    sim.out('ss', 'Estados homogéneos: trivial (1, 0) · no triviales (existen si F ≥ 4(F + k)²)');
    const N = 128, gs = new O.GrayScott(N, 0.0367, 0.0649); let last = 'mit';
    sim.resetButton(() => gs.seed(+Date.now() % 1000 + 1));
    sim.onChange = (id) => { if (id === 'pre') { const q = PRE[sim.p.pre]; sF.set(q[1], true); sK.set(q[2], true); gs.F = q[1]; gs.k = q[2]; gs.seed(5); } };
    sim.animate((dt) => { gs.F = sim.p.F; gs.k = sim.p.k; gs.step(Math.round(sim.p.sp)); });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, S = Math.min(W, H) - 8, x0 = (W - S) / 2, y0 = (H - S) / 2;
      EM.draw.clear(cv); gs.F = sim.p.F; gs.k = sim.p.k;
      if (!cv._off || cv._off.width !== N) { cv._off = document.createElement('canvas'); cv._off.width = N; cv._off.height = N; }
      const oc = cv._off.getContext('2d'), img = oc.createImageData(N, N), d = img.data, a = EM.rgb('--c3'), b = EM.rgb('--c2'), bg = null;
      for (let q = 0; q < N * N; q++) { const u = Math.min(1, gs.v[q] * 3.2), o = 4 * q; d[o] = 245 * (1 - u) + a[0] * u * 0.7; d[o + 1] = 245 * (1 - u) + a[1] * u * 0.7; d[o + 2] = 245 * (1 - u) + a[2] * u * 0.7; d[o + 3] = 255; }
      oc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv._off, x0, y0, S, S); ctx.strokeStyle = EM.col('--axis'); ctx.strokeRect(x0 - 0.5, y0 - 0.5, S + 1, S + 1);
      sim.set('t', EM.fix(gs.t, 0) + ' unidades');
      const st = O.gsSteady(gs.F, gs.k); sim.set('ss', st.length ? st.map((s) => `(${EM.fix(s.u, 3)}, ${EM.fix(s.v, 3)})`).join(' · ') : 'solo existe el trivial (1, 0); los patrones son estructuras localizadas de amplitud finita (F < 4(F + k)²)');
    });
  });
})();
