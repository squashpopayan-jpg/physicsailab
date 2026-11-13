/* ===================================================================
   ui/10-planta.js — Planta de la casa en SVG (metros, norte arriba)
   Capas: ejes, estructura, muros y vanos, mobiliario, nombres, puntos
   eléctricos, canalizaciones por circuito y capas que añade cada etapa
   mediante `extra`. Zoom con la rueda, arrastre para desplazar.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, L = OB.L, C = OB.C, N = OB.N;

  const CAPAS0 = { ejes: true, estr: true, muros: true, muebles: true, nombres: true, ilum: true, ctrl: true, tomas: true, esp: true, canal: false, ids: false, lote: false };

  class Planta {
    constructor(host, opt) {
      opt = opt || {};
      this.host = host;
      this.E = opt.E || OB.E;
      this.capas = Object.assign({}, CAPAS0, opt.capas || {});
      this.b = opt.bounds || [-1.7, -1.5, 9.7, 11.6];
      this.onPick = opt.onPick || null;
      this.onBg = opt.onBg || null;
      this.onMove = opt.onMove || null;
      this.marca = opt.marca || null;
      this.extra = opt.extra || null;
      this.filtroC = opt.filtroC || null;
      this.sel = null;
      this.fijo = !!opt.fijo;
      this.svg = OB.s('svg', { class: 'planta', role: 'img', 'aria-label': opt.aria || 'Planta de la vivienda', preserveAspectRatio: 'xMidYMid meet' });
      this.host.classList.add('planta-wrap');
      this.host.append(this.svg);
      this.reset();
      if (!this.fijo) { this._eventos(); this._botones(); }
      this.casa = null;
    }
    reset() {
      const [x0, y0, x1, y1] = this.b;
      this.vb = [x0, -y1, x1 - x0, y1 - y0];
      this._vb();
    }
    _vb() { this.svg.setAttribute('viewBox', this.vb.join(' ')); }
    _botones() {
      const b = OB.h('div', { class: 'zoom-btns' },
        OB.h('button', { type: 'button', title: 'Acercar', 'aria-label': 'Acercar', onclick: () => this.zoom(0.8) }, '+'),
        OB.h('button', { type: 'button', title: 'Alejar', 'aria-label': 'Alejar', onclick: () => this.zoom(1.25) }, '−'),
        OB.h('button', { type: 'button', title: 'Ver todo', 'aria-label': 'Ver todo', onclick: () => this.reset() }, '⤢'));
      this.host.append(b);
    }
    zoom(f, cx, cy) {
      const v = this.vb;
      const px = cx == null ? v[0] + v[2] / 2 : cx, py = cy == null ? v[1] + v[3] / 2 : cy;
      const w0 = this.b[2] - this.b[0];
      let w = Math.max(1.2, Math.min(w0 * 1.6, v[2] * f)), h = v[3] * (w / v[2]);
      this.vb = [px - (px - v[0]) * (w / v[2]), py - (py - v[1]) * (h / v[3]), w, h];
      this._vb();
    }
    mundo(ev) {
      const pt = this.svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const m = this.svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const q = pt.matrixTransform(m.inverse());
      return { x: q.x, y: -q.y };
    }
    _eventos() {
      const svg = this.svg;
      svg.addEventListener('wheel', (e) => { e.preventDefault(); const q = this.mundo(e); this.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, q.x, -q.y); }, { passive: false });
      let drag = null;
      svg.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        const el = e.target.closest ? e.target.closest('[data-arrastrable]') : null;
        if (el && this.onMove) drag = { tipo: 'obj', id: el.dataset.arrastrable, moved: false, sx: e.clientX, sy: e.clientY, tgt: e.target };
        else drag = { tipo: 'pan', sx: e.clientX, sy: e.clientY, vb: this.vb.slice(), moved: false, tgt: e.target };
      });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) { if (this.onHover) this.onHover(this.mundo(e), e); return; }
        if (!drag.moved) {
          if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) <= 5) return;
          drag.moved = true;
          try { svg.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ }
        }
        if (drag.tipo === 'pan') {
          const r = svg.getBoundingClientRect();
          const dx = (e.clientX - drag.sx) * (drag.vb[2] / r.width), dy = (e.clientY - drag.sy) * (drag.vb[3] / r.height);
          this.vb = [drag.vb[0] - dx, drag.vb[1] - dy, drag.vb[2], drag.vb[3]]; this._vb();
        } else this.onMove(drag.id, this.mundo(e), false, e);
      });
      svg.addEventListener('pointerup', (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        try { svg.releasePointerCapture(e.pointerId); } catch (x) { /* ya liberado */ }
        if (d.moved) { if (d.tipo === 'obj') this.onMove(d.id, this.mundo(e), true, e); return; }
        const sobre = d.tgt && d.tgt.closest ? d.tgt.closest('[data-id],[data-arrastrable],[data-clic]') : null;
        if (!sobre && this.onBg) this.onBg(this.mundo(e), e);
      });
      svg.addEventListener('pointercancel', () => { drag = null; });
    }

    render() {
      const E = this.E, svg = this.svg;
      const casa = (this.casa = L.O.casaDe(E));
      OB.vaciar(svg);
      const [x0, y0, x1, y1] = this.b;
      OB.s('rect', { x: x0 - 30, y: -y1 - 30, width: x1 - x0 + 60, height: y1 - y0 + 60, class: 'pl-fondo' }, svg);
      if (this.capas.lote) this._lote(svg);
      if (this.capas.ejes) this._ejes(svg, casa);
      OB.s('rect', { x: casa.ext[0] - 0.075, y: -(casa.ext[3] + 0.075), width: casa.ext[2] - casa.ext[0] + 0.15, height: casa.ext[3] - casa.ext[1] + 0.15, class: 'pl-piso' }, svg);
      if (this.capas.estr) this._estr(svg, casa);
      if (this.capas.muros) this._muros(svg, casa);
      if (this.capas.muebles) this._muebles(svg, casa);
      if (this.capas.nombres) this._nombres(svg, casa);
      if (this.capas.canal) this._canal(svg, casa);
      if (this.extra) this.extra(svg, this, casa);
      this._puntos(svg, casa);
      if (this.extraTop) this.extraTop(svg, this, casa);
    }
    _lote(svg) {
      OB.s('rect', { x: -1.3, y: -11.1, width: 10.6, height: 17.4, class: 'pl-lote' }, svg);
      OB.s('text', { x: -1.1, y: 6.0, class: 'pl-txt peq' }, svg, 'Lindero del lote · antejardín');
    }
    _ejes(svg, casa) {
      const g = OB.s('g', { class: 'pl-ejes' }, svg);
      casa.ejes.x.forEach((x, i) => {
        OB.s('line', { x1: x, y1: 0.8, x2: x, y2: -11.1, class: 'pl-eje' }, g);
        const c = OB.s('g', null, g); OB.s('circle', { cx: x, cy: 0.9, r: 0.22, class: 'pl-burbuja' }, c); OB.s('text', { x, y: 0.97, class: 'pl-txt eje' }, c, casa.ejes.nx[i]);
      });
      casa.ejes.y.forEach((y, j) => {
        OB.s('line', { x1: -0.8, y1: -y, x2: 8.9, y2: -y, class: 'pl-eje' }, g);
        const c = OB.s('g', null, g); OB.s('circle', { cx: -0.9, cy: -y, r: 0.22, class: 'pl-burbuja' }, c); OB.s('text', { x: -0.9, y: -y + 0.07, class: 'pl-txt eje' }, c, casa.ejes.ny[j]);
      });
    }
    _estr(svg, casa) {
      const g = OB.s('g', null, svg);
      for (const v of casa.vigas(false)) OB.s('rect', { x: v.rect[0], y: -v.rect[3], width: v.rect[2] - v.rect[0], height: v.rect[3] - v.rect[1], class: 'pl-viga' }, g);
      for (const c of casa.columnas()) OB.s('rect', { x: c.rect[0], y: -c.rect[3], width: 0.3, height: 0.3, class: 'pl-col' }, g);
    }
    _muros(svg, casa) {
      const g = OB.s('g', null, svg), T = casa.t;
      for (const m of casa.muros) {
        const len = C.dist(m.a, m.b);
        for (const [d0, d1] of casa.tramosMuro(m)) {
          let a = casa.enMuro(m, d0), b = casa.enMuro(m, d1);
          const u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len];
          if (m.ext && d0 < 1e-6) a = [a[0] - u[0] * T / 2, a[1] - u[1] * T / 2];
          if (m.ext && d1 > len - 1e-6) b = [b[0] + u[0] * T / 2, b[1] + u[1] * T / 2];
          OB.s('line', { x1: a[0], y1: -a[1], x2: b[0], y2: -b[1], class: 'pl-muro', 'stroke-width': T }, g);
        }
        for (const v of m.vanos) {
          const A = casa.enMuro(m, v.d0), B = casa.enMuro(m, v.d1);
          const w = v.d1 - v.d0;
          if (v.tipo === 'ventana') {
            OB.s('line', { x1: A[0], y1: -A[1], x2: B[0], y2: -B[1], class: 'pl-ventana', 'stroke-width': T * 0.55 }, g);
            OB.s('line', { x1: A[0], y1: -A[1], x2: B[0], y2: -B[1], class: 'pl-ventana-i', 'stroke-width': 0.025 }, g);
          } else if (v.tipo === 'puerta') {
            const un = [(B[0] - A[0]) / w, (B[1] - A[1]) / w], n = [-un[1], un[0]];
            const hinge = v.bisagra ? B : A, e = v.bisagra ? [-un[0], -un[1]] : un, nn = [n[0] * v.lado, n[1] * v.lado];
            const pts = [];
            for (let k = 0; k <= 10; k++) { const th = (Math.PI / 2) * k / 10; pts.push([hinge[0] + w * (e[0] * Math.cos(th) + nn[0] * Math.sin(th)), hinge[1] + w * (e[1] * Math.cos(th) + nn[1] * Math.sin(th))]); }
            OB.s('polyline', { points: pts.map((p) => p[0] + ',' + -p[1]).join(' '), class: 'pl-arco' }, g);
            OB.s('line', { x1: hinge[0], y1: -hinge[1], x2: pts[pts.length - 1][0], y2: -pts[pts.length - 1][1], class: 'pl-hoja' }, g);
          }
        }
      }
    }
    _muebles(svg, casa) {
      const g = OB.s('g', null, svg);
      const nombres = { meson: '', estufa: 'estufa', lavaplatos: 'lavaplatos', nevera: 'nevera', lavadero: 'lavadero', lavadora: 'lavadora', ducha: 'ducha', lavamanos: 'lav.', sanitario: 'inod.', cama: 'cama', sofa: 'sofá', mesa: 'comedor' };
      for (const m of casa.muebles) {
        const r = m.rect;
        OB.s('rect', { x: r[0], y: -r[3], width: r[2] - r[0], height: r[3] - r[1], class: 'pl-mueble ' + m.tipo }, g);
        if (nombres[m.tipo]) OB.s('text', { x: (r[0] + r[2]) / 2, y: -(r[1] + r[3]) / 2 + 0.05, class: 'pl-txt mueble' }, g, nombres[m.tipo]);
      }
    }
    _nombres(svg, casa) {
      const g = OB.s('g', null, svg);
      for (const a of casa.ambientes) {
        const r = casa.libre(a);
        const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
        const ar = casa.areaLibre(a);
        const cuarto = a.id === 'hall' ? 0.5 : 1;
        OB.s('text', { x: cx, y: -cy - (a.id === 'sala' ? 0.3 : 0), class: 'pl-txt amb', 'font-size': 0.25 * cuarto + (a.id === 'hall' ? 0.0 : 0) }, g, a.nombre);
        OB.s('text', { x: cx, y: -cy + 0.27 - (a.id === 'sala' ? 0.3 : 0), class: 'pl-txt area' }, g, OB.fmt(ar, 1) + ' m²');
      }
    }
    _canal(svg, casa) {
      const g = OB.s('g', { class: 'pl-canal' }, svg);
      const tr = L.R.tramos(casa);
      for (const t of tr) {
        if (this.filtroC && !this.filtroC.has(t.c)) continue;
        const a = casa.punto(t.u), b = casa.punto(t.v);
        const c = casa.circuito(t.c);
        const l = OB.s('line', { x1: a.x, y1: -a.y, x2: b.x, y2: -b.y, stroke: OB.COL_C[t.c], class: 'pl-tubo ' + (c.nivel === 'losa' ? 'losa' : 'piso'), 'stroke-width': 0.05 + 0.012 * t.senales.length }, g);
        OB.s('title', null, l, `${t.c} ${t.u}→${t.v}: ${t.senales.length} conductores, ${OB.fmt(t.L, 1)} m`);
      }
    }
    _puntos(svg, casa) {
      const g = OB.s('g', { class: 'pl-puntos' }, svg);
      const cap = this.capas;
      for (const p of casa.electrico.puntos) {
        const k = p.tipo;
        if ((k === 'lum' || k === 'aplique') && !cap.ilum) continue;
        if ((k === 'int' || k === 'int2' || k === 'conm') && !cap.ctrl) continue;
        if (k === 'toma' && !cap.tomas) continue;
        if ((k === 'ducha' || k === 'estufa') && !cap.esp) continue;
        if (this.filtroC && !this.filtroC.has(p.c)) continue;
        this._simbolo(g, p, casa);
      }
      if (cap.esp) {
        const tg = casa.punto('TG');
        const h = OB.s('g', { class: 'pl-tg', 'data-id': 'TG', onclick: () => this.onPick && this.onPick('TG') }, g);
        const hor = Math.abs(tg.frente[0]) === 1;
        OB.s('rect', { x: tg.x - (hor ? 0.1 : 0.28), y: -tg.y - (hor ? 0.28 : 0.1), width: hor ? 0.2 : 0.56, height: hor ? 0.56 : 0.2, class: 'pl-tgr' }, h);
        OB.s('text', { x: tg.x + (hor ? -0.45 : 0), y: -tg.y + (hor ? 0.06 : 0.42), class: 'pl-txt tg' }, h, 'TG');
        OB.s('title', null, h, 'Tablero general');
      }
    }
    _simbolo(g, p, casa) {
      const id = p.id;
      const arr = this.onMove && p.tipo === 'toma' && this.arrastrables ? { 'data-arrastrable': id } : {};
      const gg = OB.s('g', Object.assign({ class: 'pl-pt ' + p.tipo + (this.sel === id ? ' sel' : ''), 'data-id': id, tabindex: this.fijo ? null : 0, onclick: (e) => { e.stopPropagation(); this.onPick && this.onPick(id, e); } }, arr), g);
      const x = p.x, y = -p.y;
      const col = OB.COL_C[p.c] || 'var(--ink)';
      const m = this.marca ? this.marca(p) : null;
      if (m) OB.s('circle', { cx: x, cy: y, r: 0.27, class: 'pl-marca ' + m }, gg);
      OB.s('circle', { cx: x, cy: y, r: 0.3, fill: 'transparent', stroke: 'none' }, gg);
      switch (p.tipo) {
        case 'lum': OB.s('circle', { cx: x, cy: y, r: 0.14, class: 'pl-sim', stroke: col }, gg); OB.s('path', { d: `M${x - 0.1} ${y - 0.1}L${x + 0.1} ${y + 0.1}M${x + 0.1} ${y - 0.1}L${x - 0.1} ${y + 0.1}`, class: 'pl-sim', stroke: col }, gg); break;
        case 'aplique': OB.s('circle', { cx: x, cy: y, r: 0.12, class: 'pl-sim', stroke: col }, gg); OB.s('line', { x1: x - 0.12, y1: y, x2: x + 0.12, y2: y, class: 'pl-sim', stroke: col }, gg); break;
        case 'int': case 'int2': case 'conm':
          OB.s('circle', { cx: x, cy: y, r: 0.11, class: 'pl-sim fill', stroke: col }, gg);
          OB.s('text', { x: x + 0.14, y: y - 0.1, class: 'pl-txt sw', fill: col }, gg, p.tipo === 'conm' ? 'S3' : p.tipo === 'int2' ? 'S2' : 'S');
          break;
        case 'toma': {
          const ap = p.ap || 'comun';
          OB.s('circle', { cx: x, cy: y, r: 0.12, class: 'pl-sim', stroke: ap === 'comun' ? col : 'var(--accent)' }, gg);
          OB.s('path', { d: `M${x - 0.05} ${y - 0.05}v0.1M${x + 0.05} ${y - 0.05}v0.1`, class: 'pl-sim', stroke: ap === 'comun' ? col : 'var(--accent)' }, gg);
          if (ap !== 'comun') OB.s('text', { x: x + 0.16, y: y - 0.12, class: 'pl-txt sw', fill: 'var(--accent)' }, gg, ap === 'gfci-ip' ? 'GFCI·IP' : 'GFCI');
          break;
        }
        case 'ducha': OB.s('rect', { x: x - 0.14, y: y - 0.14, width: 0.28, height: 0.28, class: 'pl-sim', stroke: col }, gg); OB.s('text', { x, y: y + 0.07, class: 'pl-txt sw', fill: col, 'text-anchor': 'middle' }, gg, 'D'); break;
        case 'estufa': OB.s('rect', { x: x - 0.14, y: y - 0.14, width: 0.28, height: 0.28, class: 'pl-sim', stroke: col }, gg); OB.s('text', { x, y: y + 0.07, class: 'pl-txt sw', fill: col, 'text-anchor': 'middle' }, gg, 'E'); break;
        default: OB.s('circle', { cx: x, cy: y, r: 0.1, class: 'pl-sim' }, gg);
      }
      if (this.capas.ids) OB.s('text', { x: x + 0.15, y: y + 0.22, class: 'pl-txt ids' }, gg, id);
      OB.s('title', null, gg, `${id} · ${p.c || ''}` + (p.uso ? ' · ' + p.uso : '') + ` · altura ${OB.fmt(p.z, 2)} m`);
    }
  }
  OB.Planta = Planta;
})();
