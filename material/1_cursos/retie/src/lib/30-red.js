/* ===================================================================
   lib/30-red.js — Topología de los circuitos de la casa
   · Conductores por tramo (fase, neutro, tierra, retornos y viajeros):
     cada «señal» recorre el subárbol mínimo que une los puntos que la
     necesitan; el número de conductores de un tramo es el número de
     señales que lo atraviesan.
   · Recorridos 3D (bajantes y tramos horizontales en losa o contrapiso),
     longitudes, llenado de tubos y cantidades de obra.
   · Revisión de interferencias con vigas, columnas y vigas de cimentación.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const C = L.C, N = L.N;
  const R = (L.R = {});

  /* Señales que necesita cada punto de un circuito */
  function necesidades(c, casa) {
    const P = (id) => casa.punto(id);
    const nodos = new Set(['TG']);
    c.arbol.forEach(([u, v]) => { nodos.add(u); nodos.add(v); });
    const sig = {}; /* señal → conjunto de nodos */
    const add = (s, n) => { (sig[s] = sig[s] || new Set()).add(n); };
    const dos = c.V === 240 && !c.neutro;
    for (const id of nodos) {
      if (id === 'TG') continue;
      const p = P(id);
      if (!p) continue;
      add('T', id);
      if (p.tipo === 'lum' || p.tipo === 'aplique') { add('N', id); add('R:' + p.s, id); }
      else if (p.tipo === 'int' || p.tipo === 'int2') { add('F', id); p.ctrl.forEach((s) => add('R:' + s, id)); }
      else if (p.tipo === 'conm') {
        const par = P(p.par), primero = [p.id, par.id].sort()[0] === p.id;
        add('V1:' + p.ctrl[0], id); add('V2:' + p.ctrl[0], id);
        if (primero) add('F', id); else add('R:' + p.ctrl[0], id);
      } else if (dos) { add('F1', id); add('F2', id); }
      else { add('F', id); add('N', id); }
    }
    for (const s of ['F', 'N', 'T', 'F1', 'F2']) if (sig[s]) sig[s].add('TG');
    return sig;
  }

  /* Conductores por arista de un circuito */
  R.conductores = function (c, casa) {
    const hijos = {}, padre = {};
    c.arbol.forEach(([u, v]) => { (hijos[u] = hijos[u] || []).push(v); padre[v] = u; });
    const sig = necesidades(c, casa);
    /* nodos del subárbol de cada nodo */
    const sub = {};
    const visit = (n) => { const s = new Set([n]); (hijos[n] || []).forEach((h) => visit(h).forEach((x) => s.add(x))); sub[n] = s; return s; };
    visit('TG');
    const out = {};
    c.arbol.forEach(([u, v]) => {
      const lista = [];
      for (const s in sig) {
        const set = sig[s];
        let k = 0; for (const x of sub[v]) if (set.has(x)) k++;
        if (k > 0 && k < set.size) lista.push(s);
      }
      lista.sort((a, b) => orden(a) - orden(b));
      out[u + '>' + v] = lista;
    });
    return out;
  };
  const orden = (s) => (s === 'F' || s === 'F1' ? 0 : s === 'F2' ? 1 : s === 'N' ? 2 : s.startsWith('R') ? 3 : s.startsWith('V') ? 4 : 5);
  R.nombreSenal = function (s) {
    if (s === 'F') return 'fase'; if (s === 'F1') return 'fase 1'; if (s === 'F2') return 'fase 2';
    if (s === 'N') return 'neutro'; if (s === 'T') return 'tierra';
    if (s.startsWith('R:')) return 'retorno ' + s.slice(2);
    if (s.startsWith('V')) return 'viajero ' + s[1];
    return s;
  };
  /* Color de cada conductor según la Tabla 3.5.a (sistema 120/240 V) */
  R.colorSenal = function (s, c) {
    if (s === 'N') return 'blanco';
    if (s === 'T') return 'verde';
    if (s === 'F2') return 'rojo';
    if (s === 'F' || s === 'F1') return c && c.fase === 'B' ? 'rojo' : 'negro';
    if (s.startsWith('R')) return 'amarillo';
    if (s.startsWith('V')) return 'azul';
    return 'negro';
  };
  /* Calibre de una señal */
  R.calibre = (s, c) => (s === 'T' ? c.tierra || c.awg : c.awg);

  /* Altura de arranque en el tablero (sale por arriba hacia la losa o por abajo al contrapiso) */
  function zNodo(id, nivel, casa) {
    const p = casa.punto(id);
    if (id === 'TG') return nivel === 'losa' ? p.z + 0.25 : p.z - 0.25;
    return p.z;
  }
  /* Recorrido 3D de una arista */
  R.recorrido = function (c, u, v, casa) {
    const a = casa.punto(u), b = casa.punto(v), H = casa.H;
    const zl = c.nivel === 'losa' ? H.zLosa : H.zPiso;
    const za = zNodo(u, c.nivel, casa), zb = zNodo(v, c.nivel, casa);
    return [[a.x, a.y, za], [a.x, a.y, zl], [b.x, b.y, zl], [b.x, b.y, zb]];
  };
  R.longitud = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); return s; };

  /* Tramos completos de la casa con conductores, longitudes y llenado */
  R.tramos = function (casa) {
    const out = [];
    for (const c of casa.electrico.circuitos) {
      const cond = R.conductores(c, casa);
      c.arbol.forEach(([u, v]) => {
        const lista = cond[u + '>' + v];
        const pts = R.recorrido(c, u, v, casa);
        const calibres = lista.map((s) => R.calibre(s, c));
        const ll = C.llenado(calibres, 'PVC', c.tubo);
        out.push({ c: c.id, u, v, nivel: c.nivel, senales: lista, calibres, pts, L: R.longitud(pts), Lh: Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), tubo: c.tubo, llenado: ll });
      });
    }
    return out;
  };

  /* Cantidades de obra */
  R.cantidades = function (casa) {
    const tr = R.tramos(casa);
    const tubos = {}, cables = {}, cajas = { 'octagonal 4 in': 0, 'rectangular 2×4 in': 0, 'cuadrada 4 in con suplemento': 0 };
    const holgura = 0.3; /* por conductor en cada caja */
    for (const t of tr) {
      const k = 'PVC ' + t.tubo + ' in';
      tubos[k] = (tubos[k] || 0) + t.L;
      const c = casa.circuito(t.c);
      t.senales.forEach((s) => {
        const key = R.calibre(s, c) + ' AWG ' + R.colorSenal(s, c);
        cables[key] = (cables[key] || 0) + t.L + 2 * holgura;
      });
    }
    const ap = { lum: 0, aplique: 0, int: 0, int2: 0, conm: 0, toma: 0, gfci: 0, ip: 0, ducha: 0, estufa: 0 };
    for (const p of casa.electrico.puntos) {
      if (p.tipo === 'lum') cajas['octagonal 4 in']++;
      else if (p.tipo === 'aplique') cajas['octagonal 4 in']++;
      else if (p.tipo === 'ducha' || p.tipo === 'estufa') cajas['cuadrada 4 in con suplemento']++;
      else cajas['rectangular 2×4 in']++;
      if (p.tipo === 'toma') { if (p.gfci) ap.gfci++; else ap.toma++; if (p.ip) ap.ip++; }
      else ap[p.tipo] = (ap[p.tipo] || 0) + 1;
    }
    return { tubos, cables, cajas, aparatos: ap, tramos: tr };
  };

  /* Revisión de interferencias con la estructura */
  R.interferencias = function (casa) {
    const cols = casa.columnas(), vigas = casa.vigas(false), cims = casa.vigas(true);
    const conf = 2 * casa.estructura.viga.h; /* zona de confinamiento: 2h desde la cara de la columna */
    const out = [];
    const distCol = (vg, pt) => {
      const s = vg.eje === 'y' ? pt[0] : pt[1];
      return Math.min(Math.abs(s - vg.a), Math.abs(vg.b - s));
    };
    const tr = R.tramos(casa);
    const visto = new Set();
    for (const t of tr) {
      const a = [t.pts[1][0], t.pts[1][1]], b = [t.pts[2][0], t.pts[2][1]];
      const lista = t.nivel === 'losa' ? vigas : cims;
      for (const vg of lista) {
        const hit = C.segRect(a, b, vg.rect);
        if (!hit) continue;
        const tm = (hit[0] + hit[1]) / 2, pt = [a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm];
        /* un extremo dentro de la viga es una bajante o subida: se revisa aparte */
        if (hit[0] < 1e-6 || hit[1] > 1 - 1e-6) continue;
        const dc = distCol(vg, pt);
        if (t.nivel === 'losa') {
          out.push({ tipo: 'cruce', c: t.c, tramo: t.u + '–' + t.v, viga: vg.id, x: pt[0], y: pt[1], dCol: dc, critico: dc < conf,
            texto: `Tubo ${t.tubo} in del ${t.c} cruza la ${vg.id} dentro de la losa` + (dc < conf ? ` a ${C.fmt(dc, 2)} m de la cara de la columna: zona de confinamiento, reubicar.` : ` a ${C.fmt(dc, 2)} m de la columna: fuera de la zona de confinamiento; coordinar el pase con el ingeniero estructural.`) });
        } else {
          out.push({ tipo: 'cim', c: t.c, tramo: t.u + '–' + t.v, viga: vg.id, x: pt[0], y: pt[1], dCol: dc, critico: false,
            texto: `Tubo del ${t.c} pasa sobre la ${vg.id} dentro del contrapiso: verificar recubrimiento y que no se corte acero.` });
        }
      }
      /* bajantes y subidas en los extremos */
      for (const [id, P] of [[t.u, t.pts[0]], [t.v, t.pts[3]]]) {
        if (t.nivel !== 'losa') continue;
        const key = t.c + '|' + id;
        if (visto.has(key)) continue;
        const pt = [P[0], P[1]];
        for (const vg of vigas) {
          if (C.distRect(pt, vg.rect) > 1e-6) continue;
          visto.add(key);
          const dc = distCol(vg, pt);
          out.push({ tipo: 'bajante', c: t.c, punto: id, viga: vg.id, x: pt[0], y: pt[1], dCol: dc, critico: dc < conf,
            texto: `Bajante del ${t.c} hacia ${id} atraviesa la ${vg.id} (muro bajo viga)` + (dc < conf ? ` a ${C.fmt(dc, 2)} m de la columna: zona de confinamiento.` : ` a ${C.fmt(dc, 2)} m de la columna: dejar camisa antes del vaciado, con aprobación estructural.`) });
        }
        for (const co of cols) if (C.distRect(pt, co.rect) < 1e-6) {
          visto.add(key);
          out.push({ tipo: 'columna', c: t.c, punto: id, col: co.id, x: pt[0], y: pt[1], critico: true, texto: `La bajante de ${id} cae dentro de la columna ${co.id}: no se permite, reubicar el punto.` });
        }
      }
    }
    /* Cajas junto a columnas */
    for (const p of casa.electrico.puntos) {
      if (p.tipo === 'lum') continue;
      for (const co of cols) {
        const d = C.distRect([p.x, p.y], co.rect);
        if (d < 0.45) out.push({ tipo: 'caja', punto: p.id, col: co.id, x: p.x, y: p.y, d, critico: d < 0.1,
          texto: `Caja de ${p.id} a ${C.fmt(d, 2)} m de la cara de la columna ${co.id}` + (d < 0.1 ? ': quedaría en el concreto de la columna, reubicar.' : ': queda en la mampostería; verificar que la regata no toque la columna.') });
      }
    }
    return out;
  };

  /* Tubos embebidos en la losa: diámetro exterior ≤ e/3 y separación ≥ 3 diámetros (NSR-10, C.6.3) */
  R.tuboEnLosa = function ({ e = 0.12, de = 26.7, sep = 0.1, rec = 0.02, n = 1 }) {
    const okD = de / 1000 <= e / 3 + 1e-9;
    const okS = n < 2 || sep >= 3 * (de / 1000) - 1e-9;
    const okR = rec >= 0.02 - 1e-9 && rec + de / 1000 <= e - 0.02 + 1e-9;
    return { okD, okS, okR, ok: okD && okS && okR, limD: (e / 3) * 1000, limS: 3 * de / 1000 };
  };
})(typeof window !== 'undefined' ? window : globalThis);
