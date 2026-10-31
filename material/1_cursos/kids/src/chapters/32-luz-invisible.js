/* Capítulo 32 — La luz invisible */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La escalera de las ondas ---------- */
  const BANDS = [
    { id: 'radio', n: 'Ondas de radio', e: '📻', lo: 1, hi: 4, comp: 'desde una puerta hasta un edificio y más', uso: 'Radio, televisión y celulares (FM mide unos 3 m; AM, unos 300 m).', col: '#7B7A99' },
    { id: 'micro', n: 'Microondas', e: '🍿', lo: -3, hi: 0, comp: 'del tamaño de una mano o una persona', uso: 'Hornos de microondas (12 cm), Wi-Fi, GPS y radares.', col: '#FF8A1F' },
    { id: 'ir', n: 'Infrarrojo', e: '🔥', lo: -6.15, hi: -3, comp: 'desde una cabeza de alfiler hasta una bacteria', uso: 'El calor que sientes, controles remotos y cámaras térmicas.', col: '#FF4757' },
    { id: 'vis', n: 'Luz visible', e: '🌈', lo: -6.4, hi: -6.15, comp: 'del tamaño de una bacteria', uso: 'Todo lo que ves: del violeta (400 nm) al rojo (700 nm).', col: '#12B76A' },
    { id: 'uv', n: 'Ultravioleta', e: '☀️', lo: -8, hi: -6.4, comp: 'del tamaño de un virus', uso: 'Bronceado y quemaduras de sol, lámparas que matan gérmenes, flores que ven las abejas.', col: '#8E5CF6' },
    { id: 'x', n: 'Rayos X', e: '🩻', lo: -11, hi: -8, comp: 'del tamaño de un átomo', uso: 'Radiografías de huesos y revisión de equipaje en aeropuertos.', col: '#1E88FF' },
    { id: 'gamma', n: 'Rayos gamma', e: '☢️', lo: -14, hi: -11, comp: 'del tamaño de un núcleo atómico', uso: 'Esterilizar herramientas, tratar el cáncer y las explosiones de estrellas.', col: '#B8146A' }
  ];
  FK.sim('escalera-ondas', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('e', { label: 'Longitud de onda (poderes de diez)', icon: '🪜', min: -14, max: 4, step: 0.05, value: -6.3, fmt: (v) => FK.pow10(v), unit: 'm' });
    g.out('f', 'Frecuencia', { icon: '🎵' }); g.out('b', 'Familia visitada', { icon: '👣', hl: true });
    const seen = new Set();
    const bandOf = (e) => BANDS.find((b) => e >= b.lo && e <= b.hi) || BANDS[0];
    g.run({
      static: true,
      init() { seen.clear(); g.say('Mueve la barra para recorrer todas las ondas, de las más largas a las más cortas.'); },
      draw(c, W, H) {
        const e = g.p.e, b = bandOf(e), lam = Math.pow(10, e), f = C.VLIGHT / lam;
        g.show('f', FK.nice(f) + ' Hz'); if (!seen.has(b.id)) { seen.add(b.id); FK.sfx.pop(); g.say(`${b.e} ${b.n}: ${b.uso}`, 'wow'); }
        g.show('b', seen.size + ' de 7');
        if (seen.size >= 6 && !g.won()) g.win('¡Recorriste el espectro! Todas son luz, pero con distinta longitud de onda.');
        D.night(c, W, H, 4, 40);
        /* barra del espectro */
        const x0 = 40, x1 = W - 40, y = 300;
        BANDS.forEach((bb) => { const xa = x0 + ((4 - bb.hi) / 18) * (x1 - x0), xb = x0 + ((4 - bb.lo) / 18) * (x1 - x0); c.fillStyle = bb.col; c.globalAlpha = bb.id === b.id ? 1 : 0.55; c.fillRect(xa, y, xb - xa, 36); c.globalAlpha = 1; });
        const g2 = c.createLinearGradient(x0 + ((4 + 6.4) / 18) * (x1 - x0), 0, x0 + ((4 + 6.15) / 18) * (x1 - x0), 0); for (let i = 0; i <= 6; i++) g2.addColorStop(i / 6, D.wave(400 + i * 50)); c.fillStyle = g2; const va = x0 + ((4 + 6.15) / 18) * (x1 - x0), vb = x0 + ((4 + 6.4) / 18) * (x1 - x0); c.fillRect(Math.min(va, vb) - 4, y - 8, Math.abs(vb - va) + 8, 52);
        BANDS.forEach((bb) => { const xa = x0 + ((4 - bb.hi) / 18) * (x1 - x0), xb = x0 + ((4 - bb.lo) / 18) * (x1 - x0); D.emoji(c, bb.e, (xa + xb) / 2, y + 62, seen.has(bb.id) ? 28 : 20); });
        const mx = x0 + ((4 - e) / 18) * (x1 - x0); D.poly(c, [[mx, y - 4], [mx - 10, y - 24], [mx + 10, y - 24]], '#FFC21A', '#fff', 2);
        /* onda */
        const cyc = M.clamp(8 - (e + 14) * 0.4, 1.5, 12), amp = 40; c.beginPath(); for (let x = 40; x <= W - 40; x += 3) { const yy = 120 + Math.sin(((x - 40) / (W - 80)) * cyc * M.TAU - g.t * 4) * amp; x === 40 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.strokeStyle = b.col === '#7B7A99' ? '#BFC5E8' : b.col; c.lineWidth = 6; c.stroke();
        D.text(c, `${b.e} ${b.n}`, W / 2, 34, { size: 26, align: 'center', color: '#fff', weight: 700 }); D.text(c, 'tamaño: ' + b.comp, W / 2, 66, { size: 16, align: 'center', color: '#FFE066' });
        D.text(c, 'ondas largas', x0, y + 100, { size: 14, color: '#B9B3E6' }); D.text(c, 'ondas cortas', x1, y + 100, { size: 14, color: '#B9B3E6', align: 'right' });
      }
    });
  });

  /* ---------- ¿Qué onda usa? ---------- */
  FK.sim('que-onda', function (g) {
    FK.kit.match(g, [
      ['📺 El control remoto de la tele', 'Infrarrojo'], ['📻 Una estación de radio FM', 'Ondas de radio'], ['🍿 El horno de microondas', 'Microondas'],
      ['🩻 Ver un hueso roto', 'Rayos X'], ['🏖️ Una quemadura de sol', 'Ultravioleta'], ['👀 Lo que ves con tus ojos', 'Luz visible'], ['☢️ Núcleos radiactivos y estrellas explosivas', 'Rayos gamma']
    ]);
  });

  /* ---------- Cámara IR ---------- */
  const THINGS = [['🐈', 'Gato', 34, 120, 270], ['🧍', 'Persona', 33, 220, 250], ['☕', 'Taza de té', 70, 330, 290], ['🧊', 'Hielo', 0, 420, 300], ['🪟', 'Ventana fría', 12, 540, 190], ['🚗', 'Motor del carro', 60, 650, 290], ['🌳', 'Árbol', 18, 80, 180]];
  FK.sim('camara-ir', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('v', { label: 'Cámara', icon: '📷', options: [['vis', 'Visible', '👁️'], ['ir', 'Infrarroja', '🔥'], ['uv', 'Ultravioleta', '☀️']], value: 'vis' });
    g.out('t', 'Temperatura leída', { icon: '🌡️', hl: true });
    const S = { t: { vis: 0, ir: 0, uv: 0 }, read: new Set(), sel: -1 };
    g.pointer({ down(x, y) { if (g.p.v !== 'ir') return; THINGS.forEach((t, i) => { if (Math.hypot(x - t[3], y - t[4]) < 50) { S.sel = i; S.read.add(i); FK.sfx.tick(); g.show('t', t[1] + ': ' + t[2] + ' °C'); } }); } });
    g.run({
      init() { S.t = { vis: 0, ir: 0, uv: 0 }; S.read.clear(); S.sel = -1; g.show('t', '—'); g.say('Cambia de cámara. En infrarrojo, toca los objetos para leer su temperatura.'); },
      step(dt) { S.t[g.p.v] += dt; if (S.t.ir > 1.5 && S.t.uv > 1.5 && S.read.size >= 2 && !g.won()) g.win('¡Viste lo invisible! Todo lo que tiene temperatura emite infrarrojo, y las abejas ven dibujos en ultravioleta.'); },
      draw(c, W, H) {
        const v = g.p.v;
        D.sky(c, W, H, v === 'ir' ? '#14123F' : v === 'uv' ? '#2A1560' : '#BFE9FF', v === 'ir' ? '#1B1850' : v === 'uv' ? '#4A2A8C' : '#EAF8FF');
        D.ground(c, W, H - 40, H, v === 'ir' ? '#1E1B5C' : v === 'uv' ? '#3A2A7A' : '#7ED957', v === 'ir' ? '#15134A' : v === 'uv' ? '#2A1A5A' : '#B9824A');
        THINGS.forEach((t, i) => {
          const [em, nm, T, x, y] = t;
          if (v === 'ir') { const hc = D.heat((T + 10) / 80); const gr = c.createRadialGradient(x, y, 6, x, y, 62); gr.addColorStop(0, hc); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, 62, 0, M.TAU); c.fill(); D.circle(c, x, y, 28, hc, 'rgba(255,255,255,.5)', 2); D.text(c, T + '°', x, y, { size: 16, align: 'center', color: '#fff', weight: 700 }); D.text(c, nm, x, y + 52, { size: 12, align: 'center', color: '#fff' }); if (S.sel === i) D.circle(c, x, y, 40, null, '#fff', 3); }
          else if (v === 'vis') D.emoji(c, em, x, y, 56);
          else { c.globalAlpha = 0.5; D.emoji(c, em, x, y, 44); c.globalAlpha = 1; }
        });
        if (v === 'vis') { D.sun(c, W - 60, 60, 26, g.t); D.text(c, 'luz visible', 14, 24, { size: 16, weight: 700 }); }
        if (v === 'ir') D.text(c, 'infrarrojo: colores = temperatura', 14, 24, { size: 16, color: '#fff', weight: 700 });
        if (v === 'uv') {
          D.text(c, 'ultravioleta: lo que ve una abeja', 14, 24, { size: 16, color: '#fff', weight: 700 });
          const fx = 420, fy = 130; for (let i = 0; i < 10; i++) { const a = (i / 10) * M.TAU; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(fx + Math.cos(a) * 46, fy + Math.sin(a) * 46, 24, 14, a, 0, M.TAU); c.fill(); } D.circle(c, fx, fy, 38, '#3A1E8C', '#fff', 3); D.circle(c, fx, fy, 16, '#FFFFFF');
          D.text(c, 'flor con «pista» para abejas', fx, fy + 96, { size: 14, align: 'center', color: '#E9DDFF' });
          D.sun(c, W - 60, 70, 26, g.t); D.tag(c, 'UV del Sol', W - 60, 120, '#E9DDFF', { size: 13 });
        }
        D.char(c, 'lumi', W - 60, H - 70, 70, v === 'vis' ? 'happy' : 'wow');
      }
    });
  });
})();
