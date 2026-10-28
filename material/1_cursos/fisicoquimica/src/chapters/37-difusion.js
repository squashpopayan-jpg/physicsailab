/* Capítulo 37 — Difusión */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, D_ = FQ.dif, kB = 1.380649e-23, NA = 6.02214076e23;
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  /* sustancias de referencia en agua a 25 °C: masa molar (Da), volumen específico parcial (cm³/g) y D medido (m²/s) */
  const OBJ = {
    glu: { nm: 'Glucosa', M: 180.16, v: 0.622, D: 6.7e-10 }, suc: { nm: 'Sacarosa', M: 342.3, v: 0.617, D: 5.2e-10 }, lys: { nm: 'Lisozima', M: 14300, v: 0.703, D: 1.1e-10 },
    hb: { nm: 'Hemoglobina', M: 64500, v: 0.749, D: 6.9e-11 }, bsa: { nm: 'Albúmina sérica', M: 66400, v: 0.735, D: 6.0e-11 }
  };
  const rDry = (o) => Math.cbrt((3 * o.M * o.v) / (4 * Math.PI * NA)) * 1e-2; /* radio de la esfera seca (m) */
  const ION = Object.entries(D_.ions);

  /* 37.1 Segunda ley de Fick: soluciones analíticas y Crank–Nicolson */
  EM.defineSim('fick-difusion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('ic', { label: 'Condición inicial', options: [['step', 'Escalón (dos disoluciones en contacto)'], ['pulse', 'Pulso (n₀ moléculas por µm² en x = 0)'], ['slab', 'Lámina de 400 µm con paredes que reflejan']], value: 'step' });
    sim.slider('D', { label: 'Coeficiente de difusión', min: 1, max: 1000, step: 0.5, value: 100, log: true, unit: 'µm²/s', fmt: (v) => EM.fix(v, 1) });
    sim.slider('t', { label: 'Tiempo', min: 0.01, max: 100, step: 0.005, value: 5, log: true, unit: 's', fmt: (v) => EM.sci(v, 2) });
    sim.check('num', { label: 'Superponer la solución numérica de Crank–Nicolson', value: true });
    sim.out('s', 'Desplazamiento típico √(2<i>Dt</i>) · tiempo para recorrer 100 µm: <i>t</i> = <i>x</i>²/2<i>D</i>', { hl: true });
    sim.out('e', 'Máximo del error |numérico − analítico| / máximo del perfil');
    sim.out('j', 'Flujo en <i>x</i> = 0 (escalón: <i>c</i>₀√(<i>D</i>/4π<i>t</i>); pulso: 0 por simetría)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, D = p.D, t = p.t; EM.draw.clear(cv);
      let xs, an, nu = null, xmin, xmax, ymax, yl;
      if (p.ic === 'slab') {
        const L = 400, n = 401, dx = L / (n - 1); xs = Array.from({ length: n }, (_, i) => i * dx); an = xs.map((x) => D_.slab(x, t, D, L, 1, 400));
        if (p.num) { const t0 = t / 10, c0 = xs.map((x) => D_.slab(x, t0, D, L, 1, 400)); nu = D_.cn(c0, D, dx, (t - t0) / 400, 400); }
        xmin = 0; xmax = L; ymax = 1.05; yl = 'concentración c/c₀';
      } else {
        const W = 4.5 * Math.sqrt(2 * D * t), L = 2 * W, n = 1201, dx = (2 * L) / (n - 1), all = Array.from({ length: n }, (_, i) => -L + i * dx), f = p.ic === 'step' ? (x, tt) => D_.step(x, tt, D, 1) : (x, tt) => D_.pulse(x, tt, D, 1);
        xs = all; an = all.map((x) => f(x, t));
        if (p.num) { const t0 = t / 10, c0 = all.map((x) => f(x, t0)); nu = D_.cn(c0, D, dx, (t - t0) / 400, 400); }
        xmin = -W; xmax = W; ymax = p.ic === 'step' ? 1.05 : 1.1 / Math.sqrt(4 * Math.PI * D * t); yl = p.ic === 'step' ? 'concentración c/c₀' : 'n₀ por µm (c = n₀/√(4πDt) en x = 0)';
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin, xmax, ymin: 0, ymax, xlabel: 'posición x (µm)', ylabel: yl, ml: 58 });
      pl.frame(); pl.xy(xs, an, { color: '--c1', width: 2.8, fill: '--c1', fillAlpha: 0.12 });
      if (nu) { const idx = xs.map((_, i) => i).filter((i) => i % (p.ic === 'slab' ? 10 : 30) === 0); idx.forEach((i) => pl.dot(xs[i], nu[i], { color: '--c2', r: 3.2 })); }
      pl.legend([{ label: 'solución analítica', color: '--c1' }].concat(nu ? [{ label: 'Crank–Nicolson', color: '--c2', kind: 'dot' }] : []), 'tr');
      const mx = Math.max(...an), er = nu ? Math.max(...an.map((a, i) => Math.abs(a - nu[i]))) / mx : NaN;
      sim.set('s', EM.fix(Math.sqrt(2 * D * t), 1) + ' µm · ' + EM.sci(D_.tdiff(100, D, 1), 3) + ' s');
      sim.set('e', nu ? EM.sci(er, 2) : '(numérico desactivado)');
      sim.set('j', p.ic === 'step' ? EM.sci(Math.sqrt(D / (4 * Math.PI * t)), 3) + ' c₀·µm/s' : p.ic === 'pulse' ? '0' : 'las paredes impiden el flujo neto: el perfil tiende a c₀/2 = 0.5');
    });
  });

  /* 37.2 Camino aleatorio y movimiento browniano */
  EM.defineSim('camino-aleatorio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('d', { label: 'Dimensiones', options: [[1, '1 (a lo largo de una línea)'], [2, '2 (superficie)'], [3, '3 (volumen)']], value: 2 });
    sim.slider('D', { label: 'Coeficiente de difusión', min: 0.1, max: 100, step: 0.05, value: 10, log: true, unit: 'µm²/s', fmt: (v) => EM.fix(v, 2) });
    sim.slider('np', { label: 'Partículas promediadas', min: 20, max: 2000, step: 10, value: 400, log: true, fmt: (v) => v.toFixed(0) });
    sim.check('conf', { label: 'Confinar en una caja reflectante de 5 µm de lado', value: false });
    sim.out('t', 'Tiempo · desplazamiento cuadrático medio ⟨<i>r</i>²⟩ · teoría 2<i>dDt</i>', { hl: true });
    sim.out('r', 'Error relativo del MSD frente a 2<i>dDt</i> (sin confinar) · saturación <i>dL</i>²/6 (confinado)');
    const dt = 0.01, NMAX = 3000, L = 5; let st = null;
    const make = () => {
      const p = sim.p, d = +p.d, n = Math.round(p.np), rnd = rng(12345 + d), x = new Float64Array(n * d), x0 = new Float64Array(n * d);
      if (p.conf) for (let i = 0; i < n * d; i++) x0[i] = x[i] = rnd() * L;
      st = { d, n, conf: p.conf, rnd, x, x0, ms: [0], k: 0, tr: Array.from({ length: 6 }, (_, i) => [[x[i * d], d > 1 ? x[i * d + 1] : 0]]) };
    };
    const reflect = (v) => { v = ((v % (2 * L)) + 2 * L) % (2 * L); return v > L ? 2 * L - v : v; };
    const step = (nst) => {
      for (let q = 0; q < nst && st.k < NMAX; q++) {
        const sd = Math.sqrt(2 * sim.p.D * dt); let sum = 0;
        for (let i = 0; i < st.n; i++) { let r2 = 0; for (let c = 0; c < st.d; c++) { const j = i * st.d + c; const g = Math.sqrt(-2 * Math.log(1 - st.rnd())) * Math.cos(2 * Math.PI * st.rnd()); st.x[j] = st.conf ? reflect(st.x[j] + sd * g) : st.x[j] + sd * g; r2 += (st.x[j] - st.x0[j]) ** 2; } sum += r2; }
        st.k++; st.ms.push(sum / st.n); for (let i = 0; i < 6 && i < st.n; i++) st.tr[i].push([st.x[i * st.d], st.d > 1 ? st.x[i * st.d + 1] : 0]);
      }
    };
    make();
    sim.resetButton(() => make());
    sim.onChange = (id) => { if (id === 'd' || id === 'np' || id === 'conf') make(); };
    sim.animate(() => step(15));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = st.d, t = st.k * dt, half = W * 0.42; EM.draw.clear(cv);
      let R = 1; for (const tr of st.tr) for (const q of tr) R = Math.max(R, Math.abs(q[0]), Math.abs(q[1])); R = st.conf ? L : R * 1.15;
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: half, h: H, xmin: st.conf ? 0 : -R, xmax: R, ymin: st.conf ? 0 : -R, ymax: R, xlabel: 'x (µm)', ylabel: d > 1 ? 'y (µm)' : '(1D: eje x)', ml: 44, mr: 8 });
      p1.frame(); st.tr.forEach((tr, i) => { p1.path(tr.map((q) => q), { color: ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'][i] || '--c1', width: 1.1 }); p1.dot(tr[tr.length - 1][0], tr[tr.length - 1][1], { color: '--ink', r: 3 }); });
      const ts = Array.from({ length: st.ms.length }, (_, i) => i * dt), tm = Math.max(NMAX * dt, 1), th = ts.map((x) => 2 * d * p.D * x), ymax = Math.max(2 * d * p.D * tm, ...st.ms) * 1.05;
      const p2 = new EM.Plot(ctx, { x: half, y: 0, w: W - half, h: H, xmin: 0, xmax: tm, ymin: 0, ymax, xlabel: 'tiempo (s)', ylabel: '⟨r²⟩ (µm²)', ml: 52, mr: 10 });
      p2.frame(); p2.xy(ts, th, { color: '--c2', width: 2, dash: [5, 3] }); p2.xy(ts, st.ms, { color: '--c1', width: 2.4 });
      if (st.conf) p2.hline((d * L * L) / 6, { color: '--accent', dash: [3, 3], label: 'dL²/6' });
      p2.legend([{ label: 'simulación', color: '--c1' }, { label: '2dDt', color: '--c2' }], 'tl');
      const m = st.ms[st.k] || 0;
      sim.set('t', EM.fix(t, 2) + ' s · ' + EM.fix(m, 3) + ' µm² · ' + EM.fix(2 * d * p.D * t, 3) + ' µm²');
      sim.set('r', st.conf ? EM.fix(m, 3) + ' µm² frente a ' + EM.fix((d * L * L) / 6, 3) + ' µm² (' + EM.fix((100 * (m - (d * L * L) / 6)) / ((d * L * L) / 6), 1) + ' %)' : t > 0 ? EM.fix((100 * (m - 2 * d * p.D * t)) / (2 * d * p.D * t), 1) + ' % (σ ≈ ' + EM.fix(100 * Math.sqrt(2 / (d * st.n)), 1) + ' % por el número finito de partículas)' : '—');
    });
  });

  /* 37.3 Stokes–Einstein */
  EM.defineSim('stokes-einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura del agua', min: 273.15, max: 373.15, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('r', { label: 'Radio hidrodinámico', min: 0.1, max: 100, step: 0.05, value: 0.47, log: true, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.select('o', { label: 'Sustancia de referencia (25 °C)', options: Object.entries(OBJ).map(([k, v]) => [k, v.nm]), value: 'suc' });
    sim.out('d', 'η del agua · <i>D</i> = <i>k</i><sub>B</sub><i>T</i>/(6πη<i>r</i>) con el radio del control', { hl: true });
    sim.out('t', 'Distancia rms recorrida en 1 s (3D: √(6<i>Dt</i>)) · tiempo para cruzar 10 µm (una célula) · 1 mm');
    sim.out('o', 'Esfera seca de la sustancia (de <i>M</i> y v̄) · <i>D</i> de Stokes–Einstein · <i>D</i> medido · radio hidrodinámico de <i>D</i> medido');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, eta = D_.etaW(p.T), rs = Array.from({ length: 160 }, (_, i) => 0.1 * Math.pow(1000, i / 159)), f = (r) => D_.DSE(p.T, eta, r * 1e-9) * 1e12; EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 100, ymin: 1, ymax: 1e4, xlog: true, ylog: true, xlabel: 'radio r (nm)', ylabel: 'D (µm²/s)', ml: 54 });
      pl.frame(); pl.xy(rs, rs.map(f), { color: '--c1', width: 2.8 }); const o = OBJ[p.o];
      Object.values(OBJ).forEach((q) => pl.dot(rDry(q) * 1e9, q.D * 1e12, { color: q === o ? '--accent' : '--c2', r: q === o ? 6 : 4.5 }));
      pl.dot(p.r, f(p.r), { color: '--ink', r: 4 }); pl.legend([{ label: 'Stokes–Einstein (esfera con adherencia)', color: '--c1' }, { label: 'D medidos a 25 °C frente a la esfera seca', color: '--c2', kind: 'dot' }], 'tr');
      const D = D_.DSE(p.T, eta, p.r * 1e-9), Do = D_.DSE(298.15, D_.etaW(298.15), rDry(o));
      sim.set('d', EM.fix(eta * 1e3, 4) + ' mPa·s · ' + EM.sci(D, 3) + ' m²/s');
      sim.set('t', EM.fix(Math.sqrt(6 * D) * 1e6, 1) + ' µm · ' + EM.sci((1e-5) ** 2 / (6 * D), 2) + ' s · ' + EM.sci((1e-3) ** 2 / (6 * D), 2) + ' s');
      sim.set('o', EM.fix(rDry(o) * 1e9, 3) + ' nm · ' + EM.sci(Do, 2) + ' · ' + EM.sci(o.D, 2) + ' m²/s · ' + EM.fix((kB * 298.15 / (6 * Math.PI * D_.etaW(298.15) * o.D)) * 1e9, 3) + ' nm');
    });
  });

  /* 37.4 Nernst–Einstein: de la conductividad iónica al coeficiente de difusión */
  EM.defineSim('nernst-einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('i', { label: 'Ion', options: ION.map(([k]) => [k, k]), value: 'Na⁺' });
    sim.slider('T', { label: 'Temperatura', min: 273.15, max: 373.15, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('d', '<i>D</i> = <i>RT</i>λ°/(<i>z</i>²F²) a 25 °C · a la temperatura elegida (con el producto de Walden λη constante)', { hl: true });
    sim.out('r', 'Radio de Stokes <i>r</i><sub>S</sub> = <i>k</i><sub>B</sub><i>T</i>/(6πη<i>D</i>) · movilidad <i>u</i> = <i>zF</i><i>D</i>/<i>RT</i>');
    sim.out('w', 'Tiempo para que el ion difunda 1 nm · 1 µm');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx; EM.draw.clear(cv); const names = ION.map(([k]) => k), Ds = ION.map(([, v]) => D_.Dion(v.l, v.z, 298.15) * 1e9), sel = D_.ions[p.i];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: names.length - 0.5, ymin: 0, ymax: 10, xlabel: '', ylabel: 'D a 25 °C (10⁻⁹ m²/s)', ml: 54, xticks: names.map((_, i) => i), xfmt: (v) => names[Math.round(v)] || '' });
      pl.frame(); Ds.forEach((v, i) => pl.dot(i, v, { color: names[i] === p.i ? '--accent' : '--c1', r: names[i] === p.i ? 7 : 5 }));
      pl.label(names.indexOf('H⁺'), Ds[names.indexOf('H⁺')], 'Grotthuss', { dx: 34, dy: 4 });
      const D25 = D_.Dion(sel.l, sel.z, 298.15), DT = D25 * (p.T / 298.15) * (D_.etaW(298.15) / D_.etaW(p.T)), eta = D_.etaW(p.T), rS = D_.rH(p.T, eta, DT);
      sim.set('d', EM.sci(D25, 4) + ' · ' + EM.sci(DT, 4) + ' m²/s');
      sim.set('r', EM.fix(rS * 1e10, 2) + ' Å · ' + EM.sci((sel.z * 96485.33212 * DT) / (8.314462618 * p.T), 3) + ' m²/(V·s)');
      sim.set('w', EM.sci(1e-18 / (2 * DT), 2) + ' s · ' + EM.sci(1e-12 / (2 * DT), 2) + ' s');
    });
  });

  const t95 = (D, L) => { let a = 0, b = 2 * L * L / D; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (D_.flux(m, D, L, 1) / (D / L) < 0.95) a = m; else b = m; } return (a + b) / 2; };
  /* 37.5 Permeación a través de una membrana: tiempo de retardo */
  EM.defineSim('permeacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('D', { label: 'Coeficiente de difusión en la membrana', min: 1e-3, max: 1e3, step: 1e-3, value: 1, log: true, unit: 'µm²/s', fmt: (v) => EM.sci(v, 2) });
    sim.slider('L', { label: 'Espesor', min: 1, max: 1000, step: 0.5, value: 50, log: true, unit: 'µm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('K', { label: 'Coeficiente de reparto K', min: 0.01, max: 100, step: 0.005, value: 1, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.check('num', { label: 'Superponer Crank–Nicolson (Dirichlet)', value: true });
    sim.out('l', 'Tiempo de retardo θ = <i>L</i>²/6<i>D</i> · tiempo en que el flujo alcanza el 95 % del estacionario', { hl: true });
    sim.out('p', 'Permeabilidad <i>P</i> = <i>KD</i>/<i>L</i> · flujo estacionario <i>J</i> = <i>P</i>·<i>c</i>₁ (por unidad de concentración exterior)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, th = D_.lag(p.D, p.L), tmax = 4 * th, c1 = p.K; EM.draw.clear(cv);
      const ts = Array.from({ length: 200 }, (_, i) => (tmax * i) / 199), Q = ts.map((t) => D_.Qperm(t, p.D, p.L, c1)), lin = ts.map((t) => (p.D * c1 * (t - th)) / p.L);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 0, ymax: Q[Q.length - 1] * 1.05, xlabel: 'tiempo (s)', ylabel: 'cantidad acumulada Q (c₁ = K, por µm²)', ml: 62 });
      pl.frame(); pl.xy(ts, lin.map((v) => Math.max(v, 0)), { color: '--c3', width: 1.8, dash: [5, 3] }); pl.xy(ts, Q, { color: '--c1', width: 2.8 }); pl.vline(th, { color: '--accent', dash: [3, 3], label: 'θ = L²/6D' });
      let maxe = NaN;
      if (p.num) {
        const n = 121, dx = p.L / (n - 1), nst = 400, dt = tmax / nst; let c = new Float64Array(n), Qn = 0, prev = 0; const pts = [];
        for (let s = 1; s <= nst; s++) { c = D_.cnD(c, p.D, dx, dt, 1, c1, 0); Qn += 0.5 * (prev + (p.D * (4 * c[n - 2] - c[n - 3])) / (2 * dx)) * dt; prev = (p.D * (4 * c[n - 2] - c[n - 3])) / (2 * dx); if (s % 10 === 0) pts.push([s * dt, Qn]); }
        pts.forEach((q) => pl.dot(q[0], q[1], { color: '--c2', r: 3 })); maxe = Math.abs(pts[pts.length - 1][1] - Q[Q.length - 1]) / Q[Q.length - 1];
      }
      pl.legend([{ label: 'Q(t) analítico (serie de Crank)', color: '--c1' }, { label: 'asíntota con retardo', color: '--c3' }].concat(p.num ? [{ label: 'Crank–Nicolson', color: '--c2', kind: 'dot' }] : []), 'br');
      sim.set('l', EM.sci(th, 3) + ' s · ' + EM.sci(t95(p.D, p.L), 3) + ' s' + (p.num ? ' · error numérico en Q(t_máx) ' + EM.sci(maxe, 2) : ''));
      sim.set('p', EM.sci((p.K * p.D) / p.L, 3) + ' µm/s · J = ' + EM.sci((p.K * p.D) / p.L, 3) + ' µm/s × c₁');
    });
  });

  /* 37.6 Reacción y difusión: módulo de Thiele */
  EM.defineSim('reaccion-difusion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('phi', { label: 'Módulo de Thiele φ = L√(k/D)', min: 0.05, max: 20, step: 0.01, value: 2, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.seg('g', { label: 'Perfil', options: [['lam', 'cosh (analítico)'], ['both', 'cosh + diferencias finitas']], value: 'both' });
    sim.out('e', 'Factor de efectividad η = tanh φ/φ · concentración en el centro <i>c</i>(L)/<i>c</i>₀ = 1/cosh φ', { hl: true });
    sim.out('r', 'Regímenes: φ < 0.3 reacción controla (η ≈ 1); φ > 3 difusión controla (η ≈ 1/φ); velocidad observada = η·<i>k</i>');
    sim.out('p', 'Longitud de penetración λ = √(<i>D</i>/<i>k</i>) en unidades de <i>L</i> = 1/φ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, phi = p.phi; EM.draw.clear(cv);
      const xs = Array.from({ length: 200 }, (_, i) => i / 199), prof = (x) => Math.cosh(phi * (1 - x)) / Math.cosh(phi), half = cv.w * 0.5;
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: half, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 'profundidad x/L (0 = superficie)', ylabel: 'concentración c/c₀', ml: 52, mr: 8 });
      p1.frame(); p1.xy(xs, xs.map(prof), { color: '--c1', width: 2.8, fill: '--c1', fillAlpha: 0.1 });
      if (p.g === 'both') { const n = 81, c = D_.rdFD(1 / (phi * phi), 1, 1, 1, n); for (let i = 0; i < n; i += 4) p1.dot(i / (n - 1), c[i], { color: '--c2', r: 3.2 }); }
      const ps = Array.from({ length: 200 }, (_, i) => 0.05 * Math.pow(400, i / 199)), p2 = new EM.Plot(ctx, { x: half, y: 0, w: cv.w - half, h: cv.h, xmin: 0.05, xmax: 20, ymin: 0.01, ymax: 1.5, xlog: true, ylog: true, xlabel: 'módulo de Thiele φ', ylabel: 'factor de efectividad η', ml: 52, mr: 10 });
      p2.frame(); p2.xy(ps, ps.map(D_.eta), { color: '--c1', width: 2.8 }); p2.xy(ps, ps.map((x) => 1 / x), { color: '--c3', width: 1.6, dash: [5, 3] }); p2.dot(phi, D_.eta(phi), { color: '--accent', r: 6 });
      sim.set('e', EM.fix(D_.eta(phi), 4) + ' · ' + EM.fix(1 / Math.cosh(phi), 5));
      sim.set('r', phi < 0.3 ? 'régimen controlado por la reacción' : phi > 3 ? 'régimen controlado por la difusión' : 'régimen mixto');
      sim.set('p', EM.fix(1 / phi, 4) + ' L');
    });
  });
})();
