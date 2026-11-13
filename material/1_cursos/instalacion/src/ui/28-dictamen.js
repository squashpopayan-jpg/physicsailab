/* ===================================================================
   ui/28-dictamen.js — Dictamen final
   Puntaje por etapa, sello de la obra, hallazgos por corregir,
   declaración de cumplimiento del constructor, cantidades de obra
   según las decisiones tomadas e informe de texto para copiar.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N, R = L.R, Q = L.Q;

  function cantidades(E) {
    const casa = O.casaDe(E);
    const q = R.cantidades(casa);
    return { q, casa };
  }
  function informe(E, p) {
    const casa = O.casaDe(E);
    const ac = p.por.acometida.info || {};
    const hoy = new Date().toISOString().slice(0, 10);
    const L1 = [];
    L1.push('DICTAMEN DE LA OBRA ELÉCTRICA — ' + N.LOTES[E.lote].nombre);
    L1.push('Constructor: ' + (E.nombre || '(sin nombre)') + ' · Fecha: ' + hoy + ' · Modo: ' + E.modo);
    L1.push('Vivienda unifamiliar, ' + OB.fmt(casa.areaConstruida(), 1) + ' m², sistema monofásico trifilar 120/240 V');
    L1.push('Puntaje: ' + p.nota + ' / 100' + (E.pistas ? ' (pistas usadas: ' + E.pistas + ')' : ''));
    L1.push('');
    for (const e of O.ETAPAS) {
      const r = p.por[e.id];
      L1.push(`${e.nombre}: ${r.ok} cumplen, ${r.aviso} por revisar, ${r.falla} no cumplen, ${r.pend} pendientes`);
      r.items.filter((i) => i.estado === 'falla' || i.estado === 'aviso').forEach((i) => L1.push('  - [' + (i.estado === 'falla' ? 'NO CUMPLE' : 'REVISAR') + '] ' + i.texto + ' (' + i.ref + ')'));
    }
    L1.push('');
    if (ac.dem) L1.push(`Demanda ${OB.fmt(ac.dem.total, 0)} VA (${OB.fmt(ac.I, 1)} A a 240 V); acometida ${E.acom.awg || '—'} AWG; principal ${E.tab.total || '—'} A.`);
    L1.push('Referencias: RETIE vigente (Res. 40117 de 2024 y modificaciones) y NTC 2050 (NFPA 70-2017). Material didáctico; verifique en la norma oficial.');
    return L1.join('\n');
  }

  OB.etapas.dictamen = function (root) {
    const E = OB.E;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Dictamen', titulo: 'Dictamen de la obra',
      lead: 'El inspector suma las ocho etapas. Una obra se declara conforme cuando ninguna etapa tiene incumplimientos ni pendientes. Aquí están sus resultados, lo que falta corregir, las cantidades de obra de lo que decidió y la declaración del constructor.'
    });
    const cuerpo = OB.h('div'), lateral = OB.h('div');
    trabajo.append(cuerpo);
    panel.append(lateral);
    let copiado = false;

    function pinta() {
      OB.vaciar(cuerpo); OB.vaciar(lateral);
      const p = O.puntaje(E);
      const todas = O.ETAPAS.every((e) => p.por[e.id].listo);
      const algunaFalla = O.ETAPAS.some((e) => p.por[e.id].falla > 0);
      const sello = todas ? ['Obra conforme', 'ok'] : algunaFalla ? ['No conforme', 'bad'] : ['Con pendientes', 'warn'];
      // anillo
      const R0 = 52, cx = 65, cy = 65, circ = 2 * Math.PI * R0;
      const svg = OB.s('svg', { viewBox: '0 0 130 130', class: 'anillo', role: 'img', 'aria-label': 'Puntaje ' + p.nota + ' de 100' });
      OB.s('circle', { cx, cy, r: R0, fill: 'none', stroke: 'var(--surface-3)', 'stroke-width': 12 }, svg);
      OB.s('circle', { cx, cy, r: R0, fill: 'none', stroke: todas ? 'var(--ok)' : 'var(--accent)', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': `${circ * p.nota / 100} ${circ}`, transform: `rotate(-90 ${cx} ${cy})` }, svg);
      OB.s('text', { x: cx, y: cy + 8, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 600, fill: 'var(--ink)' }, svg, String(p.nota));
      OB.s('text', { x: cx, y: cy + 26, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, svg, 'de 100');
      cuerpo.append(OB.card(null, OB.h('div', { class: 'dict-grande' }, svg, OB.h('div', null, OB.h('span', { class: 'sello ' + sello[1] }, sello[0]),
        OB.h('p', { class: 'nota', style: { marginTop: '10px' } }, E.nombre ? E.nombre + ', ' : '', todas ? 'la instalación cumple el RETIE en las ocho etapas y puede declararse como esquema constructivo.' : 'todavía hay etapas sin completar o con incumplimientos. Revise la tabla y corrija.'),
        E.pistas ? OB.h('p', { class: 'ayuda' }, `Pistas usadas: ${E.pistas} (restan ${2 * E.pistas} puntos).`) : null))));
      // tabla por etapa
      const filas = O.ETAPAS.map((e) => {
        const r = p.por[e.id];
        const est = r.listo ? ['Lista', 'ok'] : r.falla ? ['No cumple', 'falla'] : r.pend ? ['Pendiente', ''] : ['Revisar', 'aviso'];
        return [OB.h('button', { class: 'btn peq', type: 'button', onclick: () => OB.ir(e.id) }, e.nombre), OB.h('span', { class: 'mono' }, e.peso + ''), OB.h('div', null, OB.h('span', { class: 'mono' }, OB.fmt(100 * r.frac, 0) + ' %'), OB.h('div', { class: 'barra-i' }, OB.h('b', { class: r.listo ? '' : r.falla ? 'bad' : 'warn', style: { width: 100 * r.frac + '%' } }))),
          OB.h('span', { class: 'mono' }, `${r.ok}/${r.aviso}/${r.falla}/${r.pend}`), OB.h('span', { class: 'pill ' + est[1] }, est[0]), OB.h('span', { class: 'mono' }, E.modo === 'inspector' ? String(E.cert[e.id] || 0) : '—')];
      });
      cuerpo.append(OB.card('Resultado por etapa', OB.tabla(['Etapa', 'Peso', 'Avance', 'ok/rev/no/pend', 'Estado', 'Revisiones pedidas'], filas, 'compacta')));
      // hallazgos
      const hall = [];
      O.ETAPAS.forEach((e) => p.por[e.id].items.filter((i) => i.estado === 'falla').forEach((i) => hall.push({ e, i })));
      cuerpo.append(OB.card('Por corregir', hall.length ? OB.h('ul', { class: 'items' }, hall.slice(0, 14).map(({ e, i }) => OB.h('li', { class: 'it falla' }, OB.h('span', { class: 'ico' }, '✕'), OB.h('div', null, OB.h('div', { class: 'txt' }, i.texto), OB.h('div', { class: 'ref' }, e.nombre + ' · ' + i.ref), OB.h('button', { class: 'btn peq', type: 'button', onclick: () => OB.ir(e.id) }, 'Ir a la etapa')))))
        : OB.h('p', { class: 'nota' }, 'No hay incumplimientos registrados.')));
      // cantidades
      const { q } = cantidades(E);
      const filasT = Object.keys(q.tubos).sort().map((k) => [k, OB.h('span', { class: 'mono' }, OB.fmt(q.tubos[k], 0) + ' m')]);
      const filasC = Object.keys(q.cables).sort().map((k) => [k, OB.h('span', { class: 'mono' }, OB.fmt(q.cables[k], 0) + ' m')]);
      const filasX = Object.keys(q.cajas).map((k) => [k, OB.h('span', { class: 'mono' }, String(q.cajas[k]))]);
      const ap = q.aparatos;
      const filasA = [['Luminarias', ap.lum], ['Apliques', ap.aplique], ['Interruptores sencillos', ap.int], ['Interruptores dobles', ap.int2], ['Conmutadores', ap.conm], ['Tomas comunes', ap.toma], ['Tomas GFCI', ap.gfci], ['(de ellas, para intemperie)', ap.ip], ['Salida de ducha', ap.ducha], ['Salida de estufa', ap.estufa]].filter((x) => x[1]).map((x) => [x[0], OB.h('span', { class: 'mono' }, String(x[1]))]);
      cuerpo.append(OB.h('details', { class: 'card' }, OB.h('summary', null, 'Cantidades de obra (según sus decisiones)'),
        OB.h('div', { class: 'cols', style: { marginTop: '10px' } }, OB.h('div', null, OB.h('div', { class: 'sub' }, 'Tubería'), OB.tabla(['Material', 'Longitud'], filasT, 'compacta'), OB.h('div', { class: 'sub' }, 'Cajas'), OB.tabla(['Tipo', 'Cantidad'], filasX, 'compacta'), OB.h('div', { class: 'sub' }, 'Aparatos'), OB.tabla(['Aparato', 'Cantidad'], filasA, 'compacta')),
          OB.h('div', null, OB.h('div', { class: 'sub' }, 'Conductores (con 0,30 m de holgura por caja)'), OB.tabla(['Calibre y color', 'Longitud'], filasC, 'compacta')))));
      // lateral: declaración e informe
      const ruta = C.rutaConformidad({ uso: 'residencial', cuentas: 1, kVA: p.por.acometida.info.ci ? p.por.acometida.info.ci.kVA : 13.2, V: 240 });
      lateral.append(OB.card('Documentos del esquema constructivo (RETIE 3.3.2)', OB.h('ul', { class: 'nota', style: { margin: 0, paddingLeft: '18px' } }, ruta.documentos.map((d) => OB.h('li', null, d))), OB.h('p', { class: 'ayuda' }, ruta.diseno + '. ' + ruta.certificacion + '.')));
      lateral.append(OB.card('Declaración de cumplimiento del constructor', todas
        ? OB.h('div', null, OB.h('p', null, `Yo, ${E.nombre || '________'}, declaro bajo mi responsabilidad que la instalación eléctrica de la vivienda en el ${N.LOTES[E.lote].nombre.toLowerCase()} fue construida de acuerdo con el RETIE vigente y la NTC 2050, y que las pruebas de aislamiento, polaridad, continuidad de tierra, puesta a tierra (≤ 25 Ω) y disparo de protecciones se realizaron con resultados satisfactorios.`), OB.h('p', { class: 'ayuda' }, 'Modelo didáctico de la declaración del RETIE 4.3.6.2; el documento real se tramita ante el operador de red.'))
        : OB.h('p', { class: 'nota' }, 'La declaración se habilita cuando las ocho etapas están listas y sin incumplimientos.')));
      const texto = informe(E, p);
      const pre = OB.h('pre', { class: 'informe', tabindex: 0 }, texto);
      lateral.append(OB.card('Informe de texto', pre, OB.h('div', { class: 'fila', style: { marginTop: '8px' } }, OB.h('button', { class: 'btn primario peq', type: 'button', onclick: () => {
        const sel = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
        try { navigator.clipboard.writeText(texto).then(() => OB.toast('Informe copiado', 'ok'), () => { sel(); OB.toast('Seleccionado: presione Ctrl+C'); }); } catch (e) { sel(); OB.toast('Seleccionado: presione Ctrl+C'); }
      } }, 'Copiar el informe'))));
    }
    OB.subs.push((q) => { if (q === 'tema') return; pinta(); });
    pinta();
  };
})();
