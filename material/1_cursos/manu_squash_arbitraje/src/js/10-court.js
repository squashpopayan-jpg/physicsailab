/* Geometría reglamentaria de cancha individual WSF y funciones geométricas de arbitraje */
MS.C = (function () {
  const C = {
    W: 6.40,
    L: 9.75,
    shortRear: 9.75 - 4.26,        // 5.49 m desde el frontis (4.26 m desde vidrio trasero)
    shortFront: 9.75 - 4.26 - 0.05,
    lineW: 0.05,
    half: 3.20,                    // Línea media
    box: 1.60,                     // Cuadro de saque 1.60 m
    tin: 0.48,                     // Tin oficial WSF
    svc: 1.78,                     // Línea de servicio frontis
    outFront: 4.57,                // Línea de fuera frontis
    outBack: 2.13,                 // Línea de fuera vidrio trasero
    ballR: 0.02,                   // Radio bola (40 mm)

    /* Radio de swing razonable WSF (Regla 8.9) */
    SWING_R: 1.12,
  };

  C.T = { x: 3.20, y: (C.shortFront + C.shortRear) / 2 };
  C.Twait = { x: 3.20, y: C.T.y + 0.45 };

  C.sideOut = (y) => C.outFront + (C.outBack - C.outFront) * (y / C.L);
  C.inCourt = (p, m = 0.2) => p.x >= m && p.x <= C.W - m && p.y >= m && p.y <= C.L - m;

  /* Distancia perpendicular de un punto p a un segmento a-b (Regla 8.6 WSF - Acceso directo) */
  C.distSeg = function (p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  };

  /* Determina si un punto p está dentro del cono frontal formado desde la bola b
     hacia los extremos de la pared frontal (0,0) y (W,0) (Regla 8.11 WSF) */
  C.inFrontCone = function (p, b, margin = 0.15) {
    // Si el jugador está detrás de la bola, no obstruye el frontón
    if (p.y >= b.y - margin) return false;
    if (b.y <= 0.05) return false;

    // Línea izquierda: de (b.x, b.y) a (0, 0)
    // Para cualquier y < b.y, x_min = b.x * (y / b.y)
    const xMin = (b.x * (p.y / b.y)) - margin;

    // Línea derecha: de (b.x, b.y) a (W, 0)
    // x_max = W - (W - b.x) * (y / b.y)
    const xMax = (C.W - ((C.W - b.x) * (p.y / b.y))) + margin;

    return p.x >= xMin && p.x <= xMax;
  };

  /* Presets de cámaras WSF para renderizado 3D */
  C.PRESETS = {
    arbitro: { az: 0.0, el: 0.22, dist: 8.8, fov: 50, nombre: 'Silla del Árbitro' },
    tv: { az: 0.0, el: 0.33, dist: 7.6, fov: 52, nombre: 'Transmisión de TV' },
    lateral: { az: -Math.PI / 2, el: 0.22, dist: 7.4, fov: 56, nombre: 'Vista Lateral' },
    aerea: { az: 0.0, el: 1.05, dist: 11.5, fov: 50, nombre: 'Cámara Aérea' },
    frontal: { az: Math.PI, el: 0.26, dist: 8.2, fov: 52, nombre: 'Vista Frontal' }
  };

  return C;
})();
