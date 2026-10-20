/* Capítulo 13 — Momento angular */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0), f3 = (v) => MC.fix(v, 3);
  const G = 9.8;

  /* ======================================================================
     12.1  Momento angular de una partícula
     ====================================================================== */
  MC.defineSim('L-particula', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const gc = sim.canvas({ aspect: 4.2, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -5.2, xmax: 5.2, ymin: -3.3, ymax: 3.3 });
    const H = new MC.History(['L']);
    const gL = new MC.TGraph({ ylabel: ['L', 'kg·m²/s'], series: [{ key: 'L', label: 'L', unit: 'kg·m²/s', color: '--mom', fmt: f3 }], legend: false, tspan: 10, zero: true });
    MC.hover(sim, gc, [gL]);
    const O = { x: 0, y: 0 };
    const s = { x: 0, y: 0, vx: 0, vy: 0, marks: [] };
    sim.group('Situación');
    sim.seg('mode', { options: [['libre', 'Libre'], ['central', 'Fuerza central'], ['uniforme', 'Gravedad uniforme']], value: 'libre', reset: true });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.2, max: 3, step: 0.1, value: 1, unit: 'kg', fmt: f1, reset: true });
    sim.slider('v', { label: 'Rapidez inicial', min: 0.3, max: 3, step: 0.05, value: 1, unit: 'm/s', fmt: f2, reset: true });
    sim.slider('b', { label: 'Distancia de la recta al origen (libre)', min: 0, max: 3, step: 0.05, value: 1.5, unit: 'm', fmt: f2, reset: true });
    sim.slider('dt', { label: 'Intervalo entre áreas', min: 0.25, max: 2, step: 0.25, value: 1, unit: 's', fmt: f2, reset: true });
    sim.button('Origen en el centro', () => { O.x = 0; O.y = 0; sim.reset(); });
    sim.out('L', 'Momento angular <i>L</i> = <i>m</i>(<i>xv<sub>y</sub></i> − <i>yv<sub>x</sub></i>)', { hl: true });
    sim.out('rp', 'Brazo <i>r</i><sub>⊥</sub> = <i>L</i>/(<i>mv</i>)');
    sim.out('A', 'Áreas barridas (último intervalo)', { hl: true });
    sim.out('tau', 'Torque respecto a O');
    sim.presets([
      { id: 'libre', label: 'Partícula libre en línea recta', v: { mode: 'libre', m: 1, v: 1, b: 1.5, dt: 1 } },
      { id: 'central', label: 'Fuerza central (resorte hacia O)', v: { mode: 'central', m: 1, v: 1.2, dt: 0.5 } },
      { id: 'uniforme', label: 'Gravedad uniforme: L cambia', v: { mode: 'uniforme', m: 1, v: 1.5, dt: 0.5 } }
    ]);
    const force = (x, y) => {
      const p = sim.p;
      if (p.mode === 'central') return [-p.m * 0.6 * x, -p.m * 0.6 * y];
      if (p.mode === 'uniforme') return [0, -p.m * 0.5];
      return [0, 0];
    };
    MC.handles(sim, cv, view, () => [{ id: 'O', x: O.x, y: O.y, r: 16 }], (id, x, y) => { O.x = M.clamp(x, -5, 5); O.y = M.clamp(y, -3, 3); sim.reset(); });
    sim.hint('Arrastre el origen O', cv);
    sim.run({
      reset() {
        const p = sim.p;
        if (p.mode === 'libre') { s.x = -4.8; s.y = p.b; s.vx = p.v; s.vy = 0; }
        else if (p.mode === 'central') { s.x = 2.6; s.y = 0; s.vx = 0; s.vy = p.v; }
        else { s.x = -4.5; s.y = -1.5; s.vx = p.v; s.vy = p.v * 1.1; }
        s.marks = [[s.x, s.y]];
        H.clear(); H.push(0, { L: Lnow() }, true);
      },
      step(h) {
        const p = sim.p;
        const F = (t, yv) => { const f = force(yv[0], yv[1]); return [yv[2], yv[3], f[0] / p.m, f[1] / p.m]; };
        const y = M.rk4(F, [s.x, s.y, s.vx, s.vy], 0, h);
        s.x = y[0]; s.y = y[1]; s.vx = y[2]; s.vy = y[3];
        const t = sim.t + h;
        if (Math.floor((t + 1e-9) / p.dt) > Math.floor((sim.t + 1e-9) / p.dt)) s.marks.push([s.x, s.y]);
        H.push(t, { L: Lnow() });
        if (Math.abs(s.x) > 6 || Math.abs(s.y) > 4 || t > 20) sim.end();
      },
      h: 1 / 500
    });
    function Lnow() { return sim.p.m * ((s.x - O.x) * s.vy - (s.y - O.y) * s.vx); }
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      view.update();
      D.clear(cv);
      view.grid({ labels: false });
      /* áreas barridas */
      const cols = ['--c1', '--c4'];
      const areas = [];
      for (let i = 1; i < s.marks.length; i++) {
        const a = s.marks[i - 1], b = s.marks[i];
        D.poly(ctx, [[view.X(O.x), view.Y(O.y)], [view.X(a[0]), view.Y(a[1])], [view.X(b[0]), view.Y(b[1])]], { close: true, color: cols[i % 2], width: 1, fill: cols[i % 2], fillAlpha: 0.22 });
        const A = 0.5 * Math.abs((a[0] - O.x) * (b[1] - O.y) - (a[1] - O.y) * (b[0] - O.x));
        areas.push(A);
        const cx = (O.x + a[0] + b[0]) / 3, cy = (O.y + a[1] + b[1]) / 3;
        MC.text(ctx, MC.fix(A, 2), view.X(cx), view.Y(cy) + 4, { size: 10.5, mono: true, align: 'center', color: cols[i % 2], halo: true });
      }
      if (p.mode === 'central') D.circle(ctx, view.X(0), view.Y(0), 5, { fill: '--force' });
      const X = view.X(s.x), Y = view.Y(s.y);
      D.vec(ctx, view.X(O.x), view.Y(O.y), X - view.X(O.x), Y - view.Y(O.y), { color: '--pos', label: 'r', width: 1.8, size: 13 });
      D.vec(ctx, X, Y, s.vx * p.m * 30, -s.vy * p.m * 30, { color: '--mom', label: 'p' });
      const F = force(s.x, s.y);
      if (Math.hypot(F[0], F[1]) > 1e-6) D.vec(ctx, X, Y, F[0] * 40, -F[1] * 40, { color: '--force', label: 'F', width: 2 });
      D.ball(ctx, X, Y, 8, { fill: '--body-a' });
      const L = Lnow();
      D.outIn(ctx, view.X(O.x), view.Y(O.y), 9, Math.abs(L) < 1e-6 ? 0 : L > 0 ? 1 : -1, { color: '--mom' });
      MC.text(ctx, 'O', view.X(O.x) - 16, view.Y(O.y) + 16, { size: 13, weight: 700, halo: true });
      const gctx = gc.ctx;
      D.clear(gc);
      gL.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 32 }, H, { t: sim.t, yExtra: [0] });
      const tau = (s.x - O.x) * F[1] - (s.y - O.y) * F[0];
      sim.set('L', `${f3(L)} kg·m²/s ${L > 0 ? '⊙' : L < 0 ? '⊗' : ''}`);
      sim.set('rp', `${f3(Math.abs(L) / (p.m * Math.max(1e-9, Math.hypot(s.vx, s.vy))))} m`);
      const last = areas.slice(-3).map((a) => MC.fix(a, 2)).join(' | ');
      sim.set('A', areas.length ? last + ' m²' : '—');
      sim.set('tau', `${f3(tau)} N·m`);
    });
  });

  /* ======================================================================
     12.3  La patinadora y la silla giratoria
     ====================================================================== */
  MC.defineSim('patinadora', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.8 });
    const H = new MC.History(['w', 'I', 'K', 'L']);
    const gw = new MC.TGraph({ ylabel: ['ω', 'rad/s'], series: [{ key: 'w', label: 'ω', unit: 'rad/s', color: '--vel', fmt: f2 }], legend: false, tspan: 8 });
    const gK = new MC.TGraph({ ylabel: ['', 'J · kg·m²/s'], series: [{ key: 'K', label: 'K', unit: 'J', color: '--K', fmt: f1 }, { key: 'L', label: 'L', unit: 'kg·m²/s', color: '--mom', fmt: f1 }], legend: 'tl', tspan: 8 });
    MC.hover(sim, gc, [gw, gK]);
    const s = { phi: 0, L: 0, w: 0 };
    let stopTw = null;
    sim.group('Situación');
    sim.seg('mode', { options: [['patinadora', 'Patinadora'], ['silla', 'Silla con pesas']], value: 'patinadora', reset: true });
    sim.slider('I0', { label: 'Momento de inercia del cuerpo', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg·m²', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa de cada brazo / pesa', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'kg', fmt: f1, reset: true });
    sim.slider('w0', { label: 'Rapidez angular inicial ω₀', min: 1, max: 15, step: 0.1, value: 6, unit: 'rad/s', fmt: f1, reset: true });
    sim.group('Brazos (se mueven en marcha)');
    sim.slider('r', { label: 'Distancia de las manos al eje <i>r</i>', min: 0.1, max: 1, step: 0.01, value: 0.8, unit: 'm', fmt: f2 });
    const moveTo = (target) => {
      if (stopTw) stopTw();
      const r0 = sim.p.r;
      stopTw = MC.tween(1.2, (q) => { sim.ctl.r.set(r0 + (target - r0) * (1 - Math.pow(1 - q, 3)), true); }, () => { stopTw = null; });
      if (!sim.playing) sim.play();
    };
    sim.button('Recoger los brazos', () => moveTo(0.18), { primary: true });
    sim.button('Extenderlos', () => moveTo(0.8));
    sim.out('I', 'Momento de inercia <i>I</i> = <i>I</i>₀ + 2<i>mr</i>²');
    sim.out('w', 'Rapidez angular ω', { hl: true });
    sim.out('L', 'Momento angular <i>L</i> = <i>I</i>ω (constante)', { hl: true });
    sim.out('K', 'Energía cinética <i>L</i>²/(2<i>I</i>)');
    sim.out('W', 'Trabajo hecho por los músculos');
    sim.presets([
      { id: 'patinadora', label: 'Patinadora que recoge los brazos', v: { mode: 'patinadora', I0: 1, m: 3, w0: 6, r: 0.8 } },
      { id: 'silla', label: 'Persona en silla giratoria con pesas de 5 kg', v: { mode: 'silla', I0: 3, m: 5, w0: 3, r: 0.8 } }
    ]);
    const I = () => sim.p.I0 + 2 * sim.p.m * sim.p.r * sim.p.r;
    let K0 = 0;
    sim.run({
      reset() { s.phi = 0; s.L = I() * sim.p.w0; s.w = sim.p.w0; K0 = 0.5 * I() * s.w * s.w; H.clear(); push(0); },
      step(h) {
        s.w = s.L / I();
        s.phi += s.w * h;
        push(sim.t + h);
        if (sim.t > 60) sim.end();
      },
      h: 1 / 600
    });
    function push(t) { const i = I(); H.push(t, { w: s.L / i, I: i, K: (s.L * s.L) / (2 * i), L: s.L }); }
    sim.onChange = (id) => { if (id === 'r' && !sim.playing) { s.w = s.L / I(); push(sim.t); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      /* vista frontal */
      const fx = cv.w * 0.25, fy = cv.h * 0.9, hgt = cv.h * 0.72;
      const armPx = (p.r / 1) * cv.w * 0.18;
      if (p.mode === 'silla') {
        D.block(ctx, fx, fy - hgt * 0.45, hgt * 0.4, 10, { fill: '--c6' });
        D.line(ctx, fx, fy - hgt * 0.45, fx, fy, { color: '--ink-2', width: 3 });
      }
      const top = p.mode === 'silla' ? fy - hgt * 0.45 : fy;
      const bodyH = p.mode === 'silla' ? hgt * 0.55 : hgt;
      D.person(ctx, fx, top, bodyH, { arms: 0 });
      const sh = top - bodyH + bodyH * 0.23;
      ctx.save();
      ctx.strokeStyle = MC.col('--ink');
      ctx.lineWidth = Math.max(1.8, bodyH * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx - armPx, sh); ctx.lineTo(fx + armPx, sh); ctx.stroke();
      ctx.restore();
      for (const sg of [-1, 1]) D.ball(ctx, fx + sg * armPx, sh, p.mode === 'silla' ? 9 : 6, { fill: p.mode === 'silla' ? '--metal' : '--body-c' });
      D.line(ctx, fx, top - bodyH - 16, fx, fy + 6, { color: '--ink-3', dash: [4, 4], width: 1 });
      MC.text(ctx, 'vista de frente', fx, 16, { size: 11, align: 'center', color: '--ink-3' });
      /* vista superior */
      const tx = cv.w * 0.66, ty = cv.h * 0.5, sc = Math.min(cv.h * 0.42, cv.w * 0.2);
      D.circle(ctx, tx, ty, sc * 0.2, { fill: '--body-e', color: '--ink-2' });
      for (const sg of [-1, 1]) {
        const hx = tx + sg * sc * p.r * Math.cos(s.phi), hy = ty - sg * sc * p.r * Math.sin(s.phi);
        D.line(ctx, tx, ty, hx, hy, { color: '--ink', width: 3 });
        D.ball(ctx, hx, hy, p.mode === 'silla' ? 9 : 6, { fill: p.mode === 'silla' ? '--metal' : '--body-c' });
      }
      D.line(ctx, tx, ty, tx + sc * 0.2 * Math.cos(s.phi + Math.PI / 2), ty - sc * 0.2 * Math.sin(s.phi + Math.PI / 2), { color: '--c8', width: 3 });
      D.arcArrow(ctx, tx, ty, sc * 1.05, 0.3, 1.3, { color: '--vel', width: 2 });
      MC.text(ctx, 'vista desde arriba', tx, 16, { size: 11, align: 'center', color: '--ink-3' });
      D.bars(ctx, [{ label: 'I', value: I(), color: '--c1' }, { label: 'ω', value: s.L / I(), color: '--vel' }], { x: cv.w - 128, y: 8, w: 120, h: cv.h - 16, title: 'I (kg·m²) y ω (rad/s)', max: MC.niceCeil(Math.max(p.I0 + 2 * p.m, (s.L / (p.I0 + 2 * p.m * 0.01)))), fmt: (v) => MC.fix(v, 2) });
      const gctx = gc.ctx;
      D.clear(gc);
      gw.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      gK.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      const i = I(), K = (s.L * s.L) / (2 * i);
      sim.set('I', `${f2(i)} kg·m²`);
      sim.set('w', `${f2(s.L / i)} rad/s = ${f2(s.L / i / (2 * Math.PI))} vueltas/s`);
      sim.set('L', `${f2(s.L)} kg·m²/s`);
      sim.set('K', `${f1(K)} J`);
      sim.set('W', `${f1(K - K0)} J`);
    });
  });

  /* ======================================================================
     12.3b  Colisiones rotacionales
     ====================================================================== */
  MC.defineSim('colision-rotacional', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    const gc = sim.canvas({ aspect: 3.8, cls: 'fixed' });
    const H = new MC.History(['w1', 'w2']);
    const gw = new MC.TGraph({ ylabel: ['ω', 'rad/s'], series: [{ key: 'w1', label: 'ω₁', unit: 'rad/s', color: '--c1', fmt: f2 }, { key: 'w2', label: 'ω₂', unit: 'rad/s', color: '--c4', fmt: f2 }], legend: 'tr', tspan: 4 });
    MC.hover(sim, gc, [gw]);
    const s = { yb: -1, hit: false, th: 0, w: 0, w1: 0, w2: 0, a1: 0, a2: 0, coupled: false, Lb: 0, Kb: 0 };
    sim.group('Situación');
    sim.seg('mode', { options: [['puerta', 'Bola contra una puerta'], ['discos', 'Dos discos que se acoplan']], value: 'puerta', reset: true });
    const gP = sim.group('Puerta');
    sim.slider('mb', { label: 'Masa de la bola <i>m</i>', min: 0.01, max: 1, step: 0.01, value: 0.05, unit: 'kg', fmt: f2, reset: true });
    sim.slider('vb', { label: 'Rapidez de la bola <i>v</i>', min: 1, max: 30, step: 0.5, value: 10, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('d', { label: 'Distancia del impacto a las bisagras <i>d</i>', min: 0.05, max: 0.8, step: 0.01, value: 0.7, unit: 'm', fmt: f2, reset: true });
    sim.slider('Md', { label: 'Masa de la puerta <i>M</i>', min: 2, max: 30, step: 0.5, value: 15, unit: 'kg', fmt: f1, reset: true });
    const gD = sim.group('Discos');
    sim.slider('I1', { label: 'Disco inferior <i>I</i>₁', min: 0.005, max: 0.1, step: 0.001, value: 0.01, unit: 'kg·m²', fmt: f3, reset: true });
    sim.slider('w10', { label: 'ω₁ inicial', min: -40, max: 40, step: 0.5, value: 30, unit: 'rad/s', fmt: f1, reset: true });
    sim.slider('I2', { label: 'Disco superior <i>I</i>₂', min: 0.005, max: 0.1, step: 0.001, value: 0.01, unit: 'kg·m²', fmt: f3, reset: true });
    sim.slider('w20', { label: 'ω₂ inicial', min: -40, max: 40, step: 0.5, value: 0, unit: 'rad/s', fmt: f1, reset: true });
    sim.slider('tf', { label: 'Torque de fricción entre discos', min: 0.02, max: 1, step: 0.01, value: 0.1, unit: 'N·m', fmt: f2, reset: true });
    sim.out('Lb', 'Momento angular antes', { hl: true });
    sim.out('La', 'Momento angular después', { hl: true });
    sim.out('wf', 'Rapidez angular final');
    sim.out('K', 'Energía cinética antes → después');
    sim.out('p', 'Energía perdida');
    sim.presets([
      { id: 'lejos', label: 'Plastilina que golpea lejos de las bisagras', v: { mode: 'puerta', mb: 0.05, vb: 10, d: 0.7, Md: 15 } },
      { id: 'cerca', label: 'El mismo golpe cerca de las bisagras', v: { mode: 'puerta', mb: 0.05, vb: 10, d: 0.1, Md: 15 } },
      { id: 'tornamesa', label: 'Disco que cae sobre una tornamesa', v: { mode: 'discos', I1: 0.01, w10: 30, I2: 0.01, w20: 0, tf: 0.1 }, note: 'Discos iguales: la rapidez final es la mitad y se pierde la mitad de la energía.' },
      { id: 'opuestos', label: 'Discos que giran en sentidos opuestos', v: { mode: 'discos', I1: 0.02, w10: 20, I2: 0.01, w20: -30, tf: 0.2 } }
    ]);
    const vis = () => { gP.hidden = sim.p.mode !== 'puerta'; gD.hidden = sim.p.mode !== 'discos'; };
    sim.onChange = () => vis();
    vis();
    const Ld = 0.8;
    const Idoor = () => (sim.p.Md * Ld * Ld) / 3;
    sim.run({
      reset() {
        vis();
        const p = sim.p;
        s.yb = -1.2; s.hit = false; s.th = 0; s.w = 0; s.coupled = false; s.a1 = 0; s.a2 = 0;
        if (p.mode === 'puerta') { s.Lb = p.mb * p.vb * p.d; s.Kb = 0.5 * p.mb * p.vb * p.vb; }
        else { s.w1 = p.w10; s.w2 = p.w20; s.Lb = p.I1 * p.w10 + p.I2 * p.w20; s.Kb = 0.5 * p.I1 * p.w10 ** 2 + 0.5 * p.I2 * p.w20 ** 2; }
        H.clear(); H.push(0, { w1: p.mode === 'puerta' ? 0 : s.w1, w2: p.mode === 'puerta' ? 0 : s.w2 }, true);
      },
      step(h) {
        const p = sim.p;
        if (p.mode === 'puerta') {
          if (!s.hit) {
            s.yb += p.vb * h * 0.25;
            if (s.yb >= 0) { s.yb = 0; s.hit = true; s.w = s.Lb / (Idoor() + p.mb * p.d * p.d); }
          } else { s.th += s.w * h; if (s.th > Math.PI / 2 || sim.t > 30) sim.end(); }
          H.push(sim.t + h, { w1: s.w, w2: 0 });
        } else {
          if (sim.t > 0.8) {
            const d = s.w1 - s.w2;
            if (Math.abs(d) > 1e-6) {
              const tau = Math.sign(d) * p.tf;
              let w1 = s.w1 - (tau / p.I1) * h, w2 = s.w2 + (tau / p.I2) * h;
              if (Math.sign(w1 - w2) !== Math.sign(d)) { const wf = s.Lb / (p.I1 + p.I2); w1 = wf; w2 = wf; }
              s.w1 = w1; s.w2 = w2;
            }
          }
          s.a1 += s.w1 * h; s.a2 += s.w2 * h;
          H.push(sim.t + h, { w1: s.w1, w2: s.w2 });
          if (sim.t > 8) sim.end();
        }
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      if (p.mode === 'puerta') {
        const view = new MC.View2D(cv, { xmin: -0.3, xmax: 1.3, ymin: -1.3, ymax: 0.9 });
        view.grid({ labels: false });
        D.wall(ctx, view.X(0) - 6, view.Y(0.3), view.Y(-0.3), 'left');
        const ex = view.X(Ld * Math.cos(s.th)), ey = view.Y(Ld * Math.sin(s.th));
        D.line(ctx, view.X(0), view.Y(0), ex, ey, { color: '--wood', width: 12 });
        D.circle(ctx, view.X(0), view.Y(0), 6, { fill: '--ink' });
        MC.text(ctx, 'bisagras', view.X(0) + 8, view.Y(0) + 24, { size: 11, color: '--ink-3' });
        const bx = s.hit ? p.d * Math.cos(s.th) : p.d, by = s.hit ? p.d * Math.sin(s.th) : s.yb;
        D.ball(ctx, view.X(bx), view.Y(by) + (s.hit ? 0 : 8), 7, { fill: '--c8' });
        if (!s.hit) D.vec(ctx, view.X(bx), view.Y(by) + 8, 0, -40, { color: '--vel', label: 'v' });
        D.dim(ctx, view.X(0), view.Y(-0.12), view.X(p.d), view.Y(-0.12), `d = ${f2(p.d)} m`, { labelOff: -12 });
        if (s.hit) D.arcArrow(ctx, view.X(0), view.Y(0), view.L(0.3), 0.1, 0.9, { color: '--vel', width: 2 });
        const If = Idoor() + p.mb * p.d * p.d, wf = s.Lb / If, Ka = 0.5 * If * wf * wf;
        sim.set('Lb', `${MC.sci(s.Lb, 3)} kg·m²/s (m v d)`);
        sim.set('La', `${MC.sci(If * wf, 3)} kg·m²/s`);
        sim.set('wf', `${f3(wf)} rad/s`);
        sim.set('K', `${MC.sci(s.Kb, 3)} → ${MC.sci(Ka, 3)} J`);
        sim.set('p', `${f1((100 * (s.Kb - Ka)) / s.Kb)} %`);
      } else {
        const cx = cv.w * 0.35, cy = cv.h * 0.5, R1 = Math.min(cv.h * 0.4, cv.w * 0.28), R2 = R1 * Math.sqrt(p.I2 / p.I1) * 0.8;
        MC.wheel(ctx, cx, cy, R1, s.a1, { fill: '--c1' });
        if (sim.t > 0.8) MC.wheel(ctx, cx, cy, Math.min(R2, R1 * 0.95), s.a2, { fill: '--c4' });
        else { MC.wheel(ctx, cx + R1 * 1.9, cy, Math.min(R2, R1 * 0.95) * 0.7, s.a2, { fill: '--c4' }); MC.text(ctx, 'se deja caer…', cx + R1 * 1.9, cy + R1 * 0.8, { size: 11.5, align: 'center', color: '--ink-3' }); }
        const wf = s.Lb / (p.I1 + p.I2), Ka = 0.5 * (p.I1 + p.I2) * wf * wf;
        const Kn = 0.5 * p.I1 * s.w1 ** 2 + 0.5 * p.I2 * s.w2 ** 2;
        sim.set('Lb', `${f3(s.Lb)} kg·m²/s`);
        sim.set('La', `${f3(p.I1 * s.w1 + p.I2 * s.w2)} kg·m²/s (ahora)`);
        sim.set('wf', `${f2(wf)} rad/s`);
        sim.set('K', `${f3(s.Kb)} → ${f3(Kn)} J`);
        sim.set('p', s.Kb > 0 ? `${f1((100 * (s.Kb - Ka)) / s.Kb)} % al final` : '—');
      }
      const gctx = gc.ctx;
      D.clear(gc);
      gw.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 32 }, H, { t: sim.t });
    });
  });

  /* ======================================================================
     12.4  Giroscopio y precesión
     ====================================================================== */
  MC.defineSim('giroscopio', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const s = { phi: 0, psi: 0 };
    sim.group('Rueda');
    sim.slider('ws', { label: 'Rapidez de giro de la rueda ω', min: 3, max: 400, step: 1, value: 30, unit: 'rad/s', log: true, fmt: f0 });
    sim.slider('Mw', { label: 'Masa de la rueda <i>M</i>', min: 0.1, max: 5, step: 0.05, value: 2, unit: 'kg', fmt: f2 });
    sim.slider('R', { label: 'Radio de la rueda <i>R</i>', min: 0.03, max: 0.4, step: 0.01, value: 0.33, unit: 'm', fmt: f2 });
    sim.slider('r', { label: 'Distancia del pivote a la rueda <i>r</i>', min: 0.02, max: 0.4, step: 0.01, value: 0.2, unit: 'm', fmt: f2 });
    sim.check('top', { label: 'Vista desde arriba (recuadro)', value: true });
    sim.out('I', 'Momento de inercia <i>I</i> = ½<i>MR</i>²');
    sim.out('L', 'Momento angular <i>L</i> = <i>I</i>ω');
    sim.out('tau', 'Torque del peso <i>Mgr</i>');
    sim.out('W', 'Rapidez de precesión Ω = τ/<i>L</i>', { hl: true });
    sim.out('T', 'Periodo de precesión', { hl: true });
    sim.out('ok', 'Validez (Ω ≪ ω)');
    sim.presets([
      { id: 'bici', label: 'Rueda de bicicleta colgada de una cuerda', v: { ws: 30, Mw: 2, R: 0.33, r: 0.2 } },
      { id: 'juguete', label: 'Giroscopio de juguete', v: { ws: 300, Mw: 0.1, R: 0.03, r: 0.04 } },
      { id: 'lento', label: 'Rueda que gira despacio', v: { ws: 6, Mw: 2, R: 0.33, r: 0.2 }, note: 'Ω ya no es pequeña frente a ω: la rueda en realidad cabecea y cae.' }
    ]);
    const calc = () => { const p = sim.p, I = 0.5 * p.Mw * p.R * p.R, L = I * p.ws, tau = p.Mw * G * p.r; return { I, L, tau, W: tau / L }; };
    sim.animate((dt) => { const c = calc(); s.phi += c.W * dt; s.psi += Math.min(sim.p.ws, 25) * dt; }, { autoplay: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, c = calc();
      D.clear(cv);
      const az = M.rad(35), el = M.rad(22);
      const sc = Math.min(cv.w, cv.h) * 0.9;
      const cx = cv.w * 0.45, cy = cv.h * 0.62;
      const P = (x, y, z) => { const u = x * Math.cos(az) - y * Math.sin(az), dep = x * Math.sin(az) + y * Math.cos(az); const v = z * Math.cos(el) - dep * Math.sin(el); return [cx + u * sc, cy - v * sc]; };
      const Hp = 0.35;
      /* poste y base */
      const base = P(0, 0, -0.1), topP = P(0, 0, Hp);
      ctx.save();
      ctx.fillStyle = MC.col('--ground-fill');
      ctx.beginPath();
      [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]].forEach(([x, y], i) => { const q = P(x, y, -0.1); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath(); ctx.fill();
      ctx.restore();
      D.line(ctx, base[0], base[1], topP[0], topP[1], { color: '--ink-2', width: 5 });
      /* órbita del eje (círculo horizontal) */
      const orb = [];
      for (let i = 0; i <= 60; i++) { const a = (i / 60) * 2 * Math.PI; orb.push(P(p.r * Math.cos(a), p.r * Math.sin(a), Hp)); }
      D.poly(ctx, orb, { color: '--ink-3', dash: [3, 4], width: 1 });
      const ax = [Math.cos(s.phi), Math.sin(s.phi), 0];
      const C = [p.r * ax[0], p.r * ax[1], Hp];
      const Cs = P(...C);
      D.line(ctx, topP[0], topP[1], Cs[0], Cs[1], { color: '--ink', width: 4 });
      /* rueda: circunferencia en el plano perpendicular al eje */
      const e1 = [-Math.sin(s.phi), Math.cos(s.phi), 0], e2 = [0, 0, 1];
      const Rv = Math.min(p.R, 0.3);
      const rim = [];
      for (let i = 0; i <= 72; i++) { const t = (i / 72) * 2 * Math.PI; rim.push(P(C[0] + Rv * (Math.cos(t) * e1[0]), C[1] + Rv * (Math.cos(t) * e1[1]), C[2] + Rv * Math.sin(t))); }
      D.poly(ctx, rim, { color: '--ink-2', width: 3, fill: '--metal', fillAlpha: 0.25 });
      for (let k = 0; k < 4; k++) { const t = s.psi + (k * Math.PI) / 2; const q = P(C[0] + Rv * Math.cos(t) * e1[0], C[1] + Rv * Math.cos(t) * e1[1], C[2] + Rv * Math.sin(t)); D.line(ctx, Cs[0], Cs[1], q[0], q[1], { color: '--ink-3', width: 1.5 }); }
      void e2;
      /* vectores */
      const Ls = 0.35;
      const Lt = P(C[0] + Ls * ax[0], C[1] + Ls * ax[1], C[2]);
      D.vec(ctx, Cs[0], Cs[1], Lt[0] - Cs[0], Lt[1] - Cs[1], { color: '--mom', label: 'L', width: 3 });
      const Tt = P(C[0] + 0.25 * e1[0], C[1] + 0.25 * e1[1], C[2]);
      D.vec(ctx, Cs[0], Cs[1], Tt[0] - Cs[0], Tt[1] - Cs[1], { color: '--force', label: 'τ', width: 2.6 });
      const Wt = P(C[0], C[1], C[2] - 0.22);
      D.vec(ctx, Cs[0], Cs[1], Wt[0] - Cs[0], Wt[1] - Cs[1], { color: '--weight', label: 'Mg', width: 2.2 });
      /* vista superior */
      if (p.top) {
        const bx = cv.w - 150, by = 10, bs = 140;
        D.panel(ctx, bx, by, bs, bs, { title: 'DESDE ARRIBA' });
        const ox = bx + bs / 2, oy = by + bs / 2 + 8, rr = 44;
        D.circle(ctx, ox, oy, rr, { color: '--ink-3', dash: [3, 3], width: 1 });
        D.vec(ctx, ox, oy, rr * Math.cos(s.phi), -rr * Math.sin(s.phi), { color: '--mom', label: 'L', size: 12 });
        const ex = ox + rr * Math.cos(s.phi), ey = oy - rr * Math.sin(s.phi);
        D.vec(ctx, ex, ey, 26 * -Math.sin(s.phi), -26 * Math.cos(s.phi), { color: '--force', label: 'dL', size: 11, width: 2 });
        D.circle(ctx, ox, oy, 3, { fill: '--ink' });
      }
      const T = (2 * Math.PI) / c.W;
      sim.set('I', `${MC.sci(c.I, 3)} kg·m²`);
      sim.set('L', `${MC.sci(c.L, 3)} kg·m²/s`);
      sim.set('tau', `${f3(c.tau)} N·m`);
      sim.set('W', `${f3(c.W)} rad/s`);
      sim.set('T', `${MC.sci(T, 3)} s`);
      sim.set('ok', c.W / p.ws < 0.1 ? `<span class="goodv">sí (Ω/ω = ${MC.fix(c.W / p.ws, 3)})</span>` : `<span class="warnv">no: Ω/ω = ${f2(c.W / p.ws)}</span>`);
    });
  });
})();
