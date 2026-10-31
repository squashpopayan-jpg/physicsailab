/* Capítulo 27 — Cargas y chispas */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Globo y papelitos ---------- */
  FK.sim('globo-papelitos', function (g) {
    const ctx = g.canvas(2.1);
    g.button('Soltar los papelitos', () => g.restart(), { icon: '📄', kind: 'ghost' });
    g.out('q', 'Carga del globo', { icon: '⚡' }); g.out('p', 'Papelitos pegados', { icon: '📄', hl: true });
    const S = { bx: 600, by: 250, q: 0, rub: false, last: null, bits: [], hair: [90, 60, 260, 230] };
    g.pointer({
      down(x, y) { S.drag = Math.hypot(x - S.bx, y - S.by) < 70; S.last = [x, y]; },
      move(x, y, e, down) {
        if (!down || !S.drag) return;
        S.bx = M.clamp(x, 40, 760); S.by = M.clamp(y, 40, 410);
        const [hx0, hy0, hx1, hy1] = S.hair;
        if (x > hx0 && x < hx1 && y > hy0 && y < hy1 && S.last) { const d = Math.hypot(x - S.last[0], y - S.last[1]); S.q = Math.min(100, S.q + d * 0.12); if (d > 6 && Math.random() < 0.15) FK.sfx.tick(); }
        S.last = [x, y];
      },
      up() { S.drag = false; }
    });
    g.run({
      init() { S.bx = 600; S.by = 250; S.q = 0; S.bits = Array.from({ length: 10 }, (_, i) => ({ x: 360 + i * 38 + M.rnd(-6, 6), y: 385, a: M.rnd(-0.3, 0.3), on: false, vy: 0, ox: 0, oy: 0 })); g.say('Arrastra el globo sobre el pelo (la zona marrón) varias veces. ¡Luego acércalo a los papelitos!'); },
      step(dt) {
        const reach = 40 + S.q * 3.2; /* alcance de la atracción según la carga */
        let on = 0;
        S.bits.forEach((b) => {
          const d = Math.hypot(b.x - S.bx, (b.y - 14) - S.by);
          if (!b.on && S.q > 8 && d < reach * 0.6 && d < 160) { b.on = true; b.ox = b.x - S.bx; b.oy = b.y - S.by; FK.sfx.pop(); }
          if (b.on) { b.ox += (M.rnd(-30, 30) - b.ox) * dt * 2; b.oy += (M.rnd(40, 70) - b.oy) * dt * 3; b.x = S.bx + b.ox; b.y = S.by + b.oy; on++; }
        });
        S.q = Math.max(0, S.q - dt * 0.4);
        g.show('q', FK.n(S.q, 0) + ' %'); g.show('p', on + ' de 10');
        if (on >= 6 && !g.won()) g.win('¡Seis papelitos! El globo cargado atrae los objetos neutros.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB'); D.ground(c, W, H - 30, H, '#C98A3F', '#A86B2A');
        c.fillStyle = 'rgba(120,70,30,.35)'; D.rr(c, S.hair[0], S.hair[1], S.hair[2] - S.hair[0], S.hair[3] - S.hair[1], 30); c.fill();
        D.emoji(c, '🧒', 175, 180, 160); D.text(c, 'frota aquí', 175, 270, { size: 16, align: 'center', weight: 700, color: '#7A400B' });
        S.bits.forEach((b) => { c.save(); c.translate(b.x, b.y); c.rotate(b.a + (b.on ? Math.sin(g.t * 5 + b.x) * 0.4 : 0)); c.fillStyle = '#fff'; c.fillRect(-9, -6, 18, 12); c.strokeStyle = D.INK; c.lineWidth = 2; c.strokeRect(-9, -6, 18, 12); c.restore(); });
        D.circle(c, S.bx, S.by, 56, '#FF3E9D', D.INK, 4); D.circle(c, S.bx - 18, S.by - 18, 12, 'rgba(255,255,255,.5)');
        D.line(c, S.bx, S.by + 56, S.bx - 6, S.by + 86, D.INK, 3);
        const minus = Math.floor(S.q / 12); for (let i = 0; i < minus; i++) D.text(c, '−', S.bx - 30 + (i % 4) * 20, S.by - 10 + Math.floor(i / 4) * 22, { size: 24, color: '#fff', weight: 700 });
        D.bar(c, 500, 24, 260, 22, S.q / 100, '#FF3E9D', 'carga: ' + FK.n(S.q, 0) + ' %', { ink: '#fff' });
        D.char(c, 'chispa', 700, 100, 70, S.q > 50 ? 'wow' : 'happy');
      }
    });
  });

  /* ---------- Dos cargas ---------- */
  FK.sim('cargas-fuerza', function (g) {
    const ctx = g.canvas(2.6);
    g.choice('s1', { label: 'Carga de la izquierda', icon: '⬅️', options: [[1, '+ positiva'], [-1, '− negativa']], value: 1 });
    g.choice('s2', { label: 'Carga de la derecha', icon: '➡️', options: [[1, '+ positiva'], [-1, '− negativa']], value: -1 });
    g.slider('r', { label: 'Distancia entre ellas', icon: '↔️', min: 1, max: 6, step: 0.5, value: 2, unit: 'cm', fmt: (v) => FK.n(v, 1) });
    g.out('F', 'Fuerza', { icon: '💪', hl: true }); g.out('t', 'Qué pasa', { icon: '🔁' });
    const seen = { att: false, rep: false, far: false }, S = { r0: 2 };
    g.run({
      static: true,
      init() { seen.att = seen.rep = seen.far = false; g.say('Prueba las cuatro combinaciones de signos y cambia la distancia.'); },
      draw(c, W, H) {
        const q1 = g.p.s1, q2 = g.p.s2, r = g.p.r, F = C.coulomb(1, 1, r / 100) * 1e-9 * 1e0; /* fuerza relativa */
        const rel = 1 / (r * r), att = q1 * q2 < 0;
        g.show('F', FK.n(rel / (1 / 4), 2) + ' (relativa a 2 cm)'); g.show('t', att ? '🧲 se atraen' : '↔️ se repelen');
        if (att) seen.att = true; else seen.rep = true; if (r >= 4) seen.far = true;
        if (seen.att && seen.rep && seen.far && !g.won()) g.win('¡Las cuatro combinaciones! Y viste que al duplicar la distancia la fuerza baja a la cuarta parte.');
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB'); D.grid(c, W, H, 40, 'rgba(43,35,80,.06)');
        const cx = W / 2, cy = H / 2, sep = r * 70, x1 = cx - sep / 2, x2 = cx + sep / 2;
        const col = (q) => (q > 0 ? '#FF4757' : '#1E88FF');
        const L = Math.min(190, rel * 45 * 4);
        const dir = att ? 1 : -1;
        D.arrow(c, x1, cy - 70, x1 + dir * L, cy - 70, '#FFC21A', 10); D.arrow(c, x2, cy - 70, x2 - dir * L, cy - 70, '#FFC21A', 10);
        D.circle(c, x1, cy, 32, col(q1), D.INK, 4); D.text(c, q1 > 0 ? '+' : '−', x1, cy, { size: 38, align: 'center', color: '#fff', weight: 700 });
        D.circle(c, x2, cy, 32, col(q2), D.INK, 4); D.text(c, q2 > 0 ? '+' : '−', x2, cy, { size: 38, align: 'center', color: '#fff', weight: 700 });
        D.line(c, x1, cy + 60, x2, cy + 60, D.INK, 3); D.tag(c, FK.n(r, 1) + ' cm', cx, cy + 82, '#fff', { size: 15 });
        D.char(c, 'chispa', W - 60, 50, 64, 'happy');
      }
    });
  });

  /* ---------- Tormenta ---------- */
  FK.sim('tormenta', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('guess', { label: 'Mi cálculo de la distancia', icon: '🤔', min: 0.2, max: 8, step: 0.1, value: 2, unit: 'km', fmt: (v) => FK.n(v, 1) });
    g.button('⚡ Esperar un rayo', () => strike(), { kind: 'primary' }); g.button('Comprobar', () => check(), { icon: '✅', kind: 'ghost' });
    g.out('t', 'Segundos entre rayo y trueno', { icon: '⏱️', hl: true });
    const S = { st: 'idle', t: 0, D: 3, flash: 0, tt: 0, done: false };
    function strike() { if (S.st !== 'idle') return; S.D = Math.round(M.rnd(0.6, 7) * 10) / 10; S.st = 'wait'; S.t = 0; S.done = false; S.tt = 0; g.show('t', '…'); }
    function check() { if (S.tt === 0 || S.done) { g.say('Primero espera un rayo y mide el tiempo.', 'think'); return; } S.done = true; if (Math.abs(g.p.guess - S.D) / S.D <= 0.25) g.win(`¡Muy bien! Estaba a ${FK.n(S.D, 1)} km: ${FK.n(S.tt, 1)} s ÷ 3.`); else g.say(`Estaba a ${FK.n(S.D, 1)} km. Recuerda: segundos ÷ 3 = kilómetros.`, 'think'); }
    g.run({
      init() { S.st = 'idle'; S.t = 0; S.flash = 0; S.tt = 0; S.done = false; g.show('t', '—'); g.say('Presiona «Esperar un rayo». Cuando veas el relámpago, empieza a contar hasta oír el trueno.'); },
      step(dt) {
        if (S.flash > 0) S.flash -= dt * 2.2;
        if (S.st === 'wait') { S.t += dt; if (S.t > 1.2 && S.t - dt <= 1.2) { S.flash = 1; S.fire = true; } const th = 1.2 + C.thunderSeconds(S.D); if (S.t >= th) { S.st = 'idle'; S.tt = th - 1.2; g.show('t', FK.n(S.tt, 1) + ' s'); FK.sfx.boom(); S.flash = 0.25; } else if (S.t > 1.2) g.show('t', FK.n(S.t - 1.2, 1) + ' s'); }
      },
      draw(c, W, H) {
        c.fillStyle = '#12103A'; c.fillRect(0, 0, W, H);
        const g2 = c.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#2A2560'); g2.addColorStop(1, '#4B3F8C'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(70,65,120,.9)'; c.beginPath(); c.arc(120 + i * 150, 70, 60, 0, M.TAU); c.arc(190 + i * 150, 60, 50, 0, M.TAU); c.fill(); }
        D.ground(c, W, H - 50, H, '#2E5B3A', '#1E3B27');
        D.emoji(c, '🏠', 130, H - 80, 70); D.emoji(c, '🏔️', 620, H - 80, 90);
        const bx = 520;
        if (S.flash > 0.6) { c.beginPath(); c.moveTo(bx, 100); c.lineTo(bx - 30, 170); c.lineTo(bx + 10, 180); c.lineTo(bx - 40, 260); c.lineTo(bx - 10, 270); c.lineTo(bx - 50, H - 50); c.strokeStyle = '#FFF48A'; c.lineWidth = 8; c.lineJoin = 'round'; c.stroke(); c.fillStyle = 'rgba(255,255,230,.25)'; c.fillRect(0, 0, W, H); }
        D.text(c, 'Tu casa', 130, H - 30, { size: 14, align: 'center', color: '#fff' });
        D.char(c, 'chispa', 700, 80, 70, S.flash > 0.5 ? 'wow' : 'happy');
        if (S.st === 'wait' && S.t > 1.2) D.text(c, 'contando… ' + FK.n(S.t - 1.2, 1) + ' s', W / 2, 30, { size: 22, align: 'center', color: '#FFF48A', weight: 700 });
        if (S.done) D.tag(c, 'real: ' + FK.n(S.D, 1) + ' km', bx, H - 120, '#B8F2D0', { size: 16 });
      }
    });
  });
})();
