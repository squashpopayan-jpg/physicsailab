/* Capítulo 46 — El azar y el caos */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Monedas ---------- */
  FK.sim('monedas', function (g) {
    const ctx = g.canvas(2.3);
    const S = { n: 0, h: 0, hist: [], last: [], pending: 0 };
    const flip = (k) => { let h = 0; for (let i = 0; i < k; i++) if (Math.random() < 0.5) h++; S.n += k; S.h += h; S.last = [h, k]; S.hist.push([S.n, S.h / S.n]); FK.sfx.tick(); show(); if (S.n >= 2000 && !g.won()) g.win(`¡${FK.int(S.n)} lanzamientos! La proporción de caras (${FK.n((S.h / S.n) * 100, 1)} %) se acerca al 50 %.`); };
    g.button('Lanzar 10', () => flip(10), { icon: '🪙' }); g.button('Lanzar 100', () => flip(100), { icon: '🪙' }); g.button('Lanzar 1000', () => flip(1000), { icon: '🪙', kind: 'ghost' }); g.button('Lanzar 10 000', () => flip(10000), { icon: '🪙', kind: 'ghost' });
    g.out('n', 'Lanzamientos', { icon: '🪙' }); g.out('p', 'Caras', { icon: '👑', hl: true }); g.out('l', 'Último lote', { icon: '🎲' });
    const show = () => { g.show('n', FK.int(S.n)); g.show('p', S.n ? FK.n((S.h / S.n) * 100, 1) + ' % (' + FK.int(S.h) + ')' : '—'); g.show('l', S.last.length ? S.last[0] + ' caras de ' + FK.int(S.last[1]) : '—'); g.dirty(); };
    g.run({
      static: true,
      init() { S.n = 0; S.h = 0; S.hist = []; S.last = []; show(); g.say('Lanza lotes de monedas y observa la proporción de caras en la gráfica.'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#F6E4D0', '#FFF6E5');
        const gx = 60, gy = 30, gw = W - 100, gh = H - 80; D.box(c, gx, gy, gw, gh, '#fff', { r: 10 });
        const Y = (p) => gy + gh - p * gh, X = (n) => gx + (Math.log10(Math.max(n, 1)) / 4.3) * gw;
        D.line(c, gx, Y(0.5), gx + gw, Y(0.5), '#12B76A', 3, [8, 6]); D.text(c, '50 %', gx - 8, Y(0.5), { size: 14, align: 'right', color: '#0A7A46', weight: 700 }); D.text(c, '100 %', gx - 8, Y(1), { size: 12, align: 'right' }); D.text(c, '0 %', gx - 8, Y(0), { size: 12, align: 'right' });
        [1, 10, 100, 1000, 10000].forEach((n) => { D.line(c, X(n), gy + gh, X(n), gy + gh + 6, D.INK, 2); D.text(c, FK.int(n), X(n), gy + gh + 20, { size: 12, align: 'center' }); }); D.text(c, 'número de lanzamientos →', gx + gw - 4, gy + gh + 38, { size: 12, align: 'right' });
        c.beginPath(); S.hist.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = '#8E5CF6'; c.lineWidth = 3; c.stroke(); S.hist.forEach((p) => D.circle(c, X(p[0]), Y(p[1]), 4, '#FF4757', '#fff', 1.5));
        D.char(c, 'terra', W - 60, 60, 66, 'happy');
      }
    });
  });

  /* ---------- Tablero de Galton ---------- */
  FK.sim('galton', function (g) {
    const ctx = g.canvas(1.7);
    g.slider('p', { label: 'Probabilidad de ir a la derecha', icon: '➡️', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => FK.n(v * 100, 0) + ' %' , onchange: () => { S.bins = new Array(ROWS + 1).fill(0); S.n = 0; S.balls = []; } });
    g.button('Soltar 1', () => drop(1), { icon: '⚪' }); g.button('Soltar 20', () => drop(20), { icon: '⚪' }); g.button('Soltar 100', () => drop(100), { icon: '⚪', kind: 'ghost' });
    g.toggle('th', { label: 'Mostrar la curva teórica', value: false });
    g.out('n', 'Bolitas', { icon: '⚪', hl: true });
    const ROWS = 10, S = { balls: [], bins: new Array(ROWS + 1).fill(0), n: 0, half: 0 };
    function drop(k) { for (let i = 0; i < k; i++) { const path = []; let r = 0; for (let j = 0; j < ROWS; j++) { const right = Math.random() < g.p.p; if (right) r++; path.push(right); } if (S.balls.length < 40) S.balls.push({ path, t: -i * 0.08, r }); else { S.bins[r]++; S.n++; } } g.show('n', S.n + S.balls.length); }
    g.run({
      init() { S.balls = []; S.bins = new Array(ROWS + 1).fill(0); S.n = 0; g.show('n', 0); g.say('Cada bolita va a izquierda o derecha en cada clavo. ¡Mira qué forma toma la pila!'); },
      step(dt) {
        S.balls.forEach((b) => (b.t += dt * 6));
        S.balls = S.balls.filter((b) => { if (b.t >= ROWS) { S.bins[b.r]++; S.n++; return false; } return true; });
        g.show('n', S.n + S.balls.length);
        if (S.n >= 200 && Math.abs(g.p.p - 0.5) < 0.01 && !g.won()) g.win('¡Una campana! Cada bolita es impredecible, pero juntas forman un patrón.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F6E4D0', '#FFF6E5');
        const cx = W / 2, top = 40, dy = 28, dx = 36;
        for (let r = 0; r < ROWS; r++) for (let k = 0; k <= r; k++) D.circle(c, cx + (k - r / 2) * dx, top + r * dy, 4.5, '#8A8AA0', D.INK, 1.5);
        S.balls.forEach((b) => { if (b.t < 0) return; const rr = Math.min(ROWS, b.t); let x = 0; const whole = Math.floor(rr); let k = 0; for (let j = 0; j < whole; j++) k += b.path[j] ? 1 : 0; const frac = rr - whole; const nxt = whole < ROWS ? (b.path[whole] ? 1 : 0) : 0; const px = cx + ((k + frac * nxt) - (whole + frac) / 2) * dx; D.circle(c, px, top + rr * dy + 8, 6, '#FF8A1F', D.INK, 2); });
        const bx0 = cx - (ROWS / 2) * dx, bot = H - 14, mx = Math.max(6, ...S.bins);
        for (let i = 0; i <= ROWS; i++) { const h = (S.bins[i] / mx) * 130, x = bx0 + i * dx - dx / 2; D.box(c, x + 2, bot - h, dx - 4, h, '#8E5CF6', { r: 4, lw: 2 }); }
        if (g.p.th && S.n > 0) { c.beginPath(); for (let i = 0; i <= ROWS; i++) { const p = C.binomPMF(ROWS, i, g.p.p), tot = S.n; const h = (p * tot / mx) * 130, x = bx0 + i * dx; i ? c.lineTo(x, bot - h) : c.moveTo(x, bot - h); } c.strokeStyle = '#FF4757'; c.lineWidth = 3; c.stroke(); }
        D.char(c, 'terra', 70, H - 90, 70, 'happy');
      }
    });
  });

  /* ---------- Péndulo doble (caos) ---------- */
  FK.sim('pendulo-doble', function (g) {
    const ctx = g.canvas(1.9);
    g.slider('a', { label: 'Ángulo inicial', icon: '📐', min: 5, max: 170, step: 5, value: 120, unit: '°', fmt: (v) => FK.n(v, 0), reset: true });
    g.out('t', 'Tiempo', { icon: '⏱️' }); g.out('d', 'Separación entre los dos péndulos', { icon: '↔️', hl: true });
    const S = { A: null, B: null, trA: [], trB: [], t: 0, big: false, small: 0 };
    g.run({
      init() { const a = M.rad(g.p.a); S.A = [a, a, 0, 0]; S.B = [a + 0.001, a, 0, 0]; S.trA = []; S.trB = []; S.t = 0; g.say('Los dos péndulos empiezan con una diferencia de solo 0,06°. ¿Seguirán juntos?'); },
      step(dt) {
        const n = 6, h = (dt * 1.6) / n;
        for (let i = 0; i < n; i++) { S.A = C.dblPend(S.A, h); S.B = C.dblPend(S.B, h); S.t += h / 1.6 * 1.6; }
        const tipA = [Math.sin(S.A[0]) + Math.sin(S.A[1]), -Math.cos(S.A[0]) - Math.cos(S.A[1])], tipB = [Math.sin(S.B[0]) + Math.sin(S.B[1]), -Math.cos(S.B[0]) - Math.cos(S.B[1])];
        S.trA.push(tipA); S.trB.push(tipB); if (S.trA.length > 220) { S.trA.shift(); S.trB.shift(); }
        const sep = Math.hypot(tipA[0] - tipB[0], tipA[1] - tipB[1]); g.show('t', FK.n(S.t, 1) + ' s'); g.show('d', sep < 0.01 ? '≈ 0 (siguen juntos)' : FK.n(sep, 2) + ' (de 4)');
        if (S.t > 5 && g.p.a >= 100 && sep > 1.2) S.big = true; if (S.t > 18 && g.p.a <= 30 && sep < 0.05) S.small = 1;
        if (S.big && S.small && !g.won()) g.win('¡Caos! Con ángulos grandes una diferencia minúscula crece hasta hacer movimientos totalmente distintos; con ángulos pequeños, no.');
        else if (S.big && !S.said) { S.said = true; g.say('¡Se separaron! Ahora prueba con un ángulo pequeño (30° o menos) y espera unos 20 segundos.', 'wow'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF'); const px = W / 2, py = 120, L = 85;
        const draw = (st, col, tr) => { c.beginPath(); tr.forEach((p, i) => { const x = px + p[0] * L, y = py - p[1] * L; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = col; c.globalAlpha = 0.4; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; const x1 = px + L * Math.sin(st[0]), y1 = py + L * Math.cos(st[0]), x2 = x1 + L * Math.sin(st[1]), y2 = y1 + L * Math.cos(st[1]); D.line(c, px, py, x1, y1, col, 4); D.line(c, x1, y1, x2, y2, col, 4); D.circle(c, x1, y1, 8, col, '#fff', 2); D.circle(c, x2, y2, 11, col, '#fff', 2); };
        draw(S.A, '#1E88FF', S.trA); draw(S.B, '#FF4757', S.trB); D.circle(c, px, py, 6, D.INK);
        D.text(c, 'azul y rojo: casi idénticos', 20, 24, { size: 14, color: D.INK }); D.char(c, 'terra', W - 60, 56, 66, 'happy');
      }
    });
  });
})();
