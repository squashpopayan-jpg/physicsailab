/* Capítulo 7 — Difusión */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     7.1 Caminata aleatoria
     ====================================================================== */
  EM.defineSim('random-walk', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Átomos', min: 100, max: 3000, step: 100, value: 1500, fmt: (v) => v.toFixed(0) });
    sim.slider('G', { label: 'Saltos por unidad de tiempo Γ', min: 1, max: 20, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('t', 'Tiempo (unidades arbitrarias)');
    sim.out('x2', '⟨<i>x</i>²⟩ medido');
    sim.out('x2t', '2<i>Dt</i> teórico (<i>D</i> = Γλ²/2)', { hl: true });
    let X, Y, t, hist;
    const reset = () => { X = new Float64Array(Math.round(sim.p.n)); Y = new Float64Array(X.length); t = 0; hist = []; };
    reset();
    sim.onChange = (id) => { if (id === 'n') reset(); };
    let acc = 0;
    sim.animate((dt) => {
      acc += dt * sim.p.G * 6;
      while (acc >= 1) {
        acc -= 1;
        for (let i = 0; i < X.length; i++) { if (Math.random() < 0.5) X[i] += Math.random() < 0.5 ? -1 : 1; else Y[i] += Math.random() < 0.5 ? -1 : 1; }
        t += 1 / (sim.p.G);
        let s = 0; for (let i = 0; i < X.length; i++) s += X[i] * X[i];
        hist.push([t, s / X.length]);
        if (hist.length > 600) hist.shift();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* nube */
      const w1 = W * 0.4, cx = w1 / 2, cy = H * 0.42, sc = Math.min(w1, H * 0.8) / 120;
      for (let i = 0; i < X.length; i++) { ctx.fillStyle = EM.alpha('--c1', 0.4); ctx.fillRect(cx + X[i] * sc - 1, cy + Y[i] * sc - 1, 2, 2); }
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
      /* histograma de x */
      const bins = 40, mx = 60, hb = new Float64Array(bins);
      for (let i = 0; i < X.length; i++) { const b = Math.floor(((X[i] + mx) / (2 * mx)) * bins); if (b >= 0 && b < bins) hb[b]++; }
      const ph = new EM.Plot(ctx, { x: 0, y: H * 0.72, w: w1, h: H * 0.28, xmin: -mx, xmax: mx, ymin: 0, ymax: Math.max(5, ...hb) * 1.2, xlabel: 'x (saltos)', ylabel: '', yticks: [], ml: 14, mt: 4 });
      ph.frame();
      for (let b = 0; b < bins; b++) { const xa = -mx + (2 * mx * b) / bins; ctx.fillStyle = EM.alpha('--c1', 0.5); ctx.fillRect(ph.X(xa), ph.Y(hb[b]), ph.X(xa + (2 * mx) / bins) - ph.X(xa) - 1, ph.Y(0) - ph.Y(hb[b])); }
      /* gaussiana teórica: en x, varianza = (fracción en x) * n saltos = t*G/2 */
      const varx = (t * p.G) / 2;
      if (varx > 0) ph.fn((x) => (X.length * ((2 * mx) / bins) * Math.exp(-(x * x) / (2 * varx))) / Math.sqrt(2 * Math.PI * varx), { color: '--accent', width: 1.8 });
      /* ⟨x²⟩ contra t */
      const tmax = Math.max(1, t * 1.1);
      const pl = new EM.Plot(ctx, { x: W * 0.43, y: 0, w: W * 0.57, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: Math.max(4, ((tmax * p.G) / 2) * 1.2), xlabel: 'tiempo t', ylabel: '⟨x²⟩', ml: 50 });
      pl.frame();
      pl.fn((tt) => (tt * p.G) / 2, { color: '--accent', width: 1.6, dash: [6, 4] });
      if (hist.length > 1) pl.xy(hist.map((h) => h[0]), hist.map((h) => h[1]), { color: '--c1', width: 2 });
      const last = hist.length ? hist[hist.length - 1][1] : 0;
      sim.set('t', EM.fix(t, 2));
      sim.set('x2', EM.fix(last, 2));
      sim.set('x2t', EM.fix(varx, 2));
    });
  });

  /* ======================================================================
     7.2 Carburización
     ====================================================================== */
  EM.defineSim('carburizing', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 850, max: 1100, step: 5, value: 950, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('Dfix', { label: 'Usar D = 1.6×10⁻¹¹ m²/s (dato de Callister)', value: true });
    sim.slider('t', { label: 'Tiempo', min: 0.1, max: 30, step: 0.1, value: 7.05, unit: 'h', fmt: (v) => EM.fix(v, 1) });
    sim.slider('C0', { label: 'Carbono inicial <i>C</i><sub>0</sub>', min: 0.05, max: 0.6, step: 0.01, value: 0.25, unit: '% C', fmt: (v) => EM.fix(v, 2) });
    sim.slider('Cs', { label: 'Carbono en la superficie <i>C<sub>s</sub></i>', min: 0.6, max: 1.4, step: 0.01, value: 1.2, unit: '% C', fmt: (v) => EM.fix(v, 2) });
    sim.slider('Cx', { label: 'Concentración objetivo <i>C<sub>x</sub></i>', min: 0.3, max: 1.2, step: 0.01, value: 0.8, unit: '% C', fmt: (v) => EM.fix(v, 2) });
    sim.slider('x', { label: 'Profundidad objetivo <i>x</i>', min: 0.1, max: 3, step: 0.05, value: 0.5, unit: 'mm', fmt: (v) => EM.fix(v, 2) });
    sim.out('D', 'Coeficiente <i>D</i>');
    sim.out('Cxt', 'Concentración en <i>x</i> al tiempo <i>t</i>', { hl: true });
    sim.out('tn', 'Tiempo necesario para <i>C<sub>x</sub></i> en <i>x</i>');
    sim.out('L', 'Longitud de difusión √(<i>Dt</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const D = p.Dfix ? 1.6e-11 : MAT.arrhenius(2.3e-5, 148e3, p.T + 273.15);
      const t = p.t * 3600;
      const prof = (xm) => MAT.fickConst(xm, t, D, p.C0, p.Cs);
      const xmax = 3e-3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: xmax * 1e3, ymin: 0, ymax: 1.5, xlabel: 'profundidad x (mm)', ylabel: '% C en peso', ml: 50 });
      pl.frame();
      pl.fn((xmm) => prof(xmm * 1e-3), { color: '--accent', width: 2.6 });
      /* solución numérica por diferencias finitas */
      const N = 160, dx = (2 * xmax) / N;
      let C = new Float64Array(N).fill(p.C0); C[0] = p.Cs;
      const dt = (0.45 * dx * dx) / D, steps = Math.min(40000, Math.ceil(t / dt)), dts = t / steps;
      for (let k = 0; k < steps; k++) C = MAT.fickStep(C, D, dx, dts, p.Cs, p.C0);
      pl.xy(Array.from({ length: N }, (_, i) => i * dx * 1e3), Array.from(C), { color: '--c1', width: 1.4, dash: [4, 4] });
      pl.hline(p.Cx, { color: '--ink-3', label: 'C_x' });
      pl.vline(p.x, { color: '--ink-3', label: 'x' });
      pl.dot(p.x, prof(p.x * 1e-3), { color: '--accent' });
      pl.hline(p.C0, { color: '--c6', dash: [2, 3] });
      pl.legend([{ label: 'función error', color: '--accent' }, { label: 'diferencias finitas', color: '--c1', dash: [4, 4] }], 'tr');
      const tn = (p.Cx > p.C0 && p.Cx < p.Cs) ? MAT.fickTime(p.x * 1e-3, D, p.C0, p.Cs, p.Cx) / 3600 : NaN;
      sim.set('D', EM.sci(D, 3) + ' m²/s' + (p.Dfix ? '' : ' (C en Fe-γ, Arrhenius)'));
      sim.set('Cxt', EM.fix(prof(p.x * 1e-3), 3) + ' % C');
      sim.set('tn', isFinite(tn) ? EM.fix(tn, 2) + ' h' : '— (C<sub>x</sub> fuera de rango)');
      sim.set('L', EM.fix(Math.sqrt(D * t) * 1e3, 3) + ' mm');
    });
  });

  /* ======================================================================
     7.3 Difusión numérica: par, fuente delgada, membrana
     ====================================================================== */
  EM.defineSim('fick-numeric', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('mode', { label: 'Situación', options: [['couple', 'Par Cu–Ni'], ['thin', 'Fuente delgada'], ['mem', 'Membrana']], value: 'couple' });
    sim.slider('sp', { label: 'Velocidad', min: 1, max: 40, step: 1, value: 10, fmt: (v) => v.toFixed(0) + '×' });
    sim.resetButton(() => reset());
    sim.out('t', 'Tiempo adimensional <i>Dt</i>/<i>L</i>²', { hl: true });
    sim.out('Q', 'Cantidad total de soluto');
    sim.out('J', 'Flujo en el centro y en los extremos');
    const N = 200;
    let C, tau;
    const reset = () => {
      C = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        if (sim.p.mode === 'couple') C[i] = i < N / 2 ? 0 : 1;
        else if (sim.p.mode === 'thin') C[i] = Math.abs(i - N / 2) < 2 ? 25 : 0;
        else C[i] = 0;
      }
      tau = 0;
    };
    reset();
    sim.onChange = (id) => { if (id === 'mode') reset(); };
    sim.animate((dt) => {
      const steps = Math.round(sim.p.sp * 6);
      const dx = 1 / N, D = 1, h = 0.45 * dx * dx;
      for (let k = 0; k < steps; k++) {
        C = sim.p.mode === 'mem' ? MAT.fickStep(C, D, dx, h, 1, 0) : MAT.fickStep(C, D, dx, h, null, null);
        tau += h;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const ym = p.mode === 'thin' ? Math.max(1.2, Math.max(...C) * 1.15) : 1.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: ym, xlabel: 'posición x/L', ylabel: p.mode === 'couple' ? 'fracción de Ni' : 'concentración', ml: 50 });
      pl.frame();
      const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
      pl.xy(xs, Array.from(C), { color: '--accent', width: 2.4 });
      if (p.mode === 'couple' && tau > 0) pl.fn((x) => 0.5 * (1 + MAT.erf((x - 0.5) / (2 * Math.sqrt(tau)))), { color: '--c1', width: 1.2, dash: [5, 4] });
      if (p.mode === 'thin' && tau > 0) { const Q = C.reduce((s, v) => s + v, 0) / N; pl.fn((x) => (Q / Math.sqrt(4 * Math.PI * tau)) * Math.exp(-((x - 0.5) ** 2) / (4 * tau)), { color: '--c1', width: 1.2, dash: [5, 4] }); }
      if (p.mode === 'mem') pl.fn((x) => 1 - x, { color: '--c1', width: 1.2, dash: [5, 4] });
      pl.legend([{ label: 'numérico', color: '--accent' }, { label: p.mode === 'mem' ? 'estado estacionario' : 'solución analítica', color: '--c1', dash: [5, 4] }], 'tr');
      const Q = C.reduce((s, v) => s + v, 0) / N;
      const g = (i) => -(C[i + 1] - C[i]) * N;
      sim.set('t', EM.fix(tau, 4));
      sim.set('Q', EM.fix(Q, 4));
      sim.set('J', EM.fix(g(N / 2), 3) + ' (centro), ' + EM.fix(g(1), 3) + ' / ' + EM.fix(g(N - 3), 3) + ' (extremos)');
    });
  });

  /* ======================================================================
     7.4 Arrhenius
     ====================================================================== */
  EM.defineSim('arrhenius-d', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('k', { label: 'Sistema resaltado', options: MAT.diffData.map((d, i) => [String(i), d.sp + ' en ' + d.host]), value: '3' });
    sim.slider('T1', { label: 'Temperatura 1', min: 300, max: 1500, step: 5, value: 800, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('T2', { label: 'Temperatura 2', min: 300, max: 1500, step: 5, value: 1000, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('D1', '<i>D</i>(<i>T</i><sub>1</sub>)');
    sim.out('D2', '<i>D</i>(<i>T</i><sub>2</sub>)');
    sim.out('Q', '<i>Q<sub>d</sub></i> recuperada de los dos puntos', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.6, xmax: 1.3, ymin: -22, ymax: -8, xlabel: '1000/T (K⁻¹)', ylabel: 'log₁₀ D (m²/s)', ml: 52 });
      pl.frame();
      const sel = +p.k;
      MAT.diffData.forEach((d, i) => {
        pl.fn((x) => Math.log10(MAT.arrhenius(d.D0, d.Q, 1000 / x)), { color: i === sel ? '--accent' : '--grid-2', width: i === sel ? 2.6 : 1.3 });
        const xl = 1.25 - (i % 3) * 0.1;
        const yv = Math.log10(MAT.arrhenius(d.D0, d.Q, 1000 / xl));
        if (yv > -22 && yv < -8) pl.label(xl, yv, d.sp + '/' + d.host.split(' ')[0], { size: 10.5, color: i === sel ? '--accent' : '--ink-3', dy: -4 });
      });
      /* eje superior de temperaturas */
      for (const Tc of [500, 700, 900, 1100, 1300]) { const x = 1000 / (Tc + 273.15); if (x > 0.6 && x < 1.3) pl.label(x, -8.3, Tc + ' °C', { size: 10, color: '--ink-3', align: 'center' }); }
      const d = MAT.diffData[sel];
      const T1 = p.T1 + 273.15, T2 = p.T2 + 273.15;
      const D1 = MAT.arrhenius(d.D0, d.Q, T1), D2 = MAT.arrhenius(d.D0, d.Q, T2);
      pl.dot(1000 / T1, Math.log10(D1), { color: '--c1', label: 'T₁' });
      pl.dot(1000 / T2, Math.log10(D2), { color: '--c3', label: 'T₂' });
      const Q = Math.abs(T1 - T2) > 1 ? (-MAT.R * Math.log(D1 / D2)) / (1 / T1 - 1 / T2) : NaN;
      sim.set('D1', EM.sci(D1, 3) + ' m²/s');
      sim.set('D2', EM.sci(D2, 3) + ' m²/s');
      sim.set('Q', isFinite(Q) ? EM.fix(Q / 1000, 1) + ' kJ/mol = ' + EM.fix(Q / (MAT.NA * MAT.eV), 3) + ' eV/átomo' : '—');
    });
  });
})();
