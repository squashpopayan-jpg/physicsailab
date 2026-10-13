/* ===================================================================
   87-dxf.js — Dibujo de la casa ejemplo por capas, en formato neutro
   (metros), con tres salidas: DXF R12 (milímetros, legible en LibreCAD,
   AutoCAD, Revit y QElectroTech), lienzo (vista previa y PNG a escala) y
   ZIP (kit del proyecto). Los símbolos salen de 50-simbolos.js como bloques.
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;

  /* ---------- Capas: nombre, color ACI, tipo de línea, descripción, visible ---------- */
  const CAPAS = [
    ['A-EJES', 8, 'CENTER', 'Ejes estructurales y burbujas', true],
    ['A-MUROS', 252, 'CONTINUOUS', 'Muros de mampostería de 0,15 m (relleno)', true],
    ['A-VANOS', 7, 'CONTINUOUS', 'Puertas y ventanas', true],
    ['A-MOBILIARIO', 9, 'CONTINUOUS', 'Mobiliario y aparatos sanitarios', true],
    ['A-NOMBRES', 7, 'CONTINUOUS', 'Nombres y áreas libres de los ambientes', true],
    ['A-COTAS', 7, 'CONTINUOUS', 'Cotas entre ejes y totales', true],
    ['S-COLUMNAS', 251, 'CONTINUOUS', 'Columnas de 0,30 × 0,30 m', true],
    ['S-VIGAS', 5, 'HIDDEN', 'Vigas aéreas de 0,30 × 0,35 m (proyección)', true],
    ['S-CIMENTACION', 6, 'DASHED', 'Vigas de cimentación de 0,30 × 0,30 m', false],
    ['E-ILUMINACION', 30, 'CONTINUOUS', 'Salidas de alumbrado e interruptores (E01)', true],
    ['E-TOMAS', 150, 'CONTINUOUS', 'Tomacorrientes (E02)', true],
    ['E-ESPECIALES', 210, 'CONTINUOUS', 'Salidas especiales: ducha y estufa (E02)', true],
    ['E-TABLERO', 1, 'CONTINUOUS', 'Tablero general y medidor', true],
    ['E-CANAL-LOSA', 240, 'CONTINUOUS', 'Tubería embebida en la losa (E03)', true],
    ['E-CANAL-PISO', 240, 'DASHED', 'Tubería por el contrapiso y alimentador (E03)', true],
    ['E-ACOMETIDA', 7, 'CENTER', 'Acometida desde la red', true],
    ['E-TIERRA', 90, 'CONTINUOUS', 'Puesta a tierra (E04)', true],
    ['E-ETIQUETAS', 8, 'CONTINUOUS', 'Códigos de puntos y de circuitos', true],
    ['X-MARCO', 7, 'CONTINUOUS', 'Marco A3 a 1:50 y rótulo', true],
    ['X-LEYENDA', 7, 'CONTINUOUS', 'Cuadro de convenciones', true]
  ];
  /* Patrones en metros del modelo, pensados para 1:50 (12-3-3-3 mm, 6-3 mm, 3-1,5 mm en papel) */
  const TIPOS = { CONTINUOUS: [], CENTER: [0.6, -0.15, 0.15, -0.15], DASHED: [0.3, -0.15], HIDDEN: [0.15, -0.075] };
  /* Colores ACI usados (el 7 es negro sobre fondo claro y blanco sobre oscuro) */
  const ACI = { 1: '#FF0000', 5: '#0000FF', 6: '#FF00FF', 7: null, 8: '#808080', 9: '#A8A8A8', 30: '#FF7F00', 90: '#00A000', 150: '#007FFF', 210: '#FF00FF', 240: '#FF003F', 250: '#333333', 251: '#505050', 252: '#696969' };

  /* En fondo oscuro, los azules y grises del ACI se aclaran para que se lean */
  const ACI_OSC = { 5: '#6F8BFF', 150: '#4DB0FF', 8: '#9A9A9A', 250: '#B0B0B0', 251: '#9C9C9C', 252: '#7E7E7E' };

  /* ---------- Lápiz que convierte un símbolo (caja −1..1) en entidades ---------- */
  function penDXF(out, s) {
    const P = (x, y) => [x * s, y * s];
    return {
      line(pts) { out.push({ t: 'pl', l: '0', p: pts.map((q) => P(q[0], q[1])) }); },
      poly(pts, fill) {
        const q = pts.map((r) => P(r[0], r[1]));
        if (fill) for (let i = 1; i < q.length - 1; i++) out.push({ t: 'solid', l: '0', p: [q[0], q[i], q[i + 1]] });
        out.push({ t: 'pl', l: '0', p: q, cerrada: true });
      },
      circle(x, y, r, fill) {
        if (fill) out.push({ t: 'disco', l: '0', c: P(x, y), r: r * s });
        else out.push({ t: 'circle', l: '0', c: P(x, y), r: r * s });
      },
      arc(x, y, r, a0, a1) { const lo = Math.min(a0, a1), hi = Math.max(a0, a1); out.push({ t: 'arc', l: '0', c: P(x, y), r: r * s, a0: (lo * 180) / Math.PI, a1: (hi * 180) / Math.PI }); },
      rect(x0, y0, x1, y1, fill) {
        const q = [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
        if (fill) out.push({ t: 'solid', l: '0', p: q });
        out.push({ t: 'pl', l: '0', p: q, cerrada: true });
      },
      hatch(x0, y0, x1, y1, n = 6) {
        const w = x1 - x0, h = y1 - y0, st = (w + h) / n;
        for (let k = -h; k < w + h; k += st) {
          /* recta x = x0 + k + t, y = y0 + t, recortada al rectángulo */
          const t0 = Math.max(0, -k), t1 = Math.min(h, w - k);
          if (t1 > t0) out.push({ t: 'pl', l: '0', p: [P(x0 + k + t0, y0 + t0), P(x0 + k + t1, y0 + t1)] });
        }
      },
      text(t, x, y, sz = 0.5, align = 'center') { out.push({ t: 'text', l: '0', p: P(x, y), h: sz * s * 0.72, s: t, al: align === 'center' ? 'c' : align === 'left' ? 'l' : 'r' }); },
      begin() {}, end() {}
    };
  }

  /* ---------- Dibujo de la casa ---------- */
  RT.dibujoCasa = function (casa) {
    const K = casa, C = RT.L.C, R = RT.L.R, F = K.t / 2, E = K.electrico;
    const D = { capas: CAPAS.map(([n, c, lt, d, on]) => ({ n, c, lt, d, on })), tipos: TIPOS, bloques: {}, ents: [] };
    const add = (o) => D.ents.push(o);
    const ln = (l, a, b) => add({ t: 'pl', l, p: [a, b] });
    const rect = (l, r, cerr = true) => add({ t: 'pl', l, p: [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], cerrada: cerr });
    const txt = (l, p, h, s, al = 'c', rot = 0) => add({ t: 'text', l, p, h, s, al, rot });
    const bloque = (nom, simb, s) => {
      if (D.bloques[nom]) return;
      const out = [];
      RT.SIMB[simb].f(penDXF(out, s));
      D.bloques[nom] = out;
    };
    const ins = (l, b, p, rot = 0) => add({ t: 'insert', l, b, p, rot });

    /* ejes */
    K.ejes.x.forEach((x, i) => { ln('A-EJES', [x, -1.1], [x, 11.0]); add({ t: 'circle', l: 'A-EJES', c: [x, 11.25], r: 0.25 }); txt('A-EJES', [x, 11.25], 0.2, K.ejes.nx[i]); });
    K.ejes.y.forEach((y, i) => { ln('A-EJES', [-1.1, y], [9.1, y]); add({ t: 'circle', l: 'A-EJES', c: [9.35, y], r: 0.25 }); txt('A-EJES', [9.35, y], 0.2, K.ejes.ny[i]); });

    /* muros y vanos */
    for (const m of K.muros) {
      const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len], n = [-u[1], u[0]], h = F;
      const P = (d, o) => [m.a[0] + u[0] * d + n[0] * o, m.a[1] + u[1] * d + n[1] * o];
      for (const [d0, d1] of K.tramosMuro(m)) {
        const e0 = d0 === 0 ? -h : d0, e1 = Math.abs(d1 - len) < 1e-9 ? len + h : d1;
        add({ t: 'solid', l: 'A-MUROS', p: [P(e0, -h), P(e1, -h), P(e1, h), P(e0, h)] });
      }
      for (const v of m.vanos) {
        if (v.tipo === 'ventana') {
          for (const o of [-h, -h / 3, h / 3, h]) ln('A-VANOS', P(v.d0, o), P(v.d1, o));
          ln('A-VANOS', P(v.d0, -h), P(v.d0, h)); ln('A-VANOS', P(v.d1, -h), P(v.d1, h));
        } else if (v.tipo === 'puerta') {
          const w = v.d1 - v.d0, hinge = v.bisagra ? v.d1 : v.d0, sgn = v.lado, dirU = v.bisagra ? -1 : 1;
          const hp = P(hinge, sgn * h);
          ln('A-VANOS', hp, [hp[0] + n[0] * sgn * w, hp[1] + n[1] * sgn * w]);
          const b0 = Math.atan2(n[1] * sgn, n[0] * sgn), b1 = Math.atan2(u[1] * dirU, u[0] * dirU);
          let d = b1 - b0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          const lo = d > 0 ? b0 : b0 + d, hi = d > 0 ? b0 + d : b0;
          add({ t: 'arc', l: 'A-VANOS', c: hp, r: w, a0: (lo * 180) / Math.PI, a1: (hi * 180) / Math.PI });
        }
      }
    }

    /* mobiliario */
    const LAB = { estufa: 'estufa', lavaplatos: 'lavaplatos', nevera: 'nevera', lavadero: 'lavadero', lavadora: 'lavadora', ducha: 'ducha', lavamanos: 'lavamanos', sanitario: 'sanitario', cama: 'cama', sofa: 'sofá', mesa: 'comedor' };
    for (const m of K.muebles) {
      const r = m.rect, cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
      rect('A-MOBILIARIO', r);
      if (['lavaplatos', 'lavamanos', 'lavadero'].includes(m.tipo)) add({ t: 'circle', l: 'A-MOBILIARIO', c: [cx, cy], r: Math.min(r[2] - r[0], r[3] - r[1]) / 2.6 });
      if (m.tipo === 'estufa') for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add({ t: 'circle', l: 'A-MOBILIARIO', c: [cx + dx * 0.14, cy + dy * 0.13], r: 0.09 });
      if (m.tipo === 'ducha') { ln('A-MOBILIARIO', [r[0], r[1]], [r[2], r[3]]); ln('A-MOBILIARIO', [r[0], r[3]], [r[2], r[1]]); }
      if (LAB[m.tipo] && m.tipo !== 'estufa') txt('A-MOBILIARIO', [cx, cy], 0.08, LAB[m.tipo]);
    }

    /* nombres de ambientes */
    for (const a of K.ambientes) {
      const r = K.libre(a);
      let cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
      if (a.id === 'sala') { cx -= 0.6; cy += 0.4; }
      if (a.id === 'bano') cy += 0.25;
      if (a.id === 'hall') cy -= 0.55;
      if (a.id === 'ropas') cy += 0.45;
      const estrecho = r[2] - r[0] < 1.4, rot = estrecho ? 90 : 0;
      const off = estrecho ? [0.17, 0] : [0, -0.17];
      txt('A-NOMBRES', [cx, cy], 0.14, a.nombre.toUpperCase(), 'c', rot);
      txt('A-NOMBRES', [cx + off[0], cy + off[1]], 0.1, C.fmt(K.areaLibre(a), 2) + ' m²', 'c', rot);
    }

    /* cotas */
    const tick = (p) => ln('A-COTAS', [p[0] - 0.06, p[1] - 0.06], [p[0] + 0.06, p[1] + 0.06]);
    const hcota = (xs, y) => {
      ln('A-COTAS', [xs[0] - 0.1, y], [xs[xs.length - 1] + 0.1, y]);
      xs.forEach((x) => { tick([x, y]); ln('A-COTAS', [x, y - 0.1], [x, y + 0.1]); });
      for (let i = 0; i < xs.length - 1; i++) txt('A-COTAS', [(xs[i] + xs[i + 1]) / 2, y + 0.1], 0.125, C.fmt(xs[i + 1] - xs[i], 2), 'cb');
    };
    const vcota = (ys, x) => {
      ln('A-COTAS', [x, ys[0] - 0.1], [x, ys[ys.length - 1] + 0.1]);
      ys.forEach((y) => { tick([x, y]); ln('A-COTAS', [x - 0.1, y], [x + 0.1, y]); });
      for (let i = 0; i < ys.length - 1; i++) txt('A-COTAS', [x - 0.1, (ys[i] + ys[i + 1]) / 2], 0.125, C.fmt(ys[i + 1] - ys[i], 2), 'cb', 90);
    };
    hcota(K.ejes.x, -0.75); hcota([-F, 8 + F], -1.25);
    vcota(K.ejes.y, -0.75); vcota([-F, 10 + F], -1.25);

    /* estructura */
    for (const c of K.columnas()) { const r = c.rect; add({ t: 'solid', l: 'S-COLUMNAS', p: [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]] }); rect('S-COLUMNAS', r); }
    for (const v of K.vigas(false)) rect('S-VIGAS', v.rect);
    for (const v of K.vigas(true)) rect('S-CIMENTACION', v.rect);

    /* puntos eléctricos */
    const ss = 0.13;
    const NOMB = { lum: 'P-LUM', aplique: 'P-APLIQUE', int: 'P-INT', int2: 'P-INT2', conm: 'P-CONM', toma: 'P-TOMA', ducha: 'P-DUCHA', estufa: 'P-ESTUFA' };
    for (const p of E.puntos) {
      const simb = RT.simboloDe(p), nom = NOMB[p.tipo];
      if (!nom) continue;
      bloque(nom, simb, ss);
      let rot = 0;
      if (p.tipo === 'toma') {
        const m = K.muros.find((mm) => mm.id === p.muro);
        if (m) { const hor = Math.abs(m.a[1] - m.b[1]) < 1e-9; rot = (hor ? (p.y > m.a[1] ? 0 : Math.PI) : (p.x > m.a[0] ? Math.PI / 2 : -Math.PI / 2)) + Math.PI; }
      }
      const capa = ['lum', 'aplique', 'int', 'int2', 'conm'].includes(p.tipo) ? 'E-ILUMINACION' : p.tipo === 'toma' ? 'E-TOMAS' : 'E-ESPECIALES';
      ins(capa, nom, [p.x, p.y], (-rot * 180) / Math.PI);
      if (p.gfci) txt('E-TOMAS', [p.x, p.y + ss * 1.45], 0.08, 'GFCI');
      txt('E-ETIQUETAS', [p.x + ss * 1.2, p.y - ss * 1.25], 0.09, p.id, 'l');
    }
    /* tablero y medidor */
    const tg = K.punto('TG'), med = E.medidor, t = E.tierra;
    bloque('P-TABLERO', 'tablero-general', 0.16);
    ins('E-TABLERO', 'P-TABLERO', [tg.x - 0.05, tg.y], -90);
    txt('E-TABLERO', [tg.x - 0.18, tg.y], 0.14, 'TG', 'r');
    bloque('P-MEDIDOR', 'p-medidor', 0.14);
    ins('E-TABLERO', 'P-MEDIDOR', [med.x, med.y - 0.2]);
    txt('E-ETIQUETAS', [med.x, med.y - 0.47], 0.1, 'Medidor');

    /* canalizaciones */
    for (const tr of R.tramos(K)) {
      const a = K.punto(tr.u), b = K.punto(tr.v);
      const losa = tr.nivel === 'losa';
      add({ t: 'pl', l: losa ? 'E-CANAL-LOSA' : 'E-CANAL-PISO', p: [[a.x, a.y], [b.x, b.y]], bulge: losa ? -0.12 : 0 });
      if (tr.u === 'TG') {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1;
        const k = losa ? 0.06 * L0 : 0;
        txt(losa ? 'E-CANAL-LOSA' : 'E-CANAL-PISO', [mx - (dy / L0) * (k + 0.12), my + (dx / L0) * (k + 0.12)], 0.1, tr.c, 'c');
      }
    }
    /* acometida, alimentador y puesta a tierra */
    add({ t: 'pl', l: 'E-ACOMETIDA', p: [[E.acometida.desde[0], Math.max(-2.1, E.acometida.desde[1])], [med.x, med.y - 0.15]] });
    txt('E-ACOMETIDA', [E.acometida.desde[0] + 0.12, -2.05], 0.1, 'Acometida desde la red (poste)', 'l');
    add({ t: 'pl', l: 'E-CANAL-PISO', p: [[med.x, med.y], [tg.x, tg.y]] });
    txt('E-CANAL-PISO', [(med.x + tg.x) / 2 + 0.15, (med.y + tg.y) / 2 - 0.15], 0.09, 'Alimentador 3 × 6 AWG Cu, PVC 1 in', 'l');
    add({ t: 'pl', l: 'E-TIERRA', p: [t.varillas[1], t.varillas[0], [tg.x - 0.12, tg.y - 0.12]] });
    bloque('P-TIERRA', 'p-tierra', 0.14);
    t.varillas.forEach((v) => ins('E-TIERRA', 'P-TIERRA', v));
    txt('E-TIERRA', [2.1, -1.35], 0.1, 'SPT: 2 varillas Cu 5/8 in × 2,4 m');

    /* lámina A3 vertical a 1:50: 297 × 420 mm → 14,85 × 21,0 m en el modelo */
    const X0 = -3.8, Y0 = -7.3, W = 14.85, H = 21.0;
    rect('X-MARCO', [X0, Y0, X0 + W, Y0 + H]);
    const ix0 = X0 + 1.25, iy0 = Y0 + 0.5, ix1 = X0 + W - 0.5, iy1 = Y0 + H - 0.5;
    rect('X-MARCO', [ix0, iy0, ix1, iy1]);
    txt('X-MARCO', [4.0, -2.75], 0.2, 'PLANTA GENERAL · ARQUITECTURA, ESTRUCTURA Y ELECTRICIDAD');
    /* escala gráfica de 5 m */
    for (let i = 0; i < 5; i++) { const x = 1.5 + i; if (i % 2 === 0) add({ t: 'solid', l: 'X-MARCO', p: [[x, -3.25], [x + 1, -3.25], [x + 1, -3.15], [x, -3.15]] }); }
    rect('X-MARCO', [1.5, -3.25, 6.5, -3.15]);
    for (let i = 0; i <= 5; i++) txt('X-MARCO', [1.5 + i, -3.42], 0.1, String(i) + (i === 5 ? ' m' : ''));
    txt('X-MARCO', [4.0, -3.68], 0.11, 'Escala 1:50 impresa en A3 · cotas en metros, dibujo en milímetros');
    /* rótulo */
    const rx0 = ix1 - 8.75, ry0 = iy0, rx1 = ix1, ry1 = iy0 + 2.75;
    rect('X-MARCO', [rx0, ry0, rx1, ry1]);
    const filasR = [2.2, 1.7, 1.2, 0.7];
    filasR.forEach((dy) => ln('X-MARCO', [rx0, ry0 + dy], [rx1, ry0 + dy]));
    ln('X-MARCO', [rx0 + 5.4, ry0 + 0.7], [rx0 + 5.4, ry0 + 2.2]);
    txt('X-MARCO', [rx0 + 0.15, ry0 + 2.47], 0.17, 'CABLEADO CON CRITERIO · proyecto RETIE de una vivienda', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 1.95], 0.13, 'Caso: casa ejemplo, Popayán', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 1.45], 0.13, 'Láminas A01 a E03 en capas', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 0.95], 0.13, 'Integrantes: __________________', 'l');
    txt('X-MARCO', [rx0 + 5.55, ry0 + 1.95], 0.13, 'Escala 1:50 · A3', 'l');
    txt('X-MARCO', [rx0 + 5.55, ry0 + 1.45], 0.13, 'Fecha: ______ · v1', 'l');
    txt('X-MARCO', [rx0 + 5.55, ry0 + 0.95], 0.13, 'Curso: _____ · Lámina: ___', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 0.53], 0.1, 'Propuesta académica de coordinación; no apta para construcción.', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 0.33], 0.075, 'RETIE: Res. 40117 de 2024, modificada por las Res. 40304 de 2025 y 40284 de 2026.', 'l');
    txt('X-MARCO', [rx0 + 0.15, ry0 + 0.13], 0.075, 'Plantilla de la guía «Cableado con criterio» · Mg. Manuel Alejandro Obando · Depto. de Física, Universidad del Cauca', 'l');
    /* convenciones */
    const lx0 = ix0, lx1 = rx0 - 0.25;
    rect('X-LEYENDA', [lx0, ry0, lx1, ry1]);
    txt('X-LEYENDA', [lx0 + 0.15, ry1 - 0.25], 0.15, 'CONVENCIONES', 'l');
    const ley = [['P-LUM', 'Luminaria de techo'], ['P-APLIQUE', 'Aplique de pared'], ['P-INT', 'Interruptor sencillo'], ['P-INT2', 'Interruptor doble'], ['P-CONM', 'Conmutable'], ['P-TOMA', 'Toma doble con tierra'], ['P-DUCHA', 'Salida para ducha'], ['P-ESTUFA', 'Salida estufa 240 V'], ['P-TABLERO', 'Tablero general'], ['P-MEDIDOR', 'Medidor'], ['P-TIERRA', 'Electrodo y caja'], ['losa', 'Tubo por la losa'], ['piso', 'Tubo por el piso']];
    const colW = (lx1 - lx0) / 2;
    ley.forEach(([b, t0], i) => {
      const col = i < 7 ? 0 : 1, row = i < 7 ? i : i - 7;
      const x = lx0 + 0.3 + col * colW, y = ry1 - 0.62 - row * 0.3;
      if (b === 'losa') add({ t: 'pl', l: 'X-LEYENDA', p: [[x - 0.2, y], [x + 0.2, y]], bulge: -0.3 });
      else if (b === 'piso') add({ t: 'pl', l: 'X-LEYENDA', p: [[x - 0.2, y], [x + 0.2, y]], lt: 'DASHED' });
      else ins('X-LEYENDA', b, [x, y], b === 'P-TABLERO' ? -90 : 0);
      txt('X-LEYENDA', [x + 0.32, y], 0.085, t0, 'l');
    });
    D.ext = [X0, Y0, X0 + W, Y0 + H];
    D.casaExt = [-2.0, -2.4, 10.0, 11.7];
    return D;
  };

  /* ---------- Escritura DXF R12 (AC1009), en milímetros ---------- */
  const CP1252 = { '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A, '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92, '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97, '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C, '\u017E': 0x9E, '\u0178': 0x9F };
  /* Bytes del DXF en la página de códigos ANSI_1252 declarada en el encabezado */
  RT.dxfBytes = function (D) {
    const t = RT.dxf(D), out = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); out[i] = c < 0x80 || (c >= 0xA0 && c <= 0xFF) ? c : CP1252[t[i]] || 0x3F; }
    return out;
  };
  RT.dxf = function (D) {
    const o = [];
    const g = (c, v) => { o.push(String(c), String(v)); };
    const n = (v) => (Math.round(v * 1e4) / 1e4).toString();
    const mm = (v) => n(v * 1000);
    /* ANSI_1252: lo que cabe en la página de códigos va tal cual; lo demás, como \U+XXXX */
    const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, (ch) => (CP1252[ch] !== undefined || (ch >= '\u00A0' && ch <= '\u00FF') ? ch : '\\U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')));
    const xy = (p, k = 0) => { g(10 + k, mm(p[0])); g(20 + k, mm(p[1])); g(30 + k, '0.0'); };
    /* encabezado */
    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$DWGCODEPAGE'); g(3, 'ANSI_1252');
    g(9, '$INSBASE'); g(10, '0.0'); g(20, '0.0'); g(30, '0.0');
    g(9, '$EXTMIN'); g(10, mm(D.ext[0])); g(20, mm(D.ext[1])); g(30, '0.0');
    g(9, '$EXTMAX'); g(10, mm(D.ext[2])); g(20, mm(D.ext[3])); g(30, '0.0');
    g(9, '$LIMMIN'); g(10, mm(D.ext[0])); g(20, mm(D.ext[1]));
    g(9, '$LIMMAX'); g(10, mm(D.ext[2])); g(20, mm(D.ext[3]));
    g(9, '$LTSCALE'); g(40, '1.0');
    g(9, '$TEXTSIZE'); g(40, '125.0');
    g(9, '$INSUNITS'); g(70, 4);
    g(9, '$MEASUREMENT'); g(70, 1);
    g(0, 'ENDSEC');
    /* tablas */
    g(0, 'SECTION'); g(2, 'TABLES');
    const tipos = Object.keys(D.tipos);
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, tipos.length);
    for (const k of tipos) {
      const pat = D.tipos[k];
      g(0, 'LTYPE'); g(2, k); g(70, 0); g(3, k === 'CONTINUOUS' ? 'Solid line' : k === 'CENTER' ? 'Center ____ _ ____ _' : k === 'DASHED' ? 'Dashed __ __ __' : 'Hidden _ _ _ _'); g(72, 65); g(73, pat.length);
      g(40, mm(pat.reduce((a, b) => a + Math.abs(b), 0)));
      pat.forEach((d) => g(49, mm(d)));
    }
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, D.capas.length + 1);
    g(0, 'LAYER'); g(2, '0'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    for (const c of D.capas) { g(0, 'LAYER'); g(2, c.n); g(70, 0); g(62, c.on ? c.c : -c.c); g(6, c.lt); }
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1);
    g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, '0.0'); g(41, '1.0'); g(50, '0.0'); g(71, 0); g(42, '125.0'); g(3, 'txt'); g(4, '');
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    /* entidades */
    const ent = (e, capa) => {
      const l = capa || e.l;
      if (e.t === 'pl') {
        const pts = e.p, cerr = !!e.cerrada;
        if (pts.length === 2 && !e.bulge && !e.lt) { g(0, 'LINE'); g(8, l); xy(pts[0]); xy(pts[1], 1); return; }
        g(0, 'POLYLINE'); g(8, l); if (e.lt) g(6, e.lt); g(66, 1); g(10, '0.0'); g(20, '0.0'); g(30, '0.0'); g(70, cerr ? 1 : 0);
        pts.forEach((p, i) => { g(0, 'VERTEX'); g(8, l); xy(p); if (e.bulge && i < pts.length - 1) g(42, n(e.bulge)); });
        g(0, 'SEQEND'); g(8, l);
      } else if (e.t === 'solid') {
        const q = e.p.length === 3 ? [e.p[0], e.p[1], e.p[2], e.p[2]] : [e.p[0], e.p[1], e.p[3], e.p[2]];
        g(0, 'SOLID'); g(8, l); q.forEach((p, i) => xy(p, i));
      } else if (e.t === 'circle') {
        g(0, 'CIRCLE'); g(8, l); xy(e.c); g(40, mm(e.r));
      } else if (e.t === 'disco') {
        /* círculo relleno: polilínea de dos arcos con ancho igual al radio */
        g(0, 'POLYLINE'); g(8, l); g(66, 1); g(10, '0.0'); g(20, '0.0'); g(30, '0.0'); g(70, 1); g(40, mm(e.r)); g(41, mm(e.r));
        g(0, 'VERTEX'); g(8, l); xy([e.c[0] - e.r / 2, e.c[1]]); g(42, '1.0');
        g(0, 'VERTEX'); g(8, l); xy([e.c[0] + e.r / 2, e.c[1]]); g(42, '1.0');
        g(0, 'SEQEND'); g(8, l);
      } else if (e.t === 'arc') {
        g(0, 'ARC'); g(8, l); xy(e.c); g(40, mm(e.r)); g(50, n(e.a0)); g(51, n(e.a1));
      } else if (e.t === 'text') {
        g(0, 'TEXT'); g(8, l); xy(e.p); g(40, mm(e.h)); g(1, esc(e.s)); if (e.rot) g(50, n(e.rot));
        const al = e.al || 'c';
        const h72 = al[0] === 'l' ? 0 : al[0] === 'r' ? 2 : 1, v73 = al[1] === 'b' ? 1 : 2;
        g(72, h72); g(73, v73); xy(e.p, 1);
      } else if (e.t === 'insert') {
        g(0, 'INSERT'); g(8, l); g(2, e.b); xy(e.p); if (e.rot) g(50, n(e.rot));
      }
    };
    g(0, 'SECTION'); g(2, 'BLOCKS');
    for (const b in D.bloques) {
      g(0, 'BLOCK'); g(8, '0'); g(2, b); g(70, 0); g(10, '0.0'); g(20, '0.0'); g(30, '0.0'); g(3, b);
      D.bloques[b].forEach((e) => ent(e, '0'));
      g(0, 'ENDBLK'); g(8, '0');
    }
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    D.ents.forEach((e) => ent(e));
    g(0, 'ENDSEC');
    g(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  };

  /* ---------- Dibujo en lienzo (vista previa y PNG) ---------- */
  RT.pintarDibujo = function (ctx, D, o) {
    const s = o.s, ox = o.ox, oy = o.oy, on = o.on || new Set(D.capas.filter((c) => c.on).map((c) => c.n));
    const tinta = o.tinta || '#1B1F22';
    const capa = {}; D.capas.forEach((c) => { capa[c.n] = c; });
    const X = (x) => ox + x * s, Y = (y) => oy - y * s;
    const colDe = (l) => { const c = capa[l]; const h = c ? (o.oscuro && ACI_OSC[c.c]) || ACI[c.c] : null; return h || tinta; };
    const pat = (l, lt) => { const t = D.tipos[lt || (capa[l] && capa[l].lt) || 'CONTINUOUS'] || []; return t.map((d) => Math.max(1, Math.abs(d) * s)); };
    const font = o.font || 'Barlow, Arial, sans-serif';
    const dib = (e, l, T) => {
      const P = (p) => { const q = T ? T(p) : p; return [X(q[0]), Y(q[1])]; };
      const c = colDe(l);
      ctx.strokeStyle = c; ctx.fillStyle = c;
      ctx.lineWidth = o.lw || 1;
      if (e.t === 'pl') {
        ctx.setLineDash(pat(l, e.lt));
        ctx.beginPath();
        const pts = e.p.map(P);
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          if (e.bulge) {
            const a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
            /* en pantalla y crece hacia abajo: el abombamiento negativo (izquierda en el modelo) queda a la izquierda en pantalla */
            const k = -e.bulge; ctx.quadraticCurveTo(mx + dy * k, my - dx * k, b[0], b[1]);
          } else ctx.lineTo(pts[i][0], pts[i][1]);
        }
        if (e.cerrada) ctx.closePath();
        ctx.stroke(); ctx.setLineDash([]);
      } else if (e.t === 'solid') {
        ctx.beginPath(); e.p.map(P).forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
      } else if (e.t === 'circle' || e.t === 'disco') {
        const q = P(e.c); ctx.beginPath(); ctx.arc(q[0], q[1], e.r * s * (T ? T.k : 1), 0, 2 * Math.PI); e.t === 'disco' ? ctx.fill() : ctx.stroke();
      } else if (e.t === 'arc') {
        const q = P(e.c), rot = T ? T.rot : 0;
        ctx.setLineDash(pat(l)); ctx.beginPath(); ctx.arc(q[0], q[1], e.r * s, -((e.a1 + rot) * Math.PI) / 180, -((e.a0 + rot) * Math.PI) / 180); ctx.stroke(); ctx.setLineDash([]);
      } else if (e.t === 'text') {
        const q = P(e.p), px = (e.h / 0.72) * s;
        if (px < 2.5) return;
        ctx.save(); ctx.translate(q[0], q[1]); const r = (e.rot || 0) + (T ? T.rot : 0); if (r) ctx.rotate((-r * Math.PI) / 180);
        ctx.font = `600 ${px}px ${font}`; const al = e.al || 'c';
        ctx.textAlign = al[0] === 'l' ? 'left' : al[0] === 'r' ? 'right' : 'center'; ctx.textBaseline = al[1] === 'b' ? 'alphabetic' : 'middle';
        ctx.fillText(e.s, 0, 0); ctx.restore();
      } else if (e.t === 'insert') {
        const r = ((e.rot || 0) * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
        const T2 = (p) => [e.p[0] + p[0] * cs - p[1] * sn, e.p[1] + p[0] * sn + p[1] * cs];
        T2.rot = e.rot || 0; T2.k = 1;
        (D.bloques[e.b] || []).forEach((be) => dib(be, l, T2));
      }
    };
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* rellenos primero, luego trazos */
    for (const e of D.ents) if (on.has(e.l) && e.t === 'solid') dib(e, e.l);
    for (const e of D.ents) if (on.has(e.l) && e.t !== 'solid') {
      if (e.t === 'insert' && o.fondo) { ctx.fillStyle = o.fondo; ctx.beginPath(); ctx.arc(X(e.p[0]), Y(e.p[1]), 0.135 * s, 0, 7); ctx.fill(); }
      dib(e, e.l);
    }
    ctx.restore();
  };

  /* PNG de la planta base (A01) a 80 px por metro, para SketchUp Free */
  RT.PNG_PXM = 80;
  RT.pngPlanta = function (D, capas) {
    const pxm = RT.PNG_PXM, e = D.casaExt;
    const W = Math.round((e[2] - e[0]) * pxm), H = Math.round((e[3] - e[1] + 1.2) * pxm);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    const on = new Set(capas || ['A-EJES', 'A-MUROS', 'A-VANOS', 'A-MOBILIARIO', 'A-NOMBRES', 'A-COTAS', 'S-COLUMNAS', 'S-VIGAS']);
    const ox = -e[0] * pxm, oy = e[3] * pxm;
    RT.pintarDibujo(ctx, D, { s: pxm, ox, oy, on, lw: 1.4, fondo: '#FFFFFF' });
    /* escala gráfica y nota de escala */
    const y = H - 0.8 * pxm, x0 = ox;
    ctx.fillStyle = '#1B1F22'; ctx.strokeStyle = '#1B1F22'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { if (i % 2 === 0) ctx.fillRect(x0 + i * pxm, y - 6, pxm, 6); }
    ctx.strokeRect(x0, y - 6, 5 * pxm, 6);
    ctx.font = '600 15px Arial, sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) ctx.fillText(i + (i === 5 ? ' m' : ''), x0 + i * pxm, y + 18);
    ctx.textAlign = 'left';
    ctx.fillText(`Imagen a ${pxm} px por metro (1 px = ${RT.L.C.fmt(100 / pxm, 2)} cm). En SketchUp, escale midiendo entre los ejes A y C: 8,00 m.`, 16, H - 0.18 * pxm);
    return new Promise((res, rej) => cv.toBlob((b) => (b ? b.arrayBuffer().then((ab) => res(new Uint8Array(ab)), rej) : rej(new Error('No se pudo crear el PNG'))), 'image/png'));
  };

  /* ---------- ZIP sin compresión (método «stored») ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  RT.zip = function (archivos, fecha = new Date()) {
    const enc = new TextEncoder();
    const dt = ((fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1)) & 0xFFFF;
    const dd = (((fecha.getFullYear() - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate()) & 0xFFFF;
    const partes = [], central = [];
    let off = 0;
    for (const f of archivos) {
      const nombre = enc.encode(f.name), datos = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(datos);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, datos.length, true); h.setUint32(22, datos.length, true);
      h.setUint16(26, nombre.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nombre, datos);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, datos.length, true); c.setUint32(24, datos.length, true);
      c.setUint16(28, nombre.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true); c.setUint32(38, 0, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nombre);
      off += 30 + nombre.length + datos.length;
    }
    const tamC = central.reduce((a, b) => a + b.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tamC, true); fin.setUint32(16, off, true);
    const todo = partes.concat(central, [new Uint8Array(fin.buffer)]);
    const out = new Uint8Array(todo.reduce((a, b) => a + b.length, 0));
    let p = 0; for (const b of todo) { out.set(b, p); p += b.length; }
    return out;
  };

  /* ---------- Kit del proyecto ---------- */
  RT.leameKit = function () {
    return [
      'KIT DEL PROYECTO RETIE · casa ejemplo',
      'Guía «Cableado con criterio» · Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca',
      '',
      'Propuesta académica de coordinación; no apta para construcción.',
      'RETIE consultado: Res. 40117 de 2024 modificada por las Res. 40304 de 2025 y 40284 de 2026.',
      '',
      'A01_planos_base/',
      '  casa-ejemplo.dxf ........ DXF R12 en milímetros, origen en el cruce de los ejes A y 1.',
      '                            Capas A- (arquitectura), S- (estructura), E- (eléctrica), X- (lámina).',
      '                            Ábralo en LibreCAD, AutoCAD, Revit (Insertar > Vincular CAD) o QElectroTech.',
      '                            La capa S-CIMENTACION viene apagada.',
      '  casa-ejemplo_planta_' + RT.PNG_PXM + 'px-por-m.png  Planta base para SketchUp Free (importa PNG, no DXF).',
      '                            Escálela con la Cinta métrica: distancia entre los ejes A y C = 8,00 m.',
      'E04_unifilar_cuadro/',
      '  unifilar-casa-ejemplo.svg  Diagrama unifilar generado desde el modelo.',
      '  cuadro-de-cargas-casa-ejemplo.csv  Cuadro de cargas (separador punto y coma).',
      '  cuadro-de-cargas.xlsx .... Plantilla con fórmulas (si viene incluida).',
      'MEM_memoria/',
      '  memoria-borrador.md ...... Borrador de la memoria con los números del modelo.',
      '  matriz-normativa.csv ..... Doce decisiones de ejemplo con fuente y evidencia.',
      '  lista-materiales.csv ..... Cantidades y referencias del Libro 2.',
      '  inventario-puntos-cargas.csv  Puntos y cargas por ambiente.',
      '',
      'Reglas: mismo origen (A-1 en 0,0), unidades declaradas, nombres de capas iguales en todos los',
      'programas y versiones con fecha (E02_tomas_v3_2026-10-20.dxf).'
    ].join('\r\n');
  };
  RT.kitProyecto = async function () {
    const K = RT.L.CASA, D = RT.dibujoCasa(K);
    const f = [
      { name: 'LEAME.txt', data: '﻿' + RT.leameKit() },
      { name: 'A01_planos_base/casa-ejemplo.dxf', data: RT.dxfBytes(D) },
      { name: 'A01_planos_base/casa-ejemplo_planta_' + RT.PNG_PXM + 'px-por-m.png', data: await RT.pngPlanta(D) },
      { name: 'E04_unifilar_cuadro/unifilar-casa-ejemplo.svg', data: RT.unifilarSVG(K, { ink: '#1B1F22', bg: '#FFFFFF' }) }
    ];
    if (RT.CSV && RT.CSV.cuadro) f.push({ name: 'E04_unifilar_cuadro/cuadro-de-cargas-casa-ejemplo.csv', data: RT.CSV.cuadro() });
    if (RT.EMBED && RT.EMBED.xlsx) f.push({ name: 'E04_unifilar_cuadro/' + RT.EMBED.xlsx.name, data: RT.b64aBytes(RT.EMBED.xlsx.b64) });
    if (RT.memoriaMD) f.push({ name: 'MEM_memoria/memoria-borrador.md', data: RT.memoriaMD('') });
    if (RT.CSV && RT.CSV.matriz) f.push({ name: 'MEM_memoria/matriz-normativa.csv', data: RT.CSV.matriz() });
    if (RT.CSV && RT.CSV.materiales) f.push({ name: 'MEM_memoria/lista-materiales.csv', data: RT.CSV.materiales(0.1) });
    if (RT.CSV && RT.CSV.inventario) f.push({ name: 'MEM_memoria/inventario-puntos-cargas.csv', data: RT.CSV.inventario() });
    return RT.zip(f);
  };
})();
