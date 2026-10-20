/* Capítulo 1 — El fluido como medio continuo */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;

  /* 1.1 Sólido, fluido y viscoelástico bajo cortante */
  EM.defineSim('deformacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('tau', { label: 'Esfuerzo cortante aplicado τ₀', min: 1, max: 100, step: 1, value: 40, unit: 'Pa', fmt: (v) => v.toFixed(0) });
    sim.slider('G', { label: 'Módulo de corte <i>G</i>', min: 20, max: 1000, step: 1, value: 100, unit: 'Pa', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('mu', { label: 'Viscosidad μ', min: 5, max: 2000, step: 1, value: 100, unit: 'Pa·s', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('toff', { label: 'Duración de la carga', min: 0.5, max: 8, step: 0.1, value: 4, unit: 's', fmt: (v) => v.toFixed(1) });
    sim.out('lam', 'Tiempo de relajación λ = μ/<i>G</i>', { hl: true });
    sim.out('De', 'Número de Deborah λ/<i>t</i><sub>carga</sub>');
    sim.out('g', 'Deformación final (sólido · fluido · Maxwell)');
    let t = 0;
    const T = 10;
    const models = (tt) => {
      const p = sim.p, on = tt < p.toff, ta = Math.min(tt, p.toff);
      const el = on ? p.tau / p.G : 0;
      const nw = (p.tau * ta) / p.mu;
      const mx = (on ? p.tau / p.G : 0) + nw;
      const lam = p.mu / p.G;
      const kv = on ? (p.tau / p.G) * (1 - Math.exp(-tt / lam)) : (p.tau / p.G) * (1 - Math.exp(-p.toff / lam)) * Math.exp(-(tt - p.toff) / lam);
      return [el, nw, mx, kv];
    };
    const NAMES = ['sólido elástico', 'fluido newtoniano', 'Maxwell (viscoelástico líquido)', 'Kelvin–Voigt (viscoelástico sólido)'], SHORT = ['sólido', 'fluido', 'Maxwell', 'Kelvin–Voigt'], COL = ['--c1', '--c2', '--accent', '--c3'];
    sim.animate((dt) => { t += dt; if (t > T) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const g = models(t), top = H * 0.36, bw = Math.min(W / 4 - 40, top - 40);
      const gm = Math.max(0.05, (p.tau / p.G) * 1.1, ((p.tau * p.toff) / p.mu + p.tau / p.G) * 1.1), room = W / 4 - bw - 8;
      for (let i = 0; i < 4; i++) {
        const cx = (W / 4) * (i + 0.5), base = top - 10, x0 = cx - bw / 2;
        const sh = (g[i] / gm) * room;
        ctx.fillStyle = EM.alpha(COL[i], 0.25); ctx.strokeStyle = EM.col(COL[i]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0 + bw, base); ctx.lineTo(x0 + bw + sh, base - bw * 0.8); ctx.lineTo(x0 + sh, base - bw * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        EM.draw.support(ctx, cx, base + 1, bw + 16, 'up');
        if (t < p.toff) EM.draw.arrow(ctx, x0 + sh + bw * 0.1, base - bw * 0.8 - 7, x0 + sh + bw * 0.9, base - bw * 0.8 - 7, { color: '--ink', width: 1.6 });
        EM.text(ctx, SHORT[i], cx, 14, { size: 11, align: 'center', color: COL[i], weight: 600 });
      }
      const pl = new EM.Plot(ctx, { x: 0, y: top, w: W, h: H - top, xmin: 0, xmax: T, ymin: 0, ymax: gm, xlabel: 't (s)', ylabel: 'deformación γ (rad)' });
      pl.frame();
      pl.band(0, p.toff, { color: '--ink-3', alpha: 0.06 });
      for (let i = 0; i < 4; i++) pl.fn((tt) => models(tt)[i], { color: COL[i], width: i === 2 ? 2.6 : 1.8, dash: i === 3 ? [5, 4] : undefined });
      pl.vline(t, { color: '--ink-3' });
      pl.legend(NAMES.map((n, i) => ({ label: n, color: COL[i], dash: i === 3 ? [5, 4] : undefined })), 'tl');
      const lam = p.mu / p.G, gf = models(T);
      sim.set('lam', EM.fix(lam, 2) + ' s');
      sim.set('De', EM.fix(lam / p.toff, 2) + (lam / p.toff > 1 ? ' (responde como sólido)' : ' (responde como fluido)'));
      sim.set('g', EM.fix(gf[0], 2) + ' · ' + EM.fix(gf[1], 2) + ' · ' + EM.fix(gf[2], 2));
    });
  });

  /* 1.2 Densidad medida con ventanas de distinto tamaño */
  EM.defineSim('continuo-muestreo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Partículas en la caja', min: 200, max: 6000, step: 100, value: 2000, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Lado de la ventana (fracción de la caja)', min: 0.02, max: 0.7, step: 0.01, value: 0.1, log: true, fmt: (v) => v.toFixed(2) });
    sim.out('n', 'Partículas medias en la ventana', { hl: true });
    sim.out('sd', 'Fluctuación relativa medida');
    sim.out('th', 'Teoría √((1−p)/⟨n⟩), p = s²');
    let x, y, vx, vy;
    const reset = () => {
      const N = sim.p.N | 0;
      x = new Float32Array(N); y = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
      for (let i = 0; i < N; i++) { x[i] = Math.random(); y[i] = Math.random(); const a = Math.random() * 6.283, v = 0.7 + 0.9 * Math.random(); vx[i] = v * Math.cos(a); vy[i] = v * Math.sin(a); }
      hist.length = 0;
    };
    const hist = [], pts = new Map();
    reset();
    let frame = 0;
    sim.onChange = (id) => { if (id === 'N') { reset(); pts.clear(); } else hist.length = 0; };
    sim.animate((dt) => {
      const N = x.length;
      for (let i = 0; i < N; i++) {
        x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        if (x[i] < 0) { x[i] = -x[i]; vx[i] = -vx[i]; } else if (x[i] > 1) { x[i] = 2 - x[i]; vx[i] = -vx[i]; }
        if (y[i] < 0) { y[i] = -y[i]; vy[i] = -vy[i]; } else if (y[i] > 1) { y[i] = 2 - y[i]; vy[i] = -vy[i]; }
      }
      if (++frame % 3 === 0) {
        const s = sim.p.s, a = 0.5 - s / 2, b = 0.5 + s / 2;
        let n = 0; for (let i = 0; i < N; i++) if (x[i] > a && x[i] < b && y[i] > a && y[i] < b) n++;
        hist.push(n); if (hist.length > 800) hist.shift();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, S = Math.min(W / 2, H) - 20, ox = 10, oy = (H - S) / 2;
      EM.draw.clear(cv);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.strokeRect(ox, oy, S, S);
      ctx.fillStyle = EM.col('--c1');
      for (let i = 0; i < x.length; i++) ctx.fillRect(ox + x[i] * S - 1, oy + y[i] * S - 1, 2, 2);
      const s = p.s, a = 0.5 - s / 2;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.strokeRect(ox + a * S, oy + a * S, s * S, s * S);
      const n = hist.length, mean = n ? hist.reduce((q, v) => q + v, 0) / n : 0;
      const sd = n > 2 ? Math.sqrt(hist.reduce((q, v) => q + (v - mean) * (v - mean), 0) / (n - 1)) : 0;
      if (n > 200 && mean > 0) pts.set(s.toFixed(2), [mean, sd / mean]);
      const pl = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 0.3, xmax: 5000, ymin: 0.01, ymax: 2, xlog: true, ylog: true, xlabel: '⟨n⟩ en la ventana', ylabel: 'σ_ρ/ρ' });
      pl.frame();
      pl.fn((m) => 1 / Math.sqrt(m), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.fn((m) => Math.sqrt(Math.max(0, 1 - m / x.length) / m), { color: '--c3', width: 1.8, to: x.length * 0.999 });
      for (const [, q] of pts) pl.dot(q[0], q[1], { color: '--c1', r: 3.5 });
      if (n > 10 && mean > 0) pl.dot(mean, Math.max(0.0101, sd / mean), { color: '--accent', r: 6 });
      pl.legend([{ label: '1/√⟨n⟩', color: '--ink-3', dash: [5, 4] }, { label: 'binomial √((1−p)/⟨n⟩)', color: '--c3' }, { label: 'medidas anteriores', color: '--c1', kind: 'dot' }], 'tr');
      const pr = s * s;
      sim.set('n', EM.fix(mean, 1) + ' (esperado ' + EM.fix(pr * x.length, 1) + ')');
      sim.set('sd', n > 10 ? EM.fix((100 * sd) / Math.max(mean, 1e-9), 1) + ' %' : '—');
      sim.set('th', EM.fix(100 * Math.sqrt((1 - pr) / (pr * x.length)), 1) + ' %');
    });
  });

  /* 1.3 Regímenes de Knudsen */
  EM.defineSim('knudsen', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.seg('mode', { label: 'Elegir el gas por', options: [['p', 'presión (20 °C)'], ['z', 'altitud (atmósfera estándar)']], value: 'p' });
    sim.slider('P', { label: 'Presión', min: 1e-3, max: 1e7, step: 0, value: 101325, unit: 'Pa', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.slider('z', { label: 'Altitud', min: 0, max: 86000, step: 100, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Longitud característica <i>L</i>', min: 1e-9, max: 10, step: 0, value: 1e-6, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.out('lam', 'Recorrido libre medio λ', { hl: true });
    sim.out('Kn', 'Número de Knudsen λ/<i>L</i>');
    sim.out('reg', 'Régimen');
    const sync = () => { sim.ctl.P.show(sim.p.mode === 'p'); sim.ctl.z.show(sim.p.mode === 'z'); };
    sim.onChange = sync; sync();
    const T0 = 293.15, lam0 = FL.mfp(T0, 101325);
    const EX = [['microcanal MEMS', 1e-6, 101325, 7, 16, 'left'], ['partícula de humo', 1e-7, 101325, 0, -9, 'center'], ['disco duro', 5e-9, 101325, 6, 16, 'left'], ['vacío primario', 0.05, 1, -7, 16, 'right'], ['tubo de Popayán', 0.05, 81900, 7, -7, 'left'], ['cápsula a 80 km', 3, 1.05, -7, -9, 'right']];
    const reg = (Kn) => (Kn < 0.01 ? 'continuo (no deslizamiento)' : Kn < 0.1 ? 'deslizamiento' : Kn < 10 ? 'transición' : 'molecular libre');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-9, xmax: 10, ymin: 1e-3, ymax: 1e7, xlog: true, ylog: true, xlabel: 'longitud característica L (m)', ylabel: 'presión (Pa)' });
      pl.frame();
      /* franjas de régimen: p = λ0 p0 /(Kn L) */
      const pK = (Kn, L) => (lam0 * 101325) / (Kn * L);
      const cols = ['--c3', '--c4', '--c5', '--c2'], kn = [1e-30, 0.01, 0.1, 10, 1e30];
      pl.clip((c) => {
        for (let r = 0; r < 4; r++) {
          c.beginPath();
          const xs = [1e-9, 10];
          c.moveTo(pl.X(xs[0]), pl.Y(Math.min(1e9, Math.max(1e-6, pK(kn[r], xs[0])))));
          c.lineTo(pl.X(xs[1]), pl.Y(Math.min(1e9, Math.max(1e-6, pK(kn[r], xs[1])))));
          c.lineTo(pl.X(xs[1]), pl.Y(Math.min(1e9, Math.max(1e-6, pK(kn[r + 1], xs[1])))));
          c.lineTo(pl.X(xs[0]), pl.Y(Math.min(1e9, Math.max(1e-6, pK(kn[r + 1], xs[0])))));
          c.closePath(); c.fillStyle = EM.alpha(cols[r], 0.12); c.fill();
        }
      });
      for (const k of [0.01, 0.1, 10]) pl.fn((L) => pK(k, L), { color: '--ink-3', width: 1, dash: [4, 4] });
      pl.label(3e-1, 3e5, 'continuo', { color: '--c3', size: 12, weight: 600 });
      pl.label(2e-8, 1e-1, 'molecular libre', { color: '--c2', size: 12, weight: 600 });
      for (const [n, L, P, dx, dy, al] of EX) pl.dot(L, P, { color: '--ink-3', r: 3.5, label: n, dx, dy, align: al });
      let P = p.P, T = T0;
      if (p.mode === 'z') { const a = FL.atm(p.z); P = a.P; T = a.T; }
      const lam = FL.mfp(T, P), Kn = lam / p.L;
      /* presión equivalente a 20 °C con el mismo λ, para ubicar el punto sobre las franjas */
      pl.dot(p.L, Math.max(1.01e-3, Math.min(9.9e6, (lam0 * 101325) / lam)), { color: '--accent', r: 6.5 });
      sim.set('lam', EM.si(lam, 'm', 3) + (p.mode === 'z' ? ' (P = ' + EM.si(P, 'Pa', 3) + ', T = ' + EM.fix(T - 273.15, 1) + ' °C)' : ''));
      sim.set('Kn', EM.sci(Kn, 3));
      sim.set('reg', reg(Kn));
    });
  });

  /* 1.4 Esfuerzo sobre un plano y círculo de Mohr */
  EM.defineSim('tension-plano', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('pre', { label: 'Caso', options: [['rep', 'Fluido en reposo'], ['cou', 'Cortante de Couette'], ['gen', 'General']], value: 'rep' });
    sim.slider('sx', { label: 'σ<sub>xx</sub>', min: -100, max: 100, step: 1, value: -50, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sy', { label: 'σ<sub>yy</sub>', min: -100, max: 100, step: 1, value: -50, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('txy', { label: 'τ<sub>xy</sub>', min: -60, max: 60, step: 1, value: 0, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de la normal al plano θ', min: 0, max: 180, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('sn', 'Esfuerzo normal σ<sub>n</sub> = <b>t</b>·<b>n</b>', { hl: true });
    sim.out('ts', 'Esfuerzo cortante τ = <b>t</b>·<b>s</b>');
    sim.out('pr', 'Esfuerzos principales · cortante máximo');
    sim.onChange = (id) => {
      if (id === 'pre') { const v = { rep: [-50, -50, 0], cou: [-50, -50, 25], gen: [30, -40, 25] }[sim.p.pre]; sim.ctl.sx.set(v[0], true); sim.ctl.sy.set(v[1], true); sim.ctl.txy.set(v[2], true); }
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const th = (p.th * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)], s = [-Math.sin(th), Math.cos(th)];
      const t = [p.sx * n[0] + p.txy * n[1], p.txy * n[0] + p.sy * n[1]];
      const sn = t[0] * n[0] + t[1] * n[1], ts = t[0] * s[0] + t[1] * s[1];
      /* elemento */
      const cx = W * 0.25, cy = H * 0.5, a = Math.min(W * 0.16, H * 0.3), sc = (a * 0.9) / 100;
      ctx.save();
      ctx.fillStyle = EM.alpha('--water', 0.2); ctx.fillRect(cx - a, cy - a, 2 * a, 2 * a);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(cx - a, cy - a, 2 * a, 2 * a);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx - s[0] * a * 1.2, cy + s[1] * a * 1.2); ctx.lineTo(cx + s[0] * a * 1.2, cy - s[1] * a * 1.2); ctx.stroke();
      ctx.restore();
      EM.draw.arrow(ctx, cx, cy, cx + n[0] * a * 0.6, cy - n[1] * a * 0.6, { color: '--ink-3', width: 1.4 });
      EM.text(ctx, 'n', cx + n[0] * a * 0.66, cy - n[1] * a * 0.66, { size: 13, italic: true, weight: 700, family: EM.FONT_MATH, halo: true });
      EM.draw.arrow(ctx, cx, cy, cx + t[0] * sc, cy - t[1] * sc, { color: '--accent', width: 2.6 });
      EM.text(ctx, 't', cx + t[0] * sc + 5, cy - t[1] * sc - 5, { size: 14, italic: true, weight: 700, family: EM.FONT_MATH, color: '--accent', halo: true });
      EM.draw.arrow(ctx, cx, cy, cx + n[0] * sn * sc, cy - n[1] * sn * sc, { color: '--c1', width: 1.6, dash: [4, 3] });
      EM.draw.arrow(ctx, cx + n[0] * sn * sc, cy - n[1] * sn * sc, cx + t[0] * sc, cy - t[1] * sc, { color: '--c2', width: 1.6, dash: [4, 3] });
      /* círculo de Mohr */
      const c0 = (p.sx + p.sy) / 2, R = Math.hypot((p.sx - p.sy) / 2, p.txy);
      const pl = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: -130, xmax: 130, ymin: -80, ymax: 80, xlabel: 'σ_n (kPa)', ylabel: 'τ (kPa)' });
      const yr = (130 * pl.ih) / pl.iw;
      pl.set({ ymin: -yr, ymax: yr }).frame();
      pl.clip((c) => { c.beginPath(); c.ellipse(pl.X(c0), pl.Y(0), Math.abs(pl.X(c0 + R) - pl.X(c0)), Math.abs(pl.Y(R) - pl.Y(0)), 0, 0, 2 * Math.PI); c.strokeStyle = EM.col('--c5'); c.lineWidth = 2; c.stroke(); });
      pl.dot(c0 + R, 0, { color: '--c5', r: 4, label: 'σ₁' }); pl.dot(c0 - R, 0, { color: '--c5', r: 4, label: 'σ₂', align: 'right', dx: -7 });
      pl.dot(sn, ts, { color: '--accent', r: 6 });
      sim.set('sn', EM.fix(sn, 2) + ' kPa');
      sim.set('ts', EM.fix(ts, 2) + ' kPa');
      sim.set('pr', EM.fix(c0 + R, 1) + ', ' + EM.fix(c0 - R, 1) + ' · ' + EM.fix(R, 1) + ' kPa');
    });
  });
})();
