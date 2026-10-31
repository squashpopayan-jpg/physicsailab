/* Capítulo 29 — Voltaje, corriente y resistencia */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- El río de electrones ---------- */
  FK.sim('rio-electrones', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('V', { label: 'Voltaje de la pila', icon: '🔋', min: 1.5, max: 12, step: 1.5, value: 3, unit: 'V', fmt: (v) => FK.n(v, 1) });
    g.choice('Rx', { label: 'Resistencia extra', icon: '〰️', options: [[0, 'Ninguna'], [10, '10 Ω'], [20, '20 Ω'], [40, '40 Ω']], value: 0 });
    g.out('I', 'Corriente', { icon: '🌊' }); g.out('P', 'Brillo del bombillo', { icon: '💡', hl: true });
    const RB = 20, IMAX = 0.3, PN = IMAX * IMAX * RB; /* el bombillo es de 6 V, 20 Ω, 0,3 A */
    const S = { dots: Array.from({ length: 60 }, (_, i) => i / 60), burnt: false, hold: 0 };
    g.run({
      init() { S.burnt = false; S.hold = 0; g.say('El bombillo de este circuito es de 6 V y 20 Ω: funciona perfecto con 0,3 A. ¡No te pases!'); },
      step(dt) {
        const R = RB + g.p.Rx, I = g.p.V / R, P = I * I * RB, br = P / PN;
        if (I > IMAX * 1.5 && !S.burnt) { S.burnt = true; FK.sfx.boom(); g.say(`¡Pop! Pasó ${FK.n(I, 2)} A y el bombillo se fundió. Aumenta la resistencia o baja el voltaje.`, 'sad'); }
        if (S.burnt && I <= IMAX * 1.5) S.burnt = false;
        g.show('I', FK.n(I, 2) + ' A'); g.show('P', S.burnt ? '💥 fundido' : FK.n(br * 100, 0) + ' %');
        S.dots = S.dots.map((d) => (d + dt * 0.08 * I * 5) % 1);
        if (!S.burnt && br >= 0.8 && br <= 1.1) { S.hold += dt; if (S.hold > 1.5 && !g.won()) g.win(`¡Brillo normal con ${FK.n(g.p.V, 1)} V y ${RB + g.p.Rx} Ω! Corriente: ${FK.n(I, 2)} A (I = V ÷ R).`); } else S.hold = 0;
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB');
        const R = RB + g.p.Rx, I = g.p.V / R, br = M.clamp(I * I * RB / PN, 0, 2);
        const loop = [[120, 90], [680, 90], [680, 300], [120, 300], [120, 90]];
        c.beginPath(); loop.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = '#A9743B'; c.lineWidth = 14; c.lineJoin = 'round'; c.stroke(); c.strokeStyle = '#FFE5C2'; c.lineWidth = 8; c.stroke();
        const L = 560 * 2 + 210 * 2;
        S.dots.forEach((d) => { let s = d * L, x, y; if (s < 560) { x = 680 - s; y = 90; } else if (s < 770) { x = 120; y = 90 + (s - 560); } else if (s < 1330) { x = 120 + (s - 770); y = 300; } else { x = 680; y = 300 - (s - 1330); } D.circle(c, x, y, 5, '#1E88FF', '#fff', 1.5); });
        /* bombillo */
        const lit = S.burnt ? 0 : Math.min(1, br);
        if (lit > 0) { const gr = c.createRadialGradient(400, 90, 5, 400, 90, 110 * lit + 30); gr.addColorStop(0, `rgba(255,244,140,${0.8 * lit})`); gr.addColorStop(1, 'rgba(255,244,140,0)'); c.fillStyle = gr; c.fillRect(250, 0, 300, 220); }
        D.emoji(c, S.burnt ? '💥' : lit > 0.05 ? '💡' : '🔅', 400, 90, 60);
        /* pila */
        D.box(c, 90, 170, 60, 60, '#FF8A1F', { r: 8 }); D.text(c, g.p.V + ' V', 120, 200, { size: 18, align: 'center', color: '#fff', weight: 700 });
        /* resistencia extra */
        if (g.p.Rx > 0) { c.beginPath(); c.moveTo(560, 300); for (let k = 0; k < 8; k++) c.lineTo(580 + k * 10, 300 + (k % 2 ? -14 : 14)); c.lineTo(670, 300); c.strokeStyle = '#8E5CF6'; c.lineWidth = 6; c.stroke(); D.tag(c, g.p.Rx + ' Ω', 600, 330, '#EBE0FF', { size: 14 }); }
        D.bar(c, 260, 330, 280, 22, br / 2, br > 1.15 ? '#FF4757' : '#12B76A', 'brillo ' + FK.n(br * 100, 0) + ' %', { ink: '#fff' });
        D.char(c, 'chispa', 700, 150, 70, S.burnt ? 'sad' : 'happy');
      }
    });
  });

  /* ---------- Pilas en serie y en paralelo ---------- */
  FK.sim('pilas', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('b', { label: 'Bombillo', icon: '💡', options: [[1.5, 'De 1,5 V'], [6, 'De 6 V']], value: 6 });
    g.slider('n', { label: 'Número de pilas', icon: '🔋', min: 1, max: 4, step: 1, value: 1, fmt: (v) => FK.n(v, 0) });
    g.choice('con', { label: 'Conexión', icon: '🔗', options: [['serie', 'En serie'], ['par', 'En paralelo']], value: 'serie' });
    g.out('V', 'Voltaje total', { icon: '⚡' }); g.out('br', 'Brillo', { icon: '💡', hl: true }); g.out('h', 'Duración', { icon: '⏳' });
    const done = { six: false, long: false };
    g.run({
      static: true,
      init() { done.six = done.long = false; g.say('Prueba combinaciones: ¿cuántas pilas y cómo las conectas?'); },
      draw(c, W, H) {
        const n = g.p.n, V = g.p.con === 'serie' ? 1.5 * n : 1.5, nom = g.p.b, br = C.bulbBrightness(V, nom);
        const Rb = (nom * nom) / (nom * 0.3), I = V / Rb, cap = 2.5 * (g.p.con === 'par' ? n : 1), life = cap / I;
        g.show('V', FK.n(V, 1) + ' V'); g.show('br', br > 1.6 ? '💥 se funde' : FK.n(Math.min(br, 1.5) * 100, 0) + ' %'); g.show('h', br > 1.6 ? '—' : FK.n(life, 0) + ' h aprox.');
        if (nom === 6 && V === 6 && br >= 0.9 && br <= 1.2 && !done.six) { done.six = true; FK.sfx.ok(); g.say('¡Brilla! Cuatro pilas en serie suman 6 V.', 'wow'); }
        if (nom === 1.5 && g.p.con === 'par' && n >= 3 && !done.long) { done.long = true; FK.sfx.ok(); g.say('¡Dura mucho más! En paralelo el voltaje es el mismo pero las pilas se reparten el trabajo.', 'wow'); }
        if (done.six && done.long && !g.won()) g.win('¡Serie para más voltaje, paralelo para más duración!');
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB');
        for (let i = 0; i < n; i++) {
          const x = g.p.con === 'serie' ? 90 + i * 100 : 90, y = g.p.con === 'serie' ? 230 : 70 + i * 70;
          D.box(c, x - 40, y - 24, 80, 48, '#FF8A1F', { r: 8 }); D.text(c, '1,5 V', x, y, { size: 16, align: 'center', color: '#fff', weight: 700 });
          if (g.p.con === 'serie' && i < n - 1) D.line(c, x + 40, y, x + 60, y, D.INK, 4);
        }
        const bx = 620, by = 200, lit = M.clamp(br, 0, 1.4);
        if (lit > 0.05) { const gr = c.createRadialGradient(bx, by, 5, bx, by, 110); gr.addColorStop(0, `rgba(255,244,140,${Math.min(0.9, 0.6 * lit)})`); gr.addColorStop(1, 'rgba(255,244,140,0)'); c.fillStyle = gr; c.fillRect(bx - 120, by - 120, 240, 240); }
        D.emoji(c, br > 1.6 ? '💥' : lit > 0.1 ? '💡' : '🔅', bx, by, 70); D.tag(c, 'bombillo de ' + (nom === 1.5 ? '1,5' : '6') + ' V', bx, by + 60, '#fff', { size: 14 });
        D.line(c, 90 + (g.p.con === 'serie' ? n * 100 - 50 : 40), g.p.con === 'serie' ? 230 : 70, bx - 40, by, D.INK, 4);
        D.char(c, 'chispa', 60, 330, 64, 'happy');
      }
    });
  });

  /* ---------- Enchufe sobrecargado ---------- */
  const APP = [['💡', 'Bombillo LED', 10], ['📺', 'Televisor', 100], ['🧊', 'Nevera', 150], ['🌀', 'Ventilador', 60], ['🥤', 'Licuadora', 400], ['👔', 'Plancha', 1000], ['🍲', 'Horno microondas', 1200], ['💨', 'Secador de pelo', 1800]];
  FK.sim('enchufe', function (g) {
    const ctx = g.canvas(2.4);
    g.out('W', 'Potencia total', { icon: '⚡' }); g.out('A', 'Corriente (120 V)', { icon: '🌊', hl: true });
    const S = { on: APP.map(() => false), tripped: false, hold: 0, done: false };
    const btns = APP.map((a, i) => g.button(a[0] + ' ' + a[1] + ' (' + a[2] + ' W)', () => { if (S.tripped) { g.say('El breaker está disparado. Presiona «Subir el breaker» para volver a empezar.', 'think'); return; } S.on[i] = !S.on[i]; const w = tot(); if (w > 1800) { S.tripped = true; FK.sfx.boom(); g.say(`¡CLAC! ${FK.int(w)} W son ${FK.n(w / 120, 1)} A y el breaker de 15 A se disparó. Así evita un incendio.`, 'sad'); } else FK.sfx.tick(); }, { kind: 'ghost', newRow: i % 2 === 0 }));
    g.button('Subir el breaker', () => { S.tripped = false; S.on = APP.map(() => false); g.say('Breaker arriba. Vuelve a empezar.'); }, { icon: '🔼', newRow: true });
    const tot = () => APP.reduce((s, a, i) => s + (S.on[i] ? a[2] : 0), 0);
    g.run({
      init() { S.on = APP.map(() => false); S.tripped = false; S.hold = 0; g.say('El breaker de 15 A en 120 V aguanta como máximo 1800 W. Enchufa aparatos hasta acercarte sin pasarte.'); },
      step(dt) {
        const w = tot(); g.show('W', FK.int(w) + ' W'); g.show('A', FK.n(w / 120, 1) + ' A de 15 A');
        btns.forEach((b, i) => b.classList.toggle('primary', S.on[i]));
        if (!S.tripped && w >= 1500 && w <= 1800) { S.hold += dt; if (S.hold > 2 && !g.won()) g.win(`¡${FK.int(w)} W (${FK.n(w / 120, 1)} A)! Cerca del límite, pero sin pasarse.`); } else S.hold = 0;
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E6F4FF', '#F8FCFF'); D.ground(c, W, H - 40, H, '#C9C9D9', '#9A9AB5');
        const w = tot(), f = M.clamp(w / 1800, 0, 1.2);
        D.box(c, 40, 40, 700, 60, '#fff', { r: 14 }); D.bar(c, 56, 56, 668, 28, M.clamp(f, 0, 1), f > 0.95 ? '#FF4757' : f > 0.8 ? '#FFC21A' : '#12B76A', FK.int(w) + ' W de 1800 W', { size: 17, ink: '#2B2350' });
        let x = 60; S.on.forEach((on, i) => { if (on) { D.emoji(c, APP[i][0], x, 190, 50); D.line(c, x, 215, x, 270, D.INK, 3); x += 80; } });
        D.box(c, 40, 270, 700, 40, '#8A8AA0', { r: 10 }); D.text(c, S.tripped ? '⚡ BREAKER DISPARADO' : 'regleta de enchufes', 390, 290, { size: 18, align: 'center', color: '#fff', weight: 700 });
        D.char(c, 'chispa', 700, 170, 64, S.tripped ? 'sad' : 'happy');
      }
    });
  });
})();
