/* Capítulo 29 — Superconductividad */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;

  /* 29.2 Efecto Meissner en una lámina */
  EM.defineSim('meissner', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('d', { label: 'Espesor de la lámina', min: 10, max: 600, step: 1, value: 200, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('t', { label: 'Temperatura T/T_c', min: 0, max: 0.999, step: 0.001, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.select('m', { label: 'Material', options: [['Pb', 'Pb (λ₀ = 37 nm)'], ['Al', 'Al (λ₀ = 16 nm)'], ['Nb', 'Nb (λ₀ = 39 nm)']], value: 'Pb' });
    sim.out('l', 'λ(T)', { hl: true });
    sim.out('c', 'B en el centro / B₀');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const l0 = DATA.lengths[p.m][1], lam = SS.lambdaT(p.t, 1, l0);
      const wl = W * 0.55, X = p.d / 2 + 60;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -X, xmax: X, ymin: 0, ymax: 1.1, xlabel: 'x (nm)', ylabel: 'B/B₀' });
      pl.frame();
      pl.band(-p.d / 2, p.d / 2, { color: '--c3', alpha: 0.12 });
      pl.fn((x) => (Math.abs(x) >= p.d / 2 ? 1 : Math.cosh(x / lam) / Math.cosh(p.d / (2 * lam))), { color: '--c1', width: 2.6, n: 600 });
      const [Tc, Bc0] = DATA.super[p.m];
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 1.1, ymin: 0, ymax: Bc0 * 1.15, xlabel: 'T/T_c', ylabel: 'B_c (mT)' });
      p2.frame();
      p2.fn((t) => SS.Bc(t, 1, Bc0), { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.12 });
      p2.label(0.25, Bc0 * 0.35, 'superconductor', { size: 11.5, color: '--c2' });
      p2.label(0.65, Bc0 * 0.95, 'normal', { size: 11.5, color: '--ink-3' });
      p2.vline(p.t, { color: '--accent' });
      sim.set('l', EM.fix(lam, 1) + ' nm (T_c = ' + Tc + ' K)');
      sim.set('c', EM.fix(1 / Math.cosh(p.d / (2 * lam)), 4));
    });
  });

  /* 29.3 Brecha BCS */
  EM.defineSim('bcs', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Temperatura T/T_c', min: 0.01, max: 0.999, step: 0.001, value: 0.6, fmt: (v) => v.toFixed(3) });
    sim.out('d', 'Δ(T)/Δ(0)', { hl: true });
    sim.out('dk', 'Δ(T)/k_BT_c');
    let curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!curve) { curve = []; for (let i = 0; i <= 120; i++) { const t = 0.02 + (0.978 * i) / 120; curve.push([t, SS.bcsGap(t)]); } curve.push([1, 0]); }
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1.05, ymin: 0, ymax: 1.1, xlabel: 'T/T_c', ylabel: 'Δ(T)/Δ(0)' });
      pl.frame();
      pl.xy(curve.map((q) => q[0]), curve.map((q) => q[1]), { color: '--c1', width: 2.6 });
      pl.fn((t) => (3.0633 * Math.sqrt(Math.max(0, 1 - t))) / SS.BCS_D0, { color: '--ink-3', width: 1.2, dash: [5, 4], from: 0.6 });
      const d = SS.bcsGap(p.t);
      pl.dot(p.t, d, { color: '--accent', r: 5 });
      /* densidad de estados de las excitaciones */
      const D0 = d * SS.BCS_D0;
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 4, xlabel: 'E/k_BT_c', ylabel: 'N_s(E)/N(0)' });
      p2.frame();
      p2.fn((E) => (E > D0 ? E / Math.sqrt(E * E - D0 * D0) : 0), { color: '--c2', width: 2.4, n: 800, fill: '--c2', fillAlpha: 0.12 });
      p2.hline(1, { color: '--ink-3', label: 'metal normal' });
      sim.set('d', EM.fix(d, 4));
      sim.set('dk', EM.fix(D0, 4) + ' (2Δ/k_BT_c = ' + EM.fix(2 * D0, 3) + '; medidos: ' + Object.entries(DATA.gapRatio).map(([k, v]) => k + ' ' + v).join(', ') + ')');
    });
  });

  /* 29.4 Tipo I y tipo II */
  EM.defineSim('tipo2', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('k', { label: 'Parámetro κ = λ/ξ', min: 0.2, max: 10, step: 0.05, value: 3, fmt: (v) => v.toFixed(2) });
    sim.slider('B', { label: 'Campo aplicado B/B_c', min: 0, max: 5, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.out('t', 'Tipo', { hl: true });
    sim.out('f', 'B_{c1}/B_c y B_{c2}/B_c');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = p.k;
      EM.draw.clear(cv);
      const t2 = k > 1 / Math.SQRT2;
      const b1 = t2 ? Math.log(k) / (Math.SQRT2 * k) : 1, b2 = t2 ? Math.SQRT2 * k : 1;
      const b1e = t2 ? Math.max(0.05, b1) : 1;
      /* −M aproximada: Meissner hasta b1, luego decae (Abrikosov cerca de b2: lineal) */
      const mag = (b) => {
        if (!t2) return b < 1 ? b : 0;
        if (b <= b1e) return b;
        if (b >= b2) return 0;
        /* interpolación suave entre (b1, b1) y (b2, 0) con forma cóncava */
        const s = (b - b1e) / (b2 - b1e);
        return b1e * Math.pow(1 - s, 1.6);
      };
      const wl = W * 0.5;
      const xmax = Math.max(1.5, Math.min(b2 * 1.15, 15));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax, ymin: 0, ymax: 1.15, xlabel: 'B/B_c', ylabel: '−µ₀M/B_c' });
      pl.frame();
      pl.fn(mag, { color: '--c1', width: 2.6, n: 800 });
      pl.vline(p.B, { color: '--accent' });
      if (t2) { pl.vline(b1e, { color: '--c3', label: 'B_{c1}' }); pl.vline(b2, { color: '--c2', label: 'B_{c2}' }); } else pl.vline(1, { color: '--c2', label: 'B_c' });
      /* red de vórtices */
      const r = { x: wl + 10, y: 10, w: W - wl - 20, h: H - 20 };
      ctx.fillStyle = EM.col('--surface-2'); ctx.fillRect(r.x, r.y, r.w, r.h);
      const inMixed = t2 && p.B > b1e && p.B < b2;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      if (inMixed) {
        /* densidad de vórtices ∝ B: espaciado a ∝ 1/√B, escala relativa a ξ */
        const a = Math.max(10, (r.w / 6) * Math.sqrt(b2 / p.B) * 0.35);
        const lamPx = Math.min(a * 0.6, (a * k) / 6);
        for (let row = -1; row * a * 0.866 < r.h + a; row++) for (let col = -1; col * a < r.w + a; col++) {
          const x = r.x + col * a + (row % 2 ? a / 2 : 0), y = r.y + row * a * 0.866;
          const g = ctx.createRadialGradient(x, y, 0, x, y, lamPx * 2.5);
          g.addColorStop(0, EM.alpha('--c2', 0.85)); g.addColorStop(1, EM.alpha('--c2', 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, lamPx * 2.5, 0, 7); ctx.fill();
          ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, lamPx / k), 0, 7); ctx.fill();
        }
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.restore();
        EM.text(ctx, 'red de vórtices: un cuanto Φ₀ = h/2e por celda', r.x + 6, r.y + r.h - 8, { size: 11, color: '--ink', halo: true });
      } else {
        EM.text(ctx, p.B >= (t2 ? b2 : 1) ? 'estado normal: el campo penetra' : 'estado Meissner: B = 0 dentro', r.x + r.w / 2, r.y + r.h / 2, { size: 13, align: 'center', color: '--ink-2' });
      }
      ctx.restore();
      sim.set('t', t2 ? 'II (κ > 1/√2)' : 'I (κ < 1/√2)');
      sim.set('f', t2 ? EM.fix(b1e, 3) + ' y ' + EM.fix(b2, 3) : '1 y 1');
    });
  });

  /* 29.5 Josephson RSJ */
  EM.defineSim('josephson', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('i1', { label: 'Amplitud de microondas i₁ = I_{rf}/I_c', min: 0, max: 2, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('Om', { label: 'Frecuencia Ω (unidades de 2eRI_c/ħ)', min: 0.3, max: 2, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('st', 'Escalones en V/(I_cR) = n Ω', { hl: true });
    sim.out('f', 'Frecuencia de Josephson');
    let key = '', curve = null, curve0 = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.i1 + '|' + p.Om;
      if (k !== key) {
        key = k; curve = [];
        for (let i = 0; i <= 120; i++) { const i0 = (3 * i) / 120; curve.push([i0, SS.rsjAC(i0, p.i1, p.Om, 250, 0.03)]); }
        if (!curve0) { curve0 = []; for (let i = 0; i <= 200; i++) { const i0 = (3 * i) / 200; curve0.push([i0, SS.rsjV(i0)]); } }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3.5, ymin: 0, ymax: 3, xlabel: 'V/(I_cR)', ylabel: 'I/I_c' });
      pl.frame();
      for (let n = 1; n * p.Om < 3.5; n++) pl.vline(n * p.Om, { color: '--grid-2', label: 'n = ' + n });
      pl.xy(curve0.map((q) => q[1]), curve0.map((q) => q[0]), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.xy(curve.map((q) => q[1]), curve.map((q) => q[0]), { color: '--c1', width: 2.4 });
      pl.legend([{ label: 'sin microondas: V = R√(I² − I_c²)', color: '--ink-3', dash: [5, 4] }, { label: 'con microondas (RSJ, RK4)', color: '--c1' }], 'br');
      sim.set('st', 'V_n = n ħω/2e: ' + [1, 2, 3].map((n) => EM.fix(n * p.Om, 2)).join(', '));
      sim.set('f', '483.6 GHz por mV (K_J = 2e/h = ' + EM.fix((2 * SS.e) / SS.h / 1e9, 1) + ' GHz/V)');
    });
  });
})();
