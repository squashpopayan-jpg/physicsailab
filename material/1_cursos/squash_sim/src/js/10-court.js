/* Geometría de la cancha individual según la World Squash Federation (WSF).
   Sistema de coordenadas (metros):
     x → hacia la derecha mirando la pared frontal desde el fondo (0 = pared izquierda, 6,40 = derecha)
     y → desde la pared frontal hacia el fondo (0 = pared frontal, 9,75 = pared trasera de vidrio)
     z → altura sobre el piso                                                                       */
MS.C = (function () {
  const C = {
    W: 6.40, L: 9.75,
    shortRear: 9.75 - 4.26,      // borde trasero de la línea corta: 4,26 m desde la pared trasera
    shortFront: 9.75 - 4.26 - 0.05,
    lineW: 0.05,
    half: 3.20,                  // línea de media cancha (eje)
    box: 1.60,                   // cuadro de saque: 1,60 m de lado interior
    tin: 0.48,                   // borde superior del tin (0,43 m en el circuito profesional masculino)
    svc: 1.78,                   // línea de saque en la pared frontal
    outFront: 4.57,              // línea de fuera en la pared frontal
    outBack: 2.13,               // línea de fuera en la pared trasera
    ballR: 0.02,                 // radio de la bola (40 mm de diámetro)
    ballM: 0.024,                // masa (24 g)
  };
  C.T = { x: 3.2, y: (C.shortFront + C.shortRear) / 2 };   // la «T»
  C.Twait = { x: 3.2, y: C.T.y + 0.45 };                     // posición de espera habitual (algo detrás de la T)
  /* Altura de la línea de fuera de las paredes laterales en función de y */
  C.sideOut = (y) => C.outFront + (C.outBack - C.outFront) * (y / C.L);
  C.inCourt = (p, m = 0.2) => p.x >= m && p.x <= C.W - m && p.y >= m && p.y <= C.L - m;
  C.clampIn = (p, m = 0.32) => ({ x: Math.min(C.W - m, Math.max(m, p.x)), y: Math.min(C.L - m, Math.max(m, p.y)) });

  /* Seis esquinas clásicas del ghosting y posiciones de «bola virtual» (x, y, altura de impacto) */
  C.ghost = {
    FI: { x: 0.55, y: 0.95, z: 0.30, nombre: 'Frente izquierda' },
    FD: { x: 5.85, y: 0.95, z: 0.30, nombre: 'Frente derecha' },
    MI: { x: 0.40, y: 5.10, z: 1.10, nombre: 'Medio izquierda (volea)' },
    MD: { x: 6.00, y: 5.10, z: 1.10, nombre: 'Medio derecha (volea)' },
    BI: { x: 0.65, y: 8.90, z: 0.65, nombre: 'Fondo izquierda' },
    BD: { x: 5.75, y: 8.90, z: 0.65, nombre: 'Fondo derecha' },
  };
  /* Zonas de destino (bote) para el editor */
  C.zones = {
    FI: { x: 0.55, y: 1.5, nombre: 'Frente izq.' }, FD: { x: 5.85, y: 1.5, nombre: 'Frente der.' },
    MI: { x: 0.50, y: 4.6, nombre: 'Medio izq.' }, MD: { x: 5.90, y: 4.6, nombre: 'Medio der.' },
    BI: { x: 0.45, y: 7.5, nombre: 'Fondo izq.' }, BD: { x: 5.95, y: 7.5, nombre: 'Fondo der.' },
  };
  /* Posiciones con nombre a las que un jugador puede recuperar */
  C.spots = {
    T: { x: 3.2, y: C.T.y + 0.45, nombre: 'T (espera)' },
    Tpura: { x: 3.2, y: C.T.y, nombre: 'T exacta' },
    FC: { x: 3.2, y: 3.4, nombre: 'Frente centro' },
    FCI: { x: 2.2, y: 3.3, nombre: 'Frente centro-izq.' },
    FCD: { x: 4.2, y: 3.3, nombre: 'Frente centro-der.' },
    BC: { x: 3.2, y: 7.7, nombre: 'Fondo centro' },
    BCI: { x: 1.9, y: 7.6, nombre: 'Fondo centro-izq.' },
    BCD: { x: 4.5, y: 7.6, nombre: 'Fondo centro-der.' },
    MI: { x: 1.5, y: 5.6, nombre: 'Lateral izq.' },
    MD: { x: 4.9, y: 5.6, nombre: 'Lateral der.' },
    SI: { x: 0.8, y: 6.3, nombre: 'Cuadro de saque izq.' },
    SD: { x: 5.6, y: 6.3, nombre: 'Cuadro de saque der.' },
  };
  /* Altitud → densidad del aire (atmósfera estándar). Popayán ≈ 1 760 m */
  C.airDensity = (alt) => 1.225 * Math.pow(1 - 2.25577e-5 * alt, 4.2559);
  return C;
})();
