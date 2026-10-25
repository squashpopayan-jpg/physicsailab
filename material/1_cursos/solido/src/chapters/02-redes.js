/* Capítulo 2 — Redes de Bravais y estructuras cristalinas */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, V = EM.V;
  const rad = EM.M.rad;

  /* 2.1 Redes del plano */
  EM.defineSim('red2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('t', { label: 'Red', options: [['obl', 'Oblicua'], ['rect', 'Rectangular'], ['crect', 'Rectangular centrada'], ['sq', 'Cuadrada'], ['hex', 'Hexagonal']], value: 'hex' });
    sim.slider('b', { label: 'b/a', min: 0.6, max: 1.8, step: 0.01, value: 1.3, fmt: (v) => v.toFixed(2) });
    sim.slider('g', { label: 'Ángulo γ', min: 50, max: 130, step: 1, value: 75, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Mostrar');
    sim.check('prim', { label: 'Celda primitiva', value: true });
    sim.check('conv', { label: 'Celda convencional', value: false });
    sim.check('ws', { label: 'Celda de Wigner–Seitz', value: true });
    sim.check('basis', { label: 'Base de dos átomos (panal)', value: false });
    sim.out('area', 'Área de la celda primitiva', { hl: true });
    sim.out('ws', 'Área de Wigner–Seitz');
    sim.out('nn', 'Vecinos más próximos');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const t = p.t;
      sim.ctl.b.show(t === 'obl' || t === 'rect' || t === 'crect');
      sim.ctl.g.show(t === 'obl');
      let a1, a2, conv = null;
      const b = p.b;
      if (t === 'obl') { a1 = [1, 0]; a2 = [b * Math.cos(rad(p.g)), b * Math.sin(rad(p.g))]; }
      else if (t === 'rect') { a1 = [1, 0]; a2 = [0, b]; }
      else if (t === 'crect') { a1 = [1, 0]; a2 = [0.5, b / 2]; conv = [[1, 0], [0, b]]; }
      else if (t === 'sq') { a1 = [1, 0]; a2 = [0, 1]; }
      else { a1 = [1, 0]; a2 = [-0.5, Math.sqrt(3) / 2]; conv = null; }
      const v = D.view({ x: 0, y: 0, w: W, h: H }, -2.6, 2.6, -1.7, 1.7);
      const basis = p.basis && t === 'hex' ? [[0, 0], [0.5, Math.sqrt(3) / 6]] : [[0, 0]];
      /* Wigner–Seitz */
      const ws = SS.wignerSeitz2d(a1, a2);
      if (p.ws) D.polygon(ctx, v, ws, { fill: '--c3', alpha: 0.16, stroke: '--c3', width: 2 });
      if (p.prim) D.polygon(ctx, v, [[0, 0], a1, [a1[0] + a2[0], a1[1] + a2[1]], a2], { fill: '--c1', alpha: 0.1, stroke: '--c1', width: 2 });
      if (p.conv && conv) D.polygon(ctx, v, [[0, 0], conv[0], [conv[0][0] + conv[1][0], conv[0][1] + conv[1][1]], conv[1]], { stroke: '--c2', width: 2, dash: [6, 4] });
      if (p.basis && t === 'hex') {
        /* enlaces del panal */
        const pts = D.lattice2d(ctx, v, a1, a2, basis, { draw: false, N: 8 });
        ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.lineWidth = 1.5;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
          if (Math.abs(d - 1 / Math.sqrt(3)) < 1e-6) { ctx.beginPath(); ctx.moveTo(v.X(pts[i][0]), v.Y(pts[i][1])); ctx.lineTo(v.X(pts[j][0]), v.Y(pts[j][1])); ctx.stroke(); }
        }
      }
      D.lattice2d(ctx, v, a1, a2, basis, { N: 8, r: 0.07, colors: ['--c1', '--c2'] });
      D.arrow(ctx, v, [0, 0], a1, { color: '--c1', width: 2.2 });
      D.arrow(ctx, v, [0, 0], a2, { color: '--c1', width: 2.2 });
      EM.text(ctx, 'a_1', v.X(a1[0]) + 4, v.Y(a1[1]) + 16, { size: 13, italic: true, weight: 700, color: '--c1', halo: true });
      EM.text(ctx, 'a_2', v.X(a2[0]) - 18, v.Y(a2[1]) - 6, { size: 13, italic: true, weight: 700, color: '--c1', halo: true });
      const area = Math.abs(a1[0] * a2[1] - a1[1] * a2[0]);
      let wa = 0;
      for (let i = 0; i < ws.length; i++) { const P = ws[i], Q = ws[(i + 1) % ws.length]; wa += P[0] * Q[1] - P[1] * Q[0]; }
      /* vecinos */
      const ds = [];
      for (let m = -3; m <= 3; m++) for (let n = -3; n <= 3; n++) if (m || n) ds.push(Math.hypot(m * a1[0] + n * a2[0], m * a1[1] + n * a2[1]));
      const dmin = Math.min(...ds), nn = ds.filter((d) => Math.abs(d - dmin) < 1e-9).length;
      sim.set('area', EM.fix(area, 4) + ' a²' + (conv ? ' (convencional: ' + EM.fix(Math.abs(conv[0][0] * conv[1][1] - conv[0][1] * conv[1][0]), 3) + ' a², 2 puntos)' : ''));
      sim.set('ws', EM.fix(Math.abs(wa) / 2, 4) + ' a² · ' + ws.length + ' lados');
      sim.set('nn', (p.basis && t === 'hex' ? '3 átomos a a/√3 (panal)' : nn + ' a ' + EM.fix(dmin, 3) + ' a'));
    });
  });

  /* 2.2 Las catorce redes de Bravais */
  const BRAVAIS = [
    ['tri-P', 'Triclínica P', [1, 1.15, 1.3, 75, 85, 100], 'P', 'triclínico', '1̄'],
    ['mono-P', 'Monoclínica P', [1, 1.2, 1.35, 90, 105, 90], 'P', 'monoclínico', '2/m'],
    ['mono-C', 'Monoclínica C', [1, 1.2, 1.35, 90, 105, 90], 'C', 'monoclínico', '2/m'],
    ['ort-P', 'Ortorrómbica P', [1, 1.25, 1.5, 90, 90, 90], 'P', 'ortorrómbico', 'mmm'],
    ['ort-C', 'Ortorrómbica C', [1, 1.25, 1.5, 90, 90, 90], 'C', 'ortorrómbico', 'mmm'],
    ['ort-I', 'Ortorrómbica I', [1, 1.25, 1.5, 90, 90, 90], 'I', 'ortorrómbico', 'mmm'],
    ['ort-F', 'Ortorrómbica F', [1, 1.25, 1.5, 90, 90, 90], 'F', 'ortorrómbico', 'mmm'],
    ['tet-P', 'Tetragonal P', [1, 1, 1.45, 90, 90, 90], 'P', 'tetragonal', '4/mmm'],
    ['tet-I', 'Tetragonal I', [1, 1, 1.45, 90, 90, 90], 'I', 'tetragonal', '4/mmm'],
    ['rho-R', 'Trigonal R (romboédrica)', [1, 1, 1, 70, 70, 70], 'P', 'trigonal', '3̄m'],
    ['hex-P', 'Hexagonal P', [1, 1, 1.6, 90, 90, 120], 'P', 'hexagonal', '6/mmm'],
    ['cub-P', 'Cúbica P (sc)', [1, 1, 1, 90, 90, 90], 'P', 'cúbico', 'm3̄m'],
    ['cub-I', 'Cúbica I (bcc)', [1, 1, 1, 90, 90, 90], 'I', 'cúbico', 'm3̄m'],
    ['cub-F', 'Cúbica F (fcc)', [1, 1, 1, 90, 90, 90], 'F', 'cúbico', 'm3̄m']
  ];
  const CENT = { P: [[0, 0, 0]], I: [[0, 0, 0], [0.5, 0.5, 0.5]], F: [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]], C: [[0, 0, 0], [0.5, 0.5, 0]] };
  const cellFrom = ([a, b, c, al, be, ga]) => {
    const ca = Math.cos(rad(al)), cb = Math.cos(rad(be)), cg = Math.cos(rad(ga)), sg = Math.sin(rad(ga));
    const cx = cb, cy = (ca - cb * cg) / sg;
    return [[a, 0, 0], [b * cg, b * sg, 0], [c * cx, c * cy, c * Math.sqrt(Math.max(0, 1 - cx * cx - cy * cy))]];
  };
  EM.defineSim('bravais3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.select('L', { label: 'Red', options: BRAVAIS.map((b) => [b[0], b[1]]), value: 'cub-F' });
    sim.slider('al', { label: 'Ángulo romboédrico α', min: 40, max: 110, step: 1, value: 70, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Celdas por eje', min: 1, max: 2, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.check('prim', { label: 'Vectores primitivos', value: true });
    sim.out('sys', 'Sistema y grupo puntual', { hl: true });
    sim.out('np', 'Puntos de red por celda convencional');
    sim.out('vol', 'Volumen de la celda primitiva');
    const v = new EM.View3D(sim, cv, { az: rad(28), el: rad(20), radius: 2.2, persp: 0.15 });
    sim.onDraw(() => {
      const p = sim.p, B = BRAVAIS.find((x) => x[0] === p.L);
      sim.ctl.al.show(p.L === 'rho-R');
      const par = B[2].slice();
      if (p.L === 'rho-R') par[3] = par[4] = par[5] = p.al;
      const cell = cellFrom(par), N = Math.round(p.N);
      const cen = SS.frac2cart(cell, [N / 2, N / 2, N / 2]);
      const sc = 1.9 / Math.max(...[0, 1, 2].map((i) => Math.hypot(...cell[i]) * N));
      const T = (f) => { const q = SS.frac2cart(cell, f); return [(q[0] - cen[0]) * sc, (q[1] - cen[1]) * sc, (q[2] - cen[2]) * sc]; };
      v.begin();
      for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) v.line(T([a, b, 0]), T([a, b, N]), { color: '--ink-3', width: 1.1, seg: 3 });
      for (let a = 0; a <= N; a++) for (let c = 0; c <= N; c++) v.line(T([a, 0, c]), T([a, N, c]), { color: '--ink-3', width: 1.1, seg: 3 });
      for (let b = 0; b <= N; b++) for (let c = 0; c <= N; c++) v.line(T([0, b, c]), T([N, b, c]), { color: '--ink-3', width: 1.1, seg: 3 });
      const eps = 1e-9;
      const pts = [];
      for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) for (let c = 0; c <= N; c++) for (const o of CENT[B[3]]) {
        const f = [a + o[0], b + o[1], c + o[2]];
        if (f.some((x) => x > N + eps)) continue;
        pts.push(f);
      }
      for (const f of pts) {
        const corner = f.every((x) => Math.abs(x - Math.round(x)) < eps);
        v.point(T(f), { r: corner ? 6 : 7, color: corner ? '--c1' : '--c2', glow: true, ring: false });
      }
      /* vectores primitivos */
      let prim;
      if (B[3] === 'P') prim = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      else if (B[3] === 'I') prim = [[-0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, -0.5]];
      else if (B[3] === 'F') prim = [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
      else prim = [[0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, 1]];
      if (p.prim) {
        const o = B[3] === 'I' ? [0.5, 0.5, 0.5] : [0, 0, 0];
        prim.forEach((d, i) => v.arrow(T(o), T([o[0] + d[0], o[1] + d[1], o[2] + d[2]]), { color: '--accent', width: 2.4, head: 11 }) && v.text(T([o[0] + d[0] * 1.08, o[1] + d[1] * 1.08, o[2] + d[2] * 1.08]), 'a_' + (i + 1), { size: 13, italic: true, color: '--accent', weight: 700 }));
      }
      v.render();
      const Vc = Math.abs(EM.lin.det3(cell));
      const n = { P: 1, I: 2, F: 4, C: 2 }[B[3]];
      sim.set('sys', B[4] + ' · ' + B[5]);
      sim.set('np', n + (n > 1 ? ' (centrada ' + B[3] + ')' : ' (primitiva)'));
      sim.set('vol', EM.fix(Vc / n, 3) + ' (en unidades de a³)');
    });
  });

  /* 2.3 Estructuras cristalinas */
  const SLIST = [
    ['sc', 'Cúbica simple', ['Po'], [0.6], null], ['bcc', 'bcc (Fe)', ['Fe'], [0.6], 'Fe'], ['fcc', 'fcc (Cu)', ['Cu'], [0.6], 'Cu'],
    ['hcp', 'hcp (Mg)', ['Mg'], [0.6], 'Mg'], ['diamond', 'Diamante (Si)', ['Si'], [0.5], 'Si'], ['zincblende', 'Blenda de zinc (GaAs)', ['Ga', 'As'], [0.55, 0.55], 'GaAs'],
    ['NaCl', 'NaCl', ['Na', 'Cl'], [0.45, 0.75], 'NaCl'], ['CsCl', 'CsCl', ['Cs', 'Cl'], [0.75, 0.65], 'CsCl'], ['fluorite', 'Fluorita (CaF₂)', ['Ca', 'F'], [0.65, 0.5], 'CaF2'],
    ['perovskite', 'Perovskita (SrTiO₃)', ['Sr', 'Ti', 'O'], [0.8, 0.45, 0.5], 'SrTiO3'], ['wurtzite', 'Wurtzita (ZnO)', ['Zn', 'O'], [0.55, 0.5], 'ZnO']
  ];
  EM.defineSim('estructuras3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.select('s', { label: 'Estructura', options: SLIST.map((x) => [x[0], x[1]]), value: 'diamond' });
    sim.slider('N', { label: 'Celdas por eje', min: 1, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Tamaño de los átomos', min: 0.3, max: 1.6, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.check('coord', { label: 'Resaltar un átomo y sus vecinos', value: true });
    sim.out('z', 'Átomos por celda convencional', { hl: true });
    sim.out('c', 'Coordinación y distancia');
    sim.out('rho', 'Densidad del material de ejemplo');
    const v = new EM.View3D(sim, cv, { az: rad(32), el: rad(18), radius: 2.2, persp: 0.15 });
    sim.onDraw(() => {
      const p = sim.p, S = SLIST.find((x) => x[0] === p.s), N = Math.round(p.N);
      const d = S[4] ? EM.data.crystals[S[4]] : { a: 1 };
      const st = SS.structure(S[0], 1, d.c ? d.c / d.a : undefined, S[0] === 'wurtzite' ? 0.382 : undefined);
      v.begin();
      const NN = S[0] === 'hcp' || S[0] === 'wurtzite' ? [N + 1, N + 1, N] : [N, N, N];
      const r = EM.renderCrystal(v, st, { N: NN, els: S[2], radii: S[3], rScale: 0.22 * p.r, alpha: p.coord ? 0.55 : 1 });
      const sh = SS.neighbors(st, 0, 2);
      if (p.coord) {
        /* átomo central: el más cercano al centro del bloque */
        let best = null, bd = Infinity;
        const cen = SS.frac2cart(st.cell, NN.map((x) => x / 2));
        for (const at of r.atoms) { const dd = Math.hypot(at.p[0] - cen[0], at.p[1] - cen[1], at.p[2] - cen[2]) + (at.s ? 0.01 : 0); if (dd < bd) { bd = dd; best = at; } }
        const dnn = SS.neighbors(st, st.atoms.findIndex((a) => a.s === best.s), 1)[0].d;
        v.point(r.T(best.p), { r: 9, color: '--accent', glow: true, ring: '--canvas', ringWidth: 2, bias: -0.05 });
        /* vecinos (incluye imágenes fuera del bloque) */
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const at of st.atoms) {
          const q = SS.frac2cart(st.cell, [Math.floor(best.f[0]) + at.f[0] + a, Math.floor(best.f[1]) + at.f[1] + b, Math.floor(best.f[2]) + at.f[2] + c]);
          const dd = Math.hypot(q[0] - best.p[0], q[1] - best.p[1], q[2] - best.p[2]);
          if (Math.abs(dd - dnn) < 1e-6) {
            v.line(r.T(best.p), r.T(q), { color: '--accent', width: 3, seg: 3 });
            v.point(r.T(q), { r: 6.5, color: D.atomColor(S[2][at.s], at.s), glow: true, ring: '--accent', ringWidth: 2 });
          }
        }
      }
      v.render();
      const cnt = S[2].map((e, i) => st.atoms.filter((a) => a.s === i).length + ' ' + e);
      sim.set('z', st.atoms.length + (S[2].length > 1 ? ' (' + cnt.join(' + ') + ')' : ''));
      sim.set('c', sh[0].n + ' vecinos a ' + EM.fix(sh[0].d, 4) + ' a' + (S[4] ? ' = ' + EM.fix(sh[0].d * d.a, 3) + ' Å' : ''));
      sim.set('rho', S[4] ? S[4].replace(/(\d)/g, (m) => '₀₁₂₃₄₅₆₇₈₉'[+m]) + ': a = ' + d.a + ' Å → ' + EM.fix(SS.density(S[4]), 3) + ' g/cm³' : 'polonio α: a = 3.35 Å');
    });
  });

  /* 2.4 Apilamiento compacto */
  EM.defineSim('apilamiento', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('seq', { label: 'Secuencia', options: [['hcp', 'ABAB… (hcp)'], ['fcc', 'ABCABC… (fcc)'], ['sf', 'Falla de apilamiento']], value: 'fcc' });
    sim.slider('n', { label: 'Número de capas', min: 1, max: 7, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('f', 'Fracción de empaquetamiento', { hl: true });
    sim.out('ca', 'Razón c/a ideal (hcp)');
    sim.out('sq', 'Secuencia');
    const POS = { A: [0, 0], B: [0.5, Math.sqrt(3) / 6], C: [1, Math.sqrt(3) / 3] };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n);
      EM.draw.clear(cv);
      let seq;
      if (p.seq === 'hcp') seq = 'ABABABA';
      else if (p.seq === 'fcc') seq = 'ABCABCA';
      else seq = 'ABCABAB';
      seq = seq.slice(0, n);
      const wTop = W * 0.62;
      const v = D.view({ x: 8, y: 8, w: wTop - 16, h: H - 16 }, -0.4, 4.4, -0.3, 3.3);
      const a1 = [1, 0], a2 = [0.5, Math.sqrt(3) / 2];
      const cols = { A: '--c1', B: '--c2', C: '--c3' };
      ctx.save(); ctx.beginPath(); ctx.rect(8, 8, wTop - 16, H - 16); ctx.clip();
      for (let L = 0; L < seq.length; L++) {
        const s = seq[L], off = POS[s];
        const pts = [];
        for (let m = -3; m <= 8; m++) for (let k = -3; k <= 8; k++) {
          const x = m * a1[0] + k * a2[0] + off[0], y = m * a1[1] + k * a2[1] + off[1];
          if (x > -0.3 && x < 4.3 && y > -0.2 && y < 3.2) pts.push([x, y]);
        }
        /* radio reducido (0.3 a) para que se vean las capas de abajo */
        for (const q of pts) D.ball(ctx, v.X(q[0]), v.Y(q[1]), 0.3 * v.sx, cols[s], { alpha: 0.95 });
      }
      ctx.restore();
      EM.text(ctx, 'vista superior (esferas reducidas; la última capa encima)', 14, H - 12, { size: 11.5, color: '--ink-3' });
      /* vista lateral */
      const x0 = wTop + 20, wS = W - x0 - 14, hS = H - 40;
      const lh = Math.min(42, hS / 7.5);
      for (let L = 0; L < seq.length; L++) {
        const s = seq[L], y = H - 26 - (L + 0.5) * lh;
        const dx = { A: 0, B: 0.33, C: 0.66 }[s] * lh * 0.9;
        for (let k = 0; k < 4; k++) D.ball(ctx, x0 + 18 + dx + k * lh * 0.9, y, lh * 0.42, cols[s]);
        EM.text(ctx, s, x0 + wS - 6, y, { size: 15, weight: 750, align: 'right', baseline: 'middle', color: cols[s] });
        if (p.seq === 'sf' && L === 5) EM.text(ctx, '← falla', x0 + wS - 20, y, { size: 11.5, align: 'right', baseline: 'middle', color: '--c2', halo: true });
      }
      EM.text(ctx, 'vista lateral', x0 + 4, 16, { size: 11.5, color: '--ink-3' });
      sim.set('f', 'π/(3√2) = 0.7405 (igual en hcp y fcc)');
      sim.set('ca', '√(8/3) = 1.633 · Mg 1.624 · Zn 1.856');
      sim.set('sq', seq.split('').join(' '));
    });
  });

  /* 2.5 Índices de Miller */
  EM.defineSim('miller', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.slider('h', { label: 'h', min: -3, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'k', min: -3, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'l', min: -3, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.check('normal', { label: 'Normal [hkl]', value: true });
    sim.check('fcc', { label: 'Puntos de la red fcc', value: true });
    sim.out('hkl', 'Familia', { hl: true });
    sim.out('d', 'd_{hkl} = a/√(h²+k²+l²)');
    sim.out('np', 'Planos que cortan la celda');
    sim.out('ang', 'Ángulo con (100)');
    const v = new EM.View3D(sim, cv, { az: rad(35), el: rad(22), radius: 2.0, persp: 0.15 });
    const EDGES = [];
    for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) for (const a of [0, 1]) for (const b of [0, 1]) {
      const p0 = [0, 0, 0], p1 = [0, 0, 0];
      const k = 3 - i - j;
      p0[k] = a; p0[j] = b; p0[i] = 0; p1[k] = a; p1[j] = b; p1[i] = 1;
      EDGES.push([p0, p1]);
    }
    sim.onDraw(() => {
      const p = sim.p, h = Math.round(p.h), k = Math.round(p.k), l = Math.round(p.l);
      const T = (q) => [(q[0] - 0.5) * 1.8, (q[1] - 0.5) * 1.8, (q[2] - 0.5) * 1.8];
      v.begin();
      for (const [a, b] of EDGES) v.line(T(a), T(b), { color: '--ink-3', width: 1.2, seg: 3 });
      if (p.fcc) for (const f of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1], [0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]]) v.point(T(f), { r: 4.5, color: '--c1', glow: true, ring: false });
      let nplanes = 0;
      if (h || k || l) {
        const nv = [h, k, l];
        const vals = [0, 1].flatMap((a) => [0, 1].flatMap((b) => [0, 1].map((c) => h * a + k * b + l * c)));
        const lo = Math.min(...vals), hi = Math.max(...vals);
        for (let m = Math.ceil(lo); m <= Math.floor(hi); m++) {
          /* intersección del plano h x + k y + l z = m con las aristas del cubo */
          const P = [];
          for (const [a, b] of EDGES) {
            const fa = V.dot(nv, a) - m, fb = V.dot(nv, b) - m;
            if (fa === 0) P.push(a);
            if (fa * fb < 0) { const t = fa / (fa - fb); P.push(V.lerp(a, b, t)); }
          }
          const uniq = [];
          for (const q of P) if (!uniq.some((u) => V.norm(V.sub(u, q)) < 1e-9)) uniq.push(q);
          if (uniq.length < 3) continue;
          nplanes++;
          const c = V.scale(uniq.reduce((s, q) => V.add(s, q), [0, 0, 0]), 1 / uniq.length);
          const nn = V.unit(nv), u0 = V.unit(V.sub(uniq[0], c)), w0 = V.cross(nn, u0);
          uniq.sort((A, B) => Math.atan2(V.dot(V.sub(A, c), w0), V.dot(V.sub(A, c), u0)) - Math.atan2(V.dot(V.sub(B, c), w0), V.dot(V.sub(B, c), u0)));
          v.poly(uniq.map(T), { fill: '--c2', alpha: 0.28, stroke: '--c2', strokeAlpha: 0.9, strokeWidth: 1.6 });
        }
        if (p.normal) {
          const nn = V.unit(nv);
          v.arrow(T([0.5, 0.5, 0.5]), T(V.add([0.5, 0.5, 0.5], V.scale(nn, 0.75))), { color: '--accent', width: 2.6, head: 12 });
          v.text(T(V.add([0.5, 0.5, 0.5], V.scale(nn, 0.88))), `[${h}${k}${l}]`.replace(/-(\d)/g, '$1̄'), { size: 13, weight: 700, color: '--accent' });
        }
      }
      v.render();
      const n2 = h * h + k * k + l * l;
      const bar = (x) => (x < 0 ? Math.abs(x) + '̄' : String(x));
      sim.set('hkl', n2 ? `(${bar(h)}${bar(k)}${bar(l)})` : 'índices nulos: elija al menos uno');
      sim.set('d', n2 ? EM.fix(1 / Math.sqrt(n2), 4) + ' a · Cu: ' + EM.fix(3.615 / Math.sqrt(n2), 3) + ' Å' : '—');
      sim.set('np', n2 ? String(nplanes) : '—');
      sim.set('ang', n2 ? EM.fix((Math.acos(Math.abs(h) / Math.sqrt(n2)) * 180) / Math.PI, 2) + '°' : '—');
    });
  });
})();
