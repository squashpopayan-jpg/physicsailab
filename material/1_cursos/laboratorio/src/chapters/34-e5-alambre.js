/* Práctica E5 · Campo de un alambre y de un solenoide */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const MU0 = 4e-7 * Math.PI;
  MC.defineSim('e5-alambre', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.1, label: 'Montaje' });
    const cg = sim.canvas({ aspect: 0.95, label: 'Gráficas' });
    const tW = MC.results(sim, ['<i>h</i> (mm)', '<i>I</i> (A)', 'Δ<i>B</i> (µT)', '1/Δ<i>B</i> (1/µT)'], { decimals: [1, 3, 2, 5], title: 'Alambre: campo contra altura', copy: false });
    const tS = MC.results(sim, ['<i>z</i> (cm)', '<i>I</i> (A)', '<i>V</i> − <i>V</i>₀ (mV)', '<i>B</i> teórico (mT)'], { decimals: [1, 3, 2, 4], title: 'Solenoide: sensor Hall', copy: false });
    const delta = 0.003 + Math.random() * 0.002;
    const sens = 9.2 * (1 + M.gauss(0, 0.07));
    const Ls = 0.2, Rs = 0.011, Nt = 400;
    let gW, gS;
    sim.group('Experimento');
    sim.seg('mode', { options: [['w', 'Alambre recto'], ['s', 'Solenoide']], value: 'w', onInput: () => sync() });
    gW = sim.group('Alambre');
    sim.slider('np', { label: 'Altura del alambre', min: 0, max: 15, step: 1, value: 1, unit: 'placas', fmt: (q) => `${Math.round(q)} (h = ${MC.fix(q * 3.2, 1)} mm)` });
    sim.slider('Iw', { label: 'Corriente', min: 0.2, max: 1.5, step: 0.01, value: 1.2, unit: 'A', fmt: (q) => MC.fix(q, 2) });
    sim.slider('Dret', { label: 'Distancia del cable de retorno', min: 5, max: 100, step: 1, value: 60, unit: 'cm', fmt: (q) => String(Math.round(q)) });
    gS = sim.group('Solenoide (400 espiras en 20 cm)');
    sim.slider('Is', { label: 'Corriente', min: 0, max: 1, step: 0.01, value: 0.6, unit: 'A', fmt: (q) => MC.fix(q, 2) });
    sim.slider('z', { label: 'Posición del sensor desde el centro', min: -16, max: 0, step: 0.8, value: 0, unit: 'cm', fmt: (q) => MC.fix(q, 1) });
    sim.group('Tabla');
    sim.button('Medir y agregar', () => add(), { primary: true });
    sim.button('Borrar la última', () => (sim.p.mode === 'w' ? tW : tS).undo());
    sim.out('now', 'Lectura actual', { hl: true });
    sim.out('res', 'Resultado del ajuste');
    sim.dataCopy(() => { const t = sim.p.mode === 'w' ? tW : tS; return { headers: ['c1', 'c2', 'c3', 'c4'], rows: t.rows }; }, 'Copiar la tabla visible');
    function sync() { const w = sim.p.mode === 'w'; gW.hidden = !w; gS.hidden = w; tW.show(w); tS.show(!w); sim.redraw(); }
    const wireB = () => { const h = Math.round(sim.p.np) * 0.0032, r = h + delta, I = sim.p.Iw; const fin = Math.sin(Math.atan(0.5 / r)); return (2e-7 * I / r) * fin * 1e6 - (2e-7 * I / (sim.p.Dret / 100)) * 1e6; };
    const solB = (z) => { const a = z + Ls / 2, b = Ls / 2 - z; return 0.5 * MU0 * (Nt / Ls) * sim.p.Is * (a / Math.hypot(a, Rs) + b / Math.hypot(b, Rs)); };
    function add() {
      if (sim.p.mode === 'w') { const dB = wireB() + M.gauss(0, 0.15); tW.add([Math.round(sim.p.np) * 3.2, sim.p.Iw, dB, 1 / dB]); }
      else { const z = sim.p.z / 100, B = solB(z); let v = sens * B * 1000; v = v + M.gauss(0, 0.6); tS.add([sim.p.z, sim.p.Is, v, MU0 * (Nt / Ls) * sim.p.Is * 1000]); }
    }
    sync();
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const c2 = cg.ctx;
      D.clear(cg);
      if (sim.p.mode === 'w') {
        sim.set('now', `ΔB = ${MC.fix(wireB(), 2)} µT`);
        const y0 = H * 0.7, sc = Math.min(W / 0.1, 14);
        D.ground(ctx, 0, y0 + 10, W);
        ctx.fillStyle = MC.col('--phone'); ctx.fillRect(W * 0.2, y0 - 9, W * 0.6, 10);
        const ys = y0 - 9 + delta * 4000 * 0;
        D.circle(ctx, W / 2, y0 - 9 + 4, 3, { fill: '--accent', color: 'none' });
        const n = Math.round(sim.p.np);
        for (let k = 0; k < n; k++) { D.brick2d(ctx, W * 0.1, y0 + 1 - k * 3.2 * 1.2, 3, 1, 9.6, '--lego-yellow', { studs: false }); D.brick2d(ctx, W * 0.82, y0 + 1 - k * 3.2 * 1.2, 3, 1, 9.6, '--lego-yellow', { studs: false }); }
        const yw = y0 - 9 - n * 3.2 * 1.2 - 3;
        D.line(ctx, W * 0.05, yw, W * 0.95, yw, { color: '--copper', width: 4 });
        D.outIn(ctx, W / 2, yw - 0.5, 6, -1, { color: '--ink' });
        for (const rr of [16, 30, 46]) D.circle(ctx, W / 2, yw, rr, { color: '--Bfield', dash: [3, 4], width: 1 });
        D.dim(ctx, W * 0.42, y0 - 9, W * 0.42, yw, `h = ${MC.fix(n * 3.2, 1)} mm`, { labelOff: -40 });
        MC.text(ctx, 'corriente entrando a la pantalla; sensor a una profundidad desconocida', 10, H - 8, { size: 11, color: '--ink-3' });
        void ys; void sc;
        const h = tW.col(0).map((x) => x / 1000), inv = tW.col(3);
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, h, inv, { xlabel: ['h', 'm'], ylabel: ['1/ΔB', '1/µT'], title: '1/ΔB contra h: recta con intercepto', zeroX: true, zeroY: true });
        if (f && h.length >= 3) {
          const I = sim.p.Iw;
          const mu0 = (2 * Math.PI) / (f.m * 1e6 * I);
          sim.set('res', `δ = ${MC.fix((f.b / f.m) * 1000, 2)} mm (real ${MC.fix(delta * 1000, 2)} mm)<br>μ₀ ≈ ${MC.fix(mu0 * 1e7, 2)} ×10⁻⁷ T·m/A`);
        } else sim.set('res', 'mida al menos 3 alturas con la misma corriente');
      } else {
        const z = sim.p.z / 100;
        sim.set('now', `B = ${MC.fix(solB(z) * 1000, 3)} mT · V − V₀ = ${MC.fix(sens * solB(z) * 1000, 1)} mV`);
        const cx = W / 2, cy = H * 0.45, sc = (W * 0.8) / 0.36;
        ctx.fillStyle = MC.alpha('--metal', 0.4); ctx.fillRect(cx - (Ls / 2) * sc, cy - Rs * sc * 2, Ls * sc, Rs * sc * 4);
        for (let k = 0; k < 40; k++) { const x = cx - (Ls / 2) * sc + ((k + 0.5) / 40) * Ls * sc; D.line(ctx, x, cy - Rs * sc * 2, x + 3, cy + Rs * sc * 2, { color: '--copper', width: 1.5 }); }
        ctx.fillStyle = MC.col('--lego-gray'); ctx.fillRect(cx + z * sc - 0.16 * sc, cy - 4, 0.16 * sc, 8);
        D.module(ctx, cx + z * sc - 6, cy - 7, 12, 14, '', { fill: '--chip' });
        MC.text(ctx, 'SS49E en una viga Technic', cx + z * sc - 0.08 * sc, cy + 22, { size: 11, align: 'center', color: '--ink-2' });
        const h1 = cg.h / 2;
        const cen = tS.rows.filter((r) => Math.abs(r[0]) < 1);
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: h1 }, cen.map((r) => r[3]), cen.map((r) => r[2]), { xlabel: ['B = μ₀nI', 'mT'], ylabel: ['V − V₀', 'mV'], title: 'Calibración en el centro', zeroX: true, zeroY: true });
        sim.set('res', f && cen.length >= 3 ? `sensibilidad = ${L.pm(f.m, f.sm, 'mV/mT')}` : 'mida 3 corrientes en el centro');
        const prof = tS.rows.filter((r) => Math.abs(r[1] - sim.p.Is) < 1e-6);
        const P = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, prof.map((r) => r[0]), prof.map((r) => r[2] / (f && cen.length >= 3 ? f.m : 9.2)), { xlabel: ['z', 'cm'], ylabel: ['B', 'mT'], title: 'Perfil a lo largo del eje', fit: false, xr: [-16, 0], yr: [0, Math.max(0.2, solB(0) * 1000 * 1.2)] }).P;
        P.fn((zc) => solB(zc / 100) * 1000, { color: '--ink-3', dash: [5, 4], width: 1.4 });
        P.vline(-10, { color: '--ink-3', label: 'extremo' });
      }
    });
  });
})();
