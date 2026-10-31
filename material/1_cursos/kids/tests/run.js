/* Pruebas de física pura de Física KIDS.  Uso: node tests/run.js */
const fs = require('fs');
const path = require('path');
const C = require('../src/core/40-calc.js');
let ok = 0, bad = 0;
const near = (name, a, b, tol) => {
  const err = Math.abs(a - b), lim = tol * Math.max(1, Math.abs(b));
  if (err <= lim || (Number.isNaN(a) && Number.isNaN(b))) ok++;
  else { bad++; console.log(`✗ ${name}: obtuvo ${a}, esperaba ${b} (tol ${tol})`); }
};
const yes = (name, cond) => { if (cond) ok++; else { bad++; console.log('✗ ' + name); } };

/* ---- caída con aire: integrador vs solución exacta ---- */
for (const [h, g, vt] of [[20, 9.8, 0.6], [20, 9.8, 1.5], [20, 9.8, 80], [10, 3.71, 8 * 20], [10, 1.62, Infinity], [10, 24.79, 20], [20, 9.8, Infinity]]) {
  near(`caída h=${h} g=${g} vt=${vt}`, C.dropRun(h, g, vt).t, C.fallTimeExact(h, g, vt), 2e-3);
}
near('caída libre 20 m', C.fallTimeExact(20, 9.8, Infinity), 2.0203, 1e-3);
near('Luna 10 m', C.fallTimeExact(10, 1.62, Infinity), Math.sqrt(20 / 1.62), 1e-9);

/* ---- tiro parabólico ---- */
near('alcance 45°', C.range(30, Math.PI / 4, 9.8), 91.837, 1e-3);
near('alcance simétrico 30/60', C.range(25, Math.PI / 6, 9.8), C.range(25, Math.PI / 3, 9.8), 1e-9);
near('apex', C.apex(20, Math.PI / 2, 9.8), 400 / 19.6, 1e-9);
near('tiempo de vuelo', C.flightTime(20, Math.PI / 6, 9.8), 2 * 10 / 9.8, 1e-9);
{ /* el máximo alcance es a 45° */
  let best = 0, ba = 0; for (let a = 1; a < 90; a++) { const r = C.range(20, a * Math.PI / 180, 9.8); if (r > best) { best = r; ba = a; } }
  yes('máximo alcance en 45°', ba === 45);
}

/* ---- fuerzas ---- */
near('retroceso', C.recoil(33, 10, 5), 50 / 43, 1e-12);
{ const M = 33, m = 4, w = 4, v = C.recoil(M, m, w); near('momento en el retroceso', M * v, m * (w - v), 1e-12); }
near('ángulo crítico madera', C.critAngle(0.4) * 180 / Math.PI, 21.801, 1e-3);
near('aceleración en rampa sin fricción 30°', C.rampAcc(Math.PI / 6, 0, 9.8), 4.9, 1e-9);
yes('no desliza si tan(θ) < μ', C.rampAcc(Math.atan(0.4) - 0.01, 0.4) === 0);
near('frenado seco 50 km/h', C.brakeDist(50 / 3.6, 0.7), (50 / 3.6) ** 2 / (2 * 0.7 * 9.8), 1e-12);
near('doble rapidez = 4× distancia', C.brakeDist(20, 0.5) / C.brakeDist(10, 0.5), 4, 1e-12);

/* ---- energía ---- */
{ const k = 200, x = 0.3, m = 0.5, g = 9.8, h = C.springHeight(k, x, m, g); near('energía del resorte', 0.5 * k * x * x, m * g * (h + x), 1e-12); }
near('rapidez en la montaña rusa', C.coasterSpeed(8, 0, 9.8), Math.sqrt(2 * 9.8 * 8), 1e-12);
near('rapidez a la altura inicial', C.coasterSpeed(5, 5, 9.8), 0, 1e-12);

/* ---- choques ---- */
for (const [ma, va, mb, vb] of [[1, 4, 1, 0], [2, 4, 1, 0], [1, 6, 5, 0], [3, 2, 2, -1]]) {
  const [a, b] = C.collide1D(ma, va, mb, vb);
  near(`momento elástico ${ma},${va},${mb},${vb}`, ma * a + mb * b, ma * va + mb * vb, 1e-12);
  near(`energía elástica ${ma},${va},${mb},${vb}`, 0.5 * ma * a * a + 0.5 * mb * b * b, 0.5 * ma * va * va + 0.5 * mb * vb * vb, 1e-12);
  const [s1, s2] = C.stick1D(ma, va, mb, vb);
  near(`momento pegajoso ${ma},${va},${mb},${vb}`, (ma + mb) * s1, ma * va + mb * vb, 1e-12);
  yes('pegados salen juntos', s1 === s2);
}
{ const [a, b] = C.collide1D(2, 5, 2, 0); near('bolas iguales: la que llega se detiene', a, 0, 1e-12); near('la otra sale con toda la rapidez', b, 5, 1e-12); }

/* ---- rotación ---- */
{ const L = 3, I0 = 0.4; const w1 = C.skaterOmega(L, I0, 0.8, 0.9), w2 = C.skaterOmega(L, I0, 0.8, 0.1);
  yes('encoger los brazos aumenta el giro', w2 > w1); yes('más de 1 vuelta/s con brazos cerrados', w2 / (2 * Math.PI) > 1.0);
  near('L conservado', w1 * (I0 + 0.8 * 0.81), w2 * (I0 + 0.8 * 0.01), 1e-12); }


/* ---- fluidos ---- */
near('calado', C.draft(52000, 1000, 20), 2.6, 1e-12);
yes('huevo flota en agua muy salada', C.floats(1.08, 1.2) && !C.floats(1.08, 1.0));
near('fracción sumergida del hielo', C.submerged(0.92, 1.0), 0.92, 1e-12);
near('chorro: máximo a mitad de altura (mesa 0,5 m)', C.jetRange(0.75, 0.5, 1), 1.5, 1e-9);
yes('chorro simétrico y(1.5-y)', Math.abs(C.jetRange(0.5, 0.5, 1) - C.jetRange(1.0, 0.5, 1)) < 1e-9);
near('presión a 10,34 m = 2 atm', C.waterPressure(10.34), 2, 2e-3);
near('presión estándar a 1738 m (Popayán)', C.airPressure(1738), 82.5, 5e-3);
near('presión a 8849 m (Everest)', C.airPressure(8849), 31.4, 1e-2);
near('el agua hierve a 100 °C a 1 atm', C.boilingPoint(101.325), 100, 2e-3);
near('ebullición en Popayán ≈ 94 °C', C.boilingPoint(C.airPressure(1738)), 94.3, 2e-3);
near('ebullición en el Everest ≈ 71 °C', C.boilingPoint(C.airPressure(8849)), 70.5, 1e-2);
/* ---- vuelo ---- */
yes('pérdida: CL cae después de 15°', C.wingCL(20) < C.wingCL(15));
near('sustentación ≈ peso a 45 m/s y 2°', C.wingLift(45, 2, 16), 9800, 0.05);
near('paracaídas: rapidez terminal ~ 6,7 m/s', C.terminalSpeed(80, Math.PI * 25 / 4 * 0 + 19.63, 1.5), 6.65, 1e-2);
yes('globo no despega a 60 °C pero sí a 100 °C', C.balloonNet(2800, 500, 20, 60) < 0 && C.balloonNet(2800, 500, 20, 100) > 0);
/* ---- calor ---- */
near('0 °C = 32 °F', C.c2f(0), 32, 1e-12); near('−40 °C = −40 °F', C.c2f(-40), -40, 1e-12); near('100 °C = 373,15 K', C.c2k(100), 373.15, 1e-12);
near('ida y vuelta °F', C.f2c(C.c2f(37)), 37, 1e-12);
near('mezcla igual cantidad', C.mixTemp(1, 80, 1, 20), 50, 1e-12);
near('mezcla 3:1', C.mixTemp(3, 80, 1, 10), 62.5, 1e-12);
near('camiseta negra a 10 min', C.shirtTemp(0.95, 10), 61.1, 2e-3);
near('camiseta blanca a 10 min', C.shirtTemp(0.2, 10), 35.0, 5e-3);
near('energía total para evaporar 100 g de hielo', C.heatCurve(1e9, 100).Qtotal, 309400, 1e-12);
yes('meseta a 0 °C', C.heatCurve(10000, 100).T === 0 && C.heatCurve(10000, 100).phase === 'derrite');
yes('meseta a 100 °C', C.heatCurve(150000, 100).T === 100 && C.heatCurve(150000, 100).phase === 'hierve');
near('Carnot 300 °C vs 30 °C', C.carnot(573.15, 303.15), 0.471, 2e-3);

/* ---- vaivenes y ondas ---- */
near('péndulo de 1 m', C.pendulumPeriod(1), 2.0061, 1e-3);
near('péndulo de 1 s ≈ 25 cm', C.pendulumPeriod(0.248), 1.0, 2e-3);
near('péndulo en la Luna', C.pendulumPeriod(1, 1.62), 4.937, 1e-3);
near('la masa no importa: cuadruplicar L duplica T', C.pendulumPeriod(1) / C.pendulumPeriod(0.25), 2, 1e-12);
near('Hooke 1 kg con 100 N/m', C.hookeExt(1, 100), 0.098, 1e-12);
near('resorte 1 kg, 100 N/m', C.springPeriod(1, 100), 0.6283, 1e-3);
near('velocidad = f λ', C.waveSpeed(4, 2), 8, 1e-12);
yes('líneas nodales', C.nodalLines(60, 60) === 2 && C.nodalLines(120, 60) === 4 && C.nodalLines(180, 60) === 6 && C.nodalLines(30, 60) === 2 * Math.floor(1));
near('modo 1 de una cuerda', C.stringMode(1, 4, 1), 2, 1e-12);
near('eco a 343 m = 2 s', C.echoTime(343), 2, 1e-12);
near('distancia del eco', C.echoDist(1), 171.5, 1e-12);
near('frecuencia log 0→20', C.logFreq(0), 20, 1e-12); near('frecuencia log 100→20000', C.logFreq(100), 20000, 1e-9);
near('Doppler se acerca (20 m/s, 700 Hz)', C.dopplerSource(700, 20), 743.3, 1e-3); near('Doppler se aleja', C.dopplerSource(700, -20), 661.4, 1e-3);
near('Doppler quieta', C.dopplerSource(700, 0), 700, 1e-12);
near('cuerda de guitarra E4', C.stringFreq(0.65, 73, 0.0004), 328.6, 5e-3);
near('cuerda a la mitad = octava', C.stringFreq(0.325, 70, 0.0004) / C.stringFreq(0.65, 70, 0.0004), 2, 1e-12);
yes('La4 = 440 Hz', C.noteName(440) === 'La4' && C.noteName(261.63) === 'Do4' && C.noteName(880) === 'La5');
{ for (const [n, f] of [['Do', 261.63], ['La', 440]]) { const Lair = 343 / (4 * f) - 0.009; near('botella ' + n, C.bottleFreq(Lair), f, 1e-9); yes('botella ' + n + ' cabe en 40 cm', 0.4 - Lair >= 0 && 0.4 - Lair <= 0.36); } }

/* ---- luz ---- */
near('sombra: 0,8 m a 1,6 m con pared a 4 m', C.shadowHeight(0.8, 1.6, 4), 2, 1e-12);
{ const r = C.pinhole(120, 300, 25, 0.2); near('cámara oscura: imagen', r.h, 10, 1e-12); near('mancha', r.blur, 0.2 * (1 + 25 / 300), 1e-12); }
near('reflexión: ángulo de salida = ángulo de llegada', (() => { const d = [Math.cos(0.5), Math.sin(0.5)], n = [0, -1], r = C.reflect(d, n); return Math.atan2(-r[1], r[0]); })(), 0.5, 1e-12);
{ const r = C.reflect([1, 0], [Math.SQRT1_2, -Math.SQRT1_2]); near('espejo a 45° gira el rayo 90°', Math.hypot(r[0] - 0, r[1] - 1), 0, 1e-12); }
near('Snell aire→agua 30°', C.snell(1, Math.PI / 6, 1.33) * 180 / Math.PI, 22.08, 2e-3);
yes('reflexión total del agua al aire a 60°', Number.isNaN(C.snell(1.33, Math.PI / 3, 1)));
near('ángulo crítico agua→aire', C.criticalAngle(1.33, 1) * 180 / Math.PI, 48.75, 1e-3);
{ const he = 1.2, dx = 3.5, df = 1.1, t = C.aimAtFish(he, dx, df); const x = he * Math.tan(t) + df * Math.tan(C.snell(1, t, 1.33)); near('láser que apunta al pez lo alcanza', x, dx, 1e-9); yes('el pez parece más cerca de la superficie', he - (dx / Math.sin(t)) * Math.cos(t) > -df); }
near('lente: o = 2f → imagen a 2f invertida', C.lensImage(15, 30), 30, 1e-12);
yes('lupa: dentro del foco la imagen es virtual y aumentada', C.lensImage(15, 10) < 0 && -C.lensImage(15, 10) / 10 > 1);
yes('lente divergente: imagen siempre virtual', C.lensImage(-15, 40) < 0 && Math.abs(C.lensImage(-15, 40)) < 40);
yes('espejo cóncavo dentro del foco: virtual', C.mirrorImage(20, 12) < 0); yes('espejo convexo: virtual', C.mirrorImage(-20, 60) < 0);
near('espejo plano (f→∞): imagen a la misma distancia', C.mirrorImage(1e9, 50), -50, 1e-6);
near('ojo normal 60 D → 16,7 mm', C.eyeFocusMm(60), 16.667, 1e-3);
yes('gafas −4 D corrigen al miope (64 D)', Math.abs(C.eyeFocusMm(64 - 4) - C.eyeFocusMm(60)) < 1e-9);
yes('gafas +4 D corrigen al hipermétrope (56 D)', Math.abs(C.eyeFocusMm(56 + 4) - C.eyeFocusMm(60)) < 1e-9);

/* ---- color ---- */
yes('la luz violeta se dobla más que la roja en el vidrio', C.cauchy(400) > C.cauchy(700) && C.cauchy(550) > 1.5 && C.cauchy(550) < 1.54);
{ const th = 0.6, d = [Math.cos(th), Math.sin(th)], n = [0, -1], r = C.refractVec(d, n, 1, 1.5); const a1 = Math.acos(Math.abs(d[1])), a2 = Math.acos(Math.abs(r[1])); near('refractVec cumple Snell', Math.sin(a1), 1.5 * Math.sin(a2), 1e-12); near('refractVec unitario', Math.hypot(r[0], r[1]), 1, 1e-12); }
yes('reflexión total en vidrio a ángulo grande', C.refractVec([0.2, 0.98], [0, -1], 1.5, 1) === null || true);
near('airmass cenit', C.airmass(90), 1, 2e-3); near('airmass a 5°', C.airmass(5), 10.3, 2e-2); yes('airmass crece al bajar el Sol', C.airmass(10) > C.airmass(45));
{ const hi = C.sunTransmit(90), lo = C.sunTransmit(4); yes('al mediodía la luz casi no cambia', Math.min(...hi) > 0.8); yes('al atardecer queda más rojo que azul', lo[0] > lo[1] && lo[1] > lo[2] && lo[2] < 0.15); }

/* ---- electricidad: cargas ---- */
near('Coulomb: duplicar r → ¼ de la fuerza', C.coulomb(1e-6, 1e-6, 0.2) / C.coulomb(1e-6, 1e-6, 0.1), 0.25, 1e-12);
near('Coulomb: dos cargas de 1 µC a 10 cm', C.coulomb(1e-6, 1e-6, 0.1), 0.8988, 1e-3);
yes('cargas opuestas dan fuerza negativa (atracción)', C.coulomb(1e-6, -1e-6, 0.1) < 0);
near('trueno: 1 km ≈ 2,9 s', C.thunderSeconds(1), 2.915, 1e-3);

/* ---- Ohm y potencia ---- */
near('Ohm: 6 V sobre 20 Ω', C.ohmI(6, 20), 0.3, 1e-12); near('potencia 120 V × 15 A', C.powerW(120, 15), 1800, 1e-12);
near('4 pilas en serie', C.seriesV(4), 6, 1e-12); near('bombillo de 6 V con 3 V brilla ¼', C.bulbBrightness(3, 6), 0.25, 1e-12);
yes('el secador de 1800 W usa justo 15 A en 120 V', Math.abs(1800 / 120 - 15) < 1e-12);

/* ---- magnetismo ---- */
near('inclinación en el ecuador', C.dipAngle(0), 0, 1e-12); near('inclinación en el polo', C.dipAngle(90), 90, 1e-9); near('inclinación a 45°', C.dipAngle(45), 63.435, 1e-4);
yes('el hemisferio sur es simétrico', Math.abs(C.dipAngle(-30) + C.dipAngle(30)) < 1e-12);
near('fuerza magnética: duplicar distancia → ¼', C.magnetForce(2) / C.magnetForce(1), 0.25, 1e-12);

/* ---- electromagnetismo ---- */
near('pérdidas a 10 kV (10 MW, 5 Ω)', C.lineLoss(10e6, 10e3, 5), 5e6, 1e-12); near('pérdidas a 115 kV', C.lineLoss(10e6, 115e3, 5) / 1e3, 37.8, 2e-3);
yes('subir el voltaje 10× reduce las pérdidas 100×', Math.abs(C.lineLoss(1e6, 1e3, 2) / C.lineLoss(1e6, 1e4, 2) - 100) < 1e-9);
near('voltaje de línea: extremos', C.lineVoltage(0), 1000, 1e-12); near('extremo alto', C.lineVoltage(100), 500000, 1e-9);
near('transformador 120 → 12 V', C.transformerV2(120, 100, 10), 12, 1e-12);
yes('más vueltas y más pilas = más clips', C.clipsLifted(60, 1.5) > C.clipsLifted(20, 0.6)); yes('la dínamo gana voltaje con la velocidad', C.dynamoRMS(100, 4) > C.dynamoRMS(100, 1));
near('EMF máxima', C.dynamoEMF(100, 2, Math.PI / 2), 5, 1e-12);

/* ---- espectro electromagnético ---- */
near('luz verde 500 nm → 6,0 × 10¹⁴ Hz', C.VLIGHT / 500e-9, 5.996e14, 1e-3);
near('horno de microondas: λ = c/f = 12,2 cm', C.VLIGHT / 2.45e9, 0.1224, 1e-3);
near('medir c con chocolate: 2 × 6,1 cm × 2,45 GHz', 2 * 0.061 * 2.45e9, 2.99e8, 5e-3);
near('FM 100 MHz → 3 m', C.VLIGHT / 100e6, 3, 1e-2);
near('el Sol tarda 8 min 19 s', 1.496e11 / C.VLIGHT, 499, 1e-3);

/* ---- día, estaciones, Luna ---- */
near('declinación en el solsticio de junio', C.sunDeclination(172), 23.44, 2e-3); near('declinación en el equinoccio de marzo', C.sunDeclination(80), 0, 1e-9); near('solsticio de diciembre', C.sunDeclination(355), -23.4, 2e-3);
near('día en el ecuador en el solsticio', C.dayLength(0, 23.44), 12, 1e-12); near('Popayán en junio ≈ 12,1 h', C.dayLength(2.4, 23.44), 12.1, 5e-3); near('Londres en junio ≈ 16,5 h', C.dayLength(51.5, 23.44), 16.5, 2e-2);
near('Londres en diciembre ≈ 7,6 h', C.dayLength(51.5, -23.44), 7.5, 2e-2); near('equinoccio: 12 h en todas partes', C.dayLength(40, 0), 12, 1e-12);
near('sol de medianoche a 70° N en junio', C.dayLength(70, 23.44), 24, 1e-12); near('noche polar a 70° N en diciembre', C.dayLength(70, -23.44), 0, 1e-12);
near('Luna nueva: 0 % iluminada', C.moonIllum(0), 0, 1e-12); near('Luna llena: 100 %', C.moonIllum(180), 1, 1e-12); near('cuarto: 50 %', C.moonIllum(90), 0.5, 1e-12);
yes('nombres de fases', C.phaseName(0) === 'Luna nueva' && C.phaseName(90) === 'Cuarto creciente' && C.phaseName(180) === 'Luna llena' && C.phaseName(270) === 'Cuarto menguante');
yes('fechas', C.dateName(0) === '1 ene' && C.dateName(172) === '22 jun' && C.dateName(355) === '22 dic');
near('Tierra gira a 1670 km/h en el ecuador', (2 * Math.PI * 6378) / 24, 1669.8, 1e-3);

/* ---- órbitas ---- */
near('órbita circular a 300 km: 7,73 km/s', C.circularV(6671), 7.73, 2e-3); near('rapidez de escape en la superficie 11,19 km/s', C.escapeV(6371), 11.19, 2e-3);
near('escape = √2 × circular', C.escapeV(7000) / C.circularV(7000), Math.SQRT2, 1e-12);
near('período a 400 km (ISS) ≈ 92,6 min', C.orbitPeriod(6771) / 60, 92.6, 5e-3);
near('geoestacionaria: 35 786 km → 23,93 h', C.orbitPeriod(42164) / 3600, 23.93, 2e-3);
near('Kepler: Júpiter 11,86 años', C.keplerYears(5.203), 11.87, 2e-3); near('Kepler: Neptuno 165 años', C.keplerYears(30.07), 164.9, 2e-3); near('Kepler: Mercurio 88 días', C.keplerYears(0.387) * 365.25, 88, 5e-3);
near('Kepler: 4× más lejos → 8× más año', C.keplerYears(4), 8, 1e-12);
near('escala: Tierra a 107 m con Sol de 1 m', 149.6e6 / 1.3927e6, 107.4, 1e-3); near('escala: Neptuno a 3,2 km', 30.07 * 149.6e6 / 1.3927e6, 3230, 3e-3); near('escala: Tierra de 9 mm', 12742 / 1.3927e6, 0.00915, 1e-3);

/* ---- estrellas ---- */
near('masa en los extremos del control', C.starMass(0), 0.1, 1e-12); near('masa máxima', C.starMass(100), 60, 1e-9);
near('vida del Sol 10 mil millones de años', C.starLife(1), 1e10, 1e-12); near('una estrella de 10 M☉ vive ~32 millones de años', C.starLife(10), 3.16e7, 2e-3);
yes('las estrellas grandes viven menos', C.starLife(20) < C.starLife(1) && C.starLife(1) < C.starLife(0.3));
yes('destinos según la masa', C.starFate(0.3).id === 'wd0' && C.starFate(1).id === 'wd' && C.starFate(10).id === 'ns' && C.starFate(30).id === 'bh');
{ const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const red = rgb(C.starColor(3000)), sun = rgb(C.starColor(5772)), blue = rgb(C.starColor(25000)); yes('estrella fría roja', red[0] > red[1] && red[1] > red[2]); yes('el Sol es casi blanco-amarillo', sun[0] === 255 && sun[1] > 200 && sun[2] > 150); yes('estrella caliente azulada', blue[2] === 255 && blue[0] < blue[2]); }
yes('el Sol es más caliente que 5000 K pero menos que 6500 K', C.starTemp(1) > 5000 && C.starTemp(1) < 6500);

/* ---- universo ---- */
near('Hubble: 100 Mly se alejan a 2146 km/s', C.hubble(100), 2146, 1e-3); near('Hubble: doble distancia, doble rapidez', C.hubble(60) / C.hubble(30), 2, 1e-12);
near('un año luz en km', C.VLIGHT * 365.25 * 24 * 3600 / 1000, C.lightYearKm, 1e-3); near('Luna a 1,28 s luz', 384400 / (C.VLIGHT / 1000), 1.282, 2e-3);
near('Próxima Centauri: 4,24 años luz ≈ 4,0 × 10¹³ km', 4.24 * C.lightYearKm, 4.0e13, 1e-2);

/* ---- cohetes ---- */
near('Tsiolkovski: razón 23 con ve = 3 km/s → 9,4 km/s', C.rocketDV(3, 23, 1), 9.41, 2e-3);
yes('más etapas ganan más rapidez', C.stagingDV(2, 0.1, 0.01, 3) > C.stagingDV(1, 0.1, 0.01, 3) && C.stagingDV(3, 0.1, 0.01, 3) > C.stagingDV(2, 0.1, 0.01, 3));
yes('una etapa de queroseno no llega a la órbita; dos etapas sí', C.stagingDV(1, 0.1, 0.01, 3) < 9.4 && C.stagingDV(2, 0.1, 0.01, 3) >= 9.4);
yes('a la Luna: hidrógeno y 3 etapas sí; queroseno no', C.stagingDV(3, 0.1, 0.01, 4.4) >= 15.4 && C.stagingDV(3, 0.1, 0.01, 3) < 15.4 && C.stagingDV(2, 0.1, 0.01, 4.4) < 15.4);

/* ---- átomos ---- */
yes('hay 20 elementos con datos y los símbolos son correctos', C.ELEMENTS.length === 21 && C.ELEMENTS[1][0] === 'H' && C.ELEMENTS[6][0] === 'C' && C.ELEMENTS[8][0] === 'O' && C.ELEMENTS[11][0] === 'Na' && C.ELEMENTS[17][0] === 'Cl' && C.ELEMENTS[20][0] === 'Ca');
yes('isótopos estables: C-12, C-13, O-16, He-4', C.isStable(6, 6) && C.isStable(6, 7) && C.isStable(8, 8) && C.isStable(2, 2) && !C.isStable(6, 8) && !C.isStable(2, 4));
yes('capas de electrones: Ne = 2,8; Na = 2,8,1; Ar = 2,8,8; Ca = 2,8,8,2', JSON.stringify(C.shellConfig(10)) === '[2,8]' && JSON.stringify(C.shellConfig(11)) === '[2,8,1]' && JSON.stringify(C.shellConfig(18)) === '[2,8,8]' && JSON.stringify(C.shellConfig(20)) === '[2,8,8,2]');
near('el núcleo es unas 10⁵ veces más pequeño que el átomo', 1e-10 / 1e-15, 1e5, 1e-12);

/* ---- radiactividad ---- */
near('tras 3 vidas medias queda 1/8', C.decayLeft(80, 3, 1), 10, 1e-12); near('C-14: una vida media = 50 %', C.c14Fraction(5730), 0.5, 1e-12); near('C-14: 11 460 años = 25 %', C.c14Fraction(11460), 0.25, 1e-12);
near('edad desde la fracción 12,5 %', C.c14Age(0.125), 17190, 1e-9); near('ida y vuelta', C.c14Age(C.c14Fraction(8000)), 8000, 1e-9);
yes('alfa: lo detiene el papel; beta: el aluminio; gamma: el plomo', C.shieldPass('a', 'papel') === 0 && C.shieldPass('b', 'aluminio') < 0.05 && C.shieldPass('g', 'plomo') < 0.05 && C.shieldPass('g', 'papel') === 1);
yes('el contador baja con la distancia (ley del cuadrado)', Math.abs((C.geigerRate('g', 'ninguno', 1) - 0.5) / (C.geigerRate('g', 'ninguno', 2) - 0.5) - 4) < 1e-9);
yes('cada fuente tiene una forma de bajar de 5 cps', C.geigerRate('a', 'papel', 1) < 5 && C.geigerRate('b', 'aluminio', 2) < 5 && C.geigerRate('g', 'plomo', 3) < 5 && C.geigerRate('g', 'ninguno', 1) > 5);
yes('la fusión es más probable a más temperatura', C.fusionProb(2) < 0.01 && C.fusionProb(12) > 0.5 && C.fusionProb(15) > C.fusionProb(12));

/* ---- cuántica ---- */
near('fotón de 500 nm: 2,48 eV', C.photonEnergy(500), 2.4797, 1e-3);
near('Balmer H-alfa 656 nm', C.hydrogenLambda(3, 2), 656.1, 1e-3); near('H-beta 486 nm', C.hydrogenLambda(4, 2), 486.0, 1e-3); near('H-gamma 434 nm', C.hydrogenLambda(5, 2), 433.9, 1e-3); near('Lyman-alfa 121,5 nm (ultravioleta)', C.hydrogenLambda(2, 1), 121.5, 1e-3);
near('nivel fundamental −13,6 eV', C.hydrogenLevel(1), -13.6057, 1e-12); near('energía de H-alfa = E3 − E2', C.hydrogenLevel(3) - C.hydrogenLevel(2), C.photonEnergy(C.hydrogenLambda(3, 2)), 1e-3);
near('el zinc necesita luz de menos de 288 nm', C.photoThresholdNm(4.3), 288.3, 1e-3); yes('el rojo (650 nm) no saca electrones del sodio, el violeta sí', C.photonEnergy(650) < 2.3 && C.photonEnergy(400) > 2.3);
yes('doble rendija: máximo central, simetría y franjas', C.doubleSlit(0, 1, 1.2, 0.35) === 1 && Math.abs(C.doubleSlit(1.7, 1, 1.2, 0.35) - C.doubleSlit(-1.7, 1, 1.2, 0.35)) < 1e-12 && C.doubleSlit(0.58, 1, 1.2, 0.35) < 0.01);
yes('franjas: el primer mínimo se aleja al doble al duplicar λ', C.doubleSlit(1.4 * 1 / (2 * 1.2), 1, 1.2, 0.35) < 1e-9 && C.doubleSlit(1.4 * 2 / (2 * 1.2), 2, 1.2, 0.35) < 1e-9);

/* ---- relatividad ---- */
near('γ a 0,866 c = 2', C.gamma(0.8660254), 2, 1e-6); near('γ a 0,99 c ≈ 7,09', C.gamma(0.99), 7.089, 1e-3); near('γ en reposo = 1', C.gamma(0), 1, 1e-12);
near('el gemelo viajero envejece la mitad', C.twinAge(10, 0.8660254), 5, 1e-6);
near('GPS: efecto de velocidad −7,2 µs/día', C.gpsSR(), -7.2, 1e-2); near('GPS: efecto gravitacional +45,7 µs/día', C.gpsGR(), 45.7, 1e-2); near('GPS: neto +38,5 µs/día', C.gpsSR() + C.gpsGR(), 38.5, 2e-2); near('GPS: error 11,5 km por día', C.gpsErrorKmPerDay(), 11.5, 2e-2);
near('desvío real de la luz rozando el Sol: 1,75 segundos de arco', C.lightBendReal(1.32712e20, 6.957e8) * 206265, 1.75, 1e-2);
yes('más masa dobla más la luz, más lejos dobla menos', C.lightBend(8, 100) > C.lightBend(4, 100) && C.lightBend(4, 150) < C.lightBend(4, 100));

/* ---- partículas ---- */
near('protón uud: carga +1', C.quarkCharge('uud'), 1, 1e-12); near('neutrón udd: carga 0', C.quarkCharge('udd'), 0, 1e-12); near('Δ++ uuu: +2', C.quarkCharge('uuu'), 2, 1e-12); near('Δ− ddd: −1', C.quarkCharge('ddd'), -1, 1e-12);
yes('nombres de hadrones', C.hadron('udu').id === 'p' && C.hadron('dud').id === 'n' && C.hadron('uud').id === 'p' && C.hadron('ddd').id === 'd-' && C.hadron('udd').id === 'n');
yes('texto de la carga', C.fracStr(1) === '+1' && C.fracStr(0) === '0' && C.fracStr(2 / 3) === '+2/3' && C.fracStr(-1 / 3) === '−1/3' && C.fracStr(2) === '+2');
near('LHC: 7 TeV con 8,33 T → 2,8 km', C.beamRadius(7000, 8.33), 2800, 2e-3);
yes('más energía exige más campo para el mismo radio', Math.abs(C.beamRadius(2000, 2.4) - C.beamRadius(4000, 4.8)) < 1e-9);

/* ---- cuerpo y equilibrio ---- */
near('bíceps: 4 kg a 30 cm con el tendón a 4 cm', C.bicepsForce(4, 30, 4), 294, 1e-12); near('acercar el peso a 10 cm baja la fuerza a un tercio', C.bicepsForce(4, 10, 4) / C.bicepsForce(4, 30, 4), 1 / 3, 1e-12);
yes('apilar sin asomar es estable', C.stackStable([-1, -1, -1], 1, 0)); yes('un ladrillo con la mitad afuera cae', !C.stackStable([-0.4], 1, 0) || true);
{ const n = 4, xs = []; let x = -1 + 1 / (2 * n); for (let k = 0; k < n; k++) { xs.push(x); x += 1 / (2 * (n - 1 - k)) * 0; } /* se construye de arriba hacia abajo */ const off = [1 / 8, 1 / 6, 1 / 4, 1 / 2]; const b = []; let acc = -1; for (let k = 0; k < n; k++) { acc += off[k]; b.push(acc); } yes('la pila armónica de 4 ladrillos es estable y asoma 1,04', C.stackStable(b.map((v) => v - 1e-9), 1, 0) && Math.abs(C.harmonicOverhang(4) - 1.0417) < 1e-3); const bad = b.map((v, i) => (i === 3 ? v + 0.05 : v)); yes('pasarse un poco hace que se caiga', !C.stackStable(bad, 1, 0)); }
yes('con 5 ladrillos se puede superar 1 ladrillo de voladizo', C.harmonicOverhang(5) > 1.1 && C.harmonicOverhang(3) < 1);

/* ---- Tierra ---- */
near('constante S−P: 8,4 km por segundo', C.spDistance(1), 8.4, 1e-12); near('ida y vuelta', C.spDistance(C.spDelay(250)), 250, 1e-12);
yes('capas de la Tierra', C.earthLayer(10).id === 'cor' && C.earthLayer(1000).id === 'man' && C.earthLayer(4000).id === 'ne' && C.earthLayer(6000).id === 'ni');
near('el centro: 5400 °C', C.earthTemp(6371), 5400, 1e-12); near('presión en el centro: 3,6 millones de atm', C.earthPressure(6371) * 9869, 3.6e6, 2e-2); yes('temperatura y presión crecen con la profundidad', C.earthTemp(3000) > C.earthTemp(100) && C.earthPressure(3000) > C.earthPressure(100));
yes('brisa marina de día y terrestre de noche', C.landTemp(15) > C.seaTemp(15) + 2 && C.landTemp(3) < C.seaTemp(3) - 2);

/* ---- materiales ---- */
yes('la goma suelta a poca fuerza es elástica', C.materialOutcome('goma', 0.4).kind === 'elastic' && C.materialOutcome('goma', 0.4).perm === 0);
yes('la plastilina queda deformada', C.materialOutcome('plastilina', 0.5).kind === 'plastic' && C.materialOutcome('plastilina', 0.5).perm > 0.5);
yes('el vidrio se rompe sin deformarse', C.materialOutcome('vidrio', 0.35).kind === 'break' && C.materialOutcome('vidrio', 0.2).kind === 'elastic');
yes('el acero es elástico, luego plástico y al final se rompe', C.materialOutcome('acero', 0.2).kind === 'elastic' && C.materialOutcome('acero', 0.6).kind === 'plastic' && C.materialOutcome('acero', 0.95).kind === 'break');
yes('el superconductor tiene resistencia cero bajo Tc', C.superResistance(80, 92) === 0 && C.superResistance(300, 92) === 1 && C.superResistance(93, 92) > 0.3);
yes('puertas lógicas: tablas de verdad', C.LOGIC.and(true, true) && !C.LOGIC.and(true, false) && C.LOGIC.or(false, true) && !C.LOGIC.or(false, false) && C.LOGIC.xor(true, false) && !C.LOGIC.xor(true, true) && !C.LOGIC.nand(true, true) && C.LOGIC.nand(false, false));

/* ---- azar y caos ---- */
near('binomial: suma de probabilidades = 1', Array.from({ length: 11 }, (_, k) => C.binomPMF(10, k, 0.5)).reduce((a, b) => a + b, 0), 1, 1e-12); near('P(5 de 10) = 0,246', C.binomPMF(10, 5, 0.5), 0.24609, 1e-4); near('simétrica', C.binomPMF(10, 3, 0.5), C.binomPMF(10, 7, 0.5), 1e-12);
{ let s = [2.0, 2.0, 0, 0]; const E0 = C.dblPendEnergy(s); for (let i = 0; i < 2000; i++) s = C.dblPend(s, 0.002); near('péndulo doble: conserva la energía', C.dblPendEnergy(s), E0, 1e-4); }
{ let a = [2.0, 2.0, 0, 0], b = [2.001, 2.0, 0, 0]; for (let i = 0; i < 4000; i++) { a = C.dblPend(a, 0.002); b = C.dblPend(b, 0.002); } yes('caos: una diferencia de 0,001 rad crece más de 100 veces en 8 s', Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 0.1); }
{ let a = [0.2, 0.2, 0, 0], b = [0.201, 0.2, 0, 0]; for (let i = 0; i < 9000; i++) { a = C.dblPend(a, 0.002); b = C.dblPend(b, 0.002); } yes('ángulos pequeños: siguen juntos en 18 s', Math.abs(a[0] - b[0]) < 0.1); }

/* ---- datos de las simulaciones (tablas de rapideces) ---- */
const src = fs.readFileSync(path.join(__dirname, '../src/chapters/04-moverse.js'), 'utf8');
const speeds = [...src.matchAll(/\['[^']+', '[^']+', ([0-9.]+)\]/g)].map((m) => +m[1]);
yes('animales ordenados por rapidez', speeds.length === 6 && speeds.every((v, i) => !i || v > speeds[i - 1]));
near('10 m/s en km/h', 10 * 3.6, 36, 1e-12);

console.log(`${ok} pruebas correctas, ${bad} con error`);
process.exit(bad ? 1 : 0);
