/* Vista en planta (desde arriba): cancha, huellas, recorridos, mapa de calor, bola y figuras proyectadas. */
MS.Top = (function () {
  const { C, U, Player, TL } = MS;
  const COL = { floor: '#e3bd88', plank: 'rgba(120,80,30,.10)', line: '#c41f2e', wall: '#29333f', glass: '#8cc4e8', out: '#c9d3dc', text: '#1d2732' };

  function layout(w, h) {
    const s = Math.min(w / (C.W + 0.56), h / (C.L + 0.9));
    const ox = (w - C.W * s) / 2, oy = 0.42 * s;
    return { s, ox, oy, X: (x) => ox + x * s, Y: (y) => oy + y * s, inv: (px, py) => ({ x: (px - ox) / s, y: (py - oy) / s }) };
  }

  function court(ctx, L, opts = {}) {
    const { s, X, Y } = L;
    ctx.fillStyle = COL.out; ctx.fillRect(0, 0, 99999, 99999);
    /* paredes */
    ctx.fillStyle = COL.wall;
    ctx.fillRect(X(-0.16), Y(-0.2), (C.W + 0.32) * s, 0.2 * s);
    ctx.fillRect(X(-0.16), Y(-0.2), 0.16 * s, (C.L + 0.2) * s);
    ctx.fillRect(X(C.W), Y(-0.2), 0.16 * s, (C.L + 0.2) * s);
    ctx.fillStyle = COL.glass; ctx.fillRect(X(-0.16), Y(C.L), (C.W + 0.32) * s, 0.12 * s);
    /* piso */
    ctx.fillStyle = COL.floor; ctx.fillRect(X(0), Y(0), C.W * s, C.L * s);
    ctx.strokeStyle = COL.plank; ctx.lineWidth = 1;
    for (let x = 0.15; x < C.W; x += 0.15) { ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(C.L)); ctx.stroke(); }
    /* líneas */
    ctx.fillStyle = COL.line;
    const lw = C.lineW * s;
    ctx.fillRect(X(0), Y(C.shortFront), C.W * s, Math.max(1.5, lw));
    ctx.fillRect(X(C.half - 0.025), Y(C.shortRear), Math.max(1.5, lw), (C.L - C.shortRear) * s);
    const bY = C.shortRear + C.box;
    ctx.fillRect(X(0), Y(bY), (C.box + 0.05) * s, Math.max(1.5, lw));
    ctx.fillRect(X(C.W - C.box - 0.05), Y(bY), (C.box + 0.05) * s, Math.max(1.5, lw));
    ctx.fillRect(X(C.box), Y(C.shortRear), Math.max(1.5, lw), (C.box + 0.05) * s);
    ctx.fillRect(X(C.W - C.box - 0.05), Y(C.shortRear), Math.max(1.5, lw), (C.box + 0.05) * s);
    /* textos de pared */
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `700 ${Math.max(8, 0.11 * s)}px Saira, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PARED FRONTAL', X(C.W / 2), Y(-0.1));
    ctx.fillStyle = 'rgba(20,50,80,.75)'; ctx.fillText('VIDRIO', X(C.W / 2), Y(C.L + 0.06));
    /* T */
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2;
    const tx = X(C.T.x), ty = Y(C.T.y);
    ctx.beginPath(); ctx.arc(tx, ty, 0.09 * s, 0, Math.PI * 2); ctx.stroke();
    if (opts.zonas) zones(ctx, L);
  }

  function zones(ctx, L) {
    const { s, X, Y } = L;
    ctx.save();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(10,60,100,.45)'; ctx.lineWidth = 1.2;
    for (const y of [2.6, 6.6]) { ctx.beginPath(); ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(C.W), Y(y)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(X(C.half), Y(0)); ctx.lineTo(X(C.half), Y(C.shortFront)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(10,60,100,.55)'; ctx.font = `700 ${Math.max(9, 0.17 * s)}px Saira, Arial`; ctx.textAlign = 'center';
    const lab = [['FRENTE IZQ.', 1.6, 1.3], ['FRENTE DER.', 4.8, 1.3], ['MEDIO IZQ.', 1.6, 4.5], ['MEDIO DER.', 4.8, 4.5], ['FONDO IZQ.', 1.6, 8.3], ['FONDO DER.', 4.8, 8.3]];
    for (const [t, x, y] of lab) ctx.fillText(t, X(x), Y(y));
    ctx.restore();
  }

  function heat(ctx, L, H, color) {
    const { s, X, Y } = L;
    if (!H || !H.mx) return;
    ctx.save();
    for (let j = 0; j < H.ny; j++) for (let i = 0; i < H.nx; i++) {
      const v = H.g[j * H.nx + i] / H.mx;
      if (v < 0.03) continue;
      ctx.globalAlpha = Math.min(0.85, Math.pow(v, 0.55) * 0.8);
      ctx.fillStyle = color;
      ctx.fillRect(X(i * H.cell), Y(j * H.cell), H.cell * s + 0.5, H.cell * s + 0.5);
    }
    ctx.restore();
  }

  function shoe(ctx, L, p, a, color, alpha, big, letter) {
    const { s, X, Y } = L;
    ctx.save();
    ctx.translate(X(p.x), Y(p.y)); ctx.rotate(a);
    ctx.globalAlpha = alpha;
    const lx = (big ? 0.15 : 0.12) * s, ly = (big ? 0.065 : 0.05) * s;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, lx, ly, 0, 0, Math.PI * 2); ctx.fill();
    if (big) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.restore();
    if (letter && alpha > 0.25) {
      ctx.save(); ctx.globalAlpha = Math.min(1, alpha + 0.2);
      ctx.fillStyle = '#111'; ctx.font = `800 ${Math.max(8, 0.13 * s)}px Saira, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letter, X(p.x), Y(p.y)); ctx.restore();
    }
  }

  /* figura vista desde arriba: la misma malla 3D del atleta en proyección cenital */
  const LTOP = U.n3({ x: -0.35, y: -0.45, z: 0.8 });
  function figure(ctx, L, pl, t, sel, ball, opts) {
    const { s, X, Y } = L, A = MS.Athlete;
    const M0 = A.forPlayer(pl, t, ball, 1, !!(opts && opts.musculos)), sk = M0.sk;
    const g = ctx.createRadialGradient(X(sk.P.x), Y(sk.P.y), 0, X(sk.P.x), Y(sk.P.y), 0.5 * s);
    g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(sk.P.x), Y(sk.P.y), 0.5 * s, 0, Math.PI * 2); ctx.fill();
    if (sel) { ctx.strokeStyle = pl.color; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(X(sk.P.x), Y(sk.P.y), 0.62 * s, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    const V = { proj: (p) => ({ x: X(p.x), y: Y(p.y), z: -p.z }), facing: (n) => n.z > 0.02 };
    const style = opts && opts.musculos ? { anat: { colors: A.actColors(MS.Muscles.activation(pl, t).act), base: A.ANAT.musc, none: A.ANAT.none }, line: 'rgba(110,60,45,.45)' } : { kit: pl._kit || (pl._kit = A.kit(pl.color, pl.idx)) };
    const vis = A.visible(M0.Q, V, []);
    /* raqueta, por altura */
    const P = (q) => [X(q.x), Y(q.y)];
    vis.push({ z: -Math.max(sk.wristA.z, sk.racketTip.z) - 0.02, draw: () => {
      ctx.strokeStyle = '#15181c'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, 0.03 * s); ctx.beginPath(); ctx.moveTo(...P(sk.wristA)); ctx.lineTo(...P(sk.racketHead)); ctx.stroke();
      const mx = (sk.racketHead.x + sk.racketTip.x) / 2, my = (sk.racketHead.y + sk.racketTip.y) / 2;
      const len = Math.hypot(sk.racketTip.x - sk.racketHead.x, sk.racketTip.y - sk.racketHead.y);
      ctx.save(); ctx.translate(X(mx), Y(my)); ctx.rotate(Math.atan2(sk.racketTip.y - sk.racketHead.y, sk.racketTip.x - sk.racketHead.x));
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.strokeStyle = '#15181c'; ctx.lineWidth = Math.max(1.2, 0.022 * s);
      ctx.beginPath(); ctx.ellipse(0, 0, Math.max(2, (len / 2 + 0.03) * s), Math.max(1.5, 0.09 * s * Math.max(0.25, Math.abs(sk.racketDir.z) < 0.9 ? 1 : 0.4)), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    } });
    vis.sort((a, b2) => b2.z - a.z);
    ctx.lineJoin = 'round';
    for (const e of vis) { if (e.draw) e.draw(); else A.paint(ctx, e, style, LTOP); }
    return sk;
  }

  function draw(ctx, w, h, tl, t, opts = {}, cache = {}) {
    const L = layout(w, h);
    const { s, X, Y } = L;
    court(ctx, L, opts);
    if (!tl) return L;
    const focus = opts.foco;
    /* mapa de calor */
    if (opts.calor) {
      for (const pl of tl.players) {
        if (focus && opts.soloFoco && pl.id !== focus) continue;
        cache.heat = cache.heat || {};
        if (!cache.heat[pl.id]) cache.heat[pl.id] = TL.heat(tl, pl);
        heat(ctx, L, cache.heat[pl.id], pl.color);
      }
    }
    /* recorridos */
    if (opts.recorridos) {
      for (const pl of tl.players) {
        ctx.save(); ctx.strokeStyle = pl.color; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.75;
        ctx.beginPath(); let first = true;
        for (const k of pl.keys) { if (k.t > t) break; if (k.t < t - 8) continue; if (first) { ctx.moveTo(X(k.x), Y(k.y)); first = false; } else ctx.lineTo(X(k.x), Y(k.y)); }
        const kk = Player.keyAt(pl, t); if (!first) ctx.lineTo(X(kk.x), Y(kk.y));
        ctx.stroke(); ctx.restore();
      }
    }
    /* huellas */
    if (opts.huellas) {
      for (const pl of tl.players) for (const f of ['I', 'D']) for (const e of pl.feet[f]) {
        if (e.tLand > t || e.tLand < t - 7) continue;
        const age = (t - e.tLand) / 7;
        const big = e.kind === 'estocada';
        shoe(ctx, L, e.to, e.to.a, pl.color, (big ? 0.95 : 0.6) * (1 - age), big, big ? f : null);
      }
    }
    /* distancia a la T */
    if (opts.distancias) {
      for (const pl of tl.players) {
        const k = Player.keyAt(pl, t);
        ctx.save(); ctx.strokeStyle = pl.color; ctx.setLineDash([2, 3]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(C.T.x), Y(C.T.y)); ctx.lineTo(X(k.x), Y(k.y)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#10202e'; ctx.font = `600 ${Math.max(9, 0.15 * s)}px "IBM Plex Mono", monospace`; ctx.textAlign = 'center';
        ctx.fillText(U.num(U.dist(k, C.T), 1) + ' m', X((k.x + C.T.x) / 2), Y((k.y + C.T.y) / 2) - 4);
        ctx.restore();
      }
    }
    /* trayectoria de la bola */
    const b = TL.ballAt(tl, t);
    if (opts.trayectoria && b && b.shot && b.shot.res) {
      const P = b.shot.res.traj.pts;
      const hc = (tl.players.find((p) => p.id === b.shot.j) || {}).color || '#333';
      ctx.save();
      if (opts.prediccion) {
        ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(30,30,30,.35)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)))); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = hc; ctx.lineWidth = 2.2; ctx.beginPath();
      let st = false;
      for (const p of P) { if (p.t > b.tau) break; if (!st) { ctx.moveTo(X(p.x), Y(p.y)); st = true; } else ctx.lineTo(X(p.x), Y(p.y)); }
      ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke();
      for (const e of b.shot.res.traj.ev) {
        if (e.t > b.tau && !opts.prediccion) break;
        const fut = e.t > b.tau;
        ctx.globalAlpha = fut ? 0.35 : 1;
        if (e.type === 'floor') { ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6; const r = 0.07 * s; ctx.beginPath(); ctx.moveTo(X(e.x) - r, Y(e.y) - r); ctx.lineTo(X(e.x) + r, Y(e.y) + r); ctx.moveTo(X(e.x) + r, Y(e.y) - r); ctx.lineTo(X(e.x) - r, Y(e.y) + r); ctx.stroke(); }
        else { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(X(e.x), Y(e.y), 0.06 * s + 2, 0, Math.PI * 2); ctx.fill(); }
        if (e.type === 'front' && !fut) {
          ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.max(9, 0.13 * s)}px "IBM Plex Mono", monospace`; ctx.textAlign = 'center';
          ctx.fillText(U.num(e.z, 2) + ' m', X(e.x), Y(-0.1) + 1);
        }
      }
      ctx.restore();
    }
    /* figuras */
    const order = tl.players.slice().sort((a, b2) => Player.keyAt(a, t).y - Player.keyAt(b2, t).y);
    for (const pl of order) figure(ctx, L, pl, t, focus === pl.id, b, opts);
    /* bola */
    if (b) {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), 0.05 * s + 1, 0, Math.PI * 2); ctx.fill();
      const off = b.z * 0.18 * s;
      const r = Math.max(3, (0.06 + b.z * 0.03) * s);
      ctx.fillStyle = '#0b0b0b'; ctx.beginPath(); ctx.arc(X(b.x) - off * 0.3, Y(b.y) - off, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2c811'; ctx.beginPath(); ctx.arc(X(b.x) - off * 0.3 - r * 0.35, Y(b.y) - off - r * 0.25, r * 0.22, 0, Math.PI * 2); ctx.arc(X(b.x) - off * 0.3 + r * 0.25, Y(b.y) - off - r * 0.45, r * 0.22, 0, Math.PI * 2); ctx.fill();
    }
    /* nombres */
    ctx.font = `700 ${Math.max(10, 0.17 * s)}px Saira, Arial`; ctx.textAlign = 'center';
    for (const pl of tl.players) {
      const k = Player.keyAt(pl, t);
      ctx.fillStyle = pl.color; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
      ctx.strokeText(pl.id, X(k.x), Y(k.y) - 0.5 * s); ctx.fillText(pl.id, X(k.x), Y(k.y) - 0.5 * s);
    }
    return L;
  }

  return { layout, court, draw, figure, COL };
})();
