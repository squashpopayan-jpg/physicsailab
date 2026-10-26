/* Renderizador 2D en Planta de Cancha con Siluetas Anatómicas WSF tipo squash_sim */
MS.RenderTop = (function () {
  const { C, U } = MS;

  function layout(w, h) {
    const pad = 16;
    const s = Math.min((w - pad * 2) / (C.W + 0.6), (h - pad * 2) / (C.L + 0.85));
    const ox = (w - C.W * s) / 2;
    const oy = pad + (h - pad * 2 - (C.L + 0.85) * s) / 2 + 0.42 * s;
    return {
      s, ox, oy,
      X: (x) => ox + x * s,
      Y: (y) => oy + y * s
    };
  }

  function court(ctx, L, w, h) {
    const { s, X, Y } = L;

    // Fondo oscuro exterior de estadio
    ctx.fillStyle = '#0a1017';
    ctx.fillRect(0, 0, w, h);

    // Pared frontal (Tin en planta)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(X(-0.16), Y(-0.2), (C.W + 0.32) * s, 0.2 * s);
    // Paredes laterales
    ctx.fillRect(X(-0.16), Y(-0.2), 0.16 * s, (C.L + 0.2) * s);
    ctx.fillRect(X(C.W), Y(-0.2), 0.16 * s, (C.L + 0.2) * s);
    // Vidrio trasero
    ctx.fillStyle = '#8cc4e8';
    ctx.fillRect(X(-0.16), Y(C.L), (C.W + 0.32) * s, 0.12 * s);

    // Suelo de madera de arce
    ctx.fillStyle = '#ddb47c';
    ctx.fillRect(X(0), Y(0), C.W * s, C.L * s);

    // Vetas sutiles del tablonado
    ctx.strokeStyle = 'rgba(120, 80, 30, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 0.25; x < C.W; x += 0.25) {
      ctx.beginPath();
      ctx.moveTo(X(x), Y(0));
      ctx.lineTo(X(x), Y(C.L));
      ctx.stroke();
    }

    // Líneas rojas reglamentarias WSF (5 cm de ancho)
    ctx.fillStyle = '#c41f2e';
    const lw = Math.max(1.8, C.lineW * s);

    // Perímetro frontal
    ctx.fillRect(X(0), Y(0), C.W * s, lw);
    // Línea corta (a 4.26 m del vidrio trasero)
    ctx.fillRect(X(0), Y(C.shortFront), C.W * s, lw);
    // Línea de media cancha
    ctx.fillRect(X(C.half - 0.025), Y(C.shortRear), lw, (C.L - C.shortRear) * s);

    // Cuadros de saque (1.60 m)
    const bY = C.shortRear + C.box;
    ctx.fillRect(X(0), Y(bY), (C.box + 0.05) * s, lw);
    ctx.fillRect(X(C.W - C.box - 0.05), Y(bY), (C.box + 0.05) * s, lw);
    ctx.fillRect(X(C.box), Y(C.shortRear), lw, (C.box + 0.05) * s);
    ctx.fillRect(X(C.W - C.box - 0.05), Y(C.shortRear), lw, (C.box + 0.05) * s);

    // Rótulos técnicos discretos sin paréntesis
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `700 ${Math.max(9, 0.12 * s)}px Saira, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PARED FRONTAL - TIN 0.48m', X(C.W / 2), Y(-0.1));

    ctx.fillStyle = 'rgba(20, 50, 80, 0.85)';
    ctx.fillText('VIDRIO TRASERO', X(C.W / 2), Y(C.L + 0.06));

    // Círculo de la "T"
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(X(C.T.x), Y(C.T.y), 0.09 * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawFigure2D(ctx, L, p, shirtCol, label, isStriker, curTime = 0) {
    if (!p) return;
    const { s, X, Y } = L;
    const ang = p.ang || 0;
    const yaw = -Math.PI / 2 + ang;
    const f = { x: Math.cos(yaw), y: Math.sin(yaw) };
    const r = { x: -Math.sin(yaw), y: Math.cos(yaw) };

    const px = p.x, py = p.y;
    const seg = (a, b, w, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(1.5, w * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X(a.x), Y(a.y));
      ctx.lineTo(X(b.x), Y(b.y));
      ctx.stroke();
    };

    // 1. Sombra orientada en el suelo
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(X(px), Y(py), 0.32 * s, 0.22 * s, yaw, 0, Math.PI * 2);
    ctx.fill();

    // 2. Piernas y zapatillas con cadencia atlética
    const stride = Math.sin(curTime * 14) * 0.10;
    const hipL = { x: px + r.x * -0.14, y: py + r.y * -0.14 };
    const hipR = { x: px + r.x * 0.14, y: py + r.y * 0.14 };
    const footL = { x: hipL.x + f.x * (0.10 + stride), y: hipL.y + f.y * (0.10 + stride) };
    const footR = { x: hipR.x - f.x * (0.10 + stride), y: hipR.y - f.y * (0.10 + stride) };
    const kneeL = { x: (hipL.x + footL.x) / 2 + f.x * 0.05, y: (hipL.y + footL.y) / 2 + f.y * 0.05 };
    const kneeR = { x: (hipR.x + footR.x) / 2 + f.x * 0.05, y: (hipR.y + footR.y) / 2 + f.y * 0.05 };

    seg(hipL, kneeL, 0.13, '#2a3340');
    seg(kneeL, footL, 0.10, '#e9c8ad');
    seg(footL, { x: footL.x + f.x * 0.12, y: footL.y + f.y * 0.12 }, 0.09, '#f5f5f5');

    seg(hipR, kneeR, 0.13, '#2a3340');
    seg(kneeR, footR, 0.10, '#e9c8ad');
    seg(footR, { x: footR.x + f.x * 0.12, y: footR.y + f.y * 0.12 }, 0.09, '#f5f5f5');

    // 3. Torso y hombros en color oficial del jugador
    const shL = { x: px + r.x * -0.22, y: py + r.y * -0.22 };
    const shR = { x: px + r.x * 0.22, y: py + r.y * 0.22 };
    seg(shL, shR, 0.22, shirtCol);
    seg(hipL, hipR, 0.20, '#2a3340');

    // 4. Brazos
    const elbowL = { x: shL.x + r.x * -0.12 + f.x * 0.10, y: shL.y + r.y * -0.12 + f.y * 0.10 };
    const handL = { x: elbowL.x + f.x * 0.15, y: elbowL.y + f.y * 0.15 };
    seg(shL, elbowL, 0.08, shirtCol);
    seg(elbowL, handL, 0.065, '#e9c8ad');

    const elbowR = { x: shR.x + r.x * 0.12 + f.x * 0.12, y: shR.y + r.y * 0.12 + f.y * 0.12 };
    const wristR = { x: elbowR.x + f.x * 0.18 + r.x * 0.05, y: elbowR.y + f.y * 0.18 + r.y * 0.05 };
    seg(shR, elbowR, 0.08, shirtCol);
    seg(elbowR, wristR, 0.065, '#e9c8ad');

    // 5. Raqueta con marco ovalado
    const rkHead = { x: wristR.x + f.x * 0.35 + r.x * 0.10, y: wristR.y + f.y * 0.35 + r.y * 0.10 };
    seg(wristR, rkHead, 0.03, '#1e1e1e');

    ctx.save();
    ctx.translate(X(rkHead.x), Y(rkHead.y));
    ctx.rotate(Math.atan2(rkHead.y - wristR.y, rkHead.x - wristR.x));
    ctx.strokeStyle = '#fad02c';
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(3, 0.16 * s), Math.max(2, 0.10 * s), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 6. Cabeza con cabello y mirada direccional (nariz)
    ctx.fillStyle = '#2a1d16';
    ctx.beginPath();
    ctx.arc(X(px), Y(py), Math.max(3, 0.11 * s), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e9c8ad';
    ctx.lineWidth = Math.max(1.5, 0.04 * s);
    ctx.beginPath();
    ctx.moveTo(X(px), Y(py));
    ctx.lineTo(X(px + f.x * 0.16), Y(py + f.y * 0.16));
    ctx.stroke();

    // 7. Letra/Identificador sobre el cuerpo
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(9, 0.11 * s)}px Saira, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, X(px), Y(py));
  }

  function render(canvas, state) {
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    if (w < 40 || h < 40) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const L = layout(w, h);
    const { s, X, Y } = L;

    // 1. Dibujar cancha en planta
    court(ctx, L, w, h);

    if (!state) return;

    const { pA, pB, ball, activePlayer, curTime } = state;
    const striker = activePlayer === 'B' ? pB : pA;
    const opponent = activePlayer === 'B' ? pA : pB;

    let inConeBlocked = false;
    let swingBlocked = false;
    let accessBlocked = false;

    // 2. CAPA DE ARBITRAJE 1: Cono de Acceso a Pared Frontal (Regla 8.11 WSF)
    if (ball) {
      inConeBlocked = opponent && C.inFrontCone(opponent, ball, 0.2);

      ctx.beginPath();
      ctx.moveTo(X(ball.x), Y(ball.y));
      ctx.lineTo(X(0), Y(0));
      ctx.lineTo(X(C.W), Y(0));
      ctx.closePath();

      ctx.fillStyle = inConeBlocked ? 'rgba(220, 38, 38, 0.28)' : 'rgba(14, 165, 233, 0.12)';
      ctx.strokeStyle = inConeBlocked ? '#dc2626' : 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }

    // 3. CAPA DE ARBITRAJE 2: Anillo de Swing Razonable de 1.12 m (Regla 8.9 WSF)
    if (striker) {
      const swingR = Math.max(4, C.SWING_R * s);
      if (opponent) {
        const d = U.dist2(striker, opponent);
        if (d < C.SWING_R) swingBlocked = true;
      }

      ctx.beginPath();
      ctx.arc(X(striker.x), Y(striker.y), swingR, 0, Math.PI * 2);

      ctx.fillStyle = swingBlocked ? 'rgba(217, 119, 6, 0.22)' : 'rgba(52, 211, 153, 0.10)';
      ctx.strokeStyle = swingBlocked ? '#d97706' : 'rgba(52, 211, 153, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
    }

    // 4. CAPA DE ARBITRAJE 3: Vector de Acceso Directo a la Bola (Regla 8.6 WSF)
    if (striker && ball) {
      if (opponent) {
        const dSeg = C.distSeg(opponent, striker, ball);
        if (dSeg < 0.65) accessBlocked = true;
      }

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = accessBlocked ? '#dc2626' : '#0ea5e9';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(X(striker.x), Y(striker.y));
      ctx.lineTo(X(ball.x), Y(ball.y));
      ctx.stroke();
      ctx.restore();
    }

    // 5. Dibujo de Figuras de Jugadores 2D
    drawFigure2D(ctx, L, pA, '#1d4ed8', 'A', activePlayer === 'A', curTime || 0);
    drawFigure2D(ctx, L, pB, '#b91c1c', 'B', activePlayer === 'B', curTime || 0);

    // 6. Bola de squash (con destello en pared frontal, sombra y punto amarillo)
    if (ball) {
      // Destello en frontis cuando impacta
      if (ball.y < 0.28) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - ball.y / 0.28);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(X(ball.x), Y(0), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(X(ball.x), Y(0), 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const bR = Math.max(3.5, C.ballR * 3 * s);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.ellipse(X(ball.x), Y(ball.y) + 3, bR, bR * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bola
      ctx.fillStyle = '#0b0b0b';
      ctx.beginPath();
      ctx.arc(X(ball.x), Y(ball.y), bR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Doble punto amarillo oficial
      ctx.fillStyle = '#f2c811';
      ctx.beginPath();
      ctx.arc(X(ball.x) - bR * 0.28, Y(ball.y) - bR * 0.2, bR * 0.22, 0, Math.PI * 2);
      ctx.arc(X(ball.x) + bR * 0.25, Y(ball.y) - bR * 0.35, bR * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Mini HUD de Estado WSF en la esquina superior derecha (Limpio y profesional)
    const hudY = 16;
    const hudW = 165;
    const hudH = 22;
    const rightX = w - hudW - 14;

    const drawPill = (yOffset, txt, isAlert, alertCol) => {
      ctx.save();
      ctx.fillStyle = isAlert ? alertCol : 'rgba(15, 23, 42, 0.85)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(rightX, yOffset, hudW, hudH, 4);
        ctx.fill();
      } else {
        ctx.fillRect(rightX, yOffset, hudW, hudH);
      }
      ctx.strokeStyle = isAlert ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, rightX + 8, yOffset + hudH / 2);
      ctx.restore();
    };

    drawPill(hudY, inConeBlocked ? '🚨 CONO FRONTAL BLOQ.' : '✓ CONO FRONTAL LIBRE', inConeBlocked, '#dc2626');
    drawPill(hudY + 26, swingBlocked ? '⚠️ SWING INTERFERIDO' : '✓ RADIO SWING 1.12m', swingBlocked, '#d97706');
    drawPill(hudY + 52, accessBlocked ? '🚨 LÍNEA ACCESO BLOQ.' : '✓ ACCESO BOLA LIBRE', accessBlocked, '#dc2626');
  }

  return {
    render
  };
})();
