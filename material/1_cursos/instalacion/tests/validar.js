/* Pruebas de la biblioteca del taller (sin DOM): node tests/validar.js */
const cargar = require('./cargar');
const RT = cargar();
const L = RT.L, O = L.O, N = L.N, C = L.C;
let ok = 0, mal = 0;
const t = (nombre, cond, extra) => { if (cond) ok++; else { mal++; console.log('✗', nombre, extra === undefined ? '' : extra); } };

/* 1. Estado inicial: sin decisiones, todo pendiente o con fallas esperables */
let E = O.nuevo({ lote: 'A' });
t('el estado inicial tiene 9 circuitos', E.circuitos.length === 9);
t('las tomas tienen tipo de aparato', E.puntos.filter((p) => p.tipo === 'toma').every((p) => ['comun', 'gfci', 'gfci-ip'].includes(p.ap)));
let ini = O.puntaje(E);
t('al inicio ninguna etapa de decisiones está lista', ['acometida', 'tierra', 'circuitos', 'canal', 'tablero', 'cableado', 'pruebas'].every((k) => !ini.por[k].listo));
t('el plano base cumple 210.52 y GFCI (sin fallas)', ini.por.plano.falla === 0, ini.por.plano.items.filter((i) => i.estado === 'falla').map((i) => i.texto));

/* 2. Solución de referencia: todas las etapas de diseño en verde */
O.aplicarReferencia(E);
const por = O.puntaje(E).por;
for (const k of ['plano', 'acometida', 'tierra', 'circuitos', 'canal', 'tablero']) {
  const r = por[k];
  t('referencia: ' + k + ' sin fallas ni pendientes', r.falla === 0 && r.pend === 0, r.items.filter((i) => i.estado === 'falla' || i.estado === 'pend').map((i) => i.estado + ': ' + i.texto));
}
const ac = por.acometida.info;
t('demanda 12,8 kVA y 53 A', Math.abs(ac.dem.total - 12800) < 400 && Math.abs(ac.I - 53) < 2, [ac.dem.total, ac.I]);
t('acometida mínima 6 AWG', ac.min === '6');
t('capacidad instalable 13,2 kVA', Math.abs(ac.ci.kVA - 13.2) < 0.1, ac.ci.kVA);

/* 3. Errores típicos se detectan */
let X = O.clon(E);
X.circuitos.find((c) => c.id === 'C1').awg = '14'; X.circuitos.find((c) => c.id === 'C2').In = 30;
t('C2 de 30 A con 12 AWG falla', O.ev.circuitos(X).items.some((i) => i.c === 'C2' && i.estado === 'falla'));
X = O.clon(E); X.circuitos.find((c) => c.id === 'C4').In = 15; X.circuitos.find((c) => c.id === 'C4').awg = '14';
t('C4 de 15 A con 14 AWG falla (pequeños artefactos)', O.ev.circuitos(X).items.some((i) => i.c === 'C4' && i.estado === 'falla'));
X = O.clon(E); X.circuitos.find((c) => c.id === 'C7').In = 20;
t('ducha de 20 A falla', O.ev.circuitos(X).items.some((i) => i.c === 'C7' && i.estado === 'falla'));
X = O.clon(E); X.tab.sitio = 'bano';
t('tablero en el baño falla', O.ev.tablero(X).items.some((i) => i.estado === 'falla' && /baño/.test(i.texto)));
X = O.clon(E); X.tierra.rods = [{ x: 1, y: -1.2 }]; X.lote = 'B'; X.seco = true;
t('un solo electrodo en el lote B seco supera 25 Ω', O.ev.tierra(X).items.some((i) => i.estado === 'falla' && /25 Ω/.test(i.texto)), O.tierraInfo(X).R);
X = O.clon(E); X.canal.mat = 'PVC'; X.circuitos.find((c) => c.id === 'C2').tubo = '1/2';
X.canal.cajas.apar = 'rect-pvc'; X.canal.nodo = {};
t('cajas rectangulares pequeñas fallan en nodos con muchos conductores', O.ev.canal(X).items.some((i) => i.estado === 'falla' && /314/.test(i.ref)));
X = O.clon(E); X.acom.awg = '8';
t('8 AWG no soporta la demanda', O.ev.acometida(X).items.some((i) => i.estado === 'falla' && /8 AWG/.test(i.texto)));

/* 4. Plano: borrar tomas de la sala falla 210.52; restaurar pasa */
X = O.clon(E);
['TS1', 'TS2', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7'].forEach((id) => O.quitarPunto(X, id));
t('sala sin tomas falla', O.ev.plano(X).items.some((i) => i.estado === 'falla' && /Sala/.test(i.texto)));
t('el árbol sigue conexo tras quitar puntos', X.circuitos.find((c) => c.id === 'C2').arbol.every(([u, v]) => u === 'TG' || X.puntos.some((p) => p.id === u) ) );
X = O.clon(E); X.puntos.filter((p) => p.tipo === 'toma').forEach((p) => { p.ap = 'comun'; });
t('sin GFCI el plano falla', O.ev.plano(X).falla > 0);

/* 5. Cableado: soluciones correctas y errores */
const mk = (ej, pares, colores) => pares.map(([a, b], i) => ({ a, b, color: colores[i] }));
const ej1 = O.ejPorId('luz');
let v = O.verificaEj(ej1, mk(ej1, [['tg.F', 'sw.a'], ['sw.b', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 'sw.T'], ['sw.T', 'lam.T']], ['negro', 'amarillo', 'blanco', 'verde', 'verde']));
t('punto de luz correcto', v.ok, v.problemas);
v = O.verificaEj(ej1, mk(ej1, [['tg.N', 'sw.a'], ['sw.b', 'lam.N'], ['tg.F', 'lam.L'], ['tg.T', 'sw.T'], ['sw.T', 'lam.T']], ['blanco', 'blanco', 'negro', 'verde', 'verde']));
t('interruptor en el neutro se detecta', !v.ok && v.problemas.some((p) => /tensión/.test(p.msg) || p.t === 'conexión'), v.problemas);
v = O.verificaEj(ej1, mk(ej1, [['tg.F', 'sw.a'], ['sw.b', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 'sw.T'], ['sw.T', 'lam.T']], ['negro', 'blanco', 'blanco', 'verde', 'verde']));
t('retorno blanco se rechaza', !v.ok && v.problemas.some((p) => p.t === 'color'), v.problemas);
v = O.verificaEj(ej1, [{ a: 'tg.F', b: 'tg.N', color: 'negro' }]);
t('fase-neutro es cortocircuito', v.problemas.some((p) => /Cortocircuito/.test(p.msg)), v.problemas);

const ej2 = O.ejPorId('conm');
v = O.verificaEj(ej2, mk(ej2, [['tg.F', 's1.C'], ['s1.t1', 's2.t1'], ['s1.t2', 's2.t2'], ['s2.C', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 's1.T'], ['s1.T', 's2.T'], ['s2.T', 'lam.T']], ['negro', 'azul', 'amarillo', 'naranja', 'blanco', 'verde', 'verde', 'desnudo']));
t('conmutada correcta', v.ok, v.problemas);
v = O.verificaEj(ej2, mk(ej2, [['tg.F', 's1.C'], ['s1.t1', 's2.t2'], ['s1.t2', 's2.t1'], ['s2.C', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 's1.T'], ['s1.T', 's2.T'], ['s2.T', 'lam.T']], ['negro', 'azul', 'amarillo', 'naranja', 'blanco', 'verde', 'verde', 'verde']));
t('conmutada con viajeros cruzados también funciona', v.ok, v.problemas);
v = O.verificaEj(ej2, mk(ej2, [['tg.F', 's1.t1'], ['s1.C', 's2.C'], ['s1.t2', 's2.t2'], ['s2.t1', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 's1.T'], ['s1.T', 's2.T'], ['s2.T', 'lam.T']], ['negro', 'azul', 'amarillo', 'naranja', 'blanco', 'verde', 'verde', 'verde']));
t('conmutada con el común mal cableado se detecta', !v.ok);

const ej3 = O.ejPorId('gfci');
v = O.verificaEj(ej3, mk(ej3, [['tg.F', 'g.LF'], ['tg.N', 'g.LN'], ['g.CF', 't.F'], ['g.CN', 't.N'], ['tg.T', 'g.T'], ['g.T', 't.T']], ['negro', 'blanco', 'negro', 'blanco', 'verde', 'verde']));
t('GFCI correcto', v.ok, v.problemas);
v = O.verificaEj(ej3, mk(ej3, [['tg.F', 'g.LF'], ['tg.N', 'g.LN'], ['tg.F', 't.F'], ['tg.N', 't.N'], ['tg.T', 'g.T'], ['g.T', 't.T']], ['negro', 'blanco', 'negro', 'blanco', 'verde', 'verde']));
t('toma conectada a la línea no queda protegida', !v.ok && v.problemas.some((p) => /LOAD|GFCI/.test(p.msg)), v.problemas);
v = O.verificaEj(ej3, mk(ej3, [['tg.F', 'g.CF'], ['tg.N', 'g.CN'], ['g.LF', 't.F'], ['g.LN', 't.N'], ['tg.T', 'g.T'], ['g.T', 't.T']], ['negro', 'blanco', 'negro', 'blanco', 'verde', 'verde']));
t('LINE y LOAD invertidos se detectan', !v.ok);

const ej4 = O.ejPorId('ducha');
v = O.verificaEj(ej4, mk(ej4, [['tg.F', 'd.L'], ['tg.N', 'd.N'], ['tg.T', 'd.T']], ['negro', 'blanco', 'verde']));
t('ducha correcta', v.ok, v.problemas);
v = O.verificaEj(ej4, mk(ej4, [['tg.F', 'd.L'], ['tg.N', 'd.N'], ['tg.F', 'd.T']], ['negro', 'blanco', 'verde']));
t('carcasa a la fase se detecta', !v.ok && v.problemas.some((p) => /carcasa|fase a tierra/i.test(p.msg)), v.problemas);
const ej5 = O.ejPorId('estufa');
v = O.verificaEj(ej5, mk(ej5, [['tg.F1', 'e.L1'], ['tg.F2', 'e.L2'], ['tg.N', 'e.N'], ['tg.T', 'e.T']], ['negro', 'rojo', 'blanco', 'verde']));
t('estufa correcta', v.ok, v.problemas);
v = O.verificaEj(ej5, mk(ej5, [['tg.F1', 'e.L1'], ['tg.F1', 'e.L2'], ['tg.N', 'e.N'], ['tg.T', 'e.T']], ['negro', 'negro', 'blanco', 'verde']));
t('estufa con una sola fase se detecta', !v.ok);
v = O.verificaEj(ej5, mk(ej5, [['tg.F1', 'e.L1'], ['tg.F2', 'e.L2'], ['tg.N', 'e.N'], ['tg.T', 'e.T']], ['negro', 'negro', 'blanco', 'verde']));
t('estufa con las dos fases negras: color de F2 incorrecto', !v.ok && v.problemas.some((p) => p.t === 'color'));

/* 6. Simulación */
const Ps = O.prepSim(E);
let S = O.nuevoS();
let r = O.sim(E, Ps, S);
t('sin cargas no hay corriente', r.tot.Itot === 0);
// demanda: ducha + estufa + varios aparatos
S.ducha = true; S.estufa = true;
r = O.sim(E, Ps, S);
t('ducha: 29,2 A en C7', Math.abs(r.circ.C7.I - 3500 / 120) < 1e-6);
t('estufa: 25 A en C8 y reparte en las dos fases', Math.abs(r.circ.C8.I - 25) < 1e-6 && r.tot.IA >= 25 && r.tot.IB >= 25);
t('tensión a la ducha menor que 120 V pero ≥ 114', r.circ.C7.Vmin < 120 && r.circ.C7.Vmin > 114, r.circ.C7.Vmin);
// sobrecarga: 3 hornos en C4 (20 A, 12 AWG)
S = O.nuevoS();
['TMa', 'TMb', 'TMc'].forEach((id) => { S.ench[id] = ['horno', 'calefactor']; });
r = O.sim(E, Ps, S);
t('C4 con 6 resistencias de 1500 W: 75 A', Math.abs(r.circ.C4.I - 75) < 0.01, r.circ.C4.I);
let disparo = false;
for (let i = 0; i < 50 && !disparo; i++) { const x = O.paso(E, Ps, S, 0.1); disparo = x.ev.some((e) => e.tipo === 'disparo' && e.c === 'C4'); }
t('el interruptor de C4 dispara pronto con 75 A', disparo, S.t);
// sobrecarga moderada 1,3 × In: no dispara pero el conductor no se quema
S = O.nuevoS(); S.ench.TMa = ['horno', 'calefactor']; S.ench.TMb = ['plancha']; // 4000 W / 120 = 33 A en 20 A...
for (let i = 0; i < 100; i++) O.paso(E, Ps, S, 5);
t('sobrecarga severa dispara en 100 pasos de 5 s', S.trip.C4 === true);
// cortocircuito
let f = O.falla(E, Ps, 'corto', 'TS3');
t('cortocircuito: Icc de cientos de amperios y despeje rápido', f.Icc > 300 && f.t < 0.2 && f.ok, [f.Icc, f.t]);
f = O.falla(E, Ps, 'fuga', 'TS3');
t('fuga con tierra continua: tensión de contacto menor que la admisible', f.ok, f);
f = O.falla(E, Ps, 'fuga-sin-tierra', 'TS3', { piel: 'mojada' });
t('sin tierra y sin GFCI hay riesgo', !f.ok && f.zona >= 3, f);
f = O.falla(E, Ps, 'fuga-sin-tierra', 'TMa', { piel: 'mojada' });
t('con GFCI la descarga es leve', f.zona <= 3 && isFinite(f.t) && f.t < 0.5, f);
// neutro abierto
S = O.nuevoS(); S.ench.TS3 = ['plancha']; S.ench.TA22 = ['tv']; S.neutroAbierto = true;
r = O.sim(E, Ps, S);
t('neutro abierto: sobretensión en la fase poco cargada', Math.max(r.tot.VA, r.tot.VB) > 132, [r.tot.VA, r.tot.VB]);

/* 7. Defectos y pruebas */
t('megger con defecto en C1 < 1 MΩ', !O.megger(E, Ps, 'C1').ok);
t('megger en C2 correcto', O.megger(E, Ps, 'C2').ok, O.megger(E, Ps, 'C2'));
t('continuidad PE abierta en TA13', O.continuidadPE(E, Ps, 'TA13').abierto);
t('continuidad PE correcta en TS1', O.continuidadPE(E, Ps, 'TS1').ok);
t('polaridad invertida en TS6', O.polaridad(E, Ps, 'TS6').estado === 'invertida');
t('GFCI TMa falla por el neutro compartido', !O.testGFCI(E, Ps, 'TMa').ok);
t('reparar con causa equivocada no repara', !O.reparar(E, 'd1', 'polaridad').ok && !E.pruebas.def.d1);
['d1', 'd2', 'd3', 'd4'].forEach((id) => O.reparar(E, id, O.DEFECTOS.find((d) => d.id === id).tipo));
t('reparados los cuatro', O.DEFECTOS.every((d) => E.pruebas.def[d.id]));
t('megger ya correcto tras reparar', O.megger(E, Ps, 'C1').ok);
t('GFCI TMa correcto tras reparar', O.testGFCI(E, Ps, 'TMa').ok);


/* 8. Recorrido completo: la obra puede llegar a «conforme» */
{
  const F2 = O.nuevo({ lote: 'B' });
  O.aplicarReferencia(F2);
  const cab = (id, pares, cols) => { F2.cableado[id] = { cables: pares.map(([a, b], i) => ({ a, b, color: cols[i] })), pos: {} }; };
  cab('luz', [['tg.F', 'sw.a'], ['sw.b', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 'sw.T'], ['sw.T', 'lam.T']], ['negro', 'amarillo', 'blanco', 'verde', 'verde']);
  cab('conm', [['tg.F', 's1.C'], ['s1.t1', 's2.t1'], ['s1.t2', 's2.t2'], ['s2.C', 'lam.L'], ['tg.N', 'lam.N'], ['tg.T', 's1.T'], ['s1.T', 's2.T'], ['s2.T', 'lam.T']], ['negro', 'azul', 'amarillo', 'naranja', 'blanco', 'verde', 'verde', 'verde']);
  cab('gfci', [['tg.F', 'g.LF'], ['tg.N', 'g.LN'], ['g.CF', 't.F'], ['g.CN', 't.N'], ['tg.T', 'g.T'], ['g.T', 't.T']], ['negro', 'blanco', 'negro', 'blanco', 'verde', 'verde']);
  cab('ducha', [['tg.F', 'd.L'], ['tg.N', 'd.N'], ['tg.T', 'd.T']], ['negro', 'blanco', 'verde']);
  cab('estufa', [['tg.F1', 'e.L1'], ['tg.F2', 'e.L2'], ['tg.N', 'e.N'], ['tg.T', 'e.T']], ['negro', 'rojo', 'blanco', 'verde']);
  F2.cableado.quiz = { resp: O.QUIZ.map((q) => q.ok), total: 6, aciertos: 6 };
  const P2 = O.prepSim(F2);
  O.DEFECTOS.forEach((d) => O.reparar(F2, d.id, d.tipo));
  F2.circuitos.forEach((c) => { F2.pruebas.megger[c.id] = O.megger(F2, P2, c.id).MOhm; });
  F2.puntos.filter((p) => p.tipo === 'toma').forEach((p) => { F2.pruebas.pol[p.id] = O.polaridad(F2, P2, p.id).ok; F2.pruebas.pe[p.id] = O.continuidadPE(F2, P2, p.id).ok; if (p.ap !== 'comun') F2.pruebas.gfci[p.id] = O.testGFCI(F2, P2, p.id).ok; });
  const S3 = O.nuevoS();
  P2.casa.electrico.puntos.filter((p) => p.tipo === 'lum' || p.tipo === 'aplique').forEach((p) => { S3.luces[p.s] = true; });
  S3.ducha = true; S3.estufa = true; Object.assign(S3.ench, { TN: ['nevera'], TP: ['plancha'], TL: ['lavadora'], TMa: ['micro'], TMb: ['licuadora'], TS3: ['tv'] });
  let disp = null, Vm = 999;
  for (let tt = 0; tt < 600; tt += 10) { const x = O.paso(F2, P2, S3, 10); if (x.ev.some((e) => e.tipo === 'disparo' || e.tipo === 'incendio')) disp = x.ev[0].texto; Vm = Math.min(Vm, ...Object.values(x.r.circ).filter((c) => c.I > 0).map((c) => c.Vmin)); }
  t('la plena carga de referencia no dispara', !disp, disp);
  F2.pruebas.carga = { ok: !disp && Vm >= 114, I: 0, Vmin: Vm };
  F2.pruebas.fallas.corto = { ok: O.falla(F2, P2, 'corto', 'TS3').ok, texto: 'x' };
  F2.pruebas.fallas.fuga = { ok: O.falla(F2, P2, 'fuga', 'TS3').ok, texto: 'x' };
  const fin = O.puntaje(F2);
  for (const e of O.ETAPAS) t('recorrido completo: ' + e.id + ' lista', fin.por[e.id].listo, fin.por[e.id].items.filter((i) => i.estado !== 'ok').map((i) => i.estado + ': ' + i.texto));
  t('nota final 100', fin.nota === 100, fin.nota);
}

console.log(`${ok} pruebas correctas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
