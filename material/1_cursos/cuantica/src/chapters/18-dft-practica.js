/* Capítulo 18 — DFT en la práctica: SIESTA */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, A = P.atom, LA = P.la, TB = P.tb;
  const f6 = (v) => CQ.fix(v, 6), f4 = (v) => CQ.fix(v, 4);
  const HA = P.K.Ha_eV;

  /* ======================================================================
     18.1 Pseudopotencial de Kerker
     ====================================================================== */
  CQ.defineSim('pseudopotencial', function (sim) {
    sim.cols2();
    const cu = sim.canvas({ aspect: 0.95 });
    const cvv = sim.canvas({ aspect: 0.95 });
    sim.group('Átomo y canal');
    sim.seg('Z', { label: 'Elemento', options: [[5, 'B'], [6, 'C'], [7, 'N'], [8, 'O']], value: 7 });
    sim.seg('l', { label: 'Canal', options: [[0, '2s (l = 0)'], [1, '2p (l = 1)']], value: 0 });
    sim.slider('rc', { label: 'Radio de corte <i>r</i><sub>c</sub>', min: 0.8, max: 2.2, value: 1.4, step: 0.01, unit: 'a₀', fmt: (v) => CQ.fix(v, 2) });
    sim.check('ion', { label: 'Mostrar el pseudopotencial iónico (sin apantallar)', value: true });
    sim.out('eps', 'Autovalor todo-electrón', { hl: true });
    sim.out('epsp', 'Autovalor con el pseudopotencial', { hl: true });
    sim.out('q', 'Carga dentro de r<sub>c</sub>: AE / PS');
    sim.out('V0', '<i>V</i><sub>ps</sub>(0) apantallado');
    sim.out('zv', 'Carga de valencia <i>Z</i><sub>v</sub>');
    let atom = { Z: 0 };
    sim.onDraw(() => {
      const Z = +sim.p.Z, l = +sim.p.l, rc = sim.p.rc;
      if (atom.Z !== Z) { const s = new A.AtomSCF({ Z, method: 'lda' }); s.run(); atom = { Z, s }; }
      const s = atom.s, g = s.g, N = g.N;
      const kOf = (ll) => s.occ.findIndex((o) => o.n === 2 && o.l === ll);
      const k = kOf(l);
      const orb = s.orbs[k];
      const ps = A.kerker(g, orb.u, s.Vin, orb.E, l, rc);
      const chk = A.solveRadial(g, ps.Vps, l, 0, { E: orb.E });
      /* desapantallado con la densidad de valencia de los pseudoorbitales 2s y 2p */
      let Vion = null;
      if (sim.p.ion) {
        const nval = new Float64Array(N);
        for (const ll of [0, 1]) {
          const kk = kOf(ll); if (kk < 0) continue;
          const p2 = ll === l ? ps : A.kerker(g, s.orbs[kk].u, s.Vin, s.orbs[kk].E, ll, rc);
          const f = s.occ[kk].f;
          for (let i = 0; i < N; i++) nval[i] += (f * p2.ups[i] ** 2) / (4 * Math.PI * g.r[i] ** 2);
        }
        const { VH } = A.hartree(g, nval);
        Vion = new Float64Array(N);
        for (let i = 0; i < N; i++) Vion[i] = ps.Vps[i] - VH[i] - (A.xc.vx(nval[i]) + A.xc.vwn(nval[i])[1]);
      }
      const rmax = 5;
      /* orbitales */
      CQ.draw.clear(cu);
      let mx = 0; for (let i = 0; i < N; i++) if (g.r[i] < rmax) mx = Math.max(mx, Math.abs(ps.uae[i]), Math.abs(ps.ups[i]));
      const pu = new CQ.Plot(cu.ctx, { x: 0, y: 0, w: cu.w, h: cu.h, xmin: 0, xmax: rmax, ymin: -0.6, ymax: 1.15, xlabel: 'r (a₀)', ylabel: 'u(r) normalizada', title: `${A.SYM[Z]} 2${'sp'[l]}: todo-electrón y pseudo` });
      pu.frame();
      const xs = [], ya = [], yp = [];
      for (let i = 0; i < N; i += 2) { if (g.r[i] > rmax) break; xs.push(g.r[i]); ya.push(ps.uae[i] / mx); yp.push(ps.ups[i] / mx); }
      pu.band(0, ps.rc, { color: '--accent', alpha: 0.06 });
      pu.xy(xs, ya, { color: '--ink', width: 2.6, alpha: 0.5 });
      pu.xy(xs, yp, { color: '--c2', width: 2, dash: [6, 3] });
      pu.vline(ps.rc, { color: '--accent', label: 'r_c' });
      pu.legend([{ label: 'todo-electrón', color: '--ink' }, { label: 'pseudoorbital', color: '--c2', dash: [6, 3] }]);
      /* potenciales */
      CQ.draw.clear(cvv);
      const pv = new CQ.Plot(cvv.ctx, { x: 0, y: 0, w: cvv.w, h: cvv.h, xmin: 0, xmax: rmax, ymin: -12, ymax: 6, xlabel: 'r (a₀)', ylabel: 'V (Ha)', title: 'potenciales del canal ' + 'sp'[l] });
      pv.frame();
      const vx = [], va = [], vp = [], vi = [], vc = [];
      const Zv = s.occ.filter((o) => o.n === 2).reduce((q, o) => q + o.f, 0);
      for (let i = 0; i < N; i += 2) { const r = g.r[i]; if (r > rmax) break; if (r < 0.01) continue; vx.push(r); va.push(s.Vin[i]); vp.push(ps.Vps[i]); if (Vion) vi.push(Vion[i]); vc.push(-Zv / r); }
      pv.xy(vx, va, { color: '--ink', width: 2.4, alpha: 0.5 });
      pv.xy(vx, vp, { color: '--c2', width: 2.2 });
      if (Vion) { pv.xy(vx, vi, { color: '--c1', width: 2 }); pv.xy(vx, vc, { color: '--c1', width: 1.2, dash: [3, 3] }); }
      pv.vline(ps.rc, { color: '--accent' });
      pv.legend([{ label: 'todo-electrón −Z/r + v_H + v_{xc}', color: '--ink' }, { label: 'pseudo apantallado', color: '--c2' }].concat(Vion ? [{ label: 'pseudo iónico', color: '--c1' }, { label: '−Z_v/r', color: '--c1', dash: [3, 3] }] : []), 'br');
      sim.set('eps', f6(orb.E) + ' Ha');
      sim.set('epsp', `${f6(chk.E)} Ha (Δ = ${CQ.sci(chk.E - orb.E, 2)})`);
      sim.set('q', `${f6(ps.qAE)} / ${f6(ps.qPS)}`);
      sim.set('V0', f4(ps.Vps[0]) + ' Ha');
      sim.set('zv', String(Zv));
    });
  });

  /* ======================================================================
     18.2 Ondas planas: convergencia con el corte
     ====================================================================== */
  CQ.defineSim('ondas-planas', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 0.95 });
    const cd = sim.canvas({ aspect: 0.95 });
    const a = 4; /* periodo (a₀) */
    sim.group('Cadena de pozos gaussianos (periodo 4 a₀)');
    sim.slider('sig', { label: 'Anchura de cada pozo σ', min: 0.03, max: 1, value: 0.5, log: true, step: 0.001, unit: 'a₀', fmt: (v) => CQ.fix(v, 3) });
    sim.slider('S', { label: 'Intensidad integrada del pozo', min: 0.5, max: 4, value: 2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('M', { label: 'Ondas planas: 2M + 1 con M =', min: 1, max: 60, value: 6, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('E', '<i>E</i><sub>0</sub>(<i>M</i>)', { hl: true });
    sim.out('Ec', '<i>E</i><sub>0</sub> convergida (301 ondas planas)');
    sim.out('err', 'Error');
    sim.out('cut', 'Energía de corte ½<i>G</i><sub>máx</sub>²');
    const solve = (Mm, vect) => {
      const n = 2 * Mm + 1, H = LA.zeros(n), sig = sim.p.sig, S = sim.p.S;
      const VG = (m) => { const G = (2 * Math.PI * m) / a; return -(S / a) * Math.exp(-0.5 * G * G * sig * sig); };
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const mi = i - Mm, mj = j - Mm; H[i][j] = VG(mi - mj) + (i === j ? 0.5 * ((2 * Math.PI * mi) / a) ** 2 : 0); }
      if (vect) return LA.eigh(H);
      return LA.eigh(H, { vectors: false });
    };
    let cache = { key: '' };
    sim.onDraw(() => {
      const key = `${sim.p.sig}|${sim.p.S}`;
      if (cache.key !== key) {
        const Ec = solve(150, false).values[0];
        const pts = [];
        for (const m of [1, 2, 3, 4, 6, 8, 11, 15, 20, 27, 36, 48, 60, 80]) { const e = solve(m, false).values[0]; pts.push([m, Math.max(1e-9, e - Ec)]); }
        cache = { key, Ec, pts };
      }
      const Mm = sim.p.M;
      const r = solve(Mm, true);
      const E = r.values[0];
      CQ.draw.clear(cc);
      const pc = new CQ.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 1, xmax: 80, xlog: true, ymin: 1e-9, ymax: 10, ylog: true, xlabel: 'M (ondas planas = 2M + 1)', ylabel: 'E₀(M) − E₀ (Ha)', title: 'convergencia variacional' });
      pc.frame();
      pc.path(cache.pts, { color: '--c1', width: 2 });
      cache.pts.forEach(([m, e]) => pc.dot(m, e, { color: '--c1', r: 3 }));
      pc.hline(1e-3 / HA, { color: '--ink-3', label: '1 meV' });
      pc.vline(Mm, { color: '--accent' });
      /* densidad y potencial */
      CQ.draw.clear(cd);
      const xs = P.util.linspace(-a, a, 600);
      const psi = (x) => { let re = 0; for (let i = 0; i < 2 * Mm + 1; i++) re += r.vectors[i][0] * Math.cos((2 * Math.PI * (i - Mm) * x) / a); return re; };
      const V = (x) => { let v = 0; for (let n = -3; n <= 3; n++) v += -(sim.p.S / (sim.p.sig * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - n * a) ** 2) / (2 * sim.p.sig ** 2)); return v; };
      const vmin = Math.max(-12, V(0));
      const pd = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -a, xmax: a, ymin: vmin * 1.05, ymax: 2.2, xlabel: 'x (a₀)', ylabel: 'V, |ψ|² (escalada)', title: 'potencial y densidad del estado más bajo' });
      pd.frame();
      pd.fn((x) => Math.max(V(x), vmin * 1.04), { color: '--ink-2', width: 1.8, n: 1200 });
      const ys = xs.map((x) => psi(x) ** 2); const my = Math.max(...ys);
      pd.xy(xs, ys.map((y) => (1.8 * y) / my), { color: '--prob', width: 2.2, fill: '--prob', fillAlpha: 0.12 });
      sim.set('E', f6(E) + ' Ha');
      sim.set('Ec', f6(cache.Ec) + ' Ha');
      sim.set('err', `${CQ.sci(E - cache.Ec, 2)} Ha = ${CQ.sci((E - cache.Ec) * HA * 1000, 2)} meV`);
      const Gm = (2 * Math.PI * Mm) / a;
      sim.set('cut', `${CQ.fix(0.5 * Gm * Gm, 2)} Ha = ${CQ.fix(Gm * Gm, 2)} Ry`);
    });
  });

  /* ======================================================================
     18.3 Puntos k de Monkhorst–Pack
     ====================================================================== */
  CQ.defineSim('puntos-k', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 0.95 });
    const cb = sim.canvas({ aspect: 0.95 });
    const MODEL = { hbn: ['h-BN (aislante)', 2.3, 4.6, 0], gr: ['grafeno neutro (semimetal)', 2.7, 0, 0], met: ['grafeno dopado, E_F = +1 eV (metal)', 2.7, 0, 1.0] };
    sim.group('Sistema (modelo π)');
    sim.select('m', { options: Object.keys(MODEL).map((k) => [k, MODEL[k][0]]), value: 'hbn' });
    sim.slider('n', { label: 'Malla de Monkhorst–Pack <i>n</i> × <i>n</i>', min: 1, max: 40, value: 6, step: 1, fmt: (v) => `${v} × ${v}` });
    sim.out('Eb', 'Energía de banda por celda', { hl: true });
    sim.out('Er', 'Referencia (malla 240 × 240)');
    sim.out('err', 'Error');
    const lat = TB.honeycomb(1.44);
    const Eband = (n, mdl) => {
      const [, t, D, EF] = mdl; let s = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const u = (2 * i - n + 1) / (2 * n), v = (2 * j - n + 1) / (2 * n);
        const kx = u * lat.b1[0] + v * lat.b2[0], ky = u * lat.b1[1] + v * lat.b2[1];
        const b = TB.bands2(kx, ky, lat, D / 2, -D / 2, t);
        if (b[0] <= EF) s += 2 * b[0];
        if (b[1] <= EF) s += 2 * b[1];
      }
      return s / (n * n);
    };
    let cache = { key: '' };
    sim.onDraw(() => {
      const mdl = MODEL[sim.p.m];
      if (cache.key !== sim.p.m) {
        const ref = Eband(240, mdl), pts = [];
        for (let n = 1; n <= 40; n++) pts.push([n, Math.max(1e-7, Math.abs(Eband(n, mdl) - ref))]);
        cache = { key: sim.p.m, ref, pts };
      }
      const n = sim.p.n, E = Eband(n, mdl);
      CQ.draw.clear(cc);
      const pc = new CQ.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 1, xmax: 40, xlog: true, ymin: 1e-7, ymax: 10, ylog: true, xlabel: 'n (malla n × n)', ylabel: '|E(n) − E_{ref}| (eV/celda)', title: 'convergencia con la malla' });
      pc.frame();
      pc.path(cache.pts, { color: '--c1', width: 1.8 });
      cache.pts.forEach(([q, e]) => pc.dot(q, e, { color: q === n ? '--accent' : '--c1', r: q === n ? 5 : 2.5 }));
      pc.hline(1e-3, { color: '--ink-3', label: '1 meV' });
      /* malla sobre la zona de Brillouin */
      CQ.draw.clear(cb);
      const R = 1.25 * Math.hypot(...lat.b1);
      const vk = new CQ.View2D(cb, { xmin: -R, xmax: R, ymin: -R, ymax: R });
      vk.update();
      const ctx = cb.ctx;
      const Kr = Math.hypot(...lat.K);
      const hex = Array.from({ length: 6 }, (_, q) => [Kr * Math.cos((q * Math.PI) / 3), Kr * Math.sin((q * Math.PI) / 3)]);
      CQ.draw.poly(ctx, hex.map((p) => [vk.X(p[0]), vk.Y(p[1])]), { color: '--accent', width: 2, close: true, fill: CQ.alpha('--accent', 0.06) });
      const par = [[0, 0], lat.b1, [lat.b1[0] + lat.b2[0], lat.b1[1] + lat.b2[1]], lat.b2].map((p) => [p[0] - (lat.b1[0] + lat.b2[0]) / 2, p[1] - (lat.b1[1] + lat.b2[1]) / 2]);
      CQ.draw.poly(ctx, par.map((p) => [vk.X(p[0]), vk.Y(p[1])]), { color: '--ink-3', width: 1, close: true, dash: [4, 3] });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const u = (2 * i - n + 1) / (2 * n), v = (2 * j - n + 1) / (2 * n);
        const kx = u * lat.b1[0] + v * lat.b2[0], ky = u * lat.b1[1] + v * lat.b2[1];
        ctx.beginPath(); ctx.arc(vk.X(kx), vk.Y(ky), Math.max(1.5, 4 - n / 10), 0, 7); ctx.fillStyle = CQ.col('--c1'); ctx.fill();
      }
      CQ.text(ctx, 'zona de Brillouin (hexágono) y celda recíproca usada (rombo)', 8, 16, { size: 11, color: '--ink-2', halo: true });
      sim.set('Eb', f6(E) + ' eV');
      sim.set('Er', f6(cache.ref) + ' eV');
      sim.set('err', CQ.sci(E - cache.ref, 2) + ' eV');
    });
  });
})();
