/* ===================================================================
   ui/20-plano.js — Etapa 1: plano y puntos
   Lectura del plano y replanteo de tomacorrientes: agregar, mover,
   borrar y cambiar el tipo (común, GFCI, GFCI intemperie) con la
   verificación de 210.52 y 210.8 en vivo.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N, G = L.G;
  const T = L.CASA.t, F = T / 2;

  const CIRC_AMB = { sala: 'C2', hall: 'C2', alc1: 'C3', alc2: 'C3', cocina: 'C4', ropas: 'C6', bano: 'C9', exterior: 'C2' };
  const NOM_T = { lum: 'Luminaria', aplique: 'Aplique exterior', int: 'Interruptor sencillo', int2: 'Interruptor doble', conm: 'Conmutador', toma: 'Tomacorriente doble con polo a tierra', ducha: 'Salida de ducha eléctrica', estufa: 'Salida de estufa eléctrica 240 V' };

  /* Pared más cercana al punto del plano y posición sobre su cara */
  OB.pegarPared = function (casa, q, maxD) {
    let mejor = null;
    for (const m of casa.muros) {
      const len = C.dist(m.a, m.b);
      for (const [d0, d1] of casa.tramosMuro(m)) {
        if (d1 - d0 < 0.5) continue;
        const a = casa.enMuro(m, d0 + 0.2), b = casa.enMuro(m, d1 - 0.2);
        const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
        const t = l2 ? Math.max(0, Math.min(1, ((q.x - a[0]) * dx + (q.y - a[1]) * dy) / l2)) : 0;
        const px = a[0] + dx * t, py = a[1] + dy * t;
        const d = Math.hypot(q.x - px, q.y - py);
        if (!mejor || d < mejor.d) {
          const ll = Math.sqrt(l2) || 1;
          const nx = -dy / ll, ny = dx / ll;
          const lado = (q.x - px) * nx + (q.y - py) * ny >= 0 ? 1 : -1;
          mejor = { d, m, x: px + nx * lado * F, y: py + ny * lado * F, lado, ext: !!m.ext };
        }
      }
    }
    return mejor && mejor.d <= (maxD || 0.9) ? mejor : null;
  };
  function ambienteEn(casa, x, y) {
    for (const a of casa.ambientes) {
      const r = a.poly.map((p) => p[0]), s = a.poly.map((p) => p[1]);
      if (x >= Math.min(...r) - 1e-6 && x <= Math.max(...r) + 1e-6 && y >= Math.min(...s) - 1e-6 && y <= Math.max(...s) + 1e-6) return a.id;
    }
    return null;
  }
  /* Ambiente al que pertenece una toma pegada a una pared, según el lado de la cara */
  OB.ambienteDePared = function (casa, w, q) {
    const ex = w.x + (w.x - (w.x - 0)) * 0; void ex;
    // se prueba un punto 0,3 m dentro del lado del clic
    const dir = [q.x - w.x, q.y - w.y]; const l = Math.hypot(dir[0], dir[1]) || 1;
    const px = w.x + (dir[0] / l) * 0.3, py = w.y + (dir[1] / l) * 0.3;
    return ambienteEn(casa, px, py);
  };

  OB.etapas.plano = function (root) {
    const E = OB.E;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 1', titulo: 'Plano y puntos',
      lead: 'Este es el plano eléctrico de la casa. Lea los símbolos, revise la ubicación de las salidas y replantee los tomacorrientes: ningún punto de una pared puede quedar a más de 1,8 m de una toma, y el baño, la cocina, el lavadero y el exterior exigen protección GFCI.'
    });
    let tool = 'sel', sel = null;
    const capasEstado = { estr: true, muebles: true, ilum: true, ctrl: true, tomas: true, ids: true, canal: false, alcance: false };
    const wrap = OB.h('div');
    trabajo.append(wrap);
    const pl = new OB.Planta(wrap, {
      E, capas: { ids: true },
      aria: 'Planta eléctrica de la vivienda con luminarias, interruptores y tomacorrientes',
      marca: (p) => {
        if (p.id === sel) return 'sel';
        if (p.tipo !== 'toma') return null;
        const raz = G.razonesGFCI(pl.casa, p).filter((r) => !r.ref.startsWith('RETIE 3.27.2'));
        if (!raz.length) return null;
        return G.protegidaGFCI(pl.casa, p) ? 'ok' : 'falla';
      },
      onPick: (id) => {
        if (tool === 'borrar') {
          const p = E.puntos.find((x) => x.id === id);
          if (p && p.tipo === 'toma') { O.quitarPunto(E, id); if (sel === id) sel = null; OB.cambio('plano'); OB.toast('Toma ' + id + ' retirada'); }
          else OB.toast('Solo se pueden retirar tomacorrientes', 'bad');
          return;
        }
        sel = id; pl.sel = id; OB.cambio('sel');
      },
      onBg: (q) => {
        if (tool !== 'agregar') { sel = null; pl.sel = null; OB.cambio('sel'); return; }
        const casa = pl.casa;
        const w = OB.pegarPared(casa, q);
        if (!w) { OB.toast('Haga clic cerca de un muro', 'bad'); return; }
        let amb = OB.ambienteDePared(casa, w, q);
        const exterior = !amb;
        if (exterior) amb = 'exterior';
        if (amb === 'exterior' && !w.m.ext) { OB.toast('Ese lado del muro no da a ningún ambiente', 'bad'); return; }
        let cid = CIRC_AMB[amb] || 'C2';
        if (amb === 'exterior' && (w.y > 5 || w.x < 0)) cid = 'C3';
        const z = amb === 'cocina' && agreg.z >= 1.0 ? 1.1 : (exterior ? 0.45 : agreg.z);
        const p = O.agregarToma(E, { x: w.x, y: w.y, z, amb, c: cid, muro: w.m.id, ap: exterior ? 'gfci-ip' : agreg.ap, meson: amb === 'cocina' && z >= 1.0, ext: exterior });
        sel = p.id; pl.sel = p.id;
        OB.cambio('plano'); OB.toast(`Toma ${p.id} en ${exterior ? 'el exterior' : casa.ambiente(amb).nombre} (${cid})`);
      },
      onMove: (id, q, fin) => {
        const p = E.puntos.find((x) => x.id === id);
        if (!p || p.tipo !== 'toma' || tool !== 'sel') return;
        const w = OB.pegarPared(pl.casa, q, 1.2);
        if (!w) return;
        const amb = OB.ambienteDePared(pl.casa, w, q) || 'exterior';
        if (amb === 'exterior' && !w.m.ext) return;
        p.x = w.x; p.y = w.y; p.muro = w.m.id; p.amb = amb; p.ext = amb === 'exterior';
        if (p.ext) { p.ap = 'gfci-ip'; p.z = 0.45; }
        pl.sel = id; sel = id;
        if (fin) OB.cambio('plano'); else pl.render();
      }
    });
    pl.arrastrables = true;
    pl.extra = (svg, self, casa) => {
      if (capasEstado.alcance) {
        const g = OB.s('g', null, svg);
        casa.electrico.puntos.filter((p) => p.tipo === 'toma' && !p.meson).forEach((p) => OB.s('circle', { cx: p.x, cy: -p.y, r: 1.8, fill: 'var(--l-toma, #2557B8)', opacity: 0.07, 'pointer-events': 'none' }, g));
      }
    };
    const aplicarCapas = () => { Object.assign(pl.capas, { estr: capasEstado.estr, muebles: capasEstado.muebles, ilum: capasEstado.ilum, ctrl: capasEstado.ctrl, tomas: capasEstado.tomas, ids: capasEstado.ids, canal: capasEstado.canal }); };
    aplicarCapas();

    /* Panel: herramientas */
    const agreg = { z: 0.3, ap: 'comun' };
    const herr = OB.h('div');
    const selCard = OB.h('div');
    const pintaHerr = () => {
      OB.vaciar(herr);
      herr.append(OB.chips([['sel', 'Seleccionar y mover'], ['agregar', 'Agregar toma'], ['borrar', 'Borrar toma']], tool, (v) => { tool = v; pintaHerr(); }, 'Herramienta'));
      if (tool === 'agregar') {
        herr.append(OB.campo('Altura de la nueva toma', OB.chips([[0.3, '0,30 m'], [0.6, '0,60'], [1.1, '1,10 (mesón)'], [1.5, '1,50']], agreg.z, (v) => { agreg.z = v; pintaHerr(); }, 'Altura'), 'Toque el muro donde va; el lado del clic define el ambiente.'));
        herr.append(OB.campo('Tipo de aparato', OB.chips([['comun', 'Común'], ['gfci', 'GFCI'], ['gfci-ip', 'GFCI intemperie']], agreg.ap, (v) => { agreg.ap = v; pintaHerr(); }, 'Tipo')));
      }
      herr.append(OB.h('div', { class: 'leyenda', style: { marginTop: '8px' } },
        [['estr', 'Estructura'], ['muebles', 'Mobiliario'], ['ilum', 'Luminarias'], ['ctrl', 'Interruptores'], ['tomas', 'Tomas'], ['ids', 'Rótulos'], ['canal', 'Canalización'], ['alcance', 'Alcance de 1,8 m']].map(([k, t]) =>
          OB.h('label', null, OB.h('input', { type: 'checkbox', checked: capasEstado[k] ? true : null, onchange: (e) => { capasEstado[k] = e.target.checked; aplicarCapas(); pl.render(); } }), t))));
    };
    const pintaSel = () => {
      OB.vaciar(selCard);
      const p = E.puntos.find((x) => x.id === sel);
      if (!p) { selCard.append(OB.h('p', { class: 'nota' }, 'Toque un símbolo del plano para ver sus datos.')); return; }
      const c = E.circuitos.find((x) => x.id === p.c);
      selCard.append(OB.h('div', { class: 'fila sep' }, OB.h('strong', null, p.id + ' · ' + (NOM_T[p.tipo] || p.tipo)), OB.h('span', { class: 'pill' }, p.c)));
      selCard.append(OB.h('p', { class: 'nota' }, `${c ? c.nombre : ''}. Altura ${OB.fmt(p.z, 2)} m` + (p.uso ? ` · ${p.uso}` : '') + (p.W ? ` · ${p.W} W` : '') + '.'));
      if (p.tipo === 'toma') {
        const casa = pl.casa, cp = casa.punto(p.id);
        const raz = G.razonesGFCI(casa, cp), prot = G.protegidaGFCI(casa, cp);
        selCard.append(OB.campo('Tipo de aparato', OB.chips([['comun', 'Común'], ['gfci', 'GFCI'], ['gfci-ip', 'GFCI intemperie']], p.ap, (v) => { p.ap = v; OB.cambio('plano'); }, 'Tipo')));
        selCard.append(OB.campo('Altura', OB.chips([[0.3, '0,30'], [0.45, '0,45'], [0.6, '0,60'], [1.1, '1,10'], [1.5, '1,50']], p.z, (v) => { p.z = v; p.meson = p.amb === 'cocina' && v >= 1.0; OB.cambio('plano'); }, 'Altura')));
        selCard.append(OB.campo('Circuito', OB.sel(E.circuitos.map((x) => [x.id, x.id + ' · ' + x.nombre]), p.c, (v) => {
          if (!v || v === p.c) return;
          const hijos = E.circuitos.find((x) => x.id === p.c).arbol.filter(([u]) => u === p.id).length;
          if (hijos) { OB.toast('Mueva primero las tomas que cuelgan de ' + p.id, 'bad'); return; }
          const old = E.circuitos.find((x) => x.id === p.c); old.arbol = old.arbol.filter(([, b]) => b !== p.id);
          p.c = v; const nuevo = E.circuitos.find((x) => x.id === v);
          let best = 'TG', dm = Infinity; const nodos = new Set(['TG']); nuevo.arbol.forEach(([a, b]) => { nodos.add(a); nodos.add(b); });
          for (const n of nodos) { const q = casa.punto(n); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dm) { dm = d; best = n; } }
          nuevo.arbol.push([best, p.id]); OB.cambio('plano');
        })));
        selCard.append(OB.h('div', { class: raz.length ? (prot ? 'aviso-box ok' : 'aviso-box bad') : 'nota' },
          raz.length ? OB.h('div', null, OB.h('strong', null, prot ? 'Protegida: ' + prot + '. ' : 'Requiere protección por falla a tierra. '), raz.map((r) => r.t + ' (' + r.ref + ')').join('; ') + '.') : 'No exige protección GFCI por su ubicación.'));
        selCard.append(OB.h('button', { class: 'btn peq peligro', type: 'button', onclick: () => { O.quitarPunto(E, p.id); sel = null; pl.sel = null; OB.cambio('plano'); } }, 'Retirar esta toma'));
      }
    };
    const pintaRetos = () => OB.card('Retos de replanteo',
      OB.h('p', { class: 'nota' }, 'Parta de un plano dañado y déjelo conforme a la norma.'),
      OB.h('div', { class: 'fila' },
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { ['TS1', 'TS2', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7'].forEach((id) => O.quitarPunto(E, id)); sel = null; pl.sel = null; tool = 'agregar'; pintaHerr(); OB.cambio('plano'); OB.toast('Reto: la sala-comedor quedó sin tomas'); } }, 'Reto 1 · sala sin tomas'),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { E.puntos.filter((p) => p.tipo === 'toma').forEach((p) => { p.ap = 'comun'; }); OB.cambio('plano'); OB.toast('Reto: ninguna toma tiene GFCI'); } }, 'Reto 2 · sin GFCI'),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { const b = O.nuevo({}); E.puntos = b.puntos; E.circuitos.forEach((c, i) => { c.arbol = b.circuitos[i].arbol; }); sel = null; pl.sel = null; OB.cambio('plano'); OB.toast('Plano original restaurado'); } }, 'Restaurar plano')));
    const leyenda = () => {
      const fila = (nombre, dib) => OB.h('div', { class: 'fila', style: { gap: '10px', flexWrap: 'nowrap' } }, dib, OB.h('span', { class: 'nota' }, nombre));
      const sv = (fn) => { const s = OB.s('svg', { viewBox: '-0.4 -0.4 0.8 0.8', width: 28, height: 28, style: 'flex:none' }); fn(s); return s; };
      const st = { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 0.05 };
      return OB.card('Leyenda de símbolos (Libro 1, Tabla 1.3.4.a)',
        OB.h('div', { class: 'kpis', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' } },
          fila('Luminaria de techo', sv((s) => { OB.s('circle', { r: 0.25, ...st }, s); OB.s('path', { d: 'M-.18 -.18L.18 .18M.18 -.18L-.18 .18', ...st }, s); })),
          fila('Aplique exterior', sv((s) => { OB.s('circle', { r: 0.22, ...st }, s); OB.s('path', { d: 'M-.22 0H.22', ...st }, s); })),
          fila('Interruptor S, S2 doble, S3 conmutador', sv((s) => { OB.s('circle', { r: 0.14, ...st, fill: 'var(--ink)' }, s); OB.s('path', { d: 'M.1 -.1L.35 -.35', ...st }, s); })),
          fila('Tomacorriente doble con polo a tierra', sv((s) => { OB.s('circle', { r: 0.22, ...st }, s); OB.s('path', { d: 'M-.08 -.08v.16M.08 -.08v.16', ...st }, s); })),
          fila('GFCI (círculo naranja y rótulo)', sv((s) => { OB.s('circle', { r: 0.22, ...st, stroke: 'var(--accent)' }, s); OB.s('path', { d: 'M-.08 -.08v.16M.08 -.08v.16', ...st, stroke: 'var(--accent)' }, s); })),
          fila('Ducha D y estufa E', sv((s) => { OB.s('rect', { x: -0.22, y: -0.22, width: 0.44, height: 0.44, ...st }, s); })),
          fila('Tablero general TG', sv((s) => { OB.s('rect', { x: -0.1, y: -0.3, width: 0.2, height: 0.6, fill: 'var(--ink)' }, s); }))));
    };
    panel.append(
      OB.card('Herramientas', herr),
      OB.card('Punto seleccionado', selCard),
      OB.revision('plano'),
      pintaRetos(), leyenda());
    pintaHerr();
    const refrescar = (q) => { if (q === 'tema') return; pl.sel = sel; aplicarCapas(); pl.render(); pintaSel(); };
    OB.subs.push(refrescar);
    pl.render(); pintaSel();
  };
})();
