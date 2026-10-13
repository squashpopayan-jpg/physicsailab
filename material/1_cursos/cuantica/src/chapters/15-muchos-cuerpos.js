/* Capítulo 15 — El problema de muchos electrones */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom;
  const f6 = (v) => CQ.fix(v, 6);

  /* ======================================================================
     15.1 Muro exponencial
     ====================================================================== */
  CQ.defineSim('muro-exponencial', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Malla');
    sim.slider('p', { label: 'Puntos por coordenada <i>p</i>', min: 4, max: 100, value: 10, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('N', { label: 'Número de electrones <i>N</i>', min: 1, max: 40, value: 7, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('num', 'Números para Ψ(<b>r</b>₁…<b>r</b><sub>N</sub>)', { hl: true });
    sim.out('mem', 'Memoria (8 bytes por número)');
    sim.out('dens', 'Números para la densidad <i>n</i>(<b>r</b>)');
    sim.out('cmp', 'Comparación');
    const SYS = [[1, 'H'], [2, 'He'], [6, 'C, benceno π'], [7, 'N'], [8, 'B + N (valencia)'], [32, 'celda de Mazzoni']];
    sim.onDraw(() => {
      const p = sim.p.p, N = sim.p.N;
      const lg = (n) => 3 * n * Math.log10(p);
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 41, ymin: 0, ymax: Math.max(130, lg(40) * 1.05), xlabel: 'número de electrones N', ylabel: 'log₁₀(números necesarios)' });
      pl.frame();
      pl.fn((n) => lg(n), { color: '--c2', width: 2.4 });
      pl.hline(3 * Math.log10(p), { color: '--c3', label: 'densidad n(r): p³ números para cualquier N' });
      pl.hline(80, { color: '--ink-3', label: 'átomos del universo observable (~10⁸⁰)' });
      pl.hline(Math.log10(1e18 / 8), { color: '--c4', dash: [3, 3], label: 'memoria de un supercomputador (~1 EB)' });
      SYS.forEach(([n, lab]) => pl.dot(n, lg(n), { color: '--c2', r: 4, label: lab, dy: -10 }));
      pl.dot(N, lg(N), { color: '--accent', r: 6 });
      const e = lg(N);
      const bytes = e + Math.log10(8);
      sim.set('num', `10^${CQ.fix(e, 1)}`.replace(/\^([\d.]+)/, (m, x) => `<sup>${x}</sup>`));
      sim.set('mem', bytes < 18 ? CQ.si(Math.pow(10, bytes), 'B') : `10<sup>${CQ.fix(bytes, 1)}</sup> B`);
      sim.set('dens', CQ.fix(Math.pow(p, 3), 0));
      sim.set('cmp', e > 80 ? 'más que átomos en el universo' : bytes > 18 ? 'imposible de almacenar' : 'almacenable');
    });
  });

  /* ======================================================================
     15.2 Ciclo autoconsistente del helio
     ====================================================================== */
  CQ.defineSim('scf-helio', function (sim) {
    sim.cols2();
    const ch = sim.canvas({ aspect: 0.95 });
    const cn = sim.canvas({ aspect: 0.95 });
    sim.group('Sistema y método');
    sim.seg('Z', { label: 'Dos electrones en 1s', options: [[1, 'H⁻'], [2, 'He'], [3, 'Li⁺']], value: 2 });
    sim.seg('m', { label: 'Método', options: [['hartree', 'Hartree'], ['hf', 'Hartree–Fock'], ['lda', 'LDA']], value: 'hf' });
    sim.slider('mix', { label: 'Mezcla α', min: 0.05, max: 1, value: 0.4, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.seg('start', { label: 'Potencial inicial', options: [['tf', 'apantallado (TF)'], ['bare', 'núcleo desnudo']], value: 'bare' });
    sim.group('Iterar');
    sim.button('1 iteración', () => step(1), { primary: true });
    sim.button('+10', () => step(10));
    sim.button('Hasta converger', () => step(300));
    sim.button('Reiniciar', () => reset(), { newRow: true });
    sim.out('it', 'Iteración');
    sim.out('E', 'Energía total', { hl: true });
    sim.out('e1', 'Autovalor ε<sub>1s</sub>');
    sim.out('dV', 'max |<i>r</i>(<i>V</i><sub>out</sub> − <i>V</i><sub>in</sub>)|');
    sim.out('ref', 'Referencia');
    let scf, ref = null, refKey = '';
    const grid = A.grid({ N: 1501, rmax: 30 });
    const occ = () => [{ n: 1, l: 0, f: 2 }];
    const reset = () => { scf = new A.AtomSCF({ Z: +sim.p.Z, method: sim.p.m, occ: occ(), mix: sim.p.mix, start: sim.p.start, grid }); scf.step(); };
    const step = (k) => { scf.mix = sim.p.mix; for (let q = 0; q < k && !scf.converged; q++) scf.step(); };
    sim.onChange = (id) => {
      /* el H⁻ no está ligado en LDA: su orbital 1s no tiene autovalor negativo */
      if (sim.p.m === 'lda' && +sim.p.Z === 1) sim.ctl.Z.set(2, true);
      if (id === 'Z' || id === 'm' || id === 'start') reset();
    };
    reset();
    sim.onDraw(() => {
      const key = `${sim.p.Z}|${sim.p.m}`;
      if (key !== refKey) { ref = A.solve({ Z: +sim.p.Z, method: sim.p.m, occ: occ(), grid }); refKey = key; }
      const H = scf.history;
      CQ.draw.clear(ch);
      const pl = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: Math.max(10, H.length + 1), ymin: -10, ymax: 1, xlabel: 'iteración', ylabel: 'log₁₀ error', title: 'convergencia' });
      pl.frame();
      pl.path(H.map((h) => [h.iter, Math.log10(Math.max(1e-10, h.dV))]), { color: '--c1', width: 2 });
      pl.path(H.map((h) => [h.iter, Math.log10(Math.max(1e-10, Math.abs(h.Etot - ref.Etot)))]), { color: '--c2', width: 2 });
      pl.legend([{ label: 'max|r ΔV|', color: '--c1' }, { label: '|E − E_{conv}| (Ha)', color: '--c2' }]);
      /* densidad radial */
      CQ.draw.clear(cn);
      const g = scf.g;
      const Z = +sim.p.Z;
      const rmax = 4 / Math.max(0.6, Z - 0.5);
      const pd = new CQ.Plot(cn.ctx, { x: 0, y: 0, w: cn.w, h: cn.h, xmin: 0, xmax: rmax, ymin: 0, ymax: Z === 1 ? 1.2 : 2.6 * (Z / 2) ** 1, xlabel: 'r (a₀)', ylabel: '4πr²n(r)', title: 'densidad radial' });
      pd.frame();
      const xs = [], yi = [];
      for (let i = 0; i < g.N; i += 4) { const r = g.r[i]; if (r > rmax) break; xs.push(r); yi.push(4 * Math.PI * r * r * scf.n[i]); }
      pd.xy(xs, xs.map((r) => 2 * 4 * Z ** 3 * r * r * Math.exp(-2 * Z * r)), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pd.xy(xs, yi, { color: '--prob', width: 2.4, fill: '--prob', fillAlpha: 0.15 });
      pd.legend([{ label: `iteración ${scf.iter}`, color: '--prob' }, { label: 'sin repulsión (1s de carga Z)', color: '--ink-3', dash: [5, 4] }]);
      const r = scf.last;
      sim.set('it', `${scf.iter}${scf.converged ? ' (convergido)' : ''}`);
      sim.set('E', f6(r.Etot) + ' Ha');
      sim.set('e1', f6(r.eig[0]) + ' Ha');
      sim.set('dV', CQ.sci(r.dV, 2));
      const refs = { hf: { 2: -2.86168, 1: -0.48793, 3: -7.23641 }, lda: { 2: -2.834836 } };
      const rv = refs[sim.p.m] && refs[sim.p.m][Z];
      sim.set('ref', rv ? `${rv} Ha (${sim.p.m === 'hf' ? 'HF' : 'NIST'})` : 'exacta: ' + { 1: -0.527751, 2: -2.903724, 3: -7.279913 }[Z] + ' Ha');
    });
  });
})();
