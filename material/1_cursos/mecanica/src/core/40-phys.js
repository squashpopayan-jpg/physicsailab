/* ===================================================================
   40-phys.js — Utilidades físicas compartidas y tablas de datos
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const M = MC.M;
  const P = (MC.phys = {});

  /* Periodo exacto del péndulo simple de amplitud th0 (rad) */
  P.pendulumT = function (L, g, th0) {
    const T0 = 2 * Math.PI * Math.sqrt(L / g);
    if (th0 <= 1e-9) return T0;
    const k2 = Math.pow(Math.sin(Math.abs(th0) / 2), 2);
    if (k2 >= 1) return Infinity;
    return 4 * Math.sqrt(L / g) * M.ellipKE(k2)[0];
  };

  /* Ecuación de Kepler: M = E − e sen E  → E */
  P.keplerE = function (Mean, e) {
    let E = e < 0.8 ? Mean : Math.PI;
    for (let i = 0; i < 60; i++) {
      const f = E - e * Math.sin(E) - Mean, fp = 1 - e * Math.cos(E);
      const d = f / fp;
      E -= d;
      if (Math.abs(d) < 1e-13) break;
    }
    return E;
  };

  /* Densidades (kg/m³) */
  P.DENS = {
    aire: 1.20, helio: 0.179, corcho: 240, madera_pino: 500, madera_roble: 750, hielo: 917,
    aceite: 920, agua: 1000, agua_mar: 1025, sangre: 1060, glicerina: 1260, hueso: 1900,
    aluminio: 2700, vidrio: 2500, concreto: 2300, hierro: 7870, acero: 7850, cobre: 8960,
    laton: 8500, plomo: 11300, mercurio: 13600, oro: 19300
  };

  /* Coeficientes de fricción aproximados (μs, μk) */
  P.FRICTION = [
    ['caucho-concreto-seco', 'Caucho sobre concreto seco', 1.0, 0.8],
    ['caucho-concreto-mojado', 'Caucho sobre concreto mojado', 0.7, 0.5],
    ['acero-acero', 'Acero sobre acero', 0.74, 0.57],
    ['aluminio-acero', 'Aluminio sobre acero', 0.61, 0.47],
    ['vidrio-vidrio', 'Vidrio sobre vidrio', 0.94, 0.40],
    ['madera-madera', 'Madera sobre madera', 0.40, 0.25],
    ['esqui-nieve', 'Esquí encerado sobre nieve', 0.10, 0.05],
    ['hielo-hielo', 'Hielo sobre hielo', 0.10, 0.03],
    ['teflon-teflon', 'Teflón sobre teflón', 0.04, 0.04],
    ['articulacion', 'Articulación humana (sinovial)', 0.01, 0.003]
  ];

  /* Integración de una partícula 2D con fuerza F(x, y, vx, vy, t) y masa m (RK4) */
  P.step2D = function (s, m, F, h, t = 0) {
    const f = (tt, y) => {
      const a = F(y[0], y[1], y[2], y[3], tt);
      return [y[2], y[3], a[0] / m, a[1] / m];
    };
    const y = M.rk4(f, [s.x, s.y, s.vx, s.vy], t, h);
    s.x = y[0]; s.y = y[1]; s.vx = y[2]; s.vy = y[3];
    return s;
  };

  /* Onda de audio sencilla (Web Audio): solo tras interacción del usuario */
  let actx = null;
  P.audio = function () {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  };
  /* Reproduce un tono de frecuencia f (Hz) durante dur (s); devuelve función para detener */
  P.tone = function (f, dur = 1.2, vol = 0.12, type = 'sine') {
    const a = P.audio();
    if (!a) return () => {};
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + 0.03);
    g.gain.setValueAtTime(vol, a.currentTime + Math.max(0.05, dur - 0.08));
    g.gain.linearRampToValueAtTime(0, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
    return () => { try { g.gain.cancelScheduledValues(a.currentTime); g.gain.setValueAtTime(0, a.currentTime); o.stop(); } catch (e) { /* */ } };
  };
})();
