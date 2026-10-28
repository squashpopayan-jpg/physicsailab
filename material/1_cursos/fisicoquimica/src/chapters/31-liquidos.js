/* Capítulo 31 — Líquidos: Monte Carlo del fluido de Lennard–Jones y segundo coeficiente virial */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, Lq = FQ.liq;
  const NA = 6.02214076e23;

  /* 31.1 Monte Carlo NVT del fluido de Lennard–Jones */
  EM.defineSim('lj-mc', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rho', { label: 'Densidad reducida ρ* = ρσ³', min: 0.05, max: 1.0, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura reducida T* = k_BT/ε', min: 0.6, max: 4, step: 0.05, value: 1.0, fmt: (v) => v.toFixed(2) });
    sim.button('Simular (N = 108, unos segundos)', () => run(), { primary: true });
    sim.out('st', 'Estado', { hl: true });
    sim.out('e', 'Energía configuracional por partícula <i>U</i>/<i>N</i>ε · presión <i>P</i>* = <i>Pσ</i>³/ε (virial + cola) · factor de compresión <i>Z</i> = <i>P</i>/ρ<i>T</i>');
    sim.out('g', 'Primer pico de <i>g</i>(<i>r</i>): posición y altura · número de coordinación hasta el primer mínimo');
    sim.out('ar', 'En unidades del argón (ε/k = 119.8 K, σ = 3.405 Å): temperatura, densidad, presión');
    let res = null, busy = false;
    const run = () => { if (busy) return; busy = true; sim.set('st', 'simulando…'); setTimeout(() => { const p = sim.p; res = Object.assign({ rho: p.rho, T: p.T }, Lq.mc(108, p.rho, p.T, { eq: 400, prod: 1200, seed: 2024 })); busy = false; sim.set('st', 'listo'); sim.redraw(); }, 30); };
    sim.onDraw(() => {
      const ctx = cv.ctx; EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 3, ymin: 0, ymax: 3.5, xlabel: 'r/σ', ylabel: 'g(r)', ml: 46, title: 'Función de distribución radial' });
      pl.frame(); pl.hline(1, { color: '--ink-3', dash: [4, 3] });
      if (res) {
        const g = res.g, r = res.r, c = Lq.coord(r, g, res.rho), mx = Math.max(...g);
        pl.xy(r, g, { color: '--c1', width: 2.6 }); pl.vline(c.rmin, { color: '--c2', dash: [3, 3], label: 'r_min' });
        const Z = res.P / (res.rho * res.T);
        sim.set('e', EM.fix(res.U, 3) + ' · ' + EM.fix(res.P, 3) + ' · ' + EM.fix(Z, 3));
        sim.set('g', EM.fix(c.rpeak, 2) + 'σ, ' + EM.fix(c.gpeak, 2) + ' · ' + EM.fix(c.n, 1) + ' vecinos (r < ' + EM.fix(c.rmin, 2) + 'σ)');
        sim.set('ar', EM.fix(res.T * 119.8, 0) + ' K · ' + EM.fix(res.rho * 39.948 / (NA * Math.pow(3.405e-8, 3)), 3) + ' g/cm³ · ' + EM.fix((res.P * 119.8 * 1.380649e-23) / Math.pow(3.405e-10, 3) / 1e5, 1) + ' bar');
      } else { EM.text(ctx, 'Pulse «Simular» para muestrear el fluido (108 partículas en una caja con condiciones periódicas)', pl.ix + pl.iw / 2, pl.iy + pl.ih / 2, { size: 13, align: 'center', color: '--ink-3' }); sim.set('st', 'sin simular'); }
    });
  });

  /* 31.2 Segundo coeficiente virial del fluido de Lennard–Jones */
  EM.defineSim('b2-lj', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura reducida T*', min: 0.6, max: 12, step: 0.05, value: 2.5, log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('eps', { label: 'ε/k de la sustancia (para convertir a unidades reales)', min: 30, max: 400, step: 1, value: 119.8, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('sig', { label: 'σ de la sustancia', min: 2.5, max: 5, step: 0.005, value: 3.405, unit: 'Å', fmt: (v) => v.toFixed(3) });
    sim.out('B', '<i>B</i><sub>2</sub>*(<i>T</i>*) · <i>B</i><sub>2</sub> real (cm³/mol) a <i>T</i> = <i>T</i>*ε/<i>k</i>', { hl: true });
    sim.out('bo', 'Temperatura de Boyle <i>T</i><sub>B</sub>* y <i>T</i><sub>B</sub> real (donde <i>B</i><sub>2</sub> = 0, el gas es «casi ideal» a baja presión)');
    sim.out('Z', 'Factor de compresión a baja densidad: <i>Z</i> = 1 + <i>B</i><sub>2</sub>ρ a ρ* = 0.1');
    const TB = Lq.boyle();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Ts = Array.from({ length: 150 }, (_, i) => 0.6 * Math.pow(20, i / 149)), b2 = (T) => Lq.B2(T);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.6, xmax: 12, ymin: -8, ymax: 2, xlog: true, xlabel: 'T* = k_BT/ε', ylabel: 'B₂* = B₂/σ³', ml: 46 });
      pl.frame(); pl.hline(0, { color: '--ink-3' }); pl.xy(Ts, Ts.map(b2), { color: '--c1', width: 2.8 }); pl.vline(TB, { color: '--c2', dash: [4, 3], label: 'T_B* = 3.418' }); pl.dot(p.T, b2(p.T), { color: '--accent' });
      const v = NA * Math.pow(p.sig * 1e-8, 3), B = b2(p.T) * v;
      sim.set('B', EM.fix(b2(p.T), 4) + ' · ' + EM.fix(B, 1) + ' cm³/mol');
      sim.set('bo', EM.fix(TB, 3) + ' · ' + EM.fix(TB * p.eps, 0) + ' K');
      sim.set('Z', EM.fix(1 + b2(p.T) * 0.1, 4));
    });
  });
})();
