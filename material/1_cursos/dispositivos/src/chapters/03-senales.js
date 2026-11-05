/* Capítulo 3 — Señales, fasores y respuesta en frecuencia */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;

  /* forma de onda normalizada (−1…1 salvo pulsos) con fase en ciclos */
  const wf = {
    sin: (x) => Math.sin(TAU * x),
    tri: (x) => { const f = x - Math.floor(x); return f < 0.5 ? 4 * f - 1 : 3 - 4 * f; },
    saw: (x) => 2 * (x - Math.floor(x)) - 1,
    sq: (x, d = 0.5) => ((x - Math.floor(x)) < d ? 1 : -1)
  };

  /* 3.1 Parámetros de la señal */
  EM.defineSim('c3-senal', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Forma de onda' });
    sim.group('Señal');
    sim.seg('w', { label: 'Forma de onda', options: [['sin', 'Senoidal'], ['tri', 'Triangular'], ['saw', 'Diente'], ['sq', 'Cuadrada']], value: 'sin' });
    sim.slider('a', { label: 'Amplitud (pico)', min: 0.5, max: 10, step: 0.5, value: 5, unit: 'V' });
    sim.slider('o', { label: 'Nivel de continua (offset)', min: -5, max: 5, step: 0.5, value: 0, unit: 'V' });
    sim.slider('d', { label: 'Ciclo de trabajo (cuadrada)', min: 0.1, max: 0.9, step: 0.05, value: 0.5 });
    sim.slider('f', { label: 'Frecuencia', min: 10, max: 1000, step: 10, value: 100, unit: 'Hz' });
    sim.out('pp', 'Tensión pico a pico', { hl: true }); sim.out('med', 'Valor medio'); sim.out('rms', 'Valor eficaz (RMS)', { hl: true }); sim.out('ac', 'RMS de la parte alterna'); sim.out('cr', 'Factor de cresta');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, T = 1 / p.f;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const y = (t) => p.o + p.a * wf[p.w](t / T, p.d);
      const vmax = Math.max(Math.abs(p.o) + p.a, 1) * 1.15;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: 3 * T * 1000, ymin: -vmax, ymax: vmax, ml: 54, mr: 14, mt: 14, mb: 40, xlabel: 'tiempo (ms)', ylabel: 'tensión (V)' });
      pl.frame();
      const ts = M.linspace(0, 3 * T, 900);
      pl.xy(ts.map((t) => t * 1000), ts.map(y), { color: '--c1', width: 2.4 });
      /* medios numéricos */
      let s = 0, s2 = 0; const N = 4000;
      for (let k = 0; k < N; k++) { const v = y((k + 0.5) / N * T); s += v; s2 += v * v; }
      const med = s / N, rms = Math.sqrt(s2 / N), ac = Math.sqrt(Math.max(0, rms * rms - med * med));
      pl.hline(med, { color: '--c3', dash: [6, 4], width: 1.8 });
      pl.hline(rms, { color: '--c2', dash: [3, 4], width: 1.6 });
      pl.legend([{ label: 'señal', color: '--c1' }, { label: 'valor medio', color: '--c3', kind: 'dash' }, { label: 'valor eficaz', color: '--c2', kind: 'dash' }], 'tr');
      const mx = Math.max(...ts.map(y)), mn = Math.min(...ts.map(y));
      sim.set('pp', fmt(mx - mn, 'V')); sim.set('med', fmt(med, 'V')); sim.set('rms', fmt(rms, 'V')); sim.set('ac', fmt(ac, 'V')); sim.set('cr', EM.fix(Math.max(Math.abs(mx), Math.abs(mn)) / rms, 3));
    });
  });

  /* 3.2 Series de Fourier */
  EM.defineSim('c3-fourier', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Síntesis de Fourier' });
    sim.group('Síntesis');
    sim.seg('w', { label: 'Onda', options: [['sq', 'Cuadrada'], ['tri', 'Triangular'], ['saw', 'Diente de sierra']], value: 'sq' });
    sim.slider('n', { label: 'Armónicos sumados', min: 1, max: 41, step: 1, value: 5 });
    sim.out('thd', 'THD de la suma', { hl: true }); sim.out('rms', 'Valor eficaz de la suma'); sim.out('rmsi', 'Valor eficaz de la onda ideal'); sim.out('gib', 'Sobreimpulso máximo');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, N = Math.round(p.n);
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const h1 = Math.round(h * 0.6);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h: h1, xmin: 0, xmax: 2, ymin: -1.4, ymax: 1.4, ml: 50, mr: 14, mt: 12, mb: 28, xlabel: 't / T', ylabel: 'amplitud' });
      pl.frame();
      const xs = M.linspace(0, 2, 800);
      const idl = (x) => (p.w === 'sq' ? wf.sq(x) : p.w === 'tri' ? wf.tri(x) : wf.saw(x));
      const par = (x) => { let s = 0; for (let n = 1; n <= N; n++) s += coefAbs(p.w, n) * Math.sin(TAU * n * x + phase(p.w, n)); return s; };
      pl.xy(xs, xs.map(idl), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.xy(xs, xs.map(par), { color: '--c1', width: 2.4 });
      pl.legend([{ label: 'onda ideal', color: '--ink-3', kind: 'dash' }, { label: 'suma de ' + N + ' armónicos', color: '--c1' }], 'tr');
      /* espectro */
      const sp = new EM.Plot(c, { x: 0, y: h1, w, h: h - h1, xmin: 0, xmax: 42, ymin: 0, ymax: 1.4, ml: 50, mr: 14, mt: 6, mb: 34, xlabel: 'número de armónico n', ylabel: '|b_n|' });
      sp.frame();
      c.save();
      for (let n = 1; n <= 41; n++) { const a = coefAbs(p.w, n); if (a < 1e-9) continue; const x = sp.X(n), y0 = sp.Y(0), y1 = sp.Y(a); c.fillStyle = n <= N ? EM.col('--c1') : EM.alpha('--ink-3', 0.35); c.fillRect(x - 3, y1, 6, y0 - y1); }
      c.restore();
      let s2 = 0, s2h = 0, mx = 0;
      for (let n = 1; n <= N; n++) { const a = coefAbs(p.w, n); s2 += a * a; if (n >= 2) s2h += a * a; }
      for (const x of xs) mx = Math.max(mx, par(x));
      sim.set('thd', EM.fix(100 * Math.sqrt(s2h) / coefAbs(p.w, 1), 1) + ' %'); sim.set('rms', EM.fix(Math.sqrt(s2 / 2), 4)); sim.set('rmsi', p.w === 'sq' ? '1.0000' : '0.5774'); sim.set('gib', EM.fix(100 * (mx - 1), 1) + ' %');
    });
    /* amplitud y fase de cada armónico para que la suma coincida con las formas de wf (periodo 1, origen en cruce ascendente) */
    function coefAbs(w, n) { return w === 'sq' ? (n % 2 ? 4 / (n * Math.PI) : 0) : w === 'tri' ? (n % 2 ? 8 / (n * n * Math.PI * Math.PI) : 0) : 2 / (n * Math.PI); }
    function phase(w, n) { return w === 'sq' ? 0 : w === 'tri' ? -Math.PI / 2 : Math.PI; }
  });

  /* 3.3 Diagrama fasorial RC / RL */
  EM.defineSim('c3-fasor', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Diagrama fasorial' });
    sim.group('Circuito serie');
    sim.seg('t', { label: 'Elemento reactivo', options: [['C', 'Condensador'], ['L', 'Bobina']], value: 'C' });
    sim.slider('r', { label: 'Resistencia R', min: 10, max: 10000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.slider('x', { label: 'C (µF) o L (mH)', min: 0.01, max: 1000, value: 1, unit: '', log: true, fmt: (v) => EM.fix(v, v < 1 ? 2 : 1) });
    sim.slider('f', { label: 'Frecuencia', min: 10, max: 100000, value: 159.15, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.out('z', '|Z| y fase', { hl: true }); sim.out('i', 'Corriente (10 V eficaces)'); sim.out('vr', 'V_R / V_X'); sim.out('pq', 'P, Q, S'); sim.out('fp', 'Factor de potencia');
    let ph = 0;
    sim.animate((dt) => { ph = (ph + dt * 0.35) % 1; });
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const wv = TAU * p.f, X = p.t === 'C' ? -1 / (wv * p.x * 1e-6) : wv * p.x * 1e-3, R = p.r;
      const Zm = Math.hypot(R, X), phi = Math.atan2(X, R); /* ángulo de V respecto de I */
      const V = 10, I = V / Zm, VR = I * R, VX = I * Math.abs(X);
      sim.set('z', `${fmt(Zm, 'Ω')} ∠ ${EM.fix(phi * 180 / Math.PI, 1)}°`); sim.set('i', fmt(I, 'A')); sim.set('vr', `${EM.fix(VR, 2)} V / ${EM.fix(VX, 2)} V`);
      const P = I * I * R, Q = I * I * X, Sa = V * I;
      sim.set('pq', `${fmt(P, 'W', 3)} · ${fmt(Q, 'var', 3)} · ${fmt(Sa, 'VA', 3)}`); sim.set('fp', `${EM.fix(Math.cos(phi), 3)} ${phi < 0 ? '(adelantado)' : '(retrasado)'}`);
      /* fasores, con la corriente como referencia (eje x) */
      const cx = w * 0.27, cy = h * 0.55, sc = Math.min(w * 0.22, h * 0.38) / V;
      c.save(); c.translate(cx, cy);
      c.strokeStyle = EM.col('--grid-2'); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, V * sc, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-V * sc * 1.1, 0); c.lineTo(V * sc * 1.1, 0); c.moveTo(0, -V * sc * 1.1); c.lineTo(0, V * sc * 1.1); c.stroke();
      const arrow = (x1, y1, col, lab, off = 0) => { c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(x1, y1); c.stroke(); const a = Math.atan2(y1, x1); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4)); c.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4)); c.fill(); EM.text(c, lab, x1 + Math.cos(a) * 12 + off, y1 + Math.sin(a) * 12, { size: 12.5, color: col, weight: 700, align: 'center', baseline: 'middle' }); };
      /* VR en fase con I; VX a ±90°; V = VR + VX */
      const sgn = X < 0 ? 1 : -1; /* en pantalla y crece hacia abajo: capacitivo → VX hacia abajo (−90°) */
      arrow(VR * sc, 0, EM.col('--c1'), 'V_R');
      arrow(0, sgn * VX * sc, EM.col('--c3'), p.t === 'C' ? 'V_C' : 'V_L');
      arrow(VR * sc, sgn * VX * sc, EM.col('--c2'), 'V', 14);
      c.save(); c.translate(0, -14); arrow(V * sc * 0.6, 0, EM.col('--ink-3'), 'I'); c.restore();
      /* proyección rotatoria */
      c.restore();
      /* ondas */
      const x0 = w * 0.55, pw = w * 0.42;
      const pl = new EM.Plot(c, { x: w * 0.5, y: 0, w: w * 0.5, h, xmin: 0, xmax: 2, ymin: -1.5, ymax: 1.5, ml: 40, mr: 12, mt: 14, mb: 34, xlabel: 'ciclos', ylabel: 'normalizado', grid: true });
      pl.frame();
      const ts = M.linspace(0, 2, 400);
      const vrel = (t) => Math.sin(TAU * t + phi), irel = (t) => Math.sin(TAU * t);
      pl.xy(ts, ts.map(vrel), { color: '--c2', width: 2.4 }); pl.xy(ts, ts.map(irel), { color: '--ink-3', width: 2, dash: [5, 4] });
      pl.vline(ph * 2, { color: '--accent', width: 1.4 });
      pl.legend([{ label: 'tensión total', color: '--c2' }, { label: 'corriente', color: '--ink-3', kind: 'dash' }], 'br');
    });
  });

  /* 3.4 Bode del RC */
  EM.defineSim('c3-bode', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.8, edit: 'values', panels: ['bode'], autoBode: true, hint: 'La fuente de CA de 1 V sirve como referencia para el análisis en frecuencia.',
      spec: CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000 } }, items: [{ id: 'R1', t: 'R', p: { r: 10000 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 10e-9 }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 100, max: 1e6, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R1', 'r', v) },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-10, max: 1e-5, value: 10e-9, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [{ id: 'fc', label: 'f_c = 1/(2πRC) teórica', hl: true, fn: (T) => fmt(1 / (TAU * T.net.part('R1').p.r * T.net.part('C1').p.c), 'Hz') }]
    });
    T.cfg.bodeRef = { label: 'teoría 1/√(1+(f/f_c)²)', fn: (f) => { const fc = 1 / (TAU * T.net.part('R1').p.r * T.net.part('C1').p.c); return [-10 * Math.log10(1 + (f / fc) * (f / fc)), -Math.atan(f / fc) * 180 / Math.PI]; } };
    T.setBode(10, 1e6);
  });
})();
