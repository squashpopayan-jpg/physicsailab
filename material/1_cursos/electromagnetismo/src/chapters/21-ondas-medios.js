/* Capítulo 21 — Ondas en medios: reflexión y refracción */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Unidad de longitud conveniente para un eje lineal */
  const lenUnit = (x) => {
    const U = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm']];
    for (const u of U) if (x >= u[0] * 0.999) return u;
    return U[U.length - 1];
  };
  const len = (x) => (x < 1e5 ? EM.si(x, 'm', 3) : EM.sci(x, 3) + ' m');

  /* Constante de propagación en un medio lineal con conductividad σ.
     α = ω√(με/2)·√(√(1+x²) − 1), β = ω√(με/2)·√(√(1+x²) + 1), x = σ/ωε.
     √(1+x²) − 1 se evalúa como x²/(√(1+x²)+1) para evitar cancelaciones. */
  function prop(w, s, eps, mu) {
    const x = s / (w * eps), q = Math.sqrt(1 + x * x);
    const c0 = w * Math.sqrt((mu * eps) / 2);
    return { a: c0 * Math.sqrt((x * x) / (q + 1)), b: c0 * Math.sqrt(q + 1), x };
  }

  /* Coeficientes de Fresnel (medios no magnéticos). Convención: r_p = (n2 cos θi − n1 cos θt)/(n2 cos θi + n1 cos θt) */
  function fresnel(n1, n2, th) {
    const ci = Math.cos(th), st = (n1 * Math.sin(th)) / n2;
    if (st <= 1) {
      const ct = Math.sqrt(1 - st * st);
      const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
      const ts = (2 * n1 * ci) / (n1 * ci + n2 * ct), tp = (2 * n1 * ci) / (n2 * ci + n1 * ct);
      return { tir: false, tht: Math.asin(st), rs, rp, ts, tp, Rs: rs * rs, Rp: rp * rp, Ts: 1 - rs * rs, Tp: 1 - rp * rp };
    }
    /* Reflexión total: cos θt = −jκ, |r| = 1 y la onda reflejada adquiere un desfase */
    const kap = Math.sqrt(st * st - 1);
    return { tir: true, kap, Rs: 1, Rp: 1, Ts: 0, Tp: 0, ps: 2 * Math.atan2(n2 * kap, n1 * ci), pp: 2 * Math.atan2(n1 * kap, n2 * ci) };
  }
  EM.fresnel = fresnel;

  /* ======================================================================
     21.1 Medio con pérdidas: atenuación y profundidad de penetración
     ====================================================================== */
  EM.defineSim('lossy-medium', function (sim) {
    const cw = sim.canvas({ aspect: 2.5 });
    const cf = sim.canvas({ aspect: 2.5 });
    const PRE = {
      cu: { n: 'Cobre', s: 5.8e7, e: 1, m: 1 },
      al: { n: 'Aluminio', s: 3.5e7, e: 1, m: 1 },
      fe: { n: 'Hierro (µr ≈ 1000)', s: 1.0e7, e: 1, m: 1000 },
      sea: { n: 'Agua de mar', s: 4, e: 80, m: 1 },
      wet: { n: 'Suelo húmedo', s: 1e-2, e: 15, m: 1 },
      dry: { n: 'Suelo seco', s: 1e-4, e: 4, m: 1 },
      glass: { n: 'Vidrio', s: 1e-12, e: 5, m: 1 }
    };
    sim.group('Material');
    sim.select('pre', {
      options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'cu',
      onInput: (v) => { const q = PRE[v]; sim.ctl.s.set(q.s, true); sim.ctl.er.set(q.e, true); sim.ctl.mr.set(q.m, true); }
    });
    sim.slider('s', { label: 'Conductividad <i>σ</i>', min: 1e-12, max: 1e8, value: 5.8e7, log: true, step: 1e-12, fmt: (v) => EM.sci(v, 3) + ' S/m' });
    sim.slider('er', { label: 'Permitividad relativa <i>ε</i><sub>r</sub>', min: 1, max: 100, step: 0.5, value: 1, fmt: (v) => EM.fix(v, 1) });
    sim.slider('mr', { label: 'Permeabilidad relativa <i>µ</i><sub>r</sub>', min: 1, max: 10000, value: 1, log: true, step: 1, fmt: (v) => v.toFixed(0) });
    sim.group('Onda');
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 1, max: 1e11, value: 1e6, log: true, step: 1, fmt: (v) => EM.si(v, 'Hz', 3) });
    sim.check('H', { label: 'Mostrar |<i>η</i>|<i>H</i> (desfasado respecto de <i>E</i>)', value: true });
    sim.out('cls', 'Régimen', { hl: true });
    sim.out('lt', 'Tangente de pérdidas <i>σ</i>/<i>ωε</i>');
    sim.out('d', 'Profundidad de penetración <i>δ</i> = 1/<i>α</i>', { hl: true });
    sim.out('a', 'Atenuación <i>α</i>');
    sim.out('adb', 'Atenuación en decibelios 8.686<i>α</i>');
    sim.out('b', 'Constante de fase <i>β</i>');
    sim.out('lm', 'Longitud de onda en el medio 2π/<i>β</i>');
    sim.out('v', 'Velocidad de fase <i>ω</i>/<i>β</i>');
    sim.out('eta', 'Impedancia intrínseca <i>η</i> (<i>H</i> atrasado ∠<i>η</i>)');
    sim.note('Los parámetros del material se suponen independientes de la frecuencia; en materiales reales <i>ε</i><sub>r</sub> y <i>σ</i> varían con <i>f</i> (por ejemplo, el agua en microondas).');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.4; });
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f, eps = p.er * K.eps0, mu = p.mr * K.mu0;
      const { a, b, x } = prop(w, p.s, eps, mu);
      const del = 1 / a, lam = (2 * Math.PI) / b;
      const etaM = Math.sqrt((w * mu) / Math.hypot(p.s, w * eps)), etaA = 0.5 * Math.atan2(p.s, w * eps);
      /* Onda en función de la profundidad */
      const zmax = Math.min(5 * del, 3 * lam);
      const [u, un] = lenUnit(zmax / 4);
      EM.draw.clear(cw);
      const pw = new EM.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: zmax / u, ymin: -1.2, ymax: 1.2, xlabel: 'profundidad z (' + un + ')', ylabel: 'campo / E₀', title: 'Onda que penetra en el medio (z = 0 es la superficie)' });
      pw.frame();
      const env = (z) => Math.exp(-a * z * u);
      for (let k = 1; k <= 5; k++) {
        if (k * del <= zmax * 0.97) pw.vline((k * del) / u, { color: '--ink-3', dash: [2, 4], label: k === 1 ? 'δ' : k + 'δ', labelY: 14 });
      }
      pw.fn(env, { color: '--gold', width: 1.4, dash: [6, 4] });
      pw.fn((z) => -env(z), { color: '--gold', width: 1.4, dash: [6, 4] });
      if (p.H) pw.fn((z) => env(z) * Math.cos(ph - b * z * u - etaA), { color: '--bfield', width: 2, dash: [7, 4], n: 500 });
      pw.fn((z) => env(z) * Math.cos(ph - b * z * u), { color: '--efield', width: 2.6, n: 500 });
      if (del <= zmax * 1.001) pw.dot(del / u, Math.exp(-1), { color: '--gold', r: 4, label: '1/e', dy: -9 });
      const lg = [{ label: 'E', color: '--efield' }];
      if (p.H) lg.push({ label: '|η| H', color: '--bfield', dash: [7, 4] });
      lg.push({ label: '± E₀ e^{−αz}', color: '--gold', dash: [6, 4] });
      pw.legend(lg, 'tr');
      /* δ y λ en función de la frecuencia */
      const fmin = 1, fmax = 1e11, N = 220;
      const fs = [], ds = [], ls = [];
      for (let i = 0; i <= N; i++) {
        const f = Math.pow(10, (11 * i) / N), q = prop(2 * Math.PI * f, p.s, eps, mu);
        fs.push(f); ds.push(1 / q.a); ls.push((2 * Math.PI) / q.b);
      }
      let lo = Infinity, hi = 0;
      for (let i = 0; i <= N; i++) { lo = Math.min(lo, ds[i], ls[i]); hi = Math.max(hi, ds[i], ls[i]); }
      let ymin = Math.pow(10, Math.floor(Math.log10(lo))), ymax = Math.pow(10, Math.ceil(Math.log10(hi)));
      if (ymax / ymin < 100) ymax = ymin * 100;
      EM.draw.clear(cf);
      const pf = new EM.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: fmin, xmax: fmax, xlog: true, ymin, ymax, ylog: true, xlabel: 'frecuencia f (Hz)', ylabel: 'longitud (m)', title: 'Profundidad de penetración y longitud de onda en el medio', ml: 62 });
      pf.frame();
      const ft = p.s / (2 * Math.PI * eps);
      if (ft > fmin && ft < fmax) {
        pf.band(fmin, ft, { color: '--c3', alpha: 0.07 });
        pf.vline(ft, { color: '--c3', label: 'σ = ωε', labelY: 30 });
        if (pf.X(ft) - pf.ix > 120) pf.label(Math.sqrt(fmin * ft), ymin, 'buen conductor', { dy: -8, align: 'center', color: '--c3' });
      }
      pf.xy(fs, ls, { color: '--c1', width: 2.2 });
      pf.xy(fs, ds, { color: '--c2', width: 2.6 });
      pf.vline(p.f, { color: '--accent', dash: [] });
      pf.dot(p.f, del, { color: '--c2' });
      pf.dot(p.f, lam, { color: '--c1' });
      pf.legend([{ label: 'δ = 1/α', color: '--c2' }, { label: 'λ = 2π/β', color: '--c1' }], 'tr');
      /* Lecturas */
      const cls = x >= 10 ? 'Buen conductor' : x > 0.1 ? 'Cuasiconductor' : 'Buen dieléctrico';
      sim.set('cls', cls);
      sim.set('lt', EM.sci(x, 3) + (x >= 10 ? ' (σ ≫ ωε)' : x > 0.1 ? ' (σ ~ ωε)' : ' (σ ≪ ωε)'));
      sim.set('d', len(del));
      sim.set('a', EM.sci(a, 3) + ' Np/m');
      sim.set('adb', EM.sci(8.686 * a, 3) + ' dB/m');
      sim.set('b', EM.sci(b, 3) + ' rad/m');
      sim.set('lm', len(lam));
      const vp = w / b;
      sim.set('v', EM.sci(vp, 3) + ' m/s' + (vp / K.c >= 0.01 ? ' = ' + f3(vp / K.c) + 'c' : ''));
      sim.set('eta', EM.si(etaM, 'Ω', 3) + ' ∠ ' + EM.fix(deg(etaA), 1) + '°');
    });
  });

  /* ======================================================================
     21.2 Incidencia normal
     ====================================================================== */
  EM.defineSim('normal-incidence', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.group('Medios');
    sim.seg('m2', { label: 'Medio 2', options: [['d', 'Dieléctrico'], ['pec', 'Conductor perfecto']], value: 'd', onInput: () => vis() });
    sim.slider('n1', { label: 'Índice del medio 1, <i>n</i><sub>1</sub>', min: 1, max: 4, step: 0.01, value: 1, fmt: f2 });
    const s2 = sim.slider('n2', { label: 'Índice del medio 2, <i>n</i><sub>2</sub>', min: 1, max: 4, step: 0.01, value: 2, fmt: f2 });
    sim.group('Mostrar');
    sim.seg('fld', { label: 'Campo', options: [['E', '<i>E</i>'], ['H', '<i>η</i><sub>1</sub><i>H</i>']], value: 'E' });
    sim.check('parts', { label: 'Ondas incidente y reflejada por separado', value: true });
    sim.check('env', { label: 'Envolvente (amplitud en cada punto)', value: true });
    function vis() { s2.show(sim.p.m2 === 'd'); }
    vis();
    sim.out('r', 'Coeficiente de reflexión <i>r</i>', { hl: true });
    sim.out('t', 'Coeficiente de transmisión <i>t</i>');
    sim.out('R', 'Potencia reflejada <i>R</i> = <i>r</i>²');
    sim.out('T', 'Potencia transmitida <i>T</i>');
    sim.out('swr', 'Razón de onda estacionaria');
    sim.out('eta', '<i>η</i><sub>1</sub>, <i>η</i><sub>2</sub>');
    sim.out('lam', '<i>λ</i><sub>2</sub>/<i>λ</i><sub>1</sub>');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.2; });
    sim.onDraw(() => {
      const p = sim.p, pec = p.m2 === 'pec', isH = p.fld === 'H';
      const n1 = p.n1, n2 = pec ? Infinity : p.n2;
      const r = pec ? -1 : (n1 - n2) / (n1 + n2), t = pec ? 0 : 1 + r;
      const kr = pec ? 0 : n2 / n1; /* k2/k1 */
      const sr = isH ? -r : r, tt = isH ? t * kr : t; /* η1H: la reflejada cambia de signo y la transmitida escala con η1/η2 */
      const TAU = 2 * Math.PI;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -3, xmax: 2, ymin: -2.3, ymax: 2.3, xlabel: 'z / λ₁', ylabel: isH ? 'η₁H / E_{i}' : 'E / E_{i}', mt: 30 });
      const ctx = cv.ctx;
      /* Medio 2 sombreado */
      ctx.save();
      const x0 = pl.X(0), x1 = pl.ix + pl.iw;
      if (pec) {
        ctx.fillStyle = EM.alpha('--ink-3', 0.28);
        ctx.fillRect(x0, pl.iy, x1 - x0, pl.ih);
        ctx.strokeStyle = EM.alpha('--ink-3', 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let yy = pl.iy - (x1 - x0); yy < pl.iy + pl.ih; yy += 12) { ctx.moveTo(x0, yy + (x1 - x0)); ctx.lineTo(x1, yy); }
        ctx.save(); ctx.rect(x0, pl.iy, x1 - x0, pl.ih); ctx.clip(); ctx.stroke(); ctx.restore();
      } else {
        ctx.fillStyle = EM.alpha('--c3', Math.min(0.3, 0.05 + 0.06 * (n2 - 1)));
        ctx.fillRect(x0, pl.iy, x1 - x0, pl.ih);
      }
      if (n1 > 1.001) {
        ctx.fillStyle = EM.alpha('--c3', Math.min(0.3, 0.05 + 0.06 * (n1 - 1)));
        ctx.fillRect(pl.ix, pl.iy, x0 - pl.ix, pl.ih);
      }
      ctx.restore();
      pl.frame();
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-2');
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, pl.iy); ctx.lineTo(x0, pl.iy + pl.ih); ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'medio 1 · n₁ = ' + f2(n1), pl.X(-1.5), 18, { size: 12.5, align: 'center', color: '--ink-2', weight: 600 });
      EM.text(ctx, pec ? 'conductor perfecto' : 'medio 2 · n₂ = ' + f2(n2), pl.X(1), 18, { size: 12.5, align: 'center', color: '--ink-2', weight: 600 });
      /* Ondas */
      if (p.env) {
        const e1 = (z) => Math.sqrt(Math.max(0, 1 + sr * sr + 2 * sr * Math.cos(2 * TAU * z)));
        pl.fn(e1, { color: '--gold', width: 1.4, dash: [6, 4], to: 0, n: 600 });
        pl.fn((z) => -e1(z), { color: '--gold', width: 1.4, dash: [6, 4], to: 0, n: 600 });
        if (!pec) { pl.xy([0, 2], [Math.abs(tt), Math.abs(tt)], { color: '--gold', width: 1.4, dash: [6, 4] }); pl.xy([0, 2], [-Math.abs(tt), -Math.abs(tt)], { color: '--gold', width: 1.4, dash: [6, 4] }); }
        /* mínimos de la envolvente en el medio 1 */
        if (Math.abs(sr) > 0.02) {
          const z0 = sr < 0 ? 0 : -0.25;
          for (let m = 0; m < 7; m++) {
            const z = z0 - m / 2;
            if (z < -3) break;
            pl.vline(z, { color: '--ink-3', dash: [2, 3], width: 1 });
          }
          EM.text(ctx, pec && !isH ? 'nodos cada λ₁/2' : 'mínimos cada λ₁/2', pl.X(z0 - 0.5) - 4, pl.iy + pl.ih - 8, { size: 11, color: '--ink-2', halo: true, align: 'right' });
        }
      }
      if (p.parts) {
        pl.fn((z) => Math.cos(ph - TAU * z), { color: '--c1', width: 1.5, dash: [5, 3], to: 0, n: 500 });
        pl.fn((z) => sr * Math.cos(ph + TAU * z), { color: '--c2', width: 1.5, dash: [5, 3], to: 0, n: 500 });
      }
      const col = isH ? '--bfield' : '--efield';
      pl.fn((z) => Math.cos(ph - TAU * z) + sr * Math.cos(ph + TAU * z), { color: col, width: 2.8, to: 0, n: 700 });
      if (pec) pl.xy([0, 2], [0, 0], { color: col, width: 2.8 });
      else pl.fn((z) => tt * Math.cos(ph - TAU * kr * z), { color: col, width: 2.8, from: 0, n: 700 });
      /* Flechas de propagación */
      const ya = pl.iy + 12;
      const arr = (xa, xb, c, lab) => {
        EM.draw.arrow(ctx, pl.X(xa), ya, pl.X(xb), ya, { color: c, width: 2 });
        EM.text(ctx, lab, (pl.X(xa) + pl.X(xb)) / 2, ya + 16, { size: 11, align: 'center', color: c, halo: true });
      };
      arr(-2.9, -2.3, '--c1', 'incidente');
      if (Math.abs(r) > 0.005) arr(-1.1, -1.7, '--c2', 'reflejada');
      if (!pec) arr(0.7, 1.3, col, 'transmitida');
      const lg = [{ label: 'total', color: col }];
      if (p.parts) lg.push({ label: 'incidente', color: '--c1', dash: [5, 3] }, { label: 'reflejada', color: '--c2', dash: [5, 3] });
      if (p.env) lg.push({ label: 'envolvente', color: '--gold', dash: [6, 4] });
      pl.legend(lg, 'bl');
      /* Lecturas */
      const R = r * r, T = pec ? 0 : (n2 / n1) * t * t;
      sim.set('r', EM.fix(r, 3) + (r < -1e-6 ? ' (invertida)' : ''));
      sim.set('t', EM.fix(t, 3));
      sim.set('R', EM.fix(100 * R, 2) + ' %');
      sim.set('T', EM.fix(100 * T, 2) + ' %');
      sim.set('swr', pec ? '∞' : f3((1 + Math.abs(r)) / (1 - Math.abs(r))));
      sim.set('eta', EM.fix(K.eta0 / n1, 1) + ' Ω, ' + (pec ? '0 Ω' : EM.fix(K.eta0 / n2, 1) + ' Ω'));
      sim.set('lam', pec ? '—' : f3(n1 / n2));
    });
  });

  /* ======================================================================
     21.3 Ecuaciones de Fresnel
     ====================================================================== */
  EM.defineSim('fresnel', function (sim) {
    const cp = sim.canvas({ aspect: 2 });
    const cr = sim.canvas({ aspect: 2 });
    sim.group('Medios');
    sim.slider('n1', { label: 'Índice de incidencia <i>n</i><sub>1</sub>', min: 1, max: 4, step: 0.01, value: 1, fmt: f2 });
    sim.slider('n2', { label: 'Índice de transmisión <i>n</i><sub>2</sub>', min: 1, max: 4, step: 0.01, value: 1.5, fmt: f2 });
    const pre = (a, b) => () => { sim.ctl.n1.set(a, true); sim.ctl.n2.set(b); };
    sim.button('Aire → vidrio', pre(1, 1.5));
    sim.button('Vidrio → aire', pre(1.5, 1));
    sim.button('Aire → agua', pre(1, 1.33));
    sim.button('Agua → aire', pre(1.33, 1));
    sim.button('Aire → diamante', pre(1, 2.42));
    sim.group('Incidencia');
    sim.slider('th', { label: 'Ángulo de incidencia <i>θ</i><sub>i</sub>', min: 0, max: 89.5, step: 0.1, value: 40, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.seg('pol', { label: 'Luz incidente', options: [['s', 's (TE)'], ['p', 'p (TM)'], ['u', 'No polarizada']], value: 'u' });
    sim.seg('q', { label: 'Gráfica', options: [['R', 'Potencias R, T'], ['r', 'Amplitudes r, t']], value: 'R' });
    sim.button('Ir a Brewster', () => { const p = sim.p; sim.ctl.th.set(Math.min(89.5, deg(Math.atan2(p.n2, p.n1)))); }, { newRow: true });
    sim.out('tht', 'Ángulo de refracción <i>θ</i><sub>t</sub>', { hl: true });
    sim.out('thB', 'Ángulo de Brewster <i>θ</i><sub>B</sub>');
    sim.out('thc', 'Ángulo crítico <i>θ</i><sub>c</sub>');
    sim.out('Rs', '<i>R</i><sub>s</sub>, <i>T</i><sub>s</sub>');
    sim.out('Rp', '<i>R</i><sub>p</sub>, <i>T</i><sub>p</sub>');
    sim.out('R', 'Reflejado / transmitido (luz elegida)', { hl: true });
    sim.out('P', 'Grado de polarización de la luz reflejada');
    sim.out('ph', 'Desfases en la reflexión (s, p)');
    let lastQ = null;
    sim.onDraw(() => {
      const p = sim.p, n1 = p.n1, n2 = p.n2, th = rad(p.th);
      const F = fresnel(n1, n2, th);
      const thB = Math.atan2(n2, n1), thc = n1 > n2 ? Math.asin(n2 / n1) : null;
      /* ---------- Gráfica en función del ángulo ---------- */
      EM.draw.clear(cp);
      const amp = p.q === 'r';
      if (lastQ !== p.q) {
        lastQ = p.q;
        const lg = [{ color: '--c1', label: 'polarización s (TE)' }, { color: '--c2', label: 'polarización p (TM)' }, { color: '--ink-2', kind: 'dash', label: amp ? 'discontinua: <i>t</i>' : 'discontinua: <i>T</i>' }];
        lg.push(amp ? { color: '--ink-2', kind: 'dash', label: 'punteada: |<i>r</i>| = 1 en reflexión total' } : { color: '--ink-3', kind: 'dash', label: 'punteada gris: <i>R</i> de luz no polarizada' });
        sim.legend(lg);
      }
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 90, ymin: amp ? -1.05 : 0, ymax: amp ? 2.05 : 1.02, xticks: [0, 15, 30, 45, 60, 75, 90], xlabel: 'θᵢ (°)', ylabel: amp ? 'coeficiente de amplitud' : 'fracción de potencia', title: amp ? 'Coeficientes de amplitud' : 'Reflectancia y transmitancia', mr: 12 });
      pl.frame();
      if (thc !== null) {
        pl.band(deg(thc), 90, { color: '--accent', alpha: 0.08 });
        pl.vline(deg(thc), { color: '--accent', label: 'θ_{c}', labelY: amp ? 14 : 44 });
        pl.label((deg(thc) + 90) / 2, amp ? -0.8 : 0.5, 'reflexión total', { align: 'center', color: '--accent', size: 11 });
      }
      pl.vline(deg(thB), { color: '--c2', label: 'θ_{B}', labelY: amp ? 30 : 60 });
      const g = (key) => (d) => { const q = fresnel(n1, n2, rad(d)); return q.tir ? NaN : q[key]; };
      if (amp) {
        pl.hline(0, { color: '--ink-3', dash: [] , width: 1 });
        pl.fn(g('ts'), { color: '--c1', width: 2, dash: [6, 4], n: 900, to: 89.99 });
        pl.fn(g('tp'), { color: '--c2', width: 2, dash: [6, 4], n: 900, to: 89.99 });
        pl.fn(g('rs'), { color: '--c1', width: 2.6, n: 900, to: 89.99 });
        pl.fn(g('rp'), { color: '--c2', width: 2.6, n: 900, to: 89.99 });
        if (thc !== null) pl.xy([deg(thc), 90], [1, 1], { color: '--ink-2', width: 2.2, dash: [2, 3] });
        if (!F.tir) { pl.dot(p.th, F.rs, { color: '--c1' }); pl.dot(p.th, F.rp, { color: '--c2' }); }
      } else {
        const Rg = (key) => (d) => fresnel(n1, n2, rad(d))[key];
        pl.fn(Rg('Ts'), { color: '--c1', width: 2, dash: [6, 4], n: 900, to: 89.99 });
        pl.fn(Rg('Tp'), { color: '--c2', width: 2, dash: [6, 4], n: 900, to: 89.99 });
        pl.fn((d) => { const q = fresnel(n1, n2, rad(d)); return (q.Rs + q.Rp) / 2; }, { color: '--ink-3', width: 1.6, dash: [2, 3], n: 900, to: 89.99 });
        pl.fn(Rg('Rs'), { color: '--c1', width: 2.6, n: 900, to: 89.99 });
        pl.fn(Rg('Rp'), { color: '--c2', width: 2.6, n: 900, to: 89.99 });
        pl.dot(p.th, F.Rs, { color: '--c1' });
        pl.dot(p.th, F.Rp, { color: '--c2' });
      }
      pl.vline(p.th, { color: '--ink', dash: [], width: 1.2 });
      /* ---------- Diagrama de rayos ---------- */
      EM.draw.clear(cr);
      const ctx = cr.ctx, W = cr.w, H = cr.h, cx = W / 2, cy = H * 0.5, L = Math.min(W, H) * 0.44;
      ctx.save();
      ctx.fillStyle = EM.alpha('--c3', Math.min(0.3, 0.04 + 0.07 * (n1 - 1)));
      ctx.fillRect(0, 0, W, cy);
      ctx.fillStyle = EM.alpha('--c3', Math.min(0.3, 0.04 + 0.07 * (n2 - 1)));
      ctx.fillRect(0, cy, W, H - cy);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.setLineDash([5, 5]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'n₁ = ' + f2(n1), 12, 22, { size: 13, weight: 600, color: '--ink-2' });
      EM.text(ctx, 'n₂ = ' + f2(n2), 12, H - 14, { size: 13, weight: 600, color: '--ink-2' });
      const ws = p.pol === 'p' ? 0 : 1, wp = p.pol === 's' ? 0 : 1, tot = ws + wp;
      const Rsel = (ws * F.Rs + wp * F.Rp) / tot, Tsel = 1 - Rsel;
      const si = Math.sin(th), ci = Math.cos(th);
      const rays = [
        { a: [cx - L * si, cy - L * ci], b: [cx, cy], P: 1, s: ws / tot, pp: wp / tot },
        { a: [cx, cy], b: [cx + L * si, cy - L * ci], P: Rsel, s: (ws * F.Rs) / tot, pp: (wp * F.Rp) / tot }
      ];
      if (!F.tir) rays.push({ a: [cx, cy], b: [cx + L * Math.sin(F.tht), cy + L * Math.cos(F.tht)], P: Tsel, s: (ws * F.Ts) / tot, pp: (wp * F.Tp) / tot });
      else {
        /* onda evanescente: decae en profundidad 1/(k₂κ) */
        const dpx = Math.max(10, Math.min(70, 18 / F.kap));
        const gr = ctx.createLinearGradient(0, cy, 0, cy + dpx * 2.5);
        gr.addColorStop(0, EM.alpha('--accent', 0.45));
        gr.addColorStop(1, EM.alpha('--accent', 0));
        ctx.fillStyle = gr;
        ctx.fillRect(cx - L * 0.2, cy, L * 1.1, dpx * 2.5);
        EM.text(ctx, 'onda evanescente', cx + L * 0.35, cy + dpx * 1.2 + 14, { size: 11.5, align: 'center', color: '--accent', halo: true });
      }
      rays.forEach((ry) => {
        if (ry.P < 1e-4) return;
        const lw = Math.max(1, 9 * ry.P);
        ctx.save();
        ctx.strokeStyle = EM.col('--accent'); ctx.globalAlpha = 0.85; ctx.lineWidth = lw; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ry.a[0], ry.a[1]); ctx.lineTo(ry.b[0], ry.b[1]); ctx.stroke();
        ctx.restore();
        const dx = ry.b[0] - ry.a[0], dy = ry.b[1] - ry.a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
        const mx = ry.a[0] + dx * 0.55, my = ry.a[1] + dy * 0.55;
        EM.draw.arrow(ctx, mx - ux * 10, my - uy * 10, mx + ux * 8, my + uy * 8, { color: '--accent', width: Math.max(1.5, lw * 0.6), head: 9 + lw });
        /* marcas de polarización: puntos (s, E ⟂ al plano) y trazos (p, E en el plano) */
        [0.25, 0.8].forEach((fr) => {
          const px = ry.a[0] + dx * fr, py = ry.a[1] + dy * fr;
          if (ry.s > 0.01) {
            const rr = 2 + 3 * Math.sqrt(ry.s);
            ctx.save(); ctx.fillStyle = EM.col('--c1'); ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(px - ux * 9, py - uy * 9, rr, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
          }
          if (ry.pp > 0.01) {
            const hl = 6 + 9 * Math.sqrt(ry.pp), qx = px + ux * 9, qy = py + uy * 9;
            EM.draw.arrow(ctx, qx, qy, qx - uy * hl, qy + ux * hl, { color: '--c2', width: 1.8, head: 5 });
            EM.draw.arrow(ctx, qx, qy, qx + uy * hl, qy - ux * hl, { color: '--c2', width: 1.8, head: 5 });
          }
        });
      });
      /* arcos de ángulos */
      const arc = (a0, a1, r, c) => { ctx.save(); ctx.strokeStyle = EM.col(c); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore(); };
      const up = -Math.PI / 2, dn = Math.PI / 2;
      if (th > 0.01) {
        arc(up - th, up, 38, '--ink-2');
        EM.text(ctx, 'θ_{i}', cx + 50 * Math.cos(up - th / 2), cy + 50 * Math.sin(up - th / 2) + 4, { size: 12.5, align: 'center', italic: true, color: '--ink', halo: true });
        arc(up, up + th, 46, '--ink-2');
        EM.text(ctx, 'θ_{r}', cx + 58 * Math.cos(up + th / 2), cy + 58 * Math.sin(up + th / 2) + 4, { size: 12.5, align: 'center', italic: true, color: '--ink', halo: true });
        if (!F.tir && F.tht > 0.01) {
          arc(dn - F.tht, dn, 42, '--ink-2');
          EM.text(ctx, 'θ_{t}', cx + 56 * Math.cos(dn - F.tht / 2), cy + 56 * Math.sin(dn - F.tht / 2) + 4, { size: 12.5, align: 'center', italic: true, color: '--ink', halo: true });
        }
      }
      EM.text(ctx, '● E ⟂ al plano (s)', W - 10, 20, { size: 11, align: 'right', color: '--c1', halo: true });
      EM.text(ctx, '↔ E en el plano (p)', W - 10, 36, { size: 11, align: 'right', color: '--c2', halo: true });
      if (Math.abs(th - thB) < rad(0.4) && !F.tir) EM.text(ctx, 'ángulo de Brewster: la luz reflejada sólo tiene polarización s', W / 2, H - 14, { size: 11, align: 'center', color: '--c2', halo: true });
      /* ---------- Lecturas ---------- */
      sim.set('tht', F.tir ? 'no existe (reflexión total)' : EM.fix(deg(F.tht), 2) + '°');
      sim.set('thB', EM.fix(deg(thB), 2) + '°');
      sim.set('thc', thc === null ? 'no existe (n₁ ≤ n₂)' : EM.fix(deg(thc), 2) + '°');
      sim.set('Rs', f3(F.Rs) + ', ' + f3(F.Ts));
      sim.set('Rp', f3(F.Rp) + ', ' + f3(F.Tp));
      sim.set('R', EM.fix(100 * Rsel, 2) + ' % / ' + EM.fix(100 * Tsel, 2) + ' %');
      const Pd = F.Rs + F.Rp > 0 ? Math.abs(F.Rs - F.Rp) / (F.Rs + F.Rp) : 0;
      sim.set('P', p.pol === 'u' ? EM.fix(100 * Pd, 1) + ' %' + (Pd > 0.995 ? ' (totalmente polarizada s)' : '') : 'la incidente ya está polarizada');
      if (F.tir) sim.set('ph', EM.fix(deg(F.ps), 1) + '°, ' + EM.fix(deg(F.pp), 1) + '°  (relativo: ' + EM.fix(deg(F.pp - F.ps), 1) + '°)');
      else sim.set('ph', (F.rs < 0 ? '180°' : '0°') + ', ' + (F.rp < 0 ? '180°' : '0°'));
    });
  });

  /* ======================================================================
     21.4 FDTD: refracción de un haz y reflexión total
     ====================================================================== */
  EM.defineSim('fdtd-refraction', function (sim) {
    const NX = 270, NY = 220, PML = 20;
    const cv = sim.canvas({ aspect: NX / NY });
    sim.group('Medios y haz');
    sim.slider('n1', { label: '<i>n</i><sub>1</sub> (arriba)', min: 1, max: 2.5, step: 0.05, value: 1, fmt: f2, onInput: () => build() });
    sim.slider('n2', { label: '<i>n</i><sub>2</sub> (abajo)', min: 1, max: 2.5, step: 0.05, value: 1.5, fmt: f2, onInput: () => build() });
    sim.slider('th', { label: 'Ángulo de incidencia <i>θ</i><sub>i</sub>', min: 0, max: 70, step: 1, value: 35, unit: '°', fmt: (v) => v.toFixed(0), onInput: () => build() });
    sim.slider('lam', { label: 'Longitud de onda en el vacío (celdas)', min: 12, max: 28, step: 1, value: 16, fmt: (v) => v.toFixed(0), onInput: () => build() });
    sim.button('Aire → vidrio', () => { sim.ctl.n1.set(1, true); sim.ctl.n2.set(1.5, true); sim.ctl.th.set(35, true); build(); warm(); sim.redraw(); }, { newRow: true });
    sim.button('Vidrio → aire, 30°', () => { sim.ctl.n1.set(1.5, true); sim.ctl.n2.set(1, true); sim.ctl.th.set(30, true); build(); warm(); sim.redraw(); });
    sim.button('Vidrio → aire, 55° (RTI)', () => { sim.ctl.n1.set(1.5, true); sim.ctl.n2.set(1, true); sim.ctl.th.set(55, true); build(); warm(); sim.redraw(); });
    sim.group('Visualización');
    sim.slider('spf', { label: 'Pasos de tiempo por cuadro', min: 1, max: 8, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.check('rays', { label: 'Rayos de la óptica geométrica (Snell)', value: true });
    sim.check('energy', { label: 'Mostrar intensidad media (E²)', value: false });
    sim.button('Reiniciar', () => build());
    sim.out('tht', 'Ángulo de refracción (Snell)', { hl: true });
    sim.out('thc', 'Ángulo crítico');
    sim.out('Rs', 'Reflectancia <i>R</i><sub>s</sub> (Fresnel)');
    sim.out('lams', '<i>λ</i><sub>1</sub>, <i>λ</i><sub>2</sub> (celdas)');
    sim.note('Se resuelven las ecuaciones de Maxwell en una malla de Yee. <i>E<sub>z</sub></i> es perpendicular a la pantalla, es decir, al plano de incidencia: polarización <b>s</b> (TE). La fuente es un par de líneas desfasadas λ/4 que emite un haz gaussiano en un solo sentido.');
    let F = null, avg = null, srcA = [], srcB = [], jI = 0, hit = [0, 0], geo = null;
    function build() {
      const p = sim.p, th = rad(p.th);
      F = new EM.FDTD2D(NX, NY, { pml: PML });
      jI = Math.round(NY * 0.45);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) F.eps[j * NX + i] = j < jI ? p.n2 * p.n2 : p.n1 * p.n1;
      F.build();
      const lam1 = p.lam / p.n1, w0 = 1.5 * lam1, half = 2 * w0;
      const kx = Math.sin(th), ky = -Math.cos(th); /* dirección de propagación (y hacia arriba) */
      const px = Math.cos(th), py = Math.sin(th); /* dirección transversal */
      let Ls = Math.max(3.5 * lam1, (half * Math.sin(th) + 6) / Math.cos(th));
      const i0 = Math.max(NX * 0.42, PML + 6 + Ls * Math.sin(th) + half * Math.cos(th));
      hit = [i0, jI];
      const c0 = [i0 - Ls * kx, jI - Ls * ky];
      srcA = []; srcB = [];
      const dep = (list, x, y, a) => {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
        [[i, j, (1 - fx) * (1 - fy)], [i + 1, j, fx * (1 - fy)], [i, j + 1, (1 - fx) * fy], [i + 1, j + 1, fx * fy]].forEach(([ii, jj, wgt]) => {
          if (ii > 0 && jj > 0 && ii < NX && jj < NY && wgt > 1e-4) list.push([jj * NX + ii, a * wgt]);
        });
      };
      for (let u = -half; u <= half; u += 0.7) {
        const g = Math.exp(-(u * u) / (w0 * w0)) * 0.7;
        dep(srcA, c0[0] + u * px, c0[1] + u * py, g);
        dep(srcB, c0[0] + u * px + (lam1 / 4) * kx, c0[1] + u * py + (lam1 / 4) * ky, g);
      }
      geo = { th, c0 };
      avg = new Float32Array(NX * NY);
    }
    build();
    function advance(n, avgRate) {
      const w = (2 * Math.PI) / sim.p.lam;
      for (let s = 0; s < n; s++) {
        const t = F.t, ramp = Math.min(1, t / (3 * sim.p.lam));
        const sa = 0.1 * Math.sin(w * t) * ramp, sb = 0.1 * Math.sin(w * t - Math.PI / 2) * ramp;
        for (const [k, a] of srcA) F.Ez[k] += a * sa;
        for (const [k, a] of srcB) F.Ez[k] += a * sb;
        F.step();
        if (avgRate) for (let k = 0; k < avg.length; k++) avg[k] += avgRate * (F.Ez[k] * F.Ez[k] - avg[k]);
      }
    }
    /* Precalentamiento: la figura muestra el haz ya formado */
    function warm() { advance(200, 0); advance(160, 0.02); }
    warm();
    sim.animate(() => advance(sim.p.spf, 0.01));
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      /* Franjas fuera de la malla con el mismo tono de cada medio */
      const ctx = cv.ctx;
      const s0 = Math.min(cv.w / NX, cv.h / NY), yI = (cv.h - NY * s0) / 2 + (NY - jI) * s0;
      if (p.energy) { ctx.fillStyle = EM.rgbStr(EM.cmap.inferno(0)); ctx.fillRect(0, 0, cv.w, cv.h); }
      else {
        const tint = (n, y0, y1) => { const e = n * n; if (e > 1.001) { ctx.fillStyle = EM.alpha('--c3', Math.min(0.32, 0.08 + 0.06 * (e - 1))); ctx.fillRect(0, y0, cv.w, y1 - y0); } };
        tint(p.n1, 0, yI);
        tint(p.n2, yI, cv.h);
      }
      let g;
      if (p.energy) { const save = F.Ez; F.Ez = avg; g = F.render(cv, { energy: true, scale: 40 }); F.Ez = save; }
      else g = F.render(cv, { scale: 3.2 });
      const X = (i) => g.ox + (i + 0.5) * g.s, Y = (j) => g.oy + (NY - 1 - j + 0.5) * g.s;
      /* frontera y normal */
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(PML), Y(jI - 0.5)); ctx.lineTo(X(NX - PML), Y(jI - 0.5)); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(hit[0]), Y(NY - PML)); ctx.lineTo(X(hit[0]), Y(PML)); ctx.stroke();
      /* zona absorbente */
      ctx.setLineDash([2, 4]);
      ctx.strokeRect(X(PML), Y(NY - PML), X(NX - PML) - X(PML), Y(PML) - Y(NY - PML));
      ctx.restore();
      const th = geo.th, Fr = fresnel(p.n1, p.n2, th);
      if (p.rays) {
        const L = 200;
        const ray = (dx, dy, c, dash) => { ctx.save(); ctx.strokeStyle = EM.col(c); ctx.lineWidth = 2; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(X(hit[0]), Y(jI - 0.5)); ctx.lineTo(X(hit[0] + dx * L), Y(jI - 0.5 + dy * L)); ctx.stroke(); ctx.restore(); };
        ctx.save();
        ctx.beginPath(); ctx.rect(X(PML), Y(NY - PML), X(NX - PML) - X(PML), Y(PML) - Y(NY - PML)); ctx.clip();
        ray(-Math.sin(th), Math.cos(th), '--ink', [7, 5]);
        ray(Math.sin(th), Math.cos(th), '--ink', [7, 5]);
        if (!Fr.tir) ray(Math.sin(Fr.tht), -Math.cos(Fr.tht), '--ink', [7, 5]);
        ctx.restore();
      }
      EM.text(ctx, 'n₁ = ' + f2(p.n1), X(PML) + 6, Y(NY - PML) + 18, { size: 12.5, weight: 600, color: '--ink', halo: true });
      EM.text(ctx, 'n₂ = ' + f2(p.n2), X(PML) + 6, Y(jI) + 20, { size: 12.5, weight: 600, color: '--ink', halo: true });
      sim.set('tht', Fr.tir ? 'no hay: reflexión total interna' : EM.fix(deg(Fr.tht), 1) + '°');
      sim.set('thc', p.n1 > p.n2 ? EM.fix(deg(Math.asin(p.n2 / p.n1)), 1) + '°' : 'no existe (n₁ ≤ n₂)');
      sim.set('Rs', EM.fix(100 * Fr.Rs, 1) + ' %');
      sim.set('lams', EM.fix(p.lam / p.n1, 1) + ', ' + EM.fix(p.lam / p.n2, 1));
    });
  });
})();
