/* Portada: campo en vivo de un sistema de cargas arrastrables */
(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const view = new EM.View2D(cv, { xmin: -3, xmax: 3, ymin: -2.4, ymax: 2.4 });
    const charges = [
      { x: -1.2, y: 0.5, q: 2 },
      { x: 1.1, y: 0.6, q: -1 },
      { x: 0.2, y: -1.1, q: -1 }
    ];
    let sel = -1;
    const pick = (px, py) => {
      for (let i = charges.length - 1; i >= 0; i--) {
        if (Math.hypot(view.X(charges[i].x) - px, view.Y(charges[i].y) - py) < 16) return i;
      }
      return -1;
    };
    EM.pointer(cv, {
      down: (x, y) => { const i = pick(x, y); if (i < 0) return null; sel = i; return i; },
      move: (i, x, y) => {
        charges[i].x = EM.M.clamp(view.wx(x), view.x0 + 0.1, view.x1 - 0.1);
        charges[i].y = EM.M.clamp(view.wy(y), view.y0 + 0.1, view.y1 - 0.1);
        sim.redraw();
      },
      up: () => { sel = -1; sim.redraw(); },
      hover: (x, y) => pick(x, y) >= 0
    });
    sim.hint('Arrastra las cargas · rojo: +, azul: −', cv);
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      const Vf = (x, y) => EM.phys2.V(charges, x, y);
      /* Equipotenciales */
      EM.field.contours(view, Vf, [-3, -2, -1.4, -0.9, -0.5, -0.2, 0.2, 0.5, 0.9, 1.4, 2, 3, 4.5], { color: '--equip', width: 1, alpha: 0.55, dash: [4, 4], res: 5 });
      const Ef = (x, y) => EM.phys2.E(charges, x, y);
      const lines = EM.field.chargeLines(view, charges, Ef, { perUnit: 9, r0: 0.07 });
      lines.forEach((L) => EM.field.drawLine(view, L, { color: '--fline', width: 1.25, alpha: 0.85 }));
      charges.forEach((c, i) => EM.draw.charge(cv.ctx, view.X(c.x), view.Y(c.y), c.q, { r: 10 + 2 * Math.abs(c.q), selected: i === sel, label: (c.q > 0 ? '+' : '−') + Math.abs(c.q) + 'q' }));
    });
  });
})();
