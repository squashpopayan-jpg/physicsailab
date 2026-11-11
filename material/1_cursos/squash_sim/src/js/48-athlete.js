/* Atleta volumétrico: malla 3D generada sobre el esqueleto (secciones elípticas con relieve muscular).
   Cada cara conoce su región anatómica (músculo) y su material (piel, camiseta, pantalón…), de modo que
   la misma malla sirve para el jugador en la cancha, para pintar la activación muscular sobre el cuerpo
   y para el modelo anatómico giratorio. */
MS.Athlete = (function () {
  const { U } = MS;
  const S = U.a3, M = U.m3, D = U.d3, X = U.c3, N = U.n3, SUB = U.s3, TAU = Math.PI * 2;
  const Z = { x: 0, y: 0, z: 1 };

  function parseColor(c) {
    if (Array.isArray(c)) return c;
    if (!c) return [200, 200, 200];
    c = String(c).trim();
    if (c[0] === '#') { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    const m = c.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[, ]+/).map(Number); return [p[0], p[1], p[2]]; }
    return [200, 200, 200];
  }
  const HEAT = [[0, [226, 186, 170]], [0.3, [255, 214, 110]], [0.65, [242, 142, 56]], [1, [208, 52, 44]]];
  function heat(v, base) {
    v = U.clamp(v, 0, 1);
    if (v < 0.1 && base) return base;
    let i = 0; while (i < HEAT.length - 2 && v > HEAT[i + 1][0]) i++;
    const [a, ca] = HEAT[i], [b, cb] = HEAT[i + 1], f = (v - a) / (b - a);
    return [U.lerp(ca[0], cb[0], f), U.lerp(ca[1], cb[1], f), U.lerp(ca[2], cb[2], f)];
  }

  /* ---- regiones (músculo m + material k), cacheadas ---- */
  const RC = {};
  const R = (m, k, pt) => { const key = m + '|' + k + '|' + (pt || ''); return RC[key] || (RC[key] = { m: m || null, k, pt: pt || '' }); };
  const cr = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  function dense(spec, sub) {
    if (sub <= 1) return spec;
    const out = [], n = spec.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = spec[Math.max(0, i - 1)], p1 = spec[i], p2 = spec[i + 1], p3 = spec[Math.min(n - 1, i + 2)];
      for (let k = 0; k < sub; k++) { const u = k / sub; out.push(p1.map((_, c) => (c === 0 ? U.lerp(p1[0], p2[0], u) : Math.max(0.003, cr(p0[c], p1[c], p2[c], p3[c], u))))); }
    }
    out.push(spec[n - 1]);
    return out;
  }

  /* Añade a Q las caras de una superficie definida por anillos. rings[i] = {c, sd, fr, rs, rf, rb, t}.
     Con OPT.fine, las caras que cruzan un borde entre músculos se subdividen para que el contorno salga suave. */
  let OPT = { edges: false, fine: 0 };
  const L3 = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });
  function skin(Q, rings, nSeg, cls, ls, tag) {
    const nr = rings.length, pts = [];
    for (let i = 0; i < nr; i++) {
      const g = rings[i], row = [];
      for (let j = 0; j < nSeg; j++) {
        const th = (j / nSeg) * TAU, cs = Math.cos(th), sn = Math.sin(th), rr = sn >= 0 ? g.rf : g.rb;
        row.push({ x: g.c.x + g.sd.x * g.rs * cs + g.fr.x * rr * sn, y: g.c.y + g.sd.y * g.rs * cs + g.fr.y * rr * sn, z: g.c.z + g.sd.z * g.rs * cs + g.fr.z * rr * sn });
      }
      pts.push(row);
    }
    const reg = (t, th) => cls(t, Math.cos(th) * ls, Math.sin(th));
    const tMin = rings[0].t, tMax = rings[nr - 1].t, edges = OPT.edges, fine = OPT.fine;
    for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nSeg; j++) {
      const j1 = (j + 1) % nSeg, t0 = rings[i].t, t1 = rings[i + 1].t, th0 = (j / nSeg) * TAU, th1 = ((j + 1) / nSeg) * TAU;
      const p00 = pts[i][j], p01 = pts[i][j1], p11 = pts[i + 1][j1], p10 = pts[i + 1][j];
      let n = 1;
      if (fine > 1) {
        const e = 1e-4, a = reg(t0 + e, th0 + e), b2 = reg(t0 + e, th1 - e), c2 = reg(t1 - e, th1 - e), d2 = reg(t1 - e, th0 + e);
        if (a !== b2 || a !== c2 || a !== d2) n = fine;
      }
      const c0 = rings[i].c, c1 = rings[i + 1].c;
      for (let a = 0; a < n; a++) for (let b2 = 0; b2 < n; b2++) {
        const s0 = a / n, s1 = (a + 1) / n, r0 = b2 / n, r1 = (b2 + 1) / n;
        const q0 = n === 1 ? p00 : L3(L3(p00, p01, r0), L3(p10, p11, r0), s0), q1 = n === 1 ? p01 : L3(L3(p00, p01, r1), L3(p10, p11, r1), s0);
        const q2 = n === 1 ? p11 : L3(L3(p00, p01, r1), L3(p10, p11, r1), s1), q3 = n === 1 ? p10 : L3(L3(p00, p01, r0), L3(p10, p11, r0), s1);
        const c = { x: (q0.x + q1.x + q2.x + q3.x) / 4, y: (q0.y + q1.y + q2.y + q3.y) / 4, z: (q0.z + q1.z + q2.z + q3.z) / 4 };
        const ac = L3(c0, c1, (s0 + s1) / 2);
        let nn = X(SUB(q2, q0), SUB(q3, q1));
        const rad = SUB(c, ac);
        if (U.l3(nn) < 1e-10) nn = rad; else if (D(nn, rad) < 0) nn = M(nn, -1);
        nn = N(nn);
        const ta = U.lerp(t0, t1, s0), tb = U.lerp(t0, t1, s1), tm = (ta + tb) / 2, dt = tb - ta;
        const tha = U.lerp(th0, th1, r0), thb = U.lerp(th0, th1, r1), thm = (tha + thb) / 2, dth = thb - tha;
        const rg = reg(tm, thm);
        let e = 0;
        if (edges) {
          const df = (o, bit) => { if (o.m !== rg.m) e |= bit; else if (rg.m && o.pt !== rg.pt) e |= bit << 4; };
          if (tm - dt > tMin) df(reg(tm - dt, thm), 1);
          df(reg(tm, thm + dth), 2);
          if (tm + dt < tMax) df(reg(tm + dt, thm), 4);
          df(reg(tm, thm - dth), 8);
        }
        Q.push({ p: [q0, q1, q2, q3], n: nn, c, reg: rg, e, tag });
      }
    }
  }
  function tube(Q, A, B, front, spec, nSeg, cls, lat, tag) {
    const ax = SUB(B, A), L = U.l3(ax); if (L < 1e-5) return;
    const a = M(ax, 1 / L);
    let fr = SUB(front, M(a, D(front, a)));
    if (U.l3(fr) < 1e-4) { fr = X(a, Z); if (U.l3(fr) < 1e-4) fr = { x: 1, y: 0, z: 0 }; }
    fr = N(fr);
    const sd = N(X(a, fr));
    const ls = lat ? (D(sd, lat) >= 0 ? 1 : -1) : 1;
    skin(Q, spec.map((s) => ({ c: S(A, M(a, s[0] * L)), sd, fr, rs: s[1], rf: s[2], rb: s[3] == null ? s[2] : s[3], t: s[0] })), nSeg, cls, ls, tag);
  }
  function ball(Q, c, rs, rf, rz, axis, front, nSeg, nRing, cls, tag) {
    const spec = [];
    for (let i = 0; i <= nRing; i++) { const t = i / nRing, s = Math.max(0.03, Math.sin(Math.PI * t)), tt = (1 - Math.cos(Math.PI * t)) / 2; spec.push([tt, rs * s, rf * s, rf * s]); }
    tube(Q, S(c, M(axis, -rz)), S(c, M(axis, rz)), front, spec, nSeg, cls, null, tag);
  }

  /* ---- clasificación anatómica (u: + lateral o derecha, v: + anterior). pt = subdivisión dentro del músculo ---- */
  const DEG = 180 / Math.PI;
  const TORSO = [[-0.105, 0.03, 0.03, 0.03], [-0.075, 0.11, 0.07, 0.08], [-0.035, 0.158, 0.09, 0.108], [0, 0.17, 0.098, 0.118], [0.09, 0.158, 0.1, 0.108], [0.19, 0.134, 0.094, 0.088], [0.3, 0.15, 0.106, 0.1], [0.4, 0.172, 0.118, 0.112], [0.47, 0.182, 0.106, 0.108], [0.515, 0.17, 0.084, 0.094], [0.548, 0.105, 0.062, 0.074], [0.58, 0.054, 0.05, 0.056]];
  function clsTorso(h, u, v) {
    const phi = Math.atan2(Math.abs(u), v) * DEG, sd = u >= 0 ? 'd' : 'i';
    const kit = h < 0.115 ? 'shorts' : (phi > 78 && phi < 102 && h < 0.5 ? 'stripe' : 'shirt');
    if (h < 0.1) {
      if (phi > 100) return R(phi < 168 && h > 0.015 + 0.07 * ((phi - 100) / 68) ? 'gluteoMed' : 'gluteoMax', kit, sd);
      if (phi > 66) return R(h > -0.03 ? 'gluteoMed' : 'gluteoMax', kit, sd);
      return R(phi > 24 && h < 0.095 - (phi - 24) * 0.0012 ? 'psoas' : 'coreProf', kit, sd);
    }
    if (h < 0.345) {
      if (phi < 27) return R('abdomen', kit, sd + Math.floor((h - 0.1) / 0.066));
      if (phi < 112 || (h < 0.18 && phi < 138)) return R('oblicuos', kit, sd);
      return R(phi > 180 - (h < 0.21 ? 40 : 40 - (h - 0.21) * 130) ? 'lumbares' : 'dorsal', kit, sd);
    }
    if (h < 0.512) {
      if (phi < 80) {
        const low = 0.372 - 0.03 * Math.cos((phi / 80) * Math.PI * 1.15);
        if (h > low) return R('pectoral', kit, sd);
        return R(phi < 27 ? 'abdomen' : 'serrato', kit, phi < 27 ? sd + 3 : sd);
      }
      if (phi < 114) return R(h < 0.445 ? 'serrato' : 'dorsal', kit, sd);
      if (phi > 180 - (16 + (h - 0.345) * 250)) return R('trapecio', kit, sd);
      return R(h > 0.4 && phi > 120 ? 'manguito' : 'dorsal', kit, sd);
    }
    return R(phi < 62 ? null : 'trapecio', h > 0.552 ? 'skin' : kit, sd);
  }
  const THIGH = [[-0.14, 0.04, 0.04, 0.04], [-0.06, 0.07, 0.074, 0.08], [0.04, 0.084, 0.09, 0.096], [0.22, 0.09, 0.1, 0.092], [0.55, 0.075, 0.086, 0.074], [0.85, 0.055, 0.058, 0.052], [1, 0.05, 0.052, 0.048]];
  function clsThigh(t, u, v) {
    const kit = t < 0.44 ? 'shorts' : 'skin', a = Math.atan2(v, u) * DEG;
    if (a < -22 && a > -166) { if (t > 0.93) return R(null, kit); return R(t < 0.07 ? 'gluteoMax' : 'isquios', kit, a > -92 ? 'b' : 's'); }
    if ((a >= 126 || a <= -166) && t < 0.78 - Math.max(0, 150 - Math.abs(a)) * 0.012) return R('aductores', kit);
    if (t > 0.9 + (a > 105 ? 0.04 : 0) - 0.05 * Math.abs(Math.cos((a - 90) / DEG))) return R(null, kit);
    return R('cuadriceps', kit, a < 62 ? 'vl' : a > 112 ? 'vm' : 'rf');
  }
  const SHANK = [[0, 0.05, 0.05, 0.05], [0.24, 0.055, 0.048, 0.072], [0.5, 0.048, 0.042, 0.058], [0.8, 0.034, 0.034, 0.036], [1, 0.031, 0.033, 0.035]];
  function clsShank(t, u, v) {
    const kit = t > 0.84 ? 'sock' : 'skin', a = Math.atan2(v, u) * DEG;
    if (t < 0.06) return R(null, kit);
    if (a < -28 && a > -152) {
      const b = Math.abs(a + 90);
      if (t < 0.56 - 0.0016 * Math.abs(b - 30) * 2) return R('gastro', kit, a > -90 ? 'l' : 'm');
      if (t < 0.78) return R(b < 26 && t > 0.6 + b * 0.004 ? 'aquiles' : 'soleo', kit);
      return R(b < 34 && t < 0.97 ? 'aquiles' : null, kit);
    }
    if ((a <= -8 && a >= -28) || a <= -152 || a > 170) return R(t > 0.26 && t < 0.76 ? 'soleo' : null, kit);
    if (t > 0.86) return R(null, kit);
    if (a < 42) return R('peroneos', kit);
    if (a < 104) return R(t < 0.8 ? 'tibial' : null, kit);
    return R(null, kit);
  }
  const UPPER = [[0, 0.053, 0.055, 0.053], [0.3, 0.051, 0.052, 0.05], [0.6, 0.044, 0.052, 0.047], [1, 0.036, 0.036, 0.036]];
  function clsUpper(t, u, v) {
    const kit = t < 0.52 ? 'shirt' : 'skin';
    if (t < 0.2 + 0.24 * Math.max(0, u) * Math.max(0, u)) return R('deltoides', kit, v > 0.35 ? 'a' : v < -0.35 ? 'p' : 'm');
    if (t > 0.93) return R(null, kit);
    return R(v > 0 ? 'biceps' : 'triceps', kit, v > 0 ? '' : (u > 0 ? 'l' : 'm'));
  }
  const FORE = [[0, 0.038, 0.04, 0.038], [0.28, 0.043, 0.043, 0.041], [0.8, 0.029, 0.026, 0.026], [1, 0.026, 0.021, 0.021]];
  const clsFore = (t, u, v) => (t > 0.84 - 0.1 * Math.abs(u) ? R(null, 'skin') : R(v > 0 ? 'flexores' : 'extensores', 'skin'));
  const clsDelt = (t, u, v) => R('deltoides', 'shirt', v > 0.35 ? 'a' : v < -0.35 ? 'p' : 'm');
  const clsNone = () => R(null, 'skin');
  const clsNeck = (t, u, v) => R(v < -0.25 ? 'trapecio' : null, 'skin', u >= 0 ? 'd' : 'i');
  function clsHead(t, u, v) {
    const au = Math.abs(u);
    if (v > 0.45) { const e = ((t - 0.555) / 0.05) ** 2 + ((au - 0.4) / 0.24) ** 2; if (e < 1) return R('oculares', e < 0.16 ? 'eye' : 'skin', u > 0 ? 'd' : 'i'); }
    if (t > 0.76 || v < -0.32 || (t > 0.62 && v < 0.4)) return R(null, 'hair');
    return R(null, 'skin');
  }
  const SHOE = [[0, 0.03, 0.036, 0.022], [0.16, 0.043, 0.062, 0.03], [0.45, 0.048, 0.055, 0.03], [0.8, 0.049, 0.036, 0.028], [1, 0.03, 0.02, 0.02]];
  const clsShoe = (t, u, v) => R(null, v < -0.45 ? 'sole' : t > 0.36 && t < 0.56 && v < 0.75 ? 'shoeStripe' : 'shoe');
  const HAND = [[0, 0.024, 0.017, 0.017], [0.4, 0.042, 0.02, 0.02], [1, 0.02, 0.012, 0.012]];

  /* Construye la malla. sk: esqueleto con P, up, r, f (pelvis), ry, fy (hombros), neck, head, look, arms{I,D}, legs{I,D} */
  function build(sk, o = {}) {
    const lod = o.lod || 1, sub = lod >= 3 ? 6 : lod >= 2 ? 4 : lod >= 1.4 ? 2 : 1, sg = (n) => Math.max(6, Math.round(n * lod));
    const Q = [];
    OPT = { edges: !!o.edges, fine: o.edges && lod >= 2 ? 4 : 0 };
    /* tronco */
    const st = dense(TORSO, sub), rings = [];
    for (const s of st) {
      const h = s[0], wt = U.smooth((h - 0.04) / 0.42);
      const sd = N(U.lerp3(sk.r, sk.ry, wt));
      let fr = U.lerp3(sk.f, sk.fy, wt); fr = N(SUB(fr, M(sk.up, D(fr, sk.up))));
      rings.push({ c: S(sk.P, M(sk.up, h)), sd, fr, rs: s[1], rf: s[2], rb: s[3], t: h });
    }
    skin(Q, rings, sg(16), clsTorso, 1, 'torso');
    /* cuello y cabeza */
    const hax = N(S(M(Z, 0.75), M(sk.up, 0.25)));
    tube(Q, S(sk.neck, M(sk.up, -0.03)), sk.head, sk.fy, [[0, 0.05, 0.05, 0.052], [1, 0.046, 0.048, 0.05]], sg(8), clsNeck, null, 'neck');
    ball(Q, sk.head, 0.092, 0.106, 0.118, hax, sk.look || sk.fy, sg(13), Math.round(8 * Math.min(lod, 3)), clsHead, 'head');
    /* brazos */
    for (const side of ['I', 'D']) {
      const a = sk.arms[side], lat = side === 'D' ? sk.ry : M(sk.ry, -1);
      let bend = SUB(U.lerp3(a.sh, a.wr, 0.5), a.el);
      const fr = U.l3(bend) > 0.035 ? N(bend) : (a.front || sk.fy);
      ball(Q, a.sh, 0.054, 0.057, 0.05, N(SUB(a.el, a.sh)), fr, sg(9), Math.round(4 * Math.min(lod, 2.5)), clsDelt, 'arm');
      tube(Q, a.sh, a.el, fr, dense(UPPER, sub), sg(9), clsUpper, lat, 'arm');
      ball(Q, a.el, 0.037, 0.037, 0.037, Z, fr, sg(6), 4, clsNone, 'arm');
      tube(Q, a.el, a.wr, fr, dense(FORE, sub), sg(8), clsFore, lat, 'arm');
      const hd = N(SUB(a.wr, a.el));
      tube(Q, a.wr, S(a.wr, M(a.hd || hd, 0.095)), fr, dense(HAND, Math.min(sub, 3)), sg(6), clsNone, null, 'hand');
    }
    /* piernas */
    for (const side of ['I', 'D']) {
      const g = sk.legs[side], lat = side === 'D' ? sk.r : M(sk.r, -1);
      const ff = N({ x: g.toe.x - g.heel.x, y: g.toe.y - g.heel.y, z: 0 });
      const bend = SUB(g.knee, U.lerp3(g.hip, g.ankle, 0.5));
      const fr = U.l3(bend) > 0.03 ? N(bend) : ff;
      tube(Q, g.hip, g.knee, fr, dense(THIGH, sub), sg(11), clsThigh, lat, 'leg');
      ball(Q, S(g.knee, M(fr, 0.008)), 0.05, 0.052, 0.05, Z, fr, sg(7), 4, clsNone, 'leg');
      tube(Q, g.knee, g.ankle, fr, dense(SHANK, sub), sg(10), clsShank, lat, 'leg');
      const fa = N(SUB(g.toe, g.heel)), lift = { x: 0, y: 0, z: 0.014 };
      tube(Q, S(S(g.heel, M(fa, -0.025)), lift), S(S(g.toe, M(fa, 0.03)), lift), Z, dense(SHOE, Math.min(sub, 3)), sg(8), clsShoe, null, 'shoe');
    }
    return Q;
  }

  /* Pose anatómica de referencia (de pie, brazos algo separados, palmas al frente) mirando a −y */
  function anatSkeleton() {
    const P = { x: 0, y: 0, z: 0.955 }, r = { x: 1, y: 0, z: 0 }, f = { x: 0, y: -1, z: 0 }, up = Z;
    const sk = { P, r, f, ry: r, fy: f, up, neck: S(P, M(up, 0.56)), look: f, arms: {}, legs: {} };
    sk.head = S(sk.neck, { x: 0, y: -0.015, z: 0.125 });
    for (const side of ['I', 'D']) {
      const s = side === 'D' ? 1 : -1;
      const sh = { x: s * 0.2, y: 0, z: P.z + 0.515 }, el = { x: s * 0.265, y: 0.012, z: sh.z - 0.295 }, wr = { x: s * 0.325, y: -0.03, z: el.z - 0.262 };
      sk.arms[side] = { sh, el, wr, front: f, hd: N({ x: s * 0.18, y: -0.05, z: -1 }) };
      const hip = { x: s * 0.1, y: 0, z: P.z }, ankle = { x: s * 0.135, y: 0.01, z: 0.075 }, knee = { x: s * 0.118, y: -0.012, z: 0.52 };
      const ffv = N({ x: s * 0.2, y: -1, z: 0 });
      sk.legs[side] = { hip, knee, ankle, toe: { x: ankle.x + ffv.x * 0.17, y: ankle.y + ffv.y * 0.17, z: 0.02 }, heel: { x: ankle.x - ffv.x * 0.07, y: ankle.y - ffv.y * 0.07, z: 0.02 } };
    }
    return sk;
  }

  /* Materiales del uniforme */
  const SKINS = [[233, 196, 168], [214, 170, 136], [176, 128, 96]], HAIRS = [[44, 30, 22], [26, 22, 20], [92, 62, 36]];
  function kit(color, idx = 0) {
    const c = parseColor(color);
    return { skin: SKINS[idx % 3], hair: HAIRS[idx % 3], eye: [30, 24, 22], shirt: c, stripe: [c[0] * 0.55 + 115, c[1] * 0.55 + 115, c[2] * 0.55 + 115], shorts: [34, 42, 54], sock: [245, 245, 245], shoe: [248, 248, 250], shoeStripe: c, sole: [70, 74, 82] };
  }
  const TINT = {};
  const tint = (id) => { if (TINT[id] == null) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 97; TINT[id] = (h / 96) * 0.55; } return TINT[id]; };
  const ANAT = { musc: [226, 186, 170], none: [240, 226, 214], hair: [240, 226, 214], eye: [90, 70, 62], shoe: [240, 226, 214], sole: [205, 190, 178] };

  /* Proyecta y descarta caras ocultas. V: {proj(p)→{x,y,z}|null, facing(n,c)} */
  function visible(Q, V, out) {
    for (const q of Q) {
      if (!V.facing(q.n, q.c)) continue;
      const a = V.proj(q.p[0]), b = V.proj(q.p[1]), c = V.proj(q.p[2]), d = V.proj(q.p[3]);
      if (!a || !b || !c || !d) continue;
      out.push({ z: (a.z + b.z + c.z + d.z) / 4, q, a, b, c, d });
    }
    return out;
  }
  /* Pinta una cara. o: {kit} o bien {anat:{colors:{id:rgb}, base, none}, sel, line, selLine}; L = luz (unitaria) */
  function paint(ctx, e, o, L) {
    const q = e.q, reg = q.reg;
    let col;
    if (o.anat) {
      const A = o.anat;
      if (reg.m) { col = A.colors && A.colors[reg.m]; if (!col) { const k = tint(reg.m), d = A.deep || [196, 122, 108]; col = [U.lerp(A.base[0], d[0], k), U.lerp(A.base[1], d[1], k), U.lerp(A.base[2], d[2], k)]; } if (reg.k === 'eye') col = ANAT.eye; }
      else col = reg.k === 'eye' ? ANAT.eye : A.none;
    } else col = o.kit[reg.k] || o.kit.skin;
    const dl = D(q.n, L), sh = 0.5 + 0.5 * Math.pow(Math.max(0, dl), 0.8) + 0.07 * Math.max(0, q.n.z);
    const fill = `rgb(${Math.min(255, col[0] * sh) | 0},${Math.min(255, col[1] * sh) | 0},${Math.min(255, col[2] * sh) | 0})`;
    /* cada cara se dilata ~0,7 px desde su centro: tapa las uniones sin trazar el contorno (el trazo es lo caro) */
    const mx = (e.a.x + e.b.x + e.c.x + e.d.x) / 4, my = (e.a.y + e.b.y + e.c.y + e.d.y) / 4;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) { const p = i === 0 ? e.a : i === 1 ? e.b : i === 2 ? e.c : e.d; const dx = p.x - mx, dy = p.y - my, l = Math.sqrt(dx * dx + dy * dy) || 1, k = 1 + 0.75 / l; if (i) ctx.lineTo(mx + dx * k, my + dy * k); else ctx.moveTo(mx + dx * k, my + dy * k); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (o.anat && q.e) {
      const isSel = o.sel && reg.m === o.sel;
      const seg = (bits) => { ctx.beginPath();
        if (bits & 1) { ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); }
        if (bits & 2) { ctx.moveTo(e.b.x, e.b.y); ctx.lineTo(e.c.x, e.c.y); }
        if (bits & 4) { ctx.moveTo(e.c.x, e.c.y); ctx.lineTo(e.d.x, e.d.y); }
        if (bits & 8) { ctx.moveTo(e.d.x, e.d.y); ctx.lineTo(e.a.x, e.a.y); }
        ctx.stroke(); };
      if (q.e >> 4) { ctx.strokeStyle = o.line || 'rgba(110,60,45,.55)'; ctx.globalAlpha = 0.45; ctx.lineWidth = 0.7; seg(q.e >> 4); ctx.globalAlpha = 1; }
      if (q.e & 15) { ctx.strokeStyle = isSel ? o.selLine || '#0a3c66' : o.line || 'rgba(110,60,45,.55)'; ctx.lineWidth = isSel ? 1.7 : 1; seg(q.e & 15); }
    }
  }
  /* colores por músculo a partir de la activación */
  function actColors(act, base) {
    const out = {};
    if (act) for (const id in act) out[id] = heat(act[id].v, base || ANAT.musc);
    return out;
  }
  const inQuad = (e, x, y) => {
    const P = [e.a, e.b, e.c, e.d]; let s = 0;
    for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; const cr2 = (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x); if (Math.abs(cr2) < 1e-9) continue; if (s === 0) s = Math.sign(cr2); else if (Math.sign(cr2) !== s) return false; }
    return true;
  };
  /* malla del jugador en el instante t, compartida por las vistas del mismo cuadro */
  function forPlayer(pl, t, ball, lod, edges) {
    const c = pl._mesh;
    if (c && c.t === t && c.lod >= lod && c.edges === edges && c.tec === pl.tecnica) return c;
    const sk = MS.Player.skeleton(pl, t, ball);
    return (pl._mesh = { t, lod, edges, tec: pl.tecnica, sk, Q: build(sk, { lod, edges }) });
  }
  return { forPlayer, build, anatSkeleton, visible, paint, kit, ANAT, heat, actColors, parseColor, inQuad };
})();
