/* Vista 3D tipo transmisión de TV, con cámara orbital y recorte en el plano cercano. */
MS.TV = (function () {
  const { C, U, Player, TL } = MS;
  const TARGET = { x: 3.2, y: 4.7, z: 0.8 };
  const PRESETS = {
    tv: { az: 0, el: 0.33, dist: 7.6, fov: 52, nombre: 'TV' },
    lateral: { az: -Math.PI / 2, el: 0.22, dist: 7.4, fov: 56, nombre: 'Lateral' },
    aerea: { az: 0.0, el: 1.05, dist: 11.5, fov: 50, nombre: 'Aérea' },
    frontal: { az: Math.PI, el: 0.26, dist: 8.2, fov: 52, nombre: 'Frontal' },
  };
  function camera(cam, w, h) {
    const ce = Math.cos(cam.el), tg = cam.target || TARGET;
    const eye = { x: tg.x + cam.dist * Math.sin(cam.az) * ce, y: tg.y + cam.dist * Math.cos(cam.az) * ce, z: tg.z + cam.dist * Math.sin(cam.el) };
    const fw = U.n3(U.s3(tg, eye));
    let right = U.c3({ x: 0, y: 0, z: 1 }, fw);
    right = U.l3(right) < 1e-6 ? { x: 1, y: 0, z: 0 } : U.n3(right);
    const up = U.c3(fw, right);
    const f = (h / 2) / Math.tan(U.rad(cam.fov) / 2);
    return { eye, fw, right, up, f, cx: w / 2, cy: h / 2, w, h };
  }
  const NEAR = 0.08;
  function toCam(K, p) { const d = U.s3(p, K.eye); return { x: U.d3(d, K.right), y: U.d3(d, K.up), z: U.d3(d, K.fw) }; }
  function scr(K, c) { return { x: K.cx + (K.f * c.x) / c.z, y: K.cy - (K.f * c.y) / c.z, z: c.z }; }
  function proj(K, p) { const c = toCam(K, p); if (c.z < NEAR) return null; return scr(K, c); }
  function clipPoly(K, pts) {
    let cs = pts.map((p) => toCam(K, p));
    const out = [];
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i], b = cs[(i + 1) % cs.length];
      const ain = a.z >= NEAR, bin = b.z >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) { const t = (NEAR - a.z) / (b.z - a.z); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR }); }
    }
    return out.map((c) => scr(K, c));
  }
  function poly(ctx, K, pts, fill, stroke, lw) {
    const P = clipPoly(K, pts);
    if (P.length < 3) return;
    ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function line3(ctx, K, a, b, col, lw) {
    let ca = toCam(K, a), cb = toCam(K, b);
    if (ca.z < NEAR && cb.z < NEAR) return;
    if (ca.z < NEAR) { const t = (NEAR - ca.z) / (cb.z - ca.z); ca = { x: ca.x + (cb.x - ca.x) * t, y: ca.y + (cb.y - ca.y) * t, z: NEAR }; }
    if (cb.z < NEAR) { const t = (NEAR - cb.z) / (ca.z - cb.z); cb = { x: cb.x + (ca.x - cb.x) * t, y: cb.y + (ca.y - cb.y) * t, z: NEAR }; }
    const A = scr(K, ca), B = scr(K, cb);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }
  /* banda (línea con ancho físico) sobre un plano */
  function band(ctx, K, a, b, n, wdt, col) {
    const h = U.m3(n, wdt / 2);
    poly(ctx, K, [U.a3(a, h), U.a3(b, h), U.s3(b, h), U.s3(a, h)], col);
  }

  const HEAT = [[0, [236, 211, 198]], [0.35, [255, 209, 102]], [0.7, [240, 140, 58]], [1, [212, 61, 47]]];
  function heatCol(v, base) {
    v = U.clamp(v, 0, 1);
    if (v < 0.12 && base) return base;
    let i = 0; while (i < HEAT.length - 2 && v > HEAT[i + 1][0]) i++;
    const [a, ca] = HEAT[i], [b, cb] = HEAT[i + 1], f = (v - a) / (b - a);
    return `rgb(${Math.round(U.lerp(ca[0], cb[0], f))},${Math.round(U.lerp(ca[1], cb[1], f))},${Math.round(U.lerp(ca[2], cb[2], f))})`;
  }

  let logoImg = null;
  function setLogo(img) { logoImg = img; }

  function court(ctx, K) {
    const W = C.W, L = C.L, e = K.eye;
    const sky = ctx.createLinearGradient(0, 0, 0, K.h);
    sky.addColorStop(0, '#2c3846'); sky.addColorStop(1, '#4a5868');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, K.w, K.h);
    const topF = 5.0, topB = 2.7;
    const leftOpaque = e.x > 0, rightOpaque = e.x < W, frontOpaque = e.y > 0;
    /* piso */
    if (e.z > 0) {
      poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: L, z: 0 }, { x: 0, y: L, z: 0 }], '#ddb47c');
      ctx.globalAlpha = 0.18;
      for (let x = 0.3; x < W; x += 0.3) line3(ctx, K, { x, y: 0, z: 0 }, { x, y: L, z: 0 }, '#8a5a24', 0.8);
      ctx.globalAlpha = 1;
    }
    /* paredes */
    if (frontOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: 0, z: topF }, { x: 0, y: 0, z: topF }], '#f1f3f5');
    if (leftOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: 0, y: L, z: 0 }, { x: 0, y: L, z: topB }, { x: 0, y: 0, z: topF }], '#e4e8ec');
    if (rightOpaque) poly(ctx, K, [{ x: W, y: 0, z: 0 }, { x: W, y: L, z: 0 }, { x: W, y: L, z: topB }, { x: W, y: 0, z: topF }], '#dfe4e9');
    /* tin */
    if (frontOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: 0, z: C.tin }, { x: 0, y: 0, z: C.tin }], '#d9dfe5');
    /* logo impreso en la frontal (entre la línea de saque y la de fuera) */
    if (frontOpaque && logoImg && logoImg.complete && logoImg.naturalWidth) {
      const zb = 2.32, zt = 3.5, wl = (zt - zb) * (logoImg.naturalWidth / logoImg.naturalHeight), x0 = C.half - wl / 2;
      const P0 = proj(K, { x: x0, y: 0.001, z: zt }), P1 = proj(K, { x: x0 + wl, y: 0.001, z: zt }), P2 = proj(K, { x: x0, y: 0.001, z: zb });
      if (P0 && P1 && P2) {
        ctx.save(); ctx.globalAlpha = 0.9;
        const iw = logoImg.naturalWidth, ih = logoImg.naturalHeight;
        ctx.transform((P1.x - P0.x) / iw, (P1.y - P0.y) / iw, (P2.x - P0.x) / ih, (P2.y - P0.y) / ih, P0.x, P0.y);
        ctx.drawImage(logoImg, 0, 0);
        ctx.restore();
      }
    }
    /* líneas rojas */
    const red = '#c41f2e', nF = { x: 0, y: 0, z: 1 }, lw = 0.05;
    band(ctx, K, { x: 0, y: 0.002, z: C.tin - 0.025 }, { x: W, y: 0.002, z: C.tin - 0.025 }, nF, lw, red);
    band(ctx, K, { x: 0, y: 0.002, z: C.svc - 0.025 }, { x: W, y: 0.002, z: C.svc - 0.025 }, nF, lw, red);
    band(ctx, K, { x: 0, y: 0.002, z: C.outFront + 0.025 }, { x: W, y: 0.002, z: C.outFront + 0.025 }, nF, lw, red);
    if (leftOpaque) band(ctx, K, { x: 0.002, y: 0, z: C.outFront + 0.025 }, { x: 0.002, y: L, z: C.outBack + 0.025 }, nF, lw, red);
    if (rightOpaque) band(ctx, K, { x: W - 0.002, y: 0, z: C.outFront + 0.025 }, { x: W - 0.002, y: L, z: C.outBack + 0.025 }, nF, lw, red);
    const nX = { x: 1, y: 0, z: 0 }, nY = { x: 0, y: 1, z: 0 };
    if (e.z > 0) {
      band(ctx, K, { x: 0, y: C.T.y, z: 0.002 }, { x: W, y: C.T.y, z: 0.002 }, nY, lw, red);
      band(ctx, K, { x: C.half, y: C.shortRear, z: 0.002 }, { x: C.half, y: L, z: 0.002 }, nX, lw, red);
      const bY = C.shortRear + C.box + 0.025;
      band(ctx, K, { x: 0, y: bY, z: 0.002 }, { x: C.box + 0.05, y: bY, z: 0.002 }, nY, lw, red);
      band(ctx, K, { x: W - C.box - 0.05, y: bY, z: 0.002 }, { x: W, y: bY, z: 0.002 }, nY, lw, red);
      band(ctx, K, { x: C.box + 0.025, y: C.shortRear, z: 0.002 }, { x: C.box + 0.025, y: bY, z: 0.002 }, nX, lw, red);
      band(ctx, K, { x: W - C.box - 0.025, y: C.shortRear, z: 0.002 }, { x: W - C.box - 0.025, y: bY, z: 0.002 }, nX, lw, red);
    }
  }
  function glass(ctx, K) {
    const W = C.W, L = C.L, e = K.eye, topF = 5.0, topB = 2.7;
    ctx.save(); ctx.globalAlpha = 0.5;
    const edge = 'rgba(160,210,240,.9)';
    if (e.x <= 0) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: 0, y: L, z: 0 }, { x: 0, y: L, z: topB }, { x: 0, y: 0, z: topF }], 'rgba(170,215,245,.10)', edge, 1.2);
    if (e.x >= W) poly(ctx, K, [{ x: W, y: 0, z: 0 }, { x: W, y: L, z: 0 }, { x: W, y: L, z: topB }, { x: W, y: 0, z: topF }], 'rgba(170,215,245,.10)', edge, 1.2);
    if (e.y <= 0) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: 0, z: topF }, { x: 0, y: 0, z: topF }], 'rgba(170,215,245,.10)', edge, 1.2);
    /* vidrio trasero */
    poly(ctx, K, [{ x: 0, y: L, z: 0 }, { x: W, y: L, z: 0 }, { x: W, y: L, z: topB }, { x: 0, y: L, z: topB }], 'rgba(170,215,245,.08)', edge, 1.2);
    ctx.globalAlpha = 0.8;
    band(ctx, K, { x: 0, y: L - 0.002, z: C.outBack + 0.025 }, { x: W, y: L - 0.002, z: C.outBack + 0.025 }, { x: 0, y: 0, z: 1 }, 0.05, '#c41f2e');
    ctx.restore();
  }

  const LIGHT = U.n3({ x: -0.3, y: 0.45, z: 0.85 });
  /* raqueta: caña, aro y cuerdas */
  function racketItems(K, sk, items) {
    const A = MS.Athlete;
    const ca = toCam(K, sk.wristA), cb = toCam(K, sk.racketHead);
    if (ca.z > NEAR && cb.z > NEAR) items.push({ z: (ca.z + cb.z) / 2, draw: (ctx) => { const pa = scr(K, ca), pb = scr(K, cb); ctx.lineCap = 'round'; ctx.strokeStyle = '#15181c'; ctx.lineWidth = Math.max(1.2, (0.022 * K.f) / ca.z); ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.strokeStyle = '#f2c811'; ctx.lineWidth = Math.max(1.4, (0.03 * K.f) / ca.z); const g = { x: U.lerp(pa.x, pb.x, 0.22), y: U.lerp(pa.y, pb.y, 0.22) }; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(g.x, g.y); ctx.stroke(); } });
    const rc = U.a3(sk.racketHead, U.m3(sk.racketDir, 0.1));
    let n1 = U.c3(sk.racketDir, sk.fy); if (U.l3(n1) < 0.2) n1 = U.c3(sk.racketDir, { x: 0, y: 0, z: 1 }); n1 = U.n3(n1);
    const ring = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ring.push(U.a3(rc, U.a3(U.m3(sk.racketDir, Math.cos(a) * 0.118), U.m3(n1, Math.sin(a) * 0.092)))); }
    const rcc = toCam(K, rc);
    if (rcc.z > NEAR && ring.every((p) => toCam(K, p).z > NEAR)) items.push({ z: rcc.z, draw: (ctx) => {
      const P = ring.map((p) => proj(K, p));
      ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
      for (const [i, j] of [[2, 14], [4, 12], [6, 10], [1, 7], [15, 9], [3, 5], [13, 11]]) { ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); }
      ctx.stroke();
      ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath();
      ctx.strokeStyle = '#15181c'; ctx.lineWidth = Math.max(1.2, (0.022 * K.f) / rcc.z); ctx.stroke();
    } });
  }
  function playerItems(K, pl, t, opts, items, tl, ball) {
    const A = MS.Athlete;
    const k0 = Player.keyAt(pl, t), dist = Math.hypot(K.eye.x - k0.x, K.eye.y - k0.y, K.eye.z - 0.9);
    const M0 = A.forPlayer(pl, t, ball, opts.lod || (dist < 4.2 ? 1.5 : 1), !!opts.musculos), sk = M0.sk;
    const V = { proj: (p) => { const c = toCam(K, p); return c.z < NEAR ? null : scr(K, c); }, facing: (n, c) => (K.eye.x - c.x) * n.x + (K.eye.y - c.y) * n.y + (K.eye.z - c.z) * n.z > 0 };
    let style;
    if (opts.musculos) style = { anat: { colors: A.actColors(MS.Muscles.activation(pl, t).act), base: A.ANAT.musc, none: A.ANAT.none }, line: 'rgba(110,60,45,.5)' };
    else style = { kit: pl._kit || (pl._kit = A.kit(pl.color, pl.idx)) };
    const vis = A.visible(M0.Q, V, []);
    for (const e of vis) { e.st = style; items.push(e); }
    racketItems(K, sk, items);
    return { sk, shadow: proj(K, { x: sk.P.x, y: sk.P.y, z: 0 }) };
  }

  function draw(ctx, w, h, tl, t, cam, opts = {}) {
    const K = camera(cam, w, h);
    court(ctx, K);
    if (!tl) { glass(ctx, K); return K; }
    /* marcas en la frontal de los golpes recientes */
    const idx = TL.shotIndexAt(tl, t);
    for (let i = Math.max(0, idx - 5); i <= idx; i++) {
      const s = tl.shots[i]; if (!s || !s.res || !s.res.ok) continue;
      const fr = s.res.traj.ev.find((e) => e.type === 'front'); if (!fr || s.t0 + fr.t > t) continue;
      const P = proj(K, { x: fr.x, y: 0.003, z: fr.z }); if (!P) continue;
      const pl = tl.players.find((p) => p.id === s.j);
      ctx.globalAlpha = i === idx ? 1 : 0.35 + 0.1 * (5 - (idx - i));
      ctx.fillStyle = pl ? pl.color : '#333'; ctx.beginPath(); ctx.arc(P.x, P.y, Math.max(3, (0.045 * K.f) / P.z), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(9, (0.07 * K.f) / P.z)}px Saira, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), P.x, P.y);
      ctx.globalAlpha = 1;
    }
    const items = [];
    const meta = [];
    const b = TL.ballAt(tl, t);
    for (const pl of tl.players) meta.push(Object.assign({ pl }, playerItems(K, pl, t, opts, items, tl, b)));
    /* sombras */
    for (const m of meta) {
      if (!m.shadow) continue;
      const blob = (p3, rx) => { const q = proj(K, p3); if (!q) return; const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, (rx * K.f) / q.z); g.addColorStop(0, 'rgba(0,0,0,.30)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, Math.max(0.2, Math.sin(cam.el) * 0.9 + 0.12)); ctx.translate(-q.x, -q.y); ctx.beginPath(); ctx.arc(q.x, q.y, (rx * K.f) / q.z, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
      blob({ x: m.sk.P.x, y: m.sk.P.y, z: 0 }, 0.42);
      for (const sd of ['I', 'D']) { const g = m.sk.legs[sd]; blob({ x: (g.toe.x + g.heel.x) / 2, y: (g.toe.y + g.heel.y) / 2, z: 0 }, 0.17); }
    }
    /* bola, estela y sombra */
    if (b) {
      const s = b.shot;
      if (s && s.res && opts.trayectoria !== false) {
        const P = s.res.traj.pts;
        ctx.save(); ctx.lineCap = 'round';
        let prev = null;
        for (const p of P) {
          if (p.t > b.tau) break;
          if (p.t < b.tau - 0.35) { prev = p; continue; }
          if (prev) { ctx.globalAlpha = 0.15 + 0.6 * (1 - (b.tau - p.t) / 0.35); line3(ctx, K, prev, p, '#1a1a1a', 2); }
          prev = p;
        }
        ctx.restore();
        for (const e of s.res.traj.ev) if (e.type === 'floor' && e.t <= b.tau && b.tau - e.t < 1.2) {
          const Pf = proj(K, { x: e.x, y: e.y, z: 0.003 }); if (!Pf) continue;
          const r = (0.06 * K.f) / Pf.z; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(Pf.x - r, Pf.y - r * 0.4); ctx.lineTo(Pf.x + r, Pf.y + r * 0.4); ctx.moveTo(Pf.x + r, Pf.y - r * 0.4); ctx.lineTo(Pf.x - r, Pf.y + r * 0.4); ctx.stroke();
        }
      }
      const shd = proj(K, { x: b.x, y: b.y, z: 0 });
      if (shd) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(shd.x, shd.y, Math.max(2, (0.03 * K.f) / shd.z), Math.max(1, (0.012 * K.f) / shd.z), 0, 0, Math.PI * 2); ctx.fill(); }
      const bc = toCam(K, b);
      if (bc.z > NEAR) items.push({ z: bc.z - 0.05, draw: (c2) => { const p = scr(K, bc); const r = Math.max(2.6, (0.026 * K.f) / bc.z); c2.fillStyle = '#0b0b0b'; c2.beginPath(); c2.arc(p.x, p.y, r, 0, Math.PI * 2); c2.fill(); if (r > 4) { c2.fillStyle = '#f2c811'; c2.beginPath(); c2.arc(p.x - r * 0.3, p.y - r * 0.2, r * 0.22, 0, Math.PI * 2); c2.arc(p.x + r * 0.25, p.y - r * 0.42, r * 0.22, 0, Math.PI * 2); c2.fill(); } } });
    }
    items.sort((a, c) => c.z - a.z);
    ctx.lineJoin = 'round';
    for (const it of items) { if (it.draw) it.draw(ctx); else MS.Athlete.paint(ctx, it, it.st, LIGHT); }
    glass(ctx, K);
    /* etiquetas y ángulos */
    for (const m of meta) {
      const sk = m.sk;
      const P = proj(K, U.a3(sk.head, { x: 0, y: 0, z: 0.32 }));
      if (P) {
        ctx.font = '700 12px Saira, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const txt = m.pl.nombre.length > 14 ? m.pl.id : m.pl.nombre;
        const wdt = ctx.measureText(txt).width + 12;
        ctx.fillStyle = m.pl.color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(P.x - wdt / 2, P.y - 9, wdt, 18, 9) : ctx.rect(P.x - wdt / 2, P.y - 9, wdt, 18); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(txt, P.x, P.y + 0.5);
      }
      if (opts.angulos) {
        const lu = m.pl.lunges.find((l) => t >= l.t - 0.06 && t <= l.t + 0.45);
        if (lu) {
          const lg = sk.legs[lu.pie];
          const Pk = proj(K, lg.knee);
          if (!lu.leg) lu.leg = Player.skeleton(m.pl, lu.t).legs[lu.pie];
          if (Pk) {
            const ang = lu.leg.kneeAng, over = lu.leg.overToe > 0.02;
            const col = over ? '#ff5a4f' : ang < 88 ? '#f0a33c' : '#3fd28a';
            ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Pk.x, Pk.y, 10, 0, Math.PI * 2); ctx.stroke();
            ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
            const label = `rodilla ${Math.round(ang)}°${over ? ' · pasa la punta' : ''}`;
            const tw = ctx.measureText(label).width + 10;
            ctx.fillStyle = 'rgba(10,20,32,.78)'; ctx.fillRect(Pk.x + 14, Pk.y - 10, tw, 20);
            ctx.fillStyle = col; ctx.fillText(label, Pk.x + 19, Pk.y + 1);
          }
        }
      }
    }
    return K;
  }

  return { PRESETS, camera, draw, proj, heatCol, setLogo, TARGET };
})();
