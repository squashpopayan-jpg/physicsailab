/* Capítulo 4 — Moverse */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M;

  /* ---------- La gran carrera de animales ---------- */
  const RACERS = [['🐌', 'Caracol', 0.013], ['🐢', 'Tortuga', 0.3], ['🚶', 'Persona caminando', 1.4], ['🏃', 'Niño corriendo', 4], ['🐎', 'Caballo', 15], ['🐆', 'Guepardo', 29]];
  const fmtT = (s) => (s < 60 ? FK.n(s, s < 10 ? 1 : 0) + ' s' : s < 3600 ? FK.n(s / 60, 1) + ' min' : FK.n(s / 3600, 1) + ' h');
  FK.sim('carrera-animales', function (g) {
    const ctx = g.canvas(2.1);
    g.choice('dist', { label: 'Distancia de la carrera', icon: '📏', options: [[10, '10 m'], [100, '100 m'], [1000, '1 km']], value: 100, reset: true });
    g.button('¡A correr!', () => { if (s.state !== 'run') { s.state = 'run'; s.T = 0; FK.sfx.whoosh(); } }, { icon: '🏁' });
    g.out('v', 'Rapidez ganador', { icon: '💨' }); g.out('t', 'Tiempo ganador', { icon: '⏱️' });
    const s = { state: 'ready', T: 0, done: {}, ran: new Set() };
    const tWin = () => g.p.dist / RACERS[5][2];
    g.run({
      init() { s.state = 'ready'; s.T = 0; g.show('v', '—'); g.show('t', '—'); g.say(`¿Quién llegará primero a ${g.p.dist} m? Presiona «¡A correr!». El tiempo va comprimido para que veas toda la carrera.`); },
      step(dt) {
        if (s.state !== 'run') return;
        /* el más rápido tarda unos 5 s en pantalla */
        const k = tWin() / 5;
        s.T += dt * k;
        if (s.T >= tWin()) {
          s.state = 'done'; s.ran.add(g.p.dist);
          g.show('v', '29 m/s'); g.show('t', fmtT(tWin()));
          g.say(`¡Ganó el guepardo en ${fmtT(tWin())}! El caracol tardaría ${fmtT(g.p.dist / RACERS[0][2])}.`, 'wow');
          if (s.ran.size >= 3) g.win('¡Corriste las tres carreras! Ya sabes cuánto tarda cada animal.');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF');
        const top = 40, lane = (H - top - 20) / RACERS.length;
        D.text(c, '🏁', W - 28, top - 10, { size: 22 });
        RACERS.forEach((r, i) => {
          const y = top + i * lane;
          D.box(c, 10, y + 4, W - 20, lane - 8, i % 2 ? '#C9E8A8' : '#D6F0B8', { r: 12, lw: 2 });
          const d = Math.min(g.p.dist, r[2] * s.T);
          const x = 190 + (d / g.p.dist) * (W - 290);
          D.emoji(c, r[0], x, y + lane / 2, 34, 0, true);
          D.text(c, r[1], 22, y + lane / 2, { size: 15, color: D.INK, weight: 700 });
          const tt = d >= g.p.dist ? g.p.dist / r[2] : null;
          if (tt) D.tag(c, fmtT(tt), Math.min(W - 60, x + 70), y + lane / 2, '#B8F2D0', { size: 14 });
        });
        D.line(c, W - 100, top, W - 100, H - 16, '#FF4757', 3, [8, 6]);
        if (s.state !== 'ready') D.tag(c, '⏱ ' + fmtT(s.T), W / 2, 20, '#FFF1B8', { size: 16 });
      }
    });
  });

  /* ---------- Radar con cronómetro ---------- */
  FK.sim('radar', function (g) {
    const ctx = g.canvas(2.4);
    g.button('Iniciar', () => start(), { icon: '▶️' }); g.button('Parar', () => stop(), { icon: '⏹️', kind: 'ghost' });
    g.button('Otro carro', () => g.restart(), { icon: '🚗', kind: 'ghost' });
    g.out('t', 'Tu tiempo', { icon: '⏱️' }); g.out('v', 'Tu rapidez', { icon: '🧮', hl: true }); g.out('real', 'Rapidez real', { icon: '🚗' });
    const PX = 6, X1 = 250, X2 = 550; /* 6 px por metro, tramo de 50 m */
    const s = { x: -60, v: 15, run: false, t0: 0, tm: null, done: false };
    function start() { if (s.run || s.done) return; s.run = true; s.t0 = performance.now(); s.tm = null; g.show('t', '…'); }
    function stop() {
      if (!s.run) { g.say('Primero presiona «Iniciar» cuando el carro pase el poste verde.', 'think'); return; }
      s.run = false; s.tm = (performance.now() - s.t0) / 1000; s.done = true;
      const v = 50 / s.tm; g.show('t', FK.n(s.tm, 2) + ' s'); g.show('v', FK.n(v, 1) + ' m/s = ' + FK.n(v * 3.6, 0) + ' km/h');
    }
    g.run({
      init() { s.x = -40; s.v = M.rnd(8, 22); s.run = false; s.done = false; s.tm = null; g.show('t', '—'); g.show('v', '—'); g.show('real', '?'); g.say('Mira pasar el carro. Inicia el cronómetro en el poste verde y para en el rojo.'); },
      step(dt) {
        s.x += s.v * PX * dt;
        if (s.x > 900) {
          if (s.done) {
            const real = s.v, mine = 50 / s.tm, err = Math.abs(mine - real) / real;
            g.show('real', FK.n(real, 1) + ' m/s = ' + FK.n(real * 3.6, 0) + ' km/h');
            if (err <= 0.15) g.win(`¡Muy cerca! Tú: ${FK.n(mine * 3.6, 0)} km/h, real: ${FK.n(real * 3.6, 0)} km/h.`); else g.say(`Tu medida: ${FK.n(mine * 3.6, 0)} km/h. La real: ${FK.n(real * 3.6, 0)} km/h. ¡Prueba con otro carro!`, 'think');
          } else { g.say('El carro pasó sin que lo midieras. ¡Otro carro!', 'think'); }
          s.x = -60; s.v = M.rnd(8, 22); s.done = false; s.run = false; s.tm = null; g.show('t', '—'); g.show('v', '—'); g.show('real', '?');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#8FD3FF', '#E8F8FF'); D.cloud(c, 80, 50, 1); D.cloud(c, 560, 70, 1.2);
        D.ground(c, W, 220, H, '#7ED957', '#B9824A');
        c.fillStyle = '#5B5B7A'; c.fillRect(0, 250, W, 70); D.line(c, 0, 285, W, 285, '#fff', 4, [24, 18]);
        D.line(c, X1, 190, X1, 320, '#12B76A', 8); D.tag(c, 'Poste 1', X1, 175, '#B8F2D0', { size: 14 });
        D.line(c, X2, 190, X2, 320, '#FF4757', 8); D.tag(c, 'Poste 2', X2, 175, '#FFC7CD', { size: 14 });
        D.arrow(c, X1 + 6, 205, X2 - 6, 205, '#2B2350', 4); D.tag(c, '50 metros', (X1 + X2) / 2, 225, '#fff', { size: 15 });
        D.emoji(c, '🚗', s.x, 275, 56, 0, true);
        if (s.run) D.text(c, '⏱ ' + FK.n((performance.now() - s.t0) / 1000, 1) + ' s', W / 2, 60, { size: 28, align: 'center', weight: 700 });
      }
    });
    g.pointer({ down: () => { if (!s.run && !s.done) start(); else if (s.run) stop(); } });
  });
})();
