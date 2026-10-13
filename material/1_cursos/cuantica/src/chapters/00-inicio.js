/* Portada: Monte Carlo en vivo del Hamiltoniano de hBN-MC (poro triangular con borde de N) */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P;
  CQ.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.2 });
    const L = 20;
    let lat, sweeps = 0;
    const T = 6500;
    let seed = 2026;
    const reset = () => {
      lat = new P.hbn.Lattice(L, { rng: P.rng(seed++), res: 'H2', dmu: -1.5 });
      lat.triangle(5, 'N');
      lat.E = lat.energy();
      sweeps = 0;
    };
    reset();
    const view = new CQ.View2D(cv, { xmin: -0.8, xmax: lat.g.W - 0.2, ymin: -0.9, ymax: lat.g.H - 0.4 });
    sim.animate(() => {
      lat.sweep(T, lat.N);
      sweeps += 1;
      if (sweeps > 1500) reset();
    });
    sim.onDraw(() => {
      view.update();
      CQ.draw.clear(cv);
      CQ.drawLattice(view, lat, { r: Math.max(2.2, 0.27 * view.s) });
      const pores = lat.pores();
      const ctx = cv.ctx;
      const tag = `paso ${sweeps} · poros ${pores.length} · mayor ${pores.length ? pores[0].n : 0} vac. · ${lat.nH()} H`;
      CQ.text(ctx, tag, 10, cv.h - 10, { size: 11.5, color: '--ink-2', halo: true, mono: true });
      const lg = [['B', 'boro'], ['N', 'nitrógeno'], ['H', 'hidrógeno']];
      lg.forEach(([sp, name], i) => {
        const x = 16 + i * 104, y = 16;
        CQ.draw.atom(ctx, x, y, 6, sp);
        CQ.text(ctx, name, x + 11, y + 4, { size: 11.5, color: '--ink-2', halo: true });
      });
    });
  });
})();
