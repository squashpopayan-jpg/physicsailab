/* Pruebas del motor del banco de Venturi.  node test/engine.test.js
   Referencias externas en test/referencias.json (python test/referencias.py: CoolProp y fluids). */
const V = require('../src/engine.js');
const R = require('./referencias.json');
const E = V.EQUIPO;
let ok = 0, mal = 0;
const grupos = {};
function prueba(grupo, nombre, cond, detalle) {
  grupos[grupo] = grupos[grupo] || [0, 0];
  if (cond) { ok++; grupos[grupo][0]++; } else { mal++; grupos[grupo][1]++; console.log(`  ✗ [${grupo}] ${nombre}` + (detalle ? ' → ' + detalle : '')); }
}
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);

/* --- agua --- */
R.agua.forEach((r) => {
  prueba('CoolProp', `densidad a ${r.T} °C`, rel(V.rhoAgua(r.T), r.rho) < 3e-4, `${V.rhoAgua(r.T).toFixed(3)} vs ${r.rho.toFixed(3)}`);
  prueba('CoolProp', `viscosidad a ${r.T} °C`, rel(V.muAgua(r.T), r.mu) < 1e-3, `${(V.muAgua(r.T) * 1e3).toFixed(4)} vs ${(r.mu * 1e3).toFixed(4)} mPa·s`);
});
// Tabla 1 de la guía (redondeada a la última cifra publicada)
[[15, 999.1, 1.138, 1.139], [20, 998.2, 1.002, 1.004], [25, 997.0, 0.890, 0.893], [30, 995.7, 0.798, 0.801]].forEach(([T, rho, mu, nu]) => {
  prueba('Guía', `ρ(${T} °C) = ${rho}`, Math.abs(V.rhoAgua(T) - rho) <= 0.06, V.rhoAgua(T).toFixed(2));
  prueba('Guía', `μ(${T} °C) = ${mu}`, Math.abs(V.muAgua(T) * 1e3 - mu) <= 0.003, (V.muAgua(T) * 1e3).toFixed(4));
  prueba('Guía', `ν(${T} °C) = ${nu}`, Math.abs(V.nuAgua(T) * 1e6 - nu) <= 0.003, (V.nuAgua(T) * 1e6).toFixed(4));
});

/* --- ecuación (10) de la guía frente a fluids --- */
R.caudal.forEach((r) => prueba('fluids', `Q teórico para Δh = ${r.dh_mm} mm`, rel(V.qTeorico(r.dh_mm), r.q_Lmin) < 1e-9, `${V.qTeorico(r.dh_mm)} vs ${r.q_Lmin}`));
{ // forma con β (ec. 11) idéntica a la forma con áreas (ec. 10)
  const d = 0.013, D = 0.025, b = d / D, dh = 0.12;
  const q11 = Math.PI * d * d / 4 / Math.sqrt(1 - b ** 4) * Math.sqrt(2 * E.g * dh) * 60000;
  prueba('Guía', 'ec. (11) con β coincide con ec. (10)', rel(V.qTeorico(dh * 1000), q11) < 1e-12);
}
R.friccion.forEach((r) => prueba('fluids', `Blasius a Re = ${r.Re}`, rel(0.316 / Math.pow(r.Re, 0.25), r.blasius) < 2e-3, `${(0.316 / Math.pow(r.Re, 0.25)).toFixed(5)} vs ${r.blasius.toFixed(5)}`));

/* --- hidráulica en régimen estacionario, banco por banco --- */
for (let n = 1; n <= E.numBancos; n++) {
  const b = V.banco(n);
  const qMax = V.qBomba(b, E.valvula.vueltas);
  prueba('Circuito', `banco ${n}: caudal máximo entre 20,5 y 22 L/min`, qMax > 20.5 && qMax < 22, qMax.toFixed(2));
  let previo = -1, mono = true;
  for (let v = 0; v <= 5; v += 0.05) { const q = V.qBomba(b, v); if (q < previo - 1e-12) mono = false; previo = q; }
  prueba('Circuito', `banco ${n}: el caudal crece con la apertura`, mono && V.qBomba(b, 0.1) === 0);
  prueba('Circuito', `banco ${n}: inversa de la válvula`, Math.abs(V.qBomba(b, V.valvulaPara(b, 12)) - 12) < 1e-6);
  let dentro = true, perfilOk = true, peorRot = 0;
  const perdidas = [], cds = [];
  for (let q = 2; q <= 20.001; q += 1) {
    for (const T of [17, 20, 23]) {
      const r = V.referencia(b, q, T, { apretada: true });
      if (r.h.some((h) => h < 5 || h > 490)) dentro = false;
      if (q >= 4) {
        for (let i = 1; i <= 3; i++) if (!(r.h[i] < r.h[i - 1] + 2.1)) perfilOk = false; // la capilaridad (±1 mm por tubo) puede invertir el orden a caudal bajo
        for (let i = 4; i < 8; i++) if (!(r.h[i] > r.h[i - 1] - 2.1)) perfilOk = false;
        if (r.h[3] !== Math.min(...r.h)) perfilOk = false;
      }
      if (q >= 6) perdidas.push(r.perdida / r.dh);
      if (T === 20) cds.push([r.Re, r.cd]);
    }
    peorRot = Math.max(peorRot, Math.abs(V.errorRot(b, q)) / (0.025 * (0.75 * q + 5)));
  }
  prueba('Escala', `banco ${n}: columnas dentro de 0–500 mm entre 2 y 20 L/min`, dentro);
  prueba('Perfil', `banco ${n}: la presión baja hasta la garganta y se recupera después`, perfilOk);
  prueba('Perfil', `banco ${n}: pérdida permanente entre 10 % y 32 % de Δh`, perdidas.every((x) => x > 0.10 && x < 0.32), `${Math.min(...perdidas).toFixed(3)}–${Math.max(...perdidas).toFixed(3)}`);
  prueba('Cd', `banco ${n}: Cd crece con Re`, cds.every((c, k) => k === 0 || c[1] >= cds[k - 1][1]));
  prueba('Cd', `banco ${n}: Cd entre 0,93 y 0,98 para 4–20 L/min`, cds.slice(2).every((c) => c[1] > 0.93 && c[1] < 0.98), cds.slice(2).map((c) => c[1].toFixed(3)).join(' '));
  prueba('Rotámetro', `banco ${n}: error dentro de la clase 2,5`, peorRot <= 0.86, peorRot.toFixed(3));
  const P = V.perfil(b, 14, 20, true);
  prueba('Continuidad', `banco ${n}: A·v constante en las 8 tomas`, P.v.every((v, i) => rel(v * V.area(b.dReal[i]), 14 / 60000) < 1e-12));
  prueba('Bernoulli', `banco ${n}: convergente según Bernoulli corregido por Cd`, [1, 2, 3].every((i) => Math.abs((P.h[0] - P.h[i]) - (P.kin[i] - P.kin[0]) / (P.cd * P.cd)) < 1e-9));
  const rf = V.referencia(b, 8, 20, { apretada: false }), ra = V.referencia(b, 8, 20, { apretada: true });
  prueba('Fuga', `banco ${n}: la fuga (${b.fuga ? 'sí' : 'no'}) se refleja en el rotámetro`, b.fuga ? (rf.qr < ra.qr - 0.05 && rf.fuga < 0.15) : rf.qr === ra.qr);
}
prueba('Fuga', 'entre 8 y 16 de los 24 bancos tienen fuga', (() => { let k = 0; for (let n = 1; n <= 24; n++) if (V.banco(n).fuga) k++; return k >= 8 && k <= 16; })());
prueba('Semilla', 'el banco 5 es igual cada vez', JSON.stringify(V.banco(5)) === JSON.stringify(V.banco(5)));
prueba('Semilla', 'bancos distintos difieren', JSON.stringify(V.banco(5)) !== JSON.stringify(V.banco(6)));

/* --- simulador en tiempo real --- */
const avanza = (S, seg, dt) => { const h = dt || 1 / 30; for (let k = 0; k < Math.round(seg / h); k++) S.paso(h); };
{ // purga
  let limpias = 0, todas = 0; const ensayos = 120;
  for (let k = 0; k < ensayos; k++) {
    const S = V.Simulador(1 + (k % 24));
    if (S.lecturas().burbujas.every((b) => b.viva)) todas++;
    S.bomba(true); S.valvula(5); avanza(S, 120, 0.1);
    if (S.lecturas().burbujas.every((b) => !b.viva)) limpias++;
  }
  prueba('Purga', 'al empezar todas las burbujas están presentes', todas === ensayos);
  prueba('Purga', '2 min a caudal máximo limpian las mangueras en ≥ 85 % de los casos', limpias / ensayos >= 0.85, `${limpias}/${ensayos}`);
}
{ // verificación del cero
  const S = V.Simulador(3); avanza(S, 5);
  const h0 = S.lecturas().h, rango0 = Math.max(...h0) - Math.min(...h0);
  S.bomba(true); S.valvula(5); avanza(S, 240, 0.1); S.valvula(0); avanza(S, 40);
  const h1 = S.lecturas().h, rango1 = Math.max(...h1) - Math.min(...h1);
  prueba('Cero', 'con burbujas, las columnas en reposo difieren más de 5 mm', rango0 > 5, rango0.toFixed(1));
  prueba('Cero', 'purgado, las columnas en reposo quedan dentro de 5 mm', rango1 < 5, rango1.toFixed(1));
}
{ // estabilización tras un cambio de válvula (la guía pide esperar ~30 s)
  const S = V.Simulador(7); S.bomba(true); S.valvula(5); avanza(S, 240, 0.1); S.apretar();
  S.valvula(V.valvulaPara(S.b, 6)); avanza(S, 0.2);
  const objetivo = V.perfil(S.b, V.qBomba(S.b, S.s.valvula), S.s.T, true).h.map((h, i) => h + S.b.capil[i]);
  let tAs = 0;
  for (let k = 0; k < 600; k++) { S.paso(0.05); const err = Math.max(...S.s.y.map((y, i) => Math.abs(y - objetivo[i]))); if (err > 1.5) tAs = (k + 1) * 0.05; }
  prueba('Dinámica', 'las columnas se asientan (±1,5 mm) en menos de 30 s', tAs < 30, tAs.toFixed(1) + ' s');
  prueba('Dinámica', 'no se asientan de inmediato: hay que esperar', tAs > 3, tAs.toFixed(1) + ' s');
}
{ // tanque, pestaña oculta y temperatura
  const S = V.Simulador(9); const T0 = S.s.T; S.bomba(true); S.valvula(3); S.vaciado(false); avanza(S, 10, 0.1);
  const V0 = S.s.V; avanza(S, 60, 0.05);
  const qr = S.lecturas().qr, dV = S.s.V - V0;
  prueba('Tanque', 'el volumen acumulado coincide con Qrot·t', rel(dV, qr) < 0.01, `${dV.toFixed(3)} L vs ${qr.toFixed(3)} L`);
  const Vant = S.s.V; S.paso(300);
  prueba('Tanque', 'con la pestaña oculta el tanque sigue llenándose', Math.abs(S.s.V - Math.min(E.tanque.rebose, Vant + qr * 5)) < 0.1, S.s.V.toFixed(2));
  prueba('Temperatura', 'el agua se calienta ≈ 0,8 °C/h con la bomba en marcha', Math.abs((S.s.T - T0) - 0.8 * 370 / 3600) < 0.005, (S.s.T - T0).toFixed(4));
}

/* --- estudiante virtual: el procedimiento de la guía en los 24 bancos --- */
{
  const resumen = [];
  for (let n = 1; n <= E.numBancos; n++) {
    const S = V.Simulador(n);
    S.bomba(true); S.valvula(5); avanza(S, 150, 0.1);
    S.apretar();
    const cd = [], ref = [];
    for (const q of [4, 7, 10, 13, 16, 19]) {
      S.valvula(V.valvulaPara(S.b, q)); avanza(S, 35, 1 / 30);
      const acc = new Array(8).fill(0); let rot = 0, k = 0;
      for (let j = 0; j < 150; j++) { S.paso(1 / 30); const L = S.lecturas(); L.h.forEach((h, i) => { acc[i] += h; }); rot += L.flot; k++; }
      const h = acc.map((x) => Math.round(x / k)), qrot = Math.round(rot / k * 10) / 10;
      cd.push(qrot / V.qTeorico(h[0] - h[3]));
      ref.push(V.referencia(S.b, q, S.s.T, { apretada: true }).cdRot);
    }
    const media = cd.reduce((a, b) => a + b) / cd.length, sd = Math.sqrt(cd.reduce((a, b) => a + (b - media) ** 2, 0) / (cd.length - 1));
    const desv = Math.max(...cd.slice(1).map((c, i) => Math.abs(c - ref[i + 1])));
    resumen.push({ n, media, sd });
    prueba('Estudiante', `banco ${n}: Cd medio entre 0,92 y 1,00`, media > 0.92 && media < 1.0, media.toFixed(3));
    prueba('Estudiante', `banco ${n}: |ΔCd| < 0,02 frente a la referencia para Q ≥ 7 L/min`, desv < 0.02, desv.toFixed(4));
  }
  const m = resumen.map((r) => r.media);
  console.log(`  Estudiante virtual: Cd medio ${Math.min(...m).toFixed(3)}–${Math.max(...m).toFixed(3)}; s(Cd) típica ${(resumen.reduce((a, r) => a + r.sd, 0) / resumen.length).toFixed(3)}`);
}

Object.entries(grupos).forEach(([g, [a, b]]) => console.log(`  ${g.padEnd(12)} ${a}/${a + b}`));
console.log(`\n${ok}/${ok + mal} pruebas superadas`);
process.exit(mal ? 1 : 0);
