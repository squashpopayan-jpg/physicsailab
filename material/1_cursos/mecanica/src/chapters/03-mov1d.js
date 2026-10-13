/* Capítulo 3 — Movimiento en una dimensión */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2);

  /* ---------- Carretera con regla en metros (compartida en el capítulo) ---------- */
  function road(ctx, view, cv, o = {}) {
    const y0 = view.Y(0), yb = view.Y(-1.4);
    ctx.save();
    ctx.fillStyle = MC.col('--road');
    ctx.fillRect(0, y0, cv.w, yb - y0);
    ctx.strokeStyle = MC.col('--road-line');
    ctx.lineWidth = 2;
    ctx.setLineDash([view.L(2), view.L(2)]);
    ctx.lineDashOffset = -view.X(0);
    ctx.beginPath();
    ctx.moveTo(0, (y0 + yb) / 2);
    ctx.lineTo(cv.w, (y0 + yb) / 2);
    ctx.stroke();
    ctx.restore();
    /* regla */
    const span = view.x1 - view.x0;
    const major = MC.niceStep(span, Math.max(4, cv.w / 80));
    const minor = major / 5;
    const yt = yb + 2;
    ctx.save();
    ctx.strokeStyle = MC.col('--ink-3');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.ceil(view.x0 / minor) * minor; x <= view.x1; x += minor) {
      const px = Math.round(view.X(x)) + 0.5;
      const isMaj = Math.abs(x / major - Math.round(x / major)) < 1e-6;
      ctx.moveTo(px, yt);
      ctx.lineTo(px, yt + (isMaj ? 7 : 3.5));
    }
    ctx.stroke();
    ctx.restore();
    const fmt = MC.tickFmt(major);
    for (let x = Math.ceil(view.x0 / major) * major; x <= view.x1; x += major) {
      MC.text(ctx, fmt(x), view.X(x), yt + 18, { size: 10.5, mono: true, align: 'center', color: '--ink-3' });
    }
    MC.text(ctx, o.unit || 'x (m)', cv.w - 6, yt + 30, { size: 10.5, mono: true, align: 'right', color: '--ink-3' });
    if (o.origin !== false && view.X(0) > 0 && view.X(0) < cv.w) {
      D.line(ctx, view.X(0), y0 - 4, view.X(0), yt + 8, { color: '--ink-2', width: 1.2, dash: [3, 3] });
    }
  }
  MC.road = road;

  /* ======================================================================
     3.2  Velocidad media e instantánea: secante → tangente
     ====================================================================== */
  MC.defineSim('v-inst', function (sim) {
    const rc = sim.canvas({ aspect: 4.4, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.85 });
    const rv = new MC.View2D(rc, { xmin: -4, xmax: 60, ymin: -3.6, ymax: 3.2 });
    const PROF = {
      ciudad: { x: (t) => 4 * t - (4 / 0.9) * Math.sin(0.9 * t), v: (t) => 4 * (1 - Math.cos(0.9 * t)) },
      arranque: { x: (t) => (t <= 10 ? 30 * (t / 10) ** 2 * (3 - (2 * t) / 10) : 30), v: (t) => (t <= 10 ? 1.8 * t - 0.18 * t * t : 0) },
      idavuelta: { x: (t) => 12.5 * (1 - Math.cos((Math.PI * t) / 6)), v: (t) => ((12.5 * Math.PI) / 6) * Math.sin((Math.PI * t) / 6) },
      mrua: { x: (t) => 1 + 0.5 * t + 0.35 * t * t, v: (t) => 0.5 + 0.7 * t }
    };
    const TMAX = 12;
    sim.group('Movimiento');
    sim.select('prof', { label: 'Perfil de movimiento', value: 'ciudad', options: [['ciudad', 'Tráfico con semáforos'], ['arranque', 'Arranque y frenado'], ['idavuelta', 'Ida y vuelta'], ['mrua', 'Aceleración constante']] });
    sim.group('Intervalo');
    sim.slider('t1', { label: 'Instante <i>t</i>₁', min: 0, max: 8, step: 0.01, value: 3, unit: 's', fmt: f2 });
    sim.slider('dt', { label: 'Intervalo Δ<i>t</i>', min: 0.01, max: 4, step: 0.01, value: 3, unit: 's', fmt: f2, log: true });
    sim.check('sec', { label: 'Recta secante (velocidad media)', value: true });
    sim.check('tan', { label: 'Recta tangente (velocidad instantánea)', value: true });
    let stopTw = null;
    sim.button('Δt → 0', () => {
      if (stopTw) stopTw();
      const d0 = sim.p.dt, d1 = 0.01;
      stopTw = MC.tween(2.8, (p) => { sim.ctl.dt.set(d0 * Math.pow(d1 / d0, p), true); sim.redraw(); }, () => { stopTw = null; });
    }, { primary: true, icon: 'play' });
    sim.button('Δt = 3 s', () => { if (stopTw) stopTw(); sim.ctl.dt.set(3); });
    sim.out('x1', 'Posición <i>x</i>(<i>t</i>₁)');
    sim.out('x2', 'Posición <i>x</i>(<i>t</i>₁ + Δ<i>t</i>)');
    sim.out('dx', 'Desplazamiento Δ<i>x</i>');
    sim.out('vm', 'Velocidad media Δ<i>x</i>/Δ<i>t</i>', { hl: true });
    sim.out('vi', 'Velocidad instantánea <i>v</i>(<i>t</i>₁)', { hl: true });
    sim.out('err', 'Diferencia');
    sim.legend([{ color: '--pos', label: '<i>x</i>(<i>t</i>)' }, { color: '--c5', label: 'secante: pendiente = <i>v</i><sub>prom</sub>' }, { color: '--vel', label: 'tangente: pendiente = <i>v</i>' }]);
    const G = { plot: null, hx: null };
    MC.hover(sim, gc, [G]);
    MC.pointer(gc, {
      down: (x, y) => { if (G.plot && G.plot.inside(x, y)) { sim.ctl.t1.set(M.clamp(G.plot.invX(x), 0, 8)); return 1; } return null; },
      move: (_, x) => { if (G.plot) sim.ctl.t1.set(M.clamp(G.plot.invX(x), 0, 8)); },
      touch: 'pan-y'
    });
    sim.hint('Arrastre sobre la gráfica para mover t₁', gc);

    sim.onDraw(() => {
      const P = PROF[sim.p.prof];
      const t1 = sim.p.t1, dt = sim.p.dt, t2 = t1 + dt;
      const x1 = P.x(t1), x2 = P.x(t2), v1 = P.v(t1), vm = (x2 - x1) / dt;
      /* carretera */
      rv.update();
      let ctx = rc.ctx;
      D.clear(rc);
      road(ctx, rv, rc);
      const clen = rv.L(4.2);
      const dir2 = P.v(t2) < -1e-6 ? -1 : 1, dir1 = v1 < -1e-6 ? -1 : 1;
      ctx.save(); ctx.globalAlpha = 0.4; D.car(ctx, rv.X(x2), rv.Y(0), clen, { color: '--body-b', dir: dir2 }); ctx.restore();
      D.car(ctx, rv.X(x1), rv.Y(0), clen, { color: '--body-c', dir: dir1 });
      MC.text(ctx, 't₁', rv.X(x1), rv.Y(0) - clen * 0.5, { size: 12, align: 'center', color: '--ink-2', halo: true });
      MC.text(ctx, 't₁+Δt', rv.X(x2), rv.Y(0) - clen * 0.5, { size: 12, align: 'center', color: '--ink-2', halo: true });
      if (Math.abs(x2 - x1) > 0.05) {
        const ya = rv.Y(0) - clen * 0.62 - 10;
        D.arrow(ctx, rv.X(x1), ya, rv.X(x2), ya, { color: '--pos', width: 2 });
        MC.text(ctx, `Δx = ${f2(x2 - x1)} m`, (rv.X(x1) + rv.X(x2)) / 2, ya - 6, { size: 12, align: 'center', mono: true, color: '--pos', halo: true });
      }
      /* gráfica x(t) */
      ctx = gc.ctx;
      D.clear(gc);
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 120; i++) { const v = P.x((TMAX * i) / 120); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const [ymin, ymax] = MC.niceRange(lo, hi, { zero: true });
      const pl = G.plot || (G.plot = new MC.Plot(ctx));
      pl.ctx = ctx;
      pl.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: TMAX, ymin, ymax, xlabel: ['t', 's'], ylabel: ['x', 'm'], mt: 14, ml: 54 });
      pl.frame();
      pl.fn(P.x, { color: '--pos', width: 2.6 });
      if (sim.p.sec) {
        /* triángulo Δt, Δx */
        pl.xy([t1, t2], [x1, x1], { color: '--c5', width: 1.2, dash: [4, 3] });
        pl.xy([t2, t2], [x1, x2], { color: '--c5', width: 1.2, dash: [4, 3] });
        pl.label((t1 + t2) / 2, x1, 'Δt', { dy: x2 >= x1 ? 15 : -7, align: 'center', color: '--c5', math: true });
        pl.label(t2, (x1 + x2) / 2, 'Δx', { dx: 6, color: '--c5', math: true });
        pl.line(t1, x1, vm, { color: '--c5', width: 1.8 });
      }
      if (sim.p.tan) pl.line(t1, x1, v1, { color: '--vel', width: 1.8, dash: [7, 4] });
      pl.dot(t1, x1, { color: '--pos', r: 5 });
      pl.dot(t2, x2, { color: '--c5', r: 4.5 });
      if (G.hx !== null) pl.crosshair(G.hx, [{ label: 'x', unit: 'm', y: P.x(G.hx), color: '--pos', fmt: f2 }, { label: 'v', unit: 'm/s', value: P.v(G.hx), color: '--vel', fmt: f2 }], { label: 't', unit: 's', fmt: f2 });
      sim.set('x1', `${f2(x1)} m`);
      sim.set('x2', `${f2(x2)} m`);
      sim.set('dx', `${f2(x2 - x1)} m`);
      sim.set('vm', `${MC.fix(vm, 3)} m/s`);
      sim.set('vi', `${MC.fix(v1, 3)} m/s`);
      sim.set('err', `${MC.fix(vm - v1, 3)} m/s`);
    });
  });

  /* ======================================================================
     3.4  MRUA: el carro y sus tres gráficas
     ====================================================================== */
  MC.defineSim('mrua', function (sim) {
    const rc = sim.canvas({ aspect: 4.0, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.2 });
    const rv = new MC.View2D(rc, { xmin: -5, xmax: 60, ymin: -4.2, ymax: 3.6 });
    const H = new MC.History(['x', 'v', 'a']);
    const gx = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--pos', fmt: f2 }], legend: false });
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false });
    const ga = new MC.TGraph({ ylabel: ['a', 'm/s²'], series: [{ key: 'a', label: 'a', unit: 'm/s²', color: '--acc', fmt: f2 }], legend: false, minSpan: 2 });
    MC.hover(sim, gc, [gx, gv, ga]);
    const s = { x: 0, v: 0, a: 0, dist: 0, stopped: false, strobe: [] };
    let range = [-5, 60];

    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: 'Posición inicial <i>x</i>₀', min: -30, max: 30, step: 0.5, value: 0, unit: 'm', fmt: f1, reset: true });
    sim.slider('v0', { label: 'Velocidad inicial <i>v</i>₀', min: -25, max: 30, step: 0.5, value: 15, unit: 'm/s', fmt: f1, reset: true });
    sim.group('Durante el movimiento');
    sim.slider('a', { label: 'Aceleración <i>a</i> (se puede cambiar en marcha)', min: -6, max: 6, step: 0.1, value: -3, unit: 'm/s²', fmt: f1 });
    sim.slider('T', { label: 'Duración', min: 3, max: 20, step: 0.5, value: 7, unit: 's', fmt: f1, reset: true });
    sim.check('frenos', { label: 'Se detiene al llegar a <i>v</i> = 0 (frenado)', value: true });
    sim.group('Mostrar');
    sim.check('strobe', { label: 'Diagrama de movimiento (cada 0.5 s)', value: true });
    sim.check('vec', { label: 'Vectores <i>v</i> y <i>a</i> sobre el carro', value: true });
    sim.check('area', { label: 'Área bajo <i>v</i>(<i>t</i>) = Δ<i>x</i>', value: false });
    sim.check('teo', { label: 'Curvas teóricas (a constante)', value: true });
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('x', 'Posición <i>x</i>');
    sim.out('v', 'Velocidad <i>v</i>', { hl: true });
    sim.out('a', 'Aceleración <i>a</i>');
    sim.outSep();
    sim.out('dx', 'Desplazamiento Δ<i>x</i>');
    sim.out('d', 'Distancia recorrida');
    sim.out('chk', '<i>v</i>² − <i>v</i>₀² vs 2<i>a</i>Δ<i>x</i>');
    sim.presets([
      { id: 'semaforo', label: 'Auto frenando ante un semáforo', v: { x0: 0, v0: 15, a: -3, T: 7, frenos: true }, note: '54 km/h y frenado de −3 m/s²: se detiene en 5 s tras recorrer 37.5 m.' },
      { id: 'arranque', label: 'Arranque desde el reposo', v: { x0: 0, v0: 0, a: 2.5, T: 8, frenos: false }, note: 'La distancia crece con el cuadrado del tiempo: en el doble de tiempo recorre cuatro veces más.' },
      { id: 'mru', label: 'Velocidad constante en autopista (MRU)', v: { x0: -20, v0: 25, a: 0, T: 6, frenos: false }, note: 'Sin aceleración: x(t) es una recta y v(t) es horizontal.' },
      { id: 'rampa', label: 'Pelota lanzada cuesta arriba (ida y vuelta)', v: { x0: 0, v0: 8, a: -2, T: 10, frenos: false }, note: 'La aceleración nunca cambia: la pelota sube frenando, se detiene en t = 4 s y baja acelerando.' },
      { id: 'reversa', label: 'Auto en reversa que frena', v: { x0: 20, v0: -6, a: 1.5, T: 6, frenos: true }, note: 'Velocidad negativa y aceleración positiva: la rapidez disminuye.' }
    ]);
    sim.legend([{ color: '--vel', label: 'velocidad <i>v</i>', kind: 'arrow' }, { color: '--acc', label: 'aceleración <i>a</i>', kind: 'arrow' }, { color: '--ink-3', label: 'predicción con <i>a</i> constante', kind: 'dash' }]);

    function predictRange() {
      const p = sim.p, T = p.T;
      let lo = p.x0, hi = p.x0;
      for (let i = 0; i <= 100; i++) {
        const t = (T * i) / 100;
        let x = p.x0 + p.v0 * t + 0.5 * p.a * t * t;
        if (p.frenos && p.a * p.v0 < 0) { const ts = -p.v0 / p.a; if (t > ts) x = p.x0 + p.v0 * ts + 0.5 * p.a * ts * ts; }
        lo = Math.min(lo, x); hi = Math.max(hi, x);
      }
      return [lo, hi];
    }
    sim.run({
      reset() {
        const p = sim.p;
        s.x = p.x0; s.v = p.v0; s.a = p.a; s.dist = 0; s.stopped = false; s.strobe = [{ t: 0, x: s.x }];
        H.clear(); H.push(0, { x: s.x, v: s.v, a: s.a }, true);
        const r = predictRange();
        range = MC.niceRange(r[0] - 4, r[1] + 4, { zero: false, minSpan: 20, pad: 0.02 });
        gx.set({ tmax: p.T }); gv.set({ tmax: p.T }); ga.set({ tmax: p.T });
      },
      step(h) {
        const p = sim.p;
        s.a = s.stopped ? 0 : p.a;
        const vOld = s.v;
        let vNew = s.v + s.a * h;
        let dx = s.v * h + 0.5 * s.a * h * h;
        if (p.frenos && !s.stopped && vOld !== 0 && vNew * vOld <= 0 && s.a * vOld < 0) {
          const ts = -vOld / s.a;
          dx = vOld * ts + 0.5 * s.a * ts * ts;
          vNew = 0;
          s.stopped = true;
        }
        s.x += dx; s.dist += Math.abs(dx); s.v = vNew;
        const t = sim.t + h;
        if (s.stopped) s.a = 0;
        H.push(t, { x: s.x, v: s.v, a: s.stopped ? 0 : p.a });
        if (Math.floor((t + 1e-9) / 0.5) > Math.floor((sim.t + 1e-9) / 0.5)) s.strobe.push({ t, x: s.x });
        if (t >= p.T - 1e-9) { H.push(t, { x: s.x, v: s.v, a: s.stopped ? 0 : p.a }, true); sim.end(); }
      }
    });
    sim.onChange = (id) => { if (id === 'a' && !sim.playing && sim.t === 0) sim.reset(); };

    sim.onDraw(() => {
      const p = sim.p;
      /* rango de la carretera: incluye predicción e historial */
      const hr = H.range(['x']);
      let lo = Math.min(range[0], hr[0] - 4), hi = Math.max(range[1], hr[1] + 4);
      if (lo < range[0] || hi > range[1]) range = MC.niceRange(lo, hi, { zero: false, pad: 0.02 });
      rv.setRange({ xmin: range[0], xmax: range[1] });
      let ctx = rc.ctx;
      D.clear(rc);
      road(ctx, rv, rc);
      if (p.strobe) {
        s.strobe.forEach((q, i) => {
          D.circle(ctx, rv.X(q.x), rv.Y(0.35), 3.2, { fill: '--pos', color: '--canvas', width: 1 });
          if (i % 2 === 0) MC.text(ctx, MC.fix(q.t, 0), rv.X(q.x), rv.Y(0.35) - 7, { size: 9.5, mono: true, align: 'center', color: '--ink-3' });
        });
      }
      const clen = Math.max(28, Math.min(70, rv.L(4.2)));
      const dir = s.v < -1e-9 ? -1 : s.v > 1e-9 ? 1 : (p.v0 < 0 ? -1 : 1);
      const X = rv.X(s.x), Y = rv.Y(0) - 2;
      D.car(ctx, X, Y, clen, { color: '--body-c', dir, wheel: s.x / 0.33 });
      if (p.vec) {
        const yv = Y - clen * 0.55;
        const kv = Math.min(4, 120 / 30);
        D.vec(ctx, X, yv, s.v * kv, 0, { color: '--vel', label: 'v', minLen: 2 });
        const aNow = s.stopped ? 0 : p.a;
        D.vec(ctx, X, yv - 16, aNow * 10, 0, { color: '--acc', label: 'a', minLen: 2 });
      }
      /* gráficas */
      ctx = gc.ctx;
      D.clear(gc);
      const h3 = gc.h / 3;
      const teo = p.teo;
      const x0 = p.x0, v0 = p.v0, a = p.a;
      let ts = Infinity;
      if (p.frenos && a * v0 < 0) ts = -v0 / a;
      const xT = (t) => (t < ts ? x0 + v0 * t + 0.5 * a * t * t : x0 + v0 * ts + 0.5 * a * ts * ts);
      const vT = (t) => (t < ts ? v0 + a * t : 0);
      const aT = (t) => (t < ts ? a : 0);
      gx.set({ fns: teo ? [{ f: xT }] : [] });
      gv.set({ fns: teo ? [{ f: vT }] : [], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2, fill: p.area ? '--vel' : null, fillAlpha: 0.16 }] });
      ga.set({ fns: teo ? [{ f: aT }] : [] });
      const tnow = sim.t;
      gx.draw(ctx, { x: 0, y: 0, w: gc.w, h: h3, mb: 26 }, H, { t: tnow, after: (P) => P.vline(tnow, { color: '--ink-3', dash: [2, 3] }) });
      gv.draw(ctx, { x: 0, y: h3, w: gc.w, h: h3, mb: 26 }, H, {
        t: tnow,
        after: (P) => {
          P.vline(tnow, { color: '--ink-3', dash: [2, 3] });
          if (p.area) P.label(Math.max(0.2, tnow * 0.5), 0, `área = Δx = ${f2(s.x - p.x0)} m`, { dy: -8, color: '--vel', mono: true, size: 11 });
        }
      });
      ga.draw(ctx, { x: 0, y: 2 * h3, w: gc.w, h: h3, mb: 34 }, H, { t: tnow, yExtra: [-1, 1], after: (P) => P.vline(tnow, { color: '--ink-3', dash: [2, 3] }) });
      /* lecturas */
      const dx = s.x - p.x0;
      sim.set('t', `${f2(sim.t)} s`);
      sim.set('x', `${f2(s.x)} m`);
      sim.set('v', `${f2(s.v)} m/s`);
      sim.set('a', `${f2(s.stopped ? 0 : p.a)} m/s²`);
      sim.set('dx', `${f2(dx)} m`);
      sim.set('d', `${f2(s.dist)} m`);
      const lhs = s.v * s.v - p.v0 * p.v0, rhs = 2 * p.a * dx;
      sim.set('chk', s.stopped ? 'se detuvo' : `${f1(lhs)} | ${f1(rhs)} m²/s²`);
    });
    sim.applyPreset('semaforo', true);
  });

  /* ======================================================================
     3.5  Caída libre y lanzamiento vertical
     ====================================================================== */
  MC.defineSim('caida-libre', function (sim) {
    sim.cols2('2fr 3fr');
    const sc = sim.canvas({ aspect: 0.6 });
    const gc = sim.canvas({ aspect: 0.9 });
    const view = new MC.View2D(sc, { xmin: -6, xmax: 6, ymin: -1.5, ymax: 25, align: 'bottom', padB: 6, padT: 10 });
    const H = new MC.History(['y', 'v', 'y2', 'v2']);
    const gy = new MC.TGraph({ ylabel: ['y', 'm'], series: [{ key: 'y', label: 'bola 1', unit: 'm', color: '--c1', fmt: f2 }], legend: 'tr' });
    const gvv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'bola 1', unit: 'm/s', color: '--c1', fmt: f2 }], legend: false });
    MC.hover(sim, gc, [gy, gvv]);
    const b1 = { y: 0, v: 0, done: false }, b2 = { y: 0, v: 0, done: false };
    let strobe = [];
    let yTop = 25;

    sim.group('Lanzamiento');
    sim.slider('y0', { label: 'Altura inicial <i>y</i>₀', min: 0, max: 100, step: 0.5, value: 1.5, unit: 'm', fmt: f1, reset: true });
    sim.slider('v0', { label: 'Velocidad inicial <i>v</i>₀ (+ arriba)', min: -20, max: 30, step: 0.5, value: 15, unit: 'm/s', fmt: f1, reset: true });
    sim.select('pl', { label: 'Lugar', value: 'tierra', options: MC.planetOptions(['tierra', 'luna', 'marte', 'jupiter', 'venus']), reset: true });
    sim.group('Mostrar');
    sim.check('two', { label: 'Segunda bola soltada desde el reposo', value: false, reset: true });
    sim.check('st', { label: 'Imágenes estroboscópicas', value: true });
    sim.slider('dts', { label: 'Intervalo entre imágenes', min: 0.1, max: 1, step: 0.05, value: 0.2, unit: 's', fmt: f2, reset: true });
    sim.check('vec', { label: 'Vectores <i>v</i> y <i>g</i>', value: true });
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('y', 'Altura <i>y</i>');
    sim.out('v', 'Velocidad <i>v</i>', { hl: true });
    sim.outSep('Predicción');
    sim.out('ts', 'Tiempo de subida <i>v</i>₀/<i>g</i>');
    sim.out('ym', 'Altura máxima');
    sim.out('tv', 'Tiempo hasta el suelo');
    sim.out('vi', 'Velocidad al llegar al suelo');
    sim.presets([
      { id: 'arriba', label: 'Pelota lanzada hacia arriba a 15 m/s', v: { y0: 1.5, v0: 15, pl: 'tierra', two: false, dts: 0.2 } },
      { id: 'pozo', label: 'Piedra soltada en un pozo de 20 m', v: { y0: 20, v0: 0, pl: 'tierra', two: false, dts: 0.2 }, note: 'Tarda 2.0 s en llegar al fondo y llega a 19.8 m/s.' },
      { id: 'clavadista', label: 'Clavadista desde 35 m', v: { y0: 35, v0: 0, pl: 'tierra', two: false, dts: 0.25 }, note: 'Llega al agua a unos 26 m/s (94 km/h) tras 2.7 s.' },
      { id: 'luna', label: 'Martillo y pluma en la Luna', v: { y0: 1.6, v0: 0, pl: 'luna', two: true, dts: 0.2 }, note: 'Sin atmósfera ambos caen juntos: 1.4 s desde 1.6 m.' },
      { id: 'puente', label: 'Piedra lanzada hacia abajo desde un puente', v: { y0: 30, v0: -10, pl: 'tierra', two: true, dts: 0.2 }, note: 'La lanzada llega antes, pero ambas tienen la misma aceleración.' }
    ]);

    const g = () => MC.gOf(sim.p.pl);
    function predict() {
      const p = sim.p, G = g();
      const ts = p.v0 > 0 ? p.v0 / G : 0;
      const ym = p.y0 + (p.v0 > 0 ? (p.v0 * p.v0) / (2 * G) : 0);
      const tv = (p.v0 + Math.sqrt(p.v0 * p.v0 + 2 * G * p.y0)) / G;
      const vi = p.v0 - G * tv;
      return { ts, ym, tv, vi };
    }
    function adv(b, v0, h) {
      if (b.done) return;
      const G = g();
      const yn = b.y + b.v * h - 0.5 * G * h * h;
      if (yn <= 0) {
        /* instante exacto de llegada dentro del paso */
        const r = M.quad(-0.5 * G, b.v, b.y).filter((t) => t >= -1e-12);
        const th = r.length ? r[r.length - 1] : h;
        b.v = b.v - G * th;
        b.y = 0;
        b.done = true;
        b.tLand = sim.t + th;
      } else { b.y = yn; b.v -= G * h; }
    }
    sim.run({
      reset() {
        const p = sim.p;
        b1.y = p.y0; b1.v = p.v0; b1.done = false; b1.logged = false;
        b2.y = p.y0; b2.v = 0; b2.done = !p.two;
        strobe = [{ y1: b1.y, y2: b2.y, t: 0 }];
        H.clear(); H.push(0, { y: b1.y, v: b1.v, y2: p.two ? b2.y : NaN, v2: p.two ? 0 : NaN }, true);
        const pr = predict();
        yTop = Math.max(5, pr.ym * 1.1 + 1);
        view.setRange({ ymin: -yTop * 0.06, ymax: yTop });
        const T = MC.niceCeil(Math.max(pr.tv, p.two ? Math.sqrt((2 * p.y0) / g()) : 0) * 1.05);
        gy.set({ tmax: T, series: [{ key: 'y', label: 'bola 1', unit: 'm', color: '--c1', fmt: f2 }].concat(p.two ? [{ key: 'y2', label: 'bola 2', unit: 'm', color: '--c4', fmt: f2 }] : []) });
        gvv.set({ tmax: T, series: [{ key: 'v', label: 'bola 1', unit: 'm/s', color: '--c1', fmt: f2 }].concat(p.two ? [{ key: 'v2', label: 'bola 2', unit: 'm/s', color: '--c4', fmt: f2 }] : []) });
      },
      step(h) {
        const p = sim.p;
        const tPrev = sim.t;
        adv(b1, p.v0, h);
        if (p.two) adv(b2, 0, h);
        const t = tPrev + h;
        H.push(t, { y: b1.y, v: b1.v, y2: p.two ? b2.y : NaN, v2: p.two ? b2.v : NaN }, b1.done && !b1.logged);
        if (b1.done) b1.logged = true;
        if (Math.floor((t + 1e-9) / p.dts) > Math.floor((tPrev + 1e-9) / p.dts)) strobe.push({ y1: b1.done ? null : b1.y, y2: p.two && !b2.done ? b2.y : null, t });
        if (b1.done && (!p.two || b2.done)) sim.end();
      }
    });
    sim.onChange = (id) => { if (id === 'preset') b1.logged = false; };

    sim.onDraw(() => {
      const p = sim.p, G = g();
      view.update();
      let ctx = sc.ctx;
      D.clear(sc);
      view.grid({ labels: 'y', minorLines: true });
      D.ground(ctx, 0, view.Y(0), sc.w, { depth: 14 });
      /* plataforma */
      if (p.y0 > 0.2) {
        const px = view.X(-1.2), py = view.Y(p.y0);
        ctx.save();
        ctx.fillStyle = MC.col('--ground-fill');
        ctx.fillRect(0, py, px, view.Y(0) - py);
        ctx.strokeStyle = MC.col('--ink-2');
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-1, py + 0.5, px + 1, view.Y(0) - py);
        ctx.restore();
      }
      const xb1 = 0.4, xb2 = 2.4;
      const R = Math.max(5, Math.min(11, view.L(0.35)));
      if (p.st) {
        for (const q of strobe) {
          if (q.y1 !== null && q.y1 !== undefined) D.circle(ctx, view.X(xb1), view.Y(q.y1), R * 0.75, { fill: '--c1', fillAlpha: 0.22, color: '--c1', alpha: 0.5, width: 1 });
          if (p.two && q.y2 !== null && q.y2 !== undefined) D.circle(ctx, view.X(xb2), view.Y(q.y2), R * 0.75, { fill: '--c4', fillAlpha: 0.22, color: '--c4', alpha: 0.5, width: 1 });
        }
      }
      /* regla de altura máxima */
      const pr = predict();
      if (p.v0 > 0) {
        D.line(ctx, view.X(-0.6), view.Y(pr.ym), view.X(1.6), view.Y(pr.ym), { color: '--ink-3', dash: [4, 3], width: 1 });
        MC.text(ctx, `y_{máx} = ${f1(pr.ym)} m`, Math.min(view.X(1.8), sc.w - 6), view.Y(pr.ym) - 6, { size: 11.5, mono: true, color: '--ink-2', halo: true, align: view.X(1.8) + 100 > sc.w ? 'right' : 'left' });
      }
      D.ball(ctx, view.X(xb1), view.Y(b1.y) - (b1.done ? R : 0), R, { fill: '--c1' });
      if (p.two) D.ball(ctx, view.X(xb2), view.Y(b2.y) - (b2.done ? R * 0.8 : 0), R * 0.8, { fill: '--c4' });
      if (p.vec && !b1.done) {
        const k = Math.min(3.2, (sc.h * 0.25) / Math.max(10, Math.abs(p.v0), Math.abs(pr.vi)));
        D.vec(ctx, view.X(xb1) - R - 6, view.Y(b1.y), 0, -b1.v * k, { color: '--vel', label: 'v', minLen: 3, labelSide: -1 });
        D.vec(ctx, view.X(xb1) + R + 6, view.Y(b1.y), 0, G * k * 1.2, { color: '--acc', label: 'g', minLen: 3 });
      }
      MC.text(ctx, 'altura y (m)', sc.w - 6, 14, { size: 10.5, mono: true, color: '--ink-3', align: 'right' });
      /* gráficas */
      ctx = gc.ctx;
      D.clear(gc);
      const h2 = gc.h / 2;
      const tnow = sim.t;
      const y0 = p.y0, v0 = p.v0;
      gy.set({ fns: [{ f: (t) => y0 + v0 * t - 0.5 * G * t * t, to: pr.tv }] });
      gvv.set({ fns: [{ f: (t) => v0 - G * t, to: pr.tv }] });
      gy.draw(ctx, { x: 0, y: 0, w: gc.w, h: h2, mb: 30 }, H, { t: tnow, after: (P) => { if (p.v0 > 0) P.hline(pr.ym, { color: '--ink-3', dash: [2, 3] }); } });
      gvv.draw(ctx, { x: 0, y: h2, w: gc.w, h: h2, mb: 36 }, H, { t: tnow, after: (P) => { if (p.v0 > 0) P.vline(pr.ts, { color: '--ink-3', label: 'v = 0', dash: [2, 3] }); } });
      sim.set('t', `${f2(sim.t)} s`);
      sim.set('y', `${f2(b1.y)} m`);
      sim.set('v', `${f2(b1.v)} m/s`);
      sim.set('ts', p.v0 > 0 ? `${f2(pr.ts)} s` : '— (no sube)');
      sim.set('ym', `${f2(pr.ym)} m`);
      sim.set('tv', `${f2(pr.tv)} s`);
      sim.set('vi', `${f2(pr.vi)} m/s`);
    });
  });

  /* ======================================================================
     3.5b  Tiempo de reacción con una regla que cae
     ====================================================================== */
  MC.defineSim('reaccion', function (sim) {
    const cv = sim.canvas({ aspect: 1.0 });
    const G = 9.8;
    let st = 'idle', tRel = 0, timer = null, fallCm = 0, tCatch = 0;
    const tries = [];
    const LEN = 30;
    sim.group('Instrucciones');
    sim.note('1) Presione <b>Preparar</b>. 2) Espere: la regla se soltará en un momento al azar. 3) Cuando empiece a caer, haga clic en <b>¡Atrapar!</b>, en el dibujo o presione la barra espaciadora.');
    const bPrep = sim.button('Preparar', () => arm(), { primary: true, icon: 'play' });
    const bCatch = sim.button('¡Atrapar!', () => grab());
    sim.button('Borrar intentos', () => { tries.length = 0; sim.redraw(); });
    sim.out('last', 'Último intento', { hl: true });
    sim.out('avg', 'Promedio');
    sim.out('best', 'Mejor');
    sim.out('n', 'Intentos válidos');
    sim.animate(() => {
      if (st === 'falling') {
        const t = (performance.now() - tRel) / 1000;
        fallCm = 0.5 * G * t * t * 100;
        if (fallCm >= LEN + 2) { st = 'missed'; fallCm = LEN + 2; sim.pause(); }
      }
    }, { button: false, autoplay: false });
    function arm() {
      if (timer) clearTimeout(timer);
      st = 'armed'; fallCm = 0;
      const delay = 1000 + Math.random() * 2500;
      timer = setTimeout(() => { if (st !== 'armed') return; st = 'falling'; tRel = performance.now(); sim.play(); }, delay);
      sim.redraw();
    }
    function grab() {
      if (st === 'armed') { st = 'early'; clearTimeout(timer); sim.redraw(); return; }
      if (st !== 'falling') return;
      const t = (performance.now() - tRel) / 1000;
      tCatch = t;
      fallCm = 0.5 * G * t * t * 100;
      if (fallCm > LEN) { st = 'missed'; }
      else { st = 'caught'; tries.push({ d: fallCm, t }); }
      sim.pause();
      sim.redraw();
    }
    cv.el.addEventListener('pointerdown', (e) => { if (st === 'falling' || st === 'armed') { e.preventDefault(); grab(); } });
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.key === ' ') && (st === 'falling' || st === 'armed') && sim.visible && sim.active) { e.preventDefault(); grab(); }
    });
    void bPrep; void bCatch;
    sim.onDraw(() => {
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      D.clear(cv);
      const pxcm = Math.min((h - 50) / (2 * LEN + 4), 9.5);
      const rw = Math.max(34, pxcm * 3.6);
      const handY = 30 + (LEN + 2) * pxcm;
      const rx = w * 0.3;
      const off = Math.min(fallCm, LEN + 2) * pxcm;
      /* regla: 0 cm abajo (a la altura de los dedos al inicio) */
      const top = handY - LEN * pxcm + off, bot = handY + off;
      ctx.save();
      ctx.fillStyle = MC.col('--body-a');
      ctx.strokeStyle = MC.shade(MC.col('--body-a'), 0.6);
      ctx.lineWidth = 1.2;
      ctx.fillRect(rx - rw / 2, top, rw, bot - top);
      ctx.strokeRect(rx - rw / 2 + 0.5, top + 0.5, rw - 1, bot - top - 1);
      ctx.strokeStyle = MC.col('--body-ink');
      ctx.beginPath();
      for (let c = 0; c <= LEN * 2; c++) {
        const y = bot - (c / 2) * pxcm;
        const L = c % 10 === 0 ? rw * 0.45 : c % 2 === 0 ? rw * 0.28 : rw * 0.15;
        ctx.moveTo(rx - rw / 2, y); ctx.lineTo(rx - rw / 2 + L, y);
      }
      ctx.stroke();
      ctx.restore();
      for (let c = 0; c <= LEN; c += 5) MC.text(ctx, String(c), rx + rw / 2 - 5, bot - c * pxcm + 4, { size: 11, mono: true, align: 'right', color: '--body-ink' });
      /* mano (dedos) */
      const fx = rx, fy = handY;
      ctx.save();
      ctx.fillStyle = MC.col('--body-c');
      ctx.globalAlpha = 0.85;
      const open = st === 'caught' ? 0 : 1;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        const gx = fx + s * (rw / 2 + 4 + open * 10);
        if (ctx.roundRect) ctx.roundRect(gx - (s > 0 ? 0 : 38), fy - 9, 38, 18, 9); else ctx.rect(gx - (s > 0 ? 0 : 38), fy - 9, 38, 18);
        ctx.fill();
      }
      ctx.restore();
      D.line(ctx, fx - rw, fy, fx + rw + 60, fy, { color: '--ink-3', dash: [3, 3], width: 1 });
      /* panel de estado */
      const px = w * 0.52, pw = w * 0.45;
      const msg = {
        idle: 'Presione “Preparar”.',
        armed: 'Atento… la regla va a caer.',
        falling: '¡Cae!',
        caught: `¡Atrapada a ${f1(fallCm)} cm!`,
        missed: 'Se escapó: más de 30 cm.',
        early: 'Muy pronto: la regla aún no caía.'
      }[st];
      MC.text(ctx, msg, px, 44, { size: 17, weight: 700, color: st === 'caught' ? '--vel' : st === 'missed' || st === 'early' ? '--warn-ink' : '--ink' });
      if (st === 'caught') {
        MC.text(ctx, `t = √(2d/g) = √(2·${MC.fix(fallCm / 100, 3)}/9.8)`, px, 72, { size: 13, mono: true, color: '--ink-2' });
        MC.text(ctx, `t = ${MC.fix(tCatch, 3)} s`, px, 94, { size: 16, mono: true, color: '--accent', weight: 600 });
      }
      /* historial en barras */
      if (tries.length) {
        const bx = px, by = h - 30, bh = Math.min(150, h * 0.4);
        const n = Math.min(tries.length, 12);
        const last = tries.slice(-n);
        const bwid = Math.min(22, (pw - 10) / n - 4);
        MC.text(ctx, 'Tiempos de reacción (s)', bx, by - bh - 10, { size: 11.5, color: '--ink-3', weight: 600 });
        D.line(ctx, bx, by + 0.5, bx + pw - 10, by + 0.5, { color: '--axis', width: 1 });
        last.forEach((q, i) => {
          const hh = (q.t / 0.3) * bh;
          ctx.fillStyle = MC.col(i === n - 1 ? '--accent' : '--c1');
          ctx.globalAlpha = 0.8;
          ctx.fillRect(bx + i * (bwid + 4), by - hh, bwid, hh);
          ctx.globalAlpha = 1;
          MC.text(ctx, MC.fix(q.t, 2), bx + i * (bwid + 4) + bwid / 2, by - hh - 4, { size: 9, mono: true, align: 'center', color: '--ink-3' });
        });
        const yref = by - (0.2 / 0.3) * bh;
        D.line(ctx, bx, yref, bx + pw - 10, yref, { color: '--ink-3', dash: [3, 3], width: 1 });
        MC.text(ctx, '0.20 s', bx + pw - 10, yref - 4, { size: 9.5, mono: true, align: 'right', color: '--ink-3' });
      }
      const ts = tries.map((q) => q.t);
      sim.set('last', ts.length ? `${MC.fix(ts[ts.length - 1], 3)} s (${f1(tries[tries.length - 1].d)} cm)` : '—');
      sim.set('avg', ts.length ? `${MC.fix(M.mean(ts), 3)} s` : '—');
      sim.set('best', ts.length ? `${MC.fix(Math.min(...ts), 3)} s` : '—');
      sim.set('n', String(ts.length));
    });
  });

  /* ======================================================================
     3.6  Encuentros y persecuciones
     ====================================================================== */
  MC.defineSim('encuentro', function (sim) {
    const rc = sim.canvas({ aspect: 4.6, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.55 });
    const rv = new MC.View2D(rc, { xmin: -10, xmax: 400, ymin: -4.2, ymax: 3.4 });
    const H = new MC.History(['xa', 'xb', 'va', 'vb']);
    const gX = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'xa', label: 'A', unit: 'm', color: '--c2', fmt: f1 }, { key: 'xb', label: 'B', unit: 'm', color: '--c1', fmt: f1 }], legend: 'tl' });
    const gV = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'va', label: 'A', unit: 'm/s', color: '--c2', fmt: f1 }, { key: 'vb', label: 'B', unit: 'm/s', color: '--c1', fmt: f1 }], legend: false });
    MC.hover(sim, gc, [gX, gV]);
    sim.group('Móvil A (rojo)');
    sim.slider('xa', { label: 'Posición inicial <i>x</i><sub>A0</sub>', min: -200, max: 800, step: 5, value: 0, unit: 'm', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.slider('va', { label: 'Velocidad inicial <i>v</i><sub>A0</sub>', min: -40, max: 40, step: 0.5, value: 20, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('aa', { label: 'Aceleración <i>a</i><sub>A</sub>', min: -4, max: 4, step: 0.1, value: 0, unit: 'm/s²', fmt: f1, reset: true });
    sim.group('Móvil B (azul)');
    sim.slider('xb', { label: 'Posición inicial <i>x</i><sub>B0</sub>', min: -200, max: 800, step: 5, value: 0, unit: 'm', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.slider('vb', { label: 'Velocidad inicial <i>v</i><sub>B0</sub>', min: -40, max: 40, step: 0.5, value: 0, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('ab', { label: 'Aceleración <i>a</i><sub>B</sub>', min: -4, max: 4, step: 0.1, value: 2.5, unit: 'm/s²', fmt: f1, reset: true });
    sim.slider('tb', { label: 'B arranca en <i>t</i><sub>B</sub>', min: 0, max: 10, step: 0.1, value: 1, unit: 's', fmt: f1, reset: true });
    sim.out('te', 'Tiempo de encuentro', { hl: true });
    sim.out('xe', 'Posición de encuentro', { hl: true });
    sim.out('vae', '<i>v</i><sub>A</sub> en el encuentro');
    sim.out('vbe', '<i>v</i><sub>B</sub> en el encuentro');
    sim.out('dmin', 'Separación mínima (antes de t = T)');
    sim.presets([
      { id: 'patrulla', label: 'La patrulla y el infractor', v: { xa: 0, va: 20, aa: 0, xb: 0, vb: 0, ab: 2.5, tb: 1 }, note: 'A pasa a 72 km/h; la patrulla B sale 1 s después con 2.5 m/s².' },
      { id: 'buses', label: 'Dos buses en sentidos opuestos', v: { xa: 0, va: 15, aa: 0, xb: 600, vb: -12, ab: 0, tb: 0 }, note: 'Separados 600 m, se acercan a 15 + 12 = 27 m/s: se cruzan en 22.2 s.' },
      { id: 'ciclista', label: 'Corredor que alcanza a un ciclista', v: { xa: 50, va: 6, aa: 0, xb: 0, vb: 4, ab: 0.5, tb: 0 } },
      { id: 'bus', label: 'El pasajero que pierde el bus', v: { xa: 25, va: 0, aa: 1, xb: 0, vb: 6, ab: 0, tb: 0 }, note: 'El bus A arranca con 1 m/s² cuando el pasajero B, que corre a 6 m/s, está 25 m atrás. Nunca lo alcanza: se acerca hasta 7 m.' }
    ]);
    const xA = (t) => sim.p.xa + sim.p.va * t + 0.5 * sim.p.aa * t * t;
    const vA = (t) => sim.p.va + sim.p.aa * t;
    const xB = (t) => { const p = sim.p; if (t < p.tb) return p.xb; const u = t - p.tb; return p.xb + p.vb * u + 0.5 * p.ab * u * u; };
    const vB = (t) => { const p = sim.p; return t < p.tb ? 0 : p.vb + p.ab * (t - p.tb); };
    function meet() {
      const p = sim.p;
      const roots = [];
      /* tramo 1: B quieto */
      for (const r of M.quad(0.5 * p.aa, p.va, p.xa - p.xb)) if (r > 1e-3 && r < p.tb) roots.push(r);
      /* tramo 2: t ≥ tB */
      const A2 = 0.5 * p.aa - 0.5 * p.ab;
      const B2 = p.va - p.vb + p.ab * p.tb;
      const C2 = p.xa - p.xb + p.vb * p.tb - 0.5 * p.ab * p.tb * p.tb;
      for (const r of M.quad(A2, B2, C2)) if (r > 1e-3 && r >= p.tb) roots.push(r);
      roots.sort((a, b) => a - b);
      return roots.length ? roots[0] : null;
    }
    let T = 30, te = null;
    sim.run({
      reset() {
        te = meet();
        T = te !== null ? M.clamp(MC.niceCeil(te * 1.25), 8, 80) : 30;
        H.clear(); H.push(0, { xa: xA(0), xb: xB(0), va: vA(0), vb: vB(0) }, true);
        gX.set({ tmax: T }); gV.set({ tmax: T });
        let lo = Infinity, hi = -Infinity;
        for (let i = 0; i <= 200; i++) { const t = (T * i) / 200; lo = Math.min(lo, xA(t), xB(t)); hi = Math.max(hi, xA(t), xB(t)); }
        const [a, b] = MC.niceRange(lo, hi, { zero: false, pad: 0.06, minSpan: 50 });
        rv.setRange({ xmin: a, xmax: b });
      },
      step(h) {
        const t = sim.t + h;
        H.push(t, { xa: xA(t), xb: xB(t), va: vA(t), vb: vB(t) });
        if (t >= T - 1e-9) sim.end();
      },
      h: 1 / 200
    });
    sim.setSpeed(2);
    sim.onDraw(() => {
      const t = sim.t;
      rv.update();
      let ctx = rc.ctx;
      D.clear(rc);
      road(ctx, rv, rc);
      const clen = M.clamp(rv.L(4.5), 26, 60);
      D.car(ctx, rv.X(xA(t)), rv.Y(0) - 1, clen, { color: '--c2', dir: vA(t) < 0 ? -1 : 1, label: 'A' });
      D.car(ctx, rv.X(xB(t)), rv.Y(0) + 7, clen, { color: '--c1', dir: vB(t) < 0 || (vB(t) === 0 && sim.p.vb < 0) ? -1 : 1, label: 'B' });
      if (te !== null) {
        const X = rv.X(xA(te));
        D.line(ctx, X, rv.Y(2.2), X, rv.Y(-1.4), { color: '--accent', dash: [4, 3], width: 1.5 });
        MC.text(ctx, 'encuentro', X, rv.Y(2.2) - 4, { size: 11, align: 'center', color: '--accent', halo: true });
      }
      ctx = gc.ctx;
      D.clear(gc);
      const hX = gc.h * 0.6;
      gX.set({ fns: [{ f: xA, color: '--c2', alpha: 0.45 }, { f: xB, color: '--c1', alpha: 0.45 }] });
      gV.set({ fns: [{ f: vA, color: '--c2', alpha: 0.45 }, { f: vB, color: '--c1', alpha: 0.45 }] });
      gX.draw(ctx, { x: 0, y: 0, w: gc.w, h: hX, mb: 28 }, H, {
        t, after: (P) => {
          if (te !== null) { P.dot(te, xA(te), { color: '--accent', r: 5.5, label: `(${f1(te)} s, ${f1(xA(te))} m)`, mono: true }); }
        }
      });
      gV.draw(ctx, { x: 0, y: hX, w: gc.w, h: gc.h - hX, mb: 36 }, H, { t, after: (P) => { if (te !== null) P.vline(te, { color: '--accent', dash: [3, 3] }); } });
      /* separación mínima */
      let dmin = Infinity, tmin = 0;
      for (let i = 0; i <= 400; i++) { const tt = (T * i) / 400; const d = Math.abs(xA(tt) - xB(tt)); if (d < dmin) { dmin = d; tmin = tt; } }
      sim.set('te', te !== null ? `${f2(te)} s` : 'no se encuentran');
      sim.set('xe', te !== null ? `${f1(xA(te))} m` : '—');
      sim.set('vae', te !== null ? `${f1(vA(te))} m/s` : '—');
      sim.set('vbe', te !== null ? `${f1(vB(te))} m/s` : '—');
      sim.set('dmin', `${f1(dmin)} m en t = ${f1(tmin)} s`);
    });
    sim.applyPreset('patrulla', true);
  });
})();
