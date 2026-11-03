/* Capítulo 2 — Transformaciones de Lorentz: tiempo, longitud y velocidades */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rel, K = EM.qm.K, c = K.c;
  const TAU_MU = 2.1969811e-6, M_MU = 105.6583755; /* PDG: vida media (s) y masa (MeV/c²) del muón */

  /* 2.1 Contracción de longitudes y tiempo de paso */
  EM.defineSim('contraccion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad relativa β = v/c', min: 0, max: 0.99, step: 0.005, value: 0.8, fmt: (v) => EM.fix(v, 3) });
    sim.slider('L0', { label: 'Longitud propia de la barra L₀', min: 0.5, max: 1.5, step: 0.05, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.out('g', 'Factor de Lorentz γ', { hl: true });
    sim.out('L', 'Longitud de la barra medida en el sistema de la regla: L = L₀/γ · contracción');
    sim.out('t1', 'Tiempo que tarda la barra en pasar por un punto de la regla: Δt = L/v (tiempo propio de la regla)');
    sim.out('t2', 'Tiempo que tarda la regla en pasar sobre la barra, en el sistema de la barra: L₀/v = γΔt');
    let s = 0;
    sim.resetButton(() => { s = 0; });
    sim.animate((dt) => { s = (s + dt * 0.12) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b, g = R.gamma(b), L = p.L0 / g, span = 3.2, px = (W * 0.9) / span, x0 = W * 0.05;
      EM.draw.clear(cv);
      const ruler = (y, spacing, off, label) => {
        ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.fillStyle = EM.col('--surface'); ctx.lineWidth = 1.5; ctx.fillRect(x0, y - 11, W * 0.9, 22); ctx.strokeRect(x0, y - 11, W * 0.9, 22);
        ctx.lineWidth = 1; ctx.beginPath();
        const o = ((off % spacing) + spacing) % spacing; for (let m = -1; m * spacing < span + spacing; m++) { const x = x0 + (m * spacing + o) * px; if (x < x0 || x > x0 + W * 0.9) continue; ctx.moveTo(x, y - 11); ctx.lineTo(x, y + (m % 5 === 0 ? 2 : -3)); }
        ctx.stroke(); ctx.restore();
        EM.text(ctx, label, x0 + W * 0.9, y + 22, { size: 11.5, color: '--ink-3', align: 'right' });
      };
      const rod = (y, xs, len, col, nt) => {
        ctx.save(); ctx.fillStyle = EM.alpha(col, 0.35); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.fillRect(xs, y - 12, len, 24); ctx.strokeRect(xs, y - 12, len, 24);
        ctx.beginPath(); for (let i = 1; i < nt; i++) { ctx.moveTo(xs + (len * i) / nt, y - 12); ctx.lineTo(xs + (len * i) / nt, y + 12); } ctx.stroke(); ctx.restore();
      };
      /* Sistema de la regla: la barra se mueve y se contrae; las marcas de la regla son de 0.1 m */
      const y1 = H * 0.3, y2 = H * 0.72;
      EM.text(ctx, 'Sistema de la regla (la barra pasa a la velocidad v y mide L = L₀/γ)', x0, 14, { size: 12.5, color: '--accent' });
      ruler(y1 + 20, 0.1, 0, 'regla fija, marcas cada 0.1 m');
      const xr = x0 + (-p.L0 + s * (span + 2 * p.L0)) * px;
      rod(y1 - 22, xr, L * px, '--c1', 10);
      EM.draw.arrow(ctx, xr + L * px + 10, y1 - 22, xr + L * px + 10 + 20 + 50 * b, y1 - 22, { color: '--accent', width: 2, head: 7 });
      EM.text(ctx, `L = ${EM.fix(L, 3)} m`, xr + (L * px) / 2, y1 - 44, { size: 12, align: 'center', color: '--c1' });
      /* Sistema de la barra: la regla se mueve y sus marcas se acortan */
      EM.text(ctx, 'Sistema de la barra (la regla pasa a −v: sus marcas miden 0.1/γ m)', x0, H * 0.52, { size: 12.5, color: '--accent' });
      const xb = x0 + W * 0.9 * 0.35;
      rod(y2 - 22, xb, p.L0 * px, '--c1', 10);
      EM.text(ctx, `L₀ = ${EM.fix(p.L0, 2)} m`, xb + (p.L0 * px) / 2, y2 - 44, { size: 12, align: 'center', color: '--c1' });
      ruler(y2 + 20, 0.1 / g, -s * span * 2, 'regla en movimiento hacia la izquierda');
      EM.draw.arrow(ctx, x0 + W * 0.9 - 20, y2 + 46, x0 + W * 0.9 - 20 - 20 - 50 * b, y2 + 46, { color: '--accent', width: 2, head: 7 });
      const v = b * c;
      sim.set('g', EM.fix(g, 4));
      sim.set('L', `${EM.fix(L, 4)} m · ${EM.fix((1 - 1 / g) * 100, 2)} %`);
      sim.set('t1', b > 0 ? `${EM.sci(L / v, 4)} s` : '—');
      sim.set('t2', b > 0 ? `${EM.sci(p.L0 / v, 4)} s (γΔt = ${EM.sci((g * L) / v, 4)} s)` : '—');
    });
  });

  /* 2.2 Supervivencia de los muones atmosféricos */
  EM.defineSim('muones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('E', { label: 'Energía total del muón E', min: 0.15, max: 100, step: 0.01, value: 1.67, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('h', { label: 'Altura de producción h₀', min: 8, max: 25, step: 0.5, value: 15, unit: 'km', fmt: (v) => EM.fix(v, 1) });
    sim.out('g', 'γ = E/mc² · β', { hl: true });
    sim.out('d', 'Longitud de desintegración βγcτ (con dilatación) · sin ella βcτ');
    sim.out('S', 'Fracción que llega al suelo: con dilatación · sin dilatación (física clásica)');
    sim.out('muon', 'En el sistema del muón: altura contraída h₀/γ · tiempo de caída (en unidades de τ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, g = (p.E * 1000) / M_MU, b = R.betaFromGamma(g > 1 ? g : 1.0000001), h0 = p.h * 1e3;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: p.h, ymin: 1e-12, ymax: 1.5, ylog: true, xlabel: 'altura sobre el suelo (km)', ylabel: 'fracción que sobrevive N/N₀', ml: 56, mr: 8, title: 'Muones que bajan desde h₀' });
      pl.frame();
      pl.fn((hh) => R.survival((p.h - hh) * 1e3, g, TAU_MU, true), { color: '--accent', width: 2.8, n: 200 });
      pl.fn((hh) => R.survival((p.h - hh) * 1e3, g, TAU_MU, false), { color: '--c2', width: 2.2, dash: [6, 4], n: 200 });
      pl.legend([{ label: 'con dilatación del tiempo', color: '--accent' }, { label: 'sin dilatación (τ fijo)', color: '--c2', dash: [6, 4] }], 'bl');
      /* Derecha: fracción en el suelo frente a la energía */
      const pr = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0.15, xmax: 100, xlog: true, ymin: 1e-12, ymax: 1.5, ylog: true, xlabel: 'energía total (GeV)', ylabel: 'fracción que llega al suelo', ml: 56, mr: 8, title: 'Supervivencia frente a la energía' });
      pr.frame();
      const gE = (E) => Math.max(1.0000001, (E * 1000) / M_MU);
      pr.fn((E) => R.survival(h0, gE(E), TAU_MU, true), { color: '--accent', width: 2.8, n: 200 });
      pr.fn((E) => R.survival(h0, gE(E), TAU_MU, false), { color: '--c2', width: 2.2, dash: [6, 4], n: 200 });
      pr.dot(p.E, R.survival(h0, Math.max(g, 1.0000001), TAU_MU, true), { color: '--accent' });
      const gg = Math.max(g, 1.0000001), Sd = R.survival(h0, gg, TAU_MU, true), Sn = R.survival(h0, gg, TAU_MU, false);
      sim.set('g', `${EM.fix(gg, 3)} · β = ${EM.fix(b, 6)}`);
      sim.set('d', `${EM.fix(R.decayLength(gg, TAU_MU) / 1e3, 3)} km · ${EM.fix(((b * c * TAU_MU) / 1e3), 3)} km`);
      sim.set('S', `${EM.sci(Sd, 3)} · ${EM.sci(Sn, 3)}`);
      sim.set('muon', `${EM.fix(h0 / gg / 1e3, 3)} km · ${EM.fix(h0 / gg / (b * c * TAU_MU), 3)} τ`);
    });
  });

  /* 2.3 Adición de velocidades */
  EM.defineSim('suma', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('v', { label: 'Velocidad del cohete respecto del suelo v', min: 0, max: 0.99, step: 0.005, value: 0.8, unit: 'c', fmt: (v) => EM.fix(v, 3) });
    sim.slider('u', { label: 'Velocidad de la sonda respecto del cohete u′', min: 0, max: 1, step: 0.005, value: 0.8, unit: 'c', fmt: (v) => EM.fix(v, 3) });
    sim.slider('b', { label: 'Impulso repetido: velocidad de cada impulso', min: 0.1, max: 0.9, step: 0.01, value: 0.5, unit: 'c', fmt: (v) => EM.fix(v, 2) });
    sim.out('w', 'Velocidad de la sonda respecto del suelo: relativista (u′ + v)/(1 + u′v/c²)', { hl: true });
    sim.out('wg', 'Regla de Galileo u′ + v · exceso sobre la relativista');
    sim.out('r', 'Rapidez ϑ = artanh β: ϑ(u′) + ϑ(v) = ϑ(w)');
    sim.out('N', 'Tras 1, 2, 3, 4, 5 impulsos de la velocidad elegida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 2, xlabel: 'velocidad respecto del cohete u′/c', ylabel: 'velocidad respecto del suelo w/c', ml: 52, mr: 8, title: 'Suma de velocidades' });
      pl.frame();
      pl.hline(1, { color: '--c3', label: 'c', width: 1.6, dash: [] });
      pl.fn((u) => u + p.v, { color: '--c2', width: 2, dash: [6, 4] });
      pl.fn((u) => R.velAdd(u, p.v), { color: '--accent', width: 2.8 });
      pl.dot(p.u, R.velAdd(p.u, p.v), { color: '--accent' });
      pl.legend([{ label: 'relativista', color: '--accent' }, { label: 'Galileo', color: '--c2', dash: [6, 4] }], 'tl');
      const nmax = 12, pr = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0, xmax: nmax, ymin: 0, ymax: 1.1, xlabel: 'número de impulsos N', ylabel: 'velocidad final/c', ml: 52, mr: 8, title: 'Impulsos sucesivos: la rapidez se suma' });
      pr.frame();
      pr.hline(1, { color: '--c3', label: 'c', width: 1.6, dash: [] });
      pr.fn((n) => Math.min(1.05, n * p.b), { color: '--c2', width: 2, dash: [6, 4] });
      const xs = [], ys = []; for (let n = 0; n <= nmax; n++) { xs.push(n); ys.push(R.velAddN(n, p.b)); }
      pr.xy(xs, ys, { color: '--accent', width: 2.8 }); for (let n = 1; n <= nmax; n++) pr.dot(n, ys[n], { color: '--accent', r: 3.5 });
      const w = R.velAdd(p.u, p.v);
      sim.set('w', `${EM.fix(w, 6)} c`);
      sim.set('wg', `${EM.fix(p.u + p.v, 4)} c · +${EM.fix(((p.u + p.v) - w), 4)} c`);
      sim.set('r', `${EM.fix(Math.atanh(Math.min(p.u, 0.999999)), 4)} + ${EM.fix(Math.atanh(Math.min(p.v, 0.999999)), 4)} = ${EM.fix(Math.atanh(Math.min(w, 0.9999999)), 4)}`);
      sim.set('N', [1, 2, 3, 4, 5].map((n) => EM.fix(R.velAddN(n, p.b), 4)).join(' · '));
    });
  });
})();
