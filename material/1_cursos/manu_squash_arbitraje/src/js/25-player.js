/* Cinemática, orientación y radio de acción de los jugadores */
MS.Player = (function () {
  const { U, C } = MS;

  function interpolateState(keyframes, t) {
    if (!keyframes || keyframes.length === 0) {
      return { x: 3.2, y: 7.0, z: 0, ang: 0, swing: false, arm: 0 };
    }
    if (t <= keyframes[0].t) return { ...keyframes[0] };
    if (t >= keyframes[keyframes.length - 1].t) return { ...keyframes[keyframes.length - 1] };

    for (let i = 0; i < keyframes.length - 1; i++) {
      const k0 = keyframes[i];
      const k1 = keyframes[i + 1];
      if (t >= k0.t && t <= k1.t) {
        const span = k1.t - k0.t;
        const u = span > 0 ? (t - k0.t) / span : 0;
        // Curva suave
        const ease = u * u * (3 - 2 * u);
        const x = k0.x + (k1.x - k0.x) * ease;
        const y = k0.y + (k1.y - k0.y) * ease;
        const ang = k0.ang + (k1.ang - k0.ang) * ease;
        const arm = (k0.arm || 0) + ((k1.arm || 0) - (k0.arm || 0)) * ease;
        const swing = u > 0.4 ? !!k1.swing : !!k0.swing;
        return { x, y, z: 0, ang, arm, swing };
      }
    }
    return { ...keyframes[keyframes.length - 1] };
  }

  return {
    interpolateState
  };
})();
