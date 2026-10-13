/* ===================================================================
   Capítulo 17 — Ondas mecánicas
   Simulaciones: onda-viajera, superposicion, estacionarias
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const sci = (v, d = 3) => MC.sci(v, d);
  const gauss = (u) => Math.exp(-u * u);

  /* ======================================================================
     17.2  Onda viajera en una cuerda
     ====================================================================== */
  MC.defineSim('onda-viajera', function (sim) {
    const cv = sim.canvas({ aspect: 1.75, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const LX = 4, XM = 1.3, AMAX = 0.2;
    const view = new MC.View2D(cv, { xmin: -0.4, xmax: LX + 0.25, ymin: -1, ymax: 1 });
    const H = new MC.History(['y']);
    const gY = new MC.TGraph({ ylabel: ['y', 'cm'], series: [{ key: 'y', label: 'partícula roja', unit: 'cm', color: '--c2', fmt: f2 }], legend: false, tspan: 3, sym: true, minSpan: 1e-3 });
    MC.hover(sim, gc, [gY]);
    const s = { m0: null };
    sim.group('Tipo de onda');
    sim.seg('tipo', { options: [['trans', 'Transversal'], ['long', 'Longitudinal']], value: 'trans' });
    sim.seg('forma', { options: [['seno', 'Senoidal'], ['pulso', 'Un pulso']], value: 'seno', reset: true });
    sim.check('izq', { label: 'La fuente está a la derecha (viaja hacia −x)', value: false, reset: true });
    sim.group('Fuente');
    sim.slider('A', { label: 'Amplitud <i>A</i>', min: 0.5, max: 20, step: 0.1, value: 8, unit: 'cm', fmt: f1, reset: true });
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 0.2, max: 12, step: 0.01, value: 2, unit: 'Hz', fmt: f2, reset: true });
    sim.slider('w', { label: 'Ancho del pulso', min: 0.08, max: 1.2, step: 0.01, value: 0.3, unit: 'm', fmt: f2, reset: true });
    sim.group('Cuerda');
    sim.slider('F', { label: 'Tensión <i>F</i>', min: 0.5, max: 100, step: 0.1, value: 4, unit: 'N', fmt: f1, log: true, reset: true });
    sim.slider('mu', { label: 'Masa por unidad de longitud μ', min: 10, max: 1000, step: 1, value: 250, unit: 'g/m', fmt: f0, log: true, reset: true });
    sim.out('v', 'Rapidez de la onda <i>v</i> = √(<i>F</i>/μ)', { hl: true });
    sim.out('lam', 'Longitud de onda λ = <i>v</i>/<i>f</i>', { hl: true });
    sim.out('T', 'Periodo y frecuencia');
    sim.out('kw', 'Número de onda <i>k</i> y frecuencia angular ω');
    sim.out('vp', 'Rapidez máxima de una partícula <i>A</i>ω');
    sim.out('P', 'Potencia media ½μ<i>v</i>ω²<i>A</i>²');
    sim.presets([
      { id: 'basica', label: 'y = 0.020 sen(3.0x − 60t)', v: { tipo: 'trans', forma: 'seno', izq: false, A: 2, f: 9.55, F: 40, mu: 100 }, note: 'A = 2 cm, λ = 2.09 m, f = 9.55 Hz, v = 20 m/s. Use ×0.25 para verla en cámara lenta.' },
      { id: 'lenta', label: 'Onda lenta: v = 4 m/s, f = 2 Hz', v: { tipo: 'trans', forma: 'seno', izq: false, A: 8, f: 2, F: 4, mu: 250 } },
      { id: 'frecuencia', label: 'Doble frecuencia: λ a la mitad', v: { tipo: 'trans', forma: 'seno', izq: false, A: 8, f: 4, F: 4, mu: 250 }, note: 'La rapidez sigue siendo 4 m/s.' },
      { id: 'tension', label: 'Cuatro veces la tensión: v y λ al doble', v: { tipo: 'trans', forma: 'seno', izq: false, A: 8, f: 2, F: 16, mu: 250 } },
      { id: 'pulso', label: 'Un pulso que recorre la cuerda', v: { tipo: 'trans', forma: 'pulso', izq: false, A: 12, w: 0.3, F: 4, mu: 250 } },
      { id: 'longitudinal', label: 'Onda longitudinal (resorte)', v: { tipo: 'long', forma: 'seno', izq: false, A: 12, f: 2, F: 4, mu: 250 }, note: 'Las partículas se mueven a lo largo de la dirección de propagación: compresiones y rarefacciones.' }
    ]);
    const par = () => {
      const p = sim.p, v = Math.sqrt(p.F / (p.mu / 1000)), w = 2 * Math.PI * p.f;
      return { v, w, lam: v / p.f, k: w / v, A: p.A / 100 };
    };
    /* desplazamiento en la posición u (distancia a la fuente) */
    const disp = (u, t) => {
      const p = sim.p, q = par();
      if (p.forma === 'pulso') return q.A * gauss((u - (q.v * t - 2.2 * p.w)) / p.w);
      if (u > q.v * t) return 0;
      return q.A * Math.sin(q.w * (t - u / q.v));
    };
    const uOf = (x) => (sim.p.izq ? LX - x : x);
    const sync = () => { const pulse = sim.p.forma === 'pulso'; sim.ctl.f.show(!pulse); sim.ctl.w.show(pulse); };
    sim.onChange = sync;
    sync();
    sim.run({
      reset() { H.clear(); s.m0 = null; H.push(0, { y: 0 }, true); const q = par(); gY.set({ tspan: sim.p.forma === 'pulso' ? Math.max(3, (LX + 5 * sim.p.w) / q.v) : Math.max(2, 4 / sim.p.f) }); },
      step(h) {
        const t = sim.t + h;
        H.push(t, { y: disp(uOf(XM), t) * 100 });
        const q = par();
        if (sim.p.forma === 'pulso' && q.v * t - 2.2 * sim.p.w > LX + 3 * sim.p.w) sim.end();
        if (t > 120) sim.end();
      },
      h: 1 / 600
    });
    sim.onDraw(() => {
      const p = sim.p, q = par(), ctx = cv.ctx, t = sim.t;
      view.update();
      D.clear(cv);
      const W = cv.w, Hc = cv.h, y0 = Hc * 0.5, ky = (Hc * 0.36) / AMAX;
      const X = (x) => view.X(x), Y = (y) => y0 - y * ky;
      /* fuente */
      const xs = p.izq ? LX : 0, ysrc = disp(0, t);
      const long = p.tipo === 'long';
      if (!long) {
        D.line(ctx, X(xs), Y(-AMAX * 1.05), X(xs), Y(AMAX * 1.05), { color: '--ink-3', dash: [3, 4], width: 1 });
        D.block(ctx, X(xs), Y(ysrc), 14, 22, { fill: '--c4', r: 2 });
      } else {
        D.block(ctx, X(xs + ysrc) + (p.izq ? 9 : -9), y0, 14, Hc * 0.5, { fill: '--c4', r: 2 });
      }
      MC.text(ctx, 'fuente', X(xs), Hc - 8, { size: 10.5, align: 'center', color: '--c4' });
      if (!long) {
        /* escala vertical (ampliada respecto de la horizontal) */
        for (const yy of [-0.2, -0.1, 0.1, 0.2]) {
          D.line(ctx, X(0.02), Y(yy), X(LX), Y(yy), { color: '--grid-2', width: 1, dash: [2, 5] });
          MC.text(ctx, `${yy > 0 ? '+' : '−'}${f0(Math.abs(yy) * 100)} cm`, X(-0.06), Y(yy) + 3.5, { size: 9.5, mono: true, color: '--ink-3', align: 'right' });
        }
        MC.text(ctx, 'escala vertical ampliada', X(LX), Y(AMAX) - 10, { size: 9.5, color: '--ink-3', align: 'right' });
        D.line(ctx, X(0), y0, X(LX), y0, { color: '--ink-3', width: 1, dash: [2, 4] });
        const pts = [];
        for (let i = 0; i <= 400; i++) { const x = (LX * i) / 400; pts.push([X(x), Y(disp(uOf(x), t))]); }
        D.poly(ctx, pts, { color: '--rope', width: 2.2 });
        for (let i = 0; i <= 40; i++) { const x = (LX * i) / 40; D.circle(ctx, X(x), Y(disp(uOf(x), t)), 2.3, { fill: '--ink-2' }); }
        /* partícula marcada y su velocidad */
        const ym = disp(uOf(XM), t), vy = (disp(uOf(XM), t + 1e-4) - disp(uOf(XM), t - 1e-4)) / 2e-4;
        D.line(ctx, X(XM), Y(-AMAX * 1.02), X(XM), Y(AMAX * 1.02), { color: '--c2', dash: [2, 4], width: 1, alpha: 0.6 });
        if (Math.abs(vy) > 1e-3) D.vec(ctx, X(XM) + 10, Y(ym), 0, -vy * ky * 0.08, { color: '--vel', label: 'v_{part}', vec: false, size: 11, minLen: 4 });
        D.circle(ctx, X(XM), Y(ym), 5.5, { fill: '--c2' });
        /* cresta seguida y longitud de onda */
        if (p.forma === 'seno') {
          const front = Math.min(q.v * t, LX);
          const uc = (m) => q.v * t - q.lam / 4 - m * q.lam;
          if (s.m0 === null || uc(s.m0) > LX || uc(s.m0) < 0) { const m = Math.floor((q.v * t - q.lam / 4) / q.lam); s.m0 = uc(m) >= 0 ? m : null; }
          if (s.m0 !== null && uc(s.m0) <= front) {
            const u = uc(s.m0), xc = p.izq ? LX - u : u;
            D.poly(ctx, [[X(xc) - 6, Y(q.A) - 16], [X(xc) + 6, Y(q.A) - 16], [X(xc), Y(q.A) - 6]], { close: true, fill: '--accent', color: '--accent' });
            D.vec(ctx, X(xc) + (p.izq ? -8 : 8), Y(q.A) - 11, (p.izq ? -1 : 1) * Math.min(60, 8 * q.v), 0, { color: '--accent', label: 'v', width: 1.8, head: 7 });
          }
          const m1 = Math.floor((q.v * t - q.lam / 4) / q.lam);
          const ua = uc(m1), ub = ua + q.lam;
          if (ua >= 0 && ub <= front && q.lam > 0.25) {
            const xa = p.izq ? LX - ua : ua, xb = p.izq ? LX - ub : ub;
            D.dim(ctx, X(Math.min(xa, xb)), Y(q.A) - 30, X(Math.max(xa, xb)), Y(q.A) - 30, 'λ', { math: true, size: 13, labelOff: -9 });
          }
        }
      } else {
        /* longitudinal: planos de partículas desplazados a lo largo de x */
        const top = y0 - Hc * 0.24, bot = y0 + Hc * 0.14;
        const dx = 0.1, xsL = [];
        for (let x = 0; x <= LX + 1e-9; x += dx) xsL.push([x, X(x + disp(uOf(x), t))]);
        /* sombreado proporcional a la densidad: oscuro = compresión, claro = rarefacción */
        ctx.save();
        for (let i = 0; i + 1 < xsL.length; i++) {
          const c = (dx * view.s) / Math.max(1, xsL[i + 1][1] - xsL[i][1]) - 1;
          ctx.fillStyle = MC.col('--c5');
          ctx.globalAlpha = M.clamp(0.2 + 0.55 * c, 0.02, 0.6);
          ctx.fillRect(xsL[i][1], top, xsL[i + 1][1] - xsL[i][1], bot - top);
        }
        ctx.restore();
        xsL.forEach(([x, sx]) => {
          const marked = Math.abs(x - XM) < dx / 2;
          D.line(ctx, sx, top, sx, bot, { color: marked ? '--c2' : '--ink-2', width: marked ? 3 : 1.6 });
          if (marked) D.circle(ctx, sx, (top + bot) / 2, 5, { fill: '--c2' });
        });
        D.line(ctx, X(XM), bot + 6, X(XM), bot + 14, { color: '--c2', width: 1.5 });
        MC.text(ctx, 'posición de equilibrio', X(XM) + 4, bot + 16, { size: 9.5, color: '--c2' });
        /* compresión relativa −∂s/∂x */
        const cy = Hc - 34, pts = [];
        for (let i = 0; i <= 300; i++) { const x = (LX * i) / 300, e = 1e-3; const ds = (disp(uOf(x + e), t) - disp(uOf(x - e), t)) / (2 * e); pts.push([X(x), cy + ds * 60]); }
        D.line(ctx, X(0), cy, X(LX), cy, { color: '--ink-3', width: 1, dash: [2, 4] });
        D.poly(ctx, pts, { color: '--c5', width: 1.8 });
        MC.text(ctx, 'compresión (arriba) y rarefacción (abajo)', X(LX), cy - 26, { size: 10, align: 'right', color: '--c5', halo: true });
      }
      /* gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      gY.set({ ylabel: [long ? 's' : 'y', 'cm'] });
      gY.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, H, { t, yExtra: [p.A * 1.1, -p.A * 1.1] });
      MC.text(gctx, `partícula a x = ${f1(XM)} m`, gc.w - 12, 18, { size: 11, align: 'right', color: '--c2' });
      sim.set('v', `${f2(q.v)} m/s`);
      sim.set('lam', p.forma === 'seno' ? `${f3(q.lam)} m` : '— (pulso)');
      sim.set('T', p.forma === 'seno' ? `${f3(1 / p.f)} s · ${f2(p.f)} Hz` : '—');
      sim.set('kw', p.forma === 'seno' ? `${f3(q.k)} rad/m · ${f2(q.w)} rad/s` : '—');
      sim.set('vp', p.forma === 'seno' ? `${f2(q.A * q.w)} m/s` : '—');
      sim.set('P', p.forma === 'seno' ? `${sci(0.5 * (p.mu / 1000) * q.v * q.w * q.w * q.A * q.A)} W` : '—');
    });
  });

  /* ======================================================================
     17.3  Superposición, reflexión e interferencia
     ====================================================================== */
  MC.defineSim('superposicion', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const LX = 4, AM = 0.1;
    const view = new MC.View2D(cv, { xmin: -0.25, xmax: LX + 0.35, ymin: -1, ymax: 1 });
    sim.group('Situación');
    sim.seg('modo', { options: [['pulsos', 'Dos pulsos'], ['extremo', 'Extremo'], ['ondas', 'Dos ondas']], value: 'pulsos', reset: true });
    sim.seg('ext', { label: 'Extremo derecho', options: [['fijo', 'Fijo'], ['libre', 'Libre']], value: 'fijo', reset: true });
    sim.group('Ondas');
    sim.slider('A1', { label: 'Amplitud 1 (azul)', min: -10, max: 10, step: 0.1, value: 6, unit: 'cm', fmt: f1, reset: true });
    sim.slider('A2', { label: 'Amplitud 2 (naranja)', min: -10, max: 10, step: 0.1, value: 6, unit: 'cm', fmt: f1, reset: true });
    sim.slider('w', { label: 'Ancho de los pulsos', min: 0.1, max: 0.8, step: 0.01, value: 0.3, unit: 'm', fmt: f2, reset: true });
    sim.slider('ph', { label: 'Diferencia de fase φ', min: 0, max: 360, step: 1, value: 0, unit: '°', fmt: f0 });
    sim.slider('v', { label: 'Rapidez de las ondas', min: 0.3, max: 4, step: 0.05, value: 1.2, unit: 'm/s', fmt: f2, reset: true });
    sim.out('max', 'Desplazamiento máximo de la cuerda ahora', { hl: true });
    sim.out('st', 'Interferencia');
    sim.out('AR', 'Amplitud resultante');
    sim.presets([
      { id: 'constructiva', label: 'Dos pulsos iguales: constructiva', v: { modo: 'pulsos', A1: 6, A2: 6, w: 0.3 }, play: true },
      { id: 'destructiva', label: 'Pulsos iguales y opuestos: destructiva', v: { modo: 'pulsos', A1: 6, A2: -6, w: 0.3 }, play: true, note: 'En el centro la cuerda queda recta un instante, pero sus puntos se mueven: la energía es toda cinética.' },
      { id: 'distintos', label: 'Pulsos de distinto tamaño', v: { modo: 'pulsos', A1: 8, A2: -3, w: 0.35 }, play: true },
      { id: 'fijo', label: 'Reflexión en un extremo fijo', v: { modo: 'extremo', ext: 'fijo', A1: 7, w: 0.3 }, play: true, note: 'El pulso regresa invertido.' },
      { id: 'libre', label: 'Reflexión en un extremo libre', v: { modo: 'extremo', ext: 'libre', A1: 7, w: 0.3 }, play: true, note: 'El pulso regresa derecho.' },
      { id: 'fase0', label: 'Dos ondas en fase', v: { modo: 'ondas', A1: 4, A2: 4, ph: 0 }, play: true },
      { id: 'fase180', label: 'Dos ondas en oposición de fase', v: { modo: 'ondas', A1: 4, A2: 4, ph: 180 }, play: true }
    ]);
    const sync = () => {
      const m = sim.p.modo;
      sim.ctl.ext.show(m === 'extremo');
      sim.ctl.A2.show(m !== 'extremo');
      sim.ctl.w.show(m !== 'ondas');
      sim.ctl.ph.show(m === 'ondas');
    };
    sim.onChange = sync;
    sync();
    /* componentes y suma en x, tiempo t */
    const comps = (x, t) => {
      const p = sim.p, A1 = p.A1 / 100, A2 = p.A2 / 100, w = p.w, v = p.v;
      if (p.modo === 'pulsos') {
        const x1 = -2 * w + v * t, x2 = LX + 2 * w - v * t;
        return [A1 * gauss((x - x1) / w), A2 * gauss((x - x2) / w)];
      }
      if (p.modo === 'extremo') {
        const xi = -2 * w + v * t, xr = 2 * LX - xi;
        return [A1 * gauss((x - xi) / w), (p.ext === 'fijo' ? -1 : 1) * A1 * gauss((x - xr) / w)];
      }
      const lam = 1.6, k = (2 * Math.PI) / lam, om = k * v;
      return [A1 * Math.sin(k * x - om * t), A2 * Math.sin(k * x - om * t + M.rad(p.ph))];
    };
    sim.run({
      reset() {},
      step() {
        const p = sim.p, t = sim.t;
        if (p.modo === 'pulsos' && p.v * t > LX + 5 * p.w) sim.end();
        if (p.modo === 'extremo' && p.v * t > 2 * LX + 5 * p.w) sim.end();
        if (t > 90) sim.end();
      },
      h: 1 / 240
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, t = sim.t, W = cv.w, Hc = cv.h;
      view.update();
      D.clear(cv);
      const panels = [{ y0: Hc * 0.28, title: 'CADA ONDA POR SEPARADO' }, { y0: Hc * 0.74, title: 'LA CUERDA (SUMA)' }];
      const ky = (Hc * 0.18) / AM;
      const X = (x) => view.X(x);
      panels.forEach((pn, i) => {
        D.line(ctx, X(0), pn.y0, X(LX), pn.y0, { color: '--ink-3', width: 1, dash: [2, 4] });
        MC.text(ctx, pn.title, 10, pn.y0 - Hc * 0.2, { size: 10.5, weight: 700, color: '--ink-3' });
        if (i === 0) D.line(ctx, 8, Hc * 0.51, W - 8, Hc * 0.51, { color: '--rule', width: 1 });
      });
      const N = 500, xs = [];
      for (let i = 0; i <= N; i++) xs.push(-0.2 + ((LX + (p.modo === 'extremo' ? 0.2 : 0.4)) * i) / N);
      const c = xs.map((x) => comps(x, t));
      const inStr = (x) => x >= 0 && x <= LX;
      /* componentes */
      const P1 = [], P2 = [], P2v = [];
      xs.forEach((x, i) => {
        if (inStr(x)) { P1.push([X(x), panels[0].y0 - c[i][0] * ky]); P2.push([X(x), panels[0].y0 - c[i][1] * ky]); }
      });
      if (p.modo === 'extremo') {
        const P1v = [];
        for (let i = 0; i <= 200; i++) { const x = LX + (1.6 * i) / 200; const q = comps(x, t); P2v.push([X(x), panels[0].y0 - q[1] * ky]); P1v.push([X(x), panels[0].y0 - q[0] * ky]); }
        D.poly(ctx, P2v, { color: '--c4', width: 1.4, dash: [2, 4], alpha: 0.6 });
        D.poly(ctx, P1v, { color: '--c1', width: 1.4, dash: [2, 4], alpha: 0.45 });
        D.line(ctx, X(LX), panels[0].y0 - Hc * 0.17, X(LX), panels[0].y0 + Hc * 0.17, { color: '--ink-3', width: 1, dash: [3, 3] });
      }
      const legend = p.modo === 'extremo' ? [['incidente', '--c1'], [p.ext === 'fijo' ? 'reflejado (invertido)' : 'reflejado (derecho)', '--c4']] : [['onda 1', '--c1'], ['onda 2', '--c4']];
      let lx = 14;
      const ly = panels[0].y0 - Hc * 0.2 + 18;
      legend.forEach(([t2, col]) => { D.line(ctx, lx, ly - 4, lx + 22, ly - 4, { color: col, width: 2, dash: [6, 4] }); MC.text(ctx, t2, lx + 27, ly, { size: 10.5, color: col }); lx += 27 + MC.textWidth(ctx, t2, { size: 10.5 }) + 22; });
      D.poly(ctx, P1, { color: '--c1', width: 2, dash: [6, 4] });
      D.poly(ctx, P2, { color: '--c4', width: 2, dash: [6, 4] });
      /* suma */
      const PS = [];
      let ymax = 0;
      xs.forEach((x, i) => { if (inStr(x)) { const y = c[i][0] + c[i][1]; ymax = Math.max(ymax, Math.abs(y)); PS.push([X(x), panels[1].y0 - y * ky]); } });
      D.poly(ctx, PS, { color: '--rope', width: 2.6 });
      for (let i = 0; i <= 40; i++) { const x = (LX * i) / 40, q = comps(x, t); D.circle(ctx, X(x), panels[1].y0 - (q[0] + q[1]) * ky, 2, { fill: '--ink-2' }); }
      /* extremos */
      D.circle(ctx, X(0), panels[1].y0 - (comps(0, t)[0] + comps(0, t)[1]) * ky, 3, { fill: '--ink' });
      if (p.modo === 'extremo') {
        const xe = X(LX);
        if (p.ext === 'fijo') D.wall(ctx, xe, panels[1].y0 - Hc * 0.18, panels[1].y0 + Hc * 0.18, 'right');
        else {
          D.line(ctx, xe + 4, panels[1].y0 - Hc * 0.19, xe + 4, panels[1].y0 + Hc * 0.19, { color: '--metal', width: 4 });
          const q = comps(LX, t), ye = panels[1].y0 - (q[0] + q[1]) * ky;
          D.circle(ctx, xe + 4, ye, 6, { color: '--ink-2', width: 2 });
        }
      }
      /* lecturas */
      sim.set('max', `${f2(ymax * 100)} cm`);
      if (p.modo === 'ondas') {
        const AR = Math.sqrt(p.A1 * p.A1 + p.A2 * p.A2 + 2 * p.A1 * p.A2 * Math.cos(M.rad(p.ph)));
        sim.set('AR', `√(A₁² + A₂² + 2A₁A₂ cos φ) = ${f2(AR)} cm`);
        sim.set('st', Math.abs(Math.cos(M.rad(p.ph))) > 0.999 ? (Math.cos(M.rad(p.ph)) > 0 === p.A1 * p.A2 >= 0 ? 'constructiva total' : 'destructiva total') : 'parcial');
      } else {
        sim.set('AR', '—');
        const overlap = (() => { const w = p.w; if (p.modo === 'pulsos') return Math.abs((LX + 4 * w - 2 * p.v * t)) < 2.5 * w; const xi = -2 * w + p.v * t; return Math.abs(xi - LX) < 2.5 * w; })();
        const sameSign = p.modo === 'pulsos' ? p.A1 * p.A2 > 0 : p.ext === 'libre';
        sim.set('st', overlap ? (sameSign ? 'constructiva: los pulsos se suman' : 'destructiva: los pulsos se restan') : t > 0.1 ? 'los pulsos viajan sin alterarse' : '—');
      }
    });
  });

  /* ======================================================================
     17.4  Ondas estacionarias en una cuerda (experimento de Melde)
     ====================================================================== */
  const NM = 12, GAM = 0.015; /* número de modos y amortiguamiento relativo γ/ω₁ */
  /* envolvente compleja en x/L para frecuencia relativa r = f/f₁ */
  const envelope = (r, xl) => {
    let re = 0, im = 0;
    for (let n = 1; n <= NM; n++) {
      const a = n * n - r * r, b = 2 * GAM * r, d = a * a + b * b, sn = Math.sin(n * Math.PI * xl);
      re += (a / d) * sn; im += (-b / d) * sn;
    }
    return [re, im];
  };
  const ZREF = 1 / (2 * GAM);
  const RESP = (() => {
    const out = [];
    for (let i = 0; i <= 1200; i++) {
      const r = (8.6 * i) / 1200 + 1e-6;
      let mx = 0;
      for (let j = 1; j < 48; j++) { const [a, b] = envelope(r, j / 48); mx = Math.max(mx, Math.hypot(a, b)); }
      out.push([r, Math.min(1.25, mx / ZREF)]);
    }
    return out;
  })();

  MC.defineSim('estacionarias', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.4 });
    const WVIS = 2 * Math.PI * 0.6;
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    sim.group('Excitación');
    sim.seg('modo', { options: [['arm', 'Armónico n'], ['barrido', 'Barrido de frecuencia']], value: 'arm' });
    sim.slider('n', { label: 'Armónico <i>n</i>', min: 1, max: 8, step: 1, value: 3, fmt: f0 });
    sim.slider('f', { label: 'Frecuencia del vibrador <i>f</i>', min: 1, max: 160, step: 0.01, value: 55, unit: 'Hz', fmt: f2 });
    sim.check('comp', { label: 'Mostrar las dos ondas viajeras que la forman', value: false });
    sim.group('Cuerda');
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 0.2, max: 3, step: 0.01, value: 1.2, unit: 'm', fmt: f2 });
    sim.slider('Mh', { label: 'Masa que cuelga (tensión <i>F</i> = <i>Mg</i>)', min: 0.005, max: 20, step: 0.001, value: 0.1, unit: 'kg', fmt: (v) => (v < 1 ? f3(v) : f2(v)), log: true });
    sim.slider('mu', { label: 'Masa por unidad de longitud μ', min: 0.1, max: 20, step: 0.01, value: 0.5, unit: 'g/m', fmt: f2, log: true });
    sim.out('F', 'Tensión <i>F</i>');
    sim.out('v', 'Rapidez de las ondas <i>v</i>');
    sim.out('f1', 'Fundamental <i>f</i>₁ = <i>v</i>/2<i>L</i>', { hl: true });
    sim.out('fn', 'Frecuencia actual', { hl: true });
    sim.out('lam', 'Longitud de onda y nodos');
    sim.out('res', 'Resonancias');
    sim.presets([
      { id: 'fundamental', label: 'Modo fundamental (n = 1)', v: { modo: 'arm', n: 1, L: 1.2, Mh: 0.1, mu: 0.5 } },
      { id: 'segundo', label: 'Segundo armónico', v: { modo: 'arm', n: 2, L: 1.2, Mh: 0.1, mu: 0.5 } },
      { id: 'tercero', label: 'Tercer armónico', v: { modo: 'arm', n: 3, L: 1.2, Mh: 0.1, mu: 0.5 } },
      { id: 'melde', label: 'Experimento de Melde: vibrador de 55 Hz', v: { modo: 'barrido', f: 55, L: 1.2, Mh: 0.1, mu: 0.5 }, note: 'Con 0.1 kg colgando, f₁ = 18.4 Hz: a 55 Hz la cuerda resuena casi en su tercer armónico.' },
      { id: 'guitarra', label: 'Cuerda La de guitarra (0.65 m, 150 N)', v: { modo: 'arm', n: 1, L: 0.65, Mh: 15.3, mu: 7 }, note: 'f₁ ≈ 112 Hz. La animación va en cámara lenta.' }
    ]);
    const par = () => {
      const p = sim.p, F = p.Mh * 9.8, v = Math.sqrt(F / (p.mu / 1000)), fone = v / (2 * p.L);
      return { F, v, fone };
    };
    const sync = () => {
      const p = sim.p, q = par(), arm = p.modo === 'arm';
      sim.ctl.n.show(arm); sim.ctl.comp.show(arm); sim.ctl.f.show(!arm);
      const fmax = 8.5 * q.fone;
      sim.ctl.f.range(Math.max(0.01, 0.05 * q.fone), fmax, fmax > 200 ? 0.1 : 0.01);
      if (p.f > fmax) sim.ctl.f.set(fmax, true);
    };
    sim.onChange = sync;
    sync();
    sim.run({ reset() {}, step() {}, h: 1 / 120, autoplay: true, startLabel: 'Animar' });
    sim.onDraw(() => {
      const p = sim.p, q = par(), ctx = cv.ctx, W = cv.w, Hc = cv.h, t = sim.t;
      D.clear(cv);
      const arm = p.modo === 'arm';
      const r = arm ? p.n : p.f / q.fone;
      const xa = 64, xb = W - 74, y0 = Hc * 0.42, amp = Hc * 0.26;
      const X = (xl) => xa + (xb - xa) * xl;
      /* forma: envolvente compleja normalizada */
      const Z = (xl) => {
        if (arm) return [Math.sin(p.n * Math.PI * xl), 0];
        const [a, b] = envelope(r, xl);
        const m = Math.hypot(a, b) / ZREF, c = m > 1.25 ? 1.25 / m : 1;
        return [(c * a) / ZREF, (c * b) / ZREF];
      };
      const yAt = (xl) => { const [a, b] = Z(xl); return a * Math.cos(WVIS * t) - b * Math.sin(WVIS * t); };
      /* vibrador */
      const vib = 3 * Math.cos(WVIS * t * 3);
      D.block(ctx, 30, y0, 36, 44, { fill: '--c6', r: 3, label: 'vibrador', size: 9 });
      D.line(ctx, 48, y0 + vib, xa, y0, { color: '--ink-2', width: 2 });
      /* polea y masa */
      D.line(ctx, xb + 14, y0 + 14, xb - 6, Hc - 8, { color: '--ink-3', width: 3 });
      D.ground(ctx, xb - 30, Hc - 8, W, { depth: 6 });
      D.pulley(ctx, xb + 14, y0 + 14, 14, {});
      D.line(ctx, xb + 28, y0 + 14, xb + 28, Hc - 46, { color: '--rope', width: 1.5 });
      D.block(ctx, xb + 28, Hc - 32, 46, 28, { fill: '--metal', label: `${p.Mh < 1 ? f3(p.Mh) : f1(p.Mh)} kg`, size: 9.5 });
      /* envolvente */
      const env = [], envN = [];
      for (let i = 0; i <= 300; i++) { const xl = i / 300, [a, b] = Z(xl), m = Math.hypot(a, b); env.push([X(xl), y0 - m * amp]); envN.push([X(xl), y0 + m * amp]); }
      D.poly(ctx, env, { color: '--ink-3', dash: [4, 4], width: 1 });
      D.poly(ctx, envN, { color: '--ink-3', dash: [4, 4], width: 1 });
      if (arm && p.comp) {
        const c1 = [], c2 = [];
        for (let i = 0; i <= 300; i++) { const xl = i / 300, kx = p.n * Math.PI * xl; c1.push([X(xl), y0 - 0.5 * Math.sin(kx - WVIS * t) * amp]); c2.push([X(xl), y0 - 0.5 * Math.sin(kx + WVIS * t) * amp]); }
        D.poly(ctx, c1, { color: '--c1', dash: [6, 4], width: 1.6 });
        D.poly(ctx, c2, { color: '--c4', dash: [6, 4], width: 1.6 });
      }
      const str = [];
      for (let i = 0; i <= 400; i++) { const xl = i / 400; str.push([X(xl), y0 - yAt(xl) * amp]); }
      D.poly(ctx, str, { color: '--rope', width: 2.6 });
      D.circle(ctx, X(0), y0, 3.5, { fill: '--ink' });
      D.circle(ctx, X(1), y0, 3.5, { fill: '--ink' });
      if (arm) {
        for (let j = 0; j <= p.n; j++) { const xn = X(j / p.n); D.circle(ctx, xn, y0, 4, { color: '--c2', width: 1.8 }); MC.text(ctx, 'N', xn, y0 + amp + 18, { size: 11, align: 'center', weight: 700, color: '--c2' }); }
        for (let j = 0; j < p.n; j++) MC.text(ctx, 'A', X((j + 0.5) / p.n), y0 - amp - 8, { size: 11, align: 'center', weight: 700, color: '--c1' });
      }
      D.dim(ctx, X(0), Hc - 16, X(1), Hc - 16, `L = ${f2(p.L)} m`, { size: 11, labelOff: -9 });
      MC.text(ctx, 'animación en cámara lenta', 8, 14, { size: 10, color: '--ink-3' });
      /* curva de respuesta */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: 8.5 * q.fone, ymin: 0, ymax: 1.3, xlabel: ['f', 'Hz'], ylabel: ['amplitud', 'relativa'], mb: 38, mt: 14, ml: 52, mr: 14 });
      P.frame();
      P.xy(RESP.map((q2) => q2[0] * q.fone), RESP.map((q2) => q2[1]), { color: '--c5', width: 2.2 });
      for (let n = 1; n <= 8; n++) P.vline(n * q.fone, { color: '--ink-3', dash: [2, 4], label: n === 1 ? 'f₁' : `${n}f₁`, labelY: 12 });
      const fnow = arm ? p.n * q.fone : p.f;
      const rn = fnow / q.fone;
      const ynow = arm ? Math.min(1.25, (1 / p.n) * 1) : M.interp(RESP.map((q2) => q2[0]), RESP.map((q2) => q2[1]), rn);
      P.vline(fnow, { color: '--accent', width: 1.6, dash: [] });
      P.dot(fnow, ynow, { color: '--accent', r: 6 });
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'A', color: '--c5', y: M.interp(RESP.map((q2) => q2[0] * q.fone), RESP.map((q2) => q2[1]), hov.hx), fmt: f2 }], { label: 'f', unit: 'Hz', fmt: f2 });
      /* lecturas */
      sim.set('F', `${f3(q.F)} N`);
      sim.set('v', `${f2(q.v)} m/s`);
      sim.set('f1', `${f2(q.fone)} Hz`);
      const near = Math.round(rn);
      sim.set('fn', arm ? `f${'₀₁₂₃₄₅₆₇₈₉'[p.n]} = ${p.n}f₁ = ${f2(fnow)} Hz` : `${f2(fnow)} Hz = ${f2(rn)} f₁ ${Math.abs(rn - near) < 0.06 && near >= 1 ? `(resuena en el armónico ${near})` : '(no resonante)'}`);
      sim.set('lam', arm ? `λ = 2L/n = ${f3((2 * p.L) / p.n)} m · ${p.n + 1} nodos, ${p.n} antinodos` : `λ = v/f = ${f3(q.v / fnow)} m`);
      sim.set('res', [1, 2, 3, 4].map((n) => `${f1(n * q.fone)}`).join(', ') + ' … Hz');
    });
  });
})();
