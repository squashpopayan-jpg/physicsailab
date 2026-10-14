/* Capítulo 8 — Elasticidad y ensayo de tracción */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  /* E (GPa), σy (MPa), K (MPa), n, ε de fractura */
  const PRE = {
    low: ['Acero de bajo carbono recocido', 207, 250, 600, 0.21, 0.36],
    s4340: ['Acero 4340 revenido a 315 °C', 207, 1620, 2650, 0.12, 0.13],
    ss304: ['Acero inoxidable 304 recocido', 193, 205, 1400, 0.44, 0.6],
    cu: ['Cobre recocido', 115, 69, 530, 0.44, 0.48],
    al2024: ['Aluminio 2024-T3', 72.4, 345, 780, 0.17, 0.19],
    brass: ['Latón naval recocido', 100, 170, 585, 0.21, 0.42],
    mg: ['Magnesio AZ-31B recocido', 45, 150, 450, 0.16, 0.16]
  };
  EM.TENSILE_PRESETS = PRE;
  /* Límite al 0.2 % por intersección con la recta desplazada */
  function offsetYield(pts, E) {
    for (let i = 1; i < pts.length; i++) {
      const f = (q) => q[1] - E * (q[0] - 0.002);
      if (f(pts[i - 1]) > 0 && f(pts[i]) <= 0) { const t = f(pts[i - 1]) / (f(pts[i - 1]) - f(pts[i])); return [M.lerp(pts[i - 1][0], pts[i][0], t), M.lerp(pts[i - 1][1], pts[i][1], t)]; }
    }
    return [NaN, NaN];
  }
  EM.offsetYield = offsetYield;

  /* ======================================================================
     8.1 Constantes elásticas
     ====================================================================== */
  EM.defineSim('elastic-constants', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('eps', { label: 'Deformación axial <i>ε<sub>z</sub></i> (exagerada)', min: 0, max: 0.3, step: 0.005, value: 0.15, fmt: (v) => EM.fix(v, 3) });
    sim.slider('nu', { label: 'Coeficiente de Poisson <i>ν</i>', min: -0.5, max: 0.5, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('E', { label: 'Módulo de Young <i>E</i>', min: 1, max: 400, step: 1, value: 207, unit: 'GPa', fmt: (v) => v.toFixed(0) });
    sim.out('ex', 'Deformación lateral <i>ε<sub>x</sub></i> = −<i>νε<sub>z</sub></i>');
    sim.out('dv', 'Cambio de volumen Δ<i>V</i>/<i>V</i> ≈ (1 − 2<i>ν</i>)<i>ε<sub>z</sub></i>', { hl: true });
    sim.out('G', 'Módulo de cizalla <i>G</i> = <i>E</i>/2(1 + <i>ν</i>)');
    sim.out('K', 'Módulo volumétrico <i>K</i> = <i>E</i>/3(1 − 2<i>ν</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const w0 = H * 0.32, h0 = H * 0.5;
      const ex = -p.nu * p.eps;
      const draw = (cx, w, h, col, dash) => {
        ctx.save(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.setLineDash(dash || []);
        if (!dash) { ctx.fillStyle = EM.alpha(col, 0.15); ctx.fillRect(cx - w / 2, H / 2 - h / 2, w, h); }
        ctx.strokeRect(cx - w / 2, H / 2 - h / 2, w, h); ctx.restore();
      };
      draw(W * 0.25, w0, h0, '--ink-3', [5, 4]);
      draw(W * 0.25, w0 * (1 + ex), h0 * (1 + p.eps), '--accent');
      EM.draw.arrow(ctx, W * 0.25, H / 2 - (h0 * (1 + p.eps)) / 2, W * 0.25, H / 2 - (h0 * (1 + p.eps)) / 2 - 26, { color: '--c1', width: 2.2 });
      EM.draw.arrow(ctx, W * 0.25, H / 2 + (h0 * (1 + p.eps)) / 2, W * 0.25, H / 2 + (h0 * (1 + p.eps)) / 2 + 26, { color: '--c1', width: 2.2 });
      EM.text(ctx, 'F', W * 0.25 + 8, 20, { size: 13, italic: true, color: '--c1' });
      /* gráfica de ΔV/V contra ν */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -0.5, xmax: 0.5, ymin: -1, ymax: 2, xlabel: 'ν', ylabel: 'ΔV/(V ε_z)', ml: 46 });
      pl.frame();
      pl.fn((n) => 1 - 2 * n, { color: '--c1', width: 2 });
      pl.dot(p.nu, 1 - 2 * p.nu, { color: '--accent' });
      const marks = [['caucho', 0.5], ['acero', 0.3], ['vidrio', 0.22], ['corcho', 0.0]];
      for (const [t, n] of marks) pl.label(n, 1 - 2 * n, t, { dy: -8, size: 10.5, color: '--ink-3' });
      const G = p.E / (2 * (1 + p.nu)), K = p.nu < 0.5 ? p.E / (3 * (1 - 2 * p.nu)) : Infinity;
      sim.set('ex', EM.fix(ex, 4));
      sim.set('dv', EM.fix((1 + p.eps) * Math.pow(1 + ex, 2) - 1, 4) + ' (exacto) · ' + EM.fix((1 - 2 * p.nu) * p.eps, 4) + ' (lineal)');
      sim.set('G', EM.fix(G, 1) + ' GPa');
      sim.set('K', isFinite(K) ? EM.fix(K, 1) + ' GPa' : '∞ (incompresible)');
    });
  });

  /* ======================================================================
     8.2 Ensayo de tracción
     ====================================================================== */
  EM.defineSim('tensile-test', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('m', { label: 'Material', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'low' });
    sim.check('tru', { label: 'Curva verdadera', value: false });
    sim.check('unl', { label: 'Descarga elástica desde el punto actual', value: false });
    sim.check('zoom', { label: 'Ampliar la zona elástica', value: false });
    sim.slider('sp', { label: 'Velocidad del ensayo', min: 0.2, max: 4, step: 0.1, value: 1, fmt: (v) => EM.fix(v, 1) + '×' });
    sim.resetButton(() => { prog = 0; });
    sim.out('E', 'Módulo <i>E</i>');
    sim.out('sy', 'Límite elástico (0.2 %)', { hl: true });
    sim.out('uts', 'Resistencia a la tracción');
    sim.out('el', 'Alargamiento a la fractura');
    sim.out('ur', 'Resiliencia <i>U<sub>r</sub></i>');
    sim.out('tough', 'Tenacidad (área bajo la curva)');
    let prog = 0, cache = null, ckey = '';
    sim.onChange = (id) => { if (id === 'm') prog = 0; };
    sim.animate((dt) => { prog = Math.min(1, prog + dt * 0.08 * sim.p.sp); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      const [name, E, sy, K, n, ef] = PRE[p.m];
      if (ckey !== p.m) { cache = MAT.tensile({ E: E * 1e9, sy: sy * 1e6, K: K * 1e6, n, efrac: ef, N: 1500 }); ckey = p.m; }
      const T = cache;
      const pts = T.pts.map((q) => [q[0], q[1] / 1e6]);
      const k = Math.max(1, Math.floor(prog * (pts.length - 1)));
      const cur = pts[k];
      EM.draw.clear(cv);
      /* probeta */
      const sx = W * 0.12, L0 = H * 0.55;
      const necking = cur[0] > T.eu ? Math.min(0.55, ((cur[0] - T.eu) / (ef - T.eu)) * 0.55) : 0;
      const broken = prog >= 1;
      EM.draw.specimen(ctx, sx, H * 0.5, L0 * (1 + cur[0] * 0.8), 18 * (1 - 0.25 * Math.min(cur[0], 0.6)), { neck: necking, broken });
      EM.text(ctx, broken ? 'fractura' : necking > 0 ? 'estricción' : cur[1] > sy ? 'deformación plástica uniforme' : 'elástico', sx, H - 8, { size: 11, align: 'center', color: '--ink-3' });
      /* curva */
      const xmax = p.zoom ? 0.02 : ef * 1.08;
      const tr = T.tru.map((q) => [q[0], q[1] / 1e6]);
      const ymax = Math.max(...pts.map((q) => q[1]), p.tru ? Math.max(...tr.map((q) => q[1])) : 0) * 1.15;
      const pl = new EM.Plot(ctx, { x: W * 0.24, y: 0, w: W * 0.76, h: H, xmin: 0, xmax, ymin: 0, ymax, xlabel: 'deformación ε', ylabel: 'esfuerzo σ (MPa)', ml: 56 });
      pl.frame();
      pl.xy(pts.slice(0, k + 1).map((q) => q[0]), pts.slice(0, k + 1).map((q) => q[1]), { color: '--accent', width: 2.4 });
      if (p.tru) {
        const trk = tr.filter((q) => Math.exp(q[0]) - 1 <= cur[0] + 1e-9);
        pl.xy(trk.map((q) => q[0]), trk.map((q) => q[1]), { color: '--c1', width: 1.8, dash: [6, 3] });
      }
      const yld = EM.offsetYield(pts, E * 1000);
      if (cur[0] > yld[0]) {
        pl.fn((x) => E * 1000 * (x - 0.002), { color: '--ink-3', width: 1, dash: [3, 3] });
        pl.dot(yld[0], yld[1], { color: '--c3', label: 'σ_y', dx: 8, dy: 14 });
      }
      const iu = pts.reduce((b, q, i) => (q[1] > pts[b][1] ? i : b), 0);
      if (k >= iu) pl.dot(pts[iu][0], pts[iu][1], { color: '--c2', label: 'UTS', dy: -10 });
      if (p.unl && cur[1] > sy * 0.5) {
        const ep = cur[0] - cur[1] / (E * 1000);
        pl.xy([cur[0], ep], [cur[1], 0], { color: '--c5', width: 1.6, dash: [4, 3] });
        pl.dot(ep, 0, { color: '--c5', label: 'ε permanente', dy: -8, noclip: true });
      }
      pl.dot(cur[0], cur[1], { color: '--accent' });
      if (p.tru) pl.legend([{ label: 'ingeniería', color: '--accent' }, { label: 'verdadera (hasta la estricción)', color: '--c1', dash: [6, 3] }], 'br');
      const tough = MAT.areaUnder(pts);
      sim.set('E', E + ' GPa');
      sim.set('sy', isFinite(yld[1]) ? EM.fix(yld[1], 0) + ' MPa' : '—');
      sim.set('uts', EM.fix(pts[iu][1], 0) + ' MPa a ε = ' + EM.fix(pts[iu][0], 3) + ' (ε<sub>verd</sub> = ' + EM.fix(Math.log(1 + pts[iu][0]), 3) + ', n = ' + n + ')');
      sim.set('el', EM.fix(100 * (ef - pts[pts.length - 1][1] / (E * 1000)), 1) + ' %');
      sim.set('ur', EM.fix(MAT.resilience(yld[1], E * 1000), 3) + ' MJ/m³');
      sim.set('tough', EM.fix(tough, 0) + ' MJ/m³');
    });
  });

  /* ======================================================================
     8.3 Dureza
     ====================================================================== */
  EM.defineSim('hardness', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('t', { label: 'Ensayo', options: [['hb', 'Brinell'], ['hv', 'Vickers']], value: 'hb' });
    sim.slider('P', { label: 'Carga <i>P</i>', min: 1, max: 3000, step: 1, value: 3000, unit: 'kgf', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Tamaño de la huella <i>d</i> (diámetro o diagonal)', min: 0.05, max: 6, step: 0.01, value: 4, unit: 'mm', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('H', 'Dureza', { hl: true });
    sim.out('ts', 'Resistencia estimada (aceros) ≈ 3.45 HB');
    sim.out('cmt', 'Comentario');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const D = 10;
      const d = p.t === 'hb' ? Math.min(p.d, D * 0.99) : p.d;
      const Hval = p.t === 'hb' ? MAT.brinell(p.P, D, d) : MAT.vickers(p.P, d);
      const HB = p.t === 'hb' ? Hval : Hval * 0.95; // HV ≈ 1.05 HB en aceros (aprox.)
      /* corte del indentador */
      const cx = W * 0.27, y0 = H * 0.55, sc = (W * 0.36) / (p.t === 'hb' ? D : Math.max(1, d * 1.6));
      ctx.fillStyle = EM.alpha('--c6', 0.25); ctx.fillRect(10, y0, W * 0.52, H - y0 - 10);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10, y0); ctx.lineTo(W * 0.52 + 10, y0); ctx.stroke();
      if (p.t === 'hb') {
        const R = (D / 2) * sc, depth = (D - Math.sqrt(D * D - d * d)) / 2;
        const cy = y0 - R + depth * sc;
        ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.strokeStyle = EM.col('--c1'); ctx.stroke();
        EM.draw.arrow(ctx, cx - (d / 2) * sc, y0 + 16, cx + (d / 2) * sc, y0 + 16, { color: '--accent', width: 1.6 });
        EM.text(ctx, 'd', cx, y0 + 34, { size: 13, italic: true, align: 'center', color: '--accent' });
      } else {
        const hh = d / (2 * Math.SQRT2) / Math.tan(M.rad(68)) * Math.SQRT2;
        ctx.fillStyle = EM.alpha('--c1', 0.35);
        ctx.beginPath(); ctx.moveTo(cx - (d / Math.SQRT2 / 2) * sc * 1.0, y0); ctx.lineTo(cx, y0 + hh * sc); ctx.lineTo(cx + (d / Math.SQRT2 / 2) * sc, y0); ctx.lineTo(cx + (d / 2) * sc, y0 - d * sc); ctx.lineTo(cx - (d / 2) * sc, y0 - d * sc); ctx.closePath(); ctx.fill();
        /* vista superior de la huella */
        const tx = W * 0.27, ty = H * 0.22, s2 = Math.min(60, (d / Math.SQRT2) * sc * 0.5);
        ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx, ty - s2); ctx.lineTo(tx + s2, ty); ctx.lineTo(tx, ty + s2); ctx.lineTo(tx - s2, ty); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx - s2, ty); ctx.lineTo(tx + s2, ty); ctx.stroke();
        EM.text(ctx, 'd₁ (diagonal)', tx + s2 + 6, ty + 4, { size: 11, color: '--accent' });
      }
      /* correlación HB–TS */
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 600, ymin: 0, ymax: 2200, xlabel: 'dureza Brinell HB', ylabel: 'σ_u (MPa)', ml: 50 });
      pl.frame();
      pl.fn((h) => 3.45 * h, { color: '--c1', width: 2 });
      pl.dot(Math.min(599, HB), 3.45 * HB, { color: '--accent' });
      sim.set('H', EM.fix(Hval, 0) + (p.t === 'hb' ? ' HB' : ' HV'));
      sim.set('ts', EM.fix(3.45 * HB, 0) + ' MPa' + (p.t === 'hv' ? ' (con HV ≈ 1.05 HB)' : ''));
      sim.set('cmt', p.t === 'hb' && (d < 2.4 || d > 6) ? 'fuera del rango válido de la norma (2.4–6 mm de huella)' : 'dentro del rango usual');
    });
  });

  /* ======================================================================
     8.4 Dispersión y factor de seguridad
     ====================================================================== */
  EM.defineSim('design-scatter', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('cv', { label: 'Dispersión (coeficiente de variación)', min: 0.01, max: 0.25, step: 0.005, value: 0.06, fmt: (v) => EM.fix(100 * v, 1) + ' %' });
    sim.slider('N', { label: 'Factor de seguridad <i>N</i>', min: 1, max: 4, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('F', { label: 'Carga de diseño', min: 10, max: 500, step: 5, value: 220, unit: 'kN', fmt: (v) => v.toFixed(0) });
    sim.button('Nuevas probetas', () => { seed++; sim.redraw(); });
    sim.out('mean', 'σ<sub>y</sub> medio ± s');
    sim.out('sw', 'Esfuerzo de trabajo σ<sub>y</sub>/<i>N</i>', { hl: true });
    sim.out('d', 'Diámetro mínimo de la barra');
    sim.out('pf', 'Probabilidad de que σ<sub>y</sub> < σ<sub>w</sub> (normal)');
    let seed = 1;
    const gauss = (k) => { const u = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453, v = Math.sin(k * 4.1414 + seed * 9.37) * 24634.6345; const a = u - Math.floor(u), b = v - Math.floor(v); return Math.sqrt(-2 * Math.log(Math.max(1e-12, a))) * Math.cos(2 * Math.PI * b); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const mu = 310, sd = mu * p.cv, n = 25;
      const xs = Array.from({ length: n }, (_, i) => mu + sd * gauss(i + 1));
      const m = xs.reduce((s, v) => s + v, 0) / n, s = Math.sqrt(xs.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1));
      const sw = mu / p.N;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 450, ymin: 0, ymax: 1.25, xlabel: 'límite elástico σ_y (MPa)', ylabel: 'densidad (normalizada)', yticks: [], ml: 24 });
      pl.frame();
      pl.fn((x) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)), { color: '--c1', width: 2 });
      xs.forEach((x, i) => pl.dot(x, 0.05 + (i % 5) * 0.04, { color: x < sw ? '--c2' : '--c1', r: 3.5 }));
      pl.band(0, sw, { color: '--c2', alpha: 0.08 });
      pl.vline(sw, { color: '--accent', dash: [], width: 2, label: 'σ_w = σ_y/N' });
      pl.vline(mu, { color: '--ink-3', label: 'media' });
      const z = (sw - mu) / sd, pf = 0.5 * MAT.erfc(-z / Math.SQRT2);
      sim.set('mean', EM.fix(m, 0) + ' ± ' + EM.fix(s, 0) + ' MPa');
      sim.set('sw', EM.fix(sw, 0) + ' MPa');
      sim.set('d', EM.fix(Math.sqrt((4 * p.F * 1e3) / (Math.PI * sw * 1e6)) * 1e3, 1) + ' mm');
      sim.set('pf', EM.sci(pf, 2));
    });
  });
})();
