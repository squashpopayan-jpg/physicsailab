/* Capítulo 30 — Los imanes */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  const bar = (c, x, y, w, h, flip) => {
    const a = flip ? '#1E88FF' : '#FF4757', b = flip ? '#FF4757' : '#1E88FF';
    D.rr(c, x, y, w / 2, h, 8); c.fillStyle = a; c.fill(); D.rr(c, x + w / 2, y, w / 2, h, 8); c.fillStyle = b; c.fill();
    D.box(c, x, y, w, h, 'rgba(0,0,0,0)', { r: 8, lw: 4 });
    D.text(c, flip ? 'S' : 'N', x + w / 4, y + h / 2, { size: 26, align: 'center', color: '#fff', weight: 700 }); D.text(c, flip ? 'N' : 'S', x + (3 * w) / 4, y + h / 2, { size: 26, align: 'center', color: '#fff', weight: 700 });
  };

  /* ---------- Atracción y repulsión ---------- */
  FK.sim('polos', function (g) {
    const ctx = g.canvas(2.6);
    g.button('🔄 Girar el imán azul', () => { S.flip = !S.flip; S.v = 0; }, { kind: 'ghost' });
    g.out('est', 'Estado', { icon: '🧲', hl: true });
    const AW = 150, BH = 56, AX = 120, CY = 170;
    const S = { x: 560, v: 0, drag: false, flip: false, att: false, rep: false, gx: 0 };
    g.pointer({
      down(x, y) { if (Math.abs(y - CY) < 60 && x > S.x - 10 && x < S.x + AW + 10) { S.drag = true; S.gx = x - S.x; S.v = 0; } },
      move(x, y, e, down) { if (down && S.drag) { S.x = M.clamp(x - S.gx, AX + AW + 4, 640); S.v = 0; } },
      up() { S.drag = false; }
    });
    g.run({
      init() { S.x = 560; S.v = 0; S.drag = false; S.flip = false; g.say('El imán rojo-azul está fijo. Arrastra el otro hacia él y suéltalo.'); },
      step(dt) {
        const gap = Math.max(8, S.x - (AX + AW)); /* A: N|S ; frente a B su polo S */
        const bLeftIsN = !S.flip; /* B: N|S normal, de modo que su polo izquierdo es N (atrae al S de A) */
        const F = C.magnetForce(gap / 40) * (bLeftIsN ? 1 : -1); /* + atrae */
        g.show('est', S.x - (AX + AW) < 6 ? '✊ pegados' : bLeftIsN ? '🧲 se atraen' : '↔️ se rechazan');
        if (!S.drag) {
          S.v += (-F * 3000 - S.v * 4) * dt * 1; S.x += S.v * dt;
          if (S.x < AX + AW + 3) { S.x = AX + AW + 3; if (S.v < 0) { S.v = 0; if (bLeftIsN && !S.att) { S.att = true; FK.sfx.pop(); g.say('¡Clac! Polos distintos se atraen y se pegaron.', 'wow'); } } }
          if (S.x > 640) { S.x = 640; S.v = 0; }
          if (!bLeftIsN && S.x > AX + AW + 200 && !S.rep) { S.rep = true; g.say('¡Fuera! Polos iguales se rechazan: el imán salió empujado.', 'wow'); FK.sfx.ok(); }
          if (S.att && S.rep && !g.won()) g.win('¡Las dos cosas! Polos distintos se atraen y polos iguales se repelen.');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB'); D.ground(c, W, H - 50, H, '#C9C9D9', '#9A9AB5');
        bar(c, AX, CY - BH / 2, AW, BH, false);
        bar(c, S.x, CY - BH / 2, AW, BH, S.flip);
        const gap = S.x - (AX + AW);
        if (gap > 20) { const bLeftIsN = !S.flip, L = Math.min(120, 3000 / (gap + 30)); D.arrow(c, AX + AW + gap / 2 - L, CY - 70, AX + AW + gap / 2 + L, CY - 70, bLeftIsN ? '#12B76A' : '#FF4757', 8); if (bLeftIsN) { D.arrow(c, AX + AW + gap / 2 + L, CY - 70, AX + AW + gap / 2 - L, CY - 70, '#12B76A', 8); } }
        D.text(c, S.drag ? '✋ arrastrando' : 'arrástralo →', S.x + AW / 2, CY + 70, { size: 16, align: 'center', weight: 700 });
        D.char(c, 'chispa', W - 60, 50, 64, 'happy');
      }
    });
  });

  /* ---------- Limaduras y brújula ---------- */
  FK.sim('limaduras', function (g) {
    const ctx = g.canvas(2);
    g.choice('vista', { label: 'Mostrar', icon: '👁️', options: [['lim', 'Limaduras'], ['lin', 'Líneas del campo']], value: 'lim' });
    g.out('v', 'Zonas visitadas con la brújula', { icon: '🧭', hl: true });
    const CX = 400, CY = 200, HL = 70; /* semilongitud del imán */
    const S = { cx: 600, cy: 120, zones: new Set(), drag: false };
    const field = (x, y) => { /* campo de dos polos magnéticos: N a la izquierda (−HL), S a la derecha */
      let bx = 0, by = 0;
      for (const [px, q] of [[CX - HL, 1], [CX + HL, -1]]) { const dx = x - px, dy = y - CY, r2 = dx * dx + dy * dy + 100, r3 = Math.pow(r2, 1.5); bx += (q * dx) / r3; by += (q * dy) / r3; }
      return [bx, by];
    };
    g.pointer({ down(x, y) { S.drag = Math.hypot(x - S.cx, y - S.cy) < 50; }, move(x, y, e, down) { if (down && S.drag) { S.cx = M.clamp(x, 30, 770); S.cy = M.clamp(y, 30, 370); const dx = S.cx - CX, dy = S.cy - CY; if (Math.hypot(dx, dy) > 95) { const z = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'izq' : 'der') : dy < 0 ? 'arr' : 'aba'; S.zones.add(z); g.show('v', S.zones.size + ' de 4'); if (S.zones.size >= 4 && !g.won()) g.win('¡Alrededor del imán! La brújula siempre se alinea con las líneas del campo.'); } } }, up() { S.drag = false; } });
    g.run({
      static: true,
      init() { S.zones.clear(); g.show('v', '0 de 4'); g.say('Arrastra la brújula por arriba, abajo, izquierda y derecha del imán.'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFFBF2', '#FFF1D9');
        if (g.p.vista === 'lim') {
          c.lineWidth = 2; c.lineCap = 'round';
          for (let y = 12; y < H; y += 16) for (let x = 12; x < W; x += 16) {
            if (Math.abs(x - CX) < HL + 4 && Math.abs(y - CY) < 22) continue;
            const [bx, by] = field(x, y), m = Math.hypot(bx, by), s = M.clamp(Math.sqrt(m) * 70, 0.25, 1), a = Math.atan2(by, bx), L = 6 + 3 * s;
            c.strokeStyle = `rgba(43,35,80,${0.25 + 0.7 * s})`; c.beginPath(); c.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
          }
        } else {
          c.lineWidth = 3;
          for (let a0 = 50; a0 <= 310; a0 += 20) {
            const an = M.rad(a0); let x = CX - HL + 14 * Math.cos(an), y = CY + 14 * Math.sin(an); const pts = [[x, y]];
            for (let i = 0; i < 500; i++) { const [bx, by] = field(x, y), m = Math.hypot(bx, by); x += (bx / m) * 4; y += (by / m) * 4; if (Math.hypot(x - (CX + HL), y - CY) < 12 || x < -50 || x > 850 || y < -50 || y > 450) break; pts.push([x, y]); }
            c.strokeStyle = 'rgba(142,92,246,.8)'; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
          }
        }
        bar(c, CX - HL, CY - 20, HL * 2, 40, false);
        /* brújula */
        const [bx, by] = field(S.cx, S.cy), a = Math.atan2(by, bx);
        D.circle(c, S.cx, S.cy, 40, '#fff', D.INK, 4);
        c.save(); c.translate(S.cx, S.cy); c.rotate(a);
        D.poly(c, [[34, 0], [-4, -8], [-4, 8]], '#FF4757', D.INK, 2); D.poly(c, [[-34, 0], [4, -8], [4, 8]], '#1E88FF', D.INK, 2); c.restore();
        D.circle(c, S.cx, S.cy, 4, D.INK);
        D.text(c, S.drag ? '' : '👆 arrástrame', S.cx, S.cy + 56, { size: 14, align: 'center' });
      }
    });
  });

  /* ---------- El imán de la Tierra ---------- */
  FK.sim('brujula-tierra', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('lat', { label: 'Latitud (modelo de imán simple)', icon: '🌍', min: -90, max: 90, step: 1, value: 0, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.out('dip', 'Inclinación de la brújula', { icon: '🧭', hl: true }); g.out('lug', 'Lugar', { icon: '📍' });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Desplaza la brújula del ecuador al polo y fíjate cómo se inclina.'); },
      draw(c, W, H) {
        const lat = g.p.lat, dip = C.dipAngle(lat), cx = 240, cy = H / 2, R = 150;
        const zone = Math.abs(lat) <= 3 ? 'ecuador' : Math.abs(lat) >= 85 ? 'polo' : Math.abs(lat - 45) <= 3 || Math.abs(lat + 45) <= 3 ? 'medio' : null;
        g.show('dip', FK.n(Math.abs(dip), 0) + '° ' + (dip > 0.5 ? '(hacia abajo)' : dip < -0.5 ? '(hacia arriba)' : '(horizontal)')); g.show('lug', zone === 'ecuador' ? 'cerca del ecuador' : zone === 'polo' ? 'cerca de un polo' : lat > 0 ? 'hemisferio norte' : 'hemisferio sur');
        if (zone && !seen.has(zone)) { seen.add(zone); FK.sfx.ok(); if (seen.size >= 3 && !g.won()) g.win('¡Visitaste el ecuador, la latitud media y el polo! La brújula se inclina más a medida que te acercas a los polos.'); }
        D.sky(c, W, H, '#E6F4FF', '#F8FCFF');
        D.circle(c, cx, cy, R, '#6CC3FF', D.INK, 5);
        c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, 0); c.fillStyle = 'rgba(92,208,104,.5)'; c.lineTo(cx, cy); c.fill();
        /* líneas de campo del dipolo */
        c.lineWidth = 2; c.strokeStyle = 'rgba(142,92,246,.7)';
        for (const L of [1.7, 2.4, 3.3]) { c.beginPath(); for (let th = 0.12; th < Math.PI - 0.12; th += 0.04) { const r = L * R * Math.sin(th) ** 2 * 0.95; const x = cx + r * Math.sin(th), y = cy - r * Math.cos(th); th === 0.12 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.beginPath(); for (let th = 0.12; th < Math.PI - 0.12; th += 0.04) { const r = L * R * Math.sin(th) ** 2 * 0.95; const x = cx - r * Math.sin(th), y = cy - r * Math.cos(th); th === 0.12 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
        D.box(c, cx - 24, cy - R - 60, 48, 120 + 2 * R - 120 + 0, 'rgba(0,0,0,0)', { r: 0, stroke: false });
        D.text(c, 'N', cx, cy - R - 16, { size: 20, align: 'center', weight: 700 }); D.text(c, 'S', cx, cy + R + 18, { size: 20, align: 'center', weight: 700 });
        /* lugar */
        const a = M.rad(lat), px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
        D.emoji(c, '📍', px, py - 8, 26);
        /* brújula 3D simplificada a la derecha */
        const kx = 600, ky = H / 2;
        D.circle(c, kx, ky, 90, '#fff', D.INK, 5); D.text(c, 'horizonte', kx, ky + 112, { size: 14, align: 'center' }); D.text(c, '(vista de lado)', kx, ky + 130, { size: 12, align: 'center', color: D.INK });
        D.line(c, kx - 90, ky, kx + 90, ky, 'rgba(43,35,80,.3)', 2, [6, 6]);
        const d = M.rad(dip); c.save(); c.translate(kx, ky); c.rotate(d);
        D.poly(c, [[80, 0], [-6, -10], [-6, 10]], '#FF4757', D.INK, 3); D.poly(c, [[-80, 0], [6, -10], [6, 10]], '#1E88FF', D.INK, 3); c.restore();
        D.text(c, 'N →', kx + 105, ky, { size: 14 });
        D.char(c, 'chispa', W - 60, 50, 64, 'happy');
      }
    });
  });
})();
