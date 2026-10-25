/* Capítulo 1 — El estado sólido */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, L = EM.lin, D = EM.sd;

  /* 1.2 Potencial entre dos átomos */
  EM.defineSim('potencial-par', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('m', { label: 'Modelo', options: [['lj', 'Lennard-Jones'], ['mo', 'Morse'], ['both', 'Ambos']], value: 'both' });
    sim.slider('a', { label: 'Alcance de Morse a·r₀', min: 2, max: 12, step: 0.1, value: 6.0, fmt: (v) => v.toFixed(1) });
    sim.check('harm', { label: 'Aproximación armónica', value: true });
    sim.check('force', { label: 'Fuerza F = −dU/dr', value: true });
    sim.out('r0', 'Mínimo r₀', { hl: true });
    sim.out('k', 'Constante de fuerza k = U″(r₀)');
    sim.out('ar', 'Argón (ε = 10.4 meV, σ = 3.40 Å): ħω');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r0 = Math.pow(2, 1 / 6), ar = p.a / r0;
      const lj = (r) => 4 * (Math.pow(r, -12) - Math.pow(r, -6));
      const mo = (r) => Math.pow(1 - Math.exp(-ar * (r - r0)), 2) - 1;
      const kLJ = 36 * Math.pow(2, 2 / 3), kMo = 2 * ar * ar;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.85, xmax: 2.6, ymin: -1.6, ymax: 2.2, xlabel: 'r/σ', ylabel: 'U/ε   (y F·σ/ε)' });
      pl.frame();
      pl.hline(0, { dash: [], color: '--grid-2' });
      const show = (k) => p.m === 'both' || p.m === k;
      if (show('lj')) {
        pl.fn(lj, { color: '--c1', width: 2.4, n: 500 });
        if (p.force) pl.fn((r) => 4 * (12 * Math.pow(r, -13) - 6 * Math.pow(r, -7)), { color: '--c1', width: 1.4, dash: [6, 4], n: 500 });
        if (p.harm) pl.fn((r) => -1 + 0.5 * kLJ * (r - r0) * (r - r0), { color: '--c1', width: 1.2, dash: [2, 3], alpha: 0.8, from: r0 - 0.3, to: r0 + 0.3 });
      }
      if (show('mo')) {
        pl.fn(mo, { color: '--c2', width: 2.4, n: 500 });
        if (p.force) pl.fn((r) => -2 * ar * (1 - Math.exp(-ar * (r - r0))) * Math.exp(-ar * (r - r0)), { color: '--c2', width: 1.4, dash: [6, 4], n: 500 });
        if (p.harm) pl.fn((r) => -1 + 0.5 * kMo * (r - r0) * (r - r0), { color: '--c2', width: 1.2, dash: [2, 3], alpha: 0.8, from: r0 - 0.3, to: r0 + 0.3 });
      }
      pl.vline(r0, { label: 'r₀ = 2^{1/6}σ', color: '--ink-3' });
      const items = [];
      if (show('lj')) items.push({ label: 'Lennard-Jones', color: '--c1' });
      if (show('mo')) items.push({ label: 'Morse', color: '--c2' });
      if (p.force) items.push({ label: 'fuerza (discontinua)', color: '--ink-3', dash: [6, 4] });
      pl.legend(items, 'tr');
      sim.ctl.a.show(p.m !== 'lj');
      sim.set('r0', '1.122 σ = 3.82 Å para el argón');
      sim.set('k', (show('lj') ? 'LJ: ' + EM.fix(kLJ, 1) + ' ε/σ²' : '') + (p.m === 'both' ? ' · ' : '') + (show('mo') ? 'Morse: ' + EM.fix(kMo, 1) + ' ε/σ²' : ''));
      const eps = 0.0104 * SS.e, sig = 3.4e-10, mu = (39.948 * SS.u) / 2;
      const kk = (p.m === 'mo' ? kMo : kLJ) * eps / (sig * sig), w = Math.sqrt(kk / mu);
      sim.set('ar', EM.fix((SS.hbar * w) / SS.e * 1000, 2) + ' meV = ' + EM.fix((SS.hbar * w) / SS.e * 1000 / SS.cm1meV, 1) + ' cm⁻¹ (k = ' + EM.fix(kk, 2) + ' N/m)');
    });
  });

  /* 1.4 De N átomos a una banda */
  EM.defineSim('atomos-bandas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de átomos N', min: 1, max: 60, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación d (unidades de d₀)', min: 0.6, max: 3, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.check('p', { label: 'Incluir el nivel p', value: true });
    sim.out('w', 'Ancho de la banda s a esta d', { hl: true });
    sim.out('ov', 'Bandas s y p');
    sim.out('nst', 'Estados por banda (con espín)');
    const es = -6, ep = 0, ts0 = 1.0, tp0 = 1.6, lam = 0.45;
    const levels = (N, d, eps, t0, sgn) => {
      if (N === 1) return [eps];
      const t = t0 * Math.exp(-(d - 1) / lam);
      const a = new Float64Array(N).fill(eps), b = new Float64Array(N - 1).fill(-sgn * t);
      return L.triEig(a, b);
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N);
      EM.draw.clear(cv);
      const wl = W * 0.74;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0.6, xmax: 3, ymin: -13, ymax: 9, xlabel: 'separación d/d₀', ylabel: 'energía (eV)' });
      pl.frame();
      const ds = EM.M.linspace(0.6, 3, 120);
      const draw = (eps, t0, sgn, col) => {
        const E = ds.map((d) => levels(N, d, eps, t0, sgn));
        for (let j = 0; j < N; j++) pl.xy(ds, E.map((e) => e[j]), { color: col, width: N > 20 ? 0.8 : 1.4, alpha: N > 20 ? 0.6 : 1 });
      };
      draw(es, ts0, 1, '--c1');
      if (p.p) draw(ep, tp0, -1, '--c2');
      pl.vline(p.d, { color: '--accent', width: 1.6, dash: [] });
      /* DOS a la separación elegida */
      const Es = levels(N, p.d, es, ts0, 1), Ep = p.p ? levels(N, p.d, ep, tp0, -1) : [];
      const pr = { x: wl + 6, y: pl.iy, w: W - wl - 12, h: pl.ih };
      ctx.strokeStyle = EM.col('--rule'); ctx.strokeRect(pr.x + 0.5, pr.y + 0.5, pr.w, pr.h);
      const nb = 70, hs = new Float64Array(nb), hp = new Float64Array(nb);
      const bin = (E) => Math.floor(((9 - E) / 22) * nb);
      Es.forEach((E) => { const b = bin(E); if (b >= 0 && b < nb) hs[b]++; });
      Ep.forEach((E) => { const b = bin(E); if (b >= 0 && b < nb) hp[b]++; });
      const mx = Math.max(1, ...hs, ...hp);
      for (let b = 0; b < nb; b++) {
        const y = pr.y + (b / nb) * pr.h, hh = pr.h / nb;
        ctx.fillStyle = EM.alpha('--c1', 0.75); ctx.fillRect(pr.x, y, (hs[b] / mx) * pr.w, hh - 0.5);
        ctx.fillStyle = EM.alpha('--c2', 0.65); ctx.fillRect(pr.x + (hs[b] / mx) * pr.w, y, (hp[b] / mx) * pr.w, hh - 0.5);
      }
      EM.text(ctx, 'niveles en d', pr.x + pr.w / 2, pr.y - 4, { size: 11, align: 'center', color: '--ink-3' });
      const ws = Es[Es.length - 1] - Es[0];
      sim.set('w', N === 1 ? '0 (un átomo)' : EM.fix(ws, 3) + ' eV (límite N → ∞: 4t = ' + EM.fix(4 * ts0 * Math.exp(-(p.d - 1) / lam), 3) + ' eV)');
      if (p.p) {
        const top = Es[Es.length - 1], bot = Ep[0];
        sim.set('ov', bot < top ? 'superpuestas (' + EM.fix(top - bot, 2) + ' eV)' : 'separadas por una brecha de ' + EM.fix(bot - top, 2) + ' eV');
      } else sim.set('ov', 'solo nivel s');
      sim.set('nst', '2N = ' + 2 * N);
    });
  });

  /* 1.5 Resistividades */
  EM.defineSim('resistividades', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 500, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('cu', 'Cobre ρ(T)', { hl: true });
    sim.out('si', 'Silicio puro ρ(T)');
    sim.out('ra', 'Razón Si/Cu');
    const M = [
      ['Plata', 1.59e-8, 'm'], ['Cobre', 1.68e-8, 'm'], ['Oro', 2.44e-8, 'm'], ['Aluminio', 2.65e-8, 'm'], ['Hierro', 9.7e-8, 'm'], ['Nicromo', 1.10e-6, 'm'],
      ['Grafito (en el plano)', 2.5e-6, 'm'], ['Germanio puro', 0.47, 's'], ['Silicio dopado 10¹⁵ P', 4.4e-2, 's'], ['Silicio puro', 3.1e3, 's'],
      ['Agua pura', 1.8e5, 'i'], ['Vidrio', 1e11, 'i'], ['Diamante', 1e13, 'i'], ['Cuarzo fundido', 7.5e17, 'i'], ['Teflón', 1e23, 'i']
    ];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T;
      EM.draw.clear(cv);
      const rCu = 1.68e-8 * (1 + 3.93e-3 * (T - 293));
      const ni = SS.ni('Si', T), rSi = 1 / (SS.e * ni * 1e6 * (SS.mobilityT(0, T, 'n') + SS.mobilityT(0, T, 'p')) * 1e-4);
      const rows = M.map((m) => (m[0] === 'Cobre' ? [m[0], rCu, 'm'] : m[0] === 'Silicio puro' ? [m[0], rSi, 's'] : m));
      const ml = Math.min(170, W * 0.36);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e-9, xmax: 1e25, xlog: true, ymin: 0, ymax: rows.length, ml, mb: 38, yticks: [], xlabel: 'resistividad a T (Ω·m), escala logarítmica', grid: true });
      pl.frame();
      const col = { m: '--c1', s: '--c3', i: '--c2' };
      rows.forEach(([name, r, k], i) => {
        const y = rows.length - i - 0.5, bh = pl.ih / rows.length;
        const x0 = pl.X(1e-9), x1 = pl.X(r);
        ctx.fillStyle = EM.alpha(col[k], 0.75);
        ctx.fillRect(x0, pl.Y(y) - bh * 0.32, x1 - x0, bh * 0.64);
        EM.text(ctx, name, pl.ix - 6, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink-2' });
      });
      pl.legend([{ label: 'metales', color: '--c1', kind: 'sq' }, { label: 'semiconductores', color: '--c3', kind: 'sq' }, { label: 'aislantes', color: '--c2', kind: 'sq' }], 'tr');
      sim.set('cu', EM.sci(rCu, 3) + ' Ω·m');
      sim.set('si', EM.sci(rSi, 3) + ' Ω·m (n_i = ' + EM.sci(ni, 3) + ' cm⁻³)');
      sim.set('ra', EM.sci(rSi / rCu, 2));
    });
  });
})();
