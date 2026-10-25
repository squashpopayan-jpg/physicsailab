/* Capítulo 13 — Electrones casi libres */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI;

  /* 13.2 Dos ondas frente a ecuación central */
  EM.defineSim('dos-ondas', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('U1', { label: 'U₁ (unidades de ħ²(2π/a)²/2m)', min: -0.3, max: 0.3, step: 0.005, value: -0.08, fmt: (v) => v.toFixed(3) });
    sim.slider('U2', { label: 'U₂', min: -0.2, max: 0.2, step: 0.005, value: 0.03, fmt: (v) => v.toFixed(3) });
    sim.seg('z', { label: 'Esquema', options: [['r', 'Zona reducida'], ['e', 'Zona extendida']], value: 'r' });
    sim.check('two', { label: 'Aproximación de dos ondas', value: true });
    sim.out('g1', 'Brecha en k = π/a', { hl: true });
    sim.out('g2', 'Brecha en k = 0 (2.ª)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const U = [p.U1, p.U2], h1 = H * 0.66;
      const ext = p.z === 'e';
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: ext ? -2 : -1, xmax: ext ? 2 : 1, ymin: -0.15, ymax: 1.6, xlabel: 'k (π/a)', ylabel: 'E (ħ²(2π/a)²/2m)' });
      pl.frame();
      const xs = EM.M.linspace(pl.o.xmin, pl.o.xmax, 401);
      pl.fn((x) => Math.pow(x / 2, 2), { color: '--ink-3', width: 1, dash: [3, 3] });
      if (!ext) for (const g of [-2, 2, -4, 4]) pl.fn((x) => Math.pow(x / 2 + g / 2, 2), { color: '--ink-3', width: 1, dash: [3, 3] });
      const bands = xs.map((x) => SS.central1d(x * PI, U, 7));
      if (!ext) for (let b = 0; b < 4; b++) pl.xy(xs, bands.map((e) => e[b]), { color: '--c1', width: 2.4 });
      else {
        /* zona extendida: la banda n se dibuja en la zona n */
        for (let b = 0; b < 4; b++) {
          const lo = b, hi = b + 1;
          const sel = xs.map((x, i) => (Math.abs(x) >= lo && Math.abs(x) <= hi ? bands[i][b] : NaN));
          pl.xy(xs, sel, { color: '--c1', width: 2.4 });
        }
      }
      if (p.two) {
        /* dos ondas en torno a k = π/a: ondas k y k − 2π/a */
        pl.fn((x) => { const kk = Math.abs(x) % 2, e1 = Math.pow(kk / 2, 2), e2 = Math.pow(kk / 2 - 1, 2); return (e1 + e2) / 2 - Math.sqrt(Math.pow((e1 - e2) / 2, 2) + U[0] * U[0]); }, { color: '--c2', width: 1.6, dash: [6, 4], from: -1, to: 1 });
        pl.fn((x) => { const kk = Math.abs(x) % 2, e1 = Math.pow(kk / 2, 2), e2 = Math.pow(kk / 2 - 1, 2); return (e1 + e2) / 2 + Math.sqrt(Math.pow((e1 - e2) / 2, 2) + U[0] * U[0]); }, { color: '--c2', width: 1.6, dash: [6, 4], from: -1, to: 1 });
      }
      const eb = SS.central1d(PI, U, 7), e0 = SS.central1d(0, U, 7);
      /* densidades de carga en el borde de zona */
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: 2, ymin: 0, ymax: 2.3, xlabel: 'x/a', ylabel: '|ψ|²', mt: 8 });
      p2.frame();
      const lower = U[0] < 0 ? (x) => 2 * Math.pow(Math.cos(PI * x), 2) : (x) => 2 * Math.pow(Math.sin(PI * x), 2);
      const upper = U[0] < 0 ? (x) => 2 * Math.pow(Math.sin(PI * x), 2) : (x) => 2 * Math.pow(Math.cos(PI * x), 2);
      p2.fn(lower, { color: '--c1', width: 2 });
      p2.fn(upper, { color: '--c2', width: 2 });
      for (const xi of [0, 1, 2]) p2.dot(xi, 0.08, { color: '--ink', r: 6, noclip: true });
      p2.label(1.03, 2.05, 'iones (mínimos de U si U₁ < 0)', { size: 10.5, color: '--ink-3' });
      sim.set('g1', EM.fix(eb[1] - eb[0], 4) + ' (2|U₁| = ' + EM.fix(2 * Math.abs(U[0]), 4) + ')');
      sim.set('g2', EM.fix(e0[2] - e0[1], 4) + ' (2|U₂| = ' + EM.fix(2 * Math.abs(U[1]), 4) + ')');
    });
  });

  /* 13.3 Aluminio con pseudopotencial de dos parámetros */
  const aAl = 4.049, kinAl = SS.HB2M * 100 * Math.pow((2 * PI) / aAl, 2);
  const nfeFcc = (k, U111, U200, ec = 9) => {
    const Gs = SS.epmGlist(4).filter((G) => Math.pow(k[0] + G[0], 2) + Math.pow(k[1] + G[1], 2) + Math.pow(k[2] + G[2], 2) <= ec);
    const n = Gs.length, Hm = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      Hm[i * n + i] = kinAl * (Math.pow(k[0] + Gs[i][0], 2) + Math.pow(k[1] + Gs[i][1], 2) + Math.pow(k[2] + Gs[i][2], 2));
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d2 = Math.pow(Gs[i][0] - Gs[j][0], 2) + Math.pow(Gs[i][1] - Gs[j][1], 2) + Math.pow(Gs[i][2] - Gs[j][2], 2);
        if (d2 === 3) Hm[i * n + j] = U111; else if (d2 === 4) Hm[i * n + j] = U200;
      }
    }
    return L.symEig(Hm, n).val.slice(0, 6);
  };
  EM.defineSim('nfe-al', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('u1', { label: 'U₁₁₁', min: -1, max: 1, step: 0.01, value: 0.24, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('u2', { label: 'U₂₀₀', min: -1.5, max: 1.5, step: 0.01, value: 0.76, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.button('Red vacía', () => { sim.ctl.u1.set(0, true); sim.ctl.u2.set(0); });
    sim.button('Aluminio (Ashcroft)', () => { sim.ctl.u1.set(0.24, true); sim.ctl.u2.set(0.76); });
    sim.out('gx', 'Brecha en X', { hl: true });
    sim.out('gl', 'Brecha en L');
    sim.out('ef', 'Nivel de Fermi (3 e/átomo)');
    const sp = SS.special('fcc'), path = SS.kpath(sp, ['Γ', 'X', 'W', 'L', 'Γ', 'K'], 36);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const E = path.map((q) => nfeFcc(q.k, p.u1, p.u2));
      const e0 = nfeFcc([0, 0, 0], p.u1, p.u2)[0];
      const Es = E.map((e) => e.map((x) => x - e0));
      const EF = SS.fermiGas(18.1e28).EFeV;
      D.bands(ctx, { x: 0, y: 0, w: W, h: H }, path, Es, { ymin: 0, ymax: 20, ef: EF, efLabel: 'E_F', colors: ['--c1'] });
      const X = nfeFcc([0, 1, 0], p.u1, p.u2), Lp = nfeFcc([0.5, 0.5, 0.5], p.u1, p.u2);
      sim.set('gx', EM.fix(X[1] - X[0], 3) + ' eV (2|U₂₀₀| = ' + EM.fix(2 * Math.abs(p.u2), 2) + ')');
      sim.set('gl', EM.fix(Lp[1] - Lp[0], 3) + ' eV (2|U₁₁₁| = ' + EM.fix(2 * Math.abs(p.u1), 2) + ')');
      sim.set('ef', EM.fix(EF, 2) + ' eV sobre el fondo de la banda (electrón libre)');
    });
  });

  /* 13.4 Construcción de Harrison */
  EM.defineSim('harrison', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Z', { label: 'Electrones por celda Z', min: 0.5, max: 4, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('n', { label: 'Zona mostrada a la derecha', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('kf', 'k_F (unidades de 2π/a)', { hl: true });
    sim.out('fill', 'Ocupación de cada zona');
    const NX = 260;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n);
      EM.draw.clear(cv);
      const kF = Math.sqrt(p.Z / (2 * PI)); /* 2·πkF² = Z en unidades de (2π/a)² */
      const Gs = SS.gvecs2d([1, 0], [0, 1], 4);
      const R = 1.25;
      const size = Math.min(W / 2, H) - 20;
      const r1 = { x: 10, y: (H - size) / 2, w: size, h: size }, r2 = { x: W / 2 + 10, y: (H - size) / 2, w: size, h: size };
      const vals = new Int16Array(NX * NX), red = new Int16Array(NX * NX);
      const occ = new Array(6).fill(0), tot = new Array(6).fill(0);
      for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) {
        const k = [-R + (2 * R * (i + 0.5)) / NX, R - (2 * R * (j + 0.5)) / NX], z = SS.zoneIndex(k, Gs);
        const inside = k[0] * k[0] + k[1] * k[1] < kF * kF;
        vals[j * NX + i] = inside ? z : -z;
        if (z < 6) { tot[z]++; if (inside) occ[z]++; }
      }
      /* zona reducida: k en la primera zona ocupado en la banda n si algún k + G en la zona n está dentro del círculo */
      const rr = 0.5;
      for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) {
        const k = [-rr + (2 * rr * (i + 0.5)) / NX, rr - (2 * rr * (j + 0.5)) / NX];
        let o = 0;
        for (let a = -3; a <= 3 && !o; a++) for (let b = -3; b <= 3 && !o; b++) {
          const q = [k[0] + a, k[1] + b];
          if (SS.zoneIndex(q, Gs) === n && q[0] * q[0] + q[1] * q[1] < kF * kF) o = 1;
        }
        red[j * NX + i] = o;
      }
      const bg = EM.rgb('--canvas');
      D.paint(ctx, vals, NX, NX, r1, (z) => { const c = EM.rgb(D.zoneColor(Math.abs(z))); return z > 0 ? c : c.map((x, i) => 0.22 * x + 0.78 * bg[i]); }, { smooth: false });
      const v1 = D.view(r1, -R, R, -R, R);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v1.X(0), v1.Y(0), kF * v1.sx, 0, 7); ctx.stroke();
      D.polygon(ctx, v1, [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], { stroke: '--ink', width: 1.5 });
      D.paint(ctx, red, NX, NX, r2, (o) => (o ? EM.rgb(D.zoneColor(n)) : EM.rgb('--surface-2')), { smooth: false });
      ctx.strokeStyle = EM.col('--ink'); ctx.strokeRect(r2.x + 0.5, r2.y + 0.5, r2.w, r2.h);
      EM.text(ctx, 'zona ' + n + ' en zona reducida (color: ocupado)', r2.x + 6, r2.y + r2.h - 8, { size: 11.5, color: '--ink-2', halo: true });
      sim.set('kf', EM.fix(kF, 4));
      sim.set('fill', [1, 2, 3, 4].map((z) => z + ': ' + EM.fix((100 * occ[z]) / Math.max(1, tot[z]), 0) + ' %').join(' · '));
    });
  });
})();
