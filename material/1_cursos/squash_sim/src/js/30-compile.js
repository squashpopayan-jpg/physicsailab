/* Compila una rutina en una línea de tiempo reproducible.
   Rutina (formato de intercambio «manu-squash-rutina» v1):
   { nombre, descripcion, objetivo, nivel, jugadores:[{id,nombre,color,mano:'D'|'Z',nivel,base:[x,y],tecnica}],
     secuencia:[{j, golpe, zona?, impacto?:'auto'|'volea'|'sobrepique'|'maximo'|'bajo', rec?:'T'|'base'|spot|[x,y], dir?, nota?, pausa?}],
     ciclos, ritmo:'lento'|'medio'|'rapido', temp, alt, inicio:{x,y,z}, semilla, modo:'rutina'|'partido' }
   golpe 'fantasma' = ghosting (sin bola) hacia `zona` (FI, FD, MI, MD, BI, BD o 'aleatoria').           */
MS.Compile = (function () {
  const { C, U, Ball, Shots, Player } = MS;
  const RITMO = { lento: 0.86, medio: 1, rapido: 1.12 };
  const INT = { suave: 1.5, media: 1.25, alta: 1.08, maxima: 1.0 };

  function spotFor(rec, pl, idx) {
    if (Array.isArray(rec)) return { x: rec[0], y: rec[1] };
    if (rec && typeof rec === 'object') return { x: rec.x, y: rec.y };
    if (rec === 'base') return pl.base;
    if (rec && C.spots[rec]) return C.spots[rec];
    return { x: C.spots.T.x + (idx - 0.5) * 0.36, y: C.spots.T.y };
  }

  function expand(rt) {
    const seq = rt.secuencia || [];
    if (!seq.length) return [];
    const ghostOnly = seq.every((s) => s.golpe === 'fantasma');
    const cyc = rt.ciclos || (ghostOnly ? Math.max(1, Math.ceil(12 / seq.length)) : Math.max(2, Math.ceil(16 / seq.length)));
    const rng = U.rng(rt.semilla || 7);
    const out = [];
    let lastZ = null;
    for (let c = 0; c < cyc; c++) for (let i = 0; i < seq.length; i++) {
      const s = Object.assign({}, seq[i], { ciclo: c, idx: i });
      if (s.golpe === 'fantasma' && (!s.zona || s.zona === 'aleatoria')) {
        let z; do { z = rng.pick(['FI', 'FD', 'MI', 'MD', 'BI', 'BD']); } while (z === lastZ);
        s.zona = z; s.azar = true;
      }
      if (s.golpe === 'fantasma') lastZ = s.zona;
      out.push(s);
    }
    return out;
  }

  /* Elige punto de impacto factible para el receptor */
  function chooseContact(pl, traj, tHit, tStart, mode, opts) {
    const cands = Shots.candidates(traj, mode);
    const from = Player.keyAt(pl, tStart);
    let list = cands;
    if (mode === 'volea') {
      const vol = cands.filter((c) => c.cls === 'volea'), rest = cands.filter((c) => c.cls !== 'volea');
      const dOf = (c) => U.dist(from, Player.stance(pl, c, from, opts.tech, opts.dir).com);
      vol.sort((a, b) => dOf(a) - dOf(b));
      list = vol.concat(rest);
    }
    let best = null;
    for (const c of list) {
      const st = Player.stance(pl, c, from, opts.tech, opts.dir);
      const d = U.dist(from, st.com);
      const need = Player.tMin(d, pl.lv);
      const avail = tHit + c.t - tStart;
      const slack = avail - need;
      if (slack >= 0.04) return { c, st, need, avail, late: 0 };
      if (!best || slack > best.slack) best = { c, st, need, avail, slack };
    }
    if (!best) return null;
    return { c: best.c, st: best.st, need: best.need, avail: best.avail, late: Math.max(0, -best.slack) };
  }

  function compile(rt, override = {}) {
    const t0Perf = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    rt = Object.assign({}, rt, override);
    const en = Ball.env({ temp: rt.temp != null ? rt.temp : 40, alt: rt.alt != null ? rt.alt : 1760 });
    const ritmo = RITMO[rt.ritmo] || 1;
    const players = (rt.jugadores || []).map((j, i) => Player.create(Object.assign({}, j, rt.nivelGlobal ? { nivel: rt.nivelGlobal } : {}, rt.tecnicaGlobal ? { tecnica: rt.tecnicaGlobal } : {}), i));
    const byId = {}; players.forEach((p) => (byId[p.id] = p));
    const steps = expand(rt);
    const shots = [];
    const warnings = [];
    const tl = { rt, en, players, shots, warnings, duration: 0, steps };
    if (rt.modo === 'partido' && players.length >= 2) { const r = MS.Match.compile(rt, tl, en, ritmo); r.ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0Perf; return r; }
    if (!players.length || !steps.length) { tl.duration = 2; finalize(tl); return tl; }

    let tc = 0, contact = null, prev = null;
    const intensity = INT[rt.intensidad] || INT.alta;

    for (let k = 0; k < steps.length; k++) {
      const st = steps[k];
      const pl = byId[st.j] || players[0];
      const tech = st.tecnica || pl.tecnica;

      /* ----- ghosting ----- */
      if (st.golpe === 'fantasma') {
        const g = C.ghost[st.zona] || C.ghost.FI;
        const tStart = prev ? prev.tFree + (st.pausa != null ? st.pausa : (rt.pausa != null ? rt.pausa : 0.45)) : 0.6;
        const from = Player.keyAt(pl, tStart);
        const stc = Player.stance(pl, g, from, tech, st.dir);
        const d = U.dist(from, stc.com);
        const T = Player.tMin(d, pl.lv) * intensity;
        /* split-step imaginario antes de salir */
        Player.addPhase(pl, tStart - 0.2, tStart, 'split');
        splitHop(pl, tStart - 0.2, tStart);
        const ts = tStart + pl.lv.rt * 0.6, te = ts + T;
        Player.move(pl, ts, te, stc, 'golpe');
        golpePhases(pl, ts, te, stc, null);
        pl.swings.push({ tc: te, prep: ts + 0.05, fh: stc.fh, ball: { x: g.x, y: g.y, z: g.z }, shot: 'fantasma' });
        pl.lunges.push({ t: te, pie: stc.front, z: g.z, st: stc });
        const rec = spotFor(st.rec || 'T', pl, pl.idx);
        const rs = Player.readyStance(rec, Player.FRONT);
        const dR = U.dist(stc.com, rec);
        const TR = Player.tMin(dR, pl.lv) * intensity * 1.05;
        Player.move(pl, te + 0.14, te + 0.14 + TR, rs, 'recup');
        recPhases(pl, te + 0.14, te + 0.14 + TR);
        shots.push({ k, j: pl.id, golpe: 'fantasma', zona: st.zona, t0: te, contact: { x: g.x, y: g.y, z: g.z }, cls: 'fantasma', late: 0, nota: st.nota, st: stc, res: null, step: st });
        prev = { tFree: te + 0.14 + TR, tBall: null, pl };
        tc = te;
        continue;
      }

      /* ----- primer golpe o saque: bola nueva ----- */
      if (!contact || st.golpe === 'saque') {
        let c0;
        if (st.golpe === 'saque') {
          const box = st.caja || (shots.filter((s) => s.golpe === 'saque' && s.j === pl.id).length % 2 === 0 ? 'D' : 'I');
          c0 = { x: box === 'D' ? 5.45 : 0.95, y: 6.35, z: 1.05 };
        } else c0 = rt.inicio ? Object.assign({}, rt.inicio) : { x: pl.base.x < C.half ? 0.85 : C.W - 0.85, y: pl.base.y > 5 ? 8.5 : 1.8, z: 0.6 };
        const tReady = prev ? (prev.tBall != null ? prev.tBall + 1.2 : (prev.tFree || 0) + 0.4) : 0.4;
        const from = Player.keyAt(pl, tReady);
        const stc = Player.stance(pl, c0, from, st.golpe === 'saque' ? 'ok' : tech, st.dir);
        if (st.golpe === 'saque') { stc.h = 0.86; stc.lean = 0.15; }
        const d = U.dist(from, stc.com);
        const T = Math.max(0.6, Player.tMin(d, pl.lv) * 1.5);
        Player.move(pl, tReady, tReady + T, stc, st.golpe === 'saque' ? 'paseo' : 'golpe');
        if (st.golpe !== 'saque') golpePhases(pl, tReady, tReady + T, stc, null);
        tc = tReady + T + (st.golpe === 'saque' ? 0.6 : 0);
        contact = c0;
        pl.swings.push({ tc, prep: tc - 0.55, fh: stc.fh, ball: c0, shot: st.golpe });
        if (st.golpe !== 'saque') pl.lunges.push({ t: tc, pie: stc.front, z: c0.z, st: stc });
        prev = { stc, cls: st.golpe === 'saque' ? 'saque' : 'alimentacion' };
      }

      /* ----- el golpe ----- */
      const res = Shots.plan(contact, st.golpe, { zona: st.zona, ritmo, env: en });
      const shot = { k, j: pl.id, golpe: st.golpe, zona: st.zona, t0: tc, contact, cls: prev && prev.cls, late: prev && prev.late || 0, nota: st.nota, res, step: st, st: prev && prev.stc };
      shots.push(shot);
      if (!res.ok) { warnings.push(`Golpe ${k + 1} (${st.golpe}): ${res.warnings.join(' ')}`); break; }
      for (const w of res.warnings) warnings.push(`Golpe ${k + 1} · ${Shots.CAT[st.golpe].nombre}: ${w}`);
      const tEndBall = tc + res.traj.tEnd;
      shot.t1 = tEndBall;

      /* recuperación del que golpeó */
      const rec = spotFor(st.rec || 'T', pl, pl.idx);
      const rs = Player.readyStance(rec, Player.FRONT);
      const cNow = Player.keyAt(pl, tc);
      const dR = U.dist(cNow, rec);
      const TR = Math.max(0.5, Player.tMin(dR, pl.lv) * 1.18);
      Player.move(pl, tc + 0.12, tc + 0.12 + TR, rs, 'recup');
      recPhases(pl, tc + 0.12, tc + 0.12 + TR);

      const next = steps[k + 1];
      if (!next) { tl.duration = Math.max(tEndBall, tc + 0.12 + TR) + 0.8; break; }
      if (next.golpe === 'saque' || next.golpe === 'fantasma') { contact = null; prev = { tBall: tEndBall, tFree: tc + 0.12 + TR }; continue; }

      /* ----- receptor ----- */
      const pl2 = byId[next.j] || players[0];
      const tech2 = next.tecnica || pl2.tecnica;
      const mode = next.impacto && next.impacto !== 'auto' ? next.impacto : Shots.isVolley(next.golpe) ? 'volea' : 'pique';
      const same = pl2 === pl;
      /* en rutinas cooperativas el receptor sabe qué golpe viene: anticipa (reacción ×0,5) */
      const tStart = same ? tc + 0.22 : tc + pl2.lv.rt * (rt.anticipacion === false ? 1 : 0.5);
      if (!same) { Player.addPhase(pl2, tc - 0.16, tc + 0.04, 'split'); splitHop(pl2, tc - 0.16, tc + 0.04); }
      let ch = chooseContact(pl2, res.traj, tc, tStart, mode, { tech: tech2, dir: next.dir });
      if (!ch) { warnings.push(`Golpe ${k + 2}: la bola no queda jugable.`); tl.duration = tEndBall + 1; break; }
      const tHit = tc + ch.c.t;
      /* si sobra tiempo, el jugador «camina la cancha»: espera y se desplaza a ritmo cómodo */
      let T = ch.late > 0 ? ch.avail : Math.min(ch.avail, ch.need * 1.45);
      let ts = tHit - T;
      if (ts > tStart + 0.05) {
        const from2 = Player.keyAt(pl2, ts);
        const st2 = Player.stance(pl2, ch.c, from2, tech2, next.dir);
        const need2 = Player.tMin(U.dist(from2, st2.com), pl2.lv);
        if (need2 <= T) ch.st = st2; else { ts = tStart; T = tHit - ts; }
      }
      Player.move(pl2, ts, tHit, ch.st, 'golpe');
      golpePhases(pl2, ts, tHit, ch.st, ch.late);
      pl2.swings.push({ tc: tHit, prep: ts + 0.06, fh: ch.st.fh, ball: { x: ch.c.x, y: ch.c.y, z: ch.c.z }, shot: next.golpe });
      pl2.lunges.push({ t: tHit, pie: ch.st.front, z: ch.c.z, st: ch.st, cls: ch.c.cls });
      if (ch.late > 0.02) warnings.push(`Golpe ${k + 2}: ${pl2.nombre} llega ${U.num(ch.late * 1000, 0)} ms tarde.`);
      contact = { x: ch.c.x, y: ch.c.y, z: ch.c.z };
      prev = { cls: ch.c.cls, late: ch.late, stc: ch.st };
      tc = tHit;
    }
    if (!tl.duration) {
      let m = 0;
      for (const p of players) m = Math.max(m, p.keys[p.keys.length - 1].t);
      for (const s of shots) m = Math.max(m, s.t1 || s.t0);
      tl.duration = m + 0.8;
    }
    finalize(tl);
    tl.ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0Perf;
    return tl;
  }

  function splitHop(pl, t0, t1) {
    /* pequeño salto con apertura de pies; cae justo cuando el rival impacta */
    const k0 = Player.keyAt(pl, t0);
    if (t0 < (pl.keys[pl.keys.length - 1].t) - 0.01) return;  // en pleno movimiento: no se fuerza
    pl.keys.push({ t: t0 + (t1 - t0) * 0.45, x: k0.x, y: k0.y, h: k0.h + 0.05, yaw: k0.yaw, lean: k0.lean });
    pl.keys.push({ t: t1, x: k0.x, y: k0.y, h: k0.h - 0.05, yaw: k0.yaw, lean: k0.lean + 0.05 });
  }
  function golpePhases(pl, ts, te, st, late) {
    const T = te - ts;
    const a = ts + Math.min(0.3, T * 0.28), b = te - Math.min(0.32, T * 0.3);
    Player.addPhase(pl, ts, a, 'salida');
    Player.addPhase(pl, a, Math.max(a, b), 'carrera');
    Player.addPhase(pl, Math.max(a, b), te + 0.08, 'estocada', { pie: st.front, tech: st.tech, late });
    Player.addPhase(pl, te - 0.16, te + 0.22, 'golpe', { fh: st.fh, tech: st.tech, dir: st.dir });
  }
  function recPhases(pl, ts, te) {
    Player.addPhase(pl, ts, Math.min(te, ts + 0.3), 'empuje');
    Player.addPhase(pl, Math.min(te, ts + 0.3), te, 'recuperacion');
  }

  /* Estadísticas por jugador */
  function finalize(tl) {
    const T = tl.duration;
    for (const pl of tl.players) {
      pl.keys.sort((a, b) => a.t - b.t);
      pl.phases.sort((a, b) => a.t0 - b.t0);
      let dist = 0, vmax = 0;
      for (let i = 1; i < pl.keys.length; i++) {
        const a = pl.keys[i - 1], b = pl.keys[i];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        dist += d;
        const dt = b.t - a.t;
        if (dt > 0.01) vmax = Math.max(vmax, d / dt);
      }
      let steps = 0; for (const f of ['I', 'D']) steps += pl.feet[f].length;
      const lungI = pl.lunges.filter((l) => l.pie === 'I').length, lungD = pl.lunges.filter((l) => l.pie === 'D').length;
      /* distancia a la T cuando golpea otro jugador (dominio de la T) */
      const others = tl.shots.filter((s) => s.j !== pl.id && s.golpe !== 'fantasma');
      let dT = 0; for (const s of others) { const k = Player.keyAt(pl, s.t0); dT += U.dist(k, C.T); }
      const mine = tl.shots.filter((s) => s.j === pl.id);
      const cls = {}; for (const s of mine) if (s.cls) cls[s.cls] = (cls[s.cls] || 0) + 1;
      let work = 0; for (const ph of pl.phases) if (['salida', 'carrera', 'estocada', 'empuje', 'recuperacion'].includes(ph.ph)) work += ph.t1 - ph.t0;
      /* ángulo de rodilla delantera en cada estocada */
      const knees = pl.lunges.map((l) => { const sk = Player.skeleton(pl, l.t); const lg = sk.legs[l.pie]; return { t: l.t, pie: l.pie, ang: lg.kneeAng, over: lg.overToe }; });
      pl.knees = knees;
      pl.stats = {
        dist, vmax, steps, lungI, lungD, golpes: mine.length, dT: others.length ? dT / others.length : null,
        cls, late: mine.filter((s) => s.late > 0.02).length, lateMax: Math.max(0, ...mine.map((s) => s.late || 0)), work, T,
        kneeMin: knees.length ? Math.min(...knees.map((k) => k.ang)) : null,
        kneeOver: knees.filter((k) => k.over > 0.02).length,
      };
      pl.load = MS.Muscles ? MS.Muscles.load(pl, T) : null;
    }
  }

  return { compile, expand, spotFor, RITMO, INT, finalize, chooseContact, splitHop, golpePhases, recPhases };
})();
