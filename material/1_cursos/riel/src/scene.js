/* Escena 3D del laboratorio (Three.js r149). Unidades: metros. El eje x corre a lo largo del riel.
   Las coordenadas "locales del riel" van de −L/2 a +L/2; la simulación usa x = 0…L desde el extremo izquierdo. */
(function (root) {
  'use strict';
  const T = root.THREE, E = root.RIEL, C = E.C, L = C.L, LEN = C.len;
  const Y_RIEL = 0.96, Y_MESA = 0.90, XS_R = 0.8, XS_L = -0.8, Y_APEX = 0.042;
  const PUL = { x: L / 2 + 0.045, y: 0.040, r: 0.022 }, Y_HOOK = 0.062;

  /* ───────── utilidades de textura ───────── */
  function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g, w, h); return c; }
  function tex(c, rep) { const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
  function ruido(g, w, h, n, a, c1, c2) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? c1 : c2; g.globalAlpha = Math.random() * a; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } g.globalAlpha = 1; }
  const texPiso = () => tex(lienzo(512, 512, (g, w, h) => { g.fillStyle = '#80888d'; g.fillRect(0, 0, w, h); ruido(g, w, h, 6000, 0.12, '#fff', '#333'); g.strokeStyle = '#5c6468'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.strokeRect(w / 2, 0, 0, h); g.strokeRect(0, h / 2, w, 0); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; g.fillRect(i * w / 2, j * h / 2, w / 2, h / 2); } }), [6, 6]);
  const texPared = () => tex(lienzo(512, 512, (g, w, h) => { g.fillStyle = '#c3cbc8'; g.fillRect(0, 0, w, h); ruido(g, w, h, 5000, 0.05, '#fff', '#555'); }), [4, 1]);
  const texMesa = () => tex(lienzo(1024, 512, (g, w, h) => { g.fillStyle = '#5d6a74'; g.fillRect(0, 0, w, h); ruido(g, w, h, 14000, 0.14, '#cfd9df', '#1d262c'); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,.06)'); gr.addColorStop(.5, 'rgba(0,0,0,.03)'); gr.addColorStop(1, 'rgba(255,255,255,.06)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  const texMadera = () => tex(lienzo(512, 256, (g, w, h) => { g.fillStyle = '#c59a62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${90 + Math.random() * 40},${60 + Math.random() * 30},30,${0.08 + Math.random() * 0.14})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (Math.random() - .5) * 10, w * .6, y + (Math.random() - .5) * 10, w, y + (Math.random() - .5) * 8); g.stroke(); } }));
  function texRegla() {
    return tex(lienzo(4096, 96, (g, w, h) => {
      g.fillStyle = '#f2efe4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b'; g.strokeStyle = '#1b1b1b';
      const px = w / 2000;                    // píxeles por mm
      for (let mm = 0; mm <= 2000; mm++) {
        const x = mm * px + 0.5; let l = 12; if (mm % 5 === 0) l = 20; if (mm % 10 === 0) l = 32;
        g.fillRect(x - 0.6, 0, 1.2, l);
      }
      g.font = '600 26px "IBM Plex Mono", monospace'; g.textAlign = 'center';
      for (let cm = 0; cm <= 200; cm += 10) { g.fillText(String(cm), Math.min(w - 26, Math.max(18, cm * 10 * px)), 70); }
      g.font = '600 20px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.fillText('cm', 6, 92);
    }));
  }
  function texLCD(lineas, titulo) {
    const c = lienzo(512, 256, (g, w, h) => {
      g.fillStyle = '#b9c9a6'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
      g.fillStyle = '#26301d'; g.font = '600 22px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.fillText(titulo || 'SMART TIMER', 14, 30);
      g.font = '600 34px "IBM Plex Mono", monospace';
      (lineas || []).slice(0, 4).forEach((s, i) => g.fillText(s, 14, 82 + i * 46));
    });
    return c;
  }

  /* ───────── piezas ───────── */
  let ENV = null;
  function mat(o) { o.envMap = ENV; if (o.envMapIntensity == null) o.envMapIntensity = (o.metalness || 0) > 0.5 ? 0.8 : 0.35; return new T.MeshStandardMaterial(o); }
  function caja(w, h, d, m, x, y, z) { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x || 0, y || 0, z || 0); q.castShadow = q.receiveShadow = true; return q; }
  function cil(rt, rb, h, m, seg, x, y, z, eje) { const q = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), m); q.position.set(x || 0, y || 0, z || 0); if (eje === 'z') q.rotation.x = Math.PI / 2; if (eje === 'x') q.rotation.z = Math.PI / 2; q.castShadow = q.receiveShadow = true; return q; }

  function crear(canvas) {
    const R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.95;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene(); scene.background = new T.Color('#8f999e'); scene.fog = new T.Fog('#8f999e', 8, 18);
    const cam = new T.PerspectiveCamera(36, 1, 0.05, 40);

    /* entorno de estudio para los reflejos del aluminio */
    {
      const es = new T.Scene();
      es.add(new T.Mesh(new T.BoxGeometry(14, 8, 14), new T.MeshBasicMaterial({ color: '#4d555d', side: T.BackSide })));
      const luz = (w, h, x, y, z, rx, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k, k), side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.x = rx; es.add(m); };
      luz(6, 2.2, 0, 3.9, 0, Math.PI / 2, 3.2); luz(2.5, 4, -6.8, 2.5, 1, 0, 1.6); luz(3, 2, 5, 3, 4, 0, 1.2); luz(8, 0.6, 0, 2, -6.9, 0, 0.9);
      const pm = new T.PMREMGenerator(R); ENV = pm.fromScene(es, 0.03).texture; scene.environment = ENV; pm.dispose();
    }
    scene.add(new T.HemisphereLight('#f4f7fa', '#4a5056', 0.18));
    const key = new T.DirectionalLight('#fff3e2', 1.25); key.position.set(-1.8, 3.4, 2.4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -1.9; sc.right = 1.9; sc.top = 1.2; sc.bottom = -1.4; sc.near = 1; sc.far = 8; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
    scene.add(key); key.target.position.set(0, 0.95, 0); scene.add(key.target);
    const fill = new T.DirectionalLight('#dbe6ff', 0.3); fill.position.set(3, 2, 1.5); scene.add(fill);

    /* materiales */
    const M = {
      alu: mat({ color: '#8d969e', metalness: 0.88, roughness: 0.52, envMapIntensity: 0.7 }),
      aluOsc: mat({ color: '#737c84', metalness: 0.85, roughness: 0.5 }),
      rojo: mat({ color: '#a3141d', metalness: 0.1, roughness: 0.68, envMapIntensity: 0.3 }),
      azul: mat({ color: '#143c8a', metalness: 0.1, roughness: 0.68, envMapIntensity: 0.3 }),
      verde: mat({ color: '#2a7a4b', metalness: 0.55, roughness: 0.38 }),
      negro: mat({ color: '#16181b', metalness: 0.1, roughness: 0.55 }),
      goma: mat({ color: '#202225', metalness: 0, roughness: 0.95 }),
      cromo: mat({ color: '#dfe3e6', metalness: 1, roughness: 0.18, envMapIntensity: 0.8 }),
      laton: mat({ color: '#d1a748', metalness: 0.95, roughness: 0.28 }),
      acero: mat({ color: '#5d636a', metalness: 0.85, roughness: 0.42 }),
      gris: mat({ color: '#6c747b', metalness: 0.3, roughness: 0.6 }),
      hilo: mat({ color: '#f1ece0', metalness: 0, roughness: 0.9 }),
      madera: mat({ map: texMadera(), roughness: 0.7 }),
      espuma: mat({ color: '#4c5560', roughness: 1 }),
      manguera: mat({ color: '#32363b', metalness: 0.2, roughness: 0.6 }),
      led: new T.MeshBasicMaterial({ color: '#3a0e0e' })
    };

    /* ───────── laboratorio ───────── */
    const lab = new T.Group(); scene.add(lab);
    {
      const piso = new T.Mesh(new T.PlaneGeometry(14, 14), mat({ map: texPiso(), roughness: 0.5 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; lab.add(piso);
      const pared = mat({ map: texPared(), roughness: 0.95 });
      const mur = (w, h, x, y, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), pared); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; lab.add(m); return m; };
      mur(14, 3.4, 0, 1.7, -2.4, 0); mur(14, 3.4, -5, 1.7, 0, Math.PI / 2); mur(14, 3.4, 5.5, 1.7, 0, -Math.PI / 2); mur(14, 3.4, 0, 1.7, 6, Math.PI);
      const zocalo = mat({ color: '#4f6d7a', roughness: 0.7 });
      lab.add(caja(14, 1.1, 0.02, zocalo, 0, 0.55, -2.39));
      const cielo = new T.Mesh(new T.PlaneGeometry(14, 14), mat({ color: '#e5e8ea', roughness: 1 })); cielo.rotation.x = Math.PI / 2; cielo.position.y = 3.4; lab.add(cielo);
      // pizarra con las ecuaciones del montaje (se redibuja)
      const pz = lienzo(1024, 512, () => { }); lab.userData.pizCanvas = pz;
      const pizTex = new T.CanvasTexture(pz); pizTex.encoding = T.sRGBEncoding; pizTex.anisotropy = 8; lab.userData.pizTex = pizTex;
      const piz = new T.Mesh(new T.PlaneGeometry(2.1, 1.05), new T.MeshStandardMaterial({ map: pizTex, roughness: 0.6, envMap: ENV, envMapIntensity: 0.2 })); piz.position.set(-0.2, 1.85, -2.37); lab.add(piz);
      lab.add(caja(2.2, 0.06, 0.04, M.alu, -0.2, 1.31, -2.36)); lab.add(caja(2.2, 0.04, 0.03, M.alu, -0.2, 2.4, -2.36));
      // mesa
      const mesa = new T.Mesh(new T.BoxGeometry(2.5, 0.04, 1.0), [M.madera, M.madera, new T.MeshStandardMaterial({ map: texMesa(), roughness: 0.45, envMap: ENV, envMapIntensity: 0.35 }), M.madera, M.madera, M.madera]);
      mesa.position.set(-0.21, 0.88, 0.1); mesa.castShadow = mesa.receiveShadow = true; lab.add(mesa);
      const pata = (x, z) => { lab.add(caja(0.06, 0.86, 0.06, M.acero, x, 0.43, z)); lab.add(caja(0.12, 0.02, 0.12, M.negro, x, 0.01, z)); };
      pata(-1.38, -0.34); pata(0.96, -0.34); pata(-1.38, 0.54); pata(0.96, 0.54);
      lab.add(caja(2.3, 0.05, 0.03, M.acero, -0.21, 0.80, -0.34)); lab.add(caja(2.3, 0.05, 0.03, M.acero, -0.21, 0.80, 0.54));
      lab.add(caja(0.03, 0.05, 0.88, M.acero, -1.38, 0.80, 0.1)); lab.add(caja(0.03, 0.05, 0.88, M.acero, 0.96, 0.80, 0.1));
      // estante / mesa auxiliar con lámpara y un taburete
      const tab = cil(0.17, 0.17, 0.04, M.negro, 28, -1.9, 0.62, 0.9); lab.add(tab);
      for (const [dx, dz] of [[0.1, 0.1], [-0.1, 0.1], [0.1, -0.1], [-0.1, -0.1]]) lab.add(cil(0.012, 0.012, 0.6, M.acero, 8, -1.9 + dx, 0.31, 0.9 + dz));
      // caja de herramientas y mochila en el piso
      lab.add(caja(0.45, 0.22, 0.2, M.rojo, -1.9, 0.11, -1.1));
      // pasa-cables en el piso
      const cable = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(1.15, 0.01, -1), new T.Vector3(0.7, 0.01, -0.5), new T.Vector3(0.9, 0.01, -0.1), new T.Vector3(1.0, 0.8, -0.3)]), 40, 0.006, 6), M.negro); lab.add(cable);
    }

    /* ───────── riel ───────── */
    const pivot = new T.Group(); pivot.position.set(XS_R, Y_RIEL, 0); scene.add(pivot);
    const rail = new T.Group(); rail.position.set(-XS_R, 0, 0); pivot.add(rail);
    const stands = new T.Group(); scene.add(stands);
    {
      const sh = new T.Shape(); sh.moveTo(-0.025, 0); sh.lineTo(0, Y_APEX); sh.lineTo(0.025, 0); sh.lineTo(-0.025, 0);
      const h = new T.Path(); h.moveTo(-0.0215, 0.0025); h.lineTo(0, Y_APEX - 0.0042); h.lineTo(0.0215, 0.0025); h.lineTo(-0.0215, 0.0025); sh.holes.push(h);
      const g = new T.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-L / 2, 0, 0);
      const cuerpo = new T.Mesh(g, M.alu); cuerpo.castShadow = cuerpo.receiveShadow = true; rail.add(cuerpo);
      // orificios del colchón de aire (dos hileras por cara)
      const pasos = Math.floor(L / 0.02), n = pasos * 4, inst = new T.InstancedMesh(new T.CircleGeometry(0.00085, 8), new T.MeshBasicMaterial({ color: '#0b0c0d' }), n);
      const d = new T.Object3D(), nz = new T.Vector3();
      let k = 0;
      for (let i = 0; i < pasos; i++) for (const lado of [-1, 1]) for (const f of [0.28, 0.66]) {
        const yy = Y_APEX * f, zz = lado * 0.025 * (1 - f), off = (f > 0.5 ? 0.01 : 0);
        d.position.set(-L / 2 + 0.01 + i * 0.02 + off, yy, zz + lado * 0.0001);
        nz.set(0, 0.025, lado * Y_APEX).normalize();
        d.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), nz); d.updateMatrix(); inst.setMatrixAt(k++, d.matrix);
      }
      inst.count = k; rail.add(inst);
      // regla adherida a la base, frente al riel
      const reg = new T.Mesh(new T.PlaneGeometry(L, 0.0469), new T.MeshStandardMaterial({ map: texRegla(), roughness: 0.6, envMap: ENV, envMapIntensity: 0.3 }));
      reg.rotation.x = -Math.PI / 2; reg.position.set(0, -0.0002 + 0.0001, 0.0775); reg.receiveShadow = true;
      const placa = caja(L, 0.004, 0.05, M.aluOsc, 0, -0.002, 0.0775); rail.add(placa); reg.position.y = 0.0002; rail.add(reg);
      const perfil = caja(L, 0.003, 0.05, M.aluOsc, 0, -0.0015, 0); rail.add(perfil);
      // tope izquierdo con racor de aire; derecho con soporte de la polea
      const poste = (sg) => {
        const g = new T.Group(); g.position.set(sg * L / 2, 0, 0);
        g.add(caja(0.016, sg > 0 ? 0.050 : 0.060, 0.034, M.negro, sg * 0.008, sg > 0 ? 0.031 : 0.036, 0));
        g.add(caja(0.012, 0.010, 0.022, M.goma, -sg * 0.0005, 0.0475, 0));
        g.add(caja(0.06, 0.012, 0.075, M.aluOsc, sg * 0.01, -0.006, 0));
        return g;
      };
      rail.add(poste(-1)); const pd = poste(1); rail.add(pd);
      const racor = cil(0.014, 0.014, 0.05, M.laton, 20, -L / 2 - 0.03, 0.012, 0, 'x'); rail.add(racor);
      rail.add(cil(0.017, 0.017, 0.008, M.cromo, 20, -L / 2 - 0.058, 0.012, 0, 'x'));
      // polea (rueda de 6 radios con ranura)
      const wh = new T.Group(); wh.position.set(PUL.x, PUL.y, 0.0);
      const rs = new T.Shape(); rs.absarc(0, 0, PUL.r, 0, Math.PI * 2, false);
      for (let i = 0; i < 6; i++) { const p = new T.Path(), a0 = i * Math.PI / 3 + 0.12, a1 = a0 + Math.PI / 3 - 0.24; p.absarc(0, 0, 0.0165, a0, a1, false); p.absarc(0, 0, 0.0065, a1, a0, true); rs.holes.push(p); }
      const rg = new T.ExtrudeGeometry(rs, { depth: 0.007, bevelEnabled: true, bevelSize: 0.0009, bevelThickness: 0.0009, bevelSegments: 2, curveSegments: 28 }); rg.translate(0, 0, -0.0035);
      const rueda = new T.Mesh(rg, M.alu); rueda.castShadow = true; wh.add(rueda);
      wh.add(cil(0.0055, 0.0055, 0.016, M.cromo, 16, 0, 0, 0, 'z'));
      rail.add(wh); root._rueda = wh;
      // horquilla de la polea
      rail.add(caja(0.006, 0.050, 0.004, M.acero, PUL.x, PUL.y - 0.012, 0.0105)); rail.add(caja(0.006, 0.050, 0.004, M.acero, PUL.x, PUL.y - 0.012, -0.0105));
      rail.add(caja(0.05, 0.008, 0.026, M.acero, PUL.x - 0.012, 0.0, 0));
      rail.userData.rueda = wh;
    }
    function construirSoportes(th) {
      while (stands.children.length) { const q = stands.children.pop(); q.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      const base = Y_MESA + 0.02, dx = XS_R - XS_L, cols = [M.laton, M.aluOsc, M.madera, M.azul];
      const columna = (x, top) => {
        const g = new T.Group(); stands.add(g);
        const h = top - base, a0 = Math.min(h, 0.05);
        g.add(caja(0.06, a0, 0.09, M.acero, x, base + a0 / 2, 0));
        g.add(caja(0.07, 0.004, 0.15, M.negro, x, base - 0.0, 0));
        for (const sg of [-1, 1]) g.add(cil(0.011, 0.011, 0.012, M.cromo, 16, x, base + 0.006, sg * 0.062));
        let y = base + a0, i = 0;
        while (y < top - 1e-4 && i < 40) { const t = Math.min(0.012, top - y); g.add(caja(0.07, t, 0.1, cols[i % cols.length], x, y + t / 2, 0)); y += t; i++; }
      };
      columna(XS_R, Y_RIEL - 0.003);
      columna(XS_R - dx * Math.cos(th), Y_RIEL + dx * Math.sin(th) - 0.003);
    }
    function armarManguera() {
      if (estado.manguera) { equipo.remove(estado.manguera); estado.manguera.geometry.dispose(); }
      const fin = rail.localToWorld(new T.Vector3(-L / 2 - 0.066, 0.012, 0));
      const c = new T.CatmullRomCurve3([V(-1.16, Y_MESA + 0.32, -0.2), V(-1.16, Y_MESA + 0.46, -0.08), V(fin.x - 0.07, Math.max(Y_MESA + 0.06, fin.y - 0.14), 0.1), V(fin.x - 0.02, fin.y + 0.0, 0.02), fin]);
      estado.manguera = new T.Mesh(new T.TubeGeometry(c, 70, 0.0165, 12), M.manguera); estado.manguera.castShadow = true; equipo.add(estado.manguera);
    }

    /* ───────── equipos sobre la mesa ───────── */
    const equipo = new T.Group(); scene.add(equipo);
    const tex_ = {};
    {
      // soplador
      const bl = new T.Group(); bl.position.set(-1.22, Y_MESA + 0.02, -0.16);
      bl.add(caja(0.34, 0.24, 0.28, mat({ color: '#2e6f8e', metalness: 0.3, roughness: 0.5 }), 0, 0.12, 0));
      bl.add(caja(0.30, 0.02, 0.24, M.negro, 0, 0.25, 0));
      for (let i = 0; i < 7; i++) bl.add(caja(0.2, 0.004, 0.012, M.negro, 0, 0.17 + 0.0, 0.141 - 0.0 + 0.0, 0)), bl.children[bl.children.length - 1].position.set(-0.04, 0.05 + i * 0.022, 0.141);
      const sw = caja(0.04, 0.03, 0.02, M.negro, 0.12, 0.17, 0.142); bl.add(sw);
      const led = new T.Mesh(new T.SphereGeometry(0.006, 10, 8), new T.MeshBasicMaterial({ color: '#27d36b' })); led.position.set(0.12, 0.21, 0.145); bl.add(led); tex_.ledSop = led;
      bl.add(cil(0.05, 0.05, 0.05, M.gris, 20, 0.06, 0.28, -0.04));
      equipo.add(bl); tex_.soplador = bl;
      // cronómetro inteligente
      const ti = new T.Group(); ti.position.set(-0.52, Y_MESA + 0.02, 0.4); ti.rotation.y = 0.18;
      ti.add(caja(0.22, 0.05, 0.14, mat({ color: '#d7dbde', roughness: 0.5 }), 0, 0.025, 0));
      const inc = new T.Group(); inc.position.set(0, 0.055, 0.0); inc.rotation.x = 0.5; ti.add(inc);
      inc.add(caja(0.2, 0.012, 0.12, mat({ color: '#2b2f33', roughness: 0.5 }), 0, 0, 0));
      const lcdTex = new T.CanvasTexture(texLCD(['—'])); lcdTex.encoding = T.sRGBEncoding; tex_.lcd = lcdTex;
      const lcd = new T.Mesh(new T.PlaneGeometry(0.13, 0.065), new T.MeshBasicMaterial({ map: lcdTex })); lcd.rotation.x = -Math.PI / 2; lcd.position.set(-0.025, 0.0075, -0.015); inc.add(lcd);
      for (let i = 0; i < 3; i++) inc.add(cil(0.007, 0.007, 0.006, [M.rojo, M.verde, M.azul][i], 14, 0.075, 0.008, -0.036 + i * 0.033));
      equipo.add(ti); tex_.timer = ti;
      // computadora portátil con la gráfica x–t
      const lp = new T.Group(); lp.position.set(0.42, Y_MESA + 0.02, 0.32); lp.rotation.y = -0.3;
      lp.add(caja(0.34, 0.012, 0.24, mat({ color: '#9aa1a8', metalness: 0.8, roughness: 0.35 }), 0, 0.006, 0));
      lp.add(caja(0.27, 0.002, 0.1, M.negro, 0, 0.0125, 0.05));
      const pant = new T.Group(); pant.position.set(0, 0.012, -0.12); pant.rotation.x = -0.22; lp.add(pant);
      pant.add(caja(0.34, 0.22, 0.008, mat({ color: '#9aa1a8', metalness: 0.8, roughness: 0.35 }), 0, 0.11, 0));
      const lcanvas = lienzo(1024, 640, () => { }); const ltex = new T.CanvasTexture(lcanvas); ltex.encoding = T.sRGBEncoding; ltex.anisotropy = 8;
      const sp = new T.Mesh(new T.PlaneGeometry(0.31, 0.194), new T.MeshBasicMaterial({ map: ltex })); sp.position.set(0, 0.11, 0.0046); pant.add(sp);
      equipo.add(lp); tex_.laptopCanvas = lcanvas; tex_.laptopTex = ltex; tex_.laptop = lp;
      // balanza digital
      const ba = new T.Group(); ba.position.set(-1.05, Y_MESA + 0.02, 0.38);
      ba.add(caja(0.2, 0.025, 0.17, mat({ color: '#e9ecee', roughness: 0.4 }), 0, 0.0125, 0));
      ba.add(cil(0.07, 0.07, 0.006, M.cromo, 28, 0.0, 0.028, -0.01));
      const bTex = new T.CanvasTexture(texLCD(['0.0 g'], 'BALANZA')); bTex.encoding = T.sRGBEncoding; tex_.balanza = bTex;
      const bl2 = new T.Mesh(new T.PlaneGeometry(0.07, 0.022), new T.MeshBasicMaterial({ map: bTex })); bl2.rotation.x = -Math.PI / 2 + 0.25; bl2.position.set(0.0, 0.026, 0.067); ba.add(bl2);
      equipo.add(ba);
      // caja de masas ranuradas y libreta
      const cj = new T.Group(); cj.position.set(0.82, Y_MESA + 0.02, 0.38);
      cj.add(caja(0.2, 0.04, 0.12, M.madera, 0, 0.02, 0));
      [[0.06, 0.0125, -0.04, 0.026], [0.06, 0.0125, 0.03, 0.02], [-0.04, 0.0125, -0.03, 0.017], [-0.05, 0.0125, 0.04, 0.0135]].forEach(([x, y, z, r]) => { const m = cil(r, r, 0.006, M.laton, 28, x, 0.044, z); cj.add(m); });
      equipo.add(cj);
      const lib = new T.Group(); lib.position.set(0.12, Y_MESA + 0.02, 0.44); lib.rotation.y = 0.2;
      lib.add(caja(0.15, 0.012, 0.21, mat({ color: '#2f5d8a', roughness: 0.7 }), 0, 0.006, 0)); lib.add(caja(0.14, 0.004, 0.2, mat({ color: '#f1f0ea', roughness: 0.9 }), 0.003, 0.014, 0));
      lib.add(cil(0.0035, 0.0035, 0.16, mat({ color: '#e0b21f', roughness: 0.6 }), 6, 0.02, 0.02, 0.0, 'x'));
      equipo.add(lib);
    }

    /* ───────── montaje dinámico ───────── */
    const mont = new T.Group(); rail.add(mont);
    const ropeG = new T.Group(); scene.add(ropeG);
    const vecG = new T.Group(); scene.add(vecG);
    const hanger = new T.Group(); scene.add(hanger);
    const soporteCaida = new T.Group(); scene.add(soporteCaida);
    const aire = { pts: null, geo: null };
    const estado = { id: null, P: null, gl: [], gates: [], springs: [], ropes: [], vec: {}, lastM: -1, hangerMass: -1, cableMesh: null, cableKey: '' };
    function limpiar(g) { while (g.children.length) { const q = g.children.pop(); q.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } }

    function bumper(tipo, lado, m) { // lado: +1 extremo derecho del carrito, −1 izquierdo
      const g = new T.Group(); g.position.set(lado * (LEN / 2), 0.0475, 0);
      if (tipo === 'goma') g.add(caja(0.010, 0.008, 0.012, M.goma, lado * 0.005, 0, 0));
      else if (tipo === 'iman') { g.add(caja(0.004, 0.008, 0.012, M.acero, lado * 0.002, 0, 0)); g.add(cil(0.0055, 0.0055, 0.006, M.cromo, 18, lado * 0.007, 0, 0, 'x')); g.add(cil(0.0035, 0.0035, 0.0012, lado > 0 ? M.rojo : M.azul, 14, lado * 0.0103, 0, 0, 'x')); }
      else if (tipo === 'velcro') { g.add(caja(0.004, 0.008, 0.012, M.acero, lado * 0.002, 0, 0)); g.add(caja(0.006, 0.0085, 0.0125, lado > 0 ? mat({ color: '#111', roughness: 1 }) : mat({ color: '#d9d9d2', roughness: 1 }), lado * 0.007, 0, 0)); }
      else if (tipo === 'embolo') { g.add(cil(0.0045, 0.0045, 0.010, M.laton, 14, lado * 0.005, 0, 0, 'x')); g.add(cil(0.0065, 0.0065, 0.002, M.cromo, 14, lado * 0.0105, 0, 0, 'x')); }
      else if (tipo === 'gancho') { g.add(cil(0.0045, 0.0045, 0.006, M.acero, 10, lado * 0.003, 0, 0, 'x')); g.add(new T.Mesh(new T.TorusGeometry(0.0035, 0.0008, 6, 14), M.cromo)).position.set(lado * 0.009, 0, 0); g.children[1].rotation.y = Math.PI / 2; }
      return g;
    }
    function construirCarrito(color, tipos) {
      const g = new T.Group();
      const sh = new T.Shape(); sh.moveTo(-0.0245, 0.008); sh.lineTo(0, 0.0495); sh.lineTo(0.0245, 0.008); sh.lineTo(0.0212, 0.008); sh.lineTo(0, 0.0445); sh.lineTo(-0.0212, 0.008); sh.lineTo(-0.0245, 0.008);
      const geo = new T.ExtrudeGeometry(sh, { depth: LEN, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-LEN / 2, 0, 0);
      const cuerpo = new T.Mesh(geo, color); cuerpo.castShadow = cuerpo.receiveShadow = true; g.add(cuerpo);
      // aletas laterales inferiores (alas) y travesaños del techo
      for (const sg of [-1, 1]) { const al = caja(LEN, 0.003, 0.006, color, 0, 0.0095, sg * 0.0229); g.add(al); }
      for (const x of [-LEN / 2 + 0.01, LEN / 2 - 0.01]) g.add(caja(0.008, 0.004, 0.012, M.acero, x, 0.0505, 0));
      g.add(bumper(tipos[1], 1)); g.add(bumper(tipos[0], -1));
      // ganchos
      const ganchos = new T.Group();
      for (const sg of [-1, 1]) { const tab = caja(0.004, 0.012, 0.003, M.cromo, sg * (LEN / 2 + 0.003), 0.0565, 0); ganchos.add(tab); const r = new T.Mesh(new T.TorusGeometry(0.0028, 0.0007, 6, 14), M.cromo); r.position.set(sg * (LEN / 2 + 0.008), Y_HOOK, 0); r.rotation.y = Math.PI / 2; ganchos.add(r); }
      g.add(ganchos);
      // bandera (se reconstruye según el ancho)
      const fl = new T.Group(); g.add(fl);
      const pesas = new T.Group(); g.add(pesas);
      g.userData = { fl, pesas, color };
      return g;
    }
    function ajustarCarrito(g, flagW, M_kg) {
      const { fl, pesas } = g.userData; limpiar(fl); limpiar(pesas);
      fl.add(caja(flagW, 0.045, 0.0016, M.negro, 0, 0.0495 + 0.0225 + 0.004, 0));
      fl.add(caja(Math.max(0.012, flagW * 0.4), 0.008, 0.012, M.negro, 0, 0.0515, 0));
      const n = Math.max(0, Math.min(14, Math.round((M_kg * 1000 - 150) / 25)));
      const slots = [-0.085, 0.085, -0.055, 0.055, -0.025, 0.025, 0];
      for (let k = 0; k < n; k++) {
        const x = slots[Math.floor(k / 2)], sg = k % 2 ? 1 : -1;
        const w = cil(0.0105, 0.0105, 0.012, M.laton, 22, x, 0.021, sg * 0.0238, 'z');
        pesas.add(w);
        pesas.add(cil(0.0035, 0.0035, 0.004, M.cromo, 10, x, 0.021, sg * 0.0308, 'z'));
      }
    }
    function construirCompuerta(i) {
      const g = new T.Group(), zi = 0.056, zc = 0.0615;
      const pt = mat({ color: '#2a3036', roughness: 0.5, metalness: 0.1 });
      g.add(caja(0.008, 0.108, 0.007, pt, 0, 0.040, zc)); g.add(caja(0.008, 0.108, 0.007, pt, 0, 0.040, -zc));
      g.add(caja(0.026, 0.018, 0.022, mat({ color: '#2b3036', roughness: 0.5 }), 0, 0.093, zc + 0.003));      // cabezal con electrónica
      g.add(caja(0.016, 0.014, 0.012, mat({ color: '#2b3036', roughness: 0.5 }), 0, 0.087, -zc));
      g.add(caja(0.034, 0.006, 0.150, M.acero, 0, -0.010, 0));                                               // abrazadera bajo el riel
            const led = new T.Mesh(new T.SphereGeometry(0.0042, 10, 8), new T.MeshBasicMaterial({ color: '#3a0e0e' })); led.position.set(0, 0.099, zc + 0.0145); g.add(led);
      const haz = new T.Mesh(new T.CylinderGeometry(0.0007, 0.0007, 2 * zi, 6), new T.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.85, depthWrite: false })); haz.rotation.x = Math.PI / 2; haz.position.set(0, 0.080, 0); g.add(haz);
      const halo = new T.Mesh(new T.CylinderGeometry(0.0028, 0.0028, 2 * zi, 8), new T.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0.18, depthWrite: false })); halo.rotation.x = Math.PI / 2; halo.position.set(0, 0.080, 0); g.add(halo);
      const hit = new T.Mesh(new T.BoxGeometry(0.05, 0.13, 0.16), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 0.04, 0); hit.userData.gate = i; g.add(hit);
      // rótulo
      const rc = lienzo(128, 64, (c, w, h) => { c.fillStyle = '#f5f6f7'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '700 44px "Saira Condensed", Arial, sans-serif'; c.textAlign = 'center'; c.fillText('G' + (i + 1), w / 2, 46); });
      const rt = new T.CanvasTexture(rc); rt.encoding = T.sRGBEncoding;
      const rot = new T.Mesh(new T.PlaneGeometry(0.02, 0.01), new T.MeshBasicMaterial({ map: rt })); rot.position.set(0, 0.0925, zc + 0.0141); g.add(rot);
      g.userData = { led, haz, halo, hit };
      return g;
    }
    const helice = (() => { const pts = [], N = 18, n = 400; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(new T.Vector3(u, 0.0105 * Math.cos(2 * Math.PI * N * u), 0.0105 * Math.sin(2 * Math.PI * N * u))); } return new T.TubeGeometry(new T.CatmullRomCurve3(pts), n, 0.00085, 5); })();
    function construirResorte() { const m = new T.Mesh(helice, M.cromo); m.castShadow = true; return m; }

    function bandera(P) { return (P.flag || 5) / 100; }
    function tiposCarrito(id, i) {
      const T_ = {
        newton: [['goma', 'gancho']], acoplados: [['goma', 'gancho'], ['gancho', 'goma']], inclinado: [['goma', 'goma']],
        choque_el: [['goma', 'iman'], ['iman', 'goma']], choque_in: [['goma', 'velcro'], ['velcro', 'goma']],
        explosion: [['goma', 'embolo'], ['embolo', 'goma']], oscilador: [['gancho', 'gancho']]
      };
      return T_[id][i];
    }
    function setMontaje(id, P) {
      estado.id = id; estado.P = P;
      limpiar(mont); limpiar(ropeG); limpiar(vecG); limpiar(hanger); limpiar(soporteCaida);
      estado.gl = []; estado.gates = []; estado.springs = []; estado.ropes = []; estado.vec = {}; estado.hangerMass = -1;
      const M_ = E.MONTAJES.find((q) => q.id === id);
      for (let i = 0; i < M_.n; i++) { const c = construirCarrito(i === 0 ? M.rojo : M.azul, tiposCarrito(id, i)); mont.add(c); estado.gl.push(c); }
      const ng = M_.ctl.filter((k) => k === 'g1' || k === 'g2').length;
      for (let i = 0; i < ng; i++) { const g = construirCompuerta(i); mont.add(g); estado.gates.push(g); }
      if (id === 'oscilador') { for (let i = 0; i < 2; i++) { const s = construirResorte(); mont.add(s); estado.springs.push(s); } for (const sg of [-1, 1]) mont.add(caja(0.006, 0.038, 0.010, M.cromo, sg * (L / 2 - 0.004), Y_HOOK - 0.01, 0)); }
      // cuerdas
      const nr = (M_.hanger ? 1 : 0) + (id === 'acoplados' ? 1 : 0);
      for (let i = 0; i < nr; i++) { const r = new T.Mesh(new T.BufferGeometry(), M.hilo); r.frustumCulled = false; ropeG.add(r); estado.ropes.push(r); }
      // masa colgante, bandeja y soporte
      if (M_.hanger) {
        const hg = new T.Group(); hanger.add(hg); estado.hg = hg;
        estado.tray = soporteCaida;
      }
      // vectores
      const mkArrow = (color) => { const a = new T.Group(); const sf = new T.Mesh(new T.CylinderGeometry(0.0035, 0.0035, 1, 10), new T.MeshBasicMaterial({ color })); sf.rotation.z = Math.PI / 2; const hd = new T.Mesh(new T.ConeGeometry(0.011, 0.03, 14), new T.MeshBasicMaterial({ color })); hd.rotation.z = -Math.PI / 2; a.add(sf, hd); a.userData = { sf, hd }; vecG.add(a); a.visible = false; return a; };
      estado.vec.v = []; estado.vec.a = []; estado.vec.l = [];
      for (let i = 0; i < M_.n; i++) { estado.vec.v.push(mkArrow('#18d6c3')); estado.vec.a.push(mkArrow('#ff9d1c')); estado.vec.l.push(etiqueta()); }
      refrescarCarritos(P);
      estado.tilt = null;
      dibujarPizarra(id);
      estado.cableKey = '';
    }
    function etiqueta() {
      const c = lienzo(256, 64, () => { }), t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
      const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(0.2, 0.05, 1); s.renderOrder = 10; s.userData = { c, t, txt: '' }; vecG.add(s); s.visible = false; return s;
    }
    function textoEtiqueta(s, txt, color) {
      if (s.userData.txt === txt) return; s.userData.txt = txt;
      const { c, t } = s.userData, g = c.getContext('2d'); g.clearRect(0, 0, 256, 64);
      g.fillStyle = 'rgba(14,18,22,.78)'; g.beginPath(); g.roundRect ? g.roundRect(2, 8, 252, 48, 10) : g.rect(2, 8, 252, 48); g.fill();
      g.fillStyle = color; g.font = '600 30px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText(txt, 128, 43); t.needsUpdate = true;
    }
    function refrescarCarritos(P) {
      const ms = estado.id === 'acoplados' ? [P.MA, P.MB] : estado.id === 'choque_el' || estado.id === 'choque_in' || estado.id === 'explosion' ? [P.M1, P.M2] : [P.M1];
      estado.gl.forEach((g, i) => ajustarCarrito(g, bandera(P), ms[i] / 1000));
      if (tex_.balanza) { tex_.balanza.image = texLCD([ms[0].toFixed(1) + ' g'], 'BALANZA'); tex_.balanza.needsUpdate = true; }
    }
    /* disco ranurado según la masa total (la percha pesa 5 g) */
    function construirPercha(mg) {
      const g = estado.hg; if (!g) return; limpiar(g);
      g.add(cil(0.034, 0.034, 0.006, M.laton, 32, 0, 0.003, 0));
      g.add(cil(0.0025, 0.0025, 0.135, M.cromo, 12, 0, 0.0735, 0));
      const aro = new T.Mesh(new T.TorusGeometry(0.006, 0.0011, 8, 16), M.cromo); aro.position.set(0, 0.145, 0); g.add(aro);
      let resto = Math.max(0, Math.round(mg) - 5), y = 0.006;
      for (const d of [50, 20, 10, 5, 2, 1]) while (resto >= d) {
        const r = 0.008 + 0.0026 * Math.sqrt(d), h = 0.003 + 0.00012 * d;
        const disco = cil(r, r, h, M.laton, 32, 0, y + h / 2, 0);
        const ranura = caja(r, h + 0.0002, 0.004, M.negro, r / 2, y + h / 2, 0); ranura.castShadow = false;
        g.add(disco); g.add(ranura);
        y += h; resto -= d;
      }
      estado.hangerMass = mg;
    }
    function dibujarPizarra(id) {
      const c = root._pizCanvas || (root._pizCanvas = null);
      const cv = lab.userData.pizCanvas, g = cv.getContext('2d'), w = cv.width, h = cv.height;
      g.fillStyle = '#f6f7f4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#16323f'; g.font = '700 64px "Saira Condensed", Arial, sans-serif';
      const M_ = E.MONTAJES.find((q) => q.id === id);
      g.fillText(M_.nombre.toUpperCase() + ' · riel de aire', 40, 82);
      g.font = '500 44px "IBM Plex Mono", monospace'; g.fillStyle = '#1b2a33';
      const ln = {
        newton: ['Σ F = m g = (M + m) a', 'a = m g / (M + m)', 'T = M a = M m g /(M + m)', 'x = x₀ + ½ a t²'],
        acoplados: ['m g = (MA + MB + m) a', 'T₁₂ = MA a', 'T₂ = m (g − a)', 'x = x₀ + ½ a t²'],
        inclinado: ['a = g sen θ', 'v² = v₀² + 2 a Δx', 'g local ≈ 9,775 m/s²', 'x = x₀ + ½ a t²'],
        choque_el: ['p = m₁v₁ + m₂v₂  se conserva', 'K = ½ m₁v₁² + ½ m₂v₂²', 'e = −(v₁′ − v₂′)/(v₁ − v₂)', 'elástico: e = 1'],
        choque_in: ['m₁v₁ = (m₁ + m₂) v′', 'ΔK = K − K′ > 0', 'e = 0', 'p se conserva, K no'],
        explosion: ['m₁v₁ + m₂v₂ = 0', 'E = ½ m₁v₁² + ½ m₂v₂²', 'v₁/v₂ = −m₂/m₁', 'p total = 0'],
        oscilador: ['M x″ = −2k x', 'T = 2π √(M / 2k)', 'x = A cos(ω t),  ω = √(2k/M)', 'v máx = ω A']
      }[id];
      ln.forEach((s, i) => g.fillText(s, 40, 170 + i * 74));
      g.fillStyle = '#8a9aa3'; g.font = '500 28px "IBM Plex Mono", monospace'; g.fillText('Departamento de Física · Universidad del Cauca', 40, h - 30);
      lab.userData.pizTex.needsUpdate = true;
    }

    /* ───────── cámara ───────── */
    const orb = { target: new T.Vector3(0.1, 0.99, 0.05), r: 2.4, th: 0.2, ph: 1.22, goal: null, follow: false };
    function aPos(o) { const sph = new T.Spherical(o.r, o.ph, o.th); return new T.Vector3().setFromSpherical(sph).add(o.target); }
    function fijarCam(pos, tgt, inmediato) {
      const off = pos.clone().sub(tgt), sph = new T.Spherical().setFromVector3(off);
      orb.goal = { target: tgt.clone(), r: sph.radius, th: sph.theta, ph: sph.phi };
      if (inmediato) { orb.target.copy(tgt); orb.r = sph.radius; orb.th = sph.theta; orb.ph = sph.phi; orb.goal = null; }
    }
    const V = (x, y, z) => new T.Vector3(x, y, z);
    function posGlider(i) { const g = estado.gl[i]; if (!g) return V(0, Y_RIEL, 0); const p = new T.Vector3(); g.getWorldPosition(p); return p; }
    function posCompuerta(i) { const g = estado.gates[i] || estado.gates[0]; if (!g) return V(0, Y_RIEL, 0); const p = new T.Vector3(); g.getWorldPosition(p); return p; }
    const PRESETS = {
      general: () => [V(0.12, 1.40, 2.05), V(0.0, 0.975, 0.02)],
      carrito: () => { const p = posGlider(0); return [p.clone().add(V(0.32, 0.20, 0.50)), p.clone().add(V(0, 0.05, 0))]; },
      compuerta: () => { const p = posCompuerta(0); return [p.clone().add(V(0.30, 0.16, 0.42)), p.clone().add(V(0, 0.07, 0))]; },
      arriba: () => [V(0.0, 2.7, 0.35), V(0.0, 0.96, 0.0)],
      lateral: () => [V(0.2, 1.05, 2.9), V(0.05, 0.99, 0.0)],
      polea: () => [V(1.7, 1.15, 1.25), V(1.02, 0.62, 0.0)],
      equipos: () => [V(0.0, 1.35, 1.65), V(-0.3, 0.95, 0.35)],
      laptop: () => [V(0.38, 1.18, 0.95), V(0.42, 1.0, 0.3)]
    };
    function irA(nombre, inmediato) {
      const f = PRESETS[nombre]; if (!f) return; orb.follow = nombre === 'carrito'; const [p, t] = f();
      if (cam.aspect < 1.4 && ['general', 'arriba', 'lateral', 'equipos', 'polea'].includes(nombre)) { const d = p.clone().sub(t); p.copy(t).addScaledVector(d, Math.min(2.4, Math.pow(1.5 / cam.aspect, 0.9))); }
      fijarCam(p, t, inmediato);
    }
    irA('general', true);

    function ponerCam() {
      if (orb.goal) {
        const k = 0.09, G = orb.goal;
        orb.target.lerp(G.target, k); orb.r += (G.r - orb.r) * k;
        let dth = G.th - orb.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); orb.th += dth * k; orb.ph += (G.ph - orb.ph) * k;
        if (orb.target.distanceTo(G.target) < 1e-3 && Math.abs(G.r - orb.r) < 1e-3 && Math.abs(dth) < 1e-3) orb.goal = null;
      }
      if (orb.follow && estado.gl[0]) { const p = posGlider(0); p.y += 0.05; orb.target.lerp(p, 0.2); orb.goal = null; }
      orb.ph = Math.max(0.08, Math.min(1.62, orb.ph)); orb.r = Math.max(0.18, Math.min(7, orb.r));
      cam.position.copy(aPos(orb)); cam.lookAt(orb.target);
    }
    // interacción
    const ptrs = new Map(); let arrastrando = null, ultimo = null, pinch = 0;
    const ray = new T.Raycaster(), mouse = new T.Vector2();
    function ndc(e) { const r = canvas.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
    function compuertaBajo(e) { ndc(e); ray.setFromCamera(mouse, cam); const hs = estado.gates.map((g) => g.userData.hit); const h = ray.intersectObjects(hs, false)[0]; return h ? h.object.userData.gate : -1; }
    function xRielDesde(e) {
      ndc(e); ray.setFromCamera(mouse, cam);
      const plano = new T.Plane(new T.Vector3(0, 1, 0), -(Y_RIEL + 0.05)), p = new T.Vector3();
      if (!ray.ray.intersectPlane(plano, p)) return null;
      return (p.x + L / 2);   // con riel nivelado, x_local + L/2 = x_sim
    }
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e); ultimo = { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey };
      const gi = ptrs.size === 1 ? compuertaBajo(e) : -1;
      if (gi >= 0) { arrastrando = gi; canvas.style.cursor = 'grabbing'; } else { orb.goal = null; orb.follow = false; if (root.RIELUI && root.RIELUI.alSoltarCamara) root.RIELUI.alSoltarCamara(); }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) { canvas.style.cursor = compuertaBajo(e) >= 0 ? 'grab' : 'default'; return; }
      ptrs.set(e.pointerId, e);
      if (arrastrando !== null) { const x = xRielDesde(e); if (x != null && sc_.onGate) sc_.onGate(arrastrando, Math.max(10, Math.min(190, x * 100))); return; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); orb.r *= pinch / (d || pinch); pinch = d; return; }
      const dx = e.clientX - ultimo.x, dy = e.clientY - ultimo.y; ultimo.x = e.clientX; ultimo.y = e.clientY;
      if (ultimo.btn === 2 || ultimo.shift || ultimo.btn === 1) {
        const k = orb.r * 0.0016, der = new T.Vector3().setFromMatrixColumn(cam.matrix, 0), arr = new T.Vector3().setFromMatrixColumn(cam.matrix, 1);
        orb.target.addScaledVector(der, -dx * k).addScaledVector(arr, dy * k);
      } else { orb.th -= dx * 0.0065; orb.ph -= dy * 0.0065; }
    });
    const fin = (e) => { ptrs.delete(e.pointerId); arrastrando = null; canvas.style.cursor = 'default'; };
    canvas.addEventListener('pointerup', fin); canvas.addEventListener('pointercancel', fin);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); orb.r *= Math.exp(e.deltaY * 0.0011); orb.goal = null; }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    /* ───────── cuerdas ───────── */
    function reemplazarTubo(mesh, curva, radio) { const g = new T.TubeGeometry(curva, 48, radio, 5, false); mesh.geometry.dispose(); mesh.geometry = g; }
    const lw = (x, y, z) => rail.localToWorld(new T.Vector3(x, y, z));
    function curvaCuerda(p0, p1, holgura, lateral) { // de un punto a otro con sag
      const pts = [], N = 14, c = p0.distanceTo(p1);
      const h = holgura > 0 ? Math.sqrt(3 * c * holgura / 8) : 0;
      for (let i = 0; i <= N; i++) { const u = i / N, p = p0.clone().lerp(p1, u), par = 4 * u * (1 - u); p.y -= Math.min(h, 0.05) * par; p.z += (lateral || 0) * Math.sin(Math.PI * u) * Math.sin(5 * u * Math.PI) * 0.6 + Math.max(0, h - 0.05) * par * 0.8; pts.push(p); }
      return pts;
    }

    /* ───────── actualización por cuadro ───────── */
    const clock = { t: 0 };
    function color(c) { return new T.Color(c); }
    function frame(sim, ideal, op, dtReal) {
      clock.t += dtReal;
      const P = estado.P, id = estado.id, th = sim.th;
      pivot.rotation.z = -th;
      const claveTilt = Math.round(th * 1e5);
      if (estado.tilt !== claveTilt) { estado.tilt = claveTilt; construirSoportes(th); pivot.updateMatrixWorld(true); armarManguera(); estado.cableKey = ''; }
      // carritos
      sim.g.forEach((q, i) => {
        const g = estado.gl[i]; if (!g) return;
        const jitter = P.blower && sim.estado === 'corriendo' ? Math.sin(clock.t * 61 + i) * 0.00006 : 0;
        g.position.set(q.x - L / 2, 0.0005 + jitter, Math.sin(clock.t * 23 + i * 2) * (P.blower ? 0.00012 : 0));
      });
      // compuertas
      sim.gates.forEach((gt, i) => {
        const g = estado.gates[i]; if (!g) return;
        g.position.set(gt.x - L / 2, 0, 0);
        const b = gt.bloq;
        g.userData.led.material.color.set(b ? '#ff3b30' : '#3a0e0e');
        g.userData.haz.material.opacity = b ? 0.0 : 0.85; g.userData.halo.material.opacity = b ? 0 : 0.18;
      });
      pivot.updateMatrixWorld(true);
      if (tex_.ledSop) tex_.ledSop.material.color.set(P.blower ? '#27d36b' : '#33150f');
      if (tex_.soplador) tex_.soplador.position.y = Y_MESA + 0.02 + (P.blower ? Math.sin(clock.t * 90) * 0.0002 : 0);
      // resortes del oscilador
      if (id === 'oscilador' && estado.springs.length) {
        const q = sim.g[0], xl = q.x - L / 2, a0 = -L / 2 + 0.002, a1 = xl - LEN / 2 - 0.012, b0 = xl + LEN / 2 + 0.012, b1 = L / 2 - 0.002;
        const sp = estado.springs;
        sp[0].position.set(a0, Y_HOOK, 0); sp[0].scale.set(Math.max(0.01, a1 - a0), 1, 1);
        sp[1].position.set(b0, Y_HOOK, 0); sp[1].scale.set(Math.max(0.01, b1 - b0), 1, 1);
      }
      // masa colgante y cuerda
      if (sim.hang && estado.hg) {
        if (estado.hangerMass !== P.m) construirPercha(P.m);
        const delta = sim.hang.delta, gp = rail.localToWorld(new T.Vector3(PUL.x + PUL.r, PUL.y, 0));
        const yHook = gp.y - 0.06 - delta, xH = gp.x, zH = gp.z;
        estado.hg.position.set(xH, yHook - 0.145, zH);
        estado.hg.rotation.y = clock.t * 0.0;
        rail.userData.rueda.rotation.z = -delta / PUL.r;
        // bandeja de espuma sobre un pedestal regulable
        const yTope = gp.y - 0.06 - sim.hang.D - 0.145 + 0.0; // base de la percha al caer
        const yr = Math.round(yTope * 1e4);
        if (estado.trayY !== yr) {
          estado.trayY = yr; limpiar(soporteCaida);
          soporteCaida.add(caja(0.2, yTope - 0.03, 0.2, M.madera, xH, (yTope - 0.03) / 2, zH));
          soporteCaida.add(caja(0.22, 0.03, 0.22, M.espuma, xH, yTope - 0.015, zH));
        }
        // cuerda: carrito → polea → percha
        const ult = sim.g[sim.g.length - 1], ptsA = [];
        const p0 = lw(ult.x - L / 2 + LEN / 2 + 0.008, Y_HOOK, 0), pTop = lw(PUL.x, PUL.y + PUL.r, 0);
        const flojo = Math.max(0, sim.hang.mode === 'landed' ? (ult.x - sim.hang.x0 - sim.hang.D) : 0);
        const camino = curvaCuerda(p0, pTop, flojo, 0);
        const arco = []; for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 - (i / 8) * Math.PI / 2; arco.push(lw(PUL.x + PUL.r * Math.cos(a), PUL.y + PUL.r * Math.sin(a), 0)); }
        const bajada = [new T.Vector3(gp.x, gp.y - 0.02, gp.z), new T.Vector3(gp.x, yHook - 0.001, gp.z)];
        const curve = new T.CatmullRomCurve3(camino.concat(arco).concat(bajada), false, 'centripetal');
        reemplazarTubo(estado.ropes[0], curve, 0.0006);
      }
      // hilo entre carritos
      if (id === 'acoplados') {
        const A = sim.g[0], B = sim.g[1], l = sim.links[0], r = estado.ropes[estado.ropes.length - 1];
        const p0 = lw(A.x - L / 2 + LEN / 2 + 0.008, Y_HOOK, 0), p1 = lw(B.x - L / 2 - LEN / 2 - 0.008, Y_HOOK, 0);
        const gap = p0.distanceTo(p1), exceso = l.taut ? 0 : Math.max(0, (sim.dist - LEN - 0.016) - (B.x - A.x - LEN - 0.016) * 0 + 0.0) * 0;
        const hol = l.taut ? 0 : Math.max(0, (sim.dist - (B.x - A.x))) + 0.03;
        reemplazarTubo(r, new T.CatmullRomCurve3(curvaCuerda(p0, p1, hol, 0), false, 'centripetal'), 0.0006);
      }
      // vectores
      const sv = op.vectorV, sa = op.vectorA;
      sim.g.forEach((q, i) => {
        const base = estado.gl[i].getWorldPosition(new T.Vector3()); base.y += 0.135;
        const fl = estado.vec.l[i], av = estado.vec.v[i], aa = estado.vec.a[i];
        const mostrar = (a, val, esc, off, col, txt) => {
          const len = Math.min(0.9, Math.abs(val) * esc);
          a.visible = len > 0.012 && sim.estado !== 'listo';
          if (!a.visible) return false;
          const s = Math.sign(val);
          a.position.set(base.x, base.y + off, base.z + (i ? 0.0 : 0));
          a.userData.sf.scale.set(1, len, 1); a.userData.sf.position.x = s * len / 2;
          a.userData.hd.position.x = s * (len + 0.015); a.userData.hd.rotation.z = -s * Math.PI / 2;
          return true;
        };
        const okV = sv ? mostrar(av, q.v, 0.22, 0, '#18d6c3') : (av.visible = false);
        const okA = sa ? mostrar(aa, sim.acc ? (sim.acc[i] || 0) : 0, 0.22, 0.04, '#ff9d1c') : (aa.visible = false);
        fl.visible = !!okV;
        if (okV) { fl.position.set(base.x + Math.sign(q.v) * (Math.min(0.9, Math.abs(q.v) * 0.22) + 0.11), base.y + 0.0, base.z); textoEtiqueta(fl, `v = ${q.v.toFixed(2).replace('.', ',')} m/s`, '#6ff0e1'); }
      });
      // partículas de aire bajo los carritos
      aire.actualizar && aire.actualizar(sim, P.blower, dtReal);
    }
    /* aire: chorros que salen de los orificios por debajo del carrito */
    {
      const N = 700, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), vida = new Float32Array(N);
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pts = new T.Points(geo, new T.PointsMaterial({ color: '#ffffff', size: 0.0042, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }));
      pts.frustumCulled = false; scene.add(pts); let ic = 0;
      for (let i = 0; i < N; i++) pos[i * 3 + 1] = -5;
      aire.actualizar = function (sim, on, dt) {
        for (let i = 0; i < N; i++) {
          if (vida[i] > 0) { vida[i] -= dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt; vel[i * 3 + 1] -= 0.4 * dt; if (vida[i] <= 0) pos[i * 3 + 1] = -5; }
        }
        if (!on) return;
        const emite = sim.estado === 'corriendo' || true;
        sim.g.forEach((q, gi) => {
          const n = Math.floor(18 * dt * 60 * 0.5);
          for (let k = 0; k < n; k++) {
            const i = (ic++) % N, lado = Math.random() < 0.5 ? -1 : 1, u = Math.random(), yy = 0.012 + u * 0.026;
            const w = rail.localToWorld(new T.Vector3(q.x - L / 2 + (Math.random() - 0.5) * (LEN - 0.02), yy, lado * 0.025 * (1 - yy / 0.042) * 1.02));
            pos[i * 3] = w.x; pos[i * 3 + 1] = w.y; pos[i * 3 + 2] = w.z;
            vel[i * 3] = q.v * 0.3 + (Math.random() - 0.5) * 0.05; vel[i * 3 + 1] = -0.06 + Math.random() * 0.05; vel[i * 3 + 2] = lado * (0.18 + Math.random() * 0.22);
            vida[i] = 0.18 + Math.random() * 0.18;
          }
        });
        geo.attributes.position.needsUpdate = true;
      };
    }

    function cableDeCompuertas() {
      const clave = estado.gates.map((g) => g.position.x.toFixed(3)).join('|') + '|' + estado.tilt;
      if (clave === estado.cableKey) return; estado.cableKey = clave;
      if (estado.cables) { for (const c of estado.cables) { equipo.remove(c); c.geometry.dispose(); } }
      estado.cables = [];
      estado.gates.forEach((g, i) => {
        const a = new T.Vector3(); g.updateWorldMatrix(true, false); a.setFromMatrixPosition(g.matrixWorld); a.y += 0.092; a.z += 0.0765;
        const b = new T.Vector3(-0.52 + 0.03 * i, Y_MESA + 0.045, 0.34);
        const cm = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a, a.clone().add(V(0.02, -0.02, 0.06)), V((a.x + b.x) / 2, Y_MESA + 0.025, 0.2 + 0.05 * i), b]), 40, 0.0016, 6), M.negro);
        cm.castShadow = true; equipo.add(cm); estado.cables.push(cm);
      });
    }

    function render(sim, ideal, op, dt) {
      frame(sim, ideal, op, dt); cableDeCompuertas(); ponerCam();
      if (tex_.laptopTex.userData && tex_.laptopTex.userData.sucia) { tex_.laptopTex.needsUpdate = true; tex_.laptopTex.userData.sucia = false; }
      R.render(scene, cam);
    }
    function redim() {
      const w = canvas.clientWidth || 800, h = canvas.clientHeight || 500;
      R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 52 : 36; cam.updateProjectionMatrix();
    }
    function lcd(lineas) { tex_.lcd.image = texLCD(lineas); tex_.lcd.needsUpdate = true; }
    const sc_ = {
      setMontaje, refrescarCarritos, irA, render, redim, lcd, onGate: null,
      laptop: () => tex_.laptopCanvas, laptopSucia: () => { tex_.laptopTex.needsUpdate = true; },
      seguir: (v) => { orb.follow = v; }, estado, renderer: R, scene, cam, orb, PRESETS
    };
    return sc_;
  }
  root.ESCENA = { crear };
})(window);
