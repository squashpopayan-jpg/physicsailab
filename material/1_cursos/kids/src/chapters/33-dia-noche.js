/* Capítulo 33 — Día, noche, estaciones y Luna */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La Tierra girando ---------- */
  const CITIES = [['Popayán', -76.6, '📍'], ['Londres', 0, '📍'], ['El Cairo', 31.2, '📍'], ['Tokio', 139.7, '📍'], ['Sídney', 151.2, '📍'], ['Los Ángeles', -118.2, '📍']];
  FK.sim('tierra-gira', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('h', { label: 'Hora en Londres (UTC)', icon: '🕐', min: 0, max: 24, step: 0.25, value: 12, unit: 'h', fmt: (v) => FK.n(v, 2).replace(',00', ':00').replace(',25', ':15').replace(',50', ':30').replace(',75', ':45') });
    g.button('▶ Dejar correr el tiempo', () => { S.play = !S.play; }, { kind: 'ghost' });
    g.out('p', 'Popayán', { icon: '📍' }); g.out('t', 'Tokio', { icon: '📍', hl: true });
    const S = { play: false };
    g.run({
      init() { S.play = false; g.say('El Sol está a la derecha. Mueve la hora y observa qué ciudades están de día.'); },
      step(dt) { if (S.play) { let h = g.p.h + dt * 1.5; if (h > 24) h -= 24; g.setSlider('h', Math.round(h * 4) / 4); } },
      draw(c, W, H) {
        const h = g.p.h, cx = 330, cy = H / 2, R = 150;
        D.night(c, W, H, 12, 60);
        /* Sol y luz */
        D.sun(c, W - 60, cy, 40, g.t); for (let i = -3; i <= 3; i++) D.line(c, W - 120, cy + i * 44, cx + R + 10, cy + i * 44 * 0.9, 'rgba(255,230,120,.35)', 3, [10, 8]);
        /* Tierra: mitad día, mitad noche */
        D.circle(c, cx, cy, R, '#1B3B8C', '#fff', 3);
        c.save(); c.beginPath(); c.arc(cx, cy, R - 1.5, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fillStyle = '#4FA8FF'; c.fill(); c.restore();
        D.text(c, 'DÍA', cx + R * 0.55, cy, { size: 24, align: 'center', color: '#fff', weight: 700 }); D.text(c, 'NOCHE', cx - R * 0.55, cy, { size: 24, align: 'center', color: '#9FB3FF', weight: 700 });
        const subsolar = -15 * (h - 12);
        const res = CITIES.map((ct) => { const th = M.rad(ct[1] - subsolar), x = cx + R * Math.cos(th), y = cy - R * Math.sin(th); const lst = (h + ct[1] / 15 + 48) % 24; const day = lst >= 6 && lst < 18; return { ct, x, y, lst, day }; });
        res.forEach((r) => { D.circle(c, r.x, r.y, 9, r.day ? '#FFC21A' : '#2B2350', '#fff', 2); D.tag(c, `${r.ct[2]} ${r.ct[0]} ${FK.n(r.lst, 0).padStart(2, '0')}:00`, r.x + (r.x < cx ? -20 : 20), r.y + (r.y < cy ? -16 : 16), r.day ? '#FFF1B8' : '#BFC5E8', { size: 12, align: r.x < cx ? 'right' : 'left' }); });
        const pop = res[0], tok = res[3];
        g.show('p', (pop.day ? '☀️ día' : '🌙 noche') + ' · ' + FK.n(Math.floor(pop.lst), 0) + ':00'); g.show('t', (tok.day ? '☀️ día' : '🌙 noche') + ' · ' + FK.n(Math.floor(tok.lst), 0) + ':00');
        if (!pop.day && tok.day && !g.won()) g.win('¡Noche en Popayán y día en Tokio! La Tierra gira y cada lugar mira al Sol a una hora distinta.');
        D.text(c, '↺ la Tierra gira hacia el este (vista desde el polo norte)', 14, 24, { size: 14, color: '#fff' });
        D.char(c, 'cosmo', 70, H - 70, 80, 'happy');
      }
    });
  });

  /* ---------- Estaciones ---------- */
  const LATS = [['Popayán (2,4° N)', 2.4], ['Bogotá (4,6° N)', 4.6], ['Ciudad de México (19° N)', 19.4], ['Londres (51° N)', 51.5], ['Sídney (34° S)', -33.9], ['Círculo polar (70° N)', 70]];
  FK.sim('estaciones', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('d', { label: 'Día del año', icon: '📅', min: 0, max: 364, step: 1, value: 172, fmt: (v) => C.dateName(v) });
    g.choice('lat', { label: 'Lugar', icon: '📍', options: LATS.map((l, i) => [i, l[0]]), value: 0 });
    g.out('dec', 'Dónde pega el Sol al mediodía', { icon: '☀️' }); g.out('dl', 'Duración del día', { icon: '🕐', hl: true }); g.out('el', 'Altura del Sol al mediodía', { icon: '📐' });
    const seen = { eq: false, hi: false };
    g.run({
      static: true,
      init() { seen.eq = seen.hi = false; g.say('Cambia la fecha y el lugar: ¿cuánto dura el día en los solsticios?'); },
      draw(c, W, H) {
        const d = g.p.d, dec = C.sunDeclination(d), lat = LATS[g.p.lat][1], dl = C.dayLength(lat, dec), el = 90 - Math.abs(lat - dec);
        g.show('dec', FK.n(Math.abs(dec), 1) + '° ' + (dec >= 0 ? 'norte' : 'sur')); g.show('dl', (dl >= 24 ? '24 h (sol de medianoche)' : dl <= 0 ? '0 h (noche polar)' : FK.n(dl, 1) + ' h')); g.show('el', FK.n(el, 0) + '°');
        if (Math.abs(dec) > 20) { if (Math.abs(lat) < 10) seen.eq = true; if (Math.abs(lat) > 45) seen.hi = true; }
        if (seen.eq && seen.hi && !g.won()) g.win('¡Descubierto! Cerca del ecuador el día casi no cambia; lejos del ecuador, cambia muchísimo.');
        D.night(c, W, H, 8, 50);
        /* órbita */
        const cx = 260, cy = H / 2, R = 120; D.sun(c, cx, cy, 30, g.t); c.beginPath(); c.ellipse(cx, cy, R * 1.5, R * 0.85, 0, 0, M.TAU); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]);
        const a = M.TAU * ((d - 3) / 365) + Math.PI * 0, ex = cx + Math.cos(-a + Math.PI) * R * 1.5 * -1, ey = cy + Math.sin(-a + Math.PI) * R * 0.85 * -1;
        D.circle(c, ex, ey, 22, '#4FA8FF', '#fff', 3); c.save(); c.translate(ex, ey); c.rotate(M.rad(23.4)); D.line(c, 0, -34, 0, 34, '#FFC21A', 3); c.restore();
        D.text(c, 'inclinada 23,4°', ex, ey + 40, { size: 12, align: 'center', color: '#FFE066' });
        [[80, '21 mar'], [172, '21 jun'], [264, '23 sep'], [355, '21 dic']].forEach(([dd, nm]) => { const aa = M.TAU * ((dd - 3) / 365), xx = cx + Math.cos(-aa + Math.PI) * R * 1.5 * -1, yy = cy + Math.sin(-aa + Math.PI) * R * 0.85 * -1; D.circle(c, xx, yy, 4, '#fff'); D.text(c, nm, xx + (xx > cx ? 12 : -12), yy, { size: 11, align: xx > cx ? 'left' : 'right', color: '#fff' }); });
        /* barra de duración del día */
        const bx = 520, by = 70; D.text(c, 'Día y noche en ' + LATS[g.p.lat][0].split(' (')[0], bx + 130, by - 24, { size: 15, align: 'center', color: '#fff', weight: 700 });
        D.box(c, bx, by, 260, 40, '#14123F', { r: 10, stroke: '#fff', lw: 2 }); const f = M.clamp(dl / 24, 0, 1); D.rr(c, bx + 2, by + 2, Math.max(0, 256 * f), 36, 8); c.fillStyle = '#FFC21A'; c.fill();
        D.text(c, FK.n(dl, 1) + ' h de día', bx + 130, by + 20, { size: 16, align: 'center', color: '#2B2350', weight: 700 });
        D.text(c, '12 h', bx + 130, by + 56, { size: 12, align: 'center', color: '#B9B3E6' }); D.line(c, bx + 130, by, bx + 130, by + 46, 'rgba(255,255,255,.4)', 1, [3, 3]);
        D.char(c, 'cosmo', 600, 290, 80, 'happy');
      }
    });
  });

  /* ---------- Fases de la Luna ---------- */
  const PH = [['Luna nueva', 0], ['Cuarto creciente', 90], ['Luna llena', 180], ['Cuarto menguante', 270]];
  FK.sim('fases-luna', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('a', { label: 'Posición de la Luna en su órbita', icon: '🌙', min: 0, max: 359, step: 1, value: 30, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.button('Comprobar', () => check(), { icon: '✅' });
    g.out('f', 'Fase actual', { icon: '🌙', hl: true }); g.out('goal', 'Reto', { icon: '🎯' }); g.out('ok', 'Aciertos', { icon: '⭐' });
    const S = { t: 0, ok: 0, order: [0, 2, 1, 3] };
    const target = () => PH[S.order[S.t % 4]];
    function check() {
      const a = g.p.a, tg = target()[1], d = Math.abs(((a - tg + 540) % 360) - 180); const dd = Math.min(Math.abs(a - tg), 360 - Math.abs(a - tg));
      if (dd <= 15) { S.ok++; S.t++; FK.sfx.ok(); g.show('ok', S.ok + ' de 4'); if (S.ok >= 4) g.win('¡Las cuatro fases! Siempre está iluminada la mitad de la Luna: depende de desde dónde la miras.'); else { g.say(`¡Sí! Ahora busca la ${target()[0].toLowerCase()}.`, 'wow'); g.show('goal', target()[0]); } }
      else { FK.sfx.no(); g.say('Aún no. Recuerda: el Sol ilumina siempre desde la derecha. ¿Dónde debe estar la Luna?', 'think'); }
    }
    g.run({
      static: true,
      init() { S.t = 0; S.ok = 0; g.show('ok', '0 de 4'); g.show('goal', target()[0]); g.say(`Busca la ${target()[0].toLowerCase()}. El Sol está a la derecha de la Tierra.`); },
      draw(c, W, H) {
        const a = g.p.a, cx = 250, cy = H / 2, R = 120; g.show('f', C.phaseName(a));
        D.night(c, W, H, 3, 60);
        D.sun(c, W - 50, cy, 34, g.t); for (let i = -2; i <= 2; i++) D.line(c, W - 100, cy + i * 40, cx + 30, cy + i * 30, 'rgba(255,230,120,.25)', 3, [10, 8]);
        D.circle(c, cx, cy, R, null, 'rgba(255,255,255,.25)', 2); D.circle(c, cx, cy, 30, '#4FA8FF', '#fff', 2); D.text(c, 'Tierra', cx, cy + 46, { size: 12, align: 'center', color: '#fff' });
        const th = M.rad(a), mx = cx + R * Math.cos(th), my = cy - R * Math.sin(th);
        /* a = 0° → Luna entre el Sol y la Tierra (a la derecha) = luna nueva */
        D.circle(c, mx, my, 16, '#2A2A55', '#fff', 2); c.save(); c.beginPath(); c.arc(mx, my, 15, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fillStyle = '#F1F1E6'; c.fill(); c.restore();
        /* vista desde la Tierra */
        const vx = 600, vy = 150, vr = 62; D.text(c, 'Así la ves desde la Tierra', vx, vy - 84, { size: 14, align: 'center', color: '#fff', weight: 700 });
        D.circle(c, vx, vy, vr, '#2A2A55', '#fff', 2);
        const frac = (1 - Math.cos(th)) / 2, waxing = a < 180, ca = Math.cos(th);
        c.save(); c.beginPath(); c.arc(vx, vy, vr - 1, 0, M.TAU); c.clip();
        c.beginPath();
        const N = 40, pts = [];
        for (let i = 0; i <= N; i++) { const y = -vr + (2 * vr * i) / N, xl = Math.sqrt(Math.max(0, vr * vr - y * y)); pts.push([y, xl]); }
        if (waxing) { pts.forEach((p, i) => (i ? c.lineTo(vx + p[1], vy + p[0]) : c.moveTo(vx + p[1], vy + p[0]))); for (let i = N; i >= 0; i--) c.lineTo(vx + ca * pts[i][1], vy + pts[i][0]); }
        else { pts.forEach((p, i) => (i ? c.lineTo(vx - p[1], vy + p[0]) : c.moveTo(vx - p[1], vy + p[0]))); for (let i = N; i >= 0; i--) c.lineTo(vx - ca * pts[i][1], vy + pts[i][0]); }
        c.closePath(); c.fillStyle = '#F1F1E6'; c.fill(); c.restore();
        D.text(c, FK.n(frac * 100, 0) + ' % iluminada', vx, vy + vr + 24, { size: 15, align: 'center', color: '#FFE066', weight: 700 });
        D.char(c, 'cosmo', 70, H - 70, 76, 'happy');
      }
    });
  });
})();
