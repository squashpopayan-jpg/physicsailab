/* Capítulo 12 — Teorema de Bloch y modelo de Kronig–Penney */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI;

  /* 12.1 Función de Bloch con la ecuación central */
  EM.defineSim('bloch-funcion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('k', { label: 'k (unidades de π/a)', min: -1, max: 1, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('U', { label: 'Potencial U₁ (unidades de ħ²(2π/a)²/2m)', min: -0.6, max: 0.6, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.seg('n', { label: 'Banda', options: [[0, '1'], [1, '2'], [2, '3']], value: 0 });
    sim.check('u', { label: 'Mostrar la parte periódica u_k', value: true });
    sim.out('E', 'Energía (ħ²(2π/a)²/2m)', { hl: true });
    sim.out('w', 'Peso de la onda plana dominante');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const nG = 6, N = 2 * nG + 1, k = p.k * PI, Hm = new Float64Array(N * N);
      for (let i = 0; i < N; i++) { Hm[i * N + i] = Math.pow(k / (2 * PI) + i - nG, 2); if (i + 1 < N) { Hm[i * N + i + 1] = p.U; Hm[(i + 1) * N + i] = p.U; } }
      const r = L.symEig(Hm, N, true), c = r.vec[p.n], E = r.val[p.n];
      const psi = (x) => { let re = 0, im = 0; for (let i = 0; i < N; i++) { const ph = (k + 2 * PI * (i - nG)) * x; re += c[i] * Math.cos(ph); im += c[i] * Math.sin(ph); } return [re, im]; };
      const uf = (x) => { let re = 0, im = 0; for (let i = 0; i < N; i++) { const ph = 2 * PI * (i - nG) * x; re += c[i] * Math.cos(ph); im += c[i] * Math.sin(ph); } return [re, im]; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 4, ymin: -2.6, ymax: 2.7, xlabel: 'x/a', ylabel: 'ψ (u. arb.)' });
      pl.frame();
      pl.fn((x) => 2.15 + 0.4 * Math.cos(2 * PI * x) * Math.sign(p.U || 1), { color: '--ink-3', width: 1.3 });
      pl.label(0.03, 2.62, 'U(x)', { size: 11, color: '--ink-3' });
      pl.fn((x) => psi(x)[0], { color: '--c1', width: 2.2, n: 600 });
      pl.fn((x) => { const q = psi(x); return q[0] * q[0] + q[1] * q[1]; }, { color: '--c2', width: 2, fill: '--c2', fillAlpha: 0.1, n: 600 });
      if (p.u) pl.fn((x) => 0.6 * uf(x)[0] - 1.95, { color: '--c3', width: 1.6, dash: [5, 3], n: 400 });
      for (let j = 1; j < 4; j++) pl.vline(j, { color: '--grid-2', dash: [2, 3] });
      pl.legend([{ label: 'Re ψ', color: '--c1' }, { label: '|ψ|² (periódica)', color: '--c2' }].concat(p.u ? [{ label: 'Re u_k (desplazada)', color: '--c3', dash: [5, 3] }] : []), 'br');
      let im = 0; for (let i = 1; i < N; i++) if (Math.abs(c[i]) > Math.abs(c[im])) im = i;
      /* energía libre plegada de la misma banda: las parábolas (k/2π + G)² ordenadas */
      const free = [-2, -1, 0, 1, 2].map((g) => Math.pow(p.k / 2 + g, 2)).sort((x, y) => x - y)[p.n];
      sim.set('E', EM.fix(E, 4) + ' (sin potencial: ' + EM.fix(free, 4) + ')');
      sim.set('w', EM.fix(c[im] * c[im] * 100, 1) + ' % en G = ' + (im - nG) + '·2π/a');
    });
  });

  /* 12.2 Kronig–Penney */
  EM.defineSim('kronig-penney', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V0', { label: 'Altura de la barrera U₀', min: 0.01, max: 3, step: 0.01, value: 0.3, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Ancho del pozo a', min: 0.3, max: 2, step: 0.01, value: 1, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'Ancho de la barrera b', min: 0.02, max: 1, step: 0.01, value: 0.3, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.check('free', { label: 'Electrón libre plegado', value: true });
    sim.out('b1', 'Banda 1', { hl: true });
    sim.out('g1', 'Brecha 1');
    sim.out('b2', 'Banda 2');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = p.a + p.b;
      EM.draw.clear(cv);
      const Emax = Math.max(1.3 * p.V0, 4.5 * SS.HB2M * Math.pow(PI / d, 2));
      /* se buscan bandas más arriba del área visible para no cortar la última */
      const bands = SS.kpBands(p.V0, p.a, p.b, 2.5 * Emax).filter((q) => q[0] < Emax);
      const wl = W * 0.45;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -3, xmax: 3, ymin: 0, ymax: Emax, xlabel: 'F(E)', ylabel: 'E (eV)' });
      pl.frame();
      pl.band(-1, 1, { color: '--c3', alpha: 0.12 });
      const Es = [], Fs = [];
      for (let i = 1; i <= 800; i++) { const E = (Emax * i) / 800; Es.push(E); Fs.push(SS.kpF(E, p.V0, p.a, p.b)); }
      pl.xy(Fs, Es, { color: '--c1', width: 2 });
      pl.hline(p.V0, { color: '--c2', label: 'U₀', dash: [4, 4] });
      for (const [e0, e1] of bands) { ctx.fillStyle = EM.alpha('--accent', 0.15); ctx.fillRect(pl.ix, pl.Y(e1), pl.iw, pl.Y(e0) - pl.Y(e1)); }
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: -1, xmax: 1, ymin: 0, ymax: Emax, xlabel: 'k (π/(a+b))', ylabel: '', ml: 30 });
      p2.frame();
      for (const [e0, e1] of bands) { ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.fillRect(p2.ix, p2.Y(e1), p2.iw, p2.Y(e0) - p2.Y(e1)); }
      if (p.free) for (let n = -3; n <= 3; n++) p2.fn((x) => SS.HB2M * Math.pow(((x + 2 * n) * PI) / d, 2), { color: '--ink-3', width: 1, dash: [3, 3] });
      const xs = EM.M.linspace(-1, 1, 161);
      const E = xs.map((x) => SS.kpE((x * PI) / d, p.V0, p.a, p.b, bands));
      for (let b = 0; b < bands.length; b++) p2.xy(xs, E.map((e) => e[b]), { color: '--c1', width: 2.4 });
      sim.set('b1', bands[0] ? EM.fix(bands[0][0], 4) + ' – ' + EM.fix(bands[0][1], 4) + ' eV' : '—');
      sim.set('g1', bands[1] ? EM.fix(bands[1][0] - bands[0][1], 4) + ' eV' : '—');
      sim.set('b2', bands[1] ? EM.fix(bands[1][0], 4) + ' – ' + EM.fix(bands[1][1], 4) + ' eV' : '—');
    });
  });

  /* 12.3 Abanico de bandas */
  EM.defineSim('kp-abanico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Ancho del pozo a', min: 0.5, max: 2, step: 0.01, value: 1, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'Ancho de la barrera b', min: 0.05, max: 1, step: 0.01, value: 0.3, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.out('w', 'Ancho de la banda 1 con U₀ = 5 eV', { hl: true });
    sim.out('inf', 'Nivel 1 del pozo infinito');
    let key = '', cols = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Emax = 1.6, nV = 120;
      const k = p.a + '|' + p.b;
      if (k !== key) { key = k; cols = []; for (let i = 0; i <= nV; i++) { const V0 = 0.001 + (5 * i) / nV; cols.push([V0, SS.kpBands(V0, p.a, p.b, Emax, 1, 2000)]); } }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 5, ymin: 0, ymax: Emax, xlabel: 'altura de las barreras U₀ (eV)', ylabel: 'E (eV)' });
      pl.frame();
      const dx = pl.iw / nV;
      for (const [V0, bs] of cols) for (const [e0, e1] of bs) { ctx.fillStyle = EM.alpha('--c1', 0.75); ctx.fillRect(pl.X(V0) - dx / 2, pl.Y(e1), dx + 0.5, Math.max(1, pl.Y(e0) - pl.Y(e1))); }
      for (let n = 1; n <= 4; n++) { const e = SS.wellInf(n, p.a); if (e < Emax) pl.hline(e, { color: '--c2', dash: [3, 3], label: n === 1 ? 'pozo infinito' : '' }); }
      pl.fn((x) => x, { color: '--ink-3', dash: [5, 4], width: 1 });
      pl.label(Math.min(1.4, Emax * 0.85), Math.min(1.45, Emax * 0.9), 'E = U₀', { size: 11, color: '--ink-3' });
      const last = cols[cols.length - 1][1];
      sim.set('w', last[0] ? EM.sci((last[0][1] - last[0][0]) * 1000, 3) + ' meV' : '—');
      sim.set('inf', EM.fix(SS.wellInf(1, p.a) * 1000, 1) + ' meV');
    });
  });

  /* 12.4 N pozos */
  EM.defineSim('n-pozos', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('N', { label: 'Número de pozos N', min: 1, max: 24, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.slider('V0', { label: 'Altura de las barreras', min: 0.1, max: 2, step: 0.01, value: 0.5, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('lev', { label: 'Nivel mostrado', min: 1, max: 48, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('cnt', 'Niveles en cada banda', { hl: true });
    sim.out('E', 'Energía del nivel mostrado');
    const a = 1, b = 0.3, npc = 26;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N);
      EM.draw.clear(cv);
      /* malla: barrera exterior de 0.6 nm a cada lado (paredes duras más allá) */
      const pad = 0.6, Ltot = 2 * pad + N * a + (N - 1) * b, h = (a + b) / npc, n = Math.round(Ltot / h);
      const V = new Float64Array(n), x = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = (i + 0.5) * h - pad;
        const xc = x[i];
        let inWell = false;
        for (let j = 0; j < N; j++) { const s = j * (a + b); if (xc >= s && xc < s + a) inWell = true; }
        V[i] = inWell ? 0 : p.V0;
      }
      const t = SS.HB2M / (h * h);
      const dg = Array.from(V, (v) => 2 * t + v), off = new Float64Array(n - 1).fill(-t);
      const Emax = Math.min(1.25, p.V0 * 1.6 + 0.3);
      const nLev = L.sturmCount(dg, off, Emax);
      const ev = [];
      for (let k = 0; k < nLev; k++) {
        let lo = 0, hi = Emax;
        for (let it = 0; it < 50; it++) { const m = 0.5 * (lo + hi); if (L.sturmCount(dg, off, m) > k) hi = m; else lo = m; }
        ev.push(0.5 * (lo + hi));
      }
      const bands = SS.kpBands(p.V0, a, b, 2.5 * Emax).filter((q) => q[0] < Emax);
      const wl = W * 0.36;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Emax, xticks: [], ylabel: 'E (eV)' });
      pl.frame();
      for (const [e0, e1] of bands) { ctx.fillStyle = EM.alpha('--accent', 0.14); ctx.fillRect(pl.ix, pl.Y(e1), pl.iw, pl.Y(e0) - pl.Y(e1)); }
      const sel = Math.min(Math.round(p.lev), ev.length) - 1;
      ev.forEach((e, i) => { ctx.strokeStyle = EM.col(i === sel ? '--c2' : '--c1'); ctx.lineWidth = i === sel ? 2.4 : 1.4; ctx.beginPath(); ctx.moveTo(pl.X(0.1), pl.Y(e)); ctx.lineTo(pl.X(0.9), pl.Y(e)); ctx.stroke(); });
      /* función de onda del nivel elegido (iteración inversa) */
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: -pad, xmax: Ltot - pad, ymin: -0.2, ymax: Emax, xlabel: 'x (nm)', ylabel: '' , ml: 30 });
      p2.frame();
      p2.xy(Array.from(x), Array.from(V), { color: '--ink-3', width: 1.4 });
      if (sel >= 0) {
        const lam = ev[sel] + 1e-9;
        let v = new Float64Array(n).fill(1);
        for (let it = 0; it < 4; it++) {
          const l = new Float64Array(n).fill(-t), u = new Float64Array(n).fill(-t), dd = Array.from(dg, (q) => q - lam);
          l[0] = 0; u[n - 1] = 0;
          v = L.thomas(l, dd, u, v);
          let nn = 0; for (const q of v) nn = Math.max(nn, Math.abs(q)); for (let i = 0; i < n; i++) v[i] /= nn;
        }
        const sc = Math.min(0.12, Emax * 0.1);
        p2.hline(ev[sel], { color: '--grid-2', dash: [2, 2] });
        p2.xy(Array.from(x), Array.from(v, (q) => ev[sel] + sc * q), { color: '--c2', width: 2 });
      }
      const counts = bands.map(([e0, e1]) => ev.filter((e) => e >= e0 - 2e-3 && e <= e1 + 2e-3).length);
      sim.set('cnt', counts.length ? counts.join(', ') + ' (N = ' + N + ')' : '—');
      sim.set('E', sel >= 0 ? EM.fix(ev[sel], 4) + ' eV' : '—');
      sim.ctl.lev.range(1, Math.max(1, ev.length), 1);
    });
  });
})();
