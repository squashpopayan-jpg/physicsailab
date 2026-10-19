/* Práctica M6 · Choques y conservación del momento */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  const G = MC.K.gPop;

  {
    const cart = (x0, col) => [P(x0, 1, 3, 12, 4, '--lego-dkgray', { name: 'Placa 4×12 (chasis)' }), B(x0 + 4, 2, 4, 4, 2, col), B(x0 + 5, 2.5, 7, 1, 1, '--lego-black', { name: 'Bandera: ladrillo 1×1' }), B(x0 + 5, 2.5, 10, 1, 1, '--lego-black', { name: 'Bandera: ladrillo 1×1' })];
    LG.def('carril', {
      name: 'Carril de choques', rot: 0,
      steps: [
        { note: 'Base de 6 × 48 módulos (tres placas de 6×16).', parts: [P(0, 0, 0, 16, 6, '--lego-dkgray'), P(16, 0, 0, 16, 6, '--lego-dkgray'), P(32, 0, 0, 16, 6, '--lego-dkgray')] },
        { note: 'Dos rieles de ladrillos Technic 1×16 que guían las ruedas.', parts: [0, 16, 32].flatMap((x) => [TX(x, 0, 1, 16, 1, '--lego-gray', { name: 'Ladrillo Technic 1×16' }), TX(x, 5, 1, 16, 1, '--lego-gray', { name: 'Ladrillo Technic 1×16' })]) },
        { note: 'Dos postes con las fotocompuertas, a 16 y 34 módulos. El haz cruza el carril a la altura de las banderas.', parts: [B(16, 6, 1, 2, 1, '--lego-blue'), B(16, 6, 4, 2, 1, '--lego-blue'), B(16, 6, 7, 2, 1, '--lego-blue'), BOX(16.5, 5.5, 10, 1, 1, 2, '--chip', { name: 'Optointerruptor A' }), B(34, 6, 1, 2, 1, '--lego-blue'), B(34, 6, 4, 2, 1, '--lego-blue'), B(34, 6, 7, 2, 1, '--lego-blue'), BOX(34.5, 5.5, 10, 1, 1, 2, '--chip', { name: 'Optointerruptor B' })] },
        { note: 'Carrito 1 (con imán o velcro al frente) y carrito 2 en reposo entre las compuertas. Cada bandera mide 32 mm de ancho.', parts: cart(2, '--lego-red').concat(cart(24, '--lego-yellow')) }
      ]
    });
  }

  MC.defineSim('m6-choque', function (sim) {
    const cv = sim.canvas({ aspect: 4.2, label: 'Carril' });
    const cg = sim.canvas({ aspect: 3.0, label: 'Momento antes y después' });
    const tab = MC.results(sim, ['<i>m</i>₁ (kg)', '<i>m</i>₂ (kg)', 'Tipo', '<i>v</i>₁ (m/s)', '<i>v</i>₁′ (m/s)', '<i>v</i>₂′ (m/s)', '<i>p</i> (kg·m/s)', '<i>p</i>′ (kg·m/s)', '<i>K</i>′/<i>K</i>', '<i>e</i>'], { decimals: [3, 3, 0, 3, 3, 3, 4, 4, 3, 3], title: 'Resultados de los choques' });
    const xA = 0.25, xB = 0.55, w = 0.032, len = 0.096, Ltr = 0.8;
    let c1, c2, ev, done, joined;
    sim.group('Carritos');
    sim.slider('m1', { label: 'Masa del carrito 1', min: 0.15, max: 0.6, step: 0.01, value: 0.25, unit: 'kg', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.slider('m2', { label: 'Masa del carrito 2', min: 0.15, max: 0.6, step: 0.01, value: 0.25, unit: 'kg', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.slider('v1', { label: 'Rapidez inicial del carrito 1', min: 0.1, max: 0.8, step: 0.01, value: 0.42, unit: 'm/s', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.select('tipo', { label: 'Parachoques', options: [['iman', 'Imanes enfrentados (e ≈ 0.93)'], ['goma', 'Banda elástica (e ≈ 0.7)'], ['velcro', 'Velcro (quedan unidos)']], value: 'iman', reset: true });
    sim.slider('mu', { label: 'Fricción de rodadura', min: 0, max: 0.02, step: 0.001, value: 0.004, fmt: (q) => MC.fix(q, 3), reset: true });
    sim.button('Agregar a la tabla', () => addRow(), { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('ev', 'Lecturas de las compuertas');
    sim.out('cons', 'Momento conservado (ajuste)', { hl: true });
    const eOf = () => ({ iman: 0.93, goma: 0.7, velcro: 0 }[sim.p.tipo]);
    sim.run({
      h: 1 / 2000, startLabel: 'Impulsar',
      reset() {
        c1 = { x: 0.06, v: sim.p.v1 * (1 + M.gauss(0, 0.01)), m: sim.p.m1, blk: {} };
        c2 = { x: 0.40, v: 0, m: sim.p.m2, blk: {} };
        ev = []; done = false; joined = false;
      },
      step(h) {
        for (const c of [c1, c2]) {
          const dec = sim.p.mu * G * Math.sign(c.v);
          if (Math.abs(c.v) < dec * h) c.v = 0; else c.v -= dec * h;
          c.x += c.v * h;
        }
        if (joined) { c2.v = c1.v; c2.x = c1.x + len; }
        else if (c2.x - c1.x <= len && c1.v > c2.v) {
          const e = eOf(), m1 = c1.m, m2 = c2.m, u1 = c1.v, u2 = c2.v;
          const vcm = (m1 * u1 + m2 * u2) / (m1 + m2);
          c1.v = vcm - (e * m2 * (u1 - u2)) / (m1 + m2);
          c2.v = vcm + (e * m1 * (u1 - u2)) / (m1 + m2);
          if (e === 0) joined = true;
        }
        /* compuertas */
        for (const [gn, xg] of [['A', xA], ['B', xB]]) for (const [cn, c] of [['1', c1], ['2', c2]]) {
          const fc = c.x + len / 2;
          const on = Math.abs(fc - xg) < w / 2;
          const k = gn + cn;
          if (on && !c.blk[k]) c.blk[k] = sim.t;
          else if (!on && c.blk[k]) { const dt = sim.t - c.blk[k] + M.gauss(0, 4e-6); ev.push({ g: gn, c: cn, t: sim.t, v: (w / dt) * Math.sign(c.v || 1) }); c.blk[k] = 0; }
        }
        if (sim.t > 6 || ((c1.x > Ltr || c1.x < -0.1 || Math.abs(c1.v) < 1e-4) && (c2.x > Ltr || Math.abs(c2.v) < 1e-4) && sim.t > 0.5)) { done = true; sim.end(); }
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 2) + ' s'
    });
    function results() {
      const a1 = ev.filter((q) => q.c === '1');
      const v1 = a1.length ? a1[0].v : NaN;
      const after1 = a1.slice(1);
      const v1p = after1.length ? after1[0].v : 0;
      const b2 = ev.find((q) => q.c === '2');
      const v2p = b2 ? b2.v : 0;
      return { v1, v1p, v2p };
    }
    function addRow() {
      if (!done) return;
      const { v1, v1p, v2p } = results();
      if (!isFinite(v1)) return;
      const m1 = sim.p.m1, m2 = sim.p.m2;
      const p = m1 * v1, pp = m1 * v1p + m2 * v2p;
      const K = 0.5 * m1 * v1 * v1, Kp = 0.5 * m1 * v1p * v1p + 0.5 * m2 * v2p * v2p;
      tab.add([m1, m2, { iman: 'imanes', goma: 'banda', velcro: 'velcro' }[sim.p.tipo], v1, v1p, v2p, p, pp, Kp / K, (v2p - v1p) / v1]);
    }
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const sc = (W - 40) / Ltr, x0 = 20, y0 = H * 0.82;
      D.ground(ctx, 0, y0 + 8, W, { depth: 6 });
      ctx.fillStyle = MC.col('--lego-gray'); ctx.fillRect(x0, y0, Ltr * sc, 8);
      for (const [n, xg] of [['A', xA], ['B', xB]]) {
        const X = x0 + xg * sc;
        ctx.fillStyle = MC.col('--lego-blue'); ctx.fillRect(X - 5, y0 - 70, 10, 70);
        D.line(ctx, X, y0 - 52, X, y0 - 34, { color: '--c2', width: 2, dash: [3, 2] });
        MC.text(ctx, n, X, y0 - 76, { size: 13, weight: 700, align: 'center', color: '--ink' });
      }
      for (const [c, col, lab] of [[c1, '--lego-red', '1'], [c2, '--lego-yellow', '2']]) {
        if (!c) continue;
        const X = x0 + c.x * sc;
        ctx.fillStyle = MC.col(col); ctx.fillRect(X, y0 - 26, len * sc, 20);
        ctx.fillStyle = MC.col('--lego-black'); ctx.fillRect(X + (len / 2 - w / 2) * sc, y0 - 56, w * sc, 30);
        D.circle(ctx, X + len * sc * 0.2, y0 - 4, 5, { fill: '--tire', color: 'none' });
        D.circle(ctx, X + len * sc * 0.8, y0 - 4, 5, { fill: '--tire', color: 'none' });
        MC.text(ctx, lab, X + len * sc / 2, y0 - 13, { size: 12, weight: 700, align: 'center', baseline: 'middle', color: '--body-ink' });
        if (Math.abs(c.v) > 0.01) D.vec(ctx, X + len * sc / 2, y0 - 66, c.v * 90, 0, { color: '--vel', width: 2 });
      }
      sim.set('ev', ev.length ? ev.map((q) => `${q.g}: carrito ${q.c}, ${MC.fix(q.v, 3)} m/s`).join('<br>') : '—');
      /* momento */
      const c2x = cg.ctx;
      D.clear(cg);
      const ps = tab.col(6), pps = tab.col(7);
      const mx = Math.max(0.1, ...ps.map(Math.abs), ...pps.map(Math.abs)) * 1.15;
      const { f } = MC.fitPlot(c2x, { x: 0, y: 0, w: cg.w, h: cg.h }, ps, pps, { xlabel: ['p', 'kg·m/s'], ylabel: ['p′', 'kg·m/s'], title: 'Momento después contra momento antes', xr: [0, MC.niceCeil(mx)], yr: [0, MC.niceCeil(mx)], prop: true, curve: (x) => x });
      sim.set('cons', f && ps.length >= 2 ? `p′/p = ${L.pm(f.m, f.sm)}` : 'agregue choques');
    });
  });
})();
