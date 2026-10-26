/* Renderizador 2D en Planta de la Cancha de Squash con Capas Oficiales de Arbitraje WSF */
MS.RenderTop = (function () {
  const { C, U } = MS;

  function render(canvas, state) {
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    if (w < 40 || h < 40) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo oscuro exterior
    ctx.fillStyle = '#080f18';
    ctx.fillRect(0, 0, w, h);

    // Margen y escala para que quepa la cancha de 6.40 x 9.75 m
    const pad = 20;
    const availW = Math.max(20, w - pad * 2);
    const availH = Math.max(20, h - pad * 2);
    const scale = Math.max(0.5, Math.min(availW / C.W, availH / C.L));

    const ox = (w - C.W * scale) / 2;
    const oy = (h - C.L * scale) / 2;

    const toScreen = (x, y) => ({
      x: ox + x * scale,
      y: oy + y * scale
    });

    // 1. Suelo de madera de arce
    ctx.fillStyle = '#d4ad74';
    ctx.fillRect(ox, oy, C.W * scale, C.L * scale);

    // Vetas sutiles del tablonado
    ctx.strokeStyle = 'rgba(180, 130, 80, 0.22)';
    ctx.lineWidth = 1;
    const plankW = Math.max(4, 0.12 * scale);
    for (let px = ox; px <= ox + C.W * scale; px += plankW) {
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + C.L * scale);
      ctx.stroke();
    }

    // 2. Líneas rojas reglamentarias WSF (5 cm de ancho)
    const lineW = Math.max(2, C.lineW * scale);
    ctx.strokeStyle = '#c41f2e';
    ctx.lineWidth = lineW;

    // Pared frontal (Tin en planta)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox - 6, oy - 8, C.W * scale + 12, 8);

    // Perímetro de cancha
    ctx.strokeRect(ox, oy, C.W * scale, C.L * scale);

    // Línea corta (a 4.26 m del vidrio trasero)
    const yShort = oy + C.shortFront * scale;
    ctx.beginPath();
    ctx.moveTo(ox, yShort);
    ctx.lineTo(ox + C.W * scale, yShort);
    ctx.stroke();

    // Línea de media cancha
    const xHalf = ox + C.half * scale;
    ctx.beginPath();
    ctx.moveTo(xHalf, yShort);
    ctx.lineTo(xHalf, oy + C.L * scale);
    ctx.stroke();

    // Cuadros de saque (1.60 m)
    const boxSize = C.box * scale;
    // Cuadro izquierdo
    ctx.strokeRect(ox, yShort, boxSize, boxSize);
    // Cuadro derecho
    ctx.strokeRect(ox + C.W * scale - boxSize, yShort, boxSize, boxSize);

    // Vidrio trasero
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ox, oy + C.L * scale);
    ctx.lineTo(ox + C.W * scale, oy + C.L * scale);
    ctx.stroke();

    if (!state) return;

    const { pA, pB, ball, activePlayer, appeal } = state;

    // 3. CAPA DE ARBITRAJE 1: Cono de Acceso a Pared Frontal (Regla 8.11 WSF)
    if (ball) {
      const bScr = toScreen(ball.x, ball.y);
      const fLeft = toScreen(0, 0);
      const fRight = toScreen(C.W, 0);

      // Verificar si el no-golpeador está en el cono
      const nonStriker = activePlayer === 'B' ? pA : pB;
      const inCone = nonStriker && C.inFrontCone(nonStriker, ball, 0.2);

      ctx.beginPath();
      ctx.moveTo(bScr.x, bScr.y);
      ctx.lineTo(fLeft.x, fLeft.y);
      ctx.lineTo(fRight.x, fRight.y);
      ctx.closePath();

      if (inCone) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.42)'; // Rojo peligro: obstrucción
        ctx.strokeStyle = '#dc2626';
      } else {
        ctx.fillStyle = 'rgba(10, 90, 146, 0.16)'; // Azul translúcido: cono libre
        ctx.strokeStyle = 'rgba(10, 90, 146, 0.45)';
      }
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Etiqueta del cono si hay invasión
      if (inCone) {
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 11px IBM Plex Mono, monospace';
        ctx.fillText('¡OBSTRUCCIÓN CONO FRONTAL (8.11)!', bScr.x - 90, bScr.y - 14);
      }
    }

    // 4. CAPA DE ARBITRAJE 2: Anillo de Swing Razonable de 1.12 m (Regla 8.9 WSF)
    const striker = activePlayer === 'B' ? pB : pA;
    const opponent = activePlayer === 'B' ? pA : pB;

    if (striker) {
      const sScr = toScreen(striker.x, striker.y);
      const swingR = Math.max(4, C.SWING_R * scale);

      let swingBlocked = false;
      if (opponent) {
        const d = U.dist2(striker, opponent);
        if (d < C.SWING_R) swingBlocked = true;
      }

      ctx.beginPath();
      ctx.arc(sScr.x, sScr.y, swingR, 0, Math.PI * 2);

      if (swingBlocked) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.25)'; // Ámbar de advertencia
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
      } else {
        ctx.fillStyle = 'rgba(52, 211, 153, 0.1)';  // Verde seguro
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Indicador de radio 1.12m
      ctx.fillStyle = swingBlocked ? '#d97706' : '#2b8a57';
      ctx.font = '9px IBM Plex Mono, monospace';
      ctx.fillText('RADIO SWING 1.12m', sScr.x - 45, sScr.y + swingR + 12);
    }

    // 5. CAPA DE ARBITRAJE 3: Vector de Acceso Directo a la Bola (Regla 8.6 WSF)
    if (striker && ball) {
      const sScr = toScreen(striker.x, striker.y);
      const bScr = toScreen(ball.x, ball.y);

      ctx.save();
      ctx.setLineDash([5, 4]);

      let accessBlocked = false;
      if (opponent) {
        const dSeg = C.distSeg(opponent, striker, ball);
        if (dSeg < 0.65) accessBlocked = true;
      }

      ctx.strokeStyle = accessBlocked ? '#dc2626' : '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sScr.x, sScr.y);
      ctx.lineTo(bScr.x, bScr.y);
      ctx.stroke();
      ctx.restore();

      if (accessBlocked) {
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 10px IBM Plex Mono, monospace';
        ctx.fillText('LÍNEA DE ACCESO BLOQUEADA (8.6)', (sScr.x + bScr.x) / 2 - 80, (sScr.y + bScr.y) / 2 - 8);
      }
    }

    // 6. Dibujo de Jugadores
    const drawPlayer = (p, col, label, isStriker) => {
      if (!p) return;
      const scr = toScreen(p.x, p.y);
      const pR = Math.max(4, 0.35 * scale);

      // Sombra
      ctx.beginPath();
      ctx.ellipse(scr.x, scr.y + 4, pR, Math.max(2, pR * 0.7), 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // Cuerpo
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, pR, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = isStriker ? '#ffffff' : 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = isStriker ? 3 : 1.5;
      ctx.stroke();

      // Raqueta y dirección
      const ang = p.ang || 0;
      const rkLen = 0.65 * scale;
      const rx = scr.x + Math.sin(ang) * rkLen;
      const ry = scr.y - Math.cos(ang) * rkLen;

      ctx.strokeStyle = '#fad02c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(scr.x, scr.y);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      // Aro de raqueta
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Nombre / Letra
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Saira, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, scr.x, scr.y);
    };

    drawPlayer(pA, '#1d4ed8', 'A', activePlayer === 'A');
    drawPlayer(pB, '#b91c1c', 'B', activePlayer === 'B');

    // 7. Bola de squash (negra con punto amarillo WSF)
    if (ball) {
      const bScr = toScreen(ball.x, ball.y);
      const bR = Math.max(4, C.ballR * 3 * scale);

      // Sombra de pelota
      ctx.beginPath();
      ctx.ellipse(bScr.x, bScr.y + 3, bR, bR * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      // Cuerpo de pelota
      ctx.beginPath();
      ctx.arc(bScr.x, bScr.y, bR, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Punto amarillo oficial (Double Yellow Dot)
      ctx.beginPath();
      ctx.arc(bScr.x - 1, bScr.y - 1, 1.8, 0, Math.PI * 2);
      ctx.arc(bScr.x + 1.8, bScr.y + 0.5, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
    }
  }

  return {
    render
  };
})();
