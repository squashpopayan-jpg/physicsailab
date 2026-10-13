/* Capítulo 16 — Hohenberg–Kohn y Kohn–Sham */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom;
  const f6 = (v) => CQ.fix(v, 6), f4 = (v) => CQ.fix(v, 4);

  /* LDA de átomos 1–18, calculado una sola vez y compartido */
  let LDA_CACHE = null;
  const ldaAll = () => {
    if (!LDA_CACHE) { LDA_CACHE = {}; for (let Z = 1; Z <= 18; Z++) LDA_CACHE[Z] = A.solve({ Z, method: 'lda' }); }
    return LDA_CACHE;
  };
  CQ.ldaAll = ldaAll;

  /* ======================================================================
     16.1 Energías atómicas: TF, HF, LDA, exacta
     ====================================================================== */
  CQ.defineSim('thomas-fermi', function (sim) {
    const ce = sim.canvas({ aspect: 2.2 });
    const cr = sim.canvas({ aspect: 3.2 });
    sim.group('Mostrar');
    sim.check('tf', { label: 'Thomas–Fermi −0.7687 <i>Z</i><sup>7/3</sup>', value: true });
    sim.check('hf', { label: 'Hartree–Fock (Z ≤ 10)', value: true });
    sim.check('lda', { label: 'Kohn–Sham LDA (calculado aquí)', value: true });
    sim.slider('Z', { label: 'Átomo señalado', min: 1, max: 18, value: 7, step: 1, fmt: (v) => `${v} · ${A.SYM[v]}` });
    sim.out('ex', 'Exacta (no relativista)');
    sim.out('tfv', 'Thomas–Fermi', { hl: true });
    sim.out('hfv', 'Hartree–Fock');
    sim.out('ldv', 'LDA', { hl: true });
    sim.onDraw(() => {
      const L = sim.p.lda ? ldaAll() : null;
      const Zs = Array.from({ length: 18 }, (_, i) => i + 1);
      CQ.draw.clear(ce);
      const pl = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0.5, xmax: 18.5, ymin: 0.3, ymax: 1200, ylog: true, xlabel: '', ylabel: '−E (Ha)', mb: 22, title: 'energía total del átomo neutro' });
      pl.frame();
      if (sim.p.tf) pl.path(Zs.map((z) => [z, -A.ETF(z)]), { color: '--c4', width: 2 });
      pl.path(Zs.filter((z) => A.EXACT[z]).map((z) => [z, -A.EXACT[z]]), { color: '--ink', width: 2.4 });
      if (sim.p.hf) Zs.filter((z) => A.HF[z]).forEach((z) => pl.dot(z, -A.HF[z], { color: '--c2', r: 3.5 }));
      if (L) Zs.forEach((z) => pl.dot(z, -L[z].Etot, { color: '--c1', r: 3 }));
      pl.vline(sim.p.Z, { color: '--accent' });
      pl.legend([{ label: 'exacta', color: '--ink' }].concat(sim.p.tf ? [{ label: 'Thomas–Fermi', color: '--c4' }] : []).concat(sim.p.hf ? [{ label: 'Hartree–Fock', color: '--c2', kind: 'dot' }] : []).concat(L ? [{ label: 'LDA (este curso)', color: '--c1', kind: 'dot' }] : []), 'br');
      /* error relativo */
      CQ.draw.clear(cr);
      const pe = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0.5, xmax: 10.5, ymin: 0.01, ymax: 100, ylog: true, xlabel: 'número atómico Z', ylabel: '|error| (%)', title: 'error relativo |E − E_{exacta}|/|E_{exacta}| (Z ≤ 10)' });
      pe.frame();
      const ZZ = Zs.filter((z) => A.EXACT[z]);
      if (sim.p.tf) pe.path(ZZ.map((z) => [z, Math.max(0.011, 100 * Math.abs((A.ETF(z) - A.EXACT[z]) / A.EXACT[z]))]), { color: '--c4', width: 2 });
      if (sim.p.hf) pe.path(ZZ.map((z) => [z, Math.max(0.011, 100 * Math.abs((A.HF[z] - A.EXACT[z]) / A.EXACT[z]))]), { color: '--c2', width: 2 });
      if (L) pe.path(ZZ.map((z) => [z, Math.max(0.011, 100 * Math.abs((L[z].Etot - A.EXACT[z]) / A.EXACT[z]))]), { color: '--c1', width: 2 });
      const Z = sim.p.Z;
      sim.set('ex', A.EXACT[Z] ? f4(A.EXACT[Z]) + ' Ha' : '—');
      sim.set('tfv', f4(A.ETF(Z)) + ' Ha');
      sim.set('hfv', A.HF[Z] ? f4(A.HF[Z]) + ' Ha' : '—');
      sim.set('ldv', L ? f4(L[Z].Etot) + ' Ha' : '—');
    });
  });

  /* ======================================================================
     16.2 Inversión densidad → potencial (dos electrones en un orbital, 1D)
     ====================================================================== */
  CQ.defineSim('inversion-densidad', function (sim) {
    sim.cols2();
    const cn = sim.canvas({ aspect: 0.95 });
    const cv = sim.canvas({ aspect: 0.95 });
    const POT = {
      ho: ['Oscilador V = x²/2', (x) => 0.5 * x * x],
      dw: ['Doble pozo V = (x² − 1.5²)²/6', (x) => ((x * x - 2.25) ** 2) / 6],
      asym: ['Pozo asimétrico V = x²/2 + 0.3x³ e^{−x²/8}', (x) => 0.5 * x * x + 0.3 * x ** 3 * Math.exp(-x * x / 8)],
      pt: ['Pöschl–Teller V = −3 sech²x', (x) => -3 / Math.cosh(x) ** 2],
      morse: ['Morse V = 4(1 − e^{−(x−0.5)})²', (x) => 4 * (1 - Math.exp(-(x - 0.5))) ** 2]
    };
    sim.group('Potencial «desconocido» (ħ = m = 1)');
    sim.select('pot', { options: Object.keys(POT).map((k) => [k, POT[k][0]]), value: 'dw' });
    sim.check('noise', { label: 'Añadir ruido de medida a la densidad (0.1 %)', value: false });
    sim.out('E', 'Energía del orbital');
    sim.out('dev', 'Desviación máxima del potencial reconstruido', { hl: true });
    sim.out('N', '∫<i>n</i> d<i>x</i>');
    sim.onDraw(() => {
      const V = POT[sim.p.pot][1];
      const a = -6, b = 6, N = 2400;
      const r = P.q1d.fdEigen(V, a, b, N, 1);
      const x = r.x, h = r.h, phi = r.psi[0];
      const n = Float64Array.from(phi, (p) => 2 * p * p);
      const rng = P.rng(3);
      if (sim.p.noise) for (let i = 0; i < n.length; i++) n[i] *= 1 + 0.001 * rng.gauss();
      /* inversión: φ = √(n/2), v = E + φ''/(2φ) */
      const ph = Float64Array.from(n, (v) => Math.sqrt(Math.max(v, 0) / 2));
      const vr = [], xs = [];
      for (let i = 2; i < n.length - 2; i++) {
        if (n[i] < 1e-7) continue;
        const d2 = (-ph[i + 2] + 16 * ph[i + 1] - 30 * ph[i] + 16 * ph[i - 1] - ph[i - 2]) / (12 * h * h);
        xs.push(x[i]); vr.push(r.E[0] + d2 / (2 * ph[i]));
      }
      CQ.draw.clear(cn);
      const nm = Math.max(...n) * 1.15;
      const pn = new CQ.Plot(cn.ctx, { x: 0, y: 0, w: cn.w, h: cn.h, xmin: -4, xmax: 4, ymin: 0, ymax: nm, xlabel: 'x', ylabel: 'n(x)', title: 'lo único que se «mide»: la densidad' });
      pn.frame();
      pn.xy(x, Array.from(n), { color: '--prob', width: 2.4, fill: '--prob', fillAlpha: 0.15 });
      CQ.draw.clear(cv);
      let vmin = Infinity; for (let q = 0; q <= 200; q++) vmin = Math.min(vmin, V(-4 + 0.04 * q));
      const pv = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -4, xmax: 4, ymin: vmin - 0.5, ymax: vmin + 6, xlabel: 'x', ylabel: 'v(x)', title: 'potencial verdadero y reconstruido' });
      pv.frame();
      pv.fn(V, { color: '--ink', width: 3, alpha: 0.35 });
      pv.xy(xs, vr, { color: '--c2', width: 1.8, dash: [6, 3] });
      pv.hline(r.E[0], { color: '--accent', label: 'E del orbital' });
      pv.legend([{ label: 'verdadero', color: '--ink' }, { label: 'reconstruido desde n(x)', color: '--c2', dash: [6, 3] }], 'tr');
      let dev = 0; xs.forEach((xx, i) => { if (Math.abs(xx) < 3) dev = Math.max(dev, Math.abs(vr[i] - V(xx))); });
      sim.set('E', f6(r.E[0]));
      sim.set('dev', CQ.sci(dev, 3) + ' (|x| < 3)');
      sim.set('N', CQ.fix(P.integ.trapz(n, h), 6));
    });
  });

  /* ======================================================================
     16.3 Ciclo de Kohn–Sham para átomos (LDA)
     ====================================================================== */
  CQ.defineSim('ciclo-ks', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 0.95 });
    const cn = sim.canvas({ aspect: 0.95 });
    const cc = sim.canvas({ aspect: 4.2, cls: 'full' });
    sim.group('Átomo y ciclo');
    sim.slider('Z', { label: 'Átomo', min: 1, max: 18, value: 7, step: 1, fmt: (v) => `${v} · ${A.SYM[v]}` });
    sim.slider('mix', { label: 'Mezcla α', min: 0.05, max: 1, value: 0.4, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.seg('start', { label: 'Potencial inicial', options: [['tf', 'apantallado'], ['bare', 'núcleo desnudo']], value: 'bare' });
    sim.button('1 iteración', () => step(1), { primary: true });
    sim.button('+5', () => step(5));
    sim.button('Converger', () => step(400));
    sim.button('Reiniciar', () => reset(), { newRow: true });
    sim.out('cfg', 'Configuración');
    sim.out('it', 'Iteración');
    sim.out('E', '<i>E</i><sub>total</sub>', { hl: true });
    sim.out('eig', 'Autovalores ε (Ha)');
    sim.out('nist', 'NIST (LDA)');
    let scf;
    const grid = A.grid({ N: 2001, rmax: 40 });
    const reset = () => { scf = new A.AtomSCF({ Z: sim.p.Z, method: 'lda', mix: sim.p.mix, start: sim.p.start, grid }); scf.step(); };
    const step = (k) => { scf.mix = sim.p.mix; for (let q = 0; q < k && !scf.converged; q++) scf.step(); };
    sim.onChange = (id) => { if (id === 'Z' || id === 'start') reset(); };
    reset();
    sim.onDraw(() => {
      const g = scf.g, Z = sim.p.Z, rmax = Math.min(6, 4 + 0.1 * Z);
      const VH = scf.VH, vxc = scf.vxc;
      /* potenciales multiplicados por r para ver la escala completa */
      CQ.draw.clear(cp);
      const pp = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: rmax, ymin: -Z - 0.5, ymax: Z + 0.5, xlabel: 'r (a₀)', ylabel: 'r·v(r) (Ha·a₀)', title: 'piezas del potencial de Kohn–Sham' });
      pp.frame();
      const xs = [], ye = [], yh = [], yx = [], ys = [];
      for (let i = 0; i < g.N; i += 3) { const r = g.r[i]; if (r > rmax) break; xs.push(r); ye.push(-Z); yh.push(r * VH[i]); yx.push(r * vxc[i]); ys.push(r * (scf.Vext[i] + VH[i] + vxc[i])); }
      pp.xy(xs, ye, { color: '--c1', width: 1.6, dash: [5, 4] });
      pp.xy(xs, yh, { color: '--c2', width: 2 });
      pp.xy(xs, yx, { color: '--c3', width: 2 });
      pp.xy(xs, ys, { color: '--ink', width: 2.6 });
      pp.legend([{ label: 'r·v_{ext} = −Z', color: '--c1', dash: [5, 4] }, { label: 'r·v_{H}', color: '--c2' }, { label: 'r·v_{xc}', color: '--c3' }, { label: 'r·v_{s} (total)', color: '--ink' }], 'br');
      /* densidad radial y contribución de cada orbital */
      CQ.draw.clear(cn);
      let mx = 0; const dx = [], dy = [];
      for (let i = 0; i < g.N; i += 3) { const r = g.r[i]; if (r > rmax) break; const v = 4 * Math.PI * r * r * scf.n[i]; dx.push(r); dy.push(v); mx = Math.max(mx, v); }
      const pd = new CQ.Plot(cn.ctx, { x: 0, y: 0, w: cn.w, h: cn.h, xmin: 0, xmax: rmax, ymin: 0, ymax: mx * 1.12, xlabel: 'r (a₀)', ylabel: '4πr²n(r)', title: 'densidad radial y capas' });
      pd.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      scf.occ.forEach((o, k) => {
        const s = scf.orbs[k], ox = [], oy = [];
        for (let i = 0; i < g.N; i += 3) { const r = g.r[i]; if (r > rmax) break; ox.push(r); oy.push(o.f * s.u[i] * s.u[i]); }
        pd.xy(ox, oy, { color: cols[k % 5], width: 1.3, dash: [4, 3] });
      });
      pd.xy(dx, dy, { color: '--prob', width: 2.6, fill: '--prob', fillAlpha: 0.12 });
      pd.legend(scf.occ.map((o, k) => ({ label: `${o.n}${A.LLET[o.l]}${o.f}`.replace(/(\d)$/, (m) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[m]), color: cols[k % 5], dash: [4, 3] })).concat([{ label: 'total', color: '--prob' }]));
      /* convergencia */
      CQ.draw.clear(cc);
      const H = scf.history;
      const pc = new CQ.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: Math.max(10, H.length + 1), ymin: -10, ymax: 2, xlabel: 'iteración', ylabel: 'log₁₀ error', mt: 8 });
      pc.frame();
      pc.path(H.slice(1).map((h) => [h.iter, Math.log10(Math.max(1e-10, Math.abs(h.dE)))]), { color: '--c2', width: 2 });
      pc.path(H.map((h) => [h.iter, Math.log10(Math.max(1e-10, h.dV))]), { color: '--c1', width: 2 });
      pc.legend([{ label: '|ΔE| (Ha)', color: '--c2' }, { label: 'max|rΔV|', color: '--c1' }], 'tr');
      const last = scf.last;
      const ref = A.NIST_LDA[Z];
      sim.set('cfg', A.configStr(scf.occ));
      sim.set('it', `${scf.iter}${scf.converged ? ' ✓' : ''}`);
      sim.set('E', f6(last.Etot) + ' Ha');
      sim.set('eig', scf.occ.map((o, k) => `${o.n}${A.LLET[o.l]}: ${CQ.fix(last.eig[k], 5)}`).join('<br>'));
      sim.set('nist', ref ? `${ref.E} Ha` : 'sin dato tabulado aquí');
    });
  });
})();
