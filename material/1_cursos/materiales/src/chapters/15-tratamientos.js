/* Capítulo 15 — Tratamientos térmicos */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const NAV = Math.log(Math.log(0.01) / Math.log(0.99)) / Math.log(30), MS = 220;

  /* Simulación de un enfriamiento continuo con aditividad (solo perlita, T > 540 °C) */
  function coolPath(rate, T0 = 800) {
    let T = T0, t = 0, X = 0;
    const pts = [[0.01, T0]];
    const prods = { gruesa: 0, fina: 0 };
    while (T > 25) {
      const dT = Math.max(0.05, Math.min(2, rate * 0.05));
      const dt = dT / rate;
      T -= dT; t += dt;
      if (T < 727 && T > 540 && X < 0.999) {
        const k = -Math.log(0.99) / Math.pow(MAT.tStartTTT(T), NAV);
        const te = X > 0 ? Math.pow(-Math.log(1 - X) / k, 1 / NAV) : 0;
        const Xn = 1 - Math.exp(-k * Math.pow(te + dt, NAV));
        prods[T > 650 ? 'gruesa' : 'fina'] += Xn - X;
        X = Xn;
      }
      if (pts.length < 4000) pts.push([t, T]);
    }
    const gamma = 1 - X, mart = gamma * MAT.koistinen(MS, 25);
    return { pts, prods, mart, ret: gamma - mart };
  }
  EM.coolPath = coolPath;

  /* ======================================================================
     15.1 CCT
     ====================================================================== */
  EM.defineSim('cct', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('r', { label: 'Velocidad de enfriamiento', min: 0.1, max: 1000, step: 0.1, value: 50, unit: '°C/s', log: true, fmt: (v) => (v < 10 ? EM.fix(v, 1) : v.toFixed(0)) });
    sim.check('ttt', { label: 'Mostrar el TTT isotérmico', value: true });
    sim.out('res', 'Microestructura final', { hl: true });
    sim.out('crit', 'Velocidad crítica de temple (aditividad)');
    let cct = null;
    const buildCCT = () => {
      const rates = M.linspace(Math.log10(0.05), Math.log10(127), 60).map((q) => Math.pow(10, q));
      const start = [], fin = [];
      for (const r of rates) {
        for (const [arr, f] of [[start, 1], [fin, 30]]) {
          let s = 0, T = 726.95;
          for (; T > 540; T -= 0.1) { s += 0.1 / r / (f * MAT.tStartTTT(T)); if (s >= 1) break; }
          if (T > 540) arr.push([(800 - T) / r, T]);
        }
      }
      return { start, fin, crit: MAT.criticalRate() };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      if (!cct) cct = buildCCT();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 1e5, ymin: 0, ymax: 800, xlog: true, xlabel: 'tiempo (s)', ylabel: 'temperatura (°C)', ml: 52 });
      pl.frame();
      if (p.ttt) { const Ts = M.linspace(545, 724, 80); pl.xy(Ts.map(MAT.tStartTTT), Ts, { color: '--grid-2', width: 1.4, dash: [4, 3] }); }
      pl.xy(cct.start.map((q) => q[0]), cct.start.map((q) => q[1]), { color: '--c1', width: 2.4 });
      pl.xy(cct.fin.map((q) => q[0]), cct.fin.map((q) => q[1]), { color: '--c2', width: 2.4 });
      pl.hline(727, { color: '--ink-3', label: 'A₁' });
      pl.hline(MS, { color: '--c5', dash: [], label: 'M_s', labelRight: true });
      for (const r of [1, 10, 35, cct.crit, 1000]) { const c = coolPath(r); pl.xy(c.pts.map((q) => q[0]), c.pts.map((q) => q[1]), { color: '--grid-2', width: 1 }); }
      const c = coolPath(p.r);
      pl.xy(c.pts.map((q) => q[0]), c.pts.map((q) => q[1]), { color: '--accent', width: 3 });
      pl.legend([{ label: 'inicio CCT (aditividad)', color: '--c1' }, { label: 'fin CCT', color: '--c2' }].concat(p.ttt ? [{ label: 'inicio TTT', color: '--grid-2', dash: [4, 3] }] : []), 'tr');
      const parts = [];
      if (c.prods.gruesa > 0.005) parts.push(EM.fix(100 * c.prods.gruesa, 0) + ' % perlita gruesa');
      if (c.prods.fina > 0.005) parts.push(EM.fix(100 * c.prods.fina, 0) + ' % perlita fina');
      if (c.mart > 0.005) parts.push(EM.fix(100 * c.mart, 0) + ' % martensita');
      if (c.ret > 0.005) parts.push(EM.fix(100 * c.ret, 0) + ' % austenita retenida');
      sim.set('res', parts.join(' · '));
      sim.set('crit', EM.fix(cct.crit, 0) + ' °C/s (Callister: 140 °C/s)');
    });
  });

  /* ======================================================================
     15.2 Jominy
     ====================================================================== */
  /* velocidad de enfriamiento a 700 °C contra distancia (aprox. Callister fig. 11.11) */
  const jomRate = (d) => 300 / (1 + Math.pow(d / 2.6, 1.6));
  /* velocidad para 50 % de martensita en aceros de 0.40 % C (ilustrativa, ordenada según Callister fig. 11.14) */
  const JS = { a1040: ['1040 (sin aleantes)', 90, '--c6'], a5140: ['5140 (Cr)', 28, '--c4'], a8640: ['8640 (Ni-Cr-Mo)', 11, '--c3'], a4140: ['4140 (Cr-Mo)', 4.5, '--c1'], a4340: ['4340 (Ni-Cr-Mo)', 0.9, '--c5'] };
  const hrc = (d, rc) => { const r = jomRate(d), f = 1 / (1 + Math.pow(rc / r, 2.5)); return 22 + (56 - 22) * f; };
  EM.defineSim('jominy', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('s', { label: 'Acero resaltado', options: Object.entries(JS).map(([k, v]) => [k, v[0]]), value: 'a4140' });
    sim.slider('d', { label: 'Distancia al extremo templado', min: 0, max: 50, step: 0.5, value: 12, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.out('H', 'Dureza a esa distancia', { hl: true });
    sim.out('rate', 'Velocidad de enfriamiento a 700 °C');
    sim.note('Curvas modeladas: la dureza mezcla martensita (56 HRC con 0.40 % C) y perlita (22 HRC) según la velocidad local; reproducen el orden y la forma de Callister, fig. 11.14, no curvas certificadas.');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* barra */
      const bx = 60, bw = W - 80, by = 14, bh = 22;
      const [, rc] = JS[p.s];
      for (let x = 0; x < bw; x += 2) { const d = (x / bw) * 50, h = hrc(d, rc); ctx.fillStyle = EM.mix(EM.col('--c1'), EM.col('--c2'), (h - 22) / 34); ctx.fillRect(bx + x, by, 2, bh); }
      ctx.strokeStyle = EM.col('--ink-2'); ctx.strokeRect(bx, by, bw, bh);
      EM.draw.arrow(ctx, bx - 30, by + bh / 2, bx - 4, by + bh / 2, { color: '--c1', width: 2 });
      EM.text(ctx, 'agua', bx - 46, by + bh / 2 + 4, { size: 11, color: '--c1' });
      const pl = new EM.Plot(ctx, { x: 0, y: by + bh + 6, w: W, h: H - by - bh - 6, xmin: 0, xmax: 50, ymin: 15, ymax: 62, xlabel: 'distancia al extremo templado (mm)', ylabel: 'dureza (HRC)', ml: 60 });
      pl.frame();
      for (const [k, [n, r, c]] of Object.entries(JS)) {
        pl.fn((d) => hrc(d, r), { color: c, width: k === p.s ? 3 : 1.4 });
        pl.label(49, hrc(49, r), n.split(' ')[0], { align: 'right', dy: -5, size: 10.5, color: c });
      }
      for (const d of [3, 12, 25, 48]) pl.label(d, 60, EM.fix(jomRate(d), 0) + ' °C/s', { size: 9.5, color: '--ink-3', align: 'center' });
      pl.vline(p.d, { color: '--ink-2' });
      pl.dot(p.d, hrc(p.d, rc), { color: '--accent' });
      sim.set('H', EM.fix(hrc(p.d, rc), 1) + ' HRC');
      sim.set('rate', EM.fix(jomRate(p.d), 1) + ' °C/s');
    });
  });

  /* ======================================================================
     15.3 Revenido
     ====================================================================== */
  EM.defineSim('tempering', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('C', { label: 'Carbono del acero', options: [['0.4', '0.40 %'], ['0.6', '0.60 %'], ['0.8', '0.80 %']], value: '0.4' });
    sim.slider('T', { label: 'Temperatura de revenido', min: 150, max: 700, step: 5, value: 500, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('t', { label: 'Tiempo', min: 0.1, max: 100, step: 0.1, value: 1, unit: 'h', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('t2', { label: 'Tiempo deseado para el equivalente', min: 0.1, max: 100, step: 0.1, value: 2, unit: 'h', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.out('P', 'Parámetro <i>P</i> = <i>T</i>(20 + log <i>t</i>)', { hl: true });
    sim.out('H', 'Dureza estimada');
    sim.out('eq', 'Temperatura equivalente para el otro tiempo');
    sim.note('Relación lineal dureza–P ilustrativa (≈ −3 HRC por cada 1000 unidades de P), con el temple como punto de partida.');
    const Hq = { '0.4': 55, '0.6': 62, '0.8': 65 };
    const hard = (P, C) => M.clamp(Hq[C] - 3 * Math.max(0, P - 8500) / 1000 - (C === '0.4' ? 0 : 0), 15, Hq[C]);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = MAT.hollomonJaffe(p.T + 273.15, p.t);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 8000, xmax: 20000, ymin: 10, ymax: 70, xlabel: 'parámetro de Hollomon–Jaffe P', ylabel: 'dureza (HRC)', ml: 52 });
      pl.frame();
      for (const C of ['0.4', '0.6', '0.8']) pl.fn((x) => hard(x, C), { color: C === p.C ? '--accent' : '--grid-2', width: C === p.C ? 2.6 : 1.4 });
      const Pe = (Tc) => MAT.hollomonJaffe(Tc + 273.15, 1);
      pl.band(Pe(260), Pe(320), { color: '--c2', alpha: 0.12 });
      pl.label((Pe(260) + Pe(320)) / 2, 66, 'fragilización 260–320 °C (1 h)', { size: 10, align: 'center', color: '--c2' });
      for (const Tc of [200, 300, 400, 500, 600, 700]) pl.label(Pe(Tc), 13, Tc + ' °C', { size: 9.5, align: 'center', color: '--ink-3' });
      pl.dot(P, hard(P, p.C), { color: '--accent' });
      const Teq = P / (20 + Math.log10(p.t2)) - 273.15;
      sim.set('P', EM.fix(P, 0));
      sim.set('H', EM.fix(hard(P, p.C), 1) + ' HRC');
      sim.set('eq', EM.fix(Teq, 0) + ' °C durante ' + EM.fix(p.t2, 1) + ' h');
    });
  });

  /* ======================================================================
     15.4 Endurecimiento por precipitación
     ====================================================================== */
  const SOLV = [[200, 0.1], [300, 0.45], [400, 1.5], [500, 4.05], [548, 5.65]];
  const solvus = (T) => { for (let i = 1; i < SOLV.length; i++) if (T <= SOLV[i][0]) { const [T1, c1] = SOLV[i - 1], [T2, c2] = SOLV[i]; const u = (T - T1) / (T2 - T1); return Math.exp(Math.log(c1) + u * (Math.log(c2) - Math.log(c1))); } return 5.65; };
  EM.defineSim('precipitation', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('C0', { label: 'Cobre en la aleación', min: 2, max: 5.5, step: 0.1, value: 4, unit: '% peso', fmt: (v) => EM.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura de envejecimiento', min: 120, max: 260, step: 5, value: 190, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('peak', 'Máximo de resistencia', { hl: true });
    sim.out('feq', 'Fracción de equilibrio de θ (CuAl₂)');
    sim.out('sol', 'Solubilidad del Cu a esa temperatura');
    sim.note('Modelo físico simplificado: f(t) de Avrami, r³ − r₀³ = K(T)t (Ostwald), Δσ = mín(A√(fr), B√f/r); Q = 130 kJ/mol; calibrado para un máximo cerca de 10 h a 190 °C.');
    const Q = 130e3, A = 655, B = 3400, r0 = 0.5, s0 = 80;
    const curve = (C0, Tc) => {
      const T = Tc + 273.15;
      const feq = Math.max(0, (C0 - solvus(Tc)) / (53.5 - solvus(Tc)));
      const tau = 3600 * Math.exp((Q / MAT.R) * (1 / T - 1 / 463.15));
      const K = (27 / 36000) * Math.exp((-Q / MAT.R) * (1 / T - 1 / 463.15)) * (463.15 / T);
      return (t) => { const f = feq * (1 - Math.exp(-Math.pow(t / tau, 1.5))); const r = Math.cbrt(r0 ** 3 + K * t); return { s: s0 + Math.min(A * Math.sqrt(f * r), (B * Math.sqrt(f)) / r), f, r }; };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 60, xmax: 1e8, ymin: 60, ymax: 480, xlog: true, xlabel: 'tiempo de envejecimiento (s)', ylabel: 'límite elástico (MPa)', ml: 52 });
      pl.frame();
      for (const Tc of [130, 160, 190, 220, 250]) { const c = curve(p.C0, Tc); pl.fn((t) => c(t).s, { color: Math.abs(Tc - p.T) < 15 ? '--accent' : '--grid-2', width: 1.3 }); }
      const c = curve(p.C0, p.T);
      pl.fn((t) => c(t).s, { color: '--accent', width: 2.8 });
      for (const [t, l] of [[3600, '1 h'], [86400, '1 d'], [2.6e6, '1 mes'], [3.15e7, '1 año']]) pl.vline(t, { color: '--grid-2', label: l, labelY: 14 });
      const ts = M.linspace(2, 8, 200).map((q) => Math.pow(10, q));
      let tp = ts[0]; for (const t of ts) if (c(t).s > c(tp).s) tp = t;
      pl.dot(tp, c(tp).s, { color: '--c2', label: 'máximo (T6)' });
      /* mecanismos contra radio */
      const pr = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0.3, xmax: 15, ymin: 0, ymax: 500, xlabel: 'radio de precipitado (nm)', ylabel: 'Δσ (MPa)', ml: 46 });
      pr.frame();
      const f = c(tp).f;
      pr.fn((r) => A * Math.sqrt(f * r), { color: '--c1', width: 1.8 });
      pr.fn((r) => (B * Math.sqrt(f)) / r, { color: '--c3', width: 1.8 });
      pr.fn((r) => Math.min(A * Math.sqrt(f * r), (B * Math.sqrt(f)) / r), { color: '--accent', width: 2.6 });
      pr.legend([{ label: 'corte', color: '--c1' }, { label: 'Orowan', color: '--c3' }], 'tr');
      pr.vline(Math.pow(B / A, 2 / 3), { color: '--ink-3', label: 'r_c' });
      const feq = Math.max(0, (p.C0 - solvus(p.T)) / (53.5 - solvus(p.T)));
      sim.set('peak', EM.fix(c(tp).s, 0) + ' MPa a ' + (tp < 86400 ? EM.fix(tp / 3600, 1) + ' h' : EM.fix(tp / 86400, 1) + ' días'));
      sim.set('feq', EM.fix(100 * feq, 2) + ' % en masa');
      sim.set('sol', EM.fix(solvus(p.T), 2) + ' % Cu (solubilizar sobre ' + EM.fix(MAT.bisect((T) => solvus(T) - p.C0, 200, 548), 0) + ' °C)');
    });
  });
})();
