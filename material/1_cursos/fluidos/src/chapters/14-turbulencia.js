/* Capítulo 14 — Turbulencia */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* 14.1 Experimento de Reynolds (ilustración) */
  EM.defineSim('reynolds-tinta', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('Re', { label: 'Número de Reynolds', min: 500, max: 12000, step: 10, value: 1500, log: true, fmt: (v) => v.toFixed(0) });
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('f', 'Fracción turbulenta del tubo');
    const Lp = 30; /* largo en diámetros */
    let parts = [], puffs = [], t = 0;
    sim.onChange = () => { parts = []; puffs = []; };
    const turbAt = (x) => { const Re = sim.p.Re; if (Re >= 4000) return 1; if (Re < 2000) return 0; for (const p of puffs) if (x > p.x - p.L && x < p.x) return 1; return 0; };
    sim.animate((dt) => {
      const Re = sim.p.Re, Ub = 5, h = Math.min(dt, 0.04);
      t += h;
      for (let k = 0; k < 6; k++) parts.push({ x: 0, y: 0.03 * gauss() * (Re > 4000 ? 2 : 0.1) });
      if (Re >= 2000 && Re < 4000) {
        const rate = 0.15 + 1.6 * Math.pow((Re - 2000) / 2000, 2);
        if (Math.random() < rate * h) puffs.push({ x: 0, L: 3 + 10 * ((Re - 2000) / 2000) });
        for (const p of puffs) { p.x += Ub * h; p.L += (Re > 2600 ? 1.5 : 0) * h * ((Re - 2600) / 1400); }
        puffs = puffs.filter((p) => p.x - p.L < Lp);
      }
      const keep = [];
      for (const q of parts) {
        const tb = turbAt(q.x), y = Math.max(-0.999, Math.min(0.999, q.y));
        const u = tb ? Ub * 1.22 * Math.pow(1 - Math.abs(y), 1 / 7) : 2 * Ub * (1 - y * y);
        q.x += u * h;
        if (tb) { q.y += gauss() * Math.sqrt(h) * 0.55; if (q.y > 1) q.y = 2 - q.y; if (q.y < -1) q.y = -2 - q.y; }
        if (q.x < Lp) keep.push(q);
      }
      parts = keep.length > 6000 ? keep.slice(-6000) : keep;
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Re = sim.p.Re;
      EM.draw.clear(cv);
      const x0 = 20, x1 = W - 20, cy = H / 2, R = H * 0.3, sx = (x1 - x0) / Lp;
      EM.flow.waterRect(ctx, x0, cy - R, x1 - x0, 2 * R, { alpha: 0.12, surface: false });
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, cy - R); ctx.lineTo(x1, cy - R); ctx.moveTo(x0, cy + R); ctx.lineTo(x1, cy + R); ctx.stroke();
      for (const p of puffs) { ctx.fillStyle = EM.alpha('--c2', 0.06); ctx.fillRect(x0 + Math.max(0, p.x - p.L) * sx, cy - R, Math.min(p.L, p.x) * sx, 2 * R); }
      ctx.fillStyle = EM.alpha('--c2', 0.55);
      for (const q of parts) ctx.fillRect(x0 + q.x * sx - 1, cy - q.y * R - 1, 2, 2);
      ctx.fillStyle = EM.col('--ink'); ctx.fillRect(x0 - 14, cy - 2, 16, 4);
      EM.text(ctx, 'tinta', x0 - 14, cy - 8, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'ilustración cualitativa', W - 22, H - 8, { size: 10.5, align: 'right', color: '--ink-3' });
      let ft = 0; for (let i = 0; i < 100; i++) ft += turbAt((Lp * (i + 0.5)) / 100); ft /= 100;
      sim.set('reg', Re < 2000 ? 'laminar' : Re < 4000 ? 'transición: bocanadas intermitentes' : 'turbulento');
      sim.set('f', EM.fix(100 * ft, 0) + ' %');
    });
  });

  /* 14.2 Señal turbulenta sintética */
  EM.defineSim('senal-turbulenta', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('I', { label: 'Intensidad de turbulencia <i>u</i>′<sub>rms</sub>/<i>U</i>', min: 0.01, max: 0.3, step: 0.005, value: 0.12, fmt: (v) => v.toFixed(3) });
    sim.slider('R', { label: 'Correlación entre <i>u</i>′ y <i>v</i>′', min: -0.8, max: 0.8, step: 0.01, value: -0.45, fmt: (v) => v.toFixed(2) });
    sim.out('m', 'Promedio acumulado de <i>u</i> / <i>U</i>', { hl: true });
    sim.out('rms', '<i>u</i>′<sub>rms</sub> medido');
    sim.out('uv', 'Correlación medida ⟨<i>u</i>′<i>v</i>′⟩/(<i>u</i>′<sub>rms</sub><i>v</i>′<sub>rms</sub>)');
    const NM = 80, w0 = 0.6;
    const modes = (seed) => Array.from({ length: NM }, (_, i) => { const w = w0 * Math.pow(400, i / (NM - 1)), dw = w * (Math.log(400) / (NM - 1)), E = Math.pow(1 + w / (3 * w0), -5 / 3) * Math.pow(w / (3 * w0) + 0.2, 0); return [w, Math.sqrt(2 * E * dw), Math.random() * 2 * Math.PI]; });
    const A = modes(), B = modes();
    const norm = (M) => Math.sqrt(M.reduce((s, m) => s + m[1] * m[1] / 2, 0));
    const nA = norm(A), nB = norm(B);
    const sig = (M, n, t) => M.reduce((s, m) => s + m[1] * Math.cos(m[0] * t + m[2]), 0) / n;
    let t = 0, hist = [], acc = { n: 0, su: 0, suu: 0, svv: 0, suv: 0 };
    sim.onChange = () => { acc = { n: 0, su: 0, suu: 0, svv: 0, suv: 0 }; };
    sim.animate((dt) => {
      const p = sim.p;
      for (let k = 0; k < 4; k++) {
        t += dt / 4;
        const a = sig(A, nA, t), b = sig(B, nB, t), u = p.I * a, v = 0.7 * p.I * (p.R * a + Math.sqrt(1 - p.R * p.R) * b);
        hist.push([t, u, v]); if (hist.length > 1200) hist.shift();
        acc.n++; acc.su += u; acc.suu += u * u; acc.svv += v * v; acc.suv += u * v;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const t1 = hist.length ? hist[hist.length - 1][0] : 0;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.5, xmin: t1 - 20, xmax: t1, ymin: 1 - 4 * p.I, ymax: 1 + 4 * p.I, xlabel: 't (s)', ylabel: 'u/U' });
      pl.frame();
      pl.path(hist.map((q) => [q[0], 1 + q[1]]), { color: '--c1', width: 1.2 });
      pl.hline(1 + (acc.n ? acc.su / acc.n : 0), { color: '--accent', label: 'promedio acumulado' });
      const s = new EM.Plot(ctx, { x: W * 0.25, y: H * 0.5, w: W * 0.5, h: H * 0.5, xmin: -4 * p.I, xmax: 4 * p.I, ymin: -3 * p.I, ymax: 3 * p.I, xlabel: "u'/U", ylabel: "v'/U", mt: 10 });
      s.frame();
      s.clip((c) => { c.fillStyle = EM.alpha('--c1', 0.35); for (let i = 0; i < hist.length; i += 2) c.fillRect(s.X(hist[i][1]) - 1, s.Y(hist[i][2]) - 1, 2, 2); });
      const n = acc.n || 1, mu = acc.su / n, ur = Math.sqrt(acc.suu / n - mu * mu), vr = Math.sqrt(acc.svv / n), cuv = acc.suv / n;
      sim.set('m', EM.fix(1 + mu, 4) + ' (n = ' + acc.n + ')');
      sim.set('rms', EM.fix(ur, 4) + ' (objetivo ' + EM.fix(p.I, 3) + ')');
      sim.set('uv', EM.fix(cuv / Math.max(1e-12, ur * vr), 3) + ' (objetivo ' + EM.fix(p.R, 2) + ')');
    });
  });

  /* 14.3 Ley de la pared y canal con longitud de mezcla */
  EM.defineSim('ley-pared', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('Rt', { label: 'Re<sub>τ</sub> = <i>u</i><sub>τ</sub><i>h</i>/ν', min: 100, max: 10000, step: 1, value: 395, log: true, fmt: (v) => v.toFixed(0) });
    sim.check('vd', { label: 'Comparar con longitud de mezcla ℓ = κy pura', value: false });
    sim.out('Ub', '<i>U</i><sub>b</sub><sup>+</sup> · <i>U</i><sub>c</sub><sup>+</sup>', { hl: true });
    sim.out('Re', 'Re<sub>b</sub> = 2<i>hU</i><sub>b</sub>/ν');
    sim.out('Cf', '<i>C</i><sub>f</sub> modelo · Dean (0.073 Re<sub>b</sub><sup>−1/4</sup>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const m = FL.mixingChannel(p.Rt), m2 = p.vd ? FL.mixingChannel(p.Rt, { model: 'vd' }) : null;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.5, xmax: 10000, ymin: 0, ymax: 30, xlog: true, xlabel: 'y⁺', ylabel: 'u⁺' });
      pl.frame();
      pl.fn((y) => y, { color: '--ink-3', width: 1.2, dash: [4, 4], to: 15 });
      pl.fn(FL.logLaw, { color: '--ink-3', width: 1.2, dash: [4, 4], from: 5 });
      pl.fn(FL.spaldingU, { color: '--c5', width: 1.6 });
      pl.xy(m.yp.slice(1), m.up.slice(1), { color: '--accent', width: 2.8 });
      if (m2) pl.xy(m2.yp.slice(1), m2.up.slice(1), { color: '--c2', width: 1.6, dash: [6, 3] });
      pl.band(5, 30, { color: '--ink-3', alpha: 0.06 });
      pl.label(0.7, 26, 'subcapa', { size: 11, color: '--ink-3' }); pl.label(7, 26, 'amortiguamiento', { size: 11, color: '--ink-3' }); pl.label(60, 26, 'zona logarítmica', { size: 11, color: '--ink-3' });
      pl.legend([{ label: 'u⁺ = y⁺ y ley log (κ = 0.41, B = 5.0)', color: '--ink-3', dash: [4, 4] }, { label: 'Spalding (1961)', color: '--c5' }, { label: 'canal: Nikuradse + van Driest', color: '--accent' }].concat(m2 ? [{ label: 'canal: ℓ = κy + van Driest', color: '--c2', dash: [6, 3] }] : []), 'br');
      const dean = 0.073 * Math.pow(m.Reb, -0.25);
      sim.set('Ub', EM.fix(m.Ub, 2) + ' · ' + EM.fix(m.Uc, 2));
      sim.set('Re', EM.fix(m.Reb, 0));
      sim.set('Cf', EM.fix(m.Cf * 1000, 3) + ' · ' + EM.fix(dean * 1000, 3) + ' ×10⁻³ (' + EM.fix((100 * (m.Cf - dean)) / dean, 1) + ' %)');
    });
  });

  /* 14.4 Escalas de Kolmogorov */
  const KEX = { cafe: ['Taza de café revuelta', 0.1, 0.04, 'agua'], rio: ['Río (profundidad 3 m)', 1.5, 3, 'agua'], tuneles: ['Túnel de viento con rejilla', 0.5, 0.05, 'aire'], licuadora: ['Licuadora', 5, 0.05, 'agua'], atm: ['Capa baja de la atmósfera', 5, 1000, 'aire'], nube: ['Nube de tormenta', 10, 3000, 'aire'] };
  const NU = { agua: 1.0e-6, aire: 1.5e-5 };
  EM.defineSim('kolmogorov', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('ex', { label: 'Ejemplo', options: Object.entries(KEX).map(([k, v]) => [k, v[0]]), value: 'cafe' });
    sim.slider('U', { label: 'Velocidad de los remolinos grandes', min: 0.01, max: 20, step: 0, value: 0.1, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) });
    sim.slider('L', { label: 'Tamaño de los remolinos grandes', min: 0.005, max: 5000, step: 0, value: 0.04, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.seg('f', { label: 'Fluido', options: [['agua', 'Agua'], ['aire', 'Aire']], value: 'agua' });
    sim.out('eps', 'Disipación ε ∼ <i>U</i>³/<i>L</i>', { hl: true });
    sim.out('eta', 'Escala de Kolmogorov η · τ<sub>η</sub>');
    sim.out('Re', 'Re<sub>L</sub> · <i>L</i>/η');
    sim.out('N', 'Puntos de malla para una simulación directa (<i>L</i>/η)³');
    sim.onChange = (id) => { if (id === 'ex') { const e = KEX[sim.p.ex]; sim.ctl.U.set(e[1], true); sim.ctl.L.set(e[2], true); sim.ctl.f.set(e[3], true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nu = NU[p.f];
      EM.draw.clear(cv);
      const eps = Math.pow(p.U, 3) / p.L, k = FL.kolmogorov(nu, eps), eta = k.eta;
      const kmin = 0.1 / p.L, kmax = 3 / eta;
      const Ef = (q) => FL.pope(q, eps, p.L, eta);
      const ys = []; for (let i = 0; i <= 200; i++) { const q = kmin * Math.pow(kmax / kmin, i / 200); ys.push(Ef(q)); }
      const ymax = Math.max(...ys) * 5, ymin = ymax * 1e-12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: kmin, xmax: kmax, ymin, ymax, xlog: true, ylog: true, xlabel: 'número de onda k (1/m)', ylabel: 'E(k) (m³/s²)' });
      pl.frame();
      pl.fn(Ef, { color: '--accent', width: 2.6 });
      pl.fn((q) => 1.5 * Math.pow(eps, 2 / 3) * Math.pow(q, -5 / 3), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.fn((q) => (2 * nu * q * q * Ef(q) * ymax) / Math.max(1e-30, eps * 10), { color: '--c2', width: 1.4, dash: [2, 3] });
      pl.vline(1 / p.L, { color: '--c1', label: '1/L' });
      pl.vline(1 / eta, { color: '--c2', label: '1/η' });
      pl.legend([{ label: 'espectro modelo (Pope)', color: '--accent' }, { label: '1.5 ε^{2/3} k^{−5/3}', color: '--ink-3', dash: [5, 4] }, { label: 'espectro de disipación (escala arbitraria)', color: '--c2', dash: [2, 3] }], 'bl');
      sim.set('eps', EM.sci(eps, 3) + ' W/kg');
      sim.set('eta', EM.si(eta, 'm', 3) + ' · ' + EM.si(k.tau, 's', 3));
      sim.set('Re', EM.sci((p.U * p.L) / nu, 3) + ' · ' + EM.sci(p.L / eta, 3));
      sim.set('N', EM.sci(Math.pow(p.L / eta, 3), 3));
    });
  });
})();
