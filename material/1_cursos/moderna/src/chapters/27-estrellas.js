/* Capítulo 27 — Estrellas, enanas blancas y estrellas de neutrones */
(function () {
  'use strict';
  const EM = window.EM, St = EM.fm.star, c = 299792458;

  /* 27.1 Politropos de Lane–Emden */
  EM.defineSim('politropos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n', { label: 'Índice politrópico n (P = Kρ^{1 + 1/n})', min: 0, max: 4.5, step: 0.05, value: 3, fmt: (v) => EM.fix(v, 2) });
    sim.out('x', 'Radio ξ₁ (primer cero de θ) · masa −ξ₁²θ′₁', { hl: true });
    sim.out('r', 'Densidad central/media ρ_c/ρ̄ = ξ₁/(3|θ′₁|)');
    sim.out('e', 'Ejemplos: n = 3/2 (enanas blancas no relativistas, convección), n = 3 (modelo estándar del Sol, enanas relativistas), n = 1 (planetas)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, r = St.laneEmden(p.n, 2e-3, true), pr = r.profile;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: r.xi1, ymin: 0, ymax: 1.05, xlabel: 'ξ = r/α', ylabel: 'densidad ρ/ρ_c = θⁿ · masa m/M', ml: 56, mr: 8, title: 'Estructura de un politropo' });
      pl.frame(); const xs = pr.map((q) => q[0]), rho = pr.map((q) => Math.pow(Math.max(q[1], 0), p.n)); pl.xy(xs, rho, { color: '--c1', width: 3 });
      // masa acumulada: ∫ ξ² θⁿ dξ / (−ξ₁²θ'₁)
      let acc = 0; const ms = [0]; for (let i = 1; i < pr.length; i++) { acc += 0.5 * (pr[i][0] ** 2 * Math.pow(Math.max(pr[i][1], 0), p.n) + pr[i - 1][0] ** 2 * Math.pow(Math.max(pr[i - 1][1], 0), p.n)) * (pr[i][0] - pr[i - 1][0]); ms.push(acc / r.mass); }
      pl.xy(xs, ms, { color: '--c2', width: 3 }); pl.legend([{ label: 'ρ/ρ_c', color: '--c1' }, { label: 'm(r)/M', color: '--c2' }], 'mr');
      const pr2 = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 4.6, ymin: 0.5, ymax: 3e3, ylog: true, xlabel: 'índice n', ylabel: 'ρ_c/ρ̄', ml: 56, mr: 8, title: 'Concentración central' });
      pr2.frame(); const ns = [], rr = []; for (let n = 0; n <= 4.5; n += 0.25) { const q = St.laneEmden(n, 4e-3); ns.push(n); rr.push(St.rhoRatio(q)); } pr2.xy(ns, rr, { color: '--accent', width: 2.8 }); pr2.dot(p.n, St.rhoRatio(r), { color: '--c3', r: 6 });
      sim.set('x', `${EM.fix(r.xi1, 5)} · ${EM.fix(r.mass, 5)}`);
      sim.set('r', EM.fix(St.rhoRatio(r), 3));
    });
  });

  /* 27.2 Enanas blancas y estrellas de neutrones */
  const compactas = function (sim, mode) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('t', { label: 'Objeto compacto', options: [['wd', 'Enana blanca (electrones degenerados)'], ['ns', 'Estrella de neutrones (gas ideal de neutrones, TOV)']], value: mode });
    sim.slider('x', { label: 'Parámetro de Fermi central x_c = p_F/mc', min: -1, max: 2, step: 0.01, value: mode === 'wd' ? 0.4 : -0.08, fmt: (v) => EM.fix(Math.pow(10, v), 3) });
    sim.out('m', 'Masa M · radio R', { hl: true });
    sim.out('d', 'Densidad central ρ_c · densidad media');
    sim.out('c', 'Compacidad 2GM/Rc² · velocidad de escape · límite de Chandrasekhar 1.456 M☉');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, xc = Math.pow(10, p.x), wd = p.t === 'wd', fn = (x) => (wd ? St.whiteDwarf(x, 2) : St.neutronStar(x));
      EM.draw.clear(cv);
      const xs = [...Array(60).keys()].map((i) => Math.pow(10, -1 + 3 * i / 59)), pts = xs.map((x) => fn(x)), Rk = pts.map((q) => q.R / (wd ? 1e3 : 1e3)), Ms = pts.map((q) => q.M / St.Msun);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: wd ? 200 : 4, xmax: wd ? 30000 : 20, xlog: true, ymin: 0, ymax: wd ? 1.6 : 0.85, xlabel: 'radio R (km)', ylabel: 'masa (M☉)', ml: 56, mr: 8, title: wd ? 'Relación masa–radio de las enanas blancas' : 'Relación masa–radio: gas ideal de neutrones' });
      pl.frame(); pl.xy(Rk, Ms, { color: '--accent', width: 3 });
      if (wd) { pl.hline(St.chandrasekhar(2) / St.Msun, { color: '--c3', dash: [4, 3], label: 'M_Ch' }); pl.dot(0.0084 * 695700, 1.02, { color: '--c2', r: 6 }); pl.label(0.0084 * 695700 * 1.05, 1.06, 'Sirius B', { color: '--c2' }); pl.dot(0.0136 * 695700, 0.573, { color: '--c2', r: 6 }); pl.label(0.0136 * 695700 * 1.05, 0.62, '40 Eri B', { color: '--c2' }); }
      else { pl.hline(0.71, { color: '--c3', dash: [4, 3], label: 'M_max (OV) = 0.71 M☉' }); }
      const q = fn(xc); pl.dot(q.R / 1e3, q.M / St.Msun, { color: '--ink', r: 6 });
      const bx = W * 0.65, by = H * 0.16, R = Math.min(W * 0.16, H * 0.3), s = Math.log10(q.R) ; ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.5); ctx.beginPath(); ctx.arc(bx + W * 0.16, by + H * 0.3, 8 + (q.R / (wd ? 3e7 : 3e4)) * R * 3, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); void s;
      EM.text(ctx, wd ? 'tamaño relativo (Tierra = 6378 km)' : 'tamaño relativo (ciudad ≈ 10 km)', bx + W * 0.16, by + H * 0.62, { size: 11, align: 'center', color: '--ink-3' });
      const rhoM = q.M / (4 / 3 * Math.PI * q.R ** 3), comp = 2 * St.G * q.M / (c * c * q.R), vesc = Math.sqrt(2 * St.G * q.M / q.R);
      sim.set('m', `${EM.fix(q.M / St.Msun, 4)} M☉ · ${EM.fix(q.R / 1e3, 1)} km`);
      sim.set('d', `${EM.sci(wd ? q.rhoC : q.rhoC, 3)} kg/m³ · ${EM.sci(rhoM, 3)} kg/m³`);
      sim.set('c', `${EM.sci(comp, 3)} · ${EM.fix(vesc / c, 4)} c · ${EM.fix(St.chandrasekhar(2) / St.Msun, 4)} M☉`);
    });
  };
  EM.defineSim('compactas', (sim) => compactas(sim, 'wd'));
  EM.defineSim('neutrones', (sim) => compactas(sim, 'ns'));

  /* 27.3 Secuencia principal */
  EM.defineSim('secuencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('M', { label: 'Masa de la estrella (M☉)', min: 0.1, max: 60, step: 0.01, value: 1, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('L', 'Luminosidad L ≈ L☉ (M/M☉)^{3.5} · vida en la secuencia principal ≈ 10¹⁰ (M/M☉)^{−2.5} años', { hl: true });
    sim.out('E', 'Luminosidad de Eddington L_Edd = 4πGMm_pc/σ_T = 3.28×10⁴ (M/M☉) L☉ · cociente L/L_Edd');
    sim.out('s', 'Vida del Sol por fusión (10 % de su masa con 0.7 % de eficiencia) · energía de una supernova');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = St.lumRelation(p.M), LE = St.eddington(p.M * St.Msun) / St.Lsun;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0.1, xmax: 60, xlog: true, ymin: 1e-3, ymax: 1e7, ylog: true, xlabel: 'M/M☉', ylabel: 'L/L☉', ml: 56, mr: 8, title: 'Relación masa–luminosidad' });
      pl.frame(); pl.fn((m) => St.lumRelation(m), { color: '--accent', width: 3, n: 200 }); pl.fn((m) => St.eddington(m * St.Msun) / St.Lsun, { color: '--c3', width: 2, dash: [5, 3], n: 100 }); pl.dot(p.M, L, { color: '--c2', r: 6 });
      pl.legend([{ label: 'L ∝ M^3.5', color: '--accent' }, { label: 'límite de Eddington', color: '--c3' }], 'tl');
      const pr = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0.1, xmax: 60, xlog: true, ymin: 1e6, ymax: 1e12, ylog: true, xlabel: 'M/M☉', ylabel: 'vida (años)', ml: 56, mr: 8, title: 'Vida en la secuencia principal' });
      pr.frame(); pr.fn((m) => St.lifeRelation(m), { color: '--c1', width: 3, n: 100 }); pr.dot(p.M, St.lifeRelation(p.M), { color: '--c2', r: 6 });
      sim.set('L', `${EM.sci(L, 3)} L☉ · ${EM.sci(St.lifeRelation(p.M), 3)} años`);
      sim.set('E', `${EM.sci(LE, 3)} L☉ · ${EM.sci(L / LE, 3)}`);
      sim.set('s', `${EM.sci(St.sunLifetimeYr(), 3)} años · ${EM.sci(St.bindingEnergy(1.4 * St.Msun, 12e3), 3)} J (≈ ${EM.fix(St.bindingEnergy(1.4 * St.Msun, 12e3) / (St.Lsun * 1e10 * 365.25 * 86400), 0)} vidas de energía solar)`);
    });
  });
})();
