/* Pruebas del motor de metrología: node test/engine.test.js */
const M = require('../src/engine.js');
let ok = 0, mal = 0;
const t = (c, msg) => { if (c) ok++; else { mal++; console.log('FALLA:', msg); } };
const cerca = (a, b, tol, msg) => t(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const R = M.rng(12345);

/* 1 · unidades */
cerca(M.convertir(1, 'in', 'mm'), 25.4, 1e-12, 'in→mm');
cerca(M.convertir(12.7, 'mm', 'in'), 0.5, 1e-12, 'mm→in');
cerca(M.convertir(1.25, 'mm', 'um'), 1250, 1e-9, 'mm→µm');
cerca(M.convertir(1, 'ft', 'in'), 12, 1e-12, 'ft→in');
cerca(M.convertir(1, 'm', 'nm'), 1e9, 1, 'm→nm');
cerca(M.convertir(0.001, 'in', 'um'), 25.4, 1e-9, 'mil→µm');
for (let i = 0; i < 200; i++) {
  const v = R() * 1000, ks = Object.keys(M.UNIDADES), u1 = ks[Math.floor(R() * ks.length)], u2 = ks[Math.floor(R() * ks.length)];
  cerca(M.convertir(M.convertir(v, u1, u2), u2, u1), v, 1e-9 * v, 'ida y vuelta');
}
t(M.fmt(-0.0001, 2) === '0,00', 'sin cero negativo');

/* 2 · resoluciones */
const lcs = { v010: 0.1, v005: 0.05, v002: 0.02, vin: 0.001, m010: 0.01, m001: 0.001, min: 0.001 };
Object.entries(lcs).forEach(([id, lc]) => cerca(M.instr(id).lc, lc, 1e-12, 'resolución ' + id));
t(M.instr('vin').lcMM === 0.0254, 'vernier in en mm');

/* 3 · lectura: ida y vuelta para todas las posiciones y partes coherentes */
M.INSTRUMENTOS.forEach((I) => {
  const cmax = Math.floor(I.rango / I.lc);
  for (let c = -30; c <= cmax; c += (c < 200 ? 1 : 7)) {
    const p = c * I.lc * I.f, L = M.lectura(I, p);
    t(L.c === c, `${I.id} c=${c} leyó ${L.c}`);
    if (I.tipo === 'vernier') { cerca(L.principal + L.fino, c * I.lc, 1e-9, I.id + ' suma'); t(L.k >= 0 && L.k < I.N, I.id + ' k en rango'); }
    else { cerca(L.manguito + L.tambor + L.nonioV, c * I.lc, 1e-9, I.id + ' suma micro'); t(L.t >= 0 && L.t < I.nT, I.id + ' t'); }
  }
  const c0 = 40;
  cerca(M.lectura(I, (c0 + 0.3) * I.lc * I.f).valor, c0 * I.lc, 1e-9, I.id + ' redondeo abajo');
  cerca(M.lectura(I, (c0 + 0.7) * I.lc * I.f).valor, (c0 + 1) * I.lc, 1e-9, I.id + ' redondeo arriba');
});
cerca(M.lectura(M.instr('v005'), 37.45).valor, 37.45, 1e-9, 'v005 37,45');
t(M.lectura(M.instr('v005'), 37.45).k === 9, 'v005 k=9');
const l2 = M.lectura(M.instr('m001'), 12.583); t(l2.s === 25 && l2.t === 8 && l2.v === 3, 'm001 12,583 → 12,5 + 0,08 + 0,003');
const l3 = M.lectura(M.instr('m010'), 5.78); t(l3.manguito === 5.5 && l3.t === 28, 'm010 5,78');
cerca(M.lectura(M.instr('min'), 0.2345 * 25.4).valor, 0.235, 1e-9, 'min 0,2345 in → 0,235 (redondeo)');

/* 4 · geometría del nonio (coincidencias que se dibujan) */
M.INSTRUMENTOS.filter((I) => I.tipo === 'vernier').forEach((I) => {
  for (let c = 0; c < 400; c += 3) {
    const p = c * I.lc * I.f, L = M.lectura(I, p), dmm = I.div * I.f, vd = dmm * (I.N - 1) / I.N;
    cerca(p + L.k * vd, (L.M + L.k) * dmm, 1e-9, `${I.id} línea ${L.k} coincide con la marca ${L.M + L.k}`);
    const xv = p + (L.k + 1) * vd;
    t(Math.abs(xv - Math.round(xv / dmm) * dmm) > 1e-9, `${I.id} la vecina no coincide`);
  }
});
M.INSTRUMENTOS.filter((I) => I.tipo === 'micro' && I.nonio).forEach((I) => {
  for (let c = 0; c < 3000; c += 7) {
    const pm = I.paso * I.f, p = c * I.lc * I.f, L = M.lectura(I, p), tpos = ((p / pm) % 1) * I.nT, dTh = 2 * Math.PI / I.nT;
    cerca((L.t + L.v - tpos) * dTh, 0.9 * L.v * dTh, 1e-6, `${I.id} nonio ${L.v} coincide con la línea ${L.t + L.v} del tambor`);
  }
});

/* 5 · contacto, fuerza y deformación */
const bco = M.banco(5), vm = M.instr('m010'), vv = M.instr('v005');
const hard = M.contacto(vm, bco, 'ext', 12.7, 11, 'trinquete', 1e5);
t(hard.contacto && hard.slip && Math.abs(hard.F - bco.instr.m010.Fr) < 0.3, 'el trinquete limita la fuerza');
const f0 = M.contacto(vm, bco, 'ext', 12.7, 13, 'trinquete', 1e5); t(!f0.contacto && f0.g === 13, 'sin contacto');
const sof1 = M.contacto(vm, bco, 'ext', 3.53, 3.0, 'trinquete', 55), sof2 = M.contacto(vm, bco, 'ext', 3.53, 3.0, 'tambor', 55);
t(sof2.g < sof1.g - 0.1, `tambor aplasta más que trinquete (${sof1.g} vs ${sof2.g})`);
t(sof2.F > 2 * sof1.F, 'tambor aplica más fuerza');
const rig = M.contacto(vm, bco, 'ext', 20, 19.5, 'tambor', 5e4); t(20 - rig.g < 0.08 && rig.g < 20, 'pieza rígida con tambor: el marco cede');
const cv = M.contacto(vv, bco, 'ext', 20, 19.9, 'trinquete', 5e4); t(cv.F > 0 && cv.F < 8, 'vernier con apriete suave');
const cint = M.contacto(vv, bco, 'int', 12, 12.2, 'trinquete', 4e4); t(cint.g > 12 && cint.contacto, 'interior: se abre contra la pared');
const cero = M.contacto(vm, bco, 'cero', 0, -1, 'trinquete', 1e6); t(cero.g < 0 && cero.g > -0.005, 'cierre con trinquete: el marco cede micras');
t(!M.compatible(vm, M.objeto('arandela').attrs[1], 8.4).ok, 'el micrómetro no mide interiores');
t(!M.compatible(vm, M.objeto('laton').attrs[0], 40).ok, 'el micrómetro no mide 40 mm');
t(M.compatible(vv, M.objeto('laton').attrs[0], 40).ok, 'el vernier sí');

/* 6 · evaluación de lecturas */
const v5 = M.instr('v005'), p = 37.45;
t(M.evaluar(v5, p, '37,45', 'mm').ok, 'lectura correcta'); t(M.evaluar(v5, p, '37.45', 'mm').ok, 'punto decimal');
t(M.evaluar(v5, p, '3,745', 'cm').ok, 'en cm'); t(M.evaluar(v5, p, '1,4744', 'in').ok, 'en pulgadas');
t(M.evaluar(v5, p, '0,03745', 'm').ok, 'en metros'); t(M.evaluar(v5, p, '37450', 'um').ok, 'en micras');
t(M.evaluar(v5, p, '37,4', 'mm').ok === false, '37,4 está mal');
t(M.evaluar(v5, p, '374,5', 'mm').tipo === 'unidad', 'factor 10'); t(M.evaluar(v5, p, '37,45', 'cm').tipo === 'unidad', 'cm en vez de mm');
t(M.evaluar(v5, p, '38,45', 'mm').tipo === 'paso', 'una división de regla'); t(M.evaluar(v5, p, '37,40', 'mm').tipo === 'cerca', 'línea vecina');
const mm1 = M.instr('m010'); t(M.evaluar(mm1, 7.84, '7,34', 'mm').tipo === 'paso', 'olvidó 0,5 mm'); t(M.evaluar(mm1, 7.84, '7,84', 'mm').ok, 'micrómetro correcto');
t(M.evaluar(mm1, 7.84, '7,80', 'mm', { cero: 0.04 }).tipo === 'cero', 'detecta cero ya restado');
t(M.evaluar(mm1, 7.84, '', 'mm').tipo === 'vacio', 'vacío');

/* 7 · estadística e incertidumbre */
const s = M.estadistica([10, 12, 14]); cerca(s.media, 12, 1e-12, 'media'); cerca(s.s, 2, 1e-12, 's'); cerca(s.sm, 2 / Math.sqrt(3), 1e-12, 'sm');
cerca(M.incertidumbre(0.02, { sm: 0 }, false), 0.01, 1e-12, 'u por resolución'); cerca(M.incertidumbre(0.02, { sm: 0 }, true), Math.sqrt(2) * 0.01, 1e-12, 'u con cero');
let r = M.redondeoInc(12.3456, 0.0273); t(r.dec === 2 && Math.abs(r.v - 12.35) < 1e-9 && Math.abs(r.u - 0.03) < 1e-9, 'redondeo 12,35 ± 0,03');
r = M.redondeoInc(7.8512, 0.0146); t(r.dec === 3 && Math.abs(r.u - 0.015) < 1e-9, 'u que empieza por 1 lleva 2 cifras');

/* 8 · bancos y piezas */
t(JSON.stringify(M.banco(7)) === JSON.stringify(M.banco(7)), 'banco determinista');
t(JSON.stringify(M.banco(7).instr) !== JSON.stringify(M.banco(8).instr), 'bancos distintos');
let ceros = 0;
for (let n = 1; n <= 24; n++) {
  const b = M.banco(n);
  M.INSTRUMENTOS.forEach((I) => { t(Math.abs(b.instr[I.id].e0) <= 7 * I.lcMM, `e0 razonable ${n} ${I.id}`); if (b.instr[I.id].z !== 0) ceros++; t(b.instr[I.id].Fr >= 5 && b.instr[I.id].Fr <= 8.6, 'Fr'); });
}
t(ceros > 24 * 4, 'la mayoría de los instrumentos trae error de cero');
M.OBJETOS.forEach((o) => o.attrs.forEach((a) => {
  for (let n = 1; n <= 24; n += 5) {
    const v = M.valorVerdadero(n, o.id, a.id); t(Math.abs(v - a.nom) <= 3 * a.dev + 1e-9, `${o.id}.${a.id} dentro de la tolerancia (${v} vs ${a.nom})`);
    for (let ps = 0; ps <= 1; ps += 0.25) for (let g = 0; g < Math.PI; g += 0.6) {
      const S = M.tamLocal(n, o.id, a.id, ps, g);
      t(Math.abs(S - v) <= a.conic / 2 + a.oval + a.rug + 1e-9, `${o.id}.${a.id} variación local acotada`); t(S > 0, 'tamaño positivo');
    }
  }
}));
M.OBJETOS.filter((o) => o.masa).forEach((o) => {
  const m = M.masaPieza(3, o.id), P = M.pieza(3, o.id), d = {}; o.attrs.forEach((a) => { d[a.id] = P.attrs[a.id].nomReal; });
  cerca(m, o.rho * M.volumen(o.vol[0], d) / 1000, 0.011, 'masa de ' + o.id);
});

/* 9 · estudiante virtual: 24 bancos, técnica correcta con micrómetro (trinquete) */
let peor = 0;
for (let n = 1; n <= 24; n++) {
  const b = M.banco(n), I = M.instr('m010');
  const lec = (S, k) => { const c = M.contacto(I, b, 'ext', S, S - 1, 'trinquete', k); return M.lectura(I, M.posicion(I, b, c.g)).valor; };
  const z = lec(0, 1e6), o = M.objeto('esfera'), vals = [];
  for (let i = 0; i < 5; i++) vals.push(lec(M.tamLocal(n, 'esfera', 'D', i / 4, i * 0.7), o.k) - z);
  peor = Math.max(peor, Math.abs(M.estadistica(vals).media - M.valorVerdadero(n, 'esfera', 'D')));
}
t(peor < 0.016, 'micrómetro + cero + trinquete: error de la esfera < 16 µm (peor ' + peor.toFixed(4) + ')');
let sinCero = 0;
for (let n = 1; n <= 24; n++) { const b = M.banco(n), I = M.instr('v002'), S = 20, c = M.contacto(I, b, 'ext', S, S - 0.2, 'trinquete', 5e4); if (Math.abs(M.lectura(I, M.posicion(I, b, c.g)).valor - S) > 0.03) sinCero++; }
t(sinCero >= 8, 'sin corregir el cero se nota en muchos bancos del vernier (' + sinCero + '/24)');
for (let n = 1; n <= 24; n++) {
  const b = M.banco(n), I = M.instr('m010'), S = M.valorVerdadero(n, 'oring', 'd');
  const a = M.contacto(I, b, 'ext', S, S - 0.5, 'trinquete', 55).g, c = M.contacto(I, b, 'ext', S, S - 0.5, 'tambor', 55).g;
  t(c < a - 0.15, `banco ${n}: tambor aplasta el O-ring`);
}

/* 10 · pasos explicativos */
M.INSTRUMENTOS.forEach((I) => { const ps = M.pasos(I, 12.34); t(ps.length >= 3 && ps.every((x) => typeof x === 'string' && x.length > 20), 'pasos ' + I.id); });
t(M.pasos(M.instr('m010'), 7.84)[0].includes('medio milímetro'), 'paso del manguito menciona 0,5 mm');
t(!M.pasos(M.instr('m010'), 7.34)[0].includes('+0,5'), 'sin marca inferior no suma 0,5');

/* 11 · entrenador */
M.INSTRUMENTOS.forEach((I) => { for (let i = 0; i < 100; i++) { const q = M.lecturaAleatoria(I, R), L = M.lectura(I, q.pMM); t(L.c === q.c && L.valor >= 0 && L.valor <= I.rango, 'lectura aleatoria válida ' + I.id); } });

console.log(`\n${ok} pruebas pasadas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
