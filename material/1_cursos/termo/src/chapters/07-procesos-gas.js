/* Capítulo 7 — Procesos del gas ideal */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 7.1 Familia politrópica */
  EM.defineSim('politropicos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Exponente politrópico <i>n</i>', min: 0, max: 3, step: 0.01, value: 1.3, fmt: (v) => v.toFixed(2) });
    sim.slider('V2', { label: 'Volumen final', min: 0.01, max: 0.3, step: 0.005, value: 0.02, unit: 'm³', fmt: (v) => v.toFixed(3) });
    sim.out('st', 'Estado final', { hl: true });
    sim.out('W', 'Trabajo de frontera');
    sim.out('Q', 'Calor');
    sim.out('dU', 'Cambio de energía interna');
    const P1 = 100, V1 = 0.1, T1 = 300, k = 1.4, R = 0.287, m = (P1 * V1) / (R * T1), cvv = 0.718;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const n = p.n, V2 = p.V2, P2 = P1 * Math.pow(V1 / V2, n), T2 = (P2 * V2) / (m * R);
      const W = Math.abs(n - 1) < 1e-6 ? P1 * V1 * Math.log(V2 / V1) : (P2 * V2 - P1 * V1) / (1 - n), dU = m * cvv * (T2 - T1), Q = dU + W;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.005, xmax: 0.32, xlog: true, ymin: 20, ymax: 5000, ylog: true, xlabel: 'V (m³)', ylabel: 'P (kPa)' });
      pl.frame();
      for (const T of [200, 300, 450, 600, 900, 1200]) pl.fn((V) => (m * R * T) / V, { color: '--grid-2', width: 1 });
      const fam = [[0, 'n = 0 (isobárico)', '--c6'], [1, 'n = 1 (isotérmico)', '--c3'], [k, 'n = k = 1.4 (adiabático)', '--c1']];
      for (const [nn, , col] of fam) pl.fn((V) => P1 * Math.pow(V1 / V, nn), { color: col, width: 1.6, dash: [6, 4] });
      pl.vline(V1, { color: '--c5', label: 'n → ∞', labelY: 20 });
      pl.fn((V) => (V >= Math.min(V1, V2) && V <= Math.max(V1, V2) ? P1 * Math.pow(V1 / V, n) : NaN), { color: '--accent', width: 3 });
      pl.dot(V1, P1, { color: '--ink', label: '1' }); pl.dot(V2, P2, { color: '--accent', label: '2' });
      pl.legend(fam.map(([, l, c]) => ({ label: l, color: c, dash: [6, 4] })).concat([{ label: 'proceso elegido', color: '--accent' }]), 'tr');
      sim.set('st', EM.fix(P2, 1) + ' kPa · ' + EM.fix(T2, 1) + ' K');
      sim.set('W', EM.fix(W, 2) + ' kJ' + (W < 0 ? ' (recibido)' : ' (entregado)'));
      sim.set('Q', EM.fix(Q, 2) + ' kJ' + (Q < -1e-9 ? ' (cedido)' : Q > 1e-9 ? ' (recibido)' : ''));
      sim.set('dU', EM.fix(dU, 2) + ' kJ');
    });
  });

  /* 7.2 Compresión con transferencia de calor */
  EM.defineSim('compresion-rapida', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('tc', { label: 'Duración de la compresión', min: 0.002, max: 20, step: 0.001, value: 0.2, log: true, fmt: (v) => (v < 0.1 ? (v * 1000).toFixed(1) + ' ms' : v.toFixed(2) + ' s') });
    sim.slider('h', { label: 'Coeficiente de transferencia de calor', min: 5, max: 1000, step: 1, value: 100, unit: 'W/m²·K', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Relación de compresión', min: 2, max: 22, step: 0.5, value: 10, fmt: (v) => v.toFixed(1) });
    sim.out('n', 'Exponente politrópico efectivo', { hl: true });
    sim.out('T', 'Temperatura máxima');
    sim.out('tau', 'Tiempo térmico <i>mc<sub>v</sub></i>/<i>hA</i>');
    const D = 0.08, L1 = 0.15, P1 = 100e3, T1 = 300, Rg = 287, cvg = 718, Tw = 300;
    const run = (tc, h, r) => {
      const V1 = (Math.PI * D * D / 4) * L1, V2 = V1 / r, m = (P1 * V1) / (Rg * T1);
      let T = T1; const N = 2000, dt = tc / N, out = [];
      for (let i = 0; i <= N; i++) {
        const t = i * dt, V = V1 - ((V1 - V2) * (1 - Math.cos((Math.PI * t) / tc))) / 2, dV = (-(V1 - V2) * Math.PI * Math.sin((Math.PI * t) / tc)) / (2 * tc);
        const L = V / (Math.PI * D * D / 4), A = Math.PI * D * L + (Math.PI * D * D) / 2;
        const P = (m * Rg * T) / V;
        out.push([t, V, P, T]);
        T += ((-P * dV + h * A * (Tw - T)) / (m * cvg)) * dt;
      }
      return { out, m, V1, V2 };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const { out, m, V1, V2 } = run(p.tc, p.h, p.r);
      const last = out[out.length - 1], n = Math.log(last[2] / P1) / Math.log(V1 / V2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: V2 * 0.8, xmax: V1 * 1.1, xlog: true, ymin: 80, ymax: P1 * Math.pow(p.r, 1.4) * 1.3 / 1e3, ylog: true, xlabel: 'V (m³)', ylabel: 'P (kPa)' });
      pl.frame();
      pl.fn((V) => (P1 * V1) / V / 1e3, { color: '--c3', width: 1.4, dash: [6, 4] });
      pl.fn((V) => (P1 * Math.pow(V1 / V, 1.4)) / 1e3, { color: '--c1', width: 1.4, dash: [6, 4] });
      pl.path(out.map((o) => [o[1], o[2] / 1e3]), { color: '--accent', width: 2.6 });
      pl.legend([{ label: 'isotérmica', color: '--c3', dash: [6, 4] }, { label: 'adiabática', color: '--c1', dash: [6, 4] }, { label: 'con transferencia', color: '--accent' }], 'tr');
      const Tmax = Math.max(...out.map((o) => o[3]));
      const p2 = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: p.tc, ymin: 250, ymax: T1 * Math.pow(p.r, 0.4) * 1.1, xlabel: 't (s)', ylabel: 'T (K)' });
      p2.frame();
      p2.hline(T1 * Math.pow(p.r, 0.4), { color: '--c1', label: 'adiabática', labelRight: true });
      p2.path(out.map((o) => [o[0], o[3]]), { color: '--accent', width: 2.6 });
      const Am = Math.PI * D * L1 + (Math.PI * D * D) / 2;
      sim.set('n', EM.fix(n, 3));
      sim.set('T', EM.fix(Tmax, 1) + ' K (adiabática: ' + EM.fix(T1 * Math.pow(p.r, 0.4), 1) + ' K)');
      sim.set('tau', EM.fix((m * cvg) / (p.h * Am), 3) + ' s');
    });
  });

  /* 7.3 Rüchardt */
  const GG = { aire: ['Aire', 1.4], ar: ['Argón', 5 / 3], co2: ['CO₂', 1.289], he: ['Helio', 5 / 3], ch4: ['Metano', 1.304] };
  EM.defineSim('ruchardt', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas en el frasco', options: Object.entries(GG).map(([k, v]) => [k, v[0] + ' (γ = ' + v[1].toFixed(3) + ')']), value: 'aire' });
    sim.slider('V', { label: 'Volumen del frasco', min: 1, max: 20, step: 0.5, value: 10, unit: 'L', fmt: (v) => v.toFixed(1) });
    sim.slider('m', { label: 'Masa de la esfera', min: 5, max: 50, step: 0.1, value: 16.6, unit: 'g', fmt: (v) => v.toFixed(1) });
    sim.slider('b', { label: 'Amortiguamiento (fricción y fuga)', min: 0, max: 0.05, step: 0.001, value: 0.008, unit: 'kg/s', fmt: (v) => v.toFixed(3) });
    sim.check('iso', { label: 'Oscilación isotérmica (hipotética)', value: false });
    sim.resetButton(() => reset());
    sim.out('T', 'Período medido', { hl: true });
    sim.out('g', 'γ despejado');
    sim.out('T0', 'Período teórico sin fricción');
    let y, v, t, hist, cross;
    const reset = () => { y = 0.03; v = 0; t = 0; hist = []; cross = []; };
    reset();
    sim.onChange = (id) => { if (id !== 'b') reset(); };
    const A = Math.PI * 0.008 * 0.008;
    const params = () => { const p = sim.p, m = p.m / 1000, V = p.V / 1000, P = 81900 + (m * TH.g) / A, gam = p.iso ? 1 : GG[p.g][1]; return { m, V, P, gam, k: (gam * P * A * A) / V }; };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const { m, k } = params(), b = sim.p.b, N = 40, h = dt / N;
      for (let i = 0; i < N; i++) {
        const a = (-k * y - b * v) / m; v += a * h; const yn = y + v * h;
        if (y > 0 && yn <= 0) cross.push(t);
        y = yn; t += h;
      }
      hist.push([t, y]); if (hist.length > 1500) hist.shift();
      if (Math.abs(y) < 1e-5 && Math.abs(v) < 1e-4) reset();
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const { m, V, P, gam } = params();
      /* frasco y tubo */
      const fx = 40, fw = 110, fy = H * 0.45, fh = H * 0.45, tx = fx + fw / 2 - 8, tt = 20;
      ctx.fillStyle = EM.alpha('--c1', 0.12); ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh);
      ctx.strokeRect(tx, tt, 16, fy - tt);
      const by = tt + (fy - tt) * 0.5 - y * 1500;
      ctx.fillStyle = EM.col('--c4'); ctx.beginPath(); ctx.arc(tx + 8, by, 8, 0, 7); ctx.fill();
      const pl = new EM.Plot(ctx, { x: 190, y: 0, w: W - 190, h: H, xmin: Math.max(0, t - 8), xmax: Math.max(8, t), ymin: -35, ymax: 35, xlabel: 't (s)', ylabel: 'y (mm)' });
      pl.frame();
      pl.path(hist.map(([a, b]) => [a, b * 1000]), { color: '--accent', width: 2 });
      let Tm = null;
      if (cross.length >= 3) { const c = cross.slice(-6); Tm = (c[c.length - 1] - c[0]) / (c.length - 1); }
      const T0 = 2 * Math.PI * Math.sqrt((m * V) / (gam * P * A * A));
      sim.set('T', Tm ? EM.fix(Tm, 4) + ' s' : 'midiendo…');
      sim.set('g', Tm ? EM.fix((4 * Math.PI * Math.PI * m * V) / (A * A * P * Tm * Tm), 3) : '—');
      sim.set('T0', EM.fix(T0, 4) + ' s (P = ' + EM.fix(P / 1e3, 2) + ' kPa en Popayán)');
    });
  });
})();
