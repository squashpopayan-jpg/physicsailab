/* Capítulo 2 — Propiedades de los fluidos */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, W = FL.water, A = FL.air;
  const K0 = 273.15;

  /* 2.1 Densidad y compresibilidad del agua */
  EM.defineSim('densidad-agua', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('v', { label: 'Propiedad', options: [['rho', 'densidad'], ['beta', 'expansión β'], ['K', 'módulo K'], ['c', 'sonido c']], value: 'rho' });
    sim.slider('T', { label: 'Temperatura', min: 0.01, max: 100, step: 0.01, value: 4, unit: '°C', fmt: (v) => v.toFixed(2) });
    sim.check('zoom', { label: 'Acercar a 0–10 °C', value: true });
    sim.out('rho', 'Densidad ρ', { hl: true });
    sim.out('beta', 'Expansión térmica β');
    sim.out('K', 'Módulo volumétrico <i>K</i><sub>s</sub> = ρ<i>c</i>²');
    sim.out('c', 'Velocidad del sonido');
    const beta = (T) => { const h = 0.01; return -(W.rho(T + h) - W.rho(T - h)) / (2 * h) / W.rho(T); };
    const F = { rho: [(T) => W.rho(T), 'ρ (kg/m³)'], beta: [(T) => beta(T) * 1e4, 'β (10⁻⁴ K⁻¹)'], K: [(T) => W.K(T) / 1e9, 'K_s (GPa)'], c: [(T) => W.c(T), 'c (m/s)'] };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const t0 = 0.01, t1 = p.zoom ? 10 : 100, [f, lab] = F[p.v];
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 200; i++) { const v = f(K0 + t0 + ((t1 - t0) * i) / 200); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const pad = (hi - lo) * 0.08 || 1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: t1, ymin: lo - pad, ymax: hi + pad, xlabel: 'T (°C)', ylabel: lab, ml: 62 });
      pl.frame();
      if (p.v === 'beta') pl.hline(0, { color: '--ink-3' });
      pl.fn((t) => f(K0 + Math.max(0.01, t)), { color: '--water', width: 2.6 });
      const T = K0 + p.T;
      if (p.T <= t1) pl.dot(p.T, f(T), { color: '--accent', r: 6 });
      if (p.v === 'rho') pl.vline(3.974, { color: '--c2', label: 'máximo a 3.97 °C' });
      sim.set('rho', EM.fix(W.rho(T), 3) + ' kg/m³');
      sim.set('beta', EM.sci(beta(T), 3) + ' K⁻¹');
      sim.set('K', EM.fix(W.K(T) / 1e9, 3) + ' GPa');
      sim.set('c', EM.fix(W.c(T), 1) + ' m/s');
    });
  });

  /* 2.2 Flujo de Couette entre placas */
  const FLU = {
    agua: ['Agua', (T) => W.rho(T), (T) => W.mu(T)], aire: ['Aire (1 atm)', (T) => A.rho(T), (T) => A.mu(T)],
    aceite: ['Aceite SAE 30 (20 °C)', () => 891, () => 0.29], glicerina: ['Glicerina', () => 1261, (T) => FL.glycerinMu(T)], miel: ['Miel (20 °C)', () => 1420, () => 10]
  };
  EM.defineSim('couette-placas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Fluido', options: Object.entries(FLU).map(([k, v]) => [k, v[0]]), value: 'aceite' });
    sim.slider('T', { label: 'Temperatura (agua, aire, glicerina)', min: 0, max: 90, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('U', { label: 'Velocidad de la placa <i>U</i>', min: 0.05, max: 5, step: 0.05, value: 1, unit: 'm/s', fmt: (v) => v.toFixed(2) });
    sim.slider('h', { label: 'Espesor de la película <i>h</i>', min: 0.05, max: 5, step: 0.05, value: 0.5, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('A', { label: 'Área de la placa', min: 0.01, max: 2, step: 0.01, value: 0.5, unit: 'm²', fmt: (v) => v.toFixed(2) });
    sim.out('tau', 'Esfuerzo cortante τ = μ<i>U</i>/<i>h</i>', { hl: true });
    sim.out('F', 'Fuerza sobre la placa');
    sim.out('P', 'Potencia disipada');
    sim.out('Re', 'Reynolds ρ<i>Uh</i>/μ');
    const N = 140, px = new Float32Array(N), py = new Float32Array(N);
    for (let i = 0; i < N; i++) { px[i] = Math.random(); py[i] = 0.03 + 0.94 * Math.random(); }
    let shift = 0;
    sim.animate((dt) => {
      const sp = 0.25 * dt;
      shift = (shift + sp) % 1;
      for (let i = 0; i < N; i++) { px[i] += sp * py[i]; if (px[i] > 1) px[i] -= 1; }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, f = FLU[p.f], T = K0 + p.T;
      EM.draw.clear(cv);
      const mu = f[2](T), rho = f[1](T), tau = (mu * p.U) / (p.h / 1000);
      const x0 = 20, x1 = Wc * 0.62, yb = H - 40, yt = 50;
      ctx.fillStyle = EM.alpha(p.f === 'aire' ? '--c6' : p.f === 'agua' ? '--water' : '--gold', 0.18);
      ctx.fillRect(x0, yt, x1 - x0, yb - yt);
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(x0, yb, x1 - x0, 14); ctx.fillRect(x0 + 40, yt - 16, x1 - x0 - 80, 16);
      EM.draw.support(ctx, (x0 + x1) / 2, yb + 15, x1 - x0, 'up');
      EM.draw.arrow(ctx, x1 - 30, yt - 26, x1 + 20, yt - 26, { color: '--accent', width: 2.2 });
      EM.text(ctx, 'U = ' + EM.fix(p.U, 2) + ' m/s', x1 - 30, yt - 34, { size: 12, color: '--accent', align: 'right' });
      ctx.fillStyle = EM.col('--ink-2');
      for (let i = 0; i < N; i++) { const yy = yb - py[i] * (yb - yt); ctx.fillRect(x0 + px[i] * (x1 - x0) - 1.5, yy - 1.5, 3, 3); }
      /* perfil */
      const xp = x0 + 30, L = (x1 - x0) * 0.4;
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xp, yb); ctx.lineTo(xp, yt); ctx.stroke();
      for (let k = 1; k <= 6; k++) { const s = k / 6, yy = yb - s * (yb - yt); EM.draw.arrow(ctx, xp, yy, xp + s * L, yy, { color: '--c1', width: 1.4 }); }
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xp, yb); ctx.lineTo(xp + L, yt); ctx.stroke();
      EM.text(ctx, 'u(y) = U y/h', xp + L * 0.55, yt + 30, { size: 12, color: '--c1', halo: true });
      /* gráfica F vs U */
      const pl = new EM.Plot(ctx, { x: x1 + 30, y: 10, w: Wc - x1 - 30, h: H - 10, xmin: 0, xmax: 5, ymin: 0, ymax: Math.max(1e-6, (mu * 5) / (p.h / 1000)) * p.A * 1.05, xlabel: 'U (m/s)', ylabel: 'F (N)', ml: 58 });
      pl.frame();
      pl.fn((u) => ((mu * u) / (p.h / 1000)) * p.A, { color: '--accent', width: 2.2 });
      pl.dot(p.U, tau * p.A, { color: '--accent', r: 5 });
      const Re = (rho * p.U * (p.h / 1000)) / mu;
      sim.set('tau', EM.sci(tau, 3) + ' Pa');
      sim.set('F', EM.sci(tau * p.A, 3) + ' N');
      sim.set('P', EM.sci(tau * p.A * p.U, 3) + ' W');
      sim.set('Re', EM.sci(Re, 3) + (Re > 1500 ? ' (el flujo dejaría de ser laminar)' : ' (laminar)'));
    });
  });

  /* 2.3 Viscosidad contra temperatura */
  EM.defineSim('viscosidad-T', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const L = FL.liq;
    const CUR = [
      ['agua', 'Agua', '--water', W, 0, 200], ['glicerina', 'Glicerina', '--gold', { mu: FL.glycerinMu, rho: () => 1261 }, 0, 100],
      ['etanol', 'Etanol', '--c5', L.etanol, -20, L.etanol.Tb - K0 - 2], ['metanol', 'Metanol', '--c4', L.metanol, -20, L.metanol.Tb - K0 - 2],
      ['tolueno', 'Tolueno', '--c3', L.tolueno, -20, L.tolueno.Tb - K0 - 2], ['heptano', 'n-Heptano', '--c6', L.heptano, -20, L.heptano.Tb - K0 - 2],
      ['aire', 'Aire', '--c2', A, -20, 200]
    ];
    sim.select('f', { label: 'Fluido para la lectura', options: CUR.map((c) => [c[0], c[1]]), value: 'agua' });
    sim.slider('T', { label: 'Temperatura', min: -20, max: 200, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('mu', 'Viscosidad dinámica μ', { hl: true });
    sim.out('nu', 'Viscosidad cinemática ν');
    sim.out('r', 'Rango válido (líquido a 1 atm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -20, xmax: 200, ymin: 1e-5, ymax: 20, ylog: true, xlabel: 'T (°C)', ylabel: 'μ (Pa·s)' });
      pl.frame();
      for (const [k, n, col, o, a, b] of CUR) pl.fn((t) => o.mu(t + K0), { color: col, width: k === p.f ? 3 : 1.8, from: a, to: b });
      pl.fn((t) => A.sutherland(t + K0), { color: '--c2', width: 1.4, dash: [5, 4] });
      pl.legend(CUR.map((c) => ({ label: c[1], color: c[2] })).concat([{ label: 'Sutherland', color: '--c2', dash: [5, 4] }]), 'tr');
      const c = CUR.find((q) => q[0] === p.f), ok = p.T >= c[4] && p.T <= c[5];
      if (ok) {
        const mu = c[3].mu(p.T + K0), rho = c[3].rho(p.T + K0);
        pl.dot(p.T, mu, { color: '--accent', r: 6 });
        sim.set('mu', EM.sci(mu, 4) + ' Pa·s');
        sim.set('nu', EM.sci(mu / rho, 4) + ' m²/s');
      } else { sim.set('mu', 'fuera del rango'); sim.set('nu', '—'); }
      sim.set('r', EM.fix(c[4], 0) + ' a ' + EM.fix(c[5], 0) + ' °C' + (p.f === 'agua' ? ' (sobre 100 °C, líquido saturado)' : ''));
    });
  });

  /* 2.4 Presión de vapor, ebullición en altura y cavitación */
  EM.defineSim('presion-vapor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('z', { label: 'Altitud del lugar', min: 0, max: 8849, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('Tw', { label: 'Temperatura del agua (cavitación)', min: 5, max: 95, step: 1, value: 30, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('p', { label: 'Presión estática absoluta en el flujo', min: 5, max: 300, step: 1, value: 80, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('V', { label: 'Velocidad del agua', min: 0, max: 30, step: 0.5, value: 12, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.out('P', 'Presión atmosférica (US 1976)');
    sim.out('Te', 'Temperatura de ebullición', { hl: true });
    sim.out('pv', 'Presión de vapor del agua');
    sim.out('sc', 'Número de cavitación σ<sub>c</sub>');
    const PLACES = [['Buenaventura', 0], ['Popayán', 1760], ['Bogotá', 2640], ['Volcán Puracé', 4650], ['Everest', 8849]];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Pa = FL.atm(p.z).P, Te = W.tsat(Pa) - K0;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.6, h: H, xmin: 0, xmax: 110, ymin: 0, ymax: 120, xlabel: 'T (°C)', ylabel: 'p_v (kPa)' });
      pl.frame();
      pl.fn((t) => W.psat(t + K0) / 1000, { color: '--water', width: 2.6 });
      pl.hline(Pa / 1000, { color: '--c2', label: 'presión atmosférica', labelRight: false });
      pl.vline(Te, { color: '--c2' });
      pl.dot(Te, Pa / 1000, { color: '--accent', r: 6, label: EM.fix(Te, 1) + ' °C', dx: -8, align: 'right' });
      for (const [n, z] of PLACES) { const P = FL.atm(z).P / 1000, T = W.tsat(P * 1000) - K0; pl.dot(T, P, { color: '--ink-3', r: 3, label: n, dx: 6, dy: 12 }); }
      /* barras de cavitación */
      const pv = W.psat(p.Tw + K0), rho = W.rho(p.Tw + K0), q = 0.5 * rho * p.V * p.V, sc = (p.p * 1000 - pv) / Math.max(q, 1e-9);
      const bx = Wc * 0.66, bw = Wc * 0.3, top = 30, bh = H - 80, sc2 = bh / 300e3;
      EM.text(ctx, 'Presiones en el flujo', bx, 18, { size: 12, weight: 650, color: '--ink-2' });
      const bars = [['p', p.p * 1000, '--c1'], ['p_v', pv, '--water'], ['½ρV²', q, '--c2']];
      bars.forEach(([n, v, col], i) => {
        const x = bx + i * (bw / 3) + 8, w = bw / 3 - 16, h = Math.min(bh, v * sc2);
        ctx.fillStyle = EM.alpha(col, 0.55); ctx.fillRect(x, top + bh - h, w, h);
        EM.text(ctx, n, x + w / 2, top + bh + 16, { size: 12, align: 'center', color: col, weight: 600 });
        EM.text(ctx, EM.fix(v / 1000, 1), x + w / 2, top + bh - h - 6, { size: 11, align: 'center', color: '--ink-2' });
      });
      ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(bx, top + bh + 0.5); ctx.lineTo(bx + bw, top + bh + 0.5); ctx.stroke();
      EM.text(ctx, sc < 1 ? 'riesgo de cavitación (σ_c < 1)' : 'sin cavitación aparente', bx + bw / 2, H - 14, { size: 12, align: 'center', color: sc < 1 ? '--c2' : '--c3', weight: 650 });
      sim.set('P', EM.fix(Pa / 1000, 2) + ' kPa');
      sim.set('Te', EM.fix(Te, 2) + ' °C');
      sim.set('pv', EM.fix(pv / 1000, 3) + ' kPa a ' + p.Tw + ' °C');
      sim.set('sc', p.V > 0 ? EM.fix(sc, 3) : '∞');
    });
  });
})();
