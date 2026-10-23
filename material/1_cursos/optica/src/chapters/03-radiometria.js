/* Capítulo 3 — Radiometría, fotometría y cuerpo negro */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const g = (l, m, s) => Math.exp(-0.5 * Math.pow((l - m) / s, 2));
  /* Modelo de LED blanco: emisión azul de InGaN + fósforo amarillo ancho */
  const LED = (l) => g(l, 452, 10) + g(l, 575, 62);

  /* 3.1 Superficies lambertiana, isótropa y especular */
  EM.defineSim('lambert', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('tipo', { label: 'Superficie', options: [['lam', 'Lambertiana'], ['iso', 'Isótropa'], ['esp', 'Especular']], value: 'lam' });
    sim.slider('th', { label: 'Ángulo del observador respecto de la normal', min: -85, max: 85, step: 1, value: 50, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('I', 'Intensidad I(θ) / I₀', { hl: true });
    sim.out('A', 'Área aparente A cos θ / A');
    sim.out('L', 'Radiancia aparente L(θ) / L(0)');
    const I = (th, tipo) => (tipo === 'lam' ? Math.cos(th) : tipo === 'iso' ? 1 : Math.exp(-Math.pow((th - 0.6) / 0.06, 2)));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = (p.th * Math.PI) / 180;
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.82, R = Math.min(W * 0.25, H * 0.68);
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(cx - R * 1.05, cy, R * 2.1, 8);
      /* lóbulo de intensidad */
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 180, r = R * Math.min(1, I(a, p.tipo)); ctx.lineTo(cx + r * Math.sin(a), cy - r * Math.cos(a)); }
      ctx.closePath(); ctx.fillStyle = EM.alpha('--accent', 0.18); ctx.fill(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.stroke();
      if (p.tipo === 'esp') { EM.draw.arrow(ctx, cx - R * Math.sin(0.6), cy - R * Math.cos(0.6), cx, cy, { color: '--gold', width: 2 }); EM.text(ctx, 'luz incidente', cx - R * Math.sin(0.6) - 4, cy - R * Math.cos(0.6) - 6, { size: 11, color: '--gold', align: 'right' }); }
      const ox = cx + R * 1.1 * Math.sin(th), oy = cy - R * 1.1 * Math.cos(th);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ox, oy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(ox, oy, 6, 0, 7); ctx.fill();
      EM.text(ctx, 'observador', ox + (th > 0 ? 9 : -9), oy - 8, { size: 11, color: '--ink-2', align: th > 0 ? 'left' : 'right', halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: -90, xmax: 90, ymin: 0, ymax: 3, xlabel: 'θ (°)', ylabel: 'radiancia aparente L/L(0)' });
      pl.frame();
      pl.fn((d) => { const a = (d * Math.PI) / 180; return I(a, p.tipo) / Math.max(Math.cos(a), 1e-3) / (p.tipo === 'esp' ? 1 : I(0, p.tipo)); }, { color: '--accent', width: 2.2 });
      const Ith = I(th, p.tipo), Lr = Ith / Math.cos(th) / (p.tipo === 'esp' ? 1 : I(0, p.tipo));
      pl.dot(p.th, Math.min(Lr, 3), { color: '--c2', r: 6 });
      sim.set('I', EM.fix(Ith, 3));
      sim.set('A', EM.fix(Math.cos(th), 3));
      sim.set('L', p.tipo === 'esp' ? EM.fix(Lr, 3) + ' (solo cerca del reflejo)' : EM.fix(Lr, 3));
    });
  });

  /* 3.2 Eficacia luminosa de la radiación */
  EM.defineSim('eficacia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('src', { label: 'Fuente', options: [['bb', 'Cuerpo negro'], ['led', 'LED'], ['mono', 'Línea'], ['na', 'Sodio']], value: 'bb' });
    sim.slider('T', { label: 'Temperatura del cuerpo negro', min: 1000, max: 12000, step: 10, value: 2700, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda (monocromática)', min: 400, max: 700, step: 1, value: 555, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('K', 'Eficacia luminosa de la radiación', { hl: true });
    sim.out('vis', 'Fracción de la potencia entre 380 y 780 nm');
    sim.out('col', 'Color de la luz');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.T.show(p.src === 'bb'); sim.ctl.lam.show(p.src === 'mono');
      let S, K, frac, xyz;
      if (p.src === 'bb') {
        const mx = OP.planck(Math.max(380e-9, Math.min(780e-9, OP.wienPeak(p.T))), p.T);
        S = (l) => OP.planck(l * 1e-9, p.T) / mx;
        K = OP.efficacyBB(p.T); frac = OP.bbFraction(780e-9, p.T) - OP.bbFraction(380e-9, p.T); xyz = OP.specXYZ(S);
      } else if (p.src === 'led') {
        S = (l) => LED(l) / 1.0;
        let a = 0, b = 0; for (let l = 380; l <= 780; l++) { a += LED(l) * OP.V(l); b += LED(l); }
        K = (OP.KM * a) / b; frac = 1; xyz = OP.specXYZ(S);
      } else {
        const l0 = p.src === 'na' ? 589.3 : p.lam;
        S = (l) => g(l, l0, 1.2); K = OP.KM * OP.V(l0); frac = 1; xyz = OP.cmf(l0);
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 1.1, xlabel: 'λ (nm)', ylabel: 'relativo' });
      /* banda espectral bajo el eje */
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 5 }, 380, 780);
      pl.frame();
      pl.fn(OP.V, { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.fn(S, { color: '--accent', width: 2.2, n: 800 });
      pl.fn((l) => S(l) * OP.V(l), { color: '--c3', width: 0, fill: '--c3', fillAlpha: 0.35, n: 800 });
      pl.legend([{ label: 'V(λ) del ojo', color: '--ink-3', dash: [5, 4] }, { label: 'espectro de la fuente', color: '--accent' }, { label: 'espectro × V(λ)', color: '--c3', kind: 'sq' }], 'tr');
      const rgb = OP.xyz2srgb(...xyz.map((v) => v / Math.max(xyz[1], 1e-12) * 0.9));
      sim.set('K', EM.fix(K, 1) + ' lm/W');
      sim.set('vis', EM.fix(100 * frac, 1) + ' %');
      const xy = OP.xy(xyz);
      sim.set('col', `<span style="display:inline-block;width:2.2em;height:1em;vertical-align:-2px;border:1px solid var(--rule-strong);background:${D.css(rgb)}"></span> x = ${EM.fix(xy[0], 4)}, y = ${EM.fix(xy[1], 4)}`);
    });
  });

  /* 3.3 Espectro de Planck */
  EM.defineSim('planck', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 12000, step: 10, value: 5772, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('rj', { label: 'Comparar con Rayleigh–Jeans', value: false });
    sim.check('ref', { label: 'Curvas de referencia (3000, 6000 K)', value: true });
    sim.out('peak', 'Máximo λ_max = b/T', { hl: true });
    sim.out('M', 'Exitancia σT⁴');
    sim.out('vis', 'Fracción en el visible');
    sim.out('col', 'Color percibido');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const lmax = Math.min(30, Math.max(2.5, (OP.wienPeak(p.T) * 1e6) * 4.5));
      const ymax = OP.planck(OP.wienPeak(p.T), p.T) * 1.15 * 1e-12; /* W/(m² sr µm) en unidades de 10⁶ */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.8, h: H, xmin: 0, xmax: lmax, ymin: 0, ymax: ymax, xlabel: 'λ (µm)', ylabel: 'B_λ (MW m⁻² sr⁻¹ µm⁻¹)' });
      pl.frame();
      if (lmax > 0.78) pl.band(0.38, 0.78, { color: '--gold', alpha: 0.12 });
      if (p.ref) for (const T of [3000, 6000]) pl.fn((l) => OP.planck(l * 1e-6, T) * 1e-12, { color: '--ink-3', width: 1.1, dash: [4, 4], n: 600 });
      pl.fn((l) => OP.planck(l * 1e-6, p.T) * 1e-12, { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.12, n: 800 });
      if (p.rj) pl.fn((l) => ((2 * OP.c * OP.kB * p.T) / Math.pow(l * 1e-6, 4)) * 1e-12, { color: '--c2', width: 1.8, n: 600 });
      pl.vline(OP.wienPeak(p.T) * 1e6, { color: '--accent', dash: [3, 3] });
      const xyz = OP.specXYZ((l) => OP.planck(l * 1e-9, p.T)), rgb = OP.xyz2srgb(...xyz.map((v) => (v / xyz[1]) * 0.95));
      const sx = W * 0.82, sw = W * 0.16;
      D.swatch(ctx, sx, H * 0.2, sw, H * 0.45, OP.rgb255(rgb), EM.fix(p.T, 0) + ' K');
      sim.set('peak', EM.si(OP.wienPeak(p.T), 'm', 4));
      sim.set('M', EM.sci(OP.sigmaSB * Math.pow(p.T, 4), 4) + ' W/m²');
      sim.set('vis', EM.fix(100 * (OP.bbFraction(780e-9, p.T) - OP.bbFraction(380e-9, p.T)), 3) + ' %');
      const xy = OP.xy(xyz);
      sim.set('col', `x = ${EM.fix(xy[0], 4)}, y = ${EM.fix(xy[1], 4)} · T<sub>cc</sub> (McCamy) = ${EM.fix(OP.mcCamy(xy[0], xy[1]), 0)} K`);
    });
  });

  /* 3.4 Lámpara sobre una mesa */
  EM.defineSim('iluminancia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Phi', { label: 'Flujo luminoso de la lámpara', min: 100, max: 5000, step: 10, value: 800, unit: 'lm', fmt: (v) => v.toFixed(0) });
    sim.slider('h', { label: 'Altura sobre la mesa', min: 0.2, max: 3, step: 0.01, value: 0.8, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('x', { label: 'Punto de la mesa (desde debajo de la lámpara)', min: -2, max: 2, step: 0.01, value: 0.5, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.seg('tipo', { label: 'Distribución', options: [['iso', 'Isótropa (bombillo)'], ['lam', 'Lambertiana (panel)']], value: 'iso' });
    sim.out('E', 'Iluminancia en el punto', { hl: true });
    sim.out('E0', 'Iluminancia justo debajo');
    sim.out('I', 'Intensidad hacia el punto');
    const I = (th, p) => (p.tipo === 'iso' ? p.Phi / (4 * Math.PI) : (p.Phi / Math.PI) * Math.max(0, Math.cos(th)));
    const E = (x, p) => { const r = Math.hypot(x, p.h), th = Math.atan2(Math.abs(x), p.h); return (I(th, p) * Math.cos(th)) / (r * r); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W * 0.45 - 20, h: H - 20 }, -2.1, 2.1, -0.15, 3.1);
      ctx.fillStyle = EM.col('--sand'); ctx.fillRect(v.X(-2), v.Y(0), v.X(2) - v.X(-2), 6);
      const L = [0, p.h];
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(...v.map(L), 7, 0, 7); ctx.fill();
      for (let i = -8; i <= 8; i++) { const xx = (i / 8) * 2; ctx.strokeStyle = EM.alpha('--gold', Math.min(0.6, E(xx, p) / Math.max(E(0, p), 1e-9) * 0.6)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...v.map(L)); ctx.lineTo(...v.map([xx, 0])); ctx.stroke(); }
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...v.map(L)); ctx.lineTo(...v.map([p.x, 0])); ctx.stroke();
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(...v.map([p.x, 0]), 5, 0, 7); ctx.fill();
      const pl = new EM.Plot(ctx, { x: W * 0.47, y: 0, w: W * 0.53, h: H, xmin: -2, xmax: 2, ymin: 0, ymax: Math.max(600, E(0, p) * 1.15), xlabel: 'posición en la mesa (m)', ylabel: 'iluminancia (lx)' });
      pl.frame();
      pl.fn((x) => E(x, p), { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.1 });
      pl.hline(500, { color: '--c3', label: '500 lx', labelRight: true });
      pl.dot(p.x, E(p.x, p), { color: '--c2', r: 6 });
      const th = Math.atan2(Math.abs(p.x), p.h);
      sim.set('E', EM.fix(E(p.x, p), 1) + ' lx');
      sim.set('E0', EM.fix(E(0, p), 1) + ' lx');
      sim.set('I', EM.fix(I(th, p), 1) + ' cd a ' + EM.fix((th * 180) / Math.PI, 1) + '° de la vertical');
    });
  });
})();
