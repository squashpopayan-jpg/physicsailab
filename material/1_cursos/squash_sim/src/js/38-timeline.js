/* Consultas sobre una línea de tiempo compilada. */
MS.TL = (function () {
  const { U, Player } = MS;
  /* golpe con bola vigente en t (el último golpe iniciado) */
  function shotAt(tl, t) {
    let cur = null;
    for (const s of tl.shots) { if (s.t0 <= t + 1e-6) cur = s; else break; }
    return cur;
  }
  function shotIndexAt(tl, t) { let i = -1; for (let k = 0; k < tl.shots.length; k++) { if (tl.shots[k].t0 <= t + 1e-6) i = k; else break; } return i; }
  function trajAt(traj, tau) {
    const P = traj.pts;
    if (tau <= 0) return P[0];
    if (tau >= P[P.length - 1].t) return P[P.length - 1];
    let lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].t <= tau) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], f = (tau - a.t) / Math.max(1e-6, b.t - a.t);
    return { t: tau, x: U.lerp(a.x, b.x, f), y: U.lerp(a.y, b.y, f), z: U.lerp(a.z, b.z, f) };
  }
  /* posición de la bola en t; null si no hay bola (ghosting o antes del primer saque) */
  function ballAt(tl, t) {
    const i = shotIndexAt(tl, t);
    if (i < 0) {
      const s0 = tl.shots[0];
      if (s0 && s0.res && s0.res.ok) return { x: s0.contact.x, y: s0.contact.y, z: s0.contact.z, shot: s0, idx: 0, tau: 0, waiting: true };
      return null;
    }
    const s = tl.shots[i];
    if (!s.res || !s.res.ok) return null;
    const tau = t - s.t0;
    if (tau > s.res.traj.tEnd + 0.6) return null;
    const p = trajAt(s.res.traj, tau);
    return { x: p.x, y: p.y, z: p.z, shot: s, idx: i, tau };
  }
  /* mapa de ocupación (s por celda de 0,25 m) */
  function heat(tl, pl, cell = 0.25) {
    const nx = Math.ceil(MS.C.W / cell), ny = Math.ceil(MS.C.L / cell);
    const g = new Float32Array(nx * ny);
    const dt = 0.05; let mx = 0;
    for (let t = 0; t < tl.duration; t += dt) {
      const k = Player.keyAt(pl, t);
      const i = Math.min(nx - 1, Math.max(0, Math.floor(k.x / cell))), j = Math.min(ny - 1, Math.max(0, Math.floor(k.y / cell)));
      g[j * nx + i] += dt; if (g[j * nx + i] > mx) mx = g[j * nx + i];
    }
    return { g, nx, ny, cell, mx };
  }
  /* evento de golpe más cercano (para la etiqueta del HUD) */
  function label(tl, t) {
    const s = shotAt(tl, t);
    if (!s) return null;
    const pl = tl.players.find((p) => p.id === s.j);
    const def = MS.Shots.CAT[s.golpe];
    const cls = MS.Shots.CLS[s.cls] || null;
    return { n: tl.shots.indexOf(s) + 1, pl, nombre: def ? def.nombre : 'Golpe fantasma', cls, s };
  }
  return { shotAt, shotIndexAt, trajAt, ballAt, heat, label };
})();
