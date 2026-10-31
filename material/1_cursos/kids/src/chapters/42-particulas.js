/* Capítulo 42 — Partículas y fuerzas */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Arma partículas con quarks ---------- */
  FK.sim('arma-particulas', function (g) {
    const ctx = g.canvas(2.4);
    const S = { q: [], done: new Set() };
    g.button('+ Quark arriba (+2/3)', () => add('u'), { icon: '🔴' }); g.button('+ Quark abajo (−1/3)', () => add('d'), { icon: '🔵' }); g.button('Vaciar', () => { S.q = []; }, { kind: 'ghost' });
    g.out('c', 'Carga total', { icon: '⚡', hl: true }); g.out('n', 'Partícula', { icon: '⚛️' }); g.out('t', 'Retos', { icon: '🎯' });
    function add(k) { if (S.q.length >= 3) { g.say('Ya tienes tres quarks. Presiona «Vaciar» para empezar otra.', 'think'); return; } S.q.push(k); FK.sfx.pop(); const r = C.hadron(S.q.join('')); if (S.q.length === 3 && r.id) { if (r.id === 'p' || r.id === 'n') { S.done.add(r.id); FK.sfx.ok(); g.say(`¡${r.name}! ${r.msg}`, 'wow'); } else g.say(`${r.name}: ${r.msg}`, 'happy'); } }
    g.run({
      init() { S.q = []; S.done = new Set(); g.say('Agrega tres quarks. ¿Cuáles forman un protón? ¿Y un neutrón?'); },
      step() {
        const q = C.quarkCharge(S.q.join('')); const r = S.q.length === 3 ? C.hadron(S.q.join('')) : null;
        g.show('c', S.q.length ? C.fracStr(q) : '0'); g.show('n', r ? r.name : S.q.length ? '(faltan quarks)' : '—'); g.show('t', (S.done.has('p') ? '✅' : '⬜') + ' protón  ' + (S.done.has('n') ? '✅' : '⬜') + ' neutrón');
        if (S.done.has('p') && S.done.has('n') && !g.won()) g.win('¡Protón y neutrón! uud: +2/3 + 2/3 − 1/3 = +1; udd: +2/3 − 1/3 − 1/3 = 0.');
      },
      draw(c, W, H) {
        D.night(c, W, H, 52, 30);
        const cx = 360, cy = H / 2, R = 60, pos = [[0, -R * 0.9], [R * 0.8, R * 0.6], [-R * 0.8, R * 0.6]];
        const cols = ['#FF4757', '#12B76A', '#1E88FF'];
        if (S.q.length === 3) { D.circle(c, cx, cy, R + 50, 'rgba(255,255,255,.1)', 'rgba(255,255,255,.5)', 3); for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const a = pos[i], b = pos[j]; D.spring(c, cx + a[0], cy + a[1], cx + b[0], cy + b[1], 7, 6, '#FFE066', 3); } }
        S.q.forEach((k, i) => { const p = S.q.length === 3 ? pos[i] : [(i - (S.q.length - 1) / 2) * 110, 0]; const x = cx + p[0] + Math.sin(g.t * 3 + i) * 3, y = cy + p[1]; D.circle(c, x, y, 34, k === 'u' ? '#FF8A9B' : '#7FB2FF', cols[i], 5); D.text(c, k === 'u' ? 'arriba' : 'abajo', x, y - 6, { size: 14, align: 'center', color: D.INK, weight: 700 }); D.text(c, k === 'u' ? '+2/3' : '−1/3', x, y + 12, { size: 14, align: 'center', color: D.INK }); });
        if (!S.q.length) D.text(c, 'Agrega tres quarks…', cx, cy, { size: 22, align: 'center', color: '#B9B3E6' });
        if (S.q.length === 3) D.text(c, 'los resortes amarillos = fuerza fuerte (gluones)', cx, H - 20, { size: 13, align: 'center', color: '#FFE066' });
        D.char(c, 'quarki', 80, 80, 74, 'happy');
      }
    });
  });

  /* ---------- Cuatro fuerzas ---------- */
  FK.sim('cuatro-fuerzas', function (g) {
    FK.kit.match(g, [
      ['🌙 La Luna gira alrededor de la Tierra', 'Gravedad'], ['💡 Se enciende un bombillo y un imán atrae un clip', 'Electromagnética'],
      ['⚛️ Los protones se quedan pegados en el núcleo', 'Fuerte'], ['☀️ El Sol funde hidrógeno y algunos átomos son radiactivos', 'Débil']
    ], { start: 'Toca una situación y luego la fuerza que la explica.' });
  });

  /* ---------- Mini acelerador ---------- */
  FK.sim('acelerador', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('E', { label: 'Energía de los protones', icon: '⚡', min: 1, max: 10, step: 0.1, value: 3, unit: 'TeV', fmt: (v) => FK.n(v, 1) });
    g.slider('B', { label: 'Campo magnético', icon: '🧲', min: 2, max: 10, step: 0.1, value: 4, unit: 'T', fmt: (v) => FK.n(v, 1) });
    g.button('💥 ¡Chocar!', () => collide(), { kind: 'primary' });
    g.out('r', 'Radio de giro del haz', { icon: '⭕' }); g.out('s', 'Estado', { icon: '🛰️', hl: true }); g.out('c', 'Colisiones', { icon: '💥' });
    const RING = 2800, S = { ok: 0, hold: 0, n: 0, shower: null, stable: false, higgs: 0 };
    function collide() { if (!S.stable) { g.say('Primero hace falta un haz estable en el anillo.', 'think'); return; } S.n++; S.shower = { t: 0, p: Array.from({ length: 14 }, () => ({ a: M.rnd(0, M.TAU), v: M.rnd(60, 200), c: M.pick(['#FFE066', '#FF8A9B', '#7FB2FF', '#B8F2D0']) })) }; FK.sfx.boom(); g.show('c', S.n); if (Math.random() < 0.18) { S.higgs++; g.say('¡Wow! Entre los restos apareció una señal compatible con un bosón de Higgs. ¡En la realidad se necesitan billones de choques!', 'wow'); } else g.say('Salieron muchas partículas nuevas. Los detectores las miden y las analizan.', 'happy'); if (S.n >= 3 && !g.won()) g.win('¡Haz estable y colisiones! Así se descubrió el bosón de Higgs en el CERN.'); }
    g.run({
      init() { S.hold = 0; S.n = 0; S.stable = false; S.shower = null; S.higgs = 0; g.show('c', 0); g.say('Los imanes doblan el haz. Si el campo es muy débil, el haz choca con la pared de afuera; si es muy fuerte, con la de adentro.'); },
      step(dt) {
        const r = C.beamRadius(g.p.E * 1000, g.p.B), rel = r / RING; g.show('r', FK.int(r) + ' m (anillo: 2800 m)');
        S.stable = Math.abs(rel - 1) < 0.05; if (S.stable) { S.hold += dt; S.ok = S.hold; g.show('s', '✅ haz estable'); } else { S.hold = 0; g.show('s', rel > 1 ? '❌ se sale por fuera (campo débil)' : '❌ choca por dentro (campo fuerte)'); }
        if (S.shower) { S.shower.t += dt; if (S.shower.t > 1.4) S.shower = null; }
      },
      draw(c, W, H) {
        D.night(c, W, H, 61, 30);
        const cx = 330, cy = H / 2, R = 150, rel = C.beamRadius(g.p.E * 1000, g.p.B) / RING, rpx = M.clamp(R * rel, 20, 330);
        c.beginPath(); c.arc(cx, cy, R + 12, 0, M.TAU); c.arc(cx, cy, R - 12, 0, M.TAU, true); c.fillStyle = 'rgba(160,170,220,.25)'; c.fill(); D.circle(c, cx, cy, R + 12, null, '#8A8AB0', 3); D.circle(c, cx, cy, R - 12, null, '#8A8AB0', 3);
        for (let i = 0; i < 16; i++) { const a = (i / 16) * M.TAU; D.circle(c, cx + R * Math.cos(a), cy + R * Math.sin(a), 6, '#FF4757', '#fff', 1.5); }
        /* haz: círculo de radio rpx que arranca tangente en el punto superior del anillo */
        const sx = cx, sy = cy - R;
        const turns = Math.min(6.2, g.t * 2 + 0.3), stable = Math.abs(rel - 1) < 0.05;
        c.beginPath(); for (let a = 0; a <= turns * 1; a += 0.03) { const x = sx + (stable ? R * Math.sin(a) : 0) + (stable ? 0 : rpx * Math.sin(a)), y = stable ? cy - R * Math.cos(a) : sy + rpx - rpx * Math.cos(a); a ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.strokeStyle = stable ? '#3DE0FF' : '#FFB3BC'; c.lineWidth = stable ? 5 : 3; c.stroke();
        if (stable) { const a = g.t * 3; D.circle(c, cx + R * Math.sin(a), cy - R * Math.cos(a), 7, '#fff', '#3DE0FF', 3); D.circle(c, cx - R * Math.sin(a), cy + R * Math.cos(a), 7, '#fff', '#FFE066', 3); }
        if (S.shower) S.shower.p.forEach((p) => D.line(c, cx, cy - R, cx + Math.cos(p.a) * p.v * S.shower.t, cy - R + Math.sin(p.a) * p.v * S.shower.t, p.c, 3));
        D.text(c, 'detector', cx, cy - R - 24, { size: 12, align: 'center', color: '#fff' });
        D.text(c, 'Higgs «vistos»: ' + S.higgs, W - 24, 28, { size: 15, align: 'right', color: '#FFE066', weight: 700 });
        D.char(c, 'quarki', W - 60, H - 50, 64, stable ? 'wow' : 'think');
      }
    });
  });
})();
