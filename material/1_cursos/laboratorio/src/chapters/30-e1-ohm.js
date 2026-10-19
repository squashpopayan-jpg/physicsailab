/* Práctica E1 · Ley de Ohm y curvas I–V */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const yL = (i) => 0.05 + 0.9 * 0.15 + i * ((0.9 * 0.78) / 14);

  MC.wiring.def('iv', {
    nodes: { t: [0.5, 0.12], g1: [0.5, 0.86], pm: [0.5, 0.49], w: [0.62, 0.49], b: [0.84, 0.49], g2: [0.84, 0.86] }, dots: ['w', 'b'],
    parts: [{ type: 'res', a: 'n:t', b: 'n:g1', label: '10 kΩ' }, { type: 'line', a: 'n:pm', b: 'n:w' }, { type: 'led', a: 'n:w', b: 'n:b', label: 'elemento' }, { type: 'res', a: 'n:b', b: 'n:g2', label: 'shunt 1 kΩ' }],
    wires: [
      { a: 'esp:3V3', b: 'n:t', c: '--wire-r', note: '3.3 V al extremo del potenciómetro', route: [[0.42, 0.887], [0.42, 0.12]] },
      { a: 'n:g1', b: 'esp:GNDR', c: '--wire-k', note: 'otro extremo del potenciómetro a tierra' },
      { a: 'n:g2', b: 'esp:GNDR', c: '--wire-k', note: 'la shunt va a tierra' },
      { a: 'n:w', b: 'esp:D34', c: '--wire-y', note: 'V_A: voltaje antes del elemento (GPIO 34)', route: [[0.62, 0.62], [0.36, 0.975], [0.012, 0.975], [0.012, yL(3)]] },
      { a: 'n:b', b: 'esp:D35', c: '--wire-g', note: 'V_B: voltaje en la shunt (GPIO 35)', route: [[0.84, 0.66], [0.38, 0.985], [0.022, 0.985], [0.022, yL(4)]] }
    ],
    labels: [{ text: 'cursor', fx: 0.53, fy: 0.45, size: 10.5 }]
  });

  const EL = {
    r1k: { n: 'Resistencia de 1 kΩ', R: 1000 * (1 + M.gauss(0, 0.015)) },
    ledr: { n: 'LED rojo', Is: 1.33e-19, nn: 2.0, Rs: 12, col: '#FF3B30' },
    ledb: { n: 'LED azul', Is: 1.35e-22, nn: 2.5, Rs: 18, col: '#3D7BFF' },
    dio: { n: 'Diodo 1N4148', Is: 2.5e-9, nn: 1.9, Rs: 1 },
    inv: { n: 'LED rojo invertido', rev: true }
  };
  const VT = 0.0253;
  MC.defineSim('e1-iv', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.25, label: 'Circuito' });
    const cg = sim.canvas({ aspect: 1.05, label: 'Curva I–V' });
    const tab = MC.results(sim, ['Elemento', '<i>V</i> (V)', '<i>I</i> (mA)'], { decimals: [0, 4, 4], title: 'Puntos medidos' });
    sim.group('Elemento');
    sim.select('el', { options: Object.keys(EL).map((k) => [k, EL[k].n]), value: 'r1k' });
    sim.group('Potenciómetro');
    sim.slider('x', { label: 'Posición del cursor', min: 0, max: 1, step: 0.005, value: 0.6, fmt: (q) => MC.fix(q * 100, 0) + ' %' });
    sim.button('Medir punto', () => { const r = read(sim.p.x); tab.add([EL[sim.p.el].n, r.V, r.I * 1000]); }, { primary: true });
    sim.button('Barrido completo', () => { for (let i = 0; i <= 30; i++) { const r = read(i / 30); tab.add([EL[sim.p.el].n, r.V, r.I * 1000]); } });
    sim.button('Borrar tabla', () => tab.clear());
    sim.group('Gráfica');
    sim.seg('esc', { options: [['lin', 'Lineal'], ['log', 'ln I contra V']], value: 'lin' });
    sim.out('va', '<i>V</i><sub>A</sub> (GPIO 34)');
    sim.out('vb', '<i>V</i><sub>B</sub> (GPIO 35)');
    sim.out('vi', 'Elemento: <i>V</i>, <i>I</i>', { hl: true });
    sim.out('fit', 'Ajuste');
    function solve(x) {
      const e = EL[sim.p.el];
      const Vth = 3.3 * x, Rth = 10000 * x * (1 - x) + 5, Rsh = 1000;
      if (e.rev) return { I: 0, Vth, Rth };
      if (e.R) return { I: Vth / (Rth + Rsh + e.R), Vth, Rth };
      let lo = 0, hi = Vth / (Rth + Rsh);
      for (let k = 0; k < 80; k++) { const I = (lo + hi) / 2; const v = I * (Rth + Rsh + e.Rs) + e.nn * VT * Math.log(I / e.Is + 1); if (v > Vth) hi = I; else lo = I; }
      return { I: lo, Vth, Rth };
    }
    const adc = (v) => (v < 0.1 ? 0.1 + Math.abs(M.gauss(0, 0.02)) : v + M.gauss(0, 0.0015));
    function read(x) {
      const s = solve(x);
      const vA = s.Vth - s.I * s.Rth, vB = s.I * 1000;
      const a = adc(vA), b = adc(vB);
      return { V: a - b, I: b / 1000, vA: a, vB: b, true: s };
    }
    sim.onDraw(() => {
      const r = read(sim.p.x), e = EL[sim.p.el];
      sim.set('va', MC.fix(r.vA * 1000, 0) + ' mV');
      sim.set('vb', MC.fix(r.vB * 1000, 0) + ' mV' + (r.true.I * 1000 < 0.1 ? ' (bajo el piso del ADC)' : ''));
      sim.set('vi', `${MC.fix(r.V, 3)} V · ${MC.fix(r.I * 1000, 3)} mA`);
      /* esquema */
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const xL = W * 0.18, xR = W * 0.82, yT = H * 0.14, yB = H * 0.86, yM = H * 0.5;
      D.battery(ctx, xL - 30, yB, xL - 30, yT, { label: '3.3 V' });
      D.line(ctx, xL - 30, yT, xL, yT, { width: 1.8 }); D.line(ctx, xL - 30, yB, xR, yB, { width: 1.8 });
      D.resistor(ctx, xL, yB, xL, yT, { label: '10 kΩ', mono: true });
      const yw = yT + (yB - yT) * (1 - sim.p.x);
      D.arrow(ctx, xL + 40, yw, xL + 8, yw, { color: '--accent', width: 2 });
      D.line(ctx, xL + 40, yw, xL + 40, yM, { width: 1.8 }); D.line(ctx, xL + 40, yM, W * 0.42, yM, { width: 1.8 });
      if (e.R) D.resistor(ctx, W * 0.42, yM, W * 0.66, yM, { label: '?', mono: true });
      else D.diode(ctx, e.rev ? W * 0.66 : W * 0.42, yM, e.rev ? W * 0.42 : W * 0.66, yM, { led: !!e.col || e.rev, on: r.true.I > 2e-4, label: e.n });
      if (e.col && r.true.I > 2e-4) { ctx.save(); ctx.globalAlpha = Math.min(0.6, r.true.I * 300); ctx.fillStyle = e.col; ctx.beginPath(); ctx.arc(W * 0.54, yM, 26, 0, 7); ctx.fill(); ctx.restore(); }
      D.line(ctx, W * 0.66, yM, xR, yM, { width: 1.8 });
      D.resistor(ctx, xR, yM, xR, yB, { label: '1 kΩ', mono: true });
      D.circle(ctx, xL + 40, yM, 4, { fill: '--c4' }); MC.text(ctx, 'A', xL + 46, yM - 10, { size: 12, weight: 700, color: '--c4' });
      D.circle(ctx, xR, yM, 4, { fill: '--c3' }); MC.text(ctx, 'B', xR + 8, yM - 10, { size: 12, weight: 700, color: '--c3' });
      MC.text(ctx, `I = ${MC.fix(r.true.I * 1000, 3)} mA`, W / 2, yB + 22, { size: 12, mono: true, align: 'center', color: '--ink-2' });
      /* curva */
      const c2 = cg.ctx;
      D.clear(cg);
      const rows = tab.rows.filter((q) => q[0] === e.n);
      const V = rows.map((q) => q[1]), I = rows.map((q) => q[2]);
      if (sim.p.esc === 'lin') {
        const isR = !!e.R;
        const { f, P } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, isR ? I : V, isR ? V : I, { xlabel: isR ? ['I', 'mA'] : ['V', 'V'], ylabel: isR ? ['V', 'V'] : ['I', 'mA'], title: isR ? 'V contra I: la pendiente es R' : 'Curva I–V', zeroX: true, zeroY: true, fit: isR, emptyText: 'Mida puntos o haga un barrido' });
        if (isR) P.band(0, 0.12, { color: '--warn-ink', alpha: 0.08 }); else P.hband(0, 0.12, { color: '--warn-ink', alpha: 0.08 });
        MC.text(c2, 'zona bajo el piso del ADC (I < 0.12 mA)', P.ix + 6, isR ? P.iy + 14 : P.Y(0.12) - 6, { size: 10.5, color: '--warn-ink', halo: true });
        sim.set('fit', isR && f && rows.length >= 3 ? `R = ${L.pm(f.m * 1000, f.sm * 1000, 'Ω')}` : isR ? 'mida al menos 3 puntos' : 'use la escala ln I para ajustar');
      } else {
        const sel = rows.filter((q) => q[2] > 0.12 && q[2] < 2);
        const xs = sel.map((q) => q[1]), ys = sel.map((q) => Math.log(q[2] / 1000));
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, xs, ys, { xlabel: ['V', 'V'], ylabel: ['ln I', 'I en A'], title: 'ln I contra V (0.12–2 mA)', emptyText: 'Haga un barrido con un LED o el diodo' });
        sim.set('fit', f && sel.length >= 3 ? `pendiente ${MC.fix(f.m, 2)} 1/V → n = ${MC.fix(1 / (f.m * VT), 2)}` : 'se necesitan puntos entre 0.12 y 2 mA');
      }
    });
  });
})();
