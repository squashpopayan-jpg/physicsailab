/* Capítulo 16 — Dinámica semiclásica de los electrones */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;
  const PI = Math.PI;

  /* 16.2 Velocidad y masa efectiva */
  EM.defineSim('masa-efectiva', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('k', { label: 'k (π/a)', min: -1, max: 1, step: 0.005, value: 0.25, fmt: (v) => v.toFixed(3) });
    sim.slider('tp', { label: 't′/t', min: -0.4, max: 0.4, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('E', 'E (t)', { hl: true });
    sim.out('v', 'v (ta/ħ)');
    sim.out('m', 'm* (ħ²/(ta²))');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const E = (k) => -2 * Math.cos(k) - 2 * p.tp * Math.cos(2 * k);
      const v = (k) => 2 * Math.sin(k) + 4 * p.tp * Math.sin(2 * k);
      const c = (k) => 2 * Math.cos(k) + 8 * p.tp * Math.cos(2 * k);
      const h = H / 3;
      const rows = [
        ['E/t', (x) => E(x * PI), -3, 3, '--c1'],
        ['v', (x) => v(x * PI), -3, 3, '--c2'],
        ['m*', (x) => 1 / c(x * PI), -5, 5, '--c3']
      ];
      rows.forEach(([lab, f, lo, hi, col], i) => {
        const pl = new EM.Plot(ctx, { x: 0, y: i * h, w: W, h, xmin: -1, xmax: 1, ymin: lo, ymax: hi, ylabel: lab, xlabel: i === 2 ? 'k (π/a)' : '', mb: i === 2 ? 36 : 14, mt: 8 });
        pl.frame();
        pl.fn(f, { color: col, width: 2.2, n: 800, breakJumps: true });
        pl.vline(p.k, { color: '--accent', dash: [] });
        pl.dot(p.k, f(p.k), { color: '--accent', r: 4.5 });
      });
      const k = p.k * PI;
      sim.set('E', EM.fix(E(k), 4));
      sim.set('v', EM.fix(v(k), 4));
      sim.set('m', Math.abs(c(k)) < 1e-6 ? '∞ (punto de inflexión)' : EM.fix(1 / c(k), 4) + (c(k) < 0 ? ' (negativa)' : ''));
    });
  });

  /* 16.3 Oscilaciones de Bloch */
  EM.defineSim('bloch-osc', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('F', { label: 'Fuerza eEa (en t)', min: 0.02, max: 0.2, step: 0.005, value: 0.08, fmt: (v) => v.toFixed(3) });
    sim.slider('k0', { label: 'k₀ inicial (π/a)', min: -1, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('TB', 'Período T_B = 2πħ/(eEa)', { hl: true });
    sim.out('amp', 'Amplitud W/(eE) = 4t/F');
    sim.out('t', 'Tiempo (ħ/t)');
    const N = 300;
    let st = null, V = null, t = 0, hist = [];
    const init = () => {
      V = new Float64Array(N);
      for (let i = 0; i < N; i++) V[i] = sim.p.F * (i - N / 2);
      st = SS.packet(N, N / 2 + 40, sim.p.k0 * PI, 10); t = 0; hist = [];
    };
    init();
    sim.onChange = init;
    sim.resetButton(init);
    sim.animate(() => {
      const dt = 0.05;
      for (let s = 0; s < 6; s++) { SS.cnStep(st.re, st.im, V, dt); t += dt; }
      hist.push([t, SS.meanPos(st.re, st.im)]);
      if (t > 3 * ((2 * PI) / sim.p.F)) init();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const h1 = H * 0.42;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: 0, xmax: N, ymin: 0, ymax: 0.06, ylabel: '|ψ|²', mb: 18 });
      pl.frame();
      pl.xy(Array.from({ length: N }, (_, i) => i), Array.from({ length: N }, (_, i) => st.re[i] * st.re[i] + st.im[i] * st.im[i]), { color: '--c1', width: 1.6, fill: '--c1', fillAlpha: 0.2 });
      const TB = (2 * PI) / p.F, x0 = N / 2 + 40, k0 = p.k0 * PI;
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: 3 * TB, ymin: x0 - 4.5 / p.F - 5, ymax: x0 + 4.5 / p.F + 5, xlabel: 't (ħ/t)', ylabel: '⟨x⟩ (a)' });
      p2.frame();
      p2.fn((tt) => x0 + (-2 * Math.cos(k0) + 2 * Math.cos(k0 - p.F * tt)) / p.F, { color: '--c2', width: 1.4, dash: [5, 4] });
      if (hist.length > 1) p2.xy(hist.map((q) => q[0]), hist.map((q) => q[1]), { color: '--c1', width: 2.4 });
      for (let n = 1; n <= 2; n++) p2.vline(n * TB, { color: '--grid-2' });
      p2.legend([{ label: 'Crank–Nicolson', color: '--c1' }, { label: 'semiclásico', color: '--c2', dash: [5, 4] }], 'tr');
      sim.set('TB', EM.fix(TB, 2) + ' ħ/t');
      sim.set('amp', EM.fix(4 / p.F, 1) + ' a');
      sim.set('t', EM.fix(t, 1));
    });
  });

  /* 16.4 Huecos */
  EM.defineSim('huecos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('E', { label: 'Campo (desplazamiento de k por unidad de tiempo)', min: -0.6, max: 0.6, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.slider('h', { label: 'Estado vacío inicial k_e (π/a)', min: -1, max: 1, step: 1 / 12, value: 0.75, fmt: (v) => v.toFixed(2) });
    sim.out('j', 'Corriente de la banda (unidades de e·ta/ħ)', { hl: true });
    sim.out('vh', '+e · v(k vacío)');
    const N = 24;
    let shift = 0;
    sim.onChange = (id) => { if (id === 'h') shift = 0; };
    sim.resetButton(() => { shift = 0; });
    sim.animate((dt) => { shift += sim.p.E * dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wrap = (k) => { let q = ((k + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return q; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -1, xmax: 1, ymin: -2.5, ymax: 2.5, xlabel: 'k (π/a)', ylabel: 'E (t)' });
      pl.frame();
      pl.fn((x) => -2 * Math.cos(x * PI), { color: '--ink-3', width: 1.5 });
      const ie = Math.max(0, Math.min(N - 1, Math.round(((p.h + 1) * N) / 2 - 0.5)));
      let J = 0, kv = 0;
      for (let i = 0; i < N; i++) {
        const k0 = -1 + (2 * (i + 0.5)) / N;
        const k = wrap(k0 * PI - shift);
        if (i === ie) {
          kv = k;
          ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pl.X(k / PI), pl.Y(-2 * Math.cos(k)), 6.5, 0, 7); ctx.stroke();
        } else {
          pl.dot(k / PI, -2 * Math.cos(k), { color: '--c1', r: 5 });
          J += -2 * Math.sin(k); /* carga −e por la velocidad 2 sen k */
        }
      }
      /* J = Σ_ocupados (−e) v(k), v = 2 sin k (unidades ta/ħ); con e = 1 */
      const vk = 2 * Math.sin(kv);
      EM.text(ctx, 'estado vacío (hueco)', pl.X(kv / PI) + 10, pl.Y(-2 * Math.cos(kv)) - 10, { size: 11.5, color: '--c2', halo: true });
      /* diagrama del hueco: carga positiva con la velocidad del estado vacío */
      const x0 = W * 0.66, wv = W - x0 - 10;
      EM.text(ctx, 'equivale a una carga +e', x0, 30, { size: 12, color: '--ink-2', weight: 600 });
      EM.text(ctx, 'con velocidad v(k vacío):', x0, 48, { size: 12, color: '--ink-2' });
      EM.draw.charge(ctx, x0 + wv / 2, H / 2, 1, { r: 14 });
      if (Math.abs(vk) > 0.02) EM.draw.arrow(ctx, x0 + wv / 2, H / 2 + 30, x0 + wv / 2 + vk * wv * 0.2, H / 2 + 30, { color: '--c2', width: 2.5 });
      sim.set('j', EM.fix(J, 4));
      sim.set('vh', EM.fix(vk, 4));
    });
  });

  /* 16.5 Dos portadores en campo magnético */
  EM.defineSim('dos-bandas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Densidad de electrones n', min: 0, max: 2, step: 0.01, value: 1, unit: '×10²³ m⁻³', fmt: (v) => v.toFixed(2) });
    sim.slider('p', { label: 'Densidad de huecos p', min: 0, max: 2, step: 0.01, value: 0.6, unit: '×10²³ m⁻³', fmt: (v) => v.toFixed(2) });
    sim.slider('mn', { label: 'Movilidad µ_n', min: 0.01, max: 2, step: 0.01, value: 0.8, unit: 'm²/V·s', fmt: (v) => v.toFixed(2) });
    sim.slider('mp', { label: 'Movilidad µ_p', min: 0.01, max: 2, step: 0.01, value: 0.4, unit: 'm²/V·s', fmt: (v) => v.toFixed(2) });
    sim.out('rh0', 'R_H en campo débil', { hl: true });
    sim.out('rhinf', 'R_H en campo fuerte 1/e(p − n)');
    sim.out('mr', 'Δρ/ρ₀ a 10 T');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, e = SS.e;
      EM.draw.clear(cv);
      const n = p.n * 1e23, pp = p.p * 1e23;
      const rho = (B) => {
        const sn = n * e * p.mn, sp = pp * e * p.mp, bn = p.mn * B, bp = p.mp * B;
        const sxx = sn / (1 + bn * bn) + sp / (1 + bp * bp), sxy = -sn * bn / (1 + bn * bn) + sp * bp / (1 + bp * bp);
        const d = sxx * sxx + sxy * sxy;
        return [sxx / d, sxy / d];
      };
      const r0 = rho(1e-9)[0];
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 10, ymin: 0, ymax: Math.min(60, Math.max(1.2, rho(10)[0] / r0 * 1.1)), xlabel: 'B (T)', ylabel: 'ρ_{xx}(B)/ρ_{xx}(0)' });
      pl.frame();
      pl.fn((B) => rho(B)[0] / r0, { color: '--c1', width: 2.4 });
      const RH = (B) => rho(B)[1] / B;
      const vals = []; for (let i = 1; i <= 100; i++) vals.push(RH(i / 10) * 1e5);
      const lim = Math.max(0.5, ...vals.map(Math.abs)) * 1.1;
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 10, ymin: -lim, ymax: lim, xlabel: 'B (T)', ylabel: 'R_H (10⁻⁵ m³/C)' });
      p2.frame();
      p2.fn((B) => RH(Math.max(B, 1e-3)) * 1e5, { color: '--c2', width: 2.4 });
      const rh0 = (pp * p.mp * p.mp - n * p.mn * p.mn) / (e * Math.pow(pp * p.mp + n * p.mn, 2));
      sim.set('rh0', EM.sci(rh0, 3) + ' m³/C');
      sim.set('rhinf', Math.abs(pp - n) > 1 ? EM.sci(1 / (e * (pp - n)), 3) + ' m³/C' : 'compensado: R_H → 0 y ρ_{xx} ∝ B²');
      sim.set('mr', EM.fix(rho(10)[0] / r0 - 1, 3));
    });
  });
})();
