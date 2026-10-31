/* Capítulo 8 — Energía */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Formas de energía (clasificar) ---------- */
  FK.sim('formas-energia', function (g) {
    FK.kit.sort(g, [
      { id: 'mov', label: 'Movimiento', icon: '🏃' }, { id: 'calor', label: 'Calor', icon: '🔥' },
      { id: 'luz', label: 'Luz', icon: '💡' }, { id: 'guard', label: 'Guardada', icon: '🔋' }
    ], [
      { t: '🏃 Un niño corriendo', bin: 'mov', why: 'Todo lo que se mueve tiene energía de movimiento.' },
      { t: '🔥 Una fogata', bin: 'calor', why: 'Una fogata da calor.' },
      { t: '💡 Una linterna encendida', bin: 'luz', why: 'La linterna da luz.' },
      { t: '🍌 Un banano', bin: 'guard', why: 'La comida guarda energía química.' },
      { t: '🌬️ El viento', bin: 'mov', why: 'El viento es aire en movimiento.' },
      { t: '🔋 Una pila', bin: 'guard', why: 'La pila guarda energía lista para usarse.' },
      { t: '🍲 Una sopa caliente', bin: 'calor', why: 'Lo caliente tiene energía de calor.' },
      { t: '🌟 Una estrella', bin: 'luz', why: 'Las estrellas brillan: dan luz.' },
      { t: '🏔️ Una roca en lo alto de la montaña', bin: 'guard', why: 'La altura guarda energía (potencial).' }
    ], { need: 0.78 });
  });

  /* ---------- Montaña rusa ---------- */
  const PTS = [[0, 8], [3, 0.2], [8, 6], [12, 0.4], [16, 3.4], [19, 0.3], [22, 0.3]];
  const trackY = (x, h) => {
    const p = PTS.map((q, i) => (i ? q : [0, h]));
    let i = 0; while (i < p.length - 2 && x > p[i + 1][0]) i++;
    const t = M.clamp((x - p[i][0]) / (p[i + 1][0] - p[i][0]), 0, 1);
    return p[i][1] + (p[i + 1][1] - p[i][1]) * (1 - Math.cos(Math.PI * t)) / 2;
  };
  const trackSlope = (x, h) => (trackY(x + 0.01, h) - trackY(x - 0.01, h)) / 0.02;
  FK.sim('montana-rusa', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('h', { label: 'Altura de salida', icon: '⛰️', min: 2, max: 10, step: 0.5, value: 5, unit: 'm', fmt: (v) => FK.n(v, 1), reset: true });
    g.toggle('fric', { label: 'Con fricción (pierde energía)', value: false, reset: true });
    g.button('¡Soltar!', () => { if (s.st === 'ready') { s.st = 'run'; FK.sfx.whoosh(); } }, { icon: '🎢' });
    g.out('v', 'Rapidez', { icon: '💨' }); g.out('hh', 'Altura', { icon: '📏' });
    const s = { st: 'ready', x: 0.2, v: 0, t: 0, loss: 0, E0: 0, end: 0 };
    const X0 = 40, PXM = 31, Y0 = 380 - 40, PYM = 29;
    g.run({
      init() { s.st = 'ready'; s.x = 0.2; s.v = 0; s.loss = 0; s.E0 = 9.8 * trackY(0.2, g.p.h); s.end = 0; g.say('Elige la altura de salida (la colina grande mide 6 m) y suelta el carrito.'); },
      step(dt) {
        if (s.st === 'ready') return;
        if (s.st === 'run') {
          const mu = g.p.fric ? 0.03 : 0, n = 12;
          for (let i = 0; i < n; i++) {
            const h = dt / n, sl = trackSlope(s.x, g.p.h), cs = 1 / Math.sqrt(1 + sl * sl), sn = sl * cs;
            let a = -9.8 * sn;
            if (Math.abs(s.v) > 1e-3) a -= mu * 9.8 * cs * Math.sign(s.v); else if (Math.abs(a) < mu * 9.8 * cs) a = 0;
            s.v += a * h; s.x += s.v * cs * h;
            s.loss += mu * 9.8 * cs * Math.abs(s.v) * h;
            if (s.x >= 21.9) { s.st = 'win'; break; }
            if (s.x < 0.1) { s.x = 0.1; s.v = 0; }
          }
          if (s.v < -0.05) { s.st = 'back'; g.say('¡Ay! No alcanzó la cima y se devolvió. Sube la altura de salida.', 'sad'); FK.sfx.no(); }
          const y = trackY(s.x, g.p.h);
          g.show('v', FK.n(Math.abs(s.v), 1) + ' m/s'); g.show('hh', FK.n(y, 1) + ' m');
        }
        if (s.st === 'win') { s.st = 'done'; g.win('¡Pasó todas las colinas! La energía de altura alcanzó.'); }
        if (s.st === 'back' || s.st === 'done') { s.end += dt; }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.cloud(c, 500, 50, 1); D.cloud(c, 90, 90, 0.8);
        const h = g.p.h;
        c.beginPath(); c.moveTo(X0, Y0 + 40);
        for (let x = 0; x <= 22; x += 0.1) c.lineTo(X0 + x * PXM, Y0 - trackY(x, h) * PYM);
        c.lineTo(X0 + 22 * PXM, Y0 + 40); c.closePath(); c.fillStyle = '#B9824A'; c.fill();
        c.beginPath(); for (let x = 0; x <= 22; x += 0.1) { const px = X0 + x * PXM, py = Y0 - trackY(x, h) * PYM; x ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.lineWidth = 6; c.strokeStyle = '#FF4757'; c.stroke();
        /* marcas de altura */
        D.line(c, X0 + 8 * PXM, Y0 - 6 * PYM, X0 + 8 * PXM, Y0 - 6 * PYM - 40, D.INK, 2); D.tag(c, 'colina de 6 m', X0 + 8 * PXM, Y0 - 6 * PYM - 52, '#FFF1B8', { size: 13 });
        D.line(c, X0 - 8, Y0 - h * PYM, X0 + 30, Y0 - h * PYM, '#1E88FF', 2, [6, 5]); D.text(c, FK.n(h, 1) + ' m', X0 - 4, Y0 - h * PYM - 14, { size: 14, color: '#1E88FF', weight: 700 });
        D.text(c, '🏁', X0 + 22 * PXM - 10, Y0 - 0.3 * PYM - 26, { size: 26 });
        /* carrito */
        const y = trackY(s.x, h), sl = trackSlope(s.x, h), ang = Math.atan(sl);
        c.save(); c.translate(X0 + s.x * PXM, Y0 - y * PYM); c.rotate(-Math.atan2(sl * PYM, PXM)); D.box(c, -16, -26, 32, 20, '#FFC21A', { r: 6 }); D.char(c, 'newti', 0, -30, 34, s.st === 'back' ? 'sad' : 'happy'); D.circle(c, -9, -4, 5, D.INK); D.circle(c, 9, -4, 5, D.INK); c.restore();
        /* barras de energía */
        const E0 = s.E0 || 1, ke = 0.5 * s.v * s.v, pe = 9.8 * y, ht = Math.max(0, E0 - ke - pe);
        const bx = W - 150, by = 30;
        D.bar(c, bx, by, 130, 18, ke / Math.max(E0, 1), '#FF4757', 'movimiento', { size: 12 });
        D.bar(c, bx, by + 24, 130, 18, pe / Math.max(E0, 1), '#1E88FF', 'altura', { size: 12 });
        D.bar(c, bx, by + 48, 130, 18, g.p.fric ? ht / Math.max(E0, 1) : 0, '#FF8A1F', 'calor', { size: 12 });
      }
    });
  });

  /* ---------- Lanzador de resorte ---------- */
  FK.sim('resorte-lanzador', function (g) {
    const ctx = g.canvas(1.7);
    const KS = { blando: ['Blando', 100], medio: ['Medio', 200], duro: ['Duro', 400] };
    g.choice('k', { label: 'Resorte', icon: '🌀', options: Object.keys(KS).map((k) => [k, KS[k][0] + ' (' + KS[k][1] + ' N/m)']), value: 'medio', reset: true });
    g.slider('x', { label: 'Cuánto lo aprietas', icon: '🤏', min: 0.1, max: 0.4, step: 0.01, value: 0.25, fmt: (v) => FK.n(v * 100, 0) + ' cm', reset: true });
    g.button('¡Soltar!', () => { if (s.st === 'ready') { s.st = 'push'; FK.sfx.pop(); } }, { icon: '🚀' });
    g.out('pred', 'Altura que alcanzará', { icon: '📈', hl: true }); g.out('ener', 'Energía guardada', { icon: '🔋' });
    const MASS = 0.5, s = { st: 'ready', y: 0, v: 0, apex: 0, target: 3, tries: 0 };
    const gnd = (H) => H - 50, PXM = 56;
    g.run({
      init() {
        const k = KS[g.p.k][1], x = g.p.x; s.st = 'ready'; s.y = -x; s.v = 0; s.apex = 0;
        if (!s.keep) s.target = Math.round(M.rnd(1, 5) * 2) / 2; s.keep = true;
        g.goal(`Haz que la bola llegue a la estrella, a ${FK.n(s.target, 1)} m sobre el punto de salida (margen: 25 cm).`);
        g.show('pred', FK.n(C.springHeight(k, x, MASS, 9.8), 2) + ' m'); g.show('ener', FK.n(0.5 * k * x * x, 1) + ' J');
        g.say('Escoge el resorte y cuánto lo aprietas. Luego suelta.');
      },
      step(dt) {
        if (s.st === 'ready' || s.st === 'done') return;
        const k = KS[g.p.k][1], x = g.p.x, n = 20;
        for (let i = 0; i < n; i++) {
          const h = dt / n; let a;
          if (s.st === 'push') { a = (k * (-s.y)) / MASS - 9.8; if (s.y >= 0) s.st = 'fly'; } else a = -9.8;
          if (s.st === 'push' && a < 0 && s.v <= 0) { /* no alcanza a salir */ }
          s.v += a * h; s.y += s.v * h; s.apex = Math.max(s.apex, s.y);
          if (s.st === 'fly' && s.v <= 0) { s.st = 'done'; break; }
        }
        if (s.st === 'done') {
          const ok = Math.abs(s.apex - s.target) <= 0.25;
          if (ok) { g.win(`¡Llegó a ${FK.n(s.apex, 2)} m, justo a la estrella!`); s.keep = false; }
          else g.say(`Llegó a ${FK.n(s.apex, 2)} m y la estrella está a ${FK.n(s.target, 1)} m. ${s.apex < s.target ? 'Aprieta más el resorte o usa uno más duro.' : 'Aprieta menos el resorte.'}`, 'think');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E6E0FF', '#F8F5FF'); D.grid(c, W, H, 40);
        const gy = gnd(H), x0 = 200, top0 = gy - 90; /* punto de salida a 90 px del suelo */
        const Y = (m) => top0 - m * PXM;
        D.box(c, x0 - 40, gy, 80, 40, '#8A8AA0', { r: 8 });
        D.box(c, x0 - 28, top0, 8, gy - top0, '#C9C9D9', { r: 3, lw: 2 }); D.box(c, x0 + 20, top0, 8, gy - top0, '#C9C9D9', { r: 3, lw: 2 });
        D.spring(c, x0, gy, x0, Y(s.st === 'ready' ? -g.p.x : Math.min(0, s.y)) + 22, 9, 18, '#FF4757', 5);
        const by = Y(s.y);
        D.circle(c, x0, by, 20, '#FFC21A', D.INK, 3);
        D.line(c, x0 - 150, top0, x0 + 150, top0, '#1E88FF', 2, [6, 6]); D.text(c, '0 m (punto de salida)', x0 + 160, top0, { size: 14, color: '#1E88FF', weight: 700 });
        for (let m = 1; m <= 6; m++) { D.line(c, x0 + 90, Y(m), x0 + 104, Y(m), D.INK, 2); D.text(c, m + ' m', x0 + 112, Y(m), { size: 13 }); }
        D.emoji(c, '⭐', x0 + 300, Y(s.target), 44); D.line(c, x0 + 120, Y(s.target), x0 + 275, Y(s.target), '#FFC21A', 3, [4, 6]);
        D.emoji(c, '🐱', 90, gy - 20, 60);
        if (s.apex > 0) D.tag(c, 'máximo: ' + FK.n(s.apex, 2) + ' m', x0 + 340, Y(s.apex), '#fff', { size: 14 });
      }
    });
  });
})();
