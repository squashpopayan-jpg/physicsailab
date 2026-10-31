/* Capítulo 22 — La física de la música */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Afina la cuerda ---------- */
  FK.sim('cuerda-guitarra', function (g) {
    const ctx = g.canvas(2.6);
    g.slider('L', { label: 'Largo de la cuerda', icon: '📏', min: 0.2, max: 0.65, step: 0.005, value: 0.65, unit: 'm', fmt: (v) => FK.n(v, 3) });
    g.choice('T', { label: 'Tensión', icon: '🔧', options: [[40, 'Floja'], [70, 'Media'], [100, 'Tensa']], value: 70 });
    g.choice('mu', { label: 'Grosor', icon: '🧵', options: [[0.4, 'Fina'], [1.0, 'Media'], [3.0, 'Gruesa']], value: 0.4 });
    g.button('🎸 Pulsar la cuerda', () => pluck(), { kind: 'primary' });
    g.out('f', 'Frecuencia', { icon: '🎵', hl: true }); g.out('n', 'Nota más cercana', { icon: '🎼' });
    const S = { amp: 0, t: 0 };
    const freq = () => C.stringFreq(g.p.L, g.p.T, g.p.mu / 1000);
    function pluck() {
      S.amp = 1; const f = freq();
      FK.tone(f, 1.4, { type: 'triangle', vol: 0.2 }); FK.tone(2 * f, 0.9, { type: 'sine', vol: 0.05 });
      if (Math.abs(f - 440) <= 4.4) g.win(`¡La! ${FK.n(f, 1)} Hz: está afinada.`); else g.say(`Suena a ${FK.n(f, 1)} Hz. ${f > 440 ? 'Está muy aguda: alárgala, afloja o usa una cuerda más gruesa.' : 'Está muy grave: acórtala, tensa o usa una cuerda más fina.'}`, 'think');
    }
    g.run({
      init() { S.amp = 0; g.say('Para un La necesitas 440 Hz. Cambia el largo, la tensión o el grosor y pulsa.'); },
      step(dt) { S.amp = Math.max(0, S.amp - dt * 0.7); S.t += dt; const f = freq(); g.show('f', FK.n(f, 1) + ' Hz'); g.show('n', C.noteName(f)); },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF1D9', '#FFFBF2');
        D.box(c, 20, 60, W - 40, H - 120, '#C98A3F', { r: 18 }); D.circle(c, W - 160, H / 2, 70, '#5A3418', D.INK, 4);
        const x0 = 50, x1 = 50 + (g.p.L / 0.65) * (W - 160), cy = H / 2, th = 2 + (g.p.mu / 3) * 6;
        c.strokeStyle = D.INK; c.lineWidth = 8; c.lineCap = 'round';
        D.line(c, x0, cy - 50, x0, cy + 50, '#E8E0D0', 10);
        const f = freq(), cyc = 3;
        c.beginPath(); for (let x = x0; x <= x1; x += 4) { const u = (x - x0) / (x1 - x0), y = cy + S.amp * 16 * Math.sin(Math.PI * u) * Math.sin(S.t * Math.min(120, f / 6)); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); }
        c.strokeStyle = '#2B2350'; c.lineWidth = th; c.stroke();
        D.circle(c, x1, cy, 9, '#FFC21A', D.INK, 3);
        D.char(c, 'eco', W - 60, 40, 60, 'happy');
        D.tag(c, 'objetivo: La = 440 Hz', 150, 36, '#fff', { size: 15 });
      }
    });
  });

  /* ---------- Flauta de botellas ---------- */
  const NOTES = [['Do', 261.63], ['Re', 293.66], ['Mi', 329.63], ['Sol', 392.0], ['La', 440.0]];
  FK.sim('flauta-botellas', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('b', { label: 'Botella', icon: '🍾', options: NOTES.map((n, i) => [i, n[0]]), value: 0, onchange: (v) => { g.setSlider('h', lv[v] * 100); } });
    g.slider('h', { label: 'Agua en la botella', icon: '💧', min: 0, max: 36, step: 0.5, value: 0, unit: 'cm', fmt: (v) => FK.n(v, 1), onchange: (v) => { lv[g.p.b] = v / 100; } });
    g.button('🎶 Soplar', () => blow(), { kind: 'primary' });
    g.out('f', 'Frecuencia de esta botella', { icon: '🎵', hl: true }); g.out('ok', 'Botellas afinadas', { icon: '✅' });
    const H = 0.4, lv = [0, 0, 0, 0, 0], S = { t: 0, sel: -1, ok: [false, false, false, false, false] };
    const freq = (i) => C.bottleFreq(H - lv[i]);
    function blow() {
      const i = g.p.b, f = freq(i); S.sel = i; S.t = 0;
      FK.tone(f, 0.9, { type: 'sine', vol: 0.2 }); FK.tone(2 * f, 0.5, { type: 'sine', vol: 0.03 });
      const err = Math.abs(f - NOTES[i][1]) / NOTES[i][1];
      S.ok[i] = err <= 0.015;
      if (S.ok[i]) { FK.sfx.ok(); g.say(`¡${NOTES[i][0]}! ${FK.n(f, 0)} Hz. Esta botella está afinada.`, 'happy'); } else g.say(`Suena a ${FK.n(f, 0)} Hz y el ${NOTES[i][0]} es ${FK.n(NOTES[i][1], 0)} Hz. ${f > NOTES[i][1] ? 'Muy aguda: quita agua.' : 'Muy grave: añade agua.'}`, 'think');
      if (S.ok.every(Boolean)) g.win('¡Las cinco botellas están afinadas! Ya puedes tocar una melodía.');
    }
    g.run({
      init() { for (let i = 0; i < 5; i++) { lv[i] = 0; S.ok[i] = false; } g.setSlider('h', 0); g.setChoice('b', 0); g.say('Cada botella tiene su nota. Añade agua para acortar la columna de aire y subir el tono.'); },
      step(dt) { S.t += dt; g.show('f', FK.n(freq(g.p.b), 0) + ' Hz'); g.show('ok', S.ok.filter(Boolean).length + ' de 5'); },
      draw(c, W, H2) {
        D.sky(c, W, H2, '#F3EAFF', '#FFFFFF'); D.ground(c, W, H2 - 40, H2, '#C9C9D9', '#9A9AB5');
        const gy = H2 - 40, bh = 260;
        NOTES.forEach((n, i) => {
          const x = 100 + i * 150, sel = i === g.p.b;
          D.box(c, x - 34, gy - bh, 68, bh, 'rgba(200,230,255,.45)', { r: 18, lw: sel ? 6 : 3, stroke: sel ? '#8E5CF6' : D.INK });
          const wh = (lv[i] / H) * bh; c.fillStyle = 'rgba(40,140,255,.7)'; c.fillRect(x - 31, gy - wh - 3, 62, wh);
          D.tag(c, n[0], x, gy + 22, S.ok[i] ? '#B8F2D0' : '#fff', { size: 17 });
          if (S.sel === i && S.t < 0.8) { for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x, gy - bh - 6 - k * 10 - S.t * 30, 14 + k * 8, Math.PI * 1.15, Math.PI * 1.85); c.strokeStyle = '#8E5CF6'; c.lineWidth = 4; c.stroke(); } }
          if (S.ok[i]) D.text(c, '✅', x, gy - bh - 20, { size: 22, align: 'center' });
        });
        D.char(c, 'eco', W - 60, 50, 64, 'happy');
      }
    });
  });

  /* ---------- Pulsos ---------- */
  FK.sim('pulsos', function (g) {
    const ctx = g.canvas(2.6);
    g.slider('d', { label: 'Frecuencia de la 2.ª cuerda', icon: '🎵', min: 430, max: 450, step: 0.5, value: 446, unit: 'Hz', fmt: (v) => FK.n(v, 1) });
    g.button('▶ Sonar las dos', () => { S.on = !S.on; if (S.on) start(); else stop(); }, { kind: 'primary' });
    g.out('p', 'Pulsos por segundo', { icon: '〰️', hl: true });
    const S = { on: false, h1: null, h2: null };
    const stop = () => { if (S.h1) { S.h1.stop(); S.h2.stop(); S.h1 = S.h2 = null; } };
    const start = () => { stop(); S.h1 = FK.hum(440, 0.08); S.h2 = FK.hum(g.p.d, 0.08); };
    g._stopAudio = () => { stop(); S.on = false; };
    g.run({
      init() { stop(); S.on = false; g.setSlider('d', M.pick([434, 436, 444, 446, 448])); g.say('La primera cuerda suena a 440 Hz. Mueve la segunda hasta que no haya pulsos.'); },
      step() {
        const d = Math.abs(g.p.d - 440); g.show('p', FK.n(d, 1) + ' por segundo');
        if (S.h2 && !S.h2.off) S.h2.set(g.p.d, 0.08);
        if (d < 0.01 && S.on && !g.won()) g.win('¡Afinadas! Sin pulsos, las dos notas tienen exactamente la misma frecuencia.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF'); D.grid(c, W, H, 40, 'rgba(43,35,80,.06)');
        const cy = H / 2, d = g.p.d - 440;
        /* ventana de 1 s: portadora visual de 40 Hz (representa 440) y la segunda a 40 + diferencia */
        c.beginPath(); for (let x = 0; x <= W; x += 1) { const t = x / W, v = 0.5 * (Math.sin(M.TAU * 40 * t) + Math.sin(M.TAU * (40 + d) * t)); const y = cy - v * 120; x ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.strokeStyle = '#8E5CF6'; c.lineWidth = 3; c.stroke();
        for (const sg of [-1, 1]) { c.beginPath(); for (let x = 0; x <= W; x += 3) { const t = x / W, v = Math.abs(Math.cos(Math.PI * d * t)); const y = cy + sg * v * 120; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = '#FF4757'; c.lineWidth = 4; c.stroke(); }
        D.text(c, Math.abs(d) < 0.01 ? 'sin pulsos: ¡afinadas!' : 'la línea roja muestra los pulsos', W / 2, 28, { size: 18, align: 'center', weight: 700 });
        D.char(c, 'eco', W - 60, H - 40, 60, Math.abs(d) < 0.01 ? 'wow' : 'happy');
      }
    });
  });
})();
