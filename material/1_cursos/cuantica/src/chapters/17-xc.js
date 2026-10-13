/* Capítulo 17 — Intercambio y correlación: LDA y GGA */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom;
  const f4 = (v) => CQ.fix(v, 4), f6 = (v) => CQ.fix(v, 6);
  const HA = P.K.Ha_eV;

  /* ======================================================================
     17.1 Gas homogéneo de electrones
     ====================================================================== */
  CQ.defineSim('gas-electrones', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Densidad');
    sim.slider('rs', { label: 'Radio de Wigner–Seitz <i>r</i><sub>s</sub>', min: 0.3, max: 10, value: 2, log: true, step: 0.01, unit: 'a₀', fmt: (v) => CQ.fix(v, 2) });
    sim.check('t', { label: 'Energía cinética <i>t</i><sub>s</sub> = 1.105/<i>r</i><sub>s</sub>²', value: true });
    sim.check('tot', { label: 'Energía total por electrón', value: true });
    sim.out('n', 'Densidad <i>n</i>');
    sim.out('kf', '<i>k</i><sub>F</sub> y <i>E</i><sub>F</sub>');
    sim.out('ex', 'ε<sub>x</sub>', { hl: true });
    sim.out('ec', 'ε<sub>c</sub> VWN / PZ', { hl: true });
    sim.out('vxc', '<i>v</i><sub>xc</sub> (VWN)');
    sim.out('min', 'Mínimo de la energía total');
    const MAT = [[1.54, 'h-BN (valencia)'], [2.07, 'Al'], [2.67, 'Cu'], [3.93, 'Na'], [5.62, 'Cs']];
    sim.onDraw(() => {
      const rs = sim.p.rs, nOf = (r) => 3 / (4 * Math.PI * r ** 3);
      const ts = (r) => 1.105 / (r * r), ex = (r) => A.xc.ex(nOf(r)), ecV = (r) => A.xc.vwn(nOf(r))[0], ecP = (r) => A.xc.pz(nOf(r))[0];
      const tot = (r) => ts(r) + ex(r) + ecV(r);
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.3, xmax: 10, xlog: true, ymin: -1, ymax: 0.6, xlabel: 'r_s (a₀)', ylabel: 'energía por electrón (Ha)' });
      pl.frame();
      MAT.forEach(([r, lab]) => { pl.vline(r, { color: '--grid-2', dash: [3, 3] }); pl.label(r, 0.5, lab, { color: '--ink-3', size: 10.5, align: 'center' }); });
      if (sim.p.t) pl.fn(ts, { color: '--c3', width: 1.8, n: 400 });
      pl.fn(ex, { color: '--c1', width: 2.2, n: 400 });
      pl.fn(ecV, { color: '--c2', width: 2.2, n: 400 });
      pl.fn(ecP, { color: '--c4', width: 1.4, dash: [5, 3], n: 400 });
      if (sim.p.tot) pl.fn(tot, { color: '--ink', width: 2.4, n: 400 });
      pl.vline(rs, { color: '--accent' });
      const leg = [{ label: 'ε_x (Dirac)', color: '--c1' }, { label: 'ε_c VWN', color: '--c2' }, { label: 'ε_c PZ', color: '--c4', dash: [5, 3] }];
      if (sim.p.t) leg.unshift({ label: 't_s', color: '--c3' });
      if (sim.p.tot) leg.push({ label: 't_s + ε_x + ε_c', color: '--ink' });
      pl.legend(leg, 'br');
      const mn = P.util.golden(tot, 1, 10, 1e-8);
      const n = nOf(rs), kf = Math.cbrt(3 * Math.PI * Math.PI * n);
      sim.set('n', CQ.sci(n, 4) + ' a₀⁻³');
      sim.set('kf', `${f4(kf)} a₀⁻¹ · ${CQ.fix((kf * kf / 2) * HA, 3)} eV`);
      sim.set('ex', `${f6(ex(rs))} Ha`);
      sim.set('ec', `${f6(ecV(rs))} / ${f6(ecP(rs))}`);
      sim.set('vxc', f6(A.xc.vx(n) + A.xc.vwn(n)[1]) + ' Ha');
      sim.set('min', `r_s = ${CQ.fix(mn.x, 2)}, ${CQ.fix(mn.f, 4)} Ha`);
    });
  });

  /* ======================================================================
     17.2 Factor de realce y gradiente reducido
     ====================================================================== */
  const FX = {
    pbe: (s) => 1.804 - 0.804 / (1 + (0.21951 * s * s) / 0.804),
    revpbe: (s) => 2.245 - 1.245 / (1 + (0.21951 * s * s) / 1.245),
    pbesol: (s) => 1.804 - 0.804 / (1 + ((10 / 81) * s * s) / 0.804),
    ge: (s) => 1 + (10 / 81) * s * s
  };
  CQ.defineSim('factor-realce', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 0.95 });
    const cs = sim.canvas({ aspect: 0.95 });
    sim.group('Átomo para el perfil s(r)');
    sim.seg('Z', { options: [[2, 'He'], [7, 'N'], [10, 'Ne'], [18, 'Ar']], value: 7 });
    sim.out('exl', '<i>E</i><sub>x</sub> LDA (con la densidad LDA)');
    sim.out('exp', '<i>E</i><sub>x</sub> PBE (misma densidad)', { hl: true });
    sim.out('exh', '<i>E</i><sub>x</sub> de Hartree–Fock (referencia)');
    const HFX = { 2: -1.0258, 7: -6.597, 10: -12.108, 18: -30.185 };
    let cache = { Z: 0 };
    sim.onDraw(() => {
      const Z = +sim.p.Z;
      if (cache.Z !== Z) {
        const s = new A.AtomSCF({ Z, method: 'lda' }); s.run();
        const g = s.g, N = g.N, n = s.n;
        const sv = new Float64Array(N);
        for (let i = 1; i < N - 1; i++) { const dn = (n[i + 1] - n[i - 1]) / (2 * g.h) / g.r[i]; sv[i] = Math.abs(dn) / (2 * Math.cbrt(3 * Math.PI * Math.PI) * Math.pow(n[i], 4 / 3)); }
        const yL = new Float64Array(N), yP = new Float64Array(N);
        for (let i = 0; i < N; i++) { const e = n[i] * A.xc.ex(n[i]); yL[i] = e; yP[i] = e * FX.pbe(sv[i] || 0); }
        cache = { Z, g, n, sv, ExL: A.int3(g, yL), ExP: A.int3(g, yP) };
      }
      CQ.draw.clear(cf);
      const pf = new CQ.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: 0, xmax: 4, ymin: 0.9, ymax: 2.3, xlabel: 's', ylabel: 'F_x(s)', title: 'factor de realce del intercambio' });
      pf.frame();
      pf.hline(1, { color: '--ink-3', label: 'LDA' });
      pf.fn(FX.ge, { color: '--c4', width: 1.4, dash: [4, 3] });
      pf.fn(FX.pbe, { color: '--c1', width: 2.6 });
      pf.fn(FX.revpbe, { color: '--c2', width: 1.6 });
      pf.fn(FX.pbesol, { color: '--c3', width: 1.6 });
      pf.hline(1.804, { color: '--c1', dash: [2, 3], label: 'límite de Lieb–Oxford (PBE: 1.804)', labelRight: true });
      pf.legend([{ label: 'PBE', color: '--c1' }, { label: 'revPBE', color: '--c2' }, { label: 'PBEsol', color: '--c3' }, { label: 'gradiente 1 + 10s²/81', color: '--c4', dash: [4, 3] }], 'br');
      /* perfil s(r) y densidad */
      CQ.draw.clear(cs);
      const { g, n, sv } = cache;
      const ps = new CQ.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0.01, xmax: 8, xlog: true, ymin: 0, ymax: 3, xlabel: 'r (a₀)', ylabel: 's(r)', title: `gradiente reducido en el átomo de ${A.SYM[Z]}` });
      ps.frame();
      const xs = [], ys = [], yd = [];
      let mxd = 0;
      for (let i = 1; i < g.N - 1; i += 3) { if (g.r[i] < 0.01 || g.r[i] > 8) continue; xs.push(g.r[i]); ys.push(sv[i]); const d = 4 * Math.PI * g.r[i] ** 2 * n[i]; yd.push(d); mxd = Math.max(mxd, d); }
      ps.xy(xs, yd.map((d) => (2.6 * d) / mxd), { color: '--prob', width: 1.4, fill: '--prob', fillAlpha: 0.1 });
      ps.xy(xs, ys, { color: '--c1', width: 2.4 });
      ps.legend([{ label: 's(r)', color: '--c1' }, { label: '4πr²n (escalada)', color: '--prob' }], 'tl');
      sim.set('exl', f4(cache.ExL) + ' Ha');
      sim.set('exp', f4(cache.ExP) + ' Ha');
      sim.set('exh', HFX[Z] + ' Ha' + (Z === 7 ? ' (con espín polarizado: no comparable)' : ''));
    });
  });

  /* ======================================================================
     17.3 Átomos LDA: energías, componentes e ionización
     ====================================================================== */
  CQ.defineSim('atomo-lda', function (sim) {
    sim.cols2();
    const co = sim.canvas({ aspect: 0.95 });
    const ci = sim.canvas({ aspect: 0.95 });
    sim.group('Átomo');
    sim.slider('Z', { label: 'Elemento', min: 1, max: 18, value: 7, step: 1, fmt: (v) => `${v} · ${A.SYM[v]}` });
    sim.seg('m', { label: 'Funcional', options: [['lda', 'LDA'], ['x', 'solo intercambio'], ['hartree', 'Hartree']], value: 'lda' });
    sim.button('Calcular ionizaciones de H a Ar', () => { ieAll = []; for (let Z = 1; Z <= 18; Z++) { const r = A.ionizationDSCF(Z); ieAll.push({ Z, ds: r.IE * HA, homo: -(r.homo !== undefined ? r.homo : r.neutral.eig[0].E) * HA }); } });
    sim.out('E', '<i>E</i><sub>total</sub>', { hl: true });
    sim.out('cmp', 'Exacta / HF / NIST');
    sim.out('Ts', '<i>T</i><sub>s</sub> · <i>E</i><sub>ext</sub> · <i>E</i><sub>H</sub>');
    sim.out('xc', '<i>E</i><sub>x</sub> · <i>E</i><sub>c</sub>');
    sim.out('ie', 'Ionización ΔSCF / −ε<sub>HOMO</sub> / exp.', { hl: true });
    let cache = { key: '' }, ieAll = null;
    sim.onDraw(() => {
      const Z = sim.p.Z, m = sim.p.m;
      const key = `${Z}|${m}`;
      if (cache.key !== key) {
        const s = new A.AtomSCF({ Z, method: m }); const res = s.run();
        let ie = null;
        if (m === 'lda') ie = A.ionizationDSCF(Z);
        cache = { key, s, res, ie };
      }
      const { s, res, ie } = cache;
      /* orbitales */
      CQ.draw.clear(co);
      const g = s.g, rmax = 6;
      const po = new CQ.Plot(co.ctx, { x: 0, y: 0, w: co.w, h: co.h, xmin: 0, xmax: rmax, ymin: -1.1, ymax: 1.25, xlabel: 'r (a₀)', ylabel: 'u(r) = rR(r) (normalizada)', title: `orbitales de Kohn–Sham de ${A.SYM[Z]}` });
      po.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      s.occ.forEach((o, k) => {
        const u = s.orbs[k].u; let mx = 0; for (let i = 0; i < g.N; i++) if (g.r[i] < rmax) mx = Math.max(mx, Math.abs(u[i]));
        const xs = [], ys = [];
        for (let i = 0; i < g.N; i += 3) { if (g.r[i] > rmax) break; xs.push(g.r[i]); ys.push(u[i] / mx); }
        po.xy(xs, ys, { color: cols[k % 5], width: 2 });
      });
      po.legend(s.occ.map((o, k) => ({ label: `${o.n}${A.LLET[o.l]}  ε = ${CQ.fix(res.eig[k].E, 4)} Ha`, color: cols[k % 5] })), 'br');
      /* ionización */
      CQ.draw.clear(ci);
      const pi = new CQ.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: 0.5, xmax: 18.5, ymin: 0, ymax: 30, xlabel: 'Z', ylabel: 'energía de ionización (eV)', title: 'ionización: experimento, ΔSCF y −ε_{HOMO}' });
      pi.frame();
      pi.path(Array.from({ length: 18 }, (_, i) => [i + 1, A.IE[i + 1]]), { color: '--ink', width: 2 });
      if (ieAll) { ieAll.forEach((q) => { pi.dot(q.Z, q.ds, { color: '--c1', r: 3.5 }); pi.dot(q.Z, q.homo, { color: '--c2', r: 3.5 }); }); }
      else if (ie) { pi.dot(Z, ie.IE * HA, { color: '--c1', r: 5 }); pi.dot(Z, -(ie.homo !== undefined ? ie.homo : ie.neutral.eig[0].E) * HA, { color: '--c2', r: 5 }); pi.label(1, 28, 'Pulse «Calcular ionizaciones» para todos', { color: '--ink-3' }); }
      pi.vline(Z, { color: '--accent' });
      pi.legend([{ label: 'experimento (NIST)', color: '--ink' }, { label: 'ΔSCF LDA', color: '--c1', kind: 'dot' }, { label: '−ε_{HOMO} LDA', color: '--c2', kind: 'dot' }], 'tr');
      const nist = A.NIST_LDA[Z];
      sim.set('E', f6(res.Etot) + ' Ha');
      sim.set('cmp', `${A.EXACT[Z] !== undefined ? A.EXACT[Z] : '—'} / ${A.HF[Z] !== undefined ? A.HF[Z] : '—'} / ${nist && m === 'lda' ? nist.E : '—'}`);
      sim.set('Ts', `${f4(res.Ts)} · ${f4(res.Eext)} · ${f4(res.EH)}`);
      sim.set('xc', m === 'hartree' ? '0 · 0' : `${f4(res.Ex)} · ${f4(res.Ec)}`);
      sim.set('ie', ie ? `${CQ.fix(ie.IE * HA, 2)} / ${CQ.fix(-(ie.homo !== undefined ? ie.homo : ie.neutral.eig[0].E) * HA, 2)} / ${A.IE[Z]} eV` : 'solo con LDA');
    });
  });
})();
