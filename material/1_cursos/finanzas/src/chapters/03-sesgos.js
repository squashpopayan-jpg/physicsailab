/* Capítulo 3 — Sesgos que cuestan dinero */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, B = L.beh;

  /* ======================================================================
     3.1 Teoría prospectiva
     ====================================================================== */
  CC.defineSim('prospectiva', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.05, label: 'Función de valor' }), cw = sim.canvas({ aspect: 1.05, label: 'Ponderación de probabilidades' });
    sim.group('Parámetros psicológicos');
    sim.slider('a', { label: 'Curvatura α (y β)', min: 0.4, max: 1, step: 0.01, value: 0.88, fmt: (v) => CC.nf(v, 2) });
    sim.slider('lam', { label: 'Aversión a la pérdida λ', min: 1, max: 4, step: 0.05, value: 2.25, fmt: (v) => CC.nf(v, 2) });
    sim.slider('g', { label: 'Ponderación γ (ganancias)', min: 0.3, max: 1, step: 0.01, value: 0.61, fmt: (v) => CC.nf(v, 2) });
    sim.group('La apuesta');
    sim.slider('G', { label: 'Ganancia si sale bien', min: 0, max: 5000000, step: 5000, value: 150000, log: false, fmt: CC.cop });
    sim.slider('P', { label: 'Pérdida si sale mal', min: 0, max: 1000000, step: 5000, value: 100000, fmt: CC.cop });
    sim.slider('p', { label: 'Probabilidad de ganar', min: 0.01, max: 0.99, step: 0.01, value: 0.5, fmt: (v) => CC.pct(v, 0) });
    sim.note('Para las pérdidas se usa δ = 0,69, como en Tversky y Kahneman (1992).');
    sim.out('ev', 'Valor esperado en pesos');
    sim.out('vp', 'Valor psicológico (prospectivo)');
    sim.out('dec', 'Decisión que predice la teoría', { hl: true });
    sim.out('min', 'Ganancia mínima para aceptar');
    sim.out('wp', 'Probabilidad sentida w(p)');
    sim.onDraw(() => {
      const o = { a: sim.p.a, b: sim.p.a, lam: sim.p.lam, g: sim.p.g, d: 0.69 };
      const k = 1000; /* trabajamos en miles de pesos */
      const G = sim.p.G / k, P = sim.p.P / k, p = sim.p.p;
      const V = B.gamble(G, P, p, o), EV = p * sim.p.G - (1 - p) * sim.p.P;
      /* función de valor */
      CC.draw.clear(cv);
      const X = Math.max(400, G, P) * 1.15, vmax = B.value(X, o.a, o.b, o.lam), vmin = B.value(-X, o.a, o.b, o.lam);
      const pv = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -X, xmax: X, ymin: vmin, ymax: vmax * 1.1, xlabel: 'ganancia o pérdida (miles de pesos)', ylabel: 'valor psicológico', title: 'función de valor', yfmt: () => '' });
      pv.frame();
      pv.fn((x) => x, { color: '--ink-3', dash: [5, 4], width: 1.3 });
      pv.fn((x) => B.value(x, o.a, o.b, o.lam), { color: '--accent', width: 2.6 });
      pv.dot(G, B.value(G, o.a, o.b, o.lam), { color: '--gain', label: '+' + CC.nf(G) + ' mil' });
      pv.dot(-P, B.value(-P, o.a, o.b, o.lam), { color: '--loss', label: '−' + CC.nf(P) + ' mil', align: 'left', dy: 14 });
      pv.legend([{ label: 'valor psicológico', color: '--accent' }, { label: 'valor en pesos (recta)', color: '--ink-3', dash: [5, 4] }], 'br');
      /* ponderación */
      CC.draw.clear(cw);
      const pw = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'probabilidad real p', ylabel: 'probabilidad sentida w(p)', title: 'ponderación de probabilidades', xfmt: CC.pctAxis, yfmt: CC.pctAxis });
      pw.frame();
      pw.fn((x) => x, { color: '--ink-3', dash: [5, 4], width: 1.3 });
      pw.fn((x) => B.weight(x, o.g), { color: '--c4', width: 2.4 });
      pw.fn((x) => B.weight(x, 0.69), { color: '--c2', width: 1.8, dash: [3, 3] });
      pw.dot(p, B.weight(p, o.g), { color: '--c4' });
      pw.legend([{ label: 'ganancias (γ)', color: '--c4' }, { label: 'pérdidas (δ = 0,69)', color: '--c2', dash: [3, 3] }], 'br');
      sim.set('ev', `<span class="${EV >= 0 ? 'gain' : 'loss'}">${CC.cop(EV)}</span>`);
      sim.set('vp', CC.nf(V, 1));
      sim.set('dec', V > 0 ? '<span class="gain">acepta</span>' : '<span class="loss">rechaza</span>');
      let gmin = NaN;
      if (P > 0) { const f = (g) => B.gamble(g, P, p, o); gmin = f(P * 200) > 0 ? L.util.bisect(f, 0, P * 200) * k : NaN; }
      sim.set('min', P > 0 ? (isFinite(gmin) ? CC.cop(gmin) + ` (${CC.nf(gmin / sim.p.P, 2)} veces la pérdida)` : 'ninguna razonable') : '—');
      sim.set('wp', `${CC.pct(B.weight(p, o.g))} en vez de ${CC.pct(p, 0)}`);
    });
  });

  /* ======================================================================
     3.2 Descuento exponencial frente a hiperbólico
     ====================================================================== */
  CC.defineSim('hiperbolico', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1.05, label: 'Factores de descuento' }), cc = sim.canvas({ aspect: 1.05, label: 'Valor de las dos opciones según la espera inicial' });
    sim.group('Las opciones');
    sim.slider('a', { label: 'Opción A: monto pequeño', min: 50000, max: 200000, step: 5000, value: 100000, fmt: CC.cop });
    sim.slider('b', { label: 'Opción B: monto mayor', min: 55000, max: 300000, step: 5000, value: 120000, fmt: CC.cop });
    sim.slider('d', { label: 'Días extra que hay que esperar por B', min: 1, max: 60, step: 1, value: 7, fmt: (v) => CC.nf(v) + ' días' });
    sim.group('Impaciencia');
    sim.slider('k', { label: 'Hiperbólico: k por día', min: 0.005, max: 0.3, step: 0.005, value: 0.05, fmt: (v) => CC.nf(v, 3) });
    sim.slider('dl', { label: 'Exponencial: δ por día', min: 0.95, max: 0.9995, step: 0.0005, value: 0.985, fmt: (v) => CC.nf(v, 4) });
    sim.out('h0', 'Hiperbólico, elige hoy');
    sim.out('h30', 'Hiperbólico, con 30 días de espera');
    sim.out('sx', 'Cambia de opinión a partir de', { hl: true });
    sim.out('e', 'Exponencial, a cualquier distancia');
    sim.onDraw(() => {
      const { a, b, d, k, dl } = sim.p;
      const H = (t) => B.discHyp(t, k), E = (t) => B.discExp(t, dl);
      CC.draw.clear(cd);
      const p1 = new CC.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: 90, ymin: 0, ymax: 1.02, xlabel: 'días hasta el pago', ylabel: 'valor hoy de $1', title: 'cuánto vale hoy un peso futuro', yfmt: (v) => CC.nf(v, 1) });
      p1.frame();
      p1.fn(H, { color: '--c2', width: 2.4 });
      p1.fn(E, { color: '--c1', width: 2.4, dash: [6, 4] });
      p1.legend([{ label: 'hiperbólico 1/(1+kt)', color: '--c2' }, { label: 'exponencial δ^t', color: '--c1', dash: [6, 4] }], 'tr');
      CC.draw.clear(cc);
      const S = 60;
      const vmax = Math.max(a, b) * 1.05;
      const p2 = new CC.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: S, ymin: 0, ymax: vmax, xlabel: 'días hasta la primera opción (s)', title: 'valor hoy de A (en s) y de B (en s + d)', yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.fn((s) => a * H(s), { color: '--c4', width: 2.4 });
      p2.fn((s) => b * H(s + d), { color: '--c3', width: 2.4 });
      p2.fn((s) => a * E(s), { color: '--c4', width: 1.5, dash: [5, 4] });
      p2.fn((s) => b * E(s + d), { color: '--c3', width: 1.5, dash: [5, 4] });
      const sx = (a * (1 + k * d) - b) / (k * (b - a));
      if (sx > 0 && sx < S) p2.vline(sx, { color: '--accent', label: 'cambia de opinión', dash: [], labelY: p2.ih - 8 });
      p2.legend([{ label: 'A hiperbólico', color: '--c4' }, { label: 'B hiperbólico', color: '--c3' }, { label: 'exponencial (punteadas)', color: '--ink-3', dash: [5, 4] }], 'tr');
      const ch = (s, disc) => B.choose(a, b, s, d, disc) === 'A' ? `A (${CC.cop(a)} antes)` : `B (${CC.cop(b)} después)`;
      sim.set('h0', ch(0, H));
      sim.set('h30', ch(30, H));
      sim.set('sx', b <= a ? '—' : sx <= 0 ? 'siempre espera por B' : `${CC.nf(sx, 1)} días de espera inicial`);
      const e0 = ch(0, E), e30 = ch(30, E);
      sim.set('e', e0 === e30 ? e0.split(' ')[0] + ' siempre (no cambia)' : 'cambia');
    });
  });

  /* ======================================================================
     3.3 Sesgo de supervivencia
     ====================================================================== */
  CC.defineSim('supervivencia', function (sim) {
    sim.cols2();
    const cg = sim.canvas({ aspect: 1.05, label: 'Cuadrícula de expertos: los sobrevivientes resaltados' }), cb = sim.canvas({ aspect: 1.05, label: 'Expertos con historial perfecto en cada ronda' });
    sim.group('El experimento');
    sim.slider('N', { label: 'Número de «expertos»', min: 100, max: 1000000, step: 100, value: 10000, log: true, fmt: (v) => CC.nf(Math.round(v / 100) * 100) });
    sim.slider('R', { label: 'Rondas de predicción', min: 1, max: 20, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.slider('p', { label: 'Probabilidad de acertar cada ronda', min: 0.5, max: 0.65, step: 0.01, value: 0.5, fmt: (v) => CC.pct(v, 0) });
    let seed = 1;
    sim.button('Nuevo sorteo', () => { seed++; compute(); }, { id: 'new' });
    sim.out('surv', 'Historial perfecto al final', { hl: true });
    sim.out('esp', 'Esperado por pura suerte: N·pᴿ');
    sim.out('frac', 'Fracción de «genios»');
    let streak = [], hist = [];
    const compute = () => {
      const N = Math.round(sim.p.N / 100) * 100, R = sim.p.R, p = sim.p.p, rng = L.rng(seed * 7919);
      streak = new Uint8Array(Math.min(N, 2500));
      hist = new Array(R + 1).fill(0);
      for (let i = 0; i < N; i++) {
        let k = 0;
        while (k < R && rng() < p) k++;
        if (i < streak.length) streak[i] = k;
        hist[k]++;
      }
    };
    compute();
    sim.onChange = () => compute();
    sim.onDraw(() => {
      const N = Math.round(sim.p.N / 100) * 100, R = sim.p.R, p = sim.p.p;
      const surv = [];
      for (let r = 0; r <= R; r++) { let s = 0; for (let k = r; k <= R; k++) s += hist[k]; surv.push(s); }
      /* cuadrícula */
      CC.draw.clear(cg);
      const ctx = cg.ctx, n = streak.length, cols = Math.ceil(Math.sqrt(n * (cg.w / (cg.h - 30)))), rows = Math.ceil(n / cols);
      const cell = Math.min((cg.w - 20) / cols, (cg.h - 40) / rows), x0 = (cg.w - cols * cell) / 2, y0 = 28;
      for (let i = 0; i < n; i++) {
        const cx = x0 + (i % cols) * cell + cell / 2, cy = y0 + Math.floor(i / cols) * cell + cell / 2;
        const ok = streak[i] >= R;
        ctx.beginPath();
        ctx.arc(cx, cy, ok ? Math.max(4, cell * 0.9) : Math.max(0.8, cell * 0.3), 0, 7);
        ctx.fillStyle = ok ? CC.col('--gold') : CC.alpha('--ink-3', 0.12 + 0.5 * (streak[i] / R));
        ctx.fill();
        if (ok) { ctx.lineWidth = 1.5; ctx.strokeStyle = CC.col('--ink'); ctx.stroke(); }
      }
      const sv = streak.reduce((s, v) => s + (v >= R ? 1 : 0), 0);
      CC.text(ctx, `Primeros ${CC.nf(n)} expertos · ${sv} con ${R} aciertos seguidos`, 10, 18, { size: 12, color: '--ink-2', weight: 600 });
      /* barras de sobrevivientes */
      CC.draw.clear(cb);
      const pl = new CC.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: -0.6, xmax: R + 0.6, ymin: 0.5, ymax: N * 2, ylog: true, xlabel: 'ronda', ylabel: 'expertos sin ningún error', title: 'cuántos conservan un historial perfecto' });
      pl.frame();
      const xs = surv.map((_, r) => r);
      pl.bars(xs, surv.map((v) => Math.max(v, 0.5)), { color: '--c1', w: 0.7, base: 0.5 });
      pl.fn((r) => N * Math.pow(p, r), { color: '--gold', width: 2.2, dash: [5, 4], n: 200 });
      pl.legend([{ label: 'simulación', color: '--c1', kind: 'sq' }, { label: 'esperado N·pʳ', color: '--gold', dash: [5, 4] }], 'tr');
      sim.set('surv', CC.nf(surv[R]));
      sim.set('esp', CC.nf(N * Math.pow(p, R), 1));
      sim.set('frac', `1 de cada ${CC.nf(1 / Math.pow(p, R), 0)}`);
    });
  });
})();
