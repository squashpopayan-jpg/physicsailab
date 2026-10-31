/* Capítulo 35 — Las estrellas */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Color de las estrellas ---------- */
  FK.sim('color-estrella', function (g) {
    FK.kit.match(g, [
      ['🔥 Una estrella ardiente de 30 000 °C', '🔵 Azul'], ['⚪ Sirio, de unos 10 000 °C', '⚪ Blanca-azulada'], ['☀️ El Sol, de unos 5500 °C', '🟡 Amarilla'], ['❄️ Una estrella fría de 3000 °C', '🔴 Roja']
    ], { start: 'Toca la estrella de la izquierda y luego su color. Piensa en el hierro caliente.' });
  });

  /* ---------- La vida de una estrella ---------- */
  FK.sim('vida-estrella', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('lm', { label: 'Masa (veces la del Sol)', icon: '⚖️', min: 0, max: 100, step: 1, value: 50, fmt: (v) => FK.n(C.starMass(v), C.starMass(v) < 1 ? 2 : 1) + ' M☉' });
    g.out('T', 'Temperatura', { icon: '🌡️' }); g.out('life', 'Cuánto vive', { icon: '⏳' }); g.out('fin', 'Final', { icon: '🏁', hl: true });
    const seen = new Set();
    g.run({
      static: true,
      init() { seen.clear(); g.say('Esta estrella está en su juventud. Cambia su masa y mira cómo será su vida.'); },
      draw(c, W, H) {
        const m = C.starMass(g.p.lm), T = C.starTemp(m), R = C.starRadius(m), life = C.starLife(m), fate = C.starFate(m);
        g.show('T', FK.int(T) + ' K'); g.show('life', life >= 1e12 ? FK.nice(life / 1e12) + ' billones de años' : life >= 1e9 ? FK.n(life / 1e9, 1) + ' mil millones de años' : FK.n(life / 1e6, 0) + ' millones de años'); g.show('fin', fate.name);
        if (!seen.has(fate.id)) { seen.add(fate.id); if (fate.id !== 'wd0') g.say(fate.msg, 'wow'); }
        const key = new Set([...seen].map((x) => (x === 'wd0' ? 'wd' : x))); if (key.has('wd') && key.has('ns') && key.has('bh') && !g.won()) g.win('¡Tres finales distintos! Enana blanca, estrella de neutrones y agujero negro: todo depende de la masa.');
        D.night(c, W, H, 17, 70);
        const col = C.starColor(T), rr = Math.min(105, 16 + 24 * Math.pow(R, 0.45));
        const gr = c.createRadialGradient(240, 170, 5, 240, 170, rr * 2.6); gr.addColorStop(0, col + 'cc'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 520, H);
        D.circle(c, 240, 170, rr, col, '#fff', 3); D.text(c, 'tu estrella hoy', 240, 330, { size: 14, align: 'center', color: '#fff' });
        D.text(c, 'Comparada con el Sol: ' + FK.n(R, 1) + ' × de ancho', 240, 28, { size: 14, align: 'center', color: '#FFE066' });
        /* línea de vida */
        const stages = fate.stages, x0 = 530, y0 = 60; D.text(c, 'Su vida (amarillo = ahora):', x0, y0 - 24, { size: 16, color: '#fff', weight: 700 });
        stages.forEach((s, i) => { D.box(c, x0, y0 + i * 52, 250, 42, i === 1 ? '#FFC21A' : 'rgba(255,255,255,.12)', { r: 12, stroke: '#fff', lw: 2 }); D.text(c, s, x0 + 125, y0 + i * 52 + 21, { size: 14, align: 'center', color: i === 1 ? '#2B2350' : '#fff', weight: 600 }); if (i < stages.length - 1) D.text(c, '↓', x0 + 125, y0 + i * 52 + 47, { size: 12, align: 'center', color: '#fff' }); });
        D.char(c, 'cosmo', 70, 70, 76, 'happy');
      }
    });
  });

  /* ---------- Constelaciones ---------- */
  const CON = {
    cruz: { n: 'La Cruz del Sur', st: [['Gacrux', 0.5, 0.14], ['Acrux', 0.55, 0.86], ['Mimosa', 0.28, 0.46], ['Delta Crucis', 0.74, 0.52]], seg: [[0, 1], [2, 3]], hist: 'Sirve para encontrar el sur: se prolonga cuatro veces y media el brazo largo y ahí está el polo sur celeste. Es una de las constelaciones más famosas del hemisferio sur.' },
    orion: { n: 'Orión, el cazador', st: [['Betelgeuse', 0.28, 0.14], ['Bellatrix', 0.72, 0.16], ['Alnitak', 0.44, 0.5], ['Alnilam', 0.5, 0.49], ['Mintaka', 0.56, 0.48], ['Saiph', 0.3, 0.86], ['Rigel', 0.74, 0.84]], seg: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1], [5, 6]], hist: 'Las tres estrellas del centro son «las Tres Marías» en muchos países de América. Betelgeuse es una gigante roja gigantesca y Rigel una azul muy caliente.' },
    osa: { n: 'La Osa Mayor (el Carro)', st: [['Dubhe', 0.74, 0.3], ['Merak', 0.76, 0.54], ['Phecda', 0.54, 0.6], ['Megrez', 0.5, 0.42], ['Alioth', 0.36, 0.4], ['Mizar', 0.24, 0.36], ['Alkaid', 0.1, 0.46]], seg: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]], hist: 'Sus dos estrellas del borde (Dubhe y Merak) «apuntan» a la Estrella Polar. Los pueblos de muchas culturas la vieron como un carro, un cucharón o un oso.' }
  };
  FK.sim('constelaciones', function (g) {
    const ctx = g.canvas(2);
    g.choice('c', { label: 'Constelación', icon: '✨', options: Object.keys(CON).map((k) => [k, CON[k].n.split(',')[0].split(' (')[0]]), value: 'cruz', onchange: () => { S.next = 0; S.done = false; hint(); } });
    g.out('p', 'Estrellas conectadas', { icon: '⭐', hl: true }); g.out('d', 'Terminadas', { icon: '✅' });
    const S = { next: 0, done: false, fin: new Set(), bg: Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random()]) };
    const pos = (s) => [60 + s[1] * 680, 30 + s[2] * 340];
    const hint = () => { const k = CON[g.p.c]; g.say(`${k.n}: toca las estrellas en orden, empezando por la número 1 (${k.st[0][0]}).`); g.show('p', S.next + ' de ' + k.st.length); };
    g.pointer({
      down(x, y) {
        const k = CON[g.p.c]; if (S.done) return;
        const [px, py] = pos(k.st[S.next]); if (Math.hypot(x - px, y - py) < 30) { S.next++; FK.sfx.pop(); g.show('p', S.next + ' de ' + k.st.length);
          if (S.next >= k.st.length) { S.done = true; S.fin.add(g.p.c); FK.sfx.ok(); g.say(`¡${k.n}! ${k.hist}`, 'wow'); g.show('d', S.fin.size + ' de 3'); if (S.fin.size >= 3 && !g.won()) g.win('¡Tres constelaciones! Los pueblos del mundo las usaron como mapa del cielo.'); } }
        else if (Math.hypot(x - px, y - py) < 90) g.say(`Esa no es la que sigue. Busca la número ${S.next + 1}: ${k.st[S.next][0]}.`, 'think');
      }
    });
    g.run({
      static: true,
      init() { S.next = 0; S.done = false; g.show('d', S.fin.size + ' de 3'); hint(); },
      draw(c, W, H) {
        D.night(c, W, H, 33, 10); S.bg.forEach((b) => D.circle(c, b[0] * W, b[1] * H, 0.8 + b[2] * 1.4, `rgba(255,255,255,${0.3 + b[2] * 0.6})`));
        const k = CON[g.p.c];
        k.seg.forEach(([a, b]) => { if (a < S.next && b < S.next) { const p = pos(k.st[a]), q = pos(k.st[b]); D.line(c, p[0], p[1], q[0], q[1], '#FFE066', 3); } });
        k.st.forEach((s, i) => { const [x, y] = pos(s); const done = i < S.next, cur = i === S.next && !S.done; if (cur) D.circle(c, x, y, 24 + Math.sin(g.t * 6) * 3, 'rgba(255,224,102,.25)'); D.circle(c, x, y, done ? 9 : 7, done ? '#FFE066' : '#fff', cur ? '#FFC21A' : null, 3); D.text(c, String(i + 1), x + 14, y - 12, { size: 14, color: done ? '#FFE066' : '#B9B3E6', weight: 700 }); if (done) D.text(c, s[0], x, y + 24, { size: 12, align: 'center', color: '#FFE9A8' }); });
        if (S.done) D.text(c, k.n, W / 2, 30, { size: 24, align: 'center', color: '#FFE066', weight: 700 });
        D.char(c, 'cosmo', W - 60, H - 56, 72, S.done ? 'wow' : 'happy');
      }
    });
  });
})();
