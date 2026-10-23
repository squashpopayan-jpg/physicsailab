/* Capítulo 28 — La luz cuántica */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 28.1 Efecto fotoeléctrico */
  EM.defineSim('fotoelectrico', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const MET = { Cs: 'Cesio', K: 'Potasio', Na: 'Sodio', Ca: 'Calcio', Zn: 'Cinc', Ag: 'Plata', Cu: 'Cobre', Pt: 'Platino' };
    sim.select('m', { label: 'Metal (función de trabajo típica)', options: Object.entries(MET).map(([k, n]) => [k, n + ' (' + OP.WORK[k] + ' eV)']), value: 'Cs' });
    sim.slider('lam', { label: 'Longitud de onda', min: 200, max: 700, step: 1, value: 400, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('I', { label: 'Intensidad (relativa)', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.out('K', 'Energía cinética máxima', { hl: true });
    sim.out('V', 'Potencial de frenado');
    sim.out('u', 'Longitud de onda umbral');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Wf = OP.WORK[p.m];
      EM.draw.clear(cv);
      const K = OP.photoKmax(p.lam, Wf);
      /* V₀ frente a frecuencia (Millikan) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.4, xmax: 1.5, ymin: 0, ymax: 4, xlabel: 'frecuencia (10¹⁵ Hz)', ylabel: 'potencial de frenado (V)' });
      pl.frame();
      for (const [k] of Object.entries(MET)) pl.fn((f) => { const v = (OP.h * f * 1e15) / OP.e - OP.WORK[k]; return v > 0 ? v : NaN; }, { color: k === p.m ? '--accent' : '--grid-2', width: k === p.m ? 2.4 : 1 });
      const nu = OP.c / (p.lam * 1e-9) / 1e15;
      if (K > 0) pl.dot(nu, K, { color: '--c2', r: 6 });
      pl.vline(nu, { color: D.lamRay(Math.max(400, Math.min(700, p.lam))) });
      /* curva I–V */
      const Is = p.I;
      const pv = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -4, xmax: 3, ymin: 0, ymax: 1.1, xlabel: 'voltaje del colector (V)', ylabel: 'corriente (rel.)' });
      pv.frame();
      /* modelo: electrones con energías uniformes en [0, K]: fracción que vence −V es 1 − |V|/K */
      pv.fn((V) => (K <= 0 ? 0 : V >= 0 ? Is : Math.max(0, Is * (1 + V / K))), { color: '--accent', width: 2.4 });
      if (K > 0) pv.vline(-K, { color: '--c2', label: '−V₀', labelY: 14 });
      sim.set('K', K > 0 ? EM.fix(K, 3) + ' eV' : 'no salen electrones (fotón de ' + EM.fix(OP.eV(p.lam), 2) + ' eV)');
      sim.set('V', K > 0 ? EM.fix(K, 3) + ' V' : '—');
      sim.set('u', EM.fix(1239.84 / Wf, 0) + ' nm');
    });
  });

  /* 28.2 Estadística de fotones */
  EM.defineSim('estadistica', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('src', { label: 'Fuente', options: [['coh', 'Láser (coherente)'], ['th', 'Térmica']], value: 'coh' });
    sim.slider('m', { label: 'Fotones medios por intervalo n̄', min: 0.5, max: 20, step: 0.1, value: 5, fmt: (v) => v.toFixed(1) });
    sim.out('st', 'Media y varianza medidas', { hl: true });
    sim.out('g2', 'g⁽²⁾(0) = ⟨n(n−1)⟩/n̄²');
    let seed = 3;
    sim.button('Repetir medida', () => { seed++; sim.redraw(); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, coh = p.src === 'coh';
      EM.draw.clear(cv);
      const rng = OP.rng(seed), NS = 5000, nmax = Math.ceil(p.m * (coh ? 2.5 : 5) + 6), h = new Float64Array(nmax + 1);
      let s1 = 0, s2 = 0, sf = 0;
      for (let i = 0; i < NS; i++) { const n = coh ? rng.poisson(p.m) : rng.geometric(p.m); s1 += n; s2 += n * n; sf += n * (n - 1); if (n <= nmax) h[n]++; }
      const mean = s1 / NS, vr = s2 / NS - mean * mean;
      const pmx = Math.max(...h) / NS * 1.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -0.5, xmax: nmax + 0.5, ymin: 0, ymax: Math.max(pmx, 0.05), xlabel: 'fotones contados n', ylabel: 'probabilidad' });
      pl.frame();
      pl.clip((c) => { c.fillStyle = EM.alpha(coh ? '--c1' : '--c2', 0.45); for (let n = 0; n <= nmax; n++) { const x0 = pl.X(n - 0.4), x1 = pl.X(n + 0.4), y = pl.Y(h[n] / NS); c.fillRect(x0, y, x1 - x0, pl.Y(0) - y); } });
      const pts = [], pts2 = [];
      for (let n = 0; n <= nmax; n++) { pts.push([n, OP.poisson(n, p.m)]); pts2.push([n, OP.boseEinstein(n, p.m)]); }
      pl.path(pts, { color: '--c1', width: 2 }); pl.path(pts2, { color: '--c2', width: 2 });
      pl.legend([{ label: 'Poisson (coherente)', color: '--c1' }, { label: 'Bose–Einstein (térmica)', color: '--c2' }], 'tr');
      sim.set('st', EM.fix(mean, 2) + ' y ' + EM.fix(vr, 2) + ' (teórica ' + EM.fix(coh ? p.m : p.m + p.m * p.m, 2) + ')');
      sim.set('g2', EM.fix(sf / NS / (mean * mean), 3) + ' (teórico ' + (coh ? '1' : '2') + ')');
    });
  });

  /* 28.3 Mach–Zehnder de un fotón */
  EM.defineSim('mz-foton', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('ph', { label: 'Diferencia de fase φ', min: 0, max: 360, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('rate', { label: 'Fotones por segundo', min: 1, max: 500, log: true, value: 20, fmt: (v) => v.toFixed(0) });
    sim.check('wp', { label: 'Marcador de camino en el brazo superior', value: false });
    sim.out('c', 'Cuentas en D1 / D2', { hl: true });
    sim.out('pt', 'Probabilidad teórica de D1');
    let n1 = 0, n2 = 0, acc = 0, flash = null, ft = 0;
    const rng = OP.rng(9);
    const reset = () => { n1 = 0; n2 = 0; };
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'ph' || id === 'wp') reset(); };
    const P1 = () => (sim.p.wp ? 0.5 : Math.pow(Math.cos((sim.p.ph * Math.PI) / 360), 2));
    sim.animate((dt) => { acc += dt * sim.p.rate; ft += dt; while (acc >= 1) { acc -= 1; if (rng() < P1()) { n1++; flash = 1; } else { n2++; flash = 2; } ft = 0; } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W * 0.6 - 20, h: H - 20 }, -0.3, 3.3, -0.4, 2.4);
      const A = [0.5, 0], B = [2.5, 0], Cc = [0.5, 2], Dd = [2.5, 2];
      D.ray(ctx, v, [[-0.3, 0], A], { color: '--ray', width: 2 });
      for (const path of [[A, B, Dd], [A, Cc, Dd]]) D.ray(ctx, v, path, { color: '--ray', width: 1.4, arrow: false, alpha: 0.6 });
      D.ray(ctx, v, [Dd, [3.2, 2]], { color: '--ray', width: 1.4, alpha: 0.6 });
      D.ray(ctx, v, [Dd, [2.5, 2.4]], { color: '--ray', width: 1.4, alpha: 0.6 });
      for (const q of [A, Dd]) { ctx.save(); ctx.translate(...v.map(q)); ctx.rotate(Math.PI / 4); ctx.fillStyle = EM.alpha('--glass', 0.5); ctx.fillRect(-12, -2, 24, 4); ctx.restore(); }
      for (const q of [B, Cc]) { ctx.save(); ctx.translate(...v.map(q)); ctx.rotate(Math.PI / 4); ctx.fillStyle = EM.col('--mirror'); ctx.fillRect(-12, -2, 24, 4); ctx.restore(); }
      ctx.fillStyle = EM.alpha('--c5', 0.35); ctx.fillRect(v.X(1.3), v.Y(0) - 10, v.X(1.7) - v.X(1.3), 20);
      EM.text(ctx, 'φ', v.X(1.5), v.Y(0) - 14, { size: 13, color: '--c5', align: 'center', italic: true });
      if (p.wp) { ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(1.5), v.Y(2), 7, 0, 7); ctx.fill(); EM.text(ctx, 'marcador', v.X(1.5), v.Y(2) - 12, { size: 10.5, color: '--c2', align: 'center' }); }
      const det = (q, lab, on) => { ctx.fillStyle = on ? '#FFD24A' : EM.col('--ink-3'); ctx.beginPath(); ctx.arc(...v.map(q), 11, 0, 7); ctx.fill(); EM.text(ctx, lab, v.X(q[0]) + 15, v.Y(q[1]) + 4, { size: 12, color: '--ink' }); };
      det([3.2, 2], 'D1', flash === 1 && ft < 0.08); det([2.5, 2.4], 'D2', flash === 2 && ft < 0.08);
      /* barras */
      const tot = Math.max(1, n1 + n2), bx = W * 0.64, bw = W * 0.12, bh = H * 0.7, by = H * 0.12;
      for (const [i, n, c] of [[0, n1, '--c1'], [1, n2, '--c2']]) { const hh = (bh * n) / tot; ctx.fillStyle = EM.col(c); ctx.fillRect(bx + i * (bw + 20), by + bh - hh, bw, hh); EM.text(ctx, 'D' + (i + 1), bx + i * (bw + 20) + bw / 2, by + bh + 16, { size: 12, align: 'center', color: '--ink-2' }); }
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); const yt = by + bh - bh * P1(); ctx.beginPath(); ctx.moveTo(bx - 4, yt); ctx.lineTo(bx + bw + 4, yt); ctx.stroke(); ctx.setLineDash([]);
      sim.set('c', n1 + ' / ' + n2 + (n1 + n2 ? ' (D1: ' + EM.fix((100 * n1) / (n1 + n2), 1) + ' %)' : ''));
      sim.set('pt', EM.fix(100 * P1(), 1) + ' %' + (p.wp ? ' (sin interferencia)' : ' = cos²(φ/2)'));
    });
  });

  /* 28.4 BB84 */
  EM.defineSim('bb84', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.check('eve', { label: 'Espía que intercepta y reenvía', value: false });
    sim.slider('N', { label: 'Fotones enviados', min: 20, max: 4000, step: 20, value: 400, fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Bits conservados (misma base)', { hl: true });
    sim.out('e', 'Tasa de error de la clave');
    let seed = 1;
    sim.button('Nueva transmisión', () => { seed++; sim.redraw(); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const rng = OP.rng(seed * 7919), rows = [];
      let kept = 0, err = 0;
      for (let i = 0; i < p.N; i++) {
        const ab = rng() < 0.5 ? 0 : 1, bit = rng() < 0.5 ? 0 : 1;
        let sb = ab, sbit = bit;
        if (p.eve) { const eb = rng() < 0.5 ? 0 : 1; const ebit = eb === sb ? sbit : rng() < 0.5 ? 0 : 1; sb = eb; sbit = ebit; }
        const bb = rng() < 0.5 ? 0 : 1, res = bb === sb ? sbit : rng() < 0.5 ? 0 : 1;
        const keep = ab === bb;
        if (keep) { kept++; if (res !== bit) err++; }
        if (rows.length < 14) rows.push([ab, bit, bb, res, keep]);
      }
      const sym = (b, v) => (b === 0 ? (v ? '↕' : '↔') : v ? '⤢' : '⤡');
      const cols = ['Alicia: base', 'bit', 'polarización', 'Bernardo: base', 'resultado', '¿se conserva?'];
      const x0 = 14, cw = (W - 28) / cols.length, rh = Math.min(22, (H - 40) / 15);
      cols.forEach((c, i) => EM.text(ctx, c, x0 + i * cw, 20, { size: 11, color: '--ink-2', weight: 600 }));
      rows.forEach((r, j) => {
        const y = 42 + j * rh, [ab, bit, bb, res, keep] = r;
        const cells = [ab ? '×' : '+', String(bit), sym(ab, bit), bb ? '×' : '+', String(res), keep ? (res === bit ? 'sí' : 'sí, ERROR') : 'no'];
        cells.forEach((t, i) => EM.text(ctx, t, x0 + i * cw, y, { size: 12, color: i === 5 && keep && res !== bit ? '--c2' : keep ? '--ink' : '--ink-3', mono: true }));
      });
      sim.set('k', kept + ' de ' + p.N);
      sim.set('e', EM.fix((100 * err) / Math.max(1, kept), 2) + ' %' + (p.eve ? ' (teórico 25 %)' : ' (sin espía: 0 %)'));
    });
  });
})();
