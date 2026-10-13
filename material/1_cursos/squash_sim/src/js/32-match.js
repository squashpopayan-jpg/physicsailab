/* Partido simulado (2 jugadores): selección táctica de golpes, presión por tiempo, errores y puntuación PAR a 11.
   Un punto termina cuando el receptor no llega (golpe ganador) o cuando el que golpea comete un error al tin.
   No hay anticipación perfecta: el receptor reacciona con su tiempo de reacción completo. */
MS.Match = (function () {
  const { C, U, Shots, Player } = MS;
  const ERR = { principiante: 0.09, intermedio: 0.055, avanzado: 0.035, elite: 0.022 };

  function tactic(rng, hitter, opp, c, cls) {
    const oppY = opp.y;
    const back = c.y > 6.4, front = c.y < 3.4;
    let opts;
    if (cls === 'volea') opts = [['voleaDrive', 34], ['voleaC', 24], ['voleaDrop', oppY > 5.8 ? 26 : 8], ['kill', oppY > 6 ? 12 : 4]];
    else if (back) opts = [['drive', 48], ['cruzada', 22], ['boast', oppY > 6.2 ? 6 : 14], ['globo', 5], ['drop', oppY > 6.3 ? 9 : 3]];
    else if (front) opts = [['drop', oppY > 6 ? 30 : 8], ['drive', 30], ['cruzada', 22], ['globoC', oppY < 4.5 ? 22 : 10], ['dropC', oppY > 6 ? 10 : 3]];
    else opts = [['drive', 30], ['cruzada', 22], ['drop', oppY > 6 ? 26 : 8], ['kill', oppY > 6.2 ? 14 : 4], ['boast', 8]];
    if (cls === 'bajo') opts = opts.map(([k, w]) => [k, k === 'kill' || k === 'drop' ? w * 0.4 : k === 'globo' || k === 'globoC' ? w * 2.2 : w]);
    return rng.weighted(opts);
  }

  function compile(rt, tl, en, ritmo) {
    const CP = MS.Compile;
    const rng = U.rng(rt.semilla || 11);
    const [A, B] = tl.players;
    if (!B) { tl.duration = 2; return tl; }
    const dur = rt.duracion || 80;
    const score = {}; score[A.id] = 0; score[B.id] = 0;
    tl.rallies = [];
    let server = A, box = 'D', t = 0.6, nShot = 0;
    for (let r = 0; r < 14 && t < dur; r++) {
      const recv = server === A ? B : A;
      const rally = { n: r + 1, t0: t, shots: 0, server: server.id, winner: null, reason: '', score: null };
      /* posiciones de saque: el servidor a su cuadro, el restador al cuarto trasero contrario */
      const sBox = { x: box === 'D' ? 5.45 : 0.95, y: 6.35, z: 1.05 };
      const recvSpot = { x: box === 'D' ? 1.35 : 5.05, y: 7.9 };
      const tWalk = t + 2.2;
      const stS = Player.stance(server, sBox, Player.keyAt(server, t), 'ok');
      stS.h = 0.86; stS.lean = 0.15;
      Player.move(server, t, tWalk, stS, 'paseo');
      Player.move(recv, t, tWalk, Player.readyStance(recvSpot, U.angOf(U.sub({ x: C.half, y: 0 }, recvSpot))), 'paseo');
      let tc = tWalk + 0.6, contact = sBox, hitter = server, key = 'saque', cls = 'saque', late = 0;
      server.swings.push({ tc, prep: tc - 0.55, fh: stS.fh, ball: sBox, shot: 'saque' });
      let ended = false, lastBallEnd = tc + 2;
      for (let n = 0; n < 32 && !ended; n++) {
        const opp = hitter === A ? B : A;
        /* ¿error no forzado? */
        const lv = hitter.nivel;
        const pErr = (ERR[lv] || 0.04) + (cls === 'bajo' ? 0.04 : 0) + (late > 0 ? 0.08 : 0) + (key === 'kill' || key === 'drop' || key === 'voleaDrop' ? 0.03 : 0);
        const isErr = key !== 'saque' && rng() < pErr;
        const res = isErr ? Shots.plan(contact, key, { env: en, forceFront: { x: contact.x < C.half ? 0.9 : C.W - 0.9, z: 0.3, v: 16 } })
          : Shots.plan(contact, key, { env: en, ritmo });
        if (!res.ok) { ended = true; rally.winner = opp.id; rally.reason = 'error'; break; }
        nShot++; rally.shots++;
        const shot = { k: nShot, j: hitter.id, golpe: key, t0: tc, contact, cls, late, res, rally: r + 1, error: isErr, st: null };
        tl.shots.push(shot);
        shot.t1 = tc + res.traj.tEnd;
        lastBallEnd = shot.t1;
        /* recuperación hacia la T */
        const rec = CP.spotFor('T', hitter, hitter.idx);
        const cNow = Player.keyAt(hitter, tc);
        const TR = Math.max(0.5, Player.tMin(U.dist(cNow, rec), hitter.lv) * 1.12);
        Player.move(hitter, tc + 0.12, tc + 0.12 + TR, Player.readyStance(rec, Player.FRONT), 'recup');
        CP.recPhases(hitter, tc + 0.12, tc + 0.12 + TR);
        if (isErr) { shot.fin = 'Error al tin'; rally.winner = opp.id; rally.reason = 'error de ' + hitter.nombre; ended = true; break; }
        /* receptor */
        const tStart = tc + opp.lv.rt;
        CP.splitHop(opp, tc - 0.16, tc + 0.04); Player.addPhase(opp, tc - 0.16, tc + 0.04, 'split');
        const wantVol = rng() < (opp.nivel === 'elite' ? 0.45 : opp.nivel === 'avanzado' ? 0.35 : 0.2);
        let ch = CP.chooseContact(opp, res.traj, tc, tStart, wantVol ? 'volea' : 'pique', { tech: opp.tecnica });
        if (!ch) { rally.winner = hitter.id; rally.reason = 'ganador de ' + hitter.nombre; ended = true; break; }
        const tHit = tc + ch.c.t;
        const tol = 0.07;
        if (ch.late > tol) {
          /* no llega: se lanza igual hacia la bola, pero tarde */
          const T = Math.max(0.2, tHit + 0.15 - tStart);
          Player.move(opp, tStart, tStart + T, ch.st, 'golpe');
          CP.golpePhases(opp, tStart, tStart + T, ch.st, ch.late);
          shot.fin = 'Ganador: ' + opp.nombre + ' no llega (' + U.num(ch.late * 1000, 0) + ' ms)';
          rally.winner = hitter.id; rally.reason = 'ganador de ' + hitter.nombre; ended = true; break;
        }
        let T = Math.min(ch.avail, ch.need * 1.25);
        let ts = Math.max(tStart, tHit - T);
        Player.move(opp, ts, tHit, ch.st, 'golpe');
        CP.golpePhases(opp, ts, tHit, ch.st, ch.late);
        const nextKey = tactic(rng, opp, Player.keyAt(hitter, tHit), ch.c, ch.c.cls);
        opp.swings.push({ tc: tHit, prep: ts + 0.06, fh: ch.st.fh, ball: { x: ch.c.x, y: ch.c.y, z: ch.c.z }, shot: nextKey });
        opp.lunges.push({ t: tHit, pie: ch.st.front, z: ch.c.z, st: ch.st, cls: ch.c.cls });
        contact = { x: ch.c.x, y: ch.c.y, z: ch.c.z }; cls = ch.c.cls; late = ch.late; key = nextKey; tc = tHit; hitter = opp;
      }
      if (!rally.winner) { rally.winner = hitter.id; rally.reason = 'punto largo'; }
      score[rally.winner]++;
      rally.score = score[A.id] + '–' + score[B.id];
      rally.t1 = lastBallEnd;
      tl.rallies.push(rally);
      const winnerPl = rally.winner === A.id ? A : B;
      if (winnerPl === server) box = box === 'D' ? 'I' : 'D'; else { server = winnerPl; box = 'D'; }
      t = lastBallEnd + 1.0;
      if (score[A.id] >= 11 && score[A.id] - score[B.id] >= 2) break;
      if (score[B.id] >= 11 && score[B.id] - score[A.id] >= 2) break;
    }
    tl.score = score;
    let m = 0; for (const p of tl.players) m = Math.max(m, p.keys[p.keys.length - 1].t);
    tl.duration = Math.max(m, t) + 0.5;
    CP.finalize(tl);
    return tl;
  }
  return { compile, tactic };
})();
