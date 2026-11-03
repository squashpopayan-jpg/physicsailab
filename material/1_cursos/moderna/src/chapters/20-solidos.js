/* Capítulo 20 — Bandas, semiconductores, unión pn y celda solar */
(function () {
  'use strict';
  const EM = window.EM, So = EM.fm.sol, K = EM.qm.K, kB = K.kB, e = K.e;

  /* 20.1 Bandas de energía: modelo de Kronig–Penney */
  EM.defineSim('bandas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('P', { label: 'Intensidad de la barrera P = m V₀' + ' a/ħ² (0: electrón libre)', min: 0.05, max: 12, step: 0.01, value: 2, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.check('free', { label: 'Mostrar el electrón libre (parábola plegada)', value: true });
    sim.out('g', 'Brechas prohibidas (en unidades de E₁ = ħ²π²/2ma²): 1.ª · 2.ª · 3.ª', { hl: true });
    sim.out('w', 'Anchos de las tres primeras bandas permitidas');
    sim.out('m', 'Masa efectiva en el borde inferior de la 1.ª banda m*/m (curvatura de E(k))');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = p.P, bands = So.kpBands(P, 4.4 * Math.PI);
      EM.draw.clear(cv);
      const E1 = Math.PI * Math.PI, emax = 16, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: -Math.PI, xmax: Math.PI, ymin: 0, ymax: emax, xlabel: 'k a (zona reducida)', ylabel: 'E/E₁', ml: 56, mr: 8, title: 'Bandas de energía E(k)' });
      pl.frame();
      if (p.free) for (let m = -2; m <= 2; m++) pl.fn((k) => Math.pow(k + 2 * Math.PI * m, 2) / E1, { color: '--ink-3', width: 1.2, dash: [3, 3], n: 120 });
      const solve = (lo, hi, kk) => { const target = Math.cos(kk); let a = lo, b = hi; const fa = So.kpF(Math.max(a, 1e-9), P) - target; for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b), fm = So.kpF(m, P) - target; if ((fm > 0) === (fa > 0)) a = m; else b = m; } return 0.5 * (a + b); };
      const cols = ['--c1', '--c2', '--c3', '--c4'];
      bands.slice(0, 4).forEach(([lo, hi], bi) => { const ks = [], es = []; for (let i = 0; i <= 120; i++) { const kk = -Math.PI + (2 * Math.PI * i) / 120, k = Math.max(Math.abs(kk), 1e-3); const b = solve(lo, hi, k); ks.push(kk); es.push((b * b) / E1); } pl.xy(ks, es, { color: cols[bi], width: 3 }); });
      // estructura de bandas permitidas y prohibidas a la derecha
      const pr = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: emax, xlabel: '', ylabel: '', ml: 14, mr: 10, title: 'Bandas permitidas' });
      pr.frame(); bands.slice(0, 4).forEach(([lo, hi], bi) => pr.xy([0.5, 0.5], [lo * lo / E1, hi * hi / E1], { color: cols[bi], width: 28 }));
      const gaps = []; for (let i = 0; i + 1 < bands.length; i++) gaps.push((bands[i + 1][0] ** 2 - bands[i][1] ** 2) / E1);
      const wid = bands.slice(0, 3).map((b) => (b[1] ** 2 - b[0] ** 2) / E1);
      const dk = 0.02, e0 = bands[0][0] ** 2 / E1, bk = solve(bands[0][0], bands[0][1], dk), ek = bk * bk / E1;
      sim.set('g', gaps.slice(0, 3).map((g) => EM.fix(g, 3)).join(' · '));
      sim.set('w', wid.map((w2) => EM.fix(w2, 3)).join(' · '));
      sim.set('m', `${EM.fix((dk * dk) / (Math.PI * Math.PI) / (ek - e0), 3)}${P < 0.1 ? ' (≈ 1: electrón libre)' : ''}`);
    });
  });

  /* 20.2 Semiconductores */
  const SC = { Si: ['Silicio', 1.12, 1.08, 0.56], Ge: ['Germanio', 0.66, 0.55, 0.37], GaAs: ['Arseniuro de galio', 1.42, 0.067, 0.47] };
  EM.defineSim('semiconductores', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Semiconductor', options: Object.entries(SC).map(([k, v]) => [k, `${v[0]} — E_g = ${v[1]} eV`]), value: 'Si' });
    sim.slider('ND', { label: 'Donadores N_D (cm⁻³)', min: 10, max: 19, step: 0.1, value: 15, fmt: (v) => '10^' + EM.fix(v, 1) });
    sim.slider('NA', { label: 'Aceptores N_A (cm⁻³)', min: 10, max: 19, step: 0.1, value: 10, fmt: (v) => '10^' + EM.fix(v, 1) });
    sim.slider('T', { label: 'Temperatura', min: 150, max: 900, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('ni', 'n_i a esta temperatura (cm⁻³) · N_c · N_v', { hl: true });
    sim.out('np', 'Electrones n · huecos p (cm⁻³) · tipo');
    sim.out('EF', 'E_F − E_i = kT ln(n/n_i) (eV) · posición respecto de la brecha');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Eg, mc, mv] = SC[p.m], ND = Math.pow(10, p.ND) * 1e6, NA = Math.pow(10, p.NA) * 1e6;
      EM.draw.clear(cv);
      const at = (T) => { const Nc = So.Nc(mc, T), Nv = So.Nc(mv, T), ni = So.ni(Nc, Nv, Eg, T), c0 = So.carriers(ND, NA, ni); return { Nc, Nv, ni, n: c0.n, p: c0.p }; };
      const Ts = [], N = [], Pp = [], NI = []; for (let T = 150; T <= 900; T += 10) { const q = at(T); Ts.push(1000 / T); N.push(q.n * 1e-6); Pp.push(q.p * 1e-6); NI.push(q.ni * 1e-6); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 1000 / 900, xmax: 1000 / 150, ymin: 1e0, ymax: 1e19, ylog: true, xlabel: '1000/T (K⁻¹)', ylabel: 'concentración (cm⁻³)', ml: 60, mr: 8, title: 'Portadores frente a la temperatura' });
      pl.frame(); pl.xy(Ts, NI, { color: '--ink-3', width: 2, dash: [5, 3] }); pl.xy(Ts, N, { color: '--c1', width: 2.8 }); pl.xy(Ts, Pp, { color: '--c2', width: 2.8 });
      pl.vline(1000 / p.T, { color: '--accent', dash: [] }); pl.legend([{ label: 'n', color: '--c1' }, { label: 'p', color: '--c2' }, { label: 'n_i', color: '--ink-3' }], 'tr');
      const q = at(p.T), Vt = kB * p.T / e;
      // diagrama de bandas
      const bx = W * 0.62, bw = W * 0.34, by = H * 0.1, bh = H * 0.78, Ei = 0.5, EFv = Ei + Math.log(q.n / q.ni) * Vt / Eg * 1, sc = bh / 1.6;
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.fillRect(bx, by, bw, bh * 0.18); ctx.fillStyle = EM.alpha('--c2', 0.25); ctx.fillRect(bx, by + bh * 0.82, bw, bh * 0.18); ctx.restore();
      EM.text(ctx, 'banda de conducción', bx + bw / 2, by + 14, { size: 11.5, align: 'center', color: '--ink-2' }); EM.text(ctx, 'banda de valencia', bx + bw / 2, by + bh - 8, { size: 11.5, align: 'center', color: '--ink-2' });
      const yE = (x) => by + bh * 0.18 + (bh * 0.64) * (1 - Math.max(0, Math.min(1, x))); // x: 0 (borde de valencia) … 1 (borde de conducción)
      const xF = 0.5 + Math.log(q.n / q.ni) * Vt / Eg;
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.5); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(bx, yE(0.5)); ctx.lineTo(bx + bw, yE(0.5)); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(bx, yE(xF)); ctx.lineTo(bx + bw, yE(xF)); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'E_F', bx + bw - 6, yE(xF) - 6, { size: 12, align: 'right', color: '#e8590c' }); EM.text(ctx, `E_g = ${Eg} eV`, bx + 8, by + bh / 2, { size: 11.5, color: '--ink-3' });
      sim.set('ni', `${EM.sci(q.ni * 1e-6, 3)} · ${EM.sci(q.Nc * 1e-6, 3)} · ${EM.sci(q.Nv * 1e-6, 3)}`);
      sim.set('np', `${EM.sci(q.n * 1e-6, 3)} · ${EM.sci(q.p * 1e-6, 3)} · ${q.n > 10 * q.p ? 'n' : q.p > 10 * q.n ? 'p' : 'intrínseco'}`);
      sim.set('EF', `${EM.fix(Math.log(q.n / q.ni) * Vt, 3)} eV · ${xF > 1 ? 'en la banda de conducción (degenerado: la estadística de Boltzmann no vale)' : xF < 0 ? 'en la banda de valencia (degenerado)' : 'dentro de la brecha'}`);
    });
  });

  /* 20.3 Unión pn */
  const NI = 1.0e16, EPSR = 11.7, DN = 3.5e-3, DP = 1.2e-3, TAU = 1e-6;
  EM.defineSim('union', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('NA', { label: 'Aceptores del lado p, N_A (cm⁻³)', min: 14, max: 18, step: 0.05, value: 16, fmt: (v) => '10^' + EM.fix(v, 2) });
    sim.slider('ND', { label: 'Donadores del lado n, N_D (cm⁻³)', min: 14, max: 18, step: 0.05, value: 16, fmt: (v) => '10^' + EM.fix(v, 2) });
    sim.slider('V', { label: 'Tensión aplicada (positiva: directa)', min: -10, max: 0.7, step: 0.01, value: 0, unit: 'V', fmt: (v) => EM.fix(v, 2) });
    sim.out('V', 'Potencial de contacto V_bi = (kT/e) ln(N_AN_D/n_i²) · ancho W(V)', { hl: true });
    sim.out('x', 'Penetración x_n · x_p · campo máximo (V/cm)');
    sim.out('C', 'Capacidad de vaciamiento por unidad de área (nF/cm²)');
    sim.out('I', 'Corriente (diodo de base larga, τ = 1 µs): densidad J (A/cm²) · J_s');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, NA = Math.pow(10, p.NA) * 1e6, ND = Math.pow(10, p.ND) * 1e6, Vbi = So.Vbi(NA, ND, NI, 300), V = Math.min(p.V, Vbi - 0.05), Wd = So.width(NA, ND, EPSR, Vbi, V), xn = So.xn(NA, ND, Wd), xp = So.xp(NA, ND, Wd), Em = So.Emax(ND, xn, EPSR);
      EM.draw.clear(cv);
      const L = Math.max(Wd * 1.6, 0.3e-6), xs = [], rho = [], Ef = [], ph = [];
      for (let i = 0; i <= 300; i++) { const x = -L + (2 * L * i) / 300; xs.push(x * 1e6); let r = 0, E = 0, v;
        if (x < -xp) { r = 0; E = 0; v = 0; } else if (x < 0) { r = -e * NA; E = -(e * NA / (EPSR * K.eps0)) * (x + xp); v = (e * NA / (2 * EPSR * K.eps0)) * (x + xp) ** 2; } else if (x < xn) { r = e * ND; E = -(e * ND / (EPSR * K.eps0)) * (xn - x); v = (e * NA / (2 * EPSR * K.eps0)) * xp * xp + (e * ND / (EPSR * K.eps0)) * (xn * x - x * x / 2) * 1; } else { r = 0; E = 0; v = Vbi - V; }
        rho.push(r); Ef.push(E); ph.push(v); }
      // potencial: integración del campo para coherencia
      const pot = []; let acc = 0; for (let i = 0; i <= 300; i++) { if (i > 0) acc += -0.5 * (Ef[i] + Ef[i - 1]) * (xs[i] - xs[i - 1]) * 1e-6; pot.push(acc); }
      const sec = (title, ys, y0, h0, lab) => { const mx = Math.max(...ys.map(Math.abs)) * 1.15 || 1, mn = Math.min(...ys) < 0 ? -mx : 0; const pl = new EM.Plot(ctx, { x: y0.x, y: y0.y, w: y0.w, h: h0, xmin: xs[0], xmax: xs[300], ymin: mn, ymax: mx, xlabel: y0.xl || '', ylabel: lab, ml: 62, mr: 8, title }); pl.frame(); pl.xy(xs, ys, { color: y0.col, width: 2.8, fill: y0.col, fillAlpha: 0.12 }); pl.hline(0, { color: '--ink-3', dash: [] }); };
      const w2 = W * 0.6, hh = H / 3;
      sec('Densidad de carga', rho.map((r) => r / (e * 1e6)), { x: 0, y: 0, w: w2, col: '--c2' }, hh, 'ρ/e (cm⁻³)');
      sec('Campo eléctrico', Ef.map((E) => E / 100), { x: 0, y: hh, w: w2, col: '--c1' }, hh, 'E (V/cm)');
      sec('Potencial', pot, { x: 0, y: 2 * hh, w: w2, col: '--accent', xl: 'x (µm)' }, hh, 'ψ (V)');
      // característica I–V
      const Lp = Math.sqrt(DP * TAU), Ln = Math.sqrt(DN * TAU), Js = So.Js(NI, NA, ND, DN, DP, Ln, Lp), vs = [], js = [];
      for (let v = -1; v <= 0.8; v += 0.01) { vs.push(v); js.push(So.shockley(Js, v, 300) * 1e-4); }
      const jmax = Math.max(1e-6, Js * 1e-4 * Math.expm1(0.75 / So.Vt(300))), pi = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: -1, xmax: 0.8, ymin: -jmax * 0.1, ymax: jmax, xlabel: 'V (V)', ylabel: 'J (A/cm²)', ml: 60, mr: 8, title: 'Diodo de Shockley' });
      pi.frame(); pi.xy(vs, js, { color: '--c3', width: 2.8 }); pi.hline(0, { color: '--ink-3', dash: [] }); pi.vline(0, { color: '--ink-3', dash: [] });
      const Jnow = So.shockley(Js, Math.max(-1, p.V), 300) * 1e-4; pi.dot(Math.max(-1, Math.min(0.8, p.V)), Math.max(-jmax * 0.1, Math.min(jmax, Jnow)), { color: '--accent', r: 5.5 });
      sim.set('V', `${EM.fix(Vbi, 4)} V · ${EM.fix(Wd * 1e6, 4)} µm`);
      sim.set('x', `${EM.fix(xn * 1e6, 4)} µm · ${EM.fix(xp * 1e6, 4)} µm · ${EM.sci(Em / 100, 3)}`);
      sim.set('C', `${EM.fix(So.Cj(EPSR, Wd) * 1e-4 * 1e9, 3)}`);
      sim.set('I', `${EM.sci(Jnow, 3)} · ${EM.sci(Js * 1e-4, 3)}`);
    });
  });

  /* 20.4 Celda solar */
  const cache = {};
  EM.defineSim('solar', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Eg', { label: 'Brecha del semiconductor E_g', min: 0.4, max: 3, step: 0.01, value: 1.34, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('Ts', { label: 'Temperatura de la fuente (Sol)', min: 4000, max: 7000, step: 10, value: 5800, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('u', 'Eficiencia última (un electrón por fotón con E ≥ E_g) · límite de balance detallado', { hl: true });
    sim.out('v', 'Punto de máxima potencia: V_mp · J_mp (A/m²) · tensión en circuito abierto V_oc');
    sim.out('f', 'Longitud de onda del borde de absorción λ = hc/E_g · pérdidas principales');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Ts = Math.round(p.Ts / 10) * 10;
      EM.draw.clear(cv);
      if (!cache[Ts]) { const Es = [], ul = [], sq = []; for (let Eg = 0.4; Eg <= 3.001; Eg += 0.1) { Es.push(Eg); ul.push(So.ultimate(Eg, Ts, 600)); sq.push(So.cellEff(Eg, Ts, 300, So.fOmega, 600).eta); } cache[Ts] = { Es, ul, sq }; }
      const d = cache[Ts], pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.4, xmax: 3, ymin: 0, ymax: 0.7, xlabel: 'E_g (eV)', ylabel: 'eficiencia', ml: 56, mr: 8, title: 'Eficiencia frente a la brecha' });
      pl.frame(); pl.xy(d.Es, d.ul, { color: '--ink-3', width: 2.2, dash: [5, 3] }); pl.xy(d.Es, d.sq, { color: '--accent', width: 3});
      const r = So.cellEff(p.Eg, Ts, 300, So.fOmega, 1200), ult = So.ultimate(p.Eg, Ts, 1200);
      pl.vline(p.Eg, { color: '--c3', dash: [] }); pl.dot(p.Eg, r.eta, { color: '--c3', r: 5.5 }); pl.legend([{ label: 'última', color: '--ink-3' }, { label: 'balance detallado', color: '--accent' }], 'tr');
      const Vs = [], Js = [], Pw = []; let voc = 0; for (let V = 0; V <= p.Eg; V += p.Eg / 120) { const J = So.cellJ(p.Eg, V, Ts, 300, So.fOmega, 800); if (J < 0) { voc = V; break; } Vs.push(V); Js.push(J); Pw.push(J * V); voc = V; }
      const jm = Js[0] || 1, pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: Math.max(voc * 1.05, 0.2), ymin: 0, ymax: jm * 1.1, xlabel: 'V (V)', ylabel: 'J (A/m²)', ml: 60, mr: 8, title: 'Curva J–V y potencia' });
      pr.frame(); pr.xy(Vs, Js, { color: '--c1', width: 2.8 }); const pmax = Math.max(...Pw, 1e-9); pr.xy(Vs, Pw.map((x) => x / pmax * jm * 0.9), { color: '--c3', width: 2, dash: [4, 3] }); pr.dot(r.V, r.J, { color: '--c3', r: 5.5 });
      sim.set('u', `${EM.fix(ult * 100, 2)} % · ${EM.fix(r.eta * 100, 2)} %`);
      sim.set('v', `${EM.fix(r.V, 3)} V · ${EM.fix(r.J, 1)} · ${EM.fix(voc, 3)} V`);
      sim.set('f', `${EM.fix(1239.84198 / p.Eg, 0)} nm · fotones con E < E_g no se absorben; los de E > E_g pierden el exceso en calor`);
    });
  });
})();
