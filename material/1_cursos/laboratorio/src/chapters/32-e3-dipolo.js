/* Práctica E3 · El campo de un imán: la ley 1/r³ */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX, T } = LG;

  LG.def('riel-iman', {
    name: 'Riel para el imán', rot: 0,
    steps: [
      { note: 'Riel: dos placas de 2×16 seguidas (32 módulos = 256 mm). Cada pivote marca un paso de 8 mm.', parts: [P(0, 2, 0, 16, 2, '--lego-tan', { name: 'Placa 2×16' }), P(16, 2, 0, 16, 2, '--lego-tan', { name: 'Placa 2×16' })] },
      { note: 'Soporte del celular al comienzo del riel: el celular de pie, con su borde superior hacia el riel y fijo con ladrillos.', parts: [P(-12, 0, 0, 12, 6, '--lego-dkgray', { name: 'Placa 6×12' }), B(-12, 0, 1, 12, 1, '--lego-blue', { name: 'Ladrillo 1×12' }), B(-12, 5, 1, 12, 1, '--lego-blue', { name: 'Ladrillo 1×12' }), BOX(-10, 1, 1, 9.6, 4, 3, '--phone', { screen: '--screen', name: 'Celular (plano)' })] },
      { note: 'El imán, pegado en un ladrillo 1×2, se encaja en el riel. Su posición se cuenta en pivotes desde el borde del celular.', parts: [B(5, 2, 1, 1, 2, '--lego-white', { name: 'Ladrillo 1×2 con imán' }), BOX(5.3, 2.5, 4, 0.4, 1, 1, '--magN', { name: 'Imán de neodimio 10×3 mm' })] }
    ]
  });

  MC.defineSim('e3-dipolo', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.15, label: 'Riel, imán y celular' });
    const cg = sim.canvas({ aspect: 0.95, label: 'Análisis' });
    const tab = MC.results(sim, ['<i>x</i> (m)', 'Orientación', '<i>B</i> (µT)'], { decimals: [4, 0, 2], title: 'Campo del imán (ya restado el fondo)' });
    const delta = 0.012 + Math.random() * 0.02;           /* posición oculta del sensor */
    const Bbg = [-3.2 + 18 * Math.random(), 26.5 - 12 * Math.random(), -11.7 + 30 * Math.random()];
    const mom = 0.225 * (1 + M.gauss(0, 0.05));
    let bg = null;
    sim.group('Imán');
    sim.slider('n', { label: 'Posición del imán', min: 2, max: 30, step: 1, value: 5, unit: 'pivotes', fmt: (q) => `${Math.round(q)} (x = ${MC.fix(q * 8, 0)} mm)` });
    sim.seg('ori', { label: 'Orientación', options: [['eje', 'En el eje'], ['ecu', 'Ecuatorial']], value: 'eje' });
    sim.check('lejos', { label: 'Quitar el imán (medir el fondo)', value: false });
    sim.group('Medición');
    sim.button('Guardar el fondo', () => { bg = readAvg(true); });
    sim.button('Medir y agregar', () => { if (!bg) return; const r = readAvg(false); const d = r.map((v, i) => v - bg[i]); tab.add([Math.round(sim.p.n) * 0.008, sim.p.ori === 'eje' ? 'eje' : 'ecuador', Math.hypot(...d)]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.group('Gráfica');
    sim.select('graf', { options: [['loglog', 'ln B contra ln x'], ['lin', 'B^(−1/3) contra x'], ['logr', 'ln B contra ln(x + δ)']], value: 'lin' });
    sim.out('now', 'Lectura actual |B|');
    sim.out('bg', 'Fondo guardado');
    sim.out('res', 'Resultado', { hl: true });
    sim.out('mth', 'Momento esperado (B_r V / μ₀)');
    function field(x, ori) {
      if (sim.p.lejos) return [0, 0, 0];
      const r = x + delta + 0.0015;
      const k = 1e-7 * mom / (r * r * r) * 1e6;  /* µT */
      return ori === 'eje' ? [0, 2 * k * (1 + 0.6 * (0.005 / r) ** 2), 0] : [0, 0, -k];
    }
    function readAvg(isBg) {
      const f = isBg ? [0, 0, 0] : field(Math.round(sim.p.n) * 0.008, sim.p.ori);
      return f.map((v, i) => M.clamp(v + Bbg[i], -4900, 4900) + M.gauss(0, 0.06));
    }
    sim.onDraw(() => {
      const now = field(Math.round(sim.p.n) * 0.008, sim.p.ori).map((v, i) => v + Bbg[i]);
      const sat = now.some((v) => Math.abs(v) > 4900);
      sim.set('now', sat ? 'saturado (> 4900 µT)' : MC.fix(Math.hypot(...now), 1) + ' µT');
      sim.set('bg', bg ? `(${bg.map((v) => MC.fix(v, 1)).join(', ')}) µT` : 'guárdelo primero');
      sim.set('mth', '≈ 0.225 A·m² (disco 10 × 3 mm)');
      /* escena */
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const u = (W - 40) / 44;
      const x0 = 20 + 12 * u, y0 = H * 0.55;
      ctx.fillStyle = MC.col('--lego-tan'); ctx.fillRect(x0, y0 - u, 32 * u, 2 * u);
      for (let k = 0; k < 32; k++) { ctx.fillStyle = MC.shade(MC.col('--lego-tan'), 1.1); ctx.beginPath(); ctx.arc(x0 + (k + 0.5) * u, y0, u * 0.3, 0, 7); ctx.fill(); }
      D.phone(ctx, x0 - 5 * u, y0, 4.5 * u, 9.6 * u, { ang: -Math.PI / 2, axes: false });
      D.circle(ctx, x0 - delta / 0.008 * u, y0, 4, { fill: '--accent', color: '--canvas' });
      MC.text(ctx, 'sensor (posición desconocida)', x0 - 9.5 * u, y0 + 6.2 * u, { size: 11, color: '--accent' });
      if (!sim.p.lejos) {
        const xm = x0 + Math.round(sim.p.n) * u;
        D.brick2d(ctx, xm - 0.5 * u, y0 + 0.9 * u, 1, 3, u, '--lego-white', { studs: false });
        D.magnet(ctx, xm, y0 - 0.6 * u, 1.6 * u, 0.8 * u, sim.p.ori === 'eje' ? Math.PI : Math.PI / 2, { labels: false });
        D.dim(ctx, x0, y0 - 2.2 * u, xm, y0 - 2.2 * u, `x = ${Math.round(sim.p.n) * 8} mm`, { off: 0, labelOff: -12 });
      }
      /* análisis */
      const c2 = cg.ctx;
      D.clear(cg);
      const rows = tab.rows.filter((r) => r[1] === (sim.p.ori === 'eje' ? 'eje' : 'ecuador') && r[2] > 0.5);
      const xs = rows.map((r) => r[0]), Bs = rows.map((r) => r[2]);
      const lin = L.fitLine(xs, Bs.map((b) => Math.pow(b, -1 / 3)));
      const dFit = lin && rows.length >= 3 ? lin.b / lin.m : NaN;
      const kFit = lin ? Math.pow(lin.m, -3) : NaN;
      if (sim.p.graf === 'loglog') {
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, xs.map(Math.log), Bs.map(Math.log), { xlabel: ['ln x', 'x en m'], ylabel: ['ln B', 'B en µT'], title: 'Con la distancia al borde: pendiente engañosa' });
        sim.set('res', f && rows.length >= 3 ? `pendiente = ${L.pm(f.m, f.sm)} (debería ser −3)` : 'mida al menos 3 posiciones');
      } else if (sim.p.graf === 'lin') {
        MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, xs, Bs.map((b) => Math.pow(b, -1 / 3)), { xlabel: ['x', 'm'], ylabel: ['B^{−1/3}', 'µT^{−1/3}'], title: 'B^(−1/3) = (x + δ)/k^(1/3): recta', zeroX: true });
        const mF = isFinite(kFit) ? (kFit * 1e-6) / (1e-7 * (sim.p.ori === 'eje' ? 2 : 1)) : NaN;
        sim.set('res', isFinite(dFit) ? `δ = ${MC.fix(dFit * 1000, 1)} mm (real ${MC.fix(delta * 1000, 1)} mm)<br>m = ${MC.fix(mF, 3)} A·m²` : 'mida al menos 3 posiciones');
      } else {
        const rs = xs.map((x) => x + (isFinite(dFit) ? dFit : 0));
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, rs.map(Math.log), Bs.map(Math.log), { xlabel: ['ln(x + δ)', ''], ylabel: ['ln B', ''], title: 'Con la distancia corregida' });
        sim.set('res', f && rows.length >= 3 ? `pendiente = ${L.pm(f.m, f.sm)}` : 'mida al menos 3 posiciones');
      }
    });
  });
})();
