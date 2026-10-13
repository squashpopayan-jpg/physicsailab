/* Capítulo 16 — Inducción electromagnética */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V, CK = EM.ckt;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Registro temporal para gráficas desplazables */
  const trace = (arr, item, span) => { arr.push(item); while (arr.length && arr[0][0] < item[0] - span) arr.shift(); };

  /* ======================================================================
     16.1 Imán que atraviesa una bobina
     ====================================================================== */
  EM.defineSim('magnet-coil', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.4 });
    sim.group('Movimiento del imán');
    sim.seg('mode', { options: [['osc', 'Oscila solo'], ['drag', 'Arrastrar']], value: 'osc' });
    sim.slider('amp', { label: 'Amplitud', min: 2, max: 12, step: 0.5, value: 9, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('f', { label: 'Frecuencia', min: 0.1, max: 2, step: 0.05, value: 0.4, unit: 'Hz', fmt: f2 });
    sim.group('Imán y bobina');
    sim.slider('m', { label: 'Momento del imán <i>m</i>', min: 0.1, max: 3, step: 0.1, value: 1, unit: 'A·m²', fmt: (v) => EM.fix(v, 1) });
    sim.slider('N', { label: 'Espiras de la bobina', min: 10, max: 500, step: 10, value: 200, fmt: (v) => v.toFixed(0) });
    sim.check('flip', { label: 'Invertir el imán (norte hacia la izquierda)', value: false });
    sim.out('z', 'Posición del imán <i>z</i>');
    sim.out('v', 'Velocidad');
    sim.out('Phi', 'Flujo total <i>N</i>Φ');
    sim.out('emf', 'Fem inducida', { hl: true });
    sim.out('I', 'Corriente (bobina de 5 Ω)');
    sim.hint('Sentido positivo de la corriente: el que crea B hacia la derecha', cv);
    const a = 0.02, len = 0.03, R = 5;
    let t = 0, z = -0.09, zPrev = -0.09, vz = 0, hist = [], dragging = false;
    const flux1 = (zz, mm) => {
      /* N espiras repartidas en la longitud de la bobina */
      const n = 12;
      let s = 0;
      for (let i = 0; i < n; i++) { const zi = -len / 2 + (len * (i + 0.5)) / n; s += (K.mu0 * mm * a * a) / (2 * Math.pow(a * a + (zz - zi) ** 2, 1.5)); }
      return s / n;
    };
    const Phi = (zz) => sim.p.N * flux1(zz, sim.p.m * (sim.p.flip ? -1 : 1));
    const view = { X: (zz) => cv.w / 2 + zz * (cv.w / 0.32) };
    EM.pointer(cv, {
      down: (x) => (sim.p.mode === 'drag' && Math.abs(x - view.X(z)) < 40 ? 1 : null),
      move: (_, x) => { z = M.clamp((x - cv.w / 2) / (cv.w / 0.32), -0.15, 0.15); dragging = true; },
      up: () => { dragging = false; },
      hover: (x) => sim.p.mode === 'drag' && Math.abs(x - view.X(z)) < 40
    });
    sim.animate((dt) => {
      t += dt;
      if (sim.p.mode === 'osc') z = (-sim.p.amp / 100) * Math.cos(2 * Math.PI * sim.p.f * t);
      vz = dt > 0 ? (z - zPrev) / dt : 0;
      zPrev = z;
      const dPhi = (Phi(z + 1e-5) - Phi(z - 1e-5)) / 2e-5;
      trace(hist, [t, Phi(z), -dPhi * vz], 5);
    });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, cy = h * 0.5;
      /* bobina */
      const cx0 = view.X(-len / 2), cx1 = view.X(len / 2), rpx = (a / 0.32) * w * 1.05;
      const emf = hist.length ? hist[hist.length - 1][2] : 0;
      const nT = 10;
      for (let i = 0; i < nT; i++) {
        const x = cx0 + ((i + 0.5) * (cx1 - cx0)) / nT;
        ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, cy, 6, rpx, 0, 0, 2 * Math.PI); ctx.stroke();
      }
      /* sentido de la corriente inducida */
      if (Math.abs(emf) > 1e-6) {
        const s = Math.sign(emf);
        EM.draw.current(ctx, (cx0 + cx1) / 2, cy - rpx - 14, s, { r: 8 });
        EM.draw.current(ctx, (cx0 + cx1) / 2, cy + rpx + 14, -s, { r: 8 });
      }
      /* imán */
      const mx = view.X(z), mw = w * 0.14, mh = 26;
      const nRight = !p.flip;
      ctx.fillStyle = EM.col(nRight ? '--neg' : '--pos'); ctx.fillRect(mx - mw / 2, cy - mh / 2, mw / 2, mh);
      ctx.fillStyle = EM.col(nRight ? '--pos' : '--neg'); ctx.fillRect(mx, cy - mh / 2, mw / 2, mh);
      EM.text(ctx, nRight ? 'S' : 'N', mx - mw / 4, cy + 5, { size: 14, weight: 700, color: '#ffffff', align: 'center' });
      EM.text(ctx, nRight ? 'N' : 'S', mx + mw / 4, cy + 5, { size: 14, weight: 700, color: '#ffffff', align: 'center' });
      /* galvanómetro */
      const gx = w - 70, gy = h - 18, gr = 44;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      const gsc = Math.max(0.02, ...hist.map((r) => Math.abs(r[2]))); const defl = M.clamp(emf / gsc, -1, 1) * Math.PI * 0.35;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (gr - 4) * Math.sin(defl), gy - (gr - 4) * Math.cos(defl)); ctx.stroke();
      EM.text(ctx, 'fem', gx, gy - gr - 6, { size: 11, color: '--ink-3', align: 'center' });
      EM.text(ctx, 'z', w - 14, cy - 6, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-3' });
      ctx.strokeStyle = EM.col('--grid-2'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy); ctx.stroke(); ctx.setLineDash([]);
      /* gráficas */
      EM.draw.clear(cp);
      const t1 = hist.length ? hist[hist.length - 1][0] : 5;
      const Pm = Math.max(1e-6, Phi(0) * 1.1), Em = Math.max(0.01, ...hist.map((r) => Math.abs(r[2]))) * 1.15;
      const hh = cp.h / 2;
      const p1 = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: hh, xmin: t1 - 5, xmax: t1, ymin: -Pm, ymax: Pm, ylabel: 'NΦ (mWb)', mb: 22, mt: 10, yfmt: (v) => EM.fix(v * 1e3, 2) });
      p1.frame();
      if (hist.length > 1) p1.path(hist.map((r) => [r[0], r[1]]), { color: '--bline', width: 2 });
      const p2 = new EM.Plot(cp.ctx, { x: 0, y: hh, w: cp.w, h: hh, xmin: t1 - 5, xmax: t1, ymin: -Em * 1e3, ymax: Em * 1e3, xlabel: 't (s)', ylabel: 'ℰ (mV)', mt: 8 });
      p2.frame();
      if (hist.length > 1) p2.path(hist.map((r) => [r[0], r[2] * 1e3]), { color: '--accent', width: 2 });
      sim.set('z', EM.fix(z * 100, 2) + ' cm');
      sim.set('v', EM.fix(vz * 100, 1) + ' cm/s');
      sim.set('Phi', EM.si(Phi(z), 'Wb'));
      sim.set('emf', EM.si(emf, 'V'));
      sim.set('I', EM.si(emf / R, 'A'));
    });
  });

  /* ======================================================================
     16.2 Barra deslizante
     ====================================================================== */
  EM.defineSim('sliding-bar', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.4 });
    sim.group('Circuito');
    sim.slider('B', { label: 'Campo <i>B</i> (entrante)', min: 0.1, max: 2, step: 0.05, value: 0.8, unit: 'T', fmt: f2 });
    sim.slider('l', { label: 'Separación de los rieles <i>l</i>', min: 0.1, max: 1, step: 0.05, value: 0.5, unit: 'm', fmt: f2 });
    sim.slider('R', { label: 'Resistencia <i>R</i>', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.group('Barra');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 2, step: 0.05, value: 0.2, unit: 'kg', fmt: f2 });
    sim.slider('F', { label: 'Fuerza aplicada <i>F</i>', min: 0, max: 2, step: 0.05, value: 0.5, unit: 'N', fmt: f2 });
    sim.button('Reiniciar en reposo', () => { x = 0.3; v = 0; t = 0; hist = []; });
    sim.button('Lanzar con 5 m/s', () => { x = 0.3; v = 5; t = 0; hist = []; });
    sim.out('v', 'Velocidad <i>v</i>', { hl: true });
    sim.out('vt', 'Velocidad terminal <i>FR</i>/<i>B</i>²<i>l</i>²');
    sim.out('emf', 'Fem <i>Blv</i>');
    sim.out('I', 'Corriente');
    sim.out('Fm', 'Fuerza magnética');
    sim.out('Pm', 'Potencia aplicada <i>Fv</i>');
    sim.out('Pe', 'Potencia disipada <i>I</i>²<i>R</i>');
    let x = 0.3, v = 0, t = 0, hist = [], ph = 0;
    const L = 4;
    sim.animate((dt) => {
      const p = sim.p, k = (p.B * p.B * p.l * p.l) / p.R;
      const n = 10, h = dt / n;
      for (let i = 0; i < n; i++) { const a = (p.F - k * v) / p.m; v += a * h; x += v * h; t += h; }
      if (x > L - 0.1) x = 0.3;
      ph += dt * 120 * Math.min(1, Math.abs(v) / 4);
      trace(hist, [t, v, p.F * v, k * v * v], 10);
    });
    sim.onDraw(() => {
      const p = sim.p, k = (p.B * p.B * p.l * p.l) / p.R;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x0 = w * 0.08, x1 = w * 0.96, yT = h * 0.2, yB = h * 0.8;
      const X = (xx) => x0 + (xx / L) * (x1 - x0);
      /* campo entrante */
      for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) { const xx = X(0.2 + (i * (L - 0.2)) / 14 + 0.1), yy = yT + ((j + 0.5) * (yB - yT)) / 4; ctx.strokeStyle = EM.alpha('--bfield', 0.45); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xx - 4, yy - 4); ctx.lineTo(xx + 4, yy + 4); ctx.moveTo(xx + 4, yy - 4); ctx.lineTo(xx - 4, yy + 4); ctx.stroke(); }
      EM.text(ctx, 'B ⊗', x1 - 4, yT - 8, { size: 12, color: '--bfield', align: 'right' });
      CK.wire(ctx, [[X(0), yT], [x1, yT]], { width: 3, color: '--ink-2' });
      CK.wire(ctx, [[X(0), yB], [x1, yB]], { width: 3, color: '--ink-2' });
      CK.resistor(ctx, X(0), yB, X(0), yT, { label: 'R', labelSide: -1, labelOff: 14 });
      const bx = X(x);
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(bx, yT - 8); ctx.lineTo(bx, yB + 8); ctx.stroke();
      const I = (p.B * p.l * v) / p.R;
      if (Math.abs(I) > 1e-4) CK.flow(ctx, I > 0 ? [[bx, yB], [bx, yT], [X(0), yT], [X(0), yB], [bx, yB]] : [[bx, yB], [X(0), yB], [X(0), yT], [bx, yT], [bx, yB]], ph, { spacing: 26 });
      if (p.F > 0) { EM.draw.arrow(ctx, bx + 12, (yT + yB) / 2 - 12, bx + 12 + 30 + p.F * 30, (yT + yB) / 2 - 12, { color: '--c3', width: 3, head: 11 }); EM.text(ctx, 'F', bx + 50 + p.F * 30, (yT + yB) / 2 - 18, { size: 13, weight: 700, color: '--c3' }); }
      const Fm = k * v;
      if (Math.abs(Fm) > 1e-3) { EM.draw.arrow(ctx, bx - 12, (yT + yB) / 2 + 14, bx - 12 - Math.min(90, 30 + Fm * 30), (yT + yB) / 2 + 14, { color: '--c2', width: 3, head: 11 }); EM.text(ctx, 'F_{B}', bx - 60, (yT + yB) / 2 + 34, { size: 12, weight: 700, color: '--c2', align: 'center' }); }
      EM.text(ctx, 'l', bx + 10, yT + 14, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      /* gráfica */
      EM.draw.clear(cp);
      const t1 = hist.length ? hist[hist.length - 1][0] : 10;
      const vt = (p.F * p.R) / (p.B * p.B * p.l * p.l);
      const vmax = Math.max(1, vt * 1.2, ...hist.map((r) => r[1] * 1.1));
      const hh = cp.h / 2;
      const p1 = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: hh, xmin: Math.max(0, t1 - 10), xmax: Math.max(10, t1), ymin: 0, ymax: vmax, ylabel: 'v (m/s)', mb: 22, mt: 10 });
      p1.frame();
      if (vt > 0) p1.hline(vt, { color: '--ink-3', label: 'v terminal', labelRight: true });
      if (hist.length > 1) p1.path(hist.map((r) => [r[0], r[1]]), { color: '--c1', width: 2.2 });
      const Pmax = Math.max(0.1, ...hist.map((r) => Math.max(r[2], r[3]))) * 1.15;
      const p2 = new EM.Plot(cp.ctx, { x: 0, y: hh, w: cp.w, h: hh, xmin: Math.max(0, t1 - 10), xmax: Math.max(10, t1), ymin: 0, ymax: Pmax, xlabel: 't (s)', ylabel: 'P (W)', mt: 8 });
      p2.frame();
      if (hist.length > 1) { p2.path(hist.map((r) => [r[0], r[2]]), { color: '--c3', width: 2 }); p2.path(hist.map((r) => [r[0], r[3]]), { color: '--c2', width: 2, dash: [6, 3] }); }
      p2.legend([{ label: 'Fv (mecánica)', color: '--c3' }, { label: 'I²R (eléctrica)', color: '--c2', dash: [6, 3] }], 'br');
      sim.set('v', f3(v) + ' m/s');
      sim.set('vt', vt > 0 ? f3(vt) + ' m/s' : '0 (sin fuerza)');
      sim.set('emf', EM.si(p.B * p.l * v, 'V'));
      sim.set('I', EM.si(I, 'A'));
      sim.set('Fm', EM.si(Fm, 'N'));
      sim.set('Pm', EM.si(p.F * v, 'W'));
      sim.set('Pe', EM.si(I * I * p.R, 'W'));
    });
  });

  /* ======================================================================
     16.3 Generador de CA / CC
     ====================================================================== */
  EM.defineSim('ac-generator', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const v3 = new EM.View3D(sim, c3, { radius: 1.3, az: rad(-55), el: rad(22) });
    sim.group('Generador');
    sim.seg('type', { options: [['ac', 'Anillos (CA)'], ['dc', 'Conmutador (CC)']], value: 'ac' });
    sim.slider('N', { label: 'Espiras <i>N</i>', min: 1, max: 500, step: 1, value: 100, fmt: (v) => v.toFixed(0) });
    sim.slider('B', { label: 'Campo <i>B</i>', min: 0.05, max: 1, step: 0.01, value: 0.25, unit: 'T', fmt: f2 });
    sim.slider('A', { label: 'Área de la bobina', min: 10, max: 400, step: 10, value: 200, unit: 'cm²', fmt: (v) => v.toFixed(0) });
    sim.slider('f', { label: 'Frecuencia de giro', min: 1, max: 60, step: 1, value: 60, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.note('La animación se muestra ralentizada (media vuelta por segundo) y las gráficas usan el tiempo real.');
    sim.out('Em', 'Fem máxima <i>NBAω</i>', { hl: true });
    sim.out('Erms', 'Fem eficaz');
    sim.out('e', 'Fem instantánea');
    sim.out('ph', 'Ángulo de la bobina');
    let th = 0;
    sim.animate((dt) => { th += dt * Math.PI; });
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f, A = p.A * 1e-4;
      const Em = p.N * p.B * A * w;
      const emf = (a) => { const e = Em * Math.sin(a); return p.type === 'dc' ? Math.abs(e) : e; };
      v3.begin();
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) v3.arrow([-1.1, i * 0.45, j * 0.45], [1.1, i * 0.45, j * 0.45], { color: '--bfield', width: 1, alpha: 0.45, head: 8, seg: 6 });
      v3.text([1.2, 0.45, 0.45], 'B', { size: 14, weight: 700, family: EM.FONT_MATH, color: '--bfield' });
      const mh = [Math.cos(th), Math.sin(th), 0], wv = [-Math.sin(th), Math.cos(th), 0], z = [0, 0, 1];
      const P = (sw, sz) => V.comb(sw * 0.32, wv, sz * 0.45, z);
      const cs = [P(1, -1), P(1, 1), P(-1, 1), P(-1, -1)];
      v3.poly(cs, { fill: '--c4', alpha: 0.12, stroke: '--c4', strokeAlpha: 0.95, strokeWidth: 2.5 });
      v3.line([0, 0, -0.9], [0, 0, 0.65], { color: '--ink-3', width: 1.2, dash: [4, 3], seg: 5 });
      v3.arrow([0, 0, 0], V.scale(mh, 0.55), { color: '--gold', width: 2.5, head: 10 });
      v3.text(V.scale(mh, 0.68), 'n̂', { size: 13, weight: 700, color: '--gold' });
      /* anillos */
      const ring = (zz, col) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push([0.1 * Math.cos((2 * Math.PI * i) / 40), 0.1 * Math.sin((2 * Math.PI * i) / 40), zz]); v3.polyline(pts, { color: col, width: 3 }); };
      if (p.type === 'ac') { ring(-0.62, '--c4'); ring(-0.74, '--c4'); }
      else { const pts = []; for (let i = 0; i <= 20; i++) pts.push([0.1 * Math.cos(th + (Math.PI * i) / 20 + 0.1), 0.1 * Math.sin(th + (Math.PI * i) / 20 + 0.1), -0.66]); v3.polyline(pts, { color: '--c4', width: 3 }); const q = []; for (let i = 0; i <= 20; i++) q.push([0.1 * Math.cos(th + Math.PI + (Math.PI * i) / 20 + 0.1), 0.1 * Math.sin(th + Math.PI + (Math.PI * i) / 20 + 0.1), -0.66]); v3.polyline(q, { color: '--c6', width: 3 }); }
      v3.render();
      EM.draw.clear(cp);
      const hh = cp.h / 2;
      const T = 1 / p.f;
      const tNow = (th / (2 * Math.PI)) * T;
      const p1 = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: hh, xmin: 0, xmax: 2 * T, ymin: -1.2, ymax: 1.2, ylabel: 'Φ / NBA', mb: 22, mt: 10, xfmt: (v) => EM.si(v, 's', 2) });
      p1.frame();
      p1.fn((tt) => Math.cos(2 * Math.PI * p.f * tt), { color: '--bline', width: 2 });
      p1.vline(tNow % (2 * T), { color: '--accent' });
      const p2 = new EM.Plot(cp.ctx, { x: 0, y: hh, w: cp.w, h: hh, xmin: 0, xmax: 2 * T, ymin: -Em * 1.2, ymax: Em * 1.2, xlabel: 't', ylabel: 'ℰ (V)', mt: 8, xfmt: (v) => EM.si(v, 's', 2) });
      p2.frame();
      p2.fn((tt) => emf(2 * Math.PI * p.f * tt), { color: '--accent', width: 2.2 });
      p2.vline(tNow % (2 * T), { color: '--accent' });
      sim.set('Em', EM.si(Em, 'V'));
      sim.set('Erms', p.type === 'ac' ? EM.si(Em / Math.SQRT2, 'V') : EM.si((2 * Em) / Math.PI, 'V') + ' (valor medio)');
      sim.set('e', EM.si(emf(th), 'V'));
      sim.set('ph', EM.fix(deg(M.wrap2pi(th)), 0) + '°');
    });
  });

  /* ======================================================================
     16.4 Campo eléctrico inducido
     ====================================================================== */
  EM.defineSim('induced-efield', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Solenoide (radio 3 cm)');
    sim.slider('dB', { label: 'Ritmo de cambio d<i>B</i>/d<i>t</i>', min: -2, max: 2, step: 0.05, value: 0.8, unit: 'T/s', fmt: f2 });
    sim.slider('r', { label: 'Radio de la espira de prueba', min: 0.5, max: 8, step: 0.1, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.out('E', '<i>E</i> en la espira de prueba', { hl: true });
    sim.out('circ', '∮ <b>E</b>·d<b>l</b> (antihorario)');
    sim.out('dphi', '−dΦ/d<i>t</i>');
    const R = 0.03;
    let B = 0.2, t = 0;
    sim.animate((dt) => { t += dt; B += sim.p.dB * dt; if (B > 1.2 || B < -1.2) B = 0; });
    const Er = (r) => (r < R ? (r / 2) * Math.abs(sim.p.dB) : ((R * R) / (2 * r)) * Math.abs(sim.p.dB));
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, cx = w / 2, cy = h / 2, S = (Math.min(w, h) * 0.45) / 0.09;
      /* solenoide y B */
      ctx.beginPath(); ctx.arc(cx, cy, R * S, 0, 7); ctx.fillStyle = EM.alpha('--bfield', 0.06 + 0.12 * Math.min(1, Math.abs(B))); ctx.fill();
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 3; ctx.stroke();
      const nb = Math.round(Math.abs(B) * 14);
      for (let i = 0; i < nb; i++) { const a = i * 2.4, rr = R * S * 0.85 * Math.sqrt((i + 0.5) / nb); EM.draw.current(ctx, cx + rr * Math.cos(a), cy + rr * Math.sin(a), B > 0 ? 1 : -1, { r: 4 }); }
      EM.text(ctx, 'B = ' + EM.fix(B, 2) + ' T', cx, cy - R * S - 12, { size: 12, mono: true, color: '--bfield', align: 'center', halo: true });
      /* E: circunferencias con flechas */
      const sgn = -Math.sign(p.dB); /* E_φ = −(r/2) dB/dt: positivo = antihorario */
      for (const rc of [0.012, 0.024, 0.036, 0.05, 0.065, 0.08]) {
        const Epx = Er(rc);
        ctx.strokeStyle = EM.alpha('--efield', 0.35 + 0.6 * Math.min(1, Epx / (R / 2 * Math.max(0.2, Math.abs(p.dB)))));
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, rc * S, 0, 7); ctx.stroke();
        if (p.dB !== 0) for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 + rc * 40 + t * 0.5 * sgn;
          const x = cx + rc * S * Math.cos(a), y = cy - rc * S * Math.sin(a);
          const tx = -Math.sin(a) * sgn, ty = -Math.cos(a) * sgn;
          EM.draw.arrow(ctx, x - tx * 6, y - ty * 6, x + tx * 6, y + ty * 6, { color: '--efield', width: 1.8, head: 7 });
        }
      }
      /* espira de prueba */
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, (p.r / 100) * S, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      /* gráfica E(r) */
      EM.draw.clear(cp);
      const Emax = Math.max(1e-4, (R / 2) * Math.abs(p.dB)) * 1.3;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 9, ymin: 0, ymax: Emax * 1000, xlabel: 'r (cm)', ylabel: 'E (mV/m)', title: 'Campo inducido E(r)' });
      pl.frame();
      pl.vline(3, { color: '--ink-3', label: 'R' });
      pl.fn((rr) => Er(rr / 100) * 1000, { color: '--efield', width: 2.4, from: 0 });
      pl.dot(p.r, Er(p.r / 100) * 1000, { color: '--accent', r: 5.5 });
      const r = p.r / 100, Ev = Er(r);
      const circ = -p.dB * Math.PI * Math.min(r, R) ** 2;
      sim.set('E', EM.si(Ev, 'V/m'));
      sim.set('circ', EM.si(circ, 'V'));
      sim.set('dphi', EM.si(-p.dB * Math.PI * Math.min(r, R) ** 2, 'V'));
    });
  });

  /* ======================================================================
     16.5 Freno por corrientes de Foucault
     ====================================================================== */
  EM.defineSim('eddy-brake', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    sim.group('Placa');
    sim.seg('plate', { options: [['solid', 'Maciza'], ['slot', 'Ranurada']], value: 'solid', onInput: () => release() });
    sim.slider('B', { label: 'Campo del imán <i>B</i>', min: 0, max: 1, step: 0.02, value: 0.5, unit: 'T', fmt: f2 });
    sim.slider('th0', { label: 'Ángulo inicial', min: 10, max: 60, step: 1, value: 40, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.button('Soltar', () => release(), { primary: true });
    sim.out('th', 'Ángulo');
    sim.out('Ek', 'Energía mecánica restante', { hl: true });
    let th, om, t, hist, E0;
    const g = 9.81, L = 0.5;
    const release = () => { th = rad(sim.p.th0); om = 0; t = 0; hist = []; E0 = g * L * (1 - Math.cos(th)); };
    release();
    const gamma = () => (sim.p.plate === 'solid' ? 1 : 0.06) * 60 * sim.p.B * sim.p.B;
    const inField = (a) => Math.abs(a) < rad(12);
    sim.animate((dt) => {
      const n = 20, h = dt / n;
      for (let i = 0; i < n; i++) { const a = -(g / L) * Math.sin(th) - (inField(th) ? gamma() * om : 0); om += a * h; th += om * h; t += h; }
      trace(hist, [t, deg(th)], 12);
    });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, px = w / 2, py = h * 0.08, Lp = h * 0.7;
      /* imán */
      const my = py + Lp, mw = w * 0.34;
      ctx.fillStyle = EM.alpha('--pos', 0.8); ctx.fillRect(px - mw / 2, my - 44, mw, 14);
      ctx.fillStyle = EM.alpha('--neg', 0.8); ctx.fillRect(px - mw / 2, my + 30, mw, 14);
      EM.text(ctx, 'N', px - mw / 2 - 12, my - 32, { size: 12, weight: 700, color: '--pos' });
      EM.text(ctx, 'S', px - mw / 2 - 12, my + 42, { size: 12, weight: 700, color: '--neg' });
      ctx.fillStyle = EM.alpha('--bfield', 0.08 + 0.2 * p.B); ctx.fillRect(px - mw / 2, my - 30, mw, 60);
      /* péndulo */
      const bx = px + Lp * Math.sin(th), by = py + Lp * Math.cos(th);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-th);
      ctx.fillStyle = EM.alpha('--c4', 0.8); ctx.fillRect(-36, -26, 72, 52);
      if (p.plate === 'slot') { ctx.fillStyle = EM.col('--canvas'); for (let k = -2; k <= 2; k++) ctx.fillRect(k * 13 - 2.5, -26, 5, 38); }
      if (inField(th) && Math.abs(om) > 0.05 && p.B > 0 && p.plate === 'solid') { ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.8; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 14, 0, 11, 16, 0, 0, 2 * Math.PI); ctx.stroke(); } }
      ctx.restore();
      ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fillStyle = EM.col('--ink'); ctx.fill();
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: Math.max(0, t - 12), xmax: Math.max(12, t), ymin: -65, ymax: 65, xlabel: 't (s)', ylabel: 'θ (°)', title: 'Oscilación del péndulo' });
      pl.frame();
      pl.hline(12, { color: '--bfield', dash: [3, 3], label: 'zona con campo', labelRight: true });
      pl.hline(-12, { color: '--bfield', dash: [3, 3] });
      if (hist.length > 1) pl.path(hist, { color: '--c1', width: 2 });
      const E = g * L * (1 - Math.cos(th)) + 0.5 * L * L * om * om;
      sim.set('th', EM.fix(deg(th), 1) + '°');
      sim.set('Ek', EM.fix((100 * E) / E0, 1) + ' %');
    });
  });
})();
