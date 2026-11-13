/* ===================================================================
   ui/22-tierra.js — Etapa 3: puesta a tierra
   Medición de resistividad por Wenner, diseño del arreglo de
   electrodos sobre el antejardín (arrastrables), resistencia por
   Dwight con interacción entre electrodos y medición final con
   telurómetro por caída de potencial.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N;
  const YARD = { x0: -1.3, x1: 9.3, y0: -6.3, y1: -0.45 };

  OB.etapas.tierra = function (root) {
    const E = OB.E, t = E.tierra;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 3', titulo: 'Puesta a tierra',
      lead: 'La tierra es la referencia de seguridad de toda la instalación. Mida cómo conduce el suelo del lote, diseñe los electrodos para quedar por debajo de 25 Ω incluso en verano y compruebe la obra con el telurómetro.'
    });
    let tool = 'mover', sel = -1;
    const wrap = OB.h('div');
    const informe = OB.h('div'), wen = OB.h('div'), diseno = OB.h('div'), telu = OB.h('div');
    let influencia = true;

    const pl = new OB.Planta(wrap, {
      E, bounds: [-1.9, -7.4, 9.9, 3.2], capas: { ejes: false, estr: false, muebles: false, nombres: false, ilum: false, ctrl: false, tomas: false, esp: false },
      aria: 'Antejardín del lote con los electrodos de puesta a tierra',
      onBg: (q) => {
        if (tool !== 'agregar') return;
        if (q.x < YARD.x0 || q.x > YARD.x1 || q.y < YARD.y0 || q.y > YARD.y1) { OB.toast('Coloque el electrodo dentro del antejardín', 'bad'); return; }
        if (t.rods.length >= 8) { OB.toast('Máximo ocho electrodos', 'bad'); return; }
        t.rods.push({ x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 });
        sel = t.rods.length - 1; OB.cambio('tierra');
      },
      onMove: (id, q, fin) => {
        const r = t.rods[+id];
        if (!r || tool === 'agregar') return;
        r.x = Math.max(YARD.x0, Math.min(YARD.x1, Math.round(q.x * 20) / 20)); r.y = Math.max(YARD.y0, Math.min(YARD.y1, Math.round(q.y * 20) / 20));
        sel = +id;
        if (fin) OB.cambio('tierra'); else { pl.render(); pintaInforme(); }
      }
    });
    pl.extra = (svg, self) => {
      OB.s('rect', { x: YARD.x0 - 0.2, y: 0.075, width: YARD.x1 - YARD.x0 + 0.4, height: 5.75, class: 'pl-pasto' }, svg);
      OB.s('rect', { x: -1.9, y: 6.4, width: 11.8, height: 0.9, class: 'pl-calle' }, svg);
      OB.s('rect', { x: -1.9, y: 5.82, width: 11.8, height: 0.58, class: 'pl-anden' }, svg);
      OB.s('text', { x: 4, y: 6.9, class: 'pl-txt amb' }, svg, 'Andén y calle');
      OB.s('text', { x: 4, y: 3.5, class: 'pl-txt amb' }, svg, 'Antejardín: zona de electrodos');
      const g = OB.s('g', null, svg);
      // medidor y barra
      OB.s('rect', { x: 0.3, y: 0.05, width: 0.4, height: 0.25, fill: 'var(--ink)' }, g);
      OB.s('text', { x: 0.5, y: 0.5, class: 'pl-txt peq', 'text-anchor': 'middle' }, g, 'medidor');
      const rods = t.rods;
      if (influencia) rods.forEach((r) => OB.s('circle', { cx: r.x, cy: -r.y, r: t.L, fill: 'var(--ok)', opacity: 0.1, stroke: 'var(--ok)', 'stroke-width': 0.02, 'stroke-dasharray': '.1 .1', 'pointer-events': 'none' }, g));
      if (rods.length) {
        const pts = [[0.5, 0.2], ...rods.map((r) => [r.x, -r.y])].map((p) => p.join(',')).join(' ');
        OB.s('polyline', { points: pts, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 0.05, 'stroke-dasharray': '.15 .08', 'pointer-events': 'none' }, g);
        for (let i = 1; i < rods.length; i++) {
          const a = rods[i - 1], b = rods[i];
          OB.s('text', { x: (a.x + b.x) / 2, y: -(a.y + b.y) / 2 - 0.15, class: 'pl-txt peq', 'text-anchor': 'middle', fill: 'var(--ink)' }, g, OB.fmt(C.dist([a.x, a.y], [b.x, b.y]), 1) + ' m');
        }
      }
      rods.forEach((r, i) => {
        const e = OB.s('g', { class: 'pl-mov', 'data-arrastrable': String(i), 'data-clic': 1, onclick: () => {
          if (tool === 'quitar') { t.rods.splice(i, 1); sel = -1; OB.cambio('tierra'); } else { sel = i; OB.cambio('tierra'); }
        } }, g);
        OB.s('circle', { cx: r.x, cy: -r.y, r: 0.28, fill: 'transparent' }, e);
        OB.s('circle', { cx: r.x, cy: -r.y, r: 0.13, fill: i === sel ? 'var(--accent)' : 'var(--ok)', stroke: 'var(--ink)', 'stroke-width': 0.03 }, e);
        if (t.caja) OB.s('rect', { x: r.x - 0.2, y: -r.y - 0.2, width: 0.4, height: 0.4, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 0.025 }, e);
        OB.s('text', { x: r.x + 0.2, y: -r.y - 0.2, class: 'pl-txt peq', fill: 'var(--ink)' }, e, 'E' + (i + 1));
      });
    };
    pl.arrastrables = true;
    trabajo.append(OB.card('Antejardín · electrodos', wrap, OB.h('p', { class: 'ayuda' }, 'Arrastre cada electrodo para cambiar su posición. El círculo verde es el radio de influencia: si dos círculos se solapan, los electrodos se estorban entre sí.')));

    /* ---------- Informe de resistencia ---------- */
    function pintaInforme() {
      const info = O.tierraInfo(E);
      OB.vaciar(informe);
      const R = info.R;
      const cls = R == null ? '' : R <= 25 ? 'ok' : 'bad';
      informe.append(OB.h('div', { class: 'kpis' },
        OB.h('div', { class: 'kpi ' + cls }, OB.h('b', null, R == null ? '—' : OB.fmt(R, 1) + ' Ω'), OB.h('span', null, 'resistencia real (' + (E.seco ? 'seca' : 'húmeda') + ')')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, info.Rest == null ? '—' : OB.fmt(info.Rest, 1) + ' Ω'), OB.h('span', null, 'con su ρ de diseño')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, String(info.n)), OB.h('span', null, 'electrodos')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, isFinite(info.sepMin) ? OB.fmt(info.sepMin, 1) + ' m' : '—'), OB.h('span', null, 'separación mínima'))));
      if (R != null) informe.append(OB.h('div', { class: 'barra-i', style: { marginTop: '8px' }, title: 'Límite de 25 Ω' }, OB.h('b', { class: R <= 25 ? (R > 20 ? 'warn' : '') : 'bad', style: { width: Math.min(100, (R / 50) * 100) + '%' } })),
        OB.h('div', { class: 'ayuda' }, 'La barra llega al 50 % en 25 Ω, el límite para el neutro de la acometida en baja tensión.'));
    }

    /* ---------- Wenner ---------- */
    let aW = 2;
    function pintaWenner() {
      OB.vaciar(wen);
      const lote = N.LOTES[E.lote];
      wen.append(OB.h('p', { class: 'nota' }, `${lote.nombre}. Cuatro piquetas en línea con separación a; el instrumento inyecta corriente por las externas y mide tensión en las internas: ρ = 2π·a·R.`));
      wen.append(OB.campo('Separación a entre piquetas', OB.chips([1, 2, 3, 4, 6, 8, 12, 16].map((x) => [x, x + ' m']), aW, (v) => { aW = +v; pintaWenner(); }, 'Separación'), 'A mayor separación, más profundo mide.'));
      wen.append(OB.h('button', { class: 'btn peq', type: 'button', onclick: () => {
        const ruido = 1 + 0.035 * Math.sin(aW * 12.9898 + (E.lote.charCodeAt(0) || 0));
        const rho = O.rhoAp(E, aW) * ruido;
        t.wenner = t.wenner.filter((m) => m.a !== aW).concat([{ a: aW, rho }]).sort((p, q) => p.a - q.a);
        OB.cambio('tierra'); pintaWenner();
      } }, 'Medir con a = ' + aW + ' m'));
      if (t.wenner.length) {
        wen.append(OB.tabla(['a (m)', 'R (Ω)', 'ρ aparente (Ω·m)'], t.wenner.map((m) => [OB.h('span', { class: 'mono' }, OB.fmt(m.a, 0)), OB.h('span', { class: 'mono' }, OB.fmt(m.rho / (2 * Math.PI * m.a), 2)), OB.h('span', { class: 'mono' }, OB.fmt(m.rho, 0))])));
        const rmax = Math.max(...t.wenner.map((m) => m.rho)) * 1.15;
        wen.append(OB.grafica({ w: 440, h: 200, xmin: 0, xmax: 17, ymin: 0, ymax: Math.ceil(rmax / 50) * 50, xlabel: 'Separación a (m)', ylabel: 'ρ aparente (Ω·m)', series: [{ pts: t.wenner.map((m) => [m.a, m.rho]) }], puntos: t.wenner.map((m) => ({ x: m.a, y: m.rho, title: `a = ${m.a} m, ρ = ${OB.fmt(m.rho, 0)} Ω·m` })), aria: 'Resistividad aparente en función de la separación' }));
      }
      wen.append(OB.campo('Resistividad de diseño ρ (Ω·m)', OB.num(t.rho == null ? null : Math.round(t.rho), (v) => { t.rho = v; OB.cambio('tierra'); }, { min: 1 }), 'Tome la lectura cuya separación sea cercana a la longitud del electrodo: es el suelo que lo rodea.'));
      wen.append(OB.campo('Época del año', OB.chips([[1, 'Seca (la más desfavorable)'], [0, 'Húmeda']], E.seco ? 1 : 0, (v) => { E.seco = !!+v; t.wenner = []; t.medido = null; OB.cambio('tierra'); pintaWenner(); }, 'Época'), 'Cambiar la época borra las mediciones: el suelo es otro.'));
    }

    /* ---------- Diseño ---------- */
    function pintaDiseno() {
      OB.vaciar(diseno);
      const a = E.acom;
      diseno.append(OB.campo('Electrodo', OB.sel(N.ELECTRODOS.map((e) => [e.id, e.nombre]), t.el, (v) => { t.el = v || null; OB.cambio('tierra'); })));
      diseno.append(OB.campo('Longitud del electrodo', OB.chips([1.8, 2.4, 3.0].map((x) => [x, OB.fmt(x, 1) + ' m']), t.L, (v) => { t.L = +v; OB.cambio('tierra'); pintaDiseno(); }, 'Longitud'), 'El RETIE exige 2,4 m como mínimo.'));
      diseno.append(OB.h('div', { class: 'fila' },
        OB.chips([['agregar', 'Agregar electrodo'], ['mover', 'Mover'], ['quitar', 'Quitar']], tool, (v) => { tool = v; pintaDiseno(); }, 'Herramienta'),
        OB.h('label', { class: 'leyenda' }, OB.h('input', { type: 'checkbox', checked: influencia ? true : null, onchange: (e) => { influencia = e.target.checked; pl.render(); } }), 'Radio de influencia')));
      diseno.append(OB.campo('Conductor al electrodo (cobre)', OB.chips(['10', '8', '6', '4'].map((x) => [x, x + ' AWG']), t.awg, (v) => { t.awg = v; OB.cambio('tierra'); pintaDiseno(); }, 'Conductor'), a.awg ? `Tabla 250.66: para una acometida de ${a.awg} AWG, mínimo ${N.gec(a.awg)} AWG.` : 'Defina primero la acometida (etapa 2).'));
      diseno.append(OB.campo('Unión conductor–electrodo', OB.sel(N.CONEXIONES_TIERRA.map((e) => [e.id, e.nombre]), t.con, (v) => { t.con = v || null; OB.cambio('tierra'); })));
      diseno.append(OB.h('label', { class: 'leyenda' }, OB.h('input', { type: 'checkbox', checked: t.caja ? true : null, onchange: (e) => { t.caja = e.target.checked; OB.cambio('tierra'); } }), 'Caja de inspección de 0,30 m sobre el electrodo'));
    }

    /* ---------- Telurómetro ---------- */
    let D = 40, xp = 62;
    function pintaTelu() {
      OB.vaciar(telu);
      const info = O.tierraInfo(E);
      if (info.R == null) { telu.append(OB.h('p', { class: 'nota' }, 'Coloque electrodos y escoja su tipo para poder medir.')); return; }
      telu.append(OB.h('p', { class: 'nota' }, 'Método de caída de potencial: la sonda de corriente C se clava a D metros del electrodo; la sonda de tensión P se desplaza entre ambos. La lectura se estabiliza en una meseta; el valor verdadero está al 62 % de D.'));
      telu.append(OB.campo('Distancia a la sonda de corriente D', OB.rango(D, 20, 80, 5, (v) => { D = v; pintaTelu(); }, (v) => v + ' m')));
      telu.append(OB.campo('Posición de la sonda de tensión P', OB.rango(xp, 5, 95, 1, (v) => { xp = v; pintaTelu(); }, (v) => v + ' % de D (' + OB.fmt(v * D / 100, 1) + ' m)')));
      const pts = [];
      for (let p = 5; p <= 95; p += 2) pts.push([p, C.caidaPotencial(p * D / 100, D, info.rhoVerd, info.R)]);
      const lect = C.caidaPotencial(xp * D / 100, D, info.rhoVerd, info.R) * (1 + 0.012 * Math.sin(xp * 3.1));
      telu.append(OB.grafica({ w: 440, h: 210, xmin: 0, xmax: 100, ymin: 0, ymax: Math.max(40, Math.ceil(info.R * 1.6 / 10) * 10), xlabel: 'Posición de P (% de D)', ylabel: 'R leída (Ω)', series: [{ pts }], vlines: [{ x: 62, label: '62 %' }], hlines: [{ y: 25, label: '25 Ω', color: 'var(--bad)' }], puntos: [{ x: xp, y: lect, r: 6, color: 'var(--accent)', title: 'Lectura actual' }], aria: 'Curva de caída de potencial' }));
      telu.append(OB.h('div', { class: 'fila sep' },
        OB.h('span', null, 'Lectura: ', OB.h('strong', { class: 'mono' }, OB.fmt(lect, 1) + ' Ω')),
        OB.h('button', { class: 'btn primario peq', type: 'button', onclick: () => { t.medido = lect; OB.cambio('tierra'); OB.toast('Lectura registrada: ' + OB.fmt(lect, 1) + ' Ω'); } }, 'Registrar esta lectura')));
      if (t.medido != null) telu.append(OB.h('p', { class: 'nota' }, 'Lectura registrada: ', OB.h('strong', { class: 'mono' }, OB.fmt(t.medido, 1) + ' Ω'), '.'));
    }

    panel.append(OB.card('Resultado', informe), OB.card('1 · Resistividad del suelo (Wenner)', wen), OB.card('2 · Electrodos y conexión', diseno), OB.card('3 · Medición con telurómetro', telu), OB.revision('tierra'));
    OB.subs.push((q) => { if (q === 'tema') return; pl.render(); pintaInforme(); pintaTelu(); });
    pl.render(); pintaInforme(); pintaWenner(); pintaDiseno(); pintaTelu();
  };
})();
