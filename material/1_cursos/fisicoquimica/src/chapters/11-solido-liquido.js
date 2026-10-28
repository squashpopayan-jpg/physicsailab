/* Capítulo 11 — Equilibrio sólido–líquido: eutécticos, binarios y ternarios */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R;

  /* Datos de fusión (CRC): [T_f (K), ΔH_fus (J/mol)] y eutéctico experimental cuando se conoce */
  const SYS = {
    bicd: { n: 'Bismuto – cadmio', A: ['Bi', 544.55, 11300], B: ['Cd', 594.22, 6190], exp: null },
    pbsn: { n: 'Plomo – estaño', A: ['Pb', 600.61, 4770], B: ['Sn', 505.08, 7030], exp: [456.2, 0.739, 'Sn'] },
    nafbi: { n: 'Naftaleno – bifenilo', A: ['naftaleno', 353.35, 18800], B: ['bifenilo', 342.4, 18580], exp: null }
  };
  /* Líquidus ideal (Schröder–van Laar): fracción molar del componente que cristaliza a T */
  const xliq = (c, T) => Math.min(1, Math.exp(-(c[2] / R) * (1 / T - 1 / c[1])));
  const eut = (s) => { let lo = 150, hi = Math.min(s.A[1], s.B[1]); for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (xliq(s.A, m) + xliq(s.B, m) > 1) hi = m; else lo = m; } const T = (lo + hi) / 2; return { T, xA: xliq(s.A, T), xB: xliq(s.B, T) }; };

  /* 11.1 Diagrama de fases binario eutéctico */
  EM.defineSim('eutectico', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('s', { label: 'Sistema', options: Object.entries(SYS).map(([k, v]) => [k, v.n]), value: 'bicd' });
    sim.slider('z', { label: 'Composición global z (fracción molar de B)', min: 0.02, max: 0.98, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 650, step: 1, value: 450, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('ex', { label: 'Mostrar el eutéctico experimental', value: true });
    sim.out('ph', 'Fases presentes', { hl: true });
    sim.out('f', 'Fracciones (regla de la palanca)');
    sim.out('E', 'Eutéctico ideal: <i>T</i> · composición');
    sim.out('X', 'Eutéctico experimental · desviación');
    sim.onChange = (id) => { if (id === 's') { const s = SYS[sim.p.s]; sim.ctl.T.range(Math.round(eut(s).T - 70), Math.round(Math.max(s.A[1], s.B[1]) + 40), 1); sim.ctl.T.set(Math.round((eut(s).T + Math.max(s.A[1], s.B[1])) / 2), true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, s = SYS[p.s], E = eut(s), z = p.z, T = p.T;
      EM.draw.clear(cv);
      const Tmax = Math.max(s.A[1], s.B[1]) + 40, Tmin = E.T - 70;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: Tmin, ymax: Tmax, xlabel: 'fracción molar de ' + s.B[0], ylabel: 'T (K)', ml: 54 });
      pl.frame();
      /* líquidus: rama de A (cristaliza A) para x_B < xB_E ; rama de B para x_B > xB_E */
      const ta = [], xa = [], tb = [], xb = [];
      for (let t = E.T; t <= s.A[1] + 0.01; t += 0.5) { ta.push(t); xa.push(1 - xliq(s.A, t)); }
      for (let t = E.T; t <= s.B[1] + 0.01; t += 0.5) { tb.push(t); xb.push(xliq(s.B, t)); }
      pl.xy(xa, ta, { color: '--c1', width: 2.6 }); pl.xy(xb, tb, { color: '--c2', width: 2.6 });
      pl.path([[0, E.T], [1, E.T]], { color: '--ink-2', width: 1.6, dash: [6, 4] });
      pl.dot(E.xB, E.T, { color: '--c3', r: 5.5, label: 'eutéctico ideal', dx: 8, dy: 16 });
      if (p.ex && s.exp) pl.dot(s.exp[1], s.exp[0], { color: '--c4', r: 5.5, label: 'experimento', dx: 8, dy: -10 });
      /* fase en (z, T) */
      const xBeut = E.xB, Tliq = z < xBeut ? s.A[1] * 0 + (() => { return FQ.bisect((t) => 1 - xliq(s.A, t) - z, E.T, s.A[1] + 1, 1e-9); })() : FQ.bisect((t) => xliq(s.B, t) - z, E.T, s.B[1] + 1, 1e-9);
      let ph, fr;
      if (T >= Tliq) { ph = 'líquido (una fase)'; fr = '100 % líquido'; }
      else if (T > E.T) {
        const A_first = z < xBeut, xl = A_first ? 1 - xliq(s.A, T) : xliq(s.B, T), sol = A_first ? 0 : 1;
        const fl = A_first ? (z - sol) / (xl - sol) : (sol - z) / (sol - xl);
        ph = 'sólido ' + (A_first ? s.A[0] : s.B[0]) + ' + líquido'; fr = EM.fix(100 * fl, 1) + ' % líquido (x_B = ' + EM.fix(xl, 3) + ') · ' + EM.fix(100 * (1 - fl), 1) + ' % sólido';
        pl.path([[sol, T], [xl, T]], { color: '--accent', width: 2.4 }); pl.dot(xl, T, { color: '--accent', r: 4 });
      } else {
        const fE = z < xBeut ? z / xBeut : (1 - z) / (1 - xBeut);
        ph = 'dos sólidos (' + s.A[0] + ' y ' + s.B[0] + ')'; fr = 'por debajo del eutéctico todo es sólido: ' + EM.fix(100 * (1 - z), 1) + ' % ' + s.A[0] + ' · ' + EM.fix(100 * z, 1) + ' % ' + s.B[0];
      }
      pl.vline(z, { color: '--accent', alpha: 0.45, width: 1 }); pl.dot(z, T, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'líquidus de ' + s.A[0], color: '--c1' }, { label: 'líquidus de ' + s.B[0], color: '--c2' }, { label: 'eutéctico ideal', color: '--ink-2', dash: [6, 4] }], 'tr');
      sim.set('ph', ph); sim.set('f', fr);
      sim.set('E', EM.fix(E.T, 1) + ' K (' + EM.fix(E.T - 273.15, 1) + ' °C) · x_' + s.B[0] + ' = ' + EM.fix(E.xB, 3));
      sim.set('X', s.exp ? EM.fix(s.exp[0], 1) + ' K, x_' + s.exp[2] + ' = ' + EM.fix(s.exp[1], 3) + ' · ΔT = ' + EM.fix(s.exp[0] - E.T, 0) + ' K' : '—');
    });
  });

  /* 11.2 Curva de enfriamiento */
  EM.defineSim('enfriamiento', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('s', { label: 'Sistema (líquido ideal, sin solubilidad sólida)', options: Object.entries(SYS).map(([k, v]) => [k, v.n]), value: 'bicd' });
    sim.slider('z', { label: 'Composición de B', min: 0.02, max: 0.98, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.out('Tl', 'Temperatura de líquidus (primer quiebre) · eutéctica (meseta)', { hl: true });
    sim.out('t', 'Duración de la meseta eutéctica respecto del tiempo total de enfriamiento');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, s = SYS[p.s], E = eut(s), z = p.z, cp = 30, qd = 1;
      EM.draw.clear(cv);
      const Af = z < E.xB, prim = Af ? s.A : s.B, L1 = prim[2];
      const Tliq = Af ? FQ.bisect((t) => 1 - xliq(s.A, t) - z, E.T, s.A[1] + 1, 1e-9) : FQ.bisect((t) => xliq(s.B, t) - z, E.T, s.B[1] + 1, 1e-9);
      /* moles de sólido primario por mol de mezcla a T (T entre T_E y T_liquidus) */
      const ns = (T) => { if (T >= Tliq) return 0; return Af ? 1 - z / (1 - xliq(s.A, T)) : 1 - (1 - z) / (1 - xliq(s.B, T)); };
      const nlE = 1 - ns(E.T), Lmix = E.xB * s.B[2] + (1 - E.xB) * s.A[2];
      const T0 = Tliq + 40, H = (T) => cp * T - ns(T) * L1;
      const ts = [], Ts = []; let t = 0;
      for (let T = T0; T >= E.T; T -= 0.1) { ts.push((H(T0) - H(T)) / qd); Ts.push(T); }
      const tTop = ts[ts.length - 1], tPlat = (nlE * Lmix) / qd;
      ts.push(tTop + tPlat); Ts.push(E.T);
      for (let T = E.T - 0.1; T >= E.T - 40; T -= 0.1) { ts.push(tTop + tPlat + (cp * (E.T - T)) / qd); Ts.push(T); }
      const tmax = ts[ts.length - 1];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax * 1.02, ymin: E.T - 40, ymax: T0 + 5, xlabel: 'tiempo (unidades arbitrarias; extracción de calor constante)', ylabel: 'T (K)', ml: 52 });
      pl.frame();
      pl.xy(ts, Ts, { color: '--c1', width: 2.6 });
      pl.hline(E.T, { color: '--ink-3', label: 'T eutéctica', dash: [5, 4] }); pl.hline(Tliq, { color: '--ink-3', label: 'T líquidus', dash: [5, 4] });
      sim.set('Tl', EM.fix(Tliq, 1) + ' K · ' + EM.fix(E.T, 1) + ' K');
      sim.set('t', EM.fix((100 * tPlat) / tmax, 0) + ' % (la meseta es máxima en la composición eutéctica x_B = ' + EM.fix(E.xB, 2) + ' y desaparece en los componentes puros)');
    });
  });

  /* 11.3 Hielo y sal: diagrama agua–NaCl */
  const NSOL = [[-21.1, 23.3], [-10, 24.5], [0, 26.3], [25, 26.5], [60, 27.1], [100, 28.2]]; /* solubilidad NaCl·2H₂O/NaCl, % en masa (CRC) */
  EM.defineSim('sal-hielo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('w', { label: 'Contenido de NaCl', min: 0, max: 30, step: 0.1, value: 10, unit: '% en masa', fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura', min: -30, max: 30, step: 0.1, value: -8, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('ph', 'Fases presentes', { hl: true });
    sim.out('f', 'Salmuera líquida · hielo (o sal) por la regla de la palanca');
    sim.out('Tf', 'Punto de congelación de esta disolución');
    const m = (w) => (w * 10) / 58.44 / (1 - w / 100);
    const Tice = (w) => FQ.freezeT(FQ.pitzerNaCl(Math.max(m(w), 1e-9)).aw) - 273.15;
    const wsal = (T) => { const a = NSOL; if (T <= a[0][0]) return a[0][1]; for (let i = 1; i < a.length; i++) if (T <= a[i][0]) return a[i - 1][1] + ((a[i][1] - a[i - 1][1]) * (T - a[i - 1][0])) / (a[i][0] - a[i - 1][0]); return a[a.length - 1][1]; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 30, ymin: -30, ymax: 30, xlabel: 'NaCl (% en masa)', ylabel: 'T (°C)', ml: 52 });
      pl.frame();
      const ws = [], ts = []; for (let w = 0; w <= 23.3; w += 0.2) { ws.push(w); ts.push(Tice(w)); }
      pl.xy(ws, ts, { color: '--c1', width: 2.6 });
      const wsT = [], tsT = []; for (let T = -21.1; T <= 30; T += 1) { wsT.push(wsal(T)); tsT.push(T); }
      pl.xy(wsT, tsT, { color: '--c2', width: 2.6 });
      pl.path([[23.3, -21.1], [30, -21.1]], { color: '--ink-2', width: 1.6, dash: [6, 4] }); pl.path([[0, -21.1], [23.3, -21.1]], { color: '--ink-2', width: 1.6, dash: [6, 4] });
      pl.dot(23.3, -21.1, { color: '--c3', r: 5.5, label: 'eutéctico −21.1 °C, 23.3 %', dx: -8, dy: 16, align: 'right' });
      pl.label(3, 20, 'salmuera', { size: 12.5, color: '--ink-2', weight: 600 }); pl.label(4, -8, 'hielo + salmuera', { size: 12, color: '--c1', weight: 600 }); pl.label(24.2, 10, 'sal + salmuera', { size: 11, color: '--c2', weight: 600, align: 'center' });
      pl.vline(p.w, { color: '--accent', alpha: 0.4, width: 1 }); pl.dot(p.w, p.T, { color: '--accent', r: 5.5 });
      const Tf = p.w < 23.3 ? Tice(p.w) : -21.1;
      let ph, fr;
      const ws_ = wsal(p.T);
      if (p.T <= -21.1) { ph = 'hielo + NaCl·2H₂O sólidos (todo congelado)'; fr = '—'; }
      else if (p.w <= ws_ && p.T > Tice(Math.min(p.w, 23.3))) { ph = 'salmuera líquida (una fase)'; fr = '100 % líquido'; }
      else if (p.w < 23.3 && p.T < Tice(p.w)) { const wl = FQ.bisect((w) => Tice(w) - p.T, 0, 23.3, 1e-9); const fl = (p.w - 0) / wl; ph = 'hielo + salmuera'; fr = EM.fix(100 * fl, 1) + ' % salmuera (' + EM.fix(wl, 1) + ' % NaCl) · ' + EM.fix(100 * (1 - fl), 1) + ' % hielo'; pl.path([[0, p.T], [wl, p.T]], { color: '--accent', width: 2.4 }); }
      else { const fl = (100 - p.w) / (100 - ws_); ph = 'sal sólida + salmuera saturada'; fr = EM.fix(100 * fl, 1) + ' % salmuera (' + EM.fix(ws_, 1) + ' %) · ' + EM.fix(100 * (1 - fl), 1) + ' % sal'; }
      sim.set('ph', ph); sim.set('f', fr); sim.set('Tf', p.w < 23.3 ? EM.fix(Tf, 2) + ' °C' : 'por encima del eutéctico en sal: precipita NaCl·2H₂O');
    });
  });

  /* 11.4 Triángulo de Gibbs */
  EM.defineSim('triangulo', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    sim.slider('a', { label: 'Mezcla 1: fracción de A', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'Mezcla 1: fracción de B (C = 1 − A − B)', min: 0, max: 1, step: 0.01, value: 0.2, fmt: (v) => v.toFixed(2) });
    sim.slider('a2', { label: 'Mezcla 2: fracción de A', min: 0, max: 1, step: 0.01, value: 0.1, fmt: (v) => v.toFixed(2) });
    sim.slider('b2', { label: 'Mezcla 2: fracción de B', min: 0, max: 1, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('m1', { label: 'Masa de la mezcla 1 respecto de la 2', min: 0.1, max: 5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('p1', 'Mezcla 1 (A, B, C)', { hl: true });
    sim.out('p2', 'Mezcla 2 (A, B, C)');
    sim.out('p', 'Mezcla resultante (regla de la palanca)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, s = Math.min(W - 70, (H - 60) * 1.1547), x0 = (W - s) / 2, y0 = H - 36, hgt = s * 0.8660254;
      EM.draw.clear(cv);
      const V = { A: [x0 + s / 2, y0 - hgt], B: [x0, y0], C: [x0 + s, y0] };
      const P = (a, b) => { const c = 1 - a - b; return [a * V.A[0] + b * V.B[0] + c * V.C[0], a * V.A[1] + b * V.B[1] + c * V.C[1]]; };
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(...V.A); ctx.lineTo(...V.B); ctx.lineTo(...V.C); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      for (let k = 1; k < 10; k++) { const t = k / 10; for (const [u, v, w] of [[t, 1 - t, 0], [t, 0, 1 - t], [0, t, 1 - t]]) { /* líneas paralelas a los lados */ }
        const a = [P(t, 1 - t), P(t, 0)], b = [P(1 - t, t), P(0, t)], c = [P(1 - t, 0), P(0, 1 - t)];
        ctx.beginPath(); ctx.moveTo(...P(t, 0)); ctx.lineTo(...P(t, 1 - t)); ctx.moveTo(...P(0, t)); ctx.lineTo(...P(1 - t, t)); ctx.moveTo(...P(1 - t, 0)); ctx.lineTo(...P(0, 1 - t)); ctx.stroke(); }
      ctx.restore();
      EM.text(ctx, 'A (100 %)', V.A[0], V.A[1] - 8, { size: 13, align: 'center', weight: 700 }); EM.text(ctx, 'B (100 %)', V.B[0] - 4, V.B[1] + 18, { size: 13, align: 'center', weight: 700 }); EM.text(ctx, 'C (100 %)', V.C[0] + 4, V.C[1] + 18, { size: 13, align: 'center', weight: 700 });
      const n1 = Math.max(0, Math.min(1, p.a)), b1 = Math.min(p.b, 1 - n1), n2 = Math.min(p.a2, 1), b2 = Math.min(p.b2, 1 - n2);
      const p1 = [n1, b1], p2 = [n2, b2], mt = p.m1, r = [(p1[0] * mt + p2[0]) / (mt + 1), (p1[1] * mt + p2[1]) / (mt + 1)];
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(...P(...p1)); ctx.lineTo(...P(...p2)); ctx.stroke(); ctx.restore();
      const dot = (q, col, lab) => { const [x, y] = P(...q); ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fill(); EM.text(ctx, lab, x + 9, y - 8, { size: 12, weight: 700, halo: true }); };
      dot(p1, '--c1', '1'); dot(p2, '--c2', '2'); dot(r, '--accent', 'M');
      const f = (q) => EM.fix(q[0], 3) + ' · ' + EM.fix(q[1], 3) + ' · ' + EM.fix(1 - q[0] - q[1], 3);
      sim.set('p1', f(p1)); sim.set('p2', f(p2)); sim.set('p', f(r) + ' (la mezcla 1 aporta ' + EM.fix(100 * mt / (mt + 1), 1) + ' % de la masa)');
    });
  });
})();
