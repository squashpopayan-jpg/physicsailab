/* Capítulo 18 — Tubos, instrumentos y escalas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);
  const vS = (T) => 331.3 * Math.sqrt(1 + T / 273.15);

  /* Nota con envolvente ADSR simple a partir de una lista [frecuencia, amplitud] */
  const note = (parts, o = {}) => (t) => {
    const at = o.attack || 0.03, dec = o.decay || 0;
    const env = Math.min(1, t / at) * (dec ? Math.exp(-t * dec) : 1);
    let s = 0;
    for (const [f, a] of parts) if (f < 16000) s += a * Math.sin(2 * Math.PI * f * t + (o.ph ? o.ph * f : 0));
    return s * env * (o.vib ? 1 + 0.02 * Math.sin(2 * Math.PI * 5 * t) : 1);
  };
  EM.note = note;

  /* ======================================================================
     18.1 Modos de una columna de aire
     ====================================================================== */
  EM.defineSim('pipe-modes', function (sim) {
    const cv = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const cg = sim.canvas({ aspect: 2.6 });
    sim.slider('L', { label: 'Longitud del tubo <i>L</i>', min: 0.1, max: 3, step: 0.01, value: 0.6, unit: 'm', fmt: f2 });
    sim.slider('T', { label: 'Temperatura del aire', min: -10, max: 40, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.seg('bc', { label: 'Extremos', options: [['oo', 'Abierto–abierto'], ['co', 'Cerrado–abierto']], value: 'oo' });
    sim.slider('n', { label: 'Modo <i>n</i>', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    EM.listenButton(sim, () => ({ fn: note([[freq(), 1]], { decay: 0.4 }), dur: 1.8 }), { label: '♪ Modo n' });
    EM.listenButton(sim, () => { const p = sim.p, f1 = freq(1); const parts = []; for (let m = 1; m <= 12; m++) { const f = p.bc === 'oo' ? m * f1 : (2 * m - 1) * f1; parts.push([f, 1 / m]); } return { fn: note(parts, { decay: 0.3, vib: true }), dur: 2 }; }, { label: '♪ Todos los modos' });
    sim.out('f', 'Frecuencia <i>f<sub>n</sub></i>', { hl: true });
    sim.out('lam', 'Longitud de onda');
    sim.out('ratio', '<i>f<sub>n</sub></i>/<i>f</i><sub>1</sub>');
    const freq = (nn) => { const p = sim.p, n = nn || p.n, v = vS(p.T); return p.bc === 'oo' ? (n * v) / (2 * p.L) : ((2 * n - 1) * v) / (4 * p.L); };
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, kL = p.bc === 'oo' ? p.n * Math.PI : ((2 * p.n - 1) * Math.PI) / 2;
      /* desplazamiento: oo → cos(kx); co (cerrado en x = 0) → sen(kx) */
      const disp = (u) => (p.bc === 'oo' ? Math.cos(kL * u) : Math.sin(kL * u));
      const pres = (u) => (p.bc === 'oo' ? Math.sin(kL * u) : -Math.cos(kL * u));
      const c = Math.cos(2 * Math.PI * 0.5 * t);
      const ctx = cv.ctx, W = cv.w, H = cv.h, x0 = 30, x1 = W - 30;
      EM.draw.clear(cv);
      ctx.fillStyle = EM.alpha('--c1', 0.06); ctx.fillRect(x0, 14, x1 - x0, H - 28);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, 14); ctx.lineTo(x1, 14); ctx.moveTo(x0, H - 14); ctx.lineTo(x1, H - 14); ctx.stroke();
      if (p.bc === 'co') { ctx.beginPath(); ctx.moveTo(x0, 14); ctx.lineTo(x0, H - 14); ctx.stroke(); }
      for (let j = 0; j < 6; j++) for (let i = 0; i <= 70; i++) {
        const u = i / 70, xx = x0 + (x1 - x0) * u + 9 * disp(u) * c, yy = 22 + (j * (H - 44)) / 5;
        ctx.fillStyle = EM.alpha('--ink-2', 0.7); ctx.beginPath(); ctx.arc(xx, yy, 2, 0, 7); ctx.fill();
      }
      EM.draw.clear(cg);
      const pl = new EM.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: 1, ymin: -1.3, ymax: 1.3, xlabel: 'x / L', ylabel: 'amplitud', ml: 52 });
      pl.frame();
      pl.fn(disp, { color: '--accent', width: 2.2 });
      pl.fn(pres, { color: '--c2', width: 2, dash: [6, 4] });
      pl.legend([{ label: 'desplazamiento', color: '--accent' }, { label: 'presión', color: '--c2', dash: [6, 4] }], 'br');
      const f = freq();
      sim.set('f', EM.fix(f, 1) + ' Hz');
      sim.set('lam', EM.si(vS(p.T) / f, 'm'));
      sim.set('ratio', EM.fix(f / freq(1), 0));
    });
  });

  /* ======================================================================
     18.2 Tubo de resonancia
     ====================================================================== */
  EM.defineSim('resonance-tube', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.75 });
    const cp = sim.canvas({ aspect: 0.75 });
    sim.slider('f', { label: 'Frecuencia del diapasón', min: 256, max: 1024, step: 1, value: 512, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('h', { label: 'Columna de aire', min: 0.02, max: 1, step: 0.001, value: 0.12, fmt: (v) => EM.fix(100 * v, 1) + ' cm' });
    sim.slider('T', { label: 'Temperatura', min: 0, max: 35, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('a', { label: 'Radio del tubo', min: 0.5, max: 3, step: 0.1, value: 1.5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.button('Bajar el agua lentamente', () => { lowering = true; sim.ctl.h.set(0.02); });
    sim.out('A', 'Intensidad del sonido (relativa)', { hl: true });
    sim.out('res', 'Resonancias esperadas');
    let lowering = false, t = 0;
    const amp = (h) => { const p = sim.p, v = vS(p.T), k = (2 * Math.PI * p.f) / v, Le = h + 0.006 * p.a; const s = Math.cos(k * Le); return 1 / Math.sqrt(s * s + 0.004); };
    sim.animate((dt) => { t += dt; if (lowering) { const nh = sim.p.h + dt * 0.04; if (nh >= 1) lowering = false; sim.ctl.h.set(Math.min(1, nh), true); } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const top = 40, bot = H - 14, sc = (bot - top) / 1.05, tx = W * 0.5, tw = 34;
      const wl = top + p.h * sc;
      ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.fillRect(tx - tw / 2, wl, tw, bot - wl);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx - tw / 2, top); ctx.lineTo(tx - tw / 2, bot); ctx.lineTo(tx + tw / 2, bot); ctx.lineTo(tx + tw / 2, top); ctx.stroke();
      /* diapasón */
      const vib = 2 * Math.sin(t * 40);
      ctx.fillStyle = EM.col('--ink-3');
      ctx.fillRect(tx - 14 + vib, top - 34, 5, 26); ctx.fillRect(tx + 9 - vib, top - 34, 5, 26); ctx.fillRect(tx - 14, top - 10, 28, 4);
      /* patrón de desplazamiento en la columna */
      const v = vS(p.T), k = (2 * Math.PI * p.f) / v, A = Math.min(1, amp(p.h) / 15);
      const pts = [];
      for (let i = 0; i <= 100; i++) { const z = (p.h * i) / 100; pts.push([tx + 13 * A * Math.sin(k * (p.h - z)) * Math.cos(t * 6), top + z * sc]); }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2 });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1, ymin: 0, ymax: 17, xlabel: 'columna de aire (m)', ylabel: 'intensidad', ml: 52 });
      pl.frame();
      pl.fn(amp, { color: '--c1', width: 2, n: 800 });
      pl.dot(p.h, amp(p.h), { color: '--accent', r: 6 });
      const res = [];
      for (let m = 1; m <= 6; m++) { const L = ((2 * m - 1) * v) / (4 * p.f) - 0.006 * p.a; if (L < 1) res.push(EM.fix(100 * L, 1)); }
      sim.set('A', EM.fix(amp(p.h), 1));
      sim.set('res', res.join(', ') + ' cm (separadas λ/2 = ' + EM.fix((100 * v) / (2 * p.f), 1) + ' cm)');
    });
  });

  /* ======================================================================
     18.3 Resonador de Helmholtz
     ====================================================================== */
  EM.defineSim('helmholtz', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('V', { label: 'Volumen de aire <i>V</i>', min: 50, max: 3000, step: 10, value: 750, unit: 'mL', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Diámetro del cuello', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('L', { label: 'Longitud del cuello', min: 0.5, max: 15, step: 0.1, value: 8, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    EM.listenButton(sim, () => { const f = fH(); return { fn: (t) => { let s = Math.sin(2 * Math.PI * f * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t)); s += 0.15 * (Math.random() - 0.5); return s; }, dur: 2 }; }, { label: '♪ Soplar' });
    sim.out('f', 'Frecuencia de Helmholtz', { hl: true });
    sim.out('lam', 'Longitud de onda (≫ tamaño de la botella)');
    sim.out('Le', 'Longitud efectiva del cuello');
    const fH = () => { const p = sim.p, a = p.d / 200, S = Math.PI * a * a, Le = p.L / 100 + 1.5 * a; return (343 / (2 * Math.PI)) * Math.sqrt(S / ((p.V * 1e-6) * Le)); };
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sz = Math.cbrt(p.V / 750);
      const nw = Math.max(5, p.d * 9), nl = p.L * 7;
      const cx = W * 0.3, by = H - 16;
      const bh = Math.min(H * 0.62 - nl * 0.3, H * 0.5 * sz), bw = Math.min(W * 0.45, W * 0.28 * sz);
      ctx.fillStyle = EM.alpha('--c3', 0.15); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - nw / 2, by - bh - nl); ctx.lineTo(cx - nw / 2, by - bh); ctx.quadraticCurveTo(cx - bw / 2, by - bh, cx - bw / 2, by - bh * 0.6);
      ctx.lineTo(cx - bw / 2, by); ctx.lineTo(cx + bw / 2, by); ctx.lineTo(cx + bw / 2, by - bh * 0.6); ctx.quadraticCurveTo(cx + bw / 2, by - bh, cx + nw / 2, by - bh); ctx.lineTo(cx + nw / 2, by - bh - nl);
      ctx.fill(); ctx.stroke();
      /* pistón de aire en el cuello */
      const z = 6 * Math.sin(t * 8);
      ctx.fillStyle = EM.alpha('--accent', 0.6); ctx.fillRect(cx - nw / 2 + 2, by - bh - nl * 0.75 + z, nw - 4, nl * 0.5);
      EM.text(ctx, 'masa: aire del cuello', cx + nw / 2 + 8, by - bh - nl * 0.5, { size: 11, color: '--accent' });
      EM.text(ctx, 'resorte: aire del interior', cx + bw / 2 + 8, by - bh * 0.3, { size: 11, color: '--c3' });
      const f = fH();
      /* curva f vs V */
      const x0 = W * 0.62;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: W - x0, h: H, xmin: 50, xmax: 3000, xlog: true, ymin: 10, ymax: 2000, ylog: true, xlabel: 'V (mL)', ylabel: 'f (Hz)', ml: 52 });
      pl.frame();
      const save = p.V;
      pl.fn((V) => { p.V = V; const r = fH(); return r; }, { color: '--c1', width: 2 });
      p.V = save;
      pl.dot(p.V, f, { color: '--accent', r: 6 });
      const a = p.d / 200;
      sim.set('f', EM.fix(f, 1) + ' Hz');
      sim.set('lam', EM.si(343 / f, 'm'));
      sim.set('Le', EM.fix(p.L + 150 * a, 1) + ' cm');
    });
  });

  /* ======================================================================
     18.4 Timbre
     ====================================================================== */
  EM.defineSim('timbre', function (sim) {
    sim.cols2();
    const cw = sim.canvas({ aspect: 1.15 });
    const cs = sim.canvas({ aspect: 1.15 });
    /* formantes de vocales (Hz) */
    const VOW = { a: [800, 1200, 2500], e: [500, 1800, 2500], i: [300, 2300, 3000], o: [500, 900, 2400], u: [320, 800, 2300] };
    const formant = (f, F) => F.reduce((s, Fi, i) => s + [1, 0.6, 0.3][i] / (1 + ((f - Fi) / (60 + 0.06 * Fi)) ** 2), 0);
    const INS = {
      sine: { n: 'Sinusoide pura', a: (n) => (n === 1 ? 1 : 0) },
      flute: { n: 'Flauta', a: (n) => [1, 0.3, 0.12, 0.05, 0.03][n - 1] || 0 },
      clar: { n: 'Clarinete (grave)', a: (n) => (n % 2 ? 1 / n : 0.04 / n) },
      violin: { n: 'Violín (diente de sierra)', a: (n) => 1 / n },
      oboe: { n: 'Oboe', a: (n) => [0.4, 0.8, 1, 0.7, 0.5, 0.3, 0.2, 0.15][n - 1] || 0.1 / n },
      vow: { n: 'Voz cantada (vocal)', a: (n, f1, v) => (1 / n) * formant(n * f1, VOW[v]) }
    };
    sim.select('ins', { label: 'Fuente', options: Object.keys(INS).map((k) => [k, INS[k].n]), value: 'violin' });
    sim.seg('v', { label: 'Vocal', options: [['a', 'a'], ['e', 'e'], ['i', 'i'], ['o', 'o'], ['u', 'u']], value: 'a' });
    sim.slider('f1', { label: 'Fundamental', min: 80, max: 500, step: 1, value: 196, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.check('miss', { label: 'Quitar la fundamental', value: false });
    const parts = () => { const p = sim.p, I = INS[p.ins], out = []; for (let n = 1; n <= 40; n++) { let a = I.a(n, p.f1, p.v); if (n === 1 && p.miss) a = 0; if (n * p.f1 < 12000) out.push([n * p.f1, a]); } return out; };
    EM.listenButton(sim, () => ({ fn: note(parts(), { attack: 0.06, vib: sim.p.ins === 'vow' || sim.p.ins === 'violin' }), dur: 1.8 }));
    sim.onDraw(() => {
      const p = sim.p, P = parts();
      sim.ctl.v.show(p.ins === 'vow');
      EM.draw.clear(cw);
      const T = 2 / p.f1;
      const pw = new EM.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: T * 1000, ymin: -1.2, ymax: 1.2, xlabel: 't (ms)', ylabel: 'presión', ml: 52 });
      pw.frame();
      let mx = 1e-9;
      const xs = [], ys = [];
      for (let i = 0; i <= 600; i++) { const t = (T * i) / 600; let s = 0; for (const [f, a] of P) s += a * Math.sin(2 * Math.PI * f * t); xs.push(t * 1000); ys.push(s); mx = Math.max(mx, Math.abs(s)); }
      pw.xy(xs, ys.map((v) => v / mx), { color: '--accent', width: 2 });
      EM.draw.clear(cs);
      const am = Math.max(1e-9, ...P.map((q) => q[1]));
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 4000, ymin: 0, ymax: 1.1, xlabel: 'frecuencia (Hz)', ylabel: 'amplitud relativa', ml: 52 });
      ps.frame();
      if (p.ins === 'vow') ps.fn((f) => formant(f, VOW[p.v]) / 1.2, { color: '--c3', width: 1.2, dash: [4, 4] });
      P.forEach(([f, a]) => { if (f > 4000) return; cs.ctx.fillStyle = EM.alpha('--c1', 0.85); cs.ctx.fillRect(ps.X(f) - 2.5, ps.Y(a / am), 5, ps.Y(0) - ps.Y(a / am)); });
    });
  });

  /* ======================================================================
     18.5 Intervalos
     ====================================================================== */
  EM.defineSim('intervals', function (sim) {
    const cv = sim.canvas({ aspect: 2.5 });
    const IV = { oct: ['Octava', 2, 12], fifth: ['Quinta', 1.5, 7], fourth: ['Cuarta', 4 / 3, 5], M3: ['Tercera mayor', 1.25, 4], m3: ['Tercera menor', 1.2, 3], M6: ['Sexta mayor', 5 / 3, 9], tri: ['Tritono', 45 / 32, 6], m2: ['Segunda menor', 16 / 15, 1] };
    sim.select('iv', { label: 'Intervalo', options: Object.keys(IV).map((k) => [k, IV[k][0]]), value: 'fifth' });
    sim.seg('tune', { label: 'Afinación', options: [['just', 'Justa'], ['eq', 'Temperada']], value: 'just' });
    sim.slider('f1', { label: 'Nota grave', min: 110, max: 440, step: 1, value: 220, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    const ratio = () => { const I = IV[sim.p.iv]; return sim.p.tune === 'just' ? I[1] : Math.pow(2, I[2] / 12); };
    const tone = (f) => { const P = []; for (let n = 1; n <= 8; n++) P.push([n * f, 1 / n]); return P; };
    EM.listenButton(sim, () => ({ fn: note(tone(sim.p.f1).concat(tone(sim.p.f1 * ratio())), { attack: 0.05 }), dur: 3 }), { label: '♪ Escuchar el intervalo' });
    sim.out('r', 'Razón de frecuencias', { hl: true });
    sim.out('c', 'Tamaño en cents');
    sim.out('b', 'Batimiento más lento entre armónicos próximos');
    sim.onDraw(() => {
      const p = sim.p, r = ratio(), f2v = p.f1 * r;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 8.5 * p.f1, ymin: 0, ymax: 2.6, xlabel: 'frecuencia (Hz)', ylabel: '', ml: 20, yticks: [] });
      pl.frame();
      const ctx = cv.ctx;
      let minBeat = Infinity;
      for (let n = 1; n <= 8; n++) {
        const a = n * p.f1;
        ctx.fillStyle = EM.alpha('--c1', 0.85); ctx.fillRect(pl.X(a) - 2, pl.Y(1 + 0.8 / n), 4, pl.Y(1) - pl.Y(1 + 0.8 / n));
        for (let m = 1; m <= 8; m++) { const b = m * f2v; if (b > 8.5 * p.f1) continue; const d = Math.abs(a - b); if (d > 1e-6 && d < 40) { minBeat = Math.min(minBeat, d); pl.vline((a + b) / 2, { color: '--c2', alpha: 0.6 }); } if (d < 1e-6) pl.dot(a, 1.05, { color: '--c3', r: 6 }); }
      }
      for (let m = 1; m * f2v <= 8.5 * p.f1; m++) { const b = m * f2v; ctx.fillStyle = EM.alpha('--accent', 0.85); ctx.fillRect(pl.X(b) - 2, pl.Y(1), 4, pl.Y(1 - 0.8 / m) - pl.Y(1)); }
      pl.label(p.f1 * 0.2, 2.35, 'armónicos de la nota grave ↑', { color: '--c1' });
      pl.label(p.f1 * 0.2, 0.12, 'armónicos de la nota aguda ↓', { color: '--accent' });
      sim.set('r', EM.fix(r, 5));
      sim.set('c', EM.fix(1200 * Math.log2(r), 1) + ' cents');
      sim.set('b', isFinite(minBeat) ? EM.fix(minBeat, 2) + ' Hz' : 'coincidencias exactas (sin batimientos)');
    });
  });
})();
