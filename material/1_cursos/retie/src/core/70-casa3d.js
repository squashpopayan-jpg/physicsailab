/* ===================================================================
   70-casa3d.js — Modelo 3D de la casa ejemplo con three.js (r128)
   Grupos: piso, muros, columnas, vigas, vigas de cimentación, losa,
   puntos eléctricos, tablero, tuberías e interferencias. Órbita con el
   ratón (arrastrar: girar; Mayús + arrastrar o botón derecho: desplazar;
   Ctrl + rueda o botones: acercar), vistas guardadas como en las escenas
   de SketchUp y plano de corte horizontal.
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;

  class Casa3D {
    constructor(sim, o = {}) {
      this.sim = sim;
      this.casa = o.casa || RT.L.CASA;
      this.o = o;
      const wrap = RT.el('div', 'sim-canvas v3d');
      wrap.style.aspectRatio = String(o.aspect || 1.5);
      if (o.maxH) wrap.style.maxHeight = o.maxH;
      sim.stage.append(wrap);
      this.wrap = wrap;
      this.ok = typeof window.THREE !== 'undefined';
      if (!this.ok) {
        wrap.append(RT.el('div', 'sim-error', 'El modelo 3D necesita la biblioteca three.js, que se descarga de internet. Revise la conexión y recargue la página.'));
        return;
      }
      const T = window.THREE;
      try {
        this.renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      } catch (e) {
        this.ok = false;
        wrap.append(RT.el('div', 'sim-error', 'Este navegador no permite WebGL; el modelo 3D no se puede mostrar.'));
        return;
      }
      this.renderer.localClippingEnabled = true;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      wrap.append(this.renderer.domElement);
      this.renderer.domElement.setAttribute('aria-label', 'Modelo 3D de la casa ejemplo');
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(38, 1.5, 0.1, 200);
      this.target = new T.Vector3(4, 5, 1.0);
      this.view = { theta: -0.85, phi: 0.95, r: 23 };
      this.clip = new T.Plane(new T.Vector3(0, 0, -1), 10);
      this.grupos = {};
      this.labels = [];
      this.labelBox = RT.el('div', 'v3d-labels');
      wrap.append(this.labelBox);
      this._tools();
      this._luces();
      this.build();
      this._orbit();
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(wrap);
      RT.onTheme.push(() => { this.build(); this.render(); });
    }
    _tools() {
      const box = RT.el('div', 'v3d-tools');
      const mk = (txt, title, fn) => { const b = RT.el('button', null, txt); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', () => { fn(); this.render(); }); box.append(b); };
      mk('+', 'Acercar', () => { this.view.r = Math.max(3, this.view.r / 1.25); });
      mk('−', 'Alejar', () => { this.view.r = Math.min(60, this.view.r * 1.25); });
      mk('⤢', 'Vista general', () => this.escena('general'));
      this.wrap.append(box);
    }
    _luces() {
      const T = window.THREE;
      this.scene.add(new T.AmbientLight(0xffffff, 0.62));
      const d = new T.DirectionalLight(0xffffff, 0.55); d.position.set(-6, -10, 14); this.scene.add(d);
      const d2 = new T.DirectionalLight(0xffffff, 0.22); d2.position.set(10, 12, 6); this.scene.add(d2);
    }
    _mat(c, op = 1, extra = {}) {
      const T = window.THREE;
      const color = new T.Color(c.startsWith('--') ? RT.col(c) : c);
      return new T.MeshLambertMaterial(Object.assign({ color, transparent: op < 1, opacity: op, clippingPlanes: [this.clip], side: T.DoubleSide, depthWrite: op >= 1 }, extra));
    }
    _box(g, x0, y0, z0, x1, y1, z1, mat) {
      const T = window.THREE;
      const geo = new T.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
      const m = new T.Mesh(geo, mat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      g.add(m);
      return m;
    }
    _grupo(name) {
      const T = window.THREE;
      if (this.grupos[name]) this.scene.remove(this.grupos[name]);
      const g = new T.Group(); g.name = name; this.scene.add(g); this.grupos[name] = g; return g;
    }
    build() {
      if (!this.ok) return;
      const K = this.casa, H = K.H, C = RT.L.C, F = K.t / 2;
      this.scene.background = new window.THREE.Color(RT.col('--canvas'));
      this.labels = [];
      /* piso */
      const gp = this._grupo('piso');
      this._box(gp, -F, -F, -H.contrapiso, 8 + F, 10 + F, 0, this._mat('--surface-3'));
      this._box(gp, -2.2, -3, -H.contrapiso - 0.01, 10.2, 12.4, -H.contrapiso - 0.005, this._mat('--surface-2'));
      /* muros */
      const gm = this._grupo('muros');
      const vigas = K.vigas(false);
      const enViga = (m) => K.ejes.x.includes(m.a[0]) && m.a[0] === m.b[0] || K.ejes.y.includes(m.a[1]) && m.a[1] === m.b[1];
      const matM = this._mat('--l-muro-fill', 1), matV = this._mat('#9fc6e6', 0.35);
      for (const m of K.muros) {
        const top = enViga(m) ? H.fondoViga : H.fondoLosa;
        const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len];
        const pieza = (d0, d1, z0, z1, mat = matM) => {
          const e0 = d0 <= 1e-9 ? -F : d0, e1 = Math.abs(d1 - len) < 1e-9 ? len + F : d1;
          const a = [m.a[0] + u[0] * e0, m.a[1] + u[1] * e0], b = [m.a[0] + u[0] * e1, m.a[1] + u[1] * e1];
          const hor = Math.abs(u[1]) < 1e-9;
          if (hor) this._box(gm, a[0], a[1] - F, z0, b[0], b[1] + F, z1, mat);
          else this._box(gm, a[0] - F, a[1], z0, b[0] + F, b[1], z1, mat);
        };
        for (const [d0, d1] of K.tramosMuro(m)) pieza(d0, d1, 0, top);
        for (const v of m.vanos) {
          if (v.z0 > 0) pieza(v.d0, v.d1, 0, v.z0);
          if (v.z1 < top) pieza(v.d0, v.d1, v.z1, top);
          if (v.tipo === 'ventana') pieza(v.d0, v.d1, v.z0, v.z1, matV);
        }
      }
      /* estructura */
      const gc = this._grupo('columnas');
      const matE = this._mat('--l-estr-fill');
      for (const c of K.columnas()) this._box(gc, c.rect[0], c.rect[1], -H.cim - H.contrapiso, c.rect[2], c.rect[3], H.topeLosa, matE);
      const gv = this._grupo('vigas');
      for (const v of vigas) this._box(gv, v.rect[0], v.rect[1], H.fondoViga, v.rect[2], v.rect[3], H.topeLosa, this._mat('--l-estr-fill', 0.95));
      const gcim = this._grupo('cim');
      for (const v of K.vigas(true)) this._box(gcim, v.rect[0], v.rect[1], -H.cim - H.contrapiso, v.rect[2], v.rect[3], -H.contrapiso, this._mat('--l-estr', 0.9));
      const gl = this._grupo('losa');
      this._box(gl, -F - 0.05, -F - 0.05, H.fondoLosa, 8 + F + 0.05, 10 + F + 0.05, H.topeLosa, this._mat('--l-estr-fill', 0.28));
      /* puntos eléctricos */
      const ge = this._grupo('puntos');
      const colTipo = (p) => (['lum', 'aplique', 'int', 'int2', 'conm'].includes(p.tipo) ? '--l-ilum' : p.tipo === 'toma' ? '--l-toma' : '--l-esp');
      for (const p of K.electrico.puntos) {
        const mat = this._mat(colTipo(p));
        const m = K.muros.find((mm) => mm.id === p.muro);
        if (p.tipo === 'lum') { const T = window.THREE; const geo = new T.CylinderGeometry(0.13, 0.13, 0.03, 20); const me = new T.Mesh(geo, mat); me.rotation.x = Math.PI / 2; me.position.set(p.x, p.y, H.fondoLosa - 0.02); ge.add(me); }
        else if (m) {
          const hor = Math.abs(m.a[1] - m.b[1]) < 1e-9;
          const w = p.tipo === 'ducha' || p.tipo === 'estufa' ? 0.12 : 0.07, h = p.tipo === 'aplique' ? 0.16 : 0.11, dpt = 0.035;
          if (hor) this._box(ge, p.x - w, p.y - dpt, p.z - h / 2, p.x + w, p.y + dpt, p.z + h / 2, mat);
          else this._box(ge, p.x - dpt, p.y - w, p.z - h / 2, p.x + dpt, p.y + w, p.z + h / 2, mat);
        }
        this.labels.push({ id: p.id, pos: [p.x, p.y, p.tipo === 'lum' ? H.fondoLosa - 0.05 : p.z + 0.12], grupo: 'puntos' });
      }
      const tg = K.punto('TG');
      this._box(ge, tg.x - 0.04, tg.y - 0.16, tg.z - 0.22, tg.x + 0.02, tg.y + 0.16, tg.z + 0.22, this._mat('--accent'));
      this.labels.push({ id: 'TG', pos: [tg.x, tg.y, tg.z + 0.3], grupo: 'puntos' });
      /* tuberías */
      const gt = this._grupo('tubos');
      const T = window.THREE;
      const tr = RT.L.R.tramos(K);
      const ccol = this.o.colorCirc || (() => '--l-canal');
      for (const t of tr) {
        const mat = this._mat(ccol(t.c));
        const pts = t.pts.map((q) => new T.Vector3(q[0], q[1], q[2]));
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], L0 = a.distanceTo(b);
          if (L0 < 1e-3) continue;
          const geo = new T.CylinderGeometry(0.013, 0.013, L0, 8);
          const me = new T.Mesh(geo, mat);
          me.position.copy(a.clone().add(b).multiplyScalar(0.5));
          me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
          me.userData = { c: t.c };
          gt.add(me);
        }
      }
      /* interferencias */
      const gi = this._grupo('inter');
      for (const it of RT.L.R.interferencias(K)) {
        if (it.tipo === 'cim') continue;
        const z = it.tipo === 'caja' ? K.punto(it.punto).z : (H.fondoViga + H.topeLosa) / 2;
        const geo = new T.SphereGeometry(it.tipo === 'caja' ? 0.09 : 0.12, 16, 12);
        const me = new T.Mesh(geo, this._mat(it.critico ? '--bad' : '--mid', 0.85));
        me.position.set(it.x, it.y, z);
        gi.add(me);
      }
      this.aplicar(this._vis || {});
    }
    aplicar(vis) {
      this._vis = Object.assign({ piso: true, muros: true, columnas: true, vigas: true, cim: false, losa: true, puntos: true, tubos: false, inter: false, etiquetas: false, corte: null }, vis);
      if (!this.ok) return;
      for (const k in this.grupos) this.grupos[k].visible = !!this._vis[k];
      this.clip.constant = this._vis.corte === null || this._vis.corte === undefined ? 10 : this._vis.corte;
    }
    escena(nombre) {
      const E = {
        general: { theta: -0.85, phi: 0.95, r: 23, t: [4, 5, 0.8] },
        puntos: { theta: -0.55, phi: 0.62, r: 18, t: [4, 5, 0.8] },
        coordinacion: { theta: -1.2, phi: 1.05, r: 7.5, t: [4.6, 5.0, 2.2] },
        planta: { theta: -Math.PI / 2, phi: 0.02, r: 21, t: [4, 5, 0] },
        cocina: { theta: -2.2, phi: 1.0, r: 7, t: [2.2, 6.9, 1.2] },
        bano: { theta: -0.6, phi: 0.95, r: 5.5, t: [7.0, 5.0, 1.2] }
      }[nombre] || {};
      if (E.t) { this.view = { theta: E.theta, phi: E.phi, r: E.r }; this.target.set(E.t[0], E.t[1], E.t[2]); }
    }
    _orbit() {
      const el = this.renderer.domElement;
      el.style.touchAction = 'none';
      let st = null;
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('pointerdown', (e) => { st = { x: e.clientX, y: e.clientY, v: Object.assign({}, this.view), t: this.target.clone(), pan: e.button === 2 || e.shiftKey }; el.setPointerCapture(e.pointerId); this._focus = true; });
      el.addEventListener('pointermove', (e) => {
        if (!st) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (st.pan) {
          const T = window.THREE, k = this.view.r / 600;
          const right = new T.Vector3(Math.cos(this.view.theta + Math.PI / 2), Math.sin(this.view.theta + Math.PI / 2), 0);
          this.target.copy(st.t).add(right.multiplyScalar(-dx * k)).add(new T.Vector3(0, 0, dy * k));
        } else {
          this.view.theta = st.v.theta - dx * 0.008;
          this.view.phi = Math.max(0.02, Math.min(1.52, st.v.phi - dy * 0.006));
        }
        this.render();
      });
      const end = () => { st = null; };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('mouseenter', () => { this._focus = false; });
      el.addEventListener('wheel', (e) => { if (!e.ctrlKey && !this._focus) return; e.preventDefault(); this.view.r = Math.max(3, Math.min(60, this.view.r * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); this.render(); }, { passive: false });
    }
    resize() {
      if (!this.ok) return;
      const w = this.wrap.clientWidth, h = this.wrap.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = w + 'px';
      this.renderer.domElement.style.height = h + 'px';
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.render();
    }
    render() {
      if (!this.ok) return;
      const v = this.view, t = this.target;
      const x = t.x + v.r * Math.sin(v.phi) * Math.cos(v.theta), y = t.y + v.r * Math.sin(v.phi) * Math.sin(v.theta), z = t.z + v.r * Math.cos(v.phi);
      this.camera.position.set(x, y, z);
      this.camera.up.set(0, 0, 1);
      this.camera.lookAt(t);
      this.renderer.render(this.scene, this.camera);
      this._labels();
    }
    _labels() {
      const box = this.labelBox;
      box.innerHTML = '';
      if (!this._vis || !this._vis.etiquetas) return;
      const T = window.THREE, w = this.wrap.clientWidth, h = this.wrap.clientHeight;
      const corte = this._vis.corte;
      for (const lb of this.labels) {
        if (corte !== null && corte !== undefined && lb.pos[2] > corte) continue;
        const v = new T.Vector3(lb.pos[0], lb.pos[1], lb.pos[2]).project(this.camera);
        if (v.z > 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1) continue;
        const d = RT.el('span', null, lb.id);
        d.style.left = ((v.x + 1) / 2) * w + 'px';
        d.style.top = ((1 - v.y) / 2) * h + 'px';
        box.append(d);
      }
    }
  }
  RT.Casa3D = Casa3D;
})();
