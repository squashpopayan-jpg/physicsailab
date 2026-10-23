/* Capítulo 10 — El ojo y el color */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const g = (l, m, s) => Math.exp(-0.5 * Math.pow((l - m) / s, 2));

  /* 10.1 Ojo reducido */
  EM.defineSim('ojo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('err', { label: 'Ojo', options: [['n', 'Normal'], ['m', 'Miope −2 D'], ['h', 'Hipermétrope +2 D'], ['p', 'Présbita']], value: 'n' });
    sim.slider('d', { label: 'Distancia del objeto', min: 0.08, max: 10, log: true, value: 2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('Pc', { label: 'Lente correctora (en contacto)', min: -6, max: 6, step: 0.25, value: 0, unit: 'D', fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(2) });
    sim.slider('pup', { label: 'Diámetro de la pupila', min: 2, max: 8, step: 0.1, value: 4, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.out('acc', 'Acomodación usada', { hl: true });
    sim.out('img', 'Imagen respecto de la retina');
    sim.out('blur', 'Desenfoque angular');
    sim.out('pts', 'Punto remoto y punto próximo (con la lente)');
    const n = 1.336, L = n / 60; /* longitud del ojo reducido (m) */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const P0 = p.err === 'm' ? 62 : p.err === 'h' ? 58 : 60, Amax = p.err === 'p' ? 1 : 8;
      const V = -1 / p.d, need = n / L - V; /* potencia necesaria para enfocar en la retina */
      const A = Math.min(Amax, Math.max(0, need - P0 - p.Pc));
      const Pt = P0 + p.Pc + A, Vp = V + Pt, Li = n / Vp; /* distancia de la imagen (m) */
      const blurD = (p.pup / 1000) * Math.abs(Li - L) / Li; /* diámetro en la retina (m) */
      const ang = (blurD / (L / n)) * (180 / Math.PI) * 60; /* minutos de arco (respecto del punto nodal ≈ L/n... aproximación) */
      /* dibujo */
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -60, 30, -16, 16, false);
      D.axis(ctx, v);
      const R = 11, cx = 11; /* globo ocular en mm (dibujo) */
      ctx.fillStyle = EM.alpha('--glass', 0.12); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(v.X(cx), v.Y(0), R * v.sx, R * v.sy, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(v.X(cx), v.Y(0), R * v.sx, R * v.sy, 0, -0.7, 0.7); ctx.stroke();
      EM.text(ctx, 'retina', v.X(cx + R) + 4, v.Y(6), { size: 11, color: '--c2' });
      ctx.strokeStyle = EM.col('--glass'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(v.X(0.6), v.Y(0), 1.2 * v.sx, 6 * v.sy, 0, Math.PI / 2, (3 * Math.PI) / 2); ctx.stroke();
      if (p.Pc) D.thinLens(ctx, v, -3, 6, p.Pc);
      const Lmm = L * 1000, Limm = Li * 1000, hp = p.pup / 2;
      /* rayos desde un punto del eje lejano (se dibuja la entrada con la vergencia del objeto) */
      for (const s of [-1, -0.5, 0.5, 1]) {
        const y = s * hp, slopeIn = y / (p.d * 1000);
        const x0 = -60, y0 = y - slopeIn * (0 - x0);
        const xe = Math.min(Limm > 0 ? Limm : 1e9, 40), ye = y * (1 - xe / Limm);
        D.ray(ctx, v, [[x0, y0], [0, y], [xe, ye]], { color: '--ray', width: 1.4, arrow: false });
      }
      if (Limm > 0 && Limm < 40) { ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(v.X(Limm), v.Y(0), 4, 0, 7); ctx.fill(); }
      const far = P0 + p.Pc - n / L, near = P0 + p.Pc + Amax - n / L;
      const fmtD = (vv) => (vv <= 0 ? '∞' : EM.fix(1 / vv, 2) + ' m');
      sim.set('acc', EM.fix(A, 2) + ' D de ' + EM.fix(Amax, 1) + ' D posibles');
      sim.set('img', Math.abs(Limm - Lmm) < 0.005 ? 'sobre la retina' : (Limm < Lmm && Limm > 0 ? EM.fix(Lmm - Limm, 3) + ' mm delante' : 'detrás de la retina (' + (Limm > 0 ? EM.fix(Limm - Lmm, 3) + ' mm' : 'virtual') + ')'));
      sim.set('blur', EM.fix(Math.abs(ang), 1) + '′' + (Math.abs(ang) < 1 ? ' (nítido)' : ''));
      sim.set('pts', 'remoto ' + (far < 0 ? 'más allá del infinito (hipermetropía)' : fmtD(far)) + ', próximo ' + fmtD(near));
    });
  });

  /* 10.2 Pupila óptima */
  EM.defineSim('agudeza', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('D', { label: 'Diámetro de la pupila', min: 1, max: 8, step: 0.05, value: 3, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda', min: 450, max: 650, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('dif', 'Difracción 1.22 λ/D', { hl: true });
    sim.out('ab', 'Aberración esférica (modelo)');
    sim.out('tot', 'Desenfoque total');
    const a0 = 1.22 * 550e-6, k = a0 / (Math.sqrt(3) * Math.pow(2.4, 4)); /* rad·mm, calibrado: óptimo en 2.4 mm a 550 nm */
    const toMin = (r) => (r * 180 * 60) / Math.PI;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const a = 1.22 * p.lam * 1e-6;
      const dif = (Dm) => toMin(a / Dm), sa = (Dm) => toMin(k * Math.pow(Dm, 3)), tot = (Dm) => Math.hypot(dif(Dm), sa(Dm));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 1, xmax: 8, ymin: 0, ymax: 4, xlabel: 'diámetro de la pupila (mm)', ylabel: 'desenfoque angular (minutos de arco)' });
      pl.frame();
      pl.fn(dif, { color: '--c1', width: 1.6, dash: [5, 4] });
      pl.fn(sa, { color: '--c2', width: 1.6, dash: [5, 4] });
      pl.fn(tot, { color: '--accent', width: 2.4 });
      pl.hline(0.5, { color: '--ink-3', label: 'separación de los conos', labelRight: true });
      pl.dot(p.D, tot(p.D), { color: '--accent', r: 6 });
      pl.legend([{ label: 'difracción', color: '--c1', dash: [5, 4] }, { label: 'aberración', color: '--c2', dash: [5, 4] }, { label: 'total', color: '--accent' }], 'tr');
      /* letra E de Snellen de 5′ vista con ese desenfoque */
      const bx = W * 0.66, bw = W * 0.32, size = Math.min(bw, H) * 0.55, px = size / 5; /* 1′ = px */
      ctx.save();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(bx, (H - bw) / 2 + 10, bw, bw - 20);
      ctx.filter = `blur(${(0.42 * tot(p.D) * px).toFixed(2)}px)`;
      const ex = bx + (bw - size) / 2, ey = H / 2 - size / 2;
      ctx.fillStyle = '#000000';
      ctx.fillRect(ex, ey, px, size);
      for (let i = 0; i < 3; i++) ctx.fillRect(ex, ey + 2 * i * px, size, px);
      ctx.restore();
      EM.text(ctx, 'letra de 5′ (agudeza 1′)', bx + bw / 2, H - 8, { size: 11, align: 'center', color: '--ink-2' });
      sim.set('dif', EM.fix(dif(p.D), 2) + '′');
      sim.set('ab', EM.fix(sa(p.D), 2) + '′');
      sim.set('tot', EM.fix(tot(p.D), 2) + '′');
    });
  });

  /* Lugar espectral y fondo del diagrama de cromaticidad (cache) */
  let cieImg = null;
  const locus = [];
  for (let l = 380; l <= 700; l += 1) locus.push(OP.xy(OP.cmf(l)));
  const inside = (x, y) => { let c = false; for (let i = 0, j = locus.length - 1; i < locus.length; j = i++) { const [xi, yi] = locus[i], [xj, yj] = locus[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  function cieBack(nx, ny) {
    const vals = new Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) / nx * 0.8, y = 0.9 - ((j + 0.5) / ny) * 0.9;
      if (!inside(x, y)) { vals[j * nx + i] = null; continue; }
      const X = x / y, Z = (1 - x - y) / y;
      let rgb = OP.xyz2lin(X, 1, Z);
      const mn = Math.min(...rgb); if (mn < 0) rgb = rgb.map((v) => v - mn);
      const mx = Math.max(...rgb); rgb = rgb.map((v) => OP.gammaS(v / mx));
      vals[j * nx + i] = rgb.map((v) => Math.round(255 * v));
    }
    return vals;
  }

  /* 10.3 Diagrama CIE */
  EM.defineSim('cie', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.slider('l1', { label: 'Luz 1: longitud de onda', min: 400, max: 700, step: 1, value: 480, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('l2', { label: 'Luz 2: longitud de onda', min: 400, max: 700, step: 1, value: 580, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('w', { label: 'Proporción de potencia de la luz 2', min: 0, max: 1, step: 0.005, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.out('xy', 'Cromaticidad de la mezcla', { hl: true });
    sim.out('cct', 'Temperatura correlacionada (si es casi blanca)');
    const nx = 160, ny = 180;
    EM.onTheme.push(() => { cieImg = null; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!cieImg) cieImg = cieBack(nx, ny);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 0.8, ymin: 0, ymax: 0.9, xlabel: 'x', ylabel: 'y' });
      const r = { x: pl.ix, y: pl.iy, w: pl.iw, h: pl.ih };
      const bg = EM.rgb('--canvas');
      D.paint(ctx, cieImg, nx, ny, r, (c) => c || bg);
      pl.frame();
      pl.path(locus.concat([locus[0]]), { color: '--ink', width: 1.4 });
      for (const l of [460, 480, 500, 520, 540, 560, 580, 600, 620]) { const q = OP.xy(OP.cmf(l)); pl.label(q[0], q[1], String(l), { dx: q[0] < 0.2 ? -26 : 6, dy: q[1] > 0.6 ? -4 : 4, size: 10 }); }
      /* lugar de Planck */
      const pk = []; for (let T = 1000; T <= 20000; T *= 1.05) pk.push(OP.planckXY(T));
      pl.path(pk, { color: '--ink', width: 1.2, dash: [4, 3] });
      /* gama sRGB */
      pl.path([[0.64, 0.33], [0.30, 0.60], [0.15, 0.06], [0.64, 0.33]], { color: '#FFFFFF', width: 1.4 });
      pl.dot(0.3127, 0.3290, { color: '#FFFFFF', r: 3.5, label: 'D65', labelColor: '--ink' });
      const c1 = OP.cmf(p.l1), c2 = OP.cmf(p.l2), mix = [0, 1, 2].map((i) => (1 - p.w) * c1[i] + p.w * c2[i]);
      const q1 = OP.xy(c1), q2 = OP.xy(c2), qm = OP.xy(mix);
      pl.path([q1, q2], { color: '--ink', width: 1.6 });
      pl.dot(q1[0], q1[1], { color: '--ink', r: 5 }); pl.dot(q2[0], q2[1], { color: '--ink', r: 5 });
      pl.dot(qm[0], qm[1], { color: '--c2', r: 7 });
      sim.set('xy', 'x = ' + EM.fix(qm[0], 4) + ', y = ' + EM.fix(qm[1], 4));
      const cct = OP.mcCamy(qm[0], qm[1]);
      const pkd = Math.min(...pk.map((q) => Math.hypot(q[0] - qm[0], q[1] - qm[1])));
      sim.set('cct', pkd < 0.02 && cct > 1500 && cct < 20000 ? EM.fix(cct, 0) + ' K' : '— (lejos del lugar de Planck)');
    });
  });

  /* 10.4 Mezcla aditiva de LED y metamerismo */
  EM.defineSim('mezcla', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const LEDS = [[630, 9, '--c2'], [530, 15, '--c3'], [455, 10, '--c1']];
    sim.slider('r', { label: 'LED rojo (630 nm)', min: 0, max: 1, step: 0.001, value: 0.6, fmt: (v) => v.toFixed(3) });
    sim.slider('g', { label: 'LED verde (530 nm)', min: 0, max: 1, step: 0.001, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.slider('b', { label: 'LED azul (455 nm)', min: 0, max: 1, step: 0.001, value: 0.4, fmt: (v) => v.toFixed(3) });
    sim.slider('T', { label: 'Cuerpo negro de referencia', min: 2500, max: 9000, step: 50, value: 5000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.button('Igualar el color', () => {
      const p = sim.p, tgt = OP.specXYZ((l) => OP.planck(l * 1e-9, p.T));
      const cols = LEDS.map(([m, s]) => OP.specXYZ((l) => g(l, m, s)));
      /* resuelve cols·w = tgt (3×3, Cramer) */
      const A = [[cols[0][0], cols[1][0], cols[2][0]], [cols[0][1], cols[1][1], cols[2][1]], [cols[0][2], cols[1][2], cols[2][2]]];
      const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      const d = det(A), w = [0, 1, 2].map((k) => det(A.map((row, i) => row.map((v, j) => (j === k ? tgt[i] : v)))) / d);
      const mx = Math.max(...w);
      if (w.every((x) => x >= 0)) { sim.ctl.r.set(+(w[0] / mx).toFixed(3), true); sim.ctl.g.set(+(w[1] / mx).toFixed(3), true); sim.ctl.b.set(+(w[2] / mx).toFixed(3)); }
    });
    sim.out('xy1', 'Mezcla de LED: x, y', { hl: true });
    sim.out('xy2', 'Cuerpo negro: x, y');
    sim.out('dif', 'Diferencia de cromaticidad');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const w = [p.r, p.g, p.b];
      const S = (l) => LEDS.reduce((s, [m, sd], i) => s + w[i] * g(l, m, sd), 0);
      const B = (l) => OP.planck(l * 1e-9, p.T);
      const X1 = OP.specXYZ(S), X2 = OP.specXYZ(B);
      const q1 = OP.xy(X1), q2 = OP.xy(X2);
      const Bm = Math.max(...[...Array(41)].map((_, i) => B(380 + i * 10)));
      const Sm = Math.max(1e-9, ...[...Array(401)].map((_, i) => S(380 + i)));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.7, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 1.1, xlabel: 'λ (nm)', ylabel: 'espectro relativo' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 5 }, 380, 780);
      pl.frame();
      pl.fn((l) => B(l) / Bm, { color: '--ink-2', width: 1.8, dash: [5, 4] });
      pl.fn((l) => S(l) / Sm, { color: '--accent', width: 2.2, n: 800 });
      const sw = (XYZ) => { const y = XYZ[1]; return OP.rgb255(OP.xyz2srgb(XYZ[0] / y * 0.8, 0.8, XYZ[2] / y * 0.8)); };
      D.swatch(ctx, W * 0.74, H * 0.12, W * 0.11, H * 0.5, sw(X1), 'LED');
      D.swatch(ctx, W * 0.86, H * 0.12, W * 0.11, H * 0.5, sw(X2), EM.fix(p.T, 0) + ' K');
      sim.set('xy1', EM.fix(q1[0], 4) + ', ' + EM.fix(q1[1], 4));
      sim.set('xy2', EM.fix(q2[0], 4) + ', ' + EM.fix(q2[1], 4));
      const dd = Math.hypot(q1[0] - q2[0], q1[1] - q2[1]);
      sim.set('dif', EM.fix(dd, 4) + (dd < 0.003 ? ' (metámeros: el ojo no los distingue)' : ''));
    });
  });
})();
