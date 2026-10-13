/* Capítulo 8 — Átomos de muchos electrones */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom;
  const f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     8.1 Helio variacional
     ====================================================================== */
  CQ.defineSim('helio-variacional', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 0.95 });
    const cr = sim.canvas({ aspect: 0.95 });
    const IONS = { 1: ['H⁻', -0.527751], 2: ['He', -2.903724], 3: ['Li⁺', -7.279913], 4: ['Be²⁺', -13.655566] };
    sim.group('Sistema de dos electrones');
    sim.seg('Z', { label: 'Núcleo', options: [[1, 'H⁻'], [2, 'He'], [3, 'Li⁺'], [4, 'Be²⁺']], value: 2 });
    sim.slider('z', { label: 'Carga efectiva de prueba ζ', min: 0.3, max: 4.5, value: 2, step: 0.005, fmt: (v) => CQ.fix(v, 3) });
    sim.button('Ir al mínimo', () => sim.ctl.z.set(+sim.p.Z - 5 / 16), { primary: true });
    sim.out('E', '<i>E</i>(ζ)', { hl: true });
    sim.out('T', 'Cinética ζ²');
    sim.out('Vne', 'Atracción −2<i>Z</i>ζ');
    sim.out('Vee', 'Repulsión (5/8)ζ');
    sim.out('opt', 'ζ óptimo y <i>E</i> mínima');
    sim.out('ex', 'Exacta / error (correlación)');
    sim.onChange = (id) => { if (id === 'Z') sim.ctl.z.set(+sim.p.Z - 5 / 16, true); };
    sim.onDraw(() => {
      const Z = +sim.p.Z, z = sim.p.z;
      const E = (x) => A.heliumVar(x, Z);
      const zo = Z - 5 / 16, Eo = E(zo);
      CQ.draw.clear(ce);
      const pl = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0.3, xmax: 4.5, ymin: -2.2 * Z * Z, ymax: Z * Z * 1.4, xlabel: 'ζ', ylabel: 'energía (Ha)' });
      pl.frame();
      pl.fn((x) => x * x, { color: '--c3', width: 1.5, dash: [5, 3] });
      pl.fn((x) => -2 * Z * x, { color: '--c1', width: 1.5, dash: [5, 3] });
      pl.fn((x) => (5 / 8) * x, { color: '--c2', width: 1.5, dash: [5, 3] });
      pl.fn(E, { color: '--ink', width: 2.6 });
      pl.hline(IONS[Z][1], { color: '--accent', label: `exacta ${IONS[Z][1]} Ha`, labelRight: true });
      pl.dot(zo, Eo, { color: '--ink', label: 'mínimo' });
      pl.dot(z, E(z), { color: '--accent' });
      pl.legend([{ label: 'E total', color: '--ink' }, { label: 'cinética ζ²', color: '--c3', dash: [5, 3] }, { label: 'núcleo −2Zζ', color: '--c1', dash: [5, 3] }, { label: 'repulsión 5ζ/8', color: '--c2', dash: [5, 3] }], 'br');
      /* densidad radial */
      CQ.draw.clear(cr);
      const rmax = 6 / Math.min(z, Z) + 0.5;
      const Pr = (r, q) => 4 * q ** 3 * r * r * Math.exp(-2 * q * r) * 2; /* 2 electrones en 1s de exponente q */
      let mx = 0; for (let q = 1; q <= 300; q++) { const r = (rmax * q) / 300; mx = Math.max(mx, Pr(r, z), Pr(r, Z)); }
      const pr = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: rmax, ymin: 0, ymax: mx * 1.15, xlabel: 'r (a₀)', ylabel: 'densidad radial 4πr²n(r)', title: 'nube electrónica' });
      pr.frame();
      pr.fn((r) => Pr(r, Z), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pr.fn((r) => Pr(r, z), { color: '--prob', width: 2.4, fill: '--prob', fillAlpha: 0.15 });
      pr.legend([{ label: `sin apantallar (ζ = Z = ${Z})`, color: '--ink-3', dash: [5, 4] }, { label: `ζ = ${CQ.fix(z, 3)}`, color: '--prob' }]);
      sim.set('E', f4(E(z)) + ' Ha = ' + CQ.fix(E(z) * P.K.Ha_eV, 2) + ' eV');
      sim.set('T', f4(z * z));
      sim.set('Vne', f4(-2 * Z * z));
      sim.set('Vee', f4((5 / 8) * z));
      sim.set('opt', `${f4(zo)} · ${f4(Eo)} Ha`);
      sim.set('ex', `${IONS[Z][1]} · ${CQ.fix(Eo - IONS[Z][1], 4)} Ha`);
    });
  });

  /* ======================================================================
     8.2 Configuración electrónica (diagrama de cajas)
     ====================================================================== */
  CQ.defineSim('configuracion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Elemento');
    sim.slider('Z', { label: 'Número atómico <i>Z</i>', min: 1, max: 36, value: 7, step: 1, fmt: (v) => `${v} · ${A.SYM[v]}` });
    sim.out('name', 'Elemento', { hl: true });
    sim.out('cfg', 'Configuración');
    sim.out('val', 'Electrones de valencia');
    sim.out('unp', 'Electrones desapareados (Hund)');
    sim.out('zef', '<i>Z</i><sub>ef</sub> del último electrón (Slater)');
    sim.out('ie', 'Energía de ionización (exp.)');
    sim.out('en', 'Electronegatividad (Pauling)');
    sim.onDraw(() => {
      const Z = sim.p.Z;
      const occ = A.config(Z);
      /* subcapas en orden de Madelung hasta la última ocupada */
      const order = A.MADELUNG.filter(([n, l]) => occ.some((o) => o.n === n && o.l === l) || A.MADELUNG.findIndex((q) => q[0] === n && q[1] === l) <= A.MADELUNG.findIndex((q) => q[0] === occ[occ.length - 1].n && q[1] === occ[occ.length - 1].l) + 1);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      CQ.draw.clear(cv);
      const rows = order.length;
      const bs = Math.min(28, (H - 30) / (rows + 0.5), (W - 150) / 7.5);
      let unp = 0;
      order.forEach(([n, l], i) => {
        const y = H - 18 - (i + 1) * (bs * 1.12);
        const o = occ.find((q) => q.n === n && q.l === l);
        const f = o ? o.f : 0, nb = 2 * l + 1;
        CQ.text(ctx, `${n}${A.LLET[l]}`, 26, y + bs * 0.66, { size: 14, weight: 650, color: f ? '--ink' : '--ink-3', align: 'center' });
        for (let b = 0; b < nb; b++) {
          const x = 52 + b * bs * 1.05;
          ctx.strokeStyle = CQ.col(f ? '--ink-2' : '--grid-2'); ctx.lineWidth = 1.2;
          ctx.strokeRect(x, y, bs, bs);
          const up = f > b ? 1 : 0, dn = f > nb + b ? 1 : 0;
          if (up) CQ.draw.arrow(ctx, x + bs * (dn ? 0.33 : 0.5), y + bs * 0.85, x + bs * (dn ? 0.33 : 0.5), y + bs * 0.15, { color: '--accent', width: 1.8, head: 6 });
          if (dn) CQ.draw.arrow(ctx, x + bs * 0.67, y + bs * 0.15, x + bs * 0.67, y + bs * 0.85, { color: '--c1', width: 1.8, head: 6 });
          if (up && !dn) unp++;
        }
        if (o) CQ.text(ctx, `Z_{ef} = ${CQ.fix(A.slaterZeff(Z, n, l, occ), 2)}`, 52 + 7.4 * bs * 1.05, y + bs * 0.66, { size: 11.5, color: '--ink-3', mono: true });
      });
      CQ.text(ctx, 'energía ↑ (orden de llenado de Madelung)', W - 12, 18, { size: 11.5, color: '--ink-3', align: 'right' });
      const last = occ[occ.length - 1];
      const nmax = Math.max(...occ.map((o) => o.n));
      const val = occ.filter((o) => o.n === nmax || (o.l === 2 && o.n === nmax - 1 && o.f < 10)).reduce((s, o) => s + o.f, 0);
      sim.set('name', `${A.SYM[Z]} · ${A.NAME[Z]}`);
      sim.set('cfg', A.configStr(occ));
      sim.set('val', String(val));
      sim.set('unp', String(unp));
      sim.set('zef', CQ.fix(A.slaterZeff(Z, last.n, last.l, occ), 2));
      sim.set('ie', CQ.fix(A.IE[Z], 3) + ' eV');
      sim.set('en', A.EN[Z] === null ? '—' : CQ.fix(A.EN[Z], 2));
    });
  });

  /* ======================================================================
     8.3 Tendencias periódicas
     ====================================================================== */
  CQ.defineSim('tendencias', function (sim) {
    const ci = sim.canvas({ aspect: 2.6 });
    const cn = sim.canvas({ aspect: 3.2 });
    sim.group('Resaltar');
    sim.check('hbn', { label: 'Elementos de hBN-MC (H, B, C, N)', value: true });
    sim.check('zef', { label: 'Superponer Z<sub>ef</sub> de Slater (escala derecha)', value: false });
    sim.slider('Z', { label: 'Elemento señalado', min: 1, max: 36, value: 5, step: 1, fmt: (v) => `${v} · ${A.SYM[v]}` });
    sim.out('ie', 'Ionización');
    sim.out('en', 'Electronegatividad');
    sim.out('zf', '<i>Z</i><sub>ef</sub> (Slater)');
    const HB = { 1: '--c6', 5: '--atB', 6: '--atC', 7: '--atN' };
    sim.onDraw(() => {
      const Zs = Array.from({ length: 36 }, (_, i) => i + 1);
      CQ.draw.clear(ci);
      const pi = new CQ.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: 0, xmax: 37, ymin: 0, ymax: 26, xlabel: '', ylabel: 'ionización (eV)', mb: 22, title: 'primera energía de ionización' });
      pi.frame();
      [2, 10, 18, 36].forEach((z) => pi.vline(z + 0.5, { color: '--grid-2' }));
      pi.path(Zs.map((z) => [z, A.IE[z]]), { color: '--c1', width: 1.8 });
      Zs.forEach((z) => pi.dot(z, A.IE[z], { color: sim.p.hbn && HB[z] ? HB[z] : '--c1', r: sim.p.hbn && HB[z] ? 6 : 3, label: sim.p.hbn && HB[z] ? A.SYM[z] : (z === 2 || z === 10 || z === 18 || z === 36 ? A.SYM[z] : ''), dy: -9 }));
      if (sim.p.zef) {
        const zf = (z) => { const o = A.config(z); const l = o[o.length - 1]; return A.slaterZeff(z, l.n, l.l, o); };
        pi.path(Zs.map((z) => [z, zf(z) * 26 / 8]), { color: '--c4', width: 1.4, dash: [4, 3] });
        pi.label(33, zf(33) * 26 / 8 + 1.5, 'Z_{ef} × 3.25', { color: '--c4' });
      }
      pi.vline(sim.p.Z, { color: '--accent' });
      CQ.draw.clear(cn);
      const pn = new CQ.Plot(cn.ctx, { x: 0, y: 0, w: cn.w, h: cn.h, xmin: 0, xmax: 37, ymin: 0.5, ymax: 4.3, xlabel: 'número atómico Z', ylabel: 'χ (Pauling)', title: 'electronegatividad' });
      pn.frame();
      const pts = Zs.filter((z) => A.EN[z] !== null).map((z) => [z, A.EN[z]]);
      pts.forEach(([z, e]) => pn.dot(z, e, { color: sim.p.hbn && HB[z] ? HB[z] : '--c3', r: sim.p.hbn && HB[z] ? 6 : 3, label: sim.p.hbn && HB[z] ? A.SYM[z] : '', dy: -9 }));
      pn.vline(sim.p.Z, { color: '--accent' });
      const o = A.config(sim.p.Z), l = o[o.length - 1];
      sim.set('ie', `${A.SYM[sim.p.Z]}: ${CQ.fix(A.IE[sim.p.Z], 3)} eV`);
      sim.set('en', A.EN[sim.p.Z] === null ? '—' : CQ.fix(A.EN[sim.p.Z], 2));
      sim.set('zf', CQ.fix(A.slaterZeff(sim.p.Z, l.n, l.l, o), 2));
    });
  });
})();
