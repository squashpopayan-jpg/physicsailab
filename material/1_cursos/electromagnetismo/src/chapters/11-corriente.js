/* Capítulo 11 — Corriente y resistencia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* ======================================================================
     11.1 Modelo de Drude
     ====================================================================== */
  EM.defineSim('drude', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const cp = sim.canvas({ aspect: 3.8, cls: 'fixed' });
    sim.group('Parámetros (unidades de la animación)');
    sim.slider('E', { label: 'Campo eléctrico <i>E</i> (→)', min: 0, max: 3, step: 0.05, value: 1.2, fmt: f2 });
    sim.slider('tau', { label: 'Tiempo medio entre choques <i>τ</i>', min: 0.1, max: 2, step: 0.05, value: 0.6, unit: 's', fmt: f2 });
    sim.check('trail', { label: 'Rastro de un electrón', value: true });
    sim.note('La deriva está exagerada: en un metal real es unas 10¹⁰ veces menor que la velocidad térmica.');
    sim.out('vd', '⟨<i>v<sub>x</sub></i>⟩ medida', { hl: true });
    sim.out('vt', '−<i>aτ</i> (Drude)');
    sim.out('col', 'Choques por segundo (por electrón)');
    const VTH = 90; /* px/s */
    const ACC = 60; /* px/s² por unidad de E */
    let el = [], ions = [], trail = [], hist = [], avg = 0, collisions = 0, tAcc = 0, colRate = 0, tHist = 0;
    const build = () => {
      const w = cv.w, h = cv.h;
      ions = [];
      for (let x = 30; x < w; x += 46) for (let y = 30; y < h - 20; y += 40) ions.push([x + ((y / 40) % 2) * 23, y]);
      el = [];
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * 2 * Math.PI;
        el.push({ x: Math.random() * w, y: 14 + Math.random() * (h - 28), vx: VTH * Math.cos(a), vy: VTH * Math.sin(a), tc: -Math.log(Math.random()) * sim.p.tau });
      }
      trail = [];
      /* pre-calentamiento: el estado inicial ya muestra la deriva estacionaria */
      for (let k = 0; k < 240; k++) step(1 / 60);
    };
    cv.onResize = build;
    const step = (dt) => {
      const w = cv.w, h = cv.h, a = -ACC * sim.p.E; /* electrones: aceleración opuesta a E */
      let sum = 0;
      for (const e of el) {
        e.vx += a * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.tc -= dt;
        if (e.tc <= 0) {
          const ang = Math.random() * 2 * Math.PI;
          e.vx = VTH * Math.cos(ang); e.vy = VTH * Math.sin(ang);
          e.tc = -Math.log(Math.random()) * sim.p.tau;
          collisions++;
        }
        if (e.x < 0) e.x += w; if (e.x > w) e.x -= w;
        if (e.y < 12) { e.y = 12; e.vy = Math.abs(e.vy); }
        if (e.y > h - 12) { e.y = h - 12; e.vy = -Math.abs(e.vy); }
        sum += e.vx;
      }
      const m = sum / el.length;
      avg += Math.min(1, dt / 3) * (m - avg);
      tAcc += dt;
      if (tAcc > 1) { colRate = collisions / el.length / tAcc; collisions = 0; tAcc = 0; }
      const e0 = el[0];
      if (trail.length && Math.abs(trail[trail.length - 1][0] - e0.x) > w / 2) trail = [];
      trail.push([e0.x, e0.y]);
      if (trail.length > 400) trail.shift();
      tHist += dt;
      hist.push([tHist, avg]);
      if (hist.length > 600) hist.shift();
    };
    sim.animate((dt) => { if (!el.length) build(); step(dt); });
    sim.onDraw(() => {
      if (!el.length) build();
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      ctx.fillStyle = EM.alpha('--c4', 0.08);
      ctx.fillRect(0, 6, w, h - 12);
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(w, 6); ctx.moveTo(0, h - 6); ctx.lineTo(w, h - 6); ctx.stroke();
      ions.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = EM.alpha('--ink-3', 0.35); ctx.fill(); EM.text(ctx, '+', x, y + 0.5, { size: 9, weight: 700, color: '--ink-2', align: 'center', baseline: 'middle' }); });
      if (sim.p.trail && trail.length > 1) EM.draw.poly(ctx, trail, { color: '--accent', width: 1.4, alpha: 0.8 });
      el.forEach((e, i) => { ctx.beginPath(); ctx.arc(e.x, e.y, i === 0 ? 4.5 : 3, 0, 7); ctx.fillStyle = EM.col(i === 0 ? '--accent' : '--neg'); ctx.fill(); });
      if (sim.p.E > 0) {
        EM.draw.arrow(ctx, w - 110, 22, w - 30, 22, { color: '--efield', width: 2.4, head: 10 });
        EM.text(ctx, 'E', w - 122, 26, { size: 14, weight: 700, family: EM.FONT_MATH, color: '--efield', halo: true });
        EM.draw.arrow(ctx, w - 110, h - 22, w - 30, h - 22, { color: '--c1', width: 2.4, head: 10 });
        EM.text(ctx, 'I (convencional)', w - 116, h - 18, { size: 11.5, color: '--c1', halo: true, align: 'right' });
      }
      EM.draw.clear(cp);
      const th = -ACC * sim.p.E * sim.p.tau;
      const ymin = Math.min(-10, th * 1.6), ymax = 20;
      const tmax = Math.max(10, hist.length ? hist[hist.length - 1][0] : 10);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: tmax - 10, xmax: tmax, ymin, ymax, xlabel: 't (s)', ylabel: '⟨v_{x}⟩ (px/s)', mt: 10 });
      pl.frame();
      pl.hline(th, { color: '--c3', dash: [5, 4], label: 'Drude: −aτ', labelRight: true });
      if (hist.length > 1) pl.path(hist, { color: '--c1', width: 2 });
      sim.set('vd', EM.fix(avg, 1) + ' px/s');
      sim.set('vt', EM.fix(th, 1) + ' px/s');
      sim.set('col', EM.fix(colRate, 2) + ' s⁻¹ (1/τ = ' + EM.fix(1 / sim.p.tau, 2) + ')');
    });
  });

  /* ======================================================================
     11.2 Resistencia de un hilo
     ====================================================================== */
  EM.defineSim('resistance-wire', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.2 });
    const MAT = {
      Cu: { n: 'Cobre', rho: 1.68e-8, a: 3.9e-3, melt: 1085 },
      Al: { n: 'Aluminio', rho: 2.65e-8, a: 3.9e-3, melt: 660 },
      W: { n: 'Tungsteno', rho: 5.6e-8, a: 4.5e-3, melt: 3422 },
      Fe: { n: 'Hierro', rho: 9.7e-8, a: 5.0e-3, melt: 1538 },
      Ni: { n: 'Nicromo', rho: 1.1e-6, a: 0.4e-3, melt: 1400 },
      C: { n: 'Grafito', rho: 3.5e-5, a: -0.5e-3, melt: 3600 }
    };
    sim.group('Material y geometría');
    sim.select('mat', { options: Object.keys(MAT).map((k) => [k, MAT[k].n]), value: 'W' });
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 0.01, max: 100, value: 0.5, log: true, step: 0.001, unit: 'm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('d', { label: 'Diámetro', min: 0.01, max: 5, value: 0.05, log: true, step: 0.001, unit: 'mm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: -150, max: 3000, step: 5, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('V', { label: 'Tensión aplicada', min: 0.1, max: 240, value: 12, log: true, step: 0.1, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.out('rho', 'Resistividad <i>ρ</i>(<i>T</i>)');
    sim.out('R', 'Resistencia <i>R</i>', { hl: true });
    sim.out('I', 'Corriente <i>I</i> = <i>V</i>/<i>R</i>');
    sim.out('P', 'Potencia <i>V</i>²/<i>R</i>');
    sim.out('J', 'Densidad de corriente');
    const warn = sim.note('');
    sim.onDraw(() => {
      const p = sim.p, m = MAT[p.mat];
      const rhoT = (T) => m.rho * (1 + m.a * (T - 20));
      const A = Math.PI * Math.pow((p.d * 1e-3) / 2, 2);
      const R = (rhoT(p.T) * p.L) / A;
      /* dibujo del hilo */
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const len = M.clamp(((Math.log10(p.L) + 2) / 4) * (w - 80), 40, w - 60);
      const th = M.clamp(3 + Math.log10(p.d / 0.01) * 7, 3, h * 0.5);
      const x0 = (w - len) / 2, y = h / 2;
      let col = EM.col('--c4');
      if (p.T > 500) {
        const t = M.clamp((p.T - 500) / 2500, 0, 1);
        col = EM.rgbStr([120 + 135 * t, 30 + 190 * t * t, 10 + 200 * Math.pow(t, 3)]);
        ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 25 * t; ctx.fillStyle = col; ctx.fillRect(x0, y - th / 2, len, th); ctx.restore();
      } else { ctx.fillStyle = col; ctx.fillRect(x0, y - th / 2, len, th); }
      EM.text(ctx, `L = ${EM.sci(p.L, 3)} m`, w / 2, y - th / 2 - 10, { size: 12, mono: true, color: '--ink-2', align: 'center' });
      EM.text(ctx, `${m.n} a ${p.T.toFixed(0)} °C`, w / 2, y + th / 2 + 20, { size: 12, color: '--ink-2', align: 'center' });
      /* gráfica R(T) */
      EM.draw.clear(cp);
      const Tmax = Math.min(3000, m.melt);
      const Rt = (T) => (rhoT(T) * p.L) / A;
      const ys = [Rt(-150), Rt(Tmax)].sort((a, b) => a - b);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -150, xmax: 3000, ymin: Math.max(0, ys[0] * 0.9 - (ys[1] - ys[0]) * 0.05), ymax: ys[1] * 1.08, xlabel: 'T (°C)', ylabel: 'R (Ω)', title: 'R(T) = R₂₀[1 + α(T − 20 °C)]', ml: 64 });
      pl.frame();
      pl.fn(Rt, { color: '--c1', width: 2.2, to: Tmax });
      if (Tmax < 3000) pl.vline(Tmax, { color: '--warn-ink', label: 'fusión' });
      pl.dot(p.T, R, { color: '--accent', r: 5.5 });
      sim.set('rho', EM.sci(rhoT(p.T), 3) + ' Ω·m');
      sim.set('R', EM.si(R, 'Ω'));
      sim.set('I', EM.si(p.V / R, 'A'));
      sim.set('P', EM.si((p.V * p.V) / R, 'W'));
      sim.set('J', EM.si(p.V / R / A, 'A/m²'));
      warn.innerHTML = p.T > m.melt ? '<span class="warnv">La temperatura supera el punto de fusión de este material.</span>' : p.T < -100 ? 'A temperaturas muy bajas la aproximación lineal deja de ser válida.' : '';
    });
  });

  /* ======================================================================
     11.3 Curvas I–V
     ====================================================================== */
  EM.defineSim('iv-curves', function (sim) {
    const cp = sim.canvas({ aspect: 1.9 });
    sim.group('Punto de operación');
    sim.slider('V', { label: 'Tensión aplicada <i>V</i>', min: -3, max: 12, step: 0.01, value: 6, unit: 'V', fmt: f2 });
    sim.group('Elementos');
    sim.check('r', { label: 'Resistor de 100 Ω (óhmico)', value: true });
    sim.check('l', { label: 'Lámpara de filamento (12 V, 0.1 A)', value: true });
    sim.check('d', { label: 'Diodo de silicio', value: true });
    sim.out('Ir', '<i>I</i> resistor');
    sim.out('Il', '<i>I</i> lámpara');
    sim.out('Id', '<i>I</i> diodo');
    sim.outSep();
    sim.out('Rl', '<i>V</i>/<i>I</i> de la lámpara');
    sim.out('Rd', '<i>V</i>/<i>I</i> del diodo');
    const Ires = (V) => V / 100;
    const Ilamp = (V) => { const s = Math.sign(V), a = Math.abs(V); if (a === 0) return 0; return s * M.bisect((I) => 12 * I + 10800 * I ** 3 - a, 0, 1, 1e-12); };
    const Idiode = (V) => 2e-14 * (Math.exp(Math.min(V, 1.2) / 0.02585) - 1);
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -3, xmax: 12, ymin: -40, ymax: 130, xlabel: 'V (V)', ylabel: 'I (mA)' });
      pl.frame();
      if (p.r) pl.fn((V) => Ires(V) * 1e3, { color: '--c1', width: 2.2 });
      if (p.l) pl.fn((V) => Ilamp(V) * 1e3, { color: '--c4', width: 2.2 });
      if (p.d) pl.fn((V) => Idiode(V) * 1e3, { color: '--c5', width: 2.2 });
      pl.vline(p.V, { color: '--ink-3' });
      if (p.r) pl.dot(p.V, Ires(p.V) * 1e3, { color: '--c1', r: 5 });
      if (p.l) pl.dot(p.V, Ilamp(p.V) * 1e3, { color: '--c4', r: 5 });
      if (p.d && Idiode(p.V) * 1e3 < 130) pl.dot(p.V, Idiode(p.V) * 1e3, { color: '--c5', r: 5 });
      const items = [];
      if (p.r) items.push({ label: 'resistor 100 Ω', color: '--c1' });
      if (p.l) items.push({ label: 'lámpara', color: '--c4' });
      if (p.d) items.push({ label: 'diodo', color: '--c5' });
      if (items.length) pl.legend(items, 'tl');
      sim.set('Ir', EM.si(Ires(p.V), 'A'));
      sim.set('Il', EM.si(Ilamp(p.V), 'A'));
      sim.set('Id', Idiode(p.V) > 1 ? '> 1 A (la limita el circuito)' : EM.si(Idiode(p.V), 'A'));
      sim.set('Rl', Math.abs(p.V) > 1e-3 ? EM.si(p.V / Ilamp(p.V), 'Ω') : '—');
      sim.set('Rd', Math.abs(p.V) > 1e-3 && Idiode(p.V) <= 1 ? EM.si(p.V / Idiode(p.V), 'Ω') : '—');
    });
  });

  /* ======================================================================
     11.4 Relajación de carga
     ====================================================================== */
  EM.defineSim('charge-relaxation', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    const MAT = {
      cu: { n: 'Cobre', s: 5.96e7, er: 1 },
      sea: { n: 'Agua de mar', s: 4, er: 80 },
      dist: { n: 'Agua destilada', s: 5.5e-6, er: 80 },
      glass: { n: 'Vidrio', s: 1e-12, er: 6 },
      quartz: { n: 'Cuarzo fundido', s: 1.33e-18, er: 3.8 }
    };
    sim.group('Material');
    sim.select('m', { options: Object.keys(MAT).map((k) => [k, MAT[k].n]), value: 'sea', onInput: () => { t = 0; } });
    sim.out('tau', '<i>τ<sub>r</sub></i> = <i>ε</i>/<i>σ</i>', { hl: true });
    sim.out('frac', 'Fracción que queda en el interior');
    sim.note('La animación usa el tiempo reducido <i>t</i>/<i>τ<sub>r</sub></i>; la escala real se indica en el eje de la gráfica.');
    let t = 0;
    const N = 90;
    const pts = Array.from({ length: N }, () => { const r = Math.sqrt(Math.random()) * 0.8, a = Math.random() * 2 * Math.PI; return [r, a, -Math.log(Math.random())]; });
    sim.animate((dt) => { t += dt * 0.8; if (t > 5) t = 0; });
    sim.onDraw(() => {
      const m = MAT[sim.p.m], tau = (m.er * K.eps0) / m.s;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = EM.alpha('--c4', 0.12); ctx.fill();
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 2; ctx.stroke();
      pts.forEach(([r, a, life]) => {
        /* cada carga llega a la superficie en su "vida" exponencial */
        const done = t >= life;
        const rr = done ? 1 : r + (1 - r) * Math.pow(t / life, 3);
        ctx.beginPath(); ctx.arc(cx + rr * R * Math.cos(a), cy + rr * R * Math.sin(a), 3.2, 0, 7);
        ctx.fillStyle = EM.col('--pos'); ctx.fill();
      });
      EM.text(ctx, 't = ' + EM.fix(t, 2) + ' τ', 12, 20, { size: 12, mono: true, color: '--ink-2' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 5, ymin: 0, ymax: 1.05, xlabel: 't / τ   (τ = ' + EM.si(tau, 's') + ')', ylabel: 'ρ(t) / ρ(0)' });
      pl.frame();
      pl.fn((x) => Math.exp(-x), { color: '--c1', width: 2.2 });
      pl.dot(t, Math.exp(-t), { color: '--accent', r: 5 });
      pl.hline(Math.exp(-1), { color: '--ink-3', label: '1/e', labelRight: true });
      sim.set('tau', EM.si(tau, 's'));
      sim.set('frac', EM.fix(100 * Math.exp(-t), 1) + ' %');
    });
  });
})();
