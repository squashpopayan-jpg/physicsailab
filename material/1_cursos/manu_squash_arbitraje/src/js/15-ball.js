/* Cinemática y trayectoria de la bola de squash */
MS.Ball = (function () {
  const { U, C } = MS;

  function interpolateTrajectory(points, t) {
    if (!points || points.length === 0) return { x: 3.2, y: 5.0, z: 0.5, vx: 0, vy: 0, vz: 0 };
    if (t <= points[0].t) return { ...points[0] };
    if (t >= points[points.length - 1].t) return { ...points[points.length - 1] };

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (t >= p0.t && t <= p1.t) {
        const span = p1.t - p0.t;
        const u = span > 0 ? (t - p0.t) / span : 0;
        // Interpolación cúbica suave para z (parábola de gravedad) y lineal en x, y
        const x = p0.x + (p1.x - p0.x) * u;
        const y = p0.y + (p1.y - p0.y) * u;
        // Parábola de rebote/vuelo si hay altura
        const arch = 4 * u * (1 - u) * (p0.arch || 0);
        const z = Math.max(C.ballR, p0.z + (p1.z - p0.z) * u + arch);
        return {
          x, y, z,
          vx: (p1.x - p0.x) / (span || 1),
          vy: (p1.y - p0.y) / (span || 1),
          vz: (p1.z - p0.z) / (span || 1)
        };
      }
    }
    return { ...points[points.length - 1] };
  }

  return {
    interpolateTrajectory
  };
})();
