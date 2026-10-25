/* Capítulo 10 — El modelo de Drude */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin, DATA = EM.data;
  const PI = Math.PI;

  /* 10.2 Gas de electrones con choques */
  EM.defineSim('drude-gas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Campo eléctrico E (unidades arbitrarias)', min: 0, max: 2, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('tau', { label: 'Tiempo de relajación τ', min: 0.1, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('vd', 'Arrastre medido ⟨v_x⟩', { hl: true });
    sim.out('th', 'Teoría −eEτ/m');
    sim.out('r', 'Arrastre / velocidad térmica');
    const N = 400, v0 = 3, rng = L.rng(9);
    const P = [];
    for (let i = 0; i < N; i++) { const a = 2 * PI * rng(); P.push({ x: rng(), y: rng(), vx: v0 * Math.cos(a), vy: v0 * Math.sin(a) }); }
    let avg = 0, hist = [];
    sim.onChange = () => { hist = []; };
    sim.animate(() => {
      const dt = 0.01, steps = 4;
      for (let s = 0; s < steps; s++) {
        let sum = 0;
        for (const q of P) {
          if (rng() < dt / sim.p.tau) { const a = 2 * PI * rng(); q.vx = v0 * Math.cos(a); q.vy = v0 * Math.sin(a); }
          q.vx += -sim.p.E * dt;
          q.x = (q.x + q.vx * dt * 0.02 + 1) % 1; q.y = (q.y + q.vy * dt * 0.02 + 1) % 1;
          sum += q.vx;
        }
        hist.push(sum / N);
        if (hist.length > 3000) hist.shift();
      }
      /* se descarta el transitorio de 3τ tras cada cambio */
      const skip = Math.min(hist.length - 1, Math.round((3 * sim.p.tau) / 0.01));
      const tail = hist.slice(skip);
      avg = tail.length ? tail.reduce((a, b) => a + b, 0) / tail.length : 0;
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wl = W * 0.55, r = { x: 10, y: 10, w: wl - 20, h: H - 20 };
      ctx.fillStyle = EM.alpha('--c6', 0.08); ctx.fillRect(r.x, r.y, r.w, r.h);
      /* iones */
      ctx.fillStyle = EM.alpha('--ink-3', 0.35);
      for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) { ctx.beginPath(); ctx.arc(r.x + ((i + 0.5) / 12) * r.w, r.y + ((j + 0.5) / 8) * r.h, 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = EM.col('--c1');
      for (const q of P) { ctx.beginPath(); ctx.arc(r.x + q.x * r.w, r.y + q.y * r.h, 2.2, 0, 7); ctx.fill(); }
      if (p.E > 0) { EM.draw.arrow(ctx, r.x + r.w - 80, r.y + 18, r.x + r.w - 20, r.y + 18, { color: '--c2', width: 2.5 }); EM.text(ctx, 'E', r.x + r.w - 54, r.y + 36, { size: 14, italic: true, weight: 700, color: '--c2' }); }
      const pl = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: hist.length || 1, ymin: -4, ymax: 1, xlabel: 'pasos', ylabel: '⟨v_x⟩ instantáneo', ml: 48 });
      pl.frame();
      if (hist.length) pl.xy(hist.map((_, i) => i), hist, { color: '--c1', width: 1 });
      pl.hline(-p.E * p.tau, { color: '--c2', label: '−eEτ/m', labelRight: true, dash: [5, 4] });
      sim.set('vd', EM.fix(avg, 3));
      sim.set('th', EM.fix(-p.E * p.tau, 3));
      sim.set('r', EM.fix(Math.abs(p.E * p.tau) / v0, 3));
    });
  });

  /* 10.3 Bloch–Grüneisen */
  const J5 = (z) => L.gl((x) => (x < 1e-8 ? x * x * x : Math.pow(x, 5) / (Math.expm1(x) * -Math.expm1(-x))), 0, Math.min(z, 80), 32, 6);
  EM.defineSim('bloch-gruneisen', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r0', { label: 'Resistividad residual ρ₀', min: 0.0001, max: 1, step: 0.0001, log: true, value: 0.01, unit: 'µΩ·cm', fmt: (v) => EM.sci(v, 2) });
    sim.slider('th', { label: 'θ_R', min: 100, max: 500, step: 1, value: 320, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('log', { label: 'Escalas logarítmicas', value: false });
    sim.out('r300', 'ρ(300 K)', { hl: true });
    sim.out('r77', 'ρ(77 K)');
    sim.out('rrr', 'RRR = ρ(300 K)/ρ(4 K)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const A = 1.55 / (Math.pow(273 / p.th, 5) * J5(p.th / 273));
      const rf = (T) => A * Math.pow(T / p.th, 5) * J5(p.th / T);
      const pl = new EM.Plot(ctx, p.log ? { x: 0, y: 0, w: W, h: H, xmin: 2, xmax: 400, xlog: true, ymin: 1e-5, ymax: 5, ylog: true, xlabel: 'T (K)', ylabel: 'ρ (µΩ·cm)' } : { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 400, ymin: 0, ymax: 2.6, xlabel: 'T (K)', ylabel: 'ρ (µΩ·cm)' });
      pl.frame();
      pl.fn(rf, { color: '--c2', width: 1.6, dash: [5, 4], n: 300 });
      pl.fn((T) => p.r0 + rf(T), { color: '--c1', width: 2.6, n: 300 });
      pl.hline(p.r0, { color: '--c3', label: 'ρ₀', dash: [3, 3] });
      for (const [T, r] of [[77, 0.21], [273, 1.55], [295, 1.70]]) pl.dot(T, r, { color: '--accent', r: 5 });
      pl.legend([{ label: 'total ρ₀ + ρ_{fon}', color: '--c1' }, { label: 'fonones (Bloch–Grüneisen)', color: '--c2', dash: [5, 4] }, { label: 'Cu medido', color: '--accent', kind: 'dot' }], p.log ? 'br' : 'tl');
      const r300 = p.r0 + rf(300), r4 = p.r0 + rf(4);
      sim.set('r300', EM.fix(r300, 3) + ' µΩ·cm');
      sim.set('r77', EM.fix(p.r0 + rf(77), 3) + ' µΩ·cm');
      sim.set('rrr', EM.fix(r300 / r4, 0));
    });
  });

  /* 10.4 Efecto Hall */
  const HALLM = { Cu: [8.47e28, -1 / 1.5], Na: [2.65e28, -1 / 1.2], Al: [18.1e28, 1 / 0.3], 'Si tipo n (10¹⁶ cm⁻³)': [1e22, -1], 'Si tipo p (10¹⁶ cm⁻³)': [1e22, 1] };
  EM.defineSim('hall', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.keys(HALLM).map((k) => [k, k]), value: 'Cu' });
    sim.slider('I', { label: 'Corriente I', min: 0.01, max: 10, step: 0.01, value: 1, unit: 'A', fmt: (v) => v.toFixed(2) });
    sim.slider('B', { label: 'Campo B', min: 0, max: 2, step: 0.01, value: 1, unit: 'T', fmt: (v) => v.toFixed(2) });
    sim.slider('t', { label: 'Espesor t', min: 1e-6, max: 1e-3, step: 1e-6, log: true, value: 1e-4, fmt: (v) => EM.si(v, 'm', 2) });
    sim.out('vh', 'Voltaje de Hall', { hl: true });
    sim.out('rh', 'R_H medido (≈ ±1/(n_{ef} e))');
    sim.out('car', 'Portadores efectivos');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [n, f] = HALLM[p.m], q = f > 0 ? 1 : -1;
      const RH = f / (n * SS.e); /* f = signo/(factor) */
      const VH = (RH * p.I * p.B) / p.t;
      const r = { x: W * 0.08, y: H * 0.22, w: W * 0.6, h: H * 0.56 };
      ctx.fillStyle = EM.alpha('--c6', 0.12); ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(r.x, r.y, r.w, r.h);
      /* carga acumulada en los bordes */
      const s = Math.min(1, p.B) * Math.sign(q);
      const top = s > 0 ? '+' : '−', bot = s > 0 ? '−' : '+';
      if (p.B > 0) for (let i = 0; i < 9; i++) {
        EM.text(ctx, top, r.x + ((i + 0.5) / 9) * r.w, r.y - 8, { size: 16, align: 'center', weight: 700, color: top === '+' ? '--pos' : '--neg' });
        EM.text(ctx, bot, r.x + ((i + 0.5) / 9) * r.w, r.y + r.h + 20, { size: 16, align: 'center', weight: 700, color: bot === '+' ? '--pos' : '--neg' });
      }
      /* portadores: avanzan en la dirección de la corriente (positivos) o en contra (electrones) */
      const rng = L.rng(4);
      for (let i = 0; i < 70; i++) {
        const y0 = rng(), sp = 0.15 + 0.1 * rng();
        let x = (rng() + q * sp * t * 0.3) % 1; if (x < 0) x += 1;
        const yy = y0 * 0.85 + 0.075;
        ctx.fillStyle = EM.col(q > 0 ? '--pos' : '--neg');
        ctx.beginPath(); ctx.arc(r.x + x * r.w, r.y + yy * r.h, 3.2, 0, 7); ctx.fill();
      }
      EM.draw.arrow(ctx, r.x - 30, r.y + r.h / 2, r.x - 4, r.y + r.h / 2, { color: '--c2', width: 2.5 });
      EM.text(ctx, 'I', r.x - 26, r.y + r.h / 2 - 10, { size: 14, italic: true, weight: 700, color: '--c2' });
      EM.draw.current(ctx, r.x + r.w + 40, r.y + 20, -1, { r: 12 });
      EM.text(ctx, 'B entra', r.x + r.w + 58, r.y + 25, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'fuerza de Lorentz', r.x + r.w + 20, r.y + r.h - 20, { size: 11.5, color: '--ink-3' });
      sim.set('vh', EM.si(Math.abs(VH), 'V', 3) + (VH > 0 ? ' (borde superior positivo)' : ' (borde superior negativo)'));
      sim.set('rh', EM.sci(RH, 3) + ' m³/C');
      sim.set('car', (q > 0 ? 'huecos' : 'electrones') + ', n_{ef} = ' + EM.sci(Math.abs(1 / (RH * SS.e)) * 1e-6, 3) + ' cm⁻³');
    });
  });

  /* 10.5 Reflectividad de Drude */
  const MET = { Na: [6.04, 1, 3.2e-14], K: [4.39, 1, 4.1e-14], Al: [15.8, 1, 0.8e-14], Ag: [8.99, 3.7, 4.0e-14] };
  EM.defineSim('drude-optica', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: [['Na', 'Sodio'], ['K', 'Potasio'], ['Al', 'Aluminio'], ['Ag', 'Plata (con ε∞ = 3.7)']], value: 'Ag' });
    sim.slider('f', { label: 'τ relativo al de 273 K', min: 0.01, max: 1, step: 0.01, log: true, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('wp', 'ħω_p', { hl: true });
    sim.out('edge', 'Borde de transparencia');
    sim.out('Rv', 'Reflectividad a 550 nm');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [Ep, ei, tau] = MET[p.m], g = SS.hbar / (tau * p.f) / SS.e; /* eV */
      const R = (E) => SS.reflect(SS.drudeEps(E, Ep, 1 / g, ei));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.5, xmax: 20, ymin: 0, ymax: 1.05, xlabel: 'ħω (eV)', ylabel: 'reflectividad' });
      pl.frame();
      for (let i = 0; i < 200; i++) { const E = 1.65 + (1.6 * i) / 200; const x0 = pl.X(E), x1 = pl.X(E + 0.009); ctx.fillStyle = EM.sd.css(EM.wavelengthRGB(1239.84 / E).map((c) => c / 255), 0.35); ctx.fillRect(x0, pl.iy, x1 - x0 + 1, pl.ih); }
      pl.fn(R, { color: '--c1', width: 2.6, n: 600 });
      pl.vline(Ep / Math.sqrt(ei), { color: '--c2', label: 'ħω_p/√ε∞' });
      sim.set('wp', EM.fix(Ep, 2) + ' eV (λ = ' + EM.fix(1239.84 / Ep, 0) + ' nm)');
      sim.set('edge', EM.fix(Ep / Math.sqrt(ei), 2) + ' eV = ' + EM.fix(1239.84 / (Ep / Math.sqrt(ei)), 0) + ' nm');
      sim.set('Rv', EM.fix(100 * R(1239.84 / 550), 1) + ' %');
    });
  });
})();
