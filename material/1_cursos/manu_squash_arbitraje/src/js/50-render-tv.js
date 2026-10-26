/* Renderizador 3D en Perspectiva de Cancha con Arena WSF y Modelos Anatómicos tipo squash_sim */
MS.RenderTV = (function () {
  const { C, U } = MS;

  const TARGET = { x: 3.20, y: 4.80, z: 0.85 };
  const NEAR = 0.08;

  function camera(cam, w, h) {
    const ce = Math.cos(cam.el);
    const tg = cam.target || TARGET;
    const eye = {
      x: tg.x + cam.dist * Math.sin(cam.az) * ce,
      y: tg.y + cam.dist * Math.cos(cam.az) * ce,
      z: tg.z + cam.dist * Math.sin(cam.el)
    };

    const fw = U.n3(U.s3(tg, eye));
    let right = U.c3({ x: 0, y: 0, z: 1 }, fw);
    right = U.l3(right) < 1e-6 ? { x: 1, y: 0, z: 0 } : U.n3(right);
    const up = U.c3(fw, right);
    const safeH = Math.max(40, h);
    const f = (safeH / 2) / Math.tan(U.rad(cam.fov) / 2);

    return { eye, fw, right, up, f, cx: w / 2, cy: safeH / 2, w, h: safeH };
  }

  function toCam(K, p) {
    const d = U.s3(p, K.eye);
    return {
      x: U.d3(d, K.right),
      y: U.d3(d, K.up),
      z: U.d3(d, K.fw)
    };
  }

  function scr(K, c) {
    const z = Math.max(NEAR, c.z);
    return {
      x: K.cx + (K.f * c.x) / z,
      y: K.cy - (K.f * c.y) / z,
      z: z
    };
  }

  function proj(K, p) {
    const c = toCam(K, p);
    if (c.z < NEAR) return null;
    return scr(K, c);
  }

  function clipPoly(K, pts) {
    let cs = pts.map((p) => toCam(K, p));
    const out = [];
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i], b = cs[(i + 1) % cs.length];
      const ain = a.z >= NEAR, bin = b.z >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (NEAR - a.z) / (b.z - a.z);
        out.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          z: NEAR
        });
      }
    }
    return out.map((c) => scr(K, c));
  }

  function poly(ctx, K, pts, fill, stroke, lw = 1) {
    const P = clipPoly(K, pts);
    if (P.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function line3(ctx, K, a, b, col, lw = 1, dashed = false) {
    let ca = toCam(K, a), cb = toCam(K, b);
    if (ca.z < NEAR && cb.z < NEAR) return;
    if (ca.z < NEAR) {
      const t = (NEAR - ca.z) / (cb.z - ca.z);
      ca = { x: ca.x + (cb.x - ca.x) * t, y: ca.y + (cb.y - ca.y) * t, z: NEAR };
    }
    if (cb.z < NEAR) {
      const t = (NEAR - cb.z) / (ca.z - cb.z);
      cb = { x: cb.x + (ca.x - cb.x) * t, y: cb.y + (ca.y - cb.y) * t, z: NEAR };
    }
    const A = scr(K, ca), B = scr(K, cb);
    ctx.save();
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();
  }

  function band(ctx, K, a, b, n, wdt, col) {
    const h = U.m3(n, wdt / 2);
    poly(ctx, K, [U.a3(a, h), U.a3(b, h), U.s3(b, h), U.s3(a, h)], col);
  }

  function court(ctx, K) {
    const W = C.W, L = C.L, e = K.eye;
    // Gradiente de estadio arena squash
    const sky = ctx.createLinearGradient(0, 0, 0, K.h);
    sky.addColorStop(0, '#1a2430');
    sky.addColorStop(1, '#2c3e50');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, K.w, K.h);

    const topF = 5.0, topB = 2.7;
    const leftOpaque = e.x > 0, rightOpaque = e.x < W, frontOpaque = e.y > 0;

    // Piso de arce reglamentario con vetas
    if (e.z > 0) {
      poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: L, z: 0 }, { x: 0, y: L, z: 0 }], '#ddb47c');
      ctx.globalAlpha = 0.18;
      for (let x = 0.3; x < W; x += 0.3) {
        line3(ctx, K, { x, y: 0, z: 0 }, { x, y: L, z: 0 }, '#8a5a24', 0.8);
      }
      ctx.globalAlpha = 1;
    }

    // Paredes frontal y laterales
    if (frontOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: 0, z: topF }, { x: 0, y: 0, z: topF }], '#f1f3f5');
    if (leftOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: 0, y: L, z: 0 }, { x: 0, y: L, z: topB }, { x: 0, y: 0, z: topF }], '#e4e8ec');
    if (rightOpaque) poly(ctx, K, [{ x: W, y: 0, z: 0 }, { x: W, y: L, z: 0 }, { x: W, y: L, z: topB }, { x: W, y: 0, z: topF }], '#dfe4e9');

    // Tin frontal
    if (frontOpaque) poly(ctx, K, [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: 0, z: C.tin }, { x: 0, y: 0, z: C.tin }], '#d9dfe5');

    // Líneas rojas reglamentarias WSF (bandas físicas de 5 cm)
    const red = '#c41f2e', nF = { x: 0, y: 0, z: 1 }, lw = 0.05;
    if (frontOpaque) {
      band(ctx, K, { x: 0, y: 0.002, z: C.tin - 0.025 }, { x: W, y: 0.002, z: C.tin - 0.025 }, nF, lw, red);
      band(ctx, K, { x: 0, y: 0.002, z: C.svc - 0.025 }, { x: W, y: 0.002, z: C.svc - 0.025 }, nF, lw, red);
      band(ctx, K, { x: 0, y: 0.002, z: C.outFront + 0.025 }, { x: W, y: 0.002, z: C.outFront + 0.025 }, nF, lw, red);
    }
    if (leftOpaque) band(ctx, K, { x: 0.002, y: 0, z: C.outFront + 0.025 }, { x: 0.002, y: L, z: C.outBack + 0.025 }, nF, lw, red);
    if (rightOpaque) band(ctx, K, { x: W - 0.002, y: 0, z: C.outFront + 0.025 }, { x: W - 0.002, y: L, z: C.outBack + 0.025 }, nF, lw, red);

    // Suelo: línea corta, media cancha y cuadros de saque
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
    const W = C.W, L = C.L, e = K.eye, topB = 2.7;
    ctx.save();
    ctx.globalAlpha = 0.5;
    const edge = 'rgba(160,210,240,.9)';
    poly(ctx, K, [{ x: 0, y: L, z: 0 }, { x: W, y: L, z: 0 }, { x: W, y: L, z: topB }, { x: 0, y: L, z: topB }], 'rgba(170,215,245,.08)', edge, 1.2);
    ctx.globalAlpha = 0.8;
    band(ctx, K, { x: 0, y: L - 0.002, z: C.outBack + 0.025 }, { x: W, y: L - 0.002, z: C.outBack + 0.025 }, { x: 0, y: 0, z: 1 }, 0.05, '#c41f2e');
    ctx.restore();
  }

  function addPlayer3D(items, K, p, shirtCol, label, isStriker, ball) {
    if (!p) return;
    const SKIN = '#e9c8ad', SHORTS = '#1f2933', SHOE = '#f5f5f5';

    // Orientación en cancha: por defecto mirando al frontis (-y) o rotado por ang
    const ang = p.ang || 0;
    const yaw = -Math.PI / 2 + ang;
    const f = { x: Math.cos(yaw), y: Math.sin(yaw), z: 0 };
    const r = { x: -Math.sin(yaw), y: Math.cos(yaw), z: 0 };
    const z = { x: 0, y: 0, z: 1 };

    // Sombra suave en piso
    const sh = proj(K, { x: p.x, y: p.y, z: 0.002 });
    if (sh) {
      items.push({
        z: 9999, // Se dibuja primero en la base
        draw: (ctx) => {
          ctx.fillStyle = 'rgba(0,0,0,.26)';
          ctx.beginPath();
          ctx.ellipse(sh.x, sh.y, (0.34 * K.f) / sh.z, (0.15 * K.f) / sh.z, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    const cap = (a, b, radius, col) => {
      const ca = toCam(K, a), cb = toCam(K, b);
      if (ca.z < NEAR || cb.z < NEAR) return;
      const zc = (ca.z + cb.z) / 2;
      items.push({
        z: zc,
        draw: (ctx) => {
          const pa = scr(K, ca), pb = scr(K, cb);
          ctx.strokeStyle = col;
          ctx.lineCap = 'round';
          ctx.lineWidth = Math.max(1, (2 * radius * K.f) / zc);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      });
    };

    const quad = (pts, col, zbias = 0) => {
      const cs = pts.map((pt) => toCam(K, pt));
      if (cs.some((c) => c.z < NEAR)) return;
      const zc = cs.reduce((s, c) => s + c.z, 0) / cs.length + zbias;
      items.push({
        z: zc,
        draw: (ctx) => {
          const P = cs.map((c) => scr(K, c));
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(P[0].x, P[0].y);
          for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.25)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });
    };

    // Estructura anatómica de squash (1.76m de altura estándar)
    const pelvis = { x: p.x, y: p.y, z: 0.84 };
    const hipL = U.a3(pelvis, U.m3(r, -0.13));
    const hipR = U.a3(pelvis, U.m3(r, 0.13));
    const chest = U.a3(pelvis, U.m3(z, 0.40));
    const neck = U.a3(pelvis, U.m3(z, 0.58));
    const head = U.a3(neck, U.a3(U.m3(f, 0.04), U.m3(z, 0.14)));
    const shL = U.a3(chest, U.m3(r, -0.20));
    const shR = U.a3(chest, U.m3(r, 0.20));

    // Piernas con flexión atlética
    const footL = { x: hipL.x + f.x * 0.10, y: hipL.y + f.y * 0.10, z: 0.05 };
    const footR = { x: hipR.x - f.x * 0.12, y: hipR.y - f.y * 0.12, z: 0.05 };
    const kneeL = { x: (hipL.x + footL.x) / 2 + f.x * 0.06, y: (hipL.y + footL.y) / 2 + f.y * 0.06, z: 0.44 };
    const kneeR = { x: (hipR.x + footR.x) / 2 + f.x * 0.06, y: (hipR.y + footR.y) / 2 + f.y * 0.06, z: 0.44 };

    // Pierna Izquierda
    cap(hipL, kneeL, 0.075, SKIN);
    cap(hipL, U.lerp3(hipL, kneeL, 0.45), 0.085, SHORTS); // Shorts
    cap(kneeL, footL, 0.055, SKIN);
    cap(footL, U.a3(footL, U.m3(f, 0.14)), 0.05, SHOE); // Zapatilla

    // Pierna Derecha
    cap(hipR, kneeR, 0.075, SKIN);
    cap(hipR, U.lerp3(hipR, kneeR, 0.45), 0.085, SHORTS); // Shorts
    cap(kneeR, footR, 0.055, SKIN);
    cap(footR, U.a3(footR, U.m3(f, 0.14)), 0.05, SHOE); // Zapatilla

    // Torso con camiseta oficial
    quad([shL, shR, hipR, hipL], shirtCol, -0.02);
    cap(hipL, hipR, 0.09, SHORTS);
    cap(shL, shR, 0.065, shirtCol);

    // Brazo izquierdo (no dominante)
    const elbowL = U.a3(shL, U.a3(U.m3(r, -0.14), U.m3(z, -0.22)));
    const handL = U.a3(elbowL, U.a3(U.m3(f, 0.18), U.m3(z, 0.08)));
    cap(shL, elbowL, 0.05, shirtCol);
    cap(elbowL, handL, 0.04, SKIN);

    // Brazo derecho con raqueta de squash
    let wristR, rkDir;
    if (isStriker && ball) {
      const toB = U.n3(U.s3(ball, shR));
      wristR = U.a3(shR, U.m3(toB, 0.46));
      rkDir = toB;
    } else {
      wristR = U.a3(shR, U.a3(U.m3(f, 0.28), U.m3(z, -0.15)));
      rkDir = U.n3(U.a3(f, U.m3(z, 0.4)));
    }
    const elbowR = U.a3(shR, U.a3(U.m3(r, 0.15), U.m3(z, -0.20)));
    cap(shR, elbowR, 0.05, shirtCol);
    cap(elbowR, wristR, 0.04, SKIN);

    // Raqueta 3D oficial WSF (mango + aro ovalado con encordado)
    const rkHead = U.a3(wristR, U.m3(rkDir, 0.42));
    cap(wristR, rkHead, 0.014, '#1e1e1e');

    // Aro de raqueta (14 puntos en plano perpendicular)
    const rkCenter = U.a3(rkHead, U.m3(rkDir, 0.10));
    let n1 = U.c3(rkDir, { x: 0, y: 0, z: 1 });
    if (U.l3(n1) < 0.1) n1 = U.c3(rkDir, { x: 1, y: 0, z: 0 });
    n1 = U.n3(n1);
    const n2 = U.n3(U.c3(rkDir, n1));

    const ringPts = [];
    for (let i = 0; i < 14; i++) {
      const th = (i / 14) * Math.PI * 2;
      ringPts.push(U.a3(rkCenter, U.a3(U.m3(n1, Math.cos(th) * 0.095), U.m3(n2, Math.sin(th) * 0.12))));
    }
    const rkc = toCam(K, rkCenter);
    if (rkc.z > NEAR && ringPts.every((pt) => toCam(K, pt).z > NEAR)) {
      items.push({
        z: rkc.z,
        draw: (ctx) => {
          const P = ringPts.map((pt) => proj(K, pt));
          ctx.beginPath();
          P.forEach((pt, idx) => (idx ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,.28)';
          ctx.fill();
          ctx.strokeStyle = '#fad02c';
          ctx.lineWidth = Math.max(1.2, (0.02 * K.f) / rkc.z);
          ctx.stroke();
        }
      });
    }

    // Cabeza con cabello atlético
    const hc = toCam(K, head);
    if (hc.z > NEAR) {
      items.push({
        z: hc.z,
        draw: (ctx) => {
          const pt = scr(K, hc);
          const rad = (0.11 * K.f) / hc.z;
          ctx.fillStyle = SKIN;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(2, rad), 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2a1d16';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - rad * 0.15, Math.max(2.1, rad * 1.02), Math.PI * 1.05, Math.PI * 1.95);
          ctx.fill();
        }
      });
    }

    // Pastilla flotante con nombre sobre la cabeza (como squash_sim)
    const tagPos = proj(K, U.a3(head, { x: 0, y: 0, z: 0.30 }));
    if (tagPos) {
      items.push({
        z: tagPos.z - 0.1,
        draw: (ctx) => {
          const title = isStriker ? `★ ${label} (Golpeador)` : label;
          ctx.font = '700 11px Saira, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(title).width + 16;
          const th = 20;

          ctx.save();
          ctx.fillStyle = shirtCol;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(tagPos.x - tw / 2, tagPos.y - th / 2, tw, th, 10);
            ctx.fill();
          } else {
            ctx.fillRect(tagPos.x - tw / 2, tagPos.y - th / 2, tw, th);
          }
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(title, tagPos.x, tagPos.y + 0.5);
          ctx.restore();
        }
      });
    }
  }

  function render(canvas, state, camPreset = 'arbitro') {
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    if (w < 40 || h < 40) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const preset = typeof camPreset === 'object' && camPreset !== null
      ? camPreset
      : (C.PRESETS[camPreset] || C.PRESETS.arbitro);
    const K = camera(preset, w, h);

    // 1. Escenario 3D de Arena WSF (Piso de arce, paredes y líneas)
    court(ctx, K);

    if (!state) {
      glass(ctx, K);
      return;
    }

    const { pA, pB, ball, activePlayer } = state;
    const striker = activePlayer === 'B' ? pB : pA;
    const opponent = activePlayer === 'B' ? pA : pB;

    // 2. CAPA 3D DE ARBITRAJE: Cono Frontal Proyectado (Regla 8.11 WSF)
    if (ball) {
      const inCone = opponent && C.inFrontCone(opponent, ball, 0.2);
      const conePts = [
        { x: ball.x, y: ball.y, z: 0.003 },
        { x: 0, y: 0, z: 0.003 },
        { x: C.W, y: 0, z: 0.003 }
      ];
      poly(
        ctx, K, conePts,
        inCone ? 'rgba(220, 38, 38, 0.28)' : 'rgba(14, 165, 233, 0.12)',
        inCone ? '#dc2626' : 'rgba(14, 165, 233, 0.35)',
        1.5
      );
    }

    // 3. CAPA 3D DE ARBITRAJE: Anillo de Swing Razonable de 1.12 m (Regla 8.9 WSF)
    if (striker) {
      const ringPts = [];
      const N = 24;
      for (let i = 0; i < N; i++) {
        const th = (i / N) * Math.PI * 2;
        ringPts.push({
          x: striker.x + Math.cos(th) * C.SWING_R,
          y: striker.y + Math.sin(th) * C.SWING_R,
          z: 0.004
        });
      }
      let swingBlocked = false;
      if (opponent) {
        const d = U.dist2(striker, opponent);
        if (d < C.SWING_R) swingBlocked = true;
      }
      poly(
        ctx, K, ringPts,
        swingBlocked ? 'rgba(217, 119, 6, 0.25)' : 'rgba(52, 211, 153, 0.10)',
        swingBlocked ? '#d97706' : 'rgba(52, 211, 153, 0.45)',
        2
      );
    }

    // 4. CAPA 3D DE ARBITRAJE: Vector de Acceso a la Bola (Regla 8.6 WSF)
    if (striker && ball) {
      let accessBlocked = false;
      if (opponent) {
        const dSeg = C.distSeg(opponent, striker, ball);
        if (dSeg < 0.65) accessBlocked = true;
      }
      line3(
        ctx, K,
        { x: striker.x, y: striker.y, z: 0.01 },
        { x: ball.x, y: ball.y, z: 0.01 },
        accessBlocked ? '#dc2626' : '#0ea5e9',
        2.5,
        true
      );
    }

    // 5. Colección y ordenamiento de profundidad de Jugadores y Pelota
    const items = [];

    // Jugador A (Azul) y Jugador B (Rojo)
    addPlayer3D(items, K, pA, '#1d4ed8', 'Jugador A', activePlayer === 'A', ball);
    addPlayer3D(items, K, pB, '#b91c1c', 'Jugador B', activePlayer === 'B', ball);

    // Pelota 3D con estela, sombra en piso y doble punto amarillo WSF
    if (ball) {
      // Sombra en piso
      const shd = proj(K, { x: ball.x, y: ball.y, z: 0.003 });
      if (shd) {
        items.push({
          z: 9998,
          draw: (c2) => {
            c2.fillStyle = 'rgba(0,0,0,.32)';
            c2.beginPath();
            c2.ellipse(shd.x, shd.y, Math.max(2, (0.035 * K.f) / shd.z), Math.max(1, (0.016 * K.f) / shd.z), 0, 0, Math.PI * 2);
            c2.fill();
          }
        });
      }

      // Bola real con z depth
      const bc = toCam(K, ball);
      if (bc.z > NEAR) {
        items.push({
          z: bc.z - 0.05,
          draw: (c2) => {
            const pScr = scr(K, bc);
            const r = Math.max(3, (0.032 * K.f) / bc.z);
            c2.fillStyle = '#0b0b0b';
            c2.beginPath();
            c2.arc(pScr.x, pScr.y, r, 0, Math.PI * 2);
            c2.fill();
            c2.strokeStyle = '#475569';
            c2.lineWidth = 1;
            c2.stroke();

            // Doble punto amarillo oficial si el tamaño lo permite
            if (r > 4.5) {
              c2.fillStyle = '#f2c811';
              c2.beginPath();
              c2.arc(pScr.x - r * 0.3, pScr.y - r * 0.2, r * 0.22, 0, Math.PI * 2);
              c2.arc(pScr.x + r * 0.25, pScr.y - r * 0.42, r * 0.22, 0, Math.PI * 2);
              c2.fill();
            }
          }
        });
      }
    }

    // Ordenar de atrás hacia adelante (Z-buffer por pintor)
    items.sort((a, b) => b.z - a.z);
    for (const it of items) it.draw(ctx);

    // 6. Vidrio trasero transparente superpuesto al final
    glass(ctx, K);
  }

  return {
    render
  };
})();
