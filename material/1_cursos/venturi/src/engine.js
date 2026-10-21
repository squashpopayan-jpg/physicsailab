/* Motor físico del banco de Venturi (Física de Fluidos, Universidad del Cauca).
   Unidades: SI en los cálculos; en la interfaz el caudal va en L/min y las alturas manométricas en mm.
   Corre en el navegador y en Node (pruebas en test/engine.test.js). */
const VENTURI = (function () {
  'use strict';

  /* ---------- Equipo: edite estos datos para que coincidan con el banco real y recompile ---------- */
  const EQUIPO = {
    nombre: 'Banco hidráulico con medidor de Venturi',
    tomas: [ // x: posición desde la toma A [mm]; D: diámetro interno nominal en la toma [mm]
      { id: 'A', x: 0, D: 25.0 }, { id: 'B', x: 18, D: 22.0 }, { id: 'C', x: 34, D: 16.0 }, { id: 'D', x: 49, D: 13.0 },
      { id: 'E', x: 66, D: 15.0 }, { id: 'F', x: 81, D: 18.0 }, { id: 'G', x: 101, D: 22.0 }, { id: 'H', x: 126, D: 25.0 }],
    contorno: [[-14, 25], [10, 25], [42, 13], [56, 13], [116, 25], [140, 25]], // perfil interno: x [mm], D [mm]
    iAncha: 0, iGarganta: 3,
    tolDiametro: 0.05,                                   // mm, tolerancia de mecanizado
    escala: { min: 0, max: 500, div: 1, tuboMin: -40, tuboMax: 560, diametro: 8 }, // manómetros [mm]
    rot: { min: 2, max: 20, div: 0.5, reposo: 1.2, tope: 20.6, clase: 2.5, largo: 270 }, // rotámetro [L/min]
    tanque: { max: 40, div: 0.5, rebose: 41.5, vaciado: 1.4, mmPorL: 10 },  // tanque volumétrico [L], vaciado [L/s]
    valvula: { vueltas: 5, muerta: 0.15, exponente: 1.6 },
    termometro: { resolucion: 0.1, exactitud: 0.3 },     // °C
    g: 9.777,                                            // m/s², Popayán (≈ 1 738 m s. n. m.)
    hEstatica: 140,                                      // nivel en reposo sobre el cero de la escala [mm]
    paralaje: { manometro: 0.06, rotametro: 0.035, tanque: 0.05 }, // separación escala–objeto / distancia de lectura
    numBancos: 24,
  };
  // Circuito (unidades: m de columna y L/min): bomba H = H0 − a q², elevación estática, pérdidas K q².
  const CIRC = { a: 0.004, elev: 0.9, kSis: 0.0050, kValv: 0.00224, rotDp: 45, rotQ: 0.6, kSal: 0.30 };

  /* ---------- utilidades ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  function gauss() { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // Proceso de Ornstein–Uhlenbeck de varianza unitaria y tiempo de correlación tau.
  function ou(x, tau, dt) { const e = Math.exp(-dt / tau); return x * e + Math.sqrt(1 - e * e) * gauss(); }
  const area = (dmm) => Math.PI * Math.pow(dmm / 1000, 2) / 4;

  /* ---------- agua ---------- */
  // Densidad: Kell (1975), 0–100 °C, kg/m³.
  function rhoAgua(T) {
    const n = 999.83952 + 16.945176 * T - 7.9870401e-3 * T * T - 46.170461e-6 * T ** 3 + 105.56302e-9 * T ** 4 - 280.54253e-12 * T ** 5;
    return n / (1 + 16.879850e-3 * T);
  }
  // Viscosidad dinámica: ecuación de Vogel ajustada a IAPWS 2008 entre 5 y 35 °C (error < 0,06 %), Pa·s.
  function muAgua(T) { return 3.89888e-5 * Math.pow(10, 186.3806 / (T + 273.15 - 160.9392)); }
  const nuAgua = (T) => muAgua(T) / rhoAgua(T);

  /* ---------- parámetros de cada banco (semilla = número de banco) ---------- */
  function banco(n) {
    const r = mulberry32((0x9E3779B1 ^ Math.imul(n, 2654435761)) >>> 0);
    for (let i = 0; i < 5; i++) r();
    const u = (a, b) => a + (b - a) * r();
    const tomas = EQUIPO.tomas;
    const dReal = tomas.map((t) => +(t.D + u(-0.8, 0.8) * EQUIPO.tolDiametro).toFixed(3));
    // Rotámetro: error propio (ganancia, cero y ondulación) dentro de la clase 2,5 (VDI/VDE 3513).
    let g1 = u(-0.018, 0.022), e0 = u(-0.10, 0.12), w = u(-0.08, 0.08);
    const env = (q) => EQUIPO.rot.clase / 100 * (0.75 * q + 0.25 * EQUIPO.rot.max);
    let peor = 0;
    for (let q = EQUIPO.rot.min; q <= EQUIPO.rot.max + 1e-9; q += 0.25) peor = Math.max(peor, Math.abs(g1 * q + e0 + w * Math.sin(Math.PI * (q - 2) / 18)) / env(q));
    if (peor > 0.85) { const s = 0.85 / peor; g1 *= s; e0 *= s; w *= s; }
    const capil = tomas.map(() => +u(-1.0, 1.0).toFixed(2));
    // Burbujas en las mangueras antes de purgar.
    const nb = 2 + Math.floor(r() * 3), libres = tomas.map((_, i) => i), burbujas = [];
    for (let k = 0; k < nb; k++) {
      const j = Math.floor(r() * libres.length), i = libres.splice(j, 1)[0];
      const mag = u(5, 18), sig = r() < 0.6 ? 1 : -1;
      burbujas.push({ i, off: +(sig * mag).toFixed(1), pos: u(0.25, 0.7), largo: +(mag * 0.9 + 4).toFixed(1) });
    }
    burbujas.sort((a, b) => a.i - b.i);
    const fuga = r() < 0.5 ? +u(0.07, 0.13).toFixed(3) : 0;
    return {
      n, dReal, capil, burbujas, fuga,
      T0: Math.round(u(17.2, 22.8) * 10) / 10,
      Tamb: u(20.8, 24.6), Patm: u(821.8, 826.2), HR: u(54, 76),
      termoSesgo: u(-0.2, 0.2),
      cdOff: u(-0.004, 0.004), etaOff: u(-0.015, 0.015),
      rot: { g1, e0, w },
      H0: u(5.9, 6.1), kValv: u(0.96, 1.04),
    };
  }

  /* ---------- hidráulica en régimen estacionario ---------- */
  function phiValvula(b, vueltas) {
    const V = EQUIPO.valvula, u = (vueltas - V.muerta) / (V.vueltas - V.muerta);
    if (u <= 0) return 0;
    return Math.min(1, Math.pow(Math.min(u, 1), V.exponente) * b.kValv);
  }
  // Caudal de la bomba [L/min] para una apertura de válvula (vueltas desde cerrada).
  function qBomba(b, vueltas) {
    const phi = phiValvula(b, vueltas);
    if (phi <= 0) return 0;
    const kv = CIRC.kValv / (phi * phi);
    return Math.sqrt(Math.max(0, b.H0 - CIRC.elev) / (CIRC.a + CIRC.kSis + kv));
  }
  // Apertura que da un caudal dado (bisección), útil para pruebas y para el docente.
  function valvulaPara(b, q) {
    let lo = EQUIPO.valvula.muerta, hi = EQUIPO.valvula.vueltas;
    if (q >= qBomba(b, hi)) return hi;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (qBomba(b, m) < q) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function cdVerdadero(b, Re) { return clamp(0.995 - 3.2 / Math.sqrt(Math.max(Re, 30)) + b.cdOff, 0.6, 0.999); }
  function etaDifusor(b, Re) { return clamp(0.93 - 6 / Math.sqrt(Math.max(Re, 30)) + b.etaOff, 0.5, 0.95); }
  function friccion(Re) {
    if (Re <= 0) return 0;
    const lam = 64 / Re, tur = 0.316 / Math.pow(Re, 0.25);
    if (Re < 2000) return lam;
    if (Re > 4000) return tur;
    const s = (Re - 2000) / 2000; return lam * (1 - s) + tur * s;
  }
  const rotDp = (qr) => qr > 0 ? CIRC.rotDp * (1 - Math.exp(-qr / CIRC.rotQ)) : 0;
  // Fuga en la unión entre el Venturi y el rotámetro [L/min].
  function qFuga(b, q, hH, apretada) {
    if (apretada || !b.fuga || q <= 0.05) return 0;
    return b.fuga * Math.sqrt(Math.max(0, hH + 60) / 360) * Math.min(1, q / 1.0);
  }
  /* Alturas piezométricas medias [mm sobre el cero de la escala] para un caudal q [L/min] que atraviesa
     el Venturi, a temperatura T. Sin capilaridad ni burbujas. */
  function perfil(b, q, T, apretada) {
    const n = EQUIPO.tomas.length, iD = EQUIPO.iGarganta, g = EQUIPO.g;
    if (!(q > 1e-6)) {
      return { h: new Array(n).fill(EQUIPO.hEstatica), Re: 0, cd: NaN, eta: NaN, v: new Array(n).fill(0), kin: new Array(n).fill(0), fuga: 0, qr: 0 };
    }
    const Q = q / 60000, nu = nuAgua(T);
    const v = b.dReal.map((d) => Q / area(d));
    const kin = v.map((x) => x * x / (2 * g) * 1000);
    const Re = v[0] * b.dReal[0] / 1000 / nu;
    const cd = cdVerdadero(b, Re), eta = etaDifusor(b, Re);
    const rel = new Array(n);
    // Convergente y garganta: la pérdida y el perfil de velocidad se agrupan en Cd.
    for (let i = 0; i <= iD; i++) rel[i] = -(kin[i] - kin[0]) / (cd * cd);
    // Fricción en el tramo de garganta que sigue a la toma D.
    const ReT = v[iD] * b.dReal[iD] / 1000 / nu;
    const finG = EQUIPO.contorno[3][0], xD = EQUIPO.tomas[iD].x;
    const hIni = rel[iD] - friccion(ReT) * ((finG - xD) / b.dReal[iD]) * kin[iD];
    // Difusor: recuperación parcial de la presión con rendimiento eta.
    for (let i = iD + 1; i < n; i++) rel[i] = hIni + eta * (kin[iD] - kin[i]);
    const xFinD = EQUIPO.contorno[4][0];
    rel[n - 1] -= friccion(Re) * (Math.max(0, EQUIPO.tomas[n - 1].x - xFinD) / b.dReal[n - 1]) * kin[n - 1];
    // Condición aguas abajo: elevación de la descarga + rotámetro + tubería de salida.
    const h0 = EQUIPO.hEstatica + rotDp(q) + CIRC.kSal * q * q;
    const fuga = qFuga(b, q, h0, apretada), qr = Math.max(0, q - fuga);
    const hH = EQUIPO.hEstatica + rotDp(qr) + CIRC.kSal * qr * qr;
    const s = hH - rel[n - 1];
    return { h: rel.map((x) => x + s), Re, cd, eta, v, kin, fuga, qr };
  }

  /* ---------- instrumentos ---------- */
  const errorRot = (b, q) => b.rot.g1 * q + b.rot.e0 + b.rot.w * Math.sin(Math.PI * (q - 2) / 18);
  // Posición del flotador expresada en unidades de la escala [L/min].
  function lecturaRot(b, qr) {
    const R = EQUIPO.rot;
    if (qr <= 0) return R.reposo;
    const ind = qr + errorRot(b, qr);
    return clamp(ind, R.reposo, R.tope);
  }
  // Posición física [mm desde el fondo del tubo] para un valor de escala del rotámetro.
  const mmRot = (qs) => 20 + (qs - EQUIPO.rot.min) * (236 / (EQUIPO.rot.max - EQUIPO.rot.min));
  // Caudal teórico [L/min] con los diámetros nominales, para una Δh [mm].
  function qTeorico(dhmm, g) {
    const t = EQUIPO.tomas, A1 = area(t[EQUIPO.iAncha].D), A2 = area(t[EQUIPO.iGarganta].D);
    if (!(dhmm > 0)) return 0;
    return A1 * A2 / Math.sqrt(A1 * A1 - A2 * A2) * Math.sqrt(2 * (g || EQUIPO.g) * dhmm / 1000) * 60000;
  }
  // Valores de referencia en régimen estacionario (sin ruido), para pruebas y para el docente.
  function referencia(b, q, T, opt) {
    const o = opt || {}, apretada = o.apretada !== undefined ? o.apretada : false;
    const P = perfil(b, q, T === undefined ? b.T0 : T, apretada);
    const h = P.h.map((x, i) => x + (o.sinCapilaridad ? 0 : b.capil[i]));
    const dh = h[EQUIPO.iAncha] - h[EQUIPO.iGarganta];
    const rot = lecturaRot(b, P.qr), qt = qTeorico(dh);
    return { q, qr: P.qr, fuga: P.fuga, rot, h, dh, Re: P.Re, cd: P.cd, eta: P.eta, qTeo: qt, cdRot: rot / qt, cdVenturi: q / qt, perdida: h[0] - h[h.length - 1] };
  }

  /* ---------- simulador en tiempo real ---------- */
  function Simulador(n, guardado) {
    const b = banco(n), N = EQUIPO.tomas.length;
    const s = {
      t: 0, bomba: false, valvula: 0, apretada: false, vaciado: true, V: 0.6,
      q: 0, qN: 0, T: b.T0, tBomba: 0, aire: 0, arranques: 0,
      vivas: b.burbujas.map(() => true), y: new Array(N).fill(0), vy: new Array(N).fill(0), nz: new Array(N).fill(0),
      flot: EQUIPO.rot.reposo, flotN: 0, ondaT: 0, Tn: 0,
    };
    if (guardado && guardado.n === n) {
      ['valvula', 'apretada', 'vaciado', 'V', 'T', 'tBomba', 'arranques'].forEach((k) => { if (guardado[k] !== undefined) s[k] = guardado[k]; });
      if (Array.isArray(guardado.vivas) && guardado.vivas.length === s.vivas.length) s.vivas = guardado.vivas.slice();
    }
    const eventos = [];
    const offBurbuja = (i) => { let o = 0; b.burbujas.forEach((bu, k) => { if (bu.i === i && s.vivas[k]) o += bu.off; }); return o; };
    const conBurbuja = (i) => b.burbujas.some((bu, k) => bu.i === i && s.vivas[k]);
    for (let i = 0; i < N; i++) s.y[i] = EQUIPO.hEstatica + b.capil[i] + offBurbuja(i);
    const turb = [1, 1, 1.2, 1.3, 1.8, 1.6, 1.4, 1.1];
    let ultimo = perfil(b, 0, s.T, s.apretada), sigma = new Array(N).fill(0);

    function paso(dtTotal) {
      // Procesos lentos con todo el intervalo; dinámica rápida en subpasos.
      const dtLento = Math.min(dtTotal, 600);
      if (s.bomba) { s.T += 0.8 / 3600 * dtLento; s.tBomba += dtLento; }
      const dtRapido = Math.min(dtTotal, 0.25);
      const nSub = Math.max(1, Math.ceil(dtRapido / (1 / 120)));
      const dt = dtRapido / nSub;
      for (let k = 0; k < nSub; k++) subpaso(dt);
      // Si la pestaña estuvo oculta: el resto del intervalo se integra en régimen estacionario.
      const resto = dtTotal - dtRapido;
      if (resto > 0) {
        const qObj = s.bomba ? qBomba(b, s.valvula) : 0;
        s.q = qObj;
        s.aire *= Math.exp(-resto * (qObj / 21) / 14);
        const lam = Math.max(0, (qObj - 6) / 15) / 30;
        if (lam > 0) b.burbujas.forEach((bu, k) => {
          if (s.vivas[k] && Math.random() < 1 - Math.exp(-lam * resto)) { s.vivas[k] = false; eventos.push({ t: s.t, tipo: 'purga', msg: `Salió una burbuja de la manguera ${EQUIPO.tomas[bu.i].id}` }); }
        });
        const P = perfil(b, qObj, s.T, s.apretada);
        ultimo = P;
        for (let i = 0; i < N; i++) { s.y[i] = P.h[i] + b.capil[i] + offBurbuja(i); s.vy[i] = 0; }
        s.flot = lecturaRot(b, P.qr);
        integraTanque(P.qr || 0, resto);
      }
      s.t += dtTotal;
    }
    function integraTanque(qr, dt) {
      const T = EQUIPO.tanque;
      s.V += qr / 60 * dt;
      if (s.vaciado) s.V -= T.vaciado * dt;
      s.V = clamp(s.V, 0, T.rebose);
    }
    function subpaso(dt) {
      const qObj = s.bomba ? qBomba(b, s.valvula) : 0;
      const tau = s.bomba ? (s.tArr !== undefined && s.t - s.tArr < 4 ? 1.4 : 0.6) : 1.2;
      s.q += (qObj - s.q) * (1 - Math.exp(-dt / tau));
      if (s.q < 1e-4 && qObj === 0) s.q = 0;
      s.qN = ou(s.qN, 0.5, dt);
      const qi = Math.max(0, s.q * (1 + (s.bomba ? 0.003 : 0) * s.qN));
      // Aire arrastrado tras el arranque: se va con el flujo.
      s.aire *= Math.exp(-dt * (qi / 21) / 14);
      // Burbujas en las mangueras: el flujo alto las arrastra (purga).
      const lam = Math.max(0, (qi - 6) / 15) / 30;
      if (lam > 0) b.burbujas.forEach((bu, k) => {
        if (s.vivas[k] && Math.random() < 1 - Math.exp(-lam * dt)) { s.vivas[k] = false; eventos.push({ t: s.t, tipo: 'purga', msg: `Salió una burbuja de la manguera ${EQUIPO.tomas[bu.i].id}` }); }
      });
      const P = perfil(b, qi, s.T, s.apretada);
      ultimo = P;
      for (let i = 0; i < N; i++) {
        const obj = P.h[i] + b.capil[i] + offBurbuja(i);
        const bub = conBurbuja(i), w = bub ? 0.9 : 2.0, z = bub ? 0.9 : 0.28;
        const acc = w * w * (obj - s.y[i]) - 2 * z * w * s.vy[i];
        s.vy[i] += acc * dt; s.y[i] += s.vy[i] * dt;
        s.nz[i] = ou(s.nz[i], 0.7, dt);
        sigma[i] = (0.006 * P.kin[i] * turb[i] + 0.3 * Math.pow(qi / 20, 2)) * (1 + 2 * s.aire);
      }
      // Flotador del rotámetro.
      const objF = lecturaRot(b, P.qr);
      s.flot += (objF - s.flot) * (1 - Math.exp(-dt / 0.25));
      s.flotN = ou(s.flotN, 0.3, dt);
      integraTanque(P.qr, dt);
      s.ondaT += dt;
      s.Tn = ou(s.Tn, 3, dt);
    }
    function lecturas() {
      const R = EQUIPO.rot, E = EQUIPO.escala;
      const h = s.y.map((y, i) => clamp(y + sigma[i] * s.nz[i], E.tuboMin - 60, E.tuboMax));
      const bob = ultimo.qr > 1.5 ? (0.05 + 0.004 * ultimo.qr) * s.flotN : 0;
      const flot = clamp(s.flot + bob, R.reposo, R.tope);
      const onda = s.q > 0.5 && !s.vaciado ? 0.04 * Math.sin(s.ondaT * 7.3) + 0.03 * Math.sin(s.ondaT * 4.1 + 1) : 0;
      return {
        h, flot, V: s.V, Vsup: s.V + onda,
        q: s.q, qr: ultimo.qr || 0, fuga: ultimo.fuga || 0, aire: s.aire,
        Tagua: Math.round((s.T + b.termoSesgo + 0.04 * s.Tn) / EQUIPO.termometro.resolucion) * EQUIPO.termometro.resolucion,
        Tamb: b.Tamb + 0.4 * Math.sin(s.t / 900), Patm: b.Patm + 0.3 * Math.sin(s.t / 1300 + 2), HR: b.HR + 2 * Math.sin(s.t / 1100),
        v: ultimo.v, burbujas: b.burbujas.map((bu, k) => ({ ...bu, viva: s.vivas[k] })),
      };
    }
    return {
      b, s, eventos, paso, lecturas,
      bomba(on) {
        if (on === s.bomba) return;
        s.bomba = on;
        if (on) { s.tArr = s.t; s.aire = Math.max(s.aire, s.arranques === 0 ? 1 : 0.3); s.arranques++; }
      },
      valvula(v) { s.valvula = clamp(v, 0, EQUIPO.valvula.vueltas); },
      apretar() { const habia = b.fuga > 0 && !s.apretada; s.apretada = true; return habia; },
      vaciado(abierto) { s.vaciado = !!abierto; },
      golpear(i) {
        const k = b.burbujas.findIndex((bu, kk) => bu.i === i && s.vivas[kk]);
        if (k < 0) return false;
        if (Math.random() < (s.q > 3 ? 0.55 : 0.15)) { s.vivas[k] = false; return true; }
        return false;
      },
      guardable() { return { n, valvula: s.valvula, apretada: s.apretada, vaciado: s.vaciado, V: s.V, T: s.T, tBomba: s.tBomba, arranques: s.arranques, vivas: s.vivas.slice() }; },
    };
  }

  return { EQUIPO, CIRC, banco, Simulador, rhoAgua, muAgua, nuAgua, perfil, qBomba, valvulaPara, cdVerdadero, etaDifusor, lecturaRot, errorRot, mmRot, qTeorico, referencia, area, mulberry32 };
})();
if (typeof module !== 'undefined') module.exports = VENTURI;
