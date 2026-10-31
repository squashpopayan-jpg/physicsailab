/* Capítulo 18 — Simetrías y reglas de selección */
(function () {
  'use strict';
  const EM = window.EM, Q = EM.P.q1d, SY = EM.qm.sym, M = EM.M, PI = Math.PI;
  const half = (x) => (Number.isInteger(x) ? String(x) : (x < 0 ? '−' : '') + Math.abs(x * 2) + '/2');

  /* 18.1 Paridad y reglas de selección en un doble pozo */
  EM.defineSim('paridad', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V0', { label: 'Altura de la barrera central V₀ (con a = 2 y ħ = m = 1)', min: 2, max: 30, step: 0.5, value: 10, fmt: (v) => EM.fix(v, 1) });
    sim.slider('eps', { label: 'Asimetría ε del potencial (término ε·x): rompe la paridad', min: 0, max: 1.5, step: 0.05, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('p', 'Paridad ⟨ψ(−x)|ψ(x)⟩ de los seis primeros estados (±1 exactamente solo si ε = 0)', { hl: true });
    sim.out('s', 'Elementos de x entre estados de la <i>misma</i> paridad: máximo de |⟨m|x|n⟩| (prohibidos por paridad: 0 si ε = 0)');
    sim.out('d', 'Elemento dipolar permitido más grande |⟨m|x|n⟩| entre estados de paridad opuesta · par (m, n)');
    let cache = null;
    sim.onDraw(() => {
      const p = sim.p, N = 700, a = 2, L = 7, V = (x) => p.V0 * ((x / a) ** 2 - 1) ** 2 + p.eps * x;
      const key = p.V0 + '|' + p.eps; if (!cache || cache.key !== key) { const r = Q.fdEigen(V, -L, L, N, 6); cache = { key, r, X: SY.xmat(r.x, r.psi, r.h), par: r.psi.map((ps) => SY.parity(ps)) }; }
      const { r, X, par } = cache, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -L, xmax: L, ymin: Math.min(...r.E) - 1.5, ymax: Math.min(Math.max(...r.E) + 6, p.V0 + 8), xlabel: 'x', ylabel: 'E y ψ(x) (unidades arbitrarias)', ml: 54, mr: 10, title: 'Doble pozo y sus seis estados' });
      pl.frame(); pl.fn(V, { color: '--ink-3', width: 1.8 });
      r.psi.forEach((ps, k) => { const sc = 1.2 / Math.max(...ps.map(Math.abs)); const col = par[k] > 0 ? '--c1' : '--c2'; pl.hline(r.E[k], { color: col, dash: [2, 4], width: 0.8 }); pl.xy(r.x.filter((_, i) => i % 3 === 0), ps.filter((_, i) => i % 3 === 0).map((v) => r.E[k] + v * sc * 0.8), { color: col, width: 1.6 }); });
      /* matriz |x_mn| */
      const x0 = W * 0.6, y0 = H * 0.2, cs = Math.min((W * 0.36) / 7, (H * 0.65) / 7);
      EM.text(ctx, '|⟨m|x|n⟩|', x0 + cs * 3.5 + cs * 0.5, y0 - 26, { size: 12, align: 'center', color: '--ink-3' });
      let mxSame = 0, mxOpp = 0, pair = [0, 0]; const mx = Math.max(...X.flat().map(Math.abs), 1e-9);
      for (let i = 0; i < 6; i++) {
        EM.text(ctx, String(i), x0 + (i + 1.5) * cs, y0 - 8, { size: 11, align: 'center', color: par[i] > 0 ? '--c1' : '--c2' }); EM.text(ctx, String(i), x0 + 0.6 * cs, y0 + (i + 1.65) * cs, { size: 11, align: 'center', color: par[i] > 0 ? '--c1' : '--c2' });
        for (let j = 0; j < 6; j++) {
          const v = Math.abs(X[i][j]), same = Math.sign(par[i]) === Math.sign(par[j]);
          ctx.save(); ctx.fillStyle = EM.alpha(same ? '--c2' : '--c1', 0.08 + 0.7 * (v / mx)); ctx.fillRect(x0 + (j + 1) * cs + 1, y0 + (i + 1) * cs + 1, cs - 2, cs - 2); ctx.restore();
          EM.text(ctx, v < 5e-4 ? '0' : EM.fix(v, 2), x0 + (j + 1.5) * cs, y0 + (i + 1.62) * cs, { size: 10.5, align: 'center', color: v < 5e-4 ? '--ink-3' : '--ink' });
          if (i !== j) { if (same) mxSame = Math.max(mxSame, v); else if (v > mxOpp) { mxOpp = v; pair = [Math.min(i, j), Math.max(i, j)]; } }
        }
      }
      sim.set('p', par.map((v) => (Math.abs(v) > 0.999 ? (v > 0 ? '+1' : '−1') : EM.fix(v, 3))).join(', '));
      sim.set('s', EM.sci(mxSame, 3));
      sim.set('d', `${EM.fix(mxOpp, 4)} · (${pair[0]}, ${pair[1]})`);
    });
  });

  /* 18.2 Matrices d de Wigner: rotación de un estado de momento angular */
  EM.defineSim('wigner-d', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('j', { label: 'Momento angular j', min: 0.5, max: 4, step: 0.5, value: 1, fmt: (v) => half(v) });
    sim.slider('m', { label: 'Proyección inicial m (respecto del eje z)', min: -4, max: 4, step: 0.5, value: 1, fmt: (v) => half(v) });
    sim.slider('b', { label: 'Ángulo de rotación β alrededor de y (grados)', min: 0, max: 360, step: 1, value: 90, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('s', 'Σ<sub>m′</sub> |<i>d</i><sup>j</sup><sub>m′m</sub>(β)|² (unitariedad) · ⟨<i>J</i><sub>z</sub>⟩ = Σ m′ P(m′) frente al valor clásico m cos β', { hl: true });
    sim.out('m', 'Probabilidad de medir la proyección inicial m tras la rotación |<i>d</i><sub>mm</sub>|² · probabilidad de medir −m');
    sim.out('r', 'Rotación de 2π: <i>d</i><sup>j</sup><sub>mm</sub>(2π) = (−1)<sup>2j</sup> (entero: +1; semientero: −1) · valor en β = 360°');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, j = +sim.p.j; let m = Math.max(-j, Math.min(j, Math.round(2 * sim.p.m) / 2)); if (Math.abs(j - m - Math.round(j - m)) > 1e-9) m = m < j ? m + 0.5 : m - 0.5;
      const bt = M.rad(sim.p.b);
      EM.draw.clear(cv);
      const ms = []; for (let q = j; q >= -j - 1e-9; q -= 1) ms.push(q);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: 360, ymin: -1.05, ymax: 1.05, xlabel: 'β (grados)', ylabel: `d^j_{m′ ${half(m)}}(β)`, ml: 54, mr: 10, title: 'Elementos de la matriz de rotación' });
      pl.frame(); pl.hline(0, { color: '--axis' });
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c1', '--c2', '--c3'];
      ms.forEach((mp, k) => pl.fn((x) => SY.wd(j, mp, m, M.rad(x)), { color: cols[k % cols.length], width: 1.6 }));
      pl.vline(sim.p.b, { color: '--accent', dash: [3, 3] });
      const qp = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: -j - 0.7, xmax: j + 0.7, ymin: 0, ymax: 1.05, xlabel: "m′ (proyección tras la rotación)", ylabel: 'probabilidad', ml: 48, mr: 8, title: `P(m′) para β = ${sim.p.b.toFixed(0)}°` });
      qp.frame(); let sP = 0, Jz = 0; ms.forEach((mp) => { const d = SY.wd(j, mp, m, bt), P = d * d; sP += P; Jz += mp * P; qp.path([[mp, 0], [mp, P]], { color: '--accent', width: Math.max(4, Math.min(16, W * 0.025 / Math.max(1, j))) }); });
      const dmm = SY.wd(j, m, m, bt), dm2 = SY.wd(j, -m, m, bt);
      sim.set('s', `${EM.fix(sP, 6)} · ${EM.fix(Jz, 4)} frente a ${EM.fix(m * Math.cos(bt), 4)}`);
      sim.set('m', `${EM.fix(dmm * dmm, 4)} · ${EM.fix(dm2 * dm2, 4)}`);
      sim.set('r', `${Number.isInteger(j) ? '+1' : '−1'} · ${EM.fix(SY.wd(j, m, m, 2 * PI), 4)} (en 360°)`);
    });
  });

  /* 18.3 Reglas de selección dipolares y vidas medias del hidrógeno */
  const LET = 'spdfgh';
  EM.defineSim('dipolo-h', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const lev = []; for (let n = 2; n <= 5; n++) for (let l = 0; l < n; l++) lev.push([n + '_' + l, `${n}${LET[l]}`]);
    sim.select('lev', { label: 'Nivel inicial (n, l)', options: lev, value: '3_1' });
    sim.check('rm', { label: 'Mostrar también las transiciones prohibidas (|Δl| ≠ 1) con A = 0', value: false });
    sim.out('t', 'Vida media del nivel τ = 1/Σ<i>A</i> (ns) · <i>A</i> total (s⁻¹)', { hl: true });
    sim.out('b', 'Canal más probable y su fracción de ramificación');
    sim.out('r', 'Integral radial ⟨<i>n′l′</i>|<i>r</i>|<i>nl</i>⟩ del canal más probable (en a₀) · longitud de onda (nm)');
    const cache = {};
    sim.onDraw(() => {
      const [n, l] = sim.p.lev.split('_').map(Number), ctx = cv.ctx, W = cv.w, H = cv.h, key = n + '_' + l;
      if (!cache[key]) { const rows = []; for (let n2 = 1; n2 < n; n2++) for (let l2 = 0; l2 < n2; l2++) { const A = SY.einsteinA(n, l, n2, l2); rows.push({ n2, l2, A, R: Math.abs(l2 - l) === 1 ? SY.radial(n, l, n2, l2) : 0, lam: 1239.841984 / (13.605693 * (1 / (n2 * n2) - 1 / (n * n))) }); } cache[key] = rows; }
      const rows = cache[key].filter((r) => sim.p.rm || r.A > 0), tot = cache[key].reduce((s, r) => s + r.A, 0);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: -0.5, xmax: Math.max(rows.length, 1) - 0.5, ymin: 0, ymax: Math.max(...rows.map((r) => r.A), 1) * 1.15, xlabel: '', ylabel: 'coeficiente A de Einstein (s⁻¹)', ml: 66, mr: 10, title: `Desexcitación del nivel ${n}${LET[l]}` });
      pl.frame();
      rows.forEach((r, i) => { pl.path([[i, 0], [i, r.A]], { color: r.A > 0 ? '--accent' : '--ink-3', width: Math.min(34, W * 0.5 / Math.max(rows.length, 3)) }); pl.label(i, 0, `${r.n2}${LET[r.l2]}`, { size: 12, dy: 16, color: '--ink-2', align: 'center' }); if (r.A > 0) pl.label(i, r.A, EM.sci(r.A, 3), { size: 10.5, dy: -8, color: '--ink-2', align: 'center' }); });
      /* diagrama de niveles */
      const dx = W * 0.7, dw = W * 0.28;
      EM.text(ctx, 'Términos (columna = l)', dx + dw / 2, H * 0.08, { size: 12, align: 'center', color: '--ink-3' });
      for (let nn = 1; nn <= 5; nn++) for (let ll = 0; ll < nn; ll++) { const y = H * 0.92 - H * 0.82 * ((1 - 1 / (nn * nn)) / 0.96), x = dx + 6 + ll * (dw / 5.2); const on = nn === n && ll === l; ctx.save(); ctx.strokeStyle = EM.col(on ? '--accent' : '--ink-3'); ctx.lineWidth = on ? 3 : 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dw / 6, y); ctx.stroke(); ctx.restore(); }
      const mainRow = rows.filter((r) => r.A > 0).sort((a, b) => b.A - a.A)[0];
      sim.set('t', tot > 0 ? `${EM.fix(1e9 / tot, 4)} ns · ${EM.sci(tot, 4)} s⁻¹` : 'estable (no tiene decaimiento dipolar eléctrico: metaestable)');
      sim.set('b', mainRow ? `${mainRow.n2}${LET[mainRow.l2]} · ${EM.fix(100 * mainRow.A / tot, 2)} %` : '—');
      sim.set('r', mainRow ? `${EM.fix(mainRow.R, 4)} a₀ · ${EM.fix(mainRow.lam, 3)} nm` : '—');
    });
  });
})();
