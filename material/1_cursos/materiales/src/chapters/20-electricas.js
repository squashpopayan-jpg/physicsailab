/* Capítulo 20 — Conducción eléctrica */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     20.1 Bandas y Fermi–Dirac
     ====================================================================== */
  EM.defineSim('band-filling', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('kind', { label: 'Material', options: [['metal', 'Metal'], ['semi', 'Semiconductor'], ['ins', 'Aislante']], value: 'semi' });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 1500, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('Eg', { label: 'Brecha <i>E<sub>g</sub></i>', min: 0.1, max: 6, step: 0.01, value: 1.12, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.out('kT', '<i>k<sub>B</sub>T</i>');
    sim.out('occ', 'Ocupación del fondo de la banda de conducción', { hl: true });
    sim.out('n', 'Electrones de conducción estimados (N<sub>c</sub> f)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const kT = MAT.kBeV * p.T;
      const Eg = p.kind === 'metal' ? 0 : p.kind === 'ins' ? Math.max(3.5, p.Eg) : p.Eg;
      /* densidad de estados: parabólica en las bandas */
      const Ev = 0, Ec = Eg, EF = p.kind === 'metal' ? 0.0 : Eg / 2;
      const Emin = EF - 1.5 - Eg / 2, Emax = EF + 1.5 + Eg / 2;
      const g = (E) => (p.kind === 'metal' ? (E < 1.2 && E > -3 ? Math.sqrt(Math.max(0, E + 3)) : 0) : E <= Ev ? Math.sqrt(Ev - E) : E >= Ec ? Math.sqrt(E - Ec) : 0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 2.2, ymin: Emin, ymax: Emax, xlabel: 'densidad de estados (u. a.)', ylabel: 'energía (eV)', ml: 50 });
      pl.frame();
      const Es = M.linspace(Emin, Emax, 500);
      /* estados disponibles */
      ctx.fillStyle = EM.alpha('--c6', 0.2);
      for (const E of Es) { const x = g(E); if (x > 0) ctx.fillRect(pl.X(0), pl.Y(E) - 1, pl.X(x) - pl.X(0), 2); }
      /* ocupados */
      const exag = p.kind === 'metal' ? 1 : 1;
      ctx.fillStyle = EM.alpha('--c1', 0.75);
      for (const E of Es) { const x = g(E) * MAT.fermi(E, EF, p.T) * exag; if (x > 0) ctx.fillRect(pl.X(0), pl.Y(E) - 1, Math.max(1, pl.X(x) - pl.X(0)), 2); }
      pl.hline(EF, { color: '--accent', label: 'E_F', dash: [5, 3] });
      if (p.kind !== 'metal') { pl.band(0, 0, {}); pl.label(1.4, Eg / 2 + 0.1, 'brecha ' + EM.fix(Eg, 2) + ' eV', { size: 11, color: '--ink-3' }); pl.label(1.3, Ec + 0.6, 'banda de conducción', { size: 11 }); pl.label(1.3, Ev - 0.6, 'banda de valencia', { size: 11 }); }
      /* f(E) */
      const pf = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 1.05, ymin: Emin, ymax: Emax, xlabel: 'f(E)', ylabel: '', ml: 20 });
      pf.frame();
      pf.xy(Es.map((E) => MAT.fermi(E, EF, p.T)), Es, { color: '--accent', width: 2.4 });
      pf.xy(Es.map((E) => MAT.fermi(E, EF, 1)), Es, { color: '--grid-2', width: 1.2, dash: [4, 3] });
      pf.hline(EF, { color: '--accent', dash: [5, 3] });
      const occ = MAT.fermi(Ec, EF, p.T);
      const Nc = 2.86e25 * Math.pow(p.T / 300, 1.5);
      sim.set('kT', EM.fix(kT * 1000, 1) + ' meV');
      sim.set('occ', p.kind === 'metal' ? '— (banda parcialmente llena)' : EM.sci(occ, 2));
      sim.set('n', p.kind === 'metal' ? '≈ 10²⁸–10²⁹ m⁻³ (un electrón por átomo)' : EM.sci(Nc * occ, 2) + ' m⁻³');
    });
  });

  /* ======================================================================
     20.2 Matthiessen
     ====================================================================== */
  EM.defineSim('matthiessen', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('x', { label: 'Níquel disuelto', min: 0, max: 5, step: 0.01, value: 1.12, unit: '% at.', fmt: (v) => EM.fix(v, 2) });
    sim.slider('rd', { label: 'Aporte por deformación ρ<sub>d</sub>', min: 0, max: 1.5, step: 0.05, value: 0, unit: '×10⁻⁸ Ω·m', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 4, max: 400, step: 1, value: 293, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Resistividad total', { hl: true });
    sim.out('parts', 'ρ<sub>t</sub> + ρ<sub>i</sub> + ρ<sub>d</sub>');
    sim.out('rrr', 'Relación de resistividad residual ρ(293)/ρ(4 K)');
    sim.note('ρ_t: Bloch–Grüneisen con Θ = 343 K y ρ(293 K) = 1.68×10⁻⁸ Ω·m; ρ_i = A x(1 − x) con A = 1.2×10⁻⁶ Ω·m ajustado a los datos diluidos de Callister (fig. 18.8).');
    const bg293 = MAT.blochGruneisen(293, 343);
    const rt = (T) => (1.68 * MAT.blochGruneisen(T, 343)) / bg293; // ×10⁻⁸
    const cache = new Map();
    const rtc = (T) => { const k = Math.round(T); if (!cache.has(k)) cache.set(k, rt(k)); return cache.get(k); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const ri = (x) => (MAT.nordheim(1.2e-6, x / 100) / 1e-8);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 400, ymin: 0, ymax: 9, xlabel: 'temperatura (K)', ylabel: 'ρ (10⁻⁸ Ω·m)', ml: 50 });
      pl.frame();
      pl.fn((T) => rtc(Math.max(4, T)), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      for (const x of [1.12, 2.16, 3.32]) pl.fn((T) => rtc(Math.max(4, T)) + ri(x), { color: '--grid-2', width: 1.2 });
      pl.fn((T) => rtc(Math.max(4, T)) + ri(p.x) + p.rd, { color: '--accent', width: 2.6 });
      pl.dot(p.T, rtc(p.T) + ri(p.x) + p.rd, { color: '--accent' });
      pl.label(380, rtc(380), 'Cu puro', { size: 10.5, color: '--ink-3', align: 'right', dy: 14 });
      pl.label(20, 8.4, 'curvas grises: Cu + 1.12, 2.16 y 3.32 % at. Ni', { size: 10.5, color: '--ink-3' });
      const tot = rtc(p.T) + ri(p.x) + p.rd, r4 = rtc(4) + ri(p.x) + p.rd;
      sim.set('r', EM.fix(tot, 3) + ' ×10⁻⁸ Ω·m');
      sim.set('parts', EM.fix(rtc(p.T), 3) + ' + ' + EM.fix(ri(p.x), 3) + ' + ' + EM.fix(p.rd, 2));
      sim.set('rrr', EM.fix((rtc(293) + ri(p.x) + p.rd) / r4, 1));
    });
  });

  /* ======================================================================
     20.3 Portadores en Si contra T
     ====================================================================== */
  EM.defineSim('si-carriers', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Nd', { label: 'Donadores <i>N<sub>d</sub></i>', min: 1e19, max: 1e24, step: 1e19, value: 1e21, unit: 'm⁻³', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.slider('T', { label: 'Temperatura destacada', min: 20, max: 900, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.seg('m', { label: 'Semiconductor', options: [['Si', 'Si'], ['Ge', 'Ge'], ['GaAs', 'GaAs']], value: 'Si' });
    sim.out('n', '<i>n</i> a esa temperatura', { hl: true });
    sim.out('ni', '<i>n<sub>i</sub></i>');
    sim.out('ion', 'Fracción de donadores ionizados');
    sim.out('EF', '<i>E<sub>F</sub></i> − <i>E<sub>c</sub></i>');
    let key = '', curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const m = MAT.semi[p.m];
      const k = p.m + p.Nd;
      if (k !== key) {
        const Ts = M.linspace(1000 / 900, 1000 / 20, 140).map((x) => 1000 / x);
        curve = Ts.map((T) => [T, MAT.nType(m, T, p.Nd).n, MAT.ni(m, T)]);
        key = k;
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 50, ymin: 1e14, ymax: 1e25, xlog: false, ylog: true, xlabel: '1000/T (K⁻¹)', ylabel: 'n (m⁻³)', ml: 58 });
      pl.frame();
      pl.xy(curve.map((q) => 1000 / q[0]), curve.map((q) => Math.max(1e14, q[1])), { color: '--accent', width: 2.6 });
      pl.xy(curve.map((q) => 1000 / q[0]), curve.map((q) => Math.max(1e14, q[2])), { color: '--c1', width: 1.4, dash: [5, 4] });
      pl.hline(p.Nd, { color: '--ink-3', label: 'N_d', labelRight: true });
      for (const Tc of [600, 300, 150, 77, 40]) pl.label(1000 / Tc, 5e24, Tc + ' K', { size: 10, align: 'center', color: '--ink-3' });
      const r = MAT.nType(m, p.T, p.Nd);
      pl.dot(1000 / p.T, Math.max(1e14, r.n), { color: '--accent' });
      pl.legend([{ label: 'n (neutralidad de carga)', color: '--accent' }, { label: 'n_i intrínseca', color: '--c1', dash: [5, 4] }], 'bl');
      const kT = MAT.kBeV * p.T, Ed = 0.045;
      const ion = 1 / (1 + 2 * Math.exp((r.EF - (r.Eg - Ed)) / kT));
      sim.set('n', EM.sci(r.n, 3) + ' m⁻³');
      sim.set('ni', EM.sci(MAT.ni(m, p.T), 3) + ' m⁻³');
      sim.set('ion', EM.fix(100 * ion, 1) + ' %');
      sim.set('EF', EM.fix((r.EF - r.Eg) * 1000, 0) + ' meV');
    });
  });

  /* ======================================================================
     20.4 Unión p-n
     ====================================================================== */
  EM.defineSim('pn-junction', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Na', { label: 'Aceptores <i>N<sub>a</sub></i>', min: 1e20, max: 1e25, step: 1e20, value: 1e22, unit: 'm⁻³', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.slider('Nd', { label: 'Donadores <i>N<sub>d</sub></i>', min: 1e20, max: 1e25, step: 1e20, value: 1e22, unit: 'm⁻³', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.slider('V', { label: 'Voltaje aplicado <i>V</i>', min: -5, max: 0.7, step: 0.01, value: 0, unit: 'V', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('Vbi', 'Potencial de contacto <i>V<sub>bi</sub></i>', { hl: true });
    sim.out('W', 'Ancho de agotamiento <i>W</i>');
    sim.out('I', 'Corriente (Shockley, <i>I<sub>s</sub></i> ∝ <i>n<sub>i</sub></i>²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Si = MAT.semi.Si, ni = MAT.ni(Si, p.T), kT = MAT.kBeV * p.T;
      const Vbi = kT * Math.log((p.Na * p.Nd) / (ni * ni));
      const Vj = Math.min(p.V, Vbi - 0.02);
      const Wd = Math.sqrt(((2 * 11.7 * 8.8541878128e-12 * (Vbi - Vj)) / MAT.eV) * (1 / p.Na + 1 / p.Nd));
      const xp = (Wd * p.Nd) / (p.Na + p.Nd), xn = Wd - xp;
      /* esquema de la unión */
      const x0 = W * 0.04, w = W * 0.44, cx = x0 + w / 2, y0 = H * 0.15, h = H * 0.3;
      const sc = (w * 0.4) / Math.max(Wd, 1e-9) * 0.8;
      ctx.fillStyle = EM.alpha('--c2', 0.18); ctx.fillRect(x0, y0, w / 2, h);
      ctx.fillStyle = EM.alpha('--c1', 0.18); ctx.fillRect(cx, y0, w / 2, h);
      const wp = Math.min(w / 2 - 4, xp * sc), wn = Math.min(w / 2 - 4, xn * sc);
      ctx.fillStyle = EM.alpha('--c2', 0.45); ctx.fillRect(cx - wp, y0, wp, h);
      ctx.fillStyle = EM.alpha('--c1', 0.45); ctx.fillRect(cx, y0, wn, h);
      EM.text(ctx, 'p', x0 + 10, y0 + 18, { size: 15, weight: 700, color: '--c2' });
      EM.text(ctx, 'n', x0 + w - 18, y0 + 18, { size: 15, weight: 700, color: '--c1' });
      EM.text(ctx, '− − −', cx - wp / 2, y0 + h / 2 + 4, { size: 12, align: 'center', color: '--c2' });
      EM.text(ctx, '+ + +', cx + wn / 2, y0 + h / 2 + 4, { size: 12, align: 'center', color: '--c1' });
      EM.text(ctx, 'zona de agotamiento W = ' + EM.fix(Wd * 1e6, 3) + ' µm', cx, y0 + h + 18, { size: 11, align: 'center', color: '--ink-2' });
      /* banda de conducción esquemática */
      const yb = H * 0.72, hb = H * 0.18;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const u = i / 100, x = x0 + u * w; const t = M.clamp((x - (cx - wp)) / Math.max(1, wp + wn), 0, 1); const y = yb - hb * ((Vbi - Vj) / Math.max(Vbi, 0.5)) * (1 - t * t * (3 - 2 * t)) * 0.9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      EM.text(ctx, 'borde de la banda de conducción (barrera e(V_bi − V))', x0, H - 6, { size: 10.5, color: '--ink-3' });
      /* I–V */
      const Is = 1e-12 * Math.pow(ni / MAT.ni(Si, 300), 2);
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -1, xmax: 0.75, ymin: -2, ymax: 20, xlabel: 'V (V)', ylabel: 'I (mA)', ml: 46 });
      pl.frame();
      pl.fn((V) => (MAT.diode(V, Is, p.T) * 1000), { color: '--accent', width: 2.4 });
      pl.fn((V) => (MAT.diode(V, 1e-12, 300) * 1000), { color: '--grid-2', width: 1.2, dash: [4, 3] });
      const I = MAT.diode(p.V, Is, p.T);
      pl.dot(M.clamp(p.V, -1, 0.75), M.clamp(I * 1000, -2, 20), { color: '--accent' });
      sim.set('Vbi', EM.fix(Vbi, 3) + ' V');
      sim.set('W', EM.fix(Wd * 1e6, 3) + ' µm (x<sub>p</sub> = ' + EM.fix(xp * 1e6, 3) + ', x<sub>n</sub> = ' + EM.fix(xn * 1e6, 3) + ')');
      sim.set('I', EM.si(I, 'A'));
    });
  });
})();
