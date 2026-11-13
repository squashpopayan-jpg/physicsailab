/* ===================================================================
   ui/26-cableado.js — Etapa 7: colores y cableado
   Banco de cableado: se dibuja cada conductor entre bornes (arrastrando
   o con dos toques), se le asigna un color y se prueba el montaje:
   interruptores que se accionan, lámpara, ducha, estufa y fuga a
   tierra en el GFCI. Cuestionario del código de colores.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N;
  const HEX = {}; N.COLORES_LISTA.forEach(([k, , h]) => { HEX[k] = h; });
  const TOR = { bronce: '#C9A227', plata: '#BFC5C9', verde: '#2F8F4A', negro: '#2B2B2B' };

  OB.etapas.cableado = function (root) {
    const E = OB.E;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 7', titulo: 'Colores y cableado', una: true,
      lead: 'Cada conductor tiene un color por su función: fase negro o rojo, neutro blanco, tierra verde o desnudo. Una cada borne con su par arrastrando de uno a otro (o tocando dos bornes seguidos), elija el color del cable y pruebe el montaje accionando los interruptores.'
    });
    let actual = O.EJ[0].id, color = 'negro', desde = null, ver = false, mensajeGfci = null;
    const fig = OB.h('div', { class: 'banco-w' }), info = OB.h('div'), tabs = OB.h('div', { class: 'chips', role: 'tablist' }), pal = OB.h('div'), quiz = OB.h('div');
    const est = (id) => (E.cableado[id] = E.cableado[id] || { cables: [], pos: {} });

    function dibuja() {
      const ej = O.ejPorId(actual), s = est(ej.id);
      OB.vaciar(fig);
      const svg = OB.s('svg', { viewBox: '0 0 800 380', class: 'svg-banco ancho-min', role: 'group', 'aria-label': ej.titulo });
      const T = {}; ej.term.forEach((t) => { T[t.id] = t; });
      ej.cajas.forEach((b) => {
        OB.s('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: 'caja' }, svg);
        OB.s('text', { x: b.x + b.w / 2, y: b.y + 18, 'text-anchor': 'middle', class: 'cajatit', 'font-size': 13 }, svg, b.n);
      });
      const an = O.simulaEj(ej, s.cables, s.pos);
      // aparatos internos
      (ej.interruptores || []).forEach((sw) => {
        const p = s.pos[sw.id] || 0;
        const g = OB.s('g', { style: 'cursor:pointer', 'data-clic': 1, tabindex: 0, role: 'button', 'aria-label': 'Accionar ' + sw.nombre, onclick: () => { s.pos[sw.id] = p ? 0 : 1; OB.cambio('cable'); }, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { s.pos[sw.id] = p ? 0 : 1; OB.cambio('cable'); } } }, svg);
        if (sw.tipo === 'spst') {
          const a = T[sw.t[0]], b = T[sw.t[1]];
          OB.s('rect', { x: a.x + 10, y: a.y - 16, width: b.x - a.x - 20, height: 32, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--rule-2)' }, g);
          OB.s('line', { x1: a.x + 20, y1: a.y, x2: p ? b.x - 20 : b.x - 40, y2: p ? b.y : b.y - 22, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
          OB.s('text', { x: (a.x + b.x) / 2, y: a.y + 34, 'text-anchor': 'middle', 'font-size': 12.5 }, g, sw.nombre + (p ? ': cerrado' : ': abierto'));
        } else {
          const c = T[sw.c], t1 = T[sw.t1], t2 = T[sw.t2], tt = p ? t2 : t1;
          const lado = c.x < tt.x ? 1 : -1;
          OB.s('rect', { x: Math.min(c.x, tt.x) + (lado > 0 ? 8 : 8), y: t1.y - 14, width: Math.abs(c.x - tt.x) - 16, height: t2.y - t1.y + 28, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--rule-2)' }, g);
          OB.s('line', { x1: c.x + lado * 14, y1: c.y, x2: tt.x - lado * 14, y2: tt.y, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
          OB.s('text', { x: (c.x + tt.x) / 2, y: t2.y + 38, 'text-anchor': 'middle', 'font-size': 12.5 }, g, sw.nombre + ' · posición ' + (p ? 'B' : 'A'));
        }
      });
      (ej.gfci || []).forEach((g0) => {
        const g = OB.s('g', null, svg);
        OB.s('rect', { x: g0.x - 38, y: g0.y - 14, width: 76, height: 40, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--accent)', 'stroke-width': 2 }, g);
        OB.s('text', { x: g0.x, y: g0.y + 6, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: 'var(--accent)' }, g, 'GFCI');
        OB.s('text', { x: g0.x, y: g0.y + 21, 'text-anchor': 'middle', 'font-size': 10.5 }, g, 'TEST · RESET');
      });
      (ej.cargas || []).forEach((c) => {
        const on = an.cargas[c.id].on, g = OB.s('g', { class: on ? 'lampara-on' : '' }, svg);
        if (c.tipo === 'lampara') {
          OB.s('circle', { cx: c.x, cy: c.y + 40, r: 26, fill: on ? '#FFD34D' : 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }, g);
          OB.s('path', { d: `M${c.x - 14} ${c.y + 26}L${c.x + 14} ${c.y + 54}M${c.x + 14} ${c.y + 26}L${c.x - 14} ${c.y + 54}`, stroke: 'var(--ink-2)', 'stroke-width': 2, fill: 'none' }, g);
        } else if (c.tipo === 'ducha') {
          OB.s('path', { d: `M${c.x - 30} ${c.y + 20}h60l-10 20h-40z`, fill: on ? '#7FC4F0' : 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }, g);
          for (let i = -2; i <= 2; i++) OB.s('line', { x1: c.x + i * 9, y1: c.y + 48, x2: c.x + i * 12, y2: c.y + 70, stroke: on ? '#5AA9E0' : 'var(--rule-2)', 'stroke-width': 2.5 }, g);
        } else if (c.tipo === 'estufa') {
          OB.s('rect', { x: c.x - 44, y: c.y + 6, width: 88, height: 40, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }, g);
          [-26, 0, 26].forEach((dx) => OB.s('circle', { cx: c.x + dx, cy: c.y + 26, r: 10, fill: on ? '#E8431F' : 'var(--rule-2)' }, g));
        } else {
          OB.s('circle', { cx: c.x, cy: c.y + 22, r: 9, fill: on ? '#FFD34D' : 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 2 }, g);
        }
        OB.s('text', { x: c.x, y: c.y + 92, 'text-anchor': 'middle', 'font-size': 12.5 }, svg, c.nombre + (on ? ' · ' + an.cargas[c.id].V + ' V' : ' · apagado'));
      });
      // cables
      const path = (a, b) => { const dx = Math.max(40, Math.abs(b.x - a.x) * 0.4) * (b.x >= a.x ? 1 : -1); return `M${a.x} ${a.y} C${a.x + dx} ${a.y},${b.x - dx} ${b.y},${b.x} ${b.y}`; };
      s.cables.forEach((w, i) => {
        const g = OB.s('g', { style: 'cursor:pointer', 'data-clic': 1, role: 'button', 'aria-label': 'Quitar este conductor', onclick: () => { s.cables.splice(i, 1); OB.cambio('cable'); } }, svg);
        OB.s('path', { d: path(T[w.a], T[w.b]), class: 'cable-borde' }, g);
        OB.s('path', { d: path(T[w.a], T[w.b]), class: 'cable', stroke: HEX[w.color] || '#888' }, g);
        OB.s('title', null, g, `${T[w.a].nombre} → ${T[w.b].nombre} (${w.color}). Toque para quitarlo.`);
      });
      const fantasma = OB.s('path', { class: 'cable-fantasma', d: '' }, svg);
      // bornes
      ej.term.forEach((t) => {
        const b = ej.cajas.find((q) => q.id === t.caja);
        const izq = t.x <= b.x + 1;
        const g = OB.s('g', { 'data-term': t.id, tabindex: 0, role: 'button', 'aria-label': t.nombre, style: 'cursor:crosshair' }, svg);
        OB.s('circle', { cx: t.x, cy: t.y, r: 11, fill: 'transparent' }, g);
        OB.s('circle', { cx: t.x, cy: t.y, r: 7, class: 'term', fill: TOR[t.tor] || '#888', stroke: desde === t.id ? 'var(--accent)' : 'var(--ink)', 'stroke-width': desde === t.id ? 4 : 2 }, g);
        OB.s('text', { x: t.x + (izq ? 13 : -13), y: t.y - 14, 'text-anchor': izq ? 'start' : 'end', class: 'term-t', 'font-size': 12 }, g, t.nombre);
      });
      // eventos de arrastre
      const pos = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return q; };
      const termEn = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); const g = el && el.closest ? el.closest('[data-term]') : null; return g ? g.dataset.term : null; };
      let arr = null;
      const unir = (a, b) => {
        if (a === b) return;
        if (s.cables.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { OB.toast('Esos dos bornes ya están unidos', 'bad'); return; }
        s.cables.push({ a, b, color });
        OB.cambio('cable');
      };
      svg.addEventListener('pointerdown', (e) => { const t = termEn(e); if (!t) return; arr = { t, mov: false, x: e.clientX, y: e.clientY }; });
      svg.addEventListener('pointermove', (e) => {
        if (desde || arr) {
          const o = T[desde || arr.t]; const q = pos(e);
          if (arr && Math.abs(e.clientX - arr.x) + Math.abs(e.clientY - arr.y) > 6) arr.mov = true;
          if (arr && arr.mov || desde) fantasma.setAttribute('d', path(o, { x: q.x, y: q.y }));
        }
      });
      svg.addEventListener('pointerup', (e) => {
        const t = termEn(e);
        if (arr) {
          const a = arr; arr = null;
          if (a.mov) { if (t && t !== a.t) unir(a.t, t); desde = null; dibuja(); return; }
          // toque simple: modo dos toques
          if (!desde) { desde = a.t; dibuja(); return; }
          if (desde === a.t) { desde = null; dibuja(); return; }
          const d = desde; desde = null; unir(d, a.t);
        }
      });
      fig.append(svg);
    }

    function pintaTabs() {
      OB.vaciar(tabs);
      O.EJ.forEach((ej) => {
        const s = E.cableado[ej.id];
        let est2 = 'pend';
        if (s && s.cables && s.cables.length) est2 = O.verificaEj(ej, s.cables).ok ? 'ok' : 'falla';
        tabs.append(OB.h('button', { type: 'button', role: 'tab', 'aria-selected': ej.id === actual, class: 'chip' + (ej.id === actual ? ' on' : ''), onclick: () => { actual = ej.id; desde = null; mensajeGfci = null; ver = false; todo(); } },
          OB.h('i', { class: 'dot', style: { background: est2 === 'ok' ? 'var(--ok)' : est2 === 'falla' ? 'var(--bad)' : 'var(--rule-2)', margin: '0 6px 0 0' } }), ej.titulo));
      });
    }
    function pintaPaleta() {
      OB.vaciar(pal);
      pal.append(OB.h('div', { class: 'lbl' }, 'Color del conductor que va a dibujar'));
      const p = OB.h('div', { class: 'paleta' });
      N.COLORES_LISTA.forEach(([k, nom, hex]) => p.append(OB.h('button', { type: 'button', class: 'carrete' + (color === k ? ' on' : ''), 'aria-pressed': color === k, onclick: () => { color = k; pintaPaleta(); } }, OB.h('i', { style: { background: hex } }), nom)));
      pal.append(p);
    }
    function pintaInfo() {
      OB.vaciar(info);
      const ej = O.ejPorId(actual), s = est(ej.id);
      info.append(OB.h('div', { class: 'fila sep' }, OB.h('strong', null, ej.titulo), OB.h('span', { class: 'pill' }, ej.ref)), OB.h('p', { class: 'nota' }, ej.intro));
      const v = O.verificaEj(ej, s.cables);
      const mostrar = OB.E.modo === 'guiado' || ver;
      info.append(OB.h('div', { class: 'fila' },
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { s.cables = []; OB.cambio('cable'); } }, 'Quitar todos los conductores'),
        OB.E.modo === 'inspector' ? OB.h('button', { class: 'btn peq primario', type: 'button', onclick: () => { ver = true; E.cert.cableado = (E.cert.cableado || 0) + 1; OB.cambio('cable'); } }, 'Verificar el montaje') : null,
        ej.gfci ? OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { mensajeGfci = O.pruebaGFCI(ej, s.cables); pintaInfo(); } }, 'Simular una fuga en la toma común') : null));
      if (mensajeGfci && ej.gfci) info.append(OB.h('div', { class: 'aviso-box ' + (mensajeGfci.ok ? 'ok' : 'bad') }, mensajeGfci.msg));
      if (!s.cables.length) { info.append(OB.h('p', { class: 'nota' }, 'Sin conductores todavía.')); return; }
      if (!mostrar) { info.append(OB.h('p', { class: 'nota' }, `${s.cables.length} conductores dibujados. Modo inspector: verifique el montaje cuando crea que está terminado.`)); return; }
      if (v.ok) info.append(OB.h('div', { class: 'aviso-box ok' }, OB.h('strong', null, 'Montaje correcto. '), 'Las conexiones, los colores y el funcionamiento cumplen.'));
      else info.append(OB.h('ul', { class: 'items' }, v.problemas.map((p) => OB.h('li', { class: 'it ' + (p.t === 'seguridad' ? 'falla' : p.t === 'color' ? 'aviso' : 'falla') }, OB.h('span', { class: 'ico' }, p.t === 'color' ? '!' : '✕'), OB.h('div', null, OB.h('div', { class: 'txt' }, p.msg), OB.h('div', { class: 'ref' }, p.t))))));
    }
    function pintaQuiz() {
      OB.vaciar(quiz);
      const q = E.cableado.quiz = E.cableado.quiz || { resp: [], total: null, aciertos: 0 };
      quiz.append(OB.h('p', { class: 'nota' }, 'Seis preguntas sobre la Tabla 3.5.a del Título 5 del RETIE.'));
      O.QUIZ.forEach((p, i) => {
        const orden = p.op.map((t, k) => [k, t]);
        const calificado = q.total != null;
        quiz.append(OB.h('div', { class: 'campo' }, OB.h('div', { class: 'lbl' }, (i + 1) + '. ' + p.q),
          OB.chips(orden, q.resp[i], (v) => { if (calificado) return; q.resp[i] = +v; OB.guardar(); pintaQuiz(); }, 'Pregunta ' + (i + 1)),
          calificado ? OB.h('div', { class: 'ayuda', style: { color: q.resp[i] === p.ok ? 'var(--ok)' : 'var(--bad)' } }, (q.resp[i] === p.ok ? 'Correcto. ' : 'Incorrecto. ') + p.por) : null));
      });
      quiz.append(OB.h('div', { class: 'fila' },
        q.total == null ? OB.h('button', { class: 'btn primario peq', type: 'button', disabled: q.resp.filter((x) => x != null).length < O.QUIZ.length ? true : null, onclick: () => { q.aciertos = O.QUIZ.filter((p, i) => q.resp[i] === p.ok).length; q.total = O.QUIZ.length; OB.cambio('quiz'); pintaQuiz(); } }, 'Calificar')
          : OB.h('span', null, 'Resultado: ', OB.h('strong', null, q.aciertos + ' de ' + q.total), ' ', OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { E.cableado.quiz = { resp: [], total: null, aciertos: 0 }; OB.cambio('quiz'); pintaQuiz(); } }, 'Repetir'))));
    }
    const todo = () => { pintaTabs(); pintaPaleta(); dibuja(); pintaInfo(); };
    trabajo.append(OB.card('Banco de cableado', tabs, OB.h('div', { style: { marginTop: '10px' } }, fig), OB.h('p', { class: 'ayuda' }, 'Toque un interruptor para accionarlo. Toque un conductor para quitarlo. Los bornes de latón son de fase, los plateados de neutro y los verdes de tierra.')));
    panel.append(OB.card('Color y estado del montaje', pal, OB.h('div', { style: { marginTop: '10px' } }, info)), OB.card('Código de colores (Tabla 3.5.a)', quiz), OB.revision('cableado'));
    OB.subs.push((q) => { if (q === 'tema' || q === 'quiz') return; pintaTabs(); dibuja(); pintaInfo(); });
    todo(); pintaQuiz();
  };
})();
