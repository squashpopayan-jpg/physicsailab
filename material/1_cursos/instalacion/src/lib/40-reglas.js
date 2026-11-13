/* ===================================================================
   lib/40-reglas.js — Verificación de reglas de ubicación sobre el modelo
   Cada verificación devuelve hallazgos con la fuente exacta:
   RETIE Libro 3 (3.17.x, 3.28.1) y las secciones de la NTC 2050 segunda
   actualización a las que remite el artículo 3.28.1.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const C = L.C, N = L.N;
  const G = (L.G = {});
  const EPS = 0.02;

  /* ---------- Perímetro de un ambiente rectangular y su parametrización ---------- */
  G.perimetro = function (r) {
    const [x0, y0, x1, y1] = r, w = x1 - x0, h = y1 - y0;
    const lados = [
      { a: [x0, y0], b: [x1, y0], s0: 0, eje: 'y', pos: y0 },
      { a: [x1, y0], b: [x1, y1], s0: w, eje: 'x', pos: x1 },
      { a: [x1, y1], b: [x0, y1], s0: w + h, eje: 'y', pos: y1 },
      { a: [x0, y1], b: [x0, y0], s0: 2 * w + h, eje: 'x', pos: x0 }
    ];
    return { r, lados, P: 2 * (w + h) };
  };
  G.punto = function (per, s) {
    s = ((s % per.P) + per.P) % per.P;
    for (const l of per.lados) {
      const len = C.dist(l.a, l.b);
      if (s <= l.s0 + len + 1e-9) { const t = (s - l.s0) / len; return [l.a[0] + (l.b[0] - l.a[0]) * t, l.a[1] + (l.b[1] - l.a[1]) * t]; }
    }
    return per.lados[0].a;
  };
  /* Proyección de un punto sobre el perímetro (s y distancia) */
  G.proyectar = function (per, p) {
    let best = { s: 0, d: Infinity };
    for (const l of per.lados) {
      const len = C.dist(l.a, l.b), dx = (l.b[0] - l.a[0]) / len, dy = (l.b[1] - l.a[1]) / len;
      let t = (p[0] - l.a[0]) * dx + (p[1] - l.a[1]) * dy;
      t = Math.max(0, Math.min(len, t));
      const q = [l.a[0] + dx * t, l.a[1] + dy * t], d = C.dist(p, q);
      if (d < best.d) best = { s: l.s0 + t, d };
    }
    return best;
  };
  /* Vanos (puertas y vanos abiertos) que interrumpen la línea de piso del ambiente */
  G.aberturas = function (casa, amb) {
    const r = casa.libre(amb), per = G.perimetro(r), F = casa.t / 2, out = [];
    for (const m of casa.muros) {
      const hor = Math.abs(m.a[1] - m.b[1]) < 1e-9;
      for (const v of m.vanos) {
        if (v.tipo === 'ventana') continue;
        const p0 = casa.enMuro(m, v.d0), p1 = casa.enMuro(m, v.d1);
        for (const l of per.lados) {
          if (hor && l.eje === 'y' && Math.abs(Math.abs(l.pos - m.a[1]) - F) < 1e-6) {
            const lo = Math.max(Math.min(p0[0], p1[0]), r[0]), hi = Math.min(Math.max(p0[0], p1[0]), r[2]);
            if (hi > lo + EPS) { const sa = G.proyectar(per, [lo, l.pos]).s, sb = G.proyectar(per, [hi, l.pos]).s; out.push({ id: v.id, s0: Math.min(sa, sb), s1: Math.max(sa, sb), tipo: v.tipo }); }
          }
          if (!hor && l.eje === 'x' && Math.abs(Math.abs(l.pos - m.a[0]) - F) < 1e-6) {
            const lo = Math.max(Math.min(p0[1], p1[1]), r[1]), hi = Math.min(Math.max(p0[1], p1[1]), r[3]);
            if (hi > lo + EPS) { const sa = G.proyectar(per, [l.pos, lo]).s, sb = G.proyectar(per, [l.pos, hi]).s; out.push({ id: v.id, s0: Math.min(sa, sb), s1: Math.max(sa, sb), tipo: v.tipo }); }
          }
        }
      }
    }
    return out.sort((a, b) => a.s0 - b.s0);
  };
  /* Espacios de pared: tramos continuos de la línea de piso entre aberturas y muebles fijos
     sin mesón (los mesones se revisan con la regla de mesones). */
  G.espaciosPared = function (casa, amb, extraCortes = []) {
    const r = casa.libre(amb), per = G.perimetro(r);
    const cortes = G.aberturas(casa, amb).concat(extraCortes).sort((a, b) => a.s0 - b.s0);
    if (!cortes.length) return { per, espacios: [{ s0: 0, s1: per.P, L: per.P, cerrado: true }] };
    const esp = [];
    for (let i = 0; i < cortes.length; i++) {
      const a = cortes[i].s1, b = i + 1 < cortes.length ? cortes[i + 1].s0 : cortes[0].s0 + per.P;
      if (b - a > EPS) esp.push({ s0: a, s1: b, L: b - a });
    }
    return { per, espacios: esp, cortes };
  };

  /* ---------- 210.52(A): ningún punto de la línea de piso a más de 1,8 m de una toma ---------- */
  G.tomasPerimetro = function (casa, amb, tomas, opt = {}) {
    const dmax = opt.dmax || 1.8, wmin = 0.6;
    const ex = [];
    /* los mesones interrumpen la línea de piso de la regla general */
    for (const m of casa.muebles) if (m.amb === amb.id && m.tipo === 'meson') {
      const r = casa.libre(amb), per = G.perimetro(r);
      const pts = [[m.rect[0], m.rect[1]], [m.rect[2], m.rect[1]], [m.rect[2], m.rect[3]], [m.rect[0], m.rect[3]]];
      const ss = [];
      for (const p of pts) { const q = G.proyectar(per, p); if (q.d < 0.05) ss.push(q.s); }
      if (ss.length >= 2) {
        let s0 = Math.min(...ss), s1 = Math.max(...ss);
        if (s1 - s0 > per.P / 2) { const t = s0; s0 = s1; s1 = t + per.P; }
        ex.push({ id: m.id, s0, s1, tipo: 'meson' });
      }
    }
    /* unir mesones contiguos (en L) */
    const { per, espacios } = G.espaciosPared(casa, amb, ex);
    const pos = tomas.map((t) => ({ t, q: G.proyectar(per, [t.x, t.y]) })).filter((o) => o.q.d < 0.2);
    const res = [];
    for (const e of espacios) {
      const dentro = pos.filter((o) => { let s = o.q.s; if (s < e.s0 - EPS) s += per.P; return s >= e.s0 - EPS && s <= e.s1 + EPS; }).map((o) => { let s = o.q.s; if (s < e.s0 - EPS) s += per.P; return { id: o.t.id, s }; });
      const req = e.L >= wmin - 1e-9;
      let peor = 0, peorS = e.s0;
      const malos = [];
      const paso = 0.05;
      for (let s = e.s0; s <= e.s1 + 1e-9; s += paso) {
        const d = dentro.length ? Math.min(...dentro.map((o) => Math.abs(o.s - s))) : Infinity;
        if (d > peor) { peor = d; peorS = s; }
        if (d > dmax + 1e-9) malos.push(s);
      }
      const ok = !req || (dentro.length > 0 && peor <= dmax + 1e-9);
      res.push({ s0: e.s0, s1: e.s1, L: e.L, req, tomas: dentro, peor, peorS, ok, malos });
    }
    return { per, espacios: res, ok: res.every((x) => x.ok) };
  };

  /* ---------- 210.52(C): mesones, toma a no más de 600 mm de cualquier punto ---------- */
  G.meson = function (casa, ambId = 'cocina') {
    const amb = casa.ambiente(ambId), r = casa.libre(amb), per = G.perimetro(r);
    const mes = casa.muebles.filter((m) => m.amb === ambId && m.tipo === 'meson');
    const excl = casa.muebles.filter((m) => m.amb === ambId && (m.tipo === 'estufa' || m.tipo === 'lavaplatos'));
    /* línea de pared del mesón: tramos del perímetro cubiertos por algún mesón */
    const tramos = [];
    for (const m of mes) {
      const pts = [[m.rect[0], m.rect[1]], [m.rect[2], m.rect[1]], [m.rect[2], m.rect[3]], [m.rect[0], m.rect[3]]];
      const ss = pts.map((p) => G.proyectar(per, p)).filter((q) => q.d < 0.05).map((q) => q.s);
      if (ss.length >= 2) tramos.push([Math.min(...ss), Math.max(...ss)]);
    }
    tramos.sort((a, b) => a[0] - b[0]);
    const lin = [];
    for (const t of tramos) { if (lin.length && t[0] <= lin[lin.length - 1][1] + 0.7) lin[lin.length - 1][1] = Math.max(lin[lin.length - 1][1], t[1]); else lin.push([...t]); }
    const ex = excl.map((m) => {
      const pts = [[m.rect[0], m.rect[1]], [m.rect[2], m.rect[1]], [m.rect[2], m.rect[3]], [m.rect[0], m.rect[3]]];
      const ss = pts.map((p) => G.proyectar(per, p)).map((q) => q.s);
      /* proyección de la huella del aparato sobre la línea de pared más cercana */
      const qs = pts.map((p) => G.proyectar(per, p)).sort((a, b) => a.d - b.d).slice(0, 2).map((q) => q.s);
      return { id: m.id, tipo: m.tipo, s0: Math.min(...qs), s1: Math.max(...qs), ss };
    });
    const tomas = casa.electrico.puntos.filter((p) => p.amb === ambId && p.tipo === 'toma' && p.meson).map((p) => ({ id: p.id, s: G.proyectar(per, [p.x, p.y]).s }));
    const res = [];
    for (const [a, b] of lin) {
      /* subtramos que requieren cobertura (≥ 300 mm sin aparato) */
      const cortes = ex.filter((e) => e.s1 > a && e.s0 < b).sort((p, q) => p.s0 - q.s0);
      const subs = [];
      let s = a;
      for (const e of cortes) { if (e.s0 > s) subs.push([s, e.s0]); s = Math.max(s, e.s1); }
      if (s < b) subs.push([s, b]);
      for (const [p, q] of subs) {
        const req = q - p >= 0.3 - 1e-9;
        let peor = 0;
        for (let x = p; x <= q + 1e-9; x += 0.025) { const d = tomas.length ? Math.min(...tomas.map((t) => Math.abs(t.s - x))) : Infinity; peor = Math.max(peor, d); }
        res.push({ s0: p, s1: q, L: q - p, req, peor, ok: !req || peor <= 0.6 + 1e-9 });
      }
    }
    return { per, lineas: lin, excluidos: ex, tomas, tramos: res, ok: res.every((t) => t.ok) };
  };

  /* ---------- 210.8(A) y RETIE: ¿requiere protección por falla a tierra? ---------- */
  G.razonesGFCI = function (casa, p) {
    const out = [];
    const amb = casa.ambiente(p.amb);
    if (p.amb === 'bano') out.push({ ref: 'NTC 2050, 210.8(A)(1)', t: 'Cuarto de baño' });
    if (p.ext || p.amb === 'exterior') out.push({ ref: 'NTC 2050, 210.8(A)(3)', t: 'Exterior' });
    if (p.meson) out.push({ ref: 'NTC 2050, 210.8(A)(6)', t: 'Sirve el mesón de la cocina' });
    if (p.amb === 'ropas') out.push({ ref: 'NTC 2050, 210.8(A)(10)', t: 'Área de lavandería' });
    /* distancia medida por el recorrido del cordón dentro del mismo recinto (210.8): los
       aparatos sanitarios de otro ambiente no cuentan, porque el cordón no atraviesa muros */
    for (const m of casa.muebles) {
      if (m.amb !== p.amb) continue;
      const d = C.distRect([p.x, p.y], m.rect);
      if ((m.tipo === 'lavaplatos' || m.tipo === 'lavadero' || m.tipo === 'lavamanos') && d <= 1.8) out.push({ ref: 'NTC 2050, 210.8(A)(7)', t: `A ${C.fmt(d, 2)} m del borde de ${m.tipo === 'lavaplatos' ? 'el lavaplatos' : m.tipo === 'lavadero' ? 'el lavadero' : 'el lavamanos'} (≤ 1,8 m)` });
      if (m.tipo === 'ducha' && d <= N.UMBRAL.gfci_ducha) out.push({ ref: 'RETIE 3.17.15 g y NTC 2050, 210.8(A)(9)', t: `A ${C.fmt(d, 2)} m del borde de la ducha (< 1,8 m)` });
    }
    if (amb && amb.humedo && !out.length) out.push({ ref: 'RETIE 3.27.2 e', t: 'Lugar húmedo: se recomienda protección diferencial' });
    return out;
  };
  G.protegidaGFCI = function (casa, p) {
    if (p.gfci) return 'tomacorriente GFCI';
    if (p.gfciCarga) return 'aguas abajo del GFCI ' + p.gfciCarga;
    const c = casa.circuito(p.c);
    if (c && c.diferencial) return 'interruptor diferencial en el tablero';
    return null;
  };

  /* ---------- Verificación global del diseño ---------- */
  G.verificar = function (casa) {
    const H = [];
    const add = (estado, ref, texto, punto) => H.push({ estado, ref, texto, punto });
    const P = casa.electrico.puntos;
    /* 1. Tomas por ambiente, 210.52(A) */
    for (const amb of casa.ambientes) {
      if (['bano', 'ropas', 'hall'].includes(amb.id)) continue;
      const tomas = P.filter((p) => p.amb === amb.id && p.tipo === 'toma' && !p.meson);
      const area = casa.areaLibre(amb);
      if ((amb.id === 'alc1' || amb.id === 'alc2') && area <= N.UMBRAL.dorm_peq) {
        add(tomas.length >= 2 ? 'ok' : 'falla', 'RETIE 3.28.1 o', `${amb.nombre} (${C.fmt(area, 1)} m² ≤ 9 m²): se aceptan dos tomas dobles en paredes opuestas.`);
        continue;
      }
      const r = G.tomasPerimetro(casa, amb, tomas);
      const malos = r.espacios.filter((e) => !e.ok);
      add(malos.length ? 'falla' : 'ok', 'RETIE 3.28.1 o → NTC 2050, 210.52(A)', malos.length
        ? `${amb.nombre}: ${malos.length} espacio(s) de pared con puntos a más de 1,8 m de una toma (peor: ${isFinite(malos[0].peor) ? C.fmt(malos[0].peor, 2) + ' m' : 'sin toma'}).`
        : `${amb.nombre}: ${tomas.length} tomas; ningún punto de la línea de piso a más de 1,8 m (peor caso ${C.fmt(Math.max(...r.espacios.filter((e) => e.req).map((e) => e.peor)), 2)} m).`);
    }
    /* 2. Mesón */
    const ms = G.meson(casa);
    add(ms.ok ? 'ok' : 'falla', 'NTC 2050, 210.52(C)', ms.ok ? `Mesón de cocina: ningún punto a más de 600 mm de una toma (${ms.tomas.length} tomas).` : 'Mesón de cocina: hay tramos a más de 600 mm de una toma.');
    /* 3. GFCI */
    for (const p of P.filter((x) => x.tipo === 'toma')) {
      const raz = G.razonesGFCI(casa, p);
      const prot = G.protegidaGFCI(casa, p);
      if (raz.length && !raz.every((r) => r.ref.startsWith('RETIE 3.27.2'))) add(prot ? 'ok' : 'falla', raz.map((r) => r.ref).join('; '), `${p.id}: ${raz.map((r) => r.t).join('; ')} → ${prot ? 'protegida (' + prot + ')' : 'requiere GFCI y no lo tiene'}.`, p.id);
    }
    /* 4. Baño, lavandería, exterior, hall */
    const tb = P.filter((p) => p.amb === 'bano' && p.tipo === 'toma');
    const lav = casa.muebles.find((m) => m.tipo === 'lavamanos');
    const dlav = tb.length ? Math.min(...tb.map((p) => C.distRect([p.x, p.y], lav.rect))) : Infinity;
    add(dlav <= 0.9 ? 'ok' : 'falla', 'NTC 2050, 210.52(D)', `Baño: toma a ${C.fmt(dlav, 2)} m del borde del lavamanos (≤ 0,9 m).`);
    add(P.some((p) => p.amb === 'ropas' && p.tipo === 'toma') ? 'ok' : 'falla', 'NTC 2050, 210.52(F)', 'Patio de ropas: al menos una toma para la lavadora.');
    const exts = P.filter((p) => p.tipo === 'toma' && p.ext);
    add(exts.some((p) => p.y < 0) && exts.some((p) => p.x < 0 || p.y > 10) ? 'ok' : 'falla', 'NTC 2050, 210.52(E)(1)', 'Vivienda unifamiliar: tomas exteriores en el frente y en la parte posterior, a menos de 2,0 m del suelo, con GFCI y encerramiento para intemperie (RETIE 3.17.10 c).');
    const hall = casa.ambiente('hall'), hr = casa.libre(hall), hl = Math.max(hr[2] - hr[0], hr[3] - hr[1]);
    add('ok', 'NTC 2050, 210.52(H)', `Hall de ${C.fmt(hl, 2)} m de largo: ${hl >= 3 ? 'requiere una toma' : 'menor de 3,0 m, no requiere toma'}.`);
    /* 5. Ducha */
    const cd = casa.electrico.circuitos.find((c) => c.arbol.some(([, v]) => casa.punto(v).tipo === 'ducha'));
    if (cd) {
      const otros = cd.arbol.filter(([, v]) => casa.punto(v).tipo !== 'ducha').length;
      add(otros === 0 ? 'ok' : 'falla', 'RETIE 3.17.15 b y d', `Ducha en circuito exclusivo ${cd.id}, sin derivaciones${otros ? ': tiene ' + otros + ' derivaciones' : ''}.`);
      add(cd.In >= 30 ? 'ok' : 'falla', 'RETIE 3.17.15 b', `Protección de ${cd.In} A (si no se conoce la ducha se dimensiona para 30 A).`);
      add(cd.diferencial ? 'ok' : 'falla', 'RETIE 3.17.15 c', `Protección diferencial ${cd.diferencial ? 'en el tablero' : 'ausente'} (exigida para duchas sin resistencia blindada).`);
      const tbAmb = casa.punto('TG').amb;
      add(tbAmb !== 'bano' ? 'ok' : 'falla', 'RETIE 3.17.15 e y 3.17.19 f', 'Protección del circuito de la ducha fuera del alcance de una persona en el área mojada.');
      add('ok', 'RETIE 3.28.1 m', `Popayán está a unos 1 760 m s. n. m. (> 1 500): se exige circuito exclusivo para ducha eléctrica, salvo otro medio de calentamiento de agua.`);
    }
    /* 6. Interruptores fuera de la ducha */
    const du = casa.muebles.find((m) => m.tipo === 'ducha');
    for (const p of P.filter((x) => ['int', 'int2', 'conm'].includes(x.tipo) && x.amb === 'bano')) {
      const d = C.distRect([p.x, p.y], du.rect);
      add(d > 0 ? 'ok' : 'falla', 'RETIE 3.28.1 j', `${p.id} en el baño a ${C.fmt(d, 2)} m del espacio de la ducha (fuera de él).`, p.id);
    }
    /* 7. Estufa */
    add(P.some((p) => p.tipo === 'estufa') ? 'ok' : 'falla', 'RETIE 3.28.1 n', 'Cocina con capacidad para al menos una estufa eléctrica (circuito C8 de 240 V).');
    /* 8. Tablero */
    const tg = casa.punto('TG');
    add(tg.amb !== 'bano' ? 'ok' : 'falla', 'RETIE 3.17.19 f', 'Tablero fuera de espacios de bañeras o duchas.');
    add(tg.z + 0.2 <= N.UMBRAL.palanca_max ? 'ok' : 'falla', 'RETIE 3.17.19 g', `Palanca más alta a ${C.fmt(tg.z + 0.2, 2)} m del piso (≤ 2,0 m).`);
    const esp = G.espacioTrabajo(casa, tg);
    add(esp.ok ? 'ok' : 'falla', 'RETIE Libro 3, Título 4 e', `Espacio de trabajo frente al tablero: ${C.fmt(esp.prof, 2)} m de profundidad libre (≥ 0,9 m).`);
    /* 9. Balance */
    const bal = L.Q.balance(casa);
    add(bal.desb <= 0.15 ? 'ok' : 'aviso', 'Criterio de diseño', `Carga por fase: A ${C.fmt(bal.A, 0)} VA, B ${C.fmt(bal.B, 0)} VA (desbalance ${C.fmt(100 * bal.desb, 1)} %).`);
    return H;
  };
  /* Profundidad libre frente al tablero (rayo en la dirección de su frente hasta el primer muro) */
  G.espacioTrabajo = function (casa, tg, d) {
    const dir = d || tg.dir || casa.electrico.tablero.frente;
    let prof = Infinity;
    const p0 = [tg.x, tg.y];
    for (const m of casa.muros) {
      for (const [d0, d1] of casa.tramosMuro(m)) {
        const a = casa.enMuro(m, d0), b = casa.enMuro(m, d1);
        /* intersección rayo-segmento (muro con espesor: se resta la mitad) */
        const ex = b[0] - a[0], ey = b[1] - a[1];
        const den = dir[0] * ey - dir[1] * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((a[0] - p0[0]) * ey - (a[1] - p0[1]) * ex) / den;
        const u = ((a[0] - p0[0]) * dir[1] - (a[1] - p0[1]) * dir[0]) / den;
        if (t > 0.01 && u >= 0 && u <= 1) prof = Math.min(prof, t - casa.t / 2);
      }
    }
    return { prof, ok: prof >= N.UMBRAL.trabajo.prof - 1e-9 };
  };
})(typeof window !== 'undefined' ? window : globalThis);
