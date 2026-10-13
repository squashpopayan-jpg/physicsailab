/* ===================================================================
   40-view3d.js — Motor 3D ligero sobre Canvas 2D
   Convención física: sistema dextrógiro con z hacia arriba.
   Primitivas ordenadas por profundidad (algoritmo del pintor).
   =================================================================== */
(function () {
  'use strict';
  const ML = window.ML;
  const V = ML.V;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? ML.col(c) : c);

  class View3D {
    constructor(sim, cv, o = {}) {
      this.sim = sim;
      this.cv = cv;
      this.home = { az: o.az === undefined ? ML.M.rad(35) : o.az, el: o.el === undefined ? ML.M.rad(22) : o.el, zoom: o.zoom || 1 };
      this.az = this.home.az;
      this.el = this.home.el;
      this.zoom = this.home.zoom;
      this.R = o.radius || 3;
      this.target = o.target || [0, 0, 0];
      this.persp = o.persp === undefined ? 0.2 : o.persp;
      this.items = [];
      this.over = [];
      this.onPick = o.onPick || null;
      this._interact();
      if (o.tools !== false) this._tools();
    }
    _tools() {
      const box = ML.el('div', 'v3d-tools');
      const mk = (txt, title, fn) => {
        const b = ML.el('button', null, txt);
        b.type = 'button';
        b.title = title;
        b.setAttribute('aria-label', title);
        b.addEventListener('click', () => { fn(); this.sim.redraw(); });
        box.append(b);
      };
      mk('+', 'Acercar', () => { this.zoom = Math.min(6, this.zoom * 1.2); });
      mk('−', 'Alejar', () => { this.zoom = Math.max(0.3, this.zoom / 1.2); });
      mk('⟲', 'Restablecer vista', () => { this.az = this.home.az; this.el = this.home.el; this.zoom = this.home.zoom; });
      mk('⊤', 'Vista superior (plano xy)', () => { this.az = -Math.PI / 2; this.el = Math.PI / 2 - 0.001; });
      this.cv.wrap.append(box);
    }
    _interact() {
      const c = this.cv.el;
      c.style.touchAction = 'none';
      c.style.cursor = 'grab';
      const ptrs = new Map();
      let pinch0 = 0, zoom0 = 1, picked = null;
      const pos = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      c.addEventListener('pointerdown', (e) => {
        const p = pos(e);
        if (this.onPick && ptrs.size === 0) {
          const r = this.onPick('down', p[0], p[1]);
          if (r) { picked = r; try { c.setPointerCapture(e.pointerId); } catch (err) { /* */ } e.preventDefault(); return; }
        }
        ptrs.set(e.pointerId, p);
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        c.style.cursor = 'grabbing';
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
          zoom0 = this.zoom;
        }
        e.preventDefault();
      });
      c.addEventListener('pointermove', (e) => {
        const p = pos(e);
        if (picked) { this.onPick('move', p[0], p[1], picked); this.sim.redraw(); return; }
        if (!ptrs.has(e.pointerId)) return;
        const last = ptrs.get(e.pointerId);
        ptrs.set(e.pointerId, p);
        if (ptrs.size === 1) {
          this.az -= (p[0] - last[0]) * 0.0085;
          this.el = ML.M.clamp(this.el + (p[1] - last[1]) * 0.0085, -Math.PI / 2 + 0.001, Math.PI / 2 - 0.001);
          this.sim.redraw();
        } else if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (pinch0 > 0) this.zoom = ML.M.clamp((zoom0 * d) / pinch0, 0.3, 6);
          this.sim.redraw();
        }
      });
      const up = (e) => {
        if (picked) { this.onPick('up', 0, 0, picked); picked = null; }
        ptrs.delete(e.pointerId);
        if (ptrs.size === 0) c.style.cursor = 'grab';
      };
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) return;
        e.preventDefault();
        this.zoom = ML.M.clamp(this.zoom * Math.exp(-e.deltaY * 0.0015), 0.3, 6);
        this.sim.redraw();
      }, { passive: false });
    }
    setup() {
      const w = this.cv.w, h = this.cv.h;
      this.cx = w / 2 + (this.offX || 0);
      this.cy = h / 2 + (this.offY || 0);
      const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
      this.right = [-sa, ca, 0];
      this.up = [-se * ca, -se * sa, ce];
      this.back = [ce * ca, ce * sa, se];
      this.s = (this.zoom * Math.min(w, h) * 0.5) / this.R;
      this.D = this.persp > 0 ? this.R / this.persp : 1e9;
      const L = V.unit(V.comb(0.35, this.right, 0.55, this.up, 0.75, this.back));
      this.light = L;
    }
    P(p) {
      const t = this.target;
      const d0 = p[0] - t[0], d1 = p[1] - t[1], d2 = p[2] - t[2];
      const xr = d0 * this.right[0] + d1 * this.right[1];
      const yu = d0 * this.up[0] + d1 * this.up[1] + d2 * this.up[2];
      const zb = d0 * this.back[0] + d1 * this.back[1] + d2 * this.back[2];
      const f = this.persp > 0 ? this.D / Math.max(1e-6, this.D - zb) : 1;
      return [this.cx + this.s * xr * f, this.cy - this.s * yu * f, -zb];
    }
    /* Dirección de pantalla de un vector (para orientar etiquetas) */
    begin(bg = true) {
      this.setup();
      this.items.length = 0;
      this.over.length = 0;
      if (bg) ML.draw.clear(this.cv);
      return this;
    }
    line(a, b, st = {}) {
      const n = st.seg || 1;
      for (let i = 0; i < n; i++) {
        const pa = n === 1 ? a : V.lerp(a, b, i / n), pb = n === 1 ? b : V.lerp(a, b, (i + 1) / n);
        const A = this.P(pa), B = this.P(pb);
        this.items.push({ k: 0, z: (A[2] + B[2]) / 2 - (st.bias || 0), A, B, st });
      }
      return this;
    }
    polyline(pts, st = {}) {
      for (let i = 1; i < pts.length; i++) {
        const A = this.P(pts[i - 1]), B = this.P(pts[i]);
        this.items.push({ k: 0, z: (A[2] + B[2]) / 2 - (st.bias || 0), A, B, st });
      }
      if (st.close && pts.length > 2) this.line(pts[pts.length - 1], pts[0], st);
      return this;
    }
    arrow(a, b, st = {}) {
      const A = this.P(a), T = this.P(b);
      const Lpx = Math.hypot(T[0] - A[0], T[1] - A[1]);
      const hl = Math.min(st.head || 11, Math.max(Lpx * 0.45, 5));
      const Lw = V.norm(V.sub(b, a));
      if (Lw < 1e-9) return this;
      /* Base de la punta en coordenadas del mundo (aprox. por fracción de longitud proyectada) */
      const frac = Lpx > 1e-6 ? Math.max(0, 1 - (hl * 0.75) / Lpx) : 0;
      const base = V.lerp(a, b, frac);
      if (frac > 0.02) this.line(a, base, Object.assign({}, st, { seg: st.seg || 3 }));
      const Bp = this.P(V.lerp(a, b, Math.max(0, 1 - (hl) / Math.max(Lpx, 1e-6))));
      this.items.push({ k: 2, z: T[2] - (st.bias || 0) - 1e-4, T, B: Bp, hl, st });
      return this;
    }
    poly(pts, st = {}) {
      const P = pts.map((p) => this.P(p));
      let z = 0;
      for (const p of P) z += p[2];
      z /= P.length;
      let fill = st.fill;
      if (fill && st.shade !== false && pts.length >= 3) {
        const n = V.unit(V.cross(V.sub(pts[1], pts[0]), V.sub(pts[2], pts[0])));
        const k = 0.72 + 0.38 * Math.abs(V.dot(n, this.light));
        fill = ML.shade(C(fill), k, st.alpha === undefined ? 0.5 : st.alpha);
      } else if (fill) fill = ML.alpha(C(fill), st.alpha === undefined ? 0.5 : st.alpha);
      this.items.push({ k: 1, z: z - (st.bias || 0), P, st, fill });
      return this;
    }
    /* Malla paramétrica: fn(u,v) → [x,y,z] */
    mesh(fn, u0, u1, nu, v0, v1, nv, st = {}) {
      const grid = [];
      for (let i = 0; i <= nu; i++) {
        const row = [];
        for (let j = 0; j <= nv; j++) row.push(fn(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv));
        grid.push(row);
      }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const q = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
        const s2 = st.fillFn ? Object.assign({}, st, { fill: st.fillFn(u0 + ((u1 - u0) * (i + 0.5)) / nu, v0 + ((v1 - v0) * (j + 0.5)) / nv) }) : st;
        this.poly(q, s2);
      }
      if (st.wire) {
        const ws = { color: st.wire, width: st.wireWidth || 0.8, alpha: st.wireAlpha || 0.5, bias: 1e-3 };
        const everyU = st.wireEveryU || 1, everyV = st.wireEveryV || 1;
        for (let i = 0; i <= nu; i += everyU) this.polyline(grid[i], ws);
        for (let j = 0; j <= nv; j += everyV) this.polyline(grid.map((r) => r[j]), ws);
      }
      return grid;
    }
    point(p, st = {}) {
      const A = this.P(p);
      this.items.push({ k: 3, z: A[2] - (st.bias === undefined ? 0.02 : st.bias), A, st });
      return this;
    }
    text(p, str, st = {}) {
      const A = this.P(p);
      if (st.depth) this.items.push({ k: 4, z: A[2] - (st.bias || 0), A, str, st });
      else this.over.push({ A, str, st });
      return this;
    }
    /* Arco de circunferencia: centro c, radio r, en el plano de u,v (unitarios), de a0 a a1 */
    arc(c, u, v, r, a0, a1, st = {}) {
      const n = st.n || Math.max(8, Math.ceil((Math.abs(a1 - a0) / (2 * Math.PI)) * 64));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = a0 + ((a1 - a0) * i) / n;
        pts.push(V.comb(1, c, r * Math.cos(t), u, r * Math.sin(t), v));
      }
      this.polyline(pts, st);
      if (st.arrow && pts.length > 2) {
        const b = pts[pts.length - 1], a = pts[pts.length - 3];
        const T = this.P(b), B = this.P(a);
        this.items.push({ k: 2, z: T[2] - 1e-4, T, B, hl: st.head || 8, st });
      }
      return pts;
    }
    /* Ejes coordenados */
    axes(o = {}) {
      const L = o.len || 2.2, Ln = o.neg === undefined ? L * 0.6 : o.neg;
      const col = o.color || '--axis';
      const names = o.names || ['x', 'y', 'z'];
      const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      dirs.forEach((d, i) => {
        if (Ln > 0) this.line(V.scale(d, -Ln), [0, 0, 0], { color: col, width: 1, dash: [4, 4], alpha: 0.7, seg: 4 });
        this.arrow([0, 0, 0], V.scale(d, L), { color: col, width: 1.6, head: 10, seg: 6 });
        this.text(V.scale(d, L * 1.08), names[i], { size: 15, italic: true, family: ML.FONT_MATH, color: '--ink', weight: 600, align: 'center', baseline: 'middle' });
        if (o.ticks) {
          for (let t = 1; t <= Math.floor(L - 0.2); t++) {
            const p = V.scale(d, t);
            const perp = i === 2 ? [0.06, -0.06, 0] : [0, 0, 0.06];
            this.line(V.sub(p, perp), V.add(p, perp), { color: col, width: 1 });
            if (o.tickLabels) this.text(V.add(p, V.scale(i === 2 ? [0.18, -0.18, 0] : [0, 0, -0.2], 1)), String(t), { size: 10, mono: true, color: '--ink-3', align: 'center', baseline: 'middle' });
          }
        }
      });
      return this;
    }
    render() {
      const ctx = this.cv.ctx;
      this.items.sort((a, b) => b.z - a.z);
      for (const it of this.items) {
        const st = it.st;
        ctx.globalAlpha = st.alpha === undefined || it.k === 1 ? 1 : st.alpha;
        if (it.k === 0) {
          ctx.strokeStyle = C(st.color || '--ink');
          ctx.lineWidth = st.width || 1.4;
          ctx.lineCap = 'round';
          ctx.setLineDash(st.dash || []);
          ctx.beginPath();
          ctx.moveTo(it.A[0], it.A[1]);
          ctx.lineTo(it.B[0], it.B[1]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (it.k === 1) {
          ctx.beginPath();
          ctx.moveTo(it.P[0][0], it.P[0][1]);
          for (let i = 1; i < it.P.length; i++) ctx.lineTo(it.P[i][0], it.P[i][1]);
          ctx.closePath();
          if (it.fill) { ctx.fillStyle = it.fill; ctx.fill(); }
          if (st.stroke) {
            ctx.strokeStyle = ML.alpha(C(st.stroke), st.strokeAlpha === undefined ? 0.6 : st.strokeAlpha);
            ctx.lineWidth = st.strokeWidth || 0.7;
            ctx.stroke();
          } else if (it.fill && st.seam !== false) {
            /* Relleno de costuras entre cuadriláteros vecinos */
            ctx.strokeStyle = it.fill;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        } else if (it.k === 2) {
          const dx = it.T[0] - it.B[0], dy = it.T[1] - it.B[1];
          const L = Math.hypot(dx, dy);
          ctx.fillStyle = C(st.color || '--ink');
          if (L < 0.5) {
            ctx.beginPath();
            ctx.arc(it.T[0], it.T[1], (st.width || 1.4) * 1.8, 0, 7);
            ctx.fill();
          } else {
            const ux = dx / L, uy = dy / L, hl = it.hl, hw = hl * 0.42;
            ctx.beginPath();
            ctx.moveTo(it.T[0], it.T[1]);
            ctx.lineTo(it.T[0] - ux * hl - uy * hw, it.T[1] - uy * hl + ux * hw);
            ctx.lineTo(it.T[0] - ux * hl * 0.75, it.T[1] - uy * hl * 0.75);
            ctx.lineTo(it.T[0] - ux * hl + uy * hw, it.T[1] - uy * hl - ux * hw);
            ctx.closePath();
            ctx.fill();
          }
        } else if (it.k === 3) {
          const r = st.r || 5;
          ctx.beginPath();
          ctx.arc(it.A[0], it.A[1], r, 0, 2 * Math.PI);
          if (st.glow) {
            const g = ctx.createRadialGradient(it.A[0] - r * 0.35, it.A[1] - r * 0.35, r * 0.1, it.A[0], it.A[1], r);
            g.addColorStop(0, ML.shade(C(st.color || '--accent'), 1.45));
            g.addColorStop(1, C(st.color || '--accent'));
            ctx.fillStyle = g;
          } else ctx.fillStyle = C(st.color || '--accent');
          ctx.fill();
          if (st.ring !== false) {
            ctx.lineWidth = st.ringWidth || 1.5;
            ctx.strokeStyle = st.ring ? C(st.ring) : ML.col('--canvas');
            ctx.stroke();
          }
          if (st.sign) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = Math.max(1.6, r / 5);
            ctx.beginPath();
            ctx.moveTo(it.A[0] - r * 0.5, it.A[1]); ctx.lineTo(it.A[0] + r * 0.5, it.A[1]);
            if (st.sign > 0) { ctx.moveTo(it.A[0], it.A[1] - r * 0.5); ctx.lineTo(it.A[0], it.A[1] + r * 0.5); }
            ctx.stroke();
          }
        } else if (it.k === 4) {
          this._txt(it);
        }
      }
      ctx.globalAlpha = 1;
      for (const t of this.over) this._txt(t);
    }
    _txt(t) {
      const st = t.st;
      ML.text(this.cv.ctx, t.str, t.A[0] + (st.dx || 0), t.A[1] + (st.dy || 0), Object.assign({ size: 13, halo: true, align: 'center', baseline: 'middle' }, st));
    }
    /* Proyección inversa aproximada sobre el plano z = z0 (para arrastrar puntos) */
    unprojectZ(px, py, z0 = 0) {
      /* Resuelve iterativamente (perspectiva suave) */
      let p = [0, 0, z0];
      for (let it = 0; it < 12; it++) {
        const q = this.P(p);
        const ex = px - q[0], ey = py - q[1];
        /* Jacobiano numérico en x,y */
        const h = 1e-3;
        const qx = this.P([p[0] + h, p[1], z0]), qy = this.P([p[0], p[1] + h, z0]);
        const a = (qx[0] - q[0]) / h, b = (qy[0] - q[0]) / h, c = (qx[1] - q[1]) / h, d = (qy[1] - q[1]) / h;
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-9) break;
        p = [p[0] + (d * ex - b * ey) / det, p[1] + (-c * ex + a * ey) / det, z0];
      }
      return p;
    }
  }
  ML.View3D = View3D;
})();
