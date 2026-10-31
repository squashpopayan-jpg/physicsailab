/* Capítulo 17 — Sólido, líquido, gas y plasma */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La fiesta de las moléculas: dinámica molecular 2D (Lennard-Jones, unidades reducidas) ---------- */
  FK.sim('fiesta-moleculas', function (g) {
    const ctx = g.canvas(1.8);
    g.slider('T', { label: 'Temperatura', icon: '🌡️', min: 0.03, max: 1.6, step: 0.01, value: 0.1, fmt: (v) => (v < 0.2 ? 'muy fría' : v < 0.5 ? 'fresca' : v < 0.9 ? 'caliente' : 'ardiente') });
    g.out('est', 'Estado', { icon: '🔬', hl: true }); g.out('z', 'Vecinos por partícula', { icon: '🤝' });
    const N = 48, LX = 22, LY = 13, DT = 0.005;
    const P = [];
    const S = { z: 4, seen: new Set() };
    const init = () => {
      P.length = 0;
      const cols = 8;
      for (let i = 0; i < N; i++) P.push({ x: 4 + (i % cols) * 1.12 + ((Math.floor(i / cols)) % 2) * 0.56, y: 3 + Math.floor(i / cols) * 0.97, vx: M.gauss() * 0.2, vy: M.gauss() * 0.2, fx: 0, fy: 0 });
    };
    const forces = () => {
      for (const p of P) { p.fx = 0; p.fy = 0; }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, r2 = dx * dx + dy * dy;
        if (r2 > 6.25) continue;
        const ir2 = 1 / Math.max(r2, 0.64), ir6 = ir2 * ir2 * ir2, f = 24 * (2 * ir6 * ir6 - ir6) * ir2;
        a.fx += f * dx; a.fy += f * dy; b.fx -= f * dx; b.fy -= f * dy;
      }
    };
    g.run({
      init() { init(); S.seen.clear(); forces(); g.say('Las partículas se atraen y se mueven. Cambia la temperatura y mira qué pasa.'); },
      step() {
        const T0 = g.p.T;
        for (let s = 0; s < 14; s++) {
          for (const p of P) { p.vx += 0.5 * DT * p.fx; p.vy += 0.5 * DT * p.fy; p.x += DT * p.vx; p.y += DT * p.vy;
            if (p.x < 0.5) { p.x = 0.5; p.vx = Math.abs(p.vx); } if (p.x > LX - 0.5) { p.x = LX - 0.5; p.vx = -Math.abs(p.vx); }
            if (p.y < 0.5) { p.y = 0.5; p.vy = Math.abs(p.vy); } if (p.y > LY - 0.5) { p.y = LY - 0.5; p.vy = -Math.abs(p.vy); } }
          forces();
          let ke = 0; for (const p of P) { p.vx += 0.5 * DT * p.fx; p.vy += 0.5 * DT * p.fy; ke += p.vx * p.vx + p.vy * p.vy; }
          const T = ke / (2 * N), lam = Math.sqrt(1 + 0.02 * (T0 / Math.max(T, 1e-6) - 1));
          for (const p of P) { p.vx *= lam; p.vy *= lam; }
        }
        /* vecinos: pares a menos de 1,4 */
        let pairs = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y; if (dx * dx + dy * dy < 1.96) pairs++; }
        S.z += ((2 * pairs) / N - S.z) * 0.05;
        const st = S.z >= 4.6 ? 'sólido' : S.z >= 2.2 ? 'líquido' : 'gas';
        g.dbg = { z: S.z, st };
        g.show('est', st === 'sólido' ? '🧊 sólido' : st === 'líquido' ? '💧 líquido' : '☁️ gas'); g.show('z', FK.n(S.z, 1));
        if (g.t > 1.5) S.seen.add(st);
        if (S.seen.size >= 3 && !g.won()) g.win('¡Viste los tres estados! Más temperatura = partículas más rápidas y más separadas.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const sc = (W - 80) / LX, ox = 40, oy = H - 30 - LY * sc * 0.0;
        const bx = ox, by = 30, bw = LX * sc, bh = Math.min(H - 60, LY * sc);
        D.box(c, bx, by, bw, bh, '#fff', { r: 14, lw: 5 });
        const syy = bh / LY;
        for (const p of P) { const sp = Math.hypot(p.vx, p.vy); D.circle(c, bx + p.x * sc, by + p.y * syy, 0.5 * Math.min(sc, syy) * 1.05, D.heat(Math.min(1, sp / 2.4)), D.INK, 2); }
        D.char(c, 'flamo', W - 56, H - 36, 56, 'happy');
      }
    });
  });

  /* ---------- Calentar un cubo de hielo ---------- */
  FK.sim('curva-agua', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('P', { label: 'Potencia del calentador', icon: '🔌', min: 200, max: 2000, step: 100, value: 600, unit: 'W', fmt: (v) => FK.int(v) });
    g.button('▶ Calentar', () => { S.on = true; }, { kind: 'primary' }); g.button('⏸ Pausa', () => { S.on = false; }, { kind: 'ghost' });
    g.out('T', 'Temperatura', { icon: '🌡️', hl: true }); g.out('f', 'Fase', { icon: '🔬' }); g.out('t', 'Tiempo', { icon: '⏱️' });
    const MASS = 100, S = { Q: 0, on: false, hist: [], t: 0 };
    const QMAX = C.heatCurve(1e9, MASS).Qtotal;
    g.run({
      init() { S.Q = 0; S.on = false; S.hist = [[0, -20]]; S.t = 0; g.say('Tienes 100 g de hielo a −20 °C. Presiona «Calentar» y mira la gráfica.'); },
      step(dt) {
        if (S.on && S.Q < QMAX) { const dQ = g.p.P * dt * 30; S.Q += dQ; S.t += dt * 30; const r = C.heatCurve(S.Q, MASS); S.hist.push([S.Q, r.T]); if (S.hist.length > 2000) S.hist = S.hist.filter((_, i) => i % 2 === 0); }
        const r = C.heatCurve(S.Q, MASS);
        g.show('T', FK.n(r.T, 1) + ' °C'); g.show('f', { hielo: '🧊 hielo', derrite: '🧊💧 derritiéndose', agua: '💧 agua', hierve: '💧☁️ hirviendo', vapor: '☁️ vapor' }[r.phase]); g.show('t', FK.n(S.t / 60, 1) + ' min');
        if (r.phase === 'hierve' && r.frac > 0.3 && !g.won()) g.win('¡Está hirviendo! Fíjate: la temperatura se quedó en 100 °C mientras cambia de líquido a gas.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const r = C.heatCurve(S.Q, MASS);
        /* gráfica */
        const gx = 300, gy = 30, gw = W - 330, gh = H - 80;
        D.box(c, gx, gy, gw, gh, '#fff', { r: 10 });
        const X = (q) => gx + 12 + (q / QMAX) * (gw - 24), Y = (t) => gy + gh - 16 - ((t + 30) / 170) * (gh - 36);
        for (const t of [0, 100]) { D.line(c, gx + 8, Y(t), gx + gw - 8, Y(t), 'rgba(43,35,80,.2)', 2, [6, 6]); D.text(c, t + ' °C', gx + 14, Y(t) - 10, { size: 13 }); }
        c.beginPath(); S.hist.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])))); c.strokeStyle = '#FF4757'; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke();
        D.circle(c, X(S.Q), Y(r.T), 8, '#FFC21A', D.INK, 3);
        D.text(c, 'energía recibida →', gx + gw - 10, gy + gh - 4, { size: 13, align: 'right' }); D.text(c, 'temperatura', gx + 8, gy + 14, { size: 13 });
        /* vaso */
        const vx = 70, vy = 70;
        D.poly(c, [[vx, vy], [vx + 170, vy], [vx + 150, vy + 230], [vx + 20, vy + 230]], 'rgba(220,240,255,.7)', D.INK, 4);
        if (r.phase === 'hielo' || r.phase === 'derrite') { const f = r.phase === 'hielo' ? 0 : r.frac; D.box(c, vx + 45, vy + 140 + f * 60, 80, 90 - f * 60, '#BFE9FF', { r: 10 }); }
        if (r.phase !== 'hielo' && r.phase !== 'vapor') { const lvl = r.phase === 'hierve' ? 50 * (1 - r.frac) + 20 : 60 * (r.phase === 'derrite' ? r.frac : 1) + 10; c.fillStyle = 'rgba(40,140,255,.6)'; c.fillRect(vx + 22, vy + 230 - 10 - lvl * 2.2, 126, lvl * 2.2); }
        if (r.phase === 'hierve' || r.phase === 'vapor') for (let i = 0; i < 10; i++) { const t = (g.t * 0.7 + i * 0.37) % 1; D.circle(c, vx + 30 + (i * 37) % 110 + Math.sin(g.t * 3 + i) * 8, vy - t * 70, 5 + t * 8, 'rgba(255,255,255,.8)', 'rgba(43,35,80,.3)', 2); }
        D.emoji(c, S.on ? '🔥' : '🔌', vx + 85, vy + 262, 36);
        D.char(c, 'flamo', 40, 24, 50, 'happy');
      }
    });
  });
})();
