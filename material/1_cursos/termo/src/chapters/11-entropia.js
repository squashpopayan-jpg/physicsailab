/* Capítulo 11 — Entropía */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;

  /* 11.1 Dos bloques */
  const BM = { cu: ['Cobre', 385], al: ['Aluminio', 900], fe: ['Hierro', 449], agua: ['Agua', 4186] };
  EM.defineSim('dos-bloques', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m1', { label: 'Bloque caliente', options: Object.entries(BM).map(([k, v]) => [k, v[0]]), value: 'cu' });
    sim.slider('M1', { label: 'Masa 1', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg', fmt: (v) => v.toFixed(1) });
    sim.slider('T1', { label: 'Temperatura 1', min: 280, max: 1000, step: 1, value: 400, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.select('m2', { label: 'Bloque frío', options: Object.entries(BM).map(([k, v]) => [k, v[0]]), value: 'cu' });
    sim.slider('M2', { label: 'Masa 2', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg', fmt: (v) => v.toFixed(1) });
    sim.slider('T2', { label: 'Temperatura 2', min: 250, max: 600, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('ir', 'Contacto directo: <i>T<sub>f</sub></i> · <i>S<sub>gen</sub></i>', { hl: true });
    sim.out('rv', 'Máquina reversible: <i>T<sub>f</sub></i> · trabajo');
    sim.out('lw', '<i>T<sub>f,rev</sub></i>·<i>S<sub>gen</sub></i> (trabajo perdido)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const C1 = p.M1 * BM[p.m1][1], C2 = p.M2 * BM[p.m2][1], T1 = Math.max(p.T1, p.T2 + 1), T2 = p.T2;
      const Tf = (C1 * T1 + C2 * T2) / (C1 + C2), Sg = C1 * Math.log(Tf / T1) + C2 * Math.log(Tf / T2);
      const Tr = Math.exp((C1 * Math.log(T1) + C2 * Math.log(T2)) / (C1 + C2)), Wr = C1 * (T1 - Tr) - C2 * (Tr - T2);
      const Qmax = C1 * (T1 - Tr) * 1.05 / 1000;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(Qmax, (C1 * (T1 - Tf)) / 1000) * 1.02, ymin: T2 - 10, ymax: T1 + 10, xlabel: 'calor cedido por el bloque caliente (kJ)', ylabel: 'T (K)' });
      pl.frame();
      const Qi = (C1 * (T1 - Tf)) / 1000;
      pl.path([[0, T1], [Qi, Tf]], { color: '--c2', width: 2.4 });
      pl.path([[0, T2], [Qi, Tf]], { color: '--c1', width: 2.4 });
      /* reversible: dQ2 = dQ1·T2/T1 */
      const hot = [], cold = [];
      for (let i = 0; i <= 80; i++) { const Th = T1 + (Tr - T1) * (i / 80), Q1 = C1 * (T1 - Th) / 1000, Tc = Math.exp(Math.log(T2) + (C1 / C2) * Math.log(T1 / Th)); hot.push([Q1, Th]); cold.push([Q1, Tc]); }
      pl.path(hot, { color: '--c2', width: 1.6, dash: [6, 4] }); pl.path(cold, { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.dot(Qi, Tf, { color: '--accent', label: 'T_f = ' + EM.fix(Tf, 1) + ' K' });
      pl.dot(hot[80][0], Tr, { color: '--c3', label: 'T_{f,rev} = ' + EM.fix(Tr, 1) + ' K', dy: 16, align: 'right', dx: -8 });
      pl.legend([{ label: 'contacto directo', color: '--ink-2' }, { label: 'con máquina reversible (en el eje: calor del bloque caliente)', color: '--ink-2', dash: [6, 4] }], 'tr');
      sim.set('ir', EM.fix(Tf, 2) + ' K · ' + EM.fix(Sg, 3) + ' J/K');
      sim.set('rv', EM.fix(Tr, 2) + ' K · ' + EM.fix(Wr / 1000, 3) + ' kJ');
      sim.set('lw', EM.fix(Tr * Sg / 1000, 3) + ' kJ (≈ trabajo reversible)');
    });
  });

  /* 11.2 Diagrama T–s del agua */
  EM.defineSim('ts-agua', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('P', { label: 'Presión del proceso', min: 5, max: 20000, step: 1, value: 1000, unit: 'kPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('u1', { label: 'Estado inicial (posición en la isóbara)', min: 0, max: 1, step: 0.002, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.slider('u2', { label: 'Estado final', min: 0, max: 1, step: 0.002, value: 0.8, fmt: (v) => v.toFixed(3) });
    sim.check('xq', { label: 'Líneas de calidad constante', value: true });
    sim.out('s1', 'Estado 1', { hl: true });
    sim.out('s2', 'Estado 2');
    sim.out('q', 'Calor a presión constante ∫<i>T</i> d<i>s</i> = Δ<i>h</i>');
    const W = TH.agua;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = p.P * 1e3, lo = W.state(P, { T: 293.15 }).s, hi = W.sup(P, 873.15).s;
      const st = (u) => W.state(P, { s: lo + (hi - lo) * u });
      const a = st(p.u1), b = st(p.u2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 9.5, ymin: 0, ymax: 650, xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)' });
      pl.frame();
      if (p.xq) { const d = D.dome(W); for (const x of [0.2, 0.4, 0.6, 0.8]) pl.path(d.f.map((f, i) => [(f.s + x * (d.g[i].s - f.s)) / 1e3, f.T - 273.15]), { color: '--grid-2', width: 1 }); }
      for (const pp of [10, 100, 1000, 5000, 20000]) D.line(pl, D.isobar(W, pp * 1e3, 274, 873), 's', 'T', { color: '--c1', width: 1, alpha: 0.4 });
      D.drawDome(pl, W, 's', 'T');
      /* área del proceso */
      const n = 80, path = [];
      for (let i = 0; i <= n; i++) { const u = p.u1 + ((p.u2 - p.u1) * i) / n, s = st(u); path.push([s.s / 1e3, s.T - 273.15]); }
      ctx.save(); ctx.fillStyle = EM.alpha(p.u2 >= p.u1 ? '--c2' : '--c1', 0.18); ctx.beginPath(); ctx.moveTo(pl.X(path[0][0]), pl.Y(-273.15 > 0 ? 0 : 0));
      path.forEach(([x, y]) => ctx.lineTo(pl.X(x), pl.Y(y))); ctx.lineTo(pl.X(path[n][0]), pl.Y(0)); ctx.closePath(); ctx.fill(); ctx.restore();
      D.line(pl, D.isobar(W, P, 274, 873), 's', 'T', { color: '--accent', width: 1.4, alpha: 0.6 });
      pl.path(path, { color: '--accent', width: 2.8 });
      pl.dot(a.s / 1e3, a.T - 273.15, { color: '--ink', label: '1' }); pl.dot(b.s / 1e3, b.T - 273.15, { color: '--ink', label: '2' });
      const f = (s) => s.fase + ', ' + EM.fix(s.T - 273.15, 1) + ' °C' + (s.x !== null && s.x !== undefined ? ', x = ' + EM.fix(s.x, 3) : '') + ', s = ' + EM.fix(s.s / 1e3, 4);
      sim.set('s1', f(a)); sim.set('s2', f(b));
      sim.set('q', EM.fix((b.h - a.h) / 1e3, 1) + ' kJ/kg (área sombreada; abajo de 0 °C no se dibuja)');
    });
  });

  /* 11.3 Compresor y turbina de gas en T–s */
  EM.defineSim('compresor-ts', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('mode', { label: 'Equipo', options: [['c', 'Compresor'], ['t', 'Turbina']], value: 'c' });
    sim.slider('rp', { label: 'Relación de presiones', min: 1.5, max: 30, step: 0.1, value: 8, fmt: (v) => v.toFixed(1) });
    sim.slider('T1', { label: 'Temperatura de entrada', min: 250, max: 1600, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('eta', { label: 'Eficiencia isentrópica', min: 0.5, max: 1, step: 0.01, value: 0.85, fmt: (v) => v.toFixed(2) });
    sim.out('T2', '<i>T</i><sub>2s</sub> · <i>T</i><sub>2</sub>', { hl: true });
    sim.out('w', 'Trabajo isentrópico · real');
    sim.out('s', 'Entropía generada');
    const R = TH.Rair / 1000;
    const s0 = (T) => TH.ds0Aire(T) / 1000; /* kJ/kg·K desde 298 K */
    sim.onChange = (id) => { if (id === 'mode') sim.ctl.T1.set(sim.p.mode === 'c' ? 300 : 1300, true); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const comp = p.mode === 'c', P1 = 100, P2 = comp ? 100 * p.rp : 100 / p.rp;
      const sOf = (T, P) => s0(T) - R * Math.log(P / 100);
      const s1 = sOf(p.T1, P1), T2s = TH.bisect((T) => sOf(T, P2) - s1, 150, 3000, 1e-10);
      const h = (T) => TH.dhAire(T) / 1000, ws = Math.abs(h(T2s) - h(p.T1));
      const h2 = comp ? h(p.T1) + ws / p.eta : h(p.T1) - p.eta * ws, T2 = TH.bisect((T) => h(T) - h2, 150, 3000, 1e-10);
      const s2 = sOf(T2, P2);
      const Tlo = Math.min(p.T1, T2s) * 0.85, Thi = Math.max(p.T1, T2) * 1.12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.min(s1, s2) - 0.35, xmax: Math.max(s1, s2) + 0.35, ymin: Tlo, ymax: Thi, xlabel: 's (kJ/kg·K) desde 298 K y 100 kPa', ylabel: 'T (K)' });
      pl.frame();
      for (const P of [P1, P2]) { const xs = [], ys = []; for (let i = 0; i <= 60; i++) { const T = Tlo + ((Thi - Tlo) * i) / 60; xs.push(sOf(T, P)); ys.push(T); } pl.xy(xs, ys, { color: '--c1', width: 1.4 }); pl.label(sOf(Thi * 0.97, P), Thi * 0.97, (P >= 1000 ? (P / 1000).toFixed(1) + ' MPa' : P.toFixed(0) + ' kPa'), { size: 10.5, color: '--c1', dx: 4 }); }
      pl.path([[s1, p.T1], [s1, T2s]], { color: '--c3', width: 1.6, dash: [6, 4] });
      pl.path([[s1, p.T1], [s2, T2]], { color: '--accent', width: 2.8 });
      pl.dot(s1, p.T1, { color: '--ink', label: '1' }); pl.dot(s1, T2s, { color: '--c3', label: '2s' }); pl.dot(s2, T2, { color: '--accent', label: '2' });
      sim.set('T2', EM.fix(T2s, 1) + ' K · ' + EM.fix(T2, 1) + ' K');
      sim.set('w', EM.fix(ws, 1) + ' · ' + EM.fix(Math.abs(h2 - h(p.T1)), 1) + ' kJ/kg' + (comp ? ' consumidos' : ' entregados'));
      sim.set('s', EM.fix(s2 - s1, 4) + ' kJ/kg·K');
    });
  });

  /* 11.4 Mezcla de dos gases */
  EM.defineSim('mezcla', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de partículas', min: 20, max: 400, step: 10, value: 200, fmt: (v) => v.toFixed(0) });
    sim.slider('xr', { label: 'Fracción de partículas azules', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.button('Retirar la partición', () => { part = false; }, { primary: true });
    sim.resetButton(() => reset());
    sim.out('S', 'Entropía de mezcla estimada', { hl: true });
    sim.out('Si', 'Valor ideal −<i>N</i> Σ <i>x</i> ln <i>x</i>');
    let g, part, t, hist;
    const reset = () => {
      const p = sim.p, n1 = Math.round(p.N * p.xr);
      g = new EM.GasBox({ N: p.N, r: 0.008, W: 1.6, H: 1, T: 1 });
      for (let i = 0; i < g.N; i++) { const left = i < n1; g.tag[i] = left ? 0 : 1; g.x[i] = left ? 0.02 + Math.random() * (1.6 * p.xr - 0.04) : 1.6 * p.xr + 0.02 + Math.random() * (1.6 * (1 - p.xr) - 0.04); }
      part = true; t = 0; hist = [];
    };
    reset();
    sim.onChange = reset;
    const entropy = () => {
      const nx = 8, ny = 5, cells = [];
      for (let i = 0; i < nx * ny; i++) cells.push([0, 0]);
      for (let i = 0; i < g.N; i++) { const cx = Math.min(nx - 1, Math.floor((g.x[i] / g.W) * nx)), cy = Math.min(ny - 1, Math.floor((g.y[i] / g.H) * ny)); cells[cy * nx + cx][g.tag[i]]++; }
      let S = 0; for (const [a, b] of cells) { const n = a + b; if (a) S -= a * Math.log(a / n); if (b) S -= b * Math.log(b / n); }
      return S;
    };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const xp = 1.6 * sim.p.xr;
      for (let k = 0; k < 6; k++) {
        g.step(Math.min(dt, 0.03) / 6 * 0.6);
        if (part) for (let i = 0; i < g.N; i++) {
          if (g.tag[i] === 0 && g.x[i] > xp - g.r) { g.x[i] = 2 * (xp - g.r) - g.x[i]; g.vx[i] = -Math.abs(g.vx[i]); }
          if (g.tag[i] === 1 && g.x[i] < xp + g.r) { g.x[i] = 2 * (xp + g.r) - g.x[i]; g.vx[i] = Math.abs(g.vx[i]); }
        }
      }
      t += dt; if (!part) { hist.push([t, entropy()]); if (hist.length > 1200) hist.shift(); }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const bh = H * 0.55, bw = bh * 1.6, bx = 10, by = 10;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      for (let i = 0; i < g.N; i++) { ctx.fillStyle = EM.col(g.tag[i] ? '--c2' : '--c1'); ctx.beginPath(); ctx.arc(bx + (g.x[i] / g.W) * bw, by + bh - g.y[i] * bh, 2.6, 0, 7); ctx.fill(); }
      if (part) { ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(bx + bw * p.xr - 2, by, 4, bh); }
      const x = p.xr, Sid = -g.N * (x * Math.log(x) + (1 - x) * Math.log(1 - x));
      const pl = new EM.Plot(ctx, { x: 0, y: by + bh + 4, w: Wc, h: H - bh - by - 4, xmin: hist.length ? hist[0][0] : 0, xmax: hist.length ? Math.max(hist[hist.length - 1][0], hist[0][0] + 5) : 5, ymin: 0, ymax: Sid * 1.2, xlabel: 't', ylabel: 'S/k_B', mb: 30 });
      pl.frame(); pl.hline(Sid, { color: '--c3', label: 'ideal' }); pl.path(hist, { color: '--accent', width: 2 });
      const S = part ? 0 : entropy();
      sim.set('S', part ? '0 (gases separados)' : EM.fix(S, 1) + ' k_B (' + EM.fix((100 * S) / Sid, 1) + ' % del ideal)');
      sim.set('Si', EM.fix(Sid, 1) + ' k_B');
    });
  });
})();
