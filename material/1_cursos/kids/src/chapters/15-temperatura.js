/* Capítulo 15 — Temperatura y calor */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Termómetro triple ---------- */
  FK.sim('termometros', function (g) {
    const ctx = g.canvas(2);
    g.slider('c', { label: 'Temperatura', icon: '🌡️', min: -50, max: 120, step: 1, value: 20, unit: '°C', fmt: (v) => FK.n(v, 0) });
    g.out('C', 'Celsius', { icon: '🌡️' }); g.out('F', 'Fahrenheit', { icon: '🌡️' }); g.out('K', 'Kelvin', { icon: '🔬' });
    const KEY = [[100, 'El agua hierve', '♨️'], [0, 'El agua se congela', '🧊'], [37, 'Tu cuerpo', '🧍'], [-40, '°C = °F', '🤯']];
    const got = new Set();
    g.run({
      static: true,
      init() { got.clear(); g.say('Busca estas 4 temperaturas: el agua que hierve, el hielo, tu cuerpo y la que es igual en °C y °F.'); },
      draw(c, W, H) {
        const T = g.p.c;
        g.show('C', FK.n(T, 0) + ' °C'); g.show('F', FK.n(C.c2f(T), 1) + ' °F'); g.show('K', FK.n(C.c2k(T), 1) + ' K');
        KEY.forEach((k, i) => { if (Math.abs(T - k[0]) <= 1 && !got.has(i)) { got.add(i); FK.sfx.ok(); g.say(`${k[2]} ¡Encontraste «${k[1]}»! (${k[0]} °C = ${FK.n(C.c2f(k[0]), 1)} °F)`, 'wow'); if (got.size >= 3 && !g.won()) g.win('¡Muy bien! Ya sabes leer las tres escalas.'); } });
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const x = 150, y0 = 50, y1 = H - 50, Y = (t) => y1 - ((t + 50) / 170) * (y1 - y0);
        D.box(c, x - 14, y0 - 10, 28, y1 - y0 + 40, '#fff', { r: 14 }); D.circle(c, x, y1 + 30, 26, '#FF4757', D.INK, 4);
        c.fillStyle = '#FF4757'; c.fillRect(x - 8, Y(T), 16, y1 - Y(T) + 20);
        for (let t = -50; t <= 120; t += 10) { D.line(c, x + 14, Y(t), x + (t % 50 === 0 ? 34 : 24), Y(t), D.INK, 2); if (t % 50 === 0 || t === 100) D.text(c, t + ' °C', x + 40, Y(t), { size: 14 }); }
        D.text(c, '🌡️', 50, 40, { size: 28 });
        /* lugares */
        const items = [[-40, '🥶', 'el congelador de un lugar muy frío'], [0, '🧊', 'hielo'], [20, '🏠', 'una casa'], [37, '🧍', 'cuerpo humano'], [60, '☕', 'café'], [100, '♨️', 'agua hirviendo']];
        items.forEach((it) => { D.emoji(c, it[1], 420, Y(it[0]), 30); D.line(c, x + 14, Y(it[0]), 400, Y(it[0]), 'rgba(43,35,80,.15)', 2, [4, 6]); D.text(c, it[2], 446, Y(it[0]), { size: 14 }); });
        D.poly(c, [[x + 70, Y(T)], [x + 90, Y(T) - 10], [x + 90, Y(T) + 10]], '#8E5CF6', D.INK, 2);
        KEY.forEach((k, i) => D.tag(c, (got.has(i) ? '✅ ' : '⬜ ') + k[1], 620, 40 + i * 34, got.has(i) ? '#B8F2D0' : '#fff', { size: 13 }));
      }
    });
  });

  /* ---------- Mezcla de aguas ---------- */
  FK.sim('mezcla-aguas', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('mh', { label: 'Agua caliente (80 °C)', icon: '♨️', min: 0, max: 500, step: 25, value: 200, unit: 'mL', fmt: (v) => FK.n(v, 0) });
    g.slider('mc', { label: 'Agua fría (10 °C)', icon: '🧊', min: 0, max: 500, step: 25, value: 200, unit: 'mL', fmt: (v) => FK.n(v, 0) });
    g.button('¡Mezclar!', () => { if (S.st === 'ready' && g.p.mh + g.p.mc > 0) { S.st = 'mix'; S.t = 0; FK.sfx.pop(); } }, { icon: '🥄' });
    g.out('T', 'Temperatura final', { icon: '🌡️', hl: true }); g.out('goal', 'Meta', { icon: '🎯' });
    const S = { st: 'ready', t: 0, target: 40, Tf: 0, fill: 0 };
    const newTarget = () => { S.target = M.pick([30, 35, 40, 45, 50, 55, 60]); g.show('goal', S.target + ' °C ± 2'); g.goal(`Consigue una mezcla a ${S.target} °C (puede variar 2 grados). La cantidad total no importa.`); };
    g.run({
      init() { S.st = 'ready'; S.t = 0; newTarget(); g.show('T', '—'); g.say('Elige cuánta agua caliente y fría pones en la jarra, y mezcla.'); },
      step(dt) {
        if (S.st !== 'mix') return;
        S.t += dt; S.fill = Math.min(1, S.t / 1.2);
        if (S.t > 1.5) {
          S.st = 'done'; S.Tf = C.mixTemp(g.p.mh, 80, g.p.mc, 10); g.show('T', FK.n(S.Tf, 1) + ' °C');
          if (Math.abs(S.Tf - S.target) <= 2) g.win(`¡Quedó a ${FK.n(S.Tf, 1)} °C! Justo lo que pedía el reto.`); else g.say(`Quedó a ${FK.n(S.Tf, 1)} °C. ${S.Tf < S.target ? 'Muy fría: pon más agua caliente.' : 'Muy caliente: pon más agua fría.'}`, 'think');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const cup = (x, vol, col, label) => { const hh = 40 + (vol / 500) * 120; D.poly(c, [[x - 55, 170 + 60], [x + 55, 170 + 60], [x + 48, 170 + 60 - hh - 10], [x - 48, 170 + 60 - hh - 10]], null, null); c.fillStyle = col; c.fillRect(x - 50, 230 - hh, 100, hh); c.beginPath(); c.moveTo(x - 55, 110); c.lineTo(x - 48, 230); c.lineTo(x + 48, 230); c.lineTo(x + 55, 110); c.strokeStyle = D.INK; c.lineWidth = 4; c.stroke(); D.text(c, label, x, 255, { size: 15, align: 'center', weight: 700 }); };
        const hv = S.st === 'ready' ? g.p.mh : g.p.mh * (1 - S.fill), cv = S.st === 'ready' ? g.p.mc : g.p.mc * (1 - S.fill);
        cup(130, hv, '#FF8A6B', g.p.mh + ' mL · 80 °C'); cup(670, cv, '#7FC7FF', g.p.mc + ' mL · 10 °C');
        /* jarra */
        const tot = (g.p.mh + g.p.mc) * (S.st === 'ready' ? 0 : S.fill), hh = (tot / 1000) * 150;
        const col = S.st === 'done' ? D.heat((S.Tf - 10) / 90 * 0.9 + 0.05) : D.heat(0.5);
        c.fillStyle = S.st === 'ready' ? 'rgba(0,0,0,0)' : col; c.fillRect(350, 250 - hh, 100, hh);
        c.beginPath(); c.moveTo(345, 100); c.lineTo(352, 250); c.lineTo(448, 250); c.lineTo(455, 100); c.strokeStyle = D.INK; c.lineWidth = 4; c.stroke();
        D.text(c, 'jarra', 400, 276, { size: 15, align: 'center', weight: 700 });
        if (S.st !== 'ready') { D.arrow(c, 200, 120, 340, 140, '#FF4757', 6); D.arrow(c, 600, 120, 460, 140, '#1E88FF', 6); }
        if (S.st === 'done') D.tag(c, '🌡️ ' + FK.n(S.Tf, 1) + ' °C', 400, 60, '#FFF1B8', { size: 22 });
        D.char(c, 'flamo', 400, H - 50, 70, S.st === 'done' ? 'wow' : 'happy');
      }
    });
  });
})();
