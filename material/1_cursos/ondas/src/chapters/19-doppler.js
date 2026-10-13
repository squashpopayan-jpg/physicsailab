/* Capítulo 19 — Efecto Doppler y ondas de choque */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);
  const VS = 343;

  /* ======================================================================
     19.1 Frentes de onda con fuente y observador en movimiento
     ====================================================================== */
  EM.defineSim('doppler-fronts', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('vs', { label: 'Velocidad de la fuente <i>v<sub>s</sub></i>/<i>v</i>', min: 0, max: 1.6, step: 0.01, value: 0.5, fmt: f2, onInput: () => restart() });
    sim.slider('vo', { label: 'Velocidad del observador <i>v<sub>o</sub></i>/<i>v</i> (hacia la fuente)', min: -0.8, max: 0.8, step: 0.01, value: 0, fmt: f2, onInput: () => restart() });
    sim.slider('f', { label: 'Frecuencia emitida', min: 100, max: 2000, step: 10, value: 440, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => restart());
    sim.out('fa', 'Observador delante (fórmula)', { hl: true });
    sim.out('fb', 'Observador detrás, en reposo');
    sim.out('la', 'Longitud de onda delante / detrás');
    /* unidades visuales: v = 1, frecuencia de emisión visual 1.6 Hz */
    let fronts, t, xs, xo;
    const W0 = 16;
    const restart = () => { fronts = []; t = 0; xs = -6; xo = 7; };
    restart();
    sim.animate((dt) => {
      const p = sim.p, T = 1 / 1.6, s = 1.4;
      const tn = t + dt * s;
      for (let k = Math.ceil(t / T); k * T < tn; k++) fronts.push([xs + p.vs * (k * T - t), k * T]);
      t = tn;
      xs += p.vs * dt * s;
      xo -= p.vo * dt * s;
      fronts = fronts.filter((q) => t - q[1] < 14);
      if (xs > 9 || xo < xs + 0.5 || xo < -8 || xo > 9) restart();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, sc = W / W0, cx = W / 2, cy = H / 2;
      EM.draw.clear(cv);
      ctx.lineWidth = 1.4;
      fronts.forEach(([x0, te]) => {
        const r = (t - te) * sc;
        ctx.strokeStyle = EM.alpha('--c1', Math.max(0.1, 0.8 - (t - te) * 0.06));
        ctx.beginPath(); ctx.arc(cx + x0 * sc, cy, r, 0, 2 * Math.PI); ctx.stroke();
      });
      if (p.vs > 1) {
        const a = Math.asin(1 / p.vs), L = W;
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + xs * sc, cy); ctx.lineTo(cx + xs * sc - L * Math.cos(a), cy - L * Math.sin(a)); ctx.moveTo(cx + xs * sc, cy); ctx.lineTo(cx + xs * sc - L * Math.cos(a), cy + L * Math.sin(a)); ctx.stroke();
      }
      EM.draw.bob(ctx, cx + xs * sc, cy, 8, { color: '--accent' });
      if (p.vs > 0) EM.draw.arrow(ctx, cx + xs * sc, cy - 16, cx + xs * sc + 30, cy - 16, { color: '--accent', width: 2 });
      /* observador */
      ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(cx + xo * sc, cy, 7, 0, 7); ctx.fill();
      EM.text(ctx, 'observador', cx + xo * sc, cy + 24, { size: 11, color: '--c3', align: 'center' });
      if (p.vo !== 0) EM.draw.arrow(ctx, cx + xo * sc, cy - 16, cx + xo * sc - 26 * Math.sign(p.vo), cy - 16, { color: '--c3', width: 2 });
      const fa = p.vs < 1 ? (p.f * (1 + p.vo)) / (1 - p.vs) : NaN, fb = p.f / (1 + p.vs);
      sim.set('fa', p.vs < 1 ? EM.fix(fa, 1) + ' Hz' : '— (la fuente llega antes que su sonido)');
      sim.set('fb', EM.fix(fb, 1) + ' Hz');
      sim.set('la', EM.si((VS * (1 - p.vs)) / p.f, 'm') + ' / ' + EM.si((VS * (1 + p.vs)) / p.f, 'm'));
    });
  });

  /* ======================================================================
     19.2 Una sirena que pasa
     ====================================================================== */
  EM.defineSim('doppler-passby', function (sim) {
    const cv = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.slider('u', { label: 'Velocidad del vehículo', min: 10, max: 300, step: 1, value: 100, unit: 'km/h', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Distancia mínima al observador', min: 1, max: 100, value: 10, log: true, step: 0.1, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('f', { label: 'Frecuencia de la sirena', min: 200, max: 1500, step: 10, value: 700, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    EM.listenButton(sim, () => {
      const p = sim.p, u = p.u / 3.6, d = p.d, dur = 7;
      /* señal recibida: se busca el instante de emisión t_e con t = t_e + r(t_e)/v */
      return {
        fn: (t) => {
          const tr = t - dur / 2;
          let te = tr - d / VS;
          for (let i = 0; i < 6; i++) te = tr - Math.hypot(u * te, d) / VS;
          const r = Math.hypot(u * te, d);
          const ph = 2 * Math.PI * p.f * te, ph2 = 2 * Math.PI * p.f * 1.5 * te;
          return ((Math.sin(ph) + 0.4 * Math.sin(ph2)) * Math.min(1, 3 / r));
        }, dur
      };
    }, { label: '♪ Escuchar el paso' });
    sim.out('fa', 'Frecuencia al acercarse', { hl: true });
    sim.out('fb', 'Frecuencia al alejarse');
    sim.out('st', 'Caída de tono');
    let t = -4;
    sim.animate((dt) => { t += dt; if (t > 4) t = -4; });
    sim.onDraw(() => {
      const p = sim.p, u = p.u / 3.6;
      const fRec = (tr) => { let te = tr - p.d / VS; for (let i = 0; i < 8; i++) te = tr - Math.hypot(u * te, p.d) / VS; const x = u * te, r = Math.hypot(x, p.d), cos = -x / r; return p.f / (1 - (u / VS) * cos); };
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const span = Math.max(u * 4, 40), sc = W / (2 * span);
      ctx.fillStyle = EM.alpha('--ink-3', 0.2); ctx.fillRect(0, H * 0.25, W, H * 0.25);
      const xv = W / 2 + u * t * sc;
      ctx.fillStyle = EM.col('--c2'); ctx.fillRect(xv - 18, H * 0.3, 36, H * 0.15);
      ctx.fillStyle = EM.col('--c1'); ctx.fillRect(xv - 6, H * 0.25, 12, 5);
      const oy = Math.min(H - 12, H * 0.375 + p.d * sc);
      ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(W / 2, oy, 7, 0, 7); ctx.fill();
      EM.text(ctx, 'observador (d = ' + EM.fix(p.d, 1) + ' m)', W / 2 + 12, oy + 4, { size: 11, color: '--c3' });
      EM.draw.clear(cp);
      const fa = p.f / (1 - u / VS), fb = p.f / (1 + u / VS);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -4, xmax: 4, ymin: fb * 0.97, ymax: fa * 1.03, xlabel: 't (s) respecto al paso más cercano', ylabel: 'f percibida (Hz)', ml: 58 });
      pl.frame();
      pl.hline(p.f, { color: '--ink-3', label: 'f emitida' });
      pl.fn(fRec, { color: '--c1', width: 2.2, n: 600 });
      pl.dot(t, fRec(t), { color: '--accent', r: 6 });
      sim.set('fa', EM.fix(fa, 1) + ' Hz');
      sim.set('fb', EM.fix(fb, 1) + ' Hz');
      sim.set('st', EM.fix(12 * Math.log2(fa / fb), 2) + ' semitonos');
    });
  });

  /* ======================================================================
     19.3 Eco Doppler
     ====================================================================== */
  EM.defineSim('doppler-echo', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const APP = {
      eco: { n: 'Ecografía Doppler (sangre)', f: 5e6, v: 1540, u: [0.01, 2, 0.5], unit: 'm/s' },
      radar: { n: 'Radar de tránsito (24 GHz)', f: 24e9, v: 3e8, u: [1, 80, 27.8], unit: 'm/s' },
      sonar: { n: 'Sonar de un barco (50 kHz)', f: 5e4, v: 1500, u: [0.1, 15, 5], unit: 'm/s' },
      bat: { n: 'Murciélago (45 kHz)', f: 4.5e4, v: 343, u: [0.5, 15, 5], unit: 'm/s' }
    };
    sim.select('app', { label: 'Aplicación', options: Object.keys(APP).map((k) => [k, APP[k].n]), value: 'eco', onInput: () => { const A = APP[sim.p.app]; sim.ctl.u.range(A.u[0], A.u[1]); sim.ctl.u.set(A.u[2]); } });
    sim.slider('u', { label: 'Velocidad del blanco', min: 0.01, max: 2, step: 0.01, value: 0.5, unit: 'm/s', fmt: (v) => EM.fix(v, 2) });
    sim.slider('th', { label: 'Ángulo entre el haz y el movimiento', min: 0, max: 89, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('df', 'Desplazamiento Δ<i>f</i>', { hl: true });
    sim.out('rel', 'Δ<i>f</i>/<i>f</i>');
    sim.out('kmh', 'Velocidad');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, A = APP[p.app];
      const df = (2 * p.u * Math.cos(M.rad(p.th)) * A.f) / A.v;
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sx = 40, sy = H * 0.5;
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(sx - 20, sy - 14, 20, 28);
      const tx = W * 0.65, ty = H * 0.5;
      const a = M.rad(p.th);
      /* haz */
      ctx.strokeStyle = EM.alpha('--c1', 0.5); ctx.lineWidth = 1.4;
      for (let k = 0; k < 10; k++) { const s = ((t * 0.8 + k / 10) % 1) * (tx - sx); ctx.beginPath(); ctx.arc(sx + s, sy, 10, -0.5, 0.5); ctx.stroke(); }
      /* blanco que se mueve formando el ángulo θ con el haz (hacia el emisor) */
      const ph = (t * 0.4) % 1;
      const bx = tx + 90 * Math.cos(a) * (0.5 - ph), by = ty + 90 * Math.sin(a) * (0.5 - ph);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(tx + 60 * Math.cos(a), ty + 60 * Math.sin(a)); ctx.lineTo(tx - 60 * Math.cos(a), ty - 60 * Math.sin(a)); ctx.stroke(); ctx.setLineDash([]);
      EM.draw.bob(ctx, bx, by, 10, { color: '--c2' });
      EM.draw.arrow(ctx, bx, by, bx - 34 * Math.cos(a), by - 34 * Math.sin(a), { color: '--c2', width: 2 });
      EM.text(ctx, 'θ = ' + p.th + '°', tx + 16, ty - 18, { size: 12, color: '--ink-2' });
      sim.set('df', EM.si(df, 'Hz'));
      sim.set('rel', EM.sci(df / A.f, 3));
      sim.set('kmh', EM.fix(p.u * 3.6, 2) + ' km/h');
    });
  });

  /* ======================================================================
     19.4 Cono de Mach
     ====================================================================== */
  EM.defineSim('mach-cone', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('Ma', { label: 'Número de Mach', min: 0.5, max: 4, step: 0.01, value: 2, fmt: f2, onInput: () => restart() });
    sim.slider('h', { label: 'Altura de vuelo', min: 1, max: 15, step: 0.5, value: 9, unit: 'km', fmt: (v) => EM.fix(v, 1) });
    sim.resetButton(() => restart());
    sim.out('a', 'Semiángulo del cono <i>α</i>', { hl: true });
    sim.out('dt', 'Estampido tras pasar sobre el observador');
    sim.out('dx', 'Distancia recorrida en ese tiempo');
    let fronts, t, x;
    const restart = () => { fronts = []; t = 0; x = -10; };
    restart();
    sim.animate((dt) => {
      const s = 1.2, T = 0.35;
      const tn = t + dt * s;
      for (let k = Math.ceil(t / T); k * T < tn; k++) fronts.push([x + sim.p.Ma * (k * T - t), k * T]);
      x += sim.p.Ma * dt * s;
      t = tn;
      fronts = fronts.filter((q) => t - q[1] < 25);
      if (x > 14) restart();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = W / 26, cx = W / 2, cy = H * 0.35, gy = H - 18;
      ctx.fillStyle = EM.alpha('--c3', 0.15); ctx.fillRect(0, gy, W, 18);
      ctx.lineWidth = 1.2;
      fronts.forEach(([x0, te]) => { ctx.strokeStyle = EM.alpha('--c1', 0.45); ctx.beginPath(); ctx.arc(cx + x0 * sc, cy, (t - te) * sc, 0, 2 * Math.PI); ctx.stroke(); });
      if (p.Ma > 1) {
        const a = Math.asin(1 / p.Ma), L = W * 1.5;
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(cx + x * sc, cy); ctx.lineTo(cx + x * sc - L * Math.cos(a), cy - L * Math.sin(a)); ctx.moveTo(cx + x * sc, cy); ctx.lineTo(cx + x * sc - L * Math.cos(a), cy + L * Math.sin(a)); ctx.stroke();
        /* punto del suelo alcanzado por el choque */
        const gx = cx + x * sc - (gy - cy) / Math.tan(a);
        ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 7); ctx.fill();
        EM.text(ctx, '¡bum!', gx, gy - 10, { size: 12, color: '--c2', align: 'center', weight: 700, halo: true });
      }
      ctx.save(); ctx.translate(cx + x * sc, cy);
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -5); ctx.lineTo(-12, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      const v = 300;
      if (p.Ma > 1) {
        const a = Math.asin(1 / p.Ma), d = (p.h * 1000) / Math.tan(a);
        sim.set('a', EM.fix(M.deg(a), 1) + '°');
        sim.set('dt', EM.fix(d / (p.Ma * v), 1) + ' s (con v = 300 m/s)');
        sim.set('dx', EM.fix(d / 1000, 2) + ' km');
      } else { sim.set('a', '— (subsónico)'); sim.set('dt', 'no hay estampido'); sim.set('dx', '—'); }
    });
  });
})();
