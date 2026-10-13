/* Capítulo 5 — Las leyes de Newton */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2);
  const G = 9.8;

  /* Regla horizontal que sigue a la cámara: marcas cada metro */
  function floorRuler(ctx, view, cv, yWorld, o = {}) {
    const Y = view.Y(yWorld);
    D.ground(ctx, 0, Y, cv.w, { depth: 14, fill: o.fill });
    const step = MC.niceStep(view.x1 - view.x0, Math.max(4, cv.w / 70));
    const fmt = MC.tickFmt(step);
    for (let x = Math.ceil(view.x0 / step) * step; x <= view.x1; x += step) {
      const X = view.X(x);
      D.line(ctx, X, Y + 1, X, Y + 7, { color: '--ink-2', width: 1.2 });
      MC.text(ctx, fmt(x), X, Y + 26, { size: 10.5, mono: true, align: 'center', color: '--ink-3' });
    }
    MC.text(ctx, 'x (m)', cv.w - 6, Y + 38, { size: 10.5, mono: true, align: 'right', color: '--ink-3' });
  }
  MC.floorRuler = floorRuler;

  /* ======================================================================
     5.2  Inercia: el disco que se desliza
     ====================================================================== */
  const SURF = { sin: ['Sin fricción (ideal)', 0], hielo: ['Hielo (μ = 0.02)', 0.02], madera: ['Madera pulida (μ = 0.10)', 0.10], concreto: ['Concreto (μ = 0.35)', 0.35], alfombra: ['Alfombra (μ = 0.60)', 0.60] };
  MC.defineSim('inercia', function (sim) {
    const cv = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const view = new MC.View2D(cv, { xmin: -2, xmax: 14, ymin: -1.3, ymax: 2.2 });
    const H = new MC.History(['v', 'x']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 8 });
    const gx = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--pos', fmt: f2 }], legend: false, tspan: 8 });
    MC.hover(sim, gc, [gv, gx]);
    const s = { x: 0, v: 0, push: 0, stopT: null };
    sim.group('Superficie');
    sim.select('surf', { label: 'Material', value: 'hielo', options: Object.keys(SURF).map((k) => [k, SURF[k][0]]), reset: true });
    sim.group('Disco y empujón');
    sim.slider('m', { label: 'Masa del disco <i>m</i>', min: 0.1, max: 10, step: 0.1, value: 0.17, unit: 'kg', fmt: f2, reset: true });
    sim.slider('F', { label: 'Fuerza del empujón <i>F</i>', min: 0.5, max: 60, step: 0.5, value: 6, unit: 'N', fmt: f1, reset: true });
    sim.slider('dt', { label: 'Duración del empujón', min: 0.05, max: 1, step: 0.05, value: 0.3, unit: 's', fmt: f2, reset: true });
    sim.button('Otro empujón', () => { if (sim.ended) return; s.push = sim.p.dt; if (!sim.playing) sim.play(); }, { icon: 'play' });
    sim.out('v', 'Velocidad <i>v</i>', { hl: true });
    sim.out('a', 'Aceleración <i>a</i>');
    sim.out('fn', 'Fuerza neta');
    sim.out('x', 'Posición <i>x</i>');
    sim.out('d', 'Distancia de frenado prevista');
    sim.presets([
      { id: 'hockey', label: 'Disco de hockey sobre hielo', v: { surf: 'hielo', m: 0.17, F: 6, dt: 0.3 } },
      { id: 'ideal', label: 'Superficie sin fricción', v: { surf: 'sin', m: 0.17, F: 6, dt: 0.3 }, note: 'Después del empujón, la velocidad ya no cambia: la gráfica v(t) queda horizontal.' },
      { id: 'masa', label: 'Disco diez veces más pesado (mismo impulso por kg)', v: { surf: 'madera', m: 1.7, F: 60, dt: 0.3 }, note: 'La distancia de frenado d = v²/(2μg) no depende de la masa.' },
      { id: 'alfombra', label: 'Sobre una alfombra', v: { surf: 'alfombra', m: 0.17, F: 6, dt: 0.3 } }
    ]);
    const mu = () => SURF[sim.p.surf][1];
    sim.run({
      reset() { s.x = 0; s.v = 0; s.push = sim.p.dt; s.stopT = null; H.clear(); H.push(0, s, true); },
      step(h) {
        const m = sim.p.m, fmax = mu() * m * G;
        let F = s.push > 0 ? sim.p.F : 0;
        let f = 0;
        if (Math.abs(s.v) > 1e-9) f = -Math.sign(s.v) * fmax;
        else if (Math.abs(F) <= fmax) f = -F;
        else f = -Math.sign(F) * fmax;
        const a = (F + f) / m;
        let vn = s.v + a * h;
        if (s.v > 0 && vn < 0 && F === 0) vn = 0;
        s.x += 0.5 * (s.v + vn) * h;
        s.v = vn;
        s.a = a;
        s.push = Math.max(0, s.push - h);
        const t = sim.t + h;
        H.push(t, s);
        if (s.v === 0 && s.push === 0 && s.stopT === null && t > 0.05) s.stopT = t;
        if ((s.stopT !== null && t > s.stopT + 0.8) || t > 30) { H.push(t, s, true); sim.end(); }
      }
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.setRange({ xmin: s.x - 5, xmax: s.x + 11 });
      const ctx = cv.ctx;
      D.clear(cv);
      ctx.fillStyle = MC.alpha(p.surf === 'hielo' || p.surf === 'sin' ? '--water' : '--ground-fill', p.surf === 'hielo' || p.surf === 'sin' ? 0.18 : 0.6);
      ctx.fillRect(0, view.Y(0), cv.w, 16);
      floorRuler(ctx, view, cv, 0);
      const X = view.X(s.x), Y = view.Y(0);
      const r = view.L(0.38);
      /* disco visto de lado */
      ctx.save();
      ctx.fillStyle = MC.col('--tire');
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(X - r, Y - r * 0.55, 2 * r, r * 0.55, 3); ctx.fill(); } else ctx.fillRect(X - r, Y - r * 0.55, 2 * r, r * 0.55);
      ctx.restore();
      const F = s.push > 0 ? p.F : 0;
      const m = p.m, fmax = mu() * m * G;
      const f = Math.abs(s.v) > 1e-9 ? -Math.sign(s.v) * fmax : (Math.abs(F) <= fmax ? -F : -Math.sign(F) * fmax);
      const kf = 70 / Math.max(p.F, fmax, 1);
      if (F) D.vec(ctx, X - r - 4, Y - r * 0.3, F * kf, 0, { color: '--force', label: 'F' });
      if (Math.abs(f) > 1e-9) D.vec(ctx, X, Y + 3, f * kf, 0, { color: '--fric', label: 'f' });
      D.vec(ctx, X, Y - r * 0.6 - 10, s.v * 12, 0, { color: '--vel', label: 'v', minLen: 3 });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      gx.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      const vPush = Math.max(0, ((p.F - fmax) / m) * p.dt);
      sim.set('v', `${f2(s.v)} m/s`);
      sim.set('a', `${f2(s.a || 0)} m/s²`);
      sim.set('fn', `${f2(F + f)} N`);
      sim.set('x', `${f2(s.x)} m`);
      sim.set('d', mu() > 0 ? `${f2((vPush * vPush) / (2 * mu() * G))} m tras el empujón` : '∞ (nunca se detiene)');
    });
  });

  /* ======================================================================
     5.3  Segunda ley: carrito, fuerza y experimento a vs F
     ====================================================================== */
  MC.defineSim('segunda-ley', function (sim) {
    const cv = sim.canvas({ aspect: 3.0, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.3 });
    const view = new MC.View2D(cv, { xmin: -4, xmax: 12, ymin: -1.3, ymax: 2.6 });
    const H = new MC.History(['v', 'a']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 10 });
    MC.hover(sim, gc, [gv]);
    const s = { x: 0, v: 0, a: 0, f: 0 };
    const data = [];
    let AP = null;
    sim.group('Fuerzas (se pueden cambiar en marcha)');
    sim.slider('F', { label: 'Fuerza aplicada <i>F</i>', min: -150, max: 150, step: 1, value: 40, unit: 'N', fmt: (v) => MC.fix(v, 0) });
    sim.slider('mu', { label: 'Coeficiente de fricción μ', min: 0, max: 0.5, step: 0.01, value: 0, fmt: f2 });
    sim.group('Carrito');
    sim.slider('m', { label: 'Masa total <i>m</i>', min: 0.5, max: 50, step: 0.5, value: 10, unit: 'kg', fmt: f1 });
    sim.check('fbd', { label: 'Diagrama de cuerpo libre', value: true });
    sim.group('Experimento');
    sim.button('Registrar punto (F neta, a)', () => { data.push({ F: s.Fn, a: s.a, m: sim.p.m }); }, { primary: true });
    sim.button('Borrar datos', () => { data.length = 0; });
    sim.out('Fa', 'Fuerza aplicada');
    sim.out('f', 'Fricción');
    sim.out('Fn', 'Fuerza neta Σ<i>F</i>', { hl: true });
    sim.out('a', 'Aceleración <i>a</i> = Σ<i>F</i>/<i>m</i>', { hl: true });
    sim.out('v', 'Velocidad <i>v</i>');
    sim.out('n', 'Puntos registrados');
    sim.presets([
      { id: 'caja', label: 'Empujar una caja de 25 kg (100 N contra 60 N de fricción)', v: { F: 100, mu: 0.245, m: 25 }, note: 'Fuerza neta 40 N: la aceleración es 1.6 m/s².' },
      { id: 'mercado', label: 'Carrito de supermercado (20 kg) empujado con 30 N', v: { F: 30, mu: 0.05, m: 20 } },
      { id: 'doble', label: 'Misma fuerza, doble masa', v: { F: 40, mu: 0, m: 20 }, note: 'Compare con 40 N sobre 10 kg: la aceleración es la mitad.' },
      { id: 'noalcanza', label: 'Fuerza menor que la fricción máxima', v: { F: 30, mu: 0.4, m: 10 }, note: 'La fricción estática se ajusta a 30 N: la fuerza neta es cero y el carrito no se mueve.' }
    ]);
    const forces = () => {
      const p = sim.p, fmax = p.mu * p.m * G;
      let f;
      if (Math.abs(s.v) > 1e-6) f = -Math.sign(s.v) * fmax;
      else if (Math.abs(p.F) <= fmax) f = -p.F;
      else f = -Math.sign(p.F) * fmax;
      return f;
    };
    sim.run({
      reset() { s.x = 0; s.v = 0; s.f = forces(); s.Fn = sim.p.F + s.f; s.a = s.Fn / sim.p.m; H.clear(); H.push(0, s, true); },
      step(h) {
        const p = sim.p;
        s.f = forces();
        s.Fn = p.F + s.f;
        s.a = s.Fn / p.m;
        let vn = s.v + s.a * h;
        if (s.v !== 0 && vn * s.v < 0 && Math.abs(p.F) <= p.mu * p.m * G) vn = 0;
        s.x += 0.5 * (s.v + vn) * h;
        s.v = vn;
        H.push(sim.t + h, s);
        if (sim.t > 40) sim.end();
      }
    });
    sim.onChange = () => { if (!sim.playing) { s.f = forces(); s.Fn = sim.p.F + s.f; s.a = s.Fn / sim.p.m; } };
    sim.onDraw(() => {
      const p = sim.p;
      view.setRange({ xmin: s.x - 6, xmax: s.x + 10 });
      const ctx = cv.ctx;
      D.clear(cv);
      floorRuler(ctx, view, cv, 0);
      const X = view.X(s.x), Y = view.Y(0);
      /* carrito con pesas según la masa */
      const w = view.L(1.4), h = view.L(0.45);
      D.block(ctx, X, Y - h / 2 - view.L(0.18), w, h, { fill: '--body-b' });
      for (const dx of [-0.45, 0.45]) { D.circle(ctx, X + view.L(dx), Y - view.L(0.12), view.L(0.12), { fill: '--tire' }); }
      const nb = Math.min(8, Math.round(p.m / 6.25));
      for (let i = 0; i < nb; i++) D.block(ctx, X - w / 2 + view.L(0.18) + (i % 4) * view.L(0.33), Y - h - view.L(0.34) - Math.floor(i / 4) * view.L(0.22), view.L(0.28), view.L(0.2), { fill: '--metal', r: 2 });
      MC.text(ctx, `${f1(p.m)} kg`, X, Y - h / 2 - view.L(0.18) + 4, { size: 12, align: 'center', weight: 600, color: '--body-ink' });
      const kf = 110 / 150;
      const yF = Y - h / 2 - view.L(0.18);
      if (Math.abs(p.F) > 0.5) D.vec(ctx, p.F > 0 ? X - w / 2 - p.F * kf : X + w / 2 - p.F * kf, yF, p.F * kf, 0, { color: '--force', label: 'F' });
      if (Math.abs(s.f) > 0.5) D.vec(ctx, X, Y - 2, s.f * kf, 0, { color: '--fric', label: 'f' });
      D.vec(ctx, X, Y - h - view.L(0.8), s.Fn * kf, 0, { color: '--fnet', label: 'ΣF', dash: [6, 4], width: 2, minLen: 3 });
      D.vec(ctx, X, Y - h - view.L(1.25), s.v * 14, 0, { color: '--vel', label: 'v', minLen: 3 });
      if (p.fbd) {
        D.fbd(ctx, [
          { fx: 0, fy: -p.m * G, color: '--weight', label: 'w' },
          { fx: 0, fy: p.m * G, color: '--normal', label: 'n' },
          { fx: p.F, fy: 0, color: '--force', label: 'F' },
          { fx: s.f, fy: 0, color: '--fric', label: 'f', side: -1 }
        ], { x: cv.w - 150, y: 6, w: 144, h: cv.h - 12, shape: 'block', title: 'DCL' });
      }
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w * 0.5, h: gc.h, mb: 34 }, H, { t: sim.t });
      const Fm = 160, am = MC.niceCeil(Math.max(2, ...data.map((d) => Math.abs(d.a)), Math.abs(s.a)) * 1.1);
      AP = AP || new MC.Plot(gctx);
      AP.ctx = gctx;
      AP.set({ x: gc.w * 0.5, y: 0, w: gc.w * 0.5, h: gc.h, xmin: -Fm, xmax: Fm, ymin: -am, ymax: am, xlabel: ['ΣF', 'N'], ylabel: ['a', 'm/s²'], mt: 22, title: 'Experimento: a contra ΣF', mb: 34 });
      AP.frame();
      AP.fn((F) => F / p.m, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      AP.label(Fm * 0.45, (Fm * 0.45) / p.m, `pendiente 1/m = ${MC.fix(1 / p.m, 3)}`, { dy: -8, size: 11, color: '--ink-2' });
      const masses = [...new Set(data.map((d) => d.m))];
      data.forEach((d) => AP.dot(d.F, d.a, { color: ['--c1', '--c4', '--c5', '--c3', '--c8'][masses.indexOf(d.m) % 5], r: 4 }));
      AP.dot(s.Fn, s.a, { color: '--accent', r: 3, noclip: false });
      sim.set('Fa', `${MC.fix(p.F, 0)} N`);
      sim.set('f', `${f1(s.f)} N`);
      sim.set('Fn', `${f1(s.Fn)} N`);
      sim.set('a', `${MC.fix(s.a, 3)} m/s²`);
      sim.set('v', `${f2(s.v)} m/s`);
      sim.set('n', String(data.length));
    });
  });

  /* ======================================================================
     5.4  La báscula en el ascensor
     ====================================================================== */
  MC.defineSim('ascensor', function (sim) {
    sim.cols2('1fr 1.35fr');
    const cv = sim.canvas({ aspect: 0.7 });
    const gc = sim.canvas({ aspect: 0.95 });
    const view = new MC.View2D(cv, { xmin: -3, xmax: 3, ymin: -4, ymax: 5 });
    const H = new MC.History(['a', 'v', 'n']);
    const gA = new MC.TGraph({ ylabel: ['a_y', 'm/s²'], series: [{ key: 'a', label: 'a_y', unit: 'm/s²', color: '--acc', fmt: f2 }], legend: false, minSpan: 4 });
    const gV = new MC.TGraph({ ylabel: ['v_y', 'm/s'], series: [{ key: 'v', label: 'v_y', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, minSpan: 2 });
    const gN = new MC.TGraph({ ylabel: ['n', 'N'], series: [{ key: 'n', label: 'n', unit: 'N', color: '--normal', fmt: f1 }], legend: false });
    MC.hover(sim, gc, [gA, gV, gN]);
    const s = { y: 0, v: 0, a: 0, n: 0 };
    let phases = [], Ttot = 10;
    sim.group('Pasajero');
    sim.slider('m', { label: 'Masa de la persona <i>m</i>', min: 20, max: 150, step: 1, value: 60, unit: 'kg', fmt: (v) => MC.fix(v, 0) });
    sim.group('Viaje del ascensor');
    sim.seg('perfil', { options: [['sube', 'Sube'], ['baja', 'Baja'], ['caida', 'Cable roto']], value: 'sube', reset: true });
    sim.slider('a', { label: 'Aceleración al arrancar y frenar', min: 0.2, max: 3, step: 0.1, value: 1.5, unit: 'm/s²', fmt: f1, reset: true });
    sim.slider('vmax', { label: 'Rapidez de crucero', min: 0.5, max: 6, step: 0.1, value: 3, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('tc', { label: 'Tiempo a velocidad constante', min: 0.5, max: 8, step: 0.5, value: 3, unit: 's', fmt: f1, reset: true });
    sim.out('ay', 'Aceleración <i>a<sub>y</sub></i>');
    sim.out('vy', 'Velocidad <i>v<sub>y</sub></i>');
    sim.out('n', 'Normal <i>n</i> = <i>m</i>(<i>g</i> + <i>a<sub>y</sub></i>)', { hl: true });
    sim.out('w', 'Peso real <i>mg</i>');
    sim.out('kg', 'La báscula muestra', { hl: true });
    sim.out('feel', 'Sensación');
    sim.presets([
      { id: 'sube', label: 'Subir: arranca, viaja y frena', v: { perfil: 'sube', m: 60, a: 1.5, vmax: 3, tc: 3 }, note: 'Al arrancar marca 69.2 kg; a velocidad constante, 60 kg; al frenar, 50.8 kg.' },
      { id: 'baja', label: 'Bajar', v: { perfil: 'baja', m: 60, a: 1.5, vmax: 3, tc: 3 } },
      { id: 'caida', label: 'Cable roto y freno de emergencia', v: { perfil: 'caida', m: 60, a: 1.5, vmax: 3, tc: 3 }, note: 'Durante la caída libre la báscula marca cero; el freno de emergencia la hace marcar el triple del peso.' },
      { id: 'rascacielos', label: 'Ascensor de rascacielos (6 m/s)', v: { perfil: 'sube', m: 70, a: 1.2, vmax: 6, tc: 6 } }
    ]);
    function build() {
      const p = sim.p;
      phases = [{ t: 1, a: 0 }];
      if (p.perfil === 'caida') { phases.push({ t: 1.4, a: -G }, { t: (G * 1.4) / (2 * G), a: 2 * G }, { t: 1.2, a: 0 }); }
      else {
        const sg = p.perfil === 'sube' ? 1 : -1, t1 = p.vmax / p.a;
        phases.push({ t: t1, a: sg * p.a }, { t: p.tc, a: 0 }, { t: t1, a: -sg * p.a }, { t: 1.2, a: 0 });
      }
      Ttot = phases.reduce((q, ph) => q + ph.t, 0);
    }
    const accAt = (t) => { let acc = 0; for (const ph of phases) { if (t < acc + ph.t) return ph.a; acc += ph.t; } return 0; };
    sim.run({
      reset() {
        build();
        s.y = 0; s.v = 0; s.a = 0; s.n = sim.p.m * G;
        H.clear(); H.push(0, s, true);
        const T = MC.niceCeil(Ttot);
        gA.set({ tmax: T }); gV.set({ tmax: T }); gN.set({ tmax: T });
      },
      step(h) {
        const t = sim.t + h;
        s.a = accAt(sim.t + h / 2);
        s.y += s.v * h + 0.5 * s.a * h * h;
        s.v += s.a * h;
        if (Math.abs(s.v) < 1e-9) s.v = 0;
        s.n = sim.p.m * (G + s.a);
        H.push(t, s);
        if (t >= Ttot) { s.a = 0; s.v = 0; H.push(t, s, true); sim.end(); }
      },
      h: 1 / 400
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.setRange({ ymin: s.y - 4.5, ymax: s.y + 5 });
      const ctx = cv.ctx;
      D.clear(cv);
      /* hueco del ascensor y pisos */
      ctx.fillStyle = MC.col('--surface-2');
      ctx.fillRect(view.X(-1.6), 0, view.X(1.6) - view.X(-1.6), cv.h);
      for (let k = Math.floor((s.y - 6) / 3); k <= Math.ceil((s.y + 6) / 3); k++) {
        const Y = view.Y(k * 3 - 0.1);
        D.line(ctx, 0, Y, view.X(-1.6), Y, { color: '--ink-3', width: 2 });
        D.line(ctx, view.X(1.6), Y, cv.w, Y, { color: '--ink-3', width: 2 });
        MC.text(ctx, `piso ${k + 1}`, 6, Y - 6, { size: 11, color: '--ink-3' });
      }
      /* cabina */
      const cx0 = view.X(-1.3), cx1 = view.X(1.3), cy0 = view.Y(s.y + 2.6), cy1 = view.Y(s.y);
      ctx.save();
      ctx.fillStyle = MC.col('--surface');
      ctx.strokeStyle = MC.col('--ink-2');
      ctx.lineWidth = 2;
      ctx.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
      ctx.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
      ctx.restore();
      if (p.perfil !== 'caida' || sim.t < 1) D.line(ctx, view.X(0), 0, view.X(0), cy0, { color: '--rope', width: 2 });
      else D.line(ctx, view.X(0), cy0 - 60, view.X(0), cy0, { color: '--rope', width: 2 });
      /* báscula y persona */
      const sy = view.Y(s.y) - 2;
      D.block(ctx, view.X(0), sy - 5, view.L(0.9), 10, { fill: '--metal', r: 2 });
      const reading = s.n / G;
      D.panel(ctx, view.X(0.55), sy - 28, 62, 20);
      MC.text(ctx, `${f1(reading)} kg`, view.X(0.55) + 31, sy - 13, { size: 12, mono: true, align: 'center', color: '--accent', weight: 600 });
      D.person(ctx, view.X(0), sy - 10, view.L(1.75), { arms: 0.15 });
      /* fuerzas sobre la persona */
      const kf = view.L(1.4) / (p.m * G);
      const px = view.X(-0.55), pyc = view.Y(s.y + 1.1);
      D.vec(ctx, px, pyc, 0, s.n * kf, { color: '--weight', label: 'w', width: 2.4 });
      if (s.n > 1) D.vec(ctx, px - 16, pyc, 0, -s.n * kf, { color: '--normal', label: 'n', width: 2.4, labelSide: -1 });
      if (Math.abs(s.a) > 0.01) D.vec(ctx, view.X(1.7), view.Y(s.y + 1.3), 0, -s.a * view.L(0.18), { color: '--acc', label: 'a', width: 2.4 });
      if (Math.abs(s.v) > 0.01) D.vec(ctx, view.X(2.2), view.Y(s.y + 1.3), 0, -s.v * view.L(0.25), { color: '--vel', label: 'v', width: 2.4 });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      const h3 = gc.h / 3;
      const mg = p.m * G;
      gA.draw(gctx, { x: 0, y: 0, w: gc.w, h: h3, mb: 26 }, H, { t: sim.t });
      gV.draw(gctx, { x: 0, y: h3, w: gc.w, h: h3, mb: 26 }, H, { t: sim.t });
      gN.draw(gctx, { x: 0, y: 2 * h3, w: gc.w, h: h3, mb: 34 }, H, { t: sim.t, yExtra: [0, mg * 1.3], after: (P) => P.hline(mg, { color: '--weight', dash: [5, 4], label: 'mg', labelRight: true }) });
      sim.set('ay', `${f2(s.a)} m/s²`);
      sim.set('vy', `${f2(s.v)} m/s`);
      sim.set('n', `${f1(s.n)} N`);
      sim.set('w', `${f1(mg)} N`);
      sim.set('kg', `${f1(reading)} kg`);
      sim.set('feel', s.n < 0.02 * mg ? 'ingravidez' : s.n > mg * 1.02 ? 'más pesado' : s.n < mg * 0.98 ? 'más liviano' : 'normal');
    });
  });

  /* ======================================================================
     5.5  Tercera ley: dos patinadores se empujan
     ====================================================================== */
  MC.defineSim('tercera-ley', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const view = new MC.View2D(cv, { xmin: -8, xmax: 8, ymin: -0.6, ymax: 2.6 });
    const H = new MC.History(['v1', 'v2', 'p']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v1', label: 'v₁', unit: 'm/s', color: '--c1', fmt: f2 }, { key: 'v2', label: 'v₂', unit: 'm/s', color: '--c4', fmt: f2 }], legend: 'tl', tspan: 3, sym: true });
    const gp = new MC.TGraph({ ylabel: ['p', 'kg·m/s'], series: [{ key: 'p', label: 'p₁ + p₂', unit: 'kg·m/s', color: '--mom', fmt: f1 }], legend: false, tspan: 3, minSpan: 20 });
    MC.hover(sim, gc, [gv, gp]);
    const s = { x1: -0.35, x2: 0.35, v1: 0, v2: 0 };
    sim.group('Patinadores');
    sim.slider('m1', { label: 'Masa del patinador 1 (izquierda)', min: 20, max: 120, step: 1, value: 70, unit: 'kg', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.slider('m2', { label: 'Masa del patinador 2 (derecha)', min: 10, max: 120, step: 1, value: 35, unit: 'kg', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.group('Empujón');
    sim.slider('F', { label: 'Fuerza del empujón', min: 50, max: 600, step: 10, value: 300, unit: 'N', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.slider('dt', { label: 'Duración del contacto', min: 0.1, max: 1, step: 0.05, value: 0.5, unit: 's', fmt: f2, reset: true });
    sim.out('F', '|<i>F</i><sub>12</sub>| = |<i>F</i><sub>21</sub>|');
    sim.out('a', 'Aceleraciones <i>a</i>₁, <i>a</i>₂');
    sim.out('v', 'Velocidades <i>v</i>₁, <i>v</i>₂', { hl: true });
    sim.out('p', 'Momentos <i>m</i>₁<i>v</i>₁, <i>m</i>₂<i>v</i>₂');
    sim.out('pt', 'Suma <i>p</i>₁ + <i>p</i>₂', { hl: true });
    sim.presets([
      { id: 'adulto', label: 'Adulto (70 kg) y niño (35 kg)', v: { m1: 70, m2: 35, F: 300, dt: 0.5 }, note: 'El niño sale con el doble de velocidad que el adulto.' },
      { id: 'iguales', label: 'Dos patinadores iguales', v: { m1: 60, m2: 60, F: 300, dt: 0.5 } },
      { id: 'pesado', label: 'Patinador liviano contra uno muy pesado', v: { m1: 30, m2: 120, F: 400, dt: 0.5 } }
    ]);
    sim.run({
      reset() { s.x1 = -0.35; s.x2 = 0.35; s.v1 = 0; s.v2 = 0; H.clear(); H.push(0, { v1: 0, v2: 0, p: 0 }, true); },
      step(h) {
        const p = sim.p;
        const push = sim.t < p.dt;
        const a1 = push ? -p.F / p.m1 : 0, a2 = push ? p.F / p.m2 : 0;
        s.x1 += s.v1 * h + 0.5 * a1 * h * h; s.x2 += s.v2 * h + 0.5 * a2 * h * h;
        s.v1 += a1 * h; s.v2 += a2 * h;
        H.push(sim.t + h, { v1: s.v1, v2: s.v2, p: p.m1 * s.v1 + p.m2 * s.v2 });
        if (s.x1 < -7.5 || s.x2 > 7.5 || sim.t > 8) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      ctx.fillStyle = MC.alpha('--water', 0.16);
      ctx.fillRect(0, view.Y(0), cv.w, cv.h - view.Y(0));
      D.line(ctx, 0, view.Y(0), cv.w, view.Y(0), { color: '--ink-3', width: 1.5 });
      const push = sim.t < p.dt && sim.t > 0 ? 1 : sim.t === 0 ? 1 : 0;
      const h1 = view.L(0.9 + p.m1 / 120), h2 = view.L(0.9 + p.m2 / 120);
      D.person(ctx, view.X(s.x1 - 0.15), view.Y(0), h1, { arms: push ? 0.95 : 0.3, color: '--c1' });
      D.person(ctx, view.X(s.x2 + 0.15), view.Y(0), h2, { arms: push ? 0.95 : 0.3, color: '--c4' });
      MC.text(ctx, `${MC.fix(p.m1, 0)} kg`, view.X(s.x1 - 0.15), view.Y(0) + 16, { size: 11, align: 'center', mono: true, color: '--c1' });
      MC.text(ctx, `${MC.fix(p.m2, 0)} kg`, view.X(s.x2 + 0.15), view.Y(0) + 16, { size: 11, align: 'center', mono: true, color: '--c4' });
      if (sim.t < p.dt) {
        const k = 60 / 600 * 1.6;
        const yF = view.Y(0) - Math.min(h1, h2) * 0.55;
        D.vec(ctx, view.X(s.x1) - 4, yF, -p.F * k, 0, { color: '--force', label: 'F_{21}' });
        D.vec(ctx, view.X(s.x2) + 4, yF, p.F * k, 0, { color: '--force', label: 'F_{12}' });
      }
      D.vec(ctx, view.X(s.x1 - 0.15), view.Y(0) - h1 - 10, s.v1 * 22, 0, { color: '--vel', label: 'v₁', minLen: 3 });
      D.vec(ctx, view.X(s.x2 + 0.15), view.Y(0) - h2 - 10, s.v2 * 22, 0, { color: '--vel', label: 'v₂', minLen: 3 });
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t, after: (P) => P.vline(p.dt, { label: 'fin del empujón', color: '--ink-3' }) });
      const pmax = Math.max(20, p.F * p.dt * 1.3);
      gp.set({ ymin: -pmax, ymax: pmax });
      gp.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      const pushing = sim.t < p.dt;
      sim.set('F', pushing ? `${MC.fix(p.F, 0)} N (durante el empujón)` : '0 N (ya no se tocan)');
      sim.set('a', pushing ? `${f2(-p.F / p.m1)} y ${f2(p.F / p.m2)} m/s²` : '0 y 0 m/s²');
      sim.set('v', `${f2(s.v1)} y ${f2(s.v2)} m/s`);
      sim.set('p', `${f1(p.m1 * s.v1)} y ${f1(p.m2 * s.v2)} kg·m/s`);
      sim.set('pt', `${f2(p.m1 * s.v1 + p.m2 * s.v2)} kg·m/s`);
    });
  });

  /* ======================================================================
     5.6  Semáforo colgado de dos cables
     ====================================================================== */
  MC.defineSim('equilibrio-cuerdas', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const view = new MC.View2D(cv, { xmin: -5.2, xmax: 5.2, ymin: -4.6, ymax: 0.8 });
    sim.group('Carga');
    sim.slider('W', { label: 'Peso <i>w</i> del objeto colgado', min: 10, max: 1000, step: 5, value: 200, unit: 'N', fmt: (v) => MC.fix(v, 0) });
    sim.group('Ángulos con la horizontal');
    sim.slider('t1', { label: 'Cable 1 (izquierdo) θ₁', min: 2, max: 88, step: 0.5, value: 15, unit: '°', fmt: f1 });
    sim.slider('t2', { label: 'Cable 2 (derecho) θ₂', min: 2, max: 88, step: 0.5, value: 15, unit: '°', fmt: f1 });
    sim.check('sym', { label: 'Ángulos iguales (simétrico)', value: true });
    sim.out('T1', 'Tensión <i>T</i>₁', { hl: true });
    sim.out('T2', 'Tensión <i>T</i>₂', { hl: true });
    sim.out('r', '<i>T</i>₁/<i>w</i> y <i>T</i>₂/<i>w</i>');
    sim.out('sx', 'Σ<i>F<sub>x</sub></i> = <i>T</i>₂cos θ₂ − <i>T</i>₁cos θ₁');
    sim.out('sy', 'Σ<i>F<sub>y</sub></i> = <i>T</i>₁sen θ₁ + <i>T</i>₂sen θ₂ − <i>w</i>');
    sim.presets([
      { id: 'semaforo', label: 'Semáforo de 200 N con cables a 15°', v: { W: 200, t1: 15, t2: 15, sym: true } },
      { id: 'letrero', label: 'Letrero de 100 N con cables a 37° y 53°', v: { W: 100, t1: 37, t2: 53, sym: false }, note: 'T₁ = 60 N y T₂ = 80 N: el cable más vertical soporta más.' },
      { id: 'hamaca', label: 'Hamaca con una persona (700 N) a 30°', v: { W: 700, t1: 30, t2: 30, sym: true }, note: 'A 30°, cada lado soporta exactamente el peso completo: 700 N.' },
      { id: 'tendedero', label: 'Camisa mojada en una cuerda de tender (5°)', v: { W: 20, t1: 5, t2: 5, sym: true }, note: 'Una cuerda casi horizontal soporta una tensión muchas veces mayor que el peso.' }
    ]);
    sim.onChange = (id) => {
      if (!sim.p.sym) return;
      if (id === 't1' || id === 'sym') sim.ctl.t2.set(sim.p.t1, true);
      else if (id === 't2') sim.ctl.t1.set(sim.p.t2, true);
    };
    const L = 8;
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: false });
      const a1 = M.rad(p.t1), a2 = M.rad(p.t2);
      const s12 = Math.sin(a1 + a2);
      const T1 = (p.W * Math.cos(a2)) / s12, T2 = (p.W * Math.cos(a1)) / s12;
      const d1 = (L * Math.sin(a2)) / s12;
      const kx = -L / 2 + d1 * Math.cos(a1), ky = -d1 * Math.sin(a1);
      /* escalar para que el nudo quede visible */
      const depth = -ky;
      const sc = depth > 2.6 ? 2.6 / depth : 1;
      const A = [view.X(-L / 2 * sc), view.Y(0)], B = [view.X(L / 2 * sc), view.Y(0)], K = [view.X(kx * sc), view.Y(ky * sc)];
      D.ceiling(ctx, A[0] - 30, view.Y(0), B[0] + 30);
      const tw = (T) => M.clamp(1.5 + (T / p.W) * 1.2, 1.5, 7);
      D.line(ctx, A[0], A[1], K[0], K[1], { color: '--rope', width: tw(T1) });
      D.line(ctx, B[0], B[1], K[0], K[1], { color: '--rope', width: tw(T2) });
      D.angle(ctx, A[0], A[1], 34, -a1, 0, { label: 'θ₁' });
      D.angle(ctx, B[0], B[1], 34, Math.PI, Math.PI + a2, { label: 'θ₂' });
      /* semáforo */
      const bw = 26, bh = 70;
      D.line(ctx, K[0], K[1], K[0], K[1] + 14, { color: '--ink-2', width: 2 });
      ctx.save();
      ctx.fillStyle = MC.col('--tire');
      ctx.fillRect(K[0] - bw / 2, K[1] + 14, bw, bh);
      ['#E0463A', '#F2B84B', '#3FA66B'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(K[0], K[1] + 26 + i * 22, 8, 0, 2 * Math.PI); ctx.fill(); });
      ctx.restore();
      D.circle(ctx, K[0], K[1], 4, { fill: '--ink' });
      MC.text(ctx, `T₁ = ${f1(T1)} N`, (A[0] + K[0]) / 2, (A[1] + K[1]) / 2 - 12, { size: 12.5, mono: true, color: '--tension', halo: true, align: 'center', weight: 600 });
      MC.text(ctx, `T₂ = ${f1(T2)} N`, (B[0] + K[0]) / 2, (B[1] + K[1]) / 2 - 12, { size: 12.5, mono: true, color: '--tension', halo: true, align: 'center', weight: 600 });
      /* DCL del nudo */
      const bx = 8, by = cv.h - 176;
      const F = [
        { fx: -T1 * Math.cos(a1), fy: T1 * Math.sin(a1), color: '--tension', label: 'T₁' },
        { fx: T2 * Math.cos(a2), fy: T2 * Math.sin(a2), color: '--tension', label: 'T₂' },
        { fx: 0, fy: -p.W, color: '--weight', label: 'w' }
      ];
      D.fbd(ctx, F, { x: bx, y: by, w: 170, h: 168, title: 'DCL DEL NUDO', maxLen: 62 });
      /* polígono cerrado */
      const px0 = cv.w - 178, py0 = cv.h - 176;
      D.panel(ctx, px0, py0, 170, 168, { title: 'T₁ + T₂ + w = 0' });
      const mx = Math.max(T1, T2, p.W);
      const k = 64 / mx;
      let cx = px0 + 85 + (T1 * Math.cos(a1) - T2 * Math.cos(a2)) * k * 0.5, cy = py0 + 40;
      const start = [cx, cy];
      /* w hacia abajo, luego T1 y T2 hasta cerrar */
      const seq = [F[2], F[1], F[0]];
      let pt = [cx, cy];
      seq.forEach((f) => {
        const nx = pt[0] + f.fx * k, ny = pt[1] - f.fy * k;
        D.arrow(ctx, pt[0], pt[1], nx, ny, { color: f.color, width: 2.2 });
        MC.text(ctx, f.label, (pt[0] + nx) / 2 + 8, (pt[1] + ny) / 2, { size: 12, math: true, color: f.color, halo: true });
        pt = [nx, ny];
      });
      void start;
      const sx = T2 * Math.cos(a2) - T1 * Math.cos(a1), sy = T1 * Math.sin(a1) + T2 * Math.sin(a2) - p.W;
      sim.set('T1', `${f1(T1)} N`);
      sim.set('T2', `${f1(T2)} N`);
      sim.set('r', `${f2(T1 / p.W)} y ${f2(T2 / p.W)}`);
      sim.set('sx', `${f2(sx)} N`);
      sim.set('sy', `${f2(sy)} N`);
    });
  });
})();
