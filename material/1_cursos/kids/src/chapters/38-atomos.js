/* Capítulo 38 — Los átomos */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  const EL = C.ELEMENTS;

  /* ---------- Construye un átomo ---------- */
  FK.sim('construye-atomo', function (g) {
    const ctx = g.canvas(2.2);
    g.out('el', 'Elemento', { icon: '🧪', hl: true }); g.out('q', 'Carga', { icon: '⚡' }); g.out('A', 'Masa (protones + neutrones)', { icon: '⚖️' }); g.out('t', 'Retos', { icon: '🎯' });
    const S = { p: 1, n: 0, e: 1, done: new Set() };
    const ADD = (k, d) => () => { S[k] = M.clamp(S[k] + d, 0, k === 'e' ? 20 : 20); FK.sfx.tick(); };
    g.button('+ Protón', ADD('p', 1), { icon: '🔴' }); g.button('− Protón', ADD('p', -1), { icon: '🔴', kind: 'ghost' });
    g.button('+ Neutrón', ADD('n', 1), { icon: '⚪', newRow: true }); g.button('− Neutrón', ADD('n', -1), { icon: '⚪', kind: 'ghost' });
    g.button('+ Electrón', ADD('e', 1), { icon: '🔵', newRow: true }); g.button('− Electrón', ADD('e', -1), { icon: '🔵', kind: 'ghost' });
    const TARGETS = ['He', 'C', 'O'];
    g.run({
      static: false,
      init() { S.p = 1; S.n = 0; S.e = 1; S.done = new Set(); g.say('Empieza como hidrógeno (1 protón, 1 electrón). Construye Helio, Carbono y Oxígeno.'); },
      step() {
        const el = EL[S.p], q = S.p - S.e;
        g.show('el', el ? `${el[1]} (${el[0]})` : S.p === 0 ? '(sin protones: ¡no es un átomo!)' : 'más allá del 20'); g.show('q', q === 0 ? 'neutro' : q > 0 ? '+' + q + ' (ion positivo)' : q + ' (ion negativo)'); g.show('A', S.p + S.n + (el ? (C.isStable(S.p, S.n) ? ' · estable' : ' · inestable (radiactivo)') : ''));
        if (el && q === 0 && TARGETS.includes(el[0]) && C.isStable(S.p, S.n) && !S.done.has(el[0])) { S.done.add(el[0]); FK.sfx.ok(); g.say(`¡${el[1]}! ${el[3]}`, 'wow'); }
        g.show('t', [...TARGETS].map((t) => (S.done.has(t) ? '✅' : '⬜') + ' ' + t).join('  '));
        if (S.done.size >= 3 && !g.won()) g.win('¡Helio, carbono y oxígeno! El número de protones decide qué elemento es.');
      },
      draw(c, W, H) {
        D.night(c, W, H, 14, 40);
        const cx = 400, cy = H / 2;
        const shells = C.shellConfig(S.e);
        shells.forEach((n, i) => { const r = 60 + i * 52; c.beginPath(); c.arc(cx, cy, r, 0, M.TAU); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.stroke(); for (let k = 0; k < n; k++) { const a = M.TAU * (k / n) + g.t * (0.9 - i * 0.2) + i; D.circle(c, cx + r * Math.cos(a), cy + r * Math.sin(a), 8, '#3D9BFF', '#fff', 2); } });
        /* núcleo */
        const tot = S.p + S.n; for (let i = 0; i < tot; i++) { const a = i * 2.4, r = 4 + 3.8 * Math.sqrt(i); const isP = i < S.p; D.circle(c, cx + r * Math.cos(a) * 1.0, cy + r * Math.sin(a), 6.5, isP ? '#FF4757' : '#E8E8F0', '#2B2350', 1.5); }
        const el = EL[S.p]; if (el) D.text(c, el[0], cx, cy - 4 + 0, { size: 0, color: '#fff' });
        D.tag(c, el ? `${el[0]} · ${el[1]}` : '?', 120, 40, '#FFF1B8', { size: 18 });
        D.tag(c, `🔴 ${S.p}   ⚪ ${S.n}   🔵 ${S.e}`, W - 140, 40, '#fff', { size: 16 });
        D.char(c, 'quarki', 70, H - 70, 76, 'happy');
      }
    });
  });

  /* ---------- Tabla periódica ---------- */
  FK.sim('tabla-periodica', function (g) {
    const area = g.area('tp');
    const POS = []; /* [fila, columna] */
    for (let z = 1; z <= 18; z++) { const r = z <= 2 ? 0 : z <= 10 ? 1 : 2; let col; if (z === 1) col = 0; else if (z === 2) col = 17; else if (z <= 10) col = z <= 4 ? z - 3 : z + 7; else col = z <= 12 ? z - 11 : z + 1 - 0; POS[z] = [r, z === 1 ? 0 : z === 2 ? 17 : z <= 4 ? z - 3 : z <= 10 ? z + 7 : z <= 12 ? z - 11 : z - 1]; }
    area.innerHTML = '<div class="pt-grid"></div><div class="pt-card"><b>Toca un elemento</b><p>Aquí verás su ficha.</p></div>';
    const grid = area.querySelector('.pt-grid'), card = area.querySelector('.pt-card'); const seen = new Set();
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:3px;margin-bottom:10px';
    for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 18; c2++) { const z = POS.findIndex((p, i) => i && p[0] === r && p[1] === c2); const cell = FK.el('button', 'pt-el'); cell.type = 'button'; if (z > 0) { const e = EL[z]; cell.innerHTML = `<small>${z}</small><b>${e[0]}</b>`; cell.style.background = e[4]; cell.addEventListener('click', () => { seen.add(z); FK.sfx.pop(); card.innerHTML = `<b style="font-size:26px">${e[0]}</b> <b>${e[1]}</b> · número atómico ${z}<p>${e[3]}</p><small>${e[2]} · han visto ${seen.size} de 18</small>`; cell.classList.add('vis'); g.say(`${e[1]}: ${e[3]}`, 'happy'); if (seen.size >= 8 && !g.won()) g.win('¡Ocho elementos! Todo lo que existe está hecho de unos pocos ingredientes.'); }); } else { cell.disabled = true; cell.style.visibility = 'hidden'; } grid.appendChild(cell); }
    g.run({ static: true, init() { g.say('Cada casilla es un elemento. Toca los que quieras.'); } });
  });

  /* ---------- Caja negra de Rutherford ---------- */
  FK.sim('caja-negra', function (g) {
    const ctx = g.canvas(2);
    g.button('Disparar 25 partículas', () => shoot(25), { icon: '⚛️' }); g.button('Disparar 100', () => shoot(100), { icon: '⚛️', kind: 'ghost' });
    g.slider('r', { label: 'Tamaño estimado del núcleo', icon: '⭕', min: 5, max: 60, step: 1, value: 25, unit: 'px', fmt: (v) => FK.n(v, 0) });
    g.button('Comprobar mi estimación', () => check(), { icon: '✅', kind: 'ghost', newRow: true });
    g.out('n', 'Partículas disparadas', { icon: '⚛️' }); g.out('b', 'Rebotaron más de 90°', { icon: '↩️', hl: true });
    const S = { nx: 0, ny: 0, R: 14, pts: [], shots: 0, back: 0, est: null, rev: false, hit: 0 };
    const K = 18;
    function shoot(n) {
      for (let i = 0; i < n; i++) {
        const y = M.rnd(30, 370), b = y - S.ny, th = Math.sign(b || 1) * 2 * Math.atan(K / Math.max(Math.abs(b), 1)), x0 = 0;
        S.shots++; if (Math.abs(b) < S.R && Math.random() < 0.9) { S.back++; }
        /* trayectoria: recta hasta el núcleo, luego desviada */
        const hit = Math.abs(b) < S.R * 1.3; const ang = hit ? M.rnd(2.2, 3.1) * Math.sign(b || 1) : th * 0.6;
        const ex = S.nx + Math.cos(ang) * 340, ey = S.ny + (hit ? 0 : b) + Math.sin(ang) * 340;
        S.pts.push({ y0: y, nx: S.nx, ny: y, ex: M.clamp(ex, 0, 800), ey: M.clamp(ey, 0, 400), ang, hit: hit });
      }
      if (S.pts.length > 400) S.pts = S.pts.slice(-400);
      g.show('n', S.shots); g.show('b', S.back); FK.sfx.pop();
    }
    g.pointer({ down(x, y) { S.est = [x, y]; } });
    function check() {
      if (!S.est) { g.say('Primero haz clic donde creas que está el núcleo.', 'think'); return; }
      const d = Math.hypot(S.est[0] - S.nx, S.est[1] - S.ny), rr = Math.abs(g.p.r - S.R) / S.R; S.rev = true;
      if (d <= 28 && rr <= 0.5) g.win(`¡Muy cerca! Estaba a ${FK.n(d, 0)} px de tu estimación y medía ${S.R} px.`); else g.say(`Error de ${FK.n(d, 0)} px en la posición. Dispara más partículas: donde casi no pasan, está el núcleo.`, 'think');
    }
    g.run({
      init() { S.nx = M.rnd(300, 560); S.ny = M.rnd(130, 270); S.R = Math.round(M.rnd(10, 18)); S.pts = []; S.shots = 0; S.back = 0; S.est = null; S.rev = false; g.show('n', 0); g.show('b', 0); g.say('Hay un núcleo escondido. Dispara partículas desde la izquierda y mira cómo rebotan.'); },
      draw(c, W, H) {
        D.night(c, W, H, 19, 20);
        D.box(c, 20, 20, W - 40, H - 40, 'rgba(255,255,255,.04)', { r: 12, stroke: 'rgba(255,255,255,.25)', lw: 2 });
        S.pts.forEach((p) => { const col = p.hit ? 'rgba(255,71,87,.55)' : 'rgba(255,224,102,.35)'; c.beginPath(); c.moveTo(24, p.y0); c.lineTo(S.nx, p.y0); c.lineTo(p.ex, p.ey); c.strokeStyle = col; c.lineWidth = p.hit ? 1.6 : 1; c.stroke(); });
        D.emoji(c, '☢️', 30, H - 40, 26); D.text(c, 'fuente de partículas alfa →', 56, H - 40, { size: 13, color: '#fff' });
        if (S.rev) { D.circle(c, S.nx, S.ny, S.R, '#FF4757', '#fff', 3); D.text(c, 'núcleo real', S.nx, S.ny - S.R - 10, { size: 13, align: 'center', color: '#fff' }); }
        else D.box(c, S.nx - 70, 40, 140, H - 80, 'rgba(0,0,0,0)', { r: 0, stroke: false });
        if (S.est) { D.circle(c, S.est[0], S.est[1], g.p.r, null, '#12B76A', 3); D.circle(c, S.est[0], S.est[1], 3, '#12B76A'); }
        D.char(c, 'quarki', W - 60, 56, 70, 'happy');
      }
    });
  });
})();
