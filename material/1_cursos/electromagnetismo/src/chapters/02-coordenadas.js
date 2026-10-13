/* Capítulo 2 — Sistemas de coordenadas */
(function () {
  'use strict';
  const EM = window.EM, V = EM.V, M = EM.M, CO = EM.coords;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2);
  const fdeg = (v) => EM.fix(v, 0);
  const vec = (v, d = 3) => '(' + v.map((c) => EM.fix(c, d)).join(', ') + ')';
  /* Etiqueta de vector unitario con circunflejo */
  const hatText = (v3, p, letter, color, tall) => v3.text(p, letter, { size: 16, italic: true, weight: 600, family: EM.FONT_MATH, color, hat: true, hatHigh: !!tall });
  const COL = { u1: '--c2', u2: '--c3', u3: '--c1' };

  /* ======================================================================
     2.1 Explorador de coordenadas
     ====================================================================== */
  EM.defineSim('coord-explorer', function (sim) {
    const cv = sim.canvas({ aspect: 1.2 });
    const v3 = new EM.View3D(sim, cv, { radius: 3.5, az: rad(34), el: rad(20) });
    let P = CO.cyl2cart(1.8, rad(50), 1.2);
    let phiMem = rad(50);
    let thMem = rad(60);
    sim.group('Sistema');
    sim.seg('sys', { options: [['cart', 'Cartesianas'], ['cyl', 'Cilíndricas'], ['sph', 'Esféricas']], value: 'cyl', onInput: () => { syncFromP(); vis(); } });
    sim.group('Coordenadas del punto P');
    const S = {};
    S.x = sim.slider('x', { label: '<i>x</i>', min: -3, max: 3, step: 0.05, value: 0, fmt: f2 });
    S.y = sim.slider('y', { label: '<i>y</i>', min: -3, max: 3, step: 0.05, value: 0, fmt: f2 });
    S.z = sim.slider('z', { label: '<i>z</i>', min: -3, max: 3, step: 0.05, value: 0, fmt: f2 });
    S.rho = sim.slider('rho', { label: '<i>ρ</i> (distancia al eje <i>z</i>)', min: 0, max: 3, step: 0.05, value: 0, fmt: f2 });
    S.phic = sim.slider('phic', { label: '<i>φ</i> (azimut)', min: 0, max: 359, step: 1, value: 0, unit: '°', fmt: fdeg });
    S.zc = sim.slider('zc', { label: '<i>z</i>', min: -3, max: 3, step: 0.05, value: 0, fmt: f2 });
    S.r = sim.slider('r', { label: '<i>r</i> (distancia al origen)', min: 0, max: 3.5, step: 0.05, value: 0, fmt: f2 });
    S.th = sim.slider('th', { label: '<i>θ</i> (ángulo polar)', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: fdeg });
    S.phis = sim.slider('phis', { label: '<i>φ</i> (azimut)', min: 0, max: 359, step: 1, value: 0, unit: '°', fmt: fdeg });
    sim.group('Mostrar');
    sim.check('surf', { label: 'Superficies coordenadas por P', value: true });
    sim.check('basis', { label: 'Vectores unitarios en P', value: true });
    sim.check('proj', { label: 'Proyecciones y ángulos', value: true });
    sim.check('cartb', { label: 'Base cartesiana en P (para comparar)', value: false });
    const noteAxis = sim.note('');

    function syncFromP() {
      const [x, y, z] = P;
      const cyl = CO.cart2cyl(x, y, z), sph = CO.cart2sph(x, y, z);
      const phi = cyl[0] > 1e-9 ? cyl[1] : phiMem;
      const th = sph[0] > 1e-9 ? sph[1] : thMem;
      S.x.set(x, true); S.y.set(y, true); S.z.set(z, true);
      S.rho.set(cyl[0], true); S.phic.set(Math.round(deg(phi)) % 360, true); S.zc.set(z, true);
      S.r.set(sph[0], true); S.th.set(Math.round(deg(th)), true); S.phis.set(Math.round(deg(phi)) % 360, true);
    }
    function vis() {
      const s = sim.p.sys;
      ['x', 'y', 'z'].forEach((k) => S[k].show(s === 'cart'));
      ['rho', 'phic', 'zc'].forEach((k) => S[k].show(s === 'cyl'));
      ['r', 'th', 'phis'].forEach((k) => S[k].show(s === 'sph'));
    }
    sim.onChange = (id) => {
      const p = sim.p;
      if (id === 'x' || id === 'y' || id === 'z') { P = [p.x, p.y, p.z]; const c = CO.cart2cyl(...P); if (c[0] > 1e-9) phiMem = c[1]; const s = CO.cart2sph(...P); if (s[0] > 1e-9) thMem = s[1]; syncFromP(); }
      else if (id === 'rho' || id === 'phic' || id === 'zc') { phiMem = rad(p.phic); P = CO.cyl2cart(p.rho, phiMem, p.zc); const s = CO.cart2sph(...P); if (s[0] > 1e-9) thMem = s[1]; syncFromP(); }
      else if (id === 'r' || id === 'th' || id === 'phis') { phiMem = rad(p.phis); thMem = rad(p.th); P = CO.sph2cart(p.r, thMem, phiMem); syncFromP(); }
    };
    syncFromP();
    vis();

    sim.outSep('Cartesianas');
    sim.out('cart', '(<i>x</i>, <i>y</i>, <i>z</i>)');
    sim.outSep('Cilíndricas');
    sim.out('cyl', '(<i>ρ</i>, <i>φ</i>, <i>z</i>)');
    sim.outSep('Esféricas');
    sim.out('sph', '(<i>r</i>, <i>θ</i>, <i>φ</i>)');
    sim.outSep('Base local en cartesianas');
    sim.out('b1', '—');
    sim.out('b2', '—');
    sim.out('b3', '—');
    sim.hint('Arrastra para girar · Ctrl+rueda: zoom', cv);

    sim.onDraw(() => {
      const p = sim.p, sys = p.sys;
      const [x, y, z] = P;
      const cyl = CO.cart2cyl(x, y, z), sph = CO.cart2sph(x, y, z);
      const rho = cyl[0], r = sph[0];
      const phi = rho > 1e-9 ? cyl[1] : phiMem;
      const th = r > 1e-9 ? sph[1] : thMem;
      const L = 3.1;
      v3.begin();
      v3.axes({ len: 3.3, neg: 3.0 });
      const O = [0, 0, 0];
      const cb = CO.cylBasis(phi), sb = CO.sphBasis(th, phi);
      /* ---------- Superficies coordenadas ---------- */
      if (p.surf) {
        const st = (c) => ({ fill: c, alpha: 0.2, seam: true });
        if (sys === 'cart') {
          const E = 3;
          v3.mesh((u, v) => [x, u, v], -E, E, 4, -E, E, 4, Object.assign(st('--surf-a'), { wire: '--surf-a', wireAlpha: 0.35 }));
          v3.mesh((u, v) => [u, y, v], -E, E, 4, -E, E, 4, Object.assign(st('--surf-b'), { wire: '--surf-b', wireAlpha: 0.35 }));
          v3.mesh((u, v) => [u, v, z], -E, E, 4, -E, E, 4, Object.assign(st('--surf-c'), { wire: '--surf-c', wireAlpha: 0.35 }));
        } else if (sys === 'cyl') {
          if (rho > 0.02) v3.mesh((u, v) => [rho * Math.cos(u), rho * Math.sin(u), v], 0, 2 * Math.PI, 40, -L, L, 6, Object.assign(st('--surf-a'), { wire: '--surf-a', wireAlpha: 0.3, wireEveryU: 4 }));
          v3.mesh((u, v) => [u * cb.rho[0], u * cb.rho[1], v], 0, L, 4, -L, L, 6, Object.assign(st('--surf-b'), { wire: '--surf-b', wireAlpha: 0.35 }));
          v3.mesh((u, v) => [u * Math.cos(v), u * Math.sin(v), z], 0, L, 5, 0, 2 * Math.PI, 40, Object.assign(st('--surf-c'), { wire: '--surf-c', wireAlpha: 0.3, wireEveryV: 5 }));
        } else {
          if (r > 0.02) v3.mesh((u, v) => CO.sph2cart(r, u, v), 0, Math.PI, 18, 0, 2 * Math.PI, 36, Object.assign(st('--surf-a'), { alpha: 0.16, wire: '--surf-a', wireAlpha: 0.25, wireEveryU: 3, wireEveryV: 3 }));
          if (Math.abs(th - Math.PI / 2) < 1e-3) v3.mesh((u, v) => [u * Math.cos(v), u * Math.sin(v), 0], 0, L, 5, 0, 2 * Math.PI, 40, Object.assign(st('--surf-b'), { wire: '--surf-b', wireAlpha: 0.3, wireEveryV: 5 }));
          else v3.mesh((u, v) => CO.sph2cart(u, th, v), 0, L, 5, 0, 2 * Math.PI, 40, Object.assign(st('--surf-b'), { wire: '--surf-b', wireAlpha: 0.3, wireEveryV: 5 }));
          v3.mesh((u, v) => CO.sph2cart(u, v, phi), 0, L, 5, 0, Math.PI, 18, Object.assign(st('--surf-c'), { wire: '--surf-c', wireAlpha: 0.3, wireEveryV: 3 }));
        }
      }
      /* ---------- Proyecciones y ángulos ---------- */
      if (p.proj) {
        const Q = [x, y, 0];
        const dsh = { color: '--ink-2', width: 1.2, dash: [4, 3], seg: 4 };
        if (sys === 'cart') {
          v3.line(P, Q, dsh);
          v3.line(Q, [x, 0, 0], dsh);
          v3.line(Q, [0, y, 0], dsh);
          v3.line(P, [0, 0, z], dsh);
          v3.text([x / 2, 0, 0], 'x = ' + f2(x), { size: 11.5, mono: true, color: '--ink-2', dy: 12 });
          v3.text([0, y / 2, 0], 'y = ' + f2(y), { size: 11.5, mono: true, color: '--ink-2', dy: 12 });
          v3.text([0, 0, z / 2], 'z = ' + f2(z), { size: 11.5, mono: true, color: '--ink-2', dx: -34 });
        } else if (sys === 'cyl') {
          v3.line(P, Q, dsh);
          v3.line(O, Q, { color: '--ink', width: 2, seg: 4 });
          v3.text(V.scale(Q, 0.55), 'ρ', { size: 15, italic: true, family: EM.FONT_MATH, color: '--ink', dy: 12 });
          v3.text(V.lerp(P, Q, 0.5), 'z', { size: 15, italic: true, family: EM.FONT_MATH, color: '--ink', dx: 12 });
          v3.line([0, 0, z], P, { color: '--ink-3', width: 1, dash: [2, 3], seg: 3 });
          if (phi > 0.01) {
            v3.arc(O, [1, 0, 0], [0, 1, 0], 0.62, 0, phi, { color: '--accent', width: 1.8, arrow: true, head: 7 });
            v3.text(CO.cyl2cart(0.85, phi / 2, 0), 'φ', { size: 15, italic: true, family: EM.FONT_MATH, color: '--accent' });
          }
          /* circunferencia coordenada φ */
          if (rho > 0.02) {
            const pts = [];
            for (let i = 0; i <= 72; i++) pts.push(CO.cyl2cart(rho, (2 * Math.PI * i) / 72, z));
            v3.polyline(pts, { color: COL.u2, width: 1, alpha: 0.55 });
          }
        } else {
          v3.line(O, P, { color: '--ink', width: 2, seg: 4 });
          v3.text(V.scale(P, 0.55), 'r', { size: 15, italic: true, family: EM.FONT_MATH, color: '--ink', dx: -10, dy: -8 });
          v3.line(P, Q, dsh);
          v3.line(O, Q, { color: '--ink-2', width: 1.2, dash: [4, 3], seg: 4 });
          if (th > 0.01 && r > 0.02) {
            const rr = Math.min(0.75, r * 0.6);
            v3.arc(O, [0, 0, 1], cb.rho, rr, 0, th, { color: '--c5', width: 1.8, arrow: true, head: 7 });
            const mid = V.comb(rr + 0.22, V.add(V.scale([0, 0, 1], Math.cos(th / 2)), V.scale(cb.rho, Math.sin(th / 2))));
            v3.text(mid, 'θ', { size: 15, italic: true, family: EM.FONT_MATH, color: '--c5' });
          }
          if (phi > 0.01) {
            v3.arc(O, [1, 0, 0], [0, 1, 0], 0.62, 0, phi, { color: '--accent', width: 1.8, arrow: true, head: 7 });
            v3.text(CO.cyl2cart(0.85, phi / 2, 0), 'φ', { size: 15, italic: true, family: EM.FONT_MATH, color: '--accent' });
          }
          if (r > 0.02) {
            /* meridiano y paralelo por P */
            const mer = [], par = [];
            for (let i = 0; i <= 48; i++) mer.push(CO.sph2cart(r, (Math.PI * i) / 48, phi));
            for (let i = 0; i <= 72; i++) par.push(CO.sph2cart(r, th, (2 * Math.PI * i) / 72));
            v3.polyline(mer, { color: COL.u2, width: 1, alpha: 0.55 });
            v3.polyline(par, { color: COL.u3, width: 1, alpha: 0.55 });
          }
        }
      }
      /* ---------- Bases ---------- */
      const BL = 0.95;
      if (p.cartb) {
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((u, i) => {
          v3.arrow(P, V.add(P, V.scale(u, BL * 0.8)), { color: '--c6', width: 1.4, head: 8 });
          hatText(v3, V.add(P, V.scale(u, BL * 0.8 + 0.2)), ['x', 'y', 'z'][i], '--c6');
        });
      }
      if (p.basis) {
        let bs, names, tall;
        if (sys === 'cart') { bs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; names = ['x', 'y', 'z']; tall = [false, false, false]; }
        else if (sys === 'cyl') { bs = [cb.rho, cb.phi, cb.z]; names = ['ρ', 'φ', 'z']; tall = [false, true, false]; }
        else { bs = [sb.r, sb.th, sb.phi]; names = ['r', 'θ', 'φ']; tall = [false, true, true]; }
        const cols = [COL.u1, COL.u2, COL.u3];
        bs.forEach((u, i) => {
          v3.arrow(P, V.add(P, V.scale(u, BL)), { color: cols[i], width: 2.8, head: 11 });
          hatText(v3, V.add(P, V.scale(u, BL + 0.24)), names[i], cols[i], tall[i]);
        });
      }
      v3.point(P, { r: 6, color: '--ink', glow: false });
      v3.text(P, 'P', { size: 14, weight: 700, color: '--ink', dx: -12, dy: -12 });
      v3.render();

      /* ---------- Lecturas ---------- */
      sim.set('cart', `(${f2(x)}, ${f2(y)}, ${f2(z)})`);
      sim.set('cyl', `(${f2(rho)}, ${EM.fix(deg(phi), 1)}°, ${f2(z)})`);
      sim.set('sph', `(${f2(r)}, ${EM.fix(deg(th), 1)}°, ${EM.fix(deg(phi), 1)}°)`);
      const lab = (s, tall) => `<i style="font-family:var(--font-text)">${s}</i>&#770;`;
      if (sys === 'cart') {
        sim._outs.b1.dt.innerHTML = 'x̂'; sim.set('b1', '(1, 0, 0)');
        sim._outs.b2.dt.innerHTML = 'ŷ'; sim.set('b2', '(0, 1, 0)');
        sim._outs.b3.dt.innerHTML = 'ẑ'; sim.set('b3', '(0, 0, 1)');
      } else if (sys === 'cyl') {
        sim._outs.b1.dt.innerHTML = lab('ρ'); sim.set('b1', vec(cb.rho));
        sim._outs.b2.dt.innerHTML = lab('φ'); sim.set('b2', vec(cb.phi));
        sim._outs.b3.dt.innerHTML = 'ẑ'; sim.set('b3', '(0, 0, 1)');
      } else {
        sim._outs.b1.dt.innerHTML = lab('r'); sim.set('b1', vec(sb.r));
        sim._outs.b2.dt.innerHTML = lab('θ'); sim.set('b2', vec(sb.th));
        sim._outs.b3.dt.innerHTML = lab('φ'); sim.set('b3', vec(sb.phi));
      }
      let msg = '';
      if (sys !== 'cart' && rho < 1e-6) msg = 'P está sobre el eje <i>z</i>: allí <i>φ</i> no está definido (se muestra el último valor usado).';
      if (sys === 'sph' && r < 1e-6) msg = 'P está en el origen: <i>θ</i> y <i>φ</i> no están definidos.';
      noteAxis.innerHTML = msg;
    });
  });

  /* ======================================================================
     2.2 Base polar en el plano
     ====================================================================== */
  EM.defineSim('polar-basis', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -4.2, xmax: 4.2, ymin: -3, ymax: 3 });
    const P = [2.2, 1.4];
    sim.group('Campo de fondo');
    sim.select('field', {
      options: [['none', 'Sin campo'], ['rho', 'A = ρ̂  (radial unitario)'], ['phi', 'A = φ̂  (azimutal unitario)'], ['rigid', 'A = ρ φ̂  (rotación rígida)'], ['vortex', 'A = φ̂ / ρ  (vórtice)'], ['ux', 'A = x̂  (uniforme)']],
      value: 'phi'
    });
    sim.group('Mostrar');
    sim.check('grid', { label: 'Rejilla polar', value: true });
    sim.check('cart', { label: '<b>x̂</b> y <b>ŷ</b> en P', value: true });
    sim.out('xy', '(<i>x</i>, <i>y</i>)');
    sim.out('rho', '<i>ρ</i>');
    sim.out('phi', '<i>φ</i> = atan2(<i>y</i>, <i>x</i>)', { hl: true });
    sim.out('naive', 'arctan(<i>y</i>/<i>x</i>)');
    sim.outSep();
    sim.out('ur', 'ρ̂ = (cos φ, sen φ)');
    sim.out('up', 'φ̂ = (−sen φ, cos φ)');
    sim.outSep('Campo en P');
    sim.out('Ac', '(<i>A<sub>x</sub></i>, <i>A<sub>y</sub></i>)');
    sim.out('Ap', '(<i>A<sub>ρ</sub></i>, <i>A<sub>φ</sub></i>)');
    sim.hint('Arrastra el punto P', cv);
    sim.legend([{ color: '--c2', label: 'ρ̂' }, { color: '--c3', label: 'φ̂' }, { color: '--c6', label: 'x̂, ŷ' }, { color: '--accent', label: 'ángulo φ' }]);
    const field = (x, y) => {
      const r = Math.hypot(x, y), c = x / r, s = y / r;
      switch (sim.p.field) {
        case 'rho': return [c, s];
        case 'phi': return [-s, c];
        case 'rigid': return [-y, x];
        case 'vortex': return [-s / r, c / r];
        case 'ux': return [1, 0];
        default: return [0, 0];
      }
    };
    EM.pointer(cv, {
      down: (x, y) => (Math.hypot(view.X(P[0]) - x, view.Y(P[1]) - y) < 18 ? 1 : null),
      move: (_, x, y) => {
        P[0] = M.clamp(view.wx(x), view.x0 + 0.2, view.x1 - 0.2);
        P[1] = M.clamp(view.wy(y), view.y0 + 0.2, view.y1 - 0.2);
        if (Math.hypot(P[0], P[1]) < 0.15) { P[0] = 0.15; }
        sim.redraw();
      },
      hover: (x, y) => Math.hypot(view.X(P[0]) - x, view.Y(P[1]) - y) < 18
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      view.grid({ minorLines: !sim.p.grid, xlabel: 'x', ylabel: 'y' });
      if (sim.p.grid) {
        ctx.save();
        ctx.strokeStyle = EM.col('--grid-2');
        ctx.lineWidth = 1;
        for (let r = 1; r <= 6; r++) { ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), r * view.s, 0, 2 * Math.PI); ctx.stroke(); }
        for (let a = 0; a < 360; a += 30) {
          ctx.beginPath();
          ctx.moveTo(view.X(0), view.Y(0));
          ctx.lineTo(view.X(8 * Math.cos(rad(a))), view.Y(8 * Math.sin(rad(a))));
          ctx.stroke();
        }
        ctx.fillStyle = EM.col('--ink-3');
        ctx.font = `10.5px ${EM.FONT_MONO}`;
        for (let a = 30; a < 360; a += 30) {
          if (a % 90 === 0) continue;
          const px = view.X(2.62 * Math.cos(rad(a))), py = view.Y(2.62 * Math.sin(rad(a)));
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(a + '°', px, py);
        }
        ctx.restore();
      }
      if (sim.p.field !== 'none') {
        const ref = sim.p.field === 'rigid' ? 3 : sim.p.field === 'vortex' ? 1 / 0.8 : 1;
        EM.field.arrows(view, field, { spacing: 34, mode: 'len', ref, maxLen: 26, color: EM.alpha('--c6', 0.55), width: 1.2, skip: (x, y) => Math.hypot(x, y) < 0.3 });
      }
      const O = [view.X(0), view.Y(0)], Pp = [view.X(P[0]), view.Y(P[1])];
      const rho = Math.hypot(P[0], P[1]), phi = M.atan2p(P[1], P[0]);
      /* segmento ρ */
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = EM.col('--ink-2');
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(Pp[0], Pp[1]); ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'ρ', view.X(P[0] * 0.5) - 10 * Math.sin(phi), view.Y(P[1] * 0.5) - 10 * Math.cos(phi), { size: 16, italic: true, family: EM.FONT_MATH, color: '--ink', halo: true, align: 'center', baseline: 'middle' });
      /* arco φ */
      ctx.save();
      ctx.strokeStyle = EM.col('--accent');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(O[0], O[1], 0.62 * view.s, 0, -phi, true);
      ctx.stroke();
      ctx.restore();
      const ea = [view.X(0.62 * Math.cos(phi)), view.Y(0.62 * Math.sin(phi))];
      EM.draw.arrow(ctx, ea[0] + 6 * Math.sin(phi), ea[1] + 6 * Math.cos(phi), ea[0] - 0.5 * Math.sin(phi), ea[1] - 0.5 * Math.cos(phi), { color: '--accent', width: 2, head: 8 });
      EM.text(ctx, 'φ', view.X(0.95 * Math.cos(phi / 2)), view.Y(0.95 * Math.sin(phi / 2)), { size: 16, italic: true, family: EM.FONT_MATH, color: '--accent', halo: true, align: 'center', baseline: 'middle' });
      /* base */
      const Ls = 1.05;
      const ur = [Math.cos(phi), Math.sin(phi)], up = [-Math.sin(phi), Math.cos(phi)];
      if (sim.p.cart) {
        EM.draw.arrow(ctx, Pp[0], Pp[1], Pp[0] + Ls * 0.75 * view.s, Pp[1], { color: '--c6', width: 1.6, head: 9 });
        EM.draw.arrow(ctx, Pp[0], Pp[1], Pp[0], Pp[1] - Ls * 0.75 * view.s, { color: '--c6', width: 1.6, head: 9 });
        EM.text(ctx, 'x', Pp[0] + Ls * 0.75 * view.s + 10, Pp[1] + 4, { size: 14, italic: true, family: EM.FONT_MATH, color: '--c6', hat: true, halo: true, align: 'center', baseline: 'middle' });
        EM.text(ctx, 'y', Pp[0] - 10, Pp[1] - Ls * 0.75 * view.s - 6, { size: 14, italic: true, family: EM.FONT_MATH, color: '--c6', hat: true, halo: true, align: 'center', baseline: 'middle' });
      }
      EM.draw.arrow(ctx, Pp[0], Pp[1], Pp[0] + ur[0] * Ls * view.s, Pp[1] - ur[1] * Ls * view.s, { color: '--c2', width: 3, head: 12 });
      EM.draw.arrow(ctx, Pp[0], Pp[1], Pp[0] + up[0] * Ls * view.s, Pp[1] - up[1] * Ls * view.s, { color: '--c3', width: 3, head: 12 });
      EM.text(ctx, 'ρ', Pp[0] + ur[0] * (Ls * view.s + 16), Pp[1] - ur[1] * (Ls * view.s + 16), { size: 17, italic: true, weight: 600, family: EM.FONT_MATH, color: '--c2', hat: true, halo: true, align: 'center', baseline: 'middle' });
      EM.text(ctx, 'φ', Pp[0] + up[0] * (Ls * view.s + 16), Pp[1] - up[1] * (Ls * view.s + 16), { size: 17, italic: true, weight: 600, family: EM.FONT_MATH, color: '--c3', hat: true, hatHigh: true, halo: true, align: 'center', baseline: 'middle' });
      ctx.beginPath();
      ctx.arc(Pp[0], Pp[1], 6, 0, 7);
      ctx.fillStyle = EM.col('--ink');
      ctx.fill();
      EM.text(ctx, 'P', Pp[0] - 12, Pp[1] + 16, { size: 14, weight: 700, color: '--ink', halo: true, align: 'center' });
      /* lecturas */
      const naive = deg(Math.atan(P[1] / P[0]));
      sim.set('xy', `(${f2(P[0])}, ${f2(P[1])})`);
      sim.set('rho', EM.fix(rho, 3));
      sim.set('phi', EM.fix(deg(phi), 1) + '°');
      const wrong = P[0] < 0;
      sim._outs.naive.dd.classList.toggle('warnv', wrong);
      sim.set('naive', EM.fix(naive, 1) + '°' + (wrong ? ' ✗' : ''));
      sim.set('ur', vec(ur, 3));
      sim.set('up', vec(up, 3));
      const A = field(P[0], P[1]);
      sim.set('Ac', vec(A, 3));
      sim.set('Ap', vec([A[0] * ur[0] + A[1] * ur[1], A[0] * up[0] + A[1] * up[1]], 3));
    });
  });

  /* ======================================================================
     2.3 Transformación de componentes
     ====================================================================== */
  EM.defineSim('vec-transform', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const v3 = new EM.View3D(sim, cv, { radius: 2.7, az: rad(24), el: rad(22) });
    sim.group('Sistema de destino');
    sim.seg('to', { options: [['cyl', 'Cilíndricas'], ['sph', 'Esféricas']], value: 'cyl' });
    sim.group('Punto P (cartesianas)');
    sim.slider('px', { label: '<i>x</i><sub>P</sub>', min: -2.5, max: 2.5, step: 0.05, value: 0.9, fmt: f2 });
    sim.slider('py', { label: '<i>y</i><sub>P</sub>', min: -2.5, max: 2.5, step: 0.05, value: 1.7, fmt: f2 });
    sim.slider('pz', { label: '<i>z</i><sub>P</sub>', min: -2, max: 2, step: 0.05, value: 0.8, fmt: f2 });
    sim.group('Vector A (componentes cartesianas)');
    sim.slider('ax', { label: '<i>A<sub>x</sub></i>', min: -2, max: 2, step: 0.05, value: 1.2, fmt: f2 });
    sim.slider('ay', { label: '<i>A<sub>y</sub></i>', min: -2, max: 2, step: 0.05, value: -0.4, fmt: f2 });
    sim.slider('az', { label: '<i>A<sub>z</sub></i>', min: -2, max: 2, step: 0.05, value: 0.8, fmt: f2 });
    sim.check('comp', { label: 'Descomposición en la base local', value: true });
    const mat = sim.note('');
    mat.classList.add('sim-mat');
    sim.out('P', 'P en destino');
    sim.out('Ac', '<b>A</b> cartesianas');
    sim.out('At', '<b>A</b> en destino', { hl: true });
    sim.out('mag', '|<b>A</b>| (ambas bases)');
    sim.hint('Arrastra para girar la vista', cv);
    sim.legend([{ color: '--accent', label: '<b>A</b>' }, { color: COL.u1, label: '1.ª componente' }, { color: COL.u2, label: '2.ª componente' }, { color: COL.u3, label: '3.ª componente' }]);
    sim.onDraw(() => {
      const p = sim.p;
      const P = [p.px, p.py, p.pz], A = [p.ax, p.ay, p.az];
      const [rho, phi0] = CO.cart2cyl(...P);
      const phi = rho > 1e-9 ? phi0 : 0;
      const [r, th0] = CO.cart2sph(...P);
      const th = r > 1e-9 ? th0 : 0;
      let B, names, tall, rows, rowNames;
      if (p.to === 'cyl') {
        const b = CO.cylBasis(phi);
        B = [b.rho, b.phi, b.z]; names = ['ρ', 'φ', 'z']; tall = [false, true, false];
        rowNames = ['A<sub>ρ</sub>', 'A<sub>φ</sub>', 'A<sub>z</sub>'];
      } else {
        const b = CO.sphBasis(th, phi);
        B = [b.r, b.th, b.phi]; names = ['r', 'θ', 'φ']; tall = [false, true, true];
        rowNames = ['A<sub>r</sub>', 'A<sub>θ</sub>', 'A<sub>φ</sub>'];
      }
      rows = B;
      const At = B.map((u) => V.dot(A, u));
      v3.begin();
      v3.axes({ len: 3, neg: 2.2 });
      v3.line([0, 0, 0], P, { color: '--ink-3', width: 1, dash: [4, 4], seg: 4 });
      v3.line(P, [P[0], P[1], 0], { color: '--ink-3', width: 1, dash: [2, 3], seg: 3 });
      if (p.to === 'cyl' && rho > 0.02) {
        const pts = [];
        for (let i = 0; i <= 72; i++) pts.push(CO.cyl2cart(rho, (2 * Math.PI * i) / 72, P[2]));
        v3.polyline(pts, { color: '--ink-3', width: 1, alpha: 0.6 });
      } else if (p.to === 'sph' && r > 0.02) {
        const mer = [], par = [];
        for (let i = 0; i <= 48; i++) mer.push(CO.sph2cart(r, (Math.PI * i) / 48, phi));
        for (let i = 0; i <= 72; i++) par.push(CO.sph2cart(r, th, (2 * Math.PI * i) / 72));
        v3.polyline(mer, { color: '--ink-3', width: 1, alpha: 0.6 });
        v3.polyline(par, { color: '--ink-3', width: 1, alpha: 0.6 });
      }
      const cols = [COL.u1, COL.u2, COL.u3];
      B.forEach((u, i) => {
        v3.arrow(P, V.add(P, V.scale(u, 0.75)), { color: cols[i], width: 1.6, head: 8, alpha: 0.9 });
        hatText(v3, V.add(P, V.scale(u, 0.98)), names[i], cols[i], tall[i]);
      });
      if (p.comp) {
        let q = P;
        At.forEach((c, i) => {
          const n = V.add(q, V.scale(B[i], c));
          if (Math.abs(c) > 1e-3) v3.arrow(q, n, { color: cols[i], width: 2.4, head: 9, dash: [6, 3] });
          q = n;
        });
      }
      v3.arrow(P, V.add(P, A), { color: '--accent', width: 3.4, head: 13 });
      v3.text(V.add(P, V.scale(A, 1.1)), 'A', { size: 16, weight: 700, family: EM.FONT_MATH, color: '--accent' });
      v3.point(P, { r: 5.5, color: '--ink' });
      v3.text(P, 'P', { size: 13, weight: 700, color: '--ink', dx: -12, dy: 12 });
      v3.render();
      /* matriz */
      const cn = p.to === 'cyl' ? ['A<sub>x</sub>', 'A<sub>y</sub>', 'A<sub>z</sub>'] : ['A<sub>x</sub>', 'A<sub>y</sub>', 'A<sub>z</sub>'];
      let h = `<div class="cap">Matriz de transformación en P</div><table>`;
      for (let i = 0; i < 3; i++) {
        h += `<tr><td class="lab">${rowNames[i]}</td><td>=</td>`;
        for (let j = 0; j < 3; j++) h += `<td class="${j === 0 ? 'br' : ''}${j === 2 ? ' bl' : ''}">${EM.fix(rows[i][j], 3)}</td>`;
        h += `<td class="lab">${cn[i]}</td></tr>`;
      }
      h += '</table>';
      mat.innerHTML = h;
      sim.set('P', p.to === 'cyl' ? `(${f2(rho)}, ${EM.fix(deg(phi), 1)}°, ${f2(P[2])})` : `(${f2(r)}, ${EM.fix(deg(th), 1)}°, ${EM.fix(deg(phi), 1)}°)`);
      sim.set('Ac', vec(A, 3));
      sim.set('At', vec(At, 3));
      sim.set('mag', EM.fix(V.norm(A), 4) + ' = ' + EM.fix(Math.hypot(...At), 4));
    });
  });

  /* ======================================================================
     2.4 Elemento diferencial de volumen
     ====================================================================== */
  EM.defineSim('diff-element', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const v3 = new EM.View3D(sim, cv, { radius: 2.4, az: rad(72), el: rad(24) });
    sim.group('Sistema');
    sim.seg('sys', { options: [['cyl', 'Cilíndricas'], ['sph', 'Esféricas']], value: 'cyl', onInput: () => vis() });
    sim.group('Posición del elemento');
    const s1 = sim.slider('rho0', { label: '<i>ρ</i>', min: 0.2, max: 2.4, step: 0.05, value: 1.5, fmt: f2 });
    const s2 = sim.slider('phi0', { label: '<i>φ</i>', min: 0, max: 330, step: 1, value: 25, unit: '°', fmt: fdeg });
    const s3 = sim.slider('z0', { label: '<i>z</i>', min: -1.2, max: 1.2, step: 0.05, value: 0, fmt: f2 });
    const s4 = sim.slider('r0', { label: '<i>r</i>', min: 0.3, max: 2.4, step: 0.05, value: 1.7, fmt: f2 });
    const s5 = sim.slider('th0', { label: '<i>θ</i>', min: 3, max: 170, step: 1, value: 55, unit: '°', fmt: fdeg });
    const s6 = sim.slider('ph0', { label: '<i>φ</i>', min: 0, max: 330, step: 1, value: 25, unit: '°', fmt: fdeg });
    sim.group('Incrementos (exagerados para verlos)');
    const d1 = sim.slider('drho', { label: 'd<i>ρ</i>', min: 0.02, max: 0.8, step: 0.01, value: 0.4, fmt: f2 });
    const d2 = sim.slider('dphi', { label: 'd<i>φ</i>', min: 1, max: 60, step: 1, value: 30, unit: '°', fmt: fdeg });
    const d3 = sim.slider('dz', { label: 'd<i>z</i>', min: 0.02, max: 0.8, step: 0.01, value: 0.5, fmt: f2 });
    const d4 = sim.slider('dr', { label: 'd<i>r</i>', min: 0.02, max: 0.8, step: 0.01, value: 0.4, fmt: f2 });
    const d5 = sim.slider('dth', { label: 'd<i>θ</i>', min: 1, max: 40, step: 1, value: 20, unit: '°', fmt: fdeg });
    const d6 = sim.slider('dph', { label: 'd<i>φ</i>', min: 1, max: 60, step: 1, value: 30, unit: '°', fmt: fdeg });
    function vis() {
      const c = sim.p.sys === 'cyl';
      [s1, s2, s3, d1, d2, d3].forEach((s) => s.show(c));
      [s4, s5, s6, d4, d5, d6].forEach((s) => s.show(!c));
    }
    vis();
    sim.out('e1', 'Arista 1');
    sim.out('e2', 'Arista 2');
    sim.out('e3', 'Arista 3');
    sim.outSep();
    sim.out('Vex', 'Volumen exacto', { hl: true });
    sim.out('Vap', '<i>h</i><sub>1</sub><i>h</i><sub>2</sub><i>h</i><sub>3</sub> d<i>u</i><sub>1</sub>d<i>u</i><sub>2</sub>d<i>u</i><sub>3</sub> (esquina)');
    sim.out('err', 'Error relativo');
    sim.hint('Arrastra para girar la vista', cv);
    sim.onDraw(() => {
      const p = sim.p;
      if (p.sys === 'cyl') { v3.R = 2.3; v3.target = [0.6, 0.6, 0.2]; } else { v3.R = 2.8; v3.target = [0, 0, 0.3]; }
      v3.begin();
      v3.axes({ len: 2.7, neg: 1.8 });
      const box = { fill: '--accent', alpha: 0.34, stroke: '--accent', strokeAlpha: 0.3, strokeWidth: 0.7 };
      const nA = 10;
      if (p.sys === 'cyl') {
        const r0 = p.rho0, r1 = p.rho0 + p.drho, f0 = rad(p.phi0), f1 = rad(p.phi0 + p.dphi), z0 = p.z0, z1 = p.z0 + p.dz;
        const C = (r, f, z) => CO.cyl2cart(r, f, z);
        /* contexto */
        const circ = [];
        for (let i = 0; i <= 72; i++) circ.push(C(r0, (2 * Math.PI * i) / 72, z0));
        v3.polyline(circ, { color: '--ink-3', width: 1, alpha: 0.6 });
        v3.line([0, 0, z0], C(r0, f0, z0), { color: '--ink-3', width: 1, dash: [4, 3], seg: 3 });
        v3.line([0, 0, 0], [0, 0, z0], { color: '--ink-3', width: 1, dash: [2, 3] });
        /* caras */
        v3.mesh((f, z) => C(r0, f, z), f0, f1, nA, z0, z1, 1, box);
        v3.mesh((f, z) => C(r1, f, z), f0, f1, nA, z0, z1, 1, box);
        v3.mesh((r, z) => C(r, f0, z), r0, r1, 1, z0, z1, 1, box);
        v3.mesh((r, z) => C(r, f1, z), r0, r1, 1, z0, z1, 1, box);
        v3.mesh((r, f) => C(r, f, z0), r0, r1, 1, f0, f1, nA, box);
        v3.mesh((r, f) => C(r, f, z1), r0, r1, 1, f0, f1, nA, box);
        /* aristas resaltadas desde la esquina (ρ, φ, z) */
        const K = C(r0, f0, z0);
        v3.line(K, C(r1, f0, z0), { color: COL.u1, width: 3.5 });
        const arc = [];
        for (let i = 0; i <= nA; i++) arc.push(C(r0, f0 + ((f1 - f0) * i) / nA, z0));
        v3.polyline(arc, { color: COL.u2, width: 3.5 });
        v3.line(K, C(r0, f0, z1), { color: COL.u3, width: 3.5 });
        v3.text(C(r0 + p.drho / 2, f0, z0), 'dρ', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u1, dy: 14 });
        v3.text(C(r0, (f0 + f1) / 2, z0), 'ρ dφ', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u2, dy: 14 });
        v3.text(C(r0, f0, z0 + p.dz / 2), 'dz', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u3, dx: -18 });
        v3.point(K, { r: 4, color: '--ink' });
        v3.render();
        const dphi = rad(p.dphi);
        const Vex = 0.5 * (r1 * r1 - r0 * r0) * dphi * p.dz;
        const Vap = r0 * p.drho * dphi * p.dz;
        sim._outs.e1.dt.innerHTML = 'd<i>ρ</i>'; sim.set('e1', EM.fix(p.drho, 3));
        sim._outs.e2.dt.innerHTML = '<i>ρ</i> d<i>φ</i>'; sim.set('e2', EM.fix(r0 * dphi, 3));
        sim._outs.e3.dt.innerHTML = 'd<i>z</i>'; sim.set('e3', EM.fix(p.dz, 3));
        sim.set('Vex', EM.fix(Vex, 5));
        sim.set('Vap', EM.fix(Vap, 5));
        sim.set('err', EM.fix((100 * Math.abs(Vex - Vap)) / Vex, 2) + ' %');
      } else {
        const R0 = p.r0, R1 = p.r0 + p.dr, t0 = rad(p.th0), t1 = Math.min(Math.PI, rad(p.th0 + p.dth)), f0 = rad(p.ph0), f1 = rad(p.ph0 + p.dph);
        const S = (r, t, f) => CO.sph2cart(r, t, f);
        /* esfera de referencia */
        for (let k = 1; k < 6; k++) {
          const pts = [];
          for (let i = 0; i <= 72; i++) pts.push(S(R0, (Math.PI * k) / 6, (2 * Math.PI * i) / 72));
          v3.polyline(pts, { color: '--ink-3', width: 0.8, alpha: 0.35 });
        }
        for (let k = 0; k < 12; k++) {
          const pts = [];
          for (let i = 0; i <= 36; i++) pts.push(S(R0, (Math.PI * i) / 36, (2 * Math.PI * k) / 12));
          v3.polyline(pts, { color: '--ink-3', width: 0.8, alpha: 0.35 });
        }
        v3.line([0, 0, 0], S(R0, t0, f0), { color: '--ink-3', width: 1, dash: [4, 3], seg: 3 });
        const nt = 6;
        v3.mesh((t, f) => S(R0, t, f), t0, t1, nt, f0, f1, nA, box);
        v3.mesh((t, f) => S(R1, t, f), t0, t1, nt, f0, f1, nA, box);
        v3.mesh((r, f) => S(r, t0, f), R0, R1, 1, f0, f1, nA, box);
        v3.mesh((r, f) => S(r, t1, f), R0, R1, 1, f0, f1, nA, box);
        v3.mesh((r, t) => S(r, t, f0), R0, R1, 1, t0, t1, nt, box);
        v3.mesh((r, t) => S(r, t, f1), R0, R1, 1, t0, t1, nt, box);
        const K = S(R0, t0, f0);
        v3.line(K, S(R1, t0, f0), { color: COL.u1, width: 3.5 });
        const mer = [], par = [];
        for (let i = 0; i <= nt * 2; i++) mer.push(S(R0, t0 + ((t1 - t0) * i) / (nt * 2), f0));
        for (let i = 0; i <= nA; i++) par.push(S(R0, t0, f0 + ((f1 - f0) * i) / nA));
        v3.polyline(mer, { color: COL.u2, width: 3.5 });
        v3.polyline(par, { color: COL.u3, width: 3.5 });
        v3.text(S(R0 + p.dr / 2, t0, f0), 'dr', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u1, dx: 14 });
        v3.text(S(R0, (t0 + t1) / 2, f0), 'r dθ', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u2, dx: -24 });
        v3.text(S(R0, t0, (f0 + f1) / 2), 'r senθ dφ', { size: 14, italic: true, family: EM.FONT_MATH, color: COL.u3, dy: -14 });
        v3.point(K, { r: 4, color: '--ink' });
        v3.render();
        const dth = t1 - t0, dph = rad(p.dph);
        const Vex = ((R1 ** 3 - R0 ** 3) / 3) * (Math.cos(t0) - Math.cos(t1)) * dph;
        const Vap = R0 * R0 * Math.sin(t0) * p.dr * dth * dph;
        sim._outs.e1.dt.innerHTML = 'd<i>r</i>'; sim.set('e1', EM.fix(p.dr, 3));
        sim._outs.e2.dt.innerHTML = '<i>r</i> d<i>θ</i>'; sim.set('e2', EM.fix(R0 * dth, 3));
        sim._outs.e3.dt.innerHTML = '<i>r</i> sen<i>θ</i> d<i>φ</i>'; sim.set('e3', EM.fix(R0 * Math.sin(t0) * dph, 3));
        sim.set('Vex', EM.fix(Vex, 5));
        sim.set('Vap', EM.fix(Vap, 5));
        sim.set('err', EM.fix((100 * Math.abs(Vex - Vap)) / Vex, 2) + ' %');
      }
    });
  });

  /* ======================================================================
     2.5 Área de un disco: cuadrícula cartesiana frente a polar
     ====================================================================== */
  EM.defineSim('integration-grid', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    const view = new EM.View2D(cv, { xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15 });
    sim.group('Partición');
    sim.seg('mode', { options: [['cart', 'Cartesiana'], ['polar', 'Polar']], value: 'cart' });
    sim.slider('N', { label: 'Subdivisiones <i>N</i>', min: 2, max: 60, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.check('forget', { label: 'Olvidar el factor <i>ρ</i> (error)', value: false });
    sim.note('Disco de radio <i>a</i> = 1. En polar: <i>N</i> anillos y 4<i>N</i> sectores.');
    sim.out('n', 'Elementos');
    sim.out('est', 'Área estimada', { hl: true });
    sim.out('ex', 'Área exacta π<i>a</i>²');
    sim.out('err', 'Error relativo');
    const cartEst = (N) => {
      const h = 2 / N;
      let c = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h;
        if (x * x + y * y <= 1) c++;
      }
      return [c * h * h, c];
    };
    const polarEst = (N, forget) => {
      const dr = 1 / N, dphi = (2 * Math.PI) / (4 * N);
      let s = 0;
      for (let i = 0; i < N; i++) { const rm = (i + 0.5) * dr; s += (forget ? 1 : rm) * dr * dphi * 4 * N; }
      return [s, 4 * N * N];
    };
    sim.onDraw(() => {
      const p = sim.p, N = Math.round(p.N);
      view.update();
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      const X = (x) => view.X(x), Y = (y) => view.Y(y);
      ctx.save();
      if (p.mode === 'cart') {
        const h = 2 / N;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const x = -1 + i * h, y = -1 + j * h, xc = x + h / 2, yc = y + h / 2;
          const inside = xc * xc + yc * yc <= 1;
          ctx.fillStyle = inside ? EM.alpha('--c1', 0.28) : 'transparent';
          ctx.strokeStyle = EM.alpha('--c1', inside ? 0.8 : 0.18);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(X(x), Y(y + h), h * view.s, h * view.s);
          if (inside) ctx.fill();
          ctx.stroke();
        }
      } else {
        const dr = 1 / N, nphi = 4 * N, dphi = (2 * Math.PI) / nphi;
        for (let i = 0; i < N; i++) for (let k = 0; k < nphi; k++) {
          const r0 = i * dr, r1 = r0 + dr, a0 = k * dphi, a1 = a0 + dphi;
          ctx.beginPath();
          ctx.arc(X(0), Y(0), r1 * view.s, -a0, -a1, true);
          ctx.arc(X(0), Y(0), r0 * view.s, -a1, -a0, false);
          ctx.closePath();
          ctx.fillStyle = EM.alpha(p.forget ? '--c2' : '--c3', 0.12 + 0.18 * ((i + k) % 2));
          ctx.fill();
          ctx.strokeStyle = EM.alpha(p.forget ? '--c2' : '--c3', 0.75);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X(0), Y(0), view.s, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'a = 1', X(0.72), Y(0.78), { size: 12, mono: true, color: '--ink-2', halo: true });

      /* Convergencia */
      EM.draw.clear(cp);
      const forget = p.forget && p.mode === 'polar';
      const plot = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 60, ymin: forget ? 0.6 : 0.8, ymax: forget ? 2.2 : 1.2, xlabel: 'Subdivisiones N', ylabel: 'Área estimada / πa²', title: 'Convergencia' });
      plot.frame();
      plot.hline(1, { color: '--ink-2', dash: [5, 4], label: 'valor exacto', labelRight: true });
      const xs = [], yc = [], yp = [], yf = [];
      for (let n = 2; n <= 60; n++) { xs.push(n); yc.push(cartEst(n)[0] / Math.PI); yp.push(polarEst(n, false)[0] / Math.PI); yf.push(polarEst(n, true)[0] / Math.PI); }
      plot.xy(xs, yc, { color: '--c1', width: 1.8 });
      plot.xy(xs, yp, { color: '--c3', width: 2.4 });
      if (forget) plot.xy(xs, yf, { color: '--c2', width: 2, dash: [6, 3] });
      const est = p.mode === 'cart' ? cartEst(N) : polarEst(N, p.forget);
      plot.dot(N, est[0] / Math.PI, { color: p.mode === 'cart' ? '--c1' : forget ? '--c2' : '--c3', r: 5.5 });
      const items = [{ label: 'cartesiana', color: '--c1' }, { label: 'polar  ρ Δρ Δφ', color: '--c3' }];
      if (forget) items.push({ label: 'polar sin ρ', color: '--c2', dash: [6, 3] });
      plot.legend(items, 'br');
      sim.set('n', String(est[1]));
      sim.set('est', EM.fix(est[0], 5));
      sim.set('ex', EM.fix(Math.PI, 5));
      sim.set('err', EM.fix((100 * (est[0] - Math.PI)) / Math.PI, 3) + ' %');
    });
  });

  /* ======================================================================
     2.6 Cinemática en coordenadas polares
     ====================================================================== */
  EM.defineSim('polar-kinematics', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -4, xmax: 4, ymin: -3, ymax: 3 });
    sim.group('Movimiento');
    sim.slider('rho0', { label: '<i>ρ</i> inicial', min: 0.5, max: 3, step: 0.05, value: 1.2, fmt: f2 });
    sim.slider('w', { label: '<i>φ̇</i> (velocidad angular)', min: -2, max: 2, step: 0.05, value: 1.2, unit: 'rad/s', fmt: f2 });
    sim.slider('rd', { label: '<i>ρ̇</i> (velocidad radial)', min: -0.4, max: 0.4, step: 0.01, value: 0.15, unit: 'u/s', fmt: f2 });
    sim.check('comp', { label: 'Componentes en la base polar', value: true });
    let t = 0, rho = 1.2, phi = 0, trail = [];
    const reset = () => { t = 0; rho = sim.p.rho0; phi = 0; trail = []; };
    sim.onChange = (id) => { if (id === 'rho0') reset(); };
    sim.resetButton(reset);
    sim.out('rho', '<i>ρ</i>');
    sim.out('phi', '<i>φ</i>');
    sim.outSep('Velocidad');
    sim.out('vr', '<i>v<sub>ρ</sub></i> = <i>ρ̇</i>');
    sim.out('vp', '<i>v<sub>φ</sub></i> = <i>ρφ̇</i>');
    sim.outSep('Aceleración');
    sim.out('ar', '<i>a<sub>ρ</sub></i> = −<i>ρφ̇</i>²', { hl: true });
    sim.out('ap', '<i>a<sub>φ</sub></i> = 2<i>ρ̇φ̇</i>', { hl: true });
    sim.legend([{ color: '--c1', label: 'velocidad <b>v</b> (escala ×0.8)' }, { color: '--c2', label: 'aceleración <b>a</b> (escala ×0.6)' }, { color: '--c6', label: 'trayectoria', kind: 'dash' }]);
    sim.animate((dt) => {
      t += dt;
      phi += sim.p.w * dt;
      rho += sim.p.rd * dt;
      if (rho > 3.9 || rho < 0.12) reset();
      trail.push([rho * Math.cos(phi), rho * Math.sin(phi)]);
      if (trail.length > 900) trail.shift();
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x', ylabel: 'y' });
      const ctx = cv.ctx;
      if (trail.length > 1) EM.draw.poly(ctx, trail.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--c6', width: 1.4, dash: [4, 3] });
      const x = rho * Math.cos(phi), y = rho * Math.sin(phi);
      const ur = [Math.cos(phi), Math.sin(phi)], up = [-Math.sin(phi), Math.cos(phi)];
      const w = sim.p.w, rd = sim.p.rd;
      const vr = rd, vp = rho * w, ar = -rho * w * w, ap = 2 * rd * w;
      const P = [view.X(x), view.Y(y)];
      const toPx = (vx, vy, k) => [P[0] + vx * k * view.s, P[1] - vy * k * view.s];
      /* base */
      EM.draw.arrow(ctx, P[0], P[1], ...toPx(ur[0], ur[1], 0.6), { color: '--ink-3', width: 1.2, head: 7 });
      EM.draw.arrow(ctx, P[0], P[1], ...toPx(up[0], up[1], 0.6), { color: '--ink-3', width: 1.2, head: 7 });
      const kv = 0.8, ka = 0.6;
      const v = [vr * ur[0] + vp * up[0], vr * ur[1] + vp * up[1]];
      const a = [ar * ur[0] + ap * up[0], ar * ur[1] + ap * up[1]];
      if (sim.p.comp) {
        EM.draw.arrow(ctx, P[0], P[1], ...toPx(vr * ur[0], vr * ur[1], kv), { color: '--c1', width: 1.6, dash: [4, 3], alpha: 0.8, head: 7 });
        EM.draw.arrow(ctx, P[0], P[1], ...toPx(vp * up[0], vp * up[1], kv), { color: '--c1', width: 1.6, dash: [4, 3], alpha: 0.8, head: 7 });
        EM.draw.arrow(ctx, P[0], P[1], ...toPx(ar * ur[0], ar * ur[1], ka), { color: '--c2', width: 1.6, dash: [4, 3], alpha: 0.8, head: 7 });
        EM.draw.arrow(ctx, P[0], P[1], ...toPx(ap * up[0], ap * up[1], ka), { color: '--c2', width: 1.6, dash: [4, 3], alpha: 0.8, head: 7 });
      }
      EM.draw.arrow(ctx, P[0], P[1], ...toPx(v[0], v[1], kv), { color: '--c1', width: 3, head: 11 });
      EM.draw.arrow(ctx, P[0], P[1], ...toPx(a[0], a[1], ka), { color: '--c2', width: 3, head: 11 });
      const tv = toPx(v[0], v[1], kv * 1.12), ta = toPx(a[0], a[1], ka * 1.15);
      EM.text(ctx, 'v', tv[0], tv[1], { size: 16, weight: 700, family: EM.FONT_MATH, color: '--c1', halo: true, align: 'center', baseline: 'middle' });
      EM.text(ctx, 'a', ta[0], ta[1], { size: 16, weight: 700, family: EM.FONT_MATH, color: '--c2', halo: true, align: 'center', baseline: 'middle' });
      ctx.beginPath();
      ctx.arc(P[0], P[1], 7, 0, 7);
      ctx.fillStyle = EM.col('--ink');
      ctx.fill();
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(0)); ctx.lineTo(P[0], P[1]); ctx.stroke();
      ctx.restore();
      sim.set('rho', EM.fix(rho, 3));
      sim.set('phi', EM.fix(deg(M.wrap2pi(phi)), 1) + '°');
      sim.set('vr', EM.fix(vr, 3));
      sim.set('vp', EM.fix(vp, 3));
      sim.set('ar', EM.fix(ar, 3));
      sim.set('ap', EM.fix(ap, 3));
    });
  });
})();
