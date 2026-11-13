/* ===================================================================
   ui/21-acometida.js — Etapa 2: demanda y acometida
   Cálculo de la demanda con el método estándar del artículo 220,
   calibre de la acometida, principal, tipo de acometida (aérea o
   subterránea), alturas del 230.24, medidor y tubo del alimentador.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N, Q = L.Q;

  /* Vista lateral: poste, vano, punto de amarre, medidor y casa */
  function dibujaAcometida(host, E) {
    const a = E.acom, lote = N.LOTES[E.lote];
    OB.vaciar(host);
    const W = 560, H = 262, gy = 205, k = 20;
    const svg = OB.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svg-banco', role: 'img', 'aria-label': 'Vista lateral de la acometida: poste de la red, cable, punto de amarre y medidor' });
    const col = (c) => `var(--${c})`;
    OB.s('rect', { x: 0, y: gy, width: W, height: H - gy, fill: 'var(--surface-2)' }, svg);
    OB.s('line', { x1: 0, y1: gy, x2: W, y2: gy, stroke: 'var(--ink-2)', 'stroke-width': 2 }, svg);
    // poste
    const px = 44, py0 = gy - 8 * k;
    OB.s('rect', { x: px - 5, y: py0, width: 10, height: 8 * k, fill: 'var(--rule-2)', stroke: 'var(--ink-3)' }, svg);
    OB.s('rect', { x: px - 24, y: py0 + 6, width: 48, height: 5, fill: 'var(--ink-3)' }, svg);
    OB.s('text', { x: px, y: gy + 20, 'text-anchor': 'middle', 'font-size': 13 }, svg, 'Poste de la red BT');
    // casa
    const hx = 340, hw = 190, hh = 2.62 * k;
    OB.s('rect', { x: hx, y: gy - hh, width: hw, height: hh, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }, svg);
    OB.s('rect', { x: hx - 6, y: gy - hh - 8, width: hw + 12, height: 8, fill: 'var(--ink-3)' }, svg);
    OB.s('text', { x: hx + hw / 2, y: gy - hh / 2, 'text-anchor': 'middle', 'font-size': 14, fill: 'var(--ink-3)' }, svg, 'Vivienda');
    // distancia
    OB.s('line', { x1: px, y1: gy + 34, x2: hx, y2: gy + 34, stroke: 'var(--ink-3)', 'marker-end': 'url(#fl)' }, svg);
    OB.s('text', { x: (px + hx) / 2, y: gy + 54, 'text-anchor': 'middle', 'font-size': 13 }, svg, `Distancia a la red: ${lote.red} m`);
    const yA = gy - a.amarre * k;
    const lowest = a.amarre - N.FLECHA;
    const okAlt = lowest >= N.ACOMETIDA_ALTURAS.fachada;
    // línea de 3,0 m
    const y3 = gy - 3.0 * k;
    OB.s('line', { x1: px + 20, y1: y3, x2: hx, y2: y3, stroke: 'var(--ok)', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }, svg);
    OB.s('text', { x: px + 28, y: y3 - 4, 'font-size': 12, fill: 'var(--ok)' }, svg, 'mínimo 3,0 m (230.24)');
    if (a.tipo === 'aerea') {
      const yp = gy - 6.5 * k;
      OB.s('path', { d: `M${px + 18} ${yp} Q${(px + hx) / 2} ${(yp + yA) / 2 + 14} ${hx} ${yA}`, fill: 'none', stroke: okAlt ? 'var(--ok)' : 'var(--bad)', 'stroke-width': 3 }, svg);
      OB.s('path', { d: `M${hx} ${yA} q-14 ${N.FLECHA * k + 4} -2 ${N.FLECHA * k} `, fill: 'none', stroke: okAlt ? 'var(--ok)' : 'var(--bad)', 'stroke-width': 3 }, svg);
      OB.s('circle', { cx: hx, cy: yA, r: 5, fill: 'var(--accent)' }, svg);
      OB.s('text', { x: W - 8, y: 22, 'text-anchor': 'end', 'font-size': 14, fill: okAlt ? 'var(--ok)' : 'var(--bad)', 'font-weight': 600 }, svg, `amarre a ${OB.fmt(a.amarre, 1)} m · punto más bajo ${OB.fmt(lowest, 2)} m`);
      // bajante hasta el medidor
      OB.s('line', { x1: hx + 4, y1: yA, x2: hx + 4, y2: gy - a.medZ * k, stroke: 'var(--ink-2)', 'stroke-width': 3 }, svg);
    } else {
      OB.s('rect', { x: px, y: gy + 12, width: hx - px, height: 8, fill: 'var(--warn-soft)', stroke: 'var(--warn)' }, svg);
      OB.s('line', { x1: px, y1: gy + 16, x2: hx + 4, y2: gy + 16, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '10 4' }, svg);
      OB.s('line', { x1: hx + 4, y1: gy + 16, x2: hx + 4, y2: gy - a.medZ * k, stroke: 'var(--ink)', 'stroke-width': 3 }, svg);
      OB.s('text', { x: (px + hx) / 2, y: gy + 11, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--warn)' }, svg, 'PVC enterrado a 0,6 m con cinta de aviso');
    }
    // medidor
    const mz = gy - a.medZ * k;
    const dentro = a.medidor && a.medidor !== 'fachada';
    const mx = a.medidor === 'patio' ? hx + hw - 24 : (dentro ? hx + 50 : hx - 22);
    OB.s('rect', { x: mx, y: mz - 20, width: 22, height: 34, rx: 3, fill: 'var(--surface)', stroke: dentro ? 'var(--bad)' : 'var(--ink)', 'stroke-width': 2 }, svg);
    OB.s('circle', { cx: mx + 11, cy: mz - 5, r: 7, fill: 'none', stroke: 'var(--ink-2)' }, svg);
    OB.s('text', { x: mx + 11, y: mz + 26, 'text-anchor': 'middle', 'font-size': 12 }, svg, `medidor ${OB.fmt(a.medZ, 2)} m`);
    // marcador de flecha
    const defs = OB.s('defs', null, svg);
    const mk = OB.s('marker', { id: 'fl', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto' }, defs);
    OB.s('path', { d: 'M0 0L8 4L0 8z', fill: 'var(--ink-3)' }, mk);
    host.append(svg);
  }

  OB.etapas.acometida = function (root) {
    const E = OB.E, a = E.acom;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 2', titulo: 'Demanda y acometida',
      lead: 'Antes de comprar un metro de cable hay que saber cuánta carga tendrá la casa. Calcule la demanda con el método estándar del artículo 220, dimensione la acometida y el interruptor principal y ubique el medidor.'
    });
    const fig = OB.h('div');
    const tabla = OB.h('div');
    const calc = OB.h('div');
    const ctrl = OB.h('div');
    trabajo.append(OB.card('Acometida · vista lateral', fig), OB.card('Cuadro de cargas del plano', tabla));
    const nuevo = () => OB.cambio('acom');

    const pintaTabla = () => {
      const casa = O.casaDe(E);
      const cu = Q.cuadro(casa);
      const d = Q.demanda(casa);
      OB.vaciar(tabla);
      tabla.append(OB.tabla(['Circuito', 'Descripción', 'Ambientes', 'Carga (VA)', 'I (A)'], cu.map((r) => [
        OB.h('span', null, OB.h('i', { class: 'dot', style: { background: OB.COL_C[r.id] } }), r.id), r.nombre, r.amb, OB.h('span', { class: 'mono' }, OB.fmt(r.va, 0)), OB.h('span', { class: 'mono' }, OB.fmt(r.I, 1))].map((x, i) => (i >= 3 ? OB.h('span', { class: 'mono' }, x.textContent) : x))), 'compacta'));
      tabla.append(OB.h('div', { class: 'kpis', style: { marginTop: '8px' } },
        OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(d.instalada, 0)), OB.h('span', null, 'VA instalados')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(casa.areaConstruida(), 1)), OB.h('span', null, 'm² construidos (caras exteriores)'))));
    };

    const pintaCalc = () => {
      OB.vaciar(calc);
      const casa = O.casaDe(E), d = Q.demanda(casa);
      calc.append(OB.h('p', { class: 'nota' }, 'Método estándar de vivienda (NTC 2050, 220.12, 220.52, 220.42, 220.53 y 220.55): alumbrado y tomas generales a 33 VA/m²; dos circuitos de pequeños artefactos y uno de lavandería a 1 500 VA; los primeros 3 000 VA al 100 % y el resto al 35 %; la estufa por la Tabla 220.55 y la ducha como artefacto fijo.'));
      calc.append(OB.campo('Área construida (m²)', OB.num(a.area, (v) => { a.area = v; nuevo(); }, { min: 0 })));
      calc.append(OB.campo('Demanda total (VA)', OB.num(a.va, (v) => { a.va = v; nuevo(); }, { min: 0 }), 'Incluya la estufa de 6 kW y la ducha de 3 500 W.'));
      const det = OB.h('div');
      const btn = OB.h('button', { class: 'btn peq', type: 'button', onclick: () => {
        if (!a.ver) { a.ver = true; E.pistas = (E.pistas || 0) + 1; nuevo(); }
        OB.vaciar(det);
        det.append(OB.tabla(['Paso', 'Valor (VA)', 'Norma'], d.pasos.map((p) => [p.t, OB.h('span', { class: 'mono' }, OB.fmt(p.va, 0)), p.ref])), OB.h('div', { class: 'fila sep', style: { marginTop: '6px' } }, OB.h('strong', null, 'Total'), OB.h('strong', { class: 'mono' }, OB.fmt(d.total, 0) + ' VA · ' + OB.fmt(d.I240, 1) + ' A')));
      } }, a.ver ? 'Mostrar el cálculo' : 'Ver el cálculo paso a paso (pista, −2 puntos)');
      calc.append(btn, det);
      if (a.ver) btn.click();
    };

    const pintaCtrl = () => {
      OB.vaciar(ctrl);
      const info = O.acomInfo(E, O.casaDe(E));
      ctrl.append(OB.campo('Sistema de alimentación', OB.chips([['1F2H', 'Monofásico 120 V (2 hilos)'], ['1F3H', 'Monofásico 120/240 V (3 hilos)'], ['3F4H', 'Trifásico 208/120 V']], a.sistema, (v) => { a.sistema = v; nuevo(); pintaCtrl(); }, 'Sistema')));
      ctrl.append(OB.campo('Calibre de la acometida (cobre THHN/THWN-2)', OB.chips(['10', '8', '6', '4', '2'].map((x) => [x, x + ' AWG']), a.awg, (v) => { a.awg = v; if (a.tubo == null) a.tubo = null; nuevo(); pintaCtrl(); }, 'Calibre'),
        a.awg ? `${a.awg} AWG: ${info.ampac} A (columna de 60 °C) · capacidad instalable ${OB.fmt(info.ci.kVA, 1)} kVA` : 'Elija el calibre para ver su capacidad.'));
      if (a.awg) {
        ctrl.append(OB.campo('Documentación de la obra', OB.chips([['esquema', 'Esquema constructivo y declaración del constructor'], ['detallado', 'Diseño detallado'], ['plena', 'Certificación plena con dictamen']], a.ruta, (v) => { a.ruta = v; nuevo(); pintaCtrl(); }, 'Ruta'), 'Una cuenta, una vivienda, menos de 15 kVA y 240 V.'));
        ctrl.append(OB.campo('Interruptor principal (2 polos)', OB.chips([40, 50, 60, 70, 80, 100].map((x) => [x, x + ' A']), a.In, (v) => { a.In = +v; E.tab.total = +v; nuevo(); pintaCtrl(); }, 'Principal')));
      }
      ctrl.append(OB.campo('Tipo de acometida', OB.chips([['aerea', 'Aérea (concéntrico)'], ['subt', 'Subterránea']], a.tipo, (v) => { a.tipo = v; nuevo(); pintaCtrl(); }, 'Tipo')));
      if (a.tipo === 'aerea') ctrl.append(OB.campo('Altura del punto de amarre en la fachada', OB.rango(a.amarre, 2.5, 6, 0.1, (v) => { a.amarre = v; nuevo(); }, (v) => OB.fmt(v, 1) + ' m'), `El bucle de goteo baja ${N.FLECHA} m bajo el amarre. NTC 2050, 230.24(B).`));
      ctrl.append(OB.campo('Ubicación del medidor', OB.chips(Object.keys(O.MEDIDORES).map((k) => [k, O.MEDIDORES[k].nombre.split(' (')[0]]), a.medidor, (v) => { a.medidor = v; nuevo(); pintaCtrl(); }, 'Medidor')));
      ctrl.append(OB.campo('Altura del medidor', OB.rango(a.medZ, 0.8, 2.2, 0.05, (v) => { a.medZ = v; nuevo(); }, (v) => OB.fmt(v, 2) + ' m'), 'La norma del operador de red fija el rango; lo habitual es de 1,40 a 1,80 m.'));
      if (a.awg) ctrl.append(OB.campo('Tubo PVC del alimentador (medidor → tablero)', OB.chips(['1/2', '3/4', '1', '1 1/4'].map((x) => [x, x + ' in']), a.tubo, (v) => { a.tubo = v; nuevo(); pintaCtrl(); }, 'Tubo'), `Lleva 3 conductores de ${a.awg} AWG y la tierra de ${N.gec(a.awg)} AWG; ${OB.fmt(info.Lal, 1)} m de recorrido.`));
      if (a.awg) {
        ctrl.append(OB.h('div', { class: 'kpis' },
          OB.h('div', { class: 'kpi ' + (info.dv.pct <= 3 ? 'ok' : 'bad') }, OB.h('b', null, OB.fmt(info.dv.pct, 2) + ' %'), OB.h('span', null, 'caída en la acometida (' + OB.fmt(info.Lac, 0) + ' m)')),
          OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(info.dvAl.pct, 2) + ' %'), OB.h('span', null, 'caída hasta el tablero')),
          OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(info.I, 1) + ' A'), OB.h('span', null, 'corriente de demanda'))));
      }
    };
    panel.append(OB.card('1 · Demanda', calc), OB.card('2 · Acometida y medida', ctrl), OB.revision('acometida'));
    const todo = (q) => { if (q === 'tema') return; dibujaAcometida(fig, E); pintaTabla(); };
    OB.subs.push(todo);
    pintaCalc(); pintaCtrl(); todo();
  };
})();
