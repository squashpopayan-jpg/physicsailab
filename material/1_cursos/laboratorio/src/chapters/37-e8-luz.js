/* Práctica E8 · Luz: inverso del cuadrado y ley de Malus */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  MC.defineSim('e8-luz', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.2, label: 'Montaje' });
    const cg = sim.canvas({ aspect: 0.95, label: 'Análisis' });
    const tD = MC.results(sim, ['<i>x</i> (m)', '<i>E</i> (lx)', '<i>E</i> − <i>E</i>₀ (lx)'], { decimals: [3, 1, 1], title: 'Iluminancia contra distancia', copy: false });
    const tM = MC.results(sim, ['θ (°)', '<i>I</i> (lx)', 'cos²θ'], { decimals: [0, 1, 4], title: 'Ley de Malus', copy: false });
    const delta = 0.0005 + Math.random() * 0.0025, kLed = 2.2 * (1 + M.gauss(0, 0.1)), th0 = 20 + Math.random() * 50;
    let E0 = null, gD, gM;
    sim.group('Experimento');
    sim.seg('mode', { options: [['d', 'Inverso del cuadrado'], ['m', 'Ley de Malus']], value: 'd', onInput: () => sync() });
    gD = sim.group('Distancia');
    sim.slider('n', { label: 'Posición del LED', min: 3, max: 30, step: 1, value: 6, unit: 'pivotes', fmt: (q) => `${Math.round(q)} (x = ${MC.fix(q * 0.8, 1)} cm)` });
    sim.check('on', { label: 'LED encendido', value: true });
    sim.check('caja', { label: 'Caja abierta (luz del cuarto)', value: false });
    sim.button('Guardar el fondo (LED apagado)', () => { E0 = readE(false); });
    gM = sim.group('Polarizador');
    sim.slider('th', { label: 'Ángulo del polarizador', min: 0, max: 360, step: 15, value: 0, unit: '°', fmt: (q) => String(Math.round(q)) });
    sim.group('Tabla');
    sim.button('Medir y agregar', () => add(), { primary: true });
    sim.button('Borrar la última', () => (sim.p.mode === 'd' ? tD : tM).undo());
    sim.out('now', 'Lectura del sensor', { hl: true });
    sim.out('res', 'Resultado');
    sim.dataCopy(() => { const t = sim.p.mode === 'd' ? tD : tM; return { headers: ['c1', 'c2', 'c3'], rows: t.rows }; }, 'Copiar la tabla visible');
    const bg = () => (sim.p.caja ? 140 : 6);
    function readE(on) {
      const x = Math.round(sim.p.n) * 0.008 + delta;
      const e = (on ? kLed / (x * x) : 0) + bg();
      return Math.round(Math.min(40000, e * (1 + M.gauss(0, 0.008)) + M.gauss(0, 0.6)));
    }
    const readI = () => { const c = Math.cos(M.rad(sim.p.th - th0)); return Math.round(350 * (0.99 * c * c + 0.01) + 3 + M.gauss(0, 0.8)); };
    function add() {
      if (sim.p.mode === 'd') { if (E0 === null) return; const e = readE(sim.p.on); tD.add([Math.round(sim.p.n) * 0.008, e, e - E0]); }
      else { const i = readI(); tM.add([sim.p.th, i, Math.cos(M.rad(sim.p.th)) ** 2]); }
    }
    function sync() { const d = sim.p.mode === 'd'; gD.hidden = !d; gM.hidden = d; tD.show(d); tM.show(!d); sim.redraw(); }
    sync();
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const c2 = cg.ctx;
      D.clear(cg);
      if (sim.p.mode === 'd') {
        sim.set('now', `${readE(sim.p.on)} lx` + (E0 !== null ? ` (fondo ${E0} lx)` : ' · guarde el fondo'));
        if (!sim.p.caja) { ctx.fillStyle = MC.alpha('--ink', MC.isDark() ? 0.35 : 0.85); ctx.fillRect(8, H * 0.2, W - 16, H * 0.6); }
        const u = (W - 60) / 34, y0 = H * 0.55, x0 = 40;
        ctx.fillStyle = MC.col('--lego-tan'); ctx.fillRect(x0, y0, 32 * u, u);
        D.phoneEdge(ctx, x0 - 6, y0 - 4 * u, 9 * u, 6, Math.PI / 2);
        const xl = x0 + Math.round(sim.p.n) * u;
        ctx.fillStyle = MC.col('--lego-white'); ctx.fillRect(xl - u / 2, y0 - 3 * u, u, 3 * u);
        if (sim.p.on) { const gr = ctx.createRadialGradient(xl, y0 - 4 * u, 1, xl, y0 - 4 * u, 6 * u); gr.addColorStop(0, 'rgba(255,255,220,.9)'); gr.addColorStop(1, 'rgba(255,255,220,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(xl, y0 - 4 * u, 6 * u, 0, 7); ctx.fill(); }
        D.circle(ctx, xl, y0 - 4 * u, u * 0.5, { fill: sim.p.on ? '#fffbe0' : '--metal', color: '--ink-3' });
        MC.text(ctx, sim.p.caja ? 'caja abierta' : 'caja cerrada (negra por dentro)', W / 2, H * 0.18, { size: 11.5, align: 'center', color: '--ink-3' });
        const xs = tD.col(0), ys = tD.col(2).map((e) => (e > 0 ? Math.pow(e, -0.5) : NaN));
        const ok = xs.map((_, i) => isFinite(ys[i]));
        const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, xs.filter((_, i) => ok[i]), ys.filter((_, i) => ok[i]), { xlabel: ['x', 'm'], ylabel: ['(E − E_0)^{−1/2}', 'lx^{−1/2}'], title: '(E − E₀)^(−1/2) contra x: recta', zeroX: true, zeroY: true });
        sim.set('res', f && xs.length >= 3 ? `δ = ${MC.fix((f.b / f.m) * 1000, 2)} mm (real ${MC.fix(delta * 1000, 2)} mm)` : 'mida al menos 3 distancias');
      } else {
        sim.set('now', `${readI()} lx`);
        const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.32;
        ctx.fillStyle = MC.col('--screen'); ctx.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
        MC.text(ctx, 'pantalla LCD (luz polarizada)', cx, cy - R * 1.38, { size: 11, align: 'center', color: '--ink-3' });
        D.circle(ctx, cx, cy, R, { fill: '--lego-dkgray', color: '--ink-2', width: 2 });
        D.circle(ctx, cx, cy, R * 0.85, { fill: '--glass', fillAlpha: 0.6, color: 'none' });
        const a = M.rad(sim.p.th);
        for (let k = -4; k <= 4; k++) { const off = k * R * 0.18; D.line(ctx, cx + off * Math.cos(a + Math.PI / 2) - R * 0.8 * Math.cos(a), cy - off * Math.sin(a + Math.PI / 2) + R * 0.8 * Math.sin(a), cx + off * Math.cos(a + Math.PI / 2) + R * 0.8 * Math.cos(a), cy - off * Math.sin(a + Math.PI / 2) - R * 0.8 * Math.sin(a), { color: '--ink-3', width: 1 }); }
        const p0 = M.rad(th0);
        D.vec(ctx, cx, cy, Math.cos(p0) * R * 1.15, -Math.sin(p0) * R * 1.15, { color: '--Efield', label: 'E', width: 2 });
        D.vec(ctx, cx, cy, -Math.cos(p0) * R * 1.15, Math.sin(p0) * R * 1.15, { color: '--Efield', width: 2 });
        MC.text(ctx, `polarizador a ${Math.round(sim.p.th)}°`, cx, cy + R * 1.38, { size: 12, align: 'center', color: '--ink', weight: 600, halo: true });
        const h1 = cg.h / 2;
        const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: 360, ymin: 0, ymax: 420, xlabel: ['θ', '°'], ylabel: ['I', 'lx'], mt: 22, title: 'Intensidad contra ángulo', xticks: [0, 90, 180, 270, 360] });
        P.frame();
        P.scatter(tM.col(0), tM.col(1), { color: '--c1', r: 4 });
        const xs = tM.col(0), ys = tM.col(1);
        let best = null;
        if (xs.length >= 4) {
          const fit = L.fitLM((x, p) => p[0] * Math.cos(M.rad(x - p[1])) ** 2 + p[2], [Math.max(...ys), xs[ys.indexOf(Math.max(...ys))], Math.min(...ys)], xs, ys);
          if (fit) { best = fit; P.fn(fit.f, { color: '--accent', width: 1.8 }); }
        }
        const c0 = xs.map((x) => Math.cos(M.rad(x - (best ? best.p[1] : 0))) ** 2);
        MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, c0, ys, { xlabel: ['cos²(θ − θ_0)', ''], ylabel: ['I', 'lx'], title: 'I contra cos²(θ − θ₀): recta', zeroX: true, zeroY: true });
        sim.set('res', best ? `I₀ = ${MC.fix(best.p[0], 0)} lx · θ₀ = ${MC.fix(((best.p[1] % 180) + 180) % 180, 1)}° · fondo ${MC.fix(best.p[2], 1)} lx` : 'mida al menos 4 ángulos');
      }
    });
  });
})();
