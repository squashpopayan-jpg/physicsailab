/* Capítulo 10 — Girar y girar */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La honda ---------- */
  FK.sim('honda', function (g) {
    const ctx = g.canvas(2);
    g.slider('w', { label: 'Rapidez de giro', icon: '🌀', min: 2, max: 7, step: 0.5, value: 4, unit: 'rad/s', fmt: (v) => FK.n(v, 1) });
    g.slider('R', { label: 'Largo de la cuerda', icon: '📏', min: 60, max: 150, step: 10, value: 100, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.toggle('guia', { label: 'Mostrar la dirección de salida', value: true });
    g.button('¡Soltar!', () => release(), { icon: '🎯' });
    g.out('v', 'Rapidez de la piedra', { icon: '💨' }); g.out('h', 'Aciertos', { icon: '⭐', hl: true });
    const cx = 400, cy = 200, S = { th: 0, stone: null, tx: 0, ty: 0, hits: 0, msg: 0 };
    const newTarget = () => { const a = M.rnd(0, M.TAU), r = M.rnd(210, 300); S.tx = cx + r * Math.cos(a); S.ty = cy + r * Math.sin(a) * 0.62; S.ty = M.clamp(S.ty, 40, 360); };
    function release() {
      if (S.stone) return;
      const R = g.p.R, w = g.p.w;
      S.stone = { x: cx + R * Math.cos(S.th), y: cy + R * Math.sin(S.th), vx: -R * w * Math.sin(S.th) * 1.6, vy: R * w * Math.cos(S.th) * 1.6, t: 0 };
      FK.sfx.whoosh();
    }
    g.run({
      init() { S.stone = null; S.th = 0; if (!S.tx) newTarget(); g.show('h', S.hits + ' de 3'); g.say('La piedra gira. ¡Suéltala cuando salga derecho hacia el blanco!'); },
      step(dt) {
        g.show('v', FK.n((g.p.R / 100) * g.p.w, 1) + ' m/s');
        if (!S.stone) S.th += g.p.w * dt;
        else {
          const st = S.stone; st.x += st.vx * dt; st.y += st.vy * dt; st.t += dt;
          if (Math.hypot(st.x - S.tx, st.y - S.ty) < 28) { S.hits++; S.stone = null; FK.sfx.ok(); g.show('h', S.hits + ' de 3'); newTarget(); if (S.hits >= 3) { g.win('¡3 blancos! ¡Eres un pastor con muy buena puntería!'); S.hits = 0; } else g.say('¡Dio en el blanco!', 'wow'); }
          else if (st.x < -40 || st.x > 840 || st.y < -40 || st.y > 440 || st.t > 4) { S.stone = null; FK.sfx.no(); g.say('Falló. Fíjate: la piedra salió en línea recta, tangente al círculo. ¡Suéltala antes o después!', 'think'); }
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#D9F2C6', '#EAF9DD'); D.grid(c, W, H, 50, 'rgba(43,35,80,.07)');
        D.circle(c, cx, cy, g.p.R, null, 'rgba(43,35,80,.25)', 2);
        const sx = S.stone ? S.stone.x : cx + g.p.R * Math.cos(S.th), sy = S.stone ? S.stone.y : cy + g.p.R * Math.sin(S.th);
        if (!S.stone) {
          D.line(c, cx, cy, sx, sy, '#A9743B', 4);
          if (g.p.guia) { const tx = -Math.sin(S.th), ty = Math.cos(S.th); D.line(c, sx, sy, sx + tx * 600, sy + ty * 600, '#FF4757', 3, [10, 8]); D.arrow(c, sx, sy, sx + tx * 70, sy + ty * 70, '#FF4757', 6); }
        }
        D.emoji(c, '🎯', S.tx, S.ty, 52);
        D.char(c, 'newti', cx, cy, 70, 'wow');
        D.circle(c, sx, sy, 12, '#8A8AA0', D.INK, 3);
      }
    });
    g.pointer({ down: () => release() });
  });

  /* ---------- La patinadora ---------- */
  FK.sim('patinadora', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('r', { label: 'Brazos abiertos', icon: '🙆', min: 0.1, max: 0.9, step: 0.05, value: 0.9, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.toggle('pesas', { label: 'Con pesas en las manos', value: false });
    g.out('w', 'Rapidez de giro', { icon: '🌀', hl: true }); g.out('I', 'Vueltas por segundo', { icon: '🔄' });
    const L = 3.0, I0 = 0.4, S = { th: 0, w: 2.9 };
    g.run({
      init() { S.th = 0; S.w = 2.9; g.say('La patinadora gira sin que nadie la empuje. Encoge los brazos y mira qué pasa.'); },
      step(dt) {
        const target = C.skaterOmega(L, I0, g.p.pesas ? 2.4 : 0.8, g.p.r);
        S.w += (target - S.w) * Math.min(1, dt * 6);
        S.th += S.w * dt;
        g.show('w', FK.n(S.w, 1) + ' rad/s'); g.show('I', FK.n(S.w / M.TAU, 2) + ' vueltas/s');
        if (S.w / M.TAU > 1.0) g.win('¡Más de una vuelta por segundo! Encoger los brazos aumenta el giro.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E3F6FF', '#FFFFFF');
        const cx = W / 2, cy = H / 2 + 10, rpx = g.p.r * 190;
        D.circle(c, cx, cy, 168, 'rgba(142,92,246,.10)', 'rgba(142,92,246,.35)', 3);
        c.save(); c.translate(cx, cy); c.rotate(S.th);
        D.line(c, -rpx, 0, rpx, 0, '#FF8FB1', 14);
        const hand = g.p.pesas ? 20 : 11, col = g.p.pesas ? '#8E5CF6' : '#FFC21A';
        D.circle(c, -rpx, 0, hand, col, D.INK, 3); D.circle(c, rpx, 0, hand, col, D.INK, 3);
        D.circle(c, 0, 0, 34, '#FF3E9D', D.INK, 4); D.circle(c, 0, 0, 20, '#FFD6E3');
        D.circle(c, 0, -8, 9, '#FFE0B8', D.INK, 2);
        c.restore();
        D.text(c, 'vista desde arriba', 14, 24, { size: 15, color: D.INK });
        const rev = (S.th / M.TAU) | 0; D.text(c, 'vueltas: ' + rev, W - 14, 24, { size: 17, align: 'right', weight: 700 });
      }
    });
  });
})();
