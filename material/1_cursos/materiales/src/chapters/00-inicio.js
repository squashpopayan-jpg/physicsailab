/* Portada: celdas unitarias giratorias */
(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    sim.seg('t', { label: 'Estructura', options: [['fcc', 'FCC'], ['bcc', 'BCC'], ['hcp', 'HCP'], ['nacl', 'NaCl'], ['diamond', 'Diamante']], value: 'fcc' });
    const v = new EM.View3D(sim, cv, { radius: 2.3, az: EM.M.rad(30), el: EM.M.rad(20) });
    sim.animate((dt) => { v.az += dt * 0.25; });
    const info = { fcc: 'Cu, Al, Ni, Au · NC 12 · FEA 0.74', bcc: 'Fe-α, Cr, W, Mo · NC 8 · FEA 0.68', hcp: 'Mg, Ti, Zn, Co · NC 12 · FEA 0.74', nacl: 'NaCl, MgO, FeO · NC 6', diamond: 'Si, Ge, C · NC 4 · FEA 0.34' };
    sim.onDraw(() => {
      const p = sim.p;
      v.begin();
      const big = { nacl: [0.9, 1.45], diamond: [1, 1], fcc: [1], bcc: [1] };
      if (p.t === 'hcp') EM.renderCell(v, 'hcp', { rScale: 0.42, size: 1.3 });
      else EM.renderCell(v, p.t, { rScale: p.t === 'fcc' ? 0.15 : p.t === 'bcc' ? 0.19 : p.t === 'diamond' ? 0.12 : 0.13, species: big[p.t], size: 2 });
      v.render();
      EM.text(cv.ctx, info[p.t], cv.w / 2, cv.h - 14, { size: 12, color: '--ink-2', align: 'center' });
    });
  });
})();
