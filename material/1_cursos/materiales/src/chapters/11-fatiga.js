/* Capítulo 11 — Fatiga y fluencia lenta */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  /* σ'f (MPa), b, límite de fatiga (MPa, null si no hay), σu (MPa) — valores representativos (Dowling 2013) */
  const SN = { s4340: ['Acero 4340 templado y revenido', 1758, -0.0977, 560, 1470], s1045: ['Acero 1045 normalizado', 1225, -0.095, 310, 725], al7075: ['Aluminio 7075-T6', 1466, -0.143, null, 570], al2024: ['Aluminio 2024-T3', 900, -0.102, null, 485], ti: ['Ti-6Al-4V', 2030, -0.104, 510, 1000] };
  const gaussR = (k, s) => { const u = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453, v = Math.sin(k * 4.1414 + s * 9.37) * 24634.6345; const a = u - Math.floor(u), b = v - Math.floor(v); return Math.sqrt(-2 * Math.log(Math.max(1e-12, a))) * Math.cos(2 * Math.PI * b); };

  /* ======================================================================
     11.1 Curva S–N
     ====================================================================== */
  EM.defineSim('sn-curve', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('m', { label: 'Material', options: Object.entries(SN).map(([k, v]) => [k, v[0]]), value: 's4340' });
    sim.slider('sa', { label: 'Amplitud σ<sub>a</sub>', min: 100, max: 1200, step: 5, value: 650, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sd', { label: 'Dispersión de la vida (desv. estándar de log N)', min: 0, max: 0.6, step: 0.02, value: 0.25, fmt: (v) => EM.fix(v, 2) + ' déc.' });
    sim.button('Ensayar 12 probetas', () => { seed++; sim.redraw(); });
    sim.out('N', 'Vida media <i>N<sub>f</sub></i>', { hl: true });
    sim.out('se', 'Límite (o resistencia a 10⁷ ciclos)');
    sim.out('ratio', 'σ<sub>e</sub>/σ<sub>u</sub>');
    let seed = 3;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, sf, b, se, su] = SN[p.m];
      const life = (s) => (se && s <= se ? Infinity : MAT.basquinN(s, sf, b));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e3, xmax: 1e9, ymin: 0, ymax: 1300, xlog: true, xlabel: 'ciclos a la falla N_f', ylabel: 'amplitud σ_a (MPa)', ml: 54 });
      pl.frame();
      pl.fn((N) => { const s = sf * Math.pow(2 * N, b); return se ? Math.max(se, s) : s; }, { color: '--accent', width: 2.6 });
      pl.hline(su, { color: '--ink-3', label: 'σ_u' });
      if (se) pl.hline(se, { color: '--c3', label: 'límite de fatiga', labelRight: true });
      /* probetas */
      for (let k = 0; k < 12; k++) {
        const s = p.sa * (0.75 + 0.05 * (k % 6));
        const N0 = life(s);
        if (!isFinite(N0)) { pl.dot(1e9 * 0.8, s, { color: '--c3', r: 4 }); continue; }
        const N = N0 * Math.pow(10, p.sd * gaussR(k + 1, seed));
        pl.dot(Math.min(N, 9e8), s, { color: N > 9e8 ? '--c3' : '--c1', r: 4 });
      }
      const N = life(p.sa);
      if (isFinite(N)) pl.dot(N, p.sa, { color: '--accent', r: 6 });
      pl.legend([{ label: 'curva media (Basquin)', color: '--accent' }, { label: 'probeta rota', color: '--c1', kind: 'dot' }, { label: 'sin falla (runout)', color: '--c3', kind: 'dot' }], 'tr');
      const s7 = se || sf * Math.pow(2e7, b);
      sim.set('N', isFinite(N) ? EM.sci(N, 2) + ' ciclos' : 'infinita (bajo el límite)');
      sim.set('se', EM.fix(s7, 0) + ' MPa' + (se ? '' : ' (sin límite: valor a 10⁷)'));
      sim.set('ratio', EM.fix(s7 / su, 2));
    });
  });

  /* ======================================================================
     11.2 Diagrama de Haigh
     ====================================================================== */
  EM.defineSim('goodman', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('su', { label: 'Resistencia a la tracción σ<sub>u</sub>', min: 300, max: 1600, step: 10, value: 725, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sy', { label: 'Límite elástico σ<sub>y</sub>', min: 200, max: 1500, step: 10, value: 450, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('se', { label: 'Límite de fatiga σ<sub>e</sub>', min: 100, max: 800, step: 5, value: 310, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sm', { label: 'Esfuerzo medio σ<sub>m</sub>', min: -300, max: 700, step: 5, value: 150, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sa', { label: 'Amplitud σ<sub>a</sub>', min: 0, max: 600, step: 5, value: 150, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.out('ng', 'Factor de seguridad (Goodman)', { hl: true });
    sim.out('nge', 'Factor (Gerber)');
    sim.out('ns', 'Factor (Soderberg)');
    sim.out('ar', 'Amplitud equivalente invertida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -300, xmax: 1700, ymin: 0, ymax: Math.max(900, p.se * 1.4), xlabel: 'esfuerzo medio σ_m (MPa)', ylabel: 'amplitud σ_a (MPa)', ml: 54 });
      pl.frame();
      pl.xy([0, p.su], [p.se, 0], { color: '--accent', width: 2.4 });
      pl.fn((m) => (m >= 0 && m <= p.su ? p.se * (1 - (m / p.su) ** 2) : NaN), { color: '--c1', width: 1.6, dash: [6, 3] });
      pl.xy([0, p.sy], [p.se, 0], { color: '--c5', width: 1.6, dash: [3, 3] });
      pl.xy([0, p.sy], [p.sy, 0], { color: '--ink-3', width: 1.2 });
      pl.xy([-300, 0], [p.se, p.se], { color: '--accent', width: 1.2, dash: [2, 3] });
      pl.dot(p.sm, p.sa, { color: '--c2', r: 6, label: 'operación' });
      pl.legend([{ label: 'Goodman', color: '--accent' }, { label: 'Gerber', color: '--c1', dash: [6, 3] }, { label: 'Soderberg', color: '--c5', dash: [3, 3] }, { label: 'fluencia (Langer)', color: '--ink-3' }], 'tr');
      const sm = Math.max(0, p.sm);
      const ng = 1 / (p.sa / p.se + sm / p.su);
      const ns = 1 / (p.sa / p.se + sm / p.sy);
      /* Gerber: n σa/σe + (n σm/σu)² = 1 */
      const A = (sm / p.su) ** 2, B = p.sa / p.se;
      const nge = A > 1e-12 ? (-B + Math.sqrt(B * B + 4 * A)) / (2 * A) : 1 / B;
      sim.set('ng', EM.fix(ng, 2) + (ng < 1 ? ' — falla' : ''));
      sim.set('nge', EM.fix(nge, 2));
      sim.set('ns', EM.fix(ns, 2));
      sim.set('ar', p.sm < p.su ? EM.fix(MAT.goodman(p.sa, sm, p.su), 0) + ' MPa' : '—');
    });
  });

  /* ======================================================================
     11.3 Ley de Paris
     ====================================================================== */
  EM.defineSim('paris', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('ds', { label: 'Rango de esfuerzo Δσ', min: 50, max: 400, step: 5, value: 200, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('a0', { label: 'Grieta inicial <i>a</i><sub>0</sub>', min: 0.05, max: 3, step: 0.01, value: 0.25, unit: 'mm', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('Kc', { label: 'Tenacidad <i>K<sub>Ic</sub></i>', min: 10, max: 150, step: 1, value: 25, unit: 'MPa√m', fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Exponente <i>m</i>', min: 2.2, max: 4.5, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.slider('lc', { label: 'log₁₀ <i>C</i> (m/ciclo, ΔK en MPa√m)', min: -13, max: -10, step: 0.1, value: -12, fmt: (v) => EM.fix(v, 1) });
    sim.out('ac', 'Grieta crítica <i>a<sub>c</sub></i>');
    sim.out('N', 'Vida <i>N<sub>f</sub></i>', { hl: true });
    sim.out('half', 'Ciclos con la grieta por debajo de 2<i>a</i><sub>0</sub>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const C = Math.pow(10, p.lc), Y = 1, a0 = p.a0 * 1e-3;
      const ac = MAT.critCrack(p.Kc, Y, p.ds);
      if (ac <= a0) { EM.text(ctx, 'La grieta inicial ya es crítica: falla al primer ciclo.', W / 2, H / 2, { size: 14, align: 'center', color: '--c2' }); sim.set('ac', EM.fix(ac * 1e3, 2) + ' mm'); sim.set('N', '0'); sim.set('half', '—'); return; }
      const Nf = MAT.parisN(C, p.m, Y, p.ds, a0, ac);
      const N2 = MAT.parisN(C, p.m, Y, p.ds, a0, Math.min(ac, 2 * a0));
      /* a(N) */
      const as = M.linspace(Math.log(a0), Math.log(ac), 120).map(Math.exp);
      const Ns = as.map((a) => MAT.parisN(C, p.m, Y, p.ds, a0, a));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: Nf * 1.05, ymin: 0, ymax: ac * 1e3 * 1.1, xlabel: 'ciclos N', ylabel: 'semilongitud a (mm)', ml: 50 });
      pl.frame();
      pl.xy(Ns, as.map((a) => a * 1e3), { color: '--accent', width: 2.6 });
      pl.hline(ac * 1e3, { color: '--c2', label: 'a_c' });
      pl.vline(N2, { color: '--ink-3', label: '2a₀' });
      /* da/dN contra ΔK */
      const pr = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 1, xmax: 200, ymin: 1e-11, ymax: 1e-4, xlog: true, ylog: true, xlabel: 'ΔK (MPa√m)', ylabel: 'da/dN (m/ciclo)', ml: 56 });
      pr.frame();
      const dK0 = Y * p.ds * Math.sqrt(Math.PI * a0), dK1 = p.Kc;
      pr.fn((dk) => (dk >= dK0 && dk <= dK1 ? C * Math.pow(dk, p.m) : NaN), { color: '--accent', width: 2.6 });
      pr.fn((dk) => C * Math.pow(dk, p.m), { color: '--grid-2', width: 1, dash: [3, 3] });
      pr.vline(dK1, { color: '--c2', label: 'K_Ic' });
      sim.set('ac', EM.fix(ac * 1e3, 2) + ' mm');
      sim.set('N', EM.sci(Nf, 3) + ' ciclos');
      sim.set('half', EM.fix((100 * N2) / Nf, 0) + ' % de la vida');
    });
  });

  /* ======================================================================
     11.4 Fluencia lenta
     ====================================================================== */
  EM.defineSim('creep', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('s', { label: 'Esfuerzo σ', min: 50, max: 300, step: 5, value: 140, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 600, max: 900, step: 5, value: 800, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Exponente de Norton <i>n</i>', min: 1, max: 8, step: 0.1, value: 5, fmt: (v) => EM.fix(v, 1) });
    sim.out('rate', 'Velocidad estacionaria ε̇<sub>s</sub>', { hl: true });
    sim.out('tr', 'Tiempo de rotura (Monkman–Grant)');
    sim.out('lmp', 'Parámetro de Larson–Miller');
    sim.note('Ley de Norton con Q = 300 kJ/mol y A ajustado para que 140 MPa a 800 °C rompa en 233 h (ejemplo S-590 de Callister); la regla de Monkman–Grant ε̇ₛ·t_r ≈ 0.05 da el tiempo de rotura.');
    const Q = 300e3, s0 = 140, T0 = 1073.15, tr0 = 233;
    const rate = (s, T, n) => (0.05 / (tr0 * 3600)) * Math.pow(s / s0, n) * Math.exp((-Q / MAT.R) * (1 / T - 1 / T0));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const T = p.T + 273.15, es = rate(p.s, T, p.n), tr = 0.05 / es / 3600;
      /* curva ε(t): primaria + secundaria + terciaria */
      const e0 = (p.s * 1e6) / 180e9, ep = 0.006;
      const eps = (th) => { const t = th * 3600; const x = th / tr; return e0 + ep * (1 - Math.exp(-x * 25)) + es * t + 0.04 * Math.pow(Math.max(0, x - 0.55) / 0.45, 3); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: tr * 1.05, ymin: 0, ymax: 0.12, xlabel: 'tiempo (h)', ylabel: 'deformación ε', ml: 50 });
      pl.frame();
      pl.fn((t) => (t <= tr ? eps(t) : NaN), { color: '--accent', width: 2.6 });
      pl.dot(tr, eps(tr), { color: '--c2', label: 'rotura' });
      pl.label(tr * 0.04, 0.105, 'primaria', { size: 10.5, color: '--ink-3' });
      pl.label(tr * 0.35, 0.105, 'secundaria', { size: 10.5, color: '--ink-3' });
      pl.label(tr * 0.78, 0.105, 'terciaria', { size: 10.5, color: '--ink-3' });
      const pr = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 30, xmax: 400, ymin: 1e-12, ymax: 1e-4, xlog: true, ylog: true, xlabel: 'σ (MPa)', ylabel: 'ε̇_s (1/s)', ml: 56 });
      pr.frame();
      for (const Tc of [650, 750, 850]) pr.fn((s) => rate(s, Tc + 273.15, p.n), { color: '--grid-2', width: 1.2 });
      pr.fn((s) => rate(s, T, p.n), { color: '--accent', width: 2.4 });
      pr.dot(p.s, es, { color: '--accent' });
      sim.set('rate', EM.sci(es, 2) + ' s⁻¹ = ' + EM.sci(es * 3600 * 100, 2) + ' %/h');
      sim.set('tr', tr < 1e5 ? EM.fix(tr, tr < 10 ? 2 : 0) + ' h' : EM.sci(tr, 2) + ' h');
      sim.set('lmp', EM.fix(MAT.lmp(T, tr), 0));
    });
  });
})();
