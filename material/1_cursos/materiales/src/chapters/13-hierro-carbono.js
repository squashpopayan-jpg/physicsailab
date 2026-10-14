/* Capítulo 13 — Sistema hierro–carbono */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const D = MAT.FeCD;

  function drawFeC(pl, opts = {}) {
    const L = (pts, col, w) => pl.xy(pts.map((q) => q[0]), pts.map((q) => q[1]), { color: col, width: w || 2 });
    L(D.liq, '--c2', 2.2);
    L([[0, 1538], [0.09, 1493]], '--c1'); L([[0.17, 1493], [0.53, 1493]], '--ink', 1.6); L([[0.09, 1493], [0.17, 1493]], '--ink', 1.6);
    L(D.deltaG, '--c1'); L(D.gammaD, '--c3');
    L(D.solGamma, '--c3'); L([[2.14, 1147], [6.70, 1147]], '--ink', 1.8);
    L(D.acm, '--c4'); L(D.a3, '--c3'); L(D.alphaMax, '--c1'); L(D.solvusA, '--c1');
    L([[0.022, 727], [6.70, 727]], '--ink', 1.8);
    L([[6.70, 400], [6.70, 1227]], '--ink-2', 2);
    if (opts.labels !== false) {
      pl.label(3.4, 1400, 'L', { size: 14, color: '--c2' });
      pl.label(0.9, 1250, 'γ (austenita)', { size: 12.5, color: '--c3' });
      pl.label(2.6, 1260, 'γ + L', { size: 12 });
      pl.label(5.2, 1190, 'L + Fe₃C', { size: 12 });
      pl.label(3.5, 950, 'γ + Fe₃C', { size: 12.5 });
      pl.label(3.0, 560, 'α + Fe₃C', { size: 12.5 });
      pl.label(0.06, 780, 'α+γ', { size: 10 });
      pl.label(0.02, 1440, 'δ', { size: 11, color: '--c1' });
      pl.label(6.1, 860, 'Fe₃C', { size: 11, color: '--ink-2' });
    }
  }

  /* ======================================================================
     13.1 Diagrama Fe–Fe3C
     ====================================================================== */
  EM.defineSim('fec-diagram', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('C', { label: 'Carbono <i>C</i><sub>0</sub>', min: 0, max: 6.7, step: 0.01, value: 0.35, unit: '% peso', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 400, max: 1600, step: 1, value: 726, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('zoom', { label: 'Ampliar la zona de los aceros (0–2 % C)', value: false });
    sim.out('reg', 'Región', { hl: true });
    sim.out('comp', 'Composición de las fases');
    sim.out('frac', 'Fracciones en masa');
    sim.out('kind', 'Tipo de aleación');
    let pl = null;
    EM.pointer(cv, {
      down: (x, y) => { if (!pl || !pl.inside(x, y)) return null; mv(x, y); return 1; },
      move: (_, x, y) => mv(x, y), hover: (x, y) => (pl && pl.inside(x, y) ? 'crosshair' : false)
    });
    function mv(x, y) { sim.ctl.C.set(Math.round(M.clamp(pl.invX(x), 0, 6.7) * 100) / 100); sim.ctl.T.set(Math.round(M.clamp(pl.invY(y), 400, 1600))); }
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: p.zoom ? 2.2 : 7, ymin: 400, ymax: 1600, xlabel: 'composición (% en peso de C)', ylabel: 'temperatura (°C)', ml: 56 });
      pl.frame();
      drawFeC(pl);
      pl.label(0.78, 712, 'eutectoide 0.76 %, 727 °C', { size: 10.5, color: '--ink-2', dy: 14 });
      pl.label(4.3, 1132, 'eutéctico 4.30 %, 1147 °C', { size: 10.5, color: '--ink-2', dy: 14 });
      const st = MAT.feState(p.C, p.T);
      if (st.phases.length === 2) { const [a, b] = st.phases; pl.xy([a.C, b.C], [p.T, p.T], { color: '--ink', width: 1.4 }); pl.dot(a.C, p.T, { color: '--c1', r: 3.5 }); pl.dot(b.C, p.T, { color: '--c4', r: 3.5 }); }
      pl.dot(p.C, p.T, { color: '--accent', r: 6 });
      sim.set('reg', st.region);
      sim.set('comp', st.phases.map((q) => q.name + ': ' + EM.fix(q.C, 3) + ' % C').join(' · '));
      sim.set('frac', st.phases.map((q) => 'W<sub>' + q.name + '</sub> = ' + EM.fix(q.W, 3)).join(' · '));
      sim.set('kind', p.C < 0.008 ? 'hierro' : p.C < 0.76 - 0.005 ? 'acero hipoeutectoide' : p.C <= 0.765 ? 'acero eutectoide' : p.C < 2.14 ? 'acero hipereutectoide' : p.C < 4.29 ? 'fundición hipoeutéctica' : p.C <= 4.31 ? 'fundición eutéctica' : 'fundición hipereutéctica');
    });
  });

  /* ======================================================================
     13.2 Crecimiento de la perlita
     ====================================================================== */
  EM.defineSim('pearlite-growth', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('dT', { label: 'Subenfriamiento ΔT bajo 727 °C', min: 10, max: 150, step: 1, value: 50, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => { x = 0; });
    sim.out('lam', 'Espaciado interlaminar λ ≈ 8 µm·K/ΔT', { hl: true });
    sim.out('kind', 'Tipo de perlita');
    sim.out('fr', 'Láminas: ferrita / cementita (espesor)');
    let x = 0;
    sim.animate((dt) => { x = (x + dt * 0.02 * sim.p.dT * (sim.p.dT / 50)) % 1.4; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const lam = 8 / p.dT; // µm
      const front = W * 0.15 + Math.min(1, x) * W * 0.65;
      /* austenita */
      ctx.fillStyle = EM.alpha('--c3', 0.15); ctx.fillRect(0, 0, W, H);
      if (front < W * 0.7) EM.text(ctx, 'austenita γ (0.76 % C)', W * 0.86, 24, { size: 12, color: '--c3', align: 'center', halo: true });
      /* borde de grano de origen */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.15, 0); ctx.lineTo(W * 0.15, H); ctx.stroke();
      const px = Math.max(8, Math.min(60, lam * 90)); // píxeles por período
      for (let y = 0, k = 0; y < H; y += px, k++) {
        const tF = px * 0.89 * 0.9, tC = px - tF;
        ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.fillRect(W * 0.15, y, front - W * 0.15, tF);
        ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(W * 0.15, y + tF, front - W * 0.15 + 3, tC);
        /* flujo de carbono en el frente */
        if (px > 14) EM.draw.arrow(ctx, front + 6, y + tF * 0.45, front + 6, y + tF + tC * 0.5 - 2, { color: '--accent', width: 1.4 });
      }
      EM.text(ctx, 'perlita', (W * 0.15 + front) / 2, H - 10, { size: 12, align: 'center', color: '--ink', halo: true });
      EM.text(ctx, 'frente de crecimiento →', front + 10, H - 10, { size: 11, color: '--accent', halo: true });
      const kind = p.dT < 40 ? 'gruesa (cerca de 727 °C, más blanda)' : p.dT < 100 ? 'media' : 'fina (cerca de 600 °C, más dura)';
      sim.set('lam', EM.fix(lam, 3) + ' µm');
      sim.set('kind', kind);
      sim.set('fr', EM.fix(lam * 0.875, 3) + ' µm / ' + EM.fix(lam * 0.125, 3) + ' µm');
    });
    sim.note('El espaciado sigue la relación inversa de Zener; la constante 8 µm·K es un orden de magnitud típico para aceros al carbono.');
  });

  /* ======================================================================
     13.3 Microestructura de un acero
     ====================================================================== */
  EM.defineSim('steel-micro', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('C', { label: 'Carbono', min: 0.02, max: 1.6, step: 0.01, value: 0.4, unit: '% peso', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura (enfriamiento lento)', min: 400, max: 1000, step: 1, value: 700, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('reg', 'Fases presentes', { hl: true });
    sim.out('mic', 'Microconstituyentes');
    sim.out('ts', 'Resistencia estimada (mezcla ferrita 280 / perlita 800 MPa)');
    const rnd = (k) => { const s = Math.sin(k * 127.1 + 3.7) * 43758.5453; return s - Math.floor(s); };
    const seeds = Array.from({ length: 22 }, (_, i) => [rnd(i + 1), rnd(i + 40)]);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* diagrama pequeño */
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 1.7, ymin: 400, ymax: 1000, xlabel: '% C', ylabel: 'T (°C)', ml: 48 });
      pl.frame();
      drawFeC(pl, { labels: false });
      pl.label(0.9, 950, 'γ', { size: 13, color: '--c3' });
      pl.label(0.75, 560, 'α + Fe₃C', { size: 11.5 });
      pl.dot(p.C, p.T, { color: '--accent', r: 6 });
      /* micrografía */
      const cx = W * 0.25, cy = H * 0.5, R = Math.min(W * 0.23, H * 0.46);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
      const st = MAT.feState(p.C, p.T);
      const hypo = p.C < 0.76;
      let fPro = 0, pearl = false, fGamma = 1;
      if (p.T < 727) { pearl = true; const m = MAT.feMicro(p.C); fPro = m.Wpro; fGamma = 0; }
      else if (st.region === 'α + γ') { fPro = st.phases[0].W; fGamma = st.phases[1].W; }
      else if (st.region === 'γ + Fe₃C') { fPro = st.phases[1].W; fGamma = st.phases[0].W; }
      else if (st.region === 'α') { fPro = 1; fGamma = 0; }
      /* granos de Voronoi; cada grano se asigna a ferrita proeutectoide o al resto */
      const G = 3, n = seeds.length;
      const own = (u, v) => { let b = 0, bd = 9; for (let i = 0; i < n; i++) { const d = (u - seeds[i][0]) ** 2 + (v - seeds[i][1]) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
      const order = seeds.map((_, i) => i).sort((a, b) => rnd(a + 99) - rnd(b + 99));
      const nPro = hypo ? Math.round(fPro * n) : 0;
      const isPro = new Set(order.slice(0, nPro));
      for (let yy = cy - R; yy < cy + R; yy += G) for (let xx = cx - R; xx < cx + R; xx += G) {
        const u = (xx - (cx - R)) / (2 * R), v = (yy - (cy - R)) / (2 * R);
        const o = own(u, v), o2 = own(u + 0.012, v), o3 = own(u, v + 0.012);
        const edge = o !== o2 || o !== o3;
        let col;
        if (edge) col = !hypo && fPro > 0 ? EM.col('--ink') : EM.alpha('--ink', 0.6);
        else if (isPro.has(o)) col = EM.mix(EM.col('--surface'), EM.col('--c1'), 0.08);
        else if (pearl) col = (Math.floor((xx * Math.cos(o) + yy * Math.sin(o)) / 3) % 2) ? EM.col('--ink-2') : EM.mix(EM.col('--surface'), EM.col('--c1'), 0.15);
        else col = EM.mix(EM.col('--surface'), EM.col('--c3'), 0.25);
        ctx.fillStyle = col; ctx.fillRect(xx, yy, G, G);
      }
      ctx.restore();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const m = MAT.feMicro(p.C);
      sim.set('reg', st.region + ' — ' + st.phases.map((q) => q.name + ' ' + EM.fix(q.W, 2)).join(', '));
      sim.set('mic', p.T < 727 ? m.proName + ' ' + EM.fix(m.Wpro, 3) + ' · perlita ' + EM.fix(m.Wpearlite, 3) : fGamma < 1 ? (hypo ? 'ferrita proeutectoide ' : 'cementita proeutectoide ') + EM.fix(fPro, 3) + ' · austenita ' + EM.fix(fGamma, 3) : 'austenita');
      sim.set('ts', p.T < 727 && hypo ? '≈ ' + EM.fix(280 * m.Wpro + 800 * m.Wpearlite, 0) + ' MPa (orden de magnitud)' : '—');
    });
  });

  /* ======================================================================
     13.4 Carbono equivalente
     ====================================================================== */
  EM.defineSim('carbon-equivalent', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const pres = { s235: ['Estructural S235 / A36', 0.17, 1.0, 0, 0, 0, 0, 0], s355: ['Estructural S355', 0.20, 1.5, 0, 0, 0, 0, 0], a4140: ['AISI 4140', 0.40, 0.9, 1.0, 0.2, 0, 0, 0], a4340: ['AISI 4340', 0.40, 0.7, 0.8, 0.25, 0, 1.8, 0], a1045: ['AISI 1045', 0.45, 0.75, 0, 0, 0, 0, 0] };
    sim.select('pre', { label: 'Acero', options: [['', 'Personalizado']].concat(Object.entries(pres).map(([k, v]) => [k, v[0]])), value: 's355' });
    const keys = [['C', 'C', 0, 1, 0.01], ['Mn', 'Mn', 0, 2, 0.05], ['Cr', 'Cr', 0, 3, 0.05], ['Mo', 'Mo', 0, 1, 0.05], ['V', 'V', 0, 0.3, 0.01], ['Ni', 'Ni', 0, 4, 0.05], ['Cu', 'Cu', 0, 1, 0.05]];
    keys.forEach(([k, l, a, b, s]) => sim.slider(k, { label: l + ' (% peso)', min: a, max: b, step: s, value: 0, fmt: (v) => EM.fix(v, 2) }));
    const apply = () => { const v = pres[sim.p.pre]; if (v) keys.forEach(([k], i) => sim.ctl[k].set(v[i + 1], true)); };
    sim.onChange = (id) => { if (id === 'pre') apply(); else if (sim.p.pre) sim.ctl.pre.set('', true); };
    apply();
    sim.out('ce', 'Carbono equivalente (IIW)', { hl: true });
    sim.out('rec', 'Recomendación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const ce = MAT.CE_IIW(p.C, p.Mn, p.Cr, p.Mo, p.V, p.Ni, p.Cu);
      const x0 = 30, x1 = W - 30, y = H * 0.55, sc = (x1 - x0) / 1.0;
      const zones = [[0, 0.4, '--c3', 'buena soldabilidad'], [0.4, 0.5, '--c4', 'precaución'], [0.5, 1.0, '--c2', 'precalentar y controlar H']];
      for (const [a, b, c, t] of zones) { ctx.fillStyle = EM.alpha(c, 0.25); ctx.fillRect(x0 + a * sc, y - 18, (b - a) * sc, 36); EM.text(ctx, t, x0 + ((a + b) / 2) * sc, y - 26, { size: 11.5, align: 'center', color: c }); }
      for (let v = 0; v <= 1.0001; v += 0.1) EM.text(ctx, EM.fix(v, 1), x0 + v * sc, y + 34, { size: 11, mono: true, align: 'center', color: '--ink-3' });
      const xc = x0 + Math.min(1, ce) * sc;
      EM.draw.arrow(ctx, xc, y + 50, xc, y + 20, { color: '--accent', width: 3 });
      sim.set('ce', EM.fix(ce, 3));
      sim.set('rec', ce < 0.4 ? 'soldable sin precalentamiento en espesores normales' : ce < 0.5 ? 'precalentamiento moderado (≈ 100 °C) en espesores gruesos' : 'precalentar 150–350 °C, electrodos de bajo hidrógeno y tratamiento posterior');
    });
  });
})();
