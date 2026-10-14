/* Capítulo 4 — Plasticidad sináptica */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, P = L.plast;

  /* ======================================================================
     4.1 Control por calcio: frecuencia → LTD / LTP
     ====================================================================== */
  RC.defineSim('calcio', function (sim) {
    sim.cols2();
    const co = sim.canvas({ aspect: 1.1, label: 'Función omega del calcio: sin cambio, depresión o potenciación' });
    const cf = sim.canvas({ aspect: 1.1, label: 'Cambio sináptico según la frecuencia de estimulación' });
    sim.group('Protocolo');
    sim.slider('f', { label: 'Frecuencia (Hz)', min: 0.1, max: 100, step: 0.1, value: 1, log: true, fmt: (v) => RC.nf(v, v < 10 ? 1 : 0) });
    sim.slider('n', { label: 'Número de pulsos', min: 50, max: 2000, step: 50, value: 900, fmt: (v) => RC.nf(v) });
    sim.slider('nmda', { label: 'Receptores NMDA disponibles', min: 0, max: 1, step: 0.05, value: 1, fmt: (v) => RC.pct(v, 0) });
    sim.out('ca', 'Calcio postsináptico (µM, modelo)');
    sim.out('dw', 'Cambio de la sinapsis', { hl: true });
    sim.out('tipo', 'Resultado');
    sim.onDraw(() => {
      const f = sim.p.f, n = sim.p.n, nm = sim.p.nmda;
      const ca = P.caFreq(f, nm), dw = P.freqChange(f, n, 600, nm);
      RC.draw.clear(co);
      const po = new RC.Plot(co.ctx, { x: 0, y: 0, w: co.w, h: co.h, xmin: 0, xmax: 0.9, ymin: 0, ymax: 1.05, xlabel: 'calcio (µM)', ylabel: 'Ω (hacia dónde va el peso)', title: 'hipótesis del control por calcio' });
      po.frame();
      po.band(0.35, 0.536, { color: '--c4', alpha: 0.08 });
      po.band(0.536, 0.9, { color: '--c3', alpha: 0.08 });
      po.hline(0.25, { color: '--ink-3', label: 'sin cambio' });
      po.fn((c) => P.omega(c), { color: '--c1', width: 2.4 });
      po.dot(ca, P.omega(ca), { color: '--c2', r: 6 });
      po.label(0.38, 0.95, 'LTD', { color: '--c4', weight: 700 });
      po.label(0.7, 0.95, 'LTP', { color: '--c3', weight: 700 });
      RC.draw.clear(cf);
      const pf = new RC.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: 0.1, xmax: 100, xlog: true, ymin: -0.25, ymax: 0.5, xlabel: 'frecuencia de estimulación (Hz)', ylabel: 'cambio de la sinapsis', yfmt: RC.pctAxis, title: `${RC.nf(n)} pulsos (forma de Dudek y Bear, 1992)` });
      pf.frame();
      pf.fn((x) => P.freqChange(x, n, 600, nm), { color: '--c1', width: 2.4 });
      pf.dot(f, dw, { color: '--c2', r: 6 });
      sim.set('ca', RC.nf(ca, 3));
      sim.set('dw', (dw >= 0 ? '+' : '') + RC.pct(dw, 1));
      sim.set('tipo', Math.abs(dw) < 0.01 ? 'sin cambio' : dw > 0 ? '<span class="gain">potenciación (LTP)</span>' : '<span class="loss">depresión (LTD)</span>');
    });
  });

  /* ======================================================================
     4.2 STDP
     ====================================================================== */
  RC.defineSim('stdp', function (sim) {
    sim.cols2();
    const cw = sim.canvas({ aspect: 1.1, label: 'Ventana de plasticidad dependiente del tiempo de espiga' });
    const cp = sim.canvas({ aspect: 1.1, label: 'Peso sináptico a lo largo de los emparejamientos' });
    sim.group('Protocolo');
    sim.slider('dt', { label: 'Desfase Δt = t_post − t_pre (ms)', min: -60, max: 60, step: 1, value: 10, fmt: (v) => (v > 0 ? '+' : '') + RC.nf(v) });
    sim.slider('np', { label: 'Número de pares', min: 5, max: 120, step: 5, value: 60, fmt: (v) => RC.nf(v) });
    sim.group('Ventana');
    sim.slider('tp', { label: 'τ+ (ms)', min: 5, max: 40, step: 1, value: 17, fmt: (v) => RC.nf(v) });
    sim.slider('tm', { label: 'τ− (ms)', min: 5, max: 60, step: 1, value: 34, fmt: (v) => RC.nf(v) });
    sim.out('cpar', 'Cambio por par (unidades de la ventana)');
    sim.out('fin', 'Cambio tras el protocolo', { hl: true });
    sim.onDraw(() => {
      const par = Object.assign({}, P.stdpParams, { tp: sim.p.tp, tm: sim.p.tm });
      RC.draw.clear(cw);
      const pw = new RC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: -60, xmax: 60, ymin: -0.45, ymax: 0.9, xlabel: 'Δt (ms)', ylabel: 'cambio por par', title: 'pre antes que post fortalece' });
      pw.frame();
      pw.fn((x) => P.stdp(x, par), { color: '--c1', width: 2.4, from: 0.01 });
      pw.fn((x) => P.stdp(x, par), { color: '--c2', width: 2.4, to: -0.01 });
      pw.dot(sim.p.dt, P.stdp(sim.p.dt, par), { color: '--ink', r: 6 });
      const tr = P.pairing(sim.p.dt, sim.p.np, 0.012, par);
      RC.draw.clear(cp);
      const pp = new RC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 120, ymin: 0.5, ymax: 2.2, xlabel: 'número de pares', ylabel: 'peso relativo', title: 'emparejamientos a 1 Hz' });
      pp.frame();
      pp.hline(1, { color: '--ink-3' });
      pp.xy(tr.map((_, i) => i), tr, { color: sim.p.dt >= 0 ? '--c1' : '--c2', width: 2.6 });
      sim.set('cpar', RC.nf(P.stdp(sim.p.dt, par), 3));
      const c = tr[tr.length - 1] - 1;
      sim.set('fin', `<span class="${c >= 0 ? 'gain' : 'loss'}">${c >= 0 ? '+' : ''}${RC.pct(c, 0)}</span>`);
    });
  });

  /* ======================================================================
     4.3 Oja frente a Hebb
     ====================================================================== */
  RC.defineSim('oja', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, label: 'Patrones de entrada y vector de pesos aprendido' });
    sim.group('Regla');
    sim.seg('rule', { options: [['oja', 'Oja'], ['hebb', 'Hebb puro']], value: 'oja' });
    sim.group('Entradas');
    sim.slider('rho', { label: 'Correlación entre las dos entradas', min: -0.9, max: 0.9, step: 0.05, value: 0.6, fmt: (v) => RC.nf(v, 2) });
    sim.slider('sy', { label: 'Variabilidad de la entrada 2', min: 0.2, max: 1.2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    sim.slider('eta', { label: 'Tasa de aprendizaje η', min: 0.0005, max: 0.02, step: 0.0005, value: 0.004, fmt: (v) => RC.nf(v, 4) });
    let k = 0, res = null, key = '';
    sim.resetButton(() => { k = 0; });
    sim.animate((dt) => { k = Math.min(4000, k + Math.round(dt * 900)); });
    sim.out('w', 'Pesos w');
    sim.out('nw', 'Longitud |w|');
    sim.out('ang', 'Ángulo con la componente principal', { hl: true });
    sim.onDraw(() => {
      const kk = `${sim.p.rule}|${sim.p.rho}|${sim.p.sy}|${sim.p.eta}`;
      if (kk !== key) { key = kk; k = 0; res = P.oja({ n: 4000, eta: sim.p.eta, rho: sim.p.rho, sx: 1, sy: sim.p.sy, rule: sim.p.rule, seed: 3 }); }
      const idx = Math.min(res.traj.length - 1, Math.floor(k / 10));
      const w = res.traj[idx];
      const pc = P.pc1(1, sim.p.rho * sim.p.sy, sim.p.sy * sim.p.sy);
      RC.draw.clear(cv);
      const R = 3;
      const asp = cv.w / cv.h;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -R * asp * 0.85, xmax: R * asp * 0.85, ymin: -R, ymax: R, xlabel: 'actividad de la entrada 1', ylabel: 'entrada 2' });
      pl.frame();
      res.pts.forEach((p) => pl.dot(p[0], p[1], { color: '--c6', r: 2 }));
      pl.path([[-R * 2 * pc.v[0], -R * 2 * pc.v[1]], [R * 2 * pc.v[0], R * 2 * pc.v[1]]], { color: '--c3', width: 1.4, dash: [6, 4] });
      const path = res.traj.slice(0, idx + 1).map((q) => { const n = Math.hypot(q[0], q[1]); const s = n > 2.6 ? 2.6 / n : 1; return [q[0] * s, q[1] * s]; });
      pl.path(path, { color: '--c1', width: 1, alpha: 0.5 });
      const n = Math.hypot(w[0], w[1]), sc = n > 2.6 ? 2.6 / n : 1;
      pl.arrow(0, 0, w[0] * sc, w[1] * sc, { color: '--c2', width: 3 });
      pl.label(-R * asp * 0.8, R * 0.85, `paso ${idx * 10}${n > 2.6 ? ' · flecha recortada' : ''}`, { color: '--ink-2' });
      const cos = Math.abs(w[0] * pc.v[0] + w[1] * pc.v[1]) / n;
      sim.set('w', `(${RC.nf(w[0], 3)}; ${RC.nf(w[1], 3)})`);
      sim.set('nw', n > 1e4 ? RC.sci(n, 3) : RC.nf(n, 3));
      sim.set('ang', `${RC.nf((Math.acos(Math.min(1, cos)) * 180) / Math.PI, 1)}°`);
    });
  });

  /* ======================================================================
     4.4 BCM: selectividad
     ====================================================================== */
  RC.defineSim('bcm', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Respuesta de la neurona a los patrones A y B y umbral deslizante' });
    sim.group('Entradas');
    sim.slider('pA', { label: 'Frecuencia del patrón A', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.slider('tau', { label: 'Constante del umbral τθ (pasos)', min: 5, max: 400, step: 5, value: 50, fmt: (v) => RC.nf(v) });
    let seed = 3;
    sim.button('Otro orden al azar', () => { seed++; }, { id: 'otra' });
    sim.out('yA', 'Respuesta final a A');
    sim.out('yB', 'Respuesta final a B');
    sim.out('sel', 'Selectividad', { hl: true });
    sim.onDraw(() => {
      const r = P.bcm({ pA: sim.p.pA, tauT: sim.p.tau, n: 6000, seed });
      RC.draw.clear(cv);
      const xs = r.yA.map((_, i) => (i + 1) * 20);
      const ymax = Math.max(1.2, ...r.yA, ...r.yB) * 1.1;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6000, ymin: 0, ymax, xlabel: 'presentaciones', ylabel: 'respuesta' });
      pl.frame();
      pl.xy(xs, r.yA, { color: '--c1', width: 2.4 });
      pl.xy(xs, r.yB, { color: '--c2', width: 2.4 });
      pl.xy(xs, r.th.slice(1), { color: '--ink-3', width: 1.5, dash: [5, 4] });
      pl.legend([{ label: 'respuesta al patrón A', color: '--c1' }, { label: 'respuesta al patrón B', color: '--c2' }, { label: 'umbral θ', color: '--ink-3', dash: [5, 4] }], 'tl');
      const a = r.yA[r.yA.length - 1], b = r.yB[r.yB.length - 1];
      sim.set('yA', RC.nf(a, 2)); sim.set('yB', RC.nf(b, 2));
      sim.set('sel', a + b > 0 ? `${RC.nf(Math.abs(a - b) / (a + b), 2)} (prefiere ${a > b ? 'A' : 'B'})` : '—');
    });
  });

  RC.defineSim('quiz-plasticidad', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué decide si una sinapsis se potencia o se deprime en la hipótesis del control por calcio?', opts: ['El tipo de neurotransmisor', 'La cantidad de calcio que entra por los receptores NMDA', 'La edad de la persona'], ok: 1, fb: 'Calcio moderado sostenido produce LTD; mucho calcio en poco tiempo, LTP.' },
      { q: 'En la STDP, si la neurona presináptica dispara 5 ms después de la postsináptica, la sinapsis…', opts: ['Se fortalece', 'Se debilita', 'No cambia'], ok: 1, fb: 'Δt negativo (pre después de post) produce depresión: la entrada no pudo causar el disparo.' },
      { q: '¿Cuál es el problema de la regla de Hebb pura?', opts: ['Aprende la dirección equivocada', 'Los pesos crecen sin límite', 'Necesita información global'], ok: 1, fb: 'Es retroalimentación positiva sin freno; Oja y BCM agregan estabilización.' },
      { q: 'Una neurona con la regla de Oja aprende…', opts: ['La media de sus entradas', 'La dirección de mayor varianza de sus entradas (componente principal)', 'Patrones al azar'], ok: 1, fb: 'Converge al vector propio principal de la covarianza, con norma 1.' },
      { q: 'Ratas tratadas con AP5, que bloquea los receptores NMDA, en el laberinto acuático de Morris…', opts: ['Aprenden más rápido', 'No aprenden dónde está la plataforma', 'No pueden nadar'], ok: 1, fb: 'Morris y otros (1986): bloquear la LTP del hipocampo impide el aprendizaje espacial.' }
    ], { id: 'plasticidad', shuffle: true });
  });
})();
