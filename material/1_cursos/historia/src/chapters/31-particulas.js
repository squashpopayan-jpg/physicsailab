/* Capítulo 31 — Partículas y fuerzas */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 31.1 Yukawa */
  EM.defineSim('yukawa-alcance', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('m', { label: 'Masa del mediador', min: 10, max: 400, step: 1, value: 140, fmt: (v) => v.toFixed(0) + ' MeV' });
    sim.out('R', 'Alcance de la fuerza ħc/(mc²)', { hl: true });
    sim.out('f', 'Fuerza relativa a Coulomb a 5 fm');
    sim.note('Un campo cuyo cuanto tiene masa \\(m\\) genera un potencial \\(e^{-r/R}/r\\) con \\(R=\\hbar/mc\\). La fuerza de Coulomb, mediada por un fotón sin masa, tiene alcance infinito; la fuerza nuclear, que casi no se nota a más de 2-3 fm, requiere un mediador de unos 140 MeV. Yukawa (1935) lo propuso desde Osaka, sin ninguna observación, y tres años después se buscaba en los rayos cósmicos: el muón (1936) tenía la masa correcta pero no interaccionaba con los núcleos; el pión de Powell (1947) sí.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, R = C.yukawaRangeFm(p.m);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.3, xmax: 8, ymin: 1e-4, ymax: 10, ylog: true, xlabel: 'distancia (fm)', ylabel: 'potencial (unidades arbitrarias)' });
      pl.frame(); pl.fn((r) => 1 / r, { color: '--c3', width: 2, label: 'Coulomb' }); pl.fn((r) => C.yukawaV(r, R), { color: '--c1', width: 2.4, label: 'Yukawa' }); pl.vline(R, { color: '--accent' });
      sim.set('R', EM.fix(R, 2) + ' fm'); sim.set('f', EM.fix(C.yukawaV(5, R) / (1 / 5), 4));
    });
  });

  /* 31.2 Decuplete */
  EM.defineSim('decuplete', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('om', { label: 'Mostrar la predicción del Ω⁻ de Gell-Mann (1962)', value: true });
    sim.out('p', 'Masa predicha del Ω⁻ (espaciado uniforme)', { hl: true });
    sim.out('m', 'Masa medida en 1964');
    sim.out('e', 'Diferencia');
    sim.note('En 1961 Gell-Mann y Ne\'eman agruparon los hadrones en familias de 8 y 10 según su carga y su extrañeza («el óctuple camino»). Los nueve miembros conocidos del decuplete bariónico mostraban masas con espaciado casi uniforme: 1232, 1385, 1530. Gell-Mann predijo el décimo, con extrañeza −3, carga −1 y una masa de unos 1680 MeV, y dio la fórmula para su producción y desintegración. Se encontró en Brookhaven en febrero de 1964: 1672 MeV, con una vida media larga (esperada por la poca energía disponible para desintegrarse).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, D = C.DECUPLET.concat(p.om ? [['Ω⁻', -3, C.omegaPredict()]] : []);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -3.6, xmax: 0.6, ymin: 1100, ymax: 1800, xlabel: 'extrañeza S', ylabel: 'masa (MeV)' });
      pl.frame();
      const xs = D.map((d) => d[1]), ys = D.map((d) => d[2]); pl.xy(xs.slice(0, 3), ys.slice(0, 3), { color: '--c1', width: 2.2 });
      if (p.om) pl.xy([-2, -3], [1530, C.omegaPredict()], { color: '--c3', width: 2, dash: [5, 4] });
      D.forEach((d) => { pl.dot(d[1], d[2], { color: d[0] === 'Ω⁻' ? '--accent' : '--c1', r: 6 }); EM.text(ctx, d[0] + ' ' + EM.fix(d[2], 0), pl.X(d[1]) + 10, pl.Y(d[2]) - 8, { size: 11 }); });
      pl.dot(-3, 1672.45, { color: '--c2', r: 6 }); EM.text(ctx, 'medida 1964: 1672', pl.X(-3) - 120, pl.Y(1672.45) + 18, { size: 10.5, color: '--c2' });
      sim.set('p', EM.fix(C.omegaPredict(), 1) + ' MeV'); sim.set('m', '1672.45 MeV'); sim.set('e', EM.fix(C.omegaPredict() - 1672.45, 1) + ' MeV  (' + EM.fix((100 * (C.omegaPredict() - 1672.45)) / 1672.45, 2) + ' %)');
    });
  });

  /* 31.3 El Z y las familias de neutrinos */
  EM.defineSim('resonancia-z', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de familias de neutrinos ligeros', min: 2, max: 5, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.check('med', { label: 'Mostrar la curva medida en LEP (3 familias)', value: true });
    sim.out('G', 'Anchura total Γ', { hl: true });
    sim.out('s', 'Pico de la sección eficaz hadrónica');
    sim.out('t', 'Vida media ħ/Γ');
    sim.note('La anchura de una resonancia es la suma de las anchuras de todos los modos de desintegración: cada familia de neutrinos adicional, aunque no se vea en el detector, ensancha el pico y lo baja. En 1989, los experimentos de LEP midieron el pico del Z en e⁺e⁻ → hadrones y concluyeron que hay tres, y solo tres, familias de neutrinos ligeros: \\(N_\\nu=2.984\\pm0.008\\). Con ello se cerró la posibilidad de una cuarta generación con neutrino ligero.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, G = C.widthWithN(C.Z, p.N);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 86, xmax: 96, ymin: 0, ymax: 48, xlabel: 'energía en el centro de masas (GeV)', ylabel: 'σ(e⁺e⁻ → hadrones) (nb)' });
      pl.frame();
      if (p.med) pl.fn((e) => C.sigmaHad(e * 1000, C.Z, C.widthWithN(C.Z, 3)), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.fn((e) => C.sigmaHad(e * 1000, C.Z, G), { color: '--c1', width: 2.6 });
      sim.set('G', EM.fix(G / 1000, 3) + ' GeV'); sim.set('s', EM.fix(C.sigmaHad(C.Z.M, C.Z, G), 1) + ' nb'); sim.set('t', EM.fix(6.582119569e-25 / (G / 1000) / 1e-25, 2) + '×10⁻²⁵ s');
    });
  });
})();
