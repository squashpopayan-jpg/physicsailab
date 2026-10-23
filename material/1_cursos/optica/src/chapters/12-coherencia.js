/* Capítulo 12 — Superposición y coherencia */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 12.1 Suma de fasores */
  EM.defineSim('fasores', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('modo', { label: 'Número de ondas', options: [['2', 'Dos ondas'], ['N', 'N ondas']], value: '2' });
    sim.slider('d', { label: 'Desfase entre ondas vecinas δ', min: -Math.PI, max: Math.PI, step: 0.005, value: 1.2, unit: 'rad', fmt: (v) => v.toFixed(3) });
    sim.slider('a2', { label: 'Amplitud de la onda 2 (relativa)', min: 0, max: 1.5, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('N', { label: 'Número de ondas N', min: 2, max: 20, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.out('I', 'Intensidad |ΣE|²', { hl: true });
    sim.out('V', 'Visibilidad de las franjas');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, two = p.modo === '2';
      EM.draw.clear(cv);
      sim.ctl.a2.show(two); sim.ctl.N.show(!two);
      const amps = two ? [1, p.a2] : Array(p.N).fill(1);
      const tot = amps.reduce((s, a) => s + a, 0);
      const v = D.view({ x: 10, y: 10, w: W * 0.45 - 20, h: H - 20 }, -tot * 0.6, tot * 1.1, -tot * 0.85, tot * 0.85);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(v.X(-tot), v.Y(0)); ctx.lineTo(v.X(tot * 1.2), v.Y(0)); ctx.moveTo(v.X(0), v.Y(-tot)); ctx.lineTo(v.X(0), v.Y(tot)); ctx.stroke();
      let x = 0, y = 0;
      amps.forEach((a, i) => { const ph = i * p.d, nx = x + a * Math.cos(ph), ny = y + a * Math.sin(ph); EM.draw.arrow(ctx, v.X(x), v.Y(y), v.X(nx), v.Y(ny), { color: i ? '--c1' : '--c3', width: 2 }); x = nx; y = ny; });
      EM.draw.arrow(ctx, v.X(0), v.Y(0), v.X(x), v.Y(y), { color: '--c2', width: 2.8 });
      EM.text(ctx, 'resultante', v.X(x / 2) + 6, v.Y(y / 2) + 14, { size: 11, color: '--c2', halo: true });
      const I = (d) => { let sx = 0, sy = 0; amps.forEach((a, i) => { sx += a * Math.cos(i * d); sy += a * Math.sin(i * d); }); return sx * sx + sy * sy; };
      const Imax = tot * tot;
      const pl = new EM.Plot(ctx, { x: W * 0.45, y: 0, w: W * 0.55, h: H, xmin: -Math.PI, xmax: Math.PI, ymin: 0, ymax: Imax * 1.08, xpi: true, xlabel: 'desfase δ', ylabel: 'intensidad' });
      pl.frame();
      pl.fn(I, { color: '--accent', width: 2.2, n: 800 });
      pl.dot(p.d, I(p.d), { color: '--c2', r: 6 });
      const Imin = two ? Math.pow(1 - p.a2, 2) : 0, Imx = two ? Math.pow(1 + p.a2, 2) : Imax;
      sim.set('I', EM.fix(I(p.d), 3) + ' (máximo ' + EM.fix(Imx, 2) + ')');
      sim.set('V', EM.fix((Imx - Imin) / (Imx + Imin), 3));
    });
  });

  /* 12.2 Velocidad de fase y de grupo */
  EM.defineSim('grupo', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.seg('modo', { label: 'Señal', options: [['p', 'Paquete'], ['b', 'Dos ondas (batidos)']], value: 'p' });
    sim.slider('n', { label: 'Índice de fase n', min: 1, max: 2, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('ng', { label: 'Índice de grupo n_g', min: 1, max: 2.5, step: 0.01, value: 1.9, fmt: (v) => v.toFixed(2) });
    sim.out('vp', 'Velocidad de fase c/n', { hl: true });
    sim.out('vg', 'Velocidad de grupo c/n_g');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.resetButton(() => { t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const c = 110, vp = c / p.n, vg = c / p.ng, k0 = (2 * Math.PI) / 26;
      const tt = p.modo === 'p' ? t % ((W - 120) / vg) : t;
      const xg = 70 + vg * tt, y0 = H * 0.5, A = H * 0.32, sig = 70;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 1.5) {
        let e;
        if (p.modo === 'p') e = Math.exp(-Math.pow((x - xg) / sig, 2)) * Math.cos(k0 * (x - vp * tt));
        else { const dk = (2 * Math.PI) / 240; e = 0.5 * (Math.cos((k0 + dk) * x - (k0 * vp + dk * vg) * tt) + Math.cos((k0 - dk) * x - (k0 * vp - dk * vg) * tt)); }
        x ? ctx.lineTo(x, y0 - A * e) : ctx.moveTo(x, y0 - A * e);
      }
      ctx.stroke();
      if (p.modo === 'p') {
        ctx.strokeStyle = EM.alpha('--c1', 0.6); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
        for (let x = 0; x <= W; x += 3) { const e = Math.exp(-Math.pow((x - xg) / sig, 2)); x ? ctx.lineTo(x, y0 - A * e) : ctx.moveTo(x, y0 - A * e); }
        ctx.stroke(); ctx.setLineDash([]);
        /* cresta seguida: la más cercana al centro del paquete en t = 0, transportada a v_p */
        const xc = 70 + vp * tt;
        ctx.fillStyle = EM.col('--c2');
        const crest = xg + ((((xc - xg) % 26) + 26 + 13) % 26) - 13;
        ctx.beginPath(); ctx.arc(crest, y0 - A * Math.exp(-Math.pow((crest - xg) / sig, 2)) - 8, 5, 0, 7); ctx.fill();
        ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(xg, y0 + A + 10, 6, 0, 7); ctx.fill();
        EM.text(ctx, 'envolvente', xg + 9, y0 + A + 14, { size: 11, color: '--c1', halo: true });
      }
      sim.set('vp', EM.fix(1 / p.n, 3) + ' c');
      sim.set('vg', EM.fix(1 / p.ng, 3) + ' c' + (p.ng > p.n ? ' (dispersión normal: v_g < v_p)' : p.ng < p.n ? ' (v_g > v_p)' : ''));
    });
  });

  /* 12.3 Coherencia temporal */
  EM.defineSim('coherencia-temporal', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('src', { label: 'Fuente', options: [['g', 'Línea gaussiana'], ['na', 'Doblete de sodio'], ['w', 'Luz blanca']], value: 'g' });
    sim.slider('l0', { label: 'Longitud de onda central', min: 450, max: 650, step: 1, value: 630, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('dl', { label: 'Ancho espectral (FWHM)', min: 0.5, max: 60, step: 0.1, value: 20, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Diferencia de camino', min: 0, max: 60, step: 0.01, value: 5, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.out('lc', 'Longitud de coherencia λ²/Δλ', { hl: true });
    sim.out('V', 'Visibilidad a esta diferencia');
    let spec = null, key = '';
    const build = (p) => {
      const ls = [], w = [];
      if (p.src === 'w') { for (let l = 400; l <= 700; l += 2) { ls.push(l); w.push(OP.planck(l * 1e-9, 5800)); } }
      else if (p.src === 'na') { for (let l = 588.5; l <= 590.1; l += 0.002) { ls.push(l); w.push(Math.exp(-0.5 * Math.pow((l - 588.995) / 0.004, 2)) + 0.5 * Math.exp(-0.5 * Math.pow((l - 589.592) / 0.004, 2))); } }
      else { const s = p.dl / 2.3548; for (let l = p.l0 - 4 * s; l <= p.l0 + 4 * s; l += s / 25) { ls.push(l); w.push(Math.exp(-0.5 * Math.pow((l - p.l0) / s, 2))); } }
      const W0 = w.reduce((a, b) => a + b, 0);
      return { ls, w: w.map((x) => x / W0) };
    };
    const vis = (L) => { let a = 0, b = 0; spec.ls.forEach((l, i) => { const ph = (2 * Math.PI * L) / (l * 1e-3); a += spec.w[i] * Math.cos(ph); b += spec.w[i] * Math.sin(ph); }); return Math.hypot(a, b); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.l0.show(p.src === 'g'); sim.ctl.dl.show(p.src === 'g');
      const k = p.src + p.l0 + ',' + p.dl;
      if (k !== key) { spec = build(p); key = k; }
      const Lmax = p.src === 'na' ? 2000 : p.src === 'w' ? 6 : Math.max(10, Math.min(2000, (3 * p.l0 * p.l0) / p.dl / 1000));
      sim.ctl.L.range(0, Lmax, Lmax / 2000);
      const L = Math.min(p.L, Lmax);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.68, xmin: 0, xmax: Lmax, ymin: 0, ymax: 1.08, xlabel: 'diferencia de camino (µm)', ylabel: 'visibilidad' });
      pl.frame();
      pl.fn(vis, { color: '--accent', width: 2.2, n: 600 });
      pl.dot(L, vis(L), { color: '--c2', r: 6 });
      /* franjas alrededor de esta diferencia de camino (cuña de ±3 franjas) */
      const r = { x: pl.ix, y: H * 0.8, w: pl.iw, h: H * 0.16 };
      const lam0 = spec.ls.reduce((s, l, i) => s + l * spec.w[i], 0) / 1000;
      for (let i = 0; i < r.w; i++) {
        const dL = L + ((i / r.w) - 0.5) * 6 * lam0;
        let X = 0, Y = 0, Z = 0;
        const step = Math.max(1, Math.floor(spec.ls.length / 60));
        for (let j = 0; j < spec.ls.length; j += step) { const l = spec.ls[j], I = spec.w[j] * (1 + Math.cos((2 * Math.PI * dL) / (l * 1e-3))), c = OP.cmf(l); X += I * c[0]; Y += I * c[1]; Z += I * c[2]; }
        let ref = 0; for (let j = 0; j < spec.ls.length; j += step) ref += spec.w[j] * OP.cmf(spec.ls[j])[1] * 2;
        const g = OP.xyz2srgb(X / ref, Y / ref, Z / ref);
        ctx.fillStyle = D.css(g); ctx.fillRect(r.x + i, r.y, 1.5, r.h);
      }
      EM.text(ctx, 'franjas en el detector (±3 franjas alrededor de la diferencia elegida)', r.x, r.y - 5, { size: 11, color: '--ink-2' });
      const dlam = p.src === 'na' ? 0.597 : p.src === 'w' ? 300 : p.dl, lmean = p.src === 'na' ? 589.3 : p.src === 'w' ? 550 : p.l0;
      sim.set('lc', EM.fix((lmean * lmean) / dlam / 1000, 2) + ' µm' + (p.src === 'na' ? ' (período de los batidos del doblete)' : ''));
      sim.set('V', EM.fix(vis(L), 3));
    });
  });

  /* 12.4 Coherencia espacial (interferómetro estelar) */
  EM.defineSim('coherencia-espacial', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('pre', { label: 'Fuente', options: [['sol', 'Sol (0.533°)'], ['luna', 'Luna (0.52°)'], ['bet', 'Betelgeuse (0.047″)']], value: 'bet' });
    sim.slider('lth', { label: 'log₁₀ del diámetro angular (rad)', min: -8, max: -1.5, step: 0.01, value: Math.log10(0.047 / 206265), fmt: (v) => v.toFixed(2) });
    sim.slider('ld', { label: 'log₁₀ de la separación d (m)', min: -6, max: 2, step: 0.005, value: Math.log10(2), fmt: (v) => v.toFixed(3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 750, step: 1, value: 575, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.onChange = (id) => { if (id === 'pre') { const th = { sol: 0.533 * Math.PI / 180, luna: 0.52 * Math.PI / 180, bet: 0.047 / 206265 }[sim.p.pre]; sim.ctl.lth.set(Math.log10(th), true); sim.ctl.ld.set(Math.log10((1.22 * sim.p.lam * 1e-9) / th) - 0.3, true); } };
    sim.out('V', 'Visibilidad |2J₁(v)/v|', { hl: true });
    sim.out('d0', 'Primer cero d = 1.22λ/θ');
    sim.out('th', 'Diámetro angular');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = Math.pow(10, p.lth), d = Math.pow(10, p.ld), lam = p.lam * 1e-9;
      EM.draw.clear(cv);
      const d0 = (1.22 * lam) / th, V = OP.vczDisk(d, th, lam);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.66, xmin: 0, xmax: 3 * d0, ymin: 0, ymax: 1.08, xlabel: 'separación de las aberturas d (m)', ylabel: 'visibilidad' });
      pl.frame();
      pl.fn((x) => OP.vczDisk(x, th, lam), { color: '--accent', width: 2.2, n: 600 });
      pl.vline(d0, { color: '--ink-3', label: '1.22 λ/θ', labelY: 14 });
      pl.dot(Math.min(d, 3 * d0), OP.vczDisk(Math.min(d, 3 * d0), th, lam), { color: '--c2', r: 6 });
      const r = { x: pl.ix, y: H * 0.78, w: pl.iw, h: H * 0.17 };
      D.screen(ctx, r, (s) => 1 + V * Math.cos(2 * Math.PI * 5 * s), OP.lambdaRGB(p.lam, 1, 0.3), { gamma: 0.8, max: 2 });
      sim.set('V', EM.fix(V, 4));
      sim.set('d0', EM.si(d0, 'm', 3));
      sim.set('th', EM.sci(th, 3) + ' rad = ' + (th > 1e-4 ? EM.fix((th * 180) / Math.PI, 3) + '°' : EM.fix(th * 206265, 4) + '″'));
    });
  });
})();
