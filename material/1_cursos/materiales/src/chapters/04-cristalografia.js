/* Capítulo 4 — Direcciones y planos */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M, V = EM.V;
  const bar = (n) => (n < 0 ? '̅'.length && ('-' + Math.abs(n)) : String(n));
  /* Índices con barra (combining overline) */
  const idx = (arr) => arr.map((n) => (n < 0 ? Math.abs(n) + '̅' : String(n))).join('');
  EM.millerStr = idx;
  void bar;

  /* Polígono de intersección de un plano n·x = d con el cubo [0,1]^3 */
  function cubeSection(n, d) {
    const C = [];
    for (let i = 0; i < 8; i++) C.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
    const E = [];
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const dd = V.sub(C[i], C[j]); if (Math.abs(dd[0]) + Math.abs(dd[1]) + Math.abs(dd[2]) === 1) E.push([C[i], C[j]]); }
    const pts = [];
    for (const [A, B] of E) {
      const fa = V.dot(n, A) - d, fb = V.dot(n, B) - d;
      if (Math.abs(fa) < 1e-12) pts.push(A);
      if (fa * fb < 0) { const t = fa / (fa - fb); pts.push(V.lerp(A, B, t)); }
    }
    /* quitar duplicados */
    const uniq = [];
    for (const p of pts) if (!uniq.some((q) => V.norm(V.sub(p, q)) < 1e-9)) uniq.push(p);
    if (uniq.length < 3) return uniq;
    const c = uniq.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((x) => x / uniq.length);
    const u = V.unit(V.sub(uniq[0], c)), w = V.unit(V.cross(n, u));
    return uniq.sort((p, q) => Math.atan2(V.dot(V.sub(p, c), w), V.dot(V.sub(p, c), u)) - Math.atan2(V.dot(V.sub(q, c), w), V.dot(V.sub(q, c), u)));
  }
  EM.cubeSection = cubeSection;

  /* ======================================================================
     4.1 Plano (hkl) y dirección [uvw]
     ====================================================================== */
  EM.defineSim('miller-plane', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.group('Plano (hkl)');
    for (const k of ['h', 'k', 'l']) sim.slider(k, { label: '<i>' + k + '</i>', min: -3, max: 3, step: 1, value: k === 'l' ? 1 : 1, fmt: (v) => v.toFixed(0) });
    sim.group('Dirección [uvw]');
    sim.slider('u', { label: '<i>u</i>', min: -2, max: 2, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('v', { label: '<i>v</i>', min: -2, max: 2, step: 1, value: -1, fmt: (v) => v.toFixed(0) });
    sim.slider('w', { label: '<i>w</i>', min: -2, max: 2, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.check('nrm', { label: 'Mostrar la normal [hkl]', value: true });
    sim.out('pl', 'Plano', { hl: true });
    sim.out('ic', 'Intersecciones (unidades de <i>a</i>)');
    sim.out('d', '<i>d<sub>hkl</sub></i>/<i>a</i> = 1/√(<i>h</i>²+<i>k</i>²+<i>l</i>²)');
    sim.out('zone', 'Regla de la zona <i>hu</i> + <i>kv</i> + <i>lw</i>');
    sim.out('ang', 'Ángulo entre [uvw] y [hkl]');
    const v = new EM.View3D(sim, cv, { radius: 1.35, az: M.rad(30), el: M.rad(20) });
    sim.onDraw(() => {
      const p = sim.p;
      const n = [p.h, p.k, p.l];
      const T = (q) => [q[0] - 0.5, q[1] - 0.5, q[2] - 0.5];
      v.begin();
      /* cubo */
      const Cs = [];
      for (let i = 0; i < 8; i++) Cs.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const dd = V.sub(Cs[i], Cs[j]); if (Math.abs(dd[0]) + Math.abs(dd[1]) + Math.abs(dd[2]) === 1) v.line(T(Cs[i]), T(Cs[j]), { color: '--ink-3', width: 1.2 }); }
      /* ejes */
      v.arrow(T([0, 0, 0]), T([1.3, 0, 0]), { color: '--ink-3', width: 1 }); v.text(T([1.4, 0, 0]), 'x', { italic: true, color: '--ink-2' });
      v.arrow(T([0, 0, 0]), T([0, 1.3, 0]), { color: '--ink-3', width: 1 }); v.text(T([0, 1.4, 0]), 'y', { italic: true, color: '--ink-2' });
      v.arrow(T([0, 0, 0]), T([0, 0, 1.3]), { color: '--ink-3', width: 1 }); v.text(T([0, 0, 1.4]), 'z', { italic: true, color: '--ink-2' });
      let planeTxt = '—', icTxt = '—', dTxt = '—';
      if (n.some((x) => x !== 0)) {
        /* origen desplazado para índices negativos */
        const o = n.map((x) => (x < 0 ? 1 : 0));
        const d = 1 + V.dot(n, o);
        const poly = cubeSection(n, d);
        if (poly.length >= 3) v.poly(poly.map(T), { fill: '--accent', alpha: 0.42, stroke: '--accent', strokeAlpha: 1, strokeWidth: 1.6, shade: false });
        /* planos paralelos de la familia dentro del cubo */
        const g = n.reduce((a, b) => MAT.gcd(a, b), 0);
        for (let m = -6; m <= 6; m++) {
          if (m === 0) continue;
          const dm = d + m / 1;
          const pp = cubeSection(n, dm);
          if (pp.length >= 3) v.poly(pp.map(T), { fill: '--accent', alpha: 0.1, stroke: '--accent', strokeAlpha: 0.4, shade: false });
        }
        v.point(T(o), { r: 5, color: '--ink' }); v.text(T(o), 'O′', { dx: -10, dy: 10, size: 12 });
        if (p.nrm) {
          const nu = V.scale(V.unit(n), 0.55);
          const c = poly.length ? poly.reduce((s, q) => V.add(s, q), [0, 0, 0]).map((x) => x / poly.length) : [0.5, 0.5, 0.5];
          v.arrow(T(c), T(V.add(c, nu)), { color: '--c1', width: 2.2 });
          v.text(T(V.add(c, V.scale(nu, 1.15))), '[' + idx(n) + ']', { color: '--c1', size: 12 });
        }
        planeTxt = '(' + idx(n) + ')' + (g > 1 ? ' — paralelo a (' + idx(n.map((x) => x / g)) + ')' : '');
        icTxt = n.map((x, i) => (x === 0 ? '∞' : EM.fix(1 / x, 3)) + ' desde ' + ['x', 'y', 'z'][i] + '₀=' + o[i]).join(', ');
        dTxt = EM.fix(1 / Math.hypot(...n), 4);
      }
      const u = [p.u, p.v, p.w];
      if (u.some((x) => x !== 0)) {
        const s = 1 / Math.max(...u.map(Math.abs));
        const o2 = u.map((x) => (x < 0 ? 1 : 0));
        v.arrow(T(o2), T(V.add(o2, V.scale(u, s))), { color: '--c3', width: 2.6 });
        v.text(T(V.add(o2, V.scale(u, s * 1.08))), '[' + idx(u) + ']', { color: '--c3', size: 12 });
      }
      v.render();
      const z = V.dot(n, u);
      sim.set('pl', planeTxt);
      sim.set('ic', icTxt);
      sim.set('d', dTxt);
      sim.set('zone', z + (z === 0 ? ' → la dirección está en el plano' : ' → no está en el plano'));
      sim.set('ang', n.some((x) => x) && u.some((x) => x) ? EM.fix(M.deg(MAT.angleDir(n, u)), 2) + '°' : '—');
    });
  });

  /* ======================================================================
     4.2 De intersecciones a índices
     ====================================================================== */
  EM.defineSim('miller-intercepts', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const opts = [['0.25', '¼'], ['0.3333333333', '⅓'], ['0.5', '½'], ['0.6666666667', '⅔'], ['1', '1'], ['2', '2'], ['-1', '−1'], ['-0.5', '−½'], ['inf', '∞']];
    sim.select('x', { label: 'Intersección con <i>x</i>', options: opts, value: '0.5' });
    sim.select('y', { label: 'Intersección con <i>y</i>', options: opts, value: '1' });
    sim.select('z', { label: 'Intersección con <i>z</i>', options: opts, value: 'inf' });
    sim.out('r', 'Recíprocos');
    sim.out('m', 'Índices de Miller', { hl: true });
    const v = new EM.View3D(sim, cv, { radius: 1.6, az: M.rad(30), el: M.rad(22) });
    sim.onDraw(() => {
      const p = sim.p;
      const val = (s) => (s === 'inf' ? Infinity : +s);
      const ic = [val(p.x), val(p.y), val(p.z)];
      const mi = MAT.miller(...ic);
      const T = (q) => [q[0] - 0.5, q[1] - 0.5, q[2] - 0.5];
      v.begin();
      const Cs = [];
      for (let i = 0; i < 8; i++) Cs.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const dd = V.sub(Cs[i], Cs[j]); if (Math.abs(dd[0]) + Math.abs(dd[1]) + Math.abs(dd[2]) === 1) v.line(T(Cs[i]), T(Cs[j]), { color: '--ink-3', width: 1 }); }
      for (let a = 0; a < 3; a++) {
        const e = [0, 0, 0]; e[a] = 1.5; const e2 = [0, 0, 0]; e2[a] = -0.6;
        v.line(T(e2), T(e), { color: '--ink-3', width: 0.8, dash: [3, 3] });
        v.text(T(V.scale(e, 1.08)), 'xyz'[a], { italic: true, color: '--ink-2' });
        if (isFinite(ic[a])) { const q = [0, 0, 0]; q[a] = ic[a]; v.point(T(q), { r: 5, color: '--c2' }); }
      }
      /* plano x/ix + y/iy + z/iz = 1 dentro de un cubo ampliado */
      const n = ic.map((c) => (isFinite(c) ? 1 / c : 0));
      const big = [];
      /* sección en la caja [-0.6,1.6]^3 */
      const lo = -0.6, hi = 1.6;
      const box = (q) => q.map((x) => lo + (hi - lo) * x);
      const nn = n.map((x) => x * (hi - lo));
      const dd = 1 - V.dot(n, [lo, lo, lo]);
      for (const q of cubeSection(nn, dd)) big.push(box(q));
      if (big.length >= 3) v.poly(big.map(T), { fill: '--accent', alpha: 0.22, stroke: '--accent', strokeAlpha: 0.9, shade: false });
      v.render();
      sim.set('r', ic.map((c) => (isFinite(c) ? EM.fix(1 / c, 3) : '0')).join(', '));
      sim.set('m', '(' + idx(mi) + ')');
    });
  });

  /* ======================================================================
     4.3 Densidad planar
     ====================================================================== */
  EM.defineSim('planar-density', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.seg('st', { label: 'Estructura', options: [['fcc', 'FCC'], ['bcc', 'BCC']], value: 'fcc' });
    sim.seg('pl', { label: 'Plano', options: [['100', '(100)'], ['110', '(110)'], ['111', '(111)']], value: '111' });
    sim.slider('R', { label: 'Radio atómico <i>R</i>', min: 0.1, max: 0.2, step: 0.0005, value: 0.128, unit: 'nm', fmt: (v) => EM.fix(v, 4) });
    sim.out('cnt', 'Átomos en la región');
    sim.out('A', 'Área de la región');
    sim.out('pd', 'Densidad planar', { hl: true });
    sim.out('fr', 'Fracción del plano cubierta');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Rr = 1;
      const a = MAT.cells[p.st].aR(Rr);
      /* geometría del plano: vectores en el plano (en unidades de a) y posiciones de átomos con su radio de sección */
      let e1, e2, L1, L2;
      if (p.pl === '100') { e1 = [1, 0, 0]; e2 = [0, 1, 0]; L1 = 1; L2 = 1; }
      else if (p.pl === '110') { e1 = [0, 0, 1]; e2 = V.unit([1, -1, 0]); L1 = 1; L2 = Math.SQRT2; }
      else { e1 = V.unit([1, -1, 0]); e2 = V.unit([1, 1, -2]); L1 = Math.SQRT2; L2 = Math.sqrt(1.5); }
      const nrm = V.unit(V.cross(e1, e2));
      /* átomos de la red cercanos al plano que pasa por el origen */
      const atoms = [];
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (let k = -3; k <= 3; k++) for (const [b] of MAT.cells[p.st].basis) {
        const q = [i + b[0], j + b[1], k + b[2]];
        const dist = V.dot(q, nrm) * a;
        if (Math.abs(dist) < Rr * 0.999) atoms.push({ x: V.dot(q, e1) * a, y: V.dot(q, e2) * a, r: Math.sqrt(Rr * Rr - dist * dist), on: Math.abs(dist) < 1e-9 });
      }
      const span = 3.6 * a;
      const sc = Math.min(W, H * 1.6) / span;
      const cx = W * 0.5, cy = H * 0.5;
      ctx.save(); ctx.beginPath(); ctx.rect(4, 4, W - 8, H - 26); ctx.clip();
      for (const at of atoms) {
        const x = cx + (at.x - (L1 * a) / 2) * sc, y = cy - (at.y - (L2 * a) / 2) * sc;
        ctx.globalAlpha = at.on ? 1 : 0.35;
        EM.draw.bob(ctx, x, y, at.r * sc, { color: at.on ? '--c1' : '--c6' });
      }
      ctx.globalAlpha = 1;
      /* región de referencia */
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.2;
      if (p.pl === '111') {
        const s1 = Math.SQRT2 * a; // triángulo de lado a√2
        ctx.beginPath();
        const P0 = [cx - (L1 * a) / 2 * sc, cy + (L2 * a) / 2 * sc];
        ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P0[0] + s1 * sc, P0[1]); ctx.lineTo(P0[0] + (s1 / 2) * sc, P0[1] - s1 * (Math.sqrt(3) / 2) * sc); ctx.closePath(); ctx.stroke();
      } else ctx.strokeRect(cx - (L1 * a) / 2 * sc, cy - (L2 * a) / 2 * sc, L1 * a * sc, L2 * a * sc);
      ctx.restore();
      EM.text(ctx, 'azul: centros sobre el plano · gris: átomos que solo lo cortan · rojo: región contada', 14, H - 7, { size: 11, color: '--ink-3' });
      const fmls = MAT.planarDensity[p.st][p.pl];
      const pdR = fmls(Rr); // en 1/R²
      const counts = { fcc: { 100: 2, 110: 2, 111: 2 }, bcc: { 100: 1, 110: 2, 111: 0.5 } }[p.st][p.pl];
      const area = counts / pdR;
      sim.set('cnt', counts + ' átomo' + (counts === 1 ? '' : 's'));
      sim.set('A', EM.fix(area, 3) + ' <i>R</i>²');
      sim.set('pd', EM.fix(pdR, 4) + ' /<i>R</i>² = ' + EM.fix(pdR / (p.R * p.R), 2) + ' átomos/nm²');
      sim.set('fr', EM.fix(pdR * Math.PI, 3));
    });
  });

  /* ======================================================================
     4.4 Índices hexagonales
     ====================================================================== */
  EM.defineSim('hex-indices', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('U', { label: '<i>U</i>', min: -2, max: 2, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('V', { label: '<i>V</i>', min: -2, max: 2, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.check('fam', { label: 'Mostrar la familia ⟨2 1̅ 1̅ 0⟩', value: false });
    sim.out('three', 'Tres índices [<i>UVW</i>]');
    sim.out('four', 'Cuatro índices [<i>uvtw</i>]', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = W * 0.5, cy = H * 0.52, s = Math.min(W, H) * 0.2;
      const a1 = [1, 0], a2 = [-0.5, Math.sqrt(3) / 2], a3 = [-0.5, -Math.sqrt(3) / 2];
      const P = (x, y) => [cx + x * s, cy - y * s];
      /* red basal */
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const x = i * a1[0] + j * a2[0], y = i * a1[1] + j * a2[1];
        if (Math.hypot(x, y) < 2.3) { const q = P(x, y); EM.draw.bob(ctx, q[0], q[1], s * 0.16, { color: EM.mix(EM.col('--c1'), EM.col('--canvas'), 0.35) }); }
      }
      const ax = [[a1, 'a₁', '--c2'], [a2, 'a₂', '--c3'], [a3, 'a₃', '--c5']];
      for (const [vv, t, c] of ax) { const q = P(vv[0] * 1.9, vv[1] * 1.9); EM.draw.arrow(ctx, cx, cy, q[0], q[1], { color: c, width: 1.6 }); EM.text(ctx, t, q[0] + 6, q[1] - 4, { size: 13, color: c, weight: 700 }); }
      const conv = (U, Vv) => {
        let u = (2 * U - Vv) / 3, v = (2 * Vv - U) / 3, t = -(u + v);
        const arr = [u, v, t, 0].map((x) => x * 3);
        const g = arr.map((x) => Math.round(x)).reduce((a, b) => MAT.gcd(a, b), 0) || 1;
        return arr.map((x) => Math.round(x) / g);
      };
      const drawDir = (U, Vv, col, w) => {
        const x = U * a1[0] + Vv * a2[0], y = U * a1[1] + Vv * a2[1];
        const L = Math.hypot(x, y) || 1, k = 1.7 / L;
        const q = P(x * k, y * k);
        EM.draw.arrow(ctx, cx, cy, q[0], q[1], { color: col, width: w });
        return q;
      };
      if (p.fam) {
        for (const [U, Vv] of [[1, 0], [0, 1], [-1, -1], [-1, 0], [0, -1], [1, 1]]) {
          const q = drawDir(U, Vv, '--ink-3', 1.4);
          EM.text(ctx, '[' + idx(conv(U, Vv)) + ']', q[0], q[1] + (q[1] > cy ? 16 : -8), { size: 11.5, align: 'center', color: '--ink-2', halo: true });
        }
      }
      if (p.U || p.V) {
        const q = drawDir(p.U, p.V, '--accent', 3);
        EM.text(ctx, '[' + idx(conv(p.U, p.V)) + ']', q[0] + 8, q[1] - 8, { size: 13, color: '--accent', weight: 700, halo: true });
      }
      sim.set('three', '[' + idx([p.U, p.V, 0]) + ']');
      sim.set('four', p.U || p.V ? '[' + idx(conv(p.U, p.V)) + ']' : '—');
    });
  });
})();
