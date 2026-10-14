/* Capítulo 3 — Estructuras cristalinas */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     3.1 Sistemas cristalinos
     ====================================================================== */
  const SYS = {
    cub: ['Cúbico', 1, 1, 1, 90, 90, 90], hex: ['Hexagonal', 1, 1, 1.6, 90, 90, 120], tet: ['Tetragonal', 1, 1, 1.5, 90, 90, 90],
    rho: ['Romboédrico', 1, 1, 1, 75, 75, 75], ort: ['Ortorrómbico', 0.8, 1.1, 1.4, 90, 90, 90], mon: ['Monoclínico', 0.8, 1.1, 1.3, 90, 110, 90], tri: ['Triclínico', 0.8, 1.1, 1.3, 80, 105, 70]
  };
  EM.defineSim('crystal-systems', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.select('s', { label: 'Sistema', options: Object.entries(SYS).map(([k, v]) => [k, v[0]]), value: 'mon' });
    sim.slider('beta', { label: 'Ángulo libre (cuando el sistema lo permite)', min: 60, max: 130, step: 1, value: 110, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('ax', 'Aristas', { hl: true });
    sim.out('an', 'Ángulos');
    const v = new EM.View3D(sim, cv, { radius: 1.35, az: M.rad(-55), el: M.rad(18) });
    sim.onChange = (id) => { if (id === 's') { const S = SYS[sim.p.s]; sim.ctl.beta.set(S[0] === 'Triclínico' || S[0] === 'Monoclínico' ? S[5] : S[0] === 'Romboédrico' ? S[4] : 90, true); } };
    sim.onDraw(() => {
      const p = sim.p, S = SYS[p.s];
      let [, a, b, c, al, be, ga] = S;
      if (S[0] === 'Monoclínico') be = p.beta;
      if (S[0] === 'Triclínico') be = p.beta;
      if (S[0] === 'Romboédrico') al = be = ga = p.beta;
      const A = M.rad(al), B = M.rad(be), G = M.rad(ga);
      /* vectores de la celda */
      const va = [a, 0, 0], vb = [b * Math.cos(G), b * Math.sin(G), 0];
      const cx = c * Math.cos(B), cy = (c * (Math.cos(A) - Math.cos(B) * Math.cos(G))) / Math.sin(G);
      const vc = [cx, cy, Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy))];
      const ctr = EM.V.scale(EM.V.add(EM.V.add(va, vb), vc), 0.5);
      const P = (i, j, k) => EM.V.sub(EM.V.add(EM.V.add(EM.V.scale(va, i), EM.V.scale(vb, j)), EM.V.scale(vc, k)), ctr);
      v.begin();
      for (const [i, j, k, di, dj, dk] of [[0, 0, 0, 1, 0, 0], [0, 1, 0, 1, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 1, 0], [1, 0, 0, 0, 1, 0], [0, 0, 1, 0, 1, 0], [1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 1], [0, 1, 0, 0, 0, 1], [1, 1, 0, 0, 0, 1]])
        v.line(P(i, j, k), P(i + di, j + dj, k + dk), { color: '--ink-2', width: 1.4 });
      for (let i = 0; i <= 1; i++) for (let j = 0; j <= 1; j++) for (let k = 0; k <= 1; k++) v.point(P(i, j, k), { r: 6, color: '--c1', glow: true, ring: false });
      v.arrow(P(0, 0, 0), P(1.25, 0, 0), { color: '--c2', width: 2 }); v.text(P(1.35, 0, 0), 'a', { color: '--c2', italic: true, size: 15 });
      v.arrow(P(0, 0, 0), P(0, 1.25, 0), { color: '--c3', width: 2 }); v.text(P(0, 1.35, 0), 'b', { color: '--c3', italic: true, size: 15 });
      v.arrow(P(0, 0, 0), P(0, 0, 1.25), { color: '--c5', width: 2 }); v.text(P(0, 0, 1.35), 'c', { color: '--c5', italic: true, size: 15 });
      v.render();
      const eqs = (x, y) => (Math.abs(x - y) < 1e-9 ? '=' : '≠');
      sim.set('ax', `a ${eqs(a, b)} b ${eqs(b, c)} c`);
      sim.set('an', `α = ${al.toFixed(0)}°, β = ${be.toFixed(0)}°, γ = ${ga.toFixed(0)}°`);
    });
  });

  /* ======================================================================
     3.2 Celda unitaria 3D
     ====================================================================== */
  EM.defineSim('unit-cell-3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.select('t', { label: 'Estructura', options: [['sc', 'Cúbica simple'], ['bcc', 'BCC'], ['fcc', 'FCC'], ['hcp', 'HCP'], ['diamond', 'Diamante'], ['nacl', 'Sal gema NaCl'], ['cscl', 'Cloruro de cesio CsCl'], ['zns', 'Blenda de zinc ZnS'], ['caf2', 'Fluorita CaF₂'], ['perov', 'Perovskita CaTiO₃']], value: 'fcc' });
    sim.seg('sz', { label: 'Esferas', options: [['red', 'Reducidas'], ['hard', 'Duras (en contacto)']], value: 'red' });
    sim.slider('N', { label: 'Celdas por arista', min: 1, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.check('nb', { label: 'Resaltar los vecinos de un átomo', value: false });
    sim.out('n', 'Átomos (o iones) por celda', { hl: true });
    sim.out('cn', 'Número de coordinación');
    sim.out('aR', 'Relación arista–radio');
    sim.out('apf', 'Factor de empaquetamiento');
    const v = new EM.View3D(sim, cv, { radius: 2.4, az: M.rad(28), el: M.rad(18) });
    const hardR = { sc: 0.5, bcc: Math.sqrt(3) / 4, fcc: Math.SQRT2 / 4, diamond: Math.sqrt(3) / 8 };
    sim.onDraw(() => {
      const p = sim.p;
      v.begin();
      if (p.t === 'hcp') {
        EM.renderCell(v, 'hcp', { rScale: p.sz === 'hard' ? 0.5 : 0.22, size: 1.5 / p.N });
        v.render();
        sim.set('n', '12×⅙ + 2×½ + 3 = <b>6</b>');
        sim.set('cn', '12');
        sim.set('aR', '<i>a</i> = 2<i>R</i>, <i>c</i>/<i>a</i> = 1.633 (ideal)');
        sim.set('apf', EM.fix(MAT.apfHCP(), 4));
        return;
      }
      const C = MAT.cells[p.t];
      const sp = { nacl: [1.0, 0.56], cscl: [1.0, 0.94], zns: [1.0, 0.4], caf2: [0.75, 1.0], perov: [1.1, 0.5, 1.0] }[p.t] || [1, 1, 1];
      const scale = { nacl: 0.25, cscl: 0.3, zns: 0.22, caf2: 0.2, perov: 0.22 }[p.t];
      const rs = p.sz === 'hard' && hardR[p.t] ? hardR[p.t] : scale || 0.14;
      EM.renderCell(v, p.t, { N: p.N, rScale: rs, species: sp, size: 2 / p.N });
      if (p.nb) {
        /* vecinos del átomo en el centro de una cara (FCC) o del centro (BCC) */
        const s = 2 / p.N, ctr = [p.N / 2, p.N / 2, p.N / 2];
        const T = (q) => [(q[0] - ctr[0]) * s, (q[1] - ctr[1]) * s, (q[2] - ctr[2]) * s];
        const all = [];
        for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) for (let k = -1; k <= 2; k++) for (const [b, sp_] of C.basis) all.push({ p: [i + b[0], j + b[1], k + b[2]], s: sp_ });
        const c0 = p.t === 'fcc' ? [0.5, 0.5, 1] : p.t === 'nacl' || p.t === 'cscl' || p.t === 'perov' ? [0.5, 0.5, 0.5] : p.t === 'zns' || p.t === 'diamond' ? [0.25, 0.25, 0.25] : p.t === 'caf2' ? [0.25, 0.25, 0.25] : p.t === 'bcc' ? [0.5, 0.5, 0.5] : [1, 1, 1];
        const sp0 = all.find((q) => EM.V.norm(EM.V.sub(q.p, c0)) < 1e-6);
        let dmin = 9;
        for (const q of all) { const d = EM.V.norm(EM.V.sub(q.p, c0)); if (d > 1e-6 && (!sp0 || q.s !== sp0.s || ['sc', 'bcc', 'fcc'].includes(p.t))) dmin = Math.min(dmin, d); }
        for (const q of all) {
          const d = EM.V.norm(EM.V.sub(q.p, c0));
          if (Math.abs(d - dmin) < 1e-6 && (!sp0 || q.s !== sp0.s || ['sc', 'bcc', 'fcc', 'diamond'].includes(p.t))) {
            v.line(T(c0), T(q.p), { color: '--accent', width: 2 });
            v.point(T(q.p), { r: 5, color: '--accent', ring: false });
          }
        }
        v.point(T(c0), { r: 8, color: '--accent', glow: true, ring: false });
      }
      v.render();
      const cnt = { sc: '8×⅛ = <b>1</b>', bcc: '8×⅛ + 1 = <b>2</b>', fcc: '8×⅛ + 6×½ = <b>4</b>', diamond: '8×⅛ + 6×½ + 4 = <b>8</b>', nacl: '4 Na⁺ + 4 Cl⁻ (<b>4</b> unidades NaCl)', cscl: '1 Cs⁺ + 1 Cl⁻', zns: '4 Zn²⁺ + 4 S²⁻', caf2: '4 Ca²⁺ + 8 F⁻', perov: '1 Ca²⁺ + 1 Ti⁴⁺ + 3 O²⁻' };
      sim.set('n', cnt[p.t]);
      sim.set('cn', { sc: '6', bcc: '8', fcc: '12', diamond: '4', nacl: '6 : 6', cscl: '8 : 8', zns: '4 : 4', caf2: '8 (Ca) : 4 (F)', perov: '12 (Ca), 6 (Ti)' }[p.t]);
      sim.set('aR', { sc: '<i>a</i> = 2<i>R</i>', bcc: '<i>a</i> = 4<i>R</i>/√3', fcc: '<i>a</i> = 2√2 <i>R</i>', diamond: '<i>a</i> = 8<i>R</i>/√3', nacl: '<i>a</i> = 2(<i>r</i><sub>C</sub> + <i>r</i><sub>A</sub>)', cscl: '<i>a</i>√3 = 2(<i>r</i><sub>C</sub> + <i>r</i><sub>A</sub>)', zns: '<i>a</i>√3/4 = <i>r</i><sub>C</sub> + <i>r</i><sub>A</sub>', caf2: '<i>a</i>√3/4 = <i>r</i><sub>C</sub> + <i>r</i><sub>A</sub>', perov: '<i>a</i> = 2(<i>r</i><sub>Ti</sub> + <i>r</i><sub>O</sub>)' }[p.t]);
      sim.set('apf', C.aR ? EM.fix(MAT.apf(p.t), 4) : '— (depende de los radios iónicos)');
    });
  });

  /* ======================================================================
     3.3 Densidad teórica
     ====================================================================== */
  EM.defineSim('density-calc', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.select('el', { label: 'Metal', options: Object.keys(MAT.elements).map((k) => [k, k + ' (' + MAT.elements[k][0].toUpperCase() + ')']), value: 'Cu' });
    sim.seg('st', { label: 'Estructura usada en el cálculo', options: [['auto', 'La real'], ['fcc', 'FCC'], ['bcc', 'BCC']], value: 'auto' });
    sim.out('a', 'Parámetro de red <i>a</i>');
    sim.out('V', 'Volumen de la celda <i>V<sub>C</sub></i>');
    sim.out('rho', 'Densidad calculada', { hl: true });
    sim.out('rm', 'Densidad medida');
    sim.out('err', 'Diferencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      const [st0, Rn, A, rm, ca] = MAT.elements[p.el];
      const st = p.st === 'auto' ? st0 : p.st;
      let a, V, n;
      if (st === 'hcp') { a = 2 * Rn; n = 6; V = ((3 * Math.sqrt(3)) / 2) * a * a * ca * a; }
      else { a = MAT.cells[st].aR(Rn); n = MAT.cells[st].n; V = a * a * a; }
      const rho = MAT.density(n, A, V * 1e-27) / 1000;
      EM.draw.clear(cv);
      /* barras de todos los metales: calculado vs medido */
      const keys = Object.keys(MAT.elements);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: keys.length, ymin: 0, ymax: 23, ylabel: 'densidad (g/cm³)', xticks: [], ml: 50, mb: 30 });
      pl.frame();
      keys.forEach((k, i) => {
        const d = MAT.elementDensity(k), m = MAT.elements[k][3];
        ctx.fillStyle = EM.alpha(k === p.el ? '--accent' : '--c1', k === p.el ? 0.9 : 0.45);
        ctx.fillRect(pl.X(i + 0.15), pl.Y(d), pl.X(i + 0.48) - pl.X(i + 0.15), pl.Y(0) - pl.Y(d));
        ctx.fillStyle = EM.alpha('--ink-2', k === p.el ? 0.85 : 0.35);
        ctx.fillRect(pl.X(i + 0.52), pl.Y(m), pl.X(i + 0.85) - pl.X(i + 0.52), pl.Y(0) - pl.Y(m));
        EM.text(ctx, k.replace('Fe-α', 'Fe'), pl.X(i + 0.5), pl.Y(0) + 14, { size: 10.5, align: 'center', color: k === p.el ? '--accent' : '--ink-3' });
      });
      pl.legend([{ label: 'calculada (estructura real)', color: '--c1', kind: 'sq' }, { label: 'medida', color: '--ink-2', kind: 'sq' }], 'tl');
      sim.set('a', EM.fix(a, 4) + ' nm' + (st === 'hcp' ? ', <i>c</i> = ' + EM.fix(ca * a, 4) + ' nm' : ''));
      sim.set('V', EM.fix(V, 5) + ' nm³ (' + n + ' átomos)');
      sim.set('rho', EM.fix(rho, 3) + ' g/cm³');
      sim.set('rm', rm + ' g/cm³');
      sim.set('err', (rho > rm ? '+' : '') + EM.fix((100 * (rho - rm)) / rm, 1) + ' %' + (p.st !== 'auto' && st !== st0 ? ' (estructura equivocada)' : ''));
    });
  });

  /* ======================================================================
     3.4 Apilamiento de planos compactos
     ====================================================================== */
  EM.defineSim('stacking', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('seq', { label: 'Secuencia', options: [['ABABAB', 'ABAB… (HCP)'], ['ABCABC', 'ABCABC… (FCC)'], ['ABCABABC', 'ABCAB|ABC (falla de apilamiento)'], ['ABCBA', 'ABC|BA (macla)']], value: 'ABCABC' });
    sim.slider('nl', { label: 'Capas mostradas', min: 1, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('s', 'Secuencia apilada', { hl: true });
    sim.out('c', 'Comentario');
    const col = { A: '--c1', B: '--c2', C: '--c3' };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const seq = p.seq.slice(0, p.nl);
      /* vista superior (izquierda) */
      const r = Math.min(W, H) * 0.045, cx0 = W * 0.27, cy0 = H * 0.5;
      const off = { A: [0, 0], B: [r, r / Math.sqrt(3)], C: [2 * r, (2 * r) / Math.sqrt(3)] };
      ctx.save(); ctx.beginPath(); ctx.rect(10, 10, W * 0.52, H - 20); ctx.clip();
      for (let li = 0; li < seq.length; li++) {
        const L = seq[li], [ox, oy] = off[L];
        for (let i = -6; i <= 6; i++) for (let j = -5; j <= 5; j++) {
          const x = cx0 + ox + 2 * r * i + r * j, y = cy0 + oy + Math.sqrt(3) * r * j;
          EM.draw.bob(ctx, x, y, r * (li === 0 ? 0.98 : li === 1 ? 0.62 : 0.34), { color: col[L] });
        }
      }
      ctx.restore();
      EM.text(ctx, 'vista superior: 1.ª capa grande, 2.ª mediana, 3.ª y siguientes pequeñas', 16, H - 4, { size: 11, color: '--ink-3', halo: true });
      /* vista lateral esquemática (derecha) */
      const x0 = W * 0.6, w = W * 0.36, dy = (H - 40) / 9;
      for (let li = 0; li < seq.length; li++) {
        const L = seq[li], y = H - 30 - li * dy;
        const shift = { A: 0, B: 1, C: 2 }[L];
        for (let k = 0; k < 6; k++) EM.draw.bob(ctx, x0 + ((k * 3 + shift) * w) / 18 + 8, y, dy * 0.42, { color: col[L] });
        EM.text(ctx, L, x0 - 14, y + 4, { size: 13, weight: 700, color: col[L], align: 'center' });
      }
      EM.text(ctx, 'corte lateral (posiciones A, B, C)', x0, 18, { size: 11, color: '--ink-3' });
      sim.set('s', seq.split('').join(' '));
      sim.set('c', { ABABAB: 'HCP: la tercera capa repite la primera; los huecos C quedan abiertos a lo largo del eje c.', ABCABC: 'FCC: los planos compactos son los {111}; se necesitan tres capas para repetir.', ABCABABC: 'Falla de apilamiento intrínseca: dos capas con secuencia HCP dentro de un cristal FCC.', ABCBA: 'Macla: la secuencia se refleja como en un espejo respecto al plano C.' }[p.seq]);
    });
  });

  /* ======================================================================
     3.5 Cociente de radios
     ====================================================================== */
  EM.defineSim('radius-ratio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const cats = Object.keys(MAT.ionR).filter((k) => k.includes('⁺')), ans = Object.keys(MAT.ionR).filter((k) => k.includes('⁻'));
    sim.select('c', { label: 'Catión', options: cats.map((k) => [k, k + ' (' + MAT.ionR[k] + ' nm)']), value: 'Na⁺' });
    sim.select('a', { label: 'Anión', options: ans.map((k) => [k, k + ' (' + MAT.ionR[k] + ' nm)']), value: 'Cl⁻' });
    sim.seg('cn', { label: 'Coordinación dibujada', options: [['auto', 'La predicha'], ['4', '4'], ['6', '6'], ['8', '8']], value: 'auto' });
    sim.out('q', 'Cociente <i>r</i><sub>C</sub>/<i>r</i><sub>A</sub>', { hl: true });
    sim.out('cnp', 'Coordinación predicha');
    sim.out('st', 'Estado de la configuración dibujada');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const rc = MAT.ionR[p.c], ra = MAT.ionR[p.a], q = rc / ra;
      const cnP = MAT.cnFromRatio(q);
      const cn = p.cn === 'auto' ? Math.min(8, Math.max(4, cnP)) : +p.cn;
      /* corte 2D: plano que contiene al catión y 4 aniones (6, 8) o 2 (4) */
      const sc = Math.min(W * 0.5, H) / (4.6 * ra + 2 * rc);
      const cx = W * 0.3, cy = H * 0.5;
      const lim = { 4: MAT.ratioLimits[4], 6: MAT.ratioLimits[6], 8: MAT.ratioLimits[8] }[cn];
      /* distancia catión-anión: contacto si q ≥ límite; si no, los aniones se tocan entre sí */
      const touch = q >= lim;
      const dCA = touch ? rc + ra : ra * (1 + lim);
      let pos;
      if (cn === 6) pos = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([x, y]) => [x * dCA, y * dCA]);
      else if (cn === 8) { const h = dCA / Math.sqrt(3); pos = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => [x * h * Math.SQRT2, y * h]); }
      else { const h = dCA * Math.sqrt(2 / 3); pos = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => [x * h, y * h * 0.71]); }
      for (const [x, y] of pos) EM.draw.bob(ctx, cx + x * sc, cy + y * sc, ra * sc, { color: EM.alpha('--c3', 0.75), label: p.a });
      EM.draw.bob(ctx, cx, cy, rc * sc, { color: '--c1', label: p.c });
      EM.text(ctx, 'corte por un plano de coordinación ' + cn, cx, H - 10, { size: 11, align: 'center', color: '--ink-3' });
      /* recta numérica de límites */
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: H * 0.18, w: W * 0.4, h: H * 0.5, xmin: 0, xmax: 1.05, ymin: 0, ymax: 1, xlabel: 'r_C/r_A', ylabel: '', grid: false, ml: 10, yticks: [] });
      pl.frame();
      const bands = [[0, 0.155, '2'], [0.155, 0.225, '3'], [0.225, 0.414, '4'], [0.414, 0.732, '6'], [0.732, 1.05, '8']];
      bands.forEach(([a, b, t], i) => { pl.band(a, b, { color: ['--c6', '--c4', '--c5', '--c2', '--c1'][i], alpha: 0.14 }); pl.label((a + b) / 2, b - a > 0.1 ? 0.8 : 0.55 - 0.18 * i, (b - a > 0.1 ? 'NC ' : '') + t, { align: 'center', size: 11.5 }); });
      pl.vline(q, { color: '--accent', dash: [], width: 2.4, label: EM.fix(q, 3) });
      sim.set('q', EM.fix(q, 3));
      sim.set('cnp', String(cnP) + ({ 4: ' (tetraédrica)', 6: ' (octaédrica)', 8: ' (cúbica)', 3: ' (triangular)', 12: '' }[cnP] || ''));
      sim.set('st', touch ? 'estable: catión y aniones en contacto' : 'inestable: el catión queda suelto y los aniones se repelen entre sí');
    });
  });
})();
