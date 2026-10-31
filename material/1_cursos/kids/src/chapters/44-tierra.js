/* Capítulo 44 — Tierra viva */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Capas de la Tierra ---------- */
  FK.sim('capas-tierra', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('z', { label: 'Profundidad', icon: '⬇️', min: 0, max: 6371, step: 10, value: 0, unit: 'km', fmt: (v) => FK.int(v) });
    g.out('l', 'Capa', { icon: '🌍', hl: true }); g.out('T', 'Temperatura', { icon: '🌡️' }); g.out('P', 'Presión', { icon: '🗜️' });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Baja con la barra. ¡Hay que llegar hasta el centro, a 6371 km!'); },
      draw(c, W, H) {
        const z = g.p.z, ly = C.earthLayer(z), T = C.earthTemp(z), P = C.earthPressure(z);
        g.show('l', ly.name); g.show('T', FK.int(T) + ' °C'); g.show('P', P < 0.0001 ? '1 atm' : FK.int(P * 9869) + ' atm');
        if (!seen.has(ly.id)) { seen.add(ly.id); FK.sfx.pop(); g.say(`${ly.name}: ${ly.msg}`, 'wow'); } if (seen.size >= 4 && !g.won()) g.win('¡Visitaste las cuatro capas, hasta el centro! Cada vez hace más calor y más presión.');
        D.night(c, W, H, 71, 30);
        const cx = 260, cy = H / 2, R = 170, sc = R / 6371;
        D.circle(c, cx, cy, R, '#3D9BFF', '#fff', 3); D.circle(c, cx, cy, R - 4, '#8A5A2B'); D.circle(c, cx, cy, (6371 - 35) * sc, '#FF8A1F'); D.circle(c, cx, cy, 3481 * sc, '#FFD84D'); D.circle(c, cx, cy, 1221 * sc, '#FFF4B0');
        const rp = R * (1 - z / 6371); D.circle(c, cx, cy - rp, 8, '#FF4757', '#fff', 2); D.line(c, cx, cy - R, cx, cy - rp, '#FF4757', 3, [4, 4]);
        /* leyenda de capas */
        const lg = [['Corteza', '#8A5A2B', 0], ['Manto', '#FF8A1F', 35], ['Núcleo externo (líquido)', '#FFD84D', 2890], ['Núcleo interno (sólido)', '#FFF4B0', 5150]]; lg.forEach((l, i) => { D.box(c, 470, 40 + i * 44, 26, 26, l[1], { r: 6 }); D.text(c, l[0], 506, 53 + i * 44, { size: 15, weight: z >= l[2] && (i === 3 || z < lg[i + 1][2]) ? 700 : 500, color: '#fff' }); D.text(c, l[2] ? 'desde ' + FK.int(l[2]) + ' km' : 'desde 0 km', 506, 71 + i * 44, { size: 11, color: '#B9B3E6' }); });
        D.text(c, 'Tú bajas: ' + FK.int(z) + ' km', 470, 250, { size: 18, color: '#FFE066', weight: 700 });
        D.char(c, 'terra', W - 70, H - 60, 80, 'happy');
      }
    });
  });

  /* ---------- Epicentro ---------- */
  const ST = [['Estación A', 130, 100], ['Estación B', 670, 110], ['Estación C', 400, 345]], KMPX = 0.5;
  FK.sim('epicentro', function (g) {
    const ctx = g.canvas(2);
    g.button('Calcular distancia A', () => circ(0), { icon: '📏' }); g.button('Calcular distancia B', () => circ(1), { icon: '📏' }); g.button('Calcular distancia C', () => circ(2), { icon: '📏' });
    g.button('Comprobar (toca el mapa primero)', () => check(), { icon: '✅', kind: 'ghost', newRow: true });
    g.out('a', 'Estación A: S − P', { icon: '⏱️' }); g.out('b', 'Estación B: S − P', { icon: '⏱️' }); g.out('c', 'Estación C: S − P', { icon: '⏱️' });
    const S = { ep: [400, 200], r: [0, 0, 0], guess: null, rev: false };
    const dts = () => ST.map((s) => C.spDelay(Math.hypot(S.ep[0] - s[1], S.ep[1] - s[2]) * KMPX));
    function circ(i) { S.r[i] = C.spDistance(dts()[i]) / KMPX; FK.sfx.pop(); g.say(`Estación ${'ABC'[i]}: ${FK.n(dts()[i], 1)} s × 8,4 = ${FK.n(S.r[i] * KMPX, 0)} km. El epicentro está en el borde de ese círculo.`); }
    g.pointer({ down(x, y) { S.guess = [x, y]; } });
    function check() {
      if (!S.guess) { g.say('Toca en el mapa donde se cruzan los círculos.', 'think'); return; } S.rev = true; const d = Math.hypot(S.guess[0] - S.ep[0], S.guess[1] - S.ep[1]);
      if (S.r.some((r) => !r)) { g.say('Primero calcula las tres distancias para dibujar los círculos.', 'think'); S.rev = false; return; }
      if (d <= 18) g.win(`¡Encontraste el epicentro! Estaba a solo ${FK.n(d * KMPX, 0)} km de tu punto.`); else g.say(`Estaba a ${FK.n(d * KMPX, 0)} km de tu punto. Mira dónde se cruzan los tres círculos y prueba de nuevo.`, 'think');
    }
    g.run({
      init() { S.ep = [M.rnd(260, 540), M.rnd(150, 290)]; S.r = [0, 0, 0]; S.guess = null; S.rev = false; const d = dts(); g.show('a', FK.n(d[0], 1) + ' s'); g.show('b', FK.n(d[1], 1) + ' s'); g.show('c', FK.n(d[2], 1) + ' s'); g.say('Un terremoto sacudió la región. Las tres estaciones midieron cuánto tardó la onda S después de la P.'); },
      static: true,
      draw(c, W, H) {
        D.sky(c, W, H, '#E8F6E0', '#F6FBF0'); D.grid(c, W, H, 50, 'rgba(43,35,80,.1)'); D.text(c, '1 cuadro = 25 km', 12, H - 12, { size: 12 });
        ST.forEach((s, i) => { if (S.r[i]) { D.circle(c, s[1], s[2], S.r[i], null, ['#FF4757', '#1E88FF', '#12B76A'][i], 3); } D.emoji(c, '📡', s[1], s[2], 30); D.text(c, s[0], s[1], s[2] + 26, { size: 13, align: 'center', weight: 700 }); });
        if (S.guess) { D.circle(c, S.guess[0], S.guess[1], 8, '#FFC21A', D.INK, 3); }
        if (S.rev) { D.emoji(c, '💥', S.ep[0], S.ep[1], 36); D.text(c, 'epicentro', S.ep[0], S.ep[1] + 26, { size: 13, align: 'center', weight: 700 }); }
        D.char(c, 'terra', W - 60, H - 50, 70, 'happy');
      }
    });
  });

  /* ---------- Brisa marina ---------- */
  FK.sim('brisa-marina', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('h', { label: 'Hora del día', icon: '🕐', min: 0, max: 24, step: 0.25, value: 14, unit: 'h', fmt: (v) => FK.n(Math.floor(v), 0) + ':' + String(Math.round((v % 1) * 60)).padStart(2, '0') });
    g.button('▶ Dejar correr el día', () => { S.play = !S.play; }, { kind: 'ghost' });
    g.out('t', 'Temperatura: tierra / mar', { icon: '🌡️' }); g.out('w', 'Viento', { icon: '🌬️', hl: true });
    const S = { play: false, day: false, night: false };
    g.run({
      init() { S.play = false; S.day = S.night = false; g.say('Observa a qué hora el viento cambia de sentido.'); },
      step(dt) { if (S.play) { let h = g.p.h + dt * 2; if (h > 24) h -= 24; g.setSlider('h', Math.round(h * 4) / 4); } },
      draw(c, W, H) {
        const h = g.p.h, Tl = C.landTemp(h), Ts = C.seaTemp(h), dT = Tl - Ts;
        g.show('t', FK.n(Tl, 1) + ' °C / ' + FK.n(Ts, 1) + ' °C'); const w = dT > 0.4 ? 'brisa marina (del mar a la tierra)' : dT < -0.4 ? 'brisa terrestre (de la tierra al mar)' : 'calma'; g.show('w', w);
        if (dT > 1) S.day = true; if (dT < -1) S.night = true; if (S.day && S.night && !g.won()) g.win('¡Del mar a la tierra de día y de la tierra al mar de noche! El cambio ocurre cuando las temperaturas se igualan.');
        const night = h < 6 || h > 19; D.sky(c, W, H, night ? '#14123F' : '#7FC7FF', night ? '#3A2E8C' : '#E8F8FF');
        if (!night) D.sun(c, 120 + ((h - 6) / 13) * 560, 70 + Math.abs(h - 12.5) * 6, 26, g.t); else { D.circle(c, 640, 70, 22, '#F1F1E6'); for (let i = 0; i < 30; i++) D.circle(c, (i * 83) % W, (i * 37) % 160, 1.2, '#fff'); }
        const sy = H - 120; c.fillStyle = '#3D9BFF'; c.fillRect(0, sy, 400, 120); c.fillStyle = '#E8C07A'; c.fillRect(400, sy, 400, 120); D.line(c, 400, sy, 400, H, D.INK, 3);
        D.emoji(c, '⛵', 150, sy - 8, 40); D.emoji(c, '🌴', 560, sy - 20, 54); D.emoji(c, '🏠', 700, sy - 18, 50);
        D.text(c, 'mar ' + FK.n(Ts, 0) + '°', 200, H - 14, { size: 16, align: 'center', color: '#fff', weight: 700 }); D.text(c, 'tierra ' + FK.n(Tl, 0) + '°', 600, H - 14, { size: 16, align: 'center', weight: 700 });
        /* viento y convección */
        const k = M.clamp(dT / 5, -1, 1);
        if (Math.abs(k) > 0.05) { for (let i = 0; i < 5; i++) { const t = ((g.t * 0.35 * Math.abs(k) + i * 0.2) % 1); const dir = Math.sign(k); const x = dir > 0 ? 120 + t * 480 : 680 - t * 480; D.arrow(c, x, sy - 30 - (i % 2) * 14, x + dir * 40, sy - 30 - (i % 2) * 14, '#12B76A', 5); const up = Math.sign(k) > 0 ? 540 : 260; D.arrow(c, up + (i - 2) * 12, sy - 60 - t * 80, up + (i - 2) * 12, sy - 90 - t * 80, '#FF8A1F', 3); } D.text(c, dT > 0 ? 'el aire caliente sube sobre la tierra' : 'el aire caliente sube sobre el mar', dT > 0 ? 560 : 260, 150, { size: 13, align: 'center', color: night ? '#fff' : D.INK }); }
        D.char(c, 'terra', 60, 120, 70, 'happy');
      }
    });
  });
})();
