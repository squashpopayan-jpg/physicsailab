/* Capítulo 18 — Motores de calor y la flecha del tiempo */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Máquina de vapor ---------- */
  FK.sim('maquina-vapor', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('T', { label: 'Temperatura de la caldera', icon: '🔥', min: 100, max: 300, step: 5, value: 120, unit: '°C', fmt: (v) => FK.n(v, 0) });
    g.out('car', 'Límite de Carnot', { icon: '📏' }); g.out('real', 'Convertido en movimiento', { icon: '⚙️', hl: true }); g.out('per', 'Perdido como calor', { icon: '♨️' });
    const S = { ang: 0 };
    g.run({
      init() { S.ang = 0; g.say('El ambiente está a 30 °C. Sube la temperatura de la caldera y mira cuánta energía se aprovecha.'); },
      step(dt) {
        const Th = g.p.T + 273.15, Tc = 303.15, car = C.carnot(Th, Tc), real = 0.6 * car;
        g.show('car', FK.n(car * 100, 0) + ' %'); g.show('real', FK.n(real * 100, 0) + ' %'); g.show('per', FK.n((1 - real) * 100, 0) + ' %');
        S.ang += dt * (2 + real * 22);
        if (real > 0.25 && !g.won()) g.win(`¡Más del 25 %! A ${g.p.T} °C: ${FK.n(real * 100, 0)} % se vuelve movimiento. Pero ni a 300 °C pasa del 28 %.`);
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const Th = g.p.T + 273.15, car = C.carnot(Th, 303.15), real = 0.6 * car, hot = (g.p.T - 100) / 200;
        /* caldera */
        D.box(c, 40, 130, 190, 140, D.heat(0.55 + hot * 0.4), { r: 22 });
        D.emoji(c, '🔥', 90, 300, 40); D.emoji(c, '🔥', 135, 300, 46); D.emoji(c, '🔥', 180, 300, 40);
        D.text(c, g.p.T + ' °C', 135, 200, { size: 28, align: 'center', color: '#fff', stroke: 'rgba(43,35,80,.5)', weight: 700 });
        /* tubo y pistón */
        const cx = 400, cy = 160, pistonX = cx + 40 * Math.cos(S.ang) * 0 + 24 + (1 - Math.cos(S.ang)) * 18;
        D.line(c, 230, 180, 330, 180, '#9A9AB5', 10);
        D.box(c, 330, 130, 160, 100, '#C9D2E8', { r: 8 }); D.box(c, 335 + (1 - Math.cos(S.ang)) * 30, 138, 40, 84, '#7B7A99', { r: 6 });
        const wx = 620, wy = 230; D.circle(c, wx, wy, 70, '#FFC21A', D.INK, 5);
        for (let i = 0; i < 6; i++) { const a = S.ang + (i * M.TAU) / 6; D.line(c, wx, wy, wx + 66 * Math.cos(a), wy + 66 * Math.sin(a), D.INK, 3); }
        D.circle(c, wx, wy, 10, D.INK);
        const pa = wx + 40 * Math.cos(S.ang), pb = wy + 40 * Math.sin(S.ang);
        D.line(c, 375 + (1 - Math.cos(S.ang)) * 30, 180, pa, pb, '#7B7A99', 7);
        D.char(c, 'flamo', 80, 60, 70, 'wink');
        /* barras de energía */
        D.bar(c, 270, 290, 300, 26, 1, '#FF8A1F', 'energía del fuego: 100 %', { ink: '#fff' });
        D.bar(c, 270, 324, 300, 26, real, '#12B76A', 'movimiento: ' + FK.n(real * 100, 0) + ' %', { ink: '#2B2350' });
        c.fillStyle = 'rgba(0,0,0,0)';
        D.text(c, '♨️ calor perdido: ' + FK.n((1 - real) * 100, 0) + ' %', 420, 368, { size: 16, align: 'center', color: '#C0182B', weight: 700 });
      }
    });
  });

  /* ---------- Entropía: urna de Ehrenfest ---------- */
  FK.sim('entropia', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('N', { label: 'Número de partículas', icon: '⚛️', min: 2, max: 120, step: 1, value: 4, fmt: (v) => FK.n(v, 0), reset: true });
    g.button('🚪 Abrir la puerta', () => { S.open = true; FK.sfx.pop(); }, { kind: 'primary' });
    g.out('izq', 'En la izquierda', { icon: '⬅️' }); g.out('vec', 'Veces que volvieron a juntarse', { icon: '🔁', hl: true });
    const S = { open: false, pts: [], left: 0, ret: 0, acc: 0, was: true };
    g.run({
      init() {
        S.open = false; S.ret = 0; S.acc = 0; S.was = true; const n = g.p.N; S.pts = [];
        for (let i = 0; i < n; i++) S.pts.push({ side: 0, x: M.rnd(40, 340), y: M.rnd(70, 300), tx: 0, ty: 0 });
        S.pts.forEach((p) => { p.tx = p.x; p.ty = p.y; });
        g.say('Todas las partículas están en la izquierda. Abre la puerta y mira qué pasa.');
      },
      step(dt) {
        const n = S.pts.length;
        if (S.open) {
          S.acc += dt * 14;
          while (S.acc >= 1) {
            S.acc -= 1; const p = S.pts[(Math.random() * n) | 0]; p.side = 1 - p.side;
            p.tx = p.side ? M.rnd(460, 760) : M.rnd(40, 340); p.ty = M.rnd(70, 300);
            const nl = S.pts.filter((q) => q.side === 0).length;
            if (nl === n && !S.was) { S.ret++; FK.sfx.ok(); if (S.ret >= 2 && n <= 6 && !g.won()) g.win('¡Volvieron a juntarse solas! Con pocas partículas pasa. Ahora prueba con 100: ¡nunca ocurrirá!'); }
            S.was = nl === n;
          }
        }
        S.pts.forEach((p) => { p.x += (p.tx - p.x) * Math.min(1, dt * 6); p.y += (p.ty - p.y) * Math.min(1, dt * 6); if (Math.random() < dt * 2) { p.ty = M.clamp(p.ty + M.rnd(-40, 40), 70, 300); p.tx = M.clamp(p.tx + M.rnd(-40, 40), p.side ? 460 : 40, p.side ? 760 : 340); } });
        const nl = S.pts.filter((q) => q.side === 0).length; g.show('izq', nl + ' de ' + n); g.show('vec', S.ret);
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        D.box(c, 20, 50, W - 40, 270, '#fff', { r: 14, lw: 5 });
        if (!S.open) D.line(c, W / 2, 50, W / 2, 320, D.INK, 8); else D.line(c, W / 2, 50, W / 2, 110, D.INK, 8);
        S.pts.forEach((p) => D.circle(c, p.x, p.y, S.pts.length > 60 ? 6 : 10, p.side ? '#1E88FF' : '#FF4757', D.INK, 2));
        D.text(c, S.open ? '🚪 puerta abierta' : '🚪 puerta cerrada', W / 2, 30, { size: 18, align: 'center', weight: 700 });
      }
    });
  });
})();
