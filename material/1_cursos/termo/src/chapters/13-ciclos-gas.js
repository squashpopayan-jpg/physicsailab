/* Capítulo 13 — Ciclos de potencia de gas */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;
  const R = 0.287, cvA = 0.718, cpA = 1.005;
  /* trazado de un ciclo de gas ideal: estados [{T, v}], procesos 's' | 'v' | 'p' | 'T' entre estados consecutivos */
  const cyclePath = (st, kinds, k = 1.4) => {
    const cv = R / (k - 1), out = [];
    const s = (T, v) => cv * Math.log(T / st[0].T) + R * Math.log(v / st[0].v);
    for (let i = 0; i < st.length; i++) {
      const a = st[i], b = st[(i + 1) % st.length], kd = kinds[i];
      for (let j = 0; j <= 40; j++) {
        const t = j / 40; let T, v;
        if (kd === 's') { v = a.v * Math.pow(b.v / a.v, t); T = a.T * Math.pow(a.v / v, k - 1); }
        else if (kd === 'v') { v = a.v; T = a.T + (b.T - a.T) * t; }
        else if (kd === 'p') { T = a.T + (b.T - a.T) * t; v = (a.v * T) / a.T; }
        else { T = a.T; v = a.v * Math.pow(b.v / a.v, t); }
        out.push({ T, v, P: (R * T) / v, s: s(T, v), leg: i });
      }
    }
    return out;
  };
  const drawPair = (sim, cv, path, st, opts = {}) => {
    const ctx = cv.ctx, W = cv.w, H = cv.h;
    const col = opts.color || '--accent';
    const all = path.concat(...(opts.extra || []).map((e) => e.path));
    const vmin = Math.min(...all.map((q) => q.v)), vmax = Math.max(...all.map((q) => q.v));
    const Pmax = Math.max(...all.map((q) => q.P));
    const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0, xmax: vmax * 1.08, ymin: 0, ymax: Pmax * 1.1, xlabel: 'v (m³/kg)', ylabel: 'P (kPa)' });
    pl.frame();
    if (opts.extra) for (const e of opts.extra) pl.path(e.path.map((q) => [q.v, q.P]), { color: e.color, width: 1.4, dash: [6, 4] });
    pl.path(path.map((q) => [q.v, q.P]), { color: col, width: 2.6 });
    st.forEach((q, i) => pl.dot(q.v, (R * q.T) / q.v, { color: '--ink', r: 3, label: String(i + 1) }));
    const smin = Math.min(...all.map((q) => q.s)), smax = Math.max(...all.map((q) => q.s)), Tmax = Math.max(...all.map((q) => q.T));
    const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: smin - 0.1, xmax: smax + 0.15, ymin: 0, ymax: Tmax * 1.1, xlabel: 's − s₁ (kJ/kg·K)', ylabel: 'T (K)' });
    p2.frame();
    if (opts.extra) for (const e of opts.extra) p2.path(e.path.map((q) => [q.s, q.T]), { color: e.color, width: 1.4, dash: [6, 4] });
    p2.path(path.map((q) => [q.s, q.T]), { color: col, width: 2.6 });
    st.forEach((q, i) => { const pp = path[i * 41]; p2.dot(pp.s, pp.T, { color: '--ink', r: 3, label: String(i + 1) }); });
    return { pl, p2, vmin, Pmax };
  };

  /* 13.1 Otto */
  EM.defineSim('otto', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Relación de compresión <i>r</i>', min: 4, max: 14, step: 0.1, value: 8, fmt: (v) => v.toFixed(1) });
    sim.slider('q', { label: 'Calor añadido', min: 200, max: 2000, step: 10, value: 800, unit: 'kJ/kg', fmt: (v) => v.toFixed(0) });
    sim.slider('T1', { label: 'Temperatura de admisión', min: 270, max: 350, step: 1, value: 290, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P1', { label: 'Presión de admisión', min: 50, max: 200, step: 1, value: 100, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'Cociente de calores específicos <i>k</i>', min: 1.25, max: 1.67, step: 0.01, value: 1.4, fmt: (v) => v.toFixed(2) });
    sim.out('eta', 'Eficiencia térmica', { hl: true });
    sim.out('st', '<i>T</i><sub>max</sub> · <i>P</i><sub>max</sub>');
    sim.out('w', 'Trabajo neto · PME');
    sim.onDraw(() => {
      const p = sim.p, k = p.k, cv_ = R / (k - 1);
      EM.draw.clear(cv);
      const v1 = (R * p.T1) / p.P1, v2 = v1 / p.r, T2 = p.T1 * Math.pow(p.r, k - 1), T3 = T2 + p.q / cv_, T4 = T3 / Math.pow(p.r, k - 1);
      const st = [{ T: p.T1, v: v1 }, { T: T2, v: v2 }, { T: T3, v: v2 }, { T: T4, v: v1 }];
      const path = cyclePath(st, ['s', 'v', 's', 'v'], k);
      drawPair(sim, cv, path, st);
      const w = p.q - cv_ * (T4 - p.T1);
      sim.set('eta', EM.fix(w / p.q, 4) + ' (= 1 − r' + EM.sup('1') + '⁻ᵏ)');
      sim.set('st', EM.fix(T3, 0) + ' K · ' + EM.fix((R * T3) / v2 / 1000, 2) + ' MPa');
      sim.set('w', EM.fix(w, 1) + ' kJ/kg · ' + EM.fix(w / (v1 - v2), 0) + ' kPa');
    });
  });

  /* 13.2 Diesel, dual y Otto */
  EM.defineSim('diesel', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Relación de compresión del Diesel', min: 10, max: 24, step: 0.5, value: 18, fmt: (v) => v.toFixed(1) });
    sim.slider('ro', { label: 'Relación de compresión del Otto', min: 6, max: 24, step: 0.5, value: 9, fmt: (v) => v.toFixed(1) });
    sim.slider('q', { label: 'Calor añadido', min: 300, max: 1800, step: 10, value: 1000, unit: 'kJ/kg', fmt: (v) => v.toFixed(0) });
    sim.slider('fv', { label: 'Fracción del calor a volumen constante (dual)', min: 0, max: 1, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.out('d', 'Diesel: <i>r<sub>c</sub></i> · η', { hl: true });
    sim.out('du', 'Dual (misma <i>r</i>)');
    sim.out('o', 'Otto');
    sim.onDraw(() => {
      const p = sim.p, k = 1.4, T1 = 300, P1 = 100;
      EM.draw.clear(cv);
      const v1 = (R * T1) / P1;
      /* Diesel */
      const v2 = v1 / p.r, T2 = T1 * Math.pow(p.r, 0.4), T3 = T2 + p.q / cpA, v3 = (v2 * T3) / T2, T4 = T3 * Math.pow(v3 / v1, 0.4);
      const dst = [{ T: T1, v: v1 }, { T: T2, v: v2 }, { T: T3, v: v3 }, { T: T4, v: v1 }];
      const dpath = cyclePath(dst, ['s', 'p', 's', 'v'], k);
      /* dual */
      const Tx = T2 + (p.fv * p.q) / cvA, Ty = Tx + ((1 - p.fv) * p.q) / cpA, vy = (v2 * Ty) / Tx, T4d = Ty * Math.pow(vy / v1, 0.4);
      const ust = [{ T: T1, v: v1 }, { T: T2, v: v2 }, { T: Tx, v: v2 }, { T: Ty, v: vy }, { T: T4d, v: v1 }];
      const upath = cyclePath(ust, ['s', 'v', 'p', 's', 'v'], k);
      /* Otto */
      const vo2 = v1 / p.ro, To2 = T1 * Math.pow(p.ro, 0.4), To3 = To2 + p.q / cvA, To4 = To3 / Math.pow(p.ro, 0.4);
      const ost = [{ T: T1, v: v1 }, { T: To2, v: vo2 }, { T: To3, v: vo2 }, { T: To4, v: v1 }];
      const opath = cyclePath(ost, ['s', 'v', 's', 'v'], k);
      drawPair(sim, cv, dpath, dst, { extra: [{ path: opath, color: '--c1' }, { path: upath, color: '--c3' }] });
      const etaD = 1 - (cvA * (T4 - T1)) / p.q, etaU = 1 - (cvA * (T4d - T1)) / p.q, etaO = 1 - (cvA * (To4 - T1)) / p.q;
      sim.legend([{ label: 'Diesel', color: '--accent' }, { label: 'dual', color: '--c3', kind: 'dash' }, { label: 'Otto', color: '--c1', kind: 'dash' }]);
      sim.set('d', EM.fix(v3 / v2, 3) + ' · ' + EM.fix(etaD, 4));
      sim.set('du', 'η = ' + EM.fix(etaU, 4));
      sim.set('o', 'η = ' + EM.fix(etaO, 4) + ' (r = ' + p.ro + ')');
    });
  });

  /* 13.3 Stirling */
  EM.defineSim('stirling', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TH', { label: 'Temperatura caliente', min: 400, max: 1200, step: 5, value: 900, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('TC', { label: 'Temperatura fría', min: 250, max: 400, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Relación de volúmenes', min: 1.5, max: 6, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) });
    sim.slider('e', { label: 'Efectividad del regenerador', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('eta', 'Eficiencia', { hl: true });
    sim.out('c', 'Carnot');
    sim.out('q', 'Calor externo por kg: isoterma · isócora');
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const TH_ = Math.max(p.TH, p.TC + 20), TC = p.TC, v1 = 0.3, v2 = v1 * p.r;
      const st = [{ T: TC, v: v2 }, { T: TC, v: v1 }, { T: TH_, v: v1 }, { T: TH_, v: v2 }];
      const path = cyclePath(st, ['T', 'v', 'T', 'v']);
      drawPair(sim, cv, path, st);
      const qiso = R * TH_ * Math.log(p.r), qv = cvA * (TH_ - TC), w = R * (TH_ - TC) * Math.log(p.r);
      const qin = qiso + (1 - p.e) * qv;
      sim.set('eta', EM.fix(w / qin, 4));
      sim.set('c', EM.fix(1 - TC / TH_, 4));
      sim.set('q', EM.fix(qiso, 1) + ' · ' + EM.fix((1 - p.e) * qv, 1) + ' kJ/kg');
    });
  });

  /* 13.4 Brayton */
  EM.defineSim('brayton', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rp', { label: 'Relación de presiones', min: 2, max: 40, step: 0.5, value: 8, fmt: (v) => v.toFixed(1) });
    sim.slider('T3', { label: 'Temperatura de entrada a la turbina', min: 900, max: 1900, step: 10, value: 1300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('ec', { label: 'Eficiencia del compresor', min: 0.6, max: 1, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('et', { label: 'Eficiencia de la turbina', min: 0.6, max: 1, step: 0.01, value: 0.85, fmt: (v) => v.toFixed(2) });
    sim.slider('eps', { label: 'Efectividad del regenerador', min: 0, max: 0.95, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('eta', 'Eficiencia térmica', { hl: true });
    sim.out('w', 'Trabajo neto · relación de retroceso');
    sim.out('T', '<i>T</i><sub>2</sub> · <i>T</i><sub>4</sub>');
    sim.out('opt', 'Relación de presiones de máxima eficiencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f = (rp, ec = p.ec, et = p.et, e = p.eps) => TH.brayton({ rp, T1: 300, T3: p.T3, etac: ec, etat: et, eps: e });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1.5, xmax: 40, xlog: true, ymin: 0, ymax: 0.75, xlabel: 'relación de presiones r_p', ylabel: 'η' });
      pl.frame();
      pl.fn((r) => TH.braytonIdeal(r), { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.fn((r) => { const b = f(r, p.ec, p.et, 0); return b.wn > 0 ? b.eta : NaN; }, { color: '--c6', width: 1.6 });
      pl.fn((r) => { const b = f(r); return b.wn > 0 ? b.eta : NaN; }, { color: '--accent', width: 2.6 });
      pl.fn((r) => { const b = f(r, 1, 1, 0); return (b.wn / (1005 * p.T3)) * 1.5; }, { color: '--c3', width: 1.2, dash: [3, 3] });
      const b = f(p.rp);
      pl.dot(p.rp, b.eta, { color: '--accent', r: 6 });
      let best = [2, 0]; for (let r = 2; r <= 40; r += 0.1) { const e = f(r); if (e.wn > 0 && e.eta > best[1]) best = [r, e.eta]; }
      pl.legend([{ label: 'ideal', color: '--c1', dash: [6, 4] }, { label: 'real sin regenerador', color: '--c6' }, { label: 'real con el regenerador elegido', color: '--accent' }, { label: 'trabajo ideal (escala relativa)', color: '--c3', dash: [3, 3] }], 'br');
      sim.set('eta', EM.fix(b.eta, 4) + ' (ideal ' + EM.fix(TH.braytonIdeal(p.rp), 4) + ')');
      sim.set('w', EM.fix(b.wn / 1000, 1) + ' kJ/kg · ' + EM.fix(100 * b.bwr, 1) + ' %');
      sim.set('T', EM.fix(b.T2, 0) + ' K · ' + EM.fix(b.T4, 0) + ' K' + (p.eps > 0 && b.T4 <= b.T2 ? ' (regenerador inútil: T₄ &lt; T₂)' : ''));
      sim.set('opt', EM.fix(best[0], 1) + ' (η = ' + EM.fix(best[1], 3) + ')');
    });
  });
})();
