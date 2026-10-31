/* Capítulo 31 — Electromagnetismo */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Electroimán ---------- */
  FK.sim('electroiman', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('N', { label: 'Vueltas de cable', icon: '🌀', min: 0, max: 100, step: 5, value: 20, fmt: (v) => FK.n(v, 0) });
    g.slider('p', { label: 'Pilas', icon: '🔋', min: 1, max: 4, step: 1, value: 1, fmt: (v) => FK.n(v, 0) });
    g.toggle('on', { label: 'Interruptor encendido', value: true });
    g.out('clips', 'Clips levantados', { icon: '📎', hl: true }); g.out('I', 'Corriente', { icon: '🌊' });
    const S = { clips: 0, shown: 0 };
    g.run({
      static: false,
      init() { S.shown = 0; g.say('Enrolla más cable o pon más pilas. ¿Cuántos clips alcanzas a levantar?'); },
      step(dt) {
        const I = C.coilCurrent(g.p.p * 1.5, 1.5 + g.p.N * 0.04), k = g.p.on ? C.clipsLifted(g.p.N, I) : 0;
        S.clips = k; S.shown += (k - S.shown) * Math.min(1, dt * 6);
        g.show('clips', k); g.show('I', FK.n(g.p.on ? I : 0, 2) + ' A');
        if (k >= 8 && !g.won()) g.win('¡8 clips o más! Más vueltas y más corriente dan un electroimán más fuerte.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB'); D.ground(c, W, H - 50, H, '#C9C9D9', '#9A9AB5');
        const cx = 330, top = 24;
        D.box(c, cx - 22, top, 44, 190, '#9AA3BC', { r: 8 });
        const turns = Math.round(g.p.N / 5), on = g.p.on;
        for (let i = 0; i < turns; i++) D.line(c, cx - 34, top + 14 + i * (160 / Math.max(turns, 1)) + 4, cx + 34, top + 24 + i * (160 / Math.max(turns, 1)), '#C9772B', 5);
        if (on) { c.strokeStyle = 'rgba(142,92,246,.5)'; c.lineWidth = 3; for (let k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(cx, top + 215, 40 * k, 18 * k, 0, 0, M.TAU); c.stroke(); } }
        const n = Math.round(S.shown), baseY = H - 50;
        for (let i = 0; i < 12; i++) { const lifted = i < n, x = cx + (i % 3 - 1) * 20, y = lifted ? top + 196 + Math.floor(i / 3) * 16 + Math.sin(g.t * 6 + i) * 1.5 : baseY - 10; D.emoji(c, '📎', x + (lifted ? 0 : (i - 5) * 24), y, 22); }
        /* pilas y cables */
        for (let i = 0; i < g.p.p; i++) D.box(c, 560, 90 + i * 40, 70, 34, '#FF8A1F', { r: 6 }), D.text(c, '1,5 V', 595, 107 + i * 40, { size: 14, align: 'center', color: '#fff', weight: 700 });
        D.line(c, 560, 107, cx + 34, top + 30, on ? '#FFC21A' : 'rgba(0,0,0,.25)', 4);
        D.char(c, 'chispa', 700, 330, 70, n >= 8 ? 'wow' : 'happy');
      }
    });
  });

  /* ---------- Dínamo ---------- */
  FK.sim('dinamo', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('w', { label: 'Vueltas por segundo', icon: '🔄', min: 0, max: 8, step: 0.25, value: 1, unit: 'v/s', fmt: (v) => FK.n(v, 2) });
    g.choice('N', { label: 'Vueltas de la bobina', icon: '🌀', options: [[50, '50'], [100, '100'], [200, '200']], value: 100 });
    g.toggle('inv', { label: 'Girar al revés', value: false });
    g.out('V', 'Voltaje', { icon: '⚡' }); g.out('b', 'Brillo del LED', { icon: '💡', hl: true });
    const S = { ang: 0, hist: [] };
    g.run({
      init() { S.ang = 0; S.hist = []; g.say('Un imán gira dentro de una bobina. Cambia la velocidad de giro y mira el voltaje.'); },
      step(dt) {
        const w = g.p.w * (g.p.inv ? -1 : 1); S.ang += w * M.TAU * dt;
        const emf = C.dynamoEMF(g.p.N, Math.abs(g.p.w), S.ang * (g.p.inv ? -1 : 1) / (g.p.inv ? -1 : 1)) * (g.p.inv ? -1 : 1), rms = C.dynamoRMS(g.p.N, g.p.w);
        S.hist.push(emf); if (S.hist.length > 220) S.hist.shift();
        const br = M.clamp((rms - 1) / 5, 0, 1.3);
        g.show('V', FK.n(Math.abs(emf), 1) + ' V (promedio ' + FK.n(rms, 1) + ' V)'); g.show('b', FK.n(Math.min(br, 1) * 100, 0) + ' %');
        if (br >= 0.5 && !g.won()) g.win('¡El LED brilla! Más giro o más vueltas de bobina generan más voltaje.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFE5F2', '#FFF6FB');
        const cx = 200, cy = 190, rms = C.dynamoRMS(g.p.N, g.p.w), br = M.clamp((rms - 1) / 5, 0, 1.3);
        D.box(c, cx - 110, cy - 95, 40, 190, '#C9772B', { r: 10 }); D.box(c, cx + 70, cy - 95, 40, 190, '#C9772B', { r: 10 }); D.text(c, 'bobina', cx - 90, cy + 118, { size: 13, align: 'center' }); D.text(c, 'bobina', cx + 90, cy + 118, { size: 13, align: 'center' });
        c.save(); c.translate(cx, cy); c.rotate(S.ang); D.rr(c, -60, -18, 60, 36, 8); c.fillStyle = '#FF4757'; c.fill(); D.rr(c, 0, -18, 60, 36, 8); c.fillStyle = '#1E88FF'; c.fill(); D.box(c, -60, -18, 120, 36, 'rgba(0,0,0,0)', { r: 8, lw: 4 }); D.text(c, 'N', -30, 0, { size: 20, align: 'center', color: '#fff', weight: 700 }); D.text(c, 'S', 30, 0, { size: 20, align: 'center', color: '#fff', weight: 700 }); c.restore();
        D.emoji(c, '🕹️', cx, cy + 150, 28);
        /* LED */
        const lx = 470, ly = 120; if (br > 0.05) { const gr = c.createRadialGradient(lx, ly, 4, lx, ly, 100); gr.addColorStop(0, `rgba(255,70,70,${0.8 * Math.min(1, br)})`); gr.addColorStop(1, 'rgba(255,70,70,0)'); c.fillStyle = gr; c.fillRect(lx - 100, ly - 100, 200, 200); }
        D.circle(c, lx, ly, 22, br > 0.05 ? '#FF4757' : '#8A4A4A', D.INK, 4); D.text(c, 'LED', lx, ly + 44, { size: 14, align: 'center', weight: 700 });
        D.line(c, cx + 110, cy - 40, lx - 22, ly, D.INK, 3); D.line(c, cx + 110, cy + 40, lx - 22, ly + 22, D.INK, 3);
        /* gráfica del voltaje */
        const gx = 470, gy = 250, gw = 300, gh = 120; D.box(c, gx, gy, gw, gh, '#fff', { r: 10, lw: 3 }); D.line(c, gx, gy + gh / 2, gx + gw, gy + gh / 2, 'rgba(43,35,80,.3)', 2);
        c.beginPath(); S.hist.forEach((v, i) => { const x = gx + (i / 220) * gw, y = gy + gh / 2 - M.clamp(v / 14, -1, 1) * (gh / 2 - 8); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = '#8E5CF6'; c.lineWidth = 3; c.stroke();
        D.text(c, 'voltaje', gx + 8, gy + 12, { size: 12 });
        D.char(c, 'chispa', 80, 330, 64, 'happy');
      }
    });
  });

  /* ---------- Línea de alta tensión ---------- */
  FK.sim('red-electrica', function (g) {
    const ctx = g.canvas(2.4);
    g.slider('lv', { label: 'Voltaje de la línea (escala log)', icon: '⚡', min: 0, max: 100, step: 1, value: 20, fmt: (v) => FK.int(C.lineVoltage(v)) + ' V' });
    g.out('I', 'Corriente en la línea', { icon: '🌊' }); g.out('pl', 'Energía perdida', { icon: '🔥', hl: true });
    const P = 10e6, RL = 5;
    g.run({
      static: true,
      init() { g.say('Una central envía 10 megavatios por una línea de 5 Ω. ¿Con qué voltaje se pierde menos?'); },
      draw(c, W, H) {
        const V = C.lineVoltage(g.p.lv), I = P / V, loss = Math.min(P, I * I * RL), pct = (loss / P) * 100;
        g.show('I', FK.int(I) + ' A'); g.show('pl', FK.n(pct, pct < 1 ? 2 : 1) + ' % (' + FK.n(loss / 1000, 0) + ' kW)');
        if (pct < 5 && !g.won()) g.win(`¡Solo se pierde el ${FK.n(pct, 1)} %! Con voltaje alto la corriente es baja y los cables casi no se calientan.`);
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF'); D.ground(c, W, H - 50, H, '#7ED957', '#B9824A');
        D.emoji(c, '🏭', 70, H - 90, 80); D.emoji(c, '🏘️', W - 70, H - 90, 80);
        const f = M.clamp(Math.sqrt(pct / 100), 0, 1), col = D.heat(0.15 + f * 0.85);
        for (let i = 0; i < 5; i++) { const x = 160 + i * 120; D.line(c, x, H - 55, x, 140, '#6B4A2B', 8); D.line(c, x - 28, 150, x + 28, 150, '#6B4A2B', 6); }
        c.beginPath(); for (let x = 130; x <= 670; x += 5) { const sag = Math.sin(((x - 160) % 120 + 120) % 120 / 120 * Math.PI) * 18; x === 130 ? c.moveTo(x, 150 + sag * 0) : c.lineTo(x, 150 + 14 * Math.abs(Math.sin(((x - 160) / 120) * Math.PI))); } c.strokeStyle = col; c.lineWidth = 4 + 8 * (1 - 1 / (1 + I / 400)); c.stroke();
        for (let k = 0; k < 8; k++) { const x = 140 + ((k / 8 + g.t * 0.15) % 1) * 520; if (f > 0.15) D.emoji(c, '🔥', x, 140 - 6, 12 + 14 * f); }
        D.tag(c, FK.int(V) + ' V', 360, 60, '#FFF1B8', { size: 18 }); D.bar(c, 220, 82, 280, 22, 1 - pct / 100, pct < 5 ? '#12B76A' : '#FF8A1F', 'llega ' + FK.n(100 - pct, 1) + ' %', { ink: '#fff' });
        D.char(c, 'chispa', 700, 80, 64, pct < 5 ? 'wow' : 'think');
      }
    });
  });
})();
