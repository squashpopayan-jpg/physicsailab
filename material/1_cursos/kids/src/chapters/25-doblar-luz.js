/* Capítulo 25 — Doblar la luz */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Pesca con láser y con lanza ---------- */
  FK.sim('pesca-laser', function (g) {
    const ctx = g.canvas(2);
    g.choice('arma', { label: 'Arma', icon: '🎯', options: [['laser', 'Láser', '🔦'], ['lanza', 'Lanza (recta)', '🔱']], value: 'laser', onchange: () => { S.shot = null; } });
    g.slider('ang', { label: 'Ángulo hacia abajo', icon: '📐', min: 10, max: 80, step: 0.5, value: 40, unit: '°', fmt: (v) => FK.n(v, 1), onchange: () => { S.shot = null; } });
    g.button('¡Disparar!', () => fire(), { icon: '💥' });
    g.out('l', 'Acierto con láser', { icon: '🔦' }); g.out('s', 'Acierto con lanza', { icon: '🔱' });
    const HE = 1.2, X0 = 0.5, PX = 118, SY = 150, N = 1.33;
    const S = { fx: 4, fd: 1, shot: null, ok: { laser: false, lanza: false }, ap: 0, fresh: false };
    const newFish = () => { S.fx = M.rnd(2.6, 5.4); S.fd = M.rnd(0.7, 1.7); S.shot = null; S.ap = C.aimAtFish(HE, S.fx - X0, S.fd, N); };
    function fire() {
      const a = M.rad(g.p.ang), th1 = Math.PI / 2 - a;
      const xs = X0 + HE / Math.tan(a);
      let dxw, dyw;
      if (g.p.arma === 'laser') { const th2 = Math.asin(Math.sin(th1) / N); dxw = Math.sin(th2); dyw = Math.cos(th2); } else { dxw = Math.sin(th1); dyw = Math.cos(th1); }
      /* distancia del pez al rayo dentro del agua */
      const px = S.fx - xs, py = S.fd, t = px * dxw + py * dyw, dist = Math.abs(px * dyw - py * dxw);
      S.shot = { xs, dxw, dyw, hit: dist < 0.2 && t > 0 }; FK.sfx.pop();
      if (S.shot.hit) { S.ok[g.p.arma] = true; FK.sfx.ok(); g.say(g.p.arma === 'laser' ? '¡Diste en el pez con el láser! Apuntaste a donde lo VES y la luz se dobló sola.' : '¡Acertaste con la lanza! Apuntaste más abajo de donde ves al pez.', 'wow'); if (S.ok.laser && S.ok.lanza && !g.won()) g.win('¡Acertaste con las dos armas! El pez está más profundo de lo que parece.'); setTimeout(newFish, 1500); }
      else g.say(g.p.arma === 'laser' ? 'Fallaste. Apunta el láser justo a donde ves al pez fantasma (el que está más arriba).' : 'Fallaste. Para la lanza debes apuntar más abajo: ¡al pez de verdad!', 'think');
      g.show('l', S.ok.laser ? '✅' : '—'); g.show('s', S.ok.lanza ? '✅' : '—');
    }
    g.run({
      static: true,
      init() { newFish(); S.ok = { laser: false, lanza: false }; g.show('l', '—'); g.show('s', '—'); g.say('El pez que ves (fantasma) no está donde realmente está. ¡Cuidado!'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#BFE9FF', '#EAF8FF');
        c.fillStyle = 'rgba(30,136,255,.55)'; c.fillRect(0, SY, W, H - SY); D.line(c, 0, SY, W, SY, 'rgba(255,255,255,.9)', 3);
        D.cloud(c, 500, 40, 0.9);
        const lx = 30 + X0 * PX, ly = SY - HE * PX;
        D.char(c, 'newti', lx - 20, ly + 10, 70, 'happy'); D.emoji(c, g.p.arma === 'laser' ? '🔦' : '🔱', lx + 20, ly, 34);
        /* pez real y aparente */
        const fx = 30 + S.fx * PX, fy = SY + S.fd * PX;
        D.emoji(c, '🐟', fx, fy, 46);
        const apx = 30 + S.fx * PX, a = S.ap; /* ángulo desde la vertical con que lo ves */
        const tx = Math.sin(a), ty = Math.cos(a);
        const t = (S.fx - X0) / tx, yap = HE - t * ty; /* altura (m) sobre el agua del punto donde la línea de visión pasa por x del pez */
        D.emoji(c, '🐟', apx, SY - yap * PX * 1, 46); D.text(c, 'lo que ves', apx + 34, SY - yap * PX, { size: 14, color: '#fff', weight: 700 });
        D.text(c, 'donde está', fx + 32, fy + 6, { size: 14, color: '#fff', weight: 700 });
        D.line(c, lx + 30, ly, apx, SY - yap * PX, 'rgba(255,255,255,.35)', 2, [6, 6]);
        /* disparo y vista previa del ángulo */
        const aa = M.rad(g.p.ang), xs = X0 + HE / Math.tan(aa);
        D.line(c, lx + 30, ly, 30 + xs * PX, SY, g.p.arma === 'laser' ? '#FF3B3B' : '#FFC21A', 4);
        if (S.shot) { const s = S.shot, L = 6; D.line(c, 30 + s.xs * PX, SY, 30 + (s.xs + s.dxw * L) * PX, SY + s.dyw * L * PX, g.p.arma === 'laser' ? '#FF3B3B' : '#FFC21A', 4); if (s.hit) D.text(c, '💥', fx, fy - 30, { size: 40, align: 'center' }); }
        else { const th1 = Math.PI / 2 - aa, th2 = g.p.arma === 'laser' ? Math.asin(Math.sin(th1) / N) : th1; D.line(c, 30 + xs * PX, SY, 30 + (xs + Math.sin(th2) * 6) * PX, SY + Math.cos(th2) * 6 * PX, g.p.arma === 'laser' ? 'rgba(255,59,59,.4)' : 'rgba(255,194,26,.5)', 3, [8, 6]); }
      }
    });
  });

  /* ---------- Lente ---------- */
  FK.sim('lente', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('tipo', { label: 'Tipo de lente', icon: '🔍', options: [['con', 'Convergente (lupa)'], ['div', 'Divergente']], value: 'con' });
    g.slider('f', { label: 'Distancia focal', icon: '🔬', min: 8, max: 30, step: 1, value: 15, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.slider('o', { label: 'Distancia del objeto a la lente', icon: '↔️', min: 5, max: 60, step: 1, value: 40, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.out('im', 'Imagen', { icon: '🖼️', hl: true }); g.out('m', 'Tamaño', { icon: '📏' });
    const SC = 4, AY = 220, HO = 12, X0 = 400;
    g.run({
      static: true,
      init() { g.say('Mueve el objeto (flecha amarilla) y mira cómo cambia la imagen.'); },
      draw(c, W, H) {
        const f = (g.p.tipo === 'con' ? 1 : -1) * g.p.f, o = g.p.o, di = C.lensImage(f, o), m = -di / o;
        g.show('im', di > 0 ? 'real e invertida' : 'virtual y derecha'); g.show('m', FK.n(Math.abs(m), 2) + ' ×' + (Math.abs(m) > 1 ? ' (más grande)' : ' (más pequeña)'));
        if (g.p.tipo === 'con' && o < g.p.f * 0.85 && Math.abs(m) >= 1.5 && !g.won()) g.win(`¡Una lupa! Imagen virtual y derecha, ${FK.n(Math.abs(m), 1)} veces más grande.`);
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        D.line(c, 10, AY, W - 10, AY, 'rgba(43,35,80,.3)', 2, [8, 6]);
        /* lente */
        c.beginPath(); const hh = 140;
        if (f > 0) { c.moveTo(X0, AY - hh); c.quadraticCurveTo(X0 + 26, AY, X0, AY + hh); c.quadraticCurveTo(X0 - 26, AY, X0, AY - hh); } else { c.moveTo(X0 - 16, AY - hh); c.quadraticCurveTo(X0 + 2, AY, X0 - 16, AY + hh); c.lineTo(X0 + 16, AY + hh); c.quadraticCurveTo(X0 - 2, AY, X0 + 16, AY - hh); c.closePath(); }
        c.fillStyle = 'rgba(160,210,255,.6)'; c.fill(); c.strokeStyle = '#1E88FF'; c.lineWidth = 4; c.stroke();
        for (const s of [-1, 1]) { D.circle(c, X0 + s * Math.abs(f) * SC, AY, 5, '#FF4757'); D.text(c, 'F', X0 + s * Math.abs(f) * SC, AY + 18, { size: 14, align: 'center', color: '#FF4757', weight: 700 }); }
        const xo = X0 - o * SC, yt = AY - HO * SC;
        D.arrow(c, xo, AY, xo, yt, '#FFC21A', 8);
        const ray = (x1, y1, x2, y2, col, dash) => D.line(c, x1, y1, x2, y2, col, 3, dash);
        ray(xo, yt, X0, yt, '#12B76A');
        const sg = f > 0 ? 1 : -1, F2 = [X0 + f * SC, AY], P = [X0, yt], dF = [(F2[0] - P[0]) * sg, (F2[1] - P[1]) * sg], LF = Math.hypot(dF[0], dF[1]), uF = [dF[0] / LF, dF[1] / LF];
        ray(P[0], P[1], P[0] + uF[0] * 900, P[1] + uF[1] * 900, '#12B76A');
        const dc = [X0 - xo, AY - yt], Lc = Math.hypot(dc[0], dc[1]), uc = [dc[0] / Lc, dc[1] / Lc];
        ray(xo, yt, X0, AY, '#1E88FF'); ray(X0, AY, X0 + uc[0] * 900, AY + uc[1] * 900, '#1E88FF');
        if (di < 0) { ray(P[0], P[1], P[0] - uF[0] * 500, P[1] - uF[1] * 500, '#12B76A', [6, 6]); ray(X0, AY, X0 - uc[0] * 500, AY - uc[1] * 500, '#1E88FF', [6, 6]); }
        const xi = X0 + di * SC, yi = AY - m * HO * SC;
        if (xi > 0 && xi < W) D.arrow(c, xi, AY, xi, yi, di > 0 ? '#FF3E9D' : 'rgba(255,62,157,.6)', 8);
        D.char(c, 'lumi', 60, 50, 64, 'happy');
      }
    });
  });

  /* ---------- Ojo y gafas ---------- */
  const EYES = { normal: ['Ojo normal', 60], miope: ['Ojo miope', 64], hiper: ['Ojo hipermétrope', 56] };
  FK.sim('ojo-gafas', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('ojo', { label: 'Ojo', icon: '👁️', options: Object.keys(EYES).map((k) => [k, EYES[k][0]]), value: 'miope' });
    g.choice('gl', { label: 'Gafas', icon: '👓', options: [[-4, '−4'], [-2, '−2'], [0, 'Sin gafas'], [2, '+2'], [4, '+4']], value: 0 });
    g.out('f', 'Foco', { icon: '🎯' }); g.out('r', 'Resultado', { icon: '👁️', hl: true });
    const RET = 1000 / 60; /* mm */
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('El ojo ve de lejos. ¿Cae el foco justo en la retina? Prueba las gafas.'); },
      draw(c, W, H) {
        const P = EYES[g.p.ojo][1] + g.p.gl, fmm = 1000 / P, dfocus = fmm - RET, sharp = Math.abs(dfocus) < 0.3;
        g.show('f', FK.n(fmm, 1) + ' mm (retina a ' + FK.n(RET, 1) + ')'); g.show('r', sharp ? '✅ nítido' : dfocus < 0 ? '😵 borroso (foco delante)' : '😵 borroso (foco detrás)');
        if (sharp && g.p.gl !== 0 && !seen.has(g.p.ojo)) { seen.add(g.p.ojo); FK.sfx.ok(); if (seen.has('miope') && seen.has('hiper') && !g.won()) g.win('¡Corregiste los dos ojos! El miope necesita lente divergente y el hipermétrope convergente.'); }
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const lx = 300, S = 16, rx = lx + RET * S, fx = lx + fmm * S, cy = H / 2;
        /* ojo */
        c.beginPath(); c.ellipse((lx + rx) / 2, cy, (rx - lx) / 2 + 30, 110, 0, 0, M.TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 5; c.strokeStyle = D.INK; c.stroke();
        c.beginPath(); c.arc(rx - 6, cy, 100, -1.1, 1.1); c.strokeStyle = '#FF4757'; c.lineWidth = 8; c.stroke(); D.text(c, 'retina', rx + 14, cy - 110, { size: 14, align: 'center', color: '#C0182B', weight: 700 });
        D.box(c, lx - 8, cy - 55, 16, 110, 'rgba(160,210,255,.8)', { r: 8 });
        if (g.p.gl !== 0) { const t = g.p.gl; D.box(c, lx - 80, cy - 90, 14, 180, t > 0 ? 'rgba(160,210,255,.8)' : 'rgba(255,224,150,.8)', { r: 7 }); D.text(c, (t > 0 ? '+' : '−') + Math.abs(t), lx - 73, cy + 112, { size: 14, align: 'center', weight: 700 }); }
        /* rayos paralelos que llegan al cristalino y convergen en fx */
        for (const dy of [-60, -30, 0, 30, 60]) {
          D.line(c, 20, cy + dy, lx, cy + dy, '#FFC21A', 3);
          const k = (fx - lx), ex = rx + 20; const ty = cy + dy * (1 - (ex - lx) / k);
          D.line(c, lx, cy + dy, ex, ty, '#FFC21A', 3);
        }
        D.circle(c, fx, cy, 7, '#FF3E9D', '#fff', 2);
        D.tag(c, sharp ? 'imagen nítida' : 'imagen borrosa', rx, cy + 130, sharp ? '#B8F2D0' : '#FFC7CD', { size: 15 });
        D.char(c, 'lumi', 60, 60, 70, sharp ? 'wow' : 'think');
      }
    });
  });
})();
