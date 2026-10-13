/* Capítulo 23 — La luz como onda y la polarización */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, V = EM.V;
  const f2 = (v) => EM.fix(v, 2);
  /* física (x, y, z) → vista: z_fís hacia la derecha, x_fís hacia arriba, y_fís hacia el observador */
  const PV = (x, y, z) => [z, -y, x];

  /* ======================================================================
     23.1 Onda electromagnética plana
     ====================================================================== */
  EM.defineSim('em-wave', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    const v3 = new EM.View3D(sim, cv, { radius: 2.2, az: M.rad(-60), el: M.rad(20) });
    sim.slider('lam', { label: 'Longitud de onda', min: 380, max: 750, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('I', { label: 'Intensidad', min: 1, max: 1e6, value: 1000, log: true, step: 1, unit: 'W/m²', fmt: (v) => EM.sci(v, 3) });
    sim.slider('n', { label: 'Índice del medio <i>n</i>', min: 1, max: 2.4, step: 0.01, value: 1, fmt: f2 });
    sim.check('B', { label: 'Mostrar <b>B</b> (escalado como <i>cB</i>)', value: true });
    sim.out('f', 'Frecuencia <i>f</i>', { hl: true });
    sim.out('E0', 'Amplitud <i>E</i><sub>0</sub>');
    sim.out('B0', 'Amplitud <i>B</i><sub>0</sub>');
    sim.out('v', 'Velocidad y longitud de onda en el medio');
    sim.hint('Arrastra para girar', cv);
    sim.legend([{ color: '--efield', label: '<b>E</b>' }, { color: '--bfield', label: '<b>B</b>' }]);
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.2; });
    sim.onDraw(() => {
      const p = sim.p;
      v3.begin();
      const ax = [[[0, 0, 1], 'z'], [[1, 0, 0], 'x'], [[0, 1, 0], 'y']];
      ax.forEach(([d, nme]) => { const e = PV(...V.scale(d, 1.25)); v3.arrow([0, 0, 0], e, { color: '--axis', width: 1.4, head: 9 }); v3.text(V.scale(e, 1.08), nme, { size: 14, italic: true, family: EM.FONT_MATH, color: '--ink' }); });
      const N = 90, zr = 2, kk = 2 * Math.PI * p.n;
      const eT = [], bT = [];
      for (let i = 0; i <= N; i++) {
        const z = -zr + (2 * zr * i) / N, c = 0.8 * Math.cos(kk * z * 0.7 - ph);
        eT.push(PV(c, 0, z)); bT.push(PV(0, c, z));
        if (i % 3 === 0) { v3.line(PV(0, 0, z), PV(c, 0, z), { color: '--efield', width: 1.3, alpha: 0.7 }); if (p.B) v3.line(PV(0, 0, z), PV(0, c, z), { color: '--bfield', width: 1.3, alpha: 0.7 }); }
      }
      v3.polyline(eT, { color: '--efield', width: 2.4 });
      if (p.B) v3.polyline(bT, { color: '--bfield', width: 2.4 });
      v3.render();
      const c = 299792458, eta0 = 376.73, E0 = Math.sqrt((2 * eta0 * p.I) / p.n);
      sim.set('f', EM.si(c / (p.lam * 1e-9), 'Hz'));
      sim.set('E0', EM.si(E0, 'V/m'));
      sim.set('B0', EM.si((E0 * p.n) / c, 'T'));
      sim.set('v', EM.si(c / p.n, 'm/s') + ' · ' + EM.fix(p.lam / p.n, 0) + ' nm');
    });
  });

  /* ======================================================================
     23.2 Estados de polarización
     ====================================================================== */
  EM.defineSim('polarization-states', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.05 });
    const ct = sim.canvas({ aspect: 1.05 });
    sim.slider('Ex', { label: '<i>E</i><sub>0x</sub>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('Ey', { label: '<i>E</i><sub>0y</sub>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('d', { label: 'Desfase <i>δ</i>', min: -180, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.button('Lineal 45°', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(1, true); sim.ctl.d.set(0); });
    sim.button('Circular', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(1, true); sim.ctl.d.set(90); });
    sim.button('Elíptica', () => { sim.ctl.Ex.set(1, true); sim.ctl.Ey.set(0.5, true); sim.ctl.d.set(50); });
    sim.out('type', 'Tipo', { hl: true });
    sim.out('sense', 'Sentido de giro (mirando hacia la fuente)');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 1.6; });
    sim.onDraw(() => {
      const p = sim.p, d = M.rad(p.d);
      const E = (t) => [p.Ex * Math.cos(-t), p.Ey * Math.cos(-t + d)];
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38;
      EM.complexAxes(ctx, cx, cy, R * 1.25, ['Eₓ', 'E_y']);
      const pts = []; for (let i = 0; i <= 120; i++) { const e = E((2 * Math.PI * i) / 120); pts.push([cx + R * e[0], cy - R * e[1]]); }
      EM.draw.poly(ctx, pts, { color: '--efield', width: 2 });
      const e0 = E(ph);
      EM.draw.arrow(ctx, cx, cy, cx + R * e0[0], cy - R * e0[1], { color: '--accent', width: 3 });
      EM.draw.clear(ct);
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: 4 * Math.PI, ymin: -1.2, ymax: 1.2, xpi: true, xlabel: 'ωt', ylabel: 'componentes', ml: 52 });
      pt.frame();
      pt.fn((t) => p.Ex * Math.cos(t), { color: '--c1', width: 2 });
      pt.fn((t) => p.Ey * Math.cos(t - d), { color: '--c2', width: 2, dash: [6, 4] });
      pt.legend([{ label: 'E_x', color: '--c1' }, { label: 'E_y', color: '--c2', dash: [6, 4] }], 'tr');
      const lin = Math.abs(Math.sin(d)) < 1e-6 || p.Ex < 1e-6 || p.Ey < 1e-6;
      const circ = Math.abs(p.Ex - p.Ey) < 1e-6 && Math.abs(Math.abs(p.d) - 90) < 1e-6;
      const e1 = E(ph + 0.05), cr = e0[0] * e1[1] - e0[1] * e1[0];
      sim.set('type', lin ? 'lineal' : circ ? 'circular' : 'elíptica');
      sim.set('sense', lin ? '—' : cr > 0 ? 'antihorario' : 'horario');
    });
  });

  /* ======================================================================
     23.3 Cadena de polarizadores
     ====================================================================== */
  EM.defineSim('malus-chain', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    sim.seg('src', { label: 'Luz incidente', options: [['un', 'No polarizada'], ['pol', 'Polarizada a 0°']], value: 'un' });
    sim.slider('n', { label: 'Número de polarizadores', min: 1, max: 6, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('a1', { label: 'Eje del primero', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('aN', { label: 'Eje del último', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.note('Los polarizadores intermedios se reparten de manera uniforme entre el primero y el último.');
    sim.out('If', 'Intensidad final / incidente', { hl: true });
    sim.out('lim', 'Si hubiera muchos polarizadores');
    sim.onDraw(() => {
      const p = sim.p, n = p.n;
      const ang = []; for (let i = 0; i < n; i++) ang.push(n === 1 ? p.a1 : p.a1 + ((p.aN - p.a1) * i) / (n - 1));
      let I = 1, pol = p.src === 'un' ? null : 0;
      const Is = [];
      ang.forEach((a) => { I *= pol === null ? 0.5 : Math.cos(M.rad(a - pol)) ** 2; pol = a; Is.push(I); });
      const ctx = cv.ctx, W = cv.w, H = cv.h, cy = H / 2;
      EM.draw.clear(cv);
      const xs = ang.map((_, i) => W * (0.15 + (0.75 * (i + 0.5)) / n));
      const segs = [[0, xs[0], 1, p.src === 'un' ? null : 0]];
      ang.forEach((a, i) => segs.push([xs[i], i + 1 < n ? xs[i + 1] : W, Is[i], a]));
      segs.forEach(([x0, x1, In, pa]) => {
        ctx.fillStyle = EM.alpha('--gold', 0.08 + 0.5 * In); ctx.fillRect(x0, cy - 10 - 26 * Math.sqrt(In), x1 - x0, 20 + 52 * Math.sqrt(In));
        const xm = (x0 + x1) / 2;
        if (pa === null) for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; EM.draw.arrow(ctx, xm - 12 * Math.cos(a), cy + 12 * Math.sin(a), xm + 12 * Math.cos(a), cy - 12 * Math.sin(a), { color: '--efield', width: 1.4, head: 5 }); }
        else if (In > 1e-3) { const a = M.rad(pa), L = 6 + 22 * Math.sqrt(In); EM.draw.arrow(ctx, xm - L * Math.cos(a), cy + L * Math.sin(a), xm + L * Math.cos(a), cy - L * Math.sin(a), { color: '--efield', width: 2, head: 7 }); }
      });
      ang.forEach((a, i) => {
        ctx.save(); ctx.translate(xs[i], cy);
        ctx.fillStyle = EM.alpha('--ink-3', 0.25); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 44, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        const r = M.rad(a); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-6 * Math.cos(r), 38 * Math.sin(r)); ctx.lineTo(6 * Math.cos(r), -38 * Math.sin(r)); ctx.stroke();
        ctx.restore();
        EM.text(ctx, EM.fix(a, 0) + '°', xs[i], cy - 54, { size: 11, mono: true, color: '--accent', align: 'center' });
        EM.text(ctx, EM.fix(100 * Is[i], 1) + '%', xs[i] + 12, cy + 60, { size: 10.5, mono: true, color: '--ink-2' });
      });
      sim.set('If', EM.fix(100 * Is[n - 1], 2) + ' %');
      const tot = Math.abs(p.aN - p.a1);
      sim.set('lim', 'con N → ∞ pasaría ' + (p.src === 'un' ? '50' : EM.fix(100 * Math.cos(M.rad(p.a1)) ** 2, 1)) + ' %: la polarización «gira» sin pérdidas (' + EM.fix(tot, 0) + '°)');
    });
  });

  /* ======================================================================
     23.4 Fresnel y Brewster
     ====================================================================== */
  EM.defineSim('fresnel-brewster', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1.05 });
    const cp = sim.canvas({ aspect: 1.05 });
    sim.slider('n1', { label: 'Índice del medio incidente <i>n</i><sub>1</sub>', min: 1, max: 2.5, step: 0.01, value: 1, fmt: f2 });
    sim.slider('n2', { label: 'Índice del segundo medio <i>n</i><sub>2</sub>', min: 1, max: 2.5, step: 0.01, value: 1.5, fmt: f2 });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 89.9, step: 0.1, value: 56.3, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.out('Rs', 'Reflectancia <i>R<sub>s</sub></i>', { hl: true });
    sim.out('Rp', 'Reflectancia <i>R<sub>p</sub></i>');
    sim.out('B', 'Ángulo de Brewster');
    sim.out('c', 'Ángulo crítico');
    const coefs = (th) => {
      const p = sim.p, ci = Math.cos(th), st = (p.n1 / p.n2) * Math.sin(th);
      if (st >= 1) return [1, 1, null];
      const ct = Math.sqrt(1 - st * st);
      const rs = (p.n1 * ci - p.n2 * ct) / (p.n1 * ci + p.n2 * ct), rp = (p.n2 * ci - p.n1 * ct) / (p.n2 * ci + p.n1 * ct);
      return [rs * rs, rp * rp, Math.asin(st)];
    };
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th), [Rs, Rp, tt] = coefs(th);
      EM.draw.clear(cr);
      const ctx = cr.ctx, W = cr.w, H = cr.h, cx = W / 2, cy = H / 2, L = Math.min(W, H) * 0.42;
      ctx.fillStyle = EM.alpha('--c1', 0.06 + 0.12 * (p.n1 - 1)); ctx.fillRect(0, 0, W, cy);
      ctx.fillStyle = EM.alpha('--c1', 0.06 + 0.12 * (p.n2 - 1)); ctx.fillRect(0, cy, W, H - cy);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke(); ctx.setLineDash([]);
      EM.draw.arrow(ctx, cx - L * Math.sin(th), cy - L * Math.cos(th), cx, cy, { color: '--gold', width: 3 });
      EM.draw.arrow(ctx, cx, cy, cx + L * Math.sin(th), cy - L * Math.cos(th), { color: '--c2', width: 1 + 3 * Math.sqrt((Rs + Rp) / 2), alpha: 0.9 });
      if (tt !== null) EM.draw.arrow(ctx, cx, cy, cx + L * Math.sin(tt), cy + L * Math.cos(tt), { color: '--c3', width: 1 + 3 * Math.sqrt(1 - (Rs + Rp) / 2) });
      EM.text(ctx, 'n₁ = ' + EM.fix(p.n1, 2), 10, 18, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'n₂ = ' + EM.fix(p.n2, 2), 10, H - 10, { size: 12, color: '--ink-2' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 90, ymin: 0, ymax: 1.02, xlabel: 'ángulo de incidencia (°)', ylabel: 'reflectancia', ml: 52, xticks: [0, 15, 30, 45, 60, 75, 90] });
      pl.frame();
      pl.fn((d) => coefs(M.rad(d))[0], { color: '--c1', width: 2.2, n: 900 });
      pl.fn((d) => coefs(M.rad(d))[1], { color: '--c2', width: 2.2, dash: [6, 4], n: 900 });
      const thB = M.deg(Math.atan(p.n2 / p.n1));
      pl.vline(thB, { color: '--c3', label: 'Brewster' });
      pl.vline(p.th, { color: '--accent' });
      pl.legend([{ label: 'R_s (perpendicular)', color: '--c1' }, { label: 'R_p (paralela)', color: '--c2', dash: [6, 4] }], 'tl');
      sim.set('Rs', EM.fix(100 * Rs, 2) + ' %');
      sim.set('Rp', EM.fix(100 * Rp, 3) + ' %');
      sim.set('B', EM.fix(thB, 2) + '°');
      sim.set('c', p.n1 > p.n2 ? EM.fix(M.deg(Math.asin(p.n2 / p.n1)), 2) + '°' : '— (n₁ < n₂)');
    });
  });

  /* ======================================================================
     23.5 Lámina birrefringente
     ====================================================================== */
  EM.defineSim('waveplate', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 1.05 });
    const cc = sim.canvas({ aspect: 1.05 });
    sim.slider('ret', { label: 'Retardo de la lámina (en longitudes de onda)', min: 0, max: 3, step: 0.01, value: 0.25, fmt: (v) => EM.fix(v, 2) + ' λ' });
    sim.slider('phi', { label: 'Eje rápido de la lámina', min: 0, max: 90, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('an', { label: 'Eje del analizador', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.button('Cuarto de onda', () => sim.ctl.ret.set(0.25));
    sim.button('Media onda', () => sim.ctl.ret.set(0.5));
    sim.out('I', 'Intensidad tras el analizador (550 nm)', { hl: true });
    sim.out('st', 'Polarización tras la lámina');
    sim.note('El primer polarizador está a 0°. El color de la derecha es el que se vería con luz blanca, suponiendo el retardo dado a 550 nm (fotoelasticidad).');
    /* Jones: entrada [1, 0]; lámina con ejes rotados φ y desfase Γ; analizador a θ */
    const out = (Gam, phi, an) => {
      const c = Math.cos(phi), s = Math.sin(phi);
      /* componentes en la base de la lámina */
      const a = c, b = -s;
      /* tras la lámina: a·1, b·e^{iΓ} */
      const bx = [b * Math.cos(Gam), b * Math.sin(Gam)];
      /* de vuelta a xy */
      const Ex = [a * c - bx[0] * s, -bx[1] * s], Ey = [a * s + bx[0] * c, bx[1] * c];
      const ca = Math.cos(an), sa = Math.sin(an);
      const re = Ex[0] * ca + Ey[0] * sa, im = Ex[1] * ca + Ey[1] * sa;
      return { I: re * re + im * im, Ex, Ey };
    };
    sim.onDraw(() => {
      const p = sim.p, Gam = 2 * Math.PI * p.ret, phi = M.rad(p.phi), an = M.rad(p.an);
      const o = out(Gam, phi, an);
      EM.draw.clear(ce);
      const ctx = ce.ctx, W = ce.w, H = ce.h, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36;
      EM.complexAxes(ctx, cx, cy, R * 1.25, ['Eₓ', 'E_y']);
      const pts = []; for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120; pts.push([cx + R * (o.Ex[0] * Math.cos(t) + o.Ex[1] * Math.sin(t)), cy - R * (o.Ey[0] * Math.cos(t) + o.Ey[1] * Math.sin(t))]); }
      EM.draw.poly(ctx, pts, { color: '--efield', width: 2.2 });
      ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(cx - R * 1.2 * Math.cos(phi), cy + R * 1.2 * Math.sin(phi)); ctx.lineTo(cx + R * 1.2 * Math.cos(phi), cy - R * 1.2 * Math.sin(phi)); ctx.stroke();
      ctx.strokeStyle = EM.col('--accent');
      ctx.beginPath(); ctx.moveTo(cx - R * 1.2 * Math.cos(an), cy + R * 1.2 * Math.sin(an)); ctx.lineTo(cx + R * 1.2 * Math.cos(an), cy - R * 1.2 * Math.sin(an)); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'eje rápido', cx + R * 1.2 * Math.cos(phi), cy - R * 1.2 * Math.sin(phi) - 6, { size: 11, color: '--c3', halo: true });
      EM.text(ctx, 'analizador', cx + R * 1.2 * Math.cos(an), cy - R * 1.2 * Math.sin(an) + 14, { size: 11, color: '--accent', halo: true });
      EM.draw.clear(cc);
      const col = EM.whiteColor((nm) => out((2 * Math.PI * p.ret * 550) / nm, phi, an).I);
      const c2 = cc.ctx;
      c2.fillStyle = EM.rgbStr(col); c2.fillRect(20, 20, cc.w - 40, cc.h - 70);
      c2.strokeStyle = EM.col('--ink-2'); c2.strokeRect(20, 20, cc.w - 40, cc.h - 70);
      EM.text(c2, 'color con luz blanca', cc.w / 2, cc.h - 28, { size: 12, color: '--ink-2', align: 'center' });
      const g = ((p.ret % 1) + 1) % 1;
      const st = Math.abs(Math.sin(Gam)) < 1e-6 || Math.abs(Math.sin(2 * phi)) < 1e-6 ? 'lineal' : Math.abs(Math.abs(Math.sin(Gam)) - 1) < 1e-6 && Math.abs(Math.abs(Math.sin(2 * phi)) - 1) < 1e-6 ? 'circular' : 'elíptica';
      void g;
      sim.set('I', EM.fix(100 * o.I, 1) + ' %');
      sim.set('st', st);
    });
  });

  /* ======================================================================
     23.6 Prisma
     ====================================================================== */
  EM.defineSim('prism', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('A', { label: 'Ángulo del prisma', min: 20, max: 70, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 20, max: 85, step: 0.5, value: 48, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.select('mat', { label: 'Material', options: [['bk7', 'Vidrio crown (BK7)'], ['flint', 'Vidrio flint (F2)'], ['water', 'Agua'], ['diam', 'Diamante']], value: 'flint' });
    sim.out('n', 'Índices (rojo, violeta)', { hl: true });
    sim.out('dev', 'Desviación del rojo y del violeta');
    sim.out('sp', 'Separación angular');
    /* coeficientes de Cauchy n = A + B/λ² (λ en µm) */
    const MAT = { bk7: [1.5046, 0.0042], flint: [1.5994, 0.0105], water: [1.3199, 0.0031], diam: [2.3796, 0.0137] };
    const nOf = (nm) => { const c = MAT[sim.p.mat]; return c[0] + c[1] / (nm / 1000) ** 2; };
    sim.onDraw(() => {
      const p = sim.p, A = M.rad(p.A), th = M.rad(p.th);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv, EM.isDark() ? '#0b0f14' : '#151a20');
      /* prisma con vértice arriba */
      const cx = W * 0.45, base = H * 0.82, side = H * 0.75;
      const top = [cx, base - side * Math.cos(A / 2)], left = [cx - side * Math.sin(A / 2), base], right = [cx + side * Math.sin(A / 2), base];
      ctx.fillStyle = 'rgba(160,190,220,0.18)'; ctx.strokeStyle = 'rgba(200,220,240,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...left); ctx.lineTo(...right); ctx.closePath(); ctx.fill(); ctx.stroke();
      /* punto de entrada a media altura de la cara izquierda */
      const P = [(top[0] + left[0]) / 2, (top[1] + left[1]) / 2];
      const nL = [-(Math.cos(A / 2)), -Math.sin(A / 2)]; /* normal exterior de la cara izquierda */
      /* dirección incidente: forma ángulo th con la normal, viniendo desde abajo a la izquierda */
      const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
      const din = rot([-nL[0], -nL[1]], -th);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(P[0] - din[0] * 300, P[1] - din[1] * 300); ctx.lineTo(P[0], P[1]); ctx.stroke();
      const res = {};
      for (const nm of [700, 650, 600, 570, 530, 480, 440, 400]) {
        const n = nOf(nm);
        const t1 = Math.asin(Math.sin(th) / n);
        const d1 = rot([-nL[0], -nL[1]], -t1);
        /* intersección con la cara derecha */
        const R0 = top, Rd = [right[0] - top[0], right[1] - top[1]];
        const den = d1[0] * Rd[1] - d1[1] * Rd[0];
        const s = ((R0[0] - P[0]) * Rd[1] - (R0[1] - P[1]) * Rd[0]) / den;
        const Q = [P[0] + s * d1[0], P[1] + s * d1[1]];
        const col = EM.rgbStr(EM.wavelengthRGB(nm));
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...P); ctx.lineTo(...Q); ctx.stroke();
        const nR = [Math.cos(A / 2), -Math.sin(A / 2)];
        const ci = d1[0] * nR[0] + d1[1] * nR[1], ang = Math.acos(M.clamp(ci, -1, 1));
        const so = n * Math.sin(ang);
        if (so >= 1) { res[nm] = null; continue; }
        const tout = Math.asin(so);
        const sign = d1[0] * nR[1] - d1[1] * nR[0] > 0 ? 1 : -1;
        const dOut = rot(nR, -sign * tout);
        ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(...Q); ctx.lineTo(Q[0] + dOut[0] * 400, Q[1] + dOut[1] * 400); ctx.stroke();
        res[nm] = [n, M.deg(th + tout - A)];
      }
      if (res[700] && res[400]) {
        sim.set('n', EM.fix(res[700][0], 4) + ', ' + EM.fix(res[400][0], 4));
        sim.set('dev', EM.fix(res[700][1], 2) + '°, ' + EM.fix(res[400][1], 2) + '°');
        sim.set('sp', EM.fix(res[400][1] - res[700][1], 2) + '°');
      } else { sim.set('n', EM.fix(nOf(700), 4) + ', ' + EM.fix(nOf(400), 4)); sim.set('dev', 'reflexión total interna en la segunda cara'); sim.set('sp', '—'); }
    });
  });
})();
