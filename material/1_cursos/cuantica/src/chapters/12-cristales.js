/* Capítulo 12 — Redes cristalinas y teorema de Bloch */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, TB = P.tb;
  const f3 = (v) => CQ.fix(v, 3);

  /* Sitios del panal en un rectángulo (Å) */
  function honeySites(d, W, H) {
    const lat = TB.honeycomb(d), out = [];
    const n = Math.ceil((Math.max(W, H) / lat.a) * 2) + 2;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const x = i * lat.a1[0] + j * lat.a2[0], y = i * lat.a1[1] + j * lat.a2[1];
      if (Math.abs(x) <= W / 2 && Math.abs(y) <= H / 2) out.push({ x, y, sub: 'A', i, j });
      const xb = x + lat.deltas[0][0], yb = y + lat.deltas[0][1];
      if (Math.abs(xb) <= W / 2 && Math.abs(yb) <= H / 2) out.push({ x: xb, y: yb, sub: 'B', i, j });
    }
    return { lat, sites: out };
  }

  /* ======================================================================
     12.1 Red de panal
     ====================================================================== */
  CQ.defineSim('red-panal', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new CQ.View2D(cv, { xmin: -9, xmax: 9, ymin: -6.2, ymax: 6.2 });
    sim.group('Material');
    sim.seg('mat', { label: 'Lámina', options: [['hbn', 'h-BN (d = 1.446 Å)'], ['gr', 'Grafeno (d = 1.42 Å)']], value: 'hbn' });
    sim.group('Mostrar');
    sim.check('vec', { label: 'Vectores primitivos a₁, a₂ y celda', value: true });
    sim.seg('nb', { label: 'Capa de vecinos resaltada', options: [[0, 'ninguna'], [1, '1.ª'], [2, '2.ª'], [3, '3.ª']], value: 1 });
    sim.check('dir', { label: 'Direcciones zigzag y armchair', value: true });
    sim.out('d', 'Distancia de enlace <i>d</i>');
    sim.out('a', 'Parámetro de red <i>a</i> = √3<i>d</i>', { hl: true });
    sim.out('Ac', 'Área de la celda');
    sim.out('dens', 'Átomos por nm²');
    sim.out('shell', 'Vecinos resaltados');
    sim.hint('Haz clic en un átomo para centrar los vecinos', cv);
    let center = null;
    EMptr();
    function EMptr() {
      CQ.pointer(cv, {
        down: (x, y) => {
          const s = sim._sites || [];
          let best = null, bd = 1e9;
          for (const q of s) { const dd = Math.hypot(view.X(q.x) - x, view.Y(q.y) - y); if (dd < bd) { bd = dd; best = q; } }
          if (best && bd < 14) { center = best; sim.redraw(); }
          return null;
        }
      });
    }
    sim.onDraw(() => {
      const d = sim.p.mat === 'hbn' ? 1.446 : 1.42;
      const gr = sim.p.mat === 'gr';
      view.update();
      const { lat, sites } = honeySites(d, 18, 12.4);
      sim._sites = sites;
      if (!center || !sites.find((q) => Math.abs(q.x - center.x) < 1e-6 && Math.abs(q.y - center.y) < 1e-6)) {
        center = sites.reduce((b, q) => (Math.hypot(q.x, q.y) < Math.hypot(b.x, b.y) ? q : b), sites[0]);
      }
      CQ.draw.clear(cv);
      const ctx = cv.ctx;
      /* enlaces */
      ctx.strokeStyle = CQ.alpha('--ink-3', 0.6); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
        const a = sites[i], b = sites[j];
        if (Math.abs(a.x - b.x) < 1.2 * d && Math.abs(a.y - b.y) < 1.2 * d && Math.hypot(a.x - b.x, a.y - b.y) < 1.1 * d) { ctx.moveTo(view.X(a.x), view.Y(a.y)); ctx.lineTo(view.X(b.x), view.Y(b.y)); }
      }
      ctx.stroke();
      /* vecinos */
      const shells = [d, Math.sqrt(3) * d, 2 * d];
      const sh = +sim.p.nb;
      let cnt = 0;
      if (sh > 0) {
        const R = shells[sh - 1];
        for (const q of sites) { const dd = Math.hypot(q.x - center.x, q.y - center.y); if (Math.abs(dd - R) < 0.05) { cnt++; ctx.beginPath(); ctx.arc(view.X(q.x), view.Y(q.y), 0.42 * view.s, 0, 7); ctx.fillStyle = CQ.alpha('--accent', 0.25); ctx.fill(); ctx.strokeStyle = CQ.col('--accent'); ctx.lineWidth = 1.5; ctx.stroke(); } }
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = CQ.alpha('--accent', 0.6); ctx.beginPath(); ctx.arc(view.X(center.x), view.Y(center.y), R * view.s, 0, 7); ctx.stroke(); ctx.restore();
      }
      for (const q of sites) CQ.draw.atom(ctx, view.X(q.x), view.Y(q.y), Math.max(4, 0.27 * view.s), gr ? 'C' : q.sub === 'A' ? 'B' : 'N', { label: true, sel: q === center });
      if (sim.p.vec) {
        const o = sites.find((q) => q.sub === 'A' && Math.hypot(q.x - center.x, q.y - center.y) < 1e-6) || sites.filter((q) => q.sub === 'A').reduce((b, q) => (Math.hypot(q.x, q.y) < Math.hypot(b.x, b.y) ? q : b));
        const p = [[o.x, o.y], [o.x + lat.a1[0], o.y + lat.a1[1]], [o.x + lat.a1[0] + lat.a2[0], o.y + lat.a1[1] + lat.a2[1]], [o.x + lat.a2[0], o.y + lat.a2[1]]];
        CQ.draw.poly(ctx, p.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--c3', width: 2, close: true, fill: CQ.alpha('--c3', 0.08) });
        CQ.draw.arrow(ctx, view.X(o.x), view.Y(o.y), view.X(p[1][0]), view.Y(p[1][1]), { color: '--c3', width: 2.6 });
        CQ.draw.arrow(ctx, view.X(o.x), view.Y(o.y), view.X(p[3][0]), view.Y(p[3][1]), { color: '--c3', width: 2.6 });
        CQ.text(ctx, 'a₁', view.X(p[1][0]) + 6, view.Y(p[1][1]) + 16, { size: 14, color: '--c3', weight: 700, halo: true });
        CQ.text(ctx, 'a₂', view.X(p[3][0]) - 22, view.Y(p[3][1]) - 6, { size: 14, color: '--c3', weight: 700, halo: true });
      }
      if (sim.p.dir) {
        const x0 = view.X(-8.4), y0 = view.Y(-5.5);
        CQ.draw.arrow(ctx, x0, y0, x0 + 70, y0, { color: '--c5', width: 2.4 });
        CQ.text(ctx, 'zigzag', x0 + 74, y0 + 4, { size: 12, color: '--c5', weight: 650, halo: true });
        CQ.draw.arrow(ctx, x0, y0, x0, y0 - 70, { color: '--c4', width: 2.4 });
        CQ.text(ctx, 'armchair', x0 + 4, y0 - 76, { size: 12, color: '--c4', weight: 650, halo: true });
      }
      const Ac = (Math.sqrt(3) / 2) * lat.a * lat.a;
      sim.set('d', f3(d) + ' Å');
      sim.set('a', f3(lat.a) + ' Å');
      sim.set('Ac', f3(Ac) + ' Å²');
      sim.set('dens', CQ.fix(200 / Ac, 1));
      sim.set('shell', sh ? `${cnt} a ${f3(shells[sh - 1])} Å` : '—');
    });
  });

  /* ======================================================================
     12.2 Red recíproca y zona de Brillouin
     ====================================================================== */
  CQ.defineSim('red-reciproca', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1 });
    const ck = sim.canvas({ aspect: 1 });
    sim.group('Red');
    sim.slider('d', { label: 'Distancia de enlace <i>d</i>', min: 1.0, max: 2.0, value: 1.446, step: 0.001, unit: 'Å', fmt: (v) => CQ.fix(v, 3) });
    sim.check('bis', { label: 'Construcción con mediatrices', value: true });
    sim.out('a', '<i>a</i>');
    sim.out('b', '|<b>b</b>| = 4π/(√3<i>a</i>)');
    sim.out('K', '|Γ<i>K</i>| = 4π/(3√3<i>d</i>)', { hl: true });
    sim.out('M', '|Γ<i>M</i>| = 2π/(3<i>d</i>)');
    sim.out('dot', '<b>a</b>₁·<b>b</b>₁ / <b>a</b>₁·<b>b</b>₂');
    sim.onDraw(() => {
      const lat = TB.honeycomb(sim.p.d);
      /* espacio real: red de Bravais (puntos A) */
      const vr = new CQ.View2D(cr, { xmin: -6, xmax: 6, ymin: -6, ymax: 6 });
      vr.update();
      CQ.draw.clear(cr);
      vr.grid({ minorLines: false, labels: false });
      const ctx = cr.ctx;
      for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const x = i * lat.a1[0] + j * lat.a2[0], y = i * lat.a1[1] + j * lat.a2[1]; if (Math.abs(x) < 6 && Math.abs(y) < 6) { ctx.beginPath(); ctx.arc(vr.X(x), vr.Y(y), 3.5, 0, 7); ctx.fillStyle = CQ.col('--ink-2'); ctx.fill(); } }
      CQ.draw.arrow(ctx, vr.X(0), vr.Y(0), vr.X(lat.a1[0]), vr.Y(lat.a1[1]), { color: '--c3', width: 2.4 });
      CQ.draw.arrow(ctx, vr.X(0), vr.Y(0), vr.X(lat.a2[0]), vr.Y(lat.a2[1]), { color: '--c3', width: 2.4 });
      CQ.text(ctx, 'a₁', vr.X(lat.a1[0]) + 4, vr.Y(lat.a1[1]) + 16, { size: 13, color: '--c3', weight: 700, halo: true });
      CQ.text(ctx, 'a₂', vr.X(lat.a2[0]) - 18, vr.Y(lat.a2[1]), { size: 13, color: '--c3', weight: 700, halo: true });
      CQ.text(ctx, 'espacio real (Å)', 8, 16, { size: 12, color: '--ink-2', halo: true });
      /* espacio recíproco */
      const R = 2.2 * Math.hypot(...lat.b1);
      const vk = new CQ.View2D(ck, { xmin: -R, xmax: R, ymin: -R, ymax: R });
      vk.update();
      CQ.draw.clear(ck);
      vk.grid({ minorLines: false, labels: false });
      const c2 = ck.ctx;
      const G = [];
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const x = i * lat.b1[0] + j * lat.b2[0], y = i * lat.b1[1] + j * lat.b2[1]; if (Math.abs(x) < R && Math.abs(y) < R) G.push([x, y]); }
      /* zona de Brillouin: hexágono con vértices en K y K' */
      const Kr = Math.hypot(...lat.K);
      const hex = Array.from({ length: 6 }, (_, q) => [Kr * Math.cos((q * Math.PI) / 3), Kr * Math.sin((q * Math.PI) / 3)]);
      CQ.draw.poly(c2, hex.map((p) => [vk.X(p[0]), vk.Y(p[1])]), { color: '--accent', width: 2.2, close: true, fill: CQ.alpha('--accent', 0.1) });
      if (sim.p.bis) {
        const nn = G.filter(([x, y]) => Math.abs(Math.hypot(x, y) - Math.hypot(...lat.b1)) < 1e-6);
        c2.save(); c2.setLineDash([4, 4]); c2.strokeStyle = CQ.alpha('--ink-3', 0.8); c2.lineWidth = 1;
        for (const [x, y] of nn) {
          c2.beginPath(); c2.moveTo(vk.X(0), vk.Y(0)); c2.lineTo(vk.X(x), vk.Y(y)); c2.stroke();
          const mx = x / 2, my = y / 2, L = R * 2, ux = -y, uy = x, n = Math.hypot(ux, uy);
          c2.beginPath(); c2.moveTo(vk.X(mx - (ux / n) * L), vk.Y(my - (uy / n) * L)); c2.lineTo(vk.X(mx + (ux / n) * L), vk.Y(my + (uy / n) * L)); c2.stroke();
        }
        c2.restore();
      }
      for (const [x, y] of G) { c2.beginPath(); c2.arc(vk.X(x), vk.Y(y), 3.5, 0, 7); c2.fillStyle = CQ.col('--c1'); c2.fill(); }
      CQ.draw.arrow(c2, vk.X(0), vk.Y(0), vk.X(lat.b1[0]), vk.Y(lat.b1[1]), { color: '--c1', width: 2.4 });
      CQ.draw.arrow(c2, vk.X(0), vk.Y(0), vk.X(lat.b2[0]), vk.Y(lat.b2[1]), { color: '--c1', width: 2.4 });
      const lab = (p, t, dx = 6, dy = -6) => { c2.beginPath(); c2.arc(vk.X(p[0]), vk.Y(p[1]), 4.5, 0, 7); c2.fillStyle = CQ.col('--accent'); c2.fill(); CQ.text(c2, t, vk.X(p[0]) + dx, vk.Y(p[1]) + dy, { size: 14, weight: 700, color: '--accent', halo: true }); };
      lab([0, 0], 'Γ'); lab(lat.K, 'K'); lab(lat.Kp, "K'", -24); lab(lat.M, 'M');
      CQ.text(c2, 'espacio recíproco (Å⁻¹)', 8, 16, { size: 12, color: '--ink-2', halo: true });
      CQ.text(c2, 'b₁', vk.X(lat.b1[0]) + 6, vk.Y(lat.b1[1]) + 14, { size: 13, color: '--c1', weight: 700, halo: true });
      CQ.text(c2, 'b₂', vk.X(lat.b2[0]) + 6, vk.Y(lat.b2[1]), { size: 13, color: '--c1', weight: 700, halo: true });
      sim.set('a', f3(lat.a) + ' Å');
      sim.set('b', f3(Math.hypot(...lat.b1)) + ' Å⁻¹');
      sim.set('K', f3(Math.hypot(...lat.K)) + ' Å⁻¹');
      sim.set('M', f3(Math.hypot(...lat.M)) + ' Å⁻¹');
      sim.set('dot', `${CQ.fix(lat.a1[0] * lat.b1[0] + lat.a1[1] * lat.b1[1], 6)} / ${CQ.fix(lat.a1[0] * lat.b2[0] + lat.a1[1] * lat.b2[1], 6)}`);
    });
  });

  /* ======================================================================
     12.3 Ondas de Bloch en un anillo
     ====================================================================== */
  CQ.defineSim('bloch-anillo', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1 });
    const ce = sim.canvas({ aspect: 1 });
    const cw = sim.canvas({ aspect: 4, cls: 'full' });
    sim.group('Anillo');
    sim.slider('N', { label: 'Número de átomos <i>N</i>', min: 3, max: 30, value: 12, step: 1, fmt: (v) => CQ.fix(v, 0), onInput: () => { if (Math.abs(sim.p.m) > sim.p.N) sim.ctl.m.set(0, true); } });
    sim.slider('m', { label: 'Índice <i>m</i> (k = 2πm/Na)', min: -30, max: 30, value: 2, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.check('shift', { label: 'Sumar 2π/a a k (mismo estado)', value: false });
    sim.out('k', '<i>k</i>·<i>a</i>');
    sim.out('kred', '<i>k</i>·<i>a</i> reducido a [−π, π)');
    sim.out('E', '<i>E</i>(<i>k</i>) = −2<i>t</i> cos <i>ka</i>', { hl: true });
    sim.out('nk', 'Valores de <i>k</i> distintos');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 1.5; });
    sim.onDraw(() => {
      const N = sim.p.N, m = sim.p.m;
      let ka = (2 * Math.PI * m) / N + (sim.p.shift ? 2 * Math.PI : 0);
      let kr = ((ka + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      /* anillo */
      CQ.draw.clear(cr);
      const ctx = cr.ctx, cx = cr.w / 2, cy = cr.h / 2, R = Math.min(cr.w, cr.h) * 0.34;
      ctx.strokeStyle = CQ.col('--grid-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let j = 0; j < N; j++) {
        const ang = (2 * Math.PI * j) / N, x = cx + R * Math.cos(ang), y = cy - R * Math.sin(ang);
        const re = Math.cos(ka * j - ph), im = Math.sin(ka * j - ph);
        CQ.draw.arrow(ctx, x, y, x + 26 * re * Math.cos(ang) - 0 * im, y - 26 * re * Math.sin(ang), { color: re >= 0 ? '--c2' : '--c1', width: 2.2, head: 7 });
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = CQ.col('--atC'); ctx.fill();
      }
      CQ.text(ctx, 'Re ψ en cada átomo (flechas radiales)', 8, 16, { size: 11.5, color: '--ink-2', halo: true });
      /* dispersión con los k permitidos */
      CQ.draw.clear(ce);
      const pe = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: -Math.PI, xmax: Math.PI, xpi: true, ymin: -2.4, ymax: 2.4, xlabel: 'k·a', ylabel: 'E / t' });
      pe.frame();
      pe.fn((k) => -2 * Math.cos(k), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      for (let q = 0; q < N; q++) { let k = (2 * Math.PI * q) / N; if (k >= Math.PI) k -= 2 * Math.PI; pe.dot(k, -2 * Math.cos(k), { color: '--c1', r: 3.5 }); }
      pe.dot(kr, -2 * Math.cos(kr), { color: '--accent', r: 6 });
      /* onda de Bloch continua: e^{ikx} u(x) */
      CQ.draw.clear(cw);
      const pw = new CQ.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: Math.min(N, 12), ymin: -1.3, ymax: 1.3, xlabel: 'x / a', ylabel: 'Re ψ', yticks: [-1, 0, 1], mt: 8 });
      pw.frame();
      const u = (x) => 0.55 + 0.45 * Math.cos(2 * Math.PI * x);
      pw.fn((x) => Math.cos(ka * x - ph) * u(x), { color: '--c1', width: 2, n: 800 });
      pw.fn((x) => Math.cos(kr * x - ph) * u(x), { color: '--c2', width: 1.3, dash: [4, 3], n: 800 });
      for (let j = 0; j <= Math.min(N, 12); j++) pw.dot(j, Math.cos(ka * j - ph) * u(j), { color: '--accent', r: 4 });
      pw.legend([{ label: 'k usado', color: '--c1' }, { label: 'k reducido', color: '--c2', dash: [4, 3] }], 'tr');
      sim.set('k', CQ.fix(ka, 4));
      sim.set('kred', CQ.fix(kr, 4));
      sim.set('E', CQ.fix(-2 * Math.cos(kr), 4) + ' t');
      sim.set('nk', String(N));
    });
  });
})();
