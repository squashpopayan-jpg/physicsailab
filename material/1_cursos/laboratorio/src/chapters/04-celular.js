/* Capítulo 4 · Los sensores del celular */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, V3 = MC.V3;
  const G = MC.K.gPop;
  const DEC = M.rad(MC.K.decPop);
  /* Campo terrestre en Popayán en coordenadas del mundo (x este, y norte, z arriba), µT */
  const BW = [26.7 * Math.sin(DEC), 26.7 * Math.cos(DEC), -11.7];
  MC.B_EARTH = BW;

  /* ---------- Celular en 3D (proyección ortográfica) ----------
     R: matriz cuerpo→mundo. view: {cx, cy, s, az, el}. Devuelve centro proyectado. */
  MC.phone3d = function (ctx, R, view, o = {}) {
    const W = 0.075, H = 0.155, T = 0.009;
    const Vm = V3.mm(V3.rx(view.el), V3.rz(-view.az));
    const P = (p) => { const w = V3.mul(R, p); const q = V3.mul(Vm, w); return [view.cx + q[0] * view.s, view.cy - q[2] * view.s, q[1]]; };
    const corners = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push([sx * W / 2, sy * H / 2, sz * T / 2]);
    const faces = [
      { n: [0, 0, 1], idx: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], col: '--screen', screen: true },
      { n: [0, 0, -1], idx: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]], col: '--phone' },
      { n: [1, 0, 0], idx: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], col: '--phone' },
      { n: [-1, 0, 0], idx: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], col: '--phone' },
      { n: [0, 1, 0], idx: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], col: '--phone' },
      { n: [0, -1, 0], idx: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], col: '--phone' }
    ];
    const vis = [];
    for (const f of faces) {
      const nw = V3.mul(Vm, V3.mul(R, f.n));
      if (nw[1] >= -1e-9) continue; /* el observador mira hacia +y' */
      const pts = f.idx.map((c) => P([c[0] * W / 2, c[1] * H / 2, c[2] * T / 2]));
      const depth = pts.reduce((s, p) => s + p[2], 0) / 4;
      vis.push({ f, pts, depth, light: -nw[1] * 0.6 + nw[2] * 0.4 });
    }
    vis.sort((a, b) => b.depth - a.depth);
    for (const v of vis) {
      ctx.beginPath();
      v.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      const base = MC.col(v.f.col);
      ctx.fillStyle = MC.shade(base, 0.75 + 0.45 * M.clamp(v.light, 0, 1));
      ctx.fill();
      ctx.strokeStyle = MC.alpha('--ink', 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (v.f.screen) {
        /* marco y cámara para distinguir arriba */
        const cam = P([0, H / 2 - 0.008, T / 2]);
        ctx.beginPath(); ctx.arc(cam[0], cam[1], 2.4, 0, 7); ctx.fillStyle = '#5a6675'; ctx.fill();
        const a = P([-W / 2 + 0.006, -H / 2 + 0.014, T / 2]), b = P([W / 2 - 0.006, -H / 2 + 0.014, T / 2]), c = P([W / 2 - 0.006, H / 2 - 0.016, T / 2]), d = P([-W / 2 + 0.006, H / 2 - 0.016, T / 2]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
        ctx.fillStyle = MC.alpha('--az', 0.22); ctx.fill();
      }
    }
    if (o.axes !== false) {
      const c0 = P([0, 0, 0]);
      const Lx = o.axLen || 0.07;
      for (const [v, col, lab] of [[[Lx + W / 2 * 0.2, 0, 0], '--ax', 'x'], [[0, Lx + H / 2 * 0.45, 0], '--ay', 'y'], [[0, 0, Lx], '--az', 'z']]) {
        const e = P(v);
        D.arrow(ctx, c0[0], c0[1], e[0], e[1], { color: col, width: 2.4, halo: true });
        MC.text(ctx, lab, e[0] + 5, e[1] - 5, { size: 14, math: true, color: col, halo: true, weight: 600 });
      }
    }
    return P([0, 0, 0]);
  };
  MC.worldArrow = function (ctx, view, from, vec, col, lab, k) {
    const Vm = V3.mm(V3.rx(view.el), V3.rz(-view.az));
    const P = (p) => { const q = V3.mul(Vm, p); return [view.cx + q[0] * view.s, view.cy - q[2] * view.s]; };
    const a = P(from), b = P(V3.add(from, V3.sc(vec, k)));
    D.arrow(ctx, a[0], a[1], b[0], b[1], { color: col, width: 2, dash: [5, 3], halo: true });
    if (lab) MC.text(ctx, lab, b[0] + 6, b[1] + 4, { size: 13, math: true, color: col, halo: true });
  };
  const eulerR = (az, pitch, roll) => V3.mm(V3.mm(V3.rz(az), V3.rx(pitch)), V3.ry(roll));

  /* Barras de lectura x,y,z */
  function bars3(ctx, x, y, w, h, title, vals, max, unit, dec) {
    D.panel(ctx, x, y, w, h, { title });
    const cols = ['--ax', '--ay', '--az'], labs = ['x', 'y', 'z'];
    const x0 = x + 26, x1 = x + w - 70, xm = (x0 + x1) / 2;
    ctx.save();
    ctx.strokeStyle = MC.col('--rule-strong');
    ctx.beginPath(); ctx.moveTo(xm + 0.5, y + 24); ctx.lineTo(xm + 0.5, y + h - 6); ctx.stroke();
    ctx.restore();
    const rowH = (h - 30) / 3;
    vals.forEach((v, i) => {
      const yy = y + 26 + i * rowH;
      const f = M.clamp(v / max, -1, 1);
      ctx.fillStyle = MC.col(cols[i]);
      ctx.fillRect(Math.min(xm, xm + f * (x1 - x0) / 2), yy + rowH * 0.2, Math.abs(f) * (x1 - x0) / 2, rowH * 0.55);
      MC.text(ctx, labs[i], x + 10, yy + rowH * 0.5, { size: 13, math: true, color: cols[i], baseline: 'middle', weight: 600 });
      MC.text(ctx, MC.fix(v, dec), x + w - 8, yy + rowH * 0.5, { size: 12, mono: true, align: 'right', baseline: 'middle', color: '--ink' });
    });
    MC.text(ctx, unit, x + w - 8, y + 15, { size: 10.5, mono: true, align: 'right', color: '--ink-3' });
  }

  /* ---------- Orientación del celular y lecturas ---------- */
  MC.defineSim('ejes-celular', function (sim) {
    sim.cols2('1.25fr 1fr');
    const cv = sim.canvas({ aspect: 1.05, label: 'Celular en 3D' });
    const cb = sim.canvas({ aspect: 0.85, label: 'Lecturas de los sensores' });
    const view = { az: M.rad(-35), el: M.rad(28), s: 1, cx: 0, cy: 0 };
    let live = null, spinA = 0, gyr = [0, 0, 0];
    sim.presets([
      { id: 'plano', label: 'Plano, boca arriba', v: { az: 0, pitch: 0, roll: 0 } },
      { id: 'bocaabajo', label: 'Plano, boca abajo', v: { az: 0, pitch: 0, roll: 180 } },
      { id: 'retrato', label: 'Vertical (retrato)', v: { az: 0, pitch: 90, roll: 0 } },
      { id: 'paisaje', label: 'Vertical (paisaje)', v: { az: 0, pitch: 90, roll: -90 } },
      { id: 'incl', label: 'Inclinado 30° (inclinómetro)', v: { az: 0, pitch: 30, roll: 0 } }
    ], { initial: 'plano' });
    sim.group('Orientación (grados)');
    sim.slider('az', { label: 'Giro alrededor de la vertical (rumbo)', min: -180, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => String(Math.round(v)) });
    sim.slider('pitch', { label: 'Inclinación alrededor de <i>x</i>', min: -180, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => String(Math.round(v)) });
    sim.slider('roll', { label: 'Inclinación alrededor de <i>y</i>', min: -180, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => String(Math.round(v)) });
    sim.group('Movimiento');
    sim.select('spin', { label: 'Hacerlo girar continuamente', options: [['no', 'No'], ['x', 'Alrededor de x'], ['y', 'Alrededor de y'], ['z', 'Alrededor de z']], value: 'no', onInput: (v) => { if (v !== 'no') sim.play(); } });
    sim.check('vecs', { label: 'Mostrar g y B en el espacio', value: true });
    const liveBtn = sim.button('Usar mis sensores', () => startLive(), { title: 'Sólo funciona al abrir la página en el navegador de un celular' });
    const liveNote = sim.note('');
    sim.out('fmag', '|f| del acelerómetro');
    sim.out('bmag', '|B| del magnetómetro');
    sim.out('incl', 'Ángulo con la vertical');
    sim.animate((dt) => {
      if (sim.p.spin === 'no') { gyr = [0, 0, 0]; sim.pause(); return; }
      const w = 1.2;
      spinA += w * dt;
      gyr = sim.p.spin === 'x' ? [w, 0, 0] : sim.p.spin === 'y' ? [0, w, 0] : [0, 0, w];
    }, { button: false, autoplay: false });
    function startLive() {
      const go = () => {
        let got = false;
        window.addEventListener('devicemotion', (e) => {
          const a = e.accelerationIncludingGravity, r = e.rotationRate;
          if (!a || a.x === null) return;
          got = true;
          live = live || {};
          live.f = [a.x, a.y, a.z];
          live.w = r && r.alpha !== null ? [M.rad(r.beta || 0), M.rad(r.gamma || 0), M.rad(r.alpha || 0)] : [0, 0, 0];
          sim.redraw();
        });
        window.addEventListener('deviceorientation', (e) => { if (e.beta === null) return; live = live || {}; live.o = [e.alpha || 0, e.beta, e.gamma]; sim.redraw(); });
        setTimeout(() => { liveNote.innerHTML = got ? 'Recibiendo datos de los sensores de este dispositivo.' : 'Este dispositivo o este navegador no entrega datos de movimiento (en un computador es lo normal; en el visor de la plataforma pueden estar bloqueados). Abra la copia local del curso en Chrome de su celular.'; }, 2500);
      };
      try {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().then((s) => { if (s === 'granted') go(); else liveNote.innerHTML = 'Permiso denegado.'; }).catch(() => { liveNote.innerHTML = 'No se pudo pedir el permiso.'; });
        else if (typeof DeviceMotionEvent !== 'undefined') go();
        else liveNote.innerHTML = 'Este navegador no tiene sensores de movimiento.';
      } catch (e) { liveNote.innerHTML = 'Sensores no disponibles.'; }
      liveBtn.disabled = true;
    }
    sim.onDraw(() => {
      let R;
      if (live && live.o) R = eulerR(M.rad(live.o[0]), M.rad(live.o[1]), M.rad(live.o[2]));
      else {
        R = eulerR(M.rad(sim.p.az), M.rad(sim.p.pitch), M.rad(sim.p.roll));
        if (sim.p.spin !== 'no') R = V3.mm(R, sim.p.spin === 'x' ? V3.rx(spinA) : sim.p.spin === 'y' ? V3.ry(spinA) : V3.rz(spinA));
      }
      const Rt = V3.T(R);
      let f = V3.mul(Rt, [0, 0, G]);
      let B = V3.mul(Rt, BW);
      let w = gyr;
      if (live && live.f) { f = live.f; w = live.w; }
      const ctx = cv.ctx;
      D.clear(cv);
      view.s = Math.min(cv.w, cv.h) * 3.3;
      view.cx = cv.w / 2; view.cy = cv.h * 0.5;
      /* plano del piso y rosa de los vientos */
      const Vm = V3.mm(V3.rx(view.el), V3.rz(-view.az));
      const Pw = (p) => { const q = V3.mul(Vm, p); return [view.cx + q[0] * view.s, view.cy - q[2] * view.s]; };
      ctx.save();
      ctx.strokeStyle = MC.col('--grid-2');
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const a = Pw([i * 0.03, -0.1, -0.09]), b = Pw([i * 0.03, 0.1, -0.09]), c = Pw([-0.1, i * 0.03, -0.09]), d = Pw([0.1, i * 0.03, -0.09]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
      }
      ctx.restore();
      const nN = Pw([0, 0.115, -0.09]), nE = Pw([0.115, 0, -0.09]);
      MC.text(ctx, 'N', nN[0], nN[1], { size: 12, weight: 700, color: '--ink-3', align: 'center', baseline: 'middle' });
      MC.text(ctx, 'E', nE[0], nE[1], { size: 12, weight: 700, color: '--ink-3', align: 'center', baseline: 'middle' });
      if (sim.p.vecs) {
        MC.worldArrow(ctx, view, [-0.085, -0.06, 0.05], [0, 0, -1], '--weight', 'g', 0.07);
        MC.worldArrow(ctx, view, [0.07, -0.1, -0.02], V3.unit(BW), '--Bfield', 'B', 0.08);
      }
      MC.phone3d(ctx, R, view, { axLen: 0.06 });
      /* barras */
      const c2 = cb.ctx;
      D.clear(cb);
      const bh = (cb.h - 24) / 3;
      bars3(c2, 8, 6, cb.w - 16, bh, 'ACELERÓMETRO (CON g)', f, 12, 'm/s²', 2);
      bars3(c2, 8, 12 + bh, cb.w - 16, bh, 'MAGNETÓMETRO', B, 35, 'µT', 1);
      bars3(c2, 8, 18 + 2 * bh, cb.w - 16, bh, 'GIROSCOPIO', w, 2, 'rad/s', 2);
      sim.set('fmag', MC.fix(V3.norm(f), 3) + ' m/s²');
      sim.set('bmag', MC.fix(V3.norm(B), 1) + ' µT');
      sim.set('incl', MC.fix(M.deg(Math.acos(M.clamp(f[2] / Math.max(V3.norm(f), 1e-9), -1, 1))), 1) + '°');
    });
  });

  /* ---------- Acelerómetro MEMS por dentro ---------- */
  MC.defineSim('mems-acel', function (sim) {
    const cv = sim.canvas({ aspect: 1.75, label: 'Masa de prueba entre resortes' });
    let disp = [0, 0];
    sim.presets([
      { id: 'reposo', label: 'Quieto sobre la mesa', v: { mode: 'reposo', tilt: 0 } },
      { id: 'incl', label: 'Inclinado 30°', v: { mode: 'reposo', tilt: 30 } },
      { id: 'carro', label: 'En un carrito que acelera', v: { mode: 'carro', ax: 3 } },
      { id: 'caida', label: 'En caída libre', v: { mode: 'caida' } },
      { id: 'ascensor', label: 'Ascensor arrancando hacia arriba', v: { mode: 'ascensor', ay: 1.2 } }
    ], { initial: 'reposo' });
    sim.group('Situación');
    sim.select('mode', { options: [['reposo', 'Quieto (puede inclinarse)'], ['carro', 'Carrito horizontal'], ['ascensor', 'Ascensor'], ['caida', 'Caída libre']], value: 'reposo' });
    sim.slider('tilt', { label: 'Inclinación del chip', min: -90, max: 90, step: 1, value: 0, unit: '°', fmt: (v) => String(Math.round(v)) });
    sim.slider('ax', { label: 'Aceleración del carrito', min: -6, max: 6, step: 0.1, value: 3, unit: 'm/s²', fmt: (v) => MC.fix(v, 1) });
    sim.slider('ay', { label: 'Aceleración del ascensor (hacia arriba)', min: -3, max: 3, step: 0.1, value: 1.2, unit: 'm/s²', fmt: (v) => MC.fix(v, 1) });
    sim.out('a', 'Aceleración real <b>a</b>');
    sim.out('f', 'Lectura <b>f</b> = <b>a</b> − <b>g</b> (ejes del chip)', { hl: true });
    sim.out('fm', '|f|');
    const sync = () => {
      const m = sim.p.mode;
      sim.ctl.tilt.show(m === 'reposo');
      sim.ctl.ax.show(m === 'carro');
      sim.ctl.ay.show(m === 'ascensor');
    };
    sim.onChange = sync;
    sync();
    sim.animate((dt) => {
      const tgt = target();
      const k = 1 - Math.exp(-dt * 8);
      disp = [disp[0] + (tgt.dc[0] - disp[0]) * k, disp[1] + (tgt.dc[1] - disp[1]) * k];
    }, { button: false });
    function target() {
      const m = sim.p.mode;
      let a = [0, 0], th = 0;
      if (m === 'reposo') th = M.rad(sim.p.tilt);
      if (m === 'carro') a = [sim.p.ax, 0];
      if (m === 'ascensor') a = [0, sim.p.ay];
      if (m === 'caida') a = [0, -G];
      const fw = [a[0], a[1] + G];
      /* a ejes del chip (rotado th antihorario) */
      const c = Math.cos(th), s = Math.sin(th);
      const fc = [c * fw[0] + s * fw[1], -s * fw[0] + c * fw[1]];
      return { a, th, fw, fc, dc: [-fc[0] / 14, -fc[1] / 14] };
    }
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const tg = target();
      sim.set('a', `(${MC.fix(tg.a[0], 2)}, ${MC.fix(tg.a[1], 2)}) m/s²`);
      sim.set('f', `(${MC.fix(tg.fc[0], 2)}, ${MC.fix(tg.fc[1], 2)}) m/s²`);
      sim.set('fm', MC.fix(Math.hypot(tg.fc[0], tg.fc[1]), 2) + ' m/s²');
      const W = cv.w, H = cv.h;
      const cx = W * 0.36, cy = H * 0.52, S = Math.min(W * 0.5, H * 0.8);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-tg.th);
      /* carcasa del chip */
      ctx.fillStyle = MC.col('--surface-2');
      ctx.strokeStyle = MC.col('--ink-2');
      ctx.lineWidth = 2;
      ctx.fillRect(-S / 2, -S / 2, S, S);
      ctx.strokeRect(-S / 2, -S / 2, S, S);
      /* peines fijos */
      const mw = S * 0.34, mx = disp[0] * S * 0.08, my = -disp[1] * S * 0.08;
      ctx.fillStyle = MC.col('--metal');
      for (let k = -2; k <= 2; k++) {
        ctx.fillRect(-S / 2 + 4, k * S * 0.07 - 3, S * 0.18, 6);
        ctx.fillRect(S / 2 - 4 - S * 0.18, k * S * 0.07 - 3, S * 0.18, 6);
      }
      /* resortes */
      const sp = (x1, y1, x2, y2) => D.spring(ctx, x1, y1, x2, y2, { n: 7, amp: S * 0.025, color: '--ink-2', width: 1.6 });
      sp(0, -S / 2, mx, my - mw / 2);
      sp(0, S / 2, mx, my + mw / 2);
      sp(-S / 2, -S * 0.36, mx - mw / 2, my - mw * 0.35);
      sp(S / 2, -S * 0.36, mx + mw / 2, my - mw * 0.35);
      /* masa de prueba */
      D.block(ctx, mx, my, mw, mw, { fill: '--body-b', label: 'm' });
      /* marcas de reposo */
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = MC.alpha('--ink-3', 0.8);
      ctx.lineWidth = 1;
      ctx.strokeRect(-mw / 2, -mw / 2, mw, mw);
      ctx.setLineDash([]);
      /* ejes del chip */
      D.arrow(ctx, -S / 2 - 6, S / 2 + 18, -S / 2 + 40, S / 2 + 18, { color: '--ax', width: 2 });
      D.arrow(ctx, -S / 2 - 6, S / 2 + 18, -S / 2 - 6, S / 2 - 28, { color: '--ay', width: 2 });
      ctx.restore();
      MC.text(ctx, 'chip', cx - S / 2 + 6, cy - S / 2 - 8, { size: 11, color: '--ink-3' });
      /* vectores en el mundo */
      const k = S * 0.028;
      const vx = W * 0.8, vy = H * 0.5;
      D.panel(ctx, W * 0.66, 12, W * 0.32, H - 24, { title: 'VECTORES (MUNDO)' });
      D.vec(ctx, vx - 30, vy, tg.a[0] * k, -tg.a[1] * k, { color: '--acc', label: 'a' });
      D.vec(ctx, vx, vy, 0, G * k, { color: '--weight', label: 'g' });
      D.vec(ctx, vx + 30, vy, tg.fw[0] * k, -tg.fw[1] * k, { color: '--accent', label: 'f', width: 3 });
      MC.text(ctx, 'f = a − g', W * 0.82, H - 26, { size: 13, math: true, align: 'center', color: '--ink-2' });
    });
  });

  /* ---------- Giroscopio ---------- */
  MC.defineSim('giroscopio', function (sim) {
    sim.cols2('1fr 1.6fr');
    const cs = sim.canvas({ aspect: 0.8, label: 'Plataforma giratoria vista desde arriba' });
    const cg = sim.canvas({ aspect: 1.3, label: 'Velocidad angular y ángulo' });
    const hist = new MC.History(['w', 'wm', 'th', 'thm'], { minDt: 1 / 50 });
    let th = 0, thm = 0, bEst = 0, nRest = 0, sumRest = 0;
    const prof = (t) => {
      const wmax = sim.p.wmax;
      if (t < 2) return 0;
      if (t < 4) return wmax * (t - 2) / 2;
      if (t < 12) return wmax;
      if (t < 14) return wmax * (14 - t) / 2;
      return 0;
    };
    sim.group('Movimiento');
    sim.slider('wmax', { label: 'Velocidad angular máxima', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'rad/s', fmt: (v) => MC.fix(v, 1), reset: true });
    sim.group('Sensor');
    sim.slider('bias', { label: 'Sesgo del giroscopio', min: -0.02, max: 0.02, step: 0.001, value: 0.006, unit: 'rad/s', fmt: (v) => MC.fix(v, 3), reset: true });
    sim.slider('noise', { label: 'Ruido', min: 0, max: 0.05, step: 0.001, value: 0.01, unit: 'rad/s', fmt: (v) => MC.fix(v, 3) });
    sim.check('fix', { label: 'Restar el sesgo medido en reposo (primeros 2 s)', value: false, reset: true });
    sim.out('w', 'ω verdadera');
    sim.out('wm', 'ω leída');
    sim.out('dth', 'Error del ángulo integrado', { hl: true });
    sim.run({
      h: 1 / 200, timeScale: 1, speed: 1,
      reset() { th = 0; thm = 0; bEst = 0; nRest = 0; sumRest = 0; hist.clear(); },
      step(h) {
        const t = sim.t;
        const w = prof(t);
        const wm = w + sim.p.bias + M.gauss(0, sim.p.noise);
        if (t < 2) { nRest++; sumRest += wm; bEst = sumRest / nRest; }
        th += w * h;
        thm += (wm - (sim.p.fix && t >= 2 ? bEst : 0)) * h;
        hist.push(t, { w, wm, th, thm });
        if (t > 30) sim.end();
      }
    });
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const cx = cs.w / 2, cy = cs.h / 2, R = Math.min(cs.w, cs.h) * 0.4;
      D.circle(ctx, cx, cy, R, { fill: '--surface-2', color: '--ink-2', width: 2 });
      for (let k = 0; k < 12; k++) { const a = th + (k * Math.PI) / 6; D.line(ctx, cx + R * 0.9 * Math.cos(a), cy - R * 0.9 * Math.sin(a), cx + R * Math.cos(a), cy - R * Math.sin(a), { color: '--ink-3', width: 1 }); }
      D.phone(ctx, cx + R * 0.45 * Math.cos(th), cy - R * 0.45 * Math.sin(th), R * 0.32, R * 0.62, { ang: th - Math.PI / 2 });
      D.arcArrow(ctx, cx, cy, R * 1.08, Math.PI * 0.15, Math.PI * 0.45, { color: '--az' });
      MC.text(ctx, 'ω_z', cx + R * 0.55, cy - R * 1.1, { size: 13, math: true, color: '--az', halo: true });
      sim.set('w', MC.fix(prof(sim.t), 3) + ' rad/s');
      sim.set('wm', MC.fix(hist.last('wm'), 3) + ' rad/s');
      sim.set('dth', isFinite(hist.last('thm')) ? MC.fix(M.deg(hist.last('thm') - hist.last('th')), 1) + '°' : '—');
      const c2 = cg.ctx;
      D.clear(cg);
      const tmax = 30;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h * 0.5, xmin: 0, xmax: tmax, ymin: -0.5, ymax: sim.p.wmax * 1.2, xlabel: '', ylabel: ['ω', 'rad/s'], mt: 10, mb: 20 });
      P.frame();
      P.xy(hist.d.t, hist.d.wm, { color: '--az', width: 1 });
      P.xy(hist.d.t, hist.d.w, { color: '--ink', width: 1.5, dash: [5, 4] });
      const thMax = Math.max(1, ...hist.d.th, ...hist.d.thm) * 1.1;
      const Q = new MC.Plot(c2, { x: 0, y: cg.h * 0.5, w: cg.w, h: cg.h * 0.5, xmin: 0, xmax: tmax, ymin: Math.min(-0.5, ...hist.d.thm), ymax: thMax, xlabel: ['t', 's'], ylabel: ['θ', 'rad'], mt: 10 });
      Q.frame();
      Q.xy(hist.d.t, hist.d.th, { color: '--ink', width: 1.5, dash: [5, 4] });
      Q.xy(hist.d.t, hist.d.thm, { color: '--accent', width: 2 });
      Q.legend([{ label: 'verdadero', color: '--ink', dash: [5, 4] }, { label: 'integrado del sensor', color: '--accent' }], 'tl');
    });
  });

  /* ---------- Magnetómetro ---------- */
  MC.defineSim('magnetometro', function (sim) {
    const cv = sim.canvas({ aspect: 2.5, label: 'Lecturas del magnetómetro en tres planos' });
    const off = [38, -22, 47], sc = [1.04, 0.93, 1.06];
    let pts = [], cal = null, target = 0;
    const read = (Rt, r) => {
      const b = V3.mul(Rt, BW);
      let m = [0, 0, 0];
      if (r > 0) {
        const mom = 0.22, k = 1e-7 * mom / Math.pow(r, 3) * 1e6; /* µT */
        m = V3.mul(Rt, [0, 2 * k, 0]);
      }
      const raw = [0, 1, 2].map((i) => (b[i] + m[i]) * sc[i] + off[i] + M.gauss(0, 0.3));
      return raw.map((v) => M.clamp(v, -4900, 4900));
    };
    sim.group('Mediciones');
    sim.button('Girar en todas direcciones', () => { target = pts.length + 600; sim.play(); }, { primary: true });
    sim.button('Borrar puntos', () => { pts = []; cal = null; sim.redraw(); });
    sim.button('Calibrar', () => {
      if (pts.length < 50) return;
      const mn = [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i]))), mx = [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i])));
      const o = mn.map((v, i) => (v + mx[i]) / 2), r = mn.map((v, i) => (mx[i] - v) / 2);
      const ravg = (r[0] + r[1] + r[2]) / 3;
      cal = { o, s: r.map((v) => ravg / v) };
      sim.redraw();
    });
    sim.group('Imán de neodimio');
    sim.slider('r', { label: 'Distancia del imán (0 = sin imán)', min: 0, max: 30, step: 0.5, value: 0, fmt: (v) => (v < 1 ? 'sin imán' : MC.fix(v, 1) + ' cm') });
    sim.out('n', 'Puntos medidos');
    sim.out('o', 'Centro estimado (hierro duro)');
    sim.out('rr', 'Radio corregido');
    sim.out('bnow', '|B| leído ahora', { hl: true });
    const addPts = (nAdd) => {
      for (let k = 0; k < nAdd; k++) {
        const u = V3.unit([M.gauss(0, 1), M.gauss(0, 1), M.gauss(0, 1)]);
        const ang = Math.random() * 2 * Math.PI;
        const K = [[0, -u[2], u[1]], [u[2], 0, -u[0]], [-u[1], u[0], 0]];
        const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const K2 = V3.mm(K, K);
        const R = I.map((row, i) => row.map((v, j) => v + Math.sin(ang) * K[i][j] + (1 - Math.cos(ang)) * K2[i][j]));
        pts.push(read(V3.T(R), 0));
      }
    };
    addPts(240);
    target = pts.length;
    sim.animate(() => {
      if (pts.length >= target) { sim.pause(); return; }
      addPts(12);
    }, { button: false, autoplay: false });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const corr = (p) => (cal ? p.map((v, i) => (v - cal.o[i]) * cal.s[i]) : p);
      const show = pts.map(corr);
      const planes = [[0, 1, 'B_x', 'B_y'], [1, 2, 'B_y', 'B_z'], [0, 2, 'B_x', 'B_z']];
      const w = cv.w / 3;
      const lim = cal ? 45 : 110;
      planes.forEach(([i, j, a, b], k) => {
        const P = new MC.Plot(ctx, { x: k * w, y: 0, w, h: cv.h, xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, xlabel: [a, 'µT'], ylabel: [b, 'µT'], ml: 44, mt: 12 });
        const side = Math.min(P.iw, P.ih);
        P.set({ mr: 12 + (P.iw - side), mb: 36 + (P.ih - side) });
        P.frame();
        P.scatter(show.map((p) => p[i]), show.map((p) => p[j]), { color: cal ? '--c3' : '--c1', r: 1.6, alpha: 0.55 });
        P.clip((c) => { c.strokeStyle = MC.col('--ink-3'); c.setLineDash([4, 4]); c.beginPath(); c.arc(P.X(0), P.Y(0), Math.abs(P.X(29.1) - P.X(0)), 0, 7); c.stroke(); c.setLineDash([]); });
      });
      sim.set('n', String(pts.length));
      sim.set('o', cal ? `(${cal.o.map((v) => MC.fix(v, 0)).join(', ')}) µT` : 'sin calibrar');
      if (cal && show.length) sim.set('rr', MC.fix(M.mean(show.map((p) => V3.norm(p))), 1) + ' µT (Tierra: 29.1)');
      else sim.set('rr', '—');
      const now = corr(read(V3.T(eulerR(0, 0, 0)), sim.p.r >= 1 ? sim.p.r / 100 : 0));
      sim.set('bnow', MC.fix(V3.norm(now), 1) + ' µT' + (Math.max(...now.map(Math.abs)) > 4800 ? ' (¡saturado!)' : ''));
    });
  });

  /* ---------- Barómetro ---------- */
  MC.defineSim('barometro', function (sim) {
    sim.cols2('0.8fr 2fr');
    const cb = sim.canvas({ aspect: 0.5, label: 'Edificio' });
    const cg = sim.canvas({ aspect: 1.25, label: 'Presión y altura' });
    const hist = new MC.History(['p', 'z', 'zm'], { minDt: 1 / 25 });
    let z = 0, wait = 0, floor = 0, p0m = null;
    sim.group('Edificio');
    sim.slider('floors', { label: 'Pisos a subir', min: 1, max: 10, step: 1, value: 5, fmt: (v) => String(Math.round(v)), reset: true });
    sim.slider('hf', { label: 'Altura de cada piso', min: 2.4, max: 4, step: 0.1, value: 3, unit: 'm', fmt: (v) => MC.fix(v, 1), reset: true });
    sim.seg('how', { label: 'Subida', options: [['asc', 'Ascensor'], ['esc', 'Escaleras']], value: 'asc', reset: true });
    sim.group('Sensor y ambiente');
    sim.slider('noise', { label: 'Ruido del barómetro', min: 0, max: 5, step: 0.1, value: 1.2, unit: 'Pa', fmt: (v) => MC.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura del aire', min: 5, max: 35, step: 1, value: 19, unit: '°C', fmt: (v) => String(Math.round(v)) });
    sim.check('drift', { label: 'Deriva del clima (−0.3 hPa por cuarto de hora)', value: false });
    sim.out('p', 'Presión');
    sim.out('dz', 'Altura calculada', { hl: true });
    sim.out('zt', 'Altura verdadera');
    sim.out('k', 'Gradiente −ρg');
    const rho = () => (MC.K.pPop * 0.02897) / (8.314 * (273.15 + sim.p.T));
    sim.run({
      h: 1 / 50, speed: 2,
      reset() { z = 0; wait = 2; floor = 0; hist.clear(); p0m = null; },
      step(h) {
        const zt = Math.round(sim.p.floors) * sim.p.hf;
        const v = sim.p.how === 'asc' ? 1.0 : 0.3;
        if (wait > 0) wait -= h;
        else if (z < zt) { z = Math.min(zt, z + v * h); }
        const p = MC.K.pPop - rho() * G * z - (sim.p.drift ? (30 / 900) * sim.t : 0) + M.gauss(0, sim.p.noise);
        if (p0m === null && sim.t > 0.5) p0m = p;
        if (hist.push(sim.t, { p: p / 100, z, zm: p0m !== null ? (p0m - p) / (rho() * G) : 0 }) && z >= zt && sim.t > zt / v + 8) sim.end();
        void floor;
      }
    });
    sim.onDraw(() => {
      const ctx = cb.ctx;
      D.clear(cb);
      const n = Math.round(sim.p.floors);
      const top = 20, bot = cb.h - 20;
      const hpx = (bot - top) / (n + 1);
      for (let k = 0; k <= n; k++) {
        const y = bot - k * hpx;
        ctx.fillStyle = MC.col(k % 2 ? '--surface-2' : '--surface-3');
        ctx.fillRect(cb.w * 0.2, y - hpx, cb.w * 0.6, hpx);
        MC.text(ctx, String(k + 1), cb.w * 0.16, y - hpx / 2, { size: 11, mono: true, align: 'right', baseline: 'middle', color: '--ink-3' });
      }
      D.ground(ctx, 0, bot, cb.w);
      const yy = bot - (z / sim.p.hf) * hpx - hpx * 0.45;
      D.person(ctx, cb.w * 0.5, yy + hpx * 0.42, hpx * 0.75, { color: '--accent' });
      const zm = hist.last('zm');
      sim.set('p', isFinite(hist.last('p')) ? MC.fix(hist.last('p'), 2) + ' hPa' : '—');
      sim.set('dz', isFinite(zm) ? MC.fix(zm, 2) + ' m' : '—');
      sim.set('zt', MC.fix(z, 2) + ' m');
      sim.set('k', MC.fix(rho() * G, 2) + ' Pa/m');
      const c2 = cg.ctx;
      D.clear(cg);
      const zt = n * sim.p.hf;
      const tmax = Math.max(20, zt / (sim.p.how === 'asc' ? 1 : 0.3) + 12);
      const pTop = MC.K.pPop / 100, pBot = (MC.K.pPop - rho() * G * zt) / 100;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h * 0.5, xmin: 0, xmax: tmax, ymin: pBot - 0.15 - (sim.p.drift ? 0.15 : 0), ymax: pTop + 0.1, xlabel: '', ylabel: ['p', 'hPa'], mt: 10, mb: 20 });
      P.frame();
      P.xy(hist.d.t, hist.d.p, { color: '--c1', width: 1.3 });
      const Q = new MC.Plot(c2, { x: 0, y: cg.h * 0.5, w: cg.w, h: cg.h * 0.5, xmin: 0, xmax: tmax, ymin: -1, ymax: zt + 2, xlabel: ['t', 's'], ylabel: ['z', 'm'], mt: 10 });
      Q.frame();
      Q.xy(hist.d.t, hist.d.z, { color: '--ink', width: 1.5, dash: [5, 4] });
      Q.xy(hist.d.t, hist.d.zm, { color: '--accent', width: 1.6 });
      Q.legend([{ label: 'altura verdadera', color: '--ink', dash: [5, 4] }, { label: 'calculada con la presión', color: '--accent' }], 'tl');
    });
  });

  /* ---------- Cronómetro acústico ---------- */
  MC.defineSim('microfono', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Señal del micrófono' });
    let sig = null;
    const fs = 8000;
    sim.group('Evento');
    sim.slider('dt', { label: 'Tiempo real entre los dos golpes', min: 0.05, max: 1.0, step: 0.001, value: 0.452, unit: 's', fmt: (v) => MC.fix(v, 3), onInput: () => { sig = null; } });
    sim.slider('dd', { label: 'Distancia extra al 2.º golpe', min: -3, max: 3, step: 0.05, value: 0, unit: 'm', fmt: (v) => MC.fix(v, 2), onInput: () => { sig = null; } });
    sim.group('Ajustes del cronómetro');
    sim.slider('thr', { label: 'Umbral', min: 0.02, max: 1, step: 0.01, value: 0.3, fmt: (v) => MC.fix(v, 2) });
    sim.slider('bg', { label: 'Ruido de fondo', min: 0, max: 0.5, step: 0.01, value: 0.08, fmt: (v) => MC.fix(v, 2), onInput: () => { sig = null; } });
    sim.slider('dead', { label: 'Tiempo muerto tras el 1.er disparo', min: 0.02, max: 0.3, step: 0.01, value: 0.1, unit: 's', fmt: (v) => MC.fix(v, 2) });
    sim.button('Repetir', () => { sig = null; sim.redraw(); });
    sim.out('t1', 'Primer disparo');
    sim.out('t2', 'Segundo disparo');
    sim.out('dm', 'Tiempo medido', { hl: true });
    sim.out('err', 'Diferencia con el real');
    sim.onDraw(() => {
      const t1 = 0.15, t2 = t1 + sim.p.dt + sim.p.dd / 342;
      if (!sig) {
        const n = Math.round((t2 + 0.25) * fs);
        const y = new Array(n);
        for (let i = 0; i < n; i++) {
          const t = i / fs;
          let v = M.gauss(0, sim.p.bg * 0.5);
          for (const [tk, A] of [[t1, 0.9], [t2, 0.7]]) if (t >= tk) { const u = t - tk; v += A * Math.exp(-u / 0.012) * Math.sin(2 * Math.PI * 900 * u + Math.sin(2 * Math.PI * 140 * u) * 2); }
          y[i] = v;
        }
        sig = y;
      }
      let a = -1, b = -1;
      for (let i = 0; i < sig.length; i++) {
        if (Math.abs(sig[i]) >= sim.p.thr) {
          if (a < 0) a = i;
          else if ((i - a) / fs > sim.p.dead) { b = i; break; }
        }
      }
      const ta = a / fs, tb = b / fs;
      sim.set('t1', a >= 0 ? MC.fix(ta * 1000, 1) + ' ms' : 'no detectado');
      sim.set('t2', b >= 0 ? MC.fix(tb * 1000, 1) + ' ms' : 'no detectado');
      sim.set('dm', a >= 0 && b >= 0 ? MC.fix(tb - ta, 4) + ' s' : '—');
      sim.set('err', a >= 0 && b >= 0 ? MC.fix((tb - ta - sim.p.dt) * 1000, 1) + ' ms' : '—');
      const ctx = cv.ctx;
      D.clear(cv);
      const tN = sig.length / fs;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tN, ymin: -1.1, ymax: 1.1, xlabel: ['t', 's'], ylabel: 'amplitud', mt: 14 });
      P.frame();
      const step = Math.max(1, Math.floor(sig.length / 2000));
      const xs = [], ys = [];
      for (let i = 0; i < sig.length; i += step) { let mx = 0, mi = 0; for (let j = i; j < Math.min(sig.length, i + step); j++) { mx = Math.max(mx, sig[j]); mi = Math.min(mi, sig[j]); } xs.push(i / fs, i / fs); ys.push(mi, mx); }
      P.xy(xs, ys, { color: '--c1', width: 1 });
      P.hband(-sim.p.thr, sim.p.thr, { color: '--ink-3', alpha: 0.08 });
      P.hline(sim.p.thr, { color: '--accent', label: 'umbral', labelRight: true });
      P.hline(-sim.p.thr, { color: '--accent' });
      if (a >= 0) P.vline(ta, { color: '--c3', dash: [], width: 2, label: 'inicio' });
      if (b >= 0) P.vline(tb, { color: '--c2', dash: [], width: 2, label: 'fin' });
      if (a >= 0) P.band(ta, ta + sim.p.dead, { color: '--ink-3', alpha: 0.1 });
    });
  });
})();
