/* Capítulo 14 — El átomo de hidrógeno (unidades atómicas dentro de las simulaciones) */
(function () {
  'use strict';
  const EM = window.EM, HY = EM.qm.hyd, K = EM.qm.K, S = EM.P.sf, PI = Math.PI;
  const A0 = 0.529177210903, RY = 13.605693122994;
  const MP = 1836.15267343, MMU = 206.7682830;
  const SYS = {
    H: ['Hidrógeno ¹H', 1, MP / (1 + MP)], D: ['Deuterio ²H', 1, (3670.48297) / (1 + 3670.48297)], He: ['He⁺ (⁴He)', 2, 7294.2995 / (1 + 7294.2995)], Li: ['Li²⁺ (⁷Li)', 3, 12786.0 / (1 + 12786.0)],
    Ps: ['Positronio (e⁺e⁻)', 1, 0.5], Mu: ['Hidrógeno muónico (μ⁻p)', 1, (MMU * MP) / (MMU + MP)]
  };
  const LET = 'spdfghik';

  /* 14.1 Funciones radiales */
  EM.defineSim('radial-h', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('sys', { label: 'Sistema hidrogenoide', options: Object.entries(SYS).map(([k, v]) => [k, v[0]]), value: 'H' });
    sim.slider('n', { label: 'Número cuántico principal n', min: 1, max: 7, step: 1, value: 3, fmt: (v) => v.toFixed(0), onInput: () => { if (sim.p.l > sim.p.n - 1) sim.ctl.l.set(sim.p.n - 1, true); } });
    sim.slider('l', { label: 'Número cuántico orbital l (0 … n − 1)', min: 0, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) + ' (' + LET[Math.round(v)] + ')' });
    sim.out('E', 'Energía <i>E</i><sub>n</sub> = −μ<i>Z</i>²/(2<i>n</i>²) hartree: en eV · en cm⁻¹', { hl: true });
    sim.out('r', 'Longitud de Bohr <i>a</i> = <i>a</i><sub>0</sub>/(<i>Z</i>μ) · ⟨<i>r</i>⟩ = ½[3<i>n</i>² − <i>l</i>(<i>l</i> + 1)] <i>a</i> · radio más probable');
    sim.out('n', 'Nodos radiales <i>n</i> − <i>l</i> − 1 y sus posiciones (en <i>a</i>) · ⟨1/<i>r</i>⟩ = 1/(<i>n</i>²<i>a</i>) · ⟨<i>V</i>⟩ = 2<i>E</i> y ⟨<i>T</i>⟩ = −<i>E</i> (virial)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, Z, mu] = SYS[p.sys], n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1), a = 1 / (Z * mu), rmax = (2.4 * n * n + 7 * n) * a * 0.9;
      EM.draw.clear(cv);
      const rs = Array.from({ length: 900 }, (_, i) => (rmax * i) / 899), R = rs.map((r) => HY.R(n, l, r, Z, mu)), P = rs.map((r, i) => r * r * R[i] * R[i]);
      const x = (r) => r / a;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: 0, xmax: rmax / a, ymin: -Math.max(...R.map(Math.abs)) * 1.2 * a ** 1.5 / (a ** 1.5), ymax: Math.max(...R.map(Math.abs)) * 1.2, xlabel: 'r / a', ylabel: 'R_nl(r) (a.u.)', ml: 50, mr: 8, title: 'Función radial R_nl' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] }); pl.xy(rs.map(x), R, { color: '--c1', width: 2.4 });
      const nodes = []; for (let i = 1; i < rs.length; i++) if (R[i - 1] * R[i] < 0) nodes.push(rs[i] / a); nodes.forEach((q) => pl.dot(q, 0, { color: '--c2', r: 3.6 }));
      const pr = new EM.Plot(ctx, { x: cv.w * 0.53, y: 0, w: cv.w * 0.47, h: cv.h, xmin: 0, xmax: rmax / a, ymin: 0, ymax: Math.max(...P) * 1.15, xlabel: 'r / a', ylabel: 'P(r) = r² R² (a.u.)', ml: 46, mr: 8, title: 'Densidad radial de probabilidad' });
      pr.frame(); pr.xy(rs.map(x), P, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.16 });
      let imx = 0; for (let i = 1; i < P.length; i++) if (P[i] > P[imx]) imx = i; pr.vline(rs[imx] / a, { color: '--c2', dash: [3, 3] }); pr.vline(HY.rMean(n, l, Z, mu) * Z * mu, { color: '--c4', dash: [5, 3], label: '⟨r⟩' });
      const E = HY.E(n, Z, mu) * 27.211386245988;
      sim.set('E', `${EM.fix(E, 4)} eV · ${EM.fix(E * 8065.543937, 1)} cm⁻¹`);
      sim.set('r', `${EM.sci(a * A0, 4)} Å · ${EM.fix(HY.rMean(n, l, Z, mu) * Z * mu, 2)} a (${EM.sci(HY.rMean(n, l, Z, mu) * A0, 4)} Å) · ${EM.fix(rs[imx] / a, 3)} a`);
      sim.set('n', `${nodes.length}: ${nodes.map((q) => EM.fix(q, 2)).join(', ') || '—'} · ${EM.fix(HY.rInv(n, Z, mu) / (Z * mu), 4)}/a · ${EM.fix(2 * E, 3)} eV y ${EM.fix(-E, 3)} eV`);
    });
  });

  /* 14.2 Orbitales: corte del plano xz */
  const REAL = { '0,0': 's', '1,0': 'p_z', '1,1': 'p_x', '1,-1': 'p_y', '2,0': 'd_{z²}', '2,1': 'd_{xz}', '2,-1': 'd_{yz}', '2,2': 'd_{x²−y²}', '2,-2': 'd_{xy}', '3,0': 'f_{z³}' };
  EM.defineSim('orbitales-h', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('n', { label: 'n', min: 1, max: 5, step: 1, value: 3, fmt: (v) => v.toFixed(0), onInput: () => { if (sim.p.l > sim.p.n - 1) sim.ctl.l.set(sim.p.n - 1, true); } });
    sim.slider('l', { label: 'l', min: 0, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) + ' (' + LET[Math.round(v)] + ')', onInput: () => { if (Math.abs(sim.p.m) > sim.p.l) sim.ctl.m.set(0, true); } });
    sim.slider('m', { label: 'm (combinación real: m > 0 → cos mφ, m < 0 → sen |m|φ)', min: -4, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.seg('mode', { label: 'Mostrar', options: [['psi', 'ψ con signo (fase)'], ['rho', '|ψ|² (densidad)']], value: 'psi' });
    sim.out('name', 'Orbital', { hl: true });
    sim.out('nod', 'Nodos: radiales <i>n</i> − <i>l</i> − 1 · angulares <i>l</i> · totales <i>n</i> − 1');
    sim.out('P', 'Probabilidad de estar en un radio menor que 2 <i>a</i><sub>0</sub> · mayor que 2<i>n</i>² <i>a</i><sub>0</sub>');
    const NG = 170;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1), m = Math.max(-l, Math.min(l, Math.round(p.m))), Lh = Math.max(4, 2.0 * HY.rMean(n, l) + 3);
      EM.draw.clear(cv);
      const sz = Math.min(cv.w * 0.6, cv.h - 20), x0 = (cv.w - sz) / 2 - cv.w * 0.05, y0 = 10, g = new Float64Array(NG * NG); let mx = 0;
      for (let iy = 0; iy < NG; iy++) for (let ix = 0; ix < NG; ix++) {
        const X = -Lh + ((ix + 0.5) * 2 * Lh) / NG, Zc = Lh - ((iy + 0.5) * 2 * Lh) / NG, r = Math.hypot(X, Zc), th = Math.atan2(Math.abs(X), Zc), ph = X >= 0 ? 0 : PI, v = HY.psiReal(n, l, m, Math.max(r, 1e-9), th, ph);
        g[iy * NG + ix] = p.mode === 'psi' ? v : v * v; mx = Math.max(mx, Math.abs(g[iy * NG + ix]));
      }
      EM.heat(ctx, { x: x0, y: y0, w: sz, h: sz }, NG, NG, (ix, iy) => { const v = g[iy * NG + ix] / (mx || 1); return p.mode === 'psi' ? Math.sign(v) * Math.pow(Math.abs(v), 0.55) : Math.pow(Math.max(0, v), 0.45); }, { cmap: p.mode === 'psi' ? 'div' : 'seq', color: '--c2' });
      EM.text(ctx, `plano xz · lado de ${EM.fix(2 * Lh, 0)} a₀`, x0 + sz / 2, y0 + sz + 14, { size: 11, align: 'center', color: '--ink-3' });
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.3); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0 + sz / 2, y0); ctx.lineTo(x0 + sz / 2, y0 + sz); ctx.moveTo(x0, y0 + sz / 2); ctx.lineTo(x0 + sz, y0 + sz / 2); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'z', x0 + sz / 2 + 6, y0 + 12, { size: 11, color: '--ink-2' }); EM.text(ctx, 'x', x0 + sz - 10, y0 + sz / 2 - 5, { size: 11, color: '--ink-2' });
      /* barra de leyenda a la derecha */
      const bx = x0 + sz + 20; for (let k = 0; k < 100; k++) { const t = 1 - k / 99; const c = p.mode === 'psi' ? EM.cmap.diverging(2 * t - 1) : EM.cmap.seq(t, '--c2'); ctx.fillStyle = EM.rgbStr(c); ctx.fillRect(bx, y0 + (sz * 0.1) + k * (sz * 0.8) / 100, 12, (sz * 0.8) / 100 + 1); }
      EM.text(ctx, p.mode === 'psi' ? '+' : 'máx', bx + 18, y0 + sz * 0.1 + 8, { size: 11, color: '--ink-2' }); EM.text(ctx, p.mode === 'psi' ? '−' : '0', bx + 18, y0 + sz * 0.9, { size: 11, color: '--ink-2' });
      const nm = (REAL[l + ',' + m] || `l=${l}, m=${m}`).replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([a-z0-9])/g, '<sub>$1</sub>');
      /* probabilidades radiales por cuadratura */
      let pin = 0, pout = 0; const Nn = 4000, rm = 80 * n * n, h = rm / Nn; for (let i = 0; i < Nn; i++) { const r = (i + 0.5) * h, d = r * r * HY.R(n, l, r) ** 2 * h; if (r < 2) pin += d; if (r > 2 * n * n) pout += d; }
      sim.set('name', `${n}${LET[l]}${l > 0 || m ? ' ' : ''}${l > 0 ? nm : ''}`);
      sim.set('nod', `${n - l - 1} · ${l} · ${n - 1}`);
      sim.set('P', `${EM.fix(100 * pin, 3)} % · ${EM.fix(100 * pout, 3)} %`);
    });
  });

  /* 14.3 Sistemas hidrogenoides exóticos */
  EM.defineSim('exoticos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Nivel superior n para la serie de Lyman y Balmer', min: 2, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('E1', 'Energía de ionización |<i>E</i><sub>1</sub>| de cada sistema (eV)', { hl: true });
    sim.out('a', 'Radio de Bohr <i>a</i> = <i>a</i><sub>0</sub>/(<i>Z</i>μ) de cada sistema (pm)');
    sim.out('l', 'Longitud de onda de la línea <i>n</i> → 1 (Lyman) · <i>n</i> → 2 (Balmer, si <i>n</i> ≥ 3), en nm');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, n = Math.round(p.n), keys = Object.keys(SYS);
      EM.draw.clear(cv);
      const E1 = keys.map((k) => RY * SYS[k][1] ** 2 * SYS[k][2]), a = keys.map((k) => (A0 * 1e2) / (SYS[k][1] * SYS[k][2]));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: -0.5, xmax: keys.length - 0.5, ymin: 1, ymax: 1e5, ylog: true, xlabel: '', ylabel: '|E₁| (eV)', ml: 52, mr: 8, title: 'Energía de ionización' });
      pl.frame(); keys.forEach((k, i) => { pl.path([[i, 1], [i, E1[i]]], { color: '--accent', width: 18 }); pl.label(i, E1[i] * 1.5, EM.sci(E1[i], 3), { size: 10, align: 'center', color: '--ink-2' }); pl.label(i, 1.25, k, { size: 11, align: 'center', color: '--bg' }); });
      const pa = new EM.Plot(ctx, { x: cv.w * 0.53, y: 0, w: cv.w * 0.47, h: cv.h, xmin: -0.5, xmax: keys.length - 0.5, ymin: 1, ymax: 1e5, ylog: true, xlabel: '', ylabel: 'radio de Bohr (pm)', ml: 46, mr: 8, title: 'Tamaño del átomo' });
      pa.frame(); keys.forEach((k, i) => { pa.path([[i, 1], [i, a[i]]], { color: '--c2', width: 18 }); pa.label(i, a[i] * 1.5, EM.sci(a[i], 3), { size: 10, align: 'center', color: '--ink-2' }); pa.label(i, 1.25, k, { size: 11, align: 'center', color: '--bg' }); });
      const lam = (k, nu, nl) => 1239.84198 / (RY * SYS[k][1] ** 2 * SYS[k][2] * (1 / (nl * nl) - 1 / (nu * nu)));
      sim.set('E1', keys.map((k, i) => `${k}: ${EM.sci(E1[i], 5)}`).join(' · '));
      sim.set('a', keys.map((k, i) => `${k}: ${EM.sci(a[i], 4)}`).join(' · '));
      sim.set('l', keys.map((k) => `${k}: ${EM.sci(lam(k, n, 1), 5)}${n >= 3 ? ' / ' + EM.sci(lam(k, n, 2), 5) : ''}`).join(' · '));
    });
  });
})();
