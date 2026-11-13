/* ===================================================================
   ui/23-circuitos.js — Etapa 4: conductores y protecciones
   Recibo de materiales (rollos de cable con micrómetro) y selección,
   para cada circuito, del calibre, la protección y la tierra, con la
   coordinación Ib ≤ In ≤ Iz y la caída de tensión.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N;

  OB.etapas.circuitos = function (root) {
    const E = OB.E;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 4', titulo: 'Conductores y protecciones',
      lead: 'Cada circuito necesita tres decisiones: el calibre del conductor, el interruptor que lo protege y el calibre de su tierra. La regla es Ib ≤ In ≤ Iz: el interruptor debe aguantar la carga y disparar antes de que el cable se dañe. Primero, reciba el cable.'
    });
    let sel = 'C1';
    const medidos = {};
    const recibo = OB.h('div'), tabla = OB.h('div'), regla = OB.h('div'), ayuda = OB.h('div');

    /* ---------- Recibo de materiales ---------- */
    function pintaRecibo() {
      OB.vaciar(recibo);
      const grid = OB.h('div', { class: 'kpis', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))' } });
      N.ROLLOS.forEach((r) => {
        const dec = E.cables.recibo[r.id];
        const nominal = C.awgDiam('12');
        const mostrar = OB.visible('circuitos');
        const bien = dec != null && ((dec === 'acepta') === r.ok);
        grid.append(OB.h('div', { class: 'kpi', style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
          OB.h('strong', null, r.marca),
          OB.h('span', null, 'Rótulo: 12 AWG · ' + r.aisl),
          OB.h('span', null, 'Certificado RETIE: ', OB.h('b', { style: { display: 'inline', font: 'inherit', color: r.cert ? 'var(--ok)' : 'var(--bad)' } }, r.cert ? 'presenta' : 'no presenta')),
          medidos[r.id] ? OB.h('span', { class: 'mono' }, `Ø medido ${OB.fmt(r.d, 2)} mm (12 AWG: ${OB.fmt(nominal, 2)} mm)`) : OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { medidos[r.id] = true; pintaRecibo(); } }, 'Medir con micrómetro'),
          OB.h('div', { class: 'fila' },
            OB.h('button', { class: 'chip' + (dec === 'acepta' ? ' on' : ''), type: 'button', onclick: () => { E.cables.recibo[r.id] = 'acepta'; OB.cambio('recibo'); pintaRecibo(); } }, 'Aceptar'),
            OB.h('button', { class: 'chip' + (dec === 'rechaza' ? ' on' : ''), type: 'button', onclick: () => { E.cables.recibo[r.id] = 'rechaza'; OB.cambio('recibo'); pintaRecibo(); } }, 'Rechazar')),
          dec != null && mostrar ? OB.h('span', { class: 'ayuda', style: { color: bien ? 'var(--ok)' : 'var(--bad)' } }, bien ? (r.ok ? 'Conforme.' : r.falla) : (r.ok ? 'Este rollo cumple: no había motivo para rechazarlo.' : r.falla)) : null));
      });
      recibo.append(OB.h('p', { class: 'nota' }, 'Llegaron cuatro rollos rotulados 12 AWG. Revise el certificado, el tipo de aislamiento y mida el diámetro del cobre antes de aceptarlos (RETIE 3.2.2: solo se instalan productos certificados).'), grid);
    }

    /* ---------- Tabla de circuitos ---------- */
    const AWGS = ['14', '12', '10', '8', '6'];
    const INS = [15, 20, 25, 30, 40, 50];
    function pintaTabla() {
      OB.vaciar(tabla);
      const casa = O.casaDe(E);
      const r = O.ev.circuitos(E);
      const filas = E.circuitos.map((c) => {
        const a = r.det[c.id];
        const it = r.items.find((i) => i.c === c.id);
        const est = it ? it.estado : 'pend';
        const mk = (valores, cur, fn, sufijo) => { const s = OB.sel(valores.map((v) => [v, v + (sufijo || '')]), cur, (v) => { fn(v || null); OB.cambio('circ'); }); s.setAttribute('aria-label', 'Selección para ' + c.id); return s; };
        const tr = [
          OB.h('span', null, OB.h('i', { class: 'dot', style: { background: OB.COL_C[c.id] } }), OB.h('button', { class: 'btn peq', type: 'button', style: { fontWeight: sel === c.id ? 700 : 400 }, onclick: () => { sel = c.id; pintaTabla(); pintaRegla(); } }, c.id)),
          c.nombre + (c.V === 240 ? ' (240 V, 2 polos)' : ''),
          OB.h('span', { class: 'mono' }, OB.fmt(a.Ib, 1)),
          OB.h('span', { class: 'mono' }, String(a.nPort)),
          mk(AWGS, c.awg, (v) => { c.awg = v; }, ' AWG'),
          mk(INS, c.In, (v) => { c.In = v ? +v : null; }, ' A'),
          mk(AWGS, c.tierra, (v) => { c.tierra = v; }, ' AWG'),
          OB.h('span', { class: 'mono' }, c.awg ? OB.fmt(a.Iz, 1) : '—'),
          OB.h('span', { class: 'mono' }, c.awg ? OB.fmt(a.caida, 2) + ' %' : '—')
        ];
        return { tr, est };
      });
      const t = OB.tabla(['Circuito', 'Descripción', 'Ib (A)', 'Cond.', 'Fase', 'Protección', 'Tierra', 'Iz (A)', 'Caída'], filas.map((f) => f.tr), 'compacta');
      OB.$$('tbody tr', t).forEach((tr, i) => { if (OB.visible('circuitos')) tr.classList.add(filas[i].est === 'pend' ? 'p' : filas[i].est); });
      tabla.append(t);
    }
    function pintaRegla() {
      OB.vaciar(regla);
      const c = E.circuitos.find((x) => x.id === sel);
      const casa = O.casaDe(E);
      const a = O.analisisCircuito(E, c, casa);
      regla.append(OB.h('div', { class: 'fila sep' }, OB.h('strong', null, `${c.id} · ${c.nombre}`), OB.h('span', { class: 'pill' }, `${OB.fmt(a.VA, 0)} VA · ${c.V} V`)));
      if (!c.awg || !c.In) { regla.append(OB.h('p', { class: 'nota' }, 'Escoja calibre y protección para ver la coordinación.')); return; }
      const vmax = Math.max(a.Ib, c.In, a.Iz, a.pmax) * 1.15;
      const W = 520, H = 120, X = (v) => 20 + (v / vmax) * (W - 40);
      const svg = OB.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svg-banco', role: 'img', 'aria-label': 'Coordinación entre la corriente de carga, la protección y la capacidad del conductor' });
      OB.s('rect', { x: 20, y: 56, width: W - 40, height: 14, rx: 7, fill: 'var(--surface-2)' }, svg);
      OB.s('rect', { x: 20, y: 56, width: Math.max(0, X(a.Iz) - 20), height: 14, rx: 7, fill: 'var(--ok-soft)', stroke: 'var(--ok)' }, svg);
      const mark = (v, txt, col, y, ancla) => { OB.s('line', { x1: X(v), x2: X(v), y1: y > 60 ? 70 : 56, y2: y > 60 ? y - 12 : y + 4, stroke: col, 'stroke-width': 2 }, svg); OB.s('circle', { cx: X(v), cy: 63, r: 5, fill: col }, svg); OB.s('text', { x: X(v), y, 'text-anchor': ancla || 'middle', 'font-size': 12, fill: col, 'font-weight': 600 }, svg, txt); };
      mark(a.Ib, `Ib ${OB.fmt(a.Ib, 1)} A`, 'var(--ink)', 32, 'middle');
      const okIn = c.In >= a.Ib - 1e-9 && c.In <= a.pmax + 1e-9;
      mark(c.In, `In ${c.In} A`, okIn ? 'var(--accent)' : 'var(--bad)', 18, 'middle');
      mark(a.Iz, `Iz ${OB.fmt(a.Iz, 1)} A`, 'var(--ok)', 96, 'middle');
      regla.append(svg, OB.h('p', { class: 'ayuda' }, `Iz = ampacidad de ${c.awg} AWG (columna de 60 °C) × factor por ${a.nPort} conductores portadores a ${O.TA} °C. Protección máxima permitida: ${a.pmax} A.`));
    }
    function pintaAyuda() {
      OB.vaciar(ayuda);
      ayuda.append(OB.h('ul', { class: 'nota', style: { margin: 0, paddingLeft: '18px' } },
        OB.h('li', null, 'Ib = VA ÷ tensión del circuito. En 120/240 V la estufa y el calentador de 240 V cargan las dos fases.'),
        OB.h('li', null, 'Los conductores de 14, 12 y 10 AWG se protegen con 15, 20 y 30 A como máximo (240.4(D)).'),
        OB.h('li', null, 'Pequeños artefactos de cocina y lavandería: 20 A con 12 AWG como mínimo (210.11(C)).'),
        OB.h('li', null, 'La tierra de equipos sale de la Tabla 250.122 según el interruptor: 15 A → 14, 20 A → 12, 30 A → 10, 60 A → 10 AWG.'),
        OB.h('li', null, 'Caída de tensión recomendada en el ramal: 3 % o menos.')),
        OB.h('button', { class: 'btn peq', type: 'button', style: { marginTop: '8px' }, onclick: () => {
          const c = E.circuitos.find((x) => x.id === sel);
          c.awg = c.ref.awg; c.In = c.ref.In; c.tierra = c.ref.tierra; E.pistas = (E.pistas || 0) + 1; OB.cambio('circ'); OB.toast('Solución de referencia para ' + sel + ' (−2 puntos)');
        } }, 'Mostrar la solución del circuito seleccionado (pista, −2 puntos)'));
    }
    trabajo.append(OB.card('1 · Recibo de materiales', recibo), OB.card('2 · Circuitos', tabla, OB.h('div', { style: { marginTop: '10px' } }, regla)));
    panel.append(OB.card('Reglas del conductor', ayuda), OB.revision('circuitos'));
    OB.subs.push((q) => { if (q === 'tema') return; pintaTabla(); pintaRegla(); });
    pintaRecibo(); pintaTabla(); pintaRegla(); pintaAyuda();
  };
})();
