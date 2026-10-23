/* Capítulo 17 — Redes de difracción y espectroscopía */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;
  const LAMPS = {
    H: { name: 'Hidrógeno', lines: [[656.28, 1], [486.13, 0.6], [434.05, 0.3], [410.17, 0.15]] },
    Na: { name: 'Sodio', lines: [[588.995, 1], [589.592, 0.55], [568.82, 0.06], [615.42, 0.05], [498.28, 0.03]] },
    Hg: { name: 'Mercurio', lines: [[404.66, 0.5], [435.83, 1], [546.07, 0.9], [576.96, 0.35], [579.07, 0.35]] },
    He: { name: 'Helio', lines: [[447.15, 0.4], [492.19, 0.15], [501.57, 0.3], [587.56, 1], [667.82, 0.35], [706.52, 0.3]] }
  };

  /* 17.1 N rendijas */
  EM.defineSim('n-rendijas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N', { label: 'Número de rendijas N', min: 1, max: 30, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Período / ancho de rendija (d/a)', min: 1.5, max: 8, step: 0.05, value: 3, fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('sec', 'Máximos secundarios entre principales', { hl: true });
    sim.out('miss', 'Órdenes ausentes');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const d = 10e-6, a = d / p.r, lam = p.lam * 1e-9, smax = Math.min(1, 4.5 * lam / d);
      const I = (s) => OP.slitI(a, lam, Math.asin(s)) * OP.gratingFactor(p.N, (Math.PI * d * s) / lam);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.72, xmin: -smax, xmax: smax, ymin: 0, ymax: 1.05, xlabel: 'sen θ', ylabel: 'I / (N² I₀)' });
      pl.frame();
      pl.fn((s) => OP.slitI(a, lam, Math.asin(s)), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.fn(I, { color: D.lamRay(p.lam), width: 1.8, n: 2400 });
      for (let m = -4; m <= 4; m++) { const s = (m * lam) / d; if (Math.abs(s) < smax) pl.label(s, 1.0, 'm=' + m, { dx: -10, size: 10 }); }
      D.screen(ctx, { x: pl.ix, y: H * 0.82, w: pl.iw, h: H * 0.13 }, (s) => I(s * smax), OP.lambdaRGB(p.lam, 1, 0.35), { gamma: 0.45 });
      const miss = []; for (let m = 1; m <= 8; m++) { const k = m / p.r; if (Math.abs(k - Math.round(k)) < 1e-6 && Math.round(k) > 0) miss.push(m); }
      sim.set('sec', String(Math.max(0, p.N - 2)));
      sim.set('miss', miss.length ? miss.map((m) => '±' + m).join(', ') : 'ninguno (d/a no entero)');
    });
  });

  /* 17.2 CD, DVD y Blu-ray */
  EM.defineSim('cd', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('disc', { label: 'Disco', options: [['1.6', 'CD (1.6 µm)'], ['0.74', 'DVD (0.74 µm)'], ['0.32', 'Blu-ray (0.32 µm)']], value: '1.6' });
    sim.seg('luz', { label: 'Luz', options: [['650', 'Láser 650 nm'], ['405', 'Láser 405 nm'], ['w', 'Blanca']], value: 'w' });
    sim.slider('ti', { label: 'Ángulo de incidencia', min: 0, max: 85, step: 0.5, value: 20, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('ord', 'Órdenes reflejados', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = +p.disc * 1e-6, ti = p.ti * DEG;
      D.dark(cv);
      const cx = W * 0.5, cy = H * 0.86, R = Math.min(W * 0.45, H * 0.78);
      ctx.fillStyle = '#9AA3AE'; ctx.fillRect(cx - R, cy, 2 * R, 6);
      ctx.strokeStyle = '#333'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - R); ctx.stroke(); ctx.setLineDash([]);
      /* rayo incidente desde la izquierda */
      ctx.strokeStyle = p.luz === 'w' ? '#FFFFFF' : D.lamRay(+p.luz); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - R * Math.sin(ti), cy - R * Math.cos(ti)); ctx.lineTo(cx, cy); ctx.stroke();
      const lams = p.luz === 'w' ? Array.from({ length: 31 }, (_, i) => 400 + i * 10) : [+p.luz];
      const out = [];
      for (let m = -6; m <= 6; m++) {
        for (const l of lams) {
          const s = Math.sin(ti) + (m * l * 1e-9) / d;
          if (Math.abs(s) >= 1) continue;
          const th = Math.asin(s);
          ctx.strokeStyle = m === 0 ? 'rgba(255,255,255,0.8)' : D.lamRay(l, p.luz === 'w' ? 0.7 : 1);
          ctx.lineWidth = p.luz === 'w' ? 2 : 2.4;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.sin(th), cy - R * Math.cos(th)); ctx.stroke();
          if (p.luz !== 'w') out.push('m = ' + m + ': ' + EM.fix(th / DEG, 1) + '°');
        }
        if (p.luz === 'w') { const s1 = Math.sin(ti) + (m * 400e-9) / d, s2 = Math.sin(ti) + (m * 700e-9) / d; if (m && (Math.abs(s1) < 1 || Math.abs(s2) < 1)) out.push('m = ' + m); }
      }
      EM.text(ctx, 'normal', cx + 4, cy - R + 12, { size: 10.5, color: '#888' });
      sim.set('ord', out.length ? out.join(' · ') : 'solo el orden 0');
    });
  });

  /* 17.3 Espectrómetro de red */
  EM.defineSim('espectrometro', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('lamp', { label: 'Lámpara', options: Object.entries(LAMPS).map(([k, v]) => [k, v.name]), value: 'Na' });
    sim.slider('N', { label: 'Líneas iluminadas N', min: 50, max: 20000, log: true, value: 600, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Orden', min: 1, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Líneas por milímetro de la red', min: 100, max: 1200, step: 10, value: 600, fmt: (v) => v.toFixed(0) });
    sim.out('R', 'Poder resolutivo mN', { hl: true });
    sim.out('dl', 'Δλ mínimo resuelto a 589 nm');
    sim.out('ang', 'Ángulo de la línea más intensa');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = LAMPS[p.lamp].lines, m = p.m;
      EM.draw.clear(cv);
      const Nn = Math.round(p.N);
      /* el detector en la dirección sen θ = mλ_det/d recibe de la línea λ₀ el factor de red con α = π m λ_det/λ₀ */
      const spec = (ld) => { let s = 0; for (const [l0, w] of L) s += w * OP.gratingFactor(Nn, (Math.PI * m * ld) / l0); return s; };
      /* espectro completo */
      let fmax = 0; for (const [l0] of L) fmax = Math.max(fmax, spec(l0));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.5, xmin: 380, xmax: 720, ymin: 0, ymax: fmax * 1.1, xlabel: 'λ (nm)', ylabel: 'detector' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 4 }, 380, 720);
      pl.frame();
      pl.fn(spec, { color: '--accent', width: 1.4, n: 3000 });
      /* ampliación alrededor de la línea más intensa */
      const main = L.reduce((a, b) => (b[1] > a[1] ? b : a));
      const win = p.lamp === 'Na' ? [587.8, 590.8] : p.lamp === 'Hg' ? [574.5, 581.5] : [main[0] - 1.5, main[0] + 1.5];
      let zmax = 0; for (let k = 0; k <= 400; k++) zmax = Math.max(zmax, spec(win[0] + ((win[1] - win[0]) * k) / 400));
      const pz = new EM.Plot(ctx, { x: 0, y: H * 0.54, w: W, h: H * 0.46, xmin: win[0], xmax: win[1], ymin: 0, ymax: zmax * 1.1, xlabel: 'λ (nm), ampliado', ylabel: '' });
      pz.frame();
      pz.fn(spec, { color: '--accent', width: 2, n: 1500 });
      for (const [l0] of L) if (l0 > win[0] && l0 < win[1]) pz.vline(l0, { color: '--ink-3', dash: [2, 4] });
      const d = 1e-3 / p.g, s = (m * main[0] * 1e-9) / d;
      sim.set('R', EM.fix(m * p.N, 0));
      sim.set('dl', EM.fix(589 / (m * p.N), 4) + ' nm' + (589 / (m * p.N) < 0.597 ? ' → el doblete del sodio se resuelve' : ''));
      sim.set('ang', Math.abs(s) < 1 ? EM.fix(Math.asin(s) / DEG, 2) + '° (' + EM.fix(main[0], 2) + ' nm)' : 'el orden no existe');
    });
  });

  /* 17.4 Red de blaze */
  EM.defineSim('blaze', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('tb', { label: 'Ángulo de blaze θ_B', min: 0, max: 30, step: 0.1, value: 8.6, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('g', { label: 'Líneas por milímetro', min: 150, max: 1800, step: 10, value: 600, fmt: (v) => v.toFixed(0) });
    sim.out('lb', 'Longitud de onda de blaze (orden 1, Littrow)', { hl: true });
    sim.out('e', 'Eficiencia del orden 1 en 500 nm');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = 1e-3 / p.g, tb = p.tb * DEG;
      EM.draw.clear(cv);
      /* modelo escalar en Littrow: η_m(λ) = sinc²[π(m − 2d sen θ_B/λ)] normalizado a los órdenes que existen */
      const eta = (m, lnm) => {
        const lam = lnm * 1e-9, u = (2 * d * Math.sin(tb)) / lam;
        let tot = 0, em = 0;
        for (let k = -6; k <= 6; k++) { if (Math.abs((k * lam) / d - Math.sin(tb)) >= 1) continue; const v = Math.pow(OP.sinc(Math.PI * (k - u)), 2); tot += v; if (k === m) em = v; }
        return tot > 0 ? em / tot : 0;
      };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 300, xmax: 1200, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'eficiencia (modelo escalar)' });
      pl.frame();
      pl.band(380, 780, { color: '--gold', alpha: 0.07 });
      pl.fn((l) => eta(0, l), { color: '--ink-3', width: 1.6 });
      pl.fn((l) => eta(1, l), { color: '--accent', width: 2.4 });
      pl.fn((l) => eta(2, l), { color: '--c2', width: 1.8 });
      pl.legend([{ label: 'orden 0', color: '--ink-3' }, { label: 'orden 1', color: '--accent' }, { label: 'orden 2', color: '--c2' }], 'tr');
      /* perfil de los surcos */
      const v = D.view({ x: W * 0.69, y: 20, w: W * 0.29, h: H - 40 }, 0, 3, -1, 2);
      ctx.strokeStyle = EM.col('--mirror'); ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k < 3; k++) { const h = Math.tan(tb); ctx.lineTo(...v.map([k, 0])); ctx.lineTo(...v.map([k + 1, h])); ctx.lineTo(...v.map([k + 1, 0])); }
      ctx.stroke();
      EM.text(ctx, 'perfil de diente de sierra', v.X(1.5), v.Y(-0.6), { size: 11, color: '--ink-2', align: 'center' });
      sim.set('lb', EM.fix(2 * d * Math.sin(tb) * 1e9, 0) + ' nm');
      sim.set('e', EM.fix(100 * eta(1, 500), 1) + ' % (modelo escalar sin pérdidas; las redes reales llegan a 70–90 %)');
    });
  });
})();
