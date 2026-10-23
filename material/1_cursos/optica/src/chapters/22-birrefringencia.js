/* Capítulo 22 — Cristales y actividad óptica */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, J = OP.J;
  const DEG = Math.PI / 180;

  /* Tabla de colores de interferencia (Michel-Lévy) bajo D65: retardo en nm → sRGB */
  let ML = null;
  const mlColor = (G, crossed = true) => {
    if (!ML) {
      ML = { c: [], p: [] };
      for (let g = 0; g <= 3000; g += 2) {
        for (const [key, f] of [['c', (l) => Math.pow(Math.sin((Math.PI * g) / l), 2)], ['p', (l) => Math.pow(Math.cos((Math.PI * g) / l), 2)]]) {
          const xyz = OP.reflXYZ(f);
          ML[key].push(OP.xyz2srgb(xyz[0] * 1.05, xyz[1] * 1.05, xyz[2] * 1.05));
        }
      }
    }
    const i = Math.max(0, Math.min(1500, Math.round(G / 2)));
    return (crossed ? ML.c : ML.p)[i];
  };
  EM.od.mlColor = mlColor;

  /* 22.1 Calcita */
  EM.defineSim('calcita', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('phi', { label: 'Ángulo del eje óptico con la normal a la cara', min: 0, max: 90, step: 0.5, value: 44.6, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('t', { label: 'Espesor del cristal', min: 2, max: 30, step: 0.5, value: 10, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('rot', { label: 'Giro del cristal sobre la página', min: 0, max: 360, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('an', { label: 'Analizador (0 = sin analizador)', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('rho', 'Ángulo de desplazamiento ρ', { hl: true });
    sim.out('sep', 'Separación de las imágenes');
    sim.out('n', 'Índice de la onda extraordinaria n(θ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [no, ne] = OP.UNI.calcita.f(0.5893), th = p.phi * DEG;
      EM.draw.clear(cv);
      const rho = OP.walkoff(no, ne, th), sep = p.t * Math.tan(Math.abs(rho));
      /* corte del cristal */
      const v = D.view({ x: 10, y: 10, w: W * 0.5 - 20, h: H - 20 }, -12, 12, -4, 32, false);
      ctx.fillStyle = EM.alpha('--glass', 0.3); ctx.fillRect(v.X(-10), v.Y(p.t), v.X(10) - v.X(-10), v.Y(0) - v.Y(p.t));
      ctx.strokeStyle = EM.col('--glass'); ctx.strokeRect(v.X(-10), v.Y(p.t), v.X(10) - v.X(-10), v.Y(0) - v.Y(p.t));
      for (let k = -2; k <= 2; k++) { const x0 = k * 4, L = 3; ctx.strokeStyle = EM.alpha('--c5', 0.5); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(v.X(x0 - L * Math.sin(th)), v.Y(p.t / 2 - L * Math.cos(th))); ctx.lineTo(v.X(x0 + L * Math.sin(th)), v.Y(p.t / 2 + L * Math.cos(th))); ctx.stroke(); ctx.setLineDash([]); }
      EM.text(ctx, 'eje óptico', v.X(8), v.Y(p.t / 2 + 3), { size: 10.5, color: '--c5', halo: true });
      /* rayos (la luz sube) */
      /* en un cristal negativo el vector de Poynting se aleja del eje óptico más que el vector de onda */
      const xe = -sep * (rho >= 0 ? 1 : -1);
      D.ray(ctx, v, [[0, -3], [0, 0]], { color: '--ray', width: 2.4 });
      D.ray(ctx, v, [[0, 0], [0, p.t], [0, p.t + 6]], { color: '--c1', width: 2, arrow: false });
      D.ray(ctx, v, [[0, 0], [xe, p.t], [xe, p.t + 6]], { color: '--c2', width: 2, arrow: false });
      EM.text(ctx, 'o', v.X(0) - 10, v.Y(p.t + 5), { size: 12, color: '--c1', weight: 700 });
      EM.text(ctx, 'e', v.X(xe) + 6, v.Y(p.t + 5), { size: 12, color: '--c2', weight: 700 });
      /* vista desde arriba: un punto visto a través del cristal */
      const cx = W * 0.75, cy = H / 2, sc = Math.min(W * 0.2, H * 0.4) / 4, a = p.rot * DEG;
      ctx.fillStyle = '#F4EFE4'; ctx.fillRect(cx - 4.2 * sc, cy - 4.2 * sc, 8.4 * sc, 8.4 * sc);
      ctx.strokeStyle = EM.col('--glass'); ctx.save(); ctx.translate(cx, cy); ctx.rotate(-a); ctx.strokeRect(-3 * sc, -3 * sc, 6 * sc, 6 * sc); ctx.restore();
      const an = p.an * DEG, Io = p.an ? Math.pow(Math.sin(an - a), 2) : 1, Ie = p.an ? Math.pow(Math.cos(an - a), 2) : 1;
      ctx.fillStyle = `rgba(20,20,20,${0.15 + 0.85 * Io})`; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(20,20,20,${0.15 + 0.85 * Ie})`; ctx.beginPath(); ctx.arc(cx + sep * sc * Math.cos(a) * Math.sign(rho || 1), cy - sep * sc * Math.sin(a) * Math.sign(rho || 1), 6, 0, 7); ctx.fill();
      EM.text(ctx, 'imagen de un punto (escala ×' + EM.fix(sc, 0) + ' px/mm)', cx, cy + 4.2 * sc + 14, { size: 10.5, color: '--ink-3', align: 'center' });
      sim.set('rho', EM.fix(rho / DEG, 3) + '°');
      sim.set('sep', EM.fix(sep, 3) + ' mm');
      sim.set('n', EM.fix(OP.nTheta(no, ne, th), 5) + ' (nₒ = ' + EM.fix(no, 4) + ', nₑ = ' + EM.fix(ne, 4) + ')');
    });
  });

  /* 22.2 Lámina de onda de cuarzo */
  EM.defineSim('laminas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('d', { label: 'Espesor de la lámina de cuarzo', min: 1, max: 600, log: true, value: 16.19, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 800, step: 1, value: 589, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('in', { label: 'Polarización de entrada (respecto del eje óptico)', min: 0, max: 90, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.button('λ/4 orden 0', () => sim.ctl.d.set(16.19)); sim.button('λ/2 orden 0', () => sim.ctl.d.set(32.38)); sim.button('λ/4 orden 10', () => sim.ctl.d.set(16.19 * 41));
    sim.out('G', 'Retardo Γ', { hl: true });
    sim.out('st', 'Polarización de salida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const dn = (l) => { const [o, e] = OP.UNI.cuarzo.f(l / 1000); return e - o; };
      const G = (l) => (2 * Math.PI * dn(l) * p.d * 1e-6) / (l * 1e-9);
      /* eje óptico horizontal = eje lento (cuarzo positivo): eje rápido vertical */
      const vin = [[Math.cos(p.in * DEG), 0], [Math.sin(p.in * DEG), 0]];
      const vout = J.apply(J.retarder(Math.PI / 2, G(p.lam)), vin);
      const R = Math.min(H * 0.3, W * 0.13);
      EM.od.polEllipse(ctx, W * 0.12, H * 0.42, R, vin, { color: '--c1' });
      EM.od.polEllipse(ctx, W * 0.36, H * 0.42, R, vout, { color: '--accent' });
      EM.text(ctx, 'entrada', W * 0.12, H * 0.42 + R + 18, { size: 11, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'salida', W * 0.36, H * 0.42 + R + 18, { size: 11, color: '--ink-2', align: 'center' });
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 400, xmax: 800, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'fracción de onda de Γ' });
      pl.frame();
      pl.fn((l) => { const f = G(l) / (2 * Math.PI); return f - Math.floor(f); }, { color: '--accent', width: 2, n: 1200, breakJumps: true });
      pl.hline(0.25, { color: '--ink-3', label: 'λ/4', labelRight: true }); pl.hline(0.5, { color: '--ink-3', label: 'λ/2', labelRight: true });
      pl.vline(p.lam, { color: '--c2' });
      const g = G(p.lam);
      sim.set('G', EM.fix(g / (2 * Math.PI), 4) + ' ondas (orden ' + Math.floor(g / (2 * Math.PI)) + ' + ' + EM.fix(g / (2 * Math.PI) - Math.floor(g / (2 * Math.PI)), 3) + ')');
      sim.set('st', EM.od.polDescribe(J.stokes(vout)));
    });
  });

  /* 22.3 Tabla de Michel-Lévy */
  EM.defineSim('michel-levy', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('min', { label: 'Mineral', options: [['qz', 'Cuarzo (Δn = 0.009)'], ['ol', 'Olivino (0.035)'], ['mu', 'Moscovita (0.036)'], ['cc', 'Calcita (0.172)']], value: 'qz' });
    sim.slider('d', { label: 'Espesor de la lámina', min: 1, max: 60, step: 0.5, value: 30, unit: 'µm', fmt: (v) => v.toFixed(1) });
    sim.seg('pol', { label: 'Polarizadores', options: [['c', 'Cruzados'], ['p', 'Paralelos']], value: 'c' });
    sim.out('G', 'Retardo Δn·d', { hl: true });
    sim.out('o', 'Orden');
    const DN = { qz: 0.0091, ol: 0.035, mu: 0.036, cc: 0.172 };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, cr = p.pol === 'c';
      EM.draw.clear(cv);
      const G = DN[p.min] * p.d * 1000; /* nm */
      const r = { x: 40, y: 18, w: W - 60, h: H * 0.42 }, Gmax = 2000;
      for (let i = 0; i < r.w; i++) { const g = (Gmax * i) / r.w; ctx.fillStyle = D.css(mlColor(g, cr)); ctx.fillRect(r.x + i, r.y, 1.5, r.h); }
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(r.x, r.y, r.w, r.h);
      for (let g = 0; g <= Gmax; g += 250) { const x = r.x + (g / Gmax) * r.w; EM.text(ctx, String(g), x, r.y + r.h + 14, { size: 10.5, color: '--ink-3', align: 'center', mono: true }); }
      for (const [g, lab] of [[551, '1.er orden'], [1102, '2.º'], [1653, '3.º']]) { const x = r.x + (g / Gmax) * r.w; ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(x, r.y - 4); ctx.lineTo(x, r.y); ctx.stroke(); EM.text(ctx, lab, x, r.y - 6, { size: 10, color: '--ink-3', align: 'center' }); }
      EM.text(ctx, 'retardo (nm)', r.x + r.w / 2, r.y + r.h + 30, { size: 11, color: '--ink-2', align: 'center' });
      if (G <= Gmax) { const x = r.x + (G / Gmax) * r.w; EM.draw.arrow(ctx, x, r.y + r.h + 40, x, r.y + r.h + 18, { color: '--ink', width: 2 }); }
      D.swatch(ctx, W * 0.4, H * 0.68, W * 0.2, H * 0.24, OP.rgb255(mlColor(G, cr)), '');
      sim.set('G', EM.fix(G, 0) + ' nm');
      sim.set('o', G < 551 ? 'primer orden' : G < 1102 ? 'segundo orden' : G < 1653 ? 'tercer orden' : 'orden alto (colores pálidos, casi blanco)');
    });
  });

  /* 22.4 Fotoelasticidad: disco comprimido */
  EM.defineSim('fotoelasticidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('P', { label: 'Fuerza de compresión', min: 0, max: 2000, step: 10, value: 400, unit: 'N', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: 'Coeficiente fotoelástico', min: 5, max: 100, step: 1, value: 50, unit: '×10⁻¹² Pa⁻¹', fmt: (v) => v.toFixed(0) });
    sim.seg('luz', { label: 'Luz', options: [['w', 'Blanca'], ['m', 'Sodio (589 nm)']], value: 'w' });
    sim.out('c', 'Retardo en el centro 8CP/πD', { hl: true });
    sim.out('N', 'Orden de franja en el centro (589 nm)');
    const N = 170, vals = new Array(N * N);
    let key = '';
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Dd = 0.05, R = Dd / 2, t = 0.006, Cc = p.C * 1e-12;
      const k = p.P + ',' + p.C + ',' + p.luz;
      if (k !== key) {
        key = k;
        const f = (2 * p.P) / (Math.PI * t);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const x = ((i + 0.5) / N - 0.5) * Dd, y = (0.5 - (j + 0.5) / N) * Dd;
          if (x * x + y * y > R * R) { vals[j * N + i] = null; continue; }
          const r1 = x * x + (R - y) * (R - y), r2 = x * x + (R + y) * (R + y);
          const sx = -f * (((R - y) * x * x) / (r1 * r1) + ((R + y) * x * x) / (r2 * r2) - 1 / Dd);
          const sy = -f * (Math.pow(R - y, 3) / (r1 * r1) + Math.pow(R + y, 3) / (r2 * r2) - 1 / Dd);
          const txy = f * ((Math.pow(R - y, 2) * x) / (r1 * r1) - (Math.pow(R + y, 2) * x) / (r2 * r2));
          const ds = Math.sqrt(Math.pow(sx - sy, 2) + 4 * txy * txy), G = Cc * t * ds * 1e9;
          if (p.luz === 'w') vals[j * N + i] = OP.rgb255(mlColor(Math.min(3000, G), true));
          else { const v = 255 * Math.pow(Math.sin((Math.PI * G) / 589), 2); vals[j * N + i] = [v, v * 0.82, v * 0.3]; }
        }
      }
      EM.draw.clear(cv);
      const S = Math.min(H - 16, W * 0.5), r = { x: W * 0.25 - S / 2 + 20, y: (H - S) / 2, w: S, h: S }, bg = EM.rgb('--canvas');
      D.paint(ctx, vals, N, N, r, (c) => c || bg);
      ctx.fillStyle = EM.col('--mirror'); ctx.fillRect(r.x + S / 2 - 30, r.y - 8, 60, 8); ctx.fillRect(r.x + S / 2 - 30, r.y + S, 60, 8);
      EM.draw.arrow(ctx, r.x + S / 2, r.y - 30, r.x + S / 2, r.y - 9, { color: '--c2', width: 2.4 });
      EM.draw.arrow(ctx, r.x + S / 2, r.y + S + 30, r.x + S / 2, r.y + S + 9, { color: '--c2', width: 2.4 });
      const Gc = (8 * Cc * p.P) / (Math.PI * Dd) * 1e9;
      for (const [i, line] of ['disco de 50 mm y 6 mm de espesor', 'entre polarizadores circulares', 'isocromáticas: curvas', 'de igual σ₁ − σ₂'].entries()) EM.text(ctx, line, W * 0.58, 26 + 18 * i, { size: 11, color: '--ink-2' });
      sim.set('c', EM.fix(Gc, 0) + ' nm');
      sim.set('N', EM.fix(Gc / 589, 2));
    });
  });

  /* 22.5 Actividad óptica */
  EM.defineSim('actividad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('m', { label: 'Muestra', options: [['q', 'Cuarzo'], ['s', 'Solución de sacarosa']], value: 'q' });
    sim.slider('d', { label: 'Espesor del cuarzo (a lo largo del eje)', min: 0.1, max: 10, step: 0.05, value: 3, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('c', { label: 'Concentración de sacarosa', min: 0, max: 0.4, step: 0.005, value: 0.1, unit: 'g/mL', fmt: (v) => v.toFixed(3) });
    sim.slider('a', { label: 'Ángulo del analizador', min: 0, max: 180, step: 0.5, value: 90, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('r', 'Giro a 589 nm', { hl: true });
    sim.out('col', 'Color transmitido (luz blanca)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.a * DEG;
      EM.draw.clear(cv);
      sim.ctl.d.show(p.m === 'q'); sim.ctl.c.show(p.m === 's');
      const rot = (l) => (p.m === 'q' ? OP.quartzRotation(l) * p.d : 66.5 * p.c * 2) * DEG; /* tubo de 2 dm */
      const T = (l) => Math.pow(Math.cos(a - rot(l)), 2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.68, h: H, xmin: 400, xmax: 700, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'transmisión' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 4 }, 400, 700);
      pl.frame();
      pl.fn(T, { color: '--accent', width: 2.2 });
      const xyz = OP.reflXYZ(T), g = OP.xyz2srgb(...xyz);
      D.swatch(ctx, W * 0.74, H * 0.22, W * 0.22, H * 0.45, OP.rgb255(g), p.m === 'q' ? 'cuarzo de ' + EM.fix(p.d, 2) + ' mm' : 'tubo de 2 dm');
      const r589 = rot(589.3) / DEG;
      sim.set('r', EM.fix(r589, 2) + '° (extinción con el analizador a ' + EM.fix((((r589 + 90) % 180) + 180) % 180, 1) + '°)');
      sim.set('col', `<span style="display:inline-block;width:2.2em;height:1em;vertical-align:-2px;border:1px solid var(--rule-strong);background:${D.css(g)}"></span>`);
    });
  });
})();
