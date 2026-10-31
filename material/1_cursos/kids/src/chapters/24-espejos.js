/* Capítulo 24 — Espejos */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- El laberinto del láser ---------- */
  const LEVELS = [
    { src: [60, 330], dir: 0, target: [700, 90], mirrors: [{ x: 520, y: 330, a: 90 }], walls: [] },
    { src: [60, 60], dir: 0, target: [80, 340], mirrors: [{ x: 600, y: 60, a: 0 }, { x: 300, y: 330, a: 0 }], walls: [] },
    { src: [60, 340], dir: -5, target: [740, 340], mirrors: [{ x: 200, y: 340, a: 90 }, { x: 200, y: 70, a: 0 }, { x: 600, y: 70, a: 0 }, { x: 600, y: 340, a: 90 }], walls: [[395, 130, 410, 400]] }
  ];
  const ML = 90;
  FK.laserLevels = LEVELS;
  /* Traza el rayo láser de un nivel L con los espejos mir [{x,y,a}] */
  FK.laserTrace = function (L, mir) {
    let p = [L.src[0], L.src[1]], d = [Math.cos(M.rad(L.dir)), Math.sin(M.rad(L.dir))];
    const path = [[p[0], p[1]]]; let hit = false;
    for (let k = 0; k < 14; k++) {
      let best = 1e9, kind = null, nrm = null;
      const segs = [];
      mir.forEach((m, i) => { const a = M.rad(m.a), dx = Math.cos(a) * ML / 2, dy = Math.sin(a) * ML / 2; segs.push([m.x - dx, m.y - dy, m.x + dx, m.y + dy, 'm', i]); });
      L.walls.forEach((w) => { const [x0, y0, x1, y1] = w; segs.push([x0, y0, x1, y0, 'w'], [x1, y0, x1, y1, 'w'], [x1, y1, x0, y1, 'w'], [x0, y1, x0, y0, 'w']); });
      segs.push([0, 0, 800, 0, 'w'], [800, 0, 800, 400, 'w'], [800, 400, 0, 400, 'w'], [0, 400, 0, 0, 'w']);
      for (const s of segs) { const t = C.raySegment(p, d, s); if (t !== null && t > 1e-3 && t < best) { best = t; kind = s[4]; nrm = s; } }
      const tc = C.rayCircle(p, d, L.target, 24); if (tc !== null && tc > 1e-3 && tc < best) { path.push([p[0] + d[0] * tc, p[1] + d[1] * tc]); hit = true; break; }
      const q = [p[0] + d[0] * best, p[1] + d[1] * best]; path.push(q);
      if (kind !== 'm') break;
      const sx = nrm[2] - nrm[0], sy = nrm[3] - nrm[1], len = Math.hypot(sx, sy), n = [-sy / len, sx / len];
      d = C.reflect(d, n); p = q;
    }
    return { path, hit };
  };
  FK.sim('laser-espejos', function (g) {
    const ctx = g.canvas(2);
    g.choice('lv', { label: 'Nivel', icon: '🎮', options: [[0, '1'], [1, '2'], [2, '3']], value: 0, onchange: () => load() });
    g.out('st', 'Estado', { icon: '🎯', hl: true });
    const S = { L: LEVELS[0], mir: [], path: [], hit: false, drag: -1, done: [false, false, false] };
    function load() { const L = LEVELS[g.p.lv]; S.L = L; S.mir = L.mirrors.map((m) => ({ x: m.x, y: m.y, a: m.a })); S.hit = false; trace(); g.say(['Nivel 1: un espejo. Gíralo para que el rayo llegue a la diana.', 'Nivel 2: dos espejos. El rayo debe volver a la diana de abajo.', 'Nivel 3: ¡un muro! Usa los cuatro espejos para rodearlo.'][g.p.lv]); }
    function trace() {
      const r = FK.laserTrace(S.L, S.mir); S.path = r.path; S.hit = r.hit;
      g.show('st', S.hit ? '✅ ¡Dio en la diana!' : '❌ Sigue girando espejos');
      if (S.hit && !S.done[g.p.lv]) { S.done[g.p.lv] = true; FK.sfx.ok(); if (S.done.every(Boolean)) g.win('¡Los tres niveles! El ángulo de llegada siempre es igual al de salida.'); else g.say('¡Nivel superado! Pasa al siguiente con los botones de arriba.', 'wow'); }
    }
    g.pointer({
      down(x, y) { S.drag = -1; S.mir.forEach((m, i) => { if (Math.hypot(x - m.x, y - m.y) < ML / 2 + 14) S.drag = i; }); },
      move(x, y, e, down) { if (down && S.drag >= 0) { const m = S.mir[S.drag]; let a = M.deg(Math.atan2(y - m.y, x - m.x)); a = Math.round(a / 5) * 5; m.a = a; trace(); } },
      up() { S.drag = -1; }
    });
    g.run({
      static: true,
      init() { load(); },
      draw(c, W, H) {
        D.night(c, W, H, 9, 40); D.grid(c, W, H, 50, 'rgba(255,255,255,.06)');
        S.L.walls.forEach((w) => D.box(c, w[0], w[1], w[2] - w[0], w[3] - w[1], '#5A5A8A', { r: 4, stroke: '#fff', lw: 2 }));
        c.beginPath(); S.path.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = 'rgba(255,60,60,.35)'; c.lineWidth = 12; c.lineJoin = 'round'; c.stroke(); c.strokeStyle = '#FF3B3B'; c.lineWidth = 4; c.stroke();
        S.mir.forEach((m, i) => { const a = M.rad(m.a), dx = Math.cos(a) * ML / 2, dy = Math.sin(a) * ML / 2; D.line(c, m.x - dx, m.y - dy, m.x + dx, m.y + dy, '#BFE9FF', 10); D.line(c, m.x - dx, m.y - dy, m.x + dx, m.y + dy, '#fff', 3); D.circle(c, m.x + dx, m.y + dy, 8, '#FFC21A', D.INK, 2); });
        D.emoji(c, '🎯', S.L.target[0], S.L.target[1], 50); D.emoji(c, '🔦', S.L.src[0] - 12, S.L.src[1], 40);
        if (S.hit) D.text(c, '✅', S.L.target[0] + 34, S.L.target[1] - 30, { size: 30 });
        D.char(c, 'lumi', W - 50, 40, 60, S.hit ? 'wow' : 'happy');
      }
    });
  });

  /* ---------- Espejo curvo ---------- */
  FK.sim('espejo-curvo', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('tipo', { label: 'Tipo de espejo', icon: '🪞', options: [['con', 'Cóncavo'], ['cvx', 'Convexo']], value: 'con' });
    g.slider('f', { label: 'Distancia focal', icon: '🔬', min: 10, max: 40, step: 1, value: 20, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.slider('o', { label: 'Distancia del objeto al espejo', icon: '↔️', min: 8, max: 120, step: 1, value: 60, unit: 'cm', fmt: (v) => FK.n(v, 0) });
    g.out('im', 'Imagen', { icon: '🖼️', hl: true }); g.out('m', 'Tamaño', { icon: '📏' }); g.out('di', 'Distancia de la imagen', { icon: '📍' });
    const SC = 3.6, VX = 600, AY = 230, HO = 14;
    g.run({
      static: true,
      init() { g.say('La flecha amarilla es el objeto. Mira cómo se forma la imagen con tres rayos.'); },
      draw(c, W, H) {
        const f = (g.p.tipo === 'con' ? 1 : -1) * g.p.f, o = g.p.o, di = C.mirrorImage(f, o), m = -di / o;
        g.show('im', (di > 0 ? 'real e invertida' : 'virtual y derecha')); g.show('m', FK.n(Math.abs(m), 2) + ' ×' + (Math.abs(m) > 1 ? ' (más grande)' : ' (más pequeña)')); g.show('di', FK.n(Math.abs(di), 1) + ' cm ' + (di > 0 ? 'delante' : 'detrás'));
        if (g.p.tipo === 'con' && o < g.p.f * 0.9 && !g.won()) g.win('¡Dentro del foco! La imagen es virtual, derecha y más grande: así funciona un espejo de maquillaje.');
        D.sky(c, W, H, '#FFF6E5', '#FFE9C7');
        D.line(c, 20, AY, W - 10, AY, 'rgba(43,35,80,.3)', 2, [8, 6]);
        /* espejo */
        const R = 2 * Math.abs(f) * SC, sgn = f > 0 ? 1 : -1, am = Math.asin(Math.min(1, 125 / R));
        c.beginPath();
        for (let a = -am; a <= am + 1e-6; a += am / 20) { const px = VX - sgn * R * (1 - Math.cos(a)), py = AY + R * Math.sin(a); a === -am ? c.moveTo(px, py) : c.lineTo(px, py); }
        c.strokeStyle = '#8E5CF6'; c.lineWidth = 8; c.lineCap = 'round'; c.stroke();
        const F = VX - f * SC; D.circle(c, F, AY, 5, '#FF4757'); D.text(c, 'F', F, AY + 18, { size: 14, align: 'center', color: '#FF4757', weight: 700 });
        /* objeto */
        const xo = VX - o * SC, yt = AY - HO * SC;
        D.arrow(c, xo, AY, xo, yt, '#FFC21A', 8);
        /* rayos: 1) paralelo → pasa por F; 2) al vértice */
        const ray = (x1, y1, x2, y2, col, dash) => D.line(c, x1, y1, x2, y2, col, 3, dash);
        ray(xo, yt, VX, yt, '#12B76A');
        const P = [VX, yt], dF = [(F - VX) * sgn, (AY - yt) * sgn], LF = Math.hypot(dF[0], dF[1]), uF = [dF[0] / LF, dF[1] / LF];
        ray(P[0], P[1], P[0] + uF[0] * 900, P[1] + uF[1] * 900, '#12B76A');
        const r = [-(VX - xo), AY - yt], Lr = Math.hypot(r[0], r[1]), ur = [r[0] / Lr, r[1] / Lr];
        ray(xo, yt, VX, AY, '#1E88FF'); ray(VX, AY, VX + ur[0] * 900, AY + ur[1] * 900, '#1E88FF');
        if (di < 0) { ray(P[0], P[1], P[0] - uF[0] * 500, P[1] - uF[1] * 500, '#12B76A', [6, 6]); ray(VX, AY, VX - ur[0] * 500, AY - ur[1] * 500, '#1E88FF', [6, 6]); }
        /* imagen */
        const xi = VX - di * SC, yi = AY - m * HO * SC;
        D.arrow(c, xi, AY, xi, yi, di > 0 ? '#FF3E9D' : 'rgba(255,62,157,.6)', 8);
        if (di < 0) D.tag(c, 'imagen virtual', xi, Math.min(yi, AY) - 20, '#FFD6E3', { size: 13 }); else D.tag(c, 'imagen real', xi, Math.min(yi, AY) - 20, '#FFD6E3', { size: 13 });
        D.char(c, 'lumi', 60, 50, 64, 'happy');
      }
    });
  });
})();
