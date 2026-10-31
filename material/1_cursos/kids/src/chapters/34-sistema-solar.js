/* Capítulo 34 — El Sistema Solar y las órbitas */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- El cañón de Newton ---------- */
  FK.sim('canon-newton', function (g) {
    const ctx = g.canvas(1.8);
    g.slider('v', { label: 'Rapidez de salida', icon: '💨', min: 1, max: 13, step: 0.1, value: 5, unit: 'km/s', fmt: (v) => FK.n(v, 1) });
    g.button('🔥 ¡Disparar!', () => fire(), { kind: 'primary' });
    g.out('r', 'Qué pasó', { icon: '🌍', hl: true }); g.out('vc', 'Rapidez para órbita circular', { icon: '⭕' });
    const R = 6371, H0 = 300, SC = 0.027;
    const S = { st: 'idle', x: 0, y: 0, vx: 0, vy: 0, trail: [], ang: 0, orbited: false, esc: false, t: 0, minr: 1e9 };
    function fire() { const r0 = R + H0; S.st = 'fly'; S.x = 0; S.y = r0; S.vx = g.p.v; S.vy = 0; S.trail = [[0, r0]]; S.ang = 0; S.sw = 0; S.t = 0; S.minr = r0; FK.sfx.boom(); }
    g.run({
      init() { S.st = 'idle'; S.trail = []; S.orbited = S.orbited && g.won(); g.show('r', '—'); g.show('vc', FK.n(C.circularV(R + H0), 2) + ' km/s'); g.say('El cañón está en una montaña de 300 km sobre la Tierra. Elige la rapidez y dispara.'); },
      step(dt) {
        if (S.st !== 'fly') return;
        const k = 750, n = 80; /* tiempo comprimido */
        for (let i = 0; i < n && S.st === 'fly'; i++) {
          const h = (dt * k) / n, r = Math.hypot(S.x, S.y), a = C.GM_EARTH / (r * r * r);
          S.vx -= S.x * a * h; S.vy -= S.y * a * h; S.x += S.vx * h; S.y += S.vy * h; S.t += h;
          const r2 = Math.hypot(S.x, S.y); S.minr = Math.min(S.minr, r2);
          const th = Math.atan2(S.x, S.y); const d = ((th - S.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI; S.ang += d; S.sw = (S.sw || 0) + d; if (i % 4 === 0) S.trail.push([S.x, S.y]);
          if (r2 <= R) { S.st = 'crash'; g.show('r', '💥 se estrelló'); g.say(`Cayó a la Tierra tras recorrer ${FK.int(R * Math.abs(S.sw || 0))} km. Necesita más rapidez.`, 'think'); S.sw = 0; break; }
          if (r2 > R * 6) { S.st = 'escape'; S.esc = true; g.show('r', '🚀 escapó al espacio'); g.say('¡Escapó de la Tierra! Pasó la rapidez de escape (unos 10,8 km/s a esta altura).', 'wow'); S.sw = 0; break; }
          if (Math.abs(S.sw || 0) > Math.PI * 2 * 1.02) { S.st = 'orbit'; S.orbited = true; g.show('r', '🛰️ ¡en órbita!'); g.say(`¡Dio la vuelta completa! Se queda cayendo alrededor de la Tierra: ${S.minr < R + 80 ? 'casi roza la atmósfera' : 'una órbita estable'}.`, 'wow'); S.sw = 0; FK.sfx.ok(); break; }
        }
        if ((S.orbited || g.won()) && S.esc && !g.won()) g.win('¡Órbita y escape! Newton tenía razón: lanzar más rápido hace que caiga cada vez más lejos.');
        if (S.orbited && S.esc && !g.won()) g.win('¡Órbita y escape! Newton tenía razón.');
      },
      draw(c, W, H) {
        D.night(c, W, H, 21, 70);
        const cx = W / 2, cy = H / 2 + 40, sc = SC * 1.15;
        D.circle(c, cx, cy, R * sc, '#2E7BE8', '#9FD0FF', 4); c.beginPath(); c.arc(cx, cy, R * sc, -2.2, -0.9); c.fillStyle = 'rgba(92,208,104,.7)'; c.lineTo(cx, cy); c.fill();
        D.circle(c, cx, cy, (R + 100) * sc, null, 'rgba(120,180,255,.25)', 6);
        const top = [cx, cy - (R + H0) * sc]; D.emoji(c, '⛰️', cx, cy - R * sc - 6, 32); D.emoji(c, '🔫', top[0] + 2, top[1] - 4, 28);
        c.beginPath(); S.trail.forEach((p, i) => { const x = cx + p[0] * sc, y = cy - p[1] * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = '#FFC21A'; c.lineWidth = 3; c.stroke();
        if (S.st === 'fly' || S.st === 'orbit') D.circle(c, cx + S.x * sc, cy - S.y * sc, 6, '#FF4757', '#fff', 2);
        D.char(c, 'cosmo', 70, 60, 76, 'happy');
        D.text(c, S.orbited ? '✅ órbita' : '⬜ órbita', W - 20, 24, { size: 14, align: 'right', color: '#fff' }); D.text(c, S.esc ? '✅ escape' : '⬜ escape', W - 20, 46, { size: 14, align: 'right', color: '#fff' });
      }
    });
  });

  /* ---------- Kepler ---------- */
  const PLANETS = [['Mercurio', 0.387, '#B5B5B5', 5], ['Venus', 0.723, '#E8C07A', 8], ['Tierra', 1, '#3D9BFF', 8], ['Marte', 1.524, '#E0583A', 6], ['Júpiter', 5.203, '#D8A068', 14], ['Saturno', 9.537, '#EBD28A', 12], ['Urano', 19.19, '#9FE3F0', 10], ['Neptuno', 30.07, '#4A6BE8', 10]];
  FK.sim('kepler', function (g) {
    const ctx = g.canvas(1.9);
    g.slider('sp', { label: 'Velocidad del tiempo', icon: '⏩', min: 0.1, max: 3, step: 0.1, value: 0.5, unit: 'años/s', fmt: (v) => FK.n(v, 1) });
    g.choice('sel', { label: 'Planeta', icon: '🪐', options: PLANETS.map((p, i) => [i, p[0]]), value: 4 });
    g.out('a', 'Distancia al Sol', { icon: '📏' }); g.out('T', 'Su año', { icon: '📅' }); g.out('t', 'Años transcurridos', { icon: '⏳', hl: true });
    const S = { t: 0, laps: 0 };
    const px = (a) => 26 * Math.pow(a, 0.5) * 1.0;
    g.run({
      init() { S.t = 0; g.say('Deja pasar los años. ¿Cuántas vueltas da cada planeta?'); },
      step(dt) {
        S.t += dt * g.p.sp; const p = PLANETS[g.p.sel], T = C.keplerYears(p[1]);
        g.show('a', FK.n(p[1], 2) + ' UA'); g.show('T', T < 1 ? FK.n(T * 365, 0) + ' días' : FK.n(T, 1) + ' años'); g.show('t', FK.n(S.t, 1) + ' años · ' + FK.n(S.t / T, 1) + ' vueltas de ' + p[0]);
        if (S.t >= C.keplerYears(5.203) && !g.won()) g.win(`¡Júpiter dio una vuelta (${FK.n(C.keplerYears(5.203), 1)} años) mientras Mercurio dio ${FK.n(S.t / C.keplerYears(0.387), 0)}!`);
      },
      draw(c, W, H) {
        D.night(c, W, H, 5, 60);
        const cx = W / 2, cy = H / 2; D.sun(c, cx, cy, 14, g.t);
        PLANETS.forEach((p, i) => { const r = px(p[1]) * 1.55 + 14; c.beginPath(); c.arc(cx, cy, r, 0, M.TAU); c.strokeStyle = i === g.p.sel ? 'rgba(255,224,102,.8)' : 'rgba(255,255,255,.18)'; c.lineWidth = i === g.p.sel ? 2.5 : 1; c.stroke(); const a = M.TAU * (S.t / C.keplerYears(p[1])) + i; D.circle(c, cx + r * Math.cos(a), cy - r * Math.sin(a), p[3] * 0.7 + 2, p[2], i === g.p.sel ? '#fff' : null, 2); if (i === g.p.sel) D.text(c, p[0], cx + r * Math.cos(a), cy - r * Math.sin(a) - 16, { size: 13, align: 'center', color: '#FFE066', weight: 700 }); });
        D.text(c, 'las órbitas no están a escala exacta', 14, 24, { size: 13, color: '#B9B3E6' });
        D.char(c, 'cosmo', W - 60, H - 60, 72, 'happy');
      }
    });
  });

  /* ---------- Camina por el sistema solar ---------- */
  const SCALE = [['Sol', 0, 1], ['Mercurio', 0.387, 0.0035], ['Venus', 0.723, 0.0087], ['Tierra', 1, 0.0091], ['Marte', 1.524, 0.0049], ['Júpiter', 5.203, 0.1004], ['Saturno', 9.537, 0.0836], ['Urano', 19.19, 0.0364], ['Neptuno', 30.07, 0.0354]];
  FK.sim('escala-sistema', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('m', { label: 'Camino desde el Sol', icon: '🚶', min: 0, max: 3300, step: 5, value: 0, unit: 'm', fmt: (v) => FK.int(v) });
    g.out('t', 'Tiempo caminando a 1,4 m/s', { icon: '⏱️' }); g.out('n', 'Planeta más cercano', { icon: '🪐', hl: true });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Si el Sol fuera una pelota de 1 m, ¿hasta dónde habría que caminar para ver a cada planeta?'); },
      draw(c, W, H) {
        const m = g.p.m, d = m / 107.4; /* UA */
        const t = m / 1.4; g.show('t', t < 120 ? FK.n(t, 0) + ' s' : t < 7200 ? FK.n(t / 60, 0) + ' min' : FK.n(t / 3600, 1) + ' h');
        let best = 0, bd = 1e9; SCALE.forEach((p, i) => { const dd = Math.abs(p[1] - d); if (dd < bd) { bd = dd; best = i; } });
        const near = Math.abs(SCALE[best][1] * 107.4 - m) < Math.max(4, SCALE[best][1] * 107.4 * 0.06);
        g.show('n', near ? SCALE[best][0] : 'ninguno cerca (¡vacío!)'); if (near) { seen.add(best); } if (seen.has(8) && !g.won()) g.win('¡Llegaste a Neptuno, a más de 3 km del Sol! Y la estrella más cercana estaría a 30 000 km.');
        D.night(c, W, H, 6, 50);
        /* regla de camino */
        const x0 = 40, x1 = W - 40, y = 250; D.line(c, x0, y, x1, y, '#fff', 3);
        SCALE.forEach((p, i) => { const xm = x0 + (p[1] * 107.4 / 3300) * (x1 - x0); D.circle(c, xm, y, i === 0 ? 10 : 5, i === 0 ? '#FFC21A' : '#fff'); D.text(c, p[0], xm, y + (i % 2 ? 24 : 40), { size: 12, align: 'center', color: seen.has(i) ? '#FFE066' : '#B9B3E6' }); });
        const me = x0 + (m / 3300) * (x1 - x0); D.emoji(c, '🚶', me, y - 24, 36);
        /* planeta cercano ampliado */
        const p = SCALE[best]; if (near) { const rr = Math.max(4, p[2] * 220); D.circle(c, 400, 110, Math.min(80, Math.max(rr, 6)), ['#FFD84D', '#B5B5B5', '#E8C07A', '#3D9BFF', '#E0583A', '#D8A068', '#EBD28A', '#9FE3F0', '#4A6BE8'][best], '#fff', 2); D.text(c, `${p[0]}: ${p[2] >= 0.5 ? FK.n(p[2], 0) + ' m' : p[2] >= 0.1 ? FK.n(p[2] * 100, 0) + ' cm' : FK.n(p[2] * 1000, 0) + ' mm'} de ancho`, 400, 40, { size: 17, align: 'center', color: '#fff', weight: 700 }); }
        else D.text(c, 'casi nada por aquí…', 400, 110, { size: 24, align: 'center', color: '#B9B3E6' });
        D.char(c, 'cosmo', 60, 90, 72, 'happy');
      }
    });
  });
})();
