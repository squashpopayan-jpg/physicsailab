/* Capítulo 18 — Difracción de Fresnel */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, C = OP.C;

  /* 18.1 Zonas de Fresnel y abertura circular */
  EM.defineSim('zonas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Radio de la abertura', min: 0.3, max: 2, step: 0.01, value: 1, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('z', { label: 'Distancia a la pantalla', min: 0.1, max: 5, log: true, value: 1, unit: 'm', fmt: (v) => v.toFixed(3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 500, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('NF', 'Número de Fresnel a²/λz', { hl: true });
    sim.out('I', 'Intensidad en el eje (fórmula / integral)');
    let key = '', prof = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.a * 1e-3, lam = p.lam * 1e-9, z = p.z;
      EM.draw.clear(cv);
      const NF = OP.fresnelNumber(a, lam, z);
      /* abertura con zonas */
      const S = Math.min(H - 20, W * 0.28), cx = 10 + S / 2, cy = H / 2;
      ctx.fillStyle = '#111'; ctx.fillRect(10, cy - S / 2, S, S);
      const nz = Math.floor(NF) + 1;
      for (let m = Math.min(nz, 60); m >= 1; m--) { const r = Math.min(Math.sqrt(m * lam * z), a); ctx.fillStyle = m % 2 ? 'rgba(255,200,80,0.9)' : 'rgba(80,140,255,0.9)'; ctx.beginPath(); ctx.arc(cx, cy, (r / a) * (S * 0.45), 0, 7); ctx.fill(); }
      EM.text(ctx, 'zonas impares (oro) y pares (azul)', cx, cy + S / 2 + 2, { size: 10, color: '--ink-3', align: 'center', baseline: 'top' });
      /* intensidad en el eje frente a z */
      const pl = new EM.Plot(ctx, { x: S + 20, y: 0, w: (W - S - 20) * 0.55, h: H, xlog: true, xmin: 0.1, xmax: 5, ymin: 0, ymax: 4.3, xlabel: 'z (m)', ylabel: 'I en el eje / I₀' });
      pl.frame();
      pl.fn((zz) => OP.circOnAxis(a, lam, zz), { color: '--accent', width: 2, n: 1200 });
      for (const zz of [0.15, 0.25, 0.4, 0.6, 1, 1.6, 2.5, 4]) pl.dot(zz, C.abs2(OP.circField(0, a, lam, zz, 800)), { color: '--c2', r: 3.5 });
      pl.vline(z, { color: '--ink-2' });
      /* perfil radial en la pantalla */
      const k = p.a + ',' + p.z + ',' + p.lam;
      const rmax = 2 * a;
      if (k !== key) { key = k; prof = []; for (let i = 0; i <= 90; i++) { const r = (rmax * i) / 90; prof.push([r * 1000, C.abs2(OP.circField(r, a, lam, z, 300))]); } }
      const pr = new EM.Plot(ctx, { x: S + 20 + (W - S - 20) * 0.55, y: 0, w: (W - S - 20) * 0.45, h: H, xmin: 0, xmax: rmax * 1000, ymin: 0, ymax: Math.max(2, ...prof.map((q) => q[1])) * 1.05, xlabel: 'r (mm)', ylabel: 'I/I₀', ml: 40 });
      pr.frame();
      pr.path(prof, { color: D.lamRay(p.lam), width: 2 });
      pr.vline(p.a, { color: '--ink-3', label: 'borde' });
      sim.set('NF', EM.fix(NF, 3));
      sim.set('I', EM.fix(OP.circOnAxis(a, lam, z), 4) + ' / ' + EM.fix(prof[0][1], 4));
    });
  });

  /* 18.2 Mancha de Arago–Poisson */
  EM.defineSim('arago', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Radio del disco', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('z', { label: 'Distancia a la pantalla', min: 0.2, max: 5, step: 0.05, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('I0', 'Intensidad en el centro de la sombra', { hl: true });
    sim.out('r', 'Radio de la mancha 0.38λz/a');
    let key = '', prof = null;
    const lam = 633e-9;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.a * 1e-3, z = p.z;
      EM.draw.clear(cv);
      const rmax = 1.6 * a;
      const k = p.a + ',' + p.z;
      if (k !== key) { key = k; prof = []; for (let i = 0; i <= 160; i++) { const r = (rmax * i) / 160; prof.push(C.abs2(OP.diskField(r, a, lam, z, 500))); } }
      const N = 170, vals = new Float32Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const r = Math.hypot((i + 0.5) / N - 0.5, (j + 0.5) / N - 0.5) * 2 * rmax, t = (r / rmax) * 160, q = Math.floor(t); vals[j * N + i] = q >= 160 ? prof[160] : prof[q] + (t - q) * (prof[q + 1] - prof[q]); }
      const S = Math.min(H - 10, W * 0.45);
      D.paint(ctx, vals, N, N, { x: 6, y: (H - S) / 2, w: S, h: S }, D.tint([235, 60, 60], 0.5));
      const pl = new EM.Plot(ctx, { x: S + 14, y: 0, w: W - S - 14, h: H, xmin: 0, xmax: rmax * 1000, ymin: 0, ymax: Math.max(1.6, ...prof) * 1.05, xlabel: 'distancia al centro (mm)', ylabel: 'I/I₀' });
      pl.frame();
      pl.xy(prof.map((_, i) => (rmax * 1000 * i) / 160), prof, { color: '#E8484D', width: 2 });
      pl.vline(p.a, { color: '--ink-3', label: 'borde de la sombra geométrica' });
      pl.hline(1, { color: '--ink-3' });
      sim.set('I0', EM.fix(prof[0], 6) + ' (sin disco: 1)');
      sim.set('r', EM.fix(((0.3827 * lam * z) / a) * 1e6, 0) + ' µm');
    });
  });

  /* 18.3 Placa zonal */
  EM.defineSim('placa-zonal', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('r1', { label: 'Radio de la primera zona', min: 0.1, max: 1, step: 0.01, value: 0.5, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('nz', { label: 'Número de zonas', min: 4, max: 60, step: 2, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('f', 'Focal r₁²/λ', { hl: true });
    sim.out('I', 'Intensidad en el foco / incidente');
    const lam0 = 633e-9;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, r1 = p.r1 * 1e-3, lam = p.lam * 1e-9;
      EM.draw.clear(cv);
      /* radios diseñados para 633 nm: r_m = √m r₁ */
      const rad = (m) => Math.sqrt(m) * r1;
      const f0 = (r1 * r1) / lam, fd = (r1 * r1) / lam0;
      const Uz = (z) => { let re = 0, im = 0; for (let m = 0; m < p.nz; m += 2) { const a1 = (Math.PI * rad(m) * rad(m)) / (lam * z), a2 = (Math.PI * rad(m + 1) * rad(m + 1)) / (lam * z); re += Math.cos(a1) - Math.cos(a2); im += Math.sin(a1) - Math.sin(a2); } return re * re + im * im; };
      /* dibujo de la placa */
      const S = Math.min(H - 20, W * 0.3), cx = 10 + S / 2, cy = H / 2, sc = (S * 0.48) / rad(p.nz);
      ctx.fillStyle = '#FFF'; ctx.fillRect(10, cy - S / 2, S, S);
      for (let m = p.nz - 1; m >= 0; m--) { ctx.fillStyle = m % 2 ? '#111' : '#FFF'; ctx.beginPath(); ctx.arc(cx, cy, rad(m + 1) * sc, 0, 7); ctx.fill(); }
      const pl = new EM.Plot(ctx, { x: S + 20, y: 0, w: W - S - 20, h: H, xmin: 0.05 * fd, xmax: 1.4 * fd, ymin: 0, ymax: Math.max(4, Uz(f0)) * 1.08, xlabel: 'distancia z (m)', ylabel: 'I en el eje / I₀' });
      pl.frame();
      pl.fn(Uz, { color: D.lamRay(p.lam), width: 1.8, n: 2400 });
      for (const k of [1, 3, 5]) pl.vline(f0 / k, { color: '--ink-3', label: k === 1 ? 'f' : 'f/' + k, labelY: 14 });
      sim.set('f', EM.fix(f0 * 100, 2) + ' cm');
      sim.set('I', EM.fix(Uz(f0), 1) + (Math.abs(p.lam - 633) < 0.5 ? ' (N² = ' + p.nz * p.nz + ': cada zona abierta aporta amplitud 2)' : ' (la placa está diseñada para 633 nm)'));
    });
  });

  /* 18.4 Espiral de Cornu */
  EM.defineSim('cornu', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('m', { label: 'Obstáculo', options: [['e', 'Borde recto'], ['s', 'Rendija']], value: 'e' });
    sim.slider('w', { label: 'Ancho de la rendija en unidades √(λz/2)', min: 0.5, max: 12, step: 0.05, value: 4, fmt: (v) => v.toFixed(2) });
    sim.slider('v', { label: 'Punto de observación v', min: -5, max: 5, step: 0.01, value: 1.22, fmt: (v) => v.toFixed(2) });
    sim.out('I', 'Intensidad / incidente', { hl: true });
    sim.out('NF', 'Número de Fresnel de la rendija');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W * 0.42 - 20, h: H - 20 }, -0.85, 0.85, -0.85, 0.85);
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 1200; i++) { const t = -8 + (16 * i) / 1200, q = OP.fresnelCS(t); i ? ctx.lineTo(v.X(q[0]), v.Y(q[1])) : ctx.moveTo(v.X(q[0]), v.Y(q[1])); }
      ctx.stroke();
      let A, B, I;
      if (p.m === 'e') { A = [-0.5, -0.5]; B = OP.fresnelCS(p.v); I = OP.edgeI(p.v); }
      else { A = OP.fresnelCS(p.v - p.w / 2); B = OP.fresnelCS(p.v + p.w / 2); I = 0.5 * (Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2)); }
      EM.draw.arrow(ctx, v.X(A[0]), v.Y(A[1]), v.X(B[0]), v.Y(B[1]), { color: '--c2', width: 2.6 });
      const pl = new EM.Plot(ctx, { x: W * 0.42, y: 0, w: W * 0.58, h: H * 0.78, xmin: -5, xmax: 5, ymin: 0, ymax: 1.5, xlabel: 'v = y √(2/λz)', ylabel: 'I/I₀' });
      pl.frame();
      const Iv = (x) => (p.m === 'e' ? OP.edgeI(x) : (() => { const a = OP.fresnelCS(x - p.w / 2), b = OP.fresnelCS(x + p.w / 2); return 0.5 * (Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)); })());
      if (p.m === 'e') pl.band(-5, 0, { color: '--ink', alpha: 0.06 }); else { pl.band(-5, -p.w / 2, { color: '--ink', alpha: 0.06 }); pl.band(p.w / 2, 5, { color: '--ink', alpha: 0.06 }); }
      pl.fn(Iv, { color: '--accent', width: 2.2, n: 1000 });
      pl.dot(p.v, I, { color: '--c2', r: 6 });
      D.screen(ctx, { x: pl.ix, y: H * 0.86, w: pl.iw, h: H * 0.1 }, (s) => Iv(s * 5), [235, 60, 60], { max: 1.4, gamma: 0.6 });
      sim.set('I', EM.fix(I, 4) + (p.m === 'e' && Math.abs(p.v) < 0.005 ? ' (borde de la sombra: 1/4)' : ''));
      sim.set('NF', p.m === 's' ? EM.fix((p.w * p.w) / 8, 3) + ' (a²/λz con a = semiancho)' : '—');
    });
  });
})();
