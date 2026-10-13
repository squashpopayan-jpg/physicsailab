/* ===================================================================
   60-plano.js — Planta interactiva de la casa por capas
   Capas: ejes, estructura (columnas, vigas, vigas de cimentación), muros y
   vanos, mobiliario, nombres y áreas, cotas, iluminación (E01), tomas (E02),
   canalizaciones con marcas de conductores (E03), tierra y acometida (E04),
   zonas que exigen GFCI. Zoom con la rueda o los botones, arrastre para
   desplazar, clic para consultar un punto.
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;
  const L = RT.L;
  const col = (c) => (c && c.startsWith && c.startsWith('--') ? RT.col(c) : c);

  const CAPAS_DEF = { ejes: true, estr: true, cim: false, vigas: true, muros: true, muebles: true, nombres: true, cotas: false, ilum: false, ctrl: false, tomas: false, esp: false, canal: false, marcas: false, tierra: false, gfci: false, etiquetas: true, circ: false, conflictos: false };

  class Plano {
    constructor(sim, cv, o = {}) {
      this.sim = sim;
      this.cv = cv;
      this.casa = o.casa || RT.L.CASA;
      this.capas = Object.assign({}, CAPAS_DEF, o.capas || {});
      this.bounds = o.bounds || [-1.6, -2.2, 9.6, 11.3];
      this.zoom = 1; this.panX = 0; this.panY = 0;
      this.sel = null; this.hover = null;
      this.extra = o.extra || null;
      this.resaltar = o.resaltar || null; /* función(p) → color o null */
      this.filtroCirc = o.filtroCirc || null;
      this.onPick = o.onPick || null;
      this.editable = !!o.editable;
      this.onDrag = o.onDrag || null;
      this.minPx = o.minPx || 7;
      this.conEscala = o.escala !== false;
      this._tip = RT.el('div', 'plan-tip');
      this._tip.hidden = true;
      cv.wrap.append(this._tip);
      if (o.interactivo !== false) { this._tools(); this._wire(); }
    }
    _tools() {
      const box = RT.el('div', 'v3d-tools');
      const mk = (txt, title, fn) => { const b = RT.el('button', null, txt); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); this.sim.redraw(); }); box.append(b); };
      mk('+', 'Acercar', () => this.zoomAt(1.35));
      mk('−', 'Alejar', () => this.zoomAt(1 / 1.35));
      mk('⤢', 'Ver todo', () => { this.zoom = 1; this.panX = 0; this.panY = 0; });
      this.cv.wrap.append(box);
    }
    zoomAt(f, px, py) {
      const cv = this.cv;
      px = px === undefined ? cv.w / 2 : px; py = py === undefined ? cv.h / 2 : py;
      const wx = this.wx(px), wy = this.wy(py);
      this.zoom = Math.max(0.6, Math.min(12, this.zoom * f));
      this._fit();
      this.panX += px - this.X(wx);
      this.panY += py - this.Y(wy);
    }
    _fit() {
      const [x0, y0, x1, y1] = this.bounds, w = this.cv.w, h = this.cv.h;
      this.s0 = Math.min(w / (x1 - x0), h / (y1 - y0));
      this.s = this.s0 * this.zoom;
      this.cx0 = w / 2 - ((x0 + x1) / 2) * this.s;
      this.cy0 = h / 2 + ((y0 + y1) / 2) * this.s;
    }
    X(x) { return this.cx0 + this.panX + x * this.s; }
    Y(y) { return this.cy0 + this.panY - y * this.s; }
    wx(px) { return (px - this.cx0 - this.panX) / this.s; }
    wy(py) { return (this.cy0 + this.panY - py) / this.s; }
    _wire() {
      const c = this.cv.el;
      c.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.altKey && !this._focus) return;
        e.preventDefault();
        const r = c.getBoundingClientRect();
        this.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
        this.sim.redraw();
      }, { passive: false });
      c.addEventListener('mouseenter', () => { this._focus = false; });
      let drag = null;
      RT.pointer(this.cv, {
        down: (x, y) => {
          const hit = this.pick(x, y);
          if (this.editable && hit && hit.p && this.onDrag) { drag = { mode: 'edit', p: hit.p }; this.sel = hit; this._focus = true; return 1; }
          drag = { mode: 'pan', x, y, px: this.panX, py: this.panY, moved: false, hit };
          this._focus = true;
          return 1;
        },
        move: (k, x, y) => {
          if (!drag) return;
          if (drag.mode === 'edit') { this.onDrag(drag.p, this.wx(x), this.wy(y)); this.sim.redraw(); return; }
          if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > 4) drag.moved = true;
          if (drag.moved) { this.panX = drag.px + x - drag.x; this.panY = drag.py + y - drag.y; this.sim.redraw(); }
        },
        up: () => {
          if (drag && drag.mode === 'pan' && !drag.moved) {
            this.sel = drag.hit || null;
            if (this.onPick) this.onPick(this.sel);
            this.sim.redraw();
          }
          if (drag && drag.mode === 'edit' && this.onPick) this.onPick(this.sel);
          drag = null;
        },
        hover: (x, y) => {
          const h = this.pick(x, y);
          const was = this.hover;
          this.hover = h;
          if ((was && was.id) !== (h && h.id)) this.sim.redraw();
          this._showTip(h, x, y);
          return h ? 'pointer' : 'grab';
        },
        leave: () => { this.hover = null; this._tip.hidden = true; this.sim.redraw(); }
      });
    }
    _showTip(h, x, y) {
      if (!h) { this._tip.hidden = true; return; }
      this._tip.innerHTML = h.tip;
      this._tip.hidden = false;
      const w = this.cv.w;
      this._tip.style.left = Math.min(w - 230, x + 14) + 'px';
      this._tip.style.top = Math.max(4, y - 10) + 'px';
    }
    /* Elementos que se pueden consultar */
    pick(px, py) {
      const wx = this.wx(px), wy = this.wy(py), K = this.casa;
      const rpx = Math.max(10, 0.22 * this.s);
      let best = null, bd = Infinity;
      const vis = (p) => {
        if (p.tipo === 'lum' || p.tipo === 'aplique' || p.tipo === 'int' || p.tipo === 'int2' || p.tipo === 'conm') return this.capas.ilum;
        if (p.tipo === 'toma') return this.capas.tomas;
        if (p.tipo === 'ducha' || p.tipo === 'estufa') return this.capas.esp || this.capas.tomas;
        return true;
      };
      const pts = K.electrico.puntos.concat([K.punto('TG')]);
      for (const p of pts) {
        if (!vis(p)) continue;
        if (this.filtroCirc && p.c && !this.filtroCirc(p.c)) continue;
        const d = Math.hypot(this.X(p.x) - px, this.Y(p.y) - py);
        if (d < rpx && d < bd) { bd = d; best = { id: p.id, p, tip: this.tipPunto(p) }; }
      }
      if (best) return best;
      if (this.capas.estr) for (const c of K.columnas()) if (wx >= c.rect[0] && wx <= c.rect[2] && wy >= c.rect[1] && wy <= c.rect[3]) return { id: 'col-' + c.id, col: c, tip: `<b>Columna ${c.id}</b><br>0,30 × 0,30 m, concreto reforzado` };
      if (this.capas.nombres) for (const a of K.ambientes) { const r = K.libre(a); if (wx >= r[0] && wx <= r[2] && wy >= r[1] && wy <= r[3]) return { id: 'amb-' + a.id, amb: a, tip: `<b>${a.nombre}</b><br>${RT.L.C.fmt(K.areaLibre(a), 2)} m² libres · ${RT.L.C.fmt(r[2] - r[0], 2)} × ${RT.L.C.fmt(r[3] - r[1], 2)} m` }; }
      return null;
    }
    tipPunto(p) {
      const C = RT.L.C;
      const nom = { lum: 'Luminaria de techo', aplique: 'Aplique de pared', int: 'Interruptor sencillo', int2: 'Interruptor doble', conm: 'Interruptor conmutable', toma: p.gfci ? 'Tomacorriente GFCI' : 'Tomacorriente doble', ducha: 'Salida para ducha', estufa: 'Salida para estufa', tablero: 'Tablero general' }[p.tipo] || p.tipo;
      let t = `<b>${p.id}</b> · ${nom}`;
      if (p.c) t += `<br>Circuito ${p.c}`;
      if (p.W) t += ` · ${p.W} W`;
      t += `<br>Altura ${C.fmt(p.z, 2)} m`;
      if (p.ctrl) t += ` · controla ${p.ctrl.join(', ')}`;
      if (p.s) t += ` · se enciende con ${p.s.replace(/[ab]$/, '')}`;
      if (p.gfciCarga) t += `<br>Protegida aguas abajo del GFCI ${p.gfciCarga}`;
      if (p.uso) t += `<br>${p.uso}`;
      if (p.nota) t += `<br><i>${p.nota}</i>`;
      return t;
    }

    /* ---------------- Dibujo ---------------- */
    draw() {
      const cv = this.cv, ctx = cv.ctx, K = this.casa, C = RT.L.C;
      this._fit();
      RT.draw.clear(cv);
      const S = this.s, X = (x) => this.X(x), Y = (y) => this.Y(y);
      const capas = this.capas;
      ctx.save();
      /* piso de los ambientes */
      ctx.fillStyle = col('--l-piso');
      ctx.fillRect(X(-K.t / 2), Y(10 + K.t / 2), 8.15 * S, 10.15 * S);
      if (capas.gfci) this._gfci(ctx);
      /* ejes */
      if (capas.ejes) {
        ctx.strokeStyle = RT.alpha('--l-cota', 0.55); ctx.lineWidth = 1; ctx.setLineDash([8, 3, 2, 3]);
        K.ejes.x.forEach((x, i) => { ctx.beginPath(); ctx.moveTo(X(x), Y(-1.1)); ctx.lineTo(X(x), Y(11.0)); ctx.stroke(); });
        K.ejes.y.forEach((y, i) => { ctx.beginPath(); ctx.moveTo(X(-1.1), Y(y)); ctx.lineTo(X(9.1), Y(y)); ctx.stroke(); });
        ctx.setLineDash([]);
        const bub = (x, y, t) => { const r = Math.max(8, 0.22 * S); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col('--canvas'); ctx.fill(); ctx.strokeStyle = col('--l-cota'); ctx.stroke(); ctx.fillStyle = col('--l-cota'); ctx.font = `600 ${Math.max(9, r)}px ${RT.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y + 0.5); };
        K.ejes.x.forEach((x, i) => bub(X(x), Y(11.0) - Math.max(8, 0.22 * S), K.ejes.nx[i]));
        K.ejes.y.forEach((y, i) => bub(X(9.1) + Math.max(8, 0.22 * S), Y(y), K.ejes.ny[i]));
      }
      /* vigas de cimentación (ocultas) */
      if (capas.cim) {
        ctx.strokeStyle = RT.alpha('--l-estr', 0.7); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        for (const v of K.vigas(true)) { const r = v.rect; ctx.strokeRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S); }
        ctx.setLineDash([]);
      }
      /* muros */
      if (capas.muros) {
        ctx.fillStyle = col('--l-muro-fill');
        for (const m of K.muros) {
          const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len], n = [-u[1], u[0]], h = K.t / 2;
          for (const [d0, d1] of K.tramosMuro(m)) {
            const e0 = d0 === 0 ? -h : d0, e1 = Math.abs(d1 - len) < 1e-9 ? len + h : d1;
            const p = [[e0, -h], [e1, -h], [e1, h], [e0, h]].map(([d, o]) => [m.a[0] + u[0] * d + n[0] * o, m.a[1] + u[1] * d + n[1] * o]);
            ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.closePath(); ctx.fill();
          }
        }
        /* vanos */
        ctx.strokeStyle = col('--l-muro'); ctx.lineWidth = 1;
        for (const m of K.muros) {
          const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len], n = [-u[1], u[0]], h = K.t / 2;
          for (const v of m.vanos) {
            const P = (d, o) => [m.a[0] + u[0] * d + n[0] * o, m.a[1] + u[1] * d + n[1] * o];
            if (v.tipo === 'ventana') {
              ctx.lineWidth = 1;
              for (const o of [-h, -h / 3, h / 3, h]) { const a = P(v.d0, o), b = P(v.d1, o); ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke(); }
            } else if (v.tipo === 'puerta') {
              const w = v.d1 - v.d0, hinge = v.bisagra ? v.d1 : v.d0, sgn = v.lado;
              const hp = P(hinge, sgn * h);
              const dirU = v.bisagra ? -1 : 1;
              const tip = [hp[0] + n[0] * sgn * w, hp[1] + n[1] * sgn * w];
              ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(hp[0]), Y(hp[1])); ctx.lineTo(X(tip[0]), Y(tip[1])); ctx.stroke();
              const a0 = Math.atan2(-(n[1] * sgn), n[0] * sgn), a1 = Math.atan2(-(u[1] * dirU), u[0] * dirU);
              ctx.lineWidth = 0.8; ctx.setLineDash([3, 2]); ctx.beginPath();
              let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
              ctx.arc(X(hp[0]), Y(hp[1]), w * S, a0, a0 + d, d < 0); ctx.stroke(); ctx.setLineDash([]);
            }
          }
        }
      }
      /* columnas y vigas */
      if (capas.estr) {
        if (capas.vigas) {
          ctx.strokeStyle = col('--l-estr'); ctx.lineWidth = 1.1; ctx.setLineDash([6, 4]);
          for (const v of K.vigas(false)) { const r = v.rect; ctx.strokeRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S); }
          ctx.setLineDash([]);
        }
        for (const c of K.columnas()) {
          const r = c.rect;
          ctx.fillStyle = col('--l-estr-fill'); ctx.fillRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S);
          ctx.strokeStyle = col('--l-estr'); ctx.lineWidth = 1.4; ctx.strokeRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S);
          ctx.beginPath(); ctx.moveTo(X(r[0]), Y(r[1])); ctx.lineTo(X(r[2]), Y(r[3])); ctx.moveTo(X(r[0]), Y(r[3])); ctx.lineTo(X(r[2]), Y(r[1])); ctx.lineWidth = 0.7; ctx.stroke();
        }
      }
      /* mobiliario */
      if (capas.muebles) {
        ctx.strokeStyle = RT.alpha('--ink-3', 0.8); ctx.lineWidth = 0.8;
        for (const m of K.muebles) {
          const r = m.rect;
          ctx.fillStyle = m.tipo === 'meson' ? RT.alpha('--ink-3', 0.12) : m.tipo === 'ducha' ? RT.alpha('--c1', 0.1) : 'transparent';
          ctx.beginPath(); ctx.rect(X(r[0]), Y(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S); ctx.fill(); ctx.stroke();
          const cx = X((r[0] + r[2]) / 2), cy = Y((r[1] + r[3]) / 2);
          if (m.tipo === 'lavaplatos' || m.tipo === 'lavamanos' || m.tipo === 'lavadero') { ctx.beginPath(); ctx.ellipse(cx, cy, ((r[2] - r[0]) / 2.6) * S, ((r[3] - r[1]) / 2.6) * S, 0, 0, 7); ctx.stroke(); }
          if (m.tipo === 'estufa') for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(cx + dx * 0.14 * S, cy + dy * 0.13 * S, 0.09 * S, 0, 7); ctx.stroke(); }
          if (m.tipo === 'ducha') { ctx.beginPath(); ctx.moveTo(X(r[0]), Y(r[1])); ctx.lineTo(X(r[2]), Y(r[3])); ctx.moveTo(X(r[0]), Y(r[3])); ctx.lineTo(X(r[2]), Y(r[1])); ctx.stroke(); }
          if (S > 34 && m.tipo !== 'meson') {
            const lab = { estufa: 'estufa', lavaplatos: 'lavaplatos', nevera: 'nevera', lavadero: 'lavadero', lavadora: 'lavadora', ducha: 'ducha', lavamanos: 'lavamanos', sanitario: 'sanitario', cama: 'cama', sofa: 'sofá', mesa: 'comedor' }[m.tipo];
            if (lab) { ctx.fillStyle = RT.alpha('--ink-3', 0.9); ctx.font = `${Math.min(11, 0.16 * S)}px ${RT.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, cx, cy + (m.tipo === 'estufa' ? 0.3 * S : 0)); }
          }
        }
      }
      /* nombres de ambientes */
      if (capas.nombres) {
        for (const a of K.ambientes) {
          const r = K.libre(a), cx = X((r[0] + r[2]) / 2), cy = Y((r[1] + r[3]) / 2 + (a.id === 'hall' ? -0.55 : 0));
          const f = Math.max(9, Math.min(15, 0.24 * S));
          ctx.fillStyle = col('--ink-2'); ctx.font = `600 ${f}px ${RT.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const ox = a.id === 'sala' ? -0.6 * S : 0, oy = a.id === 'sala' ? -0.4 * S : a.id === 'bano' ? -0.25 * S : 0;
          const estrecho = (r[2] - r[0]) < 1.4;
          ctx.save(); ctx.translate(cx + ox, cy + oy); if (estrecho) ctx.rotate(-Math.PI / 2);
          ctx.fillText(a.nombre.toUpperCase(), 0, 0);
          ctx.fillStyle = col('--ink-3'); ctx.font = `${f * 0.85}px ${RT.FONT_MONO}`;
          ctx.fillText(C.fmt(K.areaLibre(a), 2) + ' m²', 0, f * 1.15);
          ctx.restore();
        }
      }
      if (capas.cotas) this._cotas(ctx);
      if (capas.tierra) this._tierra(ctx);
      if (capas.canal) this._canal(ctx);
      if (capas.ctrl) this._ctrl(ctx);
      this._puntos(ctx);
      if (capas.conflictos) this._conflictos(ctx);
      if (this.extra) this.extra(ctx, this);
      ctx.restore();
      /* escala gráfica */
      if (this.conEscala) this._escala(ctx);
    }
    _escala(ctx) {
      const S = this.s, h = this.cv.h;
      const m = S > 120 ? 0.5 : S > 45 ? 1 : 2;
      const x0 = 14, y0 = h - 14;
      ctx.save();
      ctx.strokeStyle = col('--ink-2'); ctx.fillStyle = col('--ink-2'); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + m * S, y0); ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 2); ctx.moveTo(x0 + m * S, y0 - 4); ctx.lineTo(x0 + m * S, y0 + 2); ctx.stroke();
      ctx.font = `11px ${RT.FONT_MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(RT.L.C.fmt(m, m < 1 ? 1 : 0) + ' m', x0 + m * S + 6, y0 + 4);
      ctx.restore();
    }
    _cotas(ctx) {
      const K = this.casa, X = (x) => this.X(x), Y = (y) => this.Y(y), C = RT.L.C, F = K.t / 2;
      ctx.save();
      ctx.strokeStyle = col('--l-cota'); ctx.fillStyle = col('--l-cota'); ctx.lineWidth = 0.9;
      const f = Math.max(9, Math.min(12, 0.2 * this.s));
      ctx.font = `${f}px ${RT.FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const hcota = (xs, y, txt) => {
        ctx.beginPath(); ctx.moveTo(X(xs[0]), Y(y)); ctx.lineTo(X(xs[xs.length - 1]), Y(y)); ctx.stroke();
        xs.forEach((x) => { ctx.beginPath(); ctx.moveTo(X(x) - 4, Y(y) + 4); ctx.lineTo(X(x) + 4, Y(y) - 4); ctx.moveTo(X(x), Y(y) - 5); ctx.lineTo(X(x), Y(y) + 5); ctx.stroke(); });
        for (let i = 0; i < xs.length - 1; i++) ctx.fillText(txt ? txt[i] : C.fmt(xs[i + 1] - xs[i], 2), (X(xs[i]) + X(xs[i + 1])) / 2, Y(y) - 2);
      };
      const vcota = (ys, x) => {
        ctx.beginPath(); ctx.moveTo(X(x), Y(ys[0])); ctx.lineTo(X(x), Y(ys[ys.length - 1])); ctx.stroke();
        ys.forEach((y) => { ctx.beginPath(); ctx.moveTo(X(x) - 4, Y(y) + 4); ctx.lineTo(X(x) + 4, Y(y) - 4); ctx.moveTo(X(x) - 5, Y(y)); ctx.lineTo(X(x) + 5, Y(y)); ctx.stroke(); });
        for (let i = 0; i < ys.length - 1; i++) { ctx.save(); ctx.translate(X(x) - 3, (Y(ys[i]) + Y(ys[i + 1])) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(C.fmt(ys[i + 1] - ys[i], 2), 0, 0); ctx.restore(); }
      };
      hcota(K.ejes.x, -0.75);
      hcota([-F, 8 + F], -1.25);
      vcota(K.ejes.y, -0.75);
      vcota([-F, 10 + F], -1.25);
      ctx.restore();
    }
    _gfci(ctx) {
      const K = this.casa, S = this.s;
      ctx.save();
      for (const m of K.muebles) {
        if (!['lavaplatos', 'lavadero', 'lavamanos', 'ducha'].includes(m.tipo)) continue;
        const amb = K.ambiente(m.amb), lr = K.libre(amb), r = m.rect, R = 1.8;
        ctx.save();
        ctx.beginPath(); ctx.rect(this.X(lr[0]), this.Y(lr[3]), (lr[2] - lr[0]) * S, (lr[3] - lr[1]) * S); ctx.clip();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(this.X(r[0] - R), this.Y(r[3] + R), (r[2] - r[0] + 2 * R) * S, (r[3] - r[1] + 2 * R) * S, R * S);
        else ctx.rect(this.X(r[0] - R), this.Y(r[3] + R), (r[2] - r[0] + 2 * R) * S, (r[3] - r[1] + 2 * R) * S);
        ctx.fillStyle = RT.alpha(m.tipo === 'ducha' ? '--c5' : '--c1', 0.1); ctx.fill();
        ctx.strokeStyle = RT.alpha(m.tipo === 'ducha' ? '--c5' : '--c1', 0.55); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    _tierra(ctx) {
      const K = this.casa, E = K.electrico, X = (x) => this.X(x), Y = (y) => this.Y(y), S = this.s;
      const tg = K.punto('TG'), med = E.medidor, t = E.tierra;
      ctx.save();
      /* acometida */
      ctx.strokeStyle = col('--ink'); ctx.lineWidth = 1.6; ctx.setLineDash([10, 3, 2, 3]);
      ctx.beginPath(); ctx.moveTo(X(E.acometida.desde[0]), Y(Math.max(-2.1, E.acometida.desde[1]))); ctx.lineTo(X(med.x), Y(med.y - 0.15)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col('--ink-2'); ctx.font = `${Math.max(9, Math.min(12, 0.19 * S))}px ${RT.FONT_UI}`; ctx.textAlign = 'left';
      ctx.fillText('Acometida desde la red (poste)', X(E.acometida.desde[0]) + 6, Y(-2.0));
      /* alimentador medidor → tablero */
      ctx.strokeStyle = col('--ink'); ctx.lineWidth = 1.8; ctx.setLineDash([7, 4]);
      ctx.beginPath(); ctx.moveTo(X(med.x), Y(med.y)); ctx.lineTo(X(tg.x), Y(tg.y)); ctx.stroke();
      /* conductor del electrodo */
      ctx.strokeStyle = col('--l-tierra'); ctx.lineWidth = 1.6; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(t.varillas[1][0]), Y(t.varillas[1][1])); ctx.lineTo(X(t.varillas[0][0]), Y(t.varillas[0][1])); ctx.lineTo(X(tg.x - 0.12), Y(tg.y - 0.12)); ctx.stroke();
      ctx.setLineDash([]);
      const ss = Math.max(this.minPx, 0.14 * S);
      t.varillas.forEach((v) => RT.simbolo(ctx, 'p-tierra', X(v[0]), Y(v[1]), ss, { color: '--l-tierra', bg: '--canvas' }));
      RT.simbolo(ctx, 'p-medidor', X(med.x), Y(med.y - 0.2), ss, { color: '--ink', bg: '--canvas' });
      if (this.capas.etiquetas) {
        ctx.fillStyle = col('--l-tierra'); ctx.font = `600 ${Math.max(9, Math.min(12, 0.18 * S))}px ${RT.FONT_UI}`; ctx.textAlign = 'center';
        ctx.fillText('SPT: 2 varillas Cu 5/8 in × 2,4 m', X(2.1), Y(-1.35));
        ctx.fillStyle = col('--ink-2'); ctx.fillText('Medidor', X(med.x), Y(med.y - 0.2) + ss * 1.9);
      }
      ctx.restore();
    }
    _ctrl(ctx) {
      /* líneas de control interruptor → luminarias (arcos) */
      const K = this.casa, X = (x) => this.X(x), Y = (y) => this.Y(y);
      ctx.save();
      ctx.strokeStyle = RT.alpha('--l-ilum', 0.75); ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      for (const sw of K.electrico.puntos.filter((p) => p.ctrl)) {
        if (this.filtroCirc && !this.filtroCirc(sw.c)) continue;
        for (const s of sw.ctrl) {
          for (const l of K.electrico.puntos.filter((p) => p.s === s)) {
            this._arco(ctx, [sw.x, sw.y], [l.x, l.y], 0.18);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
    _arco(ctx, a, b, k = 0.2) {
      const X = (x) => this.X(x), Y = (y) => this.Y(y);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
      const cx = mx - dy * k, cy = my + dx * k;
      ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.quadraticCurveTo(X(cx), Y(cy), X(b[0]), Y(b[1]));
      return [0.25 * a[0] + 0.5 * cx + 0.25 * b[0], 0.25 * a[1] + 0.5 * cy + 0.25 * b[1], 0.5 * (cx - a[0]) + 0.5 * (b[0] - cx), 0.5 * (cy - a[1]) + 0.5 * (b[1] - cy)];
    }
    _canal(ctx) {
      const K = this.casa, X = (x) => this.X(x), Y = (y) => this.Y(y), S = this.s;
      const tr = this._tramos || (this._tramos = RT.L.R.tramos(K));
      ctx.save();
      for (const t of tr) {
        if (this.filtroCirc && !this.filtroCirc(t.c)) continue;
        const a = K.punto(t.u), b = K.punto(t.v);
        const sel = this.sel && this.sel.tramo === t;
        const cc = this.colorCirc ? this.colorCirc(t.c) : '--l-canal';
        ctx.strokeStyle = col(cc); ctx.lineWidth = sel ? 3 : 1.5;
        ctx.setLineDash(t.nivel === 'piso' ? [7, 4] : []);
        const mid = this._arco(ctx, [a.x, a.y], [b.x, b.y], t.nivel === 'losa' ? 0.12 : 0);
        ctx.stroke();
        ctx.setLineDash([]);
        if (this.capas.marcas && S > 30) this._marcas(ctx, mid, t);
      }
      ctx.restore();
    }
    /* Marcas de conductores sobre un tramo: fase (/), neutro (/ con punto), tierra (/ con barra),
       retorno (/ con círculo), viajero (/ con gancho) */
    _marcas(ctx, mid, t) {
      const X = (x) => this.X(x), Y = (y) => this.Y(y);
      const [mx, my, tx, ty] = mid;
      const L0 = Math.hypot(tx, ty) || 1, ux = tx / L0, uy = ty / L0, nx = -uy, ny = ux;
      const n = t.senales.length, gap = 0.075, len = 0.11;
      ctx.save(); ctx.strokeStyle = col('--ink'); ctx.fillStyle = col('--ink'); ctx.lineWidth = 1;
      t.senales.forEach((s, i) => {
        const o = (i - (n - 1) / 2) * gap;
        const cx = mx + ux * o, cy = my + uy * o;
        const p0 = [cx - nx * len - ux * 0.03, cy - ny * len - uy * 0.03], p1 = [cx + nx * len + ux * 0.03, cy + ny * len + uy * 0.03];
        ctx.beginPath(); ctx.moveTo(X(p0[0]), Y(p0[1])); ctx.lineTo(X(p1[0]), Y(p1[1])); ctx.stroke();
        const e = [X(p1[0]), Y(p1[1])];
        if (s === 'N') { ctx.beginPath(); ctx.arc(e[0], e[1], 2.2, 0, 7); ctx.fill(); }
        else if (s === 'T') { ctx.beginPath(); ctx.moveTo(e[0] - ux * 4 * 1, e[1] + uy * 4); ctx.lineTo(e[0] + ux * 4, e[1] - uy * 4); ctx.stroke(); }
        else if (s.startsWith('R')) { ctx.beginPath(); ctx.arc(e[0], e[1], 2.4, 0, 7); ctx.stroke(); }
        else if (s.startsWith('V')) { ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0] + nx * 4, e[1] - ny * 4 + 3); ctx.stroke(); }
      });
      ctx.restore();
    }
    _puntos(ctx) {
      const K = this.casa, X = (x) => this.X(x), Y = (y) => this.Y(y), S = this.s, capas = this.capas;
      const ss = Math.max(this.minPx, 0.13 * S);
      const f = Math.max(8.5, Math.min(12, 0.17 * S));
      const pts = K.electrico.puntos;
      const visible = (p) => {
        if (this.filtroCirc && p.c && !this.filtroCirc(p.c)) return false;
        if (['lum', 'aplique', 'int', 'int2', 'conm'].includes(p.tipo)) return capas.ilum;
        if (p.tipo === 'toma') return capas.tomas;
        if (p.tipo === 'ducha' || p.tipo === 'estufa') return capas.esp || capas.tomas;
        return false;
      };
      ctx.save();
      for (const p of pts) {
        if (!visible(p)) continue;
        const name = RT.simboloDe(p);
        const colr = (this.resaltar && this.resaltar(p)) || (['lum', 'aplique', 'int', 'int2', 'conm'].includes(p.tipo) ? '--l-ilum' : p.tipo === 'toma' ? '--l-toma' : '--l-esp');
        let rot = 0;
        if (p.tipo === 'toma' || p.tipo === 'int' || p.tipo === 'int2' || p.tipo === 'conm') {
          /* orientar hacia el interior del ambiente según el muro */
          const m = K.muros.find((mm) => mm.id === p.muro);
          if (m) {
            const hor = Math.abs(m.a[1] - m.b[1]) < 1e-9;
            if (p.tipo === 'toma') rot = hor ? (p.y > m.a[1] ? 0 : Math.PI) : (p.x > m.a[0] ? Math.PI / 2 : -Math.PI / 2);
            if (p.tipo === 'toma') rot += Math.PI;
          }
        }
        const sel = this.sel && this.sel.id === p.id, hov = this.hover && this.hover.id === p.id;
        if (sel || hov) { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), ss * 1.7, 0, 7); ctx.fillStyle = RT.alpha('--accent', sel ? 0.25 : 0.14); ctx.fill(); }
        RT.simbolo(ctx, name, X(p.x), Y(p.y), ss, { color: colr, rot, bg: '--canvas' });
        if (p.gfci && S > 24) { ctx.fillStyle = col('--l-toma'); ctx.font = `700 ${f * 0.8}px ${RT.FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('GFCI', X(p.x), Y(p.y) - ss * 1.45); }
        if (capas.etiquetas && S > 30) {
          const t = capas.circ ? p.c : p.id;
          ctx.fillStyle = col('--ink-2'); ctx.font = `${f}px ${RT.FONT_MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(t, X(p.x) + ss * 1.2, Y(p.y) + ss * 1.25);
        }
      }
      /* tablero */
      const tg = K.punto('TG');
      if (capas.tomas || capas.ilum || capas.canal || capas.tierra) {
        const w = 0.32 * S, h = 0.13 * S;
        ctx.save(); ctx.translate(X(tg.x - 0.05), Y(tg.y)); ctx.rotate(Math.PI / 2);
        ctx.fillStyle = col('--canvas'); ctx.fillRect(-w / 2, -h / 2, w, h);
        RT.simbolo(ctx, 'tablero-general', 0, 0, w / 2, { color: '--accent' });
        ctx.restore();
        if (capas.etiquetas) { ctx.fillStyle = col('--accent'); ctx.font = `700 ${f * 1.05}px ${RT.FONT_UI}`; ctx.textAlign = 'right'; ctx.fillText('TG', X(tg.x - 0.18), Y(tg.y)); }
      }
      ctx.restore();
    }
    _conflictos(ctx) {
      const K = this.casa, X = (x) => this.X(x), Y = (y) => this.Y(y);
      const lst = this._inter || (this._inter = RT.L.R.interferencias(K));
      ctx.save();
      for (const it of lst) {
        if (it.tipo === 'cim' && !this.capas.cim) continue;
        const r = Math.max(6, 0.14 * this.s);
        ctx.beginPath(); ctx.arc(X(it.x), Y(it.y), r, 0, 7);
        ctx.strokeStyle = col(it.critico ? '--bad' : it.tipo === 'cim' ? '--l-estr' : '--mid'); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = RT.alpha(it.critico ? '--bad' : '--mid', 0.15); ctx.fill();
      }
      ctx.restore();
    }
    invalidar() { this._tramos = null; this._inter = null; }
  }
  RT.Plano = Plano;
})();
