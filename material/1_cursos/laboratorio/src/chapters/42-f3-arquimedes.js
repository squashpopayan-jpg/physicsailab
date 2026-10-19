/* Práctica F3 · Principio de Arquímedes con la celda de carga */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  {
    const col = [];
    for (let k = 0; k < 16; k++) col.push(B(0, 4, 1 + 3 * k, 2, 4, k % 2 ? '--lego-yellow' : '--lego-red'));
    const zt = 1 + 3 * 16;
    LG.def('arquimedes', {
      name: 'Balanza de Arquímedes', rot: 1, aspect: 1.05,
      steps: [
        { note: 'Base de 12×16 y una columna de ladrillos 2×4 en un extremo.', parts: [P(0, 0, 0, 12, 16, '--lego-dkgray', { name: 'Placa 12×16' })].concat(col) },
        { note: 'Un ladrillo Technic 1×8 en voladizo sostiene la celda de carga (atornillada en sus agujeros).', parts: [TX(0, 5, zt, 1, 8, '--lego-gray', { name: 'Ladrillo Technic 1×8' }), BOX(0.2, 9, zt + 3, 0.8, 5, 2.5, '--metal', { name: 'Celda de carga 1 kg' })] },
        { note: 'Del extremo libre de la celda cuelga el hilo con el cilindro metálico.', parts: [MC.legoLine([0.6, 13.5, zt + 3], [0.6, 13.5, 30], '--rope', { lw: 1.5, name: 'Hilo de nailon' }), { t: 'box', x: 0.1, y: 13, z: 12, w: 1, d: 1, h: 18, c: '--metal', name: 'Cilindro de aluminio Ø20 × 60 mm' }] },
        { note: 'El vaso con agua sobre una plataforma de placas: cada placa que se agrega debajo sumerge el cilindro 3.2 mm más.', parts: [P(-3, 10, 1, 6, 6, '--lego-blue', { name: 'Placa 6×6' }), P(-3, 10, 2, 6, 6, '--lego-azure', { name: 'Placa 6×6' }), BOX(-2.5, 10.5, 3, 5, 5, 16, '--lego-trans', { name: 'Vaso de vidrio' })] }
      ]
    });
  }
  const SOL = { al: ['Cilindro de aluminio Ø20 × 60 mm', 2700, 0.01, 0.06], la: ['Cilindro de latón Ø20 × 40 mm', 8500, 0.01, 0.04], pl: ['Cilindro de PVC lastrado Ø25 × 60 mm', 1450, 0.0125, 0.06] };
  const LIQ = { agua: ['Agua', 998], sal: ['Agua salada (3.5 %)', 1025], aceite: ['Aceite', 920], alcohol: ['Alcohol 70 %', 870] };
  MC.defineSim('f3-arquimedes', function (sim) {
    sim.cols2('0.8fr 1.3fr');
    const cs = sim.canvas({ aspect: 0.75, label: 'Montaje' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Masa aparente' });
    const tab = MC.results(sim, ['Objeto', 'Líquido', 'Placas', '<i>d</i> (mm)', '<i>m</i><sub>ap</sub> (g)'], { decimals: [0, 0, 0, 2, 3], title: 'Lecturas de la celda de carga' });
    const Rv = 0.035;
    sim.group('Objeto y líquido');
    sim.select('sol', { options: Object.keys(SOL).map((k) => [k, SOL[k][0]]), value: 'al' });
    sim.select('liq', { options: Object.keys(LIQ).map((k) => [k, LIQ[k][0]]), value: 'agua' });
    sim.group('Plataforma');
    sim.slider('np', { label: 'Placas agregadas bajo el vaso', min: 0, max: 26, step: 1, value: 6, fmt: (q) => `${Math.round(q)} (sube ${MC.fix(q * 3.2, 1)} mm)` });
    sim.button('Medir y agregar', () => { const r = read(); tab.add([SOL[sim.p.sol][0].split(' ')[2], LIQ[sim.p.liq][0], Math.round(sim.p.np), r.d * 1000, r.m]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('m', 'Masa en el aire <i>m</i>');
    sim.out('mapp', 'Masa aparente', { hl: true });
    sim.out('res', 'Resultados');
    function read() {
      const [, rs, r, H] = SOL[sim.p.sol], rl = LIQ[sim.p.liq][1];
      const A = Math.PI * r * r, m = rs * A * H;
      const dz = Math.round(sim.p.np) * 0.0032;
      let d = (dz * Rv * Rv) / (Rv * Rv - r * r);
      d = Math.min(d, H + (dz - H * (1 - (r * r) / (Rv * Rv))) );
      d = Math.max(0, d);
      const sub = Math.min(d, H);
      const mapp = (m - rl * A * sub) * 1000 + M.gauss(0, 0.02);
      return { m: mapp, mair: m * 1000, d, sub, H };
    }
    sim.onDraw(() => {
      const r = read();
      sim.set('m', MC.fix(r.mair, 2) + ' g');
      sim.set('mapp', MC.fix(r.m, 2) + ' g · sumergido ' + MC.fix(r.sub * 1000, 1) + ' mm');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = (H * 0.75) / 0.16;
      const [, , rr, Hc] = SOL[sim.p.sol];
      const cx = W / 2, yCell = H * 0.08;
      ctx.fillStyle = MC.col('--metal'); ctx.fillRect(cx - 60, yCell, 70, 12);
      ctx.fillStyle = MC.col('--lego-red'); ctx.fillRect(cx - 80, yCell - 6, 20, H * 0.9);
      const cylTop = yCell + 0.03 * sc;
      D.line(ctx, cx, yCell + 12, cx, cylTop, { color: '--rope', width: 1.5 });
      const surf0 = cylTop + Hc * sc + 0.002 * sc;
      const surf = surf0 - r.d * sc;
      const vb = surf + 0.0 * sc;
      const vW = Rv * 2 * sc, vH = 0.11 * sc;
      const vTop = surf - 0.02 * sc;
      D.fluid(ctx, cx - vW / 2, surf, vW, vTop + vH - surf, { color: '--water' });
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - vW / 2, vTop); ctx.lineTo(cx - vW / 2, vTop + vH); ctx.lineTo(cx + vW / 2, vTop + vH); ctx.lineTo(cx + vW / 2, vTop); ctx.stroke();
      const n = Math.round(sim.p.np);
      for (let k = 0; k < Math.min(n, 30); k++) D.brick2d(ctx, cx - vW / 2 - 4, vTop + vH + (k + 1) * 3.2e-3 * sc, Math.round((vW + 8) / (0.008 * sc * 0.5)) / 2, 1, 0.008 * sc * 0.5, k % 2 ? '--lego-azure' : '--lego-blue', { studs: false });
      ctx.fillStyle = MC.alpha('--metal', 0.95); ctx.fillRect(cx - rr * sc, cylTop, 2 * rr * sc, Hc * sc);
      ctx.strokeStyle = MC.col('--ink-3'); ctx.strokeRect(cx - rr * sc, cylTop, 2 * rr * sc, Hc * sc);
      if (r.sub > 0) D.dim(ctx, cx + rr * sc + 8, cylTop + Hc * sc, cx + rr * sc + 8, cylTop + Hc * sc - r.sub * sc, `d = ${MC.fix(r.sub * 1000, 1)} mm`, { labelOff: 34 });
      void vb;
      const c2 = cg.ctx;
      D.clear(cg);
      const rows = tab.rows.filter((q) => q[0] === SOL[sim.p.sol][0].split(' ')[2] && q[1] === LIQ[sim.p.liq][0]);
      const ds = rows.map((q) => q[3]), ms = rows.map((q) => q[4]);
      const { P } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, ds, ms, { xlabel: ['d', 'mm'], ylabel: ['m_{ap}', 'g'], title: 'Masa aparente contra profundidad', fit: false, zeroX: true });
      const incl = rows.filter((q) => q[3] > 0.5 && q[3] < Hc * 1000 - 1);
      const full = rows.filter((q) => q[3] >= Hc * 1000 + 0.5);
      let txt = '';
      if (incl.length >= 2) { const f = L.fitLine(incl.map((q) => q[3]), incl.map((q) => q[4])); P.fn(f.f, { color: '--accent', width: 1.8, to: Hc * 1000 }); const rho = (-f.m / 1000) / (Math.PI * rr * rr) / 1000 * 1e6; txt += `pendiente ${MC.fix(f.m, 4)} g/mm → ρ<sub>líq</sub> ≈ ${MC.fix(rho, 0)} kg/m³<br>`; }
      if (full.length) { const ma = M.mean(full.map((q) => q[4])); P.hline(ma, { color: '--c3', label: 'sumergido' }); txt += `ρ<sub>s</sub>/ρ<sub>líq</sub> = ${MC.fix(r.mair / (r.mair - ma), 3)}`; }
      sim.set('res', txt || 'mida varias profundidades');
    });
  });
})();
