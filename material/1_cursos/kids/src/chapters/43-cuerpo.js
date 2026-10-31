/* Capítulo 43 — La física del cuerpo y los animales */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Brazo palanca ---------- */
  FK.sim('brazo-palanca', function (g) {
    const ctx = g.canvas(2.3);
    g.slider('m', { label: 'Masa que sostienes', icon: '🏋️', min: 1, max: 8, step: 1, value: 4, unit: 'kg', fmt: (v) => FK.n(v, 0) });
    g.slider('d', { label: 'Distancia del peso al codo', icon: '↔️', min: 10, max: 35, step: 1, value: 30, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.slider('i', { label: 'Dónde se une el bíceps (desde el codo)', icon: '💪', min: 3, max: 8, step: 0.5, value: 4, unit: 'cm', fmt: (v) => FK.n(v, 1) });
    g.out('F', 'Fuerza del bíceps', { icon: '💪', hl: true }); g.out('r', 'Veces el peso levantado', { icon: '✖️' });
    g.run({
      static: true,
      init() { g.say('El antebrazo es una palanca. Mueve el peso y mira cuánta fuerza hace el músculo.'); },
      draw(c, W, H) {
        const F = C.bicepsForce(g.p.m, g.p.d, g.p.i), ratio = F / (g.p.m * 9.8);
        g.show('F', FK.int(F) + ' N (≈ ' + FK.n(F / 9.8, 0) + ' kg-fuerza)'); g.show('r', FK.n(ratio, 1) + ' ×');
        if (g.p.m >= 4 && F < 200 && !g.won()) g.win(`¡Solo ${FK.int(F)} N para sostener ${g.p.m} kg! Acercar el peso al codo reduce muchísimo la fuerza.`);
        D.sky(c, W, H, '#F6E4D0', '#FFF6E5');
        const ex = 150, ey = 200, L = 440, ang = -0.0;
        D.box(c, ex - 70, ey - 130, 22, 130, '#E8B88A', { r: 10 }); /* brazo */
        D.circle(c, ex, ey, 16, '#FFC21A', D.INK, 4); D.text(c, 'codo', ex, ey + 32, { size: 13, align: 'center' });
        D.box(c, ex, ey - 12, L, 24, '#F2C8A0', { r: 12 }); /* antebrazo */
        const hx = ex + (g.p.d / 35) * (L - 30), mx = ex + (g.p.i / 35) * (L - 30);
        D.line(c, mx, ey - 12, mx - 6, ey - 118, '#FF4757', 14); D.text(c, 'bíceps', mx + 16, ey - 100, { size: 14, weight: 700, color: '#C0182B' });
        D.arrow(c, mx, ey - 20, mx, ey - 20 - Math.min(120, F / 12), '#FF4757', 8);
        D.box(c, hx - 18, ey + 12, 36, 28 + g.p.m * 3, '#8E5CF6', { r: 6 }); D.text(c, g.p.m + ' kg', hx, ey + 28 + g.p.m * 1.4, { size: 13, align: 'center', color: '#fff' });
        D.arrow(c, hx, ey + 40, hx, ey + 40 + g.p.m * 9, '#8E5CF6', 6);
        D.line(c, ex, ey + 70, hx, ey + 70, D.INK, 2); D.tag(c, FK.n(g.p.d, 0) + ' cm', (ex + hx) / 2, ey + 88, '#fff', { size: 12 });
        D.char(c, 'terra', W - 70, 70, 80, 'happy');
      }
    });
  });

  /* ---------- Torre que se asoma ---------- */
  FK.sim('torre-asoma', function (g) {
    const ctx = g.canvas(2.1);
    g.slider('o', { label: 'Cuánto asoma el ladrillo nuevo (del largo del ladrillo)', icon: '↔️', min: 0, max: 0.5, step: 0.01, value: 0.2, fmt: (v) => FK.n(v * 100, 0) + ' %' });
    g.button('🧱 Poner ladrillo', () => place(), { kind: 'primary' }); g.button('Quitar el último', () => { S.bricks.pop(); S.fall = false; refresh(); }, { kind: 'ghost' });
    g.out('ov', 'Cuánto asoma la torre', { icon: '📏', hl: true }); g.out('n', 'Ladrillos', { icon: '🧱' });
    const S = { bricks: [], fall: false, fx: 0 };
    const LEN = 1, TABLE = 0; /* borde de la mesa en x = 0; los ladrillos se apilan hacia la derecha */
    function place() {
      if (S.fall) { g.say('La torre se cayó. Quita ladrillos o empieza de nuevo.', 'sad'); return; }
      if (S.bricks.length >= 8) return;
      const x = S.bricks.length ? S.bricks[S.bricks.length - 1] + g.p.o * LEN : -LEN + g.p.o * LEN; /* x = borde izquierdo del ladrillo */
      const test = S.bricks.concat([x]);
      if (!C.stackStable(test, LEN, 0)) { S.fall = true; FK.sfx.boom(); g.say('¡Se cayó! El centro de gravedad de lo que hay arriba quedó fuera del apoyo.', 'sad'); S.bricks = test; } else { S.bricks = test; FK.sfx.pop(); }
      refresh();
    }
    function refresh() {
      const bs = S.bricks, ov = bs.length ? Math.max(...bs.map((x) => x + LEN)) : 0;
      g.show('ov', FK.n(Math.max(0, ov), 2) + ' ladrillos'); g.show('n', bs.length);
      if (!S.fall && ov >= 1.0 && !g.won()) g.win(`¡La torre asoma ${FK.n(ov, 2)} ladrillos fuera de la mesa! Los de arriba asoman más y los de abajo menos.`);
      g.dirty();
    }
    g.run({
      static: true,
      init() { S.bricks = []; S.fall = false; refresh(); g.say('La mesa termina en la línea roja. Pon ladrillos, cada uno un poco más a la derecha que el de abajo.'); },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        const tx = 260, gy = H - 70, bw = 170, bh = 34;
        D.box(c, 20, gy, tx - 20, 30, '#C98A3F', { r: 6 }); D.line(c, tx, gy - 220, tx, H, '#FF4757', 3, [8, 6]); D.text(c, 'borde de la mesa', tx + 8, gy + 50, { size: 13 });
        S.bricks.forEach((x, i) => { const by = gy - (i + 1) * bh; const px = tx + x * bw; const fall = S.fall && i >= 1; D.box(c, px + (fall ? (i * 6) : 0), by + (fall ? i * 4 : 0), bw, bh, ['#FF8A1F', '#FFC21A', '#12B76A', '#1E88FF', '#8E5CF6', '#FF3E9D', '#00B3A4', '#FF4757'][i % 8], { r: 4, lw: 3 }); });
        if (S.bricks.length && !S.fall) { const cx = S.bricks.reduce((s, x) => s + (x + 0.5), 0) / S.bricks.length; D.circle(c, tx + cx * bw, gy - 6, 6, '#2B2350'); D.text(c, 'centro de gravedad de toda la torre', tx + cx * bw, gy - 22, { size: 11, align: 'center' }); }
        D.char(c, 'terra', W - 70, 80, 76, S.fall ? 'sad' : 'happy');
      }
    });
  });

  /* ---------- Superpoderes de los animales ---------- */
  FK.sim('supersentidos', function (g) {
    FK.kit.match(g, [
      ['🦇 Murciélago', 'Ecolocalización (usa ecos de ultrasonido)'], ['🐍 Víbora', 'Ve el calor (infrarrojo)'], ['🐝 Abeja', 'Ve la luz ultravioleta'], ['🐢 Tortuga marina', 'Siente el campo magnético de la Tierra'], ['🦈 Tiburón', 'Detecta campos eléctricos de otros animales'], ['🐘 Elefante', 'Oye sonidos muy graves (infrasonido) del suelo']
    ]);
  });
})();
