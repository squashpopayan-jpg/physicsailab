/* Capítulo 21 — El sonido */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Fabrica sonidos ---------- */
  FK.sim('tono-volumen', function (g) {
    const ctx = g.canvas(2.6);
    g.slider('lf', { label: 'Frecuencia (tono)', icon: '🎵', min: 0, max: 100, step: 1, value: 40, fmt: (v) => FK.n(C.logFreq(v), 0) + ' Hz' });
    g.slider('vol', { label: 'Volumen', icon: '🔊', min: 0, max: 100, step: 1, value: 30, unit: '%', fmt: (v) => FK.n(v, 0) });
    g.choice('tipo', { label: 'Forma de onda', icon: '〰️', options: [['sine', 'Suave'], ['triangle', 'Triángulo'], ['square', 'Cuadrada'], ['sawtooth', 'Diente de sierra']], value: 'sine', onchange: () => restartHum() });
    g.button('▶ Sonar', () => { S.on = !S.on; if (S.on) restartHum(); else stop(); }, { kind: 'primary' });
    g.out('f', 'Frecuencia', { icon: '🎵', hl: true }); g.out('T', 'Período', { icon: '⏱️' });
    const S = { on: false, hum: null, low: false, high: false };
    const stop = () => { if (S.hum) { S.hum.stop(); S.hum = null; } };
    const restartHum = () => { stop(); if (S.on) S.hum = FK.hum(C.logFreq(g.p.lf), 0.25 * (g.p.vol / 100) * (g.p.vol / 100), g.p.tipo); };
    g._stopAudio = () => { stop(); S.on = false; };
    g.run({
      static: false,
      init() { stop(); S.on = false; g.say('Presiona «Sonar» (y activa el altavoz de arriba). Mueve la frecuencia y el volumen.'); },
      step() {
        const f = C.logFreq(g.p.lf); g.show('f', FK.n(f, 0) + ' Hz'); g.show('T', FK.n(1000 / f, f > 500 ? 2 : 1) + ' ms');
        if (S.hum && !S.hum.off) S.hum.set(f, 0.25 * (g.p.vol / 100) * (g.p.vol / 100));
        if (S.on) { if (f < 200) S.low = true; if (f > 1500) S.high = true; if (S.low && S.high && !g.won()) g.win('¡Grave y agudo! Frecuencia baja = grave; frecuencia alta = agudo.'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF'); D.grid(c, W, H, 40, 'rgba(43,35,80,.06)');
        const f = C.logFreq(g.p.lf), amp = (g.p.vol / 100) * (H * 0.4), cy = H / 2;
        D.line(c, 0, cy, W, cy, 'rgba(43,35,80,.2)', 2);
        const cyc = M.clamp(Math.log10(f / 100) * 4 + 2, 1, 40);
        c.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const ph = (x / W) * cyc * M.TAU - (S.on ? g.t * 8 : 0);
          let v = Math.sin(ph); if (g.p.tipo === 'square') v = Math.sign(v); else if (g.p.tipo === 'triangle') v = (2 / Math.PI) * Math.asin(Math.sin(ph)); else if (g.p.tipo === 'sawtooth') v = 2 * ((ph / M.TAU) % 1 + 1) % 2 - 1;
          x ? c.lineTo(x, cy - v * amp) : c.moveTo(x, cy - v * amp);
        }
        c.strokeStyle = S.on ? '#8E5CF6' : '#B9A5F0'; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke();
        D.char(c, 'eco', W - 60, 50, 64, S.on ? 'wow' : 'happy');
        if (!FK.soundOn()) D.tag(c, '🔇 el sonido está apagado (botón de arriba)', W / 2, 24, '#FFE0E3', { size: 14 });
        D.text(c, f < 20 ? 'infrasonido' : f > 20000 ? 'ultrasonido' : f < 250 ? 'grave' : f > 2000 ? 'agudo' : 'medio', 16, H - 16, { size: 18, weight: 700 });
      }
    });
  });

  /* ---------- Eco ---------- */
  FK.sim('eco', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('guess', { label: 'Mi cálculo de la distancia', icon: '🤔', min: 20, max: 700, step: 5, value: 300, unit: 'm', fmt: (v) => FK.n(v, 0) });
    g.button('¡Gritar!', () => shout(), { icon: '📢' }); g.button('Comprobar', () => check(), { icon: '✅', kind: 'ghost' }); g.button('Otra montaña', () => g.restart(), { icon: '⛰️', kind: 'ghost' });
    g.out('t', 'Tiempo del eco', { icon: '⏱️', hl: true }); g.out('v', 'Rapidez del sonido', { icon: '💨' });
    const S = { D: 200, st: 'ready', t: 0, tt: 0, done: false };
    function shout() { if (S.st !== 'ready') return; S.st = 'go'; S.t = 0; FK.tone(330, 0.25, { type: 'sawtooth', vol: 0.12 }); }
    function check() { if (S.tt === 0 || S.done) { g.say('Primero grita y mide el tiempo del eco.', 'think'); return; } S.done = true; const err = Math.abs(g.p.guess - S.D) / S.D; if (err <= 0.1) g.win(`¡Muy bien! La montaña estaba a ${S.D} m: 343 × ${FK.n(S.tt, 2)} ÷ 2.`); else g.say(`La montaña estaba a ${S.D} m. Recuerda: distancia = 343 × tiempo ÷ 2. ¡Otra montaña!`, 'think'); }
    g.run({
      init() { S.D = Math.round(M.rnd(50, 600) / 5) * 5; S.st = 'ready'; S.t = 0; S.tt = 0; S.done = false; g.show('t', '—'); g.show('v', '343 m/s'); g.say('Grita y mira cuánto tarda el eco. Después calcula la distancia a la montaña.'); },
      step(dt) {
        if (S.st !== 'go') return;
        S.t += dt;
        const tt = C.echoTime(S.D);
        if (S.t >= tt) { S.st = 'back'; S.tt = tt; g.show('t', FK.n(tt, 2) + ' s'); FK.tone(330, 0.3, { type: 'sine', vol: 0.06 }); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 50, H, '#7ED957', '#B9824A');
        const gy = H - 50, x0 = 110, x1 = W - 120;
        c.beginPath(); c.moveTo(W - 200, gy); c.lineTo(W - 100, gy - 220); c.lineTo(W - 20, gy - 70); c.lineTo(W, gy - 100); c.lineTo(W, gy); c.closePath(); c.fillStyle = '#8A8AA0'; c.fill(); c.lineWidth = 4; c.strokeStyle = D.INK; c.stroke();
        D.char(c, 'eco', x0, gy - 50, 90, S.st === 'go' ? 'wow' : 'happy');
        if (S.st === 'go' || S.st === 'back') {
          const tt = C.echoTime(S.D), p = S.st === 'back' ? 1 : S.t / tt, out = Math.min(1, p * 2), back = Math.max(0, p * 2 - 1);
          const xs = x0 + 60 + (out - back) * (x1 - x0 - 60);
          for (let i = 0; i < 4; i++) { c.beginPath(); if (back > 0) c.arc(xs + i * 22, gy - 60, 28 + i * 8, Math.PI - 0.9, Math.PI + 0.9); else c.arc(xs - i * 22, gy - 60, 28 + i * 8, -0.9, 0.9); c.strokeStyle = back > 0 ? '#12B76A' : '#8E5CF6'; c.lineWidth = 5; c.lineCap = 'round'; c.stroke(); }
        }
        D.tag(c, '¿cuántos metros?', (x0 + x1) / 2, gy + 26, '#fff', { size: 14 });
        if (S.done) D.tag(c, 'real: ' + S.D + ' m', (x0 + x1) / 2, gy - 130, '#B8F2D0', { size: 18 });
      }
    });
  });

  /* ---------- Efecto Doppler ---------- */
  FK.sim('doppler', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('v', { label: 'Rapidez de la ambulancia', icon: '🚑', min: 0, max: 50, step: 1, value: 25, unit: 'm/s', fmt: (v) => FK.n(v, 0) });
    g.button('🚑 ¡Que pase!', () => { S.x = -80; S.run = true; if (!S.hum && FK.soundOn()) S.hum = FK.hum(700, 0.12, 'square'); }, { kind: 'primary' });
    g.out('f', 'Tono que oyes', { icon: '👂', hl: true }); g.out('f0', 'Tono de la sirena', { icon: '🔔' });
    const S = { x: -80, run: false, hum: null, passed: false, waves: [] };
    const stop = () => { if (S.hum) { S.hum.stop(); S.hum = null; } };
    g._stopAudio = () => { stop(); S.run = false; };
    g.run({
      init() { stop(); S.x = -80; S.run = false; S.waves = []; S.passed = false; g.show('f0', '700 Hz'); g.show('f', '—'); g.say('Observa cómo las ondas se aprietan delante de la ambulancia. Presiona «¡Que pase!».'); },
      step(dt) {
        const v = g.p.v, ox = 400;
        if (S.run) {
          S.x += v * dt * 10; S.acc = (S.acc || 0) + dt; if (S.acc > 0.12) { S.acc = 0; S.waves.push({ x: S.x, r: 0 }); }
          const dx = ox - S.x, d = Math.hypot(dx, 60), vr = (v * dx) / d; /* componente hacia el oyente */
          const f = C.dopplerSource(700, vr);
          g.show('f', FK.n(f, 0) + ' Hz ' + (vr > 0.5 ? '⬆️ agudo' : vr < -0.5 ? '⬇️ grave' : ''));
          if (S.hum && !S.hum.off) S.hum.set(f, 0.12);
          if (S.x > ox + 40 && !S.passed) { S.passed = true; if (v >= 20 && !g.won()) g.win('¡Pasó! Al acercarse sonó más agudo y al alejarse más grave: efecto Doppler.'); }
          if (S.x > 900) { S.run = false; stop(); }
        }
        S.waves.forEach((w) => { w.r += dt * 343 * 0.6; }); S.waves = S.waves.filter((w) => w.r < 600);
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#E6E0FF', '#F8F5FF'); D.ground(c, W, H - 60, H, '#C9C9D9', '#9A9AB5');
        S.waves.forEach((w) => { c.beginPath(); c.arc(w.x, H - 110, w.r, 0, M.TAU); c.strokeStyle = `rgba(142,92,246,${Math.max(0, 0.7 - w.r / 600)})`; c.lineWidth = 3; c.stroke(); });
        D.emoji(c, '🚑', S.x, H - 100, 64, 0, true);
        D.char(c, 'eco', 400, H - 40, 70, 'happy');
        D.tag(c, '👂 oyente', 400, H - 4, '#fff', { size: 12 });
      }
    });
  });
})();
