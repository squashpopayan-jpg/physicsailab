/* Capítulo 23 — Heteroestructuras y nanoestructuras */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss;
  const PI = Math.PI;

  /* 23.1 Alineamiento de bandas: afinidad electrónica χ y brecha (eV, 300 K) */
  const ALIN = { Si: [4.05, 1.12], Ge: [4.0, 0.66], GaAs: [4.07, 1.42], AlAs: [3.5, 2.16], InP: [4.38, 1.34], InAs: [4.9, 0.354], GaSb: [4.06, 0.73], InSb: [4.59, 0.17], GaN: [4.1, 3.39], ZnO: [4.35, 3.37] };
  EM.defineSim('alineamiento', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('a', { label: 'Material 1', options: Object.keys(ALIN).map((k) => [k, k]), value: 'GaAs' });
    sim.select('b', { label: 'Material 2', options: Object.keys(ALIN).map((k) => [k, k]), value: 'AlAs' });
    sim.out('t', 'Tipo de alineamiento', { hl: true });
    sim.out('dE', 'ΔE_c, ΔE_v (2 respecto de 1)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [c1, g1] = ALIN[p.a], [c2, g2] = ALIN[p.b];
      const Ec1 = -c1, Ev1 = -c1 - g1, Ec2 = -c2, Ev2 = -c2 - g2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 2, ymin: -9, ymax: 0.4, xticks: [], ylabel: 'energía respecto del vacío (eV)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', label: 'vacío', dash: [] });
      const box = (x0, x1, Ec, Ev) => {
        ctx.fillStyle = EM.alpha('--c2', 0.25); ctx.fillRect(pl.X(x0), pl.Y(Ec + 0.6), pl.X(x1) - pl.X(x0), pl.Y(Ec) - pl.Y(Ec + 0.6));
        ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.fillRect(pl.X(x0), pl.Y(Ev), pl.X(x1) - pl.X(x0), pl.Y(Ev - 0.6) - pl.Y(Ev));
        ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pl.X(x0), pl.Y(Ec)); ctx.lineTo(pl.X(x1), pl.Y(Ec)); ctx.moveTo(pl.X(x0), pl.Y(Ev)); ctx.lineTo(pl.X(x1), pl.Y(Ev)); ctx.stroke();
      };
      box(0.05, 0.95, Ec1, Ev1); box(1.05, 1.95, Ec2, Ev2);
      EM.text(ctx, p.a, pl.X(0.5), pl.Y(-8.3), { size: 14, weight: 700, align: 'center', color: '--ink' });
      EM.text(ctx, p.b, pl.X(1.5), pl.Y(-8.3), { size: 14, weight: 700, align: 'center', color: '--ink' });
      EM.text(ctx, 'E_c = −χ', pl.X(0.08), pl.Y(Ec1) - 6, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'E_v', pl.X(0.08), pl.Y(Ev1) + 14, { size: 11, color: '--ink-2' });
      let t;
      const lo1 = Ev1, hi1 = Ec1, lo2 = Ev2, hi2 = Ec2;
      if ((lo2 <= lo1 && hi2 >= hi1) || (lo1 <= lo2 && hi1 >= hi2)) t = 'tipo I (una brecha contenida en la otra)';
      else if (hi1 < lo2 || hi2 < lo1) t = 'tipo III (brechas separadas)';
      else t = 'tipo II (escalonado)';
      sim.set('t', t);
      sim.set('dE', EM.fix(Ec2 - Ec1, 3) + ' eV, ' + EM.fix(Ev2 - Ev1, 3) + ' eV');
    });
  });

  /* 23.2 Pozo cuántico finito */
  EM.defineSim('pozo-cuantico', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('L', { label: 'Ancho del pozo L', min: 1, max: 30, step: 0.1, value: 10, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.slider('x', { label: 'Aluminio en la barrera x', min: 0.05, max: 0.45, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.out('V0', 'Profundidad V₀ = 0.65 ΔE_g', { hl: true });
    sim.out('E', 'Niveles (meV)');
    sim.out('inf', 'Pozo infinito (meV)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const V0 = 0.65 * 1.247 * p.x, m = 0.067, lev = SS.wellFinite(V0, p.L, m);
      const xr = p.L / 2 + Math.max(4, p.L * 0.6);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -xr, xmax: xr, ymin: -0.02 * V0 * 1000, ymax: V0 * 1000 * 1.25, xlabel: 'z (nm)', ylabel: 'E (meV)' });
      pl.frame();
      pl.xy([-xr, -p.L / 2, -p.L / 2, p.L / 2, p.L / 2, xr], [V0 * 1000, V0 * 1000, 0, 0, V0 * 1000, V0 * 1000], { color: '--ink', width: 2 });
      const c2 = SS.HB2M / m;
      const cols = ['--c1', '--c2', '--c3', '--c5', '--c4', '--c6'];
      lev.forEach((lv, i) => {
        const E = lv.E, k = Math.sqrt(E / c2), kap = Math.sqrt((V0 - E) / c2), even = lv.parity === 'par';
        const inside = (z) => (even ? Math.cos(k * z) : Math.sin(k * z));
        const edge = inside(p.L / 2);
        const psi = (z) => (Math.abs(z) <= p.L / 2 ? inside(z) : Math.sign(z) ** (even ? 0 : 1) * edge * Math.exp(-kap * (Math.abs(z) - p.L / 2)));
        const sc = V0 * 1000 * 0.12;
        pl.hline(E * 1000, { color: '--grid-2', dash: [2, 2] });
        pl.fn((z) => E * 1000 + sc * psi(z), { color: cols[i % 6], width: 2, n: 500 });
      });
      for (let n = 1; n <= 6; n++) { const e = SS.wellInf(n, p.L, m) * 1000; if (e < V0 * 1250) { ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(pl.X(-p.L / 2), pl.Y(e)); ctx.lineTo(pl.X(p.L / 2), pl.Y(e)); ctx.stroke(); ctx.restore(); } }
      sim.set('V0', EM.fix(V0 * 1000, 1) + ' meV');
      sim.set('E', lev.map((l) => EM.fix(l.E * 1000, 1)).join(', '));
      sim.set('inf', [1, 2, 3].map((n) => EM.fix(SS.wellInf(n, p.L, m) * 1000, 1)).join(', '));
    });
  });

  /* 23.3 DOS por dimensión */
  EM.defineSim('dos-dimension', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('d', { label: 'Dimensiones libres', options: [[3, '3 (volumen)'], [2, '2 (pozo)'], [1, '1 (hilo)'], [0, '0 (punto)']], value: 2 });
    sim.out('lv', 'Niveles de confinamiento', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = +p.d;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 20, ymin: 0, ymax: 6, xlabel: 'E (ħ²π²/2m*L²)', ylabel: 'g(E) (u. arb.)' });
      pl.frame();
      /* niveles de confinamiento en 3 − d direcciones */
      const conf = new Set();
      const nc = 3 - d;
      for (let a = 1; a <= 5; a++) for (let b = 1; b <= (nc >= 2 ? 5 : 1); b++) for (let c = 1; c <= (nc >= 3 ? 5 : 1); c++) {
        const e = a * a * (nc >= 1 ? 1 : 0) + (nc >= 2 ? b * b : 0) + (nc >= 3 ? c * c : 0);
        if (nc === 0) continue;
        conf.add(e);
      }
      const lv = nc === 0 ? [0] : Array.from(conf).sort((x, y) => x - y);
      pl.fn((E) => Math.sqrt(Math.max(E, 0)) * 0.6, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      if (d === 3) pl.fn((E) => Math.sqrt(E) * 0.6, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.12 });
      else if (d === 2) pl.fn((E) => 0.55 * lv.filter((e) => E >= e).length, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.12, n: 1200 });
      else if (d === 1) pl.fn((E) => 0.5 * lv.reduce((s, e) => s + (E > e ? 1 / Math.sqrt(E - e) : 0), 0), { color: '--c1', width: 2.2, n: 2000 });
      else for (const e of lv) { pl.vline(e, { color: '--c1', dash: [], width: 3 }); }
      sim.set('lv', d === 3 ? 'ninguno (continuo)' : lv.slice(0, 8).join(', ') + (lv.length > 8 ? '…' : ''));
    });
  });

  /* 23.4 Puntos cuánticos */
  EM.defineSim('puntos-cuanticos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Radio del nanocristal', min: 1.2, max: 6, step: 0.05, value: 2.5, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.out('E', 'Energía de emisión', { hl: true });
    sim.out('t', 'Confinamiento / Coulomb');
    const Eg = 1.74, me = 0.13, mh = 0.45, er = 10.6;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wl = W * 0.62;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 1.2, xmax: 6, ymin: 1.5, ymax: 3.4, xlabel: 'R (nm)', ylabel: 'E (eV)' });
      pl.frame();
      pl.fn((R) => SS.brus(Eg, R, me, mh, er), { color: '--c1', width: 2.6 });
      pl.hline(Eg, { label: 'E_g del CdSe en volumen', color: '--ink-3' });
      for (let R = 1.3; R <= 6; R += 0.1) { const E = SS.brus(Eg, R, me, mh, er), l = 1239.84 / E; if (l >= 380 && l <= 780) { ctx.fillStyle = `rgb(${EM.wavelengthRGB(l).join(',')})`; ctx.fillRect(pl.X(R) - 3, pl.Y(1.5) - 10, 6, 8); } }
      pl.vline(p.R, { color: '--accent' });
      const E = SS.brus(Eg, p.R, me, mh, er), l = 1239.84 / E;
      const cx = wl + (W - wl) / 2, cy = H / 2, rr = Math.min((W - wl) / 2 - 16, H / 2 - 16) * (p.R / 6);
      const col = l >= 380 && l <= 780 ? `rgb(${EM.wavelengthRGB(l).join(',')})` : '#7A44C9';
      const g = ctx.createRadialGradient(cx, cy, rr * 0.2, cx, cy, rr * 1.6);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr * 1.6, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke();
      /* átomos: espaciado ~0.3 nm */
      const sp = (0.3 / 6) * Math.min((W - wl) / 2 - 16, H / 2 - 16);
      ctx.fillStyle = EM.alpha('--ink', 0.5);
      for (let x = -rr; x <= rr; x += sp) for (let y = -rr; y <= rr; y += sp) if (x * x + y * y < rr * rr) ctx.fillRect(cx + x - 0.8, cy + y - 0.8, 1.6, 1.6);
      EM.text(ctx, 'diámetro ' + EM.fix(2 * p.R, 1) + ' nm', cx, H - 12, { size: 12, align: 'center', color: '--ink-2' });
      const conf = (SS.HB2M * PI * PI) / (p.R * p.R) * (1 / me + 1 / mh), coul = (1.786 * SS.COUL) / (er * p.R * 10);
      sim.set('E', EM.fix(E, 3) + ' eV → ' + EM.fix(l, 0) + ' nm');
      sim.set('t', '+' + EM.fix(conf, 3) + ' eV / −' + EM.fix(coul, 3) + ' eV');
    });
  });

  /* 23.5 Superred */
  EM.defineSim('superred', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Ancho del pozo (GaAs)', min: 2, max: 12, step: 0.1, value: 5, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.slider('b', { label: 'Ancho de la barrera (Al₀.₃Ga₀.₇As)', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.out('w', 'Ancho de la primera miniband', { hl: true });
    sim.out('g', 'Minibrecha');
    const V0 = 0.65 * 1.247 * 0.3, m = 0.067;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = p.a + p.b;
      EM.draw.clear(cv);
      const bands = SS.kpBands(V0, p.a, p.b, 0.6, m, 3000).filter((q) => q[0] < 0.4);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -1, xmax: 1, ymin: 0, ymax: 400, xlabel: 'k (π/d)', ylabel: 'E (meV)' });
      pl.frame();
      for (const [e0, e1] of bands) { ctx.fillStyle = EM.alpha('--accent', 0.14); ctx.fillRect(pl.ix, pl.Y(e1 * 1000), pl.iw, pl.Y(e0 * 1000) - pl.Y(e1 * 1000)); }
      const xs = EM.M.linspace(-1, 1, 121), E = xs.map((x) => SS.kpE((x * PI) / d, V0, p.a, p.b, bands, m));
      for (let b = 0; b < bands.length; b++) pl.xy(xs, E.map((e) => e[b] * 1000), { color: '--c1', width: 2.4 });
      pl.hline(V0 * 1000, { color: '--c2', label: 'V₀', dash: [5, 4] });
      /* abanico frente al espesor de barrera */
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0.5, xmax: 10, ymin: 0, ymax: 400, xlabel: 'ancho de la barrera (nm)', ylabel: '', ml: 30 });
      p2.frame();
      for (let bb = 0.5; bb <= 10; bb += 0.1) { const bs = SS.kpBands(V0, p.a, bb, 0.6, m, 1500).filter((q) => q[0] < 0.4); for (const [e0, e1] of bs) { ctx.fillStyle = EM.alpha('--c1', 0.7); ctx.fillRect(p2.X(bb) - 1.5, p2.Y(e1 * 1000), 3, Math.max(1, p2.Y(e0 * 1000) - p2.Y(e1 * 1000))); } }
      p2.vline(p.b, { color: '--accent' });
      sim.set('w', bands[0] ? EM.fix((bands[0][1] - bands[0][0]) * 1000, 2) + ' meV' : '—');
      sim.set('g', bands[1] ? EM.fix((bands[1][0] - bands[0][1]) * 1000, 1) + ' meV' : 'una sola miniband ligada');
    });
  });
})();
