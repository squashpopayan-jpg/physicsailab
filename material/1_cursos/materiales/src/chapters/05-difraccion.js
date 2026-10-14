/* Capítulo 5 — Difracción de rayos X */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const idx = (a) => EM.millerStr(a);
  const LAM = { CuKa: ['Cu Kα', MAT.lambda.CuKa], MoKa: ['Mo Kα', MAT.lambda.MoKa], CoKa: ['Co Kα', MAT.lambda.CoKa], CrKa: ['Cr Kα', MAT.lambda.CrKa] };
  const SAMPLES = {
    Al: ['Aluminio (FCC)', 'fcc', 0.40495e-9, ['Al']], Cu: ['Cobre (FCC)', 'fcc', 0.36150e-9, ['Cu']], Fe: ['Hierro α (BCC)', 'bcc', 0.28665e-9, ['Fe']],
    Si: ['Silicio (diamante)', 'diamond', 0.543088e-9, ['Si']], NaCl: ['Cloruro de sodio (sal gema)', 'nacl', 0.56402e-9, ['Na', 'Cl']],
    KCl: ['Cloruro de potasio (sal gema, iones isoelectrónicos)', 'nacl', 0.62917e-9, ['Cl', 'Cl']], W: ['Tungsteno (BCC)', 'bcc', 0.31648e-9, ['Fe']]
  };
  EM.XRD_SAMPLES = SAMPLES;

  /* ======================================================================
     5.1 Geometría de Bragg
     ====================================================================== */
  EM.defineSim('bragg-geometry', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'Ángulo de incidencia <i>θ</i>', min: 2, max: 88, step: 0.1, value: 22, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('d', { label: 'Distancia interplanar <i>d</i>', min: 0.08, max: 0.4, step: 0.001, value: 0.2, unit: 'nm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('lam', { label: 'Longitud de onda <i>λ</i>', min: 0.05, max: 0.3, step: 0.001, value: 0.1541, unit: 'nm', fmt: (v) => EM.fix(v, 4) });
    sim.slider('N', { label: 'Planos que reflejan <i>N</i>', min: 2, max: 40, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.out('dp', 'Diferencia de camino 2<i>d</i> sen <i>θ</i>');
    sim.out('ratio', '2<i>d</i> sen <i>θ</i> / <i>λ</i>', { hl: true });
    sim.out('I', 'Intensidad relativa (N rayos)');
    sim.out('bragg', 'Ángulos de Bragg (<i>n</i> = 1, 2, …)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const th = M.rad(p.th);
      const phase = (2 * Math.PI * 2 * p.d * Math.sin(th)) / p.lam;
      const I = (ph) => { const s = Math.sin((p.N * ph) / 2), s2 = Math.sin(ph / 2); return Math.abs(s2) < 1e-9 ? 1 : Math.pow(s / (p.N * s2), 2); };
      /* esquema de planos */
      const sx = W * 0.5, nPl = Math.min(p.N, 6), gap = Math.min(28, (H * 0.5) / nPl);
      const y0 = H * 0.32;
      for (let i = 0; i < nPl; i++) {
        const y = y0 + i * gap;
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(sx - 10, y); ctx.stroke();
        for (let k = 0; k < 9; k++) EM.draw.bob(ctx, 30 + k * ((sx - 50) / 8), y, 4, { color: '--c1' });
      }
      const xc = (sx + 10) / 2;
      const L = 140;
      for (let i = 0; i < Math.min(3, nPl); i++) {
        const y = y0 + i * gap, x = xc + (i * gap) / Math.tan(th) * 0;
        const col = ['--c2', '--c3', '--c5'][i];
        EM.draw.arrow(ctx, x - L * Math.cos(th), y - L * Math.sin(th), x, y, { color: col, width: 1.8 });
        EM.draw.arrow(ctx, x, y, x + L * Math.cos(th), y - L * Math.sin(th), { color: col, width: 1.8 });
      }
      /* diferencia de camino resaltada entre los dos primeros */
      const xB = xc, yB = y0 + gap;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xB - gap * Math.sin(th) * Math.cos(th), yB - gap * Math.sin(th) * Math.sin(th)); ctx.lineTo(xB, yB);
      ctx.lineTo(xB + gap * Math.sin(th) * Math.cos(th), yB - gap * Math.sin(th) * Math.sin(th));
      ctx.stroke();
      EM.text(ctx, 'd', 12, y0 + gap / 2 + 4, { italic: true, size: 13 });
      EM.text(ctx, 'θ', xc - 40, y0 - 6, { size: 13 });
      EM.text(ctx, 'camino extra 2d sen θ (rojo)', 20, H - 10, { size: 11, color: '--ink-3' });
      /* intensidad contra ángulo */
      const pl = new EM.Plot(ctx, { x: sx, y: 0, w: W - sx, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 1.1, xlabel: 'θ (°)', ylabel: 'intensidad relativa', ml: 50 });
      pl.frame();
      const ths = M.linspace(0.2, 90, 1400);
      pl.xy(ths, ths.map((t) => I((2 * Math.PI * 2 * p.d * Math.sin(M.rad(t))) / p.lam)), { color: '--c1', width: 1.6 });
      pl.vline(p.th, { color: '--accent', dash: [], width: 2 });
      pl.dot(p.th, I(phase), { color: '--accent' });
      const br = [];
      for (let n = 1; n < 10; n++) { const s = (n * p.lam) / (2 * p.d); if (s <= 1) br.push(EM.fix(M.deg(Math.asin(s)), 2) + '°'); }
      sim.set('dp', EM.fix(2 * p.d * Math.sin(th), 4) + ' nm');
      sim.set('ratio', EM.fix((2 * p.d * Math.sin(th)) / p.lam, 3));
      sim.set('I', EM.fix(I(phase), 4));
      sim.set('bragg', br.length ? br.join(', ') : 'ninguno: λ > 2d');
    });
  });

  /* ======================================================================
     5.2 Factor de estructura como suma de fasores
     ====================================================================== */
  EM.defineSim('structure-factor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('t', { label: 'Estructura', options: [['sc', 'Cúbica simple'], ['bcc', 'BCC'], ['fcc', 'FCC'], ['diamond', 'Diamante'], ['nacl', 'Sal gema (f_Na = 11, f_Cl = 17)'], ['cscl', 'CsCl (f_Cs = 55, f_Cl = 17)']], value: 'bcc' });
    for (const k of ['h', 'k', 'l']) sim.slider(k, { label: '<i>' + k + '</i>', min: 0, max: 4, step: 1, value: k === 'h' ? 1 : 0, fmt: (v) => v.toFixed(0) });
    sim.out('F', '|<i>F<sub>hkl</sub></i>|', { hl: true });
    sim.out('I', '|<i>F</i>|² relativo al máximo posible');
    sim.out('rule', 'Regla de selección');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const C = MAT.cells[p.t];
      const f = p.t === 'nacl' ? [11, 17] : p.t === 'cscl' ? [55, 17] : [1, 1];
      const hkl = [p.h, p.k, p.l];
      const sc = Math.min(W * 0.55, H) / (2.4 * C.basis.reduce((s, [, sp]) => s + f[sp], 0));
      const ox = W * 0.32, oy = H * 0.5;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, oy); ctx.lineTo(W * 0.64, oy); ctx.moveTo(ox, 10); ctx.lineTo(ox, H - 10); ctx.stroke();
      EM.text(ctx, 'Re', W * 0.64 - 18, oy - 6, { size: 11, color: '--ink-3' });
      EM.text(ctx, 'Im', ox + 6, 18, { size: 11, color: '--ink-3' });
      let x = 0, y = 0;
      C.basis.forEach(([b, sp], i) => {
        const ph = 2 * Math.PI * (hkl[0] * b[0] + hkl[1] * b[1] + hkl[2] * b[2]);
        const dx = f[sp] * Math.cos(ph), dy = f[sp] * Math.sin(ph);
        const off = (i % 2 ? 3 : -3) * (Math.abs(dy) < 1e-9 ? 1 : 0);
        EM.draw.arrow(ctx, ox + x * sc, oy - y * sc + off, ox + (x + dx) * sc, oy - (y + dy) * sc + off, { color: EM.SPECIES[sp], width: 2.2 });
        x += dx; y += dy;
      });
      if (Math.hypot(x, y) > 1e-6) EM.draw.arrow(ctx, ox, oy, ox + x * sc, oy - y * sc, { color: '--accent', width: 3.4 });
      else EM.draw.bob(ctx, ox, oy, 6, { color: '--accent' });
      EM.text(ctx, 'fasores de cada átomo de la base y su suma F (rojo)', 14, H - 8, { size: 11, color: '--ink-3' });
      /* tabla de posiciones */
      let ty = 20;
      EM.text(ctx, 'átomo   x y z     fase', W * 0.66, ty, { size: 11, mono: true, color: '--ink-2' });
      C.basis.forEach(([b, sp], i) => {
        ty += 17;
        const ph = (hkl[0] * b[0] + hkl[1] * b[1] + hkl[2] * b[2]) % 1;
        EM.text(ctx, `${String(i + 1).padStart(2)}     ${b.map((q) => (q % 1 === 0 ? String(q) : q === 0.5 ? '½' : q === 0.25 ? '¼' : q === 0.75 ? '¾' : EM.fix(q, 2))).join(' ')}     ${EM.fix(ph * 360, 0)}°`, W * 0.66, ty, { size: 11, mono: true, color: EM.SPECIES[sp] });
      });
      const F = Math.hypot(x, y), Fmax = C.basis.reduce((s, [, sp]) => s + f[sp], 0);
      sim.set('F', EM.fix(F, 3) + (p.t === 'nacl' || p.t === 'cscl' ? '' : ' <i>f</i>'));
      sim.set('I', EM.fix((F * F) / (Fmax * Fmax), 4));
      sim.set('rule', { sc: 'todas las reflexiones', bcc: 'h + k + l par', fcc: 'h, k, l sin mezclar paridad', diamond: 'FCC y además h + k + l ≠ 4n + 2 si son pares', nacl: 'sin mezclar paridad; impares débiles (f_Na − f_Cl)', cscl: 'todas; h + k + l impar débil (f_Cs − f_Cl)' }[p.t]);
    });
  });

  /* ======================================================================
     5.3 Difractograma de polvo
     ====================================================================== */
  function patternCurve(peaks, lam, tsize, tth, amorph) {
    const out = new Float64Array(tth.length);
    if (amorph) {
      /* halo de vidrio de sílice: primer pico a q ≈ 1.5 Å⁻¹ */
      for (let i = 0; i < tth.length; i++) {
        const q = (4 * Math.PI * Math.sin(M.rad(tth[i] / 2))) / (lam * 1e10);
        out[i] = 40 * Math.exp(-Math.pow((q - 1.52) / 0.32, 2)) + 9 * Math.exp(-Math.pow((q - 2.9) / 0.5, 2)) + 5 * Math.exp(-Math.pow((q - 5.2) / 0.7, 2));
      }
      return out;
    }
    for (const pk of peaks) {
      const th = M.rad(pk.tth / 2);
      const beta = (0.9 * lam) / (tsize * 1e-9 * Math.cos(th)); // rad
      const fw = Math.max(0.06, M.deg(beta)); // ° (instrumental mínimo 0.06°)
      const g = fw / 2;
      for (let i = 0; i < tth.length; i++) { const x = (tth[i] - pk.tth) / g; out[i] += pk.I / (1 + x * x) * 1; }
    }
    return out;
  }
  EM.defineSim('xrd-pattern', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('s', { label: 'Muestra', options: Object.entries(SAMPLES).filter(([k]) => k !== 'W').map(([k, v]) => [k, v[0]]).concat([['glass', 'Vidrio de sílice (amorfo)']]), value: 'Cu' });
    sim.select('lam', { label: 'Radiación', options: Object.entries(LAM).map(([k, v]) => [k, v[0] + ' (' + EM.fix(v[1] * 1e9, 5) + ' nm)']), value: 'CuKa' });
    sim.slider('t', { label: 'Tamaño de cristalito', min: 3, max: 300, step: 1, value: 120, unit: 'nm', log: true, fmt: (v) => v.toFixed(0) });
    sim.check('lab', { label: 'Rotular los picos', value: true });
    sim.out('a', 'Parámetro de red');
    sim.out('n', 'Picos hasta 2<i>θ</i> = 140°');
    sim.out('first', 'Primer pico', { hl: true });
    sim.out('fw', 'Ancho de Scherrer del primer pico');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const lam = LAM[p.lam][1];
      const amorph = p.s === 'glass';
      const S = SAMPLES[amorph ? 'Cu' : p.s];
      const peaks = amorph ? [] : MAT.powderPattern(S[1], S[2], lam, S[3], 140);
      const tth = M.linspace(10, 140, 2600);
      const y = patternCurve(peaks, lam, p.t, tth, amorph);
      const ymax = Math.max(...y) * 1.18 || 1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 140, ymin: 0, ymax, xlabel: '2θ (°)', ylabel: 'intensidad (u. a.)', ml: 54 });
      pl.frame();
      pl.xy(tth, Array.from(y), { color: '--accent', width: 1.6 });
      if (p.lab && !amorph) for (const pk of peaks) { const i = Math.round(((pk.tth - 10) / 130) * 2599); if (y[i] > ymax * 0.03) pl.label(pk.tth, y[i], idx(pk.hkl), { dy: -6, align: 'center', size: 11, color: '--ink-2' }); }
      if (amorph) {
        sim.set('a', '— (sin orden de largo alcance)'); sim.set('n', 'ninguno: un halo ancho'); sim.set('first', 'máximo del halo cerca de 2θ = ' + EM.fix(M.deg(2 * Math.asin((1.52 * lam * 1e10) / (4 * Math.PI))), 1) + '°'); sim.set('fw', '—');
        return;
      }
      const f = peaks[0];
      sim.set('a', EM.fix(S[2] * 1e9, 5) + ' nm');
      sim.set('n', String(peaks.length));
      sim.set('first', '(' + idx(f.hkl) + ') a 2θ = ' + EM.fix(f.tth, 2) + '°, d = ' + EM.fix(f.d * 1e9, 4) + ' nm');
      sim.set('fw', EM.fix(Math.max(0.06, M.deg((0.9 * lam) / (p.t * 1e-9 * Math.cos(M.rad(f.tth / 2))))), 3) + '°');
    });
  });

  /* ======================================================================
     5.4 Indexación
     ====================================================================== */
  EM.defineSim('xrd-index', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('s', { label: 'Muestra problema', options: [['Al', 'Muestra A'], ['W', 'Muestra B'], ['Si', 'Muestra C'], ['Cu', 'Muestra D'], ['Fe', 'Muestra E']], value: 'W' });
    sim.seg('h', { label: 'Hipótesis de red', options: [['sc', 'Cúbica simple'], ['bcc', 'BCC'], ['fcc', 'FCC'], ['diamond', 'Diamante']], value: 'sc' });
    sim.check('rev', { label: 'Revelar la muestra', value: false });
    sim.out('verdict', 'Veredicto', { hl: true });
    sim.out('a', 'Parámetro <i>a</i> medio ± dispersión');
    sim.out('id', 'Identidad');
    const seqs = { sc: [1, 2, 3, 4, 5, 6, 8, 9], bcc: [2, 4, 6, 8, 10, 12, 14, 16], fcc: [3, 4, 8, 11, 12, 16, 19, 20], diamond: [3, 8, 11, 16, 19, 24, 27, 32] };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w;
      EM.draw.clear(cv);
      const S = SAMPLES[p.s], lam = MAT.lambda.CuKa;
      const peaks = MAT.powderPattern(S[1], S[2], lam, S[3], 150).slice(0, 7);
      const s2 = peaks.map((q) => Math.pow(Math.sin(M.rad(q.tth / 2)), 2));
      const seq = seqs[p.h];
      /* tabla */
      const cols = ['pico', '2θ (°)', 'sen²θ', 'cociente', 'N (hipótesis)', 'a (nm)'];
      const cx = [14, 70, 150, 235, 330, 440];
      cols.forEach((c, i) => EM.text(ctx, c, cx[i] * (W / 560), 22, { size: 11.5, weight: 700, color: '--ink-2' }));
      const as = [];
      peaks.forEach((q, i) => {
        const y = 46 + i * 21, N = seq[i];
        const a = (lam * 1e9 * Math.sqrt(N)) / (2 * Math.sqrt(s2[i]));
        as.push(a);
        const rr = (s2[i] / s2[0]) * seq[0];
        const okInt = Math.abs(rr - N) < 0.05;
        [String(i + 1), EM.fix(q.tth, 2), EM.fix(s2[i], 4), EM.fix(s2[i] / s2[0], 3), String(N) + (okInt ? '' : ' ✗'), EM.fix(a, 4)].forEach((t, k) => EM.text(ctx, t, cx[k] * (W / 560), y, { size: 12, mono: true, color: k === 4 && !okInt ? '--c2' : '--ink' }));
      });
      const mean = as.reduce((s, v) => s + v, 0) / as.length;
      const sd = Math.sqrt(as.reduce((s, v) => s + (v - mean) * (v - mean), 0) / as.length);
      const good = sd / mean < 0.002;
      sim.set('verdict', good ? 'consistente: todos los N son enteros y a es constante' : 'inconsistente: a deriva entre picos');
      sim.set('a', EM.fix(mean, 4) + ' ± ' + EM.fix(sd, 4) + ' nm');
      sim.set('id', p.rev ? S[0] + ', a = ' + EM.fix(S[2] * 1e9, 4) + ' nm' : '— (marque «revelar»)');
    });
  });
})();
