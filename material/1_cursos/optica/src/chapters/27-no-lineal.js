/* Capítulo 27 — Óptica no lineal */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;

  /* 27.1 Segundo armónico */
  EM.defineSim('shg', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('m', { label: 'Método', options: [['bir', 'Ajuste por ángulo (BBO)'], ['qpm', 'Cuasiajuste de fases']], value: 'bir' });
    sim.slider('dth', { label: 'Desviación respecto del ángulo de ajuste', min: -3, max: 3, step: 0.005, value: 0.3, unit: 'mrad', fmt: (v) => v.toFixed(3) });
    sim.slider('L', { label: 'Longitud del cristal', min: 1, max: 20, step: 0.1, value: 10, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.check('pol', { label: 'Dominios invertidos cada L_c', value: true });
    sim.out('dk', 'Δk', { hl: true });
    sim.out('Lc', 'Longitud de coherencia π/Δk');
    sim.out('I', 'Intensidad final / con ajuste perfecto');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, bir = p.m === 'bir';
      EM.draw.clear(cv);
      sim.ctl.dth.show(bir); sim.ctl.L.show(bir); sim.ctl.pol.show(!bir);
      const pm = OP.pmTypeI('BBO', 1064);
      const dk = bir ? OP.dkTypeI('BBO', 1064, pm + p.dth * 1e-3) : OP.dkTypeI('BBO', 1064, 0);
      const Lc = Math.PI / Math.abs(dk || 1e-30);
      const Lt = bir ? p.L * 1e-3 : 20 * (Math.PI / Math.abs(OP.dkTypeI('BBO', 1064, 0)));
      /* amplitud acumulada A(z) = ∫ s(z') e^{iΔk z'} dz' con s = ±1 (cuasiajuste) */
      const N = 2000, dz = Lt / N, xs = [], ys = [], yref = [];
      let re = 0, im = 0;
      for (let i = 0; i <= N; i++) {
        const z = i * dz, s = !bir && p.pol ? (Math.floor(z / Lc) % 2 ? -1 : 1) : 1;
        if (i) { re += s * Math.cos(dk * z) * dz; im += s * Math.sin(dk * z) * dz; }
        xs.push(z * (bir ? 1e3 : 1e6)); ys.push(re * re + im * im); yref.push(z * z);
      }
      const nrm = bir ? Lt * Lt : Math.max(...ys);
      for (let i = 0; i <= N; i++) { ys[i] /= nrm; yref[i] /= nrm; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Lt * (bir ? 1e3 : 1e6), ymin: 0, ymax: 1.05, xlabel: bir ? 'posición en el cristal (mm)' : 'posición en el cristal (µm)', ylabel: 'intensidad del segundo armónico (rel.)' });
      pl.frame();
      if (bir) pl.xy(xs, yref, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.xy(xs, ys, { color: '--c3', width: 2.2 });
      if (!bir) pl.xy(xs, xs.map((_, i) => { const z = i * dz; return Math.pow((2 * Math.sin((dk * z) / 2)) / dk, 2) / nrm; }), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      sim.set('dk', EM.sci(dk, 3) + ' m⁻¹');
      sim.set('Lc', Math.abs(dk) < 1e-6 ? '∞ (ajuste perfecto)' : EM.si(Lc, 'm', 3));
      sim.set('I', EM.fix((ys[N] * nrm) / (Lt * Lt), 4) + (bir ? '' : ' (el cuasiajuste da (2/π)² = 0.405 de la eficiencia del ajuste perfecto)'));
    });
  });

  /* 27.2 Ajuste de fases tipo I en BBO */
  EM.defineSim('ajuste-fase', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('lam', { label: 'Longitud de onda fundamental', min: 420, max: 1600, step: 1, value: 1064, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('th', 'Ángulo de ajuste θ_m', { hl: true });
    sim.out('n', 'nₒ(ω) y nₑ(2ω, θ_m)');
    sim.out('w', 'Desplazamiento (walk-off) del armónico');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = OP.UNI.BBO.f;
      EM.draw.clear(cv);
      const [no1] = f(p.lam / 1000), [no2, ne2] = f(p.lam / 2000);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 90, ymin: Math.min(ne2, no1) - 0.02, ymax: Math.max(no2, no1) + 0.02, xlabel: 'ángulo con el eje óptico θ (°)', ylabel: 'índice' });
      pl.frame();
      pl.hline(no1, { color: '--c2', label: 'nₒ(ω) fundamental', labelRight: true });
      pl.fn((t) => OP.nTheta(no2, ne2, t * DEG), { color: '--c1', width: 2.2 });
      pl.label(70, OP.nTheta(no2, ne2, 70 * DEG), 'nₑ(2ω, θ)', { dy: -8, color: '--c1' });
      pl.hline(no2, { color: '--ink-3', label: 'nₒ(2ω)', labelRight: true });
      const th = OP.pmTypeI('BBO', p.lam);
      if (isFinite(th)) { pl.vline(th / DEG, { color: '--c3' }); pl.dot(th / DEG, no1, { color: '--c3', r: 6 }); }
      sim.set('th', isFinite(th) ? EM.fix(th / DEG, 3) + '°' : 'no hay ajuste posible');
      sim.set('n', EM.fix(no1, 5) + ' y ' + (isFinite(th) ? EM.fix(OP.nTheta(no2, ne2, th), 5) : '—'));
      sim.set('w', isFinite(th) ? EM.fix(OP.walkoff(no2, ne2, th) / DEG, 2) + '°' : '—');
    });
  });

  /* 27.3 Automodulación de fase */
  EM.defineSim('automodulacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('phi', { label: 'Fase no lineal máxima φ_max', min: 0, max: 12, step: 0.05, value: 4.5, unit: 'π rad', fmt: (v) => v.toFixed(2) });
    sim.out('dw', 'Ensanchamiento del espectro (rms, relativo)', { hl: true });
    sim.out('pk', 'Picos en el espectro');
    const N = 2048;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, phm = p.phi * Math.PI;
      EM.draw.clear(cv);
      const T = 1, tmax = 16, dt = (2 * tmax) / N;
      const re = new Float64Array(N), im = new Float64Array(N);
      for (let i = 0; i < N; i++) { const t = -tmax + i * dt, P = Math.exp(-(t * t) / (T * T)), ph = phm * P; re[i] = Math.sqrt(P) * Math.cos(ph); im[i] = Math.sqrt(P) * Math.sin(ph); }
      OP.fft(re, im);
      const sp = new Float64Array(N); let mx = 0;
      for (let k = 0; k < N; k++) { const j = (k + N / 2) % N; sp[k] = re[j] * re[j] + im[j] * im[j]; mx = Math.max(mx, sp[k]); }
      const fw = 1 / (N * dt), fmax = 3 + 0.9 * phm / (2 * Math.PI) * 2;
      const pt = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: -3, xmax: 3, ymin: -1.2, ymax: 1.2, xlabel: 't / T', ylabel: 'P, δω (rel.)' });
      pt.frame();
      pt.fn((t) => Math.exp(-t * t), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pt.fn((t) => (2 * t * Math.exp(-t * t)) / Math.sqrt(2 / Math.E), { color: '--c2', width: 2 });
      pt.legend([{ label: 'potencia', color: '--ink-3', dash: [5, 4] }, { label: 'corrimiento de frecuencia', color: '--c2' }], 'bl');
      const ps = new EM.Plot(ctx, { x: W * 0.47, y: 0, w: W * 0.53, h: H, xmin: -fmax, xmax: fmax, ymin: 0, ymax: 1.05, xlabel: '(ν − ν₀)·T', ylabel: 'espectro' });
      ps.frame();
      const xs = [], ys = []; for (let k = 0; k < N; k++) { const f = (k - N / 2) * fw; if (Math.abs(f) <= fmax) { xs.push(f); ys.push(sp[k] / mx); } }
      ps.xy(xs, ys, { color: '--accent', width: 1.8, fill: '--accent', fillAlpha: 0.12 });
      let m0 = 0, m2 = 0, s0 = 0; for (let k = 0; k < N; k++) { const f = (k - N / 2) * fw; s0 += sp[k]; m0 += f * sp[k]; m2 += f * f * sp[k]; }
      let m20 = 0, s00 = 0; /* sin no linealidad */
      for (let k = 0; k < N; k++) { const f = (k - N / 2) * fw, g = Math.exp(-Math.pow(Math.PI * f, 2) * 2 * T * T / 2); s00 += g; m20 += f * f * g; }
      let peaks = 0; for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] > ys[i + 1] && ys[i] > 0.05) peaks++;
      sim.set('dw', EM.fix(Math.sqrt(m2 / s0 - Math.pow(m0 / s0, 2)) / Math.sqrt(m20 / s00), 2) + ' veces el del pulso sin no linealidad');
      sim.set('pk', peaks + ' (≈ φ_max/π + 1 = ' + EM.fix(p.phi + 1, 1) + ')');
    });
  });
})();
