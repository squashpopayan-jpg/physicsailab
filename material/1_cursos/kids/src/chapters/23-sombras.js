/* Capítulo 23 — La luz y las sombras */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Materiales ---------- */
  FK.sim('materiales-luz', function (g) {
    FK.kit.sort(g, [{ id: 'tr', label: 'Transparente', icon: '🔍' }, { id: 'tl', label: 'Translúcido', icon: '🌫️' }, { id: 'op', label: 'Opaco', icon: '⬛' }], [
      { t: '🪟 Vidrio de una ventana', bin: 'tr', why: 'Deja pasar casi toda la luz y se ve claro.' },
      { t: '💧 Agua limpia', bin: 'tr', why: 'Es transparente.' },
      { t: '🧻 Papel encerado', bin: 'tl', why: 'Deja pasar luz pero no se ve claro.' },
      { t: '🛁 Cortina de baño de plástico blanco', bin: 'tl', why: 'Deja pasar luz difusa.' },
      { t: '🧱 Ladrillo', bin: 'op', why: 'No deja pasar nada de luz.' },
      { t: '🪵 Madera', bin: 'op', why: 'La madera es opaca.' },
      { t: '🔦 Hoja de papel aluminio', bin: 'op', why: 'Es opaco: refleja la luz.' },
      { t: '👓 Lentes de sol', bin: 'tr', why: 'Dejan pasar parte de la luz, pero se ve a través.' }
    ], { need: 0.75 });
  });

  /* ---------- Teatro de sombras ---------- */
  FK.sim('sombras', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('d', { label: 'Distancia de la linterna al muñeco', icon: '↔️', min: 0.4, max: 3.2, step: 0.05, value: 2, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.slider('h', { label: 'Altura del muñeco', icon: '🧍', min: 0.3, max: 1.2, step: 0.05, value: 0.8, unit: 'm', fmt: (v) => FK.n(v, 2) });
    g.out('s', 'Altura de la sombra', { icon: '👤', hl: true }); g.out('goal', 'Meta', { icon: '🎯' });
    const WALL = 4;
    g.run({
      static: true,
      init() { g.show('goal', '2,00 m ± 0,10'); g.say('La pared está a 4 m de la linterna. ¿Dónde pones el muñeco para que su sombra mida 2 m?'); },
      draw(c, W, H) {
        const d = g.p.d, h = g.p.h, sh = C.shadowHeight(h, d, WALL);
        g.show('s', FK.n(sh, 2) + ' m');
        if (Math.abs(sh - 2) <= 0.1 && !g.won()) g.win(`¡Sombra de ${FK.n(sh, 2)} m! Es la altura multiplicada por (4 ÷ ${FK.n(d, 2)}).`);
        D.night(c, W, H, 11, 30);
        const x0 = 70, k = (W - 150) / WALL, wallX = x0 + WALL * k, gy = H - 40, pxm = 82;
        D.rr(c, wallX, 20, 24, gy - 20, 6); c.fillStyle = '#E8E0D0'; c.fill();
        D.ground(c, W, gy, H, '#3A3A6A', '#2A2A55');
        /* cono de luz y sombra (linterna a ras del piso) */
        const ly = gy - 8, ox = x0 + d * k, oyT = gy - h * pxm, topY = Math.max(24, gy - sh * pxm);
        const grad = c.createLinearGradient(x0, 0, wallX, 0); grad.addColorStop(0, 'rgba(255,240,160,.65)'); grad.addColorStop(1, 'rgba(255,240,160,.12)');
        c.beginPath(); c.moveTo(x0, ly); c.lineTo(wallX, 0); c.lineTo(wallX, gy); c.closePath(); c.fillStyle = grad; c.fill();
        c.beginPath(); c.moveTo(ox, oyT); c.lineTo(wallX, topY); c.lineTo(wallX, gy); c.lineTo(ox, gy); c.closePath(); c.fillStyle = 'rgba(15,12,50,.55)'; c.fill();
        c.fillStyle = 'rgba(20,18,60,.95)'; c.fillRect(wallX, topY, 24, gy - topY);
        D.line(c, wallX - 10, topY, wallX + 40, topY, '#FF4757', 3);
        D.line(c, wallX + 36, gy, wallX + 36, topY, '#FF4757', 3); D.tag(c, FK.n(sh, 2) + ' m', wallX + 36, Math.max(40, topY + 20), '#fff', { size: 14 });
        /* objeto y linterna */
        D.box(c, ox - 12, oyT, 24, h * pxm, '#FF8A1F', { r: 8 }); D.emoji(c, '🧸', ox, oyT + 20, 30);
        D.emoji(c, '🔦', x0 - 10, gy - 22, 44);
        const goalY = gy - 2 * pxm; D.line(c, wallX - 30, goalY, wallX, goalY, '#12B76A', 3, [6, 4]); D.tag(c, 'meta 2 m', wallX - 70, goalY, '#B8F2D0', { size: 12 });
        D.char(c, 'lumi', 600, 70, 72, 'wow');
      }
    });
  });

  /* ---------- Cámara oscura ---------- */
  FK.sim('camara-oscura', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('a', { label: 'Tamaño del agujero', icon: '⚫', min: 0.5, max: 12, step: 0.5, value: 6, unit: 'mm', fmt: (v) => FK.n(v, 1) });
    g.slider('s', { label: 'Profundidad de la caja', icon: '📦', min: 10, max: 40, step: 1, value: 25, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.out('h', 'Alto de la imagen', { icon: '📏' }); g.out('b', 'Borrosidad', { icon: '🌫️' }); g.out('l', 'Brillo', { icon: '💡' });
    const OBJ = 300, OH = 120; /* árbol de 1,2 m a 3 m */
    g.run({
      static: true,
      init() { g.say('Un árbol de 1,2 m está a 3 m de la caja. Cambia el agujero y la profundidad.'); },
      draw(c, W, H) {
        const r = C.pinhole(OH, OBJ, g.p.s, g.p.a / 10);
        g.show('h', FK.n(r.h, 1) + ' cm'); g.show('b', FK.n(r.blur * 10, 1) + ' mm'); g.show('l', FK.n(r.bright * 100, 0) + ' %');
        if (g.p.a <= 2 && r.h >= 8 && !g.won()) g.win(`¡Imagen nítida de ${FK.n(r.h, 1)} cm, al revés! Pero mira: es más tenue.`);
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const bx = 330, bw = 320, by = 80, bh = 260;
        D.box(c, bx, by, bw, bh, '#3A3A5A', { r: 10 });
        D.box(c, bx + bw - 14, by + 30, 14, bh - 60, '#F4EFE0', { r: 3, lw: 2 });
        const holeY = by + bh / 2, hole = 3 + g.p.a * 0.8;
        D.box(c, bx - 6, holeY - hole / 2, 12, hole, '#FFE9C7', { r: 2, lw: 1.5 });
        D.emoji(c, '🌳', 120, holeY, 110);
        const k = (g.p.s) / (OBJ); /* escala */
        D.line(c, 120, holeY - 50, bx, holeY, 'rgba(255,194,26,.8)', 3); D.line(c, 120, holeY + 50, bx, holeY, 'rgba(255,194,26,.8)', 3);
        const iy = r.h * 5, blur = M.clamp(r.blur * 10, 0.5, 20);
        const sx = bx + bw - 7;
        c.save(); c.globalAlpha = M.clamp(0.25 + r.bright * 0.9, 0.2, 1); c.filter = `blur(${blur * 0.6}px)`; c.translate(sx - 70, holeY); c.scale(1, -1); c.font = `${Math.max(24, iy)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🌳', 0, 0); c.restore();
        D.line(c, bx, holeY, bx + bw - 14, holeY - 50 * k * 1.6, 'rgba(255,194,26,.6)', 3); D.line(c, bx, holeY, bx + bw - 14, holeY + 50 * k * 1.6, 'rgba(255,194,26,.6)', 3);
        D.tag(c, 'imagen al revés', bx + bw - 60, by - 14, '#fff', { size: 14 });
        D.char(c, 'lumi', 700, 60, 70, 'happy');
      }
    });
  });
})();
