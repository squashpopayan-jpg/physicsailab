/* Capítulo 3 — Red recíproca y zonas de Brillouin */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;
  const rad = EM.M.rad, PI = Math.PI;
  const recip2 = (a1, a2) => {
    const A = a1[0] * a2[1] - a1[1] * a2[0];
    return [[(2 * PI * a2[1]) / A, (-2 * PI * a2[0]) / A], [(-2 * PI * a1[1]) / A, (2 * PI * a1[0]) / A]];
  };

  /* 3.1 Red directa y recíproca */
  EM.defineSim('reciproca2d', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('t', { label: 'Red', options: [['obl', 'Oblicua'], ['rect', 'Rectangular'], ['hex', 'Hexagonal']], value: 'obl' });
    sim.slider('b', { label: 'b/a', min: 0.6, max: 2, step: 0.01, value: 1.4, fmt: (v) => v.toFixed(2) });
    sim.slider('g', { label: 'Ángulo γ', min: 50, max: 130, step: 1, value: 70, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('bz', { label: 'Primera zona de Brillouin', value: true });
    sim.out('ab', 'a_i · b_j', { hl: true });
    sim.out('ar', 'Área de celda directa × recíproca');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.b.show(p.t !== 'hex'); sim.ctl.g.show(p.t === 'obl');
      let a1 = [1, 0], a2;
      if (p.t === 'obl') a2 = [p.b * Math.cos(rad(p.g)), p.b * Math.sin(rad(p.g))];
      else if (p.t === 'rect') a2 = [0, p.b];
      else a2 = [-0.5, Math.sqrt(3) / 2];
      const [b1, b2] = recip2(a1, a2);
      const v1 = D.view({ x: 6, y: 22, w: W / 2 - 12, h: H - 30 }, -2.4, 2.4, -1.9, 1.9);
      const s = 2 * PI;
      const v2 = D.view({ x: W / 2 + 6, y: 22, w: W / 2 - 12, h: H - 30 }, -2.4 * s, 2.4 * s, -1.9 * s, 1.9 * s);
      D.polygon(ctx, v1, [[0, 0], a1, [a1[0] + a2[0], a1[1] + a2[1]], a2], { fill: '--c1', alpha: 0.1, stroke: '--c1' });
      D.lattice2d(ctx, v1, a1, a2, [[0, 0]], { N: 8, r: 0.07, colors: ['--c1'] });
      D.arrow(ctx, v1, [0, 0], a1, { color: '--c1', width: 2.2 });
      D.arrow(ctx, v1, [0, 0], a2, { color: '--c1', width: 2.2 });
      if (p.bz) D.polygon(ctx, v2, SS.wignerSeitz2d(b1, b2), { fill: '--c3', alpha: 0.18, stroke: '--c3', width: 2 });
      D.lattice2d(ctx, v2, b1, b2, [[0, 0]], { N: 6, r: 0.07 * s, colors: ['--c2'] });
      D.arrow(ctx, v2, [0, 0], b1, { color: '--c2', width: 2.2 });
      D.arrow(ctx, v2, [0, 0], b2, { color: '--c2', width: 2.2 });
      EM.text(ctx, 'b_1', v2.X(b1[0]) + 5, v2.Y(b1[1]) + 14, { size: 13, italic: true, weight: 700, color: '--c2', halo: true });
      EM.text(ctx, 'b_2', v2.X(b2[0]) + 5, v2.Y(b2[1]) - 5, { size: 13, italic: true, weight: 700, color: '--c2', halo: true });
      EM.text(ctx, 'a_1', v1.X(a1[0]) + 5, v1.Y(a1[1]) + 14, { size: 13, italic: true, weight: 700, color: '--c1', halo: true });
      EM.text(ctx, 'a_2', v1.X(a2[0]) + 5, v1.Y(a2[1]) - 5, { size: 13, italic: true, weight: 700, color: '--c1', halo: true });
      EM.text(ctx, 'red directa (unidades de a)', 12, 15, { size: 12, color: '--ink-2', weight: 600 });
      EM.text(ctx, 'red recíproca (unidades de 2π/a)', W / 2 + 12, 15, { size: 12, color: '--ink-2', weight: 600 });
      ctx.strokeStyle = EM.col('--rule'); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      const dot = (u, w) => u[0] * w[0] + u[1] * w[1];
      sim.set('ab', `a₁·b₁ = ${EM.fix(dot(a1, b1) / s, 3)}·2π, a₁·b₂ = ${EM.fix(dot(a1, b2), 3)}, a₂·b₁ = ${EM.fix(dot(a2, b1), 3)}`);
      const A = Math.abs(a1[0] * a2[1] - a1[1] * a2[0]), B = Math.abs(b1[0] * b2[1] - b1[1] * b2[0]);
      sim.set('ar', EM.fix(A, 3) + ' × ' + EM.fix(B / (s * s), 3) + '·(2π)² = (2π)²');
    });
  });

  /* 3.3 Zonas de Brillouin 2D */
  EM.defineSim('zonas2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.seg('t', { label: 'Red', options: [['sq', 'Cuadrada'], ['hex', 'Hexagonal']], value: 'sq' });
    sim.slider('n', { label: 'Zonas mostradas', min: 1, max: 9, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.check('red', { label: 'Esquema de zona reducida', value: false });
    sim.check('lines', { label: 'Planos de Bragg', value: true });
    sim.out('a', 'Área de cada zona / área de la primera', { hl: true });
    let key = '', img = null, areas = [];
    const NX = 360;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nz = Math.round(p.n);
      EM.draw.clear(cv);
      const a1 = [1, 0], a2 = p.t === 'sq' ? [0, 1] : [-0.5, Math.sqrt(3) / 2];
      const [b1, b2] = recip2(a1, a2).map((b) => [b[0] / (2 * PI), b[1] / (2 * PI)]);
      const Gs = SS.gvecs2d(b1, b2, 6);
      const R = 2.05;
      const k = p.t + nz + p.red;
      const size = Math.min(W, H) - 20, r = { x: (W - size) / 2, y: (H - size) / 2, w: size, h: size };
      if (k !== key) {
        key = k; img = new Int16Array(NX * NX); areas = new Array(12).fill(0);
        for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) {
          const kv = [-R + (2 * R * (i + 0.5)) / NX, R - (2 * R * (j + 0.5)) / NX];
          const z = SS.zoneIndex(kv, Gs);
          img[j * NX + i] = z;
          if (z <= nz) areas[z]++;
        }
      }
      const ws = SS.wignerSeitz2d(b1, b2);
      const inWS = (x, y) => { for (const G of Gs) if (x * G[0] + y * G[1] > (G[0] * G[0] + G[1] * G[1]) / 2 + 1e-12) return false; return true; };
      if (!p.red) {
        D.paint(ctx, img, NX, NX, r, (z) => (z > nz ? EM.rgb('--canvas') : EM.rgb(D.zoneColor(z)).map((c) => c * 0.92)), { smooth: false });
      } else {
        /* zona reducida: cada punto de la primera zona coloreado por la zona n mostrada que lo cubre (la más alta) */
        const vals = new Int16Array(NX * NX);
        for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) {
          const x = -R + (2 * R * (i + 0.5)) / NX, y = R - (2 * R * (j + 0.5)) / NX;
          vals[j * NX + i] = inWS(x, y) ? nz : 0;
        }
        D.paint(ctx, vals, NX, NX, r, (z) => (z ? EM.rgb(D.zoneColor(z)).map((c) => c * 0.92) : EM.rgb('--canvas')), { smooth: false });
      }
      const v = D.view(r, -R, R, -R, R);
      if (p.lines) {
        ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
        ctx.strokeStyle = EM.alpha('--ink', 0.35); ctx.lineWidth = 1;
        for (const G of Gs) {
          if (Math.hypot(...G) > 2 * R) continue;
          const g2 = (G[0] * G[0] + G[1] * G[1]) / 2, t = [-G[1], G[0]];
          const c = [(G[0] * g2) / (g2 * 2), (G[1] * g2) / (g2 * 2)];
          ctx.beginPath(); ctx.moveTo(v.X(c[0] - 5 * t[0]), v.Y(c[1] - 5 * t[1])); ctx.lineTo(v.X(c[0] + 5 * t[0]), v.Y(c[1] + 5 * t[1])); ctx.stroke();
        }
        ctx.restore();
      }
      D.polygon(ctx, v, ws, { stroke: '--ink', width: 2.2 });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), 3, 0, 7); ctx.fill();
      EM.text(ctx, 'unidades de 2π/a', r.x + 4, r.y + r.h - 6, { size: 11, color: '--ink-2', halo: true });
      const a0 = areas[1] || 1, list = [];
      for (let z = 2; z <= nz; z++) {
        list.push(z + ': ' + EM.fix(areas[z] / a0, 3));
      }
      sim.set('a', nz === 1 ? 'zona 1' : list.join(' · '));
    });
  });

  /* 3.4 Zonas de Brillouin 3D */
  const PATHS = { fcc: ['Γ', 'X', 'W', 'K', 'Γ', 'L', 'U', 'W', 'L', 'K'], bcc: ['Γ', 'H', 'N', 'Γ', 'P', 'H'], sc: ['Γ', 'X', 'M', 'Γ', 'R', 'X'], hex: ['Γ', 'M', 'K', 'Γ', 'A', 'L', 'H', 'A'] };
  EM.defineSim('bz3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.seg('t', { label: 'Red directa', options: [['fcc', 'fcc'], ['bcc', 'bcc'], ['sc', 'sc'], ['hex', 'hex.']], value: 'fcc' });
    sim.check('path', { label: 'Recorrido de alta simetría', value: true });
    sim.check('b', { label: 'Vectores recíprocos primitivos', value: false });
    sim.out('f', 'Caras y vértices', { hl: true });
    sim.out('v', 'Volumen (unidades de (2π/a)³)');
    sim.out('pts', 'Distancias desde Γ (2π/a)');
    const v = new EM.View3D(sim, cv, { az: rad(25), el: rad(18), radius: 2.0, persp: 0.15 });
    sim.onDraw(() => {
      const p = sim.p, t = p.t;
      const prim = SS.primitive(t, 1), B = SS.recip(prim).map((b) => b.map((x) => x / (2 * PI)));
      const bz = SS.bz3d(B);
      const sp = SS.special(t);
      const scale = 1.25 / Math.max(...bz.verts.map((q) => Math.hypot(...q)));
      v.begin();
      v.axes({ len: 1.7, neg: 0, names: ['k_x', 'k_y', 'k_z'] });
      EM.renderBZ(v, bz, { scale, points: sp });
      if (p.path) {
        const lab = PATHS[t];
        for (let i = 0; i < lab.length - 1; i++) v.line(sp[lab[i]].map((x) => x * scale), sp[lab[i + 1]].map((x) => x * scale), { color: '--c2', width: 2.2, seg: 4, bias: 0.3 });
      }
      if (p.b) B.forEach((b, i) => { v.arrow([0, 0, 0], b.map((x) => x * scale), { color: '--c5', width: 2.2 }); v.text(b.map((x) => x * scale * 1.08), 'b_' + (i + 1), { size: 13, italic: true, color: '--c5', weight: 700 }); });
      v.render();
      sim.set('f', bz.faces.length + ' caras · ' + bz.verts.length + ' vértices');
      sim.set('v', EM.fix(Math.abs(EM.lin.det3(B)), 4) + ' = (2π)³/V_c');
      sim.set('pts', Object.entries(sp).filter(([k]) => k !== 'Γ').map(([k, q]) => k + ' ' + EM.fix(Math.hypot(...q), 3)).join(' · '));
    });
  });

  /* 3.5 Valores de k permitidos */
  EM.defineSim('puntosk', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.seg('t', { label: 'Red', options: [['sq', 'Cuadrada'], ['hex', 'Hexagonal']], value: 'sq' });
    sim.slider('N', { label: 'Celdas por lado N', min: 2, max: 40, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Puntos k en la primera zona', { hl: true });
    sim.out('dk', 'Área por punto');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N);
      EM.draw.clear(cv);
      const a1 = [1, 0], a2 = p.t === 'sq' ? [0, 1] : [-0.5, Math.sqrt(3) / 2];
      const [b1, b2] = recip2(a1, a2).map((b) => [b[0] / (2 * PI), b[1] / (2 * PI)]);
      const Gs = SS.gvecs2d(b1, b2, 2);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -0.85, 0.85, -0.72, 0.72);
      const ws = SS.wignerSeitz2d(b1, b2);
      D.polygon(ctx, v, ws, { fill: '--c3', alpha: 0.12, stroke: '--c3', width: 2 });
      /* reducir cada k a la primera zona y contar sin duplicar bordes */
      const pts = [];
      const red = (k) => {
        let best = k, bd = Math.hypot(...k);
        for (const G of Gs) { const q = [k[0] - G[0], k[1] - G[1]], d = Math.hypot(...q); if (d < bd - 1e-9) { bd = d; best = q; } }
        return best;
      };
      for (let m = 0; m < N; m++) for (let n = 0; n < N; n++) {
        const k = [(m / N) * b1[0] + (n / N) * b2[0], (m / N) * b1[1] + (n / N) * b2[1]];
        pts.push(red(k));
      }
      const rr = Math.max(1.6, Math.min(5, 90 / N));
      for (const q of pts) { ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(v.X(q[0]), v.Y(q[1]), rr, 0, 7); ctx.fill(); }
      EM.text(ctx, 'k en unidades de 2π/a', 16, H - 16, { size: 11.5, color: '--ink-3' });
      const A = Math.abs(b1[0] * b2[1] - b1[1] * b2[0]);
      sim.set('n', N + '² = ' + pts.length + ' = número de celdas');
      sim.set('dk', '(2π)²/(N²A_c) = ' + EM.fix(A / (N * N), 5) + '·(2π/a)²');
    });
  });
})();
