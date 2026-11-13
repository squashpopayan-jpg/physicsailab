/* ===================================================================
   lib/80-sim.js — Energización, fallas y pruebas de la instalación
   · Estado estacionario: corrientes por circuito, por fase y por el
     neutro; tensión en cada punto; temperatura del conductor.
   · Dinámica: disparo del interruptor por curva térmico-magnética
     (C.disparo) y calentamiento del conductor (constante de tiempo).
   · Fallas: cortocircuito, fuga a tierra (con y sin tierra continua),
     pérdida del neutro.
   · Defectos de obra sembrados y pruebas de recibo (megger, continuidad
     de tierra, polaridad, GFCI).
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const C = L.C, N = L.N, R = L.R, Q = L.Q;
  const O = L.O;

  O.Z_FUENTE = 0.06; /* Ω, impedancia del transformador y la red hasta el medidor */
  O.nuevoS = () => ({ luces: {}, ench: {}, ducha: false, estufa: false, trip: {}, dmg: {}, T: {}, quemado: {}, t: 0, eventos: [], totalTrip: false, dmgTot: 0, neutroAbierto: false });

  O.cargaPunto = function (p, S) {
    if (p.tipo === 'lum' || p.tipo === 'aplique') return S.luces[p.s] ? p.W : 0;
    if (p.tipo === 'ducha') return S.ducha ? p.W : 0;
    if (p.tipo === 'estufa') return S.estufa ? p.W : 0;
    if (p.tipo === 'toma') return (S.ench[p.id] || []).reduce((s, id) => s + (N.APARATOS.find((a) => a.id === id) || { W: 0 }).W, 0);
    return 0;
  };

  /* Tiempo de disparo (s) de un interruptor automático curva C para una corriente m veces In */
  O.tTrip = function (m) {
    if (m < 1.13) return Infinity;
    const d = C.disparo(m, 'C');
    if (!isFinite(d.tmax) && !isFinite(d.tmin)) return Infinity;
    if (!isFinite(d.tmax)) return d.tmin;
    if (!isFinite(d.tmin)) return d.tmax;
    return Math.max(0.005, Math.sqrt(d.tmin * d.tmax));
  };

  /* Precálculo geométrico (se rehace al cambiar la instalación, no en cada paso) */
  O.prepSim = function (E) {
    const casa = O.casaDe(E);
    const tr = R.tramos(casa);
    const info = O.acomInfo(E, casa);
    const sl = O.slots(E);
    const circ = {};
    for (const c of casa.electrico.circuitos) {
      const trc = tr.filter((t) => t.c === c.id);
      const pad = {}, ch = {};
      trc.forEach((t) => { pad[t.v] = t; (ch[t.u] = ch[t.u] || []).push(t); });
      const nPort = O.nPortadores(c, tr);
      circ[c.id] = {
        c, trc, pad, ch, nPort,
        Iz90: C.ampacidad(c.awg, 90, O.TA, nPort), Iz60: C.ampacidad(c.awg, 60, O.TA, nPort),
        r: C.rCu(c.awg, 75) / 1000, rT: C.rCu(c.tierra, 75) / 1000,
        fase: c.polos === 2 ? 'AB' : (sl[c.id] ? sl[c.id].fase : 'A'), colocado: !!sl[c.id], tipo: sl[c.id] ? sl[c.id].tipo : 'tm'
      };
    }
    const rf = info.dv ? info.dv.R : C.rCu('6', 75) / 1000;
    return { casa, tr, info, circ, rFeed: rf, LFeed: (info.Lac || 10) + (info.Lal || 5) };
  };
  /* Longitud (m) del camino TG→punto por el árbol del circuito */
  O.rutaLong = function (P, c, id) {
    const cc = P.circ[c.id || c];
    let L0 = 0, n = id, g = 0;
    while (cc.pad[n] && g++ < 50) { L0 += cc.pad[n].L; n = cc.pad[n].u; }
    return L0;
  };

  /* Estado estacionario */
  O.sim = function (E, P, S) {
    const res = { circ: {}, tot: {}, pts: {} };
    let IA = 0, IB = 0, IA1 = 0, IB1 = 0, PA = 0, PB = 0, Wtot = 0;
    const I0 = {};
    for (const id in P.circ) {
      const cc = P.circ[id], c = cc.c;
      const pts = P.casa.electrico.puntos.filter((p) => p.c === id);
      let W = 0; pts.forEach((p) => { W += O.cargaPunto(p, S); });
      const abierto = S.trip[id] || S.totalTrip || S.quemado[id];
      const I = abierto ? 0 : W / c.V;
      I0[id] = I;
      if (cc.fase === 'A') { IA += I; IA1 += I; PA += abierto ? 0 : W; }
      else if (cc.fase === 'B') { IB += I; IB1 += I; PB += abierto ? 0 : W; }
      else { IA += I; IB += I; }
      Wtot += abierto ? 0 : W;
    }
    const In = IA1 - IB1;
    const rf = P.rFeed, Lf = P.LFeed;
    let VA = 120 - IA * rf * Lf - In * rf * Lf, VB = 120 - IB * rf * Lf + In * rf * Lf;
    if (S.totalTrip) { VA = 0; VB = 0; }
    else if (S.neutroAbierto) {
      const RA = PA > 0 ? 14400 / PA : Infinity, RB = PB > 0 ? 14400 / PB : Infinity;
      if (isFinite(RA) && isFinite(RB)) { VA = 240 * RA / (RA + RB); VB = 240 * RB / (RA + RB); }
      else if (isFinite(RA)) { VA = 0; VB = 240; }
      else if (isFinite(RB)) { VA = 240; VB = 0; }
      else { VA = 120; VB = 120; }
    }
    res.tot = { IA, IB, IN: Math.abs(In), VA, VB, W: Wtot, Itot: Math.max(IA, IB) };
    for (const id in P.circ) {
      const cc = P.circ[id], c = cc.c;
      const I = I0[id];
      const Vleg = cc.fase === 'A' ? VA : cc.fase === 'B' ? VB : VA + VB;
      // corriente aguas abajo de cada arista
      const aguas = {};
      const pts = P.casa.electrico.puntos.filter((p) => p.c === id);
      const own = {}; pts.forEach((p) => { own[p.id] = I0[id] ? O.cargaPunto(p, S) / c.V : 0; });
      const sub = (n) => { let s = own[n] || 0; (cc.ch[n] || []).forEach((t) => { s += sub(t.v); }); aguas[n] = s; return s; };
      sub('TG');
      let Vmin = Vleg;
      const vp = { TG: Vleg };
      const bajar = (n, v) => (cc.ch[n] || []).forEach((t) => { const vv = v - 2 * cc.r * t.L * (aguas[t.v] || 0); vp[t.v] = vv; if (vv < Vmin) Vmin = vv; bajar(t.v, vv); });
      bajar('TG', Vleg);
      const m = I / c.In;
      const Tss = O.TA + (90 - O.TA) * Math.pow(I / cc.Iz90, 2);
      Object.assign(res.pts, vp);
      res.circ[id] = { id, I, W: I * c.V, m, Vmin, Tss, Iz90: cc.Iz90, Iz60: cc.Iz60, fase: cc.fase, In: c.In, caida: 100 * (1 - Vmin / Vleg) };
    }
    return res;
  };

  /* Un paso de tiempo simulado: acumula disparo y calentamiento; devuelve eventos nuevos */
  O.paso = function (E, P, S, dt) {
    const ev = [];
    const r = O.sim(E, P, S);
    for (const id in P.circ) {
      const x = r.circ[id], cc = P.circ[id];
      if (S.trip[id] || S.totalTrip) { S.dmg[id] = 0; }
      else {
        const t = O.tTrip(x.m);
        if (isFinite(t)) S.dmg[id] = (S.dmg[id] || 0) + dt / t;
        else S.dmg[id] = Math.max(0, (S.dmg[id] || 0) - dt / 600);
        if (x.m <= 1.0) S.dmg[id] = Math.max(0, (S.dmg[id] || 0) - dt / 900);
        if (S.dmg[id] >= 1) { S.trip[id] = true; S.dmg[id] = 0; ev.push({ t: S.t, tipo: 'disparo', c: id, texto: `Disparó el interruptor de ${id} (${x.In} A) con ${C.fmt(x.I, 1)} A.` }); }
      }
      // calentamiento
      const T0 = S.T[id] == null ? O.TA : S.T[id];
      const tau = 400;
      const Tn = T0 + (x.Tss - T0) * (1 - Math.exp(-dt / tau));
      S.T[id] = Tn;
      if (T0 <= 90 && Tn > 90 && !S.quemado[id]) ev.push({ t: S.t, tipo: 'aviso', c: id, texto: `El conductor de ${id} superó 90 °C, límite de su aislamiento THHN.` });
      if (Tn > 150 && !S.quemado[id]) { S.quemado[id] = true; ev.push({ t: S.t, tipo: 'incendio', c: id, texto: `El aislamiento del conductor de ${id} se carbonizó (${C.fmt(Tn, 0)} °C): riesgo de incendio. El interruptor de ${x.In} A no lo protegió.` }); }
    }
    // totalizador
    const tot = r.tot;
    if (!S.totalTrip) {
      const m = tot.Itot / (E.tab.total || 60);
      const t = O.tTrip(m);
      if (isFinite(t)) S.dmgTot = (S.dmgTot || 0) + dt / t; else S.dmgTot = Math.max(0, (S.dmgTot || 0) - dt / 600);
      if (m <= 1) S.dmgTot = Math.max(0, S.dmgTot - dt / 900);
      if (S.dmgTot >= 1) { S.totalTrip = true; S.dmgTot = 0; ev.push({ t: S.t, tipo: 'disparo', c: 'TOT', texto: `Disparó el interruptor principal de ${E.tab.total} A con ${C.fmt(tot.Itot, 1)} A.` }); }
    }
    S.t += dt;
    S.eventos.push(...ev);
    return { r, ev };
  };
  O.reponer = function (S, id) {
    if (id === 'TOT') { S.totalTrip = false; S.dmgTot = 0; } else { S.trip[id] = false; S.dmg[id] = 0; }
  };

  /* ---------------- Fallas ---------------- */
  O.WITHSTAND_K = 115; /* cobre con aislamiento PVC/THHN, A·s^½/mm² */
  O.falla = function (E, P, tipo, pid, opt) {
    opt = opt || {};
    const p = P.casa.punto(pid), c = P.casa.circuito(p.c), cc = P.circ[c.id];
    const Lp = O.rutaLong(P, c, pid);
    const Rfase = cc.r * Lp, Regc = cc.rT * Lp, Rf = P.rFeed * P.LFeed;
    const V = 120;
    const prot = O.proteccionDe(P.casa, p, cc);
    const out = { tipo, punto: pid, c: c.id, L: Lp };
    if (tipo === 'corto') {
      const Z = O.Z_FUENTE + 2 * Rf + 2 * Rfase;
      const Icc = V / Z, m = Icc / c.In, t = O.tTrip(m);
      const S = C.awgArea(c.awg);
      const I2t = Icc * Icc * (isFinite(t) ? t : 5);
      Object.assign(out, { Icc, m, t, soporta: I2t <= Math.pow(O.WITHSTAND_K * S, 2), I2t, lim: Math.pow(O.WITHSTAND_K * S, 2) });
      out.texto = `Cortocircuito en ${pid}: ${C.fmt(Icc, 0)} A (${C.fmt(m, 1)} veces los ${c.In} A). El interruptor lo despeja en ${isFinite(t) ? C.fmt(1000 * t, 0) + ' ms' : 'un tiempo indefinido'}; ` + (out.soporta ? 'el conductor lo soporta (I²t menor que k²S²).' : 'el conductor NO lo soporta: I²t supera k²S² y se daña.');
      out.ok = isFinite(t) && out.soporta;
    } else if (tipo === 'fuga') {
      // carcasa energizada con tierra continua
      const Z = O.Z_FUENTE + 2 * Rf + Rfase + Regc;
      const If = V / Z, m = If / c.In;
      let t = O.tTrip(m), via = 'el interruptor termomagnético';
      if (prot && prot.tipo === 'gfci') { t = Math.min(t, C.gfciT(Math.min(If * 1000, 1000))); via = 'el GFCI de la toma'; }
      if (prot && prot.tipo === 'dif') { t = Math.min(t, C.rcdT(If * 1000, 30)); via = 'el diferencial de 30 mA'; }
      const Vt = If * (Regc + Rf * 0.5);
      const lim = N.contactoMax(isFinite(t) ? t : 3, 1);
      Object.assign(out, { If, m, t, via, Vt, lim, ok: isFinite(t) && Vt <= lim + 1e-9 });
      out.texto = `Fuga franca a la carcasa en ${pid} con la tierra continua: ${C.fmt(If, 0)} A por el conductor de tierra. Despeja ${via} en ${isFinite(t) ? C.fmt(1000 * t, 0) + ' ms' : 'sin disparar'}; la tensión de contacto es ${C.fmt(Vt, 1)} V frente a ${C.fmt(lim, 0)} V admisibles para ese tiempo.`;
    } else if (tipo === 'fuga-sin-tierra') {
      // carcasa energizada y tierra abierta: la persona cierra el circuito
      const piel = opt.piel || 'seca';
      let Vc = V;
      let Z = C.zCuerpo(Vc, piel);
      let I = Vc / Z; // A
      let ImA = I * 1000;
      let t = Infinity, via = 'nada: ningún dispositivo detecta la corriente';
      if (prot && prot.tipo === 'gfci') { t = C.gfciT(ImA); via = 'el GFCI de la toma'; }
      else if (prot && prot.tipo === 'dif') { t = C.rcdT(ImA, 30); via = 'el diferencial de 30 mA'; }
      const tmsEf = isFinite(t) ? t * 1000 : 3000;
      const zona = C.zonaIEC(ImA, tmsEf);
      Object.assign(out, { ImA, t, via, zona, piel, Z, ok: zona <= 2 });
      out.texto = `Carcasa de ${pid} energizada y SIN tierra, persona con piel ${piel}: pasan ${C.fmt(ImA, 0)} mA por el cuerpo (${C.fmt(Z, 0)} Ω). Lo despeja ${via}${isFinite(t) ? ' en ' + C.fmt(1000 * t, 0) + ' ms' : ''}. Zona ${zona} de la curva IEC 60479: ${C.ZONAS[zona].toLowerCase()}.`;
    }
    return out;
  };
  /* Protección contra falla a tierra efectiva de un punto */
  O.proteccionDe = function (casa, p, cc) {
    if (p.tipo === 'toma') {
      const g = L.G.protegidaGFCI(casa, p);
      if (g && g.startsWith('toma')) return { tipo: 'gfci', quien: p.id };
      if (g && g.startsWith('aguas')) return { tipo: 'gfci', quien: p.gfciCarga };
    }
    if (cc && cc.tipo === 'dif') return { tipo: 'dif', quien: 'tablero' };
    if (p.tipo === 'ducha' && casa.circuito(p.c).diferencial) return { tipo: 'dif', quien: 'tablero' };
    return null;
  };

  /* ---------------- Defectos de obra ---------------- */
  O.CAUSAS = [
    ['tierra', 'Conductor de tierra sin conectar'], ['polaridad', 'Fase y neutro invertidos'], ['aislamiento', 'Aislamiento dañado en el cable'],
    ['neutro', 'Neutro compartido entre circuitos'], ['ninguna', 'No hay falla: la lectura es normal']
  ];
  O.DEFECTOS = [
    { id: 'd1', tipo: 'tierra', c: 'C3', p: 'TA13', texto: 'El conductor de tierra quedó suelto en la caja de TA13 (la toma no tiene tierra).' },
    { id: 'd2', tipo: 'polaridad', c: 'C2', p: 'TS6', texto: 'En TS6 la fase quedó en el borne plateado y el neutro en el de latón.' },
    { id: 'd3', tipo: 'aislamiento', c: 'C1', p: 'LK2', texto: 'Entre LK1 y LK2 el cable se peló al halarlo por el tubo: el aislamiento quedó lastimado.', MOhm: 0.2 },
    { id: 'd4', tipo: 'neutro', c: 'C5', p: 'TK1', alt: ['TMa'], texto: 'El neutro de C5 se empalmó con el de C4: dos circuitos con GFCI comparten neutro.' }
  ];
  O.defEn = (E, pid) => O.DEFECTOS.find((d) => !E.pruebas.def[d.id] && (d.p === pid || (d.alt || []).includes(pid)));
  O.defActivo = (E, id) => !E.pruebas.def[id];
  O.defectosPara = (E, tipo, pid, cid) => O.DEFECTOS.filter((d) => O.defActivo(E, d.id) && d.tipo === tipo && (pid ? d.p === pid : true) && (cid ? d.c === cid : true));

  O.megger = function (E, P, cid) {
    const cc = P.circ[cid];
    const Ltot = P.tr.filter((t) => t.c === cid).reduce((s, t) => s + t.L, 0);
    let MOhm = Math.round(4000 / (1 + Ltot / 30));
    const d = O.defectosPara(E, 'aislamiento', null, cid)[0];
    if (d) MOhm = d.MOhm;
    return { MOhm, ok: MOhm >= 1, Ltot };
  };
  /* Megger desde el tablero hasta un punto del circuito: baja si el defecto está en ese camino */
  O.meggerHasta = function (E, P, pid) {
    const p = P.casa.punto(pid), cc = P.circ[p.c];
    const camino = new Set([pid]);
    let n = pid, g = 0;
    while (cc.pad[n] && g++ < 50) { n = cc.pad[n].u; camino.add(n); }
    const d = O.defectosPara(E, 'aislamiento', null, p.c)[0];
    if (d && camino.has(d.p)) return { MOhm: d.MOhm, ok: false };
    return { MOhm: 4000, ok: true };
  };
  O.continuidadPE = function (E, P, pid) {
    const p = P.casa.punto(pid), cc = P.circ[p.c];
    if (O.defectosPara(E, 'tierra', pid)[0]) return { abierto: true, ohm: Infinity, ok: false };
    const ohm = cc.rT * O.rutaLong(P, p.c, pid) + 0.04;
    return { abierto: false, ohm, ok: ohm <= 1 };
  };
  O.polaridad = function (E, P, pid) {
    const d = O.defectosPara(E, 'polaridad', pid)[0], t = O.defectosPara(E, 'tierra', pid)[0];
    if (d) return { estado: 'invertida', ok: false, texto: 'Fase y neutro invertidos' };
    if (t) return { estado: 'sin-tierra', ok: false, texto: 'Sin tierra' };
    return { estado: 'ok', ok: true, texto: 'Conexión correcta' };
  };
  O.testGFCI = function (E, P, pid) {
    const p = P.casa.punto(pid);
    const d = O.defectosPara(E, 'neutro', null, 'C5')[0];
    if (d && (p.c === 'C4' || p.c === 'C5')) return { ok: false, texto: 'No rearma: el neutro compartido con otro circuito desbalancea la corriente que ve el GFCI.' };
    return { ok: true, texto: 'Dispara con el botón de prueba y rearma' };
  };
  O.reparar = function (E, id, causa) {
    const d = O.DEFECTOS.find((x) => x.id === id);
    if (!d || E.pruebas.def[id]) return { ok: false, msg: 'Ese defecto ya está reparado.' };
    if (d.tipo === causa) { E.pruebas.def[id] = true; return { ok: true, msg: 'Reparado: ' + d.texto.replace(/^.*?(?=[A-Z])/, '') }; }
    return { ok: false, msg: 'La causa no coincide con la falla encontrada en ese punto: revise la lectura de los instrumentos.' };
  };

  /* ---------------- Etapa: energizar y probar ---------------- */
  O.ev.pruebas = function (E) {
    const items = [];
    const P = O.prepSim(E);
    const p = E.pruebas;
    // defectos
    const reparados = O.DEFECTOS.filter((d) => p.def[d.id]).length;
    items.push(reparados === O.DEFECTOS.length ? it2('ok', 'RETIE Libro 4, 4.3 (inspección)', `Los ${O.DEFECTOS.length} defectos de obra fueron encontrados y reparados.`)
      : it2('pend', 'RETIE Libro 4, 4.3 (inspección)', `Defectos de obra reparados: ${reparados} de ${O.DEFECTOS.length}. Búsquelos con megger, polarímetro, continuidad de tierra y la prueba del GFCI.`));
    // megger por circuito
    const nM = E.circuitos.filter((c) => p.megger[c.id] != null).length;
    const malos = E.circuitos.filter((c) => p.megger[c.id] != null && p.megger[c.id] < 1);
    items.push(nM < E.circuitos.length ? it2('pend', 'IEC 60364-6 (práctica de recibo)', `Resistencia de aislamiento medida en ${nM} de ${E.circuitos.length} circuitos (500 V, mínimo 1 MΩ).`)
      : malos.length ? it2('falla', 'IEC 60364-6 (práctica de recibo)', `Aislamiento por debajo de 1 MΩ en ${malos.map((c) => c.id).join(', ')}: repare y vuelva a medir.`)
        : it2('ok', 'IEC 60364-6 (práctica de recibo)', 'Aislamiento ≥ 1 MΩ a 500 V en todos los circuitos.'));
    // tomas probadas
    const circTomas = [...new Set(E.puntos.filter((x) => x.tipo === 'toma').map((x) => x.c))];
    const probados = circTomas.filter((cid) => Object.keys(p.pol).some((pid) => (E.puntos.find((q) => q.id === pid) || {}).c === cid));
    const polMalas = Object.keys(p.pol).filter((pid) => p.pol[pid] === false || p.pe[pid] === false);
    items.push(probados.length < circTomas.length ? it2('pend', 'RETIE 3.12 y NTC 2050, 250.4', `Polaridad y continuidad de tierra probadas en circuitos: ${probados.length} de ${circTomas.length}.`)
      : polMalas.length ? it2('falla', 'RETIE 3.12 y NTC 2050, 250.4', `Hay tomas con lectura anómala sin corregir: ${polMalas.join(', ')}.`)
        : it2('ok', 'RETIE 3.12 y NTC 2050, 250.4', 'Polaridad y continuidad de tierra verificadas en todos los circuitos de tomas.'));
    // GFCI
    const gf = E.puntos.filter((x) => x.tipo === 'toma' && x.ap !== 'comun');
    const gp = gf.filter((x) => p.gfci[x.id] != null);
    const gmal = gf.filter((x) => p.gfci[x.id] === false);
    items.push(gp.length < gf.length ? it2('pend', 'RETIE 3.17.15 y NTC 2050, 210.8', `Botón de prueba de los GFCI: ${gp.length} de ${gf.length} verificados.`)
      : gmal.length ? it2('falla', 'RETIE 3.17.15 y NTC 2050, 210.8', `GFCI que no rearman o no disparan: ${gmal.map((x) => x.id).join(', ')}.`)
        : it2('ok', 'RETIE 3.17.15 y NTC 2050, 210.8', 'Todos los GFCI disparan y rearman.'));
    // plena carga
    items.push(!p.carga ? it2('pend', 'RETIE Título 26 y NTC 2050, 220', 'Ensayo a plena carga: encienda la demanda de la vivienda y verifique que el principal no dispare y que la tensión no baje más de 5 %.')
      : p.carga.ok ? it2('ok', 'RETIE Título 26 y NTC 2050, 220', `Plena carga: ${C.fmt(p.carga.I, 1)} A en la fase más cargada, tensión mínima ${C.fmt(p.carga.Vmin, 1)} V, sin disparos.`)
        : it2('falla', 'RETIE Título 26 y NTC 2050, 220', `Plena carga: ${p.carga.motivo}`));
    // fallas ensayadas
    const f = p.fallas;
    items.push(!f.corto ? it2('pend', 'NTC 2050, 110.9 y 240.4', 'Ensaye un cortocircuito en un circuito y verifique que el interruptor despeja antes de dañar el conductor.')
      : f.corto.ok ? it2('ok', 'NTC 2050, 110.9 y 240.4', f.corto.texto) : it2('falla', 'NTC 2050, 110.9 y 240.4', f.corto.texto));
    items.push(!f.fuga ? it2('pend', 'RETIE 3.12 (tensiones de contacto)', 'Ensaye una fuga a la carcasa con tierra continua y compare la tensión de contacto con la admisible.')
      : f.fuga.ok ? it2('ok', 'RETIE 3.12 (tensiones de contacto)', f.fuga.texto) : it2('falla', 'RETIE 3.12 (tensiones de contacto)', f.fuga.texto));
    return O.resumen(items, { P });
  };
  function it2(estado, ref, texto, extra) { return O.it(estado, ref, texto, extra); }
})(typeof window !== 'undefined' ? window : globalThis);
