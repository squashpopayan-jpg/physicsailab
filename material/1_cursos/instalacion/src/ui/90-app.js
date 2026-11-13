/* ===================================================================
   ui/90-app.js — Arranque, navegación por etapas e inicio
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, N = OB.N, L = OB.L;

  OB.NAV = [{ id: 'inicio', n: '·', nombre: 'Inicio' }].concat(O.ETAPAS.map((e, i) => ({ id: e.id, n: String(i + 1), nombre: e.nombre })), [{ id: 'dictamen', n: '✓', nombre: 'Dictamen' }]);
  OB.actual = 'inicio';

  /* ---------- Estado de los indicadores ---------- */
  function estadoEtapa(id) {
    if (!O.ev[id]) return '';
    try { const r = O.ev[id](OB.E); return r.listo ? 'ok' : r.falla ? 'falla' : r.aviso && !r.pend ? 'aviso' : ''; } catch (e) { return ''; }
  }
  let pend = false;
  function refrescarCabecera() {
    if (pend) return;
    pend = true;
    requestAnimationFrame(() => {
      pend = false;
      try {
        const nav = OB.$('#pasos');
        OB.$$('button', nav).forEach((b) => {
          const d = OB.$('.d', b);
          if (d) d.className = 'd ' + estadoEtapa(b.dataset.id);
        });
        const p = O.puntaje(OB.E);
        OB.$('#nota b').textContent = p.nota;
      } catch (e) { console.error(e); }
    });
  }

  function pintarNav() {
    const nav = OB.vaciar(OB.$('#pasos'));
    OB.NAV.forEach((e) => {
      nav.append(OB.h('button', { type: 'button', data: { id: e.id }, 'aria-current': e.id === OB.actual ? 'page' : null, onclick: () => ir(e.id) },
        OB.h('span', { class: 'n' }, e.n), e.nombre, O.ev[e.id] ? OB.h('span', { class: 'd' }) : null));
    });
  }
  function ir(id) {
    if (OB.limpieza) { try { OB.limpieza(); } catch (e) { /* nada */ } OB.limpieza = null; }
    OB.actual = id;
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* sin historial */ }
    pintarNav();
    const root = OB.vaciar(OB.$('#etapa'));
    OB.limpiarSubs();
    OB.subs.push(refrescarCabecera);
    (OB.etapas[id] || OB.etapas.inicio)(root);
    refrescarCabecera();
    window.scrollTo({ top: 0 });
  }
  OB.ir = ir;

  /* ---------- Inicio ---------- */
  OB.etapas.inicio = function (root) {
    const E = OB.E;
    const nombre = OB.h('input', { type: 'text', value: E.nombre || '', placeholder: 'Nombre del constructor', maxlength: 60, oninput: (e) => { E.nombre = e.target.value; OB.guardar(); } });
    let confirmar = false;
    const reinicio = OB.h('div');
    const pintaReinicio = () => {
      OB.vaciar(reinicio);
      reinicio.append(confirmar
        ? OB.h('div', { class: 'aviso-box bad' }, 'Se borrarán todas sus decisiones de obra. ', OB.h('button', { class: 'btn peq peligro', type: 'button', onclick: () => { const o = { nombre: E.nombre, modo: E.modo, lote: E.lote }; OB.nuevoEstado(o); confirmar = false; OB.toast('Obra reiniciada'); ir('inicio'); } }, 'Sí, reiniciar'), ' ', OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { confirmar = false; pintaReinicio(); } }, 'Cancelar'))
        : OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { confirmar = true; pintaReinicio(); } }, 'Reiniciar la obra'));
    };
    pintaReinicio();
    const lotes = OB.h('div');
    const pintaLotes = () => {
      OB.vaciar(lotes);
      lotes.append(OB.chips(Object.keys(N.LOTES).map((k) => [k, N.LOTES[k].nombre]), E.lote, (v) => { E.lote = v; OB.cambio('lote'); pintaLotes(); }, 'Lote'));
      lotes.append(OB.h('p', { class: 'ayuda' }, N.LOTES[E.lote].desc + ` Red de baja tensión a ${N.LOTES[E.lote].red} m del frente.`));
    };
    pintaLotes();
    const modos = OB.h('div');
    const pintaModos = () => {
      OB.vaciar(modos);
      modos.append(OB.chips([['guiado', 'Guiado: revisión en vivo'], ['inspector', 'Inspector: revisión a solicitud']], E.modo, (v) => { E.modo = v; OB.cambio('modo'); pintaModos(); }, 'Modo'));
      modos.append(OB.h('p', { class: 'ayuda' }, E.modo === 'guiado' ? 'Cada decisión se evalúa al instante y se le dice qué norma se incumple.' : 'Como un inspector real: decide, pide la revisión de la etapa y recibe el resultado. Cada solicitud queda en el dictamen.'));
    };
    pintaModos();
    root.append(OB.h('div', { class: 'hero' },
      OB.h('div', null,
        OB.h('h2', null, 'Instale usted la red eléctrica de la casa'),
        OB.h('p', { class: 'lead', style: { fontSize: '17px', color: 'var(--ink-2)', maxWidth: '58ch' } },
          'Una vivienda de 82 m² en Popayán, con su plano eléctrico: 12 luminarias, 29 tomas, ducha y estufa eléctricas. Usted es el constructor. Calcule la demanda, tienda la acometida, clave el electrodo, escoja cada cable, su color y su tubo, arme el tablero, cablee las cajas, energice y pase la inspección. Todo es simulado y se evalúa con el RETIE y la NTC 2050.'),
        OB.card('Datos de la obra',
          OB.campo('Constructor', nombre), OB.campo('Lote', lotes), OB.campo('Modo de trabajo', modos),
          OB.h('div', { class: 'fila' }, OB.h('button', { class: 'btn primario', type: 'button', onclick: () => ir('plano') }, 'Comenzar la obra'), reinicio))),
      OB.h('div', null,
        OB.card('Las ocho etapas',
          OB.h('ol', { class: 'lista-etapas' },
            [['Plano y puntos', 'Lea el plano, mueva y agregue tomas y compruebe la regla de los 1,8 m y los GFCI.'],
              ['Demanda y acometida', 'Calcule la carga, escoja el calibre, el principal y el medidor.'],
              ['Puesta a tierra', 'Mida el suelo con Wenner, clave los electrodos y mida con el telurómetro.'],
              ['Conductores y protecciones', 'Reciba los rollos, escoja calibre, protección y tierra de cada circuito.'],
              ['Canalizaciones y cajas', 'Llenado de tubos, cruces con vigas y volumen de cada caja.'],
              ['Tablero', 'Ubíquelo, reparta los circuitos entre las fases y cierre el puente neutro–tierra.'],
              ['Colores y cableado', 'Cablee cinco montajes con el código de colores y vea si funcionan.'],
              ['Energizar y probar', 'Megger, polaridad, GFCI, plena carga, cortocircuitos y fugas.']].map((x, i) => OB.h('li', null, OB.h('b', null, String(i + 1)), OB.h('div', null, OB.h('strong', null, x[0]), OB.h('span', { style: { display: 'block' } }, x[1]))))),
          OB.h('p', { class: 'nota' }, 'Al final, el dictamen suma el puntaje y declara si la obra cumple como esquema constructivo (RETIE 3.3.2).')),
        OB.card('Cómo se maneja', OB.h('dl', { class: 'manejo' }, OB.manejo.map((m) => [OB.h('dt', null, m[0]), OB.h('dd', null, m[1])]))),
        OB.card('Para tener en cuenta',
          OB.h('p', { class: 'nota' }, 'El progreso se guarda en este navegador. Los valores normativos provienen de la guía «Cableado con criterio» (RETIE vigente a octubre de 2026 y NTC 2050); verifíquelos en la norma oficial antes de usarlos en una obra real. Material didáctico del Departamento de Física, Universidad del Cauca.')))));
  };

  /* ---------- Tema ---------- */
  function tema() {
    const r = document.documentElement;
    const oscuro = r.dataset.theme === 'dark' || (!r.dataset.theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    r.dataset.theme = oscuro ? 'light' : 'dark';
    OB.cambio('tema');
  }

  /* ---------- Arranque ---------- */
  function arrancar() {
    if (!OB.cargar()) OB.nuevoEstado({});
    OB.E.cert = OB.E.cert || {};
    OB.$('#btn-tema').addEventListener('click', tema);
    const h = (location.hash || '').replace('#', '');
    pintarNav();
    ir(OB.NAV.some((e) => e.id === h) ? h : 'inicio');
    window.addEventListener('hashchange', () => { const x = location.hash.replace('#', ''); if (x !== OB.actual && OB.NAV.some((e) => e.id === x)) ir(x); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
