/* Capítulo 26 — El color */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Prisma de Newton ---------- */
  FK.sim('prisma', function (g) {
    const ctx = g.canvas(2);
    g.choice('luz', { label: 'Luz', icon: '💡', options: [['blanca', 'Blanca', '⚪'], ['roja', 'Solo roja', '🔴'], ['azul', 'Solo azul', '🔵']], value: 'blanca' });
    g.slider('phi', { label: 'Inclinación del rayo', icon: '📐', min: -40, max: 0, step: 1, value: -18, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.out('dr', 'Desviación de la roja', { icon: '🔴' }); g.out('dv', 'Desviación de la violeta', { icon: '🟣' }); g.out('ab', 'Abanico de colores', { icon: '🌈', hl: true });
    const seen = { blanca: 0, mono: 0 };
    const P1 = [350, 216], APEX = [400, 130], BL = [300, 303], BR = [500, 303];
    const WAVES = [400, 440, 480, 520, 560, 600, 640, 700];
    const trace = (nm) => {
      const n = C.cauchy(nm), phi = M.rad(g.p.phi), d0 = [Math.cos(phi), Math.sin(phi)];
      const nOut1 = [-Math.sqrt(3) / 2, -0.5], nOut2 = [Math.sqrt(3) / 2, -0.5];
      const d1 = C.refractVec(d0, nOut1, 1, n); if (!d1) return null;
      const seg2 = [APEX[0], APEX[1], BR[0], BR[1]], t = C.raySegment(P1, d1, seg2); if (t === null) return null;
      const P2 = [P1[0] + d1[0] * t, P1[1] + d1[1] * t], d2 = C.refractVec(d1, nOut2, n, 1); if (!d2) return null;
      return { n, P2, d2, ang: M.deg(Math.atan2(d2[1], d2[0]) - phi) };
    };
    g.run({
      static: true,
      init() { seen.blanca = 0; seen.mono = 0; g.say('Un rayo entra al prisma por la izquierda. Cambia el tipo de luz y mira.'); },
      draw(c, W, H) {
        D.night(c, W, H, 4, 40);
        const phi = M.rad(g.p.phi), d0 = [Math.cos(phi), Math.sin(phi)];
        /* rayo de entrada */
        const S0 = [P1[0] - d0[0] * 300, P1[1] - d0[1] * 300];
        D.line(c, S0[0], S0[1], P1[0], P1[1], g.p.luz === 'roja' ? '#FF3B3B' : g.p.luz === 'azul' ? '#3B6BFF' : '#FFFFFF', 6);
        D.poly(c, [APEX, BL, BR], 'rgba(160,210,255,.35)', '#BFE9FF', 4);
        D.emoji(c, '🔦', S0[0] - 14, S0[1], 40);
        const waves = g.p.luz === 'blanca' ? WAVES : g.p.luz === 'roja' ? [660] : [450];
        const res = waves.map((nm) => ({ nm, r: trace(nm) })); c.globalCompositeOperation = 'lighter';
        res.forEach((o) => { if (!o.r) return; const col = D.wave(o.nm); D.line(c, P1[0], P1[1], o.r.P2[0], o.r.P2[1], col, 4); D.line(c, o.r.P2[0], o.r.P2[1], o.r.P2[0] + o.r.d2[0] * 600, o.r.P2[1] + o.r.d2[1] * 600, col, 5); });
        c.globalCompositeOperation = 'source-over';
        const r = trace(700), v = trace(400);
        if (g.p.luz === 'blanca' && r && v) { g.show('dr', FK.n(r.ang, 1) + '°'); g.show('dv', FK.n(v.ang, 1) + '°'); g.show('ab', FK.n(Math.abs(v.ang - r.ang), 1) + '°'); seen.blanca += 1 / 60; }
        else { g.show('dr', r ? FK.n(r.ang, 1) + '°' : '—'); g.show('dv', v ? FK.n(v.ang, 1) + '°' : '—'); g.show('ab', '0° (no se separa)'); if (g.p.luz !== 'blanca') seen.mono += 1 / 60; }
        if (seen.blanca > 0.4 && seen.mono > 0.4 && !g.won()) g.win('¡Muy bien! La luz blanca se separa en colores, pero un solo color no se separa más.');
        if (!res.some((o) => o.r)) D.text(c, 'el rayo se refleja dentro del prisma', W / 2, 40, { size: 18, align: 'center', color: '#fff' });
      }
    });
  });

  /* ---------- Mezclador de luces ---------- */
  const TARGETS = [['Amarillo', [255, 255, 0]], ['Cian', [0, 255, 255]], ['Magenta', [255, 0, 255]], ['Naranja', [255, 128, 0]], ['Rosa', [255, 128, 200]], ['Violeta', [128, 0, 255]], ['Blanco', [255, 255, 255]], ['Verde claro', [128, 255, 128]]];
  FK.sim('mezclador-rgb', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('r', { label: 'Luz roja', icon: '🔴', min: 0, max: 255, step: 5, value: 0, fmt: (v) => FK.n(v, 0) });
    g.slider('g', { label: 'Luz verde', icon: '🟢', min: 0, max: 255, step: 5, value: 0, fmt: (v) => FK.n(v, 0) });
    g.slider('b', { label: 'Luz azul', icon: '🔵', min: 0, max: 255, step: 5, value: 0, fmt: (v) => FK.n(v, 0) });
    g.button('Comparar', () => check(), { icon: '✅' });
    g.out('t', 'Color pedido', { icon: '🎯', hl: true }); g.out('n', 'Aciertos', { icon: '⭐' });
    const S = { tg: TARGETS[0], ok: 0, said: false };
    const next = () => { let t; do { t = M.pick(TARGETS); } while (t === S.tg); S.tg = t; g.show('t', t[0]); };
    function check() {
      const d = Math.abs(g.p.r - S.tg[1][0]) + Math.abs(g.p.g - S.tg[1][1]) + Math.abs(g.p.b - S.tg[1][2]);
      if (d <= 60) { S.ok++; g.show('n', S.ok + ' de 3'); FK.sfx.ok(); if (S.ok >= 3) g.win('¡Tres colores! Rojo + verde = amarillo, verde + azul = cian, rojo + azul = magenta.'); else g.say(`¡Sí! Eso es ${S.tg[0].toLowerCase()}. Aquí va otro color.`, 'wow'); next(); } else { FK.sfx.no(); g.say('Todavía no. Piensa: ¿qué luces suman ese color?', 'think'); }
    }
    g.run({
      static: true,
      init() { S.ok = 0; next(); g.show('n', '0 de 3'); g.say('Mezcla las tres luces para igualar el color pedido (el cuadro de la derecha).'); },
      draw(c, W, H) {
        D.box(c, 0, 0, W, H, '#05050F', { r: 0, stroke: false });
        c.globalCompositeOperation = 'lighter';
        const cx = 260, cy = H / 2 + 10, R = 100, mk = (x, y, col) => { c.beginPath(); c.arc(x, y, R, 0, M.TAU); c.fillStyle = col; c.fill(); };
        mk(cx, cy - 55, `rgb(${g.p.r},0,0)`); mk(cx - 55, cy + 45, `rgb(0,${g.p.g},0)`); mk(cx + 55, cy + 45, `rgb(0,0,${g.p.b})`);
        c.globalCompositeOperation = 'source-over';
        D.text(c, 'tu mezcla', 120, 30, { size: 16, color: '#fff' });
        D.box(c, 480, 60, 140, 140, `rgb(${S.tg[1].join(',')})`, { r: 20, stroke: '#fff', lw: 4 }); D.text(c, 'color pedido', 550, 40, { size: 16, align: 'center', color: '#fff' });
        D.box(c, 640, 60, 140, 140, `rgb(${g.p.r},${g.p.g},${g.p.b})`, { r: 20, stroke: '#fff', lw: 4 }); D.text(c, 'tu mezcla', 710, 40, { size: 16, align: 'center', color: '#fff' });
        D.text(c, `(${g.p.r}, ${g.p.g}, ${g.p.b})`, 710, 220, { size: 16, align: 'center', color: '#fff' });
        D.char(c, 'lumi', 600, 300, 80, 'happy');
      }
    });
  });

  /* ---------- Cielo azul y atardecer ---------- */
  FK.sim('cielo-azul', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('e', { label: 'Altura del Sol', icon: '☀️', min: 1, max: 90, step: 1, value: 60, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.out('am', 'Aire que atraviesa la luz', { icon: '🌫️' }); g.out('hr', 'Hora aproximada', { icon: '🕐' });
    const seen = { low: false, high: false };
    g.run({
      static: true,
      init() { seen.low = seen.high = false; g.say('Mueve el Sol por el cielo. ¿Qué color toma el cielo al atardecer?'); },
      draw(c, W, H) {
        const e = g.p.e, am = C.airmass(e), T0 = C.sunTransmit(e), mx = Math.max(...T0), T = T0.map((t) => t / mx), sun = `rgb(${Math.round(255 * T[0])},${Math.round(255 * Math.pow(T[1], 1.1))},${Math.round(255 * T[2])})`;
        g.show('am', FK.n(am, 1) + ' × lo normal'); g.show('hr', e > 75 ? 'mediodía' : e > 35 ? 'mañana o tarde' : e > 12 ? 'media tarde' : 'amanecer o atardecer');
        if (e <= 8) seen.low = true; if (e >= 70) seen.high = true; if (seen.low && seen.high && !g.won()) g.win('¡Del mediodía al atardecer! Cuando la luz atraviesa más aire, se quedan solo el naranja y el rojo.');
        const bright = M.clamp(Math.sin(M.rad(e)) + 0.08, 0.12, 1), blue = [Math.round(40 + 70 * bright), Math.round(90 + 90 * bright), Math.round(150 + 105 * bright)];
        const hor = [Math.round(M.lerp(255 * T[0], blue[0] + 60, bright * 0.7)), Math.round(M.lerp(255 * T[1] * 0.85, blue[1] + 50, bright * 0.8)), Math.round(M.lerp(255 * T[2] * 0.7, blue[2], bright * 0.9))];
        const grd = c.createLinearGradient(0, 0, 0, H - 60); grd.addColorStop(0, `rgb(${Math.round(blue[0] * 0.6)},${Math.round(blue[1] * 0.6)},${Math.round(blue[2] * 0.85)})`); grd.addColorStop(0.55, `rgb(${blue.join(',')})`); grd.addColorStop(1, `rgb(${hor.join(',')})`);
        c.fillStyle = grd; c.fillRect(0, 0, W, H);
        const sx = 120 + ((90 - e) / 90) * 560, sy = H - 60 - Math.sin(M.rad(e)) * (H - 130);
        const halo = c.createRadialGradient(sx, sy, 10, sx, sy, 170); halo.addColorStop(0, sun.replace('rgb', 'rgba').replace(')', ',0.8)')); halo.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = halo; c.fillRect(0, 0, W, H);
        D.circle(c, sx, sy, 28, sun, 'rgba(255,255,255,.6)', 3);
        c.beginPath(); c.moveTo(0, H); c.lineTo(0, H - 50); c.quadraticCurveTo(160, H - 100, 300, H - 55); c.quadraticCurveTo(500, H - 110, 640, H - 60); c.lineTo(W, H - 70); c.lineTo(W, H); c.fillStyle = '#1D3B2A'; c.fill();
        D.char(c, 'lumi', W - 70, 60, 70, e < 10 ? 'wow' : 'happy');
      }
    });
  });
})();
