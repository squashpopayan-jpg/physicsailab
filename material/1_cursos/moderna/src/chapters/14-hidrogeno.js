/* Capítulo 14 — Átomo de hidrógeno y orbitales */
(function () {
  'use strict';
  const EM = window.EM, Hy = EM.qm.hyd, T = EM.fm.hyd, K = EM.qm.K, MU = K.mp / (K.mp + K.me), A0 = 52.9177210903; /* pm */
  const LN = 'spdfgh';
  const ORB = { '0,0': 's', '1,0': 'pz', '1,1': 'px', '1,-1': 'py', '2,0': 'dz²', '2,1': 'dxz', '2,-1': 'dyz', '2,2': 'dx²−y²', '2,-2': 'dxy' };

  /* 14.1 Funciones radiales */
  EM.defineSim('radial', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n', { label: 'Número cuántico principal n', min: 1, max: 6, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'Número cuántico orbital l (l ≤ n − 1)', min: 0, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energía E_n = −Ry/n² (con masa reducida) · radio de Bohr n²a₀', { hl: true });
    sim.out('r', 'Radio medio ⟨r⟩ = [3n² − l(l + 1)]a₀/2 · radio más probable');
    sim.out('nd', 'Nodos radiales n − l − 1 · degeneración del nivel n² (sin espín: 2n² con espín)');
    sim.out('P', 'Probabilidad de encontrar el electrón a menos de a₀ del protón');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1);
      EM.draw.clear(cv);
      const rmax = Math.max(8, 2.6 * n * n + 4), N = 400, rs = [], R = [], P = []; let pk = 0, rpk = 0, mx = 0, mxR = 0;
      for (let i = 0; i <= N; i++) { const r = (rmax * i) / N, v = Hy.R(n, l, Math.max(r, 1e-9)); rs.push(r); R.push(v); P.push(r * r * v * v); if (r * r * v * v > pk) { pk = r * r * v * v; rpk = r; } mx = Math.max(mx, Math.abs(v)); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: rmax, ymin: -mx * 1.1, ymax: mx * 1.1, xlabel: 'r / a₀', ylabel: 'R_nl(r) (a₀^−3/2)', ml: 56, mr: 8, title: 'Función radial R_nl' });
      pl.frame(); pl.hline(0, { color: '--ink-2', dash: [] }); pl.xy(rs, R, { color: '--accent', width: 2.8 });
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: rmax, ymin: 0, ymax: pk * 1.15, xlabel: 'r / a₀', ylabel: 'densidad radial r²R² (a₀⁻¹)', ml: 56, mr: 8, title: 'Densidad de probabilidad radial' });
      pr.frame(); pr.xy(rs, P, { color: '--accent', width: 2.8, fill: '--accent', fillAlpha: 0.16 });
      pr.vline(Hy.rMean(n, l), { color: '--c3', label: '⟨r⟩', dash: [4, 3] }); pr.vline(n * n, { color: '--c2', label: 'n²a₀', dash: [2, 4] });
      let s = 0; const M = 4000, h = 1 / M; for (let i = 1; i <= M; i++) { const r = i * h, v = Hy.R(n, l, r); s += r * r * v * v * h; }
      sim.set('E', `${EM.fix(T.levelEV(n, MU), 5)} eV · ${EM.fix(n * n * A0, 1)} pm`);
      sim.set('r', `${EM.fix(Hy.rMean(n, l), 2)} a₀ (${EM.fix(Hy.rMean(n, l) * A0, 1)} pm) · ${EM.fix(rpk, 2)} a₀`);
      sim.set('nd', `${n - l - 1} · ${n * n}`);
      sim.set('P', `${EM.fix(100 * s, 2)} %`);
    });
  });

  /* 14.2 Orbitales: densidad en un plano que contiene el eje z */
  EM.defineSim('orbitales', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.slider('n', { label: 'n', min: 1, max: 4, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'l', min: 0, max: 3, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'm (orbital real: m > 0 ∝ cos mφ, m < 0 ∝ sen|m|φ)', min: -3, max: 3, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.check('rad', { label: 'Realzar la estructura radial (escala de raíz de la densidad)', value: true });
    sim.out('nm', 'Orbital', { hl: true });
    sim.out('E', 'Energía · nodos radiales (n − l − 1) y angulares (l)');
    sim.out('r', 'Radio medio ⟨r⟩ · extensión mostrada (±)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1), m = Math.max(-l, Math.min(l, Math.round(p.m)));
      EM.draw.clear(cv);
      const size = Math.min(W, H) - 34, x0 = (W - size) / 2, y0 = 12, ext = 1.45 * (3 * n * n - l * (l + 1)) / 2 + 3, NN = 120, ph0 = m < 0 ? Math.PI / (2 * Math.abs(m)) : 0;
      const val = new Float64Array(NN * NN); let mx = 0;
      for (let iy = 0; iy < NN; iy++) for (let ix = 0; ix < NN; ix++) {
        const rho = ((ix + 0.5) / NN * 2 - 1) * ext, z = (1 - (iy + 0.5) / NN * 2) * ext, r = Math.hypot(rho, z), th = Math.atan2(Math.abs(rho), z), ph = rho >= 0 ? ph0 : ph0 + Math.PI;
        const v = Hy.psiReal(n, l, m, Math.max(r, 1e-6), th, ph); const d = v * v; val[iy * NN + ix] = d; if (d > mx) mx = d;
      }
      EM.heat(ctx, { x: x0, y: y0, w: size, h: size }, NN, NN, (ix, iy) => { const t = val[iy * NN + ix] / mx; return p.rad ? Math.sqrt(t) : t; }, { cmap: 'inferno' });
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.35); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0 + size / 2, y0); ctx.lineTo(x0 + size / 2, y0 + size); ctx.moveTo(x0, y0 + size / 2); ctx.lineTo(x0 + size, y0 + size / 2); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'z', x0 + size / 2 + 6, y0 + 12, { size: 12, color: '#fff' }); EM.text(ctx, 'ρ', x0 + size - 12, y0 + size / 2 - 6, { size: 12, color: '#fff' });
      EM.text(ctx, `plano que contiene al eje z — ancho ${EM.fix(2 * ext, 1)} a₀ (${EM.fix(2 * ext * A0 / 1000, 2)} nm)`, W / 2, H - 6, { size: 11.5, align: 'center', color: '--ink-3' });
      const name = n + (l < 3 ? ORB[l + ',' + m] || LN[l] : LN[l] + '(m=' + m + ')');
      sim.set('nm', `${n}${LN[l]} · m = ${m} → ${name}`);
      sim.set('E', `${EM.fix(T.levelEV(n, MU), 4)} eV · ${n - l - 1} y ${l}`);
      sim.set('r', `${EM.fix(Hy.rMean(n, l), 2)} a₀ · ±${EM.fix(ext, 1)} a₀`);
    });
  });

  /* 14.3 Transiciones, reglas de selección y vidas medias */
  EM.defineSim('lineas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n', { label: 'Estado inicial: n', min: 2, max: 6, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'Estado inicial: l', min: 0, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('A', 'Tasa total de desintegración ΣA (s⁻¹) · vida media τ = 1/ΣA', { hl: true });
    sim.out('br', 'Canales permitidos (n′l′: A, longitud de onda, fracción)');
    sim.out('sel', 'Regla de selección dipolar: Δl = ±1, Δm = 0, ±1 (Δn cualquiera)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1), nmax = 6;
      EM.draw.clear(cv);
      const mx = W * 0.07, wc = (W * 0.52 - mx) / 4;
      /* niveles agrupados por l (columnas s, p, d, f) con posición vertical ∝ energía (comprimida) */
      const yOf = (nn) => 26 + (H - 62) * (1 - (1 - 1 / (nn * nn)) ** 1); /* E = −Ry/n²: y mayor para n pequeño */
      EM.text(ctx, 'Niveles del hidrógeno por valor de l', W * 0.28, 14, { size: 12, align: 'center', color: '--ink-2' });
      for (let ll = 0; ll < 4; ll++) EM.text(ctx, LN[ll], mx + wc * ll + wc * 0.35, H - 8, { size: 13, align: 'center', color: '--ink-2' });
      const pos = {};
      for (let nn = 1; nn <= nmax; nn++) for (let ll = 0; ll < Math.min(4, nn); ll++) { const x = mx + wc * ll, y = yOf(nn); pos[nn + ',' + ll] = [x + wc * 0.35, y]; ctx.save(); ctx.strokeStyle = EM.col(nn === n && ll === l ? '--accent' : '--ink-3'); ctx.lineWidth = nn === n && ll === l ? 3.5 : 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + wc * 0.7, y); ctx.stroke(); ctx.restore(); if (ll === 0) EM.text(ctx, `${nn}`, x - 6, y, { size: 11, align: 'right', color: '--ink-3', baseline: 'middle' }); }
      const d = T.decay(n, l, MU), amax = Math.max(1, ...d.list.map((q) => q.A));
      for (const q of d.list) { const a = pos[n + ',' + l], b = pos[q.n2 + ',' + q.l2]; if (!a || !b) continue; const lam = T.lineNm(n, q.n2, MU), rgb = lam >= 380 && lam <= 780 ? `rgb(${EM.wavelengthRGB(lam).join(',')})` : '--c3'; EM.draw.arrow(ctx, a[0], a[1], b[0], b[1], { color: rgb, width: 1 + 3.5 * Math.sqrt(q.A / amax), head: 8 }); }
      /* Derecha: tasas */
      const pr = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 7, ymin: 1e6, ymax: 1e9, ylog: true, xlabel: 'estado inicial (n, l = 1)', ylabel: 'tasa A de los canales (s⁻¹)', ml: 50, mr: 8, title: 'Tasas A(np → n′s o n′d)' });
      pr.frame();
      const xs = [], ys = []; for (let nn = 2; nn <= 6; nn++) { const dd = T.decay(nn, 1, MU); xs.push(nn); ys.push(dd.A); }
      pr.xy(xs, ys, { color: '--accent', width: 2.8 }); xs.forEach((x, i) => pr.dot(x, ys[i], { color: '--accent', r: 4 }));
      pr.dot(n, T.decay(n, 1, MU).A, { color: '--c3', r: 6.5 });
      const lines = d.list.map((q) => `${q.n2}${LN[q.l2]}: ${EM.sci(q.A, 3)} s⁻¹, ${EM.fix(T.lineNm(n, q.n2, MU), 2)} nm, ${EM.fix(100 * q.A / d.A, 2)} %`).join(' · ');
      sim.set('A', d.A > 0 ? `${EM.sci(d.A, 4)} · τ = ${d.tau < 1e-6 ? EM.fix(d.tau * 1e9, 4) + ' ns' : EM.sci(d.tau, 3) + ' s'}` : 'sin canal dipolar permitido (estado metaestable: 2s decae por dos fotones en 0.12 s)');
      sim.set('br', lines || '—');
      sim.set('sel', (l === 0 && n === 2) ? '2s → 1s tiene Δl = 0: prohibida; τ(2s) ≈ 0.12 s (dos fotones)' : (n > 1 && l >= n ? 'l debe ser ≤ n − 1' : `de ${n}${LN[l]}: l′ = ${[l - 1, l + 1].filter((x) => x >= 0).join(' o ')}`));
    });
  });
})();
