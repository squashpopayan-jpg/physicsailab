/* Capítulo 21 — Interferencia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* Color percibido de un espectro de reflectancia R(λ) bajo luz blanca */
  function whiteColor(R) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let nm = 400; nm <= 700; nm += 5) {
      const c = EM.wavelengthRGB(nm), w = R(nm);
      r += c[0] * w; g += c[1] * w; b += c[2] * w; n++;
    }
    /* normalización: blanco cuando R = 1 */
    if (!whiteColor.ref) { let a = 0, bb = 0, cc = 0; for (let nm = 400; nm <= 700; nm += 5) { const c = EM.wavelengthRGB(nm); a += c[0]; bb += c[1]; cc += c[2]; } whiteColor.ref = [a, bb, cc]; }
    const ref = whiteColor.ref;
    return [M.clamp((255 * r) / ref[0], 0, 255), M.clamp((255 * g) / ref[1], 0, 255), M.clamp((255 * b) / ref[2], 0, 255)];
  }
  EM.whiteColor = whiteColor;

  /* ======================================================================
     21.1 Dos fuentes
     ====================================================================== */
  EM.defineSim('two-source', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('d', { label: 'Separación de las fuentes <i>d</i>/<i>λ</i>', min: 0.3, max: 6, step: 0.05, value: 3, fmt: f2 });
    sim.slider('ph', { label: 'Desfase entre fuentes <i>δ</i><sub>0</sub>', min: 0, max: 360, step: 5, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.seg('view', { label: 'Mostrar', options: [['inst', 'Onda instantánea'], ['I', 'Intensidad promedio']], value: 'inst' });
    sim.check('lines', { label: 'Líneas nodales teóricas', value: true });
    sim.out('n', 'Líneas nodales', { hl: true });
    sim.out('dir', 'Direcciones de máximos (lejos)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const lamPx = Math.min(W, H) / 9, k = (2 * Math.PI) / lamPx, d0 = M.rad(p.ph);
      const s1 = [W * 0.15, H / 2 - (p.d * lamPx) / 2], s2 = [W * 0.15, H / 2 + (p.d * lamPx) / 2];
      const wt = 2 * Math.PI * 0.8 * t;
      EM.paintField(cv, 200, 125, (u, v) => {
        const x = u * W, y = v * H;
        const r1 = Math.max(4, Math.hypot(x - s1[0], y - s1[1])), r2 = Math.max(4, Math.hypot(x - s2[0], y - s2[1]));
        if (p.view === 'I') { const dd = k * (r2 - r1) + d0; return 2 * Math.cos(dd / 2) ** 2 - 1; }
        return 0.5 * (Math.cos(k * r1 - wt) + Math.cos(k * r2 - wt + d0)) * Math.min(1, 6 / Math.sqrt(Math.min(r1, r2) / lamPx + 0.5));
      });
      if (p.lines) {
        ctx.strokeStyle = EM.alpha('--ink', 0.55); ctx.lineWidth = 1;
        for (let m = -12; m <= 12; m++) {
          const D = ((m + 0.5) * 2 * Math.PI - d0) / k; /* r2 − r1 = D */
          if (Math.abs(D) >= p.d * lamPx) continue;
          ctx.beginPath();
          let pen = false;
          for (let yy = -H; yy <= 2 * H; yy += 3) {
            /* resolver x a lo largo de la hipérbola: r2 − r1 = D */
            const f = (x) => Math.hypot(x - s2[0], yy - s2[1]) - Math.hypot(x - s1[0], yy - s1[1]) - D;
            const xa = s1[0], xb = s1[0] + 3 * W;
            if (f(xa) * f(xb) > 0) { pen = false; continue; }
            const x = M.bisect(f, xa, xb, 0.3, 40);
            if (!pen) { ctx.moveTo(x, yy); pen = true; } else ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
      }
      EM.draw.bob(ctx, s1[0], s1[1], 6, { color: '--ink' });
      EM.draw.bob(ctx, s2[0], s2[1], 6, { color: '--ink' });
      let n = 0;
      for (let m = -20; m <= 20; m++) { const D = (m + 0.5) * 2 * Math.PI - d0; if (Math.abs(D / (2 * Math.PI)) < p.d) n++; }
      const dirs = [];
      for (let m = -6; m <= 6; m++) { const s = (m - p.ph / 360) / p.d; if (Math.abs(s) <= 1) dirs.push(EM.fix(M.deg(Math.asin(s)), 1) + '°'); }
      sim.set('n', String(n));
      sim.set('dir', dirs.join(', '));
    });
  });

  /* ======================================================================
     21.2 Experimento de Young
     ====================================================================== */
  EM.defineSim('young', function (sim) {
    const cs = sim.canvas({ aspect: 4.5, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.slider('lam', { label: 'Longitud de onda <i>λ</i>', min: 400, max: 700, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.check('white', { label: 'Luz blanca', value: false });
    sim.slider('d', { label: 'Separación entre rendijas <i>d</i>', min: 0.05, max: 2, step: 0.01, value: 0.25, unit: 'mm', fmt: f2 });
    sim.slider('a', { label: 'Ancho de cada rendija <i>a</i>', min: 5, max: 200, step: 1, value: 40, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia a la pantalla <i>L</i>', min: 0.3, max: 5, step: 0.1, value: 1.5, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.out('dy', 'Separación entre franjas <i>λL</i>/<i>d</i>', { hl: true });
    sim.out('env', 'Ancho del máximo central de difracción 2<i>λL</i>/<i>a</i>');
    sim.out('n', 'Franjas dentro del máximo central');
    const I = (y, nm) => { const p = sim.p, lam = nm * 1e-9, d = p.d * 1e-3, a = p.a * 1e-6; const s = y / Math.hypot(y, p.L); const b = (Math.PI * a * s) / lam; return Math.cos((Math.PI * d * s) / lam) ** 2 * EM.sinc(b) ** 2; };
    sim.onDraw(() => {
      const p = sim.p;
      const ymax = Math.max(4 * (p.lam * 1e-9 * p.L) / (p.d * 1e-3), 0.004);
      const Y = Math.min(ymax, ((1.2 * p.lam * 1e-9 * p.L) / (p.a * 1e-6)));
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      EM.draw.clear(cs, '#000000');
      for (let i = 0; i < W; i++) {
        const y = (i / W - 0.5) * 2 * Y;
        let c;
        if (p.white) c = whiteColor((nm) => I(y, nm));
        else { const v = I(y, p.lam), q = EM.wavelengthRGB(p.lam); c = [q[0] * v, q[1] * v, q[2] * v]; }
        ctx.fillStyle = EM.rgbStr(c); ctx.fillRect(i, 0, 1.5, H);
      }
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -Y * 1000, xmax: Y * 1000, ymin: 0, ymax: 1.1, xlabel: 'posición en la pantalla y (mm)', ylabel: 'I / I_{máx}', ml: 52 });
      pl.frame();
      if (p.white) [450, 550, 650].forEach((nm) => pl.fn((ym) => I(ym / 1000, nm), { color: EM.rgbStr(EM.wavelengthRGB(nm)), width: 1.6, n: 900 }));
      else { pl.fn((ym) => { const p2 = sim.p; const s = ym / 1000 / p2.L; return EM.sinc((Math.PI * p2.a * 1e-6 * s) / (p2.lam * 1e-9)) ** 2; }, { color: '--ink-3', width: 1.2, dash: [5, 4], n: 600 }); pl.fn((ym) => I(ym / 1000, p.lam), { color: EM.rgbStr(EM.wavelengthRGB(p.lam)), width: 2, n: 1200 }); }
      const dy = (p.lam * 1e-9 * p.L) / (p.d * 1e-3), env = (2 * p.lam * 1e-9 * p.L) / (p.a * 1e-6);
      sim.set('dy', EM.si(dy, 'm'));
      sim.set('env', EM.si(env, 'm'));
      sim.set('n', String(2 * Math.floor((p.d * 1e-3) / (p.a * 1e-6) - 1e-9) + 1));
    });
  });

  /* ======================================================================
     21.3 Dos parlantes
     ====================================================================== */
  EM.defineSim('speakers', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('f', { label: 'Frecuencia', min: 100, max: 1500, step: 10, value: 343, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación de los parlantes', min: 0.3, max: 4, step: 0.05, value: 2, unit: 'm', fmt: f2 });
    sim.seg('pol', { label: 'Polaridad del parlante 2', options: [[1, 'Normal'], [-1, 'Invertida']], value: 1 });
    sim.check('one', { label: 'Apagar el parlante 2', value: false });
    if (EM.audio.ok()) sim.button('♪ Escuchar en la posición del oyente', () => { const A = amp(); EM.audio.play((t) => A * Math.sin(2 * Math.PI * sim.p.f * t), 1.6, 0.3, false); });
    sim.hint('Arrastra al oyente', cv);
    sim.out('A', 'Amplitud relativa a un solo parlante', { hl: true });
    sim.out('dr', 'Diferencia de caminos / <i>λ</i>');
    const Lx = 8, Ly = 5;
    const lis = { x: 5, y: 0.6 };
    let view = null;
    const amp = () => { const p = sim.p, k = (2 * Math.PI * p.f) / 343; const r1 = Math.hypot(lis.x - 0.4, lis.y - p.d / 2), r2 = Math.hypot(lis.x - 0.4, lis.y + p.d / 2); let re = Math.cos(k * r1) / r1, im = Math.sin(k * r1) / r1; if (!p.one) { re += (p.pol * Math.cos(k * r2)) / r2; im += (p.pol * Math.sin(k * r2)) / r2; } return Math.min(3, Math.hypot(re, im) * r1); };
    EM.pointer(cv, {
      down: (x, y) => (view && Math.hypot(view.X(lis.x) - x, view.Y(lis.y) - y) < 18 ? 1 : null),
      move: (_, x, y) => { lis.x = M.clamp(view.ix(x), 0.8, Lx - 0.2); lis.y = M.clamp(view.iy(y), -Ly / 2 + 0.2, Ly / 2 - 0.2); sim.redraw(); },
      hover: (x, y) => view && Math.hypot(view.X(lis.x) - x, view.Y(lis.y) - y) < 18
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = (2 * Math.PI * p.f) / 343;
      const sc = Math.min(W / Lx, H / Ly);
      view = { X: (x) => x * sc, Y: (y) => H / 2 - y * sc, ix: (px) => px / sc, iy: (py) => (H / 2 - py) / sc };
      EM.draw.clear(cv);
      EM.paintField(cv, 200, 125, (u, v) => {
        const x = u * Lx, y = (0.5 - v) * Ly;
        const r1 = Math.max(0.15, Math.hypot(x - 0.4, y - p.d / 2)), r2 = Math.max(0.15, Math.hypot(x - 0.4, y + p.d / 2));
        let re = Math.cos(k * r1) / r1, im = Math.sin(k * r1) / r1;
        if (!p.one) { re += (p.pol * Math.cos(k * r2)) / r2; im += (p.pol * Math.sin(k * r2)) / r2; }
        const a = Math.hypot(re, im) * Math.min(r1, r2);
        return M.clamp(a - 1, -1, 1);
      }, { w: Lx * sc, h: Ly * sc });
      [[0.4, p.d / 2], [0.4, -p.d / 2]].forEach(([x, y], i) => { if (i === 1 && p.one) return; ctx.fillStyle = EM.col('--ink'); ctx.fillRect(view.X(x) - 8, view.Y(y) - 12, 12, 24); });
      ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(view.X(lis.x), view.Y(lis.y), 9, 0, 7); ctx.fill();
      EM.text(ctx, 'rojo: refuerzo · azul: cancelación (respecto al parlante más cercano)', 10, H - 10, { size: 11, color: '--ink-2', halo: true });
      const r1 = Math.hypot(lis.x - 0.4, lis.y - p.d / 2), r2 = Math.hypot(lis.x - 0.4, lis.y + p.d / 2);
      sim.set('A', EM.fix(amp(), 2));
      sim.set('dr', EM.fix(((r2 - r1) * p.f) / 343, 2));
    });
  });

  /* ======================================================================
     21.4 Película delgada
     ====================================================================== */
  EM.defineSim('thin-film', function (sim) {
    sim.cols2();
    const cw = sim.canvas({ aspect: 0.8 });
    const cr = sim.canvas({ aspect: 0.8 });
    sim.seg('sys', { label: 'Sistema', options: [['soap', 'Jabón en aire'], ['coat', 'Recubrimiento sobre vidrio'], ['oil', 'Aceite sobre agua']], value: 'soap' });
    sim.slider('n', { label: 'Índice de la película <i>n</i>', min: 1.2, max: 1.6, step: 0.01, value: 1.33, fmt: f2 });
    sim.slider('t', { label: 'Espesor <i>t</i>', min: 0, max: 1500, step: 1, value: 300, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('col', 'Color reflejado', { hl: true });
    sim.out('max', 'Longitudes de onda reforzadas (visible)');
    const nOut = () => ({ soap: [1, 1], coat: [1, 1.52], oil: [1, 1.33] }[sim.p.sys]);
    const R = (nm, t) => {
      const p = sim.p, [n0, n2] = nOut(), n = p.n;
      const r1 = (n0 - n) / (n0 + n), r2 = (n - n2) / (n + n2);
      const d = (4 * Math.PI * n * t) / nm;
      const re = r1 + r2 * Math.cos(d), im = r2 * Math.sin(d);
      return re * re + im * im;
    };
    sim.onDraw(() => {
      const p = sim.p;
      /* cuña de espesor creciente hacia abajo (película que drena) */
      EM.draw.clear(cw);
      const ctx = cw.ctx, W = cw.w, H = cw.h;
      const [n0, n2] = nOut(), r1 = Math.abs((n0 - p.n) / (n0 + p.n)), r2 = Math.abs((p.n - n2) / (p.n + n2));
      const norm = 1 / Math.max(1e-4, (r1 + r2) ** 2);
      for (let j = 0; j < H; j++) {
        const t = (1500 * j) / H;
        const c = whiteColor((nm) => Math.min(1, R(nm, t) * norm));
        ctx.fillStyle = EM.rgbStr(c); ctx.fillRect(10, j, W - 20, 1.5);
      }
      const yt = (p.t / 1500) * H;
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.strokeRect(6, yt - 3, W - 12, 6);
      EM.text(ctx, 'espesor 0', 14, 14, { size: 11, color: '#fff', halo: '#000' });
      EM.text(ctx, '1500 nm', 14, H - 8, { size: 11, color: '#fff', halo: '#000' });
      EM.draw.clear(cr);
      const pl = new EM.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 400, xmax: 700, ymin: 0, ymax: Math.max(0.02, 1.1 / norm), xlabel: 'λ (nm)', ylabel: 'reflectancia', ml: 52 });
      pl.frame();
      for (let nm = 400; nm < 700; nm += 3) { const c = EM.wavelengthRGB(nm); cr.ctx.fillStyle = EM.rgbStr(c, 0.25); cr.ctx.fillRect(pl.X(nm), pl.iy, pl.X(nm + 3) - pl.X(nm), pl.ih); }
      pl.fn((nm) => R(nm, p.t), { color: '--ink', width: 2.2 });
      const c = whiteColor((nm) => Math.min(1, R(nm, p.t) * norm));
      cr.ctx.fillStyle = EM.rgbStr(c); cr.ctx.fillRect(pl.ix + pl.iw - 50, pl.iy + 6, 44, 30);
      cr.ctx.strokeStyle = EM.col('--ink'); cr.ctx.strokeRect(pl.ix + pl.iw - 50, pl.iy + 6, 44, 30);
      const mx = [];
      for (let nm = 401; nm < 700; nm++) if (R(nm, p.t) > R(nm - 1, p.t) && R(nm, p.t) >= R(nm + 1, p.t)) mx.push(nm);
      sim.set('col', '<span style="color:' + EM.rgbStr(c) + ';font-size:18px">■</span> ' + (p.t < 60 && p.sys === 'soap' ? 'negro (película muy delgada)' : ''));
      sim.set('max', mx.length ? mx.join(', ') + ' nm' : 'ninguna');
    });
  });

  /* ======================================================================
     21.5 Anillos de Newton
     ====================================================================== */
  EM.defineSim('newton-rings', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.slider('R', { label: 'Radio de curvatura de la lente <i>R</i>', min: 0.5, max: 10, step: 0.1, value: 3, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 589, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Índice del medio entre lente y vidrio', min: 1, max: 1.6, step: 0.01, value: 1, fmt: f2 });
    sim.check('white', { label: 'Luz blanca', value: false });
    sim.out('r', 'Radios de los anillos oscuros 1–5', { hl: true });
    const rmax = () => Math.sqrt((12 * 589e-9 * sim.p.R) / sim.p.n);
    const Iref = (r, nm) => { const t = (r * r) / (2 * sim.p.R); return Math.sin((2 * Math.PI * sim.p.n * t) / (nm * 1e-9)) ** 2; };
    sim.onDraw(() => {
      const p = sim.p, rm = rmax();
      EM.draw.clear(cv);
      const W = cv.w, H = cv.h, Rp = Math.min(W, H) / 2 - 4;
      const ctx = cv.ctx, img = ctx.createImageData(Math.round(2 * Rp), Math.round(2 * Rp));
      const N = img.width;
      const cache = new Map();
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i / N - 0.5) * 2, y = (j / N - 0.5) * 2, rr = Math.hypot(x, y);
        const k = 4 * (j * N + i);
        if (rr > 1) { img.data[k + 3] = 0; continue; }
        const key = Math.round(rr * 400);
        let c = cache.get(key);
        if (!c) { const r = (key / 400) * rm; if (p.white) c = whiteColor((nm) => Iref(r, nm)); else { const v = Iref(r, p.lam), q = EM.wavelengthRGB(p.lam); c = [q[0] * v, q[1] * v, q[2] * v]; } cache.set(key, c); }
        img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
      }
      const sx = Math.round(W / 2 - Rp), sy = Math.round(H / 2 - Rp);
      ctx.putImageData(img, sx, sy);
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: rm * 1000, ymin: 0, ymax: 1.1, xlabel: 'r (mm)', ylabel: 'intensidad reflejada', ml: 52 });
      pl.frame();
      pl.fn((rmm) => Iref(rmm / 1000, p.lam), { color: p.white ? '--ink' : EM.rgbStr(EM.wavelengthRGB(p.lam)), width: 2, n: 800 });
      const rs = [];
      for (let m = 1; m <= 5; m++) rs.push(EM.fix(1000 * Math.sqrt((m * p.lam * 1e-9 * p.R) / p.n), 2));
      sim.set('r', rs.join(', ') + ' mm');
    });
  });

  /* ======================================================================
     21.6 Interferómetro de Michelson
     ====================================================================== */
  EM.defineSim('michelson', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 });
    const cf = sim.canvas({ aspect: 1 });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('x', { label: 'Desplazamiento del espejo móvil', min: 0, max: 5, step: 0.001, value: 0, unit: 'µm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('d0', { label: 'Diferencia de brazos inicial', min: 0.02, max: 1, step: 0.01, value: 0.3, unit: 'mm', fmt: f2 });
    sim.button('Mover el espejo', () => { moving = !moving; });
    sim.out('N', 'Franjas que pasaron 2Δ<i>x</i>/<i>λ</i>', { hl: true });
    sim.out('c', 'Intensidad en el centro');
    let moving = false;
    sim.animate((dt) => { if (moving) { let v = sim.p.x + dt * 0.25; if (v > 5) { v = 0; } sim.ctl.x.set(v, true); } });
    sim.onDraw(() => {
      const p = sim.p, lam = p.lam * 1e-9, d = p.d0 * 1e-3 + p.x * 1e-6;
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      EM.draw.clear(cs);
      const cx = W * 0.45, cy = H * 0.55, col = EM.rgbStr(EM.wavelengthRGB(p.lam));
      /* esquema */
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(14, cy); ctx.lineTo(cx, cy); ctx.lineTo(W - 30 + p.x * 4, cy); ctx.moveTo(cx, cy); ctx.lineTo(cx, 26); ctx.moveTo(cx, cy); ctx.lineTo(cx, H - 20); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillStyle = EM.alpha('--c1', 0.5); ctx.fillRect(-26, -3, 52, 6); ctx.restore();
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(cx - 24, 18, 48, 7);
      ctx.fillStyle = EM.col('--accent'); ctx.fillRect(W - 30 + p.x * 4, cy - 24, 7, 48);
      ctx.fillStyle = EM.col('--ink'); ctx.fillRect(cx - 14, H - 18, 28, 10);
      EM.text(ctx, 'láser', 14, cy - 10, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'espejo móvil', W - 40, cy + 40, { size: 11, color: '--accent', align: 'center' });
      EM.text(ctx, 'espejo fijo', cx + 30, 26, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'pantalla', cx + 20, H - 10, { size: 11, color: '--ink-2' });
      /* franjas circulares: I ∝ cos²(2π d cos θ / λ) */
      EM.draw.clear(cf);
      const W2 = cf.w, H2 = cf.h, R = Math.min(W2, H2) / 2 - 4, img = cf.ctx.createImageData(Math.round(2 * R), Math.round(2 * R)), N = img.width;
      const thMax = 0.1, q = EM.wavelengthRGB(p.lam);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i / N - 0.5) * 2, y = (j / N - 0.5) * 2, rr = Math.hypot(x, y), k = 4 * (j * N + i);
        if (rr > 1) continue;
        const th = rr * thMax, v = Math.cos((2 * Math.PI * d * Math.cos(th)) / lam) ** 2;
        img.data[k] = q[0] * v; img.data[k + 1] = q[1] * v; img.data[k + 2] = q[2] * v; img.data[k + 3] = 255;
      }
      cf.ctx.putImageData(img, Math.round(W2 / 2 - R), Math.round(H2 / 2 - R));
      sim.set('N', EM.fix((2 * p.x * 1e-6) / lam, 2));
      sim.set('c', EM.fix(Math.cos((2 * Math.PI * d) / lam) ** 2, 3));
    });
  });
})();
