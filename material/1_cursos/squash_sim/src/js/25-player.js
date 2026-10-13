/* Modelo del jugador: capacidades, postura de golpe, desplazamiento con pasos y esqueleto 3D.
   El centro de masa sigue un perfil acelerar–crucero–frenar: acelera con amáx, viaja a velocidad de
   crucero (≤ vmáx) y frena en la estocada con una desaceleración mayor (1,6·amáx), que es lo que
   permite el apoyo excéntrico del cuádriceps y el glúteo. El tiempo mínimo para recorrer d sale de ese perfil. */
MS.Player = (function () {
  const { C, U } = MS;
  const LEVELS = {
    principiante: { nombre: 'Principiante', amax: 5.0, vmax: 3.4, rt: 0.34, step: 0.74, lunge: 1.12 },
    intermedio: { nombre: 'Intermedio', amax: 6.2, vmax: 3.9, rt: 0.27, step: 0.82, lunge: 1.24 },
    avanzado: { nombre: 'Avanzado', amax: 7.4, vmax: 4.4, rt: 0.22, step: 0.88, lunge: 1.34 },
    elite: { nombre: 'Élite', amax: 8.6, vmax: 4.9, rt: 0.18, step: 0.94, lunge: 1.44 },
  };
  const DEC = 1.6;   // frenado en la estocada = 1,6 · amáx
  const H_READY = 0.84, H_RUN = 0.87;
  const FRONT = -Math.PI / 2;  // mirando a la pared frontal
  function tMin(d, lv) {
    if (d < 0.04) return 0.12;
    const a1 = lv.amax, a2 = lv.amax * DEC, v = lv.vmax;
    const dA = (v * v) / (2 * a1), dD = (v * v) / (2 * a2);
    if (d >= dA + dD) return v / a1 + v / a2 + (d - dA - dD) / v + 0.05;
    const vp = Math.sqrt((2 * d * a1 * a2) / (a1 + a2));
    return vp / a1 + vp / a2 + 0.05;
  }
  /* Perfil s(u) normalizado (0→1) para recorrer d en T con aceleración a1 y frenado a2 */
  function profile(d, T, lv, kind) {
    const a1 = lv.amax * (kind === 'golpe' ? 1 : 0.8), a2 = a1 * (kind === 'golpe' ? DEC : 1.1);
    const k = 1 / (2 * a1) + 1 / (2 * a2);
    const disc = T * T - 4 * k * d;
    const v = disc > 0 ? (T - Math.sqrt(disc)) / (2 * k) : T / (2 * k);
    let ra = v / a1 / T, rd = v / a2 / T;
    const sum = ra + rd; if (sum > 0.98) { ra *= 0.98 / sum; rd *= 0.98 / sum; }
    const N = 80, s = new Float64Array(N + 1);
    let acc = 0;
    const vel = (u) => (u < ra ? U.smooth(u / ra) : u > 1 - rd ? U.smooth((1 - u) / rd) : 1);
    for (let i = 1; i <= N; i++) { acc += (vel((i - 0.5) / N)) / N; s[i] = acc; }
    for (let i = 0; i <= N; i++) s[i] /= acc || 1;
    const f = (u) => { u = U.clamp(u, 0, 1) * N; const i = Math.min(N - 1, Math.floor(u)); return s[i] + (s[i + 1] - s[i]) * (u - i); };
    f.inv = (y) => { let lo = 0, hi = 1; for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return lo; };
    f.vpeak = (d / T) / (1 - (ra + rd) / 2);
    return f;
  }
  const other = (f) => (f === 'I' ? 'D' : 'I');
  const fwd = (a) => ({ x: Math.cos(a), y: Math.sin(a) });
  const leftOf = (a) => ({ x: Math.sin(a), y: -Math.cos(a) });   // izquierda del cuerpo para orientación a

  function create(j, idx) {
    const lv = LEVELS[j.nivel] || LEVELS.avanzado;
    const base = j.base ? { x: j.base[0], y: j.base[1] } : { x: C.Twait.x + (idx - 0.5) * 0.5, y: C.Twait.y };
    const pl = {
      id: j.id, nombre: j.nombre || j.id, color: j.color || '#1d6fb8', mano: j.mano === 'Z' ? 'Z' : 'D', nivel: j.nivel || 'avanzado', lv, idx,
      base, keys: [], feet: { I: [], D: [] }, footInit: null, phases: [], swings: [], lunges: [], notes: [],
      tecnica: j.tecnica || 'ok',
    };
    const rs = readyStance(base, FRONT);
    pl.footInit = rs.feet;
    pl.keys.push({ t: 0, x: base.x, y: base.y, h: H_READY, yaw: FRONT, lean: 0.2 });
    return pl;
  }

  function readyStance(p, yaw) {
    const L = leftOf(yaw);
    return {
      com: { x: p.x, y: p.y }, h: H_READY, yaw, lean: 0.2,
      feet: { I: { x: p.x + L.x * 0.23, y: p.y + L.y * 0.23, a: yaw - 0.15 }, D: { x: p.x - L.x * 0.23, y: p.y - L.y * 0.23, a: yaw + 0.15 } },
    };
  }

  /* Postura de impacto para una bola en `ball` llegando desde `from`.
     tech: 'ok' | 'cambiada' (pierna delantera equivocada) | 'encimado' (demasiado cerca de la bola)
     dir: 'paralela' | 'cruzada' | 'boast' → punto de impacto respecto de la pierna delantera (B1, B2, B3) */
  function stance(pl, ball, from, tech, dir) {
    tech = tech || pl.tecnica || 'ok';
    const dx = ball.x - from.x;
    let sideSign = Math.abs(dx) > 0.3 ? Math.sign(dx) : (pl.mano === 'D' ? 1 : -1);
    if (ball.x < 0.75) sideSign = -1;
    if (ball.x > C.W - 0.75) sideSign = 1;
    const fh = (sideSign > 0) === (pl.mano === 'D');
    const mv = U.norm(U.sub(ball, from));
    let u = U.norm({ x: sideSign * 1.0 + mv.x * 0.45, y: mv.y * 0.6 });
    /* en las esquinas el pie apunta al ángulo entre paredes (manual: 1 m antes del frontón o del vidrio) */
    if (ball.y < 1.3) u = U.norm({ x: u.x, y: u.y - 0.45 });
    if (ball.y > 8.6) u = U.norm({ x: u.x, y: u.y + 0.45 });
    const high = ball.z > 1.05;
    const reach = tech === 'encimado' ? 0.52 : high ? 0.78 : 0.98;
    let p = U.perp(u); if (p.y > 0) p = U.mul(p, -1);     // perpendicular hacia la pared frontal
    const off = dir === 'cruzada' ? 0.28 : dir === 'boast' ? -0.3 : 0;
    let F = { x: ball.x - u.x * reach - p.x * off, y: ball.y - u.y * reach - p.y * off };
    F = C.clampIn(F, 0.24);
    const depth = U.clamp((1.05 - ball.z) / 0.8, 0, 1);
    const lungeLen = high ? pl.lv.lunge * 0.62 : pl.lv.lunge * (0.82 + 0.28 * depth);
    const side = U.mul(U.perp(u), sideSign * (pl.mano === 'D' ? 1 : -1) * 0.12);
    let R = { x: F.x - u.x * lungeLen + side.x, y: F.y - u.y * lungeLen + side.y };
    R = C.clampIn(R, 0.2);
    let com = { x: F.x + (R.x - F.x) * (high ? 0.45 : 0.36), y: F.y + (R.y - F.y) * (high ? 0.45 : 0.36) };
    let front = fh ? (pl.mano === 'D' ? 'I' : 'D') : (pl.mano === 'D' ? 'D' : 'I');
    let yaw = U.angOf(u);
    if (tech === 'cambiada') {
      front = other(front);
      yaw = U.lerpAng(yaw, FRONT, 0.55);          // cuerpo de frente al frontón
    }
    const h = high ? 0.86 : U.lerp(0.76, 0.55, depth) - (tech === 'encimado' ? 0.06 : 0);
    const lean = (high ? 0.12 : U.lerp(0.25, 0.5, depth)) + (tech === 'encimado' ? 0.35 : 0) + (tech === 'cambiada' ? 0.12 : 0);
    const feet = {};
    feet[front] = { x: F.x, y: F.y, a: U.angOf(u) + (tech === 'cambiada' ? -sideSign * 0.5 : 0) };
    /* talón anclado: el pie trasero de costado, casi perpendicular a la estocada */
    feet[other(front)] = { x: R.x, y: R.y, a: U.angOf(u) + sideSign * (pl.mano === 'D' ? 1 : -1) * 1.25 };
    com = C.clampIn(com, 0.3);
    return { com, feet, front, yaw, h, lean, fh, sideSign, u, ball, reach, tech, dir: dir || 'paralela' };
  }

  /* ---------- Estado en el tiempo ---------- */
  function keyAt(pl, t) {
    const K = pl.keys;
    const i = U.bsearch(K, t);
    if (i < 0) return Object.assign({}, K[0]);
    if (i >= K.length - 1) return Object.assign({}, K[K.length - 1]);
    const a = K[i], b = K[i + 1], f = (t - a.t) / Math.max(1e-6, b.t - a.t);
    return { t, x: U.lerp(a.x, b.x, f), y: U.lerp(a.y, b.y, f), h: U.lerp(a.h, b.h, f), yaw: U.lerpAng(a.yaw, b.yaw, f), lean: U.lerp(a.lean, b.lean, f) };
  }
  function footAt(pl, f, t) {
    const E = pl.feet[f];
    let last = null;
    for (let i = 0; i < E.length; i++) { if (E[i].tLift <= t) last = E[i]; else break; }
    if (!last) return Object.assign({ z: 0 }, pl.footInit[f]);
    if (t >= last.tLand) return Object.assign({ z: 0 }, last.to);
    const k = (t - last.tLift) / Math.max(1e-6, last.tLand - last.tLift);
    const e = U.smooth(k);
    return { x: U.lerp(last.from.x, last.to.x, e), y: U.lerp(last.from.y, last.to.y, e), a: U.lerpAng(last.from.a, last.to.a, e), z: Math.sin(Math.PI * k) * Math.min(0.13, 0.05 + U.dist(last.from, last.to) * 0.07) };
  }

  /* Corta el plan en ts (antes de un nuevo desplazamiento) */
  function truncate(pl, ts) {
    const k = keyAt(pl, ts);
    pl.keys = pl.keys.filter((q) => q.t < ts - 1e-6);
    pl.keys.push(k);
    for (const f of ['I', 'D']) {
      const E = pl.feet[f];
      const keep = [];
      for (const e of E) {
        if (e.tLift > ts) continue;
        if (e.tLand > ts + 0.07) {
          const cur = footAt(pl, f, ts);
          keep.push({ tLift: e.tLift, tLand: ts + 0.07, from: e.from, to: { x: U.lerp(cur.x, e.to.x, 0.5), y: U.lerp(cur.y, e.to.y, 0.5), a: e.to.a } });
        } else keep.push(e);
      }
      pl.feet[f] = keep;
    }
    for (const ph of pl.phases) if (ph.t1 > ts && ph.t0 < ts && (ph.ph === 'recuperacion' || ph.ph === 'espera' || ph.ph === 'empuje')) ph.t1 = ts;
    pl.phases = pl.phases.filter((ph) => !(ph.t0 >= ts && (ph.ph === 'recuperacion' || ph.ph === 'espera' || ph.ph === 'empuje')));
  }

  /* Desplazamiento de ts a te hacia la postura `st` (de golpe o de espera).
     kind: 'golpe' | 'recup' | 'paseo'. lastFoot = pie que apoya al final (el de la estocada). */
  function move(pl, ts, te, st, kind) {
    truncate(pl, ts);
    const k0 = keyAt(pl, ts);
    const c0 = { x: k0.x, y: k0.y }, c1 = st.com;
    const d = U.dist(c0, c1);
    const T = Math.max(0.12, te - ts);
    /* trayectoria curva suave (los jugadores «abren» la curva para no quedar sobre la línea de la bola) */
    const mid = U.lerp2(c0, c1, 0.5);
    let bow = { x: 0, y: 0 };
    if (d > 1.2 && kind === 'golpe') { const n = U.perp(U.norm(U.sub(c1, c0))); const toC = U.dot(n, U.sub({ x: C.half, y: 5.2 }, mid)) > 0 ? 1 : -1; bow = U.mul(n, toC * Math.min(0.35, d * 0.08)); }
    const ctrl = U.add(mid, bow);
    const bez = (u) => ({ x: (1 - u) * (1 - u) * c0.x + 2 * (1 - u) * u * ctrl.x + u * u * c1.x, y: (1 - u) * (1 - u) * c0.y + 2 * (1 - u) * u * ctrl.y + u * u * c1.y });
    const yaw0 = k0.yaw, yaw1 = st.yaw;
    const moveDir = d > 0.05 ? U.angOf(U.sub(c1, c0)) : yaw1;
    const n = Math.max(2, Math.ceil(T * 30));
    const prof = profile(Math.max(d, 0.01), T, pl.lv, kind);
    for (let i = 1; i <= n; i++) {
      const tt = ts + (T * i) / n, u = i / n, s = prof(u);
      const p = bez(s);
      let h, lean;
      if (kind === 'golpe') {
        h = u < 0.7 ? U.lerp(k0.h, H_RUN, U.smooth(u / 0.25)) : U.lerp(H_RUN, st.h, U.smooth((u - 0.7) / 0.3));
        lean = u < 0.7 ? U.lerp(k0.lean, 0.3, U.smooth(u / 0.3)) : U.lerp(0.3, st.lean, U.smooth((u - 0.7) / 0.3));
      } else {
        h = U.lerp(k0.h, st.h, U.smooth(u / 0.6));
        lean = U.lerp(k0.lean, st.lean, U.smooth(u / 0.5));
      }
      /* el tronco gira pronto hacia la bola (preparación temprana) */
      const yaw = kind === 'golpe' ? U.lerpAng(yaw0, yaw1, U.smooth(u * 1.8)) : U.lerpAng(yaw0, yaw1, U.smooth(u * 1.3));
      pl.keys.push({ t: tt, x: p.x, y: p.y, h, yaw, lean });
    }
    /* ---- pasos ---- */
    const lastFoot = st.front || 'D';
    const firstFoot0 = { I: footAt(pl, 'I', ts), D: footAt(pl, 'D', ts) };
    const needOther = U.dist(firstFoot0[other(lastFoot)], st.feet[other(lastFoot)]) > 0.08;
    const needLast = U.dist(firstFoot0[lastFoot], st.feet[lastFoot]) > 0.08;
    if (!needOther && !needLast) return;
    let N = Math.max(2, Math.round(d / pl.lv.step) + 1);
    N = Math.min(N, Math.max(2, Math.floor(T / 0.17)));
    const seq = [];
    for (let i = 0; i < N; i++) seq.unshift(i % 2 === 0 ? lastFoot : other(lastFoot));
    const land = [];
    const dLast = kind === 'golpe' ? U.clamp(0.24 * T, 0.14, 0.3) : U.clamp(0.2 * T, 0.12, 0.25);
    for (let i = 0; i < N; i++) {
      if (i === N - 1) land.push(te);
      else if (i === N - 2) land.push(te - dLast);
      else {
        /* tiempo en que el centro de masa pasa por la fracción correspondiente del recorrido */
        const frac = ((i + 1) / (N - 1)) * 0.88;
        land.push(ts + T * Math.min(prof.inv(frac) + 0.06, 0.95));
      }
    }
    for (let i = 1; i < N; i++) if (land[i] < land[i - 1] + 0.09) land[i] = Math.min(te - (N - 1 - i) * 0.06, land[i - 1] + 0.09);
    const cur = { I: firstFoot0.I, D: firstFoot0.D };
    for (let i = 0; i < N; i++) {
      const f = seq[i];
      let to;
      if (i === N - 1) to = st.feet[lastFoot];
      else if (i === N - 2) to = st.feet[other(lastFoot)];
      else {
        const frac = ((i + 1) / (N - 1)) * 0.9;
        const p = bez(frac);
        const L = leftOf(moveDir);
        const sgn = f === 'I' ? 1 : -1;
        to = { x: p.x + L.x * 0.13 * sgn, y: p.y + L.y * 0.13 * sgn, a: moveDir + (kind === 'recup' ? 0 : 0) };
        to = Object.assign(C.clampIn(to, 0.12), { a: to.a });
      }
      const tLand = land[i];
      let tLift = i === 0 ? ts + 0.02 : land[i - 1] - 0.03;
      if (tLift > tLand - 0.08) tLift = tLand - 0.08;
      if (tLift < ts) tLift = ts;
      const from = { x: cur[f].x, y: cur[f].y, a: cur[f].a };
      if (U.dist(from, to) < 0.03 && i < N - 2) continue;
      pl.feet[f].push({ tLift, tLand, from, to: { x: to.x, y: to.y, a: to.a }, kind: i === N - 1 && kind === 'golpe' ? 'estocada' : 'paso' });
      cur[f] = to;
    }
    for (const f of ['I', 'D']) pl.feet[f].sort((a, b) => a.tLift - b.tLift);
  }

  function addPhase(pl, t0, t1, ph, meta) { if (t1 > t0 + 1e-3) pl.phases.push({ t0, t1, ph, meta: meta || null }); }

  /* Fase dominante en t (para etiquetas y activación muscular) */
  function phasesAt(pl, t) {
    const out = [];
    for (const p of pl.phases) if (t >= p.t0 && t < p.t1) out.push(p);
    return out;
  }

  /* ---------- Esqueleto 3D ---------- */
  const LEN = { thigh: 0.45, shank: 0.45, ankle: 0.07, trunk: 0.5, upper: 0.30, fore: 0.27, racket: 0.68 };
  function ik(A, B, l1, l2, hint) {
    const U3 = U;
    let d = U3.l3(U3.s3(B, A));
    const dir = U3.n3(U3.s3(B, A));
    d = Math.min(d, l1 + l2 - 1e-4);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let b = U3.s3(hint, U3.m3(dir, U3.d3(hint, dir)));
    const bl = U3.l3(b);
    b = bl < 1e-6 ? { x: 0, y: 0, z: 1 } : U3.m3(b, 1 / bl);
    return U3.a3(U3.a3(A, U3.m3(dir, a)), U3.m3(b, hh));
  }

  /* Estado del brazo: devuelve la fase del golpe y su avance */
  function swingAt(pl, t) {
    let sw = null;
    for (const s of pl.swings) { if (s.prep - 0.05 <= t && t <= s.tc + 0.75) { sw = s; } }
    if (!sw) return { st: 'ready', k: 0, sw: null };
    const t0 = sw.prep, t1 = sw.prep + 0.28, tf = sw.tc - 0.16, tc = sw.tc, tE = sw.tc + 0.24, tR = sw.tc + 0.7;
    if (t < t1) return { st: 'toPrep', k: U.smooth((t - t0) / (t1 - t0)), sw };
    if (t < tf) return { st: 'prep', k: 1, sw };
    if (t < tc) return { st: 'fwd', k: U.easeIn((t - tf) / (tc - tf)), sw };
    if (t < tE) return { st: 'finish', k: U.easeOut((t - tc) / (tE - tc)), sw };
    return { st: 'return', k: U.smooth((t - tE) / (tR - tE)), sw };
  }

  function skeleton(pl, t, ballNow) {
    const k = keyAt(pl, t);
    const yaw = k.yaw, f = { x: Math.cos(yaw), y: Math.sin(yaw), z: 0 }, r = { x: -Math.sin(yaw), y: Math.cos(yaw), z: 0 }, z = { x: 0, y: 0, z: 1 };
    const S = U.a3, M = U.m3;
    const P = { x: k.x, y: k.y, z: k.h };
    const lean = k.lean;
    const up = U.n3(S(M(f, Math.sin(lean)), M(z, Math.cos(lean))));
    const sw = swingAt(pl, t);
    const sigma = pl.mano === 'D' ? 1 : -1;
    const fh = sw.sw ? sw.sw.fh : true;
    const b = sigma * (fh ? 1 : -1);
    /* giro de hombros: leve (el manual insiste en minimizar la rotación del tronco) */
    let twist = 0;
    if (sw.st === 'toPrep') twist = 0.28 * b * sw.k; else if (sw.st === 'prep') twist = 0.28 * b; else if (sw.st === 'fwd') twist = U.lerp(0.28, -0.25, sw.k) * b; else if (sw.st === 'finish') twist = U.lerp(-0.25, -0.35, sw.k) * b; else if (sw.st === 'return') twist = U.lerp(-0.35, 0, sw.k) * b;
    if (pl.tecnica === 'cambiada' && sw.sw) twist *= 1.8;
    const ry = { x: Math.cos(twist) * r.x - Math.sin(twist) * f.x, y: Math.cos(twist) * r.y - Math.sin(twist) * f.y, z: 0 };
    const fy = { x: -ry.y, y: ry.x, z: 0 };
    const hipL = S(P, M(r, -0.1)), hipR = S(P, M(r, 0.1));
    const chest = S(P, M(up, 0.36));
    const neck = S(P, M(up, 0.56));
    const head = S(neck, S(M(z, 0.12), M(f, 0.03)));
    const shL = S(S(P, M(up, 0.52)), M(ry, -0.19)), shR = S(S(P, M(up, 0.52)), M(ry, 0.19));
    /* piernas */
    const legs = {};
    for (const side of ['I', 'D']) {
      const ft = footAt(pl, side, t);
      const ff = { x: Math.cos(ft.a), y: Math.sin(ft.a), z: 0 };
      const ankle = { x: ft.x - ff.x * 0.03, y: ft.y - ff.y * 0.03, z: LEN.ankle + ft.z };
      const hip = side === 'I' ? hipL : hipR;
      const hint = S(M(ff, 1), M(f, 0.6));
      const knee = ik(hip, ankle, LEN.thigh, LEN.shank, hint);
      const toe = S(ankle, S(M(ff, 0.17), { x: 0, y: 0, z: -0.05 }));
      const heel = S(ankle, S(M(ff, -0.07), { x: 0, y: 0, z: -0.05 }));
      const v1 = U.s3(hip, knee), v2 = U.s3(ankle, knee);
      const kneeAng = U.deg(Math.acos(U.clamp(U.d3(v1, v2) / (U.l3(v1) * U.l3(v2)), -1, 1)));
      const overToe = U.d3(U.s3(knee, toe), ff);
      legs[side] = { hip, knee, ankle, toe, heel, kneeAng, overToe, lift: ft.z };
    }
    /* brazos */
    const shA = sigma > 0 ? shR : shL, shO = sigma > 0 ? shL : shR;
    const W = (o, a, bb, c) => S(S(S(o, M(fy, a)), M(ry, bb)), M(z, c));
    const READY = { w: W(shA, 0.42, -sigma * 0.16, -0.34), d: U.n3(S(S(M(fy, 0.45), M(z, 0.85)), M(ry, sigma * 0.1))) };
    const PREP = { w: W(shA, 0.02, b * 0.36, 0.12), d: U.n3(S(S(M(z, 0.85), M(ry, b * 0.45)), M(fy, -0.2))) };
    const FIN = { w: W(shA, 0.25, -b * 0.47, 0.26), d: U.n3(S(M(z, 0.9), M(ry, -b * 0.45))) };
    let IMP;
    const ballP = sw.sw && sw.sw.ball ? sw.sw.ball : null;
    if (ballP) {
      const dir = U.n3(U.s3(ballP, shA));
      const w = S(shA, M(dir, 0.56));
      IMP = { w, d: U.n3(U.s3(ballP, w)) };
    } else IMP = { w: W(shA, 0.5, b * -0.05, -0.32), d: U.n3(S(M(fy, 0.8), M(z, -0.4))) };
    const mix = (A, B, kk) => ({ w: U.lerp3(A.w, B.w, kk), d: U.n3(U.lerp3(A.d, B.d, kk)) });
    let arm;
    switch (sw.st) {
      case 'toPrep': arm = mix(READY, PREP, sw.k); break;
      case 'prep': arm = PREP; break;
      case 'fwd': arm = mix(PREP, IMP, sw.k); break;
      case 'finish': arm = mix(IMP, FIN, sw.k); break;
      case 'return': arm = mix(FIN, READY, sw.k); break;
      default: arm = READY;
    }
    const elbowA = ik(shA, arm.w, LEN.upper, LEN.fore, S(M(z, -1), M(ry, sigma * 0.5)));
    const wristA = arm.w;
    const racketHead = S(wristA, M(arm.d, 0.5));
    const racketTip = S(wristA, M(arm.d, LEN.racket));
    /* brazo libre: equilibrio y «tijera» de escápulas en el revés */
    let hand;
    if (!sw.sw || sw.st === 'ready') hand = W(shO, 0.3, sigma * 0.05, -0.38);
    else if (fh) {
      const prepH = W(shO, 0.45, -sigma * 0.05, -0.08), impH = W(shO, 0.18, -sigma * 0.28, -0.22), finH = W(shO, 0.05, -sigma * 0.32, -0.12);
      hand = sw.st === 'toPrep' ? U.lerp3(W(shO, 0.3, sigma * 0.05, -0.38), prepH, sw.k) : sw.st === 'prep' ? prepH : sw.st === 'fwd' ? U.lerp3(prepH, impH, sw.k) : sw.st === 'finish' ? U.lerp3(impH, finH, sw.k) : U.lerp3(finH, W(shO, 0.3, sigma * 0.05, -0.38), sw.k);
    } else {
      const prepH = S(chest, S(M(fy, 0.26), M(z, -0.2))), impH = W(shO, -0.12, -sigma * 0.3, -0.05), finH = W(shO, -0.22, -sigma * 0.36, 0.08);
      hand = sw.st === 'toPrep' ? U.lerp3(W(shO, 0.3, sigma * 0.05, -0.38), prepH, sw.k) : sw.st === 'prep' ? prepH : sw.st === 'fwd' ? U.lerp3(prepH, impH, sw.k) : sw.st === 'finish' ? U.lerp3(impH, finH, sw.k) : U.lerp3(finH, W(shO, 0.3, sigma * 0.05, -0.38), sw.k);
    }
    const elbowO = ik(shO, hand, LEN.upper, LEN.fore, S(M(z, -1), M(ry, -sigma * 0.5)));
    return { P, chest, neck, head, shL, shR, shA, shO, legs, elbowA, wristA, racketHead, racketTip, racketDir: arm.d, elbowO, handO: hand, yaw, swing: sw, k };
  }

  return { LEVELS, tMin, profile, create, readyStance, stance, keyAt, footAt, move, truncate, addPhase, phasesAt, swingAt, skeleton, other, FRONT, H_READY };
})();
