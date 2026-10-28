/* Capítulo 34 — Coloides y teoría DLVO */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, D = FQ.dlvo, kB = 1.380649e-23;

  /* 34.1 Doble capa de Gouy–Chapman */
  EM.defineSim('gouy-chapman', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('psi', { label: 'Potencial de superficie ψ₀', min: 5, max: 200, step: 1, value: 80, unit: 'mV', fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Concentración del electrolito 1:1', min: 0.0001, max: 1, step: 0.0001, value: 0.01, log: true, unit: 'mol/L', fmt: (v) => EM.sci(v, 2) });
    sim.out('k', 'Longitud de Debye κ⁻¹ = 0.304/√<i>c</i> nm (1:1, 25 °C) · potencial a una longitud de Debye', { hl: true });
    sim.out('s', 'Carga superficial de Grahame σ = √(8<i>c</i>₀εε₀<i>kT</i>) sinh(<i>e</i>ψ₀/2<i>kT</i>) · área por carga elemental');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, psi = p.psi * 1e-3, kap = D.kappa(p.c, 1), L = 8 / kap, xs = Array.from({ length: 200 }, (_, i) => (L * i) / 199);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: L * 1e9, ymin: 0, ymax: p.psi * 1.05, xlabel: 'distancia a la superficie (nm)', ylabel: 'potencial (mV)', ml: 48 });
      pl.frame(); pl.xy(xs.map((x) => x * 1e9), xs.map((x) => D.gc(psi, x, p.c, 1) * 1e3), { color: '--c1', width: 2.8 }); pl.xy(xs.map((x) => x * 1e9), xs.map((x) => p.psi * Math.exp(-kap * x)), { color: '--c2', width: 1.8, dash: [5, 4] }); pl.vline(1e9 / kap, { color: '--ink-3', dash: [3, 3], label: 'κ⁻¹' });
      pl.legend([{ label: 'Gouy–Chapman (exacto)', color: '--c1' }, { label: 'Debye–Hückel ψ₀e^{−κx}', color: '--c2', dash: [5, 4] }], 'tr');
      const sg = D.sigma(psi, p.c, 1);
      sim.set('k', EM.fix(1e9 / kap, 2) + ' nm · ' + EM.fix(D.gc(psi, 1 / kap, p.c, 1) * 1e3, 1) + ' mV');
      sim.set('s', EM.fix(sg * 1e3, 2) + ' mC/m² · ' + EM.fix(1.602176634e-19 / Math.abs(sg) * 1e18, 2) + ' nm² por carga');
    });
  });

  /* 34.2 DLVO */
  EM.defineSim('dlvo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('psi', { label: 'Potencial en el plano de Stern ψ_d (≈ ζ)', min: 5, max: 150, step: 1, value: 50, unit: 'mV', fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Concentración de sal', min: 0.0001, max: 1, step: 0.0001, value: 0.01, log: true, unit: 'mol/L', fmt: (v) => EM.sci(v, 2) });
    sim.seg('z', { label: 'Carga del electrolito z : z', options: [[1, '1 : 1'], [2, '2 : 2'], [3, '3 : 3']], value: 1 });
    sim.slider('a', { label: 'Radio de las partículas', min: 20, max: 2000, step: 1, value: 100, log: true, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Constante de Hamaker', min: 0.5, max: 10, step: 0.1, value: 3.7, unit: '10⁻²⁰ J', fmt: (v) => v.toFixed(1) });
    sim.out('b', 'Barrera de energía <i>V</i><sub>máx</sub>/<i>kT</i> y posición · mínimo secundario', { hl: true });
    sim.out('k', 'Longitud de Debye κ⁻¹ · concentración crítica de coagulación (CCC) para este ψ_d, <i>A</i> y <i>z</i>');
    sim.out('s', 'Estabilidad');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, a = p.a * 1e-9, z = +p.z, A = p.A * 1e-20, psi = p.psi * 1e-3, kT = kB * 298.15;
      EM.draw.clear(cv);
      const hs = Array.from({ length: 300 }, (_, i) => 0.3e-9 * Math.pow(1.0125, i)), Vt = (h) => D.V(h, a, psi, p.c, z, A) / kT, VRt = (h) => D.VR(h, a, psi, p.c, z) / kT, VAt = (h) => D.VA(h, a, A) / kT;
      const b = D.barrier(a, psi, p.c, z, A);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.3, xmax: 100, ymin: -30, ymax: 60, xlog: true, xlabel: 'separación h entre superficies (nm)', ylabel: 'V/k_BT', ml: 48 });
      pl.frame(); pl.hline(0, { color: '--ink-3' }); pl.xy(hs.map((h) => h * 1e9), hs.map((h) => Math.max(-30, Math.min(60, VRt(h)))), { color: '--c2', width: 1.6, dash: [5, 4] }); pl.xy(hs.map((h) => h * 1e9), hs.map((h) => Math.max(-30, Math.min(60, VAt(h)))), { color: '--c3', width: 1.6, dash: [2, 3] }); pl.xy(hs.map((h) => h * 1e9), hs.map((h) => Math.max(-30, Math.min(60, Vt(h)))), { color: '--c1', width: 2.8 });
      pl.legend([{ label: 'V total (DLVO)', color: '--c1' }, { label: 'repulsión de la doble capa', color: '--c2', dash: [5, 4] }, { label: 'atracción de van der Waals', color: '--c3', dash: [2, 3] }], 'tr');
      const cc = D.ccc(a, psi, z, A), ok = b.Vmax > 15;
      sim.set('b', EM.fix(b.Vmax, 1) + ' k_BT a ' + EM.fix(b.hmax * 1e9, 2) + ' nm · ' + EM.fix(b.Vmin2, 2) + ' k_BT a ' + EM.fix(b.hmin2 * 1e9, 1) + ' nm');
      sim.set('k', EM.fix(1e9 / D.kappa(p.c, z), 2) + ' nm · ' + (cc >= 4.9 ? '> 5 mol/L' : EM.sci(cc, 2) + ' mol/L'));
      sim.set('s', b.Vmax > 15 ? 'estable (barrera > 15 k_BT: la agregación es muy lenta)' : b.Vmax > 0 ? 'metaestable (barrera de unos pocos k_BT: agregación lenta)' : 'inestable: coagula rápidamente (sin barrera)');
    });
  });

  /* 34.3 Electroforesis y potencial zeta */
  EM.defineSim('zeta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('mu', { label: 'Movilidad electroforética medida μ', min: -6, max: 6, step: 0.05, value: -3, unit: '10⁻⁸ m²/V·s', fmt: (v) => v.toFixed(2) });
    sim.slider('ka', { label: 'Producto κa (radio de la partícula / longitud de Debye)', min: 0.1, max: 1000, step: 0.1, value: 30, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('z', 'Potencial zeta ζ por Henry (Ohshima) · por Smoluchowski (ζ = η μ/εε₀) · por Hückel (ζ = 3ημ/2εε₀)', { hl: true });
    sim.out('f', 'Función de Henry <i>f</i>(κa): entre 1 (Hückel, partículas pequeñas en medio diluido) y 3/2 (Smoluchowski, partículas grandes o sal)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, mu = p.mu * 1e-8, eta = 8.9e-4, eps = 78.38 * 8.8541878128e-12;
      EM.draw.clear(cv);
      const ks = Array.from({ length: 200 }, (_, i) => 0.1 * Math.pow(1e4, i / 199)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 1000, ymin: 0.95, ymax: 1.55, xlog: true, xlabel: 'κa', ylabel: 'f(κa) de Henry', ml: 46 });
      pl.frame(); pl.hline(1, { color: '--ink-3', dash: [3, 3], label: 'Hückel' }); pl.hline(1.5, { color: '--ink-3', dash: [3, 3], label: 'Smoluchowski' }); pl.xy(ks, ks.map(D.henry), { color: '--c1', width: 2.8 }); pl.dot(p.ka, D.henry(p.ka), { color: '--accent' });
      sim.set('z', EM.fix(D.zeta(mu, p.ka) * 1e3, 1) + ' mV · ' + EM.fix((mu * eta / eps) * 1e3, 1) + ' mV · ' + EM.fix((1.5 * mu * eta / eps) * 1e3, 1) + ' mV');
      sim.set('f', EM.fix(D.henry(p.ka), 4));
    });
  });
})();
