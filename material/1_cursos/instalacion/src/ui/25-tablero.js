/* ===================================================================
   ui/25-tablero.js — Etapa 6: tablero general
   Ubicación del tablero en el plano, interruptor principal, reparto
   de los circuitos en 12 espacios con fase alternada, diferencial de
   la ducha, balance de fases, puente neutro–tierra y directorio.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N, Q = L.Q;

  OB.etapas.tablero = function (root) {
    const E = OB.E, tb = E.tab;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 6', titulo: 'Tablero',
      lead: 'El tablero es el corazón de la instalación. Escoja un lugar seguro y accesible, el interruptor principal y distribuya los circuitos en sus doce espacios: en una acometida de 120/240 V las posiciones alternan entre la fase A y la B, y conviene que las dos queden parejas.'
    });
    let selc = null;
    const figura = OB.h('div'), balance = OB.h('div'), selCard = OB.h('div'), ctrl = OB.h('div');
    const wrap = OB.h('div');

    /* ---------- Plano con candidatos ---------- */
    const pl = new OB.Planta(wrap, { E, capas: { ids: false, ilum: false, ctrl: false, tomas: false, muebles: true }, aria: 'Planta con los cuatro sitios posibles del tablero', bounds: [-0.6, -0.6, 8.6, 10.6] });
    pl.extra = (svg) => {
      const g = OB.s('g', null, svg);
      Object.keys(O.SITIOS).forEach((k) => {
        const s = O.SITIOS[k], sel = tb.sitio === k;
        const e = OB.s('g', { 'data-clic': 1, style: 'cursor:pointer', onclick: () => { tb.sitio = k; OB.cambio('sitio'); } }, g);
        OB.s('circle', { cx: s.x, cy: -s.y, r: 0.34, fill: sel ? 'var(--accent)' : 'var(--surface)', stroke: sel ? 'var(--accent)' : 'var(--ink-2)', 'stroke-width': 0.05, opacity: 0.95 }, e);
        OB.s('text', { x: s.x, y: -s.y + 0.08, class: 'pl-txt sw', 'text-anchor': 'middle', fill: sel ? 'var(--accent-ink)' : 'var(--ink)', 'font-size': 0.2 }, e, k === 'hall' ? 'H' : k === 'sala' ? 'S' : k === 'bano' ? 'B' : 'P');
        OB.s('title', null, e, s.nombre);
      });
    };
    trabajo.append(OB.card('Sitio del tablero', wrap, OB.h('p', { class: 'ayuda' }, 'Toque un círculo: H = hall, S = sala-comedor, B = baño, P = patio de ropas. Cambiar el sitio cambia las longitudes de todos los circuitos.')));

    /* ---------- Tablero (SVG) ---------- */
    const COLX = { L: 92, R: 248 }, SW = 120, Y0 = 118, SH = 56, GAP = 8;
    function pintaFigura() {
      OB.vaciar(figura);
      const svg = OB.s('svg', { viewBox: '0 0 460 560', class: 'svg-banco', role: 'group', 'aria-label': 'Tablero de 12 espacios' });
      OB.s('rect', { x: 14, y: 8, width: 432, height: 544, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 3 }, svg);
      OB.s('text', { x: 230, y: 30, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700 }, svg, 'TG · ' + O.SITIOS[tb.sitio].nombre);
      // principal
      OB.s('rect', { x: 140, y: 44, width: 180, height: 52, rx: 6, fill: 'var(--ink)' }, svg);
      OB.s('text', { x: 230, y: 66, 'text-anchor': 'middle', 'font-size': 13, fill: 'var(--bg)', 'font-weight': 700 }, svg, 'PRINCIPAL 2 POLOS');
      OB.s('text', { x: 230, y: 86, 'text-anchor': 'middle', 'font-size': 15, fill: 'var(--accent)', 'font-weight': 700 }, svg, tb.total ? tb.total + ' A' : 'sin definir');
      // barras
      OB.s('rect', { x: 34, y: Y0, width: 22, height: 6 * (SH + GAP) - GAP, fill: 'var(--rule-2)' }, svg); OB.s('text', { x: 45, y: Y0 + 6 * (SH + GAP) + 14, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700 }, svg, 'N');
      OB.s('rect', { x: 404, y: Y0, width: 22, height: 6 * (SH + GAP) - GAP, fill: 'var(--ok)', opacity: 0.6 }, svg); OB.s('text', { x: 415, y: Y0 + 6 * (SH + GAP) + 14, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700 }, svg, 'T');
      if (tb.puente === 'si') { OB.s('path', { d: `M56 ${Y0 + 6 * (SH + GAP) + 20} H404`, stroke: 'var(--accent)', 'stroke-width': 3, fill: 'none' }, svg); OB.s('text', { x: 230, y: Y0 + 6 * (SH + GAP) + 36, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--accent)' }, svg, 'puente principal neutro–tierra'); }
      // filas
      for (let r = 0; r < 6; r++) {
        const f = O.faseFila(r), y = Y0 + r * (SH + GAP);
        OB.s('rect', { x: 216, y, width: 28, height: SH, fill: f === 'A' ? 'var(--ink)' : 'var(--bad)', opacity: 0.85 }, svg);
        OB.s('text', { x: 230, y: y + SH / 2 + 5, 'text-anchor': 'middle', 'font-size': 14, fill: '#fff', 'font-weight': 700 }, svg, f);
      }
      const sl = O.slots(E);
      const libreOk = (col, row) => { const c = E.circuitos.find((x) => x.id === selc); if (!c || sl[selc]) return false; if (tb.slots[col + row]) return false; if (c.polos === 2) return row < 5 && !tb.slots[col + (row + 1)]; return true; };
      for (const col of ['L', 'R']) {
        for (let row = 0; row < 6; row++) {
          const k = col + row, s = tb.slots[k];
          const x = COLX[col], y = Y0 + row * (SH + GAP);
          if (s && s.cont) continue;
          if (s) {
            const c = E.circuitos.find((q) => q.id === s.c), dos = c.polos === 2;
            const h = dos ? 2 * SH + GAP : SH;
            const g = OB.s('g', { class: 'slot lleno', style: 'cursor:pointer', tabindex: 0, 'data-clic': 1, onclick: () => { selc = s.c; OB.cambio('selc'); }, onkeydown: (e) => { if (e.key === 'Enter') { selc = s.c; OB.cambio('selc'); } } }, svg);
            OB.s('rect', { x, y, width: SW, height: h, rx: 6, class: 'fondo', stroke: selc === s.c ? 'var(--accent)' : null, 'stroke-width': selc === s.c ? 3.5 : null }, g);
            OB.s('rect', { x: x + 6, y: y + 6, width: 8, height: h - 12, rx: 3, fill: OB.COL_C[s.c] }, g);
            OB.s('text', { x: x + 22, y: y + 22, 'font-size': 14, 'font-weight': 700, fill: 'var(--ink)' }, g, s.c + (dos ? ' · 2P' : ''));
            OB.s('text', { x: x + 22, y: y + 40, 'font-size': 12.5, fill: 'var(--ink-2)' }, g, (c.In ? c.In + ' A' : '— A') + (s.tipo === 'dif' ? ' + 30 mA' : ''));
            if (s.tipo === 'dif') OB.s('rect', { x: x + SW - 26, y: y + 8, width: 18, height: 12, rx: 2, fill: 'var(--accent)' }, g);
            OB.s('title', null, g, c.nombre);
          } else {
            const ok = selc && libreOk(col, row);
            const g = OB.s('g', { class: 'slot' + (ok ? ' obj' : ''), style: 'cursor:pointer', tabindex: 0, 'data-clic': 1, onclick: () => ponerEn(k), onkeydown: (e) => { if (e.key === 'Enter') ponerEn(k); } }, svg);
            OB.s('rect', { x, y, width: SW, height: SH, rx: 6, class: 'fondo' }, g);
            OB.s('text', { x: x + SW / 2, y: y + SH / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-3)' }, g, ok ? 'colocar aquí' : 'libre');
          }
        }
      }
      figura.append(svg);
    }
    function ponerEn(k) {
      if (!selc) { OB.toast('Elija primero un circuito en la lista', 'bad'); return; }
      const sl = O.slots(E);
      if (sl[selc]) { OB.toast('Quite el circuito de su posición actual antes de moverlo', 'bad'); return; }
      const c = E.circuitos.find((x) => x.id === selc);
      const dif = c.arbol.some(([, v]) => { const p = E.puntos.find((q) => q.id === v); return p && p.tipo === 'ducha'; });
      const r = O.colocar(E, selc, k, dif ? 'dif' : 'tm');
      if (!r.ok) { OB.toast(r.msg, 'bad'); return; }
      OB.cambio('tablero');
    }

    /* ---------- Circuitos, balance y controles ---------- */
    function pintaSel() {
      OB.vaciar(selCard);
      const sl = O.slots(E);
      const sin = E.circuitos.filter((c) => !sl[c.id]);
      selCard.append(OB.h('p', { class: 'nota' }, sin.length ? 'Circuitos sin colocar (toque uno y luego un espacio libre del tablero):' : 'Todos los circuitos están colocados. Toque uno en el tablero para cambiarlo.'));
      selCard.append(OB.h('div', { class: 'chips' }, E.circuitos.map((c) => OB.h('button', { type: 'button', class: 'chip' + (selc === c.id ? ' on' : ''), style: { borderColor: OB.COL_C[c.id], opacity: sl[c.id] ? 0.55 : 1 }, onclick: () => { selc = c.id; OB.cambio('selc'); } }, OB.h('i', { class: 'dot', style: { background: OB.COL_C[c.id], margin: '0 6px 0 0' } }), c.id + (c.polos === 2 ? ' · 2P' : '')))));
      if (selc) {
        const c = E.circuitos.find((x) => x.id === selc), s = sl[selc];
        const cu = Q.cuadro(O.casaDe(E)).find((r) => r.id === selc);
        selCard.append(OB.h('div', { class: 'aviso-box', style: { borderColor: OB.COL_C[selc] } }, OB.h('strong', null, `${c.id} · ${c.nombre}`), OB.h('div', { class: 'nota' }, `${OB.fmt(cu.va, 0)} VA a ${c.V} V · ${OB.fmt(cu.I, 1)} A · protección ${c.In ? c.In + ' A' : 'sin definir (etapa 4)'}` + (s ? ` · fase ${s.fase === 'A' && c.polos === 2 ? 'A+B' : s.fase}` : ''))));
        if (s) {
          selCard.append(OB.h('div', { class: 'fila' },
            OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { O.quitar(E, selc); OB.cambio('tablero'); } }, 'Sacar del tablero'),
            OB.chips([['tm', 'Termomagnético'], ['dif', 'Con diferencial 30 mA']], s.tipo, (v) => { tb.slots[s.slot].tipo = v; OB.cambio('tablero'); }, 'Tipo de interruptor')));
        }
      }
    }
    function pintaBalance() {
      OB.vaciar(balance);
      const casa = O.casaDe(E), sl = O.slots(E);
      const asign = {}; let falta = 0;
      E.circuitos.forEach((c) => { if (c.polos === 2) asign[c.id] = 'AB'; else if (sl[c.id]) asign[c.id] = sl[c.id].fase; else falta++; });
      const b = Q.balance(casa, Object.assign({}, asign));
      void falta;
      const cu = Q.cuadro(casa);
      let A = 0, B = 0;
      cu.forEach((r) => { const f = asign[r.id]; if (!f) return; if (f === 'AB') { A += r.va / 2; B += r.va / 2; } else if (f === 'A') A += r.va; else B += r.va; });
      const tot = A + B || 1, desb = Math.abs(A - B) / (tot / 2) / 2;
      balance.append(OB.h('div', { class: 'escala', 'aria-hidden': 'true' }, OB.h('i', { style: { width: (100 * A / tot) + '%', background: 'var(--ink)' } }), OB.h('i', { style: { width: (100 * B / tot) + '%', background: 'var(--bad)' } })),
        OB.h('div', { class: 'fila sep' }, OB.h('span', { class: 'mono' }, `Fase A ${OB.fmt(A, 0)} VA`), OB.h('span', { class: 'mono' }, `Fase B ${OB.fmt(B, 0)} VA`), OB.h('span', { class: 'pill ' + (desb <= 0.15 ? 'ok' : 'aviso') }, 'desbalance ' + OB.fmt(100 * desb, 1) + ' %')),
        OB.h('p', { class: 'ayuda' }, 'Con las fases parejas el neutro casi no lleva corriente (' + OB.fmt(b.IN, 1) + ' A de diferencia con todos los circuitos encendidos). Los 240 V (estufa) cargan por igual las dos fases.'));
    }
    function pintaCtrl() {
      OB.vaciar(ctrl);
      const info = O.acomInfo(E, O.casaDe(E));
      ctrl.append(OB.campo('Interruptor principal', OB.chips([40, 50, 60, 70, 80, 100].map((x) => [x, x + ' A']), tb.total, (v) => { tb.total = +v; E.acom.In = +v; OB.cambio('tablero'); }, 'Principal'), `Demanda ${OB.fmt(info.I, 1)} A` + (E.acom.awg ? `; el ${E.acom.awg} AWG admite protección hasta ${info.pmax} A.` : '.')));
      ctrl.append(OB.campo('Puente neutro–tierra', OB.chips([['si', 'Instalar puente principal'], ['no', 'No instalarlo']], tb.puente, (v) => { tb.puente = v; OB.cambio('tablero'); }, 'Puente'), 'Se hace una sola vez, en el tablero de acometida.'));
      ctrl.append(OB.campo('Barra de tierra', OB.chips([['spt', 'Al electrodo de puesta a tierra'], ['neutro', 'Solo a la barra de neutro'], ['nada', 'Sin conectar']], tb.barraT, (v) => { tb.barraT = v; OB.cambio('tablero'); }, 'Barra de tierra')));
      ctrl.append(OB.campo('Directorio de circuitos', OB.chips([['si', 'Rotulado y legible'], ['no', 'Sin rótulos']], tb.directorio, (v) => { tb.directorio = v; OB.cambio('tablero'); }, 'Directorio')));
      ctrl.append(OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { O.sugerirTablero(E); E.pistas = (E.pistas || 0) + 1; OB.cambio('tablero'); OB.toast('Distribución sugerida (−2 puntos)'); } }, 'Sugerir la distribución (pista, −2 puntos)'));
    }
    trabajo.append(OB.card('Tablero de 12 espacios', figura, OB.h('p', { class: 'ayuda' }, 'Las franjas centrales indican la fase de cada fila (A en negro, B en rojo). Un interruptor de 2 polos ocupa dos filas seguidas y toma las dos fases.')));
    panel.append(OB.card('Circuitos', selCard), OB.card('Balance de fases', balance), OB.card('Principal, barras y rótulos', ctrl), OB.revision('tablero'));
    OB.subs.push((q) => { if (q === 'tema') return; pintaFigura(); pintaSel(); pintaBalance(); pintaCtrl(); pl.render(); });
    pintaFigura(); pintaSel(); pintaBalance(); pintaCtrl(); pl.render();
  };
})();
