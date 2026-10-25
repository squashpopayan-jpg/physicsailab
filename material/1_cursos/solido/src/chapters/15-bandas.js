/* Capítulo 15 — Bandas reales */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, DATA = EM.data;
  const PI = Math.PI;

  /* 15.1 Llenado de dos bandas */
  EM.defineSim('llenado', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Z', { label: 'Electrones por celda', min: 0.2, max: 3.8, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('G', { label: 'Separación entre bandas (negativa: superposición)', min: -3, max: 4, step: 0.05, value: 1.5, unit: 't', fmt: (v) => v.toFixed(2) });
    sim.out('c', 'Clasificación', { hl: true });
    sim.out('n', 'Portadores por celda');
    const NK = 120;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const e1 = [], e2 = [];
      for (let i = 0; i < NK; i++) for (let j = 0; j < NK; j++) {
        const kx = -PI + (2 * PI * (i + 0.5)) / NK, ky = -PI + (2 * PI * (j + 0.5)) / NK, s = Math.cos(kx) + Math.cos(ky);
        e1.push(-2 * s - 4 - p.G / 2); e2.push(-2 * s + 4 + p.G / 2);
      }
      const all = e1.concat(e2).sort((a, b) => a - b);
      const nocc = Math.round((p.Z / 2) * NK * NK);
      const EF = nocc <= 0 ? all[0] - 1e-9 : nocc >= all.length ? all[all.length - 1] : 0.5 * (all[nocc - 1] + all[nocc]);
      const lo = -8 - Math.max(0, p.G / 2) - 1, hi = 8 + Math.max(0, p.G / 2) + 1;
      const wl = W * 0.4;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1, ymin: lo, ymax: hi, xticks: [], xlabel: 'densidad de estados', ylabel: 'E/t' });
      pl.frame();
      const nb = 80, h1 = new Float64Array(nb), h2 = new Float64Array(nb);
      for (const e of e1) { const b = Math.floor(((e - lo) / (hi - lo)) * nb); if (b >= 0 && b < nb) h1[b]++; }
      for (const e of e2) { const b = Math.floor(((e - lo) / (hi - lo)) * nb); if (b >= 0 && b < nb) h2[b]++; }
      const mx = Math.max(...h1, ...h2);
      for (let b = 0; b < nb; b++) {
        const E0 = lo + (b * (hi - lo)) / nb, E1 = lo + ((b + 1) * (hi - lo)) / nb, y0 = pl.Y(E1), y1 = pl.Y(E0);
        const occ = E1 <= EF;
        ctx.fillStyle = EM.alpha('--c1', occ ? 0.85 : 0.25); ctx.fillRect(pl.ix, y0, (h1[b] / mx) * pl.iw * 0.48, y1 - y0 - 0.5);
        ctx.fillStyle = EM.alpha('--c2', occ ? 0.85 : 0.25); ctx.fillRect(pl.ix + pl.iw * 0.5, y0, (h2[b] / mx) * pl.iw * 0.48, y1 - y0 - 0.5);
      }
      pl.hline(EF, { color: '--accent', dash: [], width: 2, label: 'E_F' });
      /* mapas de ocupación de las dos bandas */
      const size = Math.min((W - wl - 40) / 2, H - 30) - 4;
      const bg = EM.rgb('--canvas');
      for (const [arr, col, k] of [[e1, '--c1', 0], [e2, '--c2', 1]]) {
        const vals = new Float32Array(NK * NK);
        for (let q = 0; q < NK * NK; q++) vals[q] = arr[q] <= EF ? 1 : 0;
        const r = { x: wl + 15 + k * (size + 15), y: 22, w: size, h: size }, c = EM.rgb(col);
        D.paint(ctx, vals, NK, NK, r, (v) => (v ? c : c.map((x, i) => 0.15 * x + 0.85 * bg[i])), { smooth: false });
        ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
        EM.text(ctx, k ? 'banda 2 (ocupado: color)' : 'banda 1 (ocupado: color)', r.x, 15, { size: 11.5, color: '--ink-2' });
      }
      const n1 = e1.filter((e) => e <= EF).length / (NK * NK), n2 = e2.filter((e) => e <= EF).length / (NK * NK);
      const holes = 1 - n1, elec = n2;
      let cls;
      if (holes < 1e-3 && elec < 1e-3) cls = p.G > 0 ? (p.G > 3 ? 'aislante: banda 1 llena, brecha ' + EM.fix(p.G, 2) + ' t' : 'semiconductor: banda 1 llena, brecha ' + EM.fix(p.G, 2) + ' t') : 'aislante';
      else if (holes > 1e-3 && elec > 1e-3 && Math.abs(holes - elec) < 0.02) cls = 'semimetal: bolsillos de huecos y de electrones';
      else cls = 'metal: banda parcialmente llena';
      if (n1 < 1e-3 && n2 < 1e-3) cls = 'bandas vacías';
      sim.set('c', cls);
      sim.set('n', 'huecos en la banda 1: ' + EM.fix(2 * holes, 3) + ' · electrones en la banda 2: ' + EM.fix(2 * elec, 3));
    });
  });

  /* 15.3 Pseudopotencial empírico */
  const cache = new Map();
  EM.defineSim('epm', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('m', { label: 'Material', options: Object.keys(DATA.epm).map((k) => [k, k]), value: 'Si' });
    sim.seg('ec', { label: 'Corte de energía cinética', options: [[11, '11 (2π/a)²'], [14, '14'], [18, '18']], value: 14 });
    sim.out('g', 'Transición directa en Γ', { hl: true });
    sim.out('ind', 'Mínimo de conducción');
    sim.out('w', 'Ancho de la banda de valencia');
    sim.out('n', 'Ondas planas en Γ');
    const sp = SS.special('fcc'), path = SS.kpath(sp, ['L', 'Γ', 'X', 'W', 'K', 'Γ'], 26);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const key = p.m + '|' + p.ec;
      if (!cache.has(key)) cache.set(key, path.map((q) => SS.epm(p.m, q.k, +p.ec, 8).E));
      const E = cache.get(key);
      const iG = path.findIndex((q) => q.label === 'Γ');
      const vbm = Math.max(...E.map((e) => e[3]));
      const Es = E.map((e) => e.map((x) => x - vbm));
      D.bands(ctx, { x: 0, y: 0, w: W, h: H }, path, Es, { ymin: -14, ymax: 7, ef: 0, efLabel: 'máximo de valencia', colors: (b) => (b < 4 ? '--c1' : '--c2') });
      let cmin = Infinity, ci = 0;
      Es.forEach((e, i) => { if (e[4] < cmin) { cmin = e[4]; ci = i; } });
      const lab = (i) => { const q = path[i]; if (q.label) return q.label; let a = i, b = i; while (a > 0 && !path[a].label) a--; while (b < path.length - 1 && !path[b].label) b++; return 'entre ' + path[a].label + ' y ' + path[b].label + ' (' + EM.fix((q.s - path[a].s) / (path[b].s - path[a].s), 2) + ')'; };
      sim.set('g', EM.fix(Es[iG][4], 3) + ' eV');
      sim.set('ind', EM.fix(cmin, 3) + ' eV en ' + lab(ci) + (ci === iG ? ' → brecha directa' : ' → brecha indirecta'));
      sim.set('w', EM.fix(-Es[iG][0], 2) + ' eV');
      sim.set('n', String(SS.epm(p.m, [0, 0, 0], +p.ec).n));
    });
  });

  /* 15.4 Brechas */
  EM.defineSim('brechas', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.out('led', 'LED posibles en el visible (directos)', { hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const list = Object.entries(DATA.gaps).sort((a, b) => a[1][0] - b[1][0]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 6, ymin: 0, ymax: list.length, yticks: [], ml: 92, xlabel: 'E_g a 300 K (eV)' });
      pl.frame();
      for (let i = 0; i < 160; i++) { const E = 1.65 + (1.6 * i) / 160; ctx.fillStyle = EM.sd.css(EM.wavelengthRGB(1239.84 / E).map((c) => c / 255), 0.22); ctx.fillRect(pl.X(E), pl.iy, pl.X(E + 0.011) - pl.X(E) + 0.5, pl.ih); }
      const vis = [];
      list.forEach(([name, [Eg, t]], i) => {
        const y = list.length - i - 0.5, bh = pl.ih / list.length;
        const lam = 1239.84 / Eg;
        let col = t === 'd' ? (lam >= 380 && lam <= 780 ? `rgb(${EM.wavelengthRGB(lam).join(',')})` : lam < 380 ? '#7A44C9' : '#8A3030') : EM.col('--ink-3');
        ctx.fillStyle = col; ctx.globalAlpha = 0.85;
        ctx.fillRect(pl.X(0), pl.Y(y) - bh * 0.3, pl.X(Eg) - pl.X(0), bh * 0.6);
        ctx.globalAlpha = 1;
        EM.text(ctx, name, pl.ix - 6, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink-2' });
        EM.text(ctx, Eg + (t === 'd' ? ' d' : ' i'), pl.X(Eg) + 4, pl.Y(y), { size: 10.5, baseline: 'middle', color: '--ink-3' });
        if (t === 'd' && lam >= 380 && lam <= 780) vis.push(name + ' ' + lam.toFixed(0) + ' nm');
      });
      sim.set('led', vis.join(' · '));
    });
  });
})();
