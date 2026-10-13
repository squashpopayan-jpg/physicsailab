/* ===================================================================
   Capítulo 15 — Mecánica de fluidos
   Simulaciones: presion-hidrostatica, pascal, arquimedes, bernoulli, torricelli
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const G = MC.K.g;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const sci = (v, d = 3) => MC.sci(v, d);
  const RHO_ACEITE = 920;
  const FLU = {
    agua: { n: 'Agua', rho: 1000, col: '--water' },
    mar: { n: 'Agua de mar', rho: 1025, col: '--c7' },
    aceite: { n: 'Aceite', rho: 920, col: '--body-a' },
    alcohol: { n: 'Alcohol etílico', rho: 789, col: '--c3' },
    glicerina: { n: 'Glicerina', rho: 1260, col: '--c5' },
    mercurio: { n: 'Mercurio', rho: 13600, col: '--metal' }
  };
  const fluOpts = Object.keys(FLU).map((k) => [k, `${FLU[k].n} (${FLU[k].rho} kg/m³)`]);
  const inPoly = (pt, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };

  /* ======================================================================
     15.2  Presión hidrostática
     ====================================================================== */
  MC.defineSim('presion-hidrostatica', function (sim) {
    const cv = sim.canvas({ aspect: 1.45, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.9 });
    const view = new MC.View2D(cv, { xmin: 0, xmax: 1, ymin: 0, ymax: 1, pad: 12 });
    const pr = { u: 0.5 };
    let GP = null;
    const hov = { plot: null, hy: null };
    sim.group('Recipiente y líquido');
    sim.seg('rec', { options: [['tanque', 'Tanque'], ['vasos', 'Vasos comunicantes']], value: 'tanque' });
    sim.select('fl', { label: 'Líquido', value: 'agua', options: fluOpts });
    sim.slider('H', { label: 'Profundidad del líquido <i>H</i>', min: 0.1, max: 50, step: 0.01, value: 3, unit: 'm', fmt: (v) => (v < 10 ? f2(v) : f1(v)), log: true });
    const cCapa = sim.check('capa', { label: 'Capa de aceite encima (920 kg/m³)', value: false });
    sim.slider('hc', { label: 'Espesor de la capa de aceite', min: 0.02, max: 10, step: 0.01, value: 0.6, unit: 'm', fmt: f2 });
    sim.group('Atmósfera y sensor');
    sim.slider('P0', { label: 'Presión atmosférica <i>P</i>₀', min: 0, max: 110, step: 0.1, value: 101.3, unit: 'kPa', fmt: f1 });
    sim.slider('d', { label: 'Profundidad del sensor <i>h</i>', min: 0, max: 3, step: 0.01, value: 1.5, unit: 'm', fmt: f2 });
    sim.out('Pa', 'Presión absoluta <i>P</i>', { hl: true });
    sim.out('Pm', 'Presión manométrica <i>P</i> − <i>P</i>₀', { hl: true });
    sim.out('atm', 'En atmósferas');
    sim.out('mm', 'En milímetros de mercurio');
    sim.out('col', 'Columna de agua equivalente');
    sim.presets([
      { id: 'piscina', label: 'Fondo de una piscina de 3 m', v: { rec: 'tanque', fl: 'agua', H: 3, capa: false, P0: 101.3, d: 3 } },
      { id: 'buzo', label: 'Buzo a 30 m en el mar', v: { rec: 'tanque', fl: 'mar', H: 40, capa: false, P0: 101.3, d: 30 }, note: 'A 30 m la presión es de unas 4 atmósferas.' },
      { id: 'represa', label: 'Pie de una represa de 20 m', v: { rec: 'tanque', fl: 'agua', H: 20, capa: false, P0: 101.3, d: 20 } },
      { id: 'capas', label: 'Aceite sobre agua', v: { rec: 'tanque', fl: 'agua', H: 2, capa: true, hc: 0.6, P0: 101.3, d: 1.5 }, note: 'La pendiente de la recta P(h) cambia en la interfaz: es ρg de cada líquido.' },
      { id: 'barometro', label: 'Columna de 76 cm de mercurio', v: { rec: 'tanque', fl: 'mercurio', H: 0.76, capa: false, P0: 101.3, d: 0.76 }, note: 'La presión manométrica en el fondo iguala a la atmosférica: es el barómetro de Torricelli.' },
      { id: 'vasos', label: 'Vasos comunicantes', v: { rec: 'vasos', fl: 'agua', H: 1, capa: false, P0: 101.3, d: 0.6 }, note: 'La presión depende sólo de la profundidad, no de la forma del recipiente.' },
      { id: 'bogota', label: 'Piscina en Bogotá (2600 m)', v: { rec: 'tanque', fl: 'agua', H: 3, capa: false, P0: 75, d: 3 }, note: 'La presión atmosférica es menor, pero el aumento con la profundidad es el mismo.' }
    ]);
    const capaOn = () => sim.p.capa && sim.p.rec === 'tanque' && FLU[sim.p.fl].rho > RHO_ACEITE;
    const hcEff = () => (capaOn() ? Math.min(sim.p.hc, sim.p.H) : 0);
    const Pat = (d) => {
      const p = sim.p, f = FLU[p.fl], hc = hcEff();
      if (d <= hc) return p.P0 * 1000 + RHO_ACEITE * G * d;
      return p.P0 * 1000 + RHO_ACEITE * G * hc + f.rho * G * (d - hc);
    };
    let lastRec = 'tanque';
    const sync = () => {
      const p = sim.p;
      if (p.rec !== lastRec) { pr.u = p.rec === 'vasos' ? 0.064 : 0.5; lastRec = p.rec; }
      const light = FLU[p.fl].rho <= RHO_ACEITE;
      cCapa.show(p.rec === 'tanque' && !light);
      sim.ctl.hc.show(capaOn());
      sim.ctl.hc.range(0.02, Math.max(0.05, p.H * 0.95), 0.01);
      if (p.hc > p.H * 0.95) sim.ctl.hc.set(p.H * 0.95, true);
      sim.ctl.d.range(0, p.H, p.H > 10 ? 0.1 : 0.01);
      if (p.d > p.H) sim.ctl.d.set(p.H, true);
    };
    sim.onChange = sync;
    sync();
    /* geometría de los vasos comunicantes: paredes izquierda y derecha (en unidades de la altura) */
    const VES = [
      { L: [[0, 0], [0, 1]], R: [[0.14, 0], [0.14, 1]] },
      { L: [[0.36, 0], [0.22, 1]], R: [[0.48, 0], [0.62, 1]] },
      { L: [[0.74, 0], [0.74, 0.55], [0.84, 0.7], [0.84, 1]], R: [[1.0, 0], [1.0, 0.55], [0.9, 0.7], [0.9, 1]] }
    ];
    const sc = (pts, Hs) => pts.map(([x, y]) => [x * Hs * 1.1, y * Hs]);
    const vessels = (Hs) => VES.map((v) => sc(v.L, Hs).concat(sc(v.R, Hs).reverse()));
    const PIPE = 0.09;
    const geom = () => {
      const p = sim.p, Hs = p.H * 1.15 + 0.02 * Math.max(1, p.H);
      if (p.rec === 'tanque') { const Wt = Math.max(0.55 * Hs, 0.05); return { Hs, W: Wt, xmin: -0.34 * Hs, xmax: Wt + 0.5 * Hs, ymin: -0.1 * Hs }; }
      return { Hs, W: 1.1 * Hs, xmin: -0.12 * Hs, xmax: 1.2 * Hs, ymin: -0.12 * Hs };
    };
    const sensorPos = () => {
      const p = sim.p, g = geom(), y = p.H - p.d;
      if (p.rec === 'tanque') return [pr.u * g.W, y];
      return [pr.u * g.W, y];
    };
    const insideLiquid = (x, y) => {
      const p = sim.p, g = geom();
      if (y > p.H + 1e-9) return false;
      if (p.rec === 'tanque') return x >= 0.03 * g.W && x <= 0.97 * g.W && y >= 0;
      if (y < 0 && y > -PIPE * g.Hs && x > 0 && x < g.W) return true;
      return vessels(g.Hs).some((poly) => inPoly([x, y], poly));
    };
    MC.handles(sim, cv, view, () => { const [x, y] = sensorPos(); return [{ id: 0, x, y, r: 18 }]; }, (id, wx, wy) => {
      const p = sim.p, g = geom();
      const y = M.clamp(wy, p.rec === 'vasos' ? -0.95 * PIPE * g.Hs : 0, p.H);
      if (!insideLiquid(wx, y)) { if (insideLiquid(sensorPos()[0], y)) sim.ctl.d.set(p.H - y); return; }
      pr.u = wx / g.W;
      sim.ctl.d.set(p.H - y);
    });
    sim.hint('Arrastre el sensor dentro del líquido', cv);
    gc.el.addEventListener('pointermove', (e) => { if (!GP) return; const r = gc.el.getBoundingClientRect(); const y = e.clientY - r.top, x = e.clientX - r.left; hov.hy = GP.inside(x, y) ? -GP.invY(y) : null; sim.redraw(); });
    gc.el.addEventListener('pointerleave', () => { hov.hy = null; sim.redraw(); });
    sim.onDraw(() => {
      const p = sim.p, f = FLU[p.fl], g = geom(), ctx = cv.ctx;
      view.setRange({ xmin: g.xmin, xmax: g.xmax, ymin: g.ymin, ymax: g.Hs * 1.04 });
      D.clear(cv);
      const hc = hcEff();
      const Pmax = Pat(p.H), P0 = p.P0 * 1000;
      if (p.rec === 'tanque') {
        /* líquido(s) */
        D.fluid(ctx, view.X(0), view.Y(p.H - hc), view.L(g.W), view.L(p.H - hc), { color: f.col });
        if (hc > 0) D.fluid(ctx, view.X(0), view.Y(p.H), view.L(g.W), view.L(hc), { color: '--body-a', alpha0: 0.45, alpha1: 0.55 });
        D.poly(ctx, [[view.X(0), view.Y(g.Hs)], [view.X(0), view.Y(0)], [view.X(g.W), view.Y(0)], [view.X(g.W), view.Y(g.Hs)]], { color: '--ink-2', width: 3 });
        /* flechas de presión sobre la pared derecha (fuerza del líquido) */
        const Lmax = Math.max(10, view.X(g.xmax) - view.X(g.W) - 16);
        for (let k = 1; k <= 8; k++) {
          const d = (p.H * k) / 8, y = view.Y(p.H - d), L = (Lmax * (Pat(d) - P0)) / Math.max(1, Pmax - P0);
          if (L > 2) D.arrow(ctx, view.X(g.W) + 2, y, view.X(g.W) + 2 + L, y, { color: '--force', width: 1.6, head: 7 });
        }
        MC.text(ctx, 'fuerza del líquido', view.X(g.W) + 6, view.Y(0) + 14, { size: 10.5, color: '--force', halo: true });
        MC.text(ctx, 'sobre la pared', view.X(g.W) + 6, view.Y(0) + 27, { size: 10.5, color: '--force', halo: true });
        /* regla de profundidad */
        const step = MC.niceStep(p.H, 5);
        for (let d = 0; d <= p.H + 1e-9; d += step) {
          const y = view.Y(p.H - d);
          D.line(ctx, view.X(0) - 8, y, view.X(0) - 2, y, { color: '--ink-3', width: 1 });
          MC.text(ctx, `${MC.fix(d, step < 1 ? (step < 0.1 ? 2 : 1) : 0)}`, view.X(0) - 11, y, { size: 10, mono: true, align: 'right', baseline: 'middle', color: '--ink-3' });
        }
        MC.text(ctx, 'h (m)', view.X(0) - 11, view.Y(p.H) - 14, { size: 10.5, align: 'right', color: '--ink-3', math: false });
      } else {
        const vs = vessels(g.Hs);
        /* tubo de conexión y líquido */
        const py0 = -PIPE * g.Hs;
        ctx.save();
        ctx.beginPath();
        vs.forEach((poly) => { ctx.moveTo(view.X(poly[0][0]), view.Y(poly[0][1])); poly.slice(1).forEach(([x, y]) => ctx.lineTo(view.X(x), view.Y(y))); ctx.closePath(); });
        ctx.rect(view.X(0), view.Y(0), view.L(g.W), view.L(-py0));
        ctx.clip();
        D.fluid(ctx, view.X(g.xmin), view.Y(p.H), view.L(g.xmax - g.xmin), view.L(p.H - py0), { color: f.col });
        ctx.restore();
        VES.forEach((v) => { D.poly(ctx, sc(v.L, g.Hs).map((q) => view.P(q)), { color: '--ink-2', width: 2.5 }); D.poly(ctx, sc(v.R, g.Hs).map((q) => view.P(q)), { color: '--ink-2', width: 2.5 }); });
        D.poly(ctx, [[view.X(0), view.Y(0)], [view.X(0), view.Y(py0)], [view.X(g.W), view.Y(py0)], [view.X(g.W), view.Y(0)]], { color: '--ink-2', width: 2.5 });
        D.line(ctx, view.X(0.14 * 1.1 * g.Hs), view.Y(0), view.X(0.36 * 1.1 * g.Hs), view.Y(0), { color: '--ink-2', width: 2.5 });
        D.line(ctx, view.X(0.48 * 1.1 * g.Hs), view.Y(0), view.X(0.74 * 1.1 * g.Hs), view.Y(0), { color: '--ink-2', width: 2.5 });
        const ys = view.Y(p.H - p.d);
        D.line(ctx, view.X(-0.1 * g.Hs), ys, view.X(1.15 * g.Hs), ys, { color: '--accent', dash: [5, 4], width: 1.2 });
        MC.text(ctx, 'misma profundidad → misma presión', view.X(1.15 * g.Hs), ys - 6, { size: 10.5, color: '--accent', halo: true, align: 'right' });
      }
      /* superficie libre */
      const sx = p.rec === 'tanque' ? view.X(g.W * 0.82) : view.X(0.07 * g.Hs);
      D.poly(ctx, [[sx - 6, view.Y(p.H) - 10], [sx + 6, view.Y(p.H) - 10], [sx, view.Y(p.H) - 2]], { close: true, fill: '--c1', color: '--c1', width: 1 });
      MC.text(ctx, `P₀ = ${f1(p.P0)} kPa`, sx + 10, view.Y(p.H) - 8, { size: 10.5, color: '--ink-2', halo: true });
      /* sensor con flechas iguales en todas direcciones */
      const [sxw, syw] = sensorPos();
      const SX = view.X(sxw), SY = view.Y(syw), Pa = Pat(p.d);
      const la = 6 + (16 * Pa) / Math.max(Pmax, 1);
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        D.arrow(ctx, SX + (9 + la) * Math.cos(a), SY - (9 + la) * Math.sin(a), SX + 9 * Math.cos(a), SY - 9 * Math.sin(a), { color: '--c2', width: 1.5, head: 5 });
      }
      D.circle(ctx, SX, SY, 7, { fill: '--surface', color: '--ink', width: 1.8 });
      D.circle(ctx, SX, SY, 2, { fill: '--ink' });
      const lab = `${f1(Pa / 1000)} kPa`;
      const lw = MC.textWidth(ctx, lab, { size: 11, mono: true }) + 10;
      const lx = SX + lw + 34 < cv.w ? SX + 30 : SX - 30 - lw;
      D.panel(ctx, lx, SY - 10, lw, 20, {});
      MC.text(ctx, lab, lx + 5, SY + 4, { size: 11, mono: true, color: '--c2' });
      /* gráfica: presión (horizontal) contra profundidad (hacia abajo) */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      const mt = 14, mb = 38;
      let ymin = -p.H * 1.1, ymax = p.H * 0.08;
      if (Math.abs(gc.h - cv.h) < 2 && view.Y(p.H) > mt + 4) {
        /* lienzos lado a lado: la gráfica comparte la escala vertical del recipiente */
        const ih = gc.h - mt - mb;
        ymax = (view.Y(p.H) - mt) / view.s;
        ymin = ymax - ih / view.s;
      }
      const [xmin, xmax] = MC.niceRange(p.P0, Pmax / 1000, { zero: false, pad: 0.08 });
      const ystep = MC.niceStep(ymax - ymin, Math.max(2, Math.round((gc.h - mt - mb) / 38)));
      const ydec = ystep >= 1 ? 0 : ystep >= 0.1 ? 1 : 2;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: Math.max(0, xmin), xmax, ymin, ymax, xlabel: ['P', 'kPa'], ylabel: ['profundidad h', 'm'], mb, mt, ml: 54, mr: 14, yfmt: (v) => (v > 1e-9 ? '' : MC.fix(Math.abs(v) < 1e-9 ? 0 : -v, ydec)), zero: false });
      P.frame();
      P.vline(p.P0, { color: '--ink-3', label: 'P₀', labelY: 14 });
      const ds = [], ps = [];
      for (let i = 0; i <= 200; i++) { const d = (p.H * i) / 200; ds.push(-d); ps.push(Pat(d) / 1000); }
      P.xy(ps, ds, { color: '--c2', width: 2.4 });
      P.hline(0, { color: '--c1', dash: [4, 4], width: 1 });
      if (hc > 0) P.hline(-hc, { color: '--body-a', dash: [4, 4], width: 1.2, label: 'interfaz aceite–agua', labelRight: true, below: true });
      P.hline(-p.H, { color: '--ink-3', dash: [2, 3], width: 1, label: 'fondo', labelRight: true, below: true });
      P.dot(Pa / 1000, -p.d, { color: '--c2', r: 6 });
      if (hov.hy !== null && hov.hy >= 0 && hov.hy <= p.H) {
        const d = hov.hy;
        P.hline(-d, { color: '--ink-2', dash: [3, 3], width: 1 });
        P.dot(Pat(d) / 1000, -d, { color: '--ink-2', r: 4, label: `h = ${f2(d)} m: ${f1(Pat(d) / 1000)} kPa`, dy: -8, mono: true });
      }
      /* lecturas */
      sim.set('Pa', `${f1(Pa / 1000)} kPa`);
      sim.set('Pm', `${f1((Pa - P0) / 1000)} kPa`);
      sim.set('atm', `${f3(Pa / 101325)} atm (manométrica ${f3((Pa - P0) / 101325)} atm)`);
      sim.set('mm', `${f0((Pa - P0) / 133.322)} mmHg manométricos`);
      sim.set('col', `${f2((Pa - P0) / (1000 * G))} m de agua`);
    });
  });

  /* ======================================================================
     15.3  La prensa hidráulica
     ====================================================================== */
  MC.defineSim('pascal', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const s = { ph: 0, sp: 0, z: 0, n: 0, Win: 0, blocked: false };
    const TP = 1.2, ZMAX = 1.5;
    const st = sim.status(cv);
    sim.group('Pistones');
    sim.slider('d1', { label: 'Diámetro del pistón pequeño', min: 1, max: 10, step: 0.1, value: 5, unit: 'cm', fmt: f1, reset: true });
    sim.slider('d2', { label: 'Diámetro del pistón grande', min: 5, max: 50, step: 0.5, value: 30, unit: 'cm', fmt: f1, reset: true });
    sim.slider('st', { label: 'Carrera del pistón pequeño', min: 5, max: 40, step: 1, value: 20, unit: 'cm', fmt: f0, reset: true });
    sim.group('Fuerzas');
    sim.slider('m', { label: 'Masa de la carga', min: 50, max: 3000, step: 10, value: 1500, unit: 'kg', fmt: f0, reset: true });
    sim.slider('F1', { label: 'Fuerza aplicada <i>F</i>₁', min: 10, max: 2000, step: 1, value: 409, unit: 'N', fmt: f0 });
    sim.button('Fuerza justa', () => { const req = reqF(); sim.ctl.F1.set(Math.ceil(req)); });
    sim.out('rat', 'Ventaja mecánica <i>A</i>₂/<i>A</i>₁');
    sim.out('P', 'Presión en el líquido <i>F</i>₁/<i>A</i>₁');
    sim.out('F2', 'Fuerza sobre el pistón grande <i>PA</i>₂', { hl: true });
    sim.out('req', 'Fuerza necesaria <i>mg A</i>₁/<i>A</i>₂');
    sim.out('dz', 'Subida por embolada');
    sim.out('n', 'Emboladas para subir 1 m');
    sim.out('W', 'Trabajo de entrada y energía ganada', { hl: true });
    sim.presets([
      { id: 'elevador', label: 'Elevador de taller: auto de 1500 kg', v: { d1: 5, d2: 30, st: 20, m: 1500, F1: 409 }, note: 'Con 409 N se levanta un auto de 14 700 N: la fuerza se multiplica 36 veces.' },
      { id: 'insuficiente', label: 'Fuerza insuficiente', v: { d1: 5, d2: 30, st: 20, m: 1500, F1: 300 }, note: 'Con menos de 408 N el pistón pequeño no logra bajar.' },
      { id: 'silla', label: 'Silla de barbero con una persona', v: { d1: 2, d2: 8, st: 10, m: 120, F1: 75 } },
      { id: 'igual', label: 'Pistones iguales: no hay ventaja', v: { d1: 10, d2: 10, st: 20, m: 60, F1: 590 } }
    ]);
    const A1 = () => Math.PI * Math.pow(sim.p.d1 / 200, 2), A2 = () => Math.PI * Math.pow(sim.p.d2 / 200, 2);
    const reqF = () => (sim.p.m * G * A1()) / A2();
    sim.run({
      startLabel: 'Bombear',
      h: 1 / 240,
      reset() { s.ph = 0; s.sp = 0; s.z = 0; s.n = 0; s.Win = 0; s.blocked = false; st.hide(); },
      step(h) {
        const p = sim.p, stroke = p.st / 100;
        const ok = p.F1 >= reqF() * (1 - 1e-9);
        const prev = s.ph;
        s.ph += h / TP;
        if (s.ph < 0.5) {
          s.blocked = !ok;
          if (ok) {
            const nsp = s.ph / 0.5, dsp = nsp - s.sp;
            s.sp = nsp;
            s.z += (dsp * stroke * A1()) / A2();
            s.Win += p.F1 * dsp * stroke;
          }
        } else {
          if (prev < 0.5 && !s.blocked) s.n++;
          s.sp = s.blocked ? 0 : Math.max(0, 1 - (s.ph - 0.5) / 0.5);
        }
        if (s.ph >= 1) s.ph -= 1;
        if (s.blocked) st.show('La fuerza aplicada no alcanza: el pistón pequeño no baja', 'bad'); else st.hide();
        if (s.z >= ZMAX) { s.z = ZMAX; st.show('La carga llegó a la altura máxima', 'good'); sim.end(); }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const gy = H - 26;
      D.ground(ctx, 0, gy, W, { depth: 10 });
      const yb = gy - 30, Hav = Math.max(260, yb - 40);
      const w1 = 10 + p.d1 * 4.2, w2 = 34 + p.d2 * 3.4;
      const x1 = W * 0.22, x2 = Math.min(W * 0.66, W - w2 / 2 - 90);
      const kz = (0.3 * Hav) / ZMAX, kst = (0.28 * Hav) / 0.4;
      const top1 = yb - 0.5 * Hav, h2 = 0.12 * Hav;
      /* líquido: tubo inferior y cilindros */
      const oil = '--body-a';
      const yPist1 = top1 + 30 + s.sp * (p.st / 100) * kst;
      const yPist2 = yb - h2 - s.z * kz;
      D.fluid(ctx, x1 - w1 / 2, yPist1, w1, yb - yPist1, { color: oil, alpha0: 0.55, alpha1: 0.7 });
      D.fluid(ctx, x2 - w2 / 2, yPist2, w2, yb - yPist2, { color: oil, alpha0: 0.55, alpha1: 0.7 });
      D.fluid(ctx, x1 - w1 / 2, yb, x2 - x1 + w1 / 2 + w2 / 2, 18, { color: oil, alpha0: 0.6, alpha1: 0.7 });
      /* paredes */
      D.poly(ctx, [[x1 - w1 / 2, top1], [x1 - w1 / 2, yb + 18], [x2 + w2 / 2, yb + 18], [x2 + w2 / 2, yb - h2 - ZMAX * kz - 10]], { color: '--ink-2', width: 2.5 });
      D.poly(ctx, [[x1 + w1 / 2, top1], [x1 + w1 / 2, yb], [x2 - w2 / 2, yb], [x2 - w2 / 2, yb - h2 - ZMAX * kz - 10]], { color: '--ink-2', width: 2.5 });
      /* depósito y válvulas (esquemáticos) */
      const rx = x1 - w1 / 2 - 70;
      if (rx > 8) {
        D.fluid(ctx, rx, yb - 40, 46, 40, { color: oil, alpha0: 0.5, alpha1: 0.65 });
        D.poly(ctx, [[rx, yb - 60], [rx, yb], [rx + 46, yb], [rx + 46, yb - 60]], { color: '--ink-2', width: 2 });
        D.line(ctx, rx + 46, yb - 8, x1 - w1 / 2, yb - 8, { color: '--ink-2', width: 2 });
        D.circle(ctx, (rx + 46 + x1 - w1 / 2) / 2, yb - 8, 5, { fill: s.ph >= 0.5 && s.sp > 0 ? '--vel' : '--surface', color: '--ink-2' });
        MC.text(ctx, 'depósito', rx + 23, yb - 66, { size: 10, align: 'center', color: '--ink-3' });
      }
      /* pistones */
      D.block(ctx, x1, yPist1 - 7, w1 - 4, 14, { fill: '--metal', r: 2 });
      D.line(ctx, x1, yPist1 - 14, x1, top1 - 30, { color: '--ink-2', width: 4 });
      D.block(ctx, x2, yPist2 - 9, w2 - 4, 18, { fill: '--metal', r: 2 });
      D.block(ctx, x2, yPist2 - 22, w2 + 40, 8, { fill: '--ink-3', r: 1 });
      const carLen = Math.min(190, w2 + 110);
      D.car(ctx, x2, yPist2 - 26, carLen, { color: '--body-c' });
      /* fuerzas */
      const req = reqF();
      const L1 = M.clamp((60 * p.F1) / Math.max(req, 1), 12, 110);
      D.vec(ctx, x1, top1 - 30 - L1, 0, L1, { color: '--force', label: 'F₁', size: 14, vec: false });
      const F2 = (p.F1 * A2()) / A1();
      const L2 = M.clamp((60 * F2) / Math.max(p.m * G, 1), 12, 110);
      D.vec(ctx, x2 - w2 / 2 - 18, yPist2 + L2 / 2, 0, -L2, { color: '--force', label: 'F₂', size: 14, vec: false, labelSide: -1 });
      MC.text(ctx, `P = ${f1(p.F1 / A1() / 1000)} kPa en todo el líquido`, x1 + w1 / 2 + 10, yb + 12, { size: 11, color: '--ink-2', halo: true });
      MC.text(ctx, `A₁ (Ø ${f1(p.d1)} cm)`, x1, top1 - 36 - L1 - 6, { size: 11, align: 'center', color: '--ink-2', halo: true });
      MC.text(ctx, `A₂ (Ø ${f1(p.d2)} cm)`, x2, yb + 34, { size: 11, align: 'center', color: '--ink-2', halo: true });
      MC.text(ctx, `subida: ${f1(s.z * 100)} cm · ${s.n} emboladas`, 10, 18, { size: 11.5, mono: true, color: '--ink-2', halo: true });
      /* trabajo */
      const Ug = p.m * G * s.z;
      D.bars(ctx, [{ label: 'W_{1}', value: s.Win, color: '--c4' }, { label: 'mgΔz', value: Ug, color: '--Ug', math: false }], { x: W - 150, y: 30, w: 142, h: Math.min(190, 0.3 * H), max: MC.niceCeil(Math.max(s.Win, Ug, 10) * 1.15), title: 'TRABAJO Y ENERGÍA (J)', fmt: f0 });
      /* lecturas */
      sim.set('rat', f1(A2() / A1()));
      sim.set('P', `${f1(p.F1 / A1() / 1000)} kPa`);
      sim.set('F2', `${f0(F2)} N (peso de la carga ${f0(p.m * G)} N)`);
      sim.set('req', `${f1(req)} N`);
      const dz = ((p.st / 100) * A1()) / A2();
      sim.set('dz', `${sci(dz * 100)} cm`);
      sim.set('n', f0(Math.ceil(1 / dz)));
      sim.set('W', `${f0(s.Win)} J y ${f0(Ug)} J`);
    });
  });

  /* ======================================================================
     15.4  Principio de Arquímedes
     ====================================================================== */
  const MATS = {
    corcho: { n: 'Corcho', rho: 240, col: '--wood' },
    madera: { n: 'Madera', rho: 600, col: '--wood' },
    hielo: { n: 'Hielo', rho: 917, col: '--sky' },
    aluminio: { n: 'Aluminio', rho: 2700, col: '--metal' },
    hierro: { n: 'Hierro', rho: 7870, col: '--ink-3' },
    oro: { n: 'Oro', rho: 19300, col: '--marker-solid' },
    corona: { n: 'Corona (oro con 30 % de plata)', rho: 15410, col: '--body-a' }
  };
  MC.defineSim('arquimedes', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    const s = { free: false, autoFree: false, y: 0, v: 0 };
    const st = sim.status(cv);
    sim.group('Cuerpo');
    sim.select('mat', { label: 'Material', value: 'aluminio', options: Object.keys(MATS).map((k) => [k, `${MATS[k].n} (${MATS[k].rho} kg/m³)`]), reset: true });
    sim.slider('a', { label: 'Arista del cubo <i>a</i>', min: 2, max: 20, step: 0.01, value: 10, unit: 'cm', fmt: f2, reset: true });
    sim.group('Líquido');
    sim.select('fl', { label: 'Líquido', value: 'agua', options: fluOpts, reset: true });
    sim.slider('inm', { label: 'Profundidad de la cara inferior (colgado)', min: 0, max: 1.6, step: 0.005, value: 0.5, reset: true, fmt: (v) => `${f1(v * sim.p.a)} cm` });
    sim.button('Cortar el hilo', () => { s.autoFree = true; sim.reset(true); sim.play(); }, { primary: true });
    sim.out('m', 'Masa y peso del cuerpo');
    sim.out('B', 'Empuje <i>B</i> = ρ<sub>f</sub><i>V</i><sub>sum</sub><i>g</i>', { hl: true });
    sim.out('T', 'Lectura del dinamómetro (peso aparente)', { hl: true });
    sim.out('V', 'Volumen sumergido');
    sim.out('rat', 'ρ<sub>cuerpo</sub>/ρ<sub>líquido</sub>');
    sim.out('st', 'Estado');
    sim.presets([
      { id: 'hielo', label: 'Cubo de hielo en agua', v: { mat: 'hielo', a: 5, fl: 'agua', inm: 0.3 }, fn: () => { s.autoFree = true; }, play: true, note: 'Flota con el 91.7 % sumergido.' },
      { id: 'iceberg', label: 'Hielo en agua de mar (iceberg)', v: { mat: 'hielo', a: 10, fl: 'mar', inm: 0.3 }, fn: () => { s.autoFree = true; }, play: true, note: '917/1025: queda sumergido el 89.5 %.' },
      { id: 'aluminio', label: 'Bloque de aluminio colgado', v: { mat: 'aluminio', a: 10, fl: 'agua', inm: 1.2 } },
      { id: 'hierro-mercurio', label: 'Hierro en mercurio', v: { mat: 'hierro', a: 6, fl: 'mercurio', inm: 0.3 }, fn: () => { s.autoFree = true; }, play: true, note: 'El mercurio es más denso que el hierro: el bloque flota con el 58 % sumergido.' },
      { id: 'oro', label: '1 kg de oro puro sumergido en agua', v: { mat: 'oro', a: 3.728, fl: 'agua', inm: 1.3 }, note: 'Peso aparente: 9.29 N.' },
      { id: 'corona', label: '1 kg de corona (oro con plata) en agua', v: { mat: 'corona', a: 4.0185, fl: 'agua', inm: 1.3 }, note: 'Peso aparente: 9.16 N, menos que el oro puro. Arquímedes descubrió el fraude.' },
      { id: 'corcho', label: 'Corcho soltado bajo el agua', v: { mat: 'corcho', a: 8, fl: 'agua', inm: 1.4 }, fn: () => { s.autoFree = true; }, play: true }
    ]);
    const mat = () => MATS[sim.p.mat], flu = () => FLU[sim.p.fl];
    sim.onChange = () => sim.ctl.inm.refresh();
    const geo = () => { const a = sim.p.a / 100; return { a, Wb: 3 * a, Hb: 3.1 * a, h0: 1.9 * a }; };
    const mass = () => mat().rho * Math.pow(sim.p.a / 100, 3);
    /* profundidad sumergida y nivel del líquido para la base del cuerpo a la altura yb (sobre el fondo) */
    const level = (yb) => {
      const g = geo();
      let hs = g.h0;
      for (let k = 0; k < 6; k++) { const d = M.clamp(hs - yb, 0, g.a); hs = g.h0 + (g.a * g.a * d) / (g.Wb * g.Wb); }
      return { hs, d: M.clamp(hs - yb, 0, g.a) };
    };
    const ybHang = () => {
      const g = geo(), p = sim.p;
      let yb = g.h0 - p.inm * g.a;
      for (let k = 0; k < 6; k++) { const L = level(yb); yb = L.hs - p.inm * g.a; }
      return Math.max(0, yb);
    };
    const floatY = () => { const g = geo(); const dEq = (mat().rho / flu().rho) * g.a; let yb = g.h0 - dEq; for (let k = 0; k < 6; k++) yb = level(yb).hs - dEq; return yb; };
    sim.run({
      startLabel: 'Soltar',
      h: 1 / 1000,
      reset() {
        s.free = !!s.autoFree; s.autoFree = false; s.v = 0; st.hide();
        s.y = ybHang();
      },
      step(h) {
        if (!s.free) { sim.end(); return; }
        const g = geo(), m = mass(), W = m * G, L = level(s.y);
        const B = flu().rho * G * g.a * g.a * L.d;
        const k = flu().rho * G * g.a * g.a, c = 2 * 0.3 * Math.sqrt(k * m);
        const drag = L.d > 0 ? c * s.v : 0.05 * c * s.v;
        s.v += ((B - W - drag) / m) * h;
        s.y += s.v * h;
        if (s.y <= 0) { s.y = 0; if (s.v < 0) s.v = 0; }
        if (sim.t > 12) sim.end();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, g = geo(), m = mass(), Wt = m * G, fl = flu(), mt = mat();
      D.clear(cv);
      /* estado */
      let yb, tension, normal = 0, slack = false;
      if (s.free) yb = s.y;
      else {
        yb = ybHang();
        const L = level(yb), B = fl.rho * G * g.a * g.a * L.d;
        if (B > Wt) { slack = true; yb = floatY(); }
      }
      const L = level(yb), Vs = g.a * g.a * L.d, B = fl.rho * G * Vs;
      if (s.free) { tension = 0; normal = yb <= 1e-6 ? Math.max(0, Wt - B) : 0; }
      else tension = slack ? 0 : Math.max(0, Wt - B);
      /* escena: vaso a la izquierda */
      const sceneW = W > 520 ? W * 0.6 : W;
      const kp = Math.min((sceneW - 40) / (g.Wb * 1.25), (H - 190) / g.Hb);
      const bx = sceneW / 2 - (g.Wb * kp) / 2, by = H - 28;
      D.ground(ctx, 0, by, sceneW, { depth: 8 });
      const X = (x) => bx + x * kp, Y = (y) => by - y * kp;
      D.fluid(ctx, X(0), Y(L.hs), g.Wb * kp, L.hs * kp, { color: fl.col });
      D.poly(ctx, [[X(0), Y(g.Hb)], [X(0), Y(0)], [X(g.Wb), Y(0)], [X(g.Wb), Y(g.Hb)]], { color: '--ink-2', width: 2.5 });
      D.line(ctx, X(0) - 3, Y(g.h0), X(0) - 12, Y(g.h0), { color: '--ink-3', width: 1 });
      MC.text(ctx, 'nivel', X(0) - 15, Y(g.h0) - 2, { size: 10, color: '--ink-3', align: 'right' });
      MC.text(ctx, 'inicial', X(0) - 15, Y(g.h0) + 10, { size: 10, color: '--ink-3', align: 'right' });
      /* cuerpo */
      const cx = X(g.Wb / 2), side = g.a * kp;
      D.block(ctx, cx, Y(yb + g.a / 2), side, side, { fill: mt.col, label: side > 34 ? mt.n.split(' ')[0] : '', size: Math.min(12, side * 0.22) });
      /* dinamómetro */
      const dmY = 26, dmH = Math.max(70, Math.min(120, Y(yb + g.a) - dmY - 40));
      D.line(ctx, cx - 60, dmY - 8, cx + 30, dmY - 8, { color: '--ink-2', width: 5 });
      ctx.save(); ctx.fillStyle = MC.col('--surface-2'); ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx - 14, dmY - 4, 28, dmH, 5); else ctx.rect(cx - 14, dmY - 4, 28, dmH); ctx.fill(); ctx.stroke(); ctx.restore();
      const Tmax = MC.niceCeil(Wt * 1.05);
      for (let k = 0; k <= 5; k++) { const yy = dmY + 6 + ((dmH - 18) * k) / 5; D.line(ctx, cx - 8, yy, cx - 2, yy, { color: '--ink-3', width: 1 }); }
      const yPtr = dmY + 6 + ((dmH - 18) * Math.min(tension, Tmax)) / Tmax;
      D.line(ctx, cx - 10, yPtr, cx + 10, yPtr, { color: '--c2', width: 2.5 });
      MC.text(ctx, `${f2(tension)} N`, cx + 18, yPtr + 4, { size: 11, mono: true, color: '--c2', halo: true });
      const hookY = dmY + dmH - 2;
      if (!s.free) D.line(ctx, cx, hookY, cx, Y(yb + g.a), { color: slack ? '--ink-3' : '--rope', width: 1.5, dash: slack ? [3, 3] : null });
      else { D.line(ctx, cx, hookY, cx, hookY + 18, { color: '--rope', width: 1.5 }); D.line(ctx, cx, Y(yb + g.a), cx, Y(yb + g.a) - 12, { color: '--rope', width: 1.5 }); }
      /* diagrama de cuerpo libre y barras */
      if (W > 520) {
        const fx = sceneW + 6, fw = W - sceneW - 14;
        const forces = [{ fx: 0, fy: -Wt, color: '--weight', label: 'w' }, { fx: 0, fy: B, color: '--c1', label: 'B', ox: -10 }];
        if (tension > 1e-6) forces.push({ fx: 0, fy: tension, color: '--tension', label: 'T', ox: 10 });
        if (normal > 1e-6) forces.push({ fx: 0, fy: normal, color: '--normal', label: 'n', ox: 10 });
        D.fbd(ctx, forces, { x: fx, y: 10, w: fw, h: Math.min(230, H * 0.45), shape: 'block', fill: mt.col });
        const items = [{ label: 'w', value: Wt, color: '--weight' }, { label: 'B', value: B, color: '--c1' }, { label: s.free ? 'n' : 'T', value: s.free ? normal : tension, color: s.free ? '--normal' : '--tension' }];
        D.bars(ctx, items, { x: fx, y: Math.min(230, H * 0.45) + 20, w: fw, h: H - Math.min(230, H * 0.45) - 30, max: MC.niceCeil(Wt * 1.05 + 1e-9), title: 'FUERZAS (N)', fmt: (v) => MC.sci(v, 3) });
      }
      /* lecturas */
      const frac = L.d / g.a;
      sim.set('m', `${sci(m * 1000)} g, ${sci(Wt)} N`);
      sim.set('B', `${sci(B)} N`);
      sim.set('T', s.free ? '— (hilo cortado)' : slack ? '0 N (hilo flojo: flota)' : `${sci(tension)} N`);
      sim.set('V', `${sci(Vs * 1e6)} cm³ (${f1(frac * 100)} % del cuerpo)`);
      sim.set('rat', `${f3(mt.rho / fl.rho)} → ${mt.rho < fl.rho ? 'flota' : mt.rho > fl.rho ? 'se hunde' : 'queda en equilibrio a cualquier profundidad'}`);
      sim.set('st', s.free ? (normal > 1e-6 ? 'hundido, apoyado en el fondo' : Math.abs(s.v) < 0.002 ? 'flotando en equilibrio' : 'en movimiento') : slack ? 'flota (el hilo no tira)' : 'colgado del dinamómetro');
    });
  });

  /* ======================================================================
     15.5  Tubo de Venturi: continuidad y Bernoulli
     ====================================================================== */
  MC.defineSim('bernoulli', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.4 });
    const LEN = 6, ST = [1.0, 3.0, 5.4];
    const parts = [];
    for (let i = 0; i < 110; i++) parts.push({ x: Math.random() * LEN, u: (Math.random() * 2 - 1) * 0.85 });
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    sim.group('Tubo');
    sim.slider('D1', { label: 'Diámetro del tubo <i>D</i>₁', min: 1, max: 20, step: 0.1, value: 10, unit: 'cm', fmt: f1 });
    sim.slider('D2', { label: 'Diámetro del estrechamiento <i>D</i>₂', min: 0.5, max: 20, step: 0.1, value: 5, unit: 'cm', fmt: f1 });
    sim.slider('dy', { label: 'Desnivel del tramo final Δ<i>y</i>', min: -10, max: 30, step: 0.1, value: 0, unit: 'm', fmt: f1 });
    sim.group('Flujo');
    sim.slider('Q', { label: 'Caudal <i>Q</i>', min: 0.05, max: 40, step: 0.01, value: 15.71, unit: 'L/s', fmt: f2, log: true });
    sim.slider('P1', { label: 'Presión a la entrada <i>P</i>₁ (absoluta)', min: 50, max: 600, step: 1, value: 150, unit: 'kPa', fmt: f0 });
    sim.out('v', 'Rapidez en 1, 2 y 3', { hl: true });
    sim.out('P', 'Presión absoluta en 1, 2 y 3', { hl: true });
    sim.out('dP', 'Caída de presión <i>P</i>₁ − <i>P</i>₂');
    sim.out('cont', 'Continuidad <i>A</i>₁<i>v</i>₁ = <i>A</i>₂<i>v</i>₂');
    sim.out('st', 'Estado');
    sim.presets([
      { id: 'venturi', label: 'Medidor de Venturi (10 cm → 5 cm)', v: { D1: 10, D2: 5, dy: 0, Q: 15.71, P1: 150 }, note: 'v₁ = 2 m/s, v₂ = 8 m/s: la presión baja 30 kPa en el estrechamiento.' },
      { id: 'manguera', label: 'Boquilla de una manguera', v: { D1: 2, D2: 0.8, dy: 0, Q: 0.25, P1: 120 } },
      { id: 'edificio', label: 'Agua que sube 10 m (a un tercer piso)', v: { D1: 5, D2: 5, dy: 10, Q: 2, P1: 250 }, note: 'Sin cambio de área, la presión baja ρgΔy = 98 kPa al subir 10 m.' },
      { id: 'cavitacion', label: 'Estrechamiento extremo: cavitación', v: { D1: 10, D2: 3, dy: 0, Q: 20, P1: 150 }, note: 'La presión calculada en el estrechamiento sería negativa: el agua se vaporiza.' }
    ]);
    const rho = 1000;
    const Dx = (x) => {
      const p = sim.p, sm = (t) => { t = M.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
      if (x < 1.8) return p.D1;
      if (x < 2.6) return p.D1 + (p.D2 - p.D1) * sm((x - 1.8) / 0.8);
      if (x < 3.4) return p.D2;
      if (x < 4.2) return p.D2 + (p.D1 - p.D2) * sm((x - 3.4) / 0.8);
      return p.D1;
    };
    const Yx = (x) => { const t = M.clamp((x - 4.2) / 1.0, 0, 1); return sim.p.dy * t * t * (3 - 2 * t); };
    const Ax = (x) => (Math.PI * Math.pow(Dx(x) / 100, 2)) / 4;
    const Vx = (x) => sim.p.Q / 1000 / Ax(x);
    const Px = (x) => { const p = sim.p, v1 = Vx(0); return p.P1 * 1000 + 0.5 * rho * (v1 * v1 - Vx(x) * Vx(x)) - rho * G * Yx(x); };
    sim.animate((dt) => {
      const v1 = Vx(0);
      for (const q of parts) {
        q.x += (Vx(q.x) / Math.max(v1, 1e-9)) * 0.6 * dt;
        if (q.x > LEN) { q.x -= LEN; q.u = (Math.random() * 2 - 1) * 0.85; }
      }
    }, { button: false });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const x0 = 26, x1 = W - 26, kx = (x1 - x0) / LEN;
      const Dmax = Math.max(p.D1, p.D2), rmax = Math.min(34, H * 0.12);
      const R = (x) => 5 + (rmax - 5) * (Dx(x) / Dmax);
      const rise = p.dy === 0 ? 0 : M.clamp(Math.sign(p.dy) * (18 + 3 * Math.abs(p.dy)), -60, 90);
      const baseY = H - 34 - Math.max(0, -rise) - rmax;
      const CY = (x) => baseY - (p.dy === 0 ? 0 : (rise * Yx(x)) / p.dy);
      const top = [], bot = [];
      for (let i = 0; i <= 240; i++) { const x = (LEN * i) / 240; top.push([x0 + x * kx, CY(x) - R(x)]); bot.push([x0 + x * kx, CY(x) + R(x)]); }
      ctx.save();
      ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); top.forEach((q) => ctx.lineTo(q[0], q[1])); bot.slice().reverse().forEach((q) => ctx.lineTo(q[0], q[1])); ctx.closePath();
      ctx.fillStyle = MC.alpha('--water', 0.28); ctx.fill();
      ctx.clip();
      for (const q of parts) { const x = x0 + q.x * kx; D.circle(ctx, x, CY(q.x) + q.u * R(q.x), 2.1, { fill: '--c1' }); }
      ctx.restore();
      D.poly(ctx, top, { color: '--ink-2', width: 2.4 });
      D.poly(ctx, bot, { color: '--ink-2', width: 2.4 });
      /* manómetros (piezómetros) */
      const heads = ST.map((x) => (Px(x) - 101325) / (rho * G));
      const avail = Math.min(...ST.map((x) => CY(x) - R(x))) - 22;
      const kh = Math.min(26, avail / Math.max(0.5, ...heads.map((h) => Math.max(0, h))));
      ST.forEach((x, i) => {
        const X = x0 + x * kx, yt = CY(x) - R(x), hd = heads[i];
        const colTop = yt - Math.max(0, hd) * kh;
        const tubeTop = yt - Math.max(0.5, ...heads.map((h) => Math.max(0, h))) * kh - 8;
        ctx.save(); ctx.fillStyle = MC.alpha('--water', 0.55); ctx.fillRect(X - 4, colTop, 8, yt - colTop); ctx.restore();
        D.line(ctx, X - 5, tubeTop, X - 5, yt, { color: '--ink-2', width: 1.3 });
        D.line(ctx, X + 5, tubeTop, X + 5, yt, { color: '--ink-2', width: 1.3 });
        MC.text(ctx, `${i + 1}`, X, CY(x) + R(x) + 15, { size: 12, align: 'center', weight: 700, color: '--ink-2' });
        const right = X + 80 > W;
        MC.text(ctx, hd >= 0 ? `${f1(Px(x) / 1000)} kPa` : 'succión', right ? X - 9 : X + 9, Math.max(14, colTop - 4), { size: 10.5, mono: true, color: hd >= 0 ? '--c1' : '--warn-ink', halo: true, align: right ? 'right' : 'left' });
        const v = Vx(x);
        MC.text(ctx, `v = ${sci(v)} m/s`, X, CY(x) + R(x) + 29, { size: 10.5, mono: true, align: 'center', color: '--vel', halo: true });
      });
      if (p.dy !== 0) MC.text(ctx, `Δy = ${f1(p.dy)} m (no a escala)`, x0 + 4.6 * kx, CY(5.2) - R(5.2) - 8 - (p.dy > 0 ? 0 : 0), { size: 10.5, color: '--ink-3', halo: true, align: 'right' });
      /* gráfica de energías por unidad de volumen */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      const tot = p.P1 * 1000 + 0.5 * rho * Vx(0) * Vx(0);
      const xs = [], a1 = [], a2 = [], a3 = [];
      for (let i = 0; i <= 240; i++) { const x = (LEN * i) / 240; xs.push(x); a1.push(Px(x) / 1000); a2.push((0.5 * rho * Vx(x) * Vx(x)) / 1000); a3.push((rho * G * Yx(x)) / 1000); }
      const lo = Math.min(0, ...a1, ...a3), hi = Math.max(tot / 1000, ...a2);
      const [ymin, ymax] = MC.niceRange(lo, hi, { zero: true, pad: 0.06 });
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: LEN, ymin, ymax, xlabel: ['x', 'm'], ylabel: ['E/V', 'kPa = kJ/m³'], mb: 38, mt: 12, ml: 56, mr: 14 });
      P.frame();
      P.band(1.8, 4.2, { color: '--c1', alpha: 0.05 });
      P.hline(tot / 1000, { color: '--Etot', dash: [6, 4], width: 1.6, label: 'P + ½ρv² + ρgy (constante)', labelRight: true });
      P.xy(xs, a1, { color: '--c1', width: 2.4 });
      P.xy(xs, a2, { color: '--K', width: 2.2 });
      if (p.dy !== 0) P.xy(xs, a3, { color: '--Ug', width: 2.2 });
      P.hline(2.34, { color: '--warn-ink', dash: [2, 3], width: 1, label: 'presión de vapor del agua', below: true });
      P.legend([{ label: 'P', color: '--c1', math: true }, { label: '½ρv²', color: '--K' }].concat(p.dy !== 0 ? [{ label: 'ρgy', color: '--Ug' }] : []), 'tl');
      ST.forEach((x, i) => P.vline(x, { color: '--ink-3', label: String(i + 1), labelY: 26, dash: [2, 4] }));
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'P', unit: 'kPa', color: '--c1', y: Px(hov.hx) / 1000, fmt: f1 }, { label: '½ρv²', unit: 'kPa', color: '--K', y: (0.5 * rho * Vx(hov.hx) ** 2) / 1000, fmt: f1 }], { label: 'x', unit: 'm', fmt: f2 });
      /* lecturas */
      const v = ST.map(Vx), Pp = ST.map(Px);
      sim.set('v', v.map((q) => sci(q)).join(' · ') + ' m/s');
      sim.set('P', Pp.map((q) => (q < 2340 ? '<span class="warnv">&lt; 2.3 (vapor)</span>' : f1(q / 1000))).join(' · ') + ' kPa');
      sim.set('dP', `${f1((Pp[0] - Pp[1]) / 1000)} kPa`);
      sim.set('cont', `${sci(Ax(ST[0]) * v[0] * 1000)} L/s = ${sci(Ax(ST[1]) * v[1] * 1000)} L/s`);
      const minP = Math.min(...a1);
      sim.set('st', minP < 2.34 ? '<span class="warnv">cavitación: la presión llega a la de vapor</span>' : Pp.some((q) => q < 101325) ? 'hay zonas con presión menor que la atmosférica (succión)' : '<span class="goodv">flujo normal</span>');
    });
  });

  /* ======================================================================
     15.6  Teorema de Torricelli
     ====================================================================== */
  MC.defineSim('torricelli', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const view = new MC.View2D(cv, { xmin: -1, xmax: 1, ymin: 0, ymax: 1, pad: 10, align: 'bottom' });
    const Hh = new MC.History(['h', 'x']);
    const gH = new MC.TGraph({ ylabel: ['', 'm'], series: [{ key: 'h', label: 'nivel del agua', unit: 'm', color: '--water', fmt: f3 }, { key: 'x', label: 'alcance del chorro', unit: 'm', color: '--c4', fmt: f3 }], legend: 'tr', tspan: 20 });
    MC.hover(sim, gc, [gH]);
    const s = { h: 1 };
    sim.group('Tanque');
    sim.slider('H0', { label: 'Nivel inicial del agua <i>H</i>', min: 0.1, max: 3, step: 0.01, value: 0.3, unit: 'm', fmt: f2, reset: true });
    sim.slider('Dt', { label: 'Diámetro del tanque', min: 5, max: 200, step: 1, value: 9, unit: 'cm', fmt: f0, reset: true, log: true });
    sim.slider('ys', { label: 'Altura del soporte', min: 0, max: 2, step: 0.01, value: 0.8, unit: 'm', fmt: f2, reset: true });
    sim.group('Orificio');
    sim.check('tres', { label: 'Tres orificios (a ¼, ½ y ¾ de H)', value: false, reset: true });
    sim.slider('z', { label: 'Altura del orificio sobre el fondo', min: 0, max: 2.9, step: 0.01, value: 0.1, unit: 'm', fmt: f2, reset: true });
    sim.slider('dh', { label: 'Diámetro del orificio', min: 1, max: 30, step: 0.5, value: 4, unit: 'mm', fmt: f1, reset: true });
    sim.out('v', 'Rapidez de salida <i>v</i> = √(2<i>gh</i>)', { hl: true });
    sim.out('x', 'Alcance horizontal', { hl: true });
    sim.out('Q', 'Caudal de salida');
    sim.out('lvl', 'Nivel del agua');
    sim.out('te', 'Tiempo para que el nivel llegue al orificio');
    sim.presets([
      { id: 'botella', label: 'Botella agujereada sobre una mesa', v: { H0: 0.3, Dt: 9, ys: 0.8, tres: false, z: 0.1, dh: 4 }, note: 'Sale a 1.98 m/s y cae a 0.85 m.' },
      { id: 'tres', label: 'Tres orificios (tanque en el suelo)', v: { H0: 1, Dt: 40, ys: 0, tres: true, dh: 6 }, note: 'El chorro del medio llega más lejos; los otros dos llegan al mismo punto.' },
      { id: 'maximo', label: 'Alcance máximo: orificio a media altura', v: { H0: 1, Dt: 40, ys: 0, tres: false, z: 0.5, dh: 6 } },
      { id: 'tanque', label: 'Tanque de agua de una casa', v: { H0: 2.3, Dt: 120, ys: 0.3, tres: false, z: 0.3, dh: 11.3 } }
    ]);
    const holes = () => { const p = sim.p; return p.tres ? [0.25, 0.5, 0.75].map((k) => k * p.H0) : [Math.min(p.z, p.H0 * 0.98)]; };
    const aHole = () => (Math.PI * Math.pow(sim.p.dh / 1000, 2)) / 4;
    const aTank = () => (Math.PI * Math.pow(sim.p.Dt / 100, 2)) / 4;
    const tEmpty = () => { const zmin = Math.min(...holes()); return (aTank() / aHole()) * Math.sqrt((2 * Math.max(0, sim.p.H0 - zmin)) / G); };
    const jetRange = (z, h) => (h > z ? 2 * Math.sqrt((h - z) * (sim.p.ys + z)) : 0);
    const sync = () => {
      const p = sim.p;
      sim.ctl.z.show(!p.tres);
      sim.ctl.z.range(0, Math.max(0.01, p.H0 * 0.98), 0.01);
      if (p.z > p.H0 * 0.98) sim.ctl.z.set(p.H0 * 0.98, true);
      const te = tEmpty();
      sim.ts = Math.max(1, te / 20);
      gH.set({ tspan: Math.max(5, Math.min(te * 1.05, 1e6)) });
    };
    sim.onChange = sync;
    sim.run({
      startLabel: 'Destapar',
      h: 1 / 200,
      timeFmt: (t) => (t < 120 ? `t = ${MC.fix(t, 1)} s` : `t = ${MC.fix(t / 60, 1)} min`),
      reset() { s.h = sim.p.H0; Hh.clear(); push(0); sync(); },
      step(h) {
        const p = sim.p, a = aHole(), A = aTank();
        const q = holes().reduce((acc, z) => acc + (s.h > z ? a * Math.sqrt(2 * G * (s.h - z)) : 0), 0);
        s.h = Math.max(Math.min(...holes()), s.h - (q / A) * h);
        push(sim.t);
        if (q <= 1e-12 || s.h <= Math.min(...holes()) + 1e-6) sim.end();
      }
    });
    function push(t) { const z0 = holes()[0]; Hh.push(t, { h: s.h, x: jetRange(z0, s.h) }); }
    sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      const Dm = p.Dt / 100, Ht = p.H0 * 1.12 + 0.03;
      const xr = Math.max(...holes().map((z) => jetRange(z, p.H0)), 0.3);
      view.setRange({ xmin: -Dm - 0.12 * (p.ys + Ht), xmax: Math.max(xr * 1.1, 0.4 * (p.ys + Ht)), ymin: -0.02 * (p.ys + Ht), ymax: (p.ys + Ht) * 1.04 });
      D.clear(cv);
      view.grid({ labels: false });
      const gy = view.Y(0);
      D.ground(ctx, 0, gy, cv.w, { depth: 10 });
      /* soporte */
      if (p.ys > 0) {
        D.block(ctx, view.X(-Dm / 2), view.Y(p.ys) + 4, view.L(Dm) + 10, 8, { fill: '--wood', r: 1 });
        for (const lx of [-Dm + 0.02 * Dm, -0.02 * Dm]) D.line(ctx, view.X(lx), view.Y(p.ys), view.X(lx), gy, { color: '--wood', width: 4 });
      }
      /* tanque y agua */
      D.fluid(ctx, view.X(-Dm), view.Y(p.ys + s.h), view.L(Dm), view.L(s.h), { color: '--water' });
      D.poly(ctx, [[view.X(-Dm), view.Y(p.ys + Ht)], [view.X(-Dm), view.Y(p.ys)], [view.X(0), view.Y(p.ys)], [view.X(0), view.Y(p.ys + Ht)]], { color: '--ink-2', width: 2.4 });
      D.line(ctx, view.X(-Dm) - 4, view.Y(p.ys + p.H0), view.X(-Dm) - 12, view.Y(p.ys + p.H0), { color: '--ink-3', width: 1 });
      /* chorros */
      holes().forEach((z, i) => {
        const hy = p.ys + z;
        D.circle(ctx, view.X(0), view.Y(hy), 3, { fill: '--ink' });
        if (s.h <= z) return;
        const v = Math.sqrt(2 * G * (s.h - z)), tf = Math.sqrt((2 * hy) / G), pts = [];
        for (let k = 0; k <= 40; k++) { const t = (tf * k) / 40; pts.push(view.P([v * t, hy - 0.5 * G * t * t])); }
        D.poly(ctx, pts, { color: '--water', width: Math.max(2, Math.min(6, p.dh * 0.35)) });
        const R = v * tf;
        D.circle(ctx, view.X(R), gy - 2, 4, { fill: '--c1' });
        D.line(ctx, view.X(R), gy - 6, view.X(R), gy - 14 - 15 * i, { color: '--c1', width: 1 });
        MC.text(ctx, `${f2(R)} m`, view.X(R) + 3, gy - 16 - 15 * i, { size: 10.5, mono: true, color: '--c1', halo: true });
        if (i === 0 || p.tres) D.vec(ctx, view.X(0) + 4, view.Y(hy), Math.min(70, 16 * v), 0, { color: '--vel', width: 1.8, label: p.tres ? '' : 'v' });
        if (!p.tres) D.dim(ctx, view.X(-Dm) - 22, view.Y(p.ys + s.h), view.X(-Dm) - 22, view.Y(hy), '', { color: '--ink-3' });
        if (!p.tres) MC.text(ctx, 'h', view.X(-Dm) - 32, view.Y(hy + (s.h - z) / 2), { size: 13, math: true, color: '--ink-2', align: 'right', baseline: 'middle' });
      });
      /* gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      gH.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, Hh, { t: sim.t, yExtra: [p.H0, jetRange(holes()[0], p.H0)] });
      /* lecturas */
      const z0 = holes()[0], v0 = s.h > z0 ? Math.sqrt(2 * G * (s.h - z0)) : 0;
      sim.set('v', p.tres ? holes().map((z) => (s.h > z ? f2(Math.sqrt(2 * G * (s.h - z))) : '0')).join(' · ') + ' m/s' : `${f2(v0)} m/s`);
      sim.set('x', p.tres ? holes().map((z) => f2(jetRange(z, s.h))).join(' · ') + ' m' : `${f2(jetRange(z0, s.h))} m`);
      const Qt = holes().reduce((acc, z) => acc + (s.h > z ? aHole() * Math.sqrt(2 * G * (s.h - z)) : 0), 0);
      sim.set('Q', `${sci(Qt * 1000)} L/s`);
      sim.set('lvl', `${f3(s.h)} m`);
      sim.set('te', p.tres ? '—' : MC.time(tEmpty()));
    });
  });
})();
