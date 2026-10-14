/* Capítulo 12 — Diagramas de fase */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     12.1 Solución regular
     ====================================================================== */
  EM.defineSim('regular-solution', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Om', { label: 'Parámetro de interacción Ω', min: -20, max: 40, step: 0.5, value: 20, unit: 'kJ/mol', fmt: (v) => EM.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: 200, max: 2500, step: 5, value: 900, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('x0', { label: 'Composición de la aleación <i>x</i><sub>B</sub>', min: 0.01, max: 0.99, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('Tc', 'Temperatura crítica <i>T<sub>c</sub></i> = Ω/2<i>R</i>');
    sim.out('bin', 'Binodal (tangente común)', { hl: true });
    sim.out('sp', 'Espinodal');
    sim.out('st', 'Estado de la aleación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Om = p.Om * 1000, T = p.T;
      const G = (x) => MAT.Gmix(x, Om, T) / 1000;
      const xs = M.linspace(0.001, 0.999, 300), gs = xs.map(G);
      const gmin = Math.min(...gs), gmax = Math.max(0.5, ...gs);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: 0, xmax: 1, ymin: gmin * 1.2 - 0.2, ymax: gmax + 0.3, xlabel: 'x_B', ylabel: 'ΔG_{mez} (kJ/mol)', ml: 52 });
      pl.frame();
      pl.xy(xs, gs, { color: '--accent', width: 2.4 });
      const bn = Om > 0 ? MAT.binodal(Om, T) : null, sp = Om > 0 ? MAT.spinodal(Om, T) : null;
      if (bn) { pl.xy([bn[0], bn[1]], [G(bn[0]), G(bn[1])], { color: '--c1', width: 1.8 }); pl.dot(bn[0], G(bn[0]), { color: '--c1' }); pl.dot(bn[1], G(bn[1]), { color: '--c1' }); }
      if (sp) { pl.band(sp[0], sp[1], { color: '--c2', alpha: 0.08 }); }
      pl.vline(p.x0, { color: '--ink-3' });
      pl.dot(p.x0, G(p.x0), { color: '--accent' });
      /* diagrama T–x */
      const Tc = Om > 0 ? Om / (2 * MAT.R) : 0;
      const pd = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(1500, Tc * 1.25), xlabel: 'x_B', ylabel: 'T (K)', ml: 52 });
      pd.frame();
      if (Om > 0) {
        const Ts = M.linspace(Tc * 0.25, Tc * 0.9995, 80);
        const left = Ts.map((t) => MAT.binodal(Om, t)[0]);
        pd.xy(left.concat(left.map((x) => 1 - x).reverse()), Ts.concat(Ts.slice().reverse()), { color: '--c1', width: 2.2 });
        const Ts2 = M.linspace(Tc * 0.25, Tc * 0.9999, 80);
        const sl = Ts2.map((t) => MAT.spinodal(Om, t)[0]);
        pd.xy(sl.concat(sl.map((x) => 1 - x).reverse()), Ts2.concat(Ts2.slice().reverse()), { color: '--c2', width: 1.4, dash: [5, 4] });
        pd.label(0.5, Tc * 0.6, 'α₁ + α₂', { align: 'center', size: 12, color: '--c1' });
      }
      pd.label(0.5, Math.max(1500, Tc * 1.25) * 0.93, 'una sola solución α', { align: 'center', size: 11.5, color: '--ink-3' });
      pd.dot(p.x0, T, { color: '--accent' });
      pd.legend([{ label: 'binodal', color: '--c1' }, { label: 'espinodal', color: '--c2', dash: [5, 4] }], 'br');
      let st = 'una sola fase (estable)';
      if (bn && p.x0 > bn[0] && p.x0 < bn[1]) {
        const [w1, w2] = MAT.lever(p.x0, bn[0], bn[1]);
        st = (sp && p.x0 > sp[0] && p.x0 < sp[1] ? 'inestable (espinodal): ' : 'metaestable (nucleación): ') + 'α₁ ' + EM.fix(w1, 2) + ' + α₂ ' + EM.fix(w2, 2);
      }
      sim.set('Tc', Om > 0 ? EM.fix(Tc, 0) + ' K' : '— (Ω ≤ 0: miscibilidad total)');
      sim.set('bin', bn ? EM.fix(bn[0], 3) + ' y ' + EM.fix(bn[1], 3) : '—');
      sim.set('sp', sp ? EM.fix(sp[0], 3) + ' y ' + EM.fix(sp[1], 3) : '—');
      sim.set('st', st);
    });
  });

  /* ======================================================================
     Utilidad: arrastrar el punto (C, T) en un diagrama
     ====================================================================== */
  function dragPoint(sim, cv, getPlot, idC, idT) {
    let plot = null;
    EM.pointer(cv, {
      down: (x, y) => { plot = getPlot(); if (!plot || !plot.inside(x, y)) return null; set(x, y); return 1; },
      move: (_, x, y) => set(x, y),
      hover: (x, y) => { const pl = getPlot(); return pl && pl.inside(x, y) ? 'crosshair' : false; }
    });
    function set(x, y) {
      const pl = getPlot();
      const C = M.clamp(pl.invX(x), sim.ctl[idC].input ? +sim.ctl[idC].input.min : 0, 100);
      const T = pl.invY(y);
      sim.ctl[idC].set(Math.round(C * 10) / 10);
      sim.ctl[idT].set(Math.round(T));
    }
  }

  /* ======================================================================
     12.2 Cu–Ni
     ====================================================================== */
  EM.defineSim('cuni-lever', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('C', { label: 'Composición <i>C</i><sub>0</sub>', min: 0, max: 100, step: 0.1, value: 35, unit: '% peso Ni', fmt: (v) => EM.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura', min: 1000, max: 1550, step: 1, value: 1250, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('ideal', { label: 'Superponer el modelo de solución ideal', value: false });
    sim.out('reg', 'Región', { hl: true });
    sim.out('comp', 'Composiciones de las fases');
    sim.out('frac', 'Fracciones en masa');
    sim.out('TLS', 'Liquidus y solidus de esta aleación');
    let pl = null;
    dragPoint(sim, cv, () => pl, 'C', 'T');
    sim.hint('Arrastre el punto sobre el diagrama', cv);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const D = MAT.CuNi;
      pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 100, ymin: 1000, ymax: 1550, xlabel: 'composición (% en peso de Ni)', ylabel: 'temperatura (°C)', ml: 56 });
      pl.frame();
      pl.xy(D.liq.map((q) => q[0]), D.liq.map((q) => q[1]), { color: '--c2', width: 2.4 });
      pl.xy(D.sol.map((q) => q[0]), D.sol.map((q) => q[1]), { color: '--c1', width: 2.4 });
      pl.label(55, 1480, 'L (líquido)', { size: 13, color: '--c2' });
      pl.label(30, 1100, 'α (FCC, Cu y Ni en solución sólida)', { size: 13, color: '--c1' });
      pl.label(48, 1300, 'α + L', { size: 12, color: '--ink-2' });
      if (p.ideal) {
        const Ts = M.linspace(1358.5, 1727.5, 60);
        const toW = (x) => (100 * x * 58.69) / (x * 58.69 + (1 - x) * 63.55);
        const lens = Ts.map((T) => MAT.idealLens(T, D.TA, D.TB, D.HA, D.HB));
        pl.xy(lens.map((q) => toW(q[1])), Ts.map((T) => T - 273.15), { color: '--c2', width: 1.2, dash: [5, 4] });
        pl.xy(lens.map((q) => toW(q[0])), Ts.map((T) => T - 273.15), { color: '--c1', width: 1.2, dash: [5, 4] });
      }
      const st = MAT.cuniState(p.C, p.T);
      if (st.phases.length === 2) {
        const [L, a] = st.phases;
        pl.xy([L.C, a.C], [p.T, p.T], { color: '--ink', width: 1.8 });
        pl.dot(L.C, p.T, { color: '--c2', label: 'C_L', dy: -8 });
        pl.dot(a.C, p.T, { color: '--c1', label: 'C_α', dy: -8 });
        pl.vline(L.C, { color: '--c2', dash: [2, 3] }); pl.vline(a.C, { color: '--c1', dash: [2, 3] });
      }
      pl.dot(p.C, p.T, { color: '--accent', r: 6 });
      sim.set('reg', st.region);
      sim.set('comp', st.phases.map((q) => q.name + ': ' + EM.fix(q.C, 1) + ' % Ni').join(' · '));
      sim.set('frac', st.phases.map((q) => 'W<sub>' + q.name + '</sub> = ' + EM.fix(q.W, 3)).join(' · '));
      sim.set('TLS', EM.fix(MAT.curveT(D.liq, p.C), 0) + ' °C y ' + EM.fix(MAT.curveT(D.sol, p.C), 0) + ' °C');
    });
  });

  /* ======================================================================
     12.3 Pb–Sn
     ====================================================================== */
  function drawMicro(ctx, x0, y0, w, h, C, T) {
    const P = MAT.PbSn, st = MAT.pbsnState(C, T), mic = T < P.TE ? MAT.pbsnMicro(C) : null;
    ctx.save();
    ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 2, 0, 7); ctx.clip();
    const colA = EM.mix(EM.col('--c1'), EM.col('--canvas'), 0.55), colB = EM.mix(EM.col('--c4'), EM.col('--canvas'), 0.3), colL = EM.mix(EM.col('--c2'), EM.col('--canvas'), 0.75);
    const rnd = (k) => { const s = Math.sin(k * 91.17) * 43758.55; return s - Math.floor(s); };
    if (st.region === 'L') { ctx.fillStyle = colL; ctx.fillRect(x0, y0, w, h); }
    else {
      /* fondo: eutéctico laminar o la fase matriz */
      const prim = mic ? mic.primary : st.phases.length === 1 ? st.phases[0].name : null;
      let Wp = mic ? mic.Wp : 1;
      if (!mic && (st.region === 'α + L' || st.region === 'β + L')) Wp = st.phases.find((q) => q.name !== 'L').W;
      const bg = st.region.includes('L') ? colL : mic && mic.We > 0 ? null : prim === 'β' ? colB : colA;
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(x0, y0, w, h); }
      else {
        for (let k = -h; k < w + h; k += 5) { ctx.strokeStyle = (k / 5) % 2 ? colA : colB; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x0 + k, y0); ctx.lineTo(x0 + k + h * 0.4, y0 + h); ctx.stroke(); }
      }
      /* granos primarios */
      if (Wp < 0.999 || st.region.includes('L')) {
        const n = 9, area = w * h * Math.min(0.97, Wp);
        const r = Math.sqrt(area / (n * Math.PI));
        for (let k = 0; k < n; k++) {
          const cx = x0 + w * (0.15 + 0.7 * rnd(k + 1)), cy = y0 + h * (0.15 + 0.7 * rnd(k + 20));
          ctx.fillStyle = prim === 'β' || (st.region === 'β + L') ? colB : colA;
          ctx.beginPath(); for (let i = 0; i <= 12; i++) { const a = (i / 12) * 2 * Math.PI, rr = r * (0.8 + 0.4 * rnd(k * 13 + i)); ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } ctx.fill();
          ctx.strokeStyle = EM.alpha('--ink', 0.4); ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      /* precipitados por debajo del solvus */
      if (st.region === 'α + β' && (!mic || mic.We < 0.02)) {
        for (let k = 0; k < 60; k++) { ctx.fillStyle = colB; ctx.beginPath(); ctx.arc(x0 + w * rnd(k + 300), y0 + h * rnd(k + 500), 2.2, 0, 7); ctx.fill(); }
      }
    }
    ctx.restore();
    ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 2, 0, 7); ctx.stroke();
  }
  EM.defineSim('pbsn-eutectic', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('C', { label: 'Composición <i>C</i><sub>0</sub>', min: 0, max: 100, step: 0.1, value: 40, unit: '% peso Sn', fmt: (v) => EM.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura', min: 0, max: 350, step: 1, value: 150, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('reg', 'Región', { hl: true });
    sim.out('comp', 'Composiciones de las fases');
    sim.out('frac', 'Fracciones de fase');
    sim.out('micro', 'Microconstituyentes (bajo 183 °C)');
    let pl = null;
    dragPoint(sim, cv, () => pl, 'C', 'T');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = MAT.PbSn;
      EM.draw.clear(cv);
      pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.7, h: H, xmin: 0, xmax: 100, ymin: 0, ymax: 350, xlabel: 'composición (% en peso de Sn)', ylabel: 'temperatura (°C)', ml: 52 });
      pl.frame();
      pl.xy([0, P.CE, 100], [P.TA, P.TE, P.TB], { color: '--c2', width: 2.4 });
      pl.xy([0, P.Ca], [P.TA, P.TE], { color: '--c1', width: 2.2 });
      pl.xy([100, P.Cb], [P.TB, P.TE], { color: '--c4', width: 2.2 });
      pl.xy([P.Ca, P.Cb], [P.TE, P.TE], { color: '--ink', width: 2 });
      pl.xy(P.solvusA.map((q) => q[0]), P.solvusA.map((q) => q[1]), { color: '--c1', width: 2 });
      pl.xy(P.solvusB.map((q) => q[0]), P.solvusB.map((q) => q[1]), { color: '--c4', width: 2 });
      pl.label(50, 300, 'L', { size: 14, color: '--c2' });
      pl.label(4, 230, 'α', { size: 14, color: '--c1' });
      pl.label(96, 205, 'β', { size: 14, color: '--c4' });
      pl.label(28, 215, 'α + L', { size: 12 }); pl.label(84, 191, 'β+L', { size: 11 });
      pl.label(55, 90, 'α + β', { size: 13 });
      pl.dot(P.CE, P.TE, { color: '--ink', r: 4, label: 'E (61.9 %, 183 °C)', dy: 14 });
      const st = MAT.pbsnState(p.C, p.T);
      if (st.phases.length === 2) {
        const [a, b] = st.phases;
        pl.xy([a.C, b.C], [p.T, p.T], { color: '--ink', width: 1.6 });
        pl.dot(a.C, p.T, { color: '--c1', r: 4 }); pl.dot(b.C, p.T, { color: '--c4', r: 4 });
      }
      pl.dot(p.C, p.T, { color: '--accent', r: 6 });
      drawMicro(ctx, W * 0.73, H * 0.18, W * 0.25, W * 0.25, p.C, p.T);
      EM.text(ctx, 'microestructura (esquema)', W * 0.855, H * 0.18 - 8, { size: 11, align: 'center', color: '--ink-3' });
      const mic = MAT.pbsnMicro(p.C);
      sim.set('reg', st.region);
      sim.set('comp', st.phases.length ? st.phases.map((q) => q.name + ': ' + EM.fix(q.C, 1) + ' % Sn').join(' · ') : '—');
      sim.set('frac', st.phases.length ? st.phases.map((q) => 'W<sub>' + q.name + '</sub> = ' + EM.fix(q.W, 3)).join(' · ') : '—');
      sim.set('micro', mic ? mic.primary + ' primaria ' + EM.fix(mic.Wp, 3) + ' · eutéctico ' + EM.fix(mic.We, 3) : 'sin eutéctico (fuera de 18.3–97.8 % Sn)');
    });
  });

  /* ======================================================================
     12.4 Curvas de enfriamiento
     ====================================================================== */
  EM.defineSim('cooling-curve', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('C', { label: 'Composición', min: 0, max: 100, step: 0.5, value: 40, unit: '% peso Sn', fmt: (v) => EM.fix(v, 1) });
    sim.check('cmp', { label: 'Comparar con Pb puro y con la eutéctica', value: true });
    sim.out('arr', 'Detenciones y cambios de pendiente', { hl: true });
    sim.note('Modelo de entalpía: c_p = 0.17 J/g·K, calor latente 40 J/g, enfriamiento newtoniano hacia 25 °C; la fracción de líquido sale del diagrama de equilibrio.');
    const cp = 0.17, Lh = 40, h = 0.004, Tenv = 25;
    const curve = (C) => {
      const fL = (T) => { const s = MAT.pbsnState(C, T + 1e-6); if (s.region === 'L') return 1; const l = s.phases.find((q) => q.name === 'L'); return l ? l.W : 0; };
      const Tg = [], Hg = [];
      for (let T = 20; T <= 400; T += 0.05) { Tg.push(T); Hg.push(cp * T + Lh * fL(T)); }
      const Tof = (Hh) => { let lo = 0, hi = Hg.length - 1; if (Hh <= Hg[0]) return Tg[0]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (Hg[m] < Hh) lo = m; else hi = m; } const t = (Hh - Hg[lo]) / Math.max(1e-12, Hg[hi] - Hg[lo]); return Tg[lo] + t * (Tg[hi] - Tg[lo]); };
      let Hh = cp * 380 + Lh, t = 0;
      const ts = [], Ts = [];
      for (let k = 0; k < 4000; k++) { const T = Tof(Hh); ts.push(t); Ts.push(T); Hh -= h * (T - Tenv) * 1; t += 1; if (T < 60) break; }
      return [ts, Ts];
    };
    let cache = {};
    const get = (C) => cache[C] || (cache[C] = curve(C));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [ts, Ts] = get(p.C);
      const tmax = Math.max(ts[ts.length - 1], p.cmp ? Math.max(get(0)[0].slice(-1)[0], get(61.9)[0].slice(-1)[0]) : 0) * 1.05;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 50, ymax: 400, xlabel: 'tiempo (u. a.)', ylabel: 'temperatura (°C)', ml: 52 });
      pl.frame();
      if (p.cmp) {
        for (const [C, col] of [[0, '--c1'], [61.9, '--c3']]) { const [ts, Ts] = get(C); pl.xy(ts, Ts, { color: col, width: 1.4, dash: [5, 4] }); }
      }
      pl.xy(ts, Ts, { color: '--accent', width: 2.6 });
      const TL = MAT.PbSn.liq(p.C);
      pl.hline(TL, { color: '--c2', label: 'liquidus ' + EM.fix(TL, 0) + ' °C' });
      pl.hline(183, { color: '--ink-3', label: 'eutéctica 183 °C', labelRight: true });
      if (p.cmp) pl.legend([{ label: EM.fix(p.C, 1) + ' % Sn', color: '--accent' }, { label: 'Pb puro', color: '--c1', dash: [5, 4] }, { label: '61.9 % Sn', color: '--c3', dash: [5, 4] }], 'tr');
      /* duración de la meseta eutéctica */
      let plat = 0; for (let i = 1; i < Ts.length; i++) if (Math.abs(Ts[i] - 183) < 0.05) plat++;
      const mic = MAT.pbsnMicro(p.C);
      sim.set('arr', (p.C < 0.5 || p.C > 99.5 ? 'meseta en ' + (p.C < 50 ? '327' : '232') + ' °C (metal puro)' : 'cambio de pendiente en ' + EM.fix(TL, 0) + ' °C') + (mic ? ' · meseta eutéctica de ' + plat + ' u. de tiempo (eutéctico ' + EM.fix(100 * mic.We, 0) + ' %)' : ' · sin meseta eutéctica'));
    });
  });
})();
