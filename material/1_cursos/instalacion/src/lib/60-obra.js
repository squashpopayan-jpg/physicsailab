/* ===================================================================
   lib/60-obra.js — Estado de la obra y evaluación normativa por etapa
   El estudiante parte del plano eléctrico de la casa (puntos y circuitos
   dados) y toma las decisiones de obra: puntos, acometida, tierra,
   calibres y protecciones, canalizaciones, tablero y cableado. Cada
   etapa se evalúa con la biblioteca normativa (RETIE y NTC 2050); la
   solución de referencia sale del modelo de la casa de la guía.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const C = L.C, N = L.N, R = L.R, Q = L.Q, G = L.G;
  const O = (L.O = {});
  const F = L.CASA.t / 2;

  O.clon = (x) => JSON.parse(JSON.stringify(x));
  O.TA = 30; /* temperatura ambiente de diseño, °C */

  O.ETAPAS = [
    { id: 'plano', nombre: 'Plano y puntos', peso: 12 },
    { id: 'acometida', nombre: 'Demanda y acometida', peso: 14 },
    { id: 'tierra', nombre: 'Puesta a tierra', peso: 12 },
    { id: 'circuitos', nombre: 'Conductores y protecciones', peso: 14 },
    { id: 'canal', nombre: 'Canalizaciones y cajas', peso: 12 },
    { id: 'tablero', nombre: 'Tablero', peso: 12 },
    { id: 'cableado', nombre: 'Colores y cableado', peso: 12 },
    { id: 'pruebas', nombre: 'Energizar y probar', peso: 12 }
  ];

  /* Sitios posibles del tablero general */
  O.SITIOS = {
    hall: { nombre: 'Hall, muro M5', x: 6.0 - F, y: 3.95, z: 1.6, muro: 'M5', frente: [-1, 0], amb: 'hall' },
    sala: { nombre: 'Sala-comedor, muro M1', x: 1.5, y: 5.6 - F, z: 1.6, muro: 'M1', frente: [0, -1], amb: 'sala' },
    bano: { nombre: 'Baño, muro M6', x: 6.5, y: 6.4 - F, z: 1.6, muro: 'M6', frente: [0, -1], amb: 'bano' },
    ropas: { nombre: 'Patio de ropas, muro M2', x: 1.0, y: 8 + F, z: 1.6, muro: 'M2', frente: [0, 1], amb: 'ropas' }
  };
  /* Opciones de ubicación del medidor */
  O.MEDIDORES = {
    fachada: { nombre: 'En la fachada, junto al andén (acceso libre desde la vía)', ok: true },
    cocina: { nombre: 'Dentro de la casa, en la cocina', ok: false, falla: 'El medidor debe poder leerse y operarse desde fuera, sin entrar a la vivienda.' },
    patio: { nombre: 'En el patio de ropas, al fondo del lote', ok: false, falla: 'Queda lejos de la vía pública y detrás de la vivienda: el operador de red no puede acceder.' }
  };

  /* ---------------- Estado inicial ---------------- */
  O.nuevo = function (o) {
    o = o || {};
    const base = L.CASA.electrico;
    const puntos = O.clon(base.puntos).map((p) => {
      if (p.tipo === 'toma') p.ap = p.gfci ? (p.ip ? 'gfci-ip' : 'gfci') : 'comun';
      delete p.gfci; delete p.gfciCarga; delete p.ip; delete p.nota;
      return p;
    });
    const circuitos = O.clon(base.circuitos).map((c) => {
      c.ref = { awg: c.awg, In: c.In, tierra: c.tierra, tubo: c.tubo, nivel: c.nivel, fase: c.fase, dif: !!c.diferencial };
      c.awg = c.tierra = c.In = c.tubo = c.nivel = c.fase = null;
      delete c.gfci; delete c.diferencial;
      return c;
    });
    return {
      v: 1, nombre: o.nombre || '', modo: o.modo || 'guiado', lote: o.lote || 'A', seco: true,
      puntos, circuitos, pistas: 0,
      acom: { sistema: null, area: null, va: null, awg: null, In: null, tipo: 'aerea', amarre: 3.0, medidor: null, medZ: 1.6, tubo: null, ruta: null },
      tierra: { rods: [], el: null, L: 2.4, con: null, awg: null, caja: false, wenner: [], rho: null, medido: null, sep: null },
      cables: { recibo: {} },
      canal: { mat: 'PVC', cajas: { lum: null, apar: null, esp: null }, nodo: {} },
      tab: { sitio: 'hall', total: null, slots: {}, puente: null, barraT: null, directorio: null },
      cableado: {},
      pruebas: { def: {}, megger: {}, pe: {}, pol: {}, gfci: {}, carga: false, fallas: {} },
      cert: {}
    };
  };

  /* ---------------- Tablero: espacios ---------------- */
  /* 12 espacios en dos columnas de seis (L y R). La fase alterna por fila: A, B, A, B, A, B. */
  O.faseFila = (row) => (row % 2 === 0 ? 'A' : 'B');
  O.slots = function (E) {
    const out = {};
    const S = E.tab.slots;
    for (const k in S) {
      const s = S[k];
      if (!s || s.cont) continue;
      const row = +k.slice(1);
      out[s.c] = { slot: k, col: k[0], row, fase: O.faseFila(row), tipo: s.tipo || 'tm' };
    }
    return out;
  };
  O.libres = function (E) { let n = 0; for (const col of ['L', 'R']) for (let r = 0; r < 6; r++) if (!E.tab.slots[col + r]) n++; return n; };
  O.quitar = function (E, cid) {
    const S = E.tab.slots;
    for (const k of Object.keys(S)) if (S[k] && S[k].c === cid) delete S[k];
  };
  /* Coloca un circuito en la posición k; los de 2 polos ocupan también la fila siguiente */
  O.colocar = function (E, cid, k, tipo) {
    const c = E.circuitos.find((x) => x.id === cid);
    if (!c) return { ok: false, msg: 'Circuito desconocido' };
    const col = k[0], row = +k.slice(1);
    const dos = c.polos === 2;
    O.quitar(E, cid);
    if (E.tab.slots[k]) return { ok: false, msg: 'Ese espacio ya está ocupado.' };
    if (dos) {
      if (row >= 5) return { ok: false, msg: 'Un interruptor de 2 polos necesita dos espacios seguidos en la misma columna.' };
      if (E.tab.slots[col + (row + 1)]) return { ok: false, msg: 'El espacio de abajo está ocupado: el de 2 polos usa dos espacios seguidos.' };
    }
    E.tab.slots[k] = { c: cid, tipo: tipo || 'tm' };
    if (dos) E.tab.slots[col + (row + 1)] = { c: cid, cont: true };
    return { ok: true };
  };

  /* ---------------- Casa derivada del estado ---------------- */
  O.casaDe = function (E, opt) {
    opt = opt || {};
    const base = L.CASA;
    const puntos = E.puntos.map((p) => Object.assign({}, p));
    const byId = {};
    puntos.forEach((p) => { byId[p.id] = p; });
    const sitio = O.SITIOS[E.tab.sitio] || O.SITIOS.hall;
    const tgBase = Object.assign({ id: 'TG', espacios: 12, totalizador: { In: E.tab.total || 60, polos: 2 } }, sitio);
    byId.TG = Object.assign({ tipo: 'tablero' }, tgBase);
    const sl = O.slots(E);
    const circuitos = E.circuitos.map((c) => {
      const d = Object.assign({}, c);
      const s = sl[c.id];
      d.fase = c.polos === 2 ? 'AB' : (s ? s.fase : 'A');
      d.diferencial = !!(s && s.tipo === 'dif');
      if (opt.rellenar !== false) { d.awg = c.awg || '14'; d.tierra = c.tierra || '14'; d.In = c.In || 15; d.tubo = c.tubo || '1/2'; d.nivel = c.nivel || 'piso'; }
      return d;
    });
    /* protección por falla a tierra derivada: GFCI propio o ancestro GFCI en el árbol del circuito */
    for (const c of circuitos) {
      const padre = {};
      c.arbol.forEach(([u, v]) => { padre[v] = u; });
      for (const p of puntos) {
        if (p.c !== c.id || p.tipo !== 'toma') continue;
        p.gfci = p.ap === 'gfci' || p.ap === 'gfci-ip';
        p.ip = p.ap === 'gfci-ip';
        delete p.gfciCarga;
        if (p.gfci) continue;
        let a = padre[p.id], guard = 0;
        while (a && guard++ < 40) {
          const q = byId[a];
          if (q && q.tipo === 'toma' && (q.ap === 'gfci' || q.ap === 'gfci-ip')) { p.gfciCarga = q.id; break; }
          a = padre[a];
        }
      }
    }
    const casa = Object.create(base);
    casa.electrico = Object.assign({}, base.electrico, { puntos, circuitos, tablero: tgBase });
    casa.punto = (id) => byId[id];
    casa.circuito = (id) => circuitos.find((c) => c.id === id);
    casa.E = E;
    return casa;
  };

  /* ---------------- Utilidades de resultados ---------------- */
  const it = (estado, ref, texto, extra) => Object.assign({ estado, ref, texto }, extra || {});
  const resumen = (items, extra) => {
    const rel = items.filter((i) => i.estado !== 'info');
    const ok = rel.filter((i) => i.estado === 'ok').length, av = rel.filter((i) => i.estado === 'aviso').length;
    const falla = rel.filter((i) => i.estado === 'falla').length, pend = rel.filter((i) => i.estado === 'pend').length;
    const frac = rel.length ? (ok + 0.5 * av) / rel.length : 0;
    return Object.assign({ items, ok, aviso: av, falla, pend, n: rel.length, frac, listo: falla === 0 && pend === 0 && rel.length > 0 }, extra || {});
  };
  O.resumen = resumen; O.it = it;

  /* ---------------- 1. Plano y puntos ---------------- */
  O.ev = {};
  O.ev.plano = function (E) {
    const casa = O.casaDe(E);
    const items = [];
    for (const h of G.verificar(casa)) {
      /* las reglas que dependen del tablero, de la protección y de la ducha se evalúan en sus propias etapas */
      if (h.ref === 'RETIE 3.17.15 b' || h.ref === 'RETIE 3.17.15 c' || /3\.17\.19|Título 4 e|Criterio de diseño/.test(h.ref)) continue;
      items.push(it(h.estado === 'ok' ? 'ok' : h.estado === 'aviso' ? 'aviso' : 'falla', h.ref, h.texto, { punto: h.punto }));
    }
    return resumen(items);
  };
  /* Protección por falla a tierra de una toma: texto o null */
  O.proteccionGFCI = (casa, p) => G.protegidaGFCI(casa, p);

  /* Agrega una toma a un circuito sobre una pared; devuelve el punto */
  O.agregarToma = function (E, o) {
    const id = o.id || nuevoId(E, 'TX');
    const c = E.circuitos.find((x) => x.id === o.c);
    const p = { id, tipo: 'toma', x: o.x, y: o.y, z: o.z == null ? 0.3 : o.z, amb: o.amb, c: o.c, muro: o.muro, ap: o.ap || 'comun' };
    if (o.meson) p.meson = true;
    if (o.ext) p.ext = true;
    // se cuelga del nodo más cercano del circuito
    const casa = O.casaDe(E);
    let mejor = 'TG', dm = Infinity;
    const nodos = new Set(['TG']);
    c.arbol.forEach(([u, v]) => { nodos.add(u); nodos.add(v); });
    for (const n of nodos) {
      const q = casa.punto(n);
      if (!q) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < dm) { dm = d; mejor = n; }
    }
    E.puntos.push(p);
    c.arbol.push([mejor, id]);
    return p;
  };
  function nuevoId(E, pre) {
    let n = 1;
    while (E.puntos.some((p) => p.id === pre + n)) n++;
    return pre + n;
  }
  O.quitarPunto = function (E, id) {
    const p = E.puntos.find((x) => x.id === id);
    if (!p) return false;
    const c = E.circuitos.find((x) => x.id === p.c);
    const pa = c.arbol.find(([, v]) => v === id);
    const padre = pa ? pa[0] : 'TG';
    c.arbol = c.arbol.filter(([u, v]) => v !== id).map(([u, v]) => (u === id ? [padre, v] : [u, v]));
    E.puntos = E.puntos.filter((x) => x.id !== id);
    return true;
  };

  /* ---------------- 2. Demanda y acometida ---------------- */
  O.acomInfo = function (E, casa) {
    casa = casa || O.casaDe(E);
    const d = Q.demanda(casa);
    const a = E.acom;
    const lote = N.LOTES[E.lote];
    const Lac = lote.red + (a.tipo === 'aerea' ? Math.max(0, a.amarre - a.medZ) : 0.6 + a.medZ);
    const awg = a.awg;
    const info = { dem: d, I: d.I240, area: casa.areaConstruida(), Lac, red: lote.red };
    if (awg) {
      info.ampac = N.AMPACIDAD[awg][0];
      info.ci = C.capacidadInstalable(awg, 240);
      info.pmax = C.protMax(awg, 60);
      info.dv = C.caida({ I: d.I240, L: Lac, awg, V: 240 });
      info.min = N.AWG.find((x) => N.AMPACIDAD[x][0] >= d.I240);
      const med = casa.electrico.medidor, tg = casa.punto('TG');
      info.Lal = Math.abs(a.medZ - casa.H.zPiso) + Math.hypot(tg.x - med.x, tg.y - med.y) + Math.abs(tg.z - 0.25 - casa.H.zPiso);
      info.dvAl = C.caida({ I: d.I240, L: info.Lal, awg, V: 240 });
      info.min2 = N.AWG.find((x) => N.AMPACIDAD[x][0] >= d.I240 && C.caida({ I: d.I240, L: Lac, awg: x, V: 240 }).pct + C.caida({ I: d.I240, L: info.Lal, awg: x, V: 240 }).pct <= 2.0) || info.min;
      info.tuboMin = C.llenado([awg, awg, awg, N.gec(awg)], 'PVC').minimo;
    }
    return info;
  };
  O.ev.acometida = function (E) {
    const casa = O.casaDe(E);
    const a = E.acom;
    const info = O.acomInfo(E, casa);
    const items = [];
    const dem = info.dem;
    // sistema
    items.push(a.sistema == null ? it('pend', 'RETIE 3.3.2 y Tabla 3.5.a', 'Elija el sistema de alimentación.')
      : a.sistema === '1F3H' ? it('ok', 'RETIE Tabla 3.5.a', 'Monofásico trifilar 120/240 V: sirve la estufa y la ducha y las cargas de 120 V.')
        : it('falla', 'RETIE Tabla 3.5.a', a.sistema === '1F2H' ? 'Un sistema bifilar de 120 V no puede alimentar la estufa de 240 V ni una carga de 13 kVA.' : 'Un trifásico 208/120 V no corresponde a una vivienda unifamiliar con una sola acometida en 120/240 V.'));
    // área y demanda
    const eA = a.area == null ? null : Math.abs(a.area - info.area) / info.area;
    items.push(eA == null ? it('pend', 'NTC 2050, 220.12', 'Calcule el área construida de la vivienda (por caras exteriores de muros).')
      : eA <= 0.03 ? it('ok', 'NTC 2050, 220.12', `Área construida ${C.fmt(a.area, 1)} m² (valor de referencia ${C.fmt(info.area, 1)} m²).`)
        : it('falla', 'NTC 2050, 220.12', `El área ${C.fmt(a.area, 1)} m² no coincide con la medida por caras exteriores (${C.fmt(info.area, 1)} m²).`));
    const eD = a.va == null ? null : Math.abs(a.va - dem.total) / dem.total;
    items.push(eD == null ? it('pend', 'NTC 2050, art. 220 parte III', 'Calcule la demanda total de la vivienda (VA).')
      : eD <= 0.03 ? it('ok', 'NTC 2050, art. 220 parte III', `Demanda ${C.fmt(a.va, 0)} VA: coincide con el método estándar (${C.fmt(dem.total, 0)} VA, ${C.fmt(dem.I240, 1)} A a 240 V).`)
        : it('falla', 'NTC 2050, art. 220 parte III', `La demanda ${C.fmt(a.va, 0)} VA se aparta del método estándar (${C.fmt(dem.total, 0)} VA).`));
    // calibre
    if (!a.awg) items.push(it('pend', 'NTC 2050, Tabla 310.15(B)(16)', 'Escoja el calibre de los conductores de la acometida.'));
    else if (info.ampac < info.I) items.push(it('falla', 'NTC 2050, Tabla 310.15(B)(16)', `${a.awg} AWG soporta ${info.ampac} A (columna de 60 °C) y la demanda es ${C.fmt(info.I, 1)} A: se sobrecalienta.`));
    else if (N.awgNum(a.awg) < N.awgNum(info.min2) - 1) items.push(it('aviso', 'Criterio económico', `${a.awg} AWG soporta ${info.ampac} A y bastaba ${info.min2} AWG: sobredimensionado.`));
    else items.push(it('ok', 'NTC 2050, Tabla 310.15(B)(16)', `${a.awg} AWG soporta ${info.ampac} A ≥ ${C.fmt(info.I, 1)} A de demanda.`));
    // capacidad instalable y ruta
    if (a.awg) {
      const ruta = C.rutaConformidad({ uso: 'residencial', cuentas: 1, kVA: info.ci.kVA, V: 240 });
      info.ruta = ruta;
      items.push(a.ruta == null ? it('pend', 'RETIE 3.3.2 y 4.3.2', `Con ${C.fmt(info.ci.kVA, 1)} kVA de capacidad instalable, ¿qué documentación corresponde a la obra?`)
        : a.ruta === 'esquema' ? it('ok', 'RETIE 3.3.2 y 4.3.2', 'Esquema constructivo + declaración de cumplimiento del constructor, sin dictamen de inspección (≤ 15 kVA, ≤ 240 V, una cuenta).')
          : it('falla', 'RETIE 3.3.2 y 4.3.2', a.ruta === 'detallado' ? 'No hace falta diseño detallado: una vivienda de una cuenta, ≤ 15 kVA y ≤ 240 V sigue el esquema constructivo.' : 'La certificación plena con dictamen de inspección no aplica a una vivienda ≤ 15 kVA con una cuenta.'));
    }
    // totalizador
    if (a.awg) {
      if (!a.In) items.push(it('pend', 'NTC 2050, 240.4 y 230.90', 'Escoja el interruptor automático principal (2 polos).'));
      else if (a.In < info.I) items.push(it('falla', 'NTC 2050, 230.90', `El principal de ${a.In} A es menor que la demanda de ${C.fmt(info.I, 1)} A: dispararía en uso normal.`));
      else if (a.In > info.pmax) items.push(it('falla', 'NTC 2050, 240.4', `El principal de ${a.In} A no protege al ${a.awg} AWG (máximo ${info.pmax} A).`));
      else items.push(it('ok', 'NTC 2050, 230.90 y 240.4', `Principal de ${a.In} A: cubre la demanda (${C.fmt(info.I, 1)} A) y protege al ${a.awg} AWG (máx. ${info.pmax} A).`));
    }
    // acometida: tipo y alturas
    if (a.tipo === 'aerea') {
      const baja = a.amarre - N.FLECHA;
      items.push(baja >= N.ACOMETIDA_ALTURAS.fachada ? it('ok', 'NTC 2050, 230.24(B)', `Amarre a ${C.fmt(a.amarre, 1)} m; con la flecha de ${N.FLECHA} m el punto más bajo queda a ${C.fmt(baja, 2)} m (mínimo 3,0 m sobre zona peatonal).`)
        : it('falla', 'NTC 2050, 230.24(B)', `Con el amarre a ${C.fmt(a.amarre, 1)} m el cable cuelga hasta ${C.fmt(baja, 2)} m: menos de 3,0 m sobre zona peatonal.`));
    } else {
      items.push(it('ok', 'NTC 2050, 230.30 y 300.5', 'Acometida subterránea en tubería enterrada a 0,6 m como mínimo (PVC), con cinta de aviso.'));
    }
    // medidor
    items.push(!a.medidor ? it('pend', 'Norma del operador de red', 'Escoja dónde va el medidor.')
      : !O.MEDIDORES[a.medidor].ok ? it('falla', 'Norma del operador de red', O.MEDIDORES[a.medidor].falla)
        : (a.medZ >= N.MEDIDOR_ALTURA[0] - 1e-9 && a.medZ <= N.MEDIDOR_ALTURA[1] + 1e-9) ? it('ok', 'Norma del operador de red', `Medidor en la fachada a ${C.fmt(a.medZ, 2)} m del piso (rango habitual 1,40 a 1,80 m; consulte la norma de su electrificadora).`)
          : it('falla', 'Norma del operador de red', `El medidor a ${C.fmt(a.medZ, 2)} m queda fuera del rango habitual de lectura (1,40 a 1,80 m).`));
    // caída de tensión
    if (a.awg) {
      const pct = info.dv.pct + info.dvAl.pct;
      items.push(info.dv.pct > N.UMBRAL.dV_acometida ? it('falla', 'RETIE Título 26 f', `La acometida pierde ${C.fmt(info.dv.pct, 2)} % (> 3 %): aumente el calibre o acerque el medidor.`)
        : pct > 2.0 ? it('falla', 'RETIE Título 26 f', `Acometida (${C.fmt(info.dv.pct, 2)} %, ${C.fmt(info.Lac, 1)} m) más alimentador (${C.fmt(info.dvAl.pct, 2)} %) suman ${C.fmt(pct, 2)} %: el total de la instalación es 5 % y los ramales usan hasta 3 %, así que hasta el tablero debe quedar en 2 % o menos. Suba el calibre.`)
          : it('ok', 'RETIE Título 26 f', `Caída en la acometida ${C.fmt(info.dv.pct, 2)} % (${C.fmt(info.Lac, 1)} m) y en el alimentador ${C.fmt(info.dvAl.pct, 2)} %: suman ${C.fmt(pct, 2)} % (máx. 2 %), con lo que quedan 3 % para los ramales dentro del 5 % total.`));
      // tubo del alimentador
      if (!a.tubo) items.push(it('pend', 'NTC 2050, Capítulo 9, Tabla 1', 'Escoja el diámetro del tubo del alimentador (medidor al tablero).'));
      else {
        const ll = C.llenado([a.awg, a.awg, a.awg, N.gec(a.awg)], 'PVC', a.tubo);
        items.push(ll.ok ? it('ok', 'NTC 2050, Cap. 9, Tabla 1', `Tubo PVC de ${a.tubo} in con 3 conductores de ${a.awg} AWG y la tierra de ${N.gec(a.awg)} AWG: ocupación ${C.fmt(ll.pct, 0)} % (máx. 40 %).`)
          : it('falla', 'NTC 2050, Cap. 9, Tabla 1', `Tubo PVC de ${a.tubo} in al ${C.fmt(ll.pct, 0)} % de ocupación: supera el 40 % para más de dos conductores.`));
      }
    }
    return resumen(items, { info });
  };

  /* ---------------- 3. Puesta a tierra ---------------- */
  /* Resistividad aparente del lote (Wenner) para una separación a */
  O.rhoAp = (E, a) => {
    const s = N.LOTES[E.lote];
    return C.wenner2(a, s.rho1, s.rho2, s.h) * (E.seco ? N.ESTACION_SECA : 1);
  };
  O.rhoDiseno = (E) => O.rhoAp(E, E.tierra.L || 2.4);
  O.tierraInfo = function (E) {
    const t = E.tierra;
    const el = N.ELECTRODOS.find((x) => x.id === t.el);
    const out = { n: t.rods.length, el, rhoVerd: O.rhoDiseno(E) };
    if (t.rods.length && el) {
      const v = C.rVarillas(out.rhoVerd, t.L, el.d, t.rods.map((r) => [r.x, r.y]));
      out.R = v.R; out.R1 = v.R1;
      if (t.rho) out.Rest = C.rVarillas(t.rho, t.L, el.d, t.rods.map((r) => [r.x, r.y])).R;
    }
    let sepMin = Infinity;
    for (let i = 0; i < t.rods.length; i++) for (let j = i + 1; j < t.rods.length; j++) sepMin = Math.min(sepMin, C.dist([t.rods[i].x, t.rods[i].y], [t.rods[j].x, t.rods[j].y]));
    out.sepMin = sepMin;
    return out;
  };
  O.ev.tierra = function (E) {
    const t = E.tierra, a = E.acom;
    const info = O.tierraInfo(E);
    const items = [];
    items.push(!t.wenner.length ? it('pend', 'IEEE 81 / RETIE 3.12', 'Mida la resistividad del lote con el método de Wenner (al menos tres separaciones).')
      : t.wenner.length < 3 ? it('aviso', 'IEEE 81', 'Con menos de tres separaciones no se ve cómo cambia la resistividad con la profundidad.')
        : it('ok', 'IEEE 81 / RETIE 3.12', `${t.wenner.length} mediciones de Wenner realizadas.`));
    if (t.rho != null) {
      const e = Math.abs(t.rho - info.rhoVerd) / info.rhoVerd;
      items.push(e <= 0.25 ? it('ok', 'Memoria de cálculo', `ρ de diseño ${C.fmt(t.rho, 0)} Ω·m (valor real a la profundidad del electrodo: ${C.fmt(info.rhoVerd, 0)} Ω·m).`)
        : it('aviso', 'Memoria de cálculo', `ρ de diseño ${C.fmt(t.rho, 0)} Ω·m difiere más de 25 % de la del terreno a la profundidad del electrodo (${C.fmt(info.rhoVerd, 0)} Ω·m).`));
    } else items.push(it('pend', 'Memoria de cálculo', 'Fije la resistividad de diseño a partir de las mediciones.'));
    if (!t.el) items.push(it('pend', 'RETIE 3.12', 'Escoja el tipo de electrodo.'));
    else items.push(t.el && info.el.ok ? it('ok', 'RETIE 3.12', info.el.nombre + ': electrodo aceptado.') : it('falla', 'RETIE 3.12', info.el.falla));
    items.push(t.L >= N.ELECTRODO.longitudMin - 1e-9 ? it('ok', 'RETIE 3.12', `Longitud del electrodo ${C.fmt(t.L, 1)} m (mínimo 2,4 m).`)
      : it('falla', 'RETIE 3.12', `Longitud ${C.fmt(t.L, 1)} m: el mínimo del RETIE es 2,4 m.`));
    if (!t.rods.length) items.push(it('pend', 'NTC 2050, 250.53', 'Coloque al menos un electrodo en el lote.'));
    else {
      const ok = info.R != null && info.R <= 25 + 1e-9;
      items.push(info.R == null ? it('pend', 'RETIE 3.12', 'Escoja el electrodo para calcular la resistencia.')
        : ok ? it('ok', 'RETIE Tabla 3.12 y NTC 2050, 250.53(A)', `Resistencia de puesta a tierra ${C.fmt(info.R, 1)} Ω ≤ 25 Ω en ${E.seco ? 'época seca' : 'época húmeda'} con ${info.n} electrodo(s).`)
          : it('falla', 'RETIE Tabla 3.12 y NTC 2050, 250.53(A)', `Resistencia ${C.fmt(info.R, 1)} Ω > 25 Ω con ${info.n} electrodo(s): agregue o alargue electrodos.`));
      if (info.n >= 2) items.push(info.sepMin >= 1.8 - 1e-9 ? it('ok', 'NTC 2050, 250.53(B)', `Separación mínima entre electrodos ${C.fmt(info.sepMin, 1)} m (≥ 1,8 m).`)
        : it('falla', 'NTC 2050, 250.53(B)', `Electrodos a ${C.fmt(info.sepMin, 1)} m: separados menos de 1,8 m comparten zona de influencia.`));
      else items.push(info.R != null && info.R <= 25 ? it('ok', 'NTC 2050, 250.53(A)(2)', 'Un solo electrodo con R ≤ 25 Ω no necesita complemento.') : it('aviso', 'NTC 2050, 250.53(A)(2)', 'Un electrodo con más de 25 Ω exige un segundo electrodo.'));
      const lejos = t.rods.every((r) => r.y <= -0.5);
      items.push(lejos ? it('ok', 'Buena práctica', 'Electrodos a 0,5 m o más de la cimentación, en suelo natural del antejardín.') : it('aviso', 'Buena práctica', 'Algún electrodo queda pegado a la cimentación.'));
    }
    if (!a.awg) items.push(it('pend', 'NTC 2050, Tabla 250.66', 'Escoja primero el calibre de la acometida (etapa 2) para dimensionar el conductor del electrodo.'));
    else if (!t.awg) items.push(it('pend', 'NTC 2050, Tabla 250.66', 'Escoja el calibre del conductor del electrodo de puesta a tierra.'));
    else if (N.mayorIgual(t.awg, N.gec(a.awg))) items.push(it('ok', 'NTC 2050, Tabla 250.66', `Conductor del electrodo ${t.awg} AWG de cobre (mínimo ${N.gec(a.awg)} AWG para acometida de ${a.awg} AWG).`));
    else items.push(it('falla', 'NTC 2050, Tabla 250.66', `${t.awg} AWG es menor que el ${N.gec(a.awg)} AWG exigido para una acometida de ${a.awg} AWG.`));
    if (!t.con) items.push(it('pend', 'RETIE 3.12', 'Escoja cómo se une el conductor al electrodo.'));
    else { const c = N.CONEXIONES_TIERRA.find((x) => x.id === t.con); items.push(c.ok ? it('ok', 'RETIE 3.12', c.nombre + ': conexión aceptada.') : it('falla', 'RETIE 3.12', c.falla)); }
    items.push(t.caja ? it('ok', 'RETIE 3.12', 'Caja de inspección de 0,30 m sobre el electrodo para medir sin excavar.') : it('pend', 'RETIE 3.12', 'Falta la caja de inspección de 0,30 m sobre el electrodo.'));
    // medición con telurómetro
    if (t.medido == null) items.push(it('pend', 'IEEE 81', 'Mida la resistencia de puesta a tierra construida con el telurómetro (caída de potencial).'));
    else {
      const e = info.R ? Math.abs(t.medido - info.R) / info.R : 1;
      items.push(e <= 0.15 && t.medido <= 25 ? it('ok', 'IEEE 81 / RETIE 3.12', `Resistencia medida ${C.fmt(t.medido, 1)} Ω ≤ 25 Ω y consistente con el cálculo (${C.fmt(info.R, 1)} Ω).`)
        : t.medido > 25 ? it('falla', 'RETIE 3.12', `La resistencia medida es ${C.fmt(t.medido, 1)} Ω, por encima de 25 Ω.`)
          : it('aviso', 'IEEE 81', `La medición ${C.fmt(t.medido, 1)} Ω difiere más de 15 % del valor real (${C.fmt(info.R, 1)} Ω): coloque las sondas fuera de la zona de influencia (62 % de la distancia a la sonda de corriente).`));
    }
    return resumen(items, { info });
  };

  /* ---------------- 4. Conductores y protecciones ---------------- */
  /* Número de conductores portadores de corriente en el tramo más cargado del circuito */
  O.nPortadores = function (c, tr) {
    let n = 2;
    for (const t of tr) if (t.c === c.id) n = Math.max(n, t.senales.filter((s) => s !== 'T').length);
    return n;
  };
  O.analisisCircuito = function (E, c, casa, tr, cuadro, caidas) {
    casa = casa || O.casaDe(E);
    tr = tr || R.tramos(casa);
    cuadro = cuadro || Q.cuadro(casa);
    caidas = caidas || Q.caidas(casa);
    const r = cuadro.find((x) => x.id === c.id);
    const cd = caidas.find((x) => x.id === c.id);
    const nPort = O.nPortadores(c, tr);
    const out = { Ib: r.I, VA: r.va, nPort, caida: cd.pct, Lmax: cd.Lmax, lejano: cd.lejano };
    if (c.awg) {
      out.Iz = C.ampacidad(c.awg, 60, O.TA, nPort);
      out.pmax = C.protMax(c.awg, 60, O.TA, nPort);
      const cd2 = Q.caidas(casa).find((x) => x.id === c.id);
      out.caida = cd2.pct;
    }
    return out;
  };
  O.ev.circuitos = function (E) {
    const casa = O.casaDe(E);
    const tr = R.tramos(casa), cuadro = Q.cuadro(casa), caidas = Q.caidas(casa);
    const items = [];
    const det = {};
    // recibo de materiales
    const rec = E.cables.recibo;
    const nRec = N.ROLLOS.length;
    const hechos = N.ROLLOS.filter((r) => rec[r.id] != null).length;
    if (hechos < nRec) items.push(it('pend', 'RETIE 3.2.2 y Libro 3 (productos)', `Recibo de materiales: revise los ${nRec} rollos (${hechos} revisados).`));
    else {
      const bien = N.ROLLOS.every((r) => (rec[r.id] === 'acepta') === r.ok);
      items.push(bien ? it('ok', 'RETIE 3.2.2 y Libro 3 (productos)', 'Recibo de materiales: aceptó el rollo conforme y rechazó los tres que no cumplen.')
        : it('falla', 'RETIE 3.2.2 y Libro 3 (productos)', 'Recibo de materiales: hay rollos mal aceptados o rechazados.'));
    }
    for (const c of E.circuitos) {
      const a = O.analisisCircuito(E, c, casa, tr, cuadro, caidas);
      det[c.id] = a;
      if (!c.awg || !c.In || !c.tierra) { items.push(it('pend', 'NTC 2050, 210.19 y 240.4', `${c.id} ${c.nombre}: escoja calibre, protección y tierra.`, { c: c.id })); continue; }
      const prob = [];
      const nota = [];
      if (c.In < a.Ib - 1e-9) prob.push(`protección de ${c.In} A menor que la corriente de ${C.fmt(a.Ib, 1)} A`);
      if (c.In > a.pmax + 1e-9) prob.push(`${c.awg} AWG con ${a.nPort} conductores soporta ${C.fmt(a.Iz, 1)} A y solo admite protección hasta ${a.pmax} A, no ${c.In} A`);
      if (!N.mayorIgual(c.tierra, N.egc(c.In))) prob.push(`tierra de ${c.tierra} AWG: para ${c.In} A la Tabla 250.122 pide ${N.egc(c.In)} AWG como mínimo`);
      if (N.awgNum(c.tierra) < N.awgNum(c.awg)) prob.push(`la tierra (${c.tierra} AWG) no necesita ser mayor que el conductor de fase (${c.awg} AWG)`);
      if (['C4', 'C5', 'C6'].includes(c.id) && (c.In !== 20 || !N.mayorIgual(c.awg, '12'))) prob.push('los circuitos de pequeños artefactos de cocina y de lavandería son de 20 A con 12 AWG como mínimo (210.11(C))');
      if (c.id === 'C7') {
        if (c.In < 30) prob.push('la ducha se dimensiona para 30 A como mínimo (RETIE 3.17.15 b)');
        if (!N.mayorIgual(c.awg, '10')) prob.push('para 30 A el conductor es 10 AWG como mínimo');
      }
      if (c.In === 20 && !N.mayorIgual(c.awg, '12') && !['C4', 'C5', 'C6'].includes(c.id)) prob.push('protección de 20 A exige 12 AWG');
      if (a.caida > 5) prob.push(`caída de tensión ${C.fmt(a.caida, 1)} % (> 5 %)`);
      else if (a.caida > 3) nota.push(`caída ${C.fmt(a.caida, 1)} % (recomendado ≤ 3 % en el ramal)`);
      if (prob.length) items.push(it('falla', 'NTC 2050, 210.19, 240.4, 250.122', `${c.id}: ` + prob.join('; ') + '.', { c: c.id }));
      else if (nota.length) items.push(it('aviso', 'NTC 2050, 210.19 FPN', `${c.id}: ${c.In} A, ${c.awg} AWG, tierra ${c.tierra} AWG cumplen; ${nota.join('; ')}.`, { c: c.id }));
      else items.push(it('ok', 'NTC 2050, 210.19, 240.4, 250.122', `${c.id}: ${C.fmt(a.Ib, 1)} A ≤ ${c.In} A ≤ ${a.pmax} A; ${c.awg} AWG (Iz ${C.fmt(a.Iz, 1)} A, ${a.nPort} conductores), tierra ${c.tierra} AWG, caída ${C.fmt(a.caida, 2)} %.`, { c: c.id }));
    }
    return resumen(items, { det });
  };

  /* ---------------- 5. Canalizaciones y cajas ---------------- */
  /* Caja de un nodo: conductores que concurren, aparatos y volumen mínimo */
  O.cajaNodo = function (casa, c, id, tr) {
    const p = casa.punto(id);
    const conds = [];
    let tierras = 0;
    for (const t of tr) {
      if (t.c !== c.id) continue;
      if (t.u !== id && t.v !== id) continue;
      t.senales.forEach((s, i) => { if (s === 'T') tierras++; else conds.push(t.calibres[i]); });
    }
    let aparatos = 0;
    if (p.tipo === 'int2') aparatos = 2; else if (['int', 'conm', 'toma', 'ducha', 'estufa'].includes(p.tipo)) aparatos = 1;
    if (p.tipo === 'toma' && p.ap === 'gfci-ip') aparatos = 1;
    const aAwg = conds.length ? conds.sort((x, y) => N.awgNum(x) - N.awgNum(y))[0] : c.awg;
    const req = C.volumenCaja({ conds, aparatos, aparatosAwg: aAwg, tierras: tierras ? 1 : 0, abrazaderas: false });
    return { conds: conds.length + tierras, aparatos, req };
  };
  O.grupoCaja = (p) => (p.tipo === 'lum' || p.tipo === 'aplique' ? 'lum' : (p.tipo === 'ducha' || p.tipo === 'estufa') ? 'esp' : 'apar');
  O.CAJAS_GRUPO = { lum: ['oct-38', 'cuad-38', 'cuad-54'], apar: ['rect-pvc', 'rect-met', 'cuad-38', 'cuad-54'], esp: ['rect-pvc', 'cuad-38', 'cuad-54'] };
  O.cajaDe = (E, p) => N.CAJAS.find((x) => x.id === (E.canal.nodo[p.id] || E.canal.cajas[O.grupoCaja(p)]));
  /* Cajas sin volumen suficiente, con la caja mínima que serviría */
  O.cajasMalas = function (E, casa, tr) {
    casa = casa || O.casaDe(E); tr = tr || R.tramos(casa);
    const out = [];
    for (const c of casa.electrico.circuitos) {
      const nodos = new Set();
      c.arbol.forEach(([u, v]) => { nodos.add(u); nodos.add(v); });
      for (const id of nodos) {
        if (id === 'TG') continue;
        const p = casa.punto(id), cj = O.cajaDe(E, p), cb = O.cajaNodo(casa, c, id, tr);
        if (!cj || cb.req <= cj.vol + 1e-9) continue;
        const min = O.CAJAS_GRUPO[O.grupoCaja(p)].map((k) => N.CAJAS.find((x) => x.id === k)).sort((a, b) => a.vol - b.vol).find((x) => x.vol >= cb.req) || null;
        out.push({ id, c: c.id, caja: cj, req: cb.req, conds: cb.conds, aparatos: cb.aparatos, min });
      }
    }
    return out;
  };
  O.ev.canal = function (E) {
    const casa = O.casaDe(E);
    const tr = R.tramos(casa);
    const items = [];
    const mat = E.canal.mat;
    for (const c of E.circuitos) {
      if (!c.tubo || !c.nivel) { items.push(it('pend', 'NTC 2050, Cap. 9, Tabla 1', `${c.id} ${c.nombre}: escoja nivel y diámetro del tubo.`, { c: c.id })); continue; }
      let peor = null;
      for (const t of tr) if (t.c === c.id) {
        const ll = C.llenado(t.calibres, mat, c.tubo);
        if (!peor || ll.pct > peor.pct) peor = { pct: ll.pct, ok: ll.ok, min: ll.minimo, n: ll.n, t };
      }
      const prob = [];
      if (peor && !peor.ok) prob.push(`tubo de ${c.tubo} in al ${C.fmt(peor.pct, 0)} % en ${peor.t.u}–${peor.t.v} con ${peor.n} conductores (máx. ${C.fmt(100 * N.llenadoMax(peor.n), 0)} %; mínimo ${peor.min ? peor.min.d : '—'} in)`);
      if (c.nivel === 'losa') {
        const tubo = N.TUBOS[mat].find((x) => x.d === c.tubo);
        const lo = R.tuboEnLosa({ de: tubo.de });
        if (!lo.okD) prob.push(`un tubo de ${C.fmt(tubo.de, 1)} mm no cabe en una losa de 12 cm (máx. ${C.fmt(lo.limD, 0)} mm = e/3, NSR-10 C.6.3)`);
      }
      items.push(prob.length ? it('falla', 'NTC 2050 Cap. 9 y NSR-10 C.6.3', `${c.id}: ` + prob.join('; ') + '.', { c: c.id })
        : it('ok', 'NTC 2050 Cap. 9', `${c.id}: tubo ${mat} de ${c.tubo} in en ${c.nivel === 'losa' ? 'la losa' : 'el contrapiso'}, ocupación máxima ${C.fmt(peor.pct, 0)} % (límite ${C.fmt(100 * N.llenadoMax(peor.n), 0)} %).`, { c: c.id }));
    }
    // interferencias con la estructura
    const filtro = casa.electrico.circuitos.every((c) => c.nivel);
    const inter = R.interferencias(casa);
    const crit = inter.filter((x) => x.critico), norm = inter.filter((x) => !x.critico && x.tipo !== 'cim' && x.tipo !== 'caja');
    items.push(crit.length ? it('falla', 'NSR-10 C.6.3 y buena práctica', `${crit.length} interferencia(s) crítica(s) con la estructura: ${crit[0].texto}`)
      : norm.length ? it('ok', 'NSR-10 C.6.3', `${norm.length} cruce(s) de vigas fuera de la zona de confinamiento: se dejan camisas antes del vaciado con la aprobación del ingeniero estructural.`)
        : it('ok', 'NSR-10 C.6.3', 'Ningún tubo cruza vigas ni columnas en zona crítica.'));
    // cajas
    const grupos = ['lum', 'apar', 'esp'];
    const sinCaja = grupos.filter((g) => !E.canal.cajas[g]);
    if (sinCaja.length) items.push(it('pend', 'NTC 2050, 314.16', 'Escoja la caja para luminarias, aparatos (interruptores y tomas) y salidas especiales.'));
    else {
      const malas = O.cajasMalas(E, casa, tr);
      items.push(malas.length ? it('falla', 'NTC 2050, 314.16(B)', `${malas.length} caja(s) sin volumen suficiente; por ejemplo ${malas[0].id} necesita ${C.fmt(malas[0].req, 0)} cm³ y la caja tiene ${C.fmt(malas[0].caja.vol, 0)} cm³.`, { malas })
        : it('ok', 'NTC 2050, 314.16(B)', 'Todas las cajas tienen el volumen necesario para sus conductores y aparatos.'));
      const rect = casa.electrico.puntos.some((p) => O.grupoCaja(p) === 'apar' && O.cajaDe(E, p).id === 'rect-pvc');
      void rect;
    }
    return resumen(items, { inter, tr });
  };

  /* ---------------- 6. Tablero ---------------- */
  O.ev.tablero = function (E) {
    const casa = O.casaDe(E);
    const tg = casa.punto('TG'), sit = O.SITIOS[E.tab.sitio];
    const items = [];
    // sitio
    if (tg.amb === 'bano') items.push(it('falla', 'RETIE 3.17.19 f', 'El tablero no puede quedar en el baño ni dentro del espacio de la ducha.'));
    else {
      const esp = G.espacioTrabajo(casa, tg);
      const prob = [];
      if (!esp.ok) prob.push(`espacio de trabajo de ${C.fmt(esp.prof, 2)} m de profundidad (mínimo 0,9 m)`);
      if (tg.z + 0.2 > N.UMBRAL.palanca_max) prob.push('la palanca queda a más de 2,0 m del piso');
      const am = casa.ambiente(tg.amb);
      if (prob.length) items.push(it('falla', 'RETIE 3.17.19 y Título 4 e', prob.join('; ') + '.'));
      else if (am && am.humedo) items.push(it('aviso', 'RETIE 3.17.19', `${sit.nombre}: zona húmeda; el tablero exige un encerramiento adecuado y queda expuesto a salpicaduras.`));
      else items.push(it('ok', 'RETIE 3.17.19 y Título 4 e', `${sit.nombre}: espacio libre frontal de ${C.fmt(esp.prof, 2)} m, palanca a ${C.fmt(tg.z + 0.2, 2)} m, fuera de zonas húmedas.`));
    }
    // principal
    const info = O.acomInfo(E, casa);
    const a = E.acom;
    if (!E.tab.total) items.push(it('pend', 'NTC 2050, 230.90 y 408', 'Escoja el interruptor principal del tablero.'));
    else if (E.tab.total < info.I) items.push(it('falla', 'NTC 2050, 230.90', `El principal de ${E.tab.total} A es menor que la demanda de ${C.fmt(info.I, 1)} A.`));
    else if (a.awg && E.tab.total > C.protMax(a.awg, 60)) items.push(it('falla', 'NTC 2050, 240.4', `El principal de ${E.tab.total} A no protege el alimentador de ${a.awg} AWG.`));
    else items.push(it('ok', 'NTC 2050, 230.90', `Principal de 2 polos y ${E.tab.total} A.`));
    // circuitos colocados
    const sl = O.slots(E);
    const sin = E.circuitos.filter((c) => !sl[c.id]);
    items.push(sin.length ? it('pend', 'NTC 2050, 408', `Falta colocar en el tablero: ${sin.map((c) => c.id).join(', ')}.`)
      : it('ok', 'NTC 2050, 408', 'Todos los circuitos tienen su interruptor en el tablero.'));
    // ducha diferencial
    const cd = E.circuitos.find((c) => c.arbol.some(([, v]) => casa.punto(v) && casa.punto(v).tipo === 'ducha'));
    if (cd && sl[cd.id]) items.push(sl[cd.id].tipo === 'dif' ? it('ok', 'RETIE 3.17.15 c', `${cd.id} (ducha): interruptor con protección diferencial de 30 mA.`)
      : it('falla', 'RETIE 3.17.15 c', `${cd.id} (ducha): falta la protección diferencial de 30 mA en el tablero.`));
    // reserva
    const libres = O.libres(E);
    items.push(libres >= 2 ? it('ok', 'Criterio de diseño', `${libres} espacios libres de reserva para crecimiento.`) : it('aviso', 'Criterio de diseño', 'Sin espacios de reserva: cualquier ampliación obliga a cambiar el tablero.'));
    // balance
    if (!sin.length) {
      const asign = {};
      E.circuitos.forEach((c) => { asign[c.id] = c.polos === 2 ? 'AB' : sl[c.id].fase; });
      const b = Q.balance(casa, asign);
      items.push(b.desb <= 0.15 ? it('ok', 'Criterio de diseño', `Fases equilibradas: A ${C.fmt(b.A, 0)} VA, B ${C.fmt(b.B, 0)} VA (desbalance ${C.fmt(100 * b.desb, 1)} %).`)
        : it('aviso', 'Criterio de diseño', `Desbalance de ${C.fmt(100 * b.desb, 1)} % (A ${C.fmt(b.A, 0)} VA, B ${C.fmt(b.B, 0)} VA): cambie circuitos de fase; el neutro cargaría ${C.fmt(b.IN, 1)} A.`));
    }
    // barras y rotulado
    items.push(E.tab.puente == null ? it('pend', 'NTC 2050, 250.24 y RETIE 3.12', '¿Va el puente principal que une neutro y tierra en este tablero?')
      : E.tab.puente === 'si' ? it('ok', 'NTC 2050, 250.24(B)', 'Puente principal neutro–tierra instalado en el tablero de acometida (único punto de unión).')
        : it('falla', 'NTC 2050, 250.24(B)', 'Sin el puente principal el neutro queda flotante y una falla a tierra no tiene camino de retorno hasta el transformador.'));
    items.push(E.tab.barraT == null ? it('pend', 'NTC 2050, 250.24(A) y 250.64', '¿Con qué se conecta la barra de tierra del tablero?')
      : E.tab.barraT === 'spt' ? it('ok', 'NTC 2050, 250.24(A)', 'Barra de tierra unida al electrodo de puesta a tierra con el conductor de ' + (E.tierra.awg || N.gec(E.acom.awg || '6')) + ' AWG.')
        : it('falla', 'NTC 2050, 250.24(A)', 'La barra de tierra debe conectarse al electrodo de puesta a tierra; sin ello la carcasa de los aparatos no tiene referencia a tierra.'));
    items.push(E.tab.directorio == null ? it('pend', 'RETIE 3.17.19', '¿Se rotulan los circuitos en el directorio del tablero?')
      : E.tab.directorio === 'si' ? it('ok', 'RETIE 3.17.19', 'Directorio de circuitos rotulado y legible.') : it('falla', 'RETIE 3.17.19', 'Los circuitos deben estar identificados en el tablero.'));
    return resumen(items);
  };

  /* ---------------- Referencia y ayuda ---------------- */
  /* Reparto sugerido de circuitos en el tablero: por carga, alternando fases */
  O.sugerirTablero = function (E) {
    const casa = O.casaDe(E);
    const cuadro = Q.cuadro(casa);
    E.tab.slots = {};
    const orden = [...cuadro].sort((a, b) => b.va - a.va);
    const carga = { A: 0, B: 0 };
    // primero los de 2 polos arriba
    for (const r of orden.filter((x) => x.c.polos === 2)) { O.colocar(E, r.id, 'L0', 'tm'); carga.A += r.va / 2; carga.B += r.va / 2; }
    for (const r of orden.filter((x) => x.c.polos !== 2)) {
      const f = carga.A <= carga.B ? 'A' : 'B';
      let ok = false;
      for (const col of ['L', 'R']) {
        for (let row = 0; row < 6 && !ok; row++) {
          if (O.faseFila(row) !== f || E.tab.slots[col + row]) continue;
          const dif = r.c.arbol.some(([, v]) => casa.punto(v) && casa.punto(v).tipo === 'ducha');
          O.colocar(E, r.id, col + row, dif ? 'dif' : 'tm'); carga[f] += r.va; ok = true;
        }
        if (ok) break;
      }
    }
  };
  /* Aplica la solución de referencia de la guía al estado (uso: botón «ver solución» y pruebas) */
  O.aplicarReferencia = function (E, etapas) {
    etapas = etapas || ['plano', 'acometida', 'tierra', 'circuitos', 'canal', 'tablero'];
    if (etapas.includes('plano')) { /* los puntos ya parten de la referencia */ }
    if (etapas.includes('circuitos')) {
      E.circuitos.forEach((c) => { c.awg = c.ref.awg; c.In = c.ref.In; c.tierra = c.ref.tierra; });
      N.ROLLOS.forEach((r) => { E.cables.recibo[r.id] = r.ok ? 'acepta' : 'rechaza'; });
    }
    if (etapas.includes('canal')) {
      E.circuitos.forEach((c) => { c.tubo = c.ref.tubo; c.nivel = c.ref.nivel; });
      E.canal.mat = 'PVC'; E.canal.cajas = { lum: 'oct-38', apar: 'rect-pvc', esp: 'cuad-38' }; E.canal.nodo = {};
      const casa = O.casaDe(E), tr = R.tramos(casa);
      for (const c of casa.electrico.circuitos) {
        const nodos = new Set();
        c.arbol.forEach(([u, v]) => { nodos.add(u); nodos.add(v); });
        for (const id of nodos) {
          if (id === 'TG') continue;
          const p = casa.punto(id), cb = O.cajaNodo(casa, c, id, tr);
          if (cb.req > O.cajaDe(E, p).vol) {
            const mejor = O.CAJAS_GRUPO[O.grupoCaja(p)].map((k) => N.CAJAS.find((x) => x.id === k)).sort((a, b) => a.vol - b.vol).find((x) => x.vol >= cb.req);
            if (mejor) E.canal.nodo[id] = mejor.id;
          }
        }
      }
    }
    if (etapas.includes('acometida')) {
      const casa = O.casaDe(E);
      const d = Q.demanda(casa), info = N.AWG.find((x) => N.AMPACIDAD[x][0] >= d.I240);
      Object.assign(E.acom, { sistema: '1F3H', area: casa.areaConstruida(), va: d.total, awg: info, tipo: 'aerea', amarre: 4.0, medidor: 'fachada', medZ: 1.6, ruta: 'esquema' });
      /* si la red queda lejos, se sube el calibre para reservar caída a los ramales (total 5 %) */
      for (const a of N.AWG.slice(N.AWG.indexOf(info))) {
        E.acom.awg = a;
        const ii = O.acomInfo(E, casa);
        if (ii.dv.pct + ii.dvAl.pct <= 2.0) break;
      }
      E.acom.In = C.protMax(E.acom.awg, 60);
      E.acom.tubo = C.llenado([E.acom.awg, E.acom.awg, E.acom.awg, N.gec(E.acom.awg)], 'PVC').minimo.d;
    }
    if (etapas.includes('tablero')) {
      O.sugerirTablero(E);
      E.tab.sitio = 'hall';
      E.tab.total = E.acom.In || 60;
      E.tab.puente = 'si'; E.tab.barraT = 'spt'; E.tab.directorio = 'si';
    }
    if (etapas.includes('tierra')) {
      const t = E.tierra;
      t.el = 'acu-16'; t.L = 2.4; t.con = 'exo'; t.caja = true; t.awg = N.gec(E.acom.awg || '6');
      t.wenner = [1, 2, 4, 8].map((a) => ({ a, rho: O.rhoAp(E, a) }));
      t.rho = O.rhoDiseno(E);
      t.rods = [];
      for (let n = 1; n <= 8; n++) {
        t.rods = Array.from({ length: n }, (_, i) => ({ x: 0.9 + 2.4 * i, y: -1.2 }));
        if (O.tierraInfo(E).R <= 22) break;
      }
      t.medido = O.tierraInfo(E).R;
    }
    return E;
  };

  /* Puntaje global */
  O.puntaje = function (E) {
    const res = {};
    let tot = 0, max = 0;
    for (const e of O.ETAPAS) {
      const f = O.ev[e.id] ? O.ev[e.id](E) : { frac: 0, listo: false, items: [] };
      res[e.id] = f;
      tot += e.peso * f.frac; max += e.peso;
    }
    return { por: res, total: tot, max, nota: Math.max(0, Math.round(100 * tot / max - 2 * (E.pistas || 0))) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
