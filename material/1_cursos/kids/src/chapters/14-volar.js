/* Capítulo 14 — Volar */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Ala del avión ---------- */
  FK.sim('ala-avion', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('v', { label: 'Rapidez', icon: '💨', min: 30, max: 90, step: 1, value: 50, unit: 'm/s', fmt: (v) => FK.n(v, 0) });
    g.slider('a', { label: 'Inclinación del ala', icon: '📐', min: -2, max: 22, step: 0.5, value: 3, unit: '°', fmt: (v) => FK.n(v, 1) });
    g.out('L', 'Sustentación', { icon: '⬆️', hl: true }); g.out('W', 'Peso', { icon: '⬇️' }); g.out('t', 'Tiempo a nivel', { icon: '⏱️' });
    const S = { y: 0, vy: 0, lvl: 0, scroll: 0 };
    const MASS = 1000, AREA = 16;
    g.run({
      init() { S.y = 0; S.vy = 0; S.lvl = 0; g.say('Tu avión pesa 1000 kg. Ajusta rapidez e inclinación para que la sustentación sea igual al peso.'); },
      step(dt) {
        const L = C.wingLift(g.p.v, g.p.a, AREA), W = MASS * 9.8, stall = g.p.a > 15;
        g.show('L', FK.n(L / 1000, 1) + ' kN' + (stall ? ' 😱 ¡pérdida!' : '')); g.show('W', FK.n(W / 1000, 1) + ' kN');
        const acc = (L - W) / MASS; S.vy += (acc - S.vy * 1.2) * dt; S.y += S.vy * dt; S.scroll += g.p.v * dt * 4;
        if (S.y < -60) { S.y = -60; S.vy = 0; } if (S.y > 80) { S.y = 80; S.vy = 0; }
        if (Math.abs(L - W) / W < 0.12 && Math.abs(S.vy) < 0.8) { S.lvl += dt; } else S.lvl = Math.max(0, S.lvl - dt * 2);
        g.show('t', FK.n(S.lvl, 1) + ' s');
        if (S.lvl >= 6 && !S.said) { S.said = true; g.win('¡6 segundos en vuelo nivelado! La sustentación igualó al peso.'); }
        if (S.y <= -59) { if (!S.crash) { S.crash = true; g.say('¡Ay! El avión perdió altura. Más rapidez o un poco más de inclinación (sin pasarte de 15°).', 'sad'); } } else S.crash = false;
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#7FC7FF', '#E8F8FF');
        for (let i = 0; i < 5; i++) D.cloud(c, ((i * 230 - S.scroll * 0.4) % 1000 + 1000) % 1000 - 100, 60 + (i * 53) % 130, 1 + (i % 2) * 0.5);
        const cy = 220 - S.y * 1.4;
        c.save(); c.translate(380, cy); c.rotate(M.rad(45) - M.rad(g.p.a) * 0.6);
        D.emoji(c, '✈️', 0, 0, 120);
        c.restore();
        /* flechas */
        const L = C.wingLift(g.p.v, g.p.a, AREA), Wt = MASS * 9.8;
        D.arrow(c, 380, cy, 380, cy - L / 220, '#12B76A', 9); D.arrow(c, 380, cy, 380, cy + Wt / 220, '#FF4757', 9);
        D.text(c, 'sustentación', 392, cy - L / 220, { size: 14, color: '#0A7A46', weight: 700 }); D.text(c, 'peso', 392, cy + Wt / 220, { size: 14, color: '#C0182B', weight: 700 });
        D.ground(c, W, H - 20, H, '#7ED957', '#B9824A');
        if (g.p.a > 15) D.tag(c, '¡PÉRDIDA! el aire se separa del ala', W / 2, 30, '#FFC7CD', { size: 17 });
        else D.tag(c, 'nivel: ' + (Math.abs(S.vy) < 0.8 ? '✅' : '↕️'), W - 70, 30, '#fff', { size: 15 });
      }
    });
  });

  /* ---------- Paracaídas ---------- */
  FK.sim('paracaidas', function (g) {
    const ctx = g.canvas(1.7);
    g.slider('D', { label: 'Diámetro del paracaídas', icon: '🪂', min: 2, max: 10, step: 0.5, value: 6, unit: 'm', fmt: (v) => FK.n(v, 1), reset: true });
    g.button('¡Saltar!', () => { if (S.st === 'ready') { S.st = 'fall'; FK.sfx.whoosh(); } }, { icon: '🛫' });
    g.button('¡Abrir paracaídas!', () => { if (S.st === 'fall') { S.open = 0.001; FK.sfx.pop(); } }, { icon: '🪂', kind: 'ghost' });
    g.out('h', 'Altura', { icon: '📏' }); g.out('v', 'Rapidez', { icon: '💨', hl: true });
    const S = { st: 'ready', y: 600, v: 0, open: 0 };
    const MASS = 80, HEIGHT = 600;
    g.run({
      init() { S.st = 'ready'; S.y = HEIGHT; S.v = 0; S.open = 0; S.said = false; g.say('Estás a 600 m de altura. Salta y abre el paracaídas antes de llegar abajo.'); },
      step(dt) {
        if (S.st === 'ready') { g.show('h', '600 m'); g.show('v', '0 m/s'); return; }
        if (S.st !== 'fall') return;
        if (S.open > 0 && S.open < 1) S.open = Math.min(1, S.open + dt / 1.5);
        const vt = C.terminalSpeed(MASS, S.open > 0 ? 0.7 + (Math.PI * g.p.D * g.p.D / 4 - 0.7) * S.open : 0.7, S.open > 0 ? 1 + 0.5 * S.open : 1);
        const n = 8;
        for (let i = 0; i < n; i++) { const st = { y: 0, v: S.v }; C.stepFall(st, (dt * 2) / n, 9.8, vt); S.v = st.v; S.y -= st.y; }
        g.show('h', FK.n(Math.max(0, S.y), 0) + ' m'); g.show('v', FK.n(S.v, 1) + ' m/s = ' + FK.n(S.v * 3.6, 0) + ' km/h');
        if (S.y <= 0) {
          S.y = 0; S.st = 'done';
          if (S.v <= 7) g.win(`¡Aterrizaste suave a ${FK.n(S.v, 1)} m/s (${FK.n(S.v * 3.6, 0)} km/h)!`); else { FK.sfx.boom(); g.say(`¡Aterrizaje muy fuerte a ${FK.n(S.v, 1)} m/s! ${S.open === 0 ? 'No abriste el paracaídas.' : 'Lo abriste muy tarde o es muy pequeño.'}`, 'sad'); }
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#5BA8E8', '#E8F8FF');
        D.ground(c, W, H - 50, H, '#7ED957', '#B9824A');
        const gy = H - 50, y = gy - 50 - (S.y / HEIGHT) * (gy - 120);
        for (let i = 0; i < 4; i++) D.cloud(c, 80 + i * 200, ((i * 90 + (HEIGHT - S.y) * 0.8) % 260) + 20, 0.8);
        const px = W / 2;
        if (S.open > 0) { const r = 24 + g.p.D * 8 * S.open; c.beginPath(); c.arc(px, y - 52, r, Math.PI, 0); c.fillStyle = '#FF4757'; c.fill(); c.lineWidth = 3; c.strokeStyle = D.INK; c.stroke(); D.line(c, px - r, y - 52, px, y - 14, D.INK, 2); D.line(c, px + r, y - 52, px, y - 14, D.INK, 2); }
        D.emoji(c, S.st === 'done' && S.v > 7 ? '😵' : '🧑‍🚀', px, y, 40);
        D.tag(c, FK.n(Math.max(0, S.y), 0) + ' m', 70, 30, '#fff', { size: 16 });
      }
    });
  });

  /* ---------- Globo aerostático ---------- */
  FK.sim('globo-aire', function (g) {
    const ctx = g.canvas(1.8);
    g.slider('T', { label: 'Temperatura del aire del globo', icon: '🔥', min: 20, max: 120, step: 1, value: 20, unit: '°C', fmt: (v) => FK.n(v, 0) });
    g.out('E', 'Empuje neto', { icon: '⬆️', hl: true }); g.out('h', 'Altura', { icon: '📏' });
    const S = { y: 0, v: 0, Tin: 20 };
    const VOL = 2800, MASS = 500;
    g.run({
      init() { S.y = 0; S.v = 0; S.Tin = 20; g.say('El aire de afuera está a 20 °C. ¡Calienta el aire del globo!'); },
      step(dt) {
        S.Tin += (g.p.T - S.Tin) * Math.min(1, dt * 0.5);
        const net = C.balloonNet(VOL, MASS, 20, S.Tin);
        g.show('E', FK.n(net / 1000, 1) + ' kN ' + (net > 0 ? '⬆️' : '⬇️')); g.show('h', FK.n(S.y, 0) + ' m');
        const target = M.clamp(net / 1500, -6, 6);
        if (S.y <= 0 && net < 0) { S.v = 0; S.y = 0; } else { S.v += (target - S.v) * Math.min(1, dt * 0.6); S.y = Math.max(0, S.y + S.v * dt * 1.8); }
        if (S.y >= 200 && !S.said) { S.said = true; g.win('¡Llegaste a 200 m! El aire caliente es más liviano que el aire frío.'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#5BA8E8', '#FFE9C7');
        D.ground(c, W, H - 40, H, '#7ED957', '#B9824A');
        const gy = H - 40, off = (S.y / 200) * 200, by = gy - 120 - Math.min(off, 230);
        for (let i = 0; i < 4; i++) D.cloud(c, 60 + i * 210, ((i * 70 + S.y * 0.9) % 330) + 20, 0.9);
        const x = W / 2 + 100, hot = M.clamp((S.Tin - 20) / 100, 0, 1);
        c.beginPath(); c.ellipse(x, by - 20, 70, 86, 0, 0, M.TAU); c.fillStyle = D.heat(0.55 + hot * 0.45); c.fill(); c.lineWidth = 4; c.strokeStyle = D.INK; c.stroke();
        for (let i = -2; i <= 2; i++) D.line(c, x + i * 14, by - 104, x + i * 14, by - 20 + 80, 'rgba(255,255,255,.35)', 2);
        D.line(c, x - 38, by + 52, x - 16, by + 90, D.INK, 3); D.line(c, x + 38, by + 52, x + 16, by + 90, D.INK, 3);
        D.box(c, x - 22, by + 88, 44, 30, '#C98A3F', { r: 6 }); D.emoji(c, '🐕', x, by + 82, 30);
        if (S.Tin > 40) D.emoji(c, '🔥', x, by + 62, 18 + hot * 24);
        D.text(c, 'Altura: ' + FK.n(S.y, 0) + ' m', 20, 30, { size: 22, weight: 700 }); D.text(c, 'Aire adentro: ' + FK.n(S.Tin, 0) + ' °C', 20, 60, { size: 17 });
        D.char(c, 'cosmo', 100, gy - 50, 90, 'happy');
      }
    });
  });
})();
