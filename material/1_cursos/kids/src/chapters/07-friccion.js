/* Capítulo 7 — La fricción */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- La rampa de los materiales ---------- */
  const MAT = { hielo: ['Hielo', 0.05, '#BFE9FF', '🧊'], madera: ['Madera', 0.4, '#D9A066', '🪵'], goma: ['Goma', 0.9, '#6C6C8A', '🛞'], lija: ['Lija', 1.3, '#C9B27C', '📄'] };
  FK.sim('rampa-materiales', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('mat', { label: 'Superficie de la rampa', icon: '🧱', options: Object.keys(MAT).map((k) => [k, MAT[k][0], MAT[k][3]]), value: 'madera', onchange: () => reset() });
    g.slider('ang', { label: 'Inclinación', icon: '📐', min: 0, max: 70, step: 1, value: 5, unit: '°', fmt: (v) => FK.n(v, 0) });
    g.out('ang', 'Ángulo', { icon: '📐' }); g.out('mu', 'Fricción (μ)', { icon: '🧲' }); g.out('crit', 'Ángulo crítico', { icon: '🎯', hl: true });
    const L = 5; /* longitud de la rampa en m */
    const s = { s: 0, v: 0, sliding: false, end: 0, started: false };
    const reset = () => { s.s = 0; s.v = 0; s.sliding = false; s.end = 0; s.started = false; };
    g.run({
      init() { reset(); g.say('Sube la rampa de a poquito. ¿A qué ángulo empieza a deslizarse el bloque?'); },
      step(dt) {
        const mu = MAT[g.p.mat][1], th = M.rad(g.p.ang);
        g.show('ang', FK.n(g.p.ang, 0) + '°'); g.show('mu', FK.n(mu, 2)); g.show('crit', s.started ? FK.n(M.deg(C.critAngle(mu)), 0) + '°' : '?');
        if (s.end > 0) { s.end -= dt; if (s.end <= 0) reset(); return; }
        if (!s.sliding) {
          if (Math.tan(th) > mu) {
            s.sliding = true; s.started = true;
            const crit = M.deg(C.critAngle(mu));
            if (g.p.ang - crit <= 3.5) g.win(`¡Empezó a deslizar a ${FK.n(g.p.ang, 0)}°! El ángulo crítico de ${MAT[g.p.mat][0].toLowerCase()} es ${FK.n(crit, 0)}°.`);
            else g.say(`Empezó a deslizar a ${FK.n(g.p.ang, 0)}°: te pasaste. El ángulo justo es ${FK.n(crit, 0)}°. ¡Baja y sube despacio!`, 'think');
          }
        } else {
          const a = g.p.ang > 0 ? 9.8 * (Math.sin(th) - mu * Math.cos(th)) : -1;
          s.v += a * dt;
          if (s.v < 0) { s.v = 0; s.sliding = false; }
          s.s += s.v * dt;
          if (s.s >= L) { s.end = 1.2; }
        }
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#FFF1D9', '#FFFBF2'); D.grid(c, W, H, 40);
        const th = M.rad(g.p.ang), len = 520, bx = 150, by = H - 50;
        const ex = bx + len * Math.cos(th), ey = by - len * Math.sin(th);
        D.poly(c, [[bx, by], [ex, by], [ex, ey]], MAT[g.p.mat][2], D.INK, 3);
        D.line(c, bx - 40, by, ex + 60, by, D.INK, 4);
        c.beginPath(); c.arc(bx + 70, by, 70, -th, 0); c.strokeStyle = '#FF4757'; c.lineWidth = 3; c.stroke();
        D.text(c, FK.n(g.p.ang, 0) + '°', bx + 105, by - 18, { size: 20, weight: 700, color: '#FF4757' });
        /* bloque */
        const t = L > 0 ? s.s / L : 0, px = ex - (ex - bx) * (1 - 0) * (0), pos = [ex - (ex - bx) * t - 0, ey + (by - ey) * t];
        c.save(); c.translate(ex - (ex - bx) * t, ey + (by - ey) * t); c.rotate(-th);
        D.box(c, -50, -46, 50, 46, '#FF8A1F', { r: 8 }); D.emoji(c, '🐱', -25, -23, 28);
        /* flechas: peso e inclinada */
        c.restore();
        const cx = ex - (ex - bx) * t - 25 * Math.cos(th) - 23 * Math.sin(th), cy = ey + (by - ey) * t + 25 * Math.sin(th) - 23 * Math.cos(th);
        D.arrow(c, cx, cy, cx, cy + 90, '#8E5CF6', 7); D.text(c, 'peso', cx + 10, cy + 100, { size: 14, color: '#8E5CF6', weight: 700 });
        const mu = MAT[g.p.mat][1], fr = Math.min(Math.sin(th), mu * Math.cos(th)) * 90;
        if (!s.sliding && g.p.ang > 0) { if (fr > 6) { D.arrow(c, cx, cy, cx + Math.cos(th) * fr, cy - Math.sin(th) * fr, '#1E88FF', 7); D.text(c, 'fricción', cx + Math.cos(th) * fr + 6, cy - Math.sin(th) * fr - 14, { size: 14, color: '#1E88FF', weight: 700 }); } }
        D.tag(c, MAT[g.p.mat][3] + ' ' + MAT[g.p.mat][0], 90, 30, '#fff', { size: 16 });
      }
    });
  });

  /* ---------- ¡Frena antes del cono! ---------- */
  const SURF = { seco: ['Seco', 0.7, '☀️'], mojado: ['Mojado', 0.4, '🌧️'], hielo: ['Hielo', 0.1, '🧊'] };
  FK.sim('frenado', function (g) {
    const ctx = g.canvas(2.6);
    g.slider('kmh', { label: 'Rapidez del carro', icon: '🚗', min: 20, max: 120, step: 5, value: 50, unit: 'km/h', fmt: (v) => FK.n(v, 0) });
    g.choice('sup', { label: 'Estado del piso', icon: '🛣️', options: Object.keys(SURF).map((k) => [k, SURF[k][0], SURF[k][2]]) , value: 'seco' });
    g.button('¡Ver el cono y frenar!', () => go(), { icon: '🛑' });
    g.out('rea', 'Distancia de reacción', { icon: '🧠' }); g.out('fre', 'Distancia de frenado', { icon: '🛞' }); g.out('tot', 'Total', { icon: '📏', hl: true });
    const PX = 9; /* px por metro */
    const s = { x: 0, v: 0, st: 'idle', D: 50, tr: 0, crash: false };
    function go() { if (s.st !== 'idle') return; s.st = 'react'; s.v = g.p.kmh / 3.6; s.tr = 1; s.x = 0; s.crash = false; FK.sfx.whoosh(); }
    g.run({
      init() { s.st = 'idle'; s.x = 0; s.v = 0; s.D = Math.round(M.rnd(28, 62)); s.crash = false; s.said = false; g.say(`El cono está a ${s.D} metros. Elige rapidez y piso. ¡Cuidado con el tiempo de reacción de 1 segundo!`); },
      step(dt) {
        const v0 = g.p.kmh / 3.6, mu = SURF[g.p.sup][1];
        const rea = v0 * 1, fre = C.brakeDist(v0, mu);
        g.show('rea', FK.n(rea, 0) + ' m'); g.show('fre', FK.n(fre, 0) + ' m'); g.show('tot', FK.n(rea + fre, 0) + ' m');
        if (s.st === 'idle') return;
        if (s.st === 'react') { s.x += s.v * dt; s.tr -= dt; if (s.tr <= 0) s.st = 'brake'; }
        else if (s.st === 'brake') { s.v = Math.max(0, s.v - mu * 9.8 * dt); s.x += s.v * dt; if (s.v === 0) s.st = 'stop'; }
        if (s.x >= s.D && s.st !== 'stop' && !s.crash) { s.crash = true; s.st = 'stop'; FK.sfx.boom(); g.say('¡PUM! Chocaste con el cono. Necesitabas más espacio: baja la rapidez o ¡no frenes en piso resbaloso!', 'sad'); }
        if (s.st === 'stop' && !s.crash && !s.said) { s.said = true; const gap = s.D - s.x; if (g.p.kmh >= 40) g.win(`¡Frenaste a ${FK.n(s.D - s.x, 1)} m del cono! Y yendo a ${g.p.kmh} km/h.`); else g.say(`Frenaste a tiempo, pero iba lento (${g.p.kmh} km/h). Sube la rapidez a 40 o más.`, 'think'); }
      },
      draw(c, W, H) {
        D.sky(c, W, H, g.p.sup === 'mojado' ? '#9FB4C8' : '#8FD3FF', g.p.sup === 'mojado' ? '#CDD8E4' : '#E8F8FF');
        if (g.p.sup === 'mojado') for (let i = 0; i < 40; i++) D.line(c, (i * 97) % W, (i * 53 + g.t * 400) % 150, ((i * 97) % W) - 6, ((i * 53 + g.t * 400) % 150) + 16, '#4A8AC8', 2);
        D.ground(c, W, 170, H, '#7ED957', '#B9824A');
        c.fillStyle = g.p.sup === 'hielo' ? '#CFEFFF' : g.p.sup === 'mojado' ? '#5A6A82' : '#5B5B7A'; c.fillRect(0, 195, W, 120);
        D.line(c, 0, 255, W, 255, '#fff', 4, [26, 20]);
        const x0 = 80;
        D.text(c, '🚧', x0 + s.D * PX, 245, { size: 12 }); D.emoji(c, '🚧', x0 + s.D * PX, 250, 46);
        D.tag(c, s.D + ' m', x0 + s.D * PX, 205, '#FFF1B8', { size: 14 });
        for (let m = 0; m <= 70; m += 10) D.line(c, x0 + m * PX, 315, x0 + m * PX, 325, D.INK, 2);
        D.emoji(c, s.crash ? '💥' : '🚗', x0 + s.x * PX, 262, 52, 0, true);
        if (s.st === 'brake') D.text(c, '🛑 frenando', x0 + s.x * PX, 215, { size: 16, align: 'center', color: '#C0182B', weight: 700 });
        if (s.st === 'react') D.text(c, '🧠 reaccionando…', x0 + s.x * PX, 215, { size: 16, align: 'center', color: '#B07F00', weight: 700 });
      }
    });
  });
})();
