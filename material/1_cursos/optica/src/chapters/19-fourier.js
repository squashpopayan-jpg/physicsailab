/* Capítulo 19 — Óptica de Fourier y holografía */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* Rasteriza un dibujo en una matriz N×N de valores 0..1 */
  const raster = (N, draw) => {
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, N, N); x.fillStyle = '#FFF'; x.strokeStyle = '#FFF';
    draw(x, N);
    const d = x.getImageData(0, 0, N, N).data, out = new Float64Array(N * N);
    for (let i = 0; i < N * N; i++) out[i] = d[4 * i] / 255;
    return out;
  };
  const gray = (g) => [g, g, g];

  /* 19.1 Patrones por FFT */
  EM.defineSim('fft-abertura', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const SH = [['sq', 'Cuadrado'], ['circ', 'Círculo'], ['ds', 'Doble rendija'], ['gr', 'Red de 7 rendijas'], ['tri', 'Triángulo'], ['hex', 'Hexágono'], ['ann', 'Anillo'], ['F', 'Letra F']];
    sim.select('s', { label: 'Abertura', options: SH, value: 'tri' });
    sim.slider('sz', { label: 'Tamaño de la abertura', min: 10, max: 60, step: 1, value: 32, unit: 'px', fmt: (v) => v.toFixed(0) });
    sim.check('log', { label: 'Escala logarítmica', value: true });
    sim.out('n', 'Rejilla', { hl: true });
    const N = 256;
    let key = '', A = null, P = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.s + p.sz;
      if (k !== key) {
        key = k;
        const s = p.sz, c = N / 2;
        A = raster(N, (x) => {
          x.beginPath();
          if (p.s === 'sq') x.fillRect(c - s / 2, c - s / 2, s, s);
          else if (p.s === 'circ') { x.arc(c, c, s / 2, 0, 7); x.fill(); }
          else if (p.s === 'ds') { x.fillRect(c - s / 2, c - s / 2, s / 6, s); x.fillRect(c + s / 2 - s / 6, c - s / 2, s / 6, s); }
          else if (p.s === 'gr') { for (let i = 0; i < 7; i++) x.fillRect(c - 3.5 * (s / 5) + i * (s / 5), c - s / 2, Math.max(1, s / 15), s); }
          else if (p.s === 'tri' || p.s === 'hex') { const n = p.s === 'tri' ? 3 : 6; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; i ? x.lineTo(c + (s / 2) * Math.cos(a), c + (s / 2) * Math.sin(a)) : x.moveTo(c + (s / 2) * Math.cos(a), c + (s / 2) * Math.sin(a)); } x.fill(); }
          else if (p.s === 'ann') { x.lineWidth = Math.max(1, s / 10); x.arc(c, c, s / 2, 0, 7); x.stroke(); }
          else { x.font = `bold ${s * 1.3}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('F', c, c); }
        });
        const re = Float64Array.from(A), im = new Float64Array(N * N);
        OP.fft2(re, im, N);
        const pw = new Float64Array(N * N); let mx = 0;
        for (let i = 0; i < N * N; i++) { pw[i] = re[i] * re[i] + im[i] * im[i]; mx = Math.max(mx, pw[i]); }
        P = OP.fftshift2(pw, N).map((v) => v / mx);
      }
      const S = Math.min(H - 10, W * 0.48);
      /* abertura: recorte central de 96 px */
      const crop = (arr, w) => { const o = new Float64Array(w * w), s0 = (N - w) / 2; for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) o[j * w + i] = arr[(j + s0) * N + i + s0]; return o; };
      D.paint(ctx, crop(A, 96), 96, 96, { x: 6, y: (H - S) / 2, w: S, h: S }, (v) => gray(255 * v), { smooth: false });
      D.paint(ctx, crop(P, 160), 160, 160, { x: W - S - 6, y: (H - S) / 2, w: S, h: S }, (v) => { const t = p.log ? Math.max(0, 1 + Math.log10(v + 1e-12) / 5) : Math.pow(v, 0.5); const c = EM.cmap.inferno(t); return c; });
      EM.text(ctx, 'abertura', 6 + S / 2, (H + S) / 2 - 6, { size: 11, color: '#888', align: 'center' });
      EM.text(ctx, '|FFT|²', W - S / 2 - 6, (H + S) / 2 - 6, { size: 11, color: '#CCC', align: 'center' });
      sim.set('n', N + ' × ' + N + ' puntos, FFT radix 2');
    });
  });

  /* 19.2 Alfombra de Talbot */
  EM.defineSim('talbot', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('duty', { label: 'Fracción abierta de la red', min: 0.1, max: 0.6, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('zt', 'Longitud de Talbot 2d²/λ (d = 50 µm)', { hl: true });
    const Nx = 2048, per = 64, d = 50e-6, dx = d / per, NZ = 220;
    let key = '', img = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = p.lam * 1e-9, zT = (2 * d * d) / lam;
      EM.draw.clear(cv);
      const k = p.duty + ',' + p.lam;
      if (k !== key) {
        key = k;
        const re = new Float64Array(Nx), im = new Float64Array(Nx);
        for (let i = 0; i < Nx; i++) re[i] = (i % per) < p.duty * per ? 1 : 0;
        const cols = per * 3;
        img = new Float32Array(cols * NZ);
        for (let j = 0; j < NZ; j++) {
          const z = (1.1 * zT * j) / (NZ - 1), [R, I] = OP.angSpec1D(re, im, dx, lam, z);
          for (let i = 0; i < cols; i++) { const q = Nx / 2 + i - cols / 2; img[j * cols + i] = R[q] * R[q] + I[q] * I[q]; }
        }
      }
      const cols = per * 3, rgb = OP.lambdaRGB(p.lam, 1, 0.4);
      const r = { x: 50, y: 8, w: W - 60, h: H - 16 };
      D.paint(ctx, img, cols, NZ, r, (v) => { const t = Math.min(1, v / 3); return [rgb[0] * t, rgb[1] * t, rgb[2] * t]; });
      for (const [f, lab] of [[0.25, 'z_T/4'], [0.5, 'z_T/2'], [1, 'z_T']]) { const y = r.y + (f / 1.1) * r.h; ctx.strokeStyle = '#FFFFFF66'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, lab, r.x - 4, y + 4, { size: 11, color: '--ink-2', align: 'right' }); }
      EM.text(ctx, 'z ↓', 8, 18, { size: 11, color: '--ink-2' });
      sim.set('zt', EM.fix(zT * 1000, 3) + ' mm');
    });
  });

  /* 19.3 Filtrado espacial 4f */
  EM.defineSim('filtrado-4f', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.seg('f', { label: 'Máscara en el plano de Fourier', options: [['no', 'Ninguna'], ['lo', 'Pasabajos'], ['hi', 'Pasaaltos'], ['st', 'Quitar rayas']], value: 'st' });
    sim.slider('r', { label: 'Radio de la máscara', min: 2, max: 60, step: 1, value: 14, unit: 'px', fmt: (v) => v.toFixed(0) });
    sim.out('e', 'Energía que atraviesa la máscara', { hl: true });
    const N = 256;
    let img = null, R0 = null, I0 = null;
    const build = () => {
      img = raster(N, (x) => {
        x.font = 'bold 54px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Óptica', N / 2, N * 0.38);
        x.lineWidth = 2; x.beginPath(); x.arc(N * 0.25, N * 0.75, 30, 0, 7); x.stroke();
        for (let i = 0; i < 6; i++) x.fillRect(N * 0.55 + i * 14, N * 0.62, 6, 70);
      });
      for (let j = 0; j < N; j++) if (j % 8 < 3) for (let i = 0; i < N; i++) img[j * N + i] = Math.min(1, img[j * N + i] * 0.6 + 0.35); /* rayas horizontales */
      R0 = Float64Array.from(img); I0 = new Float64Array(N * N); OP.fft2(R0, I0, N);
    };
    sim.onDraw(() => {
      if (!img) build();
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const mask = (u, v) => { const r = Math.hypot(u, v); if (p.f === 'lo') return r <= p.r; if (p.f === 'hi') return r > p.r; if (p.f === 'st') return !(Math.abs(u) <= 2 && Math.abs(v) > p.r); return true; };
      const R = Float64Array.from(R0), I = Float64Array.from(I0);
      let e0 = 0, e1 = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i < N / 2 ? i : i - N, v = j < N / 2 ? j : j - N, q = j * N + i, e = R[q] * R[q] + I[q] * I[q]; e0 += e; if (mask(u, v)) e1 += e; else { R[q] = 0; I[q] = 0; } }
      const spec = new Float64Array(N * N); let mx = 0;
      for (let q = 0; q < N * N; q++) { spec[q] = R[q] * R[q] + I[q] * I[q]; mx = Math.max(mx, spec[q]); }
      const S2 = OP.fftshift2(spec, N);
      OP.fft2(R, I, N, true);
      const out = new Float64Array(N * N); let om = 0, on = Infinity;
      for (let q = 0; q < N * N; q++) { out[q] = Math.hypot(R[q], I[q]); om = Math.max(om, out[q]); on = Math.min(on, out[q]); }
      const S = Math.min(H - 10, W / 3 - 10), y0 = (H - S) / 2;
      D.paint(ctx, img, N, N, { x: 4, y: y0, w: S, h: S }, (v) => gray(255 * v));
      D.paint(ctx, S2, N, N, { x: W / 3 + 4, y: y0, w: S, h: S }, (v, i, j) => { const u = i - N / 2, w = j - N / 2, t = Math.max(0, 1 + Math.log10(v / mx + 1e-14) / 7), c = EM.cmap.inferno(t); return mask(u, w) ? c : [c[0] * 0.25, c[1] * 0.25, c[2] * 0.25 + 40]; });
      D.paint(ctx, out, N, N, { x: (2 * W) / 3 + 4, y: y0, w: S, h: S }, (v) => gray((255 * (v - on)) / (om - on + 1e-12)));
      EM.text(ctx, 'objeto', 4 + S / 2, y0 + S - 6, { size: 11, color: '#C33', align: 'center' });
      EM.text(ctx, 'plano de Fourier', W / 3 + 4 + S / 2, y0 + S - 6, { size: 11, color: '#DDD', align: 'center' });
      EM.text(ctx, 'imagen filtrada', (2 * W) / 3 + 4 + S / 2, y0 + S - 6, { size: 11, color: '#C33', align: 'center' });
      sim.set('e', EM.fix((100 * e1) / e0, 2) + ' %');
    });
  });

  /* 19.4 MTF y PSF con desenfoque */
  EM.defineSim('mtf', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('W', { label: 'Desenfoque W₀₂₀', min: 0, max: 2, step: 0.01, value: 0.25, unit: 'ondas', fmt: (v) => v.toFixed(2) });
    sim.slider('N', { label: 'Número f (para la escala en líneas/mm, 550 nm)', min: 1.4, max: 16, step: 0.1, value: 4, fmt: (v) => 'f/' + v.toFixed(1) });
    sim.out('fc', 'Frecuencia de corte 1/λN', { hl: true });
    sim.out('m50', 'MTF a la mitad del corte');
    sim.out('st', 'Razón de Strehl (pico de la PSF)');
    const NN = 256, rad = 32;
    let key = '', mtf = null, psf = null, strehl = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (key !== String(p.W)) {
        key = String(p.W);
        const re = new Float64Array(NN * NN), im = new Float64Array(NN * NN), c = NN / 2;
        for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) { const r2 = ((i - c) * (i - c) + (j - c) * (j - c)) / (rad * rad); if (r2 <= 1) { const ph = 2 * Math.PI * p.W * r2; re[j * NN + i] = Math.cos(ph); im[j * NN + i] = Math.sin(ph); } }
        OP.fft2(re, im, NN);
        const ps = new Float64Array(NN * NN); for (let q = 0; q < NN * NN; q++) ps[q] = re[q] * re[q] + im[q] * im[q];
        /* Strehl: pico con aberración / pico sin aberración (= área de la pupila al cuadrado) */
        let area = 0; for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) if (((i - c) * (i - c) + (j - c) * (j - c)) <= rad * rad) area++;
        strehl = Math.max(...ps) / (area * area);
        psf = OP.fftshift2(ps, NN);
        mtf = OP.mtfDefocus(NN, rad, p.W);
      }
      const S = Math.min(H - 10, W * 0.36), cw = 48;
      const crop = new Float64Array(cw * cw); let mx = 0;
      for (let j = 0; j < cw; j++) for (let i = 0; i < cw; i++) { const v = psf[(j + NN / 2 - cw / 2) * NN + i + NN / 2 - cw / 2]; crop[j * cw + i] = v; mx = Math.max(mx, v); }
      D.paint(ctx, crop, cw, cw, { x: 6, y: (H - S) / 2, w: S, h: S }, (v) => EM.cmap.inferno(Math.pow(v / mx, 0.5)));
      EM.text(ctx, 'PSF', 6 + S / 2, (H + S) / 2 - 6, { size: 11, color: '#DDD', align: 'center' });
      const pl = new EM.Plot(ctx, { x: S + 14, y: 0, w: W - S - 14, h: H, xmin: 0, xmax: 1, ymin: -0.2, ymax: 1.05, xlabel: 'frecuencia / frecuencia de corte', ylabel: 'MTF' });
      pl.frame();
      pl.fn(OP.mtfCirc, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.xy(mtf.map((_, k) => k / (2 * rad)), mtf, { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'limitada por difracción', color: '--ink-3', dash: [5, 4] }, { label: 'con desenfoque (FFT)', color: '--accent' }], 'tr');
      sim.set('fc', EM.fix(1 / (550e-6 * p.N), 0) + ' líneas/mm');
      sim.set('m50', EM.fix(mtf[rad], 3) + ' (sin desenfoque ' + EM.fix(OP.mtfCirc(0.5), 3) + ')');
      sim.set('st', EM.fix(strehl, 3));
    });
  });

  /* 19.5 Holograma de Fourier */
  EM.defineSim('holograma', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('fr', { label: 'Inclinación de la referencia (frecuencia de las franjas)', min: 0, max: 110, step: 1, value: 90, unit: 'px', fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Amplitud relativa de la referencia', min: 0.2, max: 5, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.out('s', 'Separación de las imágenes', { hl: true });
    const N = 256;
    let obj = null, Ore = null, Oim = null, key = '', holo = null, rec = null;
    const rng = OP.rng(5);
    const build = () => {
      obj = raster(N, (x) => { x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Unicauca', N / 2, N / 2); });
      /* difusor de fase aleatoria y transformada de Fourier del objeto (holograma de Fourier) */
      Ore = new Float64Array(N * N); Oim = new Float64Array(N * N);
      const objS = OP.fftshift2(obj, N); /* objeto centrado en el origen de la FFT */
      for (let q = 0; q < N * N; q++) { const ph = 2 * Math.PI * rng(); Ore[q] = objS[q] * Math.cos(ph); Oim[q] = objS[q] * Math.sin(ph); }
      OP.fft2(Ore, Oim, N);
      let s = 0; for (let q = 0; q < N * N; q++) s += Ore[q] * Ore[q] + Oim[q] * Oim[q];
      const k = 1 / Math.sqrt(s / (N * N)); for (let q = 0; q < N * N; q++) { Ore[q] *= k; Oim[q] *= k; }
    };
    sim.onDraw(() => {
      if (!obj) build();
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.fr + ',' + p.A;
      if (k !== key) {
        key = k;
        holo = new Float64Array(N * N);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const q = j * N + i, ph = (2 * Math.PI * p.fr * i) / N, rr = p.A * Math.cos(ph), ri = p.A * Math.sin(ph); holo[q] = Math.pow(Ore[q] + rr, 2) + Math.pow(Oim[q] + ri, 2); }
        const re = Float64Array.from(holo), im = new Float64Array(N * N);
        OP.fft2(re, im, N, true);
        const pw = new Float64Array(N * N); for (let q = 0; q < N * N; q++) pw[q] = re[q] * re[q] + im[q] * im[q];
        rec = OP.fftshift2(pw, N);
        /* el orden cero domina: se recorta para ver las imágenes */
        const srt = Array.from(rec).sort((a, b) => a - b), cap = srt[Math.floor(srt.length * 0.9995)];
        rec = rec.map((v) => Math.min(1, v / cap));
      }
      const S = Math.min(H - 10, W / 3 - 10), y0 = (H - S) / 2;
      D.paint(ctx, obj, N, N, { x: 4, y: y0, w: S, h: S }, (v) => gray(255 * v));
      const hc = new Float64Array(96 * 96); let hm = 0, hn = Infinity;
      for (let j = 0; j < 96; j++) for (let i = 0; i < 96; i++) { const v = holo[(j + 80) * N + i + 80]; hc[j * 96 + i] = v; hm = Math.max(hm, v); hn = Math.min(hn, v); }
      D.paint(ctx, hc, 96, 96, { x: W / 3 + 4, y: y0, w: S, h: S }, (v) => gray((255 * (v - hn)) / (hm - hn + 1e-12)), { smooth: false });
      D.paint(ctx, rec, N, N, { x: (2 * W) / 3 + 4, y: y0, w: S, h: S }, (v) => EM.cmap.inferno(Math.sqrt(v)));
      EM.text(ctx, 'objeto', 4 + S / 2, y0 + S - 6, { size: 11, color: '#C33', align: 'center' });
      EM.text(ctx, 'holograma (detalle)', W / 3 + 4 + S / 2, y0 + S - 6, { size: 11, color: '#C33', align: 'center' });
      EM.text(ctx, 'reconstrucción', (2 * W) / 3 + 4 + S / 2, y0 + S - 6, { size: 11, color: '#DDD', align: 'center' });
      sim.set('s', p.fr + ' px a cada lado del orden cero' + (p.fr < 40 ? ' (se superponen con el orden cero)' : ''));
    });
  });
})();
