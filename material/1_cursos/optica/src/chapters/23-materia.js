/* Capítulo 23 — Dispersión, absorción y esparcimiento */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, C = OP.C;

  /* 23.1 Oscilador de Lorentz */
  EM.defineSim('lorentz', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('wp', { label: 'Frecuencia de plasma ω_p / ω₀', min: 0.1, max: 1.5, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('g', { label: 'Amortiguamiento γ / ω₀', min: 0.01, max: 0.5, step: 0.005, value: 0.08, fmt: (v) => v.toFixed(3) });
    sim.check('kk', { label: 'Comprobar con Kramers–Kronig', value: true });
    sim.out('n0', 'n a baja frecuencia', { hl: true });
    sim.out('kmax', 'Máximo de κ');
    let key = '', kk = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const eps = (w) => OP.lorentzEps(w, 1, p.wp, p.g, 1);
      const nk = (w) => OP.nFromEps(eps(w));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 2.5, ymin: -0.2, ymax: 2.2, xlabel: 'ω / ω₀', ylabel: 'n, κ' });
      pl.frame();
      pl.hline(1, { color: '--ink-3' });
      pl.fn((w) => nk(w)[0], { color: '--accent', width: 2.4, n: 800 });
      pl.fn((w) => nk(w)[1], { color: '--c2', width: 2.2, n: 800 });
      if (p.kk) {
        const k = p.wp + ',' + p.g;
        if (k !== key) {
          key = k;
          const ws = [], im = []; for (let i = 0; i <= 30000; i++) { const w = i * 0.001; ws.push(w); im.push(eps(w)[1]); }
          kk = []; for (let i = 1; i <= 120; i++) { const w = (2.5 * i) / 120, re = OP.kkReal(ws, im, w); kk.push([w, C.sqrt([1 + re, eps(w)[1]])[0]]); }
        }
        pl.path(kk, { color: '--ink', width: 1.4, dash: [3, 4] });
      }
      pl.legend([{ label: 'n (parte real)', color: '--accent' }, { label: 'κ (absorción)', color: '--c2' }].concat(p.kk ? [{ label: 'n por Kramers–Kronig', color: '--ink', dash: [3, 4] }] : []), 'tr');
      let km = 0, wm = 0; for (let w = 0.5; w < 1.5; w += 0.001) { const v = nk(w)[1]; if (v > km) { km = v; wm = w; } }
      sim.set('n0', EM.fix(nk(1e-3)[0], 4) + ' (√(1 + ω_p²/ω₀²) = ' + EM.fix(Math.sqrt(1 + p.wp * p.wp), 4) + ')');
      sim.set('kmax', EM.fix(km, 3) + ' en ω = ' + EM.fix(wm, 3) + ' ω₀');
    });
  });

  /* 23.2 Drude: metales e ionosfera */
  EM.defineSim('drude', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('m', { label: 'Sistema', options: [['na', 'Sodio metálico'], ['ion', 'Ionosfera']], value: 'na' });
    sim.slider('lN', { label: 'log₁₀ de la densidad electrónica (m⁻³)', min: 9, max: 29, step: 0.01, value: Math.log10(2.65e28), fmt: (v) => v.toFixed(2) });
    sim.out('fp', 'Frecuencia de plasma', { hl: true });
    sim.out('lp', 'Longitud de onda de plasma');
    sim.onChange = (id) => { if (id === 'm') sim.ctl.lN.set(sim.p.m === 'na' ? Math.log10(2.65e28) : 12, true); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wp = OP.plasmaW(Math.pow(10, p.lN)), fp = wp / (2 * Math.PI), g = p.m === 'na' ? 0.02 * wp : 1e-3 * wp;
      const R = (f) => { const w = 2 * Math.PI * f; return OP.fresnel(1, OP.nFromEps(OP.drudeEps(w, wp, g, 1)), 0).R; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xlog: true, xmin: fp / 30, xmax: fp * 10, ymin: 0, ymax: 1.05, xlabel: 'frecuencia (Hz)', ylabel: 'reflectancia (incidencia normal)' });
      pl.frame();
      pl.fn(R, { color: '--accent', width: 2.4, n: 800 });
      pl.vline(fp, { color: '--c2', label: 'f_p', labelY: 14 });
      if (p.m === 'ion') { for (const [f, lab] of [[1e6, 'AM 1 MHz'], [1e7, 'onda corta 10 MHz'], [1e8, 'FM 100 MHz']]) if (f > fp / 30 && f < fp * 10) pl.vline(f, { color: '--ink-3', label: lab, labelY: 34 }); }
      else { const lv = (l) => OP.c / (l * 1e-9); pl.band(lv(780), lv(380), { color: '--gold', alpha: 0.12 }); pl.label(lv(550), 0.6, 'visible', { align: 'center' }); }
      sim.set('fp', EM.si(fp, 'Hz', 3) + ' (ħω_p = ' + EM.sci((OP.hbar * wp) / OP.e, 3) + ' eV)');
      sim.set('lp', EM.si(OP.c / fp, 'm', 3));
    });
  });

  /* 23.3 Beer–Lambert */
  EM.defineSim('beer', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('l0', { label: 'Centro de la banda de absorción', min: 420, max: 680, step: 1, value: 520, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('w', { label: 'Ancho de la banda', min: 15, max: 120, step: 1, value: 50, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Concentración (relativa)', min: 0, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('L', { label: 'Camino óptico', min: 0.1, max: 5, step: 0.05, value: 1, unit: 'cm', fmt: (v) => v.toFixed(2) });
    sim.out('A', 'Absorbancia máxima εcl', { hl: true });
    sim.out('T', 'Transmisión en el máximo de la banda');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const eps = (l) => Math.exp(-0.5 * Math.pow((l - p.l0) / (p.w / 2.3548), 2)); /* absorbancia por unidad de c·l */
      const A = (l) => eps(l) * p.c * p.L, T = (l) => Math.pow(10, -A(l));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.7, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'transmisión' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 4 }, 380, 780);
      pl.frame();
      pl.fn(T, { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.1 });
      const xyz = OP.reflXYZ(T), g = OP.xyz2srgb(...xyz);
      /* cubeta */
      const bx = W * 0.75, bw = W * 0.2, bh = H * 0.6, by = H * 0.18;
      ctx.fillStyle = D.css(g); ctx.fillRect(bx, by, bw * Math.min(1, p.L / 5) + 4, bh);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(bx, by, bw * Math.min(1, p.L / 5) + 4, bh);
      EM.text(ctx, 'color transmitido', bx, by + bh + 16, { size: 11, color: '--ink-2' });
      sim.set('A', EM.fix(p.c * p.L, 3));
      sim.set('T', EM.fix(100 * T(p.l0), 2) + ' %');
    });
  });

  /* 23.4 Color del Sol y del cielo */
  EM.defineSim('cielo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('h', { label: 'Altura del Sol', min: 0, max: 90, step: 0.5, value: 20, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.seg('lugar', { label: 'Lugar', options: [['mar', 'Nivel del mar'], ['pop', 'Popayán (82 kPa)']], value: 'pop' });
    sim.out('m', 'Masa de aire', { hl: true });
    sim.out('T', 'Transmisión directa a 450 / 550 / 650 nm');
    sim.out('cct', 'Temperatura de color del Sol');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = p.lugar === 'mar' ? 101325 : 82e3;
      EM.draw.clear(cv);
      const m = OP.airMass(Math.max(0, p.h)), S = (l) => OP.planck(l * 1e-9, 5772);
      const Tdir = (l) => Math.exp(-OP.tauRayleigh(l / 1000, P) * m);
      const sunXYZ = OP.specXYZ((l) => S(l) * Tdir(l));
      /* cielo cerca del cenit (modelo de esparcimiento simple: τ(λ) con el Sol atenuado) */
      const skyAt = (mv) => OP.specXYZ((l) => S(l) * Tdir(l) * (1 - Math.exp(-OP.tauRayleigh(l / 1000, P) * mv)));
      const nrm = (xyz, k) => { const y = xyz[1]; return OP.xyz2srgb((xyz[0] / y) * k, k, (xyz[2] / y) * k); };
      /* gradiente de cielo del cenit al horizonte */
      const grd = ctx.createLinearGradient(0, 0, 0, H * 0.8);
      for (let i = 0; i <= 6; i++) { const elv = 90 - i * 15, mv = OP.airMass(Math.max(0.5, elv)), xyz = skyAt(mv), Yr = skyAt(1)[1]; grd.addColorStop(i / 6, D.css(nrm(xyz, Math.min(0.95, 0.55 * Math.pow(xyz[1] / Yr, 0.35))))); }
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W * 0.55, H * 0.8);
      ctx.fillStyle = EM.isDark() ? '#22301E' : '#55704A'; ctx.fillRect(0, H * 0.8, W * 0.55, H * 0.2);
      const sy = H * 0.8 - (p.h / 90) * H * 0.72;
      const sc = nrm(sunXYZ, 1);
      ctx.fillStyle = D.css(sc); ctx.shadowColor = D.css(sc); ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(W * 0.28, sy, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'transmisión directa' });
      pl.frame();
      pl.fn(Tdir, { color: '--accent', width: 2.2 });
      const xy = OP.xy(sunXYZ);
      sim.set('m', EM.fix(m, 2));
      sim.set('T', [450, 550, 650].map((l) => EM.fix(100 * Tdir(l), 1) + ' %').join(' / '));
      sim.set('cct', EM.fix(OP.mcCamy(xy[0], xy[1]), 0) + ' K (solo Rayleigh)');
    });
  });

  /* 23.5 Mie */
  EM.defineSim('mie', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n', { label: 'Índice relativo de la partícula', min: 1.05, max: 2, step: 0.005, value: 1.333, fmt: (v) => v.toFixed(3) });
    sim.slider('k', { label: 'Absorción κ', min: 0, max: 0.5, step: 0.001, value: 0, fmt: (v) => v.toFixed(3) });
    sim.slider('lx', { label: 'log₁₀ del parámetro de tamaño x = 2πa/λ', min: -1, max: 2, step: 0.01, value: 0.7, fmt: (v) => v.toFixed(2) });
    sim.out('Q', 'Q_ext, Q_sca, Q_abs', { hl: true });
    sim.out('g', 'Factor de asimetría g');
    sim.out('a', 'Radio para λ = 550 nm');
    let key = '', curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, x = Math.pow(10, p.lx), m = [p.n, p.k];
      EM.draw.clear(cv);
      const k = p.n + ',' + p.k;
      if (k !== key) { key = k; curve = []; for (let i = 0; i <= 260; i++) { const lx = -1 + (3 * i) / 260, r = OP.mie(m, Math.pow(10, lx)); curve.push([Math.pow(10, lx), r.Qext, r.Qsca]); } }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xlog: true, xmin: 0.1, xmax: 100, ymin: 0, ymax: Math.max(4.5, ...curve.map((q) => q[1])) * 1.05, xlabel: 'parámetro de tamaño x', ylabel: 'eficiencia' });
      pl.frame();
      pl.path(curve.map((q) => [q[0], q[1]]), { color: '--accent', width: 2.2 });
      if (p.k > 0) pl.path(curve.map((q) => [q[0], q[2]]), { color: '--c3', width: 1.6 });
      pl.hline(2, { color: '--ink-3', label: 'límite 2', labelRight: true });
      const r = OP.mie(m, x, Array.from({ length: 181 }, (_, i) => (i * Math.PI) / 180));
      pl.dot(x, r.Qext, { color: '--c2', r: 6 });
      /* diagrama polar (luz no polarizada, escala logarítmica de 4 décadas) */
      const I = r.S.map((s) => 0.5 * (C.abs2(s[0]) + C.abs2(s[1])));
      const Im = Math.max(...I);
      const pol = new EM.Polar(ctx, { cx: W * 0.79, cy: H / 2, R: Math.min(W * 0.19, H * 0.42), zero: 'right', spokes: 30, db: true, dbMin: -40 });
      pol.frame();
      pol.curve((a) => { let ang = a > Math.PI ? 2 * Math.PI - a : a; const i = Math.min(180, Math.round((ang * 180) / Math.PI)); return I[i] / Im; }, { color: '--accent', symmetric: false });
      EM.text(ctx, 'luz incidente →', W * 0.79 - Math.min(W * 0.19, H * 0.42), H / 2 + Math.min(W * 0.19, H * 0.42) + 16, { size: 10.5, color: '--ink-3' });
      sim.set('Q', EM.fix(r.Qext, 4) + ', ' + EM.fix(r.Qsca, 4) + ', ' + EM.fix(r.Qabs, 4));
      sim.set('g', EM.fix(r.g, 4));
      sim.set('a', EM.si((x * 550e-9) / (2 * Math.PI), 'm', 3));
    });
  });
})();
