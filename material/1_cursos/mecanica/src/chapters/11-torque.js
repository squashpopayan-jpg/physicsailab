/* Capítulo 12 — Dinámica de la rotación */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0), f3 = (v) => MC.fix(v, 3);
  const G = 9.8;

  /* ======================================================================
     11.1  Torque: llave, puerta y pedal
     ====================================================================== */
  MC.defineSim('torque-llave', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const s = { rot: 0, crank: 0, loose: false };
    let TP = null;
    sim.group('Situación');
    sim.seg('mode', { options: [['llave', 'Llave'], ['puerta', 'Puerta'], ['pedal', 'Pedal']], value: 'llave', reset: true });
    sim.group('Fuerza y brazo');
    sim.slider('F', { label: 'Fuerza <i>F</i>', min: 0, max: 600, step: 5, value: 150, unit: 'N', fmt: f0 });
    sim.slider('r', { label: 'Distancia al eje <i>r</i>', min: 0.02, max: 0.9, step: 0.01, value: 0.3, unit: 'm', fmt: f2 });
    sim.slider('phi', { label: 'Ángulo entre <i>r</i> y <i>F</i> (φ)', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: f0 });
    sim.slider('need', { label: 'Torque necesario para aflojar', min: 5, max: 200, step: 5, value: 40, unit: 'N·m', fmt: f0 });
    sim.out('tau', 'Torque τ = <i>rF</i> sen φ', { hl: true });
    sim.out('rp', 'Brazo de palanca <i>r</i><sub>⊥</sub> = <i>r</i> sen φ');
    sim.out('Fp', 'Componente útil <i>F</i> sen φ');
    sim.out('dir', 'Sentido');
    sim.out('res', 'Resultado', { hl: true });
    sim.presets([
      { id: 'larga', label: 'Tornillo oxidado con llave de 30 cm', v: { mode: 'llave', F: 150, r: 0.3, phi: 90, need: 40 }, note: 'τ = 0.30 × 150 = 45 N·m: alcanza para aflojarlo.' },
      { id: 'corta', label: 'La misma fuerza con llave de 15 cm', v: { mode: 'llave', F: 150, r: 0.15, phi: 90, need: 40 } },
      { id: 'inclinada', label: 'Fuerza inclinada 30°', v: { mode: 'llave', F: 150, r: 0.3, phi: 30, need: 40 }, note: 'Sólo cuenta F sen 30° = 75 N: el torque cae a la mitad.' },
      { id: 'rueda', label: 'Tuerca de rueda (120 N·m) con llave de 40 cm', v: { mode: 'llave', F: 300, r: 0.4, phi: 90, need: 120 } },
      { id: 'puerta', label: 'Empujar una puerta cerca de la bisagra', v: { mode: 'puerta', F: 20, r: 0.1, phi: 90, need: 8 }, note: 'Con r = 0.1 m no se abre; lleve la mano a 0.8 m.' },
      { id: 'pedal', label: 'Pedal de bicicleta', v: { mode: 'pedal', F: 400, r: 0.17, phi: 90, need: 40 } }
    ]);
    const vis = () => { const m = sim.p.mode; sim.ctl.phi.show(m !== 'pedal'); sim.ctl.need.show(m !== 'pedal'); };
    sim.onChange = (id) => { vis(); if (!sim.playing && sim.p.mode !== 'pedal') { s.rot = 0; s.loose = false; } };
    vis();
    const tauNow = () => {
      const p = sim.p;
      if (p.mode === 'pedal') return p.r * p.F * Math.cos(s.crank);
      return p.r * p.F * Math.sin(M.rad(p.phi));
    };
    sim.run({
      startLabel: 'Aplicar la fuerza',
      reset() { s.rot = 0; s.loose = false; s.crank = 0; },
      step(h) {
        const p = sim.p;
        if (p.mode === 'pedal') { s.crank -= 2.5 * h; if (sim.t > 30) sim.end(); return; }
        const t = tauNow();
        if (Math.abs(t) > p.need) { s.loose = true; s.rot += Math.sign(t) * 2.2 * h; if (Math.abs(s.rot) > Math.PI * 0.6) sim.end(); }
        else { s.loose = false; sim.end(); }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const tau = tauNow();
      if (p.mode === 'pedal') {
        const view = new MC.View2D({ w: cv.w * 0.55, h: cv.h }, { xmin: -0.32, xmax: 0.32, ymin: -0.3, ymax: 0.3 });
        const X = view.X(0), Y = view.Y(0);
        D.circle(ctx, X, Y, view.L(0.1), { fill: '--metal', color: '--ink-2', width: 2 });
        for (let k = 0; k < 40; k++) { const a = (k / 40) * 2 * Math.PI; D.circle(ctx, X + view.L(0.1) * Math.cos(a), Y - view.L(0.1) * Math.sin(a), 1.6, { fill: '--ink-2' }); }
        const px = X + view.L(p.r) * Math.cos(s.crank), py = Y - view.L(p.r) * Math.sin(s.crank);
        D.line(ctx, X, Y, px, py, { color: '--ink-2', width: 7 });
        D.block(ctx, px, py, 34, 10, { fill: '--tire' });
        D.vec(ctx, px, py - 5, 0, Math.min(110, p.F * 0.25), { color: '--force', label: 'F' });
        const rp = p.r * Math.cos(s.crank);
        D.line(ctx, X + view.L(rp), view.Y(0.28), X + view.L(rp), view.Y(-0.28), { color: '--force', dash: [3, 3], width: 1 });
        if (Math.abs(rp) > 0.005) D.dim(ctx, X, view.Y(-0.24), X + view.L(rp), view.Y(-0.24), `r⊥ = ${f2(Math.abs(rp))} m`, { labelOff: 12 });
        /* gráfica τ(θ) */
        const P = TP || (TP = new MC.Plot(ctx));
        P.ctx = ctx;
        const tm = MC.niceCeil(p.r * p.F * 1.1);
        P.set({ x: cv.w * 0.55, y: 0, w: cv.w * 0.45, h: cv.h, xmin: 0, xmax: 360, ymin: -tm, ymax: tm, xlabel: ['θ', '°'], ylabel: ['τ', 'N·m'], xticks: [0, 90, 180, 270, 360], mt: 12, mb: 36 });
        P.frame();
        P.fn((a) => p.r * p.F * Math.cos(M.rad(a)), { color: '--force', width: 2.2 });
        const ang = ((M.deg(-s.crank) % 360) + 360) % 360;
        P.dot(ang, p.r * p.F * Math.cos(M.rad(ang)), { color: '--force', r: 5 });
        P.label(90, 0, 'punto muerto', { dy: -8, align: 'center', size: 10.5 });
        sim.set('tau', `${f1(tau)} N·m`);
        sim.set('rp', `${f3(Math.abs(rp))} m`);
        sim.set('Fp', `${f1(Math.abs(p.F * Math.cos(s.crank)))} N`);
        sim.set('dir', tau > 0.5 ? 'ayuda a avanzar' : Math.abs(tau) <= 0.5 ? 'nulo (punto muerto)' : 'frena');
        sim.set('res', `torque medio del medio giro útil: ${f1((2 / Math.PI) * p.r * p.F)} N·m`);
        return;
      }
      const view = new MC.View2D(cv, { xmin: -0.35, xmax: 1.1, ymin: -0.42, ymax: 0.42 });
      const X0 = view.X(0), Y0 = view.Y(0);
      const phi = M.rad(p.phi);
      if (p.mode === 'llave') {
        /* tuerca hexagonal */
        ctx.save();
        ctx.translate(X0, Y0);
        ctx.rotate(-s.rot);
        ctx.fillStyle = MC.col('--metal');
        ctx.strokeStyle = MC.col('--ink-2');
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; ctx.lineTo(18 * Math.cos(a), 18 * Math.sin(a)); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(X0, Y0);
        ctx.rotate(-s.rot);
        ctx.fillStyle = MC.col('--ink-2');
        ctx.fillRect(10, -7, view.L(0.95), 14);
        ctx.restore();
      } else {
        /* puerta vista desde arriba */
        D.wall(ctx, X0 - 4, Y0 - 90, Y0 + 30, 'left');
        ctx.save();
        ctx.translate(X0, Y0);
        ctx.rotate(-s.rot);
        ctx.fillStyle = MC.col('--wood');
        ctx.fillRect(0, -6, view.L(0.9), 12);
        ctx.restore();
        D.circle(ctx, X0, Y0, 6, { fill: '--ink' });
        MC.text(ctx, 'bisagra', X0 + 4, Y0 + 26, { size: 11, color: '--ink-3' });
      }
      const ax = X0 + view.L(p.r) * Math.cos(s.rot), ay = Y0 - view.L(p.r) * Math.sin(s.rot);
      const Fdir = s.rot + phi;
      const kF = Math.min(0.9, 140 / Math.max(p.F, 1)) * 0.9;
      const fx = Math.cos(Fdir) * p.F * kF, fy = -Math.sin(Fdir) * p.F * kF;
      /* línea de acción y brazo de palanca */
      const L = 900;
      const ux = Math.cos(Fdir), uy = -Math.sin(Fdir);
      D.line(ctx, ax - ux * L, ay - uy * L, ax + ux * L, ay + uy * L, { color: '--force', dash: [3, 4], width: 1, alpha: 0.6 });
      const t0 = (X0 - ax) * ux + (Y0 - ay) * uy;
      const fxp = ax + ux * t0, fyp = ay + uy * t0;
      if (Math.abs(Math.sin(phi)) > 0.02) {
        D.line(ctx, X0, Y0, fxp, fyp, { color: '--accent', width: 2.2 });
        MC.text(ctx, 'r⊥', (X0 + fxp) / 2 + 6, (Y0 + fyp) / 2 - 6, { size: 13, math: true, color: '--accent', halo: true });
      }
      D.vec(ctx, X0, Y0, ax - X0, ay - Y0, { color: '--pos', label: 'r', width: 1.6, dash: [5, 3], size: 13 });
      D.vec(ctx, ax, ay, fx, fy, { color: '--force', label: 'F' });
      if (p.phi > 1 && p.phi < 179) D.angle(ctx, ax, ay, 26, s.rot, Fdir, { label: 'φ' });
      D.circle(ctx, ax, ay, 5, { fill: '--c8' });
      if (Math.abs(tau) > 0.01) D.arcArrow(ctx, X0, Y0, 40, 1.2, 1.2 + Math.sign(tau) * 1.3, { color: '--force', width: 2.4 });
      const ok = Math.abs(tau) >= p.need;
      sim.set('tau', `${f1(tau)} N·m`);
      sim.set('rp', `${f3(p.r * Math.sin(phi))} m`);
      sim.set('Fp', `${f1(p.F * Math.sin(phi))} N`);
      sim.set('dir', Math.abs(tau) < 1e-6 ? 'nulo' : tau > 0 ? 'antihorario ⊙' : 'horario ⊗');
      sim.set('res', ok ? `<span class="goodv">${p.mode === 'llave' ? 'afloja el tornillo' : 'abre la puerta'}</span>` : `<span class="warnv">no alcanza (${f0(p.need)} N·m)</span>`);
    });
  });

  /* ======================================================================
     11.2  Polea con masa: cubeta, Atwood y yoyo
     ====================================================================== */
  MC.defineSim('polea-masa', function (sim) {
    sim.cols2('1fr 1.25fr');
    const cv = sim.canvas({ aspect: 0.8 });
    const gc = sim.canvas({ aspect: 1.0 });
    const H = new MC.History(['v', 'w']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 2 });
    MC.hover(sim, gc, [gv]);
    const s = { d: 0, v: 0, th: 0 };
    let a = 0, T1 = 0, T2 = 0;
    sim.group('Montaje');
    sim.seg('mode', { options: [['pozo', 'Cubeta en un pozo'], ['atwood', 'Atwood con polea'], ['yoyo', 'Yoyo']], value: 'pozo', reset: true });
    sim.group('Polea o yoyo');
    sim.slider('M', { label: 'Masa de la polea / yoyo <i>M</i>', min: 0, max: 20, step: 0.1, value: 10, unit: 'kg', fmt: f1, reset: true });
    sim.slider('R', { label: 'Radio <i>R</i>', min: 0.05, max: 0.5, step: 0.01, value: 0.15, unit: 'm', fmt: f2, reset: true });
    sim.select('sh', { label: 'Forma', value: 'disco', options: [['disco', 'Disco macizo (½MR²)'], ['aro', 'Aro (MR²)']], reset: true });
    sim.slider('tf', { label: 'Torque de fricción del eje', min: 0, max: 5, step: 0.05, value: 0, unit: 'N·m', fmt: f2, reset: true });
    sim.slider('rr', { label: 'Radio del eje del yoyo <i>r</i>/<i>R</i>', min: 0.1, max: 1, step: 0.01, value: 0.25, fmt: f2, reset: true });
    sim.group('Masas colgantes');
    sim.slider('m', { label: 'Masa de la cubeta <i>m</i>', min: 0.1, max: 20, step: 0.1, value: 5, unit: 'kg', fmt: f1, reset: true });
    sim.slider('m1', { label: '<i>m</i>₁ (izquierda)', min: 0.1, max: 20, step: 0.1, value: 2, unit: 'kg', fmt: f1, reset: true });
    sim.slider('m2', { label: '<i>m</i>₂ (derecha)', min: 0.1, max: 20, step: 0.1, value: 2.5, unit: 'kg', fmt: f1, reset: true });
    sim.out('I', 'Momento de inercia <i>I</i>');
    sim.out('a', 'Aceleración lineal <i>a</i>', { hl: true });
    sim.out('al', 'Aceleración angular α = <i>a</i>/<i>R</i>');
    sim.out('T', 'Tensión (o tensiones)', { hl: true });
    sim.out('ai', 'Con polea sin masa sería');
    sim.presets([
      { id: 'pozo', label: 'Cubeta de 5 kg y cilindro de 10 kg', v: { mode: 'pozo', M: 10, R: 0.15, sh: 'disco', tf: 0, m: 5 }, note: 'a = 4.9 m/s² y T = 24.5 N.' },
      { id: 'sinmasa', label: 'Cilindro sin masa: caída libre', v: { mode: 'pozo', M: 0, R: 0.15, sh: 'disco', tf: 0, m: 5 } },
      { id: 'atwood', label: 'Atwood con polea de 1 kg', v: { mode: 'atwood', M: 1, R: 0.1, sh: 'disco', tf: 0, m1: 2, m2: 2.5 }, note: 'Las tensiones de los dos lados ya no son iguales: su diferencia hace girar la polea.' },
      { id: 'yoyo', label: 'Yoyo con eje delgado', v: { mode: 'yoyo', M: 0.1, R: 0.03, sh: 'disco', rr: 0.25 } }
    ]);
    const vis = () => { const m = sim.p.mode; sim.ctl.m.show(m === 'pozo'); sim.ctl.m1.show(m === 'atwood'); sim.ctl.m2.show(m === 'atwood'); sim.ctl.rr.show(m === 'yoyo'); sim.ctl.tf.show(m !== 'yoyo'); };
    sim.onChange = () => vis();
    vis();
    const Iof = () => (sim.p.sh === 'disco' ? 0.5 : 1) * sim.p.M * sim.p.R * sim.p.R;
    const solve = () => {
      const p = sim.p, I = Iof(), R = p.R;
      if (p.mode === 'pozo') {
        const drive = p.m * G - p.tf / R;
        a = drive > 0 ? drive / (p.m + I / (R * R)) : 0;
        T1 = p.m * (G - a); T2 = 0;
      } else if (p.mode === 'atwood') {
        const drive = (p.m2 - p.m1) * G;
        const net = Math.abs(drive) > p.tf / R ? drive - Math.sign(drive) * (p.tf / R) : 0;
        a = net / (p.m1 + p.m2 + I / (R * R));
        T1 = p.m1 * (G + a); T2 = p.m2 * (G - a);
      } else {
        const r = p.rr * R, Iy = Math.max(1e-9, I);
        a = G / (1 + Iy / (Math.max(p.M, 1e-6) * r * r));
        T1 = Math.max(p.M, 1e-6) * (G - a); T2 = 0;
      }
    };
    sim.run({
      reset() { vis(); s.d = 0; s.v = 0; s.th = 0; solve(); H.clear(); H.push(0, { v: 0, w: 0 }, true); },
      step(h) {
        solve();
        s.v += a * h; s.d += s.v * h;
        const p = sim.p;
        const rr = p.mode === 'yoyo' ? p.rr * p.R : p.R;
        s.th += (s.v / rr) * h;
        H.push(sim.t + h, { v: s.v, w: s.v / rr });
        const lim = p.mode === 'atwood' ? 1.6 : 3.0;
        if (Math.abs(s.d) > lim || sim.t > 20) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const view = new MC.View2D(cv, { xmin: -1.2, xmax: 1.2, ymin: -3.6, ymax: 0.6 });
      view.grid({ labels: false });
      const I = Iof();
      const Rp = Math.max(18, Math.min(60, view.L(p.R * 2.5)));
      const X = view.X(0), Y = view.Y(0);
      if (p.mode === 'pozo') {
        D.ceiling(ctx, X - 70, Y - Rp - 18, X + 70);
        D.line(ctx, X, Y - Rp - 18, X, Y, { color: '--ink-2', width: 3 });
        MC.wheel(ctx, X, Y, Rp, -s.th, {});
        const by = view.Y(-0.5 - s.d);
        D.rope(ctx, [[X + Rp, Y], [X + Rp, by]]);
        ctx.save();
        ctx.fillStyle = MC.col('--c1');
        ctx.beginPath(); ctx.moveTo(X + Rp - 16, by); ctx.lineTo(X + Rp + 16, by); ctx.lineTo(X + Rp + 12, by + 30); ctx.lineTo(X + Rp - 12, by + 30); ctx.closePath(); ctx.fill();
        ctx.restore();
        const kw = 60 / (p.m * G);
        D.vec(ctx, X + Rp + 26, by + 15, 0, p.m * G * kw, { color: '--weight', label: 'mg', size: 12 });
        if (T1 > 0.01) D.vec(ctx, X + Rp + 40, by + 15, 0, -T1 * kw, { color: '--tension', label: 'T', size: 12 });
      } else if (p.mode === 'atwood') {
        D.ceiling(ctx, X - 70, Y - Rp - 18, X + 70);
        D.line(ctx, X, Y - Rp - 18, X, Y, { color: '--ink-2', width: 3 });
        MC.wheel(ctx, X, Y, Rp, s.th, {});
        const y1 = view.Y(-1.8 + s.d), y2 = view.Y(-1.8 - s.d);
        D.rope(ctx, [[X - Rp, Y], [X - Rp, y1]]);
        D.rope(ctx, [[X + Rp, Y], [X + Rp, y2]]);
        D.block(ctx, X - Rp, y1 + 14, 30, 28, { fill: '--c1', label: 'm₁' });
        D.block(ctx, X + Rp, y2 + 14, 30, 28, { fill: '--c4', label: 'm₂' });
        MC.text(ctx, `T₁ = ${f1(T1)} N`, X - Rp - 22, (Y + y1) / 2, { size: 12, mono: true, align: 'right', color: '--tension', halo: true });
        MC.text(ctx, `T₂ = ${f1(T2)} N`, X + Rp + 22, (Y + y2) / 2, { size: 12, mono: true, color: '--tension', halo: true });
      } else {
        D.ceiling(ctx, X - 60, view.Y(0.5), X + 60);
        const r = p.rr * Rp;
        const yy = view.Y(0.3 - s.d * 0.9);
        D.rope(ctx, [[X - r, view.Y(0.5)], [X - r, yy]]);
        MC.wheel(ctx, X, yy, Rp, s.th, { fill: '--c8' });
        D.circle(ctx, X, yy, r, { color: '--ink', width: 1.5 });
      }
      /* barras de energía */
      let Kt, Kr, Ug;
      const rr = p.mode === 'yoyo' ? p.rr * p.R : p.R;
      const w = s.v / rr;
      if (p.mode === 'pozo') { Kt = 0.5 * p.m * s.v * s.v; Kr = 0.5 * I * w * w; Ug = -p.m * G * s.d; }
      else if (p.mode === 'atwood') { Kt = 0.5 * (p.m1 + p.m2) * s.v * s.v; Kr = 0.5 * I * w * w; Ug = (p.m1 - p.m2) * G * s.d; }
      else { Kt = 0.5 * p.M * s.v * s.v; Kr = 0.5 * I * w * w; Ug = -p.M * G * s.d; }
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h * 0.5, mb: 30 }, H, { t: sim.t });
      const Etot = Kt + Kr;
      D.bars(gctx, [{ label: 'K_{tras}', value: Kt, color: '--K' }, { label: 'K_{rot}', value: Kr, color: '--Ue' }, { label: '−ΔU', value: -Ug, color: '--Ug' }], { x: 8, y: gc.h * 0.52, w: gc.w - 16, h: gc.h * 0.46, title: 'ENERGÍA (J)', max: MC.niceCeil(Math.max(1, -Ug, Etot) * 1.05), fmt: (v) => MC.fix(v, 2) });
      const ai = p.mode === 'pozo' ? G : p.mode === 'atwood' ? ((p.m2 - p.m1) * G) / (p.m1 + p.m2) : G;
      sim.set('I', `${MC.sci(I, 3)} kg·m²`);
      sim.set('a', `${f3(a)} m/s²`);
      sim.set('al', `${f2(a / rr)} rad/s²`);
      sim.set('T', p.mode === 'atwood' ? `${f2(T1)} N y ${f2(T2)} N` : `${f2(T1)} N`);
      sim.set('ai', `${f3(ai)} m/s²`);
    });
  });

  /* ======================================================================
     11.4  Bola que desliza hasta rodar
     ====================================================================== */
  const BALLS = { esfs: ['Esfera sólida (2/5)', 0.4], esfh: ['Esfera hueca (2/3)', 2 / 3], disco: ['Cilindro sólido (1/2)', 0.5], aro: ['Aro (1)', 1] };
  MC.defineSim('bola-boliche', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const H = new MC.History(['v', 'wR', 'Kt', 'Kr', 'Th']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }, { key: 'wR', label: 'ωR', unit: 'm/s', color: '--c5', fmt: f2 }], legend: 'tr', tspan: 2 });
    const gE = new MC.TGraph({ ylabel: ['E', 'J'], series: [{ key: 'Kt', label: 'K_tras', unit: 'J', color: '--K', fmt: f1 }, { key: 'Kr', label: 'K_rot', unit: 'J', color: '--Ue', fmt: f1 }, { key: 'Th', label: 'E_tér', unit: 'J', color: '--Eth', fmt: f1 }], legend: 'tr', tspan: 2 });
    MC.hover(sim, gc, [gv, gE]);
    const s = { x: 0, v: 0, w: 0, phi: 0, Th: 0, roll: false, tr: null };
    sim.group('Lanzamiento');
    sim.slider('v0', { label: 'Velocidad inicial <i>v</i>₀', min: 0, max: 10, step: 0.1, value: 8, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('w0', { label: 'Efecto inicial ω₀<i>R</i> (+ hacia adelante)', min: -10, max: 10, step: 0.1, value: 0, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('mu', { label: 'Fricción cinética μ<sub>k</sub>', min: 0.02, max: 0.6, step: 0.01, value: 0.2, fmt: f2, reset: true });
    sim.select('sh', { label: 'Forma', value: 'esfs', options: Object.keys(BALLS).map((k) => [k, BALLS[k][0]]), reset: true });
    sim.slider('m', { label: 'Masa', min: 0.1, max: 8, step: 0.1, value: 7, unit: 'kg', fmt: f1, reset: true });
    sim.out('vf', 'Velocidad al empezar a rodar', { hl: true });
    sim.out('tr', 'Tiempo deslizando');
    sim.out('vc', 'Velocidad del punto de contacto <i>v</i> − ω<i>R</i>');
    sim.out('Th', 'Energía disipada', { hl: true });
    sim.out('fr', 'Fracción de <i>K</i>₀ disipada');
    sim.presets([
      { id: 'boliche', label: 'Bola de boliche lanzada sin giro', v: { v0: 8, w0: 0, mu: 0.2, sh: 'esfs', m: 7 }, note: 'Termina rodando a 5/7 de la velocidad inicial: 5.7 m/s.' },
      { id: 'retroceso', label: 'Billar con efecto de retroceso', v: { v0: 2, w0: -5, mu: 0.2, sh: 'esfs', m: 0.17 }, note: 'La fricción frena la bola, la detiene y la hace regresar.' },
      { id: 'adelante', label: 'Billar con efecto hacia adelante', v: { v0: 1.5, w0: 5, mu: 0.2, sh: 'esfs', m: 0.17 } },
      { id: 'rodando', label: 'Lanzada ya rodando (ω₀R = v₀)', v: { v0: 3, w0: 3, mu: 0.2, sh: 'esfs', m: 7 }, note: 'No hay deslizamiento: la fricción cinética no actúa.' }
    ]);
    const beta = () => BALLS[sim.p.sh][1];
    sim.run({
      startLabel: 'Lanzar',
      reset() { s.x = 0; s.v = sim.p.v0; s.w = sim.p.w0; s.phi = 0; s.Th = 0; s.roll = Math.abs(s.v - s.w) < 1e-6; s.tr = s.roll ? 0 : null; H.clear(); push(0); },
      step(h) {
        const p = sim.p, b = beta();
        if (!s.roll) {
          const sl = s.v - s.w;
          const f = -Math.sign(sl) * p.mu * G;
          const vn = s.v + f * h;
          const wn = s.w - (f * h) / b;
          if (Math.sign(vn - wn) !== Math.sign(sl)) {
            const vf = (s.v + b * s.w) / (1 + b);
            s.Th += 0.5 * p.m * (s.v * s.v + b * s.w * s.w) - 0.5 * p.m * (1 + b) * vf * vf;
            s.v = vf; s.w = vf; s.roll = true; s.tr = sim.t + h;
          } else {
            const K0 = 0.5 * p.m * (s.v * s.v + b * s.w * s.w);
            s.v = vn; s.w = wn;
            s.Th += K0 - 0.5 * p.m * (s.v * s.v + b * s.w * s.w);
          }
        }
        s.x += s.v * h;
        s.phi -= (s.w * h) / 0.12;
        push(sim.t + h);
        if (sim.t > (s.roll ? (s.tr || 0) + 1.5 : 30)) sim.end();
      },
      h: 1 / 1000
    });
    function push(t) { const p = sim.p, b = beta(); H.push(t, { v: s.v, wR: s.w, Kt: 0.5 * p.m * s.v * s.v, Kr: 0.5 * p.m * b * s.w * s.w, Th: s.Th }); }
    sim.onDraw(() => {
      const p = sim.p, b = beta(), ctx = cv.ctx;
      D.clear(cv);
      const view = new MC.View2D(cv, { xmin: s.x - 4, xmax: s.x + 6, ymin: -0.5, ymax: 1.3 });
      ctx.fillStyle = MC.alpha('--wood', 0.5);
      ctx.fillRect(0, view.Y(0), cv.w, 14);
      MC.floorRuler(ctx, view, cv, 0, { fill: false });
      const R = 0.25;
      const X = view.X(s.x), Y = view.Y(R);
      D.ball(ctx, X, Y, view.L(R), { fill: '--c1', mark: s.phi });
      D.vec(ctx, X, Y, s.v * 16, 0, { color: '--vel', label: 'v', minLen: 3 });
      const vc = s.v - s.w;
      if (Math.abs(vc) > 0.02) D.vec(ctx, X, view.Y(0) - 2, vc * 16, 0, { color: '--c8', label: 'v_{contacto}', size: 12, width: 1.8 });
      if (!s.roll) D.vec(ctx, X, view.Y(0) + 6, -Math.sign(vc) * 40, 0, { color: '--fric', label: 'f', size: 12 });
      if (Math.abs(s.w) > 0.02) D.arcArrow(ctx, X, Y, view.L(R) + 10, s.w > 0 ? 2 : 1, s.w > 0 ? 1 : 2, { color: '--c5', width: 2 });
      MC.text(ctx, s.roll ? 'rodando sin deslizar' : 'deslizando', 10, 18, { size: 12.5, weight: 700, color: s.roll ? '--vel' : '--fric' });
      const gctx = gc.ctx;
      D.clear(gc);
      const vf = (p.v0 + b * p.w0) / (1 + b);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t, after: (P) => P.hline(vf, { color: '--ink-3', dash: [4, 4], label: 'v final', labelRight: true }) });
      gE.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      const K0 = 0.5 * p.m * (p.v0 * p.v0 + b * p.w0 * p.w0);
      const Kf = 0.5 * p.m * (1 + b) * vf * vf;
      sim.set('vf', `${f2(vf)} m/s`);
      sim.set('tr', `${f2(Math.abs(p.v0 - p.w0) / (p.mu * G * (1 + 1 / b)))} s`);
      sim.set('vc', `${f2(vc)} m/s`);
      sim.set('Th', `${f1(s.Th)} J (total ${f1(K0 - Kf)} J)`);
      sim.set('fr', K0 > 0 ? `${f1((100 * (K0 - Kf)) / K0)} %` : '—');
    });
  });

  /* ======================================================================
     11.4b  Rueda que rueda: velocidades y cicloide
     ====================================================================== */
  MC.defineSim('cicloide', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const s = { x: 0, trail: [] };
    sim.group('Rueda');
    sim.slider('v', { label: 'Velocidad del centro <i>v</i>', min: 0.3, max: 4, step: 0.1, value: 1.2, unit: 'm/s', fmt: f1 });
    sim.slider('R', { label: 'Radio <i>R</i>', min: 0.3, max: 1, step: 0.01, value: 0.6, unit: 'm', fmt: f2, reset: true });
    sim.slider('f', { label: 'Punto marcado a <i>r</i>/<i>R</i>', min: 0, max: 1.5, step: 0.01, value: 1, fmt: f2, reset: true });
    sim.seg('frame', { label: 'Marco de referencia', options: [['suelo', 'Suelo'], ['cm', 'Centro de la rueda']], value: 'suelo' });
    sim.check('vecs', { label: 'Velocidades de puntos del borde', value: true });
    sim.check('cir', { label: 'Centro instantáneo de rotación', value: true });
    sim.out('w', 'Rapidez angular ω = <i>v</i>/<i>R</i>');
    sim.out('vt', 'Punto más alto', { hl: true });
    sim.out('vc', 'Punto de contacto', { hl: true });
    sim.out('vp', 'Punto marcado (ahora)');
    sim.presets([
      { id: 'cicloide', label: 'Punto del borde: cicloide', v: { f: 1, v: 1.2, R: 0.6 } },
      { id: 'valvula', label: 'Válvula de la llanta (r = 0.8R)', v: { f: 0.8, v: 1.2, R: 0.6 } },
      { id: 'tren', label: 'Pestaña de la rueda de un tren (r = 1.2R)', v: { f: 1.2, v: 1.2, R: 0.6 }, note: 'Por debajo del riel, la pestaña se mueve hacia atrás un instante.' }
    ]);
    sim.run({
      reset() { s.x = 0; s.trail = []; },
      step(h) {
        s.x += sim.p.v * h;
        const R = sim.p.R, th = -s.x / R;
        const r = sim.p.f * R;
        if (Math.floor((sim.t + h) / 0.02) > Math.floor(sim.t / 0.02)) s.trail.push([s.x + r * Math.cos(th - Math.PI / 2), R + r * Math.sin(th - Math.PI / 2)]);
        if (s.trail.length > 2000) s.trail.shift();
        if (sim.t > 120) sim.end();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, R = p.R;
      D.clear(cv);
      const cm = p.frame === 'cm';
      const camX = s.x;
      const view = new MC.View2D(cv, { xmin: camX - 3.2, xmax: camX + 2.2, ymin: -0.35, ymax: 1.9 });
      MC.floorRuler(ctx, view, cv, 0);
      const th = -s.x / R;
      const X = view.X(s.x), Y = view.Y(R), Rp = view.L(R);
      /* trayectoria del punto */
      D.poly(ctx, s.trail.map((q) => [view.X(q[0] - (cm ? 0 : 0)), view.Y(q[1])]), { color: '--c8', width: 2 });
      MC.wheel(ctx, X, Y, Rp, th, { fill: '--metal' });
      const r = p.f * R;
      const mx = X + view.L(r) * Math.cos(th - Math.PI / 2), my = Y - view.L(r) * Math.sin(th - Math.PI / 2);
      D.circle(ctx, mx, my, 6, { fill: '--c8', color: '--canvas', width: 2 });
      const w = p.v / R;
      const k = view.L(0.18);
      const velAt = (ang, rad) => {
        /* velocidad de un punto a radio rad y ángulo ang (desde el centro), en el marco elegido */
        const ox = rad * Math.cos(ang), oy = rad * Math.sin(ang);
        const vx = (cm ? 0 : p.v) + w * oy, vy = -w * ox;
        return [vx, vy];
      };
      if (p.vecs) {
        for (let i = 0; i < 8; i++) {
          const ang = th + (i * Math.PI) / 4;
          const px = X + Rp * Math.cos(ang), py = Y - Rp * Math.sin(ang);
          const [vx, vy] = velAt(ang, R);
          D.vec(ctx, px, py, vx * k, -vy * k, { color: '--vel', width: 1.8, minLen: 2 });
        }
        const [cvx] = [cm ? 0 : p.v];
        if (cvx > 0) D.vec(ctx, X, Y, cvx * k, 0, { color: '--vel', label: 'v', width: 2.4 });
        const [vxm, vym] = velAt(th - Math.PI / 2, r);
        D.vec(ctx, mx, my, vxm * k, -vym * k, { color: '--c8', width: 2.4, minLen: 2 });
      }
      if (p.cir && !cm) {
        const cx = X, cy = view.Y(0);
        D.circle(ctx, cx, cy, 5, { fill: '--accent' });
        MC.text(ctx, 'centro instantáneo', cx + 8, cy + 18, { size: 11, color: '--accent', halo: true });
        for (let i = 0; i < 8; i++) {
          const ang = th + (i * Math.PI) / 4;
          D.line(ctx, cx, cy, X + Rp * Math.cos(ang), Y - Rp * Math.sin(ang), { color: '--accent', width: 1, dash: [2, 4], alpha: 0.5 });
        }
      }
      const [vxm, vym] = velAt(th - Math.PI / 2, r);
      sim.set('w', `${f2(w)} rad/s`);
      sim.set('vt', cm ? `${f2(p.v)} m/s (hacia atrás)` : `${f2(2 * p.v)} m/s = 2v`);
      sim.set('vc', cm ? `${f2(p.v)} m/s (hacia adelante)` : '0 m/s (reposo instantáneo)');
      sim.set('vp', `${f2(Math.hypot(vxm, vym))} m/s`);
    });
  });
})();
