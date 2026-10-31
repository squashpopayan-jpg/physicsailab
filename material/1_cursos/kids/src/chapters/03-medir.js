/* Capítulo 3 — Medir el mundo */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M;

  /* ---------- Adivina cuánto mide ---------- */
  FK.sim('estima-largo', function (g) {
    const ctx = g.canvas(2.5);
    g.slider('guess', { label: 'Mi adivinanza', icon: '🤔', min: 1, max: 20, step: 0.5, value: 8, unit: 'cm', fmt: (v) => FK.n(v, 1) });
    g.button('Revisar', () => check(), { icon: '✅' });
    g.out('ronda', 'Ronda', { icon: '🎯' }); g.out('aciertos', 'Aciertos', { icon: '⭐', hl: true });
    const s = { r: 0, L: 8, shown: false, ok: 0, hits: [], item: null, over: false };
    const ITEMS = [['✏️', '#FFC21A'], ['🥢', '#C9A06B'], ['🖍️', '#FF4757'], ['🪢', '#1E88FF'], ['🥕', '#FF8A1F'], ['🍌', '#FFE066']];
    const next = () => {
      s.L = Math.round(M.rnd(4, 18) * 2) / 2; s.shown = false; s.item = M.pick(ITEMS);
      g.setSlider('guess', 8); g.show('ronda', `${s.r + 1} de 5`); g.show('aciertos', s.ok);
      g.say('La regla pequeña de arriba mide 5 cm. ¿Cuánto mide el objeto de abajo?');
    };
    function check() {
      if (s.over) { g.restart(); return; }
      if (s.shown) { s.r++; if (s.r >= 5) { end(); return; } next(); return; }
      s.shown = true;
      const err = Math.abs(g.p.guess - s.L) / s.L;
      const ok = err <= 0.15;
      if (ok) { s.ok++; FK.sfx.ok(); g.say(`¡Bien! Medía ${FK.n(s.L, 1)} cm. Casi exacto.`, 'happy'); }
      else { FK.sfx.no(); g.say(`Medía ${FK.n(s.L, 1)} cm. ¡Casi! Compara con la regla de 5 cm.`, 'think'); }
      g.show('aciertos', s.ok);
    }
    function end() {
      s.over = true;
      if (s.ok >= 3) g.win(`¡${s.ok} aciertos de 5! ¡Tienes ojo de científico!`); else g.say(`Acertaste ${s.ok} de 5. ¡Toca «Otra vez» para mejorar!`, 'think');
    }
    g.run({
      static: true,
      init() { s.r = 0; s.ok = 0; s.over = false; next(); },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7'); D.grid(c, W, H, 32);
        const pxcm = 34, x0 = 60;
        D.text(c, 'Regla de comparación', x0, 38, { size: 16, color: D.INK });
        D.box(c, x0, 52, 5 * pxcm, 26, '#FFE066', { r: 6 });
        for (let i = 0; i <= 5; i++) D.line(c, x0 + i * pxcm, 52, x0 + i * pxcm, i % 5 === 0 ? 72 : 66, D.INK, 2);
        D.tag(c, '5 cm', x0 + 2.5 * pxcm, 96, '#fff', { size: 14 });
        const y = 190, w = s.L * pxcm;
        const [em, col] = s.item || ITEMS[0];
        D.box(c, x0, y - 16, w, 32, col, { r: 14 });
        D.emoji(c, em, x0 + w + 22, y, 36);
        D.text(c, '¿Cuánto mide?', x0, y - 40, { size: 20, weight: 700 });
        if (s.shown) {
          const gx = g.p.guess * pxcm;
          D.line(c, x0, y + 40, x0 + gx, y + 40, '#8E5CF6', 8); D.tag(c, 'tu adivinanza: ' + FK.n(g.p.guess, 1) + ' cm', x0 + gx / 2, y + 66, '#EBE0FF', { size: 14 });
          D.line(c, x0, y + 100, x0 + w, y + 100, '#12B76A', 8); D.tag(c, 'real: ' + FK.n(s.L, 1) + ' cm', x0 + w / 2, y + 126, '#D6F5E6', { size: 14 });
        } else {
          D.text(c, 'Tu adivinanza: ' + FK.n(g.p.guess, 1) + ' cm', x0, y + 50, { size: 18, color: '#8E5CF6', weight: 700 });
        }
        s.hits.forEach(() => 0);
      }
    });
  });

  /* ---------- Viaje por los tamaños ---------- */
  const SIZES = [
    ['⚛️', 'un protón', 1.7e-15, 'Es una de las piezas del núcleo de un átomo.'],
    ['🔬', 'un átomo', 1e-10, 'Todo lo que ves está hecho de átomos.'],
    ['🦠', 'un virus', 1e-7, 'Tan pequeño que no se ve ni con una lupa.'],
    ['🩸', 'un glóbulo rojo', 8e-6, 'Lleva el oxígeno por tu sangre.'],
    ['⏳', 'un grano de arena', 5e-4, 'Medio milímetro.'],
    ['🐜', 'una hormiga', 5e-3, 'Cinco milímetros de largo.'],
    ['🍎', 'una manzana', 0.08, 'Unos 8 centímetros.'],
    ['🧍', 'una persona', 1.7, 'Casi dos metros de alto, como tú de grande.'],
    ['🐋', 'una ballena azul', 27, 'El animal más grande que ha existido: 27 metros.'],
    ['🏔️', 'el monte Everest', 8849, 'Casi 9 kilómetros de altura.'],
    ['🌍', 'la Tierra', 1.274e7, 'Más de 12 000 kilómetros de lado a lado.'],
    ['☀️', 'el Sol', 1.39e9, 'Caben más de un millón de Tierras dentro.'],
    ['🪐', 'el Sistema Solar', 9e12, 'Hasta la órbita de Neptuno.'],
    ['⭐', 'la estrella Próxima Centauri', 4e16, 'Está a 4,2 años luz. La luz tarda más de 4 años en llegar.'],
    ['🌌', 'la Vía Láctea', 9.5e20, 'Nuestra galaxia, con cientos de miles de millones de estrellas.'],
    ['🌠', 'el universo que podemos ver', 8.8e26, 'Lo más grande que conocemos.']
  ];
  FK.sim('escalas', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('e', { label: 'Tamaño (poderes de diez)', icon: '🔎', min: -15, max: 27, step: 0.05, value: 0.2, fmt: (v) => FK.pow10(v), unit: 'm' });
    g.out('size', 'Tamaño', { icon: '📏', hl: true });
    const seen = new Set();
    const idx = () => { const e = g.p.e; let b = 0, bd = 99; SIZES.forEach((o, i) => { const d = Math.abs(Math.log10(o[2]) - e); if (d < bd) { bd = d; b = i; } }); return [b, bd]; };
    g.run({
      static: true,
      init() { seen.clear(); g.say('Mueve la barra y recorre los tamaños del universo.'); },
      draw(c, W, H) {
        D.night(c, W, H, 7, 70);
        const [bi, bd] = idx(), o = SIZES[bi];
        const near = bd < 0.7;
        g.show('size', FK.nice(Math.pow(10, g.p.e)) + ' m');
        if (bd < 0.35 && !seen.has(bi)) { seen.add(bi); FK.sfx.pop(); g.say(`${o[0]} Cerca de ${o[1]}: ${o[3]}`, 'wow'); if (seen.size >= 8) g.win('¡Descubriste 8 tamaños distintos!'); }
        D.emoji(c, near ? o[0] : '❓', W / 2, 105, near ? 100 : 70);
        D.text(c, near ? o[1] : 'Casi nada por aquí…', W / 2, 185, { size: 26, align: 'center', color: '#fff', weight: 700 });
        D.text(c, `Descubiertos: ${seen.size} de 8`, W / 2, 215, { size: 17, align: 'center', color: '#FFE066' });
        /* regla logarítmica */
        const x0 = 40, x1 = W - 40, y = 300, X = (e) => x0 + ((e + 15) / 42) * (x1 - x0);
        D.box(c, x0 - 10, y - 8, x1 - x0 + 20, 16, 'rgba(255,255,255,.18)', { r: 8, stroke: 'rgba(255,255,255,.5)', lw: 2 });
        SIZES.forEach((q, i) => { const e = Math.log10(q[2]); D.emoji(c, q[0], X(e), y + (i % 2 ? 34 : -34), seen.has(i) ? 30 : 22); D.circle(c, X(e), y, 5, seen.has(i) ? '#FFC21A' : '#fff'); });
        const mx = X(g.p.e);
        D.poly(c, [[mx, y - 14], [mx - 11, y - 34], [mx + 11, y - 34]], '#FF4757', '#fff', 2);
                D.text(c, 'más pequeño', x0 + 70, y + 92, { size: 14, color: '#B9B3E6' }); D.text(c, 'más grande', x1 - 70, y + 92, { size: 14, color: '#B9B3E6', align: 'right' });
      }
    });
  });

  /* ---------- Reflejos ---------- */
  FK.sim('reflejos', function (g) {
    const ctx = g.canvas(2.4);
    g.button('¡Empezar!', () => start(), { icon: '🚦' });
    g.out('ult', 'Último', { icon: '⏱️' }); g.out('mejor', 'Mejor', { icon: '🏆', hl: true });
    const s = { st: 'idle', wait: 0, t0: 0, tries: [], best: null, msg: '' };
    const start = () => { if (s.st === 'wait' || s.st === 'go') return; s.st = 'wait'; s.wait = M.rnd(1.2, 3.2); s.msg = ''; g.say('Espera… ¡no toques todavía!', 'think'); };
    const click = () => {
      if (s.st === 'idle' || s.st === 'result' || s.st === 'early') { start(); return; }
      if (s.st === 'wait') { s.st = 'early'; FK.sfx.no(); g.say('¡Demasiado pronto! Espera a que sea verde.', 'sad'); return; }
      if (s.st === 'go') {
        const ms = Math.round(performance.now() - s.t0); s.tries.push(ms); s.best = Math.min(s.best === null ? 1e9 : s.best, ms);
        s.st = 'result'; s.msg = ms + ' ms'; g.show('ult', ms + ' ms'); g.show('mejor', s.best + ' ms'); FK.sfx.ok();
        if (s.best < 350) g.win(`¡${s.best} milisegundos! ¡Reflejos de campeón!`); else g.say(`${ms} ms. ¡Otra vez! Intenta bajar de 350.`, 'happy');
      }
    };
    g.run({
      init() { s.st = 'idle'; s.tries = []; s.best = null; g.show('ult', '—'); g.show('mejor', '—'); g.say('Presiona «¡Empezar!» o toca la pantalla. Cuando se ponga verde, ¡toca rápido!'); },
      step(dt) { if (s.st === 'wait') { s.wait -= dt; if (s.wait <= 0) { s.st = 'go'; s.t0 = performance.now(); } } },
      draw(c, W, H) {
        const col = { idle: '#FFC21A', wait: '#FF4757', go: '#12B76A', result: '#1E88FF', early: '#8E5CF6' }[s.st];
        c.fillStyle = col; c.fillRect(0, 0, W, H);
        const txt = { idle: 'Toca para empezar', wait: 'Espera…', go: '¡YA!', result: s.msg + ' · toca para repetir', early: '¡Muy pronto! Toca para repetir' }[s.st];
        D.text(c, txt, W / 2, H / 2 - 10, { size: s.st === 'go' ? 80 : 40, align: 'center', color: '#fff', stroke: 'rgba(43,35,80,.5)', weight: 700 });
        D.text(c, 'Intentos: ' + (s.tries.length ? s.tries.join(' · ') + ' ms' : '—'), W / 2, H - 28, { size: 18, align: 'center', color: '#fff', stroke: 'rgba(43,35,80,.4)' });
      }
    });
    g.pointer({ down: () => click() });
  });
})();
