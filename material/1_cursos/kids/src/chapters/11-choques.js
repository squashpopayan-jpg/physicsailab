/* Capítulo 11 — Choques y rebotes */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Billar ---------- */
  FK.sim('billar', function (g) {
    const ctx = g.canvas(3);
    g.slider('mA', { label: 'Masa de la bola azul', icon: '🔵', min: 1, max: 5, step: 1, value: 2, unit: 'kg', fmt: (v) => FK.n(v, 0), reset: true });
    g.slider('vA', { label: 'Rapidez de la azul', icon: '💨', min: 1, max: 6, step: 1, value: 4, unit: 'm/s', fmt: (v) => FK.n(v, 0), reset: true });
    g.slider('mB', { label: 'Masa de la bola roja', icon: '🔴', min: 1, max: 5, step: 1, value: 1, unit: 'kg', fmt: (v) => FK.n(v, 0), reset: true });
    g.choice('tipo', { label: 'Tipo de choque', icon: '💥', options: [['el', 'Rebotan (elástico)'], ['pe', 'Se pegan']], value: 'el', reset: true });
    g.button('¡Lanzar!', () => { if (S.st === 'ready') { S.st = 'go'; FK.sfx.pop(); } }, { icon: '🎱' });
    g.out('a', 'Azul después', { icon: '🔵' }); g.out('b', 'Roja después', { icon: '🔴' }); g.out('p', 'Momento total', { icon: '⚖️' });
    const PX = 70;
    const S = { st: 'ready', xa: 60, xb: 420, hit: false, va: 0, vb: 0 };
    g.run({
      init() { S.st = 'ready'; S.xa = 60; S.xb = 420; S.hit = false; S.va = g.p.vA; S.vb = 0; g.show('a', '—'); g.show('b', '—'); g.show('p', FK.n(g.p.mA * g.p.vA, 0) + ' kg·m/s'); g.say('La bola azul va hacia la roja, que está quieta. ¿Qué pasará después del choque?'); },
      step(dt) {
        if (S.st !== 'go') return;
        S.xa += S.va * PX * dt; S.xb += S.vb * PX * dt;
        const rA = 12 + g.p.mA * 5, rB = 12 + g.p.mB * 5;
        if (!S.hit && S.xb - S.xa <= rA + rB) {
          S.hit = true;
          const r = g.p.tipo === 'el' ? C.collide1D(g.p.mA, g.p.vA, g.p.mB, 0) : C.stick1D(g.p.mA, g.p.vA, g.p.mB, 0);
          S.va = r[0]; S.vb = r[1]; FK.sfx.pop();
          g.show('a', FK.n(S.va, 2) + ' m/s'); g.show('b', FK.n(S.vb, 2) + ' m/s');
          const tot = g.p.mA * S.va + g.p.mB * S.vb; g.show('p', FK.n(tot, 0) + ' kg·m/s (igual)');
          if (g.p.tipo === 'el' && Math.abs(S.va) < 0.05) g.win('¡La azul se detuvo! Con masas iguales, toda la rapidez pasa a la otra bola.');
          else g.say(g.p.tipo === 'el' ? `La azul queda con ${FK.n(S.va, 2)} m/s y la roja sale con ${FK.n(S.vb, 2)} m/s.` : `Se pegaron y salen juntas con ${FK.n(S.va, 2)} m/s.`, 'wow');
        }
        if (S.xa < -40 || S.xb > 900) S.st = 'end';
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#1F8A5B', '#2AA874');
        D.box(c, 6, 6, W - 12, H - 12, 'rgba(0,0,0,0)', { stroke: '#8A5A2B', lw: 10, r: 18 });
        D.line(c, 30, H / 2, W - 30, H / 2, 'rgba(255,255,255,.12)', 2, [8, 10]);
        const rA = 12 + g.p.mA * 5, rB = 12 + g.p.mB * 5;
        D.circle(c, S.xb, H / 2, rB, '#FF4757', D.INK, 3); D.text(c, g.p.mB + ' kg', S.xb, H / 2, { size: 13, align: 'center', color: '#fff' });
        D.circle(c, S.xa, H / 2, rA, '#1E88FF', D.INK, 3); D.text(c, g.p.mA + ' kg', S.xa, H / 2, { size: 13, align: 'center', color: '#fff' });
        if (S.st === 'ready') D.arrow(c, S.xa + rA + 6, H / 2 - 40, S.xa + rA + 6 + g.p.vA * 18, H / 2 - 40, '#FFE066', 7);
      }
    });
  });

  /* ---------- Cuna de Newton ---------- */
  FK.sim('cuna-newton', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('k', { label: 'Bolas que levantas', icon: '⬆️', min: 1, max: 3, step: 1, value: 2, reset: true });
    g.choice('pred', { label: 'Mi predicción: ¿cuántas salen?', icon: '🤔', options: [[1, '1'], [2, '2'], [3, '3']], value: 1 });
    g.button('¡Soltar!', () => { if (S.st === 'ready') { S.st = 'go'; S.t = 0; FK.sfx.pop(); } }, { icon: '🔔' });
    g.out('sal', 'Salen', { icon: '🔔', hl: true });
    const T = 1.6, TH = 0.7, S = { st: 'ready', t: 0, said: false };
    g.run({
      init() { S.st = 'ready'; S.t = 0; S.said = false; g.show('sal', '—'); g.say('Elige cuántas bolas levantas, adivina cuántas saldrán y suelta.'); },
      step(dt) {
        if (S.st !== 'go') return;
        S.t += dt;
        if (!S.said && S.t > T * 0.25 + 0.25) {
          S.said = true; g.show('sal', g.p.k);
          if (g.p.pred === g.p.k) g.win(`¡Acertaste! Salieron ${g.p.k}: el movimiento pasa de bola en bola.`); else g.say(`Salieron ${g.p.k}, igual que las que levantaste. ¡Intenta otra vez!`, 'think');
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const top = 40, L = 220, n = 7, r = 27, x0 = W / 2 - (n - 1) * r;
        D.box(c, x0 - 60, top - 20, (n - 1) * 2 * r + 120, 20, '#8A5A2B', { r: 8 });
        const p = S.st === 'go' ? (S.t % T) / T : 0, amp = S.st === 'go' ? Math.exp(-S.t / 14) * TH : TH;
        let aL = -TH, aR = 0;
        if (S.st === 'go') {
          if (p < 0.25) { aL = -amp * Math.cos(M.TAU * p); aR = 0; }
          else if (p < 0.5) { aL = 0; aR = amp * Math.sin(M.TAU * (p - 0.25)); }
          else if (p < 0.75) { aL = 0; aR = amp * Math.cos(M.TAU * (p - 0.5)); }
          else { aR = 0; aL = -amp * Math.sin(M.TAU * (p - 0.75)); }
        }
        for (let i = 0; i < n; i++) {
          let a = 0; if (i < g.p.k) a = aL; else if (i >= n - g.p.k) a = aR;
          const px = x0 + i * 2 * r, bx = px + L * Math.sin(a), by = top + L * Math.cos(a);
          D.line(c, px, top, bx, by, '#7B7A99', 3);
          D.circle(c, bx, by, r - 1, '#C9D2E8', D.INK, 3); D.circle(c, bx - 8, by - 9, 7, 'rgba(255,255,255,.8)');
        }
        D.text(c, S.st === 'ready' ? 'Levantas ' + g.p.k + (g.p.k === 1 ? ' bola' : ' bolas') : '', W / 2, H - 20, { size: 18, align: 'center', weight: 700 });
      }
    });
  });
})();
