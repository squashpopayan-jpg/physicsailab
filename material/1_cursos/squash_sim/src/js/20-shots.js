/* Catálogo de golpes y planificación de cada tiro con el motor físico.
   El lado (izquierda/derecha) sale del punto de impacto: una «paralela» siempre va pegada a la pared
   lateral más cercana; una «cruzada» cruza al lado contrario; un «boast» toca primero la lateral cercana. */
MS.Shots = (function () {
  const { C, U, Ball } = MS;
  const sideOf = (c) => (c.x < C.half ? 'I' : 'D');
  const near = (c, d) => (sideOf(c) === 'I' ? d : C.W - d);      // x a distancia d de la pared cercana
  const far = (c, d) => (sideOf(c) === 'I' ? C.W - d : d);        // x a distancia d de la pared opuesta

  const CAT = {
    drive: { nombre: 'Drive (paralela)', grupo: 'Golpes de fondo', obj: 'land', v: 24, zt: 1.7, land: (c) => ({ x: near(c, 0.45), y: 7.2 }), desc: 'Golpe recto y profundo pegado a la pared lateral; bota detrás del cuadro de saque y muere en la esquina.' },
    cruzada: { nombre: 'Cruzada', grupo: 'Golpes de fondo', obj: 'land', v: 25, zt: 1.6, land: (c) => ({ x: far(c, 0.85), y: 7.1 }), desc: 'Drive cruzado: pasa lejos del rival y busca la esquina trasera contraria.' },
    globo: { nombre: 'Globo (paralelo)', grupo: 'Globos', obj: 'lob', v: 15, apex: 4.9, land: (c) => ({ x: near(c, 0.7), y: 8.85 }), desc: 'Golpe alto y lento para ganar tiempo y recuperar la T; bota cerca del vidrio.' },
    globoC: { nombre: 'Globo cruzado', grupo: 'Globos', obj: 'lob', v: 15.5, apex: 4.9, land: (c) => ({ x: far(c, 0.75), y: 8.7 }), desc: 'Globo hacia la esquina trasera contraria; ideal desde el frente bajo presión.' },
    drop: { nombre: 'Drop (dejada)', grupo: 'Golpes cortos', obj: 'front', v: (c) => 5.6 + 0.82 * c.y, front: (c) => ({ x: near(c, 0.75), z: 0.62 }), desc: 'Golpe suave apenas por encima del tin; obliga al rival a correr al frente.' },
    dropC: { nombre: 'Drop cruzado', grupo: 'Golpes cortos', obj: 'front', v: (c) => 6.4 + 0.85 * c.y, front: (c) => ({ x: far(c, 1.55), z: 0.66 }), desc: 'Dejada hacia la esquina delantera contraria.' },
    kill: { nombre: 'Kill (remate bajo)', grupo: 'Golpes cortos', obj: 'front', v: 30, front: (c) => ({ x: near(c, 0.95), z: 0.6 }), desc: 'Golpe fuerte y bajo que bota dos veces antes de la línea de saque.' },
    boast: { nombre: 'Boast (dos paredes)', grupo: 'Boasts', obj: 'front', side: true, v: 18.5, front: (c) => ({ x: far(c, 2.05), z: 0.95 }), desc: 'Toca primero la pared lateral cercana y luego la frontal; termina en la esquina delantera contraria.' },
    boastAlto: { nombre: 'Boast alto (de toque)', grupo: 'Boasts', obj: 'front', side: true, v: 13.5, front: (c) => ({ x: far(c, 2.3), z: 2.0 }), desc: 'Boast suave y alto: la bola flota y da tiempo; útil para alimentar ejercicios.' },
    boast3: { nombre: 'Boast de tres paredes', grupo: 'Boasts', obj: 'front', side: true, v: 26, front: (c) => ({ x: far(c, 1.0), z: 1.5 }), desc: 'Lateral, frontal y lateral contraria: la bola cae corta y lejos del rival.' },
    voleaDrive: { nombre: 'Volea paralela', grupo: 'Voleas', obj: 'land', v: (c) => 17 + 0.9 * c.y, zt: 1.6, volea: true, land: (c) => ({ x: near(c, 0.45), y: 7.2 }), desc: 'Interceptar antes del bote y devolver recto al fondo: quita tiempo al rival.' },
    voleaC: { nombre: 'Volea cruzada', grupo: 'Voleas', obj: 'land', v: (c) => 18 + 0.9 * c.y, zt: 1.5, volea: true, land: (c) => ({ x: far(c, 0.9), y: 7.0 }), desc: 'Volea que cruza la cancha hacia la esquina trasera contraria.' },
    voleaDrop: { nombre: 'Volea drop', grupo: 'Voleas', obj: 'front', volea: true, v: (c) => 4.8 + 0.72 * c.y, front: (c) => ({ x: near(c, 0.8), z: 0.6 }), desc: 'Volea suave al frente; muy agresiva si el rival está atrás.' },
    voleaMedia: { nombre: 'Volea media (peloteo)', grupo: 'Voleas', obj: 'lob', v: 12, apex: 2.9, el0: 30, volea: true, land: (c) => ({ x: near(c, 0.75), y: 7.6 }), desc: 'Volea controlada de peloteo para mantener la bola en el aire.' },
    saque: { nombre: 'Saque (globo)', grupo: 'Saque', obj: 'lob', v: 15, apex: 3.9, el0: 35, saque: true, land: (c) => ({ x: far(c, 1.1), y: 8.3 }), desc: 'Saque alto desde el cuadro: pega en la frontal sobre la línea de saque y busca la lateral del cuarto contrario.' },
  };
  const ORDER = ['drive', 'cruzada', 'globo', 'globoC', 'drop', 'dropC', 'kill', 'boast', 'boastAlto', 'boast3', 'voleaDrive', 'voleaC', 'voleaDrop', 'voleaMedia', 'saque'];
  const isVolley = (k) => !!(CAT[k] && CAT[k].volea);

  /* Planifica un tiro desde el punto de impacto c = {x,y,z}. opts: {zona, ritmo, env} */
  function plan(c, key, opts = {}) {
    const def = CAT[key];
    const en = opts.env || Ball.env();
    const ritmo = opts.ritmo || 1;
    const warnings = [];
    if (!def) return { ok: false, warnings: ['Golpe desconocido: ' + key] };
    let v = (typeof def.v === 'function' ? def.v(c) : def.v) * (def.obj === 'land' || key === 'kill' || key.startsWith('boast') ? ritmo : 1);
    if (opts.forceFront) {
      /* golpe forzado a un punto de la frontal (p. ej., un error al tin en el partido simulado) */
      const g = { type: 'front', a: opts.forceFront.x, b: opts.forceFront.z };
      const s = Ball.solve(c, opts.forceFront.v || 14, g, en, Ball.guessTo(c, { x: g.a, y: 0, z: g.b }, opts.forceFront.v || 14, en));
      if (!s) return { ok: false, warnings: ['Error no simulable.'] };
      return finish(c, key, def, opts.forceFront.v || 14, Ball.dirVel(s.az, s.el, opts.forceFront.v || 14), en, warnings, s.err);
    }
    if (def.obj === 'lob') return planLob(c, key, def, opts, en, warnings);
    let goal, guess;
    if (def.obj === 'land') {
      let L = def.land(c);
      if (opts.zona && C.zones[opts.zona]) L = { x: C.zones[opts.zona].x, y: C.zones[opts.zona].y };
      /* punto de la pared frontal por reflexión especular aproximada */
      const xt = c.x + ((L.x - c.x) * c.y) / (c.y + L.y);
      goal = { type: 'land', a: L.x, b: L.y, minZ: C.tin + 0.08, maxZ: C.outFront - 0.3 };
      guess = Ball.guessTo(c, { x: xt, y: 0, z: def.zt }, v, en);
    } else {
      let F = def.front(c);
      if (opts.zona && C.zones[opts.zona]) F = { x: opts.zona.endsWith('I') ? 0.8 : C.W - 0.8, z: F.z };
      goal = { type: 'front', a: F.x, b: F.z };
      if (def.side) {
        const sw = sideOf(c) === 'I' ? 'left' : 'right';
        goal.side = sw;
        const wx = sw === 'left' ? 0 : C.W;
        const dw = Math.abs(c.x - wx);
        const yw = Math.max(1.2, c.y - Math.max(0.6, dw) * 1.1);
        goal.sideMaxZ = key === 'boast3' ? 2.2 : 1.8;
        guess = Ball.guessTo(c, { x: wx, y: yw, z: Math.min(1.4, c.z + 0.35 + 0.15 * dw) }, v, en);
      } else guess = Ball.guessTo(c, { x: F.x, y: 0, z: F.z }, v, en);
    }
    let sol = Ball.solve(c, v, goal, en, guess);
    /* Si no converge, se prueba con otra velocidad (golpe más firme o más suave) */
    if (!sol || sol.err > 0.12) {
      for (const f of [1.12, 0.9, 1.25]) {
        const s2 = Ball.solve(c, v * f, goal, en, guess);
        if (s2 && (!sol || s2.err < sol.err)) { sol = s2; v = v * f; }
        if (sol && sol.err < 0.12) break;
      }
    }
    if ((!sol || sol.err > 0.3) && def.obj === 'land') {
      /* desde una bola baja y cerca de la frontal no cabe una paralela tensa: se levanta (paralela alta) */
      const alt = Object.assign({}, def, { obj: 'lob', apex: def.volea ? 2.6 : 3.2, v: 15, el0: 30 });
      const r2 = planLob(c, key, alt, opts, en, []);
      if (r2.ok && (!sol || r2.err < sol.err)) { r2.warnings.unshift('Golpe levantado: desde esa bola no cabe una trayectoria tensa.'); r2.def = def; return r2; }
    }
    if (!sol) return { ok: false, warnings: ['No se encontró una trayectoria posible desde este punto.'] };
    return finish(c, key, def, v, Ball.dirVel(sol.az, sol.el, v), en, warnings, sol.err);
  }

  /* Globo: se fijan la altura máxima de la parábola (def.apex) y el bote (L); incógnitas: velocidad y elevación.
     El azimut se corrige para que el bote caiga en la x deseada. */
  function planLob(c, key, def, opts, en, warnings) {
    let L = def.land(c);
    if (opts.zona && C.zones[opts.zona]) L = { x: C.zones[opts.zona].x, y: Math.max(7.6, C.zones[opts.zona].y) };
    let xt = c.x + ((L.x - c.x) * c.y) / (c.y + L.y);
    const azOf = () => Math.atan2(-c.y, xt - c.x);
    const run = (vv, ee) => {
      const r = Ball.simulate(Object.assign({ x: c.x, y: c.y, z: c.z }, Ball.dirVel(azOf(), ee, vv)), en, { until: { firstFloor: true }, tMax: 5, dt: 1 / 400, sample: 1 / 50 });
      const fr = r.ev.find((e) => e.type === 'front'), fl = r.ev.find((e) => e.type === 'floor');
      if (!fr || !fl || fl.t < fr.t) return null;
      let zA = fr.z;
      for (const p of r.pts) if (p.t > fr.t && p.z > zA) zA = p.z;
      return { y: fl.y, x: fl.x, zA, fz: fr.z };
    };
    let vv = def.v, ee = U.rad(def.el0 || 50), best = null;
    for (let it = 0; it < 16; it++) {
      const r0 = run(vv, ee);
      if (!r0) { ee += 0.06; continue; }
      const e0 = r0.y - L.y, e1 = r0.zA - def.apex, err = Math.hypot(e0, e1, (r0.x - L.x) * 0.5);
      if (!best || err < best.err) best = { vv, ee, err, az: azOf() };
      if (err < 0.05) break;
      const hv = 0.05, he = 0.004;
      const ra = run(vv + hv, ee), rb = run(vv, ee + he);
      if (!ra || !rb) { vv *= 0.97; continue; }
      const J00 = (ra.y - r0.y) / hv, J01 = (rb.y - r0.y) / he, J10 = (ra.zA - r0.zA) / hv, J11 = (rb.zA - r0.zA) / he;
      const det = J00 * J11 - J01 * J10;
      if (Math.abs(det) < 1e-9) break;
      let dv = (J11 * e0 - J01 * e1) / det, de = (-J10 * e0 + J00 * e1) / det;
      const m = Math.max(Math.abs(dv) / 3, Math.abs(de) / 0.15);
      if (m > 1) { dv /= m; de /= m; }
      vv = U.clamp(vv - dv, 6, 34); ee = U.clamp(ee - de, 0.1, 1.45);
      xt += ((L.x - r0.x) * c.y) / (c.y + L.y) * 0.8;
    }
    if (!best) return { ok: false, warnings: ['No se encontró una trayectoria de globo posible.'] };
    return finish(c, key, def, best.vv, Ball.dirVel(best.az, best.ee, best.vv), en, warnings, best.err > 0.3 ? best.err : 0.0);
  }

  /* Trayectoria completa y validación reglamentaria */
  function finish(c, key, def, v, v0, en, warnings, err) {
    if (err > 0.25) warnings.push('Trayectoria aproximada (error ' + U.num(err * 100, 0) + ' cm).');
    const s0 = Object.assign({ x: c.x, y: c.y, z: c.z }, v0);
    const traj = Ball.simulate(s0, en, { until: { floor: 2 }, extra: 0.18, tMax: 5.5 });
    const fr = traj.ev.find((e) => e.type === 'front');
    if (fr) {
      if (fr.z < C.tin) warnings.push('Golpea el tin (' + U.num(fr.z, 2) + ' m).');
      if (fr.z > C.outFront) warnings.push('Sale por encima de la línea frontal.');
      if (def.saque && fr.z < C.svc) warnings.push('Saque bajo la línea de saque (falta).');
    }
    for (const e of traj.ev) {
      if ((e.type === 'left' || e.type === 'right') && e.z > C.sideOut(e.y)) { warnings.push('Toca la lateral por encima de la línea de fuera.'); break; }
      if (e.type === 'back' && e.z > C.outBack) { warnings.push('Toca el vidrio por encima de la línea de fuera.'); break; }
    }
    let zMax = 0; for (const p of traj.pts) if (p.z > zMax) zMax = p.z;
    return { ok: true, key, def, v, v0, traj, front: fr || null, warnings, err, zMax };
  }

  /* Puntos donde el siguiente jugador puede golpear la bola.
     cls: 'volea' (B4), 'sobrepique' (B5), 'maximo' (B6), 'bajo' (B7) — clasificación del manual de fundamentos */
  function candidates(traj, mode) {
    const P = traj.pts;
    const iFront = P.findIndex((p) => p.ev === 'front');
    if (iFront < 0) return [];
    let iF1 = -1, iF2 = -1;
    for (let i = iFront + 1; i < P.length; i++) if (P[i].ev === 'floor') { if (iF1 < 0) iF1 = i; else { iF2 = i; break; } }
    if (iF2 < 0) iF2 = P.length - 1;
    const ok = (p) => p.x > 0.14 && p.x < C.W - 0.14 && p.y > 0.3 && p.y < C.L - 0.14;
    const vol = [], after = [];
    if (iF1 > 0) {
      for (let i = iFront + 3; i < iF1; i += 2) {
        const p = P[i];
        if (ok(p) && p.z > 0.55 && p.z < 1.8 && p.y > 2.2 && !P.slice(Math.max(0, i - 1), i + 1).some((q) => q.ev && q.ev !== 'front')) vol.push(Object.assign({ i, cls: 'volea' }, p));
      }
      /* después del primer bote */
      let apexI = -1, apexZ = -1;
      for (let i = iF1 + 1; i < iF2; i++) if (P[i].z > apexZ && ok(P[i])) { apexZ = P[i].z; apexI = i; }
      for (let i = iF1 + 1; i < iF2; i++) {
        const p = P[i];
        if (!ok(p) || p.z < 0.1) continue;
        let cls;
        if (i < apexI) cls = p.z < 0.38 ? 'sobrepique' : (apexZ - p.z < 0.12 ? 'maximo' : 'sube');
        else cls = apexZ - p.z < 0.12 ? 'maximo' : 'bajo';
        if (cls === 'sube') continue;
        if (p.z > 1.55) continue;
        after.push(Object.assign({ i, cls }, p));
      }
    }
    const byCls = (arr, c) => arr.filter((p) => p.cls === c);
    const desc = after.filter((p) => p.cls === 'bajo');
    const max = byCls(after, 'maximo');
    const sp = byCls(after, 'sobrepique');
    let list;
    if (mode === 'volea') list = vol.concat(max, desc, sp);
    else if (mode === 'sobrepique') list = sp.concat(max, desc);
    else if (mode === 'bajo') list = desc.filter((p) => p.z < 0.65).concat(max, desc);
    else list = (max.length ? max : sp).concat(desc);
    if (!list.length && after.length) list = after.slice();
    if (!list.length && iF2 > 0) list = [Object.assign({ i: iF2 - 1, cls: 'bajo' }, P[iF2 - 1])];
    return list;
  }

  const CLS = {
    volea: { nombre: 'Volea', cod: 'B4', desc: 'Impacto antes del bote: la opción más agresiva, quita tiempo al rival.' },
    sobrepique: { nombre: 'Sobre pique', cod: 'B5', desc: 'Apenas sube del piso: recurso para dejadas rápidas.' },
    maximo: { nombre: 'Punto máximo del pique', cod: 'B6', desc: 'En la cresta del bote: la altura ideal, «velocidad crucero».' },
    bajo: { nombre: 'Por debajo del máximo', cod: 'B7', desc: 'La bola invadió nuestro espacio: golpe defensivo.' },
    fantasma: { nombre: 'Golpe fantasma', cod: '—', desc: 'Sin bola: ghosting.' },
    saque: { nombre: 'Saque', cod: '—', desc: 'Bola nueva desde el cuadro de saque.' },
    alimentacion: { nombre: 'Alimentación', cod: '—', desc: 'Primera bola de la rutina, lanzada a mano o por el entrenador.' },
  };

  return { CAT, ORDER, CLS, plan, candidates, sideOf, isVolley };
})();
