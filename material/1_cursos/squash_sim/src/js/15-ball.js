/* Física de la bola: gravedad + arrastre cuadrático + rebotes en paredes y piso.
   Restitución: la norma WSF de la bola (citada en Dell'Acqua) pide un rebote mínimo del 12 % de la
   altura de caída (254 cm) a 23 °C y de 26–33 % a 45 °C. Como h_rebote/h_caída = e², se interpola
   e(T) = √(fracción). A mayor velocidad de impacto la bola pierde más energía (e baja). */
MS.Ball = (function () {
  const { C, U } = MS;

  function eTemp(T) {
    const f = 0.12 + ((0.295 - 0.12) * (T - 23)) / 22;
    return Math.sqrt(U.clamp(f, 0.03, 0.42));
  }
  function env(o = {}) {
    const alt = o.alt != null ? o.alt : 1760;
    const temp = o.temp != null ? o.temp : 40;
    const rho = C.airDensity(alt);
    const Cd = 0.5, A = Math.PI * C.ballR * C.ballR;
    return { g: o.g || 9.78, rho, alt, temp, k: (rho * Cd * A) / (2 * C.ballM), eBase: eTemp(temp), muWall: 0.80, muFloor: 0.74 };
  }
  function eImpact(en, vn) { return en.eBase * U.clamp(1.08 - 0.011 * (vn - 7), 0.6, 1.08); }

  /* Integra la trayectoria. s0 = {x,y,z,vx,vy,vz}. opts: {tMax, until:{floor:n}|{front:1}|{event:fn}, extra, dt, sample} */
  function simulate(s0, en, opts = {}) {
    let x = s0.x, y = s0.y, z = s0.z, vx = s0.vx, vy = s0.vy, vz = s0.vz, t = 0;
    const dt = opts.dt || 1 / 600, r = C.ballR, W = C.W, L = C.L;
    const smp = opts.sample || 1 / 120;
    const tMax = opts.tMax || 4.5;
    const pts = opts.noPts ? null : [{ t: 0, x, y, z, vx, vy, vz }];
    const ev = [];
    const cnt = { floor: 0, front: 0, side: 0, back: 0 };
    let nextS = smp, stopAt = Infinity;
    const until = opts.until || null;
    while (t < tMax && t < stopAt) {
      const sp = Math.hypot(vx, vy, vz);
      const mx = vx - en.k * sp * vx * dt * 0.5, my = vy - en.k * sp * vy * dt * 0.5, mz = vz + (-en.g - en.k * sp * vz) * dt * 0.5;
      const sm = Math.hypot(mx, my, mz);
      x += mx * dt; y += my * dt; z += mz * dt;
      vx += -en.k * sm * mx * dt; vy += -en.k * sm * my * dt; vz += (-en.g - en.k * sm * mz) * dt;
      t += dt;
      let type = null, vn = 0;
      if (y < r && vy < 0) { vn = -vy; const e = eImpact(en, vn); y = r + (r - y) * e; vy = vn * e; vx *= en.muWall; vz *= en.muWall; type = 'front'; }
      else if (y > L - r && vy > 0) { vn = vy; const e = eImpact(en, vn); y = L - r - (y - (L - r)) * e; vy = -vn * e; vx *= en.muWall; vz *= en.muWall; type = 'back'; }
      if (x < r && vx < 0) { vn = -vx; const e = eImpact(en, vn); x = r + (r - x) * e; vx = vn * e; vy *= en.muWall; vz *= en.muWall; type = type || 'left'; }
      else if (x > W - r && vx > 0) { vn = vx; const e = eImpact(en, vn); x = W - r - (x - (W - r)) * e; vx = -vn * e; vy *= en.muWall; vz *= en.muWall; type = type || 'right'; }
      if (z < r && vz < 0) { vn = -vz; const e = eImpact(en, vn); z = r + (r - z) * e; vz = vn * e; vx *= en.muFloor; vy *= en.muFloor; type = 'floor'; }
      if (type) {
        const e1 = { type, t, x, y, z, vn, speed: Math.hypot(vx, vy, vz) };
        ev.push(e1);
        if (type === 'floor') cnt.floor++; else if (type === 'front') cnt.front++; else if (type === 'back') cnt.back++; else cnt.side++;
        if (pts) pts.push({ t, x, y, z, vx, vy, vz, ev: type });
        if (until) {
          let stop = false;
          if (until.floor && cnt.floor >= until.floor) stop = true;
          if (until.front && cnt.front >= until.front) stop = true;
          if (until.firstFloor && type === 'floor') stop = true;
          if (stop) stopAt = t + (opts.extra || 0);
        }
      }
      if (pts && t >= nextS) { pts.push({ t, x, y, z, vx, vy, vz }); nextS += smp; }
      if (z < 0.025 && Math.abs(vz) < 0.15 && Math.hypot(vx, vy) < 0.4) break;
    }
    return { pts, ev, tEnd: t, cnt };
  }

  const dirVel = (az, el, v) => ({ vx: v * Math.cos(el) * Math.cos(az), vy: v * Math.cos(el) * Math.sin(az), vz: v * Math.sin(el) });

  /* Evalúa el objetivo de un tiro. goal.type:
       'front' → punto (x,z) del primer impacto en la pared frontal (antes de cualquier bote; si goal.side, tras esa lateral)
       'land'  → punto (x,y) del primer bote en el piso, habiendo tocado antes la pared frontal                     */
  function evalGoal(p0, az, el, v, goal, en) {
    const s = Object.assign({ x: p0.x, y: p0.y, z: p0.z }, dirVel(az, el, v));
    const res = simulate(s, en, { noPts: true, until: goal.type === 'front' ? { front: 1, firstFloor: true } : { firstFloor: true }, tMax: 3.5, dt: 1 / 400 });
    const ev = res.ev;
    if (goal.type === 'front') {
      const iF = ev.findIndex((e) => e.type === 'front');
      if (iF < 0) return null;
      if (ev.slice(0, iF).some((e) => e.type === 'floor')) return null;
      if (goal.side) {
        const walls = ev.slice(0, iF);
        if (!walls.length || walls[0].type !== goal.side) return null;
        if (walls[0].z > (goal.sideMaxZ || 2.0)) return null;          // un boast toca la lateral a media altura
      }
      return [ev[iF].x, ev[iF].z];
    }
    const iFl = ev.findIndex((e) => e.type === 'floor');
    if (iFl < 0) return null;
    if (!ev.slice(0, iFl).some((e) => e.type === 'front')) return null;
    if (ev.slice(0, iFl).some((e) => e.type === 'back')) return null;   // debe botar antes de llegar al vidrio
    if (goal.minZ || goal.maxZ) { const fr = ev.find((e) => e.type === 'front'); if (fr && (fr.z < (goal.minZ || 0) || fr.z > (goal.maxZ || 9))) return null; }
    return [ev[iFl].x, ev[iFl].y];
  }

  /* Resuelve dirección (azimut, elevación) por Newton con jacobiano numérico */
  function solve(p0, v, goal, en, guess) {
    let az = guess.az, el = guess.el, best = null;
    /* si la estimación no es válida, se busca una elevación válida alrededor (abajo y arriba) */
    if (!evalGoal(p0, az, el, v, goal, en)) {
      let found = false;
      for (let k = 1; k <= 20 && !found; k++) for (const sg of [-1, 1]) {
        const e2 = guess.el + sg * k * 0.03;
        if (evalGoal(p0, az, e2, v, goal, en)) { el = e2; found = true; break; }
      }
      if (!found) return null;
    }
    for (let it = 0; it < 18; it++) {
      const f0 = evalGoal(p0, az, el, v, goal, en);
      if (!f0) { el -= 0.02; continue; }
      const e0 = f0[0] - goal.a, e1 = f0[1] - goal.b, err = Math.hypot(e0, e1);
      if (!best || err < best.err) best = { az, el, err, f: f0 };
      if (err < 0.008) break;
      const h = 0.0015;
      const fa = evalGoal(p0, az + h, el, v, goal, en), fe = evalGoal(p0, az, el + h, v, goal, en);
      if (!fa || !fe) { el -= 0.01; continue; }
      const J00 = (fa[0] - f0[0]) / h, J01 = (fe[0] - f0[0]) / h, J10 = (fa[1] - f0[1]) / h, J11 = (fe[1] - f0[1]) / h;
      const det = J00 * J11 - J01 * J10;
      if (Math.abs(det) < 1e-9) break;
      let dAz = (J11 * e0 - J01 * e1) / det, dEl = (-J10 * e0 + J00 * e1) / det;
      const m = Math.max(Math.abs(dAz), Math.abs(dEl)) / 0.12;
      if (m > 1) { dAz /= m; dEl /= m; }
      az -= dAz; el -= dEl;
      el = U.clamp(el, -0.6, 1.35);
    }
    return best;
  }

  /* Estimación inicial apuntando a un punto (x,y,z) */
  function guessTo(p0, q, v, en) {
    const dx = q.x - p0.x, dy = q.y - p0.y, d = Math.hypot(dx, dy);
    const drop = (en.g * d * d) / (2 * v * v) * (1 + en.k * d * 1.4);
    return { az: Math.atan2(dy, dx), el: Math.atan2(q.z - p0.z + drop, d) };
  }

  return { env, eTemp, eImpact, simulate, solve, guessTo, dirVel, evalGoal };
})();
