/* Capítulo 2 — Estructura atómica y enlace */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat;
  const eV = MAT.eV;
  /* Pares de Morse de Girifalco y Weizer (1959): D (eV), a (1/Å), r0 (Å), E medido (GPa) */
  const GW = {
    Pb: [0.2348, 1.1836, 3.733, 16], Al: [0.2703, 1.1646, 3.253, 70], Ag: [0.3323, 1.3690, 3.115, 83],
    Cu: [0.3429, 1.3588, 2.866, 128], Ni: [0.4205, 1.4199, 2.780, 200], Fe: [0.4174, 1.3885, 2.845, 211]
  };
  EM.MORSE_GW = GW;

  /* ======================================================================
     2.1 Curvas de energía y fuerza
     ====================================================================== */
  EM.defineSim('bond-curves', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.seg('mod', { label: 'Modelo', options: [['lj', 'Lennard-Jones'], ['mo', 'Morse']], value: 'mo' });
    sim.select('mat', { label: 'Par de Girifalco y Weizer', options: [['', 'Parámetros libres']].concat(Object.keys(GW).map((k) => [k, 'Par ' + k])), value: 'Cu' });
    sim.slider('eps', { label: 'Profundidad <i>ε</i>', min: 0.005, max: 1, step: 0.005, value: 0.3, unit: 'eV', fmt: (v) => EM.fix(v, 3) });
    sim.slider('sig', { label: 'Diámetro <i>σ</i>', min: 0.15, max: 0.45, step: 0.005, value: 0.255, unit: 'nm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('D', { label: 'Profundidad <i>D</i>', min: 0.05, max: 1.5, step: 0.005, value: 0.3429, unit: 'eV', fmt: (v) => EM.fix(v, 3) });
    sim.slider('a', { label: 'Inverso del alcance <i>a</i>', min: 0.6, max: 3, step: 0.01, value: 1.3588, unit: 'Å⁻¹', fmt: (v) => EM.fix(v, 3) });
    sim.slider('r0', { label: 'Equilibrio <i>r</i><sub>0</sub>', min: 1.5, max: 4.5, step: 0.005, value: 2.866, unit: 'Å', fmt: (v) => EM.fix(v, 3) });
    sim.check('force', { label: 'Mostrar la fuerza', value: true });
    sim.out('r0o', 'Distancia de equilibrio <i>r</i><sub>0</sub>', { hl: true });
    sim.out('E0', 'Energía de enlace <i>E</i><sub>0</sub>');
    sim.out('k', 'Rigidez <i>k</i> = <i>E</i>″(<i>r</i><sub>0</sub>)');
    sim.out('Fm', 'Fuerza máxima (rotura del enlace)');
    sim.out('Ey', 'Estimación <i>E</i> ~ <i>k</i>/<i>r</i><sub>0</sub>');
    sim.out('Em', 'Módulo medido del metal');
    const vis = () => {
      const lj = sim.p.mod === 'lj';
      ['eps', 'sig'].forEach((k) => sim.ctl[k].show(lj));
      ['D', 'a', 'r0', 'mat'].forEach((k) => sim.ctl[k].show && sim.ctl[k].show(!lj));
    };
    sim.onChange = (id) => {
      if (id === 'mat' && sim.p.mat) {
        const g = GW[sim.p.mat];
        sim.ctl.D.set(g[0], true); sim.ctl.a.set(g[1], true); sim.ctl.r0.set(g[2], true);
      } else if (['D', 'a', 'r0'].includes(id) && sim.p.mat) sim.ctl.mat.set('', true);
      vis();
    };
    vis();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      let U, F, r0, E0, k, Fm, rFm;
      if (p.mod === 'lj') {
        const eps = p.eps, s = p.sig * 10; // Å
        U = (r) => MAT.lj.U(r, eps, s); F = (r) => MAT.lj.F(r, eps, s);
        r0 = MAT.lj.r0(s); E0 = -eps; k = MAT.lj.k(eps, s);
        rFm = Math.pow(26 / 7, 1 / 6) * s; Fm = -F(rFm);
      } else {
        U = (r) => MAT.morse.U(r, p.D, p.a, p.r0); F = (r) => MAT.morse.F(r, p.D, p.a, p.r0);
        r0 = p.r0; E0 = -p.D; k = MAT.morse.k(p.D, p.a); Fm = MAT.morse.Fmax(p.D, p.a); rFm = p.r0 + Math.LN2 / p.a;
      }
      const depth = Math.abs(E0);
      const xmin = r0 * 0.7, xmax = r0 * 2.2;
      const h1 = p.force ? cv.h * 0.56 : cv.h;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin, xmax, ymin: -depth * 1.25, ymax: depth * 1.6, xlabel: p.force ? '' : 'separación r (Å)', ylabel: 'energía (eV)', mb: p.force ? 10 : 40, ml: 60 });
      pl.frame();
      pl.fn(U, { color: '--accent', width: 2.4 });
      pl.hline(0, { color: '--ink-3', dash: [] });
      pl.vline(r0, { label: 'r₀', color: '--ink-2' });
      pl.dot(r0, E0, { color: '--accent', label: 'E₀', dx: 8, dy: 14 });
      /* parábola armónica */
      pl.fn((r) => E0 + 0.5 * k * (r - r0) * (r - r0), { color: '--c1', width: 1.3, dash: [5, 4] });
      pl.legend([{ label: 'potencial', color: '--accent' }, { label: 'aproximación armónica', color: '--c1', dash: [5, 4] }], 'br');
      if (p.force) {
        const fmax = Fm * 1.6;
        const pf = new EM.Plot(ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin, xmax, ymin: -fmax, ymax: fmax, xlabel: 'separación r (Å)', ylabel: 'fuerza (eV/Å)', mt: 8, ml: 60 });
        pf.frame();
        pf.fn(F, { color: '--c3', width: 2.2 });
        pf.dot(rFm, -Fm, { color: '--c2', label: 'F_{máx}', dx: 8, dy: 14 });
        EM.text(ctx, 'repulsión (+)', pf.ix + 6, pf.iy + 12, { size: 11, color: '--ink-3' });
        EM.text(ctx, 'atracción (−)', pf.ix + 6, pf.iy + pf.ih - 6, { size: 11, color: '--ink-3' });
      }
      const kSI = (k * eV) / 1e-20; // eV/Å² → N/m
      const FmN = (Fm * eV) / 1e-10;
      const Eest = kSI / (r0 * 1e-10);
      sim.set('r0o', EM.fix(r0, 3) + ' Å');
      sim.set('E0', EM.fix(E0, 3) + ' eV = ' + EM.fix((E0 * eV * MAT.NA) / 1000, 0) + ' kJ/mol');
      sim.set('k', EM.fix(k, 3) + ' eV/Å² = ' + EM.fix(kSI, 1) + ' N/m');
      sim.set('Fm', EM.si(FmN, 'N') + ' en r = ' + EM.fix(rFm, 3) + ' Å');
      sim.set('Ey', EM.si(Eest, 'Pa'));
      sim.set('Em', p.mod === 'mo' && p.mat ? GW[p.mat][3] + ' GPa' : '—');
    });
  });

  /* ======================================================================
     2.2 Par iónico
     ====================================================================== */
  EM.defineSim('ionic-pair', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('z', { label: 'Cargas', options: [['1', '±1 (NaCl, KCl)'], ['2', '±2 (MgO, CaO)']], value: '1' });
    sim.slider('B', { label: 'Coeficiente repulsivo <i>B</i>', min: 1, max: 30, step: 0.01, value: 7.32, unit: '×10⁻⁶ eV·nm<sup>n</sup>', fmt: (v) => EM.fix(v, 2) });
    sim.slider('n', { label: 'Exponente de Born <i>n</i>', min: 6, max: 12, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('r0', 'Distancia de equilibrio <i>r</i><sub>0</sub>', { hl: true });
    sim.out('E0', 'Energía del par <i>E</i><sub>0</sub>');
    sim.out('ER', 'Fracción repulsiva <i>E<sub>R</sub></i>/|<i>E<sub>A</sub></i>| = 1/<i>n</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const z = +p.z, A = 1.436 * z * z, B = p.B * 1e-6, n = p.n;
      const r0 = MAT.ionic.r0(A, B, n), E0 = MAT.ionic.U0(A, B, n);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.68, h: cv.h, xmin: 0.1, xmax: 0.7, ymin: -Math.abs(E0) * 1.8, ymax: Math.abs(E0) * 1.6, xlabel: 'separación r (nm)', ylabel: 'energía (eV)', ml: 58 });
      pl.frame();
      pl.fn((r) => -A / r, { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.fn((r) => B / Math.pow(r, n), { color: '--c2', width: 1.6, dash: [6, 4] });
      pl.fn((r) => MAT.ionic.U(r, A, B, n), { color: '--accent', width: 2.6 });
      pl.dot(r0, E0, { color: '--accent', label: `(${EM.fix(r0, 3)} nm, ${EM.fix(E0, 2)} eV)`, dy: 18 });
      pl.legend([{ label: 'atracción −A/r', color: '--c1', dash: [6, 4] }, { label: 'repulsión B/rⁿ', color: '--c2', dash: [6, 4] }, { label: 'neta', color: '--accent' }], 'tr');
      /* iones dibujados a la distancia de equilibrio */
      const cx = cv.w * 0.84, cy = cv.h * 0.45, sc = 220;
      const rc = z === 1 ? 0.181 : 0.140, ra = z === 1 ? 0.102 : 0.072;
      EM.draw.bob(ctx, cx - (r0 * sc) / 2, cy, ra * sc * 0.9, { color: '--c1', label: z === 1 ? 'Na⁺' : 'Mg²⁺' });
      EM.draw.bob(ctx, cx + (r0 * sc) / 2, cy, rc * sc * 0.9, { color: '--c3', label: z === 1 ? 'Cl⁻' : 'O²⁻' });
      EM.text(ctx, 'r₀ = ' + EM.fix(r0, 3) + ' nm', cx, cy + 70, { size: 12, align: 'center', color: '--ink-2' });
      EM.text(ctx, '(radios iónicos a escala)', cx, cy + 88, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('r0', EM.fix(r0, 4) + ' nm');
      sim.set('E0', EM.fix(E0, 3) + ' eV');
      sim.set('ER', EM.fix(1 / n, 3));
    });
  });

  /* ======================================================================
     2.3 Triángulo de van Arkel–Ketelaar
     ====================================================================== */
  const XP = { H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.00, Ti: 1.54, Cr: 1.66, Mn: 1.55, Fe: 1.83, Co: 1.88, Ni: 1.91, Cu: 1.90, Zn: 1.65, Ga: 1.81, Ge: 2.01, As: 2.18, Br: 2.96, Ag: 1.93, Sn: 1.96, I: 2.66, Cs: 0.79, Ba: 0.89, W: 2.36, Au: 2.54, Pb: 2.33 };
  EM.PAULING = XP;
  EM.defineSim('bond-triangle', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const opts = Object.keys(XP).map((k) => [k, `${k} (${XP[k].toFixed(2)})`]);
    sim.select('A', { label: 'Elemento A', options: opts, value: 'Na' });
    sim.select('B', { label: 'Elemento B', options: opts, value: 'Cl' });
    sim.out('dx', 'Diferencia Δ<i>X</i>');
    sim.out('ci', 'Carácter iónico de Pauling', { hl: true });
    sim.out('type', 'Región del triángulo');
    const ex = [['Cs', 'F'], ['Na', 'Cl'], ['Mg', 'O'], ['Al', 'O'], ['Si', 'O'], ['Ga', 'As'], ['Si', 'C'], ['C', 'C'], ['Cu', 'Zn'], ['Fe', 'Fe'], ['Cs', 'Cs'], ['Ti', 'C'], ['Zn', 'S'], ['H', 'O']];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.6, xmax: 4.1, ymin: 0, ymax: 3.4, xlabel: 'electronegatividad media (X_A + X_B)/2', ylabel: 'diferencia |X_A − X_B|', ml: 58 });
      pl.frame();
      /* triángulo: vértices metálico (0.79,0), covalente (3.98,0), iónico (2.385,3.19) */
      const V = [[0.79, 0], [3.98, 0], [(0.79 + 3.98) / 2, 3.98 - 0.79]];
      const regions = [
        ['metálico', '--c1', [V[0], [2.2, 0], [1.6, 0.8]]],
        ['covalente', '--c3', [[2.2, 0], V[1], [2.9, 1.1], [1.6, 0.8]]],
        ['iónico', '--c2', [[1.6, 0.8], [2.9, 1.1], V[2]]]
      ];
      for (const [name, col, pts] of regions) {
        ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(pl.X(q[0]), pl.Y(q[1])) : ctx.moveTo(pl.X(q[0]), pl.Y(q[1])))); ctx.closePath();
        ctx.fillStyle = EM.alpha(col, 0.13); ctx.fill();
        const c = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
        pl.label(c[0], c[1], name, { color: col, size: 13, weight: 700, align: 'center' });
      }
      ctx.beginPath(); V.forEach((q, i) => (i ? ctx.lineTo(pl.X(q[0]), pl.Y(q[1])) : ctx.moveTo(pl.X(q[0]), pl.Y(q[1])))); ctx.closePath();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.stroke();
      for (const [a, b] of ex) {
        const m = (XP[a] + XP[b]) / 2, d = Math.abs(XP[a] - XP[b]);
        pl.dot(m, d, { color: '--ink-3', r: 3, label: a === b ? a : a + '–' + b, labelColor: '--ink-3' });
      }
      const xa = XP[p.A], xb = XP[p.B], m = (xa + xb) / 2, d = Math.abs(xa - xb);
      pl.dot(m, d, { color: '--accent', r: 7, label: p.A + '–' + p.B, labelColor: '--accent' });
      const ci = MAT.ionicPct(xa, xb);
      sim.set('dx', EM.fix(d, 2));
      sim.set('ci', EM.fix(ci, 1) + ' %');
      const t = d > 1.7 ? 'predominantemente iónico' : m > 2.2 - 0.5 * d ? 'predominantemente covalente' : 'predominantemente metálico';
      sim.set('type', d > 1.0 && d <= 1.7 ? 'mixto iónico–covalente' : t);
    });
  });

  /* ======================================================================
     2.4 Expansión térmica anarmónica
     ====================================================================== */
  EM.defineSim('anharmonic-expansion', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('mat', { label: 'Par de Morse', options: Object.keys(GW).map((k) => [k, 'Par ' + k]), value: 'Cu' });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: 10, max: 1500, step: 10, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('kT', '<i>k<sub>B</sub>T</i>');
    sim.out('dx', 'Desplazamiento medio ⟨<i>x</i>⟩ (Boltzmann)', { hl: true });
    sim.out('dx1', 'Primer orden 3<i>k<sub>B</sub>T</i>/(4<i>Da</i>)');
    sim.out('al', 'Coeficiente <i>α</i> del par a esta <i>T</i>');
    sim.out('al0', 'Fórmula 3<i>k<sub>B</sub></i>/(4<i>Dar</i><sub>0</sub>)');
    const meanX = (D, a, T) => {
      const kT = MAT.kBeV * T;
      const U = (x) => D * (Math.pow(1 - Math.exp(-a * x), 2) - 1);
      const xa = -Math.log(1 + Math.sqrt(1 + 0)) / a * 0.999; // límite izquierdo aproximado (U=D)
      const lo = Math.max(xa, -3 / a), hi = -Math.log(1 - Math.sqrt(0.9)) / a; // pozo ligado: U < −0.1 D
      const w = (x) => Math.exp(-(U(x) + D) / kT);
      const Z = MAT.integrate(w, lo, hi, 2000), N = MAT.integrate((x) => x * w(x), lo, hi, 2000);
      return N / Z;
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [D, a, r0] = GW[p.mat];
      const kT = MAT.kBeV * p.T;
      const U = (r) => MAT.morse.U(r, D, a, r0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h * 0.66, xmin: r0 - 0.5, xmax: r0 + 1.2, ymin: -D * 1.08, ymax: D * 0.2, xlabel: 'separación r (Å)', ylabel: 'energía (eV)', ml: 60 });
      pl.frame();
      pl.fn(U, { color: '--accent', width: 2.4 });
      /* puntos de retorno a E = −D + kT */
      const E = -D + kT;
      let rl = r0, rr = r0;
      if (E < 0) {
        rl = MAT.bisect((r) => U(r) - E, r0 - 2, r0);
        rr = MAT.bisect((r) => U(r) - E, r0, r0 + 20);
        ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(pl.X(rl), pl.Y(E)); ctx.lineTo(pl.X(rr), pl.Y(E)); ctx.stroke();
        pl.dot((rl + rr) / 2, E, { color: '--c1', label: 'punto medio', dy: -10 });
      }
      pl.vline(r0, { label: 'r₀', color: '--ink-3' });
      const mx = meanX(D, a, p.T);
      pl.vline(r0 + mx, { label: '⟨r⟩', color: '--c3', dash: [2, 3], labelY: 30 });
      /* curva α(T) */
      const pa = new EM.Plot(ctx, { x: 0, y: cv.h * 0.66, w: cv.w, h: cv.h * 0.34, xmin: 0, xmax: 1500, ymin: 0, ymax: meanX(D, a, 1500) * 1.15, xlabel: 'T (K)', ylabel: '⟨x⟩ (Å)', ml: 60, mt: 10 });
      pa.frame();
      const Ts = EM.M.linspace(10, 1500, 40);
      pa.xy(Ts, Ts.map((T) => meanX(D, a, T)), { color: '--c3', width: 2 });
      pa.fn((T) => (3 * MAT.kBeV * T) / (4 * D * a), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pa.dot(p.T, mx, { color: '--c3' });
      const dT = 5, al = (meanX(D, a, p.T + dT) - meanX(D, a, Math.max(1, p.T - dT))) / (2 * dT) / r0;
      sim.set('kT', EM.fix(kT * 1000, 1) + ' meV');
      sim.set('dx', EM.fix(mx * 1000, 2) + ' mÅ');
      sim.set('dx1', EM.fix(((3 * kT) / (4 * D * a)) * 1000, 2) + ' mÅ');
      sim.set('al', EM.sci(al, 3) + ' K⁻¹');
      sim.set('al0', EM.sci((3 * MAT.kBeV) / (4 * D * a * r0), 3) + ' K⁻¹');
    });
  });
})();
