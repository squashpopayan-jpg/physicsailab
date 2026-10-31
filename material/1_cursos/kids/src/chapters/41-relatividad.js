/* Capítulo 41 — La relatividad */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Reloj de luz y gemelos ---------- */
  FK.sim('reloj-luz', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('b', { label: 'Velocidad del viajero (fracción de la luz)', icon: '🚀', min: 0, max: 0.99, step: 0.01, value: 0.5, fmt: (v) => FK.n(v * 100, 0) + ' % de c' });
    g.slider('y', { label: 'Duración del viaje en la Tierra', icon: '📅', min: 2, max: 20, step: 1, value: 10, unit: 'años', fmt: (v) => FK.n(v, 0) });
    g.out('g', 'Factor γ', { icon: '🔢' }); g.out('t', 'El viajero envejece', { icon: '🧑‍🚀', hl: true }); g.out('r', 'Comparado con su gemelo', { icon: '👯' });
    const S = { t: 0 };
    g.run({
      init() { S.t = 0; g.say('Dos gemelos de 20 años: uno se queda en la Tierra, el otro viaja. ¿Quién envejece menos?'); },
      step(dt) {
        S.t += dt; const gm = C.gamma(g.p.b), ag = C.twinAge(g.p.y, g.p.b);
        g.show('g', FK.n(gm, 2)); g.show('t', FK.n(ag, 1) + ' años'); g.show('r', ag < g.p.y ? FK.n(100 * ag / g.p.y, 0) + ' % de la edad de su gemelo' : 'igual');
        if (ag <= g.p.y / 2 + 1e-9 && g.p.b >= 0.86 && !g.won()) g.win(`¡Con ${FK.n(g.p.b * 100, 0)} % de la rapidez de la luz, el viajero envejece la mitad! (${FK.n(ag, 1)} años contra ${g.p.y}).`);
      },
      draw(c, W, H) {
        D.night(c, W, H, 41, 40);
        const gm = C.gamma(g.p.b), L = 200, cx = 200, top = 50, bot = top + L;
        /* reloj en reposo */
        D.text(c, 'Reloj quieto (Tierra)', cx, 28, { size: 15, align: 'center', color: '#fff', weight: 700 });
        D.box(c, cx - 50, top - 8, 100, 8, '#C9D2E8', { r: 3 }); D.box(c, cx - 50, bot, 100, 8, '#C9D2E8', { r: 3 });
        const p = (S.t % 1.0); const ph = Math.abs(((S.t * 0.8) % 2) - 1); D.circle(c, cx, top + ph * L, 8, '#FFE066', '#fff', 2);
        /* reloj en movimiento */
        const mx0 = 480; D.text(c, 'Reloj viajero', mx0 + 130, 28, { size: 15, align: 'center', color: '#fff', weight: 700 });
        const shift = g.p.b * 140, rate = 0.8 / gm, ph2 = Math.abs(((S.t * rate) % 2) - 1), tx = ((S.t * 0.6) % 1) * 120 - 60;
        D.box(c, mx0 + tx - 50, top - 8, 100, 8, '#C9D2E8', { r: 3 }); D.box(c, mx0 + tx - 50, bot, 100, 8, '#C9D2E8', { r: 3 });
        D.circle(c, mx0 + tx + (ph2 - 0.5) * 2 * 0 + shift * (ph2 - 0.5) * 0.9, top + ph2 * L, 8, '#FF8A1F', '#fff', 2);
        D.arrow(c, mx0 + 10, bot + 40, mx0 + 10 + g.p.b * 200, bot + 40, '#12B76A', 8); D.text(c, g.p.b > 0.01 ? 'v = ' + FK.n(g.p.b * 100, 0) + ' % de c' : 'quieto', mx0 + 10, bot + 62, { size: 13, color: '#fff' });
        /* relojes de ticks */
        D.tag(c, '⏱ por cada tic del reloj de la Tierra, el del viajero hace ' + FK.n(1 / gm, 2), 400, H - 20, '#FFF1B8', { size: 13 });
        D.char(c, 'quarki', 70, H - 90, 70, 'happy');
      }
    });
  });

  /* ---------- Lente gravitacional ---------- */
  FK.sim('lente-gravitacional', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('M', { label: 'Masa de la estrella', icon: '⭐', min: 1, max: 10, step: 0.5, value: 4, fmt: (v) => FK.n(v, 1) + ' ×' });
    g.slider('b', { label: 'Distancia a la que pasa la luz', icon: '↔️', min: 40, max: 160, step: 5, value: 100, unit: 'u', fmt: (v) => FK.n(v, 0) });
    g.out('th', 'Desvío (exagerado)', { icon: '📐', hl: true }); g.out('goal', 'Blanco', { icon: '🎯' });
    const S = { ty: 250, said: false };
    g.run({
      static: true,
      init() { S.ty = Math.round(M.rnd(220, 340) / 10) * 10; g.show('goal', '¡a la derecha!'); g.say('La luz sale de la izquierda. La estrella la curva. ¡Haz que llegue al blanco!'); },
      draw(c, W, H) {
        D.night(c, W, H, 44, 60);
        const th = C.lightBend(g.p.M, g.p.b), cx = 400, cy = 200, b = g.p.b;
        g.show('th', FK.n(M.deg(th), 1) + '°');
        /* rejilla curvada */
        c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { c.beginPath(); for (let y = 0; y <= H; y += 8) { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) + 20, w = (g.p.M * 900) / (r * r + 600); const xx = x - dx * w / 40, yy = y - dy * w / 40; y ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
        for (let y = 0; y <= H; y += 40) { c.beginPath(); for (let x = 0; x <= W; x += 8) { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) + 20, w = (g.p.M * 900) / (r * r + 600); const xx = x - dx * w / 40, yy = y - dy * w / 40; x ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
        const gr = c.createRadialGradient(cx, cy, 4, cx, cy, 40 + g.p.M * 5); gr.addColorStop(0, '#FFF3A0'); gr.addColorStop(1, 'rgba(255,200,60,0)'); c.fillStyle = gr; c.fillRect(cx - 100, cy - 100, 200, 200); D.circle(c, cx, cy, 14 + g.p.M, '#FFD84D', '#fff', 2);
        /* rayo: llega por arriba a distancia b */
        const y0 = cy - b; c.beginPath(); c.moveTo(20, y0); c.lineTo(cx, y0); const ex = W - 40, ey = y0 + Math.tan(th) * (ex - cx); c.lineTo(ex, ey); c.strokeStyle = '#FFE066'; c.lineWidth = 4; c.stroke();
        D.line(c, 20, y0, cx, y0, 'rgba(255,255,255,.3)', 1, [4, 6]);
        D.emoji(c, '🔦', 24, y0, 30);
        /* blanco */
        D.emoji(c, '🎯', ex - 4, S.ty - 20, 40); const hit = Math.abs(ey - (S.ty - 20)) < 22;
        if (hit) { D.text(c, '✅', ex - 40, S.ty - 54, { size: 30 }); if (!S.said) { S.said = true; if (!g.won()) g.win('¡La luz dobló por la gravedad de la estrella y dio en el blanco! Así se comprobó la relatividad en 1919.'); } } else S.said = false;
        D.char(c, 'quarki', 70, H - 60, 64, hit ? 'wow' : 'happy');
      }
    });
  });

  /* ---------- GPS ---------- */
  FK.sim('gps-relatividad', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('d', { label: 'Días de funcionamiento', icon: '📅', min: 0, max: 10, step: 0.5, value: 1, unit: 'días', fmt: (v) => FK.n(v, 1) });
    g.toggle('rel', { label: 'Con las correcciones de la relatividad', value: false });
    g.out('dt', 'Adelanto del reloj del satélite', { icon: '⏱️' }); g.out('err', 'Error de posición', { icon: '📍', hl: true });
    const seen = { off: false, on: false };
    g.run({
      static: true,
      init() { seen.off = seen.on = false; g.say('Prueba el GPS con y sin las correcciones de Einstein.'); },
      draw(c, W, H) {
        const d = g.p.d, sr = C.gpsSR() * d, gr = C.gpsGR() * d, net = sr + gr, errKm = g.p.rel ? 0.01 : (net * 1e-6 * 299792.458);
        g.show('dt', g.p.rel ? '0 (corregido)' : FK.n(net, 1) + ' millonésimas de s'); g.show('err', g.p.rel ? '≈ 0 km 🎯' : FK.n(errKm, 1) + ' km ⚠️');
        if (d >= 1) { if (g.p.rel) seen.on = true; else seen.off = true; } if (seen.on && seen.off && !g.won()) g.win('¡Sin relatividad, el GPS se desviaría 11,5 km por día! Los relojes de los satélites se ajustan para compensar.');
        D.night(c, W, H, 47, 40);
        D.circle(c, 200, H / 2 + 30, 110, '#2E7BE8', '#9FD0FF', 4); D.circle(c, 200, H / 2 + 30, 190, null, 'rgba(255,255,255,.25)', 2);
        const a = g.t * 0.7; D.emoji(c, '🛰️', 200 + 190 * Math.cos(a), H / 2 + 30 + 190 * Math.sin(a), 36);
        D.emoji(c, '📍', 200, H / 2 - 82, 26); D.text(c, 'tú estás aquí', 200, H / 2 - 100, { size: 12, align: 'center', color: '#fff' });
        const off = Math.min(110, errKm * 3.2); D.emoji(c, '📱', 200 + off, H / 2 - 82 + off * 0.2, 26); if (off > 8) { D.line(c, 200, H / 2 - 82, 200 + off, H / 2 - 82 + off * 0.2, '#FF4757', 3, [5, 5]); D.text(c, 'lo que dice el GPS', 200 + off, H / 2 - 108, { size: 12, align: 'center', color: '#FFB3BC' }); }
        /* barra de efectos */
        const bx = 470, by = 60; D.text(c, 'Cambio diario en el reloj del satélite', bx + 130, by - 24, { size: 14, align: 'center', color: '#fff', weight: 700 });
        D.bar(c, bx, by, 260, 26, 7.2 / 50, '#FF4757', 'velocidad: −7,2 µs/día', { size: 13, ink: '#fff' }); D.bar(c, bx, by + 40, 260, 26, 45.7 / 50, '#12B76A', 'gravedad: +45,7 µs/día', { size: 13, ink: '#fff' }); D.bar(c, bx, by + 80, 260, 26, 38.5 / 50, '#FFC21A', 'total: +38,5 µs/día', { size: 13, ink: '#2B2350' });
        D.char(c, 'quarki', W - 56, H - 50, 62, 'happy');
      }
    });
  });
})();
