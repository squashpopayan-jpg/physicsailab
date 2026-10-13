/* Portada: red neuronal entrenándose en vivo sobre dos espirales */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L;
  ML.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    let data, net, opt, epoch, hold, run = 0;
    const reset = () => {
      run++;
      data = L.data.make2d('spiral', 300, 0.25, L.rng(40 + run));
      net = L.nn.mlp({ sizes: [2, 12, 12, 1], act: 'tanh', rng: L.rng(7 + run) });
      opt = L.opt.make('adam', { lr: 0.03 });
      epoch = 0; hold = 0;
    };
    reset();
    const view = ML.view2(cv, 1.75);
    sim.animate(() => {
      if (epoch < 400) { for (let k = 0; k < 2; k++) { net.epoch(data.X, data.y, opt, { batch: 32, rng: L.rng(epoch * 13 + run) }); epoch++; } }
      else if (++hold > 150) reset();
    });
    sim.onDraw(() => {
      view.update();
      ML.draw.clear(cv);
      ML.probMap(view, (x, y) => net.predict1([x, y])[0], { res: 5, alpha: 0.6 });
      ML.contour(view, (x, y) => net.predict1([x, y])[0] - 0.5, 0, { res: 5, width: 2, color: '--ink' });
      ML.points(view, data.X, data.y, { r: 3.3 });
      const acc = L.met.accuracy(data.y, data.X.map((x) => (net.predict1(x)[0] >= 0.5 ? 1 : 0)));
      ML.text(cv.ctx, `época ${epoch} · exactitud de entrenamiento ${ML.fix(100 * acc, 1)} %`, 10, cv.h - 10, { size: 11.5, color: '--ink-2', halo: true, mono: true });
    });
  });
})();
