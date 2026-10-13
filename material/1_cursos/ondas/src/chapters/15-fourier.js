/* Capítulo 15 — Análisis de Fourier */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* Coeficientes b_n (y a_n) de las ondas clásicas, período 2π, amplitud 1 */
  const WAVES = {
    square: { n: 'Cuadrada', f: (t) => (M.wrap2pi(t) < Math.PI ? 1 : -1), c: (n) => [0, n % 2 ? 4 / (n * Math.PI) : 0] },
    saw: { n: 'Diente de sierra', f: (t) => { const u = M.wrap2pi(t + Math.PI) - Math.PI; return u / Math.PI; }, c: (n) => [0, (2 * (n % 2 ? 1 : -1)) / (n * Math.PI)] },
    tri: { n: 'Triangular', f: (t) => (2 / Math.PI) * Math.asin(Math.sin(t)), c: (n) => [0, n % 2 ? ((8 / (Math.PI * Math.PI * n * n)) * ((n - 1) / 2 % 2 ? -1 : 1)) : 0] },
    rect: { n: 'Rectificada |sen t|', f: (t) => Math.abs(Math.sin(t)), c: (n) => [n % 2 ? 0 : -4 / (Math.PI * (n * n - 1)), 0], a0: 4 / Math.PI },
    pulse: { n: 'Tren de pulsos (25 %)', f: (t) => (M.wrap2pi(t) < Math.PI / 2 ? 1 : 0), c: (n) => [Math.sin((n * Math.PI) / 2) / (n * Math.PI), (1 - Math.cos((n * Math.PI) / 2)) / (n * Math.PI)], a0: 0.5 }
  };

  /* ======================================================================
     15.1 Síntesis de Fourier
     ====================================================================== */
  EM.defineSim('fourier-synthesis', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const cs = sim.canvas({ aspect: 4 });
    sim.select('wave', { label: 'Onda', options: Object.keys(WAVES).map((k) => [k, WAVES[k].n]), value: 'square' });
    sim.slider('N', { label: 'Número de armónicos <i>N</i>', min: 1, max: 60, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.check('each', { label: 'Mostrar cada armónico', value: false });
    sim.slider('f1', { label: 'Fundamental (sonido)', min: 100, max: 600, step: 1, value: 220, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    EM.listenButton(sim, () => { const W = WAVES[sim.p.wave], f1 = sim.p.f1, N = sim.p.N; const cs2 = []; for (let n = 1; n <= N; n++) cs2.push(W.c(n)); return { fn: (t) => { let s = 0; for (let n = 1; n <= N; n++) if (n * f1 < 18000) s += cs2[n - 1][0] * Math.cos(2 * Math.PI * n * f1 * t) + cs2[n - 1][1] * Math.sin(2 * Math.PI * n * f1 * t); return s; }, dur: 1.6 }; }, { label: '♪ Escuchar la suma' });
    sim.out('ov', 'Sobrepaso máximo', { hl: true });
    sim.out('rms', 'Error cuadrático medio');
    sim.out('P', 'Potencia en los N armónicos');
    sim.onDraw(() => {
      const p = sim.p, W = WAVES[p.wave];
      const C = []; for (let n = 1; n <= p.N; n++) C.push(W.c(n));
      const a0 = W.a0 || 0;
      const S = (t) => { let s = a0 / 2; for (let n = 1; n <= p.N; n++) s += C[n - 1][0] * Math.cos(n * t) + C[n - 1][1] * Math.sin(n * t); return s; };
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 4 * Math.PI, ymin: -1.45, ymax: 1.45, xpi: true, xlabel: 't', ylabel: 'f(t)', ml: 52 });
      pl.frame();
      if (p.each) for (let n = 1; n <= Math.min(p.N, 12); n++) { const c = C[n - 1]; if (Math.hypot(c[0], c[1]) > 1e-9) pl.fn((t) => c[0] * Math.cos(n * t) + c[1] * Math.sin(n * t), { color: '--grid-2', width: 1 }); }
      pl.fn(W.f, { color: '--ink-3', width: 1.4, dash: [5, 4], n: 1200 });
      pl.fn(S, { color: '--accent', width: 2.2, n: 1600 });
      /* métricas */
      let mx = -1e9, err = 0, pw = 0, pt = 0;
      const ns = 4000;
      for (let i = 0; i < ns; i++) { const t = (2 * Math.PI * i) / ns, s = S(t), f = W.f(t); mx = Math.max(mx, s); err += (s - f) ** 2; pt += f * f; }
      err = Math.sqrt(err / ns); pt /= ns;
      pw = a0 * a0 / 4 + C.reduce((s, c) => s + 0.5 * (c[0] * c[0] + c[1] * c[1]), 0);
      const fmax = Math.max(...Array.from({ length: 200 }, (_, i) => W.f((2 * Math.PI * i) / 200)));
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0.3, xmax: 20.7, ymin: 0, ymax: 1.4, xlabel: 'armónico n', ylabel: 'amplitud Aₙ', ml: 52, xticks: [1, 5, 10, 15, 20] });
      ps.frame();
      for (let n = 1; n <= 20; n++) { const c = W.c(n), A = Math.hypot(c[0], c[1]); cs.ctx.fillStyle = EM.alpha(n <= p.N ? '--c1' : '--ink-3', n <= p.N ? 0.85 : 0.25); cs.ctx.fillRect(ps.X(n) - 5, ps.Y(A), 10, ps.Y(0) - ps.Y(A)); }
      sim.set('ov', EM.fix(100 * (mx - fmax) / (p.wave === 'pulse' || p.wave === 'rect' ? 1 : 2), 2) + ' % del salto');
      sim.set('rms', EM.fix(err, 4));
      sim.set('P', EM.fix((100 * pw) / pt, 2) + ' %');
    });
  });

  /* ======================================================================
     15.2 Dibujar una onda
     ====================================================================== */
  EM.defineSim('fourier-draw', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const cs = sim.canvas({ aspect: 4 });
    const NS = 256;
    const y = new Float64Array(NS);
    for (let i = 0; i < NS; i++) y[i] = Math.sin((2 * Math.PI * i) / NS);
    sim.group('Forma');
    sim.button('Seno', () => { for (let i = 0; i < NS; i++) y[i] = Math.sin((2 * Math.PI * i) / NS); });
    sim.button('Cuadrada', () => { for (let i = 0; i < NS; i++) y[i] = i < NS / 2 ? 0.8 : -0.8; });
    sim.button('Diente', () => { for (let i = 0; i < NS; i++) y[i] = -0.9 + (1.8 * i) / NS; });
    sim.button('Vocal «a»', () => { for (let i = 0; i < NS; i++) { const t = (2 * Math.PI * i) / NS; y[i] = 0.5 * Math.sin(t) + 0.35 * Math.sin(3 * t + 1) + 0.45 * Math.sin(4 * t + 2) + 0.3 * Math.sin(5 * t) + 0.12 * Math.sin(9 * t + 1); } });
    sim.button('Aleatoria', () => { let v = 0; for (let i = 0; i < NS; i++) { v += (Math.random() - 0.5) * 0.4; v *= 0.97; y[i] = v; } let m = 0; for (let i = 0; i < NS; i++) m += y[i] / NS; for (let i = 0; i < NS; i++) y[i] -= m; }, { newRow: true });
    sim.group('Reconstrucción y sonido');
    sim.slider('N', { label: 'Armónicos usados <i>N</i>', min: 1, max: 40, step: 1, value: 40, fmt: (v) => v.toFixed(0) });
    sim.slider('f1', { label: 'Frecuencia de repetición', min: 80, max: 600, step: 1, value: 196, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.check('rph', { label: 'Fases aleatorias (mismo espectro)', value: false, onInput: () => { phs = Array.from({ length: 64 }, () => Math.random() * 2 * Math.PI); } });
    let phs = Array.from({ length: 64 }, () => Math.random() * 2 * Math.PI);
    const coeffs = () => {
      const re = Float64Array.from(y), im = new Float64Array(NS);
      EM.fft(re, im);
      const out = [];
      for (let n = 0; n <= 64; n++) { const A = (n === 0 ? 1 : 2) * Math.hypot(re[n], im[n]) / NS; out.push([A, Math.atan2(im[n], re[n])]); }
      return out;
    };
    const synth = (cf, N, t, rph) => { let s = cf[0][0] * Math.cos(cf[0][1]); for (let n = 1; n <= N; n++) s += cf[n][0] * Math.cos(n * t + (rph ? phs[n] : cf[n][1])); return s; };
    EM.listenButton(sim, () => { const cf = coeffs(), f1 = sim.p.f1, N = sim.p.N, rph = sim.p.rph; return { fn: (t) => synth(cf, Math.min(N, Math.floor(16000 / f1)), 2 * Math.PI * f1 * t, rph), dur: 1.6 }; });
    sim.hint('Dibuja sobre la gráfica con el puntero', cv);
    sim.out('P1', 'Potencia en la fundamental', { hl: true });
    sim.out('Pn', 'Potencia por encima del armónico 10');
    let pl = null, last = null;
    EM.pointer(cv, {
      down: (px, py) => { if (!pl || !pl.inside(px, py)) return null; last = null; paint(px, py); return 1; },
      move: (_, px, py) => paint(px, py),
      up: () => { last = null; },
      hover: (px, py) => (pl && pl.inside(px, py) ? 'crosshair' : false)
    });
    function paint(px, py) {
      const i = Math.round(M.clamp(pl.invX(px), 0, 1) * (NS - 1)), v = M.clamp(pl.invY(py), -1.2, 1.2);
      if (last) { const [i0, v0] = last; const a = Math.min(i0, i), b = Math.max(i0, i); for (let k = a; k <= b; k++) y[k] = b === a ? v : v0 + ((v - v0) * (k - i0)) / (i - i0); }
      else y[i] = v;
      last = [i, v];
      sim.redraw();
    }
    sim.onDraw(() => {
      const p = sim.p, cf = coeffs();
      EM.draw.clear(cv);
      pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: -1.3, ymax: 1.3, xlabel: 't / T (un período)', ylabel: 'señal', ml: 52 });
      pl.frame();
      pl.xy(Array.from({ length: NS }, (_, i) => i / (NS - 1)), Array.from(y), { color: '--ink-3', width: 2.2 });
      pl.fn((u) => synth(cf, p.N, 2 * Math.PI * u, p.rph), { color: '--accent', width: 1.8, n: 600 });
      EM.draw.clear(cs);
      const mx = Math.max(1e-6, ...cf.slice(1, 41).map((c) => c[0]));
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0.3, xmax: 40.7, ymin: 0, ymax: 1.1, xlabel: 'armónico n', ylabel: 'Aₙ (relativa)', ml: 52, xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40] });
      ps.frame();
      for (let n = 1; n <= 40; n++) { const A = cf[n][0] / mx; cs.ctx.fillStyle = EM.alpha(n <= p.N ? '--c1' : '--ink-3', n <= p.N ? 0.85 : 0.25); cs.ctx.fillRect(ps.X(n) - 3, ps.Y(A), 6, ps.Y(0) - ps.Y(A)); }
      let tot = 0, hi = 0;
      for (let n = 1; n <= 64; n++) { tot += cf[n][0] ** 2; if (n > 10) hi += cf[n][0] ** 2; }
      sim.set('P1', tot > 0 ? EM.fix((100 * cf[1][0] ** 2) / tot, 1) + ' %' : '—');
      sim.set('Pn', tot > 0 ? EM.fix((100 * hi) / tot, 2) + ' %' : '—');
    });
  });

  /* ======================================================================
     15.3 Transformada de Fourier de pulsos
     ====================================================================== */
  EM.defineSim('fourier-transform', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.15 });
    const cf = sim.canvas({ aspect: 1.15 });
    sim.select('env', { label: 'Envolvente', options: [['gauss', 'Gaussiana'], ['rect', 'Rectangular (N ciclos)'], ['exp', 'Exponencial (golpe amortiguado)']], value: 'gauss' });
    sim.slider('tau', { label: 'Duración característica <i>τ</i>', min: 0.5, max: 60, value: 6, log: true, step: 0.05, unit: 'ms', fmt: (v) => EM.fix(v, 2) });
    sim.slider('f0', { label: 'Frecuencia portadora <i>f</i><sub>0</sub>', min: 200, max: 1500, step: 10, value: 600, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    EM.listenButton(sim, () => ({ fn: (t) => sig(t - 0.25), dur: 0.5 }));
    sim.out('dt', 'Δ<i>t</i> (desviación de |<i>f</i>|²)');
    sim.out('df', 'Δ<i>f</i> (desviación de |<i>F</i>|²)');
    sim.out('pr', 'Δ<i>t</i> · Δ<i>ω</i> (mínimo ½)', { hl: true });
    sim.out('nc', 'Ciclos dentro del pulso');
    const envF = (t) => {
      const p = sim.p, tau = p.tau / 1000;
      if (p.env === 'gauss') return Math.exp(-(t * t) / (2 * tau * tau));
      if (p.env === 'rect') return Math.abs(t) <= tau ? 1 : 0;
      return t >= 0 ? Math.exp(-t / tau) : 0;
    };
    const sig = (t) => envF(t) * Math.cos(2 * Math.PI * sim.p.f0 * t);
    const NS = 8192, fs = 20000;
    let cache = null;
    sim.onDraw(() => {
      const p = sim.p, key = p.env + p.tau + p.f0;
      if (!cache || cache.key !== key) {
        const re = new Float64Array(NS), im = new Float64Array(NS);
        let st = 0, st2 = 0, sw = 0;
        for (let i = 0; i < NS; i++) { const t = (i - NS / 2) / fs; re[i] = sig(t); const e = envF(t) ** 2; sw += e; st += e * t; st2 += e * t * t; }
        const mt = st / sw, dT = Math.sqrt(Math.max(0, st2 / sw - mt * mt));
        EM.fft(re, im);
        const spec = [];
        let sf = 0, sf2 = 0, sp = 0;
        for (let k = 0; k < NS / 2; k++) { const f = (k * fs) / NS, P = re[k] * re[k] + im[k] * im[k]; spec.push([f, P]); sp += P; sf += P * f; sf2 += P * f * f; }
        const mf = sf / sp, dF = Math.sqrt(Math.max(0, sf2 / sp - mf * mf));
        const mx = Math.max(...spec.map((q) => q[1]));
        cache = { key, spec: spec.map(([f, P]) => [f, P / mx]), dT, dF };
      }
      const C = cache;
      EM.draw.clear(ct);
      const tw = Math.max(5 * p.tau, 4);
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: -tw, xmax: tw, ymin: -1.15, ymax: 1.15, xlabel: 't (ms)', ylabel: 'señal', ml: 52 });
      pt.frame();
      pt.fn((tm) => sig(tm / 1000), { color: '--accent', width: 1.2, n: 2400 });
      pt.fn((tm) => envF(tm / 1000), { color: '--c1', width: 1.4, dash: [5, 4], n: 800 });
      EM.draw.clear(cf);
      const fw = Math.min(1500, Math.max(40, 1.5 / (p.tau / 1000)));
      const pf = new EM.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: Math.max(0, p.f0 - fw), xmax: p.f0 + fw, ymin: 0, ymax: 1.08, xlabel: 'f (Hz)', ylabel: '|F(f)|² relativo', ml: 52 });
      pf.frame();
      pf.path(C.spec, { color: '--c1', width: 2, fill: '--c1', fillAlpha: 0.12 });
      pf.vline(p.f0, { color: '--ink-3', label: 'f₀' });
      const prod = C.dT * 2 * Math.PI * C.dF;
      sim.set('dt', EM.si(C.dT, 's'));
      sim.set('df', EM.fix(C.dF, 1) + ' Hz' + (p.env !== 'gauss' ? ' (crece con la banda considerada)' : ''));
      sim.set('pr', EM.fix(prod, 3) + (p.env === 'gauss' ? ' (gaussiana: mínimo)' : ''));
      sim.set('nc', EM.fix(p.f0 * (p.env === 'rect' ? 2 * p.tau : p.env === 'gauss' ? 2.355 * p.tau : p.tau) / 1000, 1));
    });
  });
})();
