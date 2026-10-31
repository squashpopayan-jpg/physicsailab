/* Capítulo 39 — El núcleo y la radiactividad */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Monedas que decaen ---------- */
  FK.sim('decaimiento', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('N', { label: 'Átomos al empezar', icon: '⚛️', min: 20, max: 400, step: 20, value: 200, fmt: (v) => FK.n(v, 0), reset: true });
    g.button('🎲 Pasar una vida media', () => step1(), { kind: 'primary' });
    g.out('n', 'Átomos que quedan', { icon: '⚛️', hl: true }); g.out('e', 'Lo esperado', { icon: '🧮' }); g.out('k', 'Vidas medias', { icon: '⏳' });
    const S = { atoms: [], hist: [], k: 0 };
    function step1() { let alive = 0; S.atoms.forEach((a) => { if (a.alive) { if (Math.random() < 0.5) a.alive = false; else alive++; } }); S.k++; S.hist.push(alive); FK.sfx.pop(); show(); if (S.k >= 4 && !g.won()) g.win('¡Cuatro vidas medias! En cada una queda la mitad: 1/2, 1/4, 1/8, 1/16.'); }
    const show = () => { const n = S.hist[S.hist.length - 1]; g.show('n', n); g.show('e', FK.n(C.decayLeft(g.p.N, S.k, 1), 1)); g.show('k', S.k); };
    g.run({
      init() { S.atoms = Array.from({ length: g.p.N }, (_, i) => ({ alive: true, x: M.rnd(0, 1), y: M.rnd(0, 1) })); S.hist = [g.p.N]; S.k = 0; show(); g.say('Cada átomo tiene la mitad de probabilidad de desintegrarse en una vida media. ¡Prueba!'); },
      draw(c, W, H) {
        D.night(c, W, H, 25, 20);
        const bx = 20, by = 20, bw = 400, bh = H - 40; D.box(c, bx, by, bw, bh, 'rgba(255,255,255,.05)', { r: 12, stroke: '#fff', lw: 2 });
        S.atoms.forEach((a) => { const x = bx + 10 + a.x * (bw - 20), y = by + 10 + a.y * (bh - 20); D.circle(c, x, y, a.alive ? 6 : 4, a.alive ? '#FFC21A' : 'rgba(255,255,255,.18)', a.alive ? '#fff' : null, 1.5); });
        /* gráfica */
        const gx = 450, gy = 30, gw = W - 480, gh = H - 80; D.box(c, gx, gy, gw, gh, '#fff', { r: 10 });
        const X = (k) => gx + 24 + (k / 6) * (gw - 40), Y = (n) => gy + gh - 20 - (n / g.p.N) * (gh - 40);
        c.beginPath(); for (let k = 0; k <= 6; k += 0.1) { const y = Y(g.p.N * Math.pow(0.5, k)); k ? c.lineTo(X(k), y) : c.moveTo(X(k), y); } c.strokeStyle = 'rgba(142,92,246,.5)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]);
        c.beginPath(); S.hist.forEach((n, k) => (k ? c.lineTo(X(k), Y(n)) : c.moveTo(X(k), Y(n)))); c.strokeStyle = '#FF4757'; c.lineWidth = 4; c.stroke(); S.hist.forEach((n, k) => D.circle(c, X(k), Y(n), 5, '#FF4757', '#fff', 2));
        D.text(c, 'átomos que quedan', gx + 8, gy + 12, { size: 12 }); D.text(c, 'vidas medias →', gx + gw - 8, gy + gh - 4, { size: 12, align: 'right' });
        D.char(c, 'quarki', W - 56, H - 36, 56, 'happy');
      }
    });
  });

  /* ---------- Carbono-14 ---------- */
  const OBJ = [['🦣', 'hueso de mamut'], ['🏺', 'vasija de un antiguo pueblo'], ['🪵', 'tronco de un barco antiguo'], ['🧊', 'cuerpo de un cazador del hielo'], ['🦴', 'hueso de un animal'], ['📜', 'pergamino antiguo']];
  FK.sim('carbono14', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('age', { label: 'Mi cálculo de la edad', icon: '🤔', min: 0, max: 30000, step: 100, value: 6000, unit: 'años', fmt: (v) => FK.int(v) });
    g.button('Comprobar', () => check(), { icon: '✅' }); g.button('Otro objeto', () => g.restart(), { icon: '🔄', kind: 'ghost' });
    g.out('f', 'Carbono-14 que queda', { icon: '⚛️', hl: true }); g.out('r', 'Pista', { icon: '💡' });
    const S = { age: 5730, o: OBJ[0], done: false };
    function check() { if (S.done) return; S.done = true; const err = Math.abs(g.p.age - S.age) / S.age; if (err <= 0.15) g.win(`¡Sí! Tenía ${FK.int(S.age)} años: ${FK.n(C.c14Fraction(S.age) * 100, 1)} % del C-14.`); else g.say(`Tenía ${FK.int(S.age)} años. Cuenta cuántas vidas medias (5730 años) hacen falta para quedar en ${FK.n(C.c14Fraction(S.age) * 100, 1)} %.`, 'think'); }
    g.run({
      init() { S.o = M.pick(OBJ); const k = M.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]); S.age = Math.round(k * 5730 / 100) * 100; S.done = false; g.show('f', FK.n(C.c14Fraction(S.age) * 100, 1) + ' %'); g.show('r', '50 % → 5730 · 25 % → 11 460 · 12,5 % → 17 190'); g.say(`Encontraron ${S.o[1]}. Tiene ${FK.n(C.c14Fraction(S.age) * 100, 1)} % del carbono-14 que tenía cuando vivía. ¿Qué edad tiene?`); },
      static: true,
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF1D9', '#FFE9C7'); D.emoji(c, S.o[0], 120, 160, 100); D.text(c, S.o[1], 120, 230, { size: 15, align: 'center', weight: 700 });
        const f = C.c14Fraction(S.age); D.bar(c, 260, 80, 480, 40, f, '#8E5CF6', FK.n(f * 100, 1) + ' % de C-14', { size: 20, ink: '#fff' });
        for (let k = 0; k <= 4; k++) { const x = 260 + 480 * Math.pow(0.5, k); D.line(c, x, 130, x, 156, D.INK, 2); D.text(c, k === 0 ? 'vivo (100 %)' : FK.int(k * 5730) + ' años', x, 172, { size: 12, align: 'center' }); }
        D.char(c, 'quarki', 700, 270, 70, S.done ? 'wow' : 'think');
        if (S.done) D.tag(c, 'edad real: ' + FK.int(S.age) + ' años', 500, 240, '#B8F2D0', { size: 18 });
      }
    });
  });

  /* ---------- Contador Geiger ---------- */
  const SRC = { a: ['Alfa (α)', 'papel'], b: ['Beta (β)', 'aluminio'], g: ['Gamma (γ)', 'plomo'] };
  FK.sim('geiger', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('src', { label: 'Fuente', icon: '☢️', options: Object.keys(SRC).map((k) => [k, SRC[k][0]]), value: 'a' });
    g.choice('sh', { label: 'Blindaje', icon: '🧱', options: [['ninguno', 'Ninguno'], ['papel', 'Papel'], ['aluminio', 'Aluminio'], ['plomo', 'Plomo']], value: 'ninguno' });
    g.slider('d', { label: 'Distancia', icon: '↔️', min: 0.5, max: 5, step: 0.5, value: 1, unit: 'm', fmt: (v) => FK.n(v, 1) });
    g.out('cps', 'Clics por segundo (promedio)', { icon: '📟', hl: true }); g.out('s', 'Fuentes controladas', { icon: '✅' });
    const S = { clicks: [], acc: 0, safe: new Set(), disp: 0 };
    g.run({
      init() { S.safe.clear(); S.clicks = []; g.say('El contador hace «clic» con cada partícula que detecta. ¡Que sean menos de 5 por segundo!'); },
      step(dt) {
        const rate = C.geigerRate(g.p.src, g.p.sh, g.p.d); S.disp += (rate - S.disp) * Math.min(1, dt * 2);
        S.acc += rate * dt; while (S.acc >= 1) { S.acc -= 1; S.clicks.push(g.t); if (Math.random() < 0.3) FK.sfx.tick(); }
        S.clicks = S.clicks.filter((t) => g.t - t < 1.2);
        g.show('cps', FK.n(rate, rate < 10 ? 1 : 0) + ' /s ' + (rate < 5 ? '✅ seguro' : '⚠️')); if (rate < 5) { if (!S.safe.has(g.p.src)) { S.safe.add(g.p.src); FK.sfx.ok(); g.say(`¡Controlada! Con ${g.p.sh === 'ninguno' ? 'la distancia' : g.p.sh} y ${FK.n(g.p.d, 1)} m, la fuente ${SRC[g.p.src][0]} queda segura.`, 'wow'); } }
        g.show('s', S.safe.size + ' de 3'); if (S.safe.size >= 3 && !g.won()) g.win('¡Las tres fuentes controladas! Alfa: papel; beta: aluminio; gamma: plomo y distancia.');
      },
      draw(c, W, H) {
        D.night(c, W, H, 4, 20);
        const x0 = 90, x1 = 650, y = H / 2 + 20, sx = x0 + 20, dx = x0 + 40 + (g.p.d / 5) * (x1 - x0 - 80);
        D.emoji(c, '☢️', sx, y, 56); D.text(c, SRC[g.p.src][0], sx, y + 46, { size: 14, align: 'center', color: '#fff' });
        if (g.p.sh !== 'ninguno') { const mx = (sx + dx) / 2; D.box(c, mx - 8, y - 50, 16, 100, { papel: '#F4EFE0', aluminio: '#C9D2E8', plomo: '#5A5A7A' }[g.p.sh], { r: 4, stroke: '#fff', lw: 2 }); D.text(c, g.p.sh, mx, y - 62, { size: 13, align: 'center', color: '#fff' }); }
        const rate = C.geigerRate(g.p.src, g.p.sh, g.p.d);
        for (let i = 0; i < Math.min(14, 2 + rate * 0.6); i++) { const t = ((g.t * 0.8 + i * 0.37) % 1), px = sx + 30 + t * (dx - sx - 40), py = y + Math.sin(i * 7) * 24; const pass = px < (sx + dx) / 2 || C.shieldPass(g.p.src, g.p.sh) > 0.3 || g.p.sh === 'ninguno'; if (pass) D.circle(c, px, py, 3, '#FFE066'); }
        D.box(c, dx - 10, y - 36, 80, 72, '#12B76A', { r: 12 }); D.text(c, 'GEIGER', dx + 30, y - 18, { size: 14, align: 'center', color: '#fff', weight: 700 }); D.text(c, FK.n(S.disp, S.disp < 10 ? 1 : 0), dx + 30, y + 8, { size: 26, align: 'center', color: '#fff', weight: 700 });
        S.clicks.forEach((t) => { const a = 1 - (g.t - t) / 1.2; D.text(c, 'clic', dx + 30 + Math.sin(t * 40) * 40, y - 50 - (g.t - t) * 40, { size: 13, align: 'center', color: `rgba(255,255,255,${a})` }); });
        D.text(c, 'distancia: ' + FK.n(g.p.d, 1) + ' m', (sx + dx) / 2, y + 70, { size: 14, align: 'center', color: '#B9B3E6' });
        D.char(c, 'quarki', W - 56, 56, 60, rate < 5 ? 'happy' : 'sad');
      }
    });
  });

  /* ---------- Fusión ---------- */
  FK.sim('fusion', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('T', { label: 'Temperatura del núcleo', icon: '🌡️', min: 1, max: 20, step: 0.5, value: 2, unit: 'millones de °C', fmt: (v) => FK.n(v, 1) });
    g.out('f', 'Fusiones', { icon: '💥', hl: true }); g.out('he', 'Helio formado', { icon: '🎈' });
    const NP = 26, S = { ps: [], flash: [], fus: 0, hi: 0 };
    g.run({
      init() { S.ps = Array.from({ length: NP }, () => ({ x: M.rnd(40, 760), y: M.rnd(40, 360), a: M.rnd(0, M.TAU), alive: true })); S.flash = []; S.fus = 0; S.hi = 0; g.say('Cada protón tiene carga positiva y los demás lo repelen. ¿Podrán unirse?'); },
      step(dt) {
        const T = g.p.T, v = 40 + 26 * Math.sqrt(T) * 1.6;
        S.ps.forEach((p) => { if (!p.alive) return; p.x += Math.cos(p.a) * v * dt; p.y += Math.sin(p.a) * v * dt; if (p.x < 20 || p.x > 780) { p.a = Math.PI - p.a; p.x = M.clamp(p.x, 20, 780); } if (p.y < 20 || p.y > 380) { p.a = -p.a; p.y = M.clamp(p.y, 20, 380); } });
        for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) { const a = S.ps[i], b = S.ps[j]; if (!a.alive || !b.alive) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 22) { const pf = C.fusionProb(T); if (Math.random() < pf) { a.alive = b.alive = false; S.fus++; S.flash.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 }); FK.sfx.pop(); if (T >= 12) S.hi++; setTimeout(() => { a.alive = b.alive = true; a.x = M.rnd(40, 760); a.y = M.rnd(40, 360); b.x = M.rnd(40, 760); b.y = M.rnd(40, 360); }, 900); } else { const ang = Math.atan2(a.y - b.y, a.x - b.x); a.a = ang; b.a = ang + Math.PI; } } }
        S.flash.forEach((f) => (f.t += dt)); S.flash = S.flash.filter((f) => f.t < 0.8);
        g.show('f', S.fus); g.show('he', Math.floor(S.fus / 2));
        if (S.hi >= 5 && !g.won()) g.win('¡Cinco fusiones a más de 12 millones de grados! Así funciona el Sol, convirtiendo masa en energía.');
      },
      draw(c, W, H) {
        const T = g.p.T, hot = M.clamp((T - 1) / 19, 0, 1); D.sky(c, W, H, D.heat(0.35 + hot * 0.6), D.heat(0.55 + hot * 0.45));
        S.ps.forEach((p) => { if (!p.alive) return; D.circle(c, p.x, p.y, 10, '#FF4757', '#fff', 2); D.text(c, '+', p.x, p.y, { size: 15, align: 'center', color: '#fff', weight: 700 }); });
        S.flash.forEach((f) => { D.circle(c, f.x, f.y, 14 + f.t * 90, `rgba(255,255,200,${0.7 - f.t})`); D.emoji(c, '🎈', f.x, f.y - 10 - f.t * 30, 26); D.text(c, '+ energía', f.x, f.y + 24, { size: 14, align: 'center', color: '#fff', stroke: 'rgba(0,0,0,.5)' }); });
        D.tag(c, T >= 14 ? '☀️ como el centro del Sol' : T >= 8 ? 'casi' : 'demasiado frío para fusionar', 400, 24, '#FFF1B8', { size: 15 });
        D.char(c, 'quarki', W - 56, H - 40, 60, 'happy');
      }
    });
  });
})();
