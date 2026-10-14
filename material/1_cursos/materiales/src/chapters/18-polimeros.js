/* Capítulo 18 — Polímeros */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     18.1 Distribución de peso molecular
     ====================================================================== */
  EM.defineSim('mw-distribution', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('d', { label: 'Distribución', options: [['flory', 'Flory (policondensación)'], ['ln', 'Log-normal'], ['narrow', 'Estrecha (aniónica)']], value: 'flory' });
    sim.slider('p', { label: 'Grado de avance <i>p</i> (Flory)', min: 0.95, max: 0.9995, step: 0.0005, value: 0.99, fmt: (v) => EM.fix(v, 4) });
    sim.slider('M0', { label: 'Peso molecular mediano (log-normal / estrecha)', min: 5000, max: 500000, step: 1000, value: 100000, unit: 'g/mol', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Ancho σ de ln M (log-normal)', min: 0.05, max: 1.2, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.slider('m0', { label: 'Masa del mero', min: 28, max: 300, step: 1, value: 113, unit: 'g/mol', fmt: (v) => v.toFixed(0) });
    sim.out('Mn', '<i>M̄<sub>n</sub></i>', { hl: true });
    sim.out('Mw', '<i>M̄<sub>w</sub></i>');
    sim.out('pdi', 'Índice de polidispersión');
    sim.out('gp', 'Grado de polimerización');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      /* fracción en número n(M) sobre una malla logarítmica */
      const Ms = M.linspace(Math.log10(500), Math.log10(5e7), 600).map((q) => Math.pow(10, q));
      let nM;
      if (p.d === 'flory') { const N = (M_) => M_ / p.m0; nM = (M_) => (1 - p.p) * Math.pow(p.p, N(M_) - 1); }
      else { const s = p.d === 'narrow' ? 0.05 : p.s; nM = (M_) => Math.exp(-Math.pow(Math.log(M_ / p.M0), 2) / (2 * s * s)) / M_; }
      /* pesos de cuadratura en ln M → dM = M d lnM */
      const x = Ms.map((m) => nM(m) * m), w = Ms.map((m, i) => x[i] * m);
      const sx = x.reduce((a, b) => a + b, 0), sw = w.reduce((a, b) => a + b, 0);
      const Mn = Ms.reduce((s, m, i) => s + m * x[i], 0) / sx, Mw = Ms.reduce((s, m, i) => s + m * w[i], 0) / sw;
      const xmax = Math.max(...x) / sx, wmax = Math.max(...w) / sw;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 500, xmax: 5e7, ymin: 0, ymax: 1.15, xlog: true, xlabel: 'peso molecular M (g/mol)', ylabel: 'fracción (normalizada)', ml: 50 });
      pl.frame();
      pl.xy(Ms, x.map((v) => v / sx / xmax), { color: '--c1', width: 2.2 });
      pl.xy(Ms, w.map((v) => v / sw / wmax), { color: '--c2', width: 2.2 });
      pl.vline(Mn, { color: '--c1', label: 'M̄n' });
      pl.vline(Mw, { color: '--c2', label: 'M̄w', labelY: 30 });
      pl.legend([{ label: 'fracción en número', color: '--c1' }, { label: 'fracción en masa', color: '--c2' }], 'tr');
      sim.set('Mn', EM.fix(Mn, 0) + ' g/mol' + (p.d === 'flory' ? ' (teoría m₀/(1 − p) = ' + EM.fix(p.m0 * MAT.floryMn(p.p), 0) + ')' : ''));
      sim.set('Mw', EM.fix(Mw, 0) + ' g/mol' + (p.d === 'flory' ? ' (teoría ' + EM.fix(p.m0 * MAT.floryMw(p.p), 0) + ')' : ''));
      sim.set('pdi', EM.fix(Mw / Mn, 3));
      sim.set('gp', EM.fix(Mn / p.m0, 0));
    });
  });

  /* ======================================================================
     18.2 Cadena como caminata aleatoria
     ====================================================================== */
  EM.defineSim('polymer-chain', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de enlaces <i>N</i>', min: 20, max: 2000, step: 10, value: 400, log: true, fmt: (v) => v.toFixed(0) });
    sim.seg('mod', { label: 'Modelo', options: [['fj', 'Libremente articulada'], ['fr', 'Ángulo fijo 109.5°']], value: 'fr' });
    sim.button('Nueva cadena', () => { gen(); sim.redraw(); });
    sim.out('r', 'Extremo a extremo de esta cadena');
    sim.out('rms', '⟨<i>r</i>²⟩<sup>½</sup> de 200 cadenas', { hl: true });
    sim.out('th', 'Teoría √(<i>C</i> <i>N</i>) <i>l</i>');
    sim.out('Rg', 'Radio de giro (esta cadena)');
    let chain = [], rms = 0;
    const walk = (N, mode) => {
      const pts = [[0, 0, 0]];
      let d = EM.V.unit([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
      for (let i = 0; i < N; i++) {
        if (mode === 'fj' || i === 0) d = EM.V.unit([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1].map((v, k, a) => v));
        else {
          /* nuevo enlace a 70.5° del anterior (ángulo suplementario de 109.5°), giro aleatorio */
          const a = M.rad(180 - 109.5), phi = Math.random() * 2 * Math.PI;
          const u = EM.V.unit(Math.abs(d[0]) < 0.9 ? EM.V.cross(d, [1, 0, 0]) : EM.V.cross(d, [0, 1, 0])), v = EM.V.cross(d, u);
          d = EM.V.unit(EM.V.add(EM.V.scale(d, Math.cos(a)), EM.V.add(EM.V.scale(u, Math.sin(a) * Math.cos(phi)), EM.V.scale(v, Math.sin(a) * Math.sin(phi)))));
        }
        const last = pts[pts.length - 1];
        pts.push([last[0] + d[0], last[1] + d[1], last[2] + d[2]]);
      }
      return pts;
    };
    const gen = () => {
      const N = Math.round(sim.p.N);
      chain = walk(N, sim.p.mod);
      let s = 0; for (let k = 0; k < 200; k++) { const c = walk(N, sim.p.mod), e = c[c.length - 1]; s += e[0] ** 2 + e[1] ** 2 + e[2] ** 2; }
      rms = Math.sqrt(s / 200);
    };
    gen();
    sim.onChange = () => gen();
    const v = new EM.View3D(sim, cv, { radius: 1.6, az: M.rad(30), el: M.rad(20) });
    sim.onDraw(() => {
      const p = sim.p;
      const N = Math.round(p.N);
      const ctr = chain.reduce((s, q) => EM.V.add(s, q), [0, 0, 0]).map((x) => x / chain.length);
      const Rg = Math.sqrt(chain.reduce((s, q) => s + EM.V.norm(EM.V.sub(q, ctr)) ** 2, 0) / chain.length);
      const sc = 1 / (1.4 * Math.max(Rg, 1));
      v.begin();
      const P = (q) => EM.V.scale(EM.V.sub(q, ctr), sc);
      for (let i = 1; i < chain.length; i++) v.line(P(chain[i - 1]), P(chain[i]), { color: EM.mix(EM.col('--c1'), EM.col('--c2'), i / chain.length), width: 1.3 });
      v.point(P(chain[0]), { r: 6, color: '--c3' });
      v.point(P(chain[chain.length - 1]), { r: 6, color: '--accent' });
      v.line(P(chain[0]), P(chain[chain.length - 1]), { color: '--ink', width: 1.6, dash: [5, 4] });
      v.render();
      const e = chain[chain.length - 1], r = Math.hypot(...e);
      const C = p.mod === 'fj' ? 1 : (1 + Math.cos(M.rad(70.5))) / (1 - Math.cos(M.rad(70.5)));
      sim.set('r', EM.fix(r, 1) + ' l');
      sim.set('rms', EM.fix(rms, 1) + ' l');
      sim.set('th', EM.fix(Math.sqrt(C * N), 1) + ' l (C = ' + EM.fix(C, 2) + ')');
      sim.set('Rg', EM.fix(Rg, 1) + ' l (teoría ≈ ' + EM.fix(Math.sqrt((C * N) / 6), 1) + ' l)');
    });
  });

  /* ======================================================================
     18.3 Módulo contra temperatura
     ====================================================================== */
  EM.defineSim('modulus-temperature', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Tg', { label: 'Transición vítrea <i>T<sub>g</sub></i>', min: -120, max: 160, step: 1, value: 100, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('X', { label: 'Cristalinidad', min: 0, max: 0.8, step: 0.01, value: 0, fmt: (v) => EM.fix(100 * v, 0) + ' %' });
    sim.slider('Tm', { label: 'Fusión <i>T<sub>m</sub></i>', min: 60, max: 330, step: 1, value: 240, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('xl', { label: 'Entrecruzado (vulcanizado)', value: false });
    sim.slider('T', { label: 'Temperatura de uso', min: -150, max: 300, step: 1, value: 25, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Módulo de relajación a 10 s', { hl: true });
    sim.out('reg', 'Región');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const logE = (T) => {
        const glass = 9.5, rub = p.xl ? 6.5 : 6.2;
        const s1 = 1 / (1 + Math.exp((T - p.Tg) / 5));
        let am = rub + (glass - rub) * s1;
        if (!p.xl) { const Tf = p.Tg + 60; am -= (4.5 * 1) / (1 + Math.exp(-(T - Tf) / 8)); }
        else am += 0.004 * (T - p.Tg) * (T > p.Tg ? 1 : 0);
        /* aporte cristalino: módulo alto hasta Tm */
        if (p.X > 0) {
          const cr = (9.0 - (T > p.Tg ? 0.4 : 0)) - 6 / (1 + Math.exp(-(T - p.Tm) / 4));
          const Ec = Math.pow(10, cr), Ea = Math.pow(10, am);
          return Math.log10(Ea + p.X * p.X * Ec * (T < p.Tm ? 1 : 0.0001) + (1 - p.X) * 0);
        }
        return am;
      };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -150, xmax: 300, ymin: 1, ymax: 10.5, xlabel: 'temperatura (°C)', ylabel: 'log₁₀ E_r(10 s) (Pa)', ml: 52 });
      pl.frame();
      pl.fn(logE, { color: '--accent', width: 2.6 });
      pl.vline(p.Tg, { color: '--c1', label: 'T_g' });
      if (p.X > 0) pl.vline(p.Tm, { color: '--c2', label: 'T_m' });
      pl.label(-140, 9.9, 'vítreo', { size: 11, color: '--ink-3' });
      pl.label(p.Tg + 20, 7.2, p.xl ? 'gomoso (red)' : 'meseta gomosa', { size: 11, color: '--ink-3' });
      if (!p.xl) pl.label(p.Tg + 80, 2.2, 'flujo viscoso', { size: 11, color: '--ink-3' });
      pl.dot(p.T, logE(p.T), { color: '--accent', r: 6 });
      const L = logE(p.T);
      sim.set('E', EM.si(Math.pow(10, L), 'Pa', 2));
      sim.set('reg', L > 8.8 ? 'vítreo o semicristalino rígido' : L > 7.2 ? 'transición (cuero)' : L > 5.5 ? 'gomoso' : 'flujo viscoso');
    });
    sim.note('Curva cualitativa con los niveles típicos (vítreo ≈ 3 GPa, meseta gomosa ≈ 1 MPa) de Callister, fig. 15.8.');
  });

  /* ======================================================================
     18.4 Viscoelasticidad
     ====================================================================== */
  EM.defineSim('viscoelastic', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('test', { label: 'Ensayo', options: [['relax', 'Relajación'], ['creep', 'Fluencia y recuperación'], ['dma', 'Dinámico (DMA)']], value: 'creep' });
    sim.slider('E1', { label: 'Módulo del resorte de Maxwell <i>E</i><sub>1</sub>', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'GPa', fmt: (v) => EM.fix(v, 2) });
    sim.slider('Er', { label: 'Módulo de equilibrio <i>E<sub>r</sub></i> (Zener, Kelvin)', min: 0.05, max: 2, step: 0.05, value: 0.4, unit: 'GPa', fmt: (v) => EM.fix(v, 2) });
    sim.slider('tau', { label: 'Tiempo de relajación τ', min: 0.1, max: 100, step: 0.1, value: 10, unit: 's', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.out('a', 'Lectura', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const tau = p.tau, E1 = p.E1, Er = p.Er;
      if (p.test === 'relax') {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 5 * tau, ymin: 0, ymax: (E1 + Er) * 1.1, xlabel: 't (s)', ylabel: 'σ/ε₀ (GPa)', ml: 50 });
        pl.frame();
        pl.fn((t) => MAT.maxwellRelax(E1, tau, t), { color: '--c1', width: 2.2 });
        pl.fn(() => Er, { color: '--c3', width: 2.2 });
        pl.fn((t) => MAT.slsRelax(Er, E1, tau, t), { color: '--accent', width: 2.6 });
        pl.legend([{ label: 'Maxwell', color: '--c1' }, { label: 'Kelvin–Voigt (sin relajación)', color: '--c3' }, { label: 'Zener', color: '--accent' }], 'tr');
        sim.set('a', 'a t = τ el Maxwell retiene 1/e = 37 % del esfuerzo; el Zener tiende a ' + EM.fix(Er, 2) + ' GPa');
      } else if (p.test === 'creep') {
        const s0 = 0.01, t1 = 4 * tau, tm = 8 * tau;
        const eta = E1 * tau;
        const maxw = (t) => (t < t1 ? MAT.maxwellCreep(s0, E1, eta, t) : (s0 * t1) / eta);
        const kel = (t) => (t < t1 ? MAT.kelvinCreep(s0, Er, tau, t) : MAT.kelvinCreep(s0, Er, tau, t1) * Math.exp(-(t - t1) / tau));
        /* Zener: Er en paralelo con Maxwell(E1, η). Retardo τc = η(E1+Er)/(E1 Er) */
        const tc = (eta * (E1 + Er)) / (E1 * Er);
        const zen = (t) => { const e0 = s0 / (E1 + Er), einf = s0 / Er; const up = (u) => einf - (einf - e0) * Math.exp(-u / tc); if (t < t1) return up(t); return (up(t1) - e0) * Math.exp(-(t - t1) / tc); };
        const ym = Math.max(maxw(t1 * 0.9999), kel(t1), zen(t1 * 0.9999)) * 1.1;
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tm, ymin: 0, ymax: ym * 1000, xlabel: 't (s)', ylabel: 'deformación (×10⁻³)', ml: 50 });
        pl.frame();
        pl.fn((t) => maxw(t) * 1000, { color: '--c1', width: 2.2 });
        pl.fn((t) => kel(t) * 1000, { color: '--c3', width: 2.2 });
        pl.fn((t) => zen(t) * 1000, { color: '--accent', width: 2.6 });
        pl.vline(t1, { color: '--ink-3', label: 'descarga' });
        pl.legend([{ label: 'Maxwell', color: '--c1' }, { label: 'Kelvin–Voigt', color: '--c3' }, { label: 'Zener', color: '--accent' }], 'tl');
        sim.set('a', 'deformación permanente: Maxwell ' + EM.fix(maxw(tm) * 1000, 2) + '×10⁻³; Kelvin y Zener se recuperan');
      } else {
        const ws = M.linspace(-3, 3, 300).map((q) => Math.pow(10, q) / tau);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-3 / tau, xmax: 1e3 / tau, ymin: 0, ymax: (E1 + Er) * 1.15, xlog: true, xlabel: 'ω (rad/s)', ylabel: "E', E'' (GPa)", ml: 50 });
        pl.frame();
        pl.xy(ws, ws.map((w) => MAT.dynamic(Er, E1, tau, w).Ep), { color: '--c1', width: 2.2 });
        pl.xy(ws, ws.map((w) => MAT.dynamic(Er, E1, tau, w).Epp), { color: '--c2', width: 2.2 });
        const td = (w) => { const d = MAT.dynamic(Er, E1, tau, w); return d.Epp / d.Ep; };
        const tdmax = Math.max(...ws.map(td));
        pl.xy(ws, ws.map((w) => (td(w) / tdmax) * (E1 + Er) * 0.5), { color: '--accent', width: 1.8, dash: [5, 3] });
        const wpk = ws.reduce((b, w) => (td(w) > td(b) ? w : b), ws[0]);
        pl.vline(1 / tau, { color: '--ink-3', label: 'ωτ = 1' });
        pl.legend([{ label: "almacenamiento E'", color: '--c1' }, { label: "pérdida E''", color: '--c2' }, { label: 'tan δ (escalada)', color: '--accent', dash: [5, 3] }], 'tl');
        sim.set('a', 'pico de tan δ = ' + EM.fix(tdmax, 3) + ' en ωτ = ' + EM.fix(wpk * tau, 2) + ' (teoría √(E_r/(E_r + E₁)) = ' + EM.fix(Math.sqrt(Er / (Er + E1)), 2) + ')');
      }
    });
  });

  /* ======================================================================
     18.5 Caucho
     ====================================================================== */
  EM.defineSim('rubber', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Mc', { label: 'Peso molecular entre entrecruzamientos <i>M<sub>c</sub></i>', min: 1000, max: 30000, step: 100, value: 5000, unit: 'g/mol', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('F', { label: 'Esfuerzo nominal aplicado', min: 0, max: 3, step: 0.01, value: 0.8, unit: 'MPa', fmt: (v) => EM.fix(v, 2) });
    sim.check('lim', { label: 'Extensibilidad finita (Gent, J<sub>m</sub> = 80)', value: true });
    sim.out('G', 'Módulo de cizalla <i>G</i> = ρ<i>RT</i>/<i>M<sub>c</sub></i>', { hl: true });
    sim.out('lam', 'Estiramiento de equilibrio λ');
    sim.out('dT', 'λ si se calienta 60 K a la misma carga');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Gf = (T) => (920 * MAT.R * T) / (p.Mc / 1000) / 1e6; // MPa
      const s = (lam, T) => { const G = Gf(T), I1 = lam * lam + 2 / lam; const g = p.lim ? 1 / Math.max(1e-3, 1 - (I1 - 3) / 80) : 1; return G * g * (lam - 1 / (lam * lam)); };
      const solve = (T) => MAT.bisect((l) => s(l, T) - p.F, 1, p.lim ? 9.9 : 50);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 8, ymin: 0, ymax: 3.2, xlabel: 'estiramiento λ', ylabel: 'esfuerzo nominal (MPa)', ml: 50 });
      pl.frame();
      pl.fn((l) => s(l, p.T), { color: '--accent', width: 2.6 });
      pl.fn((l) => s(l, p.T + 60), { color: '--c2', width: 1.6, dash: [5, 4] });
      pl.fn((l) => Gf(p.T) * (l - 1 / (l * l)), { color: '--grid-2', width: 1.2 });
      pl.hline(p.F, { color: '--ink-3', label: 'carga' });
      const l1 = solve(p.T), l2 = solve(p.T + 60);
      pl.dot(l1, p.F, { color: '--accent' }); pl.dot(l2, p.F, { color: '--c2' });
      pl.legend([{ label: p.T + ' K', color: '--accent' }, { label: p.T + 60 + ' K', color: '--c2', dash: [5, 4] }, { label: 'gaussiana', color: '--grid-2' }], 'tl');
      sim.set('G', EM.fix(Gf(p.T), 3) + ' MPa');
      sim.set('lam', EM.fix(l1, 2));
      sim.set('dT', EM.fix(l2, 2) + ' — se contrae al calentarlo');
    });
  });
})();
