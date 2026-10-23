/* Capítulo 13 — El experimento de Young */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 13.1 Dos fuentes coherentes */
  EM.defineSim('young', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('d', { label: 'Separación de las rendijas d', min: 2, max: 30, step: 0.1, value: 8, unit: 'µm', fmt: (v) => v.toFixed(1) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia a la pantalla (perfil)', min: 0.05, max: 2, step: 0.01, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.check('inst', { label: 'Campo instantáneo (animado)', value: false });
    sim.out('dy', 'Interfranja en la pantalla', { hl: true });
    sim.out('form', 'λL/d');
    sim.out('ord', 'Órdenes posibles (|sen θ| ≤ 1)');
    const nx = 220, ny = 150;
    let key = '', I2 = null, re1 = null, im1 = null, t = 0;
    sim.animate((dt) => { if (sim.p.inst) t += dt; else t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = p.lam / 1000; /* µm */
      EM.draw.clear(cv);
      const X = 60, Y = 30, k = (2 * Math.PI) / lam;
      const kk = p.d + ',' + p.lam;
      if (kk !== key) {
        key = kk; I2 = new Float32Array(nx * ny); re1 = new Float32Array(nx * ny); im1 = new Float32Array(nx * ny);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const x = 0.5 + (i / (nx - 1)) * X, y = Y - (j / (ny - 1)) * 2 * Y;
          const r1 = Math.hypot(x, y - p.d / 2), r2 = Math.hypot(x, y + p.d / 2);
          const a = Math.cos(k * r1) / Math.sqrt(r1) + Math.cos(k * r2) / Math.sqrt(r2), b = Math.sin(k * r1) / Math.sqrt(r1) + Math.sin(k * r2) / Math.sqrt(r2);
          const q = j * nx + i; re1[q] = a; im1[q] = b; I2[q] = (a * a + b * b) * x / 4;
        }
      }
      const rgb = OP.lambdaRGB(p.lam, 1, 0.35), mw = W * 0.6, r = { x: 0, y: 0, w: mw, h: H };
      if (p.inst) {
        const c = Math.cos(2 * Math.PI * 0.6 * t * 3), s = Math.sin(2 * Math.PI * 0.6 * t * 3);
        const vals = new Float32Array(nx * ny);
        for (let q = 0; q < nx * ny; q++) { const xi = 0.5 + ((q % nx) / (nx - 1)) * X; vals[q] = (re1[q] * c + im1[q] * s) * Math.sqrt(xi) / 2; }
        D.paint(ctx, vals, nx, ny, r, (v) => EM.cmap.diverging(Math.max(-1, Math.min(1, v))));
      } else D.paint(ctx, I2, nx, ny, r, D.tint(rgb, 0.7));
      ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 4, H);
      for (const s of [-1, 1]) { const yy = H / 2 - (s * p.d / 2 / Y) * (H / 2); ctx.fillStyle = '#FFF'; ctx.fillRect(0, yy - 2, 5, 4); }
      EM.text(ctx, '60 µm', mw - 6, H - 8, { size: 11, color: '#DDD', align: 'right' });
      /* perfil en la pantalla lejana */
      const dy = (p.lam * 1e-9 * p.L) / (p.d * 1e-6) * 1000; /* mm */
      const pl = new EM.Plot(ctx, { x: mw + 4, y: 0, w: W - mw - 4, h: H, xmin: 0, xmax: 4.2, ymin: -3 * dy, ymax: 3 * dy, xlabel: 'I/I₀', ylabel: 'y en la pantalla (mm)' });
      pl.frame();
      const ys = [], xs = [];
      for (let i = 0; i <= 400; i++) { const y = -3 * dy + (6 * dy * i) / 400, th = Math.atan(y / 1000 / p.L); ys.push(y); xs.push(4 * Math.pow(Math.cos((Math.PI * p.d * 1e-6 * Math.sin(th)) / (p.lam * 1e-9)), 2)); }
      pl.xy(xs, ys, { color: D.lamRay(p.lam), width: 2 });
      sim.set('dy', EM.fix(dy, 3) + ' mm');
      sim.set('form', EM.fix(dy, 3) + ' mm (aproximación de ángulos pequeños)');
      sim.set('ord', '|m| ≤ ' + Math.floor(p.d / lam));
    });
  });

  /* 13.2 Franjas en luz blanca */
  EM.defineSim('young-blanca', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('src', { label: 'Fuente', options: [['w', 'Blanca (5800 K)'], ['g', 'Banda gaussiana']], value: 'w' });
    sim.slider('dl', { label: 'Ancho de la banda (FWHM)', min: 5, max: 200, step: 1, value: 40, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('l0', { label: 'Centro de la banda', min: 420, max: 680, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación de las rendijas', min: 0.1, max: 1, step: 0.01, value: 0.3, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.out('dy', 'Interfranja a 550 nm (L = 1 m)', { hl: true });
    sim.out('n', 'Franjas distinguibles (aprox. l_c/λ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.dl.show(p.src === 'g'); sim.ctl.l0.show(p.src === 'g');
      const S = p.src === 'w' ? (l) => OP.planck(l * 1e-9, 5800) : (l) => Math.exp(-0.5 * Math.pow((l - p.l0) / (p.dl / 2.3548), 2));
      const L = 1, dy550 = (550e-9 * L) / (p.d * 1e-3) * 1000, ymax = 6 * dy550;
      let ref = 0; for (let l = 380; l <= 780; l += 5) ref += S(l) * OP.cmf(l)[1] * 2;
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.36, w: W, h: H * 0.64, xmin: -ymax, xmax: ymax, ymin: 0, ymax: 4.3, xlabel: 'posición en la pantalla (mm)', ylabel: 'I' });
      const strip = { x: pl.ix, y: 14, w: pl.iw, h: H * 0.32 };
      for (let i = 0; i < strip.w; i++) {
        const y = -ymax + (2 * ymax * (i + 0.5)) / strip.w;
        let X = 0, Y = 0, Z = 0;
        for (let l = 380; l <= 780; l += 5) { const I = S(l) * 2 * (1 + Math.cos((2 * Math.PI * (p.d * 1e-3) * (y * 1e-3)) / (L * l * 1e-9))), c = OP.cmf(l); X += I * c[0]; Y += I * c[1]; Z += I * c[2]; }
        const g = OP.xyz2srgb((X / ref) * 0.5, (Y / ref) * 0.5, (Z / ref) * 0.5);
        ctx.fillStyle = D.css(g); ctx.fillRect(strip.x + i, strip.y, 1.5, strip.h);
      }
      pl.frame();
      for (const l of [450, 550, 650]) pl.fn((y) => 2 * (1 + Math.cos((2 * Math.PI * (p.d * 1e-3) * (y * 1e-3)) / (L * l * 1e-9))), { color: D.lamRay(l), width: 1.5, n: 600 });
      const lc = p.src === 'w' ? 1.0 : (Math.pow(p.l0 / 1000, 2) / (p.dl / 1000));
      sim.set('dy', EM.fix(dy550, 3) + ' mm');
      sim.set('n', '≈ ' + EM.fix(lc / (p.src === 'w' ? 0.55 : p.l0 / 1000), 1) + ' a cada lado');
    });
  });

  /* 13.3 Espejo de Lloyd y biprisma de Fresnel */
  EM.defineSim('lloyd', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('m', { label: 'Montaje', options: [['l', 'Espejo de Lloyd'], ['b', 'Biprisma de Fresnel']], value: 'l' });
    sim.slider('h', { label: 'Altura de la rendija sobre el espejo', min: 0.1, max: 1.5, step: 0.01, value: 0.4, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('al', { label: 'Ángulo de los prismas α', min: 0.1, max: 2, step: 0.01, value: 0.5, unit: '°', fmt: (v) => v.toFixed(2) });
    sim.check('pi', { label: 'Desfase de π en la reflexión', value: true });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('d', 'Separación de las fuentes', { hl: true });
    sim.out('dy', 'Interfranja');
    sim.out('c', 'Franja en el plano de simetría');
    const L = 1.5;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = p.lam * 1e-9;
      EM.draw.clear(cv);
      sim.ctl.h.show(p.m === 'l'); sim.ctl.pi.show(p.m === 'l'); sim.ctl.al.show(p.m === 'b');
      const lloyd = p.m === 'l';
      const d = lloyd ? 2 * p.h * 1e-3 : 2 * 0.1 * 0.5 * ((p.al * Math.PI) / 180);
      const dy = (lam * L) / d;
      /* esquema (no a escala vertical) */
      const v = D.view({ x: 10, y: 10, w: W * 0.6 - 20, h: H - 20 }, -0.2, 1.6, -0.5, 0.5, false);
      if (lloyd) {
        ctx.fillStyle = EM.col('--mirror'); ctx.fillRect(v.X(0.2), v.Y(0), v.X(1.2) - v.X(0.2), 5);
        const S = [0, 0.18], Si = [0, -0.18], P = [1.5, 0.3];
        D.ray(ctx, v, [S, P], { color: '--ray', width: 1.6 });
        const xr = (S[1] * (P[0] - S[0])) / (S[1] + P[1]);
        D.ray(ctx, v, [S, [xr, 0], P], { color: '--c1', width: 1.6 });
        D.ray(ctx, v, [Si, [xr, 0]], { color: '--c1', width: 1, dash: [4, 4] });
        ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(...v.map(S), 4, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(...v.map(Si), 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        EM.text(ctx, 'rendija', v.X(S[0]) + 6, v.Y(S[1]) - 6, { size: 11, color: '--ink-2' });
        EM.text(ctx, 'imagen virtual', v.X(Si[0]) + 6, v.Y(Si[1]) + 14, { size: 11, color: '--ink-3' });
      } else {
        const x0 = 0.35, A = 0.4;
        ctx.beginPath(); ctx.moveTo(v.X(x0), v.Y(A)); ctx.lineTo(v.X(x0 + 0.12), v.Y(0)); ctx.lineTo(v.X(x0), v.Y(-A)); ctx.closePath();
        ctx.fillStyle = EM.alpha('--glass', 0.35); ctx.fill(); ctx.strokeStyle = EM.col('--glass'); ctx.stroke();
        const S = [0, 0];
        for (const s of [-1, 1]) for (const yy of [0.12, 0.3]) { const P1 = [x0 + 0.06, s * yy]; const out = [1.5, s * yy - s * (1.5 - P1[0]) * 0.45]; D.ray(ctx, v, [S, P1, out], { color: s > 0 ? '--ray' : '--c1', width: 1.3, arrow: false }); }
        ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(...v.map(S), 4, 0, 7); ctx.fill();
        EM.text(ctx, 'biprisma', v.X(x0), v.Y(A) - 6, { size: 11, color: '--ink-2', align: 'center' });
      }
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(v.X(1.5), v.Y(0.5), 3, v.Y(-0.5) - v.Y(0.5));
      /* patrón */
      const rgb = OP.lambdaRGB(p.lam, 1, 0.35), r = { x: W * 0.62, y: 10, w: W * 0.12, h: H - 20 };
      const ymax = 6 * dy;
      const I = (s) => { const y = s * ymax; if (lloyd && y < 0) return 0; return 1 + Math.cos((2 * Math.PI * d * y) / (lam * L) + (lloyd && p.pi ? Math.PI : 0)); };
      D.screen(ctx, r, I, rgb, { vertical: true, max: 2, gamma: 0.8 });
      const pl = new EM.Plot(ctx, { x: W * 0.75, y: 0, w: W * 0.25, h: H, xmin: 0, xmax: 2.1, ymin: -ymax * 1000, ymax: ymax * 1000, xlabel: 'I', ylabel: 'y (mm)', ml: 46 });
      pl.frame();
      const xs = [], ys = []; for (let i = 0; i <= 400; i++) { const s = -1 + i / 200; xs.push(I(s)); ys.push(s * ymax * 1000); } pl.xy(xs, ys, { color: D.lamRay(p.lam), width: 1.8 });
      sim.set('d', EM.fix(d * 1000, 3) + ' mm');
      sim.set('dy', EM.fix(dy * 1000, 3) + ' mm (pantalla a 1.5 m)');
      sim.set('c', lloyd ? (p.pi ? 'oscura (desfase de π)' : 'brillante (sin desfase)') : 'brillante');
    });
  });

  /* 13.4 Fotones uno a uno */
  EM.defineSim('fotones-young', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('rate', { label: 'Fotones por segundo', min: 5, max: 5000, log: true, value: 60, fmt: (v) => v.toFixed(0) });
    sim.check('wp', { label: 'Detector que registra la rendija', value: false });
    sim.out('N', 'Fotones detectados', { hl: true });
    sim.out('f', 'Patrón');
    const NB = 160;
    let hits = [], hist = new Float64Array(NB), N = 0, acc = 0;
    const rng = OP.rng(2024);
    const reset = () => { hits = []; hist = new Float64Array(NB); N = 0; };
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'wp') reset(); };
    const I = (y, wp) => { const env = Math.pow(OP.sinc(Math.PI * 0.9 * y), 2); return wp ? env : env * Math.pow(Math.cos(Math.PI * 4 * y), 2); };
    const draw1 = (wp) => {
      /* muestreo por rechazo sobre y ∈ [−1.2, 1.2] */
      for (let k = 0; k < 100; k++) { const y = -1.2 + 2.4 * rng(), u = rng(); if (u <= I(y, wp)) return y; }
      return 0;
    };
    const add = (n) => { for (let i = 0; i < n; i++) { const y = draw1(sim.p.wp); const x = rng(); if (hits.length < 6000) hits.push([x, y]); const b = Math.floor(((y + 1.2) / 2.4) * NB); if (b >= 0 && b < NB) hist[b]++; N++; } };
    sim.button('+1', () => add(1)); sim.button('+100', () => add(100)); sim.button('+10 000', () => add(10000));
    sim.animate((dt) => { acc += dt * sim.p.rate; const n = Math.floor(acc); acc -= n; add(n); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.dark(cv);
      const r = { x: 10, y: 10, w: W * 0.5, h: H - 20 };
      ctx.fillStyle = '#7CFFB2';
      const n0 = Math.max(0, hits.length - 6000);
      for (let i = n0; i < hits.length; i++) { const q = hits[i]; ctx.fillRect(r.x + q[0] * r.w, r.y + ((q[1] + 1.2) / 2.4) * r.h, 1.6, 1.6); }
      ctx.strokeStyle = '#555'; ctx.strokeRect(r.x, r.y, r.w, r.h);
      let sI = 0; const exp = [];
      for (let b = 0; b < NB; b++) { const e = I(-1.2 + ((b + 0.5) / NB) * 2.4, p.wp); exp.push(e); sI += e; }
      const expN = exp.map((e) => (e * N) / sI);
      const mx = Math.max(1, ...hist, ...(N > 50 ? expN : [0]));
      const x0 = W * 0.55, w0 = W * 0.42;
      ctx.fillStyle = 'rgba(124,255,178,0.5)';
      for (let b = 0; b < NB; b++) { const len = (hist[b] / mx) * w0; ctx.fillRect(x0, r.y + (b / NB) * r.h, len, r.h / NB + 0.5); }
      if (N > 50) {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let b = 0; b < NB; b++) { const len = (expN[b] / mx) * w0, yy = r.y + ((b + 0.5) / NB) * r.h; b ? ctx.lineTo(x0 + len, yy) : ctx.moveTo(x0 + len, yy); }
        ctx.stroke();
      }
      EM.text(ctx, 'pantalla', r.x + 6, r.y + 16, { size: 11, color: '#BBB' });
      EM.text(ctx, 'histograma', x0 + 6, r.y + 16, { size: 11, color: '#BBB' });
      sim.set('N', N.toLocaleString('es-CO'));
      sim.set('f', p.wp ? 'sin franjas: se sabe por qué rendija pasó cada fotón' : 'franjas de interferencia');
    });
  });
})();
