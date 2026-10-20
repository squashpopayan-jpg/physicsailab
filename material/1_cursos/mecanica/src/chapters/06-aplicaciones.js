/* Capítulo 7 — Aplicaciones de las leyes de Newton */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0);
  const G = 9.8;

  /* ======================================================================
     6.1  Fricción estática y cinética con un dinamómetro
     ====================================================================== */
  MC.defineSim('friccion', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.3 });
    const view = new MC.View2D(cv, { xmin: -1.2, xmax: 9.5, ymin: -0.9, ymax: 2.0 });
    const H = new MC.History(['F', 'f', 'v'], { minDt: 1 / 90 });
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 5 });
    const FG = { plot: null, hx: null };
    MC.hover(sim, gc, [gv]);
    const s = { x: 0, v: 0, F: 0, f: 0, moving: false, slipF: null };
    const FR = MC.phys.FRICTION;
    sim.group('Superficies');
    sim.select('mat', { label: 'Par de materiales', value: 'madera-madera', options: FR.map((r) => [r[0], `${r[1]} (μs ${r[2]}, μk ${r[3]})`]), reset: true });
    sim.slider('m', { label: 'Masa del bloque <i>m</i>', min: 1, max: 100, step: 1, value: 40, unit: 'kg', fmt: f0, reset: true });
    sim.group('Fuerza aplicada');
    sim.seg('mode', { options: [['rampa', 'Crece sola'], ['manual', 'A mano']], value: 'rampa', reset: true });
    sim.slider('rate', { label: 'Rapidez de aumento de <i>F</i>', min: 5, max: 200, step: 5, value: 60, unit: 'N/s', fmt: f0, reset: true });
    sim.slider('F', { label: 'Fuerza <i>F</i> (modo a mano)', min: 0, max: 800, step: 2, value: 0, unit: 'N', fmt: f0 });
    sim.out('n', 'Normal <i>n</i> = <i>mg</i>');
    sim.out('fs', 'Fricción estática máxima μ<sub>s</sub><i>n</i>');
    sim.out('fk', 'Fricción cinética μ<sub>k</sub><i>n</i>');
    sim.out('F', 'Fuerza aplicada <i>F</i>', { hl: true });
    sim.out('f', 'Fricción <i>f</i>', { hl: true });
    sim.out('st', 'Estado');
    sim.out('a', 'Aceleración');
    sim.presets([
      { id: 'mueble', label: 'Arrastrar un mueble de madera (40 kg)', v: { mat: 'madera-madera', m: 40, mode: 'rampa', rate: 60 } },
      { id: 'hielo', label: 'Bloque sobre hielo (70 kg)', v: { mat: 'hielo-hielo', m: 70, mode: 'rampa', rate: 20 } },
      { id: 'mojado', label: 'Llanta sobre concreto mojado (20 kg)', v: { mat: 'caucho-concreto-mojado', m: 20, mode: 'rampa', rate: 60 } },
      { id: 'seco', label: 'Llanta sobre concreto seco (20 kg)', v: { mat: 'caucho-concreto-seco', m: 20, mode: 'rampa', rate: 60 } },
      { id: 'teflon', label: 'Sartén de teflón (μs = μk)', v: { mat: 'teflon-teflon', m: 10, mode: 'rampa', rate: 5 } }
    ]);
    const mat = () => FR.find((r) => r[0] === sim.p.mat) || FR[0];
    const vis = () => { sim.ctl.rate.show(sim.p.mode === 'rampa'); sim.ctl.F.show(sim.p.mode === 'manual'); };
    sim.onChange = () => vis();
    vis();
    sim.run({
      reset() { s.x = 0; s.v = 0; s.F = 0; s.f = 0; s.moving = false; s.slipF = null; s.a = 0; H.clear(); H.push(0, s, true); },
      step(h) {
        const p = sim.p, [, , ms, mk] = mat(), n = p.m * G;
        s.F = p.mode === 'rampa' ? p.rate * (sim.t + h) : p.F;
        if (!s.moving) {
          if (s.F > ms * n) { s.moving = true; if (s.slipF === null) s.slipF = s.F; }
          else { s.f = s.F; s.a = 0; }
        }
        if (s.moving) {
          s.f = mk * n;
          s.a = (s.F - s.f) / p.m;
          s.v += s.a * h;
          if (s.v <= 0) { s.v = 0; s.moving = false; s.f = Math.min(s.F, ms * n); s.a = 0; }
          s.x += s.v * h;
        }
        H.push(sim.t + h, s);
        if (s.x > 8 || (p.mode === 'rampa' && s.F > ms * n * 1.7 + 20) || sim.t > 60) sim.end();
      },
      h: 1 / 500
    });
    sim.onDraw(() => {
      const p = sim.p, [, , ms, mk] = mat(), n = p.m * G;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      MC.floorRuler(ctx, view, cv, 0);
      const bx = view.X(s.x + 0.6), by = view.Y(0);
      const bw = view.L(1.2), bh = view.L(0.7);
      D.block(ctx, bx, by - bh / 2, bw, bh, { fill: '--wood', label: `${f0(p.m)} kg` });
      /* dinamómetro */
      const hx = bx + bw / 2 + 30 + Math.min(80, s.F / 10);
      D.spring(ctx, bx + bw / 2, by - bh / 2, hx - 14, by - bh / 2, { n: 8, amp: 5, color: '--ink-2' });
      D.block(ctx, hx, by - bh / 2, 28, 16, { fill: '--metal', r: 3 });
      MC.text(ctx, `${f0(s.F)} N`, hx, by - bh / 2 - 14, { size: 12, mono: true, align: 'center', color: '--force', weight: 600, halo: true });
      const k = 90 / Math.max(ms * n, 1);
      if (s.F > 0.5) D.vec(ctx, bx + bw / 2, by - bh * 0.85, Math.min(s.F * k, 160), 0, { color: '--force', label: 'F' });
      if (s.f > 0.5) D.vec(ctx, bx, by - 2, -Math.min(s.f * k, 160), 0, { color: '--fric', label: 'f' });
      /* gráfica f contra F */
      const gctx = gc.ctx;
      D.clear(gc);
      const Fmax = MC.niceCeil(Math.max(ms * n * 1.6, 10));
      const P = FG.plot || (FG.plot = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w * 0.55, h: gc.h, xmin: 0, xmax: Fmax, ymin: 0, ymax: MC.niceCeil(ms * n * 1.25), xlabel: ['F', 'N'], ylabel: ['f', 'N'], title: 'Fricción contra fuerza aplicada', mt: 22, mb: 34 });
      P.frame();
      P.line(0, 0, 1, { color: '--ink-3', dash: [4, 4], width: 1.2 });
      P.hline(ms * n, { color: '--fric', dash: [6, 4], label: `μs n = ${f0(ms * n)} N`, labelRight: true });
      P.hline(mk * n, { color: '--fric', dash: [2, 3], label: `μk n = ${f0(mk * n)} N`, labelRight: true, below: true });
      P.xy(H.d.F, H.d.f, { color: '--fric', width: 2.6 });
      if (H.n) P.dot(s.F, s.f, { color: '--fric', r: 4.5 });
      if (s.slipF !== null) P.vline(s.slipF, { color: '--ink-3', label: 'arranca', dash: [3, 3] });
      gv.draw(gctx, { x: gc.w * 0.55, y: 0, w: gc.w * 0.45, h: gc.h, mb: 34 }, H, { t: sim.t });
      sim.set('n', `${f1(n)} N`);
      sim.set('fs', `${f1(ms * n)} N`);
      sim.set('fk', `${f1(mk * n)} N`);
      sim.set('F', `${f1(s.F)} N`);
      sim.set('f', `${f1(s.f)} N (${s.moving ? 'cinética' : 'estática'})`);
      sim.set('st', s.moving ? '<span class="warnv">deslizando</span>' : 'en reposo');
      sim.set('a', `${f2(s.a || 0)} m/s²`);
    });
  });

  /* ======================================================================
     6.2  Plano inclinado con fricción
     ====================================================================== */
  MC.defineSim('plano-inclinado', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const gc = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -0.8, xmax: 6.4, ymin: -0.6, ymax: 4, align: 'bottom left', padL: 8, padB: 10, padR: 8, padT: 8 });
    const L = 5;
    const H = new MC.History(['v', 's']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v (+ sube)', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 4, minSpan: 1 });
    const gs = new MC.TGraph({ ylabel: ['s', 'm'], series: [{ key: 's', label: 's', unit: 'm', color: '--pos', fmt: f2 }], legend: false, tspan: 4, zero: true, ymin: 0, ymax: L });
    MC.hover(sim, gc, [gv, gs]);
    const s = { s: 3.5, v: 0, a: 0, f: 0, tilting: false, thc: null };
    const st = sim.status(cv);
    sim.group('Plano');
    sim.slider('th', { label: 'Ángulo del plano θ', min: 0, max: 70, step: 0.5, value: 25, unit: '°', fmt: f1, reset: true });
    sim.slider('ms', { label: 'Coeficiente estático μ<sub>s</sub>', min: 0, max: 1.2, step: 0.01, value: 0.5, fmt: f2, reset: true });
    sim.slider('mk', { label: 'Coeficiente cinético μ<sub>k</sub>', min: 0, max: 1.2, step: 0.01, value: 0.35, fmt: f2, reset: true });
    sim.group('Bloque');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 1, max: 100, step: 1, value: 20, unit: 'kg', fmt: f0, reset: true });
    sim.slider('F', { label: 'Fuerza aplicada paralela al plano (+ hacia arriba)', min: -400, max: 400, step: 5, value: 0, unit: 'N', fmt: f0 });
    sim.slider('v0', { label: 'Velocidad inicial (+ hacia arriba)', min: -5, max: 5, step: 0.1, value: 0, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('s0', { label: 'Posición inicial a lo largo del plano', min: 0.3, max: 4.7, step: 0.1, value: 3.5, unit: 'm', fmt: f1, reset: true });
    sim.button('Inclinar lentamente desde 0°', () => {
      sim.ctl.th.set(0, true); sim.reset(); s.tilting = true; s.thc = null; st.show('Inclinando el plano 2° por segundo…'); sim.play();
    }, { newRow: true });
    sim.check('comp', { label: 'Componentes del peso', value: true });
    sim.out('wp', 'Componente del peso <i>mg</i> sen θ');
    sim.out('n', 'Normal <i>n</i> = <i>mg</i> cos θ');
    sim.out('f', 'Fricción <i>f</i>', { hl: true });
    sim.out('Fn', 'Fuerza neta paralela al plano');
    sim.out('a', 'Aceleración (+ hacia arriba)', { hl: true });
    sim.out('thc', 'Ángulo crítico tan⁻¹ μ<sub>s</sub>');
    sim.out('st', 'Estado');
    sim.presets([
      { id: 'tobogan', label: 'Niño en un tobogán (35°, μk = 0.20)', v: { th: 35, ms: 0.3, mk: 0.2, m: 30, F: 0, v0: 0, s0: 4.0 }, note: 'a = g(sen 35° − 0.20 cos 35°) = 4.0 m/s².' },
      { id: 'caja', label: 'Caja en una rampa que no desliza', v: { th: 20, ms: 0.5, mk: 0.4, m: 20, F: 0, v0: 0, s0: 3.5 }, note: 'tan 20° = 0.36 < μs = 0.5: la fricción estática la sostiene.' },
      { id: 'auto', label: 'Auto estacionado en una calle empinada', v: { th: 15, ms: 1.0, mk: 0.8, m: 100, F: 0, v0: 0, s0: 3 }, note: 'Con caucho sobre concreto seco (μs = 1) se sostendría hasta 45°. Pruebe “Inclinar lentamente”.' },
      { id: 'lisa', label: 'Plano sin fricción a 30°', v: { th: 30, ms: 0, mk: 0, m: 20, F: 0, v0: 0, s0: 4.5 }, note: 'a = g sen 30° = 4.9 m/s², sin importar la masa.' },
      { id: 'empujar', label: 'Empujar una caja cuesta arriba', v: { th: 20, ms: 0.4, mk: 0.3, m: 30, F: 250, v0: 0, s0: 0.5 } },
      { id: 'lanzar', label: 'Lanzar el bloque hacia arriba', v: { th: 25, ms: 0.3, mk: 0.2, m: 5, F: 0, v0: 4, s0: 0.4 }, note: 'Sube frenando con más aceleración de la que tiene al bajar: la fricción cambia de sentido.' }
    ]);
    const forces = (th) => {
      const p = sim.p, n = p.m * G * Math.cos(th), wp = -p.m * G * Math.sin(th);
      let f;
      if (Math.abs(s.v) > 1e-7) f = -Math.sign(s.v) * p.mk * n;
      else {
        const net0 = p.F + wp;
        f = Math.abs(net0) <= p.ms * n ? -net0 : -Math.sign(net0) * p.mk * n;
      }
      return { n, wp, f, net: p.F + wp + f };
    };
    sim.run({
      reset() { s.s = sim.p.s0; s.v = sim.p.v0; s.a = 0; s.f = 0; s.tilting = false; st.hide(); H.clear(); H.push(0, s, true); },
      step(h) {
        const p = sim.p;
        if (s.tilting && s.thc === null) sim.ctl.th.set(Math.min(70, p.th + 2 * h), true);
        const th = M.rad(p.th);
        const F = forces(th);
        s.f = F.f; s.a = F.net / p.m;
        let vn = s.v + s.a * h;
        if (Math.abs(s.v) > 1e-7 && vn * s.v < 0) vn = 0;
        s.s += 0.5 * (s.v + vn) * h;
        s.v = vn;
        if (s.tilting && s.thc === null && Math.abs(s.v) > 1e-4) { s.thc = p.th; s.tilting = false; st.show(`Empezó a deslizar a θ = ${f1(p.th)}° (tan⁻¹ μs = ${f1(M.deg(Math.atan(p.ms)))}°)`, 'good'); }
        H.push(sim.t + h, s);
        if (s.s <= 0.3 || s.s >= L - 0.25) { s.s = M.clamp(s.s, 0.3, L - 0.25); H.push(sim.t + h, s, true); sim.end(); }
        if (sim.t > 60) sim.end();
      },
      h: 1 / 600
    });
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th);
      view.setRange({ xmax: L * Math.cos(th) + 1.3, ymax: Math.max(2.4, L * Math.sin(th) + 1.4) });
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: false });
      /* rampa */
      const A = [view.X(0), view.Y(0)], B = [view.X(L * Math.cos(th)), view.Y(0)], C = [view.X(L * Math.cos(th)), view.Y(L * Math.sin(th))];
      D.poly(ctx, [A, B, C], { close: true, fill: '--ground-fill', color: '--ink-2', width: 1.5 });
      D.ground(ctx, 0, view.Y(0), cv.w, { fill: false, depth: 10 });
      D.angle(ctx, A[0], A[1], 46, 0, th, { label: 'θ', labelR: 12 });
      /* bloque */
      const bw = 0.8, bh = 0.5;
      const cx = (s.s) * Math.cos(th) - (bh / 2) * Math.sin(th), cy = (s.s) * Math.sin(th) + (bh / 2) * Math.cos(th);
      const X = view.X(cx), Y = view.Y(cy);
      D.block(ctx, X, Y, view.L(bw), view.L(bh), { fill: '--body-a', ang: th });
      const F = forces(th);
      const k = view.L(1.6) / Math.max(p.m * G, 1);
      const ux = Math.cos(th), uy = Math.sin(th), nx = -Math.sin(th), ny = Math.cos(th);
      D.vec(ctx, X, Y, 0, p.m * G * k, { color: '--weight', label: 'mg' });
      if (p.comp) {
        D.vec(ctx, X, Y, -ux * p.m * G * Math.sin(th) * k, uy * p.m * G * Math.sin(th) * k, { color: '--weight', width: 1.4, dash: [4, 3], label: 'mg sen θ', size: 11, minLen: 4 });
        D.vec(ctx, X, Y, -nx * p.m * G * Math.cos(th) * k, ny * p.m * G * Math.cos(th) * k, { color: '--weight', width: 1.4, dash: [4, 3], label: 'mg cos θ', size: 11, labelSide: -1, minLen: 4 });
      }
      D.vec(ctx, X, Y, nx * F.n * k, -ny * F.n * k, { color: '--normal', label: 'n' });
      if (Math.abs(F.f) > 0.01) D.vec(ctx, X - nx * view.L(bh / 2), Y + ny * view.L(bh / 2), ux * F.f * k, -uy * F.f * k, { color: '--fric', label: 'f' });
      if (Math.abs(p.F) > 0.5) D.vec(ctx, X, Y, ux * p.F * k, -uy * p.F * k, { color: '--force', label: 'F' });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      gs.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      const moving = Math.abs(s.v) > 1e-6 || Math.abs(F.net) > 1e-6;
      sim.set('wp', `${f1(p.m * G * Math.sin(th))} N`);
      sim.set('n', `${f1(F.n)} N`);
      sim.set('f', `${f1(Math.abs(F.f))} N ${F.f > 0 ? 'hacia arriba' : F.f < 0 ? 'hacia abajo' : ''} (${Math.abs(s.v) > 1e-7 ? 'cinética' : 'estática'})`);
      sim.set('Fn', `${f1(F.net)} N`);
      sim.set('a', `${f2(F.net / p.m)} m/s²`);
      sim.set('thc', `${f1(M.deg(Math.atan(p.ms)))}°`);
      sim.set('st', moving ? (s.v > 0 ? 'sube' : s.v < 0 ? 'baja' : 'arrancando') : 'en reposo');
    });
  });

  /* ======================================================================
     6.3  Poleas: Atwood, mesa y rampa
     ====================================================================== */
  MC.defineSim('poleas', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const gc = sim.canvas({ aspect: 3.6, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -4.8, xmax: 2.4, ymin: -0.3, ymax: 4.6 });
    const H = new MC.History(['v', 'T']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 3, minSpan: 1 });
    const gT = new MC.TGraph({ ylabel: ['T', 'N'], series: [{ key: 'T', label: 'T', unit: 'N', color: '--tension', fmt: f1 }], legend: false, tspan: 3 });
    MC.hover(sim, gc, [gv, gT]);
    const s = { d: 0, v: 0, a: 0, T: 0, ang: 0 };
    sim.group('Montaje');
    sim.seg('mode', { options: [['atwood', 'Atwood'], ['mesa', 'Mesa'], ['rampa', 'Rampa']], value: 'atwood', reset: true });
    sim.slider('m1', { label: 'Masa <i>m</i>₁', min: 0.1, max: 20, step: 0.1, value: 2, unit: 'kg', fmt: f1, reset: true });
    sim.slider('m2', { label: 'Masa <i>m</i>₂ (colgante)', min: 0.1, max: 20, step: 0.1, value: 2.5, unit: 'kg', fmt: f1, reset: true });
    sim.slider('th', { label: 'Ángulo de la rampa θ', min: 5, max: 60, step: 1, value: 30, unit: '°', fmt: f0, reset: true });
    sim.slider('ms', { label: 'Fricción estática μ<sub>s</sub> (sobre <i>m</i>₁)', min: 0, max: 1, step: 0.01, value: 0.3, fmt: f2, reset: true });
    sim.slider('mk', { label: 'Fricción cinética μ<sub>k</sub>', min: 0, max: 1, step: 0.01, value: 0.2, fmt: f2, reset: true });
    sim.out('a', 'Aceleración <i>a</i> (<i>m</i>₂ baja +)', { hl: true });
    sim.out('T', 'Tensión <i>T</i>', { hl: true });
    sim.out('w2', 'Peso de <i>m</i>₂');
    sim.out('fr', 'Fricción sobre <i>m</i>₁');
    sim.out('v', 'Rapidez');
    sim.presets([
      { id: 'atwood', label: 'Máquina de Atwood (2.0 y 2.5 kg)', v: { mode: 'atwood', m1: 2, m2: 2.5 }, note: 'a = (m₂ − m₁)g/(m₁ + m₂) = 1.09 m/s²; T = 21.8 N.' },
      { id: 'ascensor', label: 'Ascensor y contrapeso casi iguales', v: { mode: 'atwood', m1: 10, m2: 10.5 }, note: 'La aceleración es pequeñísima: el motor sólo debe vencer la diferencia de pesos.' },
      { id: 'mesa', label: 'Bloque de 5 kg en una mesa y pesa de 2 kg', v: { mode: 'mesa', m1: 5, m2: 2, ms: 0.3, mk: 0.2 }, note: 'a = 1.40 m/s² y T = 16.8 N (ejemplo resuelto).' },
      { id: 'quieto', label: 'La fricción estática lo impide', v: { mode: 'mesa', m1: 10, m2: 3, ms: 0.4, mk: 0.3 }, note: 'm₂g = 29.4 N < μs m₁g = 39.2 N: el sistema no arranca y T = m₂g.' },
      { id: 'rampa', label: 'Bloque en una rampa y pesa colgante', v: { mode: 'rampa', m1: 5, m2: 4, th: 30, ms: 0.2, mk: 0.1 } }
    ]);
    const vis = () => { const m = sim.p.mode; sim.ctl.th.show(m === 'rampa'); sim.ctl.ms.show(m !== 'atwood'); sim.ctl.mk.show(m !== 'atwood'); };
    sim.onChange = () => vis();
    vis();
    const dyn = () => {
      const p = sim.p, th = M.rad(p.th);
      let Dr, N1 = 0;
      if (p.mode === 'atwood') Dr = (p.m2 - p.m1) * G;
      else if (p.mode === 'mesa') { Dr = p.m2 * G; N1 = p.m1 * G; }
      else { Dr = p.m2 * G - p.m1 * G * Math.sin(th); N1 = p.m1 * G * Math.cos(th); }
      const Mt = p.m1 + p.m2;
      let fr = 0, a;
      if (p.mode === 'atwood') a = Dr / Mt;
      else if (Math.abs(s.v) > 1e-7) { fr = -Math.sign(s.v) * p.mk * N1; a = (Dr + fr) / Mt; }
      else if (Math.abs(Dr) <= p.ms * N1) { fr = -Dr; a = 0; }
      else { fr = -Math.sign(Dr) * p.mk * N1; a = (Dr + fr) / Mt; }
      return { a, fr, T: p.m2 * (G - a) };
    };
    /* ¿siguen los bloques dentro del montaje? */
    const inside = () => {
      const p = sim.p, th = M.rad(p.th), r = 0.3;
      const s1 = 0.35 + 0.12 * Math.cbrt(p.m1), s2 = 0.35 + 0.12 * Math.cbrt(p.m2);
      if (p.mode === 'atwood') { const y1 = 2 + s.d, y2 = 2 - s.d; return y1 - s1 / 2 > 0.05 && y2 - s2 / 2 > 0.05 && y1 + s1 / 2 < 3.62 && y2 + s2 / 2 < 3.62; }
      if (p.mode === 'mesa') { const x1 = -3 + s.d, y2 = 1.4 - s.d; return x1 + s1 / 2 < -0.05 && x1 - s1 / 2 > -4.5 && y2 - s2 / 2 > 0.05 && y2 + s2 / 2 < 2.35; }
      const Lr = 3.6, pyl = Lr * Math.sin(th) + 0.15 + r, along = 1.4 + s.d, y2 = pyl - 0.9 - s.d;
      return along + s1 / 2 < Lr - 0.2 && along - s1 / 2 > 0.05 && y2 - s2 / 2 > 0.05 && y2 + s2 / 2 < pyl - r - 0.05;
    };
    sim.run({
      reset() { s.d = 0; s.v = 0; s.ang = 0; const q = dyn(); s.a = q.a; s.T = q.T; H.clear(); H.push(0, s, true); },
      step(h) {
        const q = dyn();
        s.a = q.a; s.T = q.T;
        let vn = s.v + s.a * h;
        if (sim.p.mode !== 'atwood' && Math.abs(s.v) > 1e-7 && vn * s.v < 0) vn = 0;
        s.d += 0.5 * (s.v + vn) * h;
        s.ang -= (0.5 * (s.v + vn) * h) / 0.3;
        s.v = vn;
        H.push(sim.t + h, s);
        if (!inside() || sim.t > 30) sim.end();
      },
      h: 1 / 600
    });
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th);
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: false });
      D.ground(ctx, 0, view.Y(0), cv.w, { depth: 10 });
      const r = 0.3, sq = (m) => 0.35 + 0.12 * Math.cbrt(m);
      const q = dyn();
      const kf = view.L(1.3) / Math.max(p.m1 * G, p.m2 * G, 1);
      if (p.mode === 'atwood') {
        const px = 0, py = 4.0;
        D.line(ctx, view.X(px), view.Y(4.45), view.X(px), view.Y(py), { color: '--ink-2', width: 3 });
        D.ceiling(ctx, view.X(-0.8), view.Y(4.45), view.X(0.8));
        const y1 = 2.0 + s.d, y2 = 2.0 - s.d;
        const s1 = sq(p.m1), s2 = sq(p.m2);
        D.rope(ctx, [[view.X(-r), view.Y(py)], [view.X(-r), view.Y(y1 + s1 / 2)]]);
        D.rope(ctx, [[view.X(r), view.Y(py)], [view.X(r), view.Y(y2 + s2 / 2)]]);
        D.pulley(ctx, view.X(px), view.Y(py), view.L(r), { ang: s.ang });
        D.block(ctx, view.X(-r), view.Y(y1), view.L(s1), view.L(s1), { fill: '--body-b', label: 'm₁' });
        D.block(ctx, view.X(r), view.Y(y2), view.L(s2), view.L(s2), { fill: '--body-c', label: 'm₂' });
        D.vec(ctx, view.X(-r - s1 / 2 - 0.12), view.Y(y1), 0, p.m1 * G * kf, { color: '--weight', label: 'm₁g', size: 12 });
        D.vec(ctx, view.X(-r - s1 / 2 - 0.12), view.Y(y1), 0, -q.T * kf, { color: '--tension', label: 'T', size: 12, labelSide: -1 });
        D.vec(ctx, view.X(r + s2 / 2 + 0.12), view.Y(y2), 0, p.m2 * G * kf, { color: '--weight', label: 'm₂g', size: 12 });
        D.vec(ctx, view.X(r + s2 / 2 + 0.12), view.Y(y2), 0, -q.T * kf, { color: '--tension', label: 'T', size: 12 });
      } else if (p.mode === 'mesa') {
        const ty = 2.4;
        ctx.save();
        ctx.fillStyle = MC.col('--wood');
        ctx.fillRect(view.X(-4.6), view.Y(ty), view.X(0) - view.X(-4.6), view.L(0.14));
        ctx.fillRect(view.X(-4.4), view.Y(ty - 0.14), view.L(0.14), view.Y(0) - view.Y(ty - 0.14));
        ctx.fillRect(view.X(-0.35), view.Y(ty - 0.14), view.L(0.14), view.Y(0) - view.Y(ty - 0.14));
        ctx.restore();
        const pxl = 0.25, pyl = ty + r;
        const s1 = sq(p.m1), s2 = sq(p.m2);
        const x1 = -3.0 + s.d, y2 = 1.4 - s.d;
        D.rope(ctx, [[view.X(x1 + s1 / 2), view.Y(ty + s1 / 2)], [view.X(pxl), view.Y(ty + s1 / 2)]]);
        D.rope(ctx, [[view.X(pxl + r), view.Y(pyl)], [view.X(pxl + r), view.Y(y2 + s2 / 2)]]);
        D.line(ctx, view.X(0), view.Y(ty + 0.07), view.X(pxl), view.Y(pyl), { color: '--ink-2', width: 3 });
        D.pulley(ctx, view.X(pxl), view.Y(pyl), view.L(r), { ang: s.ang });
        D.block(ctx, view.X(x1), view.Y(ty + s1 / 2), view.L(s1), view.L(s1), { fill: '--body-b', label: 'm₁' });
        D.block(ctx, view.X(pxl + r), view.Y(y2), view.L(s2), view.L(s2), { fill: '--body-c', label: 'm₂' });
        D.vec(ctx, view.X(x1 + s1 / 2), view.Y(ty + s1 * 0.8), q.T * kf, 0, { color: '--tension', label: 'T', size: 12 });
        if (Math.abs(q.fr) > 0.01) D.vec(ctx, view.X(x1), view.Y(ty + 0.02), q.fr * kf, 0, { color: '--fric', label: 'f', size: 12 });
        D.vec(ctx, view.X(pxl + r + s2 / 2 + 0.12), view.Y(y2), 0, p.m2 * G * kf, { color: '--weight', label: 'm₂g', size: 12 });
        D.vec(ctx, view.X(pxl + r + s2 / 2 + 0.12), view.Y(y2), 0, -q.T * kf, { color: '--tension', label: 'T', size: 12 });
      } else {
        const Lr = 3.6, top = [0, Lr * Math.sin(th) + 0.1];
        const base = [-Lr * Math.cos(th), 0.1];
        D.poly(ctx, [[view.X(base[0]), view.Y(0)], [view.X(0), view.Y(0)], [view.X(0), view.Y(top[1])]], { close: true, fill: '--ground-fill', color: '--ink-2', width: 1.4 });
        D.angle(ctx, view.X(base[0]), view.Y(0), 40, 0, th, { label: 'θ', labelR: 10 });
        const pxl = 0.25, pyl = top[1] + 0.05 + r;
        const s1 = sq(p.m1), s2 = sq(p.m2);
        const along = 1.4 + s.d;
        const ux = Math.cos(th), uy = Math.sin(th), nx = -Math.sin(th), ny = Math.cos(th);
        const cx = base[0] + along * ux + nx * s1 / 2, cy = 0 + along * uy + ny * s1 / 2;
        D.rope(ctx, [[view.X(cx + ux * s1 / 2), view.Y(cy + uy * s1 / 2)], [view.X(pxl - r * Math.sin(th)), view.Y(pyl + r * Math.cos(th))]]);
        const y2 = pyl - 0.9 - s.d;
        D.rope(ctx, [[view.X(pxl + r), view.Y(pyl)], [view.X(pxl + r), view.Y(y2 + s2 / 2)]]);
        D.pulley(ctx, view.X(pxl), view.Y(pyl), view.L(r), { ang: s.ang });
        D.block(ctx, view.X(cx), view.Y(cy), view.L(s1), view.L(s1), { fill: '--body-b', label: 'm₁', ang: th });
        D.block(ctx, view.X(pxl + r), view.Y(y2), view.L(s2), view.L(s2), { fill: '--body-c', label: 'm₂' });
        D.vec(ctx, view.X(cx), view.Y(cy), ux * q.T * kf, -uy * q.T * kf, { color: '--tension', label: 'T', size: 12 });
        D.vec(ctx, view.X(cx), view.Y(cy), 0, p.m1 * G * kf, { color: '--weight', label: 'm₁g', size: 12 });
        if (Math.abs(q.fr) > 0.01) D.vec(ctx, view.X(cx - nx * s1 / 2), view.Y(cy - ny * s1 / 2), ux * q.fr * kf, -uy * q.fr * kf, { color: '--fric', label: 'f', size: 12 });
        D.vec(ctx, view.X(pxl + r + s2 / 2 + 0.12), view.Y(y2), 0, p.m2 * G * kf, { color: '--weight', label: 'm₂g', size: 12 });
        D.vec(ctx, view.X(pxl + r + s2 / 2 + 0.12), view.Y(y2), 0, -q.T * kf, { color: '--tension', label: 'T', size: 12 });
      }
      const gctx = gc.ctx;
      D.clear(gc);
      gv.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      gT.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t, yExtra: [0, p.m2 * G * 1.1], after: (P) => P.hline(p.m2 * G, { color: '--weight', dash: [5, 4], label: 'm₂g', labelRight: true }) });
      sim.set('a', `${MC.fix(q.a, 3)} m/s²`);
      sim.set('T', `${f2(q.T)} N`);
      sim.set('w2', `${f2(p.m2 * G)} N`);
      sim.set('fr', p.mode === 'atwood' ? '— (no hay)' : `${f2(Math.abs(q.fr))} N ${Math.abs(s.v) > 1e-7 ? '(cinética)' : '(estática)'}`);
      sim.set('v', `${f2(Math.abs(s.v))} m/s`);
    });
  });

  /* ======================================================================
     6.4  Curvas planas y peraltadas
     ====================================================================== */
  const ROAD = { seco: ['Pavimento seco (μs = 0.8)', 0.8], mojado: ['Pavimento mojado (μs = 0.5)', 0.5], nieve: ['Nieve compacta (μs = 0.3)', 0.3], hielo: ['Hielo (μs = 0.1)', 0.1], nada: ['Sin fricción (μs = 0)', 0] };
  MC.defineSim('curvas', function (sim) {
    sim.cols2('1.15fr 1fr');
    const cv = sim.canvas({ aspect: 1 });
    const sc = sim.canvas({ aspect: 1 });
    const view = new MC.View2D(cv, { xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4 });
    const s = { ph: -Math.PI / 2, drift: 0, dv: 0, out: false };
    const st = sim.status(cv);
    sim.group('Curva');
    sim.seg('tipo', { options: [['plana', 'Plana'], ['peralte', 'Peraltada']], value: 'plana', reset: true });
    sim.slider('R', { label: 'Radio de la curva <i>r</i>', min: 10, max: 400, step: 1, value: 50, unit: 'm', log: true, fmt: f0, reset: true });
    sim.slider('th', { label: 'Peralte θ', min: 0, max: 45, step: 0.5, value: 15, unit: '°', fmt: f1, reset: true });
    sim.select('road', { label: 'Estado del pavimento', value: 'seco', options: Object.keys(ROAD).map((k) => [k, ROAD[k][0]]), reset: true });
    sim.group('Auto');
    sim.slider('v', { label: 'Rapidez', min: 5, max: 220, step: 1, value: 60, unit: 'km/h', fmt: f0, reset: true });
    sim.out('ac', 'Aceleración centrípeta <i>v</i>²/<i>r</i>');
    sim.out('vmax', 'Rapidez máxima sin derrapar', { hl: true });
    sim.out('vmin', 'Rapidez mínima (resbala hacia adentro)');
    sim.out('vd', 'Rapidez de diseño √(<i>rg</i> tan θ)');
    sim.out('n', 'Normal <i>n</i>/<i>mg</i>');
    sim.out('f', 'Fricción necesaria / disponible');
    sim.out('st', 'Resultado', { hl: true });
    sim.presets([
      { id: 'seca', label: 'Curva plana de 50 m, pavimento seco, 60 km/h', v: { tipo: 'plana', R: 50, road: 'seco', v: 60 } },
      { id: 'mojada', label: 'La misma curva mojada, 60 km/h', v: { tipo: 'plana', R: 50, road: 'mojado', v: 60 }, note: 'v máx = √(0.5·9.8·50) = 15.7 m/s = 56 km/h: a 60 km/h derrapa.' },
      { id: 'hielo', label: 'Curva peraltada con hielo', v: { tipo: 'peralte', R: 100, th: 15, road: 'hielo', v: 58 }, note: 'Sin casi fricción sólo sirve la rapidez de diseño: 58 km/h para r = 100 m y 15°.' },
      { id: 'lenta', label: 'Demasiado lento en un peralte con hielo', v: { tipo: 'peralte', R: 100, th: 25, road: 'hielo', v: 30 } },
      { id: 'velodromo', label: 'Velódromo (r = 25 m, 42°)', v: { tipo: 'peralte', R: 25, th: 42, road: 'seco', v: 60 } },
      { id: 'autodromo', label: 'Óvalo de carreras (r = 300 m, 31°)', v: { tipo: 'peralte', R: 300, th: 31, road: 'seco', v: 200 } }
    ]);
    const vis = () => sim.ctl.th.show(sim.p.tipo === 'peralte');
    sim.onChange = () => vis();
    vis();
    const calc = () => {
      const p = sim.p, R = p.R, th = p.tipo === 'peralte' ? M.rad(p.th) : 0, mu = ROAD[p.road][1];
      const v = p.v / 3.6, ac = (v * v) / R;
      const n = G * Math.cos(th) + ac * Math.sin(th); /* por unidad de masa */
      const f = ac * Math.cos(th) - G * Math.sin(th); /* + hacia abajo del peralte */
      const den1 = Math.cos(th) - mu * Math.sin(th);
      const vmax = den1 > 1e-9 ? Math.sqrt((R * G * (Math.sin(th) + mu * Math.cos(th))) / den1) : Infinity;
      const num2 = Math.sin(th) - mu * Math.cos(th);
      const vmin = num2 > 0 ? Math.sqrt((R * G * num2) / (Math.cos(th) + mu * Math.sin(th))) : 0;
      const vd = Math.sqrt(R * G * Math.tan(th));
      const amax = den1 > 1e-9 ? (G * (Math.sin(th) + 0.8 * mu * Math.cos(th))) / (Math.cos(th) - 0.8 * mu * Math.sin(th)) : Infinity;
      const amin = (G * (Math.sin(th) - 0.8 * mu * Math.cos(th))) / (Math.cos(th) + 0.8 * mu * Math.sin(th));
      return { v, R, th, mu, ac, n, f, vmax, vmin, vd, amax, amin: Math.max(0, amin) };
    };
    sim.run({
      reset() { s.ph = -Math.PI / 2; s.drift = 0; s.dv = 0; s.out = false; st.hide(); },
      step(h) {
        const c = calc();
        s.ph += (c.v / (c.R + s.drift)) * h;
        let ad = 0;
        if (c.v > c.vmax * 1.0001) ad = c.ac - c.amax;
        else if (c.v < c.vmin * 0.9999) ad = c.ac - c.amin;
        s.dv += ad * h;
        s.drift += s.dv * h;
        if (!s.out && Math.abs(s.drift) > 6) {
          s.out = true;
          st.show(s.drift > 0 ? '¡Derrapa hacia afuera de la curva!' : '¡Resbala hacia el interior de la curva!', 'bad');
          sim.end();
        }
        if (sim.t > 120) sim.end();
      },
      h: 1 / 240
    });
    sim.onDraw(() => {
      const p = sim.p, c = calc();
      const ctx = cv.ctx;
      view.setRange({ xmin: -c.R * 1.35, xmax: c.R * 1.35, ymin: -c.R * 1.35, ymax: c.R * 1.35 });
      D.clear(cv);
      ctx.fillStyle = MC.alpha('--body-d', 0.25);
      ctx.fillRect(0, 0, cv.w, cv.h);
      const lw = Math.max(16, view.L(8));
      D.circle(ctx, view.X(0), view.Y(0), c.R * view.s, { color: '--road', width: lw });
      ctx.save();
      ctx.setLineDash([8, 8]);
      D.circle(ctx, view.X(0), view.Y(0), c.R * view.s, { color: '--road-line', width: 1.5 });
      ctx.restore();
      D.circle(ctx, view.X(0), view.Y(0), 3, { fill: '--ink-3' });
      MC.text(ctx, 'centro', view.X(0) + 6, view.Y(0) - 6, { size: 11, color: '--ink-3' });
      D.dim(ctx, view.X(0), view.Y(0), view.X(c.R * Math.cos(2.3)), view.Y(c.R * Math.sin(2.3)), `r = ${f0(c.R)} m`, { labelOff: 12 });
      const rr = c.R + s.drift;
      const X = view.X(rr * Math.cos(s.ph)), Y = view.Y(rr * Math.sin(s.ph));
      ctx.save();
      ctx.translate(X, Y);
      ctx.rotate(-(s.ph + Math.PI / 2));
      ctx.fillStyle = MC.col('--body-c');
      ctx.strokeStyle = MC.shade(MC.col('--body-c'), 0.5);
      const cl = Math.max(24, view.L(4.5)), cw = Math.max(12, view.L(1.9));
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-cl / 2, -cw / 2, cl, cw, 3); else ctx.rect(-cl / 2, -cw / 2, cl, cw);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = MC.col('--glass');
      ctx.fillRect(cl * 0.1, -cw * 0.38, cl * 0.22, cw * 0.76);
      ctx.restore();
      const ux = -Math.sin(s.ph), uy = Math.cos(s.ph);
      D.vec(ctx, X, Y, ux * 46, -uy * 46, { color: '--vel', label: 'v' });
      D.vec(ctx, X, Y, -Math.cos(s.ph) * 40, Math.sin(s.ph) * 40, { color: '--fnet', label: 'ΣF', dash: [5, 4], width: 2 });
      /* corte transversal */
      const sctx = sc.ctx, W = sc.w, Hh = sc.h;
      D.clear(sc);
      const cx0 = W * 0.5, cy0 = Hh * 0.58, th = c.th;
      MC.text(sctx, 'Vista desde atrás del auto', 10, 18, { size: 11.5, color: '--ink-3', weight: 600 });
      MC.text(sctx, '← hacia el centro', 10, Hh - 12, { size: 11, color: '--ink-3' });
      const Lr = W * 0.42;
      sctx.save();
      sctx.translate(cx0, cy0);
      sctx.rotate(-th);
      sctx.fillStyle = MC.col('--road');
      sctx.fillRect(-Lr, 0, 2 * Lr, 14);
      sctx.fillStyle = MC.col('--body-c');
      sctx.fillRect(-26, -26, 52, 24);
      sctx.fillStyle = MC.col('--tire');
      sctx.fillRect(-24, -6, 12, 6); sctx.fillRect(12, -6, 12, 6);
      sctx.restore();
      if (th > 0) D.angle(sctx, cx0 - Lr * Math.cos(th), cy0 + Lr * Math.sin(th), 40, 0, th, { label: 'θ' });
      D.line(sctx, cx0 - Lr * Math.cos(th), cy0 + Lr * Math.sin(th), cx0 + Lr, cy0 + Lr * Math.sin(th), { color: '--ink-3', dash: [3, 3], width: 1 });
      /* fuerzas por unidad de masa */
      const k = Math.min(W, Hh) * 0.2 / G;
      const px = cx0 - 14 * Math.sin(th), py = cy0 - 14 * Math.cos(th);
      const nX = -Math.sin(th), nY = -Math.cos(th);
      D.vec(sctx, px, py, 0, G * k, { color: '--weight', label: 'mg' });
      D.vec(sctx, px, py, nX * c.n * k, nY * c.n * k, { color: '--normal', label: 'n' });
      const fcap = Math.sign(c.f) * Math.min(Math.abs(c.f), c.mu * c.n);
      if (Math.abs(fcap) > 0.02) D.vec(sctx, cx0, cy0, -Math.cos(th) * fcap * k, Math.sin(th) * fcap * k, { color: '--fric', label: 'f' });
      D.vec(sctx, px, py - 46, -c.ac * k, 0, { color: '--fnet', label: 'mv²/r', dash: [5, 4], width: 2 });
      const fmt = (v) => (isFinite(v) ? `${f1(v * 3.6)} km/h` : 'sin límite');
      const ok = c.v <= c.vmax && c.v >= c.vmin;
      sim.set('ac', `${f2(c.ac)} m/s² (${f2(c.ac / G)} g)`);
      sim.set('vmax', fmt(c.vmax));
      sim.set('vmin', c.vmin > 0 ? fmt(c.vmin) : '0 (no hay mínimo)');
      sim.set('vd', p.tipo === 'peralte' ? fmt(c.vd) : '— (curva plana)');
      sim.set('n', f2(c.n / G));
      sim.set('f', `${f2(Math.abs(c.f) / G)} mg / ${f2((c.mu * c.n) / G)} mg`);
      sim.set('st', ok ? '<span class="goodv">toma la curva</span>' : c.v > c.vmax ? '<span class="warnv">derrapa hacia afuera</span>' : '<span class="warnv">resbala hacia adentro</span>');
    });
  });

  /* ======================================================================
     6.5  Rizo vertical y péndulo cónico
     ====================================================================== */
  MC.defineSim('rizo', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const gc = sim.canvas({ aspect: 3.0, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -8, xmax: 8, ymin: -1, ymax: 11 });
    const s = { ph: 0, v: 0, free: false, x: 0, y: 0, vx: 0, vy: 0, cone: 0 };
    const trace = [];
    const st = sim.status(cv);
    let NP = null;
    sim.group('Situación');
    sim.seg('mode', { options: [['rizo', 'Rizo vertical'], ['conico', 'Péndulo cónico']], value: 'rizo', reset: true });
    const gRz = sim.group('Rizo');
    sim.slider('R', { label: 'Radio del rizo <i>r</i>', min: 2, max: 20, step: 0.5, value: 6, unit: 'm', fmt: f1, reset: true });
    sim.slider('v0', { label: 'Rapidez en la base <i>v</i>₀', min: 0, max: 35, step: 0.1, value: 17.2, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa del carro con pasajeros', min: 50, max: 1000, step: 10, value: 500, unit: 'kg', fmt: f0 });
    sim.button('Rapidez justa √(5gr)', () => { sim.ctl.v0.set(Math.sqrt(5 * G * sim.p.R)); });
    const gCo = sim.group('Péndulo cónico');
    sim.slider('L', { label: 'Longitud de la cuerda <i>L</i>', min: 0.3, max: 6, step: 0.1, value: 4, unit: 'm', fmt: f1, reset: true });
    sim.slider('cth', { label: 'Ángulo con la vertical θ', min: 5, max: 80, step: 0.5, value: 40, unit: '°', fmt: f1, reset: true });
    sim.out('o1', '—'); sim.out('o2', '—'); sim.out('o3', '—'); sim.out('o4', '—'); sim.out('o5', '—');
    const O = ['o1', 'o2', 'o3', 'o4', 'o5'];
    const setO = (i, lab, val, hl) => { sim._outs[O[i]].label(lab); sim.set(O[i], val); sim._outs[O[i]].dd.classList.toggle('hl', !!hl); };
    sim.presets([
      { id: 'justo', label: 'Rizo con la rapidez justa', v: { mode: 'rizo', R: 6, v0: 17.15 }, note: 'v₀ = √(5gr): en la cima la normal es cero y los pasajeros “flotan” un instante.' },
      { id: 'seguro', label: 'Rizo con margen de seguridad', v: { mode: 'rizo', R: 6, v0: 19.5 } },
      { id: 'lento', label: 'Demasiado lento: se despega', v: { mode: 'rizo', R: 6, v0: 15.5 }, note: 'La normal llega a cero antes de la cima y el carro sigue una parábola.' },
      { id: 'sillas', label: 'Sillas voladoras de feria', v: { mode: 'conico', L: 5, cth: 45 } },
      { id: 'boleadora', label: 'Péndulo cónico corto y rápido', v: { mode: 'conico', L: 0.5, cth: 70 } }
    ]);
    const vis = () => { gRz.hidden = sim.p.mode !== 'rizo'; gCo.hidden = sim.p.mode !== 'conico'; };
    sim.onChange = () => vis();
    vis();
    sim.run({
      reset() {
        vis();
        s.ph = 0; s.v = sim.p.v0; s.free = false; s.cone = 0; trace.length = 0; st.hide();
        if (sim.p.mode === 'rizo') view.setRange({ xmin: -sim.p.R * 1.5, xmax: sim.p.R * 1.5, ymin: -sim.p.R * 0.15, ymax: sim.p.R * 2.25 });
        else view.setRange({ xmin: -1.2 * sim.p.L, xmax: 1.2 * sim.p.L, ymin: -1.25 * sim.p.L, ymax: 0.25 * sim.p.L });
      },
      step(h) {
        const p = sim.p;
        if (p.mode === 'conico') {
          const th = M.rad(p.cth), w = Math.sqrt(G / (p.L * Math.cos(th)));
          s.cone += w * h;
          return;
        }
        const R = p.R;
        if (!s.free) {
          const f = (t, y) => [y[1] / R, -G * Math.sin(y[0])];
          const y = M.rk4(f, [s.ph, s.v], 0, h);
          s.ph = y[0]; s.v = y[1];
          const n = (s.v * s.v) / R + G * Math.cos(s.ph);
          trace.push([((s.ph * 180) / Math.PI), n / G]);
          if (n < 0 && s.v > 0) {
            s.free = true;
            s.x = R * Math.sin(s.ph); s.y = R - R * Math.cos(s.ph);
            s.vx = s.v * Math.cos(s.ph); s.vy = s.v * Math.sin(s.ph);
            st.show(`Se despega a ${f0((s.ph * 180) / Math.PI)}°: la normal llegó a cero`, 'bad');
          }
          if (s.ph >= 2 * Math.PI) { s.ph = 2 * Math.PI; sim.end(); }
          if (s.v <= 0 && s.ph < Math.PI / 2) { st.show('No subió lo suficiente: se devuelve', 'bad'); sim.end(); }
        } else {
          s.x += s.vx * h; s.y += s.vy * h - 0.5 * G * h * h; s.vy -= G * h;
          const d = Math.hypot(s.x, s.y - R);
          if (d >= R || s.y <= 0) sim.end();
        }
        if (sim.t > 40) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: false });
      const gctx = gc.ctx;
      D.clear(gc);
      if (p.mode === 'rizo') {
        const R = p.R;
        D.ground(ctx, 0, view.Y(0), cv.w, { depth: 10 });
        D.circle(ctx, view.X(0), view.Y(R), R * view.s, { color: '--ink-2', width: 4 });
        let x, y, vx, vy;
        if (!s.free) { x = R * Math.sin(s.ph); y = R - R * Math.cos(s.ph); vx = s.v * Math.cos(s.ph); vy = s.v * Math.sin(s.ph); }
        else { x = s.x; y = s.y; vx = s.vx; vy = s.vy; }
        const X = view.X(x), Y = view.Y(y);
        const n = s.free ? 0 : (s.v * s.v) / R + G * Math.cos(s.ph);
        const k = view.L(R * 0.35) / (G * 3);
        if (!s.free) D.vec(ctx, X, Y, -Math.sin(s.ph) * n * k, -Math.cos(s.ph) * n * k, { color: '--normal', label: 'n', minLen: 2 });
        D.vec(ctx, X, Y, 0, G * k, { color: '--weight', label: 'mg' });
        D.vec(ctx, X, Y, vx * view.L(0.08), -vy * view.L(0.08), { color: '--vel', label: 'v', minLen: 2 });
        D.ball(ctx, X, Y, Math.max(7, view.L(0.35)), { fill: '--body-c' });
        const vtop = Math.sqrt(Math.max(0, p.v0 * p.v0 - 4 * G * R));
        /* gráfica n/mg contra ángulo */
        const P = NP || (NP = new MC.Plot(gctx));
        P.ctx = gctx;
        const nb = p.v0 * p.v0 / (G * R) + 1;
        P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: 360, ymin: Math.min(-1, -0.5), ymax: MC.niceCeil(Math.max(2, nb * 1.1)), xlabel: ['φ', '°'], ylabel: ['n/mg', ''], xticks: [0, 45, 90, 135, 180, 225, 270, 315, 360], mb: 34, mt: 10 });
        P.frame();
        P.hband(-1, 0, { color: '--weight', alpha: 0.08 });
        P.fn((a) => (p.v0 * p.v0) / (G * R) - 2 + 3 * Math.cos(M.rad(a)), { color: '--ink-3', dash: [5, 4], width: 1.4 });
        P.path(trace, { color: '--normal', width: 2.4 });
        P.label(186, 0, 'cima', { dy: -6, size: 11 });
        P.vline(180, { color: '--ink-3', dash: [2, 3] });
        setO(0, 'Ángulo recorrido φ', s.free ? 'despegado' : `${f0(M.deg(s.ph))}°`);
        setO(1, 'Rapidez', `${f2(s.free ? Math.hypot(s.vx, s.vy) : s.v)} m/s`);
        setO(2, 'Normal <i>n</i> (en unidades de <i>mg</i>)', `${f2(n / G)} → ${f0(n * p.m)} N`, true);
        setO(3, 'Rapidez mínima en la cima √(<i>gr</i>)', `${f2(Math.sqrt(G * R))} m/s`);
        setO(4, 'Rapidez en la cima (si no se despega)', p.v0 * p.v0 >= 5 * G * R ? `${f2(vtop)} m/s` : '<span class="warnv">no llega pegado</span>', true);
      } else {
        const L = p.L, th = M.rad(p.cth), r = L * Math.sin(th), hgt = L * Math.cos(th);
        const pv = [view.X(0), view.Y(0)];
        D.ceiling(ctx, pv[0] - 40, pv[1], pv[0] + 40);
        const sq = 0.28;
        ctx.save();
        ctx.strokeStyle = MC.col('--ink-3');
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(view.X(0), view.Y(-hgt), r * view.s, r * view.s * sq, 0, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
        D.line(ctx, pv[0], pv[1], view.X(0), view.Y(-hgt), { color: '--ink-3', dash: [2, 3], width: 1 });
        const bx = view.X(r * Math.cos(s.cone)), by = view.Y(-hgt) + r * view.s * sq * Math.sin(s.cone);
        D.line(ctx, pv[0], pv[1], bx, by, { color: '--rope', width: 2 });
        D.ball(ctx, bx, by, Math.max(8, view.L(0.12 * L)), { fill: '--body-b' });
        const k = view.L(0.35 * L) / G;
        const Fh = G * Math.tan(th);
        const c0 = Math.cos(s.cone), s0 = Math.sin(s.cone);
        D.vec(ctx, bx, by, 0, G * k, { color: '--weight', label: 'mg' });
        D.vec(ctx, bx, by, -c0 * Fh * k, -G * k - s0 * Fh * k * sq, { color: '--tension', label: 'T' });
        D.vec(ctx, bx, by, -c0 * Fh * k, -s0 * Fh * k * sq, { color: '--fnet', label: 'ΣF', dash: [5, 4], width: 2, minLen: 4 });
        D.angle(ctx, pv[0], pv[1], 40, -Math.PI / 2, -Math.PI / 2 + th, { label: 'θ' });
        const v = Math.sqrt(G * L * Math.sin(th) * Math.tan(th));
        const Tp = 2 * Math.PI * Math.sqrt(hgt / G);
        gctx.save();
        MC.text(gctx, 'Periodo de una vuelta en función del ángulo (L fija)', 12, 18, { size: 11.5, color: '--ink-3', weight: 600 });
        gctx.restore();
        const P = new MC.Plot(gctx, { x: 0, y: 6, w: gc.w, h: gc.h - 6, xmin: 0, xmax: 90, ymin: 0, ymax: MC.niceCeil(2 * Math.PI * Math.sqrt(L / G) * 1.1), xlabel: ['θ', '°'], ylabel: ['T', 's'], mb: 34, mt: 14 });
        P.frame();
        P.fn((a) => 2 * Math.PI * Math.sqrt((L * Math.cos(M.rad(a))) / G), { color: '--c1', width: 2.2, to: 89 });
        P.dot(p.cth, Tp, { color: '--accent', r: 5 });
        setO(0, 'Radio del círculo <i>r</i> = <i>L</i> sen θ', `${f2(r)} m`);
        setO(1, 'Rapidez <i>v</i> = √(<i>gL</i> sen θ tan θ)', `${f2(v)} m/s`, true);
        setO(2, 'Periodo 2π√(<i>L</i> cos θ/<i>g</i>)', `${f2(Tp)} s`, true);
        setO(3, 'Tensión <i>T</i>/<i>mg</i> = 1/cos θ', f2(1 / Math.cos(th)));
        setO(4, 'Aceleración centrípeta <i>g</i> tan θ', `${f2(G * Math.tan(th))} m/s²`);
      }
    });
  });

  /* ======================================================================
     6.6  Arrastre y velocidad terminal
     ====================================================================== */
  const DROP = {
    gota: { label: 'Gota de lluvia (d = 2 mm)', m: 4.19e-6, A: 3.14e-6, cd: 0.6, h0: 1000 },
    granizo: { label: 'Granizo (d = 1 cm)', m: 4.8e-4, A: 7.85e-5, cd: 0.5, h0: 1000 },
    pingpong: { label: 'Pelota de ping-pong', m: 0.0027, A: 1.257e-3, cd: 0.5, h0: 100 },
    beisbol: { label: 'Pelota de béisbol', m: 0.145, A: 4.3e-3, cd: 0.35, h0: 500 },
    boliche: { label: 'Bola de boliche', m: 7, A: 0.0373, cd: 0.47, h0: 1000 },
    persona: { label: 'Paracaidista (cuerpo extendido)', m: 80, A: 0.5, cd: 1.0, h0: 1500 }
  };
  MC.defineSim('arrastre', function (sim) {
    sim.cols2('1fr 1.5fr');
    const cv = sim.canvas({ aspect: 0.62 });
    const gc = sim.canvas({ aspect: 0.95 });
    const view = new MC.View2D(cv, { xmin: -5, xmax: 5, ymin: -10, ymax: 10 });
    const H = new MC.History(['v', 'a', 'y']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'con aire', unit: 'm/s', color: '--vel', fmt: f2 }], legend: 'tl', tspan: 10 });
    const ga = new MC.TGraph({ ylabel: ['a', 'm/s²'], series: [{ key: 'a', label: 'a', unit: 'm/s²', color: '--acc', fmt: f2 }], legend: false, tspan: 10 });
    MC.hover(sim, gc, [gv, ga]);
    const s = { y: 0, v: 0, a: G, A: 0, cd: 0, open: 0 };
    const st = sim.status(cv);
    sim.group('Objeto');
    sim.select('obj', {
      label: 'Objeto', value: 'granizo', options: Object.keys(DROP).map((k) => [k, DROP[k].label]), reset: true,
      onInput: (k) => { const o = DROP[k]; sim.ctl.m.set(o.m, true); sim.ctl.A.set(o.A, true); sim.ctl.cd.set(o.cd, true); sim.ctl.h0.set(o.h0, true); sim.ctl.para.set(k === 'persona', true); }
    });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 1e-6, max: 120, step: 1e-6, value: 4.8e-4, unit: 'kg', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.slider('A', { label: 'Área frontal <i>A</i>', min: 1e-6, max: 1, step: 1e-6, value: 7.85e-5, unit: 'm²', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.slider('cd', { label: 'Coeficiente de arrastre <i>C</i><sub>D</sub>', min: 0.1, max: 1.5, step: 0.01, value: 0.5, fmt: f2, reset: true });
    sim.slider('rho', { label: 'Densidad del aire ρ', min: 0.4, max: 1.3, step: 0.01, value: 1.2, unit: 'kg/m³', fmt: f2, reset: true });
    sim.slider('h0', { label: 'Altura inicial', min: 10, max: 4000, step: 10, value: 1000, unit: 'm', fmt: f0, reset: true });
    sim.group('Paracaídas');
    sim.check('para', { label: 'Abrir paracaídas (A = 30 m², C<sub>D</sub> = 1.3)', value: false, reset: true });
    sim.slider('to', { label: 'Se abre en <i>t</i> =', min: 2, max: 60, step: 1, value: 20, unit: 's', fmt: f0, reset: true });
    sim.out('v', 'Rapidez <i>v</i>', { hl: true });
    sim.out('vt', 'Velocidad terminal √(2<i>mg</i>/<i>C</i><sub>D</sub>ρ<i>A</i>)', { hl: true });
    sim.out('a', 'Aceleración');
    sim.out('fd', 'Arrastre / peso');
    sim.out('y', 'Altura');
    sim.out('free', 'Sin aire tendría');
    sim.presets([
      { id: 'gota', label: 'Gota de lluvia', v: { obj: 'gota', m: 4.19e-6, A: 3.14e-6, cd: 0.6, h0: 1000, para: false, rho: 1.2 }, fn: (q) => q.setSpeed(1) },
      { id: 'granizo', label: 'Granizo de 1 cm', v: { obj: 'granizo', m: 4.8e-4, A: 7.85e-5, cd: 0.5, h0: 1000, para: false, rho: 1.2 }, fn: (q) => q.setSpeed(1) },
      { id: 'pingpong', label: 'Pelota de ping-pong', v: { obj: 'pingpong', m: 0.0027, A: 1.257e-3, cd: 0.5, h0: 100, para: false, rho: 1.2 }, fn: (q) => q.setSpeed(1) },
      { id: 'boliche', label: 'Bola de boliche', v: { obj: 'boliche', m: 7, A: 0.0373, cd: 0.47, h0: 1000, para: false, rho: 1.2 }, fn: (q) => q.setSpeed(1) },
      { id: 'paracaidista', label: 'Salto en paracaídas', v: { obj: 'persona', m: 80, A: 0.5, cd: 1.0, h0: 1500, para: true, to: 20, rho: 1.2 }, fn: (q) => q.setSpeed(4), note: 'Se reproduce a ×4. Al abrir, la aceleración hacia arriba supera 2g durante un instante.' }
    ]);
    const vt = (m, A, cd, rho) => Math.sqrt((2 * m * G) / (cd * rho * A));
    sim.run({
      reset() {
        s.y = sim.p.h0; s.v = 0; s.a = -G; s.A = sim.p.A; s.cd = sim.p.cd; s.open = 0; st.hide();
        H.clear(); H.push(0, { v: 0, a: -G, y: s.y }, true);
        const T = MC.niceCeil(Math.max(6, Math.min(80, (3 * vt(sim.p.m, sim.p.A, sim.p.cd, sim.p.rho)) / G + (sim.p.para ? sim.p.to + 10 : 0))));
        gv.set({ tspan: T }); ga.set({ tspan: T });
      },
      step(h) {
        const p = sim.p;
        if (p.para && sim.t >= p.to) {
          s.open = Math.min(1, s.open + h / 2.5);
          s.A = p.A + (30 - p.A) * s.open; s.cd = p.cd + (1.3 - p.cd) * s.open;
        }
        const k = (0.5 * s.cd * p.rho * s.A) / p.m;
        const f = (t, y) => [y[1], -G + k * y[1] * y[1]];
        const y = M.rk4(f, [s.y, s.v], 0, h);
        s.y = y[0]; s.v = y[1]; s.a = -G + k * s.v * s.v;
        H.push(sim.t + h, { v: -s.v, a: s.a, y: s.y });
        if (s.y <= 0) { s.y = 0; st.show(`Llegó al suelo a ${f1(-s.v)} m/s (${f0(-s.v * 3.6)} km/h)`); sim.end(); }
        if (sim.t > 400) sim.end();
      },
      h: 1 / 200
    });
    sim.onDraw(() => {
      const p = sim.p;
      const span = 20;
      view.setRange({ ymin: s.y - span * 0.6, ymax: s.y + span * 0.4 });
      const ctx = cv.ctx;
      D.clear(cv);
      ctx.fillStyle = MC.col('--sky');
      ctx.fillRect(0, 0, cv.w, cv.h);
      /* marcas de altura */
      for (let yy = Math.floor(view.y0 / 5) * 5; yy <= view.y1; yy += 5) {
        const Y = view.Y(yy);
        D.line(ctx, 0, Y, yy % 10 === 0 ? 18 : 10, Y, { color: '--ink-3', width: 1 });
        if (yy % 10 === 0 && yy >= 0) MC.text(ctx, `${f0(yy)} m`, 22, Y + 4, { size: 10.5, mono: true, color: '--ink-3' });
      }
      if (view.Y(0) < cv.h) D.ground(ctx, 0, view.Y(0), cv.w, { depth: 16 });
      const X = view.X(0.5), Y = view.Y(s.y);
      if (p.obj === 'persona' || p.para) {
        if (s.open > 0) {
          const cw = 20 + 60 * s.open, chh = 10 + 26 * s.open;
          ctx.save();
          ctx.fillStyle = MC.col('--c4');
          ctx.beginPath();
          ctx.ellipse(X, Y - 40 - chh * 0.5, cw, chh, 0, Math.PI, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = MC.col('--ink-2');
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X - cw, Y - 40 - chh * 0.5); ctx.lineTo(X, Y - 12); ctx.lineTo(X + cw, Y - 40 - chh * 0.5); ctx.stroke();
          ctx.restore();
        }
        D.person(ctx, X, Y + 20, 40, { arms: s.open > 0 ? 0.2 : 1 });
      } else D.ball(ctx, X, Y, 12, { fill: p.obj === 'gota' ? '--water' : p.obj === 'granizo' ? '--glass' : '--body-a' });
      const kf = 60 / G;
      const drag = G + s.a;
      D.vec(ctx, X + 30, Y, 0, G * kf, { color: '--weight', label: 'mg' });
      if (drag > 0.05) D.vec(ctx, X + 30, Y, 0, -Math.min(drag, 4 * G) * kf, { color: '--fric', label: 'F_D' });
      D.vec(ctx, X - 30, Y, 0, -s.v * Math.min(3, 90 / Math.max(10, vt(p.m, p.A, p.cd, p.rho))), { color: '--vel', label: 'v', minLen: 2 });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      const VT = vt(p.m, s.A, s.cd, p.rho), VT0 = vt(p.m, p.A, p.cd, p.rho);
      gv.set({ fns: [{ f: (t) => G * t, color: '--ink-3', label: 'sin aire', noRange: true, alpha: 0.7 }] });
      gv.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h * 0.56, mb: 30 }, H, { t: sim.t, yExtra: [0, VT0 * 1.1], after: (P) => { P.hline(VT0, { color: '--vel', dash: [6, 4], label: `v_T = ${f1(VT0)} m/s`, labelRight: true }); if (p.para) P.hline(vt(p.m, 30, 1.3, p.rho), { color: '--c4', dash: [6, 4], label: 'v_T con paracaídas', labelRight: true, below: true }); } });
      ga.draw(gctx, { x: 0, y: gc.h * 0.56, w: gc.w, h: gc.h * 0.44, mb: 34 }, H, { t: sim.t, yExtra: [-G, 0], after: (P) => P.hline(-G, { color: '--ink-3', dash: [4, 4], label: '−g', labelRight: true, below: true }) });
      sim.set('v', `${f2(-s.v)} m/s (${f0(-s.v * 3.6)} km/h)`);
      sim.set('vt', `${f2(VT)} m/s (${f0(VT * 3.6)} km/h)`);
      sim.set('a', `${f2(s.a)} m/s² (${f2(s.a / G)} g)`);
      sim.set('fd', f2(drag / G));
      sim.set('y', `${f0(s.y)} m`);
      sim.set('free', `${f1(G * sim.t)} m/s`);
    });
  });

  /* ======================================================================
     6.7  Marcos no inerciales: péndulo en un bus y pelota en un carrusel
     ====================================================================== */
  MC.defineSim('no-inercial', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const view = new MC.View2D(cv, { xmin: -4, xmax: 4, ymin: -0.6, ymax: 4.4 });
    const s = { th: 0, w: 0, vb: 0, xb: 0, ball: null, rot: 0, path: [] };
    const st = sim.status(cv);
    sim.group('Situación');
    sim.seg('mode', { options: [['bus', 'Péndulo en un bus'], ['carrusel', 'Pelota en un carrusel']], value: 'bus', reset: true });
    sim.seg('frame', { label: 'Punto de vista', options: [['suelo', 'Desde el suelo (inercial)'], ['movil', 'Desde el vehículo']], value: 'suelo' });
    const gB = sim.group('Bus');
    sim.slider('A', { label: 'Aceleración del bus <i>A</i> (se cambia en marcha)', min: -6, max: 6, step: 0.1, value: 2, unit: 'm/s²', fmt: f1 });
    sim.slider('L', { label: 'Longitud del péndulo', min: 0.2, max: 1.5, step: 0.05, value: 0.8, unit: 'm', fmt: f2 });
    sim.slider('b', { label: 'Amortiguamiento', min: 0, max: 3, step: 0.1, value: 0.8, unit: '1/s', fmt: f1 });
    const gC = sim.group('Carrusel');
    sim.slider('w', { label: 'Rapidez angular del carrusel ω', min: 0, max: 2, step: 0.05, value: 0.8, unit: 'rad/s', fmt: f2, reset: true });
    sim.slider('vbal', { label: 'Rapidez de la pelota', min: 0.5, max: 8, step: 0.1, value: 2, unit: 'm/s', fmt: f1, reset: true });
    sim.out('o1', '—'); sim.out('o2', '—'); sim.out('o3', '—'); sim.out('o4', '—');
    const O = ['o1', 'o2', 'o3', 'o4'];
    const setO = (i, lab, val, hl) => { sim._outs[O[i]].label(lab); sim.set(O[i], val); sim._outs[O[i]].dd.classList.toggle('hl', !!hl); };
    sim.presets([
      { id: 'arranca', label: 'Bus que arranca (A = 2 m/s²)', v: { mode: 'bus', A: 2, frame: 'suelo' }, note: 'El péndulo se inclina hacia atrás hasta tan θ = A/g = 0.20 (11.5°).' },
      { id: 'frena', label: 'Bus que frena (A = −4 m/s²)', v: { mode: 'bus', A: -4, frame: 'movil' } },
      { id: 'constante', label: 'Velocidad constante (A = 0)', v: { mode: 'bus', A: 0, frame: 'movil' }, note: 'A velocidad constante el bus es un marco inercial: el péndulo cuelga vertical.' },
      { id: 'carrusel', label: 'Lanzar una pelota en un carrusel', v: { mode: 'carrusel', w: 0.8, vbal: 2, frame: 'movil' } }
    ]);
    const vis = () => { gB.hidden = sim.p.mode !== 'bus'; gC.hidden = sim.p.mode !== 'carrusel'; };
    sim.onChange = () => vis();
    vis();
    const Rc = 5;
    sim.run({
      reset() {
        vis(); st.hide();
        s.th = 0; s.w = 0; s.vb = 8; s.xb = 0; s.rot = 0; s.path = [];
        if (sim.p.mode === 'carrusel') { s.ball = { r: 0.2 }; view.setRange({ xmin: -6.5, xmax: 6.5, ymin: -6, ymax: 6 }); }
        else view.setRange({ xmin: -4, xmax: 4, ymin: -0.6, ymax: 4.4 });
      },
      step(h) {
        const p = sim.p;
        if (p.mode === 'bus') {
          let A = p.A;
          if (s.vb <= 0 && A < 0) { A = 0; s.vb = 0; }
          s.vb = Math.max(0, s.vb + A * h);
          s.xb += s.vb * h;
          const f = (t, y) => [y[1], -(G * Math.sin(y[0]) + A * Math.cos(y[0])) / p.L - p.b * y[1]];
          const y = M.rk4(f, [s.th, s.w], 0, h);
          s.th = y[0]; s.w = y[1];
          s.Aeff = A;
          if (sim.t > 600) sim.end();
        } else {
          s.rot += p.w * h;
          s.ball.r += p.vbal * h;
          const t = sim.t + h;
          s.path.push([s.ball.r, t]);
          if (s.ball.r >= Rc) sim.end();
        }
      },
      h: 1 / 600
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      const movil = p.frame === 'movil';
      if (p.mode === 'bus') {
        /* suelo que pasa */
        const gY = view.Y(0);
        ctx.fillStyle = MC.col('--road');
        ctx.fillRect(0, gY + 18, cv.w, cv.h - gY - 18);
        for (let k = Math.floor((s.xb - 10) / 2); k < (s.xb + 10) / 2; k++) {
          const X = view.X(k * 2 - s.xb);
          ctx.fillStyle = MC.col('--road-line');
          ctx.fillRect(X, gY + 30, view.L(0.9), 4);
        }
        /* carrocería del bus */
        ctx.save();
        ctx.fillStyle = MC.alpha('--body-b', 0.18);
        ctx.strokeStyle = MC.col('--body-b');
        ctx.lineWidth = 3;
        ctx.fillRect(view.X(-3.6), view.Y(3.9), view.L(7.2), view.L(3.9));
        ctx.strokeRect(view.X(-3.6), view.Y(3.9), view.L(7.2), view.L(3.9));
        ctx.restore();
        for (const wx of [-2.5, 2.5]) D.circle(ctx, view.X(wx), gY + 10, 16, { fill: '--tire' });
        MC.text(ctx, 'sentido de marcha →', view.X(3.4), view.Y(3.6), { size: 12, align: 'right', color: '--body-b', weight: 600 });
        /* péndulo */
        const pvx = view.X(-1.4), pvy = view.Y(3.9);
        const Lp = view.L(p.L * 2);
        const bx = pvx + Lp * Math.sin(s.th), by = pvy + Lp * Math.cos(s.th);
        D.line(ctx, pvx, pvy, bx, by, { color: '--rope', width: 1.8 });
        D.ball(ctx, bx, by, 10, { fill: '--body-c' });
        D.line(ctx, pvx, pvy, pvx, pvy + Lp + 16, { color: '--ink-3', dash: [3, 3], width: 1 });
        if (Math.abs(s.th) > 0.02) D.angle(ctx, pvx, pvy, 36, -Math.PI / 2, -Math.PI / 2 + s.th, { label: 'θ' });
        const A = s.Aeff === undefined ? p.A : s.Aeff;
        const k = 55 / G;
        const Tm = Math.hypot(G, A);
        D.vec(ctx, bx, by, 0, G * k, { color: '--weight', label: 'mg' });
        const tx = (pvx - bx) / Lp, ty = (pvy - by) / Lp;
        D.vec(ctx, bx, by, tx * Tm * k, ty * Tm * k, { color: '--tension', label: 'T' });
        if (movil) { if (Math.abs(A) > 0.05) D.vec(ctx, bx, by, -A * k, 0, { color: '--c8', label: '−mA', dash: [5, 3] }); }
        else if (Math.abs(A) > 0.05) D.vec(ctx, bx, by + 22, A * k, 0, { color: '--fnet', label: 'ΣF = mA', dash: [5, 3], width: 2 });
        /* vaso con agua */
        const cx = view.X(1.8), cy = view.Y(0.1), cw = view.L(1.0), ch = view.L(1.1);
        const slope = Math.tan(-s.th);
        const hLvl = ch * 0.55;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - cw / 2, cy);
        ctx.lineTo(cx + cw / 2, cy);
        ctx.lineTo(cx + cw / 2, cy - hLvl + slope * cw / 2);
        ctx.lineTo(cx - cw / 2, cy - hLvl - slope * cw / 2);
        ctx.closePath();
        ctx.fillStyle = MC.alpha('--water', 0.55);
        ctx.fill();
        ctx.restore();
        D.poly(ctx, [[cx - cw / 2, cy - ch], [cx - cw / 2, cy], [cx + cw / 2, cy], [cx + cw / 2, cy - ch]], { color: '--ink-2', width: 2 });
        D.vec(ctx, view.X(0), view.Y(2.8), A * 18, 0, { color: '--acc', label: 'A (bus)', minLen: 3 });
        setO(0, 'Aceleración del bus <i>A</i>', `${f2(A)} m/s²`);
        setO(1, 'Ángulo de equilibrio tan⁻¹(<i>A</i>/<i>g</i>)', `${f1(M.deg(Math.atan(Math.abs(A) / G)))}° ${A > 0 ? 'hacia atrás' : A < 0 ? 'hacia adelante' : ''}`, true);
        setO(2, 'Ángulo actual del péndulo', `${f1(Math.abs(M.deg(s.th)))}°`);
        setO(3, movil ? 'Fuerza ficticia −<i>mA</i> (por kg)' : 'Fuerza neta <i>mA</i> (por kg)', `${f2(movil ? -A : A)} N/kg`, true);
      } else {
        /* carrusel visto desde arriba */
        const ang0 = movil ? 0 : s.rot;
        const O = [view.X(0), view.Y(0)];
        D.circle(ctx, O[0], O[1], Rc * view.s, { fill: '--body-e', fillAlpha: 0.2, color: '--ink-2', width: 2 });
        for (let k = 0; k < 8; k++) {
          const a = ang0 + (k * Math.PI) / 4;
          D.line(ctx, O[0], O[1], O[0] + Rc * view.s * Math.cos(a), O[1] - Rc * view.s * Math.sin(a), { color: '--ink-3', width: 1 });
        }
        /* amigo en el borde (sobre el carrusel) */
        const fa = ang0 + Math.PI / 2 * 0;
        D.person(ctx, O[0] + Rc * view.s * Math.cos(fa) + 14, O[1] - Rc * view.s * Math.sin(fa) + 16, 30, { color: '--c1' });
        MC.text(ctx, 'amigo', O[0] + Rc * view.s * Math.cos(fa) + 26, O[1] - Rc * view.s * Math.sin(fa) - 14, { size: 11, color: '--c1' });
        /* trayectoria: en inercial es recta a lo largo de la dirección inicial (ángulo 0 en t = 0) */
        const pts = s.path.map(([r, t]) => {
          const a = movil ? -p.w * t : 0;
          return [O[0] + r * view.s * Math.cos(a), O[1] - r * view.s * Math.sin(a)];
        });
        D.poly(ctx, [[O[0], O[1]]].concat(pts), { color: '--c4', width: 2.2 });
        const last = pts.length ? pts[pts.length - 1] : O;
        D.ball(ctx, last[0], last[1], 7, { fill: '--c4' });
        const arrowA = movil ? -s.rot : 0;
        D.arcArrow(ctx, O[0], O[1], 30, 0.3, 1.5, { color: '--ink-2' });
        MC.text(ctx, 'ω', O[0] + 30, O[1] - 30, { size: 14, math: true, color: '--ink-2' });
        void arrowA;
        const tf = Rc / p.vbal, dth = p.w * tf;
        setO(0, 'Tiempo hasta el borde <i>R</i>/<i>v</i>', `${f2(tf)} s`);
        setO(1, 'Giro del carrusel en ese tiempo', `${f1(M.deg(dth))}°`, true);
        setO(2, 'Desviación en el borde (arco)', `${f2(Rc * dth)} m`, true);
        setO(3, 'Vista', movil ? 'desde el carrusel: la trayectoria se curva (Coriolis)' : 'desde afuera: la pelota va en línea recta');
      }
    });
  });
})();
