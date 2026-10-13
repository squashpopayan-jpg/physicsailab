/* Capítulo 20 — Ondas electromagnéticas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Transformación física → vista (dextrógira): z_fís → x_vista, x_fís → z_vista, y_fís → −y_vista */
  const PV = (x, y, z) => [z, -y, x];
  const physAxes = (v3, L) => {
    const ax = [[[1, 0, 0], 'z'], [[0, -1, 0], 'y'], [[0, 0, 1], 'x']];
    ax.forEach(([d, n]) => {
      v3.line(V.scale(d, -L * 0.3), [0, 0, 0], { color: '--axis', width: 1, dash: [4, 4], seg: 3 });
      v3.arrow([0, 0, 0], V.scale(d, L), { color: '--axis', width: 1.5, head: 9, seg: 5 });
      v3.text(V.scale(d, L * 1.1), n, { size: 14, italic: true, weight: 600, family: EM.FONT_MATH, color: '--ink' });
    });
  };
  EM.PV = PV;
  EM.physAxes = physAxes;

  /* ======================================================================
     20.1 Onda plana
     ====================================================================== */
  EM.defineSim('plane-wave', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const v3 = new EM.View3D(sim, cv, { radius: 2.1, az: rad(-62), el: rad(20) });
    sim.group('Onda');
    sim.slider('f', { label: 'Frecuencia', min: 1e6, max: 1e15, value: 5e14, log: true, step: 1, fmt: (v) => EM.si(v, 'Hz', 3) });
    sim.slider('E0', { label: 'Amplitud <i>E</i><sub>0</sub>', min: 1, max: 1000, value: 100, log: true, step: 1, unit: 'V/m', fmt: (v) => v.toFixed(0) });
    sim.slider('psi', { label: 'Dirección de <b>E</b> en el plano <i>xy</i>', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.seg('dir', { label: 'Propagación', options: [[1, '+z'], [-1, '−z']], value: 1 });
    sim.check('B', { label: 'Mostrar <b>B</b> (escalado como <i>cB</i>)', value: true });
    sim.out('lam', 'Longitud de onda <i>λ</i>', { hl: true });
    sim.out('k', 'Número de onda <i>k</i>');
    sim.out('w', 'Frecuencia angular <i>ω</i>');
    sim.out('B0', '<i>B</i><sub>0</sub> = <i>E</i><sub>0</sub>/<i>c</i>');
    sim.out('I', 'Intensidad ½<i>cε</i><sub>0</sub><i>E</i><sub>0</sub>²');
    sim.hint('La figura muestra dos longitudes de onda · arrastra para girar', cv);
    sim.legend([{ color: '--efield', label: '<b>E</b>' }, { color: '--bfield', label: '<b>B</b>' }, { color: '--gold', label: '<b>k</b> (propagación)' }]);
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.2; });
    sim.onDraw(() => {
      const p = sim.p, s = p.dir, psi = rad(p.psi);
      const ue = [Math.cos(psi), Math.sin(psi), 0];
      const ub = V.scale(V.cross([0, 0, s], ue), 1); /* B = (1/c) k̂ × E */
      v3.begin();
      physAxes(v3, 1.2);
      const amp = 0.8, N = 64, zr = 2;
      const eTips = [], bTips = [];
      for (let i = 0; i <= N; i++) {
        const z = -zr + (2 * zr * i) / N;
        const c = Math.cos(2 * Math.PI * z * s - ph);
        const e = V.scale(ue, amp * c), b = V.scale(ub, amp * c);
        const base = PV(0, 0, z);
        eTips.push(PV(...V.add([0, 0, z], e)));
        bTips.push(PV(...V.add([0, 0, z], b)));
        if (i % 2 === 0) {
          v3.line(base, PV(...V.add([0, 0, z], e)), { color: '--efield', width: 1.6, alpha: 0.75 });
          if (p.B) v3.line(base, PV(...V.add([0, 0, z], b)), { color: '--bfield', width: 1.6, alpha: 0.75 });
        }
      }
      v3.polyline(eTips, { color: '--efield', width: 2.4 });
      if (p.B) v3.polyline(bTips, { color: '--bfield', width: 2.4 });
      v3.line(PV(0, 0, -zr), PV(0, 0, zr), { color: '--ink-3', width: 1, seg: 8 });
      v3.arrow(PV(0, 0, 0), PV(0, 0, s * 0.9), { color: '--gold', width: 3, head: 12 });
      v3.text(PV(0, 0, s * 1.02), 'k', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--gold', dy: -10 });
      v3.render();
      const lam = K.c / p.f, k = (2 * Math.PI) / lam, w = 2 * Math.PI * p.f;
      sim.set('lam', EM.si(lam, 'm'));
      sim.set('k', EM.si(k, 'rad/m'));
      sim.set('w', EM.si(w, 'rad/s'));
      sim.set('B0', EM.si(p.E0 / K.c, 'T'));
      sim.set('I', EM.si(0.5 * K.c * K.eps0 * p.E0 * p.E0, 'W/m²'));
    });
  });

  /* ======================================================================
     20.2 Presión de radiación
     ====================================================================== */
  EM.defineSim('radiation-pressure', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const PRE = {
      sun: { n: 'Luz solar a 1 UA sobre una vela', I: 1361, A: 1e6, m: 100 },
      laser: { n: 'Puntero láser de 5 mW (haz de 1 mm)', I: 6366, A: 7.85e-7, m: 1e-6 },
      hi: { n: 'Láser pulsado de alta potencia', I: 1e16, A: 1e-10, m: 1e-12 },
      mw: { n: 'Horno de microondas', I: 1e4, A: 0.01, m: 0.05 }
    };
    sim.group('Situación');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'sun', onInput: (v) => { const q = PRE[v]; sim.ctl.I.set(q.I, true); sim.ctl.A.set(q.A, true); sim.ctl.m.set(q.m, true); } });
    sim.slider('I', { label: 'Intensidad <i>I</i>', min: 1, max: 1e17, value: 1361, log: true, step: 1, fmt: (v) => EM.si(v, 'W/m²', 3) });
    sim.slider('A', { label: 'Área iluminada', min: 1e-10, max: 1e7, value: 1e6, log: true, step: 1e-10, fmt: (v) => EM.sci(v, 3) + ' m²' });
    sim.slider('m', { label: 'Masa del objeto', min: 1e-12, max: 1e4, value: 100, log: true, step: 1e-12, fmt: (v) => EM.si(v * 1e3, 'g', 3) });
    sim.seg('surf', { label: 'Superficie', options: [['abs', 'Absorbente'], ['ref', 'Espejo']], value: 'ref' });
    sim.out('E0', 'Amplitud <i>E</i><sub>0</sub>');
    sim.out('B0', 'Amplitud <i>B</i><sub>0</sub>');
    sim.out('u', 'Densidad media de energía');
    sim.out('P', 'Presión de radiación', { hl: true });
    sim.out('F', 'Fuerza');
    sim.out('a', 'Aceleración');
    let ph = 0;
    sim.animate((dt) => { ph += dt; });
    sim.onDraw(() => {
      const p = sim.p, fct = p.surf === 'ref' ? 2 : 1;
      const E0 = Math.sqrt((2 * p.I) / (K.c * K.eps0)), P = (fct * p.I) / K.c, F = P * p.A;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const xs = w * 0.72;
      for (let j = 0; j < 5; j++) {
        const y = h * (0.2 + 0.15 * j);
        const pts = [];
        for (let x = 20; x < xs; x += 3) pts.push([x, y + 10 * Math.sin((x - ph * 120) / 14)]);
        EM.draw.poly(ctx, pts, { color: '--gold', width: 1.8, alpha: 0.85 });
        EM.draw.arrow(ctx, xs - 60, y, xs - 12, y, { color: '--gold', width: 2, head: 8 });
        if (fct === 2) EM.draw.arrow(ctx, xs - 16, y + 10, xs - 60, y + 10, { color: '--gold', width: 1.5, head: 7, alpha: 0.5 });
      }
      ctx.fillStyle = EM.col(fct === 2 ? '--c6' : '--ink'); ctx.fillRect(xs, h * 0.12, 12, h * 0.76);
      EM.draw.arrow(ctx, xs + 18, h / 2, xs + 18 + 70, h / 2, { color: '--accent', width: 3.4, head: 13 });
      EM.text(ctx, 'F', xs + 60, h / 2 - 12, { size: 14, weight: 700, family: EM.FONT_MATH, color: '--accent' });
      EM.text(ctx, fct === 2 ? 'espejo: P = 2I/c' : 'absorbente: P = I/c', xs - 8, h - 10, { size: 12, color: '--ink-2', align: 'right' });
      sim.set('E0', EM.si(E0, 'V/m'));
      sim.set('B0', EM.si(E0 / K.c, 'T'));
      sim.set('u', EM.si(p.I / K.c, 'J/m³'));
      sim.set('P', EM.si(P, 'Pa'));
      sim.set('F', EM.si(F, 'N'));
      sim.set('a', EM.si(F / p.m, 'm/s²'));
    });
  });

  /* ======================================================================
     20.3 Polarización
     ====================================================================== */
  EM.defineSim('polarization', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.1 });
    const c2 = sim.canvas({ aspect: 1.1 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.8, az: rad(-62), el: rad(18) });
    sim.group('Componentes');
    sim.slider('Ex', { label: '<i>E</i><sub>0x</sub>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('Ey', { label: '<i>E</i><sub>0y</sub>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('d', { label: 'Desfase <i>δ</i>', min: -180, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.button('Lineal 45°', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(1, true); sim.ctl.d.set(0); });
    sim.button('Circular', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(1, true); sim.ctl.d.set(90); });
    sim.button('Elíptica', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(0.5, true); sim.ctl.d.set(60); });
    sim.out('type', 'Tipo', { hl: true });
    sim.out('sense', 'Sentido de giro (visto por quien recibe la onda)');
    sim.out('psi', 'Orientación del eje mayor');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 1.8; });
    sim.onDraw(() => {
      const p = sim.p, d = rad(p.d);
      const E = (z, t) => [p.Ex * Math.cos(2 * Math.PI * z - t), p.Ey * Math.cos(2 * Math.PI * z - t + d), 0];
      v3.begin();
      physAxes(v3, 1.2);
      const tips = [];
      for (let i = 0; i <= 160; i++) { const z = -2 + (4 * i) / 160; const e = E(z, ph); tips.push(PV(e[0] * 0.75, e[1] * 0.75, z)); if (i % 5 === 0) v3.line(PV(0, 0, z), PV(e[0] * 0.75, e[1] * 0.75, z), { color: '--efield', width: 1.2, alpha: 0.6 }); }
      v3.polyline(tips, { color: '--efield', width: 2.4 });
      v3.line(PV(0, 0, -2), PV(0, 0, 2), { color: '--ink-3', width: 1 });
      const e0 = E(0, ph);
      v3.arrow(PV(0, 0, 0), PV(e0[0] * 0.75, e0[1] * 0.75, 0), { color: '--accent', width: 3, head: 11 });
      v3.render();
      /* elipse en el plano z = 0 */
      EM.draw.clear(c2);
      const ctx = c2.ctx, w = c2.w, h = c2.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R * 1.2, cy); ctx.lineTo(cx + R * 1.2, cy); ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy + R * 1.2); ctx.stroke();
      EM.text(ctx, 'x', cx + R * 1.25, cy + 4, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      EM.text(ctx, 'y', cx + 4, cy - R * 1.22, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      const pts = [];
      for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120; const e = E(0, t); pts.push([cx + e[0] * R, cy - e[1] * R]); }
      EM.draw.poly(ctx, pts, { color: '--efield', width: 2.2 });
      const tip = [cx + e0[0] * R, cy - e0[1] * R];
      EM.draw.arrow(ctx, cx, cy, tip[0], tip[1], { color: '--accent', width: 3, head: 12 });
      /* sentido: dirección de la derivada temporal */
      const e1 = E(0, ph + 0.05);
      const cross = e0[0] * e1[1] - e0[1] * e1[0];
      EM.text(ctx, 'extremo de E en z = 0 (la onda sale de la pantalla)', 10, h - 10, { size: 11, color: '--ink-3' });
      const lin = Math.abs(Math.sin(d)) < 1e-6 || p.Ex < 1e-6 || p.Ey < 1e-6;
      const circ = Math.abs(p.Ex - p.Ey) < 1e-6 && Math.abs(Math.abs(p.d) - 90) < 1e-6;
      const psi = 0.5 * Math.atan2(2 * p.Ex * p.Ey * Math.cos(d), p.Ex * p.Ex - p.Ey * p.Ey);
      sim.set('type', lin ? 'lineal' : circ ? 'circular' : 'elíptica');
      sim.set('sense', lin ? '—' : cross > 0 ? 'antihorario' : 'horario');
      sim.set('psi', circ ? '— (circular)' : EM.fix(deg(psi), 1) + '°');
    });
  });

  /* ======================================================================
     20.4 Ley de Malus
     ====================================================================== */
  EM.defineSim('malus', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 3 });
    sim.group('Luz incidente');
    sim.seg('src', { options: [['un', 'No polarizada'], ['pol', 'Polarizada a 0°']], value: 'un' });
    sim.slider('I0', { label: 'Intensidad incidente', min: 1, max: 100, step: 1, value: 40, unit: 'W/m²', fmt: (v) => v.toFixed(0) });
    sim.group('Polarizadores');
    sim.slider('n', { label: 'Número de polarizadores', min: 1, max: 3, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('a1', { label: 'Eje del 1.º', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('a2', { label: 'Eje del 2.º', min: 0, max: 180, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('a3', { label: 'Eje del 3.º', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('I1', 'Tras el 1.º');
    sim.out('I2', 'Tras el 2.º');
    sim.out('I3', 'Tras el 3.º');
    sim.out('If', 'Intensidad final', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, n = p.n, ang = [p.a1, p.a2, p.a3].slice(0, n);
      const Is = [];
      let I = p.I0, pol = p.src === 'un' ? null : 0;
      ang.forEach((a) => { if (pol === null) I *= 0.5; else I *= Math.cos(rad(a - pol)) ** 2; pol = a; Is.push(I); });
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, cy = h / 2;
      const xs = ang.map((_, i) => w * (0.25 + (0.55 * i) / Math.max(1, n - 1 || 1)));
      if (n === 1) xs[0] = w * 0.5;
      /* haz */
      const segs = [[10, xs[0], p.I0, p.src === 'un' ? null : 0]];
      ang.forEach((a, i) => segs.push([xs[i], i + 1 < n ? xs[i + 1] : w - 10, Is[i], a]));
      segs.forEach(([x0, x1, In, pa]) => {
        const hbeam = 14 + 50 * Math.sqrt(In / 100);
        ctx.fillStyle = EM.alpha('--gold', 0.12 + 0.5 * (In / 100));
        ctx.fillRect(x0, cy - hbeam / 2, x1 - x0, hbeam);
        const xm = (x0 + x1) / 2;
        if (pa === null) { for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; EM.draw.arrow(ctx, xm - 14 * Math.cos(a), cy + 14 * Math.sin(a), xm + 14 * Math.cos(a), cy - 14 * Math.sin(a), { color: '--efield', width: 1.6, head: 6 }); } }
        else if (In > 1e-3) { const a = rad(pa), L = 8 + 24 * Math.sqrt(In / 100); EM.draw.arrow(ctx, xm - L * Math.cos(a), cy + L * Math.sin(a), xm + L * Math.cos(a), cy - L * Math.sin(a), { color: '--efield', width: 2.2, head: 8 }); }
        EM.text(ctx, EM.fix(In, 2) + ' W/m²', xm, cy + 54, { size: 11, mono: true, color: '--ink-2', align: 'center' });
      });
      ang.forEach((a, i) => {
        ctx.save(); ctx.translate(xs[i], cy);
        ctx.fillStyle = EM.alpha('--ink-3', 0.25); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 48, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        const r = rad(a);
        ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-8 * Math.cos(r), 40 * Math.sin(r)); ctx.lineTo(8 * Math.cos(r), -40 * Math.sin(r)); ctx.stroke();
        ctx.restore();
        EM.text(ctx, a + '°', xs[i], cy - 58, { size: 12, mono: true, color: '--accent', align: 'center' });
      });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 180, ymin: 0, ymax: 1.1, xlabel: 'ángulo entre ejes consecutivos θ (°)', ylabel: 'I/I_{antes}', xticks: [0, 30, 60, 90, 120, 150, 180] });
      pl.frame();
      pl.fn((t) => Math.cos(rad(t)) ** 2, { color: '--c1', width: 2.2 });
      for (let i = 1; i < n; i++) { const t = Math.abs(ang[i] - ang[i - 1]); pl.dot(t, Math.cos(rad(t)) ** 2, { color: '--accent', r: 5, label: (i) + '→' + (i + 1) }); }
      pl.label(120, 0.9, 'I = I₀ cos²θ', { color: '--c1' });
      ['I1', 'I2', 'I3'].forEach((k, i) => sim.set(k, i < n ? EM.fix(Is[i], 3) + ' W/m²' : '—'));
      sim.set('If', EM.fix(Is[n - 1], 3) + ' W/m² (' + EM.fix((100 * Is[n - 1]) / p.I0, 1) + ' %)');
    });
  });

  /* ======================================================================
     20.5 Espectro
     ====================================================================== */
  EM.defineSim('spectrum', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    sim.slider('lam', { label: 'Longitud de onda <i>λ</i>', min: 1e-14, max: 1e4, value: 5.5e-7, log: true, step: 1e-15, fmt: (v) => EM.si(v, 'm', 3) });
    sim.out('band', 'Región', { hl: true });
    sim.out('f', 'Frecuencia <i>f</i> = <i>c</i>/<i>λ</i>');
    sim.out('Ef', 'Energía del fotón <i>hf</i>');
    sim.out('cmp', 'Comparable al tamaño de');
    const bands = [[1e-14, 1e-11, 'rayos gamma', '--c5'], [1e-11, 1e-8, 'rayos X', '--c1'], [1e-8, 4e-7, 'ultravioleta', '--c5'], [4e-7, 7e-7, 'visible', null], [7e-7, 1e-3, 'infrarrojo', '--c2'], [1e-3, 1, 'microondas', '--c4'], [1, 1e4, 'radio', '--c3']];
    const objs = [[1e-14, 'un núcleo atómico'], [1e-10, 'un átomo'], [1e-8, 'una molécula grande'], [1e-7, 'un virus'], [5e-7, 'una bacteria pequeña'], [1e-5, 'una célula'], [1e-3, 'la cabeza de un alfiler'], [1e-1, 'una mano'], [1, 'una persona'], [100, 'un edificio'], [1e4, 'una ciudad pequeña']];
    sim.onDraw(() => {
      const lam = sim.p.lam;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, x0 = 30, x1 = w - 30, y0 = h * 0.18, bh = h * 0.26;
      const X = (l) => x0 + ((Math.log10(l) + 14) / 18) * (x1 - x0);
      bands.forEach(([a, b, n, col]) => {
        if (col) { ctx.fillStyle = EM.alpha(col, 0.25); ctx.fillRect(X(a), y0, X(b) - X(a), bh); }
        else { for (let px = X(a); px < X(b); px++) { const l = 10 ** (((px - x0) / (x1 - x0)) * 18 - 14) * 1e9; ctx.fillStyle = EM.rgbStr(EM.wavelengthRGB(l)); ctx.fillRect(px, y0, 1.5, bh); } }
        ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(X(a) + 0.5, y0 + 0.5, X(b) - X(a), bh);
        if (n !== 'visible') EM.text(ctx, n, (X(a) + X(b)) / 2, y0 - 8, { size: 11, color: '--ink-2', align: 'center' });
      });
      /* detalle del visible (escala lineal) */
      const vy = y0 + bh + 58, vh = 16, L0 = 380, L1 = 750;
      const XV = (nm) => x0 + ((nm - L0) / (L1 - L0)) * (x1 - x0);
      for (let px = x0; px < x1; px++) { const nm = L0 + ((px - x0) / (x1 - x0)) * (L1 - L0); ctx.fillStyle = EM.rgbStr(EM.wavelengthRGB(nm)); ctx.fillRect(px, vy, 1.5, vh); }
      ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(4e-7), y0 + bh + 27); ctx.lineTo(XV(400), vy - 2); ctx.moveTo(X(7e-7), y0 + bh + 27); ctx.lineTo(XV(700), vy - 2); ctx.stroke(); ctx.setLineDash([]);
      for (const nm of [400, 450, 500, 550, 600, 650, 700]) EM.text(ctx, nm + ' nm', XV(nm), vy + vh + 13, { size: 10, mono: true, color: '--ink-3', align: 'center' });
      EM.text(ctx, 'detalle del visible (escala lineal en λ)', (x0 + x1) / 2, vy + vh + 32, { size: 11, color: '--ink-2', align: 'center' });
      if (lam >= L0 * 1e-9 && lam <= L1 * 1e-9) { ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(XV(lam * 1e9), vy - 3); ctx.lineTo(XV(lam * 1e9), vy + vh + 3); ctx.stroke(); }
      for (let e = -14; e <= 4; e += 2) { ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(X(10 ** e), y0 + bh, 1, 6); EM.text(ctx, '10^{' + EM.minus(e) + '} m', X(10 ** e), y0 + bh + 20, { size: 10.5, mono: true, color: '--ink-3', align: 'center' }); }
      const xl = X(lam);
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xl, y0 - 4); ctx.lineTo(xl, y0 + bh + 4); ctx.stroke();
      const f = K.c / lam, E = K.h * f;
      const band = bands.find(([a, b]) => lam >= a && lam < b) || bands[bands.length - 1];
      let obj = objs[0];
      objs.forEach((o) => { if (Math.abs(Math.log10(o[0] / lam)) < Math.abs(Math.log10(obj[0] / lam))) obj = o; });
      sim.set('band', band[2]);
      sim.set('f', EM.si(f, 'Hz'));
      sim.set('Ef', EM.si(E / K.e, 'eV') + ' = ' + EM.sci(E, 3) + ' J');
      sim.set('cmp', obj[1]);
    });
  });

  /* ======================================================================
     20.6 FDTD: ondas a partir de las ecuaciones de Maxwell
     ====================================================================== */
  EM.defineSim('fdtd-waves', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const NX = 240, NY = 150;
    sim.group('Experimento');
    sim.select('mode', { options: [['point', 'Fuente puntual'], ['two', 'Dos fuentes en fase'], ['slit', 'Onda plana y rendija'], ['double', 'Onda plana y doble rendija'], ['pulse', 'Pulso gaussiano']], value: 'two', onInput: () => build() });
    sim.slider('lam', { label: 'Longitud de onda (celdas)', min: 8, max: 40, step: 1, value: 18, fmt: (v) => v.toFixed(0), onInput: () => build() });
    sim.slider('spf', { label: 'Pasos de tiempo por cuadro', min: 1, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.check('energy', { label: 'Mostrar intensidad (E²) en lugar de E', value: false });
    sim.button('Reiniciar', () => build());
    sim.out('t', 'Tiempo (períodos)');
    sim.note('Se muestra <i>E<sub>z</sub></i> (perpendicular a la pantalla): rojo positivo, azul negativo. Los bordes absorben las ondas.');
    let F = null, avg = null;
    function build() {
      F = new EM.FDTD2D(NX, NY, { pml: 20 });
      const m = sim.p.mode, lam = sim.p.lam;
      if (m === 'slit' || m === 'double') {
        const iw = Math.round(NX * 0.38), gap = Math.round(lam * (m === 'slit' ? 1.2 : 0.6)), sep = Math.round(lam * 2.2);
        for (let j = 0; j < NY; j++) for (let di = 0; di < 3; di++) {
          const y = j - NY / 2;
          const open = m === 'slit' ? Math.abs(y) < gap / 2 : Math.abs(y - sep / 2) < gap / 2 || Math.abs(y + sep / 2) < gap / 2;
          if (!open) F.pec[j * NX + iw + di] = 1;
        }
        F.build();
      }
      avg = new Float32Array(NX * NY);
    }
    build();
    sim.animate(() => {
      const p = sim.p, w = (2 * Math.PI) / p.lam;
      for (let s = 0; s < p.spf; s++) {
        const t = F.t, ramp = Math.min(1, t / (3 * p.lam));
        const src = Math.sin(w * t) * ramp;
        if (p.mode === 'point') F.add(Math.round(NX * 0.35), NY >> 1, 0.5 * src);
        else if (p.mode === 'two') { const d = Math.round(p.lam * 1.5); F.add(Math.round(NX * 0.3), (NY >> 1) - d, 0.5 * src); F.add(Math.round(NX * 0.3), (NY >> 1) + d, 0.5 * src); }
        else if (p.mode === 'pulse') { const tt = t - 30; F.add(Math.round(NX * 0.3), NY >> 1, 2 * Math.exp(-(tt * tt) / 60)); }
        else for (let j = 1; j < NY - 1; j++) F.add(24, j, 0.08 * src);
        F.step();
        for (let k = 0; k < avg.length; k++) avg[k] += 0.01 * (F.Ez[k] * F.Ez[k] - avg[k]);
      }
    });
    sim.onDraw(() => {
      EM.draw.clear(cv);
      const p = sim.p;
      if (p.energy) {
        const save = F.Ez;
        F.Ez = avg;
        F.render(cv, { energy: true, scale: p.mode === 'point' || p.mode === 'two' ? 30 : 60 });
        F.Ez = save;
      } else F.render(cv, { scale: p.mode === 'pulse' ? 5 : p.mode === 'point' || p.mode === 'two' ? 11 : 7 });
      sim.set('t', EM.fix(F.t / p.lam, 1));
    });
  });
})();
