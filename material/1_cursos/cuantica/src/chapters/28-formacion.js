/* Capítulo 28 — Potenciales químicos, energía de formación y estabilidad de los poros */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, H = P.hbn, SM = P.sm;
  const f2 = (v) => CQ.fix(v, 2), f3 = (v) => CQ.fix(v, 3);
  const transposed = (lat) => ({
    N: lat.N, s: lat.s,
    g: { x: lat.g.y, y: lat.g.x, nb: lat.g.nb },
    rel: (k, m) => { const r = lat.rel(k, m); return [r[1], r[0]]; }
  });
  /* Temperatura de un gas de H₂ a presión p con un Δμ_H dado (inversión de la termodinámica del capítulo 22) */
  const Tof = (dmu, p) => {
    const f = (T) => SM.h2Thermo(T, p).dmuH - dmu;
    if (f(30) < 0 || f(8000) > 0) return null;
    return P.util.bisect(f, 30, 8000);
  };

  /* ======================================================================
     28.1 Ventana química
     ====================================================================== */
  CQ.defineSim('ventana-quimica', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Referencias');
    sim.seg('ref', { label: 'Energía de un par BN en la lámina, μ<sub>BN</sub>', options: [['model', '3ε<sub>NB</sub> (modelo)'], ['dft', 'E(BN) (Tabla 5.1)']], value: 'model' });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: 0.5, value: -1, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('lp', { label: 'Presión de H₂ para traducir a temperatura (log₁₀ p / bar)', min: -10, max: 2, value: 0, step: 0.5, fmt: (v) => CQ.fix(v, 1) });
    sim.out('rng', 'μ<sub>N</sub> mín … máx (eV)');
    sim.out('w', 'Ancho de la ventana', { hl: true });
    sim.out('th', 'Umbral de apertura Δμ<sub>H</sub>*');
    sim.out('T', 'Temperatura del H₂ con ese Δμ<sub>H</sub>');
    sim.out('T0', 'Temperatura a la que se abre la ventana');
    sim.onDraw(() => {
      const ref = sim.p.ref, dmu = sim.p.dmu, p = Math.pow(10, sim.p.lp) * 1e5;
      const w = H.window(dmu, ref);
      CQ.draw.clear(cv);
      const mx = (d) => H.window(d, ref).muNmax, mn = (d) => H.window(d, ref).muNmin;
      const ylo = Math.min(mx(0.5), mn(-2)) - 0.5, yhi = Math.max(mx(-2), mn(0.5)) + 0.5;
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -2, xmax: 0.5, ymin: ylo, ymax: yhi, xlabel: 'Δμ_H (eV)', ylabel: 'μ_N (eV)', title: 'intervalo permitido del potencial químico del nitrógeno' });
      pl.frame();
      const th = w.dmuHOpen;
      pl.clip((ctx) => {
        ctx.fillStyle = CQ.alpha('--c3', 0.22);
        ctx.beginPath();
        ctx.moveTo(pl.X(-2), pl.Y(mx(-2)));
        ctx.lineTo(pl.X(th), pl.Y(mx(th)));
        ctx.lineTo(pl.X(-2), pl.Y(mn(-2)));
        ctx.closePath(); ctx.fill();
      });
      pl.fn(mx, { color: '--c1', width: 2.4 });
      pl.fn(mn, { color: '--c2', width: 2.4 });
      pl.vline(th, { color: '--ink-3', dash: [4, 4] });
      CQ.text(cv.ctx, 'Δμ_H* = ' + CQ.fix(th, 3), pl.X(th) + 5, pl.Y(ylo) - 8, { size: 11.5, color: '--ink-2', halo: true });
      pl.vline(dmu, { color: '--accent' });
      if (w.open) { pl.dot(dmu, w.muNmax, { color: '--c1' }); pl.dot(dmu, w.muNmin, { color: '--c2' }); }
      pl.legend([{ label: 'rico en N: μ_N = E(NH_3) − 3μ_H', color: '--c1' }, { label: 'rico en B: μ_N = μ_{BN} − E(BH_3) + 3μ_H', color: '--c2' }, { label: 'ventana abierta', color: '--c3', kind: 'sq' }], 'tr');
      const T = Tof(dmu, p), T0 = Tof(th, p);
      sim.set('rng', w.open ? `${f3(w.muNmin)} … ${f3(w.muNmax)}` : 'vacía');
      sim.set('w', w.open ? f3(w.width) + ' eV' : `vacía (${f3(w.width)} eV)`);
      sim.set('th', f3(th) + ' eV');
      sim.set('T', T ? CQ.fix(T, 0) + ' K a ' + CQ.sci(p / 1e5, 2) + ' bar' : '— (fuera del rango del gas ideal)');
      sim.set('T0', T0 ? 'T ≥ ' + CQ.fix(T0, 0) + ' K' : '—');
    });
  });

  /* ======================================================================
     28.2 E_form frente a μ_N
     ====================================================================== */
  CQ.defineSim('eform-mu', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Condiciones');
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: -0.6, value: -1, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('n', { label: 'Orden <i>n</i> de los poros triangulares', min: 1, max: 6, value: 3, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('tab', '<i>E</i><sub>form</sub> (eV) en los extremos y en el centro de la ventana', { wide: true });
    sim.out('ph', 'Por H del borde (triángulos)');
    let cache = '', data = null;
    const compute = (dmu, n) => {
      const envs = ['Brich', 'mid', 'Nrich'];
      const val = (mk) => envs.map((e) => { const L = new H.Lattice(30); mk(L); return L.formation(e, dmu); });
      return {
        vb: val((L) => { L.s[L.nearest(L.g.W / 2, L.g.H / 2, 0)] = 0; }),
        vn: val((L) => { L.s[L.nearest(L.g.W / 2, L.g.H / 2, 1)] = 0; }),
        tn: val((L) => L.triangle(n, 'N')),
        tb: val((L) => L.triangle(n, 'B')),
        w: H.window(dmu, 'model')
      };
    };
    sim.onDraw(() => {
      const dmu = sim.p.dmu, n = Math.round(sim.p.n);
      const key = dmu + '|' + n;
      if (key !== cache) { data = compute(dmu, n); cache = key; }
      const w = data.w, x0 = w.muNmin - w.muNmax, x1 = 0;
      CQ.draw.clear(cv);
      const all = ['vb', 'vn', 'tn', 'tb'].flatMap((k) => data[k].map((r) => r.Eform));
      const ymax = Math.max(...all) * 1.1 + 0.5, ymin = Math.min(...all) * 1.1 - 0.5;
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: x0, xmax: x1, ymin, ymax, xlabel: 'μ_N − μ_N^{máx} (eV):  rico en B ← → rico en N', ylabel: 'E_{form} (eV)', title: `ventana de μ_N con Δμ_H = ${f2(dmu)} eV` });
      pl.frame();
      const xs = [x0, 0.5 * x0, 0];
      const S = [['vb', 'V_B + 3H', '--c1', [5, 4]], ['vn', 'V_N + 3H', '--c2', [5, 4]], ['tn', `triángulo n = ${n}, borde N`, '--c1'], ['tb', `triángulo n = ${n}, borde B`, '--c2']];
      for (const [k, , c, d] of S) { pl.xy(xs, data[k].map((r) => r.Eform), { color: c, width: d ? 1.8 : 2.6, dash: d }); data[k].forEach((r, i) => pl.dot(xs[i], r.Eform, { color: c, r: 3.5 })); }
      pl.hline(0, { color: '--ink-3' });
      pl.legend(S.map(([, l, c, d]) => ({ label: l, color: c, dash: d })), 'tr');
      const row = (k, l) => [l].concat(data[k].map((r) => f3(r.Eform)));
      sim.set('tab', CQ.tableHTML([row('vb', 'V<sub>B</sub> + 3H'), row('vn', 'V<sub>N</sub> + 3H'), row('tn', `triángulo ${n}, borde N (${data.tn[0].nH} H)`), row('tb', `triángulo ${n}, borde B (${data.tb[0].nH} H)`)], ['', 'rico en B', 'centro', 'rico en N']));
      sim.set('ph', `borde N: ${f3(data.tn[2].Eform / data.tn[2].nH)} eV (rico en N) · borde B: ${f3(data.tb[0].Eform / data.tb[0].nH)} eV (rico en B)`);
    });
  });

  /* ======================================================================
     28.3 Energía de borde: compacto frente a fragmentado
     ====================================================================== */
  CQ.defineSim('energia-borde', function (sim) {
    const cl = sim.canvas({ aspect: 1.2 });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.group('Modelo');
    sim.seg('res', { label: 'Reservorio de H del Monte Carlo', options: [['tesis', 'Tesis 2019'], ['H2', 'Gran canónico (H₂)']], value: 'H2', onInput: (v) => sim.ctl.dmu.show(v === 'H2') });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: 0.5, value: -1.5, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('n', { label: 'Orden del poro triangular <i>n</i> (<i>n</i>² vacancias)', min: 2, max: 5, value: 4, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('eh', '<i>e</i><sub>H</sub>', { hl: true });
    sim.out('nh', '<i>N</i><sub>H</sub> compacto · fragmentado');
    sim.out('dE', '<i>E</i>(fragmentado) − <i>E</i>(compacto): motor · Δ<i>N</i><sub>H</sub> <i>e</i><sub>H</sub>');
    sim.out('win', 'Gana', { hl: true });
    const L = 20;
    let cache = '', st = null;
    const build = (res, dmu, n) => {
      const a = new H.Lattice(L, { res, dmu }); a.triangle(n, 'N');
      const b = new H.Lattice(L, { res, dmu, rng: P.rng(7) }); b.monovacancies((n * (n + 1)) / 2, 2); b.monovacancies((n * (n - 1)) / 2, 1);
      return { a, b, Ea: a.energy(), Eb: b.energy(), eH: H.edgePerH(res, dmu) };
    };
    sim.onDraw(() => {
      const res = sim.p.res, dmu = sim.p.dmu, n = Math.round(sim.p.n);
      const key = res + '|' + dmu + '|' + n;
      if (key !== cache) { st = build(res, dmu, n); cache = key; }
      CQ.draw.clear(cl);
      const half = cl.w / 2;
      [[st.a, 'compacto: triángulo con borde N'], [st.b, 'fragmentado: monovacancias']].forEach(([lat, title], i) => {
        const ctx = cl.ctx;
        ctx.save(); ctx.translate(i * half, 0);
        const v = new CQ.View2D({ w: half - 6, h: cl.h - 20, ctx }, { xmin: -0.7, xmax: lat.g.W - 0.2, ymin: -0.7, ymax: lat.g.H - 0.3 });
        v.update();
        ctx.translate(0, 20);
        CQ.drawLattice(v, lat, { r: Math.max(1.8, 0.27 * v.s) });
        ctx.translate(0, -20);
        CQ.text(ctx, half < 260 ? `${title.split(':')[0]} · ${lat.nH()} H` : `${title} · ${lat.nH()} H`, half / 2, 13, { size: 12, color: '--ink-2', align: 'center', weight: 600 });
        ctx.restore();
      });
      CQ.draw.clear(cp);
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -2, xmax: 0.5, ymin: -12, ymax: 3.5, xlabel: 'Δμ_H (eV)', ylabel: 'e_H (eV)', title: 'energía de borde por hidrógeno' });
      pl.frame();
      pl.clip((ctx) => { ctx.fillStyle = CQ.alpha('--c3', 0.12); ctx.fillRect(pl.X(-2), pl.Y(3.5), pl.X(0.5) - pl.X(-2), pl.Y(0) - pl.Y(3.5)); ctx.fillStyle = CQ.alpha('--c2', 0.08); ctx.fillRect(pl.X(-2), pl.Y(0), pl.X(0.5) - pl.X(-2), pl.Y(-12) - pl.Y(0)); });
      pl.fn((d) => H.edgePerH('H2', d), { color: '--c1', width: 2.6 });
      pl.hline(H.edgePerH('tesis', 0), { color: '--c2', width: 2.6, dash: [] });
      pl.hline(0, { color: '--ink-3' });
      pl.vline(-0.9431, { color: '--ink-3', dash: [4, 4] });
      if (res === 'H2') pl.dot(dmu, st.eH, { color: '--accent', r: 6 }); else pl.dot(-1.9, st.eH, { color: '--accent', r: 6 });
      CQ.text(cp.ctx, 'e_H > 0: poros compactos', pl.X(-1.95), pl.Y(2.5), { size: 11.5, color: '--c3', weight: 600 });
      CQ.text(cp.ctx, 'e_H < 0: los poros se fragmentan', pl.X(-1.95), pl.Y(-2.6), { size: 11.5, color: '--c2', weight: 600 });
      pl.legend([{ label: 'gran canónico: −0.943 − Δμ_H', color: '--c1' }, { label: 'tesis 2019: −8.46 eV', color: '--c2' }], 'br');
      const dN = st.b.nH() - st.a.nH(), dE = st.Eb - st.Ea;
      sim.set('eh', f3(st.eH) + ' eV');
      sim.set('nh', `${st.a.nH()} · ${st.b.nH()}`);
      sim.set('dE', `${f3(dE)} · ${f3(dN * st.eH)} eV`);
      sim.set('win', Math.abs(dE) < 1e-9 ? 'empate' : dE < 0 ? 'la fragmentación' : 'el poro compacto');
    });
    sim.ctl.dmu.show(true);
  });
})();
