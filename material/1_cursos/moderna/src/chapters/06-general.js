/* Capítulo 6 — Relatividad general: de la equivalencia a las ondas gravitacionales */
(function () {
  'use strict';
  const EM = window.EM, G = EM.fm.gr, K = EM.qm.K, c = K.c, deg = (r) => (r * 180) / Math.PI;

  /* 6.1 Relojes en órbita: GPS */
  EM.defineSim('gps', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('alt', { label: 'Altura de la órbita circular sobre el geoide', min: 200, max: 40000, step: 10, value: 20200, unit: 'km', fmt: (v) => v.toFixed(0) });
    sim.out('gr', 'Efecto gravitatorio (reloj más alto, más rápido)', { hl: true });
    sim.out('sr', 'Efecto de velocidad (reloj en órbita, más lento)');
    sim.out('net', 'Neto · desplazamiento de frecuencia relativo · error de posición acumulado por día (c·Δt)');
    sim.out('v', 'Velocidad orbital · periodo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = G.Rearth + p.alt * 1e3, g = G.gps(a);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 40000, ymin: -30, ymax: 60, xlabel: 'altura de la órbita (km)', ylabel: 'diferencia con un reloj en el geoide (µs/día)', ml: 56, mr: 8, title: 'Relojes en órbita circular frente a la Tierra' });
      pl.frame(); pl.hline(0, { color: '--ink-2', dash: [] });
      const f = (key) => (h) => G.gps(G.Rearth + h * 1e3).perDay[key];
      pl.fn(f('gr'), { color: '--c1', width: 2.2, n: 300 }); pl.fn(f('sr'), { color: '--c3', width: 2.2, n: 300 }); pl.fn(f('net'), { color: '--accent', width: 3, n: 300 });
      for (const [h, nm] of [[408, 'ISS'], [20200, 'GPS'], [35786, 'geoest.']]) pl.vline(h, { color: '--ink-3', label: nm, dash: [3, 3] });
      pl.dot(p.alt, g.perDay.net, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'gravitatorio', color: '--c1' }, { label: 'velocidad', color: '--c3' }, { label: 'neto', color: '--accent' }], 'tr');
      /* Panel derecho: esquema Tierra–órbita a escala */
      const cx = W * 0.82, cy = H * 0.5, Rr = Math.min(W * 0.13, H * 0.3), Ro = Rr * (a / G.Rearth);
      const sc = Math.min(1, (Math.min(W * 0.17, H * 0.43)) / Ro), RR = Rr * sc, RO = Ro * sc;
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, RO, 0, 7); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + RO * Math.cos(0.6), cy - RO * Math.sin(0.6), 5, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, `a = ${EM.fix(a / 1e3, 0)} km`, cx, H - 8, { size: 11.5, align: 'center', color: '--ink-2' });
      sim.set('gr', `${EM.fix(g.perDay.gr, 2)} µs/día`);
      sim.set('sr', `${EM.fix(g.perDay.sr, 2)} µs/día`);
      sim.set('net', `${EM.fix(g.perDay.net, 2)} µs/día · ${EM.sci(g.net, 4)} · ${EM.fix((g.net * 86400 * c) / 1e3, 2)} km/día`);
      sim.set('v', `${EM.fix(g.v / 1e3, 3)} km/s · ${EM.fix(g.period / 3600, 3)} h`);
    });
  });

  /* 6.2 Deflexión de la luz y sombra de un agujero negro */
  EM.defineSim('deflexion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Parámetro de impacto b (en unidades de m = GM/c²)', min: 3, max: 30, step: 0.05, value: 7, fmt: (v) => EM.fix(v, 2) });
    sim.out('a', 'Deflexión exacta α · aproximación 4/b · cociente', { hl: true });
    sim.out('r', 'Distancia mínima de la luz al agujero negro');
    sim.out('c', 'Parámetro crítico b_c = 3√3 m = 5.196 m: por debajo, la luz cae al horizonte');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, bc = Math.sqrt(27);
      EM.draw.clear(cv);
      /* Trazado de rayos: u″ = −u + 3u², u(0) = 0, u′(0) = 1/b (RK4) */
      const cx = W * 0.27, cy = H * 0.5, sc = (Math.min(W * 0.26, H * 0.46)) / 16;
      EM.text(ctx, 'Rayos de luz alrededor de un agujero negro (unidades de m)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      const ray = (b) => {
        const pts = []; let phi = 0, u = 0, v = 1 / b; const dphi = 0.002;
        const f = (uu, vv) => [vv, -uu + 3 * uu * uu];
        for (let i = 0; i < 6000; i++) {
          if (u > 0.5) break; const r = u > 1e-9 ? 1 / u : 1e9; pts.push([-r * Math.cos(phi), r * Math.sin(phi)]);
          if (i > 20 && u < 1e-4) break;
          const k1 = f(u, v), k2 = f(u + 0.5 * dphi * k1[0], v + 0.5 * dphi * k1[1]), k3 = f(u + 0.5 * dphi * k2[0], v + 0.5 * dphi * k2[1]), k4 = f(u + dphi * k3[0], v + dphi * k3[1]);
          u += (dphi / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v += (dphi / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); phi += dphi;
        }
        return pts;
      };
      ctx.save(); ctx.beginPath(); ctx.rect(cx - W * 0.26, 24, W * 0.52, H - 30); ctx.clip();
      for (let bb = 3.5; bb <= 14; bb += 0.75) { const pts = ray(bb), cap = bb < bc; ctx.strokeStyle = EM.alpha(cap ? '--c3' : '--c1', 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach((q, i) => { const x = cx + q[0] * sc, y = cy - q[1] * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); }
      const pts = ray(p.b); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((q, i) => { const x = cx + q[0] * sc, y = cy - q[1] * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(cx, cy, 2 * sc, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--c3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, 3 * sc, 0, 7); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'horizonte r = 2m (negro) · esfera de fotones r = 3m (rojo)', cx, H - 6, { size: 11, align: 'center', color: '--ink-3' });
      /* Deflexión frente a b */
      const pr = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 5, xmax: 40, ymin: 0, ymax: 6, xlabel: 'b / m', ylabel: 'ángulo de deflexión α (rad)', ml: 50, mr: 8, title: 'Deflexión: exacta frente a 4m/b' });
      pr.frame();
      pr.fn((b) => 4 / b, { color: '--c2', width: 2, dash: [6, 4], n: 300 });
      pr.fn((b) => (b > bc * 1.0005 ? G.deflectionExact(c * c, b) : NaN), { color: '--accent', width: 3, n: 500 });
      pr.vline(bc, { color: '--c3', label: 'b_c', dash: [3, 3] });
      if (p.b > bc) pr.dot(p.b, G.deflectionExact(c * c, p.b), { color: '--accent', r: 5.5 });
      pr.legend([{ label: 'exacta (Schwarzschild)', color: '--accent' }, { label: 'campo débil 4m/b', color: '--c2', dash: [6, 4] }], 'tr');
      if (p.b > bc) { const al = G.deflectionExact(c * c, p.b); let r0 = p.b; for (let i = 0; i < 100; i++) r0 -= (r0 ** 3 - p.b * p.b * (r0 - 2)) / (3 * r0 * r0 - p.b * p.b); sim.set('a', `${EM.fix(al, 4)} rad = ${EM.fix(deg(al), 3)}° · ${EM.fix(4 / p.b, 4)} · ${EM.fix(al / (4 / p.b), 4)}`); sim.set('r', `${EM.fix(r0, 4)} m`); }
      else { sim.set('a', 'la luz cae al agujero negro'); sim.set('r', 'cruza el horizonte (r = 2m)'); }
      sim.set('c', `b = ${EM.fix(p.b, 3)} m ${p.b > bc ? '> b_c: escapa' : '< b_c: capturada'}`);
    });
  });

  /* 6.3 Órbitas en Schwarzschild: precesión del periastro */
  EM.defineSim('orbitas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('rp', { label: 'Periastro r_p (en unidades de m = GM/c²)', min: 4, max: 60, step: 0.1, value: 10, fmt: (v) => EM.fix(v, 1) });
    sim.slider('ra', { label: 'Apoastro r_a', min: 6, max: 120, step: 0.5, value: 40, fmt: (v) => EM.fix(v, 1) });
    sim.slider('n', { label: 'Órbitas dibujadas', min: 1, max: 12, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.out('dphi', 'Ángulo entre periastros sucesivos Δφ · precesión Δφ − 2π', { hl: true });
    sim.out('w', 'Fórmula de campo débil 6π/p (p = semilatus rectum 2r_pr_a/(r_p + r_a)) · cociente');
    sim.out('el', 'Energía y momento angular: E · ℓ/m (unidades de m·c)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, rp = Math.min(p.rp, p.ra - 0.1), ra = Math.max(p.ra, rp + 0.1), o = G.schwOrbit(rp, ra);
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.5, R = Math.min(W * 0.27, H * 0.45), sc = R / ra;
      if (!(o.u3 > o.u1)) { EM.text(ctx, 'Órbita no ligada: el periastro cae dentro del límite de estabilidad (la partícula cae al horizonte)', W * 0.5, H * 0.5, { size: 13, align: 'center', color: '--c3' }); sim.set('dphi', '—'); sim.set('w', '—'); sim.set('el', '—'); return; }
      const pts = G.schwPath(rp, ra, p.n, 200);
      ctx.save(); ctx.strokeStyle = EM.alpha('--c1', 0.9); ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach((q, i) => { const x = cx + q[1] * Math.cos(q[0]) * sc, y = cy - q[1] * Math.sin(q[0]) * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, 2 * sc), 0, 7); ctx.fill(); ctx.restore();
      const k = Math.floor(t * 60) % pts.length, q = pts[k]; ctx.save(); ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + q[1] * Math.cos(q[0]) * sc, cy - q[1] * Math.sin(q[0]) * sc, 5, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, 'trayectoria en el plano orbital (el círculo negro es el horizonte r = 2m, a escala)', cx, H - 6, { size: 11, align: 'center', color: '--ink-3' });
      /* Gráfica: precesión por órbita frente a p para e fija */
      const pr = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 10, xmax: 2000, xlog: true, ymin: 1e-3, ymax: 10, ylog: true, xlabel: 'semilatus rectum p / m', ylabel: 'precesión Δφ − 2π (rad)', ml: 54, mr: 8, title: 'Precesión por órbita (e = ' + EM.fix((ra - rp) / (ra + rp), 2) + ')' });
      pr.frame();
      const e = (ra - rp) / (ra + rp);
      pr.fn((pp) => { const a0 = pp / (1 - e * e), r1 = a0 * (1 - e), r2 = a0 * (1 + e); const oo = G.schwOrbit(r1, r2); return oo.u3 > oo.u1 ? G.schwPrecession(r1, r2) : NaN; }, { color: '--accent', width: 3, n: 120 });
      pr.fn((pp) => (6 * Math.PI) / pp, { color: '--c2', width: 2, dash: [6, 4], n: 120 });
      pr.dot((2 * rp * ra) / (rp + ra), G.schwPrecession(rp, ra), { color: '--accent', r: 5.5 });
      pr.legend([{ label: 'exacta', color: '--accent' }, { label: '6π/p (campo débil)', color: '--c2', dash: [6, 4] }], 'tr');
      const dphi = G.schwDeltaPhi(rp, ra), pp = (2 * rp * ra) / (rp + ra);
      sim.set('dphi', `${EM.fix(dphi, 5)} rad = ${EM.fix(deg(dphi), 3)}° · ${EM.fix(dphi - 2 * Math.PI, 5)} rad = ${EM.fix(deg(dphi - 2 * Math.PI), 3)}°`);
      sim.set('w', `${EM.fix((6 * Math.PI) / pp, 5)} rad · ${EM.fix((dphi - 2 * Math.PI) / ((6 * Math.PI) / pp), 4)}`);
      sim.set('el', `${EM.fix(Math.sqrt(o.E2), 5)} · ${EM.fix(Math.sqrt(o.l2), 4)}`);
    });
  });

  /* 6.4 Ondas gravitacionales: el chirp de una fusión */
  EM.defineSim('ligo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('m1', { label: 'Masa del agujero negro 1', min: 1, max: 100, step: 0.5, value: 36, unit: 'M☉', fmt: (v) => EM.fix(v, 1) });
    sim.slider('m2', { label: 'Masa del agujero negro 2', min: 1, max: 100, step: 0.5, value: 29, unit: 'M☉', fmt: (v) => EM.fix(v, 1) });
    sim.slider('D', { label: 'Distancia a la fuente', min: 10, max: 5000, step: 10, value: 410, log: true, unit: 'Mpc', fmt: (v) => v.toFixed(0) });
    sim.out('Mc', 'Masa de chirp M_c = (m₁m₂)^{3/5}/(m₁ + m₂)^{1/5} · masa total', { hl: true });
    sim.out('f', 'Frecuencia de la onda: a 0.2 s de la fusión · en el ISCO (fin del inspiral)');
    sim.out('h', 'Amplitud h cerca de la fusión (campo cuadrupolar, orden más bajo)');
    sim.out('E', 'Energía radiada en la fusión (≈ 5 % de la masa total, simulación numérica: orden de magnitud) · tiempo desde 35 Hz');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m1 = p.m1 * G.Msun, m2 = p.m2 * G.Msun, Mc = G.chirpMass(m1, m2), Mt = m1 + m2, D = p.D * G.Mpc, fI = G.fISCO(Mt);
      EM.draw.clear(cv);
      const tauI = G.timeToMerger(fI, Mc), tauS = G.timeToMerger(Math.min(35, fI * 0.8), Mc), T = Math.min(tauS, 2);
      /* f(t) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: -T, xmax: 0, ymin: 0, ymax: Math.max(100, fI * 1.15), xlabel: 'tiempo hasta la fusión (s)', ylabel: 'frecuencia de la onda f (Hz)', ml: 52, mr: 8, title: 'Frecuencia del chirp' });
      pl.frame();
      pl.fn((t) => (-t > tauI ? G.fOfTau(-t, Mc) : NaN), { color: '--accent', width: 3, n: 400 });
      pl.hline(fI, { color: '--c3', label: 'f_ISCO', dash: [4, 3], labelRight: true });
      /* h(t): inspiral newtoniano con fase integrada; amplitud h = 4(GMc/c²)^{5/3}(πf/c)^{2/3}/D */
      const pr = new EM.Plot(ctx, { x: W * 0.48, y: 0, w: W * 0.52, h: H, xmin: -Math.min(T, 0.3), xmax: 0.01, ymin: -1, ymax: 1, xlabel: 'tiempo hasta la fusión (s)', ylabel: 'h / h_máx', ml: 46, mr: 8, title: 'Señal del inspiral (cuadrupolo)' });
      pr.frame();
      const tspan = Math.min(T, 0.3), N = 4000, xs = [], ys = []; let ph = 0, hmax = 0, tprev = null, fprev = null;
      for (let i = 0; i <= N; i++) { const t = -tspan + (tspan - tauI) * (i / N), tau = -t; const f = G.fOfTau(Math.max(tau, tauI), Mc); const amp = G.strain(Mc, f, D); if (tprev !== null) ph += Math.PI * (f + fprev) * (t - tprev); tprev = t; fprev = f; xs.push(t); ys.push(amp * Math.cos(ph)); hmax = Math.max(hmax, amp); }
      pr.xy(xs, ys.map((y) => y / hmax), { color: '--accent', width: 1.6 });
      const fa = G.fOfTau(0.2, Mc);
      sim.set('Mc', `${EM.fix(Mc / G.Msun, 3)} M☉ · ${EM.fix(Mt / G.Msun, 1)} M☉`);
      sim.set('f', `${EM.fix(fa, 1)} Hz · ${EM.fix(fI, 1)} Hz`);
      sim.set('h', `${EM.sci(G.strain(Mc, Math.min(150, fI), D), 3)} (f = ${EM.fix(Math.min(150, fI), 0)} Hz)`);
      sim.set('E', `${EM.sci(0.05 * Mt * c * c, 2)} J · ${EM.fix(G.timeToMerger(35, Mc), 3)} s`);
    });
  });
})();
