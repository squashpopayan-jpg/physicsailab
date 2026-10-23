/* Capítulo 14 — Láminas delgadas e interferómetros */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const filmColor = (d, n, th) => { const xyz = OP.reflXYZ((l) => OP.tmmU([1, n, 1], [Infinity, d, Infinity], th, l).R); return OP.xyz2srgb(xyz[0] * 3.2, xyz[1] * 3.2, xyz[2] * 3.2); };

  /* 14.1 Película de jabón */
  EM.defineSim('pelicula', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('d', { label: 'Espesor de la película', min: 0, max: 1500, step: 1, value: 300, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Índice de la película', min: 1.2, max: 1.6, step: 0.01, value: 1.33, fmt: (v) => v.toFixed(2) });
    sim.slider('th', { label: 'Ángulo de observación', min: 0, max: 70, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('col', 'Color reflejado (D65)', { hl: true });
    sim.out('max', 'Máximos de reflexión en el visible');
    let lut = null, key = '';
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = (p.th * Math.PI) / 180;
      EM.draw.clear(cv);
      const k = p.n + ',' + p.th;
      if (k !== key) { key = k; lut = []; for (let d = 0; d <= 1500; d += 5) lut.push(filmColor(d, p.n, th)); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 0.25, xlabel: 'λ (nm)', ylabel: 'reflectancia' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 5 }, 380, 780);
      pl.frame();
      const R = (l) => OP.tmmU([1, p.n, 1], [Infinity, p.d, Infinity], th, l).R;
      pl.fn(R, { color: '--accent', width: 2.2, n: 500, fill: '--accent', fillAlpha: 0.12 });
      const ct = Math.sqrt(1 - Math.pow(Math.sin(th) / p.n, 2)), maxs = [];
      for (let m = 0; m < 12; m++) { const l = (2 * p.n * p.d * ct) / (m + 0.5); if (l >= 380 && l <= 780) { maxs.push(l); pl.vline(l, { color: '--ink-3' }); } }
      /* película vertical que escurre */
      const fx = W * 0.64, fw = W * 0.14, fy = 24, fh = H - 34;
      for (let j = 0; j < fh; j++) { const d = 1500 * Math.pow(j / fh, 1.3); const c = lut[Math.min(lut.length - 1, Math.round(d / 5))]; ctx.fillStyle = D.css(c); ctx.fillRect(fx, fy + j, fw, 1.5); }
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(fx, fy, fw, fh);
      const jd = fh * Math.pow(p.d / 1500, 1 / 1.3);
      EM.draw.arrow(ctx, fx + fw + 26, fy + jd, fx + fw + 3, fy + jd, { color: '--ink', width: 1.6 });
      EM.text(ctx, 'película vertical', fx + fw / 2, fy - 6, { size: 10.5, color: '--ink-3', align: 'center' });
      const c = lut[Math.round(p.d / 5)];
      D.swatch(ctx, W * 0.84, H * 0.25, W * 0.13, H * 0.4, OP.rgb255(c), EM.fix(p.d, 0) + ' nm');
      sim.set('col', `<span style="display:inline-block;width:2.4em;height:1em;vertical-align:-2px;border:1px solid var(--rule-strong);background:${D.css(c)}"></span>`);
      sim.set('max', maxs.length ? maxs.map((l) => EM.fix(l, 0) + ' nm').join(', ') : 'ninguno (película negra o fuera del visible)');
    });
  });

  /* 14.2 Anillos de Newton */
  EM.defineSim('newton', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R', { label: 'Radio de la lente', min: 0.2, max: 5, step: 0.05, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 589, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Radios √(mλR) de los anillos oscuros 1–4', { hl: true });
    sim.out('f', 'Escala');
    const N = 170, valsR = new Float32Array(N * N), valsT = new Float32Array(N * N);
    let key = '';
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = p.lam * 1e-9;
      EM.draw.clear(cv);
      const rmax = 3.2 * Math.sqrt(lam * p.R); /* metros */
      const k = p.R + ',' + p.lam;
      if (k !== key) {
        key = k;
        const NT = 1500, tmax = (rmax * rmax * 2) / (2 * p.R), lut = new Float32Array(NT + 1);
        for (let i = 0; i <= NT; i++) lut[i] = OP.tmm('s', [1.52, 1, 1.52], [Infinity, ((tmax * i) / NT) * 1e9, Infinity], 0, p.lam).R;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const x = ((i + 0.5) / N - 0.5) * 2 * rmax, y = ((j + 0.5) / N - 0.5) * 2 * rmax, t = (x * x + y * y) / (2 * p.R);
          const Rv = lut[Math.min(NT, Math.round((t / tmax) * NT))];
          valsR[j * N + i] = Rv; valsT[j * N + i] = 1 - Rv;
        }
      }
      const rgb = OP.lambdaRGB(p.lam, 1, 0.35), S = Math.min(H - 30, W * 0.45);
      const rr = { x: W * 0.02, y: 8, w: S, h: S }, rt = { x: W * 0.52, y: 8, w: S, h: S };
      D.paint(ctx, valsR, N, N, rr, (v) => { const t = Math.min(1, v / 0.16); return [rgb[0] * t, rgb[1] * t, rgb[2] * t]; });
      D.paint(ctx, valsT, N, N, rt, (v) => { const t = Math.min(1, Math.max(0, (v - 0.82) / 0.18)); return [rgb[0] * (0.25 + 0.75 * t), rgb[1] * (0.25 + 0.75 * t), rgb[2] * (0.25 + 0.75 * t)]; });
      EM.text(ctx, 'reflexión', rr.x + S / 2, rr.y + S + 16, { size: 11.5, align: 'center', color: '--ink-2' });
      EM.text(ctx, 'transmisión (contraste realzado)', rt.x + S / 2, rt.y + S + 16, { size: 11.5, align: 'center', color: '--ink-2' });
      const rs = [1, 2, 3, 4].map((m) => Math.sqrt(m * lam * p.R) * 1000);
      sim.set('r', rs.map((r) => EM.fix(r, 3)).join(', ') + ' mm');
      sim.set('f', 'ancho de cada recuadro: ' + EM.fix(2 * rmax * 1000, 2) + ' mm');
    });
  });

  /* 14.3 Cuña de aire */
  EM.defineSim('cuna', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('h', { label: 'Grosor del objeto que separa las láminas', min: 5, max: 120, step: 0.5, value: 50, unit: 'µm', fmt: (v) => v.toFixed(1) });
    sim.slider('def', { label: 'Defecto de planitud (abombamiento)', min: -1.5, max: 1.5, step: 0.05, value: 0, unit: 'franjas', fmt: (v) => v.toFixed(2) });
    sim.out('dx', 'Separación de las franjas', { hl: true });
    sim.out('N', 'Número de franjas en 10 cm');
    const Lp = 0.1, lam = 589.3e-9;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const nx = 600, ny = 60, vals = new Float32Array(nx * ny);
      /* se muestran los primeros 2 cm de la cuña (ampliados) */
      const span = 0.02;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = (i / nx) * span, y = j / ny - 0.5, t = (x / Lp) * p.h * 1e-6 + p.def * (lam / 2) * (1 - 4 * y * y) * Math.sin((Math.PI * i) / nx);
        vals[j * nx + i] = 0.5 * (1 - Math.cos((4 * Math.PI * t) / lam));
      }
      const rgb = OP.lambdaRGB(589, 1, 0.35);
      D.paint(ctx, vals, nx, ny, { x: 10, y: 10, w: W - 20, h: H * 0.5 }, D.tint(rgb, 0.8));
      EM.text(ctx, 'primeros 2 cm de la cuña vista desde arriba (luz de sodio)', 12, H * 0.5 + 26, { size: 11, color: '--ink-2' });
      /* perfil lateral (exagerado) */
      const v = D.view({ x: 10, y: H * 0.62, w: W - 20, h: H * 0.34 }, 0, Lp, -0.2 * p.h, 1.3 * p.h, false);
      ctx.fillStyle = EM.alpha('--glass', 0.35);
      ctx.fillRect(v.X(0), v.Y(0), v.X(Lp) - v.X(0), 8);
      ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(Lp), v.Y(p.h)); ctx.lineTo(v.X(Lp), v.Y(p.h) - 8); ctx.lineTo(v.X(0), v.Y(0) - 8); ctx.fill();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(Lp) - 4, v.Y(p.h / 2), 4, 0, 7); ctx.fill();
      EM.text(ctx, 'objeto de ' + EM.fix(p.h, 1) + ' µm (escala vertical exagerada)', v.X(Lp) - 12, v.Y(p.h) - 14, { size: 11, color: '--ink-2', align: 'right' });
      const alpha = (p.h * 1e-6) / Lp;
      sim.set('dx', EM.fix((lam / (2 * alpha)) * 1000, 3) + ' mm');
      sim.set('N', EM.fix((2 * p.h * 1e-6) / lam, 1) + ' (2h/λ)');
    });
  });

  /* 14.4 Interferómetro de Michelson */
  EM.defineSim('michelson', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('src', { label: 'Fuente', options: [['l', 'Láser 633 nm'], ['na', 'Sodio'], ['w', 'Luz blanca']], value: 'l' });
    sim.slider('dL', { label: 'Diferencia de brazos ΔL', min: -30, max: 30, step: 0.005, value: 8, unit: 'µm', fmt: (v) => v.toFixed(3) });
    sim.slider('tilt', { label: 'Inclinación del espejo', min: 0, max: 0.4, step: 0.005, value: 0, unit: 'mrad', fmt: (v) => v.toFixed(3) });
    sim.out('n', 'Orden en el centro 2ΔL/λ', { hl: true });
    sim.out('c', 'Franjas contadas desde que empezó a mover');
    let moving = 0, start = null;
    sim.animate((dt) => { const v = sim.p.src === 'w' ? 0.3 : 0.633; sim.ctl.dL.set(Math.max(-30, Math.min(30, sim.p.dL + dt * v * 0.5)), true); moving += dt; });
    sim.onChange = (id) => { if (id === 'src') start = null; };
    const N = 150, vals = new Array(N * N);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      if (start === null) start = p.dL;
      EM.draw.clear(cv);
      const lines = p.src === 'l' ? [[632.8, 1]] : p.src === 'na' ? [[588.995, 1], [589.592, 0.5]] : null;
      const spec = lines || (() => { const a = []; for (let l = 400; l <= 700; l += 10) a.push([l, OP.planck(l * 1e-9, 5800)]); return a; })();
      let ref = 0; for (const [l, w] of spec) ref += w * OP.cmf(l)[1] * 2;
      const thmax = Math.max(0.02, Math.min(0.5, 2.5 * Math.sqrt(0.6 / (2 * Math.max(Math.abs(p.dL), 0.05)))));
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const ax = ((i + 0.5) / N - 0.5) * 2 * thmax, ay = ((j + 0.5) / N - 0.5) * 2 * thmax, th2 = ax * ax + ay * ay;
        const opd = 2 * p.dL * 1e-6 * (1 - th2 / 2) + 2 * p.tilt * 1e-3 * (((i + 0.5) / N - 0.5) * 0.02);
        let X = 0, Y = 0, Z = 0;
        for (const [l, w] of spec) { const I = w * (1 + Math.cos((2 * Math.PI * opd) / (l * 1e-9))), c = OP.cmf(l); X += I * c[0]; Y += I * c[1]; Z += I * c[2]; }
        const g = OP.xyz2srgb((X / ref) * 0.6, (Y / ref) * 0.6, (Z / ref) * 0.6);
        vals[j * N + i] = OP.rgb255(g);
      }
      const S = Math.min(H - 16, W * 0.48), r = { x: 8, y: 8, w: S, h: S };
      D.paint(ctx, vals, N, N, r, (v) => v);
      /* esquema */
      const v = D.view({ x: S + 30, y: 10, w: W - S - 40, h: H - 20 }, -1.2, 1.4, -1.3, 1.2);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(...v.map([-0.25, -0.25])); ctx.lineTo(...v.map([0.25, 0.25])); ctx.stroke();
      ctx.fillStyle = EM.col('--mirror'); const m1x = 1.1 + p.dL * 0.006;
      ctx.save(); ctx.translate(...v.map([m1x, 0])); ctx.rotate(-p.tilt * 2); ctx.fillRect(-3, -22, 6, 44); ctx.restore();
      ctx.fillRect(v.X(0) - 22, v.Y(1.0) - 3, 44, 6);
      D.ray(ctx, v, [[-1.2, 0], [0, 0], [m1x, 0]], { color: '--ray', width: 1.6 });
      D.ray(ctx, v, [[0, 0], [0, 1.0]], { color: '--ray', width: 1.6 });
      D.ray(ctx, v, [[0, 0], [0, -1.2]], { color: '--c1', width: 2 });
      EM.text(ctx, 'espejo móvil', v.X(m1x), v.Y(0) + 34, { size: 10.5, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'espejo fijo', v.X(0) + 30, v.Y(1.0) + 4, { size: 10.5, color: '--ink-2' });
      EM.text(ctx, 'detector', v.X(0) + 8, v.Y(-1.2) + 4, { size: 10.5, color: '--ink-2' });
      const l0 = p.src === 'w' ? 550 : 589.3 + (p.src === 'l' ? 43.5 : 0);
      sim.set('n', EM.fix((2 * p.dL * 1000) / l0, 2));
      sim.set('c', EM.fix((2 * (p.dL - start) * 1000) / l0, 1));
    });
  });
})();
