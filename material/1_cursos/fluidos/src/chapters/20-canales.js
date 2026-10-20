/* Capítulo 20 — Flujo en canales abiertos */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, ch = FL.ch;

  /* 20.1 Energía específica y escalón */
  EM.defineSim('energia-especifica', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('q', { label: 'Caudal por unidad de ancho <i>q</i>', min: 0.2, max: 6, step: 0.05, value: 2, unit: 'm²/s', fmt: (v) => v.toFixed(2) });
    sim.seg('reg', { label: 'Régimen aguas arriba', options: [['sub', 'Subcrítico'], ['sup', 'Supercrítico']], value: 'sub' });
    sim.slider('y1', { label: 'Profundidad aguas arriba (rama elegida)', min: 0.05, max: 4, step: 0.01, value: 1.5, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('dz', { label: 'Altura del escalón', min: 0, max: 1, step: 0.01, value: 0.2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('yc', 'Profundidad crítica · <i>E</i><sub>min</sub>', { hl: true });
    sim.out('E1', 'Energía específica aguas arriba · Froude');
    sim.out('y2', 'Profundidad sobre el escalón');
    sim.out('max', 'Escalón máximo sin ahogamiento');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, q = p.q, yc = ch.yc(q);
      EM.draw.clear(cv);
      let y1 = p.y1;
      if (p.reg === 'sub' && y1 < yc * 1.001) y1 = yc * 1.001;
      if (p.reg === 'sup' && y1 > yc * 0.999) y1 = yc * 0.999;
      const E1 = ch.E(y1, q), zb = (x) => p.dz * Math.exp(-Math.pow(x / 1.2, 2));
      const depth = (x) => { const a = ch.alternate(E1 - zb(x), q); if (!a) return null; return p.reg === 'sub' ? a.sub : a.sup; };
      const choke = E1 - p.dz < 1.5 * yc;
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.58 - 12, h: H - 12 }, -5, 5, -0.2, Math.max(E1 + 0.3, 1), false);
      const surf = [], bed = [];
      for (let i = 0; i <= 200; i++) { const x = -5 + (10 * i) / 200, d = depth(x); bed.push([x, zb(x)]); if (d !== null) surf.push([x, zb(x) + d]); }
      if (!choke) EM.flow.waterFill(ctx, surf.map((q2) => v.map(q2)).concat(bed.slice().reverse().map((q2) => v.map(q2))), { alpha: 0.35 });
      EM.flow.solidPoly(ctx, bed.map((q2) => v.map(q2)).concat([v.map(5, -0.2), v.map(-5, -0.2)]), { fill: '--sand' });
      if (!choke) EM.flow.drawPath(ctx, surf, v.map, { color: '--water', width: 2.2 });
      EM.flow.drawPath(ctx, [[-5, E1], [5, E1]], v.map, { color: '--c2', width: 1.2, dash: [6, 4] });
      EM.text(ctx, 'línea de energía', v.X(-4.8), v.Y(E1) - 5, { size: 11, color: '--c2', halo: true });
      if (choke) EM.text(ctx, 'el flujo se ahoga: no pasa con este caudal', v.X(0), v.Y(E1 / 2), { size: 13, align: 'center', color: '--c2', weight: 650, halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: Math.max(4, E1 * 1.3), ymin: 0, ymax: Math.max(4, E1 * 1.3), xlabel: 'E (m)', ylabel: 'y (m)' });
      pl.frame();
      const ys = EM.M.linspace(0.05 * yc, Math.max(4, E1 * 1.3), 300);
      pl.xy(ys.map((y) => ch.E(y, q)), ys, { color: '--accent', width: 2.4 });
      pl.fn((E) => E, { color: '--ink-3', width: 1, dash: [3, 3] });
      pl.hline(yc, { color: '--c5', label: 'y_c' });
      pl.dot(E1, y1, { color: '--c1', r: 6, label: '1' });
      const y2 = depth(0);
      if (y2) pl.dot(E1 - p.dz, y2, { color: '--c2', r: 6, label: '2' });
      sim.set('yc', EM.fix(yc, 3) + ' m · ' + EM.fix(1.5 * yc, 3) + ' m');
      sim.set('E1', EM.fix(E1, 3) + ' m · ' + EM.fix(ch.Fr(y1, q), 3));
      sim.set('y2', choke ? '—' : EM.fix(y2, 3) + ' m (superficie ' + (zb(0) + y2 > y1 ? 'sube' : 'baja') + ' ' + EM.fix(Math.abs(zb(0) + y2 - y1) * 100, 1) + ' cm)');
      sim.set('max', EM.fix(E1 - 1.5 * yc, 3) + ' m');
    });
  });

  /* 20.2 Resalto hidráulico */
  EM.defineSim('resalto', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('y1', { label: 'Profundidad antes del resalto', min: 0.05, max: 2, step: 0.01, value: 0.3, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('V1', { label: 'Velocidad antes del resalto', min: 1, max: 25, step: 0.1, value: 8, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.out('F', 'Froude de llegada · tipo de resalto', { hl: true });
    sim.out('y2', 'Profundidad conjugada <i>y</i>₂');
    sim.out('dE', 'Pérdida de energía (absoluta · relativa)');
    sim.out('P', 'Potencia disipada por metro de ancho');
    let ph = 0;
    sim.animate((dt) => { ph += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, q = p.y1 * p.V1, j = ch.jump(p.y1, q);
      EM.draw.clear(cv);
      const tipo = j.F1 < 1 ? 'no hay resalto (flujo subcrítico)' : j.F1 < 1.7 ? 'ondulado' : j.F1 < 2.5 ? 'débil' : j.F1 < 4.5 ? 'oscilante' : j.F1 < 9 ? 'estable' : 'fuerte';
      const ymax = Math.max(j.y2, p.y1) * 1.4, Lj = 6 * (j.y2 - p.y1);
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.6 - 12, h: H - 12 }, -Lj * 0.8, Lj * 1.6, -0.05 * ymax, ymax, false);
      const prof = (x) => (x < 0 ? p.y1 : x > Lj ? j.y2 : p.y1 + (j.y2 - p.y1) * (0.5 - 0.5 * Math.cos((Math.PI * x) / Lj)));
      const pts = []; for (let i = 0; i <= 200; i++) { const x = -Lj * 0.8 + (2.4 * Lj * i) / 200; pts.push([x, prof(x) + (x > 0 && x < Lj ? 0.04 * j.y2 * Math.sin(12 * x / Lj + 6 * ph) * Math.sin((Math.PI * x) / Lj) : 0)]); }
      EM.flow.waterFill(ctx, pts.map((q2) => v.map(q2)).concat([v.map(Lj * 1.6, 0), v.map(-Lj * 0.8, 0)]), { alpha: 0.35 });
      EM.flow.drawPath(ctx, pts, v.map, { color: '--water', width: 2.2 });
      ctx.fillStyle = EM.alpha('#FFFFFF', 0.5);
      for (let k = 0; k < 40; k++) { const x = (Lj * ((k * 0.618 + ph * 0.3) % 1)), y = prof(x) * (0.5 + 0.45 * Math.sin(k * 2.3 + ph * 3)); ctx.beginPath(); ctx.arc(v.X(x), v.Y(y), 2.2, 0, 7); ctx.fill(); }
      ctx.fillStyle = EM.col('--sand'); ctx.fillRect(v.X(-Lj * 0.8), v.Y(0), v.X(Lj * 1.6) - v.X(-Lj * 0.8), 8);
      EM.draw.arrow(ctx, v.X(-Lj * 0.7), v.Y(p.y1 / 2), v.X(-Lj * 0.3), v.Y(p.y1 / 2), { color: '--ink', width: 1.8 });
      EM.draw.arrow(ctx, v.X(Lj * 1.15), v.Y(j.y2 / 2), v.X(Lj * 1.15 + (Lj * 0.4 * p.y1) / j.y2), v.Y(j.y2 / 2), { color: '--ink', width: 1.8 });
      const pl = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 1, xmax: 15, ymin: 0, ymax: 1, xlabel: 'Fr₁', ylabel: 'ΔE/E₁' });
      pl.frame();
      pl.fn((F) => { const r = 0.5 * (Math.sqrt(1 + 8 * F * F) - 1); return Math.pow(r - 1, 3) / (4 * r) / (1 + F * F / 2); }, { color: '--accent', width: 2.2 });
      if (j.F1 > 1) pl.dot(j.F1, j.dE / ch.E(p.y1, q), { color: '--accent', r: 6 });
      for (const [a, b] of [[1, 1.7], [4.5, 9]]) pl.band(a, b, { color: '--c3', alpha: 0.07 });
      sim.set('F', EM.fix(j.F1, 3) + ' · ' + tipo);
      sim.set('y2', j.F1 > 1 ? EM.fix(j.y2, 3) + ' m (×' + EM.fix(j.y2 / p.y1, 2) + ')' : '—');
      sim.set('dE', j.F1 > 1 ? EM.fix(j.dE, 3) + ' m · ' + EM.fix((100 * j.dE) / ch.E(p.y1, q), 1) + ' %' : '—');
      sim.set('P', j.F1 > 1 ? EM.fix((998.2 * g * q * j.dE) / 1000, 1) + ' kW/m' : '—');
    });
  });

  /* 20.3 Manning en un canal trapezoidal */
  const NP = Object.entries(FL.MANNING);
  EM.defineSim('manning', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('pre', { label: 'Caso', options: [['canal', 'Canal de concreto'], ['rio', 'Río natural (cauce ancho)'], ['libre', 'Libre']], value: 'canal' });
    sim.select('n', { label: 'Rugosidad de Manning', options: NP.map(([k, v]) => [k, v[0] + ' (n = ' + v[1] + ')']), value: 'concreto' });
    sim.slider('b', { label: 'Ancho del fondo', min: 0.5, max: 120, step: 0.5, value: 2, unit: 'm', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('z', { label: 'Talud lateral (horizontal : vertical)', min: 0, max: 3, step: 0.1, value: 1.5, fmt: (v) => v.toFixed(1) + ' : 1' });
    sim.slider('S', { label: 'Pendiente del fondo', min: 1e-5, max: 0.05, step: 0, value: 0.001, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('Q', { label: 'Caudal', min: 0.1, max: 2000, step: 0, value: 10, unit: 'm³/s', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('yn', 'Profundidad normal', { hl: true });
    sim.out('yc', 'Profundidad crítica');
    sim.out('V', 'Velocidad · Froude');
    sim.out('t', 'Pendiente');
    sim.onChange = (id) => { if (id === 'pre') { if (sim.p.pre === 'canal') { sim.ctl.n.set('concreto', true); sim.ctl.b.set(2, true); sim.ctl.z.set(1.5, true); sim.ctl.S.set(0.001, true); sim.ctl.Q.set(10, true); } else if (sim.p.pre === 'rio') { sim.ctl.n.set('maleza', true); sim.ctl.b.set(80, true); sim.ctl.z.set(2, true); sim.ctl.S.set(0.0005, true); sim.ctl.Q.set(300, true); } } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = FL.MANNING[p.n][1];
      EM.draw.clear(cv);
      const yn = ch.yn(p.Q, p.b, p.z, n, p.S), yc = ch.ycTrap(p.Q, p.b, p.z), gn = ch.geo(yn, p.b, p.z), Vn = p.Q / gn.A, Fr = Vn / Math.sqrt((g * gn.A) / gn.T);
      const Hc = Math.max(yn, yc) * 1.5, Wt = p.b + 2 * p.z * Hc;
      const v = EM.flow.view({ x: 10, y: 10, w: W * 0.55 - 20, h: H - 20 }, -Wt / 2 - 0.1 * Wt, Wt / 2 + 0.1 * Wt, -0.15 * Hc, Hc * 1.05, false);
      const sec = [[-Wt / 2, Hc], [-p.b / 2, 0], [p.b / 2, 0], [Wt / 2, Hc]];
      const wn = p.b / 2 + p.z * yn;
      EM.flow.waterFill(ctx, [v.map(-wn, yn), v.map(-p.b / 2, 0), v.map(p.b / 2, 0), v.map(wn, yn)], { alpha: 0.4 });
      EM.flow.drawPath(ctx, sec, v.map, { color: '--ink-2', width: 3 });
      EM.flow.drawPath(ctx, [[-wn, yn], [wn, yn]], v.map, { color: '--water', width: 2.2 });
      const wc = p.b / 2 + p.z * yc;
      EM.flow.drawPath(ctx, [[-wc, yc], [wc, yc]], v.map, { color: '--c5', width: 1.6, dash: [6, 4] });
      EM.text(ctx, 'y_n', v.X(wn) + 6, v.Y(yn) + 4, { size: 12, color: '--water', weight: 650, halo: true });
      EM.text(ctx, 'y_c', v.X(wc) + 6, v.Y(yc) + 4, { size: 12, color: '--c5', weight: 650, halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: p.Q * 2, ymin: 0, ymax: Hc, xlabel: 'Q (m³/s)', ylabel: 'y (m)' });
      pl.frame();
      const ys = EM.M.linspace(0.001, Hc, 200);
      pl.xy(ys.map((y) => ch.manningQ(y, p.b, p.z, n, p.S)), ys, { color: '--water', width: 2.2 });
      pl.xy(ys.map((y) => { const s = ch.geo(y, p.b, p.z); return s.A * Math.sqrt((g * s.A) / s.T); }), ys, { color: '--c5', width: 1.6, dash: [6, 4] });
      pl.dot(p.Q, yn, { color: '--accent', r: 6 });
      pl.legend([{ label: 'Manning (flujo uniforme)', color: '--water' }, { label: 'condición crítica', color: '--c5', dash: [6, 4] }], 'br');
      sim.set('yn', EM.fix(yn, 3) + ' m');
      sim.set('yc', EM.fix(yc, 3) + ' m');
      sim.set('V', EM.fix(Vn, 3) + ' m/s · ' + EM.fix(Fr, 3));
      sim.set('t', yn > yc ? 'suave (flujo uniforme subcrítico)' : 'fuerte (flujo uniforme supercrítico)');
    });
  });

  /* 20.4 Perfiles de flujo gradualmente variado */
  EM.defineSim('perfiles-gvf', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Q', { label: 'Caudal', min: 5, max: 200, step: 1, value: 40, unit: 'm³/s', fmt: (v) => v.toFixed(0) });
    sim.slider('S', { label: 'Pendiente del fondo', min: 1e-4, max: 0.003, step: 0, value: 4e-4, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('yd', { label: 'Profundidad impuesta por la presa', min: 0.3, max: 12, step: 0.05, value: 6, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('yn', 'Profundidad normal · crítica', { hl: true });
    sim.out('tipo', 'Tipo de perfil');
    sim.out('L', 'Alcance del remanso (|y − y<sub>n</sub>| < 5 cm)');
    const b = 20, z = 1, n = 0.03;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const yn = ch.yn(p.Q, b, z, n, p.S), yc = ch.ycTrap(p.Q, b, z);
      const mild = yn > yc;
      let yd = Math.max(p.yd, yc * 1.02);
      const pts = [[0, yd]];
      let y = yd, x = 0, Lr = null;
      const L = 40000, h = -40;
      if (mild) {
        for (let i = 0; i < L / -h && y > yc * 1.01; i++) {
          y = FL.rk4((t, q) => [ch.gvf(q[0], p.Q, b, z, n, p.S)], x, [y], h)[0];
          x += h; pts.push([x, y]);
          if (Lr === null && Math.abs(y - yn) < 0.05) Lr = -x;
        }
      }
      const xmin = Math.max(-L, Math.min(-3000, pts[pts.length - 1][0] * 1.1));
      const zb = (xx) => -p.S * xx;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: xmin / 1000, xmax: 0.5, ymin: 0, ymax: zb(xmin) + Math.max(yd, yn) * 1.3, xlabel: 'distancia aguas arriba de la presa (km)', ylabel: 'cota (m)' });
      pl.frame();
      pl.fn((xk) => zb(xk * 1000), { color: '--sand', width: 2, fill: '--sand', fillAlpha: 0.35, base: 0, to: 0 });
      pl.fn((xk) => zb(xk * 1000) + yn, { color: '--ink-3', width: 1.2, dash: [6, 4], to: 0 });
      pl.fn((xk) => zb(xk * 1000) + yc, { color: '--c5', width: 1.2, dash: [2, 3], to: 0 });
      if (mild) pl.path(pts.map((q) => [q[0] / 1000, zb(q[0]) + q[1]]), { color: '--water', width: 2.4, fill: '--water', fillAlpha: 0.15 });
      pl.vline(0, { color: '--ink', label: 'presa' });
      pl.legend([{ label: 'superficie del agua', color: '--water' }, { label: 'profundidad normal', color: '--ink-3', dash: [6, 4] }, { label: 'profundidad crítica', color: '--c5', dash: [2, 3] }], 'tl');
      sim.set('yn', EM.fix(yn, 3) + ' m · ' + EM.fix(yc, 3) + ' m');
      sim.set('tipo', !mild ? 'pendiente fuerte: el control está aguas arriba (perfiles S)' : yd > yn ? 'M1: remanso sobre la profundidad normal' : 'M2: descenso hacia la profundidad crítica');
      sim.set('L', mild ? (Lr ? EM.fix(Lr / 1000, 2) + ' km' : '> ' + EM.fix(-pts[pts.length - 1][0] / 1000, 1) + ' km') : '—');
    });
  });

  /* 20.5 Rotura de presa */
  EM.defineSim('rotura-presa', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('h0', { label: 'Profundidad del embalse', min: 1, max: 30, step: 0.5, value: 10, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('hd', { label: 'Profundidad aguas abajo (0 = lecho seco)', min: 0, max: 5, step: 0.1, value: 0, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.out('t', 'Tiempo', { hl: true });
    sim.out('f', 'Frente donde <i>h</i> = 1 % de <i>h</i>₀: numérico · exacto 1.7√(<i>gh</i>₀)<i>t</i>');
    sim.out('e', 'Error medio respecto a Ritter');
    const Lx = 400, nx = 800;
    let S;
    const reset = () => { S = new FL.SW1D(nx, Lx, { bc: 'open' }); for (let i = 0; i < nx; i++) S.h[i] = (i + 0.5) * (Lx / nx) < Lx / 2 ? sim.p.h0 : sim.p.hd; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate((dt) => { const tmax = (Lx / 2) / (2 * Math.sqrt(g * sim.p.h0)) * 0.95; if (S.t < tmax) { const tg = Math.min(tmax, S.t + dt * 0.8); while (S.t < tg - 1e-9) S.step(tg - S.t); } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, dx = Lx / nx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -Lx / 2, xmax: Lx / 2, ymin: 0, ymax: p.h0 * 1.15, xlabel: 'x (m) — presa en x = 0', ylabel: 'h (m)' });
      pl.frame();
      const xs = Array.from(S.h, (_, i) => (i + 0.5) * dx - Lx / 2);
      pl.xy(xs, Array.from(S.h), { color: '--water', width: 0, fill: '--water', fillAlpha: 0.3, base: 0 });
      for (let i = 0; i < nx; i += 10) pl.dot(xs[i], S.h[i], { color: '--c1', r: 2.6 });
      let err = 0;
      if (p.hd === 0 && S.t > 0) { pl.fn((x) => ch.ritter(x / S.t, p.h0).h, { color: '--accent', width: 2.2 }); for (let i = 0; i < nx; i++) err += Math.abs(S.h[i] - ch.ritter(xs[i] / S.t, p.h0).h) / nx; }
      pl.vline(0, { color: '--ink-3' });
      let xf = -Lx / 2; for (let i = 0; i < nx; i++) if (S.h[i] > 0.01 * p.h0 + p.hd) xf = xs[i];
      sim.set('t', EM.fix(S.t, 2) + ' s');
      sim.set('f', EM.fix(xf, 1) + ' m · ' + (p.hd === 0 ? EM.fix(1.7 * Math.sqrt(g * p.h0) * S.t, 1) + ' m (la punta exacta, de espesor nulo, va a 2√(gh₀))' : '—'));
      sim.set('e', p.hd === 0 ? EM.fix(err, 4) + ' m (' + EM.fix((100 * err) / p.h0, 2) + ' % de h₀)' : 'Ritter solo vale con lecho seco');
    });
  });
})();
