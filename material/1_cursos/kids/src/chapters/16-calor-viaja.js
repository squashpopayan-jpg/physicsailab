/* Capítulo 16 — El calor viaja */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Conducción: cucharas ---------- */
  const BARS = [['Aluminio', 1.0, '#C9D2E8'], ['Acero', 0.12, '#9AA3BC'], ['Vidrio', 0.012, '#BFE9F2'], ['Madera', 0.0015, '#C98A3F']];
  FK.sim('conduccion', function (g) {
    const ctx = g.canvas(2.1);
    g.choice('vel', { label: 'Velocidad del tiempo', icon: '⏩', options: [[1, 'Normal'], [4, 'Rápido'], [16, 'Muy rápido']], value: 4, onchange: (v) => { g.speed = v; } });
    g.button('🔥 Encender la llama', () => { S.on = true; FK.sfx.pop(); }, { kind: 'primary' });
    g.out('c', 'Bolitas caídas', { icon: '🧈', hl: true });
    const N = 30, BEAD = 24, S = { T: BARS.map(() => new Array(N).fill(0)), on: false, fell: BARS.map(() => null), drop: BARS.map(() => 0), t: 0, n: 0 };
    g.speed = 4;
    g.run({
      init() { S.T = BARS.map(() => new Array(N).fill(0)); S.on = false; S.fell = BARS.map(() => null); S.drop = BARS.map(() => 0); S.t = 0; g.show('c', '0'); g.say('Enciende la llama y mira cómo viaja el calor por cada cuchara.'); },
      step(dt) {
        if (!S.on) return;
        S.t += dt;
        const sub = Math.max(1, Math.round(dt * 60 * 6));
        for (let s = 0; s < sub; s++) BARS.forEach((b, i) => {
          const T = S.T[i], r = 0.45 * b[1], T0 = T.slice(); T[0] = 1;
          for (let k = 1; k < N - 1; k++) T[k] = T0[k] + r * (T0[k + 1] - 2 * T0[k] + (k === 1 ? 1 : T0[k - 1]));
          T[N - 1] = T[N - 2];
        });
        let n = 0;
        BARS.forEach((b, i) => { if (S.fell[i] === null && S.T[i][BEAD] > 0.22) { S.fell[i] = S.t; FK.sfx.tick(); } if (S.fell[i] !== null) { n++; S.drop[i] += dt * 400 * Math.min(1, (S.t - S.fell[i]) + 0.2); } });
        g.show('c', n + ' de 4');
        if (n >= 2 && !S.said) { S.said = true; g.win('¡Dos bolitas cayeron! Los metales conducen mucho mejor el calor que el vidrio y la madera.'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const x0 = 150, cw = 18, bh = 36, y0 = 40;
        BARS.forEach((b, i) => {
          const y = y0 + i * 80;
          D.text(c, b[0], 14, y + bh / 2, { size: 16, weight: 700 });
          for (let k = 0; k < N; k++) { c.fillStyle = D.heat(Math.min(1, S.T[i][k] * 1.05)); c.fillRect(x0 + k * cw, y, cw + 1, bh); }
          c.lineWidth = 3; c.strokeStyle = D.INK; D.rr(c, x0, y, N * cw, bh, 8); c.stroke();
          const bx = x0 + BEAD * cw + cw / 2, by = y - 12 + Math.min(S.drop[i], 400);
          if (by < H + 20) D.emoji(c, '🧈', bx, by, 26);
          if (S.fell[i] !== null) D.tag(c, 'cayó de ' + (S.fell.filter((q) => q !== null && q <= S.fell[i]).length) + '.º', bx + 20, y + bh + 14, '#B8F2D0', { size: 12 });
          if (b[0] === 'Madera' && S.t > 8 && S.fell[i] === null) D.tag(c, 'no cae…', bx + 20, y + bh + 14, '#FFC7CD', { size: 12 });
        });
        D.emoji(c, S.on ? '🔥' : '🕯️', 110, y0 + 150, 56);
        D.text(c, 'llama', 100, y0 + 190, { size: 13, align: 'center' });
      }
    });
  });

  /* ---------- Convección ---------- */
  FK.sim('conveccion', function (g) {
    const ctx = g.canvas(1.9);
    g.slider('f', { label: 'Fuego', icon: '🔥', min: 0, max: 100, step: 5, value: 20, unit: '%', fmt: (v) => FK.n(v, 0) });
    g.out('t', 'Tiempo con fuego fuerte', { icon: '⏱️', hl: true });
    const NP = 150;
    const P = Array.from({ length: NP }, () => ({ x: Math.random(), y: Math.random(), T: 0.2 }));
    const S = { hold: 0 };
    g.run({
      init() { S.hold = 0; P.forEach((p) => { p.x = Math.random(); p.y = Math.random(); p.T = 0.2; }); g.say('Sube el fuego a más del 70 % y mira las corrientes durante unos 8 segundos.'); },
      step(dt) {
        const f = g.p.f / 100, A = 0.045 * f;
        P.forEach((p) => {
          const u = A * Math.PI * Math.sin(2 * Math.PI * p.x) * Math.cos(Math.PI * p.y) * 6, v = -A * 2 * Math.PI * Math.cos(2 * Math.PI * p.x) * Math.sin(Math.PI * p.y) * 6;
          p.x += u * dt + (Math.random() - 0.5) * 0.006; p.y += v * dt + (Math.random() - 0.5) * 0.006;
          if (p.x < 0.01) p.x = 0.01; if (p.x > 0.99) p.x = 0.99;
          if (p.y < 0.02) { p.y = 0.02; } if (p.y > 0.98) p.y = 0.98;
          const heat = p.y < 0.25 ? f * 1.6 : 0, cool = p.y > 0.75 ? 1.2 : 0;
          p.T = M.clamp(p.T + (heat - cool - (p.T - 0.15) * 0.15) * dt, 0, 1);
        });
        if (f >= 0.7) S.hold += dt; g.show('t', FK.n(S.hold, 1) + ' s');
        if (S.hold >= 8 && !S.said) { S.said = true; g.win('¡Se formaron corrientes de convección! Lo caliente sube y lo frío baja.'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const x0 = 150, w = 500, top = 30, bot = H - 70, hh = bot - top;
        c.fillStyle = 'rgba(100,180,255,.5)'; c.fillRect(x0, top, w, hh);
        c.beginPath(); c.moveTo(x0 - 6, top - 14); c.lineTo(x0 - 6, bot + 8); c.lineTo(x0 + w + 6, bot + 8); c.lineTo(x0 + w + 6, top - 14); c.strokeStyle = D.INK; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke();
        P.forEach((p) => { D.circle(c, x0 + p.x * w, bot - p.y * hh, 6, D.heat(0.05 + p.T * 0.9), 'rgba(43,35,80,.5)', 1); });
        const f = g.p.f / 100;
        for (let i = 0; i < 5; i++) D.emoji(c, f > 0.05 ? '🔥' : '▫️', x0 + 60 + i * 95, bot + 40, 20 + f * 34);
        D.text(c, '↑ sube lo caliente', x0 + w / 2, top + 20, { size: 15, align: 'center', color: '#C0182B', weight: 700 });
        D.char(c, 'flamo', 70, 110, 90, f > 0.6 ? 'wow' : 'happy');
      }
    });
  });

  /* ---------- Camisetas al sol ---------- */
  const SHIRT = [['Blanca', 0.2, '#FFFFFF'], ['Amarilla', 0.45, '#FFD84D'], ['Roja', 0.7, '#FF4757'], ['Negra', 0.95, '#2B2350']];
  FK.sim('radiacion-color', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('min', { label: 'Minutos al sol', icon: '☀️', min: 0, max: 10, step: 0.5, value: 0, unit: 'min', fmt: (v) => FK.n(v, 1) });
    g.button('Pasar 10 minutos', () => g.setSlider('min', 10), { icon: '⏩' });
    g.out('x', 'La más caliente', { icon: '🔥', hl: true });
    g.run({
      static: true,
      init() { g.say('Cuatro camisetas están al sol. Pasa el tiempo y mira cuál se calienta más.'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#8FD3FF', '#E8F8FF'); D.sun(c, W - 70, 60, 30, g.t); D.ground(c, W, H - 40, H, '#7ED957', '#B9824A');
        const t = g.p.min; let best = 0;
        SHIRT.forEach((s, i) => {
          const T = C.shirtTemp(s[1], t), x = 110 + i * 190; if (T > SHIRT[best] && false) best = i;
          D.emoji(c, '👕', x, 160, 110); c.save(); c.globalCompositeOperation = 'source-over'; c.restore();
          D.box(c, x - 40, 110, 80, 70, s[2], { r: 14 });
          D.text(c, s[0], x, 215, { size: 17, align: 'center', weight: 700 });
          D.bar(c, x - 55, 235, 110, 22, (T - 28) / 40, D.heat((T - 28) / 40), FK.n(T, 1) + ' °C', { ink: '#fff' });
          D.tag(c, 'absorbe ' + Math.round(s[1] * 100) + ' %', x, 280, '#fff', { size: 12 });
        });
        const temps = SHIRT.map((s) => C.shirtTemp(s[1], t)); const hi = temps.indexOf(Math.max(...temps));
        g.show('x', t > 0 ? SHIRT[hi][0] + ' · ' + FK.n(temps[hi], 1) + ' °C' : '—');
        if (t >= 10 && !g.won()) g.win('¡La camiseta negra llegó a 61 °C y la blanca a 35 °C! Lo oscuro absorbe más radiación.');
      }
    });
  });
})();
