/* Capítulo 13 — La presión */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- El tanque con agujero (Torricelli) ---------- */
  FK.sim('chorros', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('y', { label: 'Profundidad del agujero', icon: '🕳️', min: 0.1, max: 0.9, step: 0.05, value: 0.5, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.out('v', 'Rapidez del chorro', { icon: '💨' }); g.out('x', 'Distancia del chorro', { icon: '📏', hl: true }); g.out('h', 'Aciertos', { icon: '⭐' });
    const TAB = 0.5, LVL = 1, PX = 230; /* mesa de 0,5 m, agua a 1 m, 230 px por m */
    const S = { cup: 1, hits: 0, said: false, t: 0 };
    const newCup = () => { S.cup = Math.round(M.rnd(0.4, 1.4) * 20) / 20; g.goal(`La taza está a ${FK.n(S.cup, 2)} m del tanque. Escoge la profundidad del agujero.`); };
    g.run({
      init() { if (!S.hits) S.hits = 0; newCup(); S.said = false; S.t = 0; g.say('Con una profundidad adecuada, el chorro cae justo dentro de la taza.'); },
      step(dt) {
        const y = g.p.y, v = Math.sqrt(2 * 9.8 * y), x = C.jetRange(y, TAB, LVL);
        g.show('v', FK.n(v, 2) + ' m/s'); g.show('x', FK.n(x, 2) + ' m'); g.show('h', S.hits + ' de 2');
        if (Math.abs(x - S.cup) <= 0.05) { S.t += dt; if (S.t > 1.2) { S.t = 0; S.hits++; FK.sfx.ok(); if (S.hits >= 2) { g.win('¡Dos tazas llenas! Calculaste bien la presión.'); S.hits = 0; } else g.say('¡En la taza! Aparece otra taza.', 'wow'); newCup(); } } else S.t = 0;
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E6F4FF', '#F8FCFF'); D.ground(c, W, H - 40, H, '#C9C9D9', '#9A9AB5');
        const gy = H - 40, tx = 130, tw = 130, tt = gy - (TAB + LVL) * PX;
        D.box(c, tx - 20, gy - TAB * PX, tw + 40, TAB * PX, '#A9743B', { r: 6 });
        c.fillStyle = 'rgba(60,160,255,.55)'; c.fillRect(tx, tt, tw, LVL * PX);
        c.beginPath(); c.moveTo(tx, tt - 20); c.lineTo(tx, gy - TAB * PX); c.lineTo(tx + tw, gy - TAB * PX); c.lineTo(tx + tw, tt - 20); c.strokeStyle = D.INK; c.lineWidth = 5; c.stroke();
        D.line(c, tx, tt, tx + tw, tt, 'rgba(255,255,255,.9)', 3);
        const y = g.p.y, hy = tt + y * PX, v = Math.sqrt(2 * 9.8 * y);
        D.circle(c, tx + tw, hy, 6, '#2B2350');
        /* chorro: parábola */
        c.beginPath(); c.moveTo(tx + tw, hy);
        const hh = (TAB + LVL - y); const tf = Math.sqrt(2 * hh / 9.8);
        for (let t = 0; t <= tf; t += tf / 30) c.lineTo(tx + tw + v * t * PX, hy + 0.5 * 9.8 * t * t * PX);
        c.strokeStyle = 'rgba(60,160,255,.9)'; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
        /* taza */
        const cx = tx + tw + S.cup * PX; D.poly(c, [[cx - 22, gy - 34], [cx + 22, gy - 34], [cx + 16, gy], [cx - 16, gy]], '#FFC21A', D.INK, 3);
        D.text(c, '🥤 taza', cx, gy - 46, { size: 14, align: 'center' });
        for (let m = 0; m <= 2; m += 0.5) { D.line(c, tx + tw + m * PX, gy, tx + tw + m * PX, gy + 8, D.INK, 2); D.text(c, m + ' m', tx + tw + m * PX, gy + 22, { size: 11, align: 'center' }); }
        D.char(c, 'gotin', W - 80, 100, 90, 'happy');
        D.tag(c, 'agujero a ' + FK.n(y, 2) + ' m', tx + tw + 10, hy - 20, '#fff', { size: 13, align: 'left' });
      }
    });
  });

  /* ---------- Buzo y globo ---------- */
  FK.sim('buzo', function (g) {
    const ctx = g.canvas(1.9);
    g.slider('d', { label: 'Profundidad', icon: '🤿', min: 0, max: 50, step: 1, value: 0, unit: 'm', fmt: (v) => FK.n(v, 0) });
    g.out('P', 'Presión', { icon: '🗜️', hl: true }); g.out('V', 'Tamaño del globo', { icon: '🎈' });
    g.run({
      static: true,
      init() { g.say('Baja la profundidad poco a poco y mira cómo cambia la presión y el globo que lleva el buzo.'); },
      draw(c, W, H) {
        const d = g.p.d, P = C.waterPressure(d), V = 1 / P;
        g.show('P', FK.n(P, 2) + ' atm'); g.show('V', FK.n(V * 100, 0) + ' % del original');
        if (d >= 30 && !g.won()) g.win('¡A 30 m hay 4 atmósferas! El globo se redujo a la cuarta parte.');
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF');
        const wl = 70; c.fillStyle = 'rgba(30,136,255,0.6)'; const grad = c.createLinearGradient(0, wl, 0, H); grad.addColorStop(0, '#5BB8FF'); grad.addColorStop(1, '#0B3A8C'); c.fillStyle = grad; c.fillRect(0, wl, W, H - wl);
        D.line(c, 0, wl, W, wl, 'rgba(255,255,255,.9)', 3);
        const by = wl + (d / 50) * (H - wl - 60) + 20;
        for (let m = 0; m <= 50; m += 10) { const yy = wl + (m / 50) * (H - wl - 60) + 20; D.line(c, 20, yy, 40, yy, '#fff', 2); D.text(c, m + ' m', 48, yy, { size: 13, color: '#fff' }); }
        D.emoji(c, '🤿', 400, by, 70);
        const r = 14 + 36 * Math.cbrt(V); D.circle(c, 470, by - 6, r, '#FF4757', D.INK, 3); D.circle(c, 470 - r * 0.3, by - 6 - r * 0.3, r * 0.2, 'rgba(255,255,255,.7)');
        D.text(c, '🎈 globo', 470, by + r + 16, { size: 14, align: 'center', color: '#fff' });
        D.char(c, 'gotin', 700, 120, 90, d >= 30 ? 'wow' : 'happy');
        D.tag(c, 'Presión: ' + FK.n(P, 2) + ' atmósferas', W - 150, 30, '#FFF1B8', { size: 15 });
      }
    });
  });

  /* ---------- Altura y presión del aire ---------- */
  const PLACES = [['Nivel del mar', 0, '🏖️'], ['Cali', 1000, '🌆'], ['Popayán', 1738, '🏛️'], ['Bogotá', 2640, '🏙️'], ['Nevado del Ruiz', 5321, '🌋'], ['Monte Everest', 8849, '🏔️']];
  FK.sim('altura-presion', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('h', { label: 'Altura sobre el mar', icon: '⛰️', min: 0, max: 9000, step: 50, value: 0, unit: 'm', fmt: (v) => FK.int(v) });
    g.out('P', 'Presión del aire', { icon: '🌬️', hl: true }); g.out('T', 'El agua hierve a', { icon: '♨️' }); g.out('c', 'Lugares visitados', { icon: '📍' });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Sube con la barra. ¡Visita Popayán, Bogotá y la cima del Everest!'); },
      draw(c, W, H) {
        const h = g.p.h, P = C.airPressure(h), T = C.boilingPoint(P);
        g.show('P', FK.n(P / 101.325, 2) + ' atm (' + FK.n(P, 0) + ' kPa)'); g.show('T', FK.n(T, 1) + ' °C');
        PLACES.forEach((q, i) => { if (Math.abs(q[1] - h) <= 100 && !seen.has(i)) { seen.add(i); FK.sfx.pop(); g.say(`${q[2]} ${q[0]} (${FK.int(q[1])} m): aquí el agua hierve a ${FK.n(C.boilingPoint(C.airPressure(q[1])), 1)} °C.`, 'wow'); } });
        g.show('c', seen.size + ' de ' + PLACES.length);
        if (seen.has(2) && seen.has(3) && seen.has(5) && !g.won()) g.win('¡Visitaste Popayán, Bogotá y el Everest! Mientras más alto, menos presión y el agua hierve antes.');
        D.sky(c, W, H, h > 6000 ? '#3B5BD9' : '#8FD3FF', h > 6000 ? '#A9C4FF' : '#E8F8FF');
        const gy = H - 20, GX = (t) => 40 + t * 600, GY = (t) => gy - 8 - t * 300;
        c.beginPath(); c.moveTo(0, gy); c.lineTo(0, GY(0));
        PLACES.forEach((q) => c.lineTo(GX(q[1] / 8849), GY(q[1] / 8849)));
        c.lineTo(740, GY(0.55)); c.lineTo(W, GY(0.2)); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fillStyle = '#7B8AA8'; c.fill(); c.lineWidth = 4; c.strokeStyle = D.INK; c.lineJoin = 'round'; c.stroke();
        PLACES.forEach((q, i) => { const t = q[1] / 8849; D.circle(c, GX(t), GY(t), 6, '#FFC21A', D.INK, 2); D.text(c, q[0], GX(t) - (i === 5 ? 60 : 0), GY(t) - 16 - (i === 1 ? 12 : 0), { size: 11, align: 'center' }); });
        const t = h / 8849, px = GX(t), py = GY(t);
        D.emoji(c, '🧗', px, py - 24, 44);
        /* medidor de presión */
        D.bar(c, 30, 30, 200, 22, P / 101.325, '#8E5CF6', FK.n(P / 101.325, 2) + ' atm', { ink: '#fff' });
        D.emoji(c, '🍲', 100, 90, 40); D.tag(c, FK.n(T, 1) + ' °C', 190, 90, '#FFD6E3', { size: 16 });
      }
    });
  });
})();
