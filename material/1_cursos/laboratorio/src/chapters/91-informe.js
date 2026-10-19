/* Apéndice B · Calculadora para reportar y comparar un resultado */
(function () {
  'use strict';
  const MC = window.MC, D = MC.draw, L = MC.lab;
  MC.defineSim('informe-reporte', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Medición y referencia' });
    sim.presets([
      { id: 'g', label: 'g con el péndulo (M3)', v: { x: 9.7813, ua: 0.0121, ub: 0.0195, xr: 9.777, ur: 0.001, un: 'm/s²' }, note: 'Compatible: la diferencia es menor que la incertidumbre.' },
      { id: 'gam', label: 'Tensión superficial del agua (F8)', v: { x: 0.06912, ua: 0.00062, ub: 0.0007, xr: 0.0728, ur: 0.0003, un: 'N/m' }, note: 'Error de 5 % pero z ≈ 4: algo sistemático, probablemente agua o anillo no del todo limpios.' },
      { id: 'c', label: 'Velocidad del sonido (F9)', v: { x: 338.6, ua: 2.9, ub: 3.5, xr: 343.2, ur: 0.6, un: 'm/s' }, note: 'Compatible a pesar del 1.3 % de error: la incertidumbre de la corrección de extremo del cuello es grande.' },
      { id: 'R', label: 'Resistencia (E1) muy precisa', v: { x: 997.6, ua: 0.4, ub: 0.5, xr: 1000, ur: 0.1, un: 'Ω' }, note: 'Error de sólo 0.24 % y aun así incompatible con el valor nominal sin tolerancia. Con la tolerancia real del 1 % (u_ref = 10/√3 ≈ 5.8 Ω) sí es compatible.' }
    ], { initial: 'g' });
    sim.group('Resultado medido');
    sim.number('x', { label: 'Valor medido (promedio o ajuste)', value: 9.7813 });
    sim.number('ua', { label: 'Incertidumbre tipo A (estadística)', value: 0.0121, min: 0 });
    sim.number('ub', { label: 'Incertidumbre tipo B (instrumentos, método)', value: 0.0195, min: 0 });
    sim.group('Referencia');
    sim.number('xr', { label: 'Valor de referencia', value: 9.777 });
    sim.number('ur', { label: 'Su incertidumbre', value: 0.001, min: 0 });
    sim.select('un', { label: 'Unidad', options: [['m/s²', 'm/s²'], ['N/m', 'N/m'], ['m/s', 'm/s'], ['Ω', 'Ω'], ['Pa', 'Pa'], ['kg/m³', 'kg/m³'], ['T', 'T'], ['', '(sin unidad)']], value: 'm/s²' });
    sim.out('uc', 'Incertidumbre combinada');
    sim.out('rep', 'Cómo se reporta', { hl: true });
    sim.out('rel', 'Incertidumbre relativa');
    sim.out('err', 'Diferencia con la referencia');
    sim.out('z', 'Discrepancia normalizada <i>z</i>');
    sim.out('ver', 'Veredicto');
    const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);
    sim.onDraw(() => {
      const { x, ua, ub, xr, ur, un } = sim.p;
      const uc = Math.hypot(ua, ub), ut = Math.hypot(uc, ur);
      const z = ut > 0 ? Math.abs(x - xr) / ut : Infinity;
      sim.set('uc', `√(${MC.sci(ua, 3)}² + ${MC.sci(ub, 3)}²) = ${MC.sci(uc, 3)} ${un}`);
      sim.set('rep', uc > 0 ? `(${L.pm(x, uc)}) ${un}` : '—');
      sim.set('rel', x !== 0 ? MC.fix((100 * uc) / Math.abs(x), 2) + ' %' : '—');
      sim.set('err', `${MC.sci(x - xr, 3)} ${un}` + (xr !== 0 ? ` (${MC.fix((100 * (x - xr)) / Math.abs(xr), 2)} %)` : ''));
      sim.set('z', isFinite(z) ? MC.fix(z, 2) : '∞');
      const [txt, cls] = z < 1 ? ['Compatibles: la diferencia es menor que una incertidumbre combinada.', 'goodv'] : z < 2 ? ['Compatibles (diferencia entre 1 y 2 incertidumbres, algo esperable).', 'goodv'] : z < 3 ? ['En tensión: revise las incertidumbres tipo B y los supuestos del modelo.', 'warnv'] : ['Incompatibles: hay un efecto sistemático o una incertidumbre subestimada que discutir.', 'warnv'];
      sim.set('ver', `<span class="${cls}">${txt}</span>`);
      /* gráfica de las dos distribuciones */
      const ctx = cv.ctx;
      D.clear(cv);
      const s1 = Math.max(uc, 1e-12), s2 = Math.max(ur, 1e-12);
      const lo = Math.min(x - 4 * s1, xr - 4 * s2), hi = Math.max(x + 4 * s1, xr + 4 * s2);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: hi, ymin: 0, ymax: 1.18, xlabel: un ? `valor (${un})` : 'valor', ylabel: '', yticks: [], mt: 14, ml: 22, mr: 18 });
      P.frame();
      const nar = s2 < (hi - lo) / 400;
      P.fn((q) => gauss(q, x, s1), { color: '--c1', width: 2.2, fill: '--c1', fillAlpha: 0.15, n: 400 });
      if (nar) P.vline(xr, { color: '--accent', dash: [], width: 2.2 });
      else P.fn((q) => gauss(q, xr, s2), { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.12, n: 400 });
      P.vline(x, { color: '--c1', y0: 0, y1: 1, label: 'medido', labelY: 16 });
      P.vline(xr, { color: '--accent', y0: 0, y1: 1, label: 'referencia', labelY: 32, align: xr < x ? 'right' : 'left' });
      const yb = 1.08, a = P.X(Math.min(x, xr)), b = P.X(Math.max(x, xr));
      if (b - a > 8) D.dim(ctx, a, P.Y(yb), b, P.Y(yb), `z = ${MC.fix(z, 2)}`, { color: '--ink-2', labelColor: '--ink' });
    });
  });
})();
