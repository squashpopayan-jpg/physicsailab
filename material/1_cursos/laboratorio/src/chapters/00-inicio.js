/* Portada: un celular colgado de un eje LEGO oscila como péndulo y su giroscopio mide ω(t) */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;

  MC.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.18 });
    const g = MC.K.gPop, Lc = 0.27; /* distancia eje–centro del celular */
    const Lef = 0.285;               /* longitud equivalente del péndulo físico */
    const gam = 0.06;
    let th = M.rad(28), om = 0, t = 0, drag = false;
    const hist = new MC.History(['w'], { max: 4000, minDt: 1 / 100 });
    let cross = [];
    let lastW = 0, ampRun = 0, amp = M.rad(28);
    const reset = () => { hist.clear(); cross = []; t = 0; ampRun = 0; amp = Math.abs(th); };
    function step(dt) {
      if (drag) return;
      const h = 1 / 400;
      let n = Math.max(1, Math.round(dt / h));
      for (let i = 0; i < n; i++) {
        const a = -(g / Lef) * Math.sin(th) - 2 * gam * om;
        om += a * h; th += om * h; t += h;
        const w = om + M.gauss(0, 0.004);
        ampRun = Math.max(ampRun, Math.abs(th));
        if (hist.push(t, { w })) {
          if (lastW > 0 && w <= 0 && Math.abs(th) > M.rad(2)) { cross.push(t); amp = ampRun; ampRun = 0; }
          lastW = w;
        }
      }
      if (cross.length > 8) cross = cross.slice(-8);
    }
    sim.animate(step, { button: false });
    sim.hint('Arrastre el celular para cambiar la amplitud', cv);
    let geo = null;
    MC.pointer(cv, {
      down: (x, y) => {
        if (!geo) return null;
        const px = geo.pv[0] + Math.sin(th) * geo.L, py = geo.pv[1] + Math.cos(th) * geo.L;
        if (Math.hypot(x - px, y - py) > geo.L * 0.45) return null;
        drag = true; return 1;
      },
      move: (_, x, y) => {
        th = M.clamp(Math.atan2(x - geo.pv[0], y - geo.pv[1]), -M.rad(75), M.rad(75));
        om = 0; sim.redraw();
      },
      up: () => { drag = false; reset(); lastW = 0; sim.play(); },
      hover: (x, y) => { if (!geo) return false; const px = geo.pv[0] + Math.sin(th) * geo.L, py = geo.pv[1] + Math.cos(th) * geo.L; return Math.hypot(x - px, y - py) < geo.L * 0.45; }
    });
    const graph = { plot: null };
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const sceneH = H * 0.58;
      /* torre LEGO */
      const u = Math.min(W / 46, sceneH / 52);     /* px por módulo de 8 mm */
      const pv = [W * 0.34, sceneH * 0.1 + u * 1.5];
      const L = (Lc / 0.008) * u;                  /* longitud en px */
      geo = { pv, L };
      const floor = sceneH - 4;
      D.ground(ctx, 0, floor, W * 0.66, { depth: 8 });
      const colX = [pv[0] - u * 9, pv[0] + u * 7];
      for (const cx of colX) {
        for (let k = 0, y = floor; y > pv[1] + u * 2; k++, y -= 1.2 * u) D.brick2d(ctx, cx, y, 2, 3, u, '--lego-red', { studs: false });
      }
      D.brick2d(ctx, colX[0] - u * 2, floor, 22, 1, u, '--lego-dkgray', { studs: false });
      D.brick2d(ctx, colX[0] - u, pv[1] + u * 0.6, 20, 3, u, '--lego-blue', { holes: true });
      /* brazo y celular */
      const ang = th;
      const ex = pv[0] + Math.sin(ang) * L, ey = pv[1] + Math.cos(ang) * L;
      ctx.save();
      ctx.strokeStyle = MC.col('--lego-gray');
      ctx.lineWidth = u * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(pv[0] + Math.sin(ang) * (L - u * 6), pv[1] + Math.cos(ang) * (L - u * 6)); ctx.stroke();
      ctx.restore();
      const pw = u * 9.4, ph = u * 19.4;
      const wNow = hist.n ? hist.last('w') : 0;
      D.phone(ctx, ex, ey, pw, ph, {
        ang: ang,
        screen: (c, x, y, w, h) => {
          c.fillStyle = '#0E1621'; c.fillRect(x, y, w, h);
          c.strokeStyle = '#FF7E22'; c.lineWidth = 1.2; c.beginPath();
          const T = hist.d.t, Wd = hist.d.w, n = T.length;
          for (let i = Math.max(0, n - 200), k = 0; i < n; i++, k++) { const xx = x + 3 + ((w - 6) * k) / 200, yy = y + h / 2 - (Wd[i] / 4) * (h * 0.4); if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); }
          c.stroke();
          MC.text(c, 'ω_z', x + 4, y + 12, { size: 9, color: '#E8F0F8', mono: true });
        }
      });
      D.circle(ctx, pv[0], pv[1], u * 0.9, { fill: '--lego-gray', color: '--ink-2' });
      D.circle(ctx, pv[0], pv[1], u * 0.3, { fill: '--ink-2' });
      D.angle(ctx, pv[0], pv[1], u * 6, -Math.PI / 2, -Math.PI / 2 + ang, { label: 'θ', size: 12 });
      D.line(ctx, pv[0], pv[1], pv[0], pv[1] + L * 1.05, { color: '--ink-3', dash: [3, 4], width: 1 });
      /* lecturas */
      let T = NaN;
      if (cross.length >= 3) { const d = []; for (let i = 1; i < cross.length; i++) d.push(cross[i] - cross[i - 1]); T = M.mean(d); }
      const bx = W * 0.68, by = 16;
      D.panel(ctx, bx, by, W * 0.3, sceneH * 0.7, { title: 'GIROSCOPIO' });
      const ln = (s, i, col) => MC.text(ctx, s, bx + 10, by + 38 + i * 19, { size: 12.5, mono: true, color: col || '--ink' });
      ln(`ω_z = ${MC.fix(wNow, 2)} rad/s`, 0, '--az');
      ln(`T = ${isFinite(T) ? MC.fix(T, 3) + ' s' : '…'}`, 1);
      ln(`θ₀ = ${MC.fix(M.deg(amp), 0)}°`, 2);
      const corr = 1 + (amp * amp) / 16 + (11 * Math.pow(amp, 4)) / 3072;
      const gRaw = isFinite(T) ? (4 * Math.PI * Math.PI * Lef) / (T * T) : NaN;
      const gEst = gRaw * corr * corr;
      ln(`g ≈ ${isFinite(gRaw) ? MC.fix(gRaw, 2) : '…'} m/s²`, 3, '--ink-2');
      ln(`g ≈ ${isFinite(gEst) ? MC.fix(gEst, 2) : '…'} m/s²`, 4, '--accent');
      MC.text(ctx, 'sin y con corrección', bx + 10, by + 38 + 5 * 19 - 2, { size: 11, color: '--ink-3' });
      MC.text(ctx, 'por amplitud (L = 28.5 cm)', bx + 10, by + 38 + 5 * 19 + 12, { size: 11, color: '--ink-3' });
      /* gráfica */
      const tg = graph;
      const span = 6;
      const tN = hist.n ? hist.d.t[hist.n - 1] : 0;
      const P = tg.plot || (tg.plot = new MC.Plot(ctx));
      P.ctx = ctx;
      const wmax = Math.max(4, MC.niceCeil(Math.sqrt(2 * (g / Lef) * (1 - Math.cos(Math.max(amp, Math.abs(th))))) * 1.1));
      P.set({ x: 0, y: sceneH + 4, w: W, h: H - sceneH - 6, xmin: Math.max(0, tN - span), xmax: Math.max(span, tN), ymin: -wmax, ymax: wmax, xlabel: ['t', 's'], ylabel: ['ω_z', 'rad/s'], ml: 50, mr: 12, mt: 10, mb: 36 });
      P.frame();
      P.xy(hist.d.t, hist.d.w, { color: '--az', width: 1.8 });
      for (const c of cross) P.vline(c, { color: '--accent', width: 1, dash: [2, 3] });
    });
  });
})();
