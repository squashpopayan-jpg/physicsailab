/* ===================================================================
   ui/00-base.js — Utilidades de interfaz, estado y persistencia
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, O = L.O, C = L.C, N = L.N;
  const OB = (window.OB = { etapas: {}, vistas: {} });
  OB.L = L; OB.O = O; OB.C = C; OB.N = N;

  /* ---------- DOM ---------- */
  OB.h = function (tag, attrs) {
    const e = document.createElement(tag);
    const kids = Array.prototype.slice.call(arguments, 2);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'data') for (const d in v) e.dataset[d] = v[d];
      else e.setAttribute(k, v === true ? '' : v);
    }
    const add = (x) => { if (x == null || x === false) return; if (Array.isArray(x)) x.forEach(add); else e.append(x.nodeType ? x : document.createTextNode(x)); };
    kids.forEach(add);
    return e;
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  OB.s = function (tag, attrs, parent, text) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) { const v = attrs[k]; if (v == null || v === false) continue; if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
    if (text != null) e.textContent = text;
    if (parent) parent.append(e);
    return e;
  };
  OB.$ = (s, r) => (r || document).querySelector(s);
  OB.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  OB.fmt = (x, d) => C.fmt(x, d == null ? 1 : d);
  OB.vaciar = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };

  /* ---------- Estado ---------- */
  const KEY = 'obra-electrica-v1';
  OB.nuevoEstado = function (o) { OB.E = O.nuevo(o); OB.S = null; OB.guardar(); return OB.E; };
  OB.guardar = function () { try { localStorage.setItem(KEY, JSON.stringify(OB.E)); } catch (e) { /* sin almacenamiento */ } };
  OB.cargar = function () {
    try {
      const j = localStorage.getItem(KEY);
      if (j) { const E = JSON.parse(j); if (E && E.v === 1 && E.circuitos && E.puntos) { OB.E = E; return true; } }
    } catch (e) { /* ignorar */ }
    return false;
  };
  OB.borrar = function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignorar */ } };
  OB.subs = [];
  OB.cambio = function (quien) { OB.guardar(); OB.subs.forEach((f) => { try { f(quien); } catch (e) { console.error(e); } }); };

  /* ---------- Avisos ---------- */
  OB.toast = function (txt, tipo) {
    let box = OB.$('#toasts');
    if (!box) { box = OB.h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
    const t = OB.h('div', { class: 'toast ' + (tipo || '') }, txt);
    box.append(t);
    setTimeout(() => t.classList.add('sale'), 3200);
    setTimeout(() => t.remove(), 3700);
  };

  /* ---------- Revisión de una etapa ---------- */
  const ICONO = { ok: '✓', falla: '✕', aviso: '!', pend: '·', info: 'i' };
  const ROTULO = { ok: 'Cumple', falla: 'No cumple', aviso: 'Revisar', pend: 'Pendiente', info: '' };
  OB.visible = (etapa) => OB.E.modo === 'guiado' || (OB.E.cert && OB.E.cert[etapa]);
  /* Lista de verificación con estado; en modo inspector solo aparece tras solicitar la revisión */
  OB.revision = function (etapa, extraAcciones) {
    const box = OB.h('section', { class: 'rev card', 'aria-label': 'Revisión de la etapa' });
    const pintar = () => {
      OB.vaciar(box);
      const r = O.ev[etapa](OB.E);
      const cab = OB.h('div', { class: 'rev-cab' },
        OB.h('h3', null, 'Revisión normativa'),
        OB.h('span', { class: 'pill ' + (r.listo ? 'ok' : r.falla ? 'falla' : 'pend') }, r.listo ? 'Etapa lista' : r.falla ? r.falla + ' por corregir' : r.pend + ' pendientes'));
      box.append(cab);
      if (!OB.visible(etapa)) {
        box.append(OB.h('p', { class: 'nota' }, 'Modo inspector: el resultado se muestra cuando usted solicita la revisión. Cada solicitud queda registrada en el dictamen.'),
          OB.h('button', { class: 'btn primario', type: 'button', onclick: () => { OB.E.cert[etapa] = (OB.E.cert[etapa] || 0) + 1; OB.cambio('rev'); } }, 'Solicitar revisión de la etapa'));
        return;
      }
      const ul = OB.h('ul', { class: 'items' });
      const orden = { falla: 0, aviso: 1, pend: 2, ok: 3, info: 4 };
      [...r.items].sort((a, b) => orden[a.estado] - orden[b.estado]).forEach((i) => {
        ul.append(OB.h('li', { class: 'it ' + i.estado },
          OB.h('span', { class: 'ico', 'aria-label': ROTULO[i.estado] }, ICONO[i.estado]),
          OB.h('div', null, OB.h('div', { class: 'txt' }, i.texto), OB.h('div', { class: 'ref' }, i.ref))));
      });
      box.append(ul);
      if (OB.E.modo === 'inspector') box.append(OB.h('button', { class: 'btn', type: 'button', onclick: () => { OB.E.cert[etapa] = (OB.E.cert[etapa] || 0) + 1; OB.cambio('rev'); } }, 'Volver a solicitar revisión'));
      if (extraAcciones) box.append(extraAcciones);
    };
    pintar();
    OB.subs.push(pintar);
    return box;
  };
  /* Vuelve a pintar todo lo suscrito; las vistas se limpian al cambiar de etapa */
  OB.limpiarSubs = () => { OB.subs = []; };

  /* ---------- Controles pequeños ---------- */
  OB.campo = function (rotulo, control, ayuda) {
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    if (control.setAttribute) control.setAttribute('id', id);
    return OB.h('div', { class: 'campo' }, OB.h('label', { for: id }, rotulo), control, ayuda ? OB.h('div', { class: 'ayuda' }, ayuda) : null);
  };
  OB.sel = function (opciones, valor, onchange, extra) {
    const s = OB.h('select', Object.assign({ onchange: (e) => onchange(e.target.value) }, extra || {}));
    s.append(OB.h('option', { value: '' }, '— elegir —'));
    opciones.forEach((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; const op = OB.h('option', { value: v }, t); if (String(v) === String(valor)) op.selected = true; s.append(op); });
    return s;
  };
  OB.num = function (valor, onchange, o) {
    o = o || {};
    return OB.h('input', Object.assign({ type: 'number', inputmode: 'decimal', value: valor == null ? '' : valor, step: o.step || 'any', min: o.min, max: o.max, onchange: (e) => { const v = e.target.value === '' ? null : parseFloat(e.target.value); onchange(v); } }, o.attrs || {}));
  };
  OB.rango = function (valor, min, max, step, onInput, fmtr) {
    const out = OB.h('output', null, fmtr ? fmtr(valor) : valor);
    const r = OB.h('input', { type: 'range', min, max, step, value: valor, oninput: (e) => { const v = parseFloat(e.target.value); out.textContent = fmtr ? fmtr(v) : v; onInput(v); } });
    return OB.h('div', { class: 'rango' }, r, out);
  };
  OB.chips = function (opciones, valor, onsel, aria) {
    const box = OB.h('div', { class: 'chips', role: 'radiogroup', 'aria-label': aria || '' });
    opciones.forEach((o) => {
      const [v, t] = Array.isArray(o) ? o : [o, o];
      box.append(OB.h('button', { type: 'button', class: 'chip' + (String(v) === String(valor) ? ' on' : ''), role: 'radio', 'aria-checked': String(v) === String(valor), onclick: () => onsel(v) }, t));
    });
    return box;
  };
  /* Estructura común de una etapa: encabezado, zona de trabajo y panel */
  OB.pantalla = function (root, o) {
    OB.vaciar(root);
    const trabajo = OB.h('div', { class: 'trabajo' });
    const panel = OB.h('aside', { class: 'panel' });
    const cab = OB.h('div', { class: 'cab-etapa' },
      OB.h('div', null, OB.h('div', { class: 'num' }, o.num), OB.h('h2', null, o.titulo)),
      OB.h('p', { class: 'lead' }, o.lead));
    const g = OB.GUIA && OB.GUIA[OB.actual];
    if (g) panel.append(OB.h('details', { class: 'card guia', open: true }, OB.h('summary', null, 'Qué hay que hacer'),
      OB.h('ol', { class: 'pasos-guia' }, g.pasos.map((t) => OB.h('li', null, t))), OB.h('p', { class: 'nota meta' }, g.meta)));
    root.append(cab, OB.h('div', { class: 'cols' + (o.una ? ' una' : '') }, trabajo, panel));
    return { trabajo, panel };
  };
  OB.card = (titulo, ...kids) => OB.h('section', { class: 'card' }, titulo ? OB.h('h3', null, titulo) : null, ...kids);
  OB.tabla = function (cols, filas, cls) {
    const t = OB.h('table', { class: 'tabla ' + (cls || '') });
    t.append(OB.h('thead', null, OB.h('tr', null, cols.map((c) => OB.h('th', null, c)))));
    t.append(OB.h('tbody', null, filas.map((f) => OB.h('tr', null, f.map((c) => OB.h('td', null, c))))));
    return OB.h('div', { class: 'tabla-w' }, t);
  };

  /* Colores por circuito */
  OB.COL_C = { C1: '#C98200', C2: '#2557B8', C3: '#7B54C4', C4: '#C8312A', C5: '#D9731A', C6: '#2F7D4A', C7: '#B5367F', C8: '#0F8B8D', C9: '#6B7175' };
})();
