/* Capítulo 16 — Potenciales y relaciones termodinámicas */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;
  const W = TH.agua, Rw = 461.52;
  /* presión de saturación sobre líquido (Wagner–Pruß, extrapolada por debajo del punto triple) y sobre hielo (IAPWS 2011) */
  const psatL = (T) => { const t = 1 - T / 647.096, a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502], e = [1, 1.5, 3, 3.5, 4, 7.5]; let s = 0; for (let i = 0; i < 6; i++) s += a[i] * Math.pow(t, e[i]); return 22.064e6 * Math.exp((647.096 / T) * s); };

  /* 16.1 Energía de Gibbs de las fases */
  EM.defineSim('gibbs-fases', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P', { label: 'Presión', min: 0.1, max: 500, step: 0.01, value: 81.9, unit: 'kPa', log: true, fmt: (v) => v.toFixed(v < 1 ? 3 : 1) });
    sim.out('st', 'Fase estable a cada temperatura', { hl: true });
    sim.out('Tm', 'Fusión · ebullición (o sublimación)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e3;
      EM.draw.clear(cv);
      const Tm = 273.16 - 7.4e-8 * (P - 611.657), hsf = 333.6;
      const gv = (t) => (Rw * (t + 273.15) * Math.log(P / psatL(t + 273.15))) / 1000, gs = (t) => hsf * ((t + 273.15) / Tm - 1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -40, xmax: 140, ymin: -60, ymax: 60, xlabel: 't (°C)', ylabel: 'g − g_{líquido} (kJ/kg)' });
      pl.frame();
      pl.hline(0, { color: '--c1', dash: [], width: 2.4, label: 'líquido' });
      pl.fn(gs, { color: '--c5', width: 2.4 });
      pl.fn(gv, { color: '--c2', width: 2.4 });
      /* envolvente estable */
      pl.fn((t) => Math.min(0, gs(t), gv(t)), { color: '--ink', width: 1, dash: [2, 3] });
      pl.legend([{ label: 'hielo', color: '--c5' }, { label: 'líquido', color: '--c1' }, { label: 'vapor', color: '--c2' }, { label: 'fase estable (mínimo)', color: '--ink', dash: [2, 3] }], 'tl');
      const Tb = TH.bisect((t) => gv(t), -40, 300, 1e-9);
      let Tsub = null; try { Tsub = TH.bisect((t) => gv(t) - gs(t), -80, 0.02, 1e-9); } catch (e) { /* */ }
      const liquidExists = Tb > Tm - 273.15;
      if (liquidExists) { pl.vline(Tm - 273.15, { color: '--c5', label: 'fusión' }); pl.vline(Tb, { color: '--c2', label: 'ebullición', labelY: 28 }); }
      else if (Tsub !== null) pl.vline(Tsub, { color: '--c5', label: 'sublimación' });
      sim.set('st', liquidExists ? 'hielo · líquido · vapor' : 'hielo · vapor (no hay líquido estable)');
      sim.set('Tm', liquidExists ? EM.fix(Tm - 273.15, 3) + ' °C · ' + EM.fix(Tb, 2) + ' °C' : 'sublimación a ' + EM.fix(Tsub, 2) + ' °C');
    });
  });

  /* 16.2 Comprobación de relaciones de Maxwell */
  EM.defineSim('maxwell-check', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('rel', { label: 'Relación', options: [['a', '(∂s/∂P)_T = −(∂v/∂T)_P'], ['b', '(∂T/∂P)_s = (∂v/∂s)_P']], value: 'a' });
    sim.slider('P', { label: 'Presión', min: 0.05, max: 15, step: 0.01, value: 1, unit: 'MPa', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 600, step: 1, value: 300, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('L', 'Lado izquierdo', { hl: true });
    sim.out('R', 'Lado derecho');
    sim.out('e', 'Diferencia relativa');
    sim.out('ig', 'Gas ideal (referencia)');
    const sides = (rel, P, T) => {
      if (rel === 'a') { const dP = P * 1e-3, dT = 0.25; return [(W.sup(P + dP, T).s - W.sup(P - dP, T).s) / (2 * dP), -(W.sup(P, T + dT).v - W.sup(P, T - dT).v) / (2 * dT), -Rw / P]; }
      const s0 = W.sup(P, T).s, dP = P * 1e-3, ds = 1;
      const Tp = W.state(P + dP, { s: s0 }).T, Tm = W.state(P - dP, { s: s0 }).T;
      const vp = W.state(P, { s: s0 + ds }).v, vm = W.state(P, { s: s0 - ds }).v;
      return [(Tp - Tm) / (2 * dP), (vp - vm) / (2 * ds), (Rw * T) / (P * 2013)];
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e6;
      EM.draw.clear(cv);
      const Tlo = W.Tsat(P) + 3, Thi = 873;
      const T = Math.max(Tlo, p.T + 273.15);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Tlo - 273.15, xmax: 600, ymin: 0, ymax: 1, xlabel: 't (°C) a la presión elegida', ylabel: p.rel === 'a' ? '|derivada| (m³/kg·K)' : 'derivada (K/Pa)' });
      const xs = [], L = [], Rr = [];
      for (let i = 0; i <= 40; i++) { const t = Tlo + ((Thi - Tlo) * i) / 40; const s = sides(p.rel, P, t); xs.push(t - 273.15); L.push(Math.abs(s[0])); Rr.push(Math.abs(s[1])); }
      const mx = Math.max(...L, ...Rr) * 1.1;
      pl.set({ ymax: mx });
      pl.frame();
      pl.xy(xs, L, { color: '--accent', width: 4, alpha: 0.5 });
      pl.xy(xs, Rr, { color: '--c1', width: 1.6, dash: [5, 4] });
      const s = sides(p.rel, P, T);
      pl.dot(T - 273.15, Math.abs(s[0]), { color: '--accent' });
      pl.legend([{ label: 'lado izquierdo', color: '--accent', width: 4 }, { label: 'lado derecho', color: '--c1', dash: [5, 4] }], 'tr');
      sim.set('L', EM.sci(s[0], 5));
      sim.set('R', EM.sci(s[1], 5));
      sim.set('e', EM.fix((100 * Math.abs(s[0] - s[1])) / Math.abs(s[1]), 3) + ' %');
      sim.set('ig', p.rel === 'a' ? '−R/P = ' + EM.sci(-Rw / P, 4) : 'T/(P c_p) con c_p ≈ 2.01 kJ/kg·K: ' + EM.sci(s[2], 4));
    });
  });

  /* 16.3 Clapeyron */
  EM.defineSim('clapeyron', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura de saturación', min: 1, max: 373, step: 0.5, value: 100, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('m', 'Pendiente de la curva de saturación (tabla)', { hl: true });
    sim.out('c', 'Clapeyron <i>h<sub>fg</sub></i>/(<i>T v<sub>fg</sub></i>)');
    sim.out('cc', 'Clausius–Clapeyron <i>P h<sub>fg</sub></i>/(<i>RT</i>²)');
    const slope = (T) => (W.Psat(T + 0.05) - W.Psat(T - 0.05)) / 0.1;
    const clap = (T) => { const s = W.sat(T); return s.hfg / (T * (s.vg - s.vf)); };
    const cc = (T) => { const s = W.sat(T); return (s.P * s.hfg) / (Rw * T * T); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: 374, ymin: 10, ymax: 5e5, ylog: true, xlabel: 't (°C)', ylabel: 'dP/dT (Pa/K)' });
      pl.frame();
      pl.fn((t) => slope(t + 273.15), { color: '--ink-3', width: 4, alpha: 0.4, from: 0.2, to: 373.5 });
      pl.fn((t) => clap(t + 273.15), { color: '--accent', width: 1.6, from: 0.2, to: 373.5 });
      pl.fn((t) => cc(t + 273.15), { color: '--c1', width: 1.6, dash: [5, 4], from: 0.2, to: 373.5 });
      pl.legend([{ label: 'tabla', color: '--ink-3', width: 4 }, { label: 'Clapeyron', color: '--accent' }, { label: 'Clausius–Clapeyron', color: '--c1', dash: [5, 4] }], 'br');
      const p2 = new EM.Plot(ctx, { x: Wc / 2, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: 374, ymin: -60, ymax: 5, xlabel: 't (°C)', ylabel: 'error de Clausius–Clapeyron (%)' });
      p2.frame();
      p2.fn((t) => (100 * (cc(t + 273.15) - slope(t + 273.15))) / slope(t + 273.15), { color: '--c1', width: 2.2, from: 0.2, to: 373 });
      p2.hline(0, { color: '--ink-3' });
      const T = p.T + 273.15;
      pl.vline(p.T, { color: '--accent' }); p2.vline(p.T, { color: '--accent' });
      sim.set('m', EM.fix(slope(T), 2) + ' Pa/K');
      sim.set('c', EM.fix(clap(T), 2) + ' Pa/K');
      sim.set('cc', EM.fix(cc(T), 2) + ' Pa/K (' + EM.fix((100 * (cc(T) - slope(T))) / slope(T), 2) + ' %)');
    });
  });

  /* 16.4 cp − cv del agua líquida (IAPWS-95 a 1 atm, CoolProp) */
  const LIQ = [[1, 5.0509, -49.864, 4216.11, 4214.76, 0.001000098], [4, 4.9481, 0.349, 4207.5, 4207.5, 0.001000025], [10, 4.7808, 87.934, 4195.16, 4190.58, 0.001000298], [20, 4.5891, 206.806, 4184.05, 4156.68, 0.001001796], [30, 4.4769, 303.377, 4179.82, 4117.23, 0.00100437], [40, 4.4238, 385.479, 4179.41, 4073.4, 0.001007845], [50, 4.4173, 457.775, 4181.34, 4026.18, 0.00101211], [60, 4.4498, 523.253, 4184.95, 3976.47, 0.001017091], [70, 4.5166, 583.956, 4190.07, 3925.1, 0.001022741], [80, 4.615, 641.364, 4196.75, 3872.84, 0.001029028], [90, 4.7435, 696.612, 4205.21, 3820.35, 0.001035937], [99, 4.885, 745.251, 4214.53, 3773.35, 0.001042681]];
  EM.defineSim('cp-cv', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Temperatura', min: 1, max: 99, step: 0.5, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('b', 'Coeficiente de dilatación β', { hl: true });
    sim.out('d', '<i>c<sub>p</sub></i> − <i>c<sub>v</sub></i> = <i>Tvβ</i>²/κ');
    sim.out('t', '<i>c<sub>p</sub></i> − <i>c<sub>v</sub></i> de las tablas');
    const col = (k) => LIQ.map((r) => r[k]), ts = col(0);
    const f = (k, t) => TH.interp(ts, col(k), t);
    const form = (t) => ((t + 273.15) * f(5, t) * Math.pow(f(2, t) * 1e-6, 2)) / (f(1, t) * 1e-10);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: 100, ymin: -100, ymax: 800, xlabel: 't (°C)', ylabel: 'β (10⁻⁶ K⁻¹)' });
      pl.frame(); pl.hline(0, { color: '--ink-3' });
      pl.fn((t) => f(2, t), { color: '--c1', width: 2.4, from: 1, to: 99 });
      pl.vline(3.98, { label: '3.98 °C' });
      pl.dot(p.t, f(2, p.t), { color: '--c1' });
      const p2 = new EM.Plot(ctx, { x: Wc / 2, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: 100, ymin: 0, ymax: 480, xlabel: 't (°C)', ylabel: 'c_p − c_v (J/kg·K)' });
      p2.frame();
      p2.fn(form, { color: '--accent', width: 2.4, from: 1, to: 99 });
      for (const r of LIQ) p2.dot(r[0], r[3] - r[4], { color: '--ink', r: 3.5 });
      p2.dot(p.t, form(p.t), { color: '--accent', r: 6 });
      sim.set('b', EM.fix(f(2, p.t), 2) + ' ×10⁻⁶ K⁻¹' + (f(2, p.t) < 0 ? ' (se contrae al calentarse)' : ''));
      sim.set('d', EM.fix(form(p.t), 2) + ' J/kg·K');
      sim.set('t', EM.fix(f(3, p.t) - f(4, p.t), 2) + ' J/kg·K');
    });
  });
})();
