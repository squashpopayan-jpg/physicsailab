/* Portada — estructuras cristalinas que giran */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss;

  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    const opts = [['NaCl', 'Cloruro de sodio (NaCl)'], ['diamond', 'Diamante (C, Si, Ge)'], ['CsCl', 'Cloruro de cesio (CsCl)'], ['zincblende', 'Blenda de zinc (GaAs)'], ['perovskite', 'Perovskita (SrTiO₃)'], ['fcc', 'Cúbica centrada en las caras (Cu)'], ['bcc', 'Cúbica centrada en el cuerpo (Fe)'], ['hcp', 'Hexagonal compacta (Mg)']];
    sim.select('st', { label: 'Estructura', options: opts, value: 'NaCl' });
    sim.out('z', 'Átomos por celda convencional', { hl: true });
    sim.out('nn', 'Vecinos más próximos');
    const DEF = { NaCl: ['Na', 'Cl'], diamond: ['Si'], CsCl: ['Cs', 'Cl'], zincblende: ['Ga', 'As'], perovskite: ['Sr', 'Ti', 'O'], fcc: ['Cu'], bcc: ['Fe'], hcp: ['Mg'] };
    const RAD = { NaCl: [0.55, 0.85], diamond: [0.55], CsCl: [0.85, 0.75], zincblende: [0.6, 0.6], perovskite: [0.9, 0.5, 0.6], fcc: [0.7], bcc: [0.75], hcp: [0.9] };
    const v = new EM.View3D(sim, cv, { az: EM.M.rad(30), el: EM.M.rad(20), radius: 2.4, persp: 0.18 });
    let t = 0, idx = 0;
    /* en la portada los controles están ocultos: la estructura cambia sola cada 7 s */
    sim.animate((dt) => {
      t += dt; v.az += dt * 0.25;
      if (t > 7) { t = 0; idx = (idx + 1) % opts.length; sim.ctl.st.set(opts[idx][0], true); }
    });
    sim.onDraw(() => {
      const name = sim.p.st, st = SS.structure(name, 1);
      v.begin();
      const bond = { diamond: 0.434, zincblende: 0.434, NaCl: 0.501, CsCl: 0.867, perovskite: 0.501 }[name];
      EM.renderCrystal(v, st, { N: name === 'hcp' ? [2, 2, 1] : [1, 1, 1], els: DEF[name], radii: RAD[name], rScale: name === 'hcp' ? 0.16 : 0.17, bonds: bond, bondDiff: name !== 'diamond' });
      v.render();
      EM.text(cv.ctx, opts.find((o) => o[0] === name)[1], 14, cv.h - 16, { size: 14, weight: 650, color: '--ink-2' });
      const sh = SS.neighbors(st, 0, 1)[0];
      sim.set('z', String(st.atoms.length) + (st.atoms.length > 1 && DEF[name].length > 1 ? ' (' + DEF[name].map((e, i) => st.atoms.filter((a) => a.s === i).length + ' ' + e).join(' + ') + ')' : ''));
      sim.set('nn', sh.n + ' a ' + EM.fix(sh.d, 3) + ' a');
    });
  });
})();
