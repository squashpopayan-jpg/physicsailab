(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const TAU = 2 * Math.PI, DEG = Math.PI / 180;
  /* Folio 116v de Galileo: distancias (en puntos) recorridas por la bola en intervalos de tiempo iguales */
  C.galileoPunti = [33, 130, 298, 526, 824, 1192, 1620, 2104];
  /* Aceleración sobre un plano inclinado: deslizando (g sen θ) o rodando una esfera maciza (5/7 g sen θ) */
  C.inclineAccel = (thetaDeg, rolling) => K.g * Math.sin(thetaDeg * DEG) * (rolling ? 5 / 7 : 1);
  /* Distancias en intervalos iguales de tiempo tras partir del reposo con aceleración a */
  C.distAt = (a, t) => 0.5 * a * t * t;
  /* Periodo exacto del péndulo respecto del de pequeñas oscilaciones: 2K(k)/π con k = sen(θ0/2), por AGM */
  C.pendulumRatio = function (theta0Deg) {
    const k = Math.sin((theta0Deg * DEG) / 2);
    let a = 1, b = Math.sqrt(1 - k * k);
    for (let i = 0; i < 40 && Math.abs(a - b) > 1e-16; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
    return 1 / a; /* K(k) = π/(2 AGM(1, √(1−k²)))  ⇒  2K/π = 1/AGM */
  };
  /* Altura de una montaña lunar iluminada a distancia d (km) del terminador: h = √(R²+d²) − R */
  C.moonMountain = (d, R) => Math.sqrt(R * R + d * d) - R;
  /* Fases de Venus. Modelo copernicano (órbitas circulares) y ptolemaico (epiciclo centrado en la línea Tierra–Sol,
     a distancia Rc y radio r, de modo que Rc + r < 1; aquí 0.57 y 0.41) */
  C.venusPhase = function (t, model) {
    const PE = 365.256, PV = 224.701, PS = 583.92, e = (TAU * t) / PE;
    let E, V, S;
    if (model === 'cop') { E = [Math.cos(e), Math.sin(e)]; V = [0.723 * Math.cos((TAU * t) / PV), 0.723 * Math.sin((TAU * t) / PV)]; S = [0, 0]; }
    else {
      const u = [-Math.cos(e), -Math.sin(e)], up = [-u[1], u[0]], Rc = 0.57, r = 0.41, ph = (TAU * t) / PS;
      E = [0, 0]; S = [u[0], u[1]]; V = [Rc * u[0] + r * (Math.cos(ph) * u[0] + Math.sin(ph) * up[0]), Rc * u[1] + r * (Math.cos(ph) * u[1] + Math.sin(ph) * up[1])];
    }
    const sv = [S[0] - V[0], S[1] - V[1]], ev = [E[0] - V[0], E[1] - V[1]];
    const ns = Math.hypot(sv[0], sv[1]), ne = Math.hypot(ev[0], ev[1]);
    const cosA = (sv[0] * ev[0] + sv[1] * ev[1]) / (ns * ne);
    const es = [S[0] - E[0], S[1] - E[1]], ev2 = [V[0] - E[0], V[1] - E[1]];
    const cosEl = (es[0] * ev2[0] + es[1] * ev2[1]) / (Math.hypot(...es) * Math.hypot(...ev2));
    return { k: (1 + cosA) / 2, dist: ne, elong: Math.acos(Math.max(-1, Math.min(1, cosEl))) / DEG, E, V, S };
  };
  /* Satélites galileanos: semieje (radios de Júpiter) y periodo (días) */
  C.GALILEAN = [{ n: 'Ío', a: 5.905, T: 1.769138 }, { n: 'Europa', a: 9.397, T: 3.551181 }, { n: 'Ganímedes', a: 14.986, T: 7.154553 }, { n: 'Calisto', a: 26.358, T: 16.689018 }];
  /* Transformación de Galileo y trayectoria de una piedra soltada desde la punta del mástil */
  C.mastDrop = function (t, H, v) { const g = K.g; return { xGround: v * t, y: H - 0.5 * g * t * t, xShip: 0 }; };
})(typeof window !== 'undefined' ? window : global);
