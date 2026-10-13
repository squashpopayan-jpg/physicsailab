/* Capítulo 10 — Rotación de cuerpos rígidos */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0), f3 = (v) => MC.fix(v, 3);
  const G = 9.8;

  /* Rueda con rayos girada un ángulo th (rad, antihorario) */
  function wheel(ctx, X, Y, Rp, th, o = {}) {
    ctx.save();
    ctx.fillStyle = MC.alpha(o.fill || '--metal', 0.35);
    ctx.strokeStyle = MC.col('--ink-2');
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X, Y, Rp, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) {
      const a = th + (k * Math.PI) / 3;
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Rp * Math.cos(a), Y - Rp * Math.sin(a)); ctx.stroke();
    }
    ctx.strokeStyle = MC.col('--c8');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Rp * Math.cos(th), Y - Rp * Math.sin(th)); ctx.stroke();
    ctx.fillStyle = MC.col('--ink');
    ctx.beginPath(); ctx.arc(X, Y, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
  }
  MC.wheel = wheel;

  /* ======================================================================
     10.2  Cinemática rotacional
     ====================================================================== */
  MC.defineSim('cinematica-rot', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cv = sim.canvas({ aspect: 1 });
    const gc = sim.canvas({ aspect: 1.05 });
    const H = new MC.History(['th', 'w', 'al']);
    const gth = new MC.TGraph({ ylabel: ['θ', 'rad'], series: [{ key: 'th', label: 'θ', unit: 'rad', color: '--pos', fmt: f2 }], legend: false });
    const gw = new MC.TGraph({ ylabel: ['ω', 'rad/s'], series: [{ key: 'w', label: 'ω', unit: 'rad/s', color: '--vel', fmt: f2 }], legend: false });
    const ga = new MC.TGraph({ ylabel: ['α', 'rad/s²'], series: [{ key: 'al', label: 'α', unit: 'rad/s²', color: '--acc', fmt: f2 }], legend: false, minSpan: 2 });
    MC.hover(sim, gc, [gth, gw, ga]);
    const s = { th: 0, w: 0, al: 0, stopped: false };
    sim.group('Rueda');
    sim.slider('w0', { label: 'Rapidez angular inicial ω₀', min: -20, max: 140, step: 0.1, value: 4, unit: 'rad/s', fmt: f1, reset: true });
    sim.slider('al', { label: 'Aceleración angular α', min: -20, max: 20, step: 0.1, value: 1.5, unit: 'rad/s²', fmt: f1 });
    sim.slider('R', { label: 'Radio de la rueda <i>R</i>', min: 0.05, max: 1, step: 0.01, value: 0.4, unit: 'm', fmt: f2 });
    sim.slider('fr', { label: 'Posición del punto P (<i>r</i>/<i>R</i>)', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('T', { label: 'Duración', min: 2, max: 30, step: 0.5, value: 8, unit: 's', fmt: f1, reset: true });
    sim.check('frenos', { label: 'Se detiene al llegar a ω = 0 (frenado)', value: false });
    sim.out('th', 'Ángulo θ', { hl: true });
    sim.out('w', 'Rapidez angular ω', { hl: true });
    sim.out('v', 'Rapidez del punto P, <i>v</i> = ω<i>r</i>');
    sim.out('at', 'Aceleración tangencial α<i>r</i>');
    sim.out('ac', 'Aceleración centrípeta ω²<i>r</i>');
    sim.out('a', 'Aceleración total de P');
    sim.presets([
      { id: 'ventilador', label: 'Ventilador de 1200 rpm que se apaga', v: { w0: 125.7, al: -10.47, R: 0.2, fr: 1, T: 14, frenos: true }, fn: (q) => q.setSpeed(0.1), note: 'Se reproduce a ×0.1. Da 120 vueltas hasta detenerse en 12 s.' },
      { id: 'arranque', label: 'Rueda que arranca desde el reposo', v: { w0: 0, al: 2, R: 0.35, fr: 1, T: 6, frenos: false }, fn: (q) => q.setSpeed(1) },
      { id: 'bicicleta', label: 'Rueda de bicicleta con ω constante', v: { w0: 8, al: 0, R: 0.35, fr: 1, T: 6, frenos: false }, fn: (q) => q.setSpeed(1) },
      { id: 'reversa', label: 'Frena, se detiene y gira al revés', v: { w0: 6, al: -2, R: 0.4, fr: 0.8, T: 8, frenos: false }, fn: (q) => q.setSpeed(1) }
    ]);
    sim.run({
      reset() {
        s.th = 0; s.w = sim.p.w0; s.al = sim.p.al; s.stopped = false;
        H.clear(); H.push(0, { th: 0, w: s.w, al: s.al }, true);
        gth.set({ tmax: sim.p.T }); gw.set({ tmax: sim.p.T }); ga.set({ tmax: sim.p.T });
      },
      step(h) {
        const p = sim.p;
        let al = s.stopped ? 0 : p.al;
        let wn = s.w + al * h;
        if (p.frenos && !s.stopped && s.w !== 0 && wn * s.w <= 0 && al * s.w < 0) { const ts = -s.w / al; s.th += s.w * ts + 0.5 * al * ts * ts; wn = 0; s.stopped = true; al = 0; }
        else s.th += s.w * h + 0.5 * al * h * h;
        s.w = wn; s.al = al;
        H.push(sim.t + h, { th: s.th, w: s.w, al: s.al });
        if (sim.t + h >= p.T) sim.end();
      },
      h: 1 / 1000
    });
    sim.onChange = (id) => { if (id === 'al' && !sim.playing && sim.t === 0) sim.reset(); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const view = new MC.View2D(cv, { xmin: -1.35 * p.R, xmax: 1.35 * p.R, ymin: -1.35 * p.R, ymax: 1.35 * p.R });
      view.grid({ labels: false });
      const X = view.X(0), Y = view.Y(0), Rp = p.R * view.s;
      wheel(ctx, X, Y, Rp, s.th);
      const r = p.fr * p.R;
      const px = X + r * view.s * Math.cos(s.th), py = Y - r * view.s * Math.sin(s.th);
      D.circle(ctx, px, py, 7, { fill: '--c1', color: '--canvas', width: 2 });
      MC.text(ctx, 'P', px + 10, py - 8, { size: 13, weight: 700, halo: true });
      const al = s.stopped ? 0 : p.al;
      const v = s.w * r, at = al * r, ac = s.w * s.w * r;
      const ux = -Math.sin(s.th), uy = Math.cos(s.th), nx = -Math.cos(s.th), ny = -Math.sin(s.th);
      const vm = Math.max(Math.abs(p.w0), Math.abs(p.w0 + p.al * p.T), 1) * p.R;
      const kv = (0.7 * Rp) / vm;
      const am = Math.max(ac, Math.abs(at), 0.01, vm * vm / p.R);
      const ka = (0.6 * Rp) / am;
      if (r > 0) {
        D.vec(ctx, px, py, ux * v * kv, -uy * v * kv, { color: '--vel', label: 'v', minLen: 2 });
        if (Math.abs(at) > 1e-6) D.vec(ctx, px, py, ux * at * ka, -uy * at * ka, { color: '--acc', label: 'a_t', width: 1.6, dash: [5, 3], minLen: 2 });
        D.vec(ctx, px, py, nx * ac * ka, -ny * ac * ka, { color: '--acc', label: 'a_c', width: 1.6, dash: [5, 3], minLen: 2 });
        if (Math.abs(at) > 1e-6) D.vec(ctx, px, py, (ux * at + nx * ac) * ka, -(uy * at + ny * ac) * ka, { color: '--acc', label: 'a', minLen: 2 });
      }
      if (Math.abs(s.w) > 0.01) D.arcArrow(ctx, X, Y, Rp + 16, Math.PI * 0.55, Math.PI * 0.55 + Math.sign(s.w) * 0.9, { color: '--vel', width: 2 });
      MC.text(ctx, 'ω', X - Rp * 0.1, Y - Rp - 22, { size: 15, math: true, color: '--vel', align: 'center' });
      const gctx = gc.ctx;
      D.clear(gc);
      const h3 = gc.h / 3;
      gth.draw(gctx, { x: 0, y: 0, w: gc.w, h: h3, mb: 26 }, H, { t: sim.t });
      gw.draw(gctx, { x: 0, y: h3, w: gc.w, h: h3, mb: 26 }, H, { t: sim.t });
      ga.draw(gctx, { x: 0, y: 2 * h3, w: gc.w, h: h3, mb: 34 }, H, { t: sim.t, yExtra: [-1, 1] });
      sim.set('th', `${f2(s.th)} rad = ${f2(s.th / (2 * Math.PI))} vueltas`);
      sim.set('w', `${f2(s.w)} rad/s = ${f0((s.w * 60) / (2 * Math.PI))} rpm`);
      sim.set('v', `${f2(v)} m/s`);
      sim.set('at', `${f2(at)} m/s²`);
      sim.set('ac', `${f2(ac)} m/s²`);
      sim.set('a', `${f2(Math.hypot(at, ac))} m/s²`);
    });
  });

  /* ======================================================================
     10.3  Momento de inercia
     ====================================================================== */
  const SHAPES = {
    aro: { label: 'Aro delgado', beta: 1, f: 'MR²' },
    esfh: { label: 'Esfera hueca', beta: 2 / 3, f: '⅔MR²' },
    disco: { label: 'Disco o cilindro sólido', beta: 0.5, f: '½MR²' },
    esfs: { label: 'Esfera sólida', beta: 0.4, f: '⅖MR²' },
    varc: { label: 'Varilla (eje por el centro)', rod: true, beta: 1 / 12, f: '(1/12)ML²' },
    placa: { label: 'Placa rectangular a × b', plate: true, f: '(1/12)M(a² + b²)' }
  };
  MC.defineSim('momento-inercia', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Modo');
    sim.seg('mode', { options: [['formas', 'Formas'], ['pesas', 'Pesas en una varilla']], value: 'formas' });
    const gF = sim.group('Cuerpo');
    sim.select('sh', { label: 'Forma', value: 'disco', options: Object.keys(SHAPES).map((k) => [k, SHAPES[k].label]) });
    sim.slider('M', { label: 'Masa <i>M</i>', min: 0.1, max: 20, step: 0.1, value: 2, unit: 'kg', fmt: f1 });
    sim.slider('R', { label: 'Radio <i>R</i> (o semilongitud <i>L</i>/2)', min: 0.05, max: 1, step: 0.01, value: 0.3, unit: 'm', fmt: f2 });
    sim.slider('d', { label: 'Distancia del eje al centro de masa <i>d</i>', min: 0, max: 1, step: 0.01, value: 0, unit: 'm', fmt: f2 });
    const gW = sim.group('Pesas');
    sim.slider('mr', { label: 'Masa de la varilla', min: 0.1, max: 5, step: 0.1, value: 0.5, unit: 'kg', fmt: f1 });
    sim.slider('L', { label: 'Longitud de la varilla <i>L</i>', min: 0.2, max: 2, step: 0.05, value: 1.2, unit: 'm', fmt: f2 });
    sim.slider('mp', { label: 'Masa de cada pesa <i>m</i>', min: 0.1, max: 10, step: 0.1, value: 2, unit: 'kg', fmt: f1 });
    sim.slider('rp', { label: 'Distancia de las pesas al eje <i>r</i>', min: 0, max: 1, step: 0.01, value: 0.3, unit: 'm', fmt: f2 });
    sim.group('Energía');
    sim.slider('w', { label: 'Rapidez angular ω', min: 0, max: 50, step: 0.5, value: 10, unit: 'rad/s', fmt: f1 });
    sim.out('Icm', 'Momento de inercia respecto al CM');
    sim.out('I', 'Momento de inercia respecto al eje', { hl: true });
    sim.out('k', 'Radio de giro √(<i>I</i>/<i>M</i>)');
    sim.out('K', 'Energía de rotación ½<i>I</i>ω²', { hl: true });
    sim.presets([
      { id: 'aroDisco', label: 'Aro contra disco (misma masa y radio)', v: { mode: 'formas', sh: 'aro', M: 2, R: 0.3, d: 0 }, note: 'Cambie a “Disco”: su momento de inercia es la mitad.' },
      { id: 'varilla', label: 'Varilla girando por un extremo', v: { mode: 'formas', sh: 'varc', M: 1, R: 0.5, d: 0.5 }, note: '(1/12)ML² + M(L/2)² = (1/3)ML².' },
      { id: 'pesas', label: 'Pesas cerca y lejos del eje', v: { mode: 'pesas', mr: 0.5, L: 1.2, mp: 2, rp: 0.15 }, note: 'Lleve las pesas a 0.6 m: su contribución se multiplica por 16.' }
    ]);
    const vis = () => { gF.hidden = sim.p.mode !== 'formas'; gW.hidden = sim.p.mode !== 'pesas'; };
    sim.onChange = () => {
      vis();
      const lim = sim.p.mode === 'pesas' ? sim.p.L / 2 : sim.p.R * (SHAPES[sim.p.sh].plate ? 1.2 : 1);
      if (sim.p.mode === 'pesas' && sim.p.rp > sim.p.L / 2) sim.ctl.rp.set(sim.p.L / 2, true);
      sim.ctl.rp.range(0, sim.p.L / 2, 0.01);
      sim.ctl.d.range(0, Math.max(0.01, lim * 1.5), 0.01);
      if (sim.p.d > lim * 1.5) sim.ctl.d.set(lim * 1.5, true);
    };
    vis();
    const compute = () => {
      const p = sim.p;
      if (p.mode === 'pesas') {
        const Irod = (p.mr * p.L * p.L) / 12, Ip = 2 * p.mp * p.rp * p.rp;
        return { Icm: Irod + Ip, I: Irod + Ip, Mt: p.mr + 2 * p.mp, Irod, Ip };
      }
      const S = SHAPES[p.sh];
      let Icm;
      if (S.plate) { const a = 2 * p.R, b = 1.2 * p.R; Icm = (p.M * (a * a + b * b)) / 12; }
      else if (S.rod) { const L = 2 * p.R; Icm = (p.M * L * L) / 12; }
      else Icm = S.beta * p.M * p.R * p.R;
      return { Icm, I: Icm + p.M * p.d * p.d, Mt: p.M };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const c = compute();
      const half = cv.w * 0.58;
      const view = new MC.View2D({ w: half, h: cv.h }, { xmin: -1.25, xmax: 1.25, ymin: -1.05, ymax: 1.05 });
      const sc = 0.9 / Math.max(p.mode === 'pesas' ? p.L / 2 : p.R * 1.2, 0.05);
      const X = (x) => view.X(x * sc), Y = (y) => view.Y(y * sc), L = (l) => view.L(l * sc);
      if (p.mode === 'formas') {
        const S = SHAPES[p.sh];
        ctx.save();
        if (S.rod) {
          D.block(ctx, X(0), Y(0), L(2 * p.R), Math.max(8, L(0.06)), { fill: '--wood', r: 3 });
        } else if (S.plate) {
          D.block(ctx, X(0), Y(0), L(2 * p.R), L(1.2 * p.R), { fill: '--body-b', r: 2 });
        } else if (p.sh === 'aro') {
          D.circle(ctx, X(0), Y(0), L(p.R), { color: '--c4', width: Math.max(5, L(0.04)) });
        } else if (p.sh === 'disco') {
          D.circle(ctx, X(0), Y(0), L(p.R), { fill: '--body-a', color: '--ink-2', width: 1.5 });
        } else {
          D.ball(ctx, X(0), Y(0), L(p.R), { fill: p.sh === 'esfs' ? '--body-c' : '--body-e', alpha: p.sh === 'esfh' ? 0.55 : 1 });
          if (p.sh === 'esfh') D.circle(ctx, X(0), Y(0), L(p.R), { color: '--ink-2', width: 3 });
        }
        ctx.restore();
        D.circle(ctx, X(0), Y(0), 4, { fill: '--ink' });
        MC.text(ctx, 'CM', X(0) + 6, Y(0) + 16, { size: 11, weight: 700, halo: true });
        const ax = X(p.d);
        D.outIn(ctx, ax, Y(0), 11, 1, { color: '--accent' });
        MC.text(ctx, 'eje', ax, Y(0) - 18, { size: 11.5, align: 'center', color: '--accent', weight: 700, halo: true });
        if (p.d > 0.005) D.dim(ctx, X(0), Y(-p.R * 0.8) - 20, ax, Y(-p.R * 0.8) - 20, `d = ${f2(p.d)} m`, { labelOff: 12 });
        MC.text(ctx, `I_{cm} = ${S.f}`, 12, 22, { size: 14, math: true, weight: 600 });
        if (p.d > 0) MC.text(ctx, 'I = I_{cm} + Md²', 12, 42, { size: 14, math: true, color: '--accent' });
      } else {
        D.block(ctx, X(0), Y(0), L(p.L), Math.max(7, L(0.03)), { fill: '--wood', r: 3 });
        const rr = Math.max(9, L(0.05 + 0.02 * Math.cbrt(p.mp)));
        for (const sg of [-1, 1]) D.ball(ctx, X(sg * p.rp), Y(0), rr, { fill: '--metal', label: `${f1(p.mp)}` });
        D.outIn(ctx, X(0), Y(0), 10, 1, { color: '--accent' });
        if (p.rp > 0.01) D.dim(ctx, X(0), Y(0) + 34, X(p.rp), Y(0) + 34, `r = ${f2(p.rp)} m`, { labelOff: 12 });
        MC.text(ctx, 'I = (1/12)m_{v}L² + 2mr²', 12, 22, { size: 14, math: true, weight: 600 });
        MC.text(ctx, `= ${f3(c.Irod)} + ${f3(c.Ip)} kg·m²`, 12, 42, { size: 13, mono: true, color: '--ink-2' });
      }
      /* barras comparativas */
      const bx = half + 10;
      if (p.mode === 'formas' && !SHAPES[p.sh].rod && !SHAPES[p.sh].plate) {
        const items = ['aro', 'esfh', 'disco', 'esfs'].map((k) => ({ label: SHAPES[k].label.split(' ')[0] === 'Disco' ? 'disco' : k === 'aro' ? 'aro' : k === 'esfh' ? 'esf. hueca' : 'esf. sólida', value: SHAPES[k].beta, color: k === p.sh ? '--accent' : '--c1', math: false }));
        items.push({ label: 'con eje d', value: c.I / (p.M * p.R * p.R), color: '--c4', math: false });
        D.bars(ctx, items, { x: bx, y: 8, w: cv.w - bx - 8, h: cv.h - 16, max: Math.max(1.2, MC.niceCeil((c.I / (p.M * p.R * p.R)) * 1.05)), title: 'I / (M R²)', fmt: (v) => MC.fix(v, 3) });
      } else {
        D.bars(ctx, [{ label: 'I_{cm}', value: c.Icm, color: '--c1' }, { label: 'I', value: c.I, color: '--accent' }, { label: 'K (J)', value: 0.5 * c.I * p.w * p.w / Math.max(1, p.w * p.w / 2), color: '--K' }].slice(0, 2), { x: bx, y: 8, w: cv.w - bx - 8, h: cv.h - 16, title: 'kg·m²', fmt: (v) => MC.sci(v, 3) });
      }
      sim.set('Icm', `${MC.sci(c.Icm, 4)} kg·m²`);
      sim.set('I', `${MC.sci(c.I, 4)} kg·m²`);
      sim.set('k', `${f3(Math.sqrt(c.I / c.Mt))} m`);
      sim.set('K', `${MC.sci(0.5 * c.I * p.w * p.w, 4)} J`);
    });
  });

  /* ======================================================================
     10.5  Carrera de objetos que ruedan
     ====================================================================== */
  const RACERS = {
    bloque: { label: 'Bloque sin fricción (desliza)', beta: 0, col: '--c6', roll: false },
    esfs: { label: 'Esfera sólida', beta: 0.4, col: '--c4', roll: true },
    disco: { label: 'Disco / cilindro sólido', beta: 0.5, col: '--c3', roll: true },
    esfh: { label: 'Esfera hueca', beta: 2 / 3, col: '--c5', roll: true },
    aro: { label: 'Aro / cilindro hueco', beta: 1, col: '--c1', roll: true },
    llena: { label: 'Lata llena de sopa', beta: 0.5, col: '--c8', roll: true },
    vacia: { label: 'Lata vacía', beta: 0.9, col: '--c7', roll: true }
  };
  MC.defineSim('rodadura-carrera', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const st = sim.status(cv);
    sim.group('Competidores');
    for (const k of Object.keys(RACERS)) sim.check('c_' + k, { label: RACERS[k].label, value: ['aro', 'disco', 'esfs', 'esfh'].includes(k), reset: true });
    sim.group('Rampa');
    sim.slider('th', { label: 'Inclinación θ', min: 5, max: 60, step: 1, value: 20, unit: '°', fmt: f0, reset: true });
    sim.slider('L', { label: 'Longitud de la rampa', min: 1, max: 10, step: 0.1, value: 3, unit: 'm', fmt: f1, reset: true });
    sim.slider('M', { label: 'Masa de cada objeto (no influye)', min: 0.1, max: 10, step: 0.1, value: 1, unit: 'kg', fmt: f1 });
    sim.slider('R', { label: 'Radio de cada objeto (no influye)', min: 0.02, max: 0.3, step: 0.01, value: 0.1, unit: 'm', fmt: f2 });
    sim.out('o1', '—'); sim.out('o2', '—'); sim.out('o3', '—'); sim.out('o4', '—'); sim.out('o5', '—');
    const OUT = ['o1', 'o2', 'o3', 'o4', 'o5'];
    const setAll = (obj) => { for (const k of Object.keys(RACERS)) sim.ctl['c_' + k].set(obj.includes(k), true); };
    sim.presets([
      { id: 'clasica', label: 'Aro, disco, esfera sólida y esfera hueca', v: { th: 20, L: 3 }, fn: () => setAll(['aro', 'disco', 'esfs', 'esfh']) },
      { id: 'latas', label: 'Lata llena contra lata vacía', v: { th: 15, L: 3 }, fn: () => setAll(['llena', 'vacia']), note: 'El líquido de la lata llena casi no gira: se comporta como un cilindro con poca inercia de rotación.' },
      { id: 'bloque', label: 'Todos contra un bloque que desliza sin fricción', v: { th: 20, L: 3 }, fn: () => setAll(['bloque', 'esfs', 'disco', 'aro']) }
    ]);
    const list = () => Object.keys(RACERS).filter((k) => sim.p['c_' + k]).slice(0, 5);
    let pos = {}, fin = {};
    sim.run({
      startLabel: '¡Salida!',
      reset() { pos = {}; fin = {}; list().forEach((k) => { pos[k] = 0; }); st.hide(); },
      step(h) {
        const p = sim.p, th = M.rad(p.th), ks = list();
        const t = sim.t + h;
        let all = true;
        for (const k of ks) {
          const a = (G * Math.sin(th)) / (1 + RACERS[k].beta);
          pos[k] = Math.min(p.L, 0.5 * a * t * t);
          if (pos[k] >= p.L && fin[k] === undefined) fin[k] = Math.sqrt((2 * p.L) / a);
          if (fin[k] === undefined) all = false;
        }
        if (all) { const w = ks.slice().sort((a, b) => fin[a] - fin[b])[0]; st.show(`Gana: ${RACERS[w].label}`, 'good'); sim.end(); }
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th), ks = list();
      const ctx = cv.ctx;
      D.clear(cv);
      const n = Math.max(1, ks.length);
      const laneH = cv.h / n;
      ks.forEach((k, i) => {
        const Rk = RACERS[k];
        const y0 = i * laneH;
        const x0 = 16, x1 = cv.w * 0.62;
        const drop = Math.min(laneH - 26, (x1 - x0) * Math.tan(th));
        const run = drop / Math.tan(th);
        const xa = x1 - run, ya = y0 + 12, yb = ya + drop;
        ctx.save();
        ctx.fillStyle = MC.alpha('--ground-fill', 0.9);
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(x1, yb); ctx.lineTo(xa, yb); ctx.closePath(); ctx.fill();
        ctx.restore();
        D.line(ctx, xa, ya, x1, yb, { color: '--ink-2', width: 2 });
        D.line(ctx, x1, yb - 18, x1, yb + 4, { color: '--accent', width: 2, dash: [3, 2] });
        const f = (pos[k] || 0) / p.L;
        const cx = xa + (x1 - xa) * f, cy = ya + (yb - ya) * f;
        const rpx = Math.min(12, laneH * 0.18);
        const nx = Math.sin(th), ny = -Math.cos(th);
        const bx = cx + nx * rpx, by = cy + ny * rpx;
        if (Rk.roll) {
          const ang = -((pos[k] || 0) / p.R);
          if (k === 'aro' || k === 'vacia') D.circle(ctx, bx, by, rpx, { color: Rk.col, width: 3.5 });
          else D.ball(ctx, bx, by, rpx, { fill: Rk.col, alpha: k === 'esfh' ? 0.6 : 1 });
          D.line(ctx, bx, by, bx + rpx * Math.cos(ang), by - rpx * Math.sin(ang), { color: '--ink', width: 1.6 });
        } else D.block(ctx, bx, by, rpx * 2, rpx * 1.6, { fill: Rk.col, ang: -th });
        MC.text(ctx, Rk.label, 16, y0 + 16, { size: 11.5, weight: 600, color: Rk.col, halo: true });
        MC.text(ctx, fin[k] !== undefined ? `${f2(fin[k])} s` : '', x1 + 8, yb, { size: 12, mono: true, color: '--ink', weight: 600 });
        /* barras de energía: traslación y rotación */
        const v = Math.sqrt((2 * G * (pos[k] || 0) * Math.sin(th)) / (1 + Rk.beta));
        const Kt = 0.5 * p.M * v * v, Kr = Rk.beta * Kt;
        const Emax = p.M * G * p.L * Math.sin(th);
        const bw = cv.w - x1 - 70, bxx = x1 + 60;
        ctx.fillStyle = MC.col('--K');
        ctx.fillRect(bxx, y0 + laneH * 0.5 - 7, (bw * Kt) / Emax, 7);
        ctx.fillStyle = MC.col('--Ue');
        ctx.fillRect(bxx + (bw * Kt) / Emax, y0 + laneH * 0.5 - 7, (bw * Kr) / Emax, 7);
        ctx.strokeStyle = MC.col('--rule-strong');
        ctx.strokeRect(bxx + 0.5, y0 + laneH * 0.5 - 7.5, bw, 8);
        if (i === 0) MC.text(ctx, 'K traslación | K rotación', bxx, y0 + 12, { size: 10.5, color: '--ink-3' });
        if (i < n - 1) D.line(ctx, 0, y0 + laneH, cv.w, y0 + laneH, { color: '--rule', width: 1 });
      });
      const rank = ks.slice().sort((a, b) => RACERS[a].beta - RACERS[b].beta);
      OUT.forEach((o, i) => {
        const k = rank[i];
        if (!k) { sim._outs[o].show(false); return; }
        sim._outs[o].show(true);
        sim._outs[o].label(`${i + 1}. ${RACERS[k].label} (β = ${f2(RACERS[k].beta)})`);
        const vf = Math.sqrt((2 * G * p.L * Math.sin(th)) / (1 + RACERS[k].beta));
        sim.set(o, `${f2(vf)} m/s, ${f2(Math.sqrt((2 * p.L * (1 + RACERS[k].beta)) / (G * Math.sin(th))))} s`);
      });
    });
  });
})();
