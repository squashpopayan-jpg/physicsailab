/* Práctica F9 · Velocidad del sonido con un resonador de Helmholtz */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const GAM = 1.4, Rgas = 8.314, Mair = 0.02897;
  /* nombre, V0 nominal (mL), radio interior del cuello (mm), largo del cuello (mm) */
  const BT = { vino: ['Botella de vino', 750, 9.5, 75], cerveza: ['Botella de cerveza', 330, 9.25, 65] };
  const PL = { pop: ['Popayán', 82200], car: ['Cartagena', 101300], bog: ['Bogotá', 75200] };
  MC.defineSim('f9-helmholtz', function (sim) {
    sim.cols2('0.75fr 1.4fr');
    const cs = sim.canvas({ aspect: 1.05, label: 'Botella y celular' });
    const cg = sim.canvas({ aspect: 1.3, label: 'Señal, espectro y análisis' });
    const tab = MC.results(sim, ['Botella', '<i>V</i><sub>w</sub> (mL)', '<i>f</i> (Hz)', '1/<i>f</i>² (10⁻⁵ s²)'], { decimals: [0, 0, 1, 3], title: 'Frecuencias medidas' });
    /* la botella real: volumen y corrección de extremo con algo de dispersión */
    const real = {};
    for (const k in BT) real[k] = { V0: BT[k][1] * (1 + M.gauss(0, 0.02)), k: 1.45 * (1 + M.gauss(0, 0.06)) };
    const fs = 8000, N = 8192;
    let sig = null, spec = null, fpk = NaN, blowT = -1;
    sim.group('Botella');
    sim.select('bt', { options: Object.keys(BT).map((k) => [k, BT[k][0]]), value: 'vino' });
    sim.slider('Vw', { label: 'Agua dentro de la botella', min: 0, max: 700, step: 10, value: 0, unit: 'mL', fmt: (q) => String(Math.round(q)) });
    sim.group('Aire');
    sim.slider('T', { label: 'Temperatura', min: 10, max: 35, step: 0.5, value: 20, unit: '°C', fmt: (q) => MC.fix(q, 1) });
    sim.seg('pl', { label: 'Lugar', options: Object.keys(PL).map((k) => [k, PL[k][0]]), value: 'pop' });
    sim.button('Soplar y medir', blow, { primary: true });
    sim.button('Escuchar', () => { if (isFinite(fpk)) MC.phys.tone(fpk, 1.2, 0.1, 'sine'); });
    sim.button('Agregar a la tabla', () => { if (isFinite(fpk)) tab.add([BT[sim.p.bt][0], Math.round(sim.p.Vw), fpk, 1e5 / (fpk * fpk)]); }, { primary: true, newRow: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('f', 'Pico del espectro', { hl: true });
    sim.out('ct', 'Teoría: <i>p</i>, ρ y <i>c</i> = √(γ<i>p</i>/ρ)');
    sim.out('fit', 'Del ajuste: <i>c</i> y <i>V</i><sub>0</sub>');
    sim.onChange = () => { sig = null; spec = null; fpk = NaN; };
    const geom = () => { const b = BT[sim.p.bt], r = b[2] / 1000; return { A: Math.PI * r * r, r, L: b[3] / 1000, Lef: b[3] / 1000 + 1.45 * r }; };
    const cSound = () => 331.3 * Math.sqrt(1 + sim.p.T / 273.15);
    const fTrue = () => {
      const g = geom(), re = real[sim.p.bt];
      const V = (re.V0 - sim.p.Vw) * 1e-6;
      if (V < 30e-6) return NaN;
      return (cSound() / (2 * Math.PI)) * Math.sqrt(g.A / (V * (g.L + re.k * g.r)));
    };
    function blow() {
      const f0 = fTrue();
      sig = new Array(N); fpk = NaN;
      if (!isFinite(f0)) { for (let i = 0; i < N; i++) sig[i] = M.gauss(0, 0.05); spec = L.spectrum(sig, 1 / fs, { pad: 2 }); return; }
      const f1 = f0 * (1 + M.gauss(0, 0.003)), ph = Math.random() * 6.28, A = 0.6 + 0.3 * Math.random();
      let phase = ph;
      for (let i = 0; i < N; i++) {
        const t = i / fs;
        const env = Math.min(1, t / 0.05) * (1 + 0.08 * Math.sin(2 * Math.PI * 3.1 * t));
        phase += 2 * Math.PI * f1 * (1 + 0.0015 * Math.sin(2 * Math.PI * 5 * t)) / fs;
        sig[i] = A * env * (Math.sin(phase) + 0.12 * Math.sin(2 * phase + 0.7)) + M.gauss(0, 0.18);
      }
      spec = L.spectrum(sig, 1 / fs, { pad: 2 });
      /* pico sobre 60 Hz, como el marcador de phyphox */
      let best = -1;
      for (let k = 0; k < spec.f.length; k++) if (spec.f[k] > 60 && spec.f[k] < 1500 && (best < 0 || spec.a[k] > spec.a[best])) best = k;
      const y0 = spec.a[best - 1], y1 = spec.a[best], y2 = spec.a[best + 1];
      const d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2));
      fpk = spec.f[best] + (isFinite(d) ? d : 0) * (spec.f[1] - spec.f[0]);
      blowT = performance.now();
    }
    sim.onDraw(() => {
      const g = geom(), re = real[sim.p.bt];
      const p = PL[sim.p.pl][1], TK = sim.p.T + 273.15, rho = (p * Mair) / (Rgas * TK);
      sim.set('ct', `${MC.fix(p / 100, 0)} hPa, ${MC.fix(rho, 3)} kg/m³ → ${MC.fix(Math.sqrt((GAM * p) / rho), 1)} m/s`);
      const full = sim.p.Vw > re.V0 - 30;
      sim.set('f', full ? 'el agua llegó al cuello' : isFinite(fpk) ? MC.fix(fpk, 1) + ' Hz' : 'sople sobre la botella');
      /* ---- botella ---- */
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const big = sim.p.bt === 'vino';
      const bw = W * (big ? 0.36 : 0.28), bh = H * (big ? 0.5 : 0.4), nl = g.L * 1000 * (H / 330), nw = Math.max(10, g.r * 2000 * (W / 220));
      const bx = W * 0.32 - bw / 2, by = H - 24 - bh, sh = bh * 0.18;
      D.ground(ctx, 0, H - 24, W);
      const outline = () => {
        ctx.beginPath();
        ctx.moveTo(bx, H - 24); ctx.lineTo(bx, by + sh);
        ctx.quadraticCurveTo(bx, by, W * 0.32 - nw / 2, by - sh * 0.4);
        ctx.lineTo(W * 0.32 - nw / 2, by - sh * 0.4 - nl);
        ctx.lineTo(W * 0.32 + nw / 2, by - sh * 0.4 - nl);
        ctx.lineTo(W * 0.32 + nw / 2, by - sh * 0.4);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + sh);
        ctx.lineTo(bx + bw, H - 24); ctx.closePath();
      };
      ctx.save(); outline(); ctx.fillStyle = MC.alpha('--glass', 0.35); ctx.fill(); ctx.clip();
      const frac = Math.min(1.12, sim.p.Vw / re.V0), hw = frac * (bh + sh * 0.4);
      D.fluid(ctx, bx - 2, H - 24 - hw, bw + 4, hw, {});
      ctx.restore();
      ctx.save(); outline(); ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      const mx = W * 0.32, my = by - sh * 0.4 - nl;
      D.dim(ctx, mx + nw / 2 + 10, my, mx + nw / 2 + 10, my + nl, `L = ${BT[sim.p.bt][3]} mm`, { color: '--ink-3', labelColor: '--ink-2', dx: 48 });
      MC.text(ctx, `V₀ ≈ ${BT[sim.p.bt][1]} mL`, mx, H - 24 - bh * 0.55, { size: 12, align: 'center', color: '--ink-2', halo: true });
      /* celular en su soporte LEGO */
      const px = W * 0.8, py = my + 6;
      for (let k = 0; k < 6; k++) D.brick2d(ctx, px - 18, H - 24 - k * 0.4 * 12 * 3, 3, 3, 12, '--lego-red', { studs: k === 5 });
      const topY = H - 24 - 6 * 0.4 * 12 * 3;
      D.line(ctx, px, topY, px, py + 24, { color: '--lego-gray', width: 6 });
      D.phone(ctx, px, py + 10, 30, 60, { ang: -Math.PI / 2 });
      const age = (performance.now() - blowT) / 1000;
      if (blowT > 0 && age < 2.5 && isFinite(fpk)) {
        ctx.save();
        for (let k = 0; k < 4; k++) { const rr = ((age * 60 + k * 18) % 72) + 8; ctx.strokeStyle = MC.alpha('--c1', 0.6 * (1 - rr / 80)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, rr, -0.7, 0.7); ctx.stroke(); }
        ctx.restore();
        requestAnimationFrame(() => sim.redraw());
      }
      MC.text(ctx, '← micrófono', px - 34, py - 12, { size: 11, align: 'left', color: '--ink-3', halo: true });
      /* ---- señal, espectro, ajuste ---- */
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.24, h2 = cg.h * 0.3;
      const P1 = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: 40, ymin: -1.4, ymax: 1.4, xlabel: ['t', 'ms'], ylabel: ['p', 'u.a.'], mt: 22, title: 'Micrófono: presión sonora' });
      P1.frame();
      if (sig) { const n = Math.round(0.04 * fs), T = [], Y = []; for (let i = 2000; i < 2000 + n; i++) { T.push(((i - 2000) / fs) * 1000); Y.push(sig[i]); } P1.xy(T, Y, { color: '--c1', width: 1.2 }); }
      const P2 = new MC.Plot(c2, { x: 0, y: h1, w: cg.w, h: h2, xmin: 0, xmax: 800, ymin: 0, ymax: spec ? Math.max(0.2, spec.amp * 1.25) : 1, xlabel: ['f', 'Hz'], ylabel: ['A', 'u.a.'], mt: 22, title: 'Espectro de audio (ventana de Hann, 8192 muestras a 8 kHz)' });
      P2.frame();
      if (spec) {
        const F = [], A = [];
        for (let k = 0; k < spec.f.length && spec.f[k] <= 800; k++) { F.push(spec.f[k]); A.push(spec.a[k]); }
        P2.xy(F, A, { color: '--c5', width: 1.4 });
        if (isFinite(fpk)) P2.vline(fpk, { color: '--accent', label: MC.fix(fpk, 1) + ' Hz', labelY: 14 });
      }
      const rows = tab.rows.filter((q) => q[0] === BT[sim.p.bt][0]);
      const xs = rows.map((q) => q[1]), ys = rows.map((q) => q[3]);
      const { P: P3 } = MC.fitPlot(c2, { x: 0, y: h1 + h2, w: cg.w, h: cg.h - h1 - h2 }, xs, ys, { xlabel: ['V_w', 'mL'], ylabel: ['1/f²', '10⁻⁵ s²'], title: `${BT[sim.p.bt][0]}: 1/f² contra el agua agregada`, zeroX: true, zeroY: true, fit: false, xr: [0, BT[sim.p.bt][1] * 1.1] });
      const fl = rows.length >= 2 ? L.fitLine(xs, ys) : null;
      if (fl && fl.m < 0) {
        const V0 = -fl.b / fl.m, b = fl.m * 1e-5 * 1e6; /* s² por m³ */
        const c = Math.sqrt((-4 * Math.PI * Math.PI * g.Lef) / (g.A * b));
        const sc = rows.length > 2 ? 0.5 * c * (fl.sm / Math.abs(fl.m)) : 0;
        P3.fn(fl.f, { color: '--accent', width: 1.8, from: 0, to: V0 });
        P3.dot(V0, 0, { color: '--accent', r: 5, noclip: true });
        sim.set('fit', `${L.pm(c, sc, 'm/s')} · V₀ = ${MC.fix(V0, 0)} mL`);
      } else sim.set('fit', 'mida al menos 2 cantidades de agua');
    });
  });
})();
