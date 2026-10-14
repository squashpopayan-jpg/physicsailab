/* Capítulo 23 — Propiedades magnéticas */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const mu0 = 4 * Math.PI * 1e-7, muB = 9.2740100783e-24;

  /* ======================================================================
     23.1 Curie–Weiss
     ====================================================================== */
  const FM = { Fe: ['Hierro', 1043, 2.22], Co: ['Cobalto', 1388, 1.72], Ni: ['Níquel', 627, 0.6], Gd: ['Gadolinio', 292, 7.63] };
  EM.defineSim('curie-weiss', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.entries(FM).map(([k, v]) => [k, v[0] + ' (T_c = ' + v[1] + ' K)']), value: 'Ni' });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 1600, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.seg('J', { label: 'Espín en el modelo', options: [['0.5', 'J = ½'], ['1', 'J = 1'], ['3.5', 'J = 7/2']], value: '0.5' });
    sim.out('m', 'Magnetización espontánea <i>M</i>/<i>M</i><sub>0</sub>', { hl: true });
    sim.out('chi', '1/χ relativo sobre <i>T<sub>c</sub></i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, Tc] = FM[p.m], J = +p.J;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 1.5, ymin: 0, ymax: 1.1, xlabel: 'T/T_c', ylabel: 'M_s/M_0', ml: 46 });
      pl.frame();
      for (const Jj of ['0.5', '1', '3.5']) pl.fn((t) => (t < 1 ? MAT.meanFieldM(t, 1, +Jj) : 0), { color: Jj === p.J ? '--accent' : '--grid-2', width: Jj === p.J ? 2.6 : 1.2, n: 200 });
      /* datos experimentales del níquel (Weiss y Forrer, aproximados) para comparar */
      pl.dot(p.T / Tc, MAT.meanFieldM(p.T / Tc, 1, J), { color: '--accent', r: 6 });
      pl.vline(1, { color: '--ink-3', label: 'T_c' });
      const pc = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 2.5, ymin: 0, ymax: 1.6, xlabel: 'T/T_c', ylabel: '1/χ (relativo)', ml: 44 });
      pc.frame();
      pc.fn((t) => (t > 1 ? t - 1 : NaN), { color: '--c1', width: 2.2 });
      pc.fn((t) => (t < 1 ? 2 * (1 - t) : NaN), { color: '--c1', width: 1.4, dash: [4, 3] });
      pc.vline(1, { color: '--ink-3' });
      const t = p.T / Tc, m = MAT.meanFieldM(t, 1, J);
      sim.set('m', EM.fix(m, 4) + (t >= 1 ? ' (paramagnético)' : ''));
      sim.set('chi', t > 1 ? EM.fix(t - 1, 3) + ' (Curie–Weiss: χ ∝ 1/(T − T_c))' : '— (ordenado)');
    });
  });

  /* ======================================================================
     23.2 Momentos y M_s
     ====================================================================== */
  const MS = {
    Fe: ['Hierro (BCC)', 2.22, 2, 0.2866e-9, 'metal'], Co: ['Cobalto', 1.72, 0, 0, 'metal'], Ni: ['Níquel (FCC)', 0.6, 4, 0.3524e-9, 'metal'],
    Fe3O4: ['Magnetita Fe₃O₄', 4, 8, 0.839e-9, 'ferrita'], NiFe2O4: ['Ferrita de níquel NiFe₂O₄', 2, 8, 0.8339e-9, 'ferrita'], MnFe2O4: ['Ferrita de manganeso MnFe₂O₄', 5, 8, 0.8511e-9, 'ferrita'], CoFe2O4: ['Ferrita de cobalto CoFe₂O₄', 3, 8, 0.838e-9, 'ferrita']
  };
  EM.defineSim('magnetic-moment', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.select('m', { label: 'Material', options: Object.entries(MS).filter(([k]) => k !== 'Co').map(([k, v]) => [k, v[0]]), value: 'Fe3O4' });
    sim.out('mu', 'Momento neto por átomo o unidad fórmula', { hl: true });
    sim.out('n', 'Unidades por celda / celda');
    sim.out('Ms', 'Magnetización de saturación <i>M<sub>s</sub></i>');
    sim.out('Bs', '<i>B<sub>s</sub></i> = μ<sub>0</sub><i>M<sub>s</sub></i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [name, mu, n, a, kind] = MS[p.m];
      const Ms = (n * mu * muB) / Math.pow(a, 3);
      /* esquema de momentos */
      if (kind === 'ferrita') {
        const div = p.m.replace('Fe2O4', '').replace('Fe3O4', 'Fe');
        const rows = [['tetraédricos: Fe³⁺', -5, '--c1'], ['octaédricos: Fe³⁺', 5, '--c2'], ['octaédricos: ' + (p.m === 'Fe3O4' ? 'Fe²⁺' : div + '²⁺'), mu, '--c3']];
        rows.forEach(([t, m, c], i) => {
          const y = 34 + i * ((H - 60) / 3), x = W * 0.42;
          EM.text(ctx, t, 16, y + 4, { size: 12, color: c });
          EM.draw.arrow(ctx, x, y, x + m * 14, y, { color: c, width: 3 });
          EM.text(ctx, (m > 0 ? '+' : '−') + Math.abs(m) + ' μ_B', x + m * 14 + (m > 0 ? 8 : -50), y + 4, { size: 12, mono: true, color: c });
        });
        EM.text(ctx, 'neto por unidad fórmula: ' + mu + ' μ_B (los Fe³⁺ se cancelan)', 16, H - 8, { size: 12, color: '--accent', weight: 600 });
      } else {
        for (let i = 0; i < 12; i++) EM.draw.arrow(ctx, 30 + i * ((W - 60) / 11), H * 0.6, 30 + i * ((W - 60) / 11), H * 0.6 - 30 - 20 * mu, { color: '--accent', width: 2.4 });
        EM.text(ctx, 'momentos paralelos: ' + mu + ' μ_B por átomo', 16, H - 8, { size: 12, color: '--accent' });
      }
      sim.set('mu', mu + ' μ<sub>B</sub>');
      sim.set('n', n + ' · a = ' + EM.fix(a * 1e9, 4) + ' nm');
      sim.set('Ms', EM.sci(Ms, 3) + ' A/m');
      sim.set('Bs', EM.fix(mu0 * Ms, 3) + ' T');
      void name;
    });
  });

  /* ======================================================================
     23.3 Histéresis de Jiles–Atherton
     ====================================================================== */
  const JA = {
    steel: ['Acero (parámetros de Jiles y Atherton, 1986)', { Ms: 1.48e6, a: 470, alpha: 9.38e-4, k: 483, cr: 0.0889 }, 5000],
    soft: ['Blando tipo permalloy', { Ms: 8.0e5, a: 20, alpha: 2e-5, k: 4, cr: 0.3 }, 200],
    sife: ['Acero al silicio', { Ms: 1.6e6, a: 60, alpha: 4e-5, k: 30, cr: 0.2 }, 600],
    hard: ['Duro tipo ferrita', { Ms: 3.8e5, a: 6.0e4, alpha: 0.1, k: 2.2e5, cr: 0.05 }, 8e5]
  };
  EM.defineSim('hysteresis', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('m', { label: 'Material', options: Object.entries(JA).map(([k, v]) => [k, v[0]]), value: 'steel' });
    sim.slider('k', { label: 'Anclaje de paredes <i>k</i> (× valor base)', min: 0.2, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('Hm', { label: 'Amplitud del campo (× valor base)', min: 0.2, max: 3, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('Hc', 'Coercitividad <i>H<sub>c</sub></i>', { hl: true });
    sim.out('Br', 'Remanencia <i>B<sub>r</sub></i>');
    sim.out('loss', 'Energía disipada por ciclo (área)');
    sim.out('bh', '(<i>BH</i>)<sub>máx</sub> en el segundo cuadrante');
    let key = '', loop = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, base, Hb] = JA[p.m];
      const prm = Object.assign({}, base, { k: base.k * p.k });
      const Hm = Hb * p.Hm;
      const k2 = p.m + p.k + p.Hm;
      if (k2 !== key) {
        const path = [];
        const N = 600;
        for (let i = 0; i <= N; i++) path.push((Hm * i) / N);
        for (let c = 0; c < 2; c++) { for (let i = N; i >= -N; i--) path.push((Hm * i) / N); for (let i = -N; i <= N; i++) path.push((Hm * i) / N); }
        const res = MAT.jilesAtherton(path, prm);
        loop = res.slice(N + 1 + 2 * N + 1).map(([H, Mm]) => [H, mu0 * (H + Mm)]);
        key = k2;
      }
      const Bm = Math.max(...loop.map((q) => Math.abs(q[1]))) * 1.1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -Hm, xmax: Hm, ymin: -Bm, ymax: Bm, xlabel: 'H (A/m)', ylabel: 'B (T)', ml: 54 });
      pl.frame();
      pl.xy(loop.map((q) => q[0]), loop.map((q) => q[1]), { color: '--accent', width: 2.4 });
      /* Hc y Br */
      let Hc = NaN, Br = NaN;
      for (let i = 1; i < loop.length; i++) {
        const [H0, B0] = loop[i - 1], [H1, B1] = loop[i];
        if (H1 < H0 && B0 > 0 && B1 <= 0) Hc = H0 + ((H1 - H0) * B0) / (B0 - B1);
        if (H1 < H0 && H0 >= 0 && H1 < 0) Br = B0 + ((B1 - B0) * H0) / (H0 - H1);
      }
      let area = 0;
      for (let i = 1; i < loop.length; i++) area += 0.5 * (loop[i][1] + loop[i - 1][1]) * (loop[i][0] - loop[i - 1][0]);
      let bh = 0;
      for (const [H, B] of loop) if (H < 0 && B > 0) bh = Math.max(bh, -H * B);
      if (isFinite(Hc)) pl.dot(Hc, 0, { color: '--c1', label: '−H_c', dy: 14 });
      if (isFinite(Br)) pl.dot(0, Br, { color: '--c2', label: 'B_r' });
      sim.set('Hc', isFinite(Hc) ? EM.si(Math.abs(Hc), 'A/m') : '—');
      sim.set('Br', isFinite(Br) ? EM.fix(Br, 3) + ' T' : '—');
      sim.set('loss', EM.si(Math.abs(area), 'J/m³') + ' por ciclo (a 50 Hz: ' + EM.si(Math.abs(area) * 50, 'W/m³') + ')');
      sim.set('bh', EM.si(bh, 'J/m³'));
    });
    sim.note('Integración del modelo de Jiles–Atherton (Mₛ, a, α, k, c). Los parámetros «blando» y «duro» son ilustrativos; los del acero son los del artículo original de 1986.');
  });

  /* ======================================================================
     23.4 Stoner–Wohlfarth
     ====================================================================== */
  EM.defineSim('stoner-wohlfarth', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('psi', { label: 'Ángulo campo–eje fácil ψ', min: 0, max: 90, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('auto', { label: 'Barrer el campo', value: true });
    sim.slider('h', { label: 'Campo reducido <i>h</i> = <i>H</i>/<i>H<sub>K</sub></i>', min: -1.6, max: 1.6, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('hsw', 'Campo de conmutación <i>h<sub>sw</sub></i>(ψ)', { hl: true });
    sim.out('m', 'Magnetización a lo largo del campo');
    let th = 0, ph = 0, hcur = 1.6, trail = [];
    sim.onChange = (id) => { if (id === 'psi') { trail = []; th = 0; } };
    const e = (t, h, psi) => 0.5 * Math.sin(t) ** 2 - h * Math.cos(t - psi);
    const relax = (h, psi) => { for (let k = 0; k < 400; k++) { const g = 0.5 * Math.sin(2 * th) + h * Math.sin(th - psi); th -= 0.05 * g; } };
    sim.animate((dt) => {
      const psi = M.rad(sim.p.psi);
      if (sim.p.auto) { ph += dt * 0.6; hcur = 1.6 * Math.cos(ph); } else hcur = sim.p.h;
      relax(hcur, psi);
      trail.push([hcur, Math.cos(th - psi)]); if (trail.length > 500) trail.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const psi = M.rad(p.psi);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: -Math.PI, xmax: Math.PI, ymin: -2.2, ymax: 2.2, xpi: true, xlabel: 'θ (dirección de M)', ylabel: 'E/2KV', ml: 44 });
      pl.frame();
      pl.fn((t) => e(t, hcur, psi), { color: '--accent', width: 2.4 });
      const tt = Math.atan2(Math.sin(th), Math.cos(th));
      pl.dot(tt, e(tt, hcur, psi), { color: '--c2', r: 7 });
      const pr = new EM.Plot(ctx, { x: W * 0.47, y: 0, w: W * 0.53, h: H, xmin: -1.7, xmax: 1.7, ymin: -1.15, ymax: 1.15, xlabel: 'h', ylabel: 'M·Ĥ/M_s', ml: 44 });
      pr.frame();
      if (trail.length > 1) pr.xy(trail.map((q) => q[0]), trail.map((q) => q[1]), { color: '--c1', width: 2 });
      const hs = MAT.stonerSwitch(p.psi);
      pr.vline(hs, { color: '--ink-3', label: 'h_sw' }); pr.vline(-hs, { color: '--ink-3' });
      pr.dot(hcur, Math.cos(th - psi), { color: '--c2' });
      sim.set('hsw', EM.fix(hs, 4));
      sim.set('m', EM.fix(Math.cos(th - psi), 3));
    });
  });
})();
