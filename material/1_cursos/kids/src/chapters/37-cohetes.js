/* Capítulo 37 — Cohetes y exploración espacial */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Etapas del cohete ---------- */
  const MISSIONS = { orbita: ['Órbita de la Tierra', 9.4, '🛰️'], luna: ['Ir a la Luna y alunizar', 15.4, '🌙'] };
  FK.sim('etapas-cohete', function (g) {
    const ctx = g.canvas(2.1);
    g.choice('mis', { label: 'Misión', icon: '🎯', options: Object.keys(MISSIONS).map((k) => [k, MISSIONS[k][0], MISSIONS[k][2]]), value: 'orbita', onchange: () => g.restart() });
    g.slider('n', { label: 'Etapas', icon: '🧱', min: 1, max: 3, step: 1, value: 1, fmt: (v) => FK.n(v, 0), reset: true });
    g.choice('fuel', { label: 'Combustible', icon: '⛽', options: [[3.0, 'Queroseno (3,0 km/s)'], [4.4, 'Hidrógeno (4,4 km/s)']], value: 3.0, reset: true });
    g.button('🚀 ¡Lanzar!', () => launch(), { kind: 'primary' });
    g.out('dv', 'Rapidez que gana', { icon: '💨', hl: true }); g.out('need', 'Rapidez necesaria', { icon: '🎯' });
    const S = { st: 'ready', t: 0, ok: { orbita: false, luna: false }, dv: 0 };
    const dvOf = () => C.stagingDV(g.p.n, 0.1, 0.01, g.p.fuel);
    function launch() { if (S.st !== 'ready') return; S.st = 'fly'; S.t = 0; S.dv = dvOf(); FK.sfx.boom(); }
    g.run({
      init() { S.st = 'ready'; S.t = 0; g.say('Cada etapa gasta su combustible y se suelta. ¿Alcanzará la rapidez para tu misión?'); },
      step(dt) {
        const dv = dvOf(), need = MISSIONS[g.p.mis][1]; g.show('dv', FK.n(dv, 1) + ' km/s'); g.show('need', FK.n(need, 1) + ' km/s');
        if (S.st === 'fly') { S.t += dt; if (S.t > 4) { S.st = dv >= need ? 'ok' : 'fail'; if (dv >= need) { S.ok[g.p.mis] = true; FK.sfx.ok(); g.say(`¡Misión cumplida! ${FK.n(dv, 1)} km/s alcanzan para ${MISSIONS[g.p.mis][0].toLowerCase()}.`, 'wow'); if (S.ok.orbita && S.ok.luna && !g.won()) g.win('¡Órbita y Luna! Más etapas y mejor combustible dan la rapidez necesaria.'); } else { FK.sfx.no(); g.say(`Solo ganó ${FK.n(dv, 1)} km/s y la misión necesita ${FK.n(need, 1)}. Añade etapas o usa hidrógeno.`, 'sad'); } } }
      },
      draw(c, W, H) {
        D.sky(c, W, H, S.st === 'fly' && S.t > 2 ? '#14123F' : '#7FC7FF', S.st === 'fly' && S.t > 2 ? '#3A2E8C' : '#E8F8FF');
        if (S.st === 'fly' && S.t > 1.5) for (let i = 0; i < 40; i++) D.circle(c, (i * 197) % W, (i * 71) % H, 1.5, 'rgba(255,255,255,.8)');
        D.ground(c, W, H - 40, H, '#7ED957', '#B9824A');
        const n = g.p.n, rx = 200, base = H - 60 - (S.st === 'fly' || S.st === 'ok' || S.st === 'fail' ? Math.min(S.t, 3) * 90 : 0);
        const cols = ['#FF4757', '#FFC21A', '#12B76A'];
        const dropped = S.st === 'fly' ? Math.floor(S.t / (4 / n)) : S.st === 'ok' || S.st === 'fail' ? n - 1 : 0;
        /* dibujo simple: pila de etapas de abajo hacia arriba */
        let yy = base; for (let i = 0; i < n; i++) { const hh = 80 - i * 18, w = 44 - i * 8, drop = i < dropped ? Math.min(220, (S.t - (i + 1) * (4 / n)) * 90 + 10) : 0, off = i < dropped ? (i % 2 ? 40 : -40) * (drop / 100) : 0; if (drop < 220) D.box(c, rx - w / 2 + off, yy - hh + drop, w, hh, cols[i], { r: 8 }); yy -= hh; }
        D.poly(c, [[rx - 14, yy], [rx + 14, yy], [rx, yy - 28]], '#fff', D.INK, 3); const top = dropped >= n ? 0 : 1;
        if (S.st === 'fly') D.emoji(c, '🔥', rx, base + 16, 38);
        D.text(c, MISSIONS[g.p.mis][2] + ' ' + MISSIONS[g.p.mis][0], 440, 60, { size: 22, weight: 700 });
        D.bar(c, 360, 100, 360, 26, M.clamp(dvOfSafe() / MISSIONS[g.p.mis][1], 0, 1.3) / 1.3, dvOfSafe() >= MISSIONS[g.p.mis][1] ? '#12B76A' : '#FF8A1F', FK.n(dvOfSafe(), 1) + ' de ' + FK.n(MISSIONS[g.p.mis][1], 1) + ' km/s', { ink: '#fff' });
        D.text(c, S.st === 'ok' ? '✅ ¡Misión cumplida!' : S.st === 'fail' ? '❌ No alcanzó' : S.st === 'fly' ? 'despegando…' : 'listo para despegar', 540, 160, { size: 20, align: 'center', weight: 700 });
        D.char(c, 'cosmo', 700, 330, 70, S.st === 'ok' ? 'wow' : 'happy');
        function dvOfSafe() { return C.stagingDV(g.p.n, 0.1, 0.01, g.p.fuel); }
      }
    });
  });

  /* ---------- Alunizaje ---------- */
  FK.sim('alunizaje', function (g) {
    const ctx = g.canvas(1.8);
    g.choice('w', { label: 'Mundo', icon: '🪐', options: [['luna', 'Luna', '🌙'], ['marte', 'Marte', '🔴']], value: 'luna', reset: true });
    g.out('h', 'Altura', { icon: '📏' }); g.out('v', 'Rapidez de caída', { icon: '⬇️', hl: true }); g.out('f', 'Combustible', { icon: '⛽' });
    const G = { luna: [1.62, 6.5], marte: [3.71, 10.5] };
    const S = { y: 0, vy: 0, fuel: 100, thrust: false, st: 'fly', h0: 250 };
    const down = () => { S.thrust = true; }, up = () => { S.thrust = false; };
    g.pointer({ down, up });
    const kd = (e) => { if (e.code === 'Space' && g._vis) { S.thrust = true; e.preventDefault(); } }, ku = (e) => { if (e.code === 'Space') S.thrust = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    g.run({
      init() { S.y = S.h0; S.vy = 0; S.fuel = 100; S.thrust = false; S.st = 'fly'; g.say('Mantén presionada la pantalla (o la barra espaciadora) para encender el motor. ¡Aterriza suave!'); },
      step(dt) {
        if (S.st !== 'fly') return;
        const [gg, th] = G[g.p.w];
        const burn = S.thrust && S.fuel > 0; if (burn) S.fuel = Math.max(0, S.fuel - dt * 9);
        const a = -gg + (burn ? th : 0); S.vy += a * dt; S.y += S.vy * dt;
        g.show('h', FK.n(Math.max(0, S.y), 0) + ' m'); g.show('v', FK.n(Math.abs(S.vy), 1) + ' m/s ' + (S.vy < -2 ? '⚠️' : '✅')); g.show('f', FK.n(S.fuel, 0) + ' %');
        if (S.y <= 0) {
          S.y = 0; const v = Math.abs(S.vy);
          if (v <= 2) { S.st = 'ok'; if (g.p.w === 'luna') g.win(`¡Alunizaje perfecto a ${FK.n(v, 1)} m/s con ${FK.n(S.fuel, 0)} % de combustible!`); else g.say(`¡Aterrizaste en Marte a ${FK.n(v, 1)} m/s! Ahora intenta la Luna.`, 'wow'); }
          else { S.st = 'crash'; FK.sfx.boom(); g.say(`¡Choque a ${FK.n(v, 1)} m/s! Frena antes: enciende el motor cuando la caída sea rápida.`, 'sad'); }
        }
      },
      draw(c, W, H) {
        const luna = g.p.w === 'luna';
        D.night(c, W, H, luna ? 5 : 8, 70); if (!luna) { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(120,40,20,.0)'); gr.addColorStop(1, 'rgba(255,120,60,.35)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
        const gy = H - 50; c.beginPath(); c.moveTo(0, H); c.lineTo(0, gy + 6); for (let x = 0; x <= W; x += 40) c.lineTo(x, gy + 6 + Math.sin(x * 0.04) * 6); c.lineTo(W, H); c.fillStyle = luna ? '#9A9AA8' : '#B8573A'; c.fill(); c.strokeStyle = D.INK; c.lineWidth = 3; c.stroke();
        D.box(c, 380, gy - 4, 60, 10, '#12B76A', { r: 4, lw: 2 }); D.text(c, 'zona de aterrizaje', 410, gy + 24, { size: 12, align: 'center', color: '#fff' });
        const py = gy - 20 - (S.y / S.h0) * (gy - 80), px = 410;
        if (S.thrust && S.fuel > 0 && S.st === 'fly') D.emoji(c, '🔥', px, py + 34, 30);
        D.emoji(c, S.st === 'crash' ? '💥' : '🚀', px, py, 52, S.st === 'crash' ? 0 : Math.PI);
        D.bar(c, 30, 24, 160, 18, S.fuel / 100, S.fuel > 25 ? '#12B76A' : '#FF4757', 'combustible', { size: 12, ink: '#fff' });
        D.text(c, S.thrust ? '🔥 motor encendido' : 'mantén presionado para empujar', W - 20, 34, { size: 15, align: 'right', color: '#fff' });
        D.char(c, 'cosmo', 90, H - 130, 72, S.st === 'ok' ? 'wow' : 'happy');
      }
    });
  });
})();
