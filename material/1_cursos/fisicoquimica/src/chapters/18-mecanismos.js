/* Capítulo 18 — Mecanismos de reacción */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, K = FQ.kin, R = FQ.R;
  let MECH = null;
  const mech = () => (MECH = MECH || K.mechBuild(DAT.h2o2));

  /* 18.1 Pre-equilibrio y estado estacionario frente a la integración exacta */
  EM.defineSim('ssa-preeq', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('km1', { label: 'k₋₁ (I → A + B)', min: 0.01, max: 1000, step: 0.01, value: 100, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('k2', { label: 'k₂ (I → P)', min: 0.01, max: 1000, step: 0.01, value: 1, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('r', 'Cociente <i>k</i><sub>2</sub>/<i>k</i><sub>−1</sub> · régimen', { hl: true });
    sim.out('ke', 'k efectiva: SSA = k₁k₂/(k₋₁ + k₂) · pre-equilibrio = (k₁/k₋₁)k₂');
    sim.out('er', 'Error de [P] en <i>t</i> = 3 respecto de la integración exacta: SSA · pre-equilibrio');
    const k1 = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, km1 = p.km1, k2 = p.k2;
      EM.draw.clear(cv);
      const f = (t, y) => [-k1 * y[0] * y[1] + km1 * y[2], -k1 * y[0] * y[1] + km1 * y[2], k1 * y[0] * y[1] - (km1 + k2) * y[2], k2 * y[2]];
      const tm = 12, ts = []; for (let i = 0; i <= 120; i++) ts.push((tm * i) / 120);
      const ex = FQ.odeStiff(f, [1, 1, 0, 0], ts, { rtol: 1e-9, atol: 1e-12 }), P = ex.y.map((y) => y[3]);
      const kS = (k1 * k2) / (km1 + k2), kP = (k1 / km1) * k2;
      const g = (kk) => (t, y) => [-kk * y[0] * y[1], -kk * y[0] * y[1], kk * y[0] * y[1]];
      const sS = FQ.ode(g(kS), [1, 1, 0], ts, { rtol: 1e-9 }), sP = FQ.ode(g(kP), [1, 1, 0], ts, { rtol: 1e-9 });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tm, ymin: 0, ymax: 1, xlabel: 't', ylabel: '[P]', ml: 46 });
      pl.frame();
      pl.xy(ts, P, { color: '--ink', width: 2.8 }); pl.xy(ts, sS.y.map((y) => y[2]), { color: '--c1', width: 2, dash: [6, 4] }); pl.xy(ts, sP.y.map((y) => y[2]), { color: '--c2', width: 2, dash: [2, 4] });
      pl.legend([{ label: 'integración exacta', color: '--ink', width: 2.8 }, { label: 'estado estacionario (SSA)', color: '--c1', dash: [6, 4] }, { label: 'pre-equilibrio', color: '--c2', dash: [2, 4] }], 'br');
      const i3 = ts.findIndex((t) => t >= 3), ex3 = P[i3];
      const e1 = (sS.y[i3][2] - ex3) / Math.max(ex3, 1e-12), e2 = (sP.y[i3][2] - ex3) / Math.max(ex3, 1e-12);
      sim.set('r', EM.sci(k2 / km1, 2) + ' · ' + (k2 / km1 < 0.1 ? 'k₂ ≪ k₋₁: el pre-equilibrio es excelente' : k2 / km1 > 10 ? 'k₂ ≫ k₋₁: I no vuelve; la velocidad es k₁[A][B] (etapa 1 limitante)' : 'intermedio: solo SSA es válido'));
      sim.set('ke', EM.sci(kS, 3) + ' · ' + EM.sci(kP, 3));
      sim.set('er', EM.fix(100 * e1, 1) + ' % · ' + EM.fix(100 * e2, 1) + ' %');
    });
  });

  /* 18.2 Caída de presión de una reacción unimolecular: Lindemann y Troe (H₂O₂ → 2 OH) */
  EM.defineSim('lindemann', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('T', { label: 'Temperatura', min: 600, max: 1500, step: 10, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión (de gas inerte; lectura)', min: 1e-4, max: 1e4, step: 1e-4, value: 1, unit: 'atm', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('k', 'k<sub>uni</sub> de H₂O₂ → 2 OH: Troe · Lindemann', { hl: true });
    sim.out('lim', 'Límites: <i>k</i><sub>0</sub>[M] (baja presión) · <i>k</i><sub>∞</sub> (alta presión)');
    sim.out('p12', 'Presión de caída <i>P</i><sub>1/2</sub> (donde <i>k</i><sub>Lind</sub> = <i>k</i><sub>∞</sub>/2)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = mech(), j = m.rx.findIndex((q) => q.r.t === 'fo'), T = p.T;
      EM.draw.clear(cv);
      const M = (Patm) => (Patm * 101325) / (8314.462618 * T); /* kmol/m³ */
      const Kc = m.Kc(T, j), kuni = (Patm) => { const f = m.falloff(j, T, M(Patm)); return [f.k / Kc, f.kLind / Kc, f.k0 * M(Patm) / Kc, f.kinf / Kc]; };
      const Ps = [], A = [], B = [], L0 = [], Li = [];
      for (let e = -4; e <= 4.001; e += 0.1) { const P = Math.pow(10, e), r = kuni(P); Ps.push(P); A.push(r[0]); B.push(r[1]); L0.push(r[2]); Li.push(r[3]); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-4, xmax: 1e4, ymin: Math.min(...A) / 3, ymax: Math.max(...Li) * 3, xlog: true, ylog: true, xlabel: 'P (atm)', ylabel: 'k_uni (s⁻¹)', ml: 56 });
      pl.frame();
      pl.xy(Ps, L0, { color: '--ink-3', width: 1.2, dash: [4, 4] }); pl.xy(Ps, Li, { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.xy(Ps, B, { color: '--c1', width: 2, dash: [6, 4] }); pl.xy(Ps, A, { color: '--c2', width: 2.8 });
      pl.vline(p.P, { color: '--accent' }); pl.dot(p.P, kuni(p.P)[0], { color: '--accent' });
      pl.legend([{ label: 'Troe (mecanismo real)', color: '--c2' }, { label: 'Lindemann (F = 1)', color: '--c1', dash: [6, 4] }, { label: 'límites k₀[M] y k∞', color: '--ink-3', dash: [4, 4] }], 'tl');
      const r = kuni(p.P);
      /* P_1/2: Pr = 1, es decir [M] = k∞/k₀ */
      const f0 = m.falloff(j, T, 1), Ph = ((f0.kinf / f0.k0) * 8314.462618 * T) / 101325;
      sim.set('k', EM.sci(r[0], 3) + ' s⁻¹ · ' + EM.sci(r[1], 3) + ' s⁻¹ (F de Troe = ' + EM.fix(m.falloff(j, T, M(p.P)).F, 3) + ')');
      sim.set('lim', EM.sci(r[2], 3) + ' s⁻¹ · ' + EM.sci(r[3], 3) + ' s⁻¹');
      sim.set('p12', EM.sci(Ph, 3) + ' atm');
    });
  });

  /* 18.3 Cadena de ramificación H₂–O₂ */
  const MIX = { st: ['H₂ + aire (estequiométrica)', { H2: 2, O2: 1, N2: 3.76 }], ar: ['H₂ + O₂ diluidos en argón', { H2: 2, O2: 1, AR: 7 }], rich: ['Mezcla rica (H₂ : O₂ = 4 : 1, en N₂)', { H2: 4, O2: 1, N2: 3.76 }] };
  EM.defineSim('h2o2-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 1.65 });
    sim.select('mix', { label: 'Mezcla inicial', options: Object.entries(MIX).map(([k, v]) => [k, v[0]]), value: 'st' });
    sim.slider('T', { label: 'Temperatura (fija)', min: 800, max: 1300, step: 5, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión inicial', min: 0.01, max: 10, step: 0.01, value: 1, unit: 'atm', log: true, fmt: (v) => (v < 1 ? v.toFixed(3) : v.toFixed(2)) });
    sim.out('ind', 'Tiempo de inducción (el H₂O llega a 1 % de fracción molar)', { hl: true });
    sim.out('t50', 'Tiempo para consumir la mitad del H₂');
    sim.out('rad', 'Máximo de la reserva de radicales (H + O + OH)');
    sim.out('r', 'Régimen');
    const SPS = ['H2', 'O2', 'H2O', 'H', 'OH', 'O', 'HO2', 'H2O2'], COL = ['--c1', '--c4', '--c3', '--c2', '--c5', '--c6', '--gold', '--ink-3'], NM = ['H₂', 'O₂', 'H₂O', 'H', 'OH', 'O', 'HO₂', 'H₂O₂'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = mech(), X = MIX[p.mix][1], tmax = 1;
      EM.draw.clear(cv);
      const times = [0]; for (let k = 0; k <= 70; k++) times.push(Math.pow(10, -8 + (8 * k) / 70));
      const r = K.mechRun(m, p.T, p.P * 101325, X, times, 1e-6);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-7, xmax: tmax, ymin: 1e-9, ymax: 1, xlog: true, ylog: true, xlabel: 't (s)', ylabel: 'fracción molar', ml: 56 });
      pl.frame();
      SPS.forEach((s, i) => pl.xy(times.slice(1), r.X.slice(1).map((x) => Math.max(x[s], 1e-12)), { color: COL[i], width: i < 3 ? 2.6 : 1.8, dash: i >= 3 ? [5, 3] : null }));
      pl.legend(SPS.map((s, i) => ({ label: NM[i], color: COL[i] })), 'bl');
      const idx = (cond) => { for (let k = 1; k < times.length; k++) if (cond(r.X[k])) return times[k]; return null; };
      const tind = idx((x) => x.H2O >= 0.01), x0 = r.X[0].H2, t50 = idx((x) => x.H2 <= 0.5 * x0);
      let rm = 0; r.X.forEach((x) => { rm = Math.max(rm, x.H + x.O + x.OH); });
      sim.set('ind', tind ? EM.sci(tind, 2) + ' s' : '> 1 s: la reacción no se dispara');
      sim.set('t50', t50 ? EM.sci(t50, 2) + ' s' : '> 1 s');
      sim.set('rad', EM.sci(rm, 2) + ' (fracción molar)');
      sim.set('r', rm > 1e-3 ? 'ramificación en cadena: los radicales crecen exponencialmente y la mezcla «explota»' : 'terminación domina (HO₂ poco reactivo): la reserva de radicales queda baja y la combustión es lenta, sin explosión');
    });
  });

  /* Presión en que la ramificación H + O₂ → O + OH (2 radicales netos por ciclo) iguala a la terminación H + O₂ + M → HO₂ + M */
  const critP = (T) => K.critP(mech(), T, { H2: 2, O2: 1, N2: 3.76 });

  /* 18.4 Límite de explosión: tiempo de consumo de la mitad del H₂ frente a la presión */
  EM.defineSim('limite-explosion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('T', { label: 'Temperatura (isoterma)', options: [[800, '800 K (527 °C)'], [850, '850 K (577 °C)'], [900, '900 K (627 °C)'], [1000, '1000 K (727 °C)']], value: 900 });
    sim.button('Calcular la curva (≈ 10 s)', () => run(), { primary: true });
    sim.out('st', 'Estado', { hl: true });
    sim.out('lim', 'Presión del segundo límite de explosión (donde <i>t</i><sub>50</sub> salta)');
    sim.out('crit', 'Presión que cumple el criterio de la cadena, 2<i>k</i><sub>H+O₂→O+OH</sub> = <i>k</i><sub>H+O₂+M→HO₂+M</sub>[M]');
    const cache = {}; let busy = false;
    const PS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 2, 5, 10];
    const run = () => {
      if (busy) return; const T = +sim.p.T; if (cache[T]) { sim.redraw(); return; }
      busy = true; cache[T] = []; sim.set('st', 'calculando…');
      let k = 0;
      const step = () => { if (k >= PS.length) { busy = false; sim.set('st', 'listo'); sim.redraw(); return; } const t = K.mechTime(mech(), T, PS[k] * 101325, { H2: 2, O2: 1, N2: 3.76 }, 'H2', 0.5, 5); cache[T].push([PS[k], t]); k++; sim.redraw(); setTimeout(step, 0); };
      setTimeout(step, 20);
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, d = cache[+p.T] || [];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.01, xmax: 10, ymin: 1e-4, ymax: 100, xlog: true, ylog: true, xlabel: 'presión inicial (atm)', ylabel: 't₅₀ (s), tope = 5 s', ml: 56 });
      pl.frame();
      if (d.length) { pl.xy(d.map((q) => q[0]), d.map((q) => (isFinite(q[1]) ? q[1] : 5)), { color: '--c1', width: 2.6 }); d.forEach((q) => pl.dot(q[0], isFinite(q[1]) ? q[1] : 5, { color: isFinite(q[1]) ? '--c1' : '--c2', r: 4 })); }
      else EM.text(ctx, 'Pulse «Calcular la curva» para integrar el mecanismo a cada presión', pl.ix + pl.iw / 2, pl.iy + pl.ih / 2, { size: 13, align: 'center', color: '--ink-3' });
      const Pc = critP(+p.T); pl.vline(Pc, { color: '--accent', dash: [5, 4], label: '2k₁ = k₅[M]' });
      sim.set('crit', EM.sci(Pc, 3) + ' atm (H₂ + aire; sin pared ni efectos térmicos)');
      pl.legend([{ label: 't₅₀ (consumo de la mitad del H₂)', color: '--c1' }, { label: 'sin consumo en 5 s', color: '--c2', kind: 'dot' }], 'tr');
      if (d.length > 3) {
        let jump = null; for (let i = 1; i < d.length; i++) { const a = isFinite(d[i - 1][1]) ? d[i - 1][1] : 5, b = isFinite(d[i][1]) ? d[i][1] : 5; if (b / a > 30 && !jump) jump = [d[i - 1][0], d[i][0]]; }
        sim.set('lim', jump ? 'entre ' + jump[0] + ' y ' + jump[1] + ' atm' : 'no se observa en este intervalo');
      } else sim.set('lim', '—');
    });
    sim.set('st', 'sin calcular');
  });
})();
