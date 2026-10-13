/* Capítulo 19 — Ecuaciones de Maxwell */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V, CK = EM.ckt;
  const rad = M.rad;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     19.1 Corriente de desplazamiento
     ====================================================================== */
  EM.defineSim('displacement-current', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Condensador de placas circulares');
    sim.slider('I0', { label: 'Amplitud de la corriente <i>I</i><sub>0</sub>', min: 0.1, max: 5, step: 0.1, value: 2, unit: 'A', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R', { label: 'Radio de las placas <i>R</i>', min: 1, max: 10, step: 0.5, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('f', { label: 'Frecuencia', min: 10, max: 1000, value: 100, log: true, step: 1, unit: 'kHz', fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Radio de la curva amperiana <i>r</i>', min: 0.5, max: 15, step: 0.1, value: 3, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.out('I', 'Corriente de conducción <i>i</i>(<i>t</i>)');
    sim.out('Id', 'Corriente de desplazamiento <i>ε</i><sub>0</sub>dΦ<sub>E</sub>/d<i>t</i>', { hl: true });
    sim.out('Ienc', 'Parte de <i>I<sub>d</sub></i> dentro de la curva');
    sim.out('B', '<i>B</i> en la curva (entre placas)', { hl: true });
    sim.out('Bw', '<i>B</i> a la misma distancia del cable');
    let ph = 0.3;
    sim.animate((dt) => { ph += dt * 1.6; });
    sim.onDraw(() => {
      const p = sim.p, R = p.R / 100, r = p.r / 100, w = 2 * Math.PI * p.f * 1e3;
      const i = p.I0 * Math.cos(ph);
      const Q = (p.I0 / w) * Math.sin(ph);
      const E = Q / (K.eps0 * Math.PI * R * R);
      const Id = i; /* ε0 π R² dE/dt */
      const Bgap = (rr) => (rr < R ? (K.mu0 * i * rr) / (2 * Math.PI * R * R) : (K.mu0 * i) / (2 * Math.PI * rr));
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, cy = H / 2, sc = (H * 0.42) / 0.15;
      const xp1 = W * 0.52, xp2 = W * 0.64;
      /* cables */
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(8, cy); ctx.lineTo(xp1, cy); ctx.moveTo(xp2, cy); ctx.lineTo(W - 8, cy); ctx.stroke();
      /* placas */
      const hp = R * sc;
      ctx.fillStyle = EM.col(Q >= 0 ? '--pos' : '--neg'); ctx.fillRect(xp1 - 4, cy - hp, 5, 2 * hp);
      ctx.fillStyle = EM.col(Q >= 0 ? '--neg' : '--pos'); ctx.fillRect(xp2 - 1, cy - hp, 5, 2 * hp);
      /* E entre placas */
      const Emax = p.I0 / w / (K.eps0 * Math.PI * R * R);
      const nE = 5;
      for (let k = 0; k < nE; k++) {
        const y = cy - hp + ((k + 0.5) * 2 * hp) / nE;
        const L = ((xp2 - xp1 - 10) * E) / Emax;
        if (Math.abs(L) > 2) EM.draw.arrow(ctx, (xp1 + xp2) / 2 - L / 2, y, (xp1 + xp2) / 2 + L / 2, y, { color: '--efield', width: 1.8, head: 6 });
      }
      /* B (fuera del plano: arriba ⊙ / abajo ⊗ según el sentido de la corriente) */
      const Bref = (K.mu0 * p.I0) / (2 * Math.PI * R);
      const drawB = (x, rr) => {
        const b = Bgap(rr), s = Math.min(9, 2 + (7 * Math.abs(b)) / Bref);
        if (Math.abs(b) / Bref < 0.03) return;
        EM.draw.current(ctx, x, cy - rr * sc, b >= 0 ? -1 : 1, { r: s });
        EM.draw.current(ctx, x, cy + rr * sc, b >= 0 ? 1 : -1, { r: s });
      };
      for (const rr of [0.02, 0.04, 0.07, 0.1, 0.13]) { drawB((xp1 + xp2) / 2, rr); drawB(W * 0.18, rr); }
      /* curvas amperianas (vistas de canto) */
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * 0.3, cy - r * sc); ctx.lineTo(W * 0.3, cy + r * sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((xp1 + xp2) / 2, cy - r * sc); ctx.lineTo((xp1 + xp2) / 2, cy + r * sc); ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'i', 30, cy - 10, { size: 13, italic: true, weight: 700, family: EM.FONT_MATH, color: '--c4' });
      EM.draw.arrow(ctx, 36, cy + 14, 76, cy + 14, { color: i >= 0 ? '--c4' : '--ink-3', width: 2, head: 8 });
      EM.text(ctx, 'curva sobre el cable', W * 0.3, cy + r * sc + 16, { size: 11, color: '--accent', align: 'center', halo: true });
      EM.text(ctx, 'curva entre las placas', (xp1 + xp2) / 2, cy - r * sc - 8, { size: 11, color: '--accent', align: 'center', halo: true });
      /* gráfica B(r) */
      EM.draw.clear(cp);
      const Bm = Bref * 1.15 * 1e6;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 15, ymin: -Bm, ymax: Bm, xlabel: 'r (cm)', ylabel: 'B (µT)', title: 'B(r) entre las placas y alrededor del cable' });
      pl.frame();
      pl.fn((rr) => Bgap(rr / 100) * 1e6, { color: '--bfield', width: 2.4 });
      pl.fn((rr) => ((K.mu0 * i) / (2 * Math.PI * (rr / 100))) * 1e6, { color: '--c4', width: 1.6, dash: [5, 4], from: 0.3 });
      pl.vline(p.R, { color: '--ink-3', label: 'R' });
      pl.dot(p.r, Bgap(r) * 1e6, { color: '--accent', r: 5 });
      pl.legend([{ label: 'entre placas (I_{d})', color: '--bfield' }, { label: 'alrededor del cable (I)', color: '--c4', dash: [5, 4] }], 'tr');
      sim.set('I', EM.si(i, 'A'));
      sim.set('Id', EM.si(Id, 'A'));
      sim.set('Ienc', EM.si(r < R ? (Id * r * r) / (R * R) : Id, 'A'));
      sim.set('B', EM.si(Bgap(r), 'T'));
      sim.set('Bw', EM.si((K.mu0 * i) / (2 * Math.PI * r), 'T'));
      void E;
    });
  });

  /* ======================================================================
     19.2 Vector de Poynting
     ====================================================================== */
  EM.defineSim('poynting', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.6, az: rad(25), el: rad(18) });
    sim.group('Sistema');
    sim.seg('mode', { options: [['wire', 'Resistor'], ['cap', 'Condensador que se carga']], value: 'wire' });
    sim.slider('I', { label: 'Corriente <i>I</i>', min: 0.1, max: 10, step: 0.1, value: 2, unit: 'A', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R', { label: 'Resistencia del hilo (1 m, radio 1 mm)', min: 0.1, max: 10, step: 0.1, value: 2, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.out('E', '<i>E</i> en la superficie');
    sim.out('B', '<i>B</i> en la superficie');
    sim.out('S', '|<b>S</b>| en la superficie');
    sim.out('flux', 'Flujo entrante de <b>S</b>', { hl: true });
    sim.out('P', 'Potencia <i>I</i>²<i>R</i> o d<i>U</i>/d<i>t</i>');
    sim.hint('Arrastra para girar', cv);
    sim.legend([{ color: '--efield', label: '<b>E</b>' }, { color: '--bfield', label: '<b>B</b>' }, { color: '--gold', label: '<b>S</b> = <b>E</b>×<b>H</b>' }]);
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p;
      v3.begin();
      if (p.mode === 'wire') {
        const a = 0.25, L = 1.3;
        v3.mesh((f, z) => [a * Math.cos(f), a * Math.sin(f), z], 0, 2 * Math.PI, 28, -L, L, 6, { fill: '--c4', alpha: 0.35 });
        v3.arrow([0, 0, -L - 0.3], [0, 0, -L + 0.1], { color: '--c4', width: 4, head: 11 });
        v3.text([0.15, 0, -L - 0.2], 'I', { size: 14, weight: 700, family: EM.FONT_MATH, color: '--c4' });
        for (let k = 0; k < 8; k++) {
          const f = (2 * Math.PI * k) / 8;
          for (const z of [-0.7, 0, 0.7]) {
            const P0 = [a * Math.cos(f), a * Math.sin(f), z];
            v3.arrow(V.add(P0, [0, 0, -0.17]), V.add(P0, [0, 0, 0.17]), { color: '--efield', width: 1.6, head: 7 });
            v3.arrow(V.scale([Math.cos(f), Math.sin(f), 0], a + 0.55).map((c, i) => (i === 2 ? z : c)), V.scale([Math.cos(f), Math.sin(f), 0], a + 0.08).map((c, i) => (i === 2 ? z : c)), { color: '--gold', width: 2.4, head: 9 });
          }
        }
        for (const z of [-1, 0.35, 1.05]) { const pts = []; for (let k = 0; k <= 48; k++) pts.push([(a + 0.3) * Math.cos((2 * Math.PI * k) / 48), (a + 0.3) * Math.sin((2 * Math.PI * k) / 48), z]); v3.polyline(pts, { color: '--bfield', width: 1.6 }); v3.arrow(pts[10], pts[13], { color: '--bfield', width: 1.6, head: 8 }); }
        v3.render();
        const I = p.I, R = p.R, Vv = I * R, aa = 1e-3, LL = 1;
        const E = Vv / LL, B = (K.mu0 * I) / (2 * Math.PI * aa), S = (E * B) / K.mu0;
        sim.set('E', EM.si(E, 'V/m'));
        sim.set('B', EM.si(B, 'T'));
        sim.set('S', EM.si(S, 'W/m²'));
        sim.set('flux', EM.si(S * 2 * Math.PI * aa * LL, 'W'));
        sim.set('P', EM.si(I * I * R, 'W'));
      } else {
        const Rp = 0.9, d = 0.45;
        const disc = (z, col) => v3.mesh((r, f) => [r * Math.cos(f), r * Math.sin(f), z], 0, Rp, 3, 0, 2 * Math.PI, 36, { fill: col, alpha: 0.4 });
        disc(d / 2, '--pos'); disc(-d / 2, '--neg');
        v3.line([0, 0, d / 2], [0, 0, 1.3], { color: '--c4', width: 4, seg: 4 });
        v3.line([0, 0, -d / 2], [0, 0, -1.3], { color: '--c4', width: 4, seg: 4 });
        v3.arrow([0, 0, -1.3], [0, 0, -0.9], { color: '--c4', width: 4, head: 10 });
        for (let k = 0; k < 10; k++) { const f = (2 * Math.PI * k) / 10, r = 0.25 + 0.6 * ((k % 3) / 2); v3.arrow([r * Math.cos(f), r * Math.sin(f), d / 2 - 0.02], [r * Math.cos(f), r * Math.sin(f), -d / 2 + 0.02], { color: '--efield', width: 1.4, head: 6 }); }
        const pts = []; for (let k = 0; k <= 60; k++) pts.push([Rp * Math.cos((2 * Math.PI * k) / 60), Rp * Math.sin((2 * Math.PI * k) / 60), 0]);
        v3.polyline(pts, { color: '--bfield', width: 2 });
        v3.arrow(pts[40], pts[43], { color: '--bfield', width: 2, head: 9 });
        for (let k = 0; k < 10; k++) { const f = (2 * Math.PI * k) / 10; v3.arrow([(Rp + 0.5) * Math.cos(f), (Rp + 0.5) * Math.sin(f), 0], [(Rp + 0.05) * Math.cos(f), (Rp + 0.05) * Math.sin(f), 0], { color: '--gold', width: 2.4, head: 9 }); }
        v3.render();
        /* placas de 5 cm de radio y 1 mm de separación; E crece con dE/dt = I/(ε0πR²) */
        const Rm = 0.05, dm = 1e-3, I = p.I;
        const Tcycle = 4, tt = t % Tcycle;
        const Q = I * tt * 1e-9; /* la animación recorre 4 ns de carga con corriente constante */
        const E = Q / (K.eps0 * Math.PI * Rm * Rm), dE = I / (K.eps0 * Math.PI * Rm * Rm);
        const B = (K.mu0 * K.eps0 * Rm * dE) / 2, S = (E * B) / K.mu0;
        sim.set('E', EM.si(E, 'V/m') + ' (t = ' + EM.fix(tt, 2) + ' ns)');
        sim.set('B', EM.si(B, 'T'));
        sim.set('S', EM.si(S, 'W/m²'));
        sim.set('flux', EM.si(S * 2 * Math.PI * Rm * dm, 'W'));
        sim.set('P', EM.si(K.eps0 * E * dE * Math.PI * Rm * Rm * dm, 'W') + ' (d/dt de ½ε₀E²·vol)');
      }
    });
  });
})();
