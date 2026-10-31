/* Capítulo 6 — Las leyes de Newton */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Tira y afloja ---------- */
  FK.sim('tira-afloja', function (g) {
    const ctx = g.canvas(2.6);
    g.slider('izq', { label: 'Niños a la izquierda', icon: '⬅️', min: 0, max: 10, step: 1, value: 3, fmt: (v) => v + ' 🧒' });
    g.slider('der', { label: 'Niños a la derecha', icon: '➡️', min: 0, max: 10, step: 1, value: 3, fmt: (v) => v + ' 🧒' });
    g.toggle('ele', { label: '🐘 Añadir un elefante a la derecha (600 N)', value: false, onchange: () => { s.hold = 0; } });
    g.out('fi', 'Fuerza izquierda', { icon: '⬅️' }); g.out('fd', 'Fuerza derecha', { icon: '➡️' }); g.out('fn', 'Fuerza neta', { icon: '⚖️', hl: true });
    const KID = 100; /* newtons por niño */
    const s = { pos: 0, hold: 0, won: false, end: 0 };
    g.run({
      init() { s.pos = 0; s.hold = 0; s.end = 0; g.say('Cada niño tira con 100 N. El elefante, con 600 N. ¡Haz que la cuerda no se mueva!'); },
      step(dt) {
        const fl = g.p.izq * KID, fr = g.p.der * KID + (g.p.ele ? 600 : 0), net = fr - fl;
        if (s.end > 0) { s.end -= dt; if (s.end <= 0) { s.pos = 0; } return; }
        s.pos += (net / 1200) * dt * 0.55;
        if (Math.abs(net) < 1 && fl >= 300) {
          s.hold += dt;
          if (s.hold > 2 && g.p.ele && !s.won) { s.won = true; g.win('¡Equilibrio! 6 niños tienen la misma fuerza que un elefante.'); }
          else if (s.hold > 2 && !g.p.ele && !s.said) { s.said = true; g.say('¡Equilibrio! Las fuerzas son iguales y la cuerda no se mueve. Ahora prueba con el elefante.', 'happy'); }
        } else { s.hold = 0; s.said = false; }
        if (Math.abs(s.pos) >= 1) { s.pos = Math.sign(s.pos); s.end = 1.5; g.say(s.pos > 0 ? '¡Ganó el lado derecho! Prueba otra combinación.' : '¡Ganó el lado izquierdo! Prueba otra combinación.', 'wow'); }
        g.show('fi', fl + ' N'); g.show('fd', fr + ' N'); g.show('fn', (net === 0 ? '0 N ⚖️' : Math.abs(net) + ' N ' + (net > 0 ? '➡️' : '⬅️')));
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 70, H, '#7ED957', '#B9824A');
        const gy = H - 70, cx = W / 2 + s.pos * 190;
        D.line(c, 40, gy - 55, W - 40, gy - 55, '#A9743B', 8);
        D.line(c, W / 2, gy + 6, W / 2, gy - 120, '#FF4757', 3, [6, 6]);
        D.poly(c, [[cx, gy - 78], [cx + 14, gy - 68], [cx, gy - 58], [cx - 14, gy - 68]], '#FFC21A', D.INK, 2.5);
        for (let i = 0; i < g.p.izq; i++) D.emoji(c, '🧒', cx - 70 - i * 38, gy - 28, 44, 0, true);
        for (let i = 0; i < g.p.der; i++) D.emoji(c, '🧒', cx + 70 + i * 38, gy - 28, 44);
        if (g.p.ele) D.emoji(c, '🐘', Math.min(W - 60, cx + 70 + g.p.der * 38 + 30), gy - 34, 70);
        const fl = g.p.izq * KID, fr = g.p.der * KID + (g.p.ele ? 600 : 0);
        D.arrow(c, W / 2 - 10, 50, W / 2 - 10 - fl / 10, 50, '#1E88FF', 12); D.arrow(c, W / 2 + 10, 50, W / 2 + 10 + fr / 10, 50, '#FF4757', 12);
        D.text(c, '⬅️ ' + fl + ' N', 24, 26, { size: 18, weight: 700 }); D.text(c, fr + ' N ➡️', W - 24, 26, { size: 18, weight: 700, align: 'right' });
      }
    });
  });

  /* ---------- El carrito de Newti: F = m a ---------- */
  FK.sim('carrito-fma', function (g) {
    const ctx = g.canvas(3);
    g.slider('F', { label: 'Fuerza del empujón', icon: '💪', min: 1, max: 20, step: 1, value: 5, unit: 'N', fmt: (v) => FK.n(v, 0) });
    g.slider('m', { label: 'Masa del carrito', icon: '⚖️', min: 1, max: 10, step: 0.5, value: 2, unit: 'kg', fmt: (v) => FK.n(v, 1) });
    g.button('¡Empujar!', () => { if (!s.run) { s.x = 0; s.v = 0; s.t = 0; s.run = true; s.result = null; FK.sfx.whoosh(); } }, { icon: '🚀' });
    g.out('a', 'Aceleración (F ÷ m)', { icon: '🧮', hl: true }); g.out('t', 'Tiempo', { icon: '⏱️' });
    const s = { x: 0, v: 0, t: 0, run: false, d: 20, T: 4, result: null };
    const newGoal = () => { s.d = M.pick([10, 16, 20]); s.T = M.pick([3, 4, 5, 6]); g.goal(`Llega a la bandera (${s.d} m) en ${s.T} segundos (con 0,3 s de margen).`); };
    g.run({
      init() { s.x = 0; s.v = 0; s.t = 0; s.run = false; s.result = null; newGoal(); g.show('t', '—'); g.say('Piensa: la aceleración que necesitas es 2 × distancia ÷ tiempo². ¡Escoge fuerza y masa!'); },
      step(dt) {
        g.show('a', FK.n(g.p.F / g.p.m, 2) + ' m/s²');
        if (!s.run) return;
        const a = g.p.F / g.p.m;
        s.v += a * dt; s.x += s.v * dt; s.t += dt; g.show('t', FK.n(s.t, 2) + ' s');
        if (s.x >= s.d || s.t > 15) {
          s.run = false;
          if (s.x >= s.d) {
            s.result = s.t;
            if (Math.abs(s.t - s.T) <= 0.3) g.win(`¡Llegó en ${FK.n(s.t, 2)} s! ¡Justo a tiempo!`);
            else g.say(`Llegó en ${FK.n(s.t, 2)} s. ${s.t > s.T ? 'Tardó mucho: aumenta la fuerza o baja la masa.' : 'Fue muy rápido: baja la fuerza o sube la masa.'}`, 'think');
          } else g.say('Se quedó muy lejos. ¡Necesitas más aceleración!', 'sad');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 70, H, '#7ED957', '#B9824A');
        const gy = H - 70, x0 = 60, k = (W - 150) / s.d;
        for (let m = 0; m <= s.d; m += s.d > 12 ? 5 : 2) { D.line(c, x0 + m * k, gy, x0 + m * k, gy + 8, D.INK, 2); D.text(c, m + ' m', x0 + m * k, gy + 24, { size: 12, align: 'center' }); }
        const fx = x0 + s.d * k; D.line(c, fx, gy, fx, gy - 70, D.INK, 4); D.poly(c, [[fx, gy - 70], [fx + 32, gy - 58], [fx, gy - 46]], '#FF4757', D.INK, 2.5);
        const w = 40 + g.p.m * 5, h = 26 + g.p.m * 2, x = x0 + s.x * k;
        D.box(c, x - w / 2, gy - h - 12, w, h, '#FF8A1F', { r: 8 }); D.circle(c, x - w / 3, gy - 8, 10, '#2B2350'); D.circle(c, x + w / 3, gy - 8, 10, '#2B2350');
        D.text(c, FK.n(g.p.m, 1) + ' kg', x, gy - h / 2 - 12, { size: 14, align: 'center', color: '#fff' });
        D.arrow(c, x - w / 2 - 62 - g.p.F * 2, gy - h / 2 - 12, x - w / 2 - 4, gy - h / 2 - 12, '#1E88FF', 8);
        D.emoji(c, '🐱', x - w / 2 - 74 - g.p.F * 2, gy - h / 2 - 12, 36, 0, true);
        D.tag(c, FK.n(g.p.F, 0) + ' N', x - w / 2 - 36 - g.p.F, gy - h / 2 - 42, '#fff', { size: 14 });
      }
    });
  });

  /* ---------- Lanzar una bola desde un monopatín ---------- */
  FK.sim('skate-retroceso', function (g) {
    const ctx = g.canvas(3);
    const MAS = 33; /* Newti + monopatín (kg) */
    g.slider('mb', { label: 'Masa de la bola', icon: '🏐', min: 1, max: 10, step: 1, value: 4, unit: 'kg', fmt: (v) => FK.n(v, 0) });
    g.slider('w', { label: 'Rapidez del lanzamiento', icon: '💨', min: 1, max: 10, step: 0.5, value: 4, unit: 'm/s', fmt: (v) => FK.n(v, 1) });
    g.button('¡Lanzar!', () => { if (!s.thrown) { s.thrown = true; s.v = C.recoil(MAS, g.p.mb, g.p.w); s.ub = g.p.w - s.v; FK.sfx.pop(); g.show('r', FK.n(s.v, 2) + ' m/s'); if (s.v >= 1) g.win(`¡Retrocedió a ${FK.n(s.v, 2)} m/s! La bola lo empujó a él.`); else g.say(`Retrocedió ${FK.n(s.v, 2)} m/s. ¡Prueba una bola más pesada o un lanzamiento más rápido!`, 'think'); } }, { icon: '🏐' });
    g.out('r', 'Retroceso de Newti', { icon: '⬅️', hl: true }); g.out('p', 'Misma «fuerza»', { icon: '↔️' });
    const s = { thrown: false, x: 0, v: 0, ub: 0, bx: 0 };
    g.run({
      init() { s.thrown = false; s.x = 0; s.v = 0; s.bx = 0; g.show('r', '—'); g.show('p', 'acción = reacción'); g.say('Newti lanza la bola hacia la derecha. ¿Qué le pasará a él?'); },
      step(dt) { if (s.thrown) { s.x -= s.v * dt * 60; s.bx += s.ub * dt * 60; if (s.x < -2000) s.x = -2000; } },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 60, H, '#C9C9D9', '#9A9AB5');
        const gy = H - 60, cx = 440 + (s.x % 2000) * 0.4;
        const x = Math.max(90, Math.min(W - 160, 440 + s.x * 0.5));
        D.box(c, x - 40, gy - 14, 80, 10, '#8E5CF6', { r: 5 }); D.circle(c, x - 26, gy - 4, 8, D.INK); D.circle(c, x + 26, gy - 4, 8, D.INK);
        D.char(c, 'newti', x, gy - 60, 90, s.thrown ? 'wow' : 'happy');
        const bx = s.thrown ? x + 40 + s.bx * 0.4 : x + 40;
        if (bx < W + 40) { const r = 10 + g.p.mb * 1.6; D.circle(c, bx, gy - 66, r, '#FF4757', D.INK, 3); }
        if (s.thrown) { D.arrow(c, x - 56, gy - 60, x - 56 - 18 - s.v * 40, gy - 60, '#1E88FF', 8); D.arrow(c, x + 60, gy - 100, x + 60 + 20 + s.ub * 18, gy - 100, '#FF4757', 8); }
        D.text(c, 'masa de Newti y el monopatín: 33 kg', 20, 24, { size: 15 });
      }
    });
  });
})();
