/* Capítulo 4 — Resistores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;

  /* 4.1 Código de colores */
  EM.defineSim('c4-colores', function (sim) {
    const cv = sim.canvas({ aspect: 2.8, label: 'Resistor con bandas de colores' });
    const COL = S.COLORS;
    const digitOpts = COL.slice(0, 10).map((c, i) => [i, c.n]);
    const multOpts = COL.map((c, i) => [i, c.n + ' (×' + EM.si(c.m, '', 2).trim() + ')']);
    const tolOpts = COL.map((c, i) => [i, c.n + ' (±' + c.t + ' %)']).filter((o, i) => COL[i].t !== undefined);
    sim.group('Bandas');
    sim.seg('n', { label: 'Número de bandas', options: [[4, '4 bandas'], [5, '5 bandas']], value: 4 });
    sim.select('d1', { label: '1.ª banda (dígito)', options: digitOpts, value: 4 });
    sim.select('d2', { label: '2.ª banda (dígito)', options: digitOpts, value: 7 });
    sim.select('d3', { label: '3.ª banda (dígito, solo 5 bandas)', options: digitOpts, value: 0 });
    sim.select('m', { label: 'Banda del multiplicador', options: multOpts, value: 2 });
    sim.select('t', { label: 'Banda de tolerancia', options: tolOpts, value: 10 });
    sim.out('r', 'Valor leído', { hl: true }); sim.out('t', 'Tolerancia'); sim.out('lo', 'Intervalo real'); sim.out('e', 'Serie normalizada');
    const inSeries = (v, ser) => { const dec = Math.pow(10, Math.floor(Math.log10(v))); const m = v / dec; return ser.some((x) => Math.abs(x - m) / m < 0.006); };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const n = +p.n, digits = n === 5 ? [p.d1, p.d2, p.d3] : [p.d1, p.d2];
      const val = digits.reduce((s, i) => s * 10 + COL[i].v, 0) * COL[p.m].m, tol = COL[p.t].t;
      const bw = Math.min(w * 0.62, 560), bh = Math.min(h * 0.34, 120), x0 = (w - bw) / 2, y0 = (h - bh) / 2;
      /* terminales */
      c.strokeStyle = '#9aa3ae'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 - w * 0.12, h / 2); c.lineTo(x0 + 12, h / 2); c.moveTo(x0 + bw - 12, h / 2); c.lineTo(x0 + bw + w * 0.12, h / 2); c.stroke();
      /* cuerpo */
      const g = c.createLinearGradient(0, y0, 0, y0 + bh); g.addColorStop(0, '#ecd6a4'); g.addColorStop(0.45, '#d6b678'); g.addColorStop(1, '#b8945a');
      c.fillStyle = g; c.beginPath(); c.moveTo(x0 + bh * 0.4, y0); c.lineTo(x0 + bw - bh * 0.4, y0); c.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + bh * 0.3); c.lineTo(x0 + bw, y0 + bh * 0.7); c.quadraticCurveTo(x0 + bw, y0 + bh, x0 + bw - bh * 0.4, y0 + bh); c.lineTo(x0 + bh * 0.4, y0 + bh); c.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh * 0.7); c.lineTo(x0, y0 + bh * 0.3); c.quadraticCurveTo(x0, y0, x0 + bh * 0.4, y0); c.fill();
      /* bandas */
      const bands = n === 5 ? [p.d1, p.d2, p.d3, p.m, p.t] : [p.d1, p.d2, p.m, p.t];
      const bandW = bw * 0.065, pos = n === 5 ? [0.16, 0.28, 0.40, 0.56, 0.80] : [0.18, 0.31, 0.46, 0.8];
      bands.forEach((ci, k) => { c.fillStyle = COL[ci].hex; c.fillRect(x0 + bw * pos[k], y0 + 1, bandW, bh - 2); });
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x0 + bh * 0.4, y0 + 4, bw - bh * 0.8, bh * 0.14);
      sim.set('r', S.fmtR(val)); sim.set('t', '±' + tol + ' %');
      sim.set('lo', `${S.fmtR(val * (1 - tol / 100))} … ${S.fmtR(val * (1 + tol / 100))}`);
      const ser = []; if (inSeries(val, S.E12)) ser.push('E12'); if (inSeries(val, S.E24)) ser.push('E24'); if (inSeries(val, S.E96)) ser.push('E96');
      sim.set('e', ser.length ? ser.join(', ') : `no normalizado (E24 más próximo: ${S.fmtR(S.nearestE(val, S.E24))})`);
    });
  });

  /* 4.2 Potencia y calentamiento */
  EM.defineSim('c4-potencia', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: [], hint: 'El color naranja anuncia sobrecalentamiento. Al superar ~230 °C el resistor se abre.',
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 5 } }, items: [{ id: 'R1', t: 'R', p: { r: 100, watt: 0.25 }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión aplicada', min: 1, max: 20, step: 0.5, value: 5, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'select', id: 'w', label: 'Potencia nominal del resistor', options: [[0.125, '1/8 W'], [0.25, '1/4 W'], [0.5, '1/2 W'], [1, '1 W'], [2, '2 W'], [5, '5 W']], value: 0.25, apply: (T, v) => T.set('R1', 'watt', +v) },
        { type: 'slider', id: 'r', label: 'Resistencia', min: 10, max: 1000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('R1', 'r', v) }
      ],
      outs: [
        { id: 'p', label: 'Potencia disipada', hl: true, fn: (T) => fmt(T.v('out') * T.i('R1'), 'W') },
        { id: 'k', label: 'Relación P / P_nominal', fn: (T) => EM.fix(T.v('out') * T.i('R1') / T.net.part('R1').p.watt, 2) + ' ×' },
        { id: 't', label: 'Temperatura del cuerpo', fn: (T) => { const r = T.net.rt.R1; return r && r.T ? Math.round(r.T) + ' °C' : '—'; } },
        { id: 'e', label: 'Estado', fn: (T) => (T.net.part('R1').dead ? '<b style="color:var(--warn-ink)">quemado</b>' : 'correcto') }
      ]
    });
  });

  /* 4.3 Monte Carlo del divisor */
  EM.defineSim('c4-tolerancia', function (sim) {
    const cv = sim.canvas({ aspect: 2, label: 'Histograma de la salida del divisor' });
    sim.group('Resistores');
    sim.seg('tol', { label: 'Tolerancia de R₁ y R₂', options: [[0.1, '0.1 %'], [1, '1 %'], [5, '5 %'], [10, '10 %']], value: 1 });
    sim.button('Nueva muestra de 4000 divisores', () => { seed++; }, { primary: true });
    sim.out('m', 'Salida media', { hl: true }); sim.out('s', 'Desviación típica σ'); sim.out('mm', 'Mínimo y máximo observados'); sim.out('w', 'Peor caso teórico');
    let seed = 1;
    const rng = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, tol = sim.p.tol / 100, r = rng(seed * 7919);
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const N = 4000, vals = [];
      for (let i = 0; i < N; i++) { const a = 1 + tol * (2 * r() - 1), b = 1 + tol * (2 * r() - 1); vals.push(100 * b / (a + b)); }
      const half = 100 * tol / 2 * 1.15 + 0.02, bins = 41, hist = new Array(bins).fill(0);
      for (const v of vals) { const k = Math.floor((v - (50 - half)) / (2 * half) * bins); if (k >= 0 && k < bins) hist[k]++; }
      const hm = Math.max(...hist) * 1.12;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 50 - half, xmax: 50 + half, ymin: 0, ymax: hm, ml: 54, mr: 14, mt: 14, mb: 40, xlabel: 'salida (% de la tensión de entrada)', ylabel: 'divisores' });
      pl.frame();
      c.save(); const bwpx = pl.iw / bins;
      hist.forEach((n, k) => { c.fillStyle = EM.col('--c1'); c.globalAlpha = 0.75; c.fillRect(pl.ix + k * bwpx + 1, pl.Y(n), bwpx - 2, pl.Y(0) - pl.Y(n)); });
      c.restore();
      const worst = 100 * tol / 2;
      pl.vline(50 - worst, { color: '--c2', dash: [5, 4] }); pl.vline(50 + worst, { color: '--c2', dash: [5, 4] }); pl.vline(50, { color: '--ink-3', dash: [2, 4] });
      const mean = vals.reduce((s, v) => s + v, 0) / N, sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) * (v - mean), 0) / N);
      sim.set('m', EM.fix(mean, 3) + ' %'); sim.set('s', EM.fix(sd, 3) + ' %'); sim.set('mm', `${EM.fix(Math.min(...vals), 2)} % … ${EM.fix(Math.max(...vals), 2)} %`); sim.set('w', `±${EM.fix(worst, 3)} % (50 %)`);
    });
  });

  /* 4.4 Ruido térmico */
  EM.defineSim('c4-ruido', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Ruido térmico' });
    sim.group('Resistor y medida');
    sim.slider('r', { label: 'Resistencia', min: 100, max: 1e7, value: 1e4, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.slider('b', { label: 'Ancho de banda', min: 100, max: 1e6, value: 2e4, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.slider('t', { label: 'Temperatura', min: 200, max: 400, step: 5, value: 300, unit: 'K' });
    sim.out('vn', 'Ruido eficaz v_n', { hl: true }); sim.out('d', 'Densidad espectral'); sim.out('pp', 'Pico a pico típico (≈ 6 σ)'); sim.out('snr', 'SNR con señal de 100 µV rms');
    const N = 300; const buf = new Array(N).fill(0);
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
    sim.animate(() => { for (let k = 0; k < 5; k++) { buf.push(gauss()); buf.shift(); } });
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const vn = Math.sqrt(4 * 1.380649e-23 * p.t * p.r * p.b);
      const lim = Math.max(vn * 4.5, 1e-9);
      const unit = lim < 1e-6 ? 1e9 : lim < 1e-3 ? 1e6 : 1e3, un = lim < 1e-6 ? 'nV' : lim < 1e-3 ? 'µV' : 'mV';
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: N, ymin: -lim * unit, ymax: lim * unit, ml: 58, mr: 14, mt: 14, mb: 28, xlabel: 'tiempo →', ylabel: 'tensión (' + un + ')', xticks: [] });
      pl.frame();
      pl.xy(buf.map((_, i) => i), buf.map((g) => g * vn * unit), { color: '--c1', width: 1.4 });
      pl.hline(vn * unit, { color: '--c2', dash: [5, 4] }); pl.hline(-vn * unit, { color: '--c2', dash: [5, 4] });
      pl.legend([{ label: 'ruido', color: '--c1' }, { label: '±σ (valor eficaz)', color: '--c2', kind: 'dash' }], 'tr');
      sim.set('vn', fmt(vn, 'V')); sim.set('d', EM.si(Math.sqrt(4 * 1.380649e-23 * p.t * p.r), 'V/√Hz', 3)); sim.set('pp', fmt(6 * vn, 'V')); sim.set('snr', EM.fix(20 * Math.log10(100e-6 / vn), 1) + ' dB');
    });
  });

  /* 4.5 Resistor real en alta frecuencia */
  EM.defineSim('c4-parasitos', function (sim) {
    const cv = sim.canvas({ aspect: 2, label: 'Impedancia del resistor real' });
    const KIND = { film: ['Película axial', 10e-9, 0.3e-12], wire: ['Bobinado de potencia', 2e-6, 2e-12], smd: ['SMD 0603', 0.5e-9, 0.05e-12] };
    sim.group('Resistor');
    sim.select('k', { label: 'Tipo', options: Object.entries(KIND).map(([k, v]) => [k, v[0] + ` (L = ${EM.si(v[1], 'H', 2)}, C = ${EM.si(v[2], 'F', 2)})`]), value: 'film' });
    sim.slider('r', { label: 'Resistencia nominal', min: 1, max: 1e6, value: 1e5, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.out('f10', 'Frecuencia donde |Z| se aparta 10 % de R', { hl: true }); sim.out('tipo', 'Comportamiento dominante'); sim.out('z', '|Z| a 10 MHz');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, [nm, L, C] = KIND[p.k];
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const Z = (f) => { const wv = TAU * f, ZL = [p.r, wv * L], den = [1 - wv * C * ZL[1], wv * C * ZL[0]]; const d2 = den[0] * den[0] + den[1] * den[1]; const re = (ZL[0] * den[0] + ZL[1] * den[1]) / d2, im = (ZL[1] * den[0] - ZL[0] * den[1]) / d2; return Math.hypot(re, im); };
      const fs = M.linspace(3, 10, 300).map((e) => Math.pow(10, e));
      const mags = fs.map(Z);
      const ymin = Math.pow(10, Math.floor(Math.log10(Math.min(...mags, p.r))) - 0.0), ymax = Math.pow(10, Math.ceil(Math.log10(Math.max(...mags, p.r))));
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 1e3, xmax: 1e10, xlog: true, ymin: Math.min(ymin, p.r / 3), ymax: Math.max(ymax, p.r * 3), ylog: true, ml: 62, mr: 14, mt: 14, mb: 40, xlabel: 'frecuencia (Hz)', ylabel: '|Z| (Ω)' });
      pl.frame();
      pl.hline(p.r, { color: '--ink-3', dash: [5, 4] });
      pl.xy(fs, mags, { color: '--c1', width: 2.6 });
      let f10 = NaN; for (let i = 0; i < fs.length; i++) if (Math.abs(mags[i] - p.r) / p.r > 0.1) { f10 = fs[i]; break; }
      if (isFinite(f10)) pl.vline(f10, { color: '--c2', dash: [3, 4] });
      pl.legend([{ label: nm, color: '--c1' }, { label: 'resistor ideal', color: '--ink-3', kind: 'dash' }], 'tl');
      sim.set('f10', isFinite(f10) ? EM.si(f10, 'Hz', 3) : 'por encima de 10 GHz'); sim.set('z', fmt(Z(1e7), 'Ω'));
      const fL = p.r / (TAU * L), fC = 1 / (TAU * p.r * C);
      sim.set('tipo', fL < fC ? 'inductivo (sube desde ' + EM.si(fL, 'Hz', 2) + ')' : 'capacitivo (baja desde ' + EM.si(fC, 'Hz', 2) + ')');
    });
  });
})();
