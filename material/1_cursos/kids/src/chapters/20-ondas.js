/* Capítulo 20 — Las ondas */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La cuerda que vibra ---------- */
  FK.sim('onda-cuerda', function (g) {
    const ctx = g.canvas(2.4);
    const N = 160;
    g.choice('mode', { label: 'Tipo de onda', icon: '🌊', options: [['pulso', 'Un pulso', '1️⃣'], ['cont', 'Continua', '♾️']], value: 'cont', onchange: () => { S.on = false; } });
    g.choice('end', { label: 'Extremo derecho', icon: '📌', options: [['fijo', 'Fijo'], ['libre', 'Libre']], value: 'fijo', reset: true });
    g.slider('f', { label: 'Frecuencia', icon: '🎵', min: 0.3, max: 4, step: 0.05, value: 1, unit: 'Hz', fmt: (v) => FK.n(v, 2) });
    g.slider('A', { label: 'Amplitud', icon: '↕️', min: 0.1, max: 0.5, step: 0.05, value: 0.3, fmt: (v) => FK.n(v, 2) });
    g.button('¡Sacudir!', () => { if (g.p.mode === 'pulso') { S.pulse = 0.0001; } else S.on = !S.on; FK.sfx.pop(); }, { icon: '✋' });
    g.out('amax', 'Amplitud máxima de la cuerda', { icon: '📈', hl: true });
    const S = { u: new Float32Array(N), v: new Float32Array(N), on: false, pulse: 0, t: 0, amax: 0, hold: 0 };
    const R = 0.9, DT = 0.9 / N;
    g.run({
      init() { S.u.fill(0); S.v.fill(0); S.on = false; S.pulse = 0; S.t = 0; S.amax = 0; S.hold = 0; g.say('Sacude el extremo izquierdo. ¿A qué frecuencia se forma una onda grande?'); },
      step(dt) {
        const sub = Math.max(1, Math.round(dt * 60 * 3));
        for (let s = 0; s < sub; s++) {
          S.t += DT;
          const un = new Float32Array(N);
          for (let i = 1; i < N - 1; i++) un[i] = 2 * S.u[i] - S.v[i] + R * R * (S.u[i + 1] - 2 * S.u[i] + S.u[i - 1]) - 0.0012 * (S.u[i] - S.v[i]);
          /* fuente en el extremo izquierdo */
          let src = 0;
          if (g.p.mode === 'cont' && S.on) src = g.p.A * Math.sin(M.TAU * g.p.f * S.t);
          if (g.p.mode === 'pulso' && S.pulse > 0) { const tt = S.pulse; src = g.p.A * Math.exp(-Math.pow((tt - 0.12) / 0.05, 2)); S.pulse += DT; if (S.pulse > 0.3) S.pulse = 0; }
          un[0] = src;
          un[N - 1] = g.p.end === 'fijo' ? 0 : un[N - 2];
          S.v = S.u; S.u = un;
        }
        let m = 0; for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(S.u[i])); S.amax = Math.max(S.amax * 0.995, m);
        g.show('amax', FK.n(S.amax / g.p.A, 1) + ' × la de la mano');
        if (g.p.mode === 'cont' && S.on && g.p.end === 'fijo') { if (S.amax > 2.5 * g.p.A) S.hold += dt; else S.hold = 0; if (S.hold > 2 && !g.won()) g.win('¡Resonancia! La cuerda vibra con una amplitud 2,5 veces mayor que tu mano.'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF');
        const x0 = 50, x1 = W - 50, cy = H / 2, sc = H * 0.42;
        D.line(c, x0, cy, x1, cy, 'rgba(43,35,80,.2)', 2, [6, 6]);
        c.beginPath(); for (let i = 0; i < N; i++) { const x = x0 + (i / (N - 1)) * (x1 - x0), y = cy - S.u[i] * sc * 1.6; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.strokeStyle = '#8E5CF6'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
        D.circle(c, x0, cy - S.u[0] * sc * 1.6, 12, '#FFC21A', D.INK, 3);
        if (g.p.end === 'fijo') { D.box(c, x1 - 4, cy - 40, 14, 80, '#8A5A2B', { r: 4 }); } else { D.circle(c, x1, cy - S.u[N - 1] * sc * 1.6, 10, '#12B76A', D.INK, 3); }
        D.char(c, 'eco', W - 70, 56, 70, 'happy');
        D.text(c, S.on || S.pulse > 0 ? '' : 'presiona «¡Sacudir!»', x0 + 10, 30, { size: 16, color: D.INK });
      }
    });
  });

  /* ---------- Transversal y longitudinal ---------- */
  FK.sim('trans-long', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('tipo', { label: 'Tipo de onda', icon: '🌊', options: [['t', 'Transversal (de lado)', '〰️'], ['l', 'Longitudinal (de empujón)', '🌀']], value: 't', reset: true });
    g.slider('lam', { label: 'Longitud de onda', icon: '↔️', min: 120, max: 400, step: 10, value: 240, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.out('t', 'Tiempo visto', { icon: '👀' });
    const N = 42, S = { seen: { t: 0, l: 0 } };
    g.run({
      init() { g.say('Mira la partícula roja. ¿Viaja con la onda o solo se mueve en su lugar?'); },
      step(dt) { S.seen[g.p.tipo] += dt; g.show('t', `de lado: ${FK.n(S.seen.t, 0)} s · de empujón: ${FK.n(S.seen.l, 0)} s`); if (S.seen.t > 4 && S.seen.l > 4 && !g.won()) g.win('¡Muy bien! En los dos tipos, la partícula solo va y viene: lo que viaja es la onda.'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#F3EAFF', '#FFFFFF');
        const x0 = 60, x1 = W - 60, cy = H / 2, dx = (x1 - x0) / (N - 1), k = (M.TAU * (x1 - x0)) / (g.p.lam * 3.2), w = 2.4, amp = 38;
        for (let i = 0; i < N; i++) {
          const xe = x0 + i * dx, ph = k * (i * dx) / (x1 - x0) * 0 + (xe - x0) * (M.TAU / (g.p.lam * 1.6)) - w * g.t;
          let x = xe, y = cy;
          if (g.p.tipo === 't') y = cy + amp * Math.sin(ph); else x = xe + amp * 0.55 * Math.sin(ph);
          const red = i === 14;
          D.circle(c, x, y, red ? 11 : 8, red ? '#FF4757' : '#8E5CF6', D.INK, red ? 3 : 2);
          if (red) { D.line(c, xe, cy - 60, xe, cy + 60, 'rgba(255,71,87,.35)', 2, [4, 6]); }
        }
        D.tag(c, g.p.tipo === 't' ? 'La partícula roja sube y baja' : 'La partícula roja va y viene', W / 2, 36, '#FFE0E3', { size: 16 });
        D.arrow(c, W / 2 - 60, H - 36, W / 2 + 60, H - 36, '#12B76A', 7); D.text(c, 'la onda avanza', W / 2, H - 14, { size: 14, align: 'center' });
      }
    });
  });

  /* ---------- Rizos de interferencia ---------- */
  FK.sim('rizos', function (g) {
    const ctx = g.canvas(2);
    g.slider('d', { label: 'Separación de las gotas', icon: '↔️', min: 40, max: 360, step: 5, value: 120, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.slider('lam', { label: 'Longitud de onda', icon: '〰️', min: 30, max: 90, step: 5, value: 60, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.out('n', 'Líneas de calma', { icon: '😌', hl: true });
    const IW = 200, IH = 100, off = document.createElement('canvas'); off.width = IW; off.height = IH;
    const octx = off.getContext('2d'), img = octx.createImageData(IW, IH);
    g.run({
      init() { g.say('Dos gotas caen en el agua. Las zonas oscuras son de calma.'); },
      step() {
        const n = C.nodalLines(g.p.d, g.p.lam); g.show('n', n);
        if (n >= 4 && !g.won()) g.win('¡' + n + ' líneas de calma! Donde una cresta se une a un valle, el agua queda quieta.');
      },
      draw(c, W, H) {
        const sx = W / IW, s1 = [W / 2 - g.p.d / 2, H / 2], s2 = [W / 2 + g.p.d / 2, H / 2], k = M.TAU / g.p.lam, ph = g.t * 6;
        for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
          const x = (i + 0.5) * sx, y = (j + 0.5) * sx;
          const r1 = Math.hypot(x - s1[0], y - s1[1]) + 6, r2 = Math.hypot(x - s2[0], y - s2[1]) + 6;
          const v = (Math.cos(k * r1 - ph) / Math.sqrt(r1 / 40) + Math.cos(k * r2 - ph) / Math.sqrt(r2 / 40)) / 2;
          const t = M.clamp(v * 0.9, -1, 1), idx = (j * IW + i) * 4;
          img.data[idx] = 40 + 120 * (t > 0 ? t : 0) + 60 * (1 + t) * 0.3; img.data[idx + 1] = 110 + 100 * (1 + t) / 2 + 40 * (t > 0 ? t : 0); img.data[idx + 2] = 200 + 55 * (1 + t) / 2; img.data[idx + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, W, H);
        D.circle(c, s1[0], s1[1], 9, '#FFC21A', D.INK, 3); D.circle(c, s2[0], s2[1], 9, '#FFC21A', D.INK, 3);
        D.emoji(c, '💧', s1[0], s1[1] - 24, 22); D.emoji(c, '💧', s2[0], s2[1] - 24, 22);
      }
    });
  });
})();
