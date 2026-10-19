/* Capítulo 3 · Señales digitales: muestreo, ruido y filtros */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;

  /* ---------- Muestreo y aliasing ---------- */
  MC.defineSim('muestreo', function (sim) {
    sim.cols2('2.1fr 1fr');
    const cv = sim.canvas({ aspect: 1.9, label: 'Señal y muestras' });
    const cw = sim.canvas({ aspect: 0.95, label: 'Rueda vista por una cámara' });
    sim.presets([
      { id: 'bien', label: 'Bien muestreada (100 Hz)', v: { f: 5, fs: 100 } },
      { id: 'justo', label: 'Apenas suficiente (12 Hz)', v: { f: 5, fs: 12 } },
      { id: 'alias', label: 'Aliasing (6 Hz)', v: { f: 5, fs: 6 } },
      { id: 'nyq', label: 'Justo en Nyquist (10 Hz)', v: { f: 5, fs: 10 }, note: 'Con exactamente 2 muestras por ciclo, el resultado depende de la fase: puede salir una línea plana.' },
      { id: 'vent', label: 'Ventilador filmado a 30 fps', v: { f: 29, fs: 30 }, note: 'Las aspas parecen girar despacio hacia atrás: 29 vueltas por segundo vistas 30 veces por segundo.' }
    ], { initial: 'bien' });
    sim.group('Señal');
    sim.slider('f', { label: 'Frecuencia de la señal <i>f</i>', min: 0.2, max: 40, step: 0.1, value: 5, unit: 'Hz', fmt: (v) => MC.fix(v, 1) });
    sim.group('Muestreo');
    sim.slider('fs', { label: 'Frecuencia de muestreo <i>f</i><sub>s</sub>', min: 1, max: 120, step: 0.5, value: 100, unit: 'Hz', fmt: (v) => MC.fix(v, 1) });
    sim.slider('ph', { label: 'Fase del primer dato', min: 0, max: 1, step: 0.01, value: 0.1, fmt: (v) => MC.fix(v * 360, 0) + '°' });
    sim.out('nyq', 'Frecuencia de Nyquist <i>f</i><sub>s</sub>/2');
    sim.out('ppc', 'Muestras por ciclo');
    sim.out('ap', 'Frecuencia aparente', { hl: true });
    let tw = 0;
    sim.animate((dt) => { tw += dt * 0.25; }, { button: false });
    sim.onDraw(() => {
      const f = sim.p.f, fs = sim.p.fs;
      const k = Math.round(f / fs);
      const fa = Math.abs(f - k * fs);
      sim.set('nyq', MC.fix(fs / 2, 1) + ' Hz');
      sim.set('ppc', MC.fix(fs / f, 1));
      sim.set('ap', MC.fix(fa, 2) + ' Hz' + (fa < f - 1e-6 ? ' (falsa)' : ''));
      const ctx = cv.ctx;
      D.clear(cv);
      const Tw = Math.min(2, Math.max(0.6, 6 / Math.max(fa, 0.5)));
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Tw, ymin: -1.3, ymax: 1.3, xlabel: ['t', 's'], ylabel: 'señal', mt: 14 });
      P.frame();
      const sig = (t) => Math.sin(2 * Math.PI * f * t);
      P.fn(sig, { color: '--ink-3', width: 1.2, n: 1600 });
      const t0 = sim.p.ph / fs;
      const xs = [], ys = [];
      for (let t = t0; t <= Tw; t += 1 / fs) { xs.push(t); ys.push(sig(t)); }
      P.xy(xs, ys, { color: '--accent', width: 1.6 });
      P.scatter(xs, ys, { color: '--accent', r: 4 });
      P.legend([{ label: 'señal real', color: '--ink-3' }, { label: 'lo que registra el sensor', color: '--accent' }], 'tr');
      /* rueda */
      const c2 = cw.ctx;
      D.clear(cw);
      const R = Math.min(cw.w, cw.h) * 0.36, cx = cw.w / 2, cy = cw.h / 2 + 8;
      MC.text(c2, 'Rueda con un rayo, fotografiada', cw.w / 2, 18, { size: 11.5, align: 'center', color: '--ink-2', weight: 600 });
      D.circle(c2, cx, cy, R, { color: '--ink-2', width: 2 });
      const frames = 6;
      const nFrame = Math.floor(tw * fs);
      for (let j = frames; j >= 0; j--) {
        const tt = (nFrame - j) / fs;
        const a = 2 * Math.PI * f * tt + Math.PI / 2;
        const al = j === 0 ? 1 : 0.6 - j * 0.08;
        D.line(c2, cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a), { color: j === 0 ? '--accent' : '--ink-3', width: j === 0 ? 3 : 1.5, alpha: Math.max(0.08, al) });
      }
      D.circle(c2, cx, cy, 4, { fill: '--ink' });
      MC.text(c2, `real: ${MC.fix(f, 1)} vueltas/s`, cw.w / 2, cw.h - 26, { size: 11.5, align: 'center', mono: true, color: '--ink-2' });
      MC.text(c2, `vista: ${MC.fix(fa, 2)} vueltas/s`, cw.w / 2, cw.h - 10, { size: 11.5, align: 'center', mono: true, color: '--accent' });
    });
  });

  /* ---------- Cuantización ---------- */
  MC.defineSim('cuantizacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Lecturas del convertidor' });
    sim.group('Convertidor');
    sim.slider('bits', { label: 'Bits del ADC', min: 3, max: 16, step: 1, value: 4, fmt: (v) => `${Math.round(v)} bits (${Math.pow(2, Math.round(v))} niveles)` });
    sim.slider('noise', { label: 'Ruido de la señal', min: 0, max: 3, step: 0.05, value: 0, unit: 'LSB', fmt: (v) => MC.fix(v, 2) });
    sim.slider('avg', { label: 'Lecturas promediadas por punto', min: 1, max: 256, step: 1, value: 1, log: true, fmt: (v) => String(Math.round(v)) });
    sim.button('Nuevo ruido', () => sim.redraw());
    sim.out('lsb', 'LSB (rango 3.3 V)');
    sim.out('e1', 'Error RMS de una lectura');
    sim.out('e2', 'Error RMS del promedio', { hl: true });
    sim.onDraw(() => {
      const n = Math.round(sim.p.bits), lev = Math.pow(2, n), lsb = 1 / lev;
      const N = Math.round(sim.p.avg);
      const ctx = cv.ctx;
      D.clear(cv);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0.35, ymax: 0.65, xlabel: ['t', 's'], ylabel: ['V', 'fracción del rango'], mt: 14 });
      P.frame();
      const sig = (t) => 0.5 + 0.06 * Math.sin(2 * Math.PI * 1.3 * t) + 0.02 * t;
      const xs = [], raw = [], av = [];
      let e1 = 0, e2 = 0;
      for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const v = sig(t);
        const rd = () => Math.min(lev - 1, Math.max(0, Math.floor((v + M.gauss(0, sim.p.noise * lsb)) / lsb + 0.5))) * lsb;
        const r1 = rd();
        let s = 0; for (let j = 0; j < N; j++) s += rd();
        xs.push(t); raw.push(r1); av.push(s / N);
        e1 += (r1 - v) ** 2; e2 += (s / N - v) ** 2;
      }
      if (n <= 7) P.clip((c) => { c.strokeStyle = MC.alpha('--ink-3', 0.25); c.lineWidth = 1; c.beginPath(); for (let k = 0; k <= lev; k++) { const y = P.Y(k * lsb); if (y > P.iy && y < P.iy + P.ih) { c.moveTo(P.ix, y); c.lineTo(P.ix + P.iw, y); } } c.stroke(); });
      P.xy(xs, raw, { color: '--c1', width: 1.4, alpha: 0.75 });
      if (N > 1) P.xy(xs, av, { color: '--accent', width: 2.2 });
      P.fn(sig, { color: '--c3', width: 1.6, dash: [5, 4] });
      P.legend([{ label: 'señal verdadera', color: '--c3', dash: [5, 4] }, { label: 'una lectura', color: '--c1' }].concat(N > 1 ? [{ label: `promedio de ${N}`, color: '--accent' }] : []), 'tl');
      sim.set('lsb', MC.si(3.3 * lsb, 'V'));
      sim.set('e1', MC.si(3.3 * Math.sqrt(e1 / 201), 'V'));
      sim.set('e2', MC.si(3.3 * Math.sqrt(e2 / 201), 'V'));
    });
  });

  /* ---------- Filtros ---------- */
  MC.defineSim('filtros', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Señal ruidosa y filtrada' });
    const fs = 100;
    let raw = [], tr = [], ts = [];
    function gen() {
      raw = []; tr = []; ts = [];
      for (let i = 0; i < 6 * fs; i++) {
        const t = i / fs;
        let a = t > 1 ? 0.5 : 0;
        if (t > 4.5) a = -0.3;
        if (t > 3 && t < 3.05) a += 3;
        ts.push(t); tr.push(a); raw.push(a + M.gauss(0, sim.p.noise));
      }
    }
    sim.group('Señal (acelerómetro en un carrito)');
    sim.slider('noise', { label: 'Ruido del sensor σ', min: 0, max: 0.5, step: 0.005, value: 0.15, unit: 'm/s²', fmt: (v) => MC.fix(v, 3), onInput: gen });
    sim.group('Filtros');
    sim.check('ma', { label: 'Promedio móvil centrado', value: true });
    sim.slider('N', { label: 'Ventana <i>N</i> (puntos)', min: 1, max: 101, step: 2, value: 15, fmt: (v) => `${Math.round(v)} (${Math.round((v / fs) * 1000)} ms)` });
    sim.check('ex', { label: 'Filtro exponencial (en tiempo real)', value: true });
    sim.slider('alpha', { label: 'α', min: 0.005, max: 1, step: 0.005, value: 0.08, log: true, fmt: (v) => MC.fix(v, 3) + ` (τ ≈ ${Math.round(1000 / (fs * v))} ms)` });
    sim.button('Nuevo ruido', () => { gen(); sim.redraw(); });
    sim.out('r0', 'Ruido sin filtro');
    sim.out('r1', 'Ruido tras promedio móvil');
    sim.out('r2', 'Ruido tras filtro exponencial');
    sim.out('pk', 'Pico del golpe (verdadero 3.5)');
    gen();
    sim.onDraw(() => {
      const ma = L.movAvg(raw, Math.round(sim.p.N)), ex = L.ema(raw, sim.p.alpha);
      const rms = (a) => { let s = 0, c = 0; for (let i = 0; i < a.length; i++) if (ts[i] > 1.6 && ts[i] < 2.8) { s += (a[i] - tr[i]) ** 2; c++; } return Math.sqrt(s / c); };
      sim.set('r0', MC.fix(rms(raw), 3) + ' m/s²');
      sim.set('r1', sim.p.ma ? MC.fix(rms(ma), 3) + ' m/s²' : '—');
      sim.set('r2', sim.p.ex ? MC.fix(rms(ex), 3) + ' m/s²' : '—');
      const pk = (a) => Math.max(...a.filter((_, i) => ts[i] > 2.9 && ts[i] < 3.4));
      sim.set('pk', `móvil ${sim.p.ma ? MC.fix(pk(ma), 2) : '—'} · exp. ${sim.p.ex ? MC.fix(pk(ex), 2) : '—'}`);
      const ctx = cv.ctx;
      D.clear(cv);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: -1, ymax: 3.8, xlabel: ['t', 's'], ylabel: ['a', 'm/s²'], mt: 14 });
      P.frame();
      P.xy(ts, raw, { color: '--ink-3', width: 1, alpha: 0.55 });
      P.xy(ts, tr, { color: '--c3', width: 1.6, dash: [5, 4] });
      if (sim.p.ma) P.xy(ts, ma, { color: '--c1', width: 2.2 });
      if (sim.p.ex) P.xy(ts, ex, { color: '--accent', width: 2.2 });
      P.legend([{ label: 'datos crudos', color: '--ink-3' }, { label: 'verdadera', color: '--c3', dash: [5, 4] }, { label: 'promedio móvil', color: '--c1' }, { label: 'exponencial', color: '--accent' }], 'tr');
    });
  });

  /* ---------- Derivar e integrar ---------- */
  MC.defineSim('derivar-integrar', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, label: 'Posición, velocidad y aceleración' });
    /* movimiento verdadero: acelera 1 s, velocidad constante 2 s, frena 1 s (aceleración trapezoidal suave) */
    const aT = (t) => (t > 0.5 && t < 1.5 ? 0.4 * Math.sin(Math.PI * (t - 0.5)) ** 2 : 0) - (t > 3.5 && t < 4.5 ? 0.4 * Math.sin(Math.PI * (t - 3.5)) ** 2 : 0);
    const T = 5.5;
    const tt = [], at = [], vt = [], xt = [];
    { let v = 0, x = 0.2; const h = 0.001; for (let t = 0; t <= T + 1e-9; t += h) { if (Math.round(t * 1000) % 5 === 0) { tt.push(t); at.push(aT(t)); vt.push(v); xt.push(x); } v += aT(t) * h; x += v * h; } }
    let ds = null;
    sim.group('Operación');
    sim.seg('mode', { options: [['der', 'Derivar posición'], ['int', 'Integrar aceleración']], value: 'der', onInput: () => gen() });
    sim.group('Sensor');
    sim.slider('nx', { label: 'Ruido de posición (ultrasonido)', min: 0, max: 5, step: 0.1, value: 2, unit: 'mm', fmt: (v) => MC.fix(v, 1), onInput: () => gen() });
    sim.slider('bias', { label: 'Sesgo del acelerómetro', min: -0.1, max: 0.1, step: 0.005, value: 0.05, unit: 'm/s²', fmt: (v) => MC.fix(v, 3), onInput: () => gen() });
    sim.check('fix', { label: 'Corregir: suavizar (derivar) o restar el sesgo medido en reposo (integrar)', value: false });
    sim.button('Nuevo ruido', () => gen());
    sim.out('ev', 'Error RMS de la velocidad');
    sim.out('ea', 'Error de aceleración / posición final', { hl: true });
    function gen() {
      const der = sim.p.mode === 'der';
      const fs = der ? 40 : 100;
      const t = [], y = [];
      for (let k = 0; k * (1 / fs) <= T; k++) {
        const tk = k / fs;
        const i = Math.min(tt.length - 1, Math.round(tk / 0.005));
        t.push(tk);
        y.push(der ? xt[i] + M.gauss(0, sim.p.nx / 1000) : at[i] + sim.p.bias + M.gauss(0, 0.02));
      }
      ds = { t, y, fs, der };
      sim.redraw();
    }
    gen();
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const { t, y, der } = ds;
      let x, v, a;
      if (der) {
        const ys = sim.p.fix ? L.movAvg(y, 9) : y;
        x = y; v = L.deriv(t, ys); a = L.deriv(t, sim.p.fix ? L.movAvg(v, 9) : v);
      } else {
        let b = 0;
        if (sim.p.fix) { const r = y.filter((_, i) => t[i] < 0.45); b = M.mean(r); }
        a = y.map((q) => q - b);
        v = L.cumtrapz(t, a, 0);
        x = L.cumtrapz(t, v, 0.2);
      }
      const truth = (arr, tk) => arr[Math.min(tt.length - 1, Math.round(tk / 0.005))];
      let ev = 0; for (let i = 0; i < t.length; i++) ev += (v[i] - truth(vt, t[i])) ** 2;
      sim.set('ev', MC.fix(Math.sqrt(ev / t.length) * 100, 1) + ' cm/s');
      if (der) { let ea = 0; for (let i = 0; i < t.length; i++) ea += (a[i] - truth(at, t[i])) ** 2; sim.set('ea', 'aceleración: ' + MC.fix(Math.sqrt(ea / t.length), 2) + ' m/s² RMS'); }
      else sim.set('ea', 'posición final: ' + MC.fix((x[x.length - 1] - xt[xt.length - 1]) * 100, 1) + ' cm');
      const h3 = cv.h / 3;
      const rows = [[x, xt, ['x', 'm'], '--pos'], [v, vt, ['v', 'm/s'], '--vel'], [a, at, ['a', 'm/s²'], '--acc']];
      rows.forEach(([arr, tru, lab, col], k) => {
        let lo = Math.min(...tru), hi = Math.max(...tru);
        const sp = hi - lo || 1;
        const all = arr.filter(isFinite);
        lo = Math.max(lo - sp * 1.5, Math.min(lo, ...all)); hi = Math.min(hi + sp * 1.5, Math.max(hi, ...all));
        const [ylo, yhi] = MC.niceRange(lo, hi, { zero: false });
        const P = new MC.Plot(ctx, { x: 0, y: k * h3, w: cv.w, h: h3, xmin: 0, xmax: T, ymin: ylo, ymax: yhi, xlabel: k === 2 ? ['t', 's'] : '', ylabel: lab, mt: 8, mb: k === 2 ? 34 : 18 });
        P.frame();
        P.xy(tt, tru, { color: '--ink-3', width: 1.4, dash: [5, 4] });
        P.xy(t, arr, { color: col, width: 1.6 });
        const isMeasured = (der && k === 0) || (!der && k === 2);
        MC.text(ctx, isMeasured ? 'medida' : (der ? 'derivada' : 'integrada'), P.ix + P.iw - 6, P.iy + 14, { size: 11.5, align: 'right', color: col, weight: 600, halo: true });
      });
    });
  });

  /* ---------- Espectro FFT ---------- */
  MC.defineSim('fft', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, label: 'Señal y espectro' });
    let sig = null;
    sim.presets([
      { id: 'dos', label: 'Dos frecuencias cercanas', v: { f1: 2.0, f2: 2.4, a2: 0.6, T: 4, fs: 50, noise: 0.2, gam: 0 } },
      { id: 'ruido', label: 'Oscilación enterrada en ruido', v: { f1: 3.2, f2: 8, a2: 0, T: 20, fs: 100, noise: 3, gam: 0 } },
      { id: 'amort', label: 'Péndulo amortiguado', v: { f1: 0.72, f2: 1, a2: 0, T: 30, fs: 20, noise: 0.05, gam: 0.08 } },
      { id: 'alias', label: 'Por encima de Nyquist', v: { f1: 38, f2: 5, a2: 0, T: 4, fs: 50, noise: 0.1, gam: 0 } }
    ], { initial: 'dos' });
    sim.group('Señal');
    sim.slider('f1', { label: '<i>f</i>₁', min: 0.1, max: 60, step: 0.01, value: 2, unit: 'Hz', fmt: (v) => MC.fix(v, 2) });
    sim.slider('f2', { label: '<i>f</i>₂', min: 0.1, max: 60, step: 0.01, value: 2.4, unit: 'Hz', fmt: (v) => MC.fix(v, 2) });
    sim.slider('a2', { label: 'Amplitud de <i>f</i>₂ (relativa)', min: 0, max: 1, step: 0.05, value: 0.6, fmt: (v) => MC.fix(v, 2) });
    sim.slider('gam', { label: 'Amortiguamiento γ', min: 0, max: 0.5, step: 0.01, value: 0, unit: '1/s', fmt: (v) => MC.fix(v, 2) });
    sim.slider('noise', { label: 'Ruido (σ)', min: 0, max: 4, step: 0.05, value: 0.2, fmt: (v) => MC.fix(v, 2) });
    sim.group('Registro');
    sim.slider('T', { label: 'Duración <i>T</i>', min: 1, max: 40, step: 0.5, value: 4, unit: 's', fmt: (v) => MC.fix(v, 1) });
    sim.slider('fs', { label: '<i>f</i><sub>s</sub>', min: 5, max: 200, step: 1, value: 50, unit: 'Hz', fmt: (v) => String(Math.round(v)) });
    sim.out('df', 'Resolución Δ<i>f</i> = 1/<i>T</i>');
    sim.out('pk', 'Pico principal', { hl: true });
    sim.out('ny', 'Nyquist');
    sim.dataCopy(() => ({ headers: ['t (s)', 'y'], rows: sig ? sig.t.map((t, i) => [t, sig.y[i]]) : [] }));
    sim.onChange = () => { sig = null; };
    sim.onDraw(() => {
      const { f1, f2, a2, T, fs, noise, gam } = sim.p;
      if (!sig) {
        const t = [], y = [];
        for (let k = 0; k / fs < T; k++) { const tk = k / fs; t.push(tk); y.push(Math.exp(-gam * tk) * (Math.sin(2 * Math.PI * f1 * tk) + a2 * Math.sin(2 * Math.PI * f2 * tk + 1)) + M.gauss(0, noise)); }
        sig = { t, y };
      }
      const sp = L.spectrum(sig.y, 1 / fs, { pad: 4 });
      sim.set('df', MC.fix(1 / T, 3) + ' Hz');
      sim.set('pk', MC.fix(sp.peak, 3) + ' Hz');
      sim.set('ny', MC.fix(fs / 2, 1) + ' Hz');
      const ctx = cv.ctx;
      D.clear(cv);
      const h1 = cv.h * 0.42;
      const ymax = Math.max(1.5, ...sig.y.map(Math.abs)) * 1.05;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: 0, xmax: T, ymin: -ymax, ymax, xlabel: ['t', 's'], ylabel: 'señal', mt: 10, mb: 32 });
      P.frame();
      P.xy(sig.t, sig.y, { color: '--c1', width: 1.2 });
      const fmax = Math.min(fs / 2, Math.max(5, 3 * Math.max(f1, a2 > 0 ? f2 : 0)));
      const amax = Math.max(...sp.a.slice(1)) * 1.15 || 1;
      const Q = new MC.Plot(ctx, { x: 0, y: h1 + 4, w: cv.w, h: cv.h - h1 - 4, xmin: 0, xmax: fmax, ymin: 0, ymax: amax, xlabel: ['f', 'Hz'], ylabel: 'amplitud', mt: 22, title: 'Espectro de amplitud (FFT con ventana de Hann)' });
      Q.frame();
      Q.xy(sp.f, sp.a, { color: '--accent', width: 1.6, fill: '--accent', fillAlpha: 0.15 });
      for (const [f, lab] of [[f1, 'f₁'], [f2, 'f₂']]) if (lab === 'f₁' || a2 > 0) if (f <= fmax) Q.vline(f, { color: '--c3', label: lab, dash: [3, 3] });
      Q.vline(sp.peak, { color: '--accent', dash: [], width: 1 });
    });
  });
})();
