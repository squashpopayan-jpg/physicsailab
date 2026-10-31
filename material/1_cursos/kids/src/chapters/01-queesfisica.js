/* Capítulo 1 — ¿Qué es la física? */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, C = FK.calc;

  /* ---------- Une la pregunta con su rama ---------- */
  FK.sim('une-ramas', function (g) {
    FK.kit.match(g, [
      ['🌈 ¿Por qué sale el arcoíris?', 'Óptica (la luz)'],
      ['⛵ ¿Cómo flota un barco enorme?', 'Fluidos (agua y aire)'],
      ['🍲 ¿Por qué se calienta la sopa?', 'Calor y termodinámica'],
      ['🎸 ¿Cómo suena una guitarra?', 'Ondas y sonido'],
      ['💡 ¿Por qué se prende un bombillo?', 'Electricidad y magnetismo'],
      ['🌟 ¿Cómo nacen las estrellas?', 'Astronomía'],
      ['🏀 ¿Cómo viaja un balón?', 'Mecánica (el movimiento)'],
      ['⚛️ ¿De qué están hechos los átomos?', 'Física del mundo pequeño']
    ], { start: 'Toca una pregunta de la izquierda y luego su rama a la derecha.' });
  });

  /* ---------- Predice y prueba ---------- */
  const OBJ = {
    bola: ['🎳', 'Bola de boliche', 80], mart: ['🔨', 'Martillo', 60], piedra: ['🪨', 'Piedra', 50],
    pluma: ['🪶', 'Pluma', 0.6], hoja: ['📄', 'Hoja de papel', 1.5], globo: ['🎈', 'Globo', 2]
  };
  const HEIGHT = 20; /* metros de caída */
  FK.sim('predice-cae', function (g) {
    const ctx = g.canvas(2);
    const opts = Object.keys(OBJ).map((k) => [k, OBJ[k][1], OBJ[k][0]]);
    g.choice('izq', { label: 'Objeto de la izquierda', icon: '⬅️', options: opts, value: 'bola', reset: true });
    g.choice('der', { label: 'Objeto de la derecha', icon: '➡️', options: opts, value: 'pluma', reset: true });
    g.choice('lugar', { label: 'Lugar', icon: '🌍', options: [['aire', 'Con aire', '🌬️'], ['vacio', 'Sin aire (vacío)', '🌌']], value: 'aire', reset: true });
    g.choice('pred', { label: 'Mi predicción', icon: '🤔', options: [['izq', 'Gana la izquierda', '⬅️'], ['der', 'Gana la derecha', '➡️'], ['igual', 'Llegan juntos', '🤝']], value: 'izq' });
    g.toggle('lenta', { label: 'Cámara lenta', value: false, onchange: (v) => { g.speed = v ? 0.35 : 1; } });
    g.button('¡Soltar!', () => { if (s.state === 'ready') { s.state = 'falling'; FK.sfx.whoosh(); g.say('¡Ahí van!', 'wow'); } }, { icon: '🚀' });
    g.out('tl', 'Tiempo izquierda', { icon: '⏱️' });
    g.out('tr', 'Tiempo derecha', { icon: '⏱️' });
    const s = { state: 'ready', a: null, b: null };
    const mk = (key) => ({ y: 0, v: 0, t: 0, done: false, vt: g.p.lugar === 'vacio' ? Infinity : OBJ[key][2] });
    const finish = () => {
      const dt = s.a.t - s.b.t;
      const res = Math.abs(dt) < 0.06 ? 'igual' : dt < 0 ? 'izq' : 'der';
      s.state = 'done';
      const name = { izq: OBJ[g.p.izq][1], der: OBJ[g.p.der][1] };
      const msg = res === 'igual' ? 'Llegaron juntos.' : `Ganó: ${name[res]}.`;
      if (res === g.p.pred) { g.win('¡Acertaste! ' + msg); } else { FK.sfx.no(); g.say('No era eso. ' + msg + ' ¡Prueba otra vez!', 'think'); }
    };
    g.run({
      init() { s.state = 'ready'; s.a = mk(g.p.izq); s.b = mk(g.p.der); g.show('tl', '—'); g.show('tr', '—'); g.say('Elige una predicción y presiona «¡Soltar!».'); },
      step(dt) {
        if (s.state !== 'falling') return;
        const sub = 8;
        for (let i = 0; i < sub; i++) for (const o of [s.a, s.b]) if (!o.done) {
          const y0 = o.y;
          C.stepFall(o, dt / sub, 9.8, o.vt); o.t += dt / sub;
          if (o.y >= HEIGHT) { o.t -= (dt / sub) * ((o.y - HEIGHT) / (o.y - y0)); o.y = HEIGHT; o.done = true; }
        }
        g.show('tl', FK.n(s.a.t, 2) + ' s'); g.show('tr', FK.n(s.b.t, 2) + ' s');
        if (s.a.done && s.b.done) finish();
      },
      draw(c, W, H) {
        const vac = g.p.lugar === 'vacio';
        if (vac) D.night(c, W, H, 3, 50); else { D.sky(c, W, H, '#8FD3FF', '#E8F8FF'); D.cloud(c, 60, 70, 1); D.cloud(c, 640, 110, 1.2); D.cloud(c, 380, 40, 0.8); }
        const gy = H - 50;
        D.ground(c, W, gy, H, vac ? '#9AA0C8' : '#7ED957', vac ? '#6C719E' : '#B9824A');
        D.text(c, vac ? '🌌 Sin aire' : '🌬️ Con aire', 12, 24, { size: 20, color: vac ? '#fff' : D.INK, weight: 700 });
        const y0 = 70, k = (gy - 40 - y0) / HEIGHT;
        [[s.a, g.p.izq, 230], [s.b, g.p.der, 570]].forEach(([o, key, x]) => {
          D.shadow(c, x, gy + 2, 34);
          D.emoji(c, OBJ[key][0], x + Math.sin(o.t * 6) * (o.vt < 5 && o.y > 0 && !o.done ? 10 : 0), y0 + o.y * k, 58, o.vt < 5 && !o.done ? Math.sin(o.t * 5) * 0.4 : 0);
          D.tag(c, OBJ[key][1], x, gy + 28, '#fff', { size: 15 });
          if (o.done) D.text(c, FK.n(o.t, 2) + ' s', x, gy - 60, { size: 24, align: 'center', color: vac ? '#fff' : D.INK, stroke: vac ? '#14123F' : '#fff', weight: 700 });
        });
        D.line(c, 400, y0 - 28, 400, gy, vac ? 'rgba(255,255,255,.3)' : 'rgba(43,35,80,.2)', 2, [6, 8]);
        D.line(c, 90, y0, 90, y0 + HEIGHT * k, '#FF4757', 3);
        D.text(c, '20 m', 98, y0 + (HEIGHT * k) / 2, { size: 15, color: vac ? '#fff' : D.INK });
      }
    });
  });
})();
