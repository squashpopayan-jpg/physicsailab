/* Capítulo 5 — Caer y acelerar */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Caída en otros mundos ---------- */
  const WORLDS = { tierra: ['🌍 Tierra', 9.8, 1], luna: ['🌙 Luna', 1.62, Infinity], marte: ['🔴 Marte', 3.71, 8], jupiter: ['🟠 Júpiter', 24.79, Infinity] };
  FK.sim('galeria-caida', function (g) {
    const ctx = g.canvas(2.1);
    g.choice('mundo', { label: 'Mundo', icon: '🪐', options: Object.keys(WORLDS).map((k) => [k, WORLDS[k][0].slice(3)]), value: 'tierra', reset: true });
    g.choice('obj', { label: 'Objeto', icon: '🎒', options: [['pelota', 'Pelota', '🏀'], ['pluma', 'Pluma', '🪶']], value: 'pelota', reset: true });
    g.button('¡Soltar!', () => { if (s.st === 'ready') { s.st = 'fall'; FK.sfx.whoosh(); } }, { icon: '⬇️' });
    g.out('g', 'Gravedad', { icon: '🪐' }); g.out('t', 'Tiempo', { icon: '⏱️' }); g.out('v', 'Rapidez', { icon: '💨', hl: true });
    const H_M = 10;
    const s = { st: 'ready', y: 0, v: 0, t: 0, dots: [], next: 0.25, worlds: new Set() };
    g.run({
      init() { s.st = 'ready'; s.y = 0; s.v = 0; s.t = 0; s.dots = []; s.next = 0.25; const w = WORLDS[g.p.mundo]; g.show('g', FK.n(w[1], 2) + ' m/s²'); g.show('t', '0,00 s'); g.show('v', '0,0 m/s'); g.say(`Estás en ${w[0]}. La pelota cae desde ${H_M} metros. ¡Suéltala!`); },
      step(dt) {
        if (s.st !== 'fall') return;
        const w = WORLDS[g.p.mundo], vt = (g.p.obj === 'pluma' ? 0.6 : 20) * w[2];
        const n = 6;
        for (let i = 0; i < n && s.st === 'fall'; i++) {
          const y0 = s.y; C.stepFall(s, dt / n, w[1], vt); s.t += dt / n;
          if (s.y >= H_M) { s.t -= (dt / n) * ((s.y - H_M) / (s.y - y0)); s.y = H_M; s.st = 'done'; }
        }
        while (s.t >= s.next) { s.dots.push(s.y); s.next += 0.25; }
        g.show('t', FK.n(s.t, 2) + ' s'); g.show('v', FK.n(s.v, 1) + ' m/s = ' + FK.n(s.v * 3.6, 0) + ' km/h');
        if (s.st === 'done') {
          s.worlds.add(g.p.mundo + g.p.obj);
          g.say(`¡Llegó al suelo en ${FK.n(s.t, 2)} s con ${FK.n(s.v * 3.6, 0)} km/h!`, 'wow');
          if (new Set([...s.worlds].map((x) => x.replace(/pelota|pluma/, ''))).size >= 3) g.win('¡Ya probaste 3 mundos! La gravedad cambia en cada uno.');
        }
      },
      draw(c, W, H) {
        const k = g.p.mundo;
        if (k === 'luna') D.night(c, W, H, 5, 80); else if (k === 'marte') D.sky(c, W, H, '#FFB38A', '#FFE1C9'); else if (k === 'jupiter') D.sky(c, W, H, '#FFD9A8', '#F2B97A'); else { D.sky(c, W, H, '#8FD3FF', '#E8F8FF'); D.cloud(c, 560, 60, 1); }
        const gy = H - 44;
        D.ground(c, W, gy, H, k === 'luna' ? '#B8B8C8' : k === 'marte' ? '#D9694A' : k === 'jupiter' ? '#E8A04A' : '#7ED957', k === 'luna' ? '#8A8AA0' : k === 'marte' ? '#A8452C' : k === 'jupiter' ? '#C07A30' : '#B9824A');
        const x = 300, top = 40, pxm = (gy - 40 - top) / H_M;
        D.line(c, x - 90, top, x - 90, top + H_M * pxm, '#FF4757', 3);
        for (let m = 0; m <= H_M; m += 2) { D.line(c, x - 98, top + m * pxm, x - 82, top + m * pxm, '#FF4757', 3); D.text(c, `${H_M - m} m`, x - 106, top + m * pxm, { size: 13, align: 'right', color: k === 'luna' ? '#fff' : D.INK }); }
        s.dots.forEach((dy) => D.circle(c, x, top + dy * pxm, 5, '#8E5CF6', '#fff', 2));
        D.emoji(c, g.p.obj === 'pelota' ? '🏀' : '🪶', x, top + s.y * pxm, 46, s.st === 'fall' ? s.t * 2 : 0);
        D.shadow(c, x, gy + 3, 26);
        D.char(c, 'newti', 560, gy - 44, 90, s.st === 'done' ? 'wow' : 'happy');
        D.tag(c, 'cada punto = ¼ de segundo', 560, 40, '#fff', { size: 14 });
      }
    });
  });

  /* ---------- El cañón de Newti ---------- */
  FK.sim('canon-blanco', function (g) {
    const ctx = g.canvas(2);
    g.slider('ang', { label: 'Ángulo', icon: '📐', min: 5, max: 85, step: 1, value: 45, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.slider('v', { label: 'Rapidez de salida', icon: '💨', min: 5, max: 45, step: 1, value: 25, unit: 'm/s', fmt: (v) => FK.n(v, 0) });
    g.button('¡Fuego!', () => fire(), { icon: '💥' });
    g.out('hits', 'Aciertos', { icon: '🎯', hl: true }); g.out('alc', 'Alcance', { icon: '📏' });
    const PX = 4, GX = 70, S = { ball: null, target: 100, hits: 0, trail: [], last: [], msg: '' };
    const gy = (H) => H - 56;
    function fire() { if (S.ball) return; const a = M.rad(g.p.ang); S.ball = { t: 0, x: 0, y: 0, vx: g.p.v * Math.cos(a), vy: g.p.v * Math.sin(a) }; S.trail = []; FK.sfx.boom(); }
    g.run({
      init() { S.ball = null; S.hits = S.hits || 0; S.target = Math.round(M.rnd(35, 140)); S.trail = []; g.show('hits', S.hits + ' de 3'); g.show('alc', '—'); g.say('Ajusta el ángulo y la rapidez. ¡Que la bola caiga en la bandera!'); },
      step(dt) {
        const b = S.ball; if (!b) return;
        b.t += dt; b.x = b.vx * b.t; b.y = b.vy * b.t - 4.9 * b.t * b.t;
        S.trail.push([b.x, b.y]);
        if (b.y < 0 && b.t > 0.05) {
          const R = C.range(g.p.v, M.rad(g.p.ang), 9.8);
          S.last = S.trail.slice(); S.ball = null; g.show('alc', FK.n(R, 1) + ' m');
          if (Math.abs(R - S.target) <= 3.5) { S.hits++; g.show('hits', S.hits + ' de 3'); FK.sfx.ok(); S.target = Math.round(M.rnd(35, 140)); if (S.hits >= 3) { g.win('¡3 blancos! ¡Puntería de campeón!'); S.hits = 0; } else g.say('¡Dio en el blanco! Aparece otra bandera.', 'wow'); }
          else { FK.sfx.no(); g.say(R < S.target ? `Quedó corto: llegó a ${FK.n(R, 0)} m y la bandera está a ${S.target} m. ¡Sube la rapidez!` : `Se pasó: llegó a ${FK.n(R, 0)} m y la bandera está a ${S.target} m. ¡Baja la rapidez!`, 'think'); }
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#8FD3FF', '#E8F8FF'); D.cloud(c, 420, 50, 1); D.cloud(c, 650, 100, 0.8);
        const Y = gy(H); D.ground(c, W, Y, H, '#7ED957', '#B9824A');
        for (let m = 0; m <= 150; m += 25) { D.line(c, GX + m * PX, Y, GX + m * PX, Y + 10, D.INK, 2); D.text(c, m + ' m', GX + m * PX, Y + 28, { size: 12, align: 'center' }); }
        /* trayectoria anterior */
        if (S.last.length) { c.fillStyle = 'rgba(142,92,246,.45)'; S.last.forEach((p, i) => { if (i % 6 === 0) { c.beginPath(); c.arc(GX + p[0] * PX, Y - p[1] * PX, 3, 0, M.TAU); c.fill(); } }); }
        /* bandera */
        const tx = GX + S.target * PX;
        D.line(c, tx, Y, tx, Y - 54, D.INK, 4); D.poly(c, [[tx, Y - 54], [tx + 30, Y - 44], [tx, Y - 34]], '#FF4757', D.INK, 2.5);
        D.box(c, tx - 3.5 * PX, Y - 6, 7 * PX, 6, 'rgba(255,194,26,.9)', { r: 3, lw: 1.5 });
        /* cañón */
        const a = -M.rad(g.p.ang);
        c.save(); c.translate(GX, Y - 8); c.rotate(a); D.box(c, -8, -12, 66, 24, '#4A4FE0', { r: 10 }); c.restore();
        D.circle(c, GX, Y - 8, 22, '#2B2350'); D.circle(c, GX, Y - 8, 9, '#8A8AA0');
        D.emoji(c, '🐱', GX - 40, Y - 22, 36);
        if (S.ball) D.circle(c, GX + S.ball.x * PX, Y - 8 - S.ball.y * PX, 10, '#FF8A1F', D.INK, 3);
        D.tag(c, `${FK.n(g.p.ang, 0)}° · ${FK.n(g.p.v, 0)} m/s`, 130, 30, '#fff', { size: 15 });
      }
    });
  });
})();
