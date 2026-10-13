/* Capítulo 3 — Péndulos y pozos de potencial */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);
  /* T/T0 exacto del péndulo con amplitud th0 (rad) */
  const ratioT = (th0) => { const k = Math.sin(th0 / 2); return (2 / Math.PI) * M.ellipKE(k * k)[0]; };
  EM.pendRatio = ratioT;

  /* ======================================================================
     3.1 Péndulo real frente a lineal
     ====================================================================== */
  EM.defineSim('pendulum-exact', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Péndulo');
    sim.slider('L', { label: 'Longitud <i>ℓ</i>', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'm', fmt: f2 });
    sim.slider('g', { label: 'Gravedad <i>g</i>', min: 1.6, max: 25, step: 0.01, value: 9.81, unit: 'm/s²', fmt: f2 });
    sim.group('Condiciones iniciales');
    sim.slider('th', { label: 'Ángulo inicial <i>θ</i><sub>0</sub>', min: 1, max: 179, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('w0', { label: 'Velocidad angular inicial', min: 0, max: 10, step: 0.1, value: 0, unit: 'rad/s', fmt: (v) => EM.fix(v, 1) });
    sim.seg('view', { label: 'Gráfica', options: [['t', 'θ(t)'], ['ph', 'Espacio de fases']], value: 't' });
    sim.resetButton(() => reset());
    sim.out('T0', 'Período lineal <i>T</i><sub>0</sub>');
    sim.out('T', 'Período real', { hl: true });
    sim.out('r', '<i>T</i> / <i>T</i><sub>0</sub>');
    sim.out('kind', 'Movimiento');
    let y, yl, t, trace;
    const reset = () => { y = [M.rad(sim.p.th), sim.p.w0]; yl = [M.rad(sim.p.th), sim.p.w0]; t = 0; trace = new EM.Trace(900); };
    reset();
    sim.onChange = (id) => { if (id !== 'view') reset(); };
    const fN = (tt, s) => [s[1], -(sim.p.g / sim.p.L) * Math.sin(s[0])];
    const fL = (tt, s) => [s[1], -(sim.p.g / sim.p.L) * s[0]];
    sim.animate((dt) => {
      y = EM.integrate(fN, t, y, t + dt, 16);
      yl = EM.integrate(fL, t, yl, t + dt, 16);
      t += dt;
      trace.push(t, y[0], yl[0], y[1]);
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.36;
      EM.draw.support(ctx, cx, cy - 2, 60, 'down');
      ctx.strokeStyle = EM.col('--grid-2'); ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      const drawP = (th, col, alpha) => {
        const bx = cx + R * Math.sin(th), by = cy + R * Math.cos(th);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        EM.draw.bob(ctx, bx, by, 11, { color: col });
        ctx.globalAlpha = 1;
      };
      drawP(yl[0], '--c6', 0.55);
      drawP(y[0], '--accent', 1);
      EM.text(ctx, 'real', 12, H - 30, { size: 12, color: '--accent', weight: 600 });
      EM.text(ctx, 'lineal (sen θ ≈ θ)', 12, H - 12, { size: 12, color: '--c6', weight: 600 });
      EM.draw.clear(cp);
      if (p.view === 't') {
        const span = Math.max(4 * 2 * Math.PI * Math.sqrt(p.L / p.g), 3);
        const t0 = Math.max(0, t - span);
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: t0, xmax: t0 + span, ymin: -200, ymax: 200, xlabel: 't (s)', ylabel: 'θ (°)', ml: 48, yticks: [-180, -90, 0, 90, 180] });
        pl.frame();
        pl.xy(trace.t, trace.col(1).map(M.deg), { color: '--c6', width: 1.5, alpha: 0.7 });
        pl.xy(trace.t, trace.col(0).map(M.deg), { color: '--accent', width: 2, breakJumps: true });
      } else {
        const wm = Math.sqrt(p.g / p.L);
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -Math.PI, xmax: Math.PI, ymin: -2.6, ymax: 2.6, xpi: true, xlabel: 'θ (rad)', ylabel: 'θ̇ / ω₀', ml: 52 });
        pl.frame();
        /* curvas de nivel de energía: θ̇²/2ω₀² − cos θ = const */
        for (const e of [-0.9, -0.6, -0.2, 0.3, 0.7, 1, 1.5, 2.2]) {
          for (const sgn of [1, -1]) pl.fn((th) => { const v = 2 * (e + Math.cos(th)); return v >= 0 ? sgn * Math.sqrt(v) : NaN; }, { color: e === 1 ? '--c2' : '--grid-2', width: e === 1 ? 1.6 : 1, n: 400 });
        }
        const th = ((y[0] + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        pl.dot(th, y[1] / wm, { color: '--accent', r: 6 });
        pl.label(1.2, 2.35, 'separatriz', { color: '--c2', size: 11 });
      }
      /* período */
      const w0 = Math.sqrt(p.g / p.L), T0 = (2 * Math.PI) / w0;
      const e = 0.5 * (p.w0 / w0) ** 2 - Math.cos(M.rad(p.th));
      sim.set('T0', EM.fix(T0, 3) + ' s');
      if (e < 1) {
        const thA = Math.acos(-e);
        const r = ratioT(thA);
        sim.set('T', EM.fix(T0 * r, 3) + ' s');
        sim.set('r', EM.fix(r, 4));
        sim.set('kind', 'oscila con amplitud ' + EM.fix(M.deg(thA), 1) + '°');
      } else {
        sim.set('T', '— (no oscila)');
        sim.set('r', '—');
        sim.set('kind', e > 1 ? 'da vueltas completas (rotación)' : 'separatriz');
      }
    });
  });

  /* ======================================================================
     3.2 Período en función de la amplitud
     ====================================================================== */
  EM.defineSim('pendulum-period', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('th', { label: 'Amplitud <i>θ</i><sub>0</sub>', min: 1, max: 179, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('s1', { label: 'Aproximación 1 + θ₀²/16', value: true });
    sim.check('s2', { label: 'Aproximación con el término θ₀⁴', value: true });
    sim.out('r', '<i>T</i>/<i>T</i><sub>0</sub> exacto', { hl: true });
    sim.out('a1', 'Con 1 + <i>θ</i><sub>0</sub>²/16');
    sim.out('a2', 'Con el término en <i>θ</i><sub>0</sub>⁴');
    sim.out('err', 'Error de suponer <i>T</i> = <i>T</i><sub>0</sub>');
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 180, ymin: 0.9, ymax: 3, xlabel: 'amplitud θ₀ (°)', ylabel: 'T / T₀', xticks: [0, 30, 60, 90, 120, 150, 180], ml: 50 });
      pl.frame();
      pl.hline(1, { color: '--ink-3', label: 'T₀ (lineal)' });
      const s1 = (d) => 1 + M.rad(d) ** 2 / 16, s2 = (d) => s1(d) + (11 * M.rad(d) ** 4) / 3072;
      if (p.s1) pl.fn(s1, { color: '--c1', width: 1.6, dash: [6, 4] });
      if (p.s2) pl.fn(s2, { color: '--c3', width: 1.6, dash: [2, 3] });
      pl.fn((d) => ratioT(M.rad(d)), { color: '--accent', width: 2.4, to: 179.5 });
      const r = ratioT(M.rad(p.th));
      pl.dot(p.th, r, { color: '--accent', r: 6 });
      pl.legend([{ label: 'exacto (integral elíptica)', color: '--accent' }].concat(p.s1 ? [{ label: '1 + θ₀²/16', color: '--c1', dash: [6, 4] }] : []).concat(p.s2 ? [{ label: '+ 11θ₀⁴/3072', color: '--c3', dash: [2, 3] }] : []), 'tl');
      sim.set('r', EM.fix(r, 5));
      sim.set('a1', EM.fix(s1(p.th), 5));
      sim.set('a2', EM.fix(s2(p.th), 5));
      sim.set('err', EM.fix(100 * (r - 1), 3) + ' %');
    });
  });

  /* ======================================================================
     3.3 Péndulo físico
     ====================================================================== */
  EM.defineSim('physical-pendulum', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.9 });
    const cp = sim.canvas({ aspect: 0.9 });
    sim.group('Cuerpo');
    sim.seg('body', { options: [['rod', 'Varilla'], ['disc', 'Disco'], ['ring', 'Aro']], value: 'rod' });
    sim.slider('L', { label: 'Tamaño (longitud o diámetro)', min: 0.2, max: 2, step: 0.01, value: 1, unit: 'm', fmt: f2 });
    sim.slider('d', { label: 'Distancia eje–centro de masa <i>d</i>', min: 0.01, max: 1, step: 0.005, value: 0.5, unit: 'm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('g', { label: 'Gravedad <i>g</i>', min: 1.6, max: 25, step: 0.01, value: 9.81, unit: 'm/s²', fmt: f2 });
    sim.out('k', 'Radio de giro <i>κ</i>');
    sim.out('leq', 'Longitud equivalente <i>ℓ</i><sub>eq</sub>');
    sim.out('T', 'Período <i>T</i><sub>0</sub>', { hl: true });
    sim.out('d2', 'Otro eje con igual período');
    const kap2 = () => { const L = sim.p.L; return sim.p.body === 'rod' ? (L * L) / 12 : sim.p.body === 'disc' ? (L * L) / 8 : (L * L) / 4; };
    const half = () => sim.p.L / 2;
    sim.onChange = () => { sim.ctl.d.range(0.005, half(), 0.005); if (sim.p.d > half()) sim.ctl.d.set(half(), true); };
    sim.onChange();
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, k2 = kap2(), leq = p.d + k2 / p.d, T = 2 * Math.PI * Math.sqrt(leq / p.g);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = (H * 0.8) / Math.max(leq, p.d + p.L / 2);
      const px = W / 2, py = H * 0.14;
      const th = 0.25 * Math.cos((2 * Math.PI * t) / T);
      ctx.save(); ctx.translate(px, py); ctx.rotate(-th);
      const cmY = p.d * sc;
      ctx.fillStyle = EM.alpha('--c4', 0.8);
      ctx.strokeStyle = EM.col('--c4');
      ctx.lineWidth = 2;
      if (p.body === 'rod') { ctx.fillRect(-6, cmY - (p.L / 2) * sc, 12, p.L * sc); }
      else if (p.body === 'disc') { ctx.beginPath(); ctx.arc(0, cmY, (p.L / 2) * sc, 0, 2 * Math.PI); ctx.fill(); }
      else { ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, cmY, (p.L / 2) * sc, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(0, cmY, 4, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(0, leq * sc, 5, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--canvas'); ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 7); ctx.fill();
      EM.text(ctx, '● centro de masa', 10, H - 30, { size: 11.5, color: '--ink' });
      EM.text(ctx, '● centro de oscilación', 10, H - 12, { size: 11.5, color: '--accent' });
      EM.draw.clear(cp);
      const dm = half(), Tm = 2 * Math.PI * Math.sqrt((2 * Math.sqrt(k2)) / p.g);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: dm, ymin: 0, ymax: Tm * 2.5, xlabel: 'd (m)', ylabel: 'T₀ (s)', ml: 54 });
      pl.frame();
      pl.fn((d) => 2 * Math.PI * Math.sqrt((d + k2 / d) / p.g), { color: '--c1', width: 2.2, from: 0.002 });
      pl.vline(Math.sqrt(k2), { color: '--c3', label: 'd = κ' });
      pl.hline(T, { color: '--accent', alpha: 0.6 });
      pl.dot(p.d, T, { color: '--accent', r: 6 });
      const d2 = k2 / p.d;
      if (d2 <= dm) pl.dot(d2, T, { color: '--c5', r: 5 });
      sim.set('k', EM.si(Math.sqrt(k2), 'm'));
      sim.set('leq', EM.si(leq, 'm'));
      sim.set('T', EM.fix(T, 4) + ' s');
      sim.set('d2', 'd′ = κ²/d = ' + EM.si(d2, 'm') + (d2 > dm ? ' (fuera del cuerpo)' : ''));
    });
  });

  /* ======================================================================
     3.4 Partícula en un pozo de potencial
     ====================================================================== */
  EM.defineSim('potential-well', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.15 });
    const cp = sim.canvas({ aspect: 1.15 });
    /* potenciales adimensionales con mínimo en x0 y U''(x0) indicado */
    const POT = {
      harm: { n: 'Parabólico ½x²', U: (x) => 0.5 * x * x, x0: 0, U2: 1, xr: [-2.5, 2.5], Emax: 2.5 },
      pend: { n: 'Péndulo 1 − cos x', U: (x) => 1 - Math.cos(x), x0: 0, U2: 1, xr: [-Math.PI, Math.PI], Emax: 1.99 },
      quart: { n: 'Cuártico x⁴/4', U: (x) => (x ** 4) / 4, x0: 0, U2: 0, xr: [-2.2, 2.2], Emax: 3 },
      morse: { n: 'Morse (1 − e^{−x})²', U: (x) => (1 - Math.exp(-x)) ** 2, x0: 0, U2: 2, xr: [-1, 5], Emax: 0.99 },
      dbl: { n: 'Doble pozo (x² − 1)²/4', U: (x) => ((x * x - 1) ** 2) / 4, x0: 1, U2: 2, xr: [-2, 2], Emax: 1.5 },
      asym: { n: 'Asimétrico ½x² − x³/6', U: (x) => 0.5 * x * x - (x ** 3) / 6, x0: 0, U2: 1, xr: [-2.5, 2.4], Emax: 0.66 }
    };
    sim.select('pot', { label: 'Potencial', options: Object.keys(POT).map((k) => [k, POT[k].n]), value: 'pend', onInput: () => { sim.ctl.E.range(0.005, POT[sim.p.pot].Emax); sim.ctl.E.set(Math.min(sim.p.E, POT[sim.p.pot].Emax * 0.6)); } });
    sim.slider('E', { label: 'Energía <i>E</i>', min: 0.005, max: 1.99, step: 0.005, value: 0.6, fmt: (v) => EM.fix(v, 3) });
    sim.out('T', 'Período exacto <i>T</i>(<i>E</i>)', { hl: true });
    sim.out('Th', 'Armónico 2π/√<i>U</i>″(<i>x</i><sub>0</sub>)');
    sim.out('tp', 'Puntos de retorno');
    sim.note('Unidades adimensionales con <i>m</i> = 1. La partícula parte del punto de retorno derecho.');
    let st = null, t = 0, cache = null;
    const turning = () => {
      const P = POT[sim.p.pot], E = sim.p.E;
      const x0 = P.x0;
      const f = (x) => P.U(x) - E;
      let a = x0, b = x0;
      const dx = 0.002;
      while (f(b) < 0 && b < P.xr[1] + 3) b += dx;
      while (f(a) < 0 && a > P.xr[0] - 3) a -= dx;
      const x2 = M.bisect(f, b - dx, b), x1 = M.bisect(f, a, a + dx);
      return [x1, x2];
    };
    const period = () => {
      const P = POT[sim.p.pot], E = sim.p.E;
      const [x1, x2] = turning();
      /* sustitución x = c + h sen u elimina las singularidades integrables de los extremos */
      const c = (x1 + x2) / 2, h = (x2 - x1) / 2;
      const g = (u) => { const x = c + h * Math.sin(u); const k = E - P.U(x); return k > 1e-14 ? (h * Math.cos(u)) / Math.sqrt(2 * k) : 0; };
      return 2 * M.simpson(g, -Math.PI / 2 + 1e-7, Math.PI / 2 - 1e-7, 4000);
    };
    const reset = () => { st = [turning()[1] - 1e-9, 0]; t = 0; };
    reset();
    sim.onChange = () => reset();
    const dU = (x) => { const P = POT[sim.p.pot], h = 1e-5; return (P.U(x + h) - P.U(x - h)) / (2 * h); };
    sim.animate((dt) => { st = EM.integrate((tt, s) => [s[1], -dU(s[0])], t, st, t + dt * 2, 20); t += dt * 2; });
    sim.onDraw(() => {
      const P = POT[sim.p.pot], E = sim.p.E;
      const [x1, x2] = turning();
      EM.draw.clear(cv);
      const ym = P.Emax * 1.25;
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: P.xr[0], xmax: P.xr[1], ymin: -0.05 * ym, ymax: ym, xlabel: 'x', ylabel: 'U(x)', ml: 52 });
      pl.frame();
      if (P.U2 > 0) pl.fn((x) => P.U(P.x0) + 0.5 * P.U2 * (x - P.x0) ** 2, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.fn(P.U, { color: '--ink', width: 2.2 });
      pl.hline(E, { color: '--accent', dash: [], width: 1.5 });
      pl.dot(x1, E, { color: '--c2', r: 4 }); pl.dot(x2, E, { color: '--c2', r: 4 });
      pl.dot(st[0], P.U(st[0]), { color: '--accent', r: 7 });
      EM.draw.clear(cp);
      if (!cache || cache.pot !== sim.p.pot) {
        const save = sim.p.E;
        const Es0 = EM.M.linspace(P.Emax * 0.01, P.Emax * 0.995, 70);
        cache = { pot: sim.p.pot, Es: Es0, Ts: Es0.map((e) => { sim.p.E = e; return period(); }) };
        sim.p.E = save;
      }
      const Es = cache.Es, Ts = cache.Ts;
      const T = period();
      const Th = P.U2 > 0 ? 2 * Math.PI / Math.sqrt(P.U2) : NaN;
      const tmax = Math.min(Math.max(...Ts.filter(isFinite)) * 1.1, 40);
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: P.Emax, ymin: 0, ymax: tmax, xlabel: 'energía E', ylabel: 'período T', ml: 52 });
      pp.frame();
      if (isFinite(Th)) pp.hline(Th, { color: '--ink-3', label: 'armónico', labelRight: true });
      pp.xy(Es, Ts, { color: '--c1', width: 2.2 });
      pp.dot(E, T, { color: '--accent', r: 6 });
      sim.set('T', EM.fix(T, 4));
      sim.set('Th', isFinite(Th) ? EM.fix(Th, 4) : '— (U″ = 0: no hay límite armónico)');
      sim.set('tp', EM.fix(x1, 3) + ' y ' + EM.fix(x2, 3));
    });
  });
})();
