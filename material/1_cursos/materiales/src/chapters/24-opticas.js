/* Capítulo 24 — Propiedades ópticas */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* Funciones de igualación de color CIE 1931 (ajuste de Wyman, Sloan y Shirley, 2013) y paso a sRGB */
  const gg = (l, m, s1, s2) => { const t = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * t * t); };
  const xbar = (l) => 1.056 * gg(l, 599.8, 37.9, 31.0) + 0.362 * gg(l, 442.0, 16.0, 26.7) - 0.065 * gg(l, 501.1, 20.4, 26.2);
  const ybar = (l) => 0.821 * gg(l, 568.8, 46.9, 40.5) + 0.286 * gg(l, 530.9, 16.3, 31.1);
  const zbar = (l) => 1.217 * gg(l, 437.0, 11.8, 36.0) + 0.681 * gg(l, 459.0, 26.0, 13.8);
  function spectrumToRGB(T) {
    let X = 0, Y = 0, Z = 0, Yw = 0;
    for (let l = 380; l <= 780; l += 2) { const t = T(l); X += t * xbar(l); Y += t * ybar(l); Z += t * zbar(l); Yw += ybar(l); }
    X /= Yw; Y /= Yw; Z /= Yw;
    const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
    /* blanco de referencia (espectro plano) */
    const g = (c) => { c = Math.max(0, c); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; };
    const wr = 1 / 1.205, wg = 1 / 0.948, wb = 1 / 0.909; // equilibrado aproximado a espectro plano
    return [g(lin[0] * wr), g(lin[1] * wg), g(lin[2] * wb)].map((c) => Math.round(255 * Math.min(1, c)));
  }
  EM.spectrumToRGB = spectrumToRGB;

  /* ======================================================================
     24.1 Fresnel y Snell
     ====================================================================== */
  const IDX = { air: ['Aire', 1.0003], water: ['Agua', 1.333], pmma: ['PMMA', 1.49], glass: ['Vidrio', 1.5], sapphire: ['Zafiro', 1.77], diamond: ['Diamante', 2.42], tio2: ['Rutilo TiO₂', 2.61] };
  EM.defineSim('fresnel-snell', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('n1', { label: 'Medio de incidencia', options: Object.entries(IDX).map(([k, v]) => [k, v[0] + ' (' + v[1] + ')']), value: 'air' });
    sim.select('n2', { label: 'Segundo medio', options: Object.entries(IDX).map(([k, v]) => [k, v[0] + ' (' + v[1] + ')']), value: 'glass' });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 89.5, step: 0.5, value: 30, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.out('t', 'Ángulo refractado', { hl: true });
    sim.out('R', '<i>R<sub>s</sub></i>, <i>R<sub>p</sub></i>, promedio');
    sim.out('sp', 'Brewster y ángulo crítico');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const n1 = IDX[p.n1][1], n2 = IDX[p.n2][1];
      const f = MAT.fresnel(n1, n2, p.th);
      const cx = W * 0.25, cy = H * 0.5, L = Math.min(W * 0.22, H * 0.45);
      ctx.fillStyle = EM.alpha('--c1', 0.06 + 0.1 * (n2 - 1)); ctx.fillRect(10, cy, W * 0.48, H - cy - 6);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(W * 0.48, cy); ctx.stroke();
      const t = M.rad(p.th);
      EM.draw.arrow(ctx, cx - L * Math.sin(t), cy - L * Math.cos(t), cx, cy, { color: '--accent', width: 3 });
      const Rm = (f.Rs + f.Rp) / 2;
      ctx.globalAlpha = Math.max(0.15, Math.min(1, Rm * 3));
      EM.draw.arrow(ctx, cx, cy, cx + L * Math.sin(t), cy - L * Math.cos(t), { color: '--accent', width: 1 + 4 * Rm });
      ctx.globalAlpha = 1;
      if (!f.tir) { const t2 = M.rad(f.tt); EM.draw.arrow(ctx, cx, cy, cx + L * Math.sin(t2), cy + L * Math.cos(t2), { color: '--c1', width: 1 + 3 * (1 - Rm) }); }
      EM.text(ctx, IDX[p.n1][0], 16, 24, { size: 12, color: '--ink-2' });
      EM.text(ctx, IDX[p.n2][0], 16, H - 12, { size: 12, color: '--ink-2' });
      if (f.tir) EM.text(ctx, 'reflexión total interna', cx + 10, cy + 30, { size: 13, color: '--c2', weight: 700 });
      /* R(θ) */
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 1.02, xlabel: 'θ (°)', ylabel: 'reflectancia', ml: 44 });
      pl.frame();
      pl.fn((a) => MAT.fresnel(n1, n2, a).Rs, { color: '--c1', width: 2 });
      pl.fn((a) => MAT.fresnel(n1, n2, a).Rp, { color: '--c3', width: 2 });
      pl.vline(p.th, { color: '--accent', dash: [] });
      pl.legend([{ label: 'R_s', color: '--c1' }, { label: 'R_p', color: '--c3' }], 'tl');
      const tb = M.deg(Math.atan(n2 / n1)), tc = n2 < n1 ? M.deg(Math.asin(n2 / n1)) : NaN;
      sim.set('t', f.tir ? '— (reflexión total)' : EM.fix(f.tt, 2) + '°');
      sim.set('R', EM.fix(f.Rs, 4) + ', ' + EM.fix(f.Rp, 4) + ', ' + EM.fix(Rm, 4));
      sim.set('sp', 'θ<sub>B</sub> = ' + EM.fix(tb, 2) + '° · θ<sub>c</sub> = ' + (isFinite(tc) ? EM.fix(tc, 2) + '°' : 'no existe (n₂ > n₁)'));
    });
  });

  /* ======================================================================
     24.2 Dispersión y prisma
     ====================================================================== */
  EM.defineSim('dispersion-prism', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('g', { label: 'Vidrio', options: [['bk7', 'BK7 (crown)'], ['sio2', 'Sílice fundida'], ['flint', 'Flint denso (Cauchy)']], value: 'bk7' });
    sim.slider('A', { label: 'Ángulo del prisma', min: 20, max: 70, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 20, max: 85, step: 0.5, value: 50, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.out('nd', '<i>n<sub>d</sub></i> (587.6 nm)', { hl: true });
    sim.out('V', 'Número de Abbe <i>V<sub>d</sub></i>');
    sim.out('dev', 'Desviación del rojo (656 nm) y del violeta (405 nm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const nf = p.g === 'bk7' ? MAT.sellmeierBK7 : p.g === 'sio2' ? MAT.sellmeierSiO2 : (l) => MAT.cauchy(1.7, 0.0135, l);
      const A = M.rad(p.A), t1 = M.rad(p.th);
      const dev = (lum) => { const n = nf(lum); const r1 = Math.asin(Math.sin(t1) / n), r2 = A - r1; const s = n * Math.sin(r2); if (Math.abs(s) > 1) return NaN; return t1 + Math.asin(s) - A; };
      /* prisma */
      const cx = W * 0.27, cy = H * 0.62, s = Math.min(W * 0.3, H * 0.8);
      const P1 = [cx - (s / 2) * Math.tan(A / 2) * 0 - s * Math.sin(A / 2), cy + s * 0.25], P2 = [cx + s * Math.sin(A / 2), cy + s * 0.25], P0 = [cx, cy + s * 0.25 - s * Math.cos(A / 2)];
      ctx.fillStyle = EM.alpha('--c1', 0.12); ctx.strokeStyle = EM.col('--ink-2'); ctx.beginPath(); ctx.moveTo(...P0); ctx.lineTo(...P1); ctx.lineTo(...P2); ctx.closePath(); ctx.fill(); ctx.stroke();
      /* rayo incidente sobre la cara izquierda */
      const mid = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2];
      const nL = [-Math.cos(A / 2), -Math.sin(A / 2)];
      const ang0 = Math.atan2(nL[1], nL[0]) + Math.PI;
      const dirIn = [Math.cos(ang0 - t1), Math.sin(ang0 - t1)];
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(mid[0] - dirIn[0] * 120, mid[1] - dirIn[1] * 120); ctx.lineTo(mid[0], mid[1]); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * 0.54, H); ctx.clip();
      for (let lnm = 400; lnm <= 700; lnm += 20) {
        const lum = lnm / 1000, n = nf(lum);
        const r1 = Math.asin(Math.sin(t1) / n);
        const din = [Math.cos(ang0 - r1), Math.sin(ang0 - r1)];
        /* intersección con la cara derecha P0–P2 */
        const ex = P2[0] - P0[0], ey = P2[1] - P0[1];
        const den = din[0] * ey - din[1] * ex; if (Math.abs(den) < 1e-9) continue;
        const u = ((P0[0] - mid[0]) * ey - (P0[1] - mid[1]) * ex) / den;
        const Q = [mid[0] + din[0] * u, mid[1] + din[1] * u];
        const c = EM.wavelengthRGB(lnm), col = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mid[0], mid[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke();
        const d = dev(lum); if (!isFinite(d)) continue;
        const outAng = Math.atan2(dirIn[1], dirIn[0]) + d;
        ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0] + Math.cos(outAng) * 400, Q[1] + Math.sin(outAng) * 400); ctx.stroke();
      }
      ctx.restore();
      /* n(λ) */
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0.38, xmax: 1.6, ymin: 1.42, ymax: 1.78, xlabel: 'λ (µm)', ylabel: 'n', ml: 46 });
      pl.frame();
      pl.fn(MAT.sellmeierBK7, { color: p.g === 'bk7' ? '--accent' : '--grid-2', width: 2 });
      pl.fn(MAT.sellmeierSiO2, { color: p.g === 'sio2' ? '--accent' : '--grid-2', width: 2 });
      pl.fn((l) => MAT.cauchy(1.7, 0.0135, l), { color: p.g === 'flint' ? '--accent' : '--grid-2', width: 2 });
      pl.vline(0.5876, { color: '--ink-3', label: 'd' });
      const Vd = (nf(0.5876) - 1) / (nf(0.4861) - nf(0.6563));
      sim.set('nd', EM.fix(nf(0.5876), 5));
      sim.set('V', EM.fix(Vd, 2) + (p.g === 'flint' ? ' (Cauchy ilustrativo)' : ''));
      sim.set('dev', EM.fix(M.deg(dev(0.656)), 2) + '° y ' + EM.fix(M.deg(dev(0.405)), 2) + '°');
    });
  });

  /* ======================================================================
     24.3 Brecha y color
     ====================================================================== */
  const GAPS = { custom: ['Brecha libre', 0], diamond: ['Diamante', 5.5], zns: ['ZnS', 3.6], cds: ['CdS', 2.42], gap: ['GaP', 2.26], cdse: ['CdSe', 1.74], gaas: ['GaAs', 1.42], si: ['Si (indirecta)', 1.12] };
  EM.defineSim('gap-color', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.entries(GAPS).map(([k, v]) => [k, v[0] + (v[1] ? ' (' + v[1] + ' eV)' : '')]), value: 'cds' });
    sim.slider('Eg', { label: 'Brecha <i>E<sub>g</sub></i>', min: 1, max: 4, step: 0.01, value: 2.42, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('x', { label: 'Espesor', min: 1e-6, max: 1e-2, step: 1e-6, value: 1e-4, unit: 'm', log: true, fmt: (v) => EM.si(v, '', 2) });
    sim.slider('R', { label: 'Reflectancia de cada cara', min: 0, max: 0.4, step: 0.01, value: 0.17, fmt: (v) => EM.fix(v, 2) });
    sim.out('lg', 'Longitud de onda de corte <i>hc</i>/<i>E<sub>g</sub></i>', { hl: true });
    sim.out('Tv', 'Transmitancia visible media');
    sim.out('col', 'Color transmitido (sRGB)');
    sim.onChange = (id) => { if (id === 'm' && GAPS[sim.p.m][1]) sim.ctl.Eg.set(Math.min(4, GAPS[sim.p.m][1]), true); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Eg = p.Eg;
      const alpha = (lnm) => { const E = 1239.84 / lnm; return E >= Eg ? 1e7 * Math.sqrt(E - Eg + 0.0001) : 1e5 * Math.exp((E - Eg) / 0.02); };
      const T = (lnm) => MAT.slabT(p.R, alpha(lnm), p.x);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.68, h: H, xmin: 300, xmax: 1300, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'transmitancia', ml: 46 });
      pl.frame();
      for (let l = 380; l <= 750; l += 2) { const c = EM.wavelengthRGB(l); ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`; ctx.fillRect(pl.X(l), pl.Y(1.05), pl.X(l + 2) - pl.X(l) + 0.5, pl.Y(0) - pl.Y(1.05)); }
      pl.fn(T, { color: '--ink', width: 2.4, n: 500 });
      const lg = 1239.84 / Eg;
      pl.vline(lg, { color: '--c2', label: 'λ_g' });
      const rgb = spectrumToRGB(T);
      /* muestra */
      const sx = W * 0.72, sw = W * 0.25;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, H * 0.15, sw, H * 0.6);
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; ctx.fillRect(sx + 10, H * 0.15 + 10, sw - 20, H * 0.6 - 20);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(sx, H * 0.15, sw, H * 0.6);
      EM.text(ctx, 'luz blanca transmitida', sx + sw / 2, H * 0.15 - 8, { size: 11, align: 'center', color: '--ink-3' });
      let Tv = 0, n = 0; for (let l = 400; l <= 700; l += 5) { Tv += T(l); n++; }
      sim.set('lg', EM.fix(lg, 0) + ' nm');
      sim.set('Tv', EM.fix((100 * Tv) / n, 1) + ' %');
      sim.set('col', 'rgb(' + rgb.join(', ') + ')');
    });
    sim.note('Absorción modelada: α ∝ √(E − E_g) sobre la brecha (directa) y cola de Urbach de 20 meV; el color se calcula con las funciones de igualación CIE 1931 (ajuste de Wyman et al., 2013).');
  });

  /* ======================================================================
     24.4 Fibra óptica
     ====================================================================== */
  EM.defineSim('fiber-optic', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('n1', { label: 'Índice del núcleo <i>n</i><sub>1</sub>', min: 1.45, max: 1.6, step: 0.001, value: 1.48, fmt: (v) => EM.fix(v, 3) });
    sim.slider('n2', { label: 'Índice del revestimiento <i>n</i><sub>2</sub>', min: 1.4, max: 1.599, step: 0.001, value: 1.46, fmt: (v) => EM.fix(v, 3) });
    sim.slider('th', { label: 'Ángulo de entrada del rayo', min: 0, max: 40, step: 0.5, value: 10, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.slider('L', { label: 'Longitud', min: 0.1, max: 200, step: 0.1, value: 50, unit: 'km', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('dB', { label: 'Atenuación', min: 0.15, max: 5, step: 0.01, value: 0.2, unit: 'dB/km', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('NA', 'Apertura numérica y ángulo máximo', { hl: true });
    sim.out('g', 'Estado del rayo');
    sim.out('dt', 'Ensanchamiento modal');
    sim.out('P', 'Potencia que llega');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const n1 = p.n1, n2 = Math.min(p.n2, p.n1 - 0.001);
      const NA = Math.sqrt(n1 * n1 - n2 * n2), tmax = M.deg(Math.asin(Math.min(1, NA)));
      const yc = H * 0.4, a = H * 0.14, x0 = 50, x1 = W - 20;
      ctx.fillStyle = EM.alpha('--c6', 0.15); ctx.fillRect(x0, yc - a * 1.8, x1 - x0, a * 3.6);
      ctx.fillStyle = EM.alpha('--c1', 0.18); ctx.fillRect(x0, yc - a, x1 - x0, 2 * a);
      /* rayo */
      const tin = M.rad(p.th), tc = Math.asin(Math.sin(tin) / n1);
      const guided = p.th <= tmax;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x0 - 40, yc + 40 * Math.tan(tin)); ctx.lineTo(x0, yc);
      /* trazado con la pendiente exagerada ×4 para que se vean los rebotes */
      let x = x0, y = yc, dir = -1;
      const k = Math.max(1e-3, 4 * Math.tan(tc));
      for (let i = 0; i < 200 && x < x1; i++) {
        const ny = yc + dir * a, dxx = Math.abs(ny - y) / k;
        if (x + dxx >= x1) { ctx.lineTo(x1, y + dir * k * (x1 - x)); break; }
        x += dxx; y = ny; ctx.lineTo(x, y);
        if (!guided) { ctx.lineTo(Math.min(x + 40, x1), y + dir * 40); break; }
        dir = -dir;
      }
      ctx.stroke();
      EM.text(ctx, 'ángulos exagerados ×4', x1 - 4, yc + a * 1.8 - 6, { size: 10.5, color: '--ink-3', align: 'right' });
      EM.text(ctx, 'núcleo n₁', x0 + 8, yc - a + 14, { size: 11, color: '--c1' });
      EM.text(ctx, 'revestimiento n₂', x0 + 8, yc - a * 1.8 + 14, { size: 11, color: '--ink-3' });
      /* potencia contra distancia */
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.68, w: W, h: H * 0.32, xmin: 0, xmax: p.L, ymin: 0, ymax: 1.05, xlabel: 'distancia (km)', ylabel: 'P/P₀', ml: 44, mt: 6 });
      pl.frame();
      pl.fn((z) => Math.pow(10, (-p.dB * z) / 10), { color: '--c3', width: 2.2 });
      const dt = ((p.L * 1000 * n1 * ((n1 - n2) / n2)) / 299792458) * 1e9;
      const P = Math.pow(10, (-p.dB * p.L) / 10);
      sim.set('NA', EM.fix(NA, 4) + ' · ' + EM.fix(tmax, 2) + '°');
      sim.set('g', guided ? 'guiado por reflexión total' : 'se escapa por el revestimiento');
      sim.set('dt', EM.fix(dt, 1) + ' ns en ' + EM.fix(p.L, 1) + ' km (≈ ' + EM.si(1 / (dt * 1e-9), 'bit/s') + ')');
      sim.set('P', EM.fix(100 * P, 2) + ' % (' + EM.fix(-p.dB * p.L, 1) + ' dB)');
    });
  });
})();
