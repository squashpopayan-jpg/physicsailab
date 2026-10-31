/* Capítulo 45 — Materiales, cristales y chips */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Estirar materiales ---------- */
  const MAT = { goma: ['Goma elástica', '#FF8A1F', '〰️'], acero: ['Alambre de acero', '#9AA3BC', '🔩'], vidrio: ['Varilla de vidrio', '#BFE9F2', '🥂'], plastilina: ['Plastilina', '#FF3E9D', '🧸'] };
  FK.sim('estirar-materiales', function (g) {
    const ctx = g.canvas(2.4);
    g.choice('m', { label: 'Material', icon: '🧪', options: Object.keys(MAT).map((k) => [k, MAT[k][0], MAT[k][2]]), value: 'goma', reset: true });
    g.slider('f', { label: 'Fuerza del tirón', icon: '💪', min: 0, max: 100, step: 1, value: 40, unit: '%', fmt: (v) => FK.n(v, 0) });
    g.button('✋ Soltar', () => release(), { kind: 'primary' });
    g.out('res', 'Resultado', { icon: '🔬', hl: true }); g.out('v', 'Tipos vistos', { icon: '🏷️' });
    const S = { st: 'pull', anim: 0, res: null, seen: new Set() };
    const MSG = { elastic: 'Volvió a su forma: es elástico a esa fuerza.', plastic: 'Quedó estirado: se deformó de forma permanente (plástico).', break: '¡Se rompió! (frágil o pasó su límite de ruptura).' };
    function release() { const r = C.materialOutcome(g.p.m, g.p.f / 100); S.res = r; S.st = 'release'; S.anim = 0; g.show('res', MSG[r.kind]); FK.sfx[r.kind === 'break' ? 'boom' : 'pop'](); S.seen.add(r.kind); g.show('v', S.seen.size + ' de 3'); g.say(MSG[r.kind], r.kind === 'break' ? 'sad' : 'wow'); if (S.seen.size >= 3 && !g.won()) g.win('¡Elástico, plástico y frágil! Cada material tiene su propio carácter.'); }
    g.run({
      init() { S.st = 'pull'; S.res = null; S.anim = 0; g.show('res', '—'); g.show('v', S.seen.size + ' de 3'); g.say('Escoge un material, ajusta la fuerza del tirón y presiona «Soltar».'); },
      step(dt) { if (S.st === 'release') S.anim = Math.min(1, S.anim + dt * 1.6); },
      draw(c, W, H) {
        D.sky(c, W, H, '#F6E4D0', '#FFF6E5');
        const m = MAT[g.p.m], r = C.materialOutcome(g.p.m, g.p.f / 100), x0 = 150, cy = 170, L0 = 160;
        const len = S.st === 'release' ? (r.kind === 'break' ? L0 : M.lerp(L0 * (1 + r.ext), L0 * (1 + r.perm), M.smooth(S.anim))) : L0 * (1 + r.ext);
        D.box(c, 70, cy - 70, 40, 140, '#8A8AA0', { r: 8 }); D.text(c, 'fijo', 90, cy + 90, { size: 12, align: 'center' });
        if (S.st === 'release' && r.kind === 'break') { const gap = S.anim * 80; D.box(c, x0 - 40, cy - 8, L0 * (1 + r.ext * 0.4) * 0.5 - gap / 2 + 40, 16, m[1], { r: 4 }); D.box(c, x0 + L0 * 0.75 + gap, cy - 8, L0 * 0.4, 16, m[1], { r: 4 }); D.text(c, '💥', x0 + L0 * 0.55 + gap / 2, cy, { size: 40, align: 'center' }); }
        else { D.box(c, x0 - 40, cy - 8 - (g.p.m === 'plastilina' ? 8 : 0), len + 40, 16 + (g.p.m === 'plastilina' ? 16 : 0), m[1], { r: 8 }); D.box(c, x0 - 40 + len + 28, cy - 28, 36, 56, '#FF4757', { r: 8 }); D.text(c, '✋', x0 - 40 + len + 46, cy, { size: 26, align: 'center' }); }
        D.text(c, m[0], 130, 28, { size: 20, weight: 700 }); D.text(c, S.st === 'release' ? 'después de soltar' : 'estirando con ' + g.p.f + ' %', 130, 56, { size: 14, color: D.INK });
        D.bar(c, 150, 270, 420, 24, g.p.f / 100, r.kind === 'break' ? '#FF4757' : '#12B76A', 'tirón', { size: 13, ink: '#fff' });
        D.char(c, 'terra', W - 70, 70, 76, S.res && S.res.kind === 'break' ? 'sad' : 'happy');
      }
    });
  });

  /* ---------- Puertas lógicas ---------- */
  const GATES = { and: ['Y (AND)', (a, b) => a && b], or: ['O (OR)', (a, b) => a || b], xor: ['O exclusiva (XOR)', (a, b) => a !== b], nand: ['NO-Y (NAND)', (a, b) => !(a && b)] };
  FK.sim('puertas-logicas', function (g) {
    const ctx = g.canvas(2.4);
    g.toggle('A', { label: 'Interruptor A', value: false, onchange: () => note() }); g.toggle('B', { label: 'Interruptor B', value: false, onchange: () => note() });
    g.choice('guess', { label: 'Mi respuesta', icon: '🤔', options: Object.keys(GATES).map((k) => [k, GATES[k][0]]), value: 'and' });
    g.button('Esta es la puerta', () => answer(), { icon: '✅' });
    g.out('ok', 'Aciertos', { icon: '⭐', hl: true });
    const S = { gate: 'and', tested: {}, ok: 0 };
    const key = () => (g.p.A ? 1 : 0) + '' + (g.p.B ? 1 : 0);
    function note() { S.tested[key()] = GATES[S.gate][1](g.p.A, g.p.B); FK.sfx.tick(); }
    function answer() { const done = Object.keys(S.tested).length; if (done < 4) { g.say(`Aún no probaste todas las combinaciones (${done} de 4). ¡Prueba todas antes de adivinar!`, 'think'); return; } if (g.p.guess === S.gate) { S.ok++; g.show('ok', S.ok + ' de 4'); FK.sfx.ok(); if (S.ok >= 4) g.win('¡4 puertas descubiertas! Así piensan los chips: combinando puertas lógicas.'); else g.say('¡Correcto! Otra caja, otra puerta.', 'wow'); next(); } else { FK.sfx.no(); g.say('No es esa. Mira bien cuándo se enciende la luz en la tabla.', 'think'); } }
    const next = () => { S.gate = M.pick(Object.keys(GATES)); S.tested = {}; g.setToggle('A', false); g.setToggle('B', false); note(); };
    g.run({
      init() { S.ok = 0; g.show('ok', '0 de 4'); next(); g.say('Dentro de la caja hay una puerta lógica. Prueba los interruptores y mira cuándo se enciende el LED.'); },
      static: true,
      draw(c, W, H) {
        D.sky(c, W, H, '#F6E4D0', '#FFF6E5');
        const out = GATES[S.gate][1](g.p.A, g.p.B);
        D.box(c, 280, 80, 160, 150, '#8A8AA0', { r: 18 }); D.text(c, '?', 360, 155, { size: 80, align: 'center', color: '#fff', weight: 700 });
        D.line(c, 200, 120, 280, 120, g.p.A ? '#FFC21A' : '#8A8AA0', 8); D.line(c, 200, 190, 280, 190, g.p.B ? '#FFC21A' : '#8A8AA0', 8); D.line(c, 440, 155, 520, 155, out ? '#FFC21A' : '#8A8AA0', 8);
        D.circle(c, 180, 120, 18, g.p.A ? '#12B76A' : '#C9C9D9', D.INK, 3); D.text(c, 'A', 180, 120, { size: 18, align: 'center', weight: 700 }); D.circle(c, 180, 190, 18, g.p.B ? '#12B76A' : '#C9C9D9', D.INK, 3); D.text(c, 'B', 180, 190, { size: 18, align: 'center', weight: 700 });
        if (out) { const gr = c.createRadialGradient(560, 155, 5, 560, 155, 70); gr.addColorStop(0, 'rgba(255,240,120,.9)'); gr.addColorStop(1, 'rgba(255,240,120,0)'); c.fillStyle = gr; c.fillRect(480, 85, 160, 140); }
        D.emoji(c, out ? '💡' : '🔅', 560, 155, 60);
        /* tabla de verdad */
        D.box(c, 620, 40, 160, 180, '#fff', { r: 12 }); D.text(c, 'A  B  Luz', 700, 58, { size: 14, align: 'center', weight: 700 });
        ['00', '01', '10', '11'].forEach((k, i) => { const v = S.tested[k]; D.text(c, `${k[0]}  ${k[1]}   ` + (v === undefined ? '?' : v ? '💡' : '○'), 700, 88 + i * 30, { size: 16, align: 'center', color: v === undefined ? '#B9B3E6' : D.INK }); });
        D.char(c, 'terra', 70, H - 60, 76, 'happy');
      }
    });
  });

  /* ---------- Superconductor ---------- */
  FK.sim('superconductor', function (g) {
    const ctx = g.canvas(2.2);
    g.slider('T', { label: 'Temperatura', icon: '🌡️', min: 70, max: 300, step: 1, value: 300, unit: 'K', fmt: (v) => FK.n(v, 0) + ' K (' + FK.n(v - 273.15, 0) + ' °C)' });
    g.out('R', 'Resistencia eléctrica', { icon: '〰️', hl: true }); g.out('est', 'Estado', { icon: '🧲' });
    const TC = 92, S = { y: 0, fly: false };
    g.run({
      init() { S.y = 0; S.fly = false; g.say('Este superconductor deja de ofrecer resistencia a 92 K (−181 °C). Enfríalo con nitrógeno líquido (77 K).'); },
      step(dt) {
        const T = g.p.T, sc = T < TC, R = C.superResistance(T, TC);
        g.show('R', sc ? '0 Ω (¡cero!)' : FK.n(R * 100, 0) + ' % de la normal'); g.show('est', sc ? '🧲 imán levitando (efecto Meissner)' : 'imán apoyado');
        S.y += ((sc ? 1 : 0) - S.y) * Math.min(1, dt * 2.5); if (sc && S.y > 0.8 && !S.fly) { S.fly = true; if (!g.won()) g.win('¡El imán levita! Por debajo de la temperatura crítica, el superconductor expulsa el campo magnético.'); }
      },
      draw(c, W, H) {
        const T = g.p.T, sc = T < TC;
        D.sky(c, W, H, sc ? '#9ED8FF' : '#FFE9C7', sc ? '#E8F6FF' : '#FFF6E5');
        const cx = 250, gy = H - 80;
        D.box(c, cx - 110, gy, 220, 40, '#8A8AA0', { r: 10 }); D.box(c, cx - 90, gy - 22, 180, 24, sc ? '#7FD8FF' : '#2B2350', { r: 8 }); D.text(c, 'superconductor', cx, gy - 10, { size: 13, align: 'center', color: '#fff' });
        if (sc) for (let i = 0; i < 10; i++) D.circle(c, cx - 100 + ((i * 53 + g.t * 20) % 200), gy - 30 - ((g.t * 18 + i * 17) % 30), 6 + (i % 3) * 2, 'rgba(255,255,255,.7)');
        const my = gy - 22 - 20 - S.y * 60; D.box(c, cx - 30, my, 60, 24, '#FF4757', { r: 6 }); D.box(c, cx, my, 30, 24, '#1E88FF', { r: 6, stroke: false }); D.box(c, cx - 30, my, 60, 24, 'rgba(0,0,0,0)', { r: 6, lw: 4 }); D.text(c, 'N', cx - 15, my + 12, { size: 16, align: 'center', color: '#fff', weight: 700 }); D.text(c, 'S', cx + 15, my + 12, { size: 16, align: 'center', color: '#fff', weight: 700 });
        if (S.y > 0.1) { c.strokeStyle = 'rgba(142,92,246,.6)'; c.lineWidth = 2; for (let k = -1; k <= 1; k += 2) { c.beginPath(); c.ellipse(cx, my + 30, 60 + 14 * k * 0, 22, 0, 0, M.TAU); c.stroke(); } }
        /* gráfica R(T) */
        const gx = 470, gyy = 50, gw = 300, gh = 200; D.box(c, gx, gyy, gw, gh, '#fff', { r: 10 });
        const X = (t) => gx + 20 + ((t - 70) / 230) * (gw - 40), Y = (r) => gyy + gh - 20 - r * (gh - 50);
        c.beginPath(); for (let t = 70; t <= 300; t += 2) { const r = C.superResistance(t, TC); t === 70 ? c.moveTo(X(t), Y(r)) : c.lineTo(X(t), Y(r)); } c.strokeStyle = '#8E5CF6'; c.lineWidth = 4; c.stroke();
        D.circle(c, X(T), Y(C.superResistance(T, TC)), 8, '#FF4757', '#fff', 2); D.text(c, 'resistencia', gx + 10, gyy + 12, { size: 12 }); D.text(c, 'temperatura →', gx + gw - 8, gyy + gh - 4, { size: 12, align: 'right' }); D.line(c, X(TC), gyy + 10, X(TC), gyy + gh - 10, '#12B76A', 2, [5, 5]); D.text(c, 'Tc = 92 K', X(TC) + 4, gyy + 28, { size: 12, color: '#0A7A46', weight: 700 });
        D.char(c, 'terra', W - 60, H - 40, 66, sc ? 'wow' : 'happy');
      }
    });
  });
})();
