/* Capítulo 12 — Flotar y hundirse */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- ¿Flota o se hunde? ---------- */
  const OBJ = { ping: ['🏓', 'Pelota de ping-pong', 0.08], madera: ['🪵', 'Madera', 0.6], manzana: ['🍎', 'Manzana', 0.8], hielo: ['🧊', 'Hielo', 0.92], huevo: ['🥚', 'Huevo', 1.08], piedra: ['🪨', 'Piedra', 2.7], moneda: ['🪙', 'Moneda', 8.0], tornillo: ['🔩', 'Tornillo de acero', 7.8] };
  const LIQ = { agua: ['Agua', 1.0, '#7FC7FF'], mar: ['Agua de mar', 1.025, '#5BB0F0'], sal: ['Agua muy salada', 1.2, '#7FE0D0'], aceite: ['Aceite', 0.92, '#FFE066'], miel: ['Miel', 1.4, '#E8A020'] };
  FK.sim('hundir-flotar', function (g) {
    const ctx = g.canvas(2.1);
    g.choice('obj', { label: 'Objeto', icon: '🎒', options: Object.keys(OBJ).map((k) => [k, OBJ[k][1].replace('Pelota de ', '').replace('Tornillo de acero', 'Tornillo'), OBJ[k][0]]), value: 'madera', reset: true });
    g.choice('liq', { label: 'Líquido', icon: '🥛', options: Object.keys(LIQ).map((k) => [k, LIQ[k][0]]), value: 'agua', reset: true });
    g.choice('pred', { label: 'Mi predicción', icon: '🤔', options: [['flota', 'Flota', '🛟'], ['hunde', 'Se hunde', '⚓']], value: 'flota' });
    g.button('¡Soltar!', () => { if (S.st === 'ready') { S.st = 'drop'; FK.sfx.pop(); } }, { icon: '⬇️' });
    g.out('d', 'Densidad del objeto', { icon: '⚖️' }); g.out('l', 'Densidad del líquido', { icon: '🥛' }); g.out('ok', 'Aciertos', { icon: '⭐', hl: true });
    const S = { st: 'ready', y: 0, vy: 0, ok: 0, settled: false };
    g.run({
      init() { S.st = 'ready'; S.y = 0; S.vy = 0; S.inw = false; g.show('d', FK.n(OBJ[g.p.obj][2], 2) + ' g/cm³'); g.show('l', FK.n(LIQ[g.p.liq][1], 3) + ' g/cm³'); g.show('ok', S.ok + ' de 5'); g.say('Elige un objeto y un líquido, haz tu predicción y suelta.'); },
      step(dt) {
        if (S.st !== 'drop') return;
        const od = OBJ[g.p.obj][2], ld = LIQ[g.p.liq][1], floats = od < ld, frac = Math.min(1, od / ld);
        let done = false;
        if (!S.inw) { S.vy += 3.2 * dt; S.y += S.vy * dt; if (S.y >= 0.25) { S.inw = true; S.tin = 0; S.vy *= 0.3; } }
        else {
          S.tin += dt;
          if (floats) { S.vy += ((0.25 - S.y) * 60 - 7 * S.vy) * dt; S.y += S.vy * dt; if (S.tin > 1.4) done = true; }
          else { S.y += 0.55 * dt; if (S.y >= 0.92) { S.y = 0.92; done = true; } }
        }
        if (done) {
          S.st = 'done'; const res = floats ? 'flota' : 'hunde';
          if (res === g.p.pred) { S.ok++; g.show('ok', S.ok + ' de 5'); FK.sfx.ok(); g.say(floats ? `¡Acertaste! Flota porque ${FK.n(od, 2)} < ${FK.n(ld, 2)}. Tiene sumergido el ${FK.n(frac * 100, 0)} % de su volumen.` : `¡Acertaste! Se hunde porque ${FK.n(od, 2)} > ${FK.n(ld, 2)}.`, 'wow'); if (S.ok >= 5) { g.win('¡5 aciertos! Ya sabes cuándo algo flota.'); S.ok = 0; } }
          else { FK.sfx.no(); g.say(floats ? `No era eso: flota porque su densidad (${FK.n(od, 2)}) es menor que la del líquido (${FK.n(ld, 2)}).` : `No era eso: se hunde porque su densidad (${FK.n(od, 2)}) es mayor que la del líquido (${FK.n(ld, 2)}).`, 'think'); }
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const x0 = 220, w = 360, top = 60, bot = H - 30, lvl = top + (bot - top) * 0.25;
        c.fillStyle = LIQ[g.p.liq][2]; c.globalAlpha = 0.75; c.fillRect(x0, lvl, w, bot - lvl); c.globalAlpha = 1;
        D.line(c, x0, lvl, x0 + w, lvl, 'rgba(255,255,255,.8)', 3);
        c.beginPath(); c.moveTo(x0, top - 20); c.lineTo(x0, bot); c.lineTo(x0 + w, bot); c.lineTo(x0 + w, top - 20); c.strokeStyle = D.INK; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke();
        const od = OBJ[g.p.obj][2], ld = LIQ[g.p.liq][1], frac = Math.min(1, od / ld);
        const y = top + (bot - top - 20) * S.y;
        D.emoji(c, OBJ[g.p.obj][0], x0 + w / 2, S.st === 'ready' ? top - 40 : y - (od < ld && S.st === 'done' ? 10 : 0), 60);
        D.char(c, 'gotin', 90, H - 80, 100, S.st === 'done' ? 'wow' : 'happy');
        D.tag(c, OBJ[g.p.obj][1], x0 + w + 90, 60, '#fff', { size: 15 });
        if (S.st === 'done' && od < ld) D.tag(c, `sumergido: ${FK.n(frac * 100, 0)} %`, x0 + w + 90, 100, '#B8F2D0', { size: 14 });
      }
    });
  });

  /* ---------- Barco con contenedores ---------- */
  FK.sim('barco', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('A', { label: 'Tamaño del casco', icon: '🚢', options: [[20, 'Pequeño (20 m²)'], [40, 'Mediano (40 m²)'], [80, 'Grande (80 m²)']], value: 20 });
    g.choice('liq', { label: 'Agua', icon: '🌊', options: [[1000, 'Río'], [1025, 'Mar']], value: 1000 });
    g.slider('n', { label: 'Contenedores (5 toneladas cada uno)', icon: '📦', min: 0, max: 30, step: 1, value: 4, fmt: (v) => FK.n(v, 0) });
    g.out('m', 'Masa total', { icon: '⚖️' }); g.out('d', 'Se hunde en el agua', { icon: '📏', hl: true });
    const HULL = 2000, CONT = 5000, HEIGHT = 3;
    const S = { y: 0, sunk: false };
    g.run({
      static: false,
      init() { S.y = 0; g.say('El barco vacío pesa 2 toneladas y el casco tiene 3 m de altura. ¡Carga contenedores sin que entre agua!'); },
      step(dt) {
        const m = HULL + CONT * g.p.n, d = C.draft(m, g.p.liq, g.p.A);
        g.show('m', FK.n(m / 1000, 0) + ' t'); g.show('d', FK.n(d, 2) + ' m' + (d > HEIGHT ? ' 😱' : ''));
        const target = d > HEIGHT ? 1 : 0;
        S.sunk = d > HEIGHT;
        S.y += ((S.sunk ? 4 : 0) - S.y) * Math.min(1, dt * 0.9);
        if (!S.sunk && g.p.n >= 10 && !S.said) { S.said = true; g.win(`¡10 contenedores o más sin hundirse! (${FK.n(m / 1000, 0)} toneladas en total)`); }
        if (S.sunk && !S.warn) { S.warn = true; FK.sfx.no(); g.say('¡Glub! Entró agua por la cubierta. Usa un casco más grande o menos contenedores.', 'sad'); }
        if (!S.sunk) S.warn = false;
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.cloud(c, 80, 60, 1); D.cloud(c, 560, 90, 1.2);
        const wl = 250, sc = 60; /* px por metro */
        const m = HULL + CONT * g.p.n, d = C.draft(m, g.p.liq, g.p.A);
        const wid = 200 + g.p.A * 3, cx = 400, sink = Math.min(S.y, 6);
        const hullTop = wl - (HEIGHT - Math.min(d, HEIGHT + 2)) * sc + sink * 20, hullBot = hullTop + HEIGHT * sc;
        D.poly(c, [[cx - wid / 2, hullTop], [cx + wid / 2, hullTop], [cx + wid / 2 - 30, hullBot], [cx - wid / 2 + 30, hullBot]], '#8E5CF6', D.INK, 4);
        const cols = Math.min(8, Math.ceil(g.p.n / 3) + 1), perCol = 3;
        for (let i = 0; i < g.p.n; i++) { const col = i % cols, row = Math.floor(i / cols); const cw = Math.min(48, (wid - 70) / cols); D.box(c, cx - (cols * cw) / 2 + col * cw + 2, hullTop - 28 - row * 28, cw - 4, 26, ['#FF4757', '#FFC21A', '#12B76A', '#1E88FF'][(col + row) % 4], { r: 4, lw: 2 }); }
        c.globalAlpha = 0.65; c.fillStyle = g.p.liq === 1000 ? '#3C9CE8' : '#2A86D6'; c.fillRect(0, wl, W, H - wl); c.globalAlpha = 1;
        D.line(c, 0, wl, W, wl, 'rgba(255,255,255,.9)', 3);
        D.line(c, cx + wid / 2 + 12, hullTop, cx + wid / 2 + 12, hullTop + HEIGHT * sc, '#FF4757', 3); D.tag(c, '3 m', cx + wid / 2 + 44, hullTop + 40, '#fff', { size: 13 });
        D.char(c, 'gotin', 70, 330, 80, S.sunk ? 'sad' : 'happy');
        D.text(c, S.sunk ? '¡Se hundió!' : '⚓ flotando', W - 20, 30, { size: 22, align: 'right', weight: 700 });
      }
    });
  });

  /* ---------- Gotas en una moneda ---------- */
  FK.sim('gotas-moneda', function (g) {
    const ctx = g.canvas(2.2);
    g.toggle('jabon', { label: 'Con jabón en el agua', value: false, reset: true });
    g.button('+1 gota', () => add(1), { icon: '💧' }); g.button('+5 gotas', () => add(5), { icon: '💦', kind: 'ghost' });
    g.out('n', 'Gotas', { icon: '💧', hl: true }); g.out('w', 'Con agua sola', { icon: '💧' }); g.out('s', 'Con jabón', { icon: '🧼' });
    const S = { n: 0, cap: 28, over: false, done: { agua: null, jabon: null } };
    const newCap = () => { S.cap = Math.round((g.p.jabon ? C.dropCapacity(true) : C.dropCapacity(false)) + M.rnd(-2, 2)); };
    function add(k) { for (let i = 0; i < k && !S.over; i++) { S.n++; if (S.n > S.cap) { S.over = true; S.done[g.p.jabon ? 'jabon' : 'agua'] = S.cap; FK.sfx.pop(); g.show(g.p.jabon ? 's' : 'w', S.cap + ' gotas'); g.say(`¡Se derramó! Aguantó ${S.cap} gotas ${g.p.jabon ? 'con jabón' : 'de agua sola'}.`, 'wow'); if (S.done.agua && S.done.jabon) g.win(`Agua sola: ${S.done.agua} gotas. Con jabón: ${S.done.jabon}. ¡El jabón debilita la piel del agua!`); } else FK.sfx.tick(); } g.show('n', S.n); }
    g.run({ init() { S.n = 0; S.over = false; newCap(); g.show('n', 0); g.show('w', S.done.agua ? S.done.agua + ' gotas' : '—'); g.show('s', S.done.jabon ? S.done.jabon + ' gotas' : '—'); g.say('Añade gotas una a una sobre la moneda. ¿Cuántas aguanta antes de derramarse?'); },
      static: false,
      step() {},
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const cx = W / 2, cy = H / 2 + 30, r = 150;
        c.fillStyle = 'rgba(43,35,80,.18)'; c.beginPath(); c.ellipse(cx + 6, cy + 18, r, r * 0.34, 0, 0, M.TAU); c.fill();
        c.fillStyle = '#E0A040'; c.beginPath(); c.ellipse(cx, cy + 6, r, r * 0.34, 0, 0, M.TAU); c.fill();
        c.fillStyle = '#FFC85C'; c.beginPath(); c.ellipse(cx, cy, r, r * 0.34, 0, 0, M.TAU); c.fill(); c.lineWidth = 4; c.strokeStyle = D.INK; c.stroke();
        const f = Math.min(1, S.n / (S.cap + 1)), hh = 10 + f * 70, rw = 80 + f * 60;
        if (S.n > 0) { c.fillStyle = g.p.jabon ? 'rgba(255,143,177,.65)' : 'rgba(80,170,255,.7)'; c.beginPath(); c.ellipse(cx, cy - hh * 0.3, rw, hh * 0.9 * 0.5 + rw * 0.18, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(cx, cy, rw, rw * 0.26, 0, 0, M.TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx - rw * 0.3, cy - hh * 0.6, rw * 0.25, hh * 0.18, 0, Math.PI, 0); c.stroke(); }
        if (S.over) { D.text(c, '💦', cx + rw, cy + 40, { size: 40 }); D.tag(c, '¡Se derramó!', cx, 40, '#FFC7CD', { size: 22 }); }
        D.char(c, 'gotin', 90, 120, 96, S.over ? 'wow' : 'happy');
        D.text(c, 'Gotas: ' + S.n, W - 20, 30, { size: 26, align: 'right', weight: 700 });
      }
    });
  });
})();
