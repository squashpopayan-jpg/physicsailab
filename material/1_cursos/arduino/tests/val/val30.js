/* Núcleo 30 — simulador de circuitos (EM.spice) */
module.exports = function ({ chk, ref, EM, S, L }) {
  const sp = EM.spice;
  /* puente resistivo */
  { const b = ref.bridge, c = new sp.Circuit(), R = b.R;
    c.add(sp.V('V', 'A', '0', b.v, 0.001));
    c.add(sp.R('R1', 'A', 'B', R[0])); c.add(sp.R('R2', 'B', '0', R[1])); c.add(sp.R('R3', 'A', 'C', R[2])); c.add(sp.R('R4', 'C', '0', R[3])); c.add(sp.R('R5', 'B', 'C', R[4]));
    c.solveDC();
    ['A', 'B', 'C'].forEach((n, i) => chk(S, `Puente de Wheatstone desequilibrado: tensión del nodo ${n} frente a numpy.linalg.solve`, c.vNamed(n), b.sol[i], 1e-8)); }
  /* diodo / LED con resistencia */
  for (const d of ref.diode) {
    const c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', d.V, 1e-3)); c.add(sp.R('R', 'a', 'b', d.R));
    c.add({ type: 'D', id: 'D', a: 'b', b: 'k', Is: d.Is, n: d.n }); c.add(sp.R('rs', 'k', '0', Math.max(d.Rs, 1e-9)));
    c.solveDC();
    /* la fuente tiene 1 mΩ de resistencia interna: se compara con la referencia con R + 1 mΩ */
    chk(S, `Diodo en serie con ${d.R} Ω a ${d.V} V (Is = ${d.Is.toExponential(2)}, n = ${d.n}, rs = ${d.Rs} Ω): corriente frente a brentq`, c.find('D').i, d.i, 2e-5);
  }
  for (const d of ref.led) {
    const m = sp.LEDS[d.name], c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', d.V, 1e-3)); c.add(sp.R('R', 'a', 'b', d.R));
    c.add({ type: 'D', id: 'D', a: 'b', b: 'k', Is: m.Is, n: m.n }); c.add(sp.R('rs', 'k', '0', m.rs));
    c.solveDC();
    chk(S, `LED ${d.name} con ${d.R} Ω a ${d.V} V: corriente frente a brentq (Vf = ${m.vf} V a 20 mA)`, c.find('D').i, d.i, 2e-5);
  }
  chk(L, 'El LED rojo tiene Vf = 1,95 V cuando pasan 20 mA (definición del modelo)', (() => { const m = sp.LEDS.rojo; return m.n * sp.VT * Math.log(0.02 / m.Is + 1); })(), 1.95, 1e-12);
  /* Zener */
  for (const z of ref.zener) {
    const c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', z.V, 1e-3)); c.add(sp.R('R', 'a', 'k', z.R)); c.add(sp.zener('Z', '0', 'k', z.Vz, z.Ibv)); c.add(sp.R('RL', 'k', '0', z.RL));
    c.solveDC();
    chk(S, `Regulador Zener de ${z.Vz} V: V = ${z.V} V, R = ${z.R} Ω, carga ${z.RL} Ω; tensión de salida frente a brentq`, c.vNamed('k'), z.v, 2e-4);
  }
  /* BJT */
  for (const q of ref.bjt) {
    const c = new sp.Circuit();
    c.add(sp.V('Vcc', 'vcc', '0', q.Vcc, 1e-4)); c.add(sp.V('Vin', 'in', '0', q.Vin, 1e-4));
    c.add(sp.R('RB', 'in', 'b', q.RB)); c.add(sp.R('RC', 'vcc', 'c', q.RC));
    c.add(sp.bjt('Q', 'c', 'b', '0', { Is: 1.4e-14, bf: 200, br: 3, pol: 1 }));
    c.solveDC();
    /* las fuentes tienen 0,1 mΩ: el efecto es < 1e-4 relativo para estas corrientes */
    chk(S, `Transistor NPN (Ebers–Moll): Vcc ${q.Vcc} V, Vin ${q.Vin} V, RB ${q.RB} Ω, RC ${q.RC} Ω; V_C frente a brentq anidado`, c.vNamed('c'), q.vc, 2e-3);
    chk(S, `Transistor NPN: Vcc ${q.Vcc} V, Vin ${q.Vin} V; V_B frente a brentq anidado`, c.vNamed('b'), q.vb, 2e-3);
  }
  /* MOSFET */
  for (const m of ref.mos) {
    const c = new sp.Circuit();
    c.add(sp.V('Vdd', 'vdd', '0', m.Vdd, 1e-4)); c.add(sp.V('Vg', 'g', '0', m.Vg, 1e-4)); c.add(sp.R('Rd', 'vdd', 'd', m.Rd));
    c.add(sp.mos('M', 'd', 'g', '0', { vth: m.vth, k: m.k, lam: m.lam }));
    c.solveDC();
    chk(S, `MOSFET (Vth ${m.vth} V, k ${m.k} A/V²): Vdd ${m.Vdd} V, Rd ${m.Rd} Ω, Vg ${m.Vg} V; V_DS frente a brentq`, c.vNamed('d'), m.vds, 2e-4, true);
  }
  /* RC */
  { const r = ref.rc, c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', r.V, 1e-6)); c.add(sp.R('R', 'a', 'b', r.R)); c.add(sp.C('C', 'b', '0', r.C));
    c.solveDC(); c.find('C').vprev = 0; c.find('C').iprev = 0; c.x[c.names.get('b') - 1] = 0;
    const dt = 1e-3; let t = 0, k = 0;
    /* se empieza descargado: la fuente se conecta en t = 0 */
    for (let i = 0; i < 5000; i++) { c.step(dt, i === 0 ? 'be' : 'trap'); t += dt; if (k < r.ts.length && Math.abs(t - r.ts[k]) < 1e-9) { chk(S, `Carga RC (R = 10 kΩ, C = 100 µF, V = 5 V): v_C en t = ${r.ts[k]} s frente a la solución exacta 5(1 − e^(−t/RC))`, c.vNamed('b'), r.v[k], 5e-4); k++; } } }
  /* RLC serie */
  { const r = ref.rlc, c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', r.V, 1e-6)); c.add(sp.R('R', 'a', 'b', r.R)); c.add(sp.L('L', 'b', 'c', r.L)); c.add(sp.C('C', 'c', '0', r.C));
    c.solveDC(); c.find('C').vprev = 0; c.find('L').iprev = 0; c.find('L').vprev = 0;
    const dt = 2e-6; let k = 0;
    for (let i = 1; i <= 2000; i++) { c.step(dt, i === 1 ? 'be' : 'trap'); const t = i * dt; if (k < r.ts.length && Math.abs(t - r.ts[k]) < dt / 2) { chk(S, `Circuito RLC serie (R = 20 Ω, L = 10 mH, C = 10 µF): v_C en t = ${(r.ts[k] * 1e3).toFixed(1)} ms frente a solve_ivp (DOP853)`, c.vNamed('c'), r.vc[k], 4e-3); k++; } } }
  /* Rectificador */
  { const r = ref.rect, c = new sp.Circuit();
    c.add(sp.V('V', 'a', '0', 0, 1e-6, { wave: { kind: 'sin', amp: r.Vp, freq: r.f } }));
    c.add({ type: 'D', id: 'D', a: 'a', b: 'k', Is: r.Is, n: r.n }); c.add(sp.C('C', 'k', '0', r.C)); c.add(sp.R('R', 'k', '0', r.R));
    c.solveDC(); c.find('C').vprev = 0; c.find('C').iprev = 0; c.x.fill(0);
    const dt = 2e-5; let k = 0;
    for (let i = 1; i <= 6000; i++) { c.step(dt, i === 1 ? 'be' : 'trap'); const t = i * dt; if (k < r.ts.length && Math.abs(t - r.ts[k]) < dt / 2) { chk(S, `Rectificador de media onda con filtro RC (5 V, 50 Hz, 1 kΩ, 100 µF): v_C en t = ${r.ts[k]} s frente a solve_ivp (Radau)`, c.vNamed('k'), r.vc[k], 8e-3); k++; } } }
  /* Fórmulas de dispositivos pasivos */
  chk(L, 'NTC de 10 kΩ y β = 3950: R(25 °C) = 10 kΩ', sp.ntc(25), 10000, 1e-12);
  chk(L, 'NTC β = 3950: R(0 °C) = 10 kΩ·exp(3950(1/273,15 − 1/298,15)) ≈ 33,6 kΩ (con β = 3950 K entre 25 y 50 °C; la tabla del fabricante da 32,6 kΩ porque β cambia con la temperatura)', sp.ntc(0), 33.62e3, 2e-3);
  chk(L, 'La inversa T(R) devuelve la temperatura (60 °C)', sp.ntcT(sp.ntc(60)), 60, 1e-12);
  /* Código de colores */
  { const t = [[330, 0, 3, 3, 1, 2], [4700, 4, 7, 0, 2, 0]]; /* control directo */
    chk(L, 'Código de colores 330 Ω (naranja-naranja-marrón): bandas ' + sp.bands(330).join(','), sp.fromBands(sp.bands(330)).ohm, 330, 1e-12);
    for (const v of [1, 10, 47, 220, 330, 470, 1000, 2200, 4700, 10000, 47000, 100000, 1e6, 2.2e6, 0.5, 0.22]) chk(L, `Ida y vuelta del código de colores para ${v} Ω`, sp.fromBands(sp.bands(v)).ohm, v, 1e-9);
    const b5 = sp.bands(4990, 5, 1); chk(L, 'Código de 5 bandas para 4,99 kΩ al 1 %', sp.fromBands(b5).ohm, 4990, 1e-12); }
};
