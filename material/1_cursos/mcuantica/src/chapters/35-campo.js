/* Capítulo 35 — El campo cuantizado y el modelo de Jaynes–Cummings */
(function () {
  'use strict';
  const EM = window.EM, F = EM.qm.fld, PI = Math.PI;
  const amps = (kind, nbar) => (kind === 'fock' ? F.fockAmps(Math.round(nbar), 140) : F.cohAmps(nbar, 140));

  /* 35.1 Colapso y revival de las oscilaciones de Rabi */
  EM.defineSim('jc-colapso', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.select('k', { label: 'Estado inicial del campo', options: [['coh', 'Coherente |α⟩ con n̄ = α²'], ['fock', 'Número |n⟩ con n = n̄']], value: 'coh' });
    sim.slider('nb', { label: 'Fotones medios n̄', min: 1, max: 30, step: 1, value: 25, fmt: (v) => v.toFixed(0) });
    sim.slider('De', { label: 'Desintonía Δ/g', min: 0, max: 5, step: 0.1, value: 0, fmt: (v) => EM.fix(v, 1) });
    sim.out('t', 'Colapso: t<sub>c</sub> ≈ √2/g (envolvente e<sup>−g²t²/2</sup>) · revival: t<sub>r</sub> ≈ 2π√n̄/g (en unidades de 1/g)', { hl: true });
    sim.out('p', 'Primer revival numérico: instante y P<sub>e</sub> máxima · P<sub>e</sub> en el colapso (t = 3/g)');
    sim.out('s', 'Entropía de entrelazamiento átomo–campo S(t) (bits): máximo, y valor en t<sub>r</sub>/2 (átomo casi desacoplado: gato en el campo)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, nb = sim.p.nb, De = sim.p.De, c = amps(sim.p.k, nb), tr = F.tRevival(nb, 1), Tm = sim.p.k === 'coh' ? 2.6 * tr : Math.min(40, 8 * tr);
      EM.draw.clear(cv);
      const n = 700, ts = Array.from({ length: n + 1 }, (_, i) => (Tm * i) / n), pe = ts.map((t) => F.pe(c, De, 1, t)), S = ts.map((t) => F.atom(c, De, 1, t).S);
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.58, xmin: 0, xmax: Tm, ymin: 0, ymax: 1.02, xlabel: '', ylabel: 'P_e(t): átomo excitado', ml: 56, mr: 10, mb: 8, title: 'Oscilaciones de Rabi' });
      p1.frame(); p1.xy(ts, pe, { color: '--accent', width: 1.6 }); p1.hline(0.5, { color: '--ink-3', dash: [4, 3] });
      if (sim.p.k === 'coh' && De === 0) { p1.vline(tr, { color: '--c3', dash: [5, 3] }); p1.vline(2 * tr, { color: '--c3', dash: [5, 3] }); }
      const p2 = new EM.Plot(ctx, { x: 0, y: H * 0.6, w: W, h: H * 0.4, xmin: 0, xmax: Tm, ymin: 0, ymax: 1.02, xlabel: 'g t', ylabel: 'S átomo–campo (bits)', ml: 56, mr: 10, title: '' });
      p2.frame(); p2.xy(ts, S, { color: '--c2', width: 1.8 }); if (sim.p.k === 'coh' && De === 0) p2.vline(tr / 2, { color: '--c3', dash: [5, 3] });
      let best = -1, bt = 0; ts.forEach((t, i) => { if (t > 0.7 * tr && t < 1.3 * tr && pe[i] > best) { best = pe[i]; bt = t; } });
      sim.set('t', `t_c = ${EM.fix(F.tCollapse(1), 4)} · t_r = ${EM.fix(tr, 3)}${sim.p.k === 'fock' ? ' (un estado de Fock no tiene revivals: una sola frecuencia)' : ''}`);
      sim.set('p', sim.p.k === 'coh' ? `t = ${EM.fix(bt, 3)} (${EM.fix(bt / tr, 3)} t_r) · P_e = ${EM.fix(best, 4)} · P_e(3/g) = ${EM.fix(F.pe(c, De, 1, 3), 4)}` : `oscilación pura: P_e(t) = 1 − 4(n+1)/Ω² sen²(Ωt/2)`);
      sim.set('s', `${EM.fix(Math.max(...S), 4)} · S(t_r/2) = ${EM.fix(F.atom(c, De, 1, tr / 2).S, 4)}`);
    });
  });

  /* 35.2 Estados vestidos y oscilaciones de Rabi del vacío */
  EM.defineSim('jc-vestidos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Fotones n de la variedad {|e,n⟩, |g,n+1⟩}', min: 0, max: 9, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.slider('De', { label: 'Desintonía Δ/g', min: 0, max: 6, step: 0.05, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('e', 'Doblete vestido E<sub>±</sub> = ±Ω<sub>n</sub>/2, Ω<sub>n</sub> = √(Δ² + 4g²(n+1)) · desdoblamiento en resonancia 2g√(n+1) (vacío de Rabi: 2g)', { hl: true });
    sim.out('p', 'Transferencia máxima e → g: 4g²(n+1)/Ω<sub>n</sub>² · periodo de P<sub>e</sub>: 2π/Ω<sub>n</sub> (en unidades de 1/g)');
    sim.out('c', 'Estados vestidos: |±,n⟩ = cos|e,n⟩ ± sen|g,n+1⟩ con tg 2θ<sub>n</sub> = 2g√(n+1)/Δ');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(sim.p.n), De = sim.p.De, Om = F.Omega(n, De, 1), Ds = Array.from({ length: 241 }, (_, i) => -6 + (12 * i) / 240);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -6, xmax: 6, ymin: -7, ymax: 7, xlabel: 'Δ/g', ylabel: 'energía (g)', ml: 48, mr: 10, title: 'Cruce evitado de |e,n⟩ y |g,n+1⟩' });
      pl.frame(); pl.xy(Ds, Ds.map((d) => d / 2), { color: '--ink-3', width: 1, dash: [4, 3] }); pl.xy(Ds, Ds.map((d) => -d / 2), { color: '--ink-3', width: 1, dash: [4, 3] });
      for (const m of [Math.max(0, n - 1), n, n + 1]) { if (m === n) continue; pl.xy(Ds, Ds.map((d) => F.Omega(m, d, 1) / 2), { color: '--ink-3', width: 0.8 }); pl.xy(Ds, Ds.map((d) => -F.Omega(m, d, 1) / 2), { color: '--ink-3', width: 0.8 }); }
      pl.xy(Ds, Ds.map((d) => F.Omega(n, d, 1) / 2), { color: '--accent', width: 2.4 }); pl.xy(Ds, Ds.map((d) => -F.Omega(n, d, 1) / 2), { color: '--c2', width: 2.4 }); pl.vline(De, { color: '--c3', dash: [3, 3] });
      const Tm = Math.max(10, 3 * ((2 * PI) / Om)), ts = Array.from({ length: 400 }, (_, i) => (Tm * i) / 399), pe = ts.map((t) => 1 - ((4 * (n + 1)) / (Om * Om)) * Math.pow(Math.sin((Om * t) / 2), 2)), q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: Tm, ymin: 0, ymax: 1.02, xlabel: 'g t', ylabel: 'P_e(t)', ml: 44, mr: 10, title: `Oscilación de Rabi con n = ${n}` });
      q.frame(); q.xy(ts, pe, { color: '--accent', width: 2.2 });
      const th = 0.5 * Math.atan2(2 * Math.sqrt(n + 1), De);
      sim.set('e', `Ω_${n} = ${EM.fix(Om, 4)} g · desdoblamiento en resonancia ${EM.fix(2 * Math.sqrt(n + 1), 4)} g · energías ±${EM.fix(Om / 2, 4)} g`);
      sim.set('p', `${EM.fix((4 * (n + 1)) / (Om * Om), 4)} · periodo ${EM.fix((2 * PI) / Om, 4)} /g`);
      sim.set('c', `θ_${n} = ${EM.fix((th * 180) / PI, 2)}° (${De === 0 ? '45°: mezcla igual de |e⟩ y |g⟩' : 'a Δ grande tiende a 0°'})`);
    });
  });

  /* 35.3 Wigner del campo: el gato en el revival */
  EM.defineSim('jc-wigner', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('nb', { label: 'Fotones medios n̄ (campo coherente inicial, átomo en |e⟩)', min: 2, max: 16, step: 1, value: 9, fmt: (v) => v.toFixed(0) });
    sim.slider('tt', { label: 'Tiempo t/t_r (t_r = 2π√n̄/g, resonancia)', min: 0, max: 1.2, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('r', 'Pureza del átomo = pureza del campo (descomposición de Schmidt) · entropía de entrelazamiento (bits) · P<sub>e</sub>', { hl: true });
    sim.out('w', 'Valor mínimo de W (negativo: no clásico) · volumen negativo δ = ∬(|W| − W)/2');
    sim.out('i', 'En t<sub>r</sub>/2 el átomo se desacopla casi puro y el campo queda en un gato de Schrödinger: dos paquetes opuestos y franjas de interferencia entre ellos');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, nb = sim.p.nb, tr = F.tRevival(nb, 1), t = sim.p.tt * tr, c = F.cohAmps(nb, 70), Lg = Math.SQRT2 * (Math.sqrt(nb) + 3.2), M = 90, d = (2 * Lg) / M;
      EM.draw.clear(cv);
      const Wg = F.fieldWigner(c, 0, 1, t, Lg, M); let mn = 0, mx = 0, neg = 0, sum = 0; for (const v of Wg) { mn = Math.min(mn, v); mx = Math.max(mx, v); neg += ((Math.abs(v) - v) / 2) * d * d; sum += v * d * d; }
      const sc = Math.max(Math.abs(mn), Math.abs(mx)) || 1, sz = Math.min(W * 0.56, H - 30), x0 = W * 0.02, y0 = (H - sz) / 2;
      EM.heat(ctx, { x: x0, y: y0, w: sz, h: sz }, M, M, (ix, iy) => Wg[(M - 1 - iy) * M + ix] / sc, { cmap: 'div' });
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.35); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0 + sz / 2, y0); ctx.lineTo(x0 + sz / 2, y0 + sz); ctx.moveTo(x0, y0 + sz / 2); ctx.lineTo(x0 + sz, y0 + sz / 2); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'ξ', x0 + sz - 4, y0 + sz / 2 - 6, { size: 11, color: '--ink-2', align: 'right' }); EM.text(ctx, 'π', x0 + sz / 2 + 6, y0 + 12, { size: 11, color: '--ink-2' });
      const ts = Array.from({ length: 241 }, (_, i) => (1.2 * tr * i) / 240), S = ts.map((x) => F.atom(c, 0, 1, x).S), pe = ts.map((x) => F.pe(c, 0, 1, x));
      const pl = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 1.2, ymin: 0, ymax: 1.02, xlabel: 't / t_r', ylabel: 'S (bits) y P_e', ml: 46, mr: 8, title: 'Átomo y entrelazamiento' });
      pl.frame(); pl.xy(ts.map((x) => x / tr), pe, { color: '--accent', width: 1.4 }); pl.xy(ts.map((x) => x / tr), S, { color: '--c2', width: 2.2 }); pl.vline(sim.p.tt, { color: '--c3', dash: [4, 3] });
      pl.legend([{ label: 'P_e', color: '--accent' }, { label: 'S', color: '--c2' }], 'br');
      const at = F.atom(c, 0, 1, t);
      sim.set('r', `Tr ρ² = ${EM.fix(at.purity, 4)} · S = ${EM.fix(at.S, 4)} · P_e = ${EM.fix(at.ee, 4)}`);
      sim.set('w', `${EM.fix(mn, 4)} · δ = ${EM.fix(neg, 4)} · ∬W = ${EM.fix(sum, 4)}`);
    });
  });
})();
