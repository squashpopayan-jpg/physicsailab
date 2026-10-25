/* Capítulo 25 — Propiedades ópticas de los sólidos */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss;

  /* 25.2 Absorción directa e indirecta */
  EM.defineSim('absorcion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 4, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('Eg', { label: 'Brecha', min: 0.6, max: 2, step: 0.01, value: 1.12, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.out('ex', 'Brecha extraída de Tauc (directa / indirecta)', { hl: true });
    const Eph = 0.058;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const ad = (E) => 4e4 * SS.absDirect(E, p.Eg, 1);
      const ai = (E) => 4e3 * SS.absIndirect(E, p.Eg, Eph, p.T, 1);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: p.Eg - 0.2, xmax: p.Eg + 0.6, ymin: 1, ymax: 1e5, ylog: true, xlabel: 'ħω (eV)', ylabel: 'α (cm⁻¹, escala relativa)' });
      pl.frame();
      pl.fn(ad, { color: '--c1', width: 2.4, n: 600 });
      pl.fn(ai, { color: '--c2', width: 2.4, n: 600 });
      pl.vline(p.Eg, { color: '--ink-3', label: 'E_g' });
      pl.legend([{ label: 'directa', color: '--c1' }, { label: 'indirecta', color: '--c2' }], 'br');
      /* Tauc: (αħω)² para directa y (αħω)^½ para indirecta, normalizadas */
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: p.Eg - 0.2, xmax: p.Eg + 0.6, ymin: 0, ymax: 1.05, xlabel: 'ħω (eV)', ylabel: 'Tauc (normalizado)' });
      p2.frame();
      const Emx = p.Eg + 0.6;
      const td = (E) => Math.pow(ad(E) * E, 2) / Math.pow(ad(Emx) * Emx, 2);
      const ti = (E) => Math.sqrt(ai(E) * E) / Math.sqrt(ai(Emx) * Emx);
      p2.fn(td, { color: '--c1', width: 2.4, n: 600 });
      p2.fn(ti, { color: '--c2', width: 2.4, n: 600 });
      /* extrapolación lineal en la parte alta */
      const lin = (f) => { const a = Emx - 0.25, b = Emx - 0.05, fa = f(a), fb = f(b), s = (fb - fa) / (b - a); return a - fa / s; };
      const ed = lin(td), ei = lin(ti);
      p2.fn((E) => (E - ed) * ((td(Emx - 0.05) - td(Emx - 0.25)) / 0.2), { color: '--c1', width: 1, dash: [4, 4] });
      p2.fn((E) => (E - ei) * ((ti(Emx - 0.05) - ti(Emx - 0.25)) / 0.2), { color: '--c2', width: 1, dash: [4, 4] });
      sim.set('ex', EM.fix(ed, 3) + ' / ' + EM.fix(ei, 3) + ' eV (la indirecta sale corrida por el fonón de ' + Eph * 1000 + ' meV)');
    });
  });

  /* 25.3 Excitones: fórmula de Elliott */
  EM.defineSim('excitones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Rydberg excitónico R*', min: 1, max: 100, step: 0.5, value: 20, unit: 'meV', fmt: (v) => v.toFixed(1) });
    sim.slider('G', { label: 'Ensanchamiento', min: 0.2, max: 30, step: 0.1, value: 1.5, unit: 'meV', fmt: (v) => v.toFixed(1) });
    sim.out('n1', 'Excitón 1s', { hl: true });
    sim.out('n2', 'Excitón 2s');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const R = p.R, G = p.G;
      const lor = (x) => G / Math.PI / (x * x + G * G);
      const cont = (e) => { if (e <= 0) return 0; const x = Math.sqrt(R / e); return (Math.PI * x * Math.exp(Math.PI * x)) / Math.sinh(Math.PI * x) * Math.sqrt(e); };
      const alpha = (E) => {
        /* E respecto de E_g, en meV */
        let s = 0;
        for (let n = 1; n <= 40; n++) s += (4 * Math.PI * Math.pow(R, 1.5) / Math.pow(n, 3)) * lor(E + R / (n * n));
        /* continuo convolucionado de forma aproximada (suavizado) */
        let c = 0, w = 0;
        for (let k = -3; k <= 3; k++) { const ee = E + (k * G) / 1.5, wt = Math.exp(-k * k / 4); c += wt * cont(ee); w += wt; }
        return s + c / w;
      };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -1.4 * R, xmax: 3 * R, ymin: 0, ymax: Math.max(alpha(-R), 3 * Math.sqrt(R)) * 1.1, xlabel: 'E − E_g (meV)', ylabel: 'absorción (u. arb.)' });
      pl.frame();
      pl.fn(alpha, { color: '--c1', width: 2.4, n: 1500, fill: '--c1', fillAlpha: 0.12 });
      pl.fn((e) => (e > 0 ? Math.sqrt(e) : 0), { color: '--ink-3', width: 1.3, dash: [5, 4] });
      for (let n = 1; n <= 4; n++) pl.vline(-R / (n * n), { color: '--grid-2', label: n === 1 ? '1s' : n === 2 ? '2s' : '' });
      pl.vline(0, { color: '--c2', label: 'E_g' });
      sim.set('n1', 'E_g − ' + EM.fix(R, 1) + ' meV');
      sim.set('n2', 'E_g − ' + EM.fix(R / 4, 2) + ' meV');
    });
  });

  /* 25.4 Plasmones de nanopartículas */
  const MET = { Au: [9.0, 9.8, 0.07], Ag: [9.0, 3.7, 0.02], Al: [15.8, 1, 0.6], Na: [6.04, 1, 0.03] };
  EM.defineSim('plasmones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: [['Au', 'Oro'], ['Ag', 'Plata'], ['Al', 'Aluminio'], ['Na', 'Sodio']], value: 'Au' });
    sim.slider('n', { label: 'Índice del medio', min: 1, max: 1.8, step: 0.01, value: 1.33, fmt: (v) => v.toFixed(2) });
    sim.out('pk', 'Resonancia', { hl: true });
    sim.out('col', 'Color transmitido');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [Ep, ei, g] = MET[p.m];
      EM.draw.clear(cv);
      const em = p.n * p.n;
      const ext = (lam) => {
        const E = 1239.84 / lam, e = SS.drudeEps(E, Ep, 1 / g, ei);
        const num = { re: e.re - em, im: e.im }, den = { re: e.re + 2 * em, im: e.im };
        const q = SS.C.div(num, den);
        return (Math.pow(em, 1.5) * q.im) / lam;
      };
      const lams = EM.M.linspace(200, 900, 701), ys = lams.map(ext), mx = Math.max(...ys);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 200, xmax: 900, ymin: 0, ymax: 1.1, xlabel: 'λ (nm)', ylabel: 'extinción (normalizada)' });
      pl.frame();
      for (let i = 0; i < 300; i++) { const l = 380 + (400 * i) / 300; ctx.fillStyle = EM.sd.css(EM.wavelengthRGB(l).map((c) => c / 255), 0.2); ctx.fillRect(pl.X(l), pl.iy, pl.X(l + 1.4) - pl.X(l) + 0.5, pl.ih); }
      pl.xy(lams, ys.map((y) => y / mx), { color: '--c1', width: 2.6 });
      const ip = ys.indexOf(mx), lp = lams[ip];
      pl.vline(lp, { color: '--c2', label: EM.fix(lp, 0) + ' nm' });
      /* color transmitido: espectro blanco por e^{−k·ext} */
      let r = 0, gg = 0, b = 0;
      for (let l = 400; l <= 700; l += 5) { const t = Math.exp(-2.5 * ext(l) / mx), c = EM.wavelengthRGB(l); r += c[0] * t; gg += c[1] * t; b += c[2] * t; }
      const k = 255 / Math.max(r, gg, b);
      const col = `rgb(${Math.round(r * k)},${Math.round(gg * k)},${Math.round(b * k)})`;
      ctx.fillStyle = col; ctx.fillRect(W - 70, 20, 50, 50); ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(W - 70, 20, 50, 50);
      EM.text(ctx, 'transmitido', W - 45, 84, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('pk', EM.fix(lp, 0) + ' nm (ε = −2ε_m: ħω = ' + EM.fix(Ep / Math.sqrt(ei + 2 * em), 2) + ' eV)');
      sim.set('col', col);
    });
  });
})();
