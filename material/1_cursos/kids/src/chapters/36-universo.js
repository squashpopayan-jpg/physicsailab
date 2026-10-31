/* Capítulo 36 — Galaxias y universo */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Máquina del tiempo de la luz ---------- */
  const OBJS = [
    ['🌙', 'la Luna', 4.06e-8, 'hace 1,3 segundos'], ['☀️', 'el Sol', 1.58e-5, 'hace 8 minutos y 20 segundos'], ['🪐', 'Neptuno', 4.75e-4, 'hace unas 4 horas'],
    ['⭐', 'Próxima Centauri', 4.24, 'hace 4,2 años'], ['🌟', 'Sirio, la estrella más brillante', 8.6, 'hace 8,6 años'], ['✨', 'las Pléyades', 444, 'hace 444 años, hacia 1580, cuando Galileo era un adolescente'],
    ['🔴', 'Betelgeuse', 550, 'hace unos 550 años'], ['🌌', 'el centro de la Vía Láctea', 26000, 'hace 26 000 años, en la última edad de hielo'], ['🌀', 'la galaxia de Andrómeda', 2.5e6, 'hace 2,5 millones de años, cuando aparecían los primeros humanos'], ['🔭', 'una galaxia del universo temprano', 1.34e10, 'hace 13 400 millones de años, ¡cuando el universo era un bebé!']
  ];
  const timeAgo = (ly) => (ly < 1.58e-5 ? FK.n(ly * 365.25 * 24 * 3600, ly * 365.25 * 24 * 3600 < 10 ? 1 : 0) + ' segundos' : ly < 1e-3 ? FK.n(ly * 365.25 * 24, 1) + ' horas' : ly < 1 ? FK.n(ly * 365.25, 0) + ' días' : ly < 1e4 ? FK.n(ly, ly < 10 ? 1 : 0) + ' años' : ly < 1e6 ? FK.n(ly / 1e3, 0) + ' mil años' : ly < 1e9 ? FK.n(ly / 1e6, 1) + ' millones de años' : FK.n(ly / 1e9, 1) + ' mil millones de años');
  FK.sim('mira-pasado', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('e', { label: 'Distancia (años luz, poderes de diez)', icon: '🔭', min: -8, max: 10.5, step: 0.05, value: 0, fmt: (v) => FK.pow10(v), unit: 'años luz' });
    g.out('t', 'Estás viendo el pasado', { icon: '⏳', hl: true }); g.out('v', 'Objetos visitados', { icon: '📍' });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Mueve la barra: cada objeto lo ves como era cuando salió su luz.'); },
      draw(c, W, H) {
        const e = g.p.e, ly = Math.pow(10, e);
        let bi = 0, bd = 99; OBJS.forEach((o, i) => { const d = Math.abs(Math.log10(o[2]) - e); if (d < bd) { bd = d; bi = i; } });
        const o = OBJS[bi], near = bd < 0.35;
        g.show('t', timeAgo(ly)); g.show('v', seen.size + ' de 10');
        if (near && !seen.has(bi)) { seen.add(bi); FK.sfx.pop(); g.say(`${o[0]} ${o[1]}: lo ves ${o[3]}.`, 'wow'); if (seen.size >= 5 && !g.won()) g.win('¡Cinco objetos! Cuanto más lejos miras, más antiguo es lo que ves.'); }
        D.night(c, W, H, 23, 90);
        D.emoji(c, near ? o[0] : '❓', W / 2, 120, near ? 96 : 70); D.text(c, near ? o[1] : 'espacio vacío…', W / 2, 190, { size: 26, align: 'center', color: '#fff', weight: 700 });
        D.text(c, near ? 'lo ves ' + o[3] : 'sigue explorando', W / 2, 224, { size: 17, align: 'center', color: '#FFE066' });
        const x0 = 40, x1 = W - 40, y = 300, X = (v) => x0 + ((v + 8) / 18.5) * (x1 - x0);
        D.box(c, x0 - 8, y - 7, x1 - x0 + 16, 14, 'rgba(255,255,255,.18)', { r: 7, stroke: 'rgba(255,255,255,.5)', lw: 2 });
        OBJS.forEach((q, i) => { const xx = X(Math.log10(q[2])); D.circle(c, xx, y, seen.has(i) ? 6 : 4, seen.has(i) ? '#FFC21A' : '#fff'); D.emoji(c, q[0], xx, y + (i % 2 ? 30 : -30), seen.has(i) ? 26 : 18); });
        const mx = X(e); D.poly(c, [[mx, y - 12], [mx - 9, y - 30], [mx + 9, y - 30]], '#FF4757', '#fff', 2);
        D.char(c, 'cosmo', 70, 70, 76, 'happy');
      }
    });
  });

  /* ---------- Globo en expansión ---------- */
  FK.sim('globo-expansion', function (g) {
    const ctx = g.canvas(1.9);
    g.slider('s', { label: 'Tamaño del universo', icon: '🎈', min: 1, max: 3, step: 0.05, value: 1, fmt: (v) => FK.n(v, 2) + ' ×' });
    g.button('▶ Dejar que se expanda', () => { S.auto = !S.auto; }, { kind: 'ghost' });
    g.out('d', 'Distancia a la galaxia marcada', { icon: '📏' }); g.out('v', 'Rapidez con que se aleja', { icon: '💨', hl: true });
    const S = { gal: [], ref: 0, tag: 0, s0: 1, auto: false, said: false, seenFar: false, seenBig: false };
    g.pointer({ down(x, y) { const sc = g.p.s; S.gal.forEach((p, i) => { const px = 400 + p[0] * sc, py = 220 + p[1] * sc; if (Math.hypot(x - px, y - py) < 22) { if (i !== S.ref) { S.tag = i; } } }); } });
    g.run({
      init() { S.gal = Array.from({ length: 22 }, (_, i) => [M.rnd(-340, 340) / 2.4, M.rnd(-190, 190) / 2.4]); S.ref = 0; S.gal[0] = [0, 0]; S.tag = 3; S.auto = false; S.said = false; g.setSlider('s', 1); g.say('Estás en la galaxia central (en amarillo). Infla el universo y mira cómo se alejan las demás.'); },
      step(dt) {
        if (S.auto) { g.setSlider('s', Math.min(3, g.p.s + dt * 0.25)); if (g.p.s >= 3) S.auto = false; }
        const sc = g.p.s, p = S.gal[S.tag] || S.gal[1], d = Math.hypot(p[0], p[1]) * sc, d0 = Math.hypot(p[0], p[1]);
        g.show('d', FK.n(d / 10, 1) + ' (millones de años luz)'); g.show('v', FK.n(C.hubble(d / 10), 0) + ' km/s' + (d0 > 120 ? ' 🏃 ¡rápida!' : ''));
        if (d0 > 110 && sc >= 1.8) S.seenFar = true; if (sc >= 2.5) S.seenBig = true;
        if (S.seenFar && S.seenBig && !g.won()) g.win('¡Mira! Cuanto más lejos está una galaxia, más rápido se aleja: ¡es la ley de Hubble!');
      },
      draw(c, W, H) {
        D.night(c, W, H, 13, 60); const sc = g.p.s;
        const pr = (p) => [400 + p[0] * sc, 220 + p[1] * sc];
        S.gal.forEach((p, i) => { if (i === 0) return; const [x, y] = pr(p); if (i === S.tag) D.line(c, 400, 220, x, y, '#FFE066', 2, [5, 6]); });
        S.gal.forEach((p, i) => { const [x, y] = pr(p); if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return; D.emoji(c, i === 0 ? '🌀' : '🌌', x, y, i === 0 ? 36 : 24); if (i === S.tag) D.circle(c, x, y, 22, null, '#FFE066', 3); });
        D.circle(c, 400, 220, 22, null, '#FFC21A', 4); D.text(c, 'tú estás aquí', 400, 262, { size: 13, align: 'center', color: '#FFE066' });
        D.text(c, 'toca una galaxia para marcarla', 14, 24, { size: 13, color: '#B9B3E6' });
        D.char(c, 'cosmo', W - 56, H - 56, 70, 'happy');
      }
    });
  });
})();
