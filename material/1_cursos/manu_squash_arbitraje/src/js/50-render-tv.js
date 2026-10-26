/* Renderizador 3D en Perspectiva de Cancha con Cámara Oficial "Silla Árbitro" WSF */
MS.RenderTV = (function () {
  const { C, U } = MS;

  const TARGET = { x: 3.20, y: 4.80, z: 0.90 };
  const NEAR = 0.1;

  function getCameraMatrix(cam, w, h) {
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
    return {
      x: K.cx + (K.f * c.x) / c.z,
      y: K.cy - (K.f * c.y) / c.z,
      z: c.z
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

  function drawPoly(ctx, K, pts, fill, stroke, lw = 1) {
    const P = clipPoly(K, pts);
    if (P.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function drawLine(ctx, K, a, b, col, lw = 1, dashed = false) {
    const A = proj(K, a);
    const B = proj(K, b);
    if (!A || !B) return;
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

  function render(canvas, state, camPreset = 'arbitro') {
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    if (w < 40 || h < 40) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a1017';
    ctx.fillRect(0, 0, w, h);

    const preset = C.PRESETS[camPreset] || C.PRESETS.arbitro;
    const K = getCameraMatrix(preset, w, h);

    // 1. Suelo de madera 3D
    const floorPts = [
      { x: 0, y: 0, z: 0 },
      { x: C.W, y: 0, z: 0 },
      { x: C.W, y: C.L, z: 0 },
      { x: 0, y: C.L, z: 0 }
    ];
    drawPoly(ctx, K, floorPts, '#cb9b65', '#a87847', 1.5);

    // 2. Pared Frontal (Frontis)
    const frontWall = [
      { x: 0, y: 0, z: 0 },
      { x: C.W, y: 0, z: 0 },
      { x: C.W, y: 0, z: C.outFront },
      { x: 0, y: 0, z: C.outFront }
    ];
    drawPoly(ctx, K, frontWall, '#eef3f8', '#cbd5e1', 1);

    // Tin frontal (0.48 m)
    const tinPts = [
      { x: 0, y: 0, z: 0 },
      { x: C.W, y: 0, z: 0 },
      { x: C.W, y: 0, z: C.tin },
      { x: 0, y: 0, z: C.tin }
    ];
    drawPoly(ctx, K, tinPts, '#1e293b', '#0f172a', 1);

    // Línea de corte de tin
    drawLine(ctx, K, { x: 0, y: 0, z: C.tin }, { x: C.W, y: 0, z: C.tin }, '#c41f2e', 2.5);

    // Línea de saque en frontis (1.78 m)
    drawLine(ctx, K, { x: 0, y: 0, z: C.svc }, { x: C.W, y: 0, z: C.svc }, '#c41f2e', 2.5);

    // Línea de fuera en frontis (4.57 m)
    drawLine(ctx, K, { x: 0, y: 0, z: C.outFront }, { x: C.W, y: 0, z: C.outFront }, '#c41f2e', 3);

    // Paredes laterales (Línea de fuera inclinada)
    drawLine(ctx, K, { x: 0, y: 0, z: C.outFront }, { x: 0, y: C.L, z: C.outBack }, '#c41f2e', 2.5);
    drawLine(ctx, K, { x: C.W, y: 0, z: C.outFront }, { x: C.W, y: C.L, z: C.outBack }, '#c41f2e', 2.5);

    // Pared trasera de vidrio
    const glassPts = [
      { x: 0, y: C.L, z: 0 },
      { x: C.W, y: C.L, z: 0 },
      { x: C.W, y: C.L, z: C.outBack },
      { x: 0, y: C.L, z: C.outBack }
    ];
    drawPoly(ctx, K, glassPts, 'rgba(125, 211, 252, 0.12)', 'rgba(125, 211, 252, 0.4)', 2);
    drawLine(ctx, K, { x: 0, y: C.L, z: C.outBack }, { x: C.W, y: C.L, z: C.outBack }, '#c41f2e', 2.5);

    // Líneas rojas del suelo
    // Línea corta
    drawLine(ctx, K, { x: 0, y: C.shortFront, z: 0.002 }, { x: C.W, y: C.shortFront, z: 0.002 }, '#c41f2e', 2.5);
    // Línea media cancha
    drawLine(ctx, K, { x: C.half, y: C.shortFront, z: 0.002 }, { x: C.half, y: C.L, z: 0.002 }, '#c41f2e', 2.5);
    // Cuadros de saque
    drawLine(ctx, K, { x: C.box, y: C.shortFront, z: 0.002 }, { x: C.box, y: C.shortFront + C.box, z: 0.002 }, '#c41f2e', 2);
    drawLine(ctx, K, { x: 0, y: C.shortFront + C.box, z: 0.002 }, { x: C.box, y: C.shortFront + C.box, z: 0.002 }, '#c41f2e', 2);

    drawLine(ctx, K, { x: C.W - C.box, y: C.shortFront, z: 0.002 }, { x: C.W - C.box, y: C.shortFront + C.box, z: 0.002 }, '#c41f2e', 2);
    drawLine(ctx, K, { x: C.W - C.box, y: C.shortFront + C.box, z: 0.002 }, { x: C.W, y: C.shortFront + C.box, z: 0.002 }, '#c41f2e', 2);

    if (!state) return;
    const { pA, pB, ball, activePlayer } = state;
    const striker = activePlayer === 'B' ? pB : pA;
    const opponent = activePlayer === 'B' ? pA : pB;

    // 3. CAPA 3D DE ARBITRAJE: Cono Frontal Proyectado (Regla 8.11 WSF)
    if (ball) {
      const inCone = opponent && C.inFrontCone(opponent, ball, 0.2);
      const conePts = [
        { x: ball.x, y: ball.y, z: 0.003 },
        { x: 0, y: 0, z: 0.003 },
        { x: C.W, y: 0, z: 0.003 }
      ];
      drawPoly(
        ctx, K, conePts,
        inCone ? 'rgba(220, 38, 38, 0.38)' : 'rgba(10, 90, 146, 0.16)',
        inCone ? '#dc2626' : 'rgba(10, 90, 146, 0.4)',
        1.5
      );
    }

    // 4. CAPA 3D DE ARBITRAJE: Anillo de Swing Razonable de 24 lados (Regla 8.9 WSF)
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
      drawPoly(
        ctx, K, ringPts,
        swingBlocked ? 'rgba(217, 119, 6, 0.28)' : 'rgba(52, 211, 153, 0.12)',
        swingBlocked ? '#d97706' : 'rgba(52, 211, 153, 0.5)',
        2
      );
    }

    // 5. CAPA 3D DE ARBITRAJE: Vector de Acceso a la Bola (Regla 8.6 WSF)
    if (striker && ball) {
      let accessBlocked = false;
      if (opponent) {
        const dSeg = C.distSeg(opponent, striker, ball);
        if (dSeg < 0.65) accessBlocked = true;
      }
      drawLine(
        ctx, K,
        { x: striker.x, y: striker.y, z: 0.01 },
        { x: ball.x, y: ball.y, z: 0.01 },
        accessBlocked ? '#dc2626' : '#0ea5e9',
        2.5,
        true
      );
    }

    // 6. Jugadores 3D
    const drawPlayer3D = (p, col, label, isStriker) => {
      if (!p) return;
      // Sombra en piso
      const shadowPts = [];
      for (let i = 0; i < 12; i++) {
        const th = (i / 12) * Math.PI * 2;
        shadowPts.push({ x: p.x + Math.cos(th) * 0.35, y: p.y + Math.sin(th) * 0.28, z: 0.005 });
      }
      drawPoly(ctx, K, shadowPts, 'rgba(0, 0, 0, 0.35)');

      // Cuerpo vertical
      const base = { x: p.x, y: p.y, z: 0 };
      const chest = { x: p.x, y: p.y, z: 1.15 };
      const head = { x: p.x, y: p.y, z: 1.72 };

      drawLine(ctx, K, base, chest, col, 8);
      const hScr = proj(K, head);
      if (hScr) {
        ctx.beginPath();
        ctx.arc(hScr.x, hScr.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f5e9e0';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px Saira, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, hScr.x, hScr.y);
      }

      // Raqueta extendida
      const ang = p.ang || 0;
      const rkTip = {
        x: p.x + Math.sin(ang) * 0.75,
        y: p.y - Math.cos(ang) * 0.75,
        z: 0.95
      };
      drawLine(ctx, K, chest, rkTip, '#fad02c', 3);
    };

    drawPlayer3D(pA, '#1d4ed8', 'A', activePlayer === 'A');
    drawPlayer3D(pB, '#b91c1c', 'B', activePlayer === 'B');

    // 7. Pelota 3D con altura z y sombra en piso
    if (ball) {
      // Sombra en el suelo
      const bShadow = proj(K, { x: ball.x, y: ball.y, z: 0.005 });
      if (bShadow) {
        ctx.beginPath();
        ctx.arc(bShadow.x, bShadow.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
      }
      // Bola real en elevación
      const bScr = proj(K, { x: ball.x, y: ball.y, z: ball.z });
      if (bScr) {
        ctx.beginPath();
        ctx.arc(bScr.x, bScr.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  return {
    render
  };
})();
