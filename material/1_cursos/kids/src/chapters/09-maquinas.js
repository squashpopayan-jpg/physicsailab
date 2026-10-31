/* Capítulo 9 — Máquinas simples */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Balancín ---------- */
  FK.sim('balancin', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('mL', { label: 'Peso de la izquierda', icon: '⬅️', min: 5, max: 60, step: 5, value: 40, unit: 'kg', fmt: (v) => FK.n(v, 0) });
    g.slider('dL', { label: 'Distancia izquierda al centro', icon: '↔️', min: 0.5, max: 3, step: 0.25, value: 1, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.slider('mR', { label: 'Peso de la derecha', icon: '➡️', min: 5, max: 60, step: 5, value: 20, unit: 'kg', fmt: (v) => FK.n(v, 0) });
    g.slider('dR', { label: 'Distancia derecha al centro', icon: '↔️', min: 0.5, max: 3, step: 0.25, value: 1.5, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.out('tl', 'Giro izquierdo (peso × distancia)', { icon: '⬅️' }); g.out('tr', 'Giro derecho (peso × distancia)', { icon: '➡️' });
    const s = { ang: 0, hold: 0 };
    g.run({
      init() { s.ang = 0; s.hold = 0; g.say('Mueve los pesos y las distancias hasta que el balancín quede derecho.'); },
      step(dt) {
        const tl = g.p.mL * g.p.dL, tr = g.p.mR * g.p.dR;
        g.show('tl', FK.n(tl, 0)); g.show('tr', FK.n(tr, 0));
        const target = M.clamp(((tr - tl) / (tr + tl)) * 1.4, -0.32, 0.32);
        s.ang += (target - s.ang) * Math.min(1, dt * 5);
        if (Math.abs(tr - tl) / (tr + tl) < 0.001 && Math.abs(g.p.dL - g.p.dR) >= 0.5) { s.hold += dt; if (s.hold > 1.2) { if (!g.won()) g.win('¡Equilibrio! Con pesos distintos y distancias distintas: peso × distancia es igual.'); else if (!s.said) { s.said = true; g.say('¡Equilibrado otra vez!', 'happy'); } } } else { s.hold = 0; s.said = false; }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7'); D.ground(c, W, H - 36, H, '#7ED957', '#B9824A');
        const px = 110, cx = W / 2, cy = H - 90;
        D.poly(c, [[cx, cy], [cx - 40, H - 36], [cx + 40, H - 36]], '#8E5CF6', D.INK, 3);
        c.save(); c.translate(cx, cy); c.rotate(s.ang);
        D.box(c, -3.3 * px, -10, 6.6 * px, 16, '#C98A3F', { r: 6 });
        for (let m = -3; m <= 3; m++) if (m) { D.line(c, m * px, -10, m * px, -3, D.INK, 2); D.text(c, Math.abs(m) + ' m', m * px, 18, { size: 11, align: 'center' }); }
        const w = (m, d, col, side) => { const x = side * d * px, sz = 26 + m * 0.55; D.box(c, x - sz / 2, -10 - sz, sz, sz, col, { r: 6 }); D.text(c, m + ' kg', x, -10 - sz / 2, { size: Math.max(11, sz / 3.2), align: 'center', color: '#fff' }); };
        c.save(); w(g.p.mL, g.p.dL, '#FF4757', -1); w(g.p.mR, g.p.dR, '#1E88FF', 1); c.restore();
        c.restore();
        D.circle(c, cx, cy, 9, '#FFC21A', D.INK, 3);
        D.text(c, Math.abs(s.ang) < 0.01 ? '⚖️ ¡Equilibrado!' : s.ang < 0 ? 'Gana la izquierda' : 'Gana la derecha', cx, 28, { size: 22, align: 'center', weight: 700 });
      }
    });
  });

  /* ---------- Poleas ---------- */
  FK.sim('poleas', function (g) {
    const ctx = g.canvas(2);
    g.choice('n', { label: 'Cuerdas que sostienen la carga', icon: '🪢', options: [[1, '1 (polea fija)'], [2, '2 cuerdas'], [3, '3 cuerdas'], [4, '4 cuerdas']], value: 1, reset: true });
    g.slider('m', { label: 'Masa de la carga', icon: '⚖️', min: 20, max: 150, step: 10, value: 100, unit: 'kg', fmt: (v) => FK.n(v, 0), reset: true });
    g.button('¡Jalar!', () => { if (s.st === 'ready') { const F = (g.p.m * 9.8) / g.p.n; if (F <= 250) { s.st = 'lift'; FK.sfx.pop(); } else { s.st = 'fail'; FK.sfx.no(); g.say(`Se necesitan ${FK.n(F, 0)} N y Newti solo puede hacer 250 N. ¡Usa más cuerdas!`, 'sad'); } } }, { icon: '💪' });
    g.out('F', 'Fuerza necesaria', { icon: '💪', hl: true }); g.out('L', 'Cuerda que jalas para subir 2 m', { icon: '📏' });
    const s = { st: 'ready', h: 0 };
    g.run({
      init() { s.st = 'ready'; s.h = 0; g.say('Newti puede hacer una fuerza de 250 N (como levantar 25 kg). ¿Podrá con la carga?'); },
      step(dt) {
        const F = (g.p.m * 9.8) / g.p.n;
        g.show('F', FK.n(F, 0) + ' N ' + (F <= 250 ? '✅' : '❌')); g.show('L', FK.n(2 * g.p.n, 0) + ' m');
        if (s.st === 'lift') { s.h += dt * 0.8; if (s.h >= 2) { s.h = 2; s.st = 'done'; if (g.p.m >= 100) g.win(`¡Lo logró! Levantó ${g.p.m} kg con solo ${FK.n(F, 0)} N, pero jaló ${2 * g.p.n} m de cuerda.`); else g.say(`¡Subió! Ahora prueba con una carga de 100 kg o más.`, 'happy'); } }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E6F4FF', '#F8FCFF'); D.grid(c, W, H, 40); D.ground(c, W, H - 40, H, '#C9C9D9', '#9A9AB5');
        const gy = H - 40, top = 40, bx = 360, pxm = 60;
        D.box(c, bx - 160, top - 24, 320, 24, '#8A8AA0', { r: 6 });
        const y = gy - 50 - s.h * pxm - 20, n = g.p.n;
        D.box(c, bx - 50, y, 100, 60, '#8E5CF6', { r: 10 }); D.emoji(c, g.p.m >= 100 ? '🎹' : '📦', bx, y + 30, 38); D.text(c, g.p.m + ' kg', bx, y + 52, { size: 13, align: 'center', color: '#fff' });
        const xs = n === 1 ? [bx] : Array.from({ length: n }, (_, i) => bx - 36 + (i * 72) / (n - 1));
        xs.forEach((x) => { D.line(c, x, top, x, y, '#A9743B', 4); D.circle(c, x, top + 12, 8, '#FFC21A', D.INK, 2); });
        D.tag(c, n + (n === 1 ? ' cuerda sostiene' : ' cuerdas sostienen'), bx, top - 40, '#fff', { size: 14 });
        /* Newti jala del extremo libre */
        const nx = 640, pull = s.h * pxm * n * 0.5;
        D.line(c, xs[xs.length - 1] + 40, top + 12, nx - 16, gy - 70 - pull * 0, '#A9743B', 4);
        D.char(c, 'newti', nx, gy - 40, 90, s.st === 'fail' ? 'sad' : s.st === 'lift' ? 'wow' : 'happy');
        D.arrow(c, nx - 50, gy - 100, nx - 50, gy - 100 + Math.min(70, 70 * (g.p.m * 9.8) / g.p.n / 250), '#FF4757', 8);
        D.text(c, 'jala', nx - 70, gy - 80, { size: 14, align: 'right', color: '#FF4757', weight: 700 });
        D.text(c, 'Cuerda jalada: ' + FK.n(s.h * n, 1) + ' m', 20, H - 14, { size: 15, weight: 700 });
      }
    });
  });
})();
