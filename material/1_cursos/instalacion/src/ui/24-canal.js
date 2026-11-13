/* ===================================================================
   ui/24-canal.js — Etapa 5: canalizaciones y cajas
   Material y diámetro del tubo por circuito, nivel de instalación
   (losa o contrapiso), ocupación máxima, cruces con vigas y columnas
   y volumen de las cajas según el artículo 314.16.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N, R = L.R;

  OB.etapas.canal = function (root) {
    const E = OB.E;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 5', titulo: 'Canalizaciones y cajas',
      lead: 'Los conductores van dentro de tubos y los empalmes dentro de cajas. Escoja el material, el diámetro y el nivel de cada circuito: el tubo no se puede llenar de cables, no cabe cualquier diámetro en una losa de 12 cm, no debe atravesar vigas cerca de las columnas y cada caja necesita volumen para sus conductores.'
    });
    let visibles = new Set(E.circuitos.map((c) => c.id));
    let resalta = null;
    const wrap = OB.h('div');
    const leyenda = OB.h('div', { class: 'leyenda' });
    const tabla = OB.h('div'), cajas = OB.h('div'), inter = OB.h('div');

    const pl = new OB.Planta(wrap, {
      E, capas: { canal: true, ids: false, nombres: false, muebles: false }, aria: 'Planta con el recorrido de las canalizaciones por circuito',
      filtroC: visibles,
      marca: (p) => { const m = (pl._malas || []).find((x) => x.id === p.id); return m ? 'falla' : null; },
      onPick: () => {}
    });
    pl.extra = (svg, self, casa) => {
      const g = OB.s('g', null, svg);
      const inter = (pl._inter || []);
      inter.forEach((x) => {
        if (x.x == null || (x.tipo === 'cim' && !x.critico)) return;
        if (x.tipo === 'caja') return;
        const c = OB.s('circle', { cx: x.x, cy: -x.y, r: 0.22, fill: 'none', stroke: x.critico ? 'var(--bad)' : 'var(--warn)', 'stroke-width': 0.06 }, g);
        OB.s('title', null, c, x.texto);
      });
    };
    const refrescarLeyenda = () => {
      OB.vaciar(leyenda);
      E.circuitos.forEach((c) => leyenda.append(OB.h('label', null, OB.h('input', { type: 'checkbox', checked: visibles.has(c.id) ? true : null, onchange: (e) => { if (e.target.checked) visibles.add(c.id); else visibles.delete(c.id); pl.filtroC = visibles; pl.render(); } }), OB.h('i', { class: 'dot', style: { background: OB.COL_C[c.id], margin: 0 } }), c.id)));
    };
    trabajo.append(OB.card('Recorrido de las canalizaciones', wrap, leyenda, OB.h('p', { class: 'ayuda' }, 'Línea continua: tubo en la losa. Línea punteada: tubo en el contrapiso. Un anillo marca un cruce con una viga (naranja: por coordinar; rojo: zona de confinamiento, no se permite). El grosor refleja el número de conductores del tramo.')));

    const TUBOS = ['1/2', '3/4', '1', '1 1/4'];
    function pintaTabla() {
      OB.vaciar(tabla);
      const casa = O.casaDe(E), tr = R.tramos(casa);
      const mat = E.canal.mat;
      const filas = E.circuitos.map((c) => {
        let peor = null;
        const trc = tr.filter((t) => t.c === c.id);
        for (const t of trc) { const ll = C.llenado(t.calibres, mat, c.tubo || '1/2'); if (!peor || ll.pct > peor.pct) peor = { pct: ll.pct, n: ll.n, ok: ll.ok, lim: 100 * ll.lim, min: ll.minimo }; }
        const Ltot = trc.reduce((s, t) => s + t.L, 0);
        const barra = OB.h('div', { class: 'barra-i', style: { minWidth: '70px' } }, OB.h('b', { class: peor.ok ? (peor.pct > peor.lim * 0.85 ? 'warn' : '') : 'bad', style: { width: Math.min(100, (peor.pct / peor.lim) * 100) + '%' } }));
        return [
          OB.h('span', null, OB.h('i', { class: 'dot', style: { background: OB.COL_C[c.id] } }), c.id),
          OB.sel([['losa', 'Losa'], ['piso', 'Contrapiso']], c.nivel, (v) => { c.nivel = v || null; OB.cambio('canal'); }),
          OB.sel(TUBOS.map((x) => [x, x + ' in']), c.tubo, (v) => { c.tubo = v || null; OB.cambio('canal'); }),
          OB.h('span', { class: 'mono' }, String(peor.n)),
          OB.h('div', null, OB.h('span', { class: 'mono' }, c.tubo ? OB.fmt(peor.pct, 0) + ' % de ' + OB.fmt(peor.lim, 0) + ' %' : '—'), barra),
          OB.h('span', { class: 'mono' }, OB.fmt(Ltot, 0) + ' m')
        ];
      });
      tabla.append(OB.h('div', { class: 'fila', style: { marginBottom: '8px' } }, OB.h('span', { class: 'lbl' }, 'Material del tubo'), OB.chips([['PVC', 'PVC Schedule 40 (art. 352)'], ['EMT', 'Metálico EMT (art. 358)']], E.canal.mat, (v) => { E.canal.mat = v; OB.cambio('canal'); }, 'Material')));
      tabla.append(OB.tabla(['Circ.', 'Nivel', 'Tubo', 'Cond.', 'Ocupación del tramo más lleno', 'Longitud'], filas, 'compacta'));
      const esp = N.TUBOS[mat].find((x) => x.d === '1 1/4');
      tabla.append(OB.h('p', { class: 'ayuda' }, `En la losa maciza de 12 cm el diámetro exterior del tubo no puede pasar de e/3 = 40 mm (NSR-10 C.6.3): el de 1 1/4 in (${OB.fmt(esp.de, 1)} mm) no cabe. Ocupación máxima: 53 % con un conductor, 31 % con dos y 40 % con más de dos.`));
    }
    function pintaCajas() {
      OB.vaciar(cajas);
      const casa = O.casaDe(E), tr = R.tramos(casa);
      const grupos = [['lum', 'Luminarias y apliques'], ['apar', 'Interruptores y tomacorrientes'], ['esp', 'Ducha y estufa']];
      grupos.forEach(([g, t]) => {
        cajas.append(OB.campo(t, OB.sel(O.CAJAS_GRUPO[g].map((k) => { const c = N.CAJAS.find((x) => x.id === k); return [k, c.nombre.split(' (')[0] + ' · ' + OB.fmt(c.vol, 0) + ' cm³']; }), E.canal.cajas[g], (v) => { E.canal.cajas[g] = v || null; E.canal.nodo = {}; OB.cambio('canal'); })));
      });
      if (grupos.every(([g]) => E.canal.cajas[g])) {
        const malas = O.cajasMalas(E, casa, tr);
        pl._malas = malas;
        if (malas.length) {
          cajas.append(OB.h('div', { class: 'aviso-box bad' }, `${malas.length} caja(s) sin el volumen necesario. Por cada conductor que llega, cada aparato (cuenta doble) y la tierra (cuenta una vez) se suma el volumen de su calibre.`));
          cajas.append(OB.tabla(['Punto', 'Cond.', 'Necesita', 'Tiene', ''], malas.map((m) => [m.id, OB.h('span', { class: 'mono' }, String(m.conds)), OB.h('span', { class: 'mono' }, OB.fmt(m.req, 0) + ' cm³'), OB.h('span', { class: 'mono' }, OB.fmt(m.caja.vol, 0) + ' cm³'),
            m.min ? OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { E.canal.nodo[m.id] = m.min.id; OB.cambio('canal'); } }, 'Subir a ' + m.min.nombre.split(' (')[0].replace('Cuadrada ', '□ ')) : OB.h('span', { class: 'ayuda' }, 'sin caja que alcance')]), 'compacta'));
        } else cajas.append(OB.h('div', { class: 'aviso-box ok' }, 'Todas las cajas tienen volumen suficiente.'));
      } else { pl._malas = []; cajas.append(OB.h('p', { class: 'nota' }, 'Escoja una caja para cada grupo y se verifican los puntos uno por uno.')); }
      const nodo = Object.keys(E.canal.nodo).length;
      if (nodo) cajas.append(OB.h('p', { class: 'ayuda' }, `${nodo} punto(s) con una caja distinta a la de su grupo.`), OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { E.canal.nodo = {}; OB.cambio('canal'); } }, 'Quitar los cambios por punto'));
    }
    function pintaInter() {
      OB.vaciar(inter);
      const casa = O.casaDe(E);
      const lista = R.interferencias(casa);
      pl._inter = lista;
      const crit = lista.filter((x) => x.critico), otras = lista.filter((x) => !x.critico && x.tipo !== 'caja');
      if (!crit.length && !otras.length) { inter.append(OB.h('p', { class: 'nota' }, 'Sin cruces con la estructura.')); return; }
      inter.append(OB.h('ul', { class: 'items' }, [...crit, ...otras].slice(0, 12).map((x) => OB.h('li', { class: 'it ' + (x.critico ? 'falla' : 'aviso') }, OB.h('span', { class: 'ico' }, x.critico ? '✕' : '!'), OB.h('div', null, OB.h('div', { class: 'txt' }, x.texto), OB.h('div', { class: 'ref' }, `${x.c || ''} ${x.viga || x.col || ''}`))))));
      inter.append(OB.h('p', { class: 'ayuda' }, 'Cambie el nivel de un circuito entre losa y contrapiso y vea cómo cambian los cruces.'));
    }
    panel.append(OB.card('Tubos por circuito', tabla), OB.card('Cajas de salida y de paso (314.16)', cajas), OB.card('Cruces con la estructura', inter), OB.revision('canal'));
    OB.subs.push((q) => { if (q === 'tema') return; pintaTabla(); pintaInter(); pintaCajas(); pl.render(); });
    refrescarLeyenda(); pintaTabla(); pintaInter(); pintaCajas(); pl.render();
  };
})();
