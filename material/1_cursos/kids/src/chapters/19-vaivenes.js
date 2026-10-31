/* Capítulo 19 — Vaivenes */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Péndulo ---------- */
  FK.sim('pendulo', function (g) {
    const ctx = g.canvas(2);
    g.slider('L', { label: 'Largo del hilo', icon: '📏', min: 0.1, max: 1.5, step: 0.01, value: 1, unit: 'm', fmt: (v) => FK.n(v, 2), reset: true });
    g.slider('m', { label: 'Masa de la bola', icon: '⚖️', min: 0.1, max: 2, step: 0.1, value: 0.5, unit: 'kg', fmt: (v) => FK.n(v, 1), reset: true });
    g.slider('a', { label: 'Ángulo de salida', icon: '📐', min: 5, max: 40, step: 1, value: 20, unit: '°', fmt: (v) => FK.n(v, 0), reset: true });
    g.out('T', 'Período medido', { icon: '⏱️', hl: true }); g.out('Tt', 'Período calculado', { icon: '🧮' });
    const S = { th: 0, w: 0, t: 0, last: null, T: null, n: 0 };
    g.run({
      init() { S.th = M.rad(g.p.a); S.w = 0; S.t = 0; S.last = null; S.T = null; g.show('T', '…'); g.show('Tt', FK.n(C.pendulumPeriod(g.p.L), 2) + ' s'); g.say('Mira cómo oscila. ¿Qué largo necesitas para que dure 1 segundo?'); },
      step(dt) {
        const n = 10;
        for (let i = 0; i < n; i++) { const h = dt / n, a = -(9.8 / g.p.L) * Math.sin(S.th); S.w += a * h; const th0 = S.th; S.th += S.w * h; S.t += h;
          if (th0 > 0 && S.th <= 0 && S.w < 0) { if (S.last !== null) { S.T = S.t - S.last; g.show('T', FK.n(S.T, 2) + ' s'); if (Math.abs(S.T - 1) < 0.03 && !g.won()) g.win('¡Un período de 1 s! Un hilo de unos 25 cm.'); } S.last = S.t; } }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF'); D.grid(c, W, H, 50, 'rgba(43,35,80,.06)');
        const px = W / 2, py = 40, sc = 220 * Math.min(1, 1.3 / (1)) / 1.0, len = g.p.L * 220;
        D.box(c, px - 80, py - 18, 160, 18, '#8A5A2B', { r: 6 });
        const bx = px + len * Math.sin(S.th), by = py + len * Math.cos(S.th);
        D.line(c, px, py, bx, by, D.INK, 3);
        D.circle(c, bx, by, 10 + g.p.m * 8, '#8E5CF6', D.INK, 3);
        D.char(c, 'eco', 120, 120, 90, 'happy');
        D.tag(c, 'masa ' + FK.n(g.p.m, 1) + ' kg', bx, by + 30 + g.p.m * 8, '#fff', { size: 13 });
      }
    });
  });

  /* ---------- Balanza de resorte ---------- */
  FK.sim('balanza-resorte', function (g) {
    const ctx = g.canvas(1.7);
    g.slider('guess', { label: 'Mi respuesta', icon: '🤔', min: 0.1, max: 2.5, step: 0.05, value: 1, unit: 'kg', fmt: (v) => FK.n(v, 2) });
    g.button('Comprobar', () => check(), { icon: '✅' }); g.button('Otro objeto', () => g.restart(), { icon: '🎒', kind: 'ghost' });
    g.out('x', 'Estiramiento', { icon: '📏', hl: true }); g.out('k', 'Dureza del resorte', { icon: '🌀' });
    const K = 100, S = { m: 1, y: 0, vy: 0, done: false };
    const ITEMS = ['🎒', '🍉', '📦', '🧱', '🐈'];
    function check() { if (S.done) return; const err = Math.abs(g.p.guess - S.m) / S.m; S.done = true; if (err <= 0.1) g.win(`¡Sí! Era de ${FK.n(S.m, 2)} kg. Masa = fuerza ÷ 9,8, y la fuerza = 100 × estiramiento.`); else g.say(`Era de ${FK.n(S.m, 2)} kg. Con 100 N/m cada 10 cm son 1 kg. ¡Otro intento!`, 'think'); }
    g.run({
      init() { S.m = Math.round(M.rnd(0.3, 2.2) * 20) / 20; S.y = 0; S.vy = 0; S.done = false; S.it = M.pick(ITEMS); g.show('k', '100 N/m'); g.say('El resorte se estira según el peso del objeto. ¿Cuánto pesa? ¡Mira la regla!'); },
      step(dt) {
        const xeq = (S.m * 9.8) / K, a = (-K * (S.y - xeq)) / S.m - 0.9 * S.vy;
        S.vy += a * dt; S.y += S.vy * dt; g.show('x', FK.n(xeq * 100, 0) + ' cm');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF');
        const top = 30, px = 300, pxm = 330;
        D.box(c, px - 80, top - 14, 160, 14, '#8A5A2B', { r: 5 });
        D.spring(c, px, top, px, top + 70 + S.y * pxm, 11, 20, '#7B7A99', 5);
        const by = top + 70 + S.y * pxm;
        D.box(c, px - 36, by, 72, 56, '#FFC21A', { r: 12 }); D.emoji(c, S.it || '🎒', px, by + 28, 40);
        /* regla */
        const rx = 520; D.box(c, rx, top + 60, 50, 340, '#fff', { r: 6, lw: 2 });
        for (let cm = 0; cm <= 30; cm += 2) { const y = top + 70 + (cm / 100) * pxm; D.line(c, rx, y, rx + (cm % 10 === 0 ? 30 : 16), y, D.INK, 2); if (cm % 10 === 0) D.text(c, cm + ' cm', rx + 34, y, { size: 13 }); }
        D.arrow(c, px + 50, by, rx - 4, by, '#FF4757', 4);
        D.char(c, 'eco', 700, 80, 80, S.done ? 'wow' : 'think');
      }
    });
  });

  /* ---------- Resonancia en el columpio ---------- */
  FK.sim('resonancia-columpio', function (g) {
    const ctx = g.canvas(2);
    g.slider('Tp', { label: 'Tiempo entre empujones', icon: '⏱️', min: 1, max: 6, step: 0.1, value: 2, unit: 's', fmt: (v) => FK.n(v, 1) });
    g.out('A', 'Altura máxima del columpio', { icon: '📈', hl: true }); g.out('Tn', 'Período natural', { icon: '🎯' });
    const L = 2, W0 = Math.sqrt(9.8 / L), S = { th: 0, w: 0, t: 0, amp: 0, push: 0, maxA: 0 };
    g.run({
      init() { S.th = 0.05; S.w = 0; S.t = 0; S.maxA = 0; S.push = 0; g.show('Tn', FK.n(C.pendulumPeriod(L), 2) + ' s'); g.say('Un empujón suave cada cierto tiempo. ¿Cada cuánto debes empujar para que suba mucho?'); },
      step(dt) {
        const n = 10;
        for (let i = 0; i < n; i++) {
          const h = dt / n; S.t += h; S.push += h;
          let f = 0;
          if (S.push >= g.p.Tp) { S.push = 0; S.kick = 0.25; }
          const a = -(W0 * W0) * Math.sin(S.th) - 0.06 * S.w;
          S.w += a * h; S.th += S.w * h;
          if (S.kick > 0) { S.w += 0.36 * Math.min(S.kick, h * 4) * 4; S.kick -= h * 4; }
        }
        S.maxA = Math.max(S.maxA * 0.999, Math.abs(M.deg(S.th)));
        g.show('A', FK.n(S.maxA, 0) + '°');
        if (S.maxA >= 35 && !g.won()) g.win('¡Lo lograste! Empujar al ritmo natural hace crecer el vaivén: resonancia.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 40, H, '#7ED957', '#B9824A');
        const px = W / 2, py = 40, len = 260;
        D.line(c, px - 140, H - 40, px, py, '#8A5A2B', 8); D.line(c, px + 140, H - 40, px, py, '#8A5A2B', 8); D.line(c, px - 40, py, px + 40, py, '#8A5A2B', 10);
        const bx = px + len * Math.sin(S.th), by = py + len * Math.cos(S.th);
        D.line(c, px, py, bx, by, D.INK, 3);
        D.box(c, bx - 22, by - 4, 44, 10, '#FF8A1F', { r: 4 }); D.emoji(c, '🧒', bx, by - 22, 40);
        D.char(c, 'eco', 120, 120, 90, 'happy');
        D.tag(c, 'ángulo: ' + FK.n(Math.abs(M.deg(S.th)), 0) + '°', W - 90, 30, '#fff', { size: 15 });
        if (S.push < 0.35) D.text(c, '✋ ¡empujón!', px, H - 12, { size: 20, align: 'center', weight: 700, color: '#FF4757' });
      }
    });
  });
})();
