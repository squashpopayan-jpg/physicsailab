/* Fundamentos: visor del swing completo en cámara lenta con el modelo del simulador. */
MS.Fund = (function () {
  const { U, C, Player, Shots, Ball, TV, Compile, Muscles } = MS;
  const SW = { side: 'fh', mano: 'D', tec: 'ok', t: 0.3, playing: true, tl: null, cam: { az: 0.75, el: 0.2, dist: 3.4, fov: 46 }, raf: 0, last: 0, camIdx: 0 };
  const CAMS = [{ az: 0.75, el: 0.2, dist: 3.4 }, { az: -0.2, el: 0.16, dist: 3.3 }, { az: Math.PI - 0.6, el: 0.2, dist: 3.4 }, { az: Math.PI / 2, el: 0.12, dist: 3.2 }, { az: 0.0, el: 1.15, dist: 4.4 }];
  const T0 = 0.3, T1 = 3.1, TC = 1.7;

  function build() {
    const pl = Player.create({ id: 'A', nombre: 'Jugador', color: '#1f6fb2', mano: SW.mano, nivel: 'avanzado', base: [3.2, 6.0], tecnica: SW.tec }, 0);
    const fhSideRight = (SW.side === 'fh') === (SW.mano === 'D');
    const ball = { x: fhSideRight ? 5.75 : 0.65, y: 6.0, z: 0.55 };
    const from = { x: 3.2, y: 6.0 };
    const st = Player.stance(pl, ball, from, SW.tec, 'paralela');
    Player.move(pl, 0.45, TC, st, 'golpe');
    Compile.golpePhases(pl, 0.45, TC, st, 0);
    pl.swings.push({ tc: TC, prep: 0.5, fh: st.fh, ball, shot: 'drive' });
    pl.lunges.push({ t: TC, pie: st.front, z: ball.z, st });
    const rs = Player.readyStance({ x: 3.2, y: 6.0 }, Player.FRONT);
    Player.move(pl, TC + 0.15, TC + 1.25, rs, 'recup');
    Compile.recPhases(pl, TC + 0.15, TC + 1.25);
    /* bola: llegada simple y salida con el motor físico */
    const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push({ t: u * 0.75, x: ball.x + (fhSideRight ? -0.05 : 0.05) * (1 - u), y: U.lerp(2.6, ball.y, u), z: U.lerp(1.5, ball.z, u) + Math.sin(Math.PI * u) * 0.25 }); }
    const inShot = { j: '·', golpe: 'drive', t0: TC - 0.75, contact: pts[0], res: { ok: true, traj: { pts, ev: [], tEnd: 0.75 } } };
    const out = Shots.plan(ball, 'drive', { env: Ball.env({ temp: 40 }) });
    const outShot = { j: 'A', golpe: 'drive', t0: TC, contact: ball, res: out, cls: 'maximo' };
    const tl = { players: [pl], shots: [inShot, outShot], duration: T1 + 0.2, warnings: [] };
    Compile.finalize(tl);
    SW.tl = tl; SW.st = st; SW.pl = pl;
    SW.cam.target = { x: (st.com.x + ball.x) / 2, y: st.com.y, z: 0.85 };
    note();
  }
  function note() {
    const st = SW.st, pl = SW.pl;
    const leg = st.front === 'I' ? 'izquierda' : 'derecha';
    const v = U.$('#swNote');
    const side = SW.side === 'fh' ? 'drive' : 'revés';
    const kn = pl.knees && pl.knees[0] ? Math.round(pl.knees[0].ang) : null;
    if (SW.tec === 'ok') { v.className = 'verdict ok'; v.textContent = `${SW.mano === 'D' ? 'Diestro' : 'Zurdo'}, ${side}: pierna ${leg} adelante con la punta hacia la lateral, hombros paralelos a la pared y talón trasero anclado.${kn ? ' Rodilla delantera a ' + kn + '°.' : ''}`; }
    else if (SW.tec === 'cambiada') { v.className = 'verdict bad'; v.textContent = `Pierna cambiada: adelanta la pierna ${leg} y queda de frente al frontón. Pierde la referencia del punto de impacto, la potencia y el control; el golpe depende de la muñeca y el hombro se fuerza.`; }
    else { v.className = 'verdict bad'; v.textContent = `Encimado: la bola queda pegada al cuerpo; el brazo se encoge, el tronco se dobla (carga lumbar) y, en el revés, los extensores de la muñeca sufren (epicondilitis).${kn ? ' Rodilla a ' + kn + '°.' : ''}`; }
  }
  function draw() {
    if (!SW.tl) return;
    const cv = U.$('#swCanvas'); const r = cv.getBoundingClientRect();
    const w = Math.max(200, r.width), h = Math.max(120, r.height);
    const ctx = U.fitCanvas(cv, w, h);
    TV.draw(ctx, w, h, SW.tl, SW.t, SW.cam, { angulos: true, musculos: false, trayectoria: true });
    const sw = Player.swingAt(SW.pl, SW.t);
    const A = Muscles.activation(SW.pl, SW.t);
    const names = { ready: 'Espera', toPrep: 'Preparación («radar prendido»)', prep: 'Preparación completa', fwd: 'Aceleración hacia la bola', finish: 'Impacto y terminación', return: 'Vuelta a la posición' };
    U.$('#swPhL').textContent = (names[sw.st] || '') + ' · ' + (Muscles.PHASE_NAMES[A.phase] || '');
    U.$('#swT').value = Math.round(1000 * (SW.t - T0) / (T1 - T0));
  }
  function loop(ts) {
    SW.raf = 0;
    if (MS.App.current !== 'fundamentos') return;
    const dt = SW.last ? Math.min(0.1, (ts - SW.last) / 1000) : 0; SW.last = ts;
    if (SW.playing) { SW.t += dt * 0.3; if (SW.t > T1) SW.t = T0; }
    draw();
    SW.raf = requestAnimationFrame(loop);
  }
  function start() { if (!SW.raf) { SW.last = 0; SW.raf = requestAnimationFrame(loop); } }
  function seg(id, key) {
    for (const b of U.$$(id + ' button')) b.addEventListener('click', () => { SW[key] = b.dataset[Object.keys(b.dataset)[0]]; for (const c of U.$$(id + ' button')) c.setAttribute('aria-pressed', String(c === b)); build(); draw(); });
  }
  function init() {
    seg('#swSide', 'side'); seg('#swHand', 'mano'); seg('#swTec', 'tec');
    U.$('#swT').addEventListener('input', (e) => { SW.playing = false; U.$('#swPlay').textContent = 'Reproducir'; SW.t = T0 + (+e.target.value / 1000) * (T1 - T0); draw(); });
    U.$('#swPlay').addEventListener('click', () => { SW.playing = !SW.playing; U.$('#swPlay').textContent = SW.playing ? 'Pausar' : 'Reproducir'; });
    U.$('#swCam').addEventListener('click', () => { SW.camIdx = (SW.camIdx + 1) % CAMS.length; Object.assign(SW.cam, CAMS[SW.camIdx]); draw(); });
    const cv = U.$('#swCanvas'); let drag = null;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, az: SW.cam.az, el: SW.cam.el }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!drag) return; SW.cam.az = drag.az - (e.clientX - drag.x) * 0.01; SW.cam.el = U.clamp(drag.el + (e.clientY - drag.y) * 0.007, 0.03, 1.45); if (!SW.playing) draw(); });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.style.touchAction = 'none';
    U.$('#swPlay').textContent = 'Pausar';
    U.$('#fdCmp1').addEventListener('click', () => { MS.App.go('simulador'); MS.Sim.open(MS.Routines.byId.cruzadasFondo, { key: 'lib:cruzadasFondo', tec: 'encimado', cam: 'lateral', musculos: true }); });
    U.$('#fdCmp2').addEventListener('click', () => { MS.App.go('simulador'); MS.Sim.open(MS.Routines.byId.drivesParalelos, { key: 'lib:drivesParalelos', tec: 'cambiada', cam: 'tv' }); });
    build();
  }
  MS.App.on('fundamentos', { init, show: () => { start(); setTimeout(draw, 20); } });
  return { SW };
})();
