/* Capítulo 22 — Propiedades térmicas */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const TH = { Pb: [105, 207.2, 0.128], Ag: [225, 107.87, 0.235], Cu: [343, 63.55, 0.385], Al: [428, 26.98, 0.9], Fe: [470, 55.85, 0.449], Si: [645, 28.09, 0.705], C: [2230, 12.01, 0.509] };

  /* ======================================================================
     22.1 Capacidad calorífica
     ====================================================================== */
  EM.defineSim('debye-heat', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.keys(TH).map((k) => [k, (k === 'C' ? 'Diamante' : k) + ' (Θ_D = ' + TH[k][0] + ' K)']), value: 'Cu' });
    sim.slider('T', { label: 'Temperatura', min: 2, max: 1500, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.seg('ax', { label: 'Eje horizontal', options: [['red', 'T/Θ'], ['abs', 'T (K)']], value: 'red' });
    sim.out('cv', '<i>C<sub>v</sub></i> de Debye', { hl: true });
    sim.out('ce', '<i>C<sub>v</sub></i> de Einstein (Θ<sub>E</sub> = 0.806 Θ<sub>D</sub>)');
    sim.out('cp', 'Calor específico (Debye) y medido a 300 K');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [th, A, cpm] = TH[p.m];
      const red = p.ax === 'red';
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: red ? 0 : 0, xmax: red ? 1.6 : 1500, ymin: 0, ymax: 1.12, xlabel: red ? 'T/Θ_D' : 'T (K)', ylabel: 'C_v / 3R', ml: 50 });
      pl.frame();
      const X = (T) => (red ? T / th : T);
      const f = (x) => { const T = red ? x * th : x; return T <= 0 ? 0 : MAT.debyeCv(T, th); };
      pl.fn(f, { color: '--accent', width: 2.6 });
      pl.fn((x) => { const T = red ? x * th : x; return T <= 0 ? 0 : MAT.einsteinCv(T, 0.806 * th); }, { color: '--c1', width: 1.6, dash: [6, 3] });
      pl.fn((x) => { const T = red ? x * th : x; return ((4 * Math.PI ** 4) / 5) * Math.pow(T / th, 3); }, { color: '--c3', width: 1.2, dash: [3, 3] });
      pl.hline(1, { color: '--ink-3', label: 'Dulong–Petit 3R' });
      if (!red) for (const k of Object.keys(TH)) if (k !== p.m) pl.fn((T) => (T > 0 ? MAT.debyeCv(T, TH[k][0]) : 0), { color: '--grid-2', width: 1 });
      pl.dot(X(p.T), MAT.debyeCv(p.T, th), { color: '--accent' });
      pl.legend([{ label: 'Debye', color: '--accent' }, { label: 'Einstein', color: '--c1', dash: [6, 3] }, { label: 'ley T³', color: '--c3', dash: [3, 3] }], 'br');
      const cvD = MAT.debyeCv(p.T, th);
      sim.set('cv', EM.fix(3 * MAT.R * cvD, 3) + ' J/mol·K (' + EM.fix(cvD, 4) + ' · 3R)');
      sim.set('ce', EM.fix(3 * MAT.R * MAT.einsteinCv(p.T, 0.806 * th), 3) + ' J/mol·K');
      sim.set('cp', EM.fix((3 * MAT.R * cvD) / A, 3) + ' J/g·K a esta T · medido a 300 K: ' + cpm + ' J/g·K');
    });
  });

  /* ======================================================================
     22.2 Bimetal
     ====================================================================== */
  const BM = { invar: ['Invar', 1.6, 141], steel: ['Acero', 12, 200], brass: ['Latón', 19, 100], cu: ['Cobre', 17, 115], al: ['Aluminio', 23.6, 69], ni: ['Níquel', 13, 207] };
  EM.defineSim('bimetal', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('a', { label: 'Capa 1 (baja dilatación)', options: Object.entries(BM).map(([k, v]) => [k, v[0] + ' (' + v[1] + '×10⁻⁶/K)']), value: 'invar' });
    sim.select('b', { label: 'Capa 2', options: Object.entries(BM).map(([k, v]) => [k, v[0] + ' (' + v[1] + '×10⁻⁶/K)']), value: 'brass' });
    sim.slider('m', { label: 'Cociente de espesores t₁/t₂', min: 0.2, max: 5, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('h', { label: 'Espesor total <i>h</i>', min: 0.2, max: 5, step: 0.05, value: 1, unit: 'mm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('L', { label: 'Longitud', min: 10, max: 150, step: 1, value: 50, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('dT', { label: 'Calentamiento Δ<i>T</i>', min: -100, max: 300, step: 1, value: 100, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Curvatura κ', { hl: true });
    sim.out('d', 'Desviación del extremo libre ≈ κ<i>L</i>²/2');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, a1, E1] = BM[p.a], [, a2, E2] = BM[p.b];
      const m = p.m, n = E1 / E2, h = p.h * 1e-3;
      const kap = (6 * (a2 - a1) * 1e-6 * p.dT * (1 + m) ** 2) / (h * (3 * (1 + m) ** 2 + (1 + m * n) * (m * m + 1 / (m * n))));
      const L = p.L * 1e-3, defl = (kap * L * L) / 2;
      /* dibujo exagerado */
      const x0 = W * 0.12, len = W * 0.75, y0 = H * 0.5, ex = Math.min(1, 0.35 / Math.max(1e-9, Math.abs(kap * L))) ;
      const kk = kap * (len / L) / (len / L) * ex; // curvatura escalada
      const t1 = 10 * (m / (1 + m)), t2 = 10 / (1 + m);
      const pts = (off) => { const out = []; for (let i = 0; i <= 60; i++) { const s = (i / 60) * L; const th = kk * s; const R = 1 / (kk || 1e-12); const x = Math.abs(kk) < 1e-9 ? s : R * Math.sin(th); const y = Math.abs(kk) < 1e-9 ? 0 : R * (1 - Math.cos(th)); out.push([x0 + (x / L) * len - off * Math.sin(th), y0 - (y / L) * len * 1 - off * Math.cos(th)]); } return out; };
      const top = pts(t1), mid = pts(0), bot = pts(-t2);
      ctx.fillStyle = EM.alpha('--c1', 0.5); ctx.beginPath(); top.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); mid.slice().reverse().forEach((q) => ctx.lineTo(q[0], q[1])); ctx.fill();
      ctx.fillStyle = EM.alpha('--c4', 0.6); ctx.beginPath(); mid.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); bot.slice().reverse().forEach((q) => ctx.lineTo(q[0], q[1])); ctx.fill();
      EM.draw.support(ctx, x0, y0, 40, 'right');
      EM.text(ctx, BM[p.a][0] + ' (arriba) · ' + BM[p.b][0] + ' (abajo) — curvatura exagerada', W * 0.5, H - 8, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('k', EM.fix(kap, 3) + ' m⁻¹ (radio ' + EM.fix(1 / Math.abs(kap || 1e-12), 3) + ' m)');
      sim.set('d', EM.fix(defl * 1e3, 3) + ' mm' + (kap > 0 ? ' (hacia la capa 1)' : kap < 0 ? ' (hacia la capa 2)' : ''));
    });
  });

  /* ======================================================================
     22.3 Conducción transitoria
     ====================================================================== */
  const HC = { cu: ['Cobre', 398, 8960, 385], al: ['Aluminio', 237, 2700, 900], steel: ['Acero', 50, 7850, 486], ss: ['Inoxidable 304', 16, 8000, 500], glass: ['Vidrio', 1.0, 2500, 840], brick: ['Ladrillo', 0.7, 1900, 840], wood: ['Madera de pino', 0.14, 500, 1700], foam: ['Espuma de poliuretano', 0.025, 40, 1400] };
  EM.defineSim('heat-conduction', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material de la pared', options: Object.entries(HC).map(([k, v]) => [k, v[0] + ' (k = ' + v[1] + ')']), value: 'glass' });
    sim.slider('L', { label: 'Espesor <i>L</i>', min: 1, max: 200, step: 1, value: 10, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('sp', { label: 'Velocidad de la simulación', min: 1, max: 100, step: 1, value: 20, fmt: (v) => v.toFixed(0) + '×' });
    sim.resetButton(() => reset());
    sim.out('t', 'Tiempo transcurrido', { hl: true });
    sim.out('D', 'Difusividad <i>k</i>/ρ<i>c<sub>p</sub></i>');
    sim.out('tau', 'Tiempo característico <i>L</i>²/<i>D</i>');
    sim.out('q', 'Flujo estacionario con ΔT = 80 K');
    const N = 60;
    let T, t;
    const reset = () => { T = new Float64Array(N).fill(20); t = 0; };
    reset();
    sim.onChange = (id) => { if (id === 'm' || id === 'L') reset(); };
    sim.animate((dt) => {
      const [, k, rho, cp] = HC[sim.p.m], D = k / (rho * cp), L = sim.p.L * 1e-3, dx = L / (N - 1);
      const tau = (L * L) / D;
      const simdt = dt * sim.p.sp * tau * 0.02;
      const h = 0.4 * dx * dx / D, steps = Math.min(4000, Math.ceil(simdt / h));
      for (let s = 0; s < steps; s++) T = MAT.fickStep(T, D, dx, simdt / steps, 100, 20);
      t += simdt;
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, k, rho, cp] = HC[p.m], D = k / (rho * cp), L = p.L * 1e-3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: p.L, ymin: 0, ymax: 110, xlabel: 'posición en la pared (mm)', ylabel: 'T (°C)', ml: 50 });
      pl.frame();
      pl.fn((x) => 100 - (80 * x) / p.L, { color: '--grid-2', width: 1.2, dash: [5, 4] });
      pl.xy(Array.from({ length: N }, (_, i) => (i * p.L) / (N - 1)), Array.from(T), { color: '--accent', width: 2.6 });
      pl.label(p.L * 0.02, 104, 'cara caliente 100 °C', { size: 11, color: '--c2' });
      pl.label(p.L * 0.7, 26, 'cara fría 20 °C', { size: 11, color: '--c1' });
      const fmt = (s) => (s < 120 ? EM.fix(s, 1) + ' s' : s < 7200 ? EM.fix(s / 60, 1) + ' min' : EM.fix(s / 3600, 1) + ' h');
      sim.set('t', fmt(t));
      sim.set('D', EM.sci(D, 3) + ' m²/s');
      sim.set('tau', fmt((L * L) / D));
      sim.set('q', EM.si((k * 80) / L, 'W/m²'));
    });
  });

  /* ======================================================================
     22.4 Choque térmico
     ====================================================================== */
  const TS = { soda: ['Vidrio sílice-sosa-cal', 69, 69, 9, 0.23], boro: ['Borosilicato', 69, 64, 3.3, 0.2], silica: ['Sílice fundida', 104, 73, 0.5, 0.17], al2o3: ['Alúmina', 350, 380, 7.4, 0.22], si3n4: ['Nitruro de silicio', 700, 300, 3.3, 0.27], zro2: ['Circonia', 800, 205, 10.5, 0.3] };
  EM.defineSim('thermal-shock', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T0', { label: 'Temperatura inicial de la pieza', min: 50, max: 1200, step: 5, value: 300, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('Tb', { label: 'Temperatura del baño', min: 0, max: 100, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('dT', 'Salto de temperatura', { hl: true });
    sim.out('res', 'Resultado por material');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const keys = Object.keys(TS);
      const vals = keys.map((k) => { const [, sf, E, a, nu] = TS[k]; return MAT.thermalShock(sf * 1e6, E * 1e9, a * 1e-6, nu); });
      const dT = p.T0 - p.Tb;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 5000, ymin: 0, ymax: keys.length, xlog: true, xlabel: 'ΔT_c (K)', yticks: [], ml: 150, mb: 36 });
      pl.frame();
      keys.forEach((k, i) => {
        const y = keys.length - i - 0.5, ok = vals[i] >= dT;
        ctx.fillStyle = EM.alpha(ok ? '--c3' : '--c2', 0.7);
        ctx.fillRect(pl.X(10), pl.Y(y + 0.32), pl.X(vals[i]) - pl.X(10), pl.Y(y - 0.32) - pl.Y(y + 0.32));
        EM.text(ctx, TS[k][0], pl.X(10) - 6, pl.Y(y) + 4, { size: 11, align: 'right', color: '--ink-2' });
        EM.text(ctx, EM.fix(vals[i], 0) + ' K', pl.X(vals[i]) + 4, pl.Y(y) + 4, { size: 10.5, mono: true, color: '--ink-3' });
      });
      pl.vline(dT, { color: '--accent', dash: [], width: 2.4, label: 'ΔT = ' + dT + ' K' });
      sim.set('dT', dT + ' K');
      sim.set('res', keys.map((k, i) => TS[k][0] + (vals[i] >= dT ? ' resiste' : ' se agrieta')).join(' · '));
    });
  });
})();
